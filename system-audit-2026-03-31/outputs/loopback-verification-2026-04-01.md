# Loop-Back Verification

Last updated: 2026-04-01

## Purpose

This note records a consistency pass after adding:
- marketing/growth research
- Monday update mining
- staff performance analysis
- supplier/logistics economics
- retention proxy analysis
- physical-capacity analysis
- competitor benchmarking

## Verification Checks

- `Observed`: the Monday board-wide service summary is internally consistent.
  - exported item count: `4,453`
  - sum of per-service counts: `4,453`

- `Observed`: the repeat-customer surface is aligned to the same board-wide item universe.
  - repeat-surface item count: `4,453`
  - repeat customers `320` do not exceed total identifiable customers `3,944`

- `Observed`: the staff summary is internally consistent.
  - unique completed items: `1,275`
  - sum of per-tech completion counts: `1,275`

- `Observed`: the Monday updates summary is structurally intact and still exposes the expected six-month keys for item count, human/automation split, and time distribution.

- `Observed`: the marketing exports are structurally intact.
  - Track 1 summary and derived summary both parse cleanly
  - expected keys for GA4, Search Console, PostHog, Meta, and Shopify are present

- `Observed`: the Xero filtered bank-transaction export is structurally intact.
  - `2,724` bank transactions
  - `28` pages fetched

## Result

- `Observed`: the supplementary passes do not break the earlier diagnosis.
- `Inferred`: the main conclusion still holds:
  - the business is not obviously dead from lack of demand or wildly uncompetitive public pricing
  - the stronger failure pattern is still margin leakage, conversion leakage, queue debt, rework, and weak operational/finance closure
- `Inferred`: the new supplementary work sharpens that diagnosis rather than replacing it:
  - shipping drag is real on remote work
  - supplier economics are under-instrumented
  - repeat demand exists but is not large enough to rescue weak acquisition/conversion
  - physical bench count is not yet evidenced as the primary bottleneck

## Remaining True Blockers

- no clean canonical customer ID across Monday, Intercom, Shopify, and Xero
- no resolved live supplier identity surface in the parts board
- no clean workstation allocation telemetry in Monday
- no authoritative shipping pass-through rule by job type
- some remaining external-owner threads:
  - Monday webhook transfer/cleanup

