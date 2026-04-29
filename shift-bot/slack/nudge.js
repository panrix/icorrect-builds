'use strict';

const cron = require('node-cron');
const config = require('../config.json');
const log = require('../lib/log');
const { TZ, nowLondon, nextMonday, isoToLondonDate } = require('../lib/week');
const repo = require('./repo');

function fridayNudgeText(weekStartIso) {
  const wk = isoToLondonDate(weekStartIso).toFormat('cccc d LLL');
  return [
    `:wave: *Shift submission is open* for the week starting *${wk}*.`,
    `Run \`/shift\` here to submit.`,
    `Deadline: *Sunday 23:59 London time.*`,
  ].join('\n');
}

function sundayChaseText(weekStartIso) {
  const wk = isoToLondonDate(weekStartIso).toFormat('cccc d LLL');
  return [
    `:hourglass_flowing_sand: *Last call* — you haven't submitted shifts for the week of *${wk}*.`,
    `Run \`/shift\` to submit before *midnight London time*.`,
    `After that the window closes and the calendar locks for the week.`,
  ].join('\n');
}

async function dmTech(client, slackId, text) {
  try {
    const im = await client.conversations.open({ users: slackId });
    await client.chat.postMessage({ channel: im.channel.id, text });
    return { ok: true };
  } catch (err) {
    return { ok: false, code: err.data?.error || err.code || 'unknown' };
  }
}

async function runFridayNudge({ client, weekStartIso = nextMonday(), dryRun = false }) {
  const text = fridayNudgeText(weekStartIso);
  const results = [];
  for (const tech of config.techs) {
    const r = await dmTech(client, tech.slack_id, text);
    results.push({ tech: tech.slack_id, ...r });
    log.info({ event: 'fri_nudge_sent', tech: tech.slack_id, week: weekStartIso, ok: r.ok, code: r.code, dryRun });
  }
  if (!dryRun) repo.recordJobRun('fri_nudge', weekStartIso);
  return results;
}

async function runSundayChase({ client, weekStartIso = nextMonday(), dryRun = false }) {
  const submitted = repo.listSubmittedTechs(weekStartIso);
  const missing = config.techs.filter((t) => !submitted.has(t.slack_id));
  const text = sundayChaseText(weekStartIso);
  const results = [];
  for (const tech of missing) {
    const r = await dmTech(client, tech.slack_id, text);
    results.push({ tech: tech.slack_id, ...r });
    log.info({ event: 'sun_chase_sent', tech: tech.slack_id, week: weekStartIso, ok: r.ok, code: r.code, dryRun });
  }
  if (!dryRun) repo.recordJobRun('sun_chase', weekStartIso);
  return { missing: missing.length, results };
}

function register(app) {
  cron.schedule(config.schedule.fri_nudge, async () => {
    const week = nextMonday();
    log.info({ event: 'cron_fire', job: 'fri_nudge', week });
    try {
      await runFridayNudge({ client: app.client, weekStartIso: week });
    } catch (err) {
      log.error({ event: 'fri_nudge_failed', code: err.code || 'unknown', message: err.message });
    }
  }, { timezone: TZ });

  cron.schedule(config.schedule.sun_chase, async () => {
    const week = nextMonday();
    log.info({ event: 'cron_fire', job: 'sun_chase', week });
    try {
      await runSundayChase({ client: app.client, weekStartIso: week });
    } catch (err) {
      log.error({ event: 'sun_chase_failed', code: err.code || 'unknown', message: err.message });
    }
  }, { timezone: TZ });

  log.info({ event: 'cron_registered', jobs: ['fri_nudge', 'sun_chase'], tz: TZ });
}

module.exports = { register, runFridayNudge, runSundayChase };
