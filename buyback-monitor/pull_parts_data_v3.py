#!/usr/bin/env python3
"""
Pull repair cost data via the correct data chain:
BM Devices (3892194968) → Main Board (349212843) → Parts Board (985177480)

V3: Uses Trade-in Grade column on BM Devices board.
Model number extracted from Device mirror column (lookup).
"""

import json
import os
import re
import sys
import time
from collections import Counter
from datetime import date

import requests

# Force line-buffered stdout
sys.stdout.reconfigure(line_buffering=True)

# ── Config ──────────────────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv("/home/ricky/config/api-keys/.env")

MONDAY_TOKEN = os.environ["MONDAY_APP_TOKEN"]
API_URL = "https://api.monday.com/v2"
HEADERS = {
    "Authorization": MONDAY_TOKEN,
    "Content-Type": "application/json",
    "API-Version": "2024-10"
}

BM_DEVICES_BOARD = 3892194968
MAIN_BOARD = 349212843
PARTS_BOARD = 985177480

OUTPUT_PATH = "/home/ricky/.openclaw/agents/main/workspace/data/buyback/parts-raw-data.json"

# Parts to filter out (accessories, not repair parts)
ACCESSORY_KEYWORDS = ["charger", "plug head", "plug", "wire", "cable"]
KEEP_OVERRIDE = ["flex cable", "lvds", "flex"]

MODEL_RE = re.compile(r'\bA\d{4}\b')


def monday_query(query, retries=3):
    """Execute a Monday.com GraphQL query with retry logic."""
    payload = {"query": query}
    for attempt in range(retries):
        try:
            resp = requests.post(API_URL, json=payload, headers=HEADERS, timeout=30)
            data = resp.json()
            if "errors" in data:
                print(f"  GraphQL error: {data['errors']}")
                if attempt < retries - 1:
                    time.sleep(3)
                    continue
                return None
            if "error_message" in data:
                print(f"  API error: {data['error_message']}")
                wait = 10 if "rate" in str(data.get("error_message", "")).lower() else 3
                if attempt < retries - 1:
                    time.sleep(wait)
                    continue
                return None
            return data.get("data")
        except Exception as e:
            print(f"  Request error (attempt {attempt+1}): {e}")
            if attempt < retries - 1:
                time.sleep(3)
    return None


def get_col(item, col_id):
    """Get a column value from an item's column_values list."""
    for col in item.get("column_values", []):
        if col["id"] == col_id:
            return col
    return None


def extract_model(device_name):
    """Extract model number (A2337 etc) from device name."""
    if not device_name:
        return ""
    m = MODEL_RE.search(device_name)
    return m.group(0) if m else ""


# ── Step 1.1: Pull BM Devices with Trade-in Grade ──────────────────────
def pull_bm_devices():
    print("Step 1.1: Pulling BM Devices items with Trade-in Grade...")
    all_items = []
    cursor = None
    page = 0

    while True:
        page += 1
        if cursor:
            query = f'''{{
                next_items_page(cursor: "{cursor}", limit: 200) {{
                    cursor
                    items {{
                        id
                        name
                        column_values(ids: ["color_mm1fj7tb", "lookup", "board_relation", "numeric", "numeric5"]) {{
                            id
                            text
                            value
                            ... on StatusValue {{ label }}
                            ... on BoardRelationValue {{ linked_item_ids }}
                            ... on NumbersValue {{ number }}
                            ... on MirrorValue {{ display_value }}
                        }}
                    }}
                }}
            }}'''
        else:
            query = f'''{{
                boards(ids: [{BM_DEVICES_BOARD}]) {{
                    items_page(limit: 200) {{
                        cursor
                        items {{
                            id
                            name
                            column_values(ids: ["color_mm1fj7tb", "lookup", "board_relation", "numeric", "numeric5"]) {{
                                id
                                text
                                value
                                ... on StatusValue {{ label }}
                                ... on BoardRelationValue {{ linked_item_ids }}
                                ... on NumbersValue {{ number }}
                                ... on MirrorValue {{ display_value }}
                            }}
                        }}
                    }}
                }}
            }}'''

        data = monday_query(query)
        if not data:
            print(f"  Failed on page {page}")
            break

        if cursor:
            page_data = data.get("next_items_page", {})
        else:
            boards = data.get("boards", [])
            if not boards:
                print("  No board data returned")
                break
            page_data = boards[0].get("items_page", {})

        items = page_data.get("items", [])
        new_cursor = page_data.get("cursor")

        for item in items:
            grade_col = get_col(item, "color_mm1fj7tb")
            if not grade_col:
                continue
            grade_label = grade_col.get("label") or grade_col.get("text", "")
            if not grade_label or not grade_label.strip():
                continue

            # Device name (mirror) -> model number
            device_col = get_col(item, "lookup")
            device_name = device_col.get("display_value", "") if device_col else ""
            model = extract_model(device_name)

            # Board relation
            rel_col = get_col(item, "board_relation")
            linked_ids = rel_col.get("linked_item_ids", []) if rel_col else []

            # Prices
            price_col = get_col(item, "numeric")
            purchase_price = price_col.get("number") if price_col else None

            sale_col = get_col(item, "numeric5")
            sale_price = sale_col.get("number") if sale_col else None

            all_items.append({
                "bm_item_id": str(item["id"]),
                "bm_name": item["name"],
                "device_name": device_name,
                "model": model,
                "trade_in_grade": grade_label.strip(),
                "purchase_price": purchase_price,
                "sale_price": sale_price,
                "main_board_item_ids": [str(x) for x in linked_ids] if linked_ids else []
            })

        print(f"  Page {page}: {len(items)} items, {len(all_items)} with grade so far")

        if not new_cursor or not items:
            break
        cursor = new_cursor
        time.sleep(1.5)

    print(f"  Total BM Devices with grade: {len(all_items)}")
    return all_items


# ── Step 1.2: Follow to Main Board ─────────────────────────────────────
def pull_main_board_data(main_board_ids):
    print(f"Step 1.2: Pulling Main Board data for {len(main_board_ids)} items...")
    results = {}
    ids_list = list(main_board_ids)
    batch_size = 25

    for i in range(0, len(ids_list), batch_size):
        batch = ids_list[i:i+batch_size]
        ids_csv = ", ".join(batch)

        query = f'''{{
            items(ids: [{ids_csv}]) {{
                id
                column_values(ids: ["formula__1", "connect_boards__1"]) {{
                    id
                    text
                    ... on FormulaValue {{ display_value }}
                    ... on BoardRelationValue {{ linked_item_ids }}
                }}
            }}
        }}'''

        data = monday_query(query)
        if not data:
            print(f"  Failed batch at index {i}")
            continue

        for item in data.get("items", []):
            item_id = str(item["id"])

            formula_col = get_col(item, "formula__1")
            rrd_hours = None
            if formula_col:
                dv = formula_col.get("display_value") or formula_col.get("text", "")
                if dv:
                    try:
                        rrd_hours = float(str(dv).replace(",", ""))
                    except (ValueError, TypeError):
                        pass

            parts_col = get_col(item, "connect_boards__1")
            parts_ids = parts_col.get("linked_item_ids", []) if parts_col else []

            results[item_id] = {
                "rrd_hours": rrd_hours,
                "parts_item_ids": [str(x) for x in parts_ids] if parts_ids else []
            }

        bn = (i // batch_size) + 1
        tb = (len(ids_list) + batch_size - 1) // batch_size
        if bn % 5 == 0 or bn == tb:
            print(f"  Batch {bn}/{tb}")
        time.sleep(1.5)

    print(f"  Retrieved Main Board data for {len(results)} items")
    return results


# ── Step 1.3: Get parts from Parts Board ───────────────────────────────
def pull_parts_data(parts_ids):
    print(f"Step 1.3: Pulling parts data for {len(parts_ids)} part items...")
    results = {}
    ids_list = list(parts_ids)
    batch_size = 25

    for i in range(0, len(ids_list), batch_size):
        batch = ids_list[i:i+batch_size]
        ids_csv = ", ".join(batch)

        query = f'''{{
            items(ids: [{ids_csv}]) {{
                id
                name
                column_values(ids: ["supply_price"]) {{
                    id
                    text
                    ... on NumbersValue {{ number }}
                }}
            }}
        }}'''

        data = monday_query(query)
        if not data:
            continue

        for item in data.get("items", []):
            item_id = str(item["id"])
            name = item.get("name", "")

            price_col = get_col(item, "supply_price")
            supply_price = None
            if price_col:
                supply_price = price_col.get("number")
                if supply_price is None:
                    tv = price_col.get("text", "")
                    if tv:
                        try:
                            supply_price = float(tv.replace(",", "").replace("£", ""))
                        except (ValueError, TypeError):
                            pass

            results[item_id] = {"name": name, "supply_price": supply_price}

        bn = (i // batch_size) + 1
        tb = (len(ids_list) + batch_size - 1) // batch_size
        if bn % 10 == 0 or bn == tb:
            print(f"  Batch {bn}/{tb}")
        time.sleep(1.5)

    print(f"  Retrieved parts data for {len(results)} items")
    return results


# ── Step 1.4: Filter non-repair parts ──────────────────────────────────
def is_repair_part(name, supply_price):
    if supply_price is None or supply_price == 0:
        return False
    name_lower = name.lower()
    # Keep overrides first
    for keep in KEEP_OVERRIDE:
        if keep in name_lower:
            return True
    # Filter accessories
    for kw in ACCESSORY_KEYWORDS:
        if kw in name_lower:
            return False
    return True


def is_screen_part(name):
    nl = name.lower()
    if "screen bezel" in nl:
        return False
    return "lcd" in nl or "screen" in nl


def is_logic_board(name):
    nl = name.lower()
    return "logic" in nl or "board repair" in nl


# ── Main ────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("Buyback Parts Cost Data Pull (V3)")
    print(f"Date: {date.today()}")
    print("=" * 60)
    print()

    # Step 1.1
    bm_devices = pull_bm_devices()
    if not bm_devices:
        print("ERROR: No BM Devices found with Trade-in Grade")
        sys.exit(1)
    print()

    # Collect Main Board IDs
    all_main_ids = set()
    for dev in bm_devices:
        for mid in dev["main_board_item_ids"]:
            all_main_ids.add(mid)
    print(f"Unique Main Board items to query: {len(all_main_ids)}")

    # Step 1.2
    main_board_data = pull_main_board_data(all_main_ids) if all_main_ids else {}
    print()

    # Collect Parts IDs
    all_parts_ids = set()
    for mb in main_board_data.values():
        for pid in mb["parts_item_ids"]:
            all_parts_ids.add(pid)
    print(f"Unique Parts items to query: {len(all_parts_ids)}")

    # Step 1.3
    parts_data = pull_parts_data(all_parts_ids) if all_parts_ids else {}
    print()

    # Step 1.4 + 1.5: Assemble
    print("Step 1.4-1.5: Assembling device records with filtered parts...")
    devices = []
    matched_main = 0
    had_parts = 0

    for dev in bm_devices:
        rec = {
            "bm_item_id": dev["bm_item_id"],
            "bm_name": dev["bm_name"],
            "model": dev["model"],
            "trade_in_grade": dev["trade_in_grade"],
            "purchase_price": dev["purchase_price"],
            "sale_price": dev["sale_price"],
            "main_board_item_id": dev["main_board_item_ids"][0] if dev["main_board_item_ids"] else None,
            "rrd_hours": None,
            "parts": [],
            "total_parts_cost": 0,
            "parts_count": 0,
            "has_screen_part": False,
            "has_logic_board": False
        }

        if dev["main_board_item_ids"]:
            mb_id = dev["main_board_item_ids"][0]
            mb = main_board_data.get(mb_id)
            if mb:
                matched_main += 1
                rec["rrd_hours"] = mb["rrd_hours"]

                filtered = []
                for pid in mb["parts_item_ids"]:
                    part = parts_data.get(pid)
                    if not part:
                        continue
                    if not is_repair_part(part["name"], part["supply_price"]):
                        continue

                    pr = {
                        "name": part["name"],
                        "supply_price": part["supply_price"],
                        "is_screen": is_screen_part(part["name"])
                    }
                    filtered.append(pr)

                    if is_screen_part(part["name"]):
                        rec["has_screen_part"] = True
                    if is_logic_board(part["name"]):
                        rec["has_logic_board"] = True

                rec["parts"] = filtered
                rec["parts_count"] = len(filtered)
                rec["total_parts_cost"] = sum(p["supply_price"] for p in filtered if p["supply_price"])

                if filtered:
                    had_parts += 1

        devices.append(rec)

    # Save
    output = {
        "generated": str(date.today()),
        "total_devices": len(devices),
        "matched_to_main_board": matched_main,
        "had_parts_data": had_parts,
        "devices": devices
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)
    print(f"  Saved to {OUTPUT_PATH}")
    print()

    # ── Summary ─────────────────────────────────────────────────────
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total devices with grade: {len(devices)}")
    print(f"Matched to Main Board: {matched_main}")
    print(f"Had parts data: {had_parts}")
    print()

    grade_counts = Counter(d["trade_in_grade"] for d in devices)
    print("Grade Distribution:")
    for grade, count in grade_counts.most_common():
        print(f"  {grade}: {count}")
    print()

    model_counts = Counter(d["model"] for d in devices if d["model"])
    print("Model Distribution (top 10):")
    for model, count in model_counts.most_common(10):
        print(f"  {model}: {count}")
    print()

    print("Avg Parts Cost by Grade:")
    for grade in sorted(grade_counts.keys()):
        gd = [d for d in devices if d["trade_in_grade"] == grade and d["parts"]]
        if gd:
            avg_cost = sum(d["total_parts_cost"] for d in gd) / len(gd)
            avg_parts = sum(d["parts_count"] for d in gd) / len(gd)
            screen_pct = sum(1 for d in gd if d["has_screen_part"]) / len(gd) * 100
            print(f"  {grade}: avg £{avg_cost:.0f}, {avg_parts:.1f} parts, {screen_pct:.0f}% screen ({len(gd)} items)")
    print()
    print("Done!")


if __name__ == "__main__":
    main()
