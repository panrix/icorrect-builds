#!/usr/bin/env node
/**
 * board-housekeeping.js — Daily BM Devices Board cleanup
 *
 * Ported from legacy bm_board_housekeeping.py (archive 2026-04-01).
 *
 * Rules:
 *   Rule 1: BM Devices items in saleable group with status "Sold"
 *            → move to Shipped group
 *            (skipped on Sat / Sun / Mon — items sold Friday won't ship until Mon evening)
 *
 *   Rule 2: BM Devices items stranded in non-saleable groups with status "To List"
 *            → move into saleable group (BM To List / Listed / Sold)
 *
 * Usage:
 *   node board-housekeeping.js             # Live run
 *   node board-housekeeping.js --dry-run   # Preview only, no mutations
 *
 * Cron: 07:30 UTC Mon–Fri
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });

const MONDAY_TOKEN   = process.env.MONDAY_APP_TOKEN;
const SLACK_TOKEN    = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL  = process.env.DISPATCH_SLACK_CHANNEL || 'C024H7518J3';

const BM_DEVICES_BOARD = 3892194968;

// Groups on BM Devices Board
const GROUP_SALEABLE  = 'new_group';           // BM To List / Listed / Sold
const GROUP_SHIPPED   = 'new_group269';        // Shipped

// Groups to scan for stranded "To List" items (Rule 2)
const SCAN_GROUPS = [
  'group_mkq3wkeq',       // BM Trade-Ins
  'new_group_mkmybfgr',   // BM Returns
  'new_group62345__1',    // Devices to Refurbish
  'new_group_Mjj6tJYg',   // Rejected / iC Locked
  'group_mkrjssev',       // TigerTech May 2025
  'group_mkr4h8ty',       // MTR May 2025
  'new_group7116',        // Board used for repair
  'topics',               // Old BMs
];

const isDryRun = process.argv.includes('--dry-run');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── API helpers ──────────────────────────────────────────────────
async function mondayApi(query, variables = null) {
  const body = variables ? { query, variables } : { query };
  const r = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: { Authorization: MONDAY_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (d.errors) console.error('  Monday API error:', JSON.stringify(d.errors));
  return d;
}

async function postSlack(text) {
  if (isDryRun) { console.log(`  [DRY RUN] Slack: ${text.slice(0, 120)}`); return; }
  if (!SLACK_TOKEN) return;
  try {
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SLACK_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: SLACK_CHANNEL, text }),
    });
  } catch (e) { console.warn(`  Slack failed: ${e.message}`); }
}

// ─── Fetch items in a group ────────────────────────────────────────
async function getGroupItems(groupId) {
  const q = `{
    boards(ids: [${BM_DEVICES_BOARD}]) {
      groups(ids: ["${groupId}"]) {
        title
        items_page(limit: 200) {
          items {
            id
            name
            column_values(ids: ["mirror3__1", "board_relation"]) {
              ... on MirrorValue { display_value }
              ... on BoardRelationValue { linked_item_ids }
            }
          }
        }
      }
    }
  }`;
  const d = await mondayApi(q);
  const groups = d.data?.boards?.[0]?.groups || [];
  if (!groups.length) return [];
  return groups[0].items_page?.items || [];
}

// ─── Check Main Board item has tracking ───────────────────────────
async function hasTracking(item) {
  const relCol = item.column_values?.find(cv => cv.linked_item_ids);
  const mainItemId = relCol?.linked_item_ids?.[0];
  if (!mainItemId) return false;
  const q = `{ items(ids: [${mainItemId}]) { column_values(ids: ["text53"]) { id text } } }`;
  const d = await mondayApi(q);
  const tracking = d.data?.items?.[0]?.column_values?.[0]?.text || '';
  return tracking.trim().length > 0;
}

function getStatus(item) {
  try {
    const col = item.column_values?.find(cv => cv.id === 'mirror3__1');
    return col?.display_value || '';
  } catch { return ''; }
}

// ─── Move item to group ────────────────────────────────────────────
async function moveItem(itemId, groupId) {
  if (isDryRun) return true;
  const q = `mutation {
    move_item_to_group(item_id: ${itemId}, group_id: "${groupId}") { id }
  }`;
  const d = await mondayApi(q);
  return !d.errors;
}

// ─── Main ──────────────────────────────────────────────────────────
(async () => {
  console.log('═'.repeat(55));
  console.log(`  BM Board Housekeeping — ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  ${new Date().toISOString()}`);
  console.log('═'.repeat(55));

  const movedToShipped = [];
  const movedToSaleable = [];
  const errors = [];

  // ── Rule 1: Sold → Shipped ────────────────────────────────────
  // Skip Sat (6), Sun (0), Mon (1) — items sold Fri won't ship until Mon evening
  const dow = new Date().getUTCDay(); // 0=Sun, 1=Mon, ... 6=Sat
  const skipSoldRule = [0, 1, 6].includes(dow);
  const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow];

  if (skipSoldRule) {
    console.log(`\n[Rule 1] Skipping Sold → Shipped (today is ${dayName})`);
  } else {
    console.log(`\n[Rule 1] Scanning saleable group for Sold items...`);
    const saleableItems = await getGroupItems(GROUP_SALEABLE);
    console.log(`  ${saleableItems.length} items in saleable group`);

    for (const item of saleableItems) {
      const status = getStatus(item);
      if (status === 'Sold') {
        // Hard gate: only move to Shipped if Main Board has a tracking number
        const tracked = await hasTracking(item);
        if (!tracked) {
          console.log(`  ⏭ ${item.name} (Sold) — no tracking yet, skipping`);
          continue;
        }
        console.log(`  → ${item.name} (Sold + tracking) → Shipped`);
        const ok = await moveItem(item.id, GROUP_SHIPPED);
        if (ok) {
          movedToShipped.push(item.name);
        } else {
          errors.push(`Failed to move ${item.name} → Shipped`);
          console.error(`  ❌ Failed: ${item.name}`);
        }
        await sleep(200);
      }
    }
    console.log(`  Moved to Shipped: ${movedToShipped.length}`);
  }

  // ── Rule 2: "To List" items in wrong groups → saleable ────────
  console.log(`\n[Rule 2] Scanning ${SCAN_GROUPS.length} groups for stranded To List items...`);

  for (const groupId of SCAN_GROUPS) {
    const items = await getGroupItems(groupId);
    for (const item of items) {
      const status = getStatus(item);
      if (status === 'To List') {
        console.log(`  → ${item.name} (To List, group ${groupId}) → saleable group`);
        const ok = await moveItem(item.id, GROUP_SALEABLE);
        if (ok) {
          movedToSaleable.push(item.name);
        } else {
          errors.push(`Failed to move ${item.name} → saleable group`);
          console.error(`  ❌ Failed: ${item.name}`);
        }
        await sleep(200);
      }
    }
  }
  console.log(`  Moved to saleable: ${movedToSaleable.length}`);

  // ── Summary ───────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(55));

  const lines = ['📋 *BM Board Housekeeping*'];

  if (movedToShipped.length) {
    lines.push(`\n✅ Moved to Shipped (${movedToShipped.length}):`);
    movedToShipped.forEach(n => lines.push(`  • ${n}`));
  }
  if (movedToSaleable.length) {
    lines.push(`\n🏷️ Moved to To List/Listed (${movedToSaleable.length}):`);
    movedToSaleable.forEach(n => lines.push(`  • ${n}`));
  }
  if (errors.length) {
    lines.push(`\n❌ Errors (${errors.length}):`);
    errors.forEach(e => lines.push(`  • ${e}`));
  }
  if (!movedToShipped.length && !movedToSaleable.length && !errors.length) {
    lines.push('\nNo changes needed — board already clean ✨');
  }

  const summary = lines.join('\n');
  console.log(summary);

  if (movedToShipped.length || movedToSaleable.length || errors.length) {
    await postSlack(summary);
  }

  console.log('\n  Done.');
})();
