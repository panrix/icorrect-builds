import {
  claimConversationForSend,
  createSnooze,
  deleteSnooze,
  getConversation,
  insertEdit,
  markConversationIntercomSent,
  markConversationSendFailed,
  markConversationSent,
  updateConversationMondayItem,
  updateConversationAfterTelegramPost,
  updateConversationStatus
} from "./db.js";
import { formatTelegramCard } from "./triage.js";

export async function applyDraftEdit({ db, telegramClient }, { conversationId, editedText, reason = "" }) {
  const conversation = getConversation(db, conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  insertEdit(db, {
    conversationId,
    originalDraft: conversation.original_draft || conversation.draft_text || "",
    editedDraft: editedText,
    reason,
    category: conversation.category
  });
  updateConversationStatus(db, conversationId, "edited", { draftText: editedText });

  const latestConversation = getConversation(db, conversationId);
  if (latestConversation?.telegram_chat_id && latestConversation?.telegram_message_id) {
    try {
      await telegramClient.editCard({
        chatId: latestConversation.telegram_chat_id,
        messageId: latestConversation.telegram_message_id,
        text: formatTelegramCard(latestConversation.card_json, latestConversation.draft_text),
        conversationId,
        card: latestConversation.card_json
      });
    } catch (error) {
      console.error("Failed to update Telegram card after edit:", error);
    }
  }

  return latestConversation;
}

export async function handleTelegramCallback(
  { db, telegramClient, intercomClient, mondayClient, config },
  callbackQuery
) {
  const [action, conversationId, extra] = String(callbackQuery.data || "").split(":");
  if (!action || !conversationId) {
    await telegramClient.answerCallbackQuery(callbackQuery.id, "Invalid action");
    return;
  }

  const conversation = getConversation(db, conversationId);
  if (!conversation) {
    await telegramClient.answerCallbackQuery(callbackQuery.id, "Conversation not found");
    return;
  }

  if (action === "approve" || action === "send") {
    await handleApprove({ db, telegramClient, intercomClient, mondayClient, config }, callbackQuery, conversation);
    return;
  }

  if (action === "escalate") {
    await telegramClient.sendMessage({
      chat_id: callbackQuery.message.chat.id,
      message_thread_id: callbackQuery.message.message_thread_id,
      text: "Choose escalation target:",
      reply_markup: {
        inline_keyboard: [[
          { text: "Ferrari", callback_data: `escalate_target:${conversationId}:ferrari` },
          { text: "Ricky", callback_data: `escalate_target:${conversationId}:ricky` }
        ]]
      }
    });
    await telegramClient.answerCallbackQuery(callbackQuery.id, "Pick target");
    return;
  }

  if (action === "escalate_target") {
    await handleEscalation({ db, telegramClient, intercomClient, config }, callbackQuery, conversation, extra || "ferrari");
    return;
  }

  if (action === "snooze") {
    await telegramClient.sendMessage({
      chat_id: callbackQuery.message.chat.id,
      message_thread_id: callbackQuery.message.message_thread_id,
      text: "Snooze for how long?",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "2h", callback_data: `snooze_until:${conversationId}:2h` },
            { text: "Tomorrow 08:00", callback_data: `snooze_until:${conversationId}:tomorrow` }
          ],
          [
            { text: "6h", callback_data: `snooze_until:${conversationId}:6h` },
            { text: "12h", callback_data: `snooze_until:${conversationId}:12h` },
            { text: "24h", callback_data: `snooze_until:${conversationId}:24h` }
          ],
          [
            { text: "48h", callback_data: `snooze_until:${conversationId}:48h` },
            { text: "Tomorrow 09:00", callback_data: `snooze_until:${conversationId}:tomorrow9` }
          ]
        ]
      }
    });
    await telegramClient.answerCallbackQuery(callbackQuery.id, "Choose snooze time");
    return;
  }

  if (action === "snooze_until") {
    await handleSnooze({ db, telegramClient }, callbackQuery, conversation, extra || "2h");
    return;
  }

  await telegramClient.answerCallbackQuery(callbackQuery.id, "Invalid action");
}

async function handleApprove({ db, telegramClient, intercomClient, mondayClient, config }, callbackQuery, conversation) {
  if (conversation.status === "sent") {
    await telegramClient.answerCallbackQuery(callbackQuery.id, "Already handled");
    return;
  }

  const claimedConversation = claimConversationForSend(db, conversation.id);
  if (!claimedConversation) {
    const latestConversation = getConversation(db, conversation.id);
    const message = latestConversation?.status === "sending" ? "Already being sent" : "Already handled";
    await telegramClient.answerCallbackQuery(callbackQuery.id, message);
    return;
  }

  try {
    if (!claimedConversation.intercom_sent_at) {
      await intercomClient.sendReply(conversation.id, claimedConversation.draft_text);
      markConversationIntercomSent(db, conversation.id);
    }

    const refreshedConversation = getConversation(db, conversation.id);
    await applyMondaySideEffects({ db, intercomClient, mondayClient, config }, refreshedConversation);
    markConversationSent(db, conversation.id, new Date().toISOString());

    const latestConversation = getConversation(db, conversation.id);
    await telegramClient.editCardStatus({
      chatId: callbackQuery.message.chat.id,
      messageId: callbackQuery.message.message_id,
      text: formatTelegramCard(latestConversation.card_json, latestConversation.draft_text, "✅ Sent")
    });
    await telegramClient.answerCallbackQuery(callbackQuery.id, "Sent");
  } catch (error) {
    const latestConversation = getConversation(db, conversation.id);
    const alreadySentToIntercom = Boolean(latestConversation?.intercom_sent_at);
    const nextStatus = alreadySentToIntercom ? "sync_failed" : "edited";
    const stateLabel = alreadySentToIntercom
      ? "⚠️ Reply sent to Intercom. Monday sync failed. Retry Approve to finish sync."
      : "⚠️ Send failed. Retry Approve.";

    markConversationSendFailed(db, conversation.id, nextStatus, error instanceof Error ? error.message : String(error));
    await telegramClient.editCard({
      chatId: callbackQuery.message.chat.id,
      messageId: callbackQuery.message.message_id,
      text: formatTelegramCard(latestConversation.card_json, latestConversation.draft_text, stateLabel),
      conversationId: conversation.id,
      card: latestConversation.card_json
    });
    await telegramClient.answerCallbackQuery(callbackQuery.id, alreadySentToIntercom ? "Reply sent, sync failed" : "Send failed");
    console.error("Send failed:", error);
  }
}

async function handleEscalation({ db, telegramClient, intercomClient, config }, callbackQuery, conversation, target) {
  const isRicky = target === "ricky";
  const targetLabel = isRicky ? "Ricky" : "Ferrari";
  const tagName = isRicky ? "needs_ricky_escalation" : "needs_ferrari_review";
  const fallbackId = isRicky ? config.intercom.needsRickyTagId : config.intercom.needsFerrariTagId;
  const note = `Escalated from Telegram triage card to ${targetLabel}.\n\nCategory: ${conversation.category}\nPriority: ${conversation.priority}\nLatest message: ${conversation.card_json?.latest_message || "n/a"}`;

  await intercomClient.addNote(conversation.id, note);
  await intercomClient.addTagByName(conversation.id, tagName, fallbackId);

  if (isRicky) {
    await telegramClient.sendMessage({
      chat_id: config.telegram.rickyChatId,
      text: [
        `⚠️ Alex triage escalation for Ricky`,
        `Conversation: ${conversation.id}`,
        `Customer: ${conversation.customer_name || "Unknown"}`,
        `Category: ${conversation.category}`,
        `Priority: ${conversation.priority}`,
        `Intercom: ${conversation.card_json?.context?.intercom_url || "n/a"}`
      ].join("\n")
    });
  }

  updateConversationStatus(db, conversation.id, "escalated");
  await telegramClient.editCard({
    chatId: callbackQuery.message.chat.id,
    messageId: callbackQuery.message.message_id,
    text: formatTelegramCard(conversation.card_json, conversation.draft_text, `⚠️ Escalated to ${targetLabel}`),
    conversationId: conversation.id,
    card: conversation.card_json
  });
  await telegramClient.answerCallbackQuery(callbackQuery.id, `Escalated to ${targetLabel}`);
}

async function handleSnooze({ db, telegramClient }, callbackQuery, conversation, kind) {
  const untilAt = computeSnoozeUntil(kind);
  const reason = kind === "custom" ? "Custom snooze placeholder set to +24h" : `Snoozed ${kind}`;
  createSnooze(db, {
    conversationId: conversation.id,
    untilAt: untilAt.toISOString(),
    reason,
    originalMessageId: String(callbackQuery.message.message_id),
    originalChatId: String(callbackQuery.message.chat.id),
    originalThreadId: callbackQuery.message.message_thread_id ? String(callbackQuery.message.message_thread_id) : null
  });
  updateConversationStatus(db, conversation.id, "snoozed");
  await telegramClient.deleteMessage(callbackQuery.message.chat.id, callbackQuery.message.message_id);
  await telegramClient.answerCallbackQuery(callbackQuery.id, `Snoozed until ${untilAt.toISOString().slice(0, 16)} UTC`);
}

function computeSnoozeUntil(kind) {
  const now = new Date();
  const hoursMatch = String(kind).match(/^(\d+)h$/);
  if (hoursMatch) {
    return new Date(now.getTime() + Number(hoursMatch[1]) * 3600 * 1000);
  }
  if (kind === "tomorrow") {
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(8, 0, 0, 0);
    return tomorrow;
  }
  if (kind === "tomorrow9") {
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(9, 0, 0, 0);
    return tomorrow;
  }
  return new Date(now.getTime() + 24 * 3600 * 1000);
}

export async function repostDueSnoozes({ db, telegramClient, dueSnoozes }) {
  for (const snooze of dueSnoozes) {
    const conversation = getConversation(db, snooze.conversation_id);
    if (!conversation) {
      deleteSnooze(db, snooze.conversation_id);
      continue;
    }
    const sent = await telegramClient.sendEmailTriageCard({
      text: formatTelegramCard(conversation.card_json, conversation.draft_text, "💤 Snooze expired"),
      conversationId: conversation.id,
      card: conversation.card_json
    });
    updateConversationStatus(db, conversation.id, "pending");
    deleteSnooze(db, conversation.id);
    if (sent?.result?.message_id) {
      updateConversationAfterTelegramPost(db, conversation.id, {
        telegramMessageId: String(sent.result.message_id),
        telegramChatId: String(sent.result.chat?.id || ""),
        telegramThreadId: sent.result.message_thread_id ? String(sent.result.message_thread_id) : null
      });
    }
  }
}

export async function applyMondaySideEffects({ db, intercomClient, mondayClient, config }, conversation) {
  const card = conversation.card_json;
  const intercomLink = card.context?.intercom_url || null;
  let mondayItemId = conversation.monday_item_id;

  if (!mondayItemId && conversation.category === "new_enquiry") {
    mondayItemId = await mondayClient.createItem({
      customerName: conversation.customer_name,
      customerEmail: conversation.customer_email,
      clientStatus: card.client_status === "No active repair found on Monday." ? "End User" : card.client_status,
      paymentStatus: card.payment,
      intercomId: conversation.id,
      intercomLink
    });
    if (mondayItemId) {
      updateConversationMondayItem(db, conversation.id, mondayItemId);
    }
  }

  if (mondayItemId) {
    await mondayClient.addUpdate(
      mondayItemId,
      `Intercom reply sent for conversation ${conversation.id}. Draft used:\n\n${conversation.draft_text}`
    );
  }

  if (requiresFerrariContext(conversation)) {
    await intercomClient.addNote(
      conversation.id,
      "Ferrari-reviewed case sent from Telegram. Keep Ferrari visibility on this case."
    );
    if (config.intercom.needsFerrariTagId) {
      await intercomClient.addTag(conversation.id, config.intercom.needsFerrariTagId);
    }
  }
}

function requiresFerrariContext(conversation) {
  const card = conversation.card_json || {};
  const combinedText = [conversation.category, card.latest_message, card.what_matters]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    conversation.category === "complaint" ||
    conversation.category === "bm_email" ||
    combinedText.includes("warranty")
  );
}
