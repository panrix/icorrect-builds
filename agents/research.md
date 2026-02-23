# Research — Agent System Rebuild

**Compiled by:** Jarvis (having read every file in builds/agents/)
**Date:** 23 February 2026
**Source:** 21+ documents, conversation context with Ricky, current VPS state
**Purpose:** Complete, honest picture of where we are, where we're going, and what's in the way. This is the foundation document for the plan.

---

## 1. VISION

Ricky wants five things, layered on top of each other:

**Layer 1 — Delegation Chain (Coordination)**
Ricky talks to Jarvis. Jarvis coordinates domain leads. Domain leads delegate to specialist sub-agents. Work flows back up the chain. Ricky spends minutes, not hours.

**Layer 2 — SOPs (Operational Knowledge)**
Agents build standard operating procedures for every aspect of the business, then continuously review and improve them in a feedback loop. Living documents, not static files.

**Layer 3 — Data Collection (Intelligence)**
Data agents pull from Monday, Xero, Shopify, Back Market, Intercom, Slack, phone CDR → store in Supabase → structured, queryable, persistent. Every business event captured.

**Layer 4 — Analysis (Insight)**
Agents analyse data against KPIs per team member, per channel, per process. Spotting bottlenecks, underperformance, trends, hiring needs — automatically, not on request.

**Layer 5 — Feedback Loop (Intelligence → Action)**
Analysis feeds back into SOPs, team management, hiring decisions, process changes. The system gets smarter over time. "Are we doing better or worse than we think?"

In Ricky's own words (from PRD-HANDOFF.md):

> "This is NOT a set of passive tools waiting for commands. This is an active system that progresses work autonomously."

The concrete workflow:
1. Ricky drops an idea during coffee (voice note, Telegram)
2. Jarvis picks it up, checks Supabase, queries domain agents
3. Agents produce plan, QA reviews, loops until approved
4. Ricky signs off (10-second interaction)
5. Code builds, QA reviews each push
6. Ricky gets milestone updates, not every step

### End-State Architecture
- **15 top-level agents** (1 coordinator + 5 infrastructure + 10 domain leads)
- **~20 sub-agents** (pre-configured specialists, no Telegram presence)
- **Multi-model:** Opus (Jarvis), Sonnet (domain leads + QA), cheap models for sub-agents (Kimi 2.5, Grok, or Haiku)
- **Three pillars:** Git (source of truth for files), Supabase (persistent structured storage), OpenClaw (agent runtime)
- **Automated workflows:** cron + webhook + message triggers, QA review loops, dependency checks
- **10-layer data architecture:** repair journey, customer experience, team performance, financial health, operations, parts, sales & marketing, quality, competitive intelligence, strategic & predictive

### Target Numbers
| Metric | Current | Target |
|--------|---------|--------|
| Monthly revenue | £52k | £166k (Q4 2026) |
| Documented SOPs | 0% | 100% (Q3 2026) |
| Team size | ~7 | 12-14 (end 2026) |
| HMRC debt | £200k | Payment plan by Q2 |
| Website conversion | 0.37% | 2% |
| Ricky's daily involvement | Hours | Briefing review + strategic decisions |

---

## 2. WHAT EXISTS TODAY

### Infrastructure — Solid Foundation

| Component | Status | Evidence |
|-----------|--------|---------|
| Hetzner VPS (CPX42, 8 vCPU, 16GB) | ✅ Running | Active since Feb 20, 3GB mem |
| OpenClaw Gateway v2026.2.17 | ✅ Running | systemd user service, 435 tasks processed |
| Supabase (9 tables, pg_net triggers) | ✅ Running | Data flowing, webhooks firing, 333+ memory facts |
| Agent Trigger (FastAPI, port 8002) | ✅ Running | Webhook pipeline live, <500ms round-trip |
| Mission Control dashboard | ✅ Live | mc.icorrect.co.uk — React, 5 tabs, Supabase Realtime |
| Memory bridge | ✅ Working | Agent markdown → Supabase every 5m. 333+ facts across 6 agents |
| QA trigger pipeline | ✅ Production-ready | 10/10 steps complete, master audit: PASS |
| Git repos (10 agent workspaces) | ✅ Initialised | GitHub org, pre-commit hooks blocking direct main commits |
| Health check + reconciliation crons | ✅ Running | Every 15m and 5m respectively |
| Morning briefing cron | ✅ Working | 1am UTC = 9am Bali |
| Nightly janitor + Supabase backup | ✅ Running | 10pm + 11pm UTC |
| 4 custom OpenClaw hooks | ✅ Deployed | supabase-bootstrap, dependency-check, supabase-memory, agent-activity-logger |

**Bottom line:** The infrastructure is real. Phases 1-8 and 11-12 of the 12-phase build plan are complete. This took two intense weeks. The foundation is built.

### Agents — What's Actually Running

14 entries in openclaw.json. Honest activity assessment:

| Agent | Model (Actual) | Activity (Feb) | Notes |
|-------|---------------|----------------|-------|
| **main (Jarvis)** | Opus 4.6 | 🟢 Very active (14 memory files) | Ricky's primary interface. Works well. |
| **systems** | Sonnet 4.6 ⚠️ | 🟢 Active (8 files) | **Should be Haiku** — misconfigured |
| **backmarket** | Sonnet 4.6 | 🟢 Active (5 files) | BM operations. Working. |
| **website** | Opus 4.6 ⚠️ | 🟡 Moderate (4 files) | **Should be Sonnet** — inherits wrong default |
| **team** | Opus 4.6 ⚠️ | 🟡 Moderate (4 files) | **Should be Sonnet** — to be retired into ops-team |
| **customer-service** | Sonnet 4.6 | 🟡 Low (2 files) | Replaced Finn. |
| **operations** | Sonnet 4.6 | 🟡 Low (2 files) | Absorbed finance. |
| **marketing** | Sonnet 4.6 | 🟡 Low (2 files) | |
| **parts** | Opus 4.6 ⚠️ | 🔴 Minimal (1 file) | **Should be Sonnet** — to be retired into ops-parts |
| **slack-jarvis** | Sonnet 4.6 | 🔴 Minimal (1 file) | channel_not_found errors |
| **pm** | Sonnet 4.6 | ⚫ Disabled | QA trigger replaced its QA orchestration role |
| **qa-code** | Sonnet 4.6 | ⚫ Dormant | Awaiting real work items |
| **qa-data** | Sonnet 4.6 | ⚫ Dormant | Awaiting real work items |
| **qa-plan** | Sonnet 4.6 | ⚫ Dormant | Was spamming from stuck test items |

**3 transitional v1 agents** (team, parts, website) still running but scheduled for retirement once sub-agents replace them.

**4 model configs are wrong.** team/website/parts inherit Opus (no model override set, no defaultModel in gateway config). Systems on Sonnet but should be Haiku. This burns ~4x more tokens than needed on 3 agents. This is a 5-minute config fix.

### Sub-Agents — Files Only, Not Running

18 sub-agents have SOUL.md + CLAUDE.md written and committed to Git at `/home/ricky/mission-control-v2/agents/`. **Zero are registered in OpenClaw.** The domain leads reference them in their SOUL files but have no mechanism to spawn or communicate with them.

| Domain | Sub-Agents (on paper) |
|--------|----------------------|
| Operations | ops-team, ops-parts, ops-intake, ops-queue, ops-sop, ops-qc |
| Backmarket | bm-listings, bm-pricing, bm-grading, bm-ops |
| Finance (reparented to ops) | fin-cashflow, fin-kpis |
| Customer Service | cs-intercom, cs-escalation |
| Marketing | mkt-website, mkt-content, mkt-seo, mkt-adwords (dormant) |

### What's Broken

| Issue | Severity | Detail |
|-------|----------|--------|
| **Inter-agent messaging** | 🔴 CRITICAL | Shared bot token → bot ignores own messages → Jarvis can't delegate to any agent. The entire hierarchy is non-functional. |
| **agent_messages no consumer** | 🔴 CRITICAL | Supabase table exists, agents write to it, nothing reads it. Health check spams about unread messages every 5 minutes. |
| **4 model configs wrong** | 🟡 HIGH | team/website/parts on Opus, Systems on Sonnet. Token waste. |
| **4 broken crons** | 🟡 HIGH | BM QC Watch + 3 SEO rank scans all in `error` state — delivery target missing. |
| **QA test items spam** | 🟡 MEDIUM | No `is_test` flag, no circuit breaker, approved items don't auto-complete. Jarvis manually cleared Supabase 5x in one day. |
| **Slack-jarvis errors** | 🟡 MEDIUM | channel_not_found when reading Ferrari's DM. |
| **Orphan directories** | 🟢 LOW | finn, processes, finance-archived, schedule-archived on disk but not in config. |
| **Root CLAUDE.md outdated** | 🟢 LOW | References 11 agents, old names, old state. Code reads this first every session. |

### What Ricky Kept Hitting

From our conversation today and the pattern across the build docs:

1. **"I keep talking to the wrong agent"** — No delegation chain means Ricky manually routes everything. He knows what he wants to say to ops-team about SOPs, but has to talk to Operations about everything, context-switching mid-conversation.

2. **"I keep one-shotting 8-phase projects"** — Excitement → skip research → skip plan → build → gaps → rebuild. The research → plan → build workflow didn't exist as a discipline.

3. **"Context gets lost between agents"** — Each agent has isolated sessions. Information Ricky tells Jarvis doesn't reach Operations unless Ricky manually relays it. Supabase is meant to bridge this, but the consumer is broken.

---

## 3. WHAT'S BEEN TRIED AND LEARNED

### The Build Journey (10–22 Feb)

**Week 1 (10-16 Feb): Discovery + Foundation**
- Two full-day PRD sessions — every architecture decision captured in PRD-HANDOFF.md (17 parts)
- Code confirmed actual VPS state, catching 5 hallucinations from Claude.ai:
  - `autoCapture` config (doesn't exist — hallucinated from a tweet)
  - Sessions shared across agents (they're isolated)
  - Agent named "operations" (was actually "processes")
  - OpenAI recommended for embeddings (Voyage is cheapest)
  - Shared context window (each agent has its own)
- Pre-phase fixes: session-memory hook, command-logger, cross-agent visibility, MEMORY.md cleanup, bootstrap budget 24k→45k, killed legacy jarvis-api
- **Lesson:** Every claim about the system must be verified against the actual VPS.

**Week 2 (17-19 Feb): Rapid Build**
- Phases 1-12 built in ~5 days (two intense sessions)
- Supabase schema, wrappers, health check, webhooks, hooks, agent definitions, registration, model migration, dashboard
- Finance merged into Operations (FINANCE-MERGE.md — 3 commits, 16 files)
- **Token cost incident:** Single 24-hour session burned 32% of weekly limits + £21.60 extra. Root causes: all work on Opus, 7,383 CDR rows processed by LLM, growing context window, sub-agents spawning freely.
- **Lesson:** Opus for thinking, scripts for data. Never process raw data through the LLM.

**Week 2 (20-22 Feb): QA + Audit**
- QA trigger pipeline built (10 steps) — git hooks → Supabase → webhook → QA spawn
- Master audit: PRODUCTION READY after 3 deployment fixes
- **QA test spam incident:** Test items broadcast to all agent groups. Retry loops every 5 minutes. Jarvis manually cleared Supabase 5 times in one day.
- System health audit conducted — revealed gap between docs and reality
- **Lesson:** Test isolation is mandatory. Docs diverge from reality within days.

**Week 2 (22-23 Feb): Consolidation**
- Builds directory created (INDEX.md as single entry point)
- All fragmented docs consolidated into one location
- System health audit plan written (ground truth against VPS)
- Handoff protocol established (ops vs build boundary)
- **Lesson:** Building fast without documenting creates a system nobody understands.

### Mistakes Made

1. **Building before researching.** Multi-phase projects kicked off without a research phase. Led to rebuilding and context loss.
2. **Docs treated as one-time artifacts.** Written during build, never updated after. Reality diverged within days.
3. **No test isolation.** QA pipeline test items used production notification paths. Spam.
4. **Token cost not tracked proactively.** Burned through limits before noticing.
5. **Inter-agent comms assumed to work.** Built an entire hierarchy assuming agents could talk to each other. They can't.

---

## 4. THE GAP

### Critical Path Gaps (Must Fix — Everything Else Depends On These)

**Gap 1: Inter-Agent Communication**
Agents cannot message each other via Telegram. Shared bot token means bot ignores own messages. Three proposed solutions: (a) session-aware bot message routing, (b) cross-agent `sessions_send`, (c) Supabase `agent_messages` consumer. Until this is fixed, the entire delegation chain is theoretical. This is the single highest-priority item in the system.

**Gap 2: Sub-Agent Registration**
18 sub-agents are files, not running agents. Domain leads reference them but can't spawn them. The multi-model cost-saving strategy (cheap models for sub-agents) isn't active. Blocked by Gap 1 — no point registering agents that can't communicate.

### Important Gaps (Fix Soon — Burning Tokens or Creating Spam)

**Gap 3: Model Misconfiguration**
4 agents on wrong models. 5-minute config fix + restart. Saving ~4x tokens on 3 agents immediately.

**Gap 4: Broken Crons**
4 OpenClaw crons in error state. Need triage — are the underlying scripts functional or stubs? Fix delivery targets or disable.

**Gap 5: QA Test Isolation**
No `is_test` flag, no circuit breaker, approved items don't auto-complete. Supabase migration + agent-trigger.py changes.

### Architecture Gaps (Plan + Build)

**Gap 6: Data Lake / ETL Pipeline**
The 10-layer data architecture (data-architecture-brief.md) is entirely unbuilt. No ETL from Monday.com, Xero, Intercom, CDR. Agents can't make data-driven decisions without manual data uploads. This is a multi-week build project.

**Gap 7: SOP Framework**
0% documented SOPs. No framework for agents to create, review, or iterate on them. Target: 100% by Q3 2026. Needs both the delegation chain (Gap 1) and a defined SOP creation workflow.

**Gap 8: Root CLAUDE.md**
`/home/ricky/CLAUDE.md` references old state. Code reads this first. Outdated info leads to wrong assumptions. Needs full rewrite to reflect current architecture, the research → plan → build workflow, and the handoff protocol.

### Deferred Gaps

**Gap 9: Agent Consolidation (16→8)**
Overlap between customer-service/finn, operations/processes/team, marketing/website. The health audit recommends deferring this until sub-agents are running. Makes sense — fix delegation first, then consolidate.

**Gap 10: V1 Agent Retirement**
team, parts, website still running alongside v2 replacements. Retire after their sub-agent replacements (ops-team, ops-parts, mkt-website) are active and proven.

**Gap 11: n8n Removal**
Docker container still running. Replacement scripts are running. Needs Ricky's explicit approval + 1 week proven.

**Gap 12: Security**
mc.icorrect.co.uk has open Supabase RLS + exposed anon key (mitigated by Nginx basic auth). mi.icorrect.co.uk has documented SQL injection. Not urgent but on the list.

---

## 5. KEY DECISIONS NEEDED

### 1. Sub-Agent Model Selection
**Options:** Kimi 2.5 via NVIDIA ($0.07/$0.28 per M tokens), Grok 4.1 Fast ($0.20/$0.50), Haiku ($0.80/$4.00)
**Context:** Ricky explored Grok API pricing yesterday — interested in X search capability ($0.005/search). Kimi 2.5 was in the original health audit plan.
**Recommendation:** Test both Kimi and Grok on pilot sub-agents. Compare quality and cost over a week.
**Decision needed from Ricky:** Sign up for Grok API? Kimi API? Both?

### 2. Inter-Agent Comms Approach
**Options:** (a) Bot self-message routing with session awareness, (b) Expand `sessions_send`, (c) Supabase `agent_messages` consumer/poller
**Context:** This is a Code-level fix. Each option has different complexity and reliability.
**Decision needed from Ricky:** None — this is a technical implementation decision for Code. But Ricky should know which approach Code chooses so he can validate.

### 3. PM Agent: Retire or Revive?
**Context:** PM is disabled. QA trigger replaced its QA orchestration. PRD envisioned PM as workflow state machine (5-min sweep, conflict detection, daily summary). Those functions now exist as standalone crons.
**Recommendation:** Keep disabled. The crons do the job. Revive only if we find a gap the crons don't cover.

### 4. CLAUDE.md Rewrite
**Context:** Ricky now wants a research → plan → build workflow enforced for all builds. The root CLAUDE.md should encode this.
**Decision needed from Ricky:** Approve the rewrite once drafted.

### 5. Brave Search API
**Context:** Web search from the VPS is blocked (Google, X). Brave API free tier gives 2,000 searches/month.
**Recommendation:** Set up. 2-minute task with high utility.
**Decision needed from Ricky:** Sign up at brave.com/search/api.

---

## 6. RISKS AND CONCERNS

### Pace vs Stability
Two intense weeks produced a lot of infrastructure. Fast builds create gaps between docs and reality. The health audit was specifically written because "Ricky has lost visibility into his 14-agent system." The new discipline (research → plan → build) addresses this.

### Context Fragmentation
14 agents across isolated sessions. Information Ricky tells Jarvis doesn't reach Operations. Supabase memory bridge partially solves this (333+ facts), but the agent_messages consumer gap means real-time coordination is broken.

### Token Cost
One heavy session burned 32% of weekly limits. Model misconfiguration (3 agents on Opus) makes it worse. Sub-agents on cheap models (Kimi/Grok) will help, but only after they're registered.

### Hallucination Compounding
Each agent interprets the previous agent's summary. By hop 3, output may drift from intent. Mitigations exist (source anchoring, QA-Data verification), but QA-Data is dormant and the delegation chain isn't working yet to test this.

### Single VPS
Everything runs on one Hetzner box. If it goes down, all agents, webhooks, crons, and dashboard go with it. Supabase is external, so data survives. No failover plan.

### Complexity Surface Area
14 OpenClaw agents, 9 Supabase tables, 4 custom hooks, 6+ cron jobs, FastAPI service, systemd services, Nginx configs, 10 git repos, React dashboard. Each is a failure surface. The 5-minute reconciliation spam is a symptom.

### Ricky's Frustration Pattern
Ricky describes getting excited, jumping into builds, one-shotting 8-phase projects, then finding the system doesn't work as expected. The research → plan → build discipline directly addresses this. But it requires patience — research takes time, and the urge to "just build it" will return.

---

## 7. PRINCIPLES (NON-NEGOTIABLE)

From PRD-HANDOFF.md and Ricky's stated preferences:

**"Overkill Is The Right Way"**
Build properly from the start. Redundant quality checks are not waste. Multi-checkpoint system — excellence through redundancy.

**"And, Not Or"**
Don't block business progress waiting for the perfect system. Use current system NOW while building the rebuild in parallel.

**"Search, Don't Load"**
Small index auto-injected, full content on demand. Agents know WHERE things are, not carry everything in context.

**"Never Guess"**
> "The most important instruction in the entire system."
No hallucinations. No fabrication. Mistakes with a trail are forgivable. Fabrication is not.

**"Text > Brain"**
If it matters, write it to a file. Mental notes don't survive sessions.

**"Solutions, Not Problems"**
Every issue comes with a recommendation.

**"Decisions Come From Data"**
No gut feel, no assumptions. Build systems that surface real numbers.

**"Research → Plan → Build"** *(new, as of 23 Feb)*
Every build project gets a research.md first. Then a plan. Then phased build with QA. No more one-shotting multi-phase projects.

### QA Non-Negotiables
- All work checked by another agent. Reviewer ≠ builder.
- QA SOUL files locked from Jarvis — only Ricky changes them.
- 3-rejection limit → escalate to Ricky.
- Agents refuse to operate in degraded state.

### Ricky's Operating Context
- ADHD is the operating system — structure enables, chaos destroys
- Concise, actionable, no fluff
- Propose, don't ask — lead with recommendations
- Daily briefing at 8am Bali (1am UTC)
- Coffee mornings are thinking time
- Currently in Bali (GMT+8), team in London (GMT)

### Handoff Protocol *(new, as of 23 Feb)*
- Agents handle ops (config, crons, monitoring, maintenance, debugging existing systems)
- Code handles builds (new features, new systems, architecture, heavy refactors)
- Jarvis coordinates. Ricky approves strategic decisions.
- Full protocol at `/home/ricky/builds/HANDOFF-PROTOCOL.md`

---

## 8. DOCUMENTATION STRATEGY

### The Problem
Agents wake up with identity and rules but zero business context. Operations doesn't know Monday board columns. Backmarket doesn't have grading criteria. Nobody has SOPs. Every conversation starts from scratch because domain knowledge isn't persisted as accessible files.

### Three-Layer Context Model

| Layer | What | Loaded When | Cost |
|-------|------|-------------|------|
| **Supabase facts** | Key decisions, numbers, status snapshots | Auto-injected at bootstrap | ~1KB per agent |
| **CLAUDE.md index** | Map of where detailed docs live (file paths, one-line descriptions) | Auto-loaded at bootstrap | ~10-20 lines per agent |
| **Git documentation files** | Full analyses, SOPs, schemas, board mappings, KPI breakdowns | Read on demand when agent needs depth | Zero until accessed |

This is the **"Search, Don't Load"** principle from the PRD — designed but not yet implemented for business documentation.

### Documentation Sources

1. **Claude.ai exports** — Ricky has months of documented context across 10 domains in Claude.ai conversations. Claude.ai is building export documents now. These are 50-80% of what we need but will contain outdated information.
2. **Live API pulls** — Monday board schemas, Xero chart of accounts, Intercom help centre, PostHog dashboards. I verify Claude.ai's docs against actual system state.
3. **Ricky's knowledge** — How the team actually works vs how it was designed. Customer flow nuances. Ferrari's real decision patterns. This comes from me questioning Ricky during review.

### Storage Location

```
builds/documentation/
├── monday/
│   ├── board-schema.md          (full column/group/status mapping)
│   ├── customer-flows.md        (walk-in, mail-in, corporate, BM paths)
│   └── automations.md           (what runs, what's broken)
├── sops/
│   ├── walk-in-drop-off.md
│   ├── shipping-dispatch.md
│   ├── diagnostics.md
│   └── qc-workflow.md
├── backmarket/
│   ├── trade-in-sop.md
│   ├── grading-criteria.md
│   └── bm-board-schema.md
├── finance/
│   ├── xero-structure.md
│   └── cashflow-model.md
├── intercom/
│   ├── finn-setup.md
│   └── conversation-paths.md
├── inventory/
│   ├── parts-board-schema.md
│   └── supplier-analysis.md
├── website/
│   ├── shopify-structure.md
│   └── conversion-analysis.md
├── team/
│   ├── roles-and-kpis.md
│   └── performance-baselines.md
├── n8n/
│   └── automation-inventory.md
└── strategic/
    ├── ali-5as-framework.md
    └── quarterly-goals.md
```

### Agent Reference Pattern

Each agent's CLAUDE.md gets a `## Reference Docs` section:

**Example — Operations CLAUDE.md:**
```
## Reference Docs
Monday board schema: builds/documentation/monday/board-schema.md
Customer flows: builds/documentation/monday/customer-flows.md
SOPs: builds/documentation/sops/
Team KPIs: builds/documentation/team/roles-and-kpis.md
Parts board: builds/documentation/inventory/parts-board-schema.md
```

Agent wakes up → knows WHERE docs are → reads only what it needs for the current task.

### Process for Each Document

1. Claude.ai exports raw doc → Ricky sends to Jarvis
2. Jarvis stores as-is in `builds/documentation/`
3. Jarvis verifies against live APIs (Monday schema, Xero, etc.)
4. Jarvis questions Ricky on gaps and outdated info
5. Jarvis produces verified version
6. Verified doc pushed to GitHub (Working Copy accessible)
7. Relevant agent CLAUDE.md files updated with reference path

### What This Enables
- Agents stop starting from zero every session
- Analysis builds on previous analysis (the reset loop stops)
- SOPs become living docs that agents can reference AND improve
- New agents or sub-agents get instant domain context by reading the docs
- Ricky can review and edit docs on his phone via Working Copy

---

## 9. WHAT TO BUILD NEXT (SEQUENCED)

This section is a bridge to the plan. Not the plan itself.

**Immediate (config fixes, no Code needed):**
1. Fix 4 model configs (team/website/parts → Sonnet, Systems → Haiku)
2. Triage 4 broken crons (fix or disable)
3. Remove "schedule" from agentToAgent.allow
4. Rewrite root CLAUDE.md

**Critical path (needs Code):**
5. Fix inter-agent messaging (the #1 blocker)
6. Build agent_messages consumer
7. QA test isolation (is_test flag, circuit breaker, auto-complete)

**After comms works:**
8. Pilot 2-3 sub-agents (ops-team, bm-listings) on Kimi/Grok
9. Scale to all 18 sub-agents
10. Retire v1 agents (team, parts, website)

**After sub-agents work:**
11. Build SOP creation workflow
12. Start data lake ETL (Priority 1-3: Monday.com, CDR, Xero)
13. Agent consolidation (16→8 if still needed)

**Ongoing:**
- Sign up for Grok API + Brave Search API
- Update CLAUDE.md files as architecture evolves
- Memory maintenance (nightly janitor running, verify quality)

---

*This document was compiled by Jarvis after reading every file in builds/agents/, the full conversation with Ricky on 23 Feb, and the current VPS state. Every claim above can be traced to a source document. If something is wrong, it's because the source document is wrong — and that should be fixed too.*
