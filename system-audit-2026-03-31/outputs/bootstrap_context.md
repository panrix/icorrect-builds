# Bootstrap Context

Date: 2026-03-31

## Business Model

- `Observed`: iCorrect is Panrix Limited, a specialist Apple repair and refurbishment business focused on board-level and complex repair work.
- `Observed`: Current revenue is approximately `~£52k/month` with annualized revenue around `~£624k`.
- `Observed`: Revenue mix is dominated by Back Market at `~60%`, followed by direct customers at `~30%`, and corporate accounts at `~10%`.
- `Observed`: The business is trying to scale through documented processes, queue management, and agent-driven visibility rather than ad hoc operator judgment.

## Likely Active Core Systems

- `Observed`: Monday.com is the operational backbone and main workflow tracker.
- `Observed`: Back Market is the largest revenue channel and has dedicated scripts, SOPs, webhook services, and board mappings.
- `Observed`: Intercom handles customer service and inbound enquiries.
- `Observed`: Shopify is used for website / online booking / ecommerce.
- `Observed`: n8n Cloud is present as an automation platform.
- `Observed`: Supabase exists as a shadow / automation / data infrastructure layer.
- `Observed`: VPS-hosted services support intake, iCloud checking, BM grade checking, BM payout, and BM shipping flows.

## Likely Highest-Value Investigation Paths

1. Monday.com main board and BM devices board schema, automations, and integrations.
2. Back Market process chain from order arrival to payout, refurbishment, listing, sale, and shipping.
3. Intake services and Monday-triggered webhook flows.
4. n8n workflows connecting Monday, Intercom, and other platforms.
5. Shopify, Intercom, and finance systems as supporting channels around the core operations stack.

## Active vs Reference-Only Context

- `Observed`: `/home/ricky/builds/backmarket/README.md` states SOPs are the source of truth for BM operations.
- `Observed`: `/home/ricky/README.md` states `mission-control-v2` is a legacy repo retained for reference, not active runtime.
- `Observed`: `INDEX.md` includes a stale section; those sources should not be treated as primary evidence unless current systems point back to them.
- `Observed`: `INDEX.md` references `/home/ricky/builds/backmarket/docs/buyback-optimisation-strategy.md`, but the live path is missing; only a historical version exists.

## Major Operational Themes From Reading

- `Observed`: The business has a strong evidence-first principle and explicitly forbids hallucination.
- `Observed`: Process documentation is identified internally as a critical gap.
- `Observed`: Queue management, intake consistency, and remote visibility from Bali to London are central operating problems.
- `Observed`: Back Market profitability is highly grade- and model-dependent; NFU and NFC appear strategically stronger than FC in current analysis.
- `Observed`: Monday's current schema mixes repair, comms, shipping, QC, and BM trade-in concerns in ways that create workflow ambiguity.

## Immediate Research Priorities

- verify access and scope across all env-backed platforms
- inventory Monday boards, columns, automations, and integrations
- map BM-connected VPS services and their webhook routes
- trace real intake, repair, refurb, listing, and shipping flows across systems
- identify dormant, broken, or manual process steps that create operational risk
