# Monday Last-Week Activity Issue Audit

Generated: `2026-04-27T08:03:43.165186+00:00`
Window: `2026-04-20T00:00:00Z` through `2026-04-26T23:59:59Z` UTC
Mode: READ ONLY — Monday API reads only; no Monday/Intercom/Slack/external mutations.

## Schema basis

- Main Board ID from `/home/ricky/kb/monday/main-board.md`: `349212843`.
- Client Type column: `status`; BM excluded, End User/Corporate/Corporate Warranty/B2B included.
- Main repair status column: `status4`; Repair Type/process column: `status24`.
- Board relationships checked in `/home/ricky/kb/monday/board-relationships.md`; this audit targets Main Board only.

## Classification criterion

I treated an item as a potential issue only when last-week activity logs or same-window updates showed issue-like evidence: status/problem transitions into risky statuses, repair outcome values such as BER/Unrepairable/Quote Rejected, backwards status movement, risky group moves, or update text containing complaint/refund/return/warranty/redo/chase/delay/lost/parts/payment-dispute signals. Routine status changes were not flagged unless they matched those risk patterns.

## Counts

- Total Main Board activity logs in window: **4724**
- Total Main Board items with activity in window: **218**
- Non-BM End User/Corporate items with activity: **32**
- Potential issue items: **12**

### Breakdown by issue type

- status_regression: 8
- handoff_or_data_error: 1
- missed_contact_or_chase_needed: 1
- parts_unavailable_or_wrong_part: 1
- delay_or_stuck_status: 1

### Breakdown by client type

- End User: 12

## Prioritized issue candidates

| Severity | Category | Item | Client | Current status / type | Evidence time(s) | Evidence | Recommended follow-up |
|---|---|---|---|---|---|---|---|
| high | status_regression | [#1114 - Gemma Kew `11477994231`](https://icorrect.monday.com/boards/349212843/pulses/11477994231) | End User | Shipped / Diagnostic | 2026-04-20T11:05:07.055859Z<br>2026-04-21T12:03:58.846770Z<br>2026-04-21T15:41:21.400162Z | Status moved backwards Repaired → Diagnostics<br>Status changed Under Repair → Repair Paused<br>Status moved backwards Repaired → Diagnostics | Ferrari/client services: review customer comms and contact customer if needed. |
| high | status_regression | [#1178 - Kobby Adi `11731044367`](https://icorrect.monday.com/boards/349212843/pulses/11731044367) | End User | Returned / BER | 2026-04-20T15:01:46.820299Z<br>2026-04-21T15:56:30.074059Z | Status moved backwards Repaired → Diagnostics<br>Repair Type changed Diagnostic → BER | Technician + Ferrari: confirm diagnosis/repair outcome and next customer decision. |
| high | handoff_or_data_error | [Alan Sherling `11047177121`](https://icorrect.monday.com/boards/349212843/pulses/11047177121) | End User | Ready To Collect / Diagnostic | 2026-04-20T18:02:45.683714Z<br>2026-04-20T18:03:03.267341Z | Status changed Repaired → Error<br>Status changed Repaired → Error | Ops/Ferrari: audit item handoff/status history and correct process if needed. |
| high | status_regression | [#1186 - Benjamin Hadhazi `11756337615`](https://icorrect.monday.com/boards/349212843/pulses/11756337615) | End User | Shipped / Repair | 2026-04-21T12:19:49.954661Z<br>2026-04-21T12:26:28.906704Z<br>2026-04-23T14:56:31.925443Z | Status moved backwards Repaired → Diagnostics<br>Status changed Under Refurb → Repair Paused<br>Status changed Received → Client To Contact | Ferrari/client services: review customer comms and contact customer if needed. |
| high | missed_contact_or_chase_needed | [#1201 - Stefan Chapman `11803327110`](https://icorrect.monday.com/boards/349212843/pulses/11803327110) | End User | Client To Contact / Repair | 2026-04-24T17:05:03.685435Z<br>2026-04-24T17:05:11.356236Z | Status changed Received → Client To Contact<br>Status regressed Shipped → Received | Ferrari/client services: review customer comms and contact customer if needed. |
| medium | status_regression | [Liam king `11721115235`](https://icorrect.monday.com/boards/349212843/pulses/11721115235) | End User | Ready To Collect / Diagnostic | 2026-04-20T12:16:50.823632Z | Status moved backwards Repaired → Diagnostics | Ops/Ferrari: audit item handoff/status history and correct process if needed. |
| medium | status_regression | [Farin Dickinson `11630018092`](https://icorrect.monday.com/boards/349212843/pulses/11630018092) | End User | Returned / Board Level | 2026-04-20T13:18:31.978978Z | Status moved backwards Repaired → Diagnostics | Ops/Ferrari: audit item handoff/status history and correct process if needed. |
| medium | status_regression | [Francis Omede `11701355436`](https://icorrect.monday.com/boards/349212843/pulses/11701355436) | End User | Ready To Collect / Diagnostic | 2026-04-20T14:50:50.178071Z<br>2026-04-21T12:26:28.925125Z | Status moved backwards Repaired → Diagnostics<br>Status changed Under Repair → Repair Paused | Ops/Ferrari: audit item handoff/status history and correct process if needed. |
| medium | parts_unavailable_or_wrong_part | [#1156 - Gary Adamson `11625087344`](https://icorrect.monday.com/boards/349212843/pulses/11625087344) | End User | Queued For Repair / Repair | 2026-04-21T11:26:56.210838Z<br>2026-04-22T17:17:47.898020Z<br>2026-04-23T13:43:25.076090Z | Parts Status changed No Stock → Ordered<br>Parts Status changed In Stock → No Stock<br>Status changed Repair Paused → Awaiting Part | Technician/parts owner: verify part order/stock ETA and update customer if delayed. |
| medium | status_regression | [Antonio Asamoah `11491056656`](https://icorrect.monday.com/boards/349212843/pulses/11491056656) | End User | Ready To Collect / Diagnostic | 2026-04-21T16:54:57.526907Z | Status moved backwards Repaired → Diagnostics | Ops/Ferrari: audit item handoff/status history and correct process if needed. |
| medium | delay_or_stuck_status | [#1158 - Chelsea Boliti `11646088036`](https://icorrect.monday.com/boards/349212843/pulses/11646088036) | End User | Shipped / Repair | 2026-04-22T17:05:29.924580Z<br>2026-04-24T09:29:11.350822Z<br>2026-04-24T09:42:46.975770Z | Status changed Diagnostics → Repair Paused<br>Status moved backwards Repaired → Diagnostics<br>Status changed Battery Testing → Password Req | Ferrari/client services: review customer comms and contact customer if needed. |
| medium | status_regression | [Niki Freeman `11611289090`](https://icorrect.monday.com/boards/349212843/pulses/11611289090) | End User | Ready To Collect / Diagnostic | 2026-04-23T11:25:42.398630Z | Status moved backwards Repaired → Diagnostics | Ops/Ferrari: audit item handoff/status history and correct process if needed. |

## Limitations

- Client type filtering uses current Main Board Client Type (`status`) value, not historical client type at activity timestamp.
- Issue classification is rule-based from activity log data and same-window updates; it intentionally flags potential issues for human review, not confirmed failures.
- Monday activity log `created_at` is returned as a high-precision numeric epoch timestamp and was normalized to UTC.
- Updates fetched with `updates(limit:100)` per item; very update-heavy items could have older same-window updates omitted if more than 100 newer updates exist.
- Blank/other client types were excluded to honor end-user/corporate-only scope; this may omit miscoded end-user items.

## Artifacts

- JSON: `/home/ricky/builds/monday/reports/monday-activity-issues-2026-04-20_to_2026-04-26.json`
- CSV: `/home/ricky/builds/monday/reports/monday-activity-issues-2026-04-20_to_2026-04-26.csv`
