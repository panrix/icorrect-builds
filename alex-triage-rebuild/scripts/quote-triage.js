import fs from "node:fs";
import path from "node:path";
import { getConfig } from "../lib/config.js";
import { openDb, startRun, completeRun, upsertConversation, updateConversationAfterTelegramPost } from "../lib/db.js";
import { lookupRepairHistory } from "../lib/repair-history.js";
import { DraftClient, buildFallbackDraft } from "../lib/draft.js";
import { MondayClient } from "../lib/monday.js";
import { TelegramClient } from "../lib/telegram.js";
import { formatTelegramCard } from "../lib/triage.js";

const QUOTE_JSON = "/home/ricky/builds/alex-triage-rebuild/data/historical-quote-emails.json";
const RUN_TYPE = "quote_triage";

function parseArgs(argv) {
  const args = { mode: "check", limit: 25, dryRun: false };
  for (const part of argv) {
    if (part.startsWith("--mode=")) args.mode = part.split("=")[1];
    if (part.startsWith("--limit=")) args.limit = Number(part.split("=")[1] || 25);
    if (part === "--dry-run") args.dryRun = true;
  }
  return args;
}

function cleanText(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function loadHistoricalQuotes() {
  if (!fs.existsSync(QUOTE_JSON)) return [];
  try {
    return JSON.parse(fs.readFileSync(QUOTE_JSON, "utf8"));
  } catch {
    return [];
  }
}

function extractDiagnosticFindings(item) {
  const updates = item.updates || [];
  const findings = [];
  for (const update of updates) {
    const text = cleanText(update.body || "");
    if (!text) continue;
    if (/fault|diagnostic|issue|required repair|repair details|corrosion|charging|screen|battery|board/i.test(text)) {
      findings.push(text.slice(0, 500));
    }
    for (const reply of update.replies || []) {
      const replyText = cleanText(reply.body || "");
      if (/fault|diagnostic|issue|required repair|repair details|corrosion|charging|screen|battery|board/i.test(replyText)) {
        findings.push(replyText.slice(0, 500));
      }
    }
  }
  return findings.slice(-6);
}

function chooseHistoricalQuotes(historicalQuotes, item) {
  const device = String(item.device_model || item.name || "").toLowerCase();
  const repairType = String(item.repair_type || "").toLowerCase();
  return historicalQuotes
    .filter((quote) => {
      const quoteDevice = String(quote.device_model || "").toLowerCase();
      const quoteRepair = String(quote.repair_type || "").toLowerCase();
      return (device && quoteDevice && (device.includes(quoteDevice) || quoteDevice.includes(device) || device.split(" ")[0] === quoteDevice.split(" ")[0]))
        || (repairType && quoteRepair && repairType === quoteRepair);
    })
    .slice(0, 5);
}

function buildQuoteBreakdown(item, findings) {
  const parts = [];
  if (item.quote_amount) parts.push(`Quoted amount on Monday: £${item.quote_amount}`);
  if (item.payment_status) parts.push(`Payment status: ${item.payment_status}`);
  if (item.current_status) parts.push(`Current Monday status: ${item.current_status}`);
  for (const finding of findings.slice(0, 3)) {
    parts.push(finding.split("\n")[0]);
  }
  return parts;
}

function determineQuoteConfidence(item, findings, historicalQuotes) {
  if (!item.intercom_id) return { tier: "red", emoji: "🔴", label: "Escalate" };
  if (!findings.length || !historicalQuotes.length) return { tier: "yellow", emoji: "🟡", label: "Needs review" };
  if (item.quote_amount || /£\s?\d+/.test(findings.join("\n"))) return { tier: "green", emoji: "🟢", label: "Ready to send" };
  return { tier: "yellow", emoji: "🟡", label: "Needs review" };
}

function isLikelyCustomerEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function buildQuoteCard({ item, findings, pastRepairs, historicalQuotes }) {
  const confidence = determineQuoteConfidence(item, findings, historicalQuotes);
  return {
    card_kind: "quote",
    id: item.intercom_id || `quote:${item.id}`,
    customer_name: item.name,
    customer_email: item.email,
    customer_phone: item.phone,
    type: "Quote Building",
    channel: "Email",
    device: item.device_model || "N/A",
    priority: confidence.tier === "red" ? "P1" : "P2",
    confidence,
    diagnostic_findings: findings,
    quote_breakdown: buildQuoteBreakdown(item, findings),
    context: {
      monday_item_id: item.id,
      monday_item_label: item.name,
      monday_url: `https://icorrect.monday.com/boards/349212843/pulses/${item.id}`,
      kb_used: ["historical-quote-emails.json", "ferrari-context.md"],
      pricing_source: item.quote_amount ? "From Monday repair ✓" : "From diagnostic notes ⚠️",
      historical_quote_count: historicalQuotes.length,
      past_repairs: pastRepairs
    }
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = getConfig();
  const db = openDb();
  const telegram = new TelegramClient(config.telegram);
  const monday = new MondayClient(config.monday);
  const drafter = new DraftClient(config.openrouter);
  const historicalQuotes = loadHistoricalQuotes();
  const runId = startRun(db, RUN_TYPE);

  try {
    const candidates = (await monday.fetchQuoteCandidates({ limit: Math.max(args.limit * 20, 500) }))
      .filter((item) => isLikelyCustomerEmail(item.email))
      .filter((item) => !["BM", "Corporate"].includes(item.client_status || ""))
      .slice(0, args.limit);

    let actionable = 0;
    for (const candidate of candidates) {
      const fullItem = await monday.getItemWithUpdates(candidate.id);
      const findings = extractDiagnosticFindings(fullItem || candidate);
      const pastRepairs = await lookupRepairHistory({ config, email: candidate.email, phone: candidate.phone, limit: 5 }).catch(() => []);
      const quoteExamples = chooseHistoricalQuotes(historicalQuotes, candidate);
      const card = buildQuoteCard({ item: candidate, findings, pastRepairs, historicalQuotes: quoteExamples });

      let draftText = "";
      try {
        draftText = await drafter.draftQuote({
          ferrariContextPath: path.join(config.dataDir, "ferrari-context.md"),
          learnedRulesPath: path.join(config.dataDir, "learned-rules.md"),
          card,
          historicalQuotes: quoteExamples,
          diagnosticNotes: findings
        });
      } catch (error) {
        console.error(`Quote draft failed for Monday item ${candidate.id}:`, error);
        draftText = buildFallbackDraft({ customer_name: candidate.name, type: "quote", price: candidate.quote_amount ? `£${candidate.quote_amount}` : "Quote pending" });
      }

      const conversationId = candidate.intercom_id ? String(candidate.intercom_id) : `quote:${candidate.id}`;

      upsertConversation(db, {
        id: conversationId,
        customerName: candidate.name,
        customerEmail: candidate.email,
        category: "quote_build",
        priority: card.priority,
        mondayItemId: String(candidate.id),
        card,
        draftText,
        originalDraft: draftText,
        runType: RUN_TYPE,
        status: "pending"
      });

      actionable += 1;
      if (!args.dryRun) {
        const sent = await telegram.sendCard({
          text: formatTelegramCard(card, draftText),
          conversationId,
          card
        });
        if (sent?.result?.message_id) {
          updateConversationAfterTelegramPost(db, conversationId, {
            telegramMessageId: String(sent.result.message_id),
            telegramChatId: String(sent.result.chat?.id || ""),
            telegramThreadId: sent.result.message_thread_id ? String(sent.result.message_thread_id) : null
          });
        }
      }
    }

    completeRun(db, runId, {
      conversationsFound: candidates.length,
      conversationsActionable: actionable,
      status: "completed"
    });
  } catch (error) {
    completeRun(db, runId, {
      status: "failed",
      errorText: error instanceof Error ? error.message : String(error)
    });
    throw error;
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
