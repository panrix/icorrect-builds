# SOP 11: Tuesday Cutoff Protocol

**Version:** 1.0
**Date:** 2026-03-20
**Scope:** Ensuring all accepted BM orders are shipped and tracking submitted before the weekly payout cutoff.
**Owner:** Agent (scheduled check) + team

---

## Overview

Back Market's payout cycle runs **Wednesday to Tuesday**. All orders shipped and tracking-confirmed by **Tuesday EOD UK time** count toward that week's payout. Missing the cutoff delays payment by a full week.

This SOP is a weekly operational discipline to prevent revenue delays.

---

## Payout Cycle

| Day | Event |
|-----|-------|
| Wednesday | New payout cycle begins |
| Monday (afternoon) | Agent runs cutoff check (SOP 11) |
| Tuesday (morning) | Final chase for outstanding shipments |
| Tuesday (EOD UK) | **CUTOFF**: all tracking must be submitted to BM |
| Wednesday | BM processes payout for previous cycle |

---

## Step 1: Monday Afternoon Check

Every Monday at ~14:00 UK time, query BM for all state=3 orders (accepted but not yet shipped):

```
GET https://www.backmarket.co.uk/ws/orders?state=3&limit=50
Headers:
  Authorization: $BACKMARKET_API_AUTH
  Accept-Language: en-gb
```

---

## Step 2: Cross-Reference Monday for Tracking

For each state=3 order, check if tracking has been submitted:

1. Match order to BM Devices Board via `text_mkye7p1c` (Sales Order ID)
2. Find linked Main Board item via `board_relation`
3. Check `text53` (Outbound Tracking) on Main Board

```graphql
{ boards(ids: [349212843]) {
  items_page(limit: 200, query_params: {
    rules: [{ column_id: "status24", compare_value: ["10"] }]
  }) {
    items { id name
      column_values(ids: ["text53", "status4", "text_mky01vb4"]) { id text }
    }
  }
} }
```

| Column ID | Title | Check |
|-----------|-------|-------|
| `text53` | Outbound Tracking | Must NOT be empty |
| `status4` | Status | Should be "Shipped" (index 160) or "To Ship" |

---

## Step 3: Identify At-Risk Orders

An order is "at risk" if ANY of these are true:
- State=3 on BM (accepted) but `text53` empty on Monday (no tracking)
- State=3 on BM but `status4` ≠ "Shipped" (device not physically shipped yet)
- Tracking exists on Monday but ship confirmation NOT sent to BM (no "BM notified" in updates)

---

## Step 4: Alert

Send to BM Telegram (`-1003888456344`):

### If at-risk orders exist:
```
⚠️ Tuesday Cutoff Alert — {count} orders at risk

Orders without tracking:
• {device_name} — Order {order_id} — Accepted {date}
• ...

Orders with tracking but NOT confirmed to BM:
• {device_name} — Order {order_id} — Tracking: {tracking}
• ...

All tracking must be submitted by Tuesday EOD UK time for this week's payout.
```

### If all clear:
```
✅ Tuesday Cutoff Check — All {count} accepted orders have tracking submitted. Clean week.
```

---

## Step 5: Tuesday Morning Follow-Up

If any orders were flagged on Monday:

1. Re-run the check at ~09:00 UK Tuesday
2. Chase team directly for any still-outstanding tracking
3. If tracking available: ensure `status4` is set to "Shipped" to trigger the webhook (SOP 09)
4. Final alert to BM Telegram by 14:00 UK if any remain unresolved

---

## Step 6: Overdue Order Escalation

BM shows "Overdue" on orders accepted but not shipped within their SLA (typically 2-3 business days).

| Overdue Duration | Action |
|------------------|--------|
| 1 day overdue | Monday alert, chase team |
| 2+ days overdue | BM Telegram alert + escalate to Ricky |
| 3+ days overdue | Risk of BM penalty / forced cancellation. Immediate action required. |

---

## What Does NOT Happen

- This SOP does NOT buy labels (that's SOP 09)
- This SOP does NOT confirm shipments to BM (that's SOP 09)
- This SOP does NOT accept orders (that's SOP 08)
- This SOP does NOT process payments (that's SOP 10)
- This is a monitoring/alerting protocol only: it does not execute any BM API calls

---

## Error Handling

| Issue | Action |
|-------|--------|
| BM API down on Monday check | Retry in 1 hour. If still down, use Monday data only. |
| Monday data inconsistent with BM | Trust BM state. If BM says state=3 but Monday says Shipped, check if webhook fired. |
| Order accepted but device not ready | Escalate to team immediately. Device may need emergency repair or label buying. |

---

## Boards & Columns Reference

| Board | ID | Key Columns |
|-------|----|-------------|
| Main Board | 349212843 | `text53` (Outbound Tracking), `status4` (Status), `status24` (Repair Type = Sold, index 10) |
| BM Devices Board | 3892194968 | `text_mkye7p1c` (BM Sales Order ID) |

---

## Notifications

All alerts to BM Telegram: `-1003888456344`

---

## Implementation Location

| Component | Location | Status |
|-----------|----------|--------|
| Monday check script | Not yet built | NEEDED: scheduled cron job |
| Schedule | Monday 14:00 UK, Tuesday 09:00 UK | Target schedule |
| Notifications | BM Telegram `-1003888456344` | Target channel |

> **❓ Question for Ricky:** Hugo's SOP-S6 says "submit all outstanding tracking to BM by Monday EOD UK time" but the task description says Tuesday EOD. The payout cycle is Wed-Tue. Which is the actual internal deadline: Monday EOD (buffer day) or Tuesday EOD (actual cutoff)?
