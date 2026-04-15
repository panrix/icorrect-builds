# Changelog: Intercom Send Route — 9702338 Permanently Banned (2026-04-13)

## Problem

Alex kept using Intercom admin ID `9702338` (the Alex bot account) as the send route for customer emails, despite Ferrari correcting this multiple times. Root causes:

1. `lib/config.js` had `9702338` as the hardcoded fallback default for `INTERCOM_ADMIN_ID`.
2. `scripts/spam-audit.js` had the same wrong fallback.
3. Active docs and KB files described `9702338` without any warning against using it for sending.
4. No runtime guard existed — a misconfigured env var would silently send via the wrong route with no alert.

The correct route is `9702337` (the Support admin, `admin@icorrect.co.uk`), which has the active inbox seat. `9702338` is the bot admin without an inbox seat and causes delivery failures.

## Fixes

### `lib/config.js`

- Changed fallback default from `9702338` to `9702337`.
- Added a runtime assertion: if `INTERCOM_ADMIN_ID` resolves to anything other than `9702337`, the process throws immediately with a clear error before any API call is made.

### `scripts/spam-audit.js`

- Same fallback and runtime assertion applied.

### `services/telegram-bot.js`

- Added `sendRawAlert()` helper: fires a raw HTTPS call to Telegram using only the bot token from env vars — no TelegramClient dependency.
- Wrapped `getConfig()` in a try/catch at startup. If the admin ID assertion throws, the alert fires to this channel (chat `-1003822970061`, topic `1`) before the process exits:

  ```
  🚨 Alex bot startup failure

  INTERCOM_ADMIN_ID must be 9702337 (Support). Got: [value]. Using any other admin ID is forbidden.

  Fix INTERCOM_ADMIN_ID env var and restart the service.
  ```

- Thread target is overridable via `TELEGRAM_ALERTS_THREAD_ID` env var.

### KB and docs updated

All active docs that referenced `9702338` have been updated with explicit BANNED warnings or corrected send instructions:

| File | Change |
|---|---|
| `kb/customer-service/intercom-setup.md` | Added BANNED warning after 9702338 entry |
| `builds/claude-project-export/sop-project/cs-intercom-setup.md` | Same |
| `builds/documentation/raw-imports/intercom-finn.md` | Table flagged banned; send instruction updated to 9702337; verification TODO resolved |
| `builds/documentation/raw-imports/n8n-automations.md` | Admin row corrected to 9702337 |
| `agents/main/workspace/MEMORY.md` | Bug note updated with permanent ban |

### Agent memory

- `agents/alex-cs/workspace/memory/feedback_intercom_send_route.md` — new file, hard rule locked in.
- `agents/alex-cs/workspace/MEMORY.md` — Hard Rules section added with the ban prominently surfaced.

## Behaviour After This Change

| Scenario | Before | After |
|---|---|---|
| `INTERCOM_ADMIN_ID` env var unset | Silently defaults to `9702338`, sends via wrong route | Defaults to `9702337`, sends correctly |
| `INTERCOM_ADMIN_ID` set to `9702338` | Silently sends via wrong route | Throws at startup; Telegram alert fires to Ferrari before process exits |
| Any other wrong admin ID | Silently sends via wrong route | Same: throws + alert |
| New code path added without reading config | Could hardcode `9702338` | Config assertion catches it; all send paths must go through `config.intercom.adminId` |
