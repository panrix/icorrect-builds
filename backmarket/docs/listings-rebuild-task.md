# Task: Reset Live BM Listing Linkage And Relist Cleanly

**For:** Codex
**Priority:** Today
**Repo:** panrix/icorrect-builds

---

## Objective

Fix BM listing mismatches by:
- taking the currently live BM listings offline
- clearing stale listing linkage from BM Devices rows
- relisting each affected device from source-of-truth specs

This is a controlled reset of the live set, not a bulk rebuild of every BM listing.

---

## Why this approach

We only have 5 BM listings currently live with stock. That makes a reset safer than trying to preserve or migrate broken live listing references.

Current problems include:
- SKU does not reliably match title/spec/grade/colour
- some listing references on Monday may point at stale or wrong BM listings
- preserving broken listing linkage creates more risk than recreating the live device mappings

Today’s goal is to end with:
- no stale live listing references on BM Devices
- each active device linked to a verified BM listing
- SKU, title/spec, grade, and colour aligned

---

## Scope for today

Included:
- the 5 BM listings currently live with qty > 0
- every BM Device row linked to those live listings
- relisting of those affected devices only

Not included:
- mass rebuild of all 831 BM listings
- deleting old BM listings
- cosmetic cleanup of inactive historical listings unless needed later

---

## Source of truth

### BM Devices Board (3892194968)
Use for:
- linked Main Board item via `board_relation`
- current listing_id via `text_mkyd4bx3`
- stored product UUID via `text_mm1dt53s`
- SKU via `text89`
- RAM via `status__1`
- SSD via `color2`
- CPU via `status7__1`
- GPU via `status8__1`
- purchase price via `numeric`

### Main Board (349212843)
Use for:
- Final Grade via `status_2_Mjj4GJNQ`
- Colour via `status8`
- listing workflow state via `status24`
- parts/labour data needed by listing flow

### Product_id sources
Lookup order remains:
1. `backmarket/data/product-id-lookup.json`
2. V6 scraper data
3. Intel hardcoded lookup in `scripts/list-device.js`

### Existing guarded flow
Primary script:
- `backmarket/scripts/list-device.js`

Verification script:
- `backmarket/scripts/reconcile-listings.js`

---

## Maintenance window

This work should be done inside a maintenance window today, March 26, 2026.

Before any BM or Monday mutations:
- pause listing automation
- pause reconciliation automation
- pause buy box / repricing automation
- avoid manual BM listing edits outside this task

Do not resume automation until post-reset reconciliation passes.

---

## Hard gates

1. Do not delete old BM listings.
2. Do not leave any listing live while its Monday linkage is being reset.
3. Do not clear device spec data from BM Devices.
4. Do not relist a device unless Final Grade is present.
5. Do not relist a device unless RAM, SSD, colour, and model identity are readable.
6. Do not raise BM qty on a recreated listing until verification passes.
7. Any device that fails product_id resolution or spec verification goes to manual review and stays offline.

---

## Fields we WILL clear

On affected BM Devices items only:
- `text_mkyd4bx3` (stored listing_id)

Clear `text_mm1dt53s` only if the stored UUID is known to be stale or contradictory to the relisting result. Do not bulk-clear it by default.

---

## Fields we will NOT clear

Do not wipe:
- `board_relation`
- RAM / SSD / CPU / GPU columns
- purchase price
- cost fields
- SKU history unless intentionally replaced by the new canonical SKU
- Main Board repair / ops data

---

## Execution plan

### Phase 1: Freeze and snapshot

1. Confirm automation is paused.
2. Export the 5 currently live BM listings:
   - `listing_id`
   - `sku`
   - `title`
   - `grade`
   - `product_id`
   - `quantity`
   - `price`
   - `backmarket_id`
3. Export all BM Devices rows pointing at those live listing IDs:
   - BM Device item ID
   - linked Main Board item ID
   - stored listing ID
   - stored UUID
   - SKU
   - RAM / SSD / CPU / GPU
4. Save this as the rollback snapshot for today.

Output:
- list of the 5 live listing IDs
- list of all affected BM Device item IDs

### Phase 2: Take live BM listings offline

For each of the 5 live BM listings:
1. POST update with `quantity: 0`
2. verify listing now shows qty `0`

Do not proceed to Monday cleanup until all 5 are confirmed offline.

Output:
- zero live listings remaining from the affected set

### Phase 3: Reset stale BM linkage on Monday

For each affected BM Device row:
1. clear `text_mkyd4bx3`
2. keep `text_mm1dt53s` unless it is known-bad
3. keep BM spec columns intact
4. move the linked Main Board item back into the relisting queue state if needed so it does not appear as actively listed during the reset

Goal:
- no affected BM Device item should still point at an old live listing ID

### Phase 4: Preflight each device

For each affected device:
1. confirm linked BM Device row exists
2. confirm linked Main Board row exists
3. read Final Grade
4. read RAM / SSD / CPU / GPU / colour / model
5. construct canonical SKU
6. resolve product_id from approved lookup order
7. if any of the above fail, stop that device and add it to manual review

Output per device:
- `ready to relist`
- or `blocked for manual review`

### Phase 5: Relist device-by-device

For each `ready to relist` device:
1. use the guarded listing flow in `scripts/list-device.js`
2. create or reactivate the correct listing based on verified product_id + grade
3. verify resulting listing:
   - title contains correct RAM
   - title contains correct SSD
   - title matches expected chip / CPU-GPU variant where relevant
   - grade matches expected BM grade
   - listing is the intended live slot
4. write back to Monday:
   - new `text_mkyd4bx3`
   - verified SKU in `text89`
   - UUID if the flow updates it
5. only then allow qty to remain live

Important:
- relist per device, not per old listing
- no bulk qty transfer from an old listing to a new listing

### Phase 6: Post-reset verification

After all ready devices are relisted:
1. run reconciliation
2. confirm:
   - no affected Main Board item claims listed state without BM linkage
   - no affected BM listing is active without a matching BM Device row
   - no qty mismatch exists in the rebuilt set
   - no spec mismatch exists in the rebuilt set
3. produce a short closeout report:
   - old listing IDs taken offline
   - new listing IDs created/reused
   - devices successfully relisted
   - devices blocked for manual review

### Phase 7: Resume automation

Only after Phase 6 passes:
1. resume reconciliation
2. resume buy box / repricing
3. resume listing automation

---

## Same-day task checklist

### Task A: Identify the live set
- query BM listings API
- isolate listings with `quantity > 0`
- confirm count is 5
- map those listing IDs to BM Devices rows

### Task B: Snapshot before change
- save BM listing snapshot
- save BM Devices snapshot
- save linked Main Board item IDs

### Task C: Offline all 5 live listings
- set qty to `0`
- verify all 5 are offline

### Task D: Remove stale listing IDs from affected BM Devices rows
- clear `text_mkyd4bx3`
- preserve all spec fields

### Task E: Reset affected items into relisting state
- ensure they are not treated as active listings during the reset

### Task F: Relist all clean devices
- run guarded per-device flow
- verify each new listing before accepting it

### Task G: Reconcile and close
- run reconciliation
- review failures
- resume automation only if clean

---

## Full TODO

### 0. Pre-run setup
- confirm this is being executed during today’s maintenance window
- confirm no one else is editing BM listings manually
- confirm access to BM API, Monday API, and required env vars
- confirm `scripts/list-device.js` and `scripts/reconcile-listings.js` are the scripts to use

### 1. Freeze automations
- pause listing automation
- pause reconciliation automation
- pause buy box / repricing automation
- note the exact time automation was paused
- confirm no cron or tmux process is still mutating BM listings

### 2. Identify the 5 live listings
- fetch all BM listings
- filter to listings with `quantity > 0`
- confirm the live count is 5
- capture for each live listing:
- `listing_id`
- BM UUID / `id`
- `sku`
- `title`
- `grade`
- `product_id`
- `quantity`
- `price`
- `backmarket_id`
- save this as the live-listing snapshot

### 3. Map live listings to BM Devices items
- query BM Devices board for rows where `text_mkyd4bx3` matches one of the 5 live listing IDs
- capture for each affected BM Device row:
- BM Device item ID
- item name
- `board_relation`
- linked Main Board item ID
- `text_mkyd4bx3`
- `text_mm1dt53s`
- `text89`
- RAM / SSD / CPU / GPU values
- purchase price
- total fixed cost
- save this as the BM Devices snapshot

### 4. Map affected BM Devices to Main Board items
- fetch each linked Main Board item
- capture:
- item ID
- item name
- `status24`
- `status_2_Mjj4GJNQ`
- `status8`
- parts / labour columns needed by listing flow
- save this as the Main Board snapshot

### 5. Validate the working set before mutation
- confirm every live listing is represented in the snapshot
- confirm every affected BM Device row has a linked Main Board item
- confirm there are no duplicate BM Device rows pointing at the same physical device unexpectedly
- confirm there are no affected rows missing critical specs before starting
- create a manual-review list for anything already incomplete

### 6. Take all 5 live listings offline
- for each of the 5 live BM listings, POST `quantity: 0`
- re-fetch each listing after the POST
- confirm every listing now shows `quantity = 0`
- if any listing remains live, stop and resolve that before touching Monday

### 7. Reset stale listing linkage on BM Devices
- for each affected BM Device row, clear `text_mkyd4bx3`
- keep `text_mm1dt53s` unless it is clearly stale or contradictory
- do not change board relation
- do not change RAM / SSD / CPU / GPU fields
- do not change purchase price or fixed cost fields
- record which BM Device rows were reset

### 8. Reset workflow state on Main Board
- for each affected linked Main Board item, move it out of any state that implies actively listed stock
- place it into the relisting queue state used for SOP 06 if needed
- record original `status24` and new `status24`
- confirm the affected set will not be treated as live during the rebuild

### 9. Preflight each affected device
- for each affected BM Device/Main Board pair:
- confirm Final Grade is present
- confirm colour is present
- confirm RAM is present
- confirm SSD is present
- confirm model identity is readable
- confirm CPU/GPU data is present where required for shared model families
- construct the canonical SKU
- resolve product_id using lookup table, V6 data, then Intel fallback if needed
- mark device as either:
- `ready to relist`
- `blocked for manual review`
- keep a running blocked list with the exact reason

### 10. Review blocked devices before relisting
- if any device is blocked due to missing grade, missing specs, or unresolved product_id, do not force it through
- leave blocked devices offline
- keep them on a manual-review list for after the rebuild

### 11. Relist ready devices one by one
- for each ready device:
- run the guarded listing flow
- let the flow construct SKU from current specs
- let the flow resolve or search the correct listing slot
- create or reactivate the correct BM listing
- capture the resulting listing ID
- do not move to the next device until the current one is verified

### 12. Verify each relisted device immediately
- re-fetch the listing created or reactivated for that device
- verify grade matches expected BM grade
- verify title contains correct RAM
- verify title contains correct SSD
- verify title matches expected chip / CPU-GPU variant when relevant
- verify listing is the intended live slot for that device
- if verification fails:
- take that listing offline immediately
- do not write its listing ID to Monday
- move the device to the blocked list

### 13. Write back verified linkage to Monday
- for each successfully relisted device:
- write the new `text_mkyd4bx3`
- write the verified SKU to `text89`
- write or preserve product UUID in `text_mm1dt53s` as appropriate
- confirm the BM Device row now points to the new verified listing

### 14. Confirm stock state after each device
- confirm BM quantity matches the intended device count
- confirm the device is no longer pointing at an old listing
- confirm the linked Main Board item now reflects the correct post-relist workflow state

### 15. Run post-reset reconciliation
- run `scripts/reconcile-listings.js`
- review:
- Monday listed but BM offline
- orphan BM listings
- qty mismatches
- spec mismatches
- missing BM Device rows
- missing listing IDs
- resolve any reconciliation failures in the rebuilt set before resuming automation

### 16. Produce closeout record
- record old live listing IDs taken offline
- record new listing IDs created or reused
- record each successfully relisted device
- record each blocked device with reason
- record whether reconciliation passed cleanly
- note the exact time the rebuild completed

### 17. Resume automation
- only if reconciliation is clean for the affected set:
- resume reconciliation automation
- resume buy box / repricing automation
- resume listing automation
- note the time automation was resumed

### 18. Post-run follow-up
- review blocked devices separately
- decide whether any inactive historical listings should be cleaned up later
- decide whether a wider audit of inactive BM listings is still needed after today’s reset

---

## Failure handling

### If BM offline step fails
- do not clear Monday linkage for that listing yet
- retry BM update
- if still failing, stop and investigate

### If a BM Device row has missing specs
- do not relist
- add to manual review list

### If Final Grade is missing
- do not relist
- alert and park device

### If product_id cannot be resolved safely
- do not use a near match
- park for manual review

### If new listing verification fails
- take listing offline immediately
- do not write new listing ID to Monday
- keep device on blocked list

---

## Success criteria for today

Today is complete when all of the following are true:
- all 5 previously live listings are offline or replaced by verified correct listings
- no affected BM Device row points at a stale listing_id
- every successfully relisted device has:
  - verified listing_id
  - verified SKU
  - correct grade
  - correct title/spec alignment
- any blocked devices are clearly listed for manual review
- reconciliation passes for the affected set

---

## Files to use

- `backmarket/scripts/list-device.js`
- `backmarket/scripts/reconcile-listings.js`
- `backmarket/sops/06-listing.md`
- `backmarket/sops/06.5-listings-reconciliation.md`
- `backmarket/knowledge/bm-product-ids.md`
- `backmarket/data/product-id-lookup.json`
