# INDEX.md — Document Map for iCorrect VPS

**Generated:** 2026-02-26
**Purpose:** Single source of truth for what documentation exists, where it lives, and what domain it belongs to.
**Total docs found:** 756 markdown files across 5 major locations (excluding node_modules)

---

## Location Summary

| Location | Files | Purpose |
|----------|-------|---------|
| Agent workspaces (`~/.openclaw/agents/`) | 530 | Agent configs, memory, SOPs, docs |
| Builds (`~/builds/`) | 103 | Build specs, research, project docs |
| Claude SOPs (`~/Claude-SOPs-for-iCorrect/`) | 29 | Human-facing SOPs from Claude.ai |
| Mission Control v2 (`~/mission-control-v2/`) | 86 | MC v2 build docs, agent definitions |
| Shared foundation (`~/.openclaw/shared/`) | 8 | Read-only company docs |

---

## Agent Workspace File Counts

| Agent | Files | Status | Notes |
|-------|-------|--------|-------|
| backmarket | 54 | Active | 7 SOPs, heavy clutter (HTML scrapes, JSON dumps, legacy files) |
| systems | 44 | Active | Infrastructure docs, Monday automations |
| team | 34 | Active | Hiring analysis, team performance data |
| website | 33 | Active | Shopify, PostHog, conversion docs |
| operations | 31 | Active | Intake flows, Xero workflows, BUT no ops SOPs |
| customer-service | 29 | Active | 1 SOP only, Intercom audit, build spec |
| marketing | 24 | Active | Market analysis, growth plans |
| parts | 21 | Active | Inventory specs, stock proposals |
| main (Jarvis) | 16 | Active | Cleanest workspace — post doc-06 cleanup |
| slack-jarvis | 9 | Low activity | Meeting agendas, Slack integration |
| qa-plan | 5 | Dormant | QA pipeline (never used in production) |
| pm | 1 | Dormant | Workflow orchestrator (unused) |
| qa-code | 1 | Dormant | Code reviewer (unused) |
| qa-data | 1 | Dormant | Fact verifier (unused) |

---

## Domain: BackMarket

### SOPs (7 — in agent workspace)

| File | Path | Last Modified | Status |
|------|------|---------------|--------|
| SOP-daily.md | agents/backmarket/workspace/docs/SOPs/ | Feb 23 | NEEDS VERIFICATION |
| SOP-tradein.md | agents/backmarket/workspace/docs/SOPs/ | Feb 23 | NEEDS VERIFICATION |
| SOP-sales.md | agents/backmarket/workspace/docs/SOPs/ | Feb 22 | NEEDS VERIFICATION |
| SOP-pricing.md | agents/backmarket/workspace/docs/SOPs/ | Feb 23 | NEEDS VERIFICATION |
| SOP-listing.md | agents/backmarket/workspace/docs/SOPs/ | Feb 24 | NEEDS VERIFICATION |
| SOP-aftersales.md | agents/backmarket/workspace/docs/SOPs/ | Feb 23 | NEEDS VERIFICATION (flagged incomplete) |
| SOP-errors.md | agents/backmarket/workspace/docs/SOPs/ | Feb 22 | NEEDS VERIFICATION |
| REF.md | agents/backmarket/workspace/docs/SOPs/ | Feb 26 | Reference doc for SOPs |
| README.md | agents/backmarket/workspace/docs/SOPs/ | Feb 23 | SOP index |
| SOPs_ARCHIVED_2026-02-22.md | agents/backmarket/workspace/docs/ | Feb 21 | OLD VERSION — archive candidate |

### Process / Business Docs

| File | Path | Domain | Status |
|------|------|--------|--------|
| bm-api-reference.md | agents/backmarket/workspace/docs/ | BM API | Existing API docs — CHECK against real API |
| process-map.md | agents/backmarket/workspace/docs/ | BM Workflows | NEEDS VERIFICATION |
| KNOWLEDGE-BASE.md | agents/backmarket/workspace/docs/ | BM Overview | Existing knowledge base |
| pricing-module-plan.md | agents/backmarket/workspace/docs/ | BM Pricing | Plan for pricing module |
| pricing-audit-2026-02-14.md | agents/backmarket/workspace/docs/ | BM Pricing | Feb audit |
| DOC-GAPS.md | agents/backmarket/workspace/docs/ | BM | Documents what is missing |
| ACTION-ITEMS.md | agents/backmarket/workspace/docs/ | BM | Outstanding actions |
| n8n-flows-analysis.md | agents/backmarket/workspace/docs/ | BM Automation | n8n workflow mapping |
| ISSUES.md | agents/backmarket/workspace/ | BM | Operational issue tracker |

### Pricing Research (new, from other Code session)

| File | Path | Domain | Status |
|------|------|--------|--------|
| sales-audit-2026-02-26.md | builds/backmarket/audit/ | BM Pricing | FRESH — today's analysis |
| bm-market-prices-supabase.md | builds/backmarket/pricing/ | BM Pricing | Supabase pricing data |
| bm-price-history-supabase.md | builds/backmarket/pricing/ | BM Pricing | Price history analysis |
| pricing-module-plan.md | builds/backmarket/pricing/snapshot/ | BM Pricing | DUPLICATE of agent workspace copy |
| pricing-audit-2026-02-14.md | builds/backmarket/pricing/snapshot/ | BM Pricing | DUPLICATE of agent workspace copy |
| bm-trade-in-operations.md | builds/backmarket/docs/ | BM Ops | Trade-in operations doc |
| api-migration.md | builds/backmarket/api/ | BM API | API migration notes |

### BM Docs in Claude SOPs

| File | Path | Status |
|------|------|--------|
| 01_BM_Pre_Validation_SOP.md | Claude-SOPs-for-iCorrect/ | UNVERIFIED — from Claude.ai memory |
| 04_BM_Shipping_SOP.md | Claude-SOPs-for-iCorrect/ | UNVERIFIED |
| 18_BM_PreValidation_Checklist.md | Claude-SOPs-for-iCorrect/ | UNVERIFIED |
| 25_BM_Counter_Offer_Guidelines.md | Claude-SOPs-for-iCorrect/ | UNVERIFIED |

### Known Duplicates (BM)
- `pricing-module-plan.md` exists in BOTH `agents/backmarket/workspace/docs/` AND `builds/backmarket/pricing/snapshot/`
- `pricing-audit-2026-02-14.md` exists in BOTH locations
- `bm-trade-in-operations.md` in `builds/backmarket/docs/` overlaps with `builds/documentation/raw-imports/backmarket-trade-in-operations.md`

---

## Domain: Operations / Workshop

### SOPs
**NONE found in operations workspace.** This is a significant gap.

### Process Docs

| File | Path | Domain | Status |
|------|------|--------|--------|
| BM1460-profitability-analysis.md | agents/operations/workspace/reports/ | Finance | Case study |
| Xero workflow JSONs (3) | agents/operations/workspace/ | Finance | n8n automation flows |
| INTAKE-SYNTHESIS.md | agents/operations/workspace/ | Intake | Synthesized from 7 transcripts |
| intake device flows (4) | agents/operations/workspace/docs/ | Intake | iPhone, MacBook, iPad, Watch |
| DEV-BRIEF.md | agents/operations/workspace/ | Intake | Dev spec |
| SPEC.md | agents/operations/workspace/ | Intake | Build spec |

### Ops Docs in Claude SOPs
| File | Path | Status |
|------|------|--------|
| 02_Client_DropOff_Process.md | Claude-SOPs-for-iCorrect/ | UNVERIFIED |
| 03_Client_Collection_Process.md | Claude-SOPs-for-iCorrect/ | UNVERIFIED |
| 05_QC_Process_Guide.md | Claude-SOPs-for-iCorrect/ | UNVERIFIED |
| 06_WalkIn_Quick_Checklist.md | Claude-SOPs-for-iCorrect/ | UNVERIFIED |
| 09_Technician_Performance_Framework.md | Claude-SOPs-for-iCorrect/ | UNVERIFIED |
| 10_Inventory_Management_Guide.md | Claude-SOPs-for-iCorrect/ | UNVERIFIED |
| 12_Escalation_Protocols.md | Claude-SOPs-for-iCorrect/ | UNVERIFIED |
| 22_Repair_Standards_Reference.md | Claude-SOPs-for-iCorrect/ | UNVERIFIED |
| 23_Liquid_Damage_Assessment_Protocol.md | Claude-SOPs-for-iCorrect/ | UNVERIFIED |

### Intake System Build

| File | Path | Status |
|------|------|--------|
| SPEC.md | builds/intake-system/ | Build spec ready |
| standard-repair-flow.md | builds/intake-system/flows/ | Flow spec |
| bm-tradein-flow.md | builds/intake-system/flows/ | Flow spec |
| diagnostic-intake-flow.md | builds/intake-system/flows/ | Flow spec |
| client-ipad-flow.md | builds/intake-system/flows/ | Flow spec |
| iphone-flows.md | builds/intake-system/device-flows/ | Device decision tree |
| macbook-flows.md | builds/intake-system/device-flows/ | Device decision tree |
| ipad-flows.md | builds/intake-system/device-flows/ | Device decision tree |
| apple-watch-flows.md | builds/intake-system/device-flows/ | Device decision tree |
| intake-audit-2026-02-18.md | builds/intake-system/reference/ | 58KB audit |

---

## Domain: Customer Service

### SOPs (1 only)
| File | Path | Status |
|------|------|--------|
| intercom-handling.md | agents/customer-service/workspace/docs/SOPs/ | NEEDS VERIFICATION |

### Key Docs
| File | Path | Status |
|------|------|--------|
| SPEC.md (29KB) | agents/customer-service/workspace/docs/intercom-agent-build/ | Intercom agent build spec |
| intercom-audit-feb2026.md | agents/customer-service/workspace/docs/ | FRESH — Feb 26 audit |
| CS_JARVIS_INTERCOM_AUDIT_TASK.md | agents/customer-service/workspace/docs/ | Audit task |
| intercom-sweep.md | agents/customer-service/workspace/memory/ | Feb 26 session |

### CS in MC v2 Docs
| File | Path | Status |
|------|------|--------|
| intercom-audit-2026-02.md | mission-control-v2/docs/intercom/ | Earlier audit |
| intercom-agent-led-comms-spec.md | mission-control-v2/docs/intercom/ | Agent comms spec |
| intercom-audit-part2-conversations.md | mission-control-v2/docs/intercom/ | Conversation analysis |

### CS Docs in Claude SOPs
| File | Path | Status |
|------|------|--------|
| 08_FinAI_Implementation_Guide.md | Claude-SOPs-for-iCorrect/ | UNVERIFIED |
| 16_Common_Objections_Reference.md | Claude-SOPs-for-iCorrect/ | UNVERIFIED |

---

## Domain: Finance

### Key Docs
| File | Path | Status |
|------|------|--------|
| BRIEF.md | builds/xero-invoice-automation/ | Invoice automation spec |
| SETUP.md | builds/xero-invoice-automation/ | Setup instructions |
| finance-cashflow.md | builds/documentation/raw-imports/ | UNVERIFIED import |
| BM1460-profitability-analysis.md | agents/operations/workspace/reports/ | Case study |
| FINANCE-MERGE.md | builds/agents/ | Finance -> Operations merge doc |

---

## Domain: Monday.com

### Key Docs
| File | Path | Status |
|------|------|--------|
| main-board-column-audit.md (65KB) | builds/documentation/monday/ | COMPREHENSIVE — full column audit |
| target-state.md (27KB) | builds/documentation/monday/ | Target board design |
| automations.md (28KB) | builds/documentation/monday/ | Automation mapping |
| repair-flow-traces.md (37KB) | builds/documentation/monday/ | Python-traced repair flows |
| board-schema.md (16KB) | builds/documentation/monday/ | Board structure |
| cleanup-brief.md | builds/documentation/monday/ | Cleanup plan |
| QUERY-SPEC.md | builds/documentation/monday/ | API query specs |

---

## Domain: Marketing

### Key Docs
| File | Path | Notes |
|------|------|-------|
| 24 files in marketing workspace | agents/marketing/workspace/ | Growth plans, market analysis |
| MI-BUILD-BRIEF.md | builds/marketing-intelligence/snapshot/ | Marketing Intelligence spec |
| marketing-intelligence-platform-spec.md | builds/marketing-intelligence/snapshot/ | Full platform spec (BROKEN build) |

---

## Domain: Website

### Key Docs
| File | Path | Notes |
|------|------|-------|
| 33 files in website workspace | agents/website/workspace/ | Shopify, PostHog, conversion |
| SPEC.md | builds/website-conversion/ | Conversion spec |
| Shopify theme | builds/icorrect-shopify-theme/ | Moved from workspace (doc 06) |

---

## Domain: Parts / Inventory

### Key Docs
| File | Path | Notes |
|------|------|-------|
| 21 files in parts workspace | agents/parts/workspace/ | Stock proposals, inventory specs |
| SPEC.md | builds/inventory-system/ | Inventory system spec |

---

## Domain: General / Cross-Cutting

### Foundation Docs (read-only, ~/.openclaw/shared/)
| File | Size | Purpose |
|------|------|---------|
| COMPANY.md | 3.4KB | What iCorrect is |
| TEAM.md | 10.7KB | Team structure |
| GOALS.md | 8.4KB | Business goals |
| PROBLEMS.md | 8.9KB | Known problems |
| PRINCIPLES.md | 5.2KB | Decision framework |
| VISION.md | 2.7KB | Business direction |
| RICKY.md | 4.8KB | Who Ricky is |
| SUPABASE.md | 1.5KB | Database schema |

### Agent Rebuild Docs (this project)
| File | Path | Purpose |
|------|------|---------|
| 00-why.md | builds/agent-rebuild/ | Why v3 |
| 01-lessons-learned.md | builds/agent-rebuild/ | v2 post-mortem |
| 02-knowledge-map.md | builds/agent-rebuild/ | Doc audit |
| 03-sequencing.md | builds/agent-rebuild/ | Build order |
| 04-agent-architecture-spec.md | builds/agent-rebuild/ | v3 template |
| 05-memory-problem.md | builds/agent-rebuild/ | Memory analysis |
| 06-jarvis-fixes.md | builds/agent-rebuild/ | Pre-rebuild fixes |
| 07-supabase-audit.md | builds/agent-rebuild/ | Data layer audit |
| 08-research-needed.md | builds/agent-rebuild/ | Research task list |
| 09-research-agents.md | builds/agent-rebuild/ | Research agent plan |
| 10-handoff.md | builds/agent-rebuild/ | Handoff context |

### Claude SOPs (29 — all UNVERIFIED)
Located at `/home/ricky/Claude-SOPs-for-iCorrect/`. Created Feb 24 from Claude.ai conversation history. Human-facing SOPs covering drop-off, collection, shipping, QC, BM pre-validation, escalation, warranty, repair standards, liquid damage, model identification, Monday board guide, supplier directory, training, onboarding, KPIs, automation strategy.

**Status: ALL UNVERIFIED.** These need checking against current practice before any agent uses them.

### MC v2 Agent Definitions (duplicate source of truth)
Located at `/home/ricky/mission-control-v2/agents/`. Contains CLAUDE.md and SOUL.md for 10+ agents. These are SEPARATE from the actual agent workspace files. Some diverge from the runtime versions. **Not the source of truth — actual workspace files are.**

### Historical Build Docs
Located at `/home/ricky/builds/agents/`. 25 files including PRD.md (57KB), BUILD-PLAN.md (44KB), PRD-HANDOFF.md (35KB), BUILD.md (22KB). These are v2 build plans — historical reference only.

---

## Duplication Summary

| Content | Locations Found | Canonical |
|---------|----------------|-----------|
| BM pricing module plan | agents/backmarket/docs/, builds/backmarket/pricing/snapshot/ | agents/backmarket/docs/ |
| BM pricing audit | agents/backmarket/docs/, builds/backmarket/pricing/snapshot/ | agents/backmarket/docs/ |
| BM trade-in operations | builds/backmarket/docs/, builds/documentation/raw-imports/ | builds/backmarket/docs/ |
| Agent CLAUDE.md definitions | agents/*/workspace/, mission-control-v2/agents/ | agents/*/workspace/ (runtime) |
| Foundation docs content | ~/.openclaw/shared/, agents/*/docs/shared-context/ | ~/.openclaw/shared/ |
| Monday schema | builds/documentation/monday/, builds/documentation/raw-imports/ | builds/documentation/monday/ |
| QA trigger docs | builds/agents/qa-trigger/, mission-control-v2/docs/qa-trigger/ | BOTH identical — remove one |
| Intercom audit | agents/cs/docs/, mission-control-v2/docs/intercom/ | agents/cs/docs/ (newer) |

---

## Key Gaps (No Documentation Found)

1. **Operations SOPs** — zero SOPs for workshop operations (repair flow, queue management, QC, team scheduling)
2. **Finance SOPs** — no invoicing, cash flow, or tax compliance procedures
3. **Supplier directory** — Claude SOP #26 exists but UNVERIFIED
4. **Daily workshop routine** — no documentation of open/close procedure
5. **Pricing decision framework** — how are repair prices set? No doc found.
6. **Customer communication templates** — what do status update messages say?
7. **Parts ordering process** — no documented procedure

---

## Recommendations for Research Agents

For each research agent, load into `research/reference/`:

| Agent | Load These Existing Docs |
|-------|------------------------|
| research-bm | 7 SOPs, process-map.md, KNOWLEDGE-BASE.md, bm-api-reference.md, pricing analysis from builds/backmarket/, relevant Claude SOPs (#01, #04, #18, #25) |
| research-ops | Intake flows + synthesis, device flows, repair-flow-traces.md, relevant Claude SOPs (#02, #03, #05, #06, #22, #23) |
| research-cs | intercom-handling SOP, intercom-audit-feb2026.md, SPEC.md, relevant Claude SOPs (#08, #16) |
| research-finance | xero BRIEF.md + SETUP.md, finance-cashflow.md, BM1460 profitability analysis |

This way agents start from what exists, not from zero.

---

## Active Work (Do Not Duplicate)

### BackMarket API & Pricing (IN PROGRESS — separate Code session)

Location: /home/ricky/builds/backmarket/

| File | Purpose | Status |
|------|---------|--------|
| api/api-migration.md | API migration notes | Existing |
| api/bm-full-chain.py | Full chain data extraction script | ACTIVE — Feb 26 |
| api/bm-full-chain-data.json | Extracted chain data | ACTIVE — Feb 26 |
| api/bm-profit-by-shipdate.py | Profit analysis by ship date | ACTIVE — Feb 26 |
| api/bm-profit-by-solddate.py | Profit analysis by sold date | ACTIVE — Feb 26 |
| api/bm-sku-audit.py | SKU audit script | ACTIVE — Feb 26 |
| audit/sales-audit-2026-02-26.md | Sales audit results | FRESH — Feb 26 |
| pricing/bm-market-prices-supabase.md | Market price data | Existing |
| pricing/bm-price-history-supabase.md | Price history analysis | Existing |

**This work covers BM API endpoint testing and pricing analysis. Do NOT rebuild BM API docs (Task 8 / R-B4) from scratch — incorporate this work.**

### Intercom Audit (FRESH — Feb 26)

Location: /home/ricky/.openclaw/agents/customer-service/workspace/docs/intercom-audit-feb2026.md

**Fresh audit from today. Do NOT redo Intercom capability research — use this as the baseline for Task 10 / R-D4.**

---

## Session 1 Completion Status (2026-02-26)

| Task | Output File | Status |
|------|------------|--------|
| R-A0 Doc Index | INDEX.md | DONE |
| R-A1 OpenClaw Config | openclaw-config-audit.md | DONE |
| R-A2 Cron Audit | cron-audit.md | DONE |
| R-B1 BM Workspace | workspace-audit-backmarket.md | DONE |
| R-C1 Ops Workspace | workspace-audit-operations.md | DONE |
| R-D1 CS Workspace | workspace-audit-cs.md | DONE |
| R-E1 Jarvis Workspace | workspace-audit-jarvis.md | DONE |
| R-A6 Token Budget | — | NOT DONE (deferred to Session 2) |
| R-B4 BM API Docs | — | PARTIALLY COVERED by builds/backmarket/api/ (separate session) |
| R-C5 Xero API | — | NOT DONE |
| R-D4 Intercom API | — | PARTIALLY COVERED by intercom-audit-feb2026.md |
| R-A5 Templates | — | NOT DONE |

---

## Session 2 Completion Status (2026-02-26)

| Task | Output File | Status |
|------|------------|--------|
| R-A6 Token Budget | token-budget-analysis.md | DONE |
| R-B4 BM API Docs | bm-api-reference.md | DONE (consolidated from existing 44-endpoint reference + scripts) |
| R-C5/C6 Xero API | xero-api-reference.md | DONE (19KB, 347 lines — integration state, 13 issues found) |
| R-D4 Intercom | intercom-capability-matrix.md | DONE (6 MCP tools tested live, capabilities + limitations mapped) |
| R-A5 Templates | templates/ (9 files) | DONE (SOUL, CLAUDE, USER, SOP, index, data feed, decision log, memory conventions, README) |

**Phase 0 is now COMPLETE.** All technical groundwork tasks from 08-research-needed.md Batch 1, 2, and 3 are done.

### Key Findings from Session 2

1. **Token budget:** Agents waste ~59K tokens on shared-context/ duplication. softThresholdTokens (4000) is critically low.
2. **BM API:** 44 endpoints already documented. Backbox migration deadline March 2026. Hardcoded Monday.com API key in bm-full-chain.py.
3. **Xero:** 4 CRITICAL issues (hardcoded creds in 4 copies, token refresh race condition, placeholder cred IDs, no webhook registered). Invoice creator works, but send-invoice and payment-received are NOT deployed.
4. **Intercom:** 6 MCP tools available — all READ-ONLY. Can search conversations/contacts, read full threads, filter by metrics. Cannot reply, close, tag, or create. CS agent is intelligence/monitoring only.
5. **Templates:** Ready to copy for any new v3 agent workspace.

### Next Step

Phase 0 complete → Build research-bm agent (Step 2 from 10-handoff.md). Ricky needs to:
1. Create Telegram group "BM Research" and add bot
2. Confirm ready to proceed
