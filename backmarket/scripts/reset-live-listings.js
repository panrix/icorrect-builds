#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile('/home/ricky/config/api-keys/.env');

const BM_BASE = process.env.BACKMARKET_API_BASE || 'https://www.backmarket.co.uk';
const BM_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'Accept-Language': process.env.BACKMARKET_API_LANG || 'en-gb',
  Authorization: process.env.BACKMARKET_API_AUTH || process.env.BM_AUTH,
  'User-Agent': process.env.BACKMARKET_API_UA || process.env.BM_UA || 'BM-iCorrect-n8n;ricky@icorrect.co.uk',
};
const MONDAY_TOKEN = process.env.MONDAY_APP_TOKEN;

const BM_DEVICES_BOARD = 3892194968;
const MAIN_BOARD = 349212843;
const TO_LIST_INDEX = 8;
const LISTED_INDEX = 7;
const AUDIT_DIR = '/home/ricky/builds/backmarket/audit';

const args = new Set(process.argv.slice(2));
const rawArgs = process.argv.slice(2);
const isSnapshot = args.has('snapshot');
const isOffline = args.has('offline');
const isClearLinks = args.has('clear-links');
const isDryRun = !args.has('--live');
const snapshotIdx = rawArgs.indexOf('--snapshot-file');
const snapshotFile = snapshotIdx !== -1 ? rawArgs[snapshotIdx + 1] : null;

if (!isSnapshot && !isOffline && !isClearLinks) {
  console.error('Usage: reset-live-listings.js <snapshot|offline|clear-links> [--live]');
  process.exit(1);
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function cvMap(item) {
  const out = {};
  for (const cv of item.column_values || []) out[cv.id] = cv;
  return out;
}

async function bm(pathname, opts = {}) {
  const resp = await fetch(BM_BASE + pathname, {
    method: opts.method || 'GET',
    headers: { ...BM_HEADERS, ...(opts.headers || {}) },
    body: opts.body,
  });
  if (!resp.ok) {
    throw new Error(`BM ${resp.status}: ${(await resp.text()).slice(0, 500)}`);
  }
  return resp.json();
}

async function monday(query, variables = {}) {
  const resp = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      Authorization: MONDAY_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!resp.ok) {
    throw new Error(`Monday ${resp.status}: ${(await resp.text()).slice(0, 500)}`);
  }
  const json = await resp.json();
  if (json.errors?.length) {
    throw new Error(`Monday GQL error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

async function fetchAllListings() {
  const all = [];
  let page = 1;
  while (true) {
    console.log(`[snapshot] BM listings page ${page}`);
    const data = await bm(`/ws/listings?page=${page}&page_size=100`);
    const results = data.results || [];
    if (!results.length) break;
    all.push(...results);
    if (!data.next) break;
    page += 1;
  }
  return all;
}

async function fetchAllBmDevices() {
  const all = [];
  let cursor = null;
  let pageNo = 1;

  while (true) {
    console.log(`[snapshot] Monday BM Devices page ${pageNo}`);
    const query = cursor
      ? `query ($cursor: String!) {
          next_items_page(cursor: $cursor, limit: 500) {
            cursor
            items {
              id
              name
              column_values(ids: ["board_relation", "text_mkyd4bx3", "text_mm1dt53s", "text89", "status__1", "color2", "status7__1", "status8__1", "numeric", "numeric_mm1mgcgn"]) {
                id
                text
                ... on BoardRelationValue { linked_item_ids }
                ... on NumbersValue { number }
              }
            }
          }
        }`
      : `query {
          boards(ids: [${BM_DEVICES_BOARD}]) {
            items_page(limit: 500) {
              cursor
              items {
                id
                name
                column_values(ids: ["board_relation", "text_mkyd4bx3", "text_mm1dt53s", "text89", "status__1", "color2", "status7__1", "status8__1", "numeric", "numeric_mm1mgcgn"]) {
                  id
                  text
                  ... on BoardRelationValue { linked_item_ids }
                  ... on NumbersValue { number }
                }
              }
            }
          }
        }`;

    const data = await monday(query, cursor ? { cursor } : {});
    const page = cursor ? data.next_items_page : data.boards?.[0]?.items_page;
    const items = page?.items || [];
    all.push(...items);
    if (!page?.cursor) break;
    cursor = page.cursor;
    pageNo += 1;
  }

  return all;
}

async function fetchMainItems(ids) {
  if (!ids.length) return [];
  const all = [];
  for (let i = 0; i < ids.length; i += 50) {
    console.log(`[snapshot] Monday Main items batch ${i / 50 + 1}`);
    const batch = ids.slice(i, i + 50);
    const query = `query ($ids: [ID!]!) {
      items(ids: $ids) {
        id
        name
        column_values(ids: ["status24", "status_2_Mjj4GJNQ", "status8", "lookup_mkx1xzd7", "formula_mkx1bjqr", "formula__1"]) {
          id
          text
          ... on StatusValue { index }
          ... on MirrorValue { display_value }
          ... on FormulaValue { display_value }
        }
      }
    }`;
    const data = await monday(query, { ids: batch.map(String) });
    all.push(...(data.items || []));
  }
  return all;
}

async function getWorkingSet() {
  if (snapshotFile) {
    const snap = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
    return {
      listings: [],
      liveListings: snap.live_listings || [],
      bmDevices: [],
      affectedDevices: (snap.bm_devices || []).map(item => ({
        id: item.bm_device_item_id,
        name: item.name,
        column_values: [
          { id: 'board_relation', linked_item_ids: item.main_item_ids || [] },
          { id: 'text_mkyd4bx3', text: item.listing_id || '' },
          { id: 'text_mm1dt53s', text: item.stored_uuid || '' },
        ],
      })),
      mainItems: snap.main_items || [],
    };
  }

  const listings = await fetchAllListings();
  const liveListings = listings.filter(l => Number(l.quantity || 0) > 0);
  const bmDevices = await fetchAllBmDevices();
  const liveIds = new Set(liveListings.map(l => String(l.listing_id)));
  const affectedDevices = bmDevices.filter(item => {
    const listingId = cvMap(item).text_mkyd4bx3?.text?.trim();
    return listingId && liveIds.has(listingId);
  });
  const mainIds = [...new Set(affectedDevices.flatMap(item => cvMap(item).board_relation?.linked_item_ids || []).map(String))];
  const mainItems = await fetchMainItems(mainIds);

  return { listings, liveListings, bmDevices, affectedDevices, mainItems };
}

function serializeWorkingSet({ liveListings, affectedDevices, mainItems }) {
  const live = liveListings.map(l => ({
    listing_id: l.listing_id,
    id: l.id,
    sku: l.sku,
    title: l.title,
    grade: l.grade,
    product_id: l.product_id,
    quantity: l.quantity,
    price: l.price,
    backmarket_id: l.backmarket_id,
  }));

  const devices = affectedDevices.map(item => {
    const m = cvMap(item);
    return {
      bm_device_item_id: item.id,
      name: item.name,
      main_item_ids: m.board_relation?.linked_item_ids || [],
      listing_id: m.text_mkyd4bx3?.text || '',
      stored_uuid: m.text_mm1dt53s?.text || '',
      sku: m.text89?.text || '',
      ram: m.status__1?.text || '',
      ssd: m.color2?.text || '',
      cpu: m.status7__1?.text || '',
      gpu: m.status8__1?.text || '',
      purchase_price: m.numeric?.text || m.numeric?.number || '',
      total_fixed_cost: m.numeric_mm1mgcgn?.text || m.numeric_mm1mgcgn?.number || '',
    };
  });

  const main = mainItems.map(item => {
    const m = cvMap(item);
    return {
      main_item_id: item.id,
      name: item.name,
      status24: { text: m.status24?.text || '', index: m.status24?.index ?? null },
      final_grade: { text: m.status_2_Mjj4GJNQ?.text || '', index: m.status_2_Mjj4GJNQ?.index ?? null },
      colour: m.status8?.text || '',
      parts_cost: m.lookup_mkx1xzd7?.display_value || m.lookup_mkx1xzd7?.text || '',
      labour_cost: m.formula_mkx1bjqr?.display_value || m.formula_mkx1bjqr?.text || '',
      labour_hours: m.formula__1?.display_value || m.formula__1?.text || '',
    };
  });

  return {
    created_at: new Date().toISOString(),
    live_listing_count: live.length,
    affected_bm_device_count: devices.length,
    affected_main_item_count: main.length,
    live_listings: live,
    bm_devices: devices,
    main_items: main,
  };
}

function writeAudit(name, data) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
  const file = path.join(AUDIT_DIR, `${name}-${nowStamp()}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

async function setListingOffline(listing) {
  const listingId = listing.listing_id;
  if (isDryRun) {
    return { listing_id: listingId, changed: false, dry_run: true };
  }
  await bm(`/ws/listings/${listingId}`, {
    method: 'POST',
    body: JSON.stringify({ quantity: 0 }),
  });
  const verify = await bm(`/ws/listings/${listingId}`);
  return {
    listing_id: listingId,
    changed: true,
    quantity_after: verify.quantity,
    pub_state: verify.publication_state ?? verify.pub_state ?? null,
  };
}

async function clearBmDeviceListingLink(device) {
  const m = cvMap(device);
  const linkedMainId = (m.board_relation?.linked_item_ids || [])[0];
  const mutation = `mutation {
    clearListing: change_column_value(
      board_id: ${BM_DEVICES_BOARD},
      item_id: ${device.id},
      column_id: "text_mkyd4bx3",
      value: "\\"\\\""
    ) { id }
  }`;

  if (isDryRun) {
    return {
      bm_device_item_id: device.id,
      main_item_id: linkedMainId || null,
      cleared_listing_id: m.text_mkyd4bx3?.text || '',
      dry_run: true,
    };
  }

  await monday(mutation);
  return {
    bm_device_item_id: device.id,
    main_item_id: linkedMainId || null,
    cleared_listing_id: m.text_mkyd4bx3?.text || '',
    changed: true,
  };
}

async function main() {
  const workingSet = await getWorkingSet();
  const summary = serializeWorkingSet(workingSet);

  if (isSnapshot) {
    const outFile = writeAudit('listings-reset-snapshot', summary);
    console.log(JSON.stringify({
      mode: 'snapshot',
      dry_run: isDryRun,
      outFile,
      liveListingCount: summary.live_listing_count,
      liveListingIds: summary.live_listings.map(x => x.listing_id),
      affectedBmDeviceCount: summary.affected_bm_device_count,
      affectedBmDeviceIds: summary.bm_devices.map(x => x.bm_device_item_id),
      affectedMainItemCount: summary.affected_main_item_count,
      affectedMainItemIds: summary.main_items.map(x => x.main_item_id),
    }, null, 2));
  }

  if (isOffline) {
    const results = [];
    for (const listing of workingSet.liveListings) {
      results.push(await setListingOffline(listing));
    }
    const outFile = writeAudit('listings-reset-offline', {
      created_at: new Date().toISOString(),
      dry_run: isDryRun,
      results,
    });
    console.log(JSON.stringify({
      mode: 'offline',
      dry_run: isDryRun,
      outFile,
      results,
    }, null, 2));
  }

  if (isClearLinks) {
    const results = [];
    for (const device of workingSet.affectedDevices) {
      results.push(await clearBmDeviceListingLink(device));
    }
    const outFile = writeAudit('listings-reset-clear-links', {
      created_at: new Date().toISOString(),
      dry_run: isDryRun,
      results,
    });
    console.log(JSON.stringify({
      mode: 'clear-links',
      dry_run: isDryRun,
      outFile,
      results,
    }, null, 2));
  }
}

main().catch(err => {
  console.error(err.stack || err.message || String(err));
  process.exit(1);
});
