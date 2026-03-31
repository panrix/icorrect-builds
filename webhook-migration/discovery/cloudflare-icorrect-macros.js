--a431cadb5809141d043c3ae6bde6d0f8287751faf7d1b55e6eab11548ecb
Content-Disposition: form-data; name="worker.js"

/**
 * iCorrect Status Router - CloudFlare Worker (v4 - With Gophr Time Window)
 * 
 * Purpose: Monitor Monday.com changes and route to n8n webhooks
 * 
 * Triggers:
 * 1. Item Created → Create Intercom ticket (if email exists)
 * 2. Email Column Updated → Create Intercom ticket (if no ticket exists yet)
 * 3. Status Column Updated → Send notification email
 * 
 * Deployment:
 * 1. Go to CloudFlare Dashboard → Workers & Pages
 * 2. Edit your existing worker: icorrect-macros
 * 3. Paste this code and Deploy
 */

// ============================================================================
// CONFIGURATION - Set these as environment variables in CloudFlare
// ============================================================================

const CONFIG = {
  N8N_BASE_URL: 'https://icorrect.app.n8n.cloud',
  MONDAY_API_TOKEN: '',  // Set as environment variable: MONDAY_API_TOKEN
  WEBHOOK_SECRET: ''     // Optional, set as: WEBHOOK_SECRET
};

// ============================================================================
// WEBHOOK ENDPOINTS
// ============================================================================

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
  RETURN_COURIER_STANDARD: 'return-courier',
  RETURN_COURIER_WARRANTY: 'return-courier-warranty',
  RETURN_COURIER_GOPHR: 'return-courier-gophr',
};

// ============================================================================
// MONDAY.COM COLUMN IDs
// ============================================================================

const COLUMNS = {
  STATUS: 'status4',
  SERVICE: 'service',
  CLIENT_TYPE: 'status',
  PASSCODE: 'text8',
  EMAIL: 'text5',
  PHONE: 'text00',
  COMPANY: 'text15',
  DEVICE: 'board_relation5',
  IMEI_SN: 'text4',
  BOOKING_TIME: 'date6',
  GOPHR_LINK: 'text_mkzmxq1d',
  GOPHR_TIME_WINDOW: 'text_mm084vbh',
  OUTBOUND_TRACKING: 'text53',
  INTERCOM_ID: 'text_mm087h9p',
  TICKET_LINK: 'link1'
};

// ============================================================================
// STATUS VALUES (exact labels from Monday.com)
// ============================================================================

const STATUS = {
  RECEIVED: 'Received',
  BOOKING_CONFIRMED: 'Booking Confirmed',
  COURIER_BOOKED: 'Courier Booked',
  READY_TO_COLLECT: 'Ready To Collect',
  PASSWORD_REQ: 'Password Req',
  RETURN_COURIER_BOOKED: 'Return Booked',
};

const SERVICE = {
  WALK_IN: 'Walk-In',
  MAIL_IN: 'Mail-In',
  GOPHR_COURIER: 'Gophr Courier'
};

const CLIENT_TYPE = {
  WARRANTY: 'Warranty'
};

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default {
  async fetch(request, env, ctx) {
    const config = {
      N8N_BASE_URL: env.N8N_BASE_URL || CONFIG.N8N_BASE_URL,
      MONDAY_API_TOKEN: env.MONDAY_API_TOKEN || CONFIG.MONDAY_API_TOKEN,
      WEBHOOK_SECRET: env.WEBHOOK_SECRET || CONFIG.WEBHOOK_SECRET
    };

    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

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
      if (!event) {
        return new Response('No event in payload', { status: 400 });
      }

      let result;
      
      // Handle Item Created
      if (event.type === 'create_pulse' || event.type === 'create_item') {
        result = await handleItemCreated(event, config);
      } 
      // Handle Column Value Changes
      else if (event.type === 'update_column_value') {
        const columnId = event.columnId;
        
        // Status column changed → Send notification
        if (columnId === COLUMNS.STATUS) {
          result = await handleStatusChange(event, config);
        }
        // Email column changed → Create ticket (if not exists)
        else if (columnId === COLUMNS.EMAIL) {
          result = await handleEmailUpdated(event, config);
        }
        else {
          console.log('Column change not handled:', columnId);
          return new Response('Column not monitored', { status: 200 });
        }
      } 
      else {
        console.log('Unhandled event type:', event.type);
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

// ============================================================================
// EVENT HANDLERS
// ============================================================================

async function handleItemCreated(event, config) {
  const itemId = event.pulseId || event.itemId;
  const boardId = event.boardId;
  
  const itemData = await fetchItemData(itemId, boardId, config.MONDAY_API_TOKEN);
  if (!itemData) throw new Error('Failed to fetch item data');

  const email = getColumnText(itemData.columnValues, COLUMNS.EMAIL);
  const intercomId = getColumnText(itemData.columnValues, COLUMNS.INTERCOM_ID);

  // If no email, skip - we'll wait for email_updated trigger
  if (!email) {
    console.log(`Item ${itemId} created without email - waiting for email update`);
    return { success: true, action: 'skipped', reason: 'No email - waiting for email update' };
  }

  // If already has Intercom ID, skip (shouldn't happen on create, but safety check)
  if (intercomId) {
    console.log(`Item ${itemId} already has Intercom ID - skipping`);
    return { success: true, action: 'skipped', reason: 'Intercom ticket already exists' };
  }

  const webhookUrl = config.N8N_BASE_URL + WEBHOOKS.ITEM_CREATED;
  
  const webhookPayload = {
    eventType: 'item_created',
    itemId: itemId,
    boardId: boardId,
    itemName: itemData.name,
    columnValues: {
      email: email,
      phone: getColumnText(itemData.columnValues, COLUMNS.PHONE),
      company: getColumnText(itemData.columnValues, COLUMNS.COMPANY),
      imeiSn: getColumnText(itemData.columnValues, COLUMNS.IMEI_SN),
      intercomId: intercomId  // Will be empty, but included for consistency
    },
    timestamp: new Date().toISOString()
  };

  await forwardToN8n(webhookUrl, webhookPayload);

  return { success: true, action: 'item_created', itemId: itemId };
}

async function handleEmailUpdated(event, config) {
  const itemId = event.pulseId || event.itemId;
  const boardId = event.boardId;
  const newEmail = event.value?.text || event.value?.email || '';
  const previousEmail = event.previousValue?.text || event.previousValue?.email || '';

  console.log(`Email: "${previousEmail}" → "${newEmail}" for item ${itemId}`);

  // If email was cleared (not added), skip
  if (!newEmail) {
    console.log(`Email cleared for item ${itemId} - skipping`);
    return { success: true, action: 'skipped', reason: 'Email was cleared, not added' };
  }

  // Fetch full item data to check if ticket already exists
  const itemData = await fetchItemData(itemId, boardId, config.MONDAY_API_TOKEN);
  if (!itemData) throw new Error('Failed to fetch item data');

  const intercomId = getColumnText(itemData.columnValues, COLUMNS.INTERCOM_ID);

  // If already has Intercom ID, skip (prevent duplicates)
  if (intercomId) {
    console.log(`Item ${itemId} already has Intercom ID: ${intercomId} - skipping`);
    return { success: true, action: 'skipped', reason: 'Intercom ticket already exists' };
  }

  // No Intercom ID and email just added → Create ticket
  const webhookUrl = config.N8N_BASE_URL + WEBHOOKS.ITEM_CREATED;
  
  const webhookPayload = {
    eventType: 'email_updated',  // Different event type for logging
    itemId: itemId,
    boardId: boardId,
    itemName: itemData.name,
    columnValues: {
      email: newEmail,
      phone: getColumnText(itemData.columnValues, COLUMNS.PHONE),
      company: getColumnText(itemData.columnValues, COLUMNS.COMPANY),
      imeiSn: getColumnText(itemData.columnValues, COLUMNS.IMEI_SN),
      intercomId: ''  // Empty - that's why we're creating the ticket
    },
    timestamp: new Date().toISOString()
  };

  await forwardToN8n(webhookUrl, webhookPayload);

  return { success: true, action: 'email_updated_ticket_created', itemId: itemId };
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

  // Determine notification type
  const webhookType = determineWebhookType(newStatus, service, clientType, passcode);

  if (!webhookType) {
    console.log(`No notification for: status=${newStatus}, service=${service}, clientType=${clientType}`);
    return { success: true, action: 'no_action', reason: `No notification for status: ${newStatus}` };
  }

  // Send to unified webhook endpoint
  const webhookUrl = config.N8N_BASE_URL + WEBHOOKS.STATUS_NOTIFICATION;
  
  const webhookPayload = {
    eventType: 'status_change',
    webhookType: webhookType,  // This tells n8n which email template to use
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

// ============================================================================
// ROUTING LOGIC
// ============================================================================

function determineWebhookType(status, service, clientType, passcode) {
  const isWarranty = clientType === CLIENT_TYPE.WARRANTY;
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

    case STATUS.RETURN_COURIER_BOOKED:
      // Gophr takes priority - same template for warranty and standard
      if (service === SERVICE.GOPHR_COURIER) return WEBHOOK_TYPES.RETURN_COURIER_GOPHR;
      // Mail-In depends on warranty status
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

// ============================================================================
// MONDAY.COM API
// ============================================================================

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

// ============================================================================
// N8N FORWARDING
// ============================================================================

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

// ============================================================================
// CORS
// ============================================================================

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
--a431cadb5809141d043c3ae6bde6d0f8287751faf7d1b55e6eab11548ecb--
