# 08 — Research Needed

**Date:** 2026-02-25
**Updated:** 2026-02-26 — Split into Code tasks vs Agent tasks. Agents do not do technical research.
**Purpose:** Complete list of research to do before building. Clearly split between what Code does (technical) and what research agents do with Ricky (process/SOP).

---

## The Split

| Who | What they research | How |
|-----|-------------------|-----|
| **Code** | APIs, configs, file systems, existing docs, technical capabilities | SSH into VPS, test endpoints, read files, build reference docs |
| **Research agents** | Business processes, SOPs, workflows, domain knowledge | Conversation with Ricky in Telegram |
| **Ricky** | Confirms, corrects, fills gaps | Talks to research agents when ready |

**Research agents never search APIs or audit file systems.** They get pre-built technical reference material from Code. Their job is to help Ricky extract and structure process knowledge.

---

## Part A: Code Does This (Technical -- No Ricky Needed)

### Batch 1: VPS Audits (can run in parallel, ~3 hours total)

| ID | Task | Output | Effort |
|----|------|--------|--------|
| R-A0 | **Existing doc index** -- crawl all doc locations, build master index per domain, flag duplicates | INDEX.md with file, location, domain, status | 1 hour |
| R-A1 | OpenClaw config audit -- document current openclaw.json state | Config reference doc | 30 min |
| R-A2 | Existing cron jobs audit -- inventory all running crons | Cron inventory: keep/replace/remove | 30 min |
| R-B1 | BM workspace inventory -- file-by-file: keep, move, delete | Workspace audit doc | 30 min |
| R-C1 | Operations workspace inventory | Workspace audit doc | 30 min |
| R-D1 | CS workspace inventory | Workspace audit doc | 30 min |
| R-E1 | Jarvis workspace gap analysis (after 06-jarvis-fixes.md) | Gap list vs v3 template | 30 min |
| R-A6 | Token budget analysis -- per-agent context usage | Token budget per agent | 30 min |

### Batch 2: API Documentation (sequential, ~3-4 hours total)

| ID | Task | Output | Effort |
|----|------|--------|--------|
| R-B4 | BackMarket API -- test every endpoint, record real responses, document auth/rate limits | BM API reference doc | 1-2 hours |
| R-C5 | Xero API capabilities -- endpoints for invoices, bank, P&L, cash flow | Xero API reference doc | 1 hour |
| R-C6 | Xero current integration state -- what is connected, what scripts exist | Integration state doc | 30 min |
| R-D4 | Intercom MCP/API capabilities -- test tools, document what is available | Intercom capability matrix | 1 hour |

### Batch 3: Doc Templates (after Batch 1, ~30 min)

| ID | Task | Output | Effort |
|----|------|--------|--------|
| R-A5 | Finalise doc structure templates -- SOP format, data feed format, decision log format, sops/index.md, SOUL.md, CLAUDE.md, memory naming | Template files ready to copy | 30 min |

**Total Code effort: ~7-8 hours across 1-2 sessions.**

All outputs go to `/home/ricky/builds/agent-rebuild/technical/` -- one subfolder per domain. These become the reference material loaded into research agent workspaces.

---

## Part B: Research Agents Do This (With Ricky)

These are conversations between Ricky and his research agents. The agent presents existing docs (from Code's index + technical material), asks structured questions, and writes up verified SOPs and process maps.

**The agent's approach for each item:**
1. "Here is what I found in existing docs. Is this still accurate?"
2. "What is missing or wrong?"
3. "Let me ask specific questions to fill the gaps."
4. "Here is the updated version. Confirm or correct."

**Important:** Ricky goes to the agent when ready. No cron-based pinging. The agent waits.

### BackMarket (research-bm) -- FIRST

| ID | Task | What the agent does |
|----|------|-------------------|
| R-B2 | BM process map -- all workflows | Present existing BM docs, ask Ricky to walk through each workflow, write structured process map |
| R-B3 | BM SOP verification | Present each of the 7 existing SOPs one at a time, ask "is this still how it works?", correct and fill gaps |
| R-B5 | BM data in Monday | Ask Ricky how BM orders appear in Monday, which columns, status values |
| R-B6 | What data does BM agent need? | Ask Ricky what he actually asks this agent, what data is always missing |

### Operations (research-ops) -- AFTER BM PROVES THE PATTERN

| ID | Task | What the agent does |
|----|------|-------------------|
| R-C2 | Operations process map | Present existing ops docs, map repair journey with Ricky, team roles, daily workflows |
| R-C3 | Operations SOP verification | Present existing ops SOPs, verify with Ricky |
| R-C4 | Monday board for repairs | Ask Ricky how repair queue works in Monday |
| R-C7 | Team management data | Ask Ricky where team data lives, how schedules/performance are tracked |
| R-C8 | What data does Ops agent need? | Ask Ricky what he asks this agent, what is missing |

### Customer Service (research-cs)

| ID | Task | What the agent does |
|----|------|-------------------|
| R-D2 | CS process map | Map all customer touchpoints and flows with Ricky |
| R-D3 | CS SOP verification | Verify existing CS SOPs with Ricky |
| R-D5 | Finn AI configuration | Ask Ricky about Finn setup, what it handles, escalation triggers |
| R-D6 | What data does CS agent need? | Ask what Ricky asks this agent, what is missing |

### Finance (research-finance)

| ID | Task | What the agent does |
|----|------|-------------------|
| R-F1 | Money flow map | Ask Ricky where revenue comes from, where costs go, what margins look like |
| R-F2 | Invoicing and payment workflow | Map invoicing process with Ricky |
| R-F3 | Tax/HMRC obligations | Document filing schedule, compliance requirements with Ricky |
| R-F4 | Cash flow monitoring | Ask Ricky what a useful cash position report looks like |

### Marketing (research-marketing)

| ID | Task | What the agent does |
|----|------|-------------------|
| R-M1 | Market knowledge extraction | Interview Ricky: customers, competitors, positioning, what has been tried |
| R-M2 | Channel strategy | Map all potential marketing channels with Ricky |
| R-M3 | Online presence audit | Review current presence with Ricky, identify gaps |

### Website (research-website)

| ID | Task | What the agent does |
|----|------|-------------------|
| R-W1 | Website audit | Walk through current Shopify site with Ricky, document issues |
| R-W2 | Analytics review | Review available data with Ricky, identify what is tracked vs not |
| R-W3 | Booking flow mapping | Map customer journey from landing to booking with Ricky |

### Parts (research-parts)

| ID | Task | What the agent does |
|----|------|-------------------|
| R-P1 | Current parts management | Ask Ricky how stock is tracked today, what systems are used |
| R-P2 | Parts lifecycle | Map order -> receive -> stock -> allocate -> use -> reorder with Ricky |
| R-P3 | Supplier relationships | Document who supplies what, lead times, pricing with Ricky |

### Jarvis (research-jarvis -- starts AFTER domain agents have findings)

| ID | Task | What the agent does |
|----|------|-------------------|
| R-E2 | Jarvis role definition | Ask Ricky what he wants from Jarvis -- briefings, routing, escalation |
| R-E3 | Jarvis SOPs | Draft coordination SOPs, verify with Ricky |
| R-E4 | What data does Jarvis need? | Ask what Ricky asks Jarvis, what is missing |
| R-J1 | Cross-domain handoff map | After reading other agents' findings, map where workflows cross boundaries |

---

## Part C: Blocked (Waiting on Other Work)

| Item | Blocked by |
|------|-----------|
| R-B5 (BM in Monday) | R-A3 (Monday audit -- separate build, in progress) |
| R-C4 (Repairs in Monday) | R-A3 |
| R-J1 (Cross-domain handoffs) | R-B2, R-C2, R-D2 (all process maps) |

---

## Suggested Order

### Step 1: Code does Batch 1 + 2 (~1-2 sessions)
All technical audits + API documentation. No Ricky needed. Produces reference material.

### Step 2: Build research-bm with technical material loaded
First research agent. BM is 60% of revenue. Best documented domain. Most urgent.

### Step 3: Ricky works with research-bm (at his pace)
Maps processes, verifies SOPs, fills gaps. Agent writes everything up.

### Step 4: Code verifies research-bm outputs
Technical accuracy check. SOPs consistent with API capabilities?

### Step 5: Build production BM agent from verified material
v3 workspace, verified SOPs, data feed crons, memory-core config.

### Step 6: Decide next agent
Ricky picks the next domain. Same process repeats.

---

*Updated: 2026-02-26 -- Split Code vs Agent tasks. Removed API research from agent scope. Added doc index task. Agents are documentation partners, not technical researchers. One agent at a time, prove then scale.*
