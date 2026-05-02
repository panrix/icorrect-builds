# Cron & Scheduled Task Audit

**Created:** 2026-04-04
**Status:** Audit complete, actions pending
**Owner:** Code + Ricky

---

## Summary

There are two types of scheduled tasks running on the VPS:

1. **System crontab** — runs scripts directly, no LLM involved, zero token cost
2. **OpenClaw cron jobs** — triggers an agent session, LLM processes the task, burns tokens

The problem: several tasks that are just "run a script and report the result" are going through OpenClaw agents, paying full LLM session costs (context loading + response generation) for work that doesn't need intelligence.

---

## OpenClaw Cron Jobs (Token Cost)

### 1. buyback-buy-box-monitor
- **Schedule:** Daily 05:00 UTC
- **Agent:** main (Jarvis) — **OPUS**
- **Status:** Error
- **What it does:** Tells Jarvis to run `sell_price_scraper_v6.js` then `buy_box_monitor.py --no-resume --auto-bump`, wait ~90 min, then read the summary and send Ricky a Telegram report
- **Timeout:** 9000s (2.5 hours)
- **Token cost:** HIGH — Opus session open for up to 2.5 hours, processing script output, generating a report
- **Verdict: SHOULD NOT BE AN AGENT TASK.** The scripts are standalone. A bash wrapper can run them sequentially and send a Telegram summary via `telegram-alert.py`. No LLM needed.
- **Note:** The scraper referenced is v6 but the file on disk is `sell_price_scraper_v7.js` — the cron payload is outdated.

### 2. BM Board Housekeeping
- **Schedule:** Daily 23:00 UTC
- **Agent:** backmarket (Hugo) — **SONNET**
- **Status:** OK
- **What it does:** Tells Hugo to run a Python housekeeping script, then report the summary
- **Token cost:** MEDIUM — Sonnet session for a script runner
- **Verdict: DUPLICATE + BROKEN.** The payload references `bm_board_housekeeping.py` at a path that doesn't exist. Meanwhile, the **crontab already runs the JS version** (`board-housekeeping.js`) at 07:30 UTC Mon-Fri. This OpenClaw cron should be **removed** — it's doing nothing useful (or failing silently).

### 3. Morning Inbox Triage
- **Schedule:** Daily 07:00 UTC
- **Agent:** alex-cs (Alex) — **SONNET**
- **Status:** Error
- **What it does:** Alex fetches open Intercom conversations, filters for actionable ones, drafts replies, posts to Telegram for Ferrari's review
- **Timeout:** 600s (10 min)
- **Token cost:** MEDIUM — Sonnet session, but doing genuine LLM work (reading conversations, drafting replies)
- **Verdict: LEGITIMATE AGENT TASK.** This actually needs intelligence — reading conversations, judging which need replies, drafting responses in the right tone. Should stay as an agent task. Fix the error status.

### 4. Daily 7am Bali date check
- **Schedule:** Daily 23:00 UTC
- **Agent:** main (Jarvis) — **OPUS**
- **Status:** OK
- **What it does:** Sends Jarvis a "Good morning! Today is {date}" message
- **Token cost:** MEDIUM — full Opus session for a greeting
- **Verdict: QUESTIONABLE.** If this is meant to trigger Jarvis's morning routine/briefing, it should be a structured prompt with clear tasks. If it's literally just a date confirmation, it's wasting Opus tokens. Needs Ricky's input on what this is supposed to achieve.

### 5. session-keepalive
- **Schedule:** Every 5 min (DISABLED 2026-04-04)
- **Agent:** main (Jarvis) — **OPUS**
- **Verdict:** Already disabled. Was the single biggest token drain.

---

## System Crontab (No Token Cost)

These run scripts directly — no LLM involved. Zero token usage. This is the pattern everything should follow unless the task genuinely needs intelligence.

| Schedule | Script | What It Does |
|----------|--------|-------------|
| Every 15 min | `health-check.sh` | Checks gateway health, alerts via Telegram |
| Daily 04:00 UTC | `find` (2 entries) | Log rotation — compress after 2 days, delete after 14 |
| Every 15 min | `chrome-reaper.sh` | Kills leaked Chrome/Whisper processes |
| Wed 21:00 UTC | `xero_refresh.sh` | Xero token keep-alive |
| Mon 06:00 UTC | `update_usage_columns.py` | Parts usage update on Monday board |
| Mon 05:00 UTC | `run-weekly.sh` | BM buyback weekly pipeline |
| Daily 06:00 UTC | `sent-orders.js --live` | BM sent-orders detection |
| Hourly 07-17 UTC (weekdays) | `sale-detection.js` | BM sale detection |
| 08/12/16 UTC (weekends) | `sale-detection.js` | BM sale detection (weekend) |
| 07:00 + 12:00 UTC (weekdays) | `dispatch.js` | Royal Mail dispatch labels |
| 07:30 UTC Mon-Fri | `board-housekeeping.js` | BM board housekeeping (**also in OpenClaw — duplicate**) |
| Every 15 min | `sync-token.sh` | Claude OAuth token sync to OpenClaw |

---

## Recommended Actions

### Immediate (save tokens now)

| Action | Impact | Effort |
|--------|--------|--------|
| **Remove** BM Board Housekeeping OpenClaw cron | Eliminates duplicate + broken job | 1 min |
| **Disable** buyback-buy-box-monitor OpenClaw cron | Stops Opus token drain | 1 min |
| **Rebuild** buyback monitor as a crontab bash wrapper | Same functionality, zero tokens | 30 min |
| **Review** Daily 7am Bali date check with Ricky | May be unnecessary | 5 min |

### Soon (fix what's broken)

| Action | Impact | Effort |
|--------|--------|--------|
| **Fix** Morning Inbox Triage error | Alex should be doing this daily | Debug session |
| **Update** buyback cron payload (v6 → v7 scraper reference) | Outdated script reference | Part of rebuild |

### Pattern for new scripts

Any new automation should follow the crontab pattern:
1. Script runs directly via crontab (no agent)
2. Script handles its own logic (API calls, data processing)
3. Script sends results via `telegram-alert.py` or direct Telegram API call
4. Agent only involved if the task needs LLM judgement (drafting replies, analysing unstructured data, making decisions)

**Rule of thumb:** If you can write the task as a bash/python/node script with deterministic logic, it doesn't need an agent.

---

## Token Impact Estimate

| Item | Daily Token Cost (approx) | After Fix |
|------|--------------------------|-----------|
| Session keepalive (288x Opus) | ~2-4M tokens | **0** (disabled) |
| Elek heartbeat (288x Sonnet) | ~500K-1M tokens | **0** (disabled) |
| Buyback monitor (1x Opus, 2.5hr session) | ~200-500K tokens | **0** (move to crontab) |
| BM Housekeeping (1x Sonnet, duplicate) | ~50-100K tokens | **0** (remove) |
| Daily date check (1x Opus) | ~50-100K tokens | **TBD** (review with Ricky) |
| Morning Inbox Triage (1x Sonnet) | ~100-200K tokens | Keep (legitimate) |

**Estimated daily saving: 3-6M tokens** — mostly from the keepalive and heartbeat already disabled today.
