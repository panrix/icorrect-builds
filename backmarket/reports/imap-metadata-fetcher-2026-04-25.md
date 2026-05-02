# IMAP Metadata Fetcher - 2026-04-25

## Scope

Added a plan-only IMAP metadata fetcher module for the VPS-first Back Market browser-harness login path.

No live mailbox connection, Back Market login, customer action, listing edit, return, warranty, Monday action, or external mutation was performed.

## Added

- `/home/ricky/builds/backmarket-browser/lib/imap-metadata-fetcher.js`
- `/home/ricky/builds/backmarket-browser/scripts/plan-imap-metadata-fetch.js`
- `/home/ricky/builds/backmarket-browser/test/unit/imap-metadata-fetcher.test.js`

## What it validates

The module can:

- build a read-only IMAP/TLS metadata fetch plan from saved env
- redact server/user/password values from output
- define `EXAMINE` instead of `SELECT` to avoid mailbox writes
- define `BODY.PEEK` fetch commands so messages are not marked read
- hash message IDs for audit records
- sanitise envelopes without storing raw body or extracted code
- refuse `--live` in the script path

## Verification

Ran:

```bash
cd /home/ricky/builds/backmarket-browser
npm test
npm run validate:selectors
node scripts/plan-imap-metadata-fetch.js --since=2026-04-25T19:30:00Z
node -c /home/ricky/builds/royal-mail-automation/dispatch.js
node /home/ricky/builds/royal-mail-automation/dispatch.js --dispatch-match-self-test
```

Result:

```text
selector-map.test passed
fix-sku.test passed
cs-monitor.test passed
mailbox-code.test passed
mailbox-imap-contract.test passed
mailbox-fetcher.test passed
imap-metadata-fetcher.test passed
Selector map contract valid
plan-imap-metadata-fetch: ok=true, liveNetwork=false, readOnly=true, server/user/password present but redacted
Dispatch match self-test passed
```

## Next

After explicit approval, the first live mailbox validation can connect to IMAP and list metadata only. It must not trigger Back Market login or request a new email code.
