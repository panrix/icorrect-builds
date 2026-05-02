#!/usr/bin/env python3
"""Extract Ferrari's raw Monday.com footprint for the last N months.

Outputs a raw JSON file containing:
- activity logs by Ferrari across target boards
- every touched item with board/group/selected column data
- all updates on those touched items, including replies
- Ferrari-authored updates/replies flagged inline

Default window: last 6 months.

Usage:
  python3 extract_ferrari_monday_raw.py
  python3 extract_ferrari_monday_raw.py --months 6
  python3 extract_ferrari_monday_raw.py --from 2025-10-23 --to 2026-04-23
"""

import argparse
import json
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Any, Set

import requests

MONDAY_API_URL = "https://api.monday.com/v2"
FERRARI_USER_ID = "55780786"
DEFAULT_BOARD_IDS = [349212843, 18393875720]
OUTPUT_DIR = Path("/home/ricky/builds/team-audits/reports/ferrari")

# Keep this broad enough to be useful without requiring schema discovery for every board column.
ITEM_COLUMN_IDS = [
    "status4", "status24", "status", "service", "date4", "person",
    "multiple_person_mkwqj321", "multiple_person_mkwqy930", "multiple_person_mkwqsxse",
    "multiple_person_mkyp2bka", "dup__of_quote_total", "numbers9", "text5", "text00"
]


def load_token() -> str:
    candidates = [
        "/home/ricky/builds/team-audits/.env",
        "/home/ricky/config/.env",
        "/home/ricky/config/api-keys/.env",
    ]
    for env_path in candidates:
        if not os.path.exists(env_path):
            continue
        with open(env_path) as f:
            for line in f:
                if line.startswith("MONDAY_APP_TOKEN=") or line.startswith("MONDAY_API_TOKEN="):
                    return line.strip().split("=", 1)[1]
    raise ValueError("MONDAY_APP_TOKEN / MONDAY_API_TOKEN not found")


def run_query(query: str, headers: Dict[str, str], retries: int = 3) -> Dict[str, Any]:
    for attempt in range(retries):
        resp = requests.post(
            MONDAY_API_URL,
            json={"query": query},
            headers=headers,
            timeout=60,
        )
        try:
            result = resp.json()
        except Exception:
            result = {"errors": [{"message": f"Non-JSON response: {resp.status_code}"}]}
        if "errors" not in result:
            return result
        if attempt < retries - 1:
            time.sleep(2)
    return result


def iso_day_bounds(day_str: str, end: bool = False) -> str:
    suffix = "23:59:59Z" if end else "00:00:00Z"
    return f"{day_str}T{suffix}"


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--months", type=int, default=6)
    p.add_argument("--from", dest="from_date")
    p.add_argument("--to", dest="to_date")
    p.add_argument("--boards", nargs="*", type=int, default=DEFAULT_BOARD_IDS)
    return p.parse_args()


def resolve_window(args):
    today = datetime.now(timezone.utc).date()
    to_date = args.to_date or today.isoformat()
    if args.from_date:
        from_date = args.from_date
    else:
        approx_from = today - timedelta(days=30 * args.months)
        from_date = approx_from.isoformat()
    return from_date, to_date


def fetch_activity_logs(board_id: int, headers: Dict[str, str], from_date: str, to_date: str) -> List[Dict[str, Any]]:
    all_logs = []
    page = 1
    while True:
        query = f'''query {{
            boards(ids: [{board_id}]) {{
                activity_logs(
                    user_ids: [{FERRARI_USER_ID}],
                    from: "{iso_day_bounds(from_date)}",
                    to: "{iso_day_bounds(to_date, end=True)}",
                    limit: 500,
                    page: {page}
                ) {{
                    id
                    event
                    data
                    created_at
                    user_id
                }}
            }}
        }}'''
        result = run_query(query, headers)
        logs = result.get("data", {}).get("boards", [{}])[0].get("activity_logs", [])
        all_logs.extend(logs)
        if len(logs) < 500:
            break
        page += 1
        time.sleep(0.5)
    return all_logs


def extract_item_ids_from_logs(logs: List[Dict[str, Any]]) -> Set[str]:
    ids = set()
    for log in logs:
        raw = log.get("data")
        try:
            data = json.loads(raw) if isinstance(raw, str) else raw or {}
        except Exception:
            data = {}
        for key in ["pulse_id", "item_id"]:
            val = data.get(key)
            if val:
                ids.add(str(val))
        if data.get("pulse_ids") and isinstance(data["pulse_ids"], list):
            for val in data["pulse_ids"]:
                ids.add(str(val))
    return ids


def fetch_items(item_ids: List[str], headers: Dict[str, str]) -> Dict[str, Dict[str, Any]]:
    items = {}
    if not item_ids:
        return items
    ids_list = list(item_ids)
    cols = json.dumps(ITEM_COLUMN_IDS)
    for i in range(0, len(ids_list), 10):
        batch = ids_list[i:i+10]
        ids_str = ", ".join(batch)
        query = f'''query {{
            items(ids: [{ids_str}]) {{
                id
                name
                created_at
                updated_at
                state
                group {{ id title }}
                board {{ id name }}
                column_values(ids: {cols}) {{
                    id
                    text
                    value
                    type
                }}
                updates(limit: 100) {{
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
        time.sleep(0.4)
    return items


def normalise_updates(items: Dict[str, Dict[str, Any]]) -> None:
    for item in items.values():
        for upd in item.get("updates", []):
            upd["is_ferrari_update"] = str(upd.get("creator_id", "")) == FERRARI_USER_ID
            for reply in upd.get("replies", []):
                reply["is_ferrari_reply"] = str(reply.get("creator_id", "")) == FERRARI_USER_ID


def build_summary(board_logs: Dict[str, List[Dict[str, Any]]], items: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    total_logs = sum(len(v) for v in board_logs.values())
    ferrari_updates = 0
    ferrari_replies = 0
    for item in items.values():
        for upd in item.get("updates", []):
            if upd.get("is_ferrari_update"):
                ferrari_updates += 1
            for reply in upd.get("replies", []):
                if reply.get("is_ferrari_reply"):
                    ferrari_replies += 1
    boards = {}
    for item in items.values():
        board = item.get("board", {}) or {}
        bid = str(board.get("id", "unknown"))
        boards.setdefault(bid, {"board_name": board.get("name", ""), "item_count": 0})
        boards[bid]["item_count"] += 1
    return {
        "activity_log_count": total_logs,
        "touched_item_count": len(items),
        "ferrari_authored_updates": ferrari_updates,
        "ferrari_authored_replies": ferrari_replies,
        "boards": boards,
    }


def main():
    args = parse_args()
    from_date, to_date = resolve_window(args)
    token = load_token()
    headers = {
        "Authorization": token,
        "Content-Type": "application/json",
        "API-Version": "2024-01",
    }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    board_logs: Dict[str, List[Dict[str, Any]]] = {}
    all_item_ids: Set[str] = set()

    print(f"Extracting Ferrari Monday raw data from {from_date} to {to_date}...")
    for board_id in args.boards:
        print(f"  Board {board_id}: activity logs")
        logs = fetch_activity_logs(board_id, headers, from_date, to_date)
        board_logs[str(board_id)] = logs
        all_item_ids.update(extract_item_ids_from_logs(logs))
        print(f"    logs={len(logs)} | unique_items_so_far={len(all_item_ids)}")

    print(f"Fetching {len(all_item_ids)} touched items with updates/replies...")
    items = fetch_items(sorted(all_item_ids), headers)
    normalise_updates(items)

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "from_date": from_date,
        "to_date": to_date,
        "ferrari_user_id": FERRARI_USER_ID,
        "board_ids": args.boards,
        "summary": build_summary(board_logs, items),
        "activity_logs_by_board": board_logs,
        "items": items,
    }

    stamp = to_date
    out_path = OUTPUT_DIR / f"ferrari_monday_raw_{from_date}_to_{stamp}.json"
    with open(out_path, "w") as f:
        json.dump(payload, f, indent=2)

    print(f"Saved: {out_path}")
    print(json.dumps(payload["summary"], indent=2))


if __name__ == "__main__":
    main()
