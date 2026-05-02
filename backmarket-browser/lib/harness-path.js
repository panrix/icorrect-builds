const fs = require('fs');
const path = require('path');
const os = require('os');

function candidateHarnessBins(env = process.env) {
  return [
    env.BROWSER_HARNESS_BIN,
    path.join(os.homedir(), '.local', 'bin', 'browser-harness'),
    '/home/ricky/.local/bin/browser-harness',
  ].filter(Boolean);
}

function resolveHarnessBin(env = process.env) {
  const candidates = candidateHarnessBins(env);
  return candidates.find(candidate => fs.existsSync(candidate)) || candidates[0];
}

module.exports = { candidateHarnessBins, resolveHarnessBin };
