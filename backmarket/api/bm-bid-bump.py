#!/usr/bin/env python3
"""Task 16: Incremental Bid Bumping for BM Buyback Listings

Strategy:
- Increase bids on SKUs where current price is well below max_offer (headroom)
- Goal: win more buybox positions → get more orders
- Conservative first round: bump by min(£50, headroom - £5 buffer)
- Minimum bump: £15 (not worth API calls for less)
- Skip Intel SKUs (already zeroed)
- Priority: NONFUNC.USED > FUNC.CRACK > NONFUNC.CRACK (by grade profitability)

Flags:
  --audit PATH       Path to buybox-audit JSON (required)
  --increment N      Max per-SKU bump amount in GBP (default: 50)
  --min-bump N       Minimum bump to bother with (default: 15)
  --buffer N         Headroom buffer above net floor (default: 5)
  --dry-run          Show plan without executing (default)
  --execute          Actually update prices via API
  --limit N          Only process first N SKU changes
  --grade GRADE      Only bump SKUs matching this grade (NONFUNC.USED, FUNC.CRACK, etc.)
"""
import argparse
import json
import os
import re
import sys
import time
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bm_utils import load_env

BASE = "/home/ricky/builds/backmarket"
AUDIT_DIR = f"{BASE}/audit"

RATE_LIMIT_SECONDS = 1.0
MAX_CONSECUTIVE_FAILURES = 10


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def is_intel(sku):
    return bool(re.search(r"\.I[3579]\.", (sku or "").upper()))


def safe_float(val, default=0.0):
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def extract_grade(sku):
    """Extract grade from SKU: NONFUNC.USED, FUNC.CRACK, NONFUNC.CRACK."""
    if not sku:
        return "UNKNOWN"
    parts = sku.split(".")
    if len(parts) >= 2:
        tail = ".".join(parts[-2:])
        if tail in ("NONFUNC.USED", "FUNC.CRACK", "NONFUNC.CRACK"):
            return tail
    return "UNKNOWN"


def fetch_all_api_listings(env):
    """Fetch all listings from BM buyback API (paginated)."""
    import subprocess
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
    import subprocess
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


def build_bump_plan(bumps, survivors, api_listings, max_increment, min_bump, buffer, grade_filter=None):
    """Calculate target prices and match to API listing UUIDs."""
    # Build SKU → survivor net lookup (for projected net calculation)
    survivor_net = {}
    for s in survivors:
        sku = s.get("sku", "")
        if sku and s.get("net", 0) > 0:
            survivor_net[sku] = s["net"]

    # Build SKU → bump data lookup
    bump_by_sku = {}
    for b in bumps:
        sku = b["sku"]
        if is_intel(sku):
            continue
        if grade_filter and extract_grade(sku) != grade_filter:
            continue
        # Merge net from survivors
        if sku in survivor_net:
            b["net"] = survivor_net[sku]
        bump_by_sku[sku] = b

    # Build SKU → API listings lookup
    api_by_sku = {}
    for listing in api_listings:
        sku = listing.get("sku") or ""
        if not sku or sku == "None":
            continue
        gb_price = listing.get("prices", {}).get("GB", {})
        current_price = safe_float(gb_price.get("amount", 0))
        has_gb = "GB" in listing.get("markets", [])

        if sku in bump_by_sku and (has_gb or current_price > 0):
            if sku not in api_by_sku:
                api_by_sku[sku] = []
            api_by_sku[sku].append({
                "uuid": listing.get("id", ""),
                "current_price": current_price,
                "grade_code": listing.get("aestheticGradeCode", ""),
            })

    # Calculate bumps
    changes = []
    skipped = {"intel": 0, "low_headroom": 0, "no_api_match": 0, "already_zero": 0, "grade_filtered": 0}

    for sku, b in sorted(bump_by_sku.items(), key=lambda x: x[1].get("dem", 0), reverse=True):
        price = b["price"]
        max_offer = b["max_offer"]
        head = b["head"]
        demand = b.get("dem", 0)
        grade = extract_grade(sku)

        if sku not in api_by_sku:
            skipped["no_api_match"] += 1
            continue

        # Calculate bump amount
        available = head - buffer
        if available < min_bump:
            skipped["low_headroom"] += 1
            continue

        bump_amount = min(max_increment, available)
        target_price = round(price + bump_amount, 2)

        # Projected net at new price
        # net was measured at audit price. New target = audit_price + bump_amount
        # so projected_net = net - bump_amount
        current_net = b.get("net", 0) if b.get("net", 0) > 0 else None
        audit_price = b.get("price", 0)

        for api_listing in api_by_sku[sku]:
            api_current = api_listing["current_price"]

            # Skip if listing is already at 0 (zeroed)
            if api_current == 0:
                skipped["already_zero"] += 1
                continue

            # If API price differs from audit price, recalculate
            # Use API price as truth, apply same bump amount
            actual_target = round(api_current + bump_amount, 2)

            # Don't exceed max_offer
            if actual_target > max_offer:
                actual_target = round(max_offer, 2)
                bump_amount = round(actual_target - api_current, 2)
                if bump_amount < min_bump:
                    skipped["low_headroom"] += 1
                    continue

            # Projected net: net was at audit_price; we're setting actual_target
            # Net changes by the difference from audit price
            proj_net = round(current_net - (actual_target - audit_price), 2) if current_net else None

            changes.append({
                "uuid": api_listing["uuid"],
                "sku": sku,
                "grade": grade,
                "grade_code": api_listing["grade_code"],
                "current_price": api_current,
                "target_price": actual_target,
                "bump_amount": round(actual_target - api_current, 2),
                "max_offer": max_offer,
                "remaining_headroom": round(max_offer - actual_target, 2),
                "demand": demand,
                "current_net": current_net,
                "projected_net": proj_net,
            })

    return changes, skipped


def main():
    parser = argparse.ArgumentParser(description="Task 16: BM Bid Bumping")
    parser.add_argument("--audit", required=True, help="Path to buybox-audit JSON")
    parser.add_argument("--increment", type=float, default=50, help="Max bump per SKU in GBP (default: 50)")
    parser.add_argument("--min-bump", type=float, default=15, help="Minimum bump to execute (default: 15)")
    parser.add_argument("--buffer", type=float, default=5, help="Buffer above net floor (default: 5)")
    parser.add_argument("--execute", action="store_true", help="Actually update prices (default: dry-run)")
    parser.add_argument("--limit", type=int, default=0, help="Only process first N changes")
    parser.add_argument("--grade", type=str, default=None, help="Only bump this grade (e.g. NONFUNC.USED)")
    args = parser.parse_args()

    mode = "EXECUTE" if args.execute else "DRY RUN"
    log(f"=== BM BID BUMPING — {mode} ===")
    log(f"Audit file: {args.audit}")
    log(f"Max increment: £{args.increment:.0f}")
    log(f"Min bump: £{args.min_bump:.0f}")
    log(f"Buffer: £{args.buffer:.0f}")
    if args.grade:
        log(f"Grade filter: {args.grade}")
    log("")

    # Load bump candidates
    log("Loading buybox audit...")
    with open(args.audit) as f:
        audit = json.load(f)

    bumps = audit.get("bumps", [])
    survivors = audit.get("survivors", [])
    log(f"  {len(bumps)} bump candidates in audit")
    log(f"  {len(survivors)} survivors with P&L data")

    # Fetch current API listings
    log("Fetching live listings from BM API...")
    env = load_env()
    api_listings = fetch_all_api_listings(env)

    log("\nBuilding bump plan...")
    changes, skipped = build_bump_plan(
        bumps, survivors, api_listings,
        max_increment=args.increment,
        min_bump=args.min_bump,
        buffer=args.buffer,
        grade_filter=args.grade,
    )

    # Sort by demand (highest first), then by bump amount
    changes.sort(key=lambda c: (-c["demand"], -c["bump_amount"]))

    # Summary
    print()
    print("=" * 90)
    print(f"BM BID BUMP PLAN — {mode} — Round 1 (max +£{args.increment:.0f})")
    print("=" * 90)

    unique_skus = len(set(c["sku"] for c in changes))
    print(f"SKUs to bump:        {unique_skus}")
    print(f"Listings to update:  {len(changes)}")
    print(f"Skipped (Intel):     {skipped['intel']}")
    print(f"Skipped (low head):  {skipped['low_headroom']}")
    print(f"Skipped (no match):  {skipped['no_api_match']}")
    print(f"Skipped (zeroed):    {skipped['already_zero']}")
    print()

    if not changes:
        print("No bumps to execute.")
        return

    # Apply limit
    if args.limit and args.limit < len(changes):
        changes = changes[:args.limit]
        print(f"Limited to first {args.limit} changes.")
        print()

    # Display plan grouped by grade
    grade_order = ["NONFUNC.USED", "FUNC.CRACK", "NONFUNC.CRACK", "UNKNOWN"]
    for grade in grade_order:
        grade_changes = [c for c in changes if c["grade"] == grade]
        if not grade_changes:
            continue

        total_bump = sum(c["bump_amount"] for c in grade_changes)
        print(f"--- {grade} ({len(grade_changes)} listings, +£{total_bump:.0f} total) ---")
        print(f"  {'SKU':<58s} {'Now':>6s} {'New':>6s} {'Bump':>5s} {'Head':>5s} {'Dem':>3s} {'ProjNet':>7s}")
        print(f"  {'-'*58} {'-'*6} {'-'*6} {'-'*5} {'-'*5} {'-'*3} {'-'*7}")

        # Deduplicate by SKU for display (show per-SKU, not per-listing)
        seen_skus = set()
        for c in grade_changes:
            if c["sku"] in seen_skus:
                continue
            seen_skus.add(c["sku"])

            sku_listings = [x for x in grade_changes if x["sku"] == c["sku"]]
            listing_count = len(sku_listings)
            suffix = f" x{listing_count}" if listing_count > 1 else ""

            pnet = f"£{c['projected_net']:.0f}" if c['projected_net'] else "?"
            print(f"  {c['sku'][:55]+suffix:<58s} £{c['current_price']:>5.0f} £{c['target_price']:>5.0f} +£{c['bump_amount']:>3.0f} £{c['remaining_headroom']:>4.0f} {c['demand']:>3d} {pnet:>7s}")

        print()

    total_bump_all = sum(c["bump_amount"] for c in changes)
    print(f"Total bid increase across all listings: +£{total_bump_all:,.0f}")
    print(f"(This is per-device cost increase, not monthly — actual cost depends on order volume)")
    print()

    if not args.execute:
        # Save dry-run plan
        plan_path = f"{AUDIT_DIR}/bid-bump-plan-{datetime.now().strftime('%Y-%m-%d')}.json"
        os.makedirs(AUDIT_DIR, exist_ok=True)
        with open(plan_path, "w") as f:
            json.dump({
                "generated": datetime.now().isoformat(),
                "mode": "dry_run",
                "config": {
                    "audit_file": args.audit,
                    "max_increment": args.increment,
                    "min_bump": args.min_bump,
                    "buffer": args.buffer,
                    "grade_filter": args.grade,
                },
                "summary": {
                    "unique_skus": unique_skus,
                    "total_listings": len(changes),
                    "total_bump": total_bump_all,
                    "skipped": skipped,
                },
                "changes": changes,
            }, f, indent=2)
        print(f"DRY RUN — no changes made. Use --execute to apply.")
        print(f"Plan saved to: {plan_path}")
        return

    # Execute changes
    print(f"EXECUTING {len(changes)} bid bumps...")
    print()

    results = []
    success_count = 0
    fail_count = 0
    consecutive_failures = 0

    for i, change in enumerate(changes, 1):
        uuid = change["uuid"]
        target = change["target_price"]
        sku = change["sku"]

        print(f"  [{i}/{len(changes)}] {sku[:45]:<45s} £{change['current_price']:.0f} -> £{target:.0f} (+£{change['bump_amount']:.0f}) ... ", end="", flush=True)

        ok, status_code, err = update_listing_price(uuid, target, env)

        result = {
            "uuid": uuid,
            "sku": sku,
            "old_price": change["current_price"],
            "new_price": target,
            "bump_amount": change["bump_amount"],
            "remaining_headroom": change["remaining_headroom"],
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

    # Save execution log
    log_path = f"{AUDIT_DIR}/bid-bump-log-{datetime.now().strftime('%Y-%m-%d')}.json"
    os.makedirs(AUDIT_DIR, exist_ok=True)
    with open(log_path, "w") as f:
        json.dump({
            "generated": datetime.now().isoformat(),
            "mode": "execute",
            "config": {
                "audit_file": args.audit,
                "max_increment": args.increment,
                "min_bump": args.min_bump,
                "buffer": args.buffer,
                "grade_filter": args.grade,
            },
            "summary": {
                "total_changes": len(changes),
                "successful": success_count,
                "failed": fail_count,
                "aborted": consecutive_failures >= MAX_CONSECUTIVE_FAILURES,
            },
            "results": results,
        }, f, indent=2)

    print()
    print("=" * 90)
    print(f"DONE: {success_count} succeeded, {fail_count} failed")
    print(f"Log saved to: {log_path}")
    print("=" * 90)


if __name__ == "__main__":
    main()
