#!/usr/bin/env python3
"""
MYKHAILO WEEKLY PERFORMANCE REPORT
Head of Refurbishment - Parts and MacBooks
Also completes iPhone screen refurbishments on Mondays

Expected output: 4-5 repairs/refurbs per day (capable of 5)
Tuesday 27th Jan was annual leave

METHODOLOGY:
- Uses activity logs to track ACTUAL completions (status changed to Repaired/Part Repaired)
- Distinguishes between "items touched" vs "items completed"
- Tracks blocked items and reasons
- GMT timezone (API returns timestamps that need -8hr correction from system time)
- Fetches updates from items Mykhailo worked on (not just board-level updates)
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

MYKHAILO_ID = "64642914"
MYKHAILO_NAME = "Mykhailo Kepeshchuk"

# Expected capacity
EXPECTED_ITEMS_PER_DAY = 5
WORKING_HOURS_PER_DAY = 9  # 9am - 6pm
WORKING_MINS_PER_DAY = WORKING_HOURS_PER_DAY * 60

# Timezone offset (API timestamps need this adjustment for GMT)
TIMEZONE_OFFSET_HOURS = 8

# Columns to fetch
COLUMNS = [
    'time_tracking93',  # Refurb Time
    'time_tracking9',   # Repair Time
    'time_tracking',    # Diagnostic Time
    'duration_mkyrykvn',  # Cleaning Time
    'time_tracking98',  # Total Time
    'date4',            # Received date
    'status4',          # Status
    'multiple_person_mkwqsxse',  # Refurb person
    'multiple_person_mkwqy930',  # Repair person
    'multiple_person_mkwqj321',  # Diagnostic person
    'person',           # Technician
    'status',           # Client
    'color_mkypbg6z',   # Trade-in status
    'service'
]

# ============================================================
# API HELPERS
# ============================================================
headers = {"Authorization": MONDAY_APP_TOKEN, "Content-Type": "application/json"}

def run_query(query):
    response = requests.post(MONDAY_API_URL, json={"query": query}, headers=headers)
    return response.json()

def parse_timestamp(ts):
    """Parse Monday.com nanosecond timestamp to datetime (GMT)"""
    try:
        unix_ts = int(ts) / 10000000
        dt = datetime.fromtimestamp(unix_ts)
        # Subtract timezone offset to get GMT
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

# ============================================================
# DATA FETCHING
# ============================================================
def get_activity_logs(from_date, to_date):
    """Fetch activity logs for Mykhailo from the board"""
    query = f'''
    query {{
        boards(ids: [{MAIN_BOARD_ID}]) {{
            activity_logs(
                user_ids: [{MYKHAILO_ID}],
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

    ids_str = ", ".join(str(i) for i in item_ids)
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
            updates {{
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

def get_item_activity(item_id):
    """Fetch activity logs for a specific item"""
    query = f'''
    query {{
        boards(ids: [{MAIN_BOARD_ID}]) {{
            activity_logs(item_ids: [{item_id}], limit: 100) {{
                id
                event
                data
                created_at
                user_id
            }}
        }}
    }}
    '''
    result = run_query(query)
    return result.get("data", {}).get("boards", [{}])[0].get("activity_logs", [])

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
    # STEP 1: Get Mykhailo's activity logs
    # ========================================
    print("\nStep 1: Fetching Mykhailo's activity logs...")
    activities = get_activity_logs(week_start, week_end)
    print(f"  Found {len(activities)} activity log entries")

    # ========================================
    # STEP 2: Identify items touched and completed
    # ========================================
    print("\nStep 2: Analyzing completions vs items touched...")

    items_touched = set()
    items_completed = {}  # item_id -> completion info
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
            col_title = data.get("column_title", "")
            value = data.get("value", {})

            if col_id == "status4" or col_title == "Status":
                new_label = ""
                if isinstance(value, dict) and "label" in value:
                    new_label = value["label"].get("text", "")

                if new_label in ["Repaired", "Part Repaired"]:
                    dt = parse_timestamp(created_at)
                    if dt and item_id not in items_completed:
                        items_completed[item_id] = {
                            "name": item_name,
                            "status": new_label,
                            "completed_at": dt
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
    print(f"  Items completed (Repaired/Part Repaired): {len(items_completed)}")

    # ========================================
    # STEP 3: Get full details for touched items
    # ========================================
    print("\nStep 3: Fetching details for touched items...")
    item_details = get_item_details(list(items_touched))
    print(f"  Retrieved details for {len(item_details)} items")

    # Build item lookup
    items_lookup = {}
    for item in item_details:
        item_id = item.get("id")

        refurb_time_str, _ = get_col(item, "time_tracking93")
        repair_time_str, _ = get_col(item, "time_tracking9")
        diag_time_str, _ = get_col(item, "time_tracking")
        status, _ = get_col(item, "status4")
        client, _ = get_col(item, "status")
        trade_in, _ = get_col(item, "color_mkypbg6z")

        items_lookup[item_id] = {
            "id": item_id,
            "name": item.get("name", ""),
            "group": item.get("group", {}).get("title", "Unknown"),
            "refurb_time_str": refurb_time_str,
            "refurb_mins": parse_time_to_mins(refurb_time_str),
            "repair_time_str": repair_time_str,
            "repair_mins": parse_time_to_mins(repair_time_str),
            "diag_time_str": diag_time_str,
            "diag_mins": parse_time_to_mins(diag_time_str),
            "status": status,
            "client": client,
            "trade_in": trade_in,
            "updates": item.get("updates", []),
            "completed": item_id in items_completed
        }

    # ========================================
    # STEP 4: Count Mykhailo's updates
    # ========================================
    print("\nStep 4: Counting updates written by Mykhailo...")

    mykhailo_updates = []
    last_week_start = last_monday.replace(hour=0, minute=0, second=0)
    last_week_end = last_sunday.replace(hour=23, minute=59, second=59)

    for item_id, item in items_lookup.items():
        for upd in item.get("updates", []):
            creator = upd.get("creator", {})
            if creator and str(creator.get("id")) == MYKHAILO_ID:
                created = upd.get("created_at", "")
                if created:
                    try:
                        dt = datetime.fromisoformat(created.replace("Z", "+00:00")).replace(tzinfo=None)
                        # Adjust for timezone
                        dt = dt - timedelta(hours=TIMEZONE_OFFSET_HOURS)
                        if last_week_start <= dt <= last_week_end:
                            mykhailo_updates.append({
                                "item_name": item["name"],
                                "body": upd.get("body", ""),
                                "created_at": dt
                            })
                    except:
                        pass

    print(f"  Found {len(mykhailo_updates)} updates written by Mykhailo")

    # ========================================
    # STEP 5: Categorize items
    # ========================================
    print("\nStep 5: Categorizing items...")

    completed_items = []
    in_progress_items = []
    blocked_items = []

    for item_id, item in items_lookup.items():
        if item["completed"]:
            completed_items.append(item)
        elif item["status"] in ["Queued For Repair", "Under Refurb", "Diagnostics"]:
            in_progress_items.append(item)
        elif "waiting" in item["status"].lower() or "blocked" in item["status"].lower():
            blocked_items.append(item)
        else:
            in_progress_items.append(item)

    # ========================================
    # STEP 6: Group by day
    # ========================================
    by_day = defaultdict(list)
    for sc in status_changes:
        day = sc["time"].strftime("%Y-%m-%d")
        by_day[day].append(sc)

    # ========================================
    # STEP 7: Calculate metrics
    # ========================================
    total_refurb_mins = sum(i["refurb_mins"] for i in items_lookup.values())
    total_repair_mins = sum(i["repair_mins"] for i in items_lookup.values())
    total_diag_mins = sum(i["diag_mins"] for i in items_lookup.values())
    total_logged_mins = total_refurb_mins + total_repair_mins + total_diag_mins

    # Working days (excluding known leave)
    working_days = len(by_day) if by_day else 4  # Default to 4 if Tuesday was leave

    items_per_day = len(completed_items) / working_days if working_days > 0 else 0
    avg_daily_logged_mins = total_logged_mins / working_days if working_days > 0 else 0
    utilization = (avg_daily_logged_mins / WORKING_MINS_PER_DAY) * 100

    expected_weekly_items = EXPECTED_ITEMS_PER_DAY * working_days
    completion_rate = (len(completed_items) / expected_weekly_items) * 100 if expected_weekly_items > 0 else 0

    # ========================================
    # GENERATE MARKDOWN REPORT
    # ========================================

    util_status = "Good" if utilization >= 70 else "Under" if utilization >= 50 else "Low"
    item_status = "On target" if completion_rate >= 80 else "Below target" if completion_rate >= 60 else "Significantly below"

    report = f"""# Mykhailo Weekly Performance Report
## Week: {week_label}

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')} (GMT)

**Role:** Head of Refurbishment (Parts & MacBooks)
**Expected Output:** {EXPECTED_ITEMS_PER_DAY} repairs/refurbs per day
**Working Days This Week:** {working_days} (Tuesday was annual leave)

---

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Items Completed** | {len(completed_items)} | {item_status} |
| **Items Touched** | {len(items_touched)} | - |
| **Items In Progress** | {len(in_progress_items)} | - |
| **Completion Rate** | {completion_rate:.0f}% | Target: {expected_weekly_items} items |
| **Time Utilisation** | {utilization:.0f}% | {util_status} |
| **Updates Written** | {len(mykhailo_updates)} | - |

**Key Finding:** Mykhailo touched {len(items_touched)} items but completed {len(completed_items)} to Repaired/Part Repaired status.

---

## Completed Items ({len(completed_items)})

These items had their status changed to **Repaired** or **Part Repaired** by Mykhailo:

| Item | Status | Refurb Time | Repair Time | Diag Time |
|------|--------|-------------|-------------|-----------|
"""

    for item in completed_items:
        name = item["name"][:40]
        status = items_completed.get(item["id"], {}).get("status", item["status"])
        refurb = item["refurb_time_str"] or "-"
        repair = item["repair_time_str"] or "-"
        diag = item["diag_time_str"] or "-"
        report += f"| {name} | {status} | {refurb} | {repair} | {diag} |\n"

    if not completed_items:
        report += "| No items completed to Repaired/Part Repaired | - | - | - | - |\n"

    report += f"""
---

## Items In Progress ({len(in_progress_items)})

Items touched but not yet completed:

| Item | Current Status | Group | Refurb Time |
|------|----------------|-------|-------------|
"""

    for item in in_progress_items[:15]:
        name = item["name"][:40]
        status = item["status"][:20]
        group = item["group"][:15]
        refurb = item["refurb_time_str"] or "-"
        report += f"| {name} | {status} | {group} | {refurb} |\n"

    if len(in_progress_items) > 15:
        report += f"| ... and {len(in_progress_items) - 15} more | - | - | - |\n"

    report += f"""
---

## Time Breakdown

### Weekly Totals
| Time Type | Hours | Minutes |
|-----------|-------|---------|
| Refurb Time | {total_refurb_mins/60:.1f} hrs | {total_refurb_mins:.0f} min |
| Repair Time | {total_repair_mins/60:.1f} hrs | {total_repair_mins:.0f} min |
| Diagnostic Time | {total_diag_mins/60:.1f} hrs | {total_diag_mins:.0f} min |
| **TOTAL LOGGED** | **{total_logged_mins/60:.1f} hrs** | **{total_logged_mins:.0f} min** |

### Daily Average
| Metric | Value |
|--------|-------|
| Available per day | {WORKING_HOURS_PER_DAY} hrs ({WORKING_MINS_PER_DAY} min) |
| Logged per day (avg) | {avg_daily_logged_mins/60:.1f} hrs ({avg_daily_logged_mins:.0f} min) |
| Utilisation | {utilization:.0f}% |

---

## Daily Activity Timeline

"""

    for day in sorted(by_day.keys()):
        changes = by_day[day]
        try:
            day_name = datetime.strptime(day, "%Y-%m-%d").strftime("%A %d %b")
        except:
            day_name = day

        report += f"### {day_name}\n\n"
        report += "| Time | Item | Status Change |\n"
        report += "|------|------|---------------|\n"

        for sc in sorted(changes, key=lambda x: x["time"]):
            time_str = sc["time"].strftime("%H:%M")
            item_name = sc["item_name"][:35] if sc["item_name"] else "Unknown"
            change = f"{sc['from']} -> {sc['to']}"
            report += f"| {time_str} | {item_name} | {change} |\n"

        report += "\n"

    report += f"""---

## Updates Written by Mykhailo ({len(mykhailo_updates)})

"""

    if mykhailo_updates:
        report += "| Time | Item | Content |\n"
        report += "|------|------|--------|\n"
        for upd in sorted(mykhailo_updates, key=lambda x: x["created_at"])[:20]:
            time_str = upd["created_at"].strftime("%d %b %H:%M")
            item_name = upd["item_name"][:25] if upd["item_name"] else "Unknown"
            body = upd["body"][:50].replace("\n", " ").replace("|", "/").replace("<br>", " ") if upd["body"] else "N/A"
            report += f"| {time_str} | {item_name} | {body}... |\n"

        if len(mykhailo_updates) > 20:
            report += f"\n*...and {len(mykhailo_updates) - 20} more updates*\n"
    else:
        report += "*No updates found*\n"

    report += f"""
---

## Analysis & Recommendations

### Completion Rate: {completion_rate:.0f}%
"""

    if completion_rate >= 80:
        report += """
**Strong Performance** - Mykhailo is meeting or exceeding targets.
"""
    elif completion_rate >= 60:
        report += f"""
**Below Target** - Completed {len(completed_items)} of expected {expected_weekly_items} items.

**Factors to investigate:**
- Were there complex repairs requiring extra time?
- Parts availability issues?
- Items blocked waiting for client decisions?
"""
    else:
        report += f"""
**Significantly Below Target** - Only {completion_rate:.0f}% of expected output.

**Recommended actions:**
1. Review which items are stuck and why
2. Check for parts availability blockers
3. Assess workload distribution
4. Verify time tracking accuracy
"""

    if utilization < 60:
        report += f"""
### Low Time Utilisation ({utilization:.0f}%)

Only {utilization:.0f}% of working time is logged. This could indicate:
- Time tracking not used consistently
- Administrative tasks not captured
- Meetings, training, mentoring time
- Waiting/idle time between tasks

**Action:** Review if all work is being tracked appropriately.
"""

    report += f"""
---

## Methodology Notes

This report uses **activity log analysis** for accurate metrics:
- **Items Completed** = Status changed to Repaired/Part Repaired by Mykhailo
- **Items Touched** = Any item Mykhailo made changes to
- **Timestamps** = Adjusted to GMT (API returns timestamps +8 hours)
- **Updates** = Queried from items Mykhailo worked on, not board-level

*Report generated by mykhailo_weekly_report.py*
*Data source: Monday.com Main Board via Activity Logs*
"""

    return report, week_label

# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    print("=" * 60)
    print("GENERATING MYKHAILO'S WEEKLY REPORT")
    print("=" * 60)

    report, week_label = generate_report()

    # Save to file
    filename = f"mykhailo_report_{datetime.now().strftime('%Y-%m-%d')}.md"
    filepath = os.path.join(os.path.dirname(__file__), filename)

    with open(filepath, "w") as f:
        f.write(report)

    print(f"\nReport saved to: {filepath}")
    print("\n" + "=" * 60)
    print("REPORT PREVIEW:")
    print("=" * 60)
    print(report)
