# Customer Identity Normalisation

Last updated: 2026-04-02

## Purpose

This file converts the resolved identity ownership question into a concrete research-backed target state.

## Current Truth

- `Observed`: Monday is the operator-confirmed canonical customer identity owner.
- `Observed`: the live main board still does not expose a stable reusable customer ID.
- `Observed`: repeat-customer analysis currently relies on `Email` (`text5`), then `Phone Number` (`text00`), then item-name fallback.
- `Observed`: the legacy client-capture relation is dead and the tiny `Contacts` / `Leads` boards are dead.

Primary evidence:
- `/home/ricky/builds/system-audit-2026-03-31/customer-retention-analysis.md`
- `/home/ricky/builds/system-audit-2026-03-31/customer-retention-blockers.md`
- `/home/ricky/builds/system-audit-2026-03-31/MASTER-QUESTIONS-FOR-JARVIS.md`

## Current Failure Mode

- `Observed`: the same real customer can still fragment across:
  - multiple email addresses
  - inconsistent phone formatting
  - walk-in items with weak contact capture
  - Shopify / Intercom / Xero duplicates
- `Inferred`: Monday owns identity conceptually, but not operationally enough to support robust retention, LTV, or cross-system reconciliation.

## Minimum Target-State Design

### Canonical Key

Create one stable `Customer ID` on Monday and reuse it everywhere downstream.

Minimum generation rule:
- if normalized email exists, use that as primary match key
- else if normalized phone exists, use that
- else create a temporary manual key and flag for cleanup

### Required Main-Board Fields

- `Customer ID` (new stable text key)
- `Email` (`text5`)
- `Phone Number` (`text00`)
- `Intercom ID` (`text_mm087h9p`) when linked
- optional future link fields for Shopify customer ID and Xero contact ID

### Capture Rules

- do not create a normal repair item without:
  - name
  - and at least one of email or phone
- normalize email to lowercase + trimmed
- normalize phone into one consistent UK format before write-back
- if both email and phone are missing, mark the item as identity-incomplete

## Practical Interim Use

Until a proper rebuild happens:
- Monday remains the identity owner
- email/phone heuristics remain necessary
- identity quality should be reported as a data-quality KPI, not assumed

## Main Conclusion

- `Observed`: the identity owner question is resolved.
- `Observed`: the implementation gap is now the real blocker.
- `Inferred`: a stable `Customer ID` on Monday is the smallest high-leverage rebuild that would improve retention analysis, channel attribution, and cross-system finance/comms joins.
