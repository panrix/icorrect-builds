import json
import subprocess
from datetime import datetime, timezone
from collections import defaultdict

# ============================================================
# BM Full Chain: Trade-in -> Repair -> Sale -> Profit
# Maps every sold BM item through the complete lifecycle
# ============================================================

API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUyNDgzODY2NSwiYWFpIjoxMSwidWlkIjoxMDM0NDE0LCJpYWQiOiIyMDI1LTA2LTExVDA4OjE1OjI0LjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0MTk3ODAsInJnbiI6InVzZTEifQ.bxg7ibMAYprJa8Y-KPYmSvhgkrLbhJVTuO_uBxyq93Y"

bm_creds = {}
with open("/home/ricky/config/api-keys/.env") as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            bm_creds[k] = v.strip("'\"")

def mq(query):
    r = subprocess.run(["curl", "-s", "-X", "POST", "https://api.monday.com/v2",
        "-H", "Content-Type: application/json", "-H", "Authorization: %s" % API_KEY,
        "-H", "API-Version: 2024-10",
        "-d", json.dumps({"query": query})], capture_output=True, text=True)
    return json.loads(r.stdout)

def bm_api(path):
    r = subprocess.run(["curl", "-s",
        "https://www.backmarket.co.uk/%s" % path,
        "-H", "Authorization: %s" % bm_creds["BACKMARKET_API_AUTH"],
        "-H", "Accept-Language: %s" % bm_creds["BACKMARKET_API_LANG"],
        "-H", "User-Agent: %s" % bm_creds["BACKMARKET_API_UA"],
        "-H", "Accept: application/json"],
        capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except json.JSONDecodeError:
        return None

def log(msg):
    print(msg, flush=True)

# ============================================================
# STEP 1: Load BM board items (sold in date range)
# ============================================================
start = datetime(2026, 2, 18, tzinfo=timezone.utc)
end = datetime(2026, 2, 24, 23, 59, 59, tzinfo=timezone.utc)

log("STEP 1: Loading BM board items...")
all_bm_items = []
for f in ["/tmp/bm-items.json", "/tmp/bm-items-p2.json", "/tmp/bm-items-p3.json"]:
    data = json.load(open(f))
    all_bm_items.extend(data["data"]["boards"][0]["items_page"]["items"])

# Also load all items from the audit cache for broader data
with open("/tmp/bm-audit-data.json") as f:
    audit_data = json.load(f)
audit_by_name = {r["name"]: r for r in audit_data}

# ============================================================
# STEP 2: Get Main Board ship dates (from activity log)
# ============================================================
log("STEP 2: Getting Main Board shipping events...")
all_logs = []
from_date = "2026-02-18"
to_date = "2026-02-25"

q = '{ boards(ids: 349212843) { activity_logs(from: "%s", to: "%s", limit: 500) { id event data created_at } } }' % (from_date, to_date)
result = mq(q)
logs = result["data"]["boards"][0]["activity_logs"]
all_logs.extend(logs)

def monday_ts_to_dt(ts_str):
    ts = int(ts_str)
    return datetime.fromtimestamp(ts / 10000000, tz=timezone.utc)

while len(logs) == 500:
    last_ts = logs[-1]["created_at"]
    last_dt = monday_ts_to_dt(last_ts)
    to_next = last_dt.strftime("%Y-%m-%dT%H:%M:%S")
    q = '{ boards(ids: 349212843) { activity_logs(from: "%s", to: "%s", limit: 500) { id event data created_at } } }' % (from_date, to_next)
    result = mq(q)
    logs = result["data"]["boards"][0]["activity_logs"]
    existing = set(l["id"] for l in all_logs)
    new = [l for l in logs if l["id"] not in existing]
    all_logs.extend(new)
    if not new:
        break

log("  %d activity entries" % len(all_logs))

# Extract shipping events
import re
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
                shipped_main[item_id] = {"date": dt, "name": item_name}
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
            if "ship" in str(label).lower() and "ready" not in str(label).lower():
                item_id = str(data["pulse_id"])
                item_name = data.get("pulse_name", "?")
                if item_id not in shipped_main or dt < shipped_main[item_id]["date"]:
                    shipped_main[item_id] = {"date": dt, "name": item_name}

# Filter to BM items and match by BM number
bm_audit_by_id = {r["id"]: r for r in audit_data}
bm_by_number = {}
for item in audit_data:
    m = re.match(r'(BM\s*\d+)', item["name"])
    if m:
        bm_by_number[m.group(1)] = item

bm_shipped = {}
for main_id, info in shipped_main.items():
    if "BM" not in info["name"].upper():
        continue
    m = re.match(r'(BM\s*\d+)', info["name"])
    if m:
        bm_num = m.group(1)
        bm_item = bm_by_number.get(bm_num)
        if bm_item:
            bm_shipped[bm_item["id"]] = {
                "ship_date": info["date"].strftime("%Y-%m-%d"),
                "main_id": main_id,
            }

log("  BM items shipped 18-24: %d" % len(bm_shipped))

# ============================================================
# STEP 3: For each shipped item, get trade-in order ID + financial data
# ============================================================
log("STEP 3: Getting trade-in order IDs and financials...")

# Query Monday for Order ID and financial columns
chain_data = []
for bm_id in bm_shipped:
    q = '{ items(ids: [%s]) { id name column_values(ids: ["text_mkqy3576", "text89", "numeric5", "numeric", "formula", "formula7"]) { id text ... on FormulaValue { display_value } } } }' % bm_id
    r = mq(q)
    if not r["data"]["items"]:
        continue
    it = r["data"]["items"][0]
    cols = {}
    for cv in it["column_values"]:
        cols[cv["id"]] = cv.get("text") or cv.get("display_value") or ""

    chain_data.append({
        "bm_id": bm_id,
        "name": it["name"],
        "order_id": cols.get("text_mkqy3576", ""),
        "sku": cols.get("text89", ""),
        "sale": float(cols["numeric5"]) if cols.get("numeric5") else 0,
        "purchase": float(cols["numeric"]) if cols.get("numeric") else 0,
        "bm_fee": float(cols["formula"]) if cols.get("formula") else 0,
        "tax": float(cols["formula7"]) if cols.get("formula7") else 0,
        "ship_date": bm_shipped[bm_id]["ship_date"],
        "main_id": bm_shipped[bm_id]["main_id"],
    })

log("  Got financial data for %d items" % len(chain_data))

# ============================================================
# STEP 4: Get Main Board data (RR&D + parts)
# ============================================================
log("STEP 4: Getting parts and labour from Main Board...")
main_ids = set(c["main_id"] for c in chain_data)
main_data = {}
for main_id in main_ids:
    q = '{ items(ids: [%s]) { id column_values(ids: ["formula__1", "connect_boards__1"]) { id ... on FormulaValue { display_value } ... on BoardRelationValue { linked_item_ids } } } }' % main_id
    r = mq(q)
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

# Get parts prices
all_parts = set()
for md in main_data.values():
    all_parts.update(md["parts_ids"])
log("  Querying %d parts..." % len(all_parts))

parts_prices = {}
for pid in all_parts:
    q = '{ items(ids: [%s]) { id column_values(ids: ["supply_price"]) { id text } } }' % pid
    r = mq(q)
    if "errors" not in r:
        for item in r["data"]["items"]:
            for cv in item["column_values"]:
                val = cv.get("text", "")
                if val and val not in ["None", "null", ""]:
                    try:
                        parts_prices[item["id"]] = float(val.replace(",", "").replace("\u00a3", "").strip())
                    except ValueError:
                        pass

log("  Parts with prices: %d/%d" % (len(parts_prices), len(all_parts)))

# Calculate parts + labour per item
for c in chain_data:
    md = main_data.get(c["main_id"], {"rrd": None, "parts_ids": []})
    c["labour"] = (md["rrd"] * 15) if md["rrd"] else 0
    c["parts"] = sum(parts_prices.get(pid, 0) for pid in md["parts_ids"])
    c["shipping"] = 15.0
    c["net"] = c["sale"] - c["purchase"] - c["bm_fee"] - c["tax"] - c["parts"] - c["labour"] - c["shipping"]

# ============================================================
# STEP 5: Query BM Buyback API for trade-in data
# ============================================================
log("STEP 5: Querying BM Buyback API for GB orders...")

gb_count = 0
for c in chain_data:
    oid = c["order_id"]
    if oid and oid.startswith("GB-"):
        gb_count += 1
        bb = bm_api("ws/buyback/v1/orders/%s" % oid)
        if bb and "status" in bb:
            c["bb_status"] = bb.get("status", "?")
            c["bb_grade"] = bb.get("listing", {}).get("grade", "?")
            c["bb_device"] = bb.get("listing", {}).get("title", "?")
            c["bb_offer"] = bb.get("originalPrice", {}).get("value", 0)
            c["bb_counter"] = bb.get("counterOfferPrice", {}).get("value", 0)
            c["bb_created"] = (bb.get("creationDate") or "?")[:10]
            c["bb_received"] = (bb.get("receivalDate") or "?")[:10]
            c["bb_paid"] = (bb.get("paymentDate") or "?")[:10]
            c["bb_customer"] = "%s %s" % (
                bb.get("customer", {}).get("firstName", "?"),
                bb.get("customer", {}).get("lastName", "?"))
            c["bb_suspend"] = bb.get("suspendReasons", [])
            c["bb_counter_reasons"] = bb.get("counterOfferReasons", [])
        else:
            c["bb_status"] = "API_ERROR"
    else:
        c["bb_status"] = "NOT_TRADEIN" if oid else "NO_ORDER_ID"

log("  Queried %d GB trade-in orders" % gb_count)

# ============================================================
# STEP 6: Print full chain report
# ============================================================
chain_data.sort(key=lambda x: x["ship_date"])

print()
print("=" * 160)
print("BM FULL CHAIN REPORT: TRADE-IN -> REPAIR -> SALE -> PROFIT")
print("Period: Items shipped 18-24 Feb 2026")
print("=" * 160)

print()
for c in chain_data:
    net_flag = "LOSS" if c["net"] < 0 else ""
    print("-" * 120)
    print("%-14s | Shipped: %s | SKU: %s  %s" % (c["name"], c["ship_date"], c["sku"], net_flag))

    # Trade-in section
    if c.get("bb_grade"):
        offer_vs_purchase = ""
        if c["bb_offer"] and c["purchase"]:
            diff = c["purchase"] - c["bb_offer"]
            if abs(diff) > 1:
                offer_vs_purchase = " (Monday shows \u00a3%.0f, diff \u00a3%.0f)" % (c["purchase"], diff)
        print("  TRADE-IN:  %s | Grade: %-8s | Offer: \u00a3%.0f%s" % (
            c["order_id"], c["bb_grade"], c["bb_offer"], offer_vs_purchase))
        print("             Customer: %s | Received: %s | Paid: %s" % (
            c["bb_customer"], c["bb_received"], c["bb_paid"]))
        if c["bb_suspend"]:
            print("             SUSPENDED: %s" % c["bb_suspend"])
        if c["bb_counter_reasons"]:
            print("             COUNTER OFFERED: %s" % c["bb_counter_reasons"])
    elif c["bb_status"] == "NOT_TRADEIN":
        print("  TRADE-IN:  Not a BM trade-in (Order: %s)" % c["order_id"])
    else:
        print("  TRADE-IN:  No order ID on Monday board")

    # Financials
    print("  SALE:      \u00a3%.0f  -  Purchase \u00a3%.0f  -  BM Fee \u00a3%.0f  -  Tax \u00a3%.0f  -  Parts \u00a3%.0f  -  Labour \u00a3%.0f  -  Ship \u00a3%.0f" % (
        c["sale"], c["purchase"], c["bm_fee"], c["tax"],
        c["parts"], c["labour"], c["shipping"]))
    print("  NET:       \u00a3%.2f" % c["net"])

print()
print("=" * 160)
print("SUMMARY")
print("=" * 160)

# Totals
total_net = sum(c["net"] for c in chain_data if c["sale"])
total_rev = sum(c["sale"] for c in chain_data)
losses = [c for c in chain_data if c["net"] < 0]
trades = [c for c in chain_data if c.get("bb_grade")]

print()
print("  Items:          %d" % len(chain_data))
print("  Revenue:        \u00a3%s" % "{:,.0f}".format(total_rev))
print("  Net profit:     \u00a3%s" % "{:,.0f}".format(total_net))
print("  Loss-makers:    %d" % len(losses))
print("  BM trade-ins:   %d" % len(trades))
print()

# Grade breakdown
by_grade = defaultdict(list)
for c in chain_data:
    grade = c.get("bb_grade", "UNKNOWN")
    by_grade[grade].append(c)

print("  BY TRADE-IN GRADE:")
print("  %-12s %5s %8s %8s %8s %8s" % ("Grade", "Count", "AvgOffer", "AvgParts", "AvgNet", "Losses"))
print("  " + "-" * 60)
for grade in sorted(by_grade.keys()):
    items = by_grade[grade]
    avg_offer = sum(c.get("bb_offer", 0) for c in items) / len(items)
    avg_parts = sum(c["parts"] for c in items) / len(items)
    avg_net = sum(c["net"] for c in items if c["sale"]) / max(1, len([c for c in items if c["sale"]]))
    loss_count = sum(1 for c in items if c["net"] < 0)
    print("  %-12s %5d %8.0f %8.0f %8.0f %8d" % (
        grade, len(items), avg_offer, avg_parts, avg_net, loss_count))

# Save full data
with open("/tmp/bm-full-chain-data.json", "w") as f:
    json.dump(chain_data, f, indent=2, default=str)
log("\nSaved to /tmp/bm-full-chain-data.json")
