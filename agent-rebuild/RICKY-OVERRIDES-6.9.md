# Ricky's overrides on Phase 6.9 first-pass tagging

Captured: 2026-05-01 from voice note after reviewing ownership-orphans-and-conflicts.md.

These are authoritative — the consolidator's first-pass tags are superseded where they conflict with this list. The QA spawn (6.9d) should validate these against scan content and surface any cases where the override looks wrong, but otherwise treat Ricky's call as final.

## Ferrari (resolved)
- Ferrari is a new bot created 2026-04-30 — testing one-bot-per-employee. Empty manifest is correct.
- Do **not** fold into alex-cs yet. Keep distinct during the trial.

## Ownership re-tags (override the first-pass)

| folder | first-pass owner | Ricky's call | rationale |
|---|---|---|---|
| claude-project-export | main (medium) | **operations** | This was an export of SOPs; SOPs-based data → ops. |
| intake-notifications | alex-cs (medium) | **operations** | Intake infra. |
| quote-wizard | alex-cs (medium) | **arlo-website** | "Website repair" — Shopify navigation/UX. |
| repair-analysis | operations (medium) | **operations** | Confirmed. |
| scripts | none (low) | **operations** | Mostly Monday + analysis tooling. |
| system-audit-2026-03-31 | main (medium) | **operations** | Ops audit. NOTE: needs to be broken down in Phase 7 — Ricky can't do that part alone. |
| telephone-inbound | alex-cs (medium) | **operations** | Intake infra, not CS triage. |
| webhook-migration | operations (low) | **operations** | Confirmed; likely already shipped/completed — see state override. |
| whisper-api | operations (low) | **operations** | Confirmed. |
| xero-invoice-automation | operations (medium) | **operations** | Confirmed. |
| xero-invoice-notifications | operations (medium) | **operations** | Confirmed. |

## State overrides

| folder | first-pass state | Ricky's call | rationale |
|---|---|---|---|
| voice-notes | dormant | **dead** | "Probably dead now." |
| webhook-migration | dormant | **shipped/dormant** | "Probably all completed now." Treat as shipped — keep dormant tag but flag as completed-not-dead. |

## Unresolved

- **llm-summary-endpoint** — Ricky doesn't know what it is. QA spawn should investigate the folder content and propose ownership/state with evidence.
- **bm-scripts** — Ricky didn't explicitly rule on it (low-confidence, currently backmarket). Leave as backmarket pending QA confirmation.
- **data** — Ricky didn't explicitly rule on it (currently backmarket). Leave as is pending QA confirmation.

## Phase 7 implications (out of scope for 6.9 — capture only)

- system-audit-2026-03-31 needs to be broken down by domain. Ricky flagged he can't do this alone.
