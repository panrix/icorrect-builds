# Alex-CS — Ownership Manifest

Generated: 2026-05-01
Source: folder-inventory.md (Phase 6.9b)

## Summary
- Folders owned: 5
- Active: 3  Dormant: 1  Archived: 1  Dead: 0
- High-confidence: 5  Medium: 0  Low: 0

## Folders

| folder | state | canonical_status | size | rationale (1-line) |
| --- | --- | --- | --- | --- |
| alex-triage-classifier-rebuild | dormant | draft | 16K | Spec-only refactor brief for Alex's Intercom triage classifier is squarely customer-service tooling. |
| alex-triage-rebuild | active | canonical | 20M | Live Intercom triage and reply-drafting workflow is the clearest `alex-cs` runtime in the inventory. |
| customer-service | active | snapshot-of-other | 60M | Read-only Intercom and Monday audit outputs belong closest to the customer-service lane that consumes them. |
| intercom-agent | archived | draft | 12K | Archived to `~/customer-service/alex-triage/archive/intercom-agent-spec` on 2026-05-05; useful ideas should be mined into Alex triage, not revived as a separate live build surface. |
| intercom-config | active | draft | 68K | Inbox-view strategy and private API research directly support Alex's operational ownership of Intercom. |

## Notes
- `customer-service` carries live or archived PII, including customer conversations, case details, and Ferrari-ready queue context.
- `intercom-agent` is now archive-only; live Alex runtime remains `alex-triage-rebuild` until a dedicated service-path migration handles cron/systemd together.
- Ferrari work is embedded here rather than split out: `customer-service` explicitly references Ferrari-ready queues and Ferrari sign-off patterns.
- Ricky's overrides cleared the previous borderline CS assignments, so the remaining five folders are all high-confidence `alex-cs` ownership.
