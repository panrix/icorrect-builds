# Cron Job Audit — VPS 46.225.53.159

**Audited:** 2026-02-26 ~05:30 UTC
**Auditor:** Claude Code
**Total cron entries:** 13 (11 active, 1 disabled, 1 broken)
**systemd timers:** 1 (launchpadlib cache clean — system default, irrelevant)

---

## Summary Table

| # | Schedule | Script | Verdict | Issue? |
|---|----------|--------|---------|--------|
| 1 | */15 * * * * | v1 health-check.sh | REPLACE | Duplicate of #4, hardcoded bot token |
| 2 | 0 4 * * * | Log rotation (gzip) | KEEP | Works, useful |
| 3 | 0 4 * * * | Log rotation (delete) | KEEP | Works, useful |
| 4 | */15 * * * * | v2 health-check.py | REPLACE | Rebuild for v3 schema |
| 5 | */5 * * * * | reconciliation.py | REPLACE | Rebuild for v3 schema |
| 6 | 0 22 * * * | nightly-janitor.py | REPLACE | Rebuild for v3 schema |
| 7 | 30 22 * * * | rebuild-memory-md.py | REMOVE | Disabled in crontab, dead code |
| 8 | 0 1 * * * | daily-briefing.py | REPLACE | Rebuild for v3 schema |
| 9 | 0 22 * * 0 | weekly-summary.py | REPLACE | Rebuild for v3 schema |
| 10 | 0 23 * * * | supabase-backup.py | REPLACE | Rebuild for v3 schema |
| 11 | */5 * * * * | sync-memory-to-supabase.py | REPLACE | Core concept good but needs v3 memory model |
| 12 | */15 * * * * | chrome-reaper.sh | REMOVE | Broken — script path does not exist |
| 13 | */5 * * * * | qa-retry.py | REMOVE | Never fires, QA sub-agents not used |

---

## Detailed Audit

### 1. v1 Health Check (REPLACE)

- **Cron:** `*/15 * * * * /home/ricky/.openclaw/scripts/health-check.sh 2>> /tmp/openclaw/cron-errors.log`
- **Schedule:** Every 15 minutes
- **Script:** `/home/ricky/.openclaw/scripts/health-check.sh`
- **What it does:**
  - Checks if openclaw-gateway systemd service is running
  - Detects unexpected restarts (compares NRestarts counter)
  - Tests network connectivity to Telegram API
  - Warns if memory > 80%
  - Warns if disk > 90%
  - Sends Telegram alerts to Ricky's DM (chat ID 1611042131) with 2-hour cooldown
- **Last run status:** Running, all checks passing. Most recent: `2026-02-26T05:15 OK: All checks passed (mem: 22%, disk: 48%, restarts: 0)`
- **Logs:** `/tmp/openclaw/health-check.log` (137KB, active)
- **Verdict:** REPLACE
- **Reasons:**
  1. **SECURITY: Hardcoded Telegram bot token** directly in the script. Should use env file.
  2. **Duplicate** of v2 health-check.py (#4) which does the same checks plus Supabase, heartbeats, SSL, and stuck items
  3. Logs to `/tmp/openclaw/` which is a volatile location
  4. Alert state files stored in `/tmp/openclaw/` — lost on reboot
  5. v3 should have a single, consolidated health check

### 2. Log Rotation — Compress (KEEP)

- **Cron:** `0 4 * * * find /tmp/openclaw -name '*.log' -mtime +2 ! -name '*.gz' -exec gzip {} \; 2>/dev/null`
- **Schedule:** Daily at 4:00 AM UTC
- **What it does:** Compresses `.log` files in `/tmp/openclaw/` older than 2 days
- **Last run status:** Working. Compressed files visible in `/tmp/openclaw/` (e.g., `openclaw-2026-02-16.log.gz`)
- **Verdict:** KEEP
- **Reason:** Simple, effective, no dependencies on v2 schema. v3 should adopt similar log rotation for `/home/ricky/logs/` too — those logs are growing unbounded.

### 3. Log Rotation — Delete (KEEP)

- **Cron:** `0 4 * * * find /tmp/openclaw -name '*.log.gz' -mtime +14 -delete 2>/dev/null`
- **Schedule:** Daily at 4:00 AM UTC
- **What it does:** Deletes compressed logs older than 14 days
- **Last run status:** Working.
- **Verdict:** KEEP
- **Reason:** Same as #2. Simple cleanup. Extend to cover `/home/ricky/logs/` in v3.

### 4. v2 Health Check (REPLACE)

- **Cron:** `*/15 * * * * cd /home/ricky/mission-control-v2 && /usr/bin/python3 config/cron/health-check.py >> /home/ricky/logs/health/health-check.log 2>&1`
- **Schedule:** Every 15 minutes
- **Script:** `/home/ricky/mission-control-v2/config/cron/health-check.py`
- **What it does:**
  - Checks Supabase connectivity (queries agent_registry)
  - Checks OpenClaw gateway status via systemctl
  - Checks VPS resources (disk, memory, CPU load)
  - Checks agent heartbeat freshness against expected intervals
  - Checks SSL certificate expiry for mc.icorrect.co.uk
  - Checks for stuck work items (locked items past threshold)
  - Alerts Systems Telegram group on warning/error (NOT Ricky's DM — avoids OpenClaw feedback loop)
- **Last run status:** Running with warnings. Most recent: `2026-02-26 05:15 — warning: operations heartbeat stale (2940m > 2880m threshold)`. All other checks OK.
- **Logs:** `/home/ricky/logs/health/health-check.log` (1.2MB, growing)
- **Verdict:** REPLACE
- **Reasons:**
  1. Good design — this is the template for v3 health checks
  2. Queries v2 Supabase tables (agent_registry, agent_heartbeats, work_items) that will change in v3
  3. The heartbeat check relies on `expected_heartbeat_interval_minutes` field which may not exist in v3
  4. Log file growing unbounded (1.2MB already) — needs rotation
  5. Imports shared modules via `sys.path` hacks — v3 should use proper Python packages

### 5. Reconciliation (REPLACE)

- **Cron:** `*/5 * * * * cd /home/ricky/mission-control-v2 && /usr/bin/python3 config/cron/reconciliation.py >> /home/ricky/logs/health/reconciliation.log 2>&1`
- **Schedule:** Every 5 minutes
- **Script:** `/home/ricky/mission-control-v2/config/cron/reconciliation.py`
- **What it does:**
  - Finds work items that exceeded their stuck threshold (5m customer-facing, 15m operational, 60m internal)
  - Finds unread agent_messages older than 15 minutes
  - Alerts Systems group + Ricky (for customer-facing items)
  - Marks alerted messages as read to avoid re-alerting
  - Logs stuck items to agent_activity table
- **Last run status:** Running, consistently finding nothing. Last 30+ runs: `Reconciliation: all clear`
- **Logs:** `/home/ricky/logs/health/reconciliation.log` (1.6MB, growing)
- **Verdict:** REPLACE
- **Reasons:**
  1. Good concept but currently doing nothing — no work items are in active states
  2. Queries v2 tables (work_items, agent_messages) that will change in v3
  3. Running every 5 minutes but finding nothing — high frequency for zero value
  4. Log at 1.6MB and growing with "all clear" entries — needs rotation or quieter logging
  5. Rebuild for v3 schema with smarter frequency (maybe event-driven instead of polling)

### 6. Nightly Janitor (REPLACE)

- **Cron:** `0 22 * * * cd /home/ricky/mission-control-v2 && /usr/bin/python3 scripts/maintenance/nightly-janitor.py >> /home/ricky/logs/maintenance/nightly-janitor.log 2>&1`
- **Schedule:** Daily at 10:00 PM UTC (6:00 AM Bali)
- **Script:** `/home/ricky/mission-control-v2/scripts/maintenance/nightly-janitor.py`
- **What it does:**
  - Deduplicates memory_facts (same agent_id/namespace/key — keeps newest)
  - Archives memory_facts older than 90 days with no reads
  - Flags malformed facts (empty category, whitespace in keys)
  - Checks for orphaned activity records referencing deleted work items
  - Logs report to agent_activity table
- **Last run status:** Running, finding nothing to clean. Last run 2026-02-25: `deduped=0, archived_stale=0, malformed=0, orphaned=0`
- **Logs:** `/home/ricky/logs/maintenance/nightly-janitor.log` (15KB)
- **Verdict:** REPLACE
- **Reasons:**
  1. Good hygiene concept — v3 needs equivalent cleanup
  2. Operates on v2 memory_facts table which may be restructured in v3
  3. Uses `client.py` and `wrapper.py` via sys.path manipulation
  4. Currently finding nothing because the data is clean — but still valuable for long-term maintenance

### 7. Rebuild MEMORY.md (REMOVE)

- **Cron:** `# DISABLED: 30 22 * * * cd /home/ricky/mission-control-v2 && /usr/bin/python3 scripts/maintenance/rebuild-memory-md.py >> /home/ricky/logs/maintenance/rebuild-memory.log 2>&1`
- **Schedule:** DISABLED (was daily at 10:30 PM UTC)
- **Script:** `/home/ricky/mission-control-v2/scripts/maintenance/rebuild-memory-md.py`
- **What it does:**
  - Reads memory_summaries + recent memory_facts from Supabase
  - Generates MEMORY.md files in each agent's workspace
  - Was meant for Phase 8 (agents writing to Supabase natively)
- **Last run status:** Last ran 2026-02-24 at 22:30 (likely manual). Successfully rebuilt MEMORY.md for 6 agents.
- **Logs:** `/home/ricky/logs/maintenance/rebuild-memory.log` (29KB)
- **Verdict:** REMOVE
- **Reasons:**
  1. Already disabled in crontab — confirms it was deferred
  2. Phase 8 never completed — agents write to markdown, not Supabase directly
  3. Concept may be relevant for v3 but needs complete redesign based on new memory model
  4. Occasional manual runs are polluting the log without clear purpose

### 8. Daily Briefing (REPLACE)

- **Cron:** `0 1 * * * cd /home/ricky/mission-control-v2 && /usr/bin/python3 config/cron/daily-briefing.py >> /home/ricky/logs/health/daily-briefing.log 2>&1`
- **Schedule:** Daily at 1:00 AM UTC (9:00 AM Bali)
- **Script:** `/home/ricky/mission-control-v2/config/cron/daily-briefing.py`
- **What it does:**
  - Queries last 24h: work items (created/completed/stuck), agent activity, memory facts, business state changes, unread messages
  - Builds full briefing text and saves to agent_messages (from systems to jarvis)
  - Sends concise Telegram summary to Ricky
- **Last run status:** Running. Last run 2026-02-26 01:00 UTC. Output: 0 work items created, 172 agent actions, 16 memory facts.
- **Logs:** `/home/ricky/logs/health/daily-briefing.log` (31KB)
- **Verdict:** REPLACE
- **Reasons:**
  1. Ricky gets this at 9am Bali — valuable operational cadence to preserve
  2. Queries v2 tables that will change in v3
  3. The briefing content is useful but the data sources will shift
  4. Telegram delivery mechanism is solid — keep the pattern

### 9. Weekly Summary (REPLACE)

- **Cron:** `0 22 * * 0 cd /home/ricky/mission-control-v2 && /usr/bin/python3 config/cron/weekly-summary.py >> /home/ricky/logs/health/weekly-summary.log 2>&1`
- **Schedule:** Sundays at 10:00 PM UTC (6:00 AM Monday Bali)
- **Script:** `/home/ricky/mission-control-v2/config/cron/weekly-summary.py`
- **What it does:**
  - Aggregates 7-day data: work items by assignee, agent activity by agent and action type, memory facts by category and agent, health check uptime percentage
  - Writes to agent_messages and sends Telegram to Ricky
- **Last run status:** Running. Last run 2026-02-22 22:00 UTC. Shows 87.9% health uptime (33 errors out of 503 checks).
- **Logs:** `/home/ricky/logs/health/weekly-summary.log` (9KB)
- **Verdict:** REPLACE
- **Reasons:**
  1. Same as daily briefing — good concept, wrong data sources for v3
  2. The 87.9% uptime number and per-agent breakdowns are genuinely useful
  3. Rebuild against v3 schema

### 10. Supabase Backup (REPLACE)

- **Cron:** `0 23 * * * cd /home/ricky/mission-control-v2 && /usr/bin/python3 scripts/utils/supabase-backup.py >> /home/ricky/logs/maintenance/supabase-backup.log 2>&1`
- **Schedule:** Daily at 11:00 PM UTC (7:00 AM Bali)
- **Script:** `/home/ricky/mission-control-v2/scripts/utils/supabase-backup.py`
- **What it does:**
  - Exports all 9 Supabase tables as JSON via REST API with pagination
  - Saves to `/home/ricky/backups/supabase/YYYY-MM-DD/`
  - Retains 30 days, deletes older backups
  - Alerts Systems group on errors
- **Last run status:** Running perfectly. Last run 2026-02-25 23:00 UTC: 9/9 tables, 3207 rows, 1166 KB. Only 3 days of backups retained (started recently).
- **Logs:** `/home/ricky/logs/maintenance/supabase-backup.log` (25KB)
- **Backup location:** `/home/ricky/backups/supabase/` (3 backups: Feb 23-25)
- **Verdict:** REPLACE
- **Reasons:**
  1. Critical job — must have equivalent in v3
  2. Table list hardcoded as v2 schema (9 tables) — v3 will have different tables
  3. Backup approach is solid (JSON export, 30-day retention, pagination)
  4. Good template to follow: proper error handling, Telegram alerts on failure

### 11. Sync Memory to Supabase (REPLACE)

- **Cron:** `*/5 * * * * cd /home/ricky/mission-control-v2 && /usr/bin/python3 scripts/maintenance/sync-memory-to-supabase.py >> /home/ricky/logs/maintenance/sync-memory.log 2>&1`
- **Schedule:** Every 5 minutes
- **Script:** `/home/ricky/mission-control-v2/scripts/maintenance/sync-memory-to-supabase.py`
- **What it does:**
  - Scans 8 agent workspace `memory/*.md` directories
  - Parses markdown key-value facts with smart filtering (skips log files, system noise, API keys, UUIDs, column IDs)
  - Hash-based change detection to avoid reprocessing unchanged files
  - Upserts facts to Supabase memory_facts table (with archive/reactivate logic)
- **Last run status:** Running. Most recent sync: 3 new customer-service facts on 2026-02-26 04:35. Mostly quiet (0 new facts per run).
- **Logs:** `/home/ricky/logs/maintenance/sync-memory.log` (2.1MB, growing)
- **Hash cache:** `/home/ricky/mission-control-v2/.memory-sync-hashes.json`
- **Verdict:** REPLACE
- **Reasons:**
  1. This is the bridge between agents' natural markdown writing and Supabase — core to the memory system
  2. v3 memory model (per 05-memory-problem.md) may restructure how memory works
  3. Agent directory mapping is hardcoded — v3 may add/remove agents
  4. Smart filtering rules are valuable — port to v3
  5. Log growing fast (2.1MB) — needs rotation
  6. Hash cache approach is good — preserve pattern

### 12. Chrome Reaper (REMOVE)

- **Cron:** `*/15 * * * * /home/ricky/scripts/chrome-reaper.sh`
- **Schedule:** Every 15 minutes
- **Script:** `/home/ricky/scripts/chrome-reaper.sh` — **FILE DOES NOT EXIST**
- **Actual script location:** `/home/ricky/mission-control-v2/config/cron/chrome-reaper.sh`
- **What it does (when it worked):**
  - Kills Chrome/Playwright processes older than 30 minutes
  - Prevents browser-use MCP from hogging CPU
  - Logs kills to `/home/ricky/logs/chrome-reaper.log`
- **Last run status:** **BROKEN since ~Feb 22.** Script path does not exist. Last successful kill: 2026-02-22 16:00 UTC. Cron silently failing (no stderr redirect).
- **Logs:** `/home/ricky/logs/chrome-reaper.log` (490 bytes, stale since Feb 22)
- **Verdict:** REMOVE
- **Reasons:**
  1. **Currently broken** — script path `/home/ricky/scripts/` no longer exists
  2. If browser-use MCP is still in use for v3, recreate with correct path
  3. If browser-use is being replaced (agent-browser is primary per MEMORY.md), this is unnecessary
  4. Even when working, this is a band-aid for a browser-use leak — fix the root cause instead

### 13. QA Retry (REMOVE)

- **Cron:** `*/5 * * * * cd /home/ricky/mission-control-v2 && /usr/bin/python3 scripts/cron/qa-retry.py >> /home/ricky/logs/cron/qa-retry-cron.log 2>&1`
- **Schedule:** Every 5 minutes
- **Script:** `/home/ricky/mission-control-v2/scripts/cron/qa-retry.py`
- **What it does:**
  - Queries work_items in `in_review` status that are stale (>10 minutes)
  - If a QA session isn't already active for that item, spawns one via `openclaw agent` CLI
  - Checks active session count against MAX_CONCURRENT limit
  - Alerts Ricky if an item is stuck >30 minutes in review
- **Last run status:** Running every 5 minutes, finding NOTHING. Every single run: `{"checked": 0, "spawned": 0}`. The qa-retry.log is 901KB of empty results. qa-retry-cron.log is 152KB of the same.
- **Logs:** `/home/ricky/logs/cron/qa-retry.log` (901KB), `/home/ricky/logs/cron/qa-retry-cron.log` (152KB)
- **Verdict:** REMOVE
- **Reasons:**
  1. **QA sub-agents (qa-plan, qa-code, qa-data) are defined but never used** — no work items ever enter `in_review` status
  2. Running 288 times/day with zero results — pure waste
  3. Generates ~1MB/day of empty log entries
  4. If v3 implements a QA pipeline, this should be event-driven (webhook trigger), not polling every 5 minutes
  5. The v2 work_items status workflow (draft -> in_progress -> in_review -> complete) was never fully operationalized

---

## Issues Found

### SECURITY

1. **v1 health-check.sh has a hardcoded Telegram bot token** in plaintext:
   - File: `/home/ricky/.openclaw/scripts/health-check.sh`
   - **Action:** Remove this cron entry. The v2 health-check already covers all the same checks and uses env files properly.

### BROKEN

2. **Chrome reaper cron references non-existent path:**
   - Crontab path: `/home/ricky/scripts/chrome-reaper.sh`
   - Actual file: `/home/ricky/mission-control-v2/config/cron/chrome-reaper.sh`
   - **Silently failing** since ~Feb 22 with no error output
   - **Action:** Remove from crontab. If still needed, recreate with correct path.

### WASTE

3. **QA retry runs 288 times/day with zero results:**
   - Generating ~1MB/day of empty logs
   - Has never successfully spawned a QA session
   - **Action:** Remove immediately.

4. **Reconciliation runs 288 times/day finding nothing:**
   - Log at 1.6MB, all "all clear" entries
   - No work items in active states to reconcile
   - **Action:** Keep concept for v3 but remove v2 version.

### LOG GROWTH (No Rotation)

5. **Multiple logs growing unbounded in `/home/ricky/logs/`:**

   | Log File | Size | Growth Rate |
   |----------|------|-------------|
   | health/health-check.log | 1.2 MB | ~60KB/day |
   | health/reconciliation.log | 1.6 MB | ~90KB/day |
   | maintenance/sync-memory.log | 2.1 MB | ~120KB/day |
   | cron/qa-retry.log | 901 KB | ~50KB/day |
   | cron/qa-retry-cron.log | 152 KB | ~8KB/day |

   The log rotation crons (#2 and #3) only cover `/tmp/openclaw/`. Logs in `/home/ricky/logs/` have NO rotation.
   **Action:** Add log rotation for `/home/ricky/logs/` in v3.

### DUPLICATION

6. **Two health checks running simultaneously:**
   - v1: `/home/ricky/.openclaw/scripts/health-check.sh` (bash, basic, hardcoded token)
   - v2: `/home/ricky/mission-control-v2/config/cron/health-check.py` (Python, comprehensive, proper alerting)
   - Both run every 15 minutes. v1 is strictly a subset of v2.
   - **Action:** Remove v1 immediately.

---

## v3 Recommendations

### Keep as-is
- Log rotation (compress + delete) — extend to cover `/home/ricky/logs/`

### Rebuild for v3
- Health check (single consolidated version, proper log rotation)
- Reconciliation (event-driven if possible, or lower frequency polling)
- Nightly janitor (adapt to v3 memory/data model)
- Daily briefing (keep 9am Bali schedule, adapt to v3 data sources)
- Weekly summary (keep Sunday evening schedule, adapt to v3 data)
- Supabase backup (update table list for v3 schema)
- Memory sync (redesign per v3 memory model, keep hash-based change detection)

### Remove now
- v1 health-check.sh (security risk — hardcoded bot token)
- chrome-reaper.sh (broken path, band-aid for browser-use leak)
- qa-retry.py (never fires, pure waste)
- rebuild-memory-md.py (already disabled, remove commented line)

### Immediate actions before v3 build
1. Remove v1 health-check from crontab (security)
2. Remove chrome-reaper from crontab (broken)
3. Remove qa-retry from crontab (waste)
4. Add log rotation for `/home/ricky/logs/**/*.log`

---

## systemd Timers

Only one user timer found:

| Timer | Schedule | Purpose |
|-------|----------|---------|
| launchpadlib-cache-clean.timer | Daily | System default, cleans launchpadlib cache. Not related to the agent system. No action needed. |

The OpenClaw gateway itself runs as a systemd user service (`openclaw-gateway`) but uses no timers — it is a long-running process.

---

## Crontab Schedule Visualization (UTC)

```
Every 5 min:   reconciliation, sync-memory, qa-retry
Every 15 min:  v1-health-check, v2-health-check, chrome-reaper
Daily 01:00:   daily-briefing (9am Bali)
Daily 04:00:   log-rotation-compress, log-rotation-delete
Daily 22:00:   nightly-janitor
Daily 22:30:   rebuild-memory (DISABLED)
Sunday 22:00:  weekly-summary
Daily 23:00:   supabase-backup
```

Peak load: On the hour, every 5 minutes, up to 5 cron jobs fire simultaneously (reconciliation + sync-memory + qa-retry + one of the 15-min jobs). This is fine for an 8-vCPU box but unnecessarily noisy.
