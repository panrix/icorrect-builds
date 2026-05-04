/**
 * Back Market notification transport.
 *
 * One config point for BM Telegram and Slack destinations. Callers can keep
 * their own business wording while sharing token checks, API validation, and
 * health probes.
 */
require('dotenv').config({ path: '/home/ricky/config/api-keys/.env', quiet: true });

const DEFAULTS = Object.freeze({
  bmTelegramChat: '-1003888456344',
  slackChannels: Object.freeze({
    dispatch: 'C024H7518J3',
    sales: 'C0A21J30M1C',
    tradeIn: 'C09VB5G7CTU',
    gradeCheck: 'C09VB5G7CTU',
  }),
});

const CHANNEL_ENV = Object.freeze({
  dispatch: 'DISPATCH_SLACK_CHANNEL',
  sales: 'BM_SALES_SLACK_CHANNEL',
  tradeIn: 'BM_TRADEIN_SLACK_CHANNEL',
  gradeCheck: 'BM_GRADE_CHECK_SLACK_CHANNEL',
});

function getNotificationConfig(env = process.env) {
  return {
    telegram: {
      token: env.BM_TELEGRAM_BOT_TOKEN || env.TELEGRAM_BOT_TOKEN || '',
      tokenSource: env.BM_TELEGRAM_BOT_TOKEN ? 'BM_TELEGRAM_BOT_TOKEN' : 'TELEGRAM_BOT_TOKEN',
      chatId: env.BM_TELEGRAM_CHAT || DEFAULTS.bmTelegramChat,
    },
    slack: {
      token: env.SLACK_BOT_TOKEN || '',
      webhookUrl: env.SLACK_WEBHOOK_URL || '',
      channels: {
        dispatch: env.DISPATCH_SLACK_CHANNEL || DEFAULTS.slackChannels.dispatch,
        sales: env.BM_SALES_SLACK_CHANNEL || DEFAULTS.slackChannels.sales,
        tradeIn: env.BM_TRADEIN_SLACK_CHANNEL || DEFAULTS.slackChannels.tradeIn,
        gradeCheck: env.BM_GRADE_CHECK_SLACK_CHANNEL || DEFAULTS.slackChannels.gradeCheck,
      },
    },
  };
}

function resolveSlackChannel(channel = 'dispatch', env = process.env) {
  if (!channel) return getNotificationConfig(env).slack.channels.dispatch;
  if (DEFAULTS.slackChannels[channel]) {
    return env[CHANNEL_ENV[channel]] || DEFAULTS.slackChannels[channel];
  }
  return channel;
}

function getLogger(logger) {
  return logger || console;
}

function failResult(service, error) {
  return { ok: false, service, error: error.message || String(error) };
}

async function postTelegram(text, options = {}) {
  const {
    dryRun = false,
    parseMode,
    chatId,
    logger,
    fetchImpl = fetch,
    throwOnError = false,
  } = options;
  const log = getLogger(logger);
  const config = getNotificationConfig(options.env);
  const token = options.token || config.telegram.token;
  const targetChat = chatId || config.telegram.chatId;

  if (dryRun) {
    log.log?.(`  [DRY RUN] Would send to Telegram: ${String(text).slice(0, 150)}...`);
    return { ok: true, service: 'telegram', dryRun: true, chatId: targetChat };
  }
  if (!token) {
    log.warn?.('[notifications] TELEGRAM_BOT_TOKEN not set; skipping Telegram.');
    return { ok: false, service: 'telegram', skipped: true, reason: 'missing TELEGRAM_BOT_TOKEN' };
  }

  try {
    const body = { chat_id: targetChat, text };
    if (parseMode) body.parse_mode = parseMode;
    const resp = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await resp.json().catch(() => ({}));
    if (!resp.ok || result.ok === false) {
      throw new Error(`Telegram ${resp.status}: ${result.description || 'sendMessage failed'}`);
    }
    return { ok: true, service: 'telegram', chatId: targetChat, response: result };
  } catch (error) {
    log.warn?.(`[notifications] Telegram failed: ${error.message}`);
    if (throwOnError) throw error;
    return failResult('telegram', error);
  }
}

async function postSlack(text, options = {}) {
  const {
    dryRun = false,
    channel = 'dispatch',
    logger,
    fetchImpl = fetch,
    throwOnError = false,
  } = options;
  const log = getLogger(logger);
  const config = getNotificationConfig(options.env);
  const token = options.token || config.slack.token;
  const resolvedChannel = resolveSlackChannel(channel, options.env);

  if (dryRun) {
    log.log?.(`  [DRY RUN] Would send to Slack ${resolvedChannel}: ${String(text).slice(0, 150)}...`);
    return { ok: true, service: 'slack', dryRun: true, channel: resolvedChannel };
  }
  if (!token) {
    if (config.slack.webhookUrl) {
      try {
        const resp = await fetchImpl(config.slack.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!resp.ok) throw new Error(`Slack webhook HTTP ${resp.status}`);
        return { ok: true, service: 'slack', webhook: true };
      } catch (error) {
        log.warn?.(`[notifications] Slack webhook failed: ${error.message}`);
        if (throwOnError) throw error;
        return failResult('slack', error);
      }
    }
    log.warn?.('[notifications] SLACK_BOT_TOKEN not set; skipping Slack.');
    return { ok: false, service: 'slack', skipped: true, reason: 'missing SLACK_BOT_TOKEN' };
  }

  try {
    const resp = await fetchImpl('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channel: resolvedChannel, text }),
    });
    const result = await resp.json().catch(() => ({}));
    if (!resp.ok || result.ok === false) {
      throw new Error(`Slack ${resp.status}: ${result.error || 'chat.postMessage failed'}`);
    }
    return { ok: true, service: 'slack', channel: resolvedChannel, response: result };
  } catch (error) {
    log.warn?.(`[notifications] Slack failed: ${error.message}`);
    if (throwOnError) throw error;
    return failResult('slack', error);
  }
}

async function notifyBm(text, options = {}) {
  const telegram = options.telegram !== false
    ? postTelegram(text, {
        ...options.telegramOptions,
        dryRun: options.dryRun,
        logger: options.logger,
        env: options.env,
        fetchImpl: options.fetchImpl,
      })
    : Promise.resolve({ ok: true, service: 'telegram', skipped: true });
  const slack = options.slack !== false
    ? postSlack(text, {
        ...options.slackOptions,
        channel: options.slackChannel || options.slackOptions?.channel || 'dispatch',
        dryRun: options.dryRun,
        logger: options.logger,
        env: options.env,
        fetchImpl: options.fetchImpl,
      })
    : Promise.resolve({ ok: true, service: 'slack', skipped: true });

  const results = await Promise.all([telegram, slack]);
  return {
    ok: results.every((result) => result.ok || result.skipped),
    results,
  };
}

async function notificationHealthCheck(options = {}) {
  const { env = process.env, fetchImpl = fetch, probe = false } = options;
  const config = getNotificationConfig(env);
  const health = {
    ok: true,
    telegram: {
      configured: Boolean(config.telegram.token && config.telegram.chatId),
      token: Boolean(config.telegram.token),
      tokenSource: config.telegram.token ? config.telegram.tokenSource : null,
      chatId: config.telegram.chatId,
    },
    slack: {
      configured: Boolean(config.slack.token || config.slack.webhookUrl),
      token: Boolean(config.slack.token),
      webhookUrl: Boolean(config.slack.webhookUrl),
      channels: config.slack.channels,
    },
  };

  if (!probe) {
    health.ok = health.telegram.configured || health.slack.configured;
    return health;
  }

  if (config.telegram.token) {
    try {
      const resp = await fetchImpl(`https://api.telegram.org/bot${config.telegram.token}/getMe`);
      const result = await resp.json().catch(() => ({}));
      health.telegram.probeOk = Boolean(resp.ok && result.ok !== false);
      if (!health.telegram.probeOk) {
        health.telegram.error = result.description || `HTTP ${resp.status}`;
      }
    } catch (error) {
      health.telegram.probeOk = false;
      health.telegram.error = error.message;
    }
  }

  if (config.slack.token) {
    try {
      const resp = await fetchImpl('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${config.slack.token}`,
        },
      });
      const result = await resp.json().catch(() => ({}));
      health.slack.probeOk = Boolean(resp.ok && result.ok !== false);
      if (!health.slack.probeOk) {
        health.slack.error = result.error || `HTTP ${resp.status}`;
      }
    } catch (error) {
      health.slack.probeOk = false;
      health.slack.error = error.message;
    }
  }

  health.ok = Boolean(
    (!config.telegram.token || health.telegram.probeOk) &&
    (!config.slack.token || health.slack.probeOk) &&
    (config.telegram.token || config.slack.token || config.slack.webhookUrl)
  );
  return health;
}

module.exports = {
  DEFAULTS,
  getNotificationConfig,
  notificationHealthCheck,
  notifyBm,
  postSlack,
  postTelegram,
  resolveSlackChannel,
};
