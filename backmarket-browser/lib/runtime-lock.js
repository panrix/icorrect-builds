const fs = require('fs');
const path = require('path');

function defaultLockPath() {
  return path.join(__dirname, '..', 'data', '.runtime.lock');
}

function buildLockRecord({ operation = 'unknown', pid = process.pid, now = new Date() } = {}) {
  return {
    operation,
    pid,
    createdAt: now.toISOString(),
    hostname: require('os').hostname()
  };
}

function readLock(lockPath = defaultLockPath()) {
  if (!fs.existsSync(lockPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch (error) {
    return { corrupt: true, raw: fs.readFileSync(lockPath, 'utf8'), error: error.message };
  }
}

function acquireLock(lockPath = defaultLockPath(), record = buildLockRecord()) {
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  try {
    const fd = fs.openSync(lockPath, 'wx');
    fs.writeFileSync(fd, JSON.stringify(record, null, 2));
    fs.closeSync(fd);
    return { ok: true, lockPath, record };
  } catch (error) {
    if (error.code === 'EEXIST') return { ok: false, lockPath, existing: readLock(lockPath), reason: 'lock_exists' };
    throw error;
  }
}

function releaseLock(lockPath = defaultLockPath(), expectedPid = process.pid) {
  const current = readLock(lockPath);
  if (!current) return { ok: true, released: false, reason: 'not_found' };
  if (expectedPid && current.pid && Number(current.pid) !== Number(expectedPid)) {
    return { ok: false, released: false, reason: 'pid_mismatch', current };
  }
  fs.unlinkSync(lockPath);
  return { ok: true, released: true };
}

module.exports = { defaultLockPath, buildLockRecord, readLock, acquireLock, releaseLock };
