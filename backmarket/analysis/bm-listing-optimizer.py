#!/usr/bin/env python3
import json
import csv
import sys
import os
import argparse
from datetime import datetime, timedelta
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bm_utils import get_min_net_tier, calc_max_offer


BASE = "/home/ricky/builds/backmarket"
CROSSREF_PATH = f"{BASE}/api/bm-crossref-data.json"
TRADEIN_PATH = f"{BASE}/docs/Backmarket Trade-in Data - Sheet1.csv"
LISTINGS_PATH = f"{BASE}/docs/Buy_Back_Listings_2602.csv"
SHIPPING = 15.0


def percentile_75(values):
    if not values:
        return 0.0
    s = sorted(values)
    n = len(s)
    idx = 0.75 * (n - 1)
    lo = int(idx)
    hi = lo + 1
    if hi >= n:
        return s[lo]
    frac = idx - lo
    return s[lo] + frac * (s[hi] - s[lo])


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def extract_internal_grade(monday_sku):
    if not monday_sku:
        return "unknown"
    last = monday_sku.strip().split(".")[-1].lower()
    if last == "fair":
        return "fair"
    if last == "good":
        return "good"
    if last in ("vgood", "excellent"):
        return "excellent"
    return "unknown"


def load_crossref():
    with open(CROSSREF_PATH) as f:
        return json.load(f)


def load_tradein():
    with open(TRADEIN_PATH) as f:
        return list(csv.DictReader(f))


def load_listings():
    with open(LISTINGS_PATH) as f:
        return list(csv.DictReader(f))


def safe_float(val, default=0.0):
    if val is None or val == "" or val == "None":
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def filter_by_months(crossref, months):
    cutoff = datetime.now() - timedelta(days=months * 30)
    filtered = []
    for o in crossref:
        created = o.get("created", "")
        if not created:
            continue
        try:
            dt = datetime.strptime(created[:10], "%Y-%m-%d")
            if dt >= cutoff:
                filtered.append(o)
        except ValueError:
            continue
    return filtered


def join_data(crossref, tradein, listings):
    tradein_by_oid = {}
    for r in tradein:
        oid = r.get("orderPublicId", "").strip()
        if oid:
            tradein_by_oid[oid] = r

    listings_by_sku = defaultdict(list)
    for l in listings:
        sku = l.get("sku", "").strip()
        if sku and sku != "None":
            listings_by_sku[sku].append(l)

    sku_orders = defaultdict(list)
    sku_grade_orders = defaultdict(lambda: defaultdict(list))
    matched = 0
    unmatched_no_tradein = 0
    unmatched_no_sku = 0

    for order in crossref:
        oid = order.get("order_id", "")
        tradein_row = tradein_by_oid.get(oid)
        if not tradein_row:
            unmatched_no_tradein += 1
            continue

        listing_sku = tradein_row.get("listingSku", "").strip()
        if not listing_sku:
            unmatched_no_sku += 1
            continue

        matched += 1
        grade = extract_internal_grade(order.get("monday_sku", ""))
        sku_orders[listing_sku].append(order)
        sku_grade_orders[listing_sku][grade].append(order)

    log(f"  Crossref orders: {len(crossref)}")
    log(f"  Matched to trade-in + SKU: {matched}")
    log(f"  No trade-in match: {unmatched_no_tradein}")
    log(f"  Trade-in but no listingSku: {unmatched_no_sku}")
    log(f"  Unique SKUs with order data: {len(sku_orders)}")

    return sku_orders, sku_grade_orders, listings_by_sku


def compute_grade_stats(orders):
    sales = [o["sale"] for o in orders if o.get("sale") and o["sale"] > 0]
    if not sales:
        return None

    nets = [o["net"] for o in orders if o.get("net") is not None]
    parts = [o["parts"] for o in orders if o.get("parts") is not None]
    labours = [o["labour"] for o in orders if o.get("labour") is not None]
    taxes = [o["tax"] for o in orders if o.get("tax") is not None]
    purchases = [o["purchase"] for o in orders if o.get("purchase") is not None]

    avg_sale = sum(sales) / len(sales)
    avg_net = sum(nets) / len(nets) if nets else 0
    total_net = sum(nets) if nets else 0
    parts_75th = percentile_75(parts) if parts else 0
    avg_labour = sum(labours) / len(labours) if labours else 0
    avg_tax = sum(taxes) / len(taxes) if taxes else 0
    avg_purchase = sum(purchases) / len(purchases) if purchases else 0
    bm_fee = avg_sale * 0.10
    loss_count = sum(1 for n in nets if n < 0)
    loss_rate = loss_count / len(nets) if nets else 0

    return {
        "order_count": len(sales),
        "avg_sale": round(avg_sale, 2),
        "avg_purchase": round(avg_purchase, 2),
        "avg_net": round(avg_net, 2),
        "total_net": round(total_net, 2),
        "parts_75th": round(parts_75th, 2),
        "avg_labour": round(avg_labour, 2),
        "bm_fee": round(bm_fee, 2),
        "avg_tax": round(avg_tax, 2),
        "loss_rate": round(loss_rate, 4),
    }


def compute_sku_stats(sku, grade_orders, min_net_override=None):
    tier = min_net_override if min_net_override is not None else get_min_net_tier(sku)

    grade_stats = {}
    for grade in ("fair", "good", "excellent", "unknown"):
        orders = grade_orders.get(grade, [])
        if orders:
            stats = compute_grade_stats(orders)
            if stats:
                grade_stats[grade] = stats

    if not grade_stats:
        return None

    # Max offer based on Fair grade (plan for worst case)
    # If no Fair data, fall back to all orders combined
    if "fair" in grade_stats:
        base = grade_stats["fair"]
    else:
        all_orders = []
        for orders in grade_orders.values():
            all_orders.extend(orders)
        base = compute_grade_stats(all_orders)
        if not base:
            return None

    max_offer = calc_max_offer(
        base["avg_sale"], base["bm_fee"], base["avg_tax"],
        base["parts_75th"], base["avg_labour"], SHIPPING, tier
    )

    # Totals across all grades
    total_orders = sum(gs["order_count"] for gs in grade_stats.values())
    total_net = sum(gs["total_net"] for gs in grade_stats.values())
    weighted_avg_net = total_net / total_orders if total_orders else 0
    overall_loss = sum(gs["loss_rate"] * gs["order_count"] for gs in grade_stats.values()) / total_orders if total_orders else 0

    return {
        "tier": tier,
        "max_offer": max_offer,
        "max_offer_based_on": "fair" if "fair" in grade_stats else "all_grades",
        "total_orders": total_orders,
        "total_net": round(total_net, 2),
        "avg_net": round(weighted_avg_net, 2),
        "loss_rate": round(overall_loss, 4),
        "by_grade": grade_stats,
    }


def classify_listings(sku_grade_orders, listings_by_sku, raw_listings, min_net_override=None):
    results = []
    counts = {"KEEP": 0, "REPRICE": 0, "DELIST": 0, "DEAD": 0}
    sku_stats_cache = {}

    for sku, grade_orders in sku_grade_orders.items():
        stats = compute_sku_stats(sku, grade_orders, min_net_override)
        if stats:
            sku_stats_cache[sku] = stats

    for sku in sorted(listings_by_sku.keys()):
        listing_rows = listings_by_sku[sku]
        stats = sku_stats_cache.get(sku)

        for listing in listing_rows:
            current_price = safe_float(listing.get("price"))

            entry = {
                "sku": sku,
                "listing_id": listing.get("listing_id", ""),
                "current_price": current_price,
                "grade_code": listing.get("grade_code", ""),
                "grade": listing.get("grade", ""),
                "title": listing.get("title", ""),
            }

            if stats is None:
                entry["action"] = "DEAD"
                counts["DEAD"] += 1
            elif stats["max_offer"] <= 0:
                entry["action"] = "DELIST"
                entry.update({k: v for k, v in stats.items() if k != "by_grade"})
                entry["by_grade"] = stats["by_grade"]
                counts["DELIST"] += 1
            elif current_price <= stats["max_offer"]:
                entry["action"] = "KEEP"
                entry.update({k: v for k, v in stats.items() if k != "by_grade"})
                entry["by_grade"] = stats["by_grade"]
                counts["KEEP"] += 1
            else:
                entry["action"] = "REPRICE"
                entry.update({k: v for k, v in stats.items() if k != "by_grade"})
                entry["by_grade"] = stats["by_grade"]
                counts["REPRICE"] += 1

            results.append(entry)

    for listing in raw_listings:
        sku = listing.get("sku", "").strip()
        if not sku or sku == "None":
            entry = {
                "sku": "",
                "listing_id": listing.get("listing_id", ""),
                "current_price": safe_float(listing.get("price")),
                "grade_code": listing.get("grade_code", ""),
                "grade": listing.get("grade", ""),
                "title": listing.get("title", ""),
                "action": "DEAD",
            }
            counts["DEAD"] += 1
            results.append(entry)

    return results, counts


def print_summary(results, counts, label=""):
    total = sum(counts.values())
    skus_with_data = len(set(r["sku"] for r in results if r["action"] != "DEAD" and r["sku"]))

    print()
    print("=" * 70)
    if label:
        print(f"BM LISTING OPTIMISER — {label}")
    else:
        print("BM LISTING OPTIMISER RESULTS")
    print("Max offer based on FAIR grade economics (worst case)")
    print("=" * 70)
    print(f"Total listings: {total:,}")
    print(f"SKUs with order data: {skus_with_data}")
    print()
    print(f"  KEEP:    {counts['KEEP']:>5} listings (current price OK)")
    print(f"  REPRICE: {counts['REPRICE']:>5} listings (overpaying)")
    print(f"  DELIST:  {counts['DELIST']:>5} listings (can't be profitable)")
    print(f"  DEAD:    {counts['DEAD']:>5} listings (no orders ever)")
    print()

    active = [r for r in results if r["action"] != "DEAD" and r.get("by_grade")]
    seen = set()
    unique_active = []
    for r in active:
        if r["sku"] not in seen:
            seen.add(r["sku"])
            unique_active.append(r)

    print("Top 10 SKUs — Fair vs Good/Excellent breakdown:")
    print(f"{'SKU':<52} {'MaxOff':>6} {'FairSale':>9} {'FairNet':>8} {'GoodSale':>9} {'GoodNet':>8} {'Action':>8}")
    print("-" * 110)

    top = sorted(unique_active, key=lambda x: x.get("total_net", 0), reverse=True)[:10]
    for r in top:
        bg = r.get("by_grade", {})
        fair = bg.get("fair", {})
        good = bg.get("good", {})
        exc = bg.get("excellent", {})
        good_or_exc = good if good else exc
        fair_sale = f"£{fair['avg_sale']:.0f}" if fair else "-"
        fair_net = f"£{fair['avg_net']:.0f}" if fair else "-"
        good_sale = f"£{good_or_exc['avg_sale']:.0f}" if good_or_exc else "-"
        good_net = f"£{good_or_exc['avg_net']:.0f}" if good_or_exc else "-"
        print(f"{r['sku'][:52]:<52} {r['max_offer']:>5.0f} {fair_sale:>9} {fair_net:>8} {good_sale:>9} {good_net:>8} {r['action']:>8}")

    print()

    reprice = sorted(
        [r for r in results if r["action"] == "REPRICE"],
        key=lambda x: x["current_price"] - x["max_offer"],
        reverse=True
    )
    if reprice:
        print("Top 10 overpaying:")
        for r in reprice[:10]:
            overpay = r["current_price"] - r["max_offer"]
            print(f"  {r['sku'][:52]:<52} current £{r['current_price']:>6.0f}  max £{r['max_offer']:>6.0f}  overpay £{overpay:>5.0f}")
    print()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--months", type=int, default=0)
    parser.add_argument("--min-net", type=int, default=0)
    parser.add_argument("--output", type=str, default="")
    args = parser.parse_args()

    output_path = args.output if args.output else f"{BASE}/audit/listing-decisions.json"
    min_net_override = args.min_net if args.min_net > 0 else None

    label_parts = []
    if args.months:
        label_parts.append(f"Last {args.months} months")
    else:
        label_parts.append("All data")
    if min_net_override:
        label_parts.append(f"£{min_net_override} flat minimum")
    else:
        label_parts.append("Tiered (£100/£200)")
    label = " | ".join(label_parts)

    log(f"Config: {label}")
    log("Loading data...")
    crossref = load_crossref()
    tradein = load_tradein()
    listings = load_listings()

    if args.months:
        original = len(crossref)
        crossref = filter_by_months(crossref, args.months)
        log(f"  Filtered to last {args.months} months: {len(crossref)} of {original} orders")

    log(f"  Crossref: {len(crossref)} orders")
    log(f"  Trade-in: {len(tradein)} rows")
    log(f"  Listings: {len(listings)} rows")

    log("Joining data...")
    sku_orders, sku_grade_orders, listings_by_sku = join_data(crossref, tradein, listings)

    log("Classifying listings...")
    results, counts = classify_listings(sku_grade_orders, listings_by_sku, listings, min_net_override)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    data_months = args.months if args.months else 10
    output = {
        "generated": datetime.now().isoformat(),
        "config": {
            "months": args.months if args.months else "all",
            "min_net": min_net_override if min_net_override else "tiered",
            "data_months": data_months,
            "max_offer_basis": "fair_grade",
        },
        "summary": {
            "total_listings": sum(counts.values()),
            "keep": counts["KEEP"],
            "reprice": counts["REPRICE"],
            "delist": counts["DELIST"],
            "dead": counts["DEAD"],
            "skus_with_data": len(sku_orders),
        },
        "listings": results,
    }
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    log(f"Saved to {output_path}")

    print_summary(results, counts, label)


if __name__ == "__main__":
    main()
