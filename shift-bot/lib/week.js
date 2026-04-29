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
  // 12-hour display, no am/pm. 09:00 -> "9", 18:00 -> "6", 09:30 -> "9:30", 12:00 -> "12", 00:00 -> "12".
  function h(s) {
    const [hh, mm] = s.split(':').map(Number);
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    if (mm === 0) return String(h12);
    return `${h12}:${String(mm).padStart(2, '0')}`;
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
