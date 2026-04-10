import crypto from "node:crypto";
import { requestJson } from "./http.js";

export class TelegramClient {
  constructor(config) {
    this.token = config.token;
    this.chatId = config.chatId;
    this.emailsThreadId = config.emailsThreadId;
    this.baseUrl = `${config.baseUrl}/bot${config.token}`;
    this.publicBaseUrl = config.publicBaseUrl.replace(/\/$/, "");
  }

  buildEditToken(conversationId) {
    const payload = `${conversationId}:${Date.now()}`;
    const signature = crypto
      .createHmac("sha256", this.token)
      .update(payload)
      .digest("hex");
    return Buffer.from(`${payload}:${signature}`).toString("base64url");
  }

  verifyEditToken(token, conversationId) {
    if (!token) {
      return false;
    }

    try {
      const raw = Buffer.from(token, "base64url").toString("utf8");
      const [id, issuedAt, signature] = raw.split(":");
      if (id !== String(conversationId) || !issuedAt || !signature) {
        return false;
      }

      const expected = crypto
        .createHmac("sha256", this.token)
        .update(`${id}:${issuedAt}`)
        .digest("hex");

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  editUrl(conversationId) {
    const token = this.buildEditToken(conversationId);
    return `${this.publicBaseUrl}/edit?id=${encodeURIComponent(conversationId)}&token=${encodeURIComponent(token)}`;
  }

  keyboard(conversationId, options = {}) {
    const tier = options.tier || "yellow";
    const category = options.category || "";
    const rows = [];

    if (category === "complaint_warranty" || tier === "red") {
      rows.push([
        { text: "⚠️ Escalate", callback_data: `escalate:${conversationId}` },
        { text: "💤 Snooze", callback_data: `snooze:${conversationId}` }
      ]);
      return { inline_keyboard: rows };
    }

    if (category === "quote_followup") {
      rows.push([
        { text: "✏️ Edit", url: this.editUrl(conversationId) },
        { text: "⚠️ Escalate", callback_data: `escalate:${conversationId}` }
      ]);
      rows.push([
        { text: "💤 Snooze", callback_data: `snooze:${conversationId}` }
      ]);
      return { inline_keyboard: rows };
    }

    if (category === "corporate_account") {
      rows.push([
        { text: "✏️ Edit", url: this.editUrl(conversationId) },
        { text: "⚠️ Escalate", callback_data: `escalate:${conversationId}` }
      ]);
      rows.push([
        { text: "💤 Snooze", callback_data: `snooze:${conversationId}` }
      ]);
      return { inline_keyboard: rows };
    }

    if (category === "active_repair" && tier === "green") {
      rows.push([
        { text: "✅ Approve", callback_data: `approve:${conversationId}` },
        { text: "✏️ Edit", url: this.editUrl(conversationId) }
      ]);
      rows.push([
        { text: "⚠️ Escalate", callback_data: `escalate:${conversationId}` },
        { text: "💤 Snooze", callback_data: `snooze:${conversationId}` }
      ]);
      return { inline_keyboard: rows };
    }

    rows.push([
      { text: "✅ Approve", callback_data: `approve:${conversationId}` },
      { text: "✏️ Edit", url: this.editUrl(conversationId) }
    ]);
    rows.push([
      { text: "⚠️ Escalate", callback_data: `escalate:${conversationId}` },
      { text: "💤 Snooze", callback_data: `snooze:${conversationId}` }
    ]);

    return { inline_keyboard: rows };
  }

  async call(method, payload) {
    return requestJson(`${this.baseUrl}/${method}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  }

  async sendCard({ text, conversationId, card }) {
    const payload = {
      chat_id: this.chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: this.keyboard(conversationId, { tier: card?.confidence?.tier, category: card?.type })
    };

    if (this.emailsThreadId) {
      payload.message_thread_id = this.emailsThreadId;
    }

    return this.call("sendMessage", payload);
  }

  async sendEmailTriageCard({ text, conversationId, card }) {
    if (card?.card_kind === "quote") {
      throw new Error("Quote cards are blocked from email triage routing");
    }
    return this.sendCard({ text, conversationId, card });
  }

  async editCard({ chatId, messageId, text, conversationId, card }) {
    return this.call("editMessageText", {
      chat_id: chatId,
      message_id: Number(messageId),
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: this.keyboard(conversationId, { tier: card?.confidence?.tier, category: card?.type })
    });
  }

  async editCardStatus({ chatId, messageId, text }) {
    return this.call("editMessageText", {
      chat_id: chatId,
      message_id: Number(messageId),
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    });
  }

  async getUpdates(offset) {
    return requestJson(`${this.baseUrl}/getUpdates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        offset,
        timeout: 30,
        allowed_updates: ["callback_query"]
      }),
      timeoutMs: 40000
    });
  }

  async answerCallbackQuery(callbackQueryId, text, options = {}) {
    return this.call("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      text,
      show_alert: options.showAlert || false
    });
  }

  async sendMessage(payload) {
    return this.call("sendMessage", payload);
  }

  async deleteMessage(chatId, messageId) {
    return this.call("deleteMessage", {
      chat_id: chatId,
      message_id: Number(messageId)
    });
  }
}
