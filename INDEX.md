# /home/ricky/builds/ — Index

> **Strategic roadmap: [`EXECUTIVE-BUILD-PLAN.md`](EXECUTIVE-BUILD-PLAN.md)** — every build, every phase, every idea. Start there for the big picture. This file is the directory map.

Last updated: 2026-04-13

## Active Projects

| Directory | What | Status |
|-----------|------|--------|
| `agent-rebuild/` | v3 agent architecture research & planning (00-10 docs) | Active research |
| `backmarket/` | BM operations: SOPs, automation scripts, analysis tools | Active — see `backmarket/README.md` |
| `icloud-checker/` | Intake webhook service (iCloud check, counter-offers, grade check) | Live (port 8010), needs decomposition |
| `intake-system/` | Device intake flows, diagnostics, BM trade-in flows | Spec complete |
| `icorrect-parts-service/` | Parts reservation/deduction service (Node.js, SQLite) | Built, has .env |
| `icorrect-shopify-theme/` | Shopify theme files | Built |
| `xero-invoice-automation/` | Xero invoice automation | Built |

## BackMarket (`backmarket/`)

**Full docs: `backmarket/README.md`**

| Subdirectory | Contents |
|--------------|----------|
| `sops/` | 12 Standard Operating Procedures (SOP 01-12) |
| `scripts/` | 9 standalone Node.js automation scripts (one per SOP) |
| `analysis/` | 20 Python analysis & pricing scripts |
| `scraper/` | Price scraper tools |
| `docs/` | Strategy docs, verified column reference |
| `qa/` | QA issue tracker, task docs |
| `audit/` | Historical audit reports (markdown) |
| `pricing/` | Pricing module (parked) |
| `data/` | Generated outputs — gitignored |

### Key Files

| File | What |
|------|------|
| `README.md` | **START HERE** — full script/SOP mapping, run order, known bugs |
| `docs/buyback-optimisation-strategy.md` | Why we're optimising, bid grade performance, action plan |
| `docs/VERIFIED-COLUMN-REFERENCE.md` | Ground truth for all Monday column IDs |
| `analysis/bm_utils.py` | Shared Python utility module |
| `analysis/bm-reprice.py` | **LIVE** — pushes price changes to BM API |
| `qa/QA-ISSUES.md` | Known bugs across all scripts |

## Research & Planning

| Directory | What |
|-----------|------|
| `research/` | General research (memory problem, VPS audit) |
| `templates/` | Spec & README templates |
| `scripts/` | Utility scripts |
| `HANDOFF-PROTOCOL.md` | Agent vs Code responsibilities |

## Stale / Needs Audit

| Directory | What | Notes |
|-----------|------|-------|
| `agents/` | Agent plans, QA trigger | May be superseded by agent-rebuild/ |
| `bm-pricing-module/` | Old BM pricing work | Moved to backmarket/pricing/ — can delete |
| `data-architecture/` | Data architecture snapshot | Unknown status |
| `documentation/` | Was docs home, BM files moved out | `monday/` and `raw-imports/` remain |
| `intercom-agent/` | Intercom agent build | Unknown status |
| `inventory-system/` | Inventory system spec | Spec only |
| `marketing-intelligence/` | MI build snapshot | Known broken (see CLAUDE.md) |
| `qa-system/` | QA system snapshot | Unknown status |
| `voice-notes/` | Voice notes snapshot | Unknown status |
| `website-conversion/` | Website conversion | Unknown status |
