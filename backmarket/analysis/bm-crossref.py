import json, subprocess, csv, sys, time
from collections import defaultdict

API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjUyNDgzODY2NSwiYWFpIjoxMSwidWlkIjoxMDM0NDE0LCJpYWQiOiIyMDI1LTA2LTExVDA4OjE1OjI0LjAwMFoiLCJwZXIiOiJtZTp3cml0ZSIsImFjdGlkIjo0MTk3ODAsInJnbiI6InVzZTEifQ.bxg7ibMAYprJa8Y-KPYmSvhgkrLbhJVTuO_uBxyq93Y"

def mq(query, retries=3):
    for attempt in range(retries):
        r = subprocess.run(["curl", "-s", "-X", "POST", "https://api.monday.com/v2",
            "-H", "Content-Type: application/json", "-H", "Authorization: %s" % API_KEY,
            "-H", "API-Version: 2024-10",
            "-d", json.dumps({"query": query})], capture_output=True, text=True)
        try:
            data = json.loads(r.stdout)
            if "errors" in data and "rate" in str(data["errors"]).lower():
                time.sleep(10)
                continue
            return data
        except:
            if attempt < retries - 1:
                time.sleep(2)
    return {"data": None}

def log(msg):
    print(msg, file=sys.stderr)
    sys.stderr.flush()

# ============================================================
# STEP 1: Load CSVs
# ============================================================
log("STEP 1: Loading CSVs...")
with open("/tmp/bm-orders.csv") as f:
    orders = list(csv.DictReader(f))
orders_by_id = {o["orderPublicId"]: o for o in orders}
paid_orders = [o for o in orders if o["status"] in ("MONEY_TRANSFERED", "PAID")]
log("  Orders: %d total, %d paid" % (len(orders), len(paid_orders)))

with open("/tmp/bm-listings.csv") as f:
    listings = list(csv.DictReader(f))
listings_by_sku = {}
for l in listings:
    sku = l.get("sku", "")
    if sku:
        listings_by_sku[sku] = l
log("  Listings: %d" % len(listings))

# ============================================================
# STEP 2: Pull BM board — financials + order_id
# ============================================================
log("STEP 2: Pulling BM board (financials)...")
bm_items = []
cursor = None
page = 0

while True:
    if cursor:
        q = '{ next_items_page(limit: 100, cursor: "%s") { cursor items { id name column_values(ids: ["text_mkqy3576", "numeric5", "numeric", "text89"]) { id text } } } }' % cursor
    else:
        q = '{ boards(ids: [3892194968]) { items_page(limit: 100) { cursor items { id name column_values(ids: ["text_mkqy3576", "numeric5", "numeric", "text89"]) { id text } } } } }'
    
    r = mq(q)
    if cursor:
        page_data = r.get("data", {}).get("next_items_page", {})
    else:
        page_data = r.get("data", {}).get("boards", [{}])[0].get("items_page", {})
    
    items = page_data.get("items", [])
    if not items:
        break
    
    for item in items:
        entry = {"monday_id": item["id"], "name": item["name"], "order_id": "", "sale": 0, "purchase": 0, "sku": ""}
        for cv in item["column_values"]:
            if cv["id"] == "text_mkqy3576": entry["order_id"] = (cv.get("text") or "").strip()
            elif cv["id"] == "numeric5":
                try: entry["sale"] = float(cv.get("text") or 0)
                except: pass
            elif cv["id"] == "numeric":
                try: entry["purchase"] = float(cv.get("text") or 0)
                except: pass
            elif cv["id"] == "text89": entry["sku"] = (cv.get("text") or "").strip()
        bm_items.append(entry)
    
    cursor = page_data.get("cursor")
    page += 1
    log("  Page %d: %d items (total: %d)" % (page, len(items), len(bm_items)))
    if not cursor:
        break

monday_by_order = {m["order_id"]: m for m in bm_items if m["order_id"]}
log("  BM board items: %d, with order ID: %d" % (len(bm_items), len(monday_by_order)))

# ============================================================
# STEP 3: Pull BM board — board_relation (separate query to avoid conflicts)
# ============================================================
log("STEP 3: Getting Main Board links...")
main_links = {}
cursor = None
page = 0

while True:
    if cursor:
        q = '{ next_items_page(limit: 100, cursor: "%s") { cursor items { id column_values(ids: ["board_relation"]) { ... on BoardRelationValue { linked_item_ids } } } } }' % cursor
    else:
        q = '{ boards(ids: [3892194968]) { items_page(limit: 100) { cursor items { id column_values(ids: ["board_relation"]) { ... on BoardRelationValue { linked_item_ids } } } } } }'
    
    r = mq(q)
    if cursor:
        page_data = r.get("data", {}).get("next_items_page", {})
    else:
        page_data = r.get("data", {}).get("boards", [{}])[0].get("items_page", {})
    
    items = page_data.get("items", [])
    if not items:
        break
    
    for item in items:
        for cv in item.get("column_values", []):
            ids = cv.get("linked_item_ids", [])
            if ids:
                main_links[item["id"]] = ids[0]
    
    cursor = page_data.get("cursor")
    page += 1
    if not cursor:
        break

log("  Items with Main Board link: %d" % len(main_links))

# ============================================================
# STEP 4: Get parts + labour from Main Board
# ============================================================
all_main_ids = list(set(main_links.values()))
log("STEP 4: Getting parts + labour for %d Main Board items..." % len(all_main_ids))

main_data = {}
for i in range(0, len(all_main_ids), 25):
    batch = all_main_ids[i:i+25]
    ids_str = ", ".join(batch)
    q = '{ items(ids: [%s]) { id column_values(ids: ["numbers9", "time_tracking", "time_tracking93"]) { id text ... on TimeTrackingValue { duration } } } }' % ids_str
    r = mq(q)
    
    for item in r.get("data", {}).get("items", []):
        parts = 0
        diag = 0
        refurb = 0
        for cv in item.get("column_values", []):
            if cv["id"] == "numbers9":
                try: parts = float(cv.get("text") or 0)
                except: pass
            elif cv["id"] == "time_tracking":
                diag = cv.get("duration") or 0
            elif cv["id"] == "time_tracking93":
                refurb = cv.get("duration") or 0
        main_data[item["id"]] = {"parts": parts, "labour_secs": diag + refurb}
    
    if (i // 25) % 10 == 0:
        log("  Batch %d/%d" % (i // 25 + 1, len(all_main_ids) // 25 + 1))

non_zero_parts = sum(1 for v in main_data.values() if v["parts"] > 0)
non_zero_labour = sum(1 for v in main_data.values() if v["labour_secs"] > 0)
log("  Parts data: %d/%d non-zero. Labour data: %d/%d non-zero." % (
    non_zero_parts, len(main_data), non_zero_labour, len(main_data)))

# ============================================================
# STEP 5: Pull BM fee + tax from BM board (formula columns, separate query)
# ============================================================
log("STEP 5: Getting BM fee + tax...")
fees = {}
cursor = None
page = 0

while True:
    if cursor:
        q = '{ next_items_page(limit: 100, cursor: "%s") { cursor items { id column_values(ids: ["formula", "formula7"]) { id ... on FormulaValue { display_value } } } } }' % cursor
    else:
        q = '{ boards(ids: [3892194968]) { items_page(limit: 100) { cursor items { id column_values(ids: ["formula", "formula7"]) { id ... on FormulaValue { display_value } } } } } }'
    
    r = mq(q)
    if cursor:
        page_data = r.get("data", {}).get("next_items_page", {})
    else:
        page_data = r.get("data", {}).get("boards", [{}])[0].get("items_page", {})
    
    items = page_data.get("items", [])
    if not items:
        break
    
    for item in items:
        fee = 0
        tax = 0
        for cv in item.get("column_values", []):
            val = (cv.get("display_value") or "0").replace(",","").replace("£","").strip()
            try:
                v = float(val)
            except:
                v = 0
            if cv["id"] == "formula": fee = v
            elif cv["id"] == "formula7": tax = v
        fees[item["id"]] = {"bm_fee": fee, "tax": tax}
    
    cursor = page_data.get("cursor")
    page += 1
    if not cursor:
        break

log("  Fees retrieved for %d items" % len(fees))

# ============================================================
# STEP 6: Cross-reference
# ============================================================
log("STEP 6: Cross-referencing...")
results = []
matched = 0
unmatched = []

for order in paid_orders:
    oid = order["orderPublicId"]
    monday = monday_by_order.get(oid)
    if not monday:
        unmatched.append(oid)
        continue
    
    matched += 1
    mid = monday["monday_id"]
    main_id = main_links.get(mid, "")
    md = main_data.get(main_id, {"parts": 0, "labour_secs": 0})
    fee_data = fees.get(mid, {"bm_fee": 0, "tax": 0})
    
    sale = monday["sale"]
    purchase = monday["purchase"]
    parts = md["parts"]
    labour = (md["labour_secs"] / 3600) * 15
    bm_fee = fee_data["bm_fee"]
    tax = fee_data["tax"]
    shipping = 15 if sale > 0 else 0
    
    net = (sale - purchase - bm_fee - tax - parts - labour - shipping) if sale > 0 else None
    
    try: bm_offer = float(order.get("originalPriceValue", 0))
    except: bm_offer = 0
    try: counter = float(order.get("counterOfferPriceValue", 0))
    except: counter = 0
    
    results.append({
        "order_id": oid, "bm_name": monday["name"], "monday_id": mid, "main_id": main_id,
        "device": order.get("listingTitle", ""), "bm_grade": order.get("listingGrade", ""),
        "listing_sku": order.get("listingSku", ""), "monday_sku": monday["sku"],
        "bm_offer": bm_offer, "counter_offer": counter,
        "counter_reasons": order.get("counterOfferReasons", ""),
        "suspend_reasons": order.get("suspendReasons", ""),
        "purchase": purchase, "sale": sale, "bm_fee": bm_fee, "tax": tax,
        "parts": parts, "labour": labour, "shipping": shipping, "net": net,
        "created": order.get("creationDate", "")[:10],
        "received": order.get("receivalDate", "")[:10],
        "paid": order.get("paymentDate", "")[:10],
    })

log("  Matched: %d / %d. Unmatched: %d" % (matched, len(paid_orders), len(unmatched)))

with open("/tmp/bm-crossref-data.json", "w") as f:
    json.dump(results, f, indent=2)

# ============================================================
# OUTPUT
# ============================================================
sold = [r for r in results if r["sale"] and r["sale"] > 0]
unsold = [r for r in results if not r["sale"] or r["sale"] == 0]
profitable = [r for r in sold if r["net"] is not None and r["net"] > 0]
loss_makers = [r for r in sold if r["net"] is not None and r["net"] < 0]

print("=" * 90)
print("BACKMARKET BUYBACK — FULL CROSS-REFERENCE (WITH PARTS + LABOUR)")
print("=" * 90)
print()
print("Matched: %d / %d paid orders" % (matched, len(paid_orders)))
print("  Sold:        %d" % len(sold))
print("  Not yet sold: %d" % len(unsold))
print("  Profitable:  %d (%.0f%%)" % (len(profitable), len(profitable)*100/max(len(sold),1)))
print("  Loss-making: %d (%.0f%%)" % (len(loss_makers), len(loss_makers)*100/max(len(sold),1)))
print()

total_rev = sum(r["sale"] for r in sold)
total_net = sum(r["net"] for r in sold if r["net"] is not None)
total_parts = sum(r["parts"] for r in sold)
total_labour = sum(r["labour"] for r in sold)
total_purchase = sum(r["purchase"] for r in sold)
print("FINANCIALS:")
print("  Revenue:    £%.0f" % total_rev)
print("  Purchases:  £%.0f" % total_purchase)
print("  Parts:      £%.0f" % total_parts)
print("  Labour:     £%.0f" % total_labour)
print("  Net Profit: £%.0f" % total_net)
print("  Net Margin: %.1f%%" % (total_net / total_rev * 100 if total_rev else 0))
print()

print("BY GRADE:")
print("%-10s %5s %5s %5s %8s %8s %8s %8s %8s %6s" % (
    "Grade", "Sold", "Win", "Loss", "AvgSale", "AvgPrch", "AvgPart", "AvgLabr", "AvgNet", "Loss%"))
by_grade = defaultdict(list)
for r in sold:
    by_grade[r["bm_grade"]].append(r)

for grade in ["DIAMOND", "PLATINUM", "GOLD", "SILVER", "BRONZE", "STALLONE"]:
    items = by_grade.get(grade, [])
    if not items: continue
    losses = [r for r in items if r["net"] is not None and r["net"] < 0]
    wins = [r for r in items if r["net"] is not None and r["net"] > 0]
    c = len(items)
    print("%-10s %5d %5d %5d %8.0f %8.0f %8.0f %8.0f %8.0f %5.0f%%" % (
        grade, c, len(wins), len(losses),
        sum(r["sale"] for r in items)/c, sum(r["purchase"] for r in items)/c,
        sum(r["parts"] for r in items)/c, sum(r["labour"] for r in items)/c,
        sum(r["net"] for r in items if r["net"] is not None)/c,
        len(losses)*100/c))

print()

if loss_makers:
    print("LOSS-MAKERS (%d items):" % len(loss_makers))
    print("%-10s %-50s %-8s %7s %7s %7s %7s %7s" % (
        "BM#", "Device", "Grade", "Sale", "Purch", "Parts", "Labour", "Net"))
    for r in sorted(loss_makers, key=lambda x: x["net"])[:30]:
        device = r["device"].split(" - QWERT")[0][:50] if r["device"] else r["bm_name"]
        print("%-10s %-50s %-8s %7.0f %7.0f %7.0f %7.0f %7.0f" % (
            r["bm_name"][:10], device, r["bm_grade"],
            r["sale"], r["purchase"], r["parts"], r["labour"], r["net"]))

print()
print("TOP 15 DEVICES BY TOTAL NET:")
by_device = defaultdict(list)
for r in sold:
    device = r["device"].split(" - QWERT")[0] if r["device"] else r["bm_name"]
    by_device[device].append(r)

device_stats = []
for device, items in by_device.items():
    c = len(items)
    tot = sum(r["net"] for r in items if r["net"] is not None)
    losses = len([r for r in items if r["net"] is not None and r["net"] < 0])
    avg_parts = sum(r["parts"] for r in items) / c
    device_stats.append((device, c, losses, tot, tot/c, avg_parts))

print("%-55s %5s %5s %8s %8s %8s" % ("Device", "Sold", "Loss", "TotNet", "AvgNet", "AvgPrt"))
for d, c, l, t, a, p in sorted(device_stats, key=lambda x: -x[3])[:15]:
    print("%-55s %5d %5d %8.0f %8.0f %8.0f" % (d[:55], c, l, t, a, p))

print()
print("BOTTOM 15 DEVICES BY TOTAL NET:")
print("%-55s %5s %5s %8s %8s %8s" % ("Device", "Sold", "Loss", "TotNet", "AvgNet", "AvgPrt"))
for d, c, l, t, a, p in sorted(device_stats, key=lambda x: x[3])[:15]:
    print("%-55s %5d %5d %8.0f %8.0f %8.0f" % (d[:55], c, l, t, a, p))

if unsold:
    print()
    tied = sum(r["purchase"] for r in unsold)
    print("UNSOLD: %d items, £%.0f tied up" % (len(unsold), tied))

log("Done. Saved to /tmp/bm-crossref-data.json")
