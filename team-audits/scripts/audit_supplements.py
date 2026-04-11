#!/usr/bin/env python3
"""
AUDIT SUPPLEMENTS
Pulls update replies + item breakdown for a team member.
Used to supplement the daily CSV with qualitative data.

Usage:
    python audit_supplements.py --person andreas --from 2026-02-09 --to 2026-03-01
    python audit_supplements.py --person mykhailo --from 2026-02-09 --to 2026-03-01
"""

import requests
import json
import argparse
import os
import time
from datetime import datetime, timedelta
from collections import defaultdict, Counter

MONDAY_API_URL = "https://api.monday.com/v2"
MAIN_BOARD_ID = "349212843"

PERSONS = {
    "mykhailo": {"user_id": "64642914", "name": "Mykhailo Kepeshchuk"},
    "andreas": {"user_id": "49001724", "name": "Andreas Egas"},
    "safan": {"user_id": "25304513", "name": "Safan Patel"},
    "roni": {"user_id": "79665360", "name": "Roni Mykhailiuk"},
    "adil": {"user_id": "94961618", "name": "Adil Azad"},
    "ferrari": {"user_id": "55780786", "name": "Michael Ferrari"},
}


def load_token():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
    if not os.path.exists(env_path):
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    with open(env_path) as f:
        for line in f:
            if line.startswith('MONDAY_APP_TOKEN='):
                return line.strip().split('=', 1)[1]
    raise ValueError("MONDAY_APP_TOKEN not found in .env")


def run_query(query, headers, retries=3):
    for i in range(retries):
        try:
            resp = requests.post(MONDAY_API_URL, json={"query": query}, headers=headers, timeout=30)
            result = resp.json()
            if "errors" in result:
                print(f"  API error: {result['errors'][0].get('message', 'unknown')}")
                if i < retries - 1:
                    time.sleep(2)
                    continue
            return result
        except Exception as e:
            if i < retries - 1:
                time.sleep(2)
            else:
                print(f"  Request failed: {e}")
    return {}


def parse_timestamp(ts):
    try:
        unix_ts = int(ts) / 10000000
        return datetime.fromtimestamp(unix_ts)
    except:
        return None


def fetch_activity_logs(board_id, user_id, from_date, to_date, headers):
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
        time.sleep(0.5)
    return all_logs


def get_unique_item_ids(activity_logs):
    """Extract unique item IDs from activity logs"""
    item_ids = set()
    for log in activity_logs:
        try:
            data = json.loads(log["data"]) if isinstance(log["data"], str) else log["data"]
            pid = str(data.get("pulse_id", ""))
            if pid and pid != "None":
                item_ids.add(pid)
        except:
            pass
    return item_ids


def fetch_items_with_updates(item_ids, headers):
    """Fetch item details + updates for a batch of items"""
    items = {}
    id_list = list(item_ids)
    batch_size = 10  # Smaller batch because updates add complexity

    for i in range(0, len(id_list), batch_size):
        batch = id_list[i:i + batch_size]
        ids_str = ", ".join(str(x) for x in batch)
        query = f'''query {{
            items(ids: [{ids_str}]) {{
                id name
                group {{ id title }}
                column_values(ids: ["color_mkypbg6z", "status4", "service", "dup__of_quote_total"]) {{
                    id text value
                }}
                updates(limit: 50) {{
                    id
                    body
                    text_body
                    created_at
                    creator_id
                    replies {{
                        id
                        body
                        text_body
                        created_at
                        creator_id
                    }}
                }}
            }}
        }}'''
        result = run_query(query, headers)
        for item in result.get("data", {}).get("items", []):
            items[item["id"]] = item
        if i + batch_size < len(id_list):
            time.sleep(0.5)
        print(f"  Items batch {i // batch_size + 1}: {len(batch)} items")

    return items


def analyse_updates(items, person_user_id, from_date, to_date):
    """Find all updates and replies by this person in the date range"""
    from_dt = datetime.strptime(from_date, "%Y-%m-%d")
    to_dt = datetime.strptime(to_date, "%Y-%m-%d") + timedelta(days=1)

    updates = []
    for item_id, item in items.items():
        item_name = item.get("name", "")

        # Check top-level updates
        for update in item.get("updates", []):
            created = update.get("created_at", "")
            try:
                update_dt = datetime.fromisoformat(created.replace("Z", "+00:00")).replace(tzinfo=None)
            except:
                continue

            if update_dt < from_dt or update_dt > to_dt:
                continue

            creator = str(update.get("creator_id", ""))
            body = update.get("text_body", "") or update.get("body", "")

            if creator == person_user_id:
                updates.append({
                    "date": update_dt.strftime("%Y-%m-%d %H:%M"),
                    "item": item_name,
                    "item_id": item_id,
                    "type": "update",
                    "body": body[:200],
                })

            # Check replies
            for reply in update.get("replies", []):
                r_created = reply.get("created_at", "")
                try:
                    reply_dt = datetime.fromisoformat(r_created.replace("Z", "+00:00")).replace(tzinfo=None)
                except:
                    continue

                if reply_dt < from_dt or reply_dt > to_dt:
                    continue

                r_creator = str(reply.get("creator_id", ""))
                r_body = reply.get("text_body", "") or reply.get("body", "")

                if r_creator == person_user_id:
                    updates.append({
                        "date": reply_dt.strftime("%Y-%m-%d %H:%M"),
                        "item": item_name,
                        "item_id": item_id,
                        "type": "reply",
                        "body": r_body[:200],
                    })

    updates.sort(key=lambda x: x["date"])
    return updates


def analyse_item_breakdown(items, activity_logs):
    """Categorise items by type: BM trade-in vs client repair, device type"""
    import re

    categories = {
        "bm_tradein": [],
        "client_repair": [],
        "other": [],
    }

    device_types = Counter()
    groups = Counter()

    # Get item IDs that had completions (status changes to completed)
    completed_statuses = {"Repaired", "Part Repaired", "Refurbed", "Collected", "Delivered"}
    completed_ids = set()
    for log in activity_logs:
        try:
            data = json.loads(log["data"]) if isinstance(log["data"], str) else log["data"]
            value = data.get("value", {})
            if isinstance(value, dict) and "label" in value:
                status = value["label"].get("text", "")
                if status in completed_statuses:
                    pid = str(data.get("pulse_id", ""))
                    if pid:
                        completed_ids.add(pid)
        except:
            pass

    for item_id, item in items.items():
        if item_id not in completed_ids:
            continue

        name = item.get("name", "")
        group_title = item.get("group", {}).get("title", "Unknown")

        # Detect BM trade-in
        trade_in = ""
        for cv in item.get("column_values", []):
            if cv["id"] == "color_mkypbg6z":
                trade_in = cv.get("text", "")

        is_bm = bool(trade_in and trade_in.strip()) or name.upper().startswith("BM ")

        # Detect device type from name
        device = "Unknown"
        name_lower = name.lower()
        if "macbook pro" in name_lower or "mbp" in name_lower:
            # Try to get size
            size_match = re.search(r'(\d{2})["\s-]?(inch|in|")', name_lower)
            if size_match:
                device = f"MacBook Pro {size_match.group(1)}\""
            else:
                device = "MacBook Pro"
        elif "macbook air" in name_lower or "mba" in name_lower:
            device = "MacBook Air"
        elif "macbook" in name_lower:
            device = "MacBook (unspecified)"
        elif "imac" in name_lower:
            device = "iMac"
        elif "ipad" in name_lower:
            device = "iPad"
        elif "iphone" in name_lower:
            device = "iPhone"
        elif "mac mini" in name_lower:
            device = "Mac Mini"
        elif "mac pro" in name_lower:
            device = "Mac Pro"

        # Get revenue
        revenue = 0
        for cv in item.get("column_values", []):
            if cv["id"] == "dup__of_quote_total":
                try:
                    text = cv.get("text", "")
                    if text:
                        revenue = float(text.replace("£", "").replace(",", "").strip())
                except:
                    pass

        entry = {
            "item_id": item_id,
            "name": name,
            "group": group_title,
            "device": device,
            "is_bm": is_bm,
            "revenue": revenue,
        }

        if is_bm:
            categories["bm_tradein"].append(entry)
        elif revenue > 0:
            categories["client_repair"].append(entry)
        else:
            categories["other"].append(entry)

        device_types[device] += 1
        groups[group_title] += 1

    return categories, device_types, groups, completed_ids


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--person", required=True)
    parser.add_argument("--from", dest="from_date", required=True)
    parser.add_argument("--to", dest="to_date", required=True)
    args = parser.parse_args()

    if args.person not in PERSONS:
        print(f"Unknown: {args.person}. Available: {', '.join(PERSONS.keys())}")
        return

    person = PERSONS[args.person]
    token = load_token()
    headers = {"Authorization": token, "Content-Type": "application/json"}

    print(f"{'=' * 60}")
    print(f"AUDIT SUPPLEMENTS: {person['name']}")
    print(f"Period: {args.from_date} to {args.to_date}")
    print(f"{'=' * 60}")

    # 1. Fetch activity logs
    print(f"\n[1/3] Fetching activity logs...")
    logs = fetch_activity_logs(MAIN_BOARD_ID, person["user_id"], args.from_date, args.to_date, headers)
    print(f"  Total: {len(logs)} entries")

    item_ids = get_unique_item_ids(logs)
    print(f"  Unique items: {len(item_ids)}")

    # 2. Fetch items with updates
    print(f"\n[2/3] Fetching item details + updates...")
    items = fetch_items_with_updates(item_ids, headers)
    print(f"  Items loaded: {len(items)}")

    # 3. Analyse
    print(f"\n[3/3] Analysing...")

    # Updates / replies
    updates = analyse_updates(items, person["user_id"], args.from_date, args.to_date)
    print(f"\n{'=' * 60}")
    print(f"UPDATES & REPLIES BY {person['name'].upper()}")
    print(f"{'=' * 60}")
    print(f"Total: {len(updates)}")
    for u in updates:
        print(f"\n  [{u['date']}] ({u['type']}) on: {u['item']}")
        body = u['body'].strip().replace('\n', ' ')
        if body:
            print(f"    \"{body}\"")

    # Item breakdown
    categories, device_types, groups, completed_ids = analyse_item_breakdown(items, logs)
    print(f"\n{'=' * 60}")
    print(f"ITEM BREAKDOWN (completed items only)")
    print(f"{'=' * 60}")
    print(f"Total completed: {len(completed_ids)}")
    print(f"\nBy type:")
    print(f"  BM trade-ins: {len(categories['bm_tradein'])}")
    print(f"  Client repairs: {len(categories['client_repair'])}")
    print(f"  Other (£0 / unclassified): {len(categories['other'])}")

    print(f"\nBy device:")
    for device, count in device_types.most_common():
        print(f"  {device}: {count}")

    print(f"\nBy board group:")
    for group, count in groups.most_common():
        print(f"  {group}: {count}")

    # BM items detail
    if categories["bm_tradein"]:
        print(f"\nBM Trade-in items:")
        for item in categories["bm_tradein"]:
            print(f"  {item['name']} (group: {item['group']})")

    # Client repairs detail
    if categories["client_repair"]:
        print(f"\nClient repair items (with revenue):")
        for item in sorted(categories["client_repair"], key=lambda x: -x["revenue"]):
            print(f"  {item['name']} — £{item['revenue']:.0f} (group: {item['group']})")

    # Other
    if categories["other"]:
        print(f"\nOther items (£0 / no revenue data):")
        for item in categories["other"]:
            print(f"  {item['name']} (group: {item['group']})")


if __name__ == "__main__":
    main()
