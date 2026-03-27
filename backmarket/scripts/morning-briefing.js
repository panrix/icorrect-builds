#!/usr/bin/env node
/**
 * Build 7: Morning Delivery Briefing
 *
 * Pulls SENT buyback orders from BM, estimates arrival dates,
 * matches to Monday items, posts Slack briefing.
 *
 * Usage: node morning-briefing.js [--dry-run]
 */
require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });

const { fetchBuybackOrders } = require('./lib/bm-api');
const { findItemsByTradeInId } = require('./lib/monday');
const { postToSlack } = require('./lib/slack');
const { addWorkingDays, isSameDay, isThisWeek, formatDate, formatFullDate } = require('./lib/dates');
const { createLogger } = require('./lib/logger');

const log = createLogger('morning-briefing.log');
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Estimate arrival date from order data.
 * Returns { eta: Date|null, method: string }
 */
function estimateArrival(order) {
  // Find the sent/dispatch date
  const sentDate = order.sent_at || order.drop_off_date || order.shipped_at || order.updated_at;

  if (!sentDate) {
    return { eta: null, method: 'no date found' };
  }

  const baseDate = new Date(sentDate);
  if (isNaN(baseDate.getTime())) {
    return { eta: null, method: `invalid date: ${sentDate}` };
  }

  // Check shipping method
  const shippingInfo = JSON.stringify(order.shipping || order.shipment || order).toLowerCase();

  if (shippingInfo.includes('special delivery') || shippingInfo.includes('next day')) {
    return { eta: addWorkingDays(baseDate, 1), method: 'Special Delivery (+1 day)' };
  }

  if (
    shippingInfo.includes('tracked') ||
    shippingInfo.includes('royal mail') ||
    shippingInfo.includes('standard')
  ) {
    // Use +3 working days for tracked (conservative end of 2-3)
    return { eta: addWorkingDays(baseDate, 3), method: 'Tracked (+2-3 days)' };
  }

  // Default: assume tracked standard
  return { eta: addWorkingDays(baseDate, 3), method: 'Unknown service (+3 days est)' };
}

/**
 * Extract customer name from order.
 */
function getCustomerName(order) {
  if (order.customer) {
    const c = order.customer;
    return [c.first_name, c.last_name].filter(Boolean).join(' ') || c.name || c.email || 'Unknown';
  }
  if (order.seller) {
    const s = order.seller;
    return [s.first_name, s.last_name].filter(Boolean).join(' ') || 'Unknown';
  }
  return 'Unknown';
}

/**
 * Extract device/product name from order.
 */
function getDeviceName(order) {
  if (order.product && order.product.title) return order.product.title;
  if (order.product && order.product.name) return order.product.name;
  if (order.listing_title) return order.listing_title;
  if (order.product_name) return order.product_name;
  if (order.title) return order.title;
  return 'Unknown device';
}

async function main() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  // Skip to Monday if tomorrow is weekend
  if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
  if (tomorrow.getDay() === 6) tomorrow.setDate(tomorrow.getDate() + 2);

  log.info(`=== Morning Briefing started === ${DRY_RUN ? '(DRY RUN)' : ''}`);

  // 1. Fetch SENT buyback orders
  let orders;
  try {
    orders = await fetchBuybackOrders('sent');
    log.info(`Fetched ${orders.length} SENT orders from BM`);
  } catch (err) {
    log.error(`Failed to fetch BM orders: ${err.message}`);
    const errMsg = `📦 Morning Briefing failed: could not fetch BM orders. Error: ${err.message}`;
    if (!DRY_RUN) await postToSlack(errMsg);
    process.exit(1);
  }

  // 2. No orders? Simple message.
  if (orders.length === 0) {
    const msg = '📦 No devices in transit today.';
    log.info(msg);
    if (!DRY_RUN) {
      await postToSlack(msg);
    } else {
      console.log('[DRY RUN]', msg);
    }
    return;
  }

  // 3. Process each order: estimate ETA, match Monday
  const buckets = {
    today: [],
    tomorrow: [],
    thisWeek: [],
    unknown: [],
  };

  for (const order of orders) {
    const publicId = order.public_id || order.id;
    const customer = getCustomerName(order);
    const device = getDeviceName(order);
    const { eta, method } = estimateArrival(order);

    // Match to Monday
    let mondayName = '—';
    try {
      const mondayItems = await findItemsByTradeInId(publicId);
      if (mondayItems.length > 0) {
        mondayName = mondayItems[0].name;
      }
    } catch (err) {
      log.warn(`Monday lookup failed for ${publicId}: ${err.message}`);
      mondayName = '(lookup failed)';
    }

    const entry = {
      customer,
      device,
      publicId,
      mondayName,
      eta,
      method,
    };

    if (!eta) {
      buckets.unknown.push(entry);
    } else if (isSameDay(eta, today)) {
      buckets.today.push(entry);
    } else if (isSameDay(eta, tomorrow)) {
      buckets.tomorrow.push(entry);
    } else if (isThisWeek(eta, today)) {
      buckets.thisWeek.push(entry);
    } else {
      // Future beyond this week: still show in "this week" or unknown
      buckets.thisWeek.push(entry);
    }
  }

  // 4. Build Slack message
  const dateStr = formatFullDate(today);
  const lines = [`📦 Morning Delivery Briefing — ${dateStr}`, ''];

  function addBucket(label, items) {
    lines.push(`${label}: ${items.length}`);
    for (const item of items) {
      const etaStr = item.eta ? formatDate(item.eta) : 'N/A';
      lines.push(
        `• ${item.customer} — ${item.device} — BM ${item.publicId} → Monday: ${item.mondayName}`
      );
    }
    if (items.length > 0) lines.push('');
  }

  addBucket('Arriving today (est)', buckets.today);
  addBucket('Arriving tomorrow', buckets.tomorrow);
  addBucket('Later this week', buckets.thisWeek);
  addBucket('ETA unknown', buckets.unknown);

  lines.push(`Total in transit: ${orders.length}`);

  const message = lines.join('\n');

  log.info(`Briefing: ${buckets.today.length} today, ${buckets.tomorrow.length} tomorrow, ${buckets.thisWeek.length} this week, ${buckets.unknown.length} unknown`);

  if (DRY_RUN) {
    console.log('[DRY RUN] Would post to Slack:\n');
    console.log(message);
  } else {
    try {
      await postToSlack(message);
      log.info('Briefing posted to Slack');
    } catch (err) {
      log.error(`Failed to post to Slack: ${err.message}`);
      process.exit(1);
    }
  }

  log.info('=== Morning Briefing complete ===');
}

main().catch((err) => {
  log.error(`Unhandled error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
