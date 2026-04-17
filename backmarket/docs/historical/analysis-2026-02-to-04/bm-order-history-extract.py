#!/usr/bin/env python3
"""
BM Order History Extract — Phase 1 of BM Catalog Ground Truth

Pulls orders from the BM API (state 9 = finished + state 5 = shipped),
extracts unique product mappings, and outputs to order-history-product-ids.json.

NOTE: The BM orders API 'product_id' field is the numeric backmarket_id
(BM's internal catalog number), NOT the UUID product_id used in listings
and the scraper. The UUID is not exposed in the orders API. We capture
listing_ids so the merge script can cross-reference with the UUID-based
lookup table.

Usage:
    python3 bm-order-history-extract.py           # full run
    python3 bm-order-history-extract.py --dry-run  # show stats without writing

Read-only — no BM mutations.
"""

import os
import sys
import json
import time
import subprocess
from datetime import datetime, timezone


# ── Config ──────────────────────────────────────────────────────────

ENV_PATH = "/home/ricky/config/.env"
OUTPUT_PATH = "/home/ricky/builds/backmarket/data/order-history-product-ids.json"

# BM order states to pull
# State 9 = finished (order fully complete)
# State 5 = shipped (dispatched, awaiting completion)
# Both contain product data needed for catalog enrichment
ORDER_STATES = [9, 5]

PAGE_SIZE = 100
REQUEST_DELAY_S = 0.5  # delay between paginated requests


# ── Env loading (same pattern as bm_utils.py) ──────────────────────

def load_env(path=ENV_PATH):
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip("'\"")
    return env


# ── BM API call (same pattern as bm_utils.py) ──────────────────────

def bm_api_get(endpoint, env):
    base = env.get("BACKMARKET_API_BASE", "https://www.backmarket.co.uk")
    url = f"{base}/{endpoint.lstrip('/')}"
    cmd = [
        "curl", "-s", "-X", "GET", url,
        "-H", f"Authorization: {env['BACKMARKET_API_AUTH']}",
        "-H", f"Accept-Language: {env.get('BACKMARKET_API_LANG', 'en-gb')}",
        "-H", f"User-Agent: {env.get('BACKMARKET_API_UA', 'iCorrect Automation')}",
        "-H", "Accept: application/json",
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"curl failed: {r.stderr}")
    if not r.stdout.strip():
        raise RuntimeError(f"Empty response from {url}")
    try:
        return json.loads(r.stdout)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Invalid JSON from {url}: {str(e)[:200]}")


# ── Fetch all orders for a given state ──────────────────────────────

def fetch_orders_by_state(state, env):
    """Fetch all orders for a given state, paginating through all pages."""
    all_orders = []
    page = 1

    while True:
        endpoint = f"/ws/orders?state={state}&page={page}&page_size={PAGE_SIZE}"

        try:
            data = bm_api_get(endpoint, env)
        except RuntimeError as e:
            print(f"  ERROR on page {page} state={state}: {e}", file=sys.stderr)
            break

        results = data.get("results", [])
        if isinstance(data, list):
            results = data

        if len(results) == 0:
            break

        all_orders.extend(results)
        print(f"  State {state} page {page}: {len(results)} orders ({len(all_orders)} total)")

        if not data.get("next"):
            break

        page += 1
        time.sleep(REQUEST_DELAY_S)

    return all_orders


# ── Extract product data from orders ────────────────────────────────

def extract_products(orders):
    """Extract unique backmarket_id entries from order data.

    The BM orders API exposes 'product_id' as the numeric backmarket_id.
    We key output by this numeric ID and collect listing_ids for cross-ref
    with UUID-based systems.
    """
    products = {}  # keyed by backmarket_id (string)
    orders_processed = 0
    lines_processed = 0
    skipped_no_pid = 0

    for order in orders:
        orders_processed += 1
        order_id = order.get("order_id", "unknown")
        order_date_raw = order.get("date_creation", "")

        # Parse order date to YYYY-MM-DD
        order_date = ""
        if order_date_raw:
            try:
                if "T" in str(order_date_raw):
                    order_date = str(order_date_raw).split("T")[0]
                else:
                    order_date = str(order_date_raw)[:10]
            except Exception:
                order_date = str(order_date_raw)

        orderlines = order.get("orderlines", [])
        for line in orderlines:
            lines_processed += 1

            # BM API 'product_id' is the numeric backmarket_id
            backmarket_id = line.get("product_id")
            if not backmarket_id:
                skipped_no_pid += 1
                continue

            backmarket_id_str = str(backmarket_id)

            # 'product' field is the title string
            title = ""
            product_field = line.get("product")
            if isinstance(product_field, str):
                title = product_field
            elif isinstance(product_field, dict):
                title = product_field.get("title", "")
            if not title:
                title = line.get("title", "") or order.get("title", "")

            # 'listing' field is the SKU string
            sku = line.get("listing") or ""
            listing_id = line.get("listing_id")

            # Price
            price = None
            try:
                price = float(line.get("price") or line.get("unit_price") or 0)
                if price == 0:
                    price = None
            except (ValueError, TypeError):
                price = None

            # Condition code (BM numeric grade)
            condition = line.get("condition")

            if backmarket_id_str in products:
                entry = products[backmarket_id_str]
                entry["order_count"] += 1
                if order_date and (not entry["first_seen"] or order_date < entry["first_seen"]):
                    entry["first_seen"] = order_date
                if order_date and (not entry["last_seen"] or order_date > entry["last_seen"]):
                    entry["last_seen"] = order_date
                if sku and sku not in entry["skus_seen"]:
                    entry["skus_seen"].append(sku)
                if price and price not in entry["prices_seen"]:
                    entry["prices_seen"].append(price)
                if listing_id and listing_id not in entry["listing_ids_seen"]:
                    entry["listing_ids_seen"].append(listing_id)
                if condition and condition not in entry["conditions_seen"]:
                    entry["conditions_seen"].append(condition)
                if title and not entry["title"]:
                    entry["title"] = title
            else:
                products[backmarket_id_str] = {
                    "backmarket_id": backmarket_id,
                    "title": title,
                    "first_seen": order_date,
                    "last_seen": order_date,
                    "order_count": 1,
                    "skus_seen": [sku] if sku else [],
                    "prices_seen": [price] if price else [],
                    "listing_ids_seen": [listing_id] if listing_id else [],
                    "conditions_seen": [condition] if condition else [],
                }

    return products, orders_processed, lines_processed, skipped_no_pid


# ── Main ────────────────────────────────────────────────────────────

def main():
    dry_run = "--dry-run" in sys.argv

    print("=" * 60)
    print("BM Order History Extract — Phase 1")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"Output: {OUTPUT_PATH}")
    print("=" * 60)

    env = load_env()

    # Verify we have the required env var
    if "BACKMARKET_API_AUTH" not in env:
        print("ERROR: BACKMARKET_API_AUTH not found in env", file=sys.stderr)
        sys.exit(1)

    print(f"\nFetching orders for states: {ORDER_STATES}")
    print("NOTE: BM API 'product_id' = numeric backmarket_id, not UUID")

    all_orders = []
    for state in ORDER_STATES:
        print(f"\n--- State {state} ---")
        if dry_run:
            # In dry run, just fetch page 1 to show what's there
            try:
                data = bm_api_get(f"/ws/orders?state={state}&page=1&page_size={PAGE_SIZE}", env)
                results = data.get("results", [])
                has_next = bool(data.get("next"))
                print(f"  [dry-run] Page 1 returned {len(results)} orders, has_next={has_next}")
                if results:
                    all_orders.extend(results)
            except RuntimeError as e:
                print(f"  [dry-run] ERROR: {e}", file=sys.stderr)
        else:
            orders = fetch_orders_by_state(state, env)
            all_orders.extend(orders)
            print(f"  Total for state {state}: {len(orders)} orders")

    print(f"\n--- Extracting product data ---")
    products, orders_processed, lines_processed, skipped = extract_products(all_orders)

    # Sort prices for readability
    for entry in products.values():
        entry["prices_seen"].sort()

    print(f"\nSummary:")
    print(f"  Orders processed: {orders_processed}")
    print(f"  Order lines processed: {lines_processed}")
    print(f"  Lines skipped (no product_id): {skipped}")
    print(f"  Unique backmarket_ids found: {len(products)}")

    # Show title coverage
    with_title = sum(1 for p in products.values() if p["title"])
    print(f"  With title: {with_title}")

    # Show sample
    if products:
        print(f"\n--- Sample entries (first 3) ---")
        for bmid, entry in list(products.items())[:3]:
            t = entry.get("title", "")
            print(f"  backmarket_id={bmid}:")
            print(f"    title: {t[:80]}{'...' if len(t) > 80 else ''}")
            print(f"    orders: {entry['order_count']}, first: {entry['first_seen']}, last: {entry['last_seen']}")
            print(f"    skus: {entry['skus_seen'][:3]}")
            print(f"    listing_ids: {entry['listing_ids_seen'][:5]}")
            print(f"    prices: {entry['prices_seen'][:5]}")

    if dry_run:
        print(f"\n[dry-run] Would write {len(products)} products to {OUTPUT_PATH}")
        print("[dry-run] Run without --dry-run to write output.")
        return

    # Build output
    output = {
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "total_orders_processed": orders_processed,
        "total_order_lines": lines_processed,
        "unique_backmarket_ids": len(products),
        "states_fetched": ORDER_STATES,
        "note": "Keyed by backmarket_id (numeric). BM orders API product_id is the numeric backmarket_id, not UUID. Use listing_ids_seen to cross-reference with UUID-based lookup tables.",
        "products": products,
    }

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nWrote {len(products)} unique backmarket_ids to {OUTPUT_PATH}")
    print("Done.")


if __name__ == "__main__":
    main()
