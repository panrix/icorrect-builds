# OpenClaw Issues & Feature Requests — Brief for Code

**From:** Jarvis (on behalf of Ricky)
**Date:** 19 Feb 2026
**Context:** iCorrect runs a multi-agent OpenClaw setup (Jarvis, Systems, Operations, Slack-Jarvis) coordinating via Telegram groups. Several issues are blocking the coordinator → domain agent workflow and limiting what the system can do.

---

## 1. 🔴 CRITICAL — Inter-Agent Messaging Is Broken

### Problem
Agents cannot message each other via Telegram groups. When Jarvis (the coordinator) sends a message to another agent's Telegram group using the `message` tool, the message is delivered to Telegram (confirmed `ok: true` + messageId returned) but **never ingested by OpenClaw** for the target agent.

### Evidence
- **Message 1:** Sent at ~05:30 UTC on 19 Feb to Systems agent group (`-1003664343993`), messageId 306 — not found in Systems session transcript
- **Message 2:** Sent at ~05:50 UTC to same group, messageId 307 — also not processed
- **Systems was active** in the same group at the time, chatting with Ricky
- Ricky had to manually copy-paste the task text for Systems to receive it

### Root Cause (suspected)
The Telegram bot ignores its own messages to prevent infinite loops. Since all agents share the same bot token, a message sent by Jarvis appears to come from the bot itself — so when the Systems agent's listener sees it, it discards it as "own message."

### Impact
- Jarvis (coordinator) cannot delegate tasks to domain agents
- The entire multi-agent hierarchy is broken — Ricky is the only message router
- Defeats the purpose of having a coordinator agent

### Proposed Solutions (in order of preference)
1. **Bot self-message routing with session awareness:** Allow bot-sent messages to be ingested when they target a *different* agent session. The message metadata could include the source agent/session, and the receiving agent's listener would accept it if `source_session ≠ my_session`.
2. **Expand `sessions_send` for cross-agent messaging:** Currently `sessions_send` works within the same gateway. If it could target sessions on other agents (by agent ID or session key), agents could communicate directly without Telegram as middleware.
3. **Supabase `agent_messages` pipeline:** There's a partially-built `agent_messages` table in Supabase that agents can write to. If OpenClaw consumed this as an inbound message source, it would provide a database-backed inter-agent channel. (Table exists, write works, but no consumer/poller on the OpenClaw side.)

---

## 2. 🟡 IMPORTANT — Slack Voice Notes Not Supported

### Problem
When a user sends a voice note (audio message) in Slack, the OpenClaw Slack plugin silently drops it. No transcription, no notification, no error — the message just disappears.

### Context
Ricky tested sending a voice note to the Jarvis bot on Slack. Nothing happened. This blocks a planned workflow:
- Tech finishes a repair → sends voice note in Slack channel
- Bot transcribes via Whisper → posts structured update to Monday.com

### What's Needed
- Detect audio/voice messages in Slack events
- Download the audio file
- Either: transcribe locally (Whisper is installed on the host) or pass to an external API
- Deliver the transcription as message content to the agent session

### Workaround (current plan)
Building an n8n workflow to handle voice → transcription outside OpenClaw. But native support would be far better.

---

## 3. 🟡 IMPORTANT — Supabase Pipeline Not Consumed

### Problem
There's a Supabase infrastructure partially built for agent state management:
- `agent_messages` table — agents can write messages to it, but nothing reads/polls them
- `agent_registry` table — tracks agent heartbeats and status
- `business_state` table — shared state store

The `agent_messages` table was designed for inter-agent communication but has no consumer. Messages written there are never delivered to agent sessions.

### What's Needed
- A poller or webhook listener that picks up new `agent_messages` rows and routes them to the target agent's OpenClaw session
- This could solve Issue #1 (inter-agent messaging) as a side effect

### Related Fix Already Applied
- Cleared stale unread messages in `agent_messages` (systems→systems, systems→jarvis) that were causing `reconciliation.py` to spam alerts every 5 minutes
- Set `expected_heartbeat_interval_minutes` to null for `systems` and `slack-jarvis` agents whose heartbeats are disabled in OpenClaw but were still expected by Supabase monitoring

---

## 4. 🟢 NICE TO HAVE — Cron Job Delivery Improvements

### Observation
Cron jobs using `sessionTarget: "isolated"` with `delivery: "announce"` work well for sending results to a Telegram chat. However:
- There's no way to send cron output to a *specific Telegram topic* (thread) — it always goes to the general chat
- The `channel` and `to` fields in delivery aren't well documented for Telegram topic routing

### What Would Help
- Documentation or support for `delivery.to` targeting a Telegram topic ID (e.g., `-1003540297665_41` for the Systems topic)
- This would let us route different cron outputs to different topics (finance reports → Finance topic, system alerts → Systems topic, etc.)

---

## 5. 🟢 NICE TO HAVE — Agent Identity in Telegram Messages

### Problem
When Jarvis sends a message to a group via the `message` tool, it appears as the bot name — not as "Jarvis." Other agents sending to other groups also appear as the same bot. There's no way to distinguish which agent sent a message.

### What Would Help
- A way to prefix or tag messages with the agent name/identity
- Or support for Telegram bot "sender_chat" or custom display names per agent

---

## Current Architecture (for reference)

```
Agents:
  - jarvis (main) — Coordinator, Ricky's direct interface
  - systems — Infrastructure, automations, Monday.com
  - operations — Repair workflow, team SOPs
  - slack-jarvis — Slack-specific interactions

Communication channels:
  - Telegram groups (one per agent, plus shared topic groups)
  - Slack (bot + user tokens)
  - Supabase (partially built, not consumed)

Host: mission-control (Linux, Ubuntu)
Telegram bot: shared across all agents
```

---

## 6. 🔴 CRITICAL — QA Test Items Spam All Agent Groups

### Problem
QA pipeline test items (e.g., "Rejection Test 091103", "Escalation Test 091142", "E2E QA trigger test") broadcast alerts to all agent Telegram groups — Operations, Systems, and Jarvis DMs. Test rejections, approvals, and escalations spam every 5 minutes when items get stuck in retry loops.

### Evidence (20 Feb 2026)
- "Rejection Test 091103" stuck in `in_review` — QA RETRY ALERT every 5 minutes to Jarvis DMs
- Operations group flooded with QA REJECTED / QA APPROVED / Work item update messages from test items
- Systems group hit with 11 unread `qa-plan → operations/systems/jarvis` messages in Supabase
- Had to manually cancel work items and clear unread messages in Supabase to stop the spam

### Root Cause
No distinction between test and production work items. QA pipeline treats everything the same — test items trigger the same notification flow as real work.

### What's Needed
1. **Test flag on work items** — `is_test: true` that suppresses Telegram notifications
2. **Dedicated test channel** — route test output to a test-only Telegram group or log file, not agent groups
3. **Retry circuit breaker** — if a work item is stuck in review for >1h, stop retrying and alert once (not every 5 min)
4. **Auto-cleanup** — test items should auto-cancel after a configurable timeout
5. **Close approved items** — QA pipeline approves work items but never moves them to `complete`, so the health check keeps flagging them as "stuck >60m". Approved items need to auto-transition to `complete` after merge.

---

## Priority Order

1. **Inter-agent messaging** — This is the #1 blocker. Without it, multi-agent coordination doesn't work.
2. **QA test spam** — Actively disrupting all agent groups right now
3. **Slack voice notes** — Blocks intake workflow automation
4. **Supabase pipeline** — Could solve #1 and enable more
5. **Cron topic routing** — Quality of life
6. **Agent identity** — Nice to have
