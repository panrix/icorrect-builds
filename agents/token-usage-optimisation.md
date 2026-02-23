# Token Usage Optimisation — OpenClaw Multi-Agent System

**Date:** 19 Feb 2026
**Context:** In a single 24-hour session, we hit 32% of weekly all-models limit, 22% Sonnet-only, and £21.60 in extra usage (108% of extra budget). This is unsustainable and needs structural fixes.

---

## What Happened

On 19 Feb 2026, a heavy strategic session covered:
- Ferrari replacement analysis (deep dives, decision mapping, transcript analysis)
- Phone call data analysis (7,383 CDR rows)
- Team role mapping
- Health check / Supabase fixes
- Morning briefing cron redesign
- Multiple sub-agent spawns
- Continuous back-and-forth conversation across 10+ topics

All of this ran through Jarvis on **Opus** — the most expensive model — with a large and growing context window.

---

## Root Causes

### 1. Jarvis runs on Opus for everything
Opus is ~10x the cost of Sonnet per token. Currently Jarvis uses Opus for routine tasks (file reading, data formatting, simple lookups) that don't need deep reasoning.

**Solution:** Default Jarvis to **Sonnet** for routine operations. Escalate to Opus only for:
- Strategic analysis and synthesis
- Confidential/sensitive decisions
- Complex multi-step reasoning
- Direct advisory conversation with Ricky

**Implementation:** Set `default_model` to `anthropic/claude-sonnet-4-6` in Jarvis agent config. Ricky can manually escalate to Opus per-session when needed via `/model` command.

---

### 2. Data processing done by LLM instead of scripts
The phone call analysis involved the LLM reading and computing over 7,383 rows of CDR data. This should have been a Python script that outputs a summary — the LLM only needs to interpret the results.

**Solution:** For any data analysis task:
1. Write a Python script to process the raw data
2. Script outputs a structured summary (key metrics, tables, anomalies)
3. LLM reads only the summary and provides interpretation

**Implementation:** Build a library of reusable analysis scripts in `scripts/` (Monday data, call data, Xero, etc.). Agents call scripts via `exec`, not by reading raw data into context.

---

### 3. Context window grows unbounded
Every message includes the full session context: MEMORY.md, SOUL.md, USER.md, TOOLS.md, AGENTS.md, HEARTBEAT.md, plus the conversation history. MEMORY.md alone is ~4KB and growing. The compacted session summary was massive.

**Solution:**
- Keep MEMORY.md under 2KB — distilled facts only, not narrative
- Keep TOOLS.md as a lean index (already done, ~3KB)
- Trim AGENTS.md — remove verbose examples, keep rules only
- Use memory search (vector) instead of loading full MEMORY.md every session
- Compact sessions more aggressively — shorter summaries focused on active threads only

**Implementation:** 
- Set `bootstrapTotalMaxChars` to a lower value (currently 45,000 — consider 30,000)
- Review and trim all workspace context files
- Consider excluding HEARTBEAT.md from bootstrap (it's only needed during heartbeat polls)

---

### 4. Sub-agents spawn freely without cost awareness
Sub-agents on Sonnet are cheaper but still cost tokens. Multiple sub-agents spawned today for Ferrari analysis, each with their own context loading.

**Solution:**
- Batch related analysis into a single sub-agent call instead of multiple
- Set explicit `runTimeoutSeconds` on all spawns to prevent runaway sessions
- Sub-agents should use Sonnet (already configured) — never Opus

**Implementation:** Add sub-agent cost guardrails in config if available. Document max concurrent sub-agents guideline (suggest: 2-3 max).

---

### 5. Cron jobs accumulate token spend
Each cron job execution loads context + runs a full agent turn. Two cron jobs currently active:
- Morning briefing (daily, 00:00 UTC)
- Slack digest (periodic)

Both on Sonnet, which is fine. But as more cron jobs are added, the cumulative cost grows.

**Solution:**
- Audit cron jobs quarterly — remove any that aren't delivering value
- Use `systemEvent` (cheaper, injects into main session) for simple reminders instead of `agentTurn` (full isolated session) where possible
- Keep cron prompts short and specific — long prompts = more input tokens every run

**Implementation:** Review all active cron jobs, ensure prompts are minimal. Add a note in HEARTBEAT.md to audit cron spend monthly.

---

### 6. No token budget tracking or alerts
There's no visibility into how much each agent/session/cron is consuming until you check the billing page. By then you've already overspent.

**Solution:**
- If the API provides usage data: build a daily token spend report
- Set a soft daily budget per agent (e.g., Jarvis: $X/day, Systems: $Y/day)
- Alert Ricky if daily spend exceeds threshold

**Implementation:** Investigate whether OpenClaw or the Anthropic API exposes per-session token counts. If so, build a monitoring cron or script.

---

## Recommended Model Assignment

| Agent / Task | Current Model | Recommended Model | Rationale |
|-------------|--------------|-------------------|-----------|
| **Jarvis (routine)** | Opus | **Sonnet** | Most tasks don't need Opus reasoning |
| **Jarvis (strategic)** | Opus | **Opus** (manual escalation) | Keep for advisory, synthesis, confidential |
| **Sub-agents** | Sonnet | **Sonnet** ✅ | Already correct |
| **Cron jobs** | Sonnet | **Sonnet** ✅ | Already correct |
| **Systems agent** | Sonnet | **Sonnet** ✅ | Already correct |
| **Data processing** | Opus (in-session) | **Python scripts** | LLM should interpret, not compute |

---

## Priority Actions

1. **Switch Jarvis default to Sonnet** — biggest single saving
2. **Trim context files** — MEMORY.md under 2KB, AGENTS.md shorter
3. **Build analysis scripts** — phone data, Monday pulls, Xero summaries
4. **Add token monitoring** — daily spend visibility
5. **Document escalation triggers** — when Opus is justified vs overkill

---

## Expected Impact

Conservative estimate:
- Jarvis on Sonnet = ~80% reduction in per-message cost for routine work
- Script-based data processing = ~90% reduction for analysis tasks
- Trimmed context = ~30% reduction in input tokens per message
- Combined: should stay well within weekly limits during normal operation

Heavy strategic sessions (like today) can still use Opus — but they should be deliberate, not default.
