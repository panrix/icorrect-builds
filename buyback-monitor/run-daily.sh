#!/bin/bash
# Daily Buy Box Pipeline: V7 scraper → buy box monitor (with auto-bump) → Telegram report
# Schedule: Daily 05:00 UTC (0 5 * * *)
# Replaces the OpenClaw cron that ran this through Jarvis (Opus) — same functionality, zero LLM tokens.
set -euo pipefail

LOG_DIR="/home/ricky/logs/buyback"
mkdir -p "$LOG_DIR"
TODAY=$(date +%Y-%m-%d)
LOG_FILE="$LOG_DIR/buy-box-$TODAY.log"
DATA_DIR="/home/ricky/builds/buyback-monitor/data/buyback"
ALERT_SCRIPT="/home/ricky/mission-control-v2/scripts/utils/telegram-alert.py"

# Failure trap — ensures an alert fires if the script dies before the reporting block.
# Without this, bugs like unquoted .env values caused silent failures for days.
on_early_exit() {
    local exit_code=$?
    local line_no=$1
    # Only alert on non-zero exits. Normal completion hits exit 0 and the trap runs but returns cleanly.
    if [ $exit_code -ne 0 ]; then
        local msg="🔴 <b>Buyback cron FAILED early — $TODAY</b>%0A%0AExit code: $exit_code%0ALine: $line_no%0ALog: <code>$LOG_FILE</code>%0A%0ACheck the log for the actual error."
        # Best-effort alert; don't let alert failure mask the original failure
        python3 "$ALERT_SCRIPT" ricky "$msg" 2>> "$LOG_FILE" || echo "Early-exit alert failed" >> "$LOG_FILE" 2>/dev/null || true
    fi
}
trap 'on_early_exit $LINENO' EXIT

cd /home/ricky/builds/buyback-monitor

# Source env for BM_AUTH and TELEGRAM_BOT_TOKEN
# (.env is sourced under set -u so every referenced variable must be safely quoted.
#  Unquoted $, backticks or shell metacharacters in values will crash here.
#  Single-quote any value containing $ or backtick. See CHANGELOG Phase 0.8.)
source /home/ricky/config/api-keys/.env
export BM_AUTH BM_UA TELEGRAM_BOT_TOKEN

# Step 1: V7 sell price scraper (~2 min)
echo "=== V7 Scraper starting at $(date -u) ===" >> "$LOG_FILE"
if node sell_price_scraper_v7.js >> "$LOG_FILE" 2>&1; then
    SCRAPER_STATUS="OK"
    SCRAPER_COUNT=$(python3 -c "import json; d=json.load(open('data/sell-prices-$TODAY.json')); print(len(d.get('prices', d) if isinstance(d, dict) else d))" 2>/dev/null || echo "?")
else
    SCRAPER_STATUS="FAILED"
    SCRAPER_COUNT="0"
fi
echo "=== V7 Scraper completed at $(date -u) (status: $SCRAPER_STATUS) ===" >> "$LOG_FILE"

# Step 2: Buy box monitor with auto-bump (~90 min)
echo "=== Buy Box Monitor starting at $(date -u) ===" >> "$LOG_FILE"
if python3 buy_box_monitor.py --no-resume --auto-bump >> "$LOG_FILE" 2>&1; then
    MONITOR_STATUS="OK"
else
    MONITOR_STATUS="FAILED"
fi
echo "=== Buy Box Monitor completed at $(date -u) (status: $MONITOR_STATUS) ===" >> "$LOG_FILE"

# Step 3: Build Telegram report from the generated files
SUMMARY_FILE="$DATA_DIR/buy-box-$TODAY-summary.md"
BUMPS_FILE="$DATA_DIR/bumps-$TODAY.json"

if [ -f "$SUMMARY_FILE" ]; then
    # Extract key stats from the summary markdown
    WIN_RATE=$(grep -oP 'Win rate:.*?(\d+\.?\d*%)' "$SUMMARY_FILE" | head -1 | grep -oP '\d+\.?\d*%' || echo "?")
    TOTAL=$(grep -oP 'Total.*?(\d+)' "$SUMMARY_FILE" | head -1 | grep -oP '\d+' | tail -1 || echo "?")
    WINNING=$(grep -oP 'Winning.*?(\d+)' "$SUMMARY_FILE" | head -1 | grep -oP '\d+' | tail -1 || echo "?")
    LOSING=$(grep -oP 'Losing.*?(\d+)' "$SUMMARY_FILE" | head -1 | grep -oP '\d+' | tail -1 || echo "?")
else
    WIN_RATE="?"
    TOTAL="?"
    WINNING="?"
    LOSING="?"
fi

if [ -f "$BUMPS_FILE" ]; then
    BUMPED=$(python3 -c "import json; d=json.load(open('$BUMPS_FILE')); print(d.get('bumped', 0))" 2>/dev/null || echo "0")
    BUMP_FAILED=$(python3 -c "import json; d=json.load(open('$BUMPS_FILE')); print(d.get('failed', 0))" 2>/dev/null || echo "0")
else
    BUMPED="0"
    BUMP_FAILED="0"
fi

# Build message
MSG="<b>Buy Box Daily Report — $TODAY</b>

<b>Scraper:</b> $SCRAPER_STATUS ($SCRAPER_COUNT prices)
<b>Monitor:</b> $MONITOR_STATUS

<b>Results:</b> $TOTAL listings | $WINNING winning | $LOSING losing
<b>Win rate:</b> $WIN_RATE
<b>Auto-bumps:</b> $BUMPED OK, $BUMP_FAILED failed

Full summary: <code>$SUMMARY_FILE</code>"

# Send to Ricky via Telegram
python3 "$ALERT_SCRIPT" ricky "$MSG" 2>> "$LOG_FILE" || echo "WARNING: Telegram alert failed" >> "$LOG_FILE"

echo "=== Pipeline complete at $(date -u) ===" >> "$LOG_FILE"

# Disable early-exit trap — we got here, normal path succeeded, don't fire the panic alert
trap - EXIT
