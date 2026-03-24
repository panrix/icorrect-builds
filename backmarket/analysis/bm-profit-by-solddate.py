import json
import subprocess
from datetime import datetime

API_KEY = "MONDAY_TOKEN_REDACTED"

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

# Load BM items
all_items = []
for f in ["/tmp/bm-items.json", "/tmp/bm-items-p2.json", "/tmp/bm-items-p3.json"]:
    data = json.load(open(f))
    all_items.extend(data["data"]["boards"][0]["items_page"]["items"])

start_date = datetime(2026, 2, 18)
end_date = datetime(2026, 2, 24, 23, 59, 59)

# Build target list
targets = []
skipped = []
for item in all_items:
    cols = {cv["id"]: cv for cv in item["column_values"]}
    ds = cols["lookup_mkq35gbg"].get("display_value", "")
    if not ds or not ds.strip():
        continue
    try:
        d = datetime.strptime(ds.strip(), "%Y-%m-%d")
    except ValueError:
        continue
    if not (start_date <= d <= end_date):
        continue

    def get_num(col):
        for key in ["text", "display_value", "value"]:
            val = col.get(key, "")
            if val and str(val) not in ["None", "null", ""]:
                try:
                    return float(str(val).replace(",", "").replace("\u00a3", "").replace('"', '').strip())
                except ValueError:
                    pass
        return None

    sp = get_num(cols["numeric5"])
    pp = get_num(cols["numeric"])
    if sp is None or pp is None:
        skipped.append((item["name"], item["id"], ds.strip()))
        continue

    bm_fee = get_num(cols["formula"]) or 0
    tax = get_num(cols["formula7"]) or 0

    targets.append({
        "bm_id": item["id"],
        "name": item["name"],
        "date": ds.strip(),
        "sale": sp,
        "purchase": pp,
        "bm_fee": bm_fee,
        "tax": tax,
    })

print("Target items: %d" % len(targets))
if skipped:
    print("Skipped (missing sale/purchase):")
    for name, iid, date in skipped:
        print("  %s (%s) - %s" % (name, iid, date))

# Step 1: Get Main Board links - one at a time
bm_to_main = {}
for t in targets:
    q = '{ items(ids: [%s]) { id column_values(ids: ["board_relation"]) { id ... on BoardRelationValue { linked_item_ids } } } }' % t["bm_id"]
    result = monday_query(q)
    for item in result["data"]["items"]:
        for cv in item["column_values"]:
            if cv["id"] == "board_relation" and cv.get("linked_item_ids"):
                bm_to_main[item["id"]] = cv["linked_item_ids"][0]

print("Linked to Main Board: %d/%d" % (len(bm_to_main), len(targets)))

# Step 2: Get Main Board data - RR&D + parts IDs - one at a time
main_data = {}
for main_id in set(bm_to_main.values()):
    q = '{ items(ids: [%s]) { id column_values(ids: ["formula__1", "connect_boards__1"]) { id ... on FormulaValue { display_value } ... on BoardRelationValue { linked_item_ids } } } }' % main_id
    result = monday_query(q)
    for item in result["data"]["items"]:
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

# Step 3: Get parts prices - ONE AT A TIME to avoid batch issues
all_parts = set()
for md in main_data.values():
    all_parts.update(md["parts_ids"])
all_parts = list(all_parts)
print("Parts items to query: %d" % len(all_parts))

parts_prices = {}
for pid in all_parts:
    q = '{ items(ids: [%s]) { id name column_values(ids: ["supply_price"]) { id text } } }' % pid
    result = monday_query(q)
    if "errors" in result:
        # Try getting all columns
        q = '{ items(ids: [%s]) { id name column_values { id text } } }' % pid
        result = monday_query(q)
        for item in result["data"]["items"]:
            for cv in item["column_values"]:
                if cv["id"] == "supply_price":
                    val = cv.get("text", "")
                    if val and val not in ["None", "null", ""]:
                        try:
                            parts_prices[item["id"]] = float(val.replace(",", "").replace("\u00a3", "").strip())
                        except ValueError:
                            pass
    else:
        for item in result["data"]["items"]:
            for cv in item["column_values"]:
                val = cv.get("text", "")
                if val and val not in ["None", "null", ""]:
                    try:
                        parts_prices[item["id"]] = float(val.replace(",", "").replace("\u00a3", "").strip())
                    except ValueError:
                        pass

print("Parts with prices: %d/%d" % (len(parts_prices), len(all_parts)))

# Step 4: Calculate
SHIPPING = 15.0
results = []

for t in targets:
    main_id = bm_to_main.get(t["bm_id"])
    labour = 0
    parts = 0
    notes = []

    if main_id and main_id in main_data:
        md = main_data[main_id]
        if md["rrd"] is not None:
            labour = md["rrd"] * 15
        else:
            notes.append("no RR&D data")
        for pid in md["parts_ids"]:
            if pid in parts_prices:
                parts += parts_prices[pid]
        if not md["parts_ids"]:
            notes.append("no parts linked")
    else:
        notes.append("NO MAIN BOARD LINK")

    net = t["sale"] - t["purchase"] - t["bm_fee"] - t["tax"] - parts - labour - SHIPPING

    results.append({
        "name": t["name"],
        "date": t["date"],
        "sale": t["sale"],
        "purchase": t["purchase"],
        "bm_fee": t["bm_fee"],
        "tax": t["tax"],
        "parts": round(parts, 2),
        "labour": round(labour, 2),
        "ship": SHIPPING,
        "net": round(net, 2),
        "note": ", ".join(notes),
    })

results.sort(key=lambda x: x["date"])

print()
print("=" * 150)
print("BM DEVICES - NET PROFIT REPORT - 18-24 Feb 2026")
print("=" * 150)
print()
print("%-18s %-12s %8s %8s %8s %8s %8s %8s %6s %10s  %s" % ("Name", "Date", "Sale", "Purch", "BM Fee", "Tax", "Parts", "Labour", "Ship", "NET", "Note"))
print("-" * 150)

totals = {"sale": 0, "purchase": 0, "bm_fee": 0, "tax": 0, "parts": 0, "labour": 0, "ship": 0, "net": 0}

for r in results:
    print("%-18s %-12s %8.2f %8.2f %8.2f %8.2f %8.2f %8.2f %6.0f %10.2f  %s" % (
        r["name"], r["date"], r["sale"], r["purchase"], r["bm_fee"], r["tax"],
        r["parts"], r["labour"], r["ship"], r["net"], r["note"]))
    for k in totals:
        totals[k] += r[k]

print("-" * 150)
print("%-18s %-12s %8.2f %8.2f %8.2f %8.2f %8.2f %8.2f %6.0f %10.2f" % (
    "TOTALS", "", totals["sale"], totals["purchase"], totals["bm_fee"], totals["tax"],
    totals["parts"], totals["labour"], totals["ship"], totals["net"]))

total_costs = totals["purchase"] + totals["bm_fee"] + totals["tax"] + totals["parts"] + totals["labour"] + totals["ship"]
margin = (totals["net"] / totals["sale"] * 100) if totals["sale"] else 0

print()
print("  Items sold:        %d" % len(results))
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

# Flag loss-makers
losses = [r for r in results if r["net"] < 0]
if losses:
    print("  LOSS-MAKING ITEMS:")
    for r in losses:
        print("    %s (%s): \u00a3%.2f" % (r["name"], r["date"], r["net"]))
    print()

zero_parts = sum(1 for r in results if r["parts"] == 0)
print("  Items with \u00a30 parts: %d/%d" % (zero_parts, len(results)))
if zero_parts:
    for r in results:
        if r["parts"] == 0:
            print("    %s - %s" % (r["name"], r["note"] if r["note"] else "parts have no supply_price"))
