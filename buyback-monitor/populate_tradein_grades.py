#!/usr/bin/env -S python3 -u
"""Populate Trade-in Grade column on BM Devices board from Google Sheet data."""

import json
import logging
import subprocess
import sys
import time

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("grades")

BOARD_ID = 3892194968
COLUMN_ID = "color_mm1fj7tb"  # Trade-in Grade status column
ORDER_ID_COL = "text_mkqy3576"
SHEET_ID = "1A7-NSlqFeCZmS73i2xO-NqlB2wD_lc53V6BxKGjNW2g"
ENV_PATH = "/home/ricky/config/api-keys/.env"

GRADE_MAP = {
    "STALLONE": "NONFUNC_CRACK",
    "BRONZE": "NONFUNC_USED", 
    "SILVER": "FUNC_CRACK",
    "GOLD": "FUNC_USED",
    "PLATINUM": "FUNC_GOOD",
    "DIAMOND": "FUNC_EXCELLENT",
}


def load_env(path=ENV_PATH):
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def monday_query(token, query):
    r = subprocess.run(
        ['curl', '-s', '-X', 'POST', 'https://api.monday.com/v2',
         '-H', f'Authorization: {token}', '-H', 'Content-Type: application/json',
         '-d', json.dumps({'query': query})],
        capture_output=True, text=True
    )
    return json.loads(r.stdout)


def main():
    env = load_env()
    token = env["MONDAY_APP_TOKEN"]

    # Step 1: Read Google Sheet for order_id -> grade mapping
    log.info("Reading Google Sheet...")
    resp = requests.post("https://oauth2.googleapis.com/token", data={
        "grant_type": "refresh_token",
        "refresh_token": env["JARVIS_GOOGLE_REFRESH_TOKEN"],
        "client_id": env["GOOGLE_CLIENT_ID"],
        "client_secret": env["GOOGLE_CLIENT_SECRET"],
    })
    access_token = resp.json()["access_token"]
    
    r = requests.get(
        f"https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/Sheet1!A:O",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    rows = r.json().get("values", [])
    
    # Build lookup: orderPublicId -> mapped grade
    # Col A (0) = orderPublicId, Col O (14) = listingGradeMapped
    # If col O doesn't exist, use col N (13) = listingGrade and map it
    order_grades = {}
    for row in rows[1:]:
        order_id = row[0] if len(row) > 0 else ""
        if len(row) > 14 and row[14]:
            grade = row[14]  # Already mapped
        elif len(row) > 13 and row[13]:
            grade = GRADE_MAP.get(row[13], row[13])
        else:
            continue
        if order_id:
            order_grades[order_id] = grade
    
    log.info(f"Loaded {len(order_grades)} order grades from sheet")

    # Step 2: Read all BM Devices items
    log.info("Reading BM Devices board...")
    all_items = []
    cursor = None
    for page in range(30):
        if cursor:
            q = f'{{ next_items_page(limit: 200, cursor: "{cursor}") {{ cursor items {{ id name column_values(ids: ["{ORDER_ID_COL}", "{COLUMN_ID}"]) {{ id text }} }} }} }}'
        else:
            q = f'{{ boards(ids: [{BOARD_ID}]) {{ items_page(limit: 200) {{ cursor items {{ id name column_values(ids: ["{ORDER_ID_COL}", "{COLUMN_ID}"]) {{ id text }} }} }} }} }}'
        
        data = monday_query(token, q)["data"]
        if cursor:
            page_data = data["next_items_page"]
        else:
            page_data = data["boards"][0]["items_page"]
        
        items = page_data["items"]
        all_items.extend(items)
        cursor = page_data.get("cursor")
        if not cursor or not items:
            break
        time.sleep(0.5)
    
    log.info(f"Loaded {len(all_items)} items from BM Devices board")

    # Step 3: Match and update
    matched = 0
    no_order_id = 0
    not_found = 0
    already_set = 0
    errors = 0

    for i, item in enumerate(all_items):
        cols = {cv["id"]: cv["text"] for cv in item["column_values"]}
        order_id = (cols.get(ORDER_ID_COL, "") or "").strip()
        current_grade = (cols.get(COLUMN_ID, "") or "").strip()

        if not order_id:
            no_order_id += 1
            continue

        grade = order_grades.get(order_id)
        if not grade:
            not_found += 1
            continue

        if current_grade == grade:
            already_set += 1
            continue

        # Write the grade - status columns need JSON value with "label" key
        value = json.dumps({"label": grade})
        mutation = f'mutation {{ change_column_value(board_id: {BOARD_ID}, item_id: {item["id"]}, column_id: "{COLUMN_ID}", value: {json.dumps(value)}) {{ id }} }}'
        
        try:
            result = monday_query(token, mutation)
            if "errors" in result:
                log.warning(f"  Error on {item['name']}: {result['errors'][0].get('message', '')[:80]}")
                errors += 1
            else:
                matched += 1
                if matched % 50 == 0:
                    log.info(f"  Updated {matched} items...")
        except Exception as e:
            log.error(f"  Exception on {item['name']}: {e}")
            errors += 1

        time.sleep(0.3)  # Rate limit

    log.info(f"\n=== Results ===")
    log.info(f"Total items: {len(all_items)}")
    log.info(f"Updated: {matched}")
    log.info(f"Already set: {already_set}")
    log.info(f"No Order ID: {no_order_id}")
    log.info(f"Order ID not in sheet: {not_found}")
    log.info(f"Errors: {errors}")


if __name__ == "__main__":
    main()
