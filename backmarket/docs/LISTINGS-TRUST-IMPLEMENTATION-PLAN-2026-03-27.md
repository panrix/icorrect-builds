# Listings Trust Implementation Plan

**Date:** 27 Mar 2026  
**Purpose:** Concrete worklist for fixing BM listing trust end-to-end so devices can be safely listed without model/spec/grade/colour mistakes.

Authoritative flow note:
- The active SOP 06 implementation is `/home/ricky/builds/bm-scripts/list-device.js`.
- `/home/ricky/builds/backmarket/scripts/list-device.js` is stale and should be treated as do-not-run for trust work.
- `/home/ricky/builds/backmarket/scripts/reconcile-listings.js` is a separate implementation from the `bm-scripts` ecosystem and is not covered by the current SOP 06 hardening unless stated explicitly.

---

## Goal

Make BM listing execution trustworthy enough that:

- the wrong model is not listed
- the wrong spec is not listed
- the wrong grade is not listed
- the wrong colour is not listed
- pricing/P&L is calculated from the correct BM product context

This plan is about fixing the pipeline permanently, not just getting a few listings live.

---

## Definition Of Done

The listings system is only considered fixed when all of the following are true:

1. Every device is classified as:
   - safe to list
   - manual review
   - blocked
2. No live listing can be created from an ambiguous `product_id` match.
3. Post-listing verification checks:
   - product_id
   - grade
   - RAM
   - SSD
   - colour
4. Monday is only updated after verification succeeds.
5. The system can safely process a controlled batch of 20 devices without spec drift.
6. The logic is documented and committed, not only present in untracked local files.

---

## Priority Order

1. Lock down live execution safety.
2. Build trusted product matching.
3. Build conservative classification.
4. Validate on a small safe batch.
5. Expand to the full target set.

---

## Workstreams

### Workstream 1: Freeze unsafe listing execution

**Objective:** Make sure uncertain matches cannot go live.

Tasks:

- [x] Confirm live listing execution is blocked unless product resolution is exact enough.
- [x] Remove or disable any path that can bypass uncertainty checks.
- [x] Ensure failed post-listing verification blocks Monday writeback.
- [x] Ensure no “force live” mode can override ambiguous product resolution.
- [x] Block `--live` without `--item` so mass relisting cannot happen accidentally.

Current note:
- Current hardening is on disk in `bm-scripts`, but ownership is still split across `backmarket/scripts` and `bm-scripts`.
- Code QA should review the active flow in `bm-scripts`, not just the older handoff narrative.
- `--force-live` still exists as a parsed CLI flag, but the current execution path no longer allows it to bypass trust gating.

---

### Workstream 2: Trusted product resolution

**Objective:** Resolve the correct BM `product_id` from trustworthy sources only.

Tasks:

- [ ] Define the approved source-of-truth order for product resolution.
- [ ] Use verified BM lookup/catalog title as primary external truth.
- [ ] Use internal lookup table only where it is known-good.
- [ ] Reject ambiguous multi-match lookup results.
- [~] Record resolution source for every device:
  - exact lookup match
  - exact colour match
  - Intel exact table match
  - manual review
- [ ] Do not allow fuzzy “best effort” product selection for live execution.

Current note:
- lookup-table resolution now records a `resolutionSource`
- single lookup matches without independent colour proof are no longer treated as automatically live-safe
- Intel coverage is still incomplete for the current 20-device target set

Output:
- per-device `product_id`
- resolution source
- confidence level

---

### Workstream 3: Exact variant verification

**Objective:** Prove the BM product variant matches the actual device.

Tasks:

- [ ] Verify model family is correct.
- [ ] Verify RAM is correct.
- [ ] Verify SSD is correct.
- [ ] Verify grade is correct.
- [ ] Verify colour is correct.
- [ ] Verify chip / CPU-GPU variant where applicable.
- [ ] Define what BM title checks are acceptable vs insufficient.

Current note:
- post-list verification already checks `product_id`, grade, RAM, and SSD
- colour verification is still the main remaining weak point in live eligibility
- lookup-title colour proof now contributes to trust gating, but does not yet cover the whole estate
- colour is still a documented requirement but is not yet fully enforced in `verifyListing()`

Important:
- Title parsing alone is not enough.
- BM picker/catalog/lookup data should carry more weight than human-readable title text.

---

### Workstream 4: Conservative estate-wide classifier

**Objective:** Stop pretending uncertain devices are “close enough”.

Tasks:

- [~] Redesign the estate audit to produce:
  - safe to list
  - manual review
  - blocked
- [ ] Use verified lookup title when available.
- [ ] Treat missing verified lookup truth as manual review, not auto-mismatch.
- [ ] Separate formatting-only issues from actual product/spec mismatch.
- [ ] Record why each device/listing was classified that way.

Current note:
- the audit script now emits `safe_manual`, `manual_review`, and `blocked`
- this is an improvement for Code QA and review, but it is not yet enough to approve the 20-device relist set

Output per device:
- classification
- reason
- required next action

---

### Workstream 5: First controlled relist batch

**Objective:** Prove the system on a small set before scaling.

Tasks:

- [ ] Select a small safe batch with unambiguous resolution.
- [ ] Run the real listing SOP path device-by-device.
- [ ] Re-fetch every created/reactivated listing.
- [ ] Verify product_id/spec/grade/colour before Monday update.
- [ ] Produce a closeout report for the batch.

Success criteria:
- zero verification failures
- zero wrong BM variants
- zero Monday linkage drift

---

### Workstream 6: Scale to the 20-device set

**Objective:** Expand only after the safe batch proves the pipeline.

Tasks:

- [ ] Classify the 20 devices.
- [ ] Split them into:
  - safe to list now
  - manual review
  - blocked
- [ ] List only the safe subset first.
- [ ] Resolve manual-review devices individually.
- [ ] Keep blocked devices offline until upstream data is fixed.

---

## Tracking Table

Use this table operationally.

| Area | Status | Notes |
|------|--------|-------|
| Live execution safety | Substantially hardened | Single-item live only; Monday update remains post-verification |
| Trusted `product_id` resolution | Not complete | Main blocker; Intel and colour-backed exactness still incomplete |
| Variant verification | Not complete | Colour confidence still insufficient for broad live use |
| Estate-wide classifier | In progress | Conservative buckets added, but target-set proof still incomplete |
| Safe first relist batch | Not started | Should happen before broader relist |
| 20-device rollout | Blocked | Depends on all items above |

---

## Device Acceptance Checklist

A device is only `safe to list` when all are true:

- [ ] Main Board Final Grade is present
- [ ] BM Device linkage exists
- [ ] model identity is confirmed
- [ ] RAM is confirmed
- [ ] SSD is confirmed
- [ ] colour is confirmed
- [ ] grade mapping is confirmed
- [ ] `product_id` resolution is exact enough
- [ ] post-list verification passes
- [ ] Monday writeback occurs only after verification

If any box is unchecked:
- `manual review` or `blocked`

---

## What Not To Do

- Do not mass-list the 20 just because BM currently has zero live stock.
- Do not treat fuzzy title parsing as source-of-truth.
- Do not let a guessed `product_id` go live.
- Do not update Monday before verification passes.
- Do not use V6 alone as spec truth.

---

## Immediate Next Actions

1. Decide which repo/path owns the authoritative listing flow.
   Current risk:
   - relevant logic is split across `backmarket/scripts` and `bm-scripts`

Current answer:
- `bm-scripts` owns the active SOP 06 listing flow today
- `backmarket/scripts` contains stale or parallel copies that must not be assumed authoritative

2. Move the current `bm-scripts` hardening into durable tracked history suitable for Code QA.

3. Finish the classifier so the actual 20-device `To List` set is split into:
   - `safe_manual`
   - `manual_review`
   - `blocked`

4. Expand trusted Intel and colour-backed product resolution for the current blocked/manual-review devices.

5. Decide whether the second `backmarket/data/product-id-lookup.json` copy should be removed or explicitly marked non-canonical.

6. Only after that, define and test a first safe relist batch.
