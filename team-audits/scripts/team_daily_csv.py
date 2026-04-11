#!/usr/bin/env python3
"""
TEAM DAILY CSV GENERATOR
Reusable script that produces a per-day CSV for any iCorrect team member.

Tracks: start/finish times, meetings, lunch breaks, completions, pauses,
revenue, net profit, utilisation, and max capacity.

Usage:
    python team_daily_csv.py --person mykhailo --from 2026-02-09 --to 2026-03-01
    python team_daily_csv.py --person safan --from 2026-02-09 --to 2026-03-01
"""

import requests
import json
import csv
import argparse
import os
import time as time_module
from datetime import datetime, timedelta
from collections import defaultdict

# ============================================================
# CONFIGURATION
# ============================================================

MONDAY_API_URL = "https://api.monday.com/v2"
MAIN_BOARD_ID = "349212843"
FERRARI_BOARD_ID = "18393875720"
BM_BOARD_ID = "3892194968"

# Timezone: VPS is UTC. Monday 17-digit timestamps convert to UTC directly.
# The -8hr offset in older scripts was for Ricky's Bali Mac (UTC+8).
TIMEZONE_OFFSET_HOURS = 0

# Financial constants
LABOUR_RATE_PER_HOUR = 15  # £15/hr
BM_SHIPPING_COST = 15      # £15 flat

# Status values
COMPLETED_STATUSES = ["Repaired", "Part Repaired", "Refurbed", "Collected", "Delivered"]
PAUSED_STATUSES = ["Repair Paused", "Awaiting Part", "Awaiting Info"]

# Columns to fetch for item details
ITEM_COLUMNS = [
    'time_tracking93',       # Refurb Time
    'time_tracking9',        # Repair Time
    'time_tracking',         # Diagnostic Time
    'duration_mkyrykvn',     # Cleaning Time
    'time_tracking98',       # Total Time
    'status4',               # Status
    'status',                # Client
    'color_mkypbg6z',        # Trade-in Status
    'service',               # Service type
    'dup__of_quote_total',   # Paid (inc VAT) — client revenue
    'formula_mkx1anwb',      # Revenue ex VAT
    'formula_mkx1bjqr',      # Total Labour cost
]

# BM board columns
BM_COLUMNS = [
    'numeric5',              # Sale Price
    'numeric',               # Purchase Price
    'formula',               # BM Fee
    'formula7',              # Tax
    'board_relation',        # Link to main board
    'text_mkqy3576',         # Order ID
]

# Person configs
PERSONS = {
    "mykhailo": {
        "user_id": "64642914",
        "name": "Mykhailo Kepeshchuk",
        "expected_items_per_day": 5,
        "working_hours": 9,
        "role": "refurb_tech",
    },
    "safan": {
        "user_id": "25304513",
        "name": "Safan Patel",
        "expected_items_per_day": 5,
        "working_hours": 9,
        "role": "repair_tech",
    },
    "andreas": {
        "user_id": "49001724",
        "name": "Andreas Egas",
        "expected_items_per_day": 4,
        "working_hours": 9,
        "role": "refurb_tech",
    },
    "roni": {
        "user_id": "79665360",
        "name": "Roni Mykhailiuk",
        "expected_items_per_day": None,
        "working_hours": 9,
        "role": "qc_parts",
    },
    "adil": {
        "user_id": "94961618",
        "name": "Adil Azad",
        "expected_items_per_day": None,
        "working_hours": 8,
        "role": "front_desk",
    },
    "ferrari": {
        "user_id": "55780786",
        "name": "Michael Ferrari",
        "expected_items_per_day": None,
        "working_hours": 8,
        "role": "client_services",
    },
}

# ============================================================
# TOKEN LOADING
# ============================================================

def load_token():
    """Load Monday API token from .env file"""
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
    if not os.path.exists(env_path):
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    with open(env_path) as f:
        for line in f:
            if line.startswith('MONDAY_APP_TOKEN='):
                return line.strip().split('=', 1)[1]
    raise ValueError("MONDAY_APP_TOKEN not found in .env")


# ============================================================
# API HELPERS
# ============================================================

def run_query(query, headers, retries=3):
    """Execute Monday.com GraphQL query with retry"""
    for i in range(retries):
        try:
            resp = requests.post(MONDAY_API_URL, json={"query": query}, headers=headers, timeout=30)
            result = resp.json()
            if "errors" in result:
                print(f"  API error: {result['errors'][0].get('message', 'unknown')}")
                if i < retries - 1:
                    time_module.sleep(2)
                    continue
            return result
        except Exception as e:
            if i < retries - 1:
                time_module.sleep(2)
            else:
                print(f"  Request failed after {retries} retries: {e}")
    return {}


def parse_timestamp(ts):
    """Parse Monday.com 17-digit timestamp to datetime (GMT/London time)"""
    try:
        unix_ts = int(ts) / 10000000
        dt = datetime.fromtimestamp(unix_ts)
        return dt - timedelta(hours=TIMEZONE_OFFSET_HOURS)
    except:
        return None


def parse_time_to_mins(time_str):
    """Parse HH:MM:SS or seconds to minutes"""
    if not time_str:
        return 0
    try:
        # Try HH:MM:SS
        parts = time_str.split(':')
        if len(parts) == 3:
            return int(parts[0]) * 60 + int(parts[1]) + int(parts[2]) / 60
        elif len(parts) == 2:
            return int(parts[0]) + int(parts[1]) / 60
        # Try raw seconds
        return float(time_str) / 60
    except:
        return 0


def get_col(item, col_id):
    """Get column (text, value) from item safely"""
    for cv in item.get("column_values", []):
        if cv["id"] == col_id:
            return cv.get("text", ""), cv.get("value", "")
    return "", ""


def get_col_numeric(item, col_id):
    """Get column value as float, return 0 if missing"""
    text, value = get_col(item, col_id)
    try:
        if text:
            return float(text.replace('£', '').replace(',', '').strip())
        if value:
            v = json.loads(value) if isinstance(value, str) else value
            if isinstance(v, (int, float)):
                return float(v)
    except:
        pass
    return 0.0


# ============================================================
# DATA FETCHING
# ============================================================

def fetch_activity_logs(board_id, user_id, from_date, to_date, headers):
    """Fetch all activity logs, paginated (500 per page)"""
    all_logs = []
    page = 1
    while True:
        query = f'''query {{
            boards(ids: [{board_id}]) {{
                activity_logs(
                    user_ids: [{user_id}],
                    from: "{from_date}T00:00:00Z",
                    to: "{to_date}T23:59:59Z",
                    limit: 500,
                    page: {page}
                ) {{
                    id event data created_at user_id
                }}
            }}
        }}'''
        result = run_query(query, headers)
        logs = result.get("data", {}).get("boards", [{}])[0].get("activity_logs", [])
        all_logs.extend(logs)
        print(f"  Page {page}: {len(logs)} entries")
        if len(logs) < 500:
            break
        page += 1
        time_module.sleep(0.5)  # Rate limit
    return all_logs


def fetch_meeting_data(from_date, to_date, headers):
    """Fetch team meeting durations from Ferrari's board.

    Meeting items have name containing 'meeting' and duration tracked
    in duration_mkzakpnw. The date comes from startDate in the duration
    value (Unix timestamp), not from a date column.
    """
    query = f'''query {{
        boards(ids: [{FERRARI_BOARD_ID}]) {{
            items_page(limit: 200) {{
                items {{
                    id name
                    column_values(ids: ["duration_mkzakpnw"]) {{
                        id text value
                    }}
                }}
            }}
        }}
    }}'''
    result = run_query(query, headers)
    items = result.get("data", {}).get("boards", [{}])[0].get("items_page", {}).get("items", [])

    meetings_by_date = {}
    from_dt = datetime.strptime(from_date, "%Y-%m-%d")
    to_dt = datetime.strptime(to_date, "%Y-%m-%d")

    for item in items:
        name = item.get("name", "")
        if "meeting" not in name.lower():
            continue

        duration_text, duration_val = get_col(item, "duration_mkzakpnw")

        # Parse duration value JSON
        duration_secs = 0
        start_date = None
        try:
            v = json.loads(duration_val) if isinstance(duration_val, str) else duration_val
            if isinstance(v, dict):
                duration_secs = v.get("duration", 0)
                start_ts = v.get("startDate")
                if start_ts:
                    start_date = datetime.fromtimestamp(start_ts)
        except:
            pass

        if duration_secs == 0 or not start_date:
            continue

        duration_mins = duration_secs / 60

        # Check if meeting falls within date range
        if start_date.date() < from_dt.date() or start_date.date() > to_dt.date():
            continue

        date_key = start_date.strftime("%Y-%m-%d")
        meetings_by_date[date_key] = meetings_by_date.get(date_key, 0) + duration_mins

    return meetings_by_date


def fetch_item_details(item_ids, headers, columns=None):
    """Batch fetch item details (max 25 per query to avoid complexity limits)"""
    if not item_ids:
        return {}

    if columns is None:
        columns = ITEM_COLUMNS

    items_lookup = {}
    batch_size = 25  # Monday.com complexity limit hits around 50+ items with many columns
    id_list = [x for x in list(item_ids) if x and x != "None"]

    for i in range(0, len(id_list), batch_size):
        batch = id_list[i:i + batch_size]
        ids_str = ", ".join(str(x) for x in batch)
        query = f'''query {{
            items(ids: [{ids_str}]) {{
                id name
                group {{ id title }}
                column_values(ids: {json.dumps(columns)}) {{
                    id text value
                }}
            }}
        }}'''
        result = run_query(query, headers)
        for item in result.get("data", {}).get("items", []):
            items_lookup[item["id"]] = item
        if i + batch_size < len(id_list):
            time_module.sleep(0.5)

    return items_lookup


def fetch_bm_items_by_ids(main_board_item_ids, items_detail, headers):
    """Fetch BM board financials for items linked from main board.

    Matches via: (1) board_relation links, (2) BM order number from item name.
    Main board BM items are named like 'BM 1388 (Julie Reilly)' — we extract
    the number and match against BM board item names or order IDs.
    """
    if not main_board_item_ids:
        return {}

    # Extract BM order numbers from main board item names
    import re
    bm_numbers = {}  # order_number -> main_board_item_id
    for item_id in main_board_item_ids:
        item = items_detail.get(item_id)
        if not item:
            continue
        name = item.get("name", "")
        match = re.search(r'BM\s*(\d+)', name, re.IGNORECASE)
        if match:
            bm_numbers[match.group(1)] = item_id

    if not bm_numbers:
        return {}

    # Fetch BM board items (paginated — board has 1000+ items)
    bm_items = []
    cursor = None
    while True:
        if cursor:
            query = f'''query {{
                next_items_page(limit: 500, cursor: "{cursor}") {{
                    cursor
                    items {{
                        id name
                        column_values(ids: {json.dumps(BM_COLUMNS)}) {{
                            id text value
                        }}
                    }}
                }}
            }}'''
            result = run_query(query, headers)
            page_data = result.get("data", {}).get("next_items_page", {})
        else:
            query = f'''query {{
                boards(ids: [{BM_BOARD_ID}]) {{
                    items_page(limit: 500) {{
                        cursor
                        items {{
                            id name
                            column_values(ids: {json.dumps(BM_COLUMNS)}) {{
                                id text value
                            }}
                        }}
                    }}
                }}
            }}'''
            result = run_query(query, headers)
            page_data = result.get("data", {}).get("boards", [{}])[0].get("items_page", {})

        page_items = page_data.get("items", [])
        bm_items.extend(page_items)
        cursor = page_data.get("cursor")
        print(f"    BM board page: {len(page_items)} items (total: {len(bm_items)})")

        if not cursor or len(page_items) < 500:
            break
        time_module.sleep(0.5)

    bm_by_main_id = {}
    for bm_item in bm_items:
        bm_name = bm_item.get("name", "")

        # Try board_relation first
        relation_text, relation_val = get_col(bm_item, "board_relation")
        if relation_val:
            try:
                v = json.loads(relation_val) if isinstance(relation_val, str) else relation_val
                linked_ids = v.get("linkedPulseIds", [])
                for link in linked_ids:
                    linked_id = str(link.get("linkedPulseId", ""))
                    if linked_id in main_board_item_ids:
                        bm_by_main_id[linked_id] = bm_item
            except:
                pass

        # Try matching by BM order number in name
        for bm_num, main_id in bm_numbers.items():
            if bm_num in bm_name:
                bm_by_main_id[main_id] = bm_item

        # Try matching by order ID column
        order_text, _ = get_col(bm_item, "text_mkqy3576")
        if order_text:
            for bm_num, main_id in bm_numbers.items():
                if bm_num in order_text:
                    bm_by_main_id[main_id] = bm_item

    return bm_by_main_id


# ============================================================
# ANALYSIS FUNCTIONS
# ============================================================

def group_logs_by_day(activity_logs):
    """Parse and group activity logs by date (GMT)"""
    by_day = defaultdict(list)
    for log in activity_logs:
        dt = parse_timestamp(log.get("created_at", ""))
        if not dt:
            continue

        try:
            data = json.loads(log["data"]) if isinstance(log["data"], str) else log["data"]
        except:
            data = {}

        entry = {
            "dt": dt,
            "event": log.get("event", ""),
            "data": data,
            "item_id": str(data.get("pulse_id", "")),
            "item_name": data.get("pulse_name", ""),
        }

        # Extract status change info
        if entry["event"] == "update_column_value":
            col_id = data.get("column_id", "")
            value = data.get("value", {})
            prev = data.get("previous_value", {})

            new_label = ""
            old_label = ""
            if isinstance(value, dict) and "label" in value:
                new_label = value["label"].get("text", "")
            if isinstance(prev, dict) and "label" in prev:
                old_label = prev["label"].get("text", "")

            entry["col_id"] = col_id
            entry["new_status"] = new_label
            entry["old_status"] = old_label

        day_key = dt.strftime("%Y-%m-%d")
        by_day[day_key].append(entry)

    # Sort each day's entries chronologically
    for day in by_day:
        by_day[day].sort(key=lambda x: x["dt"])

    return by_day


def calc_start_finish(day_entries):
    """Get first and last activity timestamps for a day"""
    if not day_entries:
        return None, None
    return day_entries[0]["dt"], day_entries[-1]["dt"]


def detect_lunch(day_entries, min_gap=20, max_gap=120):
    """
    Find lunch break for techs: lunch is when they PAUSE or FINISH an item
    and don't start another. The gap ends when they make their next action.

    A gap where the action BEFORE it was starting work (e.g. 'Under Refurb',
    'Diagnostics') means they're actively repairing — not on lunch.

    Returns (duration_mins, start_time_str) so Ricky can cross-check CCTV.
    """
    # Statuses that mean "stopped working" (could go to lunch after these)
    STOP_STATUSES = {
        "Repair Paused", "Awaiting Part", "Awaiting Info",
        "Repaired", "Part Repaired", "Refurbed",
        "Collected", "Delivered", "Diagnostic Complete",
    }

    if len(day_entries) < 3:
        return 0, ""

    # Collect gaps where the preceding action was a stop/completion status
    # or a non-status action (parts logged, etc. — item is done)
    gaps = []
    for i in range(2, len(day_entries)):
        gap_mins = (day_entries[i]["dt"] - day_entries[i - 1]["dt"]).total_seconds() / 60
        if gap_mins < min_gap or gap_mins > max_gap:
            continue

        # Check if the action before the gap indicates work stopped
        prev_status = day_entries[i - 1].get("new_status", "")
        prev_event = day_entries[i - 1].get("event", "")

        is_stop = False
        if prev_status in STOP_STATUSES:
            is_stop = True
        elif prev_status == "" and prev_event == "update_column_value":
            # Non-status column update (e.g. Parts Used) — item wrap-up
            is_stop = True

        if is_stop:
            hour = day_entries[i - 1]["dt"].hour + day_entries[i - 1]["dt"].minute / 60
            # Prefer midday window but don't exclude entirely
            gaps.append((gap_mins, day_entries[i - 1]["dt"], hour))

    if not gaps:
        return 0, ""

    # Prefer midday gaps (11:30-15:00), fall back to any
    midday = [(g, t, h) for g, t, h in gaps if 11.5 <= h <= 15.0]
    if midday:
        best = max(midday, key=lambda x: x[0])
    else:
        best = max(gaps, key=lambda x: x[0])

    return round(best[0]), best[1].strftime("%H:%M")


def count_completions(day_entries, already_completed=None):
    """Count items moved to completed statuses.

    If already_completed set is provided, items that were already counted
    as completed on a previous day are excluded. This prevents double-counting
    when an item fails QC and gets re-completed (same status set twice).
    Only the FIRST completion counts.
    """
    if already_completed is None:
        already_completed = set()
    completed = set()
    for entry in day_entries:
        item_id = entry.get("item_id")
        if (entry.get("new_status") in COMPLETED_STATUSES
                and item_id
                and item_id not in already_completed):
            completed.add(item_id)
    return completed


def count_qc_reworks(day_entries):
    """Count items picked back up after QC failure.

    Signal: old_status = 'QC Failure' and new_status = 'Under Refurb' (or similar work status).
    This means the item failed QC and the tech is reworking it.
    """
    rework_items = set()
    for entry in day_entries:
        old = entry.get("old_status", "")
        new = entry.get("new_status", "")
        item_id = entry.get("item_id", "")
        if old == "QC Failure" and new in ("Under Refurb", "Under Repair", "Diagnostics") and item_id:
            rework_items.add(item_id)
    return rework_items


def count_items_touched(day_entries):
    """Count unique items with any activity"""
    return set(e["item_id"] for e in day_entries if e.get("item_id"))


def count_pauses_and_reasons(day_entries, all_logs_by_item):
    """
    Count items moved to paused statuses and infer reasons.
    Reason = the NEXT status the item moves to after being paused.
    """
    paused_items = {}
    for entry in day_entries:
        new_status = entry.get("new_status", "")
        item_id = entry.get("item_id", "")
        if new_status in PAUSED_STATUSES and item_id:
            paused_items[item_id] = new_status

    # Infer reasons from subsequent status changes
    reasons = []
    for item_id, pause_status in paused_items.items():
        reason = pause_status  # Default: the pause status itself is the reason
        # Look for next status change on this item after the pause
        item_logs = all_logs_by_item.get(item_id, [])
        found_pause = False
        for log_entry in item_logs:
            if not found_pause:
                if log_entry.get("new_status") == pause_status:
                    found_pause = True
                continue
            # Next status change after the pause
            next_status = log_entry.get("new_status", "")
            if next_status and next_status != pause_status:
                reason = f"{pause_status} -> {next_status}"
                break

        reasons.append(reason)

    return len(paused_items), "; ".join(reasons) if reasons else ""


def is_shared_item(item):
    """Check if an item had both a refurb tech and repair tech working on it.
    Detected by: both refurb time (time_tracking93) and repair time (time_tracking9)
    having non-zero values."""
    refurb_time = parse_time_to_mins(get_col(item, "time_tracking93")[0])
    repair_time = parse_time_to_mins(get_col(item, "time_tracking9")[0])
    return refurb_time > 0 and repair_time > 0


def calc_item_financials(item_id, items_detail, bm_financials, person_role="refurb_tech"):
    """Calculate revenue and net profit for a single item.

    When both refurb and repair time exist on an item, revenue and profit
    are split 50/50 between the repair tech and refurb tech.
    """
    revenue = 0.0
    profit = 0.0

    item = items_detail.get(item_id)
    if not item:
        return 0, 0, False

    # Determine if this item was shared between repair + refurb
    shared = is_shared_item(item)

    trade_in_text, _ = get_col(item, "color_mkypbg6z")
    is_bm = bool(trade_in_text and trade_in_text.strip())

    if is_bm and item_id in bm_financials:
        # BM item: NET = Sale - Purchase - Fee - Tax - Labour - Shipping
        bm = bm_financials[item_id]
        sale = get_col_numeric(bm, "numeric5")
        purchase = get_col_numeric(bm, "numeric")
        fee = get_col_numeric(bm, "formula")
        tax = get_col_numeric(bm, "formula7")

        # Labour: time tracked * £15/hr
        total_mins = 0
        for col in ['time_tracking93', 'time_tracking9', 'time_tracking']:
            total_mins += parse_time_to_mins(get_col(item, col)[0])
        labour = (total_mins / 60) * LABOUR_RATE_PER_HOUR

        revenue = sale
        profit = sale - purchase - fee - tax - labour - BM_SHIPPING_COST

    else:
        # Client repair: revenue from dup__of_quote_total (Paid inc VAT)
        paid = get_col_numeric(item, "dup__of_quote_total")
        if paid > 0:
            revenue = paid
            rev_ex_vat = paid / 1.2

            # Labour cost
            labour_cost = get_col_numeric(item, "formula_mkx1bjqr")

            # Parts cost — try to infer from revenue - labour
            # (Gross Profit formula is broken on the board, so we estimate)
            # For now: profit = revenue ex VAT - labour
            profit = rev_ex_vat - labour_cost if labour_cost > 0 else rev_ex_vat

    # 50/50 split when both techs worked the item
    if shared:
        revenue = revenue / 2
        profit = profit / 2

    return round(revenue, 2), round(profit, 2), shared


def calc_utilisation(completed_item_ids, items_detail, meeting_mins, person_role="refurb_tech"):
    """Calculate utilisation: tracked time on completed items / available work time.

    Available work time = 8h (9am-6pm minus 1h lunch = 480 mins) minus meeting time.
    Tracked time = sum of time tracking columns for items COMPLETED that day.
    This is completion-attributed: multi-day items attribute all time to completion day.

    For shared items (both refurb + repair time), only count the tech's own
    time column (refurb time for refurb_tech, repair time for repair_tech).
    """
    AVAILABLE_BASE_MINS = 480  # 9am-6pm minus 1h lunch
    available_mins = max(0, AVAILABLE_BASE_MINS - meeting_mins)
    if available_mins <= 0:
        return 0, 0, available_mins

    total_tracked_mins = 0
    for item_id in completed_item_ids:
        item = items_detail.get(item_id)
        if not item:
            continue

        shared = is_shared_item(item)
        if shared:
            # Only count this tech's own time columns
            if person_role == "refurb_tech":
                total_tracked_mins += parse_time_to_mins(get_col(item, "time_tracking93")[0])
                total_tracked_mins += parse_time_to_mins(get_col(item, "time_tracking")[0])
            elif person_role == "repair_tech":
                total_tracked_mins += parse_time_to_mins(get_col(item, "time_tracking9")[0])
                total_tracked_mins += parse_time_to_mins(get_col(item, "time_tracking")[0])
        else:
            # Solo item — count all time columns
            for col in ['time_tracking93', 'time_tracking9', 'time_tracking', 'duration_mkyrykvn']:
                total_tracked_mins += parse_time_to_mins(get_col(item, col)[0])

    utilisation = (total_tracked_mins / available_mins) * 100 if available_mins > 0 else 0
    return round(total_tracked_mins), round(utilisation, 1), available_mins


def calc_max_capacity(rows):
    """
    Max capacity = peak day completions observed in the period.
    This is what the person has demonstrated they can do on their best day.
    """
    peak = 0
    for row in rows:
        if row.get("completions", 0) > peak:
            peak = row["completions"]
    return peak


# ============================================================
# MAIN
# ============================================================

def generate_csv(person_key, from_date, to_date):
    """Main function: collect data, analyse, write CSV"""

    if person_key not in PERSONS:
        print(f"Unknown person: {person_key}")
        print(f"Available: {', '.join(PERSONS.keys())}")
        return

    person = PERSONS[person_key]
    token = load_token()
    headers = {"Authorization": token, "Content-Type": "application/json"}

    print(f"=" * 60)
    print(f"TEAM DAILY CSV: {person['name']}")
    print(f"Period: {from_date} to {to_date}")
    print(f"=" * 60)

    # ---- Phase 1: Activity logs ----
    print(f"\n[1/4] Fetching activity logs...")
    activity_logs = fetch_activity_logs(MAIN_BOARD_ID, person["user_id"], from_date, to_date, headers)
    print(f"  Total: {len(activity_logs)} entries")

    by_day = group_logs_by_day(activity_logs)
    print(f"  Days with activity: {len(by_day)}")

    # Build item logs index (for pause reason inference)
    all_logs_by_item = defaultdict(list)
    for day_entries in by_day.values():
        for entry in day_entries:
            if entry.get("item_id"):
                all_logs_by_item[entry["item_id"]].append(entry)
    # Sort each item's logs chronologically
    for item_id in all_logs_by_item:
        all_logs_by_item[item_id].sort(key=lambda x: x["dt"])

    # ---- Phase 2: Meeting data ----
    print(f"\n[2/4] Fetching meeting data from Ferrari's board...")
    meetings = fetch_meeting_data(from_date, to_date, headers)
    print(f"  Meetings found: {len(meetings)} days")

    # ---- Phase 3: Item details (financials, time tracking) ----
    print(f"\n[3/4] Fetching item details...")
    all_item_ids = set()
    for day_entries in by_day.values():
        all_item_ids.update(count_items_touched(day_entries))
    all_item_ids.discard("")

    items_detail = fetch_item_details(all_item_ids, headers)
    print(f"  Items loaded: {len(items_detail)}")

    # ---- Phase 4: BM financials ----
    print(f"\n[4/4] Fetching BM board financials...")
    # Identify BM items
    bm_item_ids = set()
    for item_id, item in items_detail.items():
        trade_in_text, _ = get_col(item, "color_mkypbg6z")
        if trade_in_text and trade_in_text.strip():
            bm_item_ids.add(item_id)

    bm_financials = {}
    if bm_item_ids:
        bm_financials = fetch_bm_items_by_ids(bm_item_ids, items_detail, headers)
        print(f"  BM items matched: {len(bm_financials)}")
    else:
        print(f"  No BM items found")

    # ---- Generate CSV rows ----
    print(f"\nAnalysing {len(by_day)} days...")

    # Generate all dates in range (include days with no activity)
    start_dt = datetime.strptime(from_date, "%Y-%m-%d")
    end_dt = datetime.strptime(to_date, "%Y-%m-%d")
    all_dates = []
    d = start_dt
    while d <= end_dt:
        # Skip Sundays (workshop closed)
        if d.weekday() != 6:
            all_dates.append(d.strftime("%Y-%m-%d"))
        d += timedelta(days=1)

    rows = []
    totals = {
        "completions": 0,
        "net_work_mins": 0,
        "days_with_completions": 0,
        "revenue": 0,
        "profit": 0,
    }
    # Track items already counted as completed across the period.
    # An item only counts as a completion the FIRST time it hits
    # Repaired/Part Repaired. QC failures that re-complete don't double-count.
    period_completed = set()

    for date_str in all_dates:
        day_entries = by_day.get(date_str, [])
        day_name = datetime.strptime(date_str, "%Y-%m-%d").strftime("%a")

        if not day_entries:
            # No activity — leave/sick/off
            rows.append({
                "date": date_str,
                "day": day_name,
                "start_time": "",
                "meeting_mins": meetings.get(date_str, 0),
                "adjusted_start": "",
                "lunch_start": "",
                "lunch_over": "",
                "lunch_mins": 0,
                "finish_time": "",
                "gross_hours": 0,
                "available_hours": 0,
                "completions": 0,
                "items_touched": 0,
                "paused_count": 0,
                "pause_reasons": "",
                "revenue": 0,
                "net_profit": 0,
                "shared_items": 0,
                "qc_reworks": 0,
                "tracked_mins": 0,
                "utilisation_pct": 0,
                "max_capacity": 0,
            })
            continue

        # Start / finish

        start_dt_day, finish_dt_day = calc_start_finish(day_entries)
        start_time = start_dt_day.strftime("%H:%M") if start_dt_day else ""
        finish_time = finish_dt_day.strftime("%H:%M") if finish_dt_day else ""

        # Gross hours
        if start_dt_day and finish_dt_day:
            gross_mins = (finish_dt_day - start_dt_day).total_seconds() / 60
        else:
            gross_mins = 0

        # Meeting time
        meeting_mins = meetings.get(date_str, 0)

        # Adjusted start: meetings always start at 09:00, so expected
        # work start = 09:00 + meeting duration
        if meeting_mins > 0:
            meeting_start = start_dt_day.replace(hour=9, minute=0, second=0)
            adj_dt = meeting_start + timedelta(minutes=meeting_mins)
            adjusted_start = adj_dt.strftime("%H:%M")
        else:
            adjusted_start = "09:00"

        # Lunch
        lunch_mins, lunch_start = detect_lunch(day_entries)

        # Net working time (actual span-based, for reference)
        net_work_mins = max(0, gross_mins - meeting_mins - lunch_mins)
        net_work_hours = round(net_work_mins / 60, 2)
        gross_hours = round(gross_mins / 60, 2)

        # Available work hours: fixed 8h base (9am-6pm minus 1h lunch) minus meeting
        available_work_mins = max(0, 480 - meeting_mins)

        # Completions
        completed_ids = count_completions(day_entries, period_completed)
        period_completed.update(completed_ids)  # Mark these as counted
        completions = len(completed_ids)

        # Items touched
        touched = count_items_touched(day_entries)
        items_touched = len(touched)

        # QC reworks — items picked back up after QC failure
        qc_rework_ids = count_qc_reworks(day_entries)
        qc_reworks = len(qc_rework_ids)

        # Pauses + reasons
        paused_count, pause_reasons = count_pauses_and_reasons(day_entries, all_logs_by_item)

        # Financials — sum for items completed today (50/50 split on shared items)
        day_revenue = 0
        day_profit = 0
        shared_count = 0
        for item_id in completed_ids:
            rev, prof, shared = calc_item_financials(item_id, items_detail, bm_financials, person["role"])
            day_revenue += rev
            day_profit += prof
            if shared:
                shared_count += 1

        # Utilisation: tracked time on completed items / (8h - meeting)
        tracked_mins, utilisation_pct, available_mins = calc_utilisation(
            completed_ids, items_detail, meeting_mins, person["role"]
        )

        # Max capacity (calculated at end from totals)
        totals["completions"] += completions
        totals["net_work_mins"] += available_work_mins
        totals["revenue"] += day_revenue
        totals["profit"] += day_profit
        totals["qc_reworks"] = totals.get("qc_reworks", 0) + qc_reworks
        if completions > 0:
            totals["days_with_completions"] += 1

        rows.append({
            "date": date_str,
            "day": day_name,
            "start_time": start_time,
            "meeting_mins": round(meeting_mins),
            "adjusted_start": adjusted_start,
            "lunch_start": lunch_start,
            "lunch_over": f"+{lunch_mins - 60}" if lunch_mins > 60 else "",
            "lunch_mins": lunch_mins,
            "finish_time": finish_time,
            "gross_hours": gross_hours,
            "available_hours": round(available_work_mins / 60, 2),
            "completions": completions,
            "items_touched": items_touched,
            "paused_count": paused_count,
            "pause_reasons": pause_reasons,
            "revenue": round(day_revenue, 2),
            "net_profit": round(day_profit, 2),
            "shared_items": shared_count,
            "qc_reworks": qc_reworks,
            "tracked_mins": tracked_mins,
            "utilisation_pct": utilisation_pct,
            "max_capacity": 0,  # Filled in below
        })

    # Max capacity = peak day completions observed
    max_cap = calc_max_capacity(rows)
    for row in rows:
        if row["available_hours"] > 0:
            row["max_capacity"] = max_cap

    # ---- Write CSV ----
    report_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'reports', person_key)
    os.makedirs(report_dir, exist_ok=True)
    csv_filename = f"{person_key}_daily_{from_date}_{to_date}.csv"
    csv_path = os.path.join(report_dir, csv_filename)

    fieldnames = [
        "date", "day", "start_time", "meeting_mins", "adjusted_start",
        "lunch_start", "lunch_over", "lunch_mins", "finish_time", "gross_hours", "available_hours",
        "completions", "items_touched", "paused_count", "pause_reasons",
        "revenue", "net_profit", "shared_items", "qc_reworks", "tracked_mins", "utilisation_pct", "max_capacity"
    ]

    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n{'=' * 60}")
    print(f"CSV saved: {csv_path}")
    print(f"{'=' * 60}")

    # ---- Print summary ----
    active_days = sum(1 for r in rows if r["start_time"])
    print(f"\nSUMMARY — {person['name']}")
    print(f"  Period: {from_date} to {to_date}")
    print(f"  Total days (excl Sun): {len(rows)}")
    print(f"  Active days: {active_days}")
    print(f"  Days off/no activity: {len(rows) - active_days}")
    print(f"  Total completions: {totals['completions']}")
    if active_days > 0:
        print(f"  Avg completions/day: {totals['completions'] / active_days:.1f}")
    print(f"  Total revenue: £{totals['revenue']:.2f}")
    print(f"  Total net profit: £{totals['profit']:.2f}")
    if totals["net_work_mins"] > 0:
        avg_util = sum(r["utilisation_pct"] for r in rows if r["utilisation_pct"] > 0) / max(1, active_days)
        print(f"  Avg utilisation: {avg_util:.1f}%")
    print(f"  Max capacity estimate: {max_cap} items/day")
    qc_total = totals.get("qc_reworks", 0)
    if totals["completions"] > 0:
        qc_rate = (qc_total / totals["completions"]) * 100
        print(f"  QC reworks: {qc_total} ({qc_rate:.1f}% of completions)")
    else:
        print(f"  QC reworks: {qc_total}")

    return csv_path


# ============================================================
# CLI
# ============================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate daily performance CSV for any team member")
    parser.add_argument("--person", required=True, help=f"Team member key: {', '.join(PERSONS.keys())}")
    parser.add_argument("--from", dest="from_date", required=True, help="Start date (YYYY-MM-DD)")
    parser.add_argument("--to", dest="to_date", required=True, help="End date (YYYY-MM-DD)")
    args = parser.parse_args()

    generate_csv(args.person, args.from_date, args.to_date)
