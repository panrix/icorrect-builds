#!/usr/bin/env node
/**
 * bm-payout — SOP 03b: Trade-in Payout Webhook Service
 *
 * Extracted from icloud-checker monolith. Handles Monday webhook
 * when status24 → Pay-Out (index 12). Validates pre-flight checks,
 * calls BM validate endpoint (IRREVERSIBLE), updates Monday.
 *
 * Port: 8012 (127.0.0.1)
 * Nginx route: /webhook/bm/payout → 127.0.0.1:8012
 *
 * Pre-flight checks (policy-enforced):
 *   1. BM Trade-in ID exists
 *   2. iCloud is NOT locked
 *   3. Status is actually Pay-Out (not stale webhook)
 *
 * CRITICAL: BM validate is IMMEDIATE and IRREVERSIBLE.
 */

const express = require("express");
const { notificationHealthCheck, notifyBm } = require("../../scripts/lib/notifications");
const app = express();
app.use(express.json());

const PORT = 8012;
const HOST = "127.0.0.1";

// ─── Config ───────────────────────────────────────────────────────
const MONDAY_TOKEN = process.env.MONDAY_APP_TOKEN;
const BM_AUTH = process.env.BM_AUTH;

const BOARD_ID = "349212843";
const STATUS_COLUMN = "status24";
const BM_TRADEIN_ID_COLUMN = "text_mky01vb4";
const ICLOUD_COLUMN = "color_mkyp4jjh";
const PAYOUT_INDEX = 12;
const PURCHASED_INDEX = 6;

const BM_API_BASE = "https://www.backmarket.co.uk/ws/buyback/v1/orders";
const BM_API_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "Accept-Language": "en-gb",
  Authorization: BM_AUTH,
  "User-Agent": "BM-iCorrect-Payout/2.0;ricky@icorrect.co.uk",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const inflightPayouts = new Set();

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

async function notify(text) {
  await notifyBm(text, { slackChannel: "tradeIn", logger: console });
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

async function postFailureMarker(itemId, reason, detail = "") {
  try {
    await postMondayComment(
      itemId,
      `⚠️ Payout automation blocked\nReason: ${reason}${detail ? `\n${detail}` : ""}`
    );
  } catch (error) {
    console.warn("[payout] Failed to write Monday failure marker:", error.message);
  }
}

// ─── Webhook handler ──────────────────────────────────────────────
app.post("/webhook/bm/payout", async (req, res) => {
  const body = req.body;

  // Monday webhook challenge
  if (body.challenge) {
    console.log("[payout] Challenge received");
    return res.json({ challenge: body.challenge });
  }

  // Always respond 200 to Monday immediately
  res.status(200).send("OK");

  try {
    const event = body.event;
    if (!event) return;
    if (event.columnId !== STATUS_COLUMN) return;
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
    if (index !== PAYOUT_INDEX) return;

    const itemId = event.pulseId;
    const itemName = event.pulseName || "Unknown";
    console.log(`[payout] ${itemName} (${itemId}) marked as Pay-Out`);

    if (inflightPayouts.has(itemId)) {
      console.log(`[payout] ${itemName}: in-flight dedup hit, skipping`);
      return;
    }
    inflightPayouts.add(itemId);

    // ── Dedup: check recent updates for "Payout validated" ──
    const updatesData = await mondayQuery(
      `{ items(ids: [${itemId}]) { updates(limit: 5) { text_body } } }`
    );
    const recentUpdates = updatesData?.data?.items?.[0]?.updates || [];
    if (
      recentUpdates.some(
        (u) => u.text_body && u.text_body.includes("Payout validated")
      )
    ) {
      console.log(`[payout] ${itemName}: already paid out (dedup hit), skipping`);
      return;
    }

    // ── Pre-flight: fetch item data ──
    const itemData = await mondayQuery(`{
      items(ids: [${itemId}]) {
        column_values(ids: ["${STATUS_COLUMN}", "${BM_TRADEIN_ID_COLUMN}", "${ICLOUD_COLUMN}"]) {
          id text
          ... on StatusValue { index }
        }
      }
    }`);
    const cols = itemData?.data?.items?.[0]?.column_values || [];

    // ── Check 1: Idempotency — is status still Pay-Out? ──
    const currentStatus = cols.find((c) => c.id === STATUS_COLUMN);
    if (currentStatus?.index !== undefined && currentStatus.index !== PAYOUT_INDEX) {
      console.log(
        `[payout] ${itemName}: status24 is now index ${currentStatus.index}, not Pay-Out. Stale webhook, skipping.`
      );
      await postFailureMarker(itemId, "stale webhook", `Current status index: ${currentStatus.index}`);
      return;
    }

    // ── Check 2: BM Trade-in ID exists ──
    const bmTradeInId =
      cols.find((c) => c.id === BM_TRADEIN_ID_COLUMN)?.text?.trim() || "";
    if (!bmTradeInId) {
      console.log(`[payout] ${itemName}: no BM trade-in ID found`);
      await postFailureMarker(itemId, "missing BM trade-in ID", `Column: ${BM_TRADEIN_ID_COLUMN}`);
      await notify(
        `⚠️ ${itemName} marked Pay-Out but no BM trade-in ID found. Manual payout needed.`
      );
      return;
    }

    // ── Check 3: iCloud is NOT locked ──
    const icloudStatus =
      cols
        .find((c) => c.id === ICLOUD_COLUMN)
        ?.text?.trim()
        ?.toLowerCase() || "";
    if (icloudStatus === "locked" || icloudStatus === "on") {
      console.log(
        `[payout] ${itemName}: iCloud is "${icloudStatus}" — BLOCKED`
      );
      await postFailureMarker(itemId, "iCloud locked", `iCloud status: ${icloudStatus}`);
      await notify(
        `⛔ ${itemName} marked Pay-Out but iCloud is ${icloudStatus}. Payout BLOCKED. Resolve iCloud lock before retrying.`
      );
      return;
    }

    console.log(`[payout] Pre-flight passed for ${bmTradeInId}`);

    // ── Execute payout via BM API ──
    console.log(`[payout] Validating BM buyback order ${bmTradeInId}`);

    const bmValidatePayout = async () => {
      const resp = await fetch(`${BM_API_BASE}/${bmTradeInId}/validate`, {
        method: "PUT",
        headers: BM_API_HEADERS,
        body: JSON.stringify({}),
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
      await bmValidatePayout();
      console.log(`[payout] BM buyback ${bmTradeInId} validated successfully`);

      // Update Monday status24 → Purchased
      const columnValues = JSON.stringify({
        [STATUS_COLUMN]: { label: "Purchased" },
      }).replace(/"/g, '\\"');
      try {
        await mondayQuery(
          `mutation { change_multiple_column_values( board_id: ${BOARD_ID}, item_id: ${itemId}, column_values: "${columnValues}" ) { id } }`
        );
        console.log(
          `[payout] Monday status updated to Purchased for ${itemName}`
        );
      } catch (mondayErr) {
        console.error("[payout] Monday update failed:", mondayErr.message);
        await notify(
          `⚠️ Payout sent to BM for ${itemName} (${bmTradeInId}) but Monday not updated. Set to Purchased manually.`
        );
      }

      const timestamp = new Date()
        .toISOString()
        .replace("T", " ")
        .substring(0, 19);
      await postMondayComment(
        itemId,
        `✅ Payout validated [${timestamp}]\nBM Trade-in: ${bmTradeInId}\niCloud: ${icloudStatus || "clear"}`
      );
      await notify(`✅ Payout sent for ${itemName} — ${bmTradeInId}`);
    } catch (err) {
      console.error(
        `[payout] BM validate failed for ${bmTradeInId}:`,
        err.message
      );

      if (err.statusCode >= 500) {
        // Retry ONCE after 30s on 5xx
        console.log("[payout] 5xx error, retrying in 30s...");
        await sleep(30000);
        try {
          await bmValidatePayout();
          console.log(
            `[payout] BM buyback ${bmTradeInId} validated on retry`
          );

          const columnValues = JSON.stringify({
            [STATUS_COLUMN]: { label: "Purchased" },
          }).replace(/"/g, '\\"');
          try {
            await mondayQuery(
              `mutation { change_multiple_column_values( board_id: ${BOARD_ID}, item_id: ${itemId}, column_values: "${columnValues}" ) { id } }`
            );
          } catch (mondayErr) {
            await notify(
              `⚠️ Payout sent to BM for ${itemName} (${bmTradeInId}) but Monday not updated. Set to Purchased manually.`
            );
          }

          await notify(
            `✅ Payout sent for ${itemName} — ${bmTradeInId} (retry succeeded)`
          );
        } catch (retryErr) {
          console.error("[payout] Retry also failed:", retryErr.message);
          await postFailureMarker(itemId, "BM payout validate failed after retry", `BM Trade-in: ${bmTradeInId}\n${retryErr.message.substring(0, 200)}`);
          await notify(
            `❌ Payout FAILED for ${itemName} — ${bmTradeInId}: ${retryErr.message.substring(0, 200)}. Left as Pay-Out for safety net cron.`
          );
        }
      } else {
        // 4xx — don't retry, don't change status
        await postFailureMarker(itemId, `BM payout validate failed (${err.statusCode || "unknown status"})`, `BM Trade-in: ${bmTradeInId}\n${err.message.substring(0, 200)}`);
        await notify(
          `❌ Payout FAILED for ${itemName} — ${bmTradeInId}: ${err.message.substring(0, 200)}. Status NOT changed.`
        );
      }
    }
  } catch (err) {
    console.error("[payout] Error:", err);
  } finally {
    const itemId = body?.event?.pulseId;
    if (itemId) {
      inflightPayouts.delete(itemId);
    }
  }
});

// ─── Health check ─────────────────────────────────────────────────
app.get("/health", async (req, res) => {
  res.json({
    service: "bm-payout",
    status: "ok",
    port: PORT,
    notifications: await notificationHealthCheck(),
  });
});

// ─── Start ────────────────────────────────────────────────────────
app.listen(PORT, HOST, () => {
  console.log(`[bm-payout] Listening on ${HOST}:${PORT}`);
  console.log(`[bm-payout] Pre-flight checks: BM trade-in ID, iCloud lock`);
});
