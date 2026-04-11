#!/usr/bin/env python3
"""
Monday Repair Flow Traces
Pulls completed items from Monday main board, categorises by flow type,
fetches activity logs for status changes, and writes structured output.

Strategy: query_params filtering is broken in Monday API 2024-10,
so we paginate ALL items and filter in Python.
"""

import json
import os
import sys
import time
from datetime import datetime, timedelta
from collections import Counter

import requests

# Config
MONDAY_APP_TOKEN = os.environ.get("MONDAY_APP_TOKEN")
MONDAY_API_URL = "https://api.monday.com/v2"
BOARD_ID = 349212843
OUTPUT_FILE = "/home/ricky/builds/documentation/monday/repair-flow-traces.md"

HEADERS = {
    "Authorization": MONDAY_APP_TOKEN,
    "Content-Type": "application/json",
    "API-Version": "2024-10"
}

# All columns we need
ALL_COLUMNS = [
    "service", "status", "status24", "status4",
    "date4", "date_mkypmgfc", "date_mkwdmm9k", "date_mkwdwx03",
    "collection_date", "date3", "date_mkypt8db",
    "person", "multiple_person_mkyp2bka",
    # BM columns
    "color_mkqg66bx", "color_mkqg4zhy", "color_mkqg7pea", "color_mkqgtewd",
    "color_mkqg1c3h", "color_mkqga1mc", "color_mkqg578m", "color_mkqgj96q",
    "color_mkqg8ktb", "color_mkypbg6z", "text_mky01vb4"
]

# End states that indicate "completed"
END_STATES = {"Returned", "Ready To Collect", "Shipped", "Sold"}

# Flow type definitions
FLOW_TYPES = [
    {
        "name": "Walk-in + Repair",
        "service_match": lambda s: s == "Walk-In",
        "client_match": lambda c: True,
        "repair_match": lambda r: r == "Repair",
        "function_match": None,
        "is_bm": False,
        "timeframe_days": 90,
    },
    {
        "name": "Walk-in + Diagnostic",
        "service_match": lambda s: s == "Walk-In",
        "client_match": lambda c: True,
        "repair_match": lambda r: r == "Diagnostic",
        "function_match": None,
        "is_bm": False,
        "timeframe_days": 90,
    },
    {
        "name": "Mail-in + Repair",
        "service_match": lambda s: s in ("Mail-In", "External Mail-In"),
        "client_match": lambda c: True,
        "repair_match": lambda r: r == "Repair",
        "function_match": None,
        "is_bm": False,
        "timeframe_days": 90,
    },
    {
        "name": "Mail-in + Diagnostic",
        "service_match": lambda s: s in ("Mail-In", "External Mail-In"),
        "client_match": lambda c: True,
        "repair_match": lambda r: r == "Diagnostic",
        "function_match": None,
        "is_bm": False,
        "timeframe_days": 90,
    },
    {
        "name": "Corporate + Repair",
        "service_match": lambda s: True,
        "client_match": lambda c: c == "Corporate",
        "repair_match": lambda r: r == "Repair",
        "function_match": None,
        "is_bm": False,
        "timeframe_days": 90,
    },
    {
        "name": "Corporate + Diagnostic",
        "service_match": lambda s: True,
        "client_match": lambda c: c == "Corporate",
        "repair_match": lambda r: r == "Diagnostic",
        "function_match": None,
        "is_bm": False,
        "timeframe_days": 90,
    },
    {
        "name": "BM + Functional",
        "service_match": lambda s: True,
        "client_match": lambda c: c == "BM",
        "repair_match": lambda r: True,
        "function_match": lambda f: f.lower().startswith("functional") or f.lower() == "yes",
        "is_bm": True,
        "timeframe_days": 90,  # expanded from 7 — BM may not have 10 in 7 days
    },
    {
        "name": "BM + Not Functional",
        "service_match": lambda s: True,
        "client_match": lambda c: c == "BM",
        "repair_match": lambda r: True,
        "function_match": lambda f: "not" in f.lower() or "non" in f.lower() or f.lower() == "no",
        "is_bm": True,
        "timeframe_days": 90,
    },
]


def monday_query(query, variables=None):
    """Execute a Monday.com GraphQL query with rate limiting."""
    payload = {"query": query}
    if variables:
        payload["variables"] = variables

    resp = requests.post(MONDAY_API_URL, headers=HEADERS, json=payload)
    if resp.status_code != 200:
        print(f"  HTTP {resp.status_code}: {resp.text[:200]}", file=sys.stderr)
        return None
    data = resp.json()

    if "errors" in data:
        print(f"  GraphQL errors: {json.dumps(data['errors'][:2])}", file=sys.stderr)
        return None

    time.sleep(0.3)
    return data.get("data")


def get_col(item, col_id):
    """Extract text value from a Monday item's column_values."""
    for cv in item.get("column_values", []):
        if cv["id"] == col_id:
            return (cv.get("text") or "").strip()
    return ""


def fetch_all_items():
    """Paginate through ALL items on the board."""
    print("Fetching all items from board (paginating)...")
    all_items = []
    cursor = None
    page = 0
    col_ids_gql = "[" + ", ".join(f'"{c}"' for c in ALL_COLUMNS) + "]"

    while True:
        page += 1
        if cursor:
            query = f"""
            {{
              next_items_page(cursor: "{cursor}", limit: 200) {{
                cursor
                items {{
                  id
                  name
                  column_values(ids: {col_ids_gql}) {{
                    id
                    text
                    value
                  }}
                }}
              }}
            }}
            """
        else:
            query = f"""
            {{
              boards(ids: [{BOARD_ID}]) {{
                items_page(limit: 200) {{
                  cursor
                  items {{
                    id
                    name
                    column_values(ids: {col_ids_gql}) {{
                      id
                      text
                      value
                    }}
                  }}
                }}
              }}
            }}
            """

        data = monday_query(query)
        if not data:
            print(f"  Page {page}: query failed, stopping.")
            break

        if cursor:
            page_data = data.get("next_items_page", {})
        else:
            page_data = data["boards"][0]["items_page"]

        items = page_data.get("items", [])
        cursor = page_data.get("cursor")
        all_items.extend(items)
        print(f"  Page {page}: {len(items)} items (total: {len(all_items)})")

        if not cursor or not items:
            break

    print(f"  Total items fetched: {len(all_items)}")
    return all_items


def filter_items_for_flow(all_items, flow):
    """Filter pre-fetched items for a specific flow type."""
    cutoff = (datetime.now() - timedelta(days=flow["timeframe_days"])).strftime("%Y-%m-%d")
    matched = []

    for item in all_items:
        status4 = get_col(item, "status4")
        service = get_col(item, "service")
        client = get_col(item, "status")
        repair_type = get_col(item, "status24")
        date_received = get_col(item, "date4")
        func_reported = get_col(item, "color_mkqg578m")

        # Must be in end state
        if status4 not in END_STATES:
            continue

        # Must match service type
        if not flow["service_match"](service):
            continue

        # Must match client type
        if not flow["client_match"](client):
            continue

        # Must match repair type
        if not flow["repair_match"](repair_type):
            continue

        # Function filter for BM items
        if flow["function_match"] and func_reported:
            if not flow["function_match"](func_reported):
                continue
        elif flow["function_match"] and not func_reported:
            continue

        # Date filter — skip items without received date, or too old
        if date_received and date_received < cutoff:
            continue

        matched.append(item)

    return matched[:10]


def fetch_activity_log(item_id):
    """Fetch status4 activity log for an item."""
    query = f"""
    {{
      boards(ids: [{BOARD_ID}]) {{
        activity_logs(
          item_ids: [{item_id}],
          column_ids: ["status4"],
          limit: 100
        ) {{
          event
          data
          created_at
        }}
      }}
    }}
    """

    data = monday_query(query)
    if not data:
        return []

    logs = data["boards"][0]["activity_logs"]
    return logs


def parse_activity_logs(logs):
    """Parse activity logs into a timeline of status changes."""
    transitions = []
    for log in logs:
        try:
            log_data = json.loads(log["data"]) if isinstance(log["data"], str) else log["data"]
            prev_val = log_data.get("previous_value", {})
            new_val = log_data.get("value", {})

            prev_label = ""
            new_label = ""

            if isinstance(prev_val, dict):
                label_obj = prev_val.get("label", {})
                if isinstance(label_obj, dict):
                    prev_label = label_obj.get("text", "")
                elif isinstance(label_obj, str):
                    prev_label = label_obj
                if not prev_label:
                    prev_label = prev_val.get("text", "")
            if isinstance(new_val, dict):
                label_obj = new_val.get("label", {})
                if isinstance(label_obj, dict):
                    new_label = label_obj.get("text", "")
                elif isinstance(label_obj, str):
                    new_label = label_obj
                if not new_label:
                    new_label = new_val.get("text", "")

            transitions.append({
                "from": prev_label or "(empty)",
                "to": new_label or "(empty)",
                "timestamp": log["created_at"],
            })
        except (json.JSONDecodeError, TypeError, KeyError):
            pass

    # Sort oldest first
    transitions.sort(key=lambda x: x["timestamp"])
    return transitions


def format_duration(seconds):
    """Format seconds into human-readable duration."""
    if seconds < 0:
        return "0m"
    if seconds < 3600:
        return f"{int(seconds/60)}m"
    if seconds < 86400:
        return f"{seconds/3600:.1f}h"
    return f"{seconds/86400:.1f}d"


def build_timeline_string(transitions):
    """Build a visual timeline string from transitions."""
    if not transitions:
        return "(no activity log)"

    parts = [transitions[0]["from"]]
    for i, t in enumerate(transitions):
        if i + 1 < len(transitions):
            try:
                ts1 = datetime.fromisoformat(t["timestamp"].replace("Z", "+00:00"))
                ts2 = datetime.fromisoformat(transitions[i+1]["timestamp"].replace("Z", "+00:00"))
                dur = (ts2 - ts1).total_seconds()
                parts.append(f"({format_duration(dur)})")
            except Exception:
                pass
        parts.append(f"→ {t['to']}")

    return " ".join(parts)


def calculate_total_duration(transitions):
    """Calculate total time from first to last transition."""
    if len(transitions) < 2:
        return None
    try:
        first = datetime.fromisoformat(transitions[0]["timestamp"].replace("Z", "+00:00"))
        last = datetime.fromisoformat(transitions[-1]["timestamp"].replace("Z", "+00:00"))
        return (last - first).total_seconds()
    except Exception:
        return None


def find_longest_dwell(transitions):
    """Find the status with the longest dwell time."""
    if len(transitions) < 2:
        return None, 0

    longest_status = ""
    longest_dur = 0

    for i in range(len(transitions) - 1):
        try:
            ts1 = datetime.fromisoformat(transitions[i]["timestamp"].replace("Z", "+00:00"))
            ts2 = datetime.fromisoformat(transitions[i+1]["timestamp"].replace("Z", "+00:00"))
            dur = (ts2 - ts1).total_seconds()
            status = transitions[i]["to"]
            if dur > longest_dur:
                longest_dur = dur
                longest_status = status
        except Exception:
            pass

    return longest_status, longest_dur


def find_common_pattern(all_transitions):
    """Find the most common status sequence pattern."""
    patterns = []
    for transitions in all_transitions:
        if not transitions:
            continue
        pattern = [transitions[0]["from"]]
        for t in transitions:
            pattern.append(t["to"])
        cleaned = []
        for s in pattern:
            if s and s != "(empty)" and (not cleaned or cleaned[-1] != s):
                cleaned.append(s)
        patterns.append(" → ".join(cleaned))

    if not patterns:
        return "(no data)"

    counter = Counter(patterns)
    return counter.most_common(1)[0][0]


def main():
    if not MONDAY_APP_TOKEN:
        print("ERROR: MONDAY_APP_TOKEN not set", file=sys.stderr)
        sys.exit(1)

    # Step 1: Fetch ALL items from the board
    all_items = fetch_all_items()

    output_lines = []
    output_lines.append("# Monday Repair Flow Traces")
    output_lines.append("")
    output_lines.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}")
    output_lines.append(f"**Board:** iCorrect Main Board ({BOARD_ID})")
    output_lines.append(f"**Total items scanned:** {len(all_items)}")
    output_lines.append(f"**Method:** Full board paginate + Python filter + activity_logs per item")
    output_lines.append("")
    output_lines.append("---")
    output_lines.append("")

    total_items = 0
    total_shortfalls = 0

    for flow in FLOW_TYPES:
        print(f"\n{'='*60}")
        print(f"Processing: {flow['name']}")
        print(f"{'='*60}")

        items = filter_items_for_flow(all_items, flow)
        count = len(items)
        total_items += count

        if count < 10:
            total_shortfalls += 1

        print(f"  Matched {count} items")

        output_lines.append(f"## {flow['name']} ({count} items)")
        output_lines.append("")

        if count == 0:
            output_lines.append(f"**No items found** matching filters in last {flow['timeframe_days']} days.")
            output_lines.append("")
            output_lines.append("---")
            output_lines.append("")
            continue

        if count < 10:
            output_lines.append(f"**Note:** Only {count}/10 items found in last {flow['timeframe_days']} days.")
            output_lines.append("")

        # Fetch activity logs for all matched items
        all_transitions = []
        item_data = []

        for item in items:
            item_id = item["id"]
            item_name = item["name"]
            print(f"  Fetching activity log for {item_name} (ID: {item_id})...")

            logs = fetch_activity_log(item_id)
            transitions = parse_activity_logs(logs)
            all_transitions.append(transitions)

            tech = get_col(item, "person")
            received_date = get_col(item, "date4")
            status = get_col(item, "status4")

            item_info = {
                "id": item_id,
                "name": item_name,
                "tech": tech or "unassigned",
                "received": received_date or "unknown",
                "status": status,
                "transitions": transitions,
                "timeline": build_timeline_string(transitions),
                "total_duration": calculate_total_duration(transitions),
            }

            if flow["is_bm"]:
                item_info["battery_reported"] = get_col(item, "color_mkqg66bx")
                item_info["battery_actual"] = get_col(item, "color_mkqg4zhy")
                item_info["screen_reported"] = get_col(item, "color_mkqg7pea")
                item_info["screen_actual"] = get_col(item, "color_mkqgtewd")
                item_info["casing_reported"] = get_col(item, "color_mkqg1c3h")
                item_info["casing_actual"] = get_col(item, "color_mkqga1mc")
                item_info["function_reported"] = get_col(item, "color_mkqg578m")
                item_info["function_actual"] = get_col(item, "color_mkqgj96q")
                item_info["liquid_damage"] = get_col(item, "color_mkqg8ktb")
                item_info["tradein_status"] = get_col(item, "color_mkypbg6z")
                item_info["bm_tradein_id"] = get_col(item, "text_mky01vb4")

            item_data.append(item_info)

        # Common pattern
        common_pattern = find_common_pattern(all_transitions)
        output_lines.append("### Common Pattern")
        output_lines.append(f"`{common_pattern}`")
        output_lines.append("")

        # Stats
        durations = [i["total_duration"] for i in item_data if i["total_duration"]]
        if durations:
            avg_dur = sum(durations) / len(durations)
            output_lines.append(f"**Average total time:** {format_duration(avg_dur)}")

        # Longest dwell across all items
        all_dwells = []
        for transitions in all_transitions:
            status_name, dur = find_longest_dwell(transitions)
            if status_name:
                all_dwells.append((status_name, dur))
        if all_dwells:
            dwell_counter = Counter()
            dwell_times = {}
            for status_name, dur in all_dwells:
                dwell_counter[status_name] += 1
                if status_name not in dwell_times or dur > dwell_times[status_name]:
                    dwell_times[status_name] = dur
            most_common_dwell = dwell_counter.most_common(1)[0]
            output_lines.append(f"**Most common longest dwell:** {most_common_dwell[0]} ({most_common_dwell[1]}/{len(all_dwells)} items, max {format_duration(dwell_times[most_common_dwell[0]])})")
        output_lines.append("")

        # BM: Reported vs Actual comparison table
        if flow["is_bm"]:
            output_lines.append("### Reported vs Actual Comparison")
            output_lines.append("")
            output_lines.append("| Item | Battery R/A | Screen R/A | Casing R/A | Function R/A | Liquid? |")
            output_lines.append("|------|-------------|------------|------------|--------------|---------|")

            discrepancy_count = 0
            mismatch_cols = Counter()

            for item_info in item_data:
                br = item_info.get("battery_reported", "-") or "-"
                ba = item_info.get("battery_actual", "-") or "-"
                sr = item_info.get("screen_reported", "-") or "-"
                sa = item_info.get("screen_actual", "-") or "-"
                cr = item_info.get("casing_reported", "-") or "-"
                ca = item_info.get("casing_actual", "-") or "-"
                fr = item_info.get("function_reported", "-") or "-"
                fa = item_info.get("function_actual", "-") or "-"
                liq = item_info.get("liquid_damage", "-") or "-"

                has_mismatch = False
                if br != "-" and ba != "-" and br != ba:
                    has_mismatch = True
                    mismatch_cols["Battery"] += 1
                if sr != "-" and sa != "-" and sr != sa:
                    has_mismatch = True
                    mismatch_cols["Screen"] += 1
                if cr != "-" and ca != "-" and cr != ca:
                    has_mismatch = True
                    mismatch_cols["Casing"] += 1
                if fr != "-" and fa != "-" and fr != fa:
                    has_mismatch = True
                    mismatch_cols["Function"] += 1

                if has_mismatch:
                    discrepancy_count += 1

                name_short = item_info["name"][:25]
                output_lines.append(f"| {name_short} | {br}/{ba} | {sr}/{sa} | {cr}/{ca} | {fr}/{fa} | {liq} |")

            output_lines.append("")
            output_lines.append("### Discrepancy Rate")
            output_lines.append(f"- **{discrepancy_count}/{count}** items had at least one reported vs actual mismatch")
            if mismatch_cols:
                most_common_mismatch = mismatch_cols.most_common(1)[0]
                output_lines.append(f"- Most common mismatch: **{most_common_mismatch[0]}** ({most_common_mismatch[1]} items)")
            output_lines.append("")

        # Item traces
        output_lines.append("### Item Traces")
        output_lines.append("")

        anomalies = []
        for i, item_info in enumerate(item_data, 1):
            output_lines.append(f"**{i}. {item_info['name']}** (ID: {item_info['id']}) — Received: {item_info['received']}, Tech: {item_info['tech']}")
            output_lines.append(f"   {item_info['timeline']}")
            if item_info["total_duration"]:
                output_lines.append(f"   Total: {format_duration(item_info['total_duration'])}")
            output_lines.append("")

            for t in item_info["transitions"]:
                if "Paused" in t.get("to", "") or "Failure" in t.get("to", ""):
                    anomalies.append(f"- Item {i} ({item_info['name']}): went to **{t['to']}** at {t['timestamp'][:10]}")

        if anomalies:
            output_lines.append("### Anomalies")
            output_lines.append("")
            for a in anomalies:
                output_lines.append(a)
            output_lines.append("")

        output_lines.append("---")
        output_lines.append("")

    # Summary
    output_lines.append("## Summary")
    output_lines.append("")
    output_lines.append(f"- **Total items traced:** {total_items}/80")
    output_lines.append(f"- **Flow types with shortfall (<10 items):** {total_shortfalls}")
    output_lines.append(f"- **Board items scanned:** {len(all_items)}")
    output_lines.append(f"- **Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M UTC')}")
    output_lines.append("")

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        f.write("\n".join(output_lines))

    print(f"\n{'='*60}")
    print(f"DONE — Output written to {OUTPUT_FILE}")
    print(f"Total items traced: {total_items}/80")
    print(f"Flow types with shortfall: {total_shortfalls}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
