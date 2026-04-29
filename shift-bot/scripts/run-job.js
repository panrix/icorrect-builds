'use strict';

require('dotenv').config({ path: '/home/ricky/config/.env' });

const { WebClient } = require('@slack/web-api');
const config = require('../config.json');
const dbClient = require('../db/client');

const JOBS = {
  fri_nudge:   () => require('../slack/nudge').runFridayNudge,
  sun_chase:   () => require('../slack/nudge').runSundayChase,
  mon_sync:    () => null,    // Phase 4
  mon_summary: () => null,    // Phase 5
};

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
  if (!dryRun) {
    if (!process.env.SLACK_BOT_TOKEN) {
      console.error('SLACK_BOT_TOKEN missing — set it or use --dry-run');
      process.exit(2);
    }
    client = new WebClient(process.env.SLACK_BOT_TOKEN);
  } else {
    client = {
      conversations: { open: async () => ({ channel: { id: 'D-DRYRUN' } }) },
      chat: { postMessage: async (args) => { console.log('[dry-run] DM →', args.channel, '\n', args.text, '\n---'); return { ok: true }; } },
    };
  }

  console.error(`[run-job] ${job} week=${week || '(auto)'} dry-run=${dryRun}`);
  const result = await fn({ client, weekStartIso: week || undefined, dryRun });
  console.error('[run-job] result:', JSON.stringify(result, null, 2));

  dbClient.close();
}

main().catch((err) => {
  console.error('[run-job] fatal:', err.message);
  process.exit(1);
});
