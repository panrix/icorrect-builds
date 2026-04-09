import { formatTelegramCard } from "../lib/triage.js";

const card = {
  id: "synthetic-1",
  customer_name: "Jamie Example",
  customer_email: "jamie@example.com",
  customer_phone: "Unknown -- n/a",
  type: "follow_up",
  channel: "email",
  device: "N/A",
  priority: "P2",
  confidence: { emoji: "🟡", label: "Needs review" },
  latest_message: "Hi, just checking if there is any update please.",
  what_matters: "Customer is chasing an update. Monday currently shows ready_to_collect.",
  customer_type: "🆕 New customer",
  last_repair: null,
  thread_summary: [
    "Us: We will update you shortly.",
    "Customer: Hi, just checking if there is any update please."
  ],
  context: {
    monday_item_id: "12345",
    monday_item_label: "Jamie Example - iPhone 13",
    monday_confidence: Number.NaN,
    monday_match_reason: "exact_email",
    kb_used: ["pricing.json", "repair_history Supabase"],
    pricing_source: "From KB ✓",
    last_reply_from_us: "Alex at 2026-04-09T07:15:00.000Z",
    intercom_url: "https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/123"
  },
  raw: {
    current_status: "ready_to_collect"
  },
  payment: "not_paid",
  received: "2026-04-09T06:40:00.000Z",
  expected: "2026-04-10",
  tech_notes: "unknown"
};

const rendered = formatTelegramCard(card, "Hi Jamie, your device is ready to collect.\n\nKind regards,\nAlex");
console.log(rendered);
