# Xero vs Monday Reconciliation Gap

Built: 2026-04-02

Window analysed: `2025-10-02` to `2026-04-02`

## Scope

Read-only analysis of:

- Xero invoices and payments for the last 6 months
- Monday main repair board payment and invoice fields
- Match quality and value gaps between the two systems

## Context carried in

- Prior audit work already identified broken payment write-back and an ownerless reconciliation gap across Monday, Xero, Stripe, and SumUp.
- Prior findings cited roughly `343` ghost invoices and about `£91k` of fake debt as a suspected issue surface. This report re-checks the live Xero vs Monday position rather than relying on that older estimate.

## Method

1. Read local finance and Monday schema context.
2. Exchange the Xero refresh token for a live access token.
3. Save any rotated Xero refresh token returned by the token exchange to a temp file and record its path here.
4. Pull 6 months of Xero invoices, payments, and supporting contact data.
5. Pull Monday main-board items with payment or invoice evidence.
6. Attempt Xero-to-Monday matching by invoice id, invoice number/reference, amount, customer name, item name, and nearby dates.
7. Quantify unmatched count and value in both directions.

## Operational notes

- Monday rate limit target: `<= 1 request / second`
- Xero rate limit handling: retry/backoff if `429` is returned
- New Xero refresh token temp file: `/tmp/xero-recon-ATuAJ1/xero-refresh-token.txt`

## Executive Readout

- This is not a `£5k` problem. The cleanest current read is **mid-five-figures**, not low-five-figures.
- On the Xero -> Monday side, `75 / 295` Xero invoices in the 6-month window are still **unresolved against Monday** after matching. Their value is `£32,063.62`, of which `£31,061.62` is live invoice value (`PAID` or `AUTHORISED`) and `£5,512.20` is still outstanding in Xero.
- On the Monday -> Xero side, `372 / 539` Monday items with positive payment evidence in the same 6-month creation window have **no strong Xero match**, totalling `£92,162.00`.
- That `£92.2k` Monday-side number is **not all missing Xero invoicing**. It is mostly spread across `Not Taken`, `Shopify`, and `Cash`, not rows explicitly marked `Invoiced - Xero`.
- The genuinely Xero-shaped Monday gap is smaller but still material: `21` Monday rows marked `Invoiced - Xero` have no strong Xero match, totalling `£9,317.00`.
- The gap does **not** look mostly like ghost Xero drafts. There are only `4` unresolved Xero drafts, and only `£556.00` of that has non-zero value. The larger control failure is broken linkage and payment-state contamination, especially around corporate / batched invoice handling.

## Xero Side

### Invoice and payment pull

- Xero invoices pulled: `301` raw sales invoices in window, including `6` `DELETED`
- Xero invoices used for reconciliation: `295` (`PAID`, `AUTHORISED`, `DRAFT`, `VOIDED`; there were `0` `SUBMITTED`)
- Xero payments pulled: `319`
- Contacts pulled: `1,469`

### Summary

| Metric | Value |
|---|---:|
| Total invoiced, live statuses only (`PAID` + `AUTHORISED`) | `£89,760.58` |
| Total invoiced, non-deleted including drafts/voids | `£94,527.58` |
| Payments received in Xero | `£103,175.70` |
| Outstanding (`AUTHORISED`) | `£6,417.20` |
| Overdue as of `2026-04-02` | `£4,763.20` |

### Status breakdown

| Status | Count | Total | Amount due |
|---|---:|---:|---:|
| `PAID` | `259` | `£83,343.38` | `£0.00` |
| `AUTHORISED` | `14` | `£6,417.20` | `£6,417.20` |
| `DRAFT` | `11` | `£1,940.00` | `£1,940.00` |
| `VOIDED` | `11` | `£2,827.00` | `£0.00` |
| `DELETED` | `6` | `£439.00` | `£0.00` |

### Largest customers by invoiced value

| Contact | Invoiced total | Amount due | Payments received |
|---|---:|---:|---:|
| Mother London | `£6,507.01` | `£0.00` | `£6,507.01` |
| ITX UK LTD | `£5,649.00` | `£2,182.00` | `£5,309.00` |
| Space Made Group Limited | `£1,998.98` | `£0.00` | `£1,998.98` |
| The Computer Clinic Ltd | `£1,637.00` | `£599.00` | `£1,038.00` |
| Dwayne Morris | `£1,511.78` | `£508.00` | `£1,003.78` |
| HaysMac | `£1,481.00` | `£0.00` | `£1,588.80` |
| Eden Repair Centre | `£1,218.00` | `£0.00` | `£1,218.00` |
| Freud Communications Limited | `£1,146.00` | `£1,146.00` | `£795.99` |

### Largest outstanding / overdue contacts

| Contact | Amount due | Overdue | Draft value |
|---|---:|---:|---:|
| ITX UK LTD | `£2,182.00` | `£1,914.00` | `£268.00` |
| Freud Communications Limited | `£1,146.00` | `£0.00` | `£0.00` |
| VCCP GROUP LLP | `£613.00` | `£187.00` | `£426.00` |
| The Computer Clinic Ltd | `£599.00` | `£599.00` | `£0.00` |
| Pret A Manger (Europe) Limited | `£584.20` | `£584.20` | `£0.00` |
| Ron Orders - CineContact | `£549.00` | `£0.00` | `£549.00` |
| Dwayne Morris | `£508.00` | `£0.00` | `£0.00` |

## Monday Side

### Live finance-field reality on the main repair board

Board analysed: `349212843`

The Monday finance surface is materially contaminated:

- `payment_status` populated on `4,465 / 4,465` items
- `payment_method` populated on `4,465 / 4,465` items
- `Invoice Status` populated on `4,465 / 4,465` items
- `Invoice Status = Voided` on **all `4,465` items**
- `Xero Invoice ID` populated on `0 / 4,465` items
- `Invoice Amount` populated on `0 / 4,465` items
- `Payments Reconciled` populated on `0 / 4,465` items
- `Payment 1 Ref/Amt/Date` populated on only `82` items
- `Payment 2 Ref/Amt/Date` populated on only `8` items
- `Paid` amount column populated on `1,806` items, positive on `1,690`

This means:

- `payment_status`, `payment_method`, and `invoice_status` are not reliable evidence on their own
- `Invoice Status` cannot be used as truth because it is defaulted to `Voided` everywhere
- the only practical positive payment evidence is amount-bearing fields: `Paid`, `Payment 1 Amt`, and `Payment 2 Amt`

### 6-month Monday subset

Using Monday items created in the same 6-month window:

| Metric | Value |
|---|---:|
| Monday items created in window | `1,565` |
| Items with positive amount evidence | `539` |
| Amount total across those items | `£158,682.35` |
| Items with `Payment 1/2` slot evidence | `82` |

### Completed but no payment evidence

Completed statuses used here: `Returned`, `Shipped`, `Ready To Collect`, `Return Booked`

| Metric | Value |
|---|---:|
| Completed items with no positive amount evidence | `748` |
| Of those, `BM` client rows | `516` |
| Of those, non-BM / non-warranty rows | `176` |
| Of those, corporate / B2B | `118` |
| Of those, end-user / unconfirmed | `58` |
| Completed-no-payment rows marked `Invoiced - Xero` | `0` |

Method split inside that `748`:

- `BM Sale`: `468`
- `Not Taken`: `214`
- `Warranty`: `56`
- `Cash`: `9`
- `Stripe Payment`: `1`

Readout:

- The raw count looks alarming, but it is mostly **BM rows with no amount write-back**, not a clean direct cash-loss number.
- There is still a real control issue in the `176` non-BM/non-warranty rows, especially corporate/B2B completions with no amount evidence.

### Payment evidence but not marked complete

| Metric | Value |
|---|---:|
| Positive-amount rows not in a completed status | `69` |
| Value on those rows | `£11,085.00` |

Largest method buckets:

- `Shopify`: `30` rows, `£4,176.00`
- `Invoiced - Xero`: `7` rows, `£3,427.00`
- `Not Taken`: `27` rows, `£2,908.00`

This looks like a mix of:

- normal prepaid Shopify work still in progress
- Xero-billed jobs still moving through ops
- a smaller tail of plainly inconsistent Monday state

## Reconciliation

### Matching method

Because Monday has no populated `Xero Invoice ID`, matching had to be heuristic.

Matching signals used:

- exact contact email
- contact-name overlap
- Monday item name / company overlap
- model / device code overlap (`A2338`, `A2779`, etc.)
- exact or near amount match
- date proximity
- `payment_method = Invoiced - Xero` as a weak hint only

Interpretation:

- `220` Xero invoices matched strongly
- `74` more had plausible Monday candidates but stayed ambiguous
- only `1` had no plausible Monday candidate at all, and that was a zero-value paid invoice (`INV-3197`)

For sizing the gap, the right number is therefore **unresolved = unmatched + ambiguous**, not just hard no-match.

### Xero invoices unresolved against Monday

| Metric | Value |
|---|---:|
| Xero invoices reconciled strongly to Monday | `220 / 295` |
| Xero invoices unresolved | `75 / 295` |
| Unresolved invoice value | `£32,063.62` |
| Unresolved live invoice value (`PAID` + `AUTHORISED`) | `£31,061.62` |
| Unresolved outstanding still open in Xero | `£5,512.20` |

Status split of unresolved Xero invoices:

- `PAID`: `58`
- `AUTHORISED`: `9`
- `DRAFT`: `4`
- `VOIDED`: `4`

Largest unresolved contact buckets:

| Contact | Count | Total | Due | Why it is unresolved |
|---|---:|---:|---:|---|
| Mother London | `1` | `£6,208.01` | `£0.00` | batched multi-device invoice |
| ITX UK LTD | `4` | `£5,649.00` | `£2,182.00` | grouped corporate invoice batches across multiple devices / cost codes |
| Space Made Group Limited | `2` | `£1,998.98` | `£0.00` | grouped corporate jobs |
| HaysMac | `5` | `£1,481.00` | `£0.00` | multiple small batched repairs |
| Eden Repair Centre | `1` | `£1,218.00` | `£0.00` | grouped repair invoice |
| Freud Communications Limited | `1` | `£1,146.00` | `£1,146.00` | live corporate receivable with no clean Monday link |
| Dwayne Morris | `4` | `£837.57` | `£508.00` | split across multiple invoices / Monday candidates |

Interpretation:

- the unresolved Xero surface is **mostly corporate / batched invoice ambiguity**, not a swarm of random orphan retail invoices
- there is still a real live open-control gap because `£5.5k` remains outstanding and not cleanly linked back to Monday jobs

### Monday paid items with no strong Xero match

Using only Monday rows with positive amount evidence in the 6-month creation window:

| Metric | Value |
|---|---:|
| Monday paid-evidence rows | `539` |
| Monday paid-evidence rows with no strong Xero match | `372` |
| Value on those rows | `£92,162.00` |

Method split:

| Payment method | Count | Value |
|---|---:|---:|
| `Not Taken` | `176` | `£45,084.00` |
| `Shopify` | `103` | `£23,544.00` |
| `Cash` | `55` | `£10,840.00` |
| `Invoiced - Xero` | `21` | `£9,317.00` |
| `Stripe Payment` | `10` | `£2,255.00` |
| `Warranty` | `5` | `£745.00` |
| `BM Sale` | `2` | `£377.00` |

Interpretation:

- the headline `£92.2k` is **not a pure Xero-missing number**
- most of it is alternative payment rails or Monday state contamination
- the more serious Xero-specific Monday-side miss is the `£9,317.00` on `21` rows already tagged `Invoiced - Xero`

### Ghost draft invoices

Clear ghost drafts with no plausible Monday job: **none found**

What does exist:

- `4` unresolved draft invoices
- only `£556.00` of that draft value is non-zero
- `2` of those drafts are zero-value shells

Unresolved draft examples:

| Invoice | Contact | Total | Notes |
|---|---|---:|---|
| `INV-3363` | ITX UK LTD | `£268.00` | draft, batched corporate lines |
| `INV-3424` | VCCP GROUP LLP | `£288.00` | draft, plausible Monday candidate but not unique |
| `INV-3421` | The Children’s Hospital School at GOSH & UCH | `£0.00` | zero-value draft shell |
| `INV-3422` | VCCP GROUP LLP | `£0.00` | zero-value draft shell |

So the gap is **not mostly ghost Xero drafts**.

## Bottom Line

If the question is “is this a `£5k` problem or a `£50k` problem?”:

- It is **clearly bigger than `£5k`**
- The clean Xero-linked unresolved surface is about **`£32.1k`**
- The direct Monday rows explicitly claiming to be Xero-linked but lacking a strong Xero match add another **`£9.3k`**
- The broader Monday paid-state mess is larger at **`£92.2k`**, but most of that is not clean missing-Xero value and should not be double-counted as invoice debt

Best current sizing:

- **Operational reconciliation control gap:** roughly `£30k-£40k`
- **Not mostly ghost drafts**
- **Mostly broken linkage, ambiguous batched corporate invoices, and contaminated Monday payment state**
