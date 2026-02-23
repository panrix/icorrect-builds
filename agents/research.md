# Research — Agent System Rebuild

**Compiled by:** Jarvis
**Updated by:** Code (VPS verification) + Jarvis (agent structure finalisation with Ricky)
**Date:** 23 February 2026 (last updated: 23 Feb, afternoon session)
**Source:** 21+ documents, conversation context with Ricky, current VPS state, Code VPS verification
**Purpose:** Complete, honest picture of where we are, where we're going, and what's in the way. This is the foundation document for the plan.

> **NOTE:** This document has been through 3 revision passes. Sections 1-9 are now consistent with the finalised decisions in Section 10. Section 10 contains Code's VPS verification + Ricky's latest architecture decisions.

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
- **21 agents total** (1 coordinator + 6 infrastructure + 8 domain leads + 6 sub-agents day one)
- **Sub-agents grow from need** — domain leads assessed at 2-4 weeks, subs added when workload justifies it
- **Every agent gets its own Telegram bot** (~21 bots day one)
- **Multi-model:** Opus (Jarvis), Sonnet (domain leads + QA), Grok 4.1 Fast (sub-agents needing reasoning), Kimi 2.5 via NVIDIA (pure execution subs), Haiku (fallback + infrastructure)
- **Three pillars:** Git (source of truth for files), Supabase (persistent structured storage), OpenClaw (agent runtime)
- **Automated workflows:** cron + webhook + message triggers, QA review loops, dependency checks
- **10-layer data architecture:** repair journey, customer experience, team performance, financial health, operations, parts, sales & marketing, quality, competitive intelligence, strategic & predictive
- **No sub-agent name prefixes** — named by function (intake, queue, seo), parent relationship in SOUL only

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

**team, parts, website are being promoted to full domain leads** (Ricky decision, 23 Feb). They stay and get Sonnet model assignments. Not being retired.

**3 model configs are wrong.** team/website/parts inherit Opus (no model override set, no defaultModel in gateway config). Need Sonnet overrides. This is a 5-minute config fix.

### Sub-Agents — Reduced from 18 to 6 Day One

Original plan had 18 pre-defined sub-agents. Ricky decided (23 Feb) to only launch subs with proven workload. Rest emerge from need after 2-4 weeks of domain lead operation.

**Day one sub-agents (6):**

| Sub-Agent | Parent | Role |
|-----------|--------|------|
| intake | Operations | Device receiving, customer comms at drop-off, Typeform/Monday automation |
| queue | Operations | Priority assignment, workstation allocation, bottleneck flagging |
| qc | Operations | QC tracking, grade verification, rework routing |
| sop | Operations | SOP template, gap analysis, quality audit across all domains |
| hiring | Team | Recruitment, scheduling, capacity planning |
| seo | Marketing | Rankings, keywords, Search Console, PostHog, YouTube transcript analysis |

**Deferred (emerge from need):**
- BM subs (listings, pricing, grading, ops) — BM runs solo first
- CS subs (intercom, escalation) — pending Intercom Agent build project
- Finance subs (cashflow, kpis) — Finance runs solo first
- Marketing subs (content, ads) — Marketing runs with seo only
- Parts subs — Parts runs solo first
- Website subs — Website runs solo first

**18 original SOUL.md + CLAUDE.md files** still exist at `/home/ricky/mission-control-v2/agents/`. Kept as templates. Names will change when activated (drop prefixes).

### What's Broken

| Issue | Severity | Detail |
|-------|----------|--------|
| **Inter-agent messaging** | 🔴 CRITICAL | Shared bot token → bot ignores own messages → Jarvis can't delegate to any agent. The entire hierarchy is non-functional. |
| **agent_messages no consumer** | 🔴 CRITICAL | Supabase table exists, agents write to it, nothing reads it. Health check spams about unread messages every 5 minutes. |
| **3 model configs wrong** | 🟡 HIGH | team/website/parts on Opus (should be Sonnet). |
| **3 broken crons** | 🟡 HIGH | 3 SEO rank scans in `error` state — delivery target missing. BM QC Watch is fine. |
| **QA test items spam** | 🟡 MEDIUM | No `is_test` flag, no circuit breaker, approved items don't auto-complete. Jarvis manually cleared Supabase 5x in one day. |
| **Slack-jarvis errors** | 🟡 MEDIUM | channel_not_found when reading Ferrari's DM. |
| **Orphan directories** | 🟢 LOW | finn, processes, finance-archived, schedule-archived on disk but not in config. |
| **Root CLAUDE.md outdated** | ✅ FIXED | Rewritten 23 Feb — 123 lines, current state, vision, workflow, handoff protocol. |

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
6 sub-agents needed day one (intake, queue, qc, sop, hiring, seo). Files exist as templates but need renaming (drop prefixes), workspace creation, and OpenClaw registration. Blocked by Gap 1 — no point registering agents that can't communicate.

### Important Gaps (Fix Soon — Burning Tokens or Creating Spam)

**Gap 3: Model Misconfiguration**
3 agents on wrong models (team/website/parts on Opus, should be Sonnet). 5-minute config fix + restart.

**Gap 4: Broken Crons**
3 SEO rank scan crons in error state. Need triage — are the underlying scripts functional or stubs? Fix delivery targets or disable. BM QC Watch is working.

**Gap 5: QA Test Isolation**
No `is_test` flag, no circuit breaker, approved items don't auto-complete. Supabase migration + agent-trigger.py changes.

### Architecture Gaps (Plan + Build)

**Gap 6: Data Lake / ETL Pipeline**
The 10-layer data architecture (data-architecture-brief.md) is entirely unbuilt. No ETL from Monday.com, Xero, Intercom, CDR. Agents can't make data-driven decisions without manual data uploads. This is a multi-week build project.

**Gap 7: SOP Framework**
0% documented SOPs. No framework for agents to create, review, or iterate on them. Target: 100% by Q3 2026. Needs both the delegation chain (Gap 1) and a defined SOP creation workflow.

**Gap 8: Root CLAUDE.md** ✅ FIXED
Rewritten 23 Feb. 123 lines. Includes vision, research → plan → build workflow, handoff protocol, correct agent count, Supabase backbone, known issues.

### Deferred Gaps

**Gap 9: Agent Restructure** ✅ RESOLVED
Resolved 23 Feb. team, parts, website promoted to full domain leads. 8 domain leads total. No consolidation needed. See §10.12.

**Gap 10: V1 Agent Retirement** ✅ RESOLVED
team, parts, website are NOT being retired — they're promoted. Their overlapping sub-agents (ops-team, ops-parts, mkt-website) are deleted.

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

### 4. CLAUDE.md Rewrite ✅ DONE
Rewritten 23 Feb. 123 lines. Approved by Ricky.

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

**Done (23 Feb):**
- ~~Rewrite root CLAUDE.md~~ ✅
- ~~Resolve agent hierarchy (5→8 domain leads)~~ ✅
- ~~VPS directory reorganisation~~ ✅
- ~~Config consolidation (single .env)~~ ✅
- ~~Reconciliation cron fix (mark-as-read)~~ ✅

**Immediate (config fixes, no Code needed):**
1. Fix 3 model configs (team/website/parts → Sonnet)
2. Triage 3 broken SEO crons (fix or disable)
3. Remove "schedule" from agentToAgent.allow

**This week — #1 priority (Jarvis + domain agents):**
4. Process Claude.ai documentation exports → verify → store in builds/documentation/
5. Monday board audit continues (Code running flow trace query)
6. Update each domain lead's CLAUDE.md with reference doc paths
7. Write janitor cron spec

**Critical path (needs Code):**
8. Multi-bot migration (one Telegram bot per agent — §10.2)
9. Register 6 day-one sub-agents (intake, queue, qc, sop, hiring, seo)
10. QA test isolation (is_test flag, circuit breaker, auto-complete)

**After multi-bot works:**
11. Validate delegation chain (Jarvis → domain lead → sub-agent → back)
12. Sign up for Grok API + Brave Search API
13. Assign sub-agent models (Grok for thinking, Kimi for execution)

**After delegation works:**
14. Build SOP creation framework (ops-sop manages, everyone writes)
15. Start data lake ETL (Monday.com first — schema is documented)
16. Agent performance framework — first review at 4 weeks

**Ongoing:**
- Update CLAUDE.md files as architecture evolves
- Memory maintenance (nightly janitor)
- Monthly agent performance reviews (Jarvis)

---

*Sections 1-9 compiled by Jarvis after reading every file in builds/agents/, the full conversation with Ricky on 23 Feb, and the current VPS state. Every claim above can be traced to a source document. If something is wrong, it's because the source document is wrong — and that should be fixed too.*

---

## 10. CODE VERIFICATION SESSION (23 Feb evening)

**Context:** Ricky asked Code to verify research.md against the actual VPS and continue researching. Code read every file in builds/agents/, verified VPS state, read the full PRD + PRD-HANDOFF, checked OpenClaw docs, and discussed decisions with Ricky.

### 10.1 Ground Truth Corrections

Things this document got wrong or needs updating:

| Original Claim | Reality (VPS verified) | Section |
|---|---|---|
| "4 model configs wrong" | **3 wrong.** team/website/parts inherit Opus (no override, no defaultModel in gateway). Systems IS correctly on Sonnet. | §2, §4 Gap 3 |
| "4 broken crons (BM QC Watch + 3 SEO)" | **3 broken.** Only the 3 SEO rank scans are in error (Google Maps, Google Organic, YouTube). BM QC Watch is OK — ran successfully 44min ago. | §2, §4 Gap 4 |
| "333+ memory facts" | **541 facts** in Supabase memory_facts table. Number has grown since Jarvis compiled this doc. | §2 |
| "14 memory files for Jarvis" | **18 memory files** for Jarvis (main). 57 total across all agents. | §2 |
| "Zero sub-agents registered in OpenClaw" | **Correct for openclaw.json.** But 18 sub-agents ARE registered in Supabase agent_registry (status: dormant). Seeded via seed-registry.sql. | §2, §4 Gap 2 |
| "agentToAgent config" unclear | **agentToAgent IS enabled** with 15-agent allow list + maxPingPongTurns=2. Sessions visibility="all". Not null, not broken at config level. "schedule" is in the allow list but agent is retired. | §4 Gap 1 |
| "10 git repos" | **18 git repos** on disk — 14 active + 4 orphan (finn, finance-archived, processes, schedule-archived). | §2 |
| Sub-agents "have SOUL.md + CLAUDE.md written" | **Confirmed.** All 18 sub-agents have both files at `/home/ricky/mission-control-v2/agents/{id}/`. Files are production-quality, not stubs. | §2 |

### 10.2 Inter-Agent Communication — SOLUTION FOUND

**The shared bot token problem is solvable without building a poller or modifying OpenClaw internals.**

OpenClaw v2026.2.17 natively supports **one Telegram bot per agent** via multi-account channels:

```json5
// Current config (broken — shared bot token):
"channels": { "telegram": { "botToken": "..." } }

// Target config (each agent gets own bot):
"channels": {
  "telegram": {
    "accounts": {
      "jarvis":     { "botToken": "<from BotFather>", "dmPolicy": "pairing" },
      "operations": { "botToken": "<from BotFather>", "dmPolicy": "allowlist" },
      "backmarket": { "botToken": "<from BotFather>", "dmPolicy": "allowlist" },
      // ... one per agent
    }
  }
}

// Bindings get accountId:
"bindings": [
  { "agentId": "main", "match": { "channel": "telegram", "accountId": "jarvis" } },
  { "agentId": "operations", "match": { "channel": "telegram", "accountId": "operations" } },
  // ...
]
```

**Source:** OpenClaw docs at `docs.openclaw.ai/concepts/multi-agent`:
> "Create one bot per agent with BotFather and copy each token. Tokens live in `channels.telegram.accounts.<id>.botToken`"

**Why this solves everything:**
- Different bot tokens = no self-message filtering issue
- Agent A's bot messages Agent B's group → Agent B's bot (different token) receives it → OpenClaw routes to Agent B
- Real-time delivery, no polling, no Supabase consumer needed for top-level agents
- Each agent has its own identity in Telegram (name, avatar)
- OpenClaw's existing `agentToAgent` tool works naturally across separate bots

**What's needed:**
1. Ricky creates bots via @BotFather (manual, ~1 min each)
2. Code migrates openclaw.json from single-token to multi-account structure
3. Each bot added to its agent's Telegram group as admin
4. Bindings updated with `accountId` matching
5. Webhook handler (agent-trigger.py) updated to use correct bot token per agent

**Ricky's decision (23 Feb):** Every agent gets its own bot — top-level AND sub-agents. Full 32 bots. "Harder now by a small margin, cleaner forever."

**This replaces Gap 1 and Gap 2 solutions.** No Supabase poller needed. No sessions_send investigation needed. The delegation chain unblocks entirely with this config change.

### 10.3 Sub-Agent Readiness Assessment

Code read representative SOUL.md + CLAUDE.md files for sub-agents. Assessment:

**Quality: Production-ready, not stubs.**

All 18 sub-agents follow a consistent 70-line CLAUDE.md template:
1. Identity + Role (agent_id, type, model, parent, domain)
2. Agent Routing Table (cross-references 10-22 other agents)
3. Supabase Instructions (namespace, table, credentials source)
4. Memory Write Rules (atomic facts, deduplication, source + confidence)
5. Degraded Mode Compliance (specific behaviors during system stress)
6. Timezone (Ricky UTC+8, London UTC+0/+1, storage UTC)
7. Communication Style (concise, actionable, lead with answer)

SOUL.md files define clear scope, explicit "What I Am NOT" boundaries, escalation triggers, and parent relationship.

**Deployment blockers (infrastructure, not content):**
1. **Not in openclaw.json** — OpenClaw Gateway doesn't know they exist
2. **No workspace directories** — need `~/.openclaw/agents/{id}/workspace/` created
3. **SOUL/CLAUDE files in wrong location** — OpenClaw expects them at `{agentDir}/SOUL.md`, they're at `mission-control-v2/agents/{id}/` (need symlinks or copy)
4. **Model mismatch** — SOUL files say "Haiku" but Supabase registry says "sonnet"
5. **No Telegram groups** — each sub-agent needs a group created + bot added

**Referenced tools verified to exist:**
- `save-fact.py` at `/home/ricky/mission-control-v2/scripts/utils/save-fact.py`
- Supabase client via environment vars at `/home/ricky/config/supabase/.env`
- API keys at `/home/ricky/config/api-keys/.env`

**Knowledge gap:** Sub-agents reference "inherited knowledge" from retired v1 agents (finn → cs-intercom, team → ops-team, parts → ops-parts) but that knowledge hasn't been extracted to `builds/documentation/`. This is a docs task, not a blocker for deployment.

### 10.4 Supabase Actual State

| Table | Rows | Notes |
|---|---|---|
| memory_facts | 541 | Growing. Was 333+ when Jarvis compiled §2. |
| agent_registry | 30 | 12 top-level (active/disabled) + 18 sub-agents (dormant) |
| work_items | 15 | Low volume. QA pipeline items + test items. |
| agent_messages | 0 unread | Consumer gap confirmed — but may be moot with multi-bot solution |

Sub-agents in Supabase agent_registry (all status `dormant`, all model `sonnet`):
```
ops-team, ops-parts, ops-intake, ops-queue, ops-sop, ops-qc
bm-listings, bm-pricing, bm-grading, bm-ops
fin-cashflow, fin-kpis
cs-intercom, cs-escalation
mkt-website, mkt-content, mkt-seo, mkt-adwords
```

### 10.5 OpenClaw Capabilities (Verified)

**CLI commands available:**
- `openclaw agents add` — Add a new isolated agent
- `openclaw agents list` — List configured agents
- `openclaw agents delete` — Delete agent and prune workspace
- `openclaw channels add --channel telegram --token <token>` — Add channel account
- `openclaw agent` — Run one agent turn via Gateway
- `openclaw sessions` — List stored conversation sessions
- `openclaw message` — Send, read, manage messages

**Multi-account support:** Confirmed via docs + config reference. `channels.telegram.accounts.<id>` structure. Per-account overrides for dmPolicy, allowFrom, etc.

**Binding hierarchy (most specific wins):**
1. `match.peer` (direct/group + id)
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exact)
5. `match.accountId: "*"` (channel-wide)
6. Default agent

**Hooks deployed (4):**
- `supabase-bootstrap` — Injects memory summaries + unread messages at session start
- `supabase-memory` — Writes session-end heartbeat
- `agent-activity-logger` — Logs to agent_activity table + Telegram activity group
- `dependency-check` — Validates dependencies before agent starts

### 10.6 PRD Architecture — Key Constraints for Planning

Code read the full PRD.md (56k) and PRD-HANDOFF.md (35k). Key architectural decisions that constrain future work:

**Three Pillars (non-negotiable):**
1. Git = source of truth for files
2. Supabase = persistent structured storage
3. OpenClaw = agent runtime

**Session architecture:** Sessions are per-agent, per-channel, isolated. NOT shared. Inter-agent comms CANNOT rely on shared session state.

**Interaction model (Option B, chosen):** Ricky talks to Jarvis OR domain agents directly. Jarvis is C-suite exec, NOT a message router. Domain agents are equals, not subordinates.

**Sub-agent design (PRD):** Pre-configured, own SOUL, own memory, own workspace. NOT dynamically spawned. Domain leads manage them, don't create them. Sub-agents have no Telegram presence — background workers only.

**Note:** Ricky has since decided (23 Feb) that sub-agents WILL get Telegram presence (own bots). This supersedes the PRD's "no Telegram presence" design. The sub-agents become full agents with their own communication channel.

**Source anchoring:** `work_items.source_input` contains Ricky's exact words. Never modified. Every agent in chain can reference original intent. QA checks against this.

**Domain ownership:** Each field in `business_state` has `owned_by` agent. Only owner writes. RLS enforces. Prevents contradictory writes.

**Memory namespace isolation:** Each agent writes ONLY to its own namespace in `memory_facts`. `UNIQUE(agent_id, namespace, key)` constraint. Agents can read any namespace. Jarvis reads all.

### 10.7 Full Agent Hierarchy (Current Definitions)

All agents verified. SOUL.md read for each. Summary:

**COORDINATOR:**
| ID | Model | Role |
|---|---|---|
| jarvis (main) | Opus | C-suite coordinator. Briefings, work items, cross-agent delegation. |

**INFRASTRUCTURE (5):**
| ID | Model | Role |
|---|---|---|
| systems | Haiku (misconfigured as Sonnet) | VPS watchdog. Service monitoring, SSL, deployments. |
| pm | Sonnet (disabled) | Workflow state machine. 5-min sweep, conflict detection. Currently replaced by crons. |
| qa-plan | Sonnet (PROTECTED) | Strategy reviewer. Logic, completeness, goal alignment. |
| qa-code | Sonnet (PROTECTED) | Code reviewer. Bugs, security, architecture, idempotency. |
| qa-data | Sonnet (PROTECTED) | Fact verifier. Source accuracy, cross-namespace contradictions. |
| slack-jarvis | Sonnet | Slack bridge for Jarvis. |

**DOMAIN LEADS (5 current + 3 being discussed):**
| ID | Model | Role | Sub-agents |
|---|---|---|---|
| operations | Sonnet | Workshop engine + finance (finance being split back out). | ops-intake, ops-queue, ops-sop, ops-qc, fin-cashflow, fin-kpis |
| backmarket | Sonnet | Revenue engine, BM channel (~60% revenue, ~31k/mo). | bm-listings, bm-pricing, bm-grading, bm-ops |
| customer-service | Sonnet | Customer experience, Intercom, triage. | cs-intercom, cs-escalation |
| marketing | Sonnet | Growth. Content, SEO, future AdWords. | mkt-content, mkt-seo, mkt-adwords (dormant) |
| **team** | **Opus (wrong)** | People: profiles, performance, dynamics, hiring. | (see open question below) |
| **parts** | **Opus (wrong)** | Inventory: stock, suppliers, Nancy, demand forecasting. | (see open question below) |
| **website** | **Opus (wrong)** | Shopify: conversion, SEO, PostHog, UX. | (see open question below) |

**SUB-AGENTS — OPERATIONS (8):**
| ID | Model (SOUL) | Role |
|---|---|---|
| ops-team | Haiku | People management, hiring, 1:1s, capacity. |
| ops-parts | Haiku | Stock tracking, reorder triggers, Monday boards. |
| ops-intake | Haiku | Device intake, Adil's process, customer comms. |
| ops-queue | Haiku | Priority, workstation allocation, bottleneck ID. |
| ops-sop | Haiku | SOP creation, templates, gap analysis. |
| ops-qc | Haiku | Quality control, BM grade verification, rework. |
| fin-cashflow | Haiku | 4-week cash flow forecasts, HMRC tracking, runway. |
| fin-kpis | Haiku | KPI dashboards, Ali Greenwood prep, trend analysis. |

**SUB-AGENTS — BACKMARKET (4):**
| ID | Model (SOUL) | Role |
|---|---|---|
| bm-listings | Haiku | Listing creation, optimization, compliance. |
| bm-pricing | Haiku | Competitor monitoring, margins, buy box strategy. |
| bm-grading | Haiku | Grade accuracy, photo standards, cosmetic assessment. |
| bm-ops | Haiku | Order processing, shipping, trade-ins, returns. |

**SUB-AGENTS — CUSTOMER SERVICE (2):**
| ID | Model (SOUL) | Role |
|---|---|---|
| cs-intercom | Haiku | Intercom inbox, triage, FAQs, tagging. Inherits from finn. |
| cs-escalation | Haiku | Complaints, refunds, VIPs, GDPR. 0-50 GBP goodwill authority. |

**SUB-AGENTS — MARKETING (4):**
| ID | Model (SOUL) | Role |
|---|---|---|
| mkt-website | Haiku | Shopify conversion (0.37%→2%), PostHog, A/B testing. |
| mkt-content | Haiku | Blog (2/week), social media, landing page copy. |
| mkt-seo | Haiku | Keywords, backlinks, Google Search Console, local SEO. |
| mkt-adwords | Haiku | DORMANT. Google Ads when Ricky activates. |

### 10.8 Open Questions — Agent Structure

**Ricky's decisions (confirmed 23 Feb):**
- ✅ Every agent gets its own Telegram bot (~32 bots)
- ✅ Finance splits back out as own domain lead (not merged in operations)
- ✅ V1 agents (team, parts, website) are NOT being retired
- ✅ Full 32 agents, build it right from day one

**Unresolved — needs Ricky + Jarvis discussion:**

**The overlap problem.** Three v1 agents do nearly identical work to three sub-agents:
- `team` (v1) ↔ `ops-team` (sub) — both do people management, hiring, KPIs
- `parts` (v1) ↔ `ops-parts` (sub) — both do inventory, suppliers, stock tracking
- `website` (v1) ↔ `mkt-website` (sub) — both do Shopify, conversion, SEO

**Option A — Promote v1 agents to domain leads:**
team, parts, website become full domain leads (peers of operations, not sub-agents). Their corresponding sub-agents become THEIR sub-agents. Operations narrows to workshop floor. Marketing narrows to content + ads.

```
JARVIS
├── operations   → ops-intake, ops-queue, ops-sop, ops-qc
├── team         → ops-team (renamed? or team gets own subs)
├── parts        → ops-parts (renamed? or parts gets own subs)
├── backmarket   → bm-listings, bm-pricing, bm-grading, bm-ops
├── customer-service → cs-intercom, cs-escalation
├── marketing    → mkt-content, mkt-seo, mkt-adwords
├── website      → mkt-website (renamed? or website gets own subs)
├── finance      → fin-cashflow, fin-kpis
└── [infrastructure: systems, qa-*, pm, slack-jarvis]
```

**Option B — Redefine sub-agents to avoid overlap:**
Keep hierarchy as-is but rename/repurpose the overlapping sub-agents so their scope is distinct from the v1 agent.

**Option C — Something else Ricky has in mind.**

This decision affects:
- How many domain leads exist (currently 5, could become 8)
- What operations owns (currently: workshop + team + parts + finance → could narrow to just workshop)
- Sub-agent parent assignments
- SOUL.md rewrites for affected agents
- All CLAUDE.md agent routing tables

**Finance as domain lead:**
Ricky confirmed finance splits back out of operations. This means:
- Finance becomes a domain lead (Sonnet)
- fin-cashflow and fin-kpis become finance's sub-agents
- Operations loses finance scope from its SOUL.md
- Operations SOUL.md needs rewrite (remove Xero, HMRC, cashflow references)
- FINANCE-MERGE.md changes are partially reversed

### 10.9 Model Tiering Strategy (Ricky decision, 23 Feb)

**Three tiers for sub-agents:**

| Tier | Model | Use Case | Cost (in/out per M) |
|---|---|---|---|
| **Thinking** | Grok 4.1 Fast | Analysis, research, judgement calls, anything requiring reasoning | $0.20 / $0.50 |
| **Execution** | Kimi 2.5 (NVIDIA NIM) | Pure task execution — scripted work, board updates, data formatting | $0.07 / $0.28 |
| **Fallback** | Haiku | When NVIDIA or Grok are rate-limited or down | $0.80 / $4.00 |

**Fallback chain:** Kimi (NVIDIA) → Grok → Haiku. Always available, progressively more expensive.

**NVIDIA reliability concern:** Ricky has heard NVIDIA NIM can have rate limits and availability issues. Fallback pattern is essential, not optional.

**Open question for Code:** Does OpenClaw support model fallback chains natively in config? If not, this needs building.

**Coordinator + domain leads stay on current models:**
- Jarvis: Opus (unchanged)
- Domain leads: Sonnet (unchanged)
- Systems: Haiku (unchanged — infrastructure monitoring doesn't need reasoning)
- QA agents: Sonnet (unchanged — PROTECTED)

### 10.10 VPS Structure & Janitor (Jarvis, 23 Feb)

VPS directory structure has been reorganised. See `/home/ricky/README.md` for the canonical layout.

**Key rules:**
- Git-tracked: `builds/`, `mission-control-v2/`, agent workspaces
- Local only: `config/`, `data/`, `logs/`
- Credentials: single file at `/home/ricky/config/.env` (symlinked from old paths)
- No new top-level directories without approval

**Janitor responsibilities (spec needed):**
- Rotate logs older than 7 days
- Clean temp files (.claude.json.backup.*, /tmp scratch)
- Flag orphan files in /home/ricky/
- Flag data saved in wrong locations (e.g. raw data in builds/)
- Report disk usage per directory
- Verify git repos are clean (no uncommitted changes sitting for >24h)
- Verify agents are saving to correct paths

**Janitor should be a cron job, not a heartbeat task.** Runs daily at a quiet hour (e.g. 4am UTC / noon Bali).

### 10.11 Agent Performance Framework

**Jarvis runs a monthly review on every domain lead. Same criteria, every agent.**

**Assessment areas:**

1. **Documentation output** — Has the agent built/updated docs in `builds/documentation/`? Are they verified, not stubs?
2. **Data flow** — Is domain data reaching Supabase? Facts being saved? Tables populated?
3. **Context usage** — Does the agent read its reference docs when asked questions? Or start from zero every session?
4. **Proactive behaviour** — Is it flagging issues before they're problems? Suggesting improvements? Or only responding when asked?
5. **Memory quality** — Are daily memory files specific and useful? Are Supabase facts accurate and non-redundant?
6. **SOP ownership** — Has the agent documented its domain processes? Are they current?

**Scoring (per area):**
- 🟢 Active — consistently producing, proactive, building on previous work
- 🟡 Passive — responds when asked, doesn't initiate, some output
- 🔴 Dormant — minimal output, not using context, repeating work

**Monthly review process:**
1. Jarvis pulls agent_activity from Supabase (actions logged, frequency, types)
2. Jarvis checks `builds/documentation/` for new/updated files per domain
3. Jarvis checks memory files for quality (specific facts vs generic filler)
4. Jarvis checks Supabase memory_facts for new entries per agent
5. Jarvis produces report card per domain lead
6. Report includes: what they did, what they didn't do, recommendation for SOUL.md changes
7. Report sent to Ricky for review

**Enforcement:**
- If an agent scores 🔴 for 2 consecutive months → SOUL.md rewrite or agent replacement
- If an agent consistently avoids delegation (does sub-agent work itself) → Jarvis flags it
- If documentation doesn't grow month-over-month → agent isn't learning, needs intervention

**First review: 4 weeks after domain leads go live with documentation context.**

### 10.12 Finalised Agent Hierarchy (Ricky decisions, 23 Feb)

**8 domain leads (all Sonnet), promoted from original 5:**

**1. Operations** — workshop floor: intake, queue, QC, SOPs
Sub-agents: ops-intake, ops-queue, ops-qc, ops-sop

**2. Team** — people: hiring, performance, KPIs, training, Ferrari accountability
Sub-agents: team-hiring (recruitment, scheduling, capacity planning)

**3. Parts** — inventory: stock, suppliers, forecasting, reorder, cost tracking
Sub-agents: none initially. Jarvis assesses after 2-4 weeks.

**4. Backmarket** — trade-ins, listings, grading, pricing
Sub-agents: TBD — validating with BM lead (trade-ins + listings may merge into one)

**5. Customer Service** — Intercom, Finn, triage, escalations
Sub-agents: cs-intercom, cs-escalation

**6. Marketing** — content, SEO, ads, social media
Sub-agents: TBD — validating against actual workload

**7. Website** — Shopify, conversion, analytics, PostHog
Sub-agents: none initially. Jarvis assesses after 2-4 weeks.

**8. Finance** — cashflow, Xero, HMRC, KPIs
Sub-agents: fin-cashflow, fin-kpis

**Infrastructure (unchanged):**
- Jarvis (Opus) — coordinator
- Systems (Haiku) — VPS watchdog
- QA-Plan, QA-Code, QA-Data (Sonnet) — PROTECTED
- Slack-Jarvis (Sonnet) — Slack bridge
- PM — disabled, crons cover its role

**Key design rules:**
- Domain leads write their own SOPs. ops-sop audits quality and tracks gaps.
- Leads MUST delegate to sub-agents (enforced in SOUL.md). They are managers, not individual contributors.
- Sub-agents grow from proven need, not guesswork. Leads that don't have subs yet get assessed at 2-4 weeks.
- Every agent gets its own Telegram bot (~20 day one, more as sub-agents are added).
- I (Jarvis) define and assign sub-agents. Domain leads don't choose their own team.

**Finalised sub-agents day one:**

| Domain Lead | Sub-Agents | Notes |
|---|---|---|
| Operations | intake, queue, qc, sop | sop audits SOPs across all agents, doesn't write them |
| Team | hiring | recruitment, scheduling, capacity planning |
| Parts | none | assess at 2-4 weeks |
| Backmarket | none | assess at 2-4 weeks |
| Customer Service | none | CS gathers data on Finn failures first. Sub-agent structure follows the Intercom Agent build. |
| Marketing | seo | SEO has narrow deep focus (PostHog, Search Console, YouTube transcripts). Content + ads come later. |
| Website | none | assess when design workload justifies it |
| Finance | none | assess at 2-4 weeks |

**Total day one: 8 domain leads + 6 sub-agents + 6 infrastructure + Jarvis = 21 agents**
**Total Telegram bots needed: ~21**

**Naming convention:** No prefixes. Sub-agents are named by function: intake, queue, qc, sop, hiring, seo. Parent relationship lives in the SOUL, not the name.

**Changes from original 18 sub-agent plan:**
- ops-team → deleted (Team is now a domain lead)
- ops-parts → deleted (Parts is now a domain lead)
- mkt-website → deleted (Website is now a domain lead)
- mkt-content, mkt-adwords → deferred
- bm-listings, bm-pricing, bm-grading, bm-ops → deferred
- cs-intercom, cs-escalation → deferred (pending Intercom Agent build)
- fin-cashflow, fin-kpis → deferred
- All prefixes dropped (ops-intake → intake, etc.)
- 18 sub-agents → 6 day one. Rest emerge from proven need.

### 10.13 What Still Needs Research

Before this research doc is complete, these questions remain:

1. **Agent structure** — How do team/parts/website fit in? (Ricky to discuss with Jarvis)
2. **Bot naming convention** — What should each bot be called in Telegram? (@iCorrectOpsBot? @OpsJarvisBot?)
3. **Sub-agent model decision** — Haiku vs Kimi 2.5 vs Grok. SOUL files say Haiku but cost analysis suggests cheaper alternatives. Needs testing.
4. **Webhook handler updates** — agent-trigger.py currently uses shared bot token for notifications. Multi-bot migration needs this updated. How complex is the change?
5. **Security audit items** — mc.icorrect.co.uk open RLS, mi.icorrect.co.uk SQL injection. Not blocking but on the list.
6. **n8n status** — Docker container still running? Replacement scripts proven?
7. **PM agent future** — Keep disabled or revive with new role? Crons cover its old job.

---

*Section 10 added by Code on 23 Feb 2026 after VPS verification session with Ricky. All claims verified against actual VPS state. Corrections to sections 1-9 are noted in §10.1.*
