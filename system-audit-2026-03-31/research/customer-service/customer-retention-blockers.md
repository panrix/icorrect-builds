# Customer Retention Blockers

Last updated: 2026-04-02

## Current Blockers

- `Observed`: Monday is now operator-confirmed as the canonical customer identity owner.
- `Observed`: the blocker is not ownership anymore; it is that Monday still does not provide a clean stable customer ID across the main repair history.
- `Observed`: the current repeat model had to use email, then phone, then item name fallback.
- `Observed`: the main-board field IDs for the strongest current identity fields are:
  - `Email` -> `text5`
  - `Phone Number` -> `text00`
- `Observed`: the main-board relation `Link - Client Information Capture` exists in schema, but its live `settings_str` has `boardIds: []`, so it is effectively unbound from a resolved client-capture board.
- `Observed`: the small Monday boards named `Contacts` and `Leads` do not currently solve this. They contain only `3` and `4` items respectively and the sampled rows are placeholder/demo-style data rather than live repair-customer history.
- `Unknown`: how much repeat demand is missed because:
  - the same customer uses different email addresses
  - phone numbers are missing or formatted inconsistently
  - walk-ins are not always captured with stable identity fields

## Best Next Evidence

- any current walk-in/intake rule that requires email or phone before repair creation
- any existing hidden field or not-yet-audited board that already stores a stable customer identifier
- any planned rebuild work that turns Monday into a clean identity hub
