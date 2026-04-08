function stripHtml(value) {
  return (value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
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

export function buildIntercomUrl(workspaceId, conversationId) {
  return `https://app.intercom.com/a/inbox/${workspaceId}/inbox/conversation/${conversationId}`;
}

export function flattenMessages(conversation) {
  const source = conversation.source
    ? [
        {
          id: conversation.source.id || "source",
          created_at: conversation.created_at || conversation.source.created_at || 0,
          author_type: conversation.source.author?.type || "user",
          author_name: conversation.source.author?.name || conversation.source.author?.email || "Customer",
          body: conversation.source.body || conversation.source.text || ""
        }
      ]
    : [];

  const parts = (conversation.conversation_parts?.conversation_parts || []).map((part) => ({
    id: part.id,
    created_at: part.created_at || 0,
    author_type: part.author?.type || "unknown",
    author_name: part.author?.name || part.author?.email || part.author?.type || "Unknown",
    body: part.body || part.text || ""
  }));

  return [...source, ...parts]
    .sort((a, b) => a.created_at - b.created_at)
    .map((message) => ({
      ...message,
      text: normalizeText(message.body)
    }))
    .filter((message) => message.text);
}

function isInternalAuthor(email) {
  const normalized = lower(email || "");
  return (
    normalized === "operator+pt6lwaq6@intercom.io" ||
    normalized.endsWith("@icorrect.co.uk") ||
    normalized.endsWith("@intercom.io")
  );
}

function extractCustomerFromBody(conversation) {
  const partBodies = (conversation.conversation_parts?.conversation_parts || [])
    .map((part) => part.body || part.text || "")
    .filter(Boolean);
  const raw = [conversation.source?.subject || "", conversation.source?.body || "", ...partBodies].join("\n\n");
  if (!raw.trim()) return null;
  const rawText = stripHtml(raw);

  const emailMatches = [
    rawText.match(/Email:\s*([^\s]+@[^\s]+)/i),
    raw.match(/mailto:([^"'\s>]+)/i)
  ];
  const email = emailMatches.find((m) => m)?.[1]?.trim()?.replace(/[>,;.]$/, "") || null;

  const phoneMatch = rawText.match(/Phone:\s*([^\n]+)/i);
  const phone = phoneMatch?.[1]?.trim()?.replace(/\s+/g, " ") || null;

  const subject = stripHtml(conversation.source?.subject || conversation.title || "");
  const nameMatches = [
    rawText.match(/New enquiry from\s+([^\n]+?)(?=\s+Email:|\s+Phone:|\n|$)/i),
    rawText.match(/Contact Form:\s*([^\n-]+?)(?=\s*-\s*[^\n]+|\n|$)/i),
    rawText.match(/Name:\s*([^\n]+)/i),
    subject.match(/Contact Form:\s*([^\n-]+?)(?=\s*-\s*[^\n]+|\n|$)/i),
    rawText.match(/Monday item created\s+([A-Z][A-Za-z' -]{1,80}?)(?=\s+Group:|$)/i),
    rawText.match(/Hi\s+([A-Z][A-Za-z' -]{1,60}),/)
  ];
  const name = nameMatches.find((m) => m)?.[1]?.trim() || null;

  if (!name && !email && !phone) return null;
  return { name, email, phone, source: "body_parsed" };
}

export function extractConversationCustomer(conversation) {
  const sourceEmail = conversation.source?.author?.email || null;
  const sourceName = conversation.source?.author?.name || null;
  const contact = conversation.contacts?.contacts?.[0] || {};

  if (isInternalAuthor(sourceEmail)) {
    const parsed = extractCustomerFromBody(conversation) || {};
    return {
      name: parsed.name || contact.name || sourceName || sourceEmail || `Conversation ${conversation.id}`,
      email: parsed.email || contact.email || null,
      phone: parsed.phone || contact.phone || conversation.source?.author?.phone || null,
      source: parsed.source || "contact_fallback"
    };
  }

  return {
    name: sourceName || contact.name || sourceEmail || `Conversation ${conversation.id}`,
    email: sourceEmail || contact.email || null,
    phone: contact.phone || conversation.source?.author?.phone || null,
    source: "author"
  };
}

export function getLastCustomerMessage(messages) {
  return [...messages].reverse().find((message) => message.author_type === "user") || null;
}

export function getLastAdminMessage(messages) {
  return [...messages].reverse().find((message) => message.author_type === "admin") || null;
}

export function isActionableConversation(conversation, messages) {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) {
    return false;
  }

  if (conversation.state === "snoozed" || conversation.snoozed_until) {
    return false;
  }

  const tags = (conversation.tags?.tags || conversation.tags || []).map((tag) =>
    lower(tag.name || tag)
  );
  if (tags.includes("spam-auto-closed")) {
    return false;
  }

  const subject = lower(conversation.source?.subject || conversation.title || "");
  const senderEmail = lower(conversation.source?.author?.email || "");
  const senderName = lower(conversation.source?.author?.name || "");
  const combinedText = messages.map((message) => message.text).join(" ").toLowerCase();

  if (!subject && !combinedText) {
    return false;
  }

  const spamPatterns = [
    // Sender patterns
    () => senderEmail.includes("sales@"),
    () => senderEmail.includes("marketing@"),
    () => senderEmail.includes("noreply@"),
    () => senderEmail.includes("no-reply@"),
    () => senderEmail.includes("newsletter@"),
    () => senderEmail.includes("info@") && !senderEmail.includes("icorrect"),
    () => senderName.includes("marketing"),
    // Content patterns
    () => combinedText.includes("partnership opportunity"),
    () => combinedText.includes("guest post"),
    () => combinedText.includes("seo service"),
    () => combinedText.includes("supplier catalog"),
    () => combinedText.includes("free demo"),
    () => combinedText.includes("instagram followers"),
    () => combinedText.includes("social media promotion"),
    () => combinedText.includes("boost your"),
    () => combinedText.includes("grow your business"),
    () => combinedText.includes("limited time offer"),
    () => combinedText.includes("unsubscribe"),
    () => combinedText.includes("click here to"),
    () => combinedText.includes("we noticed your website"),
    () => combinedText.includes("we came across your"),
    () => combinedText.includes("would love to connect"),
    () => combinedText.includes("wholesale"),
    () => combinedText.includes("bulk order"),
    () => combinedText.includes("special discount for"),
    () => combinedText.includes("are you the right person"),
    () => combinedText.includes("just following up on my previous email"),
    () => combinedText.includes("i represent"),
    () => combinedText.includes("on behalf of my client"),
  ];

  if (spamPatterns.some((check) => check())) {
    return false;
  }

  if (lastMessage.author_type === "admin") {
    return false;
  }

  return true;
}

export function classifyConversation(conversation, messages, mondayMatch) {
  // Only classify based on the last 3 messages, not the full thread history
  const recentMessages = messages.slice(-3);
  const recentText = recentMessages.map((message) => `${message.author_type}: ${message.text}`).join("\n").toLowerCase();
  const allText = messages.map((message) => `${message.author_type}: ${message.text}`).join("\n").toLowerCase();
  const sourceType = lower(conversation.source?.type || "");
  const email = lower(conversation.source?.author?.email || "");

  if (email.includes("backmarket") || allText.includes("back market")) {
    return "bm_email";
  }

  // Complaint detection based on recent messages only — old thread history doesn't count
  if (
    recentText.includes("complaint") ||
    recentText.includes("unhappy") ||
    recentText.includes("refund") ||
    recentText.includes("not acceptable") ||
    recentText.includes("disgusted") ||
    recentText.includes("trading standards")
  ) {
    return "complaint";
  }

  if (
    recentText.includes("status update") ||
    recentText.includes("any update") ||
    recentText.includes("when will") ||
    recentText.includes("ready to collect") ||
    recentText.includes("collect my")
  ) {
    return "chase";
  }

  const hasAdminReply = messages.some((message) => message.author_type === "admin");
  if (!hasAdminReply) {
    return "new_enquiry";
  }

  return "follow_up";
}

export function computePriority({ category, mondayMatch, lastAdminMessage, lastCustomerMessage }) {
  const payment = lower(mondayMatch?.payment_status || "");
  const nowSeconds = Date.now() / 1000;
  const lastAdminAgeHours = lastAdminMessage
    ? (nowSeconds - Number(lastAdminMessage.created_at || 0)) / 3600
    : null;

  if (payment.includes("paid") && !payment.includes("not") && !lastAdminMessage) {
    return "High";
  }

  if (category === "complaint") {
    return "High";
  }

  if (lastAdminAgeHours !== null && lastAdminAgeHours > 48) {
    return "High";
  }

  if (category === "new_enquiry" || category === "follow_up" || category === "chase") {
    return "Medium";
  }

  if (lastCustomerMessage && nowSeconds - Number(lastCustomerMessage.created_at || 0) < 6 * 3600) {
    return "Medium";
  }

  return "Low";
}

export function summarizeWhyItMatters({ category, priceLabel, mondayMatch, pastRepairs = [] }) {
  if (category === "bm_email") {
    return "Back Market related email. Route with priority and avoid standard AI flow.";
  }

  if (category === "complaint") {
    return "Complaint-style message. Needs careful wording and Ferrari visibility before send.";
  }

  if (category === "chase") {
    return mondayMatch?.status || mondayMatch?.current_status
      ? `Customer is chasing an update. Monday currently shows ${mondayMatch.status || mondayMatch.current_status}.`
      : "Customer is chasing an update, but Monday status is unclear.";
  }

  if (pastRepairs.length >= 2) {
    return `Returning customer with ${pastRepairs.length} previous repairs. Keep tone warmer and reference history carefully.`;
  }

  if (priceLabel && priceLabel !== "Not in catalogue") {
    return `Standard enquiry with a catalogue price available (${priceLabel}).`;
  }

  return "Needs a drafted response with clear next step and human review.";
}

export function buildCard({
  conversation,
  messages,
  mondayMatch,
  mondayAlternatives = [],
  pastRepairs = [],
  category,
  priority,
  price,
  workspaceId
}) {
  const lastCustomerMessage = getLastCustomerMessage(messages);
  const lastAdminMessage = getLastAdminMessage(messages);

  const extractedCustomer = extractConversationCustomer(conversation);
  const customerName = extractedCustomer.name;
  const customerEmail = extractedCustomer.email;
  const customerPhone = extractedCustomer.phone;

  const device = mondayMatch?.device_model || detectDeviceFromMessages(messages) || "N/A";
  const payment = mondayMatch?.payment_status || "Unknown";
  const priceLabel = resolvePriceLabel({ price, mondayMatch });
  const confidence = determineConfidenceTier({
    category,
    mondayMatch,
    priceLabel,
    pastRepairs,
    lastAdminMessage,
    lastCustomerMessage,
    customerEmail: conversation.source?.author?.email || conversation.contacts?.contacts?.[0]?.email || null
  });
  const threadSummary = buildThreadSummary(messages);

  return {
    id: String(conversation.id),
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    type: category,
    channel: conversation.source?.type || "email",
    device,
    received: mondayMatch?.received || null,
    expected: mondayMatch?.expected || null,
    tech_notes: mondayMatch?.tech_notes || "None",
    client_status: mondayMatch?.client_status || "No active repair found on Monday.",
    payment,
    priority: toPriorityLabel(priority),
    price: priceLabel,
    confidence,
    thread_summary: threadSummary,
    latest_message: (lastCustomerMessage?.text || "No customer message found").slice(0, 280),
    customer_type: buildCustomerTypeLabel(pastRepairs),
    last_repair: pastRepairs[0] || null,
    what_matters: summarizeWhyItMatters({ category, priceLabel, mondayMatch, pastRepairs }),
    context: {
      last_reply_from_us: lastAdminMessage
        ? `${lastAdminMessage.author_name} at ${new Date(
            Number(lastAdminMessage.created_at) * 1000
          ).toISOString()}`
        : "None",
      thread_age_days: ageDays(messages[0]?.created_at || conversation.created_at),
      messages_in_thread: messages.length,
      monday_item_id: mondayMatch?.monday_item_id || mondayMatch?.id || null,
      monday_item_label: mondayMatch?.name || null,
      monday_confidence: mondayMatch?.confidence || null,
      monday_match_reason: mondayMatch?.match_reason || null,
      monday_alternatives: mondayAlternatives,
      past_repairs: pastRepairs,
      kb_used: buildKbSources({ price, mondayMatch, pastRepairs }),
      pricing_source: price?.label ? "From KB ✓" : mondayMatch?.confidence >= 0.85 ? "From Monday repair ✓" : "Not in KB ⚠️",
      intercom_url: buildIntercomUrl(workspaceId, conversation.id)
    },
    raw: {
      source_type: conversation.source?.type || null,
      current_status: mondayMatch?.status || mondayMatch?.current_status || null
    }
  };
}

export function formatRecentMessages(messages, limit = 5) {
  return messages.slice(-limit).map((message) => {
    const label = message.author_type === "admin" ? "Us" : message.author_name || "Customer";
    return `${label}: ${message.text}`;
  });
}

export function formatTelegramCard(card, draftText, stateLabel = null) {
  if (card?.card_kind === "quote") {
    return formatQuoteTelegramCard(card, draftText, stateLabel);
  }

  const confidenceLabel = `${card.confidence?.emoji || "🟡"} ${escapeHtml(card.confidence?.label || "Needs review")}`;
  const mondayConfidenceLabel = card.context.monday_confidence
    ? ` (${Math.round(card.context.monday_confidence * 100)}% · ${escapeHtml(card.context.monday_match_reason || "match")})`
    : "";
  const lines = [
    `<b>━━━ TRIAGE CARD ━━━━━━━━━━━━━━━━━━━━━━━</b>`,
    `Type: ${escapeHtml(titleize(card.type))}`,
    `Channel: ${escapeHtml(titleize(card.channel || "email"))}`,
    `Device: ${escapeHtml(card.device)}`,
    `Confidence: ${confidenceLabel}`,
    `Priority: ${escapeHtml(card.priority)}`,
    "",
    `<b>━ CUSTOMER ━</b>`,
    `Name: ${escapeHtml(card.customer_name)}`,
    `Email: ${escapeHtml(card.customer_email || "Unknown")}`,
    `Phone: ${escapeHtml(card.customer_phone || "Unknown")}`,
    `Type: ${escapeHtml(card.customer_type)}`,
    ...formatLastRepairLines(card.last_repair),
    "",
    `<b>━ ACTIVE REPAIR ━</b>`,
    `Monday: ${escapeHtml(card.context.monday_item_label || card.context.monday_item_id || "No active repair found on Monday.")}${mondayConfidenceLabel}`,
    ` Status: ${escapeHtml(card.raw.current_status || "Not found")}`,
    ` Payment: ${escapeHtml(card.payment || "Unknown")}`,
    ` Received: ${escapeHtml(card.received || "Not yet")}`,
    ` Expected: ${escapeHtml(card.expected || "TBC")}`,
    ` Tech notes: ${escapeHtml(card.tech_notes || "None")}`,
    ` Link: ${escapeHtml(card.context.monday_item_id ? `https://icorrect.monday.com/boards/349212843/pulses/${card.context.monday_item_id}` : "N/A")}`,
    "",
    `<b>━ THREAD ━</b>`,
    ...card.thread_summary.map((line) => escapeHtml(line)),
    "",
    `<b>━━ DRAFT REPLY ━</b>`,
    escapeHtml(draftText || "Draft pending"),
    "",
    `<b>━━ SOURCE ━</b>`,
    `KB used: ${escapeHtml((card.context.kb_used || []).join(", ") || "None")}`,
    `Pricing: ${escapeHtml(card.context.pricing_source || "Not applicable")}`,
    "",
    `<a href="${card.context.intercom_url}">Open Intercom</a>`
  ];

  if (stateLabel) {
    lines.push("", `<b>${escapeHtml(stateLabel)}</b>`);
  }

  return lines.join("\n");
}

function determineConfidenceTier({ category, mondayMatch, priceLabel, pastRepairs, lastAdminMessage }) {
  const payment = lower(mondayMatch?.payment_status || "");
  const paidAndSilent = payment.includes("paid") && lastAdminMessage && (Date.now() / 1000 - Number(lastAdminMessage.created_at || 0)) / 3600 > 48;

  if (category === "complaint" || category === "bm_email" || paidAndSilent) {
    return { tier: "red", emoji: "🔴", label: "Escalate" };
  }

  if (
    !priceLabel ||
    priceLabel === "Not in catalogue — diagnostic needed" ||
    lower(mondayMatch?.client_status).includes("corporate") ||
    lower(mondayMatch?.client_status).includes("warranty") ||
    (mondayMatch?.confidence ?? 0) < 0.85
  ) {
    return { tier: "yellow", emoji: "🟡", label: "Needs review" };
  }

  return { tier: "green", emoji: "🟢", label: "Ready to send" };
}

function resolvePriceLabel({ price, mondayMatch }) {
  if (mondayMatch?.confidence >= 0.85 && mondayMatch?.quote_amount) {
    return `£${Number(mondayMatch.quote_amount).toFixed(0)} (from repair)`;
  }
  if (mondayMatch?.confidence >= 0.85 && lower(mondayMatch?.status).includes("diagnostic")) {
    return "Quote pending — device in diagnostics";
  }
  if (price?.label) {
    return price.label;
  }
  return "Not in catalogue — diagnostic needed";
}

function buildCustomerTypeLabel(pastRepairs = []) {
  if (!pastRepairs.length) {
    return "🆕 New customer";
  }
  const oldest = [...pastRepairs]
    .map((repair) => repair.intake_date || repair.completion_date)
    .filter(Boolean)
    .sort()[0];
  const year = oldest ? String(oldest).slice(0, 4) : "unknown";
  return `🔁 Returning — ${pastRepairs.length} repairs since ${year}`;
}

function buildKbSources({ price, pastRepairs }) {
  const sources = [];
  if (price?.label) sources.push("pricing.json");
  if (pastRepairs.length) sources.push("repair_history Supabase");
  return sources;
}

function buildThreadSummary(messages) {
  if (messages.length <= 3) {
    return messages.map((message) => `${message.author_type === "admin" ? "Us" : message.author_name || "Customer"}: ${message.text.slice(0, 220)}`);
  }

  const first = messages[0]?.text || "";
  const lastCustomer = getLastCustomerMessage(messages)?.text || "";
  const lastAdmin = getLastAdminMessage(messages)?.text || "";
  return [
    `Thread summary: ${first.slice(0, 160)}`,
    lastAdmin ? `Last from us: ${lastAdmin.slice(0, 160)}` : "Last from us: none",
    `Latest customer: ${lastCustomer.slice(0, 220)}`
  ];
}

function formatLastRepairLines(lastRepair) {
  if (!lastRepair) {
    return ["No previous repair history."];
  }
  return [
    `Last repair: ${lastRepair.device_model || "Unknown device"} ${lastRepair.repair_type || "Unknown repair"}, ${String(lastRepair.completion_date || lastRepair.intake_date || "Unknown").slice(0, 7)}, ${lastRepair.repair_status || "Unknown"}`,
    `Any issues: ${lastRepair.was_warranty ? `Warranty claim on ${lastRepair.completion_date || lastRepair.intake_date || "unknown date"}` : "None"}`
  ];
}

function toPriorityLabel(priority) {
  if (priority === "High") return "P1";
  if (priority === "Medium") return "P2";
  return "P3";
}

function ageDays(createdAtSeconds) {
  if (!createdAtSeconds) {
    return 0;
  }
  return Math.max(0, Math.floor((Date.now() / 1000 - Number(createdAtSeconds)) / 86400));
}

function detectDeviceFromMessages(messages) {
  const haystack = messages.map((message) => message.text).join(" ");
  const match = haystack.match(
    /\b(iPhone\s+\d{1,2}(?:\s+(?:Pro|Plus|Mini|Max))?|iPad\s+[A-Za-z0-9" ]+|MacBook\s+[A-Za-z0-9" ]+)/i
  );
  return match ? match[1].trim() : null;
}

export function formatQuoteTelegramCard(card, draftText, stateLabel = null) {
  const confidenceLabel = `${card.confidence?.emoji || "🟡"} ${escapeHtml(card.confidence?.label || "Needs review")}`;
  const lines = [
    `<b>━━━ QUOTE CARD ━━━━━━━━━━━━━━━━━━━━━━━</b>`,
    `Type: ${escapeHtml(titleize(card.type || "quote building"))}`,
    `Channel: ${escapeHtml(titleize(card.channel || "email"))}`,
    `Device: ${escapeHtml(card.device || "N/A")}`,
    `Confidence: ${confidenceLabel}`,
    `Priority: ${escapeHtml(card.priority || "P2")}`,
    "",
    `<b>━ CUSTOMER ━</b>`,
    `Name: ${escapeHtml(card.customer_name || "Unknown")}`,
    `Email: ${escapeHtml(card.customer_email || "Unknown")}`,
    `Phone: ${escapeHtml(card.customer_phone || "Unknown")}`,
    `Monday: ${escapeHtml(card.context?.monday_item_label || card.context?.monday_item_id || "Unknown")}`,
    `Link: ${escapeHtml(card.context?.monday_url || "N/A")}`,
    "",
    `<b>━ DIAGNOSTIC FINDINGS ━</b>`,
    ...(card.diagnostic_findings?.length ? card.diagnostic_findings.map((line) => escapeHtml(`• ${line}`)) : ["No diagnostic notes found."]),
    "",
    `<b>━ QUOTE BREAKDOWN ━</b>`,
    ...(card.quote_breakdown?.length ? card.quote_breakdown.map((line) => escapeHtml(`• ${line}`)) : ["No structured quote breakdown available."]),
    "",
    `<b>━━ DRAFT QUOTE ━</b>`,
    escapeHtml(draftText || "Draft pending"),
    "",
    `<b>━━ SOURCE ━</b>`,
    `KB used: ${escapeHtml((card.context?.kb_used || []).join(", ") || "None")}`,
    `Historical quotes used: ${escapeHtml(String(card.context?.historical_quote_count || 0))}`,
    `Pricing: ${escapeHtml(card.context?.pricing_source || "Unknown")}`
  ];

  if (stateLabel) {
    lines.push("", `<b>${escapeHtml(stateLabel)}</b>`);
  }

  return lines.join("\n");
}

function formatPastRepairLines(pastRepairs = []) {
  if (!pastRepairs.length) {
    return ["No previous repairs found. New customer."];
  }

  return pastRepairs.map((repair) => {
    const amount = repair.quote_amount ? ` (£${Number(repair.quote_amount).toFixed(0)})` : "";
    const warning = repair.warranty_returns > 1 ? ` ⚠️ ${repair.warranty_returns} returns` : repair.was_warranty ? " ⚠️ warranty" : "";
    return escapeHtml(`${repair.completion_date || repair.intake_date || "Unknown date"}: ${repair.device_model || "Unknown device"} — ${repair.repair_type || "Unknown repair"}${amount} ✅ ${repair.repair_status || "Unknown"}${warning}`);
  });
}

function titleize(value) {
  return String(value || "")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
