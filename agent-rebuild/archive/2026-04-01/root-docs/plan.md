# Plan: OpenClaw Agent System Rebuild

**Canonical location:** `/home/ricky/builds/agent-rebuild/plan.md`
**Last updated:** 2026-04-01 (editorial note after workspace rebuild and documentation cleanup)
**Status:** Historical baseline plan. Current state now lives in `/home/ricky/builds/agent-rebuild/technical/control/documentation-state-summary-2026-04-01.md` and the completed documentation rebuild worklog.

> Historical note: this document records the original March rebuild sequence. Between 2026-03-31 and 2026-04-01, the live cleanup, active workspace normalization, KB verification, and `agent-rebuild` reorganization were executed through a different documentation-led workflow. Treat the phase details below as planning context, not current live status.

**Supporting docs:**
- Research: `/home/ricky/builds/agent-rebuild/reference/workspace-research.md` (2026-03-16 VPS audit)
- BM process audit: `/home/ricky/builds/backmarket/docs/staged/2026-04-01/BM-PROCESS-AUDIT.md` (2026-03-17, moved out of `agent-rebuild` on 2026-04-01)
- KB consolidation brief: `/home/ricky/builds/agent-rebuild/reference/KB-CONSOLIDATION-BRIEF.md` (2026-03-16, **SUPERSEDED** by organic approach)
- Previous research: `/home/ricky/builds/agents/research.md` (2026-02-23)

---

## What We're Fixing

Agents complete work then forget it exists. Workspaces are full of stale docs, deprecated files, and unverified data. Mechanical tasks (listing, shipping, label buying) are done by agents with raw API calls instead of deterministic scripts. The same analysis gets repeated because previous results aren't findable. KB was created but populated with unverified data copied from agent workspaces.

## Decisions Made (2026-03-17)

1. **Fix Jarvis first.** The coordinator must be solid before rebuilding anything downstream.
2. **KB fills organically.** No bulk consolidation of unverified data. Verified data goes to `/kb/` as a byproduct of workspace rebuilds. Nothing enters `/kb/` unverified.
3. **BM mechanical steps become scripts, not agent work.** Listing, shipping, label buying, order sync: all scripts triggered by Monday status changes or crons. Hugo becomes strategist and exception handler only.
4. **BM workspace + script pipeline are one project.** Clean workspace tells Hugo what to do when scripts flag exceptions. Scripts handle the mechanical work. Two sides of one system.
5. **QA agent needed.** Dedicated agent whose sole purpose is ensuring all workspace files are up to date and running smoothly. Created after initial rebuilds are done.
6. **Personal agents depend on workspace quality.** Don't onboard team members onto agents that reference broken data. Workspaces must be solid first.
7. **Alex-CS workspace is the gold standard.** Small files (24-50 lines each), clear hierarchy, purpose-built for its job, no junk. Every workspace rebuild follows this pattern.

---

## Revised Sequence

1. ~~Phase 1: Foundation~~ ✅ (2026-03-16)
2. ~~Phase 2: Jarvis Deep Clean~~ ✅ (2026-03-17)
3. **Phase 3: BM Rebuild** (historical planning context; later work diverged)
4. **Phase 4: Other Agent Workspace Rebuilds** — effectively completed later via the 2026-03-31 to 2026-04-01 workspace normalization pass
5. **Phase 5: QA Agent**
6. **Phase 6: Personal Agents** (Safan, Misha, Roni, Andreas)
7. **Phase 7: Cross-Agent Coordination**

---

## Phase 1: Foundation ✅ (Completed 2026-03-16)

Executed by Code. Full checklist below with all items verified.

**What was done:**
- KB structure created at `/home/ricky/kb/` (20 files, 6 domains)
- KB symlinked into all 10 agent workspaces
- memorySearch.extraPaths configured: `["knowledge/", "docs/", "data/", "kb/"]`
- Save-fact pipeline killed (bootstrap hook, 12 CLAUDE.md files, crontab)
- Jarvis CLAUDE.md rewritten (26 → 184 lines)
- knowledge/ directories created for all 8 agents
- TEAM.md converted to pointer file (Search, Don't Load pattern)
- Gateway restarted and verified

**What was missed (addressed in Phase 2):**
- KB content was not verified against live sources
- MEMORY.md was not actually slimmed
- Deprecated SOPs not removed from Hugo's workspace
- save-fact still referenced in PM agent (dead agent, low risk)
- No maintenance routines implemented

**Lessons learned:**
- memorySearch.extraPaths only indexes workspace-relative paths; external dirs need symlinks
- Foundation docs loaded at bootstrap override KB; use pointer files, not data files
- Structure without verified content is just a prettier mess

### Phase 1 Execution Checklist

- [x] 1.1 Delete broken `]` directory
- [x] 2.1-2.2 Create KB directory tree + README
- [x] 3.1-3.4 Populate KB: Monday schemas (4 files)
- [x] 4.1-4.6 Populate KB: Pricing (5 files from alex-cs)
- [x] 5.1-5.3 Populate KB: BackMarket (3 files)
- [x] 6.1-6.3 Populate KB: Operations (3 files)
- [x] 7.1-7.2 Populate KB: Team (2 files)
- [x] 8.1-8.2 Populate KB: System (2 files)
- [x] 9.1-9.5 Rewrite Jarvis CLAUDE.md
- [x] 10.1-10.8 Add KB refs + workspace rules to all domain leads
- [x] 11.1-11.4 Remove save-fact from infrastructure agents
- [x] 12.1-12.8 Create knowledge/ directories for all agents
- [x] 13.1-13.2 Kill save-fact pipeline
- [x] 14.1-14.6 Clean Jarvis workspace (transcriptions, knowledge files)
- [x] 15.1-15.2 Configure memorySearch.extraPaths
- [x] 16.1-16.5 Deploy and verify gateway
- [x] 17.1-17.5 Test Jarvis responses

---

## Phase 2: Jarvis Deep Clean ✅ (Completed 2026-03-17)

Executed by Jarvis. Ricky reviewed in session.

**What was done:**
- MEMORY.md rebuilt from scratch: 8.4KB → 3.5KB. Every entry verified with source.
- Archived 25 memory files (18 old + 7 session dumps). memory/ went from 44 files/472KB → 19 files/116KB.
- AGENTS.md fixed: added alex-cs, arlo-website. Removed dead schedule agent. Updated nightly maintenance status.
- TOOLS.md fixed: added missing agent group IDs (alex-cs, arlo-website). Removed schedule.
- CLAUDE.md fixed: role description (coordinator AND builder, not just delegator), foundation path corrected, daily briefing marked as disabled.
- HEARTBEAT.md updated with maintenance tasks (workspace health check, agent workspace scan).
- Archived 2 dead docs (master-plan, royal-mail research).
- Cleaned 11 dead cron jobs (10 ancient one-shots from Feb 5, 1 duplicate buy box monitor).
- Daily log written.
- Git committed.

### Phase 2 Verification

- [x] "Who's on the team?" — correct roster, Adil shown as dismissed Mar 5, sources cited
- [x] "What do we know about buyback profitability?" — memory search returns knowledge/buyback-strategy.md as top hit
- [x] "What's the labour rate?" — £24/hr, consistent across MEMORY.md, knowledge/buyback-strategy.md, knowledge/revenue-model.md
- [x] "When was Adil dismissed?" — Mar 5, consistent across 3 sources
- [x] "Where's the previous buyback analysis?" — findable via MEMORY.md links and memory search (the exact failure that triggered this rebuild)

### Files Modified (Phase 2)

| Path | Action |
|------|--------|
| `~/.openclaw/agents/main/workspace/MEMORY.md` | REWRITE from scratch (8.4KB → 3.5KB) |
| `~/.openclaw/agents/main/workspace/AGENTS.md` | FIX — added alex-cs, arlo-website; removed schedule; updated maintenance status |
| `~/.openclaw/agents/main/workspace/TOOLS.md` | FIX — added missing group IDs |
| `~/.openclaw/agents/main/workspace/CLAUDE.md` | FIX — role description, foundation path, briefing status |
| `~/.openclaw/agents/main/workspace/HEARTBEAT.md` | REWRITE — added maintenance tasks |
| `~/.openclaw/agents/main/workspace/memory/2026-03-17.md` | NEW — daily log |
| `~/.openclaw/agents/main/workspace/archive/memory/` | NEW — 25 files archived |
| `~/.openclaw/agents/main/workspace/archive/docs/` | NEW — 2 docs archived |
| 11 cron jobs | DELETED — ancient/disabled |

---

## Phase 3: BM Rebuild (Next)

**Two parallel tracks, one project:**

### Track A: Hugo's Workspace Rebuild ✅ (Completed 2026-03-18)

Rebuilt to Alex-CS standard. Code reviewed initial pass (B-), remediation completed, SOPs archived.

**Final state (5 root files):** CLAUDE.md, SOUL.md, MEMORY.md, TOOLS.md, USER.md
**Docs:** api-reference.md, monday-reference.md, exception-playbook.md, process-map.md, ferrari-guide.md, listings-research.md
**SOPs:** archived to `archive/docs/SOPs/`. Hugo is strategist/exception handler; scripts handle mechanics.
**Commits:** 3 on `wi/sop-mandate-update` (rebuild + remediation + SOP archival)

**Pending:** Hugo's workspace needs one more pass AFTER Track B deploys to strip executor-era docs (api-reference, monday-reference) and replace with script reference doc. Those docs currently serve as fallback while scripts aren't live.

### Track B: Script Pipeline ✅ (All builds written 2026-03-18, awaiting QA + deployment)

**Built by Jarvis. 11 builds in one session.**

| # | Build | Location | Status |
|---|-------|----------|--------|
| 1 | dispatch.js split (remove premature BM notification) | `/builds/royal-mail-automation/dispatch.js` | ✅ Written |
| 2 | Shipping confirmation webhook | `/builds/icloud-checker/src/index.js` route | ✅ Deployed (inactive until webhook registered) |
| 3 | Instant payout webhook | `/builds/icloud-checker/src/index.js` route | ✅ Deployed (inactive until webhook registered) |
| 4+5 | Listing automation (Path A + B) | `/builds/icloud-checker/src/index.js` + `src/lib/` modules | ✅ Deployed (inactive) |
| 6 | Counter-offer module | `/builds/icloud-checker/src/lib/counter-offer.js` + index.js | ✅ Deployed (inactive) |
| 7 | Morning briefing | `/builds/bm-scripts/morning-briefing.js` | ✅ Written, needs cron |
| 8 | Daily reconciliation | `/builds/bm-scripts/reconcile.js` | ✅ Written, needs cron |
| 9 | Daily profitability check | `/builds/bm-scripts/profitability-check.js` | ✅ Written, needs cron |
| 10 | Intake grade prediction | `/builds/icloud-checker/src/index.js` route | ✅ Deployed (inactive) |
| V6 | Sell price scraper (stealth Playwright) | `/builds/buyback-monitor/sell_price_scraper_v6.js` | ✅ Tested, 16/16 models |

**Shared modules created:**
- `src/lib/colour-map.js`, `grade-map.js`, `profitability.js`, `bm-listings-cache.js`, `counter-offer.js`
- `bm-scripts/lib/monday.js`, `slack.js`, `bm-api.js`, `dates.js`, `logger.js`

**Also fixed:** icloud-checker dedup (BM 1376 spam), dispatch.js `matchToMonday()` returns item IDs, tracking writes to Monday `text53`.

**Blocked until Friday:** Monday webhook registration (account locked). 5 webhooks needed: shipping, payout, to-list, grade-check x2.

**Key technical decisions:**
- Massive/ClawPod replaced by stealth Playwright (0 cost, 100% success rate, ~2 min for 16 models)
- All webhook routes added to icloud-checker Express service (port 8010, single service)
- Column IDs verified from live Monday API: purchase cost = `numeric` (BM Devices Board), parts = `lookup_mkx1xzd7`, hours = `numeric_mkxcedc` (Main Board)
- Build 11 (scraper optimisation) superseded by V6 scraper
- Build 12 (portal browser agent) deferred as separate project

### Phase 3 Verification (for Code QA)

**Files to review:**
1. `/home/ricky/builds/royal-mail-automation/dispatch.js` — Build 1 (BM tracking removed, tracking write added, matchToMonday returns objects)
2. `/home/ricky/builds/icloud-checker/src/index.js` — Builds 2, 3, 4/5, 6, 10 (all webhook routes + dedup fix)
3. `/home/ricky/builds/icloud-checker/src/lib/colour-map.js` — colour mapping
4. `/home/ricky/builds/icloud-checker/src/lib/grade-map.js` — grade mapping
5. `/home/ricky/builds/icloud-checker/src/lib/profitability.js` — cost calculation
6. `/home/ricky/builds/icloud-checker/src/lib/bm-listings-cache.js` — listings file loader
7. `/home/ricky/builds/icloud-checker/src/lib/counter-offer.js` — counter-offer module
8. `/home/ricky/builds/bm-scripts/morning-briefing.js` — Build 7
9. `/home/ricky/builds/bm-scripts/reconcile.js` — Build 8
10. `/home/ricky/builds/bm-scripts/profitability-check.js` — Build 9
11. `/home/ricky/builds/bm-scripts/lib/*.js` — shared helpers
12. `/home/ricky/builds/buyback-monitor/sell_price_scraper_v6.js` — Scraper V6
13. `/home/ricky/.openclaw/agents/backmarket/workspace/` — Track A (Hugo workspace)

**Verification checklist:**
- [ ] dispatch.js no longer calls BM API after label purchase
- [ ] dispatch.js writes tracking to Monday `text53` (Outbound Tracking)
- [ ] Shipping webhook reads tracking from `text53`, sends to BM
- [ ] Payout webhook validates buyback, updates Monday to Purchased
- [ ] Colour map blocks on unmapped colours
- [ ] Listing Path A: POST not PATCH, includes pub_state:2
- [ ] Listing Path B: profitability check before auto-listing
- [ ] Counter-offer rate tracked and capped at 15%
- [ ] Column IDs match live Monday board (verified: numeric, lookup_mkx1xzd7, numeric_mkxcedc)
- [ ] Scraper V6 runs without Massive, extracts all picker data
- [ ] No hardcoded credentials in new code (or matches existing pattern)
- [ ] All files pass `node -c` syntax check

---

## Phase 4: Other Agent Workspace Rebuilds

Same treatment as Hugo. Jarvis rebuilds each workspace to Alex-CS standard. Code QAs.

**Order (by broken-ness):**
1. Operations (stale docs, references non-existent flows)
2. Parts (minimal workspace, needs actual inventory management)
3. Team (stale docs, references old 10-agent system)
4. Customer-service (relatively clean but unverified)
5. Marketing (relatively clean)
6. Website (relatively clean)

**For each agent:**
- Audit every file: current, stale, or junk
- Archive/delete junk
- Verify reference data against live sources
- Verified data goes to `/kb/{domain}/`
- Slim workspace to what the agent actually needs
- Code QAs the result

**KB grows organically through this process.** Each workspace rebuild produces verified data that goes into `/kb/`. No bulk consolidation.

---

## Phase 5: QA Agent

**Dedicated agent whose sole purpose is file health and data freshness.**

- Agent ID: TBD
- Model: Sonnet
- No Telegram group (runs on crons, reports to Jarvis)

**Responsibilities:**
- Daily: scan all agent knowledge/ dirs for new/changed files. Flag anything that contradicts `/kb/`.
- Weekly: full `/kb/` audit. Check `Last verified` dates. Flag anything >30 days stale.
- Weekly: scan `/builds/` for new analysis docs. Flag conclusions that should be promoted to `/kb/`.
- On demand: verify specific data against live APIs (Monday column IDs, BM endpoints, pricing).
- Conflict detection: if two agents have contradictory data, flag to Ricky.

**Staleness thresholds:**
- Pricing files: verify weekly
- Monday schemas: verify monthly
- SOPs: verify monthly
- Team roster: verify on any staffing change

---

## Phase 6: Personal Agents

**Prerequisite:** Phases 3-4 complete. Workspaces are solid. KB has verified data.

**Prerequisite from Ricky:**
- Create 4 Telegram bots via @BotFather
- Create 4 Telegram groups (Ricky + team member + bot)
- Share tokens and chat IDs
- Decide on agent names (started discussing: Sam/Safan, Max/Misha, Rex/Roni, Ace/Andreas)
- Create Monday.com "iCorrect Agent" user account for agent writes

**Agents:**
- **For Roni**: QC lead, BM diagnostics, parts management. Surfaces queue, flags stuck items.
- **For Safan**: Lead repair tech, queue visibility, diagnostics. Sees what's coming, writes notes fast.
- **For Misha**: Lead refurb tech. Captures undocumented methods over time.
- **For Andreas**: Refurb tech. Keeps efficient, flags when pulled to non-refurb work.

**Each agent is dual-purpose:**
1. Help the team member with their work
2. Help Ricky manage (surface patterns, flag issues, track performance)

**Template:** Alex-CS workspace structure (SOUL.md, AGENTS.md, TOOLS.md, MEMORY.md).

---

## Phase 7: Cross-Agent Coordination

**Prerequisite:** All previous phases complete.

- Re-enable morning briefing cron
- Jarvis reviews domain agent knowledge/ files, spots cross-domain patterns
- Agents share relevant data (BM volume → operations capacity, marketing rankings → repair volume)
- Delegation: Jarvis assigns tasks to domain leads
- The vision: BM says "orders dipped", marketing says "rankings up", queue agent says "need to throttle intake", team agent says "new hire onboarding in 3 weeks"

**Not scoped in detail yet.** This builds naturally once the individual agents are solid.

---

## What This Plan Does NOT Cover

- n8n Cloud → self-hosted migration (separate project, depends on Phase 3 Track B)
- Supabase RLS security hardening
- builds/ directory cleanup
- Broken SEO crons (marketing domain)
- React intake form rebuild
- Multi-bot migration for existing domain leads
- Repair procedure documentation (Operations agent task)

---

## Cancelled / Superseded

- **KB Consolidation Brief** (`KB-CONSOLIDATION-BRIEF.md`): superseded by organic approach. KB fills as workspaces are rebuilt, not via bulk copy. Brief kept for reference but should not be executed.
- **Phase 1.5** from original plan: replaced by Phase 2 (Jarvis deep clean) and organic KB approach.
- **Old Phase 3** (Jarvis Proactive Behaviour): folded into Phase 7 (cross-agent coordination).
- **Old Phase 4** (Domain Lead Upgrades): folded into Phase 4 (workspace rebuilds).
