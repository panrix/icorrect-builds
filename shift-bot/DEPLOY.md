# shift-bot — Deploy Guide

Phase 6 walkthrough. ~15 minutes.

## 1. Create the Slack app

1. Open https://api.slack.com/apps → **Create New App** → **From a manifest** → workspace **iCorrect**.
2. Paste the contents of [`slack-manifest.yaml`](./slack-manifest.yaml). Confirm.
3. **Basic Information** → **App-Level Tokens** → **Generate Token and Scopes**:
   - Name: `shift-bot-app-token`
   - Add scope: `connections:write`
   - **Generate** → copy the `xapp-…` token.
4. **Install App** → **Install to iCorrect Workspace** → **Allow**.
5. **OAuth & Permissions** → copy the **Bot User OAuth Token** (starts `xoxb-…`).
6. Add both tokens to `~/config/.env`:
   ```
   SHIFT_BOT_TOKEN=xoxb-…
   SHIFT_BOT_APP_TOKEN=xapp-…
   ```
   *(Use prefixed names — don't reuse the existing `SLACK_BOT_TOKEN` which belongs to Jarvis.)*

## 2. Update the service to read the new env names

Edit `index.js` and `scripts/run-job.js` to read `SHIFT_BOT_TOKEN` / `SHIFT_BOT_APP_TOKEN` instead of `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN`. *(Or, if you'd rather use the generic names, set those instead — but we recommend dedicated names so we never confuse this bot with Jarvis.)*

```bash
cd ~/builds/shift-bot
sed -i 's/SLACK_BOT_TOKEN/SHIFT_BOT_TOKEN/g'   index.js scripts/run-job.js
sed -i 's/SLACK_APP_TOKEN/SHIFT_BOT_APP_TOKEN/g' index.js scripts/run-job.js
```

## 3. Install the systemd unit

```bash
mkdir -p ~/.config/systemd/user
cp ~/builds/shift-bot/systemd/shift-bot.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable shift-bot
systemctl --user start shift-bot
systemctl --user status shift-bot --no-pager | head -15
journalctl --user -u shift-bot -n 20 --no-pager
```

You should see:
```
INFO {"event":"started","mode":"socket","tz":"Europe/London"}
INFO {"event":"cron_registered","jobs":["fri_nudge","sun_chase"],"tz":"Europe/London"}
INFO {"event":"cron_registered","jobs":["mon_sync"],"tz":"Europe/London"}
INFO {"event":"cron_registered","jobs":["mon_summary"],"tz":"Europe/London"}
```

## 4. Smoke test from Slack

1. In any Slack channel, type `/shift`. The modal should open (or you should see "Submission window opens Friday at 10:00 London time" if it's mid-week).
2. Submit a dummy week. You should see `:white_check_mark: Shifts submitted…` in DM.
3. Run the modal a second time → should reject with "already submitted".

## 5. Smoke test the cron jobs

Each job has a CLI wrapper. Use `--dry-run` for nudges/summary (won't actually post), and a fresh test week to avoid colliding with real data.

```bash
cd ~/builds/shift-bot

# Nudges in dry-run — should print 3 DM bodies to stdout, no Slack messages sent
node scripts/run-job.js fri_nudge --dry-run --week 2026-05-04
node scripts/run-job.js sun_chase --dry-run --week 2026-05-04

# Calendar sync against a test week — REAL events, but only if the DB has rows
node scripts/run-job.js mon_sync --week <test-week-with-shifts>

# Summary in dry-run — prints the formatted message to stdout
node scripts/run-job.js mon_summary --dry-run --week <test-week-with-shifts>
```

If you want to send a *real* Friday nudge before the next Friday rolls around (e.g., to test against actual techs), drop the `--dry-run` flag. Otherwise wait for the live cron fire.

## 6. Verify the live cron fires

The next real fires (Europe/London):
- **Fri 10:00** — `fri_nudge` DMs all 3 techs
- **Sun 18:00** — `sun_chase` DMs anyone who hasn't submitted
- **Mon 00:05** — `mon_sync` writes to Google Calendar
- **Mon 08:00** — `mon_summary` posts to #general

Watch live:
```bash
journalctl --user -u shift-bot -f
```

## 7. Rollback / pause

```bash
# Pause:
systemctl --user stop shift-bot

# Restart after fixing config:
systemctl --user restart shift-bot

# Disable on boot:
systemctl --user disable shift-bot
```

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `invalid_auth` on Slack call | Bot token missing/wrong | Check `~/config/.env` has `SHIFT_BOT_TOKEN` |
| Service exits immediately | App token missing | Check `SHIFT_BOT_APP_TOKEN` is set |
| Slash command "dispatch_failed" | Not installed in workspace, or Socket Mode off | Re-check Slack app config |
| Telegram alert "auth failure" | `GOOGLE_REFRESH_TOKEN` expired | Re-OAuth, update env, restart service |
| No nudge fires Friday | Wrong tz on host | Confirm `Environment=TZ=Europe/London` in unit; `systemctl --user show shift-bot -p Environment` |
