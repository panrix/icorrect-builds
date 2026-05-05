function mergeRecheckState(primary, legacy) {
  const merged = { ...legacy, ...primary };
  for (const [orderId, legacyEntry] of Object.entries(legacy || {})) {
    const primaryEntry = primary?.[orderId];
    const primaryCount = Number(primaryEntry?.customerCount || primaryEntry?.messageCount || 0);
    const legacyCount = Number(legacyEntry?.customerCount || legacyEntry?.messageCount || 0);
    if (!primaryEntry || legacyCount > primaryCount) merged[orderId] = legacyEntry;
  }
  return merged;
}

function isCustomerBmMessage(message) {
  const author = String(message?.author || "").trim().toLowerCase();
  return author !== "merchant" && author !== "backmarket";
}

function getBmMessageBody(message) {
  return String(message?.body || message?.message || message?.content || "").trim();
}

function getBmMessageDate(message) {
  return String(message?.date || message?.created_at || message?.creation_date || "");
}

function getLatestCustomerMessage(messages) {
  return messages
    .filter(isCustomerBmMessage)
    .sort((a, b) => Date.parse(getBmMessageDate(b) || 0) - Date.parse(getBmMessageDate(a) || 0))[0] || null;
}

function getCustomerMessageKey(message) {
  if (!message) return "";
  const author = String(message.author || "unknown").trim().toLowerCase();
  const date = getBmMessageDate(message);
  const body = getBmMessageBody(message).replace(/\s+/g, " ").slice(0, 500);
  return [author, date, body].join("|");
}

module.exports = {
  getBmMessageBody,
  getBmMessageDate,
  getCustomerMessageKey,
  getLatestCustomerMessage,
  isCustomerBmMessage,
  mergeRecheckState,
};
