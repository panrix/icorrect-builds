'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const config = require('../config.json');

function alert(message) {
  if (!fs.existsSync(config.alert_script)) {
    console.error(`[alert] alert_script not found at ${config.alert_script}; message: ${message}`);
    return;
  }
  const child = spawn('python3', [config.alert_script, '--test', message], { stdio: 'ignore', detached: true });
  child.on('error', (err) => console.error(`[alert] spawn failed: ${err.code || err.message}`));
  child.unref();
}

module.exports = { alert };
