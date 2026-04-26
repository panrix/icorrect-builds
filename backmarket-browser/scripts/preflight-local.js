#!/usr/bin/env node
const path = require('path');
const { acquireLock, releaseLock, buildLockRecord } = require('../lib/runtime-lock');
const { checkHarness } = require('../lib/harness-check');

const lockPath = process.argv.find(arg => arg.startsWith('--lock='))?.split('=')[1] || path.join(__dirname, '..', 'data', '.preflight.lock');
const operation = process.argv.find(arg => arg.startsWith('--operation='))?.split('=')[1] || 'local-preflight';

const lock = acquireLock(lockPath, buildLockRecord({ operation }));
if (!lock.ok) {
  console.error(JSON.stringify({ ok: false, stage: 'lock', lock }, null, 2));
  process.exit(1);
}

let exitCode = 0;
try {
  const harness = checkHarness();
  const result = { ok: harness.ok, lock: { ok: true, lockPath }, harness, liveNetwork: false, portalAccess: false };
  console.log(JSON.stringify(result, null, 2));
  exitCode = harness.ok ? 0 : 1;
} catch (error) {
  console.error(JSON.stringify({ ok: false, stage: 'preflight', error: error.message }, null, 2));
  exitCode = 1;
} finally {
  releaseLock(lockPath, process.pid);
}

process.exit(exitCode);
