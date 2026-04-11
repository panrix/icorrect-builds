#!/usr/bin/env python3
"""Phase 3: Three-Way Audit Report

Reads catalog-matched.json and generates a human-readable audit report.
This report must be reviewed before any live system changes.
"""
import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import log

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
REPORTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")


def main():
    os.makedirs(REPORTS_DIR, exist_ok=True)

    with open(os.path.join(DATA_DIR, "catalog-matched.json")) as f:
        data = json.load(f)

    stats = data["stats"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    report_path = os.path.join(REPORTS_DIR, f"audit-{today}.md")

    lines = []
    def w(s=""):
        lines.append(s)

    # -----------------------------------------------------------------------
    # 1. Summary
    # -----------------------------------------------------------------------
    w("# Pricing Sync Audit Report")
    w(f"\n**Generated:** {datetime.now(timezone.utc).isoformat()}")
    w(f"**Source of truth:** Shopify")
    w()
    w("## 1. Summary")
    w()
    w("| Metric | Count |")
    w("|--------|-------|")
    w(f"| Shopify repair products | {stats['shopify_total']} |")
    w(f"| Monday Pricing board items | {stats['monday_pricing_total']} |")
    w(f"| SumUp variations | {stats['sumup_total']} |")
    w(f"| **Monday matched to Shopify** | **{stats['monday_matched']}** ({stats['monday_matched']*100//stats['monday_pricing_total']}%) |")
    w(f"| **SumUp matched to Shopify** | **{stats['sumup_matched']}** ({stats['sumup_matched']*100//stats['sumup_total']}%) |")
    w(f"| Monday price mismatches | {stats['monday_price_mismatches']} |")
    w(f"| SumUp price mismatches | {stats['sumup_price_mismatches']} |")
    w(f"| In Shopify, missing from Monday | {stats['shopify_only_monday']} |")
    w(f"| In Shopify, missing from SumUp | {stats['shopify_only_sumup']} |")
    w(f"| Monday unmatched (legacy/gaps) | {stats['monday_unmatched']} |")
    w(f"| SumUp unmatched (legacy/gaps) | {stats['sumup_unmatched']} |")

    # -----------------------------------------------------------------------
    # 2. Price Mismatches
    # -----------------------------------------------------------------------
    w()
    w("## 2. Price Mismatches")
    w()

    # Monday mismatches
    monday_mm = [m for m in data["monday_matched"] if m.get("price_match") is False]
    monday_mm.sort(key=lambda x: abs(x.get("price_delta") or 0), reverse=True)

    w(f"### Monday vs Shopify ({len(monday_mm)} mismatches)")
    w()
    if monday_mm:
        w("| Device | Repair | Monday | Shopify | Delta |")
        w("|--------|--------|-------:|--------:|------:|")
        for m in monday_mm:
            w(f"| {m['shopify_device'][:35]} | {m['repair_category'][:20]} | {m['monday_price']:>.0f} | {m['shopify_price']:>.0f} | {m['price_delta']:>+.0f} |")
    else:
        w("No mismatches.")

    # SumUp mismatches
    sumup_mm = [s for s in data["sumup_matched"] if s.get("price_match") is False]
    sumup_mm.sort(key=lambda x: abs(x.get("price_delta") or 0), reverse=True)

    w()
    w(f"### SumUp vs Shopify ({len(sumup_mm)} mismatches)")
    w()
    if sumup_mm:
        w("| Device | Repair | SumUp | Shopify | Delta |")
        w("|--------|--------|------:|--------:|------:|")
        for s in sumup_mm:
            w(f"| {s['shopify_device'][:35]} | {s['repair_category'][:20]} | {s['sumup_price']:>.0f} | {s['shopify_price']:>.0f} | {s['price_delta']:>+.0f} |")
    else:
        w("No mismatches.")

    # -----------------------------------------------------------------------
    # 3. Missing Products
    # -----------------------------------------------------------------------
    w()
    w("## 3. Missing Products")
    w()

    w(f"### In Shopify but NOT in Monday ({len(data['shopify_only_monday'])} items)")
    w()
    if data["shopify_only_monday"]:
        w("| Device | Repair | Shopify Price |")
        w("|--------|--------|-------------:|")
        for item in sorted(data["shopify_only_monday"], key=lambda x: (x["shopify_device"], x["repair_category"])):
            w(f"| {item['shopify_device'][:40]} | {item['repair_category'][:20]} | {item['shopify_price']:>.0f} |")

    w()
    w(f"### In Shopify but NOT in SumUp ({len(data['shopify_only_sumup'])} items)")
    w()
    if data["shopify_only_sumup"]:
        w("| Device | Repair | Shopify Price |")
        w("|--------|--------|-------------:|")
        for item in sorted(data["shopify_only_sumup"], key=lambda x: (x["shopify_device"], x["repair_category"])):
            w(f"| {item['shopify_device'][:40]} | {item['repair_category'][:20]} | {item['shopify_price']:>.0f} |")

    # -----------------------------------------------------------------------
    # 4. Naming Inconsistencies
    # -----------------------------------------------------------------------
    w()
    w("## 4. Naming Inconsistencies (Device Names)")
    w()
    w("Items that matched structurally but have different raw device names.")
    w()

    monday_renames = {}
    for m in data["monday_matched"]:
        if m["monday_device"] != m["shopify_device"]:
            key = (m["monday_device"], m["shopify_device"])
            monday_renames[key] = monday_renames.get(key, 0) + 1

    if monday_renames:
        w("### Monday → Shopify renames needed")
        w()
        w("| Monday Name | Shopify Name | Items Affected |")
        w("|-------------|-------------|---------------:|")
        for (mon, shop), count in sorted(monday_renames.items()):
            w(f"| {mon} | {shop} | {count} |")

    sumup_renames = {}
    for s in data["sumup_matched"]:
        if s["sumup_device"] != s["shopify_device"]:
            key = (s["sumup_device"], s["shopify_device"])
            sumup_renames[key] = sumup_renames.get(key, 0) + 1

    if sumup_renames:
        w()
        w("### SumUp → Shopify renames needed")
        w()
        w("| SumUp Name | Shopify Name | Items Affected |")
        w("|------------|-------------|---------------:|")
        for (su, shop), count in sorted(sumup_renames.items()):
            w(f"| {su} | {shop} | {count} |")

    # -----------------------------------------------------------------------
    # 5. Legacy Items
    # -----------------------------------------------------------------------
    w()
    w("## 5. Legacy / Unmatched Items")
    w()
    w("Items in Monday/SumUp with no Shopify equivalent. These may be retired repairs or services not yet on the website.")
    w()

    # Group Monday unmatched by reason
    monday_by_reason = {}
    for item in data["monday_unmatched"]:
        reason = item["reason"].split(":")[0] if ":" in item["reason"] else item["reason"]
        if reason not in monday_by_reason:
            monday_by_reason[reason] = []
        monday_by_reason[reason].append(item)

    w(f"### Monday unmatched ({len(data['monday_unmatched'])} items)")
    w()
    for reason, items in sorted(monday_by_reason.items()):
        w(f"**{reason}** ({len(items)} items)")
        w()
        # Show first 10
        for item in items[:10]:
            price_str = f"£{item['monday_price']:.0f}" if item.get("monday_price") else "no price"
            w(f"- {item['monday_name']} ({price_str})")
        if len(items) > 10:
            w(f"- ... and {len(items) - 10} more")
        w()

    sumup_by_reason = {}
    for item in data["sumup_unmatched"]:
        reason = item["reason"].split(":")[0] if ":" in item["reason"] else item["reason"]
        if reason not in sumup_by_reason:
            sumup_by_reason[reason] = []
        sumup_by_reason[reason].append(item)

    w(f"### SumUp unmatched ({len(data['sumup_unmatched'])} items)")
    w()
    for reason, items in sorted(sumup_by_reason.items()):
        w(f"**{reason}** ({len(items)} items)")
        w()
        for item in items[:10]:
            price_str = f"£{item['sumup_price']:.0f}" if item.get("sumup_price") else "no price"
            w(f"- {item['sumup_device']} → {item['sumup_repair']} ({price_str})")
        if len(items) > 10:
            w(f"- ... and {len(items) - 10} more")
        w()

    # -----------------------------------------------------------------------
    # 6. Action Items
    # -----------------------------------------------------------------------
    w()
    w("## 6. Action Items")
    w()
    w(f"1. **Fix {len(monday_mm)} Monday price mismatches** — update Monday prices to match Shopify")
    w(f"2. **Fix {len(sumup_mm)} SumUp price mismatches** — generate corrected CSV for import")
    w(f"3. **Rename {len(monday_renames)} Monday device groups** to match Shopify naming")
    w(f"4. **Rename {len(sumup_renames)} SumUp parent items** to match Shopify naming")
    w(f"5. **Create {len(data['shopify_only_monday'])} missing Monday items** from Shopify catalog")
    w(f"6. **Create {len(data['shopify_only_sumup'])} missing SumUp items** from Shopify catalog")
    w(f"7. **Populate Shopify IDs** on {stats['monday_matched']} matched Monday items (text_mkzdte13 column)")
    w(f"8. **Review {stats['monday_unmatched']} Monday legacy items** — decide: keep, archive, or delete")
    w(f"9. **Review {stats['sumup_unmatched']} SumUp legacy items** — decide: keep or remove from POS")

    # Write report
    report = "\n".join(lines)
    with open(report_path, "w") as f:
        f.write(report)

    log(f"Audit report written to {report_path}")
    log(f"Report length: {len(lines)} lines")

    # Print top 10 worst to stdout for quick review
    print("\n=== TOP 10 WORST PRICE MISMATCHES (Monday) ===\n")
    for m in monday_mm[:10]:
        print(f"  {m['shopify_device'][:35]:35s} | {m['repair_category']:20s} | Monday: £{m['monday_price']:>6.0f} → Shopify: £{m['shopify_price']:>6.0f} | Delta: £{m['price_delta']:>+6.0f}")

    print("\n=== TOP 10 WORST PRICE MISMATCHES (SumUp) ===\n")
    for s in sumup_mm[:10]:
        print(f"  {s['shopify_device'][:35]:35s} | {s['repair_category']:20s} | SumUp:  £{s['sumup_price']:>6.0f} → Shopify: £{s['shopify_price']:>6.0f} | Delta: £{s['price_delta']:>+6.0f}")


if __name__ == "__main__":
    main()
