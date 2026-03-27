/**
 * Slack posting helper
 */
require('dotenv').config({ path: '/home/ricky/config/api-keys/.env' });

const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;
const DEFAULT_CHANNEL = 'C024H7518J3'; // dispatch/BM channel

async function postToSlack(text, channel = DEFAULT_CHANNEL) {
  const resp = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SLACK_TOKEN}`,
    },
    body: JSON.stringify({ channel, text }),
  });

  if (!resp.ok) {
    throw new Error(`Slack API HTTP ${resp.status}`);
  }

  const json = await resp.json();
  if (!json.ok) {
    throw new Error(`Slack API error: ${json.error}`);
  }

  return json;
}

module.exports = { postToSlack, DEFAULT_CHANNEL };
