# Agent Delegation Map: BackMarket Rebuild

**Source:** Codex delegation plan, 24 Mar 2026
**Canonical plan:** `builds/backmarket/PLAN-BM-REBUILD-MASTER.md`
**Listing sub-plan:** `builds/backmarket/LIST-DEVICE-SAFE-GO-LIVE-TODO.md`

---

## Agent 1: Security / Ingress

### Ownership
- Webhook exposure
- Localhost binding
- Nginx routing
- Service ingress map

### Primary files / areas
- `icloud-checker/`
- Server/nginx config
- systemd/unit docs
- Master plan Phase 1

### Deliverables
- All webhook services bound to `127.0.0.1`
- Nginx routes confirmed
- Public ingress closed
- Documented route/port map

### Dependencies
- Goes first
- Blocks live rollout for everyone else

---

## Agent 2: Core Transaction Flows

### Ownership
- Sale detection
- Payout
- Dispatch
- Ship confirmation

### Primary files / areas
- `builds/backmarket/scripts/sale-detection.js`
- `builds/backmarket/scripts/trade-in-payout.js`
- `royal-mail-automation/dispatch.js`
- `builds/backmarket/scripts/shipping.js`
- Relevant SOP docs

### Deliverables
- Sales auto-accept on perfect match
- Payout policy enforced
- Dispatch sets Return Booked
- Shipping confirmation sends serial + RM tracking
- BM Devices item moved to Shipped

### Dependencies
- Depends on Agent 1 for safe ingress if webhook endpoints are touched
- Can otherwise start early on logic/docs

---

## Agent 3: Listing Safe Go-Live

### Ownership
- `list-device.js`
- Listing identity model
- Denylist
- Listing verification
- Live safety controls

### Primary files / areas
- `builds/backmarket/scripts/list-device.js`
- `builds/backmarket/LIST-DEVICE-SAFE-GO-LIVE-TODO.md`
- Supporting lookup/data paths
- Listing audit outputs

### First tasks
- Block `--live` without `--item`
- Resolve missing `lib/` imports
- Fix broken data paths
- Then execute the TODO plan in order

### Deliverables
- Single-item safe live mode
- Denylist
- Stronger post-list verification
- Listing pool audit
- 5 to 10 clean single-item live successes before broader rollout

### Dependencies
- Isolated high-risk stream
- Do not overlap file ownership with other agents unless necessary

---

## Agent 4: Pricing Reference / Sell-Side Controls

### Ownership
- Scraper runtime
- Retry logic
- Reconciliation
- Sell-side buy-box sequence

### Primary files / areas
- `backmarket/scraper/`
- `builds/backmarket/scripts/reconcile-listings.js`
- `builds/backmarket/scripts/buy-box-check.js`
- Pricing schedule docs

### Deliverables
- Scraper at `00:00 UTC`
- Failed scrape retries hourly
- Reconciliation after scraper completion
- Sell-side buy-box at `01:00 UTC`
- No sequencing race

### Dependencies
- Coordinate with Agent 6 on docs
- Avoid touching buyback logic owned by Agent 5

---

## Agent 5: Buyback Engine

### Ownership
- Rebuilt JS buy-box system
- £150 floor enforcement
- Buyback profitability reporting
- Donor-parts boundary documentation

### Primary files / areas
- `/home/ricky/builds/bm-scripts/buy-box-check.js`
- `/home/ricky/builds/data/buyback-profitability-lookup.json`
- Any buyback monitor docs
- Policy sections in master plan / KB

### Deliverables
- Auto-adjust with guardrails
- Flat £150 net floor enforced
- Clear reporting on projected profit
- Donor-parts strategy documented as Phase 2, not mixed into Phase 1 engine

### Dependencies
- Coordinate with Agent 4 on terminology only, not shared write scope
- Can run in parallel with Agents 2-4

---

## Agent 6: Documentation / KB / Final Consistency

### Ownership
- README
- Master references
- Runbooks
- KB
- Final consistency QA

### Primary files / areas
- `builds/backmarket/PLAN-BM-REBUILD-MASTER.md`
- `backmarket/README.md`
- `backmarket/sops/00-BACK-MARKET-MASTER.md`
- KB at `.openclaw/agents/main/workspace/kb`

### Deliverables
- One canonical plan
- Updated runbooks
- KB entries for fixed business rules
- Final cross-check that implementation matches policy

### Dependencies
- Starts light early
- Becomes heavy near the end
- Should not rewrite technical files owned by other agents

---

## Execution Order

1. Agent 1 starts immediately
2. Agent 2 starts in parallel, especially logic and policy alignment
3. Agent 3 starts immediately on listing safety, but stays isolated
4. Agent 4 starts on scheduling and sequencing work
5. Agent 5 starts on buyback engine policy and implementation
6. Agent 6 tracks outputs and consolidates docs throughout

## Coordination Rules

- One owner per file set where possible
- Agent 3 owns listing files exclusively
- Agent 5 owns buyback engine files exclusively
- Agent 6 should not make deep code changes in files owned by others unless explicitly asked
- All agents should report blockers as policy, path, or data issues, not just "code bugs"

---

## QA Audit (Code, 24 Mar 2026)

**Auditor:** Code (Claude Code, VPS-verified)

### Verdict

Good workstream separation. File ownership is mostly clean. Several issues need resolving before agents start.

---

### Issue 1: Shared library has no owner (BLOCKER)

The master rebuild plan identifies `backmarket/lib/` (shared library: monday.js, bm-api.js, slack.js, telegram.js, config.js, profitability.js) as a critical dependency that unblocks every other agent. The Code QA audit on the master plan flagged this as HIGH severity.

No agent in this delegation map owns the shared lib build.

- Agent 2 needs it (transaction flows import Monday/BM/Slack helpers)
- Agent 3 needs it (list-device.js currently imports from missing `./lib/`)
- Agent 4 needs it (reconciliation and buy-box scripts)
- Agent 5 needs it (buyback engine)

**Resolution:** Either Agent 1 builds the shared lib as part of Phase 1 (security + foundation), or create a dedicated "Agent 0: Shared Library" that runs before everything else. Without this, Agents 2-5 all independently solve the same problem with duplicated code.

---

### Issue 2: Agent 5 references wrong file (HIGH)

Agent 5 lists `/home/ricky/builds/bm-scripts/buy-box-check.js` as a primary file. But:

- `bm-scripts/buy-box-check.js` is the **sell-side** buy-box script (SOP 07) — that belongs to Agent 4
- The **buyback** buy-box system is Hugo's Python `buyback-monitor/buy_box_monitor.py` — not mentioned anywhere in the delegation map
- No JS buyback buy-box script exists yet — Agent 5 needs to **build** it

**Resolution:** Agent 5's primary files should be:
- `buyback-monitor/buy_box_monitor.py` (existing Python system to replace)
- `buyback-monitor/README.md` (docs on Hugo's system)
- New file to create: `backmarket/services/bm-buyback-engine/` or similar
- `/home/ricky/builds/data/buyback-profitability-lookup.json` (correct)

---

### Issue 3: Agent 2 scope vs architecture mismatch (HIGH)

Agent 2 owns sale-detection, payout, dispatch, and shipping. The master plan says these become separate Express webhook services on ports 8011-8013. But the delegation map lists the old CLI scripts as primary files:
- `scripts/sale-detection.js` — this is a CLI poller, not a webhook handler
- `scripts/trade-in-payout.js` — this is a CLI script, not a webhook handler
- `scripts/shipping.js` — this is a CLI script, not a webhook handler

Ricky decided: rewrite as proper webhook handlers, separate Express servers, own ports. Agent 2 isn't just deploying existing scripts — they're building new services.

**Resolution:** Agent 2's primary files should include:
- New services to create: `backmarket/services/bm-payout/`, `backmarket/services/bm-shipping/`, `backmarket/services/bm-sale-detection/`
- Existing scripts as reference (not the deliverable)
- `icloud-checker/src/index.js` lines 1114-1367 (the monolith endpoints being replaced)
- systemd unit files, nginx routes

---

### Issue 4: Intake automations missing from delegation (MEDIUM)

Master plan Phase 3 includes:
- iCloud recheck extraction to standalone + systemd timer
- Arrival notification automation
- Auto-move from Incoming Future to Today's Repairs

None of these appear in any agent's scope. Agent 2 is closest (core transaction flows) but these are intake support, not transactions.

**Resolution:** Either add to Agent 2's scope or create a lightweight "intake support" responsibility. The recheck extraction in particular is a code task — extract `recheckCron()` from the monolith into `backmarket/services/bm-icloud-recheck/`.

---

### Issue 5: Agent 4 scraper needs Supabase work (MEDIUM)

Agent 4 owns the scraper but the master plan says to build the `bm_market_prices` Supabase table and modify the scraper to write to Supabase (not just JSON files). This is database work + scraper modification, not just scheduling.

The delegation map only mentions "scraper runtime" and "retry logic" — the Supabase piece is invisible.

**Resolution:** Agent 4's scope should explicitly include:
- Create `bm_market_prices` Supabase table (schema in `pricing/bm-market-prices-supabase.md`)
- Extend `sell_price_scraper_v6.js` to upsert to Supabase
- Note: scraper uses Playwright stealth, NOT ClawPod/Massive (the Supabase spec is outdated on this)

---

### Issue 6: `bm-scripts/` directory creates confusion (MEDIUM)

Agent 5 references files in `bm-scripts/`. Agent 3's QA audit flagged that `backmarket/scripts/` is the canonical location (repo reorg on 24 Mar moved everything there). But `bm-scripts/` still exists with the **only copy of the shared lib** (`bm-scripts/lib/`).

Multiple agents referencing different directories = merge conflicts and confusion.

**Resolution:** Before any agent starts:
1. Declare `backmarket/scripts/` canonical
2. Copy `bm-scripts/lib/` → `backmarket/lib/` (or build the shared lib fresh)
3. Archive or delete `bm-scripts/`

---

### Issue 7: Monolith slimming has no owner (MEDIUM)

After Agents 2 and the recheck extraction remove endpoints from the monolith, icloud-checker needs to be slimmed to ~600 lines (intake only). Nobody owns this final cleanup.

**Resolution:** Assign monolith slimming to Agent 1 (security/ingress — they already own icloud-checker) or Agent 2 (they're removing the endpoints). Whichever agent removes the last endpoint should do the final cleanup.

---

### Summary

| # | Issue | Severity | Resolution |
|---|-------|----------|------------|
| 1 | Shared library has no owner | BLOCKER | Add Agent 0 or assign to Agent 1 |
| 2 | Agent 5 references wrong file (sell-side, not buyback) | HIGH | Fix primary files, acknowledge Hugo's Python system |
| 3 | Agent 2 delivering CLI scripts, not webhook services | HIGH | Scope should be new Express services |
| 4 | Intake automations (recheck, arrival, auto-move) unassigned | MEDIUM | Add to Agent 2 or new owner |
| 5 | Agent 4 Supabase work invisible | MEDIUM | Add table creation + scraper modification |
| 6 | `bm-scripts/` vs `backmarket/scripts/` confusion | MEDIUM | Declare canonical, archive old |
| 7 | Monolith slimming unassigned | MEDIUM | Assign to Agent 1 or 2 |
