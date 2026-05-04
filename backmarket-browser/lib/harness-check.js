const fs = require('fs');
const { spawnSync } = require('child_process');
const { resolveHarnessBin } = require('./harness-path');

function checkHarness(binary = resolveHarnessBin()) {
  const exists = fs.existsSync(binary);
  if (!exists) return { ok: false, binary, exists, reason: 'missing_binary' };
  const result = spawnSync(binary, ['--help'], { encoding: 'utf8', timeout: 10000 });
  return {
    ok: result.status === 0,
    binary,
    exists,
    status: result.status,
    stdoutPreview: (result.stdout || '').slice(0, 500),
    stderrPreview: (result.stderr || '').slice(0, 500)
  };
}

module.exports = { checkHarness };
