const assert = require("assert");

const {
  getCustomerMessageKey,
  getLatestCustomerMessage,
  mergeRecheckState,
} = require("../src/lib/recheck-dedupe");

const messages = [
  { author: "BackMarket", date: "2026-03-06T17:25:18Z", body: "System status" },
  { author: "Merchant", date: "2026-03-06T13:46:05Z", body: "Our outgoing reply" },
  { author: "Unknown", date: "2026-03-06T13:27:43Z", body: "all good" },
  { author: "Client", date: "2026-02-28T09:41:48Z", body: "older customer reply" },
];

const latest = getLatestCustomerMessage(messages);
assert.strictEqual(latest.body, "all good");
assert.strictEqual(
  getCustomerMessageKey(latest),
  "unknown|2026-03-06T13:27:43Z|all good"
);

assert.deepStrictEqual(
  mergeRecheckState(
    { "GB-1": { customerCount: 2 }, "GB-2": { customerCount: 4 } },
    { "GB-1": { customerCount: 3 }, "GB-3": { messageCount: 5 } }
  ),
  {
    "GB-1": { customerCount: 3 },
    "GB-2": { customerCount: 4 },
    "GB-3": { messageCount: 5 },
  }
);

console.log("recheck-dedupe tests passed");
