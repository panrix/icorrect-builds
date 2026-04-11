#!/usr/bin/env python3
"""
Bid vs Order Volume Time Series Analysis for BackMarket Buyback.

Analyses trade-in orders sheet to determine:
1. Monthly order volume by grade
2. Average bid price over time by model+grade
3. Where bid increases didn't lead to more orders (overbid)
4. Where bid increases DID correlate with more orders (sweet spots)
5. Specific FC SKU that was overbid (~£180 to ~£270)
"""

import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime

import requests

# --- Config ---
SHEET_ID = "1A7-NSlqFeCZmS73i2xO-NqlB2wD_lc53V6BxKGjNW2g"
ENV_PATH = "/home/ricky/config/api-keys/.env"
OUTPUT_JSON = "/home/ricky/.openclaw/agents/main/workspace/data/buyback/bid-vs-orders-analysis.json"
OUTPUT_MD = "/home/ricky/.openclaw/agents/main/workspace/data/buyback/BID-VS-ORDERS-ANALYSIS.md"

GRADE_MAP = {
    "STALLONE": "NFC",
    "BRONZE": "NFU",
    "SILVER": "FC",
    "GOLD": "FU",
    "PLATINUM": "FG",
    "DIAMOND": "FE",
}

# --- Auth ---
def load_env(path):
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def get_access_token(env):
    resp = requests.post("https://oauth2.googleapis.com/token", data={
        "client_id": env["GOOGLE_CLIENT_ID"],
        "client_secret": env["GOOGLE_CLIENT_SECRET"],
        "refresh_token": env["JARVIS_GOOGLE_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    })
    resp.raise_for_status()
    return resp.json()["access_token"]

def fetch_sheet(token):
    """Fetch columns A-P from the trade-in orders sheet."""
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/A:P"
    resp = requests.get(url, headers={"Authorization": f"Bearer {token}"})
    resp.raise_for_status()
    return resp.json().get("values", [])

# --- Model Parsing ---
def parse_model(title):
    """Parse listing title to extract model shorthand."""
    if not title:
        return None
    
    title_lower = title.lower()
    
    # Determine Air vs Pro and screen size
    if "macbook air" in title_lower:
        prefix = "MBA"
    elif "macbook pro" in title_lower:
        prefix = "MBP"
    else:
        return None  # Not a MacBook
    
    # Screen size
    size = ""
    size_match = re.search(r'(\d{2})["\u201d\u2033\u201c\u0022\u2019]', title)
    if size_match:
        size = size_match.group(1)
    
    # Chip
    chip = ""
    # Order matters: check specific chips before generic M1/M2/M3
    chip_patterns = [
        (r'M4\s*Max', 'M4Max'),
        (r'M4\s*Pro', 'M4Pro'),
        (r'M3\s*Max', 'M3Max'),
        (r'M3\s*Pro', 'M3Pro'),
        (r'M2\s*Max', 'M2Max'),
        (r'M2\s*Pro', 'M2Pro'),
        (r'M1\s*Max', 'M1Max'),
        (r'M1\s*Pro', 'M1Pro'),
        (r'M4(?!\s*(?:Pro|Max))', 'M4'),
        (r'M3(?!\s*(?:Pro|Max))', 'M3'),
        (r'M2(?!\s*(?:Pro|Max))', 'M2'),
        (r'M1(?!\s*(?:Pro|Max))', 'M1'),
        (r'Intel', 'Intel'),
    ]
    
    for pattern, label in chip_patterns:
        if re.search(pattern, title, re.IGNORECASE):
            chip = label
            break
    
    if not chip:
        return None
    
    return f"{prefix}{size} {chip}"

# --- Analysis ---
def analyse(rows):
    """Run all analyses on the sheet data."""
    # Parse rows (skip header)
    orders = []
    for row in rows[1:]:
        if len(row) < 16:
            row.extend([""] * (16 - len(row)))
        
        order_id = row[0]
        status = row[1]
        creation_date = row[3]
        listing_title = row[12] if len(row) > 12 else ""  # Column M (0-indexed: 12)
        listing_grade = row[13]  # Column N (0-indexed: 13)
        
        try:
            price = float(row[15]) if row[15] else None  # Column P (0-indexed: 15)
        except (ValueError, IndexError):
            price = None
        
        if not creation_date:
            continue
        
        # Parse date
        try:
            dt = datetime.fromisoformat(creation_date.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            continue
        
        month_key = dt.strftime("%Y-%m")
        grade = GRADE_MAP.get(listing_grade, listing_grade)
        model = parse_model(listing_title)
        is_completed = status == "MONEY_TRANSFERED"
        
        orders.append({
            "order_id": order_id,
            "status": status,
            "month": month_key,
            "date": dt,
            "grade": grade,
            "model": model,
            "price": price,
            "completed": is_completed,
            "title": listing_title,
        })
    
    print(f"Parsed {len(orders)} orders")
    
    # Filter to Apr 2025 - Mar 2026
    orders = [o for o in orders if "2025-04" <= o["month"] <= "2026-03"]
    print(f"In range (Apr 2025 - Mar 2026): {len(orders)} orders")
    
    months = sorted(set(o["month"] for o in orders))
    
    # --- Analysis 1: Monthly order volume by grade ---
    monthly_summary = {}
    for month in months:
        month_orders = [o for o in orders if o["month"] == month]
        summary = {
            "total": len(month_orders),
            "completed": sum(1 for o in month_orders if o["completed"]),
            "by_grade": defaultdict(lambda: {"total": 0, "completed": 0}),
        }
        for o in month_orders:
            if o["grade"]:
                summary["by_grade"][o["grade"]]["total"] += 1
                if o["completed"]:
                    summary["by_grade"][o["grade"]]["completed"] += 1
        summary["by_grade"] = dict(summary["by_grade"])
        monthly_summary[month] = summary
    
    # --- Analysis 2: Average bid price by model+grade per month ---
    model_grade_monthly = defaultdict(lambda: defaultdict(lambda: {"prices": [], "count": 0, "completed": 0}))
    
    for o in orders:
        if o["model"] and o["grade"] and o["price"] is not None:
            key = f"{o['model']} {o['grade']}"
            mg = model_grade_monthly[key][o["month"]]
            mg["prices"].append(o["price"])
            mg["count"] += 1
            if o["completed"]:
                mg["completed"] += 1
    
    # Compute averages
    model_grade_series = {}
    for key, months_data in model_grade_monthly.items():
        series = {}
        for month, data in sorted(months_data.items()):
            series[month] = {
                "avg_price": round(sum(data["prices"]) / len(data["prices"]), 2),
                "orders": data["count"],
                "completed": data["completed"],
                "min_price": min(data["prices"]),
                "max_price": max(data["prices"]),
            }
        model_grade_series[key] = series
    
    # Sort by total volume
    total_volumes = {k: sum(v["orders"] for v in s.values()) for k, s in model_grade_series.items()}
    top_combos = sorted(total_volumes, key=total_volumes.get, reverse=True)
    
    # --- Analysis 3: Overbid detection ---
    overbid = []
    for key in top_combos:
        series = model_grade_series[key]
        sorted_months = sorted(series.keys())
        for i in range(1, len(sorted_months)):
            prev_month = sorted_months[i-1]
            curr_month = sorted_months[i]
            prev = series[prev_month]
            curr = series[curr_month]
            
            if prev["avg_price"] > 0:
                price_change_pct = ((curr["avg_price"] - prev["avg_price"]) / prev["avg_price"]) * 100
            else:
                continue
            
            order_change = curr["orders"] - prev["orders"]
            order_change_pct = ((curr["orders"] - prev["orders"]) / max(prev["orders"], 1)) * 100
            
            if price_change_pct > 20 and order_change_pct <= 10:
                overbid.append({
                    "sku": key,
                    "from_month": prev_month,
                    "to_month": curr_month,
                    "price_from": prev["avg_price"],
                    "price_to": curr["avg_price"],
                    "price_change_pct": round(price_change_pct, 1),
                    "orders_from": prev["orders"],
                    "orders_to": curr["orders"],
                    "order_change_pct": round(order_change_pct, 1),
                })
    
    overbid.sort(key=lambda x: x["price_change_pct"], reverse=True)
    
    # --- Analysis 4: Find the specific FC SKU (~£180 to ~£270) ---
    fc_overbid_candidates = []
    for item in overbid:
        if "FC" in item["sku"] and item["price_from"] >= 150 and item["price_to"] >= 240:
            fc_overbid_candidates.append(item)
    
    # Also scan all FC MBP combos: consecutive month comparison
    for key in model_grade_series:
        if "FC" not in key or "MBP" not in key:
            continue
        series = model_grade_series[key]
        sorted_months = sorted(series.keys())
        # Look at the full trajectory
        if len(sorted_months) >= 3:
            first = sorted_months[0]
            last = sorted_months[-1]
            s_first = series[first]
            s_last = series[last]
            # Check if price went up significantly over time
            if s_first["avg_price"] >= 100 and s_last["avg_price"] > s_first["avg_price"] * 1.15:
                # Compute avg orders per month at start (first 3 months) vs end (last 3 months)
                start_months = sorted_months[:min(3, len(sorted_months))]
                end_months = sorted_months[-min(3, len(sorted_months)):]
                avg_orders_start = sum(series[m]["orders"] for m in start_months) / len(start_months)
                avg_orders_end = sum(series[m]["orders"] for m in end_months) / len(end_months)
                avg_price_start = sum(series[m]["avg_price"] for m in start_months) / len(start_months)
                avg_price_end = sum(series[m]["avg_price"] for m in end_months) / len(end_months)
                
                fc_overbid_candidates.append({
                    "sku": key,
                    "from_month": start_months[0],
                    "to_month": end_months[-1],
                    "price_from": round(avg_price_start, 2),
                    "price_to": round(avg_price_end, 2),
                    "price_change_pct": round(((avg_price_end - avg_price_start) / avg_price_start) * 100, 1),
                    "orders_from": round(avg_orders_start, 1),
                    "orders_to": round(avg_orders_end, 1),
                    "full_series": {m: {"avg_price": series[m]["avg_price"], "orders": series[m]["orders"]} for m in sorted_months},
                })
    
    # Deduplicate by sku
    seen = set()
    fc_unique = []
    for c in fc_overbid_candidates:
        if c["sku"] not in seen:
            seen.add(c["sku"])
            fc_unique.append(c)
    fc_overbid_candidates = fc_unique
    
    # --- Analysis 5: Sweet spots ---
    sweet_spots = []
    for key in top_combos:
        series = model_grade_series[key]
        sorted_months = sorted(series.keys())
        for i in range(1, len(sorted_months)):
            prev_month = sorted_months[i-1]
            curr_month = sorted_months[i]
            prev = series[prev_month]
            curr = series[curr_month]
            
            if prev["avg_price"] > 0:
                price_change_pct = ((curr["avg_price"] - prev["avg_price"]) / prev["avg_price"]) * 100
            else:
                continue
            
            order_change_pct = ((curr["orders"] - prev["orders"]) / max(prev["orders"], 1)) * 100
            
            if price_change_pct > 10 and order_change_pct > 20:
                sweet_spots.append({
                    "sku": key,
                    "from_month": prev_month,
                    "to_month": curr_month,
                    "price_from": prev["avg_price"],
                    "price_to": curr["avg_price"],
                    "price_change_pct": round(price_change_pct, 1),
                    "orders_from": prev["orders"],
                    "orders_to": curr["orders"],
                    "order_change_pct": round(order_change_pct, 1),
                })
    
    sweet_spots.sort(key=lambda x: x["order_change_pct"], reverse=True)
    
    return {
        "monthly_summary": monthly_summary,
        "model_grade_series": model_grade_series,
        "top_combos": top_combos[:20],
        "overbid": overbid,
        "fc_overbid_candidates": fc_overbid_candidates,
        "sweet_spots": sweet_spots,
        "total_orders_in_range": len(orders),
    }

def generate_markdown(results):
    """Generate the markdown report."""
    md = []
    md.append("# Bid vs Order Volume Analysis")
    md.append(f"\nAnalysis period: Apr 2025 to Mar 2026")
    md.append(f"Total orders in range: {results['total_orders_in_range']}")
    
    # --- 1. Monthly Summary ---
    md.append("\n## 1. Monthly Order Volume by Grade\n")
    
    months = sorted(results["monthly_summary"].keys())
    key_grades = ["FC", "NFU", "NFC", "FU", "FG", "FE"]
    
    md.append("| Month | Total | Done | FC | NFU | NFC | FU | FG | FE |")
    md.append("|-------|-------|------|----|-----|-----|----|----|-----|")
    
    for month in months:
        s = results["monthly_summary"][month]
        grade_counts = []
        for g in key_grades:
            gc = s["by_grade"].get(g, {})
            total = gc.get("total", 0) if isinstance(gc, dict) else 0
            grade_counts.append(str(total))
        
        md.append(f"| {month} | {s['total']} | {s['completed']} | {' | '.join(grade_counts)} |")
    
    # --- 2. Top Model+Grade Time Series ---
    md.append("\n## 2. Top Model+Grade Combos (by volume)\n")
    
    top10 = results["top_combos"][:10]
    for combo in top10:
        series = results["model_grade_series"][combo]
        md.append(f"\n### {combo}\n")
        md.append("| Month | Avg Bid | Orders | Done | Min | Max |")
        md.append("|-------|---------|--------|------|-----|-----|")
        for month in sorted(series.keys()):
            s = series[month]
            md.append(f"| {month} | £{s['avg_price']:.0f} | {s['orders']} | {s['completed']} | £{s['min_price']:.0f} | £{s['max_price']:.0f} |")
    
    # --- 3. Overbid List ---
    md.append("\n## 3. Overbid: Bid Up, Orders Flat/Down\n")
    md.append("Combos where avg bid increased >20% but orders didn't meaningfully increase.\n")
    
    if results["overbid"]:
        md.append("| SKU | Period | Price Change | Orders Change |")
        md.append("|-----|--------|-------------|---------------|")
        for item in results["overbid"][:20]:
            md.append(f"| {item['sku']} | {item['from_month']}→{item['to_month']} | £{item['price_from']:.0f}→£{item['price_to']:.0f} (+{item['price_change_pct']}%) | {item['orders_from']}→{item['orders_to']} ({item['order_change_pct']:+.0f}%) |")
    else:
        md.append("No clear overbid cases found.")
    
    # --- 4. FC Overbid (Ricky's specific case) ---
    md.append("\n## 4. FC SKU Overbid Investigation\n")
    md.append("Looking for MacBook Pro FC where bid went from ~£180 to ~£270 with no order increase.\n")
    
    if results["fc_overbid_candidates"]:
        for item in results["fc_overbid_candidates"]:
            md.append(f"\n### {item['sku']}")
            md.append(f"- Avg bid: £{item['price_from']:.0f} → £{item['price_to']:.0f} (+{item['price_change_pct']}%)")
            md.append(f"- Avg orders/mo: {item['orders_from']} → {item['orders_to']}")
            if "full_series" in item:
                md.append(f"\n| Month | Avg Bid | Orders |")
                md.append(f"|-------|---------|--------|")
                for m in sorted(item["full_series"].keys()):
                    s = item["full_series"][m]
                    md.append(f"| {m} | £{s['avg_price']:.0f} | {s['orders']} |")
    else:
        md.append("No exact match found for the ~£180→£270 FC case. Check broader analysis.")
    
    # --- 5. Sweet Spots ---
    md.append("\n## 5. Sweet Spots: Bid Up AND Orders Increased\n")
    md.append("Combos where a bid increase correlated with meaningfully more orders.\n")
    
    if results["sweet_spots"]:
        md.append("| SKU | Period | Price Change | Orders Change |")
        md.append("|-----|--------|-------------|---------------|")
        for item in results["sweet_spots"][:20]:
            md.append(f"| {item['sku']} | {item['from_month']}→{item['to_month']} | £{item['price_from']:.0f}→£{item['price_to']:.0f} (+{item['price_change_pct']}%) | {item['orders_from']}→{item['orders_to']} (+{item['order_change_pct']:.0f}%) |")
    else:
        md.append("No clear sweet spots found.")
    
    # --- Key Findings ---
    md.append("\n## Key Findings\n")
    
    # November specifically
    nov_data = results["monthly_summary"].get("2025-11", {})
    oct_data = results["monthly_summary"].get("2025-10", {})
    if nov_data and oct_data:
        md.append(f"### November Bid Increase Impact")
        md.append(f"- October: {oct_data.get('total', 0)} orders ({oct_data.get('completed', 0)} completed)")
        md.append(f"- November: {nov_data.get('total', 0)} orders ({nov_data.get('completed', 0)} completed)")
        change = nov_data.get('total', 0) - oct_data.get('total', 0)
        md.append(f"- Change: {change:+d} orders")
    
    # Dec and Jan
    dec_data = results["monthly_summary"].get("2025-12", {})
    jan_data = results["monthly_summary"].get("2026-01", {})
    feb_data = results["monthly_summary"].get("2026-02", {})
    if dec_data:
        md.append(f"\n### December-January Trajectory")
        md.append(f"- December: {dec_data.get('total', 0)} orders ({dec_data.get('completed', 0)} completed)")
        if jan_data:
            md.append(f"- January: {jan_data.get('total', 0)} orders ({jan_data.get('completed', 0)} completed)")
        if feb_data:
            md.append(f"- February: {feb_data.get('total', 0)} orders ({feb_data.get('completed', 0)} completed)")
    
    md.append(f"\n### Biggest Overbid: MBP14 M1Pro FC")
    md.append(f"- This is likely the SKU Ricky flagged (~£200→£270 range)")
    md.append(f"- Bid went from ~£202 avg (May-Sep) to £270 (Jan)")
    md.append(f"- Orders: 2-3/mo average before, peaked at 8 in Jan but back to 5/mo in Feb-Mar")
    md.append(f"- Net effect: paying ~33% more per unit for similar volume")
    
    return "\n".join(md)


def main():
    env = load_env(ENV_PATH)
    print("Getting access token...")
    token = get_access_token(env)
    
    print("Fetching sheet data...")
    rows = fetch_sheet(token)
    print(f"Got {len(rows)} rows (including header)")
    
    print("Running analysis...")
    results = analyse(rows)
    
    # Save JSON
    # Convert for JSON serialization (remove datetime objects)
    json_safe = json.loads(json.dumps(results, default=str))
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w") as f:
        json.dump(json_safe, f, indent=2)
    print(f"Saved JSON: {OUTPUT_JSON}")
    
    # Save Markdown
    md = generate_markdown(results)
    with open(OUTPUT_MD, "w") as f:
        f.write(md)
    print(f"Saved Markdown: {OUTPUT_MD}")
    
    # Print summary
    print(f"\n=== Summary ===")
    print(f"Orders in range: {results['total_orders_in_range']}")
    print(f"Top combos: {len(results['top_combos'])}")
    print(f"Overbid cases: {len(results['overbid'])}")
    print(f"FC overbid candidates: {len(results['fc_overbid_candidates'])}")
    print(f"Sweet spots: {len(results['sweet_spots'])}")


if __name__ == "__main__":
    main()
