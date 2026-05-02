import type { TelegramThreadState } from '../../../shared/types';
import type { TelegramAdapter, TelegramSyncInput } from './types';

interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

interface TelegramMessageResult {
  message_id: number;
  message_thread_id?: number;
}

export class TelegramApiAdapter implements TelegramAdapter {
  private readonly baseUrl: string;

  constructor(token: string) {
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async syncThread(input: TelegramSyncInput): Promise<TelegramThreadState> {
    const result = input.messageId
      ? await this.editMessage(input)
      : await this.sendMessage(input);

    return {
      chatId: input.chatId,
      threadId:
        result.message_thread_id !== undefined
          ? String(result.message_thread_id)
          : input.threadId ?? null,
      messageId: String(result.message_id),
      syncedAt: new Date().toISOString(),
      lastRenderedText: input.renderedText,
    };
  }

  private async sendMessage(input: TelegramSyncInput): Promise<TelegramMessageResult> {
    const payload: Record<string, string | number | boolean> = {
      chat_id: input.chatId,
      text: input.renderedText,
      disable_web_page_preview: true,
    };

    if (input.threadId) {
      payload.message_thread_id = Number(input.threadId);
    }

    return this.call<TelegramMessageResult>('sendMessage', payload);
  }

  private async editMessage(input: TelegramSyncInput): Promise<TelegramMessageResult> {
    const payload: Record<string, string | number | boolean> = {
      chat_id: input.chatId,
      message_id: Number(input.messageId),
      text: input.renderedText,
      disable_web_page_preview: true,
    };

    return this.call<TelegramMessageResult>('editMessageText', payload);
  }

  private async call<T>(method: string, payload: Record<string, string | number | boolean>) {
    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const rawBody = await response.text();
    let body: TelegramApiResponse<T> | null = null;

    try {
      body = JSON.parse(rawBody) as TelegramApiResponse<T>;
    } catch {
      body = null;
    }

    if (!response.ok) {
      throw new Error(
        `Telegram ${method} failed with HTTP ${response.status}: ${body?.description ?? rawBody}`,
      );
    }

    if (!body) {
      throw new Error(`Telegram ${method} returned a non-JSON response`);
    }

    if (!body.ok || !body.result) {
      throw new Error(
        `Telegram ${method} failed: ${body.description ?? body.error_code ?? 'unknown error'}`,
      );
    }

    return body.result;
  }
}
