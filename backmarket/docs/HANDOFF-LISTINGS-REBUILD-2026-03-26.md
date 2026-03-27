# Listings Rebuild Handoff

**Date:** 2026-03-26
**Purpose:** Brief the main Codex agent on the current state of the listings rebuild work, what was actually completed, and what should happen next.

Update note:
- This handoff started on March 26, 2026 and now includes March 27, 2026 trust-hardening notes. Treat it as a living handoff, not a pure March 26 snapshot.

---

## Summary

The task started as a QA review of `listings-rebuild-task.md`, then shifted into execution work.

The scope changed mid-run:
- first to a reset of the 5 currently live BM listings
- then back to the wider goal of remaking listings with congruent data across the full BM estate

The important conclusion is:

**Do not start mass rebuilding listings from the current audit output yet.**

The current full-estate classifier is still too weak to use as rebuild truth. The next correct step is to improve the classification/audit layer so rebuild decisions are driven by verified BM product/title data, not by V6 assumptions or incomplete title parsing.

---

## What Was Completed

### 1. Live reset work was executed

The 5 live BM listings were taken offline successfully on March 26, 2026:
- `6675379`
- `6558670`
- `6505341`
- `5860258`
- `4952313`

Result:
- all 5 were confirmed with `quantity_after: 0`
- all 5 ended in `pub_state: 3`

Reference:
- `/home/ricky/builds/backmarket/audit/listings-reset-offline-2026-03-26T08-18-10-222Z.json`

### 2. Stale BM Device listing links were cleared

These 7 BM Device rows had `text_mkyd4bx3` cleared:
- `10667830706` `BM 1125`
- `11150464720` `BM 1353`
- `11212765612` `BM 1400`
- `11322620686` `BM 1465`
- `11347682210` `BM 1486`
- `11486670010` `BM 1540`
- `11562931942` `BM 611 RTN`

Verified:
- all 7 now have blank `text_mkyd4bx3`

Reference:
- `/home/ricky/builds/backmarket/audit/listings-reset-clear-links-2026-03-26T08-24-32-341Z.json`

### 3. Snapshot of the reset set was saved

This snapshot records:
- the 5 live listings that were offlined
- the 7 affected BM Device rows
- the 7 linked Main Board items

Reference:
- `/home/ricky/builds/backmarket/audit/listings-reset-snapshot-2026-03-26T08-16-40-023Z.json`

### 4. Full-estate audit was run

Audit output files:
- `/home/ricky/builds/backmarket/audit/full-listings-audit-2026-03-26.json`
- `/home/ricky/builds/backmarket/audit/full-listings-audit-2026-03-26-v2.json`
- `/home/ricky/builds/backmarket/audit/full-listings-audit-2026-03-26-v3.json`

Latest output (`v3`) summary:
- total listings: `828`
- SKU mismatches: `341`
- unparseable titles: `487`
- product IDs in lookup: `279`
- product IDs in listings: `277`

This confirms the parser/audit logic is not yet good enough to drive a safe estate-wide rebuild.

---

## What Was Learned

### 1. V6 should not be treated as source-of-truth for rebuild classification

The user explicitly clarified that V6 data is not 100% correct.

For rebuild purposes:
- BM `product_id`
- verified lookup data
- BM title returned by the catalogue
- and the listing SOP flow

are more trustworthy than V6 for spec correctness.

V6 should be treated as optional pricing context, not authoritative spec truth.

### 2. Relisting must go through the real listing SOP path

The user explicitly wants relisting to go through the normal listing process so:
- product resolution is checked properly
- profitability/P&L is calculated
- the BM Device P&L path is respected

This means any rebuild tooling should use the listing flow, not a shortcut that bypasses profitability checks.

### 3. The current whole-estate audit is not rebuild-safe yet

Even after fixing the lookup-table path, the audit still reports:
- `0` matches
- `341` mismatches
- `487` unparseable

That is not credible enough to use as rebuild truth.

The current parser is too incomplete, especially for:
- older Intel models
- Retina-era titles
- some variant handling
- colour handling
- cases where the correct spec should be inferred from verified lookup title rather than listing title

---

## Code Changes Made

### 1. Added reset helper script

Created:
- [`/home/ricky/builds/backmarket/scripts/reset-live-listings.js`](/home/ricky/builds/backmarket/scripts/reset-live-listings.js)

Purpose:
- snapshot live listings + linked BM Device rows
- offline live BM listings
- clear stale BM Device listing IDs

Important:
- this script was patched so it no longer changes Main Board `status24`
- status changes were intentionally left manual

### 2. Patched active listing flow in `bm-scripts`

Modified:
- [`/home/ricky/builds/bm-scripts/list-device.js`](/home/ricky/builds/bm-scripts/list-device.js)

Changes:
- strengthened verification call to include:
- expected `grade`
- expected `ram`
- expected `ssd`

Reason:
- current SOP flow otherwise stops at `PROPOSE`
- user wants rebuilds to go through the real listing/P&L path

### 4. March 27 trust hardening update

Modified:
- [`/home/ricky/builds/bm-scripts/list-device.js`](/home/ricky/builds/bm-scripts/list-device.js)
- [`/home/ricky/builds/bm-scripts/listings-audit.js`](/home/ricky/builds/bm-scripts/listings-audit.js)

Changes:
- blocked `--live` without `--item` so mass relisting cannot happen accidentally
- neutralized the practical `--force-live` bypass by requiring exact resolution and single-item live execution
- moved SKU writeback into the post-verification Monday update path
- tightened lookup-table live eligibility so single lookup matches without independent colour proof are not auto-live-safe
- added explicit trust/classification buckets closer to:
  - `safe_manual`
  - `manual_review`
  - `blocked`
- fixed the audit script bug where `correctSku` was used before declaration

Operational meaning:
- live execution safety is materially better
- trusted `product_id` resolution is still the main blocker
- the current 20-device `To List` set is still not approved for batch relisting

Important remaining gap:
- colour is still required by policy, but not yet fully checked in post-list verification code

### 3. Patched full audit script

Modified:
- [`/home/ricky/builds/bm-scripts/listings-audit.js`](/home/ricky/builds/bm-scripts/listings-audit.js)

Changes:
- fixed the lookup-table path to `bm-scripts/data/product-id-lookup.json`
- added support for using verified lookup title when available

Important:
- despite these fixes, the audit output is still not strong enough for safe mass rebuild execution

---

## Current Operational State

As of this handoff:
- the previously live 5 BM listings are offline
- the 7 affected BM Device rows have no stored listing ID
- the user manually changed the relevant items in `BMs Awaiting Sale` to `To List`

This means the small live reset is complete enough that the system is not actively pointing those devices at stale live listings.

---

## Recommended Next Step

The next agent should **not** immediately relist all `To List` items or mass-remake listings from the current audit.

The next correct step is:

### Phase A: Fix classification quality

Build a stronger estate-wide classifier that determines congruent listing truth from:
- BM `product_id`
- `bm-scripts/data/product-id-lookup.json`
- verified lookup title
- BM listing title
- SKU only as a signal, not as source-of-truth

Goal:
- classify listings into:
- congruent
- SKU-only formatting issue
- likely wrong/misleading SKU
- likely wrong product/spec/grade linkage
- manual review required

### Phase B: Define rebuild target set

Only after classification is credible:
- decide which listings actually need to be remade
- decide which are only naming-normalization problems
- decide which are too ambiguous and need manual review
- keep mass live execution disabled; any safe execution should remain single-device only

### Phase C: Rebuild through the listing SOP path

When rebuild execution starts:
- use the real listing flow with profitability checks
- do not trust V6 as spec truth
- use verified product lookup and BM title verification
- update Monday linkage safely after verification

---

## What The Main Agent Should Watch For

1. The repo has two copies of some scripts:
- `backmarket/scripts/...`
- `bm-scripts/...`

The active self-contained flow with its helper libs currently lives in:
- `/home/ricky/builds/bm-scripts`

Treat these as stale or parallel unless explicitly reviewed:
- `/home/ricky/builds/backmarket/scripts/list-device.js`
- `/home/ricky/builds/backmarket/scripts/reconcile-listings.js`

Canonical lookup file for the active flow:
- `/home/ricky/builds/bm-scripts/data/product-id-lookup.json`

2. The reset work already mutated live data.

Do not assume the 5 live listings are still active.

3. The user explicitly rejected the idea that the task is only about the 5-7 live listings.

The strategic goal is still:
- remake listings so data is congruent
- and do so through the listing/P&L flow

4. The current audit output is still not safe enough to automate rebuild from directly.

Treat the audit outputs as diagnostic only until classification quality is improved.

5. A sampled March 27 dry run confirmed both kinds of remaining blockers:
- at least one target device hard-blocks on missing trusted Intel resolution
- at least one target device resolves only to `lookup-exact-single`, which is still manual review until colour is independently verified

---

## Key Files

- [`/home/ricky/builds/backmarket/listings-rebuild-task.md`](/home/ricky/builds/backmarket/listings-rebuild-task.md)
- [`/home/ricky/builds/backmarket/scripts/reset-live-listings.js`](/home/ricky/builds/backmarket/scripts/reset-live-listings.js)
- [`/home/ricky/builds/bm-scripts/list-device.js`](/home/ricky/builds/bm-scripts/list-device.js)
- [`/home/ricky/builds/bm-scripts/listings-audit.js`](/home/ricky/builds/bm-scripts/listings-audit.js)
- [`/home/ricky/builds/bm-scripts/data/product-id-lookup.json`](/home/ricky/builds/bm-scripts/data/product-id-lookup.json)
- [`/home/ricky/builds/backmarket/knowledge/bm-product-ids.md`](/home/ricky/builds/backmarket/knowledge/bm-product-ids.md)
- [`/home/ricky/builds/backmarket/audit/listings-reset-snapshot-2026-03-26T08-16-40-023Z.json`](/home/ricky/builds/backmarket/audit/listings-reset-snapshot-2026-03-26T08-16-40-023Z.json)
- [`/home/ricky/builds/backmarket/audit/listings-reset-offline-2026-03-26T08-18-10-222Z.json`](/home/ricky/builds/backmarket/audit/listings-reset-offline-2026-03-26T08-18-10-222Z.json)
- [`/home/ricky/builds/backmarket/audit/listings-reset-clear-links-2026-03-26T08-24-32-341Z.json`](/home/ricky/builds/backmarket/audit/listings-reset-clear-links-2026-03-26T08-24-32-341Z.json)
- [`/home/ricky/builds/backmarket/audit/full-listings-audit-2026-03-26-v3.json`](/home/ricky/builds/backmarket/audit/full-listings-audit-2026-03-26-v3.json)
