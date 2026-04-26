const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { acquireLock, releaseLock, readLock, buildLockRecord } = require('../../lib/runtime-lock');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-lock-'));
const lockPath = path.join(dir, '.runtime.lock');
const record = buildLockRecord({ operation: 'test', pid: 123, now: new Date('2026-04-25T20:30:00Z') });
const first = acquireLock(lockPath, record);
assert.equal(first.ok, true);
assert.equal(readLock(lockPath).operation, 'test');
const second = acquireLock(lockPath, buildLockRecord({ operation: 'other', pid: 456 }));
assert.equal(second.ok, false);
assert.equal(second.reason, 'lock_exists');
assert.equal(releaseLock(lockPath, 999).ok, false);
assert.equal(releaseLock(lockPath, 123).released, true);
assert.equal(readLock(lockPath), null);
console.log('runtime-lock.test passed');
