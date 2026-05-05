# Operations — Ownership Manifest

Generated: 2026-05-01
Source: folder-inventory.md (Phase 6.9b)

## Summary
- Folders owned: 17
- Active: 9  Dormant: 8  Dead: 0
- High-confidence: 6  Medium: 8  Low: 3

## Folders

| folder | state | canonical_status | size | rationale (1-line) |
| --- | --- | --- | --- | --- |
| claude-project-export | dormant | snapshot-of-other | 1.1M | Exported SOP/reference corpus already points current SOP homes back into operations, so Ricky's override is the best fit. |
| intake-notifications | dormant | draft | 112K | Replacing the Typeform-to-Slack intake notifier is shared intake infrastructure, not an Alex-only workflow. |
| intake-system | active | canonical | 3M | This is the primary rebuild of the workshop intake stack, so it belongs with operations. |
| llm-summary-endpoint | active | canonical | 12M | Live Monday repair-update summarization service is operational intake infrastructure, even though the runtime packaging is thin. |
| monday | active | canonical | 11M | Primary Monday board rebuild, automation, and integration workspace is core operations infrastructure. |
| operations-system | active | draft | 73M | Working rebuild of iCorrect's operating system is explicitly operations-owned design space. |
| pricing-sync | dormant | draft | 5.3M | Cross-system pricing governance is anchored on Monday and workflow control, which fits operations best. |
| repair-analysis | archived | scratch | 41K | Archived to `~/fleet/archive/repair-analysis-2026-05` on 2026-05-05 because the hardcoded one-off scripts are superseded by the `system-audit-2026-03-31` repair profitability pack. |
| royal-mail-automation | active | canonical | 227K | Shared dispatch and label-buying automation is a core fulfillment rail across workshop flows. |
| scripts | dormant | scratch | 52K | Mixed utility folder was overridden to operations because its strongest live breadcrumb is Monday/ops analysis tooling. |
| system-audit-2026-03-31 | dormant | snapshot-of-other | 6.8M | Frozen audit pack is cross-domain, but Ricky explicitly overrode it to operations and the evidence base is ops-heavy. |
| telephone-inbound | active | canonical | 76K | Live phone-intake server posts to Slack and can create Monday/Intercom records, so it belongs with operations. |
| voice-note-pipeline | active | canonical | 22M | Live intake-thread transcription feeds Monday workflows and sits directly inside day-to-day operations. |
| webhook-migration | dormant | canonical | 400K | Monday status-notification slice is shipped, while the Shopify/Intercom attribution slice remains unbuilt, so `operations` still owns the parked mixed-domain folder. |
| whisper-api | dormant | scratch | 8.0K | Small transcription helper sits closest to operational intake/audio tooling, though ownership is weak. |
| xero-invoice-automation | active | draft | 520K | Monday-to-Xero invoicing workflow is an operations and finance execution tool rather than a strategy doc. |
| xero-invoice-notifications | active | draft | 52K | Paid-invoice polling back into Monday and Slack is an operational finance automation. |

## Notes
- Low and medium confidence folders worth re-checking: `claude-project-export`, `intake-notifications`, `llm-summary-endpoint`, `scripts`, `system-audit-2026-03-31`, `telephone-inbound`, `webhook-migration`, `whisper-api`, `xero-invoice-automation`, and `xero-invoice-notifications`.
- `repair-analysis` has been archived; future repair profitability work should start from the newer `system-audit-2026-03-31` v2 pack rather than the archived scratch scripts.
- `voice-note-pipeline` contains plaintext transcript snippets and customer details in logs; treat it as live PII-bearing data.
- `llm-summary-endpoint` was scanned with open `*` CORS and conditional auth only, so ownership may stay `operations` while security posture still needs review.
- `webhook-migration` now explicitly records the shipped Monday-status slice versus the still-unbuilt Shopify/Intercom slice; keep that nuance visible during Ricky review.
- `royal-mail-automation` and `pricing-sync` both have credible second claims from `backmarket`; if Phase 7 splits shared rails, those are likely transfer candidates.
