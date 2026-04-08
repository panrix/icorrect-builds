import fs from "node:fs";
import { requestJson } from "./http.js";

export class DraftClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  async draftReply({ ferrariContextPath, learnedRulesPath, card, recentMessages }) {
    const ferrariContext = readFileIfExists(ferrariContextPath);
    const learnedRules = readFileIfExists(learnedRulesPath);
    const prompt = [
      "You are Alex, customer service at iCorrect. Draft a reply for this customer.",
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

  if (price && price !== "Not in catalogue") {
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
