#!/usr/bin/env node
const fs = require('fs');
const { buildImapMetadataFetchPlan } = require('../lib/imap-metadata-fetcher');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile('/home/ricky/config/api-keys/.env');

if (process.argv.includes('--live')) {
  console.error('Refusing live IMAP network connection without explicit approval path. This script is plan-only.');
  process.exit(2);
}

const plan = buildImapMetadataFetchPlan(process.env, {
  since: process.argv.find(arg => arg.startsWith('--since='))?.split('=')[1] || null,
  liveNetwork: false
});
console.log(JSON.stringify(plan, null, 2));
process.exit(plan.ok ? 0 : 1);
