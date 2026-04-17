# BM Process Audit — Full Operational Map

**Date:** 2026-03-17
**Scope:** Every script, automation, and manual step in the BackMarket trade-in/listing/sales workflow
**Method:** Direct audit of all code, docs, and agent memory files

---

## 1. SCRIPT INVENTORY

### `/home/ricky/builds/buyback-monitor/` (Pricing Intelligence Pipeline)

| Script | Purpose | Runs | Status |
|--------|---------|------|--------|
| `buy_box_monitor.py` | Checks all online buyback listings, identifies buy box losses/overbids. Fetches BM buyback listings, pulls BackBox competitor data, generates summary report. | Cron daily 05:00 UTC via `run-daily.sh` | ✅ Active |
| `sell_price_scraper.py` | Scrapes ALL M1+ MacBook product pages from BM sitemap via Massive/ClawPod. Extracts per-spec per-grade pricing from Nuxt payloads. Discovers variant pages via pickers. ~60-80 Massive credits/run. | Manual (via `run_price_pipeline.py`) | ✅ Working |
| `generate_sell_lookup.py` | Reads sell-prices JSON from scraper, generates `sell-price-lookup.json` for the buy box monitor. Maps buyback grades to sell grades. | Manual (via `run_price_pipeline.py`) | ✅ Working |
| `sync_to_sheet.py` | Syncs sell prices to Google Sheet. One tab per model+year, dates as columns, specs as rows. | Manual (via `run_price_pipeline.py`) | ✅ Working |
| `run_price_pipeline.py` | Orchestrator: runs sell_price_scraper → generate_sell_lookup → sync_to_sheet in sequence. | Manual | ✅ Working |
| `sync_tradein_orders.py` | Full refresh of ALL BM buyback orders to Google Sheet. Replaces broken n8n trade-in sheet sync. | Manual | ✅ Working |
| `build_cost_matrix.py` | Builds per-grade per-model cost matrix from filtered parts data + Nancy's confirmed LCD prices. Outputs parts-cost-lookup.json. | Manual | ✅ Working |
| `pull_parts_data_v3.py` | Pulls repair cost data chain: BM Devices board → Main board → Parts board. Uses trade-in grade column. | Manual | ✅ Working |
| `bid_order_analysis.py` | Analyses trade-in orders sheet: monthly volume by grade, bid price trends, overbid detection, sweet spot analysis. | Manual | ✅ Working |
| `populate_tradein_grades.py` | Populates Trade-in Grade column on BM Devices board from Google Sheet data. | Manual | ✅ Working |
| `diagnose_grades.py` | Diagnostic: dumps raw grade picker data from MBP13 2020 M1 product pages. | Manual (debug tool) | ✅ Working |

### `~/.openclaw/agents/backmarket/workspace/scripts/` (Operational Scripts)

| Script | Purpose | Runs | Status |
|--------|---------|------|--------|
| `reconcile_listings.py` | Compares active BM listings (qty>0) against Monday "Listed" devices. Flags ghosts, qty mismatches, orphans. | Manual (Hugo runs per-session) | ✅ Working |
| `buyback_payout_watch.py` | Fetches all RECEIVED trade-in orders, auto-validates those within 12h of 48h deadline. Validates only if counterOfferPrice == originalPrice. | Cron every 2h | ✅ Active |
| `bm_board_housekeeping.py` | Moves sold items to Shipped group, moves stray "To List" items into correct group. | Manual | ✅ Working |
| `scrape_bm_product.py` | Scrapes individual BM product page via Massive. Extracts all grades, colours, specs, prices from Nuxt payload. | Manual (Hugo calls per-session) | ✅ Working |
| `analyze_pricing.py` | Compares hardcoded active listings against scraped market data. | Manual | ⚠️ Stale (hardcoded listing data from Feb) |
| `backbox_audit.py` | Pulls all live listings and gets BackBox competitor prices for each. | Manual | ✅ Working |
| `ssr_spec_lookup.py` | Apple Self Service Repair serial lookup via Playwright. Extracts specs from SSR portal. | Manual | ✅ Working |
| `fetch_all_listings.sh` | Bash: paginate all BM listings to `all_listings.json` | Manual | ✅ Working |
| `fetch_backbox_data.sh` | Bash: iterate all listings, pull BackBox data for each. Saves to `backbox_data_complete.json`. | Manual | ✅ Working |
| `fetch_backbox_data_fixed.sh` | Same as above but handles array response format correctly. | Manual | ✅ Working |
| `fetch_listings_efficient.sh` | Same as fetch_all_listings but with progress tracking. | Manual | ✅ Working |

### `/home/ricky/builds/royal-mail-automation/` (Dispatch)

| Script | Purpose | Status |
|--------|---------|--------|
| `dispatch.js` | **THE DISPATCH PIPELINE.** Fetches state=3 BM orders → matches to Monday → buys Royal Mail labels → downloads BM slips → updates BM with tracking → posts to Slack. | ✅ Active but **🔴 HAS THE LABEL→SHIPPED BUG** |
| `buy-labels.js` | Royal Mail label purchasing via their API. Called by dispatch.js. | ✅ Working |
| `pilot.js` / `pilot-v2.js` | Earlier prototypes of dispatch automation. | ❌ Deprecated |

---

## 2. N8N AUTOMATIONS AUDIT

**n8n Cloud instance:** icorrect.app.n8n.cloud

### Still Running on n8n Cloud

| Flow | ID | What It Does | Issues |
|------|----|-------------|--------|
| **Flow 0: Trade-in → Monday** | `GJbVeldhpWU1KEG3` | Fetches SENT buyback orders, creates items on Main Board + BM Devices Board, sends Slack notification | ❌ No "Fully Functional" flag, no high-value flag, hardcoded device mapping |
| **Flow 2: iCloud Check** | `gU8alMqvddNjebf6` | Slack `/bm check` → SickW API → updates Monday → suspends if locked | ❌ Auto-changes device model without prompting team |
| **Flow 3: iCloud Recheck** | `KRNukgA2aqIbuNNL` | Slack recheck → SickW → if unlocked moves to repairs | ⚠️ Should trigger on customer BM reply, not manual slash command |
| **Flow 6: Sales Alert** | `HsDqOaIDwT5DEjCn` | Fetches new BM sales (state=1) → matches to Monday by listing UUID → updates boards → auto-accepts order (state=2) | ⚠️ UUID matching fragile; no fallback; skips items with stale buyer data |
| **Flow 7: Ship Confirmation** | `D4a5qbCtQmSCUIeT` | Queries Monday for sold+shipped items → confirms shipment on BM API (state=3 with tracking) | **🔴 BROKEN: only queries `new_group`, misses items in other groups. Caused £3k missed payment.** |

### Disabled on n8n Cloud

| Flow | ID | Why Disabled |
|------|----|-------------|
| **Flow 1: Device Received** | `jFO6pZajYehztkBr` | Royal Mail tracking unreliable. Adil does manual matching. |
| **Flow 4: Payout Approval** | `lGiPEDaZBfUjuA7h` | Team was clicking payout when they should counter-offer. No counter-offer logic. Replaced by `buyback_payout_watch.py` for deadline-safe auto-validation only. |
| **Flow 5: Device Listing** | `69BCMOtdUyFWDDEV` | Disabled Feb 14. Dumb pricing, no market intelligence, under-selling devices. |

### Replaced by Scripts

| n8n Flow | Replaced By | Notes |
|----------|-------------|-------|
| Flow 4 (Payout) | `buyback_payout_watch.py` (cron) | Only auto-validates clean orders near deadline |
| Flow 5 (Listing) | **NOTHING** — Hugo does it manually via raw API calls | This is the biggest gap |
| Trade-in sheet sync | `sync_tradein_orders.py` | Full sheet refresh |

### Migration Status

- Self-hosted n8n at `n8n.icorrect.co.uk` exists but **zero flows migrated**
- All active flows still on n8n Cloud
- Hardcoded credentials in flow nodes (not using n8n credential system)

---

## 3. FULL BM WORKFLOW MAP (End to End)

### STAGE 1: Trade-in Order Comes In

```
Customer accepts quote on BM → ships device → order status = SENT
  ↓
n8n Flow 0 (cloud, active) polls SENT orders
  ↓
Creates item on Main Board (349212843) — status "Expecting Device"
Creates item on BM Devices Board (3892194968) — in Trade-Ins group
Downloads packing slip, sends Slack notification
```

**Automation:** ✅ n8n Flow 0 (working with known gaps)
**Gaps:** No fully-functional flag, no high-value alert, hardcoded device mapping

### STAGE 2: Device Arrives

```
Royal Mail delivers to workshop
  ↓
Adil MANUALLY matches customer name to BM number in Monday "Incoming Future" group
  ↓
Attaches pre-printed label to device
  ↓
Enters serial number in Monday
  ↓
Team runs /bm check in Slack (triggers n8n Flow 2)
  ↓
Flow 2: SickW API checks serial → specs + iCloud
  - If iCloud LOCKED → suspends on BM, moves to locked group
  - If OK → updates Monday with specs
```

**Automation:** Partially automated (Flow 2 for spec check)
**Manual:** Physical matching of device to BM order (Adil), serial entry
**Broken:** Flow 2 auto-changes model without confirmation. Flow 1 (auto-receive matching) is disabled.

### STAGE 3: Diagnostic & Decision

```
Team does diagnostic:
  - Ammeter readings
  - Functionality check
  - Condition assessment
  ↓
Decision: Payout vs Counter-offer
  - Payout if device matches or is better
  - Counter-offer if worse model AND value diff > ~£20
  - Counter-offer rate must stay under 18%
```

**Automation:** ❌ NONE. Team decides manually. No counter-offer automation exists.
**Payout:** `buyback_payout_watch.py` handles deadline-safe auto-validation only (clean orders near 48h deadline). Everything else requires Hugo's manual API call or team decision.

### STAGE 4: Repair/Refurb

```
Device gets repaired by team
  ↓
QC sign-off by Ronnie
  ↓
Status changed to "To List" on Monday
  ↓
Device moves to listing group
```

**Automation:** ❌ NONE for status updates. Team manually changes Monday statuses.

### STAGE 5: Listing (WHERE COLOUR MISMATCHES HAPPEN)

```
Hugo (the agent) sees device in "To List" status
  ↓
Hugo MANUALLY:
  1. Pulls device specs from Monday BM Devices Board
  2. Checks serial via Apple Spec Checker (colour, exact spec)
  3. Searches 823 existing listings for matching product_id + grade
  4. Verifies colour match between device and listing slot
  5. Proposes price to Ricky (BackBox + market data + cost analysis)
  6. On approval: POSTs to /ws/listings/{id} with qty+1 and price
  7. Writes listing UUID back to Monday
  8. Updates status to "Listed" on Main Board
```

**Automation:** ❌ ENTIRELY MANUAL. Hugo does this with raw curl commands each session.
**n8n Flow 5 (the listing flow) is DISABLED since Feb 14.**
**Colour mismatch root cause:** Steps 2-4 above require matching Apple's reported colour to the BM listing slot's SKU colour. This was done incorrectly 5-6 times: agent selected listing by ID without verifying SKU colour. Hard rule added to AGENTS.md on 2026-03-16 but enforcement is agent-discipline only; no code prevents it.

### STAGE 6: Device Sells

```
Customer buys on BM → order created (state=1)
  ↓
n8n Flow 6 (cloud, active) polls state=1 orders
  ↓
Matches order's listing_id to Monday BM board items
Writes buyer name + sales order ID to BM board + Main board
Auto-accepts order (POST new_state=2 → state=3 awaiting ship)
Sends Slack notification
```

**Automation:** ✅ n8n Flow 6 (working but fragile)
**Gaps:** UUID matching fails if Monday has wrong/numeric ID. No SKU fallback. Skips items with non-empty buyer field (returned devices relisted). When it fails, Hugo manually processes with raw API calls.

### STAGE 7: Label Purchase & Dispatch

```
Team sees order needs shipping
  ↓
Someone runs: node dispatch.js
  ↓
dispatch.js:
  1. Fetches state=3 orders from BM API
  2. Matches to Monday board items
  3. Groups by service tier (Special Delivery for £400+, Tracked 24 otherwise)
  4. Buys Royal Mail labels in batches via buy-labels.js
  5. Downloads BM packaging slips
  6. 🔴 IMMEDIATELY calls updateBmTracking() → POST new_state=3 with tracking to BM
  7. Posts combined summary to Slack
```

**🔴 THE LABEL→SHIPPED BUG:**
`dispatch.js` line 694: after buying labels, it IMMEDIATELY calls `updateBmTracking()` which POSTs `new_state: 3` (shipped) to BM. This tells BM the device has been shipped and starts the delivery clock.

**What actually happens:** Labels are bought and PDFs posted to Slack. The physical devices are NOT shipped at this point. The team ships them later (sometimes next day). BM thinks it's shipped when it isn't.

**Impact:**
- BM delivery SLA clock starts early
- If team delays physical shipping, delivery window shrinks
- Customer gets "shipped" notification before it's actually shipped
- Potential late-delivery penalties

### STAGE 8: Actual Shipping & BM Confirmation

```
Team physically ships the device (Royal Mail collection or drop-off)
  ↓
🔴 NO SEPARATE TRIGGER exists for "actually shipped"
  ↓
n8n Flow 7 (cloud) is supposed to confirm shipping on BM
  But: Flow 7 only queries new_group → misses items in other groups
  And: dispatch.js already marked it shipped in Stage 7
  So: Flow 7 is effectively redundant AND broken
```

**Automation:** 🔴 Broken/redundant. dispatch.js does premature shipping confirmation. Flow 7 has the group query bug AND is redundant since dispatch.js already fires.

---

## 4. THE GAPS: What Has NO Automation

| Step | Current State | Who Does It |
|------|--------------|-------------|
| **Listing devices** | Entirely manual. Hugo does raw curl/API calls each session. | Hugo (agent) |
| **Counter-offers** | No automation, no decision logic. | Hugo + Ricky approval |
| **Device received matching** | Manual by Adil. Flow 1 disabled. | Adil (team) |
| **Repair status updates** | Manual Monday column changes. | Workshop team |
| **Pricing decisions** | Hugo pulls data manually, proposes to Ricky, executes on approval. | Hugo + Ricky |
| **Listing reconciliation** | Hugo manually runs `reconcile_listings.py` per session. No cron. | Hugo (agent) |
| **Board housekeeping** | Hugo manually runs `bm_board_housekeeping.py`. No cron. | Hugo (agent) |
| **Unmatched sale processing** | When Flow 6 fails to match, Hugo does full manual: find order, match device, accept, update boards, dispatch. | Hugo (agent) |
| **Return processing** | No automation. Hugo manually: updates BM board, changes statuses, relists if applicable. | Hugo (agent) |
| **Bid management** | No automation. Ricky decides, Hugo executes `PUT /ws/buyback/v1/listings/{uuid}`. | Hugo + Ricky |

---

## 5. BROKEN STUFF (Running But Wrong)

### 🔴 CRITICAL: dispatch.js marks shipped at label purchase time

**File:** `/home/ricky/builds/royal-mail-automation/dispatch.js` lines 496-515, called at line 694
**What happens:** `updateBmTracking()` fires right after `buyRmLabels()` completes. POSTs `new_state: 3` to BM immediately.
**Should happen:** Shipping confirmation should fire when the team physically ships, not when labels are bought.
**Fix:** Split dispatch.js into two steps: (1) buy labels + post to Slack, (2) separate "confirm shipped" script/trigger that fires when team marks as shipped in Monday.

### 🔴 CRITICAL: n8n Flow 7 group query bug

**Flow:** Ship Confirmation (`D4a5qbCtQmSCUIeT`)
**Bug:** Node 2 queries `groups(ids: ["new_group"])` only. Items moved out of that group before Flow 7 runs = never confirmed on BM.
**Impact:** Caused £3k missed payment week of Feb 3.
**Note:** Partially moot since dispatch.js already does premature shipping confirmation, but Flow 7 is the "correct" confirmation path.

### 🟡 HIGH: n8n Flow 6 UUID matching

**Flow:** Sales Alert v2 (`HsDqOaIDwT5DEjCn`)
**Bug:** Matches by listing UUID from BM order to `text_mkyd4bx3` on Monday BM board. If that column has a numeric listing_id (legacy) or wrong UUID, match fails silently. Order stays state=1.
**Workaround:** Hugo manually processes unmatched sales.
**Note:** A one-time fix ran 2026-03-10 converting 18 numeric IDs to UUIDs, but new mismatches can still occur.

### 🟡 HIGH: n8n Flow 2 auto-model-change

**Flow:** iCloud & Spec Checker (`gU8alMqvddNjebf6`)
**Bug:** When received model differs from expected, auto-updates Monday without team confirmation. Team ignores Slack notes about changes. Can lead to wrong device being processed.

### 🟡 MEDIUM: Listing colour mismatch (process not code)

**Root cause:** No programmatic enforcement. Hugo's listing process relies on agent discipline to check Apple colour vs listing SKU colour. Failed 5-6 times. Hard rule added to AGENTS.md 2026-03-16 but it's documentation, not code.
**Fix needed:** Build listing script that REQUIRES colour verification as a hard gate.

### 🟡 MEDIUM: Flow 0 missing safety flags

**Flow:** Trade-in Orders (`GJbVeldhpWU1KEG3`)
**Missing:** No "Fully Functional" flag (team misses counter-offer opportunities). No high-value flag (>£180-200, led to overpaying £300+). No timestamp for receive.

---

## 6. WHAT NEEDS REBUILDING (Priority Order)

### P0: Fix dispatch.js label→shipped separation

**Current:** `dispatch.js` buys labels AND marks shipped in one step.
**Target:** Split into: (a) `dispatch.js` buys labels, downloads slips, posts to Slack. Does NOT update BM. (b) New `confirm-shipped.js` or cron that watches for Monday status change to "Shipped" and THEN calls BM API to confirm shipping.
**Effort:** Small. Remove `updateBmTracking()` call from dispatch.js main flow. Build a separate confirmation trigger.
**Impact:** Stops premature shipping confirmation. Accurate delivery timelines.

### P1: Build listing automation

**Current:** Hugo does the entire listing process manually via raw API calls. This is the single biggest time sink.
**Target:** Script that:
1. Pulls "To List" items from Monday
2. For each: gets serial → Apple spec check → gets colour
3. Searches existing listings for matching product_id + grade + colour (HARD GATE)
4. Pulls BackBox price, calculates floor price from cost data
5. Proposes price (or auto-lists if within auto-list policy: ≥30% margin AND ≥£100 profit)
6. Updates BM listing qty/price
7. Writes listing UUID back to Monday
8. Updates status to "Listed"
**Effort:** Medium-large. Most of the building blocks exist in scripts already.
**Colour enforcement:** Make colour match a hard programmatic gate that cannot be bypassed.

### P2: Fix/replace n8n Flow 7

**Current:** Broken group query + redundant with dispatch.js premature confirmation.
**Target:** After P0 splits dispatch.js, Flow 7's job becomes the sole shipping confirmation path. Fix the group query to be status-based across all groups. Or replace with a script.
**Effort:** Small if fixing n8n. Medium if rebuilding as script.

### P3: Build counter-offer automation

**Current:** No automation. Team clicks payout when they should counter. No decision logic.
**Target:** Script/flow that:
1. Checks received device spec vs expected
2. Applies counter-offer rules (model worse + value diff > £20 = counter)
3. Presents decision to Ricky/Hugo
4. Executes counter-offer or payout via API
**Effort:** Medium. Counter-offer API endpoint exists but untested.

### P4: Fix n8n Flow 6 matching resilience

**Current:** Matches by UUID only. No fallback. Returned/relisted devices skipped.
**Target:** Add SKU-based fallback matching. Handle returned devices (clear stale buyer data before relisting). Add error alerting.
**Effort:** Small-medium.

### P5: Automate listing reconciliation

**Current:** Hugo manually runs `reconcile_listings.py` per session.
**Target:** Cron it (daily). Alert to Telegram on mismatches. Auto-fix ghosts (qty=0).
**Effort:** Small. Script exists, just needs cron + alerting.

### P6: Fix Flow 0 safety flags

**Current:** No fully-functional flag, no high-value flag.
**Target:** Add both flags + Slack alerts.
**Effort:** Small.

### P7: Replace n8n Cloud flows with local scripts

**Current:** 4 active flows on n8n Cloud with hardcoded credentials.
**Target:** Rewrite as Python scripts on VPS with proper credential management. Eliminates n8n Cloud dependency and recurring cost.
**Effort:** Medium per flow. Flows 0, 2, 3, 6, 7 all need rewriting.

---

## 7. ARCHITECTURE SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│                    BM OPERATIONAL STACK                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  n8n Cloud (still active)           VPS Scripts               │
│  ┌─────────────────────┐           ┌──────────────────────┐  │
│  │ Flow 0: TI→Monday ✅│           │ buyback_payout_watch │  │
│  │ Flow 2: iCloud ✅   │           │ (cron 2h)        ✅  │  │
│  │ Flow 3: Recheck ✅  │           │                      │  │
│  │ Flow 6: Sales ⚠️    │           │ buy_box_monitor      │  │
│  │ Flow 7: Ship  🔴    │           │ (cron daily)     ✅  │  │
│  └─────────────────────┘           │                      │  │
│                                     │ reconcile_listings   │  │
│  dispatch.js (manual run)           │ (manual)         ✅  │  │
│  ┌─────────────────────┐           │                      │  │
│  │ Buy labels      ✅  │           │ bm_board_housekeep   │  │
│  │ BM ship confirm 🔴  │           │ (manual)         ✅  │  │
│  │ Slack post      ✅  │           └──────────────────────┘  │
│  └─────────────────────┘                                      │
│                                                               │
│  Hugo (agent) — MANUAL EACH SESSION:                         │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ • Listing devices (the big one)                          │ │
│  │ • Pricing proposals                                      │ │
│  │ • Unmatched sale processing                              │ │
│  │ • Return handling                                        │ │
│  │ • Counter-offer decisions                                │ │
│  │ • Board cleanup                                          │ │
│  │ • Bid management                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Monday.com                                                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Main Board (349212843) — repair tracking, device status  │ │
│  │ BM Devices Board (3892194968) — BM-specific tracking     │ │
│  │ Parts Board (985177480) — inventory                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. KEY FILES REFERENCE

| What | Path |
|------|------|
| Hugo's SOUL | `~/.openclaw/agents/backmarket/agent/SOUL.md` |
| Hugo's workspace | `~/.openclaw/agents/backmarket/workspace/` |
| Hugo's learnings | `~/.openclaw/agents/backmarket/workspace/memory/learnings.md` |
| Hugo's MEMORY | `~/.openclaw/agents/backmarket/workspace/MEMORY.md` |
| n8n full audit | `~/.openclaw/agents/backmarket/workspace/docs/n8n-flows-full-audit.md` |
| Process map | `~/.openclaw/agents/backmarket/workspace/docs/historical/process-map.md` |
| API reference | `~/.openclaw/agents/backmarket/workspace/docs/api-endpoints.md` |
| Listing research | `~/.openclaw/agents/backmarket/workspace/docs/historical/listings-research.md` |
| Known issues | `~/.openclaw/agents/backmarket/workspace/docs/ISSUES.md` |
| Doc gaps | `~/.openclaw/agents/backmarket/workspace/docs/DOC-GAPS.md` |
| Action items | `~/.openclaw/agents/backmarket/workspace/docs/ACTION-ITEMS.md` |
| SOPs | `~/.openclaw/agents/backmarket/workspace/docs/SOPs/` |
| Pricing pipeline | `/home/ricky/builds/buyback-monitor/` |
| Dispatch automation | `/home/ricky/builds/royal-mail-automation/dispatch.js` |
| Payout watch | `~/.openclaw/agents/backmarket/workspace/scripts/buyback_payout_watch.py` |
| Reconciliation | `~/.openclaw/agents/backmarket/workspace/scripts/reconcile_listings.py` |
| Board housekeeping | `~/.openclaw/agents/backmarket/workspace/scripts/bm_board_housekeeping.py` |

---

*End of audit.*
