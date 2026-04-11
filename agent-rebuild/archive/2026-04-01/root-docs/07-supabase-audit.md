# 07 — Supabase Audit

**Date:** 2026-02-25
**Purpose:** Understand the data layer before building data feed crons (Phase 1.5 in sequencing).

---

## Summary

**12 tables found. BUILD.md is stale and wrong.**

- 3 documented tables don't exist (agent_memory, work_item_history, workflow_templates)
- 5 undocumented tables exist (app_secrets, audit_snapshots, bm_price_history, memory_summaries, qa_reviews)

**Only 4 tables are actively used:**

| Table | Rows | What it is | Last activity |
|-------|------|-----------|---------------|
| agent_activity | 2,294 | Agent telemetry (session starts/ends) | Minutes ago |
| memory_facts | 719 | Facts synced from agent markdown files | Minutes ago |
| bm_price_history | 224 | Real BM sales data (prices, grades, dates) | 2026-02-23 |
| agent_messages | 29 | Inter-agent messages (mostly daily briefings) | Today |

**4 tables are empty/abandoned:**

| Table | Rows | What it was for |
|-------|------|----------------|
| business_state | 0 | KPIs, metrics, live business data -- never populated |
| memory_summaries | 0 | Consolidated memory rollups -- logic never built |
| audit_snapshots | 0 | Change tracking -- never wired to triggers |
| work_items | 15 | Kanban tasks -- ALL test data, no real work items |

**Key facts:**
- pgvector is NOT enabled (no semantic search capability in Supabase)
- RLS is wide open on everything except app_secrets
- The only actual business data is bm_price_history (224 sales records)
- Everything else is agent infrastructure data, not business data

---

## What This Means for Data Feed Crons

The question was: should crons pull from Supabase or directly from source APIs?

**Answer: Mostly from source APIs.** Supabase has almost no business data.

| Data feed | Source | Why |
|-----------|--------|-----|
| BM orders/returns/listings | BackMarket API direct | Not in Supabase |
| BM pricing history | Supabase `bm_price_history` | This data IS here (224 records) |
| Repair queue / Monday | Monday API direct | Not in Supabase |
| Team schedule | Monday API direct | Not in Supabase |
| Financial snapshot | Xero API direct | Not in Supabase |
| Open tickets | Intercom API direct | Not in Supabase |
| Finn stats | Intercom API direct | Not in Supabase |

**Long term:** As crons run and agents generate data, Supabase should accumulate business data. But right now, it is an agent telemetry store, not a business data store.

---

## Supabase as Source of Truth (Vision vs Reality)

**The vision:** Supabase becomes the central data store for the business. All business data flows through it. Agents, dashboards, and tools all read from one place.

**The reality:** Supabase currently stores:
- Agent telemetry (sessions, heartbeats, activity logs)
- Agent memory (facts synced from markdown files)
- One table of business data (BM pricing history)
- Test data in work_items

**The gap:** Business data lives in source systems:
- Monday.com (repairs, queue, team, parts)
- BackMarket API (orders, returns, listings, seller metrics)
- Xero (invoices, cash flow, P&L)
- Intercom (conversations, tickets, Finn performance)

**To close the gap, two options:**

### Option A: Crons write to Supabase, agents read from Supabase
```
Source APIs -> Cron -> Supabase tables -> Cron -> Agent data/ folder
```
- Supabase becomes the aggregation layer
- Dashboards, agents, and other tools all read from one place
- More infrastructure but more valuable long-term
- Requires creating new Supabase tables for each data domain

### Option B: Crons write directly to agent data/ folders
```
Source APIs -> Cron -> Agent data/ folder
```
- Simpler, fewer moving parts
- Agents get data faster (one hop instead of two)
- But data is only in markdown files in agent workspaces, not queryable
- Dashboards would need separate data pipelines

### Recommendation: Start with Option B, evolve to Option A

For Phase 2 (data feed crons), go direct from APIs to agent folders. This is simpler and proves the pattern faster. The agents don't care where the data comes from -- they just read markdown.

Once the pattern is working and you want dashboards/cross-domain analysis, add the Supabase aggregation layer. Create domain-specific tables (bm_orders, repair_queue, financial_metrics, etc.) and have crons write there too.

This way Supabase grows organically from proven data needs, not from a speculative schema design.

---

## Per-Table Detail

### agent_activity (ACTIVE -- 2,294 rows)
- Agent telemetry: session:start, session:end events
- ~287 actions/day. Dominated by jarvis and backmarket.
- Columns: id, agent_id, action_type, summary, work_item_id, target_agent, metadata, created_at
- No issues. Core telemetry.

### agent_heartbeats (ACTIVE -- 12 rows)
- One row per agent, upserted on session trigger
- last_completed is NULL for most agents (hook only records triggers, not completions)
- 4 agents stuck on status: unknown (finance, pm, qa-data, qa-code)
- Most active: jarvis (6:09 today), backmarket (5:20 today)

### agent_messages (ACTIVE -- 29 rows)
- Inter-agent messaging. Almost entirely systems -> jarvis daily briefings.
- All 29 messages marked is_read: true
- Low volume but high signal

### agent_registry (ACTIVE -- 30 rows, reference table)
- 5 domain_leads (4 active + finance disabled)
- 7 infrastructure (5 active + pm disabled)
- 18 sub_agents (ALL dormant)
- Last updated 2026-02-19

### app_secrets (LOCKED)
- Only table with working RLS. Permission denied. Contains webhook secrets.
- This is correct behaviour.

### audit_snapshots (EMPTY -- 0 rows)
- Designed for change tracking. Never wired to triggers. Dead table.

### bm_price_history (ACTIVE -- 224 rows)
- Real sales data: device type, chip, RAM, storage, grade, colour, sale price, date
- Only actual business data in Supabase
- Useful for pricing analysis and agent context
- Some NULL sale_dates

### business_state (EMPTY -- 0 rows)
- Key-value store for KPIs and metrics. Never populated.
- Could be useful if populated by crons.

### memory_facts (ACTIVE -- 719 rows)
- Facts synced from agent markdown files by sync-memory-to-supabase.py
- BM: 353, Jarvis: 236, Ops: 62, Systems: 36, Marketing: 18, CS: 14
- last_read_at is NULL for every row (bootstrap hook never marks reads)
- Core memory table. Working as designed.

### memory_summaries (EMPTY -- 0 rows)
- Designed for consolidated memory rollups. Consolidation logic never built.
- Could be useful for the decisions/ archival cron (Phase 4).

### qa_reviews (SEMI-ACTIVE -- 17 rows)
- QA pipeline test data. All from 2026-02-17 to 2026-02-22.
- No production reviews. Idle for 3 days.

### work_items (LOW ACTIVITY -- 15 rows)
- ALL test data. 8 complete, 7 cancelled, 0 open.
- Kanban system exists structurally but agents don't use it for real work.

---

## RLS Status

| Table | Anon access |
|-------|-------------|
| app_secrets | BLOCKED (proper) |
| All other 11 tables | OPEN (no RLS) |

Acceptable for internal server-side use only. Would be a security issue if anon key is exposed in client-side code (e.g., Mission Control dashboard if it queries Supabase directly).

---

## Actions / Recommendations

### Immediate (Phase 1.5)
- [ ] Update BUILD.md to reflect actual table state
- [ ] Decide: Option A (Supabase aggregation) or Option B (direct to agent folders) for data crons

### Phase 2 (data feed crons)
- [ ] BM pricing feed can pull from existing `bm_price_history` table
- [ ] All other feeds pull from source APIs directly (Monday, BM, Xero, Intercom)

### Future (when dashboards/cross-domain analysis needed)
- [ ] Create domain-specific tables (bm_orders, repair_queue, etc.)
- [ ] Enable pgvector if semantic search needed at scale
- [ ] Add RLS policies before exposing to any client-side code
- [ ] Populate business_state with KPI crons
- [ ] Wire audit_snapshots to triggers for change tracking
- [ ] Build memory consolidation for memory_summaries

---

*Created: 2026-02-25*
*Status: Audit complete. Feeds into Phase 2 data cron decisions.*
