import { randomUUID } from 'node:crypto';
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
} from './types';
import type { MondayItem } from '../../../shared/types';

export class MockMondayAdapter implements MondayAdapter {
  async lookupByEmail(_input: LookupByEmailOptions): Promise<MondayItem[]> {
    return [];
  }

  async createItem(_input: MondayCreateItemInput): Promise<{ id: string }> {
    return { id: `mock-item-${randomUUID()}` };
  }

  async updateItem(_input: MondayUpdateInput): Promise<void> {
    return;
  }

  async createUpdate(_input: MondayUpdateNoteInput): Promise<{ id: string }> {
    return { id: `mock-update-${randomUUID()}` };
  }

  async moveItemToGroup(_itemId: string, _groupId: string): Promise<void> {
    return;
  }
}

export class MockIntercomAdapter implements IntercomAdapter {
  async findContact(_email: string): Promise<IntercomContact | null> {
    return null;
  }

  async createOrUpdateContact(email: string, _name: string): Promise<IntercomContact> {
    return {
      id: `mock-contact-${randomUUID()}`,
      email,
      intercomLink: null,
    };
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
