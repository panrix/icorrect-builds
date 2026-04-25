import fs from "node:fs";
import path from "node:path";
import { getConfig } from "../lib/config.js";
import { requestJson } from "../lib/http.js";

const ROOT = "/home/ricky/builds/alex-triage-rebuild";
const PAGE_SIZE = 150;
const DEFAULT_PAUSE_MS = 250;
const CREATED_BY_ALEX_IMPORT = "9702338";
const SUPPORT_ADMIN_ID = "9702337";

function parseArgs(argv) {
  const args = {
    limit: null,
    pauseMs: DEFAULT_PAUSE_MS,
    outDate: new Date().toISOString().slice(0, 10)
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value.startsWith("--limit=")) {
      args.limit = Number(value.slice("--limit=".length));
    }
    if (value.startsWith("--pause-ms=")) {
      args.pauseMs = Number(value.slice("--pause-ms=".length));
    }
    if (value.startsWith("--date=")) {
      args.outDate = value.slice("--date=".length);
    }
  }

  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logLine(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
}

function lower(value) {
  return String(value || "").toLowerCase();
}

function htmlToText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function increment(map, key) {
  const normalized = String(key || "missing");
  map[normalized] = (map[normalized] || 0) + 1;
}

function ageDays(conversation, nowMs) {
  const updatedAt = Number(conversation.updated_at || conversation.updatedAt || 0) * 1000;
  if (!updatedAt) return null;
  return Math.floor((nowMs - updatedAt) / (24 * 60 * 60 * 1000));
}

function ageBucket(days) {
  if (days === null || Number.isNaN(days)) return "unknown";
  if (days >= 90) return "90d+";
  if (days >= 60) return "60-89d";
  if (days >= 30) return "30-59d";
  if (days >= 14) return "14-29d";
  if (days >= 7) return "7-13d";
  return "<7d";
}

function isoFromSeconds(value) {
  const seconds = Number(value || 0);
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

function createdBy(conversation) {
  return String(conversation.custom_attributes?.["Created by"] || "missing");
}

function sourceType(conversation) {
  return conversation.source?.type || "missing";
}

function deliveredAs(conversation) {
  return conversation.source?.delivered_as || "missing";
}

function ticketState(conversation) {
  return conversation.ticket?.state || "no_ticket";
}

function subjectText(conversation) {
  return htmlToText(
    conversation.source?.subject ||
      conversation.title ||
      conversation.ticket?.custom_attributes?._default_title_?.value ||
      ""
  );
}

function authorEmail(conversation) {
  return lower(conversation.source?.author?.email || "");
}

function hasCustomerReplyAfterAdmin(conversation) {
  const stats = conversation.statistics || {};
  const lastContactReplyAt = Number(stats.last_contact_reply_at || 0);
  const lastAdminReplyAt = Number(stats.last_admin_reply_at || 0);
  return Boolean(lastContactReplyAt && lastContactReplyAt > lastAdminReplyAt);
}

function isAlexImportAdminInitiated(conversation) {
  return (
    createdBy(conversation) === CREATED_BY_ALEX_IMPORT &&
    (sourceType(conversation) === "admin_initiated" || deliveredAs(conversation) === "admin_initiated")
  );
}

function isMichaelContactForm(conversation) {
  return authorEmail(conversation) === "michael.f@icorrect.co.uk" && lower(subjectText(conversation)).startsWith("contact form:");
}

function intercomUrl(config, conversationId) {
  return `https://app.intercom.com/a/inbox/${config.intercom.workspaceId}/inbox/conversation/${conversationId}`;
}

function evaluateTiers(conversation, nowMs) {
  const days = ageDays(conversation, nowMs);
  const customerAfterAdmin = hasCustomerReplyAfterAdmin(conversation);
  const state = ticketState(conversation);
  const tiers = [];

  if (state === "resolved" && days !== null && days >= 7 && !customerAfterAdmin) {
    tiers.push("tier_1_resolved_open_7d_no_customer_reply");
  }

  if (
    isAlexImportAdminInitiated(conversation) &&
    state === "waiting_on_customer" &&
    days !== null &&
    days >= 14 &&
    !customerAfterAdmin
  ) {
    tiers.push("tier_2_admin_import_waiting_on_customer_14d_no_customer_reply");
  }

  if (
    isAlexImportAdminInitiated(conversation) &&
    state === "submitted" &&
    days !== null &&
    days >= 14 &&
    !customerAfterAdmin
  ) {
    tiers.push("tier_3_admin_import_submitted_14d_no_customer_reply");
  }

  if (state === "in_progress" && days !== null && days >= 14) {
    tiers.push("tier_4_review_in_progress_14d");
  }
  if (sourceType(conversation) === "email" && days !== null && days >= 14) {
    tiers.push("tier_4_review_email_source_14d");
  }
  if (isMichaelContactForm(conversation)) {
    tiers.push("tier_4_review_michael_contact_form");
  }
  if (customerAfterAdmin) {
    tiers.push("tier_4_review_customer_after_admin");
  }

  return tiers;
}

function summarizeConversation(conversation, config, nowMs) {
  const days = ageDays(conversation, nowMs);
  const tiers = evaluateTiers(conversation, nowMs);
  const stats = conversation.statistics || {};

  return {
    id: String(conversation.id),
    url: intercomUrl(config, conversation.id),
    tiers,
    primary_tier: tiers[0] || "none",
    updated_at: isoFromSeconds(conversation.updated_at || conversation.updatedAt),
    age_days: days,
    age_bucket: ageBucket(days),
    source_type: sourceType(conversation),
    delivered_as: deliveredAs(conversation),
    ticket_state: ticketState(conversation),
    created_by: createdBy(conversation),
    admin_assignee_id: conversation.admin_assignee_id || null,
    team_assignee_id: conversation.team_assignee_id || null,
    read: Boolean(conversation.read),
    subject: subjectText(conversation),
    author_email: conversation.source?.author?.email || "",
    author_name: conversation.source?.author?.name || "",
    customer_after_admin: hasCustomerReplyAfterAdmin(conversation),
    last_contact_reply_at: isoFromSeconds(stats.last_contact_reply_at),
    last_admin_reply_at: isoFromSeconds(stats.last_admin_reply_at),
    first_contact_reply_at: isoFromSeconds(stats.first_contact_reply_at),
    conversation_parts_count: stats.count_conversation_parts || 0
  };
}

class ReadOnlyIntercomClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.token = config.token;
  }

  headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "Intercom-Version": "2.11"
    };
  }

  async listOpenPage(startingAfter = null) {
    const url = new URL(`${this.baseUrl}/conversations`);
    url.searchParams.set("state", "open");
    url.searchParams.set("per_page", String(PAGE_SIZE));
    if (startingAfter) {
      url.searchParams.set("starting_after", startingAfter);
    }
    return requestJson(url.toString(), {
      headers: this.headers(),
      timeoutMs: 120000
    });
  }
}

function buildMarkdown(report) {
  const lines = [
    `# Intercom 2025+ Cleanup Dry Run`,
    "",
    `Generated: ${report.generated_at}`,
    "",
    "## Scope",
    "",
    "Read-only dry run. No Intercom conversations were closed, tagged, replied to, or updated.",
    "",
    "## Counts",
    "",
    `- Open conversations scanned: ${report.counts.total_scanned}`,
    `- Candidate conversations: ${report.counts.total_candidates}`,
    `- Run duration: ${report.duration_seconds}s`,
    "",
    "## Candidate tiers",
    ""
  ];

  for (const [tier, count] of Object.entries(report.counts.by_candidate_tier)) {
    lines.push(`- ${tier}: ${count}`);
  }

  lines.push("", "## Ticket states", "");
  for (const [state, count] of Object.entries(report.counts.by_ticket_state)) {
    lines.push(`- ${state}: ${count}`);
  }

  lines.push("", "## Age buckets", "");
  for (const [bucket, count] of Object.entries(report.counts.by_age_bucket)) {
    lines.push(`- ${bucket}: ${count}`);
  }

  lines.push("", "## Recommended next step", "");
  lines.push("Review the CSV candidate list before approving any destructive cleanup script.");

  return `${lines.join("\n")}\n`;
}

function writeOutputs(report, candidates, outDate) {
  const jsonPath = path.join(ROOT, "data", `intercom-2025plus-cleanup-dry-run-${outDate}.json`);
  const csvPath = path.join(ROOT, "data", `intercom-2025plus-cleanup-candidates-${outDate}.csv`);
  const mdPath = path.join(ROOT, "docs", `intercom-2025plus-cleanup-dry-run-${outDate}.md`);

  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });

  fs.writeFileSync(jsonPath, JSON.stringify({ ...report, candidates }, null, 2), "utf8");

  const headers = [
    "id", "primary_tier", "tiers", "age_days", "age_bucket", "ticket_state", "source_type",
    "delivered_as", "created_by", "customer_after_admin", "updated_at", "last_contact_reply_at",
    "last_admin_reply_at", "author_email", "author_name", "subject", "url"
  ];
  const rows = candidates.map((candidate) => headers.map((header) => {
    const value = header === "tiers" ? candidate.tiers.join(";") : candidate[header];
    return csvEscape(value);
  }).join(","));
  fs.writeFileSync(csvPath, `${headers.join(",")}\n${rows.join("\n")}\n`, "utf8");
  fs.writeFileSync(mdPath, buildMarkdown(report), "utf8");

  return { jsonPath, csvPath, mdPath };
}

async function main() {
  const args = parseArgs(process.argv);
  const startedAt = Date.now();
  const nowMs = Date.now();
  const config = getConfig();
  const client = new ReadOnlyIntercomClient(config.intercom);

  const counts = {
    total_scanned: 0,
    total_candidates: 0,
    by_source_type: {},
    by_delivered_as: {},
    by_ticket_state: {},
    by_created_by: {},
    by_age_bucket: {},
    by_candidate_tier: {}
  };
  const candidates = [];
  let startingAfter = null;
  let pagesFetched = 0;

  logLine(`Starting 2025+ Intercom cleanup dry run. limit=${args.limit || "none"}`);

  while (true) {
    const page = await client.listOpenPage(startingAfter);
    const conversations = page.conversations || [];
    pagesFetched += 1;

    for (const conversation of conversations) {
      if (args.limit && counts.total_scanned >= args.limit) {
        break;
      }

      const summary = summarizeConversation(conversation, config, nowMs);
      counts.total_scanned += 1;
      increment(counts.by_source_type, summary.source_type);
      increment(counts.by_delivered_as, summary.delivered_as);
      increment(counts.by_ticket_state, summary.ticket_state);
      increment(counts.by_created_by, summary.created_by);
      increment(counts.by_age_bucket, summary.age_bucket);

      if (summary.tiers.length) {
        candidates.push(summary);
        for (const tier of summary.tiers) {
          increment(counts.by_candidate_tier, tier);
        }
      }
    }

    logLine(`Fetched page ${pagesFetched}; scanned=${counts.total_scanned}; candidates=${candidates.length}`);

    if (args.limit && counts.total_scanned >= args.limit) {
      break;
    }

    const next = page.pages?.next?.starting_after || null;
    if (!next || conversations.length === 0) {
      break;
    }

    startingAfter = next;
    await sleep(args.pauseMs);
  }

  counts.total_candidates = candidates.length;
  const report = {
    generated_at: new Date().toISOString(),
    dry_run_only: true,
    read_only_guarantee: "This script only calls GET /conversations with state=open and writes local report files.",
    pages_fetched: pagesFetched,
    limit: args.limit,
    duration_seconds: Math.round((Date.now() - startedAt) / 1000),
    counts
  };
  const outputs = writeOutputs(report, candidates, args.outDate);
  logLine(`Dry run complete. scanned=${counts.total_scanned}; candidates=${counts.total_candidates}`);
  logLine(`Wrote ${outputs.jsonPath}`);
  logLine(`Wrote ${outputs.csvPath}`);
  logLine(`Wrote ${outputs.mdPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
