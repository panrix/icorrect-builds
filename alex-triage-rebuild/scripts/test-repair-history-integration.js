import fs from "node:fs";
import assert from "node:assert/strict";
import { getConfig } from "../lib/config.js";
import { lookupRepairHistory } from "../lib/repair-history.js";
import { SupabaseClient } from "../lib/supabase.js";
import { MondayClient } from "../lib/monday.js";
import { buildConversationCard } from "./card-builder.js";
import { enrichConversationV2 } from "./monday-enrich-v2.js";
import { formatTelegramCard } from "../lib/triage.js";

const SUMMARY_PATH = "/home/ricky/builds/alex-triage-rebuild/data/repair-history-import-summary.json";

function pickActiveFixture(items) {
  return items.find((item) => item.email && item.intercom_id) || items.find((item) => item.email) || null;
}

async function main() {
  const config = getConfig();
  const supabase = new SupabaseClient(config.supabase);
  const monday = new MondayClient(config.monday);
  const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, "utf8"));

  const rowCount = await supabase.countRepairHistory();
  assert.equal(rowCount, 1889, `Expected 1889 repair_history rows, got ${rowCount}`);

  const history = await lookupRepairHistory({
    config,
    email: summary.sampleSearchEmail,
    limit: 3
  });
  assert.ok(Array.isArray(history) && history.length >= 1, "Expected search_repair_history to return at least one result");

  const activeItems = await monday.fetchRecentItems({ limit: 50 });
  const fixture = pickActiveFixture(activeItems);
  assert.ok(fixture, "Expected at least one active Monday item with an email or Intercom ID");

  const cascade = await enrichConversationV2({
    mondayClient: monday,
    customerEmail: fixture.email,
    customerPhone: fixture.phone,
    customerName: fixture.name,
    conversationId: fixture.intercom_id,
    deviceHint: fixture.device_model || fixture.name
  });

  assert.ok(cascade.best_match, "Expected Monday enrichment to return a best_match");
  assert.ok(cascade.best_match.confidence >= 0.5, `Expected confidence >= 0.5, got ${cascade.best_match.confidence}`);
  assert.equal(cascade.best_match.monday_item_id, fixture.id, "Expected best match to point to the same Monday item fixture");

  const conversation = {
    id: fixture.intercom_id || "test-conversation",
    created_at: Math.floor(Date.now() / 1000),
    state: "open",
    source: {
      type: "email",
      author: {
        name: fixture.name,
        email: fixture.email,
        phone: fixture.phone
      },
      body: `Hi, can I get an update on my ${fixture.device_model || "device"}?`
    },
    contacts: {
      contacts: [
        {
          name: fixture.name,
          email: fixture.email,
          phone: fixture.phone
        }
      ]
    },
    conversation_parts: { conversation_parts: [] }
  };

  const { card } = buildConversationCard({
    conversation,
    mondayMatch: cascade.best_match,
    mondayAlternatives: cascade.alternatives,
    pastRepairs: history,
    price: null,
    workspaceId: config.intercom.workspaceId
  });

  assert.ok(Array.isArray(card.context.past_repairs), "Expected card to include past repairs array");
  const telegram = formatTelegramCard(card, "Draft test reply");
  assert.ok(telegram.includes("━ PAST REPAIRS ━"), "Expected Telegram card to render past repairs section");
  assert.ok(telegram.includes("Monday:"), "Expected Telegram card to render Monday section");

  console.log(JSON.stringify({
    rowCount,
    historyHits: history.length,
    bestMatch: cascade.best_match,
    renderedCardSnippet: telegram.slice(0, 400)
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
