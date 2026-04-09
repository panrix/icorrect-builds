# Telegram Review Flow QA — 2026-04-09

## Cases

### approve — Approve sends once and blocks duplicate resend

- Result: PASS
- Details: Intercom reply=1, Monday update=1, second callback rejected as already handled.

### approve-retry — Approve retry resumes Monday sync without resending Intercom reply

- Result: PASS
- Details: First pass failed Monday sync only; retry completed send with Intercom reply count still at 1.

### edit — Edit updates stored draft and Telegram card

- Result: PASS
- Details: Conversation moved to edited, 1 edit record stored, Telegram card refreshed.

### escalate — Escalate adds Intercom context, tags, and Ricky notification

- Result: PASS
- Details: Intercom note/tag written and Ricky notification sent; conversation marked escalated.

### snooze — Snooze hides card and reposts it once due

- Result: PASS
- Details: Conversation moved to snoozed, source message deleted, then reposted back to pending after expiry.

### routing — Email triage routing stays on the email topic and blocks quote cards

- Result: PASS
- Details: Outgoing payload used Telegram topic 774; quote card send was rejected.

## Summary

- Passed: 6/6
- Failed: 0/6