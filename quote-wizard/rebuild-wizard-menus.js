#!/usr/bin/env node
'use strict';

/**
 * Quote Wizard Menu Builder
 * 
 * Fetches all Shopify collections, filters to per-model collections,
 * groups them by device and series, and creates 4 navigation menus
 * via the Shopify GraphQL Admin API.
 * 
 * Usage:
 *   node rebuild-wizard-menus.js --dry-run   # Preview without creating menus
 *   node rebuild-wizard-menus.js             # Create/update menus on Shopify
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });

const https = require('https');

const STORE = 'i-correct-final.myshopify.com';
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-10';
const DRY_RUN = process.argv.includes('--dry-run');
const STORE_URL = 'https://icorrect.co.uk';

if (!TOKEN) { console.error('Missing SHOPIFY_ACCESS_TOKEN'); process.exit(1); }

// ============================================================
// SHOPIFY API HELPERS
// ============================================================

function shopifyGraphQL(query, variables) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    const req = https.request({
      hostname: STORE,
      path: `/admin/api/${API_VERSION}/graphql.json`,
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.errors && parsed.errors.length) {
            reject(new Error(JSON.stringify(parsed.errors)));
          } else {
            resolve(parsed.data);
          }
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function shopifyREST(endpoint) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: STORE,
      path: `/admin/api/${API_VERSION}${endpoint}`,
      headers: { 'X-Shopify-Access-Token': TOKEN }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// FETCH ALL COLLECTIONS (paginated)
// ============================================================

async function fetchAllCollections() {
  let all = [];
  let url = '/custom_collections.json?limit=250&fields=id,handle,title';
  while (url) {
    const data = await shopifyREST(url);
    all = all.concat(data.custom_collections || []);
    // Check for pagination via Link header — simplified: if we got 250, there might be more
    if ((data.custom_collections || []).length === 250) {
      const lastId = data.custom_collections[data.custom_collections.length - 1].id;
      url = `/custom_collections.json?limit=250&fields=id,handle,title&since_id=${lastId}`;
    } else {
      url = null;
    }
    await sleep(500);
  }
  // Also fetch smart collections
  url = '/smart_collections.json?limit=250&fields=id,handle,title';
  while (url) {
    const data = await shopifyREST(url);
    all = all.concat(data.smart_collections || []);
    if ((data.smart_collections || []).length === 250) {
      const lastId = data.smart_collections[data.smart_collections.length - 1].id;
      url = `/smart_collections.json?limit=250&fields=id,handle,title&since_id=${lastId}`;
    } else {
      url = null;
    }
    await sleep(500);
  }
  return all;
}

// ============================================================
// COLLECTION FILTERING — THE CRITICAL PART
// ============================================================

// These are repair-TYPE collections (not per-model). Exclude them.
const REPAIR_TYPE_HANDLES = new Set([
  'macbook-repair-prices', 'macbook-screen-repair-prices', 'macbook-battery-repair-prices',
  'macbook-keyboard-repair-prices', 'macbook-trackpad-repair-prices', 'macbook-charging-port-repair-prices',
  'macbook-diagnostic-prices', 'macbook-dustgate-repair-prices', 'macbook-flexgate-repair-prices',
  'macbook-touch-bar-repair-prices',
  'iphone-repair-prices', 'iphone-screen-repair-prices', 'iphone-genuine-screen-repair-prices',
  'iphone-battery-repair-prices', 'iphone-rear-glass-repair-prices', 'iphone-rear-housing-repair-prices',
  'iphone-rear-camera-repair-prices', 'iphone-rear-camera-lens-repair-prices',
  'iphone-front-camera-repair-prices', 'iphone-face-id-repair-prices',
  'iphone-charging-port-repair-prices', 'iphone-earpiece-speaker-repair-prices',
  'iphone-loudspeaker-repair-prices', 'iphone-microphone-repair-prices',
  'iphone-volume-button-repair-prices', 'iphone-power-button-repair-prices',
  'iphone-home-button-repair-prices', 'iphone-diagnostic-prices',
  'ipad-repair-prices', 'ipad-screen-repair-prices', 'ipad-lcd-display-repair-prices',
  'ipad-battery-repair-prices', 'ipad-charging-port-repair-prices', 'ipad-diagnostic-prices',
  'apple-watch-repair-prices', 'apple-watch-screen-glass-only-repair-prices',
  'apple-watch-oled-display-repair-prices', 'apple-watch-diagnostic-prices',
  'apple-watch-battery-repair-prices', 'apple-watch-rear-housing-repair-prices',
  'apple-watch-heart-rate-monitor-repair-prices', 'apple-watch-crown-repair-prices',
  'apple-watch-side-button-repair-prices',
  'all-devices-repair-prices', 'iphone-mute-button-repair-prices',
  'digital-goods-vat-tax'
]);

// Series-level collections (not per-model). Exclude them.
const SERIES_HANDLES = new Set([
  'iphone-16-series-repair-prices', 'iphone-15-series-repair-prices',
  'iphone-14-series-repair-prices', 'iphone-13-series-repair-prices',
  'iphone-12-series-repair-prices', 'iphone-11-series-repair-prices',
  'iphone-x-series-repair-prices', 'iphone-8-series-repair-prices',
  'iphone-7-series-repair-prices', 'iphone-se-series-repair-prices',
  'apple-watch-se-series-repair-prices', 'apple-watch-se2-series-repair-prices',
  'apple-watch-3-series-repair-prices', 'apple-watch-series-4-repair-prices',
  'apple-watch-series-5-repair-prices', 'apple-watch-series-6-repair-prices',
  'apple-watch-series-7-repair-prices', 'apple-watch-series-8-repair-prices',
  'apple-watch-series-9-repair-prices', 'apple-watch-series-10-repair-prices',
  // Note: apple-watch-ultra-repair-prices is a model collection (Ultra 1), NOT a series collection
  'ipad-pro-repair-prices', 'ipad-air-repair-prices', 'ipad-mini-repair-prices',
  'standard-ipad-repair-prices',
  'macbook-pro-16-repair-prices', 'macbook-pro-15-repair-prices',
  'macbook-pro-14-repair-prices', 'macbook-pro-13-repair-prices',
  'macbook-air-15-repair-prices', 'macbook-air-13-repair-prices',
]);

function isModelCollection(handle) {
  if (!handle.endsWith('-repair-prices')) return false;
  if (REPAIR_TYPE_HANDLES.has(handle)) return false;
  if (SERIES_HANDLES.has(handle)) return false;
  return true;
}

function getDevice(handle) {
  if (handle.startsWith('macbook-')) return 'macbook';
  if (handle.startsWith('iphone-')) return 'iphone';
  if (handle.startsWith('ipad-')) return 'ipad';
  if (handle.startsWith('apple-watch-')) return 'watch';
  return null;
}

// ============================================================
// GROUPING LOGIC
// ============================================================

function getGroup(device, title) {
  title = title.replace(/ Repair Prices$/i, '').trim();

  if (device === 'macbook') {
    if (/Pro 16/i.test(title)) return 'MacBook Pro 16"';
    if (/Pro 15/i.test(title)) return 'MacBook Pro 15"';
    if (/Pro 14/i.test(title)) return 'MacBook Pro 14"';
    if (/Pro 13/i.test(title)) return 'MacBook Pro 13"';
    if (/Air 15/i.test(title)) return 'MacBook Air 15"';
    if (/Air 13/i.test(title)) return 'MacBook Air 13"';
    return 'Other MacBook';
  }

  if (device === 'iphone') {
    if (/iPhone 16/i.test(title)) return 'iPhone 16 series';
    if (/iPhone 15/i.test(title)) return 'iPhone 15 series';
    if (/iPhone 14/i.test(title)) return 'iPhone 14 series';
    if (/iPhone 13/i.test(title)) return 'iPhone 13 series';
    return 'Older iPhones';
  }

  if (device === 'ipad') {
    if (/iPad Pro/i.test(title)) return 'iPad Pro';
    if (/iPad Air/i.test(title)) return 'iPad Air';
    return 'iPad + iPad Mini';
  }

  if (device === 'watch') {
    if (/Ultra/i.test(title)) return 'Apple Watch Ultra';
    if (/Series/i.test(title)) return 'Apple Watch Series';
    if (/SE/i.test(title)) return 'Apple Watch SE';
    return 'Other Apple Watch';
  }

  return 'Other';
}

function extractYear(title) {
  const match = title.match(/\((\d{4})\)/);
  if (match) return parseInt(match[1]);
  // Watch titles like "Apple Watch Series 10 45MM" don't have years
  // Use series number as proxy
  const seriesMatch = title.match(/Series (\d+)/i);
  if (seriesMatch) return 2015 + parseInt(seriesMatch[1]); // rough mapping
  const ultraMatch = title.match(/Ultra (\d)/i);
  if (ultraMatch) return 2021 + parseInt(ultraMatch[1]);
  if (/Ultra(?!\s*\d)/i.test(title)) return 2022;
  return 0;
}

function cleanTitle(title) {
  // Remove " Repair Prices" suffix for display
  return title.replace(/ Repair Prices$/i, '').trim();
}

// Group order for consistent menu structure
const GROUP_ORDER = {
  macbook: ['MacBook Pro 16"', 'MacBook Pro 15"', 'MacBook Pro 14"', 'MacBook Pro 13"', 'MacBook Air 15"', 'MacBook Air 13"'],
  iphone: ['iPhone 16 series', 'iPhone 15 series', 'iPhone 14 series', 'iPhone 13 series', 'Older iPhones'],
  ipad: ['iPad Pro', 'iPad Air', 'iPad + iPad Mini'],
  watch: ['Apple Watch Ultra', 'Apple Watch Series', 'Apple Watch SE']
};

// ============================================================
// MENU CREATION VIA GRAPHQL
// ============================================================

async function findExistingMenu(handle) {
  const data = await shopifyGraphQL(`{
    menus(first: 50) {
      edges { node { id title handle } }
    }
  }`);
  const menus = data.menus.edges.map(e => e.node);
  return menus.find(m => m.handle === handle) || null;
}

async function deleteMenu(id) {
  await shopifyGraphQL(`mutation { menuDelete(id: "${id}") { deletedMenuId userErrors { field message } } }`);
}

async function createMenu(handle, title, groups, collections) {
  // Build nested menu items
  const items = [];
  const orderedGroups = GROUP_ORDER[getDeviceFromHandle(handle)] || Object.keys(groups);

  for (const groupName of orderedGroups) {
    if (!groups[groupName] || groups[groupName].length === 0) continue;

    const children = groups[groupName]
      .sort((a, b) => extractYear(b.title) - extractYear(a.title))
      .map(c => ({
        title: cleanTitle(c.title),
        type: 'HTTP',
        url: `${STORE_URL}/collections/${c.handle}`
      }));

    items.push({
      title: groupName,
      type: 'HTTP',
      url: `${STORE_URL}/#`,
      items: children
    });
  }

  if (DRY_RUN) {
    console.log(`\n  [DRY RUN] Would create menu "${handle}" with:`);
    for (const item of items) {
      console.log(`    ${item.title}: ${item.items.length} models`);
      for (const child of item.items) {
        console.log(`      - ${child.title}`);
      }
    }
    return;
  }

  // Check for existing menu and delete it (update = delete + recreate for clean state)
  const existing = await findExistingMenu(handle);
  if (existing) {
    console.log(`  Deleting existing menu "${handle}" (${existing.id})`);
    await deleteMenu(existing.id);
    await sleep(500);
  }

  // Create new menu
  const data = await shopifyGraphQL(
    `mutation menuCreate($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
      menuCreate(title: $title, handle: $handle, items: $items) {
        menu { id title handle }
        userErrors { field message }
      }
    }`,
    { title, handle, items }
  );

  if (data.menuCreate.userErrors.length > 0) {
    console.error(`  ERROR creating ${handle}:`, data.menuCreate.userErrors);
    return;
  }

  console.log(`  ✅ Created menu "${handle}" (${data.menuCreate.menu.id})`);
}

function getDeviceFromHandle(menuHandle) {
  if (menuHandle.includes('macbook')) return 'macbook';
  if (menuHandle.includes('iphone')) return 'iphone';
  if (menuHandle.includes('ipad')) return 'ipad';
  if (menuHandle.includes('watch')) return 'watch';
  return null;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(`\n🎯 Quote Wizard Menu Builder ${DRY_RUN ? '(DRY RUN)' : ''}\n`);

  // 1. Fetch all collections
  console.log('Fetching collections from Shopify...');
  const allCollections = await fetchAllCollections();
  console.log(`  Found ${allCollections.length} total collections`);

  // 2. Filter to per-model collections and group by device
  const deviceGroups = { macbook: {}, iphone: {}, ipad: {}, watch: {} };
  let modelCount = 0;

  for (const col of allCollections) {
    if (!isModelCollection(col.handle)) continue;
    const device = getDevice(col.handle);
    if (!device) continue;

    const group = getGroup(device, col.title);
    if (!deviceGroups[device][group]) deviceGroups[device][group] = [];
    deviceGroups[device][group].push(col);
    modelCount++;
  }

  console.log(`  Filtered to ${modelCount} per-model collections\n`);

  // 3. Log what we found
  for (const [device, groups] of Object.entries(deviceGroups)) {
    const total = Object.values(groups).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`${device.toUpperCase()} (${total} models):`);
    const orderedGroups = GROUP_ORDER[device] || Object.keys(groups);
    for (const groupName of orderedGroups) {
      if (!groups[groupName]) continue;
      console.log(`  ${groupName}: ${groups[groupName].length} models`);
    }
  }

  // 4. Create menus
  const menuDefs = [
    { handle: 'wizard-macbook-models', title: 'Wizard: MacBook Models', device: 'macbook' },
    { handle: 'wizard-iphone-models', title: 'Wizard: iPhone Models', device: 'iphone' },
    { handle: 'wizard-ipad-models', title: 'Wizard: iPad Models', device: 'ipad' },
    { handle: 'wizard-watch-models', title: 'Wizard: Watch Models', device: 'watch' }
  ];

  console.log(`\nCreating menus...\n`);

  for (const def of menuDefs) {
    try {
      console.log(`📋 ${def.handle}`);
      await createMenu(def.handle, def.title, deviceGroups[def.device], allCollections);
      await sleep(500);
    } catch (err) {
      console.error(`  ❌ Failed to create ${def.handle}:`, err.message);
    }
  }

  console.log(`\n✅ Done. ${modelCount} models across 4 menus.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
