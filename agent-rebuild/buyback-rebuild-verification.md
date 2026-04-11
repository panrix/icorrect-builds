# Buyback Rebuild Spec Verification

Date: 2026-04-06
Output for Brief C11

## Sources checked

- `/home/ricky/builds/backmarket/docs/trusted-buyback-plan-qa-compilation-2026-03-30.md`
- `/home/ricky/builds/backmarket/docs/staged/2026-03-31/buyback-profit-model.md`
- `/home/ricky/builds/backmarket/docs/staged/2026-03-31/buyback-monday-schema.md`
- `/home/ricky/builds/buyback-monitor/buy_box_monitor.py`
- `/home/ricky/builds/buyback-monitor/README.md`
- `/home/ricky/kb/monday/bm-devices-board.md`
- Supporting repo evidence used to resolve conflicts:
  - `/home/ricky/builds/backmarket/docs/VERIFIED-COLUMN-REFERENCE.md`
  - `/home/ricky/builds/backmarket/sops/00-BACK-MARKET-MASTER.md`
  - `/home/ricky/builds/backmarket/sops/06-listing.md`
  - `/home/ricky/builds/buyback-monitor/docs/BUY-BOX-MONITOR-CRITIQUE.md`
  - `/home/ricky/.openclaw/agents/main/workspace/data/buyback/buy-box-2026-04-06.json`
  - `/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json`

## Live verification performed

- Monday GraphQL, 2026-04-06, board `3892194968` and board `349212843`
- Back Market seller API, 2026-04-06:
  - `GET /ws/orders?state=9&page_size=1`
  - `GET /ws/buyback/v1/orders?page_size=1`

## 1. Is the profit formula in the spec still accurate?

Short answer: yes in structure, no as a sufficient safety control on its own.

### What is still accurate

- The formula shape in the spec is still the right one:
  - sell price
  - buy price
  - BM buy fee
  - BM sell fee
  - tax
  - parts
  - labour
  - shipping
- Sale-side fee is confirmed live at 10%.
  - Live `GET /ws/orders?state=9&page_size=1` returned `price = 460.0`, `orderline_fee = 46.0`, ratio `0.10`.
- Buy-side fee is not exposed in the sampled `/ws/buyback/v1/orders` payload.
  - Inference: keep the 10% buy fee in the spec. Multiple current internal SOPs and March 2026 analysis docs still treat the buyback purchase fee as 10%, and no fresher contrary evidence was found.
- Shipping at `£15` still matches current internal docs and current code.
- Labour at `£24/hr` matches current code.

### What is stale or misleading around the formula

- `/home/ricky/builds/buyback-monitor/README.md` is stale.
  - It still documents `2.6 hrs x £25/hr`.
  - Current code uses grade-based hours and `£24/hr`.
- The real problem is not the formula shape. The real problem is the current input quality and fallback policy.

### Current implementation evidence

- On the 2026-04-06 production output, `buy_box_monitor.py` used:
  - generic `sell_price_ref = 500` for `1152 / 2603` listings
  - `UNKNOWN` or empty SKU for `135` listings
  - no live `parts-cost-lookup.json`
  - no live `profit-summary.json`
- That means the current runtime is still making decisions from flat parts costs and generic sell-price fallbacks for a large share of the catalogue.

### M2 Air exposure under current market prices

- Current scraper file `sell-prices-latest.json` is fresh: `scraped_at 2026-04-06T05:07:47.269Z`.
- Current `Fair` price bucket for `Air 13" 2022 M2` is `£589`.
- Under the current code’s own assumptions, many live M2 Air listings are below the spec floor of `£150` net:
  - `MBA13.2022.M2` rows in current run: `216`
  - below `£150` at win/current price: `193`
  - winning M2 Air rows below `£150`: `190`
- Example current live winners from `buy-box-2026-04-06.json`:
  - `MBA13 2022 M2 8GB/256GB FUNC.CRACK` at `£159` => `£100.52`
  - `MBA13 2022 M2 8GB/256GB NONFUNC.USED` at `£146` => `£134.65`
  - `MBA13 2022 M2 8GB/512GB FUNC.CRACK` at `£196` => `£65.99`

Conclusion: the spec formula is still the right formula, but it only becomes safe if the engine also enforces fail-closed input rules and the `£150` floor.

## 2. Are the Monday column IDs in the schema doc still valid?

Short answer: the important core IDs are still valid live, but the staged schema note and the KB page both contain stale descriptions. The KB page is not safe to use as-is for lookup semantics.

### BM Devices board `3892194968`

Live-verified as present:

- `text_mkyd4bx3` — `BM Listing ID`
- `text89` — `BackMarket SKU`
- `status__1` — `RAM`
- `status7__1` — `CPU`
- `color2` — `SSD`
- `text4` — `Sold to`
- `text_mkye7p1c` — `BM Sales Order ID`
- `text_mm1dt53s` — `UUID`
- `board_relation` — `Main Item`
- `formula` — `Backmarket Fee`
- `formula_1` — `Gross Profit`
- `formula7` — `Tax`
- `formula_mm0xekc4` — `Net Profit`
- `formula_mm0za8kh` — `Total costs`
- `formula_mkyc2xe3` — `Total Labour Cost`
- `formula_mm0ykbya` — `% net Profit`
- `numeric_mm1mgcgn` — `Total Fixed Cost`

KB page and staged schema issues:

- `/home/ricky/kb/monday/bm-devices-board.md` marks the board as `needs-source-verification`. That warning is correct.
- `text_mkqy3576` from the KB page did not resolve on the live board.
  - The live board instead has `lookup_mm1vzeam` titled `Trade-in Order ID` as a mirror.
  - Treat the KB reference to `text_mkqy3576` as stale.
- Several lookup meanings in the KB page are wrong now:
  - `lookup_mkqg4gr8` is live `Reported Battery`, not `Overall Grade`
  - `lookup_mkqgb1te` is live `Actual Battery`
  - `lookup_mkqgkkpg` is live `Reported Screen`, not generic `Damage`
  - `lookup_mkqg1q79` is live `Actual Screen`
  - `lookup_mkqgq791` is live `Reported Casing`
  - `lookup_mkqg33kj` is live `Actual Casing`
- `mirror_Mjj4H2hl` is live `Final Grading`, not just generic `Grade`.
- `mirror7__1` is live `Serial Number`, not generic `Serial`.

### Main Board `349212843`

Live-verified as present:

- `lookup_mkx1xzd7` — `Parts Cost`
- `formula_mkx1bjqr` — `Total Labour`
- `formula__1` — `Total RR&D Time`
- `status8` — `Colour`
- `status_2_Mjj4GJNQ` — `* Final Grade *`
- `status24` — `Repair Type`
- `board_relation5` — `Device`
- `text4` — `IMEI/SN`

Conclusion: the IDs required for the rebuild are mostly still live, but the KB descriptions are partially stale. The rebuild should use live-verified column IDs, not the KB page text, as canonical truth.

## 3. Does the current `buy_box_monitor.py` already implement any parts of the spec?

Yes. It already implements parts of ingestion, competitor collection, profit calculation, reporting, and execution safety. It does not implement the rebuilt decision core.

### Already present

- Environment-based auth loading from `.env`
- Buyback listing ingestion from `/ws/buyback/v1/listings`
- Competitor ingestion from `/ws/buyback/v1/competitors/{listing_id}`
- A basic SKU parser:
  - model family extraction
  - Apple model mapping
- Profit calculation including:
  - buy price
  - buy fee
  - sell fee
  - tax
  - parts
  - labour
  - shipping
- Daily batch-style operation
- Progress persistence and resume
- Read-only mode for bump execution via `--dry-run`
- Rate limiting and retry handling on BM API writes
- Auto-bump execution with some safety caps:
  - min profit
  - max gap
  - consecutive failure abort
- Markdown and JSON reporting

### Important partial implementations

- It already gathers two inputs the rebuild still needs:
  - listing state
  - competitor state
- It already produces useful operational outputs:
  - current profitability
  - price-to-win profitability
  - overbid analysis

Conclusion: keep it as a reference producer and a comparison tool during shadow mode. Do not keep extending it as the rebuilt engine.

## 4. What is the gap between current code and the spec?

The gap is large. The current script is a tactical monitor; the spec is a replacement decision system.

### A. Sell-price resolution is still non-canonical

Spec requirement:

- canonical sell-price source = scraper v7
- exact spec match first
- conservative lower-spec fallback
- otherwise block

Current code:

- reads `sell-prices-latest.json`
- resolves only by broad model key
- does not produce a canonical spec row
- does not implement approved lower-spec fallback logic
- falls back to historical lookup if available
- falls back to generic `£500` if not

Current evidence:

- `sell-prices-latest.json` is still bucketed, not resolved into exact variant rows.
- Example for `Air 13" 2022 M2`:
  - `grades.Fair = 589`
  - `ram.16 GB = 703`
  - `ssd.512 GB = 709`
  - `cpu_gpu.Apple M2 8-core - 10-core GPU = 706`
- Those are independent picker buckets, not a proven exact variant tuple.
- Current production output uses the same `sell_price_ref = 589` across multiple distinct `MBA13.2022.M2` specs.

### B. The engine does not fail closed

Spec requirement:

- default bias must be `BLOCK`
- no exact or approved fallback price => block
- no confident cost fact => block
- parsing failure => block

Current code:

- unknown SKU can still be processed
- missing price can still use `500`
- missing costs can still use flat defaults
- unknown model family can still be reported and sometimes held live

Current evidence:

- `1152 / 2603` listings in the 2026-04-06 run used the generic `500` sell price
- `135` listings had `UNKNOWN` or empty SKU

This is the opposite of the spec’s fail-closed rule.

### C. Cost facts do not exist yet

Spec requirement:

- `CostFact` with
  - parts
  - labour
  - shipping
  - source
  - timestamp
  - confidence

Current code:

- parts from flat grade defaults if lookup file absent
- labour from flat grade defaults
- shipping fixed `15`
- no timestamped cost artifact
- no confidence score
- no provenance at decision level

Current runtime evidence:

- no live `parts-cost-lookup.json` present in `/home/ricky/.openclaw/agents/main/workspace/data/buyback/`

### D. Decision policy does not match the spec

Spec requirement:

- decisions = `RAISE`, `LOWER`, `HOLD`, `BLOCK`
- minimum net profit for automation = `150 GBP`
- guardrails, overrides, exposure caps, reason codes

Current code:

- effectively uses:
  - raise
  - consider
  - leave
- auto-bump threshold is `£30`, not `£150`
- no explicit `BLOCK`
- no manual override system
- no model-family exposure cap
- no hard blocklist
- no reason codes

Current evidence:

- `20` losing listings in the 2026-04-06 run would qualify for auto-bump under the current `>= £30` rule while still being below the spec floor of `£150`.

### E. Winning under-floor listings are not handled

Spec requirement:

- under-floor listings should not remain live just because they are currently winning

Current code:

- only thinks about bumping losing listings
- reports overbid reductions, but does not enforce profit-floor reductions or blocks on live winners

Current evidence:

- `1423` winning listings in the 2026-04-06 run are below `£150`
- `190` of those are `MBA13.2022.M2`

This is the key operational gap behind the current loss exposure.

### F. Persistence and auditability are missing

Spec requirement:

- Postgres source of truth
- `listing_snapshot`
- `price_fact`
- `cost_fact`
- `decision_run`
- `decision_result`
- `applied_change`
- `manual_override`
- `alert_event`

Current code:

- writes JSON and markdown files only
- no decision-fact lineage
- no per-listing reason-code persistence
- no audit-ready explanation chain

### G. The architecture is still the old monolith

Spec requirement:

- separate package and entrypoints:
  - ingest
  - normalize
  - decide
  - apply
  - report

Current code:

- one large operational script
- logic, API access, parsing, pricing, decisions, reporting, and execution are all mixed together

## 5. What would Phase 1 of the rebuild look like?

The minimum viable Phase 1 should be narrower than the original plan’s “foundation” wording. The immediate goal is not full automation. The immediate goal is to stop allowing under-floor and unresolved listings to stay live.

## Recommended Phase 1: stop-loss gate

### Scope

- No new auto-raises in Phase 1
- Allow:
  - `BLOCK`
  - `HOLD`
  - `LOWER`
- Keep `RAISE` out until exact pricing and cost provenance are proven in shadow mode

### Phase 1 deliverables

1. Freeze input contracts for active MacBook buyback SKUs

- Build a canonical parser for the active catalogue only:
  - MBA13
  - MBA15
  - MBP13
  - MBP14
  - MBP16
- Output:
  - listing_id
  - canonical_spec_key
  - buyback_grade
  - current_bid
  - current_win_state
  - price_to_win
- Any parse failure => `BLOCK`

2. Remove unsafe fallbacks immediately

- Delete generic `sell_price_ref = 500` from live decisioning
- If no approved price fact exists => `BLOCK`
- If no approved cost fact exists => `BLOCK`
- If SKU is empty or unknown => `BLOCK`

3. Implement a conservative price fact for Phase 1

- Do not pretend v7 already gives exact variant rows.
- For Phase 1, use only a restricted, proven set:
  - exact `Fair` where the variant can be resolved safely
  - otherwise a manually approved stop-loss table for the active high-volume specs
- Anything outside that proven set => `BLOCK`

4. Implement a stop-loss decision layer

- Decision outputs:
  - `BLOCK` if unresolved or below floor
  - `LOWER` if winning but above the max safe bid
  - `HOLD` if winning and still above floor
- Enforce `expected_net_profit_gbp >= 150`
- Apply this rule to both:
  - winning listings
  - losing listings

5. Start with the highest-risk cohort first

- Prioritize:
  - `MBA13.2022.M2`
  - other M2/M3/M4 Air and Pro cohorts that currently sit below the floor
- For `MBA13.2022.M2`, the current run already shows this cohort needs active stop-loss logic.

6. Persist facts and decisions, even if Postgres is minimal

- Minimum tables needed in Phase 1:
  - `listing_snapshot`
  - `price_fact`
  - `cost_fact`
  - `decision_result`
  - `applied_change`
- This is the minimum needed to explain every block and reduction.

7. Shadow first, then allow lowers

- Phase 1A:
  - read-only shadow run
  - compare against current monitor for 3 to 5 days
- Phase 1B:
  - enable `LOWER` and `BLOCK` actions only
  - keep `RAISE` disabled

## Concrete first build slice

- `buyback_engine.ingest`
  - fetch listings
  - fetch competitors
  - persist raw snapshot
- `buyback_engine.normalize`
  - parse SKU to canonical key
  - reject unresolved rows
- `buyback_engine.price_facts`
  - read proven Phase 1 price source
  - emit `Fair` price facts only
- `buyback_engine.cost_facts`
  - read approved cost facts only
  - emit confidence and source timestamps
- `buyback_engine.decide`
  - apply `BLOCK/HOLD/LOWER`
  - enforce `150 GBP` floor
- `buyback_engine.apply`
  - initially allow lowers only
- `buyback_engine.report`
  - under-floor winners
  - unresolved rows
  - fallback rate

## Why this Phase 1 is the right minimum

- It directly addresses the live failure:
  - unprofitable or low-profit devices staying listed
- It does not depend on pretending v7 already has exact variant truth
- It keeps the rebuild conservative and reversible
- It gets the business out of “raise on weak data” mode first

## Final assessment

- The rebuild spec direction is still right.
- The formula is still right.
- The Monday core IDs are mostly still right, but the docs need live re-verification and some field meanings have drifted.
- The current `buy_box_monitor.py` contains reusable ingestion and execution plumbing, but not the decision core the spec requires.
- The immediate business-safe Phase 1 is:
  - fail closed
  - remove generic sell-price fallback
  - enforce the `£150` floor on live winners as well as losers
  - enable `LOWER/BLOCK` before any future `RAISE`
