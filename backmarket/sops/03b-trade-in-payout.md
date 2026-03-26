# SOP 03b: Trade-in Payout

**Version:** 1.0
**Date:** 2026-03-20
**Scope:** Paying out the customer for a trade-in device after diagnostic is complete. Irreversible financial action.
**Owner:** Backmarket agent (Hugo) / VPS webhook

---

## Trigger

Monday webhook on Main Board (`349212843`):
- `status24` (Repair Type) changes to **"Pay-Out" (index 12)**

The webhook fires on the VPS at `/webhook/bm/payout` (icloud-checker service, port 8002).

### Pre-conditions (set by team/QC, NOT by this SOP)
- `status4` (Status) = "Diagnostic Complete" (index 2) on the Main Board
- `status24` (Repair Type) ≠ "Counteroffer" (index 3): active counter-offers block payout
- Device has passed QC and diagnostic
- Team (typically QC tech) manually changes `status24` to Pay-Out

---

## Step 1: Webhook Receives Event

The icloud-checker webhook handler at `/webhook/bm/payout` validates:
1. `event.columnId === "status24"` (STATUS_COLUMN)
2. `event.boardId === "349212843"` (BOARD_ID)
3. Parsed value index === 12

If any check fails, the event is silently dropped.

**Source file:** `/home/ricky/builds/icloud-checker/src/index.js` (line ~1263)

---

## Step 2: Fetch BM Trade-in ID

```graphql
{ items(ids: [ITEM_ID]) {
  column_values(ids: ["text_mky01vb4"]) { id text }
} }
```

| Column ID | Title | Board |
|-----------|-------|-------|
| `text_mky01vb4` | BM Trade-in ID | Main Board (349212843) |

**HARD GATE:** If `text_mky01vb4` is empty, the webhook:
- Logs the failure
- Sends Slack alert: "⚠️ {itemName} marked Pay-Out but no BM trade-in ID found. Manual payout needed."
- Does NOT change any status
- Returns without action

---

## Step 3: Pre-flight Checklist

⛔ **CRITICAL: Monday is the ONLY source of truth for payout eligibility.**

Before every payout, the following MUST be true:

| Check | Column / Source | Requirement |
|-------|----------------|-------------|
| Monday status | `status24` (Main Board) | = index 12 ("Pay-Out") |
| BM order match | `text_mky01vb4` (Main Board) | Matches BM order public ID |
| Purchase price | `numeric` (BM Devices Board 3892194968) | Matches BM API `originalPrice` |
| iCloud status | `color_mkyp4jjh` (Main Board) | NOT locked |
| Spec validated | BM Devices Board | Validated (Y-Apple / Y-Bookyard / Y-Manual) |

### What is NOT sufficient for payout:
- ❌ BM API status = RECEIVED (device arrived but NOT diagnosed)
- ❌ BM dashboard screenshot
- ❌ Team verbally confirming a device
- ❌ `status4` = "Diagnostic Complete" alone (without `status24` = 12)

### Ricky Approval Threshold
Hugo's SOP required explicit Ricky approval for payouts > £200.

> **✅ Resolved (24 Mar 2026):** No £200 approval threshold. Auto-run payout at any value, provided pre-flight checks pass (BM trade-in ID exists, no iCloud lock, no counter-offer required). See PLAN-BM-REBUILD-MASTER.md locked business rules.

---

## Step 4: Execute Payout via BM API

```
PUT https://www.backmarket.co.uk/ws/buyback/v1/orders/{orderPublicId}/validate
Headers:
  Authorization: $BACKMARKET_API_AUTH (Basic auth)
  Accept-Language: en-gb
  Content-Type: application/json
Body: {}
```

| Detail | Value |
|--------|-------|
| API Base | `https://www.backmarket.co.uk/ws/buyback/v1/orders` |
| Method | PUT |
| Auth | Basic auth from `BACKMARKET_API_AUTH` env var |
| Body | Empty JSON object `{}` |

**⚠️ This action is IMMEDIATE and IRREVERSIBLE. Once validated, BM pays the customer. No undo.**

---

## Step 5: Error Handling on BM API Call

| HTTP Status | Action |
|-------------|--------|
| 2xx | Success: proceed to Step 6 |
| 5xx | Retry ONCE after 30 seconds. If retry fails: Slack alert "❌ Payout FAILED", leave status24 as Pay-Out (12) for safety net cron |
| 4xx | Do NOT retry. Slack alert "❌ Payout FAILED". Status NOT changed. Common 4xx reasons: already validated, counter-offer pending, order cancelled |

---

## Step 6: Update Monday Status to Purchased

On successful BM validation:

```graphql
mutation { change_column_value(
  board_id: 349212843,
  item_id: ITEM_ID,
  column_id: "status24",
  value: "{\"index\": 6}"
) { id } }
```

| Column ID | New Value | Index |
|-----------|-----------|-------|
| `status24` | Purchased | 6 |

If the Monday update fails but BM payout succeeded:
- Slack alert: "⚠️ Payout sent to BM for {itemName} ({bmTradeInId}) but Monday not updated. Set to Purchased manually."
- The payout is already done: the Monday update is a tracking concern, not a financial one.

---

## Step 7: Notifications

On success:
- Slack: "✅ Payout sent for {itemName} - {bmTradeInId}"

On failure:
- Slack: error details with reason

**Current notification channel:** Slack (DISPATCH_SLACK_CHANNEL in icloud-checker)
**Target notification channel:** BM Telegram (`-1003888456344`) when migrated from Slack

---

## Status Flow (Full Lifecycle After Payout)

| Status | Index | Set By | When |
|--------|-------|--------|------|
| Pay-Out | 12 | Team (QC tech) | Diagnostic complete, device approved |
| **Purchased** | **6** | **Agent/webhook** | **Immediately after BM payout validated** |
| To List | 8 | QC process (Roni) | QC completion: device ready to list |
| Listed | 7 | Agent (SOP 06) | After BM listing created |
| Sold | 10 | Sale detection (SOP 08) | After sale confirmed |

Agent only sets two statuses in this chain: **Purchased** (this SOP) and **Listed** (SOP 06).

---

## What Does NOT Happen

- This SOP does NOT trigger diagnostics (that's SOP 03)
- This SOP does NOT handle counter-offers (that's SOP 12)
- This SOP does NOT list the device (that's SOP 06)
- This SOP does NOT check device specs: that should already be done at intake
- n8n Flow 4 (auto-validate) is DISABLED: all payouts go through this webhook handler
- No batch payout: each device is processed individually via Monday webhook

---

## Boards & Columns Reference

| Board | ID | Columns Used |
|-------|----|-------------|
| Main Board | 349212843 | `status24` (Repair Type), `text_mky01vb4` (BM Trade-in ID), `color_mkyp4jjh` (iCloud) |
| BM Devices Board | 3892194968 | `numeric` (Purchase Price), `text_mkqy3576` (Order ID) |

---

## Implementation Location

| Component | Location |
|-----------|----------|
| Webhook handler | `/home/ricky/builds/backmarket/services/bm-payout/index.js` |
| Endpoint | `POST /webhook/bm/payout` → `127.0.0.1:8012` via nginx |
| Monday webhook | Triggers on `status24` column change on board 349212843 |
| n8n Flow 4 | DISABLED (was auto-validate, disabled because team triggered payouts incorrectly) |
