#!/usr/bin/env node
const fs = require('fs');
const { createMailboxFetchPlan } = require('../lib/mailbox-fetcher');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile('/home/ricky/config/api-keys/.env');

const plan = createMailboxFetchPlan(process.env, {
  since: process.argv.find(arg => arg.startsWith('--since='))?.split('=')[1] || null
});

// Redact values that should never be printed in logs.
if (plan.config) {
  plan.config.user = plan.config.user ? '[redacted-email-present]' : plan.config.user;
  plan.config.server = plan.config.server ? '[redacted-server-present]' : plan.config.server;
}
console.log(JSON.stringify(plan, null, 2));
process.exit(plan.ok ? 0 : 1);
