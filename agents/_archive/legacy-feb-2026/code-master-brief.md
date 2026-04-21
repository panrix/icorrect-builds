# Master Brief for Code — All Issues & Projects

**From:** Jarvis (on behalf of Ricky)
**Date:** 21 Feb 2026
**Status:** Active — prioritised by severity

---

## 🔴 CRITICAL — Fix Now

### 1. Inter-Agent Messaging Is Broken

**Problem:** Agents cannot message each other via Telegram groups. When Jarvis sends a message to another agent's group using the `message` tool, Telegram confirms delivery (`ok: true`) but OpenClaw never ingests it for the target agent.

**Evidence:**
- 19 Feb: Jarvis sent 2 messages to Systems group (`-1003664343993`), messageIds 306 & 307 — neither processed
- Systems was active in the same group at the time
- Ricky had to manually copy-paste tasks

**Root Cause:** Bot ignores its own messages to prevent loops. All agents share one bot token, so agent-sent messages look like "own messages" to the receiver.

**Impact:** The entire multi-agent hierarchy is broken. Jarvis (coordinator) cannot delegate to domain agents.

**Proposed Solutions (preference order):**
1. Route bot-sent messages to different agent sessions (check `source_session ≠ my_session`)
2. Expand `sessions_send` for cross-agent messaging (target by agent ID)
3. Build Supabase `agent_messages` consumer (table exists, no reader)

---

### 2. QA Test Items Spam All Agent Groups

**Problem:** QA pipeline test items broadcast alerts to all agent Telegram groups. Items get stuck in retry loops and spam every 5 minutes. Approved items never transition to a terminal state, so the health check keeps flagging them as "stuck."

**Evidence (20 Feb):**
- "Rejection Test 091103" stuck in `in_review` — QA RETRY ALERT every 5 min to Jarvis DMs
- Operations group flooded with QA REJECTED/APPROVED messages
- Systems group hit with 11 unread messages
- 7 approved work items never closed — had to manually set to `complete`
- Jarvis manually cleared Supabase **5 times in one day**

**Fixes Needed:**
1. `is_test` flag on work items that suppresses Telegram notifications
2. Dedicated test channel — route test output away from agent groups
3. Retry circuit breaker — stuck >1h = stop retrying, alert once
4. Auto-cleanup — test items auto-cancel after configurable timeout
5. **Approved items must auto-transition to `complete`** — approve = done, no limbo state

---

### 3. Supabase Pipeline Not Consumed (Recurring Spam Source)

**Problem:** `agent_messages` table exists in Supabase. Agents write to it, but nothing reads/polls it. Unread messages pile up and the health check script alerts every 5 minutes, spamming the Systems Telegram group.

**Evidence:** Jarvis manually cleared stuck messages **5+ times on 20 Feb alone**, and it came back every time. Same `systems → jarvis` daily briefing message keeps reappearing.

**Fixes Needed:**
1. Build a poller/webhook that picks up new `agent_messages` rows and routes to target agent's OpenClaw session
2. OR disable agents from writing to `agent_messages` until the consumer exists
3. This could also solve Issue #1 (inter-agent messaging) as a side effect

**Related:** Already cleared stale entries and set `expected_heartbeat_interval_minutes` to null for `systems` and `slack-jarvis` in `agent_registry` (their heartbeats are disabled in OpenClaw but Supabase still expected them).

---

### 4. Broken Cron Delivery Targets

**Problem:** Multiple cron jobs generate output but fail to deliver with error: `"cron delivery target is missing"`.

**Affected crons:**
- **BM QC Watch** (`f05cd053`) — 8 consecutive errors, delivery mode `announce` with no `to` target
- **Google Maps Local Rank Scan** (`d492050d`) — delivery mode `silent` but still errors
- **Google Organic Rank Scan** (`d9a774aa`) — same
- **YouTube Search Rank Scan** (`6f689757`) — same
- **Morning Briefing** (`6fc3ad21`) — had delivery error on 17 Feb, `"cron delivery target is missing"`

**Fix Needed:** Ensure `delivery.to` is correctly set for all cron jobs, or fix the delivery routing so `announce` mode without explicit `to` still works (delivers to the agent's default chat).

---

## 🟡 IMPORTANT — Fix This Week

### 5. Slack Voice Notes Not Supported

**Problem:** Voice notes sent in Slack are silently dropped. No transcription, no notification, no error.

**Context:** Ricky tested sending a voice note to Jarvis bot on Slack — nothing happened. Blocks planned workflow: tech sends voice note → Whisper transcribes → structured update to Monday.

**Fix Needed:**
- Detect audio/voice messages in Slack events
- Download audio file
- Transcribe locally (Whisper is installed) or pass to API
- Deliver transcription as message content to agent session

**Workaround:** Building n8n workflow externally, but native support preferred.

---

### 6. Slack-Jarvis `channel_not_found` Errors

**Problem:** The slack-jarvis agent tries to read Ferrari's DM channel (`D0ADHEUNGGG`) using `message(action=read)` and gets `channel_not_found`. It retries with different channel IDs — same error. This generates error alerts.

**Evidence:** Found in session logs from 18 Feb, recurring on 20 Feb (`13:49 UTC`). 3 failed message deliveries shown in Jarvis bot DM.

**Likely Cause:** Bot token doesn't have access to that DM channel, or channel ID is wrong.

**Fix Needed:** Verify Slack bot scopes for DM reading, or update the channel ID in slack-jarvis config.

---

## 🟢 ARCHITECTURE — Plan & Build

### 7. Token Usage Optimisation

We burned 32% of weekly Claude limits + £21.60 extra usage in a single 24-hour session. Not sustainable.

**Changes Needed:**

| Change | Impact | Implementation |
|--------|--------|----------------|
| **Jarvis default → Sonnet** | ~80% cost reduction on routine work | Set `default_model` to `anthropic/claude-sonnet-4-6` in Jarvis config. Opus for strategic work only (manual escalation). |
| **Python scripts for data** | ~90% reduction for analysis | Build reusable scripts in `scripts/` — agents call via `exec`, not by reading raw data into context |
| **Trim bootstrap context** | ~30% input token reduction | Lower `bootstrapTotalMaxChars` (currently 45K → consider 30K). Trim MEMORY.md to <2KB. Exclude HEARTBEAT.md from bootstrap. |
| **Sub-agent guardrails** | Prevent runaway sessions | Set `runTimeoutSeconds` on all spawns. Max 2-3 concurrent. Always Sonnet. |
| **Cron prompt minimisation** | Less input tokens per run | Keep prompts short and specific. Use `systemEvent` for simple reminders. |
| **Token budget tracking** | Visibility + alerts | Build daily spend report if API exposes per-session token counts. Alert Ricky if threshold exceeded. |

---

### 8. Agent Architecture Consolidation

**Current state:** 16 active agents, 2 archived. Many overlap, most are dormant.

**Activity (Feb 2026):**
- 🟢 Active: Jarvis (14 memory files), Systems (8), Backmarket (5)
- 🟡 Low: Website (4), Team (4), Customer-service (2), Finn (2), Operations (2), Marketing (2)
- 🔴 Minimal: Parts (1), Slack-jarvis (1)
- ⚫ Dormant: PM (0), Processes (0), QA-code (0), QA-data (0)

**Key Problems:**
1. Sub-agents referenced in SOUL.md files **don't exist** — BM lists 4, Operations lists 8, Marketing lists 4, Customer-service lists 2 — all ghosts
2. Massive overlap — customer-service vs finn, operations vs processes, marketing's mkt-website vs website agent, operations' ops-team vs team agent
3. No delegation protocol — no agent knows HOW to call sub-agents
4. Dormant agents burn baseline resources

**Recommended Consolidation (16 → ~8):**

| Keep | Merge Into It | Disable |
|------|--------------|---------|
| Jarvis (main) | + slack-jarvis | |
| Systems | | |
| Backmarket | | |
| Operations | + processes + team + parts | |
| Customer-service | + finn | |
| Marketing | + website | |
| | | PM (dormant) |
| | | QA-code, QA-data, QA-plan (disable until pipeline fixed) |

**Delegation Protocol Needed:**
1. Define how agents call sub-agents (`sessions_spawn` with agent-specific context)
2. Define handoff format (structured JSON: task, context, expected output)
3. Either create the sub-agents or remove the references from SOUL.md files
4. Add delegation rules to each agent's SOUL.md

---

### 9. Supabase Data Lake (10-Layer Architecture)

Full brief in `docs/data-architecture-brief.md`. Summary:

**Vision:** All business data in Supabase as linked, normalised tables. Agents query structured summaries, never process raw data.

**10 Layers:**
1. Repair Journey — end-to-end timeline, dwell times, rework, margins
2. Customer Experience — call linking, communication gaps, repeat callers
3. Team Performance — per-tech profiles, workload, response times
4. Financial Health — repair-level P&L, revenue leakage, aged receivables
5. Operations & Workflow — bottlenecks, demand forecasting, capacity
6. Parts & Supply Chain — stock-outs, supplier performance
7. Sales & Marketing — acquisition funnel, channel attribution
8. Quality & Standards — QC scorecards, warranty tracking
9. Competitive Intelligence — pricing, competitor map
10. Strategic & Predictive — forecasting, scenario planning

**Data Source Priority:**

| # | Source | Effort | Impact |
|---|--------|--------|--------|
| 1 | Monday.com (API) | Medium | Critical |
| 2 | Asterisk CDR (file import) | Low | High |
| 3 | Xero (API, needs re-auth) | Medium | High |
| 4 | Intercom (API) | Medium | High |
| 5 | Typeform (API) | Low | Medium |
| 6 | Stripe + SumUp (APIs) | Low | Medium |
| 7 | PostHog (API) | Low | Medium |
| 8 | Google Business (API) | Low | Medium |
| 9 | Shopify (API) | Low | Lower |
| 10 | Back Market (API — needs fix) | Low | Lower |

**ETL Pipeline:**
1. Ingest: Pull raw data from APIs on schedule
2. Transform: Clean, deduplicate, link records
3. Load: Write to Supabase normalised tables
4. Refresh: Incremental updates only

---

### 10. Cron Topic Routing Enhancement

**Problem:** No way to send cron output to a specific Telegram topic (thread). Always goes to general chat.

**What Would Help:** Support for `delivery.to` targeting a Telegram topic ID (e.g., `-1003540297665_41` for Systems topic). Different cron outputs → different topics.

---

### 11. Agent Identity in Telegram Messages

**Problem:** All agents appear as the same bot in Telegram. No way to distinguish which agent sent a message.

**What Would Help:** Prefix/tag messages with agent name, or support Telegram "sender_chat" / custom display names per agent.

---

## Current Architecture Reference

```
Agents (16 active):
  jarvis (main), systems, backmarket, operations, customer-service,
  finn, marketing, website, parts, team, processes, pm,
  qa-code, qa-data, qa-plan, slack-jarvis

Archived: finance-archived, schedule-archived

Communication:
  - Telegram groups (one per agent + shared topic groups)
  - Slack (bot + user tokens)
  - Supabase agent_messages (write works, no consumer)

Host: mission-control (Linux Ubuntu, x64)
Telegram bot: shared across all agents
Monday Main Board: 349212843
Supabase: rydvxdoccryqtlcrrcag

Key Config:
  - bootstrapTotalMaxChars: 45,000
  - Health check: /home/ricky/mission-control-v2/config/cron/health-check.py (every 15 min)
  - Reconciliation: /home/ricky/mission-control-v2/config/cron/reconciliation.py (every 5 min)
```

---

## Priority Execution Order

1. **QA spam + Supabase consumer** — actively disrupting all groups right now
2. **Inter-agent messaging** — #1 blocker for multi-agent coordination
3. **Cron delivery fixes** — multiple crons broken
4. **Token optimisation** — burning through plan limits
5. **Slack-jarvis channel fix** — generating errors
6. **Agent consolidation** — reduce from 16 to ~8
7. **Slack voice notes** — blocks intake workflow
8. **Data lake architecture** — foundation for everything else
9. **Topic routing + agent identity** — quality of life

---

## Source Documents

- `docs/code-agent-brief.md` — original 6 issues (now superseded by this doc)
- `docs/token-usage-optimisation.md` — detailed token analysis
- `docs/data-architecture-brief.md` — full 10-layer data blueprint
- `docs/agent-architecture-map.md` — agent hierarchy and activity map
- `confidential/phone-call-analysis.md` — call data analysis (reference)
