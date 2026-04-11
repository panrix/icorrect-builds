# Timing Mapping

Last updated: 2026-04-02

## Purpose

This file separates three different timing layers that were previously mixed together:

- customer-facing promised turnaround
- measured operational duration inside Monday
- customer-response / communication latency

## 1. Customer-Facing Promised Turnaround

Primary source: [`01-turnaround-times.md`](/home/ricky/.openclaw/agents/customer-service/workspace/docs/knowledge-base/01-turnaround-times.md)

### Observed Published / Internal Guidance

- MacBook screen, Apple Silicon:
  - Standard: `2-3 working days`
  - Fast: `24 hours` with `+£79`
  - Fastest: `4 hours` with `+£149`
- MacBook screen, Intel:
  - Standard: `2-3 working days`
- Other MacBook repairs:
  - Standard: `2-3 working days`
- MacBook diagnostic:
  - Standard: `2-3 working days`
  - Express: `24 hours` with `+£79`
- iPhone repairs:
  - Standard: `2-4 hours`
- iPhone diagnostic:
  - Standard: `1-2 working days`
- iPad repairs and diagnostic:
  - Standard: `2-3 working days`
- Apple Watch repairs and diagnostic:
  - Standard: `2-3 working days`

### Known Gaps In The Promise Layer

- `Observed`: the turnaround KB is still draft and marked as needing Ferrari review.
- `Observed`: the KB explicitly leaves open whether iPhone timings are guaranteed or estimated.
- `Observed`: the KB also leaves open the exact cut-off rules for the `4 hour` fastest path.

## 2. Operational Timing Fields In Monday

Primary sources:
- [`main-board-column-audit.md`](/home/ricky/builds/monday/main-board-column-audit.md)
- [`board-schema.md`](/home/ricky/builds/monday/board-schema.md)
- [`QUERY-SPEC.md`](/home/ricky/builds/monday/QUERY-SPEC.md)

### Observed Monday Timing Columns

- `Total Time`
  - starts at `Received`
  - stops at `Ready To Collect` or `Returned`
- `Diagnostic Time`
  - starts at `Diagnostics`
  - stops when status leaves diagnostics
- `Repair Time`
  - starts at `Under Repair`
  - stops when status changes away
- `Refurb Time`
  - starts at `Under Refurb`
  - stops when status changes away
- `Cleaning Time`
  - tracks cleaning phase
- `Diag. Complete` date
- `Quote Sent` date
- `Date Repaired`
- `Collection Date`
- `QC Time`
- `Received` / intake timestamps

### What Monday Can Already Measure

- diagnostic phase duration
- repair phase duration
- refurb phase duration
- full lifecycle from receipt to ready/return
- per-status dwell time if activity logs are replayed
- technician attribution for diagnostic, repair, refurb, and QC roles

## 3. Real Status Paths That Affect Timing

Primary source: [`repair-flow-traces.md`](/home/ricky/builds/monday/repair-flow-traces.md)

### Observed Reality

- Walk-in and mail-in items often do not follow a straight path.
- Repeated pause loops are common:
  - `Repair Paused`
  - `Client To Contact`
  - `Client Contacted`
  - repeated `Diagnostics`
  - repeated `Under Repair` / `Under Refurb`
- `Diagnostics` appears both pre-repair and post-repair in many traces.
- This means raw total duration and pure hands-on time are not the same metric.

### Operational Consequence

- `Observed`: promised turnaround cannot be compared directly to total elapsed board time without excluding pauses, approvals, customer-wait states, and courier lag.
- `Inferred`: the timing layer needs at least two measures:
  - elapsed customer lifecycle time
  - active workshop processing time

## 4. Customer Response Timing

Primary sources:
- [`roster.md`](/home/ricky/kb/team/roster.md)
- team audits in `/home/ricky/builds/team-audits/reports/`
- customer-service triage mapping corpus
- live Intercom API sample pull on `2026-04-01`

### Observed Current Signals

- Ferrari roster notes:
  - average response time `45.3h`
  - reply rate `30%`
- Ferrari audit describes major missed-revenue leakage from unanswered communications.
- customer-service data includes response-latency-style fields in the triage mapping corpus.
- February 2026 Intercom audit reports:
  - average reply time `36.4h`
  - median reply time `22.4h`
  - reply rate `29%` across addressable conversations
- `Observed`: a current live Intercom sample on `2026-04-01` pulled the most recent `150` conversations, filtered out obvious internal/system noise, and produced:
  - `60` filtered recent conversations
  - `33` with a recorded admin reply
  - `27` with no recorded admin reply in the sample
  - median admin reply time `9.58h`
  - mean admin reply time `26.42h`
  - `p75` `31.88h`
  - `p90` `93.81h`

### Current Gap

- `Observed`: customer response timing exists in multiple places, but there is not yet one canonical response-time table in the main system audit.
- `Inferred`: the canonical metric likely needs channel split:
  - Intercom human reply time
  - AI first-response time
  - form/email ingestion latency
  - quote response time
  - phone/direct-to-Monday demand that never passes through the web funnel

### Interpretation

- `Observed`: current sampled reply timing appears improved versus the February full-month audit, but remains slow and inconsistent.
- `Observed`: the recent filtered sample still has `45%` unanswered conversations (`27` of `60`).
- `Inferred`: the response problem is not solved; it may be improving, but the business is still losing too many hours before human engagement and still leaving too many conversations untouched.

### Current-Month March Window Check

- `Observed`: a second live read-only Intercom pull on `2026-04-01`, scoped to conversations created since `2026-03-01`, scanned `150` recent conversations and kept `58` customer-facing conversations after filtering noise.
- `Observed`: that March-window sample produced:
  - `31` replied
  - `27` unanswered
  - median reply time `6.39h`
  - mean reply time `24.47h`
  - `p75` `26.44h`
  - `p90` `45.42h`
- `Observed`: by channel in that same sample:
  - `email`: `44` conversations, `17` unanswered, median `6.39h`
  - `instagram`: `9` conversations, `5` unanswered, median `17.97h`
  - `whatsapp`: `5` conversations, `5` unanswered
- `Inferred`: current human response performance is better than the February full-month benchmark, but the improvement is uneven and still leaves too many conversations untouched, especially on non-email channels.

## 4A. Quote-To-Payment Proxy Check

- `Observed`: a fresh full-board Monday pull on `2026-04-02` extracted `Quote Sent`, payment-date, payment-method, payment-status, invoice-status, and Xero-invoice fields for all `4,459` items.
- `Observed`: this surface is too dirty to use as a clean quote-to-payment truth table:
  - `132` items have `Quote Sent` since `2025-12-01`
  - `0` of those have a populated `Xero Invoice ID`
  - all `132` currently show `Invoice Status = Voided`
  - only `35` have any `Payment 1 Date`
  - only `15` have a non-negative `Quote Sent -> Payment 1 Date` lag
- `Observed`: on the usable subset, `Quote Sent -> Payment 1 Date` is:
  - sample size `15`
  - median `2` days
  - `p75` `7` days
- `Observed`: many rows are internally inconsistent, with payment dates preceding `Quote Sent`.
- `Inferred`: Monday’s current payment/invoice date fields are not reliable enough to support robust quote-approval/payment timing analysis on their own.

Primary evidence:
- `/home/ricky/data/exports/system-audit-2026-03-31/monday/quote-payment-proxy-surface-2026-04-02.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/monday/quote-payment-proxy-summary-2026-04-02.json`

## 5. Initial Monday Timing Metrics

These are direct read-only metrics pulled from Monday main board item fields on `2026-04-01`, using the last `120` days of items with valid date fields.

### Path-Level Elapsed Timing

- `Walk-In + Diagnostic`
  - `Received -> Diagnostic Complete`
    - sample size: `59`
    - median: `1 day`
  - `Received -> Date Repaired`
    - sample size: `54`
    - median: `7 days`

- `Walk-In + Repair`
  - `Received -> Diagnostic Complete`
    - sample size: `11`
    - median: `1 day`
  - `Received -> Date Repaired`
    - sample size: `139`
    - median: `1 day`

- `Mail-In + Diagnostic`
  - `Received -> Diagnostic Complete`
    - sample size: `13`
    - median: `4 days`
  - `Received -> Date Repaired`
    - sample size: `9`
    - median: `8 days`

- `Mail-In + Repair`
  - `Received -> Date Repaired`
    - sample size: `31`
    - median: `4 days`

- `Corporate + Diagnostic`
  - `Received -> Diagnostic Complete`
    - sample size: `13`
    - median: `1 day`
  - `Received -> Date Repaired`
    - sample size: `19`
    - median: `7 days`

- `Corporate + Repair`
  - `Received -> Date Repaired`
    - sample size: `31`
    - median: `0 days`

### Technician Splits

- `Safan Patel`
  - `Walk-In + Diagnostic`
    - `Received -> Diagnostic Complete`: median `1 day` across `54`
    - `Received -> Date Repaired`: median `8 days` across `47`
  - `Walk-In + Repair`
    - `Received -> Date Repaired`: median `0 days` across `59`
  - `Mail-In + Diagnostic`
    - `Received -> Diagnostic Complete`: median `3 days` across `11`
    - `Received -> Date Repaired`: median `7 days` across `7`
  - `Mail-In + Repair`
    - `Received -> Date Repaired`: median `4.5 days` across `6`

- `Misha Kepeshchuk`
  - `Walk-In + Repair`
    - `Received -> Date Repaired`: median `1 day` across `53`
  - `Walk-In + Diagnostic`
    - `Received -> Date Repaired`: median `3 days` across `5`
  - `Mail-In + Repair`
    - `Received -> Date Repaired`: median `3 days` across `21`

- `Andres Egas`
  - `Walk-In + Repair`
    - `Received -> Date Repaired`: median `1 day` across `26`
  - `Corporate + Repair`
    - `Received -> Date Repaired`: median `2.5 days` across `6`

### Caveats

- `Observed`: these are elapsed calendar-day metrics from date fields, not pure active bench time.
- `Observed`: paused/customer-wait states are still included inside the elapsed totals.
- `Observed`: some categories have small sample sizes and should be treated as directional rather than final.
- `Inferred`: the biggest timing story so far is not slow simple walk-in repair; it is the longer diagnostic-to-resolution chain, especially for mail-in and diagnostic-heavy work.

## 6. Quote Lag And Queue Health

These metrics were pulled from the live Monday main board on `2026-04-01` across all `4453` items.

### Quote Turnaround

- `Observed`: `206` items had both `Diag. Complete` and `Quote Sent` populated.
- `Observed`: median `Diagnostic Complete -> Quote Sent` was `1 day`, with `p75 = 2 days`.
- `Observed`: by path, quote lag is not uniformly bad:
  - `Walk-In + Diagnostic`: median `1 day` across `112`
  - `Mail-In + Diagnostic`: median `0 days` across `25`
  - `Gophr Courier + Diagnostic`: median `3 days` across `15`
- `Inferred`: broad quote creation speed is not the main operational bottleneck.

### Open Queue Health

- `Observed`: the main board currently carries `900` non-terminal items.
- `Observed`: age-bucket split on those `900` open items is:
  - `158` aged `0-30 days`
  - `127` aged `31-90 days`
  - `66` aged `91-180 days`
  - `109` aged `181-365 days`
  - `440` aged `366+ days`
- `Observed`: `322` of those are sitting in blocked or customer-wait style states such as:
  - `Repair Paused`
  - `Awaiting Part`
  - `Client To Contact`
  - `Client Contacted`
  - `Awaiting Confirmation`
  - `Password Req`
- `Observed`: the largest non-terminal statuses are not fresh workshop work:
  - `Booking Confirmed`: `232` items, median open age `835.5 days`
  - `Awaiting Confirmation`: `127` items, median open age `810 days`
  - `Client Contacted`: `120` items, median open age `317.5 days`
  - `Repair Paused`: `39` items, median open age `79 days`
  - `Quote Sent`: `22` items, median open age `239.5 days`
  - `Awaiting Part`: `22` items, median open age `59.5 days`
- `Observed`: some statuses are clearly carrying both live work and old queue debt:
  - `Booking Confirmed`: `215` of `232` are `366+` days old
  - `Awaiting Confirmation`: `104` of `127` are `366+` days old
  - `Client Contacted`: `43` of `120` are `366+` days old
  - `Received`: `37` of `44` are only `0-30` days old
  - `Client To Contact`: `10` of `13` are only `0-30` days old
- `Inferred`: the board is carrying a large volume of stale non-terminal work that is no longer acting like a clean live queue.

### Post-Diagnostic No-Quote Exceptions

- `Observed`: `75` open items have `Diag. Complete` populated but no `Quote Sent` date.
- `Observed`: the oldest of those are not all end-user diagnostics; several are BM or BER-style exception cases.
- `Observed`: the oldest examples include items sitting `111-176` days after `Diag. Complete` with no quote date, often in `Repair Paused`, `Client Contacted`, `Awaiting Part`, or `BER/Parts`.
- `Inferred`: the main issue is not broad quote-SLA speed but exception handling, stale backlog ownership, and the failure to close or archive long-tail items cleanly.

## 7. What Is Still Missing

The missing work is now computational, not conceptual.

### Required Derived Metrics

- percentile client first-response time by channel across a fuller rolling window
- median time from `Quote Sent` -> approval/payment
- median time from `Queued For Repair` / `Under Repair` -> `Date Repaired`
- median total lifecycle time by scenario:
  - walk-in repair
  - walk-in diagnostic
  - mail-in repair
  - mail-in diagnostic
  - corporate repair
  - corporate diagnostic
  - BM intake / BM resale service paths where relevant

### Required Segmentation

- by client type
- by service type
- by technician
- by paused vs non-paused items
- by genuinely current WIP versus stale historical non-terminal items
- by fast / standard turnaround promise where available

## 8. Best Source Set For The Next Pass

Use these together:

- Monday activity logs and item fields for actual elapsed durations
- Monday time-tracking columns for active work duration
- repair-flow traces for status-path interpretation
- Intercom / triage mapping for customer response latency
- team audits for ownership and staffing context
- turnaround KB for customer promise baseline

### Current Measurement Blocker

- `Observed`: a `2026-04-01` attempt to replay `Quote Sent -> next decision` from Monday activity logs found `126` items with `Quote Sent` date since `2025-12-01`, but only `3` exposed a usable `status4` quote-to-next-decision event chain through the accessible activity-log API.
- `Observed`: the live board schema does not currently expose a separate `comms_status` column; only the main `Status` column and `Quote Sent` date are visible.
- `Observed`: operator confirmation on `2026-04-02` says the canonical post-quote decision path is:
  - `Diagnostic Complete`
  - `Quote Sent`
  - `Invoiced`
  - `Queued For Repair`
- `Observed`: valid exception branches are:
  - `Quote Rejected`
  - direct `Quote Sent -> Queued For Repair` when `Invoiced` is skipped
- `Observed`: operator confirmation also says the best available proxy sources for quote/comms timing are:
  - Intercom conversation timestamps for quote sending in the current era
  - Xero invoice creation dates for invoice-stage timing
- `Inferred`: the remaining gap is not lack of trying; it is a data-surface problem in Monday history retention / exposure, so the next trustworthy quote-approval model likely needs Intercom and Xero joined back to Monday rather than Monday logs alone.

## Conclusion

- `Observed`: the system already contains the raw fields needed to calculate repair, diagnostic, and customer-response durations.
- `Observed`: the evidence-backed timing layer now shows that broad quote turnaround is relatively healthy, while queue hygiene and stale exception handling are not.
- `Observed`: the board is carrying too much old non-terminal work for its status counts to be read as a clean live queue.
- `Inferred`: the next highest-value timing pass is to separate real current WIP from stale historical non-terminal items, then split active work time from paused/customer-wait time.
