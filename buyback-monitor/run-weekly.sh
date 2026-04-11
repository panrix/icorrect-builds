#!/bin/bash
# Weekly Buy Box Pipeline: V7 scraper (--all) → buy box monitor → sheet sync
# Schedule: Monday 05:00 UTC (0 5 * * 1) to reduce Cloudflare detection risk.
# The downstream catalog merge (bm-catalog-merge.py) works with weekly data.
set -euo pipefail

LOG_DIR="/home/ricky/logs/buyback"
mkdir -p "$LOG_DIR"
TODAY=$(date +%Y-%m-%d)
LOG_FILE="$LOG_DIR/buy-box-$TODAY.log"

cd /home/ricky/builds/buyback-monitor

# Step 1: V6 sell price scraper (~2 min)
echo "=== V7 Scraper starting at $(date -u) ===" >> "$LOG_FILE"
node sell_price_scraper_v7.js --all >> "$LOG_FILE" 2>&1
echo "=== V7 Scraper completed at $(date -u) ===" >> "$LOG_FILE"

# Step 2: Buy box monitor with auto-bump (~90 min)
echo "=== Buy Box Monitor starting at $(date -u) ===" >> "$LOG_FILE"
python3 buy_box_monitor.py --no-resume --auto-bump >> "$LOG_FILE" 2>&1
echo "=== Buy Box Monitor completed at $(date -u) ===" >> "$LOG_FILE"

# Step 3: Sync to Google Sheet (~2 min)
echo "=== Sheet Sync starting at $(date -u) ===" >> "$LOG_FILE"
python3 sync_to_sheet.py >> "$LOG_FILE" 2>&1
echo "=== Sheet Sync completed at $(date -u) ===" >> "$LOG_FILE"
