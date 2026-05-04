#!/usr/bin/env node
/**
 * bm-qc-listing — SOP 05/06 QC handoff and listing approval service.
 *
 * Monday webhook:
 *   - status4 -> Ready To Collect: generate/write canonical BM SKU via qc-generate-sku.js
 *   - status24 -> To List: run SOP 06 dry-run card JSON and post Telegram approval card
 *
 * Telegram polling:
 *   - Handles approve / override / skip callbacks from listing cards.
 *
 * Port: 8015 (127.0.0.1)
 * Nginx route: /webhook/bm/qc-listing -> 127.0.0.1:8015
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env', quiet: true });

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { mondayQuery } = require('../../scripts/lib/monday');
const { getNotificationConfig, notificationHealthCheck, postTelegram } = require('../../scripts/lib/notifications');
const {
  answerCallback,
  buildButtons,
  buildCard,
  drainUpdates,
  editMessage,
  getCardData,
  getUpdates,
  runLive,
  sendMessage,
} = require('../../scripts/listing-bot');

const PORT = 8015;
const HOST = '127.0.0.1';
const MAIN_BOARD = '349212843';
const STATUS_COLUMN = 'status24';
const STATUS4_COLUMN = 'status4';
const TO_LIST_INDEX = 8;
const STATE_PATH = path.join(__dirname, '..', '..', 'data', 'qc-listing-service-state.json');
const CARD_DEDUP_MS = 6 * 60 * 60 * 1000;
const NOTIFICATION_CONFIG = getNotificationConfig();
const TELEGRAM_CHAT_ID = String(NOTIFICATION_CONFIG.telegram.chatId);
const LISTINGS_THREAD_ID = Number(NOTIFICATION_CONFIG.telegram.topics.listings);

let telegramOffset = 0;
let polling = false;
const pendingOverrides = new Map();

function parseStatusValue(value) {
  if (typeof value !== 'string') return value || {};
  try {
    return JSON.parse(value || '{}');
  } catch {
    return {};
  }
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return { cards: {}, skuWrites: {} };
  }
}

function writeState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function statusIndex(event) {
  const value = parseStatusValue(event?.value);
  return value.index ?? value?.label?.index ?? null;
}

function statusLabel(event) {
  const value = parseStatusValue(event?.value);
  return String(
    value?.label?.text ||
    value?.label?.label ||
    value?.label ||
    value?.text ||
    event?.pulseName ||
    ''
  );
}

function eventItemId(event) {
  return event?.pulseId || event?.itemId || event?.item_id || event?.pulse?.id || null;
}

function eventItemName(event) {
  return event?.pulseName || event?.itemName || event?.pulse?.name || `Item ${eventItemId(event)}`;
}

function telegramMessageKey(message) {
  return `${String(message?.chat?.id || '')}:${String(message?.message_thread_id || '')}`;
}

function isListingsTopicMessage(message) {
  return (
    String(message?.chat?.id || '') === TELEGRAM_CHAT_ID &&
    Number(message?.message_thread_id) === LISTINGS_THREAD_ID
  );
}

async function getCurrentStatusColumns(itemId) {
  const data = await mondayQuery(`{
    items(ids: [${itemId}]) {
      id name
      column_values(ids: ["${STATUS4_COLUMN}", "${STATUS_COLUMN}"]) {
        id
        text
        ... on StatusValue { index text }
      }
    }
  }`);
  const item = data.items?.[0];
  const status4 = item?.column_values?.find((col) => col.id === STATUS4_COLUMN);
  const status24 = item?.column_values?.find((col) => col.id === STATUS_COLUMN);
  return {
    itemName: item?.name || null,
    status4Text: status4?.text || '',
    status24Text: status24?.text || '',
    status24Index: status24?.index ?? null,
  };
}

function runQcSkuWrite(itemId) {
  const result = spawnSync('node', ['scripts/qc-generate-sku.js', '--item', String(itemId), '--write', '--json'], {
    cwd: path.join(__dirname, '..', '..'),
    encoding: 'utf8',
    timeout: 120000,
  });
  const stdout = result.stdout || '';
  const jsonStart = stdout.indexOf('{');
  let payload = null;
  if (jsonStart !== -1) {
    try {
      payload = JSON.parse(stdout.slice(jsonStart));
    } catch {}
  }
  return {
    ok: result.status === 0 && payload?.ok !== false,
    status: result.status,
    payload,
    stdout,
    stderr: result.stderr || '',
  };
}

async function handleReadyToCollect(itemId, itemName) {
  const state = readState();
  const last = state.skuWrites[String(itemId)]?.at ? new Date(state.skuWrites[String(itemId)].at).getTime() : 0;
  if (Date.now() - last < CARD_DEDUP_MS) {
    console.log(`[qc-listing] SKU write recently attempted for ${itemName} (${itemId}), skipping duplicate`);
    return;
  }

  console.log(`[qc-listing] Ready To Collect: generating SKU for ${itemName} (${itemId})`);
  const result = runQcSkuWrite(itemId);
  state.skuWrites[String(itemId)] = {
    at: new Date().toISOString(),
    ok: result.ok,
    classification: result.payload?.classification || null,
    expectedSku: result.payload?.expectedSku || null,
    storedSku: result.payload?.storedSku || null,
  };
  writeState(state);

  if (!result.ok) {
    await postTelegram(
      `⚠️ QC SKU generation failed for ${itemName}\n` +
      `Classification: ${result.payload?.classification || 'unknown'}\n` +
      `Error: ${result.payload?.error || result.payload?.write_error || result.stderr.slice(0, 250) || 'unknown'}`,
      { topic: 'issues', logger: console }
    );
    return;
  }

  console.log(`[qc-listing] SKU ready for ${itemName}: ${result.payload?.expectedSku || result.payload?.storedSku || 'unknown'}`);
}

async function postListingCard(itemId, itemName, { force = false } = {}) {
  const state = readState();
  const existing = state.cards[String(itemId)];
  if (!force && existing?.postedAt && Date.now() - new Date(existing.postedAt).getTime() < CARD_DEDUP_MS) {
    console.log(`[qc-listing] Listing card recently posted for ${itemName} (${itemId}), skipping duplicate`);
    return;
  }

  console.log(`[qc-listing] Building listing card for ${itemName} (${itemId})`);
  const data = getCardData(itemId);
  if (!data) {
    await postTelegram(
      `⚠️ Could not generate listing approval card for ${itemName} (${itemId}). Check SOP 06 dry-run/card-json output.`,
      { topic: 'issues', logger: console }
    );
    return;
  }

  const cardText = buildCard(data, 1, 1);
  const message = await sendMessage(cardText, {
    reply_markup: { inline_keyboard: buildButtons(data) },
  });
  if (!message) {
    await postTelegram(
      `⚠️ Failed to post listing approval card for ${itemName} (${itemId}).`,
      { topic: 'issues', logger: console }
    );
    return;
  }

  state.cards[String(itemId)] = {
    postedAt: new Date().toISOString(),
    messageId: message.message_id,
    itemName,
    dryRunDecision: data.decision,
    action: null,
  };
  writeState(state);
  console.log(`[qc-listing] Posted listing approval card for ${itemName} (${itemId})`);
}

async function handleMondayEvent(event) {
  if (!event || String(event.boardId) !== MAIN_BOARD) return;
  const itemId = eventItemId(event);
  if (!itemId) return;
  let itemName = eventItemName(event);

  if (event.columnId === STATUS4_COLUMN) {
    const current = await getCurrentStatusColumns(itemId).catch(() => ({}));
    itemName = current.itemName || itemName;
    const label = `${statusLabel(event)} ${current.status4Text || ''}`.toLowerCase();
    if (label.includes('ready') && label.includes('collect')) {
      await handleReadyToCollect(itemId, itemName);
    }
    return;
  }

  if (event.columnId === STATUS_COLUMN) {
    const current = await getCurrentStatusColumns(itemId).catch(() => ({}));
    itemName = current.itemName || itemName;
    const index = statusIndex(event) ?? current.status24Index;
    const label = `${statusLabel(event)} ${current.status24Text || ''}`.toLowerCase().trim();
    if (index === TO_LIST_INDEX || label === 'to list') {
      await postListingCard(itemId, itemName);
    }
  }
}

async function handleCallback(callback) {
  const [action, itemId] = String(callback.data || '').split(':');
  if (!['approve', 'override', 'skip'].includes(action) || !itemId) return;

  if (!isListingsTopicMessage(callback.message)) return;

  const state = readState();
  const card = state.cards[String(itemId)];
  const messageId = callback.message?.message_id;
  if (!card || Number(card.messageId) !== Number(messageId)) {
    await answerCallback(callback.id, 'This listing card is stale.');
    return;
  }
  if (card.action) {
    await answerCallback(callback.id, 'This listing card was already handled.');
    return;
  }

  await answerCallback(callback.id);

  const baseText = callback.message?.text || `Listing card for item ${itemId}`;

  if (action === 'skip') {
    if (messageId) await editMessage(messageId, `${baseText}\n\n<i>⏭ Skipped</i>`);
    card.action = 'skip';
    card.decidedAt = new Date().toISOString();
    writeState(state);
    return;
  }

  if (action === 'approve') {
    card.action = 'approve';
    card.decidedAt = new Date().toISOString();
    writeState(state);
    if (messageId) await editMessage(messageId, `${baseText}\n\n<i>⏳ Listing...</i>`);
    const ok = runLive(itemId);
    card.listedOk = ok;
    card.completedAt = new Date().toISOString();
    writeState(state);
    if (messageId) {
      await editMessage(messageId, `${baseText}\n\n<i>${ok ? '✅ Listed successfully' : '⚠️ Listing script completed with errors — check Telegram for details'}</i>`);
    }
    return;
  }

  if (action === 'override') {
    pendingOverrides.set(telegramMessageKey(callback.message), { itemId, messageId, baseText });
    await sendMessage(`⚡ <b>Override listing price</b>\nItem: <code>${itemId}</code>\n\nEnter your listing price:`);
  }
}

async function handleTextMessage(message) {
  if (!isListingsTopicMessage(message)) return;
  const key = telegramMessageKey(message);
  const pending = pendingOverrides.get(key);
  if (!pending || !message.text) return;
  const price = parseFloat(String(message.text).trim().replace(/^£/, ''));
  if (!Number.isFinite(price) || price <= 0) {
    await sendMessage(`⚠️ That doesn't look like a valid price. Enter a number (e.g. <code>950</code>):`);
    return;
  }
  pendingOverrides.delete(key);
  const state = readState();
  const card = state.cards[String(pending.itemId)];
  if (card) {
    card.action = 'override';
    card.overridePrice = price;
    card.decidedAt = new Date().toISOString();
    writeState(state);
  }
  if (pending.messageId) {
    await editMessage(pending.messageId, `${pending.baseText}\n\n<i>⏳ Listing at £${price} (override, bypassing profit floor)...</i>`);
  }
  const ok = runLive(pending.itemId, price, true);
  if (card) {
    card.listedOk = ok;
    card.completedAt = new Date().toISOString();
    writeState(state);
  }
  if (pending.messageId) {
    await editMessage(pending.messageId, `${pending.baseText}\n\n<i>${ok ? `✅ Listed at £${price} (override)` : '⚠️ Listing script completed with errors — check Telegram for details'}</i>`);
  }
}

async function pollTelegram() {
  if (polling) return;
  polling = true;
  try {
    const updates = await getUpdates(telegramOffset);
    for (const update of updates) {
      telegramOffset = update.update_id + 1;
      if (update.callback_query) await handleCallback(update.callback_query);
      if (update.message) await handleTextMessage(update.message);
    }
  } catch (error) {
    console.warn(`[qc-listing] Telegram poll failed: ${error.message}`);
  } finally {
    polling = false;
    setTimeout(pollTelegram, 1000);
  }
}

function readRequestJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

async function handleRequest(req, res) {
  if (req.method === 'GET' && req.url === '/health') {
    const body = JSON.stringify({
      service: 'bm-qc-listing',
      status: 'ok',
      port: PORT,
      notifications: await notificationHealthCheck(),
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
    return;
  }

  if (req.method === 'POST' && req.url === '/webhook/bm/qc-listing') {
    try {
      const body = await readRequestJson(req);
      if (body.challenge) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ challenge: body.challenge }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
      handleMondayEvent(body.event).catch((error) => {
        console.error('[qc-listing] Event error:', error);
      });
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end(error.message);
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
}

async function start() {
  telegramOffset = await drainUpdates();
  console.log(`[bm-qc-listing] Telegram offset: ${telegramOffset}`);
  setTimeout(pollTelegram, 1000);
  http.createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
      console.error('[qc-listing] Request error:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal error');
    });
  }).listen(PORT, HOST, () => {
    console.log(`[bm-qc-listing] Listening on ${HOST}:${PORT}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  handleMondayEvent,
  handleReadyToCollect,
  postListingCard,
  runQcSkuWrite,
  isListingsTopicMessage,
  statusIndex,
  statusLabel,
};
