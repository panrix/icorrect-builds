const REPAIR_REPLACE_RE = /repair\s*[/\\-]?\s*repla[cp]e|repair\/replaxe/i;
const UPCOMING_RE = /\b([1-9]|1[0-4])\s+days?\s+left\b|due|deadline|upcoming/i;

function classifyCustomerCareRow(row) {
  const status = String(row.status || '');
  const task = String(row.task || '');
  const combined = `${status} ${task}`;
  const repairReplace = REPAIR_REPLACE_RE.test(task);
  const upcoming = UPCOMING_RE.test(combined);
  const noAction = /no action needed|completed/i.test(status);
  return {
    urgent: (repairReplace || upcoming) && !noAction,
    repairReplace,
    upcoming,
    noAction,
    reason: repairReplace ? 'repair_replace' : upcoming ? 'upcoming_deadline' : noAction ? 'no_action' : 'not_relevant'
  };
}

module.exports = { classifyCustomerCareRow };
