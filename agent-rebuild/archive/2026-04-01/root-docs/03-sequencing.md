# 03 — Sequencing: What Comes First and Why

**Date:** 2026-02-24
**Updated:** 2026-02-26 — Aligned with Code/Agent split. Added Phase 0. Simplified roles.
**Purpose:** Resolve the priority conflict and define the build order.

---

## The Conflict (unchanged)

Three stakeholders, three different priorities:

| Who | Wants | Why | Blocked By |
|-----|-------|-----|------------|
| Ricky | Intake system | Reduce errors, save team time | Monday board cleanup needed first |
| Team | Inventory system | Daily pain -- stock out of sync | Spec stalled on open questions |
| Business | Revenue | BackMarket = 60% of revenue, agent making mistakes | Agent compliance + SOP accuracy |

All three are valid. None can be done simultaneously.

---

## The Core Principle

**Prove the pattern with one agent before scaling.**

- v2 went from 1 to 11 agents in 6 days. That pace caused most of the problems.
- v3 builds one agent properly, proves it works, then templates it.
- Two roles during the rebuild: Code does technical work, research agents help Ricky document processes.
- No Jarvis during rebuild. No inter-agent communication. Ricky is the router.

---

## Who Does What During the Rebuild

| Who | Does what | How |
|-----|-----------|-----|
| **Code** (Claude Code, SSH sessions) | API docs, config audits, doc index, workspace builds, cron scripts, technical verification | Ricky opens a session, gives tasks, reviews output |
| **Research agents** (one at a time) | Help Ricky extract and structure process knowledge, critique existing docs, write SOPs | Ricky messages via Telegram when ready |
| **Ricky** | Source of truth for business processes. Routes between Code and agents. | Works at his own pace |

Research agents never search APIs or audit systems. Code never interviews Ricky about processes. Each does what they are good at.

---

## The Dependency Chain

```
Code: Technical groundwork        (doc index, API refs, config audit, workspace inventories)
  |
  v
Build research-bm                (first research agent, loaded with Code's technical output)
  |
  v
Ricky + research-bm              (map BM processes, verify SOPs — at Ricky's pace)
  |
  v
Code: Verification gate          (audit agent outputs against source material + API reality)
  |
  v
Code: BM production agent        (v3 workspace, verified SOPs, data feed crons)
  |
  v
Code: Memory-core config         (reindex, hybrid search, extraPaths)
  |
  v
BM agent live test               (1-2 weeks — does structured workspace = reliable agent?)
  |
  v
Repeat for next domain           (Ricky picks — Ops, CS, or Finance)
  |
  v
Rebuild Jarvis                   (coordinator + technical backbone, after domains are proven)
  |
  v
Monday cleanup                   (data quality — clean board before building on it)
  |
  v
Write Skills for production agents  (based on verified SOPs, not before)
  |
  v
Intake system                    (writes to Monday, needs clean board)
  |
  v
Inventory system                 (needs clean Monday + parts data feeds)
```

---

## Phase 0: Code Technical Groundwork

**What:** Code does all technical audits and builds reference material that research agents need. No agents involved. Done in SSH sessions with Ricky.

**Tasks:**

1. **Existing doc index** — Crawl every doc location on the VPS. Build a single index: file, location, domain, last modified, content summary. Identify duplicates. Map what exists per domain.

2. **OpenClaw config audit** — Document current openclaw.json state: memory, plugins, hooks, bootstrap, agent configs.

3. **Cron jobs audit** — Inventory all running crons: job, schedule, what it does, keep/replace/remove.

4. **Workspace inventories** — File-by-file audit of BM, Ops, CS, and Jarvis workspaces. What to keep, move, or delete.

5. **API documentation** — Test real endpoints, record real responses, document actual capabilities:
   - BackMarket API: orders, returns, listings, pricing, seller metrics
   - Xero API: invoices, bank accounts, P&L, cash flow + current integration state
   - Intercom API/MCP: conversations, Finn metrics, response tools

6. **Token budget analysis** — Per-agent context usage. Budget for data/, sops/, memory/.

**Duration:** 1-2 sessions
**Done when:** Every research agent has a package of verified technical material to start from.

---

## Phase 1: Research Agent — BackMarket First

**What:** Build ONE research agent (research-bm) with a clean v3 workspace. Load it with existing BM docs and API reference from Phase 0.

**The agent's job:**
- Present existing documentation to Ricky: "I found this SOP for trade-in processing. Is this still how it works?"
- Ask structured questions to fill gaps
- Write clean, structured documentation after Ricky confirms
- Never invent or guess processes — cite source or flag as unverified

**The agent does NOT:**
- Search APIs or test endpoints (Code already did this)
- Audit the VPS or file system
- Build anything
- Ping Ricky on crons — Ricky goes to the agent when ready

**Duration:** 1-2 weeks (at Ricky's pace)
**Done when:** Ricky is confident the BM domain is fully documented with verified SOPs.

---

## Phase 1.5: Verification Gate

**What:** Code audits the research agent's outputs against source material.

- Are SOPs based on what Ricky confirmed, or hallucinated?
- Are process maps consistent with API capabilities?
- Are there contradictions?

**Duration:** 1 session
**Done when:** SOPs verified by both Ricky (process accuracy) AND Code (technical accuracy).

---

## Phase 2: BM Production Agent Build

**What:** Build the production BackMarket agent using the v3 template.

1. Clean workspace from template (04-agent-architecture-spec.md)
2. Move verified SOPs into sops/ with index.md
3. Build data feed crons: BM API -> structured markdown -> data/ folder
4. Configure memory-core (reindex, extraPaths, hybrid search)
5. Trim SOUL.md (max 40 lines), CLAUDE.md (max 80 lines)

**Duration:** 1-2 sessions
**Done when:** BM agent boots with clean workspace, current data, verified SOPs.

---

## Phase 3: BM Live Test (1-2 weeks)

**What:** Use the BM agent with the new structure. Measure.

- Does it follow SOPs when they are in sops/?
- Does it use current data from data/?
- Does it recall relevant context?
- What is missing?

**Duration:** 1-2 weeks of real usage
**Done when:** Ricky is confident the pattern works.

---

## Phase 4: Next Research Agent

**What:** Pick the next domain (Ricky's choice). Same process:

1. Code prepares technical material
2. Build research agent with v3 workspace
3. Ricky works with agent to document domain
4. Code verifies outputs
5. Build production agent

**Repeat for each domain.** One at a time.

---

## Phase 5: Rebuild Jarvis

**What:** After domain agents are proven, rebuild Jarvis as:
- Coordinator between domain agents
- Technical backbone (config, crons, health monitoring)
- Daily briefings and cross-domain routing
- The role that Code fills during rebuild, Jarvis fills permanently after

**Why last:** Jarvis needs to know what the domain agents do. That only exists after they are built.

---

## Phase 6: Skills

**What:** Write Skills for production agents based on verified SOPs.

SOPs document the process. Skills make the process executable. Writing Skills before SOPs are verified means encoding hallucinated processes.

**Order:** SOP verified -> Skill written -> Skill tested -> Skill deployed.

---

## Phase 7+: Monday Cleanup, Intake, Inventory

Only after agent foundation is solid:
- Monday board cleanup (blocks intake and inventory)
- Intake system build (writes to Monday)
- Inventory system (needs clean Monday + parts data feeds)

---

*Updated: 2026-02-26 — Restructured around Code/Agent split. Added Phase 0 (Code groundwork), Phase 1.5 (verification gate), Phase 5 (Jarvis rebuild), Phase 6 (Skills after SOPs). Removed cron-based agent pinging. One agent at a time.*
