/**
 * Simple file logger
 */
const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', 'logs');

function createLogger(filename) {
  const logPath = path.join(LOGS_DIR, filename);

  function log(level, msg) {
    const ts = new Date().toISOString();
    const line = `[${ts}] [${level}] ${msg}\n`;
    fs.appendFileSync(logPath, line);
    if (level === 'ERROR') {
      console.error(line.trim());
    }
  }

  return {
    info: (msg) => log('INFO', msg),
    warn: (msg) => log('WARN', msg),
    error: (msg) => log('ERROR', msg),
  };
}

module.exports = { createLogger };
