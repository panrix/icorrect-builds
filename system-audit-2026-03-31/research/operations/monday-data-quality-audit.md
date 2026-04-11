# Monday Data Quality Audit

Date: 2026-04-02
Board: iCorrect Main Board (`349212843`)
API method: direct read-only Monday GraphQL calls via `curl` to `https://api.monday.com/v2`

## Executive Summary

- Live pull on `2026-04-02` fetched `4,465` total items across `9` paginated API requests. The prior queue snapshot on `2026-04-01` showed `900` non-terminal items; using the same terminal-status definition (`Returned`, `Shipped`, `Ready To Collect`), the live queue now shows `907`.
- Only `160 / 907` non-terminal items (`17.6%`) show a credible touch in the last `30` days. If recent `Cancelled/Declined` rows are stripped out as non-actionable, true live WIP is closer to `152 / 907` (`16.8%`).
- `535 / 907` (`59.0%`) look like zombie queue debt with no credible touch for `90+` days.
- `212 / 907` (`23.4%`) need human review rather than blind automation: `112` are stale (`30-90` days untouched) and `100` are ambiguous because the data conflicts with itself.
- The biggest dead-weight clusters are still `Booking Confirmed` (`217` items aged `6+` months), `Awaiting Confirmation` (`108` aged `6+` months), and `Client Contacted` (`87` aged `6+` months).
- Critical data quality is materially weak inside the non-terminal queue: `318` items are missing at least one critical field, `140` are missing two or more, `159` have no linked device, and `267` have no usable operational status date.

## Definitions

- `Non-terminal` in this report means current status is not `Returned`, `Shipped`, or `Ready To Collect`, so the count stays comparable with the `2026-04-01` queue snapshot.
- `Operational touch` = latest of item `created_at`, latest item update timestamp, and structured lifecycle dates (`Received`, `Booking Time`, intake timestamp, `Diag. Complete`, `Quote Sent`, `Date Repaired`, `Collection Date`, `QC Time`, BM listed/sold/purchased dates).
- `Active WIP` = operational touch in last `30` days.
- `Stale` = operational touch `31-90` days ago.
- `Zombie` = operational touch `90+` days ago.
- `Ambiguous` = recent `updated_at` signal without credible operational movement, or downstream repaired/collection dates populated while the item is still in a non-terminal status.
- `No customer name` uses a conservative heuristic: blank item name, Shopify-style `#1234` names, or BM-style `BM 1234` names without a human name/company attached.
- `No status date` means no usable operational lifecycle date is populated; `created_at` alone does not count as a status date.

## Headline Numbers

| Metric | Count | % of non-terminal |
|---|---:|---:|
| Non-terminal items | 907 | 100.0% |
| Active WIP | 160 | 17.6% |
| Stale | 112 | 12.3% |
| Zombie | 535 | 59.0% |
| Ambiguous | 100 | 11.0% |
| Genuinely actionable WIP (active minus recent `Cancelled/Declined`) | 152 | 16.8% |
| Human-review bucket (`stale + ambiguous`) | 212 | 23.4% |
| Dead-weight bucket (`zombie`) | 535 | 59.0% |
| Blocked/customer-wait states | 318 | 35.1% |
| Post-diagnostic with no quote date | 75 | 8.3% |
| Closed-looking rows still open | 64 | 7.1% |

## By Status Label

| Status | Total | Active | Stale | Zombie | Ambiguous | 6m+ | Median Age (days) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Booking Confirmed | 233 | 8 | 7 | 217 | 1 | 217 | 834 |
| Awaiting Confirmation | 123 | 4 | 6 | 111 | 2 | 108 | 818 |
| Client Contacted | 121 | 5 | 4 | 111 | 1 | 87 | 316 |
| New Repair | 71 | 30 | 16 | 22 | 3 | 24 | 42 |
| BER/Parts | 56 | 1 | 13 | 15 | 27 | 33 | 207.5 |
| Cancelled/Declined | 53 | 8 | 32 | 13 | 0 | 13 | 68 |
| Received | 41 | 35 | 2 | 1 | 3 | 1 | 13 |
| Repair Paused | 39 | 8 | 11 | 1 | 19 | 9 | 63 |
| Quote Sent | 28 | 9 | 0 | 19 | 0 | 14 | 178.0 |
| Awaiting Part | 22 | 6 | 10 | 1 | 5 | 1 | 52.5 |
| Return Booked | 18 | 2 | 0 | 2 | 14 | 6 | 120.0 |
| Expecting Device | 16 | 11 | 4 | 1 | 0 | 1 | 13.5 |
| Queued For Repair | 16 | 7 | 3 | 2 | 4 | 5 | 41.0 |
| Courier Booked | 14 | 4 | 0 | 9 | 1 | 5 | 130.5 |
| Client To Contact | 12 | 8 | 0 | 3 | 1 | 3 | 12.0 |
| Purchased | 6 | 0 | 1 | 2 | 3 | 4 | 394.5 |
| Repaired | 6 | 0 | 0 | 0 | 6 | 2 | 0.0 |
| Diagnostic Complete | 5 | 5 | 0 | 0 | 0 | 0 | 2 |
| Error | 5 | 0 | 1 | 3 | 1 | 3 | 561 |
| Software Install | 5 | 1 | 1 | 1 | 2 | 2 | 36 |
| Book Return Courier | 4 | 1 | 0 | 0 | 3 | 0 | 1.0 |
| Reassemble | 4 | 3 | 0 | 1 | 0 | 1 | 17.0 |
| Invoiced | 3 | 1 | 1 | 0 | 1 | 0 | 63 |
| Battery Testing | 2 | 1 | 0 | 0 | 1 | 0 | 31.5 |
| Part Repaired | 1 | 1 | 0 | 0 | 0 | 0 | 25 |
| Password Req | 1 | 0 | 0 | 0 | 1 | 1 | 392 |
| QC Failure | 1 | 0 | 0 | 0 | 1 | 0 | 0 |
| Under Refurb | 1 | 1 | 0 | 0 | 0 | 0 | 1 |

## By Board Group

| Group | Total | Active | Stale | Zombie | Ambiguous |
|---|---:|---:|---:|---:|---:|
| Leads to Chase | 357 | 0 | 0 | 357 | 0 |
| Devices In Hole | 89 | 0 | 0 | 88 | 1 |
| Cancelled/Missed Bookings | 84 | 27 | 56 | 0 | 1 |
| Client Services - Awaiting Confirmation | 64 | 13 | 3 | 47 | 1 |
| BER Devices | 49 | 2 | 8 | 15 | 24 |
| Returned | 36 | 1 | 1 | 12 | 22 |
| Safan (Short Deadline) | 31 | 15 | 7 | 1 | 8 |
| BM Inbound | 29 | 25 | 4 | 0 | 0 |
| Awaiting Parts | 27 | 9 | 11 | 1 | 6 |
| Safan (Long Deadline) | 20 | 0 | 4 | 0 | 16 |
| Incoming Future | 17 | 14 | 3 | 0 | 0 |
| Client Services - To Do | 14 | 10 | 1 | 1 | 2 |
| Today's Repairs | 14 | 14 | 0 | 0 | 0 |
| Outbound Shipping | 13 | 5 | 0 | 0 | 8 |
| New Orders | 10 | 5 | 4 | 1 | 0 |
| Trade-In BMs Awaiting Validation | 9 | 6 | 3 | 0 | 0 |
| Ferrari | 8 | 0 | 0 | 6 | 2 |
| Andres | 6 | 6 | 0 | 0 | 0 |
| Mykhailo | 5 | 3 | 1 | 0 | 1 |
| Roni | 5 | 0 | 4 | 1 | 0 |
| Awaiting Collection | 4 | 1 | 0 | 0 | 3 |
| Locked | 4 | 0 | 0 | 3 | 1 |
| Quality Control | 4 | 0 | 0 | 0 | 4 |
| Awaiting Confirmation of Price | 3 | 3 | 0 | 0 | 0 |
| Purchased/Refurb Devices | 3 | 1 | 0 | 2 | 0 |
| Recycle List | 2 | 0 | 2 | 0 | 0 |

## Top Stale Status Clusters

| Status | 6+ Months Old | Total | % of Status | Median Age (days) |
|---|---:|---:|---:|---:|
| Booking Confirmed | 217 | 233 | 93.1% | 834 |
| Awaiting Confirmation | 108 | 123 | 87.8% | 818 |
| Client Contacted | 87 | 121 | 71.9% | 316 |
| BER/Parts | 33 | 56 | 58.9% | 207.5 |
| New Repair | 24 | 71 | 33.8% | 42 |
| Quote Sent | 14 | 28 | 50.0% | 178.0 |
| Cancelled/Declined | 13 | 53 | 24.5% | 68 |
| Repair Paused | 9 | 39 | 23.1% | 63 |
| Return Booked | 6 | 18 | 33.3% | 120.0 |
| Courier Booked | 5 | 14 | 35.7% | 130.5 |
| Queued For Repair | 5 | 16 | 31.2% | 41.0 |
| Purchased | 4 | 6 | 66.7% | 394.5 |
| Error | 3 | 5 | 60.0% | 561 |
| Client To Contact | 3 | 12 | 25.0% | 12.0 |
| Software Install | 2 | 5 | 40.0% | 36 |

Key readout:
- `Booking Confirmed` is still the single biggest stale cluster: `217` items are `6+` months old and `215` are `1+` year old.
- `Awaiting Confirmation` is next: `108` items are `6+` months old and `104` are `1+` year old.
- `Client Contacted` remains heavily polluted: `87` items are `6+` months old even though the status sounds live.
- `BER/Parts` is not a clean active exception queue: `33 / 56` items are `6+` months old and `27` are ambiguous because the row history conflicts with the current status.

## Missing Critical Fields

| Critical-field check | Count | % of non-terminal |
|---|---:|---:|
| No customer name | 33 | 3.6% |
| No linked device | 159 | 17.5% |
| No status date | 267 | 29.4% |
| Missing any critical field | 318 | 35.1% |
| Missing two or more critical fields | 140 | 15.4% |

Largest critical-field problem statuses:
- `Awaiting Confirmation`: `74 / 123` missing at least one critical field
- `New Repair`: `66 / 71` missing at least one critical field
- `Client Contacted`: `40 / 121` missing at least one critical field
- `Cancelled/Declined`: `33 / 53` missing at least one critical field
- `Booking Confirmed`: `26 / 233` missing at least one critical field
- `BER/Parts`: `22 / 56` missing at least one critical field
- `Repair Paused`: `13 / 39` missing at least one critical field
- `Expecting Device`: `13 / 16` missing at least one critical field
- `Return Booked`: `5 / 18` missing at least one critical field
- `Courier Booked`: `5 / 14` missing at least one critical field

Observed pattern: the oldest `Leads to Chase` and intake-stage records are commonly missing both device linkage and a usable status date, which makes them poor automation inputs and strong cleanup candidates.

## Recommendations

### 1. Cleanup Candidates: archive/close first

- Archive or formally close the `357` zombie items in `Leads to Chase` immediately. That group is `100%` zombie in the live pull.
- Clean out `Devices In Hole` next: `88 / 89` are zombie, so it is acting as historical storage rather than live WIP.
- Bulk-review and close the oldest intake/comms debt clusters: `217` old `Booking Confirmed`, `108` old `Awaiting Confirmation`, and `87` old `Client Contacted` items that are already `6+` months old.
- Treat `Cancelled/Declined` as a cleanup queue, not live WIP. The board still carries `53` such rows in the non-terminal surface, including `13` that are `6+` months old.

### 2. Human Review: fix contradictory rows before automating

- Review the `100` ambiguous rows before building automation on top. `64` already have repaired/collection-style dates populated but are still non-terminal, and `42` show a recent `updated_at` despite no credible operational movement in `90+` days.
- Prioritise the `75` post-diagnostic/no-quote exceptions. These are the clearest cases where the process is stuck after real technical work happened.
- Review the `318` blocked/customer-wait rows as an owner-assignment problem, not a pure queue-size problem.
- Triage the `140` rows missing two or more critical fields, because they are the highest-risk rows for false automation decisions.

### 3. Genuinely Active: protect the real live queue

- The cleanest live work is concentrated in `Received` (`35` active of `41`), `BM Inbound` (`25` active of `29`), `Incoming Future` (`14` active of `17`), and `Today's Repairs` (`14` active of `14`).
- Recent active work also exists in `New Repair` (`30` active of `71`), but that status is polluted by `22` zombies and `24` items already `6+` months old, so it should be split from stale debt before being used as an automation trigger.
- `Quote Sent` has only `9` genuinely recent rows against `19` zombies, so quote-chase automation should run on a filtered recent subset, not the raw status.

## Bottom Line

- As of `2026-04-02`, the Monday main board is not a clean live queue. Out of `907` non-terminal rows, only about `152-160` look like real current WIP, while `535` look like dead weight and another `212` need review before they can be trusted.
- The board can support automation only after the stale debt is separated from the live queue. The first automation-safe target is the recent active subset, not the raw non-terminal board surface.
