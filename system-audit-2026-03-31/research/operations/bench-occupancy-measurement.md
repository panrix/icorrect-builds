# Bench Occupancy Measurement

Last updated: 2026-04-02

## Purpose

This file answers the remaining capacity question after operator confirmation that technician groups are the workstation proxy.

## What Is Proven

- `Observed`: technician groups on the main board are the best current workstation/queue proxy.
- `Observed`: they do not prove literal bench occupancy at a point in time.
- `Observed`: fresh `2026-04-02` queue-age analysis shows those groups already contain paused and aged items.

Key evidence:
- `/home/ricky/builds/system-audit-2026-03-31/physical-capacity-analysis.md`
- `/home/ricky/data/exports/system-audit-2026-03-31/monday/tech-group-age-summary-2026-04-02.json`

## Current Queue Read

- `Observed`: `Safan (Short Deadline)` looks like a real active queue, but still carries aged debt.
- `Observed`: `Safan (Long Deadline)` is clearly not a live bench view; median age is `236` days.
- `Observed`: `Ferrari` and `Roni` groups also contain exception-style statuses rather than clean bench occupancy.

## What Should Count As “Bench Occupied”

For measurement purposes, actual bench occupancy should mean:
- device assigned to a tech queue
- AND in an active workshop state
- AND not in customer-wait / parts-wait / courier / booking / stale exception states

Recommended active-state set:
- `Received`
- `Diagnostics`
- `Queued For Repair`
- `Under Repair`
- `Reassemble`
- `Software Install`
- `Battery Testing`
- `Part Repaired`

Recommended excluded-state set:
- `Repair Paused`
- `Awaiting Part`
- `Client Contacted`
- `Awaiting Confirmation`
- `Booking Confirmed`
- `Quote Sent`
- courier/return/shipping states

## Current Limitation

- `Observed`: Monday does not currently capture a dedicated “on bench now” event or field.
- `Inferred`: without that, the business can measure queue ownership, but not true workstation utilisation.

## Minimum Target-State Measurement

The lowest-friction rebuild would be:
- keep technician group as queue owner
- add one explicit structured field for `Bench State`
- use values like:
  - `Not On Bench`
  - `On Bench`
  - `QC`
  - `Waiting Parts`
  - `Waiting Customer`

## Main Conclusion

- `Observed`: the current board can support queue ownership analysis.
- `Observed`: it cannot support true occupancy/utilisation analysis yet.
- `Inferred`: any claim that all benches are full from Monday alone would currently be overstated.
