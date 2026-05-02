const express = require("express");
const fs = require("fs");
const path = require("path");
const { getAppleSpecsWithRetry } = require("./apple-specs");
const { mapColour } = require("./lib/colour-map");
const { mapGrade } = require("./lib/grade-map");
const { calculateProfitability, formatBreakdown } = require("./lib/profitability");
const { findActiveListings, findOfflineListings, findAnyListings, findListingsBySpecs } = require("./lib/bm-listings-cache");
const counterOffer = require("./lib/counter-offer");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Slack sends form-encoded payloads

const PORT = process.env.PORT || 8010;
const SICKW_API_KEY = process.env.SICKW_API_KEY;
const MONDAY_APP_TOKEN = process.env.MONDAY_APP_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_AUTOMATIONS_TOKEN = process.env.SLACK_AUTOMATIONS_BOT_TOKEN;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const BOARD_ID = 349212843;
const SERIAL_COLUMN = "text4";
const STATUS_COLUMN = "status24";
const BM_TRADEIN_ID_COLUMN = "text_mky01vb4";
const ICLOUD_LOCKED_GROUP = "group_mktsw34v";
const TODAYS_REPAIRS_GROUP = "new_group70029";
const SLACK_CHANNEL = "C09VB5G7CTU"; // #bm-trade-in-checks

const BM_BOARD_ID = 3892194968;
const BM_LISTING_ID_COLUMN = "text_mkyd4bx3";
const BM_LISTING_UUID_COLUMN = "text_mm1dt53s";
// BM_SALES_ORDER_COLUMN defined below in shipping section (text_mkye7p1c)
const LISTINGS_CACHE_PATH = "/home/ricky/builds/icloud-checker/data/bm-listings-clean.json";
const BM_LISTINGS_SLACK_CHANNEL = "C09VB5G7CTU"; // #bm-trade-in-checks (same channel for now)
const BM_RAM_COLUMN = "status__1";
const BM_SSD_COLUMN = "color2";
const BM_CPU_COLUMN = "status7__1";
const BM_GPU_COLUMN = "status8__1";
const COLOUR_COLUMN = "status8";
const BM_BOARD_RELATION = "board_relation5";

// --- Shipping confirmation webhook constants ---
const STATUS4_COLUMN = "status4";
const TRACKING_COLUMN = "text53"; // Outbound Tracking on Main Board (349212843)
const DISPATCH_SLACK_CHANNEL = "C024H7518J3"; // #dispatch Slack channel (same as dispatch.js)
const BM_SALES_ORDER_COLUMN = "text_mkye7p1c"; // BM sales order ID on BM Devices Board
const BM_SALES_API_BASE = "https://www.backmarket.co.uk/ws/orders";

const RECHECK_INTERVAL_MS = 30 * 60 * 1000;
const STATE_FILE = path.join(__dirname, "..", "recheck-state.json");

const BM_API_BASE = "https://www.backmarket.co.uk/ws/buyback/v1/orders";
const BM_API_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "Accept-Language": "en-gb",
  Authorization: process.env.BM_AUTH,
  "User-Agent": "BM-iCorrect-n8n;ricky@icorrect.co.uk",
};

const BM_MSG_ICLOUD_ON = "Thank you for your message. Unfortunately, your iCloud account is still linked to the MacBook – could you please double-check that the device is no longer showing in the Find My menu on your iCloud.com account? Guide: https://support.apple.com/en-gb/guide/icloud/mmfc0eeddd/icloud. It's also possible that a previous user's Apple ID is still linked.";
const BM_MSG_ICLOUD_OFF = "Thank you! We've confirmed your iCloud lock has been removed. Your trade-in will be processed within the next 24 hours.";

// Keywords that suggest the customer has removed iCloud
const RECHECK_KEYWORDS = [
  "removed", "remove", "done", "unlocked", "unlock", "disabled", "disable",
  "signed out", "sign out", "logged out", "log out", "turned off", "turn off",
  "find my", "findmy", "icloud", "completed", "fixed", "resolved",
];

// --- State management ---

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch { return {}; }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function hasRecheckKeyword(text) {
  const lower = text.toLowerCase();
  return RECHECK_KEYWORDS.some((kw) => lower.includes(kw));
}

// --- Monday.com API ---

async function mondayQuery(query) {
  const resp = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: MONDAY_APP_TOKEN },
    body: JSON.stringify({ query }),
  });
  return resp.json();
}

async function getItemFromMonday(itemId) {
  const query = `{ items(ids: [${itemId}]) { column_values(ids: ["${SERIAL_COLUMN}", "status", "${BM_TRADEIN_ID_COLUMN}"]) { id text } } }`;
  const data = await mondayQuery(query);
  const cols = data?.data?.items?.[0]?.column_values || [];
  return {
    serial: cols.find((c) => c.id === SERIAL_COLUMN)?.text?.trim() || "",
    clientType: cols.find((c) => c.id === "status")?.text?.trim() || "",
    bmTradeInId: cols.find((c) => c.id === BM_TRADEIN_ID_COLUMN)?.text?.trim() || "",
  };
}

async function getLockedGroupItems() {
  const query = `{ boards(ids: [${BOARD_ID}]) { groups(ids: ["${ICLOUD_LOCKED_GROUP}"]) { items_page(limit: 500) { items { id name column_values(ids: ["${SERIAL_COLUMN}", "${BM_TRADEIN_ID_COLUMN}"]) { id text } } } } } }`;
  const data = await mondayQuery(query);
  const items = data?.data?.boards?.[0]?.groups?.[0]?.items_page?.items || [];
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    serial: item.column_values?.find((c) => c.id === SERIAL_COLUMN)?.text?.trim() || "",
    bmTradeInId: item.column_values?.find((c) => c.id === BM_TRADEIN_ID_COLUMN)?.text?.trim() || "",
  }));
}

async function updateMondayStatus(itemId, label) {
  const columnValues = JSON.stringify({ [STATUS_COLUMN]: { label } }).replace(/"/g, '\\"');
  await mondayQuery(`mutation { change_multiple_column_values( board_id: ${BOARD_ID}, item_id: ${itemId}, column_values: "${columnValues}" ) { id } }`);
}

async function postMondayComment(itemId, body) {
  const escaped = body.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  await mondayQuery(`mutation { create_update( item_id: ${itemId}, body: "${escaped}" ) { id } }`);
}

async function moveItemToGroup(itemId, groupId) {
  await mondayQuery(`mutation { move_item_to_group( item_id: ${itemId}, group_id: "${groupId}" ) { id } }`);
}

async function getBmClaimedSpecs(mainItemId) {
  // First get the linked BM board item ID
  const linkQuery = `{ items(ids: [${mainItemId}]) { column_values(ids: ["${BM_BOARD_RELATION}"]) { id ... on BoardRelationValue { linked_item_ids } } } }`;
  const linkData = await mondayQuery(linkQuery);
  const linkCol = linkData?.data?.items?.[0]?.column_values?.[0];
  const bmItemId = linkCol?.linked_item_ids?.[0] || null;
  if (!bmItemId) return null;

  // Get the specs from BM board
  const specsQuery = `{ items(ids: [${bmItemId}]) { column_values(ids: ["${BM_RAM_COLUMN}", "${BM_SSD_COLUMN}", "${BM_CPU_COLUMN}", "${BM_GPU_COLUMN}"]) { id text } } }`;
  const specsData = await mondayQuery(specsQuery);
  const cols = specsData?.data?.items?.[0]?.column_values || [];

  // Also get colour from main board
  const colourQuery = `{ items(ids: [${mainItemId}]) { column_values(ids: ["${COLOUR_COLUMN}"]) { id text } } }`;
  const colourData = await mondayQuery(colourQuery);
  const colourCol = colourData?.data?.items?.[0]?.column_values?.[0];

  return {
    ram: cols.find(c => c.id === BM_RAM_COLUMN)?.text?.trim() || "",
    ssd: cols.find(c => c.id === BM_SSD_COLUMN)?.text?.trim() || "",
    cpu: cols.find(c => c.id === BM_CPU_COLUMN)?.text?.trim() || "",
    gpu: cols.find(c => c.id === BM_GPU_COLUMN)?.text?.trim() || "",
    colour: colourCol?.text?.trim() || "",
  };
}

async function updateMainBoardColour(itemId, colour) {
  if (!colour) return;
  const columnValues = JSON.stringify({ [COLOUR_COLUMN]: colour }).replace(/"/g, '\\"');
  await mondayQuery(`mutation { change_multiple_column_values( board_id: ${BOARD_ID}, item_id: ${itemId}, column_values: "${columnValues}" ) { id } }`);
}

// Normalize colour strings: "Space Grey" / "SpaceGray" / "Space Gray" → "spacegrey"
function normalizeColour(colour) {
  if (!colour) return "";
  return colour.toLowerCase().replace(/\s+/g, "").replace(/gray/g, "grey");
}

function compareSpecs(appleSpecs, claimedSpecs) {
  if (!appleSpecs || !claimedSpecs) return [];
  const mismatches = [];
  const comparisons = [
    { field: "RAM", apple: appleSpecs.memory, claimed: claimedSpecs.ram },
    { field: "SSD", apple: appleSpecs.storage, claimed: claimedSpecs.ssd },
    { field: "CPU", apple: appleSpecs.cpu, claimed: claimedSpecs.cpu },
    { field: "GPU", apple: appleSpecs.gpu, claimed: claimedSpecs.gpu },
  ];
  for (const c of comparisons) {
    if (!c.apple || !c.claimed) continue;
    // Normalize for comparison (remove spaces, lowercase)
    const a = c.apple.toLowerCase().replace(/\s/g, "");
    const b = c.claimed.toLowerCase().replace(/\s/g, "");
    if (a !== b && !a.includes(b) && !b.includes(a)) {
      mismatches.push(`⚠️ ${c.field}: Apple says ${c.apple}, BM says ${c.claimed}`);
    }
  }

  // Compare colour separately with normalization
  if (appleSpecs.color && claimedSpecs.colour) {
    const ac = normalizeColour(appleSpecs.color);
    const cc = normalizeColour(claimedSpecs.colour);
    if (ac && cc && ac !== cc && !ac.includes(cc) && !cc.includes(ac)) {
      mismatches.push(`⚠️ Colour: Apple says ${appleSpecs.color}, BM says ${claimedSpecs.colour}`);
    }
  }

  return mismatches;
}

// --- SickW API ---

async function checkSickW(serial) {
  const url = `https://sickw.com/api.php?imei=${encodeURIComponent(serial)}&service=30&format=json&key=${encodeURIComponent(SICKW_API_KEY)}`;
  const resp = await fetch(url);
  if (!resp.ok) return { success: false, error: `HTTP ${resp.status}` };
  const data = await resp.json();
  if (data.status !== "success") return { success: false, error: data.status || "Unknown SickW error" };
  const html = data.result || "";
  const icloudMatch = html.match(/iCloud Lock:.*?>(ON|OFF)<\//i) || html.match(/iCloud Lock:\s*(ON|OFF)/i);
  const icloudLock = icloudMatch ? icloudMatch[1].toUpperCase() : undefined;
  if (!icloudLock) return { success: false, error: "Could not parse iCloud status from response" };
  const modelMatch = html.match(/Model:\s*([^<\n]+)/i);
  return { success: true, icloudLock, model: modelMatch ? modelMatch[1].trim() : undefined };
}

// --- BackMarket API ---

async function getBmOrderStatus(orderPublicId) {
  const resp = await fetch(`${BM_API_BASE}/${orderPublicId}`, { headers: BM_API_HEADERS });
  if (!resp.ok) return { success: false, error: `HTTP ${resp.status}` };
  const data = await resp.json();
  return { success: true, status: data.status || "UNKNOWN" };
}

async function suspendBmOrder(orderPublicId) {
  const resp = await fetch(`${BM_API_BASE}/${orderPublicId}/suspend`, {
    method: "PUT",
    headers: BM_API_HEADERS,
    body: JSON.stringify({ reasons: ["customer_account_present"] })
  });
  if (!resp.ok) return { success: false, error: `HTTP ${resp.status}` };
  const data = await resp.json();
  return { success: true, status: data.status || "UNKNOWN" };
}

async function getBmMessages(orderPublicId) {
  const resp = await fetch(`${BM_API_BASE}/${orderPublicId}/messages`, { headers: BM_API_HEADERS });
  if (!resp.ok) return { success: false, error: `HTTP ${resp.status}` };
  const data = await resp.json();
  return { success: true, messages: Array.isArray(data) ? data : data.messages || data.results || [] };
}

async function sendBmMessage(orderPublicId, message) {
  const resp = await fetch(`${BM_API_BASE}/${orderPublicId}/messages`, {
    method: "POST",
    headers: BM_API_HEADERS,
    body: JSON.stringify({ message, files: [] }),
  });
  if (!resp.ok) return { success: false, error: `HTTP ${resp.status}` };
  return { success: true };
}

// --- Slack API ---

async function slackPost(method, body) {
  const resp = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
    body: JSON.stringify(body),
  });
  return resp.json();
}

async function sendSlackAlert(message) {
  if (SLACK_BOT_TOKEN) {
    await slackPost("chat.postMessage", { channel: SLACK_CHANNEL, text: message });
  } else if (SLACK_WEBHOOK_URL) {
    await fetch(SLACK_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: message }) });
  }
}

async function slackPostAutomations(method, body) {
  const resp = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SLACK_AUTOMATIONS_TOKEN}` },
    body: JSON.stringify(body),
  });
  return resp.json();
}

async function sendSlackCustomerReplyAlert(item, customerMessage) {
  const blocks = [
    {
      type: "section",
      text: { type: "mrkdwn", text: `📩 *Customer replied — ${item.name}*\nSerial: \`${item.serial}\`` },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `> ${customerMessage.slice(0, 500)}` },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "🔄 Recheck iCloud" },
          style: "primary",
          action_id: "recheck_icloud",
          value: JSON.stringify({ itemId: item.id, itemName: item.name, serial: item.serial, bmTradeInId: item.bmTradeInId }),
        },
        {
          type: "button",
          text: { type: "plain_text", text: "💬 Reply to Customer" },
          action_id: "reply_customer",
          value: JSON.stringify({ itemId: item.id, itemName: item.name, bmTradeInId: item.bmTradeInId }),
        },
      ],
    },
  ];

  await slackPostAutomations("chat.postMessage", {
    channel: SLACK_CHANNEL,
    text: `📩 Customer replied — ${item.name}: "${customerMessage.slice(0, 100)}"`,
    blocks,
  });
}

// --- iCloud locked dedup: prevent repeated alerts for same item ---
const _icloudAlertCache = new Map(); // itemId -> timestamp
const ICLOUD_ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours

// --- iCloud ON handler: suspend BM + move to locked group ---

async function handleIcloudLocked(itemId, itemName, serial, model, bmTradeInId) {
  // Dedup: skip if we already alerted for this item recently
  const lastAlert = _icloudAlertCache.get(String(itemId));
  if (lastAlert && Date.now() - lastAlert < ICLOUD_ALERT_COOLDOWN_MS) {
    console.log(`${itemName}: iCloud locked alert suppressed (cooldown, last: ${new Date(lastAlert).toISOString()})`);
    return;
  }
  _icloudAlertCache.set(String(itemId), Date.now());

  const parts = [`🔒 iCloud LOCKED — ${itemName}`];

  if (!bmTradeInId) {
    parts.push("", "⚠️ No BM Trade-in ID found — cannot suspend on BackMarket");
    const msg = parts.filter(Boolean).join("\n");
    await postMondayComment(itemId, msg);
    await sendSlackAlert(msg);
    await moveItemToGroup(itemId, ICLOUD_LOCKED_GROUP);
    return;
  }

  const bmStatus = await getBmOrderStatus(bmTradeInId);

  if (!bmStatus.success) {
    parts.push("", `⚠️ Could not check BM order status: ${bmStatus.error}`);
  } else if (bmStatus.status === "SUSPENDED") {
    parts.push("", "ℹ️ BM order already suspended");
  } else if (["SENT", "RECEIVED", "TO_SEND"].includes(bmStatus.status)) {
    const suspendResult = await suspendBmOrder(bmTradeInId);
    parts.push("", suspendResult.success ? `✅ BM order suspended (was: ${bmStatus.status})` : `❌ Failed to suspend: ${suspendResult.error}`);
  } else {
    parts.push("", `⚠️ Cannot suspend — BM status is ${bmStatus.status}`);
  }

  await moveItemToGroup(itemId, ICLOUD_LOCKED_GROUP);
  parts.push("", "📋 Moved to iCloud locked group");

  const msgResult = await sendBmMessage(bmTradeInId, BM_MSG_ICLOUD_ON);
  parts.push(msgResult.success ? "📨 Customer messaged via BackMarket" : `⚠️ Failed to message customer: ${msgResult.error}`);

  const msg = parts.filter(Boolean).join("\n");
  await postMondayComment(itemId, msg);
  await sendSlackAlert(msg);
  console.log(`${itemName}: iCloud ON flow complete`);
}

// --- iCloud recheck: handle unlocked device ---

async function handleRecheckUnlocked(item, slackContext) {
  console.log(`${item.name}: iCloud now OFF — unlocking`);

  await updateMondayStatus(item.id, "IC OFF");
  await moveItemToGroup(item.id, TODAYS_REPAIRS_GROUP);

  let bmMsgSent = false;
  if (item.bmTradeInId) {
    const msgResult = await sendBmMessage(item.bmTradeInId, BM_MSG_ICLOUD_OFF);
    bmMsgSent = msgResult.success;
  }

  const comment = ["✅ iCloud Recheck: UNLOCKED", `Serial: ${item.serial}`, "", "📋 Moved to Today's Repairs", bmMsgSent ? "📨 Customer notified via BackMarket" : null].filter(Boolean).join("\n");
  await postMondayComment(item.id, comment);

  const slackMsg = `✅ *iCloud Removed — ${item.name}*\nSerial: ${item.serial}\nMoved to Today's Repairs${bmMsgSent ? "\nCustomer notified" : ""}`;

  if (slackContext?.respond) {
    // Update the original Slack message
    await slackContext.respond(slackMsg);
  } else {
    await sendSlackAlert(slackMsg);
  }
}

// --- Recheck a single item (used by cron auto-recheck and Slack button) ---

async function recheckItem(item, slackContext) {
  console.log(`Rechecking ${item.name}, serial: ${item.serial}`);
  const sickwResult = await checkSickW(item.serial);

  if (!sickwResult.success) {
    const errMsg = `❌ SickW error for ${item.name}: ${sickwResult.error}`;
    console.log(errMsg);
    if (slackContext?.respond) await slackContext.respond(errMsg);
    return { error: sickwResult.error };
  }

  if (sickwResult.icloudLock === "OFF") {
    await handleRecheckUnlocked(item, slackContext);
    return { unlocked: true };
  } else {
    console.log(`${item.name}: still locked`);
    await postMondayComment(item.id, `❌ iCloud Recheck: Still LOCKED\nSerial: ${item.serial}`);

    const stillLockedMsg = `❌ *iCloud Still Locked — ${item.name}*\nSerial: ${item.serial}`;
    if (slackContext?.respond) {
      await slackContext.respond(stillLockedMsg);
    } else {
      // Auto-recheck: also message customer again
      if (item.bmTradeInId) await sendBmMessage(item.bmTradeInId, BM_MSG_ICLOUD_ON);
      await sendSlackAlert(stillLockedMsg + "\nCustomer messaged again");
    }
    return { unlocked: false };
  }
}

// --- Recheck cron ---

async function recheckCron() {
  console.log("Recheck cron: starting...");

  const state = loadState();
  const items = await getLockedGroupItems();
  console.log(`Recheck cron: ${items.length} items in iCloud locked group`);

  let rechecked = 0;

  for (const item of items) {
    if (!item.bmTradeInId || !item.serial) continue;

    try {
      const msgResult = await getBmMessages(item.bmTradeInId);
      if (!msgResult.success) continue;

      const customerMessages = msgResult.messages.filter((m) => m.author !== "Merchant" && m.author !== "BackMarket");
      const customerCount = customerMessages.length;
      const lastKnown = state[item.bmTradeInId]?.customerCount || 0;

      if (customerCount <= lastKnown) continue;

      const latestMsg = customerMessages[0]?.body || "";
      console.log(`${item.name}: new customer message (${lastKnown} → ${customerCount}): "${latestMsg.slice(0, 80)}"`);

      // Update state immediately so we don't re-process
      state[item.bmTradeInId] = { customerCount };

      if (hasRecheckKeyword(latestMsg)) {
        // Keyword match — auto-recheck
        console.log(`${item.name}: keyword match, auto-rechecking`);
        await recheckItem(item);
        rechecked++;
      } else {
        // No keyword — send Slack alert with buttons
        console.log(`${item.name}: no keyword match, sending Slack alert`);
        await sendSlackCustomerReplyAlert(item, latestMsg);
      }
    } catch (err) {
      console.error(`${item.name}: recheck error —`, err.message);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  saveState(state);
  console.log(`Recheck cron: done. ${rechecked} auto-rechecked.`);
}

// --- Counter-Offer Logic ---

async function handleSpecMismatch({ itemId, itemName, bmTradeInId, appleSpecs, claimedSpecs, mismatches }) {
  try {
    // Build expected/received objects for assessment
    const expected = {
      chip: claimedSpecs.cpu,
      ram: claimedSpecs.ram,
      storage: claimedSpecs.ssd,
    };
    const received = {
      chip: appleSpecs.chip || appleSpecs.cpu,
      ram: appleSpecs.memory,
      storage: appleSpecs.storage,
    };

    // Step 1: Assess mismatch direction
    const assessment = counterOffer.assessMismatch(expected, received);
    console.log(`[counter-offer] ${itemName}: assessment = ${JSON.stringify(assessment)}`);

    // Step 2: Better spec, pay original
    if (assessment.action === "pay_original") {
      counterOffer.logDecision(bmTradeInId, "pay_original", 0, {
        reason: assessment.reason,
        itemName,
        details: assessment.details,
      });
      await sendSlackAlert(`ℹ️ *Spec mismatch (better/equivalent) — ${itemName}*\nReceived spec is ${assessment.reason.replace("_", " ")}. Proceeding with original payout.`);
      return; // Normal flow continues
    }

    // Step 3: Get order details for bid price
    let orderDetails;
    try {
      orderDetails = await counterOffer.getBmOrderDetails(bmTradeInId);
    } catch (err) {
      console.error(`[counter-offer] ${itemName}: failed to get BM order details:`, err.message);
      await sendSlackAlert(`⚠️ *Counter-offer: cannot get order details — ${itemName}*\n${err.message}\nManual review needed.`);
      return;
    }

    const originalBid = parseFloat(orderDetails.price || orderDetails.buyback_price || 0);
    if (!originalBid) {
      await sendSlackAlert(`⚠️ *Counter-offer: no bid price found — ${itemName}*\nBM order ${bmTradeInId}. Manual review needed.`);
      return;
    }

    // For now, value diff needs manual input or a receivedSpecBid lookup.
    // We'll use the order details to see if there's a counter price suggestion,
    // otherwise the Slack message will show original bid and mismatches for manual decision.
    // The receivedSpecBid would need a separate BM listing lookup which isn't available via API.
    // Set a placeholder: the Slack message will show mismatches and let the team decide.

    // We'll estimate value diff based on spec differences if we can't look up the exact bid.
    // For now, post to Slack with all info for human decision.

    // Step 4 & 5: Check rate
    const rateInfo = counterOffer.checkRate();
    console.log(`[counter-offer] ${itemName}: rolling rate = ${(rateInfo.rate * 100).toFixed(1)}% (${rateInfo.counterCount}/${rateInfo.totalCount})`);

    // Step 6: Rate limit hit
    if (rateInfo.atLimit) {
      counterOffer.logDecision(bmTradeInId, "rate_limited", null, {
        itemName,
        rate: rateInfo.rate,
        assessment: assessment.details,
      });
      await sendSlackAlert(
        `⚠️ *Counter-offer rate limit hit — ${itemName}*\n` +
        `Rolling rate: ${(rateInfo.rate * 100).toFixed(1)}% (limit 15%)\n` +
        `Proceeding with original payout at £${originalBid}.\n` +
        `Mismatches:\n${mismatches.join("\n")}`
      );
      return; // Pay at original
    }

    // Step 7: Under rate limit, post Slack with buttons
    // Update Monday status24 to Counteroffer (index 3)
    try {
      const columnValues = JSON.stringify({ [STATUS_COLUMN]: { index: 3 } }).replace(/"/g, '\\"');
      await mondayQuery(`mutation { change_multiple_column_values( board_id: ${BOARD_ID}, item_id: ${itemId}, column_values: "${columnValues}" ) { id } }`);
    } catch (err) {
      console.error(`[counter-offer] ${itemName}: Monday status update failed:`, err.message);
    }

    const slackBlocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text:
            `🔴 *Counter-offer candidate: ${itemName}*\nBM Order: \`${bmTradeInId}\`\n\n` +
            `*Expected:* ${expected.chip || "?"} / ${expected.ram || "?"} RAM / ${expected.storage || "?"}\n` +
            `*Received:* ${received.chip || "?"} / ${received.ram || "?"} RAM / ${received.storage || "?"}\n\n` +
            `*Original bid:* £${originalBid}\n` +
            `*Rolling counter rate:* ${(rateInfo.rate * 100).toFixed(1)}% (limit 15%)`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "✅ Approve Counter-Offer" },
            style: "danger",
            action_id: "counter_offer_approve",
            value: JSON.stringify({ itemId, itemName, bmTradeInId, originalBid }),
          },
          {
            type: "button",
            text: { type: "plain_text", text: "💰 Pay at Original" },
            action_id: "counter_offer_pay_original",
            value: JSON.stringify({ itemId, itemName, bmTradeInId, originalBid }),
          },
          {
            type: "button",
            text: { type: "plain_text", text: "✏️ Adjust Price" },
            action_id: "counter_offer_adjust",
            value: JSON.stringify({ itemId, itemName, bmTradeInId, originalBid }),
          },
        ],
      },
    ];

    await slackPostAutomations("chat.postMessage", {
      channel: SLACK_CHANNEL,
      text: `🔴 Counter-offer candidate: ${itemName} — BM ${bmTradeInId}`,
      blocks: slackBlocks,
    });

    counterOffer.logDecision(bmTradeInId, "pending", null, {
      itemName,
      originalBid,
      assessment: assessment.details,
      mismatches,
    });

    console.log(`[counter-offer] ${itemName}: Slack message posted, awaiting decision`);
  } catch (err) {
    console.error(`[counter-offer] ${itemName}: error:`, err.message);
    await sendSlackAlert(`❌ *Counter-offer error — ${itemName}*\n${err.message}`);
  }
}

// --- Webhook: initial iCloud check ---

app.post("/webhook/icloud-check", async (req, res) => {
  try {
    const body = req.body;

    if (body.challenge) {
      console.log("Challenge received, responding");
      return res.json({ challenge: body.challenge });
    }

    const event = body.event;
    if (!event?.pulseId) return res.status(200).send("No event data");
    if (event.columnId !== SERIAL_COLUMN || event.boardId !== BOARD_ID) return res.status(200).send("Ignored");

    const itemId = event.pulseId;
    const itemName = event.pulseName || "Unknown";

    let serial = event.value?.value?.trim() || "";
    const itemData = await getItemFromMonday(itemId);
    if (!serial) serial = itemData.serial;
    if (!serial) { console.log(`Item ${itemId}: empty serial, skipping`); return res.status(200).send("No serial"); }
    if (itemData.clientType !== "BM") { console.log(`Item ${itemId}: "${itemData.clientType}", not BM`); return res.status(200).send("Not BM"); }

    console.log(`Checking iCloud for ${itemName}, serial: ${serial}`);
    const result = await checkSickW(serial);

    if (!result.success) {
      await postMondayComment(itemId, `❌ iCloud Check Failed for serial ${serial}: ${result.error}`);
      return res.status(200).send("SickW error");
    }

    const icloudOn = result.icloudLock === "ON";
    await updateMondayStatus(itemId, icloudOn ? "IC ON" : "IC OFF");

    // Apple spec lookup (M1+ only, non-blocking)
    let appleSpecs = null;
    let specComment = "";
    try {
      appleSpecs = await getAppleSpecsWithRetry(serial);
      if (appleSpecs && !appleSpecs.error) {
        // Update colour on main board
        await updateMainBoardColour(itemId, appleSpecs.color);

        // Build spec confirmation note
        const specLines = [
          `📱 Apple Confirmed: ${appleSpecs.model || "Unknown"}`,
          appleSpecs.color ? `Colour: ${appleSpecs.color}` : null,
          appleSpecs.chip ? `Chip: ${appleSpecs.chip}` : null,
          appleSpecs.cpu ? `CPU: ${appleSpecs.cpu}` : null,
          appleSpecs.gpu ? `GPU: ${appleSpecs.gpu}` : null,
          appleSpecs.memory ? `RAM: ${appleSpecs.memory}` : null,
          appleSpecs.storage ? `Storage: ${appleSpecs.storage}` : null,
        ].filter(Boolean);

        // Compare against BM claimed specs
        const claimed = await getBmClaimedSpecs(itemId);
        if (!claimed) {
          specLines.push("", "⚠️ Could not verify specs — BM board link not found (board_relation5 missing)");
        } else {
          const mismatches = compareSpecs(appleSpecs, claimed);
          if (mismatches.length > 0) {
            specLines.push("", "🔴 SPEC MISMATCH:", ...mismatches);
          } else {
            specLines.push("", "✅ Specs Match BM Listing");
          }
        }

        specComment = specLines.join("\n");
      } else if (appleSpecs?.unsupported) {
        specComment = "ℹ️ Apple specs unavailable — pre-M1 device";
      }
    } catch (err) {
      console.error(`Apple spec lookup failed for ${serial}:`, err.message);
      specComment = "⚠️ Apple spec lookup failed";
    }

    if (icloudOn) {
      await handleIcloudLocked(itemId, itemName, serial, result.model, itemData.bmTradeInId);
      if (specComment) await postMondayComment(itemId, specComment);
    } else {
      // Combine iCloud status + spec check into single comment
      const parts = [`✅ iCloud Check: OFF`];
      if (specComment) parts.push("", specComment);
      await postMondayComment(itemId, parts.join("\n"));
      // Alert Slack on mismatch or missing BM link; trigger counter-offer flow
      if (specComment.includes("SPEC MISMATCH")) {
        await sendSlackAlert(`🔴 *Spec Mismatch — ${itemName}*\n${specComment}`);
        // Trigger counter-offer assessment
        const claimed = await getBmClaimedSpecs(itemId);
        if (claimed && appleSpecs) {
          const specMismatches = compareSpecs(appleSpecs, claimed);
          await handleSpecMismatch({
            itemId,
            itemName,
            bmTradeInId: itemData.bmTradeInId,
            appleSpecs,
            claimedSpecs: claimed,
            mismatches: specMismatches,
          });
        }
      } else if (specComment.includes("Could not verify specs")) {
        await sendSlackAlert(`⚠️ *Spec Verification Failed — ${itemName}*\n${specComment}`);
      }
    }

    console.log(`Done: ${itemName} → ${icloudOn ? "IC ON" : "IC OFF"}`);
    return res.status(200).send("OK");
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).send("Internal error");
  }
});

// --- Slack interaction handler (buttons + modals) ---

app.post("/webhook/icloud-check/slack-interact", async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload);

    // Button click
    if (payload.type === "block_actions") {
      const action = payload.actions[0];
      const data = JSON.parse(action.value);
      const responseUrl = payload.response_url;

      const respond = async (text) => {
        await fetch(responseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ replace_original: true, text }),
        });
      };

      if (action.action_id === "recheck_icloud") {
        res.status(200).send(""); // Ack immediately
        await respond(`⏳ Rechecking iCloud for ${data.itemName}...`);
        await recheckItem({ id: data.itemId, name: data.itemName, serial: data.serial, bmTradeInId: data.bmTradeInId }, { respond });
        return;
      }

      // Route counter-offer actions to dedicated handler
      if (action.action_id?.startsWith("counter_offer_")) {
        // Forward to counter-offer action handler logic
        // Re-parse and handle inline to avoid routing complexity
        const coData = JSON.parse(action.value);
        const coResponseUrl = payload.response_url;
        const coRespond = async (text) => {
          await fetch(coResponseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ replace_original: true, text }),
          });
        };

        res.status(200).send("");

        if (action.action_id === "counter_offer_approve") {
          try {
            await counterOffer.executeCounterOffer(
              coData.bmTradeInId,
              coData.counterPrice || coData.originalBid,
              "Specs received differ from listing. Counter-offer reflects actual device specs."
            );
            counterOffer.logDecision(coData.bmTradeInId, "counter", null, {
              itemName: coData.itemName,
              price: coData.counterPrice || coData.originalBid,
              approvedBy: payload.user?.name || payload.user?.id || "unknown",
            });
            await coRespond(`✅ Counter-offer executed for ${coData.itemName} — BM ${coData.bmTradeInId}`);
          } catch (err) {
            await coRespond(`❌ Counter-offer FAILED for ${coData.itemName}: ${err.message.substring(0, 200)}`);
            await sendSlackAlert(`❌ Counter-offer API failed for ${coData.itemName}: ${err.message.substring(0, 200)}`);
          }
          return;
        }

        if (action.action_id === "counter_offer_pay_original") {
          counterOffer.logDecision(coData.bmTradeInId, "pay_original_manual", 0, {
            itemName: coData.itemName,
            originalBid: coData.originalBid,
            decidedBy: payload.user?.name || payload.user?.id || "unknown",
          });
          try { await updateMondayStatus(coData.itemId, "IC OFF"); } catch {}
          await coRespond(`💰 Paying at original price for ${coData.itemName} — £${coData.originalBid}. Status reset to IC OFF.`);
          return;
        }

        if (action.action_id === "counter_offer_adjust") {
          await slackPostAutomations("views.open", {
            trigger_id: payload.trigger_id,
            view: {
              type: "modal",
              callback_id: "counter_offer_adjust_modal",
              private_metadata: JSON.stringify({
                bmTradeInId: coData.bmTradeInId,
                itemName: coData.itemName,
                itemId: coData.itemId,
                originalBid: coData.originalBid,
                responseUrl: coResponseUrl,
              }),
              title: { type: "plain_text", text: "Adjust Counter Price" },
              submit: { type: "plain_text", text: "Submit Counter-Offer" },
              blocks: [
                { type: "section", text: { type: "mrkdwn", text: `*${coData.itemName}*\nOriginal bid: £${coData.originalBid}` } },
                { type: "input", block_id: "price_block", element: { type: "plain_text_input", action_id: "adjusted_price", placeholder: { type: "plain_text", text: "Enter price (e.g. 150)" } }, label: { type: "plain_text", text: "Counter-Offer Price (£)" } },
                { type: "input", block_id: "comment_block", element: { type: "plain_text_input", action_id: "counter_comment", multiline: true, placeholder: { type: "plain_text", text: "Reason..." } }, label: { type: "plain_text", text: "Comment" }, optional: true },
              ],
            },
          });
          return;
        }

        return;
      }

      if (action.action_id === "reply_customer") {
        // Open a modal for the reply
        await slackPostAutomations("views.open", {
          trigger_id: payload.trigger_id,
          view: {
            type: "modal",
            callback_id: "send_bm_reply",
            private_metadata: JSON.stringify({ bmTradeInId: data.bmTradeInId, itemName: data.itemName, itemId: data.itemId, responseUrl }),
            title: { type: "plain_text", text: "Reply to Customer" },
            submit: { type: "plain_text", text: "Send" },
            blocks: [
              {
                type: "section",
                text: { type: "mrkdwn", text: `*${data.itemName}*\nThis will send a message via BackMarket.` },
              },
              {
                type: "input",
                block_id: "reply_block",
                element: { type: "plain_text_input", action_id: "reply_text", multiline: true, placeholder: { type: "plain_text", text: "Type your reply..." } },
                label: { type: "plain_text", text: "Message" },
              },
            ],
          },
        });
        return res.status(200).send("");
      }
    }

    // Counter-offer adjust modal submission
    if (payload.type === "view_submission" && payload.view.callback_id === "counter_offer_adjust_modal") {
      const meta = JSON.parse(payload.view.private_metadata);
      const adjustedPrice = parseFloat(payload.view.state.values.price_block.adjusted_price.value);
      const comment = payload.view.state.values.comment_block?.counter_comment?.value || "";

      res.status(200).json({ response_action: "clear" });

      if (isNaN(adjustedPrice) || adjustedPrice <= 0) {
        if (meta.responseUrl) {
          await fetch(meta.responseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ replace_original: false, text: `❌ Invalid price entered for ${meta.itemName}. Try again.` }),
          });
        }
        return;
      }

      try {
        await counterOffer.executeCounterOffer(
          meta.bmTradeInId,
          adjustedPrice,
          comment || `Counter-offer: device specs differ from listing. Adjusted price: £${adjustedPrice}`
        );

        counterOffer.logDecision(meta.bmTradeInId, "counter", meta.originalBid - adjustedPrice, {
          itemName: meta.itemName,
          originalBid: meta.originalBid,
          adjustedPrice,
          comment,
        });

        if (meta.responseUrl) {
          await fetch(meta.responseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ replace_original: true, text: `✅ Counter-offer sent for ${meta.itemName} at £${adjustedPrice} (was £${meta.originalBid})` }),
          });
        }
        console.log(`[counter-offer-action] ${meta.itemName}: adjusted counter-offer at £${adjustedPrice}`);
      } catch (err) {
        console.error(`[counter-offer-action] Adjusted counter failed:`, err.message);
        await sendSlackAlert(`❌ Adjusted counter-offer FAILED for ${meta.itemName}: ${err.message.substring(0, 200)}`);
      }
      return;
    }

    // Modal submission
    if (payload.type === "view_submission" && payload.view.callback_id === "send_bm_reply") {
      const meta = JSON.parse(payload.view.private_metadata);
      const replyText = payload.view.state.values.reply_block.reply_text.value;

      // Send async — close modal immediately
      res.status(200).json({ response_action: "clear" });

      const result = await sendBmMessage(meta.bmTradeInId, replyText);

      if (result.success) {
        await postMondayComment(meta.itemId, `💬 Reply sent to customer via BackMarket:\n"${replyText}"`);
        // Update the original Slack message
        if (meta.responseUrl) {
          await fetch(meta.responseUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ replace_original: true, text: `💬 *${meta.itemName}* — Reply sent: "${replyText.slice(0, 100)}"` }),
          });
        }
        console.log(`${meta.itemName}: reply sent via BM`);
      } else {
        await sendSlackAlert(`❌ Failed to send reply for ${meta.itemName}: ${result.error}`);
        console.log(`${meta.itemName}: reply failed — ${result.error}`);
      }
      return;
    }

    res.status(200).send("");
  } catch (err) {
    console.error("Slack interact error:", err);
    res.status(200).send("");
  }
});

// --- Webhook: Counter-Offer Slack Action Handler ---

app.post("/webhook/bm/counter-offer-action", async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload);
    if (payload.type !== "block_actions") return res.status(200).send("");

    const action = payload.actions[0];
    const data = JSON.parse(action.value);
    const responseUrl = payload.response_url;

    const respond = async (text) => {
      await fetch(responseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replace_original: true, text }),
      });
    };

    res.status(200).send(""); // Ack immediately

    if (action.action_id === "counter_offer_approve") {
      try {
        // Use original bid as counter price (team can adjust via "Adjust" button if needed)
        // In practice, the counter price should be the receivedSpecBid, but we may not have it.
        // For now, execute at a price the team approves. They clicked approve knowing the context.
        await counterOffer.executeCounterOffer(
          data.bmTradeInId,
          data.counterPrice || data.originalBid,
          "Specs received differ from listing. Counter-offer reflects actual device specs."
        );

        counterOffer.logDecision(data.bmTradeInId, "counter", null, {
          itemName: data.itemName,
          price: data.counterPrice || data.originalBid,
          approvedBy: payload.user?.name || payload.user?.id || "unknown",
        });

        await respond(`✅ Counter-offer executed for ${data.itemName} — BM ${data.bmTradeInId}`);
        console.log(`[counter-offer-action] ${data.itemName}: counter-offer approved and executed`);
      } catch (err) {
        console.error(`[counter-offer-action] Execute failed:`, err.message);
        await respond(`❌ Counter-offer FAILED for ${data.itemName}: ${err.message.substring(0, 200)}`);
        await sendSlackAlert(`❌ Counter-offer API failed for ${data.itemName} — ${data.bmTradeInId}: ${err.message.substring(0, 200)}`);
      }
    }

    else if (action.action_id === "counter_offer_pay_original") {
      counterOffer.logDecision(data.bmTradeInId, "pay_original_manual", 0, {
        itemName: data.itemName,
        originalBid: data.originalBid,
        decidedBy: payload.user?.name || payload.user?.id || "unknown",
      });

      // Update Monday status back from Counteroffer to allow normal payout flow
      try {
        await updateMondayStatus(data.itemId, "IC OFF");
      } catch (err) {
        console.error(`[counter-offer-action] Monday update failed:`, err.message);
      }

      await respond(`💰 Paying at original price for ${data.itemName} — £${data.originalBid}. Status reset to IC OFF.`);
      console.log(`[counter-offer-action] ${data.itemName}: paying at original price`);
    }

    else if (action.action_id === "counter_offer_adjust") {
      // Open a modal to get the adjusted price
      await slackPostAutomations("views.open", {
        trigger_id: payload.trigger_id,
        view: {
          type: "modal",
          callback_id: "counter_offer_adjust_modal",
          private_metadata: JSON.stringify({
            bmTradeInId: data.bmTradeInId,
            itemName: data.itemName,
            itemId: data.itemId,
            originalBid: data.originalBid,
            responseUrl,
          }),
          title: { type: "plain_text", text: "Adjust Counter Price" },
          submit: { type: "plain_text", text: "Submit Counter-Offer" },
          blocks: [
            {
              type: "section",
              text: { type: "mrkdwn", text: `*${data.itemName}*\nOriginal bid: £${data.originalBid}` },
            },
            {
              type: "input",
              block_id: "price_block",
              element: {
                type: "plain_text_input",
                action_id: "adjusted_price",
                placeholder: { type: "plain_text", text: "Enter counter-offer price (e.g. 150)" },
              },
              label: { type: "plain_text", text: "Counter-Offer Price (£)" },
            },
            {
              type: "input",
              block_id: "comment_block",
              element: {
                type: "plain_text_input",
                action_id: "counter_comment",
                multiline: true,
                placeholder: { type: "plain_text", text: "Reason for adjusted price..." },
              },
              label: { type: "plain_text", text: "Comment (sent to customer)" },
              optional: true,
            },
          ],
        },
      });
    }
  } catch (err) {
    console.error("[counter-offer-action] Error:", err);
    res.status(200).send("");
  }
});

// --- Webhook: Counter-Offer Adjust Modal Submission ---
// This is handled in the existing Slack interact endpoint, but we add a check here.
// Actually, modal submissions go to the same request URL. Let's add to the existing handler.

// Manual recheck
app.post("/webhook/icloud-check/recheck", async (req, res) => {
  recheckCron().catch((err) => console.error("Manual recheck error:", err));
  res.json({ status: "ok", message: "Recheck triggered" });
});

// Apple spec check endpoint — any agent can call this
app.get("/webhook/icloud-check/spec-check", async (req, res) => {
  const serial = (req.query.serial || "").trim();
  if (!serial) return res.status(400).json({ error: "Missing ?serial= parameter" });

  console.log(`Spec check request: ${serial}`);
  try {
    const specs = await getAppleSpecsWithRetry(serial, 2);
    if (!specs) return res.status(500).json({ error: "Lookup returned null" });
    if (specs.error) return res.json({ serial, supported: false, error: specs.error });

    res.json({
      serial,
      supported: true,
      model: specs.model || null,
      color: specs.color || null,
      chip: specs.chip || null,
      cpu: specs.cpu || null,
      gpu: specs.gpu || null,
      memory: specs.memory || null,
      storage: specs.storage || null,
    });
  } catch (err) {
    console.error(`Spec check error for ${serial}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Webhook: BM Shipping Confirmed (Build 2) ---
// Triggered when status4 changes to index 160 (Shipped) on board 349212843.
// Sends tracking + new_state:3 to BackMarket sales order API.

app.post("/webhook/bm/shipping-confirmed", async (req, res) => {
  const body = req.body;

  // Monday webhook challenge
  if (body.challenge) {
    console.log("[shipping-confirmed] Challenge received");
    return res.json({ challenge: body.challenge });
  }

  // Always respond 200 to Monday
  res.status(200).send("OK");

  try {
    const event = body.event;
    if (!event) return;
    if (event.columnId !== STATUS4_COLUMN || String(event.boardId) !== String(BOARD_ID)) return;

    // Parse value — Monday sends status changes as { index, label } or nested
    let value = {};
    try { value = typeof event.value === "string" ? JSON.parse(event.value) : (event.value || {}); } catch {}
    const index = value.index ?? value?.label?.index;
    if (index !== 160) return;

    const itemId = event.pulseId;
    const itemName = event.pulseName || "Unknown";
    console.log(`[shipping-confirmed] ${itemName} (${itemId}) marked as Shipped`);

    // Dedup: check recent updates for "BM notified"
    const updatesData = await mondayQuery(`{ items(ids: [${itemId}]) { updates(limit: 5) { text_body } } }`);
    const recentUpdates = updatesData?.data?.items?.[0]?.updates || [];
    if (recentUpdates.some(u => u.text_body && u.text_body.includes("BM notified"))) {
      console.log(`[shipping-confirmed] ${itemName}: already notified BM, skipping`);
      return;
    }

    // Get tracking number and linked BM Devices Board item
    const itemData = await mondayQuery(`{ items(ids: [${itemId}]) { column_values(ids: ["${TRACKING_COLUMN}", "${BM_BOARD_RELATION}"]) { id text ... on BoardRelationValue { linked_item_ids } } } }`);
    const cols = itemData?.data?.items?.[0]?.column_values || [];

    const trackingNumber = cols.find(c => c.id === TRACKING_COLUMN)?.text?.trim() || "";

    // Get linked BM Devices Board item
    const linkCol = cols.find(c => c.id === BM_BOARD_RELATION);
    const bmDeviceItemId = linkCol?.linked_item_ids?.[0] || null;

    if (!trackingNumber) {
      console.log(`[shipping-confirmed] ${itemName}: no tracking number found`);
      await slackPost("chat.postMessage", {
        channel: DISPATCH_SLACK_CHANNEL,
        text: `⚠️ ${itemName} marked Shipped but no tracking number found. Manual BM update needed.`,
      });
      return;
    }

    if (!bmDeviceItemId) {
      console.log(`[shipping-confirmed] ${itemName}: no linked BM Devices Board item`);
      await slackPost("chat.postMessage", {
        channel: DISPATCH_SLACK_CHANNEL,
        text: `⚠️ ${itemName} marked Shipped (tracking: ${trackingNumber}) but no linked BM device found. Manual BM update needed.`,
      });
      return;
    }

    // Get BM sales order ID from BM Devices Board
    const bmData = await mondayQuery(`{ items(ids: [${bmDeviceItemId}]) { column_values(ids: ["${BM_SALES_ORDER_COLUMN}"]) { id text } } }`);
    const bmOrderId = bmData?.data?.items?.[0]?.column_values?.[0]?.text?.trim() || "";

    if (!bmOrderId) {
      console.log(`[shipping-confirmed] ${itemName}: no BM order ID on devices board`);
      await slackPost("chat.postMessage", {
        channel: DISPATCH_SLACK_CHANNEL,
        text: `⚠️ ${itemName} has tracking ${trackingNumber} but no BM order ID found on devices board. Manual BM update needed.`,
      });
      return;
    }

    // POST to BackMarket sales API
    console.log(`[shipping-confirmed] Updating BM order ${bmOrderId} with tracking ${trackingNumber}`);

    const bmUpdateShipping = async () => {
      const resp = await fetch(`${BM_SALES_API_BASE}/${bmOrderId}`, {
        method: "POST",
        headers: BM_API_HEADERS,
        body: JSON.stringify({
          order_id: bmOrderId,
          new_state: 3,
          tracking_number: trackingNumber,
          tracking_url: `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`,
          shipper: "Royal Mail Express",
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        const err = new Error(`HTTP ${resp.status}: ${errText.substring(0, 300)}`);
        err.statusCode = resp.status;
        throw err;
      }
      return resp;
    };

    try {
      await bmUpdateShipping();
      console.log(`[shipping-confirmed] BM order ${bmOrderId} updated successfully`);

      const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
      await slackPost("chat.postMessage", {
        channel: DISPATCH_SLACK_CHANNEL,
        text: `✅ BM notified of shipment: ${itemName} — Order ${bmOrderId} — Tracking ${trackingNumber}`,
      });
      await postMondayComment(itemId, `✅ BM notified of shipment [${timestamp}]\nTracking: ${trackingNumber}\nOrder: ${bmOrderId}`);

    } catch (err) {
      console.error(`[shipping-confirmed] BM update failed for ${bmOrderId}:`, err.message);

      if (err.statusCode >= 500) {
        // Retry once after 30s on 5xx
        console.log("[shipping-confirmed] 5xx error, retrying in 30s...");
        await new Promise(r => setTimeout(r, 30000));
        try {
          await bmUpdateShipping();
          console.log(`[shipping-confirmed] BM order ${bmOrderId} updated on retry`);
          const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
          await slackPost("chat.postMessage", {
            channel: DISPATCH_SLACK_CHANNEL,
            text: `✅ BM notified of shipment (retry): ${itemName} — Order ${bmOrderId} — Tracking ${trackingNumber}`,
          });
          await postMondayComment(itemId, `✅ BM notified of shipment [${timestamp}]\nTracking: ${trackingNumber}\nOrder: ${bmOrderId}`);
        } catch (retryErr) {
          console.error("[shipping-confirmed] Retry also failed:", retryErr.message);
          await slackPost("chat.postMessage", {
            channel: DISPATCH_SLACK_CHANNEL,
            text: `❌ BM update FAILED for ${itemName} — Order ${bmOrderId}: ${retryErr.message.substring(0, 200)}. Manual update needed.`,
          });
        }
      } else {
        // 4xx — don't retry
        await slackPost("chat.postMessage", {
          channel: DISPATCH_SLACK_CHANNEL,
          text: `❌ BM update FAILED for ${itemName} — Order ${bmOrderId}: ${err.message.substring(0, 200)}. No retry on ${err.statusCode}. Manual update needed.`,
        });
      }
    }

  } catch (err) {
    console.error("[shipping-confirmed] Error:", err);
  }
});

// --- Webhook: BM Payout / Buyback Validate (Build 3) ---
// Triggered when status24 changes to index 12 (Pay-Out) on board 349212843.
// Calls BM buyback validate API, then updates Monday status to Purchased.

app.post("/webhook/bm/payout", async (req, res) => {
  const body = req.body;

  // Monday webhook challenge
  if (body.challenge) {
    console.log("[payout] Challenge received");
    return res.json({ challenge: body.challenge });
  }

  // Always respond 200 to Monday
  res.status(200).send("OK");

  try {
    const event = body.event;
    if (!event) return;
    if (event.columnId !== STATUS_COLUMN || String(event.boardId) !== String(BOARD_ID)) return;

    // Parse value
    let value = {};
    try { value = typeof event.value === "string" ? JSON.parse(event.value) : (event.value || {}); } catch {}
    const index = value.index ?? value?.label?.index;
    if (index !== 12) return;

    const itemId = event.pulseId;
    const itemName = event.pulseName || "Unknown";
    console.log(`[payout] ${itemName} (${itemId}) marked as Pay-Out`);

    // Get BM trade-in ID from main board
    const itemData = await mondayQuery(`{ items(ids: [${itemId}]) { column_values(ids: ["${BM_TRADEIN_ID_COLUMN}"]) { id text } } }`);
    const bmTradeInId = itemData?.data?.items?.[0]?.column_values?.[0]?.text?.trim() || "";

    if (!bmTradeInId) {
      console.log(`[payout] ${itemName}: no BM trade-in ID found`);
      await sendSlackAlert(`⚠️ ${itemName} marked Pay-Out but no BM trade-in ID found. Manual payout needed.`);
      return;
    }

    console.log(`[payout] Validating BM buyback order ${bmTradeInId}`);

    const bmValidatePayout = async () => {
      const resp = await fetch(`${BM_API_BASE}/${bmTradeInId}/validate`, {
        method: "PUT",
        headers: BM_API_HEADERS,
        body: JSON.stringify({}),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        const err = new Error(`HTTP ${resp.status}: ${errText.substring(0, 300)}`);
        err.statusCode = resp.status;
        throw err;
      }
      return resp;
    };

    try {
      await bmValidatePayout();
      console.log(`[payout] BM buyback ${bmTradeInId} validated successfully`);

      // Update Monday status24 to Purchased
      try {
        await updateMondayStatus(itemId, "Purchased");
        console.log(`[payout] Monday status updated to Purchased for ${itemName}`);
      } catch (mondayErr) {
        console.error("[payout] Monday update failed:", mondayErr.message);
        await sendSlackAlert(`⚠️ Payout sent to BM for ${itemName} (${bmTradeInId}) but Monday not updated. Set to Purchased manually.`);
      }

      await sendSlackAlert(`✅ Payout sent for ${itemName} — ${bmTradeInId}`);

    } catch (err) {
      console.error(`[payout] BM validate failed for ${bmTradeInId}:`, err.message);

      if (err.statusCode >= 500) {
        // Retry once after 30s on 5xx
        console.log("[payout] 5xx error, retrying in 30s...");
        await new Promise(r => setTimeout(r, 30000));
        try {
          await bmValidatePayout();
          console.log(`[payout] BM buyback ${bmTradeInId} validated on retry`);

          try {
            await updateMondayStatus(itemId, "Purchased");
          } catch (mondayErr) {
            await sendSlackAlert(`⚠️ Payout sent to BM for ${itemName} (${bmTradeInId}) but Monday not updated. Set to Purchased manually.`);
          }

          await sendSlackAlert(`✅ Payout sent for ${itemName} — ${bmTradeInId} (retry succeeded)`);

        } catch (retryErr) {
          console.error("[payout] Retry also failed:", retryErr.message);
          await sendSlackAlert(`❌ Payout FAILED for ${itemName} — ${bmTradeInId}: ${retryErr.message.substring(0, 200)}. Left as Pay-Out for safety net cron.`);
        }
      } else {
        // 4xx — BM error (already validated, counter-offer pending, etc.) — don't retry, don't change status
        await sendSlackAlert(`❌ Payout FAILED for ${itemName} — ${bmTradeInId}: ${err.message.substring(0, 200)}. Status NOT changed.`);
      }
    }

  } catch (err) {
    console.error("[payout] Error:", err);
  }
});

// --- Webhook: BM Grade Check / Intake Profitability Prediction (Build 10) ---
// Triggered when Top Case grade or Lid grade changes on Main Board.
// Predicts final grade and checks profitability before repair starts.

const GRADE_CHECK_CONSTANTS = {
  TOP_CASE_GRADE_COLUMN: "status_2_mkmcj0tz",
  LID_GRADE_COLUMN: "status_2_mkmc4tew",
  NFU_CAP: 150,
  MARGIN_THRESHOLD: 0.30,
  NET_PROFIT_THRESHOLD: 100,
  LABOUR_RATE: 24,
  SHIPPING_COST: 15,
  BM_COMMISSION: 0.10,
  SELL_PRICES_PATH: "/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json",
  PURCHASE_COST_COLUMN: "numeric",
  PARTS_COST_COLUMN: "lookup_mkx1xzd7",
  LABOUR_HOURS_COLUMN: "numeric_mkxcedc",
  NFU_STATUS_COLUMN: "status_mkwg1abc",  // NFU status column (adjust if different)
  BOARD_REPAIR_COST_COLUMN: "numbers_mkwg2def", // Board repair cost (adjust if different)
};

// Grade mapping
const GRADE_MAP_GC = {
  "Excellent": "Excellent", "Grade A": "Excellent",
  "Good": "Good", "Grade B": "Good",
  "Fair": "Fair", "Grade C": "Fair",
};
const GRADE_RANK_GC = {
  "Fair": 1, "Grade C": 1,
  "Good": 2, "Grade B": 2,
  "Excellent": 3, "Grade A": 3,
};
const BM_GRADE_MAP_GC = {
  "Excellent": "VERY_GOOD", "Grade A": "VERY_GOOD",
  "Good": "GOOD", "Grade B": "GOOD",
  "Fair": "FAIR", "Grade C": "FAIR",
};

// Dedup cache: itemId -> timestamp
const gradeCheckCache = new Map();
const GRADE_CHECK_DEDUP_MS = 10 * 60 * 1000; // 10 minutes

function gradeCheckDedup(itemId) {
  const now = Date.now();
  // Clean expired entries
  for (const [k, v] of gradeCheckCache) {
    if (now - v > GRADE_CHECK_DEDUP_MS) gradeCheckCache.delete(k);
  }
  if (gradeCheckCache.has(itemId)) return true; // Already processed recently
  gradeCheckCache.set(itemId, now);
  return false;
}

// Model matching (same logic as profitability module)
function matchModelGC(itemName, modelKeys) {
  if (!itemName) return null;
  const name = itemName.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;
  for (const key of modelKeys) {
    const keyLower = key.toLowerCase();
    const keyParts = keyLower.replace(/"/g, "").split(/\s+/);
    let matched = 0;
    for (const part of keyParts) {
      if (name.includes(part)) matched++;
    }
    const score = matched / keyParts.length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = key;
    }
  }
  return bestScore >= 0.8 ? bestMatch : null;
}

app.post("/webhook/bm/grade-check", async (req, res) => {
  const body = req.body;

  // Monday webhook challenge
  if (body.challenge) {
    console.log("[grade-check] Challenge received");
    return res.json({ challenge: body.challenge });
  }

  // Always respond 200 to Monday
  res.status(200).send("OK");

  try {
    const event = body.event;
    if (!event) return;

    const { TOP_CASE_GRADE_COLUMN, LID_GRADE_COLUMN } = GRADE_CHECK_CONSTANTS;

    // Validate: must be one of our two grade columns on the right board
    if (String(event.boardId) !== String(BOARD_ID)) return;
    if (event.columnId !== TOP_CASE_GRADE_COLUMN && event.columnId !== LID_GRADE_COLUMN) return;

    const itemId = event.pulseId;
    const itemName = event.pulseName || "Unknown";
    console.log(`[grade-check] Grade change on ${itemName} (${itemId}), column: ${event.columnId}`);

    // Dedup check
    if (gradeCheckDedup(String(itemId))) {
      console.log(`[grade-check] ${itemName}: dedup hit, skipping`);
      return;
    }

    // Fetch both grade columns + cost data for the item
    const {
      PURCHASE_COST_COLUMN, PARTS_COST_COLUMN, LABOUR_HOURS_COLUMN,
    } = GRADE_CHECK_CONSTANTS;

    const columnsToFetch = [
      TOP_CASE_GRADE_COLUMN, LID_GRADE_COLUMN,
      PURCHASE_COST_COLUMN, PARTS_COST_COLUMN, LABOUR_HOURS_COLUMN,
    ];

    const itemData = await mondayQuery(
      `{ items(ids: [${itemId}]) { name column_values(ids: ${JSON.stringify(columnsToFetch)}) { id text value ... on MirrorValue { display_value } ... on FormulaValue { display_value } ... on StatusValue { text } } } }`
    );
    const item = itemData?.data?.items?.[0];
    if (!item) {
      console.log(`[grade-check] Item ${itemId} not found`);
      return;
    }

    const getColText = (colId) => {
      const col = item.column_values.find((c) => c.id === colId);
      // Mirrors and formulas use display_value; text/status use text
      return (col?.display_value ?? col?.text ?? "").toString().trim();
    };

    const topCaseGrade = getColText(TOP_CASE_GRADE_COLUMN);
    const lidGrade = getColText(LID_GRADE_COLUMN);

    console.log(`[grade-check] ${item.name}: Top Case="${topCaseGrade}", Lid="${lidGrade}"`);

    // If either is empty, wait for both
    if (!topCaseGrade || !lidGrade) {
      console.log(`[grade-check] ${item.name}: waiting for both grades`);
      // Remove from dedup so we can process when the other grade arrives
      gradeCheckCache.delete(String(itemId));
      return;
    }

    // Predict final grade (worst of the two)
    const topRank = GRADE_RANK_GC[topCaseGrade] || 0;
    const lidRank = GRADE_RANK_GC[lidGrade] || 0;
    const predictedGrade = topRank <= lidRank ? topCaseGrade : lidGrade;
    const predictedGradeKey = GRADE_MAP_GC[predictedGrade] || predictedGrade;
    const bmGrade = BM_GRADE_MAP_GC[predictedGrade] || "FAIR";

    console.log(`[grade-check] ${item.name}: Predicted grade=${predictedGradeKey} (BM: ${bmGrade})`);

    // Load sell prices
    let sellPriceData;
    try {
      sellPriceData = JSON.parse(fs.readFileSync(GRADE_CHECK_CONSTANTS.SELL_PRICES_PATH, "utf8"));
    } catch (err) {
      console.error(`[grade-check] Could not load sell prices: ${err.message}`);
      await sendSlackAlert(`⚠️ Grade check for ${item.name}: sell price data unavailable. Cannot predict profitability.`);
      return;
    }

    // Match model
    const modelKeys = Object.keys(sellPriceData.models || {});
    const modelKey = matchModelGC(item.name, modelKeys);

    if (!modelKey) {
      console.log(`[grade-check] ${item.name}: could not match to sell price model`);
      await sendSlackAlert(`⚠️ Grade check for ${item.name}: could not match to sell price data. Predicted grade: ${predictedGradeKey}.`);
      return;
    }

    // Look up predicted sell price
    const gradeData = sellPriceData.models[modelKey]?.grades?.[predictedGradeKey];
    const predictedSellPrice = gradeData?.price;

    if (!predictedSellPrice) {
      console.log(`[grade-check] ${item.name}: no sell price for ${modelKey} / ${predictedGradeKey}`);
      await sendSlackAlert(`⚠️ Grade check for ${item.name}: no sell price data for ${modelKey} Grade ${predictedGradeKey}.`);
      return;
    }

    // Get cost data
    const purchaseCost = parseFloat(getColText(PURCHASE_COST_COLUMN)) || 0;
    const partsCost = parseFloat(getColText(PARTS_COST_COLUMN)) || 0;
    const labourHours = parseFloat(getColText(LABOUR_HOURS_COLUMN)) || 0;
    const costUnknown = !purchaseCost && !partsCost;

    // Calculate profitability
    const totalCost = purchaseCost + partsCost + (labourHours * GRADE_CHECK_CONSTANTS.LABOUR_RATE) + GRADE_CHECK_CONSTANTS.SHIPPING_COST;
    const netRevenue = predictedSellPrice * (1 - GRADE_CHECK_CONSTANTS.BM_COMMISSION);
    const netProfit = netRevenue - totalCost;
    const margin = netRevenue > 0 ? netProfit / netRevenue : 0;
    const marginPercent = Math.round(margin * 100);

    const isProfitable = margin >= GRADE_CHECK_CONSTANTS.MARGIN_THRESHOLD && netProfit >= GRADE_CHECK_CONSTANTS.NET_PROFIT_THRESHOLD;

    console.log(`[grade-check] ${item.name}: Sell £${predictedSellPrice}, Cost £${Math.round(totalCost)}, Net £${Math.round(netProfit)}, Margin ${marginPercent}% — ${isProfitable ? "PROFITABLE" : "UNPROFITABLE"}`);

    if (isProfitable) {
      // Profitable: log silently
      return;
    }

    // Unprofitable: alert
    const costNote = costUnknown ? "\n⚠️ Cost data unknown: using £0." : "";
    const partsLabour = Math.round(partsCost + (labourHours * GRADE_CHECK_CONSTANTS.LABOUR_RATE));

    const alertMsg = `⚠️ Profitability warning: ${item.name}\n\nPredicted grade: ${predictedGradeKey} (Top Case: ${topCaseGrade}, Lid: ${lidGrade})\nEst. sell price: £${predictedSellPrice} | Est. net: £${Math.round(netProfit)} | Margin: ${marginPercent}%\n\nThreshold: ≥30% margin AND ≥£100 net\n\nParts + labour = £${partsLabour}. Consider before starting repair.${costNote}`;

    await sendSlackAlert(alertMsg);

    // Add Monday comment
    try {
      await postMondayComment(itemId,
        `⚠️ Profitability prediction\nGrade: ${predictedGradeKey} (TC: ${topCaseGrade}, Lid: ${lidGrade})\nEst. sell: £${predictedSellPrice} | Net: £${Math.round(netProfit)} | Margin: ${marginPercent}%\n${isProfitable ? "✅ Profitable" : "🔴 Below threshold"}`
      );
    } catch (err) {
      console.error(`[grade-check] Monday comment failed: ${err.message}`);
    }

    // NFU check: if board repair needed and cost exceeds cap
    // This is a simplified check. In production, check a specific NFU status column.
    // For now, we check if item name or status suggests NFU.
    // TODO: refine NFU detection based on actual column values when confirmed
    // Placeholder: skip NFU check for now unless we find a board repair cost column

  } catch (err) {
    console.error("[grade-check] Error:", err);
  }
});

// --- Webhook: BM To List — Listing Automation (Builds 4+5) ---
// Triggered when status24 changes to index 8 (To List) on Main Board.
// Path A: Active listing exists → increment qty
// Path B: No active listing → check offline listings, price check, create/reactivate

const BM_LISTINGS_API_BASE = "https://www.backmarket.co.uk/ws/listings";
const BM_GRADE_COLUMN = "color_mm1fj7tb"; // Trade-in Grade on BM Devices Board
const BM_MODEL_NUMBER_COLUMN = "text"; // Model Number on BM Devices Board
const BM_SKU_COLUMN = "text89"; // BackMarket SKU on BM Devices Board
const BM_PURCHASE_PRICE_COLUMN = "numeric"; // Purchase Price (ex VAT) on BM Devices Board
const MAIN_BOARD_GRADE_COLUMN = "status_2_Mjj4GJNQ"; // Final Grade on Main Board
const MAIN_BOARD_PARTS_COST_FORMULA = "formula_mkx13zr7"; // Parts Cost formula on Main Board
const MAIN_BOARD_LABOUR_FORMULA = "formula_mkx1bjqr"; // Total Labour formula on Main Board
const SELL_PRICES_PATH = "/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json";

app.post("/webhook/bm/to-list", (req, res) => {
  if (req.body?.challenge) return res.json({ challenge: req.body.challenge });
  console.log("[to-list] DISABLED — use list-device.js instead");
  return res.status(410).send("Gone: use list-device.js");
});

// DISABLED 2026-03-23: listing logic moved to standalone list-device.js
// Original handler below (dead code):
const _disabled_to_list = (async (req, res) => {
  const body = req.body;

  // Monday webhook challenge
  if (body.challenge) {
    console.log("[to-list] Challenge received");
    return res.json({ challenge: body.challenge });
  }

  // Always respond 200 to Monday immediately
  res.status(200).send("OK");

  try {
    const event = body.event;
    if (!event) return;
    if (event.columnId !== STATUS_COLUMN || String(event.boardId) !== String(BOARD_ID)) return;

    // Parse value — Monday sends status changes as { index, label }
    let value = {};
    try { value = typeof event.value === "string" ? JSON.parse(event.value) : (event.value || {}); } catch {}
    const index = value.index ?? value?.label?.index;
    if (index !== 8) return;

    const itemId = event.pulseId;
    const itemName = event.pulseName || "Unknown";
    console.log(`[to-list] ${itemName} (${itemId}) marked as To List`);

    // Step 1: Get linked BM Devices Board item ID
    const linkData = await mondayQuery(`{ items(ids: [${itemId}]) { column_values(ids: ["${BM_BOARD_RELATION}", "${COLOUR_COLUMN}", "${MAIN_BOARD_GRADE_COLUMN}", "${MAIN_BOARD_PARTS_COST_FORMULA}", "${MAIN_BOARD_LABOUR_FORMULA}"]) { id text ... on BoardRelationValue { linked_item_ids } ... on MirrorValue { display_value } ... on FormulaValue { display_value } ... on StatusValue { text } } } }`);
    const cols = linkData?.data?.items?.[0]?.column_values || [];

    const linkCol = cols.find(c => c.id === BM_BOARD_RELATION);
    const bmDeviceItemId = linkCol?.linked_item_ids?.[0] || null;

    if (!bmDeviceItemId) {
      console.log(`[to-list] ${itemName}: no linked BM Devices Board item`);
      await sendSlackAlert(`⚠️ [To List] ${itemName}: No linked BM Devices Board item. Cannot auto-list.`);
      return;
    }

    // Get colour from main board (status column - text works)
    const mainColour = cols.find(c => c.id === COLOUR_COLUMN)?.text?.trim() || "";
    const mainGrade = cols.find(c => c.id === MAIN_BOARD_GRADE_COLUMN)?.text?.trim() || "";
    // Formula/mirror columns use display_value
    const partsCostStr = (cols.find(c => c.id === MAIN_BOARD_PARTS_COST_FORMULA)?.display_value ?? "0").toString().trim();
    const labourStr = (cols.find(c => c.id === MAIN_BOARD_LABOUR_FORMULA)?.display_value ?? "0").toString().trim();
    const partsCost = parseFloat(partsCostStr.replace(/[^0-9.]/g, "")) || 0;
    // Labour formula gives total cost at some rate; we need hours. Assume £24/hr.
    const labourCostRaw = parseFloat(labourStr.replace(/[^0-9.]/g, "")) || 0;
    const labourHours = labourCostRaw / 24; // Convert back to hours

    // Step 2: Get device specs from BM Devices Board
    const specsData = await mondayQuery(`{ items(ids: [${bmDeviceItemId}]) { column_values(ids: ["${BM_RAM_COLUMN}", "${BM_SSD_COLUMN}", "${BM_CPU_COLUMN}", "${BM_GPU_COLUMN}", "${BM_MODEL_NUMBER_COLUMN}", "${BM_SKU_COLUMN}", "${BM_GRADE_COLUMN}", "${BM_PURCHASE_PRICE_COLUMN}", "${BM_LISTING_ID_COLUMN}", "${BM_LISTING_UUID_COLUMN}"]) { id text } } }`);
    const bmCols = specsData?.data?.items?.[0]?.column_values || [];

    const deviceSpecs = {
      ram: bmCols.find(c => c.id === BM_RAM_COLUMN)?.text?.trim() || "",
      ssd: bmCols.find(c => c.id === BM_SSD_COLUMN)?.text?.trim() || "",
      cpu: bmCols.find(c => c.id === BM_CPU_COLUMN)?.text?.trim() || "",
      gpu: bmCols.find(c => c.id === BM_GPU_COLUMN)?.text?.trim() || "",
      modelNumber: bmCols.find(c => c.id === BM_MODEL_NUMBER_COLUMN)?.text?.trim() || "",
      sku: bmCols.find(c => c.id === BM_SKU_COLUMN)?.text?.trim() || "",
      bmGrade: bmCols.find(c => c.id === BM_GRADE_COLUMN)?.text?.trim() || "",
      purchasePrice: parseFloat(bmCols.find(c => c.id === BM_PURCHASE_PRICE_COLUMN)?.text?.trim() || "0") || 0,
      existingListingId: bmCols.find(c => c.id === BM_LISTING_ID_COLUMN)?.text?.trim() || "",
      existingListingUuid: bmCols.find(c => c.id === BM_LISTING_UUID_COLUMN)?.text?.trim() || "",
    };

    console.log(`[to-list] ${itemName}: specs =`, JSON.stringify(deviceSpecs));

    // Step 3: Colour hard gate
    const colourResult = mapColour(mainColour);
    if (!colourResult) {
      console.log(`[to-list] ${itemName}: unmapped colour "${mainColour}"`);
      await sendSlackAlert(`🚫 [To List] ${itemName}: Colour "${mainColour}" not mapped to BM SKU. Cannot auto-list. Add to colour-map.js.`);
      return;
    }
    const colourSlug = colourResult.slug;

    // Step 4: Determine BM grade
    // Use BM Devices Board grade first, then fall back to Main Board Final Grade
    const gradeSource = deviceSpecs.bmGrade || mainGrade;
    const bmGrade = mapGrade(gradeSource);
    if (!bmGrade) {
      console.log(`[to-list] ${itemName}: unmapped grade "${gradeSource}"`);
      await sendSlackAlert(`🚫 [To List] ${itemName}: Grade "${gradeSource}" not mapped. Cannot auto-list. Add to grade-map.js.`);
      return;
    }

    console.log(`[to-list] ${itemName}: colour=${colourSlug}, grade=${bmGrade}, model=${deviceSpecs.modelNumber}`);

    // Step 5: Search listings cache
    // First try by specs (model number + RAM + SSD + grade)
    const specMatches = findListingsBySpecs(LISTINGS_CACHE_PATH, {
      modelNumber: deviceSpecs.modelNumber,
      ram: deviceSpecs.ram,
      ssd: deviceSpecs.ssd,
      grade: bmGrade,
    });

    // Filter spec matches by colour in SKU
    const colourMatches = specMatches.filter(l => {
      const skuLower = (l.sku || "").toLowerCase();
      return skuLower.includes(colourSlug);
    });

    // Split into active (qty > 0) and offline (qty === 0)
    const activeListings = colourMatches.filter(l => l.quantity > 0);
    const offlineListings = colourMatches.filter(l => l.quantity === 0);

    // --- PATH A: Active listing exists ---
    if (activeListings.length > 0) {
      if (activeListings.length > 1) {
        await sendSlackAlert(`⚠️ [To List] ${itemName}: Multiple active listings found for ${deviceSpecs.modelNumber} ${bmGrade} ${colourSlug}. Manual resolution needed.\n${activeListings.map(l => `- Listing ${l.listing_id}: qty=${l.quantity}, price=£${l.price}`).join("\n")}`);
        return;
      }

      const listing = activeListings[0];
      const newQty = listing.quantity + 1;
      console.log(`[to-list] PATH A: ${itemName}: incrementing listing ${listing.listing_id} qty ${listing.quantity} → ${newQty}`);

      // POST to BM API to update quantity
      try {
        const bmResp = await fetch(`${BM_LISTINGS_API_BASE}/${listing.listing_id}`, {
          method: "POST",
          headers: BM_API_HEADERS,
          body: JSON.stringify({
            quantity: newQty,
            pub_state: 2,
          }),
        });

        if (!bmResp.ok) {
          const errText = await bmResp.text();
          throw new Error(`HTTP ${bmResp.status}: ${errText.substring(0, 300)}`);
        }

        console.log(`[to-list] PATH A: BM listing ${listing.listing_id} updated successfully`);

        // Write listing UUID + ID to Monday BM Devices Board
        const listingUuid = listing.product_id || "";
        const colVals = JSON.stringify({
          [BM_LISTING_ID_COLUMN]: String(listing.listing_id),
          [BM_LISTING_UUID_COLUMN]: listingUuid,
        }).replace(/"/g, '\\"');
        await mondayQuery(`mutation { change_multiple_column_values( board_id: ${BM_BOARD_ID}, item_id: ${bmDeviceItemId}, column_values: "${colVals}" ) { id } }`);

        // Update Main Board status24 to Listed (index 7)
        await updateMondayStatus(itemId, "Listed");

        await sendSlackAlert(`✅ [Listed] ${itemName}: Added to listing ${listing.listing_id} (qty: ${listing.quantity} → ${newQty}) at £${listing.price}`);

      } catch (err) {
        console.error(`[to-list] PATH A: BM API error for ${itemName}:`, err.message);
        await sendSlackAlert(`❌ [To List] ${itemName}: BM API failed updating listing ${listing.listing_id}: ${err.message.substring(0, 200)}. Status left as To List.`);
      }
      return;
    }

    // --- PATH B: No active listing ---
    console.log(`[to-list] PATH B: ${itemName}: no active listing found, checking offline...`);

    if (offlineListings.length > 0) {
      // Found offline listing slot — need pricing decision
      const listing = offlineListings[0];
      console.log(`[to-list] PATH B: Found offline listing ${listing.listing_id} for ${itemName}`);

      // Read sell prices
      let sellPrice = null;
      try {
        const sellPricesRaw = fs.readFileSync(SELL_PRICES_PATH, "utf8");
        const sellPricesData = JSON.parse(sellPricesRaw);
        const models = sellPricesData.models || {};

        // Try to find sell price by matching model name to sell prices
        // Grade mapping: FAIR→Fair, GOOD→Good, VERY_GOOD→Excellent (BM's "Very Good" maps to Excellent in sell prices)
        const gradeToSellKey = { FAIR: "Fair", GOOD: "Good", VERY_GOOD: "Excellent", EXCELLENT: "Premium" };
        const sellGradeKey = gradeToSellKey[bmGrade] || bmGrade;

        for (const [modelName, modelData] of Object.entries(models)) {
          if (!modelData.scraped || !modelData.grades) continue;
          // Match by product_id/UUID if available
          if (modelData.uuid === listing.product_id) {
            const gradeData = modelData.grades[sellGradeKey];
            if (gradeData && gradeData.price) {
              sellPrice = gradeData.price;
            }
            break;
          }
        }
      } catch (err) {
        console.error(`[to-list] PATH B: Failed to read sell prices:`, err.message);
      }

      if (sellPrice) {
        // Run profitability calculation
        const profitability = calculateProfitability({
          sellPrice,
          purchaseCost: deviceSpecs.purchasePrice,
          partsCost,
          labourHours,
        });

        console.log(`[to-list] PATH B: ${itemName}: profitability =`, JSON.stringify(profitability));

        if (profitability.meetsAutoListThreshold) {
          // Auto-list: reactivate listing with qty=1
          console.log(`[to-list] PATH B: ${itemName}: margin ${(profitability.netMargin * 100).toFixed(1)}%, profit £${profitability.netProfit.toFixed(2)} — auto-listing`);

          try {
            const bmResp = await fetch(`${BM_LISTINGS_API_BASE}/${listing.listing_id}`, {
              method: "POST",
              headers: BM_API_HEADERS,
              body: JSON.stringify({
                quantity: 1,
                price: sellPrice,
                pub_state: 2,
              }),
            });

            if (!bmResp.ok) {
              const errText = await bmResp.text();
              throw new Error(`HTTP ${bmResp.status}: ${errText.substring(0, 300)}`);
            }

            // Write listing UUID + ID to Monday BM Devices Board
            const colVals = JSON.stringify({
              [BM_LISTING_ID_COLUMN]: String(listing.listing_id),
              [BM_LISTING_UUID_COLUMN]: listing.product_id || "",
            }).replace(/"/g, '\\"');
            await mondayQuery(`mutation { change_multiple_column_values( board_id: ${BM_BOARD_ID}, item_id: ${bmDeviceItemId}, column_values: "${colVals}" ) { id } }`);

            await updateMondayStatus(itemId, "Listed");

            await sendSlackAlert(`✅ [Listed] ${itemName}: Reactivated listing ${listing.listing_id} at £${sellPrice} (qty: 0 → 1)\n${formatBreakdown(profitability)}`);

          } catch (err) {
            console.error(`[to-list] PATH B auto-list error for ${itemName}:`, err.message);
            await sendSlackAlert(`❌ [To List] ${itemName}: BM API failed reactivating listing ${listing.listing_id}: ${err.message.substring(0, 200)}. Status left as To List.`);
          }
        } else {
          // Below threshold: Slack approval request
          console.log(`[to-list] PATH B: ${itemName}: below threshold, requesting approval`);
          await sendSlackAlert(`🔔 [Approval Needed] ${itemName}: Listing ${listing.listing_id} ready but margins below threshold.\n\n${formatBreakdown(profitability)}\n\nSet status to "Listed" on Monday to manually approve.`);
        }
      } else {
        // No sell price found: alert for manual pricing
        console.log(`[to-list] PATH B: ${itemName}: no sell price found`);
        await sendSlackAlert(`⚠️ [To List] ${itemName}: Offline listing ${listing.listing_id} found but no sell price available. Manual pricing needed.\nModel: ${deviceSpecs.modelNumber}, Grade: ${bmGrade}, Colour: ${colourSlug}`);
      }
      return;
    }

    // --- PATH B continued: No listing slot at all ---
    // Check if there are ANY listings for this product_id+grade (without colour filter)
    const anyMatches = specMatches.length > 0;

    if (!anyMatches) {
      // No listing slot exists at all
      console.log(`[to-list] PATH B: ${itemName}: no listing slot found at all`);
      await sendSlackAlert(`⚠️ [To List] ${itemName}: No listing slot found for ${deviceSpecs.modelNumber} ${deviceSpecs.ram} ${deviceSpecs.ssd} ${bmGrade}. Manual listing creation needed on BackMarket.\nColour: ${mainColour} (${colourSlug})`);
      return;
    }

    // Found listings for this spec but not matching colour
    console.log(`[to-list] PATH B: ${itemName}: listings exist but no colour match for ${colourSlug}`);
    await sendSlackAlert(`⚠️ [To List] ${itemName}: Listings exist for ${deviceSpecs.modelNumber} ${bmGrade} but none match colour "${mainColour}" (${colourSlug}). Manual resolution needed.`);

  } catch (err) {
    console.error("[to-list] Error:", err);
    await sendSlackAlert(`❌ [To List] Error processing ${req.body?.event?.pulseName || "unknown"}: ${err.message.substring(0, 200)}`).catch(() => {});
  }
});

// Health check
app.get("/webhook/icloud-check/health", (req, res) => {
  const state = loadState();
  res.json({ status: "ok", service: "icloud-checker", trackedOrders: Object.keys(state).length, recheckIntervalMin: RECHECK_INTERVAL_MS / 60000 });
});

// Start
app.listen(PORT, () => {
  console.log(`iCloud Checker running on port ${PORT}`);
  console.log(`Recheck cron: every ${RECHECK_INTERVAL_MS / 60000} minutes`);
  setTimeout(() => {
    recheckCron().catch((err) => console.error("Recheck cron error:", err));
    setInterval(() => recheckCron().catch((err) => console.error("Recheck cron error:", err)), RECHECK_INTERVAL_MS);
  }, 60000);
});
