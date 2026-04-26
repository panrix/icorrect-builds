# BM Product Breakdowns for Listings — 2026-04-26

Generated: 2026-04-26 06:58 UTC

Purpose: one-file consolidation of today's Back Market listing product breakdowns/cards and resulting listing actions. Source reports remain the audit trail; this file is the operator-friendly bundle.

## Status index

- **BM 1582 / Geoffrey Glees**: listed, `£502` / min `£487`, listing `6709047`, BM + Monday verified.
- **BM 1592 / roxy ROX**: listed, `£599` / min `£582`, listing `6569346`, BM + Monday verified.
- **BM 1524 / Djibril Fotsing**: listed, `£405` / min `£393`, listing `5500817`, BM + Monday verified.
- **BM 1549 / Lily Doherty**: reviewed and **held** by Ricky. Do not list unless explicitly reopened with `Approve BM 1549`.
- **BM 1527 / Precious Uhwache**: **paused**. Original card invalid/suspect for pricing until regenerated with reconciled V7/GB-URL scrape evidence. Do not list unless explicitly approved after regenerated review.
- **BM 1541 / Muhab Saed**: not a listing card here. SKU-ready but held due return/refund relist caution; previous sale found separately: order `78615203`, sold `£518`.

## Approval and safety rules captured today

- No live listing unless Ricky explicitly says `Approve <BM>`.
- Full product card must be shown before approval request.
- Temporary clearance rule: commercial/profit threshold can be informational if SKU/listing/product_id/return-safety gates match, but explicit approval is still mandatory.
- V7 scrape/pricing must use reconciled target evidence. GB flag frontend URL capture is the preferred long-term scrape target source.

## Source files

- BM 1582 product card: `/home/ricky/builds/backmarket/reports/sop06-card-BM-1582-2026-04-26.md`
- BM 1582 live-list report: `/home/ricky/builds/backmarket/reports/live-list-bm-1582-2026-04-26.md`
- BM 1592 product card: `/home/ricky/builds/backmarket/reports/sop06-card-BM-1592-2026-04-26.md`
- BM 1592 live-list report: `/home/ricky/builds/backmarket/reports/live-list-bm-1592-2026-04-26.md`
- BM 1524 product card: `/home/ricky/builds/backmarket/reports/sop06-card-BM-1524-2026-04-26.md`
- BM 1524 live-list report: `/home/ricky/builds/backmarket/reports/live-list-bm-1524-2026-04-26.md`
- BM 1549 product card, held: `/home/ricky/builds/backmarket/reports/sop06-card-BM-1549-2026-04-26.md`
- BM 1527 product card, paused: `/home/ricky/builds/backmarket/reports/sop06-card-BM-1527-2026-04-26.md`


---


# BM 1582 product card


## SOP 06 Dry-Run Listing Proposal Card

### Jarvis Paste Summary

- Next safest `READY_FOR_LISTING_PROPOSAL` candidate after BM 1555 is **BM 1582 / Geoffrey Glees / Main `11658468933`**. BM 1541 was excluded because it is return/relist cautioned.
- Identity is strong: QC SKU matches expected, resolver truth hits exact registry slot `6709047`, product_id `7408af3f-40ad-4e74-aff8-d2acca799683`, confidence **HIGH** (`registry_verified`, verified title/spec, no contradiction flags).
- Current market check is available and live scrape succeeded. Fair market reference is **£502**, but BM pricing is distorted: Fair `£502`, Good `£482`, Excellent `£491`. Dry-run decision remains **BLOCK** because `min_price £487` only yields **£14.08 net / 2.89% margin**, below the SOP secondary minimum.
- If Ricky wants clearance anyway, the dry-run listing position would be **bottom-of-Fair at £502 / min £487**, with explicit warning that buyers can upgrade to Good for less and Excellent for only `£9` more.

### Candidate

- BM: `1582`
- Customer: `Geoffrey Glees`
- Main item: `11658468933`
- BM Devices item: `11658463428`
- Queue classification: `READY_FOR_LISTING_PROPOSAL`
- Return/relist caution: `false`
- Appearance/grade: `Fair` -> BM `FAIR`
- Canonical SKU: `MBP.A2338.M1.16GB.256GB.Grey.Fair`

### Why This Is The Next Safest Candidate

- In the current queue map, BM 1582 is the next non-cautioned `READY_FOR_LISTING_PROPOSAL` row immediately after BM 1555.
- BM 1541 was explicitly excluded because `return_relist_caution: true`.
- BM 1582 is safer than the remaining post-1555 candidates because it is not resolver-blocked, has an exact registry-backed product match, and the dry-run produced a full market/P&L result instead of a catalog ambiguity.

### Product Identity And `product_id` Confidence

- Device identity from dry-run:
  - Model: `A2338`
  - Device family: `MacBook Pro 13-inch (2020)`
  - Chip: `Apple M1 8-core and 8-core GPU`
  - RAM: `16GB`
  - SSD: `256GB`
  - Colour: `Space Gray`
  - Grade: `FAIR`
- QC handoff check passed:
  - Stored SKU: `MBP.A2338.M1.16GB.256GB.Grey.Fair`
  - Expected SKU: `MBP.A2338.M1.16GB.256GB.Grey.Fair`
- Resolver truth hit:
  - Registry slot: `6709047`
  - `product_id`: `7408af3f-40ad-4e74-aff8-d2acca799683`
  - `trust_class`: `registry_verified`
  - `verification_status`: `verified`
  - `source`: `build-listings-registry`
  - `last_verified_at`: `2026-04-13T04:36:19.068Z`
- Confidence: **HIGH**
  - Exact SKU-to-slot match in `data/listings-registry.json`
  - Exact catalog product match in `data/bm-catalog.json`
  - Verified title/spec alignment and no contradiction flags

### Current Market Check

- Current check method: `node scripts/list-device.js --dry-run --item 11658468933`
- Run time: approx `2026-04-26 04:24 UTC`
- Result: `Live scrape: ok`
- Effective grade prices returned by the run:
  - Fair: `£502`
  - Good: `£482`
  - Excellent: `£491`
  - Premium: `n/a`
- Market interpretation:
  - Grade ladder is inverted: Fair `£502` is above Good `£482`
  - Good/Excellent spread is only `£9`
  - SSD gaps are weak: `256GB -> 512GB` only `£6`; `512GB -> 1TB` only `£19`
- Pricing source note:
  - The same-session dry-run reported `Live scrape: ok`, but the P&L line still attributed the usable market reference to `catalog grade price`.
  - I am treating the above prices as the current market check from the dry-run output, with the script's own source note preserved.

### Historical Back Market Sales Evidence

- Live authenticated sales-history lookup did **not** return before the dry-run session was stopped, so historical sales evidence below uses repo-local Back Market records as the fallback source.
- Fallback evidence:
  - `reports/bm-trade-order-bm-devices-reconcile-2026-04-26-030005.json` links listing `6709047` / SKU `MBP.A2338.M1.16GB.256GB.Grey.Fair` to at least two shipped BM items:
    - Order `GB-26104-JLRUD`, creation date `2026-03-05T18:14:24+00:00`, matched to shipped BM item `BM 1563`
    - Order `GB-25462-UEJBD`, matched to shipped BM item `BM 1126`
  - `docs/historical/reconciliation-snapshots-2026-03-2026-04/reconciliation-2026-03-29.json` shows the exact same listing/product live and spec-correct on `2026-03-29`:
    - listing `6709047`
    - price `£505`
    - min price `£490`
    - quantity `1`
    - publication_state `2`
    - `specOk: true`
  - `data/vetted-listings.csv` contains repeated vetted listing-history entries for this same product_id across Fair/Good/Excellent grades, confirming this is an established BM catalog lineage rather than a new or market-only resolver guess.

### SOP 06 Economics

- Purchase: `£145`
- Parts: `£53`
- Labour: `5.8213888889h` -> `£139.71`
- Shipping: `£15`
- Fixed cost total used by dry-run: `£367.21`
- Break-even floor: `£468`
- Proposed market-reference price: `£502`
- Suggested minimum price: `£487`
- Net at minimum price: `£14.08`
- Margin at minimum price: `2.89%`
- Dry-run decision: **BLOCK**
- Decision reason: `Net £14.08 < £100 secondary minimum at min_price`

### Suggested Listing Position / Price

- Normal SOP 06 status: **Do not list**
- If Ricky explicitly approves a clearance-style exception:
  - Suggested position: **lowest Fair / bottom-of-Fair**
  - Suggested list price: `£502`
  - Suggested min price: `£487`
- Caution on position:
  - This is a weak commercial position because BM currently shows Good cheaper than Fair and Excellent only `£9` above Good.
  - Even if listed, the ladder strongly encourages customers to skip this Fair unit.

### Flags

- `return_relist_caution: false`
- `resolver_block: false`
- `commercial_block: true`
- `product_id_confidence: high`
- `market_flags:`
  - `🔴 Grade inversion: Fair (£502) >= Good (£482)`
  - `⚠️ Good/Excellent within £9`
  - `⚠️ SSD gap 256GB -> 512GB only £6`
  - `⚠️ SSD gap 512GB -> 1TB only £19`
- `historical_sales_source_fallback: true`
  - Reason: live authenticated sales-history step did not finish during the dry-run session; repo-local BM order/reconciliation evidence used instead

### Recommendation

- **Selected candidate:** BM 1582
- **Proposal status:** full SOP 06 dry-run card complete
- **Operational recommendation:** keep **BLOCKED** under normal SOP 06 gates
- **Only proceed if Ricky explicitly wants clearance behavior** and accepts a bottom-of-Fair listing at `£502 / £487` despite the inverted grade ladder and sub-threshold economics


---


# BM 1582 live-list report


## Summary for Ricky

- Listed: `yes`
- BM item: `BM 1582 / Geoffrey Glees`
- Main item: `11658468933`
- BM Devices item: `11658463428`
- Registry listing slot: `6709047`
- SKU: `MBP.A2338.M1.16GB.256GB.Grey.Fair`
- Product ID: `7408af3f-40ad-4e74-aff8-d2acca799683`
- Final live price: `£502`
- Final min price: `£487`
- Verification evidence:
  - Live script reused registry slot `6709047`, published it, then passed published-listing verification.
  - Read-only BM API check after mutation showed `quantity: 1`, `publication_state: 2`, `price: 502.00`, `min_price: 487.00`.
  - Read-only Monday check after mutation showed Main item `11658468933` at `status24 = Listed` and BM Devices item `11658463428` storing listing `6709047`, UUID `7408af3f-40ad-4e74-aff8-d2acca799683`, and SKU `MBP.A2338.M1.16GB.256GB.Grey.Fair`.
- Blockers: `none`

### Scope And Safety

- Re-read listing card before mutation: `reports/sop06-card-BM-1582-2026-04-26.md`
- Inspected live path in `scripts/list-device.js` before mutation.
- Used the single-item SOP 06 listing path only.
- No bulk reconcile scripts were run.
- No other devices were touched.
- No customer-service, returns, refunds, warranty, or unrelated BM portal actions were taken.

### Command Used

```bash
node scripts/list-device.js --live --item 11658468933 --min-margin 0 --price 502 --skip-history
```

Notes:

- `--min-margin 0` was required because this was an explicitly approved clearance exception.
- `--price 502` was required because the default live path can change the final price via backbox.
- `--skip-history` was used because the same-session dry-run card already documented the history lookup stall/fallback, and this flag skips only the informational sales-history step, not the listing mutation or verification steps.

### Pre-Mutation Read-Only Check

Timestamp: `2026-04-26T04:36:31Z`

BM listing `6709047` before mutation:

```json
{
  "listing_id": 6709047,
  "numeric_id": "49e34bd8-3aff-4c38-8eee-aa56180b430a",
  "sku": "MBP.A2338.M1.16GB.256GB.Grey.Fair",
  "product_id": "7408af3f-40ad-4e74-aff8-d2acca799683",
  "grade": "FAIR",
  "quantity": 0,
  "publication_state": 3,
  "price": "505.00",
  "min_price": "490.00"
}
```

### Live Run Evidence

Key live output:

```text
Processing single item: 11658468933
Mapped 1/1 items to BM Devices
11658468933 -> 11658463428 (BM 1582)
Stored SKU: MBP.A2338.M1.16GB.256GB.Grey.Fair
Expected SKU: MBP.A2338.M1.16GB.256GB.Grey.Fair
Resolver truth hit: MBP.A2338.M1.16GB.256GB.GREY.FAIR -> 7408af3f-40ad-4e74-aff8-d2acca799683
Decision: PROPOSE — Margin 2.9%, net £14.08
Registry hit: product_id=7408af3f-40ad-4e74-aff8-d2acca799683 listing_id=6709047
[Step 8] Using registry slot 6709047...
[Step 9] Activating listing 6709047 at £502...
Publishing listing 6709047: price=£502, min=£487
Using --price override: £502 (backbox skipped)
Final price: £502 (--price override (£502)), min: £487
[Step 12] Verifying published listing...
✅ Published listing verified
[Step 12b] Checking SKU on BM listing...
✅ SKU matches: "MBP.A2338.M1.16GB.256GB.Grey.Fair"
[Step 13] Updating Monday...
Monday updated
Mode: 🔴 LIVE
```

### Post-Mutation Verification

Timestamp: `2026-04-26T04:37:14Z`

#### BM Read-Only Check

```json
{
  "listing_id": 6709047,
  "numeric_id": "49e34bd8-3aff-4c38-8eee-aa56180b430a",
  "sku": "MBP.A2338.M1.16GB.256GB.Grey.Fair",
  "product_id": "7408af3f-40ad-4e74-aff8-d2acca799683",
  "grade": "FAIR",
  "quantity": 1,
  "publication_state": 2,
  "price": "502.00",
  "min_price": "487.00",
  "title": "MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 16GB RAM - SSD 256GB - Standard display - QWERTY - English"
}
```

#### Monday Read-Only Check

```json
{
  "main": [
    {
      "id": "11658468933",
      "name": "BM 1582 ( Geoffrey Glees )",
      "column_values": [
        { "id": "status_2_Mjj4GJNQ", "text": "Fair", "index": 11, "label": "Fair" },
        { "id": "date_mkq385pa", "text": "2026-04-26", "date": "2026-04-26" },
        { "id": "status24", "text": "Listed", "index": 7, "label": "Listed" }
      ]
    }
  ],
  "bm": [
    {
      "id": "11658463428",
      "name": "BM 1582",
      "column_values": [
        { "id": "text89", "text": "MBP.A2338.M1.16GB.256GB.Grey.Fair" },
        { "id": "text_mkyd4bx3", "text": "6709047" },
        { "id": "text_mm1dt53s", "text": "7408af3f-40ad-4e74-aff8-d2acca799683" },
        { "id": "numeric_mm1mgcgn", "text": "367.21" }
      ]
    }
  ]
}
```

### Result

BM 1582 was listed live on the approved registry slot `6709047` at `£502` with `min_price £487`, and the post-run read-only checks confirmed the BM listing and Monday state were updated as intended.


---


# BM 1592 product card


## SOP 06 Dry-Run Listing Proposal Card

### Jarvis Paste Summary

- Next safest `READY_FOR_LISTING_PROPOSAL` candidate after **BM 1555** and **BM 1582** is **BM 1592 / roxy ROX / Main `11717344920`**. **BM 1541** remains excluded because `return_relist_caution: true`.
- Identity is strong: QC SKU matches expected, resolver truth hits exact registry slot `6569346`, product_id `ef20e8dd-bcbf-4d94-8933-15f59560b9b9`, confidence **HIGH** (`registry_verified`, verified title/spec, no contradiction flags).
- Fresh dry-run market check on **2026-04-26** shows **`Live scrape: ok`** with grade prices **Fair £599 / Good £649 / Excellent £744**. The script still used **£599** as the P&L reference and labeled it `catalog grade price`.
- Historical sales lookup inside the live dry-run did not return before timeout, so sales evidence below uses repo-local Back Market history instead: product `762088` shows **15 historical orders** from **2024-12-04** to **2026-03-04**, with prices seen from **£581 to £799** and lineage listing IDs including `6569346`.
- SOP 06 decision remains **BLOCK**: `min_price £582` yields only **£7.13 net / 1.23% margin**, below the SOP secondary minimum. If Ricky wants a clearance exception anyway, the dry-run listing position is **bottom-of-Fair at £599 / min £582**.

### Candidate

- BM: `1592`
- Customer: `roxy ROX`
- Main item: `11717344920`
- BM Devices item: `11717348363`
- Queue classification: `READY_FOR_LISTING_PROPOSAL`
- Return/relist caution: `false`
- Appearance/grade: `Fair` -> BM `FAIR`
- Canonical SKU: `MBP.A2338.M2.8GB.256GB.Grey.Fair`

### Why This Is The Next Safest Candidate

- In the current queue map, BM 1592 is a non-cautioned `READY_FOR_LISTING_PROPOSAL` candidate after BM 1555 and BM 1582.
- BM 1541 was explicitly excluded because `return_relist_caution: true`.
- BM 1592 is the safest remaining later-in-review candidate after BM 1582 because it is resolver-clean and still positive at `min_price`, even though it fails the secondary profit gate.
- Remaining later-in-review non-cautioned candidates are weaker:
  - BM 1549: loss at min price (`-£95.62`)
  - BM 1564: loss at min price (`-£154.31`)
  - BM 1527: loss at min price (`-£124.68`)
  - BM 1524: loss at min price (`-£35.77`)
  - BM 1560: resolver/catalog blocked

### Product Identity And `product_id` Confidence

- Device identity from dry-run:
  - Model: `A2338`
  - Device family: `MacBook Pro 13-inch (2022)`
  - Chip: `Apple M2 8-core and 10-core GPU`
  - RAM: `8GB`
  - SSD: `256GB`
  - Colour: `Space Gray`
  - Grade: `FAIR`
- QC handoff check passed:
  - Stored SKU: `MBP.A2338.M2.8GB.256GB.Grey.Fair`
  - Expected SKU: `MBP.A2338.M2.8GB.256GB.Grey.Fair`
- Resolver truth hit:
  - Registry slot: `6569346`
  - `product_id`: `ef20e8dd-bcbf-4d94-8933-15f59560b9b9`
  - `backmarket_id`: `762088`
  - `trust_class`: `registry_verified`
  - `verification_status`: `verified`
  - `source`: `build-listings-registry`
  - `last_verified_at`: `2026-04-13T04:38:14.510Z`
- Catalog/title alignment:
  - Catalog title: `MacBook Pro 13-inch (2022) - Apple M2 8-core and 10-core GPU - 8GB RAM - SSD 256GB - QWERTY - English`
  - Catalog resolution confidence: `exact_verified`
  - Catalog evidence sources: `listing_history`, `order_history`, `scraper_base`, `scraper_picker`
- Confidence: **HIGH**
  - Exact SKU-to-slot match in `data/listings-registry.json`
  - Exact catalog product match in `data/bm-catalog.json`
  - Verified title/spec alignment and no contradiction flags

### Current Market Check

- Current check method: `timeout 30s node scripts/list-device.js --dry-run --item 11717344920`
- Run date: `2026-04-26`
- Result: `Live scrape: ok`
- Effective grade prices returned by the run:
  - Fair: `£599`
  - Good: `£649`
  - Excellent: `£744`
  - Premium: `n/a`
- Pricing source note:
  - The fresh dry-run reached the market step and returned live prices successfully.
  - The same run then labeled the P&L reference as `catalog grade price` and used `£599` for the economics.
  - The run timed out afterward at `[Step 6b] Looking up historical sales...`, so the market result is current but the historical-sales step from that live run is incomplete.
- Market interpretation:
  - Grade ladder is normal for this product at the moment.
  - No live price inversion flags were emitted by the dry-run.

### Historical Back Market Sales Evidence

- Live authenticated sales-history lookup inside the fresh dry-run did **not** complete before timeout, so historical sales evidence below uses repo-local Back Market records as the fallback source.
- Fallback evidence:
  - `data/order-history-product-ids.json` product `762088` shows:
    - title `MacBook Pro 13-inch (2022) - Apple M2 8-core and 10-core GPU - 8GB RAM - SSD 256GB - QWERTY - English`
    - `order_count: 15`
    - `first_seen: 2024-12-04`
    - `last_seen: 2026-03-04`
    - `prices_seen: £581, £600, £605, £632, £640, £645, £651, £656, £669, £672, £680, £753.55, £799`
    - `listing_ids_seen: 6569346, 6549116, 4901551, 4908048, 5889087`
  - `reports/bm-trade-order-bm-devices-reconcile-2026-04-26-030005.json` contains one clean shipped-order match for this exact listing lineage:
    - order `GB-26051-AQNLO`
    - listing title `MacBook Pro 13" (Mid 2022) - Apple M2 - 8 GB Memory - 256 GB - 10-core GPU - QWERTY`
    - matched BM item `BM 1379`
    - matched listing ID `6569346`
    - matched SKU `MBP.M2.A2338.8GB.256GB.Grey.Fair`
    - shipping date `2026-02-02T12:15:43+00:00`
    - payment date `2026-02-06T16:41:37+00:00`
  - `data/vetted-listings-audit.json` shows listing `6569346` itself has `history_count: 0` but `product_history_count: 9`, which is consistent with an established product lineage where sales history is attached across older sibling listing IDs rather than only the newest listing slot.

### SOP 06 Economics

- Purchase: `£111`
- Parts: `£144`
- Labour: `6.5438888889h` -> `£157.05`
- Shipping: `£15`
- Fixed cost total used by dry-run: `£438.15`
- Break-even floor: `£573`
- Proposed market-reference price: `£599`
- Suggested minimum price: `£582`
- Net at minimum price: `£7.13`
- Margin at minimum price: `1.23%`
- Dry-run decision: **BLOCK**
- Decision reason: `Net £7.13 < £100 secondary minimum at min_price`

### Suggested Listing Position / Price

- Normal SOP 06 status: **Do not list**
- If Ricky explicitly approves a clearance-style exception:
  - Suggested position: **lowest Fair / bottom-of-Fair**
  - Suggested list price: `£599`
  - Suggested min price: `£582`
- Caution on position:
  - Economics are materially weaker than BM 1582 despite the clean resolver and clean grade ladder.
  - This is not a normal profitable listing; it is only a possible clearance/cash-recovery candidate.

### Flags

- `return_relist_caution: false`
- `resolver_block: false`
- `commercial_block: true`
- `product_id_confidence: high`
- `live_scrape_status: ok`
- `historical_sales_live_step_completed: false`
- `historical_sales_source_fallback: true`
  - Reason: fresh dry-run timed out at `[Step 6b] Looking up historical sales...`
- `market_flags: none`

### Recommendation

- **Selected candidate:** BM 1592
- **Proposal status:** full SOP 06 dry-run card complete
- **Operational recommendation:** keep **BLOCKED** under normal SOP 06 gates
- **Only proceed if Ricky explicitly wants clearance behavior** and accepts a bottom-of-Fair listing at `£599 / £582` despite sub-threshold economics


---


# BM 1592 live-list report


## Summary for Ricky

- Listed: `yes`
- BM item: `BM 1592 / roxy ROX`
- Main item: `11717344920`
- BM Devices item: `11717348363`
- Registry listing slot: `6569346`
- SKU gate before mutation: `MBP.A2338.M2.8GB.256GB.Grey.Fair` = stored = expected
- Product ID: `ef20e8dd-bcbf-4d94-8933-15f59560b9b9`
- Final live price: `£599`
- Final min price: `£582`
- Clearance rule used: Ricky temporary clearance rule on `2026-04-26`, implemented via `--min-margin 0`
- Verification evidence:
  - Live script reused exact registry slot `6569346`, published it, and passed published-listing verification.
  - Read-only BM API check after mutation showed `quantity: 1`, `publication_state: 2`, `price: 599.00`, `min_price: 582.00`, `product_id: ef20e8dd-bcbf-4d94-8933-15f59560b9b9`.
  - Read-only Monday check after mutation showed Main item `11717344920` at `status24 = Listed` and BM Devices item `11717348363` storing listing `6569346`, UUID `ef20e8dd-bcbf-4d94-8933-15f59560b9b9`, and SKU `MBP.A2338.M2.8GB.256GB.Grey.Fair`.
- Residual note:
  - The live script reported a successful SKU rewrite on BM, but the post-mutation BM listing GET still echoed the legacy equivalent SKU string `MBP.M2.A2338.8GB.256GB.Grey.Fair`. Identity still matches via exact `product_id`, title, slot, price, and Monday canonical SKU.
- Blockers: `none`

### Jarvis Paste Summary

- BM 1592 / roxy ROX has been live-listed under Ricky's temporary clearance rule.
- Identity gates were re-verified before mutation: Main `11717344920`, BM Devices `11717348363`, stored SKU `MBP.A2338.M2.8GB.256GB.Grey.Fair`, expected SKU `MBP.A2338.M2.8GB.256GB.Grey.Fair`, resolver slot `6569346`, product_id `ef20e8dd-bcbf-4d94-8933-15f59560b9b9`, return/relist caution `false`.
- Live command used: `node scripts/list-device.js --live --item 11717344920 --min-margin 0 --price 599 --skip-history`
- Post-mutation checks:
  - BM slot `6569346` is live with `quantity 1`, `publication_state 2`, `price £599`, `min £582`, correct `product_id`.
  - Monday now shows Main `Listed` and BM Devices storing slot `6569346`, UUID `ef20e8dd-bcbf-4d94-8933-15f59560b9b9`, SKU `MBP.A2338.M2.8GB.256GB.Grey.Fair`.
- Residual note: BM GET still returns the older equivalent SKU ordering `MBP.M2.A2338.8GB.256GB.Grey.Fair` even though the live script logged a successful SKU update.

### Scope And Safety

- Re-read card before mutation: `reports/sop06-card-BM-1592-2026-04-26.md`
- Used the single-item SOP 06 listing path only.
- No bulk reconcile scripts were run.
- No other listings were mutated.
- No customer messages, returns, refunds, warranty actions, portal admin changes, or unrelated Monday fields were touched.

### Pre-Mutation Identity Verification

- Card-approved clearance position:
  - List price `£599`
  - Min price `£582`
- Current read-only Monday check:
  - Main item `11717344920` = `BM 1592 ( roxy ROX )`
  - BM Devices item `11717348363` = `BM 1592`
  - Main `status24 = To List`
  - BM Devices stored SKU `MBP.A2338.M2.8GB.256GB.Grey.Fair`
  - BM Devices listing slot field blank, UUID field blank, which is expected before SOP 06 Monday writeback
- Identity gate confirmation from card + fresh live dry-run:
  - Stored SKU: `MBP.A2338.M2.8GB.256GB.Grey.Fair`
  - Expected SKU: `MBP.A2338.M2.8GB.256GB.Grey.Fair`
  - Resolver slot: `6569346`
  - Product ID: `ef20e8dd-bcbf-4d94-8933-15f59560b9b9`
  - Trust class: `registry_verified`
  - Verification status: `verified`
  - Return/relist caution: `false`
- Pre-mutation BM read-only check on slot `6569346`:

```json
{
  "listing_id": 6569346,
  "numeric_id": "e0395dcf-435c-4c9e-b29f-15141854ce24",
  "sku": "MBP.M2.A2338.8GB.256GB.Grey.Fair",
  "product_id": "ef20e8dd-bcbf-4d94-8933-15f59560b9b9",
  "grade": "FAIR",
  "quantity": 0,
  "publication_state": 3,
  "price": "500.00",
  "min_price": "485.00",
  "title": "MacBook Pro 13-inch (2022) - Apple M2 8-core and 10-core GPU - 8GB RAM - SSD 256GB - Standard display - QWERTY - English"
}
```

### Command Used

```bash
node scripts/list-device.js --live --item 11717344920 --min-margin 0 --price 599 --skip-history
```

Notes:

- `--min-margin 0` applied Ricky's temporary clearance rule and bypassed the commercial profit gate only.
- `--price 599` forced the approved clearance list price and prevented backbox drift.
- `--skip-history` skipped only the informational sales-history lookup that had already been documented as slow; it did not skip listing mutation or post-publish verification.

### Live Run Evidence

Key live output:

```text
Processing single item: 11717344920
11717344920 → 11717348363 (BM 1592)
Stored SKU: MBP.A2338.M2.8GB.256GB.Grey.Fair
Expected SKU: MBP.A2338.M2.8GB.256GB.Grey.Fair
Resolver truth hit: MBP.A2338.M2.8GB.256GB.GREY.FAIR -> ef20e8dd-bcbf-4d94-8933-15f59560b9b9
Live/catalog grade prices: {"Fair":599,"Good":652,"Excellent":752,"Premium":null}
Decision: PROPOSE — Margin 1.2%, net £7.13
Registry hit: product_id=ef20e8dd-bcbf-4d94-8933-15f59560b9b9 listing_id=6569346
[Step 8] Using registry slot 6569346...
[Step 9] Activating listing 6569346 at £599...
Publishing listing 6569346: price=£599, min=£582
Using --price override: £599 (backbox skipped)
Final price: £599 (--price override (£599)), min: £582
[Step 12] Verifying published listing...
✅ Published listing verified
[Step 12b] Checking SKU on BM listing...
⚠️ SKU mismatch: BM has "MBP.M2.A2338.8GB.256GB.Grey.Fair", expected "MBP.A2338.M2.8GB.256GB.Grey.Fair". Updating...
✅ SKU updated to "MBP.A2338.M2.8GB.256GB.Grey.Fair"
[Step 13] Updating Monday...
Monday updated
Mode: 🔴 LIVE
```

### Post-Mutation Verification

#### BM Read-Only Check

```json
{
  "listing_id": 6569346,
  "numeric_id": "e0395dcf-435c-4c9e-b29f-15141854ce24",
  "sku": "MBP.M2.A2338.8GB.256GB.Grey.Fair",
  "product_id": "ef20e8dd-bcbf-4d94-8933-15f59560b9b9",
  "grade": "FAIR",
  "quantity": 1,
  "publication_state": 2,
  "price": "599.00",
  "min_price": "582.00",
  "title": "MacBook Pro 13-inch (2022) - Apple M2 8-core and 10-core GPU - 8GB RAM - SSD 256GB - Standard display - QWERTY - English"
}
```

#### Monday Read-Only Check

```json
{
  "main": [
    {
      "id": "11717344920",
      "name": "BM 1592 ( roxy ROX )",
      "column_values": [
        { "id": "status_2_Mjj4GJNQ", "text": "Fair", "index": 11, "label": "Fair" },
        { "id": "date_mkq385pa", "text": "2026-04-26", "date": "2026-04-26" },
        { "id": "status24", "text": "Listed", "index": 7, "label": "Listed" }
      ]
    }
  ],
  "bm": [
    {
      "id": "11717348363",
      "name": "BM 1592",
      "column_values": [
        { "id": "text89", "text": "MBP.A2338.M2.8GB.256GB.Grey.Fair" },
        { "id": "text_mkyd4bx3", "text": "6569346" },
        { "id": "text_mm1dt53s", "text": "ef20e8dd-bcbf-4d94-8933-15f59560b9b9" },
        { "id": "numeric_mm1mgcgn", "text": "438.15" }
      ]
    }
  ]
}
```

### Result

BM 1592 was live-listed on the approved registry slot `6569346` at `£599` with `min_price £582`. The exact slot, exact `product_id`, price, quantity, and Monday writeback all verified read-only after mutation. The only residual mismatch is that BM's GET endpoint still presents the equivalent legacy SKU ordering even after the script logged a successful SKU rewrite.


---


# BM 1524 product card


## SOP 06 Dry-Run Listing Proposal Card

### Jarvis Paste Summary

- Next card after live-listed **BM 1592** is **BM 1524 / Djibril Fotsing / Main `11430091106` / BM Devices `11430091746`**.
- I selected BM 1524 because it is the strongest remaining **non-cautioned, identity-clean** candidate by current profit metrics. Fresh ranking of remaining identity-clean rows is:
  - BM 1524: `net@min -£39.44`
  - BM 1549: `net@min -£95.62`
  - BM 1527: `net@min -£124.68`
  - BM 1564: `net@min -£154.31`
  - BM 1560 stays excluded from next-card selection because resolver/catalog identity is still blocked.
  - BM 1541 stays excluded because `return_relist_caution: true`.
- Identity gates are clean:
  - Stored SKU = expected SKU = `MBP.A2338.M1.8GB.256GB.Grey.Fair`
  - Resolver truth hits exact registry slot `5500817`
  - Product ID `8948b82c-f746-4be0-a8b0-0758b1dc4acc`
  - Confidence **HIGH** (`registry_verified`, exact verified catalog lineage, no caution markers)
- Fresh dry-run market check on `2026-04-26` shows **Fair £405 / Good £458 / Excellent £518**.
- Economics at current market:
  - Purchase `£109`
  - Parts `£53`
  - Labour `£157.89`
  - Shipping `£15`
  - Fixed cost `£345.79`
  - Break-even `£447`
  - Proposed `£405`
  - Min price `£393`
  - Net at min `-£39.44`
  - Margin at min `-10.03%`
- **Proceedable under Ricky's temporary clearance rule.**
  - Identity/safety gates pass.
  - Economics are negative at the current market, so this is a deliberate clearance decision, not a normal SOP-profit listing.

### Candidate

- BM: `1524`
- Customer: `Djibril Fotsing`
- Main item: `11430091106`
- BM Devices item: `11430091746`
- Queue classification: `READY_FOR_LISTING_PROPOSAL`
- Return/relist caution: `false`
- Appearance/grade: `Fair` -> BM `FAIR`
- Canonical SKU: `MBP.A2338.M1.8GB.256GB.Grey.Fair`

### Why This Is The Next Card

- BM 1592 is now listed, so the next report should move to the best remaining clearance candidate on identity plus profit-metric visibility.
- Among the remaining non-cautioned rows with clean identity gates, BM 1524 has the least-bad current net at min price.
- BM 1541 is excluded because it is return/relist cautioned.
- BM 1560 is excluded from next-card selection because its resolver/catalog identity is not yet exact enough for live use.

### Product Identity And `product_id` Confidence

- Fresh read-only Monday check:
  - Main item `11430091106` = `BM 1524 ( Djibril Fotsing )`
  - BM Devices item `11430091746` = `BM 1524`
  - Main `status24 = To List`
  - BM Devices back-link points to Main `11430091106`
- QC handoff check passed:
  - Stored SKU: `MBP.A2338.M1.8GB.256GB.Grey.Fair`
  - Expected SKU: `MBP.A2338.M1.8GB.256GB.Grey.Fair`
- Device identity from fresh dry-run:
  - Model: `A2338`
  - Device family: `MacBook Pro 13-inch (2020)`
  - Chip: `Apple M1 8-core and 8-core GPU`
  - RAM: `8GB`
  - SSD: `256GB`
  - Colour: `Space Gray`
  - Grade: `FAIR`
- Resolver truth hit:
  - Registry slot: `5500817`
  - `product_id`: `8948b82c-f746-4be0-a8b0-0758b1dc4acc`
  - `backmarket_id`: `545418`
  - `trust_class`: `registry_verified`
  - `verification_status`: `verified`
  - `source`: `build-listings-registry`
- Read-only BM slot check:
  - Slot `5500817` currently exists as draft with `quantity 0`, `publication_state 3`
  - BM GET reports SKU `MBP.A2338.M1.8GB.256GB.Grey.Fair`
  - BM title matches the exact M1 8GB/256GB product family
- Catalog lineage:
  - Catalog title: `MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 8GB RAM - SSD 256GB - QWERTY - English`
  - Catalog resolution confidence: `exact_verified`
  - Catalog evidence sources: `listing_history`, `order_history`, `scraper_base`, `scraper_picker`
- Confidence: **HIGH**

### Current Market Check

- Current check method: `timeout 60s node scripts/list-device.js --dry-run --item 11430091106 --skip-history`
- Run date: `2026-04-26`
- Result: `Live scrape: ok`
- Effective grade prices returned by the run:
  - Fair: `£405`
  - Good: `£458`
  - Excellent: `£518`
  - Premium: `n/a`
- Market interpretation:
  - Ladder is normal: Fair < Good < Excellent
  - Current Fair market is below this device's break-even
  - No return/relist or resolver contradictions were emitted

### Historical Back Market Sales Evidence

- Repo-local order history for Back Market product `545418` shows:
  - title `MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 8GB RAM - SSD 256GB - QWERTY - English`
  - `order_count: 102`
  - `first_seen: 2023-03-15`
  - `last_seen: 2026-03-24`
  - `prices_seen:` `£394` up to `£847.42`
  - `listing_ids_seen:` includes `5500817`
- `data/vetted-listings-audit.json` marks listing `5500817` as:
  - `status: vetted_exact`
  - `history_count: 29`
  - `product_history_count: 72`
  - `export_uuid: 8948b82c-f746-4be0-a8b0-0758b1dc4acc`
- `reports/bm-trade-order-bm-devices-reconcile-2026-04-26-030005.json` shows repeated shipped-order lineage on listing `5500817`, including canonical fair-SKU matches.

### Profit Metrics

- Purchase: `£109`
- Parts: `£53`
- Labour: `6.5788888889h` -> `£157.89`
- Shipping: `£15`
- Fixed cost total used by dry-run: `£345.79`
- Break-even floor: `£447`
- Proposed market-reference price: `£405`
- Suggested minimum price: `£393`
- Net at minimum price: `-£39.44`
- Margin at minimum price: `-10.03%`

### Temporary Clearance Decision

- **Proceedable under Ricky's temporary clearance rule**
- Reason:
  - SKU gate passes
  - Listing slot / `product_id` identity is exact and verified
  - Return/relist caution is `false`
  - Exact item match is clean
- Economics note:
  - At today's live market this clears at a loss if listed at the current Fair level.
  - This is clearance/cash-recovery logic, not normal profit logic.

### Suggested Listing Position / Price

- Suggested position: **bottom-of-Fair**
- Suggested list price: `£405`
- Suggested min price: `£393`
- Operator note:
  - Because the slot is identity-clean and the temporary rule removes the old commercial block, this is operationally listable if Ricky wants to continue the clearance push.
  - The key tradeoff is explicit: about `£39` loss at min on current pricing.

### Flags

- `return_relist_caution: false`
- `resolver_block: false`
- `listing_product_id_confidence: high`
- `live_scrape_status: ok`
- `profitability_at_min: negative`
- `temporary_clearance_rule: proceedable`

### Recommendation

- **Selected candidate:** BM 1524
- **Proposal status:** full SOP 06 dry-run card complete
- **Read-only scope:** no writes made for this candidate
- **Operational recommendation:** proceed only if Ricky wants the next clearance listing to trade exact identity safety for a roughly `£39.44` loss at current bottom-of-Fair pricing


---


# BM 1524 live-list report


## Summary for Ricky

- Listed: `yes`
- BM item: `BM 1524 / Djibril Fotsing`
- Main item: `11430091106`
- BM Devices item: `11430091746`
- Registry listing slot: `5500817`
- SKU gate before mutation: `MBP.A2338.M1.8GB.256GB.Grey.Fair` = stored = expected
- Product ID: `8948b82c-f746-4be0-a8b0-0758b1dc4acc`
- Final live price: `£405`
- Final min price: `£393`
- Clearance rule used: Ricky temporary clearance rule on `2026-04-26`, implemented via `--min-margin 0`
- Verification evidence:
  - Pre-mutation live dry-run re-confirmed Main `11430091106`, BM Devices `11430091746`, exact SKU match, resolver slot `5500817`, exact `product_id`, and override price path `£405 / £393`.
  - Pre-mutation read-only BM API check showed slot `5500817` at `quantity 0`, `publication_state 3`, `price 450.00`, `min_price 420.00`, correct SKU, and correct `product_id`.
  - Post-mutation read-only BM API check showed `quantity 1`, `publication_state 2`, `price 405.00`, `min_price 393.00`, same SKU, and same `product_id`.
  - Post-mutation read-only Monday check showed Main item `11430091106` at `status24 = Listed` and BM Devices item `11430091746` storing listing `5500817`, UUID `8948b82c-f746-4be0-a8b0-0758b1dc4acc`, SKU `MBP.A2338.M1.8GB.256GB.Grey.Fair`, and total fixed cost `345.79`.
- Residual note:
  - The live run's market scrape fell back with `cloudflare_blocked`, but the approved `--price 405` override pinned the exact clearance price and the published listing still passed BM verification.
- Blockers: `none`

### Jarvis Paste Summary

- BM 1524 / Djibril Fotsing has been live-listed under Ricky's temporary clearance rule.
- Identity gates were re-verified before mutation: Main `11430091106`, BM Devices `11430091746`, stored SKU `MBP.A2338.M1.8GB.256GB.Grey.Fair`, expected SKU `MBP.A2338.M1.8GB.256GB.Grey.Fair`, resolver slot `5500817`, product_id `8948b82c-f746-4be0-a8b0-0758b1dc4acc`, return/relist caution `false`.
- Live command used: `node scripts/list-device.js --live --item 11430091106 --min-margin 0 --price 405`
- Post-mutation checks:
  - BM slot `5500817` is live with `quantity 1`, `publication_state 2`, `price £405`, `min £393`, correct SKU, and correct `product_id`.
  - Monday now shows Main `Listed` and BM Devices storing slot `5500817`, UUID `8948b82c-f746-4be0-a8b0-0758b1dc4acc`, SKU `MBP.A2338.M1.8GB.256GB.Grey.Fair`, fixed cost `345.79`.
- Residual note: the live run's scrape step hit `cloudflare_blocked`, but the exact approved clearance price was forced with `--price 405` and post-publish verification passed.

### Scope And Safety

- Re-read card before mutation: `reports/sop06-card-BM-1524-2026-04-26.md`
- Used the single-item SOP 06 listing path only.
- No bulk reconcile scripts were run.
- No other listings were mutated.
- No customer messages, returns, refunds, warranty actions, portal admin changes, or unrelated Monday fields were touched.

### Pre-Mutation Identity Verification

- Card-approved clearance position:
  - List price `£405`
  - Min price `£393`
- Fresh read-only Monday queue check before mutation:
  - Main item `11430091106` = `BM 1524 ( Djibril Fotsing )`
  - BM Devices item `11430091746` = `BM 1524`
  - Queue classification `READY_FOR_LISTING_PROPOSAL`
  - Return/relist caution `false`
  - Stored SKU `MBP.A2338.M1.8GB.256GB.Grey.Fair`
  - Expected SKU `MBP.A2338.M1.8GB.256GB.Grey.Fair`
- Fresh live dry-run gate confirmation:
  - Resolver slot `5500817`
  - Product ID `8948b82c-f746-4be0-a8b0-0758b1dc4acc`
  - Trust class `registry_verified`
  - Verification status `verified`
  - Override dry-run decision `PROPOSE` under `--min-margin 0`
  - Approved price path stayed exactly `£405 / £393`
- Pre-mutation BM read-only check on slot `5500817`:

```json
{
  "listing_id": 5500817,
  "sku": "MBP.A2338.M1.8GB.256GB.Grey.Fair",
  "product_id": "8948b82c-f746-4be0-a8b0-0758b1dc4acc",
  "grade": "FAIR",
  "quantity": 0,
  "publication_state": 3,
  "price": "450.00",
  "min_price": "420.00",
  "title": "MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 8GB RAM - SSD 256GB - Standard display - QWERTY - English"
}
```

### Command Used

```bash
node scripts/list-device.js --live --item 11430091106 --min-margin 0 --price 405
```

Notes:

- `--min-margin 0` applied Ricky's temporary clearance rule and bypassed the commercial profit gate only.
- `--price 405` forced the approved clearance list price and prevented backbox drift.

### Live Run Evidence

Key live output:

```text
Processing single item: 11430091106
11430091106 → 11430091746 (BM 1524)
Stored SKU: MBP.A2338.M1.8GB.256GB.Grey.Fair
Expected SKU: MBP.A2338.M1.8GB.256GB.Grey.Fair
Resolver truth hit: MBP.A2338.M1.8GB.256GB.GREY.FAIR -> 8948b82c-f746-4be0-a8b0-0758b1dc4acc
Decision: PROPOSE — ⚠️ Loss maker (net £-39.44) — approved via --min-margin override
Registry hit: product_id=8948b82c-f746-4be0-a8b0-0758b1dc4acc listing_id=5500817
[Step 8] Using registry slot 5500817...
[Step 9] Activating listing 5500817 at £405...
Publishing listing 5500817: price=£405, min=£393
Using --price override: £405 (backbox skipped)
Final price: £405 (--price override (£405)), min: £393
[Step 12] Verifying published listing...
✅ Published listing verified
[Step 12b] Checking SKU on BM listing...
✅ SKU matches: "MBP.A2338.M1.8GB.256GB.Grey.Fair"
[Step 13] Updating Monday...
Monday updated
Mode: 🔴 LIVE
```

### Post-Mutation Verification

#### BM Read-Only Check

```json
{
  "listing_id": 5500817,
  "sku": "MBP.A2338.M1.8GB.256GB.Grey.Fair",
  "product_id": "8948b82c-f746-4be0-a8b0-0758b1dc4acc",
  "grade": "FAIR",
  "quantity": 1,
  "publication_state": 2,
  "price": "405.00",
  "min_price": "393.00",
  "title": "MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 8GB RAM - SSD 256GB - Standard display - QWERTY - English"
}
```

#### Monday Read-Only Check

```json
{
  "main": [
    {
      "id": "11430091106",
      "name": "BM 1524 ( Djibril Fotsing )",
      "column_values": [
        { "id": "status_2_Mjj4GJNQ", "text": "Fair", "index": 11 },
        { "id": "status24", "text": "Listed", "index": 7 }
      ]
    }
  ],
  "bm": [
    {
      "id": "11430091746",
      "name": "BM 1524",
      "column_values": [
        { "id": "text89", "text": "MBP.A2338.M1.8GB.256GB.Grey.Fair" },
        { "id": "text_mkyd4bx3", "text": "5500817" },
        { "id": "text_mm1dt53s", "text": "8948b82c-f746-4be0-a8b0-0758b1dc4acc" },
        { "id": "numeric_mm1mgcgn", "text": "345.79" }
      ]
    }
  ]
}
```

### Result

BM 1524 was live-listed on the approved registry slot `5500817` at `£405` with `min_price £393`. The exact slot, exact `product_id`, exact price, quantity, and Monday writeback all verified read-only after mutation.


---


# BM 1549 product card, held


## SOP 06 Dry-Run Listing Proposal Card

### Jarvis Paste Summary

- Next full SOP 06 dry-run card after live-listed **BM 1524** is **BM 1549 / Lily Doherty / Main `11507101485` / BM Devices `11507109525`**.
- I selected BM 1549 because it is the strongest remaining **identity-clean, non-cautioned, non-live-slot-conflict** candidate in the current queue.
- Exclusions that matter:
  - **BM 1541** excluded because `return_relist_caution: true`.
  - **BM 1446**, **BM 1536**, and **BM 1560** excluded because resolver/catalog identity is not exact enough for live use.
  - **BM 1555** excluded from next-card selection because its exact resolver slot `6569346` is already live on **BM 1592**.
  - **BM 1564** excluded from next-card selection because its exact resolver slot `5500817` is already live on **BM 1524**.
  - **BM 1527** remains eligible but is weaker than BM 1549 on current economics (`net@min -£128.34` vs `-£92.69`).
- Identity/safety gates for BM 1549 are clean:
  - Stored SKU = expected SKU = `MBA.A2337.M1.7C.8GB.256GB.Grey.Fair`
  - Resolver truth hits exact registry slot `5606597`
  - Product ID `b5ebc79d-0304-41a6-b1ae-d2a487afa11f`
  - Return/relist caution `false`
  - BM slot `5606597` currently reads as draft with `quantity 0`, `publication_state 3`
- Fresh read-only dry-run on `2026-04-26` shows live market prices **Fair £339 / Good £402 / Excellent £415 / Premium £565**.
- Historical BM sales refresh:
  - Exact slot `5606597`: **8 completed Fair sales in last 90 days**, `2026-02-28` to `2026-04-18`, **avg £364.38 / median £361 / range £351-£378**
  - Wider product-line Fair pool for BM product `545379`: **29 completed sales in last 90 days**, `2026-01-29` to `2026-04-18`, **avg £367.52 / median £365 / range £341-£399**
  - Longer repo-local BM history for product `545379`: **171 historical orders** from `2023-03-28` to `2026-03-23`, lineage includes slot `5606597`
- Economics at current market:
  - Purchase `£117`
  - Parts `£135`
  - Labour `£74.75`
  - Shipping `£15`
  - Fixed cost `£353.45`
  - Break-even `£456`
  - Proposed `£339`
  - Min price `£329`
  - Net at min `-£92.69`
  - Margin at min `-28.17%`
- **Proceedable under Ricky's temporary clearance rule.**
  - Identity/safety gates pass.
  - Commercial threshold is informational only under the temporary rule.
  - Under the old SOP profit gate this remains a normal commercial **BLOCK**.

### Candidate

- BM: `1549`
- Customer: `Lily Doherty`
- Main item: `11507101485`
- BM Devices item: `11507109525`
- Queue classification: `READY_FOR_LISTING_PROPOSAL`
- Return/relist caution: `false`
- Appearance/grade: `Fair` -> BM `FAIR`
- Canonical SKU: `MBA.A2337.M1.7C.8GB.256GB.Grey.Fair`

### Why This Is The Next Card

- BM 1524 is now live, so the next card should move to the best remaining candidate that is both identity-clean and operationally safe to consider.
- BM 1555 and BM 1564 are not good next-card choices because their exact resolver slots are already live for other BM items.
- BM 1446, BM 1536, and BM 1560 are blocked on product-resolution safety, not just on profit.
- Among the remaining non-cautioned rows with exact resolver truth and a non-live slot, BM 1549 has the least-bad `net@min`.

### Identity And Safety Gates

- Fresh read-only queue check:
  - Main item `11507101485` = `BM 1549 ( Lily Doherty )`
  - BM Devices item `11507109525` = `BM 1549`
  - Queue classification `READY_FOR_LISTING_PROPOSAL`
  - Return/relist caution `false`
- QC SKU handoff check passed:
  - Stored SKU: `MBA.A2337.M1.7C.8GB.256GB.Grey.Fair`
  - Expected SKU: `MBA.A2337.M1.7C.8GB.256GB.Grey.Fair`
- Fresh dry-run resolver truth hit:
  - Registry slot: `5606597`
  - `product_id`: `b5ebc79d-0304-41a6-b1ae-d2a487afa11f`
  - `trust_class`: `registry_verified`
  - `verification_status`: `verified`
  - `source`: `build-listings-registry`
- Read-only BM slot check:
  - Slot `5606597` currently reads `quantity 0`, `publication_state 3`
  - BM GET reports SKU `MBA.A2337.8GB.256GB.Grey.Fair`
  - BM title matches the exact M1 7-core GPU / 8GB / 256GB Air family
- Listing / `product_id` confidence: **HIGH**
  - Exact canonical SKU-to-slot resolver hit
  - Exact verified `product_id`
  - Slot is currently draft/offline, not already live on another active BM item
  - BM GET exposes a shorter legacy-equivalent SKU string, but `product_id`, title, slot, and spec family align exactly

### Current Market Prices

- Current check method: `node scripts/list-device.js --dry-run --item 11507101485 --skip-history`
- Run date: `2026-04-26`
- Result: `Live scrape: ok`
- Grade prices returned by the run:
  - Fair: `£339`
  - Good: `£402`
  - Excellent: `£415`
  - Premium: `£565`

### Historical Back Market Sales Evidence

- Resolver/product mapping for order history:
  - UUID `product_id`: `b5ebc79d-0304-41a6-b1ae-d2a487afa11f`
  - Numeric BM sell-side `backmarket_id`: `545379`
  - Exact registry slot: `5606597`
- Read-only live BM orders refresh:
  - Method: `GET /ws/orders?state=9`
  - Filters: product `545379`, Fair condition code `12`
  - Window: 90 days aligned to `data/sold-prices-latest.json` (`generated_at 2026-04-22T03:22:59.009Z`)
- Exact slot `5606597`:
  - `8` completed Fair sales
  - First seen: `2026-02-28T09:56:28Z`
  - Last seen: `2026-04-18T16:01:14+01:00`
  - Avg: `£364.38`
  - Median: `£361`
  - Range: `£351-£378`
  - Sale points seen: `£374`, `£357`, `£357`, `£358`, `£364`, `£376`, `£378`, `£351`
- Wider Fair lineage for product `545379` in the same 90-day window:
  - `29` completed sales
  - First seen: `2026-01-29T18:48:27Z`
  - Last seen: `2026-04-18T16:01:14+01:00`
  - Avg: `£367.52`
  - Median: `£365`
  - Range: `£341-£399`
  - Older sibling listing IDs contributing to this lineage include `4857996`, `5500808`, and `6347723`
- Longer repo-local BM order snapshot:
  - `data/order-history-product-ids.json` product `545379`
  - `order_count: 171`
  - `first_seen: 2023-03-28`
  - `last_seen: 2026-03-23`
  - `listing_ids_seen:` includes `5606597`
  - `prices_seen:` span `£335` to `£809.67`
- Caveats:
  - BM sell-side order history uses numeric `backmarket_id`, not the UUID `product_id`
  - The 90-day live refresh is fresher for recent counts than the older repo snapshot (`extracted_at 2026-03-27`)
  - The 29-sale product-line average is lineage-wide and should not be treated as if all 29 sales happened on slot `5606597`

### Profit Metrics

- Purchase: `£117`
- Parts: `£135`
- Labour: `3.1144444444h` -> `£74.75`
- Shipping: `£15`
- Fixed cost total used by dry-run: `£353.45`
- Break-even floor: `£456`
- Proposed market-reference price: `£339`
- Suggested minimum price: `£329`
- Net at minimum price: `-£92.69`
- Margin at minimum price: `-28.17%`
- Normal SOP 06 decision: **BLOCK**
- Decision reason: `Loss at min_price (net £-92.69)`

### Temporary Clearance Decision

- **Proceedable under Ricky's temporary clearance rule**
- Reason:
  - Exact item identity is clean
  - SKU gate passes
  - Listing slot / `product_id` identity is exact and verified
  - Return/relist caution is `false`
  - Slot is currently draft/offline rather than already live
- Economics note:
  - This is materially loss-making at today's live Fair market.
  - Commercial threshold is informational only for this temporary rule, but the loss should be treated as explicit clearance/cash-recovery tradeoff.

### Suggested Listing Position / Price

- Suggested position: **bottom-of-Fair**
- Suggested list price: `£339`
- Suggested min price: `£329`

### Remaining Exclusions

- `BM 1541` excluded: `return_relist_caution: true`
- `BM 1446` excluded: `No catalog match for model/spec/colour`
- `BM 1536` excluded: `No exact colour match in catalog for Starlight; 2 spec candidate(s) require review`
- `BM 1560` excluded: `No exact colour match in catalog for Starlight; 2 spec candidate(s) require review`
- `BM 1555` excluded from next-card selection: exact resolver slot `6569346` already live on `BM 1592`
- `BM 1564` excluded from next-card selection: exact resolver slot `5500817` already live on `BM 1524`

### Recommendation

- **Selected candidate:** BM 1549
- **Proposal status:** full SOP 06 dry-run card complete
- **Read-only scope:** no writes made for this candidate
- **Operational recommendation:** if Ricky wants the next clearance listing after BM 1524, BM 1549 is the next identity-clean card to review, with the explicit tradeoff of about `£92.69` loss at min on current pricing


---


# BM 1527 product card, paused


## SOP 06 Dry-Run Listing Proposal Card

### Jarvis Paste-Ready Full Product Card

- Next full approval card after Ricky held **BM 1549** is **BM 1527 / Precious Uhwache / Main `11440582288` / BM Devices `11440594268`**.
- Excluded before selection:
  - **BM 1549** is on hold by Ricky. Do not list unless Ricky reopens it later.
  - **BM 1541** remains excluded because `return_relist_caution: true` and no proof-cleared relist evidence was found.
  - **BM 1555** is excluded for slot conflict because exact resolver slot `6569346` is already live on **BM 1592**.
  - **BM 1564** is excluded for slot conflict because exact resolver slot `5500817` is already live on **BM 1524**.
  - **BM 1446**, **BM 1536**, and **BM 1560** remain excluded because resolver/catalog identity is not exact enough for live use.
- Candidate/customer/Main item/BM Devices item:
  - BM `1527`
  - Customer `Precious Uhwache`
  - Main item `11440582288`
  - BM Devices item `11440594268`
- Product identity/spec confirmation:
  - Canonical SKU `MBP.A2338.M1.8GB.512GB.Silver.Fair`
  - Model `A2338`
  - Family `MacBook Pro 13-inch (2020)`
  - Chip `Apple M1 8-core and 8-core GPU`
  - RAM `8GB`
  - SSD `512GB`
  - Colour `Silver`
  - Grade `Fair` -> BM `FAIR`
- Stored SKU and expected SKU match:
  - Stored SKU `MBP.A2338.M1.8GB.512GB.Silver.Fair`
  - Expected SKU `MBP.A2338.M1.8GB.512GB.Silver.Fair`
  - Match `yes`
- Listing slot and product ID:
  - Exact resolver slot `5035146`
  - `product_id` `9ef00207-1136-45f4-99c3-ade923986e43`
  - `backmarket_id` `545417`
  - Confidence `HIGH`
  - Resolver trust `registry_verified`
  - Current slot state from read-only BM GET on `2026-04-26`: `quantity 0`, `publication_state 3`, stored BM SKU `MBP13.M1A2338.8GB.512GB.silver.Fair`, price `£485`, min `£465`
  - Slot state interpretation: exact slot exists and is offline/draft, with no active-slot conflict found in current local queue evidence
- Return/relist caution:
  - `false`
  - No return/relist warning on the queue row
- Live market scrape/current market ladder:
  - Fresh read-only dry-run on `2026-04-26`: `timeout 90s node scripts/list-device.js --dry-run --item 11440582288 --skip-history`
  - `Live scrape: ok`
  - Fair `£405`
  - Good `£458`
  - Excellent `£569`
  - Premium `n/a`
  - Ladder `Fair < Good < Excellent`, gaps `£53` and `£111`
- Historical Back Market sales evidence:
  - Fresh live BM orders pull on `2026-04-26` for the last 90 days found **no exact-slot sales** for listing `5035146` and **no FAIR lineage sales** returned for this UUID in that window.
  - Repo-local exact-slot evidence still exists:
    - `data/vetted-listings-audit.json` marks listing `5035146` as `vetted_exact`
    - `history_count: 5`
    - `product_history_count: 5`
    - exact Fair SKU lineage `MBP13.M1A2338.8GB.512GB.silver.Fair`
  - Wider product-line evidence:
    - `data/order-history-product-ids.json` product `545417`
    - `order_count: 8`
    - `first_seen: 2025-01-14`
    - `last_seen: 2026-02-02`
    - `listing_ids_seen: 6434923, 5035146`
    - `prices_seen: £464, £485, £497, £570, £579`
    - `conditions_seen: 11, 12` (mixed Good/Fair lineage)
  - Additional exact-slot proof:
    - `reports/bm-trade-order-bm-devices-reconcile-2026-04-26-030005.json` links listing `5035146` to shipped BM order `GB-26025-UCUVC` on BM item `BM 1297`
    - creation `2026-01-09T10:07:19+00:00`
    - shipping `2026-01-12T11:31:46+00:00`
    - payment `2026-01-16T08:49:27+00:00`
  - Caveat:
    - The live 90-day BM API pull did not produce recent sell-through for this Fair slot, so the stronger evidence here is older repo-local lineage rather than fresh recent sales.
    - The wider `order_count: 8` lineage is not all exact-slot Fair sales; it spans sibling slot `6434923` and mixed conditions.
- Purchase/parts/labour/shipping/fixed cost/break-even/proposed/min/net@min/margin:
  - Purchase `£145`
  - Parts `£186`
  - Labour `3.3416666667h` -> `£80.20`
  - Shipping `£15`
  - Fixed cost `£440.70`
  - Break-even `£569`
  - Proposed `£405`
  - Min `£393`
  - Net@min `-£128.34`
  - Margin `-32.66%`
- Old SOP decision:
  - **BLOCK**
  - Reason: `Loss at min_price (net £-128.34)`
- Temporary clearance decision:
  - Identity/safety gates pass, so the commercial/profit threshold is informational only under the temporary clearance rule.
  - Even so, the new hard rule now controls: **do not live-list unless Ricky explicitly says `Approve BM 1527`**.
  - Operational state: **approval candidate only**, not listable yet.
- Clear recommendation:
  - **Selected next card:** BM 1527
  - **Recommendation:** hold for approval only
  - **Do not list** unless Ricky explicitly replies `Approve BM 1527`
  - If Ricky approves, the read-only card supports a bottom-of-Fair position around `£405` with min `£393`, while accepting an expected loss of about `£128.34` at min

### Candidate / Customer / Items

- BM: `1527`
- Customer: `Precious Uhwache`
- Main item: `11440582288`
- BM Devices item: `11440594268`
- Queue classification: `READY_FOR_LISTING_PROPOSAL`

### Product Identity / Spec Confirmation

- Canonical SKU: `MBP.A2338.M1.8GB.512GB.Silver.Fair`
- Device family: `MacBook Pro 13-inch (2020)`
- Model: `A2338`
- Chip: `Apple M1 8-core and 8-core GPU`
- RAM: `8GB`
- SSD: `512GB`
- Colour: `Silver`
- Grade: `Fair` -> BM `FAIR`
- Resolver title match:
  - `MacBook Pro 13-inch (2020) - Apple M1 8-core and 8-core GPU - 8GB RAM - SSD 512GB - Standard display - QWERTY - English`

### Stored SKU / Expected SKU Match

- Stored SKU: `MBP.A2338.M1.8GB.512GB.Silver.Fair`
- Expected SKU: `MBP.A2338.M1.8GB.512GB.Silver.Fair`
- Result: exact match

### Listing Slot / Product ID

- Registry slot: `5035146`
- UUID product_id: `9ef00207-1136-45f4-99c3-ade923986e43`
- Numeric BM product: `545417`
- Resolver trust: `registry_verified`
- Verification status: `verified`
- Source: `build-listings-registry`
- Confidence: **HIGH**
  - exact canonical SKU-to-slot match
  - exact verified product_id match
  - no contradiction flags in registry slot
  - direct read-only BM GET confirms the slot still exists with the same product family and legacy-equivalent SKU
- Current slot state on `2026-04-26`:
  - `quantity 0`
  - `publication_state 3`
  - BM SKU `MBP13.M1A2338.8GB.512GB.silver.Fair`
  - BM price `£485`
  - BM min `£465`
  - State meaning: draft/offline, not currently live

### Return / Relist Caution

- `return_relist_caution: false`
- No return/relist reason attached to the queue row

### Live Market Scrape / Current Ladder

- Method: `timeout 90s node scripts/list-device.js --dry-run --item 11440582288 --skip-history`
- Run date: `2026-04-26`
- Result: `Live scrape: ok`
- Current ladder:
  - Fair `£405`
  - Good `£458`
  - Excellent `£569`
  - Premium `n/a`
- Ladder assessment:
  - normal order `Fair < Good < Excellent`
  - no inversion
  - Fair sits `£164` below break-even

### Historical Back Market Sales Evidence

- Fresh live BM orders pull on `2026-04-26`:
  - exact slot `5035146`: `0` sales returned in the last 90 days
  - FAIR lineage for UUID `9ef00207-1136-45f4-99c3-ade923986e43`: `0` sales returned in the same live 90-day window
- Exact-slot local evidence:
  - `data/vetted-listings-audit.json`
  - listing `5035146`
  - status `vetted_exact`
  - `history_count: 5`
  - `product_history_count: 5`
  - sales SKU lineage exactly matches the Fair slot SKU `MBP13.M1A2338.8GB.512GB.silver.Fair`
- Wider product lineage:
  - `data/order-history-product-ids.json` product `545417`
  - `order_count: 8`
  - `first_seen: 2025-01-14`
  - `last_seen: 2026-02-02`
  - `listing_ids_seen: 6434923, 5035146`
  - `prices_seen: £464, £485, £497, £570, £579`
  - `conditions_seen: 11, 12`
- Exact-slot shipped-order linkage:
  - `reports/bm-trade-order-bm-devices-reconcile-2026-04-26-030005.json`
  - order `GB-26025-UCUVC`
  - listing `5035146`
  - matched BM item `BM 1297`
  - shipping `2026-01-12T11:31:46+00:00`
  - payment `2026-01-16T08:49:27+00:00`
- Caveats:
  - recent live 90-day sell-through is absent
  - wider lineage counts include mixed-condition sibling slot `6434923`, so do not treat all `8` historical orders as exact-slot Fair sales

### Economics

- Purchase: `£145`
- Parts: `£186`
- Labour: `3.3416666667h` -> `£80.20`
- Shipping: `£15`
- Fixed cost total: `£440.70`
- Break-even: `£569`
- Proposed price: `£405`
- Minimum price: `£393`
- Net at minimum price: `-£128.34`
- Margin at minimum price: `-32.66%`

### Old SOP Decision

- Status: **BLOCK**
- Reason: `Loss at min_price (net £-128.34)`

### Temporary Clearance Decision

- Identity/safety decision: **passes**
  - exact SKU gate passes
  - exact resolver slot/product_id match
  - current slot is offline, not active
  - return/relist caution is false
- Commercial decision under temporary clearance rule: informational only
- Hard-rule overlay:
  - **no live listing unless Ricky explicitly says `Approve BM 1527`**

### Recommendation

- **Selected candidate:** BM 1527
- **Status:** ready for Ricky review, not for live action
- **Recommendation:** keep this as the next approval card after the BM 1549 hold
- **Action boundary:** no BM or Monday mutation unless Ricky explicitly replies `Approve BM 1527`
