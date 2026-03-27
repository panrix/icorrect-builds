# BM Payout Week Reconciliation

**Generated:** 27 Mar 2026  
**Week window used:** 23 Mar 2026 00:00 UTC through 27 Mar 2026 05:51 UTC  
**Purpose:** Reconcile the buybacks received this week against Monday Main Board, Monday BM Devices Board, and the rogue payout-watch evidence.

## Correction to earlier count

The earlier count of **3** was incomplete.

That count only covered the rogue payout-watch runs on:

- 25 Mar 2026 12:00 UTC
- 26 Mar 2026 12:00 UTC

The evidence log also shows an additional rogue auto-validation batch on:

- 23 Mar 2026 16:00 UTC

So the reconciled incident set for **this week** is **6 buybacks**, not 3.

## Historical scope of the rogue cron

The rogue payout-watch log shows **25 unique trade-ins** auto-validated from 16 Mar 2026 onward.

This week-specific reconciliation covers the **6** orders with BM `receivalDate` in the current week window.

## This week’s reconciled set

### Summary

| Category | Count |
|---|---:|
| Rogue-validated this week | 6 |
| Present on Main Board | 3 |
| Present on BM Devices Board | 3 |
| Present on both boards | 3 |
| Missing from both boards | 3 |

### Orders received this week and rogue-paid

| BM Trade-in ID | BM receivalDate | BM status now | Payment time | Main Board | BM Board | Notes |
|---|---|---|---|---|---|---|
| `GB-26104-JLRUD` | 23 Mar 2026 14:11 UTC | `MONEY_TRANSFERED` | 23 Mar 2026 16:22 UTC | Yes | Yes | Monday still says `Expecting Device` / `Diagnostic` |
| `GB-26113-TSKFU` | 23 Mar 2026 14:11 UTC | `MONEY_TRANSFERED` | 23 Mar 2026 16:33 UTC | Yes | Yes | Monday still says `Expecting Device` / `Diagnostic` |
| `GB-26121-TOFQG` | 23 Mar 2026 14:11 UTC | `MONEY_TRANSFERED` | 23 Mar 2026 16:44 UTC | Yes | Yes | Monday still says `Expecting Device` / `Diagnostic` |
| `GB-26097-GILUZ` | 25 Mar 2026 10:48 UTC | `MONEY_TRANSFERED` | 25 Mar 2026 12:13 UTC | No | No | No Monday record found on either board |
| `GB-26102-SUSBL` | 25 Mar 2026 11:28 UTC | `MONEY_TRANSFERED` | 25 Mar 2026 12:16 UTC | No | No | No Monday record found on either board |
| `GB-26111-NUHVL` | 26 Mar 2026 11:08 UTC | `PAID` | 26 Mar 2026 12:25 UTC | No | No | No Monday record found on either board |

## Detailed reconciliation

### 1. `GB-26104-JLRUD`

- BM detail:
  - Status: `MONEY_TRANSFERED`
  - Receival: `2026-03-23T14:11:35+00:00`
  - Payment: `2026-03-23T16:22:12+00:00`
  - Customer: `Jack Ryan`
- Main Board match:
  - Item `11553176608`
  - Name: `BM 1563 ( Jack Ryan )`
  - Group: `Incoming Future`
  - `status4`: `Expecting Device`
  - `status24`: `Diagnostic` (index 2)
  - Created: `2026-03-20 00:01:06 UTC`
- BM Devices Board match:
  - Item `11553108028`
  - Name: `BM 1563`
  - Group: `BM Trade-Ins`
  - Purchase price: `272`

### 2. `GB-26113-TSKFU`

- BM detail:
  - Status: `MONEY_TRANSFERED`
  - Receival: `2026-03-23T14:11:31+00:00`
  - Payment: `2026-03-23T16:33:41+00:00`
  - Customer: `Gemma Guarin`
- Main Board match:
  - Item `11553196759`
  - Name: `BM 1564 ( Gemma Guarin )`
  - Group: `Incoming Future`
  - `status4`: `Expecting Device`
  - `status24`: `Diagnostic` (index 2)
  - Created: `2026-03-20 00:01:06 UTC`
- BM Devices Board match:
  - Item `11553102917`
  - Name: `BM 1564`
  - Group: `BM Trade-Ins`
  - Purchase price: `245`

### 3. `GB-26121-TOFQG`

- BM detail:
  - Status: `MONEY_TRANSFERED`
  - Receival: `2026-03-23T14:11:23+00:00`
  - Payment: `2026-03-23T16:44:43+00:00`
  - Customer: `Gajal Gupta`
- Main Board match:
  - Item `11542999675`
  - Name: `BM 1562 ( Gajal Gupta )`
  - Group: `Incoming Future`
  - `status4`: `Expecting Device`
  - `status24`: `Diagnostic` (index 2)
  - Created: `2026-03-19 00:01:05 UTC`
- BM Devices Board match:
  - Item `11543014250`
  - Name: `BM 1562`
  - Group: `BM Trade-Ins`
  - Purchase price: `101`

### 4. `GB-26097-GILUZ`

- BM detail:
  - Status: `MONEY_TRANSFERED`
  - Receival: `2026-03-25T10:48:00+00:00`
  - Payment: `2026-03-25T12:13:53+00:00`
  - Customer: `Joey Moran`
- Main Board match:
  - None found
- BM Devices Board match:
  - None found

### 5. `GB-26102-SUSBL`

- BM detail:
  - Status: `MONEY_TRANSFERED`
  - Receival: `2026-03-25T11:28:05+00:00`
  - Payment: `2026-03-25T12:16:34+00:00`
  - Customer: `Millie Kemble`
- Main Board match:
  - None found
- BM Devices Board match:
  - None found

### 6. `GB-26111-NUHVL`

- BM detail:
  - Status: `PAID`
  - Receival: `2026-03-26T11:08:51+00:00`
  - Payment: `2026-03-26T12:25:51+00:00`
  - Customer: `Stephen Davis`
- Main Board match:
  - None found
- BM Devices Board match:
  - None found

## Interpretation

There are two distinct failure modes in this week’s set:

### A. Monday items existed, but the rogue cron paid before intake state changed

Affected:

- `GB-26104-JLRUD`
- `GB-26113-TSKFU`
- `GB-26121-TOFQG`

These orders exist on both Monday boards, but Main Board still shows:

- Group: `Incoming Future`
- `status4 = Expecting Device`
- `status24 = Diagnostic`

So BM had already marked the device as received and paid it, while Monday still reflected pre-receipt state.

### B. Orders were paid with no Monday record at all

Affected:

- `GB-26097-GILUZ`
- `GB-26102-SUSBL`
- `GB-26111-NUHVL`

No match was found on either:

- Main Board `text_mky01vb4`
- BM Devices Board `text_mkqy3576`

This is the more severe gap because payout happened with no Monday trace on either operational board.

## Evidence basis

Week-specific rogue runs:

- `2026-03-23 16:00 UTC`
- `2026-03-25 12:00 UTC`
- `2026-03-26 12:00 UTC`

The unique rogue-validated ID list was extracted from:

- `/home/ricky/builds/backmarket/audit/payout-incident-evidence-2026-03-27/buyback-payout-watch.log.snapshot`

Board reconciliation used live Monday GraphQL reads against:

- Main Board `349212843` via `text_mky01vb4`
- BM Devices Board `3892194968` via `text_mkqy3576`

BM timestamps/statuses used live per-order reads against:

- `GET /ws/buyback/v1/orders/{orderPublicId}`

## Bottom line

For the current week window, the reconciled set is **6 rogue-paid buybacks**:

- 3 were present on both Monday boards but still showed pre-receipt state
- 3 had no Monday record on either board

So the answer is:

- **No, it was not only 3 orders**
- **For this week, it was 6**
- **Across the evidence log since 16 Mar 2026, it was 25 unique orders**
