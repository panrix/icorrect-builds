---
name: System Health Audit Plan
overview: Full audit of the mission-control-v2 agent system, cross-referencing live VPS state, build documentation, and Jarvis's issue report to produce a clear picture of what works, what's broken, and what to fix for Monday.
todos:
  - id: fix-qa-spam
    content: "Fix QA test item spam: add is_test flag, circuit breaker, auto-complete approved items, suppress test notifications"
    status: pending
  - id: fix-cron-delivery
    content: Audit and fix all broken cron delivery targets in openclaw.json (5+ crons failing)
    status: pending
  - id: token-quick-wins
    content: "Quick token wins: Systems to Haiku, Jarvis default to Sonnet (needs Ricky approval), trim bootstrap budget"
    status: pending
  - id: build-message-consumer
    content: Build agent_messages consumer/poller service — solves inter-agent messaging (#1 blocker) and message spam (#3)
    status: pending
  - id: register-subagents
    content: Register 18 sub-agents in openclaw.json (Phase 10 completion) — definitions exist, just need runtime registration
    status: pending
  - id: verify-memory
    content: "Verify memory system (M.1-M.5): janitor dedup, 90-day archive, MEMORY.md rebuild, bootstrap injection, conflict detection"
    status: pending
  - id: fix-slack-jarvis
    content: Fix Slack-Jarvis channel_not_found errors — verify bot scopes, update channel ID
    status: pending
  - id: retire-v1-agents
    content: Retire v1 agents (team, parts, website) from openclaw.json after sub-agent verification
    status: pending
  - id: consolidation-assessment
    content: "Agent consolidation: review Jarvis proposal (16 to ~8), decide merges, execute approved ones"
    status: pending
  - id: update-docs
    content: Update BUILD.md and BUILD-PLAN.md to reflect actual verified state, resolve doc-vs-reality discrepancies
    status: pending
isProject: false
---

# Mission Control v2 — Full System Audit and Fix Plan

## Current Reality (Verified Live)

Infrastructure is healthy: VPS at 44% disk, 21% memory, load 0.08. OpenClaw gateway running 2 days stable. Agent-trigger webhook service restarted today with hardening code. All health checks green. 13 agents registered. QA trigger deployment completed this morning.

---

## 1. What's GOOD (Keep / Don't Touch)

- **VPS and core services**: Gateway stable, webhook service running, nginx proxying correctly
- **Supabase**: 9 tables deployed with RLS, realtime enabled, pg_net triggers firing
- **Monitoring**: Health checks (15 min), reconciliation (5 min), daily briefing (1am UTC), weekly summary, nightly backup -- all running, all green right now
- **QA Trigger pipeline**: Code-complete and deployed as of today. Git hooks in 14 workspaces, `qa_reviews` table live, NOT NULL enforced, spawn hardening active, retry cron running
- **Dashboard**: [mc.icorrect.co.uk](https://mc.icorrect.co.uk) serving React app with 5 tabs (Kanban, Health, Activity, Briefings, KPIs)
- **Memory bridge**: `sync-memory-to-supabase.py` running every 5 min with hash-based change detection. 333 facts across 6 agents
- **Agent definitions**: All 11 v2 top-level agents + 18 sub-agent SOUL.md/CLAUDE.md written and symlinked
- **Webhook auth**: `webhook_headers()` hardened (SECURITY DEFINER, anon role revoked)
- **Backups**: Nightly Supabase JSON export + 30-day retention configured

---

## 2. What's BROKEN (Active Issues, Prioritized)

### CRITICAL -- Actively Causing Damage

**Issue A: Inter-Agent Messaging is Dead**
- All agents share one Telegram bot token. OpenClaw's loop-prevention filter drops messages that appear to come from the bot itself. Since every agent uses the same bot, Agent A messaging Agent B's group looks like the bot talking to itself.
- Evidence: 19 Feb, 2 messages from Jarvis to Systems group confirmed delivered by Telegram but never ingested by OpenClaw
- **Impact**: Jarvis cannot delegate to domain agents. The entire coordination layer is non-functional.
- **Fix options**: (a) Supabase `agent_messages` consumer as workaround -- agents write to table, consumer routes to target (b) OpenClaw source-session filtering (c) `sessions_send` for direct cross-agent delivery. Option (a) is within our control and also solves Issue C below.

**Issue B: QA Test Items Spam All Agent Groups**
- Test items from QA pipeline broadcast to every Telegram group. Approved items never transition to terminal state, causing perpetual retry alerts.
- Evidence: Jarvis cleared Supabase 5 times on Feb 20. 7 approved items stuck, 11 unread messages flooding Systems group.
- **Fix**: Add `is_test` flag to `work_items`, route test output to dedicated channel, add circuit breaker (stuck >1h = stop retry + single alert), auto-transition approved items to `complete`.

**Issue C: agent_messages Table Has No Consumer**
- Agents write to `agent_messages`, but nothing reads or processes those messages. Unread messages pile up, health check alerts every 5 minutes.
- **Fix**: Build a poller/consumer that reads new `agent_messages` rows and routes to the target agent's OpenClaw session. This also provides the inter-agent messaging workaround for Issue A.

**Issue D: Broken Cron Delivery Targets**
- 5+ OpenClaw cron jobs failing with "cron delivery target is missing": BM QC Watch, Google Maps/Organic/YouTube rank scans, Morning Briefing
- **Fix**: Audit all cron definitions in `openclaw.json`, ensure `delivery.to` is set correctly for each. For `announce` mode, default to the agent's primary chat if no explicit `to`.

### IMPORTANT -- Fix This Week

**Issue E: Token Burn is Unsustainable**
- 32% of weekly Claude limits + GBP 21.60 extra in a single 24-hour session
- Root causes: Jarvis on Opus for routine work, data processing by LLM instead of Python scripts, 45K bootstrap budget
- Quick wins already identified in [token-usage-optimisation.md](/home/ricky/.openclaw/agents/main/workspace/docs/token-usage-optimisation.md)

**Issue F: Systems Agent Model Mismatch**
- `openclaw.json` shows Systems on `claude-sonnet-4-6` but BUILD.md and PRD specify Haiku 4.5
- This is a cost waste -- Systems does high-volume monitoring that should run on the cheapest model

**Issue G: Slack-Jarvis channel_not_found Errors**
- Bot token can't access Ferrari's DM channel (`D0ADHEUNGGG`). Recurring errors on 18 and 20 Feb.
- **Fix**: Verify Slack bot scopes for DM reading, update channel ID in config

### INCOMPLETE -- Build Tasks Remaining

**Issue H: Sub-Agents Not Registered in OpenClaw (Phase 10)**
- All 18 sub-agent definitions (SOUL.md + CLAUDE.md) are written in the git repo
- But NONE are registered in `openclaw.json` -- they can't be spawned
- Domain lead SOUL.md files reference sub-agents that don't exist in the runtime
- Remaining tasks: 10.4, 10.5, 10.9, 10.10, 10.12-10.14 per [BUILD-PLAN.md](docs/BUILD-PLAN.md)

**Issue I: V1 Agents Still Running Alongside V2**
- `team`, `parts`, `website` are still registered in OpenClaw on Opus (gateway default)
- They overlap with their intended replacements (`ops-team`, `ops-parts`, `mkt-website`)
- Burning Opus tokens for agents that should be retired
- Blocked on sub-agent registration (Issue H)

**Issue J: Memory System Not Verified**
- Memory sync is running but never independently verified
- Tasks M.1-M.5 in BUILD-PLAN: janitor dedup, 90-day archive, MEMORY.md rebuild quality, bootstrap injection quality, cross-namespace conflict detection

---

## 3. Discrepancies Between Docs and Reality

| Item | Documentation Says | Reality | Impact |
|------|-------------------|---------|--------|
| Agent count | BUILD.md: "11 active top-level" | openclaw.json: 13 registered (includes team/parts/website v1) | Confusion -- need single source of truth |
| Systems model | BUILD.md + PRD: Haiku 4.5 | openclaw.json: Sonnet 4.6 | Cost -- Sonnet is ~10x Haiku |
| Jarvis agent count | code-master-brief: "16 active agents" | openclaw.json: 13 bindings (not counting archived) | Different counting methods, but important to align |
| Sub-agents | BUILD.md: "18 dormant sub-agents" | Not in openclaw.json at all, only SOUL/CLAUDE files on disk | They literally don't exist in the runtime |
| Finance agent | BUILD.md: "INACTIVE -- merged into operations" | Not in openclaw.json (correct) but referenced in PRD/HANDOFF | Clean -- this one was handled right |
| PM agent | BUILD-PLAN: "status=disabled" | Still in openclaw.json as registered agent | Should verify it's actually disabled or remove |

---

## 4. Recommended Execution Plan for This Week

### Monday (Day 1): Stop the Active Bleeding

1. **Fix QA spam** (Issue B) -- Add `is_test` flag column to `work_items`, update webhook handler to suppress test notifications, add auto-complete for approved items, add circuit breaker for stuck items >1h
2. **Fix cron delivery targets** (Issue D) -- Audit and fix all cron definitions in `openclaw.json`
3. **Quick token wins** (Issue E partial) -- Switch Systems to Haiku in `openclaw.json`, switch Jarvis default to Sonnet for routine work (manual escalation to Opus for strategic), trim `bootstrapTotalMaxChars` from 45K to 30K

### Tuesday (Day 2): Build the Message Consumer

4. **Build agent_messages consumer** (Issues A + C) -- Python service that polls `agent_messages` for unread rows and routes them to target agent via `sessions_send` or OpenClaw CLI. This is the single most impactful fix because it:
   - Solves inter-agent messaging (the #1 blocker)
   - Eliminates the unread message spam
   - Enables the coordination layer the whole system depends on

### Wednesday-Thursday (Days 3-4): Complete the Build

5. **Register sub-agents in OpenClaw** (Issue H) -- Add 18 entries to `openclaw.json` (Haiku model, no Telegram), restart gateway, verify spawning works
6. **Verify memory system** (Issue J) -- Run M.1-M.5 verification tasks from BUILD-PLAN
7. **Fix Slack-Jarvis** (Issue G) -- Verify bot scopes, fix channel ID

### Friday (Day 5): Consolidate and Clean Up

8. **Retire v1 agents** (Issue I) -- Remove team/parts/website from `openclaw.json` after sub-agents are verified
9. **Agent consolidation assessment** -- Jarvis recommends 16 to ~8. Review his proposal, decide which merges to execute
10. **Write status doc** -- Update BUILD.md and BUILD-PLAN.md to reflect actual state

---

## 5. Strategic Decision Points for Ricky

These require your input before we can proceed:

1. **Agent consolidation scope**: Jarvis recommends merging from 16 to ~8 (e.g., merge slack-jarvis into Jarvis, merge finn into customer-service, disable dormant QA agents until pipeline fixed). Do you agree with his proposed merges in [code-master-brief.md](/home/ricky/.openclaw/agents/main/workspace/docs/code-master-brief.md) Section 8?

2. **Jarvis model default**: Should Jarvis run on Sonnet by default (80% cost reduction) with manual escalation to Opus for strategic work? This is the biggest single cost lever.

3. **n8n removal**: The replacement Python scripts have been running since Feb 18. Ready to approve removal?

4. **Data lake priority**: Jarvis's Section 9 describes a 10-layer data architecture with Monday.com as priority #1 data source. Is this the right next strategic investment after stabilization?

---

## 6. What NOT to Touch

- Do NOT modify QA agent SOUL.md files (protected -- Ricky only)
- Do NOT edit `~/.openclaw/openclaw.json` without understanding the full binding structure and backing up first
- Do NOT restart `openclaw-gateway` without scheduling quiet hours (takes all agents offline ~30s)
- Do NOT remove n8n until explicit approval
- The `~/.openclaw/shared/` directory is read-only and symlinked into all agents -- changes propagate everywhere
