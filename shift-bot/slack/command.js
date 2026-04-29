'use strict';

const config = require('../config.json');
const log = require('../lib/log');
const { nowLondon, nextMonday, windowState, isoToLondonDate } = require('../lib/week');
const { buildView, parseSubmission, validateDays, CALLBACK_ID } = require('./modal');
const repo = require('./repo');

function register(app) {
  app.command('/shift', async ({ command, ack, client, respond }) => {
    await ack();
    const userId = command.user_id;
    const tech = repo.findTech(userId);
    if (!tech) {
      log.warn({ event: 'shift_command_denied', reason: 'unknown_user', user: userId });
      await respond({
        response_type: 'ephemeral',
        text: ':no_entry: You are not on the shift roster. Ask Ricky to add you.',
      });
      return;
    }

    const state = windowState(nowLondon(), config.window);
    if (state !== 'open') {
      const msg = state === 'before'
        ? ':hourglass: Submission window opens *Friday at 10:00 London time*.'
        : ':lock: Submission window for this week is closed. Contact Ricky if you need an exception.';
      log.info({ event: 'shift_command_denied', reason: `window_${state}`, tech: tech.slack_id });
      await respond({ response_type: 'ephemeral', text: msg });
      return;
    }

    const weekStartIso = nextMonday();

    if (repo.hasSubmitted(weekStartIso, tech.slack_id)) {
      const wk = isoToLondonDate(weekStartIso).toFormat('cccc d LLL');
      log.info({ event: 'shift_command_denied', reason: 'already_submitted', tech: tech.slack_id, week: weekStartIso });
      await respond({
        response_type: 'ephemeral',
        text: `:white_check_mark: You've already submitted shifts for the week of *${wk}*. Contact Ricky if you need to change them.`,
      });
      return;
    }

    try {
      await client.views.open({
        trigger_id: command.trigger_id,
        view: buildView({ weekStartIso, techShort: tech.short }),
      });
      log.info({ event: 'modal_opened', tech: tech.slack_id, week: weekStartIso });
    } catch (err) {
      log.error({ event: 'modal_open_failed', tech: tech.slack_id, code: err.data?.error || err.code });
      await respond({ response_type: 'ephemeral', text: ':warning: Could not open the form. Try again, then ping Ricky.' });
    }
  });

  app.view(CALLBACK_ID, async ({ ack, body, view, client }) => {
    const userId = body.user.id;
    const tech = repo.findTech(userId);
    if (!tech) {
      await ack({ response_action: 'errors', errors: { mon_status_block: 'Unknown user.' } });
      return;
    }

    const state = windowState(nowLondon(), config.window);
    if (state !== 'open') {
      await ack({ response_action: 'errors', errors: { mon_status_block: 'Submission window is closed.' } });
      log.info({ event: 'submit_denied', reason: `window_${state}`, tech: tech.slack_id });
      return;
    }

    const { weekStartIso, days } = parseSubmission(view);
    if (weekStartIso !== nextMonday()) {
      await ack({ response_action: 'errors', errors: { mon_status_block: 'Form is for a different week — re-open `/shift`.' } });
      log.warn({ event: 'submit_denied', reason: 'stale_week', tech: tech.slack_id, formWeek: weekStartIso, currentNext: nextMonday() });
      return;
    }

    const errors = validateDays(days);
    if (Object.keys(errors).length > 0) {
      await ack({ response_action: 'errors', errors });
      return;
    }

    if (repo.hasSubmitted(weekStartIso, tech.slack_id)) {
      await ack({ response_action: 'errors', errors: { mon_status_block: 'You already submitted for this week.' } });
      log.info({ event: 'submit_denied', reason: 'duplicate', tech: tech.slack_id, week: weekStartIso });
      return;
    }

    try {
      repo.insertSubmission({ weekStartIso, tech, days });
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        await ack({ response_action: 'errors', errors: { mon_status_block: 'You already submitted for this week.' } });
        log.info({ event: 'submit_denied', reason: 'duplicate_race', tech: tech.slack_id, week: weekStartIso });
        return;
      }
      log.error({ event: 'submit_db_error', tech: tech.slack_id, code: err.code });
      await ack({ response_action: 'errors', errors: { mon_status_block: 'Database error — try again or ping Ricky.' } });
      return;
    }

    await ack();
    log.info({ event: 'submitted', tech: tech.slack_id, week: weekStartIso, working: Object.values(days).filter(d => !d.is_off).length });

    try {
      await client.chat.postMessage({
        channel: userId,
        text: `:white_check_mark: Shifts submitted for the week of *${isoToLondonDate(weekStartIso).toFormat('cccc d LLL')}*. They'll appear on the shared calendar Monday morning.`,
      });
    } catch (err) {
      log.warn({ event: 'submit_dm_failed', tech: tech.slack_id, code: err.data?.error || err.code });
    }
  });
}

module.exports = { register };
