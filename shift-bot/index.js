'use strict';

const ENV_PATH = '/home/ricky/config/.env';
const dotenvResult = require('dotenv').config({ path: ENV_PATH });

const { App } = require('@slack/bolt');
const cron = require('node-cron');
const config = require('./config.json');
const dbClient = require('./db/client');
const log = require('./lib/log');

if (dotenvResult.error) {
  log.warn({ event: 'dotenv_miss', path: ENV_PATH, code: dotenvResult.error.code });
}

async function main() {
  if (!process.env.SHIFT_BOT_TOKEN || !process.env.SHIFT_BOT_APP_TOKEN) {
    throw new Error(`missing SHIFT_BOT_TOKEN or SHIFT_BOT_APP_TOKEN (loaded from ${ENV_PATH})`);
  }

  dbClient.migrate(config.db_path);

  const app = new App({
    token: process.env.SHIFT_BOT_TOKEN,
    appToken: process.env.SHIFT_BOT_APP_TOKEN,
    socketMode: true,
    logLevel: 'info',
  });

  require('./slack/command').register(app);
  require('./slack/nudge').register(app);
  require('./calendar/sync').register();
  require('./summary/post').register(app);

  await app.start();
  log.info({ event: 'started', mode: 'socket', tz: config.timezone });

  process.on('SIGTERM', async () => {
    log.info({ event: 'sigterm' });
    await app.stop();
    dbClient.close();
    process.exit(0);
  });
}

main().catch((err) => {
  log.error({ event: 'fatal', code: err.code || 'unknown', message: err.message });
  process.exit(1);
});
