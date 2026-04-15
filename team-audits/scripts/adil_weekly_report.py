#!/usr/bin/env python3
"""
ADIL WEEKLY PERFORMANCE REPORT
Generates a comprehensive weekly report combining:
- Device volumes from Monday.com
- Client visits from Typeform
- Interruption analysis
- Utilisation vs Stress metrics

Run this script each week to generate a markdown report.
"""

import requests
import json
from datetime import datetime, timedelta
from collections import defaultdict
import os

# ============================================================
# CONFIGURATION
# ============================================================
MONDAY_APP_TOKEN = os.environ.get("MONDAY_API_TOKEN", "")
TYPEFORM_API_TOKEN = os.environ.get("TYPEFORM_API_TOKEN", "")

MONDAY_API_URL = "https://api.monday.com/v2"
TYPEFORM_API_URL = "https://api.typeform.com"
MAIN_BOARD_ID = "349212843"

# Time estimates (in minutes)
TIME_RECEPTION = 12.5
TIME_UNBOXING = 4
TIME_BM_DIAGNOSTIC = 20
TIME_PREDIAG = 12.5
TIME_BM_CLEANING = 12
TIME_FULL_INTAKE = 39  # cleaning + diagnostic

# Typeform IDs
FORMS = {
    "nNUHw0cK": "Drop-off",
    "vslvbFQr": "Collection",
    "LtNyVqVN": "No Appointment",
    "NOt5ys9r": "Enquiry"
}

# ============================================================
# DATE RANGE CALCULATION
# ============================================================
def get_last_week_range():
    """Get Monday-Sunday of last week"""
    today = datetime.now()
    days_since_monday = today.weekday()
    if days_since_monday == 0:
        last_monday = today - timedelta(days=7)
    else:
        last_monday = today - timedelta(days=days_since_monday + 7)
    last_sunday = last_monday + timedelta(days=6)
    return last_monday, last_sunday

# ============================================================
# API HELPERS
# ============================================================
monday_headers = {"Authorization": MONDAY_APP_TOKEN, "Content-Type": "application/json"}
typeform_headers = {"Authorization": f"Bearer {TYPEFORM_API_TOKEN}"}

def monday_query(query):
    response = requests.post(MONDAY_API_URL, json={"query": query}, headers=monday_headers)
    return response.json()

def get_monday_items(board_id, columns):
    all_items = []
    cursor = None
    while True:
        if cursor:
            query = f'''query {{ next_items_page(cursor: "{cursor}", limit: 500) {{ cursor items {{ id name created_at column_values(ids: {json.dumps(columns)}) {{ id text }} }} }} }}'''
        else:
            query = f'''query {{ boards(ids: [{board_id}]) {{ items_page(limit: 500) {{ cursor items {{ id name created_at column_values(ids: {json.dumps(columns)}) {{ id text }} }} }} }} }}'''
        result = monday_query(query)
        if "errors" in result:
            break
        page_data = result.get("data", {}).get("next_items_page", {}) if cursor else result.get("data", {}).get("boards", [{}])[0].get("items_page", {})
        items = page_data.get("items", [])
        all_items.extend(items)
        cursor = page_data.get("cursor")
        if not cursor or not items:
            break
    return all_items

def get_typeform_responses(form_id, start_iso, end_iso):
    url = f"{TYPEFORM_API_URL}/forms/{form_id}/responses"
    params = {"since": start_iso, "until": end_iso, "page_size": 1000}
    response = requests.get(url, headers=typeform_headers, params=params)
    if response.status_code == 200:
        return response.json().get("items", [])
    return []

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str[:10], "%Y-%m-%d").date()
    except:
        return None

def get_col(item, col_id):
    for cv in item.get("column_values", []):
        if cv["id"] == col_id:
            return cv.get("text", "")
    return ""

# ============================================================
# MAIN REPORT GENERATION
# ============================================================
def generate_report():
    last_monday, last_sunday = get_last_week_range()
    week_start = last_monday.strftime("%Y-%m-%d")
    week_end = last_sunday.strftime("%Y-%m-%d")
    week_start_iso = last_monday.replace(hour=0, minute=0, second=0).isoformat() + "Z"
    week_end_iso = last_sunday.replace(hour=23, minute=59, second=59).isoformat() + "Z"

    week_label = f"{last_monday.strftime('%d %b')} - {last_sunday.strftime('%d %b %Y')}"

    # ========================================
    # FETCH MONDAY DATA
    # ========================================
    main_cols = ["status", "service", "date4", "color_mkypbg6z"]
    main_items = get_monday_items(MAIN_BOARD_ID, main_cols)

    daily_devices = defaultdict(lambda: {
        "bm_tradeins": 0, "mailin_bm": 0, "mailin_normal": 0, "walkin_repairs": 0
    })

    def is_in_week(date_val):
        if not date_val:
            return False
        start = datetime.strptime(week_start, "%Y-%m-%d").date()
        end = datetime.strptime(week_end, "%Y-%m-%d").date()
        return start <= date_val <= end

    for item in main_items:
        client = get_col(item, "status")
        service = get_col(item, "service")
        trade_in_status = get_col(item, "color_mkypbg6z")
        received_date = parse_date(get_col(item, "date4"))

        if not is_in_week(received_date):
            continue

        if client == "BM" and trade_in_status == "Trade-in":
            daily_devices[received_date]["bm_tradeins"] += 1
        elif service == "Mail-In":
            if client == "BM":
                daily_devices[received_date]["mailin_bm"] += 1
            else:
                daily_devices[received_date]["mailin_normal"] += 1
        elif service == "Walk-In":
            daily_devices[received_date]["walkin_repairs"] += 1

    # ========================================
    # FETCH TYPEFORM DATA
    # ========================================
    all_visitors = []
    form_totals = {}
    daily_visits = defaultdict(lambda: defaultdict(int))

    for form_id, form_name in FORMS.items():
        responses = get_typeform_responses(form_id, week_start_iso, week_end_iso)
        form_totals[form_name] = len(responses)

        for resp in responses:
            submitted_at = resp.get("submitted_at", "")
            if submitted_at:
                try:
                    dt = datetime.fromisoformat(submitted_at.replace("Z", "+00:00"))
                    all_visitors.append({
                        "type": form_name,
                        "timestamp": dt,
                        "date": dt.date(),
                        "hour": dt.hour
                    })
                    daily_visits[dt.date()][form_name] += 1
                except:
                    pass

    all_visitors.sort(key=lambda x: x["timestamp"])

    # ========================================
    # CALCULATE TOTALS
    # ========================================
    total_bm_tradeins = sum(d["bm_tradeins"] for d in daily_devices.values())
    total_mailin_bm = sum(d["mailin_bm"] for d in daily_devices.values())
    total_mailin_normal = sum(d["mailin_normal"] for d in daily_devices.values())
    total_walkin_repairs = sum(d["walkin_repairs"] for d in daily_devices.values())
    total_devices = total_bm_tradeins + total_mailin_bm + total_mailin_normal + total_walkin_repairs
    total_mailins = total_mailin_bm + total_mailin_normal
    total_visits = len(all_visitors)

    # ========================================
    # CALCULATE TIME
    # ========================================
    devices_to_unbox = total_bm_tradeins + total_mailins
    time_unboxing = devices_to_unbox * TIME_UNBOXING
    time_bm_diagnostic = total_bm_tradeins * TIME_BM_DIAGNOSTIC
    time_reception = total_visits * TIME_RECEPTION
    current_total_mins = time_unboxing + time_bm_diagnostic + time_reception

    working_days = len(daily_devices) if daily_devices else 5
    daily_avg_mins = current_total_mins / working_days if working_days > 0 else 0
    utilization = (daily_avg_mins / 480) * 100  # 8hr day = 480 min

    # ========================================
    # INTERRUPTION ANALYSIS
    # ========================================
    all_gaps = []
    short_gaps = medium_gaps = long_gaps = 0
    hourly_counts = defaultdict(int)

    daily_visitor_list = defaultdict(list)
    for v in all_visitors:
        daily_visitor_list[v["date"]].append(v)
        hourly_counts[v["hour"]] += 1

    for day, visitors in daily_visitor_list.items():
        visitors_sorted = sorted(visitors, key=lambda x: x["timestamp"])
        for i in range(1, len(visitors_sorted)):
            gap = (visitors_sorted[i]["timestamp"] - visitors_sorted[i-1]["timestamp"]).total_seconds() / 60
            all_gaps.append(gap)
            if gap < 15:
                short_gaps += 1
            elif gap < 30:
                medium_gaps += 1
            else:
                long_gaps += 1

    avg_gap = sum(all_gaps) / len(all_gaps) if all_gaps else 0
    gaps_for_full_intake = sum(1 for g in all_gaps if g >= TIME_FULL_INTAKE)
    pct_long_enough = (gaps_for_full_intake / len(all_gaps) * 100) if all_gaps else 0

    peak_hour = max(hourly_counts.keys(), key=lambda h: hourly_counts[h]) if hourly_counts else 12

    # Stress indicator: short gaps percentage
    short_gap_pct = (short_gaps / len(all_gaps) * 100) if all_gaps else 0

    # ========================================
    # GENERATE MARKDOWN REPORT
    # ========================================
    report = f"""# Adil Weekly Performance Report
## Week: {week_label}

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}

---

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Utilisation** | {utilization:.0f}% | {'🟢 Under capacity' if utilization < 70 else '🟡 Moderate' if utilization < 85 else '🔴 High'} |
| **Stress Indicator** | {short_gap_pct:.0f}% short gaps | {'🟢 Low' if short_gap_pct < 20 else '🟡 Moderate' if short_gap_pct < 35 else '🔴 High'} |
| **Interruption Risk** | {100 - pct_long_enough:.0f}% | {'🟢 Low' if pct_long_enough > 60 else '🟡 Moderate' if pct_long_enough > 40 else '🔴 High'} |

**Key Insight:** Adil is **{utilization:.0f}% utilised** but experiences interruptions during **{100 - pct_long_enough:.0f}%** of BM trade-in processing attempts.

---

## Volume Summary

### Devices Received
| Type | Count |
|------|-------|
| BM Trade-ins | {total_bm_tradeins} |
| Mail-in (BM) | {total_mailin_bm} |
| Mail-in (Normal) | {total_mailin_normal} |
| Walk-in Repairs | {total_walkin_repairs} |
| **TOTAL** | **{total_devices}** |

### Client Visits (iPad Typeform)
| Type | Count |
|------|-------|
| Booked Drop-offs | {form_totals.get('Drop-off', 0)} |
| No Appointment | {form_totals.get('No Appointment', 0)} |
| Enquiries | {form_totals.get('Enquiry', 0)} |
| Collections | {form_totals.get('Collection', 0)} |
| **TOTAL** | **{total_visits}** |

---

## Time Breakdown

### Current Workload
| Task | Calculation | Time |
|------|-------------|------|
| Unboxing/Logging | {devices_to_unbox} devices × {TIME_UNBOXING} min | {time_unboxing:.0f} min |
| BM Diagnostics | {total_bm_tradeins} devices × {TIME_BM_DIAGNOSTIC} min | {time_bm_diagnostic:.0f} min |
| Reception | {total_visits} visits × {TIME_RECEPTION} min | {time_reception:.0f} min |
| **WEEKLY TOTAL** | | **{current_total_mins:.0f} min ({current_total_mins/60:.1f} hrs)** |
| **DAILY AVERAGE** | | **{daily_avg_mins:.0f} min ({daily_avg_mins/60:.1f} hrs)** |

### Capacity Analysis
| Metric | Value |
|--------|-------|
| Available per day (8hr) | 480 min |
| Current usage | {daily_avg_mins:.0f} min ({utilization:.0f}%) |
| Remaining capacity | {480 - daily_avg_mins:.0f} min/day |

---

## Interruption Analysis

### Visitor Patterns
- **Peak hour:** {peak_hour:02d}:00 ({hourly_counts.get(peak_hour, 0)} visitors)
- **Average gap between visitors:** {avg_gap:.0f} min
- **Visitors per day (avg):** {total_visits / working_days:.1f}

### Gap Distribution
| Gap Type | Count | Percentage | Impact |
|----------|-------|------------|--------|
| Short (<15 min) | {short_gaps} | {short_gap_pct:.0f}% | Cannot complete meaningful work |
| Medium (15-30 min) | {medium_gaps} | {medium_gaps/len(all_gaps)*100 if all_gaps else 0:.0f}% | Quick tasks only |
| Long (>30 min) | {long_gaps} | {long_gaps/len(all_gaps)*100 if all_gaps else 0:.0f}% | Focused work possible |

### BM Trade-in Impact
- Time needed for full intake: **{TIME_FULL_INTAKE} min** (cleaning + diagnostic)
- Gaps long enough for full intake: **{gaps_for_full_intake}/{len(all_gaps)} ({pct_long_enough:.0f}%)**
- **Adil will be interrupted during {100 - pct_long_enough:.0f}% of BM trade-in processing**

---

## Daily Breakdown

| Day | Devices | Visitors | Utilisation |
|-----|---------|----------|-------------|
"""

    all_days = sorted(set(daily_devices.keys()) | set(daily_visits.keys()))
    for day in all_days:
        devices = daily_devices.get(day, {"bm_tradeins": 0, "mailin_bm": 0, "mailin_normal": 0, "walkin_repairs": 0})
        day_devices = devices["bm_tradeins"] + devices["mailin_bm"] + devices["mailin_normal"] + devices["walkin_repairs"]
        day_visitors = sum(daily_visits[day].values())

        day_time = (devices["bm_tradeins"] + devices["mailin_bm"] + devices["mailin_normal"]) * TIME_UNBOXING
        day_time += devices["bm_tradeins"] * TIME_BM_DIAGNOSTIC
        day_time += day_visitors * TIME_RECEPTION
        day_util = (day_time / 480) * 100

        report += f"| {day.strftime('%A %d %b')} | {day_devices} | {day_visitors} | {day_util:.0f}% |\n"

    # Conversion analysis
    potential_leads = form_totals.get('No Appointment', 0) + form_totals.get('Enquiry', 0)
    conversion_rate = (total_walkin_repairs / potential_leads * 100) if potential_leads > 0 else 0

    report += f"""
---

## Conversion Analysis

| Metric | Value |
|--------|-------|
| No Appointment + Enquiry submissions | {potential_leads} |
| Walk-in repairs logged | {total_walkin_repairs} |
| **Conversion Rate** | **{conversion_rate:.0f}%** |

---

## Recommendations

"""

    if utilization < 70 and short_gap_pct > 25:
        report += """### The Paradox: Low Utilisation, High Stress
Adil has capacity on paper, but constant interruptions create cognitive overload.

**Actions:**
1. Consider a "do not disturb" window (e.g., 9-11 AM) for BM diagnostic work
2. Batch collections to specific time slots (e.g., 2-4 PM)
3. Train Adil to pause timers when handling visitors (for accurate data)
"""
    elif utilization > 85:
        report += """### High Utilisation Warning
Adil is approaching capacity limits.

**Actions:**
1. Consider additional intake support
2. Review if all tasks assigned to Adil are necessary
3. Look for process efficiency gains
"""
    else:
        report += """### Balanced Workload
Current workload appears sustainable.

**Actions:**
1. Continue monitoring weekly
2. Watch for trends in visitor volume
3. Consider pre-diagnostics for non-BM devices (capacity available)
"""

    report += f"""
---

*Report generated by adil_weekly_report.py*
*Data sources: Monday.com Main Board, Typeform API*
"""

    return report, week_label

# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    print("Generating Adil's Weekly Report...")
    print("-" * 50)

    report, week_label = generate_report()

    # Save to file
    filename = f"adil_report_{datetime.now().strftime('%Y-%m-%d')}.md"
    filepath = os.path.join(os.path.dirname(__file__), filename)

    with open(filepath, "w") as f:
        f.write(report)

    print(f"\nReport saved to: {filepath}")
    print("\n" + "=" * 50)
    print("REPORT PREVIEW:")
    print("=" * 50)
    print(report)
