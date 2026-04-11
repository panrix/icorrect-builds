#!/usr/bin/env python3
"""Extract Safan's board-level diagnostic notes from Monday.com.

Usage:
    python3 extract_safan_diagnostics.py --verify ITEM_ID
    python3 extract_safan_diagnostics.py --extract
    python3 extract_safan_diagnostics.py --parse
    python3 extract_safan_diagnostics.py --enrich
    python3 extract_safan_diagnostics.py --all
"""

import argparse
import html
import json
import re
import ssl
import sys
import time
import urllib.request
from collections import defaultdict
from datetime import datetime, timedelta
from html.parser import HTMLParser
from pathlib import Path

# Project imports
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from common import DATA_DIR, read_json, write_json, now_iso

# ── Constants ──────────────────────────────────────────────────────────

MONDAY_API_URL = "https://api.monday.com/v2"
BOARD_ID = 349212843
SAFAN_USER_ID = "25304513"
PARTS_BOARD_ID = 985177480

RAW_PATH = DATA_DIR / "safan_diagnostics_raw.json"
PARSED_PATH = DATA_DIR / "safan_diagnostics_parsed.json"
ENRICHED_PATH = DATA_DIR / "safan_diagnostics_enriched.json"
BOARD_INDEX_PATH = DATA_DIR / "board_index.json"

# Column IDs for enrichment
TEXT_COLUMNS = [
    "status4", "status24", "status", "service",
    "date4", "date_mkwdmm9k", "date_mkwdwx03", "collection_date",
    "person", "multiple_person_mkwqj321", "multiple_person_mkwqy930",
    "multiple_person_mkwqsxse", "multiple_person_mkyp2bka",
    "dup__of_quote_total", "numbers9",
    "color_mkwr7s1s", "color_mkqg8ktb",
]
FORMULA_COLUMNS = ["lookup_mkx1xzd7", "formula_mkx1bjqr", "formula__1"]
TIME_COLUMNS = ["time_tracking", "time_tracking9", "time_tracking93", "time_tracking98"]

BLOCKER_STATUSES = {"Awaiting Part", "Repair Paused", "Awaiting Info", "Password Req"}
DIAGNOSTIC_START = {"Diagnostics"}
DIAGNOSTIC_END = {"Diagnostic Complete", "Battery Testing"}
QUOTE_STATUSES = {"Quote Sent"}
REPAIR_START = {"Under Repair", "Under Refurb", "Queued For Repair"}
REPAIR_END = {"Repaired", "Part Repaired", "QC Passed", "Cleaning"}
END_STATES = {"Returned", "Ready To Collect", "Shipped", "Collected", "Delivered", "Sold"}

# ── Regex patterns ─────────────────────────────────────────────────────

RE_A_NUMBER = re.compile(r"\bA(\d{4})\b")
RE_820_NUMBER = re.compile(r"\b(820-\d{5}(?:-[A-Z])?)\b")
# Standard format: "5V 0.2A", "20v/0.4a"
RE_AMMETER_STANDARD = re.compile(
    r"(\d+(?:\.\d+)?)\s*[vV]\s*[/\s,]?\s*(\d+(?:\.\d+)?)\s*[aA]"
)
# Saf's AMM format: "AMM;5.0v           0.019" or "AMM: 20v 0.4a"
RE_AMMETER_AMM = re.compile(
    r"AMM[;:\s]+(\d+(?:\.\d+)?)\s*[vV]\s+(\d+(?:\.\d+)?)(?:\s*[aA])?"
)
RE_VOLTAGE_ONLY = re.compile(r"(\d+(?:\.\d+)?)\s*[vV](?![a-zA-Z])")
# Component designators: C/U/R/Q + 3-5 digits, or CF/CD/CR/CS/CP/CH/CV/UR + digits
RE_COMPONENT = re.compile(r"\b([CURQ][FDHPSVR]?\d{3,5}[A-Z]?)\b")

# ── Helpers ────────────────────────────────────────────────────────────


def load_token():
    env_path = Path("/home/ricky/config/.env")
    for line in env_path.read_text().splitlines():
        if line.startswith("MONDAY_APP_TOKEN="):
            return line.split("=", 1)[1].strip()
    raise ValueError("MONDAY_APP_TOKEN not found in /home/ricky/config/.env")


def monday_query(token, query):
    ctx = ssl.create_default_context()
    data = json.dumps({"query": query}).encode()
    req = urllib.request.Request(
        MONDAY_API_URL,
        data=data,
        headers={
            "Authorization": token,
            "Content-Type": "application/json",
            "API-Version": "2024-01",
        },
    )
    resp = urllib.request.urlopen(req, timeout=30, context=ctx)
    result = json.loads(resp.read())
    if "errors" in result:
        print(f"  API error: {result['errors']}", file=sys.stderr)
    return result


class _HTMLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self._parts = []

    def handle_data(self, data):
        self._parts.append(data)

    def get_text(self):
        return " ".join(self._parts)


def strip_html(body):
    s = _HTMLStripper()
    s.feed(html.unescape(body or ""))
    return s.get_text().strip()


def parse_diagnostic_note(body_html):
    text = strip_html(body_html)
    ammeter_matches = RE_AMMETER_STANDARD.findall(text) + RE_AMMETER_AMM.findall(text)
    ammeter_voltages = {m[0] for m in ammeter_matches}
    voltage_only_matches = [
        v for v in RE_VOLTAGE_ONLY.findall(text) if v not in ammeter_voltages
    ]
    return {
        "raw_text": text,
        "a_numbers": [f"A{n}" for n in RE_A_NUMBER.findall(text)],
        "board_numbers": RE_820_NUMBER.findall(text),
        "ammeter_readings": [
            {"voltage": float(v), "amps": float(a)} for v, a in ammeter_matches
        ],
        "voltage_only": [float(v) for v in voltage_only_matches],
        "components": RE_COMPONENT.findall(text),
    }


# ── Phase 1: Verify ───────────────────────────────────────────────────


def cmd_verify(token, item_id):
    print(f"Querying item {item_id} for updates + replies...\n")
    q = """query {
        items(ids: [%s]) {
            id name
            column_values(ids: ["status24", "connect_boards__1"]) {
                id text value type
            }
            updates(limit: 50) {
                id body created_at
                creator { id name }
                replies {
                    id body created_at
                    creator { id name }
                }
            }
        }
    }""" % int(item_id)

    result = monday_query(token, q)
    items = result.get("data", {}).get("items", [])
    if not items:
        print("Item not found.")
        return

    item = items[0]
    print(f"Item: {item['name']} (ID: {item['id']})")

    for cv in item.get("column_values", []):
        print(f"  Column {cv['id']}: {cv.get('text', '')} | value: {cv.get('value', '')}")

    updates = item.get("updates", [])
    print(f"\n{len(updates)} update(s) found.\n")

    reply_count = 0
    for update in updates:
        replies = update.get("replies", [])
        if not replies:
            continue
        print(f"--- Update {update['id']} by {update['creator']['name']} ({update['created_at']}) ---")
        print(f"  Body: {strip_html(update['body'])[:200]}")
        for reply in replies:
            reply_count += 1
            creator = reply.get("creator", {})
            is_saf = creator.get("id") == SAFAN_USER_ID
            marker = " *** SAF ***" if is_saf else ""
            text = strip_html(reply["body"])
            print(f"\n  Reply {reply['id']} by {creator.get('name', '?')}{marker} ({reply['created_at']})")
            print(f"  Text: {text[:500]}")
            if is_saf:
                parsed = parse_diagnostic_note(reply["body"])
                if parsed["ammeter_readings"] or parsed["components"] or parsed["voltage_only"]:
                    print(f"  >> Parsed: ammeter={parsed['ammeter_readings']} voltage_only={parsed['voltage_only']} components={parsed['components']}")

    print(f"\nTotal replies across all updates: {reply_count}")


# ── Phase 2: Extract ──────────────────────────────────────────────────


def paginate_board(token):
    """Yield all items from the main board with status24 and connect_boards__1."""
    print("Paginating main board...")
    first_q = """query {
        boards(ids: [%d]) {
            items_page(limit: 200) {
                cursor
                items {
                    id name
                    column_values(ids: ["status24", "connect_boards__1"]) {
                        id text value
                        ... on BoardRelationValue { linked_item_ids }
                        ... on StatusValue { text }
                    }
                }
            }
        }
    }""" % BOARD_ID

    result = monday_query(token, first_q)
    page = result.get("data", {}).get("boards", [{}])[0].get("items_page", {})
    items = page.get("items", [])
    cursor = page.get("cursor")
    yield from items
    page_num = 1
    print(f"  Page {page_num}: {len(items)} items (cursor: {'yes' if cursor else 'none'})")

    while cursor:
        time.sleep(0.5)
        next_q = """query {
            next_items_page(limit: 200, cursor: "%s") {
                cursor
                items {
                    id name
                    column_values(ids: ["status24", "connect_boards__1"]) {
                        id text value
                        ... on BoardRelationValue { linked_item_ids }
                        ... on StatusValue { text }
                    }
                }
            }
        }""" % cursor
        result = monday_query(token, next_q)
        page = result.get("data", {}).get("next_items_page", {})
        items = page.get("items", [])
        cursor = page.get("cursor")
        page_num += 1
        print(f"  Page {page_num}: {len(items)} items")
        yield from items


def resolve_part_names(token, part_ids):
    """Resolve a set of part item IDs to their names."""
    names = {}
    part_list = list(part_ids)
    for i in range(0, len(part_list), 50):
        batch = part_list[i : i + 50]
        ids_str = ", ".join(str(pid) for pid in batch)
        q = "{ items(ids: [%s]) { id name } }" % ids_str
        result = monday_query(token, q)
        for item in result.get("data", {}).get("items", []):
            names[item["id"]] = item["name"]
        time.sleep(0.3)
    return names


def fetch_updates_for_items(token, item_ids):
    """Fetch updates + replies for a list of item IDs."""
    all_updates = {}
    for i in range(0, len(item_ids), 10):
        batch = item_ids[i : i + 10]
        ids_str = ", ".join(str(iid) for iid in batch)
        q = """query {
            items(ids: [%s]) {
                id
                updates(limit: 50) {
                    id body created_at
                    creator { id name }
                    replies {
                        id body created_at
                        creator { id name }
                    }
                }
            }
        }""" % ids_str
        result = monday_query(token, q)
        for item in result.get("data", {}).get("items", []):
            all_updates[item["id"]] = item.get("updates", [])
        print(f"  Fetched updates for items {i+1}-{i+len(batch)} of {len(item_ids)}")
        time.sleep(0.5)
    return all_updates


def cmd_extract(token):
    # Step 1: Paginate and collect all items
    all_items = list(paginate_board(token))
    print(f"\nTotal items on board: {len(all_items)}")

    # Step 2: Identify items matching criteria
    all_linked_part_ids = set()
    items_with_parts = {}  # item_id -> set of linked part IDs

    for item in all_items:
        linked_ids = set()
        for cv in item.get("column_values", []):
            if cv["id"] == "connect_boards__1":
                # Try linked_item_ids first, fall back to parsing value JSON
                lids = cv.get("linked_item_ids")
                if not lids and cv.get("value"):
                    try:
                        val = json.loads(cv["value"])
                        lids = [str(p["linkedPulseId"]) for p in val.get("linkedPulseIds", [])]
                    except (json.JSONDecodeError, KeyError, TypeError):
                        pass
                if lids:
                    linked_ids = set(str(lid) for lid in lids)
                    all_linked_part_ids.update(linked_ids)
        if linked_ids:
            items_with_parts[item["id"]] = linked_ids

    print(f"Items with parts linked: {len(items_with_parts)}")
    print(f"Unique part IDs to resolve: {len(all_linked_part_ids)}")

    # Step 3: Resolve part names
    part_names = resolve_part_names(token, all_linked_part_ids) if all_linked_part_ids else {}
    print(f"Resolved {len(part_names)} part names")

    # Step 4: Filter matching items
    matching = []
    for item in all_items:
        repair_type = ""
        linked_part_names = []

        for cv in item.get("column_values", []):
            if cv["id"] == "status24":
                repair_type = (cv.get("text") or "").strip()
            elif cv["id"] == "connect_boards__1":
                linked_ids = items_with_parts.get(item["id"], set())
                linked_part_names = [part_names.get(lid, "") for lid in linked_ids]

        is_diagnostic = repair_type.lower() == "diagnostic"
        has_logic_board = any("logic board" in n.lower() for n in linked_part_names if n)

        if is_diagnostic or has_logic_board:
            matching.append({
                "id": item["id"],
                "name": item["name"],
                "repair_type": repair_type,
                "parts_linked": [n for n in linked_part_names if n],
                "match_reason": ("diagnostic" if is_diagnostic else "") +
                                (" + " if is_diagnostic and has_logic_board else "") +
                                ("logic_board_part" if has_logic_board else ""),
            })

    print(f"\nMatching items: {len(matching)}")

    if not matching:
        print("No matching items found. Check filter criteria.")
        return

    # Step 5: Fetch updates for matching items
    match_ids = [m["id"] for m in matching]
    updates_map = fetch_updates_for_items(token, match_ids)

    # Step 6: Attach updates to items
    for item in matching:
        raw_updates = updates_map.get(item["id"], [])
        item["updates"] = []
        for u in raw_updates:
            update_data = {
                "id": u["id"],
                "body": u.get("body", ""),
                "body_text": strip_html(u.get("body", "")),
                "created_at": u.get("created_at", ""),
                "creator_id": u.get("creator", {}).get("id", ""),
                "creator_name": u.get("creator", {}).get("name", ""),
                "replies": [],
            }
            for r in u.get("replies", []):
                update_data["replies"].append({
                    "id": r["id"],
                    "body": r.get("body", ""),
                    "body_text": strip_html(r.get("body", "")),
                    "created_at": r.get("created_at", ""),
                    "creator_id": r.get("creator", {}).get("id", ""),
                    "creator_name": r.get("creator", {}).get("name", ""),
                })
            item["updates"].append(update_data)

    output = {
        "extracted_at": now_iso(),
        "board_id": BOARD_ID,
        "item_count": len(matching),
        "items": matching,
    }
    write_json(RAW_PATH, output)
    print(f"\nWrote {RAW_PATH} ({len(matching)} items)")


# ── Phase 3: Parse ────────────────────────────────────────────────────


def cmd_parse():
    raw = read_json(RAW_PATH)
    if not raw:
        print(f"No raw data at {RAW_PATH}. Run --extract first.")
        return

    board_index = read_json(BOARD_INDEX_PATH, {})

    by_model = {}
    all_parsed = []

    for item in raw["items"]:
        # Try to get device model from item name
        item_a_numbers = [f"A{n}" for n in RE_A_NUMBER.findall(item["name"])]

        item_parsed = {
            "item_id": item["id"],
            "item_name": item["name"],
            "repair_type": item.get("repair_type", ""),
            "parts_linked": item.get("parts_linked", []),
            "match_reason": item.get("match_reason", ""),
            "device_models_from_name": item_a_numbers,
            "notes": [],
        }

        for update in item.get("updates", []):
            for reply in update.get("replies", []):
                parsed = parse_diagnostic_note(reply.get("body", ""))
                parsed["reply_id"] = reply["id"]
                parsed["created_at"] = reply.get("created_at", "")
                parsed["creator_id"] = reply.get("creator_id", "")
                parsed["creator_name"] = reply.get("creator_name", "")
                item_parsed["notes"].append(parsed)

        all_parsed.append(item_parsed)

        # Group by model
        models = set(item_a_numbers)
        for note in item_parsed["notes"]:
            models.update(note.get("a_numbers", []))

        for model in models:
            if model not in by_model:
                # Look up in board_index
                board_info = board_index.get(model, {})
                by_model[model] = {
                    "model": model,
                    "board_revision": board_info.get("board_number", ""),
                    "board_name": board_info.get("name", ""),
                    "diagnostics": [],
                }
            by_model[model]["diagnostics"].append(item_parsed)

    output = {
        "parsed_at": now_iso(),
        "source": str(RAW_PATH),
        "item_count": len(all_parsed),
        "model_count": len(by_model),
        "by_model": by_model,
        "all_items": all_parsed,
    }
    write_json(PARSED_PATH, output)
    print(f"Wrote {PARSED_PATH}")
    print(f"  {len(all_parsed)} items, {len(by_model)} unique models")
    print(f"  Models found: {sorted(by_model.keys())}")

    # Summary
    total_notes = sum(len(i["notes"]) for i in all_parsed)
    notes_with_ammeter = sum(
        1 for i in all_parsed for n in i["notes"] if n["ammeter_readings"]
    )
    notes_with_components = sum(
        1 for i in all_parsed for n in i["notes"] if n["components"]
    )
    print(f"  Total reply notes: {total_notes}")
    print(f"  Notes with ammeter readings: {notes_with_ammeter}")
    print(f"  Notes with component refs: {notes_with_components}")


# ── Phase 4: Enrich ───────────────────────────────────────────────────


def working_days_between(dt_from, dt_to):
    """Count working days (excl Sat/Sun) between two datetimes."""
    if not dt_from or not dt_to:
        return None
    if isinstance(dt_from, str):
        dt_from = datetime.fromisoformat(dt_from.replace("Z", "+00:00"))
    if isinstance(dt_to, str):
        dt_to = datetime.fromisoformat(dt_to.replace("Z", "+00:00"))
    if dt_to < dt_from:
        return 0
    d1 = dt_from.date()
    d2 = dt_to.date()
    days = 0
    current = d1
    while current <= d2:
        if current.weekday() < 5:
            days += 1
        current += timedelta(days=1)
    return max(1, days)  # minimum 1 if same day


def parse_monday_timestamp(ts):
    """Parse Monday 17-digit nanosecond timestamp to ISO string."""
    try:
        unix_ts = int(ts) / 10000000
        dt = datetime.utcfromtimestamp(unix_ts)
        return dt.isoformat() + "Z"
    except (ValueError, TypeError, OSError):
        return ts  # already ISO or unparseable


def parse_activity_log_label(val):
    """Extract status label from activity log value dict."""
    if not val or not isinstance(val, dict):
        return ""
    label_obj = val.get("label", {})
    if isinstance(label_obj, dict):
        return label_obj.get("text", "")
    if isinstance(label_obj, str):
        return label_obj
    return val.get("text", "")


def parse_activity_logs(logs):
    """Parse activity logs into sorted status transitions."""
    transitions = []
    for log in logs:
        try:
            log_data = json.loads(log["data"]) if isinstance(log["data"], str) else log["data"]
            prev_label = parse_activity_log_label(log_data.get("previous_value", {}))
            new_label = parse_activity_log_label(log_data.get("value", {}))
            ts = log.get("created_at", "")
            # Monday activity_logs created_at can be 17-digit or ISO
            if ts and len(str(ts)) > 15 and str(ts).isdigit():
                ts = parse_monday_timestamp(ts)
            transitions.append({
                "from": prev_label or "(empty)",
                "to": new_label or "(empty)",
                "timestamp": ts,
            })
        except (json.JSONDecodeError, TypeError, KeyError):
            pass
    transitions.sort(key=lambda x: x.get("timestamp", ""))
    return transitions


def compute_timing(timeline):
    """Compute timing gaps from a status transition timeline."""
    timing = {
        "received_at": None,
        "diagnostic_start": None,
        "diagnostic_end": None,
        "quote_sent": None,
        "first_post_quote": None,
        "invoiced_at": None,
        "repair_start": None,
        "repair_end": None,
        "end_state_at": None,
        "blocker_entries": [],
    }

    in_blocker = None
    blocker_start = None

    for t in timeline:
        ts = t["timestamp"]
        to_status = t["to"]
        from_status = t["from"]

        # Track first occurrence of each milestone
        if to_status == "Received" and not timing["received_at"]:
            timing["received_at"] = ts
        if to_status in DIAGNOSTIC_START and not timing["diagnostic_start"]:
            timing["diagnostic_start"] = ts
        if to_status in DIAGNOSTIC_END and not timing["diagnostic_end"]:
            timing["diagnostic_end"] = ts
        if to_status in QUOTE_STATUSES and not timing["quote_sent"]:
            timing["quote_sent"] = ts
        if timing["quote_sent"] and not timing["first_post_quote"] and ts > timing["quote_sent"]:
            timing["first_post_quote"] = ts
        if to_status == "Invoiced" and not timing["invoiced_at"]:
            timing["invoiced_at"] = ts
        if to_status in REPAIR_START and not timing["repair_start"]:
            timing["repair_start"] = ts
        if to_status in REPAIR_END and not timing["repair_end"]:
            timing["repair_end"] = ts
        if to_status in END_STATES and not timing["end_state_at"]:
            timing["end_state_at"] = ts

        # Track blocker time
        if to_status in BLOCKER_STATUSES:
            in_blocker = to_status
            blocker_start = ts
        elif in_blocker and to_status not in BLOCKER_STATUSES:
            if blocker_start:
                timing["blocker_entries"].append({
                    "status": in_blocker,
                    "start": blocker_start,
                    "end": ts,
                })
            in_blocker = None
            blocker_start = None

    # Compute working day gaps
    wd = working_days_between
    result = {
        "wait_before_diagnostic": wd(timing["received_at"], timing["diagnostic_start"]),
        "diagnostic_duration": wd(timing["diagnostic_start"], timing["diagnostic_end"]),
        "time_to_quote": wd(timing["diagnostic_end"], timing["quote_sent"]),
        "customer_response_time": wd(timing["quote_sent"], timing["first_post_quote"]),
        "time_to_repair_start": wd(timing["invoiced_at"] or timing["first_post_quote"], timing["repair_start"]),
        "repair_duration": wd(timing["repair_start"], timing["repair_end"]),
        "total_turnaround": wd(timing["received_at"], timing["end_state_at"] or timing["repair_end"]),
    }

    # Blocker breakdown
    blocker_breakdown = defaultdict(float)
    for b in timing["blocker_entries"]:
        days = wd(b["start"], b["end"])
        if days:
            blocker_breakdown[b["status"]] += days
    result["time_in_blockers"] = sum(blocker_breakdown.values()) or 0
    result["blocker_breakdown"] = dict(blocker_breakdown)

    # Raw timestamps for reference
    result["milestones"] = {
        "received": timing["received_at"],
        "diagnostic_start": timing["diagnostic_start"],
        "diagnostic_end": timing["diagnostic_end"],
        "quote_sent": timing["quote_sent"],
        "customer_responded": timing["first_post_quote"],
        "invoiced": timing["invoiced_at"],
        "repair_start": timing["repair_start"],
        "repair_end": timing["repair_end"],
        "completed": timing["end_state_at"],
    }
    return result


def safe_float(val, default=0.0):
    if not val or val in ("null", "None", ""):
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def parse_parts_cost(display_value):
    """Parse comma-separated parts cost string into total."""
    if not display_value or display_value in ("null", "None"):
        return 0.0
    try:
        return sum(float(p.strip()) for p in display_value.split(",") if p.strip())
    except (ValueError, TypeError):
        return 0.0


def parse_time_tracking_seconds(value_str):
    """Extract duration seconds from time_tracking column value JSON."""
    if not value_str or value_str in ("null", "None"):
        return 0
    try:
        val = json.loads(value_str)
        if isinstance(val, dict):
            return val.get("duration", 0) or 0
        return 0
    except (json.JSONDecodeError, TypeError):
        return 0


def fetch_column_data(token, item_ids):
    """Fetch text columns, formula columns, and time tracking for items."""
    col_data = {}

    # Query 1: Text columns
    print("  Fetching text columns...")
    cols_json = json.dumps(TEXT_COLUMNS)
    for i in range(0, len(item_ids), 25):
        batch = item_ids[i:i + 25]
        ids_str = ", ".join(str(iid) for iid in batch)
        q = """{ items(ids: [%s]) { id column_values(ids: %s) { id text } } }""" % (ids_str, cols_json)
        result = monday_query(token, q)
        for item in result.get("data", {}).get("items", []):
            iid = item["id"]
            if iid not in col_data:
                col_data[iid] = {}
            for cv in item.get("column_values", []):
                col_data[iid][cv["id"]] = cv.get("text", "")
        if i % 100 == 0 and i > 0:
            print(f"    {i}/{len(item_ids)}")
        time.sleep(0.3)

    # Query 2: Formula/mirror columns (need display_value)
    print("  Fetching formula/mirror columns...")
    for i in range(0, len(item_ids), 25):
        batch = item_ids[i:i + 25]
        ids_str = ", ".join(str(iid) for iid in batch)
        q = """{ items(ids: [%s]) { id column_values(ids: ["lookup_mkx1xzd7", "formula_mkx1bjqr", "formula__1"]) {
            id ... on MirrorValue { display_value } ... on FormulaValue { display_value }
        } } }""" % ids_str
        result = monday_query(token, q)
        for item in result.get("data", {}).get("items", []):
            iid = item["id"]
            if iid not in col_data:
                col_data[iid] = {}
            for cv in item.get("column_values", []):
                col_data[iid][cv["id"]] = cv.get("display_value", "")
        time.sleep(0.3)

    # Query 3: Time tracking columns (need value JSON)
    print("  Fetching time tracking columns...")
    for i in range(0, len(item_ids), 25):
        batch = item_ids[i:i + 25]
        ids_str = ", ".join(str(iid) for iid in batch)
        q = """{ items(ids: [%s]) { id column_values(ids: ["time_tracking", "time_tracking9", "time_tracking93", "time_tracking98"]) {
            id value
        } } }""" % ids_str
        result = monday_query(token, q)
        for item in result.get("data", {}).get("items", []):
            iid = item["id"]
            if iid not in col_data:
                col_data[iid] = {}
            for cv in item.get("column_values", []):
                col_data[iid][cv["id"] + "_secs"] = parse_time_tracking_seconds(cv.get("value", ""))
        time.sleep(0.3)

    print(f"  Column data fetched for {len(col_data)} items")
    return col_data


def fetch_activity_logs(token, item_ids):
    """Fetch status4 activity logs for each item. Returns {item_id: [transitions]}."""
    all_timelines = {}
    total = len(item_ids)
    for idx, iid in enumerate(item_ids):
        q = """{ boards(ids: [%d]) { activity_logs(item_ids: [%s], column_ids: ["status4"], limit: 100) {
            event data created_at
        } } }""" % (BOARD_ID, iid)
        result = monday_query(token, q)
        logs = result.get("data", {}).get("boards", [{}])[0].get("activity_logs", [])
        all_timelines[iid] = parse_activity_logs(logs)
        if (idx + 1) % 50 == 0:
            print(f"  Activity logs: {idx + 1}/{total}")
        time.sleep(0.3)
    print(f"  Activity logs fetched for {len(all_timelines)} items")
    return all_timelines


def flatten_notes(raw_item):
    """Flatten all updates and replies into a single notes list."""
    notes = []
    for update in raw_item.get("updates", []):
        notes.append({
            "type": "update",
            "author": update.get("creator_name", ""),
            "author_id": update.get("creator_id", ""),
            "text": update.get("body_text", ""),
            "created_at": update.get("created_at", ""),
        })
        for reply in update.get("replies", []):
            notes.append({
                "type": "reply",
                "author": reply.get("creator_name", ""),
                "author_id": reply.get("creator_id", ""),
                "text": reply.get("body_text", ""),
                "created_at": reply.get("created_at", ""),
            })
    notes.sort(key=lambda n: n.get("created_at", ""))
    return notes


def build_enriched_item(raw_item, col_data, timeline, parsed_notes_map):
    """Build a single enriched item record."""
    iid = raw_item["id"]
    cols = col_data.get(iid, {})
    timing = compute_timing(timeline)

    # Device model from item name
    a_numbers = [f"A{n}" for n in RE_A_NUMBER.findall(raw_item["name"])]

    # Financials
    quote_inc_vat = safe_float(cols.get("dup__of_quote_total"))
    revenue_ex_vat = quote_inc_vat / 1.2 if quote_inc_vat else 0
    parts_cost = parse_parts_cost(cols.get("lookup_mkx1xzd7", ""))
    labour_cost = safe_float(cols.get("formula_mkx1bjqr"))
    net_profit = revenue_ex_vat - parts_cost - labour_cost if revenue_ex_vat else None
    margin_pct = (net_profit / revenue_ex_vat * 100) if revenue_ex_vat and net_profit is not None else None

    # Time tracking
    diag_secs = cols.get("time_tracking_secs", 0)
    repair_secs = cols.get("time_tracking9_secs", 0)
    refurb_secs = cols.get("time_tracking93_secs", 0)
    total_secs = cols.get("time_tracking98_secs", 0)

    # Parsed diagnostic notes (from Phase 3)
    parsed_diag = parsed_notes_map.get(iid)

    # Flatten all team notes
    all_notes = flatten_notes(raw_item)

    return {
        "id": iid,
        "name": raw_item["name"],
        "device_models": a_numbers,
        "repair_type": cols.get("status24", raw_item.get("repair_type", "")),
        "current_status": cols.get("status4", ""),
        "client_type": cols.get("status", ""),
        "service_type": cols.get("service", ""),
        "match_reason": raw_item.get("match_reason", ""),
        "parts_linked": raw_item.get("parts_linked", []),
        "people": {
            "primary": cols.get("person", ""),
            "diagnostic": cols.get("multiple_person_mkwqj321", ""),
            "repair": cols.get("multiple_person_mkwqy930", ""),
            "refurb": cols.get("multiple_person_mkwqsxse", ""),
            "qc": cols.get("multiple_person_mkyp2bka", ""),
        },
        "dates": {
            "received": cols.get("date4", ""),
            "diagnostic_complete": cols.get("date_mkwdmm9k", ""),
            "quote_sent": cols.get("date_mkwdwx03", ""),
            "repaired": cols.get("collection_date", ""),
        },
        "timing_working_days": {
            "wait_before_diagnostic": timing["wait_before_diagnostic"],
            "diagnostic_duration": timing["diagnostic_duration"],
            "time_to_quote": timing["time_to_quote"],
            "customer_response_time": timing["customer_response_time"],
            "time_to_repair_start": timing["time_to_repair_start"],
            "repair_duration": timing["repair_duration"],
            "total_turnaround": timing["total_turnaround"],
            "time_in_blockers": timing["time_in_blockers"],
            "blocker_breakdown": timing["blocker_breakdown"],
        },
        "milestones": timing["milestones"],
        "time_tracking_hours": {
            "diagnostic": round(diag_secs / 3600, 2) if diag_secs else 0,
            "repair": round(repair_secs / 3600, 2) if repair_secs else 0,
            "refurb": round(refurb_secs / 3600, 2) if refurb_secs else 0,
            "total": round(total_secs / 3600, 2) if total_secs else 0,
        },
        "financials": {
            "quote_inc_vat": quote_inc_vat or None,
            "revenue_ex_vat": round(revenue_ex_vat, 2) if revenue_ex_vat else None,
            "parts_cost": round(parts_cost, 2) if parts_cost else None,
            "labour_cost": round(labour_cost, 2) if labour_cost else None,
            "labour_hours": safe_float(cols.get("formula__1")) or None,
            "net_profit": round(net_profit, 2) if net_profit is not None else None,
            "margin_pct": round(margin_pct, 1) if margin_pct is not None else None,
        },
        "condition": {
            "ammeter_column": cols.get("color_mkwr7s1s", ""),
            "battery_health": safe_float(cols.get("numbers9")) or None,
            "liquid_damage": cols.get("color_mkqg8ktb", ""),
        },
        "status_timeline": timeline,
        "diagnostic_notes": parsed_diag,
        "all_notes": all_notes,
    }


def cmd_enrich(token):
    raw = read_json(RAW_PATH)
    if not raw:
        print(f"No raw data at {RAW_PATH}. Run --extract first.")
        return

    # Load parsed data for diagnostic note fields
    parsed = read_json(PARSED_PATH, {})
    parsed_notes_map = {}
    for item in parsed.get("all_items", []):
        if item.get("notes"):
            parsed_notes_map[item["item_id"]] = item["notes"]

    items = raw["items"]
    item_ids = [it["id"] for it in items]
    print(f"Enriching {len(item_ids)} items...\n")

    # Step 1: Column data
    print("Step 1: Fetching column data...")
    col_data = fetch_column_data(token, item_ids)

    # Step 2: Activity logs
    print("\nStep 2: Fetching activity logs (this takes ~6 min for 1053 items)...")
    timelines = fetch_activity_logs(token, item_ids)

    # Step 3: Build enriched records
    print("\nStep 3: Building enriched records...")
    enriched_items = []
    for raw_item in items:
        iid = raw_item["id"]
        timeline = timelines.get(iid, [])
        enriched = build_enriched_item(raw_item, col_data, timeline, parsed_notes_map)
        enriched_items.append(enriched)

    # Summary stats
    with_timing = sum(1 for e in enriched_items if e["timing_working_days"]["total_turnaround"])
    with_financials = sum(1 for e in enriched_items if e["financials"]["quote_inc_vat"])
    with_timeline = sum(1 for e in enriched_items if e["status_timeline"])
    with_diag_notes = sum(1 for e in enriched_items if e["diagnostic_notes"])

    diag_durations = [e["timing_working_days"]["diagnostic_duration"]
                      for e in enriched_items
                      if e["timing_working_days"]["diagnostic_duration"] is not None]
    total_turnarounds = [e["timing_working_days"]["total_turnaround"]
                         for e in enriched_items
                         if e["timing_working_days"]["total_turnaround"] is not None]

    # Blocker stats
    blocker_counts = defaultdict(int)
    for e in enriched_items:
        for status, days in e["timing_working_days"]["blocker_breakdown"].items():
            blocker_counts[status] += 1

    def median(lst):
        if not lst:
            return None
        s = sorted(lst)
        n = len(s)
        if n % 2 == 0:
            return (s[n // 2 - 1] + s[n // 2]) / 2
        return s[n // 2]

    output = {
        "enriched_at": now_iso(),
        "source": str(RAW_PATH),
        "item_count": len(enriched_items),
        "summary": {
            "with_timing_data": with_timing,
            "with_financials": with_financials,
            "with_status_timeline": with_timeline,
            "with_diagnostic_notes": with_diag_notes,
            "median_diagnostic_days": median(diag_durations),
            "median_total_turnaround_days": median(total_turnarounds),
            "top_blocker_statuses": dict(sorted(blocker_counts.items(), key=lambda x: -x[1])),
        },
        "items": enriched_items,
    }
    write_json(ENRICHED_PATH, output)
    print(f"\nWrote {ENRICHED_PATH}")
    print(f"  {len(enriched_items)} items enriched")
    print(f"  With timing data: {with_timing}")
    print(f"  With financials: {with_financials}")
    print(f"  With status timeline: {with_timeline}")
    print(f"  Median diagnostic duration: {median(diag_durations)} working days")
    print(f"  Median total turnaround: {median(total_turnarounds)} working days")
    print(f"  Top blockers: {dict(sorted(blocker_counts.items(), key=lambda x: -x[1])[:5])}")


# ── Main ───────────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(description="Extract Safan's diagnostics from Monday.com")
    parser.add_argument("--verify", metavar="ITEM_ID", help="Verify access to a specific item's update replies")
    parser.add_argument("--extract", action="store_true", help="Extract all matching diagnostic items")
    parser.add_argument("--parse", action="store_true", help="Parse raw extraction into structured data")
    parser.add_argument("--enrich", action="store_true", help="Enrich raw data with timing, costs, and full team notes")
    parser.add_argument("--all", action="store_true", help="Run extract + parse + enrich")
    args = parser.parse_args()

    if not (args.verify or args.extract or args.parse or args.enrich or args.all):
        parser.print_help()
        return

    token = load_token()

    if args.verify:
        cmd_verify(token, args.verify)
    elif args.extract:
        cmd_extract(token)
    elif args.parse:
        cmd_parse()
    elif args.enrich:
        cmd_enrich(token)
    elif args.all:
        cmd_extract(token)
        cmd_parse()
        cmd_enrich(token)


if __name__ == "__main__":
    main()
