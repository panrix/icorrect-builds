# Mailbox IMAP Contract - 2026-04-25

## Scope

Added a pure, non-live IMAP configuration/search contract for Back Market login-code retrieval.

No mailbox connection, Back Market login, customer action, listing edit, return, warranty, Monday action, or external mutation was performed.

## Added

- `/home/ricky/builds/backmarket-browser/lib/mailbox-imap-contract.js`
- `/home/ricky/builds/backmarket-browser/test/unit/mailbox-imap-contract.test.js`

## What it validates

The helper can:

- derive required read-only mailbox config from saved Jarvis email env names
- fail closed if required env is missing
- keep password redacted as `passwordPresent`
- define a read-only search envelope for BM code messages
- enforce metadata-only storage policy: no raw body, no stored code

## Verification

Ran:

```bash
cd /home/ricky/builds/backmarket-browser
npm test
npm run validate:selectors
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
Selector map contract valid
Dispatch match self-test passed
```

## Next

Implement the actual read-only mailbox fetcher behind this contract. First live mailbox validation should list only message metadata and must not trigger a Back Market login email unless explicitly approved.
