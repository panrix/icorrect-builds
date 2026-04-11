# Monday Updates Track Blockers And Data Gaps

Last updated: 2026-04-01

This file exists so the coordinator and adjacent agents can answer Monday update-analysis blockers without searching the whole audit pack.

## Confirmed Limitations

- `Observed`: the update corpus is heavily skewed by automation/template notes:
  - `6,164` recent updates total
  - `3,924` automation/template
  - `2,240` human
- `Observed`: current item status is easy to map, but historical status-at-update-time is not cleanly available for every note without a second-pass activity-log join.
- `Observed`: free-text notes do not reliably encode resolution/completion timestamps for blocker categories, so category-specific delay duration is only partially traceable from updates alone.
- `Observed`: `updated_at` on items was mass-touched heavily enough in February 2026 that it is not a trustworthy proxy for “recent human work”.
- `Observed`: customer no-response and parts delay appear under-documented in free text relative to their importance elsewhere in the audit.

## Useful Follow-Up Questions

- Is there a known policy for when staff should write a Monday update versus just changing status or using Intercom?
- Are there any other Monday boards where customer-followup or parts-delay notes are more consistently recorded than on the main board?
- Is there a cleaner historical export for status-at-update-time if we want blocker-to-resolution timing by note category?
- Should `Systems Manager` template updates remain in the board, or be moved into a less noisy structured log surface?

## Best Next Evidence Sources

- Monday activity-log join by item and timestamp
- Intercom conversation notes for customer-response blockers
- parts board / stock workflow exports for supplier-delay truth
- technician/staff performance layer from Monday activity and timing columns
