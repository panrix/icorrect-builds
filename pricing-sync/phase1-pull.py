#!/usr/bin/env python3
"""Phase 1: Fresh Data Pull + Schema Discovery

Pulls live data from Shopify, Monday (2 boards), and SumUp.
Saves normalized JSON files for Phase 2 matching.
"""
import json
import os
import sys
import shutil
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import (
    load_env, log,
    shopify_get_all_products,
    monday_get_schema, monday_paginate,
    parse_sumup_csv,
)

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
SUMUP_SOURCE = os.path.expanduser(
    "~/.openclaw/agents/main/workspace/data/sumup-items-export.csv"
)

MONDAY_DEVICES_BOARD = 3923707691
MONDAY_PRICING_BOARD = 2477699024


def ensure_dirs():
    os.makedirs(DATA_DIR, exist_ok=True)


def save_json(data, filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)
    log(f"  Saved {path} ({os.path.getsize(path)} bytes)")


def pull_shopify(env):
    """Pull all active Shopify products."""
    log("\n=== SHOPIFY ===")
    products = shopify_get_all_products(env)

    # Extract structured data
    items = []
    for p in products:
        variants = p.get("variants", [])
        price = float(variants[0]["price"]) if variants else 0.0
        variant_id = variants[0]["id"] if variants else None
        items.append({
            "id": p["id"],
            "title": p["title"],
            "product_type": p.get("product_type", ""),
            "handle": p.get("handle", ""),
            "status": p.get("status", ""),
            "price": price,
            "variant_id": variant_id,
        })

    output = {
        "source": "shopify",
        "pulled_at": datetime.now(timezone.utc).isoformat(),
        "total": len(items),
        "items": items,
    }
    save_json(output, "shopify-live.json")

    # Summary
    types = {}
    for item in items:
        t = item["product_type"] or "Uncategorized"
        types[t] = types.get(t, 0) + 1
    prices = [i["price"] for i in items if i["price"] > 0]

    log(f"\n  Total products: {len(items)}")
    log(f"  Product types:")
    for t, c in sorted(types.items(), key=lambda x: -x[1]):
        log(f"    {t}: {c}")
    if prices:
        log(f"  Price range: {min(prices):.0f} - {max(prices):.0f}")

    return output


def pull_monday_board(board_id, label, env):
    """Pull schema + all items from a Monday board."""
    log(f"\n=== MONDAY: {label} (board {board_id}) ===")

    # Schema discovery
    log("  Fetching schema...")
    schema = monday_get_schema(board_id, env)
    save_json(schema, f"monday-{label}-schema.json")

    board_name = schema.get("name", "Unknown")
    columns = schema.get("columns", [])
    groups = schema.get("groups", [])
    log(f"  Board name: {board_name}")
    log(f"  Columns: {len(columns)}")
    for col in columns:
        log(f"    {col['id']:30s} {col['type']:20s} {col['title']}")
    log(f"  Groups: {len(groups)}")
    for g in groups:
        log(f"    {g['title']}")

    # Pull all items (no column filter — get everything for discovery)
    log("  Fetching all items...")
    items = monday_paginate(board_id, env=env)

    output = {
        "source": f"monday-{label}",
        "board_id": board_id,
        "board_name": board_name,
        "pulled_at": datetime.now(timezone.utc).isoformat(),
        "total": len(items),
        "columns": columns,
        "groups": groups,
        "items": items,
    }
    save_json(output, f"monday-{label}.json")

    # Summary
    group_counts = {}
    for item in items:
        g = item.get("group", {}).get("title", "Unknown")
        group_counts[g] = group_counts.get(g, 0) + 1

    log(f"\n  Total items: {len(items)}")
    log(f"  Groups with items: {len(group_counts)}")

    return output


def pull_sumup():
    """Parse SumUp CSV export."""
    log("\n=== SUMUP ===")

    if not os.path.exists(SUMUP_SOURCE):
        log(f"  ERROR: SumUp CSV not found at {SUMUP_SOURCE}")
        return None

    # Backup original
    backup_path = os.path.join(DATA_DIR, "sumup-export-original.csv")
    shutil.copy2(SUMUP_SOURCE, backup_path)
    log(f"  Backed up to {backup_path}")

    # Parse
    devices = parse_sumup_csv(SUMUP_SOURCE)

    total_repairs = sum(len(d["repairs"]) for d in devices)
    prices = [r["price"] for d in devices for r in d["repairs"] if r["price"] is not None]

    output = {
        "source": "sumup",
        "parsed_at": datetime.now(timezone.utc).isoformat(),
        "total_devices": len(devices),
        "total_repairs": total_repairs,
        "devices": devices,
    }
    save_json(output, "sumup-parsed.json")

    # Summary
    categories = {}
    for d in devices:
        cat = d["category"] or "Uncategorized"
        categories[cat] = categories.get(cat, 0) + 1

    log(f"\n  Total devices (parents): {len(devices)}")
    log(f"  Total repairs (variations): {total_repairs}")
    log(f"  Categories:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        log(f"    {cat}: {count}")
    if prices:
        log(f"  Price range: {min(prices):.0f} - {max(prices):.0f}")

    return output


def print_summary(shopify, monday_devices, monday_pricing, sumup):
    """Print cross-system summary table."""
    log("\n" + "=" * 60)
    log("PHASE 1 SUMMARY")
    log("=" * 60)
    log(f"{'System':<25s} {'Items':>8s} {'Devices':>8s}")
    log("-" * 45)

    s_count = shopify["total"] if shopify else 0
    log(f"{'Shopify':<25s} {s_count:>8d} {'':>8s}")

    if monday_devices:
        md_count = monday_devices["total"]
        md_groups = len(set(i.get("group", {}).get("title", "") for i in monday_devices["items"]))
        log(f"{'Monday (Devices)':<25s} {md_count:>8d} {md_groups:>8d}")

    if monday_pricing:
        mp_count = monday_pricing["total"]
        mp_groups = len(set(i.get("group", {}).get("title", "") for i in monday_pricing["items"]))
        log(f"{'Monday (Pricing)':<25s} {mp_count:>8d} {mp_groups:>8d}")

    if sumup:
        su_devices = sumup["total_devices"]
        su_repairs = sumup["total_repairs"]
        log(f"{'SumUp':<25s} {su_repairs:>8d} {su_devices:>8d}")

    log("=" * 60)


def main():
    log(f"Phase 1: Data Pull — {datetime.now(timezone.utc).isoformat()}")
    ensure_dirs()
    env = load_env()

    shopify = pull_shopify(env)
    monday_devices = pull_monday_board(MONDAY_DEVICES_BOARD, "devices", env)
    monday_pricing = pull_monday_board(MONDAY_PRICING_BOARD, "pricing", env)
    sumup = pull_sumup()

    print_summary(shopify, monday_devices, monday_pricing, sumup)
    log("\nPhase 1 complete. All data saved to data/")


if __name__ == "__main__":
    main()
