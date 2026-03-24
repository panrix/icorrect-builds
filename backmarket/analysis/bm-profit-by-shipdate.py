import json
import subprocess
import sys
from datetime import datetime, timezone

API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUyNDgzODY2NSwiYWFpIjoxMSwidWlkIjoxMDM0NDE0LCJpYWQiOiIyMDI1LTA2LTExVDA4OjE1OjI0LjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0MTk3ODAsInJnbiI6InVzZTEifQ.bxg7ibMAYprJa8Y-KPYmSvhgkrLbhJVTuO_uBxyq93Y"

def monday_query(query):
    result = subprocess.run(
        ["curl", "-s", "-X", "POST", "https://api.monday.com/v2",
         "-H", "Content-Type: application/json",
         "-H", "Authorization: %s" % API_KEY,
         "-H", "API-Version: 2024-10",
         "-d", json.dumps({"query": query})],
        capture_output=True, text=True
    )
    return json.loads(result.stdout)

def monday_ts_to_dt(ts_str):
    ts = int(ts_str)
    unix_ts = ts / 10000000
    return datetime.fromtimestamp(unix_ts, tz=timezone.utc)

def log(msg):
    print(msg, flush=True)

start = datetime(2026, 2, 18, tzinfo=timezone.utc)
end = datetime(2026, 2, 24, 23, 59, 59, tzinfo=timezone.utc)

# ============================================================
# STEP 1: Get Main Board shipping events
# ============================================================
log("STEP 1: Main Board activity logs...")
all_logs = []
from_date = "2026-02-18"
to_date = "2026-02-25"

q = '{ boards(ids: 349212843) { activity_logs(from: "%s", to: "%s", limit: 500) { id event data created_at } } }' % (from_date, to_date)
result = monday_query(q)
logs = result["data"]["boards"][0]["activity_logs"]
all_logs.extend(logs)
log("  Page 1: %d" % len(logs))

while len(logs) == 500:
    last_ts = logs[-1]["created_at"]
    last_dt = monday_ts_to_dt(last_ts)
    to_next = last_dt.strftime("%Y-%m-%dT%H:%M:%S")
    q = '{ boards(ids: 349212843) { activity_logs(from: "%s", to: "%s", limit: 500) { id event data created_at } } }' % (from_date, to_next)
    result = monday_query(q)
    logs = result["data"]["boards"][0]["activity_logs"]
    existing = set(l["id"] for l in all_logs)
    new = [l for l in logs if l["id"] not in existing]
    all_logs.extend(new)
    log("  Next: +%d" % len(new))
    if not new:
        break

log("  Total: %d entries" % len(all_logs))

# Extract shipping events (earliest per item)
shipped_main = {}
for entry in all_logs:
    dt = monday_ts_to_dt(entry["created_at"])
    if not (start <= dt <= end):
        continue
    data = json.loads(entry["data"])

    if entry["event"] == "move_pulse_from_group":
        dest = data.get("dest_group", {})
        dest_title = dest.get("title", "")
        if "ship" in dest_title.lower() or "outbound" in dest_title.lower():
            item_id = str(data["pulse_id"])
            item_name = data["pulse"]["name"]
            if item_id not in shipped_main or dt < shipped_main[item_id]["date"]:
                shipped_main[item_id] = {"date": dt, "name": item_name, "method": "group:'%s'" % dest_title}

    if entry["event"] == "update_column_value":
        col_title = data.get("column_title", "")
        if "ship" in col_title.lower() or "status" in col_title.lower():
            new_val = data.get("value", {})
            label = ""
            if isinstance(new_val, dict):
                li = new_val.get("label", "")
                if isinstance(li, dict):
                    label = li.get("text", "")
                elif isinstance(li, str):
                    label = li
                idx = new_val.get("index")
                if idx is not None and idx == 0:
                    label = label or "Shipped"
            if "ship" in str(label).lower() and "ready" not in str(label).lower():
                item_id = str(data["pulse_id"])
                item_name = data.get("pulse_name", "?")
                if item_id not in shipped_main or dt < shipped_main[item_id]["date"]:
                    shipped_main[item_id] = {"date": dt, "name": item_name, "method": "status:'%s'" % label}

log("  Shipped items on Main Board: %d" % len(shipped_main))

# Filter to BM items only (name contains "BM")
bm_shipped = {k: v for k, v in shipped_main.items() if "BM" in v["name"].upper()}
log("  BM items (by name): %d" % len(bm_shipped))

# ============================================================
# STEP 2: For each shipped BM Main Board item, find the BM board link
# Query the Main Board item for its connect_boards link back to BM board
# ============================================================
log("STEP 2: Getting BM board links for %d shipped Main Board items..." % len(bm_shipped))

# Each Main Board item may have a board_relation to BM Devices board
# But the relation is from BM->Main, not Main->BM
# So we need to query BM board items that link to these Main Board items
#
# Faster approach: use the BM item names from Main Board names
# Main Board items are named like "BM 1396" — same as BM board
# Load all BM items and match by name

all_bm_items = []
for f in ["/tmp/bm-items.json", "/tmp/bm-items-p2.json", "/tmp/bm-items-p3.json"]:
    data = json.load(open(f))
    all_bm_items.extend(data["data"]["boards"][0]["items_page"]["items"])

import re

bm_by_name = {}
bm_by_number = {}
for item in all_bm_items:
    bm_by_name[item["name"]] = item
    # Extract BM number (e.g., "BM 1421" from "BM 1421")
    m = re.match(r'(BM\s*\d+)', item["name"])
    if m:
        bm_by_number[m.group(1).replace(" ", " ")] = item

# Match shipped Main Board items to BM items by BM number
matched = {}  # bm_id -> {ship_date, main_id, ...}
unmatched = []

for main_id, info in bm_shipped.items():
    main_name = info["name"]
    # Extract BM number from Main Board name (e.g., "BM 1421 (Max Cooke)" -> "BM 1421")
    m = re.match(r'(BM\s*\d+)', main_name)
    bm_item = None
    if m:
        bm_num = m.group(1).replace(" ", " ")
        bm_item = bm_by_number.get(bm_num)
    if not bm_item:
        bm_item = bm_by_name.get(main_name)

    if bm_item:
        matched[bm_item["id"]] = {
            "ship_date": info["date"],
            "ship_str": info["date"].strftime("%Y-%m-%d"),
            "main_id": main_id,
            "main_name": main_name,
            "method": info["method"],
        }
    else:
        unmatched.append((main_id, main_name, info))

log("  Matched by BM number: %d" % len(matched))
if unmatched:
    log("  Unmatched: %d" % len(unmatched))
    for mid, mname, info in unmatched:
        log("    %s (Main Board %s)" % (mname, mid))

log("  Final matched: %d" % len(matched))

# ============================================================
# STEP 3: Get financial data + parts/labour
# ============================================================
log("STEP 3: Getting financial data...")

items_by_id = {}
for item in all_bm_items:
    items_by_id[item["id"]] = item

# Fetch missing items
missing = [bid for bid in matched if bid not in items_by_id]
if missing:
    log("  Fetching %d missing BM items..." % len(missing))
    for mid in missing:
        q = '{ items(ids: [%s]) { id name column_values(ids: ["lookup_mkq35gbg", "numeric5", "numeric", "formula", "formula7"]) { id text value ... on MirrorValue { display_value } ... on FormulaValue { display_value } } } }' % mid
        r = monday_query(q)
        if r["data"]["items"]:
            items_by_id[mid] = r["data"]["items"][0]

# Get board_relation for each matched BM item -> Main Board
# (we already have main_id from the match)
# Get Main Board data: RR&D + parts
main_ids = set(m["main_id"] for m in matched.values())
log("  Querying %d Main Board items for RR&D + parts..." % len(main_ids))
main_data = {}
for main_id in main_ids:
    q = '{ items(ids: [%s]) { id column_values(ids: ["formula__1", "connect_boards__1"]) { id ... on FormulaValue { display_value } ... on BoardRelationValue { linked_item_ids } } } }' % main_id
    r = monday_query(q)
    for item in r["data"]["items"]:
        entry = {"rrd": None, "parts_ids": []}
        for cv in item["column_values"]:
            if cv["id"] == "formula__1":
                dv = cv.get("display_value", "")
                if dv and dv not in ["null", ""]:
                    try:
                        entry["rrd"] = float(dv)
                    except ValueError:
                        pass
            elif cv["id"] == "connect_boards__1":
                entry["parts_ids"] = cv.get("linked_item_ids", [])
        main_data[item["id"]] = entry

# Get parts prices individually
all_parts = set()
for md in main_data.values():
    all_parts.update(md["parts_ids"])
all_parts = list(all_parts)
log("  Querying %d parts individually..." % len(all_parts))

parts_prices = {}
for i, pid in enumerate(all_parts):
    if (i + 1) % 20 == 0:
        log("    %d/%d..." % (i + 1, len(all_parts)))
    q = '{ items(ids: [%s]) { id column_values(ids: ["supply_price"]) { id text } } }' % pid
    r = monday_query(q)
    if "errors" not in r:
        for item in r["data"]["items"]:
            for cv in item["column_values"]:
                val = cv.get("text", "")
                if val and val not in ["None", "null", ""]:
                    try:
                        parts_prices[item["id"]] = float(val.replace(",", "").replace("\u00a3", "").strip())
                    except ValueError:
                        pass
    else:
        q = '{ items(ids: [%s]) { id column_values { id text } } }' % pid
        r = monday_query(q)
        for item in r["data"]["items"]:
            for cv in item["column_values"]:
                if cv["id"] == "supply_price":
                    val = cv.get("text", "")
                    if val and val not in ["None", "null", ""]:
                        try:
                            parts_prices[item["id"]] = float(val.replace(",", "").replace("\u00a3", "").strip())
                        except ValueError:
                            pass

log("  Parts with prices: %d/%d" % (len(parts_prices), len(all_parts)))

# ============================================================
# STEP 4: Calculate profit
# ============================================================
SHIPPING = 15.0
results = []

def get_num(col):
    for key in ["text", "display_value", "value"]:
        val = col.get(key, "")
        if val and str(val) not in ["None", "null", ""]:
            try:
                return float(str(val).replace(",", "").replace("\u00a3", "").replace('"', '').strip())
            except ValueError:
                pass
    return None

for bm_id, ship_info in matched.items():
    item = items_by_id.get(bm_id)
    if not item:
        results.append({
            "name": ship_info["main_name"], "shipped": ship_info["ship_str"],
            "sold": "?", "sale": 0, "purchase": 0, "bm_fee": 0, "tax": 0,
            "parts": 0, "labour": 0, "ship": SHIPPING, "net": 0,
            "note": "NOT FOUND",
        })
        continue

    cols = {cv["id"]: cv for cv in item["column_values"]}
    sale = get_num(cols.get("numeric5", {}))
    purchase = get_num(cols.get("numeric", {}))
    date_sold = cols.get("lookup_mkq35gbg", {}).get("display_value", "?")
    bm_fee = get_num(cols.get("formula", {})) or 0
    tax = get_num(cols.get("formula7", {})) or 0

    if sale is None or purchase is None:
        results.append({
            "name": item["name"], "shipped": ship_info["ship_str"],
            "sold": date_sold, "sale": sale or 0, "purchase": purchase or 0,
            "bm_fee": bm_fee, "tax": tax,
            "parts": 0, "labour": 0, "ship": SHIPPING, "net": 0,
            "note": "MISSING SALE/PURCHASE",
        })
        continue

    main_id = ship_info["main_id"]
    labour = 0
    parts = 0
    notes = []

    if main_id in main_data:
        md = main_data[main_id]
        if md["rrd"] is not None:
            labour = md["rrd"] * 15
        else:
            notes.append("no RR&D")
        for pid in md["parts_ids"]:
            if pid in parts_prices:
                parts += parts_prices[pid]
        if not md["parts_ids"]:
            notes.append("no parts linked")
    else:
        notes.append("NO MAIN DATA")

    net = sale - purchase - bm_fee - tax - parts - labour - SHIPPING

    results.append({
        "name": item["name"],
        "shipped": ship_info["ship_str"],
        "sold": date_sold,
        "sale": sale,
        "purchase": purchase,
        "bm_fee": bm_fee,
        "tax": tax,
        "parts": round(parts, 2),
        "labour": round(labour, 2),
        "ship": SHIPPING,
        "net": round(net, 2),
        "note": ", ".join(notes),
    })

results.sort(key=lambda x: x["shipped"])

# ============================================================
# STEP 5: Print report
# ============================================================
print()
print("=" * 170)
print("BM DEVICES - NET PROFIT BY SHIP DATE - 18-24 Feb 2026")
print("(Items in your incoming BackMarket payment)")
print("=" * 170)
print()
print("%-18s %-12s %-12s %8s %8s %8s %8s %8s %8s %6s %10s  %s" % (
    "Name", "Shipped", "Sold", "Sale", "Purch", "BM Fee", "Tax", "Parts", "Labour", "Ship", "NET", "Note"))
print("-" * 170)

totals = {"sale": 0, "purchase": 0, "bm_fee": 0, "tax": 0, "parts": 0, "labour": 0, "ship": 0, "net": 0}

for r in results:
    print("%-18s %-12s %-12s %8.2f %8.2f %8.2f %8.2f %8.2f %8.2f %6.0f %10.2f  %s" % (
        r["name"], r["shipped"], r["sold"], r["sale"], r["purchase"], r["bm_fee"], r["tax"],
        r["parts"], r["labour"], r["ship"], r["net"], r["note"]))
    for k in totals:
        totals[k] += r[k]

print("-" * 170)
print("%-18s %-12s %-12s %8.2f %8.2f %8.2f %8.2f %8.2f %8.2f %6.0f %10.2f" % (
    "TOTALS", "", "", totals["sale"], totals["purchase"], totals["bm_fee"], totals["tax"],
    totals["parts"], totals["labour"], totals["ship"], totals["net"]))

total_costs = totals["purchase"] + totals["bm_fee"] + totals["tax"] + totals["parts"] + totals["labour"] + totals["ship"]
margin = (totals["net"] / totals["sale"] * 100) if totals["sale"] else 0

print()
print("  Items shipped:     %d" % len(results))
print("  Total Revenue:     \u00a3%s" % "{:,.2f}".format(totals["sale"]))
print("  -----------------------------------------------")
print("  Purchase Cost:     \u00a3%s" % "{:,.2f}".format(totals["purchase"]))
print("  BackMarket Fees:   \u00a3%s" % "{:,.2f}".format(totals["bm_fee"]))
print("  Tax:               \u00a3%s" % "{:,.2f}".format(totals["tax"]))
print("  Parts Cost:        \u00a3%s" % "{:,.2f}".format(totals["parts"]))
print("  Labour Cost:       \u00a3%s" % "{:,.2f}".format(totals["labour"]))
print("  Shipping:          \u00a3%s" % "{:,.2f}".format(totals["ship"]))
print("  -----------------------------------------------")
print("  Total Costs:       \u00a3%s" % "{:,.2f}".format(total_costs))
print("  NET PROFIT:        \u00a3%s" % "{:,.2f}".format(totals["net"]))
print("  Margin:            %.1f%%" % margin)
print()

losses = [r for r in results if r["net"] < 0]
if losses:
    print("  LOSS-MAKING ITEMS:")
    for r in losses:
        print("    %s (shipped %s): \u00a3%.2f" % (r["name"], r["shipped"], r["net"]))
    print()

# Cross-reference: sold 18-24 vs shipped 18-24
sold_18_24 = set()
for item in all_bm_items:
    cols = {cv["id"]: cv for cv in item["column_values"]}
    ds = cols.get("lookup_mkq35gbg", {}).get("display_value", "")
    if ds and ds.strip():
        try:
            d = datetime.strptime(ds.strip(), "%Y-%m-%d").replace(tzinfo=timezone.utc)
            if start <= d <= end:
                sold_18_24.add(item["id"])
        except ValueError:
            pass

shipped_set = set(matched.keys())
sold_not_shipped = sold_18_24 - shipped_set
shipped_not_sold = shipped_set - sold_18_24

if sold_not_shipped:
    print("  SOLD 18-24 but NOT shipped 18-24 (%d) — NOT in this payment:" % len(sold_not_shipped))
    for sid in sold_not_shipped:
        item = items_by_id.get(sid)
        if item:
            cols = {cv["id"]: cv for cv in item["column_values"]}
            ds = cols.get("lookup_mkq35gbg", {}).get("display_value", "?")
            print("    %s (sold %s)" % (item["name"], ds))
    print()

if shipped_not_sold:
    print("  SHIPPED 18-24 but sold OUTSIDE range (%d) — IS in this payment:" % len(shipped_not_sold))
    for bm_id in shipped_not_sold:
        item = items_by_id.get(bm_id)
        ship_str = matched[bm_id]["ship_str"]
        if item:
            cols = {cv["id"]: cv for cv in item["column_values"]}
            ds = cols.get("lookup_mkq35gbg", {}).get("display_value", "?")
            print("    %s (sold %s, shipped %s)" % (item["name"], ds, ship_str))
    print()
