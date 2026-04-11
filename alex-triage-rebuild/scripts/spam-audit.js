import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "../lib/config.js";
import { requestJson } from "../lib/http.js";
import { IntercomClient } from "../lib/intercom.js";
import { flattenMessages, isActionableConversation } from "../lib/triage.js";

const ROOT = "/home/ricky/builds/alex-triage-rebuild";
const OUTPUT_PATH = path.join(ROOT, "data", "spam-audit-results.json");
const SAMPLE_LIMIT = 200;
const PER_PAGE = 150;
const FULL_FETCH_DELAY_MS = 150;
const INTERCOM_VERSION = "2.11";

function log(message, error = null) {
  if (error) {
    console.error(`[spam-audit] ${message}`, error);
    return;
  }
  console.log(`[spam-audit] ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value) {
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
    .replace(/\s+/g, " ")
    .trim();
}

function lower(value) {
  return normalizeText(value).toLowerCase();
}

function getConversationTimestampMs(conversation) {
  return Number(conversation?.updated_at || conversation?.updatedAt || conversation?.created_at || 0) * 1000;
}

function extractSenderEmail(conversation) {
  return (
    conversation?.source?.author?.email ||
    conversation?.contacts?.contacts?.[0]?.email ||
    null
  );
}

function extractSenderName(conversation) {
  return (
    conversation?.source?.author?.name ||
    conversation?.contacts?.contacts?.[0]?.name ||
    null
  );
}

function buildCombinedText(conversation, messages) {
  const subject = normalizeText(conversation?.source?.subject || conversation?.title || "");
  const body = messages.map((message) => message.text).join(" ");
  return normalizeText(`${subject} ${body}`);
}

function buildExcerpt(messages) {
  return normalizeText(messages.map((message) => message.text).join(" ")).slice(0, 280);
}

function headers(client) {
  return {
    ...client.headers(),
    "Intercom-Version": INTERCOM_VERSION
  };
}

async function listConversationsByState(client, state, maxItems) {
  const items = [];
  let startingAfter = null;

  while (items.length < maxItems) {
    const url = new URL(`${client.baseUrl}/conversations`);
    url.searchParams.set("state", state);
    url.searchParams.set("per_page", String(PER_PAGE));
    if (startingAfter) {
      url.searchParams.set("starting_after", startingAfter);
    }

    let payload;
    try {
      payload = await requestJson(url.toString(), {
        headers: headers(client),
        timeoutMs: 120000
      });
    } catch (error) {
      log(`Failed to list ${state} conversations`, error);
      break;
    }

    const pageItems = payload?.conversations || payload?.data || [];
    if (!pageItems.length) {
      break;
    }

    items.push(...pageItems);

    const next = payload?.pages?.next;
    if (!next?.starting_after) {
      break;
    }
    startingAfter = next.starting_after;
  }

  return items.slice(0, maxItems);
}

function classifyConversationHeuristics(conversation, messages) {
  const subject = lower(conversation?.source?.subject || conversation?.title || "");
  const senderEmail = lower(extractSenderEmail(conversation) || "");
  const senderName = lower(extractSenderName(conversation) || "");
  const combinedText = lower(buildCombinedText(conversation, messages));
  const sourceType = lower(conversation?.source?.type || conversation?.source?.delivered_as || "");
  const state = lower(conversation?.state || "");

  const spamChecks = [
    {
      category: "phishing",
      when: () =>
        /(wallet|coinbase|metamask|ledger|binance|usdt|bitcoin|btc|crypto)/i.test(combinedText) ||
        /(password expiry|verify your account|suspended account|login alert|security alert)/i.test(combinedText) ||
        /(urgent action required|validate your mailbox|click the secure link)/i.test(combinedText)
    },
    {
      category: "seo_pitch",
      when: () =>
        /(seo|backlinks?|domain authority|guest post|link insertion|off-page|on-page seo|search rankings?)/i.test(combinedText) ||
        /(we noticed your website|improve your google rankings?|organic traffic)/i.test(combinedText)
    },
    {
      category: "marketing",
      when: () =>
        /(marketing campaign|lead generation|social media promotion|instagram followers|grow your business|boost your sales)/i.test(combinedText) ||
        /(free demo|book a demo|schedule a demo|unsubscribe)/i.test(combinedText)
    },
    {
      category: "cold_outreach",
      when: () =>
        /(partnership opportunity|would love to connect|are you the right person|just following up|circle back|on behalf of my client|i represent)/i.test(combinedText) ||
        /(supplier catalog|wholesale|bulk order|procurement partnership|reseller opportunity)/i.test(combinedText) ||
        /(sales@|marketing@|newsletter@)/i.test(senderEmail)
    },
    {
      category: "automated_notification",
      when: () =>
        sourceType === "notification_event" ||
        /(noreply@|no-reply@|mailer-daemon|postmaster@)/i.test(senderEmail) ||
        /(delivery status notification|mail delivery subsystem|undeliverable|delivery has failed|do not reply)/i.test(combinedText) ||
        /(your verification code|one-time password|otp)/i.test(combinedText)
    }
  ];

  const legitimateChecks = [
    {
      category: "repair_enquiry",
      when: () =>
        /(iphone|ipad|macbook|imac|apple watch|screen|battery|charging|repair|diagnostic|liquid damage|logic board|motherboard|data recovery)/i.test(combinedText) &&
        /(quote|price|cost|repair|book|fix|issue|fault|problem|estimate)/i.test(combinedText)
    },
    {
      category: "quote_followup",
      when: () =>
        /(go ahead|proceed|accept the quote|approve the repair|too expensive|can you do better|price)/i.test(combinedText) &&
        /(quote|estimate|repair)/i.test(combinedText)
    },
    {
      category: "repair_status_followup",
      when: () =>
        /(status update|any update|chasing an update|when will it be ready|ready to collect|collection|tracking)/i.test(combinedText) &&
        /(repair|device|phone|macbook|ipad)/i.test(combinedText)
    },
    {
      category: "complaint_or_warranty",
      when: () =>
        /(still not working|same issue|warranty|refund|complaint|not acceptable|unhappy|fault has returned)/i.test(combinedText)
    }
  ];

  const spamMatch = spamChecks.find((check) => check.when());
  if (spamMatch) {
    return { spamClassification: "spam", category: spamMatch.category };
  }

  const legitimateMatch = legitimateChecks.find((check) => check.when());
  if (legitimateMatch) {
    return { spamClassification: "legitimate", category: legitimateMatch.category };
  }

  if (state === "closed" && !combinedText) {
    return { spamClassification: "unclear", category: "empty_or_archival" };
  }

  return { spamClassification: "legitimate", category: "other_legitimate" };
}

function summarizeRecord(conversation, messages, classification, filterResult) {
  return {
    id: String(conversation.id),
    subject: normalizeText(conversation?.source?.subject || conversation?.title || "(no subject)"),
    sender_email: extractSenderEmail(conversation),
    spam_classification: classification.spamClassification,
    current_filter_result: filterResult ? "actionable" : "non_actionable",
    missed_spam: classification.spamClassification === "spam" && filterResult,
    category: classification.category,
    sender_name: extractSenderName(conversation),
    state: conversation?.state || null,
    source_type: conversation?.source?.type || conversation?.source?.delivered_as || null,
    updated_at: conversation?.updated_at || conversation?.updatedAt || null,
    sample_excerpt: buildExcerpt(messages)
  };
}

async function main() {
  loadEnv();

  if (!process.env.INTERCOM_API_TOKEN) {
    throw new Error("Missing INTERCOM_API_TOKEN after loadEnv()");
  }

  const intercomClient = new IntercomClient({
    baseUrl: process.env.INTERCOM_BASE_URL || "https://api.intercom.io",
    token: process.env.INTERCOM_API_TOKEN,
    adminId: process.env.INTERCOM_ADMIN_ID || "9702338"
  });

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

  const [openConversations, closedConversations] = await Promise.all([
    listConversationsByState(intercomClient, "open", SAMPLE_LIMIT),
    listConversationsByState(intercomClient, "closed", SAMPLE_LIMIT)
  ]);

  const merged = [...openConversations, ...closedConversations]
    .sort((left, right) => getConversationTimestampMs(right) - getConversationTimestampMs(left))
    .slice(0, SAMPLE_LIMIT);

  log(
    `Fetched ${openConversations.length} open summaries and ${closedConversations.length} closed summaries; auditing ${merged.length} conversations`
  );

  const results = [];

  for (const summary of merged) {
    let conversation;
    try {
      conversation = await intercomClient.getConversation(summary.id);
    } catch (error) {
      log(`Failed to fetch conversation ${summary.id}`, error);
      continue;
    }

    let messages = [];
    try {
      messages = flattenMessages(conversation);
    } catch (error) {
      log(`Failed to flatten messages for conversation ${conversation.id}`, error);
    }

    let filterResult = false;
    try {
      filterResult = isActionableConversation(conversation, messages);
    } catch (error) {
      log(`Failed to evaluate actionable filter for conversation ${conversation.id}`, error);
    }

    const classification = classifyConversationHeuristics(conversation, messages);
    results.push(summarizeRecord(conversation, messages, classification, filterResult));
    await sleep(FULL_FETCH_DELAY_MS);
  }

  const output = {
    generated_at: new Date().toISOString(),
    sample_target: SAMPLE_LIMIT,
    conversations_sampled: results.length,
    source_states: ["open", "closed"],
    results
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  log(`Wrote ${results.length} audit records to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  log("Fatal error", error);
  process.exitCode = 1;
});
