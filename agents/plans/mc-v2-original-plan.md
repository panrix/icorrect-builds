# Plan: Mission Control v2 — Build Plan

## Context

Ricky and Claude.ai designed a comprehensive PRD (`~/Downloads/mission-control-prd-v2.md`) for rebuilding the multi-agent system. The current 12-agent system (OpenClaw v2026.2.15) works for basic Telegram interactions but lacks persistent memory, workflow automation, QA review loops, and cross-agent coordination. The rebuild adds Supabase as structured storage, 4 new infrastructure agents (PM, QA-Plan, QA-Code, QA-Data), ~20 sub-agents, custom OpenClaw hooks, and a webhook-driven workflow engine.

**Pre-phase fixes completed 2026-02-16/17:** OpenClaw updated to 2026.2.15, session-memory + command-logger hooks enabled, OpenAI embedding key deployed to all 11 agents, cross-agent visibility symlinks created, Jarvis MEMORY.md cleaned, Telegram activity group created, inter-agent messaging + custom commands added to all agents, legacy jarvis-api killed, log rotation set up.

**Track A / Track B:** Current agents continue running for real business. V2 builds alongside. No cutover until proven.

**Agent restructure (Ricky's decision 2026-02-17):** Flattened from 15 to 11 top-level agents. Key changes: Finn → Customer Service (domain lead), Website → sub of Marketing, Parts/Team → subs of Operations, Schedule folded into Jarvis, Systems stays independent infrastructure.

---

## PRD Corrections

| PRD Claim | Reality | Impact |
|-----------|---------|--------|
| Ricky is UTC+7 | UTC+8 (WITA, Bali) | Fix in all agent configs |
| VPS is CPX32 at €4.35/mo | CPX42 at €19.49/mo | Cosmetic |
| "Memory is broken" | Fixed on 2026-02-16 (embedding key deployed, session-memory enabled) | Memory works now, v2 adds structured storage on top |
| 6 custom hooks needed | 4 are fully feasible, 1 partial, 1 needs different approach (see below) | Workflow-trigger handled by Supabase webhooks, not OpenClaw hooks |
| `session:end` event exists | NOT implemented in OpenClaw yet | Heartbeat/activity logging uses `command:new` as proxy |

### Hook Feasibility

| PRD Hook | OpenClaw Event | Status |
|----------|---------------|--------|
| `supabase-bootstrap` | `agent:bootstrap` | Build it |
| `dependency-check` | `agent:bootstrap` | Build it |
| `heartbeat-writer` | `agent:bootstrap` | Build bootstrap-start only. Session-end via `command:new` proxy |
| `supabase-memory` | `command:new` | Build it — but fact extraction happens via CLAUDE.md instructions, hook writes reminder + does post-processing |
| `agent-activity-logger` | `agent:bootstrap` + `command:new` | Build it — logs session start/end only, not per-message |
| `workflow-trigger` | N/A (not an OpenClaw event) | **Skip** — handled by Supabase webhook → VPS FastAPI directly (no Cloudflare) |

---

## Pre-Build Requirements (Ricky to provide)

- [ ] **Supabase service role key** — currently only have anon key. Service role key enables proper RLS enforcement. Get from Supabase dashboard → Settings → API → `service_role` key
- [ ] **PM Telegram group** — create "PM Jarvis" group, add the bot as admin, share the chat ID
- [ ] **Confirm dropping existing Supabase tables** — current `agents`, `tasks`, `activity_log` contain only seed data. New schema replaces them entirely. OK to drop?
- [ ] **Webhook endpoint domain** — need a public HTTPS endpoint for Supabase to POST to. Recommendation: `mc.icorrect.co.uk/api/webhook` (reuse existing domain, add path in nginx)

---

## Phase Breakdown

### Phase 1: Git Repo + Supabase Schema
**Time:** ~2-3 hours | **Blocks:** Everything else | **Risk to existing system:** None

**Deliverables:**
1. Init Git repo at `/home/ricky/mission-control-v2/` with full directory structure from PRD Section 12
2. Deploy 9 Supabase tables via SQL (agent_registry, memory_facts, memory_summaries, agent_activity, agent_messages, work_items, business_state, agent_heartbeats, audit_snapshots)
3. Create proper RLS policies (not "allow all" — enforce agent_id ownership)
4. Set up `.gitignore`, commit skeleton

**Key files:**
- `scripts/supabase/setup-schema.sql` — all CREATE TABLE + INDEX statements
- `scripts/supabase/rls-policies.sql` — row-level security
- `.gitignore`

**Verification:**
```bash
curl -s "${SUPABASE_URL}/rest/v1/agent_registry?select=agent_id&limit=1" -H "apikey: ${SUPABASE_ANON_KEY}" -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
# Should return []
```

---

### Phase 2: Python Wrappers + Seed Data + Utilities
**Time:** ~2-3 hours | **Depends on:** Phase 1 | **Risk:** None

**Deliverables:**
1. `scripts/supabase/client.py` — Supabase client init from env vars
2. `scripts/supabase/wrapper.py` — Read/write functions with audit snapshots for business_state + memory_summaries
3. `scripts/supabase/seed-registry.sql` — Seed 15 top-level agents into agent_registry (including "operations" replacing "processes")
4. `scripts/utils/telegram-alert.py` — Direct Telegram Bot API alerts (fallback when OpenClaw is down)
5. `config/memory-taxonomy.yaml` — Shared fact categories from PRD Section 4

**Agent registry seed (11 top-level + ~18 sub-agents):**

**Top-level agents (11):**

| agent_id | type | model | parent | Telegram |
|----------|------|-------|--------|----------|
| jarvis | infrastructure | opus | — | DM + Slack |
| pm | infrastructure | sonnet | jarvis | Status channel (read-only) |
| qa-plan | infrastructure | sonnet | jarvis | None (internal) |
| qa-code | infrastructure | sonnet | jarvis | None (internal) |
| qa-data | infrastructure | sonnet | jarvis | None (internal) |
| systems | infrastructure | haiku | jarvis | Alerts channel |
| operations | domain_lead | sonnet | jarvis | Ricky-facing group |
| backmarket | domain_lead | sonnet | jarvis | Ricky-facing group |
| finance | domain_lead | sonnet | jarvis | Ricky-facing group |
| customer-service | domain_lead | sonnet | jarvis | Ricky-facing group |
| marketing | domain_lead | sonnet | jarvis | Ricky-facing group |

**Sub-agents (~18, all hidden Telegram groups):**

| agent_id | parent | domain |
|----------|--------|--------|
| ops-team | operations | Hiring, performance, morale |
| ops-parts | operations | Stock, Nancy, forecasting |
| ops-intake | operations | Adil's intake process |
| ops-queue | operations | Repair assignment, diagnostics |
| ops-sop | operations | SOP documentation |
| ops-qc | operations | QC process (Roni) |
| bm-listings | backmarket | Listing management |
| bm-pricing | backmarket | Pricing strategy |
| bm-grading | backmarket | Device grading |
| bm-ops | backmarket | BM operational tasks |
| fin-cashflow | finance | Cash flow + HMRC monitoring |
| fin-kpis | finance | KPI tracking |
| cs-intercom | customer-service | Intercom/Finn chatbot |
| cs-escalation | customer-service | Customer escalations |
| mkt-website | marketing | Shopify, PostHog, conversion |
| mkt-content | marketing | Content creation |
| mkt-seo | marketing | SEO optimization |
| mkt-adwords | marketing | AdWords (when live) |

**Verification:**
```bash
python3 scripts/supabase/wrapper.py --test  # writes + reads test entry
curl agent_registry query → 15 rows
python3 scripts/utils/telegram-alert.py --test "Phase 2 complete"
```

---

### Phase 3: Health Check + Reconciliation + Maintenance Scripts
**Time:** ~2-3 hours | **Depends on:** Phase 2 | **Risk:** None (new cron jobs, doesn't touch existing)

**Deliverables:**
1. `config/cron/health-check.py` — 15-min sweep (Supabase connectivity, gateway status, VPS resources, heartbeat freshness, SSL expiry, stuck work items)
2. `config/cron/reconciliation.py` — 5-min stuck work item detector
3. `scripts/maintenance/nightly-janitor.py` — Nightly memory cleanup (zero AI cost): dedup facts, archive stale facts, flag malformed keys, check orphans
4. Log directories at `/home/ricky/logs/{health,maintenance}/`
5. Crontab entries for all three

**Cron schedule:**
```
*/15 * * * *  health-check.py
*/5  * * * *  reconciliation.py
0 22 * * *    nightly-janitor.py (10pm UTC)
```

---

### Phase 4: Webhook Infrastructure (Direct VPS Endpoint — No Cloudflare)
**Time:** ~2-3 hours | **Depends on:** Phase 2 | **Risk:** Needs new nginx config + systemd service

**Architecture change from PRD:** Dropped the Cloudflare Worker middle layer. Supabase Database Webhooks POST directly to VPS behind nginx/SSL. Simpler, cheaper ($0 vs $5/mo), fewer moving parts. CF can be added later for edge-level rate limiting if needed.

**Deliverables:**
1. `scripts/webhooks/agent-trigger.py` — FastAPI app on port 8002 with:
   - Shared secret validation in Authorization header
   - Idempotency check (webhook_id tracking to prevent double-processing)
   - Throttle check: skip trigger if target agent already has an active session (prevents queue flooding)
   - Agent triggering via Telegram Bot API message to target agent's group
2. systemd user service for agent-trigger
3. nginx config: add `/api/webhook` location block to `mc.icorrect.co.uk` proxying to localhost:8002
4. Supabase Database Webhook trigger on `work_items` INSERT/UPDATE → POSTs to `https://mc.icorrect.co.uk/api/webhook`

**How agent triggering works:**
```
Supabase (work_items status change)
  → HTTP POST to mc.icorrect.co.uk/api/webhook (direct, nginx SSL)
    → FastAPI validates shared secret + checks idempotency
      → Sends Telegram message to target agent's group
        → OpenClaw picks up message naturally → agent acts
```

**Why Telegram triggering (not OpenClaw API):** Most reliable approach — uses existing Telegram polling, no new API integration, works for all agents including sub-agents with hidden groups.

**Verification:**
```bash
curl -X POST https://mc.icorrect.co.uk/api/webhook \
  -H "Authorization: Bearer SHARED_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"systems","message":"Test webhook"}'
# Confirm message appears in Systems Telegram group
```

---

### Phase 5: Custom OpenClaw Hooks
**Time:** ~3-4 hours | **Depends on:** Phase 2 | **Risk:** Requires gateway restart (all agents offline ~30 sec)

**Deliverables — 4 hooks in `~/.openclaw/hooks/`:**

1. **`supabase-bootstrap`** (`agent:bootstrap`) — Queries Supabase for agent's memory summaries + unread messages, injects into context. Writes heartbeat "session started."
2. **`dependency-check`** (`agent:bootstrap`) — Verifies Supabase connectivity + workspace files exist. Writes to `/tmp/agent-health/{agent_id}.json`. On failure: sends Telegram alert AND injects HARD block into context:
   ```
   [CRITICAL — DEGRADED MODE] Supabase is unreachable. You have NO persistent memory.
   DO NOT answer questions requiring facts or memory. Your ONLY allowed response:
   "My memory systems are offline. I cannot reliably assist right now. Please try again shortly."
   ```
   Agent CLAUDE.md reinforces this: "If you see a DEGRADED MODE message, you MUST comply. Do not attempt to work around it."
3. **`supabase-memory`** (`command:new`) — On session end, pushes reminder to save facts. Writes session-end heartbeat.
4. **`agent-activity-logger`** (`agent:bootstrap` + `command:new`) — Logs session start/end to agent_activity table.

Each hook: `~/.openclaw/hooks/{name}/HOOK.md` + `handler.js`

All hooks use native `fetch()` (Node 22) to call Supabase REST API. Fire-and-forget pattern for writes. Env vars `SUPABASE_URL` + `SUPABASE_ANON_KEY` read from process environment.

**Gateway restart required** — schedule during quiet hours, warn Ricky first, git-snapshot `~/.openclaw/` before changes.

---

### Phase 6: Infrastructure Agent Definitions (6 agents)
**Time:** ~3-4 hours | **Depends on:** Phase 1 (for Git repo) | **Risk:** None (writing files only)

Write SOUL.md + CLAUDE.md in Git repo for:
1. **Jarvis** — C-suite coordinator + scheduling, Opus, full org chart visibility, daily briefing spec, clarification protocol, calendar/timezone bridge (absorbed Schedule)
2. **PM** — Workflow orchestrator, Sonnet, 5-min sweep logic, daily summary format, conflict detection
3. **QA-Plan** — Strategy reviewer, Sonnet, review checklist, approve/reject mechanics, PROTECTED SOUL
4. **QA-Code** — Code reviewer, Sonnet, security/architecture checks, PROTECTED SOUL
5. **QA-Data** — Fact verifier, Sonnet, cross-namespace conflict detection, PROTECTED SOUL
6. **Systems** — Infrastructure watchdog, Haiku, VPS monitoring, service health, deployment, SSL tracking

Every CLAUDE.md includes: Supabase instructions, agent routing table, memory write rules, tool index, timezone (UTC+8), degraded mode compliance.

---

### Phase 7: Domain Lead Definitions (5 agents)
**Time:** ~3-4 hours | **Depends on:** Phase 1 | **Risk:** None (writing files only)

Write SOUL.md + CLAUDE.md for all 5 domain leads:
- **Operations** (elevated, renamed from processes): The business engine. Owns workshop ops, team management, parts, intake, queue, SOPs, QC. Manages 6 sub-agents.
- **Backmarket**: 60% of revenue. Listings, pricing, grading, BM API, trade-in flow. Manages 4 sub-agents.
- **Finance**: Xero, HMRC payment plan monitoring, KPIs, cash flow. Manages 2 sub-agents.
- **Customer Service** (replaces Finn): All customer interactions. Intercom, escalation, satisfaction. Manages 2 sub-agents.
- **Marketing**: Growth engine. Absorbs Website. Content, SEO, AdWords, Shopify, PostHog. Manages 4 sub-agents.

Each domain lead CLAUDE.md includes: sub-agent roster, delegation instructions, how to trigger sub-agents via hidden Telegram groups.

---

### Phase 8: OpenClaw Registration + Model Migration
**Time:** ~3-4 hours | **Depends on:** Phases 5, 6, 7 | **Risk:** HIGH — modifies openclaw.json, gateway restart

This is the riskiest phase. Changes OpenClaw config for all agents.

**Deliverables:**
1. Register 4 new agents: PM, QA-Plan, QA-Code, QA-Data
2. Rename processes → operations (new workspace dir, same Telegram group chat ID `-1003336872091`)
3. Rename finn → customer-service (new workspace dir, same Telegram group chat ID `-1003729373199`)
4. Retire schedule agent (capabilities folded into Jarvis)
5. Retire website/team/parts as top-level agents (become sub-agents in Phase 10)
6. Configure multi-model: Opus=Jarvis, Sonnet=domain leads+QA+PM, Haiku=Systems
7. Symlink Git repo agent files into OpenClaw workspaces
8. Set up PM Telegram binding (new group) + Customer Service group (rename existing Finn group)

**Safety protocol (incremental, not big-bang):**
1. `tar czf ~/.openclaw-backup-phase8.tar.gz ~/.openclaw/` before any changes
2. **Step A:** Register PM agent ONLY. Doctor + restart. Verify PM responds + all existing agents still work.
3. **Step B:** Register QA-Plan, QA-Code, QA-Data. Doctor + restart. Verify.
4. **Step C:** Rename processes → operations, finn → customer-service. Doctor + restart. Verify.
5. **Step D:** Switch model overrides (Sonnet for domain leads, Haiku for Systems). Doctor + restart. Verify.
6. **Step E:** Retire schedule (remove registration, keep workspace as archive). Retire website/team/parts as top-level (they'll be re-registered as sub-agents in Phase 10). Doctor + restart. Verify remaining 11 top-level agents.

**Rollback procedure (if any step fails):**
```bash
systemctl --user stop openclaw-gateway
rm -rf ~/.openclaw/openclaw.json ~/.openclaw/agents/
tar xzf ~/.openclaw-backup-phase8.tar.gz -C ~/
systemctl --user start openclaw-gateway
# Verify all 12 original agents respond in their Telegram groups
```

**Verification after each step:**
```bash
openclaw doctor
systemctl --user status openclaw-gateway
# Send test message to newly registered agent's Telegram group
# Check agent_heartbeats table for new entries
# Verify NO existing agents broke (spot-check 2-3 existing agents)
```

---

### Phase 9: Workflow Engine End-to-End Test
**Time:** ~3-4 hours | **Depends on:** Phases 4, 5, 8 | **Risk:** Low (testing, not building)

Run the full workflow loop:
1. Message Jarvis → creates work item with `source_input`
2. Jarvis clarifies → confirms → assigns to Operations
3. Webhook fires → Operations gets triggered
4. Operations researches → submits plan
5. Webhook fires → QA-Plan reviews
6. QA-Plan rejects → Operations revises → QA-Plan approves
7. Verify: `agent_activity` shows full trace, `work_items` shows correct status transitions

Also test: reconciliation cron catches stuck items, alert flow works.

Budget time for debugging — this is where integration issues surface.

---

### Phase 10: Sub-Agents (~18 agents across 2 waves)
**Time:** ~5-6 hours (split into 2 sessions) | **Depends on:** Phase 8

**Wave 1 — Operations + Backmarket (10 sub-agents):**
- ops-team, ops-parts, ops-intake, ops-queue, ops-sop, ops-qc
- bm-listings, bm-pricing, bm-grading, bm-ops

Note: ops-team, ops-parts reuse existing team/parts agent workspaces + knowledge (migrated from retired top-level agents). Not starting from scratch.

**Wave 2 — Finance + CS + Marketing (8 sub-agents):**
- fin-cashflow, fin-kpis
- cs-intercom, cs-escalation
- mkt-website, mkt-content, mkt-seo, mkt-adwords

Note: mkt-website reuses existing website agent workspace + knowledge. cs-intercom inherits from old finn agent's Intercom knowledge.

**Sub-agent trigger mechanism:** Each sub-agent gets a **hidden Telegram group** (Ricky doesn't join). Domain lead triggers sub-agent via `openclaw message send --channel telegram --target '<sub-agent-chat-id>' --message '<task>'`. Webhook triggers also send to these hidden groups.

**Communication flow:**
```
Domain lead writes task to agent_messages (Supabase)
  → Webhook fires → agent-trigger.py sends Telegram message to sub-agent's hidden group
    → Sub-agent picks up, does work, writes results to agent_messages
      → Webhook fires → domain lead gets notified
```

Each gets SOUL.md + CLAUDE.md, OpenClaw registration with hidden Telegram group, agent_registry entry with parent_agent set. Ricky never interacts with sub-agents directly.

**Telegram groups needed:** ~18 hidden groups, created in batch. Bot added as admin to each.

---

### Phase 11: External Integrations + Daily Briefing
**Time:** ~3-4 hours | **Depends on:** Phase 8

1. Monday.com API read access (Parts, Operations)
2. Intercom API read access (Finn)
3. Daily briefing cron (1am UTC = 8am Bali): queries last 24h activity, work item status, agent health → sends to Ricky via Jarvis
4. Weekly summary compilation
5. Nightly Supabase → Git backup script

---

### Phase 12: Dashboard Rebuild + n8n Removal
**Time:** ~5-6 hours (can split into 2 sessions) | **Depends on:** Phase 9

1. Rebuild mc.icorrect.co.uk using new Supabase schema:
   - Work items by status (Kanban)
   - Agent health indicators (green/yellow/red)
   - Daily briefing archive
   - Agent Telegram group links
   - Business state KPIs
2. n8n removal — only after 1+ week of replacement scripts proven AND Ricky's explicit approval

---

## Critical Path

```
Phase 1 ──→ Phase 2 ──→ Phase 5 (hooks) ──→ Phase 8 (registration) ──→ Phase 9 (E2E test)
                ├──→ Phase 3 (cron scripts) ──────────────────↗
                ├──→ Phase 4 (webhooks) ──────────────────────↗
                ├──→ Phase 6 (infra agent defs) ─────────────↗
                └──→ Phase 7 (domain agent defs) ────────────↗
```

Phases 3, 4, 6, 7 run in parallel after Phase 2. Phase 8 is the convergence point. Phases 10, 11, 12 are independent after Phase 8.

---

## Estimate

| Phase | Hours | Sessions (~3-4h each) |
|-------|-------|-----------------------|
| 1-2 (Foundation) | 4-6 | 1-2 |
| 3-4 (Scripts + Webhooks) | 4-6 | 1-2 |
| 5 (Hooks) | 3-4 | 1 |
| 6-7 (Agent Definitions: 6 infra + 5 domain) | 6-8 | 2 |
| 8 (Registration + Migration) | 3-4 | 1 |
| 9 (E2E Test) | 3-4 | 1 |
| 10 (Sub-agents: 2 waves of ~10) | 5-6 | 2 |
| 11-12 (Integrations + Dashboard) | 8-10 | 2-3 |
| **Total** | **36-48** | **11-14 sessions over ~3-4 weeks** |

Restructuring from 15 to 11 top-level agents saves ~1-2 sessions on definitions. Sub-agent work increases slightly (migrating existing agent knowledge). Net: similar total.

---

## Concurrency + Cost Model

**Session concurrency:** maxConcurrent = 3 (already configured in openclaw.json). The 4th session queues with 30s timeout. VPS is 8 vCPU / 16GB RAM — plenty of headroom.

**What creates Claude sessions vs what doesn't:**
| Trigger | Claude Session? | Notes |
|---------|----------------|-------|
| Ricky messages agent via Telegram | Yes | Normal usage |
| Webhook triggers agent via Telegram | Yes | Work item status changes |
| Health check cron (every 15 min) | **No** | Pure Python, queries Supabase directly |
| Reconciliation cron (every 5 min) | **No** | Pure Python, queries Supabase directly |
| Nightly janitor | **No** | Pure Python, no AI cost |
| Daily briefing cron | **Yes** | Triggers Jarvis once/day |
| Weekly consolidation | **Yes** | ~10-15 Sonnet messages/week |

**Estimated daily usage (Claude Max 20x: ~4,320 messages/day):**
| Source | Triggers/day | ~Messages each | Total |
|--------|-------------|---------------|-------|
| Ricky conversations | 10-20 | 5-15 | 50-300 |
| Webhook-triggered sessions | 5-15 | 5-10 | 25-150 |
| Daily briefing | 1 | 10-20 | 10-20 |
| Sub-agent sessions | 5-10 | 5-10 | 25-100 |
| **Total** | | | **~110-570** |

**~3-13% of daily capacity.** Even at peak, well within limits. Multi-model strategy (Haiku for Schedule/Systems, Sonnet for domain leads) further reduces Opus consumption.

**Throttle safeguard:** The `agent-trigger.py` webhook endpoint checks if target agent already has an active session before triggering. If active, the work item stays in its current status — reconciliation cron will catch it within 5 minutes.

---

## MEMORY.md Strategy (Resolving Split-Brain Risk)

**Problem:** If agents read both MEMORY.md (flat file) AND Supabase memory summaries (from bootstrap hook), contradictions cause confusion.

**Solution — single source of truth:**
1. **Phase 5 (hooks):** supabase-bootstrap hook injects Supabase memory summaries into agent context on every session start
2. **Phase 8 (registration):** Agent CLAUDE.md updated: "Write all facts to Supabase. MEMORY.md is auto-generated — do not edit directly."
3. **Nightly cron (added to Phase 3):** `scripts/maintenance/rebuild-memory-md.py` — queries each agent's memory_summaries from Supabase, writes to `{workspace}/MEMORY.md`. This keeps the flat file as a readable snapshot but Supabase is authoritative.
4. **Transition:** During Phase 8, existing MEMORY.md files get backed up as `MEMORY-legacy.md` for reference. New MEMORY.md is auto-generated from that point forward.

**Result:** Supabase is the write target. MEMORY.md is a read-only nightly snapshot. Bootstrap hook injects live Supabase data. No split-brain.

---

## Compromises vs PRD

| PRD Spec | This Plan | Why |
|----------|-----------|-----|
| 6 custom hooks | 4 hooks + webhook for workflow-trigger | `session:end` event doesn't exist in OpenClaw |
| Supabase → CF Worker → VPS | Supabase → VPS directly (no Cloudflare) | Simpler, cheaper, fewer dependencies. CF can be added later. |
| All 6 sessions at 24-30 hours | 36-48 hours across 10-14 sessions | PRD underestimated by ~2x |
| Agents refuse to operate if deps fail | Dependency-check injects HARD block message + CLAUDE.md enforcement | Can't block session start, but agent is instructed to refuse all work |
| Sub-agents have no Telegram binding | Sub-agents get hidden Telegram groups | Needed for trigger mechanism — domain leads message them, Ricky never sees them |

---

## Start Here

Phase 1: Git repo + Supabase schema. Zero risk to existing system. Self-contained. Verifiable. Once Ricky confirms dropping existing Supabase tables + provides service role key, we begin.
