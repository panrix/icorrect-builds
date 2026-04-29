'use strict';

require('dotenv').config({ path: '/home/ricky/config/.env' });

const JOBS = ['fri_nudge', 'sun_chase', 'mon_sync', 'mon_summary'];

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
  console.error(`Usage: run-job.js <${JOBS.join('|')}> [--week YYYY-MM-DD] [--dry-run]`);
  process.exit(2);
}

async function main() {
  const { job, week, dryRun } = parseArgs(process.argv);
  if (!job || !JOBS.includes(job)) usage();

  console.error(`[run-job] ${job} week=${week || '(auto)'} dry-run=${dryRun}`);
  console.error('[run-job] Phases 3–5 will wire up the actual job dispatch here.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[run-job] fatal:', err.message);
  process.exit(1);
});
