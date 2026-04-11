# Vetted Listings and UUID Resolution

Date: 2026-03-30

## Status

This work is not ready for execution as originally framed.

The first draft of this spec overstated what the current audit outputs can prove.
The corrected position is:

- the current audit is useful evidence generation
- it is not yet a live-safe resolver
- the next implementation scope must be MacBook-only
- probe mode must be hardened before it can promote UUID truth
- buy-box verification must move onto corrected resolver truth before live resolver changes ship

## Problem

The current Back Market listing flow is not reliably able to determine whether a `product_id` / UUID is safe to use for a new listing.

In practice, we have conflicting evidence from:

1. Back Market storefront URLs and product pages
2. local merged catalog data in `data/bm-catalog.json`
3. historical sales and listing exports
4. API draft creation and post-create verification

These sources do not always agree.

The operational impact is:

- agents can create a draft listing with a seemingly correct UUID
- the listing can still come back with a spec or colour mismatch
- a listing can be created correctly and still be auto-offlined later because downstream checks trust stale catalog data
- manual work is still required to decide whether a UUID is truly safe

The goal is to get to a state where agents can use vetted MacBook listings with:

- trusted `listing_id`
- trusted `product_id` / UUID
- matching SKU
- matching spec
- matching grade
- trusted colour mapping

## Concrete Example: BM 1533

Case discussed during implementation:

- candidate UUID: `9b1ef69f-c204-4a9f-8b06-a4ec8e37b231`
- generated listing number: `6711634`
- export SKU: `MBA.A2681.M2.8C.8GB.256GB.Midnight.Good`

Observed conflict:

- local `bm-catalog.json` maps UUID `9b1ef69f...` to `Starlight`
- storefront evidence indicates this UUID is being used as `Midnight`
- current export evidence tied to the same UUID / Back Market numeric identity is contradictory
- historical sales tied to the same numeric Back Market identity are also contradictory

This is not a clean "wrong UUID" or "missing UUID" case.
It is a contradictory identity group.

Conclusion:

- BM 1533 is not safely auto-vettable today
- this UUID / Back Market ID group must be quarantined until explicit correction or successful strict probe

## What We Learned From the Data

Two exported datasets were analysed:

- `docs/Backmarket Sales Data - Sheet1.csv`
- `docs/export_listings_57b75831-5e07-4f09-977b-1f216bc0f0a3.csv`

A new audit script was added:

- `analysis/bm-vetted-listings-audit.py`

It produces:

- `data/vetted-listings-audit.json`
- `data/vetted-listings.csv`

Current row-level audit result:

- `4900` rows classified as `vetted_exact`
- `140` rows classified as `vetted_normalized`
- `518` rows classified as `vetted_product_lineage`
- `1358` rows classified as `needs_review`
- `7126` rows classified as `no_history`

Important correction:

- `data/vetted-listings.csv` is not resolver-ready
- it is locale-expanded and row-level, not canonical
- the file contains `5558` rows but only `398` unique `listing_no` values
- only `262` unique `listing_no` values in that file are MacBooks

Therefore:

- the current vetted CSV is evidence
- it is not a trusted resolver dataset

## Why the Current Flow Fails

The current listing flow in `scripts/list-device.js` can:

- resolve one candidate `product_id`
- create a draft listing
- poll the create task
- verify some fields on the returned listing

But it cannot yet:

- return ranked candidates
- try multiple candidate UUIDs automatically
- persist verified outcomes as resolver truth
- distinguish clean lineage from polluted lineage
- propagate corrected truth to all downstream consumers

The current architecture is single-candidate and blocks early.
Candidate-based resolution will require a resolver refactor, not just wiring.

## Why Probe Mode Is Not Yet Strong Enough

`--probe-product-id` exists, but in its current form it is not strong enough to certify a UUID for first live use.

Current weakness:

- probe mode uses the override path
- that causes strict expected `product_id` checking to be skipped
- override also skips colour checking

So today probe mode can collect evidence, but it cannot yet be treated as proof of:

- candidate UUID preservation
- intended colour preservation

Required correction:

probe must fail unless all of the following are true:

- returned `listing.product_id === candidate_product_id`
- grade matches
- RAM matches
- SSD matches
- colour matches, unless a stronger trusted colour proof exists

Only that stricter verdict should be persisted as resolver truth.

## Core Diagnosis

The issue is not just "we need more product IDs."

The real issue is that UUID trust has not been formalized.

We need a resolver that can rank evidence and produce explicit trust states.

No single source is sufficient on its own.

## Canonical Resolver Truth

The next iteration must define one canonical resolver truth store.

It should not create a second parallel truth file beside:

- `data/listings-registry.json`
- `data/catalog-corrections.json`

Instead, one canonical store should be extended or introduced with explicit precedence and schema.

Minimum required fields:

- normalized MacBook identity
- `listing_no`
- Back Market numeric product identity
- UUID / `product_id`
- normalized SKU
- normalized colour
- normalized grade
- trust class
- evidence source
- freshness / last verified timestamp
- contradiction flags

### Recommended precedence

1. manual block / manual correction
2. verified probe outcome
3. verified registry slot
4. deduped MacBook `vetted_exact`
5. deduped MacBook `vetted_normalized` as advisory candidate evidence only
6. all other sources as candidate evidence only

Important downgrade:

- `vetted_product_lineage` is candidate evidence only
- it is not live-safe
- `vetted_normalized` is also not live-safe in the first batch unless promoted by probe

## Required Scope Freeze

The next implementation batch should be MacBook-only.

Reasons:

- the live listing flow is MacBook-specific
- the current audit script is cross-category
- several non-Mac categories have weaker normalization and weaker proof value

So the resolver rollout should explicitly target:

- MacBook Air
- MacBook Pro

Everything else stays out of scope for the first resolver-safe batch.

## Proposed Solution

### 1. Build a canonical deduped MacBook resolver dataset

Do not use `data/vetted-listings.csv` directly in the live flow.

Instead build a canonical MacBook-only dataset with:

- one row per unique listing identity
- deduped locale expansion
- explicit trust class
- contradiction flags

For first live-safe use, only deduped MacBook `vetted_exact` rows should be eligible.

### 2. Harden probe mode

Upgrade `--probe-product-id` so it proves:

- candidate UUID preservation
- grade match
- RAM match
- SSD match
- colour match

Probe result must be machine-readable and binary:

- `pass`
- `fail`

Only passing probes should be promotable into resolver truth.
Probe results MUST NOT be persisted as resolver truth until this step is complete.

### 3. Add a resolver module

Extract resolution into a shared module that returns:

- ranked candidates
- trust verdicts
- contradiction flags
- reasons

Then let:

- dry-run
- probe
- live

consume that same module.

### 4. Reuse and extend the correction mechanism

The repo already has a partial correction mechanism via:

- `data/catalog-corrections.json`
- `scripts/build-listings-registry.js`

That should be extended, not bypassed.

Required additions:

- colour corrections
- UUID corrections
- probe-truth persistence
- contradiction quarantine

### 5. Move buy-box verification onto corrected resolver truth

This is a hard dependency, not a follow-up.

`scripts/buy-box-check.js` currently trusts raw `bm-catalog.json` for variant integrity and can auto-offline listings on that basis.

That means:

- even if listing creation starts using corrected resolver truth
- buy-box can still auto-offline valid listings later

So buy-box migration must happen before enabling new live resolver behavior.

## Resolver Status Model

Recommended statuses:

- `vetted_exact`
- `vetted_exact_with_no_current_contradiction`
- `probe_verified`
- `needs_probe`
- `catalog_conflict`
- `lineage_conflict`
- `grade_conflict`
- `no_exact_variant_found`
- `portal_required`
- `blocked_manual`

Policy:

- `vetted_exact_with_no_current_contradiction`: eligible for first scoped live use
- `probe_verified`: eligible for live use
- `vetted_product_lineage`: never live-safe by itself
- any contradiction: not live-safe

## Revised Build Order

1. Freeze scope to MacBooks and define one canonical resolver schema plus precedence.
2. Build a deduped MacBook-only resolver dataset from current audit evidence.
3. Harden probe mode so it proves candidate UUID preservation and colour/spec/grade.
4. Extract a shared resolver module for dry-run and probe first.
5. Persist verified outcomes into the canonical correction / probe-truth store.
6. Move `buy-box-check.js` to corrected resolver truth.
7. Enable live use for deduped MacBook `vetted_exact` only.
8. Add candidate-probe looping for unresolved cases.

## QA Focus

The most important QA questions now are:

1. Is the canonical resolver truth schema sufficient for both list creation and buy-box verification?
2. Is the precedence order unambiguous?
3. Does strict probe mode really prove UUID preservation and colour?
4. Is `vetted_exact` being limited to deduped MacBook rows with no current contradiction?
5. Are contradictory UUID / Back Market ID groups quarantined rather than corrected too aggressively?
6. Has `buy-box-check.js` stopped reading raw catalog truth directly for variant integrity?

## Relevant Files

- `analysis/bm-vetted-listings-audit.py`
- `data/vetted-listings-audit.json`
- `data/vetted-listings.csv`
- `scripts/list-device.js`
- `scripts/buy-box-check.js`
- `scripts/build-listings-registry.js`
- `data/bm-catalog.json`
- `data/product-id-lookup.json`
- `data/catalog-corrections.json`
- `docs/Backmarket Sales Data - Sheet1.csv`
- `docs/export_listings_57b75831-5e07-4f09-977b-1f216bc0f0a3.csv`

## Summary

The current issue is not just missing UUIDs. It is missing trust logic and shared resolver truth.

We now have a useful audit that separates:

- clean evidence
- normalized evidence
- product-lineage evidence
- contradictions

But the current outputs are not yet safe to wire directly into live listing behavior.

The correct next step is:

- build a canonical deduped MacBook resolver dataset
- harden probe mode
- unify resolver truth across listing creation and buy-box

Only after that should live resolver behavior change.

## Implementation Appendix

This appendix defines the minimum implementation detail that was missing from the earlier version of this spec.

### A. Canonical Resolver Store

Use `data/listings-registry.json` as the canonical resolver truth store.

Do not introduce a parallel resolver-truth file for the first implementation batch.

Use `data/catalog-corrections.json` as an upstream correction input only.
It should not be treated as the canonical live resolver store.

#### Why this choice

`listings-registry.json` already contains live-relevant verified slot data, including:

- `listing_id`
- `backmarket_id`
- `product_id`
- `requested_product_id`
- `sku`
- `grade`
- `model_family`
- `ram`
- `ssd`
- `colour`
- `verified`
- `issues`

That makes it the closest existing store to the required resolver truth model.

### B. Canonical Key and Dedupe Rules

#### Canonical resolver key

For MacBooks, the canonical resolver key should be:

- normalized SKU identity including grade

Example:

- `MBA.A2681.M2.8C.8GB.256GB.MIDNIGHT.GOOD`

This keeps the resolver aligned with how `list-device.js` already looks up `registry.slots[normalizedSku]`.

#### Key normalization rule

Resolver keys must be stored in uppercase.

That includes:

- model tokens
- chip tokens
- RAM / SSD tokens
- colour tokens
- grade tokens

Example:

- `MBA.A2681.M2.8C.8GB.256GB.MIDNIGHT.GOOD`

Existing mixed-case registry keys must be backfilled or re-keyed to the uppercase normalized form during migration.

#### Canonical row identity for export deduplication

When building MacBook audit inputs from the locale-expanded export, dedupe by:

- `Listing no.`

Reason:

- the current export has locale-expanded duplicate rows
- `Listing no.` is the stable seller listing identity
- the same listing can appear multiple times across locales, but it is still one listing

#### MacBook-only filter

First batch resolver material must include only rows whose title indicates:

- `MacBook Air`
- `MacBook Pro`

All other categories are out of scope.

### C. Canonical Resolver Entry Schema

Minimum required entry shape inside `data/listings-registry.json`:

```json
{
  "MBA.A2681.M2.8C.8GB.256GB.MIDNIGHT.GOOD": {
    "listing_id": 6711634,
    "backmarket_id": 761518,
    "product_id": "9b1ef69f-c204-4a9f-8b06-a4ec8e37b231",
    "requested_product_id": "9b1ef69f-c204-4a9f-8b06-a4ec8e37b231",
    "sku": "MBA.A2681.M2.8C.8GB.256GB.MIDNIGHT.GOOD",
    "grade": "GOOD",
    "model_family": "MacBook Air 13-inch (2022)",
    "ram": "8GB",
    "ssd": "256GB",
    "colour": "Midnight",
    "trust_class": "probe_verified",
    "source": "strict_probe",
    "verified": true,
    "last_verified_at": "2026-03-30T00:00:00Z",
    "contradiction_flags": [],
    "issues": []
  }
}
```

Required fields for first batch:

- `listing_id`
- `backmarket_id`
- `product_id`
- `requested_product_id`
- `sku`
- `grade`
- `model_family`
- `ram`
- `ssd`
- `colour`
- `trust_class`
- `source`
- `verified`
- `last_verified_at`
- `contradiction_flags`
- `issues`

Allowed first-batch `trust_class` values:

- `registry_verified`
- `vetted_exact_with_no_current_contradiction`
- `probe_verified`
- `blocked_manual`
- `catalog_conflict`
- `needs_probe`

Anything else remains advisory and must not be live-safe.

### D. Relationship to Existing Files

#### `data/listings-registry.json`

Role:

- canonical live resolver truth store
- existing verified slots must be backfilled during migration

Backfill rule for current verified slots:

- `trust_class: "registry_verified"`
- `source: "build-listings-registry"`
- `last_verified_at: created_at`
- `contradiction_flags: []`

If an existing slot is later found to conflict with stricter probe truth or corrected resolver evidence, that slot must be updated rather than copied into a parallel store.

#### `data/catalog-corrections.json`

Role:

- correction input
- manual overrides
- contradiction quarantine directives

Not the canonical lookup store.

#### `data/vetted-listings-audit.json`

Role:

- audit evidence
- reporting
- candidate generation

Not live resolver truth.

#### `data/vetted-listings.csv`

Role:

- human-readable evidence extract

Not resolver-ready and must not be consumed directly by live code.

### E. Probe Promotion Gate

No probe result may be written into canonical resolver truth unless all of the following are true:

1. returned `listing.product_id === candidate_product_id`
2. returned grade matches expected grade
3. returned RAM matches expected RAM
4. returned SSD matches expected SSD
5. returned colour matches expected colour
6. the probe report explicitly records `pass: true`

If any of the above fail:

- do not promote the result
- leave the listing offline
- store the failure only as advisory evidence or manual-review evidence

#### Transition rule

Pre-hardening probe results are not promotable.

That means any probe output generated before strict colour and UUID preservation checks are implemented must not be written into `listings-registry.json` as verified truth.

### F. buy-box-check.js Migration

This is a required dependency before enabling new live resolver behavior.

#### Current problem

`buy-box-check.js` currently:

- reads `bm-catalog.json` directly
- uses it for variant integrity
- auto-offlines listings on mismatch

That is unsafe once corrected resolver truth diverges from raw catalog truth.

#### Required migration plan

1. Add a resolver reader used by both `list-device.js` and `buy-box-check.js`.
2. Change `assessVariantIntegrity()` to read canonical resolver truth first.
3. If canonical resolver truth exists for a listing SKU or product identity:
   - use resolver truth as the authoritative source
   - do not fall back to raw `bm-catalog.json` for colour/spec validation
4. If canonical resolver truth does not exist:
   - classify the listing as `unmanaged` or `advisory_only`
   - do not auto-offline based solely on raw catalog colour/spec mismatch
   - allow alerting, but not destructive mutation
5. Only after this migration is complete may live resolver behavior in `list-device.js` be expanded.

#### First-batch safe policy

- managed listings: enforce resolver truth
- unmanaged listings: alert only, no auto-offline from raw catalog contradiction

Important implementation note:

- the resolver lookup must happen before any `bm-catalog.json` gatekeeping
- "product_id not found in catalog" is not a critical failure if canonical resolver truth exists for that listing
- do not add resolver checks after the current raw catalog early-return path; replace that control flow

### G. Existing Registry vs Audit Reconciliation

The current repo already has:

- `261` verified slots in `data/listings-registry.json`
- `262` unique MacBook listing numbers in the audit evidence

The canonical seed order should be:

1. existing verified registry slots
2. deduped MacBook `vetted_exact` audit rows
3. strict probe-verified outcomes

If audit evidence conflicts with an existing verified registry slot:

- registry wins until a strict probe disproves it
- the conflicting audit row is marked advisory or conflicting, not authoritative

### H. First Batch Live Eligibility

For the first implementation batch, the only live-safe classes are:

- `registry_verified`
- `probe_verified`
- deduped MacBook `vetted_exact_with_no_current_contradiction`

Not live-safe in first batch:

- `vetted_normalized`
- `vetted_product_lineage`
- raw audit-only evidence
- raw storefront-only evidence
