# Mission Control v2 — Complete Build Plan (All 12 Phases)

## Context

Rebuilding the multi-agent system from a Telegram-only setup to a structured, workflow-driven system with Supabase as persistent storage. Currently 12 agents running via OpenClaw on Hetzner VPS. V2 adds structured memory, QA review loops, webhook-driven workflows, and cross-agent coordination. V2 builds alongside — no cutover until proven.

**Reference docs:**
- PRD: `~/Downloads/mission-control-prd-v2.md`
- Existing plan: `~/.claude/plans/frolicking-conjuring-kettle.md`
- PRD handoff: `~/Downloads/mission-control-prd-handoff.md`

**Current state on VPS:**
- 12 agents running (11 Telegram + 1 Slack: `slack-jarvis`)
- `/home/ricky/mission-control-v2/` — skeleton dir + 3 SQL files, git init'd but no commits
- Supabase env vars all set (URL + anon key + service role key) at `/home/ricky/config/supabase/.env`
- psql 16 installed, Python 3.12.3, Node 22, supabase-py + httpx already installed
- No hooks directory on disk yet (`~/.openclaw/hooks/` doesn't exist)
- v1 dashboard still live at mc.icorrect.co.uk

**Critical path:** Phase 1 → 2 → 5 → 8 → 9. Phases 3, 4, 6, 7 parallelizable after Phase 2.

---

## Pre-Build: Ricky Actions Required

| Item | Phase | Action |
|------|-------|--------|
| Supabase DB password | 1 | Dashboard → Settings → Database → "Database password" section |
| ~~Confirm dropping v1 tables~~ | 1 | **CONFIRMED** — drop `agents`, `tasks`, `activity_log` |
| ~~`slack-jarvis` in registry?~~ | 1 | **CONFIRMED** — include as infrastructure agent, parent=jarvis, model=sonnet |
| PM Telegram group | 8 | Create group, add bot as admin, share chat ID |
| 18 hidden Telegram groups | 10 | For sub-agents (batch creation) |
| Approve `WEBHOOK_SHARED_SECRET` | 4 | Add to `/home/ricky/config/api-keys/.env` |

---

## Phase 1: Git Repo + Supabase Schema
**Risk: None** | Blocks everything

SQL files already written. Just need to deploy.

| # | Task | Verification |
|---|------|-------------|
| 1.1 | Get Supabase DB password, connect via psql | `psql "postgresql://postgres:[PW]@db.rydvxdoccryqtlcrrcag.supabase.co:5432/postgres" -c "SELECT 1"` |
| 1.2 | Run `setup-schema.sql` (drops v1 tables, creates 9 v2 tables + indexes + triggers + realtime) | `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1;` → 9 tables |
| 1.3 | Run `rls-policies.sql` (enables RLS, creates read/write policies for anon role) | `SELECT policyname FROM pg_policies WHERE schemaname='public';` → policies on all 9 tables |
| 1.4 | Run `seed-registry.sql` (30 agents: 11 top-level + slack-jarvis + 18 sub-agents + 12 heartbeat rows). Update SQL to add slack-jarvis row. | REST query to `agent_registry` returns 30 rows |
| 1.5 | Verify all 9 tables accessible via Supabase REST API | `curl` each table → 200 |
| 1.6 | Initial git commit + tag `phase-1` | `git log --oneline -1` |

**Blocker:** Need DB password OR Ricky pastes SQL into Supabase SQL Editor.

---

## Phase 2: Python Wrappers + Seed Data + Utilities
**Risk: None** | Depends on Phase 1

| # | Task | Key File | Verification |
|---|------|----------|-------------|
| 2.1 | Create Supabase client module (reads env vars, returns initialized client) | `scripts/supabase/client.py` | `python3 client.py --test` → "Connected: OK" |
| 2.2 | Create wrapper.py (read/write with audit snapshots for business_state + memory) | `scripts/supabase/wrapper.py` | `python3 wrapper.py --test` → writes/reads/deletes test data |
| 2.3 | Create Telegram alert utility (direct Bot API, fallback when gateway is down) | `scripts/utils/telegram-alert.py` | `--test "Phase 2 complete"` → message in Ricky DM |
| 2.4 | Create memory taxonomy config (12 categories from PRD) | `config/memory-taxonomy.yaml` | `python3 -c "import yaml; ..."` → 12 categories |
| 2.5 | Create `requirements.txt` + install deps (supabase, httpx, pyyaml, python-dotenv) | `requirements.txt` | `pip install -r requirements.txt` succeeds |
| 2.6 | Git commit `phase-2` | | |

---

## Phase 3: Health Check + Reconciliation + Maintenance Scripts
**Risk: None** | Depends on Phase 2 | Can parallel with Phases 4, 6, 7

| # | Task | Schedule | Key File |
|---|------|----------|----------|
| 3.1 | Health check (Supabase, gateway, VPS resources, heartbeats, SSL, stuck items) | Every 15 min | `config/cron/health-check.py` |
| 3.2 | Reconciliation (stuck work items → Telegram alert to Systems + Jarvis) | Every 5 min | `config/cron/reconciliation.py` |
| 3.3 | Nightly janitor (dedup facts, archive stale, flag malformed, check orphans) | 10pm UTC | `scripts/maintenance/nightly-janitor.py` |
| 3.4 | Rebuild MEMORY.md from Supabase (nightly snapshot, not enabled until Phase 8) | After janitor | `scripts/maintenance/rebuild-memory-md.py` |
| 3.5 | Create log dirs (`/home/ricky/logs/{health,maintenance,webhooks}/`) | — | — |
| 3.6 | Install crontab entries (absolute paths, source .env explicitly) | — | `crontab -l` shows entries |
| 3.7 | Git commit `phase-3` | | |

All scripts are pure Python, zero AI cost.

---

## Phase 4: Webhook Infrastructure
**Risk: Medium** (new nginx config + systemd service) | Depends on Phase 2 | Can parallel with Phases 3, 6, 7

Architecture: Supabase DB Webhook → HTTPS POST to VPS → FastAPI validates → Telegram message to target agent.

| # | Task | Key File | Notes |
|---|------|----------|-------|
| 4.1 | Generate `WEBHOOK_SHARED_SECRET`, add to api-keys/.env | — | Ricky must approve edit |
| 4.2 | Install FastAPI + uvicorn deps | `requirements.txt` | |
| 4.3 | Create FastAPI webhook receiver (shared secret auth, idempotency, throttle check, Telegram trigger) | `scripts/webhooks/agent-trigger.py` | Port 8002 (8001 already in use) |
| 4.4 | Create systemd user service for agent-trigger | `~/.config/systemd/user/agent-trigger.service` | |
| 4.5 | Add nginx `/api/webhook` location block proxying to localhost:8002 | `/etc/nginx/sites-available/mission-control` | `sudo nginx -t` before reload |
| 4.6 | Configure Supabase DB Webhook on `work_items` INSERT/UPDATE | Supabase Dashboard | Ricky may need to do this |
| 4.7 | Git commit `phase-4` | | |

**Verification:** `curl -X POST https://mc.icorrect.co.uk/api/webhook -H "Authorization: Bearer WRONG" -d '{}'` → 401

---

## Phase 5: Custom OpenClaw Hooks
**Risk: Medium** (gateway restart = all agents offline ~30s) | Depends on Phase 2

4 hooks, all using native `fetch()` (Node 22) for Supabase REST calls. Fire-and-forget writes.

| # | Task | Event | What It Does |
|---|------|-------|-------------|
| 5.1 | `supabase-bootstrap` hook | `agent:bootstrap` | Injects memory summaries + unread messages into context. Writes heartbeat. |
| 5.2 | `dependency-check` hook | `agent:bootstrap` | Checks Supabase + workspace files. On fail: HARD BLOCK + Telegram alert. |
| 5.3 | `supabase-memory` hook | `command:new` | Pushes "save your facts" reminder. Writes session-end heartbeat. |
| 5.4 | `agent-activity-logger` hook | `agent:bootstrap` + `command:new` | Logs session start/end to agent_activity + Telegram activity group. |
| 5.5 | Backup `~/.openclaw/` before deployment | — | `tar czf ~/.openclaw-backup-phase5.tar.gz ~/.openclaw/` |
| 5.6 | Deploy hook files to `~/.openclaw/hooks/` | — | 4 dirs, each with HOOK.md + handler.js |
| 5.7 | Register hooks in `openclaw.json` | — | Careful: understand full binding structure first |
| 5.8 | Restart gateway (schedule quiet hours) | — | `systemctl --user restart openclaw-gateway` |
| 5.9 | Verify all hooks fire | — | Send message → check heartbeat + activity table |
| 5.10 | Git commit `phase-5` | | |

---

## Phase 6: Infrastructure Agent Definitions (6 agents)
**Risk: None** (writing files only) | Depends on Phase 1 | Can parallel with Phases 3-5

Write SOUL.md + CLAUDE.md for each. All in git repo at `/home/ricky/mission-control-v2/agents/{id}/`.

| # | Agent | Model | Key Role |
|---|-------|-------|----------|
| 6.1 | Jarvis | Opus | C-suite coordinator + scheduling (absorbed Schedule). Daily briefing, clarification protocol. |
| 6.2 | PM | Sonnet | Workflow orchestrator. 5-min sweep, conflict detection, daily summary. |
| 6.3 | QA-Plan | Sonnet | Strategy reviewer. PROTECTED SOUL. Review checklist, approve/reject. |
| 6.4 | QA-Code | Sonnet | Code reviewer. PROTECTED SOUL. Security/architecture checks. |
| 6.5 | QA-Data | Sonnet | Fact verifier. PROTECTED SOUL. Cross-namespace conflict detection. |
| 6.6 | Systems | Haiku | Infrastructure watchdog. VPS, services, SSL, health check interpretation. |
| 6.7 | Workflow templates (standard-plan.yaml, code-build.yaml, research.yaml) | — | `config/workflows/` |
| 6.8 | Git commit `phase-6` | | |

Every CLAUDE.md includes: Supabase instructions, routing table, memory rules, degraded mode compliance, timezone (UTC+8).

---

## Phase 7: Domain Lead Definitions (5 agents)
**Risk: None** (writing files only) | Can combine session with Phase 6

| # | Agent | Model | Key Role | Sub-agents |
|---|-------|-------|----------|------------|
| 7.1 | Operations | Sonnet | Workshop engine. Elevated from `processes`. | ops-team, ops-parts, ops-intake, ops-queue, ops-sop, ops-qc |
| 7.2 | Backmarket | Sonnet | 60% of revenue. Listings, pricing, grading. | bm-listings, bm-pricing, bm-grading, bm-ops |
| 7.3 | Finance | Sonnet | Xero, HMRC monitoring, KPIs, cash flow. | fin-cashflow, fin-kpis |
| 7.4 | Customer Service | Sonnet | Replaces Finn. Intercom, escalation. | cs-intercom, cs-escalation |
| 7.5 | Marketing | Sonnet | Growth. Absorbs Website. Content, SEO, AdWords. | mkt-website, mkt-content, mkt-seo, mkt-adwords |
| 7.6 | Verify standardized CLAUDE.md sections across all 5 | | Routing table, Supabase, memory rules, sub-agent delegation protocol |
| 7.7 | Git commit `phase-7` | | |

---

## Phase 8: OpenClaw Registration + Model Migration
**Risk: HIGH** | Depends on Phases 5, 6, 7 | 5 incremental steps with verification

| # | Step | Change | Verification |
|---|------|--------|-------------|
| 8.1 | Full backup of `~/.openclaw/` | tar + git snapshot | Backup file exists |
| 8.2 | **Step A:** Register PM agent only | New in openclaw.json, Sonnet, PM Telegram group | PM responds + 3 existing agents still work |
| 8.3 | **Step B:** Register QA-Plan, QA-Code, QA-Data | 3 new agents, Sonnet, no Telegram (internal) | Gateway healthy, heartbeats written |
| 8.4 | **Step C:** Rename `processes` → `operations`, `finn` → `customer-service` | Same Telegram chat IDs, new workspace dirs | Message in old groups triggers new agent names |
| 8.5 | **Step D:** Switch model overrides | Opus=Jarvis, Sonnet=domain+QA+PM, Haiku=Systems | Systems responds faster (Haiku), Jarvis still Opus |
| 8.6 | **Step E:** Retire `schedule` agent | Remove from config, archive workspace | 11 top-level agents all respond |
| 8.7 | Update `agent_registry` in Supabase to match | — | Registry matches openclaw.json |
| 8.8 | Symlink git repo agent files → OpenClaw workspaces | SOUL.md + CLAUDE.md symlinks | `ls -la` shows symlinks |
| 8.9 | Add Supabase instructions to all CLAUDE.md files | "Write facts to Supabase. MEMORY.md is auto-generated." | Grep confirms all agents have it |
| 8.10 | Backup existing MEMORY.md → MEMORY-legacy.md | For all agents | Legacy files exist |
| 8.11 | Git commit `phase-8` | | |

**Rollback:** Restore from tar backup, restart gateway. All 12 original agents come back.

**Each step requires:** backup → edit → `openclaw doctor` → restart → verify → proceed.

---

## Phase 9: Workflow Engine E2E Test
**Risk: Low** (testing only) | Depends on Phases 4, 5, 8

| # | Test | What We're Verifying |
|---|------|---------------------|
| 9.1 | Message Jarvis → work item created | Clarification protocol, source_input captured |
| 9.2 | Jarvis assigns to Operations | Webhook fires, Telegram message in Operations group |
| 9.3 | Operations researches + submits | Status transitions, locked_by set |
| 9.4 | QA-Plan rejects | Rejection feedback in agent_messages, revision_needed status |
| 9.5 | Operations revises + resubmits | rejection_count increments |
| 9.6 | QA-Plan approves | approved status, agent_activity logged |
| 9.7 | Reconciliation catches stuck item | Test with old updated_at, alert fires |
| 9.8 | Health check passes | All 6 checks green |
| 9.9 | Document results in `docs/e2e-test-results.md` | Baseline for future regression |

Budget 50% of session time for debugging. This is where integration issues surface.

---

## Phase 10: Sub-Agents (18 agents in 2 waves)
**Risk: Medium** (many new agents + Telegram groups) | Depends on Phase 8

### Wave 1: Operations + Backmarket (10 sub-agents)
| # | Task |
|---|------|
| 10.1 | Ricky creates 10 hidden Telegram groups, adds bot, shares chat IDs |
| 10.2 | Write SOUL.md + CLAUDE.md for 6 Operations sub-agents |
| 10.3 | Write SOUL.md + CLAUDE.md for 4 Backmarket sub-agents |
| 10.4 | Register all 10 in OpenClaw (Haiku model, hidden Telegram bindings) |
| 10.5 | Update agent_registry with parent_agent links |
| 10.6 | Git commit wave-1 |

**Note:** ops-team inherits from retired `team` agent. ops-parts inherits from retired `parts` agent.

### Wave 2: Finance + CS + Marketing (8 sub-agents)
| # | Task |
|---|------|
| 10.7 | Ricky creates 8 hidden Telegram groups |
| 10.8 | Write SOUL.md + CLAUDE.md for all 8 sub-agents |
| 10.9 | Register all 8 in OpenClaw |
| 10.10 | Update agent_registry (mkt-adwords = dormant) |
| 10.11 | Git commit wave-2 |

**Note:** cs-intercom inherits Finn's Intercom knowledge. mkt-website inherits Website agent's knowledge.

**Deferred:** Systems sub-agents (vps, services, deployment) — Systems handles a narrow domain on Haiku, sub-agents add complexity without clear value yet.

---

## Phase 11: External Integrations + Daily Briefing
**Risk: Low** | Depends on Phase 8

| # | Task | Schedule | Key File |
|---|------|----------|----------|
| 11.1 | Monday.com read API wrapper (boards for Operations, Parts) | — | `scripts/integrations/monday.py` |
| 11.2 | Intercom read API wrapper (conversations, contacts) | — | `scripts/integrations/intercom.py` |
| 11.3 | Daily briefing (queries last 24h, triggers Jarvis to synthesize) | 1am UTC = 9am Bali | `config/cron/daily-briefing.py` |
| 11.4 | Weekly summary (metrics compilation, triggers domain lead memory reviews) | Sun 10pm UTC | `config/cron/weekly-summary.py` |
| 11.5 | Nightly Supabase → JSON backup (30-day retention) | 11pm UTC | `scripts/utils/git-export.py` |
| 11.6 | Install all crontab entries | — | `crontab -l` shows all |
| 11.7 | Git commit `phase-11` | | |

---

## Phase 12: Dashboard Rebuild + n8n Removal
**Risk: Medium** (replacing live dashboard) | Depends on Phase 9 | 2 sessions

### Session 1: Build
| # | Component | Details |
|---|-----------|---------|
| 12.1 | React project setup | Vite + React + TS + Tailwind v4 + @supabase/supabase-js + @dnd-kit |
| 12.2 | Kanban board | Work items by status, drag-and-drop, real-time via Supabase Realtime |
| 12.3 | Agent health panel | Green/yellow/red from agent_heartbeats, Telegram group links |
| 12.4 | Activity feed | Live agent_activity stream, filterable |
| 12.5 | Daily briefing archive | Historical briefings |
| 12.6 | Business state KPIs | From business_state table, organized by domain |
| 12.7 | Responsive design | MacBook, iPad, iPhone breakpoints |

### Session 2: Deploy
| # | Task |
|---|------|
| 12.8 | Production build (`npm run build`) |
| 12.9 | Update nginx to serve v2 dashboard (keep `/api/webhook` block) |
| 12.10 | E2E verification (Kanban, health panel, real-time, drag-and-drop) |
| 12.11 | n8n removal (ONLY after 1+ week proven + Ricky's explicit approval) |
| 12.12 | Archive v1 mission-control (tar backup, 90-day retention) |
| 12.13 | Git commit `phase-12` |

---

## Dependency Graph

```
Phase 1 (Schema)
  └→ Phase 2 (Wrappers)
       ├→ Phase 3 (Cron scripts) ──────────────────┐
       ├→ Phase 4 (Webhooks) ──────────────────────┤
       ├→ Phase 5 (Hooks) ─────────────────────────┤
       ├→ Phase 6 (Infra agent defs) ─────────────┤
       └→ Phase 7 (Domain lead defs) ─────────────┤
                                                    ▼
                                           Phase 8 (Registration) ← CONVERGENCE
                                                    │
                                    ┌───────────────┼───────────────┐
                                    ▼               ▼               ▼
                            Phase 9 (E2E)   Phase 10 (Subs)  Phase 11 (Integrations)
                                    │
                                    ▼
                            Phase 12 (Dashboard)
```

## Timeline Estimate

| Phase | Sessions | Week |
|-------|----------|------|
| 1 + 2 | 1-2 | 1 |
| 3 + 4 + 6 + 7 (parallel) | 2-3 | 1-2 |
| 5 | 1 | 2 |
| 8 | 1 | 3 |
| 9 | 1 | 3 |
| 10 | 2 | 3-4 |
| 11 | 1 | 4 |
| 12 | 2 | 4-5 |
| **Total** | **11-14** | **~4-5 weeks** |

---
---

# Detailed Task Checklist

**Added:** 2026-02-22  
**Status key:** [x] = done, [ ] = remaining, [~] = partial / needs verification  
**Cross-referenced against:** `docs/BUILD.md`, live VPS state, `docs/qa-trigger/MASTER-AUDIT.md`

---

## Phase 1: Git Repo + Supabase Schema

**Status: COMPLETE**

- [x] 1.1 Get Supabase DB password from dashboard
- [x] 1.2 Connect to Supabase via psql and verify connectivity
- [x] 1.3 Run `setup-schema.sql` — create 9 v2 tables with indexes + triggers + realtime
  - [x] `agent_registry`
  - [x] `memory_facts` (with namespace, category, supersedes chain, archive flag)
  - [x] `memory_summaries`
  - [x] `agent_activity` (4 indexes: agent, work_item, created_at DESC, action_type)
  - [x] `agent_messages` (threaded to work_items, is_read tracking)
  - [x] `work_items` (14 statuses, priority tiers, locking, stuck thresholds)
  - [x] `business_state` (domain ownership, value_type)
  - [x] `agent_heartbeats` (dependency_check JSONB)
  - [x] `audit_snapshots` (before/after JSONB)
- [x] 1.4 Run `rls-policies.sql` — enable RLS + create read/write policies on all 9 tables
- [x] 1.5 Run `seed-registry.sql` — seed 30 agents (11 top-level + slack-jarvis + 18 sub-agents)
  - [x] Add `slack-jarvis` row (infrastructure, parent=jarvis, model=sonnet)
  - [x] Seed 12 heartbeat rows for active agents
- [x] 1.6 Verify all 9 tables accessible via Supabase REST API (`curl` each → 200)
- [x] 1.7 Enable Supabase Realtime on: `work_items`, `agent_activity`, `agent_heartbeats`, `agent_messages`, `business_state`
- [x] 1.8 Initial git commit + tag `phase-1`
- [x] 1.9 Drop v1 tables (`agents`, `tasks`, `activity_log`) — confirmed by Ricky

---

## Phase 2: Python Wrappers + Seed Data + Utilities

**Status: COMPLETE**

- [x] 2.1 Create Supabase client module
  - [x] Read env vars from `/home/ricky/config/supabase/.env`
  - [x] Return initialized `supabase.Client`
  - [x] `--test` flag → "Connected: OK"
  - [x] File: `scripts/supabase/client.py`
- [x] 2.2 Create wrapper.py with audit snapshot support
  - [x] `write_business_state()` — read-before-write + audit snapshot
  - [x] `write_memory_summary()` — same pattern
  - [x] `read_memory_facts()` — filter by namespace, category, agent_id
  - [x] `--test` flag → writes/reads/deletes test data
  - [x] File: `scripts/supabase/wrapper.py`
- [x] 2.3 Create Telegram alert utility
  - [x] Direct Bot API calls (no dependency on gateway)
  - [x] Support: Ricky DM, Jarvis DM, any group by chat_id
  - [x] `--test "Phase 2 complete"` → message in Ricky DM
  - [x] File: `scripts/utils/telegram-alert.py`
- [x] 2.4 Create memory taxonomy config
  - [x] 12 categories: revenue, costs, parts, repairs, refurbishment, team, customers, marketing, website, systems, processes, decisions
  - [x] Each category has description + primary_owner
  - [x] File: `config/memory-taxonomy.yaml`
- [x] 2.5 Create `requirements.txt` and install deps
  - [x] supabase, httpx, pyyaml, python-dotenv, fastapi, uvicorn
  - [x] `pip install -r requirements.txt` succeeds
- [x] 2.6 Git commit + tag `phase-2`

---

## Phase 3: Health Check + Reconciliation + Maintenance Scripts

**Status: COMPLETE**

- [x] 3.1 Health check script
  - [x] Check 1: Supabase connectivity (REST API reachable)
  - [x] Check 2: OpenClaw gateway status (`systemctl --user status openclaw-gateway`)
  - [x] Check 3: VPS resources (disk >80%, memory >85%, CPU sustained >90%)
  - [x] Check 4: Agent heartbeat freshness (per-agent thresholds from registry)
  - [x] Check 5: SSL certificate expiry (<14 days = alert)
  - [x] Check 6: Webhook queue (items older than stuck threshold)
  - [x] Alert routing: critical → Ricky + Jarvis, high → Jarvis, medium → briefing
  - [x] Crontab: every 15 min
  - [x] File: `config/cron/health-check.py`
  - [x] Log: `/home/ricky/logs/health/health-check.log`
- [x] 3.2 Reconciliation script
  - [x] Query stuck work items (status not complete/cancelled, updated_at > threshold)
  - [x] Thresholds: customer_facing 5m, operational 15m, internal 60m
  - [x] Telegram alert to Systems + Jarvis on stuck items
  - [x] Crontab: every 5 min
  - [x] File: `config/cron/reconciliation.py`
  - [x] Log: `/home/ricky/logs/health/reconciliation.log`
- [x] 3.3 Nightly janitor
  - [x] Dedup exact-duplicate facts (same agent, key, value)
  - [x] Archive facts >90 days with no `last_read_at`
  - [x] Flag facts with no category or malformed keys
  - [x] Check orphaned records (facts referencing deleted work items)
  - [x] Generate maintenance report in Supabase
  - [x] Crontab: 10pm UTC
  - [x] File: `scripts/maintenance/nightly-janitor.py`
  - [x] Log: `/home/ricky/logs/maintenance/nightly-janitor.log`
- [x] 3.4 MEMORY.md rebuild from Supabase
  - [x] Consolidate memory_facts → agent MEMORY.md files
  - [x] Runs after janitor (10:30pm UTC)
  - [x] File: `scripts/maintenance/rebuild-memory-md.py`
  - [x] Log: `/home/ricky/logs/maintenance/rebuild-memory.log`
- [x] 3.5 Create log directories
  - [x] `/home/ricky/logs/health/`
  - [x] `/home/ricky/logs/maintenance/`
  - [x] `/home/ricky/logs/webhooks/`
- [x] 3.6 Install all Phase 3 crontab entries (absolute paths, source .env explicitly)
- [x] 3.7 Git commit + tag `phase-3`

---

## Phase 4: Webhook Infrastructure

**Status: COMPLETE**

- [x] 4.1 Generate `WEBHOOK_SHARED_SECRET` and add to `/home/ricky/config/api-keys/.env`
- [x] 4.2 Install FastAPI + uvicorn deps (added to `requirements.txt`)
- [x] 4.3 Create FastAPI webhook receiver
  - [x] `POST /api/webhook` — work_items INSERT/UPDATE handler
    - [x] Shared secret auth (Authorization header)
    - [x] Idempotency dedup (in-memory, 5-min window)
    - [x] Route by status: assigned, in_review, revision_needed, approved, etc.
    - [x] Telegram notification to assigned agent's group
  - [x] `POST /api/webhook/qa-reviews` — qa_reviews INSERT handler
    - [x] Verdict routing: approval → agent group, rejection → Jarvis DM + agent group
    - [x] 3rd rejection escalation → `escalated` status + HIGH PRIORITY alert
  - [x] `POST /api/webhook/messages` — agent_messages INSERT handler
    - [x] Notify `to_agent` via Telegram with message preview
  - [x] `GET /api/webhook/health` — returns 200 + timestamp
  - [x] File: `scripts/webhooks/agent-trigger.py` (port 8002)
- [x] 4.4 Create systemd user service
  - [x] File: `~/.config/systemd/user/agent-trigger.service`
  - [x] `systemctl --user enable agent-trigger`
  - [x] `systemctl --user start agent-trigger`
  - [x] Verify: `systemctl --user status agent-trigger` shows active
- [x] 4.5 Add nginx `/api/*` location block
  - [x] Proxy to `localhost:8002`
  - [x] `sudo nginx -t` passes
  - [x] `sudo systemctl reload nginx`
  - [x] File: `/etc/nginx/sites-available/mission-control`
- [x] 4.6 Configure Supabase DB triggers (pg_net)
  - [x] `trg_work_item_webhook` on `work_items` AFTER INSERT OR UPDATE
  - [x] `trg_agent_message_webhook` on `agent_messages` AFTER INSERT
  - [x] `trg_qa_review_webhook` on `qa_reviews` AFTER INSERT
  - [x] All use `webhook_headers()` SECURITY DEFINER for auth
  - [x] File: `scripts/supabase/webhook-triggers.sql`
- [x] 4.7 Verify auth rejection: `curl -X POST .../api/webhook -H "Authorization: Bearer WRONG"` → 401
- [x] 4.8 Git commit + tag `phase-4`

---

## Phase 5: Custom OpenClaw Hooks

**Status: COMPLETE**

- [x] 5.1 `supabase-bootstrap` hook
  - [x] Event: `agent:bootstrap`
  - [x] Injects: memory summaries + unread agent_messages into context
  - [x] Writes heartbeat to `agent_heartbeats`
  - [x] Uses native `fetch()` for Supabase REST calls
  - [x] Dir: `hooks/supabase-bootstrap/` (HOOK.md + handler.js)
- [x] 5.2 `dependency-check` hook
  - [x] Event: `agent:bootstrap`
  - [x] Checks: Supabase reachable, workspace SOUL.md exists, CLAUDE.md exists
  - [x] On fail: HARD BLOCK + Telegram alert via direct Bot API
  - [x] Dir: `hooks/dependency-check/`
- [x] 5.3 `supabase-memory` hook
  - [x] Event: `command:new`
  - [x] Pushes "save your facts to Supabase" reminder
  - [x] Writes session-end heartbeat
  - [x] Dir: `hooks/supabase-memory/`
- [x] 5.4 `agent-activity-logger` hook
  - [x] Events: `agent:bootstrap` + `command:new`
  - [x] Logs session start/end to `agent_activity` table
  - [x] Sends to Telegram activity group
  - [x] Dir: `hooks/agent-activity-logger/`
- [x] 5.5 Backup `~/.openclaw/` before deployment
  - [x] `tar czf ~/.openclaw-backup-phase5.tar.gz ~/.openclaw/`
- [x] 5.6 Deploy hook files to `~/.openclaw/hooks/`
- [x] 5.7 Register hooks in `openclaw.json`
- [x] 5.8 Restart gateway (quiet hours)
  - [x] `systemctl --user restart openclaw-gateway`
- [x] 5.9 Verify all hooks fire (send message → check heartbeat + activity table)
- [x] 5.10 Git commit + tag `phase-5`

---

## Phase 6: Infrastructure Agent Definitions

**Status: COMPLETE**

- [x] 6.1 Jarvis — SOUL.md + CLAUDE.md
  - [x] Role: C-suite coordinator, daily briefing, clarification protocol
  - [x] Model: Opus 4.6
  - [x] Supabase instructions, routing table, memory rules, timezone (UTC+8)
  - [x] Section 9: Daily Briefing Spec with QA Summary
- [x] 6.2 PM — SOUL.md + CLAUDE.md
  - [x] Role: Workflow orchestrator, 5-min sweep, conflict detection, daily summary
  - [x] Model: Sonnet 4.6
  - [x] Status: `disabled` in registry (QA trigger replaced PM's QA orchestration role)
- [x] 6.3 QA-Plan — SOUL.md + CLAUDE.md
  - [x] Role: Strategy reviewer, PROTECTED SOUL
  - [x] Review checklist, approve/reject flow, rejection_count >= 3 escalation
  - [x] Review Cycle section with spawn payload parsing
- [x] 6.4 QA-Code — SOUL.md + CLAUDE.md
  - [x] Role: Code reviewer, PROTECTED SOUL
  - [x] Security/architecture checks, review cycle
- [x] 6.5 QA-Data — SOUL.md + CLAUDE.md
  - [x] Role: Fact verifier, PROTECTED SOUL
  - [x] Cross-namespace conflict detection, review cycle
- [x] 6.6 Systems — SOUL.md + CLAUDE.md
  - [x] Role: Infrastructure watchdog
  - [x] Model: Haiku 4.5
- [x] 6.7 Workflow templates
  - [x] `config/workflows/standard-plan.yaml` (11-stage with QA loop)
  - [x] `config/workflows/code-build.yaml` (8-stage with qa-code review)
  - [x] `config/workflows/research.yaml` (5-stage lightweight)
- [x] 6.8 Git commit (combined with Phase 7)

---

## Phase 7: Domain Lead Definitions

**Status: COMPLETE**

- [x] 7.1 Operations — SOUL.md + CLAUDE.md
  - [x] Elevated from `processes`, absorbs finance domain
  - [x] Sub-agents defined: ops-team, ops-parts, ops-intake, ops-queue, ops-sop, ops-qc
  - [x] Model: Sonnet 4.6
- [x] 7.2 Backmarket — SOUL.md + CLAUDE.md
  - [x] 60% revenue focus: listings, pricing, grading
  - [x] Sub-agents defined: bm-listings, bm-pricing, bm-grading, bm-ops
- [x] 7.3 Finance — SOUL.md + CLAUDE.md
  - [x] Status: INACTIVE — merged into Operations
  - [x] fin-cashflow and fin-kpis reparented to operations
- [x] 7.4 Customer Service — SOUL.md + CLAUDE.md
  - [x] Replaces Finn. Intercom, escalation handling
  - [x] Sub-agents defined: cs-intercom, cs-escalation
- [x] 7.5 Marketing — SOUL.md + CLAUDE.md
  - [x] Absorbs Website. Content, SEO, AdWords
  - [x] Sub-agents defined: mkt-website, mkt-content, mkt-seo, mkt-adwords (dormant)
- [x] 7.6 Verify standardized CLAUDE.md sections across all 5
  - [x] Routing table, Supabase instructions, memory rules
  - [x] Git Workflow section (QA trigger addition)
  - [x] Sub-agent delegation protocol
- [x] 7.7 Git commit + tag `phase-6+7` (combined)

---

## Phase 8: OpenClaw Registration + Model Migration

**Status: COMPLETE**

- [x] 8.1 Full backup of `~/.openclaw/`
  - [x] `~/.openclaw-backup-phase8.tar.gz` (130MB)
- [x] 8.2 Step A: Register PM agent
  - [x] New entry in `openclaw.json`, Sonnet model, PM Telegram group (`-1003773048973`)
  - [x] Verify: PM responds + existing agents still work
- [x] 8.3 Step B: Register QA-Plan, QA-Code, QA-Data
  - [x] 3 new agents, Sonnet model, no Telegram binding (internal only)
  - [x] Verify: gateway healthy, heartbeats written
- [x] 8.4 Step C: Rename agents
  - [x] `processes` → `operations` (same Telegram chat ID)
  - [x] `finn` → `customer-service` (same Telegram chat ID)
  - [x] Verify: messages in old groups trigger new agent names
- [x] 8.5 Step D: Switch model overrides
  - [x] Opus 4.6 = Jarvis (gateway default)
  - [x] Sonnet 4.6 = all domain leads + QA + PM + slack-jarvis
  - [x] Haiku 4.5 = Systems
  - [x] Verify: Systems responds faster (Haiku), Jarvis still Opus
- [x] 8.6 Step E: Retire `schedule` agent
  - [x] Remove from config, archive workspace to `schedule-archived/`
  - [x] Verify: remaining 11 top-level agents all respond
- [x] 8.7 Update `agent_registry` in Supabase to match openclaw.json
- [x] 8.8 Symlink git repo agent files → OpenClaw workspaces
  - [x] `SOUL.md` symlinks for all 11 v2 agents
  - [x] `CLAUDE.md` symlinks for all 11 v2 agents
  - [x] Verify: `ls -la` shows symlinks
- [x] 8.9 Add Supabase instructions to all CLAUDE.md files
  - [x] "Write facts to Supabase. MEMORY.md is auto-generated."
  - [x] Verify: `grep` confirms all agents have it
- [x] 8.10 Backup existing MEMORY.md → MEMORY-legacy.md for all agents
- [x] 8.11 Git commit (Phase 8 = config + data changes, no new repo files)

---

## Phase 9: Workflow Engine E2E Test

**Status: COMPLETE**

- [x] 9.1 Message Jarvis → work item created (clarification protocol, source_input captured)
- [x] 9.2 Jarvis assigns to Operations (webhook fires, Telegram message in Operations group)
- [x] 9.3 Operations researches + submits (status transitions, locked_by set)
- [x] 9.4 QA-Plan rejects (rejection feedback in agent_messages, revision_needed status)
- [x] 9.5 Operations revises + resubmits (rejection_count increments)
- [x] 9.6 QA-Plan approves (approved status, agent_activity logged)
- [x] 9.7 Reconciliation catches stuck item (test with old updated_at, alert fires)
- [x] 9.8 Health check passes (all 6 checks green)
- [x] 9.9 Document results (Phase 9 = test-only, no new files committed)

---

## Phase 10: Sub-Agents (18 agents in 2 waves)

**Status: PARTIAL — definitions written, OpenClaw registration NOT done**

### Wave 1: Operations + Backmarket (10 sub-agents)

- [x] 10.1 ~~Ricky creates 10 hidden Telegram groups~~ **NOT NEEDED** — sub-agents use internal Supabase messaging
- [x] 10.2 Write SOUL.md + CLAUDE.md for 6 Operations sub-agents
  - [x] `ops-team` (inherits from retired `team` agent)
  - [x] `ops-parts` (inherits from retired `parts` agent)
  - [x] `ops-intake` (Adil's intake process)
  - [x] `ops-queue` (workstation queue management + diagnostic bridge)
  - [x] `ops-sop` (SOP documentation — 0% baseline)
  - [x] `ops-qc` (Roni's QC workflows)
- [x] 10.3 Write SOUL.md + CLAUDE.md for 4 Backmarket sub-agents
  - [x] `bm-listings` (listing health, buy box)
  - [x] `bm-pricing` (pricing strategy, margins)
  - [x] `bm-grading` (device grading standards)
  - [x] `bm-ops` (shipping, trade-ins)
- [ ] 10.4 Register all 10 in OpenClaw
  - [ ] Add 10 entries to `openclaw.json` (Haiku model, no Telegram bindings)
  - [ ] Restart gateway (`systemctl --user restart openclaw-gateway`)
  - [ ] Verify: `openclaw gateway call health --json` shows all 10 new agents
- [ ] 10.5 Update `agent_registry` parent_agent links in Supabase
  - [ ] 6 ops sub-agents → `parent_agent = 'operations'`
  - [ ] 4 bm sub-agents → `parent_agent = 'backmarket'`
  - [ ] Verify: REST query for sub_agents returns correct parent linkage
- [x] 10.6 Git commit wave-1 (definitions only)

### Wave 2: Finance + CS + Marketing (8 sub-agents)

- [x] 10.7 ~~Ricky creates 8 hidden Telegram groups~~ **NOT NEEDED**
- [x] 10.8 Write SOUL.md + CLAUDE.md for all 8 sub-agents
  - [x] `fin-cashflow` (HMRC payment plan monitoring, reparented to operations)
  - [x] `fin-kpis` (KPI calculation, reparented to operations)
  - [x] `cs-intercom` (inherits Finn's Intercom knowledge)
  - [x] `cs-escalation` (complex issues, VIP, complaints)
  - [x] `mkt-website` (inherits Website agent's knowledge, Shopify, PostHog)
  - [x] `mkt-content` (content creation, blog, social)
  - [x] `mkt-seo` (SEO, keywords, backlinks)
  - [x] `mkt-adwords` (Google Ads — marked DORMANT until activation)
- [ ] 10.9 Register all 8 in OpenClaw
  - [ ] Add 8 entries to `openclaw.json` (Haiku model, no Telegram bindings)
  - [ ] Restart gateway
  - [ ] Verify: gateway health shows all 8 new agents
- [ ] 10.10 Update `agent_registry`
  - [ ] `mkt-adwords` status = `dormant`
  - [ ] All others status = `active`
  - [ ] Verify: registry counts — 11 top-level active + 18 sub-agents (17 active, 1 dormant)
- [x] 10.11 Git commit wave-2 (definitions only)

### Post-Wave: Sub-Agent Activation Verification

- [ ] 10.12 Test sub-agent spawn via domain lead delegation
  - [ ] Operations delegates task to `ops-team` via `sessions_send`
  - [ ] Verify: `ops-team` receives message, writes response to `agent_messages`
  - [ ] Verify: heartbeat written to `agent_heartbeats`
- [ ] 10.13 Test sub-agent → parent communication
  - [ ] Sub-agent writes result to `agent_messages`
  - [ ] Domain lead receives and acknowledges
- [ ] 10.14 Verify sub-agent isolation
  - [ ] Sub-agents have NO Telegram binding
  - [ ] Sub-agents communicate ONLY via Supabase `agent_messages`
  - [ ] Ricky cannot interact with sub-agents directly

---

## Phase 11: External Integrations + Daily Briefing

**Status: COMPLETE**

- [x] 11.1 Monday.com read API wrapper
  - [x] GraphQL queries for Operations and Parts boards
  - [x] `--test` flag → returns board data
  - [x] File: `scripts/integrations/monday.py`
- [x] 11.2 Intercom read API wrapper
  - [x] REST API v2.11 — conversations, contacts
  - [x] `--test` flag → returns recent conversations
  - [x] File: `scripts/integrations/intercom.py`
- [x] 11.3 Daily briefing cron
  - [x] Queries last 24h activity, work items, heartbeats, QA verdicts
  - [x] Triggers Jarvis to synthesize briefing
  - [x] Schedule: 1am UTC = 9am Bali
  - [x] File: `config/cron/daily-briefing.py`
  - [x] Log: `/home/ricky/logs/health/daily-briefing.log`
- [x] 11.4 Weekly summary cron
  - [x] Metrics compilation, triggers domain lead memory reviews
  - [x] Schedule: Sunday 10pm UTC
  - [x] File: `config/cron/weekly-summary.py`
  - [x] Log: `/home/ricky/logs/health/weekly-summary.log`
- [x] 11.5 Nightly Supabase → JSON backup
  - [x] All 9 tables exported
  - [x] 30-day retention at `/home/ricky/backups/supabase/YYYY-MM-DD/`
  - [x] Schedule: 11pm UTC
  - [x] File: `scripts/utils/supabase-backup.py`
  - [x] Log: `/home/ricky/logs/maintenance/supabase-backup.log`
- [x] 11.6 Install all Phase 11 crontab entries
- [x] 11.7 Git commit + tag `phase-11`

---

## Phase 12: Dashboard Rebuild + n8n Removal

**Status: DASHBOARD COMPLETE, n8n REMOVAL PENDING**

### Session 1: Build

- [x] 12.1 React project setup
  - [x] Vite + React + TypeScript + Tailwind v4 + @supabase/supabase-js + @dnd-kit
- [x] 12.2 Kanban board
  - [x] Work items by status columns
  - [x] Drag-and-drop between columns (updates Supabase)
  - [x] Real-time via Supabase Realtime subscription
  - [x] Component: `KanbanBoard.tsx` + `KanbanColumn.tsx` + `KanbanCard.tsx`
- [x] 12.3 Agent health panel
  - [x] Agent cards with green/yellow/red heartbeat status
  - [x] Model badges (Opus/Sonnet/Haiku)
  - [x] Sub-agent tree under domain leads
  - [x] Telegram group links
  - [x] Component: `AgentHealth.tsx`
- [x] 12.4 Activity feed
  - [x] Filterable chronological feed grouped by date
  - [x] Live agent_activity stream via Realtime
  - [x] Component: `ActivityFeed.tsx`
- [x] 12.5 Daily briefing archive
  - [x] Historical briefings, expandable cards
  - [x] Component: `BriefingArchive.tsx`
- [x] 12.6 Business state KPIs
  - [x] Business_state metrics grouped by domain
  - [x] Stale indicator for old data
  - [x] Component: `BusinessKPIs.tsx`
- [x] 12.7 Shared infrastructure
  - [x] `useRealtimeTable.ts` — generic Supabase Realtime subscription hook
  - [x] `supabase.ts` — client init (reads VITE_ env vars)
  - [x] `types.ts` — TypeScript types, status/color constants
- [x] 12.8 Responsive design (MacBook, iPad, iPhone breakpoints)

### Session 2: Deploy

- [x] 12.9 Production build (`npx vite build`)
- [x] 12.10 Update nginx to serve v2 dashboard
  - [x] Keep `/api/*` webhook block intact
  - [x] Basic auth via `.htpasswd`
- [x] 12.11 E2E verification
  - [x] Kanban drag-and-drop works
  - [x] Health panel shows live agent status
  - [x] Realtime updates without page refresh
  - [x] Activity feed populates
- [ ] 12.12 n8n removal — **BLOCKED: needs 1+ week proven + Ricky's explicit approval**
  - [ ] Confirm all replacement Python scripts are stable (1+ week)
  - [ ] Get Ricky's explicit approval
  - [ ] `sudo docker stop n8n && sudo docker rm n8n`
  - [ ] `rm -rf /home/ricky/n8n-data`
  - [ ] `sudo rm /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/n8n`
  - [ ] `sudo nginx -t && sudo systemctl reload nginx`
- [ ] 12.13 Archive v1 mission-control
  - [ ] `tar czf /home/ricky/mission-control-v1-archive.tar.gz /home/ricky/mission-control/`
  - [ ] 90-day retention
- [x] 12.14 Git commit + tag `phase-12`

---

## Post-Plan: QA Trigger System

**Status: CODE COMPLETE, 3 DEPLOYMENT ACTIONS REMAINING**

Built after Phase 12. Adds automated QA review loop: git hooks → Supabase → webhook → QA agent spawn → verdict → merge/reject cycle. Full spec at `docs/qa-trigger/QA-TRIGGER-PLAN.md`.

### Implementation (DONE)

- [x] QT.1 Explore QA spawn mechanism (CLI subprocess via `openclaw agent`)
- [x] QT.2 Init 10 agent workspaces as git repos + push to GitHub (`iCorrect-agent-workspaces`)
- [x] QT.3 `qa_reviews` table + schema migration
  - [x] Table, indexes, pg_net trigger, RLS policies
  - [x] `webhook_headers()` SECURITY DEFINER for auth
  - [x] `app_secrets` table for secure secret storage
- [x] QT.4 Git hooks installed in all agent workspaces
  - [x] `pre-commit` — blocks direct commits on `main`
  - [x] `post-commit` — fires only on `wi/*` branches, updates work_items → `in_review`
  - [x] Kill switch at `/home/ricky/config/qa/.env` (`QA_HOOKS_ENABLED=true/false`)
- [x] QT.5 Webhook extension + retry cron
  - [x] In-review handler: dedup guard, capacity check, QA spawn
  - [x] qa_reviews handler: approval/rejection/escalation routing
  - [x] `scripts/cron/qa-retry.py` — 5-min cron retries stale in_review items
  - [x] QA agents added to `agentToAgent.allow` in openclaw.json
- [x] QT.6 Jarvis briefing updated with QA Summary section
- [x] QT.7 QA agent CLAUDE.md files updated with Review Cycle
- [x] QT.8 Domain agent CLAUDE.md files updated with Git Workflow
- [x] QT.9 PM agent retired (status=disabled, QA orchestration now automated)
- [x] QT.10 E2E verification (13/15 checks pass)

### Deployment Closure (REMAINING — ~15 min)

Per `docs/qa-trigger/MASTER-AUDIT.md`:

- [ ] QT.11 Apply remediation migration to live Supabase
  - [ ] Run `scripts/supabase/migrate-step10-verification-remediation.sql` in Supabase SQL Editor
  - [ ] Verify: `qa_reviews.work_item_id` NOT NULL enforced (INSERT without → HTTP 400)
  - [ ] Verify: no DB functions contain truncated `/api/webhoo` URL
- [ ] QT.12 Restart agent-trigger service with hardening code
  - [ ] `sudo systemctl restart agent-trigger`
  - [ ] Verify: startup log shows `openclaw runtime check passed: path=... version=...`
  - [ ] Verify: `_validate_openclaw_runtime()` fires on startup
- [ ] QT.13 Post-deploy verification
  - [ ] Probe: INSERT qa_reviews without work_item_id → HTTP 400 (NOT NULL)
  - [ ] Probe: query DB functions for `/api/webhoo` → 0 rows
  - [ ] Check: startup log has openclaw version

### Recommended Follow-ups (Non-Blocking)

- [ ] QT.14 QA verify Step 9 (PM retirement): confirm `agent_registry` shows pm status=disabled
- [ ] QT.15 Live cron retry test: kill QA mid-review, wait >5 min, confirm cron retriggers
- [ ] QT.16 Remove dual `WEBHOOK_SHARED_SECRET` from `webhooks/.env` (canonical is `api-keys/.env`)

---

## Post-Plan: V1 Agent Retirement

**Status: NOT STARTED — blocked on sub-agent activation**

3 v1 agents still running in OpenClaw but not in v2 registry. Retire only after their replacement sub-agents are activated and proven stable.

- [ ] R.1 Retire `team` agent
  - [ ] Prerequisite: `ops-team` sub-agent active + handling team management tasks
  - [ ] Migrate any remaining `team` memory to `ops-team` namespace in Supabase
  - [ ] Remove from `openclaw.json`
  - [ ] Archive workspace to `~/.openclaw/agents/team-archived/`
  - [ ] Restart gateway
  - [ ] Verify: `ops-team` responds, `team` no longer listed in gateway health
- [ ] R.2 Retire `parts` agent
  - [ ] Prerequisite: `ops-parts` sub-agent active + handling parts/inventory
  - [ ] Migrate `parts` memory to `ops-parts` namespace
  - [ ] Remove from `openclaw.json`, archive workspace
  - [ ] Restart gateway + verify
- [ ] R.3 Retire `website` agent
  - [ ] Prerequisite: `mkt-website` sub-agent active + handling Shopify/PostHog
  - [ ] Migrate `website` memory to `mkt-website` namespace
  - [ ] Remove from `openclaw.json`, archive workspace
  - [ ] Restart gateway + verify

---

## Post-Plan: Memory System Hardening

**Status: RUNNING, NEEDS VERIFICATION**

Memory bridge is live (333 facts across 6 agents as of 18 Feb). These are ongoing quality checks.

- [ ] M.1 Verify nightly janitor is deduping correctly
  - [ ] Check janitor log for dedup counts
  - [ ] Spot-check: query memory_facts for exact duplicates → 0
- [ ] M.2 Verify 90-day archive rule is working
  - [ ] Check for facts older than 90 days with no `last_read_at` → should be archived
- [ ] M.3 Verify MEMORY.md rebuild produces usable output
  - [ ] Compare a rebuilt MEMORY.md against raw Supabase facts for an agent
  - [ ] Confirm no truncation, proper categorization
- [ ] M.4 Verify bootstrap hook injects useful context
  - [ ] Trigger an agent session, check injected context includes recent facts + unread messages
  - [ ] Confirm total injected size within 45k bootstrap budget
- [ ] M.5 Verify cross-namespace conflict detection
  - [ ] Manually create conflicting facts in two namespaces
  - [ ] Confirm QA-Data's weekly review detects the conflict

---

## Summary: What's Left

| Category | Remaining Tasks | Effort |
|----------|----------------|--------|
| Phase 10 — Sub-agent registration | 10.4, 10.5, 10.9, 10.10, 10.12–10.14 | ~1 session |
| Phase 12 — n8n removal + v1 archive | 12.12, 12.13 | ~15 min (after approval) |
| QA Trigger — deployment closure | QT.11, QT.12, QT.13 | ~15 min |
| QA Trigger — follow-ups | QT.14, QT.15, QT.16 | ~30 min |
| V1 agent retirement | R.1, R.2, R.3 | ~1 session (after sub-agents proven) |
| Memory hardening | M.1–M.5 | ~1 session |
| **Total remaining** | **~25 tasks** | **~2-3 sessions** |
