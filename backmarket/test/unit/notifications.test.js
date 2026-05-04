const assert = require('assert');
const {
  getNotificationConfig,
  notificationHealthCheck,
  notifyBm,
  postSlack,
  postTelegram,
  resolveSlackChannel,
} = require('../../scripts/lib/notifications');

const env = {
  TELEGRAM_BOT_TOKEN: 'tg-token',
  BM_TELEGRAM_CHAT: '-1001',
  SLACK_BOT_TOKEN: 'slack-token',
  BM_SALES_SLACK_CHANNEL: 'sales-channel',
  BM_TRADEIN_SLACK_CHANNEL: 'trade-channel',
  DISPATCH_SLACK_CHANNEL: 'dispatch-channel',
};

const config = getNotificationConfig(env);
assert.equal(config.telegram.chatId, '-1001');
assert.equal(config.slack.channels.sales, 'sales-channel');
assert.equal(resolveSlackChannel('tradeIn', env), 'trade-channel');
assert.equal(resolveSlackChannel('C123', env), 'C123');

const calls = [];
const okFetch = async (url, options = {}) => {
  calls.push({ url, options });
  return {
    ok: true,
    status: 200,
    json: async () => ({ ok: true }),
  };
};

(async () => {
  await postTelegram('hello', { env, fetchImpl: okFetch, parseMode: 'HTML' });
  assert.equal(calls[0].url, 'https://api.telegram.org/bottg-token/sendMessage');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    chat_id: '-1001',
    text: 'hello',
    parse_mode: 'HTML',
  });

  await postSlack('hi', { env, fetchImpl: okFetch, channel: 'sales' });
  assert.equal(calls[1].url, 'https://slack.com/api/chat.postMessage');
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    channel: 'sales-channel',
    text: 'hi',
  });

  const combined = await notifyBm('both', {
    env,
    fetchImpl: okFetch,
    slackChannel: 'tradeIn',
  });
  assert.equal(combined.ok, true);
  assert.equal(calls.length, 4);
  assert.equal(JSON.parse(calls[3].options.body).channel, 'trade-channel');

  const health = await notificationHealthCheck({ env, fetchImpl: okFetch, probe: true });
  assert.equal(health.ok, true);
  assert.equal(health.telegram.probeOk, true);
  assert.equal(health.slack.probeOk, true);

  const missing = await notificationHealthCheck({ env: {}, probe: false });
  assert.equal(missing.ok, false);

  console.log('notifications.test passed');
})();
