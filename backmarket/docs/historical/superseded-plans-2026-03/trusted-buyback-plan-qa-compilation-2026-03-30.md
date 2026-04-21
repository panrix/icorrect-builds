# Trusted Buyback Plan And QA Compilation

Compiled: 2026-03-30

This document bundles:

1. The original plan from `/home/ricky/builds/buyback-monitor/docs/TRUSTED-BUYBACK-BUYING-PRODUCT-REBUILD-PLAN.md`
2. The first QA review embedded in that original plan
3. The second-pass QA review completed against `/home/ricky/.claude/plans/starry-noodling-falcon.md`

---

## Part 1: Original Plan

# Trusted Buyback Buying Product Rebuild Plan

Date: 2026-03-30
Audience: build agent / engineer
Status: implementation handoff

## 1. Goal

Build a new buyback buying product that can be trusted to run the business.

This is not a cleanup of the current monitor. It is a replacement of the
decision core, while reusing any existing data producers that are still useful.

The product must:

- ingest buyback listings and competitor state daily
- normalize each listing into one canonical spec
- resolve a conservative sell price from scraper v7
- calculate expected sale profit
- decide whether to raise, lower, hold, or block a bid
- apply allowed bid changes automatically
- persist the source facts and reasons behind every decision

## 2. Product Principles

The implementation must obey these rules:

- Canonical sell-price source: `sell_price_scraper_v7.js`
- Canonical sell-grade assumption: `Fair` for every device
- Primary optimization target in v1: sale-level net profit only
- Minimum net profit for automation: `150 GBP`
- Execution cadence: daily batch
- Automation mode: full auto, but only inside explicit guardrails
- Canonical persistence: Postgres
- Operator surface in v1: logs + alerts

The following are intentionally out of v1 live bidding logic:

- stuck-device penalties
- cancellation / non-send penalties
- realized cash timing
- throughput drag

These must still be captured in reporting, but they must not alter live bid
decisions in v1.

## 3. Current-System Treatment

Treat the current repo as reference material, not architecture.

Keep:

- `sell_price_scraper_v7.js` as the sell-price producer
- useful raw-input scripts such as parts-cost generation and order sync
- historical findings and datasets
- proven SKU/spec mapping knowledge where still valid

Replace:

- the current decision engine in `buy_box_monitor.py`
- the current orchestration path in `run_price_pipeline.py`
- ad hoc file-based state as the source of truth
- live fallback behavior based on broad averages or generic defaults
- current bump logging as the primary audit mechanism

Throw away:

- any live path that uses a generic sell price to keep automation running
- any live path that guesses `Good` or `Excellent` sell outcomes
- any fallback that moves upward to a higher-value spec
- any auto-buy path that continues despite low-confidence pricing or cost data

## 4. Target Architecture

Build four subsystems:

1. ingestion
2. normalization
3. decision engine
4. execution + reporting

The product should run as one scheduled daily workflow:

1. ingest all source data
2. validate freshness and completeness
3. normalize listings into canonical facts
4. resolve price and cost facts
5. compute decision results
6. apply permitted changes
7. persist outputs and emit alerts

Do not rely on JSON files as the canonical internal state. Files can still be
produced as reports or debugging artifacts.

## 5. Canonical Device Model

Every buyback listing must be converted into one canonical internal shape:

### NormalizedListing

- `listing_id`
- `buyback_sku`
- `model_family`
- `chip`
- `ram_gb`
- `storage_gb`
- `canonical_spec_key`
- `current_bid_gbp`
- `current_win_state`
- `price_to_win_gbp`
- `snapshot_at`

### Canonical spec key

Use one internal format only:

`{family}.{chip}.{ram}.{storage}`

Examples:

- `MBA13.2022.M2.8GB.256GB`
- `MBP14.2023.M3PRO.18GB.512GB`

If a buyback SKU cannot be parsed into this structure, the listing must be
blocked from automation.

## 6. Pricing Model

### 6.1 Source of truth

Use scraper v7 output as the canonical sell-price source.

The engine must only consume normalized facts derived from scraper v7, not
direct ad hoc reads inside the decision loop.

### 6.2 Selling-grade policy

Use `Fair` sell price for every listing, regardless of buyback condition.

This is a deliberate conservative assumption and must be applied uniformly.

### 6.3 Match policy

Resolve sell price in this order:

1. exact spec match
2. conservative lower-spec fallback within the same model/chip family
3. block

The fallback must obey all of the following:

- same device family
- same chip bucket
- same year/model generation
- equal or lower RAM
- equal or lower storage
- never higher-value than the target spec

If more than one fallback candidate exists, choose the lowest-value valid match.

### 6.4 Price fact contract

### PriceFact

- `canonical_spec_key`
- `fair_price_gbp`
- `source`
- `source_timestamp`
- `match_type`
  - `exact`
  - `lower_spec_fallback`
- `matched_spec_key`
- `confidence_score`

If there is no exact or approved fallback `PriceFact`, the listing must be
blocked.

## 7. Cost Model

### 7.1 Required inputs

The decision engine must consume cost facts, not hardcoded heuristic cost
buckets.

Each cost fact must include:

- parts cost
- labor cost
- shipping cost
- source
- source timestamp
- confidence

### 7.2 Fallback policy

Resolve costs in this order:

1. exact approved spec/model cost
2. approved family-level fallback
3. block

If the implementation cannot produce a confident cost fact, it must block the
listing rather than guess.

### CostFact

- `cost_key`
- `parts_cost_gbp`
- `labor_cost_gbp`
- `shipping_cost_gbp`
- `source`
- `source_timestamp`
- `confidence_score`

## 8. Profit Formula

Expected sale profit must include:

- buyback bid
- BM buy fee
- BM resale fee
- VAT/tax
- parts cost
- labor cost
- shipping cost
- fixed safety buffer

The engine must calculate at least:

- `expected_net_profit_gbp`
- `expected_margin_pct`
- `confidence_score`
- `reason_codes`

The engine must not include stuck-device drag or cancellation economics in v1.

## 9. Decision Policy

Allowed actions:

- `RAISE`
- `LOWER`
- `HOLD`
- `BLOCK`

### Required block conditions

The engine must block a listing when any of the following is true:

- source data is stale
- SKU/spec parsing fails
- no exact or approved fallback sell price exists
- no confident cost fact exists
- expected net profit is below `150 GBP`
- a manual override blocks it
- execution caps would be exceeded

### Required safety rules

- max raise per listing per run
- max lower per listing per run
- max total changes per run
- max exposure by model family
- hard blocklist support
- manual override support

Default bias must be `BLOCK`, not guess.

## 10. Persistence Design

Use Postgres as the sole source of truth.

Create the following tables.

### `listing_snapshot`

- id
- run_id
- listing_id
- buyback_sku
- model_family
- chip
- ram_gb
- storage_gb
- canonical_spec_key
- current_bid_gbp
- current_win_state
- price_to_win_gbp
- snapshot_at

### `price_fact`

- id
- canonical_spec_key
- fair_price_gbp
- matched_spec_key
- match_type
- source
- source_timestamp
- confidence_score
- created_at

### `cost_fact`

- id
- cost_key
- parts_cost_gbp
- labor_cost_gbp
- shipping_cost_gbp
- source
- source_timestamp
- confidence_score
- created_at

### `decision_run`

- id
- run_started_at
- run_finished_at
- status
- stale_input_count
- blocked_count
- raise_count
- lower_count
- hold_count

### `decision_result`

- id
- run_id
- listing_id
- canonical_spec_key
- action
- target_bid_gbp
- expected_net_profit_gbp
- expected_margin_pct
- confidence_score
- reason_codes_json
- applied
- created_at

### `applied_change`

- id
- run_id
- listing_id
- old_bid_gbp
- new_bid_gbp
- api_status
- api_response_excerpt
- applied_at

### `manual_override`

- id
- scope_type
- scope_key
- action
- reason
- expires_at
- created_at

### `alert_event`

- id
- run_id
- severity
- scope_type
- scope_key
- message
- created_at

## 11. Jobs and Entry Points

Build explicit entry points instead of continuing with one overloaded monitor
script.

Recommended Python entrypoints:

- `python3 -m buyback_engine.ingest`
- `python3 -m buyback_engine.normalize`
- `python3 -m buyback_engine.decide`
- `python3 -m buyback_engine.apply`
- `python3 -m buyback_engine.report`
- `python3 -m buyback_engine.run_daily`

Recommended daily sequence:

1. `ingest`
2. `normalize`
3. `decide`
4. `apply`
5. `report`

`run_daily` should orchestrate the full sequence and fail closed when upstream
data is stale or broken.

## 12. File and Module Layout

Create a new Python package inside the repo:

- `buyback_engine/`

Recommended modules:

- `buyback_engine/config.py`
- `buyback_engine/db.py`
- `buyback_engine/models.py`
- `buyback_engine/sku_parser.py`
- `buyback_engine/price_facts.py`
- `buyback_engine/cost_facts.py`
- `buyback_engine/profit.py`
- `buyback_engine/decisions.py`
- `buyback_engine/overrides.py`
- `buyback_engine/executor.py`
- `buyback_engine/alerts.py`
- `buyback_engine/run_daily.py`

Keep `buy_box_monitor.py` intact during the transition, but do not keep adding
logic to it. It should be retired after cutover.

## 13. Implementation Phases

### Phase 1: foundation

- create Postgres schema
- create canonical SKU/spec parser
- build ingestion adapters for buyback listings, competitor data, scraper v7,
  and cost inputs
- persist normalized facts

### Phase 2: pricing + cost engine

- normalize scraper v7 into `PriceFact`
- implement exact matching
- implement lower-spec fallback
- normalize costs into `CostFact`
- implement cost fallback

### Phase 3: decision engine

- implement profit formula
- implement `RAISE / LOWER / HOLD / BLOCK`
- implement `150 GBP` minimum profit floor
- implement confidence and guardrail rules
- persist `decision_result`

### Phase 4: execution layer

- apply allowed bid changes via BM API
- persist all applied changes
- add alerts for stale data, blocked cohorts, and abnormal fallback rates

### Phase 5: shadow mode

- run the new engine in parallel for 2 to 3 weeks
- do not let it update bids yet
- compare output against the current system
- review blocked cases and fallback usage

### Phase 6: cutover

- enable real bid updates from the new engine
- disable the old monitor
- keep old scripts only as raw input producers if still useful

### Phase 7: separate reporting

- add reporting for stuck devices, cancellations, non-send rates, and ageing
- keep this out of v1 live decision logic

## 14. Testing Requirements

### Unit tests

- SKU/spec parsing for all active families
- exact sell-price matching
- lower-spec fallback matching
- no-match block behavior
- cost lookup exact match
- cost lookup fallback
- below-`150 GBP` block
- stale-input block
- override precedence

### Scenario tests

- premium device with exact profitable raise
- common device using lower-spec fallback
- stale scraper v7 input
- malformed or unparseable buyback SKU
- listing that would pass under rough family pricing but fails under exact
  `Fair` pricing
- listing blocked because only higher-spec prices exist

### Integration tests

- ingest -> normalize -> decide -> apply -> persist
- rerun same batch without duplicate actions
- fail one input source and confirm affected listings block cleanly

## 15. Acceptance Criteria

The rebuilt product is ready for cutover only when:

- no live decision depends on a generic default sell price
- every applied change can be explained from persisted facts
- exact or approved fallback coverage is high enough for the active catalog
- blocked cases are consistent and understandable
- daily runs are deterministic and idempotent
- old monitor can be disabled without losing automation coverage

## 16. QA Questions For Review

The build should be QA'd against these questions:

1. Is scraper v7 strong enough to act as the canonical sell-price source?
2. Is `Fair for everything` conservative enough for live automation?
3. Is lower-spec fallback defined precisely enough to implement safely?
4. Is `150 GBP` the right minimum net profit floor?
5. Are block conditions strict enough to prevent guess-driven bidding?
6. Are Postgres facts and decision records sufficient for auditability?
7. Is daily batch cadence sufficient for buyback competitor movement?
8. Is excluding stuck-device economics from v1 live bidding logic an acceptable
   scope cut?
9. Does this design leave any important implementation decisions open?
10. Is any part of the current codebase incorrectly left authoritative rather
    than treated as a raw input/reference layer?

## 17. Notes For The Implementing Agent

- Do not refactor the current monitor in place as the main strategy.
- Build the new engine beside the current code.
- Default to `BLOCK` when confidence is weak.
- Keep v1 narrow and conservative.
- Do not add stuck-device economics into live bidding until the base engine is
  proven trustworthy.

---

## Part 2: First QA Review

## 18. QA Review

Date: 2026-03-30
Assessment: no-go as written

### Findings

1. The plan treats exact-spec pricing and lower-spec fallback as routine
   implementation work, but the current `sell_price_scraper_v7.js` output does
   not yet provide a resolved exact-variant price table. It emits picker buckets
   such as `grades`, `ram`, `ssd`, `cpu_gpu`, `colour`, and `size`, which is not
   the same as a proven `PriceFact` contract.

2. The current producer chain is not contract-stable enough to be treated as
   reusable input plumbing. `run_price_pipeline.py` still calls
   `sell_price_scraper.py`, while `sell_price_scraper_v7.js` writes a different
   output shape and `generate_sell_lookup.py` expects a different normalization
   path and filesystem location.

3. Canonical SKU/spec normalization is still underdefined. The plan assumes a
   deterministic internal spec key, but the current repo still relies on manual
   mapping tables and already contains model-mapping inconsistencies. Parser
   truth needs to be established before the spec key can be trusted for live
   automation.

4. The proposed `CostFact` contract is ahead of the current cost data reality.
   The existing cost builder produces model-and-grade recommendations with
   family fallback and weak last-resort defaults, not a clean, confidence-backed
   exact spec cost fact with separated parts, labor, and shipping components.

5. Excluding stuck-device and cancellation economics from v1 live bidding is
   not obviously safe if the goal is a system that can be trusted to run the
   business. The repo's own findings show meaningful non-send, cancellation, and
   stuck-device drag that materially affects order-level economics.

6. The implementation order is too optimistic. Postgres schema should not come
   first while source contracts, parser truth, and fallback safety are still
   unresolved. That sequence risks hard-coding the wrong abstractions.

### Required Plan Changes Before Implementation

- Add a Phase 0 for source-contract validation:
  - prove how `sell_price_scraper_v7.js` becomes a safe `PriceFact`
  - audit active buyback SKU shapes and freeze parser rules
  - define cost-fact confidence levels and approved fallbacks
- Make one producer path authoritative for sell-price ingestion instead of
  assuming current scripts already line up.
- Narrow the first executable slice to `ingest -> normalize -> decide ->
  persist`, with no live bid updates yet.
- Define measurable shadow-mode gates:
  - exact-match coverage
  - fallback rate
  - blocked rate
  - stale-input rate
  - decision divergence against manual review

### Recommended Revised Execution Order

1. Validate source contracts on real current data.
2. Freeze canonical SKU/spec parsing rules.
3. Define price and cost fact contracts from proven inputs.
4. Design the Postgres schema from those contracts.
5. Build ingestion, normalization, and persistence.
6. Build the decision engine in shadow mode only.
7. Add live execution only after coverage and safety thresholds are met.

### Go / No-Go

No-go until source contracts, parser truth, and first-pass shadow-mode scope are
made explicit.

---

## Part 3: Second-Pass QA Review

Date: 2026-03-30
Reviewer: Codex
Target plan: `/home/ricky/.claude/plans/starry-noodling-falcon.md`
Assessment: not ready

### Findings

1. Severity: critical
   What is still wrong:
   Task 1 is not executable as written. The revised plan says to validate
   `prices.GB.amount` and to copy fixtures from repo `data/buy-box-2026-03-30.json`,
   but the real file is in the OpenClaw data directory and its entries do not
   have that schema. The cost fixture story is also unproven because
   `build_cost_matrix.py` depends on `parts-raw-data-filtered.json`, and neither
   that file nor `parts-cost-lookup.json` was present at an obvious path during
   review.

   Why this would cause execution pain or unsafe behavior:
   The team cannot assemble the fixtures the plan claims are ready, so
   implementation stalls before any real coding starts.

   Evidence from repo and plan:
   - Revised plan Task 1 references `prices.GB.amount` and repo `data/` fixture paths.
   - Real buy-box file: `/home/ricky/.openclaw/agents/main/workspace/data/buyback/buy-box-2026-03-30.json`
   - Cost builder input path: `/home/ricky/builds/buyback-monitor/build_cost_matrix.py`

   What should change before implementation starts:
   Pin the actual absolute fixture paths, split raw BM listing fixtures from
   processed buy-box fixtures, and make cost-input verification a prerequisite.

2. Severity: critical
   What is still wrong:
   The pricing contract still invents exactness. The revised plan proposes exact
   and ratio-derived `PriceFact`s from v7 picker buckets, but the scraper writes
   independent category buckets, not resolved variant tuples.

   Why this would cause execution pain or unsafe behavior:
   The engine would be pricing unresolved combinations as if they were exact
   specs. That is exactly how unsafe confidence gets smuggled into automated
   bidding.

   Evidence from repo and plan:
   - Revised plan D1 and Task 3 in `/home/ricky/.claude/plans/starry-noodling-falcon.md`
   - Picker-bucket output in `/home/ricky/builds/buyback-monitor/sell_price_scraper_v7.js`
   - Live file `/home/ricky/builds/buyback-monitor/data/sell-prices-2026-03-30.json`
     shows mixed dimension buckets such as size, RAM, SSD, and GPU with distinct
     `productId`s rather than frozen variant rows.
   - `Air 13" 2025 M4` and `Pro 16" 2023 M3 Pro` currently have no usable `Fair`
     price, so the proposed ratio path already lacks stable source coverage.

   What should change before implementation starts:
   Do a productId-resolution spike first. If exact variant pricing cannot be
   proven, cut v1 to default-config exact `Fair` only and block everything else.

3. Severity: critical
   What is still wrong:
   The task graph forgets competitor ingestion even though the decision engine
   depends on `current_win_state` and `price_to_win`.

   Why this would cause execution pain or unsafe behavior:
   An implementer reaches undefined behavior immediately because the revised
   ingestion task does not actually produce the fields the decision task
   requires.

   Evidence from repo and plan:
   - Revised plan Task 7 only loads listings, scraper data, and cost data.
   - Revised plan Task 8 expects decision inputs that come from competitor state.
   - Current implementation fetches competitor state separately in
     `/home/ricky/builds/buyback-monitor/buy_box_monitor.py`.

   What should change before implementation starts:
   Add competitor snapshot ingestion before normalization, pricing, or decision
   work.

4. Severity: high
   What is still wrong:
   CostFact confidence is not derivable from the artifact the revised plan wants
   to consume. `build_cost_matrix.py` flattens multiple fallback branches into a
   plain `model.grade -> number` lookup.

   Why this would cause execution pain or unsafe behavior:
   The engine would claim direct versus fallback confidence without enough source
   provenance to know which case actually happened.

   Evidence from repo and plan:
   - Revised plan Task 4 assigns direct, family, and last-resort confidence.
   - `build_cost_matrix.py` writes a flattened lookup after applying multiple
     internal fallback branches.

   What should change before implementation starts:
   Either persist structured provenance in the cost artifact or build `CostFact`
   from richer intermediate outputs instead of the flattened lookup.

5. Severity: high
   What is still wrong:
   Abandoning `generate_sell_lookup.py` is not enough because the active
   orchestration path still routes through the old stack.

   Why this would cause execution pain or unsafe behavior:
   The repo will have two competing execution paths while implementation is in
   flight, which guarantees drift and wasted debugging time.

   Evidence from repo and plan:
   - `run_price_pipeline.py` still calls `sell_price_scraper.py` and then
     `generate_sell_lookup.py`
   - Revised plan D4 says `generate_sell_lookup.py` is abandoned

   What should change before implementation starts:
   Replace or explicitly quarantine the old orchestrator early, not at the end.

6. Severity: high
   What is still wrong:
   The dependency story and validation gates are still sloppy. The revised graph
   claims DB work is independent, then the task notes admit the schema depends
   on earlier data shapes. The shadow gate of `5+ consecutive stable daily runs`
   is not measurable as written.

   Why this would cause execution pain or unsafe behavior:
   The team can hard-code the wrong schema too early and then wave through a
   fake shadow-mode success condition that does not prove safety.

   Evidence from repo and plan:
   - Revised plan task graph versus Task 6 dependency note
   - Shadow gate wording in Task 9
   - Verification step compares against a current engine that still uses broad
     sell-price fallbacks and legacy logic

   What should change before implementation starts:
   Put DB work after frozen contracts, and define shadow acceptance as explicit
   metric bands plus manual spot checks.

### What The Earlier QA Likely Still Missed

- The live v7 file contains 43 models: 16 MacBooks, 16 iPhones, and 11 iPads.
  Any validation or coverage metric across the whole file is wrong for a
  MacBook-only engine unless the plan explicitly filters scope first.
- The current MacBook catalogue file has 16 entries, while the reviewed scrape
  output contains 43 models. Fixture regeneration is not reproducible unless the
  plan pins the exact scrape mode and source-file provenance.
- The `135 bad SKUs` are not one parser edge case. In the live buy-box file they
  are 134 empty strings plus 1 literal `None`. That is a source-contract problem
  first, not just a parser task.

### Required Plan Changes

- Rewrite Task 1 around real inputs: raw BM listings fixture, competitor
  snapshot fixture, processed buy-box regression fixture, and explicit external
  paths.
- Insert a pricing spike before Task 3 to prove productId-based exact variant
  resolution, or narrow v1 to default-config exact `Fair` only.
- Add competitor ingestion and define the raw listing plus competitor contracts
  before normalization or decisions.
- Replace the flat cost-lookup dependency with a provenance-carrying cost
  artifact, or document the external producer and reconstruction path explicitly.
- Move Postgres, executor, and live orchestration behind a file-backed shadow
  slice.

### Recommended Final Execution Order

1. Freeze source paths and copy immutable fixtures from the real producer locations.
2. Define raw contracts for listings, competitors, scraper output, and cost inputs.
3. Prove or reject productId-based exact price resolution from v7.
4. Build SKU parsing, competitor ingestion, and normalization only against
   proven contracts.
5. Build cost facts with explicit provenance and block-first behavior.
6. Build profit, decisions, and a file-backed shadow runner and report.
7. After shadow metrics and manual spot checks pass, add Postgres persistence.
8. Only then add executor, alerts, and daily orchestration.

### Final Assessment

Not ready.

Minimum edits before Task 1 can start cleanly:

- fix the fixture paths and schemas
- add competitor ingestion
- stop pretending v7 bucket prices are already exact variant facts
- resolve the missing cost-input and provenance problem
