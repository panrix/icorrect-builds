# Back Market SKU Portal Canary Runbook

Date: 2026-04-26  
Status: ready for review, **not approved for live portal access or mutation**

## Purpose

Prepare the smallest safe seller-portal browser path for SKU/listing verification now that Back Market SKU generation has moved upstream into QC handoff.

This runbook is deliberately split into two approvals:

1. **Read-only portal canary** — login/navigation/verification/screenshots only.
2. **Write canary** — one explicitly approved SKU correction only, later.

No live portal navigation or login is approved by this document.

## Canonical SKU model

The canonical Back Market SKU source is now BM Devices `text89`, generated during SOP 05 QC handoff.

Browser automation must follow these rules:

- The seller portal does **not** invent or construct SKUs.
- The portal read path verifies that the listing SKU equals BM Devices `text89`.
- The portal write path, when separately approved, may only correct the seller portal SKU field from the approved canonical BM Devices `text89` value.
- If BM Devices `text89` is missing or mismatches the recalculated expected SKU, stop and route back to QC/SOP 05. Do not fix it in the browser.
- If portal SKU differs from BM Devices `text89`, record the mismatch with screenshots and wait for write approval.

## Candidate source for first read-only canary

Use the current queue JSON only to choose a candidate; do not mutate from it.

Current referenced queue file:

- `/home/ricky/builds/backmarket/reports/current-queue-qc-sku-map-2026-04-26-024008.json`

A good read-only candidate has:

- `classification = READY_FOR_LISTING_PROPOSAL`
- non-empty `bm_device_id`
- non-empty `sku_current`
- `sku_current === sku_expected`
- preferably non-empty stable portal identifier (`uuid` or `listing_id`) if available
- no `return_relist_caution`

Observed candidate from that report:

- Main item `11522195767`
- Item name `BM 1555 ( Isaiah Ellis )`
- BM Devices item `11522177120`
- UUID `8948b82c-f746-4be0-a8b0-0758b1dc4acc`
- Canonical SKU `MBP.A2338.M2.8GB.256GB.Grey.Fair`
- Classification `READY_FOR_LISTING_PROPOSAL`

If a fresher queue report exists, prefer the fresher report and re-check these conditions.

## Preconditions before read-only portal canary

Local/non-portal gates:

```bash
cd /home/ricky/builds/backmarket-browser
npm test
npm run validate:selectors
npm run harness:about-blank:plan
```

Neutral VPS harness gate:

```bash
cd /home/ricky/builds/backmarket-browser
node scripts/vps-cdp-about-blank-check.js --start-chromium
```

Required result:

- runtime lock acquired
- CDP endpoint is localhost/127.0.0.1 only
- browser-harness binary exists
- CDP websocket discovered
- `page_info()` confirms `about:blank`
- output contains no Back Market URL/text

Portal-readiness gates:

- exact candidate approved by Ricky/Ferrari
- login approval explicitly granted
- email-code retrieval approval explicitly granted if a code prompt appears
- screenshots path prepared under `data/screenshots/portal-canary/<run-id>/`
- no write flags enabled
- no customer/reply/refund/return/warranty/listing mutation path enabled

## Read-only portal canary plan

After explicit approval only:

1. Acquire runtime lock.
2. Attach browser-harness to VPS Chromium/CDP.
3. Navigate to seller portal landing page.
4. If already logged in, screenshot dashboard/nav.
5. If login is required, stop unless login + code retrieval approval is in the approval text.
6. Open Listings.
7. Open Filter.
8. Search by strongest approved stable identifier:
   - UUID first if the portal supports UUID filtering and candidate has UUID.
   - listing_id second if available.
   - exact canonical SKU third.
9. Apply filter and require exactly one result.
10. Open the underlined listing name/title.
11. Screenshot listing detail.
12. Read only:
    - portal SKU field
    - product_id
    - appearance
    - quantity/inventory if visible
    - publication/stock status if visible
    - title
13. Compare portal SKU to canonical BM Devices `text89`.
14. Write a local report only.
15. Close or leave neutral browser state according to operator instruction.

## Screenshot/checkpoint plan

Store under `data/screenshots/portal-canary/<run-id>/`:

- `00-about-blank.png` — neutral harness proof
- `01-landing-or-login.png` — first portal page; stop if login not approved
- `02-listings-index.png`
- `03-filter-filled.png`
- `04-filter-results.png`
- `05-listing-detail.png`
- `06-final-state.png`

Each screenshot must have a matching local JSON checkpoint with:

- timestamp
- URL redacted if it includes sensitive query parameters
- candidate identifiers
- action just performed
- assertion result
- whether any mutation-capable control was clicked (`false` required)

## Hard stops

Stop immediately if:

- Back Market login appears and live-login approval text is absent
- email-code prompt appears and code approval text is absent
- selector drift or ambiguous result
- more than one listing result
- SKU field is editable but read-only mode is active and any write action would be required
- Save/submit/reply/refund/return/warranty controls are focused accidentally
- candidate SKU in BM Devices no longer matches expected QC SKU
- portal page suggests listing ownership/account mismatch
- captcha, unexpected modal, or error banner appears

## Future write canary boundary

A future write canary requires a separate approval containing all of:

- exact listing/BM item/order identifiers
- current portal SKU observed in read-only canary
- canonical BM Devices `text89`
- explicit permission to edit only SKU
- explicit permission to click Save
- rollback plan approval

The write path still must:

1. Capture pre-change values and screenshot.
2. Assert live SKU equals expected current portal SKU.
3. Edit only SKU.
4. Click Save.
5. Navigate back to Listings.
6. Re-filter by canonical SKU or stable UUID/listing identifier.
7. Reopen detail.
8. Verify SKU changed and product_id, appearance, quantity, publication state, and title/spec did not change.

A Save click alone is never proof of success.
