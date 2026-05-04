import fs from "node:fs";
import path from "node:path";
import { getConfig } from "../lib/config.js";
import { buildIntercomUrl, extractConversationCustomer } from "../lib/triage.js";

const PAGE_SIZE = 150;
const DETAIL_CONCURRENCY = 8;
const PAGE_PAUSE_MS = 250;
const REQUEST_TIMEOUT_MS = 120000;
const MAX_RETRIES = 5;
const HEARTBEAT_INTERVAL_MS = 10 * 60 * 1000;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const TIER_1_MIN_DAYS = 7;
const TIER_2_MIN_DAYS = 14;
const TIER_3_MIN_DAYS = 14;
const TIER_4_MIN_DAYS = 14;
const AUTOMATION_ADMIN_ID = "9702338";
const INTERCOM_VERSION = "2.11";

function parseArgs(argv) {
  const options = {
    maxItems: null,
    outputDate: null
  };

  for (const arg of argv) {
    if (arg.startsWith("--max-items=")) {
      const value = Number(arg.slice("--max-items=".length));
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`Invalid --max-items value: ${arg}`);
      }
      options.maxItems = Math.floor(value);
      continue;
    }

    if (arg.startsWith("--output-date=")) {
      const value = arg.slice("--output-date=".length).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(`Invalid --output-date value: ${arg}`);
      }
      options.outputDate = value;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeText(value) {
  return stripHtml(value).replace(/\s+/g, " ").trim();
}

function lower(value) {
  return normalizeText(value).toLowerCase();
}

function safeJsonParse(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error.message}`);
  }
}

function formatDuration(ms) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${hours}h ${minutes}m ${remainder}s`;
}

function toCountKey(value, fallback = "missing") {
  const normalized = normalizeText(value);
  return normalized ? normalized : fallback;
}

function incrementCounter(counter, key, amount = 1) {
  counter[key] = (counter[key] || 0) + amount;
}

function sortCounter(counter) {
  return Object.fromEntries(
    Object.entries(counter).sort((left, right) => {
      const countDelta = right[1] - left[1];
      if (countDelta !== 0) return countDelta;
      return left[0].localeCompare(right[0]);
    })
  );
}

function numericSeconds(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function secondsToIso(seconds) {
  if (!seconds) return null;
  return new Date(seconds * 1000).toISOString();
}

function getCreatedAtSeconds(conversation) {
  return numericSeconds(conversation?.created_at || conversation?.createdAt);
}

function getUpdatedAtSeconds(conversation) {
  return numericSeconds(conversation?.updated_at || conversation?.updatedAt) || getCreatedAtSeconds(conversation);
}

function computeAgeDays(updatedAtSeconds, nowMs) {
  if (!updatedAtSeconds) return null;
  const ageMs = Math.max(0, nowMs - updatedAtSeconds * 1000);
  return Number((ageMs / 86400000).toFixed(2));
}

function ageBucket(ageDays) {
  if (ageDays === null) return "missing";
  if (ageDays < 7) return "<7d";
  if (ageDays < 14) return "7-13d";
  if (ageDays < 30) return "14-29d";
  if (ageDays < 60) return "30-59d";
  return "60d+";
}

function extractSourceType(conversation) {
  return toCountKey(conversation?.source?.type, "missing");
}

function extractDeliveredAs(conversation) {
  return toCountKey(conversation?.source?.delivered_as || conversation?.source?.deliveredAs, "missing");
}

function extractTicketState(conversation) {
  const raw =
    conversation?.ticket?.ticket_state?.name ||
    conversation?.ticket?.ticket_state?.value ||
    conversation?.ticket?.ticket_state ||
    conversation?.ticket?.state ||
    conversation?.ticket?.status ||
    conversation?.ticket?.ticket_attributes?.ticket_state ||
    conversation?.ticket?.ticket_attributes?.status ||
    null;
  return toCountKey(raw, "no_ticket");
}

function extractCreatedBy(conversation) {
  const value =
    conversation?.created_by?.id ||
    conversation?.created_by?.admin?.id ||
    conversation?.created_by?.contact?.id ||
    conversation?.source?.author?.id ||
    null;
  return value === null || value === undefined || value === "" ? "missing" : String(value);
}

function extractSubject(conversation) {
  return normalizeText(conversation?.source?.subject || conversation?.title || "(no subject)");
}

function getConversationMessages(conversation) {
  const sourceAuthor = conversation?.source?.author || {};
  const source = conversation?.source
    ? [
        {
          id: conversation.source.id || "source",
          created_at: numericSeconds(conversation.created_at || conversation.source.created_at),
          author_type: lower(sourceAuthor.type || "user"),
          author_name: sourceAuthor.name || sourceAuthor.email || "Unknown",
          author_email: lower(sourceAuthor.email || ""),
          text: normalizeText(conversation.source.body || conversation.source.text || conversation.source.subject || "")
        }
      ]
    : [];

  const parts = (conversation?.conversation_parts?.conversation_parts || []).map((part) => ({
    id: part.id || null,
    created_at: numericSeconds(part.created_at),
    author_type: lower(part.author?.type || "unknown"),
    author_name: part.author?.name || part.author?.email || part.author?.type || "Unknown",
    author_email: lower(part.author?.email || ""),
    text: normalizeText(part.body || part.text || part.summary || "")
  }));

  return [...source, ...parts]
    .filter((message) => message.created_at)
    .sort((left, right) => left.created_at - right.created_at);
}

function isInternalAuthor(message) {
  const email = lower(message?.author_email || "");
  return (
    message?.author_type === "admin" ||
    message?.author_type === "bot" ||
    email.endsWith("@icorrect.co.uk") ||
    email.endsWith("@intercom.io")
  );
}

function isCustomerAuthor(message) {
  if (!message) return false;
  if (isInternalAuthor(message)) return false;
  return ["user", "lead", "contact", "visitor"].includes(message.author_type) || Boolean(message.author_email);
}

function getLastMessageBy(messages, predicate) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (predicate(messages[index])) {
      return messages[index];
    }
  }
  return null;
}

function hasCustomerReplyNewerThanLastAdmin(lastCustomerReply, lastAdminReply) {
  if (!lastCustomerReply) return false;
  if (!lastAdminReply) return true;
  return lastCustomerReply.created_at > lastAdminReply.created_at;
}

function isMichaelContactForm(conversation, customer) {
  const senderEmail = lower(conversation?.source?.author?.email || "");
  const subject = lower(conversation?.source?.subject || conversation?.title || "");
  const customerEmail = lower(customer?.email || "");
  return (
    senderEmail === "michael.f@icorrect.co.uk" &&
    subject.startsWith("contact form:") &&
    customerEmail !== "michael.f@icorrect.co.uk"
  );
}

function isEmailSourceConversation(sourceType, deliveredAs) {
  return sourceType === "email" || deliveredAs === "email";
}

function isAdminInitiatedConversation(sourceType, deliveredAs) {
  return sourceType === "admin_initiated" || deliveredAs === "admin_initiated";
}

function evaluateConversation(conversation, config, nowMs) {
  const state = toCountKey(conversation?.state, "missing");
  const sourceType = extractSourceType(conversation);
  const deliveredAs = extractDeliveredAs(conversation);
  const ticketState = extractTicketState(conversation);
  const createdBy = extractCreatedBy(conversation);
  const subject = extractSubject(conversation);
  const customer = extractConversationCustomer(conversation);
  const createdAtSeconds = getCreatedAtSeconds(conversation);
  const updatedAtSeconds = getUpdatedAtSeconds(conversation);
  const updatedAtIso = secondsToIso(updatedAtSeconds);
  const createdAtIso = secondsToIso(createdAtSeconds);
  const ageDays = computeAgeDays(updatedAtSeconds, nowMs);
  const ageKey = ageBucket(ageDays);
  const messages = getConversationMessages(conversation);
  const lastCustomerReply = getLastMessageBy(messages, isCustomerAuthor);
  const lastAdminReply = getLastMessageBy(messages, isInternalAuthor);
  const customerReplyAfterAdmin = hasCustomerReplyNewerThanLastAdmin(lastCustomerReply, lastAdminReply);
  const adminInitiated = isAdminInitiatedConversation(sourceType, deliveredAs);
  const emailSource = isEmailSourceConversation(sourceType, deliveredAs);
  const michaelContactForm = isMichaelContactForm(conversation, customer);
  const ageAtLeast7 = ageDays !== null && ageDays >= TIER_1_MIN_DAYS;
  const ageAtLeast14 = ageDays !== null && ageDays >= TIER_4_MIN_DAYS;
  const noCustomerReplyNewerThanAdmin = !customerReplyAfterAdmin;

  let tier = "none";
  let action = "ignore";
  let primaryReason = null;
  const reviewReasons = [];

  if (
    state === "open" &&
    ticketState === "resolved" &&
    ageAtLeast7 &&
    noCustomerReplyNewerThanAdmin
  ) {
    tier = "tier_1";
    action = "close_candidate";
    primaryReason = "resolved_ticket_still_open_7d_no_customer_reply_newer_than_admin";
  } else if (
    createdBy === AUTOMATION_ADMIN_ID &&
    adminInitiated &&
    ticketState === "waiting_on_customer" &&
    ageAtLeast14 &&
    noCustomerReplyNewerThanAdmin
  ) {
    tier = "tier_2";
    action = "close_candidate";
    primaryReason = "admin_import_waiting_on_customer_14d_no_customer_reply_newer_than_admin";
  } else if (
    createdBy === AUTOMATION_ADMIN_ID &&
    adminInitiated &&
    ticketState === "submitted" &&
    ageDays !== null &&
    ageDays >= TIER_3_MIN_DAYS &&
    noCustomerReplyNewerThanAdmin
  ) {
    tier = "tier_3";
    action = "close_candidate";
    primaryReason = "admin_import_submitted_14d_no_customer_reply_newer_than_admin";
  } else {
    if (customerReplyAfterAdmin) {
      reviewReasons.push("customer_replied_after_last_admin_reply");
    }
    if (ticketState === "in_progress" && ageAtLeast14) {
      reviewReasons.push("in_progress_older_than_14d");
    }
    if (emailSource && ageAtLeast14) {
      reviewReasons.push("email_source_older_than_14d");
    }
    if (michaelContactForm) {
      reviewReasons.push("michael_f_contact_form");
    }

    if (reviewReasons.length) {
      tier = "tier_4";
      action = "review_only";
      primaryReason = reviewReasons[0];
    }
  }

  return {
    id: String(conversation.id),
    intercomUrl: buildIntercomUrl(config.intercom.workspaceId, conversation.id),
    state,
    source: sourceType,
    deliveredAs,
    ticketState,
    createdBy,
    subject,
    createdAt: createdAtIso,
    updatedAt: updatedAtIso,
    ageDays,
    ageBucket: ageKey,
    customer,
    lastCustomerReplyAt: secondsToIso(lastCustomerReply?.created_at || null),
    lastAdminReplyAt: secondsToIso(lastAdminReply?.created_at || null),
    customerRepliedAfterLastAdmin: customerReplyAfterAdmin,
    hasTicket: ticketState !== "no_ticket",
    messageCount: messages.length,
    tier,
    action,
    primaryReason,
    reviewReasons
  };
}

function csvEscape(value) {
  const normalized = value === null || value === undefined ? "" : String(value);
  if (/["\n,]/.test(normalized)) {
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }
  return normalized;
}

function buildCsv(records) {
  const columns = [
    "conversation_id",
    "tier",
    "action",
    "primary_reason",
    "review_reasons",
    "state",
    "source",
    "delivered_as",
    "ticket_state",
    "created_by",
    "updated_at",
    "created_at",
    "age_days",
    "age_bucket",
    "customer_replied_after_last_admin",
    "last_customer_reply_at",
    "last_admin_reply_at",
    "customer_name",
    "customer_email",
    "customer_phone",
    "subject",
    "intercom_url"
  ];

  const rows = records.map((record) => [
    record.id,
    record.tier,
    record.action,
    record.primaryReason || "",
    record.reviewReasons.join("|"),
    record.state,
    record.source,
    record.deliveredAs,
    record.ticketState,
    record.createdBy,
    record.updatedAt || "",
    record.createdAt || "",
    record.ageDays === null ? "" : record.ageDays,
    record.ageBucket,
    record.customerRepliedAfterLastAdmin ? "yes" : "no",
    record.lastCustomerReplyAt || "",
    record.lastAdminReplyAt || "",
    record.customer?.name || "",
    record.customer?.email || "",
    record.customer?.phone || "",
    record.subject,
    record.intercomUrl
  ]);

  return [columns.join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n") + "\n";
}

function formatCounterMarkdown(counter) {
  const entries = Object.entries(counter);
  if (!entries.length) {
    return ["- none"];
  }
  return entries.map(([key, value]) => `- ${key}: ${value}`);
}

function buildMarkdownSummary(summary) {
  const lines = [
    "# Intercom 2025+ Cleanup Dry-Run Summary",
    "",
    `Generated: ${summary.generatedAt}`,
    `Mode: ${summary.mode}`,
    `Conversations scanned: ${summary.counts.total}`,
    `Close candidates: ${summary.closeCandidateCount}`,
    `Review-only candidates: ${summary.reviewOnlyCount}`,
    `Errors: ${summary.errors.length}`,
    `Duration: ${formatDuration(summary.durationMs)}`,
    "",
    "## Tiers",
    "",
    `- Tier 1: ${summary.counts.byCandidateTier.tier_1 || 0}`,
    `- Tier 2: ${summary.counts.byCandidateTier.tier_2 || 0}`,
    `- Tier 3: ${summary.counts.byCandidateTier.tier_3 || 0}`,
    `- Tier 4: ${summary.counts.byCandidateTier.tier_4 || 0}`,
    `- None: ${summary.counts.byCandidateTier.none || 0}`,
    "",
    "## Candidate Reasons",
    "",
    ...formatCounterMarkdown(summary.counts.byCandidateReason),
    "",
    "## Review Reasons",
    "",
    ...formatCounterMarkdown(summary.counts.byReviewReason),
    "",
    "## Source Counts",
    "",
    ...formatCounterMarkdown(summary.counts.bySource),
    "",
    "## Delivered As Counts",
    "",
    ...formatCounterMarkdown(summary.counts.byDeliveredAs),
    "",
    "## Ticket State Counts",
    "",
    ...formatCounterMarkdown(summary.counts.byTicketState),
    "",
    "## Created By Counts",
    "",
    ...formatCounterMarkdown(summary.counts.byCreatedBy),
    "",
    "## Age Buckets",
    "",
    ...formatCounterMarkdown(summary.counts.byAgeBucket),
    "",
    "## Output Files",
    "",
    `- JSON: \`${summary.files.json}\``,
    `- CSV: \`${summary.files.csv}\``,
    `- Markdown: \`${summary.files.markdown}\``,
    `- Heartbeat: \`${summary.files.heartbeat}\``,
    `- Progress log: \`${summary.files.log}\``,
    ""
  ];

  if (summary.sampleCloseCandidates.length) {
    lines.push("## Sample Close Candidates", "");
    for (const record of summary.sampleCloseCandidates) {
      lines.push(
        `- ${record.id} | ${record.tier} | ${record.ticketState} | ${record.updatedAt || "missing"} | ${record.subject}`
      );
    }
    lines.push("");
  }

  if (summary.sampleReviewOnly.length) {
    lines.push("## Sample Review-Only Conversations", "");
    for (const record of summary.sampleReviewOnly) {
      lines.push(
        `- ${record.id} | ${record.reviewReasons.join(", ")} | ${record.updatedAt || "missing"} | ${record.subject}`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  let active = 0;

  return new Promise((resolve, reject) => {
    function launch() {
      if (nextIndex >= items.length && active === 0) {
        resolve(results);
        return;
      }

      while (active < limit && nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        active += 1;

        Promise.resolve(mapper(items[currentIndex], currentIndex))
          .then((result) => {
            results[currentIndex] = result;
            active -= 1;
            launch();
          })
          .catch((error) => {
            reject(error);
          });
      }
    }

    launch();
  });
}

class DryRunClient {
  constructor(config, log) {
    this.baseUrl = config.baseUrl;
    this.token = config.token;
    this.log = log;
  }

  headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "Intercom-Version": INTERCOM_VERSION
    };
  }

  async requestJson(url, options = {}, attempt = 0) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: options.method || "GET",
        headers: this.headers(),
        body: options.body,
        signal: controller.signal
      });

      const text = await response.text();
      if (response.ok) {
        return safeJsonParse(text);
      }

      if (RETRYABLE_STATUS.has(response.status) && attempt < MAX_RETRIES) {
        const retryAfterSeconds = Number(response.headers.get("retry-after") || 0);
        const waitMs = retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : 1000 * 2 ** attempt;
        this.log(`Retrying ${url} after HTTP ${response.status}. attempt=${attempt + 1}/${MAX_RETRIES} waitMs=${waitMs}`);
        await sleep(waitMs);
        return this.requestJson(url, options, attempt + 1);
      }

      throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}: ${text.slice(0, 500)}`);
    } catch (error) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      const isRetryableNetworkError = error instanceof Error && (isAbort || /fetch failed|network|socket|econnreset|timed out/i.test(error.message));
      if (isRetryableNetworkError && attempt < MAX_RETRIES) {
        const waitMs = 1000 * 2 ** attempt;
        this.log(`Retrying ${url} after ${isAbort ? "timeout" : "network error"}. attempt=${attempt + 1}/${MAX_RETRIES} waitMs=${waitMs}`);
        await sleep(waitMs);
        return this.requestJson(url, options, attempt + 1);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async listOpenPage(startingAfter = null) {
    const url = new URL(`${this.baseUrl}/conversations`);
    url.searchParams.set("state", "open");
    url.searchParams.set("per_page", String(PAGE_SIZE));
    if (startingAfter) {
      url.searchParams.set("starting_after", startingAfter);
    }
    return this.requestJson(url.toString(), { timeoutMs: REQUEST_TIMEOUT_MS });
  }

  async getConversation(conversationId) {
    return this.requestJson(`${this.baseUrl}/conversations/${conversationId}`, {
      timeoutMs: REQUEST_TIMEOUT_MS
    });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const config = getConfig();
  const rootDir = config.rootDir;
  const outputDate = options.outputDate || formatDateStamp();
  const files = {
    heartbeat: path.join(rootDir, "data", `intercom-cleanup-2025plus-heartbeat-${outputDate}.json`),
    log: path.join(rootDir, "data", `intercom-cleanup-2025plus-dry-run-progress-${outputDate}.log`),
    json: path.join(rootDir, "data", `intercom-cleanup-2025plus-dry-run-${outputDate}.json`),
    csv: path.join(rootDir, "data", `intercom-cleanup-2025plus-candidates-${outputDate}.csv`),
    markdown: path.join(rootDir, "docs", `intercom-cleanup-2025plus-dry-run-summary-${outputDate}.md`)
  };

  fs.mkdirSync(path.dirname(files.heartbeat), { recursive: true });
  fs.mkdirSync(path.dirname(files.log), { recursive: true });
  fs.mkdirSync(path.dirname(files.json), { recursive: true });
  fs.mkdirSync(path.dirname(files.csv), { recursive: true });
  fs.mkdirSync(path.dirname(files.markdown), { recursive: true });

  const logLine = (message) => {
    const line = `[${new Date().toISOString()}] ${message}`;
    console.log(line);
    fs.appendFileSync(files.log, line + "\n", "utf8");
  };

  const client = new DryRunClient(config.intercom, logLine);
  const startedAt = Date.now();
  const nowMs = Date.now();
  const records = [];
  const errors = [];
  const counts = {
    total: 0,
    bySource: {},
    byDeliveredAs: {},
    byTicketState: {},
    byCreatedBy: {},
    byAgeBucket: {},
    byCandidateTier: {},
    byCandidateReason: {},
    byReviewReason: {}
  };

  let pageCount = 0;
  let detailFetchCount = 0;
  let startingAfter = null;
  let done = false;
  let lastHeartbeatAt = null;

  const writeHeartbeat = (status, extra = {}) => {
    const heartbeat = {
      updatedAt: new Date().toISOString(),
      status,
      generatedDate: outputDate,
      startedAt: new Date(startedAt).toISOString(),
      pageCount,
      detailFetchCount,
      recordsSeen: records.length,
      errors: errors.length,
      candidateCounts: {
        tier_1: counts.byCandidateTier.tier_1 || 0,
        tier_2: counts.byCandidateTier.tier_2 || 0,
        tier_3: counts.byCandidateTier.tier_3 || 0,
        tier_4: counts.byCandidateTier.tier_4 || 0
      },
      lastCursor: startingAfter,
      files,
      ...extra
    };
    fs.writeFileSync(files.heartbeat, JSON.stringify(heartbeat, null, 2));
    lastHeartbeatAt = heartbeat.updatedAt;
    logLine(
      `[heartbeat] status=${status} pages=${pageCount} details=${detailFetchCount} records=${records.length} tier1=${heartbeat.candidateCounts.tier_1} tier2=${heartbeat.candidateCounts.tier_2} tier3=${heartbeat.candidateCounts.tier_3} tier4=${heartbeat.candidateCounts.tier_4} errors=${errors.length}`
    );
  };

  const heartbeatTimer = setInterval(() => {
    writeHeartbeat("running", {
      durationMs: Date.now() - startedAt,
      lastHeartbeatAt
    });
  }, HEARTBEAT_INTERVAL_MS);

  logLine("Starting Intercom 2025+ cleanup dry-run. Mode=read-only GET-only.");
  writeHeartbeat("starting");

  try {
    while (!done) {
      const page = await client.listOpenPage(startingAfter);
      const summaries = page?.conversations || page?.data || [];
      const next = page?.pages?.next?.starting_after || null;
      pageCount += 1;

      logLine(
        `Fetched open page ${pageCount} with ${summaries.length} summaries${startingAfter ? ` starting_after=${startingAfter}` : ""}`
      );

      const limitedSummaries = options.maxItems
        ? summaries.slice(0, Math.max(0, options.maxItems - records.length))
        : summaries;

      const pageResults = await mapWithConcurrency(limitedSummaries, DETAIL_CONCURRENCY, async (summary, index) => {
        try {
          const conversation = await client.getConversation(summary.id);
          detailFetchCount += 1;
          if (detailFetchCount % 100 === 0 || index === limitedSummaries.length - 1) {
            logLine(`Fetched ${detailFetchCount} conversation details so far`);
          }
          return evaluateConversation(conversation, config, nowMs);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          errors.push({
            conversationId: String(summary.id),
            step: "getConversation",
            error: message
          });
          logLine(`Failed to fetch conversation ${summary.id}: ${message}`);
          return null;
        }
      });

      for (const record of pageResults.filter(Boolean)) {
        records.push(record);
        counts.total += 1;
        incrementCounter(counts.bySource, record.source);
        incrementCounter(counts.byDeliveredAs, record.deliveredAs);
        incrementCounter(counts.byTicketState, record.ticketState);
        incrementCounter(counts.byCreatedBy, record.createdBy);
        incrementCounter(counts.byAgeBucket, record.ageBucket);
        incrementCounter(counts.byCandidateTier, record.tier);
        if (record.primaryReason) {
          incrementCounter(counts.byCandidateReason, record.primaryReason);
        }
        for (const reviewReason of record.reviewReasons) {
          incrementCounter(counts.byReviewReason, reviewReason);
        }
      }

      logLine(
        `Progress after page ${pageCount}: records=${records.length} tier1=${counts.byCandidateTier.tier_1 || 0} tier2=${counts.byCandidateTier.tier_2 || 0} tier3=${counts.byCandidateTier.tier_3 || 0} tier4=${counts.byCandidateTier.tier_4 || 0} errors=${errors.length}`
      );
      writeHeartbeat("running", {
        durationMs: Date.now() - startedAt,
        lastPageFetched: pageCount
      });

      if (!next || summaries.length === 0) {
        done = true;
      } else if (options.maxItems && records.length >= options.maxItems) {
        done = true;
      } else {
        startingAfter = next;
        await sleep(PAGE_PAUSE_MS);
      }
    }
  } catch (error) {
    writeHeartbeat("failed", {
      durationMs: Date.now() - startedAt,
      fatalError: error instanceof Error ? error.message : String(error)
    });
    throw error;
  } finally {
    clearInterval(heartbeatTimer);
  }

  const sortedRecords = [...records].sort((left, right) => {
    const tierRank = { tier_1: 1, tier_2: 2, tier_3: 3, tier_4: 4, none: 5 };
    const rankDelta = (tierRank[left.tier] || 99) - (tierRank[right.tier] || 99);
    if (rankDelta !== 0) return rankDelta;
    return String(left.updatedAt || "").localeCompare(String(right.updatedAt || ""));
  });

  const candidateRecords = sortedRecords.filter((record) => record.tier !== "none");
  const closeCandidateRecords = sortedRecords.filter((record) => record.action === "close_candidate");
  const reviewOnlyRecords = sortedRecords.filter((record) => record.action === "review_only");

  const summary = {
    generatedAt: new Date().toISOString(),
    generatedDate: outputDate,
    mode: "dry-run-read-only",
    readOnlyGuarantee: {
      allowedMethods: ["GET"],
      forbiddenActions: ["close", "update", "tag", "reply", "delete"]
    },
    durationMs: Date.now() - startedAt,
    paging: {
      pageSize: PAGE_SIZE,
      pagesFetched: pageCount,
      detailFetchCount
    },
    thresholds: {
      tier1MinDays: TIER_1_MIN_DAYS,
      tier2MinDays: TIER_2_MIN_DAYS,
      tier3MinDays: TIER_3_MIN_DAYS,
      tier4MinDays: TIER_4_MIN_DAYS
    },
    counts: {
      total: counts.total,
      bySource: sortCounter(counts.bySource),
      byDeliveredAs: sortCounter(counts.byDeliveredAs),
      byTicketState: sortCounter(counts.byTicketState),
      byCreatedBy: sortCounter(counts.byCreatedBy),
      byAgeBucket: sortCounter(counts.byAgeBucket),
      byCandidateTier: sortCounter(counts.byCandidateTier),
      byCandidateReason: sortCounter(counts.byCandidateReason),
      byReviewReason: sortCounter(counts.byReviewReason)
    },
    closeCandidateCount: closeCandidateRecords.length,
    reviewOnlyCount: reviewOnlyRecords.length,
    sampleCloseCandidates: closeCandidateRecords.slice(0, 25),
    sampleReviewOnly: reviewOnlyRecords.slice(0, 25),
    files,
    errors,
    conversations: sortedRecords
  };

  fs.writeFileSync(files.json, JSON.stringify(summary, null, 2));
  fs.writeFileSync(files.csv, buildCsv(candidateRecords), "utf8");
  fs.writeFileSync(files.markdown, buildMarkdownSummary(summary), "utf8");
  writeHeartbeat("finished", {
    durationMs: summary.durationMs,
    closeCandidateCount: summary.closeCandidateCount,
    reviewOnlyCount: summary.reviewOnlyCount
  });

  logLine(
    `Finished Intercom 2025+ cleanup dry-run. scanned=${summary.counts.total} closeCandidates=${summary.closeCandidateCount} reviewOnly=${summary.reviewOnlyCount} errors=${summary.errors.length} duration=${formatDuration(summary.durationMs)}`
  );
  logLine(`Wrote heartbeat file to ${files.heartbeat}`);
  logLine(`Wrote JSON report to ${files.json}`);
  logLine(`Wrote CSV candidate list to ${files.csv}`);
  logLine(`Wrote Markdown summary to ${files.markdown}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
