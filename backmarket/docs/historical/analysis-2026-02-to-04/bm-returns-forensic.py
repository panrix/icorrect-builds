#!/usr/bin/env python3
"""Forensic Returns Investigation — Per-Device Analysis

Matches BM returns CSV to repair chain data, pulls Monday item updates,
builds per-device forensic profiles with auto-flags and root cause classification.

Usage:
    python3 bm-returns-forensic.py
    python3 bm-returns-forensic.py --skip-updates   # use cached data only, no Monday API

Output:
    audit/returns-forensic-2026-03-03.json
    audit/returns-forensic-2026-03-03.md
"""
import json, sys, os, time, re
from datetime import datetime, timedelta
from collections import defaultdict, Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bm_utils import load_env

BASE = "/home/ricky/builds/backmarket"
AUDIT_DIR = f"{BASE}/audit"
CSV_PATH = f"{BASE}/docs/Backmarket_Returns_0303.csv"
REPAIR_DATA_PATH = f"{AUDIT_DIR}/repair-analysis-data-2026-03-02.json"
MAIN_BOARD_ID = "349212843"
BM_BOARD_ID = "3892194968"

TODAY = datetime.now().strftime("%Y-%m-%d")


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def mq(query, api_key, retries=3):
    """Monday GraphQL query with rate limit retry."""
    import subprocess
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


# ================================================================
# STEP 1: Parse BM Returns CSV
# ================================================================

def parse_returns_csv(path):
    """Parse UTF-16 tab-separated BM returns CSV.
    Groups rows by Order ID, combines complaint categories.
    Returns list of unique returns.
    """
    with open(path, "r", encoding="utf-16") as f:
        raw = f.read()

    lines = raw.strip().split("\n")
    # Skip header rows (first 2 lines: URL row + column headers)
    header_line = None
    data_lines = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue
        # Find the header line with "Date Shipped"
        if "Date Shipped" in stripped and header_line is None:
            header_line = i
            continue
        if header_line is not None and i > header_line:
            data_lines.append(stripped)

    orders = {}
    for line in data_lines:
        cols = line.split("\t")
        if len(cols) < 5:
            continue

        date_shipped = cols[0].strip()
        order_id = cols[1].strip()
        model = cols[2].strip()
        grade = cols[3].strip()
        complaint = cols[4].strip()
        tracking = cols[5].strip() if len(cols) > 5 else ""
        date_delivery = cols[6].strip() if len(cols) > 6 else ""

        if not order_id:
            continue

        if order_id not in orders:
            orders[order_id] = {
                "order_id": order_id,
                "date_shipped": date_shipped,
                "model": model,
                "grade": grade,
                "complaints": [],
                "tracking_numbers": set(),
                "date_delivery": date_delivery,
            }

        if complaint and complaint not in orders[order_id]["complaints"]:
            orders[order_id]["complaints"].append(complaint)
        if tracking:
            orders[order_id]["tracking_numbers"].add(tracking)

    # Convert sets to lists
    for o in orders.values():
        o["tracking_numbers"] = list(o["tracking_numbers"])

    return list(orders.values())


def parse_date(s, fmts=None):
    """Try multiple date formats. Returns date or None."""
    if not s:
        return None
    fmts = fmts or ["%d/%m/%Y", "%Y-%m-%d", "%d/%m/%y"]
    for fmt in fmts:
        try:
            return datetime.strptime(s.strip(), fmt).date()
        except (ValueError, AttributeError):
            continue
    return None


# ================================================================
# STEP 2: Match returns to repair data
# ================================================================

def extract_model_type(text):
    """Extract model type (Air/Pro) and size hint from text."""
    text_lower = text.lower()
    is_air = "air" in text_lower
    is_pro = "pro" in text_lower
    size = ""
    if '14"' in text or "14\"" in text or "14-inch" in text_lower:
        size = "14"
    elif '16"' in text or "16\"" in text or "16-inch" in text_lower:
        size = "16"
    elif '13"' in text or "13\"" in text or "13-inch" in text_lower:
        size = "13"
    elif '15"' in text or "15\"" in text or "15-inch" in text_lower:
        size = "15"
    return ("Air" if is_air else "Pro" if is_pro else "Unknown", size)


def match_returns_to_devices(returns, devices):
    """Match CSV returns to repair chain devices by date + model type.

    CSV has sale-side order IDs, repair data has trade-in order IDs.
    Match by: date_sold_bm ±3 days + model type (Air/Pro).
    """
    # Build lookup: only devices that were sold
    sold_devices = []
    for d in devices:
        sold_date_str = d.get("date_sold_bm") or d.get("date_listed_bm")
        if not sold_date_str:
            continue
        sold_date = parse_date(sold_date_str)
        if not sold_date:
            continue
        title = d.get("device_title", "") or d.get("item_name", "")
        sku = d.get("listing_sku", "")
        model_type, size = extract_model_type(title + " " + sku)
        sold_devices.append({
            "device": d,
            "sold_date": sold_date,
            "model_type": model_type,
            "size": size,
        })

    matches = []
    unmatched = []
    used_device_ids = set()  # track to handle repeats

    for ret in returns:
        ship_date = parse_date(ret["date_shipped"])
        if not ship_date:
            unmatched.append(ret)
            continue

        ret_model_type, ret_size = extract_model_type(ret["model"])

        # Find candidates: model match + date within ±3 days
        candidates = []
        for sd in sold_devices:
            if sd["model_type"] != ret_model_type:
                continue
            diff = abs((ship_date - sd["sold_date"]).days)
            if diff <= 3:
                candidates.append((diff, sd))

        # Sort by date proximity
        candidates.sort(key=lambda x: x[0])

        matched = False
        for diff, sd in candidates:
            device_id = sd["device"].get("main_board_id", "")
            # Allow same device to match multiple returns (repeat returns)
            confidence = "high" if diff == 0 else "medium" if diff <= 1 else "low"
            matches.append({
                "return": ret,
                "device": sd["device"],
                "match_confidence": confidence,
                "date_diff_days": diff,
            })
            if device_id not in used_device_ids:
                used_device_ids.add(device_id)
            matched = True
            break  # best match

        if not matched:
            unmatched.append(ret)

    return matches, unmatched


# ================================================================
# STEP 3: Pull Monday item updates
# ================================================================

def pull_serial_numbers(item_ids, api_key):
    """Pull serial numbers from main board column text4. Batch by 25."""
    serials = {}
    total = len(item_ids)

    for i in range(0, total, 25):
        batch = item_ids[i:i + 25]
        ids_str = ", ".join(batch)
        q = '{ items(ids: [%s]) { id column_values(ids: ["text4"]) { id text } } }' % ids_str
        r = mq(q, api_key)

        items_data = r.get("data", {}) or {}
        for item in items_data.get("items", []):
            mid = item["id"]
            for cv in item.get("column_values", []):
                if cv.get("id") == "text4":
                    serial = (cv.get("text") or "").strip()
                    if serial:
                        serials[mid] = serial
                    break

        done = min(i + 25, total)
        log("    Serials pulled: %d/%d items" % (done, total))
        time.sleep(0.5)

    return serials


def resolve_unmatched_via_serial(unmatched_returns, devices, api_key):
    """Try to match unmatched returns by querying BM board for sale order ID → serial → main board.

    Flow: BM sale order ID (from CSV) → BM board item → mirror7__1 (serial) → main board text4 match.
    Returns: (newly_matched, still_unmatched)
    """
    if not unmatched_returns:
        return [], []

    order_ids = [r["order_id"] for r in unmatched_returns]
    log("  Querying BM board for %d unmatched order IDs..." % len(order_ids))

    # Query BM board for items with these sale order IDs
    # text_mkye7p1c = sale order ID, mirror7__1 = mirrored serial from main board
    bm_serials = {}  # order_id -> serial
    bm_to_main = {}  # order_id -> linked main board item IDs

    for oid in order_ids:
        # Search BM board for this sale order ID
        q = '{ boards(ids: [%s]) { items_page(limit: 10, query_params: {rules: [{column_id: "text_mkye7p1c", compare_value: ["%s"]}]}) { items { id name column_values(ids: ["mirror7__1"]) { id text } linked_items(linked_board_id: %s, limit: 5) { id } } } } }' % (
            BM_BOARD_ID, oid, MAIN_BOARD_ID)
        r = mq(q, api_key)
        time.sleep(0.5)

        boards = r.get("data", {}).get("boards", [{}])
        page = boards[0].get("items_page", {}) if boards else {}
        items = page.get("items", [])

        for item in items:
            serial = ""
            for cv in item.get("column_values", []):
                if cv.get("id") == "mirror7__1":
                    serial = (cv.get("text") or "").strip()
                    break

            linked = [li["id"] for li in item.get("linked_items", [])]

            if serial:
                bm_serials[oid] = serial
                log("    Order %s → BM item %s → serial %s" % (oid, item["id"], serial))
            if linked:
                bm_to_main[oid] = linked
                log("    Order %s → linked main board items: %s" % (oid, linked))

    if not bm_serials and not bm_to_main:
        log("  No serials or links found for unmatched returns")
        return [], unmatched_returns

    # Build serial → device lookup from ALL devices with main_board_id
    # First pull serials for all sold devices
    all_sold_ids = [d.get("main_board_id", "") for d in devices
                    if d.get("main_board_id") and (d.get("date_sold_bm") or d.get("date_listed_bm"))]

    log("  Pulling serials for %d sold devices to find matches..." % len(all_sold_ids))
    all_serials = pull_serial_numbers(all_sold_ids, api_key)
    serial_to_device = {}
    for d in devices:
        mid = d.get("main_board_id", "")
        serial = all_serials.get(mid, "")
        if serial:
            serial_to_device[serial] = d

    # Also try matching via linked items (direct board links)
    main_id_to_device = {d.get("main_board_id", ""): d for d in devices if d.get("main_board_id")}

    newly_matched = []
    still_unmatched = []

    for ret in unmatched_returns:
        oid = ret["order_id"]
        matched_device = None
        match_method = ""

        # Try serial match first
        serial = bm_serials.get(oid, "")
        if serial and serial in serial_to_device:
            matched_device = serial_to_device[serial]
            match_method = "serial"

        # Try linked item match
        if not matched_device and oid in bm_to_main:
            for linked_id in bm_to_main[oid]:
                if linked_id in main_id_to_device:
                    matched_device = main_id_to_device[linked_id]
                    match_method = "board_link"
                    break

        if matched_device:
            log("    MATCHED: Order %s → %s (via %s, serial %s)" % (
                oid, matched_device.get("bm_name", "?"), match_method, serial))
            newly_matched.append({
                "return": ret,
                "device": matched_device,
                "match_confidence": "serial",
                "date_diff_days": None,
            })
        else:
            log("    UNMATCHED: Order %s (serial %s — not found in repair data)" % (oid, serial))
            still_unmatched.append(ret)

    return newly_matched, still_unmatched


def pull_item_updates(item_ids, api_key):
    """Pull updates AND replies for Monday item IDs. Batch by 5."""
    updates = {}
    total = len(item_ids)

    for i in range(0, total, 5):
        batch = item_ids[i:i + 5]
        ids_str = ", ".join(batch)
        q = '{ items(ids: [%s]) { id updates(limit: 100) { text_body created_at creator { name } replies { text_body created_at creator { name } } } } }' % ids_str
        r = mq(q, api_key)

        items_data = r.get("data", {}) or {}
        for item in items_data.get("items", []):
            mid = item["id"]
            item_updates = []
            for u in item.get("updates", []):
                item_updates.append({
                    "text": u.get("text_body", ""),
                    "created_at": u.get("created_at", ""),
                    "creator": u.get("creator", {}).get("name", ""),
                    "is_reply": False,
                })
                for reply in u.get("replies", []):
                    item_updates.append({
                        "text": reply.get("text_body", ""),
                        "created_at": reply.get("created_at", ""),
                        "creator": reply.get("creator", {}).get("name", ""),
                        "is_reply": True,
                    })
            updates[mid] = item_updates

        done = min(i + 5, total)
        log("    Updates pulled: %d/%d items" % (done, total))
        time.sleep(0.5)

    return updates


# ================================================================
# STEP 4: Build per-device forensic profiles
# ================================================================

def build_forensic_profile(match, monday_notes, serial_number=""):
    """Build a forensic profile for a single matched return."""
    d = match["device"]
    ret = match["return"]

    bm_name = d.get("bm_name", d.get("item_name", ""))
    device_title = d.get("device_title", "")
    sku = d.get("listing_sku", "")

    # Short device description from SKU
    device_short = sku.split(".")[0] if sku else device_title[:40]

    # Financials
    purchase_price = d.get("purchase_price", 0) or 0
    sale_price = d.get("sale_price", 0) or 0
    parts_cost = d.get("parts_cost", 0) or 0
    labour = d.get("labour", 0) or 0
    bm_fee = d.get("bm_fee", 0) or 0
    tax = d.get("tax", 0) or 0
    shipping = d.get("shipping", 0) or 0
    net = d.get("net")

    # Condition at intake
    condition = {
        "battery": {
            "reported": d.get("battery_reported", ""),
            "actual": d.get("battery_actual", ""),
            "match": (d.get("battery_reported", "") == d.get("battery_actual", "")) if d.get("battery_reported") else None,
        },
        "screen": {
            "reported": d.get("screen_reported", ""),
            "actual": d.get("screen_actual", ""),
            "match": (d.get("screen_reported", "") == d.get("screen_actual", "")) if d.get("screen_reported") else None,
        },
        "casing": {
            "reported": d.get("casing_reported", ""),
            "actual": d.get("casing_actual", ""),
            "match": (d.get("casing_reported", "") == d.get("casing_actual", "")) if d.get("casing_reported") else None,
        },
        "function": {
            "reported": d.get("function_reported", ""),
            "actual": d.get("function_actual", ""),
            "match": (d.get("function_reported", "") == d.get("function_actual", "")) if d.get("function_reported") else None,
        },
        "liquid_damage": d.get("liquid_damage", ""),
        "ammeter_reading": d.get("ammeter_reading", ""),
    }

    # Repair chain
    diag_time = d.get("diag_time_secs", 0) or 0
    repair_time = d.get("repair_time_secs", 0) or 0
    refurb_time = d.get("refurb_time_secs", 0) or 0
    cleaning_time = d.get("cleaning_time_secs", 0) or 0

    diag_person = d.get("diag_person", "")
    repair_person = d.get("repair_person", "")
    refurb_person = d.get("refurb_person", "")

    # Filter Monday notes by person for the repair chain
    def notes_for_person(person):
        if not person:
            return []
        person_lower = person.lower().split()[0] if person else ""
        return [n["text"] for n in monday_notes
                if person_lower and person_lower in n.get("creator", "").lower()
                and n.get("text", "").strip()]

    repair_chain = {
        "diag": {
            "person": diag_person,
            "time_mins": round(diag_time / 60, 1),
            "notes": notes_for_person(diag_person),
        },
        "repair": {
            "person": repair_person,
            "time_mins": round(repair_time / 60, 1),
            "notes": notes_for_person(repair_person),
        },
        "refurb": {
            "person": refurb_person,
            "time_mins": round(refurb_time / 60, 1),
            "notes": notes_for_person(refurb_person),
        },
    }

    # Timeline
    received = d.get("received", "")
    date_repaired = d.get("date_repaired", "")
    date_listed = d.get("date_listed_bm", "")
    date_sold = d.get("date_sold_bm", "")
    csv_date_delivery = ret.get("date_delivery", "")
    csv_date_shipped = ret.get("date_shipped", "")

    # Calculate day gaps
    sold_dt = parse_date(date_sold)
    delivery_dt = parse_date(csv_date_delivery)
    shipped_dt = parse_date(csv_date_shipped)
    received_dt = parse_date(received)
    repaired_dt = parse_date(date_repaired)
    listed_dt = parse_date(date_listed)

    days_in_repair = (repaired_dt - received_dt).days if repaired_dt and received_dt else None
    days_with_customer = (shipped_dt - delivery_dt).days if shipped_dt and delivery_dt else None
    if days_with_customer is not None and days_with_customer < 0:
        # shipped = return ship date, delivery = original delivery date
        # "days with customer" = return ship date - original delivery date
        days_with_customer = abs(days_with_customer)
    days_on_market = (sold_dt - listed_dt).days if sold_dt and listed_dt else None

    timeline = {
        "received": received,
        "repaired": date_repaired,
        "listed": date_listed,
        "sold": date_sold,
        "customer_received": csv_date_delivery,
        "return_shipped": csv_date_shipped,
        "days_in_repair": days_in_repair,
        "days_with_customer": days_with_customer,
        "days_on_market": days_on_market,
    }

    # Sort Monday notes chronologically, filter out Systems Manager automated templates
    sorted_notes = sorted(monday_notes, key=lambda n: n.get("created_at", ""))
    formatted_notes = []
    for n in sorted_notes:
        creator = n.get("creator", "")
        # Skip all Systems Manager notes (automated templates + SickW checks)
        if "systems manager" in creator.lower():
            continue
        text = n.get("text", "").strip()
        if not text:
            continue
        created = n.get("created_at", "")
        note_date = created[:10] if len(created) >= 10 else created
        formatted_notes.append({
            "date": note_date,
            "person": creator,
            "text": text[:500],
            "is_reply": n.get("is_reply", False),
        })

    # Split notes into pre-return and post-return using sale date as dividing line
    # Pre-return = repair chain, QC, listing (everything before device was sold)
    # Post-return = anything logged after the device was sold to customer
    pre_return_notes = []
    post_return_notes = []
    sold_date_str = date_sold  # from timeline above
    if sold_date_str:
        for n in formatted_notes:
            if n["date"] and n["date"] > sold_date_str:
                post_return_notes.append(n)
            else:
                pre_return_notes.append(n)
    else:
        pre_return_notes = formatted_notes

    return {
        "bm_name": bm_name,
        "device_title": device_title,
        "device_short": device_short,
        "listing_sku": sku,
        "trade_in_grade": d.get("listing_grade", ""),
        "final_grade": d.get("final_grade", ""),
        "bm_sale_grade": ret.get("grade", ""),
        "match_confidence": match["match_confidence"],
        "purchase_price": purchase_price,
        "sale_price": sale_price,
        "parts_cost": parts_cost,
        "labour": round(labour, 2),
        "bm_fee": bm_fee,
        "tax": round(tax, 2),
        "shipping": shipping,
        "net_before_return": round(net, 2) if net is not None else None,
        "condition_intake": condition,
        "repair_chain": repair_chain,
        "parts_used": d.get("parts_used", []),
        "timeline": timeline,
        "complaint": {
            "categories": ret["complaints"],
            "bm_order_id": ret["order_id"],
        },
        "monday_notes": formatted_notes,
        "pre_return_notes": pre_return_notes,
        "post_return_notes": post_return_notes,
        "main_board_id": d.get("main_board_id", ""),
        "serial_number": serial_number,
        "order_id": d.get("order_id", ""),
        "technician": d.get("technician", ""),
        "status": d.get("status", ""),
        "group": d.get("group", ""),
    }


# ================================================================
# STEP 5: Auto-flag detection
# ================================================================

def detect_flags(profile):
    """Detect red flags from data. No LLM interpretation."""
    flags = []

    parts = profile.get("parts_used", [])
    repair_time = profile["repair_chain"]["repair"]["time_mins"]
    repair_person = profile["repair_chain"]["repair"]["person"]
    parts_cost = profile.get("parts_cost", 0)

    # No boot test evidence: 0 repair time AND parts include LCD/Battery
    has_screen_or_battery_part = any(
        "lcd" in p.lower() or "battery" in p.lower() or "screen" in p.lower()
        for p in parts
    )
    if repair_time == 0 and has_screen_or_battery_part:
        flags.append("0 min repair time — no functional test after part swap (%s)" %
                      ", ".join(parts))

    # No repair person but parts were used
    if not repair_person and parts_cost > 0:
        flags.append("No repair_person assigned but parts cost £%.0f" % parts_cost)

    # Function has question mark
    func_actual = profile["condition_intake"]["function"]["actual"]
    if func_actual and "?" in func_actual:
        flags.append("Function field: '%s' — uncertain assessment" % func_actual)

    # Screen mismatch
    screen = profile["condition_intake"]["screen"]
    if screen.get("match") is False:
        flags.append("Screen mismatch: reported %s, actual %s" % (
            screen["reported"], screen["actual"]))

    # Casing mismatch
    casing = profile["condition_intake"]["casing"]
    if casing.get("match") is False:
        flags.append("Casing mismatch: reported %s, actual %s" % (
            casing["reported"], casing["actual"]))

    # Very short with customer
    days = profile["timeline"].get("days_with_customer")
    if days is not None and days <= 3:
        flags.append("Only %d day(s) with customer before return" % days)

    # Liquid damage at intake
    ld = profile["condition_intake"].get("liquid_damage", "")
    if ld and ld.lower() not in ("", "no", "none", "n/a"):
        flags.append("Liquid damage noted at intake: '%s'" % ld)

    # Intel device (from SKU)
    sku = profile.get("listing_sku", "")
    if re.search(r"\.I[357]\.", sku, re.IGNORECASE):
        flags.append("Intel device — older architecture, higher failure risk")

    # High value at risk
    sale_price = profile.get("sale_price", 0)
    if sale_price >= 800:
        flags.append("High value: sale price £%.0f" % sale_price)

    # No repair time at all but device was sold
    total_repair = (profile["repair_chain"]["diag"]["time_mins"] +
                    profile["repair_chain"]["repair"]["time_mins"] +
                    profile["repair_chain"]["refurb"]["time_mins"])
    if total_repair == 0 and profile.get("sale_price", 0) > 0:
        flags.append("Zero total repair/diag/refurb time but device was sold")

    # Battery mismatch
    battery = profile["condition_intake"]["battery"]
    if battery.get("match") is False:
        flags.append("Battery mismatch: reported %s, actual %s" % (
            battery["reported"], battery["actual"]))

    return flags


# ================================================================
# STEP 6: Root cause classification
# ================================================================

BUYERS_REMORSE_KW = ["changed mind", "ask for return", "bought by mistake", "bought item by mistake"]
TRANSIT_KW = ["damaged during delivery", "late delivery", "late shipping",
              "tracking issue", "parcel recovery"]
LISTING_KW = ["wrong color", "wrong model", "keyboard mapping",
              "wrong or missing accessories", "accessories other"]
TECHNICAL_KW = ["power on", "boot failure", "display", "keyboard defect",
                "battery", "camera", "accessories not working", "too hot",
                "random shutdown", "software", "charging", "connectivity"]


def classify_root_cause(profile):
    """Rules-based root cause classification."""
    complaints_lower = " ".join(profile["complaint"]["categories"]).lower()

    # Buyer's remorse
    for kw in BUYERS_REMORSE_KW:
        if kw in complaints_lower:
            return "buyers_remorse", "Customer complaint matches buyer's remorse pattern"

    # Transit damage
    for kw in TRANSIT_KW:
        if kw in complaints_lower:
            return "transit_damage", "Customer complaint matches transit/delivery issue"

    # Listing error (wrong colour, wrong model, accessories)
    for kw in LISTING_KW:
        if kw in complaints_lower:
            return "listing_error", "Customer complaint matches listing discrepancy"

    # Technical complaints — distinguish repair failure from QC failure
    is_technical = any(kw in complaints_lower for kw in TECHNICAL_KW)

    if is_technical:
        repair_person = profile["repair_chain"]["repair"]["person"]
        repair_time = profile["repair_chain"]["repair"]["time_mins"]

        if repair_person and repair_time > 0:
            return "repair_failure", "Technical complaint, repair was done (by %s, %.0f min)" % (
                repair_person, repair_time)
        else:
            return "qc_failure", "Technical complaint but no repair logged (0 min / no person)"

    # Cosmetic complaints
    if "esthetical" in complaints_lower or "appearance" in complaints_lower or "screen appearance" in complaints_lower:
        return "cosmetic_mismatch", "Customer complaint about cosmetic condition"

    # Other > Other Issues with no distinguishing data
    if "other" in complaints_lower:
        return "unknown", "Generic 'Other' complaint — no data to classify"

    return "unknown", "Could not classify from complaint text"


def determine_preventive_measure(profile, root_cause):
    """What would have caught this return? Data-driven suggestion."""
    parts = profile.get("parts_used", [])
    has_screen = any("lcd" in p.lower() or "screen" in p.lower() for p in parts)
    has_battery = any("battery" in p.lower() for p in parts)

    if root_cause == "buyers_remorse":
        return "none — buyer's remorse is not preventable"
    if root_cause == "transit_damage":
        return "better_packaging_or_courier"
    if root_cause == "listing_error":
        return "listing_accuracy_check_before_dispatch"
    if root_cause == "qc_failure":
        if has_screen:
            return "boot_test_after_screen_swap"
        if has_battery:
            return "charge_cycle_test_after_battery_swap"
        return "functional_test_before_dispatch"
    if root_cause == "repair_failure":
        if has_screen:
            return "extended_burn_in_test_after_screen_repair"
        return "retest_reported_fault_before_dispatch"
    if root_cause == "cosmetic_mismatch":
        return "stricter_cosmetic_grading_at_refurb"

    return "investigation_needed"


# ================================================================
# STEP 7: Pattern analysis
# ================================================================

def analyse_patterns(profiles):
    """Aggregate patterns from forensic profiles."""

    # By root cause
    by_cause = defaultdict(lambda: {"count": 0, "total_net": 0, "devices": []})
    for p in profiles:
        cause = p["root_cause"]
        by_cause[cause]["count"] += 1
        net = p.get("net_before_return")
        if net is not None:
            by_cause[cause]["total_net"] += net
        by_cause[cause]["devices"].append(p["bm_name"])

    # By last person to touch (refurb > repair > diag)
    by_last_touch = defaultdict(lambda: {"count": 0, "devices": [], "flags": []})
    for p in profiles:
        chain = p["repair_chain"]
        last = (chain["refurb"]["person"] or
                chain["repair"]["person"] or
                chain["diag"]["person"] or
                p.get("technician", "") or
                "Unknown")
        by_last_touch[last]["count"] += 1
        by_last_touch[last]["devices"].append(p["bm_name"])
        by_last_touch[last]["flags"].extend(p.get("flags", []))

    # By preventive measure
    by_prevention = defaultdict(lambda: {"count": 0, "total_net": 0, "devices": []})
    for p in profiles:
        measure = p["preventive_measure"]
        by_prevention[measure]["count"] += 1
        net = p.get("net_before_return")
        if net is not None:
            by_prevention[measure]["total_net"] += net
        by_prevention[measure]["devices"].append(p["bm_name"])

    # Repeat returners (same device multiple returns)
    device_counts = Counter(p["main_board_id"] for p in profiles if p.get("main_board_id"))
    repeats = {mid: count for mid, count in device_counts.items() if count > 1}

    # Days with customer distribution
    days_dist = Counter()
    for p in profiles:
        days = p["timeline"].get("days_with_customer")
        if days is not None:
            if days <= 1:
                days_dist["0-1 days"] += 1
            elif days <= 3:
                days_dist["2-3 days"] += 1
            elif days <= 7:
                days_dist["4-7 days"] += 1
            elif days <= 14:
                days_dist["8-14 days"] += 1
            elif days <= 30:
                days_dist["15-30 days"] += 1
            else:
                days_dist["30+ days"] += 1
        else:
            days_dist["unknown"] += 1

    # Grade × root cause
    grade_cause = defaultdict(lambda: Counter())
    for p in profiles:
        grade = p.get("bm_sale_grade", "Unknown")
        grade_cause[grade][p["root_cause"]] += 1

    return {
        "by_root_cause": {k: {"count": v["count"], "total_net_at_risk": round(v["total_net"], 2),
                               "devices": v["devices"]}
                          for k, v in sorted(by_cause.items(), key=lambda x: -x[1]["count"])},
        "by_last_person": {k: {"returns": v["count"],
                                "top_flags": [f for f, _ in Counter(v["flags"]).most_common(3)],
                                "devices": v["devices"]}
                           for k, v in sorted(by_last_touch.items(), key=lambda x: -x[1]["count"])},
        "by_prevention": {k: {"count": v["count"], "net_at_risk": round(v["total_net"], 2),
                               "devices": v["devices"]}
                          for k, v in sorted(by_prevention.items(), key=lambda x: -x[1]["count"])},
        "repeat_devices": repeats,
        "days_with_customer": dict(days_dist),
        "grade_cause_matrix": {g: dict(c) for g, c in grade_cause.items()},
    }


# ================================================================
# STEP 8: Generate markdown report
# ================================================================

def generate_report(profiles, patterns, unmatched, match_count):
    """Generate the markdown forensic report."""
    lines = []
    lines.append("# Forensic Returns Investigation — %s" % TODAY)
    lines.append("")
    lines.append("**Source:** BM returns CSV (47 unique orders) × repair analysis data (534 devices)")
    lines.append("**Matched:** %d returns to repair chain data" % match_count)
    lines.append("**Unmatched:** %d returns (no device found ±3 days)" % len(unmatched))
    lines.append("")

    # Summary stats
    total_net = sum(p["net_before_return"] for p in profiles if p["net_before_return"] is not None)
    technical = sum(1 for p in profiles if p["root_cause"] in ("repair_failure", "qc_failure"))
    preventable = sum(1 for p in profiles if p["root_cause"] not in ("buyers_remorse", "unknown"))
    lines.append("## Summary")
    lines.append("")
    lines.append("| Metric | Value |")
    lines.append("|--------|-------|")
    lines.append("| Total returns analysed | %d |" % len(profiles))
    lines.append("| Total net revenue at risk | £%.0f |" % total_net)
    lines.append("| Technical failures (repair + QC) | %d (%.0f%%) |" % (
        technical, 100 * technical / max(len(profiles), 1)))
    lines.append("| Potentially preventable | %d (%.0f%%) |" % (
        preventable, 100 * preventable / max(len(profiles), 1)))
    lines.append("")

    # Root cause breakdown
    lines.append("## Root Cause Breakdown")
    lines.append("")
    lines.append("| Cause | Count | Net at Risk | Devices |")
    lines.append("|-------|-------|-------------|---------|")
    for cause, data in patterns["by_root_cause"].items():
        device_list = ", ".join(data["devices"][:5])
        if len(data["devices"]) > 5:
            device_list += " +%d more" % (len(data["devices"]) - 5)
        lines.append("| %s | %d | £%.0f | %s |" % (
            cause, data["count"], data["total_net_at_risk"], device_list))
    lines.append("")

    # Days with customer
    lines.append("## Time With Customer Before Return")
    lines.append("")
    lines.append("| Window | Count |")
    lines.append("|--------|-------|")
    for window in ["0-1 days", "2-3 days", "4-7 days", "8-14 days", "15-30 days", "30+ days", "unknown"]:
        count = patterns["days_with_customer"].get(window, 0)
        if count > 0:
            lines.append("| %s | %d |" % (window, count))
    lines.append("")

    # Last person to touch
    lines.append("## Returns by Last Person to Touch Device")
    lines.append("")
    lines.append("| Person | Returns | Top Flags |")
    lines.append("|--------|---------|-----------|")
    for person, data in patterns["by_last_person"].items():
        flag_str = "; ".join(data["top_flags"][:2]) if data["top_flags"] else "-"
        lines.append("| %s | %d | %s |" % (person, data["returns"], flag_str[:80]))
    lines.append("")

    # Prevention measures
    lines.append("## What Would Have Caught It")
    lines.append("")
    lines.append("| Measure | Returns Prevented | Net Saved |")
    lines.append("|---------|-------------------|-----------|")
    for measure, data in patterns["by_prevention"].items():
        if measure == "none — buyer's remorse is not preventable":
            continue
        lines.append("| %s | %d | £%.0f |" % (measure, data["count"], data["net_at_risk"]))
    lines.append("")

    # Grade × cause matrix
    lines.append("## Grade × Root Cause")
    lines.append("")
    causes = sorted(set(p["root_cause"] for p in profiles))
    header = "| Grade | " + " | ".join(causes) + " | Total |"
    sep = "|-------|" + "|".join(["-------"] * len(causes)) + "|-------|"
    lines.append(header)
    lines.append(sep)
    for grade in sorted(patterns["grade_cause_matrix"].keys()):
        row = patterns["grade_cause_matrix"][grade]
        total = sum(row.values())
        cells = " | ".join(str(row.get(c, 0)) for c in causes)
        lines.append("| %s | %s | %d |" % (grade, cells, total))
    lines.append("")

    # Per-device case studies (sorted by net at risk, highest first)
    lines.append("## Per-Device Case Studies")
    lines.append("")
    sorted_profiles = sorted(profiles,
                              key=lambda p: abs(p.get("net_before_return") or 0),
                              reverse=True)

    for i, p in enumerate(sorted_profiles):
        lines.append("### %d. %s — %s" % (i + 1, p["bm_name"], p["device_short"]))
        lines.append("")

        # Core data
        serial_str = " | **Serial:** %s" % p["serial_number"] if p.get("serial_number") else ""
        lines.append("- **BM Order:** %s | **Trade-in:** %s | **Grade:** %s → %s%s" % (
            p["complaint"]["bm_order_id"], p.get("order_id", "?"),
            p["trade_in_grade"], p["final_grade"], serial_str))
        lines.append("- **Financials:** Buy £%.0f → Sell £%.0f | Parts £%.0f | Net £%s" % (
            p["purchase_price"], p["sale_price"], p["parts_cost"],
            "%.0f" % p["net_before_return"] if p["net_before_return"] is not None else "?"))
        lines.append("- **Repair chain:** Diag: %s (%.0fm) → Repair: %s (%.0fm) → Refurb: %s (%.0fm)" % (
            p["repair_chain"]["diag"]["person"] or "-",
            p["repair_chain"]["diag"]["time_mins"],
            p["repair_chain"]["repair"]["person"] or "-",
            p["repair_chain"]["repair"]["time_mins"],
            p["repair_chain"]["refurb"]["person"] or "-",
            p["repair_chain"]["refurb"]["time_mins"]))

        tl = p["timeline"]
        lines.append("- **Timeline:** Received %s → Repaired %s → Sold %s → Customer got %s → Returned %s" % (
            tl["received"] or "?", tl["repaired"] or "?", tl["sold"] or "?",
            tl["customer_received"] or "?", tl["return_shipped"] or "?"))

        days_str = []
        if tl["days_in_repair"] is not None:
            days_str.append("%dd in repair" % tl["days_in_repair"])
        if tl["days_with_customer"] is not None:
            days_str.append("%dd with customer" % tl["days_with_customer"])
        if days_str:
            lines.append("- **Duration:** %s" % " | ".join(days_str))

        lines.append("- **Customer complaint:** %s" % " + ".join(p["complaint"]["categories"]))
        lines.append("- **Parts:** %s" % (", ".join(p["parts_used"]) if p["parts_used"] else "None"))
        lines.append("- **Root cause:** %s — %s" % (p["root_cause"], p["root_cause_evidence"]))
        lines.append("- **Prevention:** %s" % p["preventive_measure"])

        if p.get("flags"):
            lines.append("- **Flags:** %s" % " | ".join(p["flags"]))

        # Pre-dispatch notes (repair chain, QC, listing — before sale)
        pre_notes = p.get("pre_return_notes", [])
        post_notes = p.get("post_return_notes", [])
        if pre_notes:
            lines.append("- **Pre-dispatch notes** (%d):" % len(pre_notes))
            for n in pre_notes[:6]:
                text_preview = n["text"][:150].replace("\n", " ").strip()
                if text_preview:
                    lines.append("  - [%s] %s%s: %s" % (
                        n["date"], n["person"],
                        " (reply)" if n["is_reply"] else "",
                        text_preview))
        if post_notes:
            lines.append("- **Post-return notes** (%d):" % len(post_notes))
            for n in post_notes[:4]:
                text_preview = n["text"][:150].replace("\n", " ").strip()
                if text_preview:
                    lines.append("  - [%s] %s%s: %s" % (
                        n["date"], n["person"],
                        " (reply)" if n["is_reply"] else "",
                        text_preview))
        if not pre_notes and not post_notes:
            lines.append("- **Notes:** None")

        lines.append("")

    # Unmatched returns
    if unmatched:
        lines.append("## Unmatched Returns (%d)" % len(unmatched))
        lines.append("")
        lines.append("These returns could not be matched to a device in the repair chain data.")
        lines.append("")
        for u in unmatched:
            lines.append("- **%s** — %s %s | Shipped %s | %s" % (
                u["order_id"], u["model"], u["grade"],
                u["date_shipped"], " + ".join(u["complaints"])))
        lines.append("")

    # Compromises
    lines.append("## COMPROMISES")
    lines.append("")
    lines.append("- **Matching:** Primary: date ±3 days + model type. Fallback: BM board sale order ID → mirrored serial → main board match. Serial numbers included on all profiles for verification.")
    lines.append("- **Days with customer:** Approximated from CSV date_delivery → CSV date_shipped (return).")
    lines.append("- **Root cause classification:** Rules-based from complaint text + repair data. Not verified against actual return inspection.")
    lines.append("- **Monday notes:** Limited to 100 most recent updates per item. Older notes may be missing.")
    lines.append("- **Return cost:** Not available in CSV — BM fee + return shipping not included in this analysis.")
    lines.append("- **Repeat returns:** Tracked by Monday item ID. If the same physical device was relisted with a new Monday item, it won't be detected.")
    lines.append("")

    return "\n".join(lines)


# ================================================================
# MAIN
# ================================================================

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Forensic Returns Investigation")
    parser.add_argument("--skip-updates", action="store_true",
                        help="Skip pulling Monday updates (for testing)")
    args = parser.parse_args()

    env = load_env()
    api_key = env.get("MONDAY_APP_TOKEN", "")
    if not api_key and not args.skip_updates:
        log("ERROR: MONDAY_APP_TOKEN not found")
        sys.exit(1)

    log("=== FORENSIC RETURNS INVESTIGATION ===")
    log("")

    # ---- STEP 1: Parse CSV ----
    log("STEP 1: Parsing BM returns CSV...")
    returns = parse_returns_csv(CSV_PATH)
    log("  Unique returns: %d" % len(returns))
    log("  Total complaint categories: %d" % sum(len(r["complaints"]) for r in returns))
    log("")

    # ---- STEP 2: Load repair data + match ----
    log("STEP 2: Loading repair data and matching...")
    with open(REPAIR_DATA_PATH) as f:
        repair_data = json.load(f)
    devices = repair_data["devices"]
    log("  Total devices in repair data: %d" % len(devices))

    matches, unmatched = match_returns_to_devices(returns, devices)
    log("  Matched (date+model): %d" % len(matches))
    log("  Unmatched: %d" % len(unmatched))
    by_conf = Counter(m["match_confidence"] for m in matches)
    for conf in ["high", "medium", "low"]:
        log("    %s confidence: %d" % (conf, by_conf.get(conf, 0)))

    # ---- STEP 2b: Resolve unmatched via BM board serial lookup ----
    if unmatched and not args.skip_updates:
        log("")
        log("STEP 2b: Resolving %d unmatched returns via BM board serial lookup..." % len(unmatched))
        serial_matches, unmatched = resolve_unmatched_via_serial(unmatched, devices, api_key)
        if serial_matches:
            matches.extend(serial_matches)
            log("  Resolved %d via serial. Total matched: %d. Still unmatched: %d" % (
                len(serial_matches), len(matches), len(unmatched)))
        else:
            log("  No additional matches found via serial")

    log("")

    # ---- STEP 3: Pull Monday updates + serial numbers ----
    item_ids = list(set(m["device"].get("main_board_id", "")
                        for m in matches if m["device"].get("main_board_id")))
    log("STEP 3: Pulling Monday updates + serials for %d unique items..." % len(item_ids))

    if args.skip_updates:
        log("  SKIPPED (--skip-updates)")
        all_updates = {mid: [] for mid in item_ids}
        all_serials = {}
    else:
        all_serials = pull_serial_numbers(item_ids, api_key)
        log("  Serial numbers found: %d/%d" % (len(all_serials), len(item_ids)))
        all_updates = pull_item_updates(item_ids, api_key)
        items_with_updates = sum(1 for v in all_updates.values() if v)
        total_updates = sum(len(v) for v in all_updates.values())
        log("  Items with updates: %d" % items_with_updates)
        log("  Total updates+replies: %d" % total_updates)
    log("")

    # ---- STEP 4-6: Build profiles, flags, classify ----
    log("STEP 4-6: Building forensic profiles...")
    profiles = []
    for match in matches:
        mid = match["device"].get("main_board_id", "")
        notes = all_updates.get(mid, [])
        serial = all_serials.get(mid, "")

        profile = build_forensic_profile(match, notes, serial_number=serial)

        # Step 5: flags
        profile["flags"] = detect_flags(profile)

        # Step 6: root cause
        cause, evidence = classify_root_cause(profile)
        profile["root_cause"] = cause
        profile["root_cause_evidence"] = evidence
        profile["preventive_measure"] = determine_preventive_measure(profile, cause)

        profiles.append(profile)

    log("  Profiles built: %d" % len(profiles))
    by_cause = Counter(p["root_cause"] for p in profiles)
    for cause, count in by_cause.most_common():
        log("    %s: %d" % (cause, count))
    log("")

    # ---- STEP 7: Pattern analysis ----
    log("STEP 7: Analysing patterns...")
    patterns = analyse_patterns(profiles)
    log("  Repeat devices: %d" % len(patterns["repeat_devices"]))
    log("")

    # ---- STEP 8: Output ----
    log("STEP 8: Writing output...")
    os.makedirs(AUDIT_DIR, exist_ok=True)

    # JSON
    json_path = "%s/returns-forensic-%s.json" % (AUDIT_DIR, TODAY)
    output = {
        "generated": datetime.now().isoformat(),
        "source": {
            "csv": CSV_PATH,
            "repair_data": REPAIR_DATA_PATH,
        },
        "summary": {
            "total_returns": len(returns),
            "matched": len(matches),
            "unmatched": len(unmatched),
            "by_root_cause": dict(by_cause),
        },
        "profiles": profiles,
        "patterns": patterns,
        "unmatched_returns": unmatched,
    }
    with open(json_path, "w") as f:
        json.dump(output, f, indent=2, default=str)
    log("  JSON: %s" % json_path)

    # Markdown
    md_path = "%s/returns-forensic-%s.md" % (AUDIT_DIR, TODAY)
    report = generate_report(profiles, patterns, unmatched, len(matches))
    with open(md_path, "w") as f:
        f.write(report)
    log("  Report: %s" % md_path)

    # Print summary to stdout
    print()
    print("=" * 70)
    print("FORENSIC RETURNS INVESTIGATION — COMPLETE")
    print("=" * 70)
    print()
    print("Matched: %d/%d returns (%d unmatched)" % (
        len(matches), len(returns), len(unmatched)))
    print()
    print("Root causes:")
    for cause, count in by_cause.most_common():
        pct = 100 * count / max(len(profiles), 1)
        print("  %-20s %3d (%2.0f%%)" % (cause, count, pct))
    print()
    print("Net at risk: £%.0f" % sum(
        p["net_before_return"] for p in profiles if p["net_before_return"] is not None))
    print()

    # Spot-check specific devices mentioned in plan
    spot_checks = ["BM 1198", "BM 967", "BM 1071"]
    print("Spot checks:")
    for name in spot_checks:
        found = [p for p in profiles if name in p.get("bm_name", "")]
        if found:
            p = found[0]
            print("  %s — %s | %s | %d flags | %d notes" % (
                name, p["root_cause"], p.get("preventive_measure", "?"),
                len(p.get("flags", [])), len(p.get("monday_notes", []))))
        else:
            print("  %s — NOT FOUND in matched returns" % name)
    print()

    print("Output: %s" % json_path)
    print("Report: %s" % md_path)
    log("\nDone.")


if __name__ == "__main__":
    main()
