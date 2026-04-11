#!/usr/bin/env python3
"""
Price Pipeline Orchestrator
Runs the full sell-price scraping pipeline in order:
1. Scrape BackMarket product pages for sell prices
2. Generate sell-price lookup for buy box monitor
3. Sync to Google Sheet

Usage:
    python3 run_price_pipeline.py                  # Full pipeline
    python3 run_price_pipeline.py --no-sheet       # Skip Google Sheet sync
    python3 run_price_pipeline.py --dry-run        # Dry run all steps
    python3 run_price_pipeline.py --force          # Force re-scrape
"""

import argparse
import logging
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

SCRIPTS_DIR = Path(__file__).parent

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("pipeline")


def run_step(name: str, cmd: list, allow_fail: bool = False) -> bool:
    """Run a pipeline step. Returns True on success."""
    log.info(f"{'='*50}")
    log.info(f"STEP: {name}")
    log.info(f"CMD:  {' '.join(cmd)}")
    log.info(f"{'='*50}")

    start = time.time()
    result = subprocess.run(cmd, cwd=str(SCRIPTS_DIR))
    elapsed = time.time() - start

    if result.returncode != 0:
        log.error(f"STEP FAILED: {name} (exit code {result.returncode}, {elapsed:.1f}s)")
        if not allow_fail:
            return False
    else:
        log.info(f"STEP OK: {name} ({elapsed:.1f}s)")

    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(description="Run the full sell-price pipeline")
    parser.add_argument("--dry-run", action="store_true", help="Dry run all steps")
    parser.add_argument("--force", action="store_true", help="Force re-scrape even if today's file exists")
    parser.add_argument("--no-sheet", action="store_true", help="Skip Google Sheet sync")
    parser.add_argument("--no-variants", action="store_true", help="Only scrape seed URLs")
    parser.add_argument("--model", type=str, help="Filter to specific model family")
    args = parser.parse_args()

    log.info(f"=== Price Pipeline starting at {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} ===")

    # Step 1: Scrape sell prices
    scrape_cmd = [sys.executable, str(SCRIPTS_DIR / "sell_price_scraper.py")]
    if args.dry_run:
        scrape_cmd.append("--dry-run")
    if args.force:
        scrape_cmd.append("--force")
    if args.no_variants:
        scrape_cmd.append("--no-variants")
    if args.model:
        scrape_cmd.extend(["--model", args.model])

    if not run_step("Scrape Sell Prices", scrape_cmd):
        log.error("Scraping failed. Aborting pipeline.")
        sys.exit(1)

    if args.dry_run:
        log.info("Dry run complete. Skipping remaining steps.")
        return

    # Step 2: Generate lookup
    lookup_cmd = [sys.executable, str(SCRIPTS_DIR / "generate_sell_lookup.py")]
    if not run_step("Generate Sell Lookup", lookup_cmd):
        log.error("Lookup generation failed. Aborting pipeline.")
        sys.exit(1)

    # Step 3: Sync to Google Sheet
    if not args.no_sheet:
        sheet_cmd = [sys.executable, str(SCRIPTS_DIR / "sync_to_sheet.py")]
        run_step("Sync to Google Sheet", sheet_cmd, allow_fail=True)
    else:
        log.info("Skipping Google Sheet sync (--no-sheet)")

    log.info(f"=== Price Pipeline complete ===")


if __name__ == "__main__":
    main()
