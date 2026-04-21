---
name: System Health Assessment
overview: Full audit of Mission Control v2 with detailed, actionable fix plan. Covers Jarvis's 11 reported issues, config/doc inconsistencies, and remaining build work.
todos:
  - id: p1-comms
    content: "Priority 1: Fix communication layer (agent_messages consumer, is_test flag, circuit breaker, auto-complete)"
    status: pending
  - id: p2-config
    content: "Priority 2: Fix config inconsistencies (model mismatches, BUILD-PLAN update, ghost sub-agents)"
    status: pending
  - id: p3-crons
    content: "Priority 3: Fix 5 broken OpenClaw cron delivery targets"
    status: pending
  - id: p4-subagents
    content: "Priority 4: Register 18 sub-agents in OpenClaw + retire v1 agents"
    status: pending
  - id: p5-tokens
    content: "Priority 5: Token optimisation (models, bootstrap budget, spawn timeouts)"
    status: pending
  - id: p6-memory
    content: "Priority 6: Memory system verification (M.1-M.5)"
    status: pending
  - id: p7-status-doc
    content: "Priority 7: Create docs/SYSTEM-STATUS.md as single source of truth"
    status: pending
isProject: false
---

# Mission Control v2 -- Detailed System Audit and Fix Plan

---

## Part A: Current State Assessment

### What Is GOOD (Working, Don't Touch)

- Supabase schema (9 tables, RLS, realtime, triggers) -- all live
- Webhook pipeline: Supabase pg_net -> FastAPI port 8002 -> Telegram (<500ms)
- Dashboard: mc.icorrect.co.uk (5 tabs, Supabase Realtime)
- 4 OpenClaw hooks deployed: supabase-bootstrap, dependency-check, supabase-memory, agent-activity-logger
- Memory bridge: `sync-memory-to-supabase.py` every 5 min (333 facts across 6 agents)
- Health check (15 min) + reconciliation (5 min) crons running
- Nightly janitor (10pm) + backup (11pm) running
- QA trigger pipeline: git hooks, qa_reviews, webhook extension, retry cron (deployment closure completed 2026-02-22 per MASTER-AUDIT)
- Agent definitions: all 11 top-level + 18 sub-agent SOUL.md + CLAUDE.md written in git
- Git repos: 10 agent workspaces initialised with pre-commit/post-commit hooks
- OpenClaw gateway: active since Feb 20, 14 agents registered

### What Is BROKEN (Jarvis's 11 Issues)

**CRITICAL (4 issues blocking multi-agent coordination):**

1. **Inter-agent messaging broken** -- all agents share one bot token; bot ignores own messages; Jarvis can't delegate
2. **QA test items spam all groups** -- no is_test flag, no circuit breaker, approved items don't auto-complete
3. **agent_messages has no consumer** -- agents write, nothing reads; health check spams every 5 min
4. **5 broken OpenClaw cron delivery targets** -- BM QC Watch, 3 Google/YouTube scans, Morning Briefing

**IMPORTANT (2 issues):**

1. Slack voice notes silently dropped
2. slack-jarvis `channel_not_found` errors on Ferrari's DM

**ARCHITECTURE (5 issues for later):**

1. Token budget burned (32% + GBP21.60 extra in one session)
2. Agent consolidation needed (16 -> ~8)
3. Data lake 10-layer architecture
4. Cron topic routing (output to specific Telegram threads)
5. Agent identity in Telegram (all agents look like same bot)

### What Is INCONSISTENT (Config vs Docs)

**Systems model:** [BUILD.md](docs/BUILD.md) says Haiku 4.5 but `openclaw.json` line 86 shows `anthropic/claude-sonnet-4-6`. Burning ~4x more tokens than intended.

**V1 agents on Opus:** `team` (line 65), `website` (line 94), `parts` (line 104) in `openclaw.json` have no `model` field, so they inherit the gateway default (Opus 4.6). These are transitional agents burning the most expensive model for no reason.

**Agent count mismatch:** BUILD.md says 11 active. `openclaw.json` has 14 agent entries. Jarvis's brief says 16. Reality: 14 in OpenClaw config (11 v2 + 3 v1 transitional: team, parts, website). `finn`, `processes`, `schedule` no longer exist in config.

**BUILD-PLAN outdated:** QT.11-QT.13 (QA trigger deployment closure) shown as unchecked but MASTER-AUDIT's Deployment Closure section confirms all 3 completed 2026-02-22 06:23 UTC with verification evidence.

**Ghost sub-agents:** SOUL.md files reference sub-agents that don't exist in OpenClaw. Agents think they can delegate to entities that aren't registered.

**agentToAgent.allow includes ghosts:** `openclaw.json` line 432 includes `"schedule"` in the allow list, but schedule agent was retired and archived.

---

## Part B: Detailed Fix Plan

---

### Priority 1: Fix the Communication Layer

**Why first:** Without agent-to-agent messaging, the entire multi-agent hierarchy is non-functional. Jarvis can't delegate. This is THE blocker.

#### 1a. Build agent_messages consumer (solves Issues #1 and #3)

**Problem:** [agent-trigger.py](scripts/webhooks/agent-trigger.py) `/api/webhook/messages` endpoint (line 629) receives `agent_messages` INSERTs but only sends a Telegram notification. It does NOT route the message content to the target agent's OpenClaw session. Since all agents share one bot token, sending to a Telegram group doesn't trigger the agent -- OpenClaw ignores the bot's own messages.

**Solution:** Extend the `/api/webhook/messages` handler to use `openclaw agent --agent {to_agent} --message "{content}"` to deliver messages directly to the target agent's session (same pattern used for QA spawn in `spawn_qa_via_cli` at line 310).

**File:** [scripts/webhooks/agent-trigger.py](scripts/webhooks/agent-trigger.py)

**Changes:**

1. Add new async function `deliver_message_to_agent(agent_id, content, from_agent, message_type)` that calls `openclaw agent --agent {agent_id} --message "..." --timeout 300`
2. In `handle_message_webhook()` (line 629): after sending Telegram notification, also call `deliver_message_to_agent()` to route the actual message content into the target agent's session
3. Add a message type filter: only deliver `request`, `handoff`, and `escalation` types to sessions (skip `info` and `response` to avoid noise)
4. After successful delivery, mark the message as `is_read=true` in Supabase (PATCH to agent_messages)

**Verification:**

- Insert test message into agent_messages (from_agent=jarvis, to_agent=operations, type=request)
- Check webhook logs: should show message delivered to operations session
- Check Supabase: message should be marked is_read=true
- Check operations agent received the message in its session

#### 1b. Add is_test flag to work_items (solves Issue #2 spam)

**New file:** `scripts/supabase/migrate-is-test-flag.sql`

```sql
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false;
```

**Changes to [agent-trigger.py](scripts/webhooks/agent-trigger.py):**

- In `handle_webhook()` (line 438): after extracting `record`, check `record.get("is_test", False)`. If true, skip Telegram notification entirely. Log "skipped: test item" and return early.
- In `handle_qa_review_webhook()` (line 537): look up the work item, if is_test, skip Telegram notifications.

#### 1c. Add circuit breaker for stuck retry alerts

**Problem:** [qa-retry.py](scripts/cron/qa-retry.py) line 216 sends Ricky an alert for EVERY item stuck >30 min, on EVERY 5-min run. No dedup.

**File:** [scripts/cron/qa-retry.py](scripts/cron/qa-retry.py)

**Changes:**

- Add a file-based alert tracker at `/home/ricky/logs/cron/qa-retry-alerted.json` storing `{work_item_id: last_alert_timestamp}`
- Before sending Ricky alert (line 216): check if this work_item_id was alerted in the last 60 minutes. If yes, skip.
- On each run, clean entries older than 2 hours from the tracker file.

#### 1d. Auto-transition approved items to complete

**Problem:** Approved items sit in `approved` status forever. The webhook sends a notification but nothing transitions them to `complete`.

**File:** [agent-trigger.py](scripts/webhooks/agent-trigger.py)

**Changes to `handle_webhook()` around line 499:**

When `status == "approved"`: after sending Telegram notification, PATCH the work_item status to `complete` and set `completed_at` to `now()`.

#### 1e. Clean up stale agent_messages

**File:** [scripts/maintenance/nightly-janitor.py](scripts/maintenance/nightly-janitor.py)

**Add cleanup step:** Mark all `agent_messages` older than 48 hours as `is_read = true` to prevent them from reappearing in bootstrap injection and triggering health check spam.

---

### Priority 2: Fix Config Inconsistencies

**Why second:** Quick wins that immediately save money and align docs with reality. Batch all openclaw.json changes into one gateway restart.

#### 2a. Fix Systems model in openclaw.json

**File:** `~/.openclaw/openclaw.json` line 86

**Change:** Replace `"model": "anthropic/claude-sonnet-4-6"` with `"model": "anthropic/claude-haiku-4-5-20251001"` for the `systems` agent entry.

#### 2b. Add explicit model to v1 transitional agents

**File:** `~/.openclaw/openclaw.json`

**Change:** Add `"model": "anthropic/claude-sonnet-4-6"` to the `team` (line 65), `website` (line 94), and `parts` (line 104) agent entries. Currently they have no model field and inherit the gateway default (Opus).

#### 2c. Remove stale "schedule" from agentToAgent.allow

**File:** `~/.openclaw/openclaw.json` line 432

**Change:** Remove `"schedule"` from the `tools.agentToAgent.allow` array. Schedule agent is retired.

#### 2d. Update BUILD-PLAN.md checklist

**File:** [docs/BUILD-PLAN.md](docs/BUILD-PLAN.md)

**Changes:**

- Mark QT.11, QT.12, QT.13 checkboxes as `[x]` with note "Completed 2026-02-22 per MASTER-AUDIT"
- Update `Post-Plan: QA Trigger System` status from "CODE COMPLETE, 3 DEPLOYMENT ACTIONS REMAINING" to "COMPLETE"

#### 2e. Batch openclaw.json changes + single gateway restart

All openclaw.json changes (2a, 2b, 2c) done together, then one restart:

```bash
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak-$(date +%Y%m%d)
# Make edits 2a, 2b, 2c
systemctl --user restart openclaw-gateway
systemctl --user status openclaw-gateway | head -5
# Test: message Systems group, confirm response uses Haiku (faster, cheaper)
```

---

### Priority 3: Fix Broken OpenClaw Cron Delivery Targets

**Why third:** 5 broken crons generating constant errors. These are OpenClaw-native crons (not VPS crontab), managed via `openclaw cron` CLI.

#### 3a. Audit all OpenClaw crons

```bash
openclaw cron list --json
```

This shows all registered cron jobs with their delivery config.

#### 3b. Fix each broken cron

Affected crons (from Jarvis's brief, with IDs):

- `f05cd053` BM QC Watch -- delivery mode `announce` with no `to` target -> set to backmarket group `-1003888456344`
- `d492050d` Google Maps Local Rank Scan -- delivery mode `silent` but errors -> fix delivery.to for marketing `-1003356921530`
- `d9a774aa` Google Organic Rank Scan -- same
- `6f689757` YouTube Search Rank Scan -- same
- `6fc3ad21` Morning Briefing -- delivery target missing -> set to Jarvis DM `1611042131`

Fix pattern: `openclaw cron update {cron_id} --delivery-to {chat_id}`

#### 3c. Verify each fires correctly

```bash
openclaw cron trigger {cron_id}
journalctl --user -u openclaw-gateway --since "5 min ago" | grep -i "delivery"
```

---

### Priority 4: Register Sub-Agents in OpenClaw

**Why fourth:** Definitions are written (Phase 10 Waves 1+2 complete). Registration is the gap. Ghost sub-agent references in SOUL.md files will become real.

#### 4a. Add 18 sub-agent entries to openclaw.json agents.list

Each sub-agent entry:

```json
{
  "id": "ops-team",
  "name": "ops-team",
  "workspace": "/home/ricky/.openclaw/agents/ops-team/workspace",
  "agentDir": "/home/ricky/.openclaw/agents/ops-team/agent",
  "model": "anthropic/claude-haiku-4-5-20251001"
}
```

No Telegram bindings (they communicate via Supabase agent_messages + the consumer built in P1).

**18 agents:** ops-team, ops-parts, ops-intake, ops-queue, ops-sop, ops-qc, bm-listings, bm-pricing, bm-grading, bm-ops, fin-cashflow, fin-kpis, cs-intercom, cs-escalation, mkt-website, mkt-content, mkt-seo, mkt-adwords (dormant)

#### 4b. Create workspace directories + symlinks

```bash
for agent in ops-team ops-parts ops-intake ops-queue ops-sop ops-qc \
  bm-listings bm-pricing bm-grading bm-ops \
  fin-cashflow fin-kpis cs-intercom cs-escalation \
  mkt-website mkt-content mkt-seo mkt-adwords; do
  mkdir -p ~/.openclaw/agents/$agent/{workspace,agent}
  ln -sf /home/ricky/mission-control-v2/agents/$agent/SOUL.md ~/.openclaw/agents/$agent/workspace/SOUL.md
  ln -sf /home/ricky/mission-control-v2/agents/$agent/CLAUDE.md ~/.openclaw/agents/$agent/workspace/CLAUDE.md
  ln -sf /home/ricky/.openclaw/shared ~/.openclaw/agents/$agent/workspace/foundation
done
```

#### 4c. Update Supabase agent_registry

Set all 18 sub-agents to status='active' (except mkt-adwords='dormant'). Verify parent_agent links are correct.

#### 4d. Add sub-agents to agentToAgent.allow in openclaw.json

Add all 18 sub-agent IDs to the `tools.agentToAgent.allow` array.

#### 4e. Gateway restart + test delegation

```bash
systemctl --user restart openclaw-gateway
# Test: have operations send a message to ops-team via sessions_send
# Verify: ops-team receives message, writes response, heartbeat recorded
```

#### 4f. Retire v1 agents (BLOCKED until sub-agents proven stable, minimum 1 week)

Remove `team`, `parts`, `website` from openclaw.json. Archive workspaces. Migrate remaining memory.

---

### Priority 5: Token Optimisation

**Why fifth:** Money savings. Not urgent but prevents budget overruns.

#### 5a. Reduce bootstrapTotalMaxChars

**File:** `~/.openclaw/openclaw.json` line 29

Change: `45000` -> `30000`

#### 5b. Set spawn timeouts

Already using `--timeout 600` for QA spawns. Consider reducing to 300 for sub-agent tasks.

#### 5c. Trim MEMORY.md files to <2KB

Check current sizes: `wc -c ~/.openclaw/agents/*/workspace/MEMORY.md`

**File:** [scripts/maintenance/rebuild-memory-md.py](scripts/maintenance/rebuild-memory-md.py) -- add max output size parameter (2000 chars) that truncates to most recent/highest-confidence facts.

---

### Priority 6: Memory System Verification

**Why sixth:** Memory is running but never verified for quality. BUILD-PLAN items M.1-M.5.

- **M.1:** Check nightly janitor log for dedup counts. Query for remaining exact duplicates -> should be 0.
- **M.2:** Query memory_facts for facts >90 days with no last_read_at that aren't archived -> should be 0.
- **M.3:** Compare rebuilt MEMORY.md against raw Supabase facts for one agent. Check for truncation, proper categorization.
- **M.4:** Trigger agent session, check injected context includes recent facts + unread messages. Confirm within 30K budget.
- **M.5:** Create two conflicting facts in different namespaces. Verify QA-Data detects the conflict.

---

### Priority 7: Create SYSTEM-STATUS.md

**Why last:** After all fixes are applied, create the "pulse" document Ricky is missing.

**File:** `docs/SYSTEM-STATUS.md`

**Contents:**

- Verified live state (cross-referenced against openclaw.json + Supabase)
- All agents: ID, model, status, Telegram binding, last heartbeat
- All cron jobs: ID, schedule, delivery target, last run status
- All services: name, port, systemd status
- Known issues: status, owner, ETA
- Last verified date

This replaces the need to cross-reference BUILD.md, BUILD-PLAN.md, code-master-brief.md, and openclaw.json separately. This is the one file that tells you the real state.

---

## Part C: Dependency Graph

```
Priority 2 (config fixes) --- no dependencies, do first (quick wins)
    |
    v
Priority 3 (cron fixes) ---- depends on P2 gateway restart (batch together)
    |
Priority 1 (comms layer) --- can run parallel with P2/P3 (code changes, no config overlap)
    |
    v
Priority 4 (sub-agents) ---- depends on P2 gateway restart; depends on P1 message delivery
    |
    v
Priority 5 (token opt) ----- depends on P4 (memory trim after sub-agents stable)
    |
    v
Priority 6 (memory verify) - depends on P5 (verify after bootstrap budget change)
    |
    v
Priority 7 (status doc) ---- after all fixes applied
```

**Estimated effort:** ~3-4 sessions across the week.

---

## Part D: Deferred (Not This Week)

- Slack voice notes (Issue #5) -- workaround exists via n8n
- slack-jarvis channel fix (Issue #6) -- generates errors but not blocking
- Data lake architecture (Issue #9) -- foundation work, not urgent
- Agent consolidation 16->8 (Issue #8) -- big project, do after sub-agents proven
- Cron topic routing (Issue #10) -- quality of life
- Agent identity in Telegram (Issue #11) -- quality of life

