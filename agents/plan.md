# Plan — Agent System Rebuild

**Author:** Jarvis
**Date:** 23 February 2026
**Source:** research.md (fully harmonised), Ricky decisions 23 Feb
**Status:** DRAFT — awaiting Ricky review

---

## Phasing Principle

Each phase must be complete and working before the next starts. No parallel phases. No skipping ahead. Each phase has a clear "done" definition.

---

## Phase 0: Foundation Fixes (Jarvis — this week)

Things that are broken or wrong right now. No Code needed.

**Tasks:**
1. Fix 3 model configs (team/website/parts → Sonnet override in openclaw.json)
2. Triage 3 broken SEO crons (fix delivery targets or disable)
3. Remove "schedule" from agentToAgent.allow
4. Single gateway restart
5. Verify each agent responds on correct model

**Done when:** All agents on correct models, no cron errors, clean gateway restart.

**Owner:** Jarvis
**Effort:** 30 minutes

---

## Phase 1: Documentation (Jarvis + Ricky — this week)

Domain leads can't function without business context. This is the #1 priority.

**Tasks:**
1. Monday board: go through statuses/columns/groups with Ricky — decide what stays, goes, merges
2. Write verified Monday documentation (cleanup plan, status definitions, flow maps)
3. Process remaining Claude.ai exports — verify against live APIs
4. Pull Parts Board schema from Monday API (985177480)
5. Write verified docs for top 3 domains: Operations, Backmarket, Finance
6. Update each domain lead's CLAUDE.md with reference doc paths to builds/documentation/
7. Write janitor cron spec
8. Push all docs to GitHub (panrix/icorrect-builds)

**Done when:** Operations, Backmarket, and Finance agents wake up with reference paths pointing to verified documentation. Monday board structure is fully documented with agreed cleanup decisions.

**Owner:** Jarvis (verification + writing), Ricky (decisions + gap-filling)
**Effort:** 3-5 days

---

## Phase 2: Grok API + Multi-Bot Setup (Code — after Phase 1)

The two infrastructure prerequisites for sub-agents.

**Tasks:**
1. Ricky signs up at api.x.ai — gets Grok API key
2. Add Grok as model provider in openclaw.json
3. Assign Grok Fast to Systems — verify it responds
4. Create Telegram bots for all 21 agents (BotFather)
5. Configure multi-bot in openclaw.json (one botToken per agent)
6. Gateway restart
7. Test: Jarvis sends message → Operations receives via its own bot
8. Test: Operations sends message → Jarvis receives
9. End-to-end test: message chain across 3 agents

**Done when:** Every agent has its own Telegram bot. Cross-agent messaging works. Systems running on Grok Fast.

**Owner:** Code (implementation), Ricky (Grok signup, BotFather bot creation)
**Effort:** 1-2 days

**Rollback:** Code backs up openclaw.json before changes. If multi-bot breaks, revert to single-bot config.

---

## Phase 3: Sub-Agent Registration (Code — after Phase 2)

Stand up the 6 day-one sub-agents.

**Tasks:**
1. Create workspace directories for: intake, queue, qc, sop, hiring, seo
2. Write SOUL.md for each (adapt from existing templates, drop prefixes)
3. Write CLAUDE.md for each with reference doc paths
4. Create Telegram bot for each (BotFather)
5. Register in openclaw.json with Grok Fast model
6. Gateway restart
7. Verify each sub-agent responds
8. Test delegation: Jarvis → Operations → qc → back to Operations → back to Jarvis
9. Test delegation: Jarvis → Marketing → seo → back

**Done when:** 6 sub-agents registered and responding. At least one full delegation chain tested end-to-end.

**Owner:** Code (registration), Jarvis (SOUL/CLAUDE content)
**Effort:** 1-2 days

---

## Phase 4: Delegation Chain Validation (Jarvis + Ricky — after Phase 3)

Prove the system works with a real task before scaling.

**Tasks:**
1. Ricky gives Jarvis a real task: "Get the QC SOP documented"
2. Jarvis routes to Operations
3. Operations delegates to qc sub-agent
4. qc produces draft SOP
5. Operations reviews and refines
6. Jarvis reviews and presents to Ricky
7. Ricky approves or sends back

**Measure:**
- Did the intent survive 5 hops without drift?
- Was the output useful or generic filler?
- How long did the full chain take?
- Where did it break or lose context?

**Done when:** One real task has completed the full delegation chain. Issues documented. SOUL.md files adjusted based on findings.

**Owner:** Jarvis (coordination), Ricky (initiation + review)
**Effort:** 1-2 days

---

## Phase 5: Monday Cleanup (Code + Operations — after Phase 4)

Monday must be clean before the Supabase mirror.

**Tasks:**
1. Write archive script: move items not updated in 90+ days to "iCorrect Archive" board
2. Move all Returned items older than 30 days to archive
3. Kill dead groups (Zara iPods, Completed Refurbs, Selling, Ricky, etc.)
4. Merge groups as agreed (Devices In Hole + Long Term + Recycle → "Dead/Uncollected")
5. Create QC Status column (Pass / Fail / In Review)
6. Begin Trade-in Status migration (move BM lifecycle values out of main Status and Repair Type)
7. Clean up duplicate columns (Colour x2, Priority x2)
8. Document Monday native automations (Systems agent extracts from Monday UI)
9. Record training videos for team on new column/status changes
10. Ricky briefs team in meeting

**Done when:** Board reduced from 4,122 to ~200 active items. Dead groups removed. QC Status column live. Team trained on changes.

**Owner:** Code (scripts), Operations (documentation), Ricky (team communication)
**Effort:** 1 week

---

## Phase 6: Domain Lead Context Loading (Jarvis — after Phase 5)

With Monday clean and documented, load remaining domain leads with context.

**Tasks:**
1. Complete verified documentation for: Team, Parts, Customer Service, Marketing, Website
2. Update each agent's CLAUDE.md with reference doc paths
3. Verify each domain lead reads its docs when asked domain questions
4. First round of proactive tasks: each lead produces initial SOP list for their domain
5. ops-sop audits SOP coverage across all domains

**Done when:** All 8 domain leads have verified documentation. Each has produced at least one domain-specific output using their reference docs.

**Owner:** Jarvis
**Effort:** 1 week

---

## Phase 7: Data Layer Foundation (Code — after Phase 6)

Start building the Supabase mirror of Monday.

**Tasks:**
1. Design Supabase schema for active repair items (based on clean Monday board)
2. Build ETL: Monday API → Supabase (real-time sync via webhooks or polling)
3. Agents read from Supabase, not Monday API directly
4. Build team performance views (repair times, QC pass rates per tech)
5. Build basic KPI dashboard in Mission Control

**Done when:** Active Monday items mirrored to Supabase. At least one agent successfully queries Supabase for business data instead of Monday API.

**Owner:** Code
**Effort:** 1-2 weeks

---

## Phase 8: Performance Review + Scale (Jarvis — 4 weeks after Phase 4)

First monthly review. Prove the system is learning.

**Tasks:**
1. Jarvis runs agent performance framework on all 8 domain leads
2. Score each lead: 🟢🟡🔴 across 6 assessment areas
3. Identify which leads need sub-agents based on actual workload
4. Identify which leads need SOUL.md rewrites
5. Present report to Ricky
6. Register additional sub-agents where justified
7. Adjust model assignments if cost or quality issues found

**Done when:** First performance report delivered. At least one evidence-based sub-agent or SOUL change made.

**Owner:** Jarvis
**Effort:** 1 day (review), ongoing (adjustments)

---

## Timeline Estimate

| Phase | What | Owner | Duration | Depends On |
|-------|------|-------|----------|------------|
| 0 | Foundation fixes | Jarvis | 30 min | Nothing |
| 1 | Documentation | Jarvis + Ricky | This week | Nothing |
| 2 | Grok + Multi-bot | Code + Ricky | 1-2 days | Phase 1 |
| 3 | Sub-agent registration | Code + Jarvis | 1-2 days | Phase 2 |
| 4 | Delegation validation | Jarvis + Ricky | 1-2 days | Phase 3 |
| 5 | Monday cleanup | Code + Ops + Ricky | 1 week | Phase 4 |
| 6 | Domain lead context | Jarvis | 1 week | Phase 5 |
| 7 | Data layer | Code | 1-2 weeks | Phase 6 |
| 8 | Performance review | Jarvis | Day 30 | Phase 4 |

**Total estimated timeline: 5-7 weeks to Phase 7. Phase 8 runs at day 30 regardless.**

---

## What This Plan Does NOT Cover

These are separate build projects in builds/INDEX.md:
- Intercom Agent (replacing Finn) — CS gathers data first
- Intake System (voice notes, customer flow) — needs Monday cleanup first
- BM Pricing Module — needs new GetCompetitors endpoint
- Website Conversion optimisation — needs PostHog baseline
- Inventory System — needs Parts board documented
- n8n removal — needs replacement scripts proven

Each gets its own research.md → plan.md → build cycle when the time comes.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Multi-bot migration breaks comms | Code backs up config, tests in stages, rollback ready |
| Delegation chain loses intent after 5 hops | Phase 4 tests this explicitly before scaling |
| Domain leads produce filler instead of substance | Performance framework catches this at day 30 |
| Monday cleanup disrupts team | Ricky briefs team first, training videos, staged rollout |
| Grok quality insufficient for sub-agents | Haiku fallback available, Sonnet upgrade if needed |
| Documentation falls behind agent deployment | Phase 1 (docs) must complete before Phase 2 (infra) |

---

*This plan was produced by Jarvis from research.md. Every phase has a clear owner, done definition, and dependency. No phase starts until its dependency is complete. Ricky approves before execution begins.*
