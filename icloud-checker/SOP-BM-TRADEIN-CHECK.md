# SOP: BackMarket Trade-In — iCloud & Spec Check

## Purpose
Automatically verify iCloud lock status and device specs when a BackMarket trade-in device is received, flagging mismatches for counteroffer.

## Trigger
Serial number entered in the **Serial Number** column (`text4`) on the iCorrect Main Board.

## Flow

### 1. Pre-checks
- Only runs if **Client** column = "BM"
- If client is not BM → skipped silently

### 2. iCloud Check (SickW Service 30 — $0.04)
- Calls SickW API with the serial number
- Updates **Repair Type** column (`status24`) → `IC ON` or `IC OFF`

### 3. Apple Spec Lookup (M1+ only — free)
- Looks up serial on Apple Self Service Repair
- Returns: model, colour, chip, CPU cores, GPU cores, RAM, storage
- Pre-M1/Intel devices: skipped, noted as "Apple specs unavailable"
- Results are cached permanently (specs don't change per serial)

### 4. Spec Comparison
- Pulls customer-claimed specs from BM Devices Board (3892194968):
  - RAM (`status__1`)
  - SSD (`color2`)
  - CPU (`status7__1`)
  - GPU (`status8__1`)
- Compares against Apple-confirmed specs
- Any mismatch is flagged in the Monday comment and Slack alert

### 5. Monday Updates
- **Repair Type** (`status24`) → IC ON or IC OFF
- **Colour** (`status8`) → Apple-confirmed colour (SpaceGray, Silver, Midnight, etc.)
- **Comment 1:** iCloud status only (e.g. `✅ iCloud Check: OFF` or `🔒 iCloud LOCKED — {name}`)
- **Comment 2:** Apple-confirmed specs (model, colour, chip, CPU, GPU, RAM, storage) + mismatch warnings if any

### 6. If iCloud ON
- Suspends the BM order via API (if status is SENT, RECEIVED, or TO_SEND) — sends reason `customer_account_present`
- Moves item to **iCloud Locked** group (`group_mktsw34v`)
- Messages the customer via BM API with Find My removal instructions
- Sends Slack alert to #bm-trade-in-checks

### 7. If iCloud OFF
- Posts Monday comment with confirmed specs
- If spec mismatches detected → Slack alert for counteroffer review

---

## Auto-Recheck (iCloud Locked Devices)

Runs every 30 minutes for all items in the iCloud Locked group.

### How it works
- Polls BackMarket for new customer messages on each locked order
- **Customer reply contains keywords** (removed, done, unlocked, disabled, signed out, find my, etc.) → automatic SickW recheck
- **No keywords** → Slack notification to #bm-trade-in-checks with:
  - Customer's actual message
  - "Recheck iCloud" button
  - "Reply to Customer" button (opens dialog, sends via BM API)

### If iCloud now OFF
- Updates Monday → IC OFF
- Moves item back to Today's Repairs
- Messages customer: "iCloud removed, processing within 24 hours"
- Slack confirmation

### If still locked
- Posts Monday comment (still locked)
- Messages customer again with Find My instructions
- Slack alert

---

## Customer Messages (sent automatically via BM API)

**When iCloud locked (first detection + follow-ups):**
> Thank you for your message. Unfortunately, your iCloud account is still linked to the MacBook – could you please double-check that the device is no longer showing in the Find My menu on your iCloud.com account? Guide: https://support.apple.com/en-gb/guide/icloud/mmfc0eeddd/icloud. It's also possible that a previous user's Apple ID is still linked.

**When iCloud removed:**
> Thank you! We've confirmed your iCloud lock has been removed. Your trade-in will be processed within the next 24 hours.

---

## Cost Per Trade-In
- SickW Service 30: **$0.04**
- Apple spec lookup: **$0.00** (free, uses residential proxy ~$0.001)
- AI tokens: **$0.00** (pure code, no AI)
- **Total: ~$0.04 per device**

---

## Limitations
- Apple spec lookup only works for **M1 and newer** Macs
- Intel/pre-M1 devices: iCloud check still works, but specs must be verified manually
- Apple's `findMy` field does NOT reliably indicate iCloud lock — SickW is required
- Residential proxy can occasionally be slow (15-30 seconds per lookup)

---

## Technical Details

### Service
- **Location:** `/home/ricky/builds/icloud-checker/`
- **Systemd:** `systemctl --user status icloud-checker`
- **Port:** 8010
- **URL:** `https://mc.icorrect.co.uk/webhook/icloud-check`
- **Health:** `https://mc.icorrect.co.uk/webhook/icloud-check/health`

### Monday Boards
- **iCorrect Main Board:** 349212843
  - Serial Number: `text4` (trigger)
  - Client: `status` (filter — must be "BM")
  - Repair Type: `status24` (IC ON / IC OFF)
  - Colour: `status8` (Apple-confirmed)
  - BM Trade-in ID: `text_mky01vb4`
- **BM Devices Board:** 3892194968
  - RAM: `status__1`
  - SSD: `color2`
  - CPU: `status7__1`
  - GPU: `status8__1`

### APIs
- **SickW:** Service 30, $0.04/check, key in env
- **Apple Self Service Repair:** `selfservicerepair.com/en-US/order` via DataImpulse US residential proxy
- **BackMarket:** Basic auth, endpoints for order status, suspend, messages
- **Slack:** Posts to #bm-trade-in-checks (`C09VB5G7CTU`)

### Slack Interactive Buttons
- **App:** iCorrect Automations (Bot token in `SLACK_AUTOMATIONS_BOT_TOKEN`)
- **Scopes:** `incoming-webhook`, `chat:write`, `commands`
- **Interactivity URL:** `https://mc.icorrect.co.uk/webhook/icloud-check/slack-interact`
- **Buttons:** "🔄 Recheck iCloud" (triggers SickW recheck) + "💬 Reply to Customer" (opens modal, sends via BM API)

### Replaces
- n8n "Flow 2: iCloud & Spec Checker (bmcheck)" — deactivated
- n8n "Flow 3: iCloud Recheck" — deactivated
