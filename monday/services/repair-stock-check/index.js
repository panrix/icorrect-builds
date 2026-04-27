#!/usr/bin/env node
/**
 * repair-stock-check — Monday "Requested Repairs" board_relation change → Monday update with stock check
 *
 * Watches: Main Board 349212843, column `board_relation` (Requested Repairs)
 * On change: looks up linked Products & Pricing items, fetches their linked Parts,
 *            then posts a Monday update on the main-board item summarising stock.
 *
 * Read-only against parts. Does NOT reserve or deduct stock.
 *
 * Port: 8015 (127.0.0.1)
 * Nginx route (suggested): /webhook/monday/repair-stock-check → 127.0.0.1:8015
 *
 * Deliberately separate from icorrect-parts-service (which handles Parts Used
 * deduction on column connect_boards__1). Sharing infra would risk coupling
 * the read-only stock-check trigger to write-path deduction logic.
 */

const express = require('express');

const { checkStockForProductIds, makeMondayClient } = require('../../../operations-system/tools/lib/stock-check-core');

const app = express();
app.use(express.json());

const PORT = parseInt(process.env.PORT, 10) || 8015;
const HOST = '127.0.0.1';

const MAIN_BOARD_ID = 349212843;
const REQUESTED_REPAIRS_COLUMN = 'board_relation';

const SHADOW_MODE = process.env.SHADOW_MODE === 'true';
const MONDAY_TOKEN = process.env.MONDAY_APP_TOKEN || process.env.MONDAY_API_TOKEN;

if (!MONDAY_TOKEN) {
  console.error('[repair-stock-check] MONDAY_APP_TOKEN not set — refusing to start');
  process.exit(1);
}

const monday = makeMondayClient(MONDAY_TOKEN);

// ─── Webhook payload helpers ──────────────────────────────────────
function extractLinkedIds(value) {
  if (!value) return [];
  if (Array.isArray(value.linkedPulseIds)) {
    return value.linkedPulseIds
      .map((p) => p && (p.linkedPulseId ?? p.itemId ?? p))
      .filter(Boolean)
      .map(String);
  }
  if (Array.isArray(value.linked_item_ids)) {
    return value.linked_item_ids.map(String).filter(Boolean);
  }
  return [];
}

// ─── Update body formatter ────────────────────────────────────────
function formatUpdate(checks) {
  if (!checks.length) {
    return '<b>Stock Check</b><br>No requested repairs linked.';
  }

  const lines = ['<b>Stock Check</b>'];
  for (const check of checks) {
    const repairLabel = check.productName || `Repair ${check.productId} (not found)`;
    lines.push(`<br>• <b>Repair:</b> ${escapeHtml(repairLabel)}`);

    if (!check.parts.length) {
      lines.push('• <b>Linked Part:</b> Not found — manual check required');
      continue;
    }

    const primary = check.parts[0];
    const lowFlag = isLow(primary.availableStock) ? ' ⚠️ <b>Low</b>' : '';
    lines.push(`• <b>Linked Part:</b> ${escapeHtml(primary.name)}`);
    lines.push(`• <b>Available Stock:</b> ${escapeHtml(String(primary.availableStock))}${lowFlag}`);

    if (check.parts.length > 1) {
      lines.push('• <b>Other Possible Parts:</b>');
      for (const p of check.parts.slice(1, 5)) {
        lines.push(`&nbsp;&nbsp;- ${escapeHtml(p.name)}: ${escapeHtml(String(p.availableStock))}`);
      }
    }
  }
  return lines.join('<br>');
}

function isLow(stockText) {
  const n = parseFloat(stockText);
  return Number.isFinite(n) && n <= 0;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Monday create_update ─────────────────────────────────────────
async function postItemUpdate(itemId, body) {
  const query = `mutation($itemId: ID!, $body: String!) {
    create_update(item_id: $itemId, body: $body) { id }
  }`;
  const data = await monday(query, { itemId: String(itemId), body });
  return data.create_update?.id;
}

// ─── Core processing ──────────────────────────────────────────────
async function processStockCheck(itemId, productIds) {
  const checks = await checkStockForProductIds(monday, productIds);
  const body = formatUpdate(checks);

  if (SHADOW_MODE) {
    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      level: 'info',
      message: 'shadow_stock_check',
      itemId,
      productIds,
      checks,
      body,
    }));
    return;
  }

  const updateId = await postItemUpdate(itemId, body);
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    level: 'info',
    message: 'stock_check_posted',
    itemId,
    updateId,
    productCount: checks.length,
  }));
}

// ─── Webhook handler ──────────────────────────────────────────────
app.post('/webhook/monday/repair-stock-check', async (req, res) => {
  const body = req.body || {};

  // Monday challenge handshake
  if (body.challenge) {
    console.log('[repair-stock-check] challenge received');
    return res.json({ challenge: body.challenge });
  }

  const event = body.event;

  // Respond 200 immediately, process async
  res.status(200).json({ ok: true });

  if (!event) {
    console.warn('[repair-stock-check] no event in payload');
    return;
  }

  // Filter: only column updates on the main board, on the Requested Repairs column
  if (event.type !== 'update_column_value') return;
  if (event.boardId !== MAIN_BOARD_ID) return;
  if (event.columnId !== REQUESTED_REPAIRS_COLUMN) return;

  const itemId = event.pulseId || event.itemId;
  if (!itemId) {
    console.warn('[repair-stock-check] no pulseId on event');
    return;
  }

  const currentIds = extractLinkedIds(event.value);
  const previousIds = extractLinkedIds(event.previousValue);

  // If column is empty after the change, skip.
  // If unchanged (rare echo), skip.
  if (!currentIds.length) {
    console.log(JSON.stringify({
      level: 'info',
      message: 'requested_repairs_cleared',
      itemId,
      previousCount: previousIds.length,
    }));
    return;
  }

  const sameSet =
    currentIds.length === previousIds.length &&
    currentIds.every((id) => previousIds.includes(id));
  if (sameSet) {
    console.log(JSON.stringify({
      level: 'debug',
      message: 'no_change',
      itemId,
      count: currentIds.length,
    }));
    return;
  }

  try {
    await processStockCheck(itemId, currentIds);
  } catch (err) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'process_failed',
      itemId,
      productIds: currentIds,
      error: err.message,
    }));
  }
});

// ─── Health check ─────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'repair-stock-check',
    shadowMode: SHADOW_MODE,
    port: PORT,
    uptime: process.uptime(),
  });
});

// ─── Start ────────────────────────────────────────────────────────
app.listen(PORT, HOST, () => {
  console.log(`[repair-stock-check] listening on ${HOST}:${PORT} (shadow=${SHADOW_MODE})`);
});

module.exports = { app, formatUpdate, extractLinkedIds, processStockCheck };
