#!/usr/bin/env node
/**
 * listing-bot.js — Interactive Telegram bot for BM listing approvals
 *
 * Posts one proposal card at a time to Telegram with inline buttons:
 *   ✅ Approve  — lists at proposed market price (standard run)
 *   ⚡ Override — prompts for a custom price, bypasses profit floor
 *   ❌ Skip     — leaves device as "To List", moves to next
 *
 * Usage:
 *   node scripts/listing-bot.js
 *
 * Fetches all "To List" items fresh on each run. Devices already listed
 * (status changed to "Listed") won't appear.
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });

const { spawnSync } = require('child_process');
const path = require('path');
const { getNotificationConfig } = require('./lib/notifications');

const NOTIFICATION_CONFIG = getNotificationConfig();
const TELEGRAM_BOT_TOKEN = NOTIFICATION_CONFIG.telegram.token;
const CHAT_ID = NOTIFICATION_CONFIG.telegram.chatId;
const LISTINGS_THREAD_ID = Number(NOTIFICATION_CONFIG.telegram.topics.listings);
const MONDAY_TOKEN = process.env.MONDAY_APP_TOKEN;
const MAIN_BOARD = 349212843;
const TO_LIST_GROUP = 'new_group88387__1';
const TO_LIST_INDEX = 8;
const BM_DIR = path.join(__dirname, '..');  // /home/ricky/builds/backmarket
const SCRIPT = path.join(__dirname, 'list-device.js');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Telegram helpers ─────────────────────────────────────────────

async function tgCall(method, params) {
  const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const d = await r.json();
  if (!d.ok) {
    console.error(`Telegram ${method} failed:`, JSON.stringify(d).slice(0, 200));
    return null;
  }
  return d.result;
}

async function sendMessage(text, extra = {}) {
  return tgCall('sendMessage', { chat_id: CHAT_ID, message_thread_id: LISTINGS_THREAD_ID, text, parse_mode: 'HTML', ...extra });
}

async function editMessage(messageId, text, extra = {}) {
  return tgCall('editMessageText', { chat_id: CHAT_ID, message_id: messageId, text, parse_mode: 'HTML', ...extra });
}

async function answerCallback(callbackQueryId, text = '') {
  return tgCall('answerCallbackQuery', { callback_query_id: callbackQueryId, text });
}

async function getUpdates(offset) {
  return tgCall('getUpdates', { offset, timeout: 25, allowed_updates: ['callback_query', 'message'] }) || [];
}

// ─── Monday helpers ───────────────────────────────────────────────

async function getToListItems() {
  const q = `{ boards(ids:[${MAIN_BOARD}]) { groups(ids:["${TO_LIST_GROUP}"]) { items_page(limit:200) { items { id name column_values(ids:["status24"]) { ... on StatusValue { index } } } } } } }`;
  const r = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: { Authorization: MONDAY_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q }),
  });
  const d = await r.json();
  const items = d.data?.boards?.[0]?.groups?.[0]?.items_page?.items || [];
  return items.filter(i => i.column_values?.[0]?.index === TO_LIST_INDEX);
}

// ─── Dry-run card data ────────────────────────────────────────────

function getCardData(itemId) {
  const result = spawnSync('node', [SCRIPT, '--dry-run', '--item', itemId, '--card-json'], {
    cwd: BM_DIR,
    encoding: 'utf8',
    timeout: 120000,
  });
  const jsonLine = (result.stdout || '').split('\n').find(l => l.startsWith('CARD_JSON:'));
  if (!jsonLine) {
    console.error(`No CARD_JSON for item ${itemId}`);
    if (result.stderr) console.error(result.stderr.slice(0, 300));
    return null;
  }
  try {
    return JSON.parse(jsonLine.slice('CARD_JSON:'.length));
  } catch (e) {
    console.error(`Failed to parse CARD_JSON for item ${itemId}:`, e.message);
    return null;
  }
}

// ─── Card formatting ──────────────────────────────────────────────

function fmtNum(n) {
  if (typeof n !== 'number') return String(n);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function buildCard(d, position, total) {
  const lines = [];

  // Header
  lines.push(`📋 <b>${d.name}</b>  [${position} of ${total}]`);

  // Device description from SKU
  const skuParts = d.sku.split('.');
  const type = skuParts[0] === 'MBA' ? 'MacBook Air' : 'MacBook Pro';
  const model = d.specs?.deviceName?.match(/A\d{4}/)?.[0] || '';
  const chip = skuParts[2] || '';
  lines.push(`<b>${type} ${chip} | ${d.specs?.ram}/${d.specs?.ssd} | ${d.specs?.colour} | ${d.grade[0] + d.grade.slice(1).toLowerCase()}</b>` + (model ? ` (${model})` : ''));
  lines.push('');

  // Market prices
  const gp = d.market.gradePrices;
  if (gp && Object.keys(gp).length > 0) {
    const gradeMarker = { FAIR: 'Fair', GOOD: 'Good', VERY_GOOD: 'Excellent' }[d.grade] || d.grade;
    const parts = Object.entries(gp)
      .filter(([, p]) => p != null)
      .map(([g, p]) => g === gradeMarker ? `<b>${g} £${p}</b>` : `${g} £${p}`)
      .join('  ·  ');
    lines.push(`💰 ${parts}`);
    if (!d.market.ladderOk) lines.push(`   ⚠️ Grade ladder inverted`);
  } else {
    lines.push(`💰 Market prices: N/A`);
  }

  // Adjacent SSD prices
  if (d.market.adjacentSsd?.length > 0) {
    const adjParts = d.market.adjacentSsd.map(a => {
      const isThis = a.ssd === d.specs?.ssd;
      return isThis ? `<b>${a.ssd} £${a.price}</b>` : `${a.ssd} £${a.price}`;
    }).join('  ·  ');
    lines.push(`   SSD: ${adjParts}`);
  }

  // Colour prices
  if (d.market.colourPrices && Object.keys(d.market.colourPrices).length > 1) {
    const colParts = Object.entries(d.market.colourPrices).map(([c, p]) => {
      const isThis = c.toLowerCase() === (d.specs?.colour || '').toLowerCase();
      return isThis ? `<b>${c} £${p}</b>` : `${c} £${p}`;
    }).join('  ·  ');
    lines.push(`   Colours: ${colParts}`);
  }

  lines.push('');

  // Price flags
  if (d.priceFlags?.length > 0) {
    d.priceFlags.forEach(f => lines.push(`   ${f}`));
    lines.push('');
  }

  // Costs
  lines.push(`💸 Purchase £${fmtNum(d.costs.purchase)}  ·  Parts £${fmtNum(d.costs.parts)}  ·  Labour £${fmtNum(d.costs.labour)}  ·  Ship £${d.costs.shipping}`);
  lines.push(`   Fixed £${fmtNum(d.costs.fixed)}  ·  B/E £${fmtNum(d.costs.breakEven)}`);
  lines.push('');

  // Pricing
  const netAbs = Math.abs(d.pricing.net);
  const netStr = d.pricing.net < 0
    ? `<b>-£${fmtNum(netAbs)}</b>`
    : `£${fmtNum(d.pricing.net)}`;
  lines.push(`📈 Proposed £${fmtNum(d.pricing.proposed)}  ·  Min £${fmtNum(d.pricing.minPrice)}`);
  lines.push(`   Net@min: ${netStr}  ·  Margin: ${d.pricing.margin}%`);
  lines.push('');

  // Decision
  if (d.decision === 'PROPOSE') {
    lines.push(`✅ <i>${d.decisionReason}</i>`);
  } else {
    lines.push(`⛔ <i>BLOCKED — ${d.decisionReason}</i>`);
    lines.push(`<i>Tap Override to set a price and list anyway</i>`);
  }

  return lines.join('\n');
}

function buildButtons(d) {
  const row = [];
  if (d.decision === 'PROPOSE') {
    row.push({ text: `✅ Approve £${Math.round(d.pricing.proposed)}`, callback_data: `approve:${d.itemId}` });
  }
  row.push({ text: '⚡ Override (set price)', callback_data: `override:${d.itemId}` });
  row.push({ text: '❌ Skip', callback_data: `skip:${d.itemId}` });
  return [row];
}

// ─── Live listing ─────────────────────────────────────────────────

function runLive(itemId, price = null, bypassFloor = false) {
  const cmd = [SCRIPT, '--live', '--item', itemId];
  if (price !== null) cmd.push('--price', String(price));
  if (bypassFloor) cmd.push('--min-margin', '0');

  console.log(`Running: node ${cmd.slice(1).join(' ')}`);
  const result = spawnSync('node', cmd, {
    cwd: BM_DIR,
    stdio: 'inherit',   // list-device.js posts its own Telegram messages
    timeout: 180000,
  });
  return result.status === 0;
}

// ─── Poll helpers ─────────────────────────────────────────────────

// Drain updates up to now so stale button presses don't fire on start
async function drainUpdates() {
  let offset = 0;
  const updates = await tgCall('getUpdates', { offset: -1, timeout: 0 }) || [];
  if (updates.length > 0) offset = updates[updates.length - 1].update_id + 1;
  return offset;
}

// Wait for a specific callback action on a given itemId, or a text reply for price
async function waitForAction(itemId, offset, expectingPrice = false) {
  while (true) {
    const updates = await getUpdates(offset);
    for (const u of updates) {
      offset = u.update_id + 1;

      // Button press
      if (!expectingPrice && u.callback_query) {
        const cb = u.callback_query;
        await answerCallback(cb.id);
        const [action, cbItemId] = (cb.data || '').split(':');
        if (cbItemId !== String(itemId)) continue; // stale button from a previous card
        return { offset, type: 'action', action };
      }

      // Price text (only from CHAT_ID)
      if (expectingPrice && u.message?.text && String(u.message.chat.id) === CHAT_ID) {
        const raw = u.message.text.trim().replace(/^£/, '');
        const price = parseFloat(raw);
        if (isNaN(price) || price <= 0) {
          await sendMessage(`⚠️ That doesn't look like a valid price. Enter a number (e.g. <code>950</code>):`);
          continue;
        }
        return { offset, type: 'price', price };
      }
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────

(async () => {
  console.log('═'.repeat(55));
  console.log('  BM Listing Bot');
  console.log(`  ${new Date().toISOString()}`);
  console.log('═'.repeat(55));

  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not set');
    process.exit(1);
  }

  // Drain stale updates so old button presses don't fire
  let offset = await drainUpdates();
  console.log(`Telegram offset: ${offset}`);

  // Fetch current "To List" items
  console.log('\nFetching "To List" items from Monday...');
  const toListItems = await getToListItems();
  console.log(`  ${toListItems.length} items found`);

  if (toListItems.length === 0) {
    await sendMessage('📋 No devices currently in "To List" — nothing to review.');
    return;
  }

  const total = toListItems.length;
  console.log(`\n${total} devices to review. Analysing and posting one at a time...\n`);
  await sendMessage(`📋 <b>Listing Review — ${total} device${total > 1 ? 's' : ''}</b>\n\nCards coming through one at a time. Tap a button on each to proceed.`);
  await sleep(1000);

  let approved = 0, overridden = 0, skipped = 0;

  for (let i = 0; i < toListItems.length; i++) {
    const item = toListItems[i];
    const position = i + 1;

    process.stdout.write(`\n[${position}/${total}] Analysing ${item.name}... `);
    const d = getCardData(item.id);
    if (!d) {
      console.log('FAILED — skipping');
      await sendMessage(`⚠️ Could not analyse <b>${item.name}</b> — skipping.`);
      skipped++;
      continue;
    }
    console.log(`${d.decision} — Net £${d.pricing.net}`);

    console.log(`  Posting card...`);

    const cardText = buildCard(d, position, total);
    const msg = await sendMessage(cardText, {
      reply_markup: { inline_keyboard: buildButtons(d) }
    });

    if (!msg) {
      console.error('Failed to send card, skipping');
      continue;
    }

    // Wait for button press
    const response = await waitForAction(d.itemId, offset);
    offset = response.offset;

    if (response.action === 'skip') {
      await editMessage(msg.message_id, cardText + '\n\n<i>⏭ Skipped</i>');
      console.log(`  Skipped`);
      skipped++;
    }

    else if (response.action === 'approve') {
      await editMessage(msg.message_id, cardText + '\n\n<i>⏳ Listing at £' + Math.round(d.pricing.proposed) + '...</i>');
      console.log(`  Approving at £${d.pricing.proposed}`);
      const ok = runLive(d.itemId);
      const resultLine = ok ? '✅ Listed successfully' : '⚠️ Script completed with errors — check Telegram for details';
      await editMessage(msg.message_id, cardText + `\n\n<i>${resultLine}</i>`);
      approved++;
    }

    else if (response.action === 'override') {
      // Ask for price
      const be = Math.ceil(d.costs.breakEven);
      const mkt = d.market.gradePrices?.[{ FAIR: 'Fair', GOOD: 'Good', VERY_GOOD: 'Excellent' }[d.grade]] || '?';
      await sendMessage(
        `⚡ <b>Override: ${d.name}</b>\nB/E: <b>£${be}</b>  ·  Market (${d.grade}): <b>£${mkt}</b>\n\nEnter your listing price:`
      );

      const priceResp = await waitForAction(d.itemId, offset, true);
      offset = priceResp.offset;
      const price = priceResp.price;

      await editMessage(msg.message_id, cardText + `\n\n<i>⏳ Listing at £${price} (override, bypassing profit floor)...</i>`);
      console.log(`  Override at £${price}`);
      const ok = runLive(d.itemId, price, true);
      const resultLine = ok ? `✅ Listed at £${price} (override)` : '⚠️ Script completed with errors — check Telegram for details';
      await editMessage(msg.message_id, cardText + `\n\n<i>${resultLine}</i>`);
      overridden++;
    }

    await sleep(500);
  }

  // Final summary
  const summaryLines = [`✅ <b>Review complete</b> — ${total} device${total > 1 ? 's' : ''} reviewed`];
  if (approved) summaryLines.push(`✅ Approved: ${approved}`);
  if (overridden) summaryLines.push(`⚡ Override listed: ${overridden}`);
  if (skipped) summaryLines.push(`⏭ Skipped: ${skipped}`);
  await sendMessage(summaryLines.join('\n'));

  console.log('\n' + '═'.repeat(55));
  console.log(`  Done. Reviewed: ${total}  Approved: ${approved}  Overridden: ${overridden}  Skipped: ${skipped}`);
  console.log('═'.repeat(55));
})();
