# 06 — Jarvis Fixes (Pre-Rebuild)

**Date:** 2026-02-25
**Purpose:** Document what was fixed on the main agent (Jarvis) before the v3 rebuild. These are quick wins to stop the bleeding while rebuild research continues.

---

## Source

Jarvis ran a self-audit against the OpenClaw docs and produced 13 issues: `~/.openclaw/agents/main/workspace/Main-agent-what-we-did-wrong.md`

This document covers the fixes applied, what was deferred to v3, and baseline measurements.

---

## Context Baseline (Before)

From `/context list` run before changes:

```
System prompt: 33,561 chars (~8,391 tok)
Workspace files injected per turn:
  AGENTS.md:     1,951 tok
  MEMORY.md:     1,233 tok
  SOUL.md:         416 tok
  BOOTSTRAP.md:    363 tok
  TOOLS.md:        213 tok  (empty template)
  IDENTITY.md:     159 tok  (blank template)
  USER.md:         119 tok  (blank template)
  HEARTBEAT.md:     42 tok
Tool schemas:    4,386 tok
Session total:  46,775 / 200,000
```

Key problems: MEMORY.md was a raw 80-fact Supabase dump. IDENTITY.md and USER.md were blank. BOOTSTRAP.md was never completed. TOOLS.md was empty.

---

## Fixes Applied

### 1. MEMORY.md — Curated (1,233 tok → 279 tok)

**Before:** Auto-generated Supabase export with 80+ unstructured facts. Injected every turn including heartbeats. Header said "Do not edit directly."

**After:** 20-line curated summary with 4 sections:
- Current State (rebuild status, memory search status)
- Key Context (Ricky, BackMarket revenue, agent count, cost)
- Active Decisions (memory backend, SOP injection, handoff protocol)
- References to topic files in memory/

**Moved to memory/ topic files** (not injected, searchable on demand):
- `memory/agent-architecture.md` — full agent roster, models, sub-agents, costs
- `memory/research-and-decisions.md` — rebuild decisions, memory strategy, SOP findings
- `memory/business-context.md` — iCorrect ops data, workflow types, config notes

**Saving:** ~954 tok/turn

### 2. IDENTITY.md — Completed (blank → filled)

```markdown
- Name: Jarvis
- Creature: AI coordinator
- Vibe: Direct, competent, low-ego
- Emoji: target emoji
```

### 3. USER.md — Completed (blank → filled)

Ricky's details: name, timezone (UTC+8), management style (remote from Bali), communication preferences (concise, actionable, no fluff, ADHD-aware), work preferences (one phase at a time).

No sensitive data — just enough for Jarvis to calibrate tone and priority.

### 4. BOOTSTRAP.md — Deleted (363 tok → 0)

Per OpenClaw docs: "Removes BOOTSTRAP.md when finished so it only runs once." The bootstrap ritual (fill IDENTITY.md, USER.md, review SOUL.md) was completed manually, so BOOTSTRAP.md was removed.

**Saving:** 363 tok/turn

### 5. TOOLS.md — Populated (empty → real environment info)

Now contains:
- VPS details (host, user, OS)
- Key file paths (openclaw.json, api-keys, supabase creds, builds, shared foundation)
- Services (gateway, webhook trigger, nginx)
- Active agent Telegram group IDs (all 14 agents)
- Model assignments
- CLI tools (agent-browser, whisper, browser-use MCP)
- Cron job schedule

---

## Context Baseline (After)

```
System prompt: 25,082 chars (~6,271 tok)
Workspace files injected per turn:
  AGENTS.md:       905 tok  (Jarvis also trimmed this himself)
  TOOLS.md:        516 tok  (was 213 empty)
  SOUL.md:         351 tok
  MEMORY.md:       279 tok
  USER.md:         181 tok
  IDENTITY.md:      70 tok
  HEARTBEAT.md:     42 tok
  BOOTSTRAP.md:      0 tok  (deleted)
Tool schemas:    4,386 tok
Session total:  15,822 / 200,000
```

**Total reduction: 46,775 → 15,822 tokens (66% drop)**

The session total difference is partly because the "after" measurement was on a fresh session (less conversation history). But the workspace file reduction alone saves ~2,300 tok/turn — that compounds across every heartbeat, every message, every cron trigger.

---

## Verification Findings

### Memory Search (Issue #8)
- **Status:** Working. Provider: OpenAI (text-embedding-3-small), Mode: Hybrid (vector + keyword)
- **Results:** Empty — zero hits. Pipeline is configured but had almost nothing to index.
- **Expected improvement:** The new topic files in memory/ should start populating the vector index.

### Memory Flush Before Compaction (Issue #9)
- **Status:** Already enabled. `compaction.memoryFlush.enabled: true`, threshold 20,000 tokens.
- **No action needed.**

### Git Backup (Issue #12)
- **Status:** Git initialized but zero commits, no remote configured.
- **Action needed:** Ricky to create a private repo and push. Not blocking other work.

---

## Deferred to v3 Rebuild

| Issue | Why Deferred |
|-------|-------------|
| Platform injection problem (all bootstrap files unconditional) | Requires OpenClaw architecture changes or bootstrap hook redesign |
| Multi-agent isolation (everything runs as agent:main) | Core rebuild scope — new agent template, workspace structure |
| Sub-agent context strategy | Depends on whether sub-agents become full agents |
| AGENTS.md size (still 905 tok of group chat etiquette) | Will be rewritten as part of v3 agent template |
| SOP injection mechanism | Defined in 04-agent-architecture-spec.md, build during rebuild |
| Workspace file enforcement (cron cleanup) | Part of v3 template — needs the template first |

---

## Lessons for the Rebuild

1. **Small MEMORY.md + topic files works.** The vector search pipeline exists. Once topic files accumulate, agents get on-demand recall without context burn.
2. **Bootstrap completion matters.** A blank IDENTITY.md and USER.md meant Jarvis had no persistent sense of self or user. Every session started cold.
3. **TOOLS.md is high-value, low-cost.** ~500 tokens that save multiple tool calls per session. Should be in every v3 agent template.
4. **Measure before and after.** `/context list` made the token savings concrete. Should be part of every agent setup checklist.

---

## Additional Fixes (Claude Code — same day)

These were applied in a separate session, addressing issues not covered by the Jarvis self-audit.

### 6. AGENTS.md — Rewritten from Generic Template to Jarvis-Specific

**Before:** Stock OpenClaw Pi template (7.7K). Contained Discord emoji reactions, WhatsApp formatting, ElevenLabs voice storytelling, Twitter mentions checking, weather checking, generic group chat guide. None of this applies to Jarvis.

**After:** Custom Jarvis coordinator version (3.6K, ~905 tok). Structure:
- Session startup routine (kept from template)
- **Coordinator role definition** (new) — "you route tasks, you don't do the work"
- **Agent routing table** (new) — which agent handles what domain
- Memory architecture (kept from template, trimmed)
- Safety rules (kept from template, trimmed)
- Telegram-specific group chat guidance (replaced Discord/WhatsApp sections)
- Heartbeat basics (kept, removed weather/Twitter/email checking)
- Foundation docs reference (new) — points to `~/.openclaw/shared/`

**Removed:** Discord formatting, WhatsApp rules, ElevenLabs voice, emoji reaction guide, heartbeat state JSON example, Twitter/weather/email proactive checking, platform-agnostic group chat rules.

### 7. SOUL.md — Rewritten for Coordinator Role

**Before:** Generic Pi template (1.7K). Talked about being "a guest in someone's life", ElevenLabs TTS, Discord link suppression. Personal assistant framing.

**After:** Jarvis-specific identity (1.4K). Defines:
- Who Jarvis is: coordinator for iCorrect, Apple repair business
- Tone: direct, concise, actionable (matches Ricky's CLAUDE.md preferences, ADHD-aware)
- Role: coordinator not executor, route don't hoard
- Boundaries: privacy, external caution, group chat restraint
- Continuity: workspace files are memory

### 8. Main-agent-what-we-did-wrong.md — Moved Out of Workspace Root

**Before:** 9.9K retrospective sitting in workspace root, likely auto-injected every turn (~2,500 tok/turn).

**After:** Moved to `memory/2026-02-25-what-we-did-wrong.md`. Still accessible and searchable via memory tools, but no longer auto-injected into context.

**Saving:** ~2,500 tok/turn

### 9. compaction.memoryFlush — Enabled

**Correction:** The earlier audit noted this as "already enabled." It was not. The `agents.defaults.compaction` section had `mode: "safeguard"` but NO `memoryFlush` config.

**Added to openclaw.json:**
```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "enabled": true,
          "softThresholdTokens": 4000,
          "systemPrompt": "Session nearing compaction. Store durable memories now.",
          "prompt": "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store."
        }
      }
    }
  }
}
```

This gives the agent a silent turn to save durable notes before context compaction. Without it, context was compacted away with no chance to persist important information.

### 10. .pi/ Empty Directory — Deleted

Artifact from the Pi platform. Empty directory in workspace root. Removed.

---

## Infrastructure Fixes (Claude Code — same session, pre-audit)

These were applied to the VPS before the Jarvis workspace audit, based on a full system audit:

### Gateway Restart — Reclaimed ~10GB RAM

Gateway had been running 5 days, leaked to 10.8GB RAM + 1.1GB swap (90% full) from orphaned Chromium processes. Restarted to 560MB. Free RAM went from 1.6GB to 10GB.

### Model Overrides — 3 Agents Fixed

`team`, `website`, `parts` had no explicit model in `openclaw.json` — defaulting to Opus 4.6 instead of Sonnet 4.6. Added `"model": "claude-sonnet-4-6"` to all three. Only `main` (Jarvis) should run Opus.

### rebuild-memory-md.py Cron — Disabled

Comment said "disabled until Phase 8" but the cron line was NOT commented out. It ran nightly at 22:30 UTC. Commented it out.

### Whisper Transcription Cleanup — 100 Files Removed

Removed leftover audio transcription files (.json/.srt/.tsv/.txt/.vtt) from:
- backmarket workspace (10 file sets)
- marketing workspace (7 file sets)
- qa-plan workspace (8 file sets)

### Shopify Theme — Moved Out of Workspace

`icorrect-shopify-theme/` (10MB) moved from `website` agent workspace to `/home/ricky/builds/icorrect-shopify-theme`.

### Gateway Updated — v2026.2.17 → v2026.2.24

Updated via `sudo npm install -g openclaw@latest`. Required adding `gateway.controlUi.allowedOrigins` (new security requirement in v2026.2.24 for non-loopback bindings).

---

## Updated Deferred to v3

| Issue | Why Deferred |
|-------|-------------|
| Platform injection problem (all bootstrap files unconditional) | Requires OpenClaw architecture changes or bootstrap hook redesign |
| Multi-agent isolation (everything runs as agent:main) | Core rebuild scope — new agent template, workspace structure |
| Sub-agent context strategy | Depends on whether sub-agents become full agents |
| SOP injection mechanism | Defined in 04-agent-architecture-spec.md, build during rebuild |
| Workspace file enforcement (cron cleanup) | Part of v3 template — needs the template first |

**Resolved (no longer deferred):**
- ~~AGENTS.md size (905 tok of group chat etiquette)~~ — Rewritten with Jarvis-specific content (fix #6)
- ~~Memory flush before compaction~~ — Enabled (fix #9)
