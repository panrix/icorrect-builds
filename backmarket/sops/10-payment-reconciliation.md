# SOP 10: Payment & Revenue Reconciliation (Sales Side)

**Version:** 1.0
**Date:** 2026-03-20
**Scope:** Tracking BM payments to iCorrect after buyer receives device. This is the SALES revenue side, NOT trade-in payout (that's SOP 03b).
**Owner:** Agent / manual process (no webhook exists yet)

---

## Overview

After a device ships (SOP 09) and the buyer receives it, Back Market processes payment to iCorrect. BM takes a 10% commission on the sale price. Payments follow a weekly cycle: Wednesday to Tuesday.

This SOP covers monitoring, reconciliation, and reporting of those payments.

---

## Revenue Model

| Component | Calculation |
|-----------|-------------|
| Sale price (gross) | Listed price on BM |
| BM commission (sales) | 10% of sale price |
| Net revenue to iCorrect | Sale price × 0.90 |
| BM commission (buyback) | 10% of purchase price (paid at trade-in) |
| Total BM take | 10% on buy + 10% on sell (double-dip) |

---

## Step 1: Monitor Completed Orders

Poll BM API for shipped/completed orders:

```
GET https://www.backmarket.co.uk/ws/orders?state=9&limit=50
Headers:
  Authorization: $BACKMARKET_API_AUTH
  Accept-Language: en-gb
```

State 9 = shipped/complete. These orders are awaiting or have received payment.

---

## Step 2: Cross-Reference Monday

For each completed order, verify against Monday:

### Main Board (349212843)

| Column ID | Title | Check |
|-----------|-------|-------|
| `status24` | Repair Type | Should be "Sold" (index 10) |
| `date_mkq34t04` | Date Sold (BM) | Sale date recorded |
| `text53` | Outbound Tracking | Tracking submitted |

### BM Devices Board (3892194968)

| Column ID | Title | Check |
|-----------|-------|-------|
| `text_mkye7p1c` | BM Sales Order ID | Matches BM order ID |
| `numeric5` | Sale Price (ex VAT) | Expected sale price |
| `text4` | Sold to | Buyer name matches |

---

## Step 3: Reconcile Expected vs Actual

For each order:

1. **Expected revenue:** `numeric5` (Sale Price) on BM Devices Board × 0.90 (minus 10% BM commission)
2. **Actual revenue:** From BM payout report / bank statement
3. **Flag discrepancies:** If actual ≠ expected by more than £1, investigate

### Common Discrepancy Causes
- BM applied additional fees (rare)
- Currency rounding (pence differences: ignore if < £1)
- Partial refund issued to buyer
- Return processed (buyer sent device back)
- Promotional discount applied by BM

---

## Step 4: Update Monday with Actual Revenue

> **❓ Question for Ricky:** There is no dedicated "Revenue Received" or "BM Payout Amount" column on either board currently. Which column should actual payment amounts be written to? Options:
> 1. Add a new numeric column on Main Board
> 2. Add a new numeric column on BM Devices Board
> 3. Use the existing `dup__of_quote_total` (Paid) column on Main Board (currently used for customer payments)
> 4. Track in external spreadsheet only

> **Status:** Still open as of 2026-03-28. No referenced script currently writes an actual payout amount back to Monday.

---

## Step 5: Payout Cycle Tracking

| Detail | Value |
|--------|-------|
| Cycle period | Wednesday to Tuesday |
| Cutoff | Tuesday EOD UK time |
| Payout timing | Following Wednesday (typically) |
| Orders included | All state=9 orders shipped by Tuesday cutoff |

Timely dispatch to hit the cutoff is handled operationally via `dispatch.js` (weekday 07:00 + 12:00 UTC) and the `stuck-inventory-audit.js` workflow (Phase 1 of the rebuild).

---

## Step 6: Weekly Reconciliation Report

Every Wednesday (after payout processes), generate and send report to BM Telegram (`-1003888456344`):

```
📊 Weekly BM Payout Reconciliation
Period: {Wed DD/MM} to {Tue DD/MM}

Orders shipped: {count}
Expected revenue: £{total}
BM commission: £{commission}
Net expected: £{net}

Discrepancies: {count or "None"}
{list any discrepancies}
```

---

## Profitability Per Device

The BM Devices Board still has historical formula columns for per-device profitability:

| Column ID | Title | Calculation |
|-----------|-------|-------------|
| `formula` | Backmarket Fee | Sale price × 10% |
| `formula_1` | Gross Profit | Sale price - purchase price - BM fee |
| `formula7` | Tax | VAT calculation |
| `formula_mm0xekc4` | Net Profit | After all costs |
| `formula_mm0za8kh` | Total costs | Purchase + parts + labour + shipping |
| `formula_mm0ykbya` | % net Profit | Net profit as percentage |

These are display/historical columns only. Automation must not rely on them:
- `formula_mm0za8kh` is deprecated; it depends on sale-price-derived columns and stale mirror wiring, so it is not a stable pre-sale cost source.
- `formula_mm0xekc4` / `formula_mm0ykbya` can be UI-only or GraphQL-null when formula/mirror dependencies are involved.
- `numeric5` is the actual sale price written by SOP 08 after a real BM order is detected.

Use `numeric_mm1mgcgn` as the stored Total Fixed Cost (`purchase + parts + labour + shipping + BM buy fee`). Projected and actual fee/tax/net/margin must be calculated in VPS code from source data and the relevant sale/listing price.

---

## What Does NOT Happen

- This SOP does NOT process trade-in payouts to customers (that's SOP 03b)
- This SOP does NOT accept or detect sales (that's SOP 08)
- This SOP does NOT handle returns or refunds (that's SOP 12)
- This SOP does NOT submit tracking (that's SOP 09)
- There is currently NO automated payment reconciliation system: this is a manual/agent process
- BM does not provide a real-time webhook for "payment sent": reconciliation relies on polling orders and bank statements

---

## Error Handling

| Issue | Action |
|-------|--------|
| Order on BM but not on Monday | Flag: "Order {id} completed on BM but not found on Monday. Possible missed SOP 08." |
| Sale price mismatch | Flag: "Order {id}: Monday shows £X, BM shows £Y." Investigate cause. |
| Missing Sale Price on Monday | `numeric5` empty on BM Devices: sale wasn't properly recorded in SOP 08 |
| Payment delayed beyond 7 days | Escalate to Ricky: potential BM issue or order dispute |

---

## Boards & Columns Reference

| Board | ID | Key Columns |
|-------|----|-------------|
| Main Board | 349212843 | `status24` (Sold = index 10), `date_mkq34t04` (Date Sold), `text53` (Tracking) |
| BM Devices Board | 3892194968 | `numeric5` (Sale Price), `numeric` (Purchase Price), `text_mkye7p1c` (Order ID), formula columns |

---

## Implementation Location

| Component | Location | Status |
|-----------|----------|--------|
| Profitability check script | `/home/ricky/builds/backmarket/scripts/profitability-check.js` | Active support tool |
| Reconcile script | `/home/ricky/builds/backmarket/scripts/reconcile.js` | Active support tool |
| Automated reconciliation | Not yet built | NEEDED |
| Notifications | BM Telegram `-1003888456344` | Target channel |

## QA Notes (2026-03-28)

### Findings
1. `PASS` Dead `bm-scripts/` paths corrected.
   The referenced scripts now live under `/home/ricky/builds/backmarket/scripts/`.

2. `PASS` Actual payout-column question preserved and clarified.
   The unresolved question about where to store actual BM payment amounts remains valid, and none of the referenced scripts resolves it today.

3. `PASS` Column IDs referenced in the SOP are broadly compatible with the scripts.
   Cross-checked:
   - `status24`
   - `date_mkq34t04`
   - `text53`
   - `text_mkye7p1c`
   - `numeric5`
   - `text4`
   - `numeric`
   The supporting scripts also use additional profitability/listing columns outside the core SOP flow.

4. `MEDIUM` The referenced scripts do not implement the full SOP end-to-end.
   - `profitability-check.js` is a daily support tool for live-listing profitability and buy-box monitoring
   - `reconcile.js` is a listing reconciliation tool (ghost listings, qty mismatches, orphans)
   - neither script is a dedicated BM payment-reconciliation engine that compares actual bank receipts to expected payouts
   So the SOP should be treated as a manual/agent process with supporting tools, not as an automated workflow already implemented in code.

5. `PASS` Manual/agent ownership clarified.
   This SOP is primarily a manual/agent process. The scripts provide supporting visibility, not the core reconciliation loop.

6. `PASS` No V6 references found.

### Per-check Summary
1. Script path accuracy: `PASS`
2. Open payout-column question status: `PASS`
3. Column IDs vs supporting scripts: `PASS`
4. Script capability vs SOP scope: `PARTIAL — support tools only`
5. Manual/agent-process framing: `PASS`
6. V6 references: `PASS`

### Known Operational Limits
- There is still no dedicated automated payment-reconciliation system comparing BM receipts or bank statement values against expected revenue.
- `profitability-check.js` posts to Slack and focuses on listing profitability, not revenue receipt reconciliation.
- `reconcile.js` focuses on listing/inventory integrity, not payments.
- Actual payout amount writeback to Monday remains unresolved.

### Verdict
SOP 10 is still primarily a manual/agent process SOP. The referenced scripts are useful supporting tools, but they do not yet constitute the automated payment-reconciliation implementation the SOP describes.
