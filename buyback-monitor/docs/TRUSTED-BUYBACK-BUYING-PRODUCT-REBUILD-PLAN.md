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
