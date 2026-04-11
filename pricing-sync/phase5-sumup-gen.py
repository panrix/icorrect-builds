#!/usr/bin/env python3
"""Phase 5: SumUp CSV Generator

Generates a corrected SumUp CSV with Shopify pricing and naming.
Preserves all existing Item IDs and Variant IDs.
"""
import csv
import json
import os
import sys
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import log

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
REPORTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")


def main():
    os.makedirs(REPORTS_DIR, exist_ok=True)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Load matched catalog
    with open(os.path.join(DATA_DIR, "catalog-matched.json")) as f:
        catalog = json.load(f)

    # Build SumUp lookup: (sumup_device, sumup_repair) -> matched entry
    sumup_lookup = {}
    for m in catalog["sumup_matched"]:
        key = (m["sumup_device"], m["sumup_repair"])
        sumup_lookup[key] = m

    # Read original CSV
    original_path = os.path.join(DATA_DIR, "sumup-export-original.csv")
    with open(original_path, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows = list(reader)

    # Find column indices
    col_idx = {name: i for i, name in enumerate(header)}
    item_name_idx = col_idx["Item name"]
    variation_idx = col_idx["Variations"]
    price_idx = col_idx["Price"]
    item_id_idx = col_idx["Item id (Do not change)"]
    variant_id_idx = col_idx["Variant id (Do not change)"]
    seo_title_idx = col_idx.get("SEO title (Online Store only)")

    # Build device name lookup from name aliases
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "config", "name-aliases.json")) as f:
        name_aliases = json.load(f)
    sumup_device_map = name_aliases.get("sumup_to_shopify", {})

    # Process rows
    changes = []
    current_device = None
    current_shopify_device = None
    output_rows = []

    for row in rows:
        item_name = row[item_name_idx].strip()
        variation = row[variation_idx].strip()

        if item_name and not variation:
            # Parent row — device
            current_device = item_name
            current_shopify_device = sumup_device_map.get(item_name, item_name)

            new_row = list(row)
            if current_shopify_device and current_shopify_device != item_name:
                new_row[item_name_idx] = current_shopify_device
                if seo_title_idx is not None and row[seo_title_idx]:
                    new_row[seo_title_idx] = current_shopify_device
                changes.append({
                    "type": "device_rename",
                    "old": item_name,
                    "new": current_shopify_device,
                    "item_id": row[item_id_idx],
                })
            output_rows.append(new_row)

        elif variation and current_device:
            # Variation row — repair
            key = (current_device, variation)
            matched = sumup_lookup.get(key)

            new_row = list(row)

            if matched:
                # Update price if different
                old_price = row[price_idx].strip()
                new_price = f"{matched['shopify_price']:.2f}"
                if old_price != new_price:
                    new_row[price_idx] = new_price
                    changes.append({
                        "type": "price_update",
                        "device": current_device,
                        "repair": variation,
                        "old_price": old_price,
                        "new_price": new_price,
                        "variant_id": row[variant_id_idx],
                    })

            output_rows.append(new_row)
        else:
            # Orphan or empty row — keep as-is
            output_rows.append(list(row))

    # Write corrected CSV
    output_path = os.path.join(DATA_DIR, "sumup-corrected.csv")
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(output_rows)

    # Summary
    device_renames = [c for c in changes if c["type"] == "device_rename"]
    price_updates = [c for c in changes if c["type"] == "price_update"]

    log(f"SumUp CSV generated: {output_path}")
    log(f"  Original rows: {len(rows)}")
    log(f"  Output rows: {len(output_rows)}")
    log(f"  Device renames: {len(device_renames)}")
    log(f"  Price updates: {len(price_updates)}")

    # Write changes report
    report_path = os.path.join(REPORTS_DIR, f"sumup-changes-{today}.md")
    report_lines = []
    report_lines.append(f"# SumUp CSV Changes Report")
    report_lines.append(f"\n**Generated:** {datetime.now(timezone.utc).isoformat()}")
    report_lines.append(f"**Original rows:** {len(rows)}")
    report_lines.append(f"**Output rows:** {len(output_rows)}")
    report_lines.append(f"**Device renames:** {len(device_renames)}")
    report_lines.append(f"**Price updates:** {len(price_updates)}")

    if device_renames:
        report_lines.append(f"\n## Device Renames ({len(device_renames)})\n")
        report_lines.append("| Old Name | New Name |")
        report_lines.append("|----------|----------|")
        for c in device_renames:
            report_lines.append(f"| {c['old']} | {c['new']} |")

    if price_updates:
        report_lines.append(f"\n## Price Updates ({len(price_updates)})\n")
        report_lines.append("| Device | Repair | Old Price | New Price | Delta |")
        report_lines.append("|--------|--------|----------:|----------:|------:|")
        for c in sorted(price_updates, key=lambda x: abs(float(x["new_price"]) - float(x["old_price"])), reverse=True):
            delta = float(c["new_price"]) - float(c["old_price"])
            report_lines.append(f"| {c['device'][:30]} | {c['repair'][:25]} | {c['old_price']} | {c['new_price']} | {delta:>+.0f} |")

    with open(report_path, "w") as f:
        f.write("\n".join(report_lines))

    log(f"  Changes report: {report_path}")

    # Print preview
    print(f"\n{'='*60}")
    print(f"SUMUP CSV GENERATED")
    print(f"{'='*60}")
    print(f"  Output: {output_path}")
    print(f"  Rows: {len(output_rows)} (original: {len(rows)})")
    print(f"  Device renames: {len(device_renames)}")
    print(f"  Price updates: {len(price_updates)}")

    if price_updates:
        print(f"\n  Top 10 price changes:")
        for c in sorted(price_updates, key=lambda x: abs(float(x["new_price"]) - float(x["old_price"])), reverse=True)[:10]:
            delta = float(c["new_price"]) - float(c["old_price"])
            print(f"    {c['device'][:30]:30s} {c['repair'][:25]:25s} £{c['old_price']:>6s} → £{c['new_price']:>6s} (£{delta:>+6.0f})")

    print(f"\n  Import {output_path} into SumUp to apply changes.")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
