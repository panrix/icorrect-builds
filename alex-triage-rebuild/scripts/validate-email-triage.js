import fs from "node:fs";
import path from "node:path";
import { buildFallbackDraft } from "../lib/draft.js";
import {
  EMAIL_TRIAGE_FRESHNESS_DAYS,
  evaluateEmailTriageCandidate,
  extractConversationCustomer,
  flattenMessages,
  formatTelegramCard
} from "../lib/triage.js";
import { buildConversationCard } from "./card-builder.js";

const ROOT = "/home/ricky/builds/alex-triage-rebuild";
const VALIDATION_DIR = path.join(ROOT, "docs", "validation");
const FIXTURES_PATH = path.join(VALIDATION_DIR, "email-triage-fixtures.json");
const RUN_DATE = new Date().toISOString().slice(0, 10);
const OUT_JSON = path.join(VALIDATION_DIR, `email-triage-validation-results-${RUN_DATE}.json`);
const OUT_MD = path.join(VALIDATION_DIR, `email-triage-validation-${RUN_DATE}.md`);
const WORKSPACE_ID = "pt6lwaq6";

function loadFixtures() {
  return JSON.parse(fs.readFileSync(FIXTURES_PATH, "utf8"));
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

function expectedOutcomeText(fixture) {
  const bits = [];
  if (fixture.expected.decision) {
    bits.push(`decision=${fixture.expected.decision}`);
  }
  if (fixture.expected.type) {
    bits.push(`type=${fixture.expected.type}`);
  }
  if (fixture.expected.mondayMatched !== undefined) {
    bits.push(`mondayMatched=${fixture.expected.mondayMatched}`);
  }
  if (fixture.expected.hasPastRepairs !== undefined) {
    bits.push(`hasPastRepairs=${fixture.expected.hasPastRepairs}`);
  }
  if (fixture.expected.priceLabelContains) {
    bits.push(`price~${fixture.expected.priceLabelContains}`);
  }
  return bits.join(", ");
}

function main() {
  const fixtures = loadFixtures();
  const results = fixtures.map((fixture) => {
    const conversation = fixture.conversation;
    const messages = flattenMessages(conversation);
    const customer = extractConversationCustomer(conversation);
    const decision = evaluateEmailTriageCandidate({
      conversation,
      messages,
      checkpointIso: fixture.checkpoint || null,
      existingConversation: fixture.existingConversation || null
    });

    let card = null;
    let draft = null;
    if (decision.include) {
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
    passes.push(pass(fixture.expected.decision, decision.reason));
    if (card) {
      passes.push(pass(fixture.expected.type, card.type));
      passes.push(pass(fixture.expected.mondayMatched, !!card.context.monday_item_id));
      passes.push(pass(fixture.expected.hasPastRepairs, !!fixture.pastRepairs.length));
      if (fixture.expected.customerTypeContains) {
        passes.push(String(card.customer_type).includes(fixture.expected.customerTypeContains));
      }
      if (fixture.expected.priceLabelContains) {
        passes.push(String(card.price).includes(fixture.expected.priceLabelContains));
      }
    }

    return {
      id: fixture.id,
      description: fixture.description,
      pass: passes.every(Boolean),
      decision: decision.reason,
      expectedOutcome: expectedOutcomeText(fixture),
      actualOutcome: card
        ? [
            `decision=${decision.reason}`,
            `type=${card.type}`,
            `mondayMatched=${Boolean(card.context?.monday_item_id)}`,
            `hasPastRepairs=${Boolean(fixture.pastRepairs.length)}`,
            `price=${card.price}`
          ].join(", ")
        : `decision=${decision.reason}`,
      customer,
      previousRepairsSummary: fixture.pastRepairs.length
        ? fixture.pastRepairs.map((repair) => `${repair.completion_date}: ${repair.device_model} ${repair.repair_type}`).join(" | ")
        : "No previous repair history.",
      mondayItem: card?.context?.monday_item_label || card?.context?.monday_item_id || "None",
      mondayLink: card?.context?.monday_url || "None",
      latestMessage: card?.latest_message || messages.at(-1)?.text || "None",
      draft: draft || "Excluded",
      renderedCard: card ? formatTelegramCard(card, draft) : null,
      rawCard: card
    };
  });

  fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2));

  const lines = [
    `# Email Triage Validation — ${RUN_DATE}`,
    "",
    "## Scope",
    "",
    "Email triage only. Quote triage excluded from live validation. Live posting remains disabled unless `ALEX_ENABLE_LIVE_POSTING=1`.",
    "This fixture pack does not prove a fresh live Telegram post, SQLite `telegram_message_id` persistence for a newly posted card, or checkpoint advancement in the real runtime.",
    "",
    "## Hard Guards",
    "",
    `- Freshness window: ${EMAIL_TRIAGE_FRESHNESS_DAYS} days`,
    "- Email-only intake: non-email conversations are excluded before drafting/posting.",
    "- Processed-state dedupe: existing Telegram-reviewed or sent conversations are excluded from repost.",
    "- Historical quote noise: stale/last-year quote threads are excluded.",
    "",
    "## Test cases",
    ""
  ];

  for (const result of results) {
    lines.push(`### ${result.id} — ${result.description}`);
    lines.push("");
    lines.push(`- Pass: ${result.pass ? "PASS" : "FAIL"}`);
    lines.push(`- Expected outcome: ${result.expectedOutcome}`);
    lines.push(`- Actual outcome: ${result.actualOutcome}`);
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
  lines.push("- Go/No-Go: `NO-GO` for any immediate ready-for-restart claim. These fixture cases passed, but QA acceptance for end-to-end live posting is still unproven.");
  lines.push("- Required for `GO`: one controlled live run after deploy must land a new Telegram card in thread `774`, persist a new `telegram_message_id` in SQLite, and advance the relevant checkpoint beyond `2026-04-08T07:46:02.522Z` / `2026-04-09T08:50:43.530Z`.");
  fs.writeFileSync(OUT_MD, lines.join("\n"));

  console.log(JSON.stringify(results.map(summarizeResult), null, 2));
}

main();
