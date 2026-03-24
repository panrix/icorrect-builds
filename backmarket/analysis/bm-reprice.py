#!/usr/bin/env python3
"""Phase 3: Execute Price Changes via BM Buyback API

Strategy:
- Verified survivors (KEEP): no change
- Verified survivors (REPRICE): reduce to max_offer
- Killed SKUs (DELIST): set to £0
- Whitelisted SKUs: no change regardless of decision
- Blacklisted SKUs: set to £0 regardless of decision
- M1+ DEAD listings: leave as-is (fishing lines)
- M1+ DEAD losing buybox: bump to price_to_win (with --bump-dead)
- Intel DEAD listings: set to £0

Flags:
  --decisions PATH   Path to listing-decisions JSON (required)
  --dry-run          Show changes without executing (default)
  --execute          Actually update prices via API
  --limit N          Only process first N changes
  --bump-dead        Bump M1+ DEAD listings losing buybox to price_to_win
  --skip-dead        Skip all DEAD listing changes (only process listings with order data)
"""
import argparse
import csv
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bm_utils import load_env, get_min_net_tier

BASE = "/home/ricky/builds/backmarket"
LISTINGS_CSV = f"{BASE}/docs/Buy_Back_Listings_2602.csv"
AUDIT_DIR = f"{BASE}/audit"

WHITELIST = [
    "MBA13.2020.M1.7CORE.8GB.256GB.NONFUNC.USED",
    "MBA13.2024.M4.APPLECORE.16GB.512GB.NONFUNC.CRACK",
]

BLACKLIST_PATTERNS = [
    r"^MBP13\.2020\.I\d",  # Intel MBP13 2020 (i3/i5/i7)
]

RATE_LIMIT_SECONDS = 1.0
MAX_CONSECUTIVE_FAILURES = 10


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def is_m1_plus(sku):
    if not sku:
        return False
    return bool(re.search(r"\.M[1-9]", sku.upper()))


def is_intel(sku):
    if not sku:
        return False
    return bool(re.search(r"\.I[3579]\.", sku.upper()))


def is_blacklisted(sku):
    if not sku:
        return False
    for pattern in BLACKLIST_PATTERNS:
        if re.match(pattern, sku, re.IGNORECASE):
            return True
    return False


def safe_float(val, default=0.0):
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def fetch_all_api_listings(env):
    """Fetch all listings from BM buyback API (paginated)."""
    base_url = env.get("BACKMARKET_API_BASE", "https://www.backmarket.co.uk")
    all_listings = []
    url = f"{base_url}/ws/buyback/v1/listings?page=1&page_size=100"
    page = 1

    while url:
        log(f"  Fetching page {page}...")

        retries = 0
        while retries < 5:
            r = subprocess.run(
                ["curl", "-s", "-w", "\n%{http_code}", "-X", "GET", url,
                 "-H", f"Authorization: {env['BACKMARKET_API_AUTH']}",
                 "-H", f"Accept-Language: {env['BACKMARKET_API_LANG']}",
                 "-H", f"User-Agent: {env['BACKMARKET_API_UA']}",
                 "-H", "Accept: application/json"],
                capture_output=True, text=True)

            lines = r.stdout.strip().rsplit("\n", 1)
            status = lines[-1] if len(lines) > 1 else "?"
            body = lines[0] if len(lines) > 1 else r.stdout

            if status == "429":
                wait = 2 ** retries + 1
                log(f"  Rate limited (429), waiting {wait}s...")
                time.sleep(wait)
                retries += 1
                continue
            break

        if status != "200":
            log(f"  WARNING: Page {page} returned status {status}")
            break

        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            log(f"  WARNING: Page {page} returned invalid JSON")
            break

        results = data.get("results", [])
        all_listings.extend(results)

        next_url = data.get("next")
        if next_url and results:
            url = next_url
            page += 1
            time.sleep(RATE_LIMIT_SECONDS)
        else:
            url = None

    log(f"  Fetched {len(all_listings)} listings from API across {page} pages")
    return all_listings


def update_listing_price(uuid, amount, env):
    """PUT new price to BM API. Returns (success, status_code, error_msg)."""
    base_url = env.get("BACKMARKET_API_BASE", "https://www.backmarket.co.uk")
    url = f"{base_url}/ws/buyback/v1/listings/{uuid}"
    payload = {"prices": {"GB": {"amount": f"{amount:.2f}", "currency": "GBP"}}}

    r = subprocess.run(
        ["curl", "-s", "-w", "\n%{http_code}", "-X", "PUT", url,
         "-H", f"Authorization: {env['BACKMARKET_API_AUTH']}",
         "-H", f"Accept-Language: {env['BACKMARKET_API_LANG']}",
         "-H", f"User-Agent: {env['BACKMARKET_API_UA']}",
         "-H", "Content-Type: application/json",
         "-H", "Accept: application/json",
         "-d", json.dumps(payload)],
        capture_output=True, text=True)

    lines = r.stdout.strip().rsplit("\n", 1)
    status = lines[-1] if len(lines) > 1 else "?"

    if status in ("200", "202"):
        return True, int(status), None
    else:
        body = lines[0] if len(lines) > 1 else r.stdout
        return False, int(status) if status.isdigit() else 0, body[:200]


def load_buybox_data():
    """Load price_to_win and is_buybox from listings CSV, keyed by SKU."""
    buybox = {}
    with open(LISTINGS_CSV) as f:
        for row in csv.DictReader(f):
            sku = row.get("sku", "").strip()
            if not sku or sku == "None":
                continue
            if sku not in buybox:
                buybox[sku] = {
                    "price_to_win": safe_float(row.get("price_to_win", 0)),
                    "is_buybox": row.get("is_buybox", "").strip().upper() == "TRUE",
                    "csv_price": safe_float(row.get("price", 0)),
                }
    return buybox


def build_change_plan(api_listings, decisions, buybox_data, bump_dead=False, skip_dead=False):
    """Determine target price for each API listing."""
    decision_by_sku = {}
    for l in decisions.get("listings", []):
        sku = l.get("sku", "")
        if sku and sku not in decision_by_sku:
            decision_by_sku[sku] = l

    changes = []
    stats = {"keep": 0, "reprice": 0, "zero": 0, "bump": 0, "skip_no_sku": 0,
             "skip_no_price": 0, "skip_no_market": 0, "skip_dead": 0}

    for listing in api_listings:
        uuid = listing.get("id", "")
        sku = listing.get("sku") or ""
        prices = listing.get("prices", {})
        gb_price = prices.get("GB", {})
        current_amount = safe_float(gb_price.get("amount", 0))
        has_gb_market = "GB" in listing.get("markets", [])

        if not sku or sku == "None":
            stats["skip_no_sku"] += 1
            continue

        if not has_gb_market and current_amount == 0:
            stats["skip_no_market"] += 1
            continue

        dec = decision_by_sku.get(sku, {})
        action = dec.get("action", "DEAD")
        max_offer = dec.get("max_offer", 0)
        bb = buybox_data.get(sku, {})

        # Determine target price and reason
        target = None
        reason = None

        # 1. Whitelist — keep at current price
        if sku in WHITELIST:
            target = current_amount
            reason = "whitelisted"
            stats["keep"] += 1

        # 2. Blacklist — zero out
        elif is_blacklisted(sku):
            target = 0
            reason = "blacklisted (Intel MBP13)"
            stats["zero"] += 1

        # 3. Has decision data (KEEP/REPRICE/DELIST)
        elif action == "KEEP":
            target = current_amount
            reason = "profitable at current price"
            stats["keep"] += 1

        elif action == "REPRICE":
            target = max_offer
            reason = f"overpaying, reduce to max_offer"
            stats["reprice"] += 1

        elif action == "DELIST":
            target = 0
            reason = "cannot hit £200 min net"
            stats["zero"] += 1

        # 4. DEAD listing — no order history
        elif action == "DEAD":
            if skip_dead:
                stats["skip_dead"] += 1
                continue

            if is_m1_plus(sku):
                if bump_dead and not bb.get("is_buybox", True) and bb.get("price_to_win", 0) > 0:
                    ptw = bb["price_to_win"]
                    target = ptw + 1  # bid £1 above price_to_win
                    reason = f"M1+ DEAD, bump to win buybox (ptw=£{ptw:.0f})"
                    stats["bump"] += 1
                else:
                    target = current_amount
                    reason = "M1+ fishing line, keep"
                    stats["keep"] += 1
            elif is_intel(sku):
                target = 0
                reason = "Intel DEAD, zero out"
                stats["zero"] += 1
            else:
                target = current_amount
                reason = "unknown DEAD, keep"
                stats["keep"] += 1

        if target is None:
            continue

        target = round(target, 2)

        # Only include if price actually changes
        if abs(target - current_amount) >= 0.01:
            changes.append({
                "uuid": uuid,
                "sku": sku,
                "grade": listing.get("aestheticGradeCode", ""),
                "current_price": current_amount,
                "target_price": target,
                "reason": reason,
                "action": action,
            })

    return changes, stats


def main():
    parser = argparse.ArgumentParser(description="Phase 3: BM Buyback Price Execution")
    parser.add_argument("--decisions", required=True, help="Path to listing-decisions JSON")
    parser.add_argument("--execute", action="store_true", help="Actually update prices (default: dry-run)")
    parser.add_argument("--limit", type=int, default=0, help="Only process first N changes")
    parser.add_argument("--bump-dead", action="store_true", help="Bump M1+ DEAD listings to win buybox")
    parser.add_argument("--skip-dead", action="store_true", help="Skip all DEAD listing changes")
    args = parser.parse_args()

    mode = "EXECUTE" if args.execute else "DRY RUN"
    log(f"=== BM REPRICING — {mode} ===")
    log(f"Decisions: {args.decisions}")
    log(f"Whitelist: {', '.join(WHITELIST)}")
    log(f"Blacklist patterns: {', '.join(BLACKLIST_PATTERNS)}")
    log(f"Bump dead: {args.bump_dead}")
    log(f"Skip dead: {args.skip_dead}")
    if args.limit:
        log(f"Limit: first {args.limit} changes")
    log("")

    # Load data
    log("Loading decisions...")
    with open(args.decisions) as f:
        decisions = json.load(f)
    log(f"  {len(decisions.get('listings', []))} listings in decisions")

    log("Loading buybox data from CSV...")
    buybox_data = load_buybox_data()
    log(f"  {len(buybox_data)} SKUs with buybox data")

    log("Fetching live listings from BM API...")
    env = load_env()
    api_listings = fetch_all_api_listings(env)

    log("\nBuilding change plan...")
    changes, stats = build_change_plan(api_listings, decisions, buybox_data,
                                       bump_dead=args.bump_dead, skip_dead=args.skip_dead)

    # Summary
    print()
    print("=" * 70)
    print(f"BM REPRICING PLAN — {mode}")
    print("=" * 70)
    print(f"API listings fetched: {len(api_listings)}")
    print(f"  Keep (no change):   {stats['keep']}")
    print(f"  Reprice (reduce):   {stats['reprice']}")
    print(f"  Zero out:           {stats['zero']}")
    print(f"  Bump (buybox win):  {stats['bump']}")
    print(f"  Skipped (no SKU):   {stats['skip_no_sku']}")
    print(f"  Skipped (no market):{stats['skip_no_market']}")
    if args.skip_dead:
        print(f"  Skipped (DEAD):     {stats['skip_dead']}")
    print(f"\nPrice changes needed: {len(changes)}")
    print()

    if not changes:
        print("No price changes needed.")
        return

    # Apply limit
    if args.limit and args.limit < len(changes):
        changes = changes[:args.limit]
        print(f"Limited to first {args.limit} changes.")
        print()

    # Group changes by type for display
    reprices = [c for c in changes if c["target_price"] > 0]
    zeroes = [c for c in changes if c["target_price"] == 0]

    if reprices:
        print(f"--- REPRICE ({len(reprices)}) ---")
        for c in sorted(reprices, key=lambda x: x["current_price"] - x["target_price"], reverse=True):
            diff = c["current_price"] - c["target_price"]
            print(f"  {c['sku'][:55]:<55s} £{c['current_price']:>7.2f} -> £{c['target_price']:>7.2f}  (save £{diff:.2f})  {c['reason']}")
        print()

    if zeroes:
        print(f"--- ZERO OUT ({len(zeroes)}) ---")
        for c in sorted(zeroes, key=lambda x: x["current_price"], reverse=True):
            print(f"  {c['sku'][:55]:<55s} £{c['current_price']:>7.2f} -> £{c['target_price']:>7.2f}  {c['reason']}")
        print()

    # Total savings
    total_reduction = sum(c["current_price"] - c["target_price"] for c in changes if c["target_price"] < c["current_price"])
    total_increase = sum(c["target_price"] - c["current_price"] for c in changes if c["target_price"] > c["current_price"])
    print(f"Total per-unit price reductions: £{total_reduction:,.2f}")
    print(f"Total per-unit price increases: £{total_increase:,.2f}")
    print()

    if not args.execute:
        print("DRY RUN — no changes made. Use --execute to apply.")
        # Save dry-run plan
        plan_path = f"{AUDIT_DIR}/reprice-plan-{datetime.now().strftime('%Y-%m-%d')}.json"
        os.makedirs(AUDIT_DIR, exist_ok=True)
        with open(plan_path, "w") as f:
            json.dump({
                "generated": datetime.now().isoformat(),
                "mode": "dry_run",
                "decisions_file": args.decisions,
                "stats": stats,
                "changes": changes,
            }, f, indent=2)
        print(f"Plan saved to: {plan_path}")
        return

    # Execute changes
    print(f"EXECUTING {len(changes)} price changes...")
    print()

    results = []
    success_count = 0
    fail_count = 0
    consecutive_failures = 0

    for i, change in enumerate(changes, 1):
        uuid = change["uuid"]
        target = change["target_price"]
        sku = change["sku"]

        print(f"  [{i}/{len(changes)}] {sku[:45]:<45s} £{change['current_price']:.2f} -> £{target:.2f} ... ", end="", flush=True)

        ok, status_code, err = update_listing_price(uuid, target, env)

        result = {
            "uuid": uuid,
            "sku": sku,
            "old_price": change["current_price"],
            "new_price": target,
            "reason": change["reason"],
            "status_code": status_code,
            "success": ok,
            "timestamp": datetime.now().isoformat(),
        }

        if ok:
            print(f"{status_code} OK")
            success_count += 1
            consecutive_failures = 0
        else:
            print(f"{status_code} FAILED: {err}")
            fail_count += 1
            consecutive_failures += 1
            result["error"] = err

        results.append(result)

        if consecutive_failures >= MAX_CONSECUTIVE_FAILURES:
            print(f"\nABORTING: {MAX_CONSECUTIVE_FAILURES} consecutive failures")
            break

        time.sleep(RATE_LIMIT_SECONDS)

    # Save change log
    log_path = f"{AUDIT_DIR}/reprice-log-{datetime.now().strftime('%Y-%m-%d')}.json"
    os.makedirs(AUDIT_DIR, exist_ok=True)
    with open(log_path, "w") as f:
        json.dump({
            "generated": datetime.now().isoformat(),
            "mode": "execute",
            "decisions_file": args.decisions,
            "total_changes": len(changes),
            "successful": success_count,
            "failed": fail_count,
            "aborted": consecutive_failures >= MAX_CONSECUTIVE_FAILURES,
            "results": results,
        }, f, indent=2)

    print()
    print("=" * 70)
    print(f"DONE: {success_count} succeeded, {fail_count} failed")
    print(f"Change log: {log_path}")
    print("=" * 70)


if __name__ == "__main__":
    main()
