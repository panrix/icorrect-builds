#!/usr/bin/env python3
"""Phase 1: Repair Analysis Data Collection

Pulls BM trade-in orders (CSV), Monday main board repair data, and BM board
financials. Joins on BM Trade-in ID and caches the complete dataset.

Usage:
    python3 bm-repair-analysis.py [--months N]

Output:
    audit/repair-analysis-data-YYYY-MM-DD.json
"""
import json, subprocess, csv, sys, time, os
from datetime import datetime, timedelta
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bm_utils import load_env

BASE = "/home/ricky/builds/backmarket"
ORDERS_CSV = "/tmp/bm-orders.csv"
AUDIT_DIR = f"{BASE}/audit"

# Monday column IDs — main board (349212843)
# Group A: status/text/date/number/color — queryable via { id text }
MAIN_COLS_A = [
    "status4",              # Status (39 values)
    "status24",             # Repair Type
    "status",               # Client (BM/Corporate/End User etc)
    "text_mky01vb4",        # BM Trade-in ID
    "text_mkydhq9n",        # BM Listing UUID
    "date4",                # Received
    "collection_date",      # Date Repaired
    "date_mkqgbbtp",        # Date Purchased (BM)
    "date_mkq34t04",        # Date Sold (BM)
    "date_mkq385pa",        # Date Listed (BM)
    "status_2_Mjj4GJNQ",   # Final Grade
    "color_mkwr7s1s",       # Ammeter Reading
    "numbers9",             # Batt Health
    # Reported vs Actual
    "color_mkqg66bx",       # Battery (Reported)
    "color_mkqg4zhy",       # Battery (Actual)
    "color_mkqg7pea",       # Screen (Reported)
    "color_mkqgtewd",       # Screen (Actual)
    "color_mkqg1c3h",       # Casing (Reported)
    "color_mkqga1mc",       # Casing (Actual)
    "color_mkqg578m",       # Function (Reported)
    "color_mkqgj96q",       # Function (Actual)
    "color_mkqg8ktb",       # Liquid Damage?
    # Grading
    "color_mkp5ykhf",       # LCD Pre-Grade
    "status_2_mkmc4tew",    # Lid Pre-Grade
    "status_2_mkmcj0tz",    # Top Case Pre-Grade
    # People (text gives names)
    "person",               # Technician
    "multiple_person_mkwqj321",  # Diagnostic (person)
    "multiple_person_mkwqy930",  # Repair (person)
    "multiple_person_mkwqsxse",  # Refurb (person)
]

# Group B: time tracking — needs TimeTrackingValue { duration }
MAIN_COLS_TIME = [
    "time_tracking",        # Diagnostic Time
    "time_tracking9",       # Repair Time
    "time_tracking93",      # Refurb Time
    "duration_mkyrykvn",    # Cleaning Time
    "time_tracking98",      # Total Time
]

# Column ID to friendly name map
COL_NAMES = {
    "status4": "status", "status24": "repair_type", "status": "client",
    "text_mky01vb4": "bm_tradein_id", "text_mkydhq9n": "bm_listing_uuid",
    "date4": "received", "collection_date": "date_repaired",
    "date_mkqgbbtp": "date_purchased_bm", "date_mkq34t04": "date_sold_bm",
    "date_mkq385pa": "date_listed_bm",
    "status_2_Mjj4GJNQ": "final_grade", "color_mkwr7s1s": "ammeter_reading",
    "numbers9": "batt_health",
    "color_mkqg66bx": "battery_reported", "color_mkqg4zhy": "battery_actual",
    "color_mkqg7pea": "screen_reported", "color_mkqgtewd": "screen_actual",
    "color_mkqg1c3h": "casing_reported", "color_mkqga1mc": "casing_actual",
    "color_mkqg578m": "function_reported", "color_mkqgj96q": "function_actual",
    "color_mkqg8ktb": "liquid_damage",
    "color_mkp5ykhf": "lcd_pregrade", "status_2_mkmc4tew": "lid_pregrade",
    "status_2_mkmcj0tz": "topcase_pregrade",
    "person": "technician",
    "multiple_person_mkwqj321": "diag_person",
    "multiple_person_mkwqy930": "repair_person",
    "multiple_person_mkwqsxse": "refurb_person",
    "time_tracking": "diag_time_secs", "time_tracking9": "repair_time_secs",
    "time_tracking93": "refurb_time_secs", "duration_mkyrykvn": "cleaning_time_secs",
    "time_tracking98": "total_time_secs",
}


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def mq(query, api_key, retries=3):
    """Monday GraphQL query with rate limit retry."""
    for attempt in range(retries):
        r = subprocess.run(
            ["curl", "-s", "-X", "POST", "https://api.monday.com/v2",
             "-H", "Content-Type: application/json",
             "-H", "Authorization: %s" % api_key,
             "-H", "API-Version: 2024-10",
             "-d", json.dumps({"query": query})],
            capture_output=True, text=True)
        try:
            data = json.loads(r.stdout)
            if "errors" in data and "rate" in str(data["errors"]).lower():
                log("  Rate limited, waiting 10s...")
                time.sleep(10)
                continue
            return data
        except json.JSONDecodeError:
            if attempt < retries - 1:
                time.sleep(2)
    return {"data": None}


def extract_grade(sku):
    """Extract listing grade from SKU: last two dot-separated segments."""
    if not sku:
        return "UNKNOWN"
    parts = sku.split(".")
    if len(parts) >= 2:
        grade = parts[-2] + "." + parts[-1]
        if grade in ("NONFUNC.USED", "NONFUNC.CRACK", "FUNC.CRACK"):
            return grade
    return "UNKNOWN"


def paginate_board(board_id, col_ids, api_key, fragment="{ id text }"):
    """Pull all items from a Monday board with pagination."""
    all_items = []
    cursor = None
    page = 0
    col_str = '", "'.join(col_ids)

    while True:
        if cursor:
            q = '{ next_items_page(limit: 100, cursor: "%s") { cursor items { id name column_values(ids: ["%s"]) %s } } }' % (cursor, col_str, fragment)
        else:
            q = '{ boards(ids: [%s]) { items_page(limit: 100) { cursor items { id name column_values(ids: ["%s"]) %s } } } }' % (board_id, col_str, fragment)

        r = mq(q, api_key)
        if cursor:
            page_data = r.get("data", {}).get("next_items_page", {})
        else:
            boards = r.get("data", {}).get("boards", [{}])
            page_data = boards[0].get("items_page", {}) if boards else {}

        items = page_data.get("items", [])
        if not items:
            break

        all_items.extend(items)
        cursor = page_data.get("cursor")
        page += 1
        log("  Page %d: %d items (total: %d)" % (page, len(items), len(all_items)))

        if not cursor:
            break

    return all_items


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Phase 1: Repair Analysis Data Collection")
    parser.add_argument("--months", type=int, default=6, help="Months of BM order data to include (default: 6)")
    args = parser.parse_args()

    env = load_env()
    api_key = env.get("MONDAY_APP_TOKEN", "")
    if not api_key:
        log("ERROR: MONDAY_APP_TOKEN not found in env")
        sys.exit(1)

    cutoff = (datetime.now() - timedelta(days=args.months * 30)).strftime("%Y-%m-%d")
    log("=== REPAIR ANALYSIS DATA COLLECTION ===")
    log("Cutoff: %s (%d months)" % (cutoff, args.months))
    log("")

    # ================================================================
    # STEP 1: Load BM orders CSV (ALL statuses)
    # ================================================================
    log("STEP 1: Loading BM orders CSV...")
    if not os.path.exists(ORDERS_CSV):
        log("ERROR: %s not found. Export from BM dashboard first." % ORDERS_CSV)
        sys.exit(1)

    with open(ORDERS_CSV) as f:
        all_orders = list(csv.DictReader(f))

    # Filter by date
    orders = [o for o in all_orders if (o.get("creationDate", "") or "")[:10] >= cutoff]
    orders_by_id = {o["orderPublicId"]: o for o in orders}

    by_status = defaultdict(int)
    for o in orders:
        by_status[o["status"]] += 1

    log("  Total orders in CSV: %d" % len(all_orders))
    log("  After %d-month filter: %d" % (args.months, len(orders)))
    for s in sorted(by_status.keys()):
        log("    %s: %d" % (s, by_status[s]))
    log("")

    # ================================================================
    # STEP 2: Pull BM board (3892194968) — financials + order_id
    # ================================================================
    log("STEP 2: Pulling BM board (financials + order IDs)...")
    bm_board_cols = ["text_mkqy3576", "numeric5", "numeric", "text89"]
    bm_items_raw = paginate_board("3892194968", bm_board_cols, api_key)

    bm_items = {}
    for item in bm_items_raw:
        entry = {"bm_board_id": item["id"], "bm_name": item["name"],
                 "order_id": "", "sale": 0, "purchase": 0, "sku": ""}
        for cv in item["column_values"]:
            val = (cv.get("text") or "").strip()
            if cv["id"] == "text_mkqy3576":
                entry["order_id"] = val
            elif cv["id"] == "numeric5":
                try: entry["sale"] = float(val) if val else 0
                except: pass
            elif cv["id"] == "numeric":
                try: entry["purchase"] = float(val) if val else 0
                except: pass
            elif cv["id"] == "text89":
                entry["sku"] = val
        if entry["order_id"]:
            bm_items[entry["order_id"]] = entry

    log("  BM board items: %d total, %d with order ID" % (len(bm_items_raw), len(bm_items)))
    log("")

    # ================================================================
    # STEP 3: Pull BM board — board_relation to Main Board
    # ================================================================
    log("STEP 3: Getting Main Board links from BM board...")
    bm_links_raw = paginate_board(
        "3892194968", ["board_relation"],
        api_key, fragment="{ id ... on BoardRelationValue { linked_item_ids } }")

    main_links = {}  # bm_board_id -> main_board_id
    for item in bm_links_raw:
        for cv in item.get("column_values", []):
            ids = cv.get("linked_item_ids", [])
            if ids:
                main_links[item["id"]] = ids[0]

    log("  Items with Main Board link: %d" % len(main_links))
    log("")

    # Map order_id -> main_board_id via BM board
    order_to_main = {}
    for order_id, bm_entry in bm_items.items():
        main_id = main_links.get(bm_entry["bm_board_id"])
        if main_id:
            order_to_main[order_id] = main_id

    log("  Orders with Main Board link: %d / %d" % (len(order_to_main), len(bm_items)))
    log("")

    # ================================================================
    # STEP 4: Pull Main Board items — repair data (batched by ID)
    # ================================================================
    all_main_ids = list(set(order_to_main.values()))
    log("STEP 4: Pulling repair data for %d Main Board items..." % len(all_main_ids))

    main_data = {}  # main_id -> {field: value}

    # Query A: text/status/date/number/color/person columns
    log("  Query A: status/text/date/condition/person columns (%d cols)..." % len(MAIN_COLS_A))
    col_str_a = '", "'.join(MAIN_COLS_A)
    for i in range(0, len(all_main_ids), 25):
        batch = all_main_ids[i:i+25]
        ids_str = ", ".join(batch)
        q = '{ items(ids: [%s]) { id name group { title } column_values(ids: ["%s"]) { id text } } }' % (ids_str, col_str_a)
        r = mq(q, api_key)

        for item in r.get("data", {}).get("items", []):
            entry = {"main_id": item["id"], "item_name": item["name"],
                     "group": item.get("group", {}).get("title", "")}
            for cv in item.get("column_values", []):
                fname = COL_NAMES.get(cv["id"], cv["id"])
                entry[fname] = (cv.get("text") or "").strip()
            main_data[item["id"]] = entry

        if (i // 25) % 5 == 0 and i > 0:
            log("    Batch %d/%d (%d items)" % (i // 25, len(all_main_ids) // 25 + 1, len(main_data)))

    log("    Got data for %d items" % len(main_data))

    # Query B: time tracking columns
    log("  Query B: time tracking columns...")
    col_str_t = '", "'.join(MAIN_COLS_TIME)
    for i in range(0, len(all_main_ids), 25):
        batch = all_main_ids[i:i+25]
        ids_str = ", ".join(batch)
        q = '{ items(ids: [%s]) { id column_values(ids: ["%s"]) { id ... on TimeTrackingValue { duration } } } }' % (ids_str, col_str_t)
        r = mq(q, api_key)

        for item in r.get("data", {}).get("items", []):
            mid = item["id"]
            if mid not in main_data:
                main_data[mid] = {"main_id": mid}
            for cv in item.get("column_values", []):
                fname = COL_NAMES.get(cv["id"], cv["id"])
                dur = cv.get("duration") or 0
                main_data[mid][fname] = dur

    log("    Time tracking loaded")

    # Query C: Parts Used board relation + RR&D formula
    log("  Query C: Parts Used (board relation) + RR&D (formula)...")
    all_part_ids = set()
    for i in range(0, len(all_main_ids), 25):
        batch = all_main_ids[i:i+25]
        ids_str = ", ".join(batch)
        q = '{ items(ids: [%s]) { id column_values(ids: ["connect_boards__1", "formula__1"]) { id ... on BoardRelationValue { linked_item_ids } ... on FormulaValue { display_value } } } }' % ids_str
        r = mq(q, api_key)

        for item in r.get("data", {}).get("items", []):
            mid = item["id"]
            if mid not in main_data:
                main_data[mid] = {"main_id": mid}
            for cv in item.get("column_values", []):
                if cv["id"] == "connect_boards__1":
                    linked = cv.get("linked_item_ids", [])
                    main_data[mid]["parts_used_ids"] = linked
                    all_part_ids.update(linked)
                elif cv["id"] == "formula__1":
                    dv = (cv.get("display_value") or "").strip()
                    try:
                        main_data[mid]["rrd_hours"] = float(dv) if dv and dv not in ("null", "") else 0
                    except ValueError:
                        main_data[mid]["rrd_hours"] = 0

    log("    %d unique part IDs found across all items" % len(all_part_ids))

    # ================================================================
    # STEP 5: Resolve part IDs to names from Parts board
    # ================================================================
    log("STEP 5: Resolving %d part IDs to names..." % len(all_part_ids))
    part_names = {}  # part_id -> name
    part_ids_list = list(all_part_ids)

    for i in range(0, len(part_ids_list), 50):
        batch = part_ids_list[i:i+50]
        ids_str = ", ".join(batch)
        q = '{ items(ids: [%s]) { id name } }' % ids_str
        r = mq(q, api_key)

        for item in r.get("data", {}).get("items", []):
            part_names[item["id"]] = item["name"]

    log("  Resolved %d part names" % len(part_names))

    # STEP 5b: Get supply_price for each part
    log("  Getting supply_price for %d parts..." % len(all_part_ids))
    part_prices = {}  # part_id -> price
    for i in range(0, len(part_ids_list), 50):
        batch = part_ids_list[i:i+50]
        ids_str = ", ".join(batch)
        q = '{ items(ids: [%s]) { id column_values(ids: ["supply_price"]) { id text } } }' % ids_str
        r = mq(q, api_key)

        for item in r.get("data", {}).get("items", []):
            for cv in item.get("column_values", []):
                val = (cv.get("text") or "").replace(",", "").replace("\u00a3", "").strip()
                if val and val not in ("None", "null", ""):
                    try:
                        part_prices[item["id"]] = float(val)
                    except ValueError:
                        pass

        if (i // 50) % 5 == 0 and i > 0:
            log("    Batch %d/%d" % (i // 50, len(part_ids_list) // 50 + 1))

    log("  Parts with prices: %d / %d" % (len(part_prices), len(all_part_ids)))
    log("")

    # Map part IDs to names and prices in main_data
    for mid, data in main_data.items():
        pids = data.get("parts_used_ids", [])
        data["parts_used"] = [part_names.get(pid, "Unknown-%s" % pid) for pid in pids]
        data["parts_cost"] = sum(part_prices.get(pid, 0) for pid in pids)

    # ================================================================
    # STEP 6: Pull BM fee + tax from BM board (formula columns)
    # ================================================================
    log("STEP 6: Getting BM fee + tax from BM board...")
    fee_items = paginate_board(
        "3892194968", ["formula", "formula7"],
        api_key, fragment='{ id ... on FormulaValue { display_value } }')

    fees = {}  # bm_board_id -> {bm_fee, tax}
    for item in fee_items:
        fee = 0
        tax = 0
        for cv in item.get("column_values", []):
            val = (cv.get("display_value") or "0").replace(",", "").replace("£", "").strip()
            try:
                v = float(val)
            except:
                v = 0
            if cv["id"] == "formula":
                fee = v
            elif cv["id"] == "formula7":
                tax = v
        fees[item["id"]] = {"bm_fee": fee, "tax": tax}

    log("  Fees for %d items" % len(fees))
    log("")

    # ================================================================
    # STEP 7: Join everything
    # ================================================================
    log("STEP 7: Joining data sources...")
    results = []
    matched = 0
    no_bm_board = 0
    no_main_board = 0
    no_main_data = 0

    for order_id, order in orders_by_id.items():
        record = {
            # BM order data
            "order_id": order_id,
            "bm_status": order.get("status", ""),
            "bm_grade": order.get("listingGrade", ""),
            "listing_sku": order.get("listingSku", ""),
            "listing_grade": extract_grade(order.get("listingSku", "")),
            "device_title": order.get("listingTitle", ""),
            "bm_offer": 0,
            "counter_offer": 0,
            "counter_reasons": order.get("counterOfferReasons", ""),
            "suspend_reasons": order.get("suspendReasons", ""),
            "order_created": (order.get("creationDate") or "")[:10],
            "order_shipped": (order.get("shippingDate") or "")[:10],
            "order_received": (order.get("receivalDate") or "")[:10],
            "order_paid": (order.get("paymentDate") or "")[:10],
        }

        try:
            record["bm_offer"] = float(order.get("originalPriceValue", 0) or 0)
        except:
            pass
        try:
            record["counter_offer"] = float(order.get("counterOfferPriceValue", 0) or 0)
        except:
            pass

        # BM board match
        bm = bm_items.get(order_id)
        if bm:
            record["bm_name"] = bm["bm_name"]
            record["bm_board_id"] = bm["bm_board_id"]
            record["monday_sku"] = bm["sku"]
            record["sale_price"] = bm["sale"]
            record["purchase_price"] = bm["purchase"]

            # Fee data
            fee_data = fees.get(bm["bm_board_id"], {})
            record["bm_fee"] = fee_data.get("bm_fee", 0)
            record["tax"] = fee_data.get("tax", 0)

            # Main board match
            main_id = order_to_main.get(order_id)
            if main_id and main_id in main_data:
                matched += 1
                md = main_data[main_id]
                record["main_board_id"] = main_id
                record["item_name"] = md.get("item_name", "")
                record["group"] = md.get("group", "")

                # Repair data
                record["status"] = md.get("status", "")
                record["repair_type"] = md.get("repair_type", "")
                record["client"] = md.get("client", "")
                record["technician"] = md.get("technician", "")
                record["diag_person"] = md.get("diag_person", "")
                record["repair_person"] = md.get("repair_person", "")
                record["refurb_person"] = md.get("refurb_person", "")

                # Dates
                record["received"] = md.get("received", "")
                record["date_repaired"] = md.get("date_repaired", "")
                record["date_purchased_bm"] = md.get("date_purchased_bm", "")
                record["date_sold_bm"] = md.get("date_sold_bm", "")
                record["date_listed_bm"] = md.get("date_listed_bm", "")

                # Condition — reported vs actual
                record["battery_reported"] = md.get("battery_reported", "")
                record["battery_actual"] = md.get("battery_actual", "")
                record["screen_reported"] = md.get("screen_reported", "")
                record["screen_actual"] = md.get("screen_actual", "")
                record["casing_reported"] = md.get("casing_reported", "")
                record["casing_actual"] = md.get("casing_actual", "")
                record["function_reported"] = md.get("function_reported", "")
                record["function_actual"] = md.get("function_actual", "")
                record["liquid_damage"] = md.get("liquid_damage", "")

                # Grading
                record["final_grade"] = md.get("final_grade", "")
                record["lcd_pregrade"] = md.get("lcd_pregrade", "")
                record["lid_pregrade"] = md.get("lid_pregrade", "")
                record["topcase_pregrade"] = md.get("topcase_pregrade", "")
                record["ammeter_reading"] = md.get("ammeter_reading", "")
                record["batt_health"] = md.get("batt_health", "")

                # Time tracking (seconds)
                record["diag_time_secs"] = md.get("diag_time_secs", 0)
                record["repair_time_secs"] = md.get("repair_time_secs", 0)
                record["refurb_time_secs"] = md.get("refurb_time_secs", 0)
                record["cleaning_time_secs"] = md.get("cleaning_time_secs", 0)
                record["total_time_secs"] = md.get("total_time_secs", 0)

                # Parts
                record["parts_used"] = md.get("parts_used", [])
                record["parts_used_ids"] = md.get("parts_used_ids", [])
                record["parts_cost"] = round(md.get("parts_cost", 0), 2)

                # Labour from RR&D formula (hours * £15/hr)
                rrd_hours = md.get("rrd_hours", 0) or 0
                labour = rrd_hours * 15
                record["labour"] = round(labour, 2)
                record["rrd_hours"] = rrd_hours

                # Net calculation: sale - purchase - bm_fee - tax - parts - labour - shipping
                sale = record.get("sale_price", 0) or 0
                purchase = record.get("purchase_price", 0) or 0
                bm_fee = record.get("bm_fee", 0) or 0
                tax = record.get("tax", 0) or 0
                parts_cost = record.get("parts_cost", 0) or 0
                shipping = 15 if sale > 0 else 0
                record["shipping"] = shipping

                if sale > 0:
                    record["net"] = round(sale - purchase - bm_fee - tax - parts_cost - labour - shipping, 2)
                else:
                    record["net"] = None

            elif main_id:
                no_main_data += 1
                record["main_board_id"] = main_id
            else:
                no_main_board += 1
        else:
            no_bm_board += 1

        results.append(record)

    log("  Total orders: %d" % len(results))
    log("  Fully matched (BM + Main Board): %d" % matched)
    log("  No BM board match: %d" % no_bm_board)
    log("  No Main Board link: %d" % no_main_board)
    log("  Main Board link but no data: %d" % no_main_data)
    log("")

    # ================================================================
    # STEP 8: Summary stats
    # ================================================================
    # By BM status
    by_bm_status = defaultdict(int)
    for r in results:
        by_bm_status[r["bm_status"]] += 1

    # By listing grade
    by_grade = defaultdict(int)
    for r in results:
        by_grade[r["listing_grade"]] += 1

    # Matched items by Monday status
    by_monday_status = defaultdict(int)
    for r in results:
        if r.get("status"):
            by_monday_status[r["status"]] += 1

    # By tech
    by_tech = defaultdict(int)
    for r in results:
        tech = r.get("technician", "")
        if tech:
            by_tech[tech] += 1

    # Items with parts
    has_parts = sum(1 for r in results if r.get("parts_used"))
    has_logic_board = sum(1 for r in results
                         if any("logic" in p.lower() or "board" in p.lower()
                                for p in r.get("parts_used", [])))

    # Sold vs stuck
    sold = [r for r in results if r.get("sale_price") and r["sale_price"] > 0]
    stuck = [r for r in results
             if r.get("main_board_id")
             and (not r.get("sale_price") or r["sale_price"] == 0)
             and r.get("bm_status") in ("RECEIVED", "MONEY_TRANSFERED", "PAID")]

    print()
    print("=" * 80)
    print("REPAIR ANALYSIS — DATA COLLECTION SUMMARY")
    print("=" * 80)
    print()
    print("BM Orders (%d-month window from %s):" % (args.months, cutoff))
    for s in sorted(by_bm_status.keys()):
        print("  %-25s %d" % (s, by_bm_status[s]))
    print()
    print("By Listing Grade:")
    for g in ["NONFUNC.USED", "NONFUNC.CRACK", "FUNC.CRACK", "UNKNOWN"]:
        if g in by_grade:
            print("  %-20s %d" % (g, by_grade[g]))
    print()
    print("Matched to Main Board: %d / %d" % (matched, len(results)))
    print()
    print("Monday Status (matched items):")
    for s, c in sorted(by_monday_status.items(), key=lambda x: -x[1])[:15]:
        print("  %-30s %d" % (s, c))
    print()
    print("By Technician:")
    for t, c in sorted(by_tech.items(), key=lambda x: -x[1]):
        print("  %-25s %d" % (t, c))
    print()
    print("Parts Data:")
    print("  Items with parts logged: %d" % has_parts)
    print("  Items with logic board:  %d" % has_logic_board)
    print()
    print("Pipeline:")
    print("  Sold (sale price > 0): %d" % len(sold))
    print("  Stuck (on board, no sale): %d" % len(stuck))
    if stuck:
        stuck_capital = sum(r.get("purchase_price", 0) or 0 for r in stuck)
        print("  Capital tied up (stuck): £%.0f" % stuck_capital)
    print()

    # ================================================================
    # STEP 9: Save to JSON
    # ================================================================
    os.makedirs(AUDIT_DIR, exist_ok=True)
    out_path = "%s/repair-analysis-data-%s.json" % (AUDIT_DIR, datetime.now().strftime("%Y-%m-%d"))
    with open(out_path, "w") as f:
        json.dump({
            "generated": datetime.now().isoformat(),
            "config": {"months": args.months, "cutoff": cutoff},
            "summary": {
                "total_orders": len(results),
                "matched": matched,
                "no_bm_board": no_bm_board,
                "no_main_board": no_main_board,
                "by_bm_status": dict(by_bm_status),
                "by_listing_grade": dict(by_grade),
                "by_monday_status": dict(by_monday_status),
                "by_tech": dict(by_tech),
                "has_parts": has_parts,
                "has_logic_board": has_logic_board,
                "sold": len(sold),
                "stuck": len(stuck),
            },
            "devices": results,
        }, f, indent=2)

    print("Data saved to: %s" % out_path)
    print("Records: %d" % len(results))
    print()
    log("Done.")


if __name__ == "__main__":
    main()
