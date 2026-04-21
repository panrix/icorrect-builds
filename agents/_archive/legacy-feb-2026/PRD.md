# Mission Control v2 — Product Requirements Document

**Date:** 2026-02-17
**Author:** Ricky (Founder, iCorrect / Panrix Limited) + Claude (Strategy Partner)
**Audience:** Claude Code on VPS (46.225.53.159) — this is your build spec.
**Status:** Approved for build

---

## How to Read This Document

This PRD is structured for sequential building. Each section is a buildable unit. Work through them in order — later sections depend on earlier ones.

**Conventions:**
- `code blocks` = exact values, file paths, or commands
- Tables = schema definitions or configuration specs
- **Bold** = critical decisions or constraints
- ⚠️ = things that will break if you get them wrong

**What's verified vs assumed:**
- All architecture decisions: verified (two full-day sessions + Code VPS checks on 2026-02-16)
- Current VPS state: verified by Code on 2026-02-16
- Supabase schema: designed but not yet deployed
- Agent configs: designed, not yet written
- Webhook flows: designed, not yet tested

---

## SECTION 1: EXECUTIVE SUMMARY

### What Mission Control Is
A multi-agent AI system that runs iCorrect's specialist Apple repair business. 15 top-level agents + ~20 sub-agents operate across distinct domains, coordinated by Jarvis as the primary interface to Ricky, who manages remotely from Bali (UTC+7, 7 hours ahead of London).

### Why the Rebuild
The current 11-agent system (deployed 2026-02-06) has fundamental architectural problems:
1. **Memory is broken** — no persistent structured storage. Agents forget everything between sessions. QMD semantic search silently failed (no embedding API key). MEMORY.md was 40% duplicated foundation docs.
2. **No workflow engine** — agents respond to messages but can't initiate work, hand off tasks, or run review loops autonomously.
3. **No cross-agent coordination** — agents operate in isolation. Jarvis can't see what domain agents are discussing. No shared state.
4. **No quality assurance** — nothing is checked before it ships. No review loops, no fact verification, no code review.
5. **Flat file memory** — everything stored in markdown files on disk. No query capability, no conflict resolution, no audit trail.

### What Changes
| Aspect | Current (v1) | Rebuild (v2) |
|--------|-------------|-------------|
| Memory | Flat files (MEMORY.md) | Supabase structured storage + Git |
| Agents | 11 (all same model) | 15 top-level + ~20 sub-agents (multi-model) |
| QA | None | 3 QA specialists (Plan, Code, Data) |
| Workflow | Manual (message-triggered only) | Automated (cron + webhook + message) |
| Cross-agent | Symlinks to reports dir | Supabase agent_messages table |
| Audit trail | None | Supabase activity log + Telegram channels |
| Infrastructure | n8n + PM2 + systemd | Supabase + Git + OpenClaw (n8n removed) |

### Core Principles
- **"Overkill is the right way"** — build properly from the start. Redundant quality checks are not waste.
- **"And, not or"** — use current system for real business NOW while building the rebuild in parallel.
- **"Search, don't load"** — agents know what exists and where to find it. Small index auto-injected, full content on demand.
- **"If you don't know, search before you answer. Never guess."** — the single most important instruction in the system.
- **"Text > Brain"** — if it matters, write it down.
- **"Solutions, not problems"** — every issue comes with a recommendation.

---

## SECTION 2: ARCHITECTURE OVERVIEW

### Three Pillars

```
┌─────────────────────────────────────────────────────┐
│                    MISSION CONTROL                    │
│                                                       │
│  ┌───────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │    Git     │  │   Supabase   │  │   OpenClaw    │ │
│  │           │  │              │  │               │ │
│  │ Source of  │  │  Persistent  │  │    Agent      │ │
│  │  truth    │  │  structured  │  │   runtime     │ │
│  │ for files │  │   storage    │  │               │ │
│  │           │  │              │  │               │ │
│  │ SOUL files │  │ Agent memory │  │ Sessions      │ │
│  │ CLAUDE.md  │  │ Work items   │  │ Model config  │ │
│  │ Foundation │  │ Messages     │  │ Tool access   │ │
│  │ Scripts    │  │ Business     │  │ Telegram      │ │
│  │ SOPs       │  │  state       │  │ Slack         │ │
│  │ Configs    │  │ Activity log │  │ Webhooks      │ │
│  └───────────┘  └──────────────┘  └───────────────┘ │
│        │                │                 │           │
│        └────────────────┼─────────────────┘           │
│                         │                             │
│              Agents read from all three               │
│              Agents write to Supabase                 │
│              Git changes via PR/review                │
│              OpenClaw manages sessions                │
└─────────────────────────────────────────────────────┘
```

**Git** — Single repository for all files. SOUL files, CLAUDE.md files, foundation docs, scripts, SOPs, configs. Shared between Claude.ai (strategy), Code (building), and agents (reading). Solves the alignment problem — everyone reads from the same source of truth.

**Supabase** — Persistent structured storage. Agent memory, cross-agent messages, work items, business state, activity logs. The workflow engine backbone. Free tier initially, upgrade to Pro ($25/month) when production-ready.

**OpenClaw** — Agent runtime. Each agent is a separate registration with own session store, own model config, own workspace. Sessions are per-agent, per-channel (confirmed by Code on VPS 2026-02-16).

### Interaction Model

Ricky can talk to Jarvis OR domain agents directly. Jarvis always has full visibility via Supabase. Domain agents are specialists who own their domains completely. Jarvis is C-suite exec (business strategy, coordination, briefings), NOT a message router or agent manager.

```
                     RICKY
                    /     \
              Jarvis       Domain Agents (directly)
             /  |  \           |
           PM  QA  Systems    Each owns its domain
```

### Multi-Model Strategy

| Model | Usage | Agents |
|-------|-------|--------|
| Opus 4.6 | Complex reasoning, coordination, synthesis | Jarvis |
| Sonnet | Domain expertise, analysis, QA review | All domain leads, QA agents, PM |
| Haiku | High volume, low complexity, monitoring | Schedule, Systems health checks, sub-agents |
| External (Kimi, etc.) | Offload routine work, preserve Anthropic quota | As tools invoked by agents, not agents themselves |

**Claude Max plan: Maximum Flexibility (20x) — ~900 messages per 5 hours, ~4,320/day.** This is the budget. Multi-model strategy ensures Opus is reserved for Jarvis's complex thinking, Sonnet handles the bulk of domain work, and Haiku/external models handle high-volume monitoring.

⚠️ **Model is not tied to agent identity.** An agent is a role. The model underneath is configurable and swappable in OpenClaw config. If costs spike, domain leads can be moved from Sonnet to Haiku for routine tasks without rebuilding the agent.

### External Models as Tools

External models (Kimi, Codex, etc.) are TOOLS that agents can invoke, not agents themselves. Build a generic `external_model` tool:

```
Input: model_identifier, prompt, optional_context
Output: model_response
```

This allows any agent to call an external model when appropriate, preserving Anthropic quota for high-value reasoning.

---

## SECTION 3: AGENT HIERARCHY

### Full Org Chart

```
Ricky
└── Jarvis (C-suite — Opus)
    ├── PM (workflow orchestration — Sonnet)
    ├── QA-Plan (strategy/plan review — Sonnet)
    ├── QA-Code (code review — Sonnet)
    ├── QA-Data (fact verification — Sonnet)
    │
    ├── Operations (domain lead — Sonnet)
    │   ├── Intake (Adil's process)
    │   ├── Queue (repair/refurb assignment + diagnostic bridge)
    │   ├── SOP (documentation)
    │   └── QC-Process (Roni's workflows)
    │
    ├── Backmarket (domain lead — Sonnet)
    │   ├── Listings
    │   ├── Pricing
    │   ├── Grading
    │   └── BM-Ops
    │
    ├── Finance (domain lead — Sonnet)
    │   ├── Cash Flow (includes HMRC payment plan monitoring)
    │   └── KPIs
    │
    ├── Parts (domain lead — Sonnet)
    │   ├── Stock
    │   ├── Nancy
    │   └── Forecasting
    │
    ├── Team (domain lead — Sonnet)
    │   ├── Performance
    │   └── Hiring
    │
    ├── Finn (domain lead — Sonnet)
    │   ├── Intercom
    │   └── Escalation
    │
    ├── Website (domain lead — Sonnet)
    │   ├── PostHog
    │   ├── Shopify
    │   └── Conversion
    │
    ├── Marketing (domain lead — Sonnet)
    │   ├── Content
    │   ├── SEO
    │   └── AdWords (when live)
    │
    ├── Schedule (calendar, timezone bridge — Haiku)
    │
    └── Systems (infrastructure watchdog — Haiku/Sonnet)
        ├── VPS
        ├── Services
        └── Deployment
```

### Agent Types

| Type | Count | Description |
|------|-------|-------------|
| Infrastructure | 5 | Jarvis, PM, QA-Plan, QA-Code, QA-Data — run the system itself |
| Domain leads | 10 | Backmarket, Finance, Operations, Team, Parts, Marketing, Website, Schedule, Finn, Systems |
| Sub-agents | ~20 | Pre-configured specialists under domain leads |

### Agent Registry Table

Every agent is registered in Supabase `agent_registry`:

```sql
CREATE TABLE agent_registry (
  agent_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('infrastructure', 'domain_lead', 'sub_agent')),
  parent_agent TEXT REFERENCES agent_registry(agent_id),
  model TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dormant', 'disabled')),
  telegram_group_id TEXT,
  cron_schedule TEXT,
  expected_heartbeat_interval_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Sub-Agent Design

Sub-agents are **pre-configured** with own SOUL, own memory, own workspace. They are NOT spawned dynamically. Domain leads manage them; domain leads don't create them.

Sub-agents have **no Telegram presence** — they're background workers. They communicate with their domain lead through Supabase `agent_messages`. Ricky never interacts with sub-agents directly.

### Telegram Structure

One Telegram group per domain lead (10 groups) + Jarvis DM + PM status channel = 12 Telegram bindings total.

| Agent | Telegram Binding |
|-------|-----------------|
| Jarvis | DM (existing @RickysJarvis_bot) + Slack |
| PM | Dedicated group (read-only status updates) |
| Operations | Dedicated group |
| Backmarket | Dedicated group |
| Finance | Dedicated group |
| Parts | Dedicated group |
| Team | Dedicated group |
| Finn | Dedicated group |
| Website | Dedicated group |
| Marketing | Dedicated group |
| Schedule | Dedicated group |
| Systems | Dedicated group (alerts) |

QA agents and sub-agents have NO Telegram binding. They operate internally.

### Key Design Decisions

**HMRC is NOT a Finance sub-agent.** HMRC debt is solved by revenue growth (Backmarket + Marketing + Operations), not by tracking it. Finance monitors the payment plan mechanics (£5k/month leaving the account) as part of Cash Flow.

**Diagnostic Bridge is folded into Operations → Queue.** The Queue sub-agent tracks what each tech is working on, flags where they're stuck, and surfaces that to Jarvis for briefings. Not a standalone agent.

**Three-strike rule is retired for the rebuild.** The agent structure is designed upfront based on known business needs. Three-strike applies going forward for genuinely new, unanticipated agents.

**Unused agent detection:** Jarvis flags agents with zero or near-zero activity over a 30-day period. Ricky decides: merge, deactivate, or keep dormant.

---

## SECTION 4: SUPABASE SCHEMA

### Database: mission_control (Supabase Free Tier → Pro when production-ready)

⚠️ **Supabase Free tier pauses after 7 days of inactivity.** Once agents are running daily heartbeats, this is not an issue. During initial build, be aware of the pause risk.

### Table: memory_facts

Atomic, timestamped, categorised facts. The core of agent memory.

```sql
CREATE TABLE memory_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES agent_registry(agent_id),
  namespace TEXT NOT NULL,  -- e.g., 'finance', 'backmarket', 'operations'
  category TEXT NOT NULL,   -- from shared taxonomy
  subcategory TEXT,         -- agent-defined extension
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence TEXT DEFAULT 'high' CHECK (confidence IN ('high', 'medium', 'low')),
  source TEXT,              -- where this fact came from
  supersedes UUID REFERENCES memory_facts(id),  -- if this replaces an older fact
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  
  UNIQUE(agent_id, namespace, key) -- prevents duplicate keys per agent
);

CREATE INDEX idx_memory_facts_namespace ON memory_facts(namespace);
CREATE INDEX idx_memory_facts_agent ON memory_facts(agent_id);
CREATE INDEX idx_memory_facts_category ON memory_facts(category);
CREATE INDEX idx_memory_facts_archived ON memory_facts(is_archived) WHERE is_archived = FALSE;
```

**Namespace rules:**
- Agents write ONLY to their own namespace (`finance:*`, `backmarket:*`, etc.)
- Agents can READ from any namespace
- Jarvis can read ALL namespaces (for cross-domain synthesis in briefings)
- New top-level categories require a taxonomy file update reviewed by QA-Plan
- Agents can create subcategories within their namespace freely

**Conflict resolution:**
- When writing a fact with a key that already exists in the agent's namespace, the old fact is archived (is_archived = TRUE) and the new fact's `supersedes` field points to the old one
- Both facts are preserved — nothing is deleted, only archived
- QA-Data spot-checks for cross-namespace conflicts during maintenance

### Table: memory_summaries

Evolving domain summaries that agents maintain and update.

```sql
CREATE TABLE memory_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES agent_registry(agent_id),
  namespace TEXT NOT NULL,
  domain TEXT NOT NULL,     -- e.g., 'revenue', 'team_performance', 'parts_stock'
  summary TEXT NOT NULL,
  fact_count INTEGER,       -- how many facts this summary is based on
  last_consolidated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(agent_id, namespace, domain)
);
```

### Table: agent_activity

Structured log of all significant actions. The audit trail.

```sql
CREATE TABLE agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES agent_registry(agent_id),
  action_type TEXT NOT NULL,  -- 'task:created', 'handoff', 'review:approved', 'review:rejected', 'research', 'deliverable', 'error', 'alert'
  summary TEXT NOT NULL,
  work_item_id UUID REFERENCES work_items(id),
  target_agent TEXT REFERENCES agent_registry(agent_id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_activity_agent ON agent_activity(agent_id);
CREATE INDEX idx_agent_activity_work_item ON agent_activity(work_item_id);
CREATE INDEX idx_agent_activity_created ON agent_activity(created_at DESC);
CREATE INDEX idx_agent_activity_type ON agent_activity(action_type);
```

**Example entries:**
```
[2026-02-16 09:00] [jarvis] [task:created] Intake redesign — source: Ricky voice note
[2026-02-16 09:02] [jarvis] [handoff] Assigned intake redesign → operations
[2026-02-16 09:15] [operations] [research] Queried current intake process
[2026-02-16 10:30] [operations] [deliverable] Intake plan v1 submitted
[2026-02-16 10:50] [qa-plan] [review:rejected] Missing error handling
[2026-02-16 11:15] [operations] [revision] Intake plan v2 submitted
[2026-02-16 11:30] [qa-plan] [review:approved] Intake plan v2 approved
```

### Table: agent_messages

Cross-agent communication, threaded to work items.

```sql
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent TEXT NOT NULL REFERENCES agent_registry(agent_id),
  to_agent TEXT NOT NULL REFERENCES agent_registry(agent_id),
  work_item_id UUID REFERENCES work_items(id),
  message_type TEXT NOT NULL CHECK (message_type IN ('request', 'response', 'handoff', 'escalation', 'info')),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_messages_to ON agent_messages(to_agent, is_read);
CREATE INDEX idx_agent_messages_work_item ON agent_messages(work_item_id);
```

### Table: work_items

Tasks with stages, assignments, review states, handoff triggers. The workflow engine.

```sql
CREATE TABLE work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  source_input TEXT,         -- Ricky's EXACT words/voice note transcript. Never modified.
  source_type TEXT CHECK (source_type IN ('voice_note', 'telegram', 'slack', 'system', 'agent')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'clarification_needed', 'confirmed', 'assigned',
    'in_progress', 'submitted', 'in_review', 'revision_needed',
    'approved', 'building', 'build_review', 'complete', 'blocked', 'cancelled'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  priority_tier TEXT DEFAULT 'internal' CHECK (priority_tier IN ('customer_facing', 'operational', 'internal')),
  assigned_to TEXT REFERENCES agent_registry(agent_id),
  reviewed_by TEXT REFERENCES agent_registry(agent_id),
  created_by TEXT NOT NULL REFERENCES agent_registry(agent_id),
  parent_item UUID REFERENCES work_items(id),  -- for sub-tasks
  rejection_count INTEGER DEFAULT 0,
  max_rejections INTEGER DEFAULT 3,
  stuck_threshold_minutes INTEGER,  -- based on priority_tier
  locked_at TIMESTAMPTZ,
  locked_by TEXT REFERENCES agent_registry(agent_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_work_items_status ON work_items(status);
CREATE INDEX idx_work_items_assigned ON work_items(assigned_to);
CREATE INDEX idx_work_items_priority ON work_items(priority_tier, priority);
CREATE INDEX idx_work_items_stuck ON work_items(status, updated_at) 
  WHERE status NOT IN ('complete', 'cancelled');
```

**Source anchoring:** `source_input` is the original, unmodified input from Ricky. Every agent in the chain can reference it. This prevents hallucination compounding — agents check their work against the original intent, not the previous agent's interpretation.

**Work item locking:** When an agent starts a work item, it sets `locked_by` and `locked_at`. No other agent can pick up that item while locked.

**Stuck threshold by priority tier:**
- `customer_facing`: 5 minutes (live repairs, enquiries)
- `operational`: 15 minutes (internal workflows)
- `internal`: 60 minutes (planning, documentation)

### Table: business_state

KPIs, inventory, queue status. Each field owned by one agent.

```sql
CREATE TABLE business_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,      -- 'revenue', 'parts', 'queue', 'team', etc.
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  value_type TEXT DEFAULT 'text' CHECK (value_type IN ('text', 'number', 'boolean', 'json')),
  owned_by TEXT NOT NULL REFERENCES agent_registry(agent_id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(domain, key)
);

CREATE INDEX idx_business_state_domain ON business_state(domain);
CREATE INDEX idx_business_state_owner ON business_state(owned_by);
```

⚠️ **Only the owning agent can write to a business_state row.** Others can read. This prevents conflicting writes.

### Table: agent_heartbeats

Health monitoring for all agents.

```sql
CREATE TABLE agent_heartbeats (
  agent_id TEXT PRIMARY KEY REFERENCES agent_registry(agent_id),
  last_triggered TIMESTAMPTZ,
  last_completed TIMESTAMPTZ,
  status TEXT DEFAULT 'unknown' CHECK (status IN ('healthy', 'degraded', 'unresponsive', 'unknown')),
  last_error TEXT,
  dependency_check JSONB,  -- {"supabase": true, "memory_search": true, "tools": true}
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: audit_snapshots

Write-ahead log for critical table modifications.

```sql
CREATE TABLE audit_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  row_id UUID NOT NULL,
  agent_id TEXT NOT NULL REFERENCES agent_registry(agent_id),
  operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  before_value JSONB,
  after_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_snapshots_table_row ON audit_snapshots(table_name, row_id);
CREATE INDEX idx_audit_snapshots_created ON audit_snapshots(created_at DESC);
```

⚠️ **Every write to `business_state` and `memory_summaries` MUST go through the wrapper function that automatically creates an audit snapshot.** Agents never write to these tables directly.

### Memory Taxonomy File

Store in Git at `config/memory-taxonomy.yaml`:

```yaml
# Top-level categories — changes require QA-Plan review
categories:
  revenue:
    description: "Revenue figures, forecasts, targets"
    primary_owner: finance
  costs:
    description: "Expenses, operational costs, debt"
    primary_owner: finance
  parts:
    description: "Stock levels, orders, suppliers"
    primary_owner: parts
  repairs:
    description: "Repair queue, diagnostics, turnaround"
    primary_owner: operations
  refurbishment:
    description: "Refurb pipeline, grading, listings"
    primary_owner: backmarket
  team:
    description: "Performance, morale, hiring, dynamics"
    primary_owner: team
  customers:
    description: "Client interactions, satisfaction, complaints"
    primary_owner: finn
  marketing:
    description: "Campaigns, conversion, SEO, content"
    primary_owner: marketing
  website:
    description: "Analytics, conversion rate, Shopify"
    primary_owner: website
  systems:
    description: "Infrastructure, services, monitoring"
    primary_owner: systems
  processes:
    description: "SOPs, workflows, intake, queue logic"
    primary_owner: operations
  decisions:
    description: "Ricky's decisions, strategic direction"
    primary_owner: jarvis

# Agents can create subcategories within their namespace freely
# Example: parts agent creates parts:nancy, parts:tcon, parts:forecasting
```

---

## SECTION 5: MEMORY ARCHITECTURE

### Three-Layer Model

**Layer 1 — Hot Memory (Session Context)**
What's in the agent's context window right now. Managed by OpenClaw's workspace bootstrap. Kept lean (~10-15KB total auto-injected):
- SOUL.md (identity)
- CLAUDE.md (operational rules + master map)
- MEMORY.md (curated learned knowledge — rebuilt from Supabase on each session start)
- Small index files for tools, SOPs

Everything else loaded on demand via read tool or Supabase query.

**Layer 2 — Warm Memory (Supabase)**
Facts, summaries, activity logs, work items, cross-agent messages. Queryable, timestamped, with conflict resolution. This is the primary persistent store.

**Layer 3 — Cold Memory (Audit Trail)**
Full conversation logs in Telegram channels. Raw transcripts. audit_snapshots table. Never loaded into context but available for tracing decisions back to their source.

### Bootstrap Strategy (Index + Detail Pattern)

Every large file should be split into a small index (auto-injected) and detail files (read on demand).

**Example — TOOLS.md:**
```
TOOLS.md (auto-injected, ~2KB index)
  → "For full docs, read tools/{tool-name}.md"

tools/
├── monday.md
├── intercom.md
├── supabase.md
├── telegram.md
├── memory-search.md
└── external-model.md
```

This pattern applies to: tools, SOPs, foundation docs, agent reports, memory.

**Bootstrap budget: 45,000 characters** (set on 2026-02-16).

### Write Rules

Agents follow explicit rules when writing to memory:
1. Extract discrete facts, not raw conversation
2. Categorise every fact using the shared taxonomy
3. Check for existing facts with the same key before writing (upsert with archive)
4. Write with explicit timestamps and confidence levels
5. Include source (where did this fact come from?)
6. MEMORY.md "is not just for you — it's your report to the coordinator"

### Memory Maintenance

**Nightly (10pm UTC) — Centralised Janitor (Python script, zero AI cost):**
- Delete exact duplicate facts (same agent, same key, same value)
- Archive facts older than 90 days that haven't been read (last_read_at)
- Flag facts with no category or malformed keys
- Check for orphaned records (facts referencing deleted work items)
- Generate maintenance report in Supabase

**Weekly (Sunday 10pm UTC) — Domain Semantic Consolidation:**
- Systems agent checks which domains had write activity that week
- Only active domains get triggered
- Each active domain lead reviews its namespace for contradictory facts
- Updates domain summary (memory_summaries)
- Flags stale facts that might be outdated
- **Cost: ~10-15 Sonnet messages per week**

**Conflict resolution for cross-namespace facts:**
- QA-Data spot-checks detect conflicts across namespaces
- Flags to Jarvis with both facts and their sources
- Jarvis resolves (determines which is correct or that both are correct in context)
- QA-Data verifies Jarvis's resolution
- Resolved fact updated, superseded fact archived with pointer to resolution

### OpenClaw Memory Integration

**Embedding API: OpenAI** (configured in all agent auth-profiles)

Current OpenClaw memory features (confirmed working after 2026-02-16 fixes):
- QMD with OpenAI embeddings for semantic search across local files
- session-memory hook saves sessions on /new (50 messages)
- memoryFlush at 20k tokens saves before compaction
- MEMORY.md auto-injected into bootstrap (45k budget)
- command-logger hook enabled

**Custom Supabase hooks to build:**

| Hook | Event | Action |
|------|-------|--------|
| `supabase-memory` | command:new | Extract key facts from session, write to memory_facts, update memory_summaries |
| `supabase-bootstrap` | agent:bootstrap | Query Supabase for agent's latest memory summary, inject into context |
| `agent-activity-logger` | session events | Log significant actions to agent_activity table |
| `workflow-trigger` | work item status change | Fire webhook to trigger next agent in pipeline |
| `heartbeat-writer` | agent:bootstrap + session end | Write to agent_heartbeats at start and completion of every session |
| `dependency-check` | agent:bootstrap | Verify Supabase, memory search, and tools are available before proceeding |

---

## SECTION 6: WORKFLOW ENGINE

### Supabase as Workflow Engine

Work items have stages, assignments, review states, handoff triggers. Status changes in the work_items table drive the workflow. When status changes, webhooks fire to trigger the next agent.

### Trigger Types

Agents only "think" when triggered. Three mechanisms:

| Trigger | Use Case | Implementation |
|---------|----------|---------------|
| Message | User sends Telegram/Slack message | OpenClaw native |
| Cron | Scheduled jobs (heartbeats, monitoring, briefings, maintenance) | System cron → Python script → OpenClaw API |
| Webhook | Supabase row change triggers next agent | Supabase webhook → Cloudflare Worker → Python script on VPS |

### Webhook Flow

```
Supabase (row change)
  → Cloudflare Worker (fast, cheap, global)
    → HTTP POST to VPS Python script
      → Python script triggers OpenClaw agent session
```

**Webhook reliability requirements:**
- Retries with exponential backoff: 1 min, 2 min, 4 min, 8 min (max 3 retries)
- Every webhook handler must be **idempotent** (running it twice = same result as once)
- Dead letter logging: after 3 failed retries, log to agent_activity with action_type 'error'
- Alert to Systems agent after failed retries

### Reconciliation Cron

Runs every 5 minutes. Pure Python script querying Supabase — no AI cost.

```python
# Pseudocode for reconciliation check
stuck_items = query work_items WHERE:
  status NOT IN ('complete', 'cancelled', 'draft')
  AND updated_at < (NOW() - stuck_threshold_minutes based on priority_tier)
  AND locked_by IS NOT NULL

for item in stuck_items:
  log alert to agent_activity
  send Telegram alert to Systems group
  send Telegram alert to Jarvis DM
```

**Stuck thresholds:**
- `customer_facing`: 5 minutes
- `operational`: 15 minutes  
- `internal`: 60 minutes

### Alert Flow

```
Stuck item detected by reconciliation cron
  → Telegram alert to Jarvis + Systems group + Ricky
  → Jarvis acknowledges within 10 minutes
    → If acknowledged: Jarvis investigates, reports resolution
    → If NOT acknowledged within 10 minutes: second escalation to Ricky
      with message "Jarvis hasn't responded to this alert"
```

### QA Review Loop

ALL work (plans AND code) must be checked by another agent. The reviewer is NEVER the builder.

```
Builder produces work
  → work_item status → 'submitted'
  → Webhook triggers appropriate QA agent
  → QA reviews
    → APPROVED: status → 'approved', work continues
    → REJECTED: status → 'revision_needed', feedback written to agent_messages
      → Builder revises, resubmits
      → QA re-reviews
      → Loop until approved OR rejection_count >= max_rejections (3)
        → After 3 rejections: escalate to Jarvis → escalate to Ricky
```

### User Involvement Points

| Pull Ricky In | Keep Going Autonomously |
|---------------|------------------------|
| Vision, strategic direction | Research, information gathering |
| Key decisions, sign-offs | Drafting plans and documents |
| Clarification of vague inputs | QA review loops |
| Anything affecting reputation | Code review and builds |
| Financial decisions | Maintenance and monitoring |
| Hiring decisions | Internal coordination |

### Clarification Step

When Jarvis receives a vague direction from Ricky:
1. Jarvis writes back: "I'm reading this as: [specific brief]. Correct?"
2. Ricky confirms or corrects (10-second interaction)
3. Confirmed interpretation becomes `source_input` on the work item
4. This is what QA checks against — preventing chain drift from original intent

### n8n: REMOVED

Every n8n workflow is replaced by a Python script triggered by cron or Supabase webhook. Agents write, test, deploy scripts. Everything version controlled in Git.

**Remove:** Docker container for n8n, all n8n-data, nginx config for n8n.icorrect.co.uk.

⚠️ **Do not remove n8n until all replacement scripts are tested and working.** Run parallel for one week minimum.

---

## SECTION 7: QA ARCHITECTURE

### Three QA Specialists

| QA Agent | Reviews | Model | Checks |
|----------|---------|-------|--------|
| QA-Plan | Plans, strategies, recommendations, config changes | Sonnet | Logical soundness, completeness, alignment with business goals, PRINCIPLES.md compliance |
| QA-Code | Code, scripts, builds, deployments | Sonnet | Bugs, edge cases, security, architecture, idempotency |
| QA-Data | Facts, numbers, sources, memory integrity | Sonnet | Data accuracy, source verification, cross-namespace conflicts |

### Protected Files

QA agents' own SOUL files are **locked from Jarvis write access.** Only Ricky can change QA agent definitions. This prevents the coordinator weakening the quality gate.

Protected files (require Ricky's explicit approval to modify):
- `agents/qa-plan/SOUL.md`
- `agents/qa-code/SOUL.md`
- `agents/qa-data/SOUL.md`
- `config/memory-taxonomy.yaml`

### On-Demand Audit

`/audit` command available when something feels off. Triggers comprehensive review of a specific area. Ricky or Jarvis can invoke.

### Trust Model

Initially: ALL config changes (SOUL files, CLAUDE.md, workflow templates) require Ricky's sign-off.

Over time: As Jarvis proves good judgment, loosen to only protected files requiring approval. Non-critical config changes (tool additions, minor CLAUDE.md updates) can be approved by QA-Plan without Ricky.

---

## SECTION 8: AGENT HEALTH MONITORING

### Systems Agent Responsibilities

Systems agent is the infrastructure watchdog. Runs on Haiku for routine checks, escalates to Sonnet for diagnosis.

**Health sweep cron — every 15 minutes:**

```python
# Check 1: Supabase connectivity
# Check 2: OpenClaw gateway status  
# Check 3: VPS resources (disk > 80%, memory > 85%, CPU sustained > 90%)
# Check 4: Agent heartbeat freshness (per-agent thresholds from agent_registry)
# Check 5: SSL certificate expiry (< 14 days = alert)
# Check 6: Webhook queue (any items older than stuck threshold)
```

**Agent heartbeat thresholds:**

| Agent | Expected Activity | Alert if silent for |
|-------|------------------|-------------------|
| Jarvis | Multiple times daily | 4 hours during 6am-10pm UTC |
| Domain leads | At least daily | 48 hours |
| Sub-agents | Varies | Based on cron schedule + 2x buffer |
| QA agents | Triggered by work | 72 hours (no work = no trigger = OK) |
| Systems | Every 15 min (self-check) | 30 minutes |

### Dependency Self-Check

⚠️ **This is critical. The silent embedding search failure in v1 is the exact failure mode this prevents.**

On every agent bootstrap, before any work begins:

```python
# Mandatory dependency check
checks = {
  "supabase": can_connect_to_supabase(),
  "memory_search": can_query_embeddings(),
  "tools": all_configured_tools_available(),
  "workspace": soul_file_exists() and claude_md_exists()
}

if not all(checks.values()):
  # Write failure to LOCAL file (Supabase might be down)
  log_to_local("/tmp/agent-health/{agent_id}.json", checks)
  # Alert via Telegram (direct API, not through Supabase)
  send_telegram_alert(f"Agent {agent_id} failed dependency check: {checks}")
  # REFUSE TO OPERATE
  raise DependencyError("Cannot proceed with degraded dependencies")
```

**Agents must refuse to operate in a degraded state.** A response with missing capabilities is worse than no response — it creates false confidence.

### Alert Routing

| Severity | What | Alert To |
|----------|------|----------|
| Critical | Supabase down, OpenClaw down, VPS resources critical | Immediate Telegram to Ricky + Jarvis |
| High | Agent unresponsive, webhook failures, stuck work items | Telegram to Jarvis, Jarvis investigates and reports to Ricky |
| Medium | Agent degraded, disk space warning, SSL expiry approaching | Telegram to Jarvis, included in daily briefing |
| Low | Maintenance report, unused agent detection | Daily briefing only |

### Supabase Outage Protocol

When Supabase is unreachable:
1. Systems agent detects within 15 minutes (health sweep)
2. Immediate Telegram alert to Ricky + Jarvis
3. All agents PAUSE — do not attempt to operate without persistent memory
4. **Exception:** Jarvis can respond to direct messages from Ricky using session context only, but must flag: "Operating without Supabase — session memory only"
5. When Supabase returns, Systems agent confirms connectivity and resumes all agents
6. Systems agent runs integrity check on last-written data

---

## SECTION 9: PM AGENT SPECIFICATION

### Why PM Matters

PM is the second most critical agent after Jarvis. It's the workflow state machine — knows what stage every active work item is in, what should happen next, and whether it's happening on time.

### How PM Becomes Aware of Work

**PM runs a sweep cron every 5 minutes.** Not webhook-triggered. PM is the safety net — if webhooks break (which PM is supposed to catch), PM can't depend on webhooks for its own awareness.

The sweep reads:
1. All work_items where status changed in the last 5 minutes
2. All work_items that are overdue based on stuck_threshold_minutes
3. All agent_messages marked as unread and older than 15 minutes

### PM's Telegram Group

PM posts a daily workflow summary at 9pm UTC (before maintenance window):
- What moved today
- What's stuck and why
- What's waiting on Ricky
- Work item counts by status
- QA rejection rate

Ricky reads it if he wants detail beyond Jarvis's briefing. PM's Telegram is read-only status updates — Ricky does NOT message PM directly.

### Conflict Detection

When PM detects overlapping work (two agents touching the same area):
1. PM pauses the NEWER work item
2. PM alerts Jarvis via agent_messages
3. Jarvis decides: coordinate the agents or escalate to Ricky
4. PM does NOT decide — it detects and pauses. Decision authority stays with Jarvis/Ricky.

### Workflow Templates

Stored in Git at `config/workflows/`. PM reads them but doesn't own them. Changes reviewed by QA-Plan.

```yaml
# config/workflows/standard-plan.yaml
name: standard_plan
description: "Standard workflow for plans and strategies"
stages:
  - status: draft
    next: clarification_needed OR confirmed
    actor: jarvis
  - status: clarification_needed
    next: confirmed
    actor: ricky
    timeout_minutes: null  # no timeout on Ricky
  - status: confirmed
    next: assigned
    actor: jarvis
  - status: assigned
    next: in_progress
    actor: domain_agent
  - status: in_progress
    next: submitted
    actor: domain_agent
  - status: submitted
    next: in_review
    actor: system  # auto-transition
  - status: in_review
    next: approved OR revision_needed
    actor: qa-plan
  - status: revision_needed
    next: submitted
    actor: domain_agent
    max_loops: 3
    on_max_loops: escalate_to_jarvis
  - status: approved
    next: complete OR building
    actor: jarvis  # decides if it needs a build phase
```

### PM Model

Sonnet. Needs decent reasoning to detect anomalies and understand workflow state, but not doing creative thinking.

---

## SECTION 10: AUDIT TRAIL

### Two Components

**The Log (Structured) — agent_activity table:**
Every handoff, decision, status change gets a one-line entry. Timestamp, agent, action type, brief summary. What PM reads for status tracking. What Ricky scans for a quick picture.

**The Conversation (Unstructured) — Telegram channels + agent_messages:**
Full agent-to-agent reasoning. Where agents explain reasoning, debate approaches, push back. Not read in real time — exists for debugging and tracing decisions.

**The relationship:** The log tells you what happened. The conversation tells you why. Both anchored to work_item.id.

### Write-Ahead Audit for Critical Tables

Every write to `business_state` and `memory_summaries` automatically creates an audit snapshot:

```python
# Wrapper function — ALL agents use this, never write directly
async def write_business_state(agent_id, domain, key, value, value_type='text'):
    # Step 1: Read current value
    current = await supabase.table('business_state').select('*').eq('domain', domain).eq('key', key).single()
    
    # Step 2: Snapshot the before state
    if current:
        await supabase.table('audit_snapshots').insert({
            'table_name': 'business_state',
            'row_id': current['id'],
            'agent_id': agent_id,
            'operation': 'update',
            'before_value': current,
            'after_value': {'domain': domain, 'key': key, 'value': value}
        })
    
    # Step 3: Perform the write
    await supabase.table('business_state').upsert({
        'domain': domain,
        'key': key,
        'value': value,
        'value_type': value_type,
        'owned_by': agent_id,
        'updated_at': 'now()'
    })
```

---

## SECTION 11: RISK MITIGATIONS

### Hallucination Compounding in Chains

**Problem:** Each agent interprets the previous agent's summary. By the 3rd hop, output may have drifted from Ricky's original intent.

**Mitigations:**
1. **Source anchoring:** `source_input` on work_items contains Ricky's exact words. Every agent references the original.
2. **Clarification step:** Vague inputs get confirmed before work begins.
3. **QA-Data verification:** At every handoff where facts are passed.
4. **Audit trail:** Every handoff logged. Trace where drift occurred.

**Acknowledged limitation:** QA can verify facts, logic, and code. It CANNOT verify whether work matches Ricky's intent if intent wasn't precisely stated. This is why Ricky stays in the loop at sign-off points.

### Concurrent Agent Conflicts

**Mitigations:**
1. **Domain ownership:** Each business_state field has one owner.
2. **Work item locking:** `locked_by` + `locked_at` prevents double-processing.
3. **PM as conflict detector:** Pauses newer overlapping work, alerts Jarvis.
4. **Namespace isolation:** memory_facts namespaced by agent.

### Git + Agent Write Access

**Mitigations:**
1. **QA-Plan reviews all config changes** before commit.
2. **Protected files** locked from Jarvis (QA SOUL files, taxonomy).
3. **Git history** = full rollback capability.
4. **Change log** in agent_activity for every config change.
5. **Trust earned through competence** — initially all changes need Ricky's sign-off.

### VPS Resource Exhaustion

**Mitigations:**
1. **Concurrency limit:** Max 3 agent sessions simultaneously. 4th queues with 30-second timeout.
2. **VPS is production runtime, not dev environment.** Heavy builds happen locally.
3. **Systems agent monitors** disk, memory, CPU every 15 minutes.
4. **Maintenance window at 10pm UTC** — no user-facing triggers during nightly jobs.

### Webhook Failures

**Mitigations:**
1. **Exponential backoff retries** (3 max).
2. **Idempotent handlers** (mandatory design requirement).
3. **Reconciliation cron** every 5 minutes catches stuck items.
4. **Alert flow** to Jarvis + Ricky for unresolved failures.

---

## SECTION 12: FILE SYSTEM DESIGN

### Git Repository Structure

Single repository: `mission-control`

```
mission-control/
├── README.md
├── foundation/                    # Company constitution (read by all agents)
│   ├── COMPANY.md
│   ├── GOALS.md
│   ├── PRINCIPLES.md
│   ├── PROBLEMS.md
│   ├── RICKY.md
│   ├── TEAM.md
│   └── VISION.md
│
├── agents/                        # Agent definitions
│   ├── jarvis/
│   │   ├── SOUL.md
│   │   ├── CLAUDE.md
│   │   └── MEMORY.md             # Rebuilt from Supabase on deploy
│   ├── pm/
│   │   ├── SOUL.md
│   │   ├── CLAUDE.md
│   │   └── MEMORY.md
│   ├── qa-plan/
│   │   ├── SOUL.md               # PROTECTED — Ricky only
│   │   ├── CLAUDE.md
│   │   └── MEMORY.md
│   ├── qa-code/
│   │   ├── SOUL.md               # PROTECTED — Ricky only
│   │   ├── CLAUDE.md
│   │   └── MEMORY.md
│   ├── qa-data/
│   │   ├── SOUL.md               # PROTECTED — Ricky only
│   │   ├── CLAUDE.md
│   │   └── MEMORY.md
│   ├── operations/
│   │   ├── SOUL.md
│   │   ├── CLAUDE.md
│   │   ├── MEMORY.md
│   │   └── sub-agents/
│   │       ├── intake/
│   │       │   ├── SOUL.md
│   │       │   └── CLAUDE.md
│   │       ├── queue/
│   │       │   ├── SOUL.md
│   │       │   └── CLAUDE.md
│   │       ├── sop/
│   │       │   ├── SOUL.md
│   │       │   └── CLAUDE.md
│   │       └── qc-process/
│   │           ├── SOUL.md
│   │           └── CLAUDE.md
│   ├── backmarket/
│   │   ├── SOUL.md
│   │   ├── CLAUDE.md
│   │   ├── MEMORY.md
│   │   └── sub-agents/
│   │       ├── listings/
│   │       ├── pricing/
│   │       ├── grading/
│   │       └── bm-ops/
│   ├── finance/
│   │   ├── SOUL.md
│   │   ├── CLAUDE.md
│   │   ├── MEMORY.md
│   │   └── sub-agents/
│   │       ├── cash-flow/
│   │       └── kpis/
│   ├── parts/
│   │   ├── SOUL.md
│   │   ├── CLAUDE.md
│   │   ├── MEMORY.md
│   │   └── sub-agents/
│   │       ├── stock/
│   │       ├── nancy/
│   │       └── forecasting/
│   ├── team/
│   │   ├── SOUL.md
│   │   ├── CLAUDE.md
│   │   ├── MEMORY.md
│   │   └── sub-agents/
│   │       ├── performance/
│   │       └── hiring/
│   ├── finn/
│   │   ├── SOUL.md
│   │   ├── CLAUDE.md
│   │   ├── MEMORY.md
│   │   └── sub-agents/
│   │       ├── intercom/
│   │       └── escalation/
│   ├── website/
│   │   ├── SOUL.md
│   │   ├── CLAUDE.md
│   │   ├── MEMORY.md
│   │   └── sub-agents/
│   │       ├── posthog/
│   │       ├── shopify/
│   │       └── conversion/
│   ├── marketing/
│   │   ├── SOUL.md
│   │   ├── CLAUDE.md
│   │   ├── MEMORY.md
│   │   └── sub-agents/
│   │       ├── content/
│   │       ├── seo/
│   │       └── adwords/
│   ├── schedule/
│   │   ├── SOUL.md
│   │   ├── CLAUDE.md
│   │   └── MEMORY.md
│   └── systems/
│       ├── SOUL.md
│       ├── CLAUDE.md
│       ├── MEMORY.md
│       └── sub-agents/
│           ├── vps/
│           ├── services/
│           └── deployment/
│
├── config/
│   ├── memory-taxonomy.yaml       # Shared fact categories
│   ├── workflows/                 # Workflow templates
│   │   ├── standard-plan.yaml
│   │   ├── code-build.yaml
│   │   └── research.yaml
│   ├── openclaw/                  # OpenClaw configurations
│   │   └── openclaw.json
│   ├── cron/                      # Cron job definitions
│   │   ├── reconciliation.py
│   │   ├── health-check.py
│   │   ├── nightly-maintenance.py
│   │   └── weekly-consolidation.py
│   └── api-keys/
│       └── .env                   # NOT in Git — .gitignore
│
├── scripts/
│   ├── supabase/
│   │   ├── wrapper.py             # Read/write functions with audit snapshots
│   │   ├── setup-schema.sql       # Full schema creation script
│   │   └── seed-registry.sql      # Initial agent_registry population
│   ├── webhooks/
│   │   ├── cloudflare-worker.js   # Webhook receiver on Cloudflare
│   │   └── agent-trigger.py       # VPS-side agent session trigger
│   ├── maintenance/
│   │   ├── nightly-janitor.py     # Mechanical cleanup (zero AI cost)
│   │   └── weekly-consolidation.py # Domain-specific review trigger
│   └── utils/
│       ├── telegram-alert.py      # Direct Telegram API for alerts
│       └── git-export.py          # Nightly Supabase → Git backup
│
├── sops/                          # Standard operating procedures
│   ├── index.md                   # Auto-injected summary
│   └── procedures/
│       ├── intake/
│       ├── repair/
│       ├── refurb/
│       ├── qc/
│       ├── parts/
│       └── shipping/
│
├── tools/                         # Tool documentation (index + detail)
│   ├── index.md                   # Auto-injected ~2KB summary
│   ├── monday.md
│   ├── intercom.md
│   ├── supabase.md
│   ├── telegram.md
│   ├── shopify.md
│   └── external-model.md
│
├── hooks/                         # OpenClaw custom hooks
│   ├── supabase-memory.js
│   ├── supabase-bootstrap.js
│   ├── agent-activity-logger.js
│   ├── workflow-trigger.js
│   ├── heartbeat-writer.js
│   └── dependency-check.js
│
└── .gitignore
```

### VPS Directory Layout

```
/home/ricky/
├── mission-control/               # Git repo (cloned)
├── .openclaw/                     # OpenClaw runtime (managed by OpenClaw)
│   ├── agents/                    # Agent session stores
│   ├── hooks/                     # Symlinked from mission-control/hooks/
│   ├── scripts/
│   └── openclaw.json
├── logs/                          # Centralised logs
│   ├── agents/
│   ├── health/
│   ├── webhooks/
│   └── maintenance/
└── tmp/
    └── agent-health/              # Local health check files (fallback when Supabase down)
```

⚠️ **The Git repo IS the source of truth.** Agent SOUL files, CLAUDE.md, foundation docs, scripts, configs — all live in Git. OpenClaw workspaces symlink to the repo. Changes go through Git, not direct file edits on the VPS.

---

## SECTION 13: DEPLOYMENT STRATEGY

### Parallel Tracks

- **Track A:** Use current Jarvis (with 2026-02-16 fixes) for real business tasks NOW
- **Track B:** Build the v2 system alongside. No cutover until proven.

### Build Sessions

**Session 1: Foundation (4-6 hours)**
1. Initialize Git repo with full directory structure
2. Deploy Supabase schema (all tables, indexes)
3. Seed agent_registry with all 15 top-level agents
4. Build Python wrapper functions (supabase read/write with audit snapshots)
5. Build health check and reconciliation scripts
6. Build Telegram alert utility
7. Configure cron jobs (health check, reconciliation, nightly maintenance)
8. Build and deploy all 6 OpenClaw hooks
9. Test: Supabase connectivity, webhook flow, health checks

**Session 2: Infrastructure Agents (3-4 hours)**
1. Write SOUL + CLAUDE.md for: Jarvis, PM, QA-Plan, QA-Code, QA-Data, Systems
2. Register all 6 in OpenClaw with correct model configs
3. Configure Telegram bindings
4. Test each agent responds in its channel
5. Test dependency self-check on bootstrap
6. Test heartbeat writing

**Session 3: Domain Agents (4-5 hours)**
1. Write SOUL + CLAUDE.md for all 9 domain leads
2. Register in OpenClaw with Sonnet configs (Haiku for Schedule)
3. Configure Telegram bindings
4. Test each agent responds in its channel
5. Test Supabase read/write from agent sessions
6. Test cross-agent messaging via agent_messages

**Session 4: Sub-Agents + Workflow (4-5 hours)**
1. Write SOUL + CLAUDE.md for all ~20 sub-agents
2. Register in OpenClaw (no Telegram bindings)
3. Build and test one complete workflow end-to-end:
   - Ricky drops idea → Jarvis creates work item
   - Jarvis assigns to domain agent
   - Domain agent produces plan
   - QA-Plan reviews → rejects → domain agent revises → QA-Plan approves
   - Jarvis presents to Ricky
4. Test reconciliation cron catches stuck items
5. Test alert flow (stuck item → Jarvis + Ricky)

**Session 5: Integration + Dashboard (4-5 hours)**
1. Connect Monday.com API (read access)
2. Connect Intercom API (read access for Finn)
3. Build daily briefing cron (8am Bali / 1am UTC)
4. Build weekly summary compilation
5. Nightly Git export of Supabase tables
6. If time: begin Mission Control dashboard (React)

**Session 6+: Dashboard Build**
The dashboard is a separate build. Requirements:
- Live view of all work items by status
- Agent health status (green/yellow/red per agent)
- Daily briefing archive
- Quick links to agent Telegram groups
- Business state KPIs
- Built with React, reads from Supabase
- Deployed on VPS with nginx proxy

### n8n Removal

Do NOT remove n8n until:
1. All replacement Python scripts are deployed and tested
2. Cron jobs are running reliably for 1+ week
3. Webhook flows are confirmed working
4. Ricky explicitly approves removal

Then:
```bash
sudo docker stop n8n && sudo docker rm n8n
rm -rf /home/ricky/n8n-data
sudo rm /etc/nginx/sites-available/n8n
sudo rm /etc/nginx/sites-enabled/n8n
sudo nginx -t && sudo systemctl reload nginx
```

---

## SECTION 14: COST PROJECTIONS

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Hetzner VPS (CPX32) | €4.35 (~£3.75) | Current server |
| Hetzner backups | €0.87 (~£0.75) | Daily, 7 retained |
| Supabase | $0 (Free) → $25 (Pro) | Free during build, Pro for production |
| Claude Max | $200 | 20x tier, covers all agent usage via OpenClaw |
| OpenAI Embeddings | ~$5-10 | For QMD semantic search across all agents |
| Cloudflare Workers | $5 | Paid plan for webhook handling |
| Domain/SSL | $0 | Already have icorrect.co.uk, Certbot free |
| **Total (build phase)** | **~$215/month** | |
| **Total (production)** | **~$245/month** | |

### What This Replaces
- n8n Docker container (freed VPS resources)
- PM2 process management (replaced by systemd)
- Legacy jarvis-api service (already killed)
- Manual coordination via Telegram (replaced by automated workflows)

---

## SECTION 15: SUCCESS CRITERIA

### Week 1 (Post-Build)
- [ ] All 15 top-level agents respond correctly in their Telegram groups
- [ ] Supabase schema deployed and agents reading/writing successfully
- [ ] Health checks running every 15 minutes, alerts working
- [ ] Reconciliation cron catching stuck work items
- [ ] At least one complete workflow executed end-to-end
- [ ] Daily briefing arriving at 8am Bali

### Month 1
- [ ] All ~20 sub-agents configured and active
- [ ] QA review loops running automatically (no manual intervention)
- [ ] Memory facts accumulating correctly with namespace isolation
- [ ] No silent failures — all issues detected and alerted
- [ ] Monday.com API connected, repair data flowing
- [ ] Intercom connected, Finn handling initial triage

### Month 3
- [ ] Agents autonomously progressing work items through workflows
- [ ] Nightly maintenance running reliably, memory staying clean
- [ ] Ricky's daily involvement reduced to briefing review + strategic decisions
- [ ] At least 3 SOPs documented through agent-assisted workflow
- [ ] Business state in Supabase reflecting real operational data

### Month 6
- [ ] Mission Control dashboard live with real-time data
- [ ] Monday.com migration planning underway (Supabase as backend)
- [ ] Agent trust levels established — some operating with reduced oversight
- [ ] Revenue impact measurable (faster turnaround, fewer dropped items, better communication)

---

## SECTION 16: WHAT TO BUILD FIRST

When Code opens this document, start here:

1. **Read the full document first.** Don't skip sections.
2. **Verify current VPS state** matches what's described in Section 2.
3. **Start Session 1: Foundation.** Follow the build session order exactly.
4. **Test after each session** before moving to the next.
5. **Log everything** to agent_activity as you build — eat your own dog food.
6. **Ask Ricky** if anything is ambiguous. Don't guess.

The most important thing is that the foundation (Supabase schema, wrapper functions, hooks, health checks) is rock solid. Everything else builds on top of it. If the foundation is shaky, everything above it fails silently — which is exactly what we're trying to eliminate.

---

## END OF PRD

This document contains every architectural decision, schema definition, agent specification, and build instruction needed to rebuild Mission Control from its current v1 state to a production-grade v2 system. All decisions verified across two full-day sessions on 2026-02-15 and 2026-02-16, with VPS state confirmed by Code.

**Build it right. Build it once.**
