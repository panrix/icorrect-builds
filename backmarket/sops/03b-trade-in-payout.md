# SOP 03b: Trade-in Payout

**Version:** 1.0
**Date:** 2026-03-20
**Scope:** Paying out the customer for a trade-in device after diagnostic is complete. Irreversible financial action.
**Owner:** Backmarket agent (Hugo) / VPS webhook

---

## Trigger

Monday webhook on Main Board (`349212843`):
- `status24` (Repair Type) changes to **"Pay-Out" (index 12)**

The webhook fires on the VPS at `POST /webhook/bm/payout` via the standalone `bm-payout` service on port `8012`.

### Pre-conditions (set by team/QC, NOT by this SOP)
- `status4` (Status) = "Diagnostic Complete" (index 2) on the Main Board
- `status24` (Repair Type) ≠ "Counteroffer" (index 3): active counter-offers block payout
- Device has passed QC and diagnostic
- Team (typically QC tech) manually changes `status24` to Pay-Out

---

## Step 1: Webhook Receives Event

The `bm-payout` webhook handler validates:
1. `event.columnId === "status24"` (STATUS_COLUMN)
2. `event.boardId === "349212843"` (BOARD_ID)
3. Parsed value index === 12

If any check fails, the event is silently dropped.

**Source file:** `/home/ricky/builds/backmarket/services/bm-payout/index.js`

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
| iCloud status | `color_mkyp4jjh` (Main Board) | NOT locked |

### What the live service actually enforces
- Status is still `Pay-Out` when the webhook re-reads Monday (stale webhook protection)
- Main Board BM trade-in ID exists (`text_mky01vb4`)
- iCloud status is not locked (`color_mkyp4jjh`)
- In-flight dedup blocks concurrent duplicate execution in the same process
- Recent Monday updates are scanned for `"Payout validated"` to suppress repeat delivery

### What the live service does NOT currently enforce
- It does **not** compare purchase price against the BM API before payout
- It does **not** explicitly check a BM Devices "spec validated" flag before payout
- It does **not** separately check a counter-offer status beyond requiring `status24` to still be `Pay-Out`

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
  Authorization: $BM_AUTH (Basic auth)
  Accept-Language: en-gb
  Content-Type: application/json
Body: {}
```

| Detail | Value |
|--------|-------|
| API Base | `https://www.backmarket.co.uk/ws/buyback/v1/orders` |
| Method | PUT |
| Auth | Basic auth from `BM_AUTH` env var |
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
- Telegram: same success message to BM ops chat

On failure:
- Slack: error details with reason
- Telegram: same failure message to BM ops chat

**Current notification channels:**
- Slack `#bm-trade-in-checks` (`C09VB5G7CTU`)
- BM Telegram (`-1003888456344`)

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
- All payouts go through this webhook handler; legacy external flow paths are retired.
- No batch payout: each device is processed individually via Monday webhook

---

## Boards & Columns Reference

| Board | ID | Columns Used |
|-------|----|-------------|
| Main Board | 349212843 | `status24` (Repair Type), `text_mky01vb4` (BM Trade-in ID), `color_mkyp4jjh` (iCloud) |

---

## Implementation Location

| Component | Location |
|-----------|----------|
| Webhook handler | `/home/ricky/builds/backmarket/services/bm-payout/index.js` |
| Endpoint | `POST /webhook/bm/payout` → `127.0.0.1:8012` via nginx |
| Monday webhook | Triggers on `status24` column change on board 349212843 |

---

## QA Notes (2026-03-28)

### Findings
1. `PASS` Stale monolith/port wording corrected.
   The body text now matches the live standalone service:
   - service: `bm-payout`
   - port: `8012`
   - route: `POST /webhook/bm/payout`
   - ingress: nginx → `127.0.0.1:8012`

2. `PASS` Redundant BM Devices `text_mkqy3576` reference removed.
   The payout service does not read that column.

3. `PASS` Pre-flight checks aligned to the actual service.
   The live service enforces:
   - status still `Pay-Out`
   - BM trade-in ID exists
   - iCloud not locked
   - dedup protections
   It does **not** enforce purchase-price equality, BM Devices spec-validation flags, or a separate counter-offer gate beyond `status24` still being `Pay-Out`.

4. `PASS` BM auth env var corrected.
   The service uses `BM_AUTH`, not `BACKMARKET_API_AUTH`.

5. `PASS` Notification channels corrected.
   The live service sends both Slack and Telegram notifications via a shared `notify()` helper.

6. `PASS` Dedup hardening verified.
   The service now has:
   - in-flight dedup via `inflightPayouts`
   - recent-update dedup via `"Payout validated"` Monday comment scan
   - stale-webhook protection by re-reading `status24`

7. `PASS` No V6 references found.

### Per-check Summary
1. Service/port/route wording: `PASS`
2. Column references vs service reads: `PASS`
3. Pre-flight gate accuracy: `PASS`
4. BM auth env var accuracy: `PASS`
5. Notification behavior: `PASS`
6. Dedup hardening: `PASS`
7. Stale references / V6 mentions: `PASS`

### Known Operational Limits
- The service does not independently validate purchase price against the BM API before payout.
- The service relies on Monday `status24 = Pay-Out` as the operational source of truth, rather than a broader QC checklist at execution time.
- The `"Payout validated"` dedup scan depends on recent Monday update history and is a best-effort duplicate suppression layer, not a persistent ledger.

### Verdict
SOP 03b now matches the standalone `bm-payout` service closely enough for operational use and accurately reflects the post-incident dedup hardening.
