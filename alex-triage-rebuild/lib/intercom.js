import { requestJson } from "./http.js";

export class IntercomClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.token = config.token;
    this.adminId = config.adminId;
  }

  headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
      "Content-Type": "application/json"
    };
  }

  async listOpenConversations(options = {}) {
    const updatedSince = options.updatedSince ? Date.parse(options.updatedSince) : null;
    const maxItems = options.maxItems ?? null;
    const conversations = [];
    let startingAfter = null;

    while (true) {
      const url = new URL(`${this.baseUrl}/conversations`);
      url.searchParams.set("state", "open");
      url.searchParams.set("per_page", "150");
      if (startingAfter) {
        url.searchParams.set("starting_after", startingAfter);
      }

      const payload = await requestJson(url.toString(), {
        headers: this.headers()
      });

      const pageItems = payload.conversations || [];
      const filteredItems = updatedSince
        ? pageItems.filter((conversation) => {
            const updatedAt = Number(conversation.updated_at || conversation.updatedAt || 0) * 1000;
            return updatedAt > updatedSince;
          })
        : pageItems;

      conversations.push(...filteredItems);

      if (maxItems && conversations.length >= maxItems) {
        return conversations.slice(0, maxItems);
      }

      const pages = payload.pages || {};
      const next = pages.next;
      if (!next?.starting_after) {
        break;
      }

      if (updatedSince && pageItems.length) {
        const oldestUpdatedAt =
          Math.min(
            ...pageItems.map((conversation) => Number(conversation.updated_at || conversation.updatedAt || 0))
          ) * 1000;

        if (oldestUpdatedAt && oldestUpdatedAt <= updatedSince) {
          break;
        }
      }

      startingAfter = next.starting_after;
    }

    return conversations;
  }

  async getConversation(conversationId) {
    return requestJson(`${this.baseUrl}/conversations/${conversationId}`, {
      headers: this.headers()
    });
  }

  async sendReply(conversationId, body) {
    return requestJson(`${this.baseUrl}/conversations/${conversationId}/reply`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        message_type: "comment",
        type: "admin",
        admin_id: this.adminId,
        body
      })
    });
  }

  async addNote(conversationId, body) {
    return requestJson(`${this.baseUrl}/conversations/${conversationId}/reply`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        message_type: "note",
        type: "admin",
        admin_id: this.adminId,
        body
      })
    });
  }

  async addTag(conversationId, tagId) {
    if (!tagId) {
      return null;
    }

    return requestJson(`${this.baseUrl}/conversations/${conversationId}/tags`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ id: tagId })
    });
  }
}
