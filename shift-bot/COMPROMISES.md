# shift-bot — COMPROMISES

End-of-build honesty pass per CLAUDE.md.

## What was simplified vs the original plan

- **Sunday cutoff is at Mon 00:00, not Sun 23:59.** The spec described "Sun 23:59" as the deadline, but the implementation uses a half-open `[Fri 10:00, Mon 00:00)` window — strictly equivalent in practice (no second-precision difference) but worth knowing if you read the cron config.
- **Slack confirmation DM is best-effort.** After a successful submit, the bot tries to DM the tech a `:white_check_mark:` confirmation. If that DM fails (rate limit, transient), the submission is *still saved* — we log the failure but don't surface it to the user. The modal's "OK" close is the authoritative signal.
- **Catch-up on missed cron fires is opportunistic, not transactional.** The spec mentioned a startup catch-up for missed cron fires using `job_runs`. The schema supports it (the table exists and is written on completion), but the boot-time replay logic is *not* wired up in this build — left as a Phase 7 follow-up. **Practical impact:** if the VPS is offline at Friday 10:00, the nudge will not auto-replay when the service comes back. Consequence is bounded: techs can still run `/shift` themselves; you'd just have to nag manually.

## What was skipped

- **Boot-time catch-up replay** (above) — easy to add later, not load-bearing for the happy path.
- **Per-tech timezone support** — all shifts assumed London. All three techs work London, so this is fine indefinitely unless you hire remote.
- **Edit / correction UI** — by design, per your "no edits" rule. Manual SQL + GCal delete is documented in `spec.md`.
- **Hours totals / payroll export** — out of scope.
- **Backfill UI for past weeks** — manual SQL only.
- **Calendar event delete on tech removal** — if a tech leaves mid-week, their submitted shifts stay on the calendar. Manual cleanup if needed.

## What is fragile or temporary

- **Hardcoded tech roster in `config.json`.** Adding/removing a tech requires editing the file and `systemctl --user restart shift-bot`. Acceptable for ~3 people.
- **Single shared Google OAuth refresh token in `~/config/.env`.** If revoked or expired, calendar sync fails; the bot fires a Telegram alert but the DB keeps accepting submissions. Phase 6 step 8 documents the rotation procedure.
- **Telegram alert script lives outside this project** (`/home/ricky/mission-control-v2/scripts/utils/telegram-alert.py`). If that script moves or breaks, alerts go silent. If you ever delete `mission-control-v2`, update `config.json` → `alert_script`.
- **The Slack manifest assumes a brand-new app called "Shift Bot" with its own tokens.** If you instead reuse the existing Jarvis app token, the slash command will appear as Jarvis to users — works fine but blurs identity. The `DEPLOY.md` walkthrough recommends a dedicated app.
- **No automated tests for the OAuth refresh path.** Phase 4 verified read access to the calendar with a `calendars.get` call, but never actually inserted+deleted a real event end-to-end (to avoid cluttering your live calendar). Phase 6 Step 5 will be the first real write.

## What needs manual verification

These are the items in `DEPLOY.md` that depend on you. None are automatable from the agent side:

1. **Slack app creation** — paste manifest, install, copy bot + app tokens to `~/config/.env`.
2. **Env-var rename** — sed step swaps `SLACK_BOT_TOKEN` → `SHIFT_BOT_TOKEN`. (Skip if you'd rather use the generic names; we recommended dedicated to avoid confusion with Jarvis.)
3. **systemd enable + start** — confirm `journalctl` shows the four "cron_registered" lines and no errors.
4. **Live `/shift` test** — run the slash command yourself, submit a dummy week, confirm it lands in `~/data/shift-bot/shifts.db`.
5. **Live calendar sync** — `node scripts/run-job.js mon_sync --week <test-week>` should produce real events on the iCorrect Tech Shifts calendar. Inspect them, then either keep or `events.delete` them.
6. **Live summary post** — first one will land in #general at 8am London on the first real Monday after deploy. Or use `--dry-run` first to preview.

## Open follow-ups (if you want a Phase 7)

- Boot-time catch-up replay (per above).
- A `/shift status` slash command that shows you who's submitted for the upcoming week (Ricky-only).
- A `/shift cancel` admin command that deletes a tech's submission + matching GCal events (currently a manual SQL step).
- Slack home-tab UI showing the upcoming rota — would replace the need for the Monday post for anyone who pins the app.
