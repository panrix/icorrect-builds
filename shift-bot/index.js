'use strict';

require('dotenv').config({ path: '/home/ricky/config/.env' });

const { App } = require('@slack/bolt');
const cron = require('node-cron');
const config = require('./config.json');
const dbClient = require('./db/client');
const log = require('./lib/log');

async function main() {
  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_APP_TOKEN) {
    throw new Error('missing SLACK_BOT_TOKEN or SLACK_APP_TOKEN');
  }

  dbClient.migrate(config.db_path);

  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true,
    logLevel: 'info',
  });

  // Phase 2 will register /shift here.
  // Phase 3 will register cron jobs here.
  // Phase 4 will register the calendar sync cron here.
  // Phase 5 will register the Monday summary cron here.

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
