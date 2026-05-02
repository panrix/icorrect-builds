#!/usr/bin/env node

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env', quiet: true });

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { mondayQuery, BOARDS } = require('./lib/monday');
const { BM_API_HEADERS } = require('./lib/bm-api');

const DATA_DIR = '/home/ricky/builds/backmarket/data';
const ROLLBACK_LOG_PATH = '/home/ricky/builds/backmarket/docs/rollback-log.md';
const TODAY = new Date().toISOString().slice(0, 10);
const BM_BASE = process.env.BACKMARKET_API_BASE || 'https://www.backmarket.co.uk';
const BM_DEVICES_BOARD = BOARDS.BM_DEVICES;
const MAIN_BOARD = BOARDS.MAIN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const BM_TELEGRAM_CHAT = '-1003888456344';
const DRY_RUN_FLAG = process.argv.includes('--dry-run');
const LIVE_FLAG = process.argv.includes('--live');
const IS_LIVE = LIVE_FLAG;
const IS_DRY_RUN = !IS_LIVE;
const MODE_TAG = IS_LIVE ? '[LIVE]' : '[DRY-RUN]';

if (!LIVE_FLAG && !DRY_RUN_FLAG) {
  console.warn('⚠️ No mode flag passed — defaulting to --dry-run.');
}

function getArgValue(flag, fallback = '') {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) return fallback;
  return process.argv[index + 1];
}

const LIMIT = Math.max(parseInt(getArgValue('--limit', '10'), 10) || 10, 1);
const BATCH_ID = getArgValue('--batch-id', '') || `stuck-inventory-${TODAY}-${Date.now()}`;
const FILE_OVERRIDE = getArgValue('--file', '');

function escapeGraphqlString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function fmtMoney(value) {
  return `£${roundMoney(value).toFixed(2)}`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell);
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).map(values => {
    const record = {};
    header.forEach((key, position) => {
      record[key] = values[position] !== undefined ? values[position] : '';
    });
    return record;
  });
}

function latestAuditCsvPath() {
  if (FILE_OVERRIDE) return FILE_OVERRIDE;
  const files = fs.readdirSync(DATA_DIR)
    .filter(entry => /^stuck-inventory-\d{4}-\d{2}-\d{2}\.csv$/.test(entry))
    .sort();
  if (files.length === 0) {
    throw new Error('No stuck-inventory-YYYY-MM-DD.csv file found in data/');
  }
  return path.join(DATA_DIR, files[files.length - 1]);
}

async function postTelegram(text) {
  if (IS_DRY_RUN) return;
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('[TG] TELEGRAM_BOT_TOKEN not set; skipping Telegram summary.');
    return;
  }
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: BM_TELEGRAM_CHAT, text }),
  });
}

async function bmApiFetch(urlPath, options = {}) {
  const url = urlPath.startsWith('http') ? urlPath : `${BM_BASE}${urlPath}`;
  const headers = { ...BM_API_HEADERS, ...(options.headers || {}) };
  const response = await fetch(url, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`BM API ${response.status} ${urlPath}: ${body.slice(0, 200)}`);
  }
  return response.json();
}

async function getMainStatuses(mainItemIds) {
  if (mainItemIds.length === 0) return new Map();
  const map = new Map();

  for (let index = 0; index < mainItemIds.length; index += 50) {
    const batch = mainItemIds.slice(index, index + 50);
    const query = `query ($ids: [ID!]!) {
      items(ids: $ids) {
        id
        column_values(ids: ["status24"]) {
          id
          text
          ... on StatusValue { index }
        }
      }
    }`;
    const data = await mondayQuery(query, { ids: batch.map(String) });
    for (const item of data.items || []) {
      const statusColumn = item.column_values.find(column => column.id === 'status24');
      map.set(String(item.id), {
        statusText: statusColumn?.text || '',
        statusIndex: statusColumn?.index ?? null,
      });
    }
  }

  return map;
}

async function getBmDeviceGroups(itemIds) {
  if (itemIds.length === 0) return new Map();
  const map = new Map();

  for (let index = 0; index < itemIds.length; index += 50) {
    const batch = itemIds.slice(index, index + 50);
    const query = `query ($ids: [ID!]!) {
      items(ids: $ids) {
        id
        group { id title }
      }
    }`;
    const data = await mondayQuery(query, { ids: batch.map(String) });
    for (const item of data.items || []) {
      map.set(String(item.id), {
        groupId: item.group?.id || '',
        groupTitle: item.group?.title || '',
      });
    }
  }

  return map;
}

async function findScrappedGroup() {
  const query = `query {
    boards(ids:[${BM_DEVICES_BOARD}]) {
      groups { id title }
    }
  }`;
  const data = await mondayQuery(query);
  const groups = data.boards?.[0]?.groups || [];
  return groups.find(group => /scrap/i.test(group.title)) || null;
}

async function moveBmDeviceToGroup(itemId, groupId) {
  const query = `mutation {
    move_item_to_group(item_id: ${itemId}, group_id: "${escapeGraphqlString(groupId)}") { id }
  }`;
  return mondayQuery(query);
}

async function runListDevice(row) {
  const command = [
    'node',
    '/home/ricky/builds/backmarket/scripts/list-device.js',
    '--live',
    '--min-margin',
    '0',
    '--item',
    String(row.main_board_item_id),
    '--price',
    String(row.market_price_gbp),
  ];

  if (IS_DRY_RUN) {
    console.log(`${MODE_TAG} Would run: ${command.join(' ')}`);
    return { dryRun: true, command: command.join(' ') };
  }

  const result = spawnSync(command[0], command.slice(1), {
    cwd: '/home/ricky/builds/backmarket',
    encoding: 'utf8',
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`list-device.js exited with status ${result.status}`);
  }
  return {
    dryRun: false,
    command: command.join(' '),
    stdout: result.stdout || '',
  };
}

async function updateLiveListingPrice(row) {
  const listingId = String(row.listing_id || '').trim();
  if (!listingId) {
    throw new Error('LIST_AT_LOSS for Listed item requires listing_id');
  }

  const targetPrice = roundMoney(parseFloat(row.market_price_gbp) || 0);
  const before = IS_LIVE ? await bmApiFetch(`/ws/listings/${listingId}`) : null;

  if (IS_DRY_RUN) {
    console.log(`${MODE_TAG} Would update listing ${listingId} to price=${targetPrice} min_price=${targetPrice}`);
    return {
      dryRun: true,
      listingId,
      targetPrice,
      before: null,
    };
  }

  await bmApiFetch(`/ws/listings/${listingId}`, {
    method: 'POST',
    body: JSON.stringify({
      price: targetPrice,
      min_price: targetPrice,
      currency: 'GBP',
    }),
  });

  return {
    dryRun: false,
    listingId,
    targetPrice,
    before: before
      ? {
          price: before.price ?? null,
          min_price: before.min_price ?? null,
          quantity: before.quantity ?? null,
          pub_state: before.publication_state ?? before.pub_state ?? null,
        }
      : null,
  };
}

function appendJsonl(filePath, prefix, entry) {
  fs.appendFileSync(filePath, `${prefix}${JSON.stringify(entry)}\n`);
}

function appendRollbackEntry(summary) {
  const timestamp = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC');
  const lines = [
    '',
    `## ${timestamp} — Phase 1.3 — stuck-inventory-execute ${IS_LIVE ? 'live batch' : 'dry-run batch'} (${summary.batchId})`,
    '',
    `**What changed:** Processed ${summary.executed} row(s), skipped ${summary.skipped}, errored ${summary.errored}.`,
    `**Files touched:** \`${summary.logPath}\`${summary.liveWrites ? `, \`${summary.csvPath}\`` : ''}`,
    '**Rollback command(s):**',
  ];

  if (IS_DRY_RUN) {
    lines.push('```bash');
    lines.push('# Dry-run only; no external rollback required.');
    lines.push('```');
  } else {
    lines.push('```bash');
    lines.push(`node - <<'NODE'`);
    lines.push(`const fs = require('fs');`);
    lines.push(`const log = '${summary.logPath}';`);
    lines.push(`const batchId = '${summary.batchId}';`);
    lines.push(`for (const line of fs.readFileSync(log, 'utf8').trim().split('\\n')) {`);
    lines.push(`  const entry = JSON.parse(line);`);
    lines.push(`  if (entry.batch_id !== batchId || !entry.rollback_hint) continue;`);
    lines.push(`  console.log(entry.rollback_hint);`);
    lines.push(`}`);
    lines.push('NODE');
    lines.push('```');
  }

  fs.appendFileSync(ROLLBACK_LOG_PATH, `${lines.join('\n')}\n`);
}

async function main() {
  const csvPath = latestAuditCsvPath();
  const logPath = path.join(DATA_DIR, `stuck-inventory-executions-${TODAY}.jsonl`);
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const actionableRows = rows.filter(row => String(row.ACTION || '').trim() !== '');
  const selectedRows = actionableRows.slice(0, LIMIT);
  const mainStatusById = await getMainStatuses(selectedRows.map(row => row.main_board_item_id));
  const bmGroupById = await getBmDeviceGroups(selectedRows.map(row => row.item_id));
  const scrappedGroup = await findScrappedGroup();

  console.log(`stuck-inventory-execute.js ${MODE_TAG}`);
  console.log(`CSV: ${csvPath}`);
  console.log(`Batch ID: ${BATCH_ID}`);
  console.log(`Rows with ACTION: ${actionableRows.length}`);
  console.log(`Processing limit: ${LIMIT}`);

  const summary = {
    batchId: BATCH_ID,
    csvPath,
    logPath,
    executed: 0,
    skipped: 0,
    errored: 0,
    cashReleased: 0,
    liveWrites: false,
  };

  for (const row of selectedRows) {
    const entry = {
      timestamp: new Date().toISOString(),
      batch_id: BATCH_ID,
      mode: IS_DRY_RUN ? 'dry-run' : 'live',
      item_id: row.item_id,
      main_board_item_id: row.main_board_item_id,
      listing_id: row.listing_id,
      proposed_action: row.proposed_action,
      action: row.ACTION,
      notes: row.notes || '',
      market_price_gbp: parseFloat(row.market_price_gbp) || 0,
      cost_basis_gbp: parseFloat(row.cost_basis_gbp) || 0,
      status: 'pending',
    };

    const conflict = row.proposed_action !== row.ACTION && !String(row.notes || '').includes('CONFLICT:');
    if (conflict) {
      console.warn(`CONFLICT item ${row.item_id}: ACTION=${row.ACTION} proposed_action=${row.proposed_action}. Skipping.`);
      entry.status = 'skipped';
      entry.reason = 'conflict_without_note';
      appendJsonl(logPath, IS_DRY_RUN ? 'DRY-RUN ' : '', entry);
      summary.skipped += 1;
      continue;
    }

    try {
      const mainStatus = mainStatusById.get(String(row.main_board_item_id)) || { statusText: '' };
      const bmGroup = bmGroupById.get(String(row.item_id)) || { groupId: '', groupTitle: '' };

      if (row.ACTION === 'LIST_AT_LOSS') {
        if (mainStatus.statusText === 'Listed' || String(row.listing_id || '').trim()) {
          const update = await updateLiveListingPrice(row);
          entry.status = 'executed';
          entry.execution = {
            kind: 'bm_price_update',
            listing_id: update.listingId,
            target_price: update.targetPrice,
            previous: update.before,
          };
          if (update.before) {
            entry.rollback_hint = `Restore listing ${update.listingId} to price=${update.before.price} min_price=${update.before.min_price}`;
          }
        } else {
          const result = await runListDevice(row);
          entry.status = 'executed';
          entry.execution = {
            kind: 'list_device',
            command: result.command,
          };
          entry.rollback_hint = `Review ${logPath} batch ${BATCH_ID}: LIST_AT_LOSS via list-device may require taking the created listing offline manually.`;
        }
        summary.executed += 1;
        summary.cashReleased += parseFloat(row.market_price_gbp) || 0;
        if (IS_LIVE) summary.liveWrites = true;
      } else if (row.ACTION === 'SALVAGE' || row.ACTION === 'LOGIC_BOARD_DONOR') {
        const message = `Ricky moves physical device to parts bench; Phase 3.3 wires Parts Board columns.`;
        console.log(`${MODE_TAG} ${row.ACTION} item ${row.item_id}: ${message}`);
        entry.status = 'executed';
        entry.execution = { kind: 'log_only', message };
        entry.rollback_hint = 'No system mutation; no rollback required.';
        summary.executed += 1;
      } else if (row.ACTION === 'SCRAP') {
        if (!scrappedGroup) {
          console.warn(`No "Scrapped" group exists on BM Devices board. Item ${row.item_id} skipped.`);
          entry.status = 'skipped';
          entry.reason = 'scrapped_group_missing';
          entry.warning = 'Create a "Scrapped" group on BM Devices board before rerunning SCRAP rows.';
          summary.skipped += 1;
        } else if (IS_DRY_RUN) {
          console.log(`${MODE_TAG} Would move BM Device ${row.item_id} from "${bmGroup.groupTitle}" to "${scrappedGroup.title}"`);
          entry.status = 'executed';
          entry.execution = {
            kind: 'move_item_to_group',
            from_group_id: bmGroup.groupId,
            to_group_id: scrappedGroup.id,
            to_group_title: scrappedGroup.title,
          };
          entry.rollback_hint = `Move item ${row.item_id} back to ${bmGroup.groupId}`;
          summary.executed += 1;
        } else {
          await moveBmDeviceToGroup(row.item_id, scrappedGroup.id);
          entry.status = 'executed';
          entry.execution = {
            kind: 'move_item_to_group',
            from_group_id: bmGroup.groupId,
            to_group_id: scrappedGroup.id,
            to_group_title: scrappedGroup.title,
          };
          entry.rollback_hint = `Move item ${row.item_id} back to ${bmGroup.groupId}`;
          summary.executed += 1;
          summary.liveWrites = true;
        }
      } else {
        console.warn(`Unknown ACTION "${row.ACTION}" for item ${row.item_id}. Skipping.`);
        entry.status = 'skipped';
        entry.reason = 'unknown_action';
        summary.skipped += 1;
      }
    } catch (error) {
      console.error(`Error on item ${row.item_id}: ${error.message}`);
      entry.status = 'error';
      entry.error = error.message;
      summary.errored += 1;
    }

    appendJsonl(logPath, IS_DRY_RUN ? 'DRY-RUN ' : '', entry);
  }

  const summaryLines = [
    `Stuck inventory execute ${TODAY} (${IS_DRY_RUN ? 'dry-run' : 'live'})`,
    `Batch: ${BATCH_ID}`,
    `Executed: ${summary.executed}`,
    `Cash released: ${fmtMoney(summary.cashReleased)}`,
    `Skipped: ${summary.skipped}`,
    `Errored: ${summary.errored}`,
  ];

  console.log(summaryLines.join('\n'));
  await postTelegram(summaryLines.join('\n'));
  appendRollbackEntry(summary);
}

main().catch(error => {
  console.error(`Execution failed: ${error.message}`);
  process.exit(1);
});
