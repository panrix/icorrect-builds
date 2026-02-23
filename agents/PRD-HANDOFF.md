# Mission Control Rebuild — Complete Handoff Document

**Date:** 2026-02-16
**Purpose:** This document captures every decision, architectural choice, correction, and insight from two full-day PRD discussion sessions. Hand this to a fresh Claude conversation to write the complete PRD.
**Context:** Ricky (founder of iCorrect / Panrix Limited) and Claude discussed, debated, and refined the architecture for a complete rebuild of Mission Control — a multi-agent AI system that runs his specialist Apple repair business from Bali while the team operates in London.

---

## PART 1: THE BUSINESS

### What iCorrect Does
- Legal name: Panrix Limited, trading as iCorrect
- Specialist Apple device repair — board-level MacBook logic board work
- "The brain surgeons of device repair" — they repair what Apple says can't be fixed
- Buy, refurbish, and resell through Back Market
- London workshop with 8 workstations, managed remotely from Bali (7-hour timezone gap)

### Key Numbers
| Metric | Current | Target |
|--------|---------|--------|
| Monthly revenue | £52k | £166k (Q4 2026) |
| Annual run rate | £624k | £2M |
| Website conversion | 0.37% | 2% |
| Documented SOPs | 0% | 100% (Q3 2026) |
| Team size | ~7 | 12-14 (end 2026) |
| HMRC debt | £200k | Payment plan by Q2 2026 |

### Revenue Split
- Back Market: ~60% (dominant channel — trade-in, refurb, resell)
- Direct customers: ~30%
- Corporate accounts: ~10%

### Team
- **Ricky** — Founder, remote from Bali, ADHD, ideas person. Coffee mornings are thinking time. Training block is non-negotiable. ADHD is the operating system, not a limitation.
- **Suzy** — MD by title, not operationally active
- **Safan (Saf)** — Lead repair tech, 6 days/week. Fastest repairer. Cherry-picks easy jobs when unmanaged. Queue management is the lever.
- **Mykhailo (Misha)** — Lead refurb tech. High standards. Growing leader. Supervises Andreas.
- **Michael Ferrari** — Client services, remote from Italy. Capable but gets distracted. Needs structured task management.
- **Adil** — Customer service + intake. Two roles in one. ~65% utilised at near 100% chaos. #1 candidate for AI agent support. Personal issues (going through divorce).
- **Andreas** — Refurb tech. Was underperforming, improving under Mykhailo. On 30-day performance window as of Feb 9. C-player with B potential.
- **Roni** — QC + parts + T-Con R&D. Best attention to detail. Hardest worker by hours. Under-supported by systems.

### Key Relationships
- **Ali Greenwood** — Business adviser, weekly KPI reviews
- **Nancy** — China parts supplier, 6-year relationship
- **Back Market** — Primary revenue platform

### Tools & Systems
- Monday.com — Operations backbone (API limitations)
- Intercom — Customer service
- Slack — Internal comms
- Shopify — Website and booking

### Foundation Documents
The project has these uploaded and available:
- COMPANY.md, GOALS.md, PRINCIPLES.md, PROBLEMS.md, RICKY.md, TEAM.md, VISION.md, SOUL.md (Jarvis), MISSION-CONTROL-SETUP.md, vps-setup-handoff.md

All should be read before writing the PRD.

---

## PART 2: THE CURRENT SYSTEM (What Exists Today)

### Architecture
- **VPS:** Hetzner CPX32 — 4 vCPU, 8GB RAM, 80GB SSD at 46.225.53.159
- **Runtime:** OpenClaw Gateway (v2026.2.15 after today's update)
- **Model:** Claude via Max subscription (OAuth token, auto-synced every 5 min)
- **Channels:** Telegram (11 groups) + Slack (Jarvis only)
- **Process manager:** systemd user services
- **Docker:** n8n for workflow automation (largely unused)
- **Monitoring:** Uptime Kuma with Telegram alerts
- **Domains:** n8n.icorrect.co.uk, jarvis.icorrect.co.uk (SSL via Certbot). jarvis subdomain is now disabled (legacy service killed today).

### Critical Correction: Session Architecture
Sessions are PER-AGENT, PER-CHANNEL. They are NOT shared across a single gateway session. Each agent has its own session store at ~/.openclaw/agents/{agent_id}/sessions/. Session keys are namespaced: agent:backmarket:telegram:group:-1003888456344 is completely separate from agent:main:telegram:dm:1611042131. /new in one channel resets only that session. Compaction happens per-session. This was confirmed by Code checking the actual VPS — Claude.ai incorrectly assumed shared sessions.

### What's Actually Wrong (Confirmed by Code)
1. **Memory search was broken** — No embedding API key configured, so QMD semantic search silently failed. Agents fell back to find/grep (filenames only, not content). FIXED TODAY pending embedding key from Ricky.
2. **No autoCapture** — Sessions weren't being automatically persisted. session-memory hook was not enabled. FIXED TODAY — hook enabled at 50 messages.
3. **No cross-agent visibility** — Jarvis couldn't see what other agents were discussing. FIXED TODAY with symlinks to agent-reports/ directory.
4. **MEMORY.md was 40% duplicate** — Duplicated foundation docs that were already loaded. Wasted context window space. FIXED TODAY — cleaned and restructured.
5. **TOOLS.md eating context** — 19KB file consumed 80% of the 24k bootstrap budget, pushing MEMORY.md out. Bootstrap budget increased to 45k. But TOOLS.md should be refactored into an index + detail files (see File System Design Principle below).
6. **MEMORY.md not auto-injected** — It was a recognised workspace file but the bootstrap character budget was too small. Jarvis started every session without his memory loaded. FIXED TODAY.
7. **Legacy jarvis-api service** — Dead PM2 process on port 3456, unauthenticated, exposed via nginx. KILLED TODAY.
8. **No log rotation** — 23MB+ log files. FIXED TODAY with auto-compress at 2 days, delete at 14.
9. **command-logger hook not enabled** — Now enabled alongside session-memory.

### What's NOT Wrong (Previously Assumed Broken)
- autoCapture config option does NOT exist in OpenClaw. This was hallucinated from a tweet by @coinbubblesETH. Code verified it's not in the source code.
- Sessions are NOT shared across agents. They are isolated per-agent, per-channel. The system is better designed than previously assumed.
- The agent named "processes" was incorrectly called "operations" in the brief. Corrected by Code.

### Pre-Phase Fixes Completed Today (2026-02-16)
| Step | Status |
|------|--------|
| Update OpenClaw 2026.2.9 → 2026.2.15 | Done |
| session-memory hook (50 messages) | Done |
| command-logger hook | Done |
| Cross-agent visibility (20 symlinks) | Done |
| Jarvis + all 10 domain agents CLAUDE.md updated | Done |
| memoryFlush verification | Config confirmed, needs embedding key |
| Kill legacy jarvis-api | Done |
| Log rotation | Done |
| MEMORY.md audit and cleanup | Done |
| Bootstrap budget 24k → 45k | Done |

### Still Pending (Needs Ricky's Input)
- Embedding API key (OpenAI, Google, or Voyage — Voyage recommended by OpenClaw as cheapest)
- Agent Activity Log Telegram channel creation
- Embedding key copy to all 11 agents' auth-profiles

---

## PART 3: THE VISION

### What Ricky Wants
An autonomous workflow engine where agents think, collaborate, research, debate, plan, build, and review work — only pulling Ricky in for strategic decisions and sign-offs. Ricky provides vision and direction. Agents do everything in between.

This is NOT a set of passive tools waiting for commands. This is an active system that progresses work autonomously.

### Example Workflow (How It Should Feel)
1. Ricky drops an idea during coffee morning (voice note, Telegram message)
2. Jarvis picks it up, checks Supabase for existing knowledge on the topic
3. Jarvis queries relevant domain agents via agent messages
4. Domain agents respond with what they have, flag gaps
5. Jarvis queues clarification question for morning briefing
6. Ricky responds with current thinking (10-second interaction)
7. Confirmed interpretation becomes the work brief — agents work together
8. Research agent finds external intelligence (new tools, approaches)
9. Agents produce plan document, stored in Supabase as work item
10. QA agent reviews, finds gaps, pushes back, domain agents revise (loops until approved)
11. Jarvis presents approved plan to Ricky with key decisions needed
12. Ricky signs off (with or without changes)
13. Changes incorporated, QA re-reviews
14. Approved plan goes to Code agent, build plan produced
15. Build plan reviewed by separate QA agent for bugs/gaps/edge cases
16. Code builds, each push reviewed by checking agent
17. Ricky gets milestone updates, not every step

### Core Principle: "Overkill Is The Right Way"
Ricky's exact words: "Overkill means that's how we should build it, but we're being lazy and not doing it now." Stop filtering ideas through "is this too much" lens. Build properly from the start to avoid future rebuilds. This parallels iCorrect's multi-checkpoint quality system — excellence through redundancy.

### Core Principle: "And, Not Or"
Don't block business progress waiting for the perfect system. Use the current system for real business tasks NOW while building the rebuild in parallel. Both tracks run simultaneously.

---

## PART 4: THE ARCHITECTURE

### Interaction Model
**Option B was chosen:** Ricky can talk to Jarvis OR domain agents directly. Jarvis always has full visibility via Supabase. Domain agents are specialists who own their domains. Jarvis is C-suite exec (business strategy, coordination, briefings), NOT an agent manager.

### Multi-Model Strategy
Different agents run on different Claude models based on task complexity and cost:
- Jarvis: Opus (complex reasoning, coordination)
- Domain leads: Sonnet (domain expertise, analysis)
- Sub-agents (routine monitoring): Haiku (high volume, low cost)
- QA agents: Sonnet (strong reasoning needed for review)

Model isn't tied to agent — agent is a role, model underneath is configurable and swappable. This requires each agent to be a separate OpenClaw registration with its own model config.

External models (Kimi, Codex, etc.) are TOOLS that agents can invoke, not agents themselves. A generic "external model" tool takes model identifier, prompt, optional context, makes API call, returns response.

### Three Pillars
1. **Git** — Single source of truth for all files (SOUL files, configs, SOPs, scripts). Changes from anywhere sync through Git. Replaces Telegram file transfers.
2. **Supabase** — Persistent structured storage. Agent memory, cross-agent messages, business state, work items, activity logs. The workflow engine.
3. **OpenClaw** — Agent runtime. Each agent is a separate registration with own session, own model config, own workspace.

---

## PART 5: THE AGENT HIERARCHY

### Design Principle
Flat structures don't work because of context window limits. A domain lead can't hold strategic oversight AND deep operational knowledge in one context window. Solution: domain leads hold strategic oversight, sub-agents hold deep domain knowledge in focused contexts.

### Full Org Chart

```
Ricky
└── Jarvis (C-suite — Opus)
    ├── PM (project tracking — Sonnet)
    ├── QA-Plan (strategy/plan review — Sonnet)
    ├── QA-Code (code review — Sonnet or Codex)
    ├── QA-Data (fact verification — Haiku/Sonnet)
    │
    ├── Backmarket (domain lead — Sonnet)
    │   ├── Listings (sub-agent)
    │   ├── Pricing (sub-agent)
    │   ├── Grading (sub-agent)
    │   └── BM-Ops (sub-agent)
    │
    ├── Finance (domain lead — Sonnet)
    │   ├── Cash Flow
    │   ├── HMRC
    │   ├── KPIs
    │   └── Xero
    │
    ├── Operations (domain lead — Sonnet)
    │   ├── Intake
    │   ├── Queue
    │   ├── SOP
    │   └── QC-Process
    │
    ├── Team (domain lead — Sonnet)
    │   ├── Performance
    │   ├── Hiring
    │   └── Morale
    │
    ├── Parts (domain lead — Sonnet)
    │   ├── Stock
    │   ├── Nancy
    │   ├── Forecasting
    │   └── T-Con
    │
    ├── Marketing (domain lead — Sonnet)
    │   ├── Content
    │   ├── AdWords
    │   │   ├── [Keyword Research — spawns when active]
    │   │   ├── [Ad Copy — spawns when active]
    │   │   └── [Reporting — spawns when active]
    │   ├── SEO
    │   └── Brand
    │
    ├── Website (domain lead — Sonnet)
    │   ├── PostHog
    │   ├── Shopify
    │   └── Conversion
    │
    ├── Schedule (calendar, timezone bridge — Haiku)
    │
    ├── Finn (domain lead — Sonnet)
    │   ├── Intercom
    │   └── Escalation
    │
    └── Systems (domain lead — Sonnet)
        ├── VPS
        ├── Services
        └── Deployment
```

### Agent Types
- **Infrastructure agents** (5): Jarvis, PM, QA-Plan, QA-Code, QA-Data — these run the system itself
- **Domain leads** (10): Backmarket, Finance, Operations, Team, Parts, Marketing, Website, Schedule, Finn, Systems — these own business domains
- **Sub-agents** (20+): Pre-configured specialists under domain leads — deep domain knowledge, focused context windows
- **Spawned sub-agents**: Temporary workers for one-off tasks, no SOUL file, no persistent memory, no approval needed

### Sub-Agent Design
Sub-agents are NOT spawned dynamically — they are pre-configured with own SOUL, own memory, own cron jobs. Domain lead manages them, doesn't create them. Spawning is only for genuinely temporary one-off tasks.

Domain leads manage sub-agent communication internally through Supabase, not Telegram. Sub-agents are background workers without Telegram bindings.

### Telegram Structure
Domain Telegram groups stay (one per domain lead). Ricky talks to domain leads. Sub-agents have no Telegram presence — they're background workers. Simplify from current 11 groups to clustered groups around related domains.

---

## PART 6: QA ARCHITECTURE

### Three QA Specialists (Not One Generalist)
Inspired by iCorrect's multi-stage quality control process — different types of work need different types of checking by specialists.

1. **QA-Plan** — Reviews plans, strategies, recommendations for logical soundness, completeness, alignment with business goals. Strong reasoning required (Sonnet/Opus). Evaluates whether thinking is sound.

2. **QA-Code** — Reviews code for bugs, edge cases, security, architecture. Specialized coding model (Codex or best-in-class). Checks every push, every build, every change.

3. **QA-Data** — Fact and data verification. Checks numbers are real, sources exist, facts accurate. Lookups and comparisons, can run on cheaper model.

### Automated Review Loops
ALL work (plans AND code) must be checked by another agent. Nothing ships without a second pair of eyes. The reviewer is NEVER the builder. This is baked into the workflow, not optional.

The loop pattern:
1. Builder produces work
2. QA agent reviews
3. If rejected: feedback goes back to builder with specific issues
4. Builder revises
5. QA re-reviews
6. Loop until approved (or escalate after 3 rejections)

### On-Demand Audit
In addition to automatic review, an /audit command is available when something feels off. Triggers a comprehensive review of a specific area.

---

## PART 7: MEMORY ARCHITECTURE

### Design Principle: "Search, Don't Load"
Agents should know what exists and where to find it, not carry everything in their head. A small index auto-injected at startup, full content loaded on demand via search or read tool. This maximises context window space for actual thinking.

This applies everywhere: tools (index + detail files), SOPs (index + individual procedures), foundation docs (loaded only when relevant), memory (query relevant facts, not everything), agent reports (read specific agent when asked, not all 10).

### Critical Rule
"If you don't know something, search before you answer. Never guess." This is the most important instruction in the entire system. The difference between hallucination and reliability.

### Three-Layer Memory Model
Based on research from Rohit (@rohit4verse) and Robert Pop (@robipop22), both building production agent memory systems:

**Layer 1 — Hot Memory (Session Context)**
What's in the agent's context window right now. Managed by OpenClaw's workspace bootstrap (auto-injected files). Kept lean — indexes and maps, not full documents. The TOOLS.md refactor is an example: 2KB index auto-injected, full docs in tools/ subdirectory read on demand.

**Layer 2 — Warm Memory (Supabase Structured Storage)**
Facts, summaries, activity logs, work items, cross-agent messages. Queryable, timestamped, with conflict resolution. Agents write here continuously. When a new fact contradicts an existing one on the same key, the old one gets archived (not deleted) — full audit trail. This is the primary persistent store.

Tables needed:
- `memory_facts` — Atomic, timestamped, categorised facts with conflict resolution
- `memory_summaries` — Evolving domain summaries that agents maintain and update
- `agent_activity` — Structured log of all significant actions
- `agent_messages` — Cross-agent communication, threaded to work items
- `work_items` — Tasks with stages, assignments, review states, handoff triggers
- `business_state` — KPIs, inventory, queue status (each field owned by one agent)
- `agent_registry` — All agents with parent_agent column defining hierarchy

**Layer 3 — Cold Memory (Audit Trail)**
Full conversation logs in Slack/Telegram channels. Raw transcripts. Never loaded into context but available for tracing decisions back to their source. This is the "trace back the 20% pricing error" capability.

### Memory Maintenance Cron Jobs
- **Nightly:** Consolidate duplicate facts, update summaries, flag stale data
- **Weekly:** Compress old facts into higher-level summaries, archive rarely accessed data
- **Monthly:** Full review of memory health, prune dead entries

### Write Rules
Agents don't write whatever they want to memory. Explicit rules:
1. Extract discrete facts, not raw conversation
2. Categorise every fact
3. Check for conflicts with existing facts before writing
4. Write with explicit timestamps and confidence levels
5. MEMORY.md "is not just for you — it's your report to the coordinator"

### OpenClaw Native Memory (Current System)
- QMD with embeddings for semantic search across local files (needs embedding API key — pending)
- session-memory hook saves sessions on /new (enabled today, 50 messages)
- memoryFlush at 20k tokens saves before compaction
- MEMORY.md auto-injected into bootstrap (fixed today by increasing budget)

### Qdrant (Future Consideration)
Both Robert Pop and @code_rams use Qdrant for vector search in Docker alongside OpenClaw. Provides semantic search across all agent memory. Flag as Phase 2 enhancement, not blocking initial rebuild.

### OpenClaw Hooks for Memory
Based on the hooks documentation at docs.openclaw.ai/automation/hooks:

- **`supabase-memory` hook** — Custom hook replacing bundled session-memory. On command:new, extracts key facts, writes to Supabase memory_facts, updates memory_summaries.
- **`supabase-bootstrap` hook** — On agent:bootstrap, queries Supabase for agent's latest memory summary, injects into context alongside SOUL file.
- **`agent-activity-logger` hook** — On session events, logs to agent_activity table in Supabase.
- **`workflow-trigger` hook** — When agent completes work and writes work item to Supabase, fires webhook to trigger next agent in pipeline.

---

## PART 8: WORKFLOW ENGINE

### Supabase as Workflow Engine
Work items have stages, assignments, review states, handoff triggers. When a work item moves from "draft" to "submitted", it triggers QA agent automatically. Agents can initiate work, not just respond.

### Triggering Agents
Agents only "think" when triggered. Three trigger types:
1. **Message** — User sends a Telegram/Slack message
2. **Cron** — Scheduled jobs (heartbeats, monitoring, maintenance)
3. **Webhook** — Supabase row insert/update fires webhook that triggers next agent

Webhooks via Cloudflare for speed (task handoffs, data verification, review loops — the machinery). Slack/Telegram for visibility and audit trail.

### n8n Decision: REMOVE
Every n8n workflow is just "when this happens, do this." Python scripts do the same thing. Cron triggers on schedule, Supabase Python client reads/writes database, HTTP request triggers agent session.

n8n costs: Docker container running permanently, another service to monitor/maintain, another thing that can break. Replace with Python scripts triggered by cron or Supabase webhooks. Agents write, test, deploy scripts. Everything version controlled in Git.

Simplified: "Supabase fires webhook → Python script triggers agent." One fewer hop, one fewer system.

### Orchestration
PM agent handles workflow orchestration. Workflow logic is pre-designed — when a plan goes to QA, what happens if QA rejects 3x, when research gets pulled in, when user gets asked. Can't be dynamically invented by agents initially. Over time Jarvis could select from a workflow template library.

### User Involvement Points
System explicitly knows when to pull Ricky in:
- **Pull in:** Vision, key decisions, sign-offs, clarification of vague inputs
- **Keep going:** Research, drafting, review loops, code review, maintenance

### Clarification Step
When Jarvis receives a vague direction, before kicking off the workflow, he writes back with his interpretation: "I'm reading this as: [specific brief]. Correct?" Ricky confirms or corrects in 10 seconds. That confirmed interpretation becomes the source input that QA checks against. This prevents the chain from drifting from original intent.

---

## PART 9: AUDIT TRAIL

### Two Components

**The Log (Structured):**
Every handoff, decision, status change gets a one-line entry. Timestamp, agent, action type, brief summary. Stored in `agent_activity` table in Supabase. What PM reads for status tracking. What Ricky scans for a quick picture.

Example:
```
[2026-02-16 09:00] [Jarvis] [task:created] Intake redesign — source: Ricky voice note
[2026-02-16 09:02] [Jarvis → Operations] [handoff] Assigned intake redesign
[2026-02-16 09:15] [Operations] [research] Queried current intake process
[2026-02-16 10:30] [Operations] [deliverable] Intake plan v1 submitted
[2026-02-16 10:50] [QA-Plan] [review:rejected] Missing error handling
[2026-02-16 11:15] [Operations] [revision] Intake plan v2 submitted
[2026-02-16 11:30] [QA-Plan] [review:approved] Intake plan v2 approved
```

**The Conversation (Unstructured):**
Full agent-to-agent back-and-forth in a dedicated Slack channel or Telegram group. Where agents explain reasoning, debate approaches, push back. Not read in real time — exists for debugging and tracing decisions. When something goes wrong, trace exactly where it diverged.

**The relationship:** The log tells you what happened. The conversation tells you why. Both anchored to work item ID in Supabase.

---

## PART 10: RISK MITIGATIONS

### Hallucination Compounding in Chains
**Problem:** Each agent interprets the previous agent's summary. By the 3rd or 4th hop, the output may have drifted from Ricky's original intent. Each hop loses nuance.

**Solve:**
1. **Source anchoring:** Original input (exact words, voice note transcript) attached to work item as `source_input` in Supabase. Every agent in the chain can reference the original, not just the previous agent's interpretation.
2. **QA-Data verification:** At every handoff where facts are passed, QA-Data verifies data is real. Flags unverified assumptions.
3. **Audit trail:** Every handoff logged. If output drifts, trace where it diverged.
4. **Clarification step:** Vague inputs get clarified before work begins (see Workflow Engine section).

**Fundamental flaw acknowledged:** QA can verify facts, logic, and code. It CANNOT verify whether the work matches Ricky's intent if the intent wasn't precisely stated. This is why Ricky stays in the loop at sign-off points with full context.

### Concurrent Agent Conflicts
**Problem:** Two agents working on the same thing simultaneously, producing contradictory results.

**Solve:**
1. **Domain ownership:** Each piece of business data in Supabase has one owner — one agent who writes to it. Others can read, only one can write. Prevents conflicting writes.
2. **Work item locking:** When an agent starts a work item, it claims it in Supabase. Status goes to "in_progress" with agent ID. No other agent can pick up that item.
3. **PM as conflict detector:** PM watches for overlapping work. If two agents touch the same area, PM flags it and coordinates alignment before they finish in different directions.

Supabase schema: `work_items` needs `assigned_to` field and status including "locked." `business_state` needs `owned_by` field.

### Git + Jarvis Write Access Risks
**Problem:** AI agent modifying instructions that other AI agents follow. Bad edit to SOUL file changes agent behaviour unpredictably.

**Solve:**
1. **QA-Plan reviews all config changes.** Any edit to SOUL, CLAUDE.md, or TOOLS.md goes through QA-Plan before commit. Same review loop as any other plan.
2. **Protected files.** QA-Plan's own SOUL file, QA-Code's own SOUL file, QA-Data's own SOUL file — locked from Jarvis write access. Only Ricky can change QA agent definitions. Prevents coordinator weakening the quality gate.
3. **Git is the safety net.** Every change is a commit with a message. Full history preserved. Any autonomous change can be rolled back in seconds.
4. **Change log in Supabase.** Every config change logged to agent_activity with before and after.
5. **Trust earned through competence.** Initially all config changes require Ricky's sign-off. As Jarvis proves good judgment, loosen to only critical files (SOUL, CLAUDE.md) requiring approval.

---

## PART 11: DEPLOYMENT STRATEGY

### Wave 1: The Rebuild (15 Top-Level Agents)
Build all infrastructure agents and domain leads. No sub-agents yet.

Build order (based on dependency):
1. Jarvis
2. PM
3. QA-Data
4. QA-Plan
5. Finance
6. Backmarket
7. Operations
8. Parts
9. Team
10. Marketing
11. Website
12. Finn
13. Schedule
14. Systems
15. QA-Code

Each agent ~2-3 hours focused work with Code. 15 agents across a focused week.

### Wave 2: First Sub-Agents
- Backmarket: Listings, Pricing, Grading
- Finance: Cash Flow, HMRC

### Wave 3: Operations + Parts Sub-Agents
- Operations: Intake, Queue, SOP
- Parts: Stock, Nancy

### Wave 4: Marketing, Website, Finn Sub-Agents
As functions spin up Q2-Q3 2026.

### Wave 5: Deep Sub-Agents
AdWords → Keyword Research, Ad Copy, Reporting (when Google Ads live and generating data).

### Parallel Tracks
- Track A: Use current Jarvis (with today's fixes) for real business tasks NOW
- Track B: Build the rebuild. New system gets built alongside current. No cutover until proven.

---

## PART 12: INFRASTRUCTURE DECISIONS

### Drop n8n
Replace with Python scripts triggered by cron or Supabase webhooks. Everything version controlled in Git. Agents can write, test, deploy scripts. Removes Docker container overhead and one more thing to maintain.

### Keep OpenClaw
OpenClaw is the runtime. Each agent needs its own registration with own model config, own workspace, own session store. The hooks system (hooks documentation at docs.openclaw.ai/automation/hooks) provides the event-driven automation layer.

### Supabase
Central database for everything persistent. Agent memory, messages, work items, business state, activity logs. Agents read from and write to Supabase. This is the backbone.

### Git Repo
Single repository for all files. SOUL files, CLAUDE.md files, foundation docs, scripts, SOPs. Shared between Claude.ai (strategy), Code (building), and agents (reading/writing configs). Solves the alignment problem between Claude.ai and Code — both read from the same source of truth.

### VPS File Structure
Recommend clean start. Current structure is organic growth, not designed. The rebuild should define the exact directory layout and the Git repo mirrors it.

---

## PART 13: FILE SYSTEM DESIGN PRINCIPLE

### "Index + Detail" Pattern
Every large file should be split into a small index (auto-injected into context) and detail files (read on demand).

Example — TOOLS.md:
```
TOOLS.md (auto-injected, ~2KB index)
  → "For full docs, read tools/{tool-name}.md"

tools/
├── monday.md
├── intercom.md
├── telegram.md
├── memory-search.md
└── ... etc
```

This pattern applies to: tools, SOPs, foundation docs, agent reports, memory. Agent's CLAUDE.md becomes the master map — here's who you are, here's what exists, here's where everything lives, here's how to search for it.

### Bootstrap Strategy
Keep auto-injected content lean (~10-15KB total):
- SOUL.md (identity)
- CLAUDE.md (operational rules + master map)
- MEMORY.md (curated learned knowledge)
- Small index files for tools, SOPs, etc.

Everything else loaded on demand via read tool or Supabase query.

---

## PART 14: ERRORS AND CORRECTIONS

### What Claude.ai Got Wrong (Caught by Code)
These errors demonstrate exactly why QA-Data is needed in the architecture:

1. **autoCapture config option** — Does not exist in OpenClaw. Hallucinated from a tweet by @coinbubblesETH. Code checked the actual source code.
2. **Sessions are shared across agents** — Wrong. Sessions are per-agent, per-channel. Completely isolated. Code verified on the actual VPS.
3. **Agent named "operations"** — Actually named "processes" in the current system. Wrong name used in the pre-phase brief.
4. **OpenAI recommended for embeddings** — OpenClaw supports OpenAI, Google, and Voyage. Voyage is the recommended/cheapest option. OpenAI works but may not be the best choice.
5. **Shared context window assumption** — Assumed all agents share one context window. They don't — each agent has its own session store with isolated context.

### Lesson for the PRD
These errors prove the QA pattern works. Every claim about the system should be verified against the actual VPS by Code before the PRD is treated as ground truth. The PRD writer should be explicit about what's verified versus assumed.

---

## PART 15: EXTERNAL RESEARCH INCORPORATED

### Rohit (@rohit4verse) — "How to Build an Agent That Never Forgets"
Key insights incorporated:
- Memory is infrastructure, not a feature
- Three-layer hierarchy: Resources (raw data), Items (atomic facts), Categories (evolving summaries)
- Write path: active memorisation with conflict resolution (new facts overwrite old, not stack alongside)
- Read path: tiered retrieval (summaries first, drill to details if needed)
- Memory must decay — nightly consolidation, weekly summarisation, monthly re-indexing
- Five common mistakes: storing raw conversations, blind embedding usage, no decay, no write rules, treating memory as chat history

### Robert Pop (@robipop22) — Triple-Layer Memory System for OpenClaw
Key insights:
- Runs 14+ agents on OpenClaw (same platform)
- Three layers: SQLite (fast cache), Qdrant (semantic search), PostgreSQL + Apache AGE (knowledge graph)
- openclaw-memory npm package — worth evaluating
- Canonical memory hub pattern — one agent as single source of truth, others query through it
- Cross-agent memory sharing: Agent A learns something, Agent B can recall it

### @code_rams — Production Setup
- Multi-model hierarchy with fallbacks (cheaper primary, Opus/Sonnet fallback)
- QMD + Qdrant for memory stack
- Pre-compaction flush ensures nothing lost before session compress
- Daily session logs synced to both local files AND external system (Notion)

### OpenClaw Hooks Documentation
Hooks are event-driven scripts. Key events:
- command:new — session reset, trigger memory save
- agent:bootstrap — before context loads, control what agent sees
- gateway:startup — system startup, health checks
- Custom hooks go in ~/.openclaw/hooks/ or workspace/hooks/

---

## PART 16: WHAT THE PRD NEEDS TO CONTAIN

The PRD should be structured as an executable document that Code can build against. It should include:

1. **Executive summary** — What Mission Control is, why the rebuild, what changes
2. **Architecture overview** — Three pillars (Git, Supabase, OpenClaw), interaction model, multi-model strategy
3. **Agent hierarchy** — Full org chart with roles, models, and reporting lines
4. **Supabase schema** — Complete table definitions for all tables
5. **Memory architecture** — Three-layer model, bootstrap strategy, write rules, maintenance cron jobs
6. **Workflow engine** — Work item lifecycle, trigger mechanisms, review loops, user involvement points
7. **QA system** — Three QA specialists, review loop patterns, protected files
8. **Audit trail** — Log format, conversation channels, Supabase logging
9. **File system design** — Index + detail pattern, Git repo structure, VPS directory layout
10. **OpenClaw hooks** — Custom hooks to build, event bindings
11. **Risk mitigations** — Hallucination, conflicts, write access (all three solved above)
12. **Deployment waves** — Build order, timeline, parallel tracks
13. **Telegram structure** — Simplified group layout
14. **Cost projections** — VPS, API keys, Supabase, external model costs
15. **What this replaces** — Explicit list of what gets removed (n8n, legacy services, etc.)
16. **Success criteria** — How to know the rebuild is working

### Tone
Direct, specific, no fluff. Every section should be actionable. Code should be able to read a section and know exactly what to build without asking questions. Include exact file paths, exact config structures, exact Supabase SQL.

---

## PART 17: KEY QUOTES AND PRINCIPLES

These are Ricky's exact words/principles that should inform the PRD tone:

- "When something seems like overkill, it's usually the right way to build it properly from the start"
- "Agents earned through use" — specialists emerge from repeated task patterns, not upfront planning
- "Solutions, not problems" — every issue comes with a recommendation
- "Decisions come from data" — no gut feel, no assumptions
- "No hallucinations. No fabrication. Ever." — mistakes with a trail are forgivable, fabrication is not
- "Text > Brain" — if it matters, write it down
- "And, not or" — build in parallel, don't sequence everything

### Ricky's Communication Preferences
- Concise, actionable, no fluff
- Lead with what matters
- Propose, don't ask
- Read his state — good day = push forward, bad day = protect his time
- Daily briefing at 8am Bali (1am UTC)
- ADHD is the operating system — structure enables, chaos destroys

---

## END OF HANDOFF

This document contains every decision, architectural choice, correction, insight, and reference from approximately 16 hours of PRD discussion across two sessions on 2026-02-15 and 2026-02-16. A fresh conversation with this document and the project's foundation files should be able to write the complete PRD without losing any context.
