#!/usr/bin/env node
/**
 * qc-generate-sku.js
 *
 * QC handoff helper: compute the canonical BM SKU from Main + BM Devices fields.
 * Default mode is dry-run/read-only. --write writes only BM Devices text89, and only
 * for one explicitly supplied --item <MainBoardItemId> after required fields pass.
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env', quiet: true });

const { mondayQuery, BOARDS } = require('./lib/monday');
const { constructBmSku, validateSku } = require('./lib/sku');

const args = process.argv.slice(2);
const itemIdx = args.indexOf('--item');
const MAIN_ITEM_ID = itemIdx !== -1 ? args[itemIdx + 1] : null;
const WRITE = args.includes('--write');
const JSON_OUTPUT = args.includes('--json');

const BM_DEVICES_BOARD = BOARDS.BM_DEVICES;

const MAIN_COLUMNS = ['status_2_Mjj4GJNQ', 'status8'];
const BM_DEVICE_COLUMNS = ['board_relation', 'text89', 'text', 'status__1', 'color2', 'status7__1', 'status8__1', 'lookup'];

function usage() {
  return {
    script: 'scripts/qc-generate-sku.js',
    required: '--item <mainBoardItemId>',
    modes: {
      default: 'dry-run/read-only; no mutations',
      write: '--write writes only BM Devices text89 after validation passes',
    },
    json: '--json',
    guarantees: ['no Back Market API calls', 'no listing mutations', 'no customer/return/warranty actions', 'no notifications'],
  };
}

function columnText(item, id) {
  const col = (item.column_values || []).find(c => c.id === id);
  return col?.text || col?.display_value || '';
}

function linkedIds(item) {
  const rel = (item.column_values || []).find(c => Array.isArray(c.linked_item_ids) && c.linked_item_ids.length);
  return rel?.linked_item_ids || [];
}

function missingFields(specs, gradeText) {
  const missing = [];
  if (!gradeText) missing.push('final_grade');
  for (const key of ['model', 'ram', 'ssd', 'cpu', 'gpu', 'colour']) {
    if (!String(specs?.[key] || '').trim()) missing.push(key);
  }
  return missing;
}

async function loadMainItem(mainItemId) {
  const query = `query ($ids: [ID!]!) {
    items(ids: $ids) {
      id name
      column_values(ids: ${JSON.stringify(MAIN_COLUMNS)}) {
        id text ... on StatusValue { text }
      }
    }
  }`;
  const data = await mondayQuery(query, { ids: [String(mainItemId)] });
  return data.items?.[0] || null;
}

async function findBmDeviceByMainId(mainItemId) {
  let cursor = null;
  while (true) {
    const pagePart = cursor
      ? `next_items_page(limit:200, cursor:${JSON.stringify(cursor)}) { cursor items { id name column_values(ids:${JSON.stringify(BM_DEVICE_COLUMNS)}) { id text ... on BoardRelationValue { linked_item_ids } ... on MirrorValue { display_value } } } }`
      : `boards(ids:[${BM_DEVICES_BOARD}]) { items_page(limit:200) { cursor items { id name column_values(ids:${JSON.stringify(BM_DEVICE_COLUMNS)}) { id text ... on BoardRelationValue { linked_item_ids } ... on MirrorValue { display_value } } } } }`;
    const data = await mondayQuery(`{ ${pagePart} }`);
    const page = cursor ? data.next_items_page : data.boards?.[0]?.items_page;
    for (const item of page?.items || []) {
      if (linkedIds(item).map(String).includes(String(mainItemId))) return item;
    }
    if (!page?.cursor) break;
    cursor = page.cursor;
  }
  return null;
}

async function writeSku(bmDeviceId, expectedSku) {
  const mutation = `mutation ($boardId: ID!, $itemId: ID!, $value: String!) {
    change_simple_column_value(board_id: $boardId, item_id: $itemId, column_id: "text89", value: $value) { id }
  }`;
  return mondayQuery(mutation, {
    boardId: String(BM_DEVICES_BOARD),
    itemId: String(bmDeviceId),
    value: String(expectedSku),
  });
}

async function buildResult(mainItemId) {
  const mainItem = await loadMainItem(mainItemId);
  if (!mainItem) {
    return { ok: false, mode: WRITE ? 'write' : 'dry-run', main_item_id: String(mainItemId), classification: 'MISSING_MAIN_ITEM', error: 'Main item not found' };
  }

  const bmDevice = await findBmDeviceByMainId(mainItemId);
  if (!bmDevice) {
    return { ok: false, mode: WRITE ? 'write' : 'dry-run', main_item_id: String(mainItemId), item_name: mainItem.name, classification: 'MISSING_BM_DEVICE_RELATION', error: 'No BM Devices row linked back via board_relation' };
  }

  const gradeText = columnText(mainItem, 'status_2_Mjj4GJNQ');
  const specs = {
    model: columnText(bmDevice, 'text'),
    ram: columnText(bmDevice, 'status__1'),
    ssd: columnText(bmDevice, 'color2'),
    cpu: columnText(bmDevice, 'status7__1'),
    gpu: columnText(bmDevice, 'status8__1'),
    colour: columnText(mainItem, 'status8'),
    deviceName: columnText(bmDevice, 'lookup') || bmDevice.name || '',
  };
  if (!specs.model && specs.deviceName) {
    const aMatch = specs.deviceName.match(/A\d{4}/);
    if (aMatch) specs.model = aMatch[0];
  }

  const missing = missingFields(specs, gradeText);
  if (missing.length) {
    return { ok: false, mode: WRITE ? 'write' : 'dry-run', main_item_id: String(mainItemId), item_name: mainItem.name, bm_device_id: String(bmDevice.id), classification: missing.includes('final_grade') ? 'MISSING_FINAL_GRADE' : 'MISSING_SPEC_FIELD', missing_fields: missing, specs, storedSku: columnText(bmDevice, 'text89') || null, expectedSku: null };
  }

  const expectedSku = constructBmSku(specs, gradeText);
  const storedSku = columnText(bmDevice, 'text89');
  const validation = validateSku({ storedSku, expectedSku });
  return {
    ok: validation.ok || validation.code === 'QC_SKU_MISSING',
    mode: WRITE ? 'write' : 'dry-run',
    main_item_id: String(mainItemId),
    item_name: mainItem.name,
    bm_device_id: String(bmDevice.id),
    classification: validation.code,
    write_required: validation.code === 'QC_SKU_MISSING' || validation.code === 'QC_SKU_MISMATCH',
    storedSku: validation.storedSku,
    expectedSku: validation.expectedSku,
    specs,
  };
}

async function main() {
  if (!MAIN_ITEM_ID) {
    const payload = { ok: false, error: '--item <mainBoardItemId> is required', usage: usage() };
    console.error(JSON.stringify(payload, null, 2));
    process.exit(2);
  }

  const result = await buildResult(MAIN_ITEM_ID);
  if (WRITE) {
    if (!result.ok || !result.expectedSku) {
      result.write_attempted = false;
      result.write_error = 'Required fields/relations did not pass; text89 not written';
      console.log(JSON.stringify(result, null, 2));
      process.exit(1);
    }
    if (result.classification === 'SKU_MATCH') {
      result.write_attempted = false;
      result.write_result = 'stored SKU already matches expected SKU';
    } else {
      await writeSku(result.bm_device_id, result.expectedSku);
      result.write_attempted = true;
      result.write_result = 'BM Devices text89 updated';
    }
  } else {
    result.write_attempted = false;
  }

  if (JSON_OUTPUT || WRITE) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`QC SKU dry-run for Main item ${result.main_item_id}`);
    console.log(`classification: ${result.classification}`);
    console.log(`storedSku: ${result.storedSku || '(missing)'}`);
    console.log(`expectedSku: ${result.expectedSku || '(unavailable)'}`);
    if (result.missing_fields?.length) console.log(`missing: ${result.missing_fields.join(', ')}`);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(JSON.stringify({ ok: false, error: error.message, usage: usage() }, null, 2));
    process.exit(1);
  });
}

module.exports = { usage, columnText, linkedIds, missingFields, buildResult };
