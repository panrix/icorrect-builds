import { randomUUID } from 'node:crypto';
import {
  CHECK_TYPES,
  INITIAL_TELEGRAM_OPERATOR_DATA,
  INITIAL_TELEGRAM_THREAD_STATE,
  type AddNotesRequest,
  type AddNotesResponse,
  type CheckType,
  type CompleteIntakeRequest,
  type CreateIntakeRequest,
  type CreateIntakeResponse,
  type CustomerLookupResponse,
  type DeclineIntakeRequest,
  type IntakeCheck,
  type IntakeSession,
  type RecordCheckRequest,
  type TelegramFieldCaptureRequest,
  type TelegramModelChangeRequest,
  type TelegramPasscodeRequest,
  type TelegramPreviousNotesResponse,
  type TelegramStockCheckRequest,
  type TelegramSyncRequest,
  type TelegramThreadSummary,
  type TelegramTurnaroundRequest,
  type TodayIntakesResponse,
  type UpdateIntakeRequest,
} from '../../../shared/types';
import type {
  IntercomAdapter,
  LLMSummaryAdapter,
  MondayAdapter,
  TelegramAdapter,
} from '../adapters/types';
import {
  buildTelegramThreadSummary,
  getMissingFields,
  getModelOptions,
} from '../lib/telegram-intake';
import {
  GatesFailedError,
  NotFoundError,
  ValidationError,
  VersionConflictError,
} from '../lib/errors';
import type { IntakeRepository } from '../repositories/intake-repository';

const BOOKED_CLIENT_GROUP_IDS = ['new_group34198', 'new_group70029'] as const;
const COLLECTION_GROUP_IDS = ['new_group34086', 'group_mkwkapa6'] as const;
const ENQUIRY_GROUP_ID = 'new_group77101__1';
const WALK_IN_GROUP_ID = 'new_group70029';
const APPOINTMENT_COMPLETED_GROUP_ID = 'new_group70029';

const VALID_TRANSITIONS: Record<IntakeSession['status'], IntakeSession['status'][]> = {
  submitted: ['in_progress', 'completed', 'declined', 'cancelled'],
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
    private readonly telegramAdapter: TelegramAdapter,
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
      operatorData: structuredClone(INITIAL_TELEGRAM_OPERATOR_DATA),
      telegramThread: structuredClone(INITIAL_TELEGRAM_THREAD_STATE),
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
    const session = await this.requireSession(id);

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
        nextSession.formData.deviceCategory !== session.formData.deviceCategory ||
        nextSession.formData.model !== session.formData.model
      )
    ) {
      await this.mondayAdapter.updateItem({
        itemId: nextSession.mondayItemId,
        columnValues: {
          email: nextSession.customerEmail,
          phone: nextSession.customerPhone,
          deviceCategory: nextSession.formData.deviceCategory,
          model: nextSession.formData.model,
        },
      });
    }

    const updated = await this.repository.update(nextSession);
    return this.refreshThreadIfConfigured(updated);
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

    const missingFields = getMissingFields(session);
    const passedChecks = await this.getPassedChecks(id, missingFields);
    const requiredChecks = this.getRequiredChecks(session.flowType);
    const failedGates = requiredChecks.filter((checkType) => !passedChecks.has(checkType));

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

    const updated = await this.repository.update({
      ...session,
      status: 'completed',
      version: session.version + 1,
      claimedBy: input.operatorName,
      claimedAt: session.claimedAt ?? new Date().toISOString(),
      operatorData: {
        ...session.operatorData,
        acceptedAt: session.operatorData.acceptedAt ?? new Date().toISOString(),
        acceptedBy: input.operatorName,
      },
      updatedAt: new Date().toISOString(),
    });

    return this.refreshThreadIfConfigured(updated);
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

    const updated = await this.repository.update({
      ...session,
      status: 'declined',
      version: session.version + 1,
      claimedBy: input.operatorName,
      claimedAt: session.claimedAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return this.refreshThreadIfConfigured(updated);
  }

  async recordCheck(id: string, input: RecordCheckRequest): Promise<IntakeCheck> {
    return this.repository.addCheck(id, {
      checkType: input.checkType,
      passed: input.passed,
      operatorName: input.operatorName,
      notes: input.notes ?? null,
    });
  }

  async getTelegramThread(id: string): Promise<TelegramThreadSummary> {
    const session = await this.requireSession(id);
    return this.buildThreadSummary(session);
  }

  async syncTelegramThread(id: string, input: TelegramSyncRequest): Promise<TelegramThreadSummary> {
    if (!input.chatId.trim()) {
      throw new ValidationError('chatId required');
    }

    const session = await this.requireSession(id);
    const summary = await this.buildThreadSummary(session);
    const thread = await this.telegramAdapter.syncThread({
      intakeId: session.id,
      renderedText: summary.renderedText,
      chatId: input.chatId,
      threadId: input.threadId ?? session.telegramThread.threadId,
      messageId: input.messageId ?? session.telegramThread.messageId,
    });

    const updated = await this.repository.update({
      ...session,
      telegramThread: thread,
      updatedAt: new Date().toISOString(),
    });

    return this.buildThreadSummary(updated);
  }

  async captureTelegramField(id: string, input: TelegramFieldCaptureRequest): Promise<TelegramThreadSummary> {
    const session = await this.requireSession(id);
    const nextOperatorData = { ...session.operatorData };

    switch (input.field) {
      case 'phone':
        session.customerPhone = this.requireStringValue(input.value, 'phone');
        break;
      case 'model':
        nextOperatorData.confirmedModel = this.requireStringValue(input.value, 'model');
        break;
      case 'fault_description':
        session.formData.faultDescription = this.requireStringValue(input.value, 'fault description');
        break;
      case 'repaired_before':
        nextOperatorData.repairedBefore = this.requireBooleanValue(input.value, 'repairedBefore');
        break;
      case 'repaired_before_details':
        nextOperatorData.repairedBeforeDetails = this.requireStringValue(input.value, 'repairedBeforeDetails');
        break;
      case 'apple_seen':
        nextOperatorData.appleSeen = this.requireBooleanValue(input.value, 'appleSeen');
        break;
      case 'apple_seen_details':
        nextOperatorData.appleSeenDetails = this.requireStringValue(input.value, 'appleSeenDetails');
        break;
      case 'purchase_condition':
        nextOperatorData.purchaseCondition = this.requireStringValue(input.value, 'purchaseCondition') as typeof nextOperatorData.purchaseCondition;
        break;
      case 'other_issues':
        nextOperatorData.otherIssues = this.requireStringValue(input.value, 'otherIssues');
        break;
      case 'data_backed_up':
        nextOperatorData.dataBackedUp = this.requireStringValue(input.value, 'dataBackedUp') as typeof nextOperatorData.dataBackedUp;
        break;
      case 'data_importance':
        nextOperatorData.dataImportance = this.requireStringValue(input.value, 'dataImportance') as typeof nextOperatorData.dataImportance;
        break;
      case 'software_update_permission':
        nextOperatorData.softwareUpdatePermission = this.requireStringValue(input.value, 'softwareUpdatePermission') as typeof nextOperatorData.softwareUpdatePermission;
        break;
      case 'delivery_preference':
        nextOperatorData.deliveryPreference = this.requireStringValue(input.value, 'deliveryPreference') as typeof nextOperatorData.deliveryPreference;
        break;
      default:
        throw new ValidationError(`field ${input.field} must be handled by a dedicated action`);
    }

    const updated = await this.repository.update({
      ...session,
      operatorData: nextOperatorData,
      version: session.version + 1,
      updatedAt: new Date().toISOString(),
    });

    if (updated.mondayItemId && input.field === 'phone' && updated.customerPhone) {
      await this.mondayAdapter.updateItem({
        itemId: updated.mondayItemId,
        columnValues: { phone: updated.customerPhone },
      });
    }

    return this.refreshThreadSummary(updated);
  }

  async changeTelegramModel(id: string, input: TelegramModelChangeRequest): Promise<TelegramThreadSummary> {
    const session = await this.requireSession(id);
    const allowedModels = getModelOptions(session.formData.deviceCategory, '');
    if (!allowedModels.includes(input.model)) {
      throw new ValidationError('model is not in the pricing catalog');
    }

    const updated = await this.repository.update({
      ...session,
      operatorData: {
        ...session.operatorData,
        confirmedModel: input.model,
      },
      version: session.version + 1,
      updatedAt: new Date().toISOString(),
    });

    if (updated.mondayItemId) {
      await this.mondayAdapter.updateItem({
        itemId: updated.mondayItemId,
        columnValues: { model: input.model },
      });
      await this.mondayAdapter.createUpdate({
        itemId: updated.mondayItemId,
        operatorName: input.operatorName,
        text: `Model corrected in Telegram intake: ${input.model}`,
      });
    }

    return this.refreshThreadSummary(updated);
  }

  async searchTelegramModels(id: string, query: string): Promise<string[]> {
    const session = await this.requireSession(id);
    return getModelOptions(session.formData.deviceCategory, query);
  }

  async captureTelegramPasscode(id: string, input: TelegramPasscodeRequest): Promise<TelegramThreadSummary> {
    if (!input.passcode.trim()) {
      throw new ValidationError('passcode required');
    }

    const session = await this.requireSession(id);
    const updated = await this.repository.update({
      ...session,
      operatorData: {
        ...session.operatorData,
        passcode: input.passcode.trim(),
        passcodePassword: input.password?.trim() ?? session.operatorData.passcodePassword,
        passcodeVerificationStatus: input.verificationStatus,
        passcodeVerificationNotes: input.notes?.trim() ?? '',
      },
      version: session.version + 1,
      updatedAt: new Date().toISOString(),
    });

    if (updated.mondayItemId) {
      await this.mondayAdapter.updateItem({
        itemId: updated.mondayItemId,
        columnValues: {
          text8: input.passcode.trim(),
          passcodePassword: input.password?.trim() ?? '',
        },
      });
    }

    await this.repository.addCheck(id, {
      checkType: 'passcode_verified',
      passed: input.verificationStatus === 'tested' || input.verificationStatus === 'recorded',
      operatorName: input.operatorName,
      notes: input.notes?.trim() ?? `Passcode captured via Telegram (${input.verificationStatus})`,
    });

    return this.refreshThreadSummary(updated);
  }

  async checkTelegramStock(id: string, input: TelegramStockCheckRequest): Promise<TelegramThreadSummary> {
    const session = await this.requireSession(id);
    const model = session.operatorData.confirmedModel || session.formData.model;
    const stockCheck = await this.mondayAdapter.lookupStock(
      session.formData.deviceCategory,
      model,
      session.formData.fault,
    );

    const updated = await this.repository.update({
      ...session,
      operatorData: {
        ...session.operatorData,
        stockCheck: {
          ...stockCheck,
          notes: input.notes?.trim() || stockCheck.notes,
        },
      },
      version: session.version + 1,
      updatedAt: new Date().toISOString(),
    });

    await this.repository.addCheck(id, {
      checkType: 'parts_available',
      passed: stockCheck.status === 'in_stock' || stockCheck.status === 'order_required',
      operatorName: input.operatorName,
      notes: input.notes?.trim() ?? stockCheck.notes,
    });

    if (updated.mondayItemId) {
      await this.mondayAdapter.createUpdate({
        itemId: updated.mondayItemId,
        operatorName: input.operatorName,
        text: `Stock check: ${stockCheck.status}${stockCheck.eta ? ` (ETA: ${stockCheck.eta})` : ''}`,
      });
    }

    return this.refreshThreadSummary(updated);
  }

  async confirmTelegramTurnaround(id: string, input: TelegramTurnaroundRequest): Promise<TelegramThreadSummary> {
    const session = await this.requireSession(id);
    const updated = await this.repository.update({
      ...session,
      operatorData: {
        ...session.operatorData,
        turnaroundConfirmationStatus: input.status,
        turnaroundConfirmationNotes: input.notes?.trim() ?? '',
      },
      version: session.version + 1,
      updatedAt: new Date().toISOString(),
    });

    await this.repository.addCheck(id, {
      checkType: 'turnaround_confirmed',
      passed: true,
      operatorName: input.operatorName,
      notes: input.notes?.trim() ?? `Turnaround ${input.status}`,
    });

    if (updated.mondayItemId) {
      await this.mondayAdapter.createUpdate({
        itemId: updated.mondayItemId,
        operatorName: input.operatorName,
        text: `Turnaround confirmed via Telegram: ${input.status}${input.notes ? ` (${input.notes})` : ''}`,
      });
    }

    return this.refreshThreadSummary(updated);
  }

  async addTelegramNote(id: string, input: AddNotesRequest): Promise<TelegramThreadSummary> {
    await this.addNotes(id, input);
    const session = await this.requireSession(id);
    return this.refreshThreadSummary(session);
  }

  async getTelegramPreviousNotes(id: string): Promise<TelegramPreviousNotesResponse> {
    const session = await this.requireSession(id);
    return {
      notes: await this.mondayAdapter.listPreviousNotes(session.customerEmail, session.mondayItemId),
    };
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
      const matches = await this.mondayAdapter.lookupByEmail({
        email: session.customerEmail,
        groupIds: [...COLLECTION_GROUP_IDS],
      });

      return {
        mondayItemId: matches[0]?.id ?? null,
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
          phone: session.customerPhone,
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

  private async buildThreadSummary(session: IntakeSession): Promise<TelegramThreadSummary> {
    const history = await this.mondayAdapter.getCustomerHistory(session.customerEmail);
    return buildTelegramThreadSummary(session, history);
  }

  private async refreshThreadIfConfigured(session: IntakeSession): Promise<IntakeSession> {
    if (!session.telegramThread.chatId) {
      return session;
    }

    const summary = await this.buildThreadSummary(session);
    const thread = await this.telegramAdapter.syncThread({
      intakeId: session.id,
      renderedText: summary.renderedText,
      chatId: session.telegramThread.chatId,
      threadId: session.telegramThread.threadId,
      messageId: session.telegramThread.messageId,
    });

    return this.repository.update({
      ...session,
      telegramThread: thread,
      updatedAt: new Date().toISOString(),
    });
  }

  private async refreshThreadSummary(session: IntakeSession): Promise<TelegramThreadSummary> {
    const refreshedSession = await this.refreshThreadIfConfigured(session);
    return this.buildThreadSummary(refreshedSession);
  }

  private async getPassedChecks(
    id: string,
    missingFields: ReturnType<typeof getMissingFields>,
  ): Promise<Set<CheckType>> {
    const checks = await this.repository.listChecks(id);
    const passedChecks = new Set(
      checks.filter((check) => check.passed).map((check) => check.checkType),
    );

    if (missingFields.length === 0) {
      passedChecks.add('fields_complete');
    }

    return passedChecks;
  }

  private getRequiredChecks(flowType: IntakeSession['flowType']): CheckType[] {
    if (flowType === 'dropoff' || flowType === 'appointment') {
      return [...CHECK_TYPES];
    }

    return ['fields_complete'];
  }

  private requireStringValue(value: string | boolean, fieldName: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new ValidationError(`${fieldName} must be a non-empty string`);
    }
    return value.trim();
  }

  private requireBooleanValue(value: string | boolean, fieldName: string): boolean {
    if (typeof value !== 'boolean') {
      throw new ValidationError(`${fieldName} must be a boolean`);
    }
    return value;
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
