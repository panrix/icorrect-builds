# System Audit — 2026-03-31

Evidence-backed audit of iCorrect's business operations, platforms, integrations, and client journeys. Produced by Jarvis + Codex research agents late March / early April 2026.

**Status:** Frozen research pack. Do not treat as live source of truth — verify findings against current state before acting.

**Digest:** See `/home/ricky/builds/agent-rebuild/system-audit-digest.md` for a condensed summary.

---

## Structure

```
system-audit-2026-03-31/
├── README.md                  <- you are here
├── research/
│   ├── finance/               <- Xero, payments, reconciliation, revenue
│   ├── operations/            <- Monday board, queue, SOPs, capacity, timing
│   ├── marketing/             <- SEO, GSC, Shopify, GA4/PostHog, funnels
│   ├── team/                  <- staff performance, operations summary
│   ├── parts/                 <- inventory, suppliers, parts costs
│   ├── customer-service/      <- Intercom, retention, customer identity
│   ├── systems/               <- architecture, data flows, n8n, integrations
│   └── cross-domain/          <- profitability, channel economics, competitors
├── scripts/                   <- 14 Python scripts (near-production, need testing)
├── briefs/                    <- 17 Codex agent task briefs
├── outputs/                   <- working files: discovery log, questions, TODOs
├── client_journeys/           <- 7 customer journey maps
├── platform_inventory/        <- per-platform integration docs (14 platforms)
└── examples/                  <- sample output files
```

## Research by Domain

### Finance (`research/finance/`)
- `financial-mapping.md` — Xero structure, chart of accounts, payment flows
- `payment-truth-target-state.md` — design for reliable payment tracking
- `xero-monday-reconciliation-gap.md` — gaps between Xero and Monday
- `xero-revenue-by-repair.md` — revenue broken down by repair type

### Operations (`research/operations/`)
- `sop-coverage-audit.md` — which SOPs exist, which are missing
- `monday-zombie-triage.md` — stale items analysis (374KB)
- `monday-data-quality-audit.md` — board data quality issues
- `monday-updates-analysis.md` + `blockers` — free-text update mining
- `handoff-failure-matrix.md` — where work gets dropped between stages
- `timing-mapping.md` — duration analysis across repair stages
- `bench-occupancy-measurement.md` — workstation capacity
- `physical-capacity-analysis.md` + `blockers` — throughput limits

### Marketing (`research/marketing/`)
- `marketing-analysis.md` + `blockers` — growth channels, SEO, conversion
- `gsc-profitability-crossref-v2.md` — GSC queries mapped to product profitability (117KB)
- `gsc-repair-profit-rankings.md` — repair service profit rankings from search data
- `shopify-health-audit.md` — Shopify store health (841KB)
- `ga4-posthog-funnel-analysis.md` — conversion funnel analysis

### Team (`research/team/`)
- `staff-performance-analysis.md` + `blockers` — technician output, speed, quality
- `team-operations-summary.md` — team structure and dynamics

### Parts (`research/parts/`)
- `parts-cost-audit.md` — parts cost analysis (66KB)
- `logistics-supplier-analysis.md` + `blockers` — shipping and supplier review
- `supplier-source-of-truth.md` — supplier data rebuild requirements

### Customer Service (`research/customer-service/`)
- `intercom-full-metrics.md` — complete Intercom metrics
- `intercom-metrics-deep.md` — deep conversation analysis
- `customer-retention-analysis.md` + `blockers` — repeat customers, LTV
- `customer-identity-normalisation.md` — Monday customer ID design

### Systems (`research/systems/`)
- `systems-architecture.md` — VPS architecture overview
- `data_flows.md` — how data moves between platforms
- `access_matrix.md` — credentials and API access
- `integration_catalog.csv` — all integrations catalogued
- `n8n-workflow-audit.md` + `triage` — n8n workflow status
- `known_systems.md` — system inventory

### Cross-Domain (`research/cross-domain/`)
- `business-viability-analysis.md` — overall business health
- `channel-economics.md` — revenue and margins by channel (26KB)
- `repair-profitability-v2.md` — per-repair profitability model (345KB)
- `repair-profitability-v2-compact.md` — compressed version (63KB)
- `product-cards.md` — per-product profitability cards (104KB)
- `competitor-benchmarking.md` + `blockers` — London market comparison
- `diagnostics-deep-dive.md` — board-level diagnostics analysis

## Scripts (`scripts/`)

14 Python scripts built by Codex during the audit. All have `__main__` blocks. **Not yet verified as production-ready — need test runs.**

| Script | What It Does |
|--------|-------------|
| `repair_profitability_v2.py` | Per-repair profitability model |
| `gsc_crossref_lean.py` | GSC to product profitability crossref |
| `gsc_profitability_crossref.py` | Full GSC profitability (heavier) |
| `gsc_repair_profit_rankings.py` | Repair profit rankings from GSC |
| `intercom_deep_metrics.py` | Intercom conversation metrics |
| `intercom_full_metrics.py` | Full Intercom metrics suite |
| `monday_zombie_triage.py` | Find stale/zombie Monday items |
| `n8n_workflow_triage.py` | Audit n8n workflows |
| `parts_cost_audit.py` | Parts cost analysis |
| `product_cards.py` | Per-product profitability cards |
| `repair_profitability_model.py` | Repair profitability model (v1) |
| `shopify_health_audit.py` | Shopify store health check |
| `xero_revenue_by_repair.py` | Revenue by repair type from Xero |
| `diagnostics_deep_dive.py` | Board-level diagnostics analysis |

## Verified APIs at time of audit

Monday.com, Intercom, Shopify, Supabase, n8n Cloud, Xero, Stripe, Back Market

## Constraints

- `/home/ricky/config/.env` is the primary credential source
- No production mutations were made during research
- `mission-control-v2` is legacy reference only
