# KB Consolidation Brief

> Historical note: this brief reflects an earlier bulk-consolidation approach that was later superseded. It is retained as method history only. The current rule is evidence-first promotion into `/home/ricky/kb`.

**Goal:** Consolidate agent workspace knowledge into `/home/ricky/kb/` (the single shared knowledge base).

**Rule:** Only Jarvis writes to `/kb/`. This task is run by Code on Jarvis's behalf.

**Current state of `/kb/`:** 20 files across 6 domains (monday, pricing, backmarket, operations, team, system). Created 2026-03-16 during Phase 1 rebuild. Contains basic reference data but missing the deep knowledge agents have built.

---

## What Exists in Agent Workspaces

Each agent has `docs/` and `knowledge/` directories with domain-specific files built over weeks of work.

| Agent | docs/ lines | knowledge/ lines | Key files |
|-------|------------|-----------------|-----------|
| main | 1,755 | 100 | buyback-profit-model.md, buyback-monday-schema.md, profit-calculator-spec.md, intake-process-v2.md |
| backmarket | 4,988 | 6 | 7 SOPs (sales, pricing, tradein, listing, errors, aftersales, pricing-to-listing), bm-api-reference.md, n8n-flows-full-audit.md, KNOWLEDGE-BASE.md |
| operations | 3,644 | 6 | macbook-flows.md, iphone-flows.md, ipad-flows.md, apple-watch-flows.md, INTAKE-SYNTHESIS.md, KNOWLEDGE-BASE.md |
| customer-service | 5,208 | 6 | intercom-handling.md, intercom-audit-february-2026.md, conversion-analysis.md, finn-improvement-guide.md, KNOWLEDGE-BASE.md |
| marketing | 3,714 | 6 | seo-audit-feb-2026.md, bounce-rate-report-mar-2026.md, video-automation-research.md, shopify-agent-brief.md, KNOWLEDGE-BASE.md |
| team | 5,286 | 6 | team-performance-audit.md, bm-diagnostic-analysis.md, per-person profiles in subdirs, KNOWLEDGE-BASE.md |
| parts | 1,741 | 6 | screen-prediction-research.md, refurb-pipeline-board-spec.md, RICKY-REQUIREMENTS.md, KNOWLEDGE-BASE.md |
| website | 4,293 | 6 | website-conversion-crisis.md, theme-changelog.md, mobile-audit.md, ux-audit.md, KNOWLEDGE-BASE.md |
| alex-cs | 4,480 | 0 | 30+ service files (knowledge-base/), pricing files, intercom-api-reference.md, triage-mapping.md |
| arlo-website | 3,574 | 0 | theme-architecture.md, conversion-funnel.md, seo-page-structure.md, posthog-setup.md, ux-mobile-audit.md |

**Total: ~38,683 lines of domain knowledge across 10 agents.**

---

## Task: Consolidate to /kb/

### Approach

1. Read each agent's `docs/KNOWLEDGE-BASE.md` first (these are agent-curated summaries)
2. Read the detailed files in each agent's `docs/` and `knowledge/`
3. Extract company-level knowledge (not agent-specific session notes)
4. Merge into existing `/kb/` structure, adding new sections as needed
5. Add `Last verified: 2026-03-16` headers to all new/updated files
6. Do NOT delete source files in agent workspaces (they stay as local reference)

### What goes into /kb/ vs stays in agent workspace

**Goes into /kb/:**
- SOPs and standard processes (backmarket SOPs, operations flows)
- Technical reference (BM API, Monday board schemas, Intercom API)
- Pricing data (already there, verify up to date)
- Team profiles and performance benchmarks
- Repair flows by device type (iPhone, iPad, MacBook, Watch)
- Customer service handling procedures
- Website architecture and conversion data
- Parts/inventory reference
- Verified business metrics and benchmarks

**Stays in agent workspace:**
- Session-specific notes and context files
- Draft/WIP analysis
- Subagent context files
- Strategy context (agent-specific framing)
- Historical audits (point-in-time snapshots)

### Proposed /kb/ structure after consolidation

```
/home/ricky/kb/
├── README.md
├── monday/                      # EXISTS - verify and expand
│   ├── main-board.md
│   ├── bm-devices-board.md
│   ├── parts-board.md
│   └── board-relationships.md
├── pricing/                     # EXISTS - verify current
│   ├── iphone.md
│   ├── macbook.md
│   ├── ipad.md
│   ├── watch.md
│   └── services.md
├── backmarket/                  # EXISTS - add SOPs
│   ├── trade-in-workflow.md
│   ├── grading-criteria.md
│   ├── fee-structure.md
│   ├── sop-sales.md             # NEW from backmarket agent
│   ├── sop-pricing.md           # NEW
│   ├── sop-listing.md           # NEW
│   ├── sop-tradein.md           # NEW
│   ├── sop-errors.md            # NEW
│   ├── sop-aftersales.md        # NEW
│   └── api-reference.md         # NEW
├── operations/                  # EXISTS - add repair flows
│   ├── intake-flow.md
│   ├── qc-workflow.md
│   ├── queue-management.md
│   ├── macbook-repair-flows.md  # NEW from operations agent
│   ├── iphone-repair-flows.md   # NEW
│   ├── ipad-repair-flows.md     # NEW
│   └── watch-repair-flows.md    # NEW
├── team/                        # EXISTS - add profiles
│   ├── roster.md
│   ├── escalation-paths.md
│   └── performance-benchmarks.md # NEW from team agent
├── customer-service/            # NEW section
│   ├── intercom-handling.md
│   ├── triage-mapping.md
│   ├── reply-templates.md
│   └── finn-ai-config.md
├── website/                     # NEW section
│   ├── theme-architecture.md
│   ├── conversion-funnel.md
│   ├── seo-structure.md
│   └── posthog-setup.md
├── parts/                       # NEW section
│   ├── screen-costs.md
│   ├── supplier-info.md
│   └── stock-management.md
├── marketing/                   # NEW section
│   ├── seo-audit.md
│   └── channel-strategy.md
└── system/                      # EXISTS - verify
    ├── agent-map.md
    └── supabase-schema.md
```

### Source file paths

All agent workspaces are at: `~/.openclaw/agents/{agent-id}/workspace/`

Key files to read per agent:

**backmarket:** `docs/SOP-*.md` (7 files), `docs/bm-api-reference.md`, `docs/KNOWLEDGE-BASE.md`
**operations:** `docs/macbook-flows.md`, `docs/iphone-flows.md`, `docs/ipad-flows.md`, `docs/apple-watch-flows.md`, `docs/INTAKE-SYNTHESIS.md`, `docs/KNOWLEDGE-BASE.md`
**customer-service:** `docs/intercom-handling.md`, `docs/KNOWLEDGE-BASE.md`, `docs/conversion-analysis.md`
**marketing:** `docs/seo-audit-feb-2026.md`, `docs/KNOWLEDGE-BASE.md`
**team:** `docs/team-performance-audit.md`, `docs/KNOWLEDGE-BASE.md`, team member profiles in subdirs
**parts:** `docs/screen-prediction-research.md`, `docs/KNOWLEDGE-BASE.md`, `docs/RICKY-REQUIREMENTS.md`
**website:** `docs/website-conversion-crisis.md`, `docs/theme-changelog-v11-to-v18.md`, `docs/KNOWLEDGE-BASE.md`
**alex-cs:** `docs/knowledge-base/` (30+ service files), `docs/intercom-api-reference.md`, `docs/triage-mapping.md`
**arlo-website:** `docs/theme-architecture.md`, `docs/conversion-funnel.md`, `docs/seo-page-structure.md`, `docs/posthog-setup.md`
**main (Jarvis):** `knowledge/buyback-strategy.md`, `knowledge/revenue-model.md`, `docs/buyback-profit-model.md`

### Quality rules

- Every file in /kb/ must have `Last verified: YYYY-MM-DD` at the top
- Strip agent-specific framing ("I was asked to...", "In this session...")
- Write as reference docs, not narratives
- Include source attribution: "Source: {agent} workspace, {filename}"
- If data conflicts between agents, flag it with `⚠️ CONFLICT:` and include both versions
- Remove stale/outdated info (pre-2026 data that's been superseded)
- Keep files focused: one topic per file, max ~200 lines each

### Verification

After completion:
1. List all files in /kb/ with line counts
2. Confirm no broken references
3. Spot-check 3 random files for quality (headers, attribution, no agent framing)
4. Report what was added, what was updated, what was skipped and why

---

## Deduplication cleanup

The same files were bulk-copied across many agents during an earlier build. After consolidation, remove duplicates from agent workspaces and replace with KB references.

**Files duplicated across 5+ agents (remove after canonical version exists in /kb/):**
- `ricky-qa-answers.md` — 14 agents
- `strategy-context.md` — 11 agents
- `team-context.md` — 11 agents
- `subagent-context.md` — 11 agents
- `KNOWLEDGE-BASE.md` — 13 agents
- `otter-transcript-insights.md` — 9 agents
- `macbook-flows.md` — 5 agents
- `iphone-flows.md` — 5 agents
- `ipad-flows.md` — 5 agents
- `apple-watch-flows.md` — 5 agents
- `ferrari-guide.md` — 3 agents

**Process:**
1. Read one canonical version (prefer the most complete/recent)
2. Consolidate into appropriate /kb/ file
3. Delete copies from all agent workspaces EXCEPT the originating agent
4. Leave a one-line pointer file if needed: `See /home/ricky/kb/{path}`

**Dead agents to clean up (archived/inactive, still holding duplicate files):**
- `finance-archived`, `schedule-archived`, `finn`, `processes`, `pm`, `research-bm`
- `qa-code`, `qa-data`, `qa-plan` (QA system — check if still active before deleting)
- Safe to archive entire workspace dirs to `/home/ricky/archive/agents/`

---

## builds/ knowledge bridge

Analysis in `/home/ricky/builds/` is invisible to agents. Key docs to link or summarise in /kb/:

- `/builds/buyback-monitor/docs/PROFITABILITY-FINDINGS.md` → summarise in `kb/backmarket/profitability.md`
- `/builds/buyback-monitor/docs/V2-V3-ROADMAP.md` → reference in `kb/backmarket/`
- `/builds/buyback-monitor/docs/BM-PRODUCT-PAGE-STRUCTURE.md` → reference in `kb/backmarket/`
- `/builds/pricing-sync/reports/unmatched-items-2026-03-16.md` → summarise in `kb/pricing/sync-gaps.md`
- `/builds/intake-system/FORM-FLOW.md` → reference in `kb/operations/intake-flow.md`
- `/builds/research/memory-problem.md` → reference in `kb/system/`

**Rule going forward:** when Code completes analysis in `/builds/`, conclusions get promoted to `/kb/` by Jarvis. Raw data and scripts stay in `/builds/`.

---

## KB maintenance (post-consolidation)

The KB will rot without active maintenance. Add these to Jarvis's responsibilities:

### Heartbeat task (every heartbeat)
- Scan agent `knowledge/` dirs for files modified since last check
- If new conclusions found, evaluate whether to promote to `/kb/`
- Quick staleness check: any `/kb/` file with `Last verified` older than 30 days? Flag it.

### Weekly cron (Sunday evening UTC)
- Full `/kb/` audit: read every file, check `Last verified` dates
- Cross-reference with agent workspaces for newer data
- Scan `/builds/` for new analysis docs created since last check
- Output: maintenance report to Jarvis's `knowledge/kb-maintenance-log.md`
- If anything needs updating, update it directly

### Conflict detection
- If an agent writes something to `knowledge/` that contradicts `/kb/`, flag to Ricky
- Don't silently overwrite; present both versions

### Staleness thresholds
- Pricing files: verify weekly (prices change)
- Monday schemas: verify monthly (columns rarely change)
- SOPs: verify monthly
- Team roster: verify on any staffing change
- System/agent map: verify on any config change

---

## Estimated scope

- ~40 source files to read across 10 agents
- ~20-25 KB files to create or update
- ~80 duplicate files to remove across agent workspaces
- ~6 builds/ docs to bridge into KB
- Should take one focused Code session
