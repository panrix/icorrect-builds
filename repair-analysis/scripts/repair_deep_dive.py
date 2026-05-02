#!/usr/bin/env python3
"""
iCorrect Repair Deep Dive - Device × Repair Type Matrix
Produces detailed breakdown from existing repair-profitability.json
"""

import json, os, re
from datetime import datetime, timedelta
from collections import defaultdict

INPUT = "/home/ricky/.openclaw/agents/main/workspace/data/repairs/repair-profitability.json"
OUT_DIR = "/home/ricky/.openclaw/agents/main/workspace/data/repairs"

with open(INPUT) as f:
    data = json.load(f)

repairs = data["repairs"]
print(f"Loaded {len(repairs)} repairs")

# ─── 1. Parse device model (more granular than device_type) ───
def parse_device_model(device_name, device_type):
    """Extract specific model from device name."""
    if not device_name:
        return device_type or "Unknown"
    n = device_name.strip()
    # Already good names from Devices board - just clean up
    # Remove customer names if present (pattern: "Name - Device")
    if " - " in n:
        parts = n.split(" - ", 1)
        # If first part looks like a name (no Apple keywords), take second part
        apple_kw = ["mac", "iphone", "ipad", "watch", "ipod", "imac"]
        if not any(k in parts[0].lower() for k in apple_kw):
            n = parts[1].strip()
    return n

for r in repairs:
    r["device_model"] = parse_device_model(r["device_name"], r["device_type"])

# ─── 2. Device × Repair Type Matrix ───
print("\n" + "="*80)
print("SECTION 1: DEVICE × REPAIR TYPE MATRIX")
print("="*80)

# Group by device_model
by_model = defaultdict(list)
for r in repairs:
    by_model[r["device_model"]].append(r)

matrix = {}
for model in sorted(by_model.keys()):
    reps = by_model[model]
    by_rt = defaultdict(list)
    for r in reps:
        by_rt[r["repair_type"]].append(r)
    
    model_data = {
        "total_jobs": len(reps),
        "total_revenue": sum(r["rev_ex_vat"] for r in reps),
        "total_profit": sum(r["net_profit"] for r in reps),
        "repair_types": {}
    }
    
    for rt in sorted(by_rt.keys()):
        jobs = by_rt[rt]
        n = len(jobs)
        rev = sum(j["rev_ex_vat"] for j in jobs)
        parts = sum(j["parts_cost"] for j in jobs)
        hours = sum(j["total_hours"] for j in jobs)
        labour = sum(j["labour_cost"] for j in jobs)
        profit = sum(j["net_profit"] for j in jobs)
        
        model_data["repair_types"][rt] = {
            "count": n,
            "avg_revenue": round(rev/n, 2),
            "avg_parts_cost": round(parts/n, 2),
            "avg_labour_hours": round(hours/n, 2),
            "avg_labour_cost": round(labour/n, 2),
            "avg_net_profit": round(profit/n, 2),
            "total_profit": round(profit, 2),
            "margin_pct": round((profit/rev*100) if rev > 0 else 0, 1),
        }
    
    matrix[model] = model_data

# Print matrix - only models with 5+ jobs
print("\nDevices with 5+ jobs:\n")
for model, md in sorted(matrix.items(), key=lambda x: x[1]["total_profit"], reverse=True):
    if md["total_jobs"] < 5:
        continue
    margin = (md["total_profit"]/md["total_revenue"]*100) if md["total_revenue"] > 0 else 0
    print(f"\n{model} ({md['total_jobs']} jobs, total profit £{md['total_profit']:,.0f}, margin {margin:.0f}%):")
    for rt, d in sorted(md["repair_types"].items(), key=lambda x: x[1]["total_profit"], reverse=True):
        print(f"  {rt:25s} {d['count']:3d} jobs | rev £{d['avg_revenue']:6.0f} | parts £{d['avg_parts_cost']:5.0f} | "
              f"labour £{d['avg_labour_cost']:4.0f} ({d['avg_labour_hours']:.1f}h) | profit £{d['avg_net_profit']:6.0f} | {d['margin_pct']:5.1f}%")

# ─── 3. Battery Deep Dive ───
print("\n\n" + "="*80)
print("SECTION 2: BATTERY REPLACEMENTS - ARE THEY PROFITABLE?")
print("="*80)

battery_repairs = [r for r in repairs if r["repair_type"] == "Battery Replacement"]
print(f"\nTotal battery repairs: {len(battery_repairs)}")
total_batt_rev = sum(r["rev_ex_vat"] for r in battery_repairs)
total_batt_parts = sum(r["parts_cost"] for r in battery_repairs)
total_batt_labour = sum(r["labour_cost"] for r in battery_repairs)
total_batt_profit = sum(r["net_profit"] for r in battery_repairs)
batt_margin = (total_batt_profit/total_batt_rev*100) if total_batt_rev > 0 else 0
print(f"Overall: Rev £{total_batt_rev:,.0f}, Parts £{total_batt_parts:,.0f}, Labour £{total_batt_labour:,.0f}, "
      f"Profit £{total_batt_profit:,.0f}, Margin {batt_margin:.1f}%")

# Battery by device model
batt_by_model = defaultdict(list)
for r in battery_repairs:
    batt_by_model[r["device_model"]].append(r)

print(f"\nBy Device Model (sorted by avg profit):")
batt_model_data = {}
for model in sorted(batt_by_model.keys()):
    jobs = batt_by_model[model]
    n = len(jobs)
    rev = sum(j["rev_ex_vat"] for j in jobs)
    parts = sum(j["parts_cost"] for j in jobs)
    labour = sum(j["labour_cost"] for j in jobs)
    profit = sum(j["net_profit"] for j in jobs)
    margin = (profit/rev*100) if rev > 0 else 0
    avg_profit = profit/n
    
    batt_model_data[model] = {
        "count": n, "avg_revenue": round(rev/n, 2), "avg_parts_cost": round(parts/n, 2),
        "avg_labour_cost": round(labour/n, 2), "avg_profit": round(avg_profit, 2),
        "total_profit": round(profit, 2), "margin_pct": round(margin, 1),
        "parts_names": list(set(p for j in jobs for p in j.get("parts_used", []) if "batt" in p.lower()))
    }

for model, d in sorted(batt_model_data.items(), key=lambda x: x[1]["avg_profit"], reverse=True):
    flag = "✅" if d["margin_pct"] > 40 else "⚠️" if d["margin_pct"] > 20 else "❌"
    print(f"  {flag} {model:40s} {d['count']:3d} jobs | rev £{d['avg_revenue']:6.0f} | parts £{d['avg_parts_cost']:5.0f} | "
          f"labour £{d['avg_labour_cost']:4.0f} | profit £{d['avg_profit']:6.0f} | {d['margin_pct']:5.1f}%")
    if d["parts_names"]:
        print(f"     Parts: {', '.join(d['parts_names'][:3])}")

# ─── 4. Weekly Revenue Trend by Device Type (last 12 weeks) ───
print("\n\n" + "="*80)
print("SECTION 3: WEEKLY REVENUE TREND (Last 12 Weeks)")
print("="*80)

now = datetime(2026, 3, 16)
twelve_weeks_ago = now - timedelta(weeks=12)

weekly_by_device = defaultdict(lambda: defaultdict(lambda: {"count": 0, "rev": 0, "profit": 0}))
for r in repairs:
    if not r.get("received"):
        continue
    try:
        d = datetime.strptime(r["received"][:10], "%Y-%m-%d")
    except:
        continue
    if d < twelve_weeks_ago:
        continue
    
    week_start = d - timedelta(days=d.weekday())
    week_key = week_start.strftime("%Y-%m-%d")
    dt = r["device_type"]
    weekly_by_device[week_key][dt]["count"] += 1
    weekly_by_device[week_key][dt]["rev"] += r["rev_ex_vat"]
    weekly_by_device[week_key][dt]["profit"] += r["net_profit"]

# Also compute totals per week
weekly_totals = defaultdict(lambda: {"count": 0, "rev": 0, "profit": 0})
for week, devices in weekly_by_device.items():
    for dt, d in devices.items():
        weekly_totals[week]["count"] += d["count"]
        weekly_totals[week]["rev"] += d["rev"]
        weekly_totals[week]["profit"] += d["profit"]

all_weeks = sorted(weekly_by_device.keys())
device_types = ["MacBook Pro", "MacBook Air", "iPhone", "iPad", "Apple Watch"]

print(f"\nWeekly totals:")
for week in all_weeks:
    t = weekly_totals[week]
    print(f"  w/c {week}: {t['count']:3d} jobs, Rev £{t['rev']:,.0f}, Profit £{t['profit']:,.0f}")

for dt in device_types:
    print(f"\n  {dt}:")
    weeks_data = []
    for week in all_weeks:
        d = weekly_by_device[week].get(dt, {"count": 0, "rev": 0, "profit": 0})
        weeks_data.append(d)
        print(f"    w/c {week}: {d['count']:2d} jobs, Rev £{d['rev']:,.0f}")
    
    # Trend: compare first 4 weeks vs last 4 weeks
    if len(weeks_data) >= 8:
        first4_rev = sum(w["rev"] for w in weeks_data[:4])
        last4_rev = sum(w["rev"] for w in weeks_data[-4:])
        first4_count = sum(w["count"] for w in weeks_data[:4])
        last4_count = sum(w["count"] for w in weeks_data[-4:])
        if first4_rev > 0:
            change = ((last4_rev - first4_rev) / first4_rev) * 100
            print(f"    Trend: first 4 wks £{first4_rev:,.0f} ({first4_count} jobs) → last 4 wks £{last4_rev:,.0f} ({last4_count} jobs) = {change:+.0f}%")

# ─── 5. Device type aggregated summary (for the matrix) ───
print("\n\n" + "="*80)
print("SECTION 4: DEVICE TYPE × REPAIR TYPE SUMMARY")
print("="*80)

dt_rt_matrix = defaultdict(lambda: defaultdict(lambda: {"count": 0, "rev": 0, "parts": 0, "hours": 0, "labour": 0, "profit": 0}))
for r in repairs:
    dt = r["device_type"]
    rt = r["repair_type"]
    dt_rt_matrix[dt][rt]["count"] += 1
    dt_rt_matrix[dt][rt]["rev"] += r["rev_ex_vat"]
    dt_rt_matrix[dt][rt]["parts"] += r["parts_cost"]
    dt_rt_matrix[dt][rt]["hours"] += r["total_hours"]
    dt_rt_matrix[dt][rt]["labour"] += r["labour_cost"]
    dt_rt_matrix[dt][rt]["profit"] += r["net_profit"]

for dt in ["MacBook Pro", "MacBook Air", "iPhone", "iPad", "Apple Watch"]:
    rts = dt_rt_matrix[dt]
    total_p = sum(d["profit"] for d in rts.values())
    total_r = sum(d["rev"] for d in rts.values())
    total_c = sum(d["count"] for d in rts.values())
    margin = (total_p/total_r*100) if total_r > 0 else 0
    print(f"\n{dt} ({total_c} jobs, Rev £{total_r:,.0f}, Profit £{total_p:,.0f}, Margin {margin:.0f}%):")
    for rt, d in sorted(rts.items(), key=lambda x: x[1]["profit"], reverse=True):
        n = d["count"]
        m = (d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0
        print(f"  {rt:25s} {n:3d} jobs | avg rev £{d['rev']/n:6.0f} | parts £{d['parts']/n:5.0f} | "
              f"labour £{d['labour']/n:4.0f} ({d['hours']/n:.1f}h) | profit £{d['profit']/n:6.0f} | {m:5.1f}%")

# ─── 6. Top/Bottom performers ───
print("\n\n" + "="*80)
print("SECTION 5: TOP & BOTTOM PERFORMERS")
print("="*80)

# Flatten all combos with 3+ jobs
all_combos = []
for dt, rts in dt_rt_matrix.items():
    for rt, d in rts.items():
        if d["count"] >= 3:
            n = d["count"]
            margin = (d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0
            all_combos.append({
                "device": dt, "repair": rt, "count": n,
                "avg_profit": round(d["profit"]/n, 2),
                "margin": round(margin, 1),
                "total_profit": round(d["profit"], 2),
                "total_rev": round(d["rev"], 2),
            })

print("\n🏆 TOP 15 by avg profit per job (min 3 jobs):")
for c in sorted(all_combos, key=lambda x: x["avg_profit"], reverse=True)[:15]:
    flag = "✅" if c["margin"] > 50 else "⚠️" if c["margin"] > 30 else "❌"
    print(f"  {flag} {c['device']:15s} + {c['repair']:25s} | {c['count']:3d} jobs | £{c['avg_profit']:6.0f}/job | {c['margin']:5.1f}% | total £{c['total_profit']:,.0f}")

print("\n💀 BOTTOM 15 by avg profit per job (min 3 jobs):")
for c in sorted(all_combos, key=lambda x: x["avg_profit"])[:15]:
    flag = "✅" if c["margin"] > 50 else "⚠️" if c["margin"] > 30 else "❌"
    print(f"  {flag} {c['device']:15s} + {c['repair']:25s} | {c['count']:3d} jobs | £{c['avg_profit']:6.0f}/job | {c['margin']:5.1f}% | total £{c['total_profit']:,.0f}")

print("\n📉 NEGATIVE/LOW MARGIN (<30%) with 5+ jobs:")
for c in sorted(all_combos, key=lambda x: x["margin"]):
    if c["margin"] < 30 and c["count"] >= 5:
        print(f"  ❌ {c['device']:15s} + {c['repair']:25s} | {c['count']:3d} jobs | £{c['avg_profit']:6.0f}/job | {c['margin']:5.1f}%")

# ─── 7. Save structured JSON ───
output = {
    "generated": datetime.now().isoformat(),
    "total_repairs": len(repairs),
    "device_repair_matrix": {},
    "battery_deep_dive": {
        "total": {
            "count": len(battery_repairs),
            "revenue": round(total_batt_rev, 2),
            "parts": round(total_batt_parts, 2),
            "labour": round(total_batt_labour, 2),
            "profit": round(total_batt_profit, 2),
            "margin_pct": round(batt_margin, 1),
        },
        "by_model": batt_model_data,
    },
    "weekly_trend": {},
    "top_combos": sorted(all_combos, key=lambda x: x["avg_profit"], reverse=True)[:20],
    "bottom_combos": sorted(all_combos, key=lambda x: x["avg_profit"])[:20],
    "low_margin_combos": [c for c in all_combos if c["margin"] < 30 and c["count"] >= 5],
}

# Device-type level matrix
for dt in ["MacBook Pro", "MacBook Air", "iPhone", "iPad", "Apple Watch"]:
    rts = dt_rt_matrix[dt]
    total_p = sum(d["profit"] for d in rts.values())
    total_r = sum(d["rev"] for d in rts.values())
    total_c = sum(d["count"] for d in rts.values())
    
    output["device_repair_matrix"][dt] = {
        "total_jobs": total_c,
        "total_revenue": round(total_r, 2),
        "total_profit": round(total_p, 2),
        "margin_pct": round((total_p/total_r*100) if total_r > 0 else 0, 1),
        "repairs": {}
    }
    for rt, d in sorted(rts.items(), key=lambda x: x[1]["profit"], reverse=True):
        n = d["count"]
        output["device_repair_matrix"][dt]["repairs"][rt] = {
            "count": n,
            "avg_revenue": round(d["rev"]/n, 2),
            "avg_parts": round(d["parts"]/n, 2),
            "avg_labour_hours": round(d["hours"]/n, 2),
            "avg_labour_cost": round(d["labour"]/n, 2),
            "avg_profit": round(d["profit"]/n, 2),
            "total_profit": round(d["profit"], 2),
            "margin_pct": round((d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0, 1),
        }

# Weekly trend
for week in all_weeks:
    output["weekly_trend"][week] = {
        "total": {"count": weekly_totals[week]["count"], "revenue": round(weekly_totals[week]["rev"], 2), "profit": round(weekly_totals[week]["profit"], 2)},
        "by_device": {}
    }
    for dt in device_types:
        d = weekly_by_device[week].get(dt, {"count": 0, "rev": 0, "profit": 0})
        output["weekly_trend"][week]["by_device"][dt] = {"count": d["count"], "revenue": round(d["rev"], 2), "profit": round(d["profit"], 2)}

# Granular model matrix (for models with 5+ jobs)
output["device_model_matrix"] = {
    model: md for model, md in matrix.items() if md["total_jobs"] >= 5
}

json_path = os.path.join(OUT_DIR, "repair-deep-dive.json")
with open(json_path, "w") as f:
    json.dump(output, f, indent=2, default=str)
print(f"\n💾 Saved: {json_path}")
