import fs from "node:fs";
import path from "node:path";
import { getConfig } from "../lib/config.js";
import {
  completeRun,
  getCheckpoint,
  getConversation,
  LAST_SUCCESSFUL_CHECKPOINT_KEY,
  openDb,
  setCheckpoint,
  startRun,
  updateConversationAfterTelegramPost,
  updateConversationIntercomActivity,
  updateConversationStatus,
  upsertConversation,
  writeJson
} from "../lib/db.js";
import { buildFallbackDraft, DraftClient, isReviewableDraft } from "../lib/draft.js";
import { IntercomClient } from "../lib/intercom.js";
import { MondayClient } from "../lib/monday.js";
import { TelegramClient } from "../lib/telegram.js";
import {
  computeEmailTriageWindowStart,
  detectDeviceFromMessages,
  evaluateEmailTriageCandidate,
  extractConversationCustomer,
  extractDeviceForPricing,
  extractRepairType,
  formatRecentMessages,
  formatTelegramCard,
  flattenMessages
} from "../lib/triage.js";
import { lookupRepairHistory } from "../lib/repair-history.js";
import { buildConversationCard } from "./card-builder.js";
import { enrichConversationV2 } from "./monday-enrich-v2.js";
import { findPrice, loadPricingIndex } from "./shopify-pricing.js";

function parseArgs(argv) {
  const args = { mode: "morning", dryRun: false, limit: null };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value.startsWith("--mode=")) {
      args.mode = value.slice("--mode=".length);
    }
    if (value === "--dry-run") {
      args.dryRun = true;
    }
    if (value.startsWith("--limit=")) {
      args.limit = Number(value.slice("--limit=".length));
    }
  }
  return args;
}

function buildFerrariContext(config) {
  const sourceFiles = [
    "/home/ricky/.openclaw/agents/alex-cs/workspace/docs/reply-templates.md",
    "/home/ricky/.openclaw/agents/alex-cs/workspace/knowledge/ferrari-writing-library.md"
  ];

  const sections = sourceFiles
    .filter((filePath) => fs.existsSync(filePath))
    .map((filePath) => {
      const content = fs.readFileSync(filePath, "utf8").trim();
      return `# Source: ${filePath}\n\n${content}`;
    });

  fs.mkdirSync(path.dirname(config.ferrariContextPath), { recursive: true });
  fs.writeFileSync(config.ferrariContextPath, sections.join("\n\n"), "utf8");
}

function isNewerThanCheckpoint(conversation, checkpointIso) {
  if (!checkpointIso) {
    return true;
  }

  const checkpoint = Date.parse(checkpointIso);
  const updatedAt = Number(conversation.updated_at || conversation.updatedAt || 0) * 1000;
  return updatedAt > checkpoint;
}

async function main() {
  const args = parseArgs(process.argv);
  const config = getConfig();
  buildFerrariContext(config);

  const db = openDb();
  const runId = startRun(db, args.mode);

  try {
    const intercomClient = new IntercomClient(config.intercom);
    const mondayClient = new MondayClient(config.monday);
    const draftClient = new DraftClient(config.openrouter);
    const telegramClient = new TelegramClient(config.telegram);
    const pricingIndex = loadPricingIndex(config.pricingPath);
    const checkpointKey =
      args.mode === "check" ? LAST_SUCCESSFUL_CHECKPOINT_KEY : "last_successful_morning_at";
    const checkpoint = getCheckpoint(db, checkpointKey);
    const updatedSince = computeEmailTriageWindowStart({ checkpointIso: checkpoint });

    const summaries = await intercomClient.listOpenConversations({
      updatedSince,
      maxItems: Number.isFinite(args.limit) && args.limit > 0 ? args.limit : null
    });
    const eligible = summaries.filter((conversation) =>
      args.mode === "check" ? isNewerThanCheckpoint(conversation, checkpoint) : true
    );
    const limited =
      Number.isFinite(args.limit) && args.limit > 0 ? eligible.slice(0, args.limit) : eligible;

    const actionable = [];
    let postedCount = 0;

    if (!args.dryRun && !config.service.enableLivePosting) {
      console.warn("Live Telegram posting disabled: set ALEX_ENABLE_LIVE_POSTING=1 for controlled live restart.");
    }

    for (const summary of limited) {
      const conversation = await intercomClient.getConversation(summary.id);
      const messages = flattenMessages(conversation);
      const existing = getConversation(db, String(conversation.id));
      const decision = evaluateEmailTriageCandidate({
        conversation,
        messages,
        checkpointIso: args.mode === "check" ? checkpoint : null,
        existingConversation: existing
      });
      if (!decision.include) {
        const excludeSender = conversation.source?.author?.email || "unknown";
        const excludeSubject = (conversation.source?.subject || conversation.title || "").slice(0, 50);

        if (decision.reason === "flag_new_activity" && existing?.card_json) {
          const intercomTs = decision.intercomUpdatedAtMs || Date.now();
          // If any admin has ever replied in this conversation, it's being
          // actively handled in Intercom. Don't re-surface it in triage.
          const adminHasEngaged = messages.some((m) => m.author_type === "admin");
          if (adminHasEngaged) {
            console.log(`[excluded] ${conversation.id} reason=admin_engaged sender=${excludeSender} subject=${excludeSubject}`);
            updateConversationIntercomActivity(db, String(conversation.id), intercomTs);
            continue;
          }
          console.log(`[new_activity] ${conversation.id} sender=${excludeSender} subject=${excludeSubject}`);
          if (!args.dryRun && config.service.enableLivePosting) {
            const telegramText = formatTelegramCard(existing.card_json, existing.draft_text, "💬 Customer replied");
            const sentMessage = await telegramClient.sendEmailTriageCard({
              text: telegramText,
              conversationId: conversation.id,
              card: existing.card_json
            });
            if (sentMessage?.result?.message_id) {
              updateConversationAfterTelegramPost(db, String(conversation.id), {
                telegramMessageId: String(sentMessage.result.message_id),
                telegramChatId: String(sentMessage.result?.chat?.id || config.telegram.chatId),
                telegramThreadId: sentMessage.result?.message_thread_id
                  ? String(sentMessage.result.message_thread_id)
                  : null
              });
              updateConversationIntercomActivity(db, String(conversation.id), intercomTs);
              updateConversationStatus(db, String(conversation.id), "pending");
              postedCount += 1;
            }
          }
        } else {
          console.log(`[excluded] ${conversation.id} reason=${decision.reason} sender=${excludeSender} subject=${excludeSubject}`);
        }
        continue;
      }

      const extractedCustomer = extractConversationCustomer(conversation);
      const customerEmail = extractedCustomer.email;
      const customerName = extractedCustomer.name;
      const customerPhone = extractedCustomer.phone;
      const deviceHint = messages.map((message) => message.text).join(" ").slice(0, 1000);
      const mondayMatchResult = await enrichConversationV2({
        mondayClient,
        customerEmail,
        customerPhone,
        customerName,
        conversationId: conversation.id,
        deviceHint
      });
      const mondayMatch = mondayMatchResult.best_match;
      let pastRepairs = [];
      try {
        pastRepairs = await lookupRepairHistory({
          config,
          email: customerEmail,
          phone: customerPhone,
          limit: 5
        });
      } catch (error) {
        console.error(`Repair history lookup failed for conversation ${conversation.id}:`, error);
      }
      const inferredDevice = extractDeviceForPricing(conversation, messages, mondayMatch) || detectDeviceFromMessages(messages);
      const inferredRepairType = extractRepairType(conversation, messages, mondayMatch);
      const price = findPrice(
        pricingIndex,
        mondayMatch?.device_model || inferredDevice,
        mondayMatch?.repair_type || inferredRepairType
      );
      const { card, category, priority, messages: builtMessages } = buildConversationCard({
        conversation,
        mondayMatch,
        mondayAlternatives: mondayMatchResult.alternatives,
        pastRepairs,
        price,
        workspaceId: config.intercom.workspaceId
      });
      const recentMessages = formatRecentMessages(builtMessages);
      let draftText;
      try {
        draftText = await draftClient.draftReply({
          ferrariContextPath: config.ferrariContextPath,
          learnedRulesPath: config.learnedRulesPath,
          card,
          recentMessages
        });
        if (!isReviewableDraft(draftText)) {
          draftText = buildFallbackDraft(card);
        }
      } catch (error) {
        console.error(
          `Draft generation failed for conversation ${conversation.id}, using fallback draft:`,
          error
        );
        draftText = buildFallbackDraft(card);
      }

      draftText = draftText.trim();

      const alreadyPosted = existing && existing.telegram_message_id;
      const alreadyHandled = alreadyPosted && ["sent", "skipped", "sending"].includes(existing.status);

      upsertConversation(db, {
        id: String(conversation.id),
        customerName: card.customer_name,
        customerEmail: card.customer_email,
        category,
        priority,
        mondayItemId: mondayMatch?.id || null,
        card,
        draftText: alreadyHandled ? existing.draft_text : draftText,
        originalDraft: draftText,
        status: alreadyHandled ? existing.status : "pending",
        runType: args.mode
      });

      if (alreadyPosted) {
        continue;
      }

      if (card.card_kind === "quote") {
        continue;
      }

      const telegramText = formatTelegramCard(card, draftText);
      if (!args.dryRun && config.service.enableLivePosting) {
        const sentMessage = await telegramClient.sendEmailTriageCard({
          text: telegramText,
          conversationId: conversation.id,
          card
        });

        if (!sentMessage?.result?.message_id) {
          throw new Error(`Telegram card post for conversation ${conversation.id} did not return a message_id`);
        }

        updateConversationAfterTelegramPost(db, String(conversation.id), {
          telegramMessageId: String(sentMessage.result.message_id),
          telegramChatId: String(sentMessage.result?.chat?.id || config.telegram.chatId),
          telegramThreadId: sentMessage.result?.message_thread_id ? String(sentMessage.result.message_thread_id) : null
        });
        postedCount += 1;
      }

      actionable.push({
        id: conversation.id,
        category,
        priority,
        monday_item_id: mondayMatch?.id || null,
        card
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    writeJson(path.join(config.triageOutputDir, `triage-${today}.json`), actionable);
    if (!args.dryRun && config.service.enableLivePosting) {
      setCheckpoint(db, checkpointKey, new Date().toISOString());
      console.log(`Posted ${postedCount} email triage card(s); checkpoint ${checkpointKey} advanced.`);
    }

    completeRun(db, runId, {
      conversationsFound: summaries.length,
      conversationsActionable: actionable.length,
      status: "completed"
    });
  } catch (error) {
    completeRun(db, runId, {
      status: "failed",
      errorText: error instanceof Error ? error.message : String(error)
    });
    throw error;
  } finally {
    db.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
