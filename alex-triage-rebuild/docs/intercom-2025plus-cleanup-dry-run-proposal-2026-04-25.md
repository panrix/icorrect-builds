# Intercom 2025+ Cleanup Dry-Run Proposal

Generated: 2026-04-25 14:45 UTC

## Why this exists

The April cleanup completed successfully, but it only closed the pre-2025 backlog.

Evidence from `data/intercom-cleanup-summary.json`:

- Conversations checked: 31,194
- Pre-2025 conversations closed: 24,187
- 2025+ conversations deliberately skipped: 6,959
- Errors: 0

A fresh Intercom sample scan on 2026-04-25 showed that the current high open count is mostly 2025/2026 imported/admin-created tickets rather than live customer emails.

## Current sample scan

Scope: first 3,000 open Intercom conversations returned by the API.

Breakdown:

- Total sampled open conversations: 3,000
- Admin initiated: 2,567
- Customer/email source: 345
- Created by Alex/import automation `9702338`: 2,889
- With ticket attached: 2,904
- Assigned to Support team: 2,795
- Assigned to Support admin `9702337`: 2,953
- Unread according to Intercom API: 2,794

Ticket states in the sample:

- `waiting_on_customer`: 1,472
- `in_progress`: 1,034
- `submitted`: 198
- `resolved`: 200
- `no_ticket`: 96

## Interpretation

The open-count problem is not primarily Ferrari having thousands of customer emails to answer.

It appears to be mostly:

1. 2025+ imported ticket conversations created by automation.
2. Tickets left in `waiting_on_customer` or `in_progress` even when they are stale.
3. Some `resolved` tickets still counted as open conversations.
4. Old customer/contact-form threads that were skipped by the pre-2025-only cleanup.

## Proposed cleanup tiers

No action should be taken until Ricky approves a tier.

### Tier 1: safest cleanup

Close only conversations where all are true:

- Ticket state is `resolved`
- Conversation state is still open
- Updated at least 7 days ago
- No customer reply newer than last admin reply

Risk: very low.

Rationale: resolved tickets should not remain open conversations.

### Tier 2: low-risk cleanup

Close conversations where all are true:

- Created by automation/admin import `9702338`
- Source is `admin_initiated`
- Ticket state is `waiting_on_customer`
- Updated at least 14 days ago
- No customer reply newer than last admin reply

Risk: low.

Rationale: these are stale wait-on-customer tickets. If the customer replies later, Intercom should reopen or update the conversation.

### Tier 3: medium-risk cleanup

Close conversations where all are true:

- Created by automation/admin import `9702338`
- Source is `admin_initiated`
- Ticket state is `submitted`
- Updated at least 14 days ago
- No customer reply newer than last admin reply

Risk: medium.

Rationale: submitted tickets may include intake records that were never worked, so this needs a preview list before execution.

### Tier 4: review-only list

Do not close automatically. Produce a CSV/report for Ferrari/Ricky review.

Includes:

- `in_progress` tickets older than 14 days
- Email-source conversations older than 14 days
- Contact-form conversations from `michael.f@icorrect.co.uk`
- Any conversation where customer replied after our last admin message

Risk: none if report-only.

## Recommended approval

Approve Codex to implement a proper dry-run command first, not to close anything yet.

Recommended Codex task:

1. Add a script such as `scripts/intercom-cleanup-2025plus-dry-run.js`.
2. Fetch all open Intercom conversations safely with pagination and progress logging.
3. Apply the four cleanup tiers above.
4. Write:
   - JSON full report
   - CSV candidate list
   - Markdown summary
5. Do not call any close endpoint.
6. Include a second explicit execution script only after the dry-run report is reviewed.

## Approval needed

If approved, spawn Codex to build the dry-run cleanup tool.

Suggested approval wording:

`Approved: spawn Codex to build the 2025+ Intercom cleanup dry-run tool only. No closing conversations.`
