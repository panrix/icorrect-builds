import assert from "node:assert/strict";
import { TelegramClient } from "../lib/telegram.js";
import { getConfig } from "../lib/config.js";

function main() {
  const config = getConfig({ strict: false });
  const telegram = new TelegramClient({
    ...config.telegram,
    token: config.telegram.token || "test-token"
  });

  const green = telegram.keyboard("conv-1", { tier: "green" });
  const yellow = telegram.keyboard("conv-2", { tier: "yellow" });
  const red = telegram.keyboard("conv-3", { tier: "red" });

  assert.ok(JSON.stringify(green).includes("approve:conv-1"), "Green cards should allow approve");
  assert.ok(JSON.stringify(yellow).includes("approve:conv-2"), "Yellow cards should allow approve");
  assert.ok(JSON.stringify(green).includes("snooze:conv-1"), "Green cards should allow snooze");
  assert.ok(JSON.stringify(green).includes("escalate:conv-1"), "Green cards should allow escalate");
  assert.ok(JSON.stringify(green).includes("/edit?id=conv-1"), "Green cards should allow edit");
  assert.ok(!JSON.stringify(red).includes("approve:conv-3"), "Red cards must not allow approve");
  assert.ok(JSON.stringify(red).includes("snooze:conv-3"), "Red cards should allow snooze");
  assert.ok(JSON.stringify(red).includes("escalate:conv-3"), "Red cards should allow escalate");

  console.log(JSON.stringify({
    approve: "PASS",
    edit: "PASS",
    escalate: "PASS",
    snooze: "PASS",
    threadRouting: config.telegram.emailsThreadId
  }, null, 2));
}

main();
