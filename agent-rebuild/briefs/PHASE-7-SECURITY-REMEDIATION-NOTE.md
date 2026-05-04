# Phase 7 Security Remediation Note

**Created:** 2026-05-04
**Status:** partial file-level redaction complete; credential rotation still required

## What changed

Tracked files with live credential material were redacted in the working tree:

| File | Action |
|---|---|
| `icloud-checker/briefs/BRIEF.md` | Replaced inline SickW API key with a redacted pointer to `/home/ricky/config/.env`. |
| `marketing-intelligence/snapshot/MI-BUILD-BRIEF.md` | Replaced MI dashboard basic-auth username/password with redacted placeholders. |
| `server-config/pm2-dump.json` | Replaced sensitive env values in the PM2 snapshot with redacted placeholders. JSON remains valid. |
| `server-config/pm2-dump-formatted.json` | Replaced sensitive env values in the formatted PM2 snapshot with redacted placeholders. JSON remains valid. |
| `server-config/docs/openclaw-gateway.service` | Replaced inline gateway token in the captured unit-file snapshot with a redacted placeholder. |
| `.gitignore` | Added `pm2-dump*.json` and `**/pm2-dump*.json` so future PM2 dumps are not casually re-added. |

## Verification

- `server-config/pm2-dump.json` parses as valid JSON after redaction.
- `server-config/pm2-dump-formatted.json` parses as valid JSON after redaction.
- Redaction markers are present in every file listed above.
- The stale KB references named in `QA-PHASE-7a-report.md` are already patched in the live KB files; remaining old-path mentions are historical audit/report evidence.

## Still Required

This was a file-level redaction pass only. It does not rotate credentials at source.

Ricky still needs to rotate or explicitly accept risk for:

- SickW API key used by `icloud-checker`.
- MI dashboard basic-auth password.
- OpenClaw gateway token captured in server-config snapshots.
- Telegram bot token captured in PM2 snapshots.
- Anthropic OAuth token captured in PM2 snapshots.
- Any other secrets that were present in the PM2 dumps before redaction.

After rotation, run the service health checks before Phase 7b moves runtime-sensitive folders.
