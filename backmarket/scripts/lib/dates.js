/**
 * Working day date utilities
 */

/**
 * Add N working days to a date (skips Sat/Sun).
 */
function addWorkingDays(date, days) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

/**
 * Check if two dates are the same calendar day (UTC).
 */
function isSameDay(a, b) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/**
 * Check if date falls within the current Mon-Fri work week.
 */
function isThisWeek(date, today) {
  const todayMs = today.getTime();
  const dow = today.getDay() || 7; // Convert Sun=0 to 7
  const weekStart = new Date(todayMs - (dow - 1) * 86400000);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getTime() + 4 * 86400000); // Friday
  weekEnd.setUTCHours(23, 59, 59, 999);
  return date >= weekStart && date <= weekEnd;
}

/**
 * Format date as "Mon 18 Mar"
 */
function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/London',
  });
}

/**
 * Format today's date as "Wednesday 18 March 2026"
 */
function formatFullDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/London',
  });
}

module.exports = { addWorkingDays, isSameDay, isThisWeek, formatDate, formatFullDate };
