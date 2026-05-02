# Mailbox Fetcher Scaffold - 2026-04-25

## Scope

Added a non-live mailbox fetcher scaffold for the VPS-first Back Market browser-harness login path.

No mailbox network connection, Back Market login, customer action, listing edit, return, warranty, Monday action, or external mutation was performed.

## Added

- `/home/ricky/builds/backmarket-browser/lib/mailbox-fetcher.js`
- `/home/ricky/builds/backmarket-browser/scripts/plan-mailbox-fetch.js`
- `/home/ricky/builds/backmarket-browser/test/unit/mailbox-fetcher.test.js`

## What it validates

The scaffold can:

- confirm saved Jarvis IMAP env is present without printing secrets
- emit a metadata-only fetch plan
- enforce `readOnly: true`
- define a no-raw-body / no-stored-code policy
- describe the next live implementation steps without connecting to mailbox

## Verification

Ran:

```bash
cd /home/ricky/builds/backmarket-browser
npm test
npm run validate:selectors
node scripts/plan-mailbox-fetch.js --since=2026-04-25T19:00:00Z
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
Selector map contract valid
plan-mailbox-fetch: ok=true, missing=[]; server/user redacted; passwordPresent=true
Dispatch match self-test passed
```

## Next

Implement actual IMAP metadata fetch using a small dependency or built-in TLS socket. First live validation should only list message metadata and must not trigger a Back Market login email unless explicitly approved.
