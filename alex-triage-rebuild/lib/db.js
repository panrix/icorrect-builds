import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getConfig } from "./config.js";

export const LAST_SUCCESSFUL_CHECKPOINT_KEY = "last_successful_check_at";

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  customer_email TEXT,
  category TEXT,
  priority TEXT,
  monday_item_id TEXT,
  card_json TEXT NOT NULL,
  draft_text TEXT,
  original_draft TEXT,
  status TEXT DEFAULT 'pending',
  telegram_message_id TEXT,
  telegram_chat_id TEXT,
  telegram_thread_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME,
  run_type TEXT,
  intercom_sent_at DATETIME,
  monday_synced_at DATETIME,
  send_error_text TEXT
);

CREATE TABLE IF NOT EXISTS edits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT REFERENCES conversations(id),
  original_draft TEXT,
  edited_draft TEXT,
  reason TEXT,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_type TEXT,
  started_at DATETIME,
  completed_at DATETIME,
  conversations_found INTEGER,
  conversations_actionable INTEGER,
  status TEXT DEFAULT 'running',
  error_text TEXT
);

CREATE TABLE IF NOT EXISTS checkpoints (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS snoozes (
  conversation_id TEXT PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
  until_at DATETIME NOT NULL,
  reason TEXT,
  original_message_id TEXT,
  original_chat_id TEXT,
  original_thread_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

function serialize(value) {
  return JSON.stringify(value);
}

function deserialize(value, fallback = null) {
  if (!value) {
    return fallback;
  }
  return JSON.parse(value);
}

function ensureColumn(db, tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

export function ensureDataDir() {
  const config = getConfig({ strict: false });
  fs.mkdirSync(config.dataDir, { recursive: true });
}

export function openDb() {
  ensureDataDir();
  const config = getConfig({ strict: false });
  const db = new DatabaseSync(config.dbPath);
  initializeDb(db);
  return db;
}

export function initializeDb(db) {
  db.exec(SCHEMA);
  ensureColumn(db, "conversations", "intercom_sent_at", "DATETIME");
  ensureColumn(db, "conversations", "monday_synced_at", "DATETIME");
  ensureColumn(db, "conversations", "send_error_text", "TEXT");
  ensureColumn(db, "conversations", "intercom_activity_at", "DATETIME");
}

export function withDb(fn) {
  const db = openDb();
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

export function startRun(db, runType) {
  db.prepare(`
    UPDATE runs
    SET status = 'aborted',
        completed_at = CURRENT_TIMESTAMP,
        error_text = COALESCE(error_text, 'Previous run interrupted before completion')
    WHERE status = 'running'
  `).run();

  const stmt = db.prepare(`
    INSERT INTO runs (run_type, started_at, status)
    VALUES (?, CURRENT_TIMESTAMP, 'running')
    RETURNING id
  `);
  return stmt.get(runType).id;
}

export function completeRun(db, runId, fields) {
  const stmt = db.prepare(`
    UPDATE runs
    SET completed_at = CURRENT_TIMESTAMP,
        conversations_found = ?,
        conversations_actionable = ?,
        status = ?,
        error_text = ?
    WHERE id = ?
  `);

  stmt.run(
    fields.conversationsFound ?? null,
    fields.conversationsActionable ?? null,
    fields.status ?? "completed",
    fields.errorText ?? null,
    runId
  );
}

export function getCheckpoint(db, key) {
  const row = db.prepare(`SELECT value FROM checkpoints WHERE key = ?`).get(key);
  return row ? row.value : null;
}

export function setCheckpoint(db, key, value) {
  db.prepare(`
    INSERT INTO checkpoints (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key)
    DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(key, value);
}

export function upsertConversation(db, record) {
  db.prepare(`
    INSERT INTO conversations (
      id, customer_name, customer_email, category, priority, monday_item_id,
      card_json, draft_text, original_draft, status, telegram_message_id,
      telegram_chat_id, telegram_thread_id, run_type, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      customer_name = excluded.customer_name,
      customer_email = excluded.customer_email,
      category = excluded.category,
      priority = excluded.priority,
      monday_item_id = excluded.monday_item_id,
      card_json = excluded.card_json,
      draft_text = COALESCE(excluded.draft_text, conversations.draft_text),
      original_draft = COALESCE(conversations.original_draft, excluded.original_draft),
      run_type = excluded.run_type,
      updated_at = CURRENT_TIMESTAMP
  `).run(
    record.id,
    record.customerName,
    record.customerEmail,
    record.category,
    record.priority,
    record.mondayItemId,
    serialize(record.card),
    record.draftText ?? null,
    record.originalDraft ?? null,
    record.status ?? "pending",
    record.telegramMessageId ?? null,
    record.telegramChatId ?? null,
    record.telegramThreadId ?? null,
    record.runType
  );
}

export function getConversation(db, id) {
  const row = db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(id);
  if (!row) {
    return null;
  }

  return {
    ...row,
    card_json: deserialize(row.card_json, {})
  };
}

export function listPendingConversations(db) {
  return db.prepare(`
    SELECT * FROM conversations
    WHERE status IN ('pending', 'edited', 'sync_failed')
    ORDER BY created_at ASC
  `).all().map((row) => ({
    ...row,
    card_json: deserialize(row.card_json, {})
  }));
}

export function updateConversationAfterTelegramPost(db, id, fields) {
  db.prepare(`
    UPDATE conversations
    SET telegram_message_id = ?,
        telegram_chat_id = ?,
        telegram_thread_id = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(fields.telegramMessageId, fields.telegramChatId, fields.telegramThreadId, id);
}

export function updateConversationIntercomActivity(db, id, intercomUpdatedAtMs) {
  const isoValue = new Date(intercomUpdatedAtMs).toISOString();
  db.prepare(`
    UPDATE conversations
    SET intercom_activity_at = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(isoValue, id);
}

export function updateConversationMondayItem(db, id, mondayItemId) {
  db.prepare(`
    UPDATE conversations
    SET monday_item_id = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(mondayItemId, id);
}

export function updateConversationStatus(db, id, status, extra = {}) {
  db.prepare(`
    UPDATE conversations
    SET status = ?,
        draft_text = COALESCE(?, draft_text),
        sent_at = COALESCE(?, sent_at),
        send_error_text = COALESCE(?, send_error_text),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    status,
    extra.draftText ?? null,
    extra.sentAt ?? null,
    extra.sendErrorText ?? null,
    id
  );
}

export function claimConversationForSend(db, id) {
  const row = db.prepare(`
    UPDATE conversations
    SET status = 'sending',
        send_error_text = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
      AND status IN ('pending', 'edited', 'sync_failed')
    RETURNING *
  `).get(id);

  if (!row) {
    return null;
  }

  return {
    ...row,
    card_json: deserialize(row.card_json, {})
  };
}

export function markConversationIntercomSent(db, id) {
  db.prepare(`
    UPDATE conversations
    SET intercom_sent_at = COALESCE(intercom_sent_at, CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);
}

export function markConversationSendFailed(db, id, status, errorText) {
  db.prepare(`
    UPDATE conversations
    SET status = ?,
        send_error_text = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, errorText, id);
}

export function markConversationSent(db, id, sentAt = null) {
  db.prepare(`
    UPDATE conversations
    SET status = 'sent',
        sent_at = COALESCE(?, CURRENT_TIMESTAMP),
        monday_synced_at = CURRENT_TIMESTAMP,
        send_error_text = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(sentAt, id);
}

export function insertEdit(db, record) {
  return db.prepare(`
    INSERT INTO edits (
      conversation_id, original_draft, edited_draft, reason, category
    ) VALUES (?, ?, ?, ?, ?)
    RETURNING id
  `).get(
    record.conversationId,
    record.originalDraft,
    record.editedDraft,
    record.reason ?? null,
    record.category ?? null
  ).id;
}

export function getUnprocessedEdits(db) {
  return db.prepare(`
    SELECT * FROM edits
    WHERE processed = 0
    ORDER BY created_at ASC
  `).all();
}

export function markEditsProcessed(db, editIds) {
  if (!editIds.length) {
    return;
  }

  const placeholders = editIds.map(() => "?").join(", ");
  db.prepare(`
    UPDATE edits
    SET processed = 1
    WHERE id IN (${placeholders})
  `).run(...editIds);
}

export function createSnooze(db, record) {
  db.prepare(`
    INSERT INTO snoozes (
      conversation_id, until_at, reason, original_message_id, original_chat_id, original_thread_id
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(conversation_id) DO UPDATE SET
      until_at = excluded.until_at,
      reason = excluded.reason,
      original_message_id = excluded.original_message_id,
      original_chat_id = excluded.original_chat_id,
      original_thread_id = excluded.original_thread_id,
      created_at = CURRENT_TIMESTAMP
  `).run(
    record.conversationId,
    record.untilAt,
    record.reason ?? null,
    record.originalMessageId ?? null,
    record.originalChatId ?? null,
    record.originalThreadId ?? null
  );
}

export function getDueSnoozes(db, nowIso = new Date().toISOString()) {
  return db.prepare(`
    SELECT s.*, c.card_json, c.draft_text, c.customer_name, c.priority, c.status
    FROM snoozes s
    JOIN conversations c ON c.id = s.conversation_id
    WHERE s.until_at <= ?
    ORDER BY s.until_at ASC
  `).all(nowIso).map((row) => ({
    ...row,
    card_json: deserialize(row.card_json, {})
  }));
}

export function deleteSnooze(db, conversationId) {
  db.prepare(`DELETE FROM snoozes WHERE conversation_id = ?`).run(conversationId);
}

export function getSnooze(db, conversationId) {
  return db.prepare(`SELECT * FROM snoozes WHERE conversation_id = ?`).get(conversationId) || null;
}

export function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}
