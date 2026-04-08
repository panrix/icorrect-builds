import fs from "node:fs";
import path from "node:path";
import { loadEnv, getConfig } from "../lib/config.js";
import { SupabaseClient } from "../lib/supabase.js";

const ROOT = "/home/ricky/builds/alex-triage-rebuild";
const SOURCE_PATH = "/home/ricky/builds/agent-rebuild/data/repair-history-full.json";
const BATCH_SIZE = 200;

const CATEGORY_PATTERNS = {
  "Parts delay": [/stock check/i, /out of stock/i, /awaiting part/i, /awaiting parts/i, /waiting for part/i, /waiting on part/i],
  "Liquid damage complexity": [/liquid damage/i, /liquid damaged/i, /corrosion/i, /spill/i],
  "Board-level repair complexity": [/logic board/i, /board level/i, /board repair/i, /microsolder/i, /backlight/i, /chip\b/i],
  "Warranty/return": [/warranty/i, /under warranty/i, /out of warranty/i, /previous repair/i, /same issue/i],
  "Customer communication issue": [/passcode/i, /no response/i, /no reply/i, /tried calling/i, /waiting for customer/i, /contact customer/i],
  Escalation: [/@ricky/i, /@ferrari/i, /escalat/i],
  "Client no-show / abandoned": [/no show/i, /not collected/i, /abandoned/i, /book return/i],
  "Insurance/corporate special handling": [/corporate/i, /insurance/i, /freuds/i, /hudson advisors/i, /everything apple tech/i],
  "Diagnostic complexity": [/intermittent/i, /further diagnos/i, /staged/i, /known-good/i, /isolate/i],
  "Extra fault found": [/also need/i, /additional fault/i, /extra fault/i, /would also need/i],
  "Pricing dispute": [/discount/i, /too expensive/i, /not worth/i, /not happy/i, /free of charge/i],
  "Data quality issue": [/wrong password/i, /wrong model/i, /missing field/i, /duplicate/i],
  "Handoff failure": [/handoff/i, /wrong queue/i, /context lost/i],
  "QC rejection": [/quality control/i, /failed qc/i, /rework/i]
};

const DEVICE_PATTERNS = [
  ["iphone", /\biphone\b/i],
  ["ipad", /\bipad\b/i],
  ["macbook", /\b(macbook|imac|mac mini|mac studio|mac pro)\b/i],
  ["watch", /\b(apple watch|watch)\b/i]
];

const REPAIR_PATTERNS = [
  ["Board Level", /logic board|board level|board repair|microsolder|chip|backlight/i],
  ["Liquid Damage", /liquid damage|corrosion|spill/i],
  ["Screen Replacement", /screen|display|lcd|oled|glass|digitizer/i],
  ["Battery", /battery/i],
  ["Charging", /charging|charge port|usb-c|lightning/i],
  ["Keyboard", /keyboard/i],
  ["Diagnostic", /diagnostic|diagnosis|diagnostics/i],
  ["Camera", /camera/i],
  ["Audio", /speaker|microphone|audio/i]
];

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
  for (const column of item.column_values || []) {
    map[column.id] = {
      id: column.id,
      text: column.text || "",
      value: parseJson(column.value)
    };
  }
  return map;
}

function cleanText(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function extractEntries(item) {
  const entries = [];
  for (const update of item.updates || []) {
    const updateText = cleanText(update.body || update.text_body || "");
    if (updateText) {
      entries.push({
        createdAt: update.created_at || null,
        text: updateText,
        source: "update"
      });
    }
    for (const reply of update.replies || []) {
      const replyText = cleanText(reply.body || reply.text_body || "");
      if (replyText) {
        entries.push({
          createdAt: reply.created_at || null,
          text: replyText,
          source: "reply"
        });
      }
    }
  }
  entries.sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
  return entries;
}

function createdAtToDate(log) {
  const raw = String(log?.created_at || "");
  if (!raw) return null;
  if (/^\d{13,}$/.test(raw)) {
    const ms = Number(raw.slice(0, 13));
    return new Date(ms);
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function businessDaysInclusive(start, end) {
  if (!start || !end || end < start) return null;
  const startDate = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endDate = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  let count = 0;
  for (let current = startDate; current <= endDate; current = new Date(current.getTime() + 86400000)) {
    const day = current.getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
  }
  return count;
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
      const payload = parseJson(log.data) || {};
      return {
        date: createdAtToDate(log),
        columnId: payload.column_id || "",
        columnTitle: payload.column_title || "",
        from: extractStatusLabel(payload.previous_value || {}),
        to: extractStatusLabel(payload.value || {})
      };
    })
    .filter((log) => log.date)
    .sort((a, b) => a.date - b.date);
}

function computeDiagnosticMetrics(item) {
  const logs = statusLogs(item);
  const start = logs.find((log) => ["diagnostics", "diagnostic"].includes(log.to.toLowerCase()));
  const end = start
    ? logs.find((log) => log.date >= start.date && ["diagnostic complete", "ready to quote", "quote sent"].includes(log.to.toLowerCase()))
    : null;
  const quoteSent = start
    ? logs.find((log) => log.date >= start.date && log.to.toLowerCase() === "quote sent")
    : null;
  const nextAfterQuote = quoteSent ? logs.find((log) => log.date > quoteSent.date && log.to) : null;

  return {
    diagnosticDays: start && end ? businessDaysInclusive(start.date, end.date) : null,
    quoteSilenceDays: quoteSent && nextAfterQuote ? businessDaysInclusive(quoteSent.date, nextAfterQuote.date) : null,
    intakeDateFallback: logs[0]?.date || null,
    completionDateFallback: logs.at(-1)?.date || null
  };
}

function findEmail(text) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : null;
}

function findPhone(text) {
  const matches = text.match(/(?:\+44\s?7\d{3}|07\d{3}|\+44\s?\d{2,4}|0\d{2,4})[\s\d]{6,}/g) || [];
  return matches.map((value) => value.replace(/\s+/g, " ").trim())[0] || null;
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D+/g, "");
  if (!digits) return null;
  if (digits.startsWith("44") && digits.length >= 12) return `0${digits.slice(2)}`;
  return digits;
}

function pickDeviceModel(item, columns, entries) {
  const candidateTexts = [
    columns.board_relation5?.text,
    columns.order_id?.text,
    columns.text86?.text,
    columns.text368?.text,
    item.name,
    ...entries.map((entry) => entry.text)
  ]
    .filter(Boolean)
    .map(cleanText);

  for (const text of candidateTexts) {
    const detailedMatch = text.match(/(iPhone(?:\s+[A-Za-z0-9+\- ]+)?|iPad(?:\s+[A-Za-z0-9+\-()." ]+)?|MacBook(?:\s+[A-Za-z0-9+\-()." ]+)?|Apple Watch(?:\s+[A-Za-z0-9+\-()." ]+)?)/i);
    if (detailedMatch) return detailedMatch[1].trim().replace(/[:;,]+$/, "");
  }

  const haystack = candidateTexts.join("\n");
  if (/\biphone\b/i.test(haystack)) return "iPhone";
  if (/\bipad\b/i.test(haystack)) return "iPad";
  if (/\b(macbook|imac|mac mini|mac studio|mac pro)\b/i.test(haystack)) return "MacBook";
  if (/\b(apple watch|watch)\b/i.test(haystack)) return "Apple Watch";

  return columns.board_relation5?.text || columns.order_id?.text || columns.text86?.text || null;
}

function classifyDeviceType(deviceModel) {
  const text = cleanText(deviceModel || "");
  for (const [label, pattern] of DEVICE_PATTERNS) {
    if (pattern.test(text)) return label;
  }
  return "other";
}

function inferRepairType(item, columns, entries, deviceModel) {
  const candidates = [
    columns.board_relation?.text,
    columns.status24?.text,
    columns.text86?.text,
    ...entries.slice(0, 10).map((entry) => entry.text),
    deviceModel
  ].filter(Boolean);

  const haystack = candidates.join("\n");
  for (const [label, pattern] of REPAIR_PATTERNS) {
    if (pattern.test(haystack)) return label;
  }

  return columns.status24?.text || columns.board_relation?.text || "Unknown";
}

function inferFaultTags(textBlob) {
  const matches = [];
  for (const [tag, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(textBlob))) {
      matches.push(tag);
    }
  }
  return matches.length ? matches : ["Normal flow"];
}

function inferRepairStatus(columns, entries) {
  const status = columns.status4?.text || columns.status?.text || "";
  if (status) return status;
  const last = entries.at(-1)?.text || "";
  if (/returned/i.test(last)) return "Returned";
  if (/declined|rejected/i.test(last)) return "Declined";
  return "Unknown";
}

function inferQuoteAmount(textBlob) {
  const matches = [...textBlob.matchAll(/£\s?(\d+(?:\.\d{1,2})?)/g)].map((match) => Number(match[1]));
  if (!matches.length) return null;
  return matches.at(-1).toFixed(2);
}

function inferPaymentStatus(item, columns, textBlob) {
  if (columns.payment_status?.text) return columns.payment_status.text;
  if (/already paid|\*paid\*|\*already paid\*/i.test(item.name) || /\bpaid\b/i.test(textBlob)) return "Paid";
  if (/not paid/i.test(item.name) || /no payment/i.test(textBlob)) return "Not Paid";
  if (/invoice|invoiced/i.test(textBlob)) return "Invoiced";
  return null;
}

function inferWarrantyReturns(textBlob) {
  let count = 0;
  count += (textBlob.match(/same issue/gi) || []).length;
  count += (textBlob.match(/previous repair/gi) || []).length;
  return count;
}

function summarize(entries, repairStatus) {
  const first = entries.find((entry) => entry.text.length > 20)?.text || "";
  const summary = first ? first.slice(0, 150) : `Repair ended ${repairStatus}`;
  return summary;
}

function inferResolution(entries, repairStatus) {
  return entries.at(-1)?.text?.slice(0, 280) || `Final status: ${repairStatus}`;
}

function toIsoDate(date) {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

function deriveRecord(item) {
  const columns = columnMap(item);
  const entries = extractEntries(item);
  const textBlob = [item.name, ...Object.values(columns).map((column) => column.text), ...entries.map((entry) => entry.text)]
    .filter(Boolean)
    .join("\n");

  const email = (columns.text5?.text || findEmail(textBlob) || "").toLowerCase() || null;
  const rawPhone = columns.text00?.text || findPhone(textBlob) || null;
  const metrics = computeDiagnosticMetrics(item);
  const deviceModel = pickDeviceModel(item, columns, entries);
  const deviceType = classifyDeviceType(deviceModel);
  const repairType = inferRepairType(item, columns, entries, deviceModel);
  const faultTags = inferFaultTags(textBlob);
  const repairStatus = inferRepairStatus(columns, entries);
  const quoteAmount = inferQuoteAmount(textBlob);
  const paymentStatus = inferPaymentStatus(item, columns, textBlob);
  const warrantyReturns = inferWarrantyReturns(textBlob);
  const wasWarranty = faultTags.includes("Warranty/return") || /warranty/i.test(textBlob);
  const intakeDate = columns.date4?.text || columns.collection_date?.text || toIsoDate(metrics.intakeDateFallback);
  const completionDate = columns.date_mkwdan7z?.text || columns.collection_date?.text || toIsoDate(metrics.completionDateFallback);
  const repairCategory = columns.service?.text || columns.status?.text || null;

  return {
    monday_item_id: Number(item.id),
    customer_name: cleanText(item.name),
    customer_email: email || null,
    customer_phone: rawPhone || null,
    device_model: deviceModel,
    device_type: deviceType,
    repair_type: repairType,
    repair_category: repairCategory,
    fault_tags: faultTags,
    repair_status: repairStatus,
    quote_amount: quoteAmount,
    payment_status: paymentStatus,
    was_warranty: wasWarranty,
    warranty_returns: warrantyReturns,
    intake_date: intakeDate || null,
    completion_date: completionDate || null,
    diagnostic_days: metrics.diagnosticDays,
    quote_silence_days: metrics.quoteSilenceDays,
    thread_summary: summarize(entries, repairStatus),
    resolution: inferResolution(entries, repairStatus)
  };
}

async function main() {
  loadEnv();
  const config = getConfig();
  const supabase = new SupabaseClient(config.supabase);
  const raw = JSON.parse(fs.readFileSync(SOURCE_PATH, "utf8"));
  const items = raw.items || [];
  const records = items.map(deriveRecord);

  let processed = 0;
  for (let index = 0; index < records.length; index += BATCH_SIZE) {
    const batch = records.slice(index, index + BATCH_SIZE);
    await supabase.upsertRepairHistory(batch);
    processed += batch.length;
    if (processed % 100 === 0 || processed === records.length) {
      console.log(`Processed ${processed}/${records.length}`);
    }
  }

  const rowCount = await supabase.countRepairHistory();
  const emailCoverage = records.filter((record) => record.customer_email).length / records.length;
  const deviceCoverage = records.filter((record) => record.device_type && record.device_type !== "other").length / records.length;
  const outputPath = path.join(ROOT, "data", "repair-history-import-summary.json");
  const summary = {
    processed: records.length,
    rowCount,
    emailCoverage,
    deviceCoverage,
    sampleSearchEmail: records.find((record) => record.customer_email)?.customer_email || null,
    phoneCoverage: records.filter((record) => normalizePhone(record.customer_phone)).length / records.length
  };
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
