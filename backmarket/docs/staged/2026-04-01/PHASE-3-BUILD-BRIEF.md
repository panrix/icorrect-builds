# Phase 3 Build Brief: BM Script Pipeline

**Date:** 2026-03-18
**Author:** Jarvis (subagent)
**For:** Code — implementation reference
**Status:** Ready to build

---

## Context

This is the scoping document for Phase 3, Track B of the agent rebuild. These scripts replace manual agent work (Hugo doing raw API calls each session) and fix broken automations causing real damage (premature shipping confirmation, no payout automation, zero listing automation).

Hugo becomes strategist and exception handler. Scripts handle the mechanical work.

## Corrections (2026-03-18, verified by Jarvis)

1. **Listing creation API WORKS.** Hugo's SOP said broken since Feb 28. Wrong: he used numeric grade (3) instead of text (FAIR). Tested and confirmed: `POST /ws/listings` with JSON body, text grades, returns task_id → poll for listing_id.
2. **Buyback messages API WORKS.** `GET/POST /ws/buyback/v1/orders/{id}/messages` returns full conversation thread. Already used by iCloud checker for customer comms.
3. **Sales aftercare has NO API.** `/ws/sav` = "API under construction." This is the one area genuinely needing portal browser agent.
4. **Local listing lookup replaces REF.md.** 274 clean MacBook listings in `/home/ricky/builds/icloud-checker/data/bm-listings-clean.json`. Deduped, test/bad entries removed. Refresh daily via cron. Scripts search this file, not BM API.
5. **BM Devices Board has NO listing ID at the To List stage.** Listing ID/UUID are written AFTER listing (post-listing step). Build 4+5 must resolve product_id from local lookup, not read it from Monday.
6. **POST not PATCH for listing updates.** PATCH returns 405. Always use POST.
7. **`pub_state: 2` must be explicit** on every activation POST. BM does not auto-publish.

---

**Architecture pattern:** Follow iCloud checker (`/home/ricky/builds/icloud-checker/src/index.js`, port 8010, Express.js, systemd service `icloud-checker.service`). New webhook handlers either add routes to that service or follow the same Express.js pattern as separate services.

**Credentials:** `/home/ricky/config/api-keys/.env` (source this in all scripts). BM API creds are also hardcoded in icloud-checker — clean them out and use .env exclusively.

**BM API — all 3 headers required on every request:**
```
Authorization: <BM_AUTH from .env>
Accept-Language: en-gb
User-Agent: <UA_STRING from .env>
```

**Monday boards:**
- Main Board: `349212843`
- BM Devices Board: `3892194968`

**Key column IDs (Main Board, flag all for v2 update):**
- `status24` = Repair Type: Pay-Out=12, Purchased=6, Listed=7, Sold=10, Counteroffer=3, To List=8
- `status4` = Status: Shipped=160, To Ship=156
- `text4` = Serial Number
- `status8` = Colour

**Key column IDs (BM Devices Board):**
- `text_mkyd4bx3` = Listing ID (numeric)
- `text_mm1dt53s` = Listing UUID
- `text_mkye7p1c` = Sales Order ID

> ⚠️ **v2 Main Board is coming.** Every column ID reference in these scripts must be in a single config object (not scattered inline) so a one-line change handles the v2 migration. Comment all column ID usages with `// TODO: update for Main Board v2`.

---

## Priority Order

| # | Build | Priority | Effort |
|---|-------|----------|--------|
| 1 | Split dispatch.js (remove premature BM notification) | CRITICAL | Small |
| 2 | Shipping confirmation script (Monday → BM API on Shipped) | CRITICAL | Small |
| 3 | Instant payout script (Pay-Out → BM validate) | CRITICAL | Small |
| 4 | Listing automation Path A (qty bump on active listing) | CRITICAL | Medium |
| 5 | Listing automation Path B (offline listing reactivation) | CRITICAL | Medium |
| 6 | Counter-offer module (spec mismatch → Slack approval → API) | HIGH | Large |
| 7 | Morning briefing script (SENT orders → estimated arrivals → Slack) | HIGH | Small |
| 8 | Daily listing reconciliation (Monday vs BM, cron) | HIGH | Small |
| 9 | Daily profitability check (live listings vs market prices) | HIGH | Medium |
| 10 | Intake profitability prediction (grade prediction → profit flag) | HIGH | Medium |
| 11 | Sell price scraper optimisation | MEDIUM | Medium |
| 12 | BM seller portal browser agent | MEDIUM | Large |

---

## Build 1: Split dispatch.js — Remove Premature BM Notification

### What it does

`dispatch.js` currently buys Royal Mail labels and then immediately calls `updateBmTracking()`, which POSTs `new_state: 3` (shipped) to BackMarket. This tells BM the device has been shipped at label purchase time — before the team physically ships anything. This starts BM's delivery SLA clock early, creates customer communication that's ahead of reality, and risks late-delivery penalties. This build removes that call from dispatch.js so it only buys labels, downloads packing slips, and posts to Slack. Nothing else.

### Trigger

Manual: `node dispatch.js` run by team each morning.

### Inputs

Existing dispatch.js logic. No new inputs.

### Logic

1. Open `/home/ricky/builds/royal-mail-automation/dispatch.js`
2. Locate the step 6 block in `main()` (currently around line 693-697):
   ```js
   // 6. Update BM with tracking numbers
   console.log('\n[6] Updating BM orders with tracking...');
   for (const order of rmResults) {
     await updateBmTracking(order);
   }
   ```
3. Remove this block entirely. Do not delete the `updateBmTracking()` function definition — it will be called from Build 2.
4. Update the step numbering in comments: step 7 (Post to Slack) becomes step 6.
5. Update the summary log to reflect that BM tracking is NOT updated at dispatch time.
6. Add a comment in the Slack post output: `"⚠️ BM NOT notified. Confirm shipping in Monday when physically posted."`

### Outputs

- `dispatch.js` buys labels, downloads slips, posts to Slack.
- Does NOT call BM API at all.

### Error handling

No change to existing error handling for label purchase.

### Dependencies

None. This is an isolated edit to an existing file.

### Estimated effort

Small (30 min).

### Files to modify

- `/home/ricky/builds/royal-mail-automation/dispatch.js` — remove step 6 block in main()

---

## Build 2: Shipping Confirmation Script

### What it does

When the team physically ships a device, they change the Monday `status4` column to index 160 (Shipped) on the Main Board. This script is triggered by that specific Monday webhook, looks up the tracking number for the order, and POSTs `new_state: 3` with tracking to the BM API. This is the only correct trigger for telling BM a device has shipped — not label purchase time.

### Trigger

Monday webhook: `status4` column changes to index `160` on board `349212843`.

> ⚠️ This must be registered as a SPECIFIC status trigger in Monday, NOT "any column changes". In Monday webhook settings: trigger = "When status changes", column = `status4`, status = Shipped (index 160). This prevents the webhook firing for every column change.

### Inputs

From the Monday webhook payload:
- `itemId` — Monday item ID
- `boardId` — should be `349212843`
- `columnId` — `status4`
- `value.index` — must equal `160`

From Monday GraphQL (fetch after webhook fires):
- Tracking number column (identify exact column ID — likely `text` column where dispatch.js writes the RM tracking number; verify in live board)
- BM Order ID column on BM Devices Board (the public order ID for BM API — fetch linked item on BM Devices Board `3892194968`)

### Logic

1. Receive Monday webhook POST at `/webhook/bm/shipping-confirmed`
2. Validate: `columnId === 'status4'` and `value.index === 160`. Reject anything else with 200 (Monday retries on non-200).
3. Query Monday GraphQL for the item:
   - Get tracking number from the tracking column (identify exact column ID from live board)
   - Get linked BM Devices Board item
   - From BM Devices Board item: get BM order number / public order ID
4. If no tracking number found: post Slack alert to BM group — "⚠️ [item name] marked Shipped but no tracking number found. Manual BM update required." Then exit.
5. If tracking number found: POST to BM API:
   ```
   POST /ws/orders/{orderId}
   Headers: Authorization, Accept-Language: en-gb, User-Agent
   Body: {
     order_id: orderId,
     new_state: 3,
     tracking_number: trackingNumber,
     tracking_url: "https://www.royalmail.com/track-your-item#/tracking-results/{trackingNumber}",
     shipper: "Royal Mail Express"
   }
   ```
   (This is the same payload as the existing `updateBmTracking()` function in dispatch.js — reuse that function.)
6. On BM API success: log to console + post brief Slack confirmation to BM group.
7. Update Monday item: set a "BM Notified" flag column (or add a note to the item's update column) so the team can see it was processed.

### Outputs

- BM order marked as shipped (state=3) with tracking number and URL.
- Slack confirmation to BM group.
- Monday item note: "BM notified of shipment at [timestamp]".

### Error handling

- BM API 4xx: post Slack alert with full error + item name. Do not retry.
- BM API 5xx: retry once after 30s. If second attempt fails, Slack alert + log.
- Monday GraphQL failure: Slack alert + log. Do not call BM.
- Missing tracking number: Slack alert (see Logic step 4). Do not call BM.
- Duplicate webhook (same item fires twice): check if item already has "BM Notified" flag. If yes, skip silently.

### Dependencies

- Build 1 (dispatch.js must NOT be calling BM anymore, or double-notification occurs).
- `updateBmTracking()` function stays in dispatch.js (or extracted to shared util) — this script reuses it.
- Monday webhook registered with specific trigger (status4 → index 160).
- Tracking number column ID confirmed from live Main Board.
- BM order public ID accessible from BM Devices Board linked item.

### Estimated effort

Small (2-3 hours including webhook registration).

### Files to create/modify

- `/home/ricky/builds/bm-webhook-handlers/src/routes/shipping-confirmed.js` — new route handler
- `/home/ricky/builds/bm-webhook-handlers/src/index.js` — register route (or add to existing icloud-checker if preferred)
- `/home/ricky/builds/royal-mail-automation/dispatch.js` — do not delete `updateBmTracking()` function, it's reused here

> Alternative: add as a new route `/webhook/bm/shipping-confirmed` directly to `/home/ricky/builds/icloud-checker/src/index.js` and restart `icloud-checker.service`. Simpler architecture.

---

## Build 3: Instant Payout Script

### What it does

When a team member changes the Repair Type column (`status24`) to Pay-Out (index 12) on the Main Board, this script fires immediately and calls the BM buyback validate endpoint to release payment to the customer. On success, it changes the status to Purchased (index 6) so the team knows the payout is done. This replaces the disabled n8n Flow 4 and demotes `buyback_payout_watch.py` to a pure deadline safety net only (it stays but only catches orders missed by this script near the 48h mark).

### Trigger

Monday webhook: `status24` column changes to index `12` (Pay-Out) on board `349212843`.

> ⚠️ Specific status trigger: column = `status24`, status = Pay-Out (index 12). NOT "any column changes".

### Inputs

From Monday webhook:
- `itemId` — Monday item ID
- `value.index` — must equal `12`

From BM Devices Board (fetch via Monday GraphQL after webhook):
- BM order public ID (the identifier used in BM buyback API — this is stored in a column on BM Devices Board, likely a text column; verify exact column ID from live board)

### Logic

1. Receive Monday webhook POST at `/webhook/bm/payout`
2. Validate: `columnId === 'status24'` and `value.index === 12`. Reject anything else.
3. Query Monday GraphQL: get linked BM Devices Board item for this Main Board item.
4. From BM Devices Board item: extract BM order public ID.
5. Call BM API:
   ```
   PUT /ws/buyback/v1/orders/{orderPublicId}/validate
   Headers: Authorization, Accept-Language: en-gb, User-Agent
   Body: {} (empty — validate accepts the order as-is at original price)
   ```
6. On success: change Monday `status24` to index `6` (Purchased) via GraphQL mutation.
7. Post brief Slack confirmation to BM group: "✅ Payout sent for [item name] — [BM order ID]".
8. Log timestamp + order ID + amount (if returned by API).

### Outputs

- BM payout triggered.
- Monday `status24` updated to Purchased (6).
- Slack confirmation.

### Error handling

- BM API returns error (e.g. order already validated, counter-offer pending): Slack alert with full API error message. Do NOT change Monday status. Team investigates.
- BM API 5xx: retry once after 30s. If fails again: Slack alert, leave status as Pay-Out so `buyback_payout_watch.py` catches it at deadline.
- Monday GraphQL failure on status update: Slack alert "Payout sent to BM but Monday not updated — set to Purchased manually".
- BM order ID not found on Monday item: Slack alert. Do not call BM API.
- Counter-offer active: BM will reject the validate call. Script should detect this (check `counterOfferPrice !== originalPrice` if data available) and instead post a Slack warning before calling.

### Dependencies

- `buyback_payout_watch.py` stays running as safety net (cron every 2h near deadlines).
- BM order public ID column confirmed from live BM Devices Board.
- Monday webhook registered with specific trigger (status24 → index 12).

### Estimated effort

Small (2-3 hours).

### Files to create

- `/home/ricky/builds/icloud-checker/src/routes/bm-payout.js` (or add route to index.js)

---

## Build 4: Listing Automation — Path A (Active Listing Qty Bump)

### What it does

When a device's `status24` is changed to To List (index 8) on the Main Board, this script checks if there is already an active BM listing (qty > 0) for the exact same product_id + grade + colour. If there is, it bumps the listing quantity by 1 and updates Monday accordingly. No pricing decision is needed — the existing listing already has an approved price. This covers the "top SKU" scenario (most common case) and is fully automatic.

### Trigger

Monday webhook: `status24` column changes to index `8` (To List) on board `349212843`.

> ⚠️ Specific status trigger: column = `status24`, status = To List (index 8).

### Inputs

From Monday webhook:
- `itemId`
- `value.index` — must equal `8`

From Monday GraphQL (Main Board item):
- Serial number (`text4`)
- Device name / model
- Colour (`status8`) — confirmed by Apple spec check at intake

From Monday GraphQL (BM Devices Board, via `board_relation`):
- Model (`lookup` mirror)
- Storage (`color2` status)
- RAM (`status__1` status)
- CPU cores (`status7__1` status)
- GPU cores (`status8__1` status)
- Grade (`mirror_Mjj4H2hl` mirror)
- Purchase price (`numeric`)

> ⚠️ At the To List stage, the BM Devices Board does NOT have a listing ID or UUID. Those are written AFTER listing (post-listing step). Do not look for them as inputs.

From local listing lookup file:
- `/home/ricky/builds/icloud-checker/data/bm-listings-clean.json` — 274 MacBook listing slots with product_id, grade, SKU, listing_id. Refreshed daily by cron.

> ⚠️ Do NOT paginate BM's listing API on every webhook. Use the local lookup file. Refresh it daily via a separate cron that pulls all listings and filters to MacBooks only.

### Logic

1. Receive Monday webhook POST at `/webhook/bm/to-list`
2. Validate: `columnId === 'status24'` and `value.index === 8`.
3. Query Monday BM Devices Board: get device model, spec (RAM, storage, CPU, GPU), grade, colour, purchase price. Build the SKU: `{Type}.{Model}.{Chip}.{RAM}.{Storage}.{Colour}.{Grade}`.
4. Resolve the `product_id`: look up the local listing file (`bm-listings-clean.json`) for a listing matching this model+spec+colour. The `product_id` in that listing is the BM catalogue ID for this device. If no match found in lookup, the product_id must be discovered via NUXT scrape (see Build 5 Path B).
5. Map Apple-reported colour to BM SKU colour (HARD GATE — see colour note below). Verify the colour in the matched listing's SKU matches the device's Apple-confirmed colour.
6. Search local listing lookup for active listings (qty > 0) matching this `product_id` + `grade`. This is Path A's decision branch.
7. **If exactly one active listing found:**
   - This is Path A. Proceed.
   - Call BM API: `POST /ws/listings/{listing_id}` with `quantity: currentQty + 1` (NOTE: use POST not PATCH; PATCH returns 405)
   - Write listing UUID to Monday BM Devices Board `text_mm1dt53s`
   - Write listing numeric ID to `text_mkyd4bx3`
   - Change Monday Main Board `status24` to Listed (index 7)
   - Log: "Path A: bumped qty on listing [UUID] for [device]"
8. **If no active listing found (qty=0 or listing is offline/inactive):**
   - This is Path B territory. Trigger Build 5 logic.
   - Do NOT change Monday status. Build 5 will handle it.
9. **If multiple active listings found:**
   - This should not happen (each product_id+grade+colour should have one slot). Slack alert to BM group for manual resolution.

> ⚠️ **COLOUR HARD GATE:** The colour match between Apple-reported colour (from spec check) and BM SKU colour MUST be a programmatic check. This is the root cause of the 5-6 colour mismatch listings in production. The script must map Apple colour names → BM SKU colour names explicitly. If no confident mapping exists, block and alert — do not proceed.
>
> Example mapping needed:
> - "Silver" → "silver"
> - "Space Grey" → "space-grey"
> - "Space Black" → "space-black"
> - "Starlight" → "starlight"
> - etc.
>
> If Apple-reported colour is absent or unmapped: Slack alert + leave Monday status as To List.

### Outputs

- BM listing qty incremented by 1.
- Monday BM Devices Board: listing ID + UUID written.
- Monday Main Board `status24`: updated to Listed (7).
- Log entry: timestamp, device name, listing UUID, new qty.

### Error handling

- BM API qty update fails: Slack alert + leave Monday status as To List. Do not retry silently.
- Colour match fails (unmapped or absent): Slack alert to BM group "Colour gate blocked: [item]. Apple says [X], no BM mapping. Manual listing required."
- No serial number in Monday: Slack alert. Cannot proceed.
- Monday GraphQL write fails: Slack alert "Listing updated on BM but Monday not updated. Set manually: [listing ID], [UUID]."

### Dependencies

- Serial number must be populated in Monday before this fires (intake flow is prerequisite).
- Spec check (icloud-checker) must have run and written colour to Monday `status8`.
- Active BM listing data (paginated fetch of all listings). Consider caching this locally (refresh every 15 min) rather than fetching per-webhook to avoid rate limits.
- Colour mapping table (build and document).
- Grade mapping from Monday grade column to BM grade codes.

### Estimated effort

Medium (1-2 days including colour mapping and grade mapping).

### Files to create

- `/home/ricky/builds/icloud-checker/src/routes/bm-listing.js` — main listing route (handles both Path A and Path B dispatch)
- `/home/ricky/builds/icloud-checker/src/lib/bm-listings-cache.js` — listings cache (optional but recommended)
- `/home/ricky/builds/icloud-checker/src/lib/colour-map.js` — Apple colour → BM SKU colour mapping
- `/home/ricky/builds/icloud-checker/src/lib/grade-map.js` — Monday grade → BM grade code mapping

---

## Build 5: Listing Automation — Path B (Offline Listing Reactivation)

### What it does

This is the fallback path from Build 4 when no active listing exists for the device. The script finds the correct offline listing slot (product_id + grade + colour match), queries BackBox for the current buy box price, checks the grade ladder and adjacent storage tiers, runs a profitability calculation, and decides whether to auto-list or flag to Ricky. Auto-list threshold: net margin ≥30% AND net profit ≥£100. Below either threshold: Slack message to Ricky with the numbers, waiting for approval. Colour is still a hard gate.

### Trigger

Called from Build 4's webhook handler when no active listing is found (i.e. not a separate webhook — it's the continuation of the same `/webhook/bm/to-list` handler).

### Inputs

From Build 4 context (already fetched):
- Device grade (BM grade code)
- Device colour (BM SKU colour, post colour-map)
- product_id

From BM API:
- All listings (including offline/inactive, qty=0): `GET /ws/listings` without state filter — need to find listings where `quantity === 0` for this product_id + grade + colour
- BackBox competitor data: `GET /ws/listings/{uuid}/backbox` — returns buy box price and competitor list
- Adjacent listings for grade ladder: fetch listings for same product_id + colour at grades above and below

From Monday (already fetched via Build 4):
- Parts cost: from Main Board or Parts Board (board 985177480) — the cost column for this device (verify column ID from live board)
- Purchase cost: the price paid to customer (BM order bid price — from BM Devices Board or BM API)

From `.env` / constants:
- Labour rate: £24/hr
- Standard shipping cost: £15
- Minimum margin threshold: 30%
- Minimum net profit threshold: £100

From `/home/ricky/builds/buyback-monitor/sell-price-lookup.json` (if available and fresh):
- Expected sell price for this product_id + grade (cross-reference with BackBox data)

### Logic

1. (Continuation of Build 4 — no active listing found for this device)
2. Search offline listings: filter fetched listings for same product_id + grade + colour with `quantity === 0`.
3. **If no listing slot found at all (product_id + grade + colour combo doesn't exist in our catalogue):**
   - **Listing creation API works.** Use `POST /ws/listings` with JSON body:
     ```json
     {
       "catalog": "sku;product_id;price;min_price;quantity;warranty_delay;comment;grade;currency\r\n{SKU};{product_id};{price};{min_price};0;12;\"Fully tested. 12 month warranty.\";{GRADE};GBP\r\n",
       "quotechar": "\"",
       "delimiter": ";",
       "encoding": "UTF-8"
     }
     ```
   - **Grade must be text: FAIR, GOOD, or VERY_GOOD** (not numeric 3/2/1 — numeric was why Hugo thought this was broken).
   - Create with qty=0 first, verify via `GET /ws/tasks/{task_id}`, then activate with qty=1 + price.
   - If product_id is unknown (genuinely new spec+colour), flag to Ricky. Product_id discovery requires a NUXT scrape of a BM product page for the same model.
   - Update local listing lookup file after creation.
4. **Colour check:** confirm the offline listing's SKU colour matches the device's Apple-reported colour via the colour map (same hard gate as Path A). Block if mismatch.
5. Fetch BackBox data for the listing: `GET /ws/listings/{uuid}/backbox`
   - Extract buy box price (lowest competitor price)
6. Fetch grade ladder prices: find our offline listings for same product_id + colour at the grade above and below. Note their last-known prices (or use sell-price-lookup.json).
7. Profitability calculation:
   ```
   purchase_cost = BM order bid price (what we paid the customer)
   parts_cost = from Monday parts column (£0 if no repair needed)
   labour_cost = repair hours × £24 (from Monday time tracking or estimated by grade)
   shipping_cost = £15
   
   total_cost = purchase_cost + parts_cost + labour_cost + shipping_cost
   
   target_sell_price = backbox_buy_box_price (or slightly below to win buy box)
   sell_price_ex_vat = target_sell_price / 1.20  (BackMarket takes from gross)
   bm_commission = sell_price_ex_vat × 0.10  (verify exact BM commission rate)
   net_revenue = sell_price_ex_vat - bm_commission
   
   net_profit = net_revenue - total_cost
   net_margin = net_profit / net_revenue × 100
   ```
   > Note: verify BM commission % from existing pricing scripts. `build_cost_matrix.py` and `bid_order_analysis.py` in `/home/ricky/builds/buyback-monitor/` have the current formula. Do not guess.
8. **Decision:**
   - If `net_margin >= 30%` AND `net_profit >= £100`:
     - Auto-list: PATCH listing to set `quantity: 1` and `price: target_sell_price`
     - Write listing UUID to Monday `text_mm1dt53s`, numeric ID to `text_mkyd4bx3`
     - Change `status24` to Listed (7)
     - Slack to BM group: "✅ Path B auto-listed: [device] at £[price]. Margin: [X]%, Net: £[Y]"
   - Otherwise:
     - Post to BM Telegram group with full breakdown for Ricky:
       ```
       📋 Listing approval needed: [device name]
       Grade: [X] | Colour: [Y]
       
       Buy box price: £[X]
       Our total cost: £[X]
         — Purchase: £[X]
         — Parts: £[X]
         — Labour: £[X] ([Xhr @ £24)
         — Shipping: £15
       
       Net profit: £[X] | Margin: [X]%
       Threshold: ≥30% margin AND ≥£100 net
       
       Approve to list at £[X]? Or adjust price?
       [Approve] [Adjust] [Skip]
       ```
     - Leave Monday status as To List.
     - Wait for Ricky approval (inline button or reply). On approval: execute listing. On adjust: expect a price reply, then list at adjusted price.

### Outputs

- If auto-list: BM listing quantity set to 1, price set, Monday updated, Slack confirmation.
- If below threshold: Slack approval request to Ricky with full breakdown.
- Audit log: every decision (auto or flagged), device, prices, margins, timestamp.

### Error handling

- BackBox fetch fails: flag to Ricky manually with "BackBox unavailable — cannot get buy box price. Manual pricing required."
- Profitability data incomplete (missing parts cost, purchase price): Slack alert + leave as To List.
- BM listing update fails: Slack alert with full error.
- No listing slot exists at all: Slack alert as described in Logic step 3.
- Ricky approval timeout (>48h): send reminder.

### Dependencies

- Build 4 (this is called from the same webhook handler).
- Parts cost and purchase cost must be populated in Monday.
- `/home/ricky/builds/buyback-monitor/sell-price-lookup.json` (nice to have, not blocking).
- BackBox API access working (test with `backbox_audit.py` script).
- BM commission rate verified from existing pricing scripts.
- Inline button approval flow in Telegram (Ricky confirms/adjusts).

### Estimated effort

Medium (2-3 days including profitability calc and approval flow).

### Files to create/modify

- `/home/ricky/builds/icloud-checker/src/routes/bm-listing.js` — Path B logic added to same file as Path A
- `/home/ricky/builds/icloud-checker/src/lib/profitability.js` — profitability calculation module (reusable for Build 9 and 10)
- `/home/ricky/builds/icloud-checker/src/lib/bm-listings-cache.js` — shared with Build 4

---

## Build 6: Counter-Offer Module

### What it does

At intake, the spec check (already running in icloud-checker) compares the received device's actual specs (model, chip, RAM, storage) against the BM order's expected specs. If the received device is worse and the value difference is >£20, this module generates a counter-offer via BM API after Ricky approves via Slack. Value differences ≤£20 are absorbed at original price (normal payout, no counter-offer). Better-than-expected specs: always pay at original price, no action. Counter-offer rate must stay under 15% rolling (measured across last 30 days of orders). Uses `PUT /ws/buyback/v2/orders/{orderPublicId}/counter-offers`.

### Trigger

Monday webhook: `text4` (serial number) changes on Main Board `349212843`, where `clientType = "BM"`. This is the existing spec-check trigger in icloud-checker — this module adds to that flow, not a new webhook.

Alternatively: the spec check result already posts to Monday and Slack. This module can trigger off the existing spec mismatch detection code path in `index.js`.

### Inputs

From existing spec check (already in icloud-checker):
- Expected model/spec (from BM order — BM Devices Board)
- Received model/spec (from Apple SSR spec check result)
- BM order public ID (from BM Devices Board)

From BM API:
- Current buyback bid price for the RECEIVED spec: `GET /ws/buyback/v1/listings?...` filtered by the received device's product_id + grade
- `GET /ws/buyback/v1/orders/{orderPublicId}` — full order details including original price, any existing counter-offers

From Monday:
- Device name, serial, BM order number

From `.env`:
- Counter-offer rate threshold: 15%

### Logic

1. Spec check completes (existing flow in icloud-checker). If mismatch detected:
2. Classify the mismatch:
   - **Model downgrade:** e.g. M2 expected, M1 received
   - **Chip downgrade:** e.g. M1 Pro expected, M1 received
   - **RAM less:** e.g. 16GB expected, 8GB received
   - **Storage less:** e.g. 512GB expected, 256GB received
   - **Any combination of the above**
   - If the received spec is BETTER in all dimensions: flag as "better spec received" → pay at original price, no counter-offer. Exit this module.
3. Calculate value difference:
   - `original_bid = BM order's original bid price`
   - `received_spec_bid = current BM buyback bid for the received spec + grade`
   - `value_diff = original_bid - received_spec_bid`
4. **If `value_diff <= £20`:** absorb. Log decision. Proceed to normal payout (trigger Build 3 or notify team to approve payout). Post brief Slack note: "Spec mismatch within tolerance (£[X] diff). Proceeding at original price."
5. **If `value_diff > £20`:**
   - Check rolling counter-offer rate:
     ```
     Rate = (counter-offers sent in last 30 days) / (total buyback orders in last 30 days) × 100
     ```
     Source: BM API order history or local log file.
   - If rate >= 15%: **do NOT generate counter-offer.** Slack alert to Ricky: "Counter-offer rate at [X]% (limit 15%). Cannot counter for [device]. Proceeding at original price or manual review required."
   - If rate < 15%: generate counter-offer candidate.
6. Change Monday `status24` to Counteroffer (index 3). This flags it for Roni: this device is a counter-offer candidate.
7. Post Slack approval request to BM group:
   ```
   🔴 Counter-offer candidate: [device name] [BM order ID]
   
   Expected: [model] [chip] [RAM] [storage]
   Received: [model] [chip] [RAM] [storage]
   
   Original bid: £[X]
   Received spec bid: £[Y]
   Value diff: £[Z]
   
   Counter-offer price: £[Y]
   Rolling counter rate: [X]% (limit 15%)
   
   [Approve counter-offer] [Pay at original] [Adjust price]
   ```
8. On Ricky approval:
   - Call BM API:
     ```
     PUT /ws/buyback/v2/orders/{orderPublicId}/counter-offers
     Headers: Authorization, Accept-Language: en-gb, User-Agent
     Body: {
       counter_offer_price: approvedPrice,
       comment: "Device received: [received spec]. Expected: [expected spec]."
     }
     ```
     > Note: verify exact body format from BM API docs or by inspecting existing `buyback_payout_watch.py` for any counter-offer logic.
   - Log counter-offer in local counter-offer rate tracker (simple JSON file or append to log).
9. On "Pay at original" selection: proceed to payout at original price (trigger Build 3 path).
10. On "Adjust price": Ricky replies with adjusted price, then execute counter-offer at that price.
11. Post outcome to Slack: "Counter-offer sent to customer: £[X]" or "Paying at original: £[X]".

### Counter-offer Rate Tracking

Maintain a simple log file at `/home/ricky/builds/icloud-checker/data/counter-offer-log.json`:
```json
[
  { "date": "2026-03-18", "orderId": "BM-XXX", "action": "counter", "valueDiff": 45 },
  { "date": "2026-03-18", "orderId": "BM-YYY", "action": "absorbed", "valueDiff": 15 }
]
```
Rolling rate calculation reads last 30 days from this file + total BM orders from BM API for same period.

### Outputs

- Monday `status24` set to Counteroffer (3) when flagged.
- Slack approval request with full breakdown.
- On approval: BM counter-offer API call. Counter-offer rate log updated.
- On absorb: payout at original price.
- Audit log of all decisions.

### Error handling

- BM counter-offer API fails: Slack alert with raw error. Do not change Monday status.
- Value diff cannot be calculated (missing bid data): Slack alert "Cannot auto-calculate value diff for [device]. Manual review required."
- Counter-offer rate exceeds 15%: hard block + Slack alert (see Logic step 5).
- Ricky approval timeout (>24h for a trade-in): send reminder. BM has a 48h payout window.

### Dependencies

- Existing spec check flow in icloud-checker must be working.
- BM order public ID accessible from Monday.
- Counter-offer API endpoint `PUT /ws/buyback/v2/orders/{orderPublicId}/counter-offers` verified (untested per audit).
- Counter-offer rate tracking log file in place.
- Build 3 (instant payout) must be live so the "Pay at original" path works.

### Estimated effort

Large (3-4 days including rate tracking, approval flow, and API verification).

### Files to create/modify

- `/home/ricky/builds/icloud-checker/src/routes/spec-check.js` (or modify `index.js` spec-check handler) — add counter-offer decision logic
- `/home/ricky/builds/icloud-checker/src/lib/counter-offer.js` — counter-offer module (rate check, API call, log)
- `/home/ricky/builds/icloud-checker/data/counter-offer-log.json` — counter-offer decision log (create empty on first run)

---

## Build 7: Morning Briefing Script

### What it does

Each morning, this script pulls all SENT buyback orders from BM API, matches BM order IDs to their Monday Main Board item (and therefore to the BM number Roni uses for physical matching), estimates arrival dates based on shipping service type and the order's drop-off/acceptance date, and posts a structured Slack briefing to the BM group. Roni sees it before devices arrive, knows what to expect, and can pre-match order numbers to BM numbers without manual lookup. No Royal Mail tracking API required (not worth the onboarding; long-term move to DHL).

### Trigger

Cron: runs daily at 07:00 UTC (adjust to match workshop start time if needed). No webhook.

### Inputs

From BM API:
- `GET /ws/buyback/v1/orders?state=sent` — all orders in SENT state (customer has dropped off device, it's in transit)
- Response fields: `order_id`, `public_id`, `product` (device name), `customer_name`, `shipping_method`, `created_at`, `drop_off_date` (or equivalent accepted/sent date)

From Monday (GraphQL query):
- For each BM order: find the Main Board item where BM order ID matches (the column that stores BM order numbers — verify exact column ID from live board and from n8n Flow 0 which writes it)
- Get: Monday item name, BM number (displayed to team), any notes

### Logic

1. Run at 07:00 UTC via cron.
2. Fetch all SENT orders from BM API (paginate if needed).
3. For each order, estimate arrival:
   - `Tracked 48` or `Tracked Returns`: expected 2-3 working days from drop-off date
   - `Special Delivery`: expected next working day from drop-off date
   - `Untracked` / unknown: no estimate, flag as "ETA unknown"
   - Arrival = drop-off date + service days (skip weekends and bank holidays — simple weekday counter is fine)
4. Bucket orders:
   - **Arriving today** (estimated_arrival == today)
   - **Arriving tomorrow**
   - **Arriving this week**
   - **ETA unknown**
5. For each order: try to match to a Monday item by BM order ID. If matched, include the Monday item name and reference number.
6. Compose and post to BM Slack group:
   ```
   📦 Morning Delivery Briefing — [date]
   
   Arriving today (est): [N]
   • [customer name] — [device] — BM order [ID] — Monday: [item name]
   • ...
   
   Arriving tomorrow: [N]
   • [list]
   
   Later this week: [N]
   • [list]
   
   ETA unknown: [N]
   • [list]
   
   Total in transit: [N]
   ```
7. Log run timestamp and summary.

### Outputs

- Slack message to BM group.
- Log entry at `/home/ricky/builds/bm-scripts/logs/morning-briefing.log`.

### Error handling

- BM API fails: Slack alert "Morning briefing failed — BM API error. Check manually."
- Monday match fails for some orders: include them anyway with "Monday: not matched" note.
- No SENT orders: post brief "📦 No devices in transit today." and exit.
- Cron fails silently: add output to a log file and use a health check (Build infrastructure item).

### Dependencies

- BM API working and credentialed.
- Monday column ID for BM order number confirmed from live board.
- Cron registered on VPS.

### Estimated effort

Small (3-4 hours).

### Files to create

- `/home/ricky/builds/bm-scripts/morning-briefing.js` — main script
- `/home/ricky/builds/bm-scripts/logs/` — log directory
- Cron entry: `0 7 * * * node /home/ricky/builds/bm-scripts/morning-briefing.js >> /home/ricky/builds/bm-scripts/logs/morning-briefing.log 2>&1`

---

## Build 8: Daily Listing Reconciliation

### What it does

Daily cron that compares the count of Monday items with `status24 = Listed` (7) against live BM listing quantities via the API. Flags three types of mismatches: (1) device listed in Monday but no corresponding active listing on BM, (2) BM listing has quantity that doesn't match Monday count for that SKU, (3) BM has active listing for a SKU with nothing in Monday. Posts a report to BM Slack group. This already exists as `reconcile_listings.py` (manual Hugo script) — this build adds cron scheduling and automatic Slack alerting.

### Trigger

Cron: daily at 08:00 UTC (after morning briefing, before team starts work).

### Inputs

From Monday GraphQL:
- All items on Main Board where `status24 = Listed` (index 7)
- For each: listing UUID (`text_mm1dt53s`), listing ID (`text_mkyd4bx3`), device name, grade, colour

From BM API:
- All active listings: `GET /ws/listings?state=active` (paginate all)
- Fields: `uuid`, `product_id`, `quantity`, `grade`, `colour`

### Logic

1. Run existing `reconcile_listings.py` logic (or rewrite in JS to match codebase style — check which is simpler to integrate).
2. Pull Monday Listed items + BM active listings.
3. Match by listing UUID (primary) or numeric ID (fallback).
4. Detect:
   - **Ghost listings:** UUID in Monday Listed items but not found in BM active listings (qty=0 or listing doesn't exist). This means we think it's listed but it's not.
   - **Qty mismatch:** Monday Listed count for a given UUID is N, but BM listing qty is M (N ≠ M). Flag with both numbers.
   - **Orphan listings:** BM has active listing with qty > 0 but no corresponding Monday item in Listed status. We're selling something not tracked.
5. If no mismatches: post brief "✅ Listing reconciliation: all clear [N listings checked]" to BM group.
6. If mismatches found: post detailed report with list of each issue.
7. Do NOT auto-fix. Flag only. Human (Hugo) reviews and corrects.

### Outputs

- Slack message to BM group (daily, even if all clear — this confirms the cron ran).
- Log entry at `/home/ricky/builds/bm-scripts/logs/reconciliation.log`.

### Error handling

- BM API fails: Slack alert "Reconciliation failed — BM API error."
- Monday API fails: Slack alert "Reconciliation failed — Monday API error."
- Partial data (e.g. pagination truncated): note in Slack report that results may be incomplete.

### Dependencies

- Existing `reconcile_listings.py` (at `~/.openclaw/agents/backmarket/workspace/scripts/reconcile_listings.py`) — review logic before rewriting. Can port directly.
- BM API active listings endpoint working.
- Monday Listed items query working.

### Estimated effort

Small (2-3 hours — script exists, just needs cron + Slack alerting).

### Files to create

- `/home/ricky/builds/bm-scripts/reconcile.js` (or port Python to run on cron — either works)
- Cron entry: `0 8 * * * node /home/ricky/builds/bm-scripts/reconcile.js >> /home/ricky/builds/bm-scripts/logs/reconciliation.log 2>&1`

---

## Build 9: Daily Profitability Check

### What it does

Daily cron that checks all live BM listings against current market prices (BackBox buy box data) and flags any listing where we have lost the buy box or where current profitability has dropped below threshold. Also maintains a persistent log of SKUs that Ricky has explicitly signed off as unprofitable (acceptable losses) — these are skipped in future runs to stop the same SKU from being flagged every day.

### Trigger

Cron: daily at 09:00 UTC.

### Inputs

From BM API:
- All active listings: `GET /ws/listings` (paginate)
- For each listing: `GET /ws/listings/{uuid}/backbox` — competitor prices, buy box status

From Monday:
- For each listing UUID: find Main Board items in Listed status. Get parts cost, purchase cost.

From files:
- `/home/ricky/builds/bm-scripts/data/signed-off-unprofitable.json` — SKUs Ricky has signed off as acceptable losses. Schema: `[{ "product_id": "...", "grade": "...", "signed_off_at": "2026-01-01", "note": "..." }]`
- `/home/ricky/builds/buyback-monitor/sell-price-lookup.json` — expected sell prices by spec/grade (use as secondary reference if BackBox fails)

From constants:
- Labour rate: £24/hr
- Shipping: £15
- Margin threshold: 30%, Net profit threshold: £100

### Logic

1. Fetch all active listings from BM API.
2. For each listing:
   a. Check if product_id + grade combo is in signed-off-unprofitable.json. If yes: skip.
   b. Fetch BackBox data. Extract buy box price (lowest competitor). Note if we ARE or ARE NOT the buy box holder.
   c. Recalculate profitability at current buy box price using the same formula as Build 5.
   d. Determine: profitable (≥30% margin AND ≥£100 net) | marginal (profitable but below one threshold) | unprofitable.
   e. Note buy box status: holding | lost.
3. Compile report:
   - ✅ Profitable + holding buy box: not reported (noise reduction)
   - ⚠️ Profitable but lost buy box: flag with current price and buy box price
   - 🔴 Unprofitable or below threshold: flag with full numbers
4. If any flags: post to BM group:
   ```
   📊 Daily Profitability Check — [date]
   
   🔴 Unprofitable ([N]):
   • [device] Grade [X]: Cost £[Y], Buy box £[Z]. Margin: [X]%. Net: £[Y].
     [Sign off as acceptable] [Flag for review]
   
   ⚠️ Lost buy box ([N]):
   • [device] Grade [X]: Our price £[Y], Buy box now £[Z].
   
   ✅ [N] listings healthy.
   ```
5. Ricky can tap "Sign off as acceptable" inline button → appends to signed-off-unprofitable.json.
6. Log full run results.

### Outputs

- Slack report to BM group.
- Updated `signed-off-unprofitable.json` when Ricky signs off a SKU.
- Log at `/home/ricky/builds/bm-scripts/logs/profitability-check.log`.

### Error handling

- BackBox fetch fails for a listing: mark as "BackBox unavailable — skipped" in report.
- Monday data missing for cost calculation: use last known cost or flag as "cost unknown".
- signed-off-unprofitable.json unreadable: log error and treat it as empty (all SKUs checked).

### Dependencies

- BackBox API accessible (test with `backbox_audit.py`).
- `profitability.js` module from Build 5 (reuse).
- signed-off-unprofitable.json (create empty on first run).
- Monday cost columns confirmed.

### Estimated effort

Medium (1-2 days including signed-off log and inline approval flow).

### Files to create

- `/home/ricky/builds/bm-scripts/profitability-check.js`
- `/home/ricky/builds/bm-scripts/data/signed-off-unprofitable.json` (create empty: `[]`)
- Cron entry: `0 9 * * * node /home/ricky/builds/bm-scripts/profitability-check.js >> /home/ricky/builds/bm-scripts/logs/profitability-check.log 2>&1`

---

## Build 10: Intake Profitability Prediction

### What it does

When Roni completes grading (Top Case grade and Lid grade are both filled in on the Main Board), this script predicts the final grade the device will sell at (lowest of the two grades = worst grade wins), looks up the estimated sell price for that predicted grade from the pricing data, calculates predicted profit after all costs, and flags if the device is unlikely to be profitable before expensive repair work starts. The Not For Use (NFU) path adds a maximum investment cap: if the predicted board repair cost would exceed the cap and still leave the device unprofitable, it flags before repair begins.

### Trigger

Monday webhook: `status_2_mkmcj0tz` (Top Case grading column) OR `status_2_mkmc4tew` (Lid grading column) changes on Main Board `349212843`.

> Fire only when BOTH columns are non-empty. Logic: on each change, check if the other column is also set. If yes, run prediction. If no, do nothing yet.

> ⚠️ Register this as TWO specific Monday webhooks, one per column, each filtered to "when value is set" (not "any change"). Both call the same endpoint. Handler deduplicates (cache recent checks by itemId to avoid double-fire).

### Inputs

From Monday (fetch on webhook):
- `status_2_mkmcj0tz` — Top Case grade value
- `status_2_mkmc4tew` — Lid grade value
- Serial number (`text4`) — to confirm device model
- Purchase cost (what we paid customer) — column ID TBC from live board
- Parts cost estimate — from Parts Board (985177480) lookup for this device + predicted grade

From pricing data:
- `/home/ricky/builds/buyback-monitor/sell-price-lookup.json` — sell prices by model + spec + grade
- BackBox current buy box price for predicted product_id + grade (optional live check)

From constants:
- Labour rate: £24/hr, Shipping: £15
- Margin threshold: 30%, Net threshold: £100

### Logic

1. Webhook fires on Top Case or Lid grade column change.
2. Fetch both grade column values for the item.
3. If either is empty: exit. Wait for both.
4. If both set: deduplicate (check if prediction was already run for this itemId in last 10 min).
5. Determine predicted final grade:
   - Map Monday grade picker values to BM grade codes (e.g. "Grade A" → good, "Grade B" → fair, etc.)
   - Predicted grade = lowest of the two (harshest grade wins)
6. Look up predicted sell price:
   - Find device model from serial / Monday item name
   - Find product_id for this model (from BM Devices Board or listings cache)
   - Look up sell-price-lookup.json for product_id + predicted grade
   - If not in lookup: try a quick BackBox fetch for live price
   - If neither available: post warning "Cannot estimate sell price — manual review needed" and exit
7. Profitability calculation (same formula as Build 5):
   - Purchase cost + parts cost for predicted grade + labour + shipping vs estimated net revenue
8. **If predicted profit ≥ thresholds:** No action. Log prediction silently.
9. **If predicted profit < thresholds:**
   - Post Slack alert to BM group:
     ```
     ⚠️ Profitability warning: [device name]
     
     Predicted grade: [X] (Top Case: [A], Lid: [B])
     Est. sell price: £[X] | Est. net: £[X] | Margin: [X]%
     
     Threshold: ≥30% margin AND ≥£100 net
     
     Parts + labour = £[X]. Consider before starting repair.
     ```
   - Change Monday `status24` to a flag status (TBC with Ricky — possibly a dedicated "Check Profitability" status, or just leave and add Monday note/comment).
10. **NFU path (maximum investment cap):**
    - If device is NFU (Not For Use — logic board replacement needed, high labour), estimated board repair cost exceeds a cap (define cap: suggest £150 but confirm with Ricky).
    - If total investment would exceed cap AND still unprofitable: escalate with harder flag:
      ```
      🔴 NFU cap exceeded: [device]
      Board repair est: £[X] — exceeds £[cap] cap.
      Even at repair: margin [X]%. Not worth it.
      ```

### Outputs

- Slack alert if unprofitable prediction.
- Monday note/comment on the item with prediction summary.
- Silent log if profitable (no noise for the majority of healthy devices).

### Error handling

- Sell price data unavailable: warn Roni via Slack. Do not block workflow.
- Parts cost unavailable for this device: use £0 and note "parts cost unknown" in calculation.
- Both grade columns set to same value simultaneously (Roni fills both at once): deduplication cache handles this.

### Dependencies

- `sell-price-lookup.json` must be reasonably fresh (generated by `run_price_pipeline.py`). Consider scheduling the pipeline more regularly.
- `profitability.js` module from Build 5.
- NFU investment cap value confirmed with Ricky before deploying.
- Monday webhooks registered for both grade columns (specific trigger: when column value is set).

### Estimated effort

Medium (1-2 days).

### Files to create

- `/home/ricky/builds/icloud-checker/src/routes/grade-profitability.js` — webhook handler
- Reuses `/home/ricky/builds/icloud-checker/src/lib/profitability.js` (Build 5)

---

## Build 11: Sell Price Scraper Optimisation

### What it does

The current `sell_price_scraper.py` scrapes ~155 URLs (all M1+ MacBook product pages from the BM sitemap) and uses ~60-80 Massive/ClawPod credits per run. Credits reset monthly (1,000 free). Currently at 0 credits. The 63% failure rate means most runs produce unreliable data. This build reduces the scrape list to only active inventory SKUs (~30-40 URLs), fixing both the credit burn and the failure rate. Ricky has also flagged that the scraper approach has been wrong from the start — a redesign discussion is needed before implementing.

> ⚠️ **HOLD for Ricky confirmation before starting.** The scraper approach needs a design conversation first. The below is the scoped direction based on current understanding, but do not implement without sign-off.

### Trigger

Manual initially. Cron once redesign is confirmed and stable. Target: ≤30 Massive credits/day.

### Inputs

From BM API:
- All active listings: `GET /ws/listings` — extract unique product_ids for SKUs we actually list

From existing scraper:
- `sell_price_scraper.py` scrape logic — reuse URL construction and Nuxt payload parsing

### Logic

1. Before each scraper run: fetch current active listings from BM API.
2. Extract unique product_ids (these are the only SKUs we need sell prices for).
3. Map product_ids → product page URLs (using the existing URL pattern from `sell_price_scraper.py`).
4. Scrape only these URLs via Massive/ClawPod. Expected: 30-40 URLs vs current 155.
5. For each scraped page: extract all grades and prices (existing parsing logic in `sell_price_scraper.py` handles this).
6. Feed into existing `generate_sell_lookup.py` → `sync_to_sheet.py` pipeline unchanged.

### Fix for 63% failure rate

Likely causes (investigate before fixing):
- Massive/ClawPod session expiry mid-run
- Rate limiting causing empty responses treated as data
- Nuxt payload structure changes (BM site updates)

Minimum fix: add proper response validation before parsing. Log HTTP status and response size. Skip and flag (don't silently produce bad data) if response < expected minimum size.

### Outputs

- `sell-price-lookup.json` updated with fresh prices for active SKUs only.
- Google Sheet synced (existing `sync_to_sheet.py` unchanged).
- Credit usage log: how many Massive requests per run.

### Error handling

- Massive API returns error/empty: log + skip that URL. Report at end of run: "N/M URLs successfully scraped."
- Credit budget exceeded mid-run: stop and report remaining URLs.
- Response validation fails: flag bad URLs, do not write to lookup file.

### Dependencies

- Ricky sign-off on scraper redesign approach (HOLD until confirmed).
- Massive/ClawPod credits available (monthly reset; currently at 0).
- Active listings API call working.

### Estimated effort

Medium (1-2 days — but blocked on design discussion).

### Files to modify

- `/home/ricky/builds/buyback-monitor/sell_price_scraper.py` — add active-inventory filter, add response validation
- `/home/ricky/builds/buyback-monitor/run_price_pipeline.py` — update to pass active SKU list to scraper

---

## Build 12: BM Seller Portal Browser Agent

### What it does

A browser-based agent that logs into the BackMarket seller portal using a one-time login code retrieved from the `jarvis@icorrect.co.uk` inbox via IMAP. Once logged in, it reads customer messages and return requests, extracts return reasons and customer context, and posts a Slack alert to the BM group when a return is incoming — before the device physically arrives. This gives the team 2+ days of advance notice on returns instead of zero context. The agent can also read messages and action return steps when instructed.

> This is a separate build from the rest of the pipeline. It does not share infrastructure with the Express.js webhook handlers. It is standalone.

### Trigger

Manual initially (Hugo or Ricky triggers a run). Cron once stable: run twice daily (08:00 and 16:00 UTC) to catch incoming return notifications.

### Inputs

From IMAP (jarvis@icorrect.co.uk):
- BM login code email (subject: "Your BackMarket verification code" or similar)
- Read via IMAP — credentials in `/home/ricky/config/api-keys/.env` (verify IMAP_USER, IMAP_PASS keys exist)

From BM seller portal (browser):
- Customer messages section
- Return requests section
- For each return: reason, product, customer name, return tracking (if available)

### Logic

1. Navigate to BM seller portal login page.
2. Enter `jarvis@icorrect.co.uk` as login.
3. Portal sends verification code to that email.
4. Connect to IMAP, wait up to 60s for email with BM verification code subject. Extract code.
5. Enter code in portal. Confirm login.
6. Navigate to Returns section.
7. For each open return request:
   - Extract: product name, order ID, customer-provided reason, return status, tracking (if any)
8. Navigate to Messages section.
9. For each unread message:
   - Extract: sender (customer name/order ref), message content, timestamp
10. Compare against previously seen returns/messages (maintain a `seen-ids.json` cache to avoid re-alerting on same items).
11. For new items: post to BM Slack group:
    ```
    📬 BM Portal Update — [timestamp]
    
    New return request: [N]
    • [product] — [order ID]
      Reason: [customer reason]
      Status: [return status]
    
    New customer messages: [N]
    • [order ID]: "[message preview]"
    ```
12. Save updated `seen-ids.json`.
13. Close browser session.

### Outputs

- Slack alert with new returns and messages.
- `seen-ids.json` updated to prevent duplicate alerts.
- Log at `/home/ricky/builds/bm-portal-agent/logs/run.log`.

### Error handling

- IMAP login fails: Slack alert "BM portal agent: cannot connect to email. Manual check required."
- BM verification email not received within 60s: retry once. If still no email, alert and exit.
- Portal login fails: Slack alert with screenshot if possible.
- Portal layout changed (selector breaks): Slack alert "BM portal agent: selector failure. Needs update."
- No new items: post brief "📬 BM portal checked — nothing new." (confirms the run happened).

### Dependencies

- `jarvis@icorrect.co.uk` IMAP access confirmed and credentials in `.env`.
- Playwright or Puppeteer available on VPS (icloud-checker uses `ssr_spec_lookup.py` with Playwright — check if already installed).
- BM seller portal URL and login flow manually tested first.
- `seen-ids.json` created empty on first run.

### Estimated effort

Large (3-4 days including IMAP integration, portal navigation, and selector maintenance).

### Files to create

- `/home/ricky/builds/bm-portal-agent/src/index.js` — main agent script
- `/home/ricky/builds/bm-portal-agent/src/imap-reader.js` — IMAP login code fetcher
- `/home/ricky/builds/bm-portal-agent/src/portal-scraper.js` — Playwright browser logic
- `/home/ricky/builds/bm-portal-agent/data/seen-ids.json` — dedup cache (create empty: `{}`)
- `/home/ricky/builds/bm-portal-agent/logs/` — log directory
- Cron entry (once stable): `0 8,16 * * * node /home/ricky/builds/bm-portal-agent/src/index.js >> /home/ricky/builds/bm-portal-agent/logs/run.log 2>&1`

---

## Shared Infrastructure Notes

### Webhook server

All Monday webhook handlers can either:
1. Be added as routes to the existing icloud-checker Express server at `/home/ricky/builds/icloud-checker/src/index.js` (simplest — one service, one port 8010, one systemd unit)
2. Be a new Express server at a different port with its own systemd service

**Recommendation: add routes to icloud-checker.** It's the proven pattern, already has Monday + BM API integration, and avoids another service to manage.

If icloud-checker grows too large, extract BM webhook routes to `/home/ricky/builds/icloud-checker/src/routes/bm/` and import them.

### Monday webhook registration

For every webhook-triggered build:
- Register in Monday.com developer settings or via Monday API
- Use SPECIFIC triggers (not "any column changes")
- Each webhook needs a URL pointing to the VPS. Current icloud-checker URL: confirm from nginx config (likely `https://webhook.icorrect.co.uk/...` or similar — check `/etc/nginx/sites-enabled/`)
- All webhooks must respond with HTTP 200 within 10s or Monday retries. Offload slow work to async/background.

### Credential cleanup

BM API credentials are hardcoded in icloud-checker AND in `.env`. Before or during this work:
- Move all hardcoded BM API creds out of icloud-checker source files
- Source exclusively from `/home/ricky/config/api-keys/.env`
- Add a startup check: if required env vars are missing, fail fast with a clear error message

### Logging standard

All scripts should log:
```
[timestamp] [script-name] [action]: [detail]
```
Example: `2026-03-18T07:00:01Z [morning-briefing] SENT orders fetched: 8 orders in transit`

Failures should always include the raw error message (not just "something went wrong").

### Column ID config object

In every script that references Monday column IDs, put ALL column IDs at the top in a config object:
```js
// TODO: update all IDs for Main Board v2 when ready
const MONDAY_COLUMNS = {
  REPAIR_TYPE: 'status24',      // Pay-Out=12, Purchased=6, Listed=7, Sold=10, Counteroffer=3, To List=8
  STATUS: 'status4',            // Shipped=160, To Ship=156
  SERIAL: 'text4',
  COLOUR: 'status8',
  LISTING_ID: 'text_mkyd4bx3',  // BM Devices Board
  LISTING_UUID: 'text_mm1dt53s', // BM Devices Board
  SALES_ORDER_ID: 'text_mkye7p1c', // BM Devices Board
  TOP_CASE_GRADE: 'status_2_mkmcj0tz',
  LID_GRADE: 'status_2_mkmc4tew',
};

const MONDAY_BOARDS = {
  MAIN: '349212843',
  BM_DEVICES: '3892194968',
  PARTS: '985177480',
};
```

Never inline column IDs in logic code.

---

## Build Order for Code

Start with these in sequence (each is a dependency for the next):

1. **Build 1** (30 min) — Remove `updateBmTracking()` from dispatch.js. Unblocks Build 2.
2. **Build 3** (2-3h) — Instant payout. High-value, low complexity. Unblocks counter-offer module.
3. **Build 2** (2-3h) — Shipping confirmation. Completes the dispatch/ship split.
4. **Build 4 + 5** (3-5 days combined) — Listing automation. Build 4 first (Path A), then extend for Path B. Builds the shared infrastructure (colour map, grade map, listings cache, profitability module) that Builds 9 and 10 reuse.
5. **Build 7** (3-4h) — Morning briefing. Independent. Easy win for Roni.
6. **Build 8** (2-3h) — Reconciliation cron. Script exists, just needs wiring.
7. **Build 6** (3-4 days) — Counter-offer module. Depends on Build 3 being live.
8. **Build 9** (1-2 days) — Profitability check. Reuses Build 5 profitability module.
9. **Build 10** (1-2 days) — Intake prediction. Reuses Build 5 profitability module.
10. **Build 11** (hold) — Scraper optimisation. Wait for Ricky sign-off.
11. **Build 12** (3-4 days) — Portal agent. Independent, can be parallelised after critical builds are done.

---

*End of Phase 3 Build Brief. Questions to verify before starting: exact Monday column ID for BM order number, exact Monday column ID for tracking number, BM commission rate %, NFU investment cap, Ricky sign-off on scraper redesign approach.*
