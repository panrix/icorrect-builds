import assert from "node:assert/strict";
import { getConfig } from "../lib/config.js";
import { MondayClient } from "../lib/monday.js";
import { TelegramClient } from "../lib/telegram.js";
import { lookupRepairHistory } from "../lib/repair-history.js";
import { buildConversationCard } from "./card-builder.js";
import { enrichConversationV2 } from "./monday-enrich-v2.js";
import { formatTelegramCard } from "../lib/triage.js";

function pickFixture(items) {
  return items.find((item) => item.email && item.intercom_id) || items.find((item) => item.email) || null;
}

async function main() {
  const config = getConfig();
  const monday = new MondayClient(config.monday);
  const telegram = new TelegramClient(config.telegram);
  const activeItems = await monday.fetchRecentItems({ limit: 50 });
  const fixture = pickFixture(activeItems);
  assert.ok(fixture, "Expected live Monday fixture item");

  const history = await lookupRepairHistory({ config, email: fixture.email, phone: fixture.phone, limit: 5 }).catch(() => []);
  const match = await enrichConversationV2({
    mondayClient: monday,
    customerEmail: fixture.email,
    customerPhone: fixture.phone,
    customerName: fixture.name,
    conversationId: fixture.intercom_id,
    deviceHint: fixture.device_model || fixture.name
  });
  assert.ok(match.best_match, "Expected a best Monday match");

  const conversation = {
    id: fixture.intercom_id || `fixture-${fixture.id}`,
    created_at: Math.floor(Date.now() / 1000),
    source: {
      type: "email",
      author: { name: fixture.name, email: fixture.email, phone: fixture.phone },
      body: `Hello, any update on my ${fixture.device_model || "repair"}?`
    },
    contacts: { contacts: [{ name: fixture.name, email: fixture.email, phone: fixture.phone }] },
    conversation_parts: { conversation_parts: [] }
  };

  const green = buildConversationCard({
    conversation,
    mondayMatch: { ...match.best_match, confidence: 0.95, payment_status: "Confirmed", status: "Quote Sent" },
    mondayAlternatives: match.alternatives,
    pastRepairs: history,
    price: { label: "£99" },
    workspaceId: config.intercom.workspaceId
  }).card;

  const red = buildConversationCard({
    conversation: { ...conversation, source: { ...conversation.source, body: "I want a refund and I may contact trading standards" } },
    mondayMatch: { ...match.best_match, confidence: 0.95, payment_status: "Confirmed", status: "Quote Sent" },
    mondayAlternatives: match.alternatives,
    pastRepairs: history,
    price: { label: "£99" },
    workspaceId: config.intercom.workspaceId
  }).card;
  red.type = "complaint";
  red.confidence = { tier: "red", emoji: "🔴", label: "Escalate" };

  const greenKeyboard = telegram.keyboard(conversation.id, { tier: green.confidence.tier });
  const redKeyboard = telegram.keyboard(conversation.id, { tier: red.confidence.tier });
  assert.ok(JSON.stringify(greenKeyboard).includes("approve"), "Green card should expose approve");
  assert.ok(!JSON.stringify(redKeyboard).includes("approve"), "Red card must not expose approve");

  const rendered = formatTelegramCard(green, "Draft reply test");
  assert.ok(rendered.includes("━ CUSTOMER ━"), "Expected customer section");
  assert.ok(rendered.includes("━ ACTIVE REPAIR ━"), "Expected active repair section");
  assert.ok(rendered.includes("━━ DRAFT REPLY ━"), "Expected draft section");
  assert.ok(rendered.includes("━━ SOURCE ━"), "Expected source section");

  console.log(JSON.stringify({
    fixture: { id: fixture.id, email: fixture.email, intercom_id: fixture.intercom_id },
    bestMatch: match.best_match,
    greenTier: green.confidence,
    redKeyboard,
    renderedSnippet: rendered.slice(0, 500)
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
