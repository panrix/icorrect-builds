# Mission Control v2 — Build Documentation

**Built:** 17-18 February 2026 | **Updated:** 18 February 2026 (Sonnet 4.6 upgrade)
**Location:** `/home/ricky/mission-control-v2/` on VPS 46.225.53.159
**Git:** 9 commits, 12 phase tags (`phase-1` through `phase-12`)
**Dashboard:** https://mc.icorrect.co.uk (basic auth)

---

## What This Is

Mission Control v2 is the operational infrastructure for iCorrect's multi-agent AI system. It replaces the v1 Kanban-only dashboard with a full workflow engine, structured memory, QA review loops, health monitoring, and a rebuilt React dashboard — all backed by Supabase.

The system runs alongside the existing OpenClaw gateway. Agents already active in OpenClaw now write heartbeats, activity logs, and memory facts to Supabase via custom hooks injected at bootstrap.

---

## Architecture

```
              RICKY (UTC+8)
                 |
         ┌───────┴───────┐
     Claude Code      JARVIS (opus)
    (direct build)   (coordinator)
                         |
        ┌────────────────┼────────────────┐
   INFRASTRUCTURE    DOMAIN LEADS     SUB-AGENTS
   pm (sonnet)       operations       ops-team, ops-parts,
   qa-plan (sonnet)  backmarket       ops-intake, ops-queue,
   qa-code (sonnet)  customer-svc     ops-sop, ops-qc,
   qa-data (sonnet)  marketing        bm-listings, bm-pricing,
   systems (haiku)    (all sonnet)    bm-grading, bm-ops,
   slack-jarvis                      fin-cashflow, fin-kpis,
                                      cs-intercom, cs-escalation,
                                      mkt-website, mkt-content,
                                      mkt-seo, mkt-adwords (DORMANT)
```

**11 active top-level agents** registered in OpenClaw (jarvis, pm, qa-plan, qa-code, qa-data, systems, operations, customer-service, backmarket, marketing, slack-jarvis) plus 3 transitional v1 agents (team, parts, website).

**18 sub-agents** have SOUL.md + CLAUDE.md definitions written but are NOT yet registered in OpenClaw. They need Telegram groups created first.

---

## Model Versions (OpenClaw Config)

| Model ID | Version | Agents |
|----------|---------|--------|
| `anthropic/claude-opus-4-6` | Opus 4.6 | jarvis (gateway default), team*, parts*, website* |
| `anthropic/claude-sonnet-4-6` | Sonnet 4.6 | backmarket, marketing, operations, customer-service, finance, pm, qa-plan, qa-code, qa-data, slack-jarvis |
| `anthropic/claude-haiku-4-5-20251001` | Haiku 4.5 | systems |

\* transitional v1 agents — use gateway default (Opus 4.6)

**Updated 18 Feb 2026:** Sonnet agents upgraded from Sonnet 4 (`claude-sonnet-4-20250514`) to Sonnet 4.6 (`claude-sonnet-4-6`). OpenClaw updated from v2026.2.15 to v2026.2.17 (required for Sonnet 4.6 model ID support).

---

## Gateway Settings (OpenClaw Config)

| Setting | Value | Notes |
|---------|-------|-------|
| `maxConcurrent` | **6** | Max simultaneous agent sessions (bumped from 3 on 18 Feb) |
| `subagents.maxConcurrent` | 8 | Max sub-agent sessions |
| `contextPruning.ttl` | 12h | Session context lifetime |
| `compaction.memoryFlush.softThresholdTokens` | 20000 | Memory flush threshold |
| `heartbeat.every` | 1h | Agent heartbeat interval |

---

## Database (Supabase)

## Gateway Settings (OpenClaw Config)

| Setting | Value | Notes |
|---------|-------|-------|
|  | **6** | Max simultaneous agent sessions (bumped from 3 on 18 Feb) |
|  | 8 | Max sub-agent sessions |
|  | 12h | Session context lifetime |
|  | 20000 | Memory flush threshold |
|  | 1h | Agent heartbeat interval |


**Project:** `rydvxdoccryqtlcrrcag` (managed Postgres)
**Credentials:** `/home/ricky/config/supabase/.env`

### 9 Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `agent_registry` | All 30 agents (12 active, 18 dormant) | `agent_id`, `agent_type`, `model`, `parent_agent`, `status` |
| `work_items` | Task tracking with workflow status | `title`, `status`, `assigned_to`, `created_by`, `reviewed_by`, `priority`, `rejection_count` |
| `agent_activity` | Session starts, QA verdicts, maintenance events | `agent_id`, `action_type`, `summary`, `target_agent`, `metadata` |
| `agent_heartbeats` | Last-seen tracking per agent | `agent_id`, `status` (healthy/warning/error/offline), `last_seen` |
| `agent_messages` | Inter-agent communication + briefings | `from_agent`, `to_agent`, `message_type`, `content`, `is_read` |
| `memory_facts` | Structured agent memory (atomic facts) | `agent_id`, `namespace`, `category`, `key`, `value`, `source`, `confidence` |
| `memory_summaries` | Auto-generated memory digests | `agent_id`, `category`, `summary` |
| `business_state` | KPIs and business metrics | `key`, `value`, `owned_by` |
| `audit_snapshots` | Change history for business_state + memory | `table_name`, `record_id`, `old_value`, `new_value` |

**RLS:** Enabled on all tables. Anon role has read/write access (frontend + hooks).
**Realtime:** Enabled on `work_items`, `agent_activity`, `agent_heartbeats`, `agent_messages`, `business_state`.

### Work Item Status Flow

```
draft → assigned → in_progress → submitted → in_review → approved → complete
                                      ↓                      ↑
                                revision_needed ──────────────┘
                                 (max 3 loops)
```

---

## File Structure

```
/home/ricky/mission-control-v2/
├── agents/                          # 29 agent directories (SOUL.md + CLAUDE.md each)
│   ├── jarvis/                      # Coordinator (opus)
│   ├── pm/                          # Workflow orchestrator (sonnet)
│   ├── qa-plan/                     # Strategy reviewer (sonnet, PROTECTED)
│   ├── qa-code/                     # Code reviewer (sonnet, PROTECTED)
│   ├── qa-data/                     # Fact verifier (sonnet, PROTECTED)
│   ├── systems/                     # Infrastructure watchdog (haiku)
│   ├── operations/                  # Workshop ops lead (sonnet)
│   ├── backmarket/                  # BM revenue lead (sonnet)
│   ├── finance/                     # Finance lead (INACTIVE — merged into operations)
│   ├── customer-service/            # CS lead (sonnet)
│   ├── marketing/                   # Growth lead (sonnet)
│   ├── ops-{team,parts,intake,queue,sop,qc}/    # 6 ops sub-agents
│   ├── bm-{listings,pricing,grading,ops}/       # 4 BM sub-agents
│   ├── fin-{cashflow,kpis}/                     # 2 finance sub-agents (reparented to operations)
│   ├── cs-{intercom,escalation}/                # 2 CS sub-agents
│   └── mkt-{website,content,seo,adwords}/       # 4 marketing sub-agents
│
├── config/
│   ├── cron/
│   │   ├── health-check.py          # Every 15 min — Supabase, gateway, VPS
│   │   ├── reconciliation.py        # Every 5 min — stuck work items
│   │   ├── daily-briefing.py        # 1am UTC (9am Bali) — daily summary to Jarvis
│   │   └── weekly-summary.py        # Sunday 10pm UTC — weekly metrics
│   ├── workflows/
│   │   ├── standard-plan.yaml       # 11-stage plan workflow with QA loop
│   │   ├── code-build.yaml          # 8-stage build workflow with qa-code review
│   │   └── research.yaml            # 5-stage lightweight research flow
│   └── memory-taxonomy.yaml         # 12 memory categories
│
├── scripts/
│   ├── supabase/
│   │   ├── client.py                # Supabase client initialisation
│   │   ├── wrapper.py               # Read/write with audit snapshots
│   │   ├── setup-schema.sql         # 9 tables + indexes + triggers
│   │   ├── rls-policies.sql         # Row-level security policies
│   │   └── seed-registry.sql        # 30-agent seed data
│   ├── integrations/
│   │   ├── monday.py                # Monday.com GraphQL read API
│   │   └── intercom.py              # Intercom REST API v2.11
│   ├── maintenance/
│   │   ├── nightly-janitor.py       # 10pm UTC — dedup, archive, cleanup
│   │   └── rebuild-memory-md.py     # Generate MEMORY.md from Supabase (disabled)
│   ├── utils/
│   │   ├── telegram-alert.py        # Direct Telegram Bot API messaging
│   │   └── supabase-backup.py       # 11pm UTC — JSON export, 30-day retention
│   └── webhooks/
│       └── agent-trigger.py         # FastAPI webhook receiver (port 8002)
│
├── hooks/                           # 4 OpenClaw hooks (deployed to ~/.openclaw/hooks/)
│   ├── supabase-bootstrap/          # Injects memory + messages on agent start
│   ├── dependency-check/            # Blocks agent if Supabase unreachable
│   ├── supabase-memory/             # Reminds agent to save facts on /new
│   └── agent-activity-logger/       # Logs session start/end to Supabase + Telegram
│
├── dashboard/                       # React frontend (Vite + TS + Tailwind v4)
│   ├── src/
│   │   ├── App.tsx                  # Tab navigation (kanban, health, activity, briefings, KPIs)
│   │   ├── components/
│   │   │   ├── KanbanBoard.tsx      # Drag-and-drop work items by status
│   │   │   ├── KanbanColumn.tsx     # Single status column (droppable)
│   │   │   ├── KanbanCard.tsx       # Work item card (draggable)
│   │   │   ├── AgentHealth.tsx      # Agent grid with heartbeat status + sub-agent tree
│   │   │   ├── ActivityFeed.tsx     # Filterable live activity stream
│   │   │   ├── BriefingArchive.tsx  # Daily/weekly briefing history (expandable)
│   │   │   └── BusinessKPIs.tsx     # Business state metrics grouped by domain
│   │   ├── hooks/
│   │   │   └── useRealtimeTable.ts  # Generic Supabase Realtime subscription hook
│   │   └── lib/
│   │       ├── supabase.ts          # Client init (reads VITE_ env vars)
│   │       └── types.ts             # TypeScript types, status/color constants
│   └── dist/                        # Production build (served by nginx)
│
└── requirements.txt                 # Python deps (supabase, httpx, pyyaml, etc.)
```

---

## OpenClaw Hooks

4 hooks deployed to `~/.openclaw/hooks/` and registered in `~/.openclaw/openclaw.json`:

| Hook | Event | What It Does |
|------|-------|-------------|
| `supabase-bootstrap` | `agent:bootstrap` | Injects memory summaries + unread messages into agent context. Writes heartbeat. |
| `dependency-check` | `agent:bootstrap` | Checks Supabase + workspace files. HARD BLOCKS agent on failure + Telegram alert. |
| `supabase-memory` | `command:new` | Pushes "save your facts to Supabase" reminder. Writes session-end heartbeat. |
| `agent-activity-logger` | `agent:bootstrap` + `command:new` | Logs session start/end to `agent_activity` table + Telegram activity group. |

All hooks use native `fetch()` (Node 22) for Supabase REST calls. Fire-and-forget writes.

---

## Scheduled Jobs (Cron)

All times UTC. All log to `/home/ricky/logs/`.

| Schedule | Script | Log File |
|----------|--------|----------|
| Every 5 min | `config/cron/reconciliation.py` | `health/reconciliation.log` |
| Every 15 min | `config/cron/health-check.py` | `health/health-check.log` |
| Daily 1am (9am Bali) | `config/cron/daily-briefing.py` | `health/daily-briefing.log` |
| Daily 10pm | `scripts/maintenance/nightly-janitor.py` | `maintenance/nightly-janitor.log` |
| Daily 11pm | `scripts/utils/supabase-backup.py` | `maintenance/supabase-backup.log` |
| Sunday 10pm | `config/cron/weekly-summary.py` | `health/weekly-summary.log` |
| Every 5 min | `scripts/maintenance/sync-memory-to-supabase.py` | `maintenance/sync-memory.log` |
| Daily 10:30pm | `scripts/maintenance/rebuild-memory-md.py` | `maintenance/rebuild-memory.log` |
| Every 15 min | `scripts/chrome-reaper.sh` | `chrome-reaper.log` |

**Backups:** Nightly JSON export to `/home/ricky/backups/supabase/YYYY-MM-DD/`, 30-day retention.

---

## Webhook Infrastructure (LIVE)

**Pipeline:** Supabase INSERT/UPDATE → pg_net HTTP POST → FastAPI → Telegram notification

- **FastAPI app:** `scripts/webhooks/agent-trigger.py` on port 8002
- **systemd service:** `~/.config/systemd/user/agent-trigger.service`
- **nginx proxy:** `mc.icorrect.co.uk/api/*` → `localhost:8002`
- **Auth:** `WEBHOOK_SHARED_SECRET` in `/home/ricky/config/api-keys/.env`

| Endpoint | Trigger | What It Does |
|----------|---------|-------------|
| `POST /api/webhook` | `work_items` INSERT/UPDATE | Notifies assigned agent via Telegram (assignment, revision, review routing) |
| `POST /api/webhook/messages` | `agent_messages` INSERT | Notifies `to_agent` via Telegram with message preview |
| `GET /api/webhook/health` | — | Returns 200 + timestamp |

**DB Triggers (pg_net):**
- `trg_work_item_webhook` on `work_items` AFTER INSERT OR UPDATE
- `trg_agent_message_webhook` on `agent_messages` AFTER INSERT
- SQL: `scripts/supabase/webhook-triggers.sql`

**Tested 18 Feb 2026:** Insert into `agent_messages` → pg_net fires → FastAPI receives → Telegram 200 OK. Full round-trip < 500ms.

---

## Memory System (LIVE)

**How it works:** Agents write notes to `workspace/memory/*.md` files (their natural behavior). A bridge script syncs these to Supabase every 5 minutes.

| Component | What It Does |
|-----------|-------------|
| Agent writes to `memory/*.md` | Natural note-taking during conversations |
| `sync-memory-to-supabase.py` (5 min) | Parses markdown into structured facts, upserts to `memory_facts` |
| `supabase-bootstrap` hook | On session start: injects 20 recent facts + unread messages into context |
| `rebuild-memory-md.py` (10:30pm) | Consolidates Supabase facts back into agent MEMORY.md files |
| `save-fact.py` CLI | Manual fact saving (agents can use, but prefer markdown) |

**Current state (18 Feb 2026):** 333 active facts across 6 agents (Jarvis 195, Operations 64, Backmarket 32, Systems 23, Marketing 14, CS 5).

**Key files:**
- `scripts/maintenance/sync-memory-to-supabase.py` — bridge script (hash-based change detection)
- `scripts/utils/save-fact.py` — CLI for manual fact saving
- `~/.openclaw/hooks/supabase-bootstrap/handler.js` — injects facts at session start
- `.memory-sync-hashes.json` — tracks which files have been processed

---

## Dashboard

**URL:** https://mc.icorrect.co.uk
**Auth:** Basic auth (nginx `.htpasswd`)
**Stack:** Vite + React + TypeScript + Tailwind v4 + @supabase/supabase-js + @dnd-kit

### 5 Tabs

| Tab | Component | Data Source |
|-----|-----------|-------------|
| Work Items | Kanban board with drag-and-drop | `work_items` (realtime) |
| Agent Health | Agent cards with heartbeat status, model badges, sub-agent tree | `agent_registry` + `agent_heartbeats` (realtime) |
| Activity | Filterable chronological feed grouped by date | `agent_activity` (realtime) |
| Briefings | Expandable daily/weekly briefing archive | `agent_messages` (realtime) |
| KPIs | Business metrics grouped by domain, stale indicator | `business_state` (realtime) |

All tabs use Supabase Realtime subscriptions via the `useRealtimeTable` hook — data updates live without page refresh.

### Rebuild

```bash
cd /home/ricky/mission-control-v2/dashboard
npx vite build
chmod -R o+r dist && chmod o+x dist dist/assets
```

---

## Agent Workspace Symlinks

All 11 v2 top-level agent workspaces at `~/.openclaw/agents/{id}/workspace/` have:

```
SOUL.md  →  /home/ricky/mission-control-v2/agents/{id}/SOUL.md
CLAUDE.md → /home/ricky/mission-control-v2/agents/{id}/CLAUDE.md
```

This means editing agent definitions in the git repo automatically updates the live agent workspace. Legacy files backed up as `*-legacy.md`.

---

## Agent Registry (Supabase)

### Active (11 agents)

| Agent ID | Type | Model | Parent |
|----------|------|-------|--------|
| `jarvis` | infrastructure | opus | - |
| `pm` | infrastructure | sonnet | jarvis |
| `qa-plan` | infrastructure | sonnet | jarvis |
| `qa-code` | infrastructure | sonnet | jarvis |
| `qa-data` | infrastructure | sonnet | jarvis |
| `systems` | infrastructure | haiku | jarvis |
| `slack-jarvis` | infrastructure | sonnet | jarvis |
| `operations` | domain_lead | sonnet | jarvis |
| `backmarket` | domain_lead | sonnet | jarvis |
| `customer-service` | domain_lead | sonnet | jarvis |
| `marketing` | domain_lead | sonnet | jarvis |

### Dormant (18 sub-agents — definitions written, not registered in OpenClaw)

| Agent ID | Parent | Domain |
|----------|--------|--------|
| `ops-team` | operations | Team management, performance |
| `ops-parts` | operations | Inventory, stock, Nancy supplier |
| `ops-intake` | operations | Device intake (Adil's process) |
| `ops-queue` | operations | Workstation queue management |
| `ops-sop` | operations | SOP documentation (0% baseline) |
| `ops-qc` | operations | Quality control, grade alignment |
| `bm-listings` | backmarket | Listing health, buy box |
| `bm-pricing` | backmarket | Pricing strategy, margins |
| `bm-grading` | backmarket | Device grading standards |
| `bm-ops` | backmarket | Shipping, trade-ins |
| `fin-cashflow` | operations | Cash flow, payments, runway |
| `fin-kpis` | operations | KPI calculation, dashboards |
| `cs-intercom` | customer-service | Intercom inbox, auto-responses |
| `cs-escalation` | customer-service | Complex issues, VIP, complaints |
| `mkt-website` | marketing | Shopify, conversion optimisation |
| `mkt-content` | marketing | Content creation, blog, social |
| `mkt-seo` | marketing | SEO, keywords, backlinks |
| `mkt-adwords` | marketing | Google Ads (**DORMANT** — needs activation) |

### Inactive (4 retired agents)

`schedule`, `processes`, `finn`, `finance` — functionality absorbed by jarvis, operations, customer-service, and operations respectively.

### Transitional (3 v1 agents still running in OpenClaw, not in v2 registry)

`team`, `parts`, `website` — will be retired when sub-agents (ops-team, ops-parts, mkt-website) are activated.

---

## What Ricky Still Needs To Do

| # | Action | Why |
|---|--------|-----|
| ~~1~~ | ~~Create PM Telegram group~~ | **DONE** — chat ID `-1003773048973` (18 Feb) |
| ~~2~~ | ~~Create 18 Telegram groups for sub-agents~~ | **NOT NEEDED** — sub-agents run internally via Supabase messaging, like QA agents |
| ~~3~~ | ~~Configure Supabase DB Webhook~~ | **DONE** — pg_net triggers on `work_items` + `agent_messages` (18 Feb) |
| ~~4~~ | ~~Add WEBHOOK_SHARED_SECRET~~ | **DONE** — added to api-keys/.env (18 Feb) |
| ~~5~~ | ~~Enable MEMORY.md rebuild cron~~ | **DONE** — enabled 18 Feb, runs 10:30pm UTC nightly |
| 6 | Retire `team`, `parts`, `website` v1 agents | After sub-agents are activated and proven stable |
| 7 | Archive v1 dashboard | `tar czf /home/ricky/mission-control-v1-archive.tar.gz /home/ricky/mission-control/` |
| 8 | Remove n8n (optional) | Only after 1+ week of v2 proven stable |

---

## Backups and Rollback

| Backup | Location | What It Contains |
|--------|----------|-----------------|
| Pre-Phase 8 OpenClaw | `~/.openclaw-backup-phase8.tar.gz` (130MB) | Full OpenClaw dir before agent migration |
| v1 nginx config | `/etc/nginx/sites-available/mission-control.v1.bak` | Original nginx config pointing to v1 dashboard |
| Legacy agent files | `~/.openclaw/agents/{id}/workspace/*-legacy.md` | Original SOUL/CLAUDE/MEMORY files |
| Schedule workspace | `~/.openclaw/agents/schedule-archived/` | Retired schedule agent workspace |
| Nightly DB | `/home/ricky/backups/supabase/YYYY-MM-DD/` | JSON export of all 9 tables (auto, 30-day retention) |

**Rollback to v1 dashboard:**
```bash
sudo cp /etc/nginx/sites-available/mission-control.v1.bak /etc/nginx/sites-available/mission-control
sudo nginx -t && sudo systemctl reload nginx
```

**Rollback OpenClaw to pre-Phase 8:**
```bash
cd ~
tar xzf .openclaw-backup-phase8.tar.gz
systemctl --user restart openclaw-gateway
```

---

## Verification Commands

```bash
# Dashboard responding
curl -I https://mc.icorrect.co.uk/ 2>/dev/null | head -1

# Webhook health
curl -s https://mc.icorrect.co.uk/api/webhook/health

# Gateway status
systemctl --user status openclaw-gateway

# Webhook service
systemctl --user status agent-trigger

# Cron jobs
crontab -l | grep mission-control

# Hook status (visible in gateway startup logs)
journalctl --user -u openclaw-gateway --no-pager | grep "hook" | tail -10

# Supabase connectivity
python3 /home/ricky/mission-control-v2/scripts/supabase/client.py --test

# Integration tests
python3 /home/ricky/mission-control-v2/scripts/integrations/monday.py --test
python3 /home/ricky/mission-control-v2/scripts/integrations/intercom.py --test

# Agent symlinks
ls -la ~/.openclaw/agents/jarvis/workspace/SOUL.md

# Backup check
ls /home/ricky/backups/supabase/ | tail -5
```

---

## Git History

```
d502047 Phase 12: Dashboard rebuild — React + Supabase Realtime
187404a Phase 11: External integrations + scheduled jobs
7bf898d Phase 10: Add 18 sub-agent definitions (Wave 1 + Wave 2)
9b843e1 Phase 6+7: Agent definitions + workflow templates
2b9a20f Phase 5: Custom OpenClaw hooks (4 hooks deployed + enabled)
5dd4e0f Phase 4: Webhook infrastructure — FastAPI + nginx + systemd
e877a66 Phase 3: Health check, reconciliation, nightly janitor, MEMORY.md rebuild
4d95962 Phase 2: Python wrappers, Telegram alerts, memory taxonomy
75fe419 Phase 1: Supabase schema, RLS policies, agent registry seed (30 agents)
```

Phase 8 (OpenClaw registration) and Phase 9 (E2E tests) modified config + ran tests but didn't add new repo files — their changes are in the OpenClaw config and Supabase data.
