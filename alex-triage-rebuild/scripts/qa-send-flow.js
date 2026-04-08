import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { handleTelegramCallback } from "../lib/bot-actions.js";
import { getConversation, initializeDb, upsertConversation } from "../lib/db.js";

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
      device: "iPhone 15 Pro",
      client_status: "End User",
      payment: "Not Paid",
      priority: overrides.priority || "Medium",
      price: "£99 (iPhone 15 Pro Screen)",
      latest_message: "Can you confirm the repair price please?",
      what_matters: "Standard enquiry with a catalogue price available.",
      context: {
        last_reply_from_us: "None",
        thread_age_days: 0,
        messages_in_thread: 1,
        monday_item_id: overrides.mondayItemId || null,
        monday_item_label: null,
        intercom_url: `https://app.intercom.com/a/inbox/test/conversation/${id}`
      }
    },
    draftText: overrides.draftText || "Hi QA,\n\nThanks for your message.\n\nKind regards,\nAlex",
    originalDraft: overrides.originalDraft || "Hi QA,\n\nThanks for your message.\n\nKind regards,\nAlex",
    status: overrides.status || "pending",
    runType: overrides.runType || "check"
  };
}

function buildCallback(conversationId) {
  return {
    id: `cb-${conversationId}`,
    data: `send:${conversationId}`,
    message: {
      chat: { id: "-100qa" },
      message_id: 42
    }
  };
}

function createDeps(db, options = {}) {
  const calls = {
    replies: 0,
    updates: 0,
    creates: 0,
    notes: 0,
    tags: 0,
    callbackAnswers: [],
    editedCards: [],
    statusEdits: []
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
      }
    },
    intercomClient: {
      async sendReply() {
        calls.replies += 1;
      },
      async addNote() {
        calls.notes += 1;
      },
      async addTag() {
        calls.tags += 1;
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
        needsFerrariTagId: null
      }
    }
  };

  return { deps, calls };
}

async function runDuplicateSendScenario() {
  const db = new DatabaseSync(":memory:");
  initializeDb(db);
  upsertConversation(db, buildConversationRecord({ id: "dup-1", mondayItemId: "555" }));

  const { deps, calls } = createDeps(db);
  const callback = buildCallback("dup-1");

  await handleTelegramCallback(deps, callback);
  await handleTelegramCallback(deps, callback);

  const conversation = getConversation(db, "dup-1");
  assert.equal(calls.replies, 1, "duplicate send should not resend Intercom reply");
  assert.equal(calls.updates, 1, "duplicate send should not repeat Monday update");
  assert.equal(conversation.status, "sent");
  assert.ok(
    calls.callbackAnswers.some((entry) => entry.text === "Already handled"),
    "second callback should be rejected as already handled"
  );

  db.close();
}

async function runMondayRetryScenario() {
  const db = new DatabaseSync(":memory:");
  initializeDb(db);
  upsertConversation(db, buildConversationRecord({ id: "retry-1", mondayItemId: "777" }));

  const { deps, calls } = createDeps(db, { failMondayOnce: true });
  const callback = buildCallback("retry-1");

  await handleTelegramCallback(deps, callback);
  let conversation = getConversation(db, "retry-1");
  assert.equal(calls.replies, 1, "initial send should reply once to Intercom");
  assert.equal(conversation.status, "sync_failed");
  assert.ok(conversation.intercom_sent_at, "Intercom send timestamp should be preserved");

  await handleTelegramCallback(deps, callback);
  conversation = getConversation(db, "retry-1");
  assert.equal(calls.replies, 1, "retry after Monday failure must not resend Intercom reply");
  assert.equal(calls.updates, 2, "retry should attempt Monday sync again");
  assert.equal(conversation.status, "sent");

  db.close();
}

async function main() {
  await runDuplicateSendScenario();
  await runMondayRetryScenario();
  console.log("Send flow QA passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
