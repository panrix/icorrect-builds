#!/usr/bin/env node
/**
 * status-notifications — Monday status4 → Intercom notification emails
 *
 * Replaces: Cloudflare Worker icorrect-macros (status path only) + n8n workflow TDBSUDxpcW8e56y4
 *
 * Port: 8014 (127.0.0.1)
 * Nginx route: /webhook/monday/status-notification → 127.0.0.1:8014
 *
 * SHADOW_MODE=true → logs rendered templates without sending to Intercom
 */

const express = require("express");
const fs = require("fs");
const { TEMPLATES } = require("./templates");

const app = express();
app.use(express.json());

const PORT = 8014;
const HOST = "127.0.0.1";

// ─── Config ───────────────────────────────────────────────────────
const MONDAY_TOKEN = process.env.MONDAY_APP_TOKEN;
const INTERCOM_TOKEN = process.env.INTERCOM_API_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SHADOW_MODE = process.env.SHADOW_MODE === "true";

const BOARD_ID = "349212843";
const INTERCOM_ADMIN_ID = "9702337";
const SLACK_ALERT_CHANNEL = process.env.STATUS_NOTIFY_SLACK_CHANNEL || "C09VB5G7CTU";
const SHADOW_LOG = "/home/ricky/logs/status-notifications-shadow.jsonl";

// ─── Column IDs (from Cloudflare Worker + board audit) ────────────
const COLUMNS = {
  STATUS: "status4",
  SERVICE: "service",
  CLIENT_TYPE: "status",
  PASSCODE: "text8",
  EMAIL: "text5",
  PHONE: "text00",
  COMPANY: "text15",
  IMEI_SN: "text4",
  BOOKING_TIME: "date6",
  GOPHR_LINK: "text_mkzmxq1d",
  GOPHR_TIME_WINDOW: "text_mm084vbh",
  OUTBOUND_TRACKING: "text53",
  INTERCOM_ID: "text_mm087h9p",
  TICKET_LINK: "link1",
};

// ─── Status values (exact Monday labels) ──────────────────────────
const STATUS = {
  RECEIVED: "Received",
  BOOKING_CONFIRMED: "Booking Confirmed",
  COURIER_BOOKED: "Courier Booked",
  READY_TO_COLLECT: "Ready To Collect",
  PASSWORD_REQ: "Password Req",
  RETURN_BOOKED: "Return Booked",
};

const SERVICE = {
  WALK_IN: "Walk-In",
  MAIL_IN: "Mail-In",
  GOPHR_COURIER: "Gophr Courier",
};

const CLIENT_TYPE = {
  WARRANTY: "Warranty",
};

// ─── Webhook type → template mapping ──────────────────────────────
const WEBHOOK_TYPES = {
  RECEIVED_WALKIN: "received-walkin",
  RECEIVED_REMOTE: "received-remote",
  BOOKING_CONFIRMED_STANDARD: "booking-confirmed",
  BOOKING_CONFIRMED_WARRANTY: "booking-confirmed-warranty",
  COURIER_GOPHR: "courier-gophr",
  COURIER_MAILIN_STANDARD: "courier-mailin",
  COURIER_MAILIN_WARRANTY: "courier-warranty",
  READY_WALKIN_STANDARD: "ready-walkin",
  READY_WALKIN_WARRANTY: "ready-warranty",
  PASSWORD_REQUEST_WITH_CODE: "password-request",
  PASSWORD_REQUEST_NO_CODE: "password-request-empty",
  RETURN_COURIER_STANDARD: "return-courier",
  RETURN_COURIER_WARRANTY: "return-courier-warranty",
  RETURN_COURIER_GOPHR: "return-courier-gophr",
};

// ─── Date formatting (ported from n8n Extract Data node) ──────────
function formatBookingDate(bookingValue) {
  if (!bookingValue || !bookingValue.date) return "TBC";

  const dateStr = bookingValue.date;
  const timeStr = bookingValue.time || "09:00:00";

  // Monday API returns UTC — convert to UK local time (handles BST/GMT)
  const utcDate = new Date(dateStr + "T" + timeStr + "Z");
  const londonStr = utcDate.toLocaleString("en-GB", { timeZone: "Europe/London" });
  const [datePart, timePart] = londonStr.split(", ");
  const [d, m, y] = datePart.split("/").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  // Build a UTC date with the already-converted London values
  const date = new Date(Date.UTC(y, m - 1, d, hours, minutes));

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const dayName = days[date.getUTCDay()];
  const dayNum = date.getUTCDate();
  const monthName = months[date.getUTCMonth()];

  const ordinal = (n) => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  let hrs = hours;
  const mins = minutes.toString().padStart(2, "0");
  const ampm = hrs >= 12 ? "PM" : "AM";
  hrs = hrs % 12 || 12;
  const timeFormatted = `${hrs.toString().padStart(2, "0")}:${mins}${ampm}`;

  return `${dayName} ${dayNum}${ordinal(dayNum)} ${monthName} at ${timeFormatted}`;
}

// ─── Monday API ───────────────────────────────────────────────────
async function fetchItemData(itemId) {
  const query = `
    query GetItem($itemId: [ID!]) {
      items(ids: $itemId) {
        id
        name
        column_values {
          id
          text
          value
        }
      }
    }
  `;

  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: MONDAY_TOKEN,
      "API-Version": "2024-01",
    },
    body: JSON.stringify({ query, variables: { itemId: [itemId.toString()] } }),
  });

  const data = await res.json();
  if (data.errors) {
    console.error("[monday] API error:", data.errors);
    return null;
  }

  const item = data.data?.items?.[0];
  if (!item) return null;

  const columnValues = {};
  for (const col of item.column_values) {
    columnValues[col.id] = {
      text: col.text,
      value: col.value ? JSON.parse(col.value) : null,
    };
  }

  return { id: item.id, name: item.name, columnValues };
}

function getColumnText(columnValues, columnId) {
  return columnValues[columnId]?.text || "";
}

function getColumnValue(columnValues, columnId) {
  return columnValues[columnId]?.value || null;
}

// ─── Routing logic (ported from Cloudflare Worker) ────────────────
function determineWebhookType(status, service, clientType, passcode) {
  const isWarranty = clientType === CLIENT_TYPE.WARRANTY;
  const hasPasscode = passcode && passcode.trim() !== "";

  switch (status) {
    case STATUS.RECEIVED:
      if (service === SERVICE.WALK_IN) return WEBHOOK_TYPES.RECEIVED_WALKIN;
      if (service === SERVICE.MAIL_IN || service === SERVICE.GOPHR_COURIER) return WEBHOOK_TYPES.RECEIVED_REMOTE;
      return null;

    case STATUS.BOOKING_CONFIRMED:
      return isWarranty ? WEBHOOK_TYPES.BOOKING_CONFIRMED_WARRANTY : WEBHOOK_TYPES.BOOKING_CONFIRMED_STANDARD;

    case STATUS.COURIER_BOOKED:
      if (service === SERVICE.GOPHR_COURIER) return WEBHOOK_TYPES.COURIER_GOPHR;
      if (service === SERVICE.MAIL_IN) {
        return isWarranty ? WEBHOOK_TYPES.COURIER_MAILIN_WARRANTY : WEBHOOK_TYPES.COURIER_MAILIN_STANDARD;
      }
      return null;

    case STATUS.RETURN_BOOKED:
      if (service === SERVICE.GOPHR_COURIER) return WEBHOOK_TYPES.RETURN_COURIER_GOPHR;
      return isWarranty ? WEBHOOK_TYPES.RETURN_COURIER_WARRANTY : WEBHOOK_TYPES.RETURN_COURIER_STANDARD;

    case STATUS.READY_TO_COLLECT:
      if (service === SERVICE.WALK_IN) {
        return isWarranty ? WEBHOOK_TYPES.READY_WALKIN_WARRANTY : WEBHOOK_TYPES.READY_WALKIN_STANDARD;
      }
      return null;

    case STATUS.PASSWORD_REQ:
      return hasPasscode ? WEBHOOK_TYPES.PASSWORD_REQUEST_WITH_CODE : WEBHOOK_TYPES.PASSWORD_REQUEST_NO_CODE;

    default:
      return null;
  }
}

// ─── Intercom API ─────────────────────────────────────────────────
const INTERCOM_HEADERS = {
  Authorization: `Bearer ${INTERCOM_TOKEN}`,
  "Content-Type": "application/json",
  "Intercom-Version": "2.11",
};

async function intercomGet(path) {
  const res = await fetch(`https://api.intercom.io${path}`, { headers: INTERCOM_HEADERS });
  if (!res.ok) throw new Error(`Intercom GET ${path} failed: ${res.status}`);
  return res.json();
}

async function intercomPost(path, body) {
  const res = await fetch(`https://api.intercom.io${path}`, {
    method: "POST",
    headers: INTERCOM_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Intercom POST ${path} failed: ${res.status} — ${text}`);
  }
  return res.json();
}

// Contact name merge (ported from n8n Merge Contact Name node)
function extractFirstName(contact, itemName) {
  if (contact?.name) return contact.name.split(" ")[0];
  if (contact?.first_name) return contact.first_name;
  return itemName || "there";
}

// ─── Slack alerting ───────────────────────────────────────────────
async function slackAlert(text) {
  if (!SLACK_BOT_TOKEN) return;
  try {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ channel: SLACK_ALERT_CHANNEL, text }),
    });
  } catch (e) {
    console.error("[slack] Alert failed:", e.message);
  }
}

// ─── Webhook handler ──────────────────────────────────────────────
app.post("/webhook/monday/status-notification", async (req, res) => {
  const body = req.body;

  // Monday challenge verification
  if (body.challenge) {
    console.log("[status] Challenge received");
    return res.json({ challenge: body.challenge });
  }

  // Respond 200 immediately, process async
  res.status(200).send("OK");

  try {
    const event = body.event;
    if (!event) {
      console.log("[status] No event in payload");
      return;
    }

    // Only handle column value updates
    if (event.type !== "update_column_value") {
      console.log("[status] Ignoring event type:", event.type);
      return;
    }

    // Filter: only status4 column
    if (event.columnId !== COLUMNS.STATUS) {
      return; // Silent skip — high volume of non-status4 events
    }

    const itemId = event.pulseId || event.itemId;
    const boardId = event.boardId;
    if (String(boardId) !== BOARD_ID) {
      console.log(`[status] Ignoring board ${boardId} for item ${itemId}`);
      return;
    }

    const newStatus = event.value?.label?.text || event.value?.name || "";
    const previousStatus = event.previousValue?.label?.text || event.previousValue?.name || "";

    console.log(`[status] ${previousStatus} → ${newStatus} for item ${itemId}`);

    // Fetch full item data from Monday
    const itemData = await fetchItemData(itemId);
    if (!itemData) {
      console.error(`[status] Failed to fetch item ${itemId}`);
      await slackAlert(`⚠️ Status notification failed: could not fetch Monday item ${itemId}`);
      return;
    }

    const columnValues = itemData.columnValues;
    const service = getColumnText(columnValues, COLUMNS.SERVICE);
    const clientType = getColumnText(columnValues, COLUMNS.CLIENT_TYPE);
    const passcode = getColumnText(columnValues, COLUMNS.PASSCODE);

    // Determine notification type
    const webhookType = determineWebhookType(newStatus, service, clientType, passcode);
    if (!webhookType) {
      console.log(`[status] No notification for: status=${newStatus}, service=${service}, client=${clientType}`);
      return;
    }

    // Intercom ID gate
    const intercomId = getColumnText(columnValues, COLUMNS.INTERCOM_ID);
    if (!intercomId) {
      console.warn(`[status] Item ${itemId} has no Intercom ID — skipping notification`);
      return;
    }

    // Fetch Intercom conversation → contact → first name
    const conversation = await intercomGet(`/conversations/${intercomId}`);
    const contactId = conversation?.contacts?.contacts?.[0]?.id;

    let contactFirstName = itemData.name;
    if (contactId) {
      const contact = await intercomGet(`/contacts/${contactId}`);
      contactFirstName = extractFirstName(contact, itemData.name);
    }

    // Build template data
    const bookingValue = getColumnValue(columnValues, COLUMNS.BOOKING_TIME);
    const templateData = {
      contactFirstName,
      itemId,
      intercomId,
      formattedBooking: formatBookingDate(bookingValue),
      gophrLink: getColumnText(columnValues, COLUMNS.GOPHR_LINK),
      gophrTimeWindow: getColumnText(columnValues, COLUMNS.GOPHR_TIME_WINDOW),
      outboundTracking: getColumnText(columnValues, COLUMNS.OUTBOUND_TRACKING),
      passcode,
      clientType,
    };

    // Render template
    const templateFn = TEMPLATES[webhookType];
    if (!templateFn) {
      console.error(`[status] No template for webhookType: ${webhookType}`);
      return;
    }

    const emailBody = templateFn(templateData);

    if (SHADOW_MODE) {
      const record = {
        ts: new Date().toISOString(),
        itemId,
        itemName: itemData.name,
        previousStatus,
        newStatus,
        service,
        clientType,
        webhookType,
        intercomId,
        contactId: contactId || null,
        contactFirstName,
        templateData,
        renderedHtml: emailBody,
      };
      console.log(`[SHADOW] ${webhookType} for item ${itemId} → conversation ${intercomId}`);
      try {
        fs.appendFileSync(SHADOW_LOG, JSON.stringify(record) + "\n");
      } catch (e) {
        console.error("[SHADOW] Failed to write log:", e.message);
      }
      return;
    }

    // Send Intercom reply
    await intercomPost(`/conversations/${intercomId}/reply`, {
      message_type: "comment",
      type: "admin",
      admin_id: INTERCOM_ADMIN_ID,
      body: emailBody,
    });

    console.log(`[status] ✓ Sent ${webhookType} for item ${itemId} to conversation ${intercomId}`);
  } catch (err) {
    console.error("[status] Error:", err.message);
    await slackAlert(`❌ Status notification error: ${err.message}`);
  }
});

// ─── Health check ─────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "status-notifications",
    shadowMode: SHADOW_MODE,
    port: PORT,
    uptime: process.uptime(),
  });
});

// ─── Start ────────────────────────────────────────────────────────
app.listen(PORT, HOST, () => {
  console.log(`[status-notifications] Listening on ${HOST}:${PORT} (shadow=${SHADOW_MODE})`);
});
