# Plan: Build Registry + Spec Consolidation

## Context

Ricky's build ideas and specs are scattered across 5+ locations on the VPS: standalone files in `~`, mission-control-v2/docs/, agent workspaces (5+ agents), agent memory files, Cursor plans, and Telegram conversation history. When he wants to build something, he can't find what he's already decided. The intake system alone has docs in 8 different places.

**Goal:** Create a single `~/builds/` directory on the VPS that serves as the **system-wide source of truth** for all active builds. Both Ricky/Claude Code AND the 11 OpenClaw agents reference this directory. Each build gets a consolidated, buildable spec — not just links to scattered docs, but an actual document you can hand to a Claude Code session and say "build this."

**Ricky's priorities (confirmed):**
- **Full consolidation (4):** Intake System, Intercom Agent, Inventory System, Website Conversion
- **Stubs only (5):** QA System (actively building now), BM Pricing Module (algorithm not yet documented), Marketing Intelligence (Phase 1 subpar, needs rethinking), Data Architecture (idea stage), Voice Notes (idea stage)

**Intake system** is the most scattered and highest priority. Ricky explicitly needs this taken to another Claude session to build, so the spec must preserve ALL detail — no compression.

---

## What I'll Create

### Directory Structure on VPS

```
/home/ricky/builds/                   # git repo (initialized Phase 1)
├── .git/
├── INDEX.md                          # Master registry of all 9 builds
│
│   FULL CONSOLIDATION (buildable specs):
├── intake-system/
│   ├── SPEC.md                       # Main spec (~800-1000 lines): architecture, rules, schema, phasing
│   ├── flows/
│   │   ├── client-ipad-flow.md       # Interface 1: client-facing iPad drop-off flow
│   │   ├── standard-repair-flow.md   # Interface 2, Flow A: standard repair intake
│   │   ├── diagnostic-intake-flow.md # Interface 2, Flow B: extended diagnostic
│   │   └── bm-tradein-flow.md        # Interface 2, Flow C: BM trade-in (func/non-func)
│   ├── device-flows/
│   │   ├── macbook-flows.md          # Copy from agent workspace (11 flows)
│   │   ├── iphone-flows.md           # Copy from agent workspace (15 flows)
│   │   ├── ipad-flows.md             # Copy from agent workspace (5 flows)
│   │   └── apple-watch-flows.md      # Copy from agent workspace (4 flows)
│   ├── integrations.md               # Monday, Intercom, Supabase, Xero, iCloud, etc.
│   └── reference/
│       ├── SOURCE-MAP.md             # Where every piece of info originally came from
│       ├── intake-audit-2026-02-18.md # Copy of Monday board audit data
│       └── transcripts/              # Ricky's original voice notes (6 Otter.ai files)
│           ├── diagnostic-intake.txt
│           ├── intake-stock-check.txt
│           ├── intake-system.txt
│           ├── non-functional-bm-intake.txt
│           ├── random-walk-ins.txt
│           └── simple-repair-intake.txt
├── intercom-agent/
│   └── SPEC.md                       # Consolidated from 5 Intercom docs + CS agent spec
├── inventory-system/
│   └── SPEC.md                       # Consolidated from parts + main agent docs
├── website-conversion/
│   └── SPEC.md                       # Consolidated from UX audit + collection page spec
│
│   STUBS (snapshot + summary, not just links):
├── qa-system/
│   ├── README.md                     # Status, why parked, summary of current approach
│   └── snapshot/                     # Copy of key source doc(s) — not just links
├── bm-pricing-module/
│   ├── README.md
│   └── snapshot/
├── marketing-intelligence/
│   ├── README.md
│   └── snapshot/
├── data-architecture/
│   ├── README.md
│   └── snapshot/
└── voice-notes/
    ├── README.md
    └── snapshot/
```

### INDEX.md — The Master Registry

A table listing every build with:
- **Name** — what it is
- **Status** — idea / specced / ready-to-build / in-progress / shipped
- **Priority** — Ricky's order (intake is #1)
- **Spec completeness** — full spec / stub
- **Owner agent** — which agent builds/owns this domain
- **Blockers** — what's stopping the build
- **Dependencies** — which other builds this depends on or feeds into
- **Links** — path to SPEC.md or README.md

### Dependencies Map (in INDEX.md)

```
Intake System ──depends on──→ Monday Audit (external)
Intake System ──feeds into──→ Inventory System (stock checks during intake)
Intake System ──feeds into──→ Intercom Agent (customer records, ticket creation)
Inventory System ──depends on──→ Monday Audit (parts/stock board)
Intercom Agent ──depends on──→ n8n workflow replacement (48 workflows)
Website Conversion ──independent── (Shopify-only, no system dependencies)
```

### Intake System — Modular Spec Structure

The intake spec is split into a **main SPEC.md** plus sub-documents, so a Claude Code session doesn't need to load 2500 lines into context at once. The main SPEC.md is the entry point and references sub-docs as needed.

**SPEC.md (~800-1000 lines)** covers:
1. **Problem Statement** — from REQUIREMENTS.md + transcripts (the "why")
2. **Architecture Overview** — two interfaces, three flows, three-stage test chain
3. **Hard Gates & Rules** — all 9 non-negotiable gates
4. **Universal Questions** — fired at start of every intake
5. **Device-Specific Question Flows** — references to device-flows/ directory
6. **Supabase Schema** — full table definitions
7. **Monday.com Column Mappings** — intake-relevant columns (full board audit pending)
8. **Technical Architecture** — React frontend, FastAPI backend, Supabase, Nginx
9. **MVP Scope: MacBook Screen Repair** — exactly what to build first
10. **Full Phasing** — reconciled from the two different phase plans
11. **Operational Context** — real timing data, team dynamics, audit findings
12. **Open Questions** — status of each (resolved vs still open)

**flows/** sub-docs (~300-500 lines each):
- `client-ipad-flow.md` — Interface 1: client-facing iPad full flow
- `standard-repair-flow.md` — Interface 2, Flow A: every step, every field
- `diagnostic-intake-flow.md` — Interface 2, Flow B: extended questions, data backup, ammeter
- `bm-tradein-flow.md` — Interface 2, Flow C: functional/non-functional split, device splitting

**device-flows/** — copied from agent workspace, already well-structured (~500 lines each)

**integrations.md** — Monday, Intercom, Supabase, Xero, iCloud, notifications, photos, recording (pulled out of main SPEC to keep it focused)

### 3 Other Full SPECs

**Intercom Agent SPEC.md** — Consolidate from:
- CS agent workspace: `intercom-agent-build/SPEC.md` (most detailed — Supabase schema, pipeline, 5 phases)
- MC v2: `intercom-audit-2026-02.md` (current state audit, Fin failures, n8n failure rates)
- MC v2: `intercom-audit-part2-conversations.md` (conversation analysis)
- MC v2: `intercom-agent-led-comms-spec.md` (classification rules, routing)
- MC v2: `n8n-intercom-monday-flows.md` (48 workflows, what to replace)

**Inventory System SPEC.md** — Consolidate from:
- Main agent: `inventory-system/RICKY-REQUIREMENTS.md` (19 requirements from voice transcripts)
- Main agent: `inventory-system/PHASE-1-PLAN.md` (Monday board audit plan)
- Main agent: `inventory-system/SUMMARY.md` (Ferrari's proposal analysis, root cause, 4 phases)
- Main agent: `inventory-system/refurb-pipeline-board-spec.md` (Refurb Log board spec)
- Parts agent: duplicates of above

**Website Conversion SPEC.md** — Consolidate from:
- Website agent: `ux-audit-brief.md` (full funnel data, dead clicks, mobile issues)
- Website agent: `collection-page-conversion-spec.md` (6 specific fixes, Shopify files)

### 5 Stub READMEs

Each stub gets a 1-page README with status, why it's parked, and a summary of the current thinking. Key source docs are **copied into snapshot/** so they survive if agent workspaces reorganise. No stale links.

---

## Agent Integration

`~/builds/` is a **shared resource** — agents reference it, not just Ricky and Claude Code.

### What Changes for Agents

After Phase 1 is complete, the following agent CLAUDE.md files get a new section:

**Jarvis (main)** — add to CLAUDE.md:
```
## Build Registry
The source of truth for all active builds is `/home/ricky/builds/INDEX.md`.
When Ricky asks about build status, priorities, or specs, reference this directory first.
Do not create new spec documents in agent workspaces — direct build work to ~/builds/{build-name}/.
```

**Operations** — add reference to intake-system and inventory-system specs
**Customer Service** — add reference to intercom-agent spec
**Website** — add reference to website-conversion spec
**Parts** — add reference to inventory-system spec
**Systems** — add reference to builds/ for infrastructure planning
**PM** — add reference to INDEX.md as the master build registry

### Rules for Agents

- Agents may **read** from `~/builds/` freely
- Agents must **not write** to `~/builds/` directly — spec updates go through Ricky or Claude Code
- If an agent discovers new information relevant to a build (e.g., operations finds a new Monday column issue), it reports to Jarvis who flags it for Ricky
- `~/builds/` is NOT symlinked into agent workspaces — agents reference it by absolute path

---

## Execution Phases

### Phase 1: Registry Structure + Git + Stubs + INDEX (one session)

**Deliverables:** Git-initialized `~/builds/` with all 9 directories, 5 stub READMEs with snapshot docs, INDEX.md with dependencies
**Acceptance criteria:** `~/builds/` exists as a git repo, INDEX.md shows all 9 builds with accurate status and dependencies, stubs contain copied key docs in snapshot/

1. SSH into VPS
2. Create full directory structure including snapshot/ dirs for stubs
3. `git init /home/ricky/builds/`
4. Write 5 stub READMEs — each with status, why it's parked, summary of approach
5. Copy key source docs into each stub's snapshot/ directory
6. Write INDEX.md — master registry with status table + dependencies map
7. Git commit: "Initial build registry structure"
8. Verify: all directories exist, stubs have copied docs, INDEX renders correctly

**Phase 1 does NOT touch any SPEC.md files.**

---

### Phase 1.5: Source Audit (same session or start of Phase 2 session)

**Deliverables:** Confirmed file paths for ALL source documents needed in Phases 2-4
**Acceptance criteria:** Every "TODO" and "confirm path" in this plan is resolved with an actual path or marked as "does not exist — gap"

**Resolve these unknowns:**

| Item | What to find | Where to look |
|------|-------------|---------------|
| Walk-in Cursor plan | Drop-off intent detail for iPad flow | `~/.openclaw/agents/operations/workspace/`, `~/`, `~/.openclaw/agents/main/workspace/` |
| Monday audit file | intake-audit-2026-02-18.md | `~/.openclaw/agents/operations/workspace/docs/intake-system/` |
| Device flow files (4) | macbook/iphone/ipad/apple-watch-flows.md | `~/.openclaw/agents/main/workspace/docs/intake-system/`, `~/.openclaw/agents/operations/workspace/docs/intake-system/` |
| Otter.ai transcripts (6) | diagnostic-intake, intake-stock-check, intake-system, non-functional-bm-intake, random-walk-ins, simple-repair-intake | `~/.openclaw/agents/*/workspace/`, `~/` |

**Steps:**
1. SSH in, search for each file: `find ~/.openclaw/agents/ -name "macbook-flows.md"` etc.
2. For each found file, record the confirmed path
3. For each NOT found, flag it as a gap — do NOT proceed with assumptions
4. Update this plan document with confirmed paths
5. Report findings to Ricky before starting Phase 2

**If critical files are missing (SPEC sources, device flows), STOP and discuss with Ricky.**

---

### Phase 2a: Intake — Read Sources + Copy Reference Material (dedicated session)

**Deliverables:** All reference materials copied into `builds/intake-system/`, confirmed source inventory
**Acceptance criteria:** device-flows/, reference/transcripts/, reference/intake-audit all populated with verified files

**Source documents to read (full VPS paths — confirmed in Phase 1.5):**

| # | Document | Path |
|---|----------|------|
| 1 | 5-phase plan, Monday column IDs, architecture | `/home/ricky/intake-system-plan.md` |
| 2 | Developer-ready spec, Supabase schema, MVP | `~/.openclaw/agents/operations/workspace/docs/intake-system/DEV-BRIEF.md` |
| 3 | Full synthesis of 7 transcripts | `~/.openclaw/agents/operations/workspace/docs/intake-system/INTAKE-SYNTHESIS.md` |
| 4 | 4-phase plan with dependencies | `~/.openclaw/agents/systems/workspace/docs/intake-system/BUILD-PLAN.md` |
| 5 | Original brain dump | `~/.openclaw/agents/systems/workspace/docs/intake/INTAKE-REQUIREMENTS.md` |
| 6 | Walk-in Cursor plan (drop-off intent detail) | **Path from Phase 1.5** |
| 7 | Monday audit findings (519 items) | **Path from Phase 1.5** |

**Steps:**
1. Read ALL source documents (paths confirmed in Phase 1.5)
2. Copy device flow files to `builds/intake-system/device-flows/`
3. Copy transcripts to `builds/intake-system/reference/transcripts/`
4. Copy Monday audit data to `builds/intake-system/reference/`
5. Read agent memory files for operational context:
   - `~/.openclaw/agents/operations/workspace/memory/*.md`
   - `~/.openclaw/agents/main/workspace/memory/*.md`
   - `~/.openclaw/agents/systems/workspace/memory/*.md`
6. Git commit: "Add intake system reference materials"
7. Note any gaps or contradictions between sources — report before Phase 2b

---

### Phase 2b: Intake — Write Consolidated Spec (same or next session)

**Deliverables:** intake-system/SPEC.md, flows/*.md, integrations.md, SOURCE-MAP.md
**Acceptance criteria:** SPEC.md + sub-docs are self-contained enough for a Claude Code session to start building without asking clarifying questions

**Steps:**
1. Write SPEC.md — main document with 12-section structure (~800-1000 lines)
2. Write flows/client-ipad-flow.md
3. Write flows/standard-repair-flow.md
4. Write flows/diagnostic-intake-flow.md
5. Write flows/bm-tradein-flow.md
6. Write integrations.md — all external system touchpoints
7. Write reference/SOURCE-MAP.md — provenance for every section
8. Git commit: "Consolidated intake system spec"
9. Verify: all referenced files exist, section count matches plan

**Buildability test:** Open a fresh Claude Code session, give it only `builds/intake-system/`. Can it start building the MVP without asking clarifying questions? If not, the spec has gaps.

---

### Phase 3a: Intercom Agent SPEC (dedicated session)

**Deliverables:** intercom-agent/SPEC.md
**Acceptance criteria:** Self-contained and buildable. All 5 source docs consolidated.

**Source documents (full VPS paths):**

| # | Document | Path |
|---|----------|------|
| 1 | Detailed SPEC (Supabase schema, pipeline, 5 phases) | `~/.openclaw/agents/customer-service/workspace/intercom-agent-build/SPEC.md` |
| 2 | Current state audit, Fin failures | `/home/ricky/mission-control-v2/docs/intercom-audit-2026-02.md` |
| 3 | Conversation analysis | `/home/ricky/mission-control-v2/docs/intercom-audit-part2-conversations.md` |
| 4 | Classification rules, routing | `/home/ricky/mission-control-v2/docs/intercom-agent-led-comms-spec.md` |
| 5 | 48 n8n workflows to replace | `/home/ricky/mission-control-v2/docs/n8n-intercom-monday-flows.md` |

Also check: `~/.openclaw/agents/customer-service/workspace/memory/*.md` for additional context

**Steps:**
1. Read all 5 source documents + CS agent memory
2. Write intercom-agent/SPEC.md
3. Update INDEX.md status
4. Git commit
5. Verify: spec is self-contained

---

### Phase 3b: Inventory System SPEC (dedicated session)

**Deliverables:** inventory-system/SPEC.md
**Acceptance criteria:** Self-contained and buildable. All 4 source docs consolidated (deduplicated with parts agent copies).

**Source documents (full VPS paths):**

| # | Document | Path |
|---|----------|------|
| 1 | 19 requirements from voice transcripts | `~/.openclaw/agents/main/workspace/inventory-system/RICKY-REQUIREMENTS.md` |
| 2 | Monday board audit plan | `~/.openclaw/agents/main/workspace/inventory-system/PHASE-1-PLAN.md` |
| 3 | Ferrari's proposal analysis, root cause, 4 phases | `~/.openclaw/agents/main/workspace/inventory-system/SUMMARY.md` |
| 4 | Refurb Log board spec | `~/.openclaw/agents/main/workspace/inventory-system/refurb-pipeline-board-spec.md` |

Also check: parts agent workspace for duplicates or additional context

**Steps:**
1. Read all source documents + parts agent memory
2. Write inventory-system/SPEC.md
3. Update INDEX.md status
4. Git commit
5. Verify: spec is self-contained

---

### Phase 3c: Website Conversion SPEC (same session as 3b — small scope)

**Deliverables:** website-conversion/SPEC.md
**Acceptance criteria:** Self-contained and buildable. Both source docs consolidated.

**Source documents (full VPS paths):**

| # | Document | Path |
|---|----------|------|
| 1 | Full funnel data, dead clicks, mobile issues | `~/.openclaw/agents/website/workspace/ux-audit-brief.md` |
| 2 | 6 specific fixes, Shopify files | `~/.openclaw/agents/website/workspace/collection-page-conversion-spec.md` |

Also check: website agent memory for additional PostHog/analytics context

**Steps:**
1. Read both source documents + website agent memory
2. Write website-conversion/SPEC.md
3. Update INDEX.md status for all builds
4. Git commit: "Complete all build specs"
5. Final verification across all 4 specs

---

### Phase 4: Agent CLAUDE.md Updates (short session)

**Deliverables:** Updated CLAUDE.md for 7 agents with ~/builds/ references
**Acceptance criteria:** Each relevant agent knows about ~/builds/ and its role

**Agents to update:**
1. **main (Jarvis)** — Build Registry section, owns INDEX.md awareness
2. **operations** — References intake-system + inventory-system specs
3. **customer-service** — References intercom-agent spec
4. **website** — References website-conversion spec
5. **parts** — References inventory-system spec
6. **systems** — References builds/ for infrastructure planning
7. **pm** — References INDEX.md as master build registry

**Rules to add:**
- Agents read from `~/builds/` freely
- Agents do NOT write to `~/builds/` — updates go through Ricky or Claude Code
- New build-relevant info gets reported to Jarvis who flags for Ricky

**Steps:**
1. Read each agent's current CLAUDE.md
2. Add Build Registry section to each
3. Git commit in each agent workspace
4. Verify: no existing sections broken, new sections are concise

---

### Phase Gates

- Do NOT start Phase 1.5 until Phase 1 is complete and Ricky confirms
- Do NOT start Phase 2a until Phase 1.5 is complete — all paths must be confirmed
- Do NOT start Phase 2b until Phase 2a is complete — all reference materials must be in place
- Do NOT start Phase 3a/3b/3c until Phase 2b is complete and Ricky confirms
- Phase 3c (website) can run in the same session as 3b (inventory) since it's small scope
- Do NOT start Phase 4 until at least Phase 1 is complete (agent updates don't depend on all specs)
- If any phase reveals missing source material, stop and report — do not fill gaps with assumptions

---

## What the INDEX.md Will Show (Draft)

| # | Build | Status | Priority | Spec | Owner Agent | Blockers | Dependencies |
|---|-------|--------|----------|------|-------------|----------|-------------|
| 1 | Intake System | ready-to-build | HIGHEST | Full | operations | Monday audit | → Inventory, → Intercom |
| 2 | Intercom Agent | specced | HIGH | Full | customer-service | n8n replacement | ← Intake (customer records) |
| 3 | Inventory System | specced | HIGH | Full | parts + operations | Monday audit (parts board) | ← Intake (stock checks) |
| 4 | Website Conversion | specced | HIGH | Full | website | Shopify theme access | (independent) |
| 5 | QA System | in-progress | — | Stub | operations | — | Ricky actively building |
| 6 | BM Pricing Module | blocked | — | Stub | backmarket | Algorithm not documented | Needs Ricky discussion |
| 7 | Marketing Intelligence | needs-rethink | — | Stub | marketing | Phase 1 was subpar | Needs better approach |
| 8 | Data Architecture | idea | — | Stub | systems | Depends on other builds | 10-layer BI vision |
| 9 | Voice Notes | idea | — | Stub | systems | n8n + Whisper | Prototype exists |

### Dependencies Map

```
                    ┌─────────────────┐
                    │  Monday Audit   │ (external prerequisite)
                    └────┬───────┬────┘
                         │       │
                         v       v
              ┌──────────────┐  ┌──────────────────┐
              │ Intake System│  │ Inventory System  │
              └──┬───────┬───┘  └──────────────────┘
                 │       │              ^
                 │       │              │ (stock checks during intake)
                 │       └──────────────┘
                 │
                 v
          ┌──────────────┐
          │Intercom Agent│ (customer records from intake)
          └──────────────┘

Website Conversion — independent, no system dependencies
QA System — independent, Ricky building separately
BM Pricing, Marketing Intel, Data Arch, Voice Notes — parked
```

### Maintenance

INDEX.md is maintained by **Ricky or Claude Code** — not agents. When a build status changes:
1. Update INDEX.md status column
2. Git commit with the change
3. Agents will see the updated status on their next session (they read ~/builds/ at reference time, not cached)

If this becomes a burden, consider a future automation (e.g., cron that checks for spec changes and updates status).

---

## Compromises & Notes

- **Transcripts COPIED** into `builds/intake-system/reference/transcripts/` — these are Ricky's own words explaining the reasoning behind decisions. Essential reference material for any Claude building the system.
- **Agent memory facts** are summarized into SPEC.md's "Operational Context" section, not copied verbatim — they're fragments spread across 16 files.
- **Monday audit data** (868 lines) is copied as reference material, not inlined into the SPEC.
- **Intake SPEC is modular** — main SPEC.md (~800-1000 lines) + 4 flow docs + integrations doc + device flows. Total content is the same ~2500 lines, but a Claude Code session can load only what it needs for the current build phase.
- **Stubs copy key docs into snapshot/** rather than just linking — protects against agent workspace reorganisation breaking references.
- **Intercom agent** already has a strong SPEC.md in CS agent workspace — consolidation mostly adds the audit findings and n8n flow data.
- **Mission Control v2 and Finance Merge** are NOT included — they're shipped/complete, not active builds.
- **OpenClaw issues** (inter-agent messaging broken, etc.) are infrastructure blockers, not builds. They'll get a note in INDEX.md but not their own directory.
- **Original scattered docs are NOT deleted** — builds/ is the new source of truth, but originals stay where they are. No risk.
- **Agent CLAUDE.md updates are Phase 4** — the registry is useful even before agents know about it, so this is last.
- **No Supabase integration for ~/builds/** — this is flat files + git. Simple, auditable, no moving parts. If it needs to be queryable later, that's a future enhancement.

---

## Monday.com Audit — Prerequisite for Intake Build

**Problem:** Monday.com is a blind spot. The intake system writes to board 349212843 (repairs) and reads from 985177480 (parts/stock), but:
- 130+ columns on the repairs board, 33 groups — nobody has documented what each column does
- Many columns appear dead/unused (e.g., "Info Capture" set to "No Information" on most items)
- The Feb 18 audit script couldn't calculate any delays (all returned N/A)
- Column IDs are documented in `intake-system-plan.md` appendix but only for intake-relevant columns — full board structure unknown
- Parts/stock board (985177480) is even less documented

**Recommendation:** Before the intake build starts, have an agent (operations or systems) do a comprehensive Monday.com audit covering:
1. Full column inventory — every column on both boards, what it stores, how often it's populated
2. Status workflow — actual status transitions observed in real data (not assumed)
3. Active vs dead columns — which columns have data on >10% of items
4. Integration points — what writes to Monday now (n8n, Intercom, Typeform, manual)
5. Group structure — what the 33 groups represent, active vs archived

**This audit is NOT blocking the builds/ directory creation** — it's written into the intake SPEC.md as a "before you build" prerequisite and noted as a blocker in INDEX.md. The agent audit can happen in parallel.

**Ricky will handle the Monday audit separately.** Just document it as a blocker in the intake SPEC.md and INDEX.md.

---

## Verification (per phase)

### After Phase 1:
```bash
ssh ricky@46.225.53.159 "find /home/ricky/builds -type f | sort"
ssh ricky@46.225.53.159 "cd /home/ricky/builds && git log --oneline"
ssh ricky@46.225.53.159 "head -60 /home/ricky/builds/INDEX.md"
```
Confirm: 9 directories exist, git repo initialized, 5 stub READMEs have snapshot docs, INDEX.md is accurate with dependencies.

### After Phase 1.5:
Confirmed paths document — every source file either has a verified VPS path or is flagged as a gap. No TODOs remain.

### After Phase 2a:
```bash
ssh ricky@46.225.53.159 "ls -la /home/ricky/builds/intake-system/device-flows/"
ssh ricky@46.225.53.159 "ls -la /home/ricky/builds/intake-system/reference/transcripts/"
ssh ricky@46.225.53.159 "cd /home/ricky/builds && git log --oneline"
```
Confirm: all device flow files present, all transcripts present, audit data present. Any gaps reported.

### After Phase 2b:
```bash
ssh ricky@46.225.53.159 "wc -l /home/ricky/builds/intake-system/SPEC.md"
ssh ricky@46.225.53.159 "wc -l /home/ricky/builds/intake-system/flows/*.md"
ssh ricky@46.225.53.159 "wc -l /home/ricky/builds/intake-system/integrations.md"
```
Confirm:
- SPEC.md is ~800-1000 lines (main doc)
- 4 flow docs present (~300-500 lines each)
- integrations.md present
- SOURCE-MAP.md documents provenance for every section
- **Buildability test:** Open a fresh Claude Code session, give it only `builds/intake-system/`. Can it start building the MVP without asking clarifying questions? If not, the spec has gaps.

### After Phase 3a/3b/3c:
```bash
ssh ricky@46.225.53.159 "wc -l /home/ricky/builds/*/SPEC.md"
ssh ricky@46.225.53.159 "cd /home/ricky/builds && git log --oneline"
```
Confirm:
- 4 full SPEC.md files (intake, intercom, inventory, website)
- INDEX.md updated with correct status and dependencies for all builds
- Each SPEC is self-contained and buildable

### After Phase 4:
```bash
ssh ricky@46.225.53.159 "grep -l 'Build Registry' ~/.openclaw/agents/*/workspace/CLAUDE.md"
```
Confirm: 7 agent CLAUDE.md files updated, no existing sections broken.
