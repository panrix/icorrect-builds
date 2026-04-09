import fs from "node:fs";
import path from "node:path";
import { buildFallbackDraft } from "../lib/draft.js";
import { buildConversationCard } from "./card-builder.js";
import { extractConversationCustomer, flattenMessages, formatTelegramCard, isActionableConversation } from "../lib/triage.js";

const ROOT = "/home/ricky/builds/alex-triage-rebuild";
const FIXTURES_PATH = path.join(ROOT, "data", "email-triage-fixtures.json");
const OUT_JSON = path.join(ROOT, "data", "email-triage-validation-results.json");
const OUT_MD = path.join(ROOT, "data", "email-triage-validation.md");
const WORKSPACE_ID = "pt6lwaq6";

function loadFixtures() {
  return JSON.parse(fs.readFileSync(FIXTURES_PATH, "utf8"));
}

function buildDecision(fixture, conversation, messages, existingConversation) {
  const stale = fixture.checkpoint
    ? Number(conversation.updated_at || 0) * 1000 <= Date.parse(fixture.checkpoint)
    : false;
  const actionable = isActionableConversation(conversation, messages);
  const alreadyProcessed = !!(existingConversation?.telegram_message_id && ["sent", "skipped", "sending"].includes(existingConversation?.status));

  if (stale) return "exclude_stale";
  if (!actionable) return "exclude_non_actionable";
  if (alreadyProcessed) return "exclude_already_processed";
  return "post";
}

function pass(expected, actual) {
  return expected === undefined || expected === actual;
}

function summarizeResult(result) {
  return {
    id: result.id,
    description: result.description,
    decision: result.decision,
    pass: result.pass,
    customer_name: result.customer.name,
    customer_email: result.customer.email,
    previous_repairs_summary: result.previousRepairsSummary,
    monday_item: result.mondayItem,
    monday_link: result.mondayLink,
    latest_message_excerpt: result.latestMessage,
    draft_reply_quality: result.draft,
    routing_or_exclusion: result.decision
  };
}

function main() {
  const fixtures = loadFixtures();
  const results = fixtures.map((fixture) => {
    const conversation = fixture.conversation;
    const messages = flattenMessages(conversation);
    const customer = extractConversationCustomer(conversation);
    const decision = buildDecision(fixture, conversation, messages, fixture.existingConversation);

    let card = null;
    let draft = null;
    if (decision === "post") {
      const built = buildConversationCard({
        conversation,
        mondayMatch: fixture.mondayMatch,
        mondayAlternatives: [],
        pastRepairs: fixture.pastRepairs,
        price: fixture.price,
        workspaceId: WORKSPACE_ID
      });
      card = built.card;
      draft = buildFallbackDraft(card);
    }

    const passes = [];
    passes.push(pass(fixture.expected.decision, decision));
    if (card) {
      passes.push(pass(fixture.expected.type, card.type));
      passes.push(pass(fixture.expected.mondayMatched, !!card.context.monday_item_id));
      passes.push(pass(fixture.expected.hasPastRepairs, !!fixture.pastRepairs.length));
      if (fixture.expected.customerTypeContains) passes.push(String(card.customer_type).includes(fixture.expected.customerTypeContains));
      if (fixture.expected.priceLabelContains) passes.push(String(card.price).includes(fixture.expected.priceLabelContains));
    }

    return {
      id: fixture.id,
      description: fixture.description,
      pass: passes.every(Boolean),
      decision,
      customer,
      previousRepairsSummary: fixture.pastRepairs.length
        ? fixture.pastRepairs.map((repair) => `${repair.completion_date}: ${repair.device_model} ${repair.repair_type}`).join(" | ")
        : "No previous repair history.",
      mondayItem: card?.context?.monday_item_label || card?.context?.monday_item_id || "None",
      mondayLink: card?.context?.monday_item_id ? `https://icorrect.monday.com/boards/349212843/pulses/${card.context.monday_item_id}` : "None",
      latestMessage: card?.latest_message || messages.at(-1)?.text || "None",
      draft: draft || "Excluded",
      renderedCard: card ? formatTelegramCard(card, draft) : null,
      rawCard: card
    };
  });

  fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2));

  const lines = [
    "# Email Triage Validation — 2026-04-09",
    "",
    "## Scope",
    "",
    "Email triage only. Quote triage excluded from live validation. Live posting remains disabled unless `ALEX_ENABLE_LIVE_POSTING=1`.",
    "",
    "## Test cases",
    ""
  ];

  for (const result of results) {
    lines.push(`### ${result.id} — ${result.description}`);
    lines.push("");
    lines.push(`- Pass: ${result.pass ? "PASS" : "FAIL"}`);
    lines.push(`- Decision: ${result.decision}`);
    lines.push(`- Customer: ${result.customer.name} <${result.customer.email || "unknown"}>`);
    lines.push(`- Previous repairs: ${result.previousRepairsSummary}`);
    lines.push(`- Monday item: ${result.mondayItem}`);
    lines.push(`- Monday link: ${result.mondayLink}`);
    lines.push(`- Latest message excerpt: ${result.latestMessage}`);
    lines.push(`- Draft reply quality: ${result.draft.replace(/\n/g, " ")}`);
    lines.push("");
  }

  const passCount = results.filter((result) => result.pass).length;
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Passed: ${passCount}/${results.length}`);
  lines.push(`- Failed: ${results.length - passCount}/${results.length}`);
  lines.push("- Go/No-Go: GO only when all tests pass and live posting remains gated behind `ALEX_ENABLE_LIVE_POSTING=1`.");
  fs.writeFileSync(OUT_MD, lines.join("\n"));

  console.log(JSON.stringify(results.map(summarizeResult), null, 2));
}

main();
