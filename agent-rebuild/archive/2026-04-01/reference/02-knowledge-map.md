# 02 — Knowledge Map: What We Have, What's Verified, What's Missing

> Historical note: this file describes the pre-rebuild February 2026 documentation landscape. It is retained as discovery background, not current operating truth. Use `/home/ricky/builds/agent-rebuild/technical/control/documentation-state-summary-2026-04-01.md` and `/home/ricky/kb/` for the current structure.

**Date:** 2026-02-24
**Purpose:** Before rebuilding anything, know what ground has already been covered.

---

## The Surprise

You have ~130+ documents across the VPS. The problem was never "we haven't researched enough." The problem is the research is scattered across 9 locations with no index telling you what's current.

---

## Business Domains — Knowledge Status

### 1. INTAKE (Walk-in, Mail-in, BM Trade-in, Corporate)

**Status: WELL RESEARCHED — Ready to build**

What exists:

- 7 Otter transcripts from Ricky → synthesized into INTAKE-SYNTHESIS.md
- Device-specific decision trees (iPhone, MacBook, iPad, Watch) from Meesha's handwritten flows
- 519 repair items + 214 diagnostic items audited from Monday
- Build spec (SPEC.md) and dev brief (DEV-BRIEF.md) ready
- 4 flow specs: standard repair, BM trade-in, client iPad, diagnostic

What's missing:

- Verification that device flows match current practice (Meesha's flows may have evolved)
- Corporate intake flow (mentioned but not documented)
- Mail-in specific flow (noted as different but not fully mapped)

Canonical location: /home/ricky/builds/intake-system/

---

### 2. BACK MARKET (Trade-in, Sales, After-sale, Returns)

**Status: BEST DOCUMENTED — SOPs operational**

What exists:

- Knowledge base: BM = ~~60% revenue (~~31k/mo)
- End-to-end process map from Ricky voice transcript
- 7 machine-facing SOPs (daily, listing, pricing, sales, trade-in, aftersales, errors)
- 808-listing pricing audit with competitive analysis
- Full n8n automation flow audit (Flows 0-4+)
- API endpoint reference + comprehensive API docs
- Live data: sales orders CSV, trade-in orders CSV, listings JSON
- Pricing module planned but not built
- Profitability case study (BM1460 MacBook Air M1)

What's missing:

- SOPs verified against current practice (agent was making mistakes — are SOPs wrong or is agent ignoring them?)
- Counter-offer decision framework (guidelines exist but no decision tree)
- Return/dispute escalation flow
- Metrics: error rate per flow type, which flow causes most mistakes

Canonical location: /home/ricky/builds/documentation/backmarket/ (verified docs) + agents/backmarket/workspace/docs/SOPs/ (operational SOPs)

---

### 3. FINANCE (Xero, KPIs, Cash Flow, VAT)

**Status: PARTIALLY DOCUMENTED — some builds started**

What exists:

- Invoice automation PRD + build spec (Monday → Xero draft)
- n8n workflow JSONs for Xero generate/send/payment
- KPI tracker spreadsheet + formatting rules
- VAT forensic investigation completed
- Finance merged into operations agent (documented)

What's missing:

- Cash flow forecasting process
- Monthly close checklist
- Xero reconciliation SOP (process exists but not documented)
- Tax calendar / HMRC deadlines

Canonical location: /home/ricky/builds/xero-invoice-automation/ (build) + builds/documentation/raw-imports/finance-cashflow.md (overview, unverified)

---

### 4. TEAM (Hiring, Performance, Training)

**Status: WELL RESEARCHED — data-driven**

What exists:

- Data-driven hiring analysis (business case for Adil replacement)
- 3-month team performance report (Nov 2025 - Jan 2026)
- Andres weekly workload map (39KB, very detailed)
- Slack communication pattern analysis
- Measured intake times (22.1 min avg)
- Onboarding doc, training system overview, technician performance framework

What's missing:

- Current team roster with roles/hours/capabilities (TEAM.md in shared docs — is it current?)
- Performance tracking system (how are KPIs actually measured week to week?)
- Training progression for each team member

Canonical location: agents/main/workspace/docs/team/ (but should move to builds/documentation/team/)

---

### 5. CUSTOMER SERVICE (Intercom, Finn AI)

**Status: WELL DOCUMENTED — build spec ready**

What exists:

- Full Intercom audit (config, Fin quality, sync, n8n flows)
- Agent-led comms spec (agents answer basics, humans when needed)
- Intercom handling SOPs
- Finn improvement guide + 50-conversation conversion analysis
- 22 relevant n8n workflows mapped
- Build spec for Intercom agent takeover

What's missing:

- Current Finn resolution rate (baseline was set, has it improved?)
- Customer satisfaction metrics
- Escalation success rate (what % of escalations resolve well?)

Canonical location: /home/ricky/builds/intercom-agent/ (spec) + agents/customer-service/workspace/docs/ (operational)

---

### 6. MONDAY.COM (Central System)

**Status: FRESHLY AUDITED — most actionable**

What exists:

- Full board schema: 4,122 items, 170 columns, 33 groups
- Target state design with Ricky decisions captured
- Python-traced repair flows through the board
- Cleanup brief ready
- API query specifications

What's missing:

- Parts/Stock board equivalent audit (exists but less recent)
- n8n automation dependency map (which automations break if we change board structure?)
- Data migration plan for cleanup

Canonical location: /home/ricky/builds/documentation/monday/

---

### 7. WEBSITE (Shopify, Conversion, Analytics)

**Status: MODERATE — some work done**

What exists:

- PostHog analysis + tracking setup
- Dead click UX audit
- Conversion improvement spec (targeting 1% → 2%)
- WordPress → Shopify migration status

What's missing:

- Current conversion rate (baseline)
- SEO audit
- Content strategy
- Shopify theme architecture (theme is in Jarvis workspace but not documented)

Canonical location: /home/ricky/builds/website-conversion/ (spec)

---

### 8. INVENTORY / PARTS

**Status: SPEC'D BUT STALLED**

What exists:

- Ricky voice requirements captured
- Ferrari's Stock Management Proposal v2
- Phase 1 plan + refurb pipeline board spec
- Screen prediction research (concluded: physical check at intake)
- React prototype for stock dashboard

What's missing:

- Current stock accuracy rate
- Parts ordering process (how does Ferrari actually order parts today?)
- Supplier relationships mapped
- Reconciliation status (Phases 2-4 incomplete)

Canonical location: /home/ricky/builds/inventory-system/

---

### 9. OPERATIONAL SOPs (Human-facing)

**Status: JUST CREATED TODAY — needs verification**

28 SOPs compiled from Claude.ai conversation history (Oct 2025 - Jan 2026). These are V1, human-facing SOPs covering:

- Drop-off, collection, shipping, QC, BM pre-validation
- Escalation, warranty, repair standards, liquid damage
- Model identification, Monday board guide, supplier directory
- Training, onboarding, KPIs, automation strategy

What's missing:

- Verification against current practice (these are from memory, not from observing the workshop)
- Gap analysis: what processes exist that have NO SOP?
- Priority ranking: which SOPs matter most?

Location: /home/ricky/Claude-SOPs-for-iCorrect/

---

## The Duplication Problem

The same information exists in multiple places:


| Content             | Copies Found                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| Intake device flows | 3 (main workspace, operations workspace, builds/)                                                 |
| BM process map      | 2 (backmarket workspace, builds/documentation/)                                                   |
| Monday schema       | 2 (builds/documentation/, raw-imports/)                                                           |
| Xero workflows      | 2 (main workspace/workflows/, operations workspace/)                                              |
| Team context        | 3+ (shared-context in multiple agents)                                                            |
| SOPs                | 2 (Claude-SOPs-for-iCorrect/ human-facing, agents/backmarket/workspace/docs/SOPs/ machine-facing) |


**Rule for rebuild:** ONE canonical location per document. Everything else is a symlink or doesn't exist.

---

## What's Actually Missing (The Gaps)

These are business processes that have NO documentation anywhere:

1. **Daily workshop opening/closing routine** — what happens when Ferrari opens up?
2. **Repair queue prioritisation** — how does Ferrari decide what to work on next?
3. **Customer communication templates** — what do status update messages actually say?
4. **Supplier ordering process** — how are parts ordered, from whom, lead times?
5. **End-of-week reconciliation** — what does Ricky check on Fridays?
6. **BM listing creation process** — step by step, how does a device become a BM listing?
7. **Pricing decision framework** — how are repair prices set? BM prices?
8. **Ricky's own daily workflow** — what does remote management actually look like hour by hour?

---

## Recommended Next Step

Don't create new research. **Consolidate what exists.**

1. Move all verified docs to /home/ricky/builds/documentation/{domain}/
2. Delete or archive duplicates
3. Create an INDEX.md that maps every domain to its canonical docs
4. Identify the 8 gaps above and schedule capture sessions with Ricky
5. THEN design agents around the verified knowledge

---

## Open Questions for Ricky

1. Those 28 SOPs created today from Claude.ai — how accurate are they? Should we trust them or verify each one?
2. The BackMarket SOPs in the agent workspace — are those the ones causing mistakes, or is the agent just not following them?
3. Which of the 8 gaps listed above are most painful right now?
4. Is Ferrari a good source for verifying workshop processes, or does it need to come from you?
