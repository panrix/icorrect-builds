# Harness Doctor - 2026-04-25

## Scope

Added and ran a browser-harness doctor wrapper for the VPS-first Back Market browser ops runtime.

No Back Market login, browser portal navigation, mailbox network connection, customer action, listing edit, return, warranty, Monday action, or external mutation was performed.

## Added

- `/home/ricky/builds/backmarket-browser/lib/harness-doctor.js`
- `/home/ricky/builds/backmarket-browser/scripts/doctor-harness.js`
- `/home/ricky/builds/backmarket-browser/test/unit/harness-doctor.test.js`

## Doctor result

`browser-harness` is installed, but the VPS browser attach path is not currently ready.

Observed doctor output:

```text
browser-harness doctor
  platform          Linux 6.8.0-107-generic
  python            3.11.14
  version           0.1.0 (git)
  latest release    (could not reach github)
  [FAIL] chrome running — start chrome/edge and rerun `browser-harness --setup`
  [FAIL] daemon alive — run `browser-harness --setup` to attach
  [FAIL] profile-use installed — optional: curl -fsSL https://browser-use.com/profile.sh | sh
  [FAIL] BROWSER_USE_API_KEY set — optional: needed only for cloud browsers / profile sync
```

Interpretation:

- Installed: yes.
- Harness binary: yes.
- Chrome/browser session currently attached: no.
- Harness daemon currently alive: no.
- Optional cloud/profile-sync dependencies: not installed/configured.
- No Back Market page was opened.

## Verification

Ran:

```bash
cd /home/ricky/builds/backmarket-browser
npm test
npm run validate:selectors
node scripts/doctor-harness.js
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
browser-harness doctor: ok=false; chrome running fail; daemon alive fail
Dispatch match self-test passed
```

## Next

Next safe step is to decide the browser session strategy:

1. Start a VPS Chrome/Edge session and run `browser-harness --setup`, or
2. Use Ricky's local Chrome routed to the VPS for discovery only, then later productise as VPS Chrome.

Either path should still stop before Back Market login unless explicitly approved.
