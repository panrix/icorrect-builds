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
