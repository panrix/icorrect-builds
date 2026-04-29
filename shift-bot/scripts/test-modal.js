'use strict';

const assert = require('assert');
const { buildView, parseSubmission, validateDays } = require('../slack/modal');
const repo = require('../slack/repo');
const dbClient = require('../db/client');
const config = require('../config.json');
const { DAY_KEYS } = require('../lib/week');

const TEST_DB = '/tmp/shift-bot-test.db';
const fs = require('fs');
try { fs.unlinkSync(TEST_DB); } catch (_) {}
const orig = config.db_path;
config.db_path = TEST_DB;
dbClient.migrate(TEST_DB);

const weekStartIso = '2026-05-04';
const techShort = 'Misha';

const view = buildView({ weekStartIso, techShort });
assert.strictEqual(view.type, 'modal');
assert.strictEqual(view.callback_id, 'shift_submit');
assert.ok(view.blocks.length > 7 * 4, 'expected one header + status + start + end per day');
console.log('  ✓ buildView produces valid modal');

function makeViewState(daySpec) {
  const meta = JSON.stringify({ weekStartIso, techShort });
  const values = {};
  for (const day of DAY_KEYS) {
    const s = daySpec[day];
    values[`${day}_status_block`] = { [`${day}_status`]: { selected_option: { value: s.is_off ? 'off' : 'working' } } };
    values[`${day}_start_block`]  = { [`${day}_start`]: s.start ? { selected_time: s.start } : {} };
    values[`${day}_end_block`]    = { [`${day}_end`]:   s.end   ? { selected_time: s.end }   : {} };
  }
  return { private_metadata: meta, state: { values } };
}

const allWorking = DAY_KEYS.reduce((acc, d) => { acc[d] = { is_off: false, start: '09:00', end: '18:00' }; return acc; }, {});
const parsed = parseSubmission(makeViewState(allWorking));
assert.deepStrictEqual(Object.keys(parsed.days), DAY_KEYS);
assert.strictEqual(parsed.weekStartIso, weekStartIso);
assert.strictEqual(parsed.days.mon.start, '09:00');
console.log('  ✓ parseSubmission round-trips all 7 days');

assert.deepStrictEqual(validateDays(allWorking), {});
console.log('  ✓ validateDays passes for valid input');

const missingEnd = { ...allWorking, wed: { is_off: false, start: '09:00', end: null } };
const errs1 = validateDays(missingEnd);
assert.ok(errs1.wed_start_block, 'expected error on missing end');
console.log('  ✓ validateDays rejects working day with missing end');

const inverted = { ...allWorking, fri: { is_off: false, start: '18:00', end: '09:00' } };
const errs2 = validateDays(inverted);
assert.ok(errs2.fri_end_block, 'expected error on start >= end');
console.log('  ✓ validateDays rejects start >= end');

const offMonday = { ...allWorking, mon: { is_off: true, start: null, end: null } };
assert.deepStrictEqual(validateDays(offMonday), {});
console.log('  ✓ validateDays accepts Off days with null times');

const tech = config.techs[0];
assert.strictEqual(repo.hasSubmitted(weekStartIso, tech.slack_id), false);
repo.insertSubmission({ weekStartIso, tech, days: allWorking });
assert.strictEqual(repo.hasSubmitted(weekStartIso, tech.slack_id), true);
console.log('  ✓ insertSubmission writes 7 rows, hasSubmitted detects them');

let dupRejected = false;
try {
  repo.insertSubmission({ weekStartIso, tech, days: allWorking });
} catch (err) {
  dupRejected = err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY';
}
assert.ok(dupRejected, 'expected PK constraint to reject duplicate');
console.log('  ✓ duplicate submission rejected by PK constraint');

const rows = repo.shiftsForWeek(weekStartIso);
assert.strictEqual(rows.length, 7);
assert.strictEqual(rows[0].tech_short, 'Misha');
assert.strictEqual(rows[0].color_id, '1');
console.log('  ✓ shiftsForWeek returns snapshot fields');

const offDays = { ...allWorking, sat: { is_off: true, start: null, end: null } };
const tech2 = config.techs[1];
repo.insertSubmission({ weekStartIso, tech: tech2, days: offDays });
const tech2Rows = repo.shiftsForWeek(weekStartIso).filter(r => r.tech_id === tech2.slack_id);
const sat = tech2Rows.find(r => r.day === 'sat');
assert.strictEqual(sat.is_off, 1);
assert.strictEqual(sat.start_time, null);
console.log('  ✓ off-day stores is_off=1 with null times');

const submitted = repo.listSubmittedTechs(weekStartIso);
assert.strictEqual(submitted.size, 2);
console.log('  ✓ listSubmittedTechs sees both techs');

repo.recordJobRun('fri_nudge', weekStartIso);
assert.strictEqual(repo.jobRan('fri_nudge', weekStartIso), true);
assert.strictEqual(repo.jobRan('mon_sync', weekStartIso), false);
console.log('  ✓ job_runs round-trips');

dbClient.close();
config.db_path = orig;
console.log('\nAll modal/repo tests passed.');
