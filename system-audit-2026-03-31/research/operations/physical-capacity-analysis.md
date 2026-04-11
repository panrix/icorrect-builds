# Physical Capacity And Bench Utilisation

Last updated: 2026-04-02

## Scope

This file covers supplementary research area `S4` from `RESEARCH-EXPANSION-BRIEF.md`.

Evidence base:
- `/home/ricky/kb/operations/queue-management.md`
- `/home/ricky/data/exports/system-audit-2026-03-31/monday/open-age-buckets-2026-04-01-summary.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/monday/open-age-buckets-2026-04-01-by-status.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/monday/main-board-schema.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/monday/source-surface-summary-2026-04-02.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/monday/tech-group-age-summary-2026-04-02.json`

## Short Answer

- `Observed`: the workshop is documented as having `8` workstations.
- `Observed`: operator confirmation says the main-board technician groups act as the workstation / repair-queue proxy.
- `Observed`: that proxy is still imperfect because being in a tech group means a device is in that tech's queue, not necessarily physically on their desk at that moment.
- `Observed`: the current open queue is dominated by waiting, booking, and stale customer-contact states, not clearly by too many active bench jobs.
- `Inferred`: physical bench count does not currently look like the main business bottleneck.
- `Inferred`: the stronger constraints are ownership, queue discipline, customer approval lag, parts delay, and exception handling.

## 1. Capacity Baseline

- `Observed`: `/home/ricky/kb/operations/queue-management.md` states there are `8 workstations` available.
- `Observed`: the same knowledge base explicitly says there is `no workstation allocation tracking`.

## 2. Monday Tracking Reality

- `Observed`: there is no dedicated workstation column in the live schema.
- `Observed`: instead, operator confirmation on `2026-04-02` says the technician groups themselves represent each tech's repair queue / workstation proxy.
- `Observed`: the live board group structure confirms the relevant groups exist:
  - `Safan (Short Deadline)`
  - `Safan (Long Deadline)`
  - `Mykhailo`
  - `Andres`
  - `Roni`
  - `Ferrari`
  - `Quality Control`
- `Observed`: current item counts in those groups from the board-wide export are:
  - `Safan (Short Deadline)`: `24`
  - `Safan (Long Deadline)`: `20`
  - `Mykhailo`: `6`
  - `Andres`: `6`
  - `Roni`: `5`
  - `Ferrari`: `8`
  - `Quality Control`: `1`
- `Observed`: service mix in those groups is still mostly Mail-In / Walk-In queue content rather than pure “physically on bench now” state.
- `Inferred`: Monday can support queue ownership by tech group, but not true real-time bench occupancy.

## 3. Tech-Group Ageing Reality

- `Observed`: the tech groups are not clean same-day bench views; they already contain long-lived paused and exception work.
- `Observed`: fresh `2026-04-02` tech-group ageing from the main-board pull shows:
  - `Safan (Short Deadline)`: median age `40` days, `16` items over `30` days, `5` over `90` days
  - `Safan (Long Deadline)`: median age `236` days, `17` over `30` days, `13` over `90` days
  - `Mykhailo`: median age `30` days
  - `Andres`: median age `24.5` days
  - `Ferrari`: median age `308` days on a small queue
- `Observed`: dominant statuses inside those groups are mostly not “actively repairing right now”:
  - `Repair Paused`
  - `Queued For Repair`
  - `BER/Parts`
  - `Awaiting Part`
  - `Client Contacted`
- `Inferred`: technician groups are better understood as owner queues with active and inactive debt mixed together, not literal workstation occupancy.

## 4. What The Open Queue Actually Looks Like

- `Observed`: the open queue contains `900` non-terminal items.
- `Observed`: the largest open statuses are mostly non-bench states:
  - `Booking Confirmed` `232`
  - `Awaiting Confirmation` `127`
  - `Client Contacted` `120`
- `Observed`: more bench-adjacent statuses are much smaller:
  - `Received` `44`
  - `Repair Paused` `39`
  - `Awaiting Part` `22`
  - `Queued For Repair` `12`
  - `Diagnostic Complete` `10`
  - `Repaired` `8`

## 5. Interpretation

- `Observed`: there is no evidence in Monday that all `8` benches are systematically saturated by a large actively-in-repair queue.
- `Observed`: the tech-group queues themselves are not huge in absolute item count compared with the long-tail debt groups elsewhere on the board, but some of them contain very old paused work.
- `Inferred`: the workshop feels overloaded because stale and blocked work is mixed into the same board as current work, not because Monday shows a giant clean in-progress bench queue.
- `Inferred`: if physical capacity were the main bottleneck, the strongest signal would be persistent high counts in clearly active repair states with good queue hygiene. That is not what the board currently shows.

## 6. Working Conclusion

- `Observed`: physical capacity matters, but it is not yet proven to be the limiting factor.
- `Observed`: the best current operational read is that technician groups are the queue/workstation proxy, not a literal “device is on this desk now” signal.
- `Inferred`: the business should treat workstation count as a secondary constraint behind:
  - queue debt
  - parts waits
  - customer-contact delays
  - rework/QC burden
  - fragmented ownership
