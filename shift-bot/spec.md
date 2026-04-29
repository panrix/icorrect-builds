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

## Architecture

Single Node.js service. Slack Bolt in Socket Mode (no public endpoint). `googleapis` for Calendar. `better-sqlite3` for storage. `node-cron` for the four scheduled jobs. Runs as a systemd user service.

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
    week_start  DATE     NOT NULL,    -- Monday of the week being worked
    tech_id     TEXT     NOT NULL,    -- Slack user ID
    day         TEXT     NOT NULL,    -- 'mon'..'sun'
    start_time  TEXT,                 -- 'HH:MM' in London local, NULL if off
    end_time    TEXT,                 -- 'HH:MM' in London local, NULL if off
    is_off      INTEGER  NOT NULL,    -- 0 or 1
    gcal_event_id  TEXT,              -- set after Phase 4 sync
    submitted_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (week_start, tech_id, day)
);
```

A "submission" is the 7 rows for one (week_start, tech_id). Re-submission for the same (week_start, tech_id) is rejected — modal returns an error: *"You've already submitted shifts for the week of <date>. Contact Ricky if you need to change them."*

## Flow

| Time (Europe/London) | Component | Action |
|---|---|---|
| Fri 10:00 | `slack/nudge.js` | DM each tech with a "Submit next week's shifts" button → opens modal |
| Anytime Fri–Sun 23:59 | `slack/command.js` | `/shift` opens the same modal |
| On modal submit | `slack/modal.js` | Validate → insert 7 rows → reply ephemerally "✅ Submitted" |
| Sun 18:00 | `slack/nudge.js` | DM techs missing from next week's submissions |
| Sun 23:59 | (passive) | Window closes — modal opens after this point reject with "Submission window closed" |
| Mon 00:05 | `calendar/sync.js` | For each shift in this week's submissions, create one GCal event, store event ID |
| Mon 08:00 | `summary/post.js` | Format rota table, post to `#general` with calendar link |

## Modal Design

Slack modal with 7 sections (Mon–Sun). Each section:
- A toggle: **Working / Off**
- If Working: two `timepicker` blocks — Start and End

Submit handler:
- Reject if any day has only one of start/end set.
- Reject if start >= end on any day.
- Reject if (week_start, tech_id) already exists.
- Reject if `now > Sunday 23:59` (window closed).

## Calendar Event Format

- **Title:** `Misha (9–6)` — short name + dash + start–end as h-only when on the hour, else `9:30`.
- **Start/end:** Absolute London times converted to RFC3339 with the `Europe/London` timezone.
- **Color:** `colorId` per tech from `config.json`.
- **Calendar:** the single shared calendar above.
- One event per (tech, working day). Off days create no event.

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
| Slack API down at Friday 10:00 | Cron retries every 15 min for up to 2h, then logs and gives up |
| Google Calendar API call fails | Log to journal, fire `telegram-alert.py`, **do not block** Monday summary |
| Tech submits invalid times | Modal returns inline error block — no DB write |
| Duplicate submission attempt | Modal rejects with friendly message naming the week |
| systemd service crashes | `Restart=on-failure`, `RestartSec=10s` |

## Security

- All credentials read from `~/config/.env` at boot. Nothing in source.
- SQLite file at `~/data/shift-bot/shifts.db` (mode 0600).
- No web endpoint — Socket Mode only. Nothing to firewall.
- Service runs as `ricky` user, not root.

## Verification (Phase 6)

1. `systemctl --user status shift-bot` → active, no recent restarts.
2. Manually invoke `/shift` from Ricky's Slack — modal opens, can submit a dummy week.
3. Run nudge job manually (`node scripts/nudge.js fri`) — Ricky receives DM as a tech.
4. Run sync job manually for the test week — events appear on the shared calendar.
5. Run summary job manually — message appears in `#general` (or test channel for dry run).
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
- If techs join/leave, `config.json` needs a manual update + restart. Acceptable for ~3 people.
- No timezone-of-tech support: all shifts are London local. (All three techs work London.)
