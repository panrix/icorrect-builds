# Listing SOP Coverage

**Date:** 27 Mar 2026  
**Purpose:** Record what already exists in the BM listing SOP flow, what is still missing, and what must be true before devices can be safely relisted to Back Market.

Authoritative flow note:
- The active SOP 06 implementation is `/home/ricky/builds/bm-scripts/list-device.js`.
- `/home/ricky/builds/backmarket/scripts/list-device.js` is a stale copy and should not be used for current trust work or live execution.
- The canonical lookup file for the active flow is `/home/ricky/builds/bm-scripts/data/product-id-lookup.json`.

---

## Current Status

The pricing and P&L parts of the listing SOP already exist in code.

The rebuild is **not** blocked by missing pricing logic.

The rebuild **is** blocked by trust in product matching:
- exact `product_id`
- exact model/spec family
- exact grade
- exact colour

Until those are verified reliably, mass relisting is not safe.

---

## What Already Exists

### 1. Live market pricing input

The active listing flow in:

- [`/home/ricky/builds/bm-scripts/list-device.js`](/home/ricky/builds/bm-scripts/list-device.js)

already reads live BM market signals, including:

- BM listing/backbox pricing context
- existing listing slot data
- historical completed-order sales

### 2. P&L engine

The listing flow already calculates:

- purchase price
- parts cost
- labour cost / labour hours
- shipping
- BM buy fee
- BM sell fee
- VAT
- break-even
- proposed price
- minimum price
- net profit
- margin

### 3. Listing execution flow

The flow already supports:

- searching for an existing listing slot
- reactivating an existing listing
- increasing quantity on an active listing
- creating a new listing when no slot exists
- post-listing verification
- Monday writeback after listing

Recent hardening now also enforces:

- live execution requires `--item`; mass live execution is blocked
- Monday writeback only happens after verification succeeds
- SKU writeback is delayed until the verified-success path
- lookup-only `product_id` matches are not automatically live-eligible unless colour is independently verified
- `--force-live` is still parsed by the script but no longer provides a practical bypass of the trust gates

### 4. Profitability decision gate

The flow already produces a decision outcome such as:

- `BLOCK`
- `PROPOSE`
- `AUTO-LIST` (designed for, though currently constrained by trust issues)

---

## What Is Still Missing

### 1. Trusted `product_id` resolution

This is the main blocker.

The system must be able to prove that the resolved BM `product_id` belongs to the exact intended device/spec family, not just something close.

Unsafe inputs include:

- fuzzy title parsing
- V6 alone
- SKU alone
- “closest match” lookup behavior

### 2. Exact variant verification

Before a listing can go live, the system must verify:

- model identity
- RAM
- SSD
- grade
- colour

Current logic is directionally useful, but not yet strong enough across the whole estate to guarantee every listing is the exact correct BM variant.

Important current gap:
- post-list verification still checks `product_id`, grade, RAM, and SSD, but does not yet fully verify colour in code

### 3. Conservative estate-wide classifier

Before relisting 20+ devices, the system needs a classifier that marks each candidate as:

- safe to list
- manual review
- blocked

This classifier must use verified BM/lookup data, not weak title assumptions.

Current note:
- the active listing flow now emits an internal trust classification closer to:
  - `safe_manual`
  - `manual_review`
  - `blocked`
- the audit script now also emits conservative `safe_manual` / `manual_review` / `blocked` buckets for existing listings

### 4. Safe scaling beyond a few manually reviewed devices

The current flow is much closer to being usable for a small, tightly reviewed batch than for the full 20-device rebuild.

The main gap is confidence at scale.

### 5. Durable tracked history for current safety hardening

Some current listings safety hardening has been applied on disk in `bm-scripts`, but not all of it is formalized in tracked repo history.

That means operational knowledge currently exceeds recorded repo state.

### 6. Duplicate script areas still create operator risk

There are parallel files in:

- `/home/ricky/builds/backmarket/scripts`
- `/home/ricky/builds/bm-scripts`

For SOP 06 trust work, only `bm-scripts` should be treated as authoritative until ownership is collapsed.

---

## What Must Be True Before Relisting

For each device, all of the following must be true before live listing is allowed:

1. Model identity is confirmed.
2. RAM matches.
3. SSD matches.
4. Colour matches.
5. Final Grade is present and maps correctly to BM grade.
6. Resolved `product_id` is exact enough to trust.
7. Post-create/reactivate verification also passes.

If any of those fail, the device must remain offline and go to manual review.

---

## Required Next Work

### Phase 1: Finalize exact-match product resolution

Build or refine a resolution layer that:

- starts from trusted device facts from Monday / BM Devices
- resolves BM `product_id` from verified lookup/catalog data
- blocks on ambiguity instead of guessing

### Phase 2: Strengthen colour/spec verification

The verification layer must confirm:

- correct BM variant family
- correct RAM
- correct SSD
- correct grade
- correct colour

### Phase 3: Build a conservative classifier

Every candidate should be classified into:

- safe to list
- manual review
- blocked

Only the `safe to list` subset should be eligible for live execution.

### Phase 4: Use the real SOP path for the safe subset

Once the safe subset is defined:

- relist device-by-device through the real listing flow
- require explicit `--item` per device for any live execution
- re-fetch the live BM listing after creation/reactivation
- verify `product_id`, grade, RAM, SSD, and colour
- only then update Monday

### Phase 5: Expand gradually

Do not move straight from “0 live listings” to “mass relist all 20”.

Run a small safe batch first, verify it, then expand.

---

## Bottom Line

- The pricing/P&L part of the SOP already exists.
- The current blocker is not pricing logic.
- The blocker is trust in exact product/spec/grade/colour matching.
- Live execution safety is now tighter, but trusted product resolution is still incomplete.
- Do not mass-list the 20 devices until the classifier can prove exact-enough matches for live execution.
- As of March 27, 2026, a first safe batch is still not defined.
