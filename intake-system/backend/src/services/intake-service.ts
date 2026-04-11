import { randomUUID } from 'node:crypto';
import {
  CHECK_TYPES,
  type AddNotesRequest,
  type AddNotesResponse,
  type CompleteIntakeRequest,
  type CreateIntakeRequest,
  type CreateIntakeResponse,
  type CustomerLookupResponse,
  type DeclineIntakeRequest,
  type IntakeCheck,
  type IntakeSession,
  type RecordCheckRequest,
  type TodayIntakesResponse,
  type UpdateIntakeRequest,
} from '../../../shared/types';
import type { IntercomAdapter, LLMSummaryAdapter, MondayAdapter } from '../adapters/types';
import {
  GatesFailedError,
  NotFoundError,
  ValidationError,
  VersionConflictError,
} from '../lib/errors';
import type { IntakeRepository } from '../repositories/intake-repository';

const BOOKED_CLIENT_GROUP_IDS = ['new_group34198', 'new_group70029'] as const;
const ENQUIRY_GROUP_ID = 'new_group77101__1';
const WALK_IN_GROUP_ID = 'new_group70029';
const APPOINTMENT_COMPLETED_GROUP_ID = 'new_group70029';

const VALID_TRANSITIONS: Record<IntakeSession['status'], IntakeSession['status'][]> = {
  submitted: ['in_progress', 'declined', 'cancelled'],
  in_progress: ['completed', 'declined', 'cancelled'],
  completed: [],
  declined: [],
  cancelled: [],
};

export class IntakeService {
  constructor(
    private readonly repository: IntakeRepository,
    private readonly mondayAdapter: MondayAdapter,
    private readonly intercomAdapter: IntercomAdapter,
    private readonly llmSummaryAdapter: LLMSummaryAdapter,
  ) {}

  async createIntake(input: CreateIntakeRequest): Promise<{ created: boolean; response: CreateIntakeResponse }> {
    this.validateCreateRequest(input);

    const existing = await this.repository.findByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      return {
        created: false,
        response: {
          sessionId: existing.id,
          mondayItemId: existing.mondayItemId,
          mondaySyncStatus: existing.mondaySyncStatus === 'pending' ? 'failed' : existing.mondaySyncStatus,
          status: existing.status,
        },
      };
    }

    const now = new Date().toISOString();
    const session: IntakeSession = {
      id: randomUUID(),
      idempotencyKey: input.idempotencyKey,
      flowType: input.flowType,
      status: 'submitted',
      version: 1,
      customerName: input.formData.name.trim(),
      customerEmail: input.formData.email.trim(),
      customerPhone: input.formData.phone.trim() || null,
      formData: {
        ...input.formData,
        flowType: input.flowType,
      },
      mondayItemId: null,
      mondaySyncStatus: 'pending',
      claimedBy: null,
      claimedAt: null,
      checks: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.create(session);

    let mondayItemId: string | null = null;
    let mondaySyncStatus: CreateIntakeResponse['mondaySyncStatus'] = 'synced';

    try {
      const syncResult = await this.syncInitialMondayState(session);
      mondayItemId = syncResult.mondayItemId;
      mondaySyncStatus = syncResult.mondaySyncStatus;
    } catch {
      mondaySyncStatus = 'failed';
    }

    const persisted = await this.repository.update({
      ...session,
      mondayItemId,
      mondaySyncStatus,
      updatedAt: new Date().toISOString(),
    });

    return {
      created: true,
      response: {
        sessionId: persisted.id,
        mondayItemId: persisted.mondayItemId,
        mondaySyncStatus,
        status: persisted.status,
      },
    };
  }

  async lookupCustomer(email: string, groupIds?: string[]): Promise<CustomerLookupResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new ValidationError('email required');
    }

    const mondayItems = await this.mondayAdapter.lookupByEmail({
      email: normalizedEmail,
      groupIds: groupIds?.length ? groupIds : [...BOOKED_CLIENT_GROUP_IDS],
    });
    const intercomContact = await this.intercomAdapter.findContact(normalizedEmail);

    return {
      found: mondayItems.length > 0,
      mondayItems,
      isReturningCustomer: mondayItems.length > 0 || Boolean(intercomContact),
      previousRepairCount: mondayItems.length,
      intercomLink: mondayItems[0]?.intercomLink ?? intercomContact?.intercomLink ?? null,
    };
  }

  async getTodayIntakes(): Promise<TodayIntakesResponse> {
    return {
      sessions: await this.repository.listToday(),
    };
  }

  async getIntake(id: string): Promise<IntakeSession> {
    const session = await this.repository.getById(id);
    if (!session) {
      throw new NotFoundError('session not found');
    }

    if (session.mondayItemId) {
      await this.llmSummaryAdapter.summariseUpdates(session.mondayItemId);
    }

    return session;
  }

  async updateIntake(id: string, input: UpdateIntakeRequest): Promise<IntakeSession> {
    const session = await this.requireSession(id);
    this.assertExpectedVersion(session, input.version);

    if (input.status && input.status !== session.status) {
      this.assertTransition(session.status, input.status);
    }

    const nextSession: IntakeSession = {
      ...session,
      status: input.status ?? session.status,
      claimedBy: input.claimedBy ?? session.claimedBy,
      claimedAt: input.claimedBy ? new Date().toISOString() : session.claimedAt,
      customerName: input.customerName?.trim() ?? session.customerName,
      customerEmail: input.customerEmail?.trim() ?? session.customerEmail,
      customerPhone: input.customerPhone?.trim() || session.customerPhone,
      formData: {
        ...session.formData,
        ...input.formData,
      },
      version: session.version + 1,
      updatedAt: new Date().toISOString(),
    };

    if (
      nextSession.mondayItemId &&
      (
        nextSession.customerEmail !== session.customerEmail ||
        nextSession.customerPhone !== session.customerPhone ||
        nextSession.formData.deviceCategory !== session.formData.deviceCategory
      )
    ) {
      await this.mondayAdapter.updateItem({
        itemId: nextSession.mondayItemId,
        columnValues: {
          email: nextSession.customerEmail,
          phone: nextSession.customerPhone,
          deviceCategory: nextSession.formData.deviceCategory,
        },
      });
    }

    return this.repository.update(nextSession);
  }

  async addNotes(id: string, input: AddNotesRequest): Promise<AddNotesResponse> {
    if (!input.text.trim()) {
      throw new ValidationError('text required');
    }

    const session = await this.requireSession(id);
    if (!session.mondayItemId) {
      return { mondayUpdateId: `local-note-${randomUUID()}` };
    }

    const update = await this.mondayAdapter.createUpdate({
      itemId: session.mondayItemId,
      operatorName: input.operatorName,
      text: input.text,
    });

    return {
      mondayUpdateId: update.id,
    };
  }

  async completeIntake(id: string, input: CompleteIntakeRequest): Promise<IntakeSession> {
    const session = await this.requireSession(id);
    this.assertExpectedVersion(session, input.version);
    this.assertTransition(session.status, 'completed');

    const checks = await this.repository.listChecks(id);
    const passedChecks = new Set(
      checks.filter((check) => check.passed).map((check) => check.checkType),
    );
    const failedGates = CHECK_TYPES.filter((checkType) => !passedChecks.has(checkType));
    if (failedGates.length > 0) {
      throw new GatesFailedError(failedGates);
    }

    if (session.mondayItemId) {
      if (session.flowType === 'appointment') {
        await this.mondayAdapter.moveItemToGroup(session.mondayItemId, APPOINTMENT_COMPLETED_GROUP_ID);
        await this.mondayAdapter.updateItem({
          itemId: session.mondayItemId,
          columnValues: { status4: 'Received' },
        });
      }

      if (session.flowType === 'dropoff') {
        await this.mondayAdapter.updateItem({
          itemId: session.mondayItemId,
          columnValues: { status4: 'Received' },
        });
      }
    }

    return this.repository.update({
      ...session,
      status: 'completed',
      version: session.version + 1,
      claimedBy: input.operatorName,
      claimedAt: session.claimedAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async declineIntake(id: string, input: DeclineIntakeRequest): Promise<IntakeSession> {
    if (!input.reason.trim()) {
      throw new ValidationError('reason required');
    }

    const session = await this.requireSession(id);
    this.assertExpectedVersion(session, input.version);
    this.assertTransition(session.status, 'declined');

    if (session.mondayItemId) {
      await this.mondayAdapter.createUpdate({
        itemId: session.mondayItemId,
        operatorName: input.operatorName,
        text: `Declined intake: ${input.reason}`,
      });
    }

    return this.repository.update({
      ...session,
      status: 'declined',
      version: session.version + 1,
      claimedBy: input.operatorName,
      claimedAt: session.claimedAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async recordCheck(id: string, input: RecordCheckRequest): Promise<IntakeCheck> {
    return this.repository.addCheck(id, {
      checkType: input.checkType,
      passed: input.passed,
      operatorName: input.operatorName,
      notes: input.notes ?? null,
    });
  }

  private validateCreateRequest(input: CreateIntakeRequest) {
    if (!input.idempotencyKey.trim()) {
      throw new ValidationError('idempotencyKey required');
    }

    if (!input.formData) {
      throw new ValidationError('formData required');
    }

    if (!input.formData.name.trim()) {
      throw new ValidationError('name required');
    }

    if (!input.formData.email.trim()) {
      throw new ValidationError('email required');
    }

    if (input.flowType === 'dropoff' && !input.formData.phone.trim()) {
      throw new ValidationError('phone required');
    }

    if (input.formData.flowType && input.formData.flowType !== input.flowType) {
      throw new ValidationError('flowType mismatch');
    }
  }

  private async syncInitialMondayState(session: IntakeSession): Promise<{
    mondayItemId: string | null;
    mondaySyncStatus: CreateIntakeResponse['mondaySyncStatus'];
  }> {
    if (session.flowType === 'collection') {
      return {
        mondayItemId: null,
        mondaySyncStatus: 'synced',
      };
    }

    if (session.flowType === 'appointment' && session.formData.selectedBooking) {
      return {
        mondayItemId: session.formData.selectedBooking.id,
        mondaySyncStatus: 'synced',
      };
    }

    if (session.flowType === 'dropoff' || session.flowType === 'enquiry') {
      const createdItem = await this.mondayAdapter.createItem({
        flowType: session.flowType,
        customerName: session.customerName,
        customerEmail: session.customerEmail,
        groupId: session.flowType === 'dropoff' ? WALK_IN_GROUP_ID : ENQUIRY_GROUP_ID,
        columnValues: {
          customerName: session.customerName,
          customerEmail: session.customerEmail,
          deviceCategory: session.formData.deviceCategory,
          model: session.formData.model,
          fault: session.formData.fault,
        },
      });

      return {
        mondayItemId: createdItem.id,
        mondaySyncStatus: 'synced',
      };
    }

    return {
      mondayItemId: null,
      mondaySyncStatus: 'synced',
    };
  }

  private async requireSession(id: string): Promise<IntakeSession> {
    const session = await this.repository.getById(id);
    if (!session) {
      throw new NotFoundError('session not found');
    }

    return session;
  }

  private assertExpectedVersion(session: IntakeSession, expectedVersion: number) {
    if (session.version !== expectedVersion) {
      throw new VersionConflictError(session);
    }
  }

  private assertTransition(from: FlowStatus, to: FlowStatus) {
    if (!VALID_TRANSITIONS[from].includes(to)) {
      throw new ValidationError('invalid status transition');
    }
  }
}

type FlowStatus = IntakeSession['status'];
