# Overnight Recovery Checkpoint 2 Verification - 2026-04-25

## Scope

Verified dispatch matching, listing queue mapping, and browser-ops spec/artifacts at checkpoint 2.

No live Back Market, Monday, customer, listing, return, warranty, mailbox network, or browser portal mutation was performed.

## Codex/session status

`session_list` found no active matching Codex sessions. Previous session outputs are represented on disk by the generated reports and browser-ops files.

## Verification summary

### Dispatch matching

Status: complete for offline gate.

Verified:

```bash
node -c /home/ricky/builds/royal-mail-automation/dispatch.js
node /home/ricky/builds/royal-mail-automation/dispatch.js --dispatch-match-self-test
```

Result: `Dispatch match self-test passed`.

### Listing queue mapping

Status: report complete, but live queue still not pulled.

Evidence:

- `/home/ricky/builds/backmarket/reports/overnight-listing-clearance-map-2026-04-25.md`

Known caveat: repo-visible queue proves BM 1555 as clearance candidate, but a fresh read-only current queue pull/dry-run is still needed before any listing action.

### Browser ops

Status: spec/skeleton complete for non-live gates.

Verified:

```bash
cd /home/ricky/builds/backmarket-browser
npm test
npm run validate:selectors
node scripts/preflight-local.js
node scripts/doctor-harness.js
```

Results:

- unit tests pass
- selector map valid
- local preflight now releases its lock correctly
- harness doctor confirms browser-harness installed but VPS Chrome/daemon not currently attached

## Fix applied during checkpoint

Found stale lock at:

- `/home/ricky/builds/backmarket-browser/data/.preflight.lock`

Root cause: `scripts/preflight-local.js` called `process.exit()` inside `try`, which could leave the lock behind before cleanup completed.

Fix:

- rewrote script to set `exitCode`, release lock in `finally`, then call `process.exit(exitCode)` after cleanup.
- removed stale `.preflight.lock`.
- re-ran `preflight-local`; confirmed `lock released` and lock file absent after exit.

## Remaining blocker

The only current browser-ops blocker is expected and non-destructive:

- `browser-harness --doctor` fails because Chrome is not running and daemon is not alive.

Next decision before live portal read-only work:

1. start VPS Chrome/Edge and run `browser-harness --setup`, or
2. use Ricky local Chrome routed to VPS for discovery only, then productise as VPS Chrome.
