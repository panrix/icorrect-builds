import { randomUUID } from 'node:crypto';
import type {
  CustomerHistorySummary,
  DeviceCategory,
  FaultCategory,
  HistoricalNote,
  MondayItem,
  StockCheckResult,
  TelegramThreadState,
} from '../../../shared/types';
import type {
  IntercomAdapter,
  IntercomContact,
  LLMSummaryAdapter,
  LLMSummaryResult,
  LookupByEmailOptions,
  MondayAdapter,
  MondayCreateItemInput,
  MondayUpdateInput,
  MondayUpdateNoteInput,
  TelegramAdapter,
  TelegramSyncInput,
} from './types';

interface MockMondayItemRecord extends MondayItem {
  customerEmail: string | null;
  customerPhone: string | null;
}

export class MockMondayAdapter implements MondayAdapter {
  private readonly items = new Map<string, MockMondayItemRecord>();
  private readonly notes = new Map<string, HistoricalNote[]>();

  seedItem(item: Partial<MockMondayItemRecord> & Pick<MockMondayItemRecord, 'customerEmail'>) {
    const seeded: MockMondayItemRecord = {
      id: item.id ?? `mock-item-${randomUUID()}`,
      name: item.name ?? 'Seeded Customer',
      device: item.device ?? 'iPhone',
      service: item.service ?? 'Screen',
      status: item.status ?? 'Submitted',
      group: item.group ?? { id: 'new_group70029', title: "Today's Repairs" },
      bookingDate: item.bookingDate ?? null,
      intercomLink: item.intercomLink ?? null,
      customerEmail: item.customerEmail,
      customerPhone: item.customerPhone ?? null,
      lastUpdateAt: item.lastUpdateAt ?? null,
    };

    this.items.set(seeded.id, seeded);
    if (!this.notes.has(seeded.id)) {
      this.notes.set(seeded.id, []);
    }

    return seeded;
  }

  async lookupByEmail(input: LookupByEmailOptions): Promise<MondayItem[]> {
    const target = input.email.trim().toLowerCase();
    const allowedGroupIds = input.groupIds?.length ? new Set(input.groupIds) : null;

    return Array.from(this.items.values())
      .filter((item) => item.customerEmail?.trim().toLowerCase() === target)
      .filter((item) => (allowedGroupIds ? allowedGroupIds.has(item.group.id) : true))
      .map((item) => ({ ...item }));
  }

  async getCustomerHistory(email: string): Promise<CustomerHistorySummary> {
    const repairs = Array.from(this.items.values())
      .filter((item) => item.customerEmail?.trim().toLowerCase() === email.trim().toLowerCase())
      .sort((left, right) => (right.bookingDate ?? '').localeCompare(left.bookingDate ?? ''))
      .map((item) => ({
        itemId: item.id,
        device: item.device,
        service: item.service,
        status: item.status,
        date: item.bookingDate,
      }));

    return {
      isReturningCustomer: repairs.length > 0,
      previousRepairCount: repairs.length,
      repairs: repairs.slice(0, 3).map((repair) => ({
        ...repair,
        lastUpdatedAt: this.items.get(repair.itemId)?.lastUpdateAt ?? null,
        lastNote: (this.notes.get(repair.itemId) ?? []).at(-1)?.text ?? null,
      })),
      intercomLink: Array.from(this.items.values()).find(
        (item) => item.customerEmail?.trim().toLowerCase() === email.trim().toLowerCase(),
      )?.intercomLink ?? null,
    };
  }

  async createItem(input: MondayCreateItemInput): Promise<{ id: string }> {
    const id = `mock-item-${randomUUID()}`;
    const record: MockMondayItemRecord = {
      id,
      name: input.customerName,
      device: String(input.columnValues.deviceCategory ?? 'Unknown'),
      service: String(input.columnValues.fault ?? input.flowType),
      status: 'Submitted',
      group: { id: input.groupId, title: input.groupId },
      bookingDate: new Date().toISOString(),
      intercomLink: null,
      customerEmail: input.customerEmail,
      customerPhone: String(input.columnValues.phone ?? '') || null,
      lastUpdateAt: null,
    };

    this.items.set(id, record);
    this.notes.set(id, []);
    return { id };
  }

  async updateItem(input: MondayUpdateInput): Promise<void> {
    const existing = this.items.get(input.itemId);
    if (!existing) {
      return;
    }

    if (typeof input.columnValues.email === 'string') {
      existing.customerEmail = input.columnValues.email;
    }

    if (typeof input.columnValues.phone === 'string') {
      existing.customerPhone = input.columnValues.phone;
    }

    if (typeof input.columnValues.model === 'string') {
      existing.device = input.columnValues.model;
    }

    if (typeof input.columnValues.deviceCategory === 'string' && !input.columnValues.model) {
      existing.device = input.columnValues.deviceCategory;
    }

    if (typeof input.columnValues.fault === 'string') {
      existing.service = input.columnValues.fault;
    }

    if (typeof input.columnValues.status4 === 'string') {
      existing.status = input.columnValues.status4;
    }

    existing.lastUpdateAt = new Date().toISOString();
  }

  async createUpdate(input: MondayUpdateNoteInput): Promise<{ id: string }> {
    const note: HistoricalNote = {
      id: `mock-update-${randomUUID()}`,
      itemId: input.itemId,
      author: input.operatorName,
      text: input.text,
      createdAt: new Date().toISOString(),
    };

    const existing = this.notes.get(input.itemId) ?? [];
    existing.push(note);
    this.notes.set(input.itemId, existing);

    const item = this.items.get(input.itemId);
    if (item) {
      item.lastUpdateAt = note.createdAt;
    }

    return { id: note.id };
  }

  async listPreviousNotes(email: string, excludeItemId?: string | null): Promise<HistoricalNote[]> {
    const targetIds = Array.from(this.items.values())
      .filter((item) => item.customerEmail?.trim().toLowerCase() === email.trim().toLowerCase())
      .filter((item) => (excludeItemId ? item.id !== excludeItemId : true))
      .map((item) => item.id);

    return targetIds
      .flatMap((itemId) => this.notes.get(itemId) ?? [])
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 5)
      .map((note) => ({ ...note }));
  }

  async lookupStock(
    deviceCategory: DeviceCategory | null,
    model: string,
    fault: FaultCategory | null,
  ): Promise<StockCheckResult> {
    if (!deviceCategory || !model || !fault) {
      return {
        status: 'manual_review',
        partLabel: null,
        quantity: null,
        eta: null,
        notes: 'Not enough device details to run stock lookup.',
      };
    }

    const partLabel = `${model} ${fault}`;

    if (fault === 'Diagnostic') {
      return {
        status: 'manual_review',
        partLabel,
        quantity: null,
        eta: null,
        notes: 'Diagnostic jobs require manual stock review.',
      };
    }

    if (model.toLowerCase().includes('m4')) {
      return {
        status: 'order_required',
        partLabel,
        quantity: 0,
        eta: '3-5 working days',
        notes: 'Part is not in mock stock.',
      };
    }

    return {
      status: 'in_stock',
      partLabel,
      quantity: 2,
      eta: null,
      notes: 'Part is available in mock stock.',
    };
  }

  async moveItemToGroup(itemId: string, groupId: string): Promise<void> {
    const item = this.items.get(itemId);
    if (!item) {
      return;
    }

    item.group = { id: groupId, title: groupId };
    item.lastUpdateAt = new Date().toISOString();
  }
}

export class MockIntercomAdapter implements IntercomAdapter {
  private readonly contacts = new Map<string, IntercomContact>();

  async findContact(email: string): Promise<IntercomContact | null> {
    return this.contacts.get(email.trim().toLowerCase()) ?? null;
  }

  async createOrUpdateContact(email: string, _name: string): Promise<IntercomContact> {
    const normalizedEmail = email.trim().toLowerCase();
    const contact: IntercomContact = {
      id: `mock-contact-${randomUUID()}`,
      email: normalizedEmail,
      intercomLink: `https://app.intercom.com/a/inbox/mock/contact/${normalizedEmail}`,
    };
    this.contacts.set(normalizedEmail, contact);
    return contact;
  }

  async sendQuoteEmail(_email: string, _quoteData: Record<string, unknown>): Promise<void> {
    return;
  }
}

export class MockLLMSummaryAdapter implements LLMSummaryAdapter {
  async summariseUpdates(_mondayItemId: string): Promise<LLMSummaryResult> {
    return {
      clientSaid: 'N/A',
      whatWeFound: 'N/A',
      whatWeDid: 'N/A',
      fallback: false,
    };
  }
}

export class MockTelegramAdapter implements TelegramAdapter {
  async syncThread(input: TelegramSyncInput): Promise<TelegramThreadState> {
    return {
      chatId: input.chatId,
      threadId: input.threadId ?? `mock-thread-${input.intakeId}`,
      messageId: input.messageId ?? `mock-message-${randomUUID()}`,
      syncedAt: new Date().toISOString(),
      lastRenderedText: input.renderedText,
    };
  }
}
