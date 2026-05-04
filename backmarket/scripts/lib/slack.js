/**
 * Slack posting helper
 */
const { DEFAULTS, postSlack } = require('./notifications');

const DEFAULT_CHANNEL = DEFAULTS.slackChannels.dispatch; // dispatch/BM channel

async function postToSlack(text, channel = DEFAULT_CHANNEL) {
  return postSlack(text, { channel, throwOnError: true });
}

module.exports = { postToSlack, DEFAULT_CHANNEL };
