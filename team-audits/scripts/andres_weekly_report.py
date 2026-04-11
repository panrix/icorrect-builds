#!/usr/bin/env python3
"""
ANDRES WEEKLY PERFORMANCE REPORT
Repair Technician

Expected output: 4 repairs per day (works Mon-Sat)

METHODOLOGY:
- Uses activity logs to track ACTUAL completions (status changed to Repaired/Part Repaired)
- Distinguishes between BM devices, client devices, and internal tasks
- Tracks parts used to assess repair complexity
- Compares against team benchmarks (Mykhailo)
- GMT timezone (API returns timestamps that need -8hr correction)

NOTES:
- Internal tasks (pallet breaking, stock help, cutting screens, etc.) count but tracked separately
- Future enhancement: Track output quantity for internal tasks (e.g., screens cut per hour)
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

ANDRES_ID = "49001724"
ANDRES_NAME = "Andres Egas"

# For comparison
MYKHAILO_ID = "64642914"

# Expected capacity
EXPECTED_ITEMS_PER_DAY = 4
WORKING_DAYS_PER_WEEK = 6  # Mon-Sat
WORKING_HOURS_PER_DAY = 9  # 9am - 6pm
WORKING_MINS_PER_DAY = WORKING_HOURS_PER_DAY * 60

# Timezone offset (API timestamps need this adjustment for GMT)
TIMEZONE_OFFSET_HOURS = 8

# Internal task keywords
INTERNAL_TASK_KEYWORDS = [
    "pallet", "stock", "tcoom", "metal bar", "swap", "cut", "fitting",
    "screen cut", "inventory", "cleaning", "sort"
]

# Columns to fetch
COLUMNS = [
    'time_tracking9',   # Repair Time
    'time_tracking93',  # Refurb Time
    'time_tracking',    # Diagnostic Time
    'time_tracking98',  # Total Time
    'status4',          # Status
    'status',           # Client
    'color_mkypbg6z',   # Trade-in status
    'color_mkqgtewd',   # Screen (Actual)
    'color_mkqg4zhy',   # Battery (Actual)
    'color_mkxga4sk',   # Keyboard
    'status24',         # Repair Type
    'service'
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

def is_internal_task(name):
    """Check if item is an internal task based on name"""
    name_lower = name.lower()
    return any(keyword in name_lower for keyword in INTERNAL_TASK_KEYWORDS)

def categorize_item(name):
    """Categorize item as BM device, client device, or internal task"""
    if is_internal_task(name):
        return "internal"
    elif name.startswith("BM "):
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

    ids_str = ", ".join(str(i) for i in item_ids[:50])  # Limit to 50 at a time
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

def extract_parts_from_updates(updates):
    """Extract parts used from update messages"""
    parts = {
        "screen": False,
        "battery": False,
        "keyboard": False,
        "trackpad": False,
        "other": []
    }
    total_parts = 0

    for upd in updates:
        body = upd.get("body", "")
        if "Parts" in body and "Deducted" in body:
            body_lower = body.lower()
            if "screen" in body_lower or "lcd" in body_lower or "display" in body_lower:
                parts["screen"] = True
            if "battery" in body_lower:
                parts["battery"] = True
            if "keyboard" in body_lower:
                parts["keyboard"] = True
            if "trackpad" in body_lower:
                parts["trackpad"] = True

            # Count total parts (bullet points)
            total_parts += body.count("•")

    parts["total"] = total_parts
    return parts

# ============================================================
# MAIN ANALYSIS
# ============================================================
def generate_report():
    last_monday, last_sunday = get_last_week_range()
    week_start = last_monday.strftime("%Y-%m-%d")
    week_end = last_sunday.strftime("%Y-%m-%d")
    week_label = f"{last_monday.strftime('%d %b')} - {last_sunday.strftime('%d %b %Y')}"

    print(f"Fetching data for week: {week_label}")
    print(f"Using activity log methodology for accurate completion tracking")

    # ========================================
    # STEP 1: Get Andres's activity logs
    # ========================================
    print("\nStep 1: Fetching Andres's activity logs...")
    activities = get_activity_logs(ANDRES_ID, week_start, week_end)
    print(f"  Found {len(activities)} activity log entries")

    # ========================================
    # STEP 2: Identify items touched and completed
    # ========================================
    print("\nStep 2: Analyzing completions...")

    items_touched = set()
    items_completed = {}
    status_changes = []

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

        # Check for status changes to Repaired/Part Repaired
        if event == "update_column_value":
            col_id = data.get("column_id", "")
            value = data.get("value", {})

            if col_id == "status4":
                new_label = ""
                if isinstance(value, dict) and "label" in value:
                    new_label = value["label"].get("text", "")

                if new_label in ["Repaired", "Part Repaired"]:
                    dt = parse_timestamp(created_at)
                    if dt and item_id not in items_completed:
                        items_completed[item_id] = {
                            "name": item_name,
                            "status": new_label,
                            "completed_at": dt,
                            "category": categorize_item(item_name)
                        }

                # Track all status changes
                if new_label:
                    prev_value = data.get("previous_value", {})
                    old_label = ""
                    if isinstance(prev_value, dict) and "label" in prev_value:
                        old_label = prev_value["label"].get("text", "")

                    dt = parse_timestamp(created_at)
                    if dt:
                        status_changes.append({
                            "item_id": item_id,
                            "item_name": item_name,
                            "from": old_label,
                            "to": new_label,
                            "time": dt
                        })

    print(f"  Items touched: {len(items_touched)}")
    print(f"  Items completed: {len(items_completed)}")

    # ========================================
    # STEP 3: Get full details for completed items
    # ========================================
    print("\nStep 3: Fetching item details...")
    item_details = get_item_details(list(items_completed.keys()))
    print(f"  Retrieved details for {len(item_details)} items")

    # Build item lookup with details
    items_lookup = {}
    for item in item_details:
        item_id = item.get("id")

        repair_time_str, _ = get_col(item, "time_tracking9")
        refurb_time_str, _ = get_col(item, "time_tracking93")
        diag_time_str, _ = get_col(item, "time_tracking")
        status, _ = get_col(item, "status4")
        client, _ = get_col(item, "status")
        screen_actual, _ = get_col(item, "color_mkqgtewd")
        battery_actual, _ = get_col(item, "color_mkqg4zhy")
        keyboard, _ = get_col(item, "color_mkxga4sk")

        # Extract parts from updates
        parts = extract_parts_from_updates(item.get("updates", []))

        completion_info = items_completed.get(int(item_id), {})

        items_lookup[item_id] = {
            "id": item_id,
            "name": item.get("name", ""),
            "group": item.get("group", {}).get("title", "Unknown"),
            "repair_time_str": repair_time_str,
            "repair_mins": parse_time_to_mins(repair_time_str),
            "refurb_time_str": refurb_time_str,
            "refurb_mins": parse_time_to_mins(refurb_time_str),
            "diag_time_str": diag_time_str,
            "diag_mins": parse_time_to_mins(diag_time_str),
            "status": status,
            "client": client,
            "screen_actual": screen_actual,
            "battery_actual": battery_actual,
            "keyboard": keyboard,
            "parts": parts,
            "category": completion_info.get("category", categorize_item(item.get("name", ""))),
            "completed_at": completion_info.get("completed_at"),
            "completion_status": completion_info.get("status", "")
        }

    # ========================================
    # STEP 4: Get Mykhailo's completions for comparison
    # ========================================
    print("\nStep 4: Fetching Mykhailo's completions for comparison...")
    mykhailo_activities = get_activity_logs(MYKHAILO_ID, week_start, week_end)

    mykhailo_completed = {}
    for act in mykhailo_activities:
        event = act.get("event", "")
        data_str = act.get("data", "{}")
        created_at = act.get("created_at", "")

        try:
            data = json.loads(data_str) if isinstance(data_str, str) else data_str
        except:
            continue

        item_id = data.get("pulse_id")
        item_name = data.get("pulse_name", "")

        if event == "update_column_value" and data.get("column_id") == "status4":
            value = data.get("value", {})
            new_label = ""
            if isinstance(value, dict) and "label" in value:
                new_label = value["label"].get("text", "")

            if new_label in ["Repaired", "Part Repaired"]:
                if item_id not in mykhailo_completed:
                    mykhailo_completed[item_id] = {
                        "name": item_name,
                        "category": categorize_item(item_name)
                    }

    print(f"  Mykhailo completed: {len(mykhailo_completed)} items")

    # ========================================
    # STEP 5: Count updates written
    # ========================================
    print("\nStep 5: Counting updates...")

    andres_updates = []
    last_week_start = last_monday.replace(hour=0, minute=0, second=0)
    last_week_end = last_sunday.replace(hour=23, minute=59, second=59)

    for item_id, item in items_lookup.items():
        detail = next((i for i in item_details if i.get("id") == item_id), None)
        if detail:
            for upd in detail.get("updates", []):
                creator = upd.get("creator", {})
                if creator and str(creator.get("id")) == ANDRES_ID:
                    created = upd.get("created_at", "")
                    if created:
                        try:
                            dt = datetime.fromisoformat(created.replace("Z", "+00:00")).replace(tzinfo=None)
                            dt = dt - timedelta(hours=TIMEZONE_OFFSET_HOURS)
                            if last_week_start <= dt <= last_week_end:
                                andres_updates.append({
                                    "item_name": item["name"],
                                    "body": upd.get("body", ""),
                                    "created_at": dt
                                })
                        except:
                            pass

    print(f"  Updates written: {len(andres_updates)}")

    # ========================================
    # STEP 6: Categorize and calculate metrics
    # ========================================
    bm_devices = [i for i in items_lookup.values() if i["category"] == "bm_device"]
    client_devices = [i for i in items_lookup.values() if i["category"] == "client_device"]
    internal_tasks = [i for i in items_lookup.values() if i["category"] == "internal"]

    # Also categorize from items_completed for items not in lookup
    for item_id, info in items_completed.items():
        if str(item_id) not in items_lookup:
            if info["category"] == "bm_device":
                bm_devices.append({"name": info["name"], "category": "bm_device", "completed_at": info["completed_at"]})
            elif info["category"] == "client_device":
                client_devices.append({"name": info["name"], "category": "client_device", "completed_at": info["completed_at"]})
            elif info["category"] == "internal":
                internal_tasks.append({"name": info["name"], "category": "internal", "completed_at": info["completed_at"]})

    # Mykhailo categorization
    mykhailo_bm = sum(1 for i in mykhailo_completed.values() if i["category"] == "bm_device")
    mykhailo_client = sum(1 for i in mykhailo_completed.values() if i["category"] == "client_device")
    mykhailo_internal = sum(1 for i in mykhailo_completed.values() if i["category"] == "internal")

    # Time metrics
    total_repair_mins = sum(i.get("repair_mins", 0) for i in items_lookup.values())
    total_refurb_mins = sum(i.get("refurb_mins", 0) for i in items_lookup.values())
    total_diag_mins = sum(i.get("diag_mins", 0) for i in items_lookup.values())
    total_logged_mins = total_repair_mins + total_refurb_mins + total_diag_mins

    # Parts metrics
    screen_repairs = sum(1 for i in items_lookup.values() if i.get("parts", {}).get("screen"))
    battery_repairs = sum(1 for i in items_lookup.values() if i.get("parts", {}).get("battery"))
    total_parts = sum(i.get("parts", {}).get("total", 0) for i in items_lookup.values())

    # Daily breakdown
    by_day = defaultdict(list)
    for item_id, info in items_completed.items():
        if info.get("completed_at"):
            day = info["completed_at"].strftime("%Y-%m-%d")
            by_day[day].append(info)

    working_days = len(by_day) if by_day else WORKING_DAYS_PER_WEEK

    # Capacity metrics
    device_completions = len(bm_devices) + len(client_devices)  # Exclude internal for device count
    items_per_day = device_completions / working_days if working_days > 0 else 0
    expected_weekly_items = EXPECTED_ITEMS_PER_DAY * working_days
    completion_rate = (device_completions / expected_weekly_items) * 100 if expected_weekly_items > 0 else 0

    avg_daily_logged_mins = total_logged_mins / working_days if working_days > 0 else 0
    utilization = (avg_daily_logged_mins / WORKING_MINS_PER_DAY) * 100

    # ========================================
    # GENERATE MARKDOWN REPORT
    # ========================================

    item_status = "On target" if completion_rate >= 100 else "Below target" if completion_rate >= 75 else "Significantly below"
    util_status = "Good" if utilization >= 70 else "Under" if utilization >= 50 else "Low"

    report = f"""# Andres Weekly Performance Report
## Week: {week_label}

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')} (GMT)

**Role:** Repair Technician
**Expected Output:** {EXPECTED_ITEMS_PER_DAY} devices per day (Mon-Sat)
**Working Days This Week:** {working_days}

---

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Devices Completed** | {device_completions} ({items_per_day:.1f}/day) | {item_status} |
| **Internal Tasks** | {len(internal_tasks)} | Tracked separately |
| **Total Completions** | {len(items_completed)} | - |
| **Completion Rate** | {completion_rate:.0f}% | Target: {expected_weekly_items} devices |
| **Time Utilisation** | {utilization:.0f}% | {util_status} |

---

## Completion Breakdown

| Category | Andres | Mykhailo (comparison) |
|----------|--------|----------------------|
| BM Trade-in Devices | {len(bm_devices)} | {mykhailo_bm} |
| Client Devices | {len(client_devices)} | {mykhailo_client} |
| Internal Tasks | {len(internal_tasks)} | {mykhailo_internal} |
| **TOTAL** | **{len(items_completed)}** | **{len(mykhailo_completed)}** |

---

## BM Trade-in Devices ({len(bm_devices)})

| Device | Status | Repair Time | Refurb Time | Screen |
|--------|--------|-------------|-------------|--------|
"""

    for item in sorted(bm_devices, key=lambda x: x.get("completed_at") or datetime.min):
        name = item.get("name", "")[:35]
        status = item.get("completion_status", item.get("status", "-"))[:12]
        repair = item.get("repair_time_str", "-") or "-"
        refurb = item.get("refurb_time_str", "-") or "-"
        screen = item.get("screen_actual", "-") or "-"
        report += f"| {name} | {status} | {repair} | {refurb} | {screen} |\n"

    if not bm_devices:
        report += "| No BM devices completed | - | - | - | - |\n"

    report += f"""
---

## Client Devices ({len(client_devices)})

| Device | Status | Repair Time | Diag Time |
|--------|--------|-------------|-----------|
"""

    for item in sorted(client_devices, key=lambda x: x.get("completed_at") or datetime.min):
        name = item.get("name", "")[:40]
        status = item.get("completion_status", item.get("status", "-"))[:12]
        repair = item.get("repair_time_str", "-") or "-"
        diag = item.get("diag_time_str", "-") or "-"
        report += f"| {name} | {status} | {repair} | {diag} |\n"

    if not client_devices:
        report += "| No client devices completed | - | - | - |\n"

    report += f"""
---

## Internal Tasks ({len(internal_tasks)})

These are non-device tasks that contribute to workshop operations:

| Task | Completed |
|------|-----------|
"""

    for item in internal_tasks:
        name = item.get("name", "")[:50]
        completed = item.get("completed_at")
        time_str = completed.strftime("%a %d %b %H:%M") if completed else "-"
        report += f"| {name} | {time_str} |\n"

    if not internal_tasks:
        report += "| No internal tasks logged | - |\n"

    report += f"""
**Note:** Internal tasks count toward overall productivity but are tracked separately from device repairs.
Future enhancement: Track output quantity (e.g., screens cut per hour).

---

## Time Breakdown

### Weekly Totals
| Time Type | Hours | Minutes |
|-----------|-------|---------|
| Repair Time | {total_repair_mins/60:.1f} hrs | {total_repair_mins:.0f} min |
| Refurb Time | {total_refurb_mins/60:.1f} hrs | {total_refurb_mins:.0f} min |
| Diagnostic Time | {total_diag_mins/60:.1f} hrs | {total_diag_mins:.0f} min |
| **TOTAL LOGGED** | **{total_logged_mins/60:.1f} hrs** | **{total_logged_mins:.0f} min** |

### Daily Average
| Metric | Value |
|--------|-------|
| Available per day | {WORKING_HOURS_PER_DAY} hrs ({WORKING_MINS_PER_DAY} min) |
| Logged per day (avg) | {avg_daily_logged_mins/60:.1f} hrs ({avg_daily_logged_mins:.0f} min) |
| Utilisation | {utilization:.0f}% |

---

## Repair Complexity Analysis

| Metric | Andres |
|--------|--------|
| Screen repairs | {screen_repairs} |
| Battery repairs | {battery_repairs} |
| Total parts used | {total_parts} |
| Avg parts per device | {total_parts/max(device_completions,1):.1f} |

---

## Daily Breakdown

"""

    for day in sorted(by_day.keys()):
        items = by_day[day]
        try:
            day_name = datetime.strptime(day, "%Y-%m-%d").strftime("%A %d %b")
        except:
            day_name = day

        bm_count = sum(1 for i in items if i.get("category") == "bm_device")
        client_count = sum(1 for i in items if i.get("category") == "client_device")
        internal_count = sum(1 for i in items if i.get("category") == "internal")

        report += f"### {day_name}\n"
        report += f"- BM Devices: {bm_count}\n"
        report += f"- Client Devices: {client_count}\n"
        report += f"- Internal Tasks: {internal_count}\n"
        report += f"- **Total: {len(items)}**\n\n"

        report += "| Time | Item | Status |\n"
        report += "|------|------|--------|\n"
        for item in sorted(items, key=lambda x: x.get("completed_at") or datetime.min):
            time_str = item["completed_at"].strftime("%H:%M") if item.get("completed_at") else "-"
            name = item.get("name", "")[:40]
            status = item.get("status", "-")
            report += f"| {time_str} | {name} | {status} |\n"
        report += "\n"

    report += f"""---

## Updates Written ({len(andres_updates)})

"""

    if andres_updates:
        report += "| Time | Item | Content |\n"
        report += "|------|------|--------|\n"
        for upd in sorted(andres_updates, key=lambda x: x["created_at"])[:15]:
            time_str = upd["created_at"].strftime("%d %b %H:%M")
            item_name = upd["item_name"][:20] if upd["item_name"] else "Unknown"
            body = upd["body"][:40].replace("\n", " ").replace("|", "/").replace("<br>", " ") if upd["body"] else "N/A"
            report += f"| {time_str} | {item_name} | {body}... |\n"

        if len(andres_updates) > 15:
            report += f"\n*...and {len(andres_updates) - 15} more updates*\n"
    else:
        report += "*No updates found*\n"

    report += f"""
---

## Comparison with Mykhailo

| Metric | Andres | Mykhailo |
|--------|--------|----------|
| BM Devices | {len(bm_devices)} | {mykhailo_bm} |
| Client Devices | {len(client_devices)} | {mykhailo_client} |
| Internal Tasks | {len(internal_tasks)} | {mykhailo_internal} |
| Working Days | {working_days} | 4 (1 day leave) |
| Devices/Day | {items_per_day:.1f} | {(mykhailo_bm + mykhailo_client)/4:.1f} |

---

## Analysis & Recommendations

### Device Completion: {completion_rate:.0f}%
"""

    if completion_rate >= 100:
        report += """
**On Target** - Andres is meeting daily device targets.
"""
    elif completion_rate >= 75:
        report += f"""
**Below Target** - Completed {device_completions} of expected {expected_weekly_items} devices.

**Factors to investigate:**
- Time spent on internal tasks vs device repairs
- Complexity of repairs assigned
- Parts availability
"""
    else:
        report += f"""
**Significantly Below Target** - Only {completion_rate:.0f}% of expected output.

**Recommended actions:**
1. Review balance between internal tasks and device repairs
2. Assess repair complexity vs time spent
3. Check for blockers or parts issues
4. Compare workflow with other technicians
"""

    if len(internal_tasks) > 3:
        report += f"""
### Internal Tasks Note

Andres completed {len(internal_tasks)} internal tasks this week. While these contribute to
workshop operations, they should be balanced with device repair targets.

**Recommendation:** Track output quantity for internal tasks (e.g., "5 screens cut in 2 hours")
to properly assess productivity.
"""

    report += f"""
---

## Methodology Notes

This report uses **activity log analysis** for accurate metrics:
- **Devices Completed** = Status changed to Repaired/Part Repaired by Andres
- **Internal Tasks** = Items matching keywords: {', '.join(INTERNAL_TASK_KEYWORDS[:5])}...
- **Timestamps** = Adjusted to GMT (API returns timestamps +8 hours)
- **Comparison** = Mykhailo's completions fetched for context

*Report generated by andres_weekly_report.py*
*Data source: Monday.com Main Board via Activity Logs*
"""

    return report, week_label

# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    print("=" * 60)
    print("GENERATING ANDRES'S WEEKLY REPORT")
    print("=" * 60)

    report, week_label = generate_report()

    # Save to file
    filename = f"andres_report_{datetime.now().strftime('%Y-%m-%d')}.md"
    filepath = os.path.join(os.path.dirname(__file__), filename)

    with open(filepath, "w") as f:
        f.write(report)

    print(f"\nReport saved to: {filepath}")
    print("\n" + "=" * 60)
    print("REPORT PREVIEW:")
    print("=" * 60)
    print(report)
