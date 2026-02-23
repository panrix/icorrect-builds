# System Health Audit + Fix Plan

## Context

Ricky has lost visibility into his 14-agent OpenClaw system. Multiple agents built it, docs are fragmented across 6+ files, and Jarvis flagged 11 issues. A Cursor agent produced a 7-priority fix plan. This audit cross-references everything against the live VPS state to give Ricky a single honest picture and a realistic action plan for Monday.

---

## Part 1: State of the System (Ground Truth)

### WORKING (don't touch)

| Component | Evidence |
|-----------|----------|
| OpenClaw Gateway v2026.2.2-3 | Active since Feb 20, 3GB mem, 435 tasks |
| Agent Trigger (FastAPI, port 8002) | Active since Feb 22, webhook pipeline live |
| Supabase (9 tables, pg_net triggers) | Data flowing, webhooks firing |
| Memory bridge | Agents write markdown, cron syncs to Supabase every 5m. 333+ facts. |
| QA Trigger pipeline | 10/10 steps complete, 3 blockers resolved Feb 22 |
| Dashboard (mc.icorrect.co.uk) | React app live, 5 tabs |
| Morning Briefing cron | Status: OK |
| Health check + reconciliation crons | Running on schedule |

### BROKEN

| Issue | Severity | Impact |
|-------|----------|--------|
| **Inter-agent messaging** — shared bot token means bot ignores own messages | CRITICAL | Jarvis can't delegate. Multi-agent hierarchy non-functional. |
| **4 model configs wrong** — team/website/parts inherit Opus (no model set, no defaultModel in config). Systems on Sonnet but should be Haiku. | HIGH | Burning ~4x more tokens than needed on 3 agents |
| **4 broken OpenClaw crons** — BM QC Watch + 3 SEO rank scans all in `error` state | MEDIUM | BM quality monitoring blind. SEO tracking offline. |
| **agent_messages no consumer** — table gets writes, nothing reads them. Health check spams about unread messages. | MEDIUM | Blocks inter-agent coordination path via Supabase |
| **QA test items spam** — no `is_test` flag, no circuit breaker, approved items don't auto-complete | MEDIUM | Jarvis manually cleared Supabase 5x in one day |

### MISCONFIGURED (quick fixes)

| Item | Detail |
|------|--------|
| `agentToAgent.allow` includes "schedule" | Retired agent, dead reference |
| 4 orphan directories on disk | finn, processes, finance-archived, schedule-archived — not in openclaw.json |
| `main` (Jarvis) model implicit | Should be explicit Opus, not inherited |

### OUTDATED DOCS vs REALITY

| Claim | Reality |
|-------|---------|
| MEMORY.md says "12 active agents" | 14 entries in openclaw.json |
| MEMORY.md says "12 phases all complete" | Phases 1-8, 11-12 done. **Phase 10 (18 sub-agents) NOT done** — SOULs on disk, zero registered in OpenClaw |
| BUILD.md says Systems = Haiku | openclaw.json says Sonnet |
| BUILD-PLAN QT.11-13 unchecked | MASTER-AUDIT confirms all 3 completed Feb 22 |

---

## Part 2: Cursor Plan Critique

**Plan file:** `/home/ricky/.cursor/plans/system_health_assessment_e5f33bb3.plan.md`

### What's good

- Correctly identifies comms layer as #1 blocker
- Config fix batching into single gateway restart — smart
- Detailed code-level changes for agent-trigger.py
- Dependency graph is logically sound
- agent_messages consumer via `openclaw agent --message` — reasonable approach if that CLI command exists

### What's wrong

| Issue | Problem |
|-------|---------|
| **Priority 4: Register all 18 sub-agents at once** | Too much at once. Fix comms Monday, pilot 2-3 sub-agents on Kimi 2.5 Wednesday, scale from there. Don't batch 18 registrations + 18 Telegram groups in one go. |
| **Doesn't address Kimi 2.5 migration** | Ricky explicitly mentioned moving agents to Kimi 2.5 via NVIDIA. This changes the entire model config strategy. |
| **Memory verification (P6) listed as this-week work** | Nice-to-have, not urgent. Bridge is working. |
| **Doesn't triage the broken crons** | Are the SEO scan scripts even functional? Are they from the incomplete marketing intelligence build? Need to check before "fixing" them. |
| **Doesn't mention security issues** | mc.icorrect.co.uk may have open RLS + exposed anon key. mi.icorrect.co.uk has documented SQL injection. |
| **No ground truth audit step** | Jumps to fixes without first verifying actual VPS state matches docs |

### Verdict

The Cursor plan is 70% good. Priorities 1-3 and 5 are solid. Priority 4 (18 sub-agents) should be completely deferred. Priority 6-7 are next-week work. Missing the Kimi 2.5 factor entirely.

---

## Part 3: Monday Action Plan

### Session 1 (Morning): Config Fixes + Cron Triage

All changes batched, single gateway restart.

**Step 1: Model config fixes in openclaw.json**
- Set `"defaultModel": "anthropic/claude-sonnet-4-6"` at gateway level
- Set `"model": "anthropic/claude-opus-4-6"` explicitly on `main`
- Set `"model": "anthropic/claude-haiku-4-5-20251001"` on `systems`
- team/website/parts will now correctly inherit Sonnet from the new default
- Remove `"schedule"` from `agentToAgent.allow`

**Step 2: Triage 4 broken crons**
- `f05cd053` BM QC Watch — check if script exists, what it monitors. If functional, fix delivery target. If stub, disable.
- `d492050d` / `d9a774aa` / `6f689757` (3 SEO scans) — likely from incomplete marketing intelligence build. Check scripts. If incomplete, disable rather than fix broken code.

**Step 3: Gateway restart + verify**
```bash
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak-20260223
# Apply all config changes
systemctl --user restart openclaw-gateway
systemctl --user status openclaw-gateway
# Test: message Systems group, confirm faster response (Haiku)
```

**Step 4: Update docs**
- Fix BUILD-PLAN.md QT.11-13 checkboxes
- Update MEMORY.md agent count and model assignments

**Estimated time:** 1-2 hours

---

### Session 2 (Afternoon): Inter-Agent Messaging Investigation

This is the #1 architectural blocker. Investigate before coding.

**Step 1: Confirm the problem**
- Send a test message from Jarvis bot to Systems group
- Check if Systems agent sees it or if it's ignored
- Check OpenClaw logs for "ignoring own message" or similar

**Step 2: Explore solutions**
- Check if `openclaw agent --agent {id} --message` CLI command exists
- If it does → extend agent-trigger.py to use it for message routing (the Cursor plan's approach)
- If it doesn't → options are:
  - (a) Second Telegram bot for system messages
  - (b) Supabase polling (bootstrap hook already injects unread messages)
  - (c) HTTP webhook per agent

**Step 3: Implement the simplest working option**

**Step 4: Test end-to-end**
- Insert message into agent_messages → verify target agent receives it

**Estimated time:** 2-3 hours

---

### Tuesday: QA Spam Fixes + Sub-Agent Prep

| Task | Detail |
|------|--------|
| Add `is_test` flag to work_items | Supabase migration + agent-trigger.py filter |
| Circuit breaker for retry alerts | Dedup tracker in qa-retry.py |
| Auto-complete approved items | agent-trigger.py: approved → complete transition |
| **Prep sub-agent registration** | Create workspace dirs, symlink SOULs, prep openclaw.json entries for first wave |

### Wednesday: Sub-Agent Pilot (Wave 1)

Register 2-3 sub-agents as a pilot AFTER comms fix is proven:
- `ops-team` (inherits from retired `team` agent)
- `bm-listings` (core BM revenue function)
- Set model to Kimi 2.5 via NVIDIA endpoint

**Only proceed if Monday's inter-agent messaging fix is working.** If not, Wednesday becomes "finish comms fix."

### Thursday-Friday: Scale Sub-Agents + Cleanup

| Task | Detail |
|------|--------|
| Register remaining Wave 1 sub-agents (8 more ops + BM) | After pilot proves stable |
| Slack-jarvis channel_not_found diagnosis | Quick investigation |
| Clean up orphan agent directories | Archive finn, processes, finance-archived |

### Defer

| Item | Why |
|------|-----|
| Wave 2 sub-agents (finance, CS, marketing — 8 agents) | Next week, after Wave 1 proven |
| Agent consolidation (16→8) | Revisit after sub-agents are running |
| Data lake (10-layer) | Architecture discussion, not a code task yet |
| Memory system verification | Bridge working, verify when stable |

---

## Part 4: Kimi 2.5 / Model Migration

OpenClaw supports non-Anthropic models. Strategy: **Kimi 2.5 for sub-agents** (data analysis, SOPs, routine work) + **cost reduction** by moving sub-agents off Anthropic.

**Model assignment plan:**
| Tier | Model | Agents | Rationale |
|------|-------|--------|-----------|
| Coordinator | Claude Opus 4.6 | main (Jarvis) only | Strategic decisions, cross-agent coordination |
| Domain leads | Claude Sonnet 4.6 | operations, backmarket, customer-service, marketing | Core business decisions, Anthropic quality |
| Infrastructure | Claude Haiku 4.5 | systems | Monitoring, lightweight tasks |
| Sub-agents | Kimi 2.5 (NVIDIA) | All 18 sub-agents | Data analysis, SOPs, routine processing. Cost reduction. |
| QA | Claude Sonnet 4.6 (for now) | qa-plan, qa-code, qa-data | Code review needs Claude quality. Evaluate Kimi later. |

**Monday action:** Fix the 4 wrong model configs (team/website/parts off Opus, systems to Haiku). When sub-agents are registered, set them to Kimi 2.5 from the start.

---

## Part 5: Key Files

| File | Location (VPS) | Purpose |
|------|----------------|---------|
| openclaw.json | `~/.openclaw/openclaw.json` | Master config — all model/agent/cron changes |
| agent-trigger.py | `~/mission-control-v2/scripts/webhooks/agent-trigger.py` | Webhook receiver — comms fixes go here |
| health-check.py | `~/mission-control-v2/config/cron/health-check.py` | Monitoring — check what it flags |
| BUILD-PLAN.md | `~/mission-control-v2/docs/BUILD-PLAN.md` | Needs QT.11-13 checkbox update |
| code-master-brief.md | `~/.openclaw/agents/main/workspace/docs/code-master-brief.md` | Jarvis's 11 issues (reference) |

---

## Verification

**After Monday (config + comms):**
1. `openclaw cron list` — all crons either `ok` or explicitly disabled
2. Message each agent type (Opus/Sonnet/Haiku) — confirm correct model responding
3. Inter-agent test message — Jarvis → Operations via agent_messages → Operations receives it
4. `systemctl --user status openclaw-gateway` — healthy, no OOM
5. Health check cron — no more spam about stale agent_messages

**After Wednesday (sub-agent pilot):**
6. `ops-team` and `bm-listings` responding on Kimi 2.5
7. Parent agent (operations/backmarket) can send task → sub-agent receives and responds
8. Sub-agent activity logged in Supabase agent_activity table
9. Token cost visibly lower for sub-agent sessions vs Sonnet equivalents
