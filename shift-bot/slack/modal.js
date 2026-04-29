'use strict';

const { DAY_KEYS, isoToLondonDate } = require('../lib/week');

const DAY_LABELS = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

const CALLBACK_ID = 'shift_submit';

function buildView({ weekStartIso, techShort }) {
  const headerDt = isoToLondonDate(weekStartIso);
  const headerDate = headerDt.toFormat('cccc d LLL');

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${techShort}* — submit your shifts for the week starting *${headerDate}*.\n_Once submitted, no edits — contact Ricky if anything changes._`,
      },
    },
    { type: 'divider' },
  ];

  for (const day of DAY_KEYS) {
    const date = headerDt.plus({ days: DAY_KEYS.indexOf(day) }).toFormat('d LLL');
    blocks.push({
      type: 'header',
      text: { type: 'plain_text', text: `${DAY_LABELS[day]} (${date})` },
    });
    blocks.push({
      type: 'actions',
      block_id: `${day}_status_block`,
      elements: [
        {
          type: 'static_select',
          action_id: `${day}_status`,
          initial_option: { text: { type: 'plain_text', text: 'Working' }, value: 'working' },
          options: [
            { text: { type: 'plain_text', text: 'Working' }, value: 'working' },
            { text: { type: 'plain_text', text: 'Off' },     value: 'off' },
          ],
        },
      ],
    });
    blocks.push({
      type: 'input',
      block_id: `${day}_start_block`,
      optional: true,
      label: { type: 'plain_text', text: 'Start' },
      element: {
        type: 'timepicker',
        action_id: `${day}_start`,
        initial_time: '09:00',
      },
    });
    blocks.push({
      type: 'input',
      block_id: `${day}_end_block`,
      optional: true,
      label: { type: 'plain_text', text: 'End' },
      element: {
        type: 'timepicker',
        action_id: `${day}_end`,
        initial_time: '18:00',
      },
    });
  }

  return {
    type: 'modal',
    callback_id: CALLBACK_ID,
    private_metadata: JSON.stringify({ weekStartIso, techShort }),
    title:  { type: 'plain_text', text: 'Submit Shifts' },
    submit: { type: 'plain_text', text: 'Submit' },
    close:  { type: 'plain_text', text: 'Cancel' },
    blocks,
  };
}

function parseSubmission(view) {
  const meta = JSON.parse(view.private_metadata || '{}');
  const values = view.state.values;
  const days = {};
  for (const day of DAY_KEYS) {
    const status = values[`${day}_status_block`]?.[`${day}_status`]?.selected_option?.value || 'working';
    const start  = values[`${day}_start_block`]?.[`${day}_start`]?.selected_time || null;
    const end    = values[`${day}_end_block`]?.[`${day}_end`]?.selected_time || null;
    days[day] = { is_off: status === 'off', start, end };
  }
  return { weekStartIso: meta.weekStartIso, techShort: meta.techShort, days };
}

function validateDays(days) {
  const errors = {};
  for (const day of DAY_KEYS) {
    const d = days[day];
    if (d.is_off) continue;
    if (!d.start || !d.end) {
      errors[`${day}_start_block`] = 'Working day needs both start and end (or set this day to Off).';
      continue;
    }
    if (d.start >= d.end) {
      errors[`${day}_end_block`] = 'End must be after start.';
    }
  }
  return errors;
}

module.exports = { CALLBACK_ID, buildView, parseSubmission, validateDays };
