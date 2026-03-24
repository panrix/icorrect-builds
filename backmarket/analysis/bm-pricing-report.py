#!/usr/bin/env python3
import json
import sys
import os
import argparse
from datetime import datetime
from collections import defaultdict

BASE = "/home/ricky/builds/backmarket"


def load_decisions(path):
    with open(path) as f:
        return json.load(f)


def unique_skus(listings):
    seen = {}
    for l in listings:
        sku = l["sku"]
        if sku and sku not in seen:
            seen[sku] = l
    return list(seen.values())


def fmt(val):
    if val is None:
        return "-"
    return f"\u00a3{val:,.0f}"


def grade_cell(by_grade, grade_key, field):
    g = by_grade.get(grade_key, {})
    if not g:
        return "-"
    val = g.get(field)
    if val is None:
        return "-"
    return f"\u00a3{val:,.0f}"


def grade_count(by_grade, grade_key):
    g = by_grade.get(grade_key, {})
    return str(g.get("order_count", 0)) if g else "-"


def generate_report(data):
    summary = data["summary"]
    listings = data["listings"]
    config = data.get("config", {})

    data_months = config.get("data_months", 10)
    months_label = config.get("months", "all")
    min_net_label = config.get("min_net", "tiered")

    if months_label == "all" or months_label == 0:
        period_desc = "~10 months (Apr 2025 - Feb 2026)"
    else:
        period_desc = f"Last {months_label} months (Dec 2025 - Feb 2026)"

    if min_net_label == "tiered":
        tier_desc = "Tiered: \u00a3100 (older) / \u00a3200 (M2+, MBP 14-16\")"
    else:
        tier_desc = f"Flat \u00a3{min_net_label} minimum per sale"

    groups = defaultdict(list)
    for l in listings:
        groups[l["action"]].append(l)

    keep = groups.get("KEEP", [])
    reprice = groups.get("REPRICE", [])
    delist = groups.get("DELIST", [])
    dead = groups.get("DEAD", [])

    lines = []
    w = lines.append

    w("# BackMarket Buyback Pricing Report")
    w(f"\n**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    w(f"**Data period:** {period_desc}")
    w(f"**Min net target:** {tier_desc}")
    w(f"**Max offer basis:** Fair grade economics (plan for worst case)")
    w(f"**Warning:** Apple M5 + budget Mac expected March 2026 — M1/M2 sale prices will drop further.")
    w("")

    # 1. Executive Summary
    w("## 1. Executive Summary")
    w("")
    total = summary["total_listings"]
    w("| Category | Listings | % |")
    w("|----------|---------|---|")
    for cat, count in [("KEEP", summary["keep"]), ("REPRICE", summary["reprice"]),
                       ("DELIST", summary["delist"]), ("DEAD", summary["dead"])]:
        pct = count / total * 100
        w(f"| {cat} | {count:,} | {pct:.1f}% |")
    w(f"| **Total** | **{total:,}** | **100%** |")
    w("")

    # 2. Top 30 with grade breakdown
    w("## 2. Top 30 SKUs by Net Profit (with Grade Breakdown)")
    w("")
    w("Max offer is set by **Fair grade** sale prices and costs. Good/Excellent sales are upside.")
    w("")
    active = [l for l in listings if l["action"] != "DEAD" and l.get("total_net") is not None]
    active_unique = unique_skus(active)
    active_sorted = sorted(active_unique, key=lambda x: x.get("total_net", 0), reverse=True)[:30]

    w("| # | SKU | Fair Ord | Fair Sale | Fair Net | Good Ord | Good Sale | Good Net | Max Offer | Action |")
    w("|---|-----|----------|----------|----------|----------|-----------|----------|-----------|--------|")
    for i, r in enumerate(active_sorted, 1):
        bg = r.get("by_grade", {})
        w(f"| {i} | {r['sku']} | {grade_count(bg,'fair')} | {grade_cell(bg,'fair','avg_sale')} | {grade_cell(bg,'fair','avg_net')} | {grade_count(bg,'good')} | {grade_cell(bg,'good','avg_sale')} | {grade_cell(bg,'good','avg_net')} | {fmt(r['max_offer'])} | {r['action']} |")
    w("")

    # 3. Repricing Actions
    w("## 3. Repricing Actions")
    w("")
    reprice_unique = unique_skus(reprice)
    reprice_sorted = sorted(reprice_unique, key=lambda x: x["current_price"] - x["max_offer"], reverse=True)

    if not reprice_sorted:
        w("No listings need repricing.")
    else:
        total_monthly_overspend = 0
        w(f"**{len(reprice)} listings across {len(reprice_sorted)} SKUs need repricing.**")
        w("")
        w("| SKU | Orders | Current | Max Offer | Overpay/Unit | Mo. Orders | Mo. Overspend |")
        w("|-----|--------|---------|-----------|-------------|------------|---------------|")
        for r in reprice_sorted:
            sku_listings = [l for l in reprice if l["sku"] == r["sku"]]
            avg_current = sum(l["current_price"] for l in sku_listings) / len(sku_listings)
            overpay = avg_current - r["max_offer"]
            total_ord = r.get("total_orders", 0)
            monthly_orders = total_ord / data_months
            monthly_overspend = overpay * monthly_orders
            total_monthly_overspend += monthly_overspend
            w(f"| {r['sku']} | {total_ord} | {fmt(avg_current)} | {fmt(r['max_offer'])} | {fmt(overpay)} | {monthly_orders:.1f} | {fmt(monthly_overspend)} |")
        w("")
        w(f"**Total estimated monthly overspend: {fmt(total_monthly_overspend)}**")
    w("")

    # 4. Delist Candidates
    w("## 4. Delist Candidates")
    w("")
    delist_unique = unique_skus(delist)
    if not delist_unique:
        w("No SKUs need delisting.")
    else:
        delist_orders = sum(r.get("total_orders", 0) for r in delist_unique)
        delist_net = sum(r.get("total_net", 0) for r in delist_unique)
        w(f"**{len(delist)} listings across {len(delist_unique)} SKUs cannot hit the minimum at Fair grade economics.**")
        w(f"These generated {delist_orders} orders / {fmt(delist_net)} net — but Fair grade costs make them unsustainable.")
        w("")
        w("| SKU | Fair Ord | Fair Sale | Fair Net | Good Ord | Good Net | Why |")
        w("|-----|----------|----------|----------|----------|----------|-----|")
        for r in sorted(delist_unique, key=lambda x: x.get("total_net", 0), reverse=True):
            bg = r.get("by_grade", {})
            fair = bg.get("fair", {})
            if fair.get("avg_labour", 0) > fair.get("avg_sale", 0) * 0.3:
                why = "High labour"
            elif fair.get("parts_75th", 0) > fair.get("avg_sale", 0) * 0.2:
                why = "High parts"
            elif fair.get("avg_sale", 0) and fair["avg_sale"] < 400:
                why = "Low Fair sale price"
            else:
                why = "Costs exceed margin"
            w(f"| {r['sku']} | {grade_count(bg,'fair')} | {grade_cell(bg,'fair','avg_sale')} | {grade_cell(bg,'fair','avg_net')} | {grade_count(bg,'good')} | {grade_cell(bg,'good','avg_net')} | {why} |")
    w("")

    # 5. Dead Listings
    w("## 5. Dead Listings")
    w("")
    dead_with_price = [l for l in dead if l["current_price"] > 0]
    w(f"| Metric | Count |")
    w(f"|--------|-------|")
    w(f"| Total dead | {len(dead):,} |")
    w(f"| With non-zero price | {len(dead_with_price):,} |")
    w(f"| With zero price | {len(dead) - len(dead_with_price):,} |")
    w("")
    dead_by_type = defaultdict(int)
    for l in dead:
        sku = l.get("sku", "")
        if not sku:
            dead_by_type["No SKU"] += 1
        elif sku.startswith("MBA"):
            dead_by_type["MacBook Air"] += 1
        elif sku.startswith("MBP"):
            dead_by_type["MacBook Pro"] += 1
        else:
            dead_by_type["Other"] += 1
    w("| Device | Count |")
    w("|--------|-------|")
    for dtype, count in sorted(dead_by_type.items(), key=lambda x: -x[1]):
        w(f"| {dtype} | {count:,} |")
    w("")

    # 6. Projected Impact
    w("## 6. Projected Impact")
    w("")
    active_all = [l for l in listings if l["action"] in ("KEEP", "REPRICE", "DELIST") and l.get("total_net") is not None]
    active_all_unique = unique_skus(active_all)
    current_monthly_net = sum(r["total_net"] for r in active_all_unique) / data_months

    keep_monthly = sum(r["total_net"] for r in unique_skus(keep) if r.get("total_net")) / data_months

    reprice_monthly_current = sum(r["total_net"] for r in unique_skus(reprice) if r.get("total_net")) / data_months
    reprice_savings = 0
    for r in unique_skus(reprice):
        sku_listings = [l for l in reprice if l["sku"] == r["sku"]]
        avg_current = sum(l["current_price"] for l in sku_listings) / len(sku_listings)
        overpay = avg_current - r["max_offer"]
        monthly_orders = r.get("total_orders", 0) / data_months
        reprice_savings += overpay * monthly_orders

    projected_monthly = keep_monthly + reprice_monthly_current + reprice_savings
    delist_monthly = sum(r.get("total_net", 0) for r in unique_skus(delist)) / data_months

    w("| Metric | Current | After Changes | Change |")
    w("|--------|---------|---------------|--------|")
    w(f"| Monthly net | {fmt(current_monthly_net)} | {fmt(projected_monthly)} | +{fmt(projected_monthly - current_monthly_net)} |")
    w(f"| Annualised | {fmt(current_monthly_net * 12)} | {fmt(projected_monthly * 12)} | +{fmt((projected_monthly - current_monthly_net) * 12)} |")
    w("")

    keep_unique = unique_skus(keep)
    reprice_uniq = unique_skus(reprice)
    delist_uniq = unique_skus(delist)
    keep_orders = sum(r.get("total_orders", 0) for r in keep_unique)
    reprice_orders = sum(r.get("total_orders", 0) for r in reprice_uniq)
    keep_avg_net = sum(r.get("avg_net", 0) * r.get("total_orders", 0) for r in keep_unique) / keep_orders if keep_orders else 0

    w("**Breakdown:**")
    w(f"- KEEP: {len(keep_unique)} SKUs, {keep_orders} orders, {fmt(keep_avg_net)} avg net/order")
    w(f"- REPRICE: {len(reprice_uniq)} SKUs, {reprice_orders} orders, saves {fmt(reprice_savings)}/month")
    w(f"- DELIST: {len(delist_uniq)} SKUs removed (was {fmt(delist_monthly)}/month)")
    w("")
    w("**Risk factors:**")
    w("- Apple M5 + budget Mac expected March 2026 — will compress M1/M2 further")
    w("- MBA M1 Fair grade: £399 → £341-376 in Jan-Feb, parts £0 → £86")
    w("- Max offers based on Fair grade — Good/Excellent sales are pure upside on top")
    w("- Post-M5 announcement, re-run this analysis with fresh data")
    w("")
    w("---")
    w(f"*Generated by bm-pricing-report.py on {datetime.now().strftime('%Y-%m-%d %H:%M')}*")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=str, required=True)
    parser.add_argument("--output", type=str, default="")
    args = parser.parse_args()

    output_path = args.output if args.output else f"{BASE}/audit/pricing-report-{datetime.now().strftime('%Y-%m-%d')}.md"

    print(f"Loading {args.input}...", file=sys.stderr)
    data = load_decisions(args.input)
    print("Generating report...", file=sys.stderr)
    report = generate_report(data)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        f.write(report)
    print(f"Saved to {output_path}", file=sys.stderr)
    print(report)


if __name__ == "__main__":
    main()
