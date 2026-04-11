# JARVIS Email

## Access

- `Observed`: IMAP is live.
- `Observed`: SMTP credentials are valid, but the configured port is stale.

Evidence exports:
- `/home/ricky/data/exports/system-audit-2026-03-31/jarvis-email/imap-inventory.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/jarvis-email/smtp-port-scan.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/jarvis-email/smtp-login-probe.json`

## Observed Inventory

- IMAP host: `uk1000.siteground.eu:993`
- login result: `OK`
- inbox status:
  - `MESSAGES 49`
  - `UNSEEN 15`
  - `UIDNEXT 50`
- sampled mailboxes:
  - `INBOX`
  - `INBOX.Sent`
  - `INBOX.Drafts`
  - `INBOX.Junk`
  - `INBOX.Trash`
  - `INBOX.spam`
  - `INBOX.Archive`

## SMTP Probe Result

- `Observed`: SMTP on the configured path `uk1000.siteground.eu:465` times out.
- `Observed`: the same mailbox credentials successfully authenticate over:
  - `uk1000.siteground.eu:587` with `STARTTLS`
  - `uk1000.siteground.eu:2525` with `STARTTLS`
- `Observed`: this makes the problem a stale SMTP port/config issue rather than a dead mailbox or bad credentials.

## Cross-System Role

- local BM and automation docs describe JARVIS mail as an operational inbox used for portal codes and messaging
- IMAP success means mailbox-read access is live today
- local n8n/docs also show SMTP-based email sending is still part of some form flows, even though the target state is to remove those SMTP hacks in favor of direct Intercom ticket creation

## Open Threads

- update the canonical env/docs so SMTP uses the working port/path instead of stale `465`
- inspect mailbox subjects/automation patterns only if needed for a later process thread
