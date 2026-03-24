#!/usr/bin/env python3
"""Extract Task 20 (stuck devices) and Task 21 (returned devices) from repair analysis data."""

import json
from datetime import datetime, timedelta

REFERENCE_DATE = datetime(2026, 3, 2)
DATA_FILE = "/home/ricky/builds/backmarket/audit/repair-analysis-data-2026-03-02.json"

with open(DATA_FILE) as f:
    data = json.load(f)

devices = data["devices"]

# ─── TASK 20: Stuck devices (30+ days, not Shipped/Returned/blank) ───

EXCLUDED_STATUSES = {"shipped", "returned", ""}

stuck_devices = []
for d in devices:
    status = (d.get("status") or "").strip()
    if status.lower() in EXCLUDED_STATUSES:
        continue

    received_raw = d.get("received") or d.get("order_received") or ""
    if not received_raw:
        continue

    try:
        received_date = datetime.strptime(received_raw, "%Y-%m-%d")
    except ValueError:
        continue

    days_stuck = (REFERENCE_DATE - received_date).days
    if days_stuck < 30:
        continue

    stuck_devices.append({
        "bm_trade_in_id": d.get("bm_name", ""),
        "device_title": d.get("device_title", ""),
        "bm_name": d.get("bm_name", ""),
        "status": status,
        "group": d.get("group", ""),
        "listing_grade": d.get("listing_grade", ""),
        "purchase_price": d.get("purchase_price", 0) or 0,
        "sale_price": d.get("sale_price", 0) or 0,
        "technician": d.get("technician", ""),
        "repair_person": d.get("repair_person", ""),
        "received_date": received_raw,
        "days_stuck": days_stuck
    })

stuck_devices.sort(key=lambda x: x["days_stuck"], reverse=True)

# Bucket them
bucket_90_plus = [d for d in stuck_devices if d["days_stuck"] >= 90]
bucket_60_90 = [d for d in stuck_devices if 60 <= d["days_stuck"] < 90]
bucket_30_60 = [d for d in stuck_devices if 30 <= d["days_stuck"] < 60]

cap_90 = sum(d["purchase_price"] for d in bucket_90_plus)
cap_60_90 = sum(d["purchase_price"] for d in bucket_60_90)
cap_30_60 = sum(d["purchase_price"] for d in bucket_30_60)
cap_total = sum(d["purchase_price"] for d in stuck_devices)

task20 = {
    "task": "TASK 20 — Stuck Devices (30+ days without resolution)",
    "reference_date": "2026-03-02",
    "total_stuck_devices": len(stuck_devices),
    "total_capital_tied_up": round(cap_total, 2),
    "buckets": {
        "90_plus_days": {
            "count": len(bucket_90_plus),
            "capital_tied_up": round(cap_90, 2),
            "devices": bucket_90_plus
        },
        "60_to_90_days": {
            "count": len(bucket_60_90),
            "capital_tied_up": round(cap_60_90, 2),
            "devices": bucket_60_90
        },
        "30_to_60_days": {
            "count": len(bucket_30_60),
            "capital_tied_up": round(cap_30_60, 2),
            "devices": bucket_30_60
        }
    },
    "by_status": {},
    "by_technician": {}
}

# Status breakdown
status_counts = {}
for d in stuck_devices:
    s = d["status"]
    if s not in status_counts:
        status_counts[s] = {"count": 0, "capital": 0}
    status_counts[s]["count"] += 1
    status_counts[s]["capital"] += d["purchase_price"]
for s in status_counts:
    status_counts[s]["capital"] = round(status_counts[s]["capital"], 2)
task20["by_status"] = dict(sorted(status_counts.items(), key=lambda x: x[1]["count"], reverse=True))

# Technician breakdown
tech_counts = {}
for d in stuck_devices:
    t = d["technician"] or "(unassigned)"
    if t not in tech_counts:
        tech_counts[t] = {"count": 0, "capital": 0}
    tech_counts[t]["count"] += 1
    tech_counts[t]["capital"] += d["purchase_price"]
for t in tech_counts:
    tech_counts[t]["capital"] = round(tech_counts[t]["capital"], 2)
task20["by_technician"] = dict(sorted(tech_counts.items(), key=lambda x: x[1]["count"], reverse=True))


# ─── TASK 21: Returned devices ───

returned_devices = []
for d in devices:
    status = (d.get("status") or "").strip()
    if status.lower() != "returned":
        continue

    screen_mismatch = False
    casing_mismatch = False
    function_mismatch = False
    mismatches = []

    sr = (d.get("screen_reported") or "").strip()
    sa = (d.get("screen_actual") or "").strip()
    if sr and sa and sr.lower() != sa.lower():
        screen_mismatch = True
        mismatches.append(f"screen: reported={sr}, actual={sa}")

    cr = (d.get("casing_reported") or "").strip()
    ca = (d.get("casing_actual") or "").strip()
    if cr and ca and cr.lower() != ca.lower():
        casing_mismatch = True
        mismatches.append(f"casing: reported={cr}, actual={ca}")

    fr = (d.get("function_reported") or "").strip()
    fa = (d.get("function_actual") or "").strip()
    if fr and fa and fr.lower() != fa.lower():
        function_mismatch = True
        mismatches.append(f"function: reported={fr}, actual={fa}")

    returned_devices.append({
        "bm_trade_in_id": d.get("bm_name", ""),
        "device_title": d.get("device_title", ""),
        "bm_name": d.get("bm_name", ""),
        "status": status,
        "group": d.get("group", ""),
        "listing_grade": d.get("listing_grade", ""),
        "purchase_price": d.get("purchase_price", 0) or 0,
        "sale_price": d.get("sale_price", 0) or 0,
        "counter_reasons": d.get("counter_reasons", ""),
        "suspend_reasons": d.get("suspend_reasons", ""),
        "technician": d.get("technician", ""),
        "repair_person": d.get("repair_person", ""),
        "screen_reported": sr,
        "screen_actual": sa,
        "casing_reported": cr,
        "casing_actual": ca,
        "function_reported": fr,
        "function_actual": fa,
        "has_condition_mismatch": screen_mismatch or casing_mismatch or function_mismatch,
        "mismatches": mismatches
    })

# Group by listing_grade
by_grade = {}
for d in returned_devices:
    g = d["listing_grade"] or "UNKNOWN"
    if g not in by_grade:
        by_grade[g] = {"count": 0, "capital": 0, "mismatch_count": 0, "devices": []}
    by_grade[g]["count"] += 1
    by_grade[g]["capital"] += d["purchase_price"]
    if d["has_condition_mismatch"]:
        by_grade[g]["mismatch_count"] += 1
    by_grade[g]["devices"].append(d)

for g in by_grade:
    by_grade[g]["capital"] = round(by_grade[g]["capital"], 2)

total_returned_capital = sum(d["purchase_price"] for d in returned_devices)
total_mismatches = sum(1 for d in returned_devices if d["has_condition_mismatch"])

task21 = {
    "task": "TASK 21 — Returned Devices",
    "total_returned": len(returned_devices),
    "total_capital": round(total_returned_capital, 2),
    "total_with_condition_mismatches": total_mismatches,
    "by_listing_grade": by_grade
}

# ─── Output ───

output = {
    "task_20_stuck_devices": task20,
    "task_21_returned_devices": task21
}

print(json.dumps(output, indent=2))
