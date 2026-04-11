# Brief 06: Automation, Scripts & Agent Blueprint

**For:** Codex agent (research + synthesis)
**Output:** `/home/ricky/builds/agent-rebuild/automation-blueprint.md`

---

## Context

iCorrect is a specialist Apple repair business in London (~7 staff, ~£52k/mo revenue, target £166k by Q4 2026). We're rebuilding our agent/automation system. The core insight: most of what our AI agents do should be deterministic scripts. Agents should only handle tasks that genuinely need reasoning, writing, or judgement.

We need a comprehensive blueprint of what automations, scripts, and agents we need to manage every aspect of the business — operations, team, revenue, sales, marketing, and growth.

## Background reading (read ALL of these first)

1. `/home/ricky/builds/agent-rebuild/system-rethink.md` — the master planning doc. Read the full "Architecture Problem: LLMs as Script Runners" section and the agent audit.
2. `/home/ricky/builds/agent-rebuild/vps-audit.md` — what's currently running on the VPS.
3. `/home/ricky/builds/agent-rebuild/cron-audit.md` — current scheduled tasks.
4. `/home/ricky/builds/agents/research.md` — the original agent system research (sections 1-4 are most relevant: vision, what exists, what's been tried, the gap).
5. `/home/ricky/.openclaw/shared/COMPANY.md` — business context
6. `/home/ricky/.openclaw/shared/GOALS.md` — business goals
7. `/home/ricky/.openclaw/shared/PROBLEMS.md` — known problems
8. `/home/ricky/builds/INDEX.md` — what build projects exist

Also read (if the other briefs have been completed):
- `/home/ricky/builds/agent-rebuild/hugo-script-audit.md` (Brief 01 output)
- `/home/ricky/builds/agent-rebuild/system-audit-digest.md` (Brief 05 output)

## Task

### For each business domain, produce a complete blueprint:

---

### A. OPERATIONS (Workshop Floor)
**Current state:** Read ops agent workspace, Monday board docs, intake system specs.

Define what's needed:
1. **Scripts** (no LLM) — e.g. queue status checker, intake form processor, QC checklist validator, aging item alerter, workstation allocation tracker
2. **Cron jobs** — what should run on a schedule? (e.g. daily queue summary, aging alerts, bottleneck detection)
3. **Slack/Telegram commands** — what should the team be able to look up instantly? (e.g. `/queue`, `/status <item>`, `/aging`)
4. **Agent tasks** — what genuinely needs an LLM? (e.g. analysing bottleneck patterns, writing process improvement recommendations)
5. **Data sources** — what APIs/systems does each script need? (Monday, Supabase, etc.)

---

### B. TEAM (People Management)
**Current state:** Read team agent workspace and docs.

Define:
1. **Scripts** — KPI dashboards, attendance tracking, capacity planning calculations, performance metric pulls
2. **Cron jobs** — weekly performance summaries, hiring pipeline updates
3. **Slack/Telegram commands** — `/team-status`, `/kpi <name>`, `/capacity`
4. **Agent tasks** — performance review analysis, hiring decision support, team dynamic assessment
5. **Data sources** — Monday, time tracking, repair completion data

---

### C. REVENUE & SALES (BackMarket + Walk-in + Shopify)
**Current state:** Read BM SOPs, scripts, buyback monitor, sale detection, pricing scripts.

Define:
1. **Scripts** — price monitoring, buy box tracking, sale detection, dispatch automation, profitability calculations, trade-in processing
2. **Cron jobs** — daily price checks, hourly sale detection, weekly profitability reports
3. **Slack/Telegram commands** — `/buybox`, `/sales-today`, `/profitability <model>`, `/stock-value`
4. **Agent tasks** — pricing strategy decisions, market analysis, competitor response planning
5. **Data sources** — BM API, Monday, Shopify, Xero

---

### D. FINANCE
**Current state:** Read any finance docs in ops agent workspace, Xero integration status.

Define:
1. **Scripts** — invoice generation, payment reconciliation, cashflow forecasting, HMRC payment tracking, revenue by channel/product
2. **Cron jobs** — daily revenue summary, weekly cashflow forecast, monthly P&L snapshot
3. **Slack/Telegram commands** — `/revenue-today`, `/cashflow`, `/outstanding`
4. **Agent tasks** — trend analysis, financial planning, anomaly detection
5. **Data sources** — Xero, Monday (for repair values), BM API (for BM revenue), Shopify

---

### E. CUSTOMER SERVICE
**Current state:** Read Alex's workspace (the active CS agent), CS agent workspace, Intercom integration.

Define:
1. **Scripts** — Intercom metrics pull, response time tracking, conversation tagging automation, CSAT scoring
2. **Cron jobs** — morning inbox triage (currently agent-driven and should stay), daily metrics summary
3. **Slack/Telegram commands** — `/inbox-status`, `/customer <name>`, `/response-times`
4. **Agent tasks** — draft replies (Alex's core job), escalation handling, sentiment analysis, complaint pattern detection
5. **Data sources** — Intercom API, Monday (for repair status lookups)

---

### F. MARKETING & GROWTH
**Current state:** Read marketing agent workspace, intelligence platform, SEO docs.

Define:
1. **Scripts** — rank tracking scrapers (already built, need fixing), keyword monitoring, Google Search Console pulls, PostHog analytics, social media metrics
2. **Cron jobs** — weekly rank scans, daily GSC pulls, monthly competitor checks
3. **Slack/Telegram commands** — `/rankings <keyword>`, `/traffic-today`, `/conversion-rate`
4. **Agent tasks** — content strategy, ad campaign planning, SEO audit analysis, brief writing
5. **Data sources** — GSC, PostHog, Meta Ads, Google Ads, Shopify analytics

---

### G. PARTS & INVENTORY
**Current state:** Read parts agent workspace and scripts.

Define:
1. **Scripts** — stock level checker, reorder alert generator, usage trend calculator, supplier price comparisons, demand forecasting
2. **Cron jobs** — daily low-stock alerts, weekly usage reports, monthly supplier cost review
3. **Slack/Telegram commands** — `/stock <part>`, `/reorder-list`, `/supplier-price <part>`, `/usage <part>`
4. **Agent tasks** — supplier negotiation prep, demand pattern analysis, inventory strategy
5. **Data sources** — Monday (parts board), supplier APIs if any, repair data for demand

---

## Output format

Write to `/home/ricky/builds/agent-rebuild/automation-blueprint.md` with:

### 1. Executive Summary
- Total scripts needed (estimate)
- Total cron jobs needed
- Total Slack/Telegram commands needed
- Which agents survive and what they do
- Estimated build priority order

### 2. Per-Domain Blueprint
For each domain (A-G), a table:

| # | Type | Name | What It Does | Trigger | Data Source | Priority | Exists? |
|---|------|------|-------------|---------|-------------|----------|---------|

Priority: P1 (saves money or prevents errors now), P2 (improves efficiency), P3 (nice to have)
Exists: YES (already built), PARTIAL (needs fixing), NO (needs building)

### 3. Agent Roles (Redefined)
For each agent that survives, define:
- What it does (only LLM-worthy tasks)
- What it does NOT do anymore (moved to scripts)
- Estimated interactions per day
- Model recommendation (Opus/Sonnet/Haiku)

### 4. Slack Bot Command Registry
Complete list of all proposed slash commands across all domains.

### 5. Build Order
Sequenced list of what to build first, based on:
- Business impact (revenue, error prevention, time saved)
- Build effort (quick wins first)
- Dependencies (what blocks what)

### 6. What Already Exists
Cross-reference with existing scripts in `builds/backmarket/scripts/`, `builds/buyback-monitor/`, `builds/royal-mail-automation/`, parts agent scripts, and the marketing intelligence platform. Don't propose building what already works.

**Do NOT modify any files. Research and synthesis only.**
