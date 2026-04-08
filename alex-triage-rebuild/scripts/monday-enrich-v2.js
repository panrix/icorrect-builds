import { MondayClient } from "../lib/monday.js";
import { getConfig } from "../lib/config.js";

const TERMINAL_STATUSES = new Set(["Returned", "Shipped", "Cancelled/Declined", "BER/Parts"]);
const ACTIVE_LOOKBACK_DAYS = 21;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D+/g, "");
  if (!digits) return null;
  if (digits.startsWith("44") && digits.length >= 12) return `0${digits.slice(2)}`;
  return digits;
}

function firstName(value) {
  return normalize(value).split(/\s+/).filter(Boolean)[0] || null;
}

function emailDomain(value) {
  const email = normalize(value);
  return email.includes("@") ? email.split("@")[1] : null;
}

function companyFromEmail(value) {
  const domain = emailDomain(value);
  if (!domain) return null;
  return domain.split(".")[0].replace(/[^a-z0-9]+/g, " ").trim();
}

function detectDeviceType(value) {
  const text = normalize(value);
  if (text.includes("iphone")) return "iphone";
  if (text.includes("ipad")) return "ipad";
  if (text.includes("watch")) return "watch";
  if (text.includes("macbook") || text.includes("imac") || text.includes("mac mini") || text.includes("mac pro")) return "macbook";
  return null;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysSince(value) {
  const date = parseDate(value);
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

function isActiveItem(item) {
  return !TERMINAL_STATUSES.has(item.current_status || "");
}

function uniqueById(items) {
  const seen = new Map();
  for (const item of items) {
    seen.set(String(item.id), item);
  }
  return [...seen.values()];
}

function scoreCandidate(input, item) {
  const customerEmail = normalize(input.customerEmail);
  const customerPhone = normalizePhone(input.customerPhone);
  const customerFirstName = firstName(input.customerName);
  const customerDomain = emailDomain(input.customerEmail);
  const companyHint = companyFromEmail(input.customerEmail);
  const deviceHintType = detectDeviceType(input.deviceHint);
  const itemEmail = normalize(item.email);
  const itemPhone = normalizePhone(item.phone);
  const itemName = normalize(item.name);
  const itemCompany = normalize(item.company);
  const itemDevice = normalize(item.device_model || item.name);
  const itemDomain = emailDomain(item.email);
  const itemFirstName = firstName(item.name);
  const receivedDaysAgo = daysSince(item.received);

  if (input.conversationId && normalize(item.intercom_id) === normalize(input.conversationId)) {
    return { confidence: 0.95, match_reason: "intercom_id_exact" };
  }

  if (customerEmail && itemEmail && customerEmail === itemEmail) {
    return { confidence: 0.95, match_reason: "exact_email" };
  }

  if (customerPhone && itemPhone && customerPhone === itemPhone) {
    return { confidence: 0.85, match_reason: "exact_phone" };
  }

  if (customerPhone && itemPhone && customerPhone.slice(-10) === itemPhone.slice(-10)) {
    return { confidence: 0.85, match_reason: "normalized_phone" };
  }

  if (
    customerEmail &&
    customerDomain &&
    itemDomain &&
    customerDomain === itemDomain &&
    customerFirstName &&
    itemFirstName === customerFirstName &&
    (receivedDaysAgo === null || receivedDaysAgo <= 7)
  ) {
    return { confidence: 0.7, match_reason: "fuzzy_email_domain" };
  }

  if (
    companyHint &&
    companyHint.length >= 3 &&
    itemCompany &&
    itemCompany.includes(companyHint) &&
    (deviceHintType === null || detectDeviceType(itemDevice) === deviceHintType)
  ) {
    return { confidence: 0.65, match_reason: "corporate_company_match" };
  }

  if (
    customerFirstName &&
    itemName.includes(customerFirstName) &&
    deviceHintType &&
    detectDeviceType(itemDevice) === deviceHintType
  ) {
    return { confidence: 0.5, match_reason: "name_device_match" };
  }

  return null;
}

function toOutput(item, score) {
  return {
    monday_item_id: String(item.id),
    confidence: score.confidence,
    match_reason: score.match_reason,
    status: item.current_status,
    device_model: item.device_model,
    repair_type: item.repair_type,
    payment_status: item.payment_status,
    received: item.received,
    name: item.name,
    client_status: item.client_status
  };
}

export async function enrichConversationV2({
  mondayClient,
  customerEmail = null,
  customerPhone = null,
  customerName = null,
  conversationId = null,
  deviceHint = null
}) {
  const columns = await mondayClient.getBoardColumns();
  const phoneColumnId = columns.find((column) => /phone/i.test(column.title))?.id || "text00";
  const companyColumnId = columns.find((column) => /company/i.test(column.title))?.id || "text15";
  void companyColumnId;

  const exactCandidates = [];
  if (conversationId) {
    exactCandidates.push(...(await mondayClient.findByIntercomId(conversationId)));
  }
  if (customerEmail) {
    exactCandidates.push(...(await mondayClient.findByEmail(customerEmail)));
  }
  if (customerPhone) {
    exactCandidates.push(...(await mondayClient.findByPhone(customerPhone, phoneColumnId)));
    const normalized = normalizePhone(customerPhone);
    if (normalized && normalized !== customerPhone) {
      exactCandidates.push(...(await mondayClient.findByPhone(normalized, phoneColumnId)));
    }
  }

  const recentSince = new Date(Date.now() - ACTIVE_LOOKBACK_DAYS * 86400000).toISOString().slice(0, 10);
  const recentItems = await mondayClient.fetchRecentItems({ receivedSince: recentSince, limit: 250 });
  const pooled = uniqueById([...exactCandidates, ...recentItems.filter(isActiveItem)]);

  const scored = pooled
    .map((item) => ({ item, score: scoreCandidate({ customerEmail, customerPhone, customerName, conversationId, deviceHint }, item) }))
    .filter((entry) => entry.score)
    .sort((a, b) => b.score.confidence - a.score.confidence || String(b.item.received || "").localeCompare(String(a.item.received || "")));

  return {
    best_match: scored[0] ? toOutput(scored[0].item, scored[0].score) : null,
    alternatives: scored.slice(1, 5).map((entry) => toOutput(entry.item, entry.score))
  };
}

async function main() {
  const config = getConfig();
  const mondayClient = new MondayClient(config.monday);
  const args = Object.fromEntries(
    process.argv.slice(2).map((part) => {
      const [key, value] = part.replace(/^--/, "").split("=");
      return [key, value || ""];
    })
  );

  const result = await enrichConversationV2({
    mondayClient,
    customerEmail: args.email || null,
    customerPhone: args.phone || null,
    customerName: args.name || null,
    conversationId: args.conversationId || null,
    deviceHint: args.deviceHint || null
  });

  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
