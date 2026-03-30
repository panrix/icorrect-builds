# TODO: Listing Rebuild Tonight

**Date:** 27 Mar 2026
**Owner:** Code (orchestrator)

---

## Phase 1: Cleanup (take 11 listings offline, reset Monday)

- [ ] Take all 11 live listings offline (qty=0 via BM API)
- [ ] Clear `text_mkyd4bx3` (listing ID) on BM Devices board for all 11
- [ ] Reset `status24` to "To List" (index 8) on Main Board for all 11
- [ ] Verify: zero live listings on BM, Monday shows "To List" for all

## Phase 2: Rebuild list-device.js

- [ ] Rewrite to clean-create only (Path B always, no Path A/A2)
- [ ] Remove getAllListings(), searchListingSlot(), stored listing check
- [ ] Create as draft (state=3) first
- [ ] After creation: get backbox price, calibrate, then publish (state=2)
- [ ] Safe placeholder pricing (floor × 2) for draft
- [ ] Verify draft before publishing (product_id, grade, title, colour)
- [ ] QA: syntax check passes
- [ ] QA: --dry-run shows Path B for every device
- [ ] QA: no reference to old listing search/reuse

## Phase 3: List all devices

- [ ] Minimum £50 net profit gate (replaces 15% margin for this run)
- [ ] Run each device: create draft → verify → backbox → calibrate → publish
- [ ] Verify each published listing on BM
- [ ] Update Monday after verification
- [ ] Flag any that can't be listed with reason

## Phase 4: Report

- [ ] List of all live listings with prices and verification status
- [ ] List of flagged devices for Ricky's morning review
- [ ] Commit all changes and push
