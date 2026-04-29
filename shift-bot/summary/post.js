'use strict';

const cron = require('node-cron');
const config = require('../config.json');
const log = require('../lib/log');
const { TZ, DAY_KEYS, currentMonday, isoToLondonDate, formatHourSpan } = require('../lib/week');
const repo = require('../slack/repo');

const DAY_HEADERS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
const NAME_COL_WIDTH = 8;
const DAY_COL_WIDTH = 7;

function pad(s, w) {
  s = String(s);
  if (s.length >= w) return s + ' ';
  return s + ' '.repeat(w - s.length);
}

function buildTable(weekStartIso, rowsByTech) {
  const techs = Object.keys(rowsByTech);
  if (techs.length === 0) return null;

  const lines = [];
  let header = pad('', NAME_COL_WIDTH);
  for (const day of DAY_KEYS) header += pad(DAY_HEADERS[day], DAY_COL_WIDTH);
  lines.push(header.trimEnd());

  for (const techId of techs) {
    const rows = rowsByTech[techId];
    if (!rows.length) continue;
    const techShort = rows[0].tech_short;
    let line = pad(techShort, NAME_COL_WIDTH);
    const byDay = Object.fromEntries(rows.map((r) => [r.day, r]));
    for (const day of DAY_KEYS) {
      const r = byDay[day];
      let cell;
      if (!r || r.is_off) cell = 'off';
      else cell = formatHourSpan(r.start_time, r.end_time);
      line += pad(cell, DAY_COL_WIDTH);
    }
    lines.push(line.trimEnd());
  }

  return lines.join('\n');
}

function calendarLink(calendarId) {
  return `https://calendar.google.com/calendar/u/0?cid=${encodeURIComponent(calendarId)}`;
}

function buildMessage({ weekStartIso, rowsByTech, syncFailed }) {
  const wkLabel = isoToLondonDate(weekStartIso).toFormat('cccc d LLL');
  const table = buildTable(weekStartIso, rowsByTech);
  const parts = [];
  parts.push(`:calendar: *Shifts — week of ${wkLabel}*`);
  if (table) {
    parts.push('```\n' + table + '\n```');
  } else {
    parts.push('_No shifts submitted for this week._');
  }
  parts.push(`:date: Calendar: ${calendarLink(config.calendar_id)}`);
  if (syncFailed) parts.push(':warning: Calendar sync failed — see logs.');
  return parts.join('\n');
}

async function runMonSummary({ client, weekStartIso = currentMonday(), dryRun = false } = {}) {
  const allRows = repo.shiftsForWeek(weekStartIso);
  const rowsByTech = {};
  for (const row of allRows) {
    (rowsByTech[row.tech_id] ||= []).push(row);
  }

  // syncFailed is true if either:
  //   (a) mon_sync never recorded a job_run for this week, OR
  //   (b) any working shift row is still missing its gcal_event_id (partial failure path)
  const syncRan = repo.jobRan('mon_sync', weekStartIso);
  const unsyncedWorking = allRows.filter((r) => !r.is_off && !r.gcal_event_id).length;
  const syncFailed = allRows.length > 0 && (!syncRan || unsyncedWorking > 0);

  const text = buildMessage({ weekStartIso, rowsByTech, syncFailed });

  if (dryRun) {
    console.log('[dry-run] post →', config.summary_channel_id);
    console.log(text);
    console.log('---');
    log.info({ event: 'mon_summary_dryrun', week: weekStartIso, techs: Object.keys(rowsByTech).length });
    return { dryRun: true, techs: Object.keys(rowsByTech).length, text };
  }

  try {
    await client.chat.postMessage({
      channel: config.summary_channel_id,
      text,
      unfurl_links: false,
      unfurl_media: false,
    });
    repo.recordJobRun('mon_summary', weekStartIso);
    log.info({ event: 'mon_summary_posted', week: weekStartIso, techs: Object.keys(rowsByTech).length });
    return { ok: true, techs: Object.keys(rowsByTech).length };
  } catch (err) {
    log.error({ event: 'mon_summary_failed', week: weekStartIso, code: err.data?.error || err.code });
    return { ok: false, code: err.data?.error || err.code };
  }
}

function register(app) {
  cron.schedule(config.schedule.mon_summary, async () => {
    const week = currentMonday();
    log.info({ event: 'cron_fire', job: 'mon_summary', week });
    try {
      await runMonSummary({ client: app.client, weekStartIso: week });
    } catch (err) {
      log.error({ event: 'mon_summary_failed', code: err.code || 'unknown', message: err.message });
    }
  }, { timezone: TZ });

  log.info({ event: 'cron_registered', jobs: ['mon_summary'], tz: TZ });
}

module.exports = { register, runMonSummary, buildTable, buildMessage };
