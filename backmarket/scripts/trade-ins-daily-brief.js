#!/usr/bin/env node
/**
 * Daily BackMarket trade-ins summary.
 *
 * Reads the source-tracked SENT intake creation log written by sent-orders.js
 * and posts a compact count/detail briefing to the BackMarket Trade-ins topic.
 */
require('dotenv').config({ path: '/home/ricky/config/api-keys/.env', quiet: true });

const fs = require('fs');
const path = require('path');
const { postTelegram } = require('./lib/notifications');

const LOG_PATH = path.join(__dirname, '..', 'data', 'trade-ins-created.jsonl');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

function argValue(flag, fallback = '') {
  const index = args.indexOf(flag);
  if (index === -1 || index === args.length - 1) return fallback;
  return args[index + 1];
}

const hours = Math.max(parseFloat(argValue('--hours', '24')) || 24, 1);
const since = new Date(Date.now() - hours * 60 * 60 * 1000);

function readEntries() {
  if (!fs.existsSync(LOG_PATH)) return [];
  return fs.readFileSync(LOG_PATH, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter((entry) => {
      const createdAt = new Date(entry.createdAt);
      return !Number.isNaN(createdAt.getTime()) && createdAt >= since;
    });
}

function statusLabel(entry) {
  const value = String(entry.functionalLabel || '').toLowerCase();
  if (value.includes('non') || value.includes('not')) return '🔴 Non-Functional';
  if (value.includes('functional')) return '✅ Functional';
  return '⚪ Unknown';
}

function buildMessage(entries) {
  const unique = new Map();
  for (const entry of entries) {
    unique.set(entry.publicId || `${entry.bmName}:${entry.createdAt}`, entry);
  }
  const rows = [...unique.values()];
  if (rows.length === 0) {
    return `📦 BM trade-ins daily brief\nNo new trade-ins added in the last ${hours}h.`;
  }

  const lines = [
    `📦 BM trade-ins daily brief`,
    `${rows.length} new trade-in${rows.length === 1 ? '' : 's'} added in the last ${hours}h.`,
    '',
  ];

  for (const entry of rows) {
    lines.push(`🆕 ${entry.bmName} - ${entry.product || 'Unknown product'} - £${entry.exVatPrice ?? '?'}`);
    lines.push(`Customer: ${entry.customerName || 'Unknown'} | Status: ${statusLabel(entry)}`);
  }

  return lines.join('\n');
}

async function main() {
  const message = buildMessage(readEntries());
  if (dryRun) {
    console.log(message);
    return;
  }
  const result = await postTelegram(message, { topic: 'tradeIns', logger: console });
  if (!result.ok) process.exitCode = 1;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  buildMessage,
  statusLabel,
};
