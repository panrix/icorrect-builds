'use strict';

require('dotenv').config({ path: '/home/ricky/config/.env' });

const { WebClient } = require('@slack/web-api');
const config = require('../config.json');
const dbClient = require('../db/client');

const JOBS = {
  fri_nudge:   () => require('../slack/nudge').runFridayNudge,
  sun_chase:   () => require('../slack/nudge').runSundayChase,
  mon_sync:    () => require('../calendar/sync').runMonSync,
  mon_summary: () => require('../summary/post').runMonSummary,
};

const SLACK_REQUIRED = new Set(['fri_nudge', 'sun_chase', 'mon_summary']);

function parseArgs(argv) {
  const args = { job: null, week: null, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--week') args.week = argv[++i];
    else if (!args.job) args.job = a;
  }
  return args;
}

function usage() {
  console.error(`Usage: run-job.js <${Object.keys(JOBS).join('|')}> [--week YYYY-MM-DD] [--dry-run]`);
  process.exit(2);
}

async function main() {
  const { job, week, dryRun } = parseArgs(process.argv);
  if (!job || !JOBS[job]) usage();

  const fn = JOBS[job]();
  if (!fn) {
    console.error(`Job '${job}' not yet implemented (waiting on later phase).`);
    process.exit(2);
  }

  dbClient.open(config.db_path);

  let client = null;
  if (SLACK_REQUIRED.has(job)) {
    if (!dryRun) {
      if (!process.env.SHIFT_BOT_TOKEN) {
        console.error('SHIFT_BOT_TOKEN missing — set it or use --dry-run');
        process.exit(2);
      }
      client = new WebClient(process.env.SHIFT_BOT_TOKEN);
    } else {
      client = {
        conversations: { open: async () => ({ channel: { id: 'D-DRYRUN' } }) },
        chat: { postMessage: async (args) => { console.log('[dry-run] post →', args.channel, '\n', args.text, '\n---'); return { ok: true }; } },
      };
    }
  }

  console.error(`[run-job] ${job} week=${week || '(auto)'} dry-run=${dryRun}`);
  const args = { weekStartIso: week || undefined, dryRun };
  if (client) args.client = client;
  const result = await fn(args);
  console.error('[run-job] result:', JSON.stringify(result, null, 2));

  dbClient.close();
}

main().catch((err) => {
  console.error('[run-job] fatal:', err.message);
  process.exit(1);
});
