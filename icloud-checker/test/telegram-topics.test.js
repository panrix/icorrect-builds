const assert = require("assert");

const { getTelegramConfig, resolveTopic } = require("../src/lib/telegram-topics");

const env = {
  ICORRECT_TELEGRAM_BOT_TOKEN: "token",
  BM_TELEGRAM_CHAT: "-1001",
  BM_TELEGRAM_TOPIC_ICLOUD_SPEC: "111",
  BM_TELEGRAM_TOPIC_ICLOUD_LOCKED: "222",
};

const config = getTelegramConfig(env);
assert.strictEqual(config.token, "token");
assert.strictEqual(config.tokenSource, "ICORRECT_TELEGRAM_BOT_TOKEN");
assert.strictEqual(config.chatId, "-1001");
assert.strictEqual(config.topics.icloudSpec, "111");
assert.strictEqual(config.topics.icloudLocked, "222");
assert.strictEqual(resolveTopic("icloudSpec", env), "111");
assert.strictEqual(resolveTopic("icloudLocked", env), "222");
assert.strictEqual(resolveTopic("999", env), "999");

console.log("telegram-topics tests passed");
