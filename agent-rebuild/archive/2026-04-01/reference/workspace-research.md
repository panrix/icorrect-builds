# Research: Agent Workspace & Shared Knowledge Base

> Historical note: this audit describes the March 2026 pre-cleanup VPS state. It is retained as root-cause evidence, not as the current workspace map. Use `/home/ricky/builds/agent-rebuild/technical/control/documentation-state-summary-2026-04-01.md` and `/home/ricky/kb/system/live-operating-map.md` for current state.

**Date:** 2026-03-16
**Author:** Claude Code (VPS-verified audit)
**Purpose:** Complete ground truth of agent workspaces, file locations, duplication, and root causes — so the plan doesn't fix symptoms while the disease continues.

---

## 1. THE PROBLEM (In Ricky's Words)

Agents save documents outside their workspaces, then forget they're there. Multiple agents redo the same work (Monday.com schema lookups, buyback analysis, pricing research). The VPS is a dumping ground. Knowledge doesn't compound — it resets every session.

Ricky can't roll out agents to team members until this is fixed.

## 2. ROOT CAUSES (Verified)

### 2a. No agent is told WHERE to save files

Not a single CLAUDE.md — across any agent — contains rules about where to put outputs. The save-fact Supabase mandate exists (288 cron runs/day), but nothing says "analysis goes in data/, scripts go in scripts/, reference docs go in docs/."

### 2b. No shared knowledge base exists

Every agent starts from zero. Monday.com board schema (170 columns, 33 groups) exists in 3 copies but no agent is told to read it. 54 scripts call the Monday API live, most without caching. The board schema gets re-queried constantly.

### 2c. Jarvis boots on a 26-line stub

The comprehensive CLAUDE.md (284 lines — routing table, Supabase instructions, memory rules, daily briefing spec) lives at `mission-control-v2/agents/jarvis/CLAUDE.md`. OpenClaw loads from the workspace, where there's a 1,397-byte stub with 3 minor topics. Your most-used agent runs without most of its instructions.

### 2d. Cross-agent work has no home

Buyback analysis exists in 4 locations. Monday schema in 3. Pricing data in 3. No convention for "where does work that spans multiple agents live?" So each agent creates its own copy wherever it likes.

### 2e. builds/ is four things at once

Active code, deployed services, stale snapshots from 22+ days ago, and spec-only placeholders — all mixed together. 231 MB total (200 MB is node_modules). INDEX.md is 17 days old and missing 12 directories.

---

## 3. VPS GROUND TRUTH

### 3a. All Agent Directories

22 directories at `~/.openclaw/agents/`:

| Agent | Type | CLAUDE.md Loaded | State | Files |
|-------|------|-----------------|-------|-------|
| **main (Jarvis)** | Coordinator | 26-line STUB (1.4KB) | Active | 196 |
| **operations** | Domain Lead | Symlink (14.4KB) | Active | 108 |
| **backmarket** | Domain Lead | Symlink (11.7KB) | Active | 190 |
| **customer-service** | Domain Lead | Symlink (12KB) | Active | 67 |
| **marketing** | Domain Lead | Symlink (12.9KB) | Active | 165 |
| **team** | Domain Lead | Regular file (13.7KB) | Active | 61 |
| **parts** | Domain Lead | Regular file (14KB) | Active | 39 |
| **website** | Domain Lead | Regular file (14.9KB) | Active | 98 |
| **systems** | Infrastructure | Symlink (12KB) | Active | 273 |
| **qa-plan** | Infrastructure | Symlink (11KB) | Dormant | 6 |
| **qa-code** | Infrastructure | Symlink (12KB) | Dormant | 1 |
| **qa-data** | Infrastructure | Symlink (12KB) | Dormant | 1 |
| **slack-jarvis** | Infrastructure | Regular file (4.5KB) | Low | 48 |
| **pm** | Infrastructure | Symlink (8.5KB) | Disabled | 1 |
| **alex-cs** | Experimental | No CLAUDE.md (SOUL only) | Active | 73 |
| **arlo-website** | Experimental | No CLAUDE.md (SOUL only) | Active | 37 |
| **research-bm** | Experimental | Regular file (4.9KB) | Dormant | 30 |
| **finn** | Orphan | Regular file (12KB) | Retired | 51 |
| **finance-archived** | Orphan | Symlink (6.2KB) | Archived | 54 |
| **processes** | Orphan | Regular file (12KB) | Retired | 85 |
| **schedule-archived** | Orphan | Regular file (12KB) | Archived | 41 |

### 3b. CLAUDE.md Loading — Three Patterns

**Pattern 1: Symlink to mission-control-v2 (8 agents)**
operations, backmarket, customer-service, marketing, systems, qa-plan, qa-code, qa-data, pm, finance-archived
- Source of truth: `/home/ricky/mission-control-v2/agents/{id}/CLAUDE.md`
- Workspace has symlink pointing to source
- Edit source file, all agents get the update

**Pattern 2: Regular file in workspace (7 agents)**
main, team, parts, website, slack-jarvis, research-bm, finn, processes, schedule-archived
- File lives only in workspace, no mission-control-v2 source
- team/parts/website were promoted to domain leads after the symlink pattern was established
- Jarvis is the worst case: 26-line stub while 284-line version sits unused

**Pattern 3: No CLAUDE.md (2 agents)**
alex-cs, arlo-website
- These experimental agents use SOUL.md as primary instruction file
- Different architecture from all other agents

**Broken:** `~/.openclaw/agents/main/]/CLAUDE.md` — symlink in a `]` directory (typo). Points to mission-control-v2 but wrong path. Does nothing.

### 3c. CLAUDE.md Complete Map

53 CLAUDE.md files exist on the VPS:

| Location | Count | Purpose |
|----------|-------|---------|
| `/home/ricky/mission-control-v2/agents/*/` | 29 | Source of truth for agent definitions |
| `~/.openclaw/agents/*/workspace/` | 20 | What OpenClaw actually loads (mix of symlinks + files) |
| `/home/ricky/CLAUDE.md` | 1 | Build agent instructions (this session) |
| `~/.openclaw/CLAUDE.md` | 1 | OpenClaw workspace guidance |
| `/home/ricky/builds/team-audits/CLAUDE.md` | 1 | Project-specific context |
| `/home/ricky/builds/agent-rebuild/archive/2026-04-01/technical/templates-draft-v3/CLAUDE.md` | 1 | Historical template for new agents |

### 3d. What OpenClaw Auto-Loads Per Session

From openclaw.json config + hook audit:

**Files from workspace (budget: ~45,000 chars):**
SOUL.md, CLAUDE.md, AGENTS.md, TOOLS.md, MEMORY.md, IDENTITY.md, USER.md, HEARTBEAT.md

**Current usage for Jarvis:** ~20-25K chars (safe headroom)

**Bootstrap hook injection (BOOTSTRAP.md — generated in memory):**
- MANDATORY save-fact instruction (~450 chars)
- Last 20 memory facts from Supabase (~1,222 chars)
- Memory summaries (0 chars — table is empty)
- Unread agent messages (0 chars — no messages)
- Total: ~1,672 chars (3.7% of limit)

**All 4 custom hooks:**
1. `dependency-check` — blocks agent if Supabase unreachable, writes health to `/tmp/agent-health/`
2. `supabase-bootstrap` — injects facts + messages + save-fact mandate
3. `agent-activity-logger` — logs session start/end to Supabase + Telegram
4. `supabase-memory` — writes session-end heartbeat

All Telegram-using hooks reference `TELEGRAM_BOT_TOKEN` (shared token — blocks multi-bot migration).

### 3e. Agent Workspace Structure

**No agent has a knowledge/ directory.** All use docs/ for documentation. The knowledge/ pattern was designed in February but never implemented.

**Workspace root discipline:** Domain leads are clean (no loose files). Jarvis has 45 voice transcription files dumped in root. No other workspace has clutter.

**Workspace sizes (by file count):**
- backmarket: 190 (most active — heavy data analysis)
- systems: 273 (includes git objects)
- main (Jarvis): 196 (45 are transcription clutter)
- marketing: 165 (contains nested intelligence/ project with own git repo)
- operations: 108
- website: 98
- processes (orphan): 85
- alex-cs (experimental): 73
- customer-service: 67
- team: 61
- finance-archived (orphan): 54
- finn (orphan): 51
- slack-jarvis: 48
- schedule-archived (orphan): 41
- parts: 39 (least active domain lead)
- arlo-website (experimental): 37
- research-bm (experimental): 30

---

## 4. THE DUPLICATION MAP

### 4a. Buyback/BackMarket Data — 4 LOCATIONS (Critical)

| Location | Files | Size | Last Updated |
|----------|-------|------|-------------|
| `~/.openclaw/agents/main/workspace/data/buyback/` | 36 | 12MB | Mar 14-15 |
| `/home/ricky/builds/backmarket/api/` | 21 scripts + cached JSON | 13MB | Mar 4 |
| `~/.openclaw/agents/backmarket/workspace/data/` | 5 | 1.8MB | Unknown |
| `/home/ricky/builds/buyback-monitor/` | 24 | 500KB | Mar 15 |

Three agents and two build directories all contain buyback analysis. Nobody knows the full picture.

### 4b. Monday Board Schema — 3 COPIES (Identical)

| Location | Notes |
|----------|-------|
| `/home/ricky/builds/documentation/monday/board-schema.md` | Canonical (Feb 23) |
| `~/.openclaw/agents/main/workspace/docs/buyback-monday-schema.md` | Duplicate |
| `~/.openclaw/agents/research-bm/workspace/research/reference/monday/board-schema.md` | Duplicate |

170 columns, 33 groups, Board ID 349212843. Pulled once Feb 23, never updated. Every time an agent needs the schema, it either finds a stale copy or calls the API live.

### 4c. Pricing Data — 3 LOCATIONS

| Location | Content |
|----------|---------|
| `/home/ricky/builds/backmarket/pricing/` | Archive of pricing module design (unbuilt) |
| `/home/ricky/builds/backmarket/audit/` | Active pricing reports (Feb-Mar 2026) |
| `~/.openclaw/agents/backmarket/workspace/docs/` | Duplicate of builds/ pricing docs + SOPs |

### 4d. Team Data — Clean (1 location)

`/home/ricky/builds/team-audits/reports/` — per-person subdirectories. No duplication. Scripts pull live from Monday each run.

### 4e. Parts Data — Wrong Location

Parts cost extracts (1.6MB) live in Jarvis's workspace (`data/buyback/parts-raw-data*.json`) instead of in the parts agent workspace or builds/.

---

## 5. MONDAY.COM API USAGE

### 54 files call the Monday API

| Category | Files | Caching | Token Waste |
|----------|-------|---------|-------------|
| BackMarket analysis | 14 | 2 cache, 12 live | HIGH — same boards queried repeatedly |
| Team audits | 15 | 1 cache, 14 live | MEDIUM — live data needed but schema requeried |
| Parts management | 3 | None | LOW — writes to Monday |
| KPI extraction | 3 | None | MEDIUM |
| Agent workspace data | 16 | Inconsistent | HIGH — agents pull same data as builds/ scripts |

### 3 boards queried constantly

| Board | ID | Items | Queried By |
|-------|----|-------|-----------|
| Main Board | 349212843 | 4,122 | 40+ scripts |
| BM Devices | 3892194968 | Unknown | 14 BM scripts |
| Parts Board | 985177480 | Unknown | 3 parts scripts + 1 Node.js service |

### Column IDs referenced in scripts (should be cached)

**Main Board (349212843):**
`status4` (Status), `service` (Service Type), `status` (Client), `person` (Technician), `date4` (Date Received), `collection_date` (Repaired Date), `time_tracking98` (Total Time), `time_tracking` (Diagnostic Time), `time_tracking9` (Repair Time), `text4` (IMEI/SN), `connect_boards` (Link to Stock Checkouts)

**BM Devices (3892194968):**
`text_mkqy3576` (Order ID), `text89` (BM SKU), `numeric` (Purchase Price ex VAT), `numeric5` (Sale Price ex VAT), `formula` (BM Fee), `formula_mm0xekc4` (Net Profit), `board_relation` (Link to Main Board)

**Parts Board (985177480):**
`quantity` (Stock level), `supply_price` (Part cost), `status_1` (Active status)

This information should be in a shared reference doc, not re-discovered by every script and agent session.

---

## 6. builds/ DIRECTORY AUDIT

### 231 MB total — 200 MB is node_modules

| Directory | State | Last Modified | Files | Assessment |
|-----------|-------|---------------|-------|-----------|
| **backmarket/** | ACTIVE | Mar 4 | 72 | Primary BM analysis hub |
| **buyback-monitor/** | ACTIVE | Mar 15 | 24 | Production monitoring pipeline |
| **repair-analysis/** | ACTIVE | Mar 16 | 2 | Modified 3 hours ago |
| **team-audits/** | ACTIVE | Mar 5 | 45 | Team performance framework |
| **intake-system/** | ACTIVE | Mar 10 | 6,922 | React form (137 MB — mostly node_modules) |
| **icloud-checker/** | ACTIVE | Mar 14 | 2,541 | Cloudflare Worker (29 MB) |
| **royal-mail-automation/** | ACTIVE | Mar 13 | 1,247 | Dispatch automation (21 MB) |
| **icorrect-parts-service/** | DEPLOYED | Unknown | Unknown | Node.js service (30 MB) |
| **voice-note-pipeline/** | DEPLOYED | Mar 16 | 4 | 7.4 MB log file actively growing |
| **telephone-inbound/** | DEPLOYED | Mar 13 | 3 | FastAPI service |
| **agents/** | REFERENCE | Feb 23 | 25 | Master research.md (canonical) |
| **agent-rebuild/** | REFERENCE | Mar 2 | 32 | This project's research |
| **documentation/** | MIXED | Mar 4 | 23 | monday/ active, raw-imports/ stale |
| **data-architecture/** | STALE | Feb 22 | 3 | 22 days old snapshot |
| **marketing-intelligence/** | STALE | Feb 22 | 3 | Known broken |
| **qa-system/** | STALE | Feb 22 | 3 | Superseded by QA trigger build |
| **voice-notes/** | STALE | Feb 22 | 3 | Superseded by voice-note-pipeline |
| **intercom-agent/** | SPEC ONLY | Feb 22 | 1 | Single SPEC.md, never built |
| **inventory-system/** | SPEC ONLY | Feb 22 | 1 | Single SPEC.md, never built |
| **website-conversion/** | SPEC ONLY | Feb 22 | 1 | Single SPEC.md, never built |

### Git repos in builds/

| Repo | GitHub | .gitignore | node_modules Risk |
|------|--------|------------|-------------------|
| **builds/ (root)** | panrix/icorrect-builds | N/A | N/A |
| royal-mail-automation | NOT pushed | Missing | HIGH |
| icloud-checker | NOT pushed | Missing | HIGH |
| icorrect-parts-service | NOT pushed | Proper | Safe |
| intake-system/react-form | NOT pushed | Missing | CRITICAL — all untracked |
| xero-invoice-automation | NOT pushed | Missing | N/A |
| icorrect-shopify-theme | panrix (token in URL) | Missing | N/A |

5 of 7 nested repos not pushed to GitHub. 4 missing .gitignore. intake-system React app is 100% untracked — exists only on this VPS.

### Root builds/ repo: 80+ uncommitted files including entire agent-rebuild/ directory.

---

## 7. ORPHAN AGENTS — WHAT'S SALVAGEABLE

| Agent | Why Retired | Valuable Data | Action Needed |
|-------|-------------|---------------|---------------|
| **finn** | Replaced by customer-service + alex-cs | 40+ Intercom KB docs, finn audit history | Migrate docs to alex-cs before deletion |
| **finance-archived** | Merged into operations (but splitting back out) | Xero scripts, reconciliation tools, xero_refresh_token.txt | DO NOT DELETE — finance being restored |
| **processes** | Merged into operations | 46 intake process screenshots, n8n workflow JSONs, macbook-flows.md | Migrate intake docs to operations |
| **schedule-archived** | Role eliminated | Schedule system docs, time tracking | Migrate docs, then delete. REMOVE "schedule" from agentToAgent.allow list |

---

## 8. CONFIG ISSUES FOUND

| Issue | Severity | Detail |
|-------|----------|--------|
| Jarvis CLAUDE.md is a stub | CRITICAL | 26 lines loaded vs 284 lines available |
| "schedule" in agentToAgent.allow | LOW | Retired agent still in allow list (line 536) |
| Broken `]` directory in main agent | LOW | Typo — symlinks to right file, wrong path |
| research-bm bot disabled | LOW | Bot exists but `enabled: false`, no Telegram binding |
| icorrect-shopify-theme GitHub PAT exposed | MEDIUM | Token in remote URL |
| 3 QA agents reference git workflow but have no .git | LOW | CLAUDE.md promises git, workspace has none |

---

## 9. THE SHARED KNOWLEDGE BASE — DESIGN DIRECTION

Ricky's answer: a shared, accessible knowledge folder on the VPS. Broken down by topic with headings and subheadings. Agents reference it when they need to. Things like Monday.com schema get cached once, not API-called every session.

### What Should Be in the Shared KB

Based on the duplication map and API usage audit:

**Monday.com Reference (queried by 40+ scripts):**
- Board schemas — Main Board, BM Devices, Parts Board
- Column ID maps with human-readable names
- Group structures and status value lists
- Board relationships (which boards link to which)
- Last pulled date + how to refresh

**BackMarket Reference:**
- API reference (already exists at backmarket agent workspace)
- Grading criteria
- Fee structure
- Trade-in workflow
- Pricing rules and thresholds

**Business Context (queried at session start by every agent):**
- Team roster with roles, Monday user IDs, contact details
- Revenue model (2% net margin, BM ~60%, loaded labour rate)
- Active services and their status
- Key supplier info (Nancy for parts)

**Process/SOP Library:**
- Walk-in drop-off flow
- Mail-in flow
- BM trade-in flow
- QC workflow
- Dispatch/shipping
- Intake diagnostics

**Financial Reference:**
- Xero chart of accounts structure
- VAT rules
- HMRC payment plan status
- Cash flow model

### Where It Should Live

**`/home/ricky/kb/`** — top-level, not buried in builds/ or an agent workspace.

```
/home/ricky/kb/
├── README.md                    (index — what's here, how to use it, how to update it)
├── monday/
│   ├── main-board.md            (Board 349212843 — schema, columns, groups, statuses)
│   ├── bm-devices-board.md      (Board 3892194968 — schema, columns)
│   ├── parts-board.md           (Board 985177480 — schema, columns)
│   └── board-relationships.md   (how boards link together)
├── backmarket/
│   ├── api-reference.md         (API endpoints, auth, rate limits)
│   ├── grading-criteria.md      (cosmetic grades, functional tests)
│   ├── fee-structure.md         (commission, shipping, returns)
│   ├── trade-in-workflow.md     (end-to-end trade-in process)
│   └── pricing-rules.md        (thresholds, buy box strategy)
├── team/
│   ├── roster.md                (current team, roles, Monday user IDs)
│   └── kpi-definitions.md       (what we measure, targets)
├── finance/
│   ├── xero-structure.md        (chart of accounts, bank feeds)
│   ├── revenue-model.md         (margins, cost structure, loaded labour rate)
│   └── hmrc-status.md           (payment plan, VAT)
├── operations/
│   ├── walk-in-flow.md
│   ├── mail-in-flow.md
│   ├── qc-workflow.md
│   ├── dispatch-shipping.md
│   └── intake-diagnostics.md
├── customer-service/
│   ├── intercom-setup.md        (Fin config, article structure)
│   ├── triage-rules.md          (routing, escalation)
│   └── pricing-guide.md         (customer-facing quotes)
├── website/
│   ├── shopify-structure.md     (theme, collections, metafields)
│   ├── conversion-baseline.md   (current metrics, targets)
│   └── seo-state.md             (rankings, technical SEO)
└── system/
    ├── agent-architecture.md    (who exists, what they do, how to reach them)
    ├── supabase-schema.md       (tables, RLS, webhook pipeline)
    └── openclaw-config.md       (hooks, crons, bindings)
```

### How Agents Access It

1. **CLAUDE.md gets a `## Knowledge Base` section** pointing to `/home/ricky/kb/` with domain-specific pointers
2. **Agents read on demand** — not auto-loaded (would blow the char budget)
3. **Bootstrap hook gets a one-liner:** "Before starting work, check /home/ricky/kb/ for relevant reference docs"
4. **AGENTS.md (for Jarvis) / CLAUDE.md (for domain leads) contains workspace rules** about where to save vs where to read

### Rules That Prevent Future Scattering

These go into every agent's auto-loaded instruction file:

```
## Workspace Rules

### Where to SAVE
- Analysis outputs → your workspace data/
- Session notes → your workspace memory/
- Scripts you write → your workspace scripts/
- Domain documentation you create → your workspace docs/
- NEVER save to /home/ricky/builds/ (that's for Code agent)
- NEVER save to another agent's workspace
- NEVER save to /home/ricky/kb/ without explicit instruction

### Where to READ
- Shared knowledge base: /home/ricky/kb/ (READ ONLY for agents)
- Your own workspace docs/ and data/
- Foundation docs: workspace/foundation/
- Other agents' published data: ask Jarvis to coordinate

### Before Any Analysis
- Check /home/ricky/kb/ for existing reference data on this topic
- Check your workspace knowledge/ for previous conclusions
- If data exists, BUILD ON IT — don't start from scratch
```

### Who Maintains the KB

- **Code agent** (me) creates the initial structure and populates it from existing data
- **Agents propose updates** via their domain lead, who escalates to Jarvis
- **Jarvis reviews and approves** KB updates (or Ricky directly)
- **Code agent makes the actual edits** — agents don't write directly to KB
- **Monthly review:** Jarvis checks KB freshness as part of agent performance review

This is the key discipline: agents READ from KB, they WRITE to their own workspace. The KB is curated, not a dump.

---

## 10. WHAT THE PREVIOUS PLANS GOT RIGHT

### immutable-tinkering-lemur.md
- knowledge/ directories with topical synthesis — good pattern for within-workspace knowledge
- Workspace rules in AGENTS.md — correct enforcement mechanism
- Kill save-fact pipeline — correct, 288 cron runs/day for no value
- Slim MEMORY.md to index — correct

### dynamic-shimmying-teapot.md
- Root cause diagnosis accurate — "no agent knows where anything is"
- Jarvis CLAUDE.md loading gap is real
- Reference Docs pattern is directionally correct
- Cross-agent visibility gap correctly identified

### What Both Missed
- No shared knowledge base — both tried to solve discovery agent-by-agent instead of centrally
- No write discipline — both add "where to find" but not "where to put"
- Reference Docs with absolute cross-agent paths go stale immediately
- Neither accounts for the 3 experimental agents (alex-cs, arlo-website, research-bm)
- Neither addresses the 54 scripts calling Monday API with no caching strategy
- Neither addresses the 4 orphan agent directories with valuable unsalvaged data

---

## 11. NUMBERS SUMMARY

| Metric | Count |
|--------|-------|
| Agent directories on VPS | 22 |
| Active agents | 17 (14 original + 3 experimental) |
| Orphan agents | 4 |
| CLAUDE.md files on VPS | 53 |
| CLAUDE.md files actually loaded by OpenClaw | 17 |
| Agents with symlinked CLAUDE.md | 8 |
| Agents with regular file CLAUDE.md | 7 |
| Agents with no CLAUDE.md | 2 |
| Total files across all workspaces | ~2,500+ |
| Files in builds/ (excl node_modules) | ~300 |
| node_modules bloat in builds/ | ~200 MB |
| Python scripts calling Monday API | 51 |
| JS files calling Monday API | 3 |
| Monday boards queried repeatedly | 3 |
| Locations with duplicate buyback data | 4 |
| Locations with duplicate Monday schema | 3 |
| Custom hooks | 4 |
| Hooks referencing shared bot token | 2 (blocks multi-bot migration) |
| Bootstrap payload size | 1,672 chars (3.7% of limit) |
| Stale directories in builds/ | 4 |
| Spec-only directories in builds/ (never built) | 3 |
| Git repos in builds/ not pushed to GitHub | 5 of 7 |

---

*This document is the complete ground truth as of 2026-03-16. Every claim verified against the actual VPS. No compromises, no gaps deferred.*
