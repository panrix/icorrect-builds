#!/usr/bin/env node
/**
 * bm-shipping — SOP 09 Part B: Ship Confirmation Webhook Service
 *
 * Extracted from icloud-checker monolith. Handles Monday webhook
 * when status4 → Shipped (index 160). Notifies BM with tracking
 * number and serial number, moves BM Devices item to Shipped group.
 *
 * Port: 8013 (127.0.0.1)
 * Nginx route: /webhook/bm/shipping-confirmed → 127.0.0.1:8013
 *
 * Additions over monolith:
 *   - Serial number included in BM API payload
 *   - BM Devices item moved to Shipped group after success
 *   - Dual notification (Slack + Telegram)
 *
 * CRITICAL:
 *   - No tracking number → HARD GATE, do not notify BM
 *   - No serial number → HARD GATE, do not notify BM
 *   - No BM order ID → HARD GATE, do not notify BM
 *   - 4xx from BM: do NOT retry
 *   - 5xx from BM: retry ONCE after 30s
 */

const express = require("express");
const app = express();
app.use(express.json());

const PORT = 8013;
const HOST = "127.0.0.1";

// ─── Config ───────────────────────────────────────────────────────
const MONDAY_TOKEN = process.env.MONDAY_APP_TOKEN;
const BM_AUTH = process.env.BM_AUTH;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const BOARD_ID = "349212843";
const BM_DEVICES_BOARD_ID = "3892194968";
const STATUS4_COLUMN = "status4";
const TRACKING_COLUMN = "text53";
const SERIAL_COLUMN = "text4";
const BM_BOARD_RELATION = "board_relation5"; // Main Board → BM Devices Board
const BM_SALES_ORDER_COLUMN = "text_mkye7p1c";
const BM_DEVICE_LISTING_ID_COLUMN = "text_mkyd4bx3";
const BM_DEVICE_SOLD_TO_COLUMN = "text4";
const SHIPPED_INDEX = 160;
const SHIPPED_GROUP = "new_group269";

const BM_SALES_API_BASE = "https://www.backmarket.co.uk/ws/orders";
const BM_API_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "Accept-Language": "en-gb",
  Authorization: BM_AUTH,
  "User-Agent": "BM-iCorrect-Shipping/2.0;ricky@icorrect.co.uk",
};

const BM_SALES_SLACK_CHANNEL =
  process.env.BM_SALES_SLACK_CHANNEL || "C0A21J30M1C";
const BM_TELEGRAM_CHAT = "-1003888456344";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Monday API ───────────────────────────────────────────────────
async function mondayQuery(query) {
  const resp = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: MONDAY_TOKEN,
    },
    body: JSON.stringify({ query }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`Monday HTTP ${resp.status}: ${JSON.stringify(data).substring(0, 300)}`);
  }
  if (data.errors?.length) {
    throw new Error(`Monday GraphQL error: ${data.errors[0].message}`);
  }
  return data;
}

// ─── Slack ────────────────────────────────────────────────────────
async function slackPost(text) {
  if (!SLACK_BOT_TOKEN) return;
  try {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel: BM_SALES_SLACK_CHANNEL, text }),
    });
  } catch (e) {
    console.warn("[shipping] Slack failed:", e.message);
  }
}

// ─── Telegram ─────────────────────────────────────────────────────
async function telegramPost(text) {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: BM_TELEGRAM_CHAT, text }),
      }
    );
  } catch (e) {
    console.warn("[shipping] Telegram failed:", e.message);
  }
}

async function notify(text) {
  await Promise.all([slackPost(text), telegramPost(text)]);
}

// ─── Monday comment ───────────────────────────────────────────────
async function postMondayComment(itemId, body) {
  const escaped = body
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
  await mondayQuery(
    `mutation { create_update( item_id: ${itemId}, body: "${escaped}" ) { id } }`
  );
}

async function clearBmDeviceSaleFields(bmDeviceItemId) {
  const values = JSON.stringify({
    [BM_DEVICE_LISTING_ID_COLUMN]: "",
    [BM_DEVICE_SOLD_TO_COLUMN]: "",
  });
  await mondayQuery(
    `mutation { change_multiple_column_values(board_id: ${BM_DEVICES_BOARD_ID}, item_id: ${bmDeviceItemId}, column_values: ${JSON.stringify(values)}) { id } }`
  );
}

// ─── Webhook handler ──────────────────────────────────────────────
app.post("/webhook/bm/shipping-confirmed", async (req, res) => {
  const body = req.body;

  // Monday webhook challenge
  if (body.challenge) {
    console.log("[shipping] Challenge received");
    return res.json({ challenge: body.challenge });
  }

  // Always respond 200 to Monday immediately
  res.status(200).send("OK");

  try {
    const event = body.event;
    if (!event) return;
    if (event.columnId !== STATUS4_COLUMN) return;
    if (String(event.boardId) !== BOARD_ID) return;

    // Parse status value
    let value = {};
    try {
      value =
        typeof event.value === "string"
          ? JSON.parse(event.value)
          : event.value || {};
    } catch {}
    const index = value.index ?? value?.label?.index;
    if (index !== SHIPPED_INDEX) return;

    const itemId = event.pulseId;
    const itemName = event.pulseName || "Unknown";
    console.log(`[shipping] ${itemName} (${itemId}) marked as Shipped`);

    // ── Dedup: check recent updates for "BM notified" ──
    const updatesData = await mondayQuery(
      `{ items(ids: [${itemId}]) { updates(limit: 5) { text_body } } }`
    );
    const recentUpdates = updatesData?.data?.items?.[0]?.updates || [];
    if (
      recentUpdates.some(
        (u) => u.text_body && u.text_body.includes("BM notified")
      )
    ) {
      console.log(`[shipping] ${itemName}: already notified BM, skipping`);
      return;
    }

    // ── Fetch tracking, serial, and linked BM Device from Main Board ──
    const itemData = await mondayQuery(`{
      items(ids: [${itemId}]) {
        column_values(ids: ["${TRACKING_COLUMN}", "${SERIAL_COLUMN}", "${BM_BOARD_RELATION}"]) {
          id text
          ... on BoardRelationValue { linked_item_ids }
        }
      }
    }`);
    const cols = itemData?.data?.items?.[0]?.column_values || [];

    const trackingRaw =
      cols.find((c) => c.id === TRACKING_COLUMN)?.text?.trim() || "";
    const trackingNumber = trackingRaw.replace(/\s/g, ""); // Strip spaces
    const serialNumber =
      cols.find((c) => c.id === SERIAL_COLUMN)?.text?.trim() || "";
    const linkCol = cols.find((c) => c.id === BM_BOARD_RELATION);
    const bmDeviceItemId = linkCol?.linked_item_ids?.[0] || null;

    // ── HARD GATE: No tracking number ──
    if (!trackingNumber) {
      console.log(`[shipping] ${itemName}: no tracking number found`);
      await notify(
        `⚠️ ${itemName} marked Shipped but no tracking number found. Manual BM update needed.`
      );
      return;
    }
    console.log(`[shipping] Tracking: ${trackingNumber}`);

    // ── HARD GATE: No serial number ──
    if (!serialNumber) {
      console.log(`[shipping] ${itemName}: no serial number found`);
      await notify(
        `⚠️ ${itemName} marked Shipped (tracking: ${trackingNumber}) but no serial number found on the Main Board. BM was not notified. Add the serial and retry.`
      );
      return;
    }

    // ── HARD GATE: No linked BM Devices item ──
    if (!bmDeviceItemId) {
      console.log(
        `[shipping] ${itemName}: no linked BM Devices item (board_relation5 empty)`
      );
      await notify(
        `⚠️ ${itemName} marked Shipped (tracking: ${trackingNumber}) but no linked BM device found. Manual BM update needed.`
      );
      return;
    }

    // ── Fetch BM order ID from BM Devices Board ──
    const bmData = await mondayQuery(
      `{ items(ids: [${bmDeviceItemId}]) { column_values(ids: ["${BM_SALES_ORDER_COLUMN}"]) { id text } } }`
    );
    const bmOrderId =
      bmData?.data?.items?.[0]?.column_values?.[0]?.text?.trim() || "";

    // ── HARD GATE: No BM order ID ──
    if (!bmOrderId) {
      console.log(
        `[shipping] ${itemName}: no BM order ID on devices board item ${bmDeviceItemId}`
      );
      await notify(
        `⚠️ ${itemName} has tracking ${trackingNumber} but no BM order ID found on devices board. Manual BM update needed.`
      );
      return;
    }
    console.log(`[shipping] BM Order: ${bmOrderId}, Serial: ${serialNumber}`);

    // ── Notify BM of shipment ──
    console.log(
      `[shipping] Updating BM order ${bmOrderId} with tracking ${trackingNumber}`
    );

    const bmPayload = {
      order_id: bmOrderId,
      new_state: 3,
      tracking_number: trackingNumber,
      tracking_url: `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`,
      shipper: "Royal Mail Express",
      serial_number: serialNumber,
    };

    const bmUpdateShipping = async () => {
      const resp = await fetch(`${BM_SALES_API_BASE}/${bmOrderId}`, {
        method: "POST",
        headers: BM_API_HEADERS,
        body: JSON.stringify(bmPayload),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        const err = new Error(
          `HTTP ${resp.status}: ${errText.substring(0, 300)}`
        );
        err.statusCode = resp.status;
        throw err;
      }
      return resp;
    };

    try {
      await bmUpdateShipping();
      console.log(
        `[shipping] BM order ${bmOrderId} updated successfully`
      );

      const timestamp = new Date()
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);

      // Monday comment (dedup marker)
      await postMondayComment(
        itemId,
        `✅ BM notified of shipment [${timestamp}]\nTracking: ${trackingNumber}\nSerial: ${serialNumber}\nOrder: ${bmOrderId}`
      );

      // Notifications
      await notify(
        `✅ BM notified of shipment: ${itemName} — Order ${bmOrderId} — Tracking ${trackingNumber}`
      );

      console.log(
        `[shipping] Clearing BM listing_id and sold-to on BM Device ${bmDeviceItemId}`
      );
      try {
        await clearBmDeviceSaleFields(bmDeviceItemId);
        console.log("[shipping] BM Device sale fields cleared");
      } catch (clearErr) {
        console.error(
          "[shipping] Failed to clear BM Device sale fields:",
          clearErr.message
        );
        await notify(
          `⚠️ BM notified for ${itemName} but failed to clear BM listing_id / Sold to on the BM Device item. Manual clear needed.`
        );
      }

      // Move BM Devices item to Shipped group
      console.log(`[shipping] Moving BM Device ${bmDeviceItemId} to Shipped group`);
      try {
        await mondayQuery(
          `mutation { move_item_to_group( item_id: ${bmDeviceItemId}, group_id: "${SHIPPED_GROUP}" ) { id } }`
        );
        console.log(`[shipping] BM Device moved to Shipped group`);
      } catch (moveErr) {
        console.error(
          "[shipping] Failed to move BM Device to Shipped group:",
          moveErr.message
        );
        await notify(
          `⚠️ BM notified for ${itemName} but failed to move BM Device to Shipped group. Manual move needed.`
        );
      }
    } catch (err) {
      console.error(
        `[shipping] BM update failed for ${bmOrderId}:`,
        err.message
      );

      if (err.statusCode >= 500) {
        // Retry ONCE after 30s on 5xx
        console.log("[shipping] 5xx error, retrying in 30s...");
        await sleep(30000);
        try {
          await bmUpdateShipping();
          console.log(
            `[shipping] BM order ${bmOrderId} updated on retry`
          );
          const timestamp = new Date()
            .toISOString()
            .replace("T", " ")
            .substring(0, 19);
          await postMondayComment(
            itemId,
            `✅ BM notified of shipment [${timestamp}]\nTracking: ${trackingNumber}\nSerial: ${serialNumber}\nOrder: ${bmOrderId}`
          );
          await notify(
            `✅ BM notified of shipment (retry): ${itemName} — Order ${bmOrderId} — Tracking ${trackingNumber}`
          );

          try {
            await clearBmDeviceSaleFields(bmDeviceItemId);
          } catch (clearErr) {
            console.error(
              "[shipping] Failed to clear BM Device sale fields after retry:",
              clearErr.message
            );
            await notify(
              `⚠️ BM notified for ${itemName} on retry but failed to clear BM listing_id / Sold to on the BM Device item. Manual clear needed.`
            );
          }

          // Move on retry success too
          try {
            await mondayQuery(
              `mutation { move_item_to_group( item_id: ${bmDeviceItemId}, group_id: "${SHIPPED_GROUP}" ) { id } }`
            );
          } catch {}
        } catch (retryErr) {
          console.error("[shipping] Retry also failed:", retryErr.message);
          await notify(
            `❌ BM update FAILED for ${itemName} — Order ${bmOrderId}: ${retryErr.message.substring(0, 200)}. Manual update needed.`
          );
        }
      } else {
        // 4xx — don't retry
        await notify(
          `❌ BM update FAILED for ${itemName} — Order ${bmOrderId}: ${err.message.substring(0, 200)}. No retry on ${err.statusCode}. Manual update needed.`
        );
      }
    }
  } catch (err) {
    console.error("[shipping] Error:", err);
  }
});

// ─── Health check ─────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ service: "bm-shipping", status: "ok", port: PORT });
});

// ─── Start ────────────────────────────────────────────────────────
app.listen(PORT, HOST, () => {
  console.log(`[bm-shipping] Listening on ${HOST}:${PORT}`);
  console.log(
    `[bm-shipping] Sends: tracking + serial. Moves BM Device to Shipped group.`
  );
});
