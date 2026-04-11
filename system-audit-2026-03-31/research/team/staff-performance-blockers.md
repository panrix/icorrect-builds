# Staff Performance Track Blockers And Data Gaps

Last updated: 2026-04-01

This file exists so the coordinator and adjacent agents can answer staff-performance blockers without searching the whole audit pack.

## Confirmed Limitations

- `Observed`: Michael Ferrari’s activity-log pull hits exactly `10,000` entries, which strongly suggests the accessible Monday surface is capped for him in this window.
- `Observed`: device family is not resolving from the current `Device` board-relation text surface, so per-tech output by iPhone/MacBook/iPad is still blocked on another field or relation lookup path.
- `Observed`: the clean visible revenue surface is partial:
  - `formula74` quote field is empty on the fetched item slice
  - `dup__of_quote_total` (`Paid`) is usable but only populated on a subset of completed items
- `Observed`: QC-failure and repeat-completion rates are proxies built from activity logs and repeated completion events, not a full causal attribution model.

## Useful Follow-Up Questions

- Is there another Monday or linked-board field that exposes device family/model in plain text for performance reporting?
- Is Ferrari’s `10,000` activity-log cap acceptable for analysis, or is there another export path for his full event history?
- Which field should be treated as canonical job value for technician attribution:
  - `dup__of_quote_total`
  - Xero invoice amount
  - another Monday quote/invoice field
- Is there a cleaner QC pass/fail source than status changes alone?

## Best Next Evidence Sources

- linked device board relation lookup
- Xero invoice back-reference by Monday item
- BM return/refund attribution by linked completer
- activity-log export path without the visible cap
