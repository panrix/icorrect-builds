import json
from collections import defaultdict
from datetime import datetime

# Load cached data
with open("/tmp/bm-audit-data.json") as f:
    records = json.load(f)

SHIPPING = 15.0

def parse_num(val):
    if not val or str(val) in ["None", "null", ""]:
        return None
    try:
        return float(str(val).replace(",", "").replace("\u00a3", "").replace("%", "").replace('"', '').strip())
    except ValueError:
        return None

# Build analysis records for sold items
sold = []
for r in records:
    if not r["sale"] or not r["date_sold"]:
        continue
    sale = r["sale"]
    purchase = r["purchase"] or 0
    bm_fee = r["bm_fee"] or 0
    tax = r["tax"] or 0

    # Gross profit = before parts & labour
    gross = sale - purchase - bm_fee - tax - SHIPPING
    gross_pct = (gross / sale * 100) if sale else 0

    sold.append({
        "name": r["name"],
        "sku": r["sku"] or "NO_SKU",
        "device": r["device"] or "",
        "sale": sale,
        "purchase": purchase,
        "bm_fee": bm_fee,
        "tax": tax,
        "gross": round(gross, 2),
        "gross_pct": round(gross_pct, 1),
        "date_sold": r["date_sold"],
        "date_purchased": r["date_purchased"],
        "group": r["group"],
    })

sold.sort(key=lambda x: x["date_sold"])

# Group by SKU
by_sku = defaultdict(list)
for r in sold:
    by_sku[r["sku"]].append(r)

# ============================================================
# SKU STATS
# ============================================================
sku_stats = []
for sku, items in by_sku.items():
    sales = [i["sale"] for i in items]
    purchases = [i["purchase"] for i in items]
    grosses = [i["gross"] for i in items]
    gross_pcts = [i["gross_pct"] for i in items]

    avg_sale = sum(sales) / len(sales)
    avg_purchase = sum(purchases) / len(purchases)
    avg_gross = sum(grosses) / len(grosses)
    avg_pct = sum(gross_pcts) / len(gross_pcts)
    min_pct = min(gross_pcts)
    max_pct = max(gross_pcts)
    total_gross = sum(grosses)
    loss_count = sum(1 for g in grosses if g < 0)

    # Sale price trend
    sorted_items = sorted(items, key=lambda x: x["date_sold"])
    first_sale = sorted_items[0]["sale"]
    last_sale = sorted_items[-1]["sale"]
    first_date = sorted_items[0]["date_sold"]
    last_date = sorted_items[-1]["date_sold"]
    price_change = last_sale - first_sale
    price_change_pct = (price_change / first_sale * 100) if first_sale else 0

    sku_stats.append({
        "sku": sku,
        "count": len(items),
        "avg_sale": avg_sale,
        "avg_purchase": avg_purchase,
        "avg_gross": avg_gross,
        "avg_pct": avg_pct,
        "min_pct": min_pct,
        "max_pct": max_pct,
        "total_gross": total_gross,
        "loss_count": loss_count,
        "first_sale": first_sale,
        "last_sale": last_sale,
        "first_date": first_date,
        "last_date": last_date,
        "price_change": price_change,
        "price_change_pct": price_change_pct,
        "items": items,
    })

sku_stats.sort(key=lambda x: x["avg_pct"])

# ============================================================
# PRINT AUDIT DOCUMENT
# ============================================================
print("=" * 130)
print("BACKMARKET TRADE-IN / SALES AUDIT")
print("Generated: %s" % datetime.now().strftime("%Y-%m-%d %H:%M"))
print("Data: %d total items, %d sold" % (len(records), len(sold)))
print("=" * 130)
print()
print("NOTE: 'Gross Profit' = Sale - Purchase - BM Fee (10%%) - Tax - \u00a315 shipping")
print("      This is BEFORE parts cost and labour deductions.")
print("      Typical parts + labour = \u00a350-\u00a3200/item. Net profit is lower.")
print()

# ============================================================
# 1. EXECUTIVE SUMMARY
# ============================================================
total_revenue = sum(r["sale"] for r in sold)
total_gross = sum(r["gross"] for r in sold)
avg_margin = (total_gross / total_revenue * 100) if total_revenue else 0
losses = [r for r in sold if r["gross"] < 0]
low = [r for r in sold if 0 <= r["gross_pct"] < 15]

print("--- 1. EXECUTIVE SUMMARY ---")
print()
print("  Total items sold:       %d" % len(sold))
print("  Total revenue:          \u00a3%s" % "{:,.0f}".format(total_revenue))
print("  Total gross profit:     \u00a3%s" % "{:,.0f}".format(total_gross))
print("  Average gross margin:   %.1f%%" % avg_margin)
print("  Loss-making items:      %d (%.0f%%)" % (len(losses), len(losses)/len(sold)*100))
print("  Low margin (<15%%):      %d (%.0f%%)" % (len(low), len(low)/len(sold)*100))
print("  Unique SKUs:            %d" % len(by_sku))
print()

# ============================================================
# 2. SKU PERFORMANCE TABLE (sorted by avg gross %)
# ============================================================
print("--- 2. SKU PERFORMANCE (sorted by avg gross %%, SKUs with 3+ sales) ---")
print()
print("%-55s %5s %7s %7s %7s %6s %6s %8s %5s" % (
    "SKU", "Sold", "AvgSale", "AvgPur", "AvgGrs", "Avg%", "Min%", "TotGross", "Loss"))
print("-" * 130)

multi_skus = [s for s in sku_stats if s["count"] >= 3]
for s in multi_skus:
    flag = ""
    if s["avg_pct"] < 15:
        flag = " *"
    if s["loss_count"] > 0:
        flag = " **"
    print("%-55s %5d %7.0f %7.0f %7.0f %5.1f%% %5.1f%% %8.0f %5d%s" % (
        s["sku"][:55], s["count"], s["avg_sale"], s["avg_purchase"],
        s["avg_gross"], s["avg_pct"], s["min_pct"], s["total_gross"],
        s["loss_count"], flag))

print()
print("  * = avg margin < 15%%    ** = has loss-making sales")
print()

# ============================================================
# 3. DEEP DIVE: MBA.M1A2337.8GB.256GB.Grey.Fair
# ============================================================
target_sku = "MBA.M1A2337.8GB.256GB.Grey.Fair"
print("--- 3. DEEP DIVE: %s ---" % target_sku)
print()

target = by_sku.get(target_sku, [])
if target:
    target_sorted = sorted(target, key=lambda x: x["date_sold"])
    print("  Volume: %d units sold" % len(target))
    print("  Avg sale: \u00a3%.0f  Avg purchase: \u00a3%.0f  Avg gross: \u00a3%.0f" % (
        sum(t["sale"] for t in target) / len(target),
        sum(t["purchase"] for t in target) / len(target),
        sum(t["gross"] for t in target) / len(target)))
    print()

    # Monthly breakdown
    by_month = defaultdict(list)
    for t in target_sorted:
        month = t["date_sold"][:7]  # YYYY-MM
        by_month[month].append(t)

    print("  MONTHLY BREAKDOWN:")
    print("  %-10s %5s %7s %7s %7s %6s" % ("Month", "Count", "AvgSale", "AvgPur", "AvgGrs", "Avg%"))
    print("  " + "-" * 50)
    for month in sorted(by_month.keys()):
        items = by_month[month]
        avg_s = sum(i["sale"] for i in items) / len(items)
        avg_p = sum(i["purchase"] for i in items) / len(items)
        avg_g = sum(i["gross"] for i in items) / len(items)
        avg_pc = sum(i["gross_pct"] for i in items) / len(items)
        print("  %-10s %5d %7.0f %7.0f %7.0f %5.1f%%" % (
            month, len(items), avg_s, avg_p, avg_g, avg_pc))

    print()
    print("  INDIVIDUAL SALES (last 20):")
    print("  %-14s %-12s %7s %7s %7s %7s %7s %6s" % (
        "Name", "Date Sold", "Sale", "Purch", "BMFee", "Tax", "Gross", "%"))
    print("  " + "-" * 80)
    for t in target_sorted[-20:]:
        print("  %-14s %-12s %7.0f %7.0f %7.0f %7.0f %7.0f %5.1f%%" % (
            t["name"], t["date_sold"], t["sale"], t["purchase"],
            t["bm_fee"], t["tax"], t["gross"], t["gross_pct"]))

print()

# ============================================================
# 4. SALE PRICE DROPS — SKUs with significant price declines
# ============================================================
print("--- 4. SALE PRICE TRENDS (SKUs with 5+ sales, sorted by price change) ---")
print()
print("%-55s %5s %7s %7s %7s %8s %12s" % (
    "SKU", "Sold", "First", "Last", "Change", "Change%", "Period"))
print("-" * 130)

trend_skus = [s for s in sku_stats if s["count"] >= 5 and s["first_sale"] > 0]
trend_skus.sort(key=lambda x: x["price_change_pct"])

for s in trend_skus:
    direction = "DOWN" if s["price_change"] < 0 else "UP" if s["price_change"] > 0 else "FLAT"
    print("%-55s %5d %7.0f %7.0f %7.0f %7.1f%% %s to %s  %s" % (
        s["sku"][:55], s["count"],
        s["first_sale"], s["last_sale"], s["price_change"],
        s["price_change_pct"],
        s["first_date"][:10], s["last_date"][:10], direction))

print()

# ============================================================
# 5. ALL LOSS-MAKING ITEMS
# ============================================================
print("--- 5. ALL LOSS-MAKING ITEMS (Gross Profit < \u00a30) ---")
print()
if losses:
    losses_sorted = sorted(losses, key=lambda x: x["gross"])
    print("%-14s %-45s %-12s %7s %7s %7s %6s" % (
        "Name", "SKU", "Date Sold", "Sale", "Purch", "Gross", "%"))
    print("-" * 130)
    total_loss = 0
    for r in losses_sorted:
        total_loss += r["gross"]
        print("%-14s %-45s %-12s %7.0f %7.0f %7.0f %5.1f%%" % (
            r["name"], r["sku"][:45], r["date_sold"],
            r["sale"], r["purchase"], r["gross"], r["gross_pct"]))
    print()
    print("  Total gross losses: \u00a3%.0f across %d items" % (total_loss, len(losses)))

    # Loss by SKU
    loss_by_sku = defaultdict(list)
    for r in losses:
        loss_by_sku[r["sku"]].append(r)

    print()
    print("  Losses by SKU:")
    for sku in sorted(loss_by_sku, key=lambda k: sum(r["gross"] for r in loss_by_sku[k])):
        items = loss_by_sku[sku]
        total = sum(r["gross"] for r in items)
        print("    %-55s  %d items  \u00a3%.0f" % (sku[:55], len(items), total))
else:
    print("  None")
print()

# ============================================================
# 6. TOP PERFORMERS (highest gross margin)
# ============================================================
print("--- 6. TOP PERFORMING SKUs (5+ sales, highest avg gross %%) ---")
print()
top_skus = sorted([s for s in sku_stats if s["count"] >= 5], key=lambda x: -x["avg_pct"])[:10]
print("%-55s %5s %7s %7s %6s %8s" % ("SKU", "Sold", "AvgSale", "AvgGrs", "Avg%", "TotGross"))
print("-" * 100)
for s in top_skus:
    print("%-55s %5d %7.0f %7.0f %5.1f%% %8.0f" % (
        s["sku"][:55], s["count"], s["avg_sale"], s["avg_gross"],
        s["avg_pct"], s["total_gross"]))
print()

# ============================================================
# 7. PURCHASE PRICE SPREAD ANALYSIS
# ============================================================
print("--- 7. PURCHASE PRICE SPREAD (SKUs with 5+ sales) ---")
print("(Higher spread = more room for profit after costs)")
print()
print("%-55s %5s %7s %7s %7s %6s" % (
    "SKU", "Sold", "AvgPur", "AvgSale", "Spread", "Sprd%"))
print("-" * 100)

spread_skus = [s for s in sku_stats if s["count"] >= 5]
spread_skus.sort(key=lambda x: (x["avg_sale"] - x["avg_purchase"]) / x["avg_sale"] * 100 if x["avg_sale"] else 0)

for s in spread_skus:
    spread = s["avg_sale"] - s["avg_purchase"]
    spread_pct = (spread / s["avg_sale"] * 100) if s["avg_sale"] else 0
    flag = " ** TIGHT" if spread_pct < 60 else ""
    print("%-55s %5d %7.0f %7.0f %7.0f %5.1f%%%s" % (
        s["sku"][:55], s["count"], s["avg_purchase"], s["avg_sale"],
        spread, spread_pct, flag))
print()

# ============================================================
# 8. SAME-SKU VARIANTS — inconsistent naming
# ============================================================
print("--- 8. POTENTIAL SKU DUPLICATES (similar names) ---")
print()
# Find SKUs that look like variants of each other
from collections import Counter
# Group by base model (first 3 parts of SKU)
base_groups = defaultdict(list)
for sku in by_sku:
    if sku == "NO_SKU":
        continue
    parts = sku.split(".")
    if len(parts) >= 3:
        base = ".".join(parts[:3])
        base_groups[base].append(sku)

for base, skus in sorted(base_groups.items()):
    if len(skus) > 1:
        total = sum(len(by_sku[s]) for s in skus)
        if total >= 5:
            print("  %s (%d total sales across %d variants):" % (base, total, len(skus)))
            for s in sorted(skus):
                print("    %-55s  %d sales" % (s, len(by_sku[s])))
            print()

# ============================================================
# 9. MONTHLY REVENUE SUMMARY
# ============================================================
print("--- 9. MONTHLY SUMMARY ---")
print()
by_month = defaultdict(list)
for r in sold:
    month = r["date_sold"][:7]
    by_month[month].append(r)

print("  %-10s %5s %10s %10s %6s" % ("Month", "Sold", "Revenue", "Gross", "Marg%"))
print("  " + "-" * 50)
for month in sorted(by_month.keys()):
    items = by_month[month]
    rev = sum(i["sale"] for i in items)
    gross = sum(i["gross"] for i in items)
    margin = (gross / rev * 100) if rev else 0
    print("  %-10s %5d %10s %10s %5.1f%%" % (
        month, len(items),
        "\u00a3{:,.0f}".format(rev), "\u00a3{:,.0f}".format(gross), margin))
print()
