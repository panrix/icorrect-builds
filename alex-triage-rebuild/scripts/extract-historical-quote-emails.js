import fs from "node:fs";
import path from "node:path";
import { getConfig } from "../lib/config.js";
import { requestJson } from "../lib/http.js";

const ROOT = "/home/ricky/builds/alex-triage-rebuild";
const SOURCE_JSON = "/home/ricky/builds/agent-rebuild/data/repair-history-full.json";
const OUT_JSON = path.join(ROOT, "data", "historical-quote-emails.json");
const LOG_PATH = path.join(ROOT, "data", "historical-quote-emails.log");
const SAMPLE_LIMIT = Number(process.env.QUOTE_EMAIL_SAMPLE_LIMIT || 320);
const LOG_EVERY = 50;
const SEARCH_DELAY_MS = 250;

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n", "utf8");
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

function parseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function columnMap(item) {
  const map = {};
  for (const c of item.column_values || []) {
    map[c.id] = { text: c.text || "", value: parseJson(c.value) };
  }
  return map;
}

function createdAtMs(log) {
  const raw = String(log?.created_at || "");
  if (!raw) return 0;
  if (/^\d{13,}$/.test(raw)) return Number(raw.slice(0, 13));
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function extractStatusLabel(payload) {
  if (!payload) return "";
  if (typeof payload.text === "string") return payload.text;
  if (payload.label?.text) return payload.label.text;
  return "";
}

function statusLogs(item) {
  return (item.activity_logs || [])
    .filter((log) => log.event === "update_column_value")
    .map((log) => {
      const data = typeof log.data === "string" ? parseJson(log.data) || {} : (log.data || {});
      return {
        at: createdAtMs(log),
        from: extractStatusLabel(data.previous_value || {}),
        to: extractStatusLabel(data.value || {}),
        columnTitle: data.column_title || "",
        columnId: data.column_id || ""
      };
    })
    .filter((log) => log.at)
    .sort((a, b) => a.at - b.at);
}

function extractEntries(item) {
  const entries = [];
  for (const update of item.updates || []) {
    const body = cleanText(update.body || update.text_body || "");
    if (body) entries.push({ createdAt: update.created_at || null, text: body, source: "update" });
    for (const reply of update.replies || []) {
      const bodyReply = cleanText(reply.body || reply.text_body || "");
      if (bodyReply) entries.push({ createdAt: reply.created_at || null, text: bodyReply, source: "reply" });
    }
  }
  return entries;
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D+/g, "");
  if (!digits) return null;
  if (digits.startsWith("44") && digits.length >= 12) return `0${digits.slice(2)}`;
  return digits;
}

function extractDeviceModel(item, columns, entries) {
  const texts = [item.name, columns.board_relation5?.text, columns.order_id?.text, columns.text86?.text, ...entries.map((e) => e.text)].filter(Boolean);
  for (const text of texts) {
    const m = cleanText(text).match(/(iPhone(?:\s+[A-Za-z0-9+\- ]+)?|iPad(?:\s+[A-Za-z0-9+\-()." ]+)?|MacBook(?:\s+[A-Za-z0-9+\-()." ]+)?|Apple Watch(?:\s+[A-Za-z0-9+\-()." ]+)?)/i);
    if (m) return m[1].trim();
  }
  return columns.board_relation5?.text || columns.order_id?.text || null;
}

function candidateDiagnosticRepairs(raw) {
  const candidates = [];
  for (const item of raw.items || []) {
    const columns = columnMap(item);
    const entries = extractEntries(item);
    const logs = statusLogs(item);
    const repairType = columns.status24?.text || "";
    const wentThroughDiagnostics = logs.some((log) => /diagnostic/i.test(log.to || ""));
    const completionLog = [...logs].reverse().find((log) => /returned|collected|shipped|completed|ready to collect|repaired|client contacted/i.test(log.to || ""));
    const completed = Boolean(completionLog) || /returned|collected|completed|ready to collect|repaired|client contacted|shipped/i.test(columns.status4?.text || "");
    const email = (columns.text5?.text || "").trim().toLowerCase() || null;
    if (!(repairType === "Diagnostic" || repairType === "Board Level" || wentThroughDiagnostics)) continue;
    if (!completed) continue;
    if (!email) continue;
    candidates.push({
      monday_item_id: String(item.id),
      item_name: item.name,
      email,
      phone: normalizePhone(columns.text00?.text || null),
      device_model: extractDeviceModel(item, columns, entries),
      repair_type: repairType || (wentThroughDiagnostics ? "Diagnostic" : null),
      final_status: columns.status4?.text || null,
      quote_amount: columns.dup__of_quote_total?.text || columns.numeric_mkxx7j1t?.text || null,
      latest_notes: entries.slice(-3).map((e) => e.text).join("\n\n"),
      completion_at: completionLog?.at || logs.at(-1)?.at || 0,
      received_at: logs[0]?.at || 0
    });
  }
  const deduped = new Map();
  for (const row of candidates) {
    const key = `${row.email}::${row.monday_item_id}`;
    deduped.set(key, row);
  }
  return [...deduped.values()]
    .sort((a, b) => (b.completion_at || b.received_at || 0) - (a.completion_at || a.received_at || 0))
    .slice(0, SAMPLE_LIMIT);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class QuoteExtractor {
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

  async searchConversationsByEmail(email) {
    const tries = [
      `${this.baseUrl}/conversations?search_field=email&search_operator=%3D&search_value=${encodeURIComponent(email)}`,
      `${this.baseUrl}/conversations?search_field=external_id&search_operator=%3D&search_value=${encodeURIComponent(email)}`
    ];

    for (const url of tries) {
      try {
        const payload = await requestJson(url, {
          headers: this.headers(),
          timeoutMs: 120000
        });
        const conversations = payload.conversations || payload.data || [];
        if (conversations.length) {
          return { conversations };
        }
      } catch (error) {
        log(`search failed for ${email} via ${url}: ${error.message}`);
      }
    }

    const payload = {
      query: {
        operator: "AND",
        value: [
          { field: "source.author.email", operator: "=", value: email }
        ]
      },
      pagination: { per_page: 20 }
    };
    try {
      return await requestJson(`${this.baseUrl}/conversations/search`, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(payload),
        timeoutMs: 120000
      });
    } catch (error) {
      log(`search by source.author.email failed for ${email}: ${error.message}`);
      return { conversations: [] };
    }
  }

  async getConversation(conversationId) {
    return requestJson(`${this.baseUrl}/conversations/${conversationId}`, {
      headers: this.headers(),
      timeoutMs: 120000
    });
  }
}

function isInternalAuthor(author = {}) {
  const email = String(author.email || "").toLowerCase();
  return author.type === "admin" || author.type === "bot" || email.endsWith("@icorrect.co.uk") || email.includes("operator+");
}

function findQuoteParts(conversation) {
  const parts = [];
  const sourceBody = cleanText(conversation.source?.body || "");
  if (isInternalAuthor(conversation.source?.author) && looksLikeQuote(sourceBody)) {
    parts.push({
      kind: "source",
      text: sourceBody,
      created_at: conversation.created_at || null,
      author_name: conversation.source?.author?.name || null,
      author_email: conversation.source?.author?.email || null
    });
  }
  for (const part of conversation.conversation_parts?.conversation_parts || []) {
    const text = cleanText(part.body || part.text || "");
    if (!text) continue;
    if (!isInternalAuthor(part.author || {})) continue;
    if (looksLikeQuote(text)) {
      parts.push({
        kind: part.part_type || "part",
        text,
        created_at: part.created_at || null,
        author_name: part.author?.name || null,
        author_email: part.author?.email || null
      });
    }
  }
  return parts;
}

function looksLikeQuote(text) {
  const hasPrice = /£\s?\d+/.test(text);
  const hasRepairLanguage = /(repair|fault|board|screen|battery|logic board|diagnostic|micro ?solder|estimate|proceed|quote|issue found|found that|replacement)/i.test(text);
  const notJustCustomerConsent = !/(i[' ]?m happy to proceed|please go ahead|just to confirm|could you also confirm)/i.test(text);
  return hasPrice && hasRepairLanguage && notJustCustomerConsent;
}

function extractFaults(text) {
  const matches = [];
  const patterns = [
    /logic board/gi,
    /board level/gi,
    /micro ?solder(?:ing)?/gi,
    /screen/gi,
    /battery/gi,
    /charging port/gi,
    /liquid damage/gi,
    /backlight/gi,
    /no power/gi,
    /diagnostic/gi
  ];
  for (const pattern of patterns) {
    const found = text.match(pattern) || [];
    for (const item of found) matches.push(item.toLowerCase());
  }
  return [...new Set(matches)];
}

function extractComponents(text) {
  const matches = [];
  const patterns = [/screen/gi,/battery/gi,/logic board/gi,/board/gi,/charging port/gi,/camera/gi,/speaker/gi,/keyboard/gi,/trackpad/gi];
  for (const pattern of patterns) {
    const found = text.match(pattern) || [];
    for (const item of found) matches.push(item.toLowerCase());
  }
  return [...new Set(matches)];
}

function extractPrices(text) {
  return [...text.matchAll(/£\s?(\d+(?:\.\d{1,2})?)/g)].map((m) => Number(m[1]));
}

function analyzeQuoteText(text) {
  const prices = extractPrices(text);
  return {
    faults_described: extractFaults(text),
    components_identified: extractComponents(text),
    pricing_breakdown_visible: prices.length > 0,
    prices,
    tone_patterns: [
      /thank you/i.test(text) ? "polite opener" : null,
      /please let us know|if you would like to proceed/i.test(text) ? "clear CTA" : null,
      /unfortunately|we have found/i.test(text) ? "diagnostic explanation" : null,
      /kind regards/i.test(text) ? "formal signoff" : null
    ].filter(Boolean),
    includes_excludes: [
      /does not include|not included/i.test(text) ? "states exclusions" : null,
      /includes|this would cover/i.test(text) ? "states inclusions" : null
    ].filter(Boolean)
  };
}

async function main() {
  fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });
  fs.writeFileSync(LOG_PATH, "", "utf8");
  const config = getConfig();
  const raw = JSON.parse(fs.readFileSync(SOURCE_JSON, "utf8"));
  const extractor = new QuoteExtractor(config.intercom);
  const repairs = candidateDiagnosticRepairs(raw);
  log(`Selected ${repairs.length} completed diagnostic/board-level repairs with email for initial matching`);

  const results = [];
  let processed = 0;
  for (const repair of repairs) {
    processed += 1;
    if (processed === 1 || processed % LOG_EVERY === 0) {
      log(`Progress: processing repair ${processed}/${repairs.length}; quotes found so far ${results.length}`);
    }
    log(`Searching Intercom for ${repair.email} (${repair.item_name})`);
    const search = await extractor.searchConversationsByEmail(repair.email);
    const conversations = search.conversations || search.data || [];
    for (const summary of conversations) {
      const conversation = await extractor.getConversation(summary.id);
      const quoteParts = findQuoteParts(conversation);
      for (const part of quoteParts) {
        const analysis = analyzeQuoteText(part.text);
        results.push({
          monday_item_id: repair.monday_item_id,
          intercom_conversation_id: String(conversation.id),
          customer_email: repair.email,
          item_name: repair.item_name,
          device_model: repair.device_model,
          repair_type: repair.repair_type,
          final_status: repair.final_status,
          quote_sent_at: part.created_at,
          quote_author_name: part.author_name,
          quote_author_email: part.author_email,
          quote_text: part.text,
          faults_described: analysis.faults_described,
          components_identified: analysis.components_identified,
          pricing_breakdown_visible: analysis.pricing_breakdown_visible,
          prices_found: analysis.prices,
          tone_patterns: analysis.tone_patterns,
          includes_excludes: analysis.includes_excludes,
          monday_quote_amount: repair.quote_amount,
          latest_monday_notes: repair.latest_notes,
          completion_at: repair.completion_at || null
        });
      }
      await sleep(SEARCH_DELAY_MS);
    }
    await sleep(SEARCH_DELAY_MS);
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2));
  log(`Wrote ${results.length} matched quote objects to ${OUT_JSON}`);
}

main().catch((error) => {
  log(`Fatal error: ${error.stack || error.message}`);
  process.exitCode = 1;
});
