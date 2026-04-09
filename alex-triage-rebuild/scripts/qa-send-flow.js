import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { applyDraftEdit, handleTelegramCallback, repostDueSnoozes } from "../lib/bot-actions.js";
import { getConversation, getDueSnoozes, getSnooze, initializeDb, upsertConversation } from "../lib/db.js";
import { TelegramClient } from "../lib/telegram.js";

const ROOT = "/home/ricky/builds/alex-triage-rebuild";
const RUN_DATE = new Date().toISOString().slice(0, 10);
const OUT_JSON = path.join(ROOT, "docs", "validation", `telegram-review-flow-${RUN_DATE}.json`);
const OUT_MD = path.join(ROOT, "docs", "validation", `telegram-review-flow-${RUN_DATE}.md`);

function buildConversationRecord(overrides = {}) {
  const id = String(overrides.id || "qa-conversation");
  return {
    id,
    customerName: overrides.customerName || "QA Customer",
    customerEmail: overrides.customerEmail || "qa@example.com",
    category: overrides.category || "new_enquiry",
    priority: overrides.priority || "Medium",
    mondayItemId: overrides.mondayItemId || null,
    card: overrides.card || {
      id,
      customer_name: overrides.customerName || "QA Customer",
      customer_email: overrides.customerEmail || "qa@example.com",
      type: overrides.category || "new_enquiry",
      channel: "email",
      device: "iPhone 15 Pro",
      client_status: "End User",
      payment: "Not Paid",
      priority: "P2",
      price: "£99 (iPhone 15 Pro Screen)",
      latest_message: "Can you confirm the repair price please?",
      what_matters: "Standard enquiry with a catalogue price available.",
      confidence: overrides.confidence || { tier: "green", emoji: "🟢", label: "Ready to send" },
      thread_summary: ["QA Customer: Can you confirm the repair price please?"],
      context: {
        last_reply_from_us: "None",
        thread_age_days: 0,
        messages_in_thread: 1,
        monday_item_id: overrides.mondayItemId || null,
        monday_item_label: null,
        kb_used: ["pricing.json"],
        pricing_source: "From KB ✓",
        intercom_url: `https://app.intercom.com/a/inbox/test/conversation/${id}`
      },
      raw: {
        current_status: "New enquiry"
      }
    },
    draftText: overrides.draftText || "Hi QA,\n\nThanks for your message.\n\nKind regards,\nAlex",
    originalDraft: overrides.originalDraft || "Hi QA,\n\nThanks for your message.\n\nKind regards,\nAlex",
    status: overrides.status || "pending",
    telegramMessageId: overrides.telegramMessageId || "42",
    telegramChatId: overrides.telegramChatId || "-100qa",
    telegramThreadId: overrides.telegramThreadId || "774",
    runType: overrides.runType || "check"
  };
}

function buildCallback(action, conversationId, extra = null, overrides = {}) {
  const parts = [action, conversationId];
  if (extra !== null) {
    parts.push(extra);
  }

  return {
    id: overrides.callbackId || `cb-${action}-${conversationId}`,
    data: parts.join(":"),
    message: {
      chat: { id: overrides.chatId || "-100qa" },
      message_id: overrides.messageId || 42,
      message_thread_id: overrides.threadId || 774
    }
  };
}

function createDeps(db, options = {}) {
  const calls = {
    replies: 0,
    updates: 0,
    creates: 0,
    notes: [],
    tagsByName: [],
    callbackAnswers: [],
    editedCards: [],
    statusEdits: [],
    sentMessages: [],
    deletedMessages: [],
    repostedCards: []
  };

  let failMondayOnce = Boolean(options.failMondayOnce);

  const deps = {
    db,
    telegramClient: {
      async answerCallbackQuery(id, text) {
        calls.callbackAnswers.push({ id, text });
      },
      async editCard(payload) {
        calls.editedCards.push(payload);
      },
      async editCardStatus(payload) {
        calls.statusEdits.push(payload);
      },
      async sendMessage(payload) {
        calls.sentMessages.push(payload);
        return { ok: true, result: { message_id: 88, chat: { id: payload.chat_id } } };
      },
      async deleteMessage(chatId, messageId) {
        calls.deletedMessages.push({ chatId, messageId });
      },
      async sendEmailTriageCard(payload) {
        calls.repostedCards.push(payload);
        return {
          ok: true,
          result: {
            message_id: 91,
            chat: { id: "-100qa" },
            message_thread_id: 774
          }
        };
      }
    },
    intercomClient: {
      async sendReply() {
        calls.replies += 1;
      },
      async addNote(conversationId, note) {
        calls.notes.push({ conversationId, note });
      },
      async addTag() {
        return null;
      },
      async addTagByName(conversationId, name, fallbackId) {
        calls.tagsByName.push({ conversationId, name, fallbackId });
      }
    },
    mondayClient: {
      async createItem() {
        calls.creates += 1;
        return "999";
      },
      async addUpdate() {
        calls.updates += 1;
        if (failMondayOnce) {
          failMondayOnce = false;
          throw new Error("Injected Monday failure");
        }
        return "update-1";
      }
    },
    config: {
      intercom: {
        needsFerrariTagId: null,
        needsRickyTagId: null
      },
      telegram: {
        rickyChatId: "1611042131"
      }
    }
  };

  return { deps, calls };
}

async function runApproveOnceScenario() {
  const db = new DatabaseSync(":memory:");
  initializeDb(db);
  upsertConversation(db, buildConversationRecord({ id: "approve-1", mondayItemId: "555", status: "pending" }));

  const { deps, calls } = createDeps(db);
  const callback = buildCallback("send", "approve-1");

  await handleTelegramCallback(deps, callback);
  await handleTelegramCallback(deps, callback);

  const conversation = getConversation(db, "approve-1");
  assert.equal(calls.replies, 1, "duplicate approve should not resend Intercom reply");
  assert.equal(calls.updates, 1, "duplicate approve should not repeat Monday update");
  assert.equal(conversation.status, "sent");
  assert.ok(calls.callbackAnswers.some((entry) => entry.text === "Already handled"));

  db.close();
  return {
    id: "approve",
    description: "Approve sends once and blocks duplicate resend",
    pass: true,
    result: "PASS",
    details: "Intercom reply=1, Monday update=1, second callback rejected as already handled."
  };
}

async function runMondayRetryScenario() {
  const db = new DatabaseSync(":memory:");
  initializeDb(db);
  upsertConversation(db, buildConversationRecord({ id: "retry-1", mondayItemId: "777", status: "pending" }));

  const { deps, calls } = createDeps(db, { failMondayOnce: true });
  const callback = buildCallback("send", "retry-1");

  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await handleTelegramCallback(deps, callback);
  } finally {
    console.error = originalConsoleError;
  }
  let conversation = getConversation(db, "retry-1");
  assert.equal(calls.replies, 1);
  assert.equal(conversation.status, "sync_failed");
  assert.ok(conversation.intercom_sent_at);

  await handleTelegramCallback(deps, callback);
  conversation = getConversation(db, "retry-1");
  assert.equal(calls.replies, 1);
  assert.equal(calls.updates, 2);
  assert.equal(conversation.status, "sent");

  db.close();
  return {
    id: "approve-retry",
    description: "Approve retry resumes Monday sync without resending Intercom reply",
    pass: true,
    result: "PASS",
    details: "First pass failed Monday sync only; retry completed send with Intercom reply count still at 1."
  };
}

async function runEditScenario() {
  const db = new DatabaseSync(":memory:");
  initializeDb(db);
  upsertConversation(db, buildConversationRecord({ id: "edit-1", status: "pending" }));

  const { deps, calls } = createDeps(db);
  const editedText = "Hi QA,\n\nI have checked this and I will confirm the next step shortly.\n\nKind regards,\nAlex";

  await applyDraftEdit({ db, telegramClient: deps.telegramClient }, {
    conversationId: "edit-1",
    editedText,
    reason: "Tighten wording"
  });

  const conversation = getConversation(db, "edit-1");
  const editCount = db.prepare("SELECT COUNT(*) AS count FROM edits WHERE conversation_id = ?").get("edit-1").count;
  assert.equal(conversation.status, "edited");
  assert.equal(conversation.draft_text, editedText);
  assert.equal(editCount, 1);
  assert.equal(calls.editedCards.length, 1);

  db.close();
  return {
    id: "edit",
    description: "Edit updates stored draft and Telegram card",
    pass: true,
    result: "PASS",
    details: "Conversation moved to edited, 1 edit record stored, Telegram card refreshed."
  };
}

async function runEscalateScenario() {
  const db = new DatabaseSync(":memory:");
  initializeDb(db);
  upsertConversation(db, buildConversationRecord({ id: "escalate-1", status: "pending", priority: "High", category: "complaint" }));

  const { deps, calls } = createDeps(db);
  await handleTelegramCallback(deps, buildCallback("escalate_target", "escalate-1", "ricky"));

  const conversation = getConversation(db, "escalate-1");
  assert.equal(conversation.status, "escalated");
  assert.equal(calls.notes.length, 1);
  assert.equal(calls.tagsByName.length, 1);
  assert.ok(calls.sentMessages.some((entry) => String(entry.chat_id) === deps.config.telegram.rickyChatId));

  db.close();
  return {
    id: "escalate",
    description: "Escalate adds Intercom context, tags, and Ricky notification",
    pass: true,
    result: "PASS",
    details: "Intercom note/tag written and Ricky notification sent; conversation marked escalated."
  };
}

async function runSnoozeScenario() {
  const db = new DatabaseSync(":memory:");
  initializeDb(db);
  upsertConversation(db, buildConversationRecord({ id: "snooze-1", status: "pending" }));

  const { deps, calls } = createDeps(db);
  await handleTelegramCallback(deps, buildCallback("snooze_until", "snooze-1", "2h"));

  let conversation = getConversation(db, "snooze-1");
  const snooze = getSnooze(db, "snooze-1");
  assert.equal(conversation.status, "snoozed");
  assert.ok(snooze);
  assert.equal(calls.deletedMessages.length, 1);

  const dueSnoozes = getDueSnoozes(db, new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString());
  await repostDueSnoozes({ db, telegramClient: deps.telegramClient, dueSnoozes });

  conversation = getConversation(db, "snooze-1");
  assert.equal(conversation.status, "pending");
  assert.equal(getSnooze(db, "snooze-1"), null);
  assert.equal(calls.repostedCards.length, 1);
  assert.equal(calls.repostedCards[0].conversationId, "snooze-1");

  db.close();
  return {
    id: "snooze",
    description: "Snooze hides card and reposts it once due",
    pass: true,
    result: "PASS",
    details: "Conversation moved to snoozed, source message deleted, then reposted back to pending after expiry."
  };
}

async function runRoutingScenario() {
  const telegram = new TelegramClient({
    token: "test-token",
    chatId: "-100qa",
    emailsThreadId: 774,
    baseUrl: "https://api.telegram.org",
    publicBaseUrl: "https://alex.example.com"
  });

  const payloads = [];
  telegram.call = async (method, payload) => {
    payloads.push({ method, payload });
    return { ok: true, result: { message_id: 1, chat: { id: payload.chat_id }, message_thread_id: payload.message_thread_id } };
  };

  await telegram.sendEmailTriageCard({
    text: "Email triage card",
    conversationId: "route-1",
    card: { confidence: { tier: "yellow" } }
  });

  let blockedQuoteCard = false;
  try {
    await telegram.sendEmailTriageCard({
      text: "Quote card",
      conversationId: "route-2",
      card: { card_kind: "quote", confidence: { tier: "yellow" } }
    });
  } catch {
    blockedQuoteCard = true;
  }

  assert.equal(payloads[0].method, "sendMessage");
  assert.equal(payloads[0].payload.message_thread_id, 774);
  assert.equal(blockedQuoteCard, true);

  return {
    id: "routing",
    description: "Email triage routing stays on the email topic and blocks quote cards",
    pass: true,
    result: "PASS",
    details: "Outgoing payload used Telegram topic 774; quote card send was rejected."
  };
}

async function main() {
  const results = [];
  results.push(await runApproveOnceScenario());
  results.push(await runMondayRetryScenario());
  results.push(await runEditScenario());
  results.push(await runEscalateScenario());
  results.push(await runSnoozeScenario());
  results.push(await runRoutingScenario());

  fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2));

  const lines = [
    `# Telegram Review Flow QA — ${RUN_DATE}`,
    "",
    "## Cases",
    ""
  ];
  for (const result of results) {
    lines.push(`### ${result.id} — ${result.description}`);
    lines.push("");
    lines.push(`- Result: ${result.result}`);
    lines.push(`- Details: ${result.details}`);
    lines.push("");
  }
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Passed: ${results.filter((result) => result.pass).length}/${results.length}`);
  lines.push(`- Failed: ${results.filter((result) => !result.pass).length}/${results.length}`);
  fs.writeFileSync(OUT_MD, lines.join("\n"));

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
