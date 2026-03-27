# Plan: BackMarket Full Automation Build

## Context

**Goal:** Get every BackMarket script deployed, every SOP confirmed, everything in one place — ready for the BM agent to take over and monitor. BackMarket becomes nearly fully automated.

The icloud-checker monolith (1914 lines, 6 services in one Express process) is the starting point. Two audits (Code + Codex, 23 Mar) mapped every endpoint. Repo cleanup is done (24 Mar). This plan covers: decompose the monolith, deploy all standalone scripts, wire Royal Mail dispatch, confirm SOPs, and hand the whole thing to the BM agent.

**Ricky's decisions (24 Mar):**
- Monday webhooks for payout, shipping, grade-check (not cron polling)
- Separate Express server per webhook service (own port, max isolation)
- Rewrite CLI scripts as proper webhook handlers
- Extract recheck cron to standalone + systemd timer
- Apple spec + iCloud check stay linked in icloud-checker
- Include Royal Mail dispatch.js — everything BM-related in one build
- End state: agent-ready, fully documented, fully deployed

---

## Target Architecture

### Webhook Services (Express, systemd, nginx)

| Port | Service | Trigger | SOP |
|------|---------|---------|-----|
| 8010 | **icloud-checker** (intake) | Monday: serial entered | 02 |
| 8011 | **bm-grade-check** | Monday: status4 → "Diagnostic Complete" | 03 |
| 8012 | **bm-payout** | Monday: status24 → "Pay-Out" | 03b |
| 8013 | **bm-shipping** | Monday: status4 → "Shipped" | 09 |

### Scheduled Services (cron / systemd timer)

| Schedule | Service | What | SOP |
|----------|---------|------|-----|
| Every 30m | **bm-icloud-recheck** | Poll BM messages, auto-recheck locked devices | 02 |
| Every 15m | **bm-sent-orders** | Detect new SENT trade-in orders from BM API | 01 |
| Every 15m | **bm-sale-detection** | Detect new BM sales, update Monday | 08 |
| Daily 9am | **bm-reconcile** | Cross-check BM listings vs Monday | 06.5 |
| Daily 9am | **bm-buy-box** | Check buy box positions, auto-bump | 07 |

### Manual / On-demand

| Service | What | SOP |
|---------|------|-----|
| **bm-dispatch** (Royal Mail labels) | Buy RM labels for pending BM orders, write tracking | 09 (Part A) |
| **bm-list-device** | List device on BM (qty bump or reactivation) | 06 |

`bm-list-device` remains manual/on-demand, but it is still part of final scope. "Fully deployed" means it must have a documented runnable home (service wrapper, script entrypoint, env, SOP, README coverage) before handoff.

### Shared Library

```
backmarket/lib/
├── monday.js      — GraphQL queries, status updates, comments, group moves
├── bm-api.js      — BM API headers, order ops, messaging, suspend, validate
├── slack.js        — Post messages, alerts, automations bot, rich formats
├── telegram.js     — Post to BM Telegram group
├── config.js       — Board IDs, column IDs, channel IDs, env vars
└── profitability.js — Margin/profit calculation (used by grade-check + listing)
```

### Directory Layout

```
backmarket/
├── lib/                              # Shared library (new)
├── services/                         # Deployed webhook + scheduled services (new)
│   ├── bm-grade-check/              # Port 8011
│   ├── bm-payout/                   # Port 8012
│   ├── bm-shipping/                 # Port 8013
│   ├── bm-icloud-recheck/          # Systemd timer
│   ├── bm-sent-orders/             # Cron
│   ├── bm-sale-detection/          # Cron
│   ├── bm-reconcile/               # Cron
│   └── bm-buy-box/                 # Cron
├── scripts/                         # Original CLI scripts (reference, kept for dry-run testing)
├── sops/                            # Confirmed SOPs
├── docs/                            # Operations docs + column reference
├── qa/                              # QA docs
└── README.md                        # Master map (updated at end)

icloud-checker/                      # Slimmed to intake only (~600 lines)
royal-mail-automation/               # Label buying (dispatch.js + buy-labels.js)
```

---

## Phases

### Phase 1: Security — Lock down port 8010

**IMMEDIATE.** Payout and shipping endpoints are triggerable by anyone.

1. `app.listen(PORT, '127.0.0.1')` in index.js line 1907
2. Add nginx proxy for all `/webhook/bm/*` and `/webhook/icloud-check/*`
3. Update Monday webhook URLs to `https://mc.icorrect.co.uk/...`
4. Confirm Slack interactivity URL (port 8003 vs 8010)
5. `sudo nginx -t && sudo systemctl reload nginx`
6. Restart icloud-checker
7. Treat `127.0.0.1` binding as a requirement for every webhook service (`8010`-`8013`), not just the monolith

**Files:** `icloud-checker/src/index.js:1907`, nginx config, Monday webhooks (manual)
**Verify:** `curl http://46.225.53.159:8010/webhook/bm/payout` → refused

---

### Phase 2: Build shared library (`backmarket/lib/`)

**Unblocks everything.** Extract the helpers that kept everything in one file.

| Module | Source | Key exports |
|--------|--------|-------------|
| `monday.js` | index.js:88–165 | `mondayQuery`, `updateMondayStatus`, `postMondayComment`, `moveItemToGroup`, `getBmClaimedSpecs` |
| `bm-api.js` | index.js:222–255 | `getBmOrderStatus`, `suspendBmOrder`, `getBmMessages`, `sendBmMessage`, BM headers |
| `slack.js` | index.js:259–320 | `slackPost`, `sendSlackAlert`, `slackPostAutomations` |
| `telegram.js` | standalone scripts | `postTelegram(message, chatId)` |
| `config.js` | scattered constants | Board IDs, column IDs, channels, env loading |
| `profitability.js` | icloud-checker/src/lib/ | `calculateProfitability`, `formatBreakdown` |

**Approach:** Extract from monolith, clean up, add proper error handling and env validation. This is the foundation every script imports — it needs to be solid.
**Verify:** Update icloud-checker to import from shared lib. Service still starts.

---

### Phase 3: Delete dead code from monolith

Only delete code after the replacement path is deployed and parity-checked. The old handlers can remain as a temporary reference until the new service is verified in staging/live dry-run.

1. Delete disabled listing handler (lines 1618–1898, ~275 lines dead code)
2. Delete duplicate counter-offer handler (lines 956–1070) — confirm Slack URL first
3. Delete recheck trigger endpoint (lines 1077–1080)

**Result:** ~400 lines removed → ~1514 lines

---

### Phase 4: Build bm-grade-check service (port 8011)

**NEW BUILD — no standalone replacement exists.**

Extract from index.js lines 1444–1601. Monday fires when status4 = "Diagnostic Complete".

- Predict final grade (worst of top case + lid grade)
- Look up sell price → calculate profitability
- Alert Slack if margin < 30% AND net < £100
- Post Monday comment with breakdown
- 10-min dedup cache

```
backmarket/services/bm-grade-check/
├── index.js        — Express on 8011
├── handler.js      — logic from monolith
├── package.json
└── bm-grade-check.service
```

Imports: `monday.js`, `slack.js`, `config.js`, `profitability.js` from shared lib
nginx: `/webhook/bm/grade-check` → `127.0.0.1:8011`
Delete from monolith: lines 1369–1601

---

### Phase 5: Build bm-payout service (port 8012)

**Rewrite `trade-in-payout.js` as webhook handler.**

Monday fires when status24 = "Pay-Out". Validates trade-in via BM API, updates Monday to "Purchased".

```
backmarket/services/bm-payout/
├── index.js        — Express on 8012
├── handler.js      — rewrite from trade-in-payout.js
├── package.json
└── bm-payout.service
```

nginx: `/webhook/bm/payout` → `127.0.0.1:8012`
Delete from monolith: lines 1266–1367

---

### Phase 6: Build bm-shipping service (port 8013)

**Rewrite `shipping.js --confirm` as webhook handler.**

Monday fires when status4 = "Shipped". Pushes tracking + confirms with BM sales API.

```
backmarket/services/bm-shipping/
├── index.js        — Express on 8013
├── handler.js      — rewrite from shipping.js confirm logic
├── package.json
└── bm-shipping.service
```

**Idempotency rules:**
- Only act on a real transition into `"Shipped"`; ignore retries where the old/new value is unchanged
- Skip if tracking is already written or BM sale is already confirmed
- Log duplicate deliveries so Monday retries are visible but harmless

**Fix:** Add status4 → "Return Booked" (index 19) after tracking write
nginx: `/webhook/bm/shipping-confirmed` → `127.0.0.1:8013`
Delete from monolith: lines 1114–1260

---

### Phase 7: Extract recheck to standalone + timer

**Extract from monolith. Build as systemd oneshot + timer.**

Every 30 min: poll BM messages for customer replies on locked devices. Auto-recheck via SickW. Move unlocked devices back to repairs.

```
backmarket/services/bm-icloud-recheck/
├── index.js
├── bm-icloud-recheck.service   (Type=oneshot)
└── bm-icloud-recheck.timer     (OnUnitActiveSec=30min)
```

SickW call is a simple HTTP API call (no Playwright, no browser). Extract `checkSickW()` to shared lib or inline — it's just a `fetch()` to the SickW API.
Delete from monolith: `recheckCron()`, `setInterval`, state helpers

---

### Phase 8: Deploy cron-based scripts as services

**Rewrite 4 CLI scripts as scheduled services.** These aren't webhook-driven — they poll APIs on a schedule.

| Script | Service | Schedule | Notes |
|--------|---------|----------|-------|
| `sent-orders.js` | `bm-sent-orders` | Every 15m | Polls BM for SENT orders. Cosmetic fix: product name extraction |
| `sale-detection.js` | `bm-sale-detection` | Every 15m | Polls BM for new sales |
| `reconcile-listings.js` | `bm-reconcile` | Daily 9am UTC | Cross-check listings vs Monday |
| `buy-box-check.js` | `bm-buy-box` | Daily 9am UTC | Check positions, auto-bump |

Each gets:
```
backmarket/services/bm-{name}/
├── index.js
├── bm-{name}.service   (Type=oneshot)
└── bm-{name}.timer
```

All rewritten to use shared lib (`backmarket/lib/`). No inline API code. Keep `--dry-run` flag for testing.

---

### Phase 9: Deploy Royal Mail dispatch

**Wire `dispatch.js` into the flow.** Currently manual — needs deployment path.

`royal-mail-automation/dispatch.js` buys RM labels for pending BM orders (state=3). It uses Playwright + real card payment + 3DS approval on phone.

**Key constraint:** 3DS requires manual phone approval. Cannot be fully automated. Must remain triggerable by human (agent or Ricky).

**Deployment options:**
- Cron (e.g. daily 2pm UTC) with dry-run → Slack summary → Ricky approves → `--live`
- Agent-triggered: BM agent runs `dispatch.js --live` when it decides orders are ready
- Manual: Ricky or team member runs when ready to post

**Actions:**
1. Move `royal-mail-automation/` into `backmarket/services/bm-dispatch/` (or symlink)
2. Create systemd service for dispatch
3. Ensure `buy-labels.js` module export works from new location
4. Add dispatch to the BM README and SOP 09

**Files:** `royal-mail-automation/dispatch.js`, `royal-mail-automation/buy-labels.js`

---

### Phase 10: Slim down icloud-checker

After all extractions, icloud-checker = intake only:

**Keep:**
- `POST /webhook/icloud-check` — serial → SickW → Apple specs → compare → counter-offer → locked flow
- `POST /webhook/icloud-check/slack-interact` — Slack buttons
- `GET /webhook/icloud-check/spec-check` — spec lookup API
- `GET /webhook/icloud-check/health`
- `apple-specs.js`, `counter-offer.js`, `colour-map.js`, `grade-map.js`, `bm-listings-cache.js`

**Import from shared lib:** `monday.js`, `bm-api.js`, `slack.js`, `config.js`
**Expected size:** ~600 lines (from 1914)

---

### Phase 11: Pricing Intelligence — Supabase + Scraper

**The data foundation for the buy↔sell feedback loop.**

**11a: Build Supabase `bm_market_prices` table**
- Schema from `pricing/bm-market-prices-supabase.md` (already fully specified)
- Table: `bm_market_prices` — canonical_key, product_uuid, grade, price, is_sold_out, scraped_at
- Unique index: one row per product + grade per day
- Create via Supabase SQL editor or migration script

**11b: Build daily price scraper service**
- Extend `sell_price_scraper_v6.js` to write to Supabase in addition to JSON
- Uses **Playwright stealth plugin** (NOT ClawPod/Massive — that's been dropped)
- Warms up via homepage visit, handles Cloudflare retries
- Parses `__NUXT_DATA__` for grade-specific prices (Fair/Good/Excellent/Premium) + spec pickers
- Upserts to `bm_market_prices` daily
- Catalogue already defined in `scraper/scrape-urls.json` + `scrape-urls-iphone-ipad.json`
- Existing script at `backmarket/scraper/sell_price_scraper_v6.js` (555 lines, working)

```
backmarket/services/bm-price-scraper/
├── index.js              — scrape + upsert logic
├── bm-price-scraper.service (Type=oneshot)
└── bm-price-scraper.timer   (daily 06:00 UTC)
```

**11c: Build pricing analysis service**
- Runs after scraper, analyses trends
- Flags: sell price drops >10% vs 30 days ago, cross-grade inversions, buy box losses
- Compares current bid prices against `calc_max_offer` using live sell-side data
- Generates daily pricing report → Telegram/Slack → BM agent reviews → Ricky approves

```
backmarket/services/bm-pricing-analysis/
├── index.js
├── bm-pricing-analysis.service (Type=oneshot)
└── bm-pricing-analysis.timer   (daily 07:00 UTC, after scraper)
```

**11d: Build bid adjustment flagging**
- Uses the profitability formula: `max_offer = sell_price - bm_fee - tax - parts_75th - labour - shipping - min_net_target`
- Min net target: ~£150 across the board (current code has £200 premium / £100 standard — needs updating)
- Compares current BM buyback bid prices against calculated max offer
- Flags bids that are too high (the MacBook problem) or too low (missing buy box)
- Start with flagging only → automate with guardrails once proven (2-4 weeks)

**Source of truth:** pick one canonical pricing formula and thresholds file shared by Node + Python. Do not leave `profitability.js` and `bm_utils.py` to drift independently.

**Key data flow:**
```
Daily scrape (06:00) → bm_market_prices (Supabase)
                              ↓
Pricing analysis (07:00) → compare sell prices to bid prices
                              ↓
Flag report → BM agent → Ricky approval → bid adjustments
```

**Existing code to reuse:**
- `profitability.js` — `calculateProfitability()` (Node.js)
- `bm_utils.py` — `calc_max_offer()`, `get_min_net_tier()` (Python)
- `bm-listing-optimizer.py` — KEEP/REPRICE/DELIST logic
- `bm-reprice.py` — execute price changes (already has `--dry-run`/`--execute`)
- `bm-bid-bump.py` — buy box recovery

---

### Phase 12: Deploy Python repricing scripts

**The execution layer.** These scripts already exist and work — they need deployment as scheduled services.

| Script | Service | Schedule | What |
|--------|---------|----------|------|
| `bm-reprice.py` | `bm-reprice` | Weekly (manual trigger or agent) | Execute REPRICE decisions on live BM API |
| `bm-bid-bump.py` | `bm-bid-bump` | Weekly after reprice | Recover lost buy boxes |
| `bm-listing-optimizer.py` | `bm-optimize` | Weekly before reprice | Generate KEEP/REPRICE/DELIST decisions |
| `bm-crossref.py` | `bm-crossref` | Weekly (data foundation) | Financial cross-reference |
| `bm-repair-analysis.py` | `bm-data-collect` | Weekly (feeds crossref) | Master data aggregation |

**Pricing cycle (weekly, agent-managed):**
```
Monday:   bm-data-collect (repair-analysis.py)
Tuesday:  bm-crossref (crossref.py)
Wednesday: bm-optimize (listing-optimizer.py)
Thursday: bm-reprice --dry-run → report to agent
Friday:   Agent reviews, Ricky approves → bm-reprice --execute
Saturday: bm-bid-bump (recover buy boxes)
```

Each gets a systemd oneshot service. Agent triggers via cron or on-demand.

---

### Phase 13: Update documentation + SOP confirmation

**The handoff deliverable.** Everything the BM agent needs to take over.

1. **Update `backmarket/README.md`** — full service map, ports, triggers, schedules, env vars
2. **Confirm each SOP against its deployed script** — mark as verified or flag gaps
3. **Complete `00-BACK-MARKET-MASTER.md`** — no longer a skeleton
4. **Update `backmarket/docs/VERIFIED-COLUMN-REFERENCE.md`** if any column IDs changed
5. **Create deployment doc** — how to start/stop/restart each service, logs location, health checks
6. **Update `builds/INDEX.md`** with final structure
7. **Create pricing playbook** — how the weekly cycle works, what the agent monitors, escalation rules

---

## Phase Dependencies

```
Phase 1:  Security ──────────────── Do immediately
Phase 2:  Shared lib ────────────── Unblocks 4-10
Phase 3:  Delete dead code ──────── After Phase 1

Phase 4:  Grade-check service ───┐
Phase 5:  Payout service ────────┤
Phase 6:  Shipping service ──────┤── All need Phase 2. Can run in parallel.
Phase 7:  Recheck extraction ────┤
Phase 8:  Cron script deploy ────┤
Phase 9:  RM dispatch deploy ────┘

Phase 10: Slim icloud-checker ───── After 4, 5, 6, 7
Phase 13: Documentation ─────────── After everything
```

---

## Pre-flight Checks (Before Any Code)

1. **Monday webhooks** — List every webhook URL on boards 349212843 and 3892194968
2. **Slack interactivity URL** — Which URL is configured? (port 8003 vs 8010)
3. **Port 8003** — `lsof -i :8003` — what's listening? Is it proxying to 8010?
4. **dispatch.js test** — `node dispatch.js` (dry run) to confirm it still works

---

## Port Allocation

| Port | Service | Bind |
|------|---------|------|
| 8010 | icloud-checker | 127.0.0.1 |
| 8011 | bm-grade-check | 127.0.0.1 |
| 8012 | bm-payout | 127.0.0.1 |
| 8013 | bm-shipping | 127.0.0.1 |

All traffic via nginx (`mc.icorrect.co.uk`) with SSL.

---

## Nginx Routes (Target)

```nginx
location /webhook/icloud-check     { proxy_pass http://127.0.0.1:8010; }
location /webhook/bm/grade-check   { proxy_pass http://127.0.0.1:8011; }
location /webhook/bm/payout        { proxy_pass http://127.0.0.1:8012; }
location /webhook/bm/shipping-confirmed { proxy_pass http://127.0.0.1:8013; }
```

---

## Monday Webhooks (Target)

| Board | Column | Trigger Value | URL |
|-------|--------|---------------|-----|
| 349212843 | text4 (serial) | Value entered | `.../webhook/icloud-check` |
| 349212843 | status4 | "Diagnostic Complete" | `.../webhook/bm/grade-check` |
| 349212843 | status24 | "Pay-Out" | `.../webhook/bm/payout` |
| 349212843 | status4 | "Shipped" | `.../webhook/bm/shipping-confirmed` |

---

## Full SOP → Script → Service Map

| SOP | Name | Script | Service | Trigger | Status |
|-----|------|--------|---------|---------|--------|
| 01 | Trade-in Purchase | sent-orders.js | bm-sent-orders | Cron 15m | Deploy (Phase 8) |
| 02 | Intake/iCloud Check | index.js (monolith) | icloud-checker | Monday webhook | Slim (Phase 10) |
| 03 | Diagnostic/Grade | — | bm-grade-check | Monday webhook | Build (Phase 4) |
| 03b | Trade-in Payout | trade-in-payout.js | bm-payout | Monday webhook | Rewrite (Phase 5) |
| 04 | Repair/Refurb | — | — | Manual | No automation |
| 06 | Listing | list-device.js | bm-list-device | Manual/cron | Must be packaged and documented before handoff, even if still human-triggered |
| 06.5 | Reconciliation | reconcile-listings.js | bm-reconcile | Cron daily | Deploy (Phase 8) |
| 07 | Buy Box | buy-box-check.js | bm-buy-box | Cron daily | Deploy (Phase 8) |
| 08 | Sale Detection | sale-detection.js | bm-sale-detection | Cron 15m | Deploy (Phase 8) |
| 09 | Shipping (labels) | dispatch.js | bm-dispatch | Manual/agent | Deploy (Phase 9) |
| 09 | Shipping (confirm) | shipping.js | bm-shipping | Monday webhook | Rewrite (Phase 6) |
| 10 | Payment Reconciliation | — | — | — | Deferred — SOP only |
| 11 | Tuesday Cutoff | — | — | — | SOP only |
| 12 | Returns/Aftercare | — | — | — | SOP only |

---

## COMPROMISES

- 4 new Express processes + multiple timers/oneshot services = more systemd units than the initial decomposition alone. Memory overhead is still modest, but operational overhead needs to be documented clearly.
- All scripts use the shared lib. No duplicated inline API code.
- dispatch.js can't be fully automated (3DS requires phone approval). Agent can trigger it but human must approve payment.
- Shared lib is clean, well-structured code that the BM agent can maintain. Not a raw copy-paste from the monolith.
- SOP 10 (Payment Reconciliation) deferred — documentation only for now.
- SOPs 04, 10, 11, 12 have no automation — they're manual processes or payment/returns flows that don't have scripts yet.

---

## QA Sign-off Gates

Before this plan can be called "fully deployed" or "agent-ready", all of the following must be true:

1. **Scope completeness:** every in-scope BackMarket script has a declared runtime home. Manual/on-demand tools are allowed, but they still need a maintained entrypoint, env docs, SOP coverage, and README/deployment documentation.
2. **Webhook security:** every webhook service binds to `127.0.0.1`, is only reachable via nginx over SSL, and is verified closed on the public IP.
3. **Idempotent handlers:** payout/shipping/grade-check must tolerate Monday retries and duplicate deliveries without duplicate BM actions.
4. **Safe extraction:** monolith code is removed only after the replacement service has passed parity checks and a live dry-run or equivalent verification.
5. **Pricing consistency:** Node and Python services use one canonical profitability formula and one current min-net policy.
6. **Operational docs:** systemd unit names, timers, restart commands, log paths, health checks, and escalation rules are documented for the BM agent handoff.
