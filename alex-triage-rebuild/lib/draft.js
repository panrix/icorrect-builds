import fs from "node:fs";
import { requestJson } from "./http.js";

const ALEX_REQUIRED_DRAFT_FILES = [
  "/home/ricky/.openclaw/agents/alex-cs/workspace/SOUL.md",
  "/home/ricky/.openclaw/agents/alex-cs/workspace/USER.md"
];

export class DraftClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  async draftReply({ ferrariContextPath, learnedRulesPath, card, recentMessages }) {
    const requiredWorkspaceDocs = readRequiredDraftFiles();
    const ferrariContext = readFileIfExists(ferrariContextPath);
    const learnedRules = readFileIfExists(learnedRulesPath);
    const prompt = [
      "You are Alex, customer service at iCorrect. Draft a reply for this customer.",
      "",
      "=== REQUIRED ALEX WORKSPACE DOCS (read before drafting) ===",
      requiredWorkspaceDocs,
      "",
      "=== WRITING RULES (follow exactly) ===",
      ferrariContext || "[No ferrari context loaded]",
      "",
      "=== LEARNED CORRECTIONS (from reviewer feedback) ===",
      learnedRules || "[No learned rules yet]",
      "",
      "=== THIS CONVERSATION ===",
      "TRIAGE CARD:",
      JSON.stringify(card, null, 2),
      "",
      "PAST REPAIRS:",
      JSON.stringify(card?.context?.past_repairs || [], null, 2),
      "",
      "LAST 5 MESSAGES:",
      recentMessages.join("\n\n"),
      "",
      "=== INSTRUCTIONS ===",
      'Draft a reply following the writing rules and learned corrections exactly.',
      '- No em dashes. Sign as "Kind regards, Alex".',
      '- Tone: calm, direct, neutral, specialist. Not sales-led.',
      '- Do not guess prices. Use only the price shown on the card.',
      '- Do not confirm warranty eligibility unless the card already confirms it.',
      '- Do not commit to refunds, free repairs, or complaint outcomes.',
      '- Returning customers should get a slightly warmer, shorter reply.',
      '- New customers should get slightly more context.',
      '- If 2+ warranty returns appear in past repairs, handle sensitively.',
      '- Output ONLY the reply text. No preamble, no explanation.'
    ].join("\n");

    const payload = await requestJson(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
      timeoutMs: 60000
    });

    return payload.choices?.[0]?.message?.content?.trim() || "";
  }

  async draftQuote({ ferrariContextPath, learnedRulesPath, card, historicalQuotes = [], diagnosticNotes = [] }) {
    const requiredWorkspaceDocs = readRequiredDraftFiles();
    const ferrariContext = readFileIfExists(ferrariContextPath);
    const learnedRules = readFileIfExists(learnedRulesPath);
    const prompt = [
      "You are Alex supporting Ferrari at iCorrect. Draft a customer quote email in Ferrari's style.",
      "",
      "=== REQUIRED ALEX WORKSPACE DOCS (read before drafting) ===",
      requiredWorkspaceDocs,
      "",
      "=== WRITING RULES (follow exactly) ===",
      ferrariContext || "[No ferrari context loaded]",
      "",
      "=== LEARNED CORRECTIONS (from reviewer feedback) ===",
      learnedRules || "[No learned rules yet]",
      "",
      "=== HISTORICAL REAL QUOTES (style reference only, not copy-paste) ===",
      JSON.stringify(historicalQuotes.slice(0, 5), null, 2),
      "",
      "=== MONDAY QUOTE CARD ===",
      JSON.stringify(card, null, 2),
      "",
      "=== DIAGNOSTIC NOTES ===",
      diagnosticNotes.join("\n\n") || "[No diagnostic notes found]",
      "",
      "=== INSTRUCTIONS ===",
      "Draft a quote email in Ferrari's style using the card, the notes, and the real quote examples.",
      '- No em dashes. Sign as "Kind regards, Alex".',
      '- Be explicit about faults found, required repairs, what is included, and any important exclusions.',
      '- Use only pricing present in the card/notes/examples context. Do not invent missing prices.',
      '- If the note suggests uncertainty, make the draft yellow-tier style and ask Ferrari to confirm details rather than bluffing.',
      '- Output ONLY the quote email text. No preamble, no explanation.'
    ].join("\n");

    const payload = await requestJson(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }]
      }),
      timeoutMs: 60000
    });

    return payload.choices?.[0]?.message?.content?.trim() || "";
  }

  async extractRules(groupedEdits) {
    const prompt = [
      "You are analysing customer service draft corrections.",
      "Below are edits made by a reviewer to AI-drafted replies,",
      "along with the reviewer's reasons for each change.",
      "",
      "Extract RULES that should apply to all future drafts.",
      "Each rule should be:",
      '- Specific and actionable',
      '- Written as an instruction ("Always...", "Never...", "When X, do Y")',
      "- Include the reviewer's reasoning",
      "",
      JSON.stringify(groupedEdits, null, 2)
    ].join("\n");

    const payload = await requestJson(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.1,
        messages: [{ role: "user", content: prompt }]
      }),
      timeoutMs: 60000
    });

    return payload.choices?.[0]?.message?.content?.trim() || "";
  }
}

export function buildQuoteFallbackDraft(card) {
  const greetingName = card?.customer_name ? firstName(card.customer_name) : "there";
  const findings = card?.diagnostic_findings || [];
  const price = card?.price;
  const extractedPrices = card?.context?.extracted_prices || [];
  const diagnosticFeeLine = card?.quote_breakdown?.find((line) => /Diagnostic fee:/i.test(line));
  const firstFinding = findings[0]?.replace(/^On Arrival:\s*/i, "").trim();

  if (price && !/quote needs confirmation|quote pending/i.test(String(price))) {
    return [
      `Hi ${greetingName},`,
      "",
      "Thank you for your patience.",
      firstFinding ? `Following our diagnostic, we found ${firstFinding.replace(/\.$/, "")}.` : "We have now completed our diagnostic and confirmed the fault.",
      `The quoted price for this repair is ${price}.${diagnosticFeeLine ? ` ${diagnosticFeeLine}.` : ""}`,
      "If you would like to proceed, please let me know and I will confirm the next steps.",
      "",
      "Kind regards,",
      "Alex"
    ].join("\n");
  }

  return [
    `Hi ${greetingName},`,
    "",
    "Thank you for your message.",
    firstFinding ? `We have reviewed the device and identified the following issue: ${firstFinding}.` : "We have reviewed the device.",
    "We would need to complete a diagnostic first to provide accurate pricing.",
    "If you would like to proceed with that, please let me know and I will confirm the next steps.",
    "",
    "Kind regards,",
    "Alex"
  ].join("\n");
}

export function buildFallbackDraft(card) {
  const greetingName = card?.customer_name ? firstName(card.customer_name) : "there";
  const price = card?.price;
  const lowerType = String(card?.type || "").toLowerCase();

  if (lowerType === "complaint") {
    return [
      `Hi ${greetingName},`,
      "",
      "Thank you for your message. I am sorry to hear about the issue.",
      "I have reviewed your conversation and I will make sure this is looked into as a priority.",
      "",
      "Kind regards,",
      "Alex"
    ].join("\n");
  }

  if (lowerType === "chase") {
    return [
      `Hi ${greetingName},`,
      "",
      "Thank you for your message.",
      "I am checking the latest status for you now and I will come back to you with an update shortly.",
      "",
      "Kind regards,",
      "Alex"
    ].join("\n");
  }

  if (lowerType === "quote" || lowerType === "quote building") {
    const findings = card?.diagnostic_findings || [];
    const breakdown = card?.quote_breakdown || [];
    if (price && !/quote pending/i.test(String(price))) {
      return [
        `Hi ${greetingName},`,
        "",
        "Thank you for your patience.",
        findings.length ? `Following our diagnostic, we found ${findings[0].replace(/^On Arrival:\s*/i, "").replace(/\.$/, "")}.` : "We have now assessed the device and confirmed the fault.",
        `The quoted price for this repair is ${price}.`,
        breakdown.length > 1 ? `This includes: ${breakdown.slice(1,3).join(' ')}.` : "If you would like to proceed, please let me know and I will confirm the next steps.",
        "If you would like to proceed, please let me know and I will confirm the next steps.",
        "",
        "Kind regards,",
        "Alex"
      ].join("\n");
    }
    return [
      `Hi ${greetingName},`,
      "",
      "Thank you for your message.",
      findings.length ? `We have reviewed the device and identified the following issue: ${findings[0].replace(/^On Arrival:\s*/i, "")}.` : "We have reviewed the device.",
      "We would need to complete a diagnostic first to provide accurate pricing.",
      "If you would like to proceed with that, please let me know and I will confirm the next steps.",
      "",
      "Kind regards,",
      "Alex"
    ].join("\n");
  }

  if (price && /quote pending/i.test(String(price))) {
    return [
      `Hi ${greetingName},`,
      "",
      "Thank you for your message.",
      "Your device is still in diagnostics at the moment, so I do not have a confirmed quote yet.",
      "As soon as the assessment is complete I will update you with the repair cost and next steps.",
      "",
      "Kind regards,",
      "Alex"
    ].join("\n");
  }

  if (price && /not in catalogue/i.test(String(price))) {
    return [
      `Hi ${greetingName},`,
      "",
      "Thank you for your message.",
      "We would need to complete a diagnostic first to provide accurate pricing for this repair.",
      "If you would like to proceed with that, please let me know and I will confirm the next steps.",
      "",
      "Kind regards,",
      "Alex"
    ].join("\n");
  }

  if (price) {
    return [
      `Hi ${greetingName},`,
      "",
      "Thank you for your message.",
      `The price for this repair is ${price}.`,
      "If you would like to go ahead, please let me know and I will confirm the next steps.",
      "",
      "Kind regards,",
      "Alex"
    ].join("\n");
  }

  return [
    `Hi ${greetingName},`,
    "",
    "Thank you for your message.",
    "I am looking into this for you now and I will confirm the details shortly.",
    "",
    "Kind regards,",
    "Alex"
  ].join("\n");
}

export function readRequiredDraftFiles(filePaths = ALEX_REQUIRED_DRAFT_FILES) {
  const loaded = [];
  for (const filePath of filePaths) {
    if (!filePath || !fs.existsSync(filePath)) {
      throw new Error(`Required draft file missing: ${filePath}`);
    }
    let text = "";
    try {
      text = fs.readFileSync(filePath, "utf8").trim();
    } catch (error) {
      throw new Error(`Required draft file unreadable: ${filePath} (${error.message})`);
    }
    if (!text) {
      throw new Error(`Required draft file empty: ${filePath}`);
    }
    loaded.push(`--- ${filePath} ---\n${text}`);
  }
  return loaded.join("\n\n");
}

function readFileIfExists(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return "";
  }
  return fs.readFileSync(filePath, "utf8").trim();
}

function firstName(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) {
    return "there";
  }

  const [first] = cleaned.split(/\s+/);
  return first || "there";
}
