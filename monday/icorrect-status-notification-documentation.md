# iCorrect Status Notification System - Technical Documentation

**For:** Ricky (CloudFlare Worker Implementation)  
**Created:** February 2026  
**Version:** 2.0 (includes post-implementation updates)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [CloudFlare Worker](#3-cloudflare-worker)
4. [Monday.com Configuration](#4-mondaycom-configuration)
5. [n8n Workflow](#5-n8n-workflow)
6. [Notification Matrix](#6-notification-matrix)
7. [Email Templates](#7-email-templates)
8. [Column Reference](#8-column-reference)
9. [Testing & Troubleshooting](#9-testing--troubleshooting)

---

## 1. System Overview

This system automatically sends customer notification emails via Intercom when repair statuses change in Monday.com.

**Key Features:**
- Automatic Intercom ticket creation when Monday items are created
- Status-triggered email notifications (14 scenarios)
- Smart routing based on service type (Walk-In, Mail-In, Gophr) and client type (Warranty, Standard, Corporate)
- Dynamic email templates with personalised customer names and tracking links

---

## 2. Architecture

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐     ┌─────────────┐
│   Monday.com    │────▶│  CloudFlare Worker  │────▶│      n8n        │────▶│  Intercom   │
│  (status4 col)  │     │  (routing logic)    │     │  (send email)   │     │  (ticket)   │
└─────────────────┘     └─────────────────────┘     └─────────────────┘     └─────────────┘
        │                        │                          │
        │                        │                          │
   Webhook fires            Determines                 Fetches contact
   on column change         webhookType                name from Intercom,
                            based on:                  sends reply to
                            - status                   conversation
                            - service
                            - clientType
                            - passcode
```

**Data Flow:**
1. Monday.com webhook fires on `status4` column change
2. CloudFlare Worker receives payload, fetches full item data from Monday API
3. Worker determines `webhookType` based on routing logic
4. Worker forwards to n8n unified webhook endpoint: `/webhook/status-notification`
5. n8n extracts data, fetches contact name from Intercom
6. n8n routes to correct email template based on `webhookType`
7. n8n sends email as reply to existing Intercom conversation

---

## 3. CloudFlare Worker

### 3.1 Deployment

1. Go to CloudFlare Dashboard → Workers & Pages
2. Create new Worker: `icorrect-status-router`
3. Paste the worker code (see section 3.3)
4. Set environment variables:

| Variable | Value |
|----------|-------|
| `N8N_BASE_URL` | `https://icorrect.app.n8n.cloud` |
| `MONDAY_API_TOKEN` | Your Monday.com API token |

### 3.2 Worker URL

After deployment, your worker URL will be:
```
https://icorrect-status-router.YOUR-SUBDOMAIN.workers.dev
```

### 3.3 Worker Code

```javascript
/**
 * iCorrect Status Router - CloudFlare Worker (v2 - Unified Endpoint)
 */

const CONFIG = {
  N8N_BASE_URL: 'https://icorrect.app.n8n.cloud',
  MONDAY_API_TOKEN: ''
};

const WEBHOOKS = {
  ITEM_CREATED: '/webhook/monday-item-created',
  STATUS_NOTIFICATION: '/webhook/status-notification'
};

// Webhook type identifiers (sent in payload for n8n routing)
const WEBHOOK_TYPES = {
  RECEIVED_WALKIN: 'received-walkin',
  RECEIVED_REMOTE: 'received-remote',
  BOOKING_CONFIRMED_STANDARD: 'booking-confirmed',
  BOOKING_CONFIRMED_WARRANTY: 'booking-confirmed-warranty',
  COURIER_GOPHR: 'courier-gophr',
  COURIER_MAILIN_STANDARD: 'courier-mailin',
  COURIER_MAILIN_WARRANTY: 'courier-warranty',
  READY_WALKIN_STANDARD: 'ready-walkin',
  READY_WALKIN_WARRANTY: 'ready-warranty',
  PASSWORD_REQUEST_WITH_CODE: 'password-request',
  PASSWORD_REQUEST_NO_CODE: 'password-request-empty',
  // NEW: Return courier notifications
  RETURN_COURIER_STANDARD: 'return-courier',
  RETURN_COURIER_WARRANTY: 'return-courier-warranty',
  RETURN_COURIER_GOPHR: 'return-courier-gophr'
};

const COLUMNS = {
  STATUS: 'status4',
  SERVICE: 'service',
  CLIENT_TYPE: 'status',
  PASSCODE: 'text8',
  EMAIL: 'text5',
  PHONE: 'text00',
  COMPANY: 'text15',
  IMEI_SN: 'text4',
  BOOKING_TIME: 'date6',
  GOPHR_LINK: 'text_mkzmxq1d',
  GOPHR_TIME_WINDOW: 'text_XXXXXX',  // UPDATE with actual column ID
  OUTBOUND_TRACKING: 'text53',
  INTERCOM_ID: 'text_mm087h9p',
  TICKET_LINK: 'link1'
};

const STATUS = {
  RECEIVED: 'Received',
  BOOKING_CONFIRMED: 'Booking Confirmed',
  COURIER_BOOKED: 'Courier Booked',
  READY_TO_COLLECT: 'Ready To Collect',
  PASSWORD_REQ: 'Password Req',
  // NEW: Return status
  RETURN_BOOKED: 'Return Booked'
};

const SERVICE = {
  WALK_IN: 'Walk-In',
  MAIL_IN: 'Mail-In',
  GOPHR_COURIER: 'Gophr Courier'
};

const CLIENT_TYPE = {
  WARRANTY: 'Warranty',
  CORPORATE: 'Corporate'
};

export default {
  async fetch(request, env, ctx) {
    const config = {
      N8N_BASE_URL: env.N8N_BASE_URL || CONFIG.N8N_BASE_URL,
      MONDAY_API_TOKEN: env.MONDAY_API_TOKEN || CONFIG.MONDAY_API_TOKEN
    };

    if (request.method === 'OPTIONS') return handleCORS();
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    try {
      const payload = await request.json();
      console.log('Received webhook:', JSON.stringify(payload, null, 2));

      // Handle Monday.com challenge verification
      if (payload.challenge) {
        return new Response(JSON.stringify({ challenge: payload.challenge }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const event = payload.event;
      if (!event) return new Response('No event in payload', { status: 400 });

      let result;
      
      if (event.type === 'create_pulse' || event.type === 'create_item') {
        result = await handleItemCreated(event, config);
      } else if (event.type === 'update_column_value') {
        // IMPORTANT: Filter for status4 column only
        // The webhook fires for ALL column changes - we filter here
        if (event.columnId === COLUMNS.STATUS) {
          result = await handleStatusChange(event, config);
        } else {
          return new Response('Column not monitored', { status: 200 });
        }
      } else {
        return new Response('Event type not handled', { status: 200 });
      }

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

async function handleItemCreated(event, config) {
  const itemId = event.pulseId || event.itemId;
  const boardId = event.boardId;
  
  const itemData = await fetchItemData(itemId, boardId, config.MONDAY_API_TOKEN);
  if (!itemData) throw new Error('Failed to fetch item data');

  const webhookUrl = config.N8N_BASE_URL + WEBHOOKS.ITEM_CREATED;
  
  const webhookPayload = {
    eventType: 'item_created',
    itemId: itemId,
    boardId: boardId,
    itemName: itemData.name,
    columnValues: {
      email: getColumnText(itemData.columnValues, COLUMNS.EMAIL),
      phone: getColumnText(itemData.columnValues, COLUMNS.PHONE),
      company: getColumnText(itemData.columnValues, COLUMNS.COMPANY),
      imeiSn: getColumnText(itemData.columnValues, COLUMNS.IMEI_SN)
    },
    timestamp: new Date().toISOString()
  };

  await forwardToN8n(webhookUrl, webhookPayload);
  return { success: true, action: 'item_created', itemId };
}

async function handleStatusChange(event, config) {
  const itemId = event.pulseId || event.itemId;
  const boardId = event.boardId;
  const newStatus = event.value?.label?.text || event.value?.name || '';
  const previousStatus = event.previousValue?.label?.text || event.previousValue?.name || '';

  console.log(`Status: ${previousStatus} → ${newStatus} for item ${itemId}`);

  const itemData = await fetchItemData(itemId, boardId, config.MONDAY_API_TOKEN);
  if (!itemData) throw new Error('Failed to fetch item data');

  const columnValues = itemData.columnValues;
  const service = getColumnText(columnValues, COLUMNS.SERVICE);
  const clientType = getColumnText(columnValues, COLUMNS.CLIENT_TYPE);
  const passcode = getColumnText(columnValues, COLUMNS.PASSCODE);

  const webhookType = determineWebhookType(newStatus, service, clientType, passcode);

  if (!webhookType) {
    console.log(`No notification for: status=${newStatus}, service=${service}, clientType=${clientType}`);
    return { success: true, action: 'no_action', reason: `No notification for status: ${newStatus}` };
  }

  const webhookUrl = config.N8N_BASE_URL + WEBHOOKS.STATUS_NOTIFICATION;
  
  const webhookPayload = {
    eventType: 'status_change',
    webhookType: webhookType,
    itemId: itemId,
    boardId: boardId,
    itemName: itemData.name,
    status: newStatus,
    previousStatus: previousStatus,
    service: service,
    clientType: clientType,
    passcode: passcode,
    columnValues: {
      email: getColumnText(columnValues, COLUMNS.EMAIL),
      phone: getColumnText(columnValues, COLUMNS.PHONE),
      company: getColumnText(columnValues, COLUMNS.COMPANY),
      imeiSn: getColumnText(columnValues, COLUMNS.IMEI_SN),
      bookingTime: getColumnValue(columnValues, COLUMNS.BOOKING_TIME),
      gophrLink: getColumnText(columnValues, COLUMNS.GOPHR_LINK),
      gophrTimeWindow: getColumnText(columnValues, COLUMNS.GOPHR_TIME_WINDOW),
      outboundTracking: getColumnText(columnValues, COLUMNS.OUTBOUND_TRACKING),
      intercomId: getColumnText(columnValues, COLUMNS.INTERCOM_ID),
      ticketLink: getColumnValue(columnValues, COLUMNS.TICKET_LINK)
    },
    timestamp: new Date().toISOString()
  };

  await forwardToN8n(webhookUrl, webhookPayload);
  return { success: true, action: 'status_notification', itemId, status: newStatus, webhookType };
}

function determineWebhookType(status, service, clientType, passcode) {
  const isWarranty = clientType === CLIENT_TYPE.WARRANTY;
  const isCorporate = clientType === CLIENT_TYPE.CORPORATE;
  const hasPasscode = passcode && passcode.trim() !== '';

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

    case STATUS.READY_TO_COLLECT:
      if (service === SERVICE.WALK_IN) {
        return isWarranty ? WEBHOOK_TYPES.READY_WALKIN_WARRANTY : WEBHOOK_TYPES.READY_WALKIN_STANDARD;
      }
      return null;

    case STATUS.PASSWORD_REQ:
      return hasPasscode ? WEBHOOK_TYPES.PASSWORD_REQUEST_WITH_CODE : WEBHOOK_TYPES.PASSWORD_REQUEST_NO_CODE;

    // NEW: Return Booked status
    case STATUS.RETURN_BOOKED:
      if (service === SERVICE.GOPHR_COURIER) return WEBHOOK_TYPES.RETURN_COURIER_GOPHR;
      if (service === SERVICE.MAIL_IN) {
        return isWarranty ? WEBHOOK_TYPES.RETURN_COURIER_WARRANTY : WEBHOOK_TYPES.RETURN_COURIER_STANDARD;
      }
      return null;

    default:
      return null;
  }
}

async function fetchItemData(itemId, boardId, apiToken) {
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

  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiToken,
      'API-Version': '2024-01'
    },
    body: JSON.stringify({ query, variables: { itemId: [itemId.toString()] } })
  });

  const data = await response.json();
  if (data.errors) {
    console.error('Monday API error:', data.errors);
    return null;
  }

  const item = data.data?.items?.[0];
  if (!item) return null;

  const columnValues = {};
  for (const col of item.column_values) {
    columnValues[col.id] = {
      text: col.text,
      value: col.value ? JSON.parse(col.value) : null
    };
  }

  return { id: item.id, name: item.name, columnValues };
}

function getColumnText(columnValues, columnId) {
  return columnValues[columnId]?.text || '';
}

function getColumnValue(columnValues, columnId) {
  return columnValues[columnId]?.value || null;
}

async function forwardToN8n(webhookUrl, payload) {
  console.log(`Forwarding to: ${webhookUrl}`);
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`n8n error: ${response.status} - ${errorText}`);
    throw new Error(`n8n webhook failed: ${response.status}`);
  }

  return response;
}

function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
```

---

## 4. Monday.com Configuration

### 4.1 Create Webhooks

Go to [Monday.com API Playground](https://monday.com/developers/v2/try-it-yourself) and run:

**Webhook for Item Creation:**
```graphql
mutation {
  create_webhook(
    board_id: 349212843
    url: "https://icorrect-status-router.YOUR-SUBDOMAIN.workers.dev"
    event: create_item
  ) {
    id
  }
}
```

**Webhook for Status Changes:**
```graphql
mutation {
  create_webhook(
    board_id: 349212843
    url: "https://icorrect-status-router.YOUR-SUBDOMAIN.workers.dev"
    event: change_column_value
  ) {
    id
  }
}
```

> ⚠️ **Note:** The `change_column_value` event does NOT support the `config` parameter to filter by column. The webhook will fire for ALL column changes. The CloudFlare Worker filters for `status4` changes only.

---

## 5. n8n Workflow

### 5.1 Workflow: Status Notifications → Intercom Email

**Webhook URL:** `https://icorrect.app.n8n.cloud/webhook/status-notification`

**Flow:**
```
Webhook → Extract Data → Has Intercom ID? → Fetch Conversation → Fetch Contact → Merge Contact Name → Route by Type → Template → Merge → Send Intercom Reply → Success
```

### 5.2 Key Nodes

**Extract Data (Code Node):**
- Extracts `body` data to top level
- Formats booking date nicely: "Friday 6th February at 09:00AM"
- Maps all column values for easy access

**Fetch Conversation:**
- GET `https://api.intercom.io/conversations/{intercomId}`
- Retrieves conversation to get linked contact ID

**Fetch Contact:**
- GET `https://api.intercom.io/contacts/{contactId}`
- Retrieves contact details to get first name

**Merge Contact Name (Code Node):**
- Extracts first name from Intercom contact
- Falls back to Monday item name if unavailable

**Route by Notification Type (Switch Node):**
- Routes based on `webhookType` field
- 14 outputs for 14 notification scenarios

**Send Intercom Reply:**
- POST `https://api.intercom.io/conversations/{intercomId}/reply`
- Admin ID: `9702337`
- Sends email as conversation reply

### 5.3 Changes from Original

The workflow has been enhanced with:

1. **New "Extract Data" Code Node** - Better date formatting and data extraction
2. **Fetch Conversation & Contact** - Gets customer's first name from Intercom (uses `contactFirstName` instead of `itemName`)
3. **3 New Return Courier Templates:**
   - `return-courier` - Standard mail-in return
   - `return-courier-warranty` - Warranty mail-in return
   - `return-courier-gophr` - Gophr courier return
4. **Gophr Time Window** - New field `gophrTimeWindow` for courier collection windows
5. **Corporate Client Handling** - Templates conditionally exclude Typeform links for Corporate clients
6. **IMEI/SN Removed from Received emails** - Simplified received notifications

---

## 6. Notification Matrix

### 6.1 Complete Routing Table (14 Scenarios)

| # | Status | Service | Client Type | webhookType | Template |
|---|--------|---------|-------------|-------------|----------|
| 1 | Received | Walk-In | Any | `received-walkin` | Thank you for dropping off |
| 2 | Received | Mail-In/Gophr | Any | `received-remote` | Thank you for sending |
| 3 | Booking Confirmed | Any | NOT Warranty | `booking-confirmed` | Appointment + Typeform + Payment |
| 4 | Booking Confirmed | Any | Warranty | `booking-confirmed-warranty` | Appointment (no payment) |
| 5 | Courier Booked | Gophr | Any | `courier-gophr` | Gophr tracking + time window |
| 6 | Courier Booked | Mail-In | NOT Warranty | `courier-mailin` | Royal Mail + Typeform |
| 7 | Courier Booked | Mail-In | Warranty | `courier-warranty` | Royal Mail (no Typeform) |
| 8 | Ready To Collect | Walk-In | NOT Warranty | `ready-walkin` | Collection hours |
| 9 | Ready To Collect | Walk-In | Warranty | `ready-warranty` | Warranty complete |
| 10 | Password Req | Any | Any (passcode filled) | `password-request` | Unable to unlock with provided code |
| 11 | Password Req | Any | Any (passcode empty) | `password-request-empty` | Need login information |
| 12 | Return Booked | Mail-In | NOT Warranty | `return-courier` | Device on way back (Royal Mail) |
| 13 | Return Booked | Mail-In | Warranty | `return-courier-warranty` | Warranty repair complete (Royal Mail) |
| 14 | Return Booked | Gophr | Any | `return-courier-gophr` | Device on way back (Gophr) |

### 6.2 Visual Flowchart

```
                              ┌─────────────────────────────┐
                              │     STATUS CHANGE EVENT     │
                              └─────────────┬───────────────┘
                                            │
        ┌───────────┬───────────┬───────────┼───────────┬───────────┬───────────┐
        │           │           │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼           ▼           ▼
   Received    Booking     Courier      Ready To    Password    Return      Other
               Confirmed   Booked       Collect     Req         Booked
        │           │           │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼           ▼           ▼
   ┌────┴────┐ ┌────┴────┐ ┌────┴────┐ ┌────┴────┐ ┌────┴────┐ ┌────┴────┐  NO
   │Service? │ │Warranty?│ │Service? │ │Walk-In? │ │Passcode?│ │Service? │ ACTION
   └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
        │           │           │           │           │           │
   Walk │ Remote    │           │           │           │      Gophr│ Mail
    In  │           │           │           │           │           │
        │           │      ┌────┴────┐      │           │           │
        ▼           ▼      │         │      ▼           ▼           ▼
   received-   received-   ▼         ▼  ┌───┴───┐  ┌───┴───┐  ┌───┴───┐
   walkin      remote     Gophr    Mail │Warranty│  │Filled │  │Warranty│
                           │      In   └───┬───┘  │Empty  │  └───┬───┘
                           │         │     │      │       │      │
                           ▼         ▼     ▼      ▼       ▼      ▼
                      courier-  ┌───┴───┐ ready-  password- return-
                      gophr    │Warranty│ walkin  request   courier
                               └───┬───┘ ready-   password- return-
                                   │     warranty request-  courier-
                                   ▼              empty     warranty
                              courier-                      return-
                              mailin                        courier-
                              courier-                      gophr
                              warranty
```

---

## 7. Email Templates

### 7.1 Received - Walk-In
```
Hi {{ contactFirstName }},

Thank you for dropping off your device with iCorrect.

Your device will be pre-tested and then join our repair queue - we will contact you before proceeding with our repair if we find any additional faults.

If you have any questions, please don't hesitate to contact us.

Kind regards,
```

### 7.2 Received - Remote
```
Hi {{ contactFirstName }},

Thank you for sending your device for repair with iCorrect.

Your device will be pre-tested and then join our repair queue - we will contact you before proceeding with our repair if we find any additional faults.

If you have any questions, please don't hesitate to contact us.

Kind regards,
```

### 7.3 Booking Confirmed - Standard
```
Hi {{ contactFirstName }},

Your appointment with iCorrect is booked for {{ formattedBooking }}. Please give your name at reception on arrival.

[IF NOT Corporate:]
To help us prepare and make your appointment as smooth as possible, please complete this short questionnaire about your device: https://form.typeform.com/to/sDieaFMs#monday_item_id={{ itemId }}&conversation_id={{ intercomId }}

If you haven't already paid online, we will take payment during your appointment. We accept card (including AMEX) and cash.

Thank you for choosing us for your repair, we look forward to seeing you.

Kind regards,
```

### 7.4 Booking Confirmed - Warranty
```
Hi {{ contactFirstName }},

Your warranty appointment with iCorrect is booked for {{ formattedBooking }}. Please give your name at reception on arrival.

If you have any questions in the meantime, please don't hesitate to contact us.

Kind regards,
```

### 7.5 Courier Booked - Gophr
```
Hi {{ contactFirstName }},

Your courier has now been arranged.

You can track your collection here: {{ gophrLink }}

Your collection time window is: {{ gophrTimeWindow }}

[IF NOT Corporate:]
IMPORTANT! There is essential information we need before we can begin your repair. Please complete this form before your device arrives:
https://form.typeform.com/to/sDieaFMs#monday_item_id={{ itemId }}&conversation_id={{ intercomId }}

If you have any questions, please don't hesitate to contact us.

Kind regards,
```

### 7.6 Courier Booked - Mail-In Standard
```
Hi {{ contactFirstName }},

Your packaging has been shipped via Royal Mail Tracked 24. Your delivery can be tracked using this link:
https://www.royalmail.com/track-your-item#/tracking-results/{{ outboundTracking }}

When your packaging arrives, please follow these steps:
1. Cover the shipping label on the box with the label included.
2. Place your device inside the inflated sleeve. Do not include any accessories, such as chargers, cases, bags.
3. Tape the box shut.

You can drop your package at a Post Office or Parcelshop, or reply to this email to arrange a collection. Requests must be made before 4pm for next-day collections.

[IF NOT Corporate:]
IMPORTANT: There is essential information we need before we can begin your repair. Please complete this form before your device arrives: https://form.typeform.com/to/sDieaFMs#monday_item_id={{ itemId }}&conversation_id={{ intercomId }}

If you have any questions, just let us know.

Kind regards,
```

### 7.7 Courier Booked - Mail-In Warranty
```
Hi {{ contactFirstName }},

Your packaging has been shipped via Royal Mail Tracked 24. Your delivery can be tracked using this link:
https://www.royalmail.com/track-your-item#/tracking-results/{{ outboundTracking }}

When your packaging arrives, please follow these steps:
1. Cover the shipping label on the box with the label included.
2. Place your device inside the inflated sleeve. Do not include any accessories, such as chargers, cases, bags.
3. Tape the box shut.

You can drop your package at a Post Office or Parcelshop, or reply to this email to arrange a collection. Requests must be made before 4pm for next-day collections.

If you have any questions, just let us know.

Kind regards,
```

### 7.8 Ready To Collect - Standard
```
Hi {{ contactFirstName }},

Thank you for arranging your repair with iCorrect. Your repair has been completed and your device is ready for collection.

Our collection opening hours are:
- Monday – Thursday: 9:30am - 5:30pm
- Friday: 10am - 5:30pm

Kind regards,
```

### 7.9 Ready To Collect - Warranty
```
Hi {{ contactFirstName }},

We have completed your warranty repair and your device is ready for collection.

Our collection opening hours are:
- Monday – Thursday: 9:30am - 5:30pm
- Friday: 10am - 5:30pm

Kind regards,
```

### 7.10 Password Request - With Passcode
```
Hi {{ contactFirstName }},

We are unable to unlock your device using the login information that you have provided: "{{ passcode }}"

Could you please let us know if we have recorded your password incorrectly, or if you have another password that we could try?

If you prefer not to provide this information through email, please call us on 02070998517.

Kind regards,
```

### 7.11 Password Request - No Passcode
```
Hi {{ contactFirstName }},

We need to unlock your device in order to fully test it before and after our repair and currently don't have any login information.

Please could you reply to this email or call us on 02070998517 to provide your password, or let us know if you are unable to provide access to your device.

Kind regards,
```

### 7.12 Return Courier - Standard (NEW)
```
Hi {{ contactFirstName }},

Thank you for arranging your repair with iCorrect - your device is on the way back to you, please use the link below to track your delivery:

https://www.royalmail.com/track-your-item#/tracking-results/{{ outboundTracking }}

Kind regards,
```

### 7.13 Return Courier - Warranty (NEW)
```
Hi {{ contactFirstName }},

Your warranty repair has been completed and we have arranged for your device to be delivered back to you via Royal Mail.

To view the tracking information, please use the following link:

https://www.royalmail.com/track-your-item#/tracking-results/{{ outboundTracking }}

Should you have any problems with the delivery, please don't hesitate to contact us.

Kind regards,
```

### 7.14 Return Courier - Gophr (NEW)
```
Hi {{ contactFirstName }},

Your repair has been completed and your device is on the way back to you via courier.

You can track your delivery here: {{ gophrLink }}

Your delivery time window is: {{ gophrTimeWindow }}

Should you have any problems with the delivery, please don't hesitate to contact us.

Kind regards,
```

---

## 8. Column Reference

| Column Name | Column ID | Type | Purpose |
|-------------|-----------|------|---------|
| Status | `status4` | Status | **TRIGGER COLUMN** - monitors for changes |
| Service | `service` | Status | Walk-In / Mail-In / Gophr Courier |
| Client Type | `status` | Status | Warranty / End User / Corporate |
| Passcode | `text8` | Text | Device passcode |
| Email | `text5` | Text | Customer email |
| Phone | `text00` | Text | Customer phone |
| Company | `text15` | Text | Company name |
| IMEI/SN | `text4` | Text | Device identifier |
| Booking Time | `date6` | Date | Appointment date/time |
| Gophr Link | `text_mkzmxq1d` | Text | Gophr tracking URL |
| Gophr Time Window | `text_XXXXXX` | Text | Collection/delivery time window |
| Outbound Tracking | `text53` | Text | Royal Mail tracking number |
| Intercom ID | `text_mm087h9p` | Text | Intercom conversation ID |
| Ticket Link | `link1` | Link | Intercom ticket URL |

---

## 9. Testing & Troubleshooting

### 9.1 Test CloudFlare Worker Challenge

```bash
curl -X POST "https://icorrect-status-router.YOUR-SUBDOMAIN.workers.dev" \
  -H "Content-Type: application/json" \
  -d '{"challenge": "test123"}'
```

Expected response: `{"challenge":"test123"}`

### 9.2 Check CloudFlare Logs

1. CloudFlare Dashboard → Workers → Your Worker → Logs
2. Real-time Logs show all incoming requests and console.log output

### 9.3 Check n8n Executions

1. n8n → Executions → Filter by workflow
2. Click on execution to see full data flow
3. Check for errors in any node

### 9.4 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhook returns 405 | Wrong HTTP method | Ensure Monday webhook uses POST |
| No notification sent | Wrong status label | Check exact spelling/casing in Monday.com |
| Missing contact name | Intercom API error | Check Intercom credentials in n8n |
| Tracking link broken | Spaces in tracking number | Template uses `.replace(/ /g, '')` to remove spaces |

### 9.5 Payload Example

Sample payload from CloudFlare to n8n:

```json
{
  "eventType": "status_change",
  "webhookType": "return-courier-gophr",
  "itemId": 11188421977,
  "boardId": 349212843,
  "itemName": "Michael Ferrari Test",
  "status": "Return Booked",
  "previousStatus": "Courier Booked",
  "service": "Gophr Courier",
  "clientType": "Warranty",
  "passcode": "438oho",
  "columnValues": {
    "email": "michael.f@icorrect.co.uk",
    "phone": "+4402070998517",
    "company": "",
    "imeiSn": "FVFZQAZ5LYWG",
    "bookingTime": {
      "date": "2026-02-06",
      "time": "09:00:00"
    },
    "gophrLink": "https://app.gophr.com/tracking/...",
    "gophrTimeWindow": "10:00 - 13:00",
    "outboundTracking": "MZ 4112 8512 3GB",
    "intercomId": "215472962932166",
    "ticketLink": {
      "url": "https://app.intercom.com/a/inbox/..."
    }
  },
  "timestamp": "2026-02-04T20:26:06.587Z"
}
```

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 2026 | Initial documentation |
| 2.0 | Feb 2026 | Added 3 Return Courier templates, Gophr time window, Corporate client handling, contact name fetching from Intercom |

---

**Questions?** Contact Michael or check the n8n workflow executions for debugging.
