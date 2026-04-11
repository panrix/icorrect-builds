# BackMarket Documentation Triage

Date: 2026-03-31
Owner: Codex
Scope: `/home/ricky/builds/backmarket`
Purpose: classify Back Market docs into `keep local`, `promote to KB`, or `archive`

## Summary

Current markdown footprint under `/home/ricky/builds/backmarket`:

- `README.md`: `1`
- `analysis/`: `1`
- `audit/`: `13`
- `docs/`: `9`
- `knowledge/`: `1`
- `pricing/`: `3`
- `qa/`: `10`
- `sops/`: `14`
- Total: `52` markdown files, `12,714` lines

The key problem is that `/home/ricky/builds/backmarket` currently mixes:

- repo-local implementation docs
- durable operational SOPs
- dated audits
- QA task files
- technical pricing research

That is manageable, but not as one flat “source of truth.”

## Classification Rules

### Keep Local

Keep in `/home/ricky/builds/backmarket` if the doc is:

- implementation-specific
- build-specific
- script/service-specific
- a repo-local technical reference
- an active task/spec for this codebase

### Promote To KB

Promote or rewrite into KB if the doc is:

- durable SOP content
- stable Back Market operating knowledge
- cross-project business logic
- canonical process documentation

### Archive

Archive if the doc is:

- dated audit output
- old QA tasking
- point-in-time analysis
- superseded planning material

## File-Class Recommendations

### 1. `README.md`

Recommendation: `keep local`, then rewrite later

Reason:

- repo README should stay with the repo
- but it should stop claiming this directory is the sole source of operational truth
- once KB Back Market docs exist, the README should point to them

### 2. `sops/`

Recommendation: `promote to KB`, keep local copies until KB versions exist

Reason:

- these are durable operating procedures
- they should not live only in a build repo
- they are the strongest candidates for a future `/home/ricky/kb/backmarket/`

Priority candidates:

- `00-BACK-MARKET-MASTER.md`
- `01-trade-in-purchase.md`
- `02-intake-receiving.md`
- `03-diagnostic.md`
- `03b-trade-in-payout.md`
- `04-repair-refurb.md`
- `06-listing.md`
- `06.5-listings-reconciliation.md`
- `07-buy-box-management.md`
- `08-sale-detection.md`
- `09-shipping.md`
- `10-payment-reconciliation.md`
- `11-tuesday-cutoff.md`
- `12-returns-aftercare.md`

### 3. `docs/`

Recommendation: mixed

Keep local:

- `SPEC-LISTINGS-REGISTRY-2026-03-28.md`
- `SPEC-SENT-ORDERS-REBUILD-2026-03-30.md`
- `SPEC-VETTED-LISTINGS-UUID-RESOLUTION-2026-03-30.md`
- `PLAN-SCRAPER-IMPROVEMENTS-2026-03-28.md`
- `RESEARCH-BM-CATALOG-SCRAPER-2026-03-27.md`
- `BRIEF-SOP6-SOP7-PRICING-INTELLIGENCE-2026-03-29.md`

Promote to KB after verification:

- `INGRESS-MAP.md`
- `VERIFIED-COLUMN-REFERENCE.md`

Archive:

- `trusted-buyback-plan-qa-compilation-2026-03-30.md`

Reason:

- most `SPEC*`, `PLAN*`, and `RESEARCH*` files are build-local
- ingress maps and verified column references are closer to durable operational reference
- QA compilations are historical

### 4. `pricing/`

Recommendation: mixed

Keep local:

- `README.md`
- `bm-market-prices-supabase.md`
- `bm-price-history-supabase.md`

Reason:

- these currently look like technical pricing research and data-shape reference
- they should inform KB pricing logic later, not be copied into KB blindly

### 5. `knowledge/`

Recommendation: `keep local` for now

File:

- `bm-product-ids.md`

Reason:

- this looks like repo-local technical lookup knowledge
- only promote into KB if it becomes stable cross-project business reference

### 6. `analysis/`

Recommendation: `keep local`

File:

- `api-migration.md`

Reason:

- this is implementation analysis, not canonical operating knowledge

### 7. `audit/`

Recommendation: `archive`

Reason:

- these are dated investigations and reports
- useful as evidence, not as canonical day-to-day docs

### 8. `qa/`

Recommendation: `archive`

Reason:

- these are QA prompts, tasks, and issue files
- they should not live in the canonical doc path

## Immediate Next Actions

1. create `/home/ricky/kb/backmarket/` only after deciding the canonical structure
2. promote the SOP set in a controlled wave, not one file at a time without structure
3. rewrite `README.md` so it points to KB once KB Back Market docs exist
4. archive `audit/` and `qa/` into a dated historical location after capture
5. keep technical specs/research local unless they become durable cross-project reference

## QA Notes

- this is a classification document, not a move log
- no Back Market docs were moved by this step
- the purpose of this document is to prevent ad hoc file shuffling
