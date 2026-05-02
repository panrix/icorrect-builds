# Browser Session Strategy - 2026-04-25

## Scope

Created the browser session strategy runbook and readiness plan for VPS-first browser-harness Back Market operations.

No live Back Market login, browser portal navigation, mailbox network connection, customer action, listing edit, return, warranty, Monday action, or external mutation was performed.

## Added

- `/home/ricky/builds/backmarket-browser/RUNBOOK-BROWSER-SESSION-STRATEGY-2026-04-25.md`
- `/home/ricky/builds/backmarket-browser/scripts/setup-strategy-plan.js`

## Decision captured

Preferred durable path:

- VPS Chrome/Edge session controlled by browser-harness.

Fallback only for discovery:

- Ricky local Chrome routed to VPS.

The fallback must not become production runtime.

## Readiness check

Ran:

```bash
cd /home/ricky/builds/backmarket-browser
npm test
npm run validate:selectors
node scripts/setup-strategy-plan.js
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
runtime-lock.test passed
harness-check.test passed
harness-doctor.test passed
Selector map contract valid
setup-strategy-plan: ok=true, lockFree=true, harnessInstalled=true, harnessHelpOk=true, imapEnvOk=true
Dispatch match self-test passed
```

## Approval boundary

Still blocked until explicit approval:

- live IMAP mailbox connection
- Back Market login flow
- Back Market portal read-only session
- one-SKU canary mutation
- customer/return/warranty actions

## Next

Prepare a local-only current listing queue pull plan. Do not execute live Monday/BM reads or writes without approval.
