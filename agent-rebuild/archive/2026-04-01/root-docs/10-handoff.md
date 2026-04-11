# 10 — Handoff Document

**Date:** 2026-02-26
**Updated:** 2026-02-26 — Aligned with Code/Agent split and simplified approach.
**Purpose:** Complete context for the next Claude Code session to continue the v3 agent rebuild.

---

## What This Project Is

Ricky runs iCorrect, an Apple device repair business in London (8 workstations, ~7 staff). He manages remotely from Bali. He has an 11-agent AI system running on OpenClaw on a Hetzner VPS (46.225.53.159, user: ricky). This is the 3rd iteration of getting the agent system right.

## What Went Wrong (v1 and v2)

- v1: Single agent doing everything. Got confusing. Agent forgot everything between sessions.
- v2: Went from 1 to 11 agents in 6 days. Memory system built 3 times (none reliable). Agents ignore CLI instructions. Sub-agents defined but never worked. Infrastructure built before proving value. Workspaces cluttered.

## The Core Insight

The problem is structural, not engineering. Workspaces are cluttered, data is unstructured, SOPs are unverified (some hallucinated by agents). The solution is the right files in the right folders, not vector search or custom plugins.

## The Approach (Agreed 2026-02-26)

Two roles during the rebuild:

| Who | Does what |
|-----|-----------|
| **Code** (Claude Code, SSH sessions) | Technical work: API docs, config audits, doc index, workspace builds, cron scripts, verification |
| **Research agents** (one at a time, Telegram) | Documentation partners: help Ricky extract process knowledge, critique existing docs, write SOPs |

Key decisions:
- **No Jarvis during rebuild.** Jarvis is rebuilt AFTER domains are documented, as coordinator + technical backbone.
- **No inter-agent communication needed.** Ricky routes between Code and research agents.
- **No cron-based pinging.** Ricky goes to agents when ready.
- **Research agents do NOT search APIs.** Code prepares technical reference material. Agents present it to Ricky for verification.
- **Skills come after SOPs.** Write Skills based on verified SOPs, not before.
- **One agent at a time.** Prove the pattern with BackMarket, then scale.

---

## All Documents

Located at `/home/ricky/builds/agent-rebuild/`:

| Doc | What it contains | Status |
|-----|-----------------|--------|
| 00-why.md | Why v3 is needed. v2 structural debt. | Final |
| 01-lessons-learned.md | 8 specific mistakes from v2 | Final |
| 02-knowledge-map.md | Audit of ~130 docs across 9 domains | Final |
| 03-sequencing.md | Build order with Code/Agent split | Updated 2026-02-26 |
| 04-agent-architecture-spec.md | v3 workspace template, standards, agent roster | Final |
| 05-memory-problem.md | Memory research. Structure beats engineering. | Final |
| 06-jarvis-fixes.md | Quick fixes applied to Jarvis. 66% context reduction. | Final |
| 07-supabase-audit.md | 12 tables audited. Crons pull from source APIs. | Final |
| 08-research-needed.md | Research tasks split by Code vs Agent | Updated 2026-02-26 |
| 09-research-agents.md | Research agent setup, templates, transition plan | Updated 2026-02-26 |
| 10-handoff.md | This document | Updated 2026-02-26 |

---

## What Needs To Happen Next

### Step 1: Code does Phase 0 — Technical Groundwork (~1-2 sessions)

No Ricky needed for this. Code SSHs into VPS and produces:

| Task | Output |
|------|--------|
| Existing doc index | INDEX.md — every doc on VPS, by domain, with duplicates flagged |
| OpenClaw config audit | Current state of openclaw.json documented |
| Cron jobs audit | Inventory of all crons: keep/replace/remove |
| BM workspace inventory | File-by-file: keep, move, delete |
| Ops workspace inventory | Same |
| CS workspace inventory | Same |
| Jarvis workspace gap analysis | Gap list vs v3 template |
| BackMarket API documentation | Real endpoints, real responses, auth, rate limits |
| Xero API documentation | Endpoints, capabilities, current integration state |
| Intercom API/MCP documentation | Tools available, capabilities |
| Token budget analysis | Per-agent context usage |

All outputs go to `/home/ricky/builds/agent-rebuild/technical/`.

### Step 2: Build research-bm

- Ricky creates Telegram group "BM Research" and adds bot
- Code creates workspace with v3 template
- Code loads reference material from Phase 0 outputs
- Code writes SOUL.md, CLAUDE.md, USER.md, research/brief.md
- Code adds to openclaw.json, restarts gateway
- Test message to confirm agent works

### Step 3: Ricky works with research-bm (at his pace)

- Agent presents existing BM docs for verification
- Ricky confirms, corrects, fills gaps
- Agent writes verified SOPs and process maps
- No timeline pressure — Ricky controls the pace

### Step 4: Code verifies outputs

- SOPs match API capabilities?
- Process maps consistent with technical reality?
- Anything hallucinated?

### Step 5: Build production BM agent

- v3 workspace from template
- Verified SOPs in sops/
- Data feed crons built and tested
- Memory-core configured
- Old BM agent retired

### Step 6: Decide next domain

Ricky picks. Same process repeats. Suggested order: Ops, CS, Finance, Marketing, Website, Parts, Jarvis.

---

## Key Technical Context

- **VPS:** Hetzner CPX42, 8 vCPU, 16GB RAM, IP 46.225.53.159, user ricky
- **OpenClaw Gateway:** v2026.2.24, systemd user service, maxConcurrent=6
- **Config:** ~/.openclaw/openclaw.json
- **Shared docs:** ~/.openclaw/shared/ (symlinked into all workspaces, chmod 444)
- **API keys:** /home/ricky/config/api-keys/.env
- **Supabase:** /home/ricky/config/supabase/.env
- **Gateway restart:** `systemctl --user restart openclaw-gateway`

---

## What NOT To Do

- Do NOT rebuild Jarvis yet — comes after domain agents are proven
- Do NOT build Skills before SOPs are verified
- Do NOT modify existing agent workspaces (old agents still running alongside)
- Do NOT edit ~/.openclaw/shared/ without Ricky's approval
- Do NOT restart gateway without warning (takes all agents offline)
- Do NOT build vector search, custom plugins, or auto-injection hooks yet
- Do NOT have research agents search APIs or audit systems
- Do NOT set up cron-based pinging of Ricky from agents
- Do NOT modify /home/ricky/config/api-keys/.env or supabase/.env

---

*Updated: 2026-02-26 — Aligned with Code/Agent split. Simplified roles. One agent at a time.*
