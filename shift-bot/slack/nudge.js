'use strict';

const cron = require('node-cron');
const config = require('../config.json');
const log = require('../lib/log');
const { TZ, nowLondon, nextMonday, isoToLondonDate, windowState } = require('../lib/week');
const { buildView } = require('./modal');
const repo = require('./repo');

const SUBMIT_BUTTON_ACTION_ID = 'open_shift_modal';

function fridayNudgeBlocks(weekStartIso) {
  const wk = isoToLondonDate(weekStartIso).toFormat('cccc d LLL');
  return [
    { type: 'section', text: { type: 'mrkdwn', text: `:wave: *Shift submission is open* for the week starting *${wk}*.` } },
    { type: 'section', text: { type: 'mrkdwn', text: `Tap *Submit Shifts* below (or run \`/shift\`).\nDeadline: *Sunday 23:59 London time.*` } },
    {
      type: 'actions',
      block_id: 'shift_submit_actions',
      elements: [{
        type: 'button',
        action_id: SUBMIT_BUTTON_ACTION_ID,
        style: 'primary',
        text: { type: 'plain_text', text: 'Submit Shifts' },
        value: weekStartIso,
      }],
    },
  ];
}

function sundayChaseBlocks(weekStartIso) {
  const wk = isoToLondonDate(weekStartIso).toFormat('cccc d LLL');
  return [
    { type: 'section', text: { type: 'mrkdwn', text: `:hourglass_flowing_sand: *Last call* — you haven't submitted shifts for the week of *${wk}*.` } },
    { type: 'section', text: { type: 'mrkdwn', text: `Tap *Submit Shifts* before *midnight London time*. After that the calendar locks for the week.` } },
    {
      type: 'actions',
      block_id: 'shift_submit_actions',
      elements: [{
        type: 'button',
        action_id: SUBMIT_BUTTON_ACTION_ID,
        style: 'primary',
        text: { type: 'plain_text', text: 'Submit Shifts' },
        value: weekStartIso,
      }],
    },
  ];
}

function fallbackText(prefix, weekStartIso) {
  const wk = isoToLondonDate(weekStartIso).toFormat('cccc d LLL');
  return `${prefix} for the week of ${wk}. Run /shift here to submit.`;
}

async function dmTech(client, slackId, text, blocks) {
  try {
    const im = await client.conversations.open({ users: slackId });
    await client.chat.postMessage({ channel: im.channel.id, text, blocks });
    return { ok: true };
  } catch (err) {
    return { ok: false, code: err.data?.error || err.code || 'unknown' };
  }
}

async function runFridayNudge({ client, weekStartIso = nextMonday(), dryRun = false }) {
  const blocks = fridayNudgeBlocks(weekStartIso);
  const text = fallbackText('Shift submission is open', weekStartIso);
  const results = [];
  for (const tech of config.techs) {
    const r = await dmTech(client, tech.slack_id, text, blocks);
    results.push({ tech: tech.slack_id, ...r });
    log.info({ event: 'fri_nudge_sent', tech: tech.slack_id, week: weekStartIso, ok: r.ok, code: r.code, dryRun });
  }
  if (!dryRun) repo.recordJobRun('fri_nudge', weekStartIso);
  return results;
}

async function runSundayChase({ client, weekStartIso = nextMonday(), dryRun = false }) {
  const submitted = repo.listSubmittedTechs(weekStartIso);
  const missing = config.techs.filter((t) => !submitted.has(t.slack_id));
  const blocks = sundayChaseBlocks(weekStartIso);
  const text = fallbackText('Last call — submit your shifts', weekStartIso);
  const results = [];
  for (const tech of missing) {
    const r = await dmTech(client, tech.slack_id, text, blocks);
    results.push({ tech: tech.slack_id, ...r });
    log.info({ event: 'sun_chase_sent', tech: tech.slack_id, week: weekStartIso, ok: r.ok, code: r.code, dryRun });
  }
  if (!dryRun) repo.recordJobRun('sun_chase', weekStartIso);
  return { missing: missing.length, results };
}

function registerActions(app) {
  app.action(SUBMIT_BUTTON_ACTION_ID, async ({ ack, body, client, respond }) => {
    await ack();
    const userId = body.user.id;
    const tech = repo.findTech(userId);
    if (!tech) {
      log.warn({ event: 'button_denied', reason: 'unknown_user', user: userId });
      await respond({ response_type: 'ephemeral', replace_original: false, text: ':no_entry: You are not on the shift roster.' });
      return;
    }
    const state = windowState(nowLondon(), config.window);
    if (state !== 'open') {
      const msg = state === 'before'
        ? ':hourglass: Submission window opens *Friday at 10:00 London time*.'
        : ':lock: Submission window is closed. Contact Ricky for an exception.';
      log.info({ event: 'button_denied', reason: `window_${state}`, tech: tech.slack_id });
      await respond({ response_type: 'ephemeral', replace_original: false, text: msg });
      return;
    }
    const weekStartIso = nextMonday();
    if (repo.hasSubmitted(weekStartIso, tech.slack_id)) {
      const wk = isoToLondonDate(weekStartIso).toFormat('cccc d LLL');
      log.info({ event: 'button_denied', reason: 'already_submitted', tech: tech.slack_id, week: weekStartIso });
      await respond({ response_type: 'ephemeral', replace_original: false, text: `:white_check_mark: You've already submitted for the week of *${wk}*.` });
      return;
    }
    try {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: buildView({ weekStartIso, techShort: tech.short }),
      });
      log.info({ event: 'modal_opened_via_button', tech: tech.slack_id, week: weekStartIso });
    } catch (err) {
      log.error({ event: 'modal_open_failed', tech: tech.slack_id, code: err.data?.error || err.code });
    }
  });
}

function register(app) {
  registerActions(app);

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

module.exports = { register, runFridayNudge, runSundayChase, SUBMIT_BUTTON_ACTION_ID };
