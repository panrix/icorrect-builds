# Mailbox Code Preflight - 2026-04-25

## Scope

Added a pure, non-live Back Market login-code parser for the VPS-first browser-harness path.

No Back Market login, mailbox login, customer action, listing edit, return, warranty, or Monday action was performed.

## Added

- `/home/ricky/builds/backmarket-browser/lib/mailbox-code.js`
- `/home/ricky/builds/backmarket-browser/test/unit/mailbox-code.test.js`

## What it validates

The helper can:

- accept only messages addressed to `jarvis@icorrect.co.uk`
- require a Back Market sender filter
- require a login-code subject filter
- extract a 6-digit code
- pick the freshest valid code after a prompt timestamp
- reject stale or wrong-recipient messages

## Verification

Ran:

```bash
cd /home/ricky/builds/backmarket-browser
npm test
npm run validate:selectors
```

Result:

```text
selector-map.test passed
fix-sku.test passed
cs-monitor.test passed
mailbox-code.test passed
Selector map contract valid
```

## Next

Wire this parser to a read-only mailbox fetcher using the saved Jarvis IMAP/SMTP env. That next step should validate connection and message discovery only, without triggering a Back Market login email until explicitly approved.
