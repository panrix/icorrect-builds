#!/usr/bin/env python3
"""Phase 4: Monday Update Script

Updates Monday Products & Pricing board to match Shopify:
- Fix prices
- Populate Shopify IDs
- Rename items to match Shopify naming

Safety: --dry-run (default) shows changes. --execute applies them.
"""
import json
import os
import sys
import time
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, "/home/ricky/builds/backmarket/api")
from bm_utils import load_env, monday_query
from utils import log

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
REPORTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")

PRICING_BOARD_ID = 2477699024


def load_catalog():
    with open(os.path.join(DATA_DIR, "catalog-matched.json")) as f:
        return json.load(f)


def build_mutations(catalog):
    """Build list of Monday mutations from matched catalog data."""
    mutations = []

    for item in catalog["monday_matched"]:
        monday_id = item["monday_id"]
        changes = {}

        # 1. Price mismatch — update price
        if item.get("price_match") is False and item["monday_price"] is not None:
            changes["numbers"] = str(item["shopify_price"])

        # 2. Shopify ID missing — populate it
        if not item.get("monday_shopify_id") and item.get("shopify_id"):
            changes["text_mkzdte13"] = str(item["shopify_id"])

        if changes:
            mutations.append({
                "monday_id": monday_id,
                "monday_name": item["monday_name"],
                "monday_device": item["monday_device"],
                "shopify_device": item["shopify_device"],
                "shopify_title": item["shopify_title"],
                "repair_category": item["repair_category"],
                "changes": changes,
                "before": {
                    "price": item["monday_price"],
                    "shopify_id": item.get("monday_shopify_id", ""),
                },
                "after": {
                    "price": item["shopify_price"] if "numbers" in changes else item["monday_price"],
                    "shopify_id": str(item["shopify_id"]) if "text_mkzdte13" in changes else item.get("monday_shopify_id", ""),
                },
            })

    return mutations


def dry_run(mutations):
    """Print all planned changes without executing."""
    price_changes = [m for m in mutations if "numbers" in m["changes"]]
    id_fills = [m for m in mutations if "text_mkzdte13" in m["changes"]]

    print(f"\n{'='*70}")
    print(f"DRY RUN — {len(mutations)} total mutations")
    print(f"{'='*70}")
    print(f"  Price updates: {len(price_changes)}")
    print(f"  Shopify ID fills: {len(id_fills)}")

    if price_changes:
        print(f"\n--- PRICE UPDATES ({len(price_changes)}) ---\n")
        for m in sorted(price_changes, key=lambda x: abs(float(x["changes"]["numbers"]) - (x["before"]["price"] or 0)), reverse=True):
            before = m["before"]["price"]
            after = float(m["changes"]["numbers"])
            delta = after - (before or 0)
            print(f"  [{m['monday_id']}] {m['monday_name'][:50]:50s} £{before:>6.0f} → £{after:>6.0f} (delta: £{delta:>+6.0f})")

    if id_fills:
        print(f"\n--- SHOPIFY ID FILLS ({len(id_fills)}) ---\n")
        for m in id_fills[:20]:
            print(f"  [{m['monday_id']}] {m['monday_name'][:50]:50s} → Shopify ID: {m['changes']['text_mkzdte13']}")
        if len(id_fills) > 20:
            print(f"  ... and {len(id_fills) - 20} more")

    print(f"\n{'='*70}")
    print(f"To execute: python3 phase4-monday-update.py --execute")
    print(f"{'='*70}")


def execute(mutations, env):
    """Execute mutations against Monday API."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    log_path = os.path.join(REPORTS_DIR, f"update-log-{today}.json")
    os.makedirs(REPORTS_DIR, exist_ok=True)

    results = []
    success = 0
    skipped = 0
    failed = 0

    total = len(mutations)
    log(f"\nExecuting {total} mutations on board {PRICING_BOARD_ID}...")

    for i, m in enumerate(mutations):
        monday_id = m["monday_id"]

        # Pre-flight: read current value to verify it hasn't changed
        preflight_q = '{ items(ids: [%s]) { column_values(ids: ["numbers", "text_mkzdte13"]) { id text } } }' % monday_id
        current = monday_query(preflight_q, env)
        current_items = current.get("data", {}).get("items", [])

        if not current_items:
            log(f"  [{i+1}/{total}] SKIP {monday_id} — item not found")
            skipped += 1
            results.append({**m, "status": "skipped", "reason": "not_found"})
            continue

        current_vals = {cv["id"]: cv["text"] for cv in current_items[0].get("column_values", [])}

        # Check if price changed since our audit
        if "numbers" in m["changes"]:
            current_price = current_vals.get("numbers", "")
            expected_before = str(int(m["before"]["price"])) if m["before"]["price"] else ""
            if current_price and current_price != expected_before and current_price != str(m["before"]["price"]):
                log(f"  [{i+1}/{total}] SKIP {monday_id} {m['monday_name'][:40]} — price changed since audit (was {expected_before}, now {current_price})")
                skipped += 1
                results.append({**m, "status": "skipped", "reason": f"price_changed: was {expected_before}, now {current_price}"})
                continue

        # Build column_values JSON for mutation
        col_values = {}
        for col_id, value in m["changes"].items():
            if col_id == "numbers":
                col_values[col_id] = value
            else:
                col_values[col_id] = value

        col_values_str = json.dumps(json.dumps(col_values))

        mutation = 'mutation { change_multiple_column_values(board_id: %d, item_id: %s, column_values: %s) { id } }' % (
            PRICING_BOARD_ID, monday_id, col_values_str
        )

        result = monday_query(mutation, env)

        if result.get("data", {}).get("change_multiple_column_values"):
            success += 1
            change_desc = []
            if "numbers" in m["changes"]:
                change_desc.append(f"price £{m['before']['price']:.0f}→£{float(m['changes']['numbers']):.0f}")
            if "text_mkzdte13" in m["changes"]:
                change_desc.append("shopify_id")
            log(f"  [{i+1}/{total}] OK {m['monday_name'][:40]:40s} {', '.join(change_desc)}")
            results.append({**m, "status": "success"})
        else:
            failed += 1
            error = result.get("errors", result.get("error_message", "unknown"))
            log(f"  [{i+1}/{total}] FAIL {m['monday_name'][:40]} — {error}")
            results.append({**m, "status": "failed", "error": str(error)})

        # Rate limiting — small delay between mutations
        if (i + 1) % 10 == 0:
            time.sleep(1)

    # Save log
    log_data = {
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "board_id": PRICING_BOARD_ID,
        "total": total,
        "success": success,
        "skipped": skipped,
        "failed": failed,
        "mutations": results,
    }
    with open(log_path, "w") as f:
        json.dump(log_data, f, indent=2, default=str)

    log(f"\n{'='*50}")
    log(f"EXECUTION COMPLETE")
    log(f"  Success: {success}")
    log(f"  Skipped: {skipped}")
    log(f"  Failed:  {failed}")
    log(f"  Log: {log_path}")
    log(f"{'='*50}")


def main():
    execute_mode = "--execute" in sys.argv

    catalog = load_catalog()
    mutations = build_mutations(catalog)

    if not mutations:
        print("No mutations needed.")
        return

    if execute_mode:
        env = load_env()
        print(f"\n*** EXECUTING {len(mutations)} mutations on Monday board {PRICING_BOARD_ID} ***")
        print("Press Ctrl+C within 5 seconds to abort...")
        time.sleep(5)
        execute(mutations, env)
    else:
        dry_run(mutations)


if __name__ == "__main__":
    main()
