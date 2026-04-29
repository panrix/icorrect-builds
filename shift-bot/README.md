# shift-bot

Slack bot for tech shift submissions → Google Calendar + Monday rota in `#general`.

Spec: [`spec.md`](./spec.md)

## Layout
```
shift-bot/
├── slack/      # Phase 2: /shift command + modal; Phase 3: nudge DMs
├── calendar/   # Phase 4: Google Calendar sync
├── summary/    # Phase 5: Monday 8am rota post
├── db/         # SQLite schema + client
├── lib/        # week math, alerts, logging
├── scripts/    # run-job.js CLI for manual runs / dry runs
├── systemd/    # shift-bot.service unit
├── config.json # techs, channel, calendar id, schedule, window
└── index.js    # boots Bolt + cron jobs
```

## Setup

```bash
cd ~/builds/shift-bot
npm install
node db/migrate.js
```

DB lives at `~/data/shift-bot/shifts.db`. Credentials read from `~/config/.env`.

## Service

Install (one-time):
```bash
mkdir -p ~/.config/systemd/user
cp systemd/shift-bot.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now shift-bot
journalctl --user -u shift-bot -f
```

(Phase 6 walks through this with the Slack app config.)

## Manual job runs

```bash
node scripts/run-job.js fri_nudge --dry-run
node scripts/run-job.js mon_sync --week 2026-05-04
node scripts/run-job.js mon_summary --week 2026-05-04
```

## Phases

| # | Status | Phase |
|---|---|---|
| 1 | ✅ done | Scaffold |
| 2 | ✅ done | `/shift` + modal |
| 3 | ✅ done | Nudge + chase |
| 4 | ✅ done | Calendar sync |
| 5 | ✅ done | Monday summary |
| 6 | 🔜 ready | Slack app config + deploy + verify — see [`DEPLOY.md`](./DEPLOY.md) |

End-of-build honesty pass: [`COMPROMISES.md`](./COMPROMISES.md).
