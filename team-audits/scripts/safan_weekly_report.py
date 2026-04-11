#!/usr/bin/env python3
"""
SAFAN WEEKLY PERFORMANCE REPORT
Repairs and Advanced Repairs Technician

Expected output: 5 repairs per day (works Mon-Sat)

METHODOLOGY:
- Uses activity logs to track ACTUAL completions (status changed to Repaired/Part Repaired)
- Tracks SUPPORT BLOCKERS: items paused, parts shortages, diagnostic time, QC failures
- Distinguishes between BM devices, client devices, and advanced repairs
- GMT timezone (API returns timestamps that need -8hr correction)

KEY INSIGHT: Safan's completion rate is often limited by SUPPORT issues, not productivity:
- Parts availability (trackpads, keyboards, etc.)
- Time spent on diagnostics (doesn't count as completions)
- Software installs (waiting/dead time)
- QC failures causing rework
"""

import requests
import json
from datetime import datetime, timedelta
from collections import defaultdict
import os

# ============================================================
# CONFIGURATION
# ============================================================
MONDAY_APP_TOKEN = "MONDAY_TOKEN_REDACTED"
MONDAY_API_URL = "https://api.monday.com/v2"
MAIN_BOARD_ID = "349212843"

SAFAN_ID = "25304513"
SAFAN_NAME = "Safan Patel"

# For comparison
ANDRES_ID = "49001724"
MYKHAILO_ID = "64642914"

# Expected capacity
EXPECTED_ITEMS_PER_DAY = 5
WORKING_DAYS_PER_WEEK = 6  # Mon-Sat
WORKING_HOURS_PER_DAY = 9  # 9am - 6pm
WORKING_MINS_PER_DAY = WORKING_HOURS_PER_DAY * 60

# Timezone offset (API timestamps need this adjustment for GMT)
TIMEZONE_OFFSET_HOURS = 8

# Blocker statuses
BLOCKER_STATUSES = ["Repair Paused", "Awaiting Part", "Awaiting Info"]
DIAGNOSTIC_STATUSES = ["Diagnostics", "Diagnostic Complete", "Battery Testing"]
SOFTWARE_STATUSES = ["Software Install"]

# Columns to fetch
COLUMNS = [
    'time_tracking9',   # Repair Time
    'time_tracking93',  # Refurb Time
    'time_tracking',    # Diagnostic Time
    'time_tracking98',  # Total Time
    'status4',          # Status
    'status',           # Client
    'text_mkpp9s3h',    # Repair Notes
    'color_mkqgtewd',   # Screen (Actual)
    'color_mkqg4zhy',   # Battery (Actual)
    'color_mkxga4sk',   # Keyboard
    'status24',         # Repair Type
    'date4',            # Received date
]

# ============================================================
# API HELPERS
# ============================================================
headers = {"Authorization": MONDAY_APP_TOKEN, "Content-Type": "application/json"}

def run_query(query, retries=3):
    for i in range(retries):
        try:
            response = requests.post(MONDAY_API_URL, json={"query": query}, headers=headers, timeout=30)
            return response.json()
        except:
            if i < retries - 1:
                import time
                time.sleep(2)
    return {}

def parse_timestamp(ts):
    """Parse Monday.com nanosecond timestamp to datetime (GMT)"""
    try:
        unix_ts = int(ts) / 10000000
        dt = datetime.fromtimestamp(unix_ts)
        return dt - timedelta(hours=TIMEZONE_OFFSET_HOURS)
    except:
        return None

def parse_time_to_mins(time_str):
    """Parse HH:MM:SS format to minutes"""
    if not time_str:
        return 0
    try:
        parts = time_str.split(':')
        if len(parts) == 3:
            hours = int(parts[0])
            mins = int(parts[1])
            secs = int(parts[2])
            return hours * 60 + mins + secs / 60
        elif len(parts) == 2:
            return int(parts[0]) + int(parts[1]) / 60
    except:
        pass
    return 0

def get_col(item, col_id):
    """Get column value from item"""
    for cv in item.get("column_values", []):
        if cv["id"] == col_id:
            return cv.get("text", ""), cv.get("value", "")
    return "", ""

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

def categorize_item(name):
    """Categorize item as BM device or client device"""
    if name.startswith("BM "):
        return "bm_device"
    else:
        return "client_device"

# ============================================================
# DATA FETCHING
# ============================================================
def get_activity_logs(user_id, from_date, to_date):
    """Fetch activity logs for a user from the board"""
    query = f'''
    query {{
        boards(ids: [{MAIN_BOARD_ID}]) {{
            activity_logs(
                user_ids: [{user_id}],
                from: "{from_date}",
                to: "{to_date}",
                limit: 500
            ) {{
                id
                event
                data
                created_at
            }}
        }}
    }}
    '''
    result = run_query(query)
    return result.get("data", {}).get("boards", [{}])[0].get("activity_logs", [])

def get_item_details(item_ids):
    """Fetch full details for specific items"""
    if not item_ids:
        return []

    ids_str = ", ".join(str(i) for i in item_ids[:50])
    query = f'''
    query {{
        items(ids: [{ids_str}]) {{
            id
            name
            group {{ id title }}
            column_values(ids: {json.dumps(COLUMNS)}) {{
                id
                text
                value
            }}
            updates(limit: 5) {{
                id
                body
                created_at
                creator {{ id name }}
            }}
        }}
    }}
    '''
    result = run_query(query)
    return result.get("data", {}).get("items", [])

# ============================================================
# MAIN ANALYSIS
# ============================================================
def generate_report():
    last_monday, last_sunday = get_last_week_range()
    week_start = last_monday.strftime("%Y-%m-%d")
    week_end = last_sunday.strftime("%Y-%m-%d")
    week_label = f"{last_monday.strftime('%d %b')} - {last_sunday.strftime('%d %b %Y')}"

    print(f"Fetching data for week: {week_label}")
    print(f"Using activity log methodology with SUPPORT BLOCKER analysis")

    # ========================================
    # STEP 1: Get Safan's activity logs
    # ========================================
    print("\nStep 1: Fetching Safan's activity logs...")
    activities = get_activity_logs(SAFAN_ID, week_start, week_end)
    print(f"  Found {len(activities)} activity log entries")

    # ========================================
    # STEP 2: Parse ALL status changes for deep analysis
    # ========================================
    print("\nStep 2: Analyzing all status changes...")

    items_touched = set()
    items_completed = {}
    items_blocked = {}  # Items that went to blocker status
    items_in_diagnostics = {}  # Time spent in diagnostics
    items_in_software = {}  # Time spent in software install
    qc_failures = []  # Items that failed QC and came back

    all_status_changes = []
    daily_activity = defaultdict(lambda: {
        "completions": [],
        "blocked": [],
        "diagnostics": [],
        "software_installs": [],
        "first_activity": None,
        "last_activity": None
    })

    for act in activities:
        event = act.get("event", "")
        data_str = act.get("data", "{}")
        created_at = act.get("created_at", "")

        try:
            data = json.loads(data_str) if isinstance(data_str, str) else data_str
        except:
            data = {}

        item_id = data.get("pulse_id")
        item_name = data.get("pulse_name", "")

        if item_id:
            items_touched.add(item_id)

        dt = parse_timestamp(created_at)
        if not dt:
            continue

        day_key = dt.strftime("%Y-%m-%d")

        # Track first/last activity per day
        if daily_activity[day_key]["first_activity"] is None or dt < daily_activity[day_key]["first_activity"]:
            daily_activity[day_key]["first_activity"] = dt
        if daily_activity[day_key]["last_activity"] is None or dt > daily_activity[day_key]["last_activity"]:
            daily_activity[day_key]["last_activity"] = dt

        if event == "update_column_value":
            col_id = data.get("column_id", "")
            value = data.get("value", {})

            if col_id == "status4":
                new_label = ""
                old_label = ""
                if isinstance(value, dict) and "label" in value:
                    new_label = value["label"].get("text", "")
                prev_value = data.get("previous_value", {})
                if isinstance(prev_value, dict) and "label" in prev_value:
                    old_label = prev_value["label"].get("text", "")

                # Track completions
                if new_label in ["Repaired", "Part Repaired"]:
                    if item_id not in items_completed:
                        items_completed[item_id] = {
                            "name": item_name,
                            "status": new_label,
                            "completed_at": dt,
                            "category": categorize_item(item_name)
                        }
                        daily_activity[day_key]["completions"].append({
                            "name": item_name, "time": dt, "status": new_label
                        })

                # Track blockers
                if new_label in BLOCKER_STATUSES:
                    if item_id not in items_blocked:
                        items_blocked[item_id] = []
                    items_blocked[item_id].append({
                        "name": item_name,
                        "status": new_label,
                        "blocked_at": dt,
                        "from_status": old_label
                    })
                    daily_activity[day_key]["blocked"].append({
                        "name": item_name, "time": dt, "status": new_label
                    })

                # Track diagnostics
                if new_label in DIAGNOSTIC_STATUSES:
                    if item_id not in items_in_diagnostics:
                        items_in_diagnostics[item_id] = {"name": item_name, "started": dt, "ended": None}
                    else:
                        items_in_diagnostics[item_id]["started"] = dt
                    daily_activity[day_key]["diagnostics"].append({
                        "name": item_name, "time": dt, "status": new_label
                    })

                # Track when diagnostics end
                if old_label in DIAGNOSTIC_STATUSES and new_label not in DIAGNOSTIC_STATUSES:
                    if item_id in items_in_diagnostics:
                        items_in_diagnostics[item_id]["ended"] = dt

                # Track software installs
                if new_label in SOFTWARE_STATUSES:
                    if item_id not in items_in_software:
                        items_in_software[item_id] = {"name": item_name, "started": dt}
                    daily_activity[day_key]["software_installs"].append({
                        "name": item_name, "time": dt
                    })

                # Track QC failures (came back from QC)
                if old_label == "QC Failure" or (old_label == "QC Passed" and new_label == "Under Repair"):
                    qc_failures.append({
                        "name": item_name,
                        "time": dt,
                        "item_id": item_id
                    })

                # Store all status changes
                all_status_changes.append({
                    "item_id": item_id,
                    "item_name": item_name,
                    "from": old_label,
                    "to": new_label,
                    "time": dt
                })

    print(f"  Items touched: {len(items_touched)}")
    print(f"  Items completed: {len(items_completed)}")
    print(f"  Items blocked: {len(items_blocked)}")
    print(f"  Items in diagnostics: {len(items_in_diagnostics)}")
    print(f"  QC failures: {len(qc_failures)}")

    # ========================================
    # STEP 3: Get details for blocked items (current status + notes)
    # ========================================
    print("\nStep 3: Fetching blocked item details...")

    # Get items that were blocked but NOT completed by Safan
    still_blocked_ids = [id for id in items_blocked.keys() if id not in items_completed]
    blocked_details = get_item_details(still_blocked_ids) if still_blocked_ids else []

    blocked_items_info = []
    parts_needed = defaultdict(list)  # Track parts shortages

    for item in blocked_details:
        item_id = item.get("id")
        name = item.get("name", "")
        status, _ = get_col(item, "status4")
        notes, _ = get_col(item, "text_mkpp9s3h")
        client, _ = get_col(item, "status")

        blocked_items_info.append({
            "id": item_id,
            "name": name,
            "status": status,
            "notes": notes,
            "client": client
        })

        # Extract parts needed from notes
        if notes:
            notes_lower = notes.lower()
            if "trackpad" in notes_lower or "track pad" in notes_lower:
                parts_needed["Trackpad"].append(name)
            if "keyboard" in notes_lower:
                parts_needed["Keyboard/Backlight"].append(name)
            if "touch bar" in notes_lower or "touchbar" in notes_lower:
                parts_needed["Touch Bar"].append(name)
            if "screen" in notes_lower or "lcd" in notes_lower or "display" in notes_lower:
                parts_needed["Screen"].append(name)
            if "battery" in notes_lower:
                parts_needed["Battery"].append(name)
            if "cpu" in notes_lower or "logic board" in notes_lower:
                parts_needed["CPU/Logic Board"].append(name)

    print(f"  Retrieved details for {len(blocked_items_info)} blocked items")

    # ========================================
    # STEP 4: Get completed item details
    # ========================================
    print("\nStep 4: Fetching completed item details...")
    completed_details = get_item_details(list(items_completed.keys()))

    items_lookup = {}
    for item in completed_details:
        item_id = item.get("id")
        repair_time_str, _ = get_col(item, "time_tracking9")
        refurb_time_str, _ = get_col(item, "time_tracking93")
        diag_time_str, _ = get_col(item, "time_tracking")

        completion_info = items_completed.get(int(item_id), {})

        items_lookup[item_id] = {
            "id": item_id,
            "name": item.get("name", ""),
            "repair_time_str": repair_time_str,
            "repair_mins": parse_time_to_mins(repair_time_str),
            "refurb_time_str": refurb_time_str,
            "refurb_mins": parse_time_to_mins(refurb_time_str),
            "diag_time_str": diag_time_str,
            "diag_mins": parse_time_to_mins(diag_time_str),
            "category": completion_info.get("category", categorize_item(item.get("name", ""))),
            "completed_at": completion_info.get("completed_at"),
            "completion_status": completion_info.get("status", "")
        }

    # ========================================
    # STEP 5: Calculate metrics
    # ========================================

    # Daily completions
    total_completions = len(items_completed)

    # Calculate diagnostic time (non-completion work)
    total_diag_time_mins = 0
    for item_id, info in items_in_diagnostics.items():
        if info["started"] and info["ended"]:
            duration = (info["ended"] - info["started"]).seconds / 60
            total_diag_time_mins += duration

    # Count days with activity
    working_days = len([d for d in daily_activity.values() if d["first_activity"]])
    if working_days == 0:
        working_days = WORKING_DAYS_PER_WEEK

    items_per_day = total_completions / working_days
    expected_weekly = EXPECTED_ITEMS_PER_DAY * working_days
    completion_rate = (total_completions / expected_weekly * 100) if expected_weekly > 0 else 0

    # Potential completions if no blockers
    potential_completions = total_completions + len(still_blocked_ids)
    potential_rate = (potential_completions / expected_weekly * 100) if expected_weekly > 0 else 0

    # ========================================
    # GENERATE REPORT
    # ========================================

    bm_completed = sum(1 for i in items_completed.values() if i["category"] == "bm_device")
    client_completed = sum(1 for i in items_completed.values() if i["category"] == "client_device")

    report = f"""# Safan Weekly Performance Report
## Week: {week_label}

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')} (GMT)

**Role:** Repairs & Advanced Repairs Technician
**Expected Output:** {EXPECTED_ITEMS_PER_DAY} repairs per day (Mon-Sat)
**Working Days This Week:** {working_days}

---

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Completions** | {total_completions} ({items_per_day:.1f}/day) | {"On target" if completion_rate >= 100 else "Below target"} |
| **Completion Rate** | {completion_rate:.0f}% | Target: {expected_weekly} |
| **Items Blocked** | {len(still_blocked_ids)} | Support needed |
| **Potential Rate** | {potential_rate:.0f}% | If blockers resolved |

---

## ⚠️ SUPPORT BLOCKERS SUMMARY

### Impact Analysis
| Metric | Count | Impact |
|--------|-------|--------|
| Items currently blocked | {len(still_blocked_ids)} | -{len(still_blocked_ids)} completions |
| QC failures (rework) | {len(qc_failures)} | Lost time on rework |
| Items in diagnostics | {len(items_in_diagnostics)} | Time not counted as completions |

### Completion Gap Analysis
```
Actual completions:     {total_completions} ({completion_rate:.0f}%)
Blocked items:         +{len(still_blocked_ids)}
─────────────────────────────
Potential completions:  {potential_completions} ({potential_rate:.0f}%)

Gap to target: {expected_weekly - total_completions} items
Blocked items: {len(still_blocked_ids)} items
Support gap:   {max(0, (expected_weekly - total_completions) - len(still_blocked_ids))} items
```

**Key Insight:** {"Blocked items account for most of the gap - this is a SUPPORT problem, not productivity." if len(still_blocked_ids) >= (expected_weekly - total_completions) * 0.5 else "Gap is a mix of blockers and throughput."}

---

## 🔴 BLOCKED ITEMS ({len(still_blocked_ids)})

Items Safan started but couldn't complete due to parts/info:

| Item | Current Status | Reason/Notes |
|------|----------------|--------------|
"""

    for item in blocked_items_info:
        name = item["name"][:40]
        status = item["status"]
        notes = item["notes"][:35] if item["notes"] else "No notes - needs update"
        report += f"| {name} | {status} | {notes} |\n"

    if not blocked_items_info:
        report += "| No blocked items | - | - |\n"

    # Parts shortage section
    if parts_needed:
        report += f"""
### 🔧 PARTS SHORTAGES

| Part Needed | Devices Waiting | Count |
|-------------|-----------------|-------|
"""
        for part, devices in sorted(parts_needed.items(), key=lambda x: -len(x[1])):
            device_list = ", ".join(d[:20] for d in devices[:3])
            if len(devices) > 3:
                device_list += f" +{len(devices)-3} more"
            report += f"| **{part}** | {device_list} | {len(devices)} |\n"

        report += f"""
**Action Required:** Procure {sum(len(d) for d in parts_needed.values())} parts to unblock {len(still_blocked_ids)} devices.
"""

    # QC Failures section
    if qc_failures:
        report += f"""
### 🔄 QC FAILURES (Rework)

{len(qc_failures)} items failed QC and required rework:

| Item | Time | Impact |
|------|------|--------|
"""
        for qc in qc_failures:
            name = qc["name"][:40]
            time_str = qc["time"].strftime("%a %d %b %H:%M")
            report += f"| {name} | {time_str} | Added rework time |\n"

    # Daily breakdown with blockers
    report += f"""
---

## Daily Breakdown

"""

    days_order = sorted(daily_activity.keys())
    for day in days_order:
        data = daily_activity[day]
        if not data["first_activity"]:
            continue

        try:
            day_name = datetime.strptime(day, "%Y-%m-%d").strftime("%A %d %b")
        except:
            day_name = day

        completions = len(data["completions"])
        blocked = len(data["blocked"])
        diags = len(data["diagnostics"])

        first_time = data["first_activity"].strftime("%H:%M") if data["first_activity"] else "-"
        last_time = data["last_activity"].strftime("%H:%M") if data["last_activity"] else "-"

        status_icon = "✓" if completions >= EXPECTED_ITEMS_PER_DAY else "⚠️" if completions >= 3 else "❌"

        report += f"""### {day_name} {status_icon}
**Active:** {first_time} - {last_time} | **Completions:** {completions} | **Blocked:** {blocked} | **Diagnostics:** {diags}

"""

        if completions < EXPECTED_ITEMS_PER_DAY and blocked > 0:
            report += f"*⚠️ {blocked} items blocked - contributed to low completion count*\n\n"

        # Show completions
        if data["completions"]:
            report += "| Time | Item | Status |\n|------|------|--------|\n"
            for c in sorted(data["completions"], key=lambda x: x["time"]):
                time_str = c["time"].strftime("%H:%M")
                report += f"| {time_str} | {c['name'][:40]} | ✓ {c['status']} |\n"

        # Show blockers for this day
        if data["blocked"]:
            report += "\n**Blocked this day:**\n"
            for b in data["blocked"]:
                time_str = b["time"].strftime("%H:%M")
                report += f"- {time_str}: {b['name'][:35]} → {b['status']}\n"

        report += "\n"

    # Completions summary
    report += f"""---

## Completions Summary

| Category | Count |
|----------|-------|
| BM Devices | {bm_completed} |
| Client Devices | {client_completed} |
| **Total** | **{total_completions}** |

---

## Recommendations

### Immediate Actions
"""

    if parts_needed:
        report += f"1. **Procure parts:** {', '.join(parts_needed.keys())} - will unblock {len(still_blocked_ids)} devices\n"

    if len([i for i in blocked_items_info if not i["notes"]]) > 0:
        report += f"2. **Update notes:** {len([i for i in blocked_items_info if not i['notes']])} blocked items have no reason documented\n"

    if qc_failures:
        report += f"3. **Review QC failures:** {len(qc_failures)} items failed QC - investigate root cause\n"

    report += f"""
### Support Improvements
- **Parts forecasting:** Track common parts that cause blocks
- **Diagnostic capacity:** Consider dedicated diagnostic resource
- **Software install station:** Parallel installs to reduce wait time

---

## Methodology Notes

This report uses **activity log analysis** with **support blocker tracking**:
- **Completions** = Status changed to Repaired/Part Repaired
- **Blocked** = Status changed to Repair Paused/Awaiting Part/Awaiting Info
- **Potential rate** = What Safan could achieve if blockers were resolved
- **Parts needed** = Extracted from repair notes on blocked items

*Report generated by safan_weekly_report.py*
"""

    return report, week_label

# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    print("=" * 60)
    print("GENERATING SAFAN'S WEEKLY REPORT")
    print("(with Support Blocker Analysis)")
    print("=" * 60)

    report, week_label = generate_report()

    # Save to file
    filename = f"safan_report_{datetime.now().strftime('%Y-%m-%d')}.md"
    filepath = os.path.join(os.path.dirname(__file__), filename)

    with open(filepath, "w") as f:
        f.write(report)

    print(f"\nReport saved to: {filepath}")
    print("\n" + "=" * 60)
    print("REPORT PREVIEW:")
    print("=" * 60)
    print(report)
