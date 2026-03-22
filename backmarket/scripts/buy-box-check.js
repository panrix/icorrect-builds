#!/usr/bin/env node
/**
 * buy-box-check.js — SOP 07: Buy Box Management (Sell Side)
 *
 * Steps from SOP 07:
 * 1. Get all active listings (qty > 0)
 * 2. Check buy box via backbox API (UUID, not listing_id)
 * 3-5. Profitability analysis at current + win price
 * 6. Apply bump if --auto-bump and margin gate passes
 * 7. Age-based escalation
 * 8. Grade ladder integrity check
 * 9. Quantity verification (TODO: needs Monday cross-check)
 * 10. Report to BM Telegram
 *
 * Usage:
 *   node buy-box-check.js              # Check only
 *   node buy-box-check.js --auto-bump  # Check + apply profitable bumps
 */

require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });
const fs = require('fs');

// ─── Config ───────────────────────────────────────────────────────
const BM_BASE = 'https://www.backmarket.co.uk';
const BM_AUTH = process.env.BACKMARKET_API_AUTH;
const BM_LANG = process.env.BACKMARKET_API_LANG || 'en-gb';
const BM_UA = process.env.BACKMARKET_API_UA;
const MONDAY_TOKEN = process.env.MONDAY_APP_TOKEN;

const BM_DEVICES_BOARD = 3892194968;
const MAIN_BOARD = 349212843;
const BM_SELL_FEE_RATE = 0.10;
const VAT_RATE = 0.1667;
const MIN_PRICE_FACTOR = 0.97;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BM_TELEGRAM_CHAT = '-1003888456344';

const autoBump = process.argv.includes('--auto-bump');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── API helpers ──────────────────────────────────────────────────
async function bmApi(path, opts = {}) {
  const r = await fetch(BM_BASE + path, {
    method: opts.method || 'GET',
    headers: { Authorization: BM_AUTH, 'Accept-Language': BM_LANG, 'User-Agent': BM_UA, 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`BM ${r.status} ${path}: ${t.slice(0, 200)}`); }
  return r.json();
}

async function mondayApi(query) {
  const r = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: { Authorization: MONDAY_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return r.json();
}

async function postTelegram(msg) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: BM_TELEGRAM_CHAT, text: msg, parse_mode: 'HTML' }),
    });
  } catch (e) { console.warn(`  Telegram failed: ${e.message}`); }
}

// ─── Step 1: Get active listings ──────────────────────────────────
async function getActiveListings() {
  const all = [];
  let page = 1;
  while (true) {
    const d = await bmApi(`/ws/listings?page=${page}&page_size=100`);
    const items = d.results || [];
    if (items.length === 0) break;
    for (const l of items) {
      if (l.quantity > 0) all.push(l);
    }
    if (!d.next) break;
    page++;
    await sleep(300);
  }
  return all;
}

// ─── Step 2: Check buy box (uses UUID) ────────────────────────────
async function checkBuyBox(listing) {
  const uuid = listing.id;
  try {
    const bbRaw = await bmApi(`/ws/backbox/v1/competitors/${uuid}`);
    const bb = Array.isArray(bbRaw) ? bbRaw[0] : bbRaw;
    if (!bb) throw new Error('Empty backbox response');
    return {
      isWinning: bb.is_winning || false,
      priceToWin: bb.price_to_win?.amount ? parseFloat(bb.price_to_win.amount) : null,
      winnerPrice: bb.winner_price?.amount ? parseFloat(bb.winner_price.amount) : null,
    };
  } catch (e) {
    return { error: e.message };
  }
}

// ─── Step 5: Get profitability data from Monday ──────────────────
async function getCostData(listingId) {
  const q = `{ boards(ids:[${BM_DEVICES_BOARD}]) { items_page(limit: 500, query_params: { rules: [{ column_id: "text_mkyd4bx3", compare_value: ["${listingId}"] }] }) { items { id name column_values(ids: ["numeric_mm1mgcgn", "numeric", "board_relation"]) { id text ... on BoardRelationValue { linked_item_ids } } } } } }`;
  const d = await mondayApi(q);
  const items = d.data?.boards?.[0]?.items_page?.items || [];
  if (items.length === 0) return null;

  // Prefer item with cost data (multiple items may share same listing_id)
  const item = items.find(i => {
    const costCol = i.column_values.find(cv => cv.id === 'numeric_mm1mgcgn');
    return costCol?.text && parseFloat(costCol.text) > 0;
  }) || items[0];
  let totalFixedCost = 0, purchasePrice = 0, mainItemId = null;
  for (const cv of item.column_values) {
    if (cv.id === 'numeric_mm1mgcgn') totalFixedCost = parseFloat(cv.text) || 0;
    if (cv.id === 'numeric') purchasePrice = parseFloat(cv.text) || 0;
    if (cv.id === 'board_relation' && cv.linked_item_ids?.length > 0) {
      mainItemId = cv.linked_item_ids[0];
    }
  }
  return { totalFixedCost, purchasePrice, bmDeviceName: item.name, bmDeviceId: item.id, mainItemId };
}

// ─── Step 7: Get date listed from Main Board ─────────────────────
async function getDateListed(mainItemId) {
  if (!mainItemId) return null;
  const q = `{ items(ids:[${mainItemId}]) { column_values(ids:["date_mkq385pa"]) { text } } }`;
  const d = await mondayApi(q);
  const text = d.data?.items?.[0]?.column_values?.[0]?.text;
  if (!text) return null;
  return new Date(text);
}

// ─── Profitability calculation ────────────────────────────────────
function calcProfit(price, totalFixedCost, purchasePrice) {
  const minPrice = Math.ceil(price * MIN_PRICE_FACTOR);
  const sellFee = minPrice * BM_SELL_FEE_RATE;
  const vat = Math.max(0, (minPrice - purchasePrice) * VAT_RATE);
  const net = minPrice - totalFixedCost - sellFee - vat;
  const margin = minPrice > 0 ? (net / minPrice) * 100 : -999;
  const breakEven = Math.ceil((totalFixedCost - purchasePrice * VAT_RATE) / (1 - BM_SELL_FEE_RATE - VAT_RATE));
  return {
    minPrice,
    sellFee: Math.round(sellFee * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    net: Math.round(net * 100) / 100,
    margin: Math.round(margin * 100) / 100,
    breakEven,
  };
}

// ─── Step 8: Grade prices from V6 scraper ────────────────────────
let _v6Data = null;
function loadV6() {
  if (_v6Data) return _v6Data;
  try {
    _v6Data = JSON.parse(fs.readFileSync('/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json', 'utf8'));
  } catch { _v6Data = { models: {} }; }
  return _v6Data;
}

function getGradePricesForListing(listing) {
  const v6 = loadV6();
  const title = (listing.title || '').toLowerCase();
  const productId = listing.product_id;

  // Source 1: Try spec-specific match by product_id
  // If the V6 scraper has been run with expanded URLs, we'll find an exact match
  for (const [modelKey, modelData] of Object.entries(v6.models)) {
    // Check if this model's UUID or any picker product_id matches our listing
    if (modelData.uuid === productId) {
      const grades = {};
      if (modelData.grades) {
        for (const [g, gd] of Object.entries(modelData.grades)) {
          if (gd.price) grades[g] = gd.price;
        }
      }
      if (Object.keys(grades).length > 0) {
        return { grades, source: 'spec-specific', modelKey };
      }
    }
    // Check colour/ram/ssd pickers for product_id match
    for (const pickerType of ['colour', 'ram', 'ssd', 'cpu_gpu']) {
      const picker = modelData[pickerType];
      if (picker) {
        for (const [, pv] of Object.entries(picker)) {
          if (pv.productId === productId) {
            const grades = {};
            if (modelData.grades) {
              for (const [g, gd] of Object.entries(modelData.grades)) {
                if (gd.price) grades[g] = gd.price;
              }
            }
            if (Object.keys(grades).length > 0) {
              return { grades, source: 'picker-match', modelKey };
            }
          }
        }
      }
    }
  }

  // Source 2: Fuzzy model-level match by title (approximate)
  for (const [modelKey, modelData] of Object.entries(v6.models)) {
    const mkLower = modelKey.toLowerCase();
    const parts = mkLower.replace(/"/g, '').split(/\s+/);
    let matchCount = 0;
    for (const p of parts) {
      if (p.length >= 2 && title.includes(p)) matchCount++;
    }
    if (matchCount >= parts.length - 1 && matchCount >= 3) {
      const grades = {};
      if (modelData.grades) {
        for (const [g, gd] of Object.entries(modelData.grades)) {
          if (gd.price) grades[g] = gd.price;
        }
      }
      if (Object.keys(grades).length > 0) {
        return { grades, source: 'approximate (model-level)', modelKey };
      }
    }
  }
  return null;
}

// ─── Format card ──────────────────────────────────────────────────
function formatCard(listing, buyBox, costData, gradePrices, dateListed, gradeSource) {
  const r = n => typeof n === 'number' ? n.toFixed(2) : n;
  const lines = [];

  // Header: title + SKU
  lines.push(`${listing.listing_id} ${listing.title}`);
  lines.push(`SKU      ${listing.sku}`);
  lines.push('');

  // Buy box status
  if (buyBox.error) {
    lines.push(`Buy Box  ⚠️ Error: ${buyBox.error}`);
  } else if (buyBox.isWinning) {
    lines.push(`Buy Box  ✅ WINNING @ £${parseFloat(listing.price).toFixed(0)}`);
  } else {
    const ptw = buyBox.priceToWin ? `£${buyBox.priceToWin.toFixed(0)}` : '?';
    lines.push(`Buy Box  ❌ LOSING`);
    lines.push(`Current  £${parseFloat(listing.price).toFixed(0)} | Win@ ${ptw}`);
  }

  // Grade prices + ladder check
  if (gradePrices) {
    const gradeMap = { 'FAIR': 'F', 'GOOD': 'G', 'VERY_GOOD': 'E' };
    const bmGrade = listing.grade;
    const parts = [];
    for (const [g, p] of Object.entries(gradePrices)) {
      const label = g[0]; // F, G, E
      const marker = (g === 'Fair' && bmGrade === 'FAIR') || (g === 'Good' && bmGrade === 'GOOD') || (g === 'Excellent' && bmGrade === 'VERY_GOOD') ? ' ←' : '';
      parts.push(`${label}:£${p}${marker}`);
    }
    const sourceTag = gradeSource === 'approximate (model-level)' ? '  ⚠️ approx' : '';
    lines.push(`Grades   ${parts.join('  ')}${sourceTag}`);

    // Ladder check
    const gp = gradePrices;
    if (gp.Fair && gp.Good && gp.Excellent) {
      if (gp.Fair < gp.Good && gp.Good < gp.Excellent) {
        lines.push(`Ladder   ✅ F < G < E (gaps: £${gp.Good - gp.Fair}, £${gp.Excellent - gp.Good})`);
      } else {
        const issues = [];
        if (gp.Fair >= gp.Good) issues.push(`F:£${gp.Fair} ≥ G:£${gp.Good}`);
        if (gp.Good >= gp.Excellent) issues.push(`G:£${gp.Good} ≥ E:£${gp.Excellent}`);
        lines.push(`Ladder   ⛔ INVERTED (${issues.join(', ')})`);
      }
    }
  }

  lines.push('');

  // Costs + profitability
  if (costData && costData.totalFixedCost) {
    const currentPrice = parseFloat(listing.price);
    const atCurrent = calcProfit(currentPrice, costData.totalFixedCost, costData.purchasePrice);

    lines.push(`Costs    Fixed £${Math.round(costData.totalFixedCost)} | Purchase £${Math.round(costData.purchasePrice)}`);
    lines.push(`Fees     Sell £${r(atCurrent.sellFee)} | VAT £${r(atCurrent.vat)}`);
    lines.push(`B/E      £${atCurrent.breakEven}`);

    if (buyBox.isWinning || !buyBox.priceToWin) {
      lines.push(`Net      £${r(atCurrent.net)} | Margin ${atCurrent.margin}%`);
    } else {
      // Show both current and win price
      const atWin = calcProfit(buyBox.priceToWin, costData.totalFixedCost, costData.purchasePrice);
      lines.push(`@ Current £${currentPrice.toFixed(0)}:  Net £${r(atCurrent.net)}  Margin ${atCurrent.margin}%`);
      lines.push(`@ Win     £${buyBox.priceToWin.toFixed(0)}:    Net £${r(atWin.net)}  Margin ${atWin.margin}%`);
    }
  } else {
    lines.push(`Costs    ⚠️ No cost data in Monday`);
  }

  // Age
  if (dateListed) {
    const daysListed = Math.floor((Date.now() - dateListed.getTime()) / (1000 * 60 * 60 * 24));
    lines.push(`Listed   ${daysListed} day${daysListed !== 1 ? 's' : ''}`);
  }

  // Status
  const statuses = [];

  // Buy box status
  if (buyBox.error) {
    statuses.push('⚠️ API error');
  } else if (buyBox.isWinning) {
    statuses.push('✅ Winning');
  } else if (buyBox.priceToWin && costData?.totalFixedCost) {
    const atWin = calcProfit(buyBox.priceToWin, costData.totalFixedCost, costData.purchasePrice);
    if (atWin.net < 0) {
      statuses.push(`⛔ Cannot win profitably (loss £${Math.abs(atWin.net).toFixed(0)} at win price)`);
    } else if (atWin.margin < 15) {
      statuses.push(`⛔ Cannot win profitably (${atWin.margin}% < 15%)`);
    } else if (atWin.margin < 30) {
      statuses.push(`⚠️ Can win at ${atWin.margin}% margin`);
    } else {
      statuses.push(`✅ Can win at ${atWin.margin}% margin`);
    }
  } else if (!costData?.totalFixedCost) {
    statuses.push('⚠️ Missing cost data');
  }

  // Grade ladder
  if (gradePrices) {
    const gp = gradePrices;
    if (gp.Fair && gp.Good && gp.Excellent) {
      if (gp.Good >= gp.Excellent) statuses.push('⛔ Grade inversion: Good ≥ Excellent');
      if (gp.Fair >= gp.Good) statuses.push('⛔ Grade inversion: Fair ≥ Good');
    }
    // Check if our grade is above a better grade
    // Only flag when using spec-specific prices, not approximate model-level
    if (gradeSource !== 'approximate (model-level)') {
      const bmGrade = listing.grade;
      const ourPrice = parseFloat(listing.price);
      if (bmGrade === 'GOOD' && gp.Excellent && ourPrice > gp.Excellent) {
        statuses.push(`⛔ Won't sell: Good (£${ourPrice.toFixed(0)}) > Excellent (£${gp.Excellent})`);
      }
      if (bmGrade === 'FAIR' && gp.Good && ourPrice > gp.Good) {
        statuses.push(`⛔ Won't sell: Fair (£${ourPrice.toFixed(0)}) > Good (£${gp.Good})`);
      }
    }
  }

  // Age escalation
  if (dateListed) {
    const daysListed = Math.floor((Date.now() - dateListed.getTime()) / (1000 * 60 * 60 * 24));
    if (daysListed >= 21 && !buyBox.isWinning) {
      statuses.push(`🔴 ${daysListed} days listed, consider delisting`);
    } else if (daysListed >= 15 && !buyBox.isWinning) {
      statuses.push(`⚠️ ${daysListed} days listed, drop to market if profitable`);
    } else if (daysListed >= 8 && !buyBox.isWinning) {
      statuses.push(`⚠️ ${daysListed} days listed`);
    }
  }

  lines.push(`Status   ${statuses.join('\n         ')}`);

  return { lines: lines.join('\n'), statuses, buyBox, costData };
}

// ─── Main ─────────────────────────────────────────────────────────
(async () => {
  console.log('═'.repeat(60));
  console.log(`  Buy Box Check — ${autoBump ? 'AUTO-BUMP' : 'CHECK ONLY'}`);
  console.log(`  ${new Date().toISOString()}`);
  console.log('═'.repeat(60));

  // Step 1
  console.log('\nFetching active listings...');
  const listings = await getActiveListings();
  console.log(`  ${listings.length} active listings found\n`);

  if (listings.length === 0) {
    console.log('No active listings.');
    return;
  }

  const summary = {
    total: listings.length,
    winning: 0,
    losing: 0,
    bumped: 0,
    unprofitable: 0,
    inversions: 0,
    missingCost: 0,
    stale: 0,
    errors: 0,
  };

  const allCards = [];
  const alerts = [];

  for (const listing of listings) {
    const lid = listing.listing_id;

    // Step 2: Buy box
    const buyBox = await checkBuyBox(listing);
    await sleep(1500);

    if (buyBox.error) {
      summary.errors++;
      console.log(`${lid}: ⚠️ ${buyBox.error}`);
      continue;
    }

    if (buyBox.isWinning) summary.winning++;
    else summary.losing++;

    // Step 5: Cost data
    const costData = await getCostData(String(lid));
    if (!costData?.totalFixedCost) summary.missingCost++;

    // Step 7: Date listed
    let dateListed = null;
    if (costData?.mainItemId) {
      dateListed = await getDateListed(costData.mainItemId);
    }

    // Step 8: Grade prices
    const gradeResult = getGradePricesForListing(listing);
    const gradePrices = gradeResult?.grades || null;
    const gradeSource = gradeResult?.source || null;
    if (gradePrices) {
      const gp = gradePrices;
      if ((gp.Fair && gp.Good && gp.Fair >= gp.Good) || (gp.Good && gp.Excellent && gp.Good >= gp.Excellent)) {
        summary.inversions++;
      }
    }

    // Age check
    if (dateListed) {
      const days = Math.floor((Date.now() - dateListed.getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 21) summary.stale++;
    }

    // Step 9: Qty verification
    let qtyIssue = null;
    if (costData?.mainItemId) {
      const qtyQ = `{ items(ids:[${costData.mainItemId}]) { column_values(ids:["status24"]) { ... on StatusValue { text index } } } }`;
      const qtyR = await mondayApi(qtyQ);
      const statusVal = qtyR.data?.items?.[0]?.column_values?.[0];
      const statusText = statusVal?.text || '';
      const statusIdx = statusVal?.index;
      
      // Listed = 7, Sold = 10, Shipped = ?, Unlisted = 104
      if (statusIdx !== 7 && statusIdx !== undefined) {
        qtyIssue = `⛔ QTY MISMATCH: BM listing active (qty=${listing.quantity}) but Monday status="${statusText}" (not Listed). Oversell risk!`;
        summary.qtyMismatch = (summary.qtyMismatch || 0) + 1;
      }
    }

    // Format card
    const card = formatCard(listing, buyBox, costData, gradePrices, dateListed, gradeSource);
    if (qtyIssue) {
      card.lines += '\n         ' + qtyIssue;
      card.statuses.push(qtyIssue);
    }
    allCards.push(card);
    console.log('\n' + card.lines + '\n');

    // Step 6: Auto-bump if enabled
    if (autoBump && !buyBox.isWinning && buyBox.priceToWin && costData?.totalFixedCost) {
      const atWin = calcProfit(buyBox.priceToWin, costData.totalFixedCost, costData.purchasePrice);
      if (atWin.margin >= 15) {
        const newMin = Math.ceil(buyBox.priceToWin * MIN_PRICE_FACTOR);
        console.log(`  Bumping ${lid} to £${buyBox.priceToWin} / min £${newMin}...`);
        try {
          await bmApi(`/ws/listings/${lid}`, {
            method: 'POST',
            body: { price: buyBox.priceToWin, min_price: newMin, pub_state: 2, currency: 'GBP' },
          });
          // Verify
          await sleep(1000);
          const v = await bmApi(`/ws/listings/${lid}`);
          if (parseFloat(v.price) === buyBox.priceToWin) {
            console.log(`  ✅ Bumped to £${buyBox.priceToWin}`);
            summary.bumped++;
          } else {
            console.log(`  ⚠️ Bump verification failed`);
          }
        } catch (e) {
          console.log(`  ❌ Bump failed: ${e.message}`);
        }
      } else if (atWin.net < 0) {
        summary.unprofitable++;
        alerts.push(`⛔ ${listing.sku}: loss at win price £${buyBox.priceToWin}`);
      } else {
        summary.unprofitable++;
      }
    }

    await sleep(500);
  }

  // ─── Step 10: Report ────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Active:      ${summary.total}`);
  console.log(`  Winning:     ${summary.winning}`);
  console.log(`  Losing:      ${summary.losing}`);
  console.log(`  Bumped:      ${summary.bumped}`);
  console.log(`  Unprofitable:${summary.unprofitable}`);
  console.log(`  Inversions:  ${summary.inversions}`);
  console.log(`  Missing cost:${summary.missingCost}`);
  console.log(`  Stale (21d+):${summary.stale}`);
  console.log(`  Qty mismatch:${summary.qtyMismatch || 0}`);
  console.log(`  API errors:  ${summary.errors}`);

  // Save results
  const outDir = '/home/ricky/builds/bm-scripts/test-output';
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = `${outDir}/buy-box-check-${new Date().toISOString().slice(0, 10)}.txt`;
  const fullReport = allCards.map(c => c.lines).join('\n\n' + '─'.repeat(40) + '\n\n');
  fs.writeFileSync(outFile, fullReport);
  console.log(`\nFull report saved to ${outFile}`);
})();
