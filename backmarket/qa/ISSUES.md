# BackMarket — Issue Log

Where agents (Hugo, etc.) file issues found in build artifacts for Claude Code to pick up. Ops-level fixes (restarts, credential rotations, reversible-in-30s changes) go in `docs/rollback-log.md` instead — this file is for bugs that need source-tracked code changes.

**Rule:** if you (the reporting agent) can't fix it with a config tweak or a service restart, log it here. **Do not patch build artifacts in your workspace** — the patch won't survive a session reset and will drift from git.

---

## How to file

Append a new section at the bottom using this template:

```
## YYYY-MM-DD — <one-line title>

**Reported by:** <agent name>
**Affected:** <file path(s) or service name>
**Symptom:** <what you observed>
**Repro:** <steps to reproduce, or example data that triggers it>
**Suspected cause:** <your best guess — can be empty>
**Impact:** <revenue leak / data drift / silent failure / cosmetic / blocker>
**Priority:** <urgent | normal | backlog>

**Context / notes:** <anything Claude Code will need to understand the fix scope>
```

Rules:
- **One issue per section.** If you find two separate bugs, log two entries.
- **Cite file paths with absolute paths where possible** — saves me a grep.
- **Include the BM order IDs, Monday item IDs, or serials** the issue touches if it's data-specific.
- **If you have a partial diagnosis, include it** — partial is fine, wrong guesses are fine, silence is not.

---

## Status markers

Once Claude Code picks up an issue, the section gets updated in-place with a status footer:

- `**Status:** CLAIMED by Claude Code on YYYY-MM-DD` — work started
- `**Status:** FIXED in commit <sha> — <branch>` — shipped
- `**Status:** WON'T FIX — <reason>` — rejected with reason
- `**Status:** DEFERRED — <reason>` — planned but not now

Once FIXED or WON'T FIX is marked, don't delete the entry — it's the audit trail.

---

## Open issues

## 2026-05-04 — Full automation audit status

**Reported by:** Codex
**Affected:** `scripts/sent-orders.js`, `scripts/list-device.js`, `scripts/lib/bm-api.js`, `scripts/lib/v7-scraper.js`, `services/bm-payout/index.js`, `services/bm-shipping/index.js`, `scripts/sale-detection.js`, `scripts/reconcile-listings.js`
**Symptom:** QA issues were spread across intake, listing, VPS sale detection, shipping, payout, notifications, and reconciliation, making it unclear which bugs were source-fixable vs live-ops/config issues.
**Repro:** Review this issue log against the source-tracked automation stages and run the unit suite.
**Suspected cause:** Control-plane behavior was split across code, services, Monday config, notifications config, and historical notes.
**Impact:** blocker / silent failure / operational churn
**Priority:** urgent

**Context / notes:** Source-tracked fixes landed in the working tree on 2026-05-04:
- SENT intake normalizes BM date-title variants and 2025 Air wording before device lookup, and warns when Main Board device relation would still be blank.
- Listing flow explicitly trusts exact registry-slot colour evidence, routes weak/loss economics to operator review, hardens live scrape waits/retry, blocks live listing on unreconciled scrape specs, and caches/time-bounds historical sales lookup.
- Payout and shipping services now write explicit Monday failure markers when hard gates or BM API calls block the automation.
- VPS sale detection and reconciliation align with the target trust rules: SKU-first sale matching, dry-run-default reconciliation, and shared listing IDs valid only for exact spec pools.
- Telegram sends on critical BM paths now read `BM_TELEGRAM_CHAT` from env and surface Telegram API errors instead of swallowing them.

**Status:** CLAIMED by Codex on 2026-05-04 — source fixes applied; live cron/Monday-board checks and shared notifications-area migration still need ops verification.

---

## 2026-04-23 — Scraper grade data is noise

**Reported by:** Hugo
**Affected:** `buyback-monitor/data/sell-prices-latest.json`, any consumer of `models[*].grades.*`
**Symptom:** Grade-level pricing data from the scraper is unreliable / noisy, causing downstream pricing decisions to be based on bad inputs.
**Repro:** See `backmarket/docs/pricing-architecture.md` on branch `fix/sold-price-lookup` for the full discovery trail.
**Suspected cause:** Scraper is picking up sold-price data that doesn't correctly map to grade tiers.
**Impact:** data drift / revenue leak
**Priority:** normal — fix already built on `fix/sold-price-lookup`, not yet merged.

**Context / notes:** The discovery work is documented on the branch. Merge and verify against live listings before closing.

---

## 2026-04-23 — iCloud-checker silent failure mode

**Reported by:** Hugo
**Affected:** `icloud-checker` service (port 8010), intake comments on Monday
**Symptom:** Every intake posted iCloud status only, with no spec-match comment. iCloud appeared "clean" but spec matching was silently skipped.
**Repro:** Check intake items between 2026-04-15 and 2026-04-22 — missing spec-match comments despite iCloud being clean.
**Suspected cause:** Expired DataImpulse proxy password caused the spec-match lookup to fail silently; only the iCloud status (which uses a different path) succeeded.
**Impact:** silent failure / data drift
**Priority:** normal — fixed in commit `6049877` on branch `feat/agents-removed`, needs merge.

**Context / notes:** The fix is in `feat/agents-removed` commit `6049877`. Verify proxy rotation is robust before closing.

---

## 2026-04-23 — matchByListingId() picks wrong device when multiple share a listing slot

**Reported by:** Hugo
**Affected:** `dispatch.js` (shipping confirmation), `sent-orders.js` (order creation)
**Symptom:** When multiple physical devices share the same BM listing_id (same SKU/grade), `matchByListingId()` returns the first unshipped BM Devices item, not the one actually linked to the current sale. This causes tracking to be written to the wrong Main Board item and BM order confirmation to fail or go to the wrong device.
**Repro:** 
- Order 79840346 (Louis San Antonio, listing_id 5500817) → matched BM 1127 instead of BM 1554
- Order 79852451 (Michal Kosakowski, listing_id 5008999) → matched BM 1137/BM 1311 instead of BM 1574
- Orders 79840346 and 79852451 had tracking written to wrong Main Board items; Tilly (BM 1588) and Dan (BM 1591) had empty Sales Order ID on linked BM Devices items
**Suspected cause:** `matchByListingId()` only filters by `listing_id` + `text53` (tracking) empty. It doesn't check if the BM Devices item already has a `text_mkye7p1c` (Sales Order ID) populated, which would indicate the active sale.
**Impact:** revenue leak / silent failure — orders not confirmed to BM, wrong devices marked shipped
**Priority:** urgent

**Context / notes:** 
- The `board_relation` link between BM Devices and Main Board is the path the script follows.
- `sent-orders.js` writes the BM order ID to `text_mkye7p1c` on the BM Devices item — this could be used as a secondary match criteria.
- Alternative: write Main Board item ID to a column that `dispatch.js` can match directly, bypassing the listing_id ambiguity.
- Related: `memory/feedback_board_relation_ship_confirm.md` documents the silent skip when `board_relation` is missing entirely.

**Status:** CLAIMED by Codex on 2026-05-04 — current `sale-detection.js` is SKU-first and writes BM order/listing IDs directly to Main Board columns for shipping; `bm-shipping` no longer traverses the wrong `board_relation5` path.

---

## 2026-04-23 — QC To List Watch cron erroring since ~2026-03-10

**Reported by:** Hugo
**Affected:** QC To List Watch cron job
**Symptom:** Cron has been erroring since approximately 2026-03-10. Devices ready for listing may not be getting flagged.
**Repro:** Check cron logs for QC To List Watch since 2026-03-10.
**Suspected cause:** Unknown — needs log inspection.
**Impact:** silent failure — devices sitting in QC done state not being flagged for listing
**Priority:** normal

**Context / notes:** First noted in MEMORY.md on 2026-03-16. No further investigation done yet.

---

## 2026-04-23 — n8n Flow 6 skips items where text4 (buyer name) is non-empty

**Reported by:** Hugo
**Affected:** n8n Flow 6 (listing/return matching automation)
**Symptom:** Returned or relisted devices always need manual matching because Flow 6 skips any item where `text4` (buyer name) is already populated.
**Repro:** Attempt to match a returned device through Flow 6 — it will be skipped if buyer name exists.
**Suspected cause:** Flow logic treats non-empty buyer name as "already processed".
**Impact:** data drift / manual work — every return/relist requires manual intervention
**Priority:** normal

**Context / notes:** This may be intentional (to prevent overwriting) but it's causing operational overhead. Review whether the skip condition should be more nuanced (e.g., check status instead of buyer name).

**Status:** WON'T FIX — n8n/Flow 6 is retired. Sale detection must stay on the VPS path in `scripts/sale-detection.js`; do not spend time repairing old n8n flow behavior.

---

## 2026-04-23 — Reconciliation script UUID count bug at line 242

**Reported by:** Hugo
**Affected:** Reconciliation script (exact file path TBC)
**Symptom:** UUID count display is incorrect at line 242. Display-only bug.
**Repro:** Run reconciliation script and observe UUID count output.
**Suspected cause:** Off-by-one or incorrect array length reference.
**Impact:** cosmetic — doesn't affect actual matching logic
**Priority:** backlog

**Context / notes:** First noted in MEMORY.md. Low priority since it doesn't affect actual reconciliation.

---

## 2026-05-03 — SOP 06 reused-slot verifier blocks trusted colour matches on title omission

**Reported by:** Codex
**Affected:** `/home/ricky/builds/backmarket/scripts/list-device.js`
**Symptom:** A reused exact registry slot can fail live verification with `TITLE COLOUR MISMATCH` even when the slot `product_id`, canonical SKU lineage, and vetted listing data all indicate the correct colour. Public BM titles do not always carry colour text, so title omission is being treated as a hard mismatch.
**Repro:** `BM 1549 ( Lily Doherty )` dry-run/live reuse path against registry slot `5606597` / product `b5ebc79d-0304-41a6-b1ae-d2a487afa11f`. Device colour is `Space Grey`; slot lineage is the grey variant; verifier still hard-fails because the public title omits colour.
**Suspected cause:** `verifyListing()` only skips title-colour enforcement when `colourVerifiedByCatalog` is set, but reused/manual slot paths are not carrying enough trust to bypass title colour checks.
**Impact:** blocker / operational churn — exact slot reuse is prevented even when colour is already provable from trusted catalog/registry evidence.
**Priority:** urgent

**Context / notes:** Colour should be trusted from `product_id` + canonical SKU lineage + vetted slot data when those agree. Title colour should be fallback evidence, not a hard gate, on an exact trusted reused slot.

**Status:** CLAIMED by Codex on 2026-05-04 — live verification now passes explicit `colourVerifiedByTrustedSlot` evidence for registry slots instead of depending on public-title colour text.

---

## 2026-05-03 — SOP 06 profit loss-makers hard-block instead of routing to human review

**Reported by:** Codex
**Affected:** `/home/ricky/builds/backmarket/scripts/list-device.js`
**Symptom:** Devices with negative or weak profitability are returned as `BLOCK`, which prevents normal live/manual review workflows even when ops explicitly wants to list at proposed price. The only reason a listing should hard-block is identity/trust mismatch, not economics.
**Repro:** `BM 1549 ( Lily Doherty )` returns `BLOCK — Loss at min_price`; multiple other queue items hit the same decision gate even when identity resolution is clean.
**Suspected cause:** `decisionGate()` treats negative net or below-threshold margin as `BLOCK` rather than a review state.
**Impact:** blocker / manual churn — ops has to bypass the script instead of using the normal listing workflow to review and publish loss-makers.
**Priority:** urgent

**Context / notes:** Economics should route to `REVIEW` / `PROPOSE` with explicit warning text. Only spec/colour/grade/listing trust mismatches should remain hard blockers.

**Status:** CLAIMED by Codex on 2026-05-04 — economics now stays in `PROPOSE`/review and requires an operator override before live execution.

---

## 2026-05-03 — Trusted listing catalog and SKU remap drift allows stale slot ownership

**Reported by:** Codex
**Affected:** `/home/ricky/builds/backmarket/scripts/build-listings-registry.js`, `/home/ricky/builds/backmarket/scripts/lib/resolver-truth.js`, `/home/ricky/builds/backmarket/scripts/lib/frontend-url-map.js`, `/home/ricky/builds/backmarket-browser/scripts/export-frontend-url-map.js`
**Symptom:** Listing ownership and slot trust drift over time because colour/grade/spec/model alignment is not being remapped into one trusted exact catalog. That leaves offline/reused listing slots attached to the wrong BM Devices row on Monday and forces repeated manual triage.
**Repro:** `listing_id 5606597` remained attached to `BM 1303` on Monday while `BM 1549` resolved to the same exact slot via registry/product lineage. Similar drift is visible in `captured_spec_mismatch` evidence and in queue items that still carry stale listing linkage.
**Suspected cause:** Browser capture evidence, registry trust, and Monday slot ownership are not being reconciled into one exact canonical map with one-owner-per-listing-id enforcement.
**Impact:** data drift / repeated operational churn — the team keeps revisiting the same SKU/listing ambiguity and cannot trust reused slots.
**Priority:** urgent

**Context / notes:** Required outcome is a trusted catalog where canonical SKU fully encodes model/spec/grade/colour, ambiguous/shared slots are surfaced for repair, and a live/reused `listing_id` has exactly one BM Devices owner on Monday at a time.

**Status:** DEFERRED — source guardrails are improved, but full ownership repair requires a live Monday/browser-capture reconciliation run.

---

## 2026-04-23 — Monday formula_mm0za8kh (Total Costs) always returns null

**Reported by:** Hugo
**Affected:** Monday.com board — `formula_mm0za8kh` column (Total Costs)
**Symptom:** The Total Costs formula column always returns null, requiring manual reconstruction.
**Repro:** View any item on the Main Board — Total Costs column is empty.
**Suspected cause:** Formula references a column that doesn't exist or has wrong type.
**Impact:** data drift / manual work — margin calculations need manual cost reconstruction
**Priority:** normal

**Context / notes:** The workaround is to reconstruct costs manually from parts + labour columns. A fix would need to update the Monday formula or replace it with an automation.

---

_(None yet — add below this line.)_

## 2026-04-24 — SOP 06 single-page scrape is brittle against BM/Cloudflare session behaviour

**Reported by:** Hugo
**Affected:** `/home/ricky/builds/backmarket/scripts/lib/v7-scraper.js`, `/home/ricky/builds/backmarket/scripts/list-device.js`
**Symptom:** `list-device.js` Step 5 live market scrape intermittently fails with redirect / aborted / closed-context browser errors, then falls back noisily and slowly.
**Repro:** Run SOP 06 listing flow on items that need the live scrape. Observed failures include `ERR_TOO_MANY_REDIRECTS`, `ERR_ABORTED`, and `Target page, context or browser has been closed` while scraping `.../p/placeholder/{product_id}?l=10`.
**Suspected cause:** `scrapeSingleProduct()` launches a brand new Playwright browser for each item, does homepage warmup, then product-page navigation, then relies on fixed `waitForTimeout()` delays instead of waiting on concrete page state / `__NUXT_DATA__`. BM / Cloudflare appears unstable against repeated fresh headless sessions.
**Impact:** silent degradation / slow listing flow — market reference enrichment becomes fragile and noisy even when product resolution is correct
**Priority:** normal

**Context / notes:**
- Code path: `list-device.js` Step 5 → `getLiveMarketData(...)` → `scrapeWithFallback(...)` → `scrapeSingleProduct(...)`
- Current scrape flow uses:
  - fresh browser launch per item
  - homepage warmup
  - product page goto
  - fixed sleeps (`waitForTimeout`) before parsing `script#__NUXT_DATA__`
- `v7-scraper.js` already has batch primitives (`launchBatchBrowser()`, `scrapeWithContext()`) that suggest the intended hardening path: reuse one browser/context for the run instead of relaunching per item.
- Recommended fix scope:
  - reuse one browser/context across the listing run
  - wait for actual `__NUXT_DATA__` / concrete selector instead of fixed sleeps
  - retry once on transient navigation failure, then fallback fast

**Status:** CLAIMED by Codex on 2026-05-04 — `v7-scraper.js` now waits for `__NUXT_DATA__`, retries transient page failures once, and lazily loads browser dependencies so non-browser tests do not fail when Playwright is absent.

## 2026-04-24 — SOP 06 historical sales lookup scans too much BM order history on cold cache

**Reported by:** Hugo
**Affected:** `/home/ricky/builds/backmarket/scripts/lib/bm-api.js`, `/home/ricky/builds/backmarket/scripts/list-device.js`
**Symptom:** `list-device.js` Step 6b can sit at “Looking up historical sales...” for a long time on first uncached lookup, and outer process timeouts can kill the run before completion.
**Repro:** Run SOP 06 on an item with cold process cache for product_id + grade history. `fetchSalesHistory(productId, grade, days=90)` paginates BM sell-side orders for both state `9` and state `4`, then filters locally after fetching.
**Suspected cause:** `fetchSalesHistory()` uses an inefficient fetch-everything-then-filter design:
- scans two order states (`9`, `4`) every cold lookup
- no request timeout
- no disk cache in the active path
- no progress logging
- no early stop once pages are entirely older than cutoff
- local in-memory cache only helps later lookups in the same process
**Impact:** slow listing flow / timeout risk — first-run history enrichment looks hung and can be killed before pricing context is returned
**Priority:** normal

**Context / notes:**
- Code path: `list-device.js` Step 6b → `fetchSalesHistory(...)`
- Current implementation loops all pages for each target state, checks `order.date_creation` against cutoff only after the page is already fetched, and continues paging until `data.next` ends.
- BM API also returns only 10 items/page regardless of requested `page_size`, which makes full-history scans especially expensive.
- Recommended fix scope:
  - add persisted disk cache, not just process memory
  - add hard request / overall lookup timeout
  - stop paging once pages are older than cutoff
  - query one state first, expand only if needed
  - add progress logging so it is obvious the lookup is alive

**Status:** CLAIMED by Codex on 2026-05-04 — `fetchSalesHistory()` now has persisted disk cache, request/overall timeouts, early stop on old pages, and state expansion only when the first state has no matching product/grade signal.

## 2026-04-24 — SENT trade-in orders are creating Main Board items without device relation

**Reported by:** Hugo
**Affected:** `/home/ricky/builds/backmarket/scripts/sent-orders.js`, SOP 01 trade-in intake flow
**Symptom:** New SENT trade-in orders are being created on Monday, but the Main Board device field / `board_relation5` is blank. This leaves the team without the linked device entry and breaks downstream operational clarity.
**Repro:** Recent Main Board items created from SENT orders have blank `board_relation5`, including:
- `GB-26172-NXOSW` → `BM 1611`
- `GB-26162-YBLJV` → `BM 1612`
- `GB-26173-HDFDI` → `BM 1614`
- `GB-26173-AIIDM` → `BM 1615`

The script creates the order, but `board_relation5` is only written when device lookup succeeds:
- `buildPreparedOrderData()`
- `extractBMModel(deviceTitle)`
- `BM_TO_DEVICE_MAP[bmModel]`
- `findDeviceItemByName(mappedDeviceName)`
- then conditional write: `if (matchedDevice?.id) mainBoardColumns.board_relation5 = ...`

**Suspected cause:** Device lookup is brittle and now misses live BM title variants.
- BM titles are arriving with date strings instead of the mapped friendly labels, for example:
  - `MacBook Pro 14" (2021-01-01T00:00:00+00:00) ...`
  - `MacBook Air 13" (2020-01-01T00:00:00+00:00) ...`
- Those produce `bmModel` strings that do not exist in `BM_TO_DEVICE_MAP`
- Newer live wording also appears unmapped, for example:
  - `MacBook Air 13" (Early 2025)`
  - lookup board contains `MacBook Air 13 M4 A3240`, but no current `BM_TO_DEVICE_MAP` entry resolves to it

**Impact:** silent failure / operational friction — team loses device linkage on new trade-ins, and any downstream process relying on the device relation is weakened
**Priority:** urgent

**Context / notes:**
- This is specifically the Main Board device relation path, not the BM Devices item creation path.
- Verified lookup behavior:
  - `GB-26162-YBLJV` title → `MacBook Pro 14 (2021-01-01T00:00:00+00:00)` → no map hit
  - `GB-26172-NXOSW` title → `MacBook Air 13 (2020-01-01T00:00:00+00:00)` → no map hit
  - `GB-26173-HDFDI` title → `MacBook Air 13 (Early 2025)` → no map hit, despite lookup-board item `MacBook Air 13 M4 A3240` existing
  - `GB-26173-AIIDM` title → `MacBook Pro 14 (Late 2023)` → map hit and relation confirmed via `linked_items`; earlier null `text`/`value` read was a false alarm
- Recommended fix scope:
  - normalize BM year/date variants before `BM_TO_DEVICE_MAP` lookup
  - add missing live-title mappings, including current 2025 wording
  - emit explicit warning / Telegram alert when device lookup fails instead of silently creating blank relation
  - query `linked_items` when validating Monday board-relation columns, because `text` / `value` may stay null even when the relation exists

**Status:** CLAIMED by Codex on 2026-05-04 — `sent-orders.js` now normalizes ISO-date title variants, adds the 2025 Air mapping, and warns via Telegram when a relation would still be blank.

## 2026-04-24 — Shipping webhook is live but failing operationally, forcing manual BM confirmation

**Reported by:** Hugo
**Affected:** `/home/ricky/builds/backmarket/services/bm-shipping/index.js`, SOP 09.5 shipment confirmation flow
**Symptom:** Monday `status4` changes to `Shipped` are reaching the webhook service, but recent real orders still required manual BM shipment confirmation because the webhook hit hard-gate failures instead of completing the flow.
**Repro:**
- Service is live on `127.0.0.1:8013` and receiving Monday webhook traffic
- Recent Monday items show manual recovery comments instead of normal automation success comments:
  - Main Board item `11677042523` — `BM 1588 (Tilly Luckett)`
    - `status4`: `Shipped`
    - update on `2026-04-23T03:12:36.000Z`: `✅ BM notified of shipment [MANUAL - 2026-04-23]`
    - note: `Reason: webhook hard-gate failure`
  - Main Board item `11707523961` — `BM 1591 (Buyer: Daniel Powell / Ship to: Dan Powell)`
    - `status4`: `Shipped`
    - update on `2026-04-23T03:12:50.000Z`: `✅ BM notified of shipment [MANUAL - 2026-04-23]`
    - note: `Reason: webhook hard-gate failure`
- Service logs also show real blocked runs, for example:
  - `no BM order ID on devices board item 3926457177`
  - `no tracking number found`
**Suspected cause:** The service has hard dependency gates on linked Monday data being present and correct, especially BM Devices relation, BM order ID, tracking number, and serial number. When those inputs are missing or mismatched, the webhook does not complete and ops has to push tracking/serial to BM manually.
**Impact:** silent failure / operational friction / seller-score risk — orders can sit in Monday as `Shipped` without BM being notified unless someone manually recovers them
**Priority:** urgent

**Context / notes:**
- Normal success marker in code is a Monday update containing `✅ BM notified of shipment [...]`
- The issue is not service uptime. It is outcome failure on real orders.
- This likely overlaps with upstream matching/data-link issues already logged, especially wrong-device matching and missing relations/order IDs.
- Recommended fix scope:
  - enumerate every hard gate before BM API call and emit explicit failure reason to Monday/Telegram
  - reduce reliance on ambiguous listing-based matching
  - verify linked BM Devices item always carries BM order ID before dispatch stage
  - add a post-run audit that flags `status4 = Shipped` items with no automation success marker within a short window

**Status:** CLAIMED by Codex on 2026-05-04 — `bm-shipping` now writes Monday failure markers for missing tracking, serial, BM Sales Order ID, and BM API failures. A post-run audit still needs a live scheduled/check script.

## 2026-04-24 — Payout webhook is live but lacks recent outcome evidence proving automation success

**Reported by:** Hugo
**Affected:** `/home/ricky/builds/backmarket/services/bm-payout/index.js`, SOP 03b trade-in payout flow
**Symptom:** The payout webhook service is healthy on port `8012`, but recent operational evidence does not prove that Monday `status24 -> Pay-Out` changes are actually completing automated payout validation to BM and writing the expected Monday outcome markers.
**Repro:**
- Service is live on `127.0.0.1:8012` with healthy `/health`
- Expected automation markers from code are:
  - Monday status update to `Purchased`
  - Monday comment starting `✅ Payout validated`
- Recent Monday items with `status24 = Purchased` exist, for example:
  - Main Board item `11419141821` — `BM 1522 ( Catherine Gauld )`
    - `status24`: `Purchased`
    - BM trade-in ID in `text_mky01vb4`: `GB-26087-AWKZR`
- But recent updates inspected on those items do not show the expected `Payout validated` comment, so the board state alone does not prove the webhook performed the action
- Ricky also reports payout is not working in practice, with team handling payouts manually
**Suspected cause:** Unknown yet. The service is deployed, but either payout events are not reaching it, they are being blocked by pre-flight gates, or success/failure is not being written back in a reliably auditable way.
**Impact:** silent failure / operational friction / payout-risk — irreversible BM payout action may depend on manual handling with no clean automated audit trail
**Priority:** urgent

**Context / notes:**
- This is an operational-verification issue first, not yet a pinpointed code bug.
- Pre-flight checks in code include BM Trade-in ID present, iCloud not locked, and status still being valid when webhook executes.
- Recommended fix scope:
  - inspect recent webhook logs for real payout attempts, not just startup/health logs
  - confirm whether Monday webhook is still pointed at `/webhook/bm/payout`
  - emit explicit Monday/Telegram failure markers whenever payout pre-flight blocks execution
  - add an auditable reconciliation check for items moved to `Pay-Out` that do not gain `Purchased` + `Payout validated` within expected time

**Status:** CLAIMED by Codex on 2026-05-04 — `bm-payout` now writes Monday failure markers for stale webhook, missing trade-in ID, iCloud lock, and BM API failures. Live webhook/log verification remains required.

## 2026-05-03 — Reused exact slots hard-block on title colour omission even when colour is already trusted

**Reported by:** Codex
**Affected:** `/home/ricky/builds/backmarket/scripts/list-device.js`
**Symptom:** SOP 06 can refuse to reuse an exact trusted slot because the public listing title omits colour text, even when the slot `product_id`, SKU lineage, and vetted/export data already prove the slot colour.
**Repro:**
- Main item `11507101485` — `BM 1549 ( Lily Doherty )`
- Expected SKU: `MBA.A2337.M1.7C.8GB.256GB.Grey.Fair`
- Resolver/registry points to slot `5606597`, product `b5ebc79d-0304-41a6-b1ae-d2a487afa11f`
- Live verification raised `⛔ TITLE COLOUR MISMATCH` because the listing title omitted `Space Grey`, then took the listing back offline
- Repo-local vetted/export data for `5606597` still maps the slot to the grey variant
**Suspected cause:** `verifyListing()` falls back to title-based colour matching unless `colourVerifiedByCatalog` is set. Reused registry slots are not carrying enough trusted colour context into that verification path.
**Impact:** blocker / operational friction — trusted exact slots cannot be reused cleanly, forcing manual work and repeated false mismatch loops
**Priority:** urgent

**Context / notes:**
- This is not evidence that slot `5606597` is the wrong colour. It is evidence that title-only colour verification is too strict for trusted reused slots.
- Correct trust order should be: exact `product_id` + canonical SKU lineage + vetted/export colour > public title wording.
- Any fix must preserve hard blocks for real colour mismatches, not just missing colour text in titles.

**Status:** CLAIMED by Codex on 2026-05-04 — live verification now passes explicit trusted-slot colour evidence for registry slots.

## 2026-05-03 — Profit losses are treated as hard BLOCK instead of operator review

**Reported by:** Codex
**Affected:** `/home/ricky/builds/backmarket/scripts/list-device.js`
**Symptom:** SOP 06 hard-blocks devices purely because `net < 0` at `min_price`, even when identity, catalogue resolution, and slot trust are otherwise clean.
**Repro:**
- `BM 1549 ( Lily Doherty )` dry-run: trusted resolver hit, trusted scrape, valid slot, but `Decision: BLOCK — Loss at min_price`
- Same pattern observed on other clean identity cases where ops may still choose to publish manually
**Suspected cause:** `decisionGate()` returns `BLOCK` for negative net and other profit thresholds, instead of routing those cases to a review/propose state.
**Impact:** blocker / operational friction — ops cannot move forward on reviewed loss-makers without side-stepping SOP 06
**Priority:** urgent

**Context / notes:**
- User requirement is that only identity/trust mismatches should hard-block live listing.
- Profitability failures should downgrade to review, not outright block.
- This issue is separate from resolver/catalog trust: a listing can be commercially bad while still being operationally safe to publish with operator approval.

**Status:** CLAIMED by Codex on 2026-05-04 — profitability failures now stay in `PROPOSE`/review and require operator override before live listing.

## 2026-05-03 — Trusted listing ownership and canonical SKU remap are still drifting across browser capture, registry, and Monday

**Reported by:** Codex
**Affected:** `/home/ricky/builds/backmarket/scripts/build-listings-registry.js`, `/home/ricky/builds/backmarket/scripts/lib/resolver-truth.js`, `/home/ricky/builds/backmarket/scripts/lib/frontend-url-map.js`, `/home/ricky/builds/backmarket-browser/scripts/export-frontend-url-map.js`
**Symptom:** Model/spec/grade/colour alignment is not strong enough across the trusted slot catalogue, browser capture exports, and Monday BM Devices ownership. This causes repeated ambiguity about which listing slot should be reused and whether rows sharing a listing slot are truly in the same exact canonical SKU pool.
**Repro:**
- Queue/relist work repeatedly loops on the same MacBook Air / MacBook Pro slots because colour/spec/grade trust is split across resolver truth, browser-captured URL maps, and stale Monday listing ownership
- Reused/offline slot `5606597` remained attached to `BM 1303` on Monday while `BM 1549` wanted to reuse the same exact slot
- Browser capture already stores mismatch evidence (`captured_spec_mismatch`) but it is not yet feeding a stronger canonical remap / repair flow
**Suspected cause:** Canonical SKU matching and listing ownership are not being rebuilt from one fully trusted source. Ambiguous/shared slot mappings are surfaced inconsistently, and Monday can retain stale listing ownership after a device returns to `To List`.
**Impact:** data drift / blocker / repeated manual loops — ops revisits the same slot ambiguity instead of relying on a stable trusted catalogue
**Priority:** urgent

**Context / notes:**
- User requirement is explicit:
  - remap SKUs so colour + grade + spec + model are exact again
  - map out which listing each canonical SKU should use
  - maintain a trusted catalogue so this ambiguity does not recur
- Correct ownership rule:
  - multiple BM Devices rows may share one `listing_id` only when they are the same exact canonical SKU pool
  - the bug is not “more than one owner exists”; the bug is “pool membership is untrusted or drifts after relist/status changes”
  - shared `listing_id` is INVALID only when model/spec/grade/colour drift exists inside that pool
- Fix scope should surface ambiguous/shared slot mappings explicitly and make it obvious when shared slot use is valid vs invalid.

**Status:** DEFERRED — source guardrails are improved, but final ownership repair requires live Monday/browser-capture reconciliation.

---

## 2026-05-03 — Frontend scrape targets are not yet canonical per exact model/spec/colour/grade combination

**Reported by:** Codex
**Affected:** `/home/ricky/builds/backmarket/scripts/lib/frontend-url-map.js`, `/home/ricky/builds/backmarket-browser/scripts/export-frontend-url-map.js`, `/home/ricky/builds/backmarket/data/listing-frontend-url-map.json`
**Symptom:** Browser-captured frontend URLs exist, but they are not yet enforced as one trusted scrape target per exact canonical listing combination. That leaves open the risk of scraping the wrong public page or using the wrong picker state when model/spec/colour/grade alignment has drifted.
**Repro:**
- Current browser capture system stores both trusted matches and mismatch evidence (`captured_spec_mismatch`)
- Listing reuse/review still falls back through mixed evidence paths instead of one canonical frontend scrape target keyed to exact model + spec + colour + grade
- `BM 1446` / `BM 1549` class issues show how a captured or historical slot can point at the right family while still needing exact variant trust
**Suspected cause:** Frontend URL capture is being exported as evidence, but not yet promoted into a strict canonical scrape-target catalogue with exact variant ownership rules.
**Impact:** data drift / blocker — live market checks can scrape a product-family page that is not fully trusted as the exact model/spec/colour/grade target.
**Priority:** urgent

**Context / notes:**
- User requirement is explicit: we need the correct frontend scrape target for each exact device/model/spec/colour/grade combination.
- That target may be `URL + trusted picker state`, not necessarily a literally unique URL for every grade.
- Mismatch captures should remain triage evidence only.
- Trusted captures should become the primary scrape target source once exact canonical mapping is proven.

**Status:** CLAIMED by Codex on 2026-05-04 — trusted frontend captures are used as scrape targets, scrape verification now waits for concrete NUXT evidence, and live listing is blocked unless RAM/SSD/colour/grade/product evidence reconciles. Full catalogue promotion still needs live capture export.

---

## 2026-05-03 — Listing trust rules need explicit tightening across sale-detection and reconciliation

**Reported by:** Codex
**Affected:** `/home/ricky/builds/backmarket/scripts/sale-detection.js`, `/home/ricky/builds/backmarket/scripts/reconcile-listings.js`, related SOP docs
**Symptom:** Operational rules are being remembered loosely in chat rather than encoded tightly: sale matching, shared listing ownership, and auto-offline behavior are not being described with the exact boundaries ops wants.
**Repro:** During 2026-05-03 listing triage, three rules had to be re-tightened verbally:
- sale detection should match by SKU only
- shared `listing_id` is valid only for an exact canonical SKU pool
- reconciliation should auto-offline only true model/spec/grade/colour mismatches, not generic state drift
**Suspected cause:** Control-plane rules are split across code, SOPs, and operator memory, so the practical invariants are easy to blur.
**Impact:** repeated operational loops / wrong fixes applied / trust drift
**Priority:** urgent

**Context / notes:**
- Tight target rules:
  - `sale-detection.js` remains SKU-first; `listing_id` is secondary metadata, not the primary sale identity
  - multiple devices may share one `listing_id` only if they are exact canonical SKU matches
  - reconciliation should route generic Monday/BM state disagreement to review / reset flows, and reserve auto-offline for true identity mismatches

**Status:** CLAIMED by Codex on 2026-05-04 — VPS sale detection is SKU-first and reconciliation is dry-run-default with exact-spec shared-slot checks. n8n/Flow 6 is retired and should not be repaired.

---

## 2026-05-04 — Notifications area and Telegram/Slack mapping drift

**Reported by:** Ricky / Codex
**Affected:** `scripts/lib/notifications.js`, `scripts/notifications-health.js`, `scripts/list-device.js`, `scripts/sent-orders.js`, `scripts/sale-detection.js`, `services/bm-shipping/index.js`, `services/bm-payout/index.js`, `scripts/lib/slack.js`
**Symptom:** Telegram notifications are not reliably arriving, and Slack/Telegram destination mapping is spread across individual scripts/services instead of one notifications area.
**Repro:** Listing/shipping/payout paths can execute without an obvious Telegram delivery failure because some call sites use hardcoded chat IDs and only log network exceptions.
**Suspected cause:** Notification routing is duplicated per automation path; `BM_TELEGRAM_CHAT` / Slack channel mapping is not centralized or audited.
**Impact:** silent failure / operational blindness — the automation can complete or block without the team seeing the expected confirmation.
**Priority:** urgent

**Context / notes:** Source fix on 2026-05-04: `scripts/lib/notifications.js` is now the canonical BM notifications module. It owns `BM_TELEGRAM_CHAT`, sales/trade-in/dispatch/grade-check Slack channel defaults, Telegram/Slack API response validation, Slack webhook fallback, and `notificationHealthCheck()`. `scripts/notifications-health.js` prints the live wiring state and supports `--probe` for Telegram `getMe` / Slack `auth.test` without sending chat messages. Main BM notification senders now use this module instead of hardcoded routing.

**Status:** CLAIMED by Codex on 2026-05-04 — shared notifications area implemented in source; remaining work is live VPS env verification for `TELEGRAM_BOT_TOKEN`, `BM_TELEGRAM_CHAT`, and Slack token/channel access.

---

## 2026-05-04 — QC handoff and To List approval card automation missing

**Reported by:** Ricky / Codex
**Affected:** `scripts/qc-generate-sku.js`, `scripts/list-device.js`, `scripts/listing-bot.js`, Monday webhooks / QC To List Watch
**Symptom:** The intended QC-to-listing handoff is not fully automated. When Ronny changes a repaired BM device to "Ready to Collect", that should be treated as "past QC" and should generate/write the canonical BM SKU so the item is ready for listing. Separately, when the Main Board Repair Type / `status24` changes to "To List", the automation should run an SOP 06 dry-run/card JSON and post the listing approval card to the BackMarket Telegram Listings topic for approve/override/skip.
**Repro:** Current source shows the building blocks are present but not wired as event-driven automation:
- `scripts/qc-generate-sku.js` can compute and optionally write BM Devices `text89`, but it is a manual CLI helper (`--item`, optional `--write`).
- `scripts/listing-bot.js` can fetch all current "To List" rows and post approval cards, but it is an interactive polling bot, not a Monday webhook triggered by a specific `status24 -> To List` change.
- The existing open "QC To List Watch cron" issue only says the cron is failing; it does not cover the desired trigger chain or listing-card behavior.
**Suspected cause:** QC handoff and listing approval are split across manual helpers / stale cron assumptions instead of one VPS-owned webhook or watcher flow.
**Impact:** silent failure / operational delay — devices can pass QC without SKU readiness, and devices changed to "To List" may not immediately appear in Telegram for approval.
**Priority:** urgent

**Context / notes:**
- Desired trigger A: `status4` / workshop state changes to "Ready to Collect" → run `qc-generate-sku.js` logic for that Main Board item. Write BM Devices `text89` only when required fields pass and expected SKU is provable.
- Desired trigger B: `status24` changes to "To List" → run `node scripts/list-device.js --dry-run --item <id> --card-json`, then post the generated approval card to Telegram topic `Listings` (`message_thread_id 5618`) with approve / override / skip controls.
- Keep live listing gated behind operator approval. The trigger should post a dry-run card only, not create/publish a listing automatically.
- If SKU generation fails, final grade/specs are missing, or dry-run/card JSON is blocked by trust gates, post a clear warning to the Telegram `Issues` topic.
- This should be VPS-owned. Do not repair or reintroduce n8n/Flow 6 for this path.

**Status:** OPEN — needs source implementation and live webhook/cron verification.
