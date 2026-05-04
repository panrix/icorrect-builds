import type {
  CustomerHistorySummary,
  DeviceCategory,
  FaultCategory,
  FlowType,
  HistoricalNote,
  MondayItem,
  StockCheckResult,
  TelegramThreadState,
} from '../../../shared/types';

export interface LookupByEmailOptions {
  email: string;
  groupIds?: string[];
}

export interface MondayCreateItemInput {
  flowType: FlowType;
  customerName: string;
  customerEmail: string;
  groupId: string;
  columnValues: Record<string, unknown>;
}

export interface MondayUpdateInput {
  itemId: string;
  columnValues: Record<string, unknown>;
}

export interface MondayUpdateNoteInput {
  itemId: string;
  text: string;
  operatorName: string;
}

export interface MondayAdapter {
  lookupByEmail(input: LookupByEmailOptions): Promise<MondayItem[]>;
  getCustomerHistory(email: string): Promise<CustomerHistorySummary>;
  createItem(input: MondayCreateItemInput): Promise<{ id: string }>;
  updateItem(input: MondayUpdateInput): Promise<void>;
  createUpdate(input: MondayUpdateNoteInput): Promise<{ id: string }>;
  listPreviousNotes(email: string, excludeItemId?: string | null): Promise<HistoricalNote[]>;
  lookupStock(
    deviceCategory: DeviceCategory | null,
    model: string,
    fault: FaultCategory | null,
  ): Promise<StockCheckResult>;
  moveItemToGroup(itemId: string, groupId: string): Promise<void>;
}

export interface IntercomContact {
  id: string;
  email: string;
  intercomLink: string | null;
}

export interface IntercomAdapter {
  findContact(email: string): Promise<IntercomContact | null>;
  createOrUpdateContact(email: string, name: string): Promise<IntercomContact>;
  sendQuoteEmail(email: string, quoteData: Record<string, unknown>): Promise<void>;
}

export interface LLMSummaryResult {
  clientSaid: string;
  whatWeFound: string;
  whatWeDid: string;
  fallback: boolean;
}

export interface LLMSummaryAdapter {
  summariseUpdates(mondayItemId: string): Promise<LLMSummaryResult>;
}

export interface TelegramSyncInput {
  intakeId: string;
  renderedText: string;
  chatId: string;
  threadId?: string | null;
  messageId?: string | null;
}

export interface TelegramAdapter {
  syncThread(input: TelegramSyncInput): Promise<TelegramThreadState>;
}
