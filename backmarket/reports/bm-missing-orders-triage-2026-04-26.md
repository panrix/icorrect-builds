# BM Missing Trade Orders Triage

Date: `2026-04-26`  
Mode: **Read-only only**. No Monday writes, no Back Market writes, no customer contact, no portal mutation.

## Jarvis Summary

- I reviewed the 9 missing BM Devices orders and the 1 duplicate/ambiguous order from [`bm-trade-order-bm-devices-reconcile-2026-04-26-030005.md`](/home/ricky/builds/backmarket/reports/bm-trade-order-bm-devices-reconcile-2026-04-26-030005.md).
- `2` are not true "missing BM Devices" rows. They are return/relist linkage artifacts where the BM Devices row still exists, but the trade-in ID ended up on an older or duplicate Main item instead of the active linked pair: `GB-26041-JRPAI`, `GB-26093-LRQDH`.
- `2` are clean Main-only partial imports: Main Board item exists, but no BM Devices item exists by BM number, mirror, or relation: `GB-26052-PRBJO`, `GB-26135-BVOPS`.
- `4` look like real missing records with no Main or BM Devices evidence at all: `GB-26014-XYUFE`, `GB-26053-BURRH`, `GB-26063-LSMJW`, `GB-26091-SPTIB`. `GB-26014-XYUFE` and `GB-26091-SPTIB` both still show BM suspend reason `customer_account_present`.
- `1` is likely same-customer duplicate-order conflation: `GB-26131-IRPSF`. There is a live Bill Kanjee Main+BM pair, but it is tied to `GB-26127-MYNCQ`, while `GB-26131-IRPSF` has a different tracking number and no second Monday/BM Devices row.
- The duplicate/ambiguous case `GB-26074-WNOOH` is a real duplicate attachment: the order is on both old returned `BM 1436` and new incoming `BM 1547`.

## Evidence Used

- Primary reconcile report: [`bm-trade-order-bm-devices-reconcile-2026-04-26-030005.md`](/home/ricky/builds/backmarket/reports/bm-trade-order-bm-devices-reconcile-2026-04-26-030005.md)
- Primary reconcile JSON: [`bm-trade-order-bm-devices-reconcile-2026-04-26-030005.json`](/home/ricky/builds/backmarket/reports/bm-trade-order-bm-devices-reconcile-2026-04-26-030005.json)
- Historical gap report: [`docs/historical/audits-2026-02-27-to-03-27/reconciliation-report-2026-03-02.md`](/home/ricky/builds/backmarket/docs/historical/audits-2026-02-27-to-03-27/reconciliation-report-2026-03-02.md)
- Historical listing/reconciliation snapshots:
  - [`reconciliation-2026-04-13.json`](/home/ricky/builds/backmarket/docs/historical/reconciliation-snapshots-2026-03-2026-04/reconciliation-2026-04-13.json)
  - [`reconciliation-2026-04-14.json`](/home/ricky/builds/backmarket/docs/historical/reconciliation-snapshots-2026-03-2026-04/reconciliation-2026-04-14.json)
- Live read-only Monday GraphQL checks:
  - Main Board `349212843` via `text_mky01vb4`, `status4`, `status24`, `text4`, `creation_log4`
  - BM Devices `3892194968` via `lookup_mm1vzeam`, `board_relation`, `text_mkyd4bx3`, `text89`, `text_mkye7p1c`, `numeric`
- Live read-only BM buyback `GET /ws/buyback/v1/orders/{publicId}` for all 10 cases

## Case Table

| Order | Evidence checked | Likely cause | Recommended action | Confidence |
|---|---|---|---|---|
| `GB-26014-XYUFE` | BM API: `MONEY_TRANSFERED`, tracking `YR434984137GB`, suspend reason `customer_account_present`. Reconcile: no Main, no BM Devices. Historical 2026-03-02 report also flagged it as genuinely missing. | Real missing record. Likely import gap; suspension may have contributed. No evidence of item existing under another identifier. | Physical/device-location check first. If device exists, recreate/import both Monday records. If not found, treat as missing-receipt dispute candidate with BM. | High |
| `GB-26041-JRPAI` | Main item `11168368510` `BM 1376 ( Martin Bingham )`, serial `FVFFQ1MMQ6L3`, trade-in ID set to `GB-26041-JRPAI`. BM Devices item `11168346452` `BM 1376` exists, mirror blank, linked instead to Main item `11535526352` `BM 1376 ( Martin Bingham ) (RTN > REPAIR)` with the same serial `FVFFQ1MMQ6L3`. | Return/relist artifact plus data-linking issue. BM Devices row exists, but the trade-in ID sits on the older Main item while the BM Devices row is linked to the later relist Main item. | Manual cleanup: confirm which Main item is canonical, move the trade-in ID to the active linked chain, and clear the stale duplicate placement. No new BM Devices row needed. | High |
| `GB-26052-PRBJO` | Main item `11191599665` `BM 1389 ( Sacha Rhys Johnson )`, serial `DQ74Y6439N`, group `Safan (Short Deadline)`, `status24=Purchased`. Historical 2026-03-02 report already called this "Main Board but no BM board item". No BM Devices item found by BM number, mirror, or relation. | Partial import failure after Main creation. Main exists; BM Devices create/link step likely failed. | Create/recreate the missing BM Devices item and link it to Main `11191599665`. Verify purchase price/trade-in ID after creation. | High |
| `GB-26053-BURRH` | BM API: `MONEY_TRANSFERED`, tracking `YR546696904GB`. Reconcile: no Main, no BM Devices. Historical 2026-03-02 report also flagged it as genuinely missing. | Real missing record. No evidence of item existing under another identifier. | Physical/device-location check. If found, recreate/import both records; if not, escalate as missing received device. | High |
| `GB-26063-LSMJW` | BM API: `MONEY_TRANSFERED`, tracking `YR558965912GB`. Reconcile: no Main, no BM Devices. Historical 2026-03-02 report also flagged it as genuinely missing. | Real missing record. No evidence of item existing under another identifier. | Physical/device-location check. If found, recreate/import both records; if not, escalate as missing received device. | High |
| `GB-26091-SPTIB` | BM API: `MONEY_TRANSFERED`, tracking `YR719989634GB`, suspend reason `customer_account_present`. Reconcile: no Main, no BM Devices. | Real missing record. Likely import gap; suspension may have contributed. No evidence of item existing under another identifier. | Physical/device-location check first, then recreate/import if found. If not found, raise as missing despite BM receival/payment evidence. | Medium-High |
| `GB-26093-LRQDH` | Main item `11451937171` `BM 1533 *Leah Graham's Replacement`, serial `HFPMVDQV9J`, trade-in ID set to `GB-26093-LRQDH`. BM Devices item `11451931473` `BM 1533` exists, mirror blank, linked to Main `11568991248` `BM 1533 *Leah Graham's Replacement (RTN > REFUND)` with the same serial `HFPMVDQV9J`. Historical snapshots on 2026-04-11/13/14 show that BM Devices row live and listed. | Return/relist/refund artifact plus data-linking issue. BM Devices row exists, but the trade-in ID is attached to the wrong Main item and the active BM pair has blank trade-in linkage. | Manual cleanup: keep the active relist/refund chain as canonical, repopulate/correct the trade-in ID on the active linked records, and clear the stale duplicate Main placement. No new BM Devices row needed. | High |
| `GB-26131-IRPSF` | BM API: `MONEY_TRANSFERED`, tracking `YR828127459GB`, customer Bill Kanjee. No Main/BM Devices for this order. But live Main `11624764027` `BM 1575 ( Bill Kanjee )` and BM Devices `11624764485` `BM 1575` exist under `GB-26127-MYNCQ`, same customer and same model/spec, with different tracking `YR828103545GB`. Historical snapshots on 2026-04-13/14 show that `BM 1575` pair live and listed under `GB-26127-MYNCQ`. | Likely same-customer duplicate-order conflation. Evidence suggests one Bill Kanjee device was imported under `GB-26127-MYNCQ`, but `GB-26131-IRPSF` is probably a second distinct order with no second Monday/BM Devices row. | Verify physically whether there were two Bill Kanjee units. If yes, create the missing second Main+BM Devices pair for `GB-26131-IRPSF`. If only one device existed, audit which order ID should remain canonical. | Medium |
| `GB-26135-BVOPS` | Main item `11658468870` `BM 1581 ( Richard Sampson )`, serial `G5QV3CJRQ5`, group `Awaiting Parts`, `status24=IC OFF`. No BM Devices item found by BM number, mirror, relation, or name. | Partial import failure after Main creation. Main exists; BM Devices row was never created or was lost very early. | Create/recreate the missing BM Devices item and link it to Main `11658468870`. | High |
| `GB-26074-WNOOH` | Main duplicates: `11507124007` `BM 1547 ( Adam Henry Moloney )` in `Incoming Future` with blank serial and `11286900464` `BM 1436 (Nathan Bu)` in `Returned` with serial `FVHFF4YLQ05D`; both carry `GB-26074-WNOOH`. BM Devices duplicates: `11507103406` `BM 1547` linked to `11507124007` and `11286870138` `BM 1436` linked to `11286900464`, both mirrored to `GB-26074-WNOOH`. | True duplicate/ambiguous order attachment, likely caused by stale trade-in ID left on an older returned item while a new incoming item was also created. | Choose canonical record based on the actual physical device state. Most likely keep `BM 1547` / `11507103406` + `11507124007` for the incoming trade-in and clear `GB-26074-WNOOH` from old returned `BM 1436` chain if that device belongs to prior stock. | High |

## Notes

### Main-only partial imports

- `GB-26052-PRBJO` and `GB-26135-BVOPS` are the cleanest "BM Devices missing but Main exists" cases.
- These look like the import got as far as Main creation but failed before or during BM Devices creation/linking.

### Return/relist contamination

- `GB-26041-JRPAI` and `GB-26093-LRQDH` are not missing hardware rows.
- In both cases the proof is the serial match across two Main items:
  - `FVFFQ1MMQ6L3` for `BM 1376`
  - `HFPMVDQV9J` for `BM 1533`
- The BM Devices row stayed with the later relist/refund chain, while the trade-in ID stayed on an older duplicate Main item.

### Same-customer duplicate-order risk

- `GB-26131-IRPSF` is the one case where "exists under another identifier" is plausible but not fully proven.
- Evidence for conflation:
  - same customer: Bill Kanjee
  - same model/spec
  - nearby creation dates: `2026-03-22` vs `2026-03-23`
  - same payout date: `2026-04-02`
  - different tracking numbers: `YR828103545GB` vs `YR828127459GB`
- That pattern is more consistent with two separate trade-ins where only one Monday/BM Devices chain was created.
