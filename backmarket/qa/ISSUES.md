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
