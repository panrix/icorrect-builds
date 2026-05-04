const { spawnSync } = require('child_process');
const fs = require('fs');
const { resolveHarnessBin } = require('./harness-path');

function runHarnessDoctor(binary = resolveHarnessBin()) {
  if (!fs.existsSync(binary)) {
    return { ok: false, binary, exists: false, reason: 'missing_binary', livePortalAccess: false };
  }
  const result = spawnSync(binary, ['--doctor'], { encoding: 'utf8', timeout: 30000 });
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  return {
    ok: result.status === 0,
    binary,
    exists: true,
    status: result.status,
    signal: result.signal || null,
    timedOut: Boolean(result.error && result.error.code === 'ETIMEDOUT'),
    livePortalAccess: false,
    openedBackMarket: false,
    stdoutPreview: stdout.slice(0, 2000),
    stderrPreview: stderr.slice(0, 2000)
  };
}

function summariseDoctor(result) {
  const text = `${result.stdoutPreview || ''}\n${result.stderrPreview || ''}`.toLowerCase();
  return {
    ok: result.ok,
    binaryExists: result.exists,
    daemonMentioned: text.includes('daemon'),
    browserMentioned: text.includes('browser') || text.includes('chrome'),
    needsSetup: text.includes('setup') || text.includes('attach'),
    livePortalAccess: false,
    openedBackMarket: false
  };
}

module.exports = { runHarnessDoctor, summariseDoctor };
