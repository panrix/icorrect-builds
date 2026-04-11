# Physical Capacity Blockers

Last updated: 2026-04-02

## Current Blockers

- `Observed`: operator confirmation now says workstation allocation is proxied by technician groups on the main board, not by a dedicated column.
- `Observed`: this still does not provide true bench-occupancy telemetry, because a device in a tech group is not guaranteed to be physically on that desk at that moment.
- `Observed`: there is no clean bench-occupancy log in the current audit evidence.
- `Observed`: fresh `2026-04-02` queue-age analysis confirms the tech groups mix active work with long-lived paused/exception debt, especially `Safan (Long Deadline)`.
- `Unknown`: peak concurrent active repairs per day by actual workstation.

## Best Next Evidence

- any daily routine that marks “device physically on bench now”
- any hidden worksheet, paper list, or wallboard that distinguishes live bench occupancy from queue ownership
- any planned field rebuild that introduces explicit `Bench State` or equivalent
