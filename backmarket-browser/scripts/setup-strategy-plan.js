#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { checkHarness } = require('../lib/harness-check');
const { readLock } = require('../lib/runtime-lock');
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

const lockPath = path.join(__dirname, '..', 'data', '.runtime.lock');
const lock = readLock(lockPath);
const harness = checkHarness();
const imapPlan = buildImapMetadataFetchPlan(process.env, { liveNetwork: false });

const plan = {
  ok: harness.ok && imapPlan.ok && !lock,
  preferredStrategy: 'VPS Chrome/Edge session controlled by browser-harness',
  discoveryFallback: 'Ricky local Chrome routed to VPS, discovery only',
  readiness: {
    lockFree: !lock,
    existingLock: lock ? { operation: lock.operation, createdAt: lock.createdAt, pid: lock.pid } : null,
    harnessInstalled: harness.exists,
    harnessHelpOk: harness.ok,
    imapEnvOk: imapPlan.ok,
    imapMissing: imapPlan.missing
  },
  noLiveActionsPerformed: true,
  blockedUntilApproval: [
    'live IMAP mailbox connection',
    'Back Market login flow',
    'Back Market portal read-only session',
    'one-SKU canary mutation',
    'customer/return/warranty actions'
  ],
  nextSafeStep: 'run browser-harness --doctor and choose VPS Chrome setup path; stop before BM portal'
};

console.log(JSON.stringify(plan, null, 2));
process.exit(plan.ok ? 0 : 1);
