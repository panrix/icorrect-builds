#!/usr/bin/env python3
"""
CDR x Monday.com Missed Call Matcher
=====================================
Cross-references TeleSphere CDR call data with iCorrect Monday.com board
to identify known clients whose calls went unanswered.

Usage:
    python3 cdr_monday_matcher.py --cdr <path_to_xlsx> [--since YYYY-MM-DD] [--output <path>]

Output:
    - Console summary
    - JSON report of all missed known-client calls

Requirements:
    pip install openpyxl requests
"""

import argparse
import json
import re
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta

import openpyxl

# --- CONFIG ---
MONDAY_BOARD_ID = 349212843
PHONE_COLUMN_ID = "text00"
ENV_FILE = "/home/ricky/config/api-keys/.env"


def load_monday_token():
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if line.startswith("MONDAY_APP_TOKEN="):
                return line.split("=", 1)[1]
    raise ValueError("MONDAY_APP_TOKEN not found in env file")


def monday_query(token, q):
    req = urllib.request.Request(
        "https://api.monday.com/v2",
        data=json.dumps({"query": q}).encode(),
        headers={
            "Authorization": token,
            "Content-Type": "application/json",
            "API-Version": "2024-01",
        },
    )
    return json.loads(urllib.request.urlopen(req).read())


def pull_monday_phones(token):
    """Pull all client phone numbers from the Monday board."""
    print("Pulling client phone numbers from Monday.com...")
    phone_to_clients = defaultdict(list)
    cursor = None
    total = 0

    while True:
        if cursor:
            q = f'''{{
                boards(ids: [{MONDAY_BOARD_ID}]) {{
                    items_page(limit: 200, cursor: "{cursor}") {{
                        cursor
                        items {{
                            id name
                            column_values(ids: ["{PHONE_COLUMN_ID}"]) {{ id value }}
                        }}
                    }}
                }}
            }}'''
        else:
            q = f'''{{
                boards(ids: [{MONDAY_BOARD_ID}]) {{
                    items_page(limit: 200) {{
                        cursor
                        items {{
                            id name
                            column_values(ids: ["{PHONE_COLUMN_ID}"]) {{ id value }}
                        }}
                    }}
                }}
            }}'''

        data = monday_query(token, q)
        page_data = data["data"]["boards"][0]["items_page"]
        items = page_data["items"]

        for item in items:
            for cv in item["column_values"]:
                if cv["id"] == PHONE_COLUMN_ID and cv["value"] and cv["value"] != "null":
                    phone = normalise_phone(cv["value"])
                    if phone:
                        phone_to_clients[phone].append(
                            {"id": item["id"], "name": item["name"]}
                        )

        total += len(items)
        cursor = page_data.get("cursor")
        if not cursor or not items:
            break

    print(f"  {total} items scanned | {len(phone_to_clients)} unique phone numbers found")
    return dict(phone_to_clients)


def normalise_phone(raw):
    """Normalise UK phone numbers to 07xxx format."""
    if not raw or raw == "null":
        return None
    try:
        val = json.loads(raw) if raw.startswith('"') else raw
    except Exception:
        val = raw
    digits = re.sub(r"\D", "", str(val))
    if not digits:
        return None
    if digits.startswith("44"):
        digits = "0" + digits[2:]
    if digits.startswith("0") and len(digits) == 11:
        return digits
    if len(digits) == 10 and not digits.startswith("0"):
        return "0" + digits
    return digits if len(digits) >= 10 else None


def load_cdr(path, since=None):
    """Load and de-duplicate CDR data from Excel file."""
    wb = openpyxl.load_workbook(path)
    ws = wb["Call Detail"]
    rows = list(ws.iter_rows(values_only=True))[1:]

    parsed = []
    for r in rows:
        try:
            dt = datetime.strptime(r[1], "%Y-%m-%d %H:%M:%S")
        except Exception:
            continue
        if since and dt < since:
            continue
        parsed.append((r[0], dt, normalise_phone(str(r[2])), r[3], r[4]))

    # De-duplicate by call ID
    calls_by_id = defaultdict(list)
    for ext, dt, caller, outcome, call_id in parsed:
        calls_by_id[call_id].append((ext, dt, caller, outcome))

    unique = []
    for call_id, events in calls_by_id.items():
        dt = min(e[1] for e in events)
        caller = events[0][2]
        answerers = [e for e in events if e[3] == "Answered"]
        answered = len(answerers) > 0
        who = answerers[0][0] if answerers else None
        unique.append(
            {"dt": dt, "caller": caller, "answered": answered, "who": who, "call_id": call_id}
        )

    print(f"  {len(unique)} unique calls loaded from CDR")
    return unique


def match_and_report(unique_calls, monday_phones, output_path=None):
    """Cross-reference CDR with Monday phones and print report."""
    missed_known = []
    answered_known = []
    missed_unknown = []

    for call in unique_calls:
        num = call["caller"]
        if not num or num in ("anonymous", "None", "none"):
            continue
        if num in monday_phones:
            entry = {
                "datetime": call["dt"].strftime("%Y-%m-%d %H:%M"),
                "number": num,
                "answered": call["answered"],
                "answered_by": call["who"],
                "clients": monday_phones[num],
            }
            (answered_known if call["answered"] else missed_known).append(entry)
        elif not call["answered"]:
            missed_unknown.append(call)

    # Sort missed by datetime
    missed_known.sort(key=lambda x: x["datetime"])

    # --- Print report ---
    print("\n" + "=" * 60)
    print("MISSED CALL REPORT — Known Clients")
    print("=" * 60)
    print(f"Total unique calls:              {len(unique_calls)}")
    print(f"Matched to known clients:        {len(missed_known) + len(answered_known)}")
    print(f"  Known clients MISSED:          {len(missed_known)}")
    print(f"  Known clients answered:        {len(answered_known)}")
    print(f"Unknown number misses:           {len(missed_unknown)}")

    # Weekly breakdown
    print("\nWeekly missed known clients:")
    weekly = defaultdict(int)
    for c in missed_known:
        dt = datetime.strptime(c["datetime"], "%Y-%m-%d %H:%M")
        week = (dt - timedelta(days=dt.weekday())).strftime("%Y-%m-%d")
        weekly[week] += 1
    for week in sorted(weekly):
        print(f"  w/c {week}: {weekly[week]} missed")

    # Full list
    print(f"\n{'Date/Time':<17} {'Number':<14} {'Client':<40} Monday ID")
    print("-" * 90)
    for c in missed_known:
        name = c["clients"][0]["name"][:39]
        mon_id = c["clients"][0]["id"]
        print(f"{c['datetime']:<17} {c['number']:<14} {name:<40} #{mon_id}")

    # Save JSON
    if output_path:
        report = {
            "generated": datetime.now().isoformat(),
            "summary": {
                "total_calls": len(unique_calls),
                "known_client_missed": len(missed_known),
                "known_client_answered": len(answered_known),
                "unknown_missed": len(missed_unknown),
            },
            "missed_known_clients": missed_known,
        }
        with open(output_path, "w") as f:
            json.dump(report, f, indent=2)
        print(f"\nReport saved to: {output_path}")

    return missed_known


def main():
    parser = argparse.ArgumentParser(description="Match CDR missed calls to Monday.com clients")
    parser.add_argument("--cdr", required=True, help="Path to CDR Excel file")
    parser.add_argument("--since", default="2025-12-01", help="Start date YYYY-MM-DD (default: 2025-12-01)")
    parser.add_argument("--output", default=None, help="Output JSON path")
    args = parser.parse_args()

    since = datetime.strptime(args.since, "%Y-%m-%d") if args.since else None

    token = load_monday_token()
    monday_phones = pull_monday_phones(token)
    unique_calls = load_cdr(args.cdr, since=since)
    match_and_report(unique_calls, monday_phones, output_path=args.output)


if __name__ == "__main__":
    main()
