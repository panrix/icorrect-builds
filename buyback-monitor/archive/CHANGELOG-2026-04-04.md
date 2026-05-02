# Buyback Monitor — Change Log 2026-04-04

## Change: Moved from OpenClaw Agent Cron to System Crontab

### What changed

The daily buy box pipeline was previously triggered as an **OpenClaw cron job** that ran through Jarvis (Opus). This meant every daily run spun up a full Opus LLM session (with context loading, bootstrap hooks, memory injection) just to execute two scripts and read the output. The session could stay open for up to 2.5 hours.

It now runs as a **plain system crontab entry** using `run-daily.sh` — a bash wrapper that runs the same scripts directly and sends a Telegram summary to Ricky. No LLM involved.

### Why

- The buyback pipeline is deterministic scripts (scraper + monitor + bump). No intelligence needed.
- An Opus session open for 2.5 hours burns significant tokens for zero added value.
- The scripts already generate their own summary files — Jarvis was just reading them and forwarding.
- This was identified as a major token drain in the cron audit (2026-04-04).

### What runs

`run-daily.sh` at 05:00 UTC daily:
1. Runs `sell_price_scraper_v7.js` (fetches competitor sell prices, ~2 min)
2. Runs `buy_box_monitor.py --no-resume --auto-bump` (checks buy box positions, auto-bumps losers, ~90 min)
3. Reads the generated summary and bump log
4. Sends a concise Telegram report to Ricky via `telegram-alert.py`

### Data location change

Output was previously saved to Jarvis's workspace:
```
~/.openclaw/agents/main/workspace/data/buyback/
```

Canonical location is now:
```
/home/ricky/builds/buyback-monitor/data/buyback/
```

A **symlink** from the old path to the new one ensures all existing scripts (buy_box_monitor.py, generate_sell_lookup.py, build_cost_matrix.py, etc.) continue working without code changes. The sell price JSONs remain at `/home/ricky/builds/buyback-monitor/data/`.

### Files changed

| File | Change |
|------|--------|
| `run-daily.sh` | **NEW** — bash wrapper replacing OpenClaw cron |
| `data/buyback/` | **NEW** — canonical data location (symlinked from old path) |
| OpenClaw cron `buyback-buy-box-monitor` | **DISABLED** |

### Note on scraper version

The old OpenClaw cron payload referenced `sell_price_scraper_v6.js` which no longer exists. The current version is `sell_price_scraper_v7.js`. The `run-weekly.sh` script already uses v7 correctly.

### Logs

- Pipeline logs: `/home/ricky/logs/buyback/buy-box-YYYY-MM-DD.log`
- Cron wrapper log: `/home/ricky/logs/buyback/cron.log`
