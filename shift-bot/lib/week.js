'use strict';

const { DateTime } = require('luxon');

const TZ = 'Europe/London';
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function nowLondon() {
  return DateTime.now().setZone(TZ);
}

function mondayOf(dt) {
  const d = dt.setZone(TZ);
  return d.startOf('day').minus({ days: (d.weekday + 6) % 7 });
}

function currentMonday(dt = nowLondon()) {
  return mondayOf(dt).toISODate();
}

function nextMonday(dt = nowLondon()) {
  return mondayOf(dt).plus({ weeks: 1 }).toISODate();
}

function isoToLondonDate(iso) {
  return DateTime.fromISO(iso, { zone: TZ });
}

function isWindowOpen(dt = nowLondon(), window) {
  const day = dt.weekday;
  const hour = dt.hour;
  const minute = dt.minute;
  if (day === window.open_day_of_week) return hour >= window.open_hour;
  if (day === 6 || day === 7) return true;
  if (day === window.close_day_of_week) return hour < window.close_hour && minute >= 0 ? false : false;
  return false;
}

function windowState(dt = nowLondon(), window) {
  const day = dt.weekday;
  const hour = dt.hour;
  if (day === window.open_day_of_week) {
    return hour >= window.open_hour ? 'open' : 'before';
  }
  if (day === 6 || day === 7) return 'open';
  if (day === window.close_day_of_week && hour < window.close_hour) return 'open';
  return 'closed';
}

function dayOfDateInWeek(weekStartIso, dayKey) {
  const idx = DAY_KEYS.indexOf(dayKey);
  if (idx < 0) throw new Error(`bad day key: ${dayKey}`);
  return DateTime.fromISO(weekStartIso, { zone: TZ }).plus({ days: idx });
}

function formatHourSpan(start, end) {
  function h(s) {
    const [hh, mm] = s.split(':').map(Number);
    if (mm === 0) return String(hh);
    return `${hh}:${String(mm).padStart(2, '0')}`;
  }
  return `${h(start)}–${h(end)}`;
}

module.exports = {
  TZ,
  DAY_KEYS,
  nowLondon,
  currentMonday,
  nextMonday,
  isoToLondonDate,
  windowState,
  dayOfDateInWeek,
  formatHourSpan,
};
