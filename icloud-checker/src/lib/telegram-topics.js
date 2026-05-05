const fs = require("fs");

const DEFAULT_CHAT_ID = "-1003888456344";
const DEFAULT_TOPICS = Object.freeze({
  icloudSpec: "5637",
  icloudLocked: "5638",
});
const FALLBACK_ENV_FILES = [
  "/home/ricky/config/api-keys/.env",
  "/home/ricky/config/.env",
];

let cachedFileEnv = null;

function parseEnvFile(filePath) {
  try {
    const parsed = {};
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      parsed[match[1]] = value;
    }
    return parsed;
  } catch {
    return {};
  }
}

function getFileEnv() {
  if (!cachedFileEnv) {
    cachedFileEnv = FALLBACK_ENV_FILES.reduce((acc, filePath) => ({ ...acc, ...parseEnvFile(filePath) }), {});
  }
  return cachedFileEnv;
}

function getEnvValue(name, env = process.env) {
  return env[name] || getFileEnv()[name] || "";
}

function getTelegramConfig(env = process.env) {
  const icorrectToken = getEnvValue("ICORRECT_TELEGRAM_BOT_TOKEN", env);
  const legacyToken = getEnvValue("TELEGRAM_BOT_TOKEN", env);
  return {
    token: icorrectToken || legacyToken,
    tokenSource: icorrectToken ? "ICORRECT_TELEGRAM_BOT_TOKEN" : "TELEGRAM_BOT_TOKEN",
    chatId: getEnvValue("BM_TELEGRAM_CHAT", env) || DEFAULT_CHAT_ID,
    topics: {
      icloudSpec: getEnvValue("BM_TELEGRAM_TOPIC_ICLOUD_SPEC", env) || DEFAULT_TOPICS.icloudSpec,
      icloudLocked: getEnvValue("BM_TELEGRAM_TOPIC_ICLOUD_LOCKED", env) || DEFAULT_TOPICS.icloudLocked,
    },
  };
}

function resolveTopic(topic, env = process.env) {
  const config = getTelegramConfig(env);
  return config.topics[topic] || String(topic || "");
}

async function postTelegramTopic(text, options = {}) {
  const config = getTelegramConfig(options.env);
  const token = options.token || config.token;
  const chatId = options.chatId || config.chatId;
  const threadId = options.messageThreadId || resolveTopic(options.topic, options.env);
  const logger = options.logger || console;

  if (!token) {
    logger.warn?.("[telegram-topics] Telegram token missing; skipping notification");
    return { ok: false, skipped: true, reason: "missing_token" };
  }

  try {
    const body = { chat_id: chatId, text: String(text) };
    const numericThreadId = Number(threadId);
    if (Number.isFinite(numericThreadId)) body.message_thread_id = numericThreadId;

    const resp = await (options.fetchImpl || fetch)(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await resp.json().catch(() => ({}));
    if (!resp.ok || result.ok === false) {
      throw new Error(`Telegram ${resp.status}: ${result.description || "sendMessage failed"}`);
    }
    return { ok: true, chatId, messageThreadId: threadId };
  } catch (err) {
    logger.warn?.(`[telegram-topics] Telegram send failed: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

module.exports = {
  DEFAULT_TOPICS,
  getTelegramConfig,
  postTelegramTopic,
  resolveTopic,
};
