# Shift Bot — Spec

**Created:** 2026-04-29
**Owner:** Code (build) + Ricky
**Status:** Awaiting approval to start Phase 1

## Problem

Techs submit shift hours to Ricky in Slack DMs. The rest of the team has no visibility on who's working when. Ricky also has to chase laggards manually.

## Goal

A self-serve loop:
1. Techs submit next week's hours via a Slack modal.
2. Submitted hours land on a shared Google Calendar.
3. The whole team sees the week's rota in `#general` every Monday at 8am London.

No agent, no LLM, no judgement calls. Pure script-and-cron — fits the "scripts for truth, agents for judgement" principle in `agent-rebuild/system-rethink.md`.

## Scope

### In
- `/shift` Slack slash command opens a modal (7 day rows: start, end, OFF toggle).
- Modal validates and writes to SQLite. Re-submission for the same week is rejected.
- Friday 10:00 London — DM all techs with a "Submit shifts" button.
- Sunday 18:00 London — DM techs who haven't submitted next week's shifts.
- Monday 00:05 London — write the week's shifts to Google Calendar, one event per shift, colour-coded per tech.
- Monday 08:00 London — post the week's rota to `#general` as a formatted code-block table.

### Out (YAGNI)
- Edits / corrections (Ricky has told techs: once submitted, no changes).
- Hours totals, payroll export, manager approval flow.
- Location, breaks, free-text notes per shift.
- Backfill UI for past weeks.
- Per-tech subscribable calendars (one shared calendar covers it).

## Users

| Tech | Slack ID | GCal colour |
|---|---|---|
| Mykhailo (Misha) | `U07GVP3EP25` | 1 (lavender) |
| Andres Egas | `U05SR56SK1U` | 2 (sage) |
| Safan Patel | `U02KY1GTC10` | 3 (grape) |

## External Resources

| Resource | Identifier |
|---|---|
| Shared Google Calendar | `c_0024d477e3218afdf4d230f4a8b0138340a711e73175c89da186e5a4a474f3f3@group.calendar.google.com` |
| Summary post channel (`#general`) | `C024H7518J3` |
| Slack bot token | `SLACK_BOT_TOKEN` (env) |
| Slack app token (Socket Mode) | `SLACK_APP_TOKEN` (env) |
| Google OAuth | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REFRESH_TOKEN` (env) |
| Failure alerts | `~/builds/scripts/telegram-alert.py` |

**Note:** Socket Mode only — `SLACK_SIGNING_SECRET` is **not** used and must not be configured.

## Architecture

Single Node.js service. Slack Bolt in Socket Mode (no public endpoint). `googleapis` for Calendar. `better-sqlite3` for storage. `node-cron` for the four scheduled jobs. Runs as a systemd user service.

**Timezone contract (load-bearing — every component must follow):**
- All `node-cron` schedules registered with `{ timezone: 'Europe/London' }`.
- systemd unit sets `Environment=TZ=Europe/London`.
- All date arithmetic uses an explicit `Europe/London` zone (via `luxon` or `date-fns-tz`); never the host's local time, never naive `Date`.
- DST: the four fire times (Fri 10:00, Sun 18:00, Mon 00:05, Mon 08:00) all sit outside the 01:00–02:00 BST gap, so spring-forward / fall-back don't double-fire or skip.

```
shift-bot.service
├── slack/
│   ├── command.js       # /shift handler — opens modal
│   ├── modal.js         # modal view JSON + submit handler
│   └── nudge.js         # Friday + Sunday DMs
├── calendar/
│   └── sync.js          # writes shifts to Google Calendar
├── summary/
│   └── post.js          # Monday rota post to #general
├── db/
│   ├── schema.sql       # shifts table
│   └── client.js        # better-sqlite3 wrapper
├── lib/
│   ├── week.js          # week-start/week-end helpers (London tz)
│   └── alert.js         # telegram-alert.py shim
├── config.json          # techs, channel, calendar id
├── index.js             # boots Bolt + cron jobs
└── package.json
```

## Data Model

```sql
CREATE TABLE shifts (
    week_start     DATE     NOT NULL,    -- Monday of the week being worked (London local date)
    tech_id        TEXT     NOT NULL,    -- Slack user ID
    tech_short     TEXT     NOT NULL,    -- snapshot of short name at submission time
    color_id       TEXT     NOT NULL,    -- snapshot of GCal colorId at submission time (string)
    day            TEXT     NOT NULL,    -- 'mon'..'sun'
    start_time     TEXT,                 -- 'HH:MM' London local, NULL if off
    end_time       TEXT,                 -- 'HH:MM' London local, NULL if off
    is_off         INTEGER  NOT NULL,    -- 0 or 1
    gcal_event_id  TEXT,                 -- set after Phase 4 sync
    submitted_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (week_start, tech_id, day)
);

CREATE TABLE job_runs (
    job_name    TEXT     NOT NULL,       -- 'fri_nudge' | 'sun_chase' | 'mon_sync' | 'mon_summary'
    week_start  DATE     NOT NULL,       -- the week this run was for
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (job_name, week_start)
);
```

A "submission" is the 7 rows for one (week_start, tech_id). Re-submission is rejected — modal returns: *"You've already submitted shifts for the week of <date>. Contact Ricky if you need to change them."*

**Snapshot rule:** `tech_short` and `color_id` are written at submission time, not looked up from `config.json` at sync/summary time. This means a tech who leaves mid-week still gets correctly rendered in the calendar and summary for shifts they already submitted.

**Week targeting (load-bearing):**
- A submission/nudge sent during the open window (Fri 10:00 → Mon 00:00 London) targets `week_start = next Monday` (the upcoming Monday).
- The Mon 00:05 sync and Mon 08:00 summary target `week_start = current Monday` (today's date in London).
- All `week_start` values are computed in `Europe/London`, never UTC.

## Flow

| Time (Europe/London) | Component | Action |
|---|---|---|
| Fri 10:00 | `slack/nudge.js` | DM each tech with a "Submit next week's shifts" button → opens modal |
| Open window | `slack/command.js` | `/shift` opens modal during `[Fri 10:00, Mon 00:00)` London. Outside window: ephemeral reply "Submission window closed", no modal. |
| On modal submit | `slack/modal.js` | Re-check window, validate, insert 7 rows transactionally, reply ephemerally "✅ Submitted" |
| Sun 18:00 | `slack/nudge.js` | DM techs missing from next week's submissions |
| Mon 00:00 | (passive) | Window closes — `view_submission` handler also rejects past this point |
| Mon 00:05 | `calendar/sync.js` | For each shift in this week's submissions, create one GCal event, store event ID. Idempotent — see Calendar Sync section. |
| Mon 08:00 | `summary/post.js` | Format rota table, post to `#general` with calendar link |

## Modal Design

Slack modal with 7 sections (Mon–Sun). Each section:
- A toggle: **Working / Off**
- If Working: two `timepicker` blocks — Start and End

**Cutoff is enforced at TWO points** to close the "modal opened at 23:58, submitted at 00:01" race:
1. `app_mention` / slash-command handler: if `now < Fri 10:00` or `now >= Mon 00:00` London → reply ephemerally "Submission window closed", do **not** open the modal.
2. `view_submission` handler: re-check the same condition before any DB write. If closed, return Slack `response_action: errors` and discard.

Submit handler validation (in order):
- Reject if `now` is outside the open window (cutoff re-check).
- Reject if any day marked **Working** has `start_time` or `end_time` missing — both required.
- Reject if any day marked **Working** has `start_time >= end_time`.
- Reject if (week_start, tech_id) already exists in `shifts` table.
- Insert all 7 rows in a single SQLite transaction (all-or-nothing).

## Calendar Event Format

- **Title:** `Misha (9–6)` — short name + dash + start–end as h-only when on the hour, else `9:30`.
- **Start/end:** Absolute London times sent as `{ dateTime: '...', timeZone: 'Europe/London' }` (Calendar API resolves DST correctly).
- **Color:** `colorId` is a **string** (`"1"`, `"2"`, `"3"`) per [Calendar Colors API](https://developers.google.com/calendar/api/v3/reference/colors), read from the `color_id` snapshot in the `shifts` row.
- **Calendar:** the single shared calendar above.
- **Idempotency key:** every event sets `extendedProperties.private = { shiftKey: '<week_start>:<tech_id>:<day>' }`. Sync uses this to detect existing events on retry.
- One event per (tech, working day). Off days create no event.

### Sync algorithm (idempotent)

```
for each row where week_start = this_monday and is_off = 0:
    if row.gcal_event_id is not null:
        continue  # already synced
    list events with extendedProperties.private.shiftKey = '<row.shiftKey>'
    if found:
        update row.gcal_event_id = found.id   # crash recovery
        continue
    create event with shiftKey, capture event.id
    update row.gcal_event_id = event.id       # write-back BEFORE returning from try block
```

This survives: cron retry, manual re-run, mid-flight crash between `events.insert` and DB write-back.

## Monday Summary Format

Posted to `#general` as a fenced code block so columns align on desktop:

```
🗓️ Shifts — week of Mon 5 May

           Mon    Tue    Wed    Thu    Fri    Sat    Sun
Misha     9–6    9–6    off    9–6    9–6    off    off
Andres    10–7   10–7   10–7   off    10–7   10–7   off
Safan     off    9–6    9–6    9–6    9–6    9–6    off

📅 Full calendar: <link>
```

If a tech didn't submit for the week, their row is **omitted entirely** from the summary (no name-and-shame, per Ricky 2026-04-29). Ricky still sees who's missing via the Sunday 18:00 chase logs and the DB.

If Phase 4 sync failed, append a single line: `⚠️ Calendar sync failed — see logs.`

## Failure Modes

| Failure | Behaviour |
|---|---|
| Slack API transient error at Fri 10:00 | Retry every 15 min for up to 2h, then log + Telegram alert |
| GCal API transient error (5xx, rate limit) | Exponential backoff up to 5 attempts, then log + Telegram alert. Mon 08:00 summary still posts with "⚠️ calendar sync failed" line. |
| GCal auth failure (`invalid_grant`, HTTP 401) | **Do not retry.** Mark `mon_sync` failed, fire immediate Telegram alert ("Refresh `GOOGLE_REFRESH_TOKEN`"), suppress until credentials rotated and service restarted. |
| Tech submits invalid times | Modal returns inline error block — no DB write |
| Duplicate submission attempt | Modal rejects with friendly message naming the week |
| systemd service crashes | `Restart=on-failure`, `RestartSec=10s` |
| Service was down at a fire time (missed cron) | On startup, for each scheduled job in this week with no `job_runs` row and whose fire time has passed, run it once immediately. Catches "VPS rebooted Monday morning, missed the 8am post." |

## Security

- All credentials read from `~/config/.env` at boot. Nothing in source.
- SQLite file at `~/data/shift-bot/shifts.db` (mode 0600).
- No web endpoint — Socket Mode only. Nothing to firewall.
- Service runs as `ricky` user, not root.

### Logging policy
Logs go to `journalctl --user -u shift-bot`. Allowed log fields:
- Job name, `week_start`, `tech_id` (Slack ID, not real name), event type, sanitized error code/HTTP status.

**Never log:**
- Env variable values, OAuth tokens, Slack tokens.
- Raw Slack payloads or request bodies.
- Tech real names in error logs (Slack ID is enough for Ricky to look up).
- Full GCal event JSON (just the event ID).

## Verification (Phase 6)

Phase 1 adds thin CLI wrappers under `scripts/`:
- `scripts/run-job.js <fri_nudge|sun_chase|mon_sync|mon_summary> [--week YYYY-MM-DD] [--dry-run]`

1. `systemctl --user status shift-bot` → active, no recent restarts.
2. Manually invoke `/shift` from Ricky's Slack — modal opens, can submit a dummy week.
3. `node scripts/run-job.js fri_nudge --dry-run` — shows the DMs that would be sent.
4. `node scripts/run-job.js mon_sync --week <test-week>` — events appear on the shared calendar.
5. `node scripts/run-job.js mon_summary --week <test-week>` — message in test channel (override channel via env for dry run).
6. Watch the actual Friday 10:00 nudge fire on the next real Friday.
7. Output COMPROMISES section per CLAUDE.md.

## Phases

| # | Phase | Deliverable |
|---|---|---|
| 1 | Scaffold | Project layout, deps installed, schema migrated, config.json with real IDs, systemd unit (disabled) |
| 2 | `/shift` + modal | Slash command opens modal, submit writes 7 rows to SQLite, validation works, duplicate rejection works |
| 3 | Nudge + chase | Friday 10:00 DM and Sunday 18:00 DM with "Submit" button |
| 4 | Calendar sync | Monday 00:05 job writes events, stores event IDs, alerts on failure |
| 5 | Monday summary | 08:00 job posts formatted rota to `#general` |
| 6 | Slack app config + deploy + verify | Slack manifest applied, service enabled, end-to-end test, COMPROMISES doc |

Each phase commits independently per CLAUDE.md build workflow.

## Open / Deferred

- Slack app needs to be created or updated in the Slack admin — Phase 6 walks through this.
- If techs join/leave, `config.json` needs a manual update + restart. Acceptable for ~3 people. Already-submitted shifts continue to render correctly because of the snapshot rule.
- No timezone-of-tech support: all shifts are London local. (All three techs work London.)
- **Manual correction procedure** (Ricky only, no user-facing path):
  1. `sqlite3 ~/data/shift-bot/shifts.db "SELECT * FROM shifts WHERE week_start='YYYY-MM-DD' AND tech_id='U…';"` to inspect.
  2. Delete rows + corresponding GCal events (use the stored `gcal_event_id`).
  3. Tech can then re-submit `/shift` for that week.
