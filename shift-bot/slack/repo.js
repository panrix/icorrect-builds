'use strict';

const { DAY_KEYS } = require('../lib/week');
const dbClient = require('../db/client');
const config = require('../config.json');

function db() {
  return dbClient.open(config.db_path);
}

function findTech(slackId) {
  return config.techs.find((t) => t.slack_id === slackId) || null;
}

function hasSubmitted(weekStartIso, techId) {
  const row = db()
    .prepare('SELECT 1 FROM shifts WHERE week_start = ? AND tech_id = ? LIMIT 1')
    .get(weekStartIso, techId);
  return !!row;
}

function listSubmittedTechs(weekStartIso) {
  const rows = db()
    .prepare('SELECT DISTINCT tech_id FROM shifts WHERE week_start = ?')
    .all(weekStartIso);
  return new Set(rows.map((r) => r.tech_id));
}

function insertSubmission({ weekStartIso, tech, days }) {
  const insert = db().prepare(`
    INSERT INTO shifts
      (week_start, tech_id, tech_short, color_id, day, start_time, end_time, is_off)
    VALUES
      (@week_start, @tech_id, @tech_short, @color_id, @day, @start_time, @end_time, @is_off)
  `);
  const tx = db().transaction((rows) => {
    for (const r of rows) insert.run(r);
  });
  const rows = DAY_KEYS.map((day) => ({
    week_start: weekStartIso,
    tech_id: tech.slack_id,
    tech_short: tech.short,
    color_id: tech.color_id,
    day,
    start_time: days[day].is_off ? null : days[day].start,
    end_time:   days[day].is_off ? null : days[day].end,
    is_off:     days[day].is_off ? 1 : 0,
  }));
  tx(rows);
}

function shiftsForWeek(weekStartIso) {
  return db()
    .prepare(`
      SELECT week_start, tech_id, tech_short, color_id, day, start_time, end_time, is_off, gcal_event_id
      FROM shifts
      WHERE week_start = ?
      ORDER BY tech_id, day
    `)
    .all(weekStartIso);
}

function setEventId({ weekStartIso, techId, day, eventId }) {
  db()
    .prepare('UPDATE shifts SET gcal_event_id = ? WHERE week_start = ? AND tech_id = ? AND day = ?')
    .run(eventId, weekStartIso, techId, day);
}

function recordJobRun(jobName, weekStartIso) {
  db()
    .prepare('INSERT OR REPLACE INTO job_runs (job_name, week_start) VALUES (?, ?)')
    .run(jobName, weekStartIso);
}

function jobRan(jobName, weekStartIso) {
  return !!db()
    .prepare('SELECT 1 FROM job_runs WHERE job_name = ? AND week_start = ? LIMIT 1')
    .get(jobName, weekStartIso);
}

module.exports = {
  findTech,
  hasSubmitted,
  listSubmittedTechs,
  insertSubmission,
  shiftsForWeek,
  setEventId,
  recordJobRun,
  jobRan,
};
