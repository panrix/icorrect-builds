'use strict';

const cron = require('node-cron');
const { google } = require('googleapis');
const config = require('../config.json');
const log = require('../lib/log');
const { alert } = require('../lib/alert');
const { TZ, currentMonday, dayOfDateInWeek, formatHourSpan } = require('../lib/week');
const repo = require('../slack/repo');

const SHIFT_KEY_PROP = 'shiftKey';

function shiftKey(weekStartIso, techId, day) {
  return `${weekStartIso}:${techId}:${day}`;
}

function buildEvent(row) {
  const date = dayOfDateInWeek(row.week_start, row.day);
  const [sh, sm] = row.start_time.split(':').map(Number);
  const [eh, em] = row.end_time.split(':').map(Number);
  const start = date.set({ hour: sh, minute: sm, second: 0, millisecond: 0 });
  const end   = date.set({ hour: eh, minute: em, second: 0, millisecond: 0 });
  const title = `${row.tech_short} (${formatHourSpan(row.start_time, row.end_time)})`;
  return {
    summary: title,
    start: { dateTime: start.toISO({ suppressMilliseconds: true }), timeZone: TZ },
    end:   { dateTime: end.toISO({ suppressMilliseconds: true }),   timeZone: TZ },
    colorId: row.color_id,
    extendedProperties: {
      private: {
        [SHIFT_KEY_PROP]: shiftKey(row.week_start, row.tech_id, row.day),
        techId: row.tech_id,
        weekStart: row.week_start,
      },
    },
  };
}

function makeOAuthClient() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  const refresh = process.env.GOOGLE_REFRESH_TOKEN;
  if (!id || !secret || !refresh) {
    const err = new Error('missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN');
    err.code = 'GOOGLE_AUTH_CONFIG';
    throw err;
  }
  const client = new google.auth.OAuth2(id, secret);
  client.setCredentials({ refresh_token: refresh });
  return client;
}

function isAuthFailure(err) {
  if (err.code === 401) return true;
  const reason = err.errors?.[0]?.reason || err.response?.data?.error || '';
  return reason === 'invalid_grant' || reason === 'authError' || reason === 'invalid_client';
}

function isTransient(err) {
  const status = err.code || err.response?.status;
  if (status === 429) return true;
  if (typeof status === 'number' && status >= 500) return true;
  if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'EAI_AGAIN') return true;
  return false;
}

async function withBackoff(fn, { attempts = 5, baseMs = 1000 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (isAuthFailure(err)) throw err;
      if (!isTransient(err) || i === attempts - 1) throw err;
      const delay = baseMs * Math.pow(2, i);
      log.warn({ event: 'gcal_retry', attempt: i + 1, delayMs: delay, code: err.code });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

async function findExistingEvent(calendar, calendarId, key) {
  const res = await calendar.events.list({
    calendarId,
    privateExtendedProperty: `${SHIFT_KEY_PROP}=${key}`,
    maxResults: 1,
    showDeleted: false,
    singleEvents: true,
  });
  return res.data.items?.[0] || null;
}

async function syncShifts({ calendar, calendarId, rows, dryRun }) {
  const summary = { created: 0, reused: 0, skipped: 0, errors: [] };
  for (const row of rows) {
    if (row.is_off) { summary.skipped++; continue; }
    if (row.gcal_event_id) { summary.skipped++; continue; }

    const key = shiftKey(row.week_start, row.tech_id, row.day);

    if (dryRun) {
      const ev = buildEvent(row);
      log.info({ event: 'gcal_dryrun', tech: row.tech_id, day: row.day, summary: ev.summary, start: ev.start.dateTime, end: ev.end.dateTime });
      summary.created++;
      continue;
    }

    try {
      const existing = await withBackoff(() => findExistingEvent(calendar, calendarId, key));
      if (existing) {
        repo.setEventId({ weekStartIso: row.week_start, techId: row.tech_id, day: row.day, eventId: existing.id });
        log.info({ event: 'gcal_reused', tech: row.tech_id, day: row.day, eventId: existing.id });
        summary.reused++;
        continue;
      }

      const inserted = await withBackoff(() => calendar.events.insert({
        calendarId,
        requestBody: buildEvent(row),
      }));
      const eventId = inserted.data.id;
      repo.setEventId({ weekStartIso: row.week_start, techId: row.tech_id, day: row.day, eventId });
      log.info({ event: 'gcal_created', tech: row.tech_id, day: row.day, eventId });
      summary.created++;
    } catch (err) {
      const code = err.code || err.response?.status || 'unknown';
      log.error({ event: 'gcal_error', tech: row.tech_id, day: row.day, code, message: err.message });
      summary.errors.push({ tech: row.tech_id, day: row.day, code });
      if (isAuthFailure(err)) throw err;
    }
  }
  return summary;
}

async function runMonSync({ weekStartIso = currentMonday(), dryRun = false } = {}) {
  const calendarId = config.calendar_id;
  const rows = repo.shiftsForWeek(weekStartIso);

  let calendar = null;
  if (!dryRun) {
    let auth;
    try {
      auth = makeOAuthClient();
    } catch (err) {
      log.error({ event: 'gcal_auth_config_missing', code: err.code });
      alert(`shift-bot: Google credentials missing in env (${err.code}). Calendar sync disabled until fixed.`);
      return { authFailed: true, summary: null };
    }
    calendar = google.calendar({ version: 'v3', auth });
  }

  if (rows.length === 0) {
    log.warn({ event: 'gcal_no_submissions', week: weekStartIso });
    if (!dryRun) repo.recordJobRun('mon_sync', weekStartIso);
    return { summary: { created: 0, reused: 0, skipped: 0, errors: [] } };
  }

  log.info({ event: 'gcal_sync_start', week: weekStartIso, rows: rows.length, dryRun });

  let summary;
  try {
    summary = await syncShifts({ calendar, calendarId, rows, dryRun });
  } catch (err) {
    if (isAuthFailure(err)) {
      log.error({ event: 'gcal_auth_failed', code: err.code, reason: err.errors?.[0]?.reason });
      alert(`shift-bot: Google Calendar auth failure (${err.errors?.[0]?.reason || err.code}). Refresh GOOGLE_REFRESH_TOKEN and restart.`);
      return { authFailed: true, summary: null };
    }
    log.error({ event: 'gcal_sync_failed', code: err.code, message: err.message });
    alert(`shift-bot: Calendar sync failed for ${weekStartIso}: ${err.message}`);
    return { summary: null, fatal: err.message };
  }

  if (!dryRun) repo.recordJobRun('mon_sync', weekStartIso);
  log.info({ event: 'gcal_sync_done', week: weekStartIso, ...summary });

  if (summary.errors.length > 0) {
    alert(`shift-bot: Calendar sync had ${summary.errors.length} error(s) for ${weekStartIso}. Check journalctl --user -u shift-bot.`);
  }

  return { summary };
}

function register() {
  cron.schedule(config.schedule.mon_sync, async () => {
    const week = currentMonday();
    log.info({ event: 'cron_fire', job: 'mon_sync', week });
    try {
      await runMonSync({ weekStartIso: week });
    } catch (err) {
      log.error({ event: 'mon_sync_failed', code: err.code || 'unknown', message: err.message });
    }
  }, { timezone: TZ });

  log.info({ event: 'cron_registered', jobs: ['mon_sync'], tz: TZ });
}

module.exports = { register, runMonSync, buildEvent, shiftKey };
