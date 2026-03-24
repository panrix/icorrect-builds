#!/usr/bin/env python3
"""Check 8 missing BM order IDs directly against the main Monday board.

Queries main board (349212843) column text_mky01vb4 (BM Trade-in ID).
"""
import json, sys, os, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bm_utils import load_env, monday_query

env = load_env()

MISSING_ORDER_IDS = [
    "GB-26085-VLXUG",
    "GB-26053-BURRH",
    "GB-26063-LSMJW",
    "GB-26052-PRBJO",
    "GB-26014-XYUFE",
    "GB-25522-KYPDX",
    "GB-25485-BFHQG",
    "GB-25393-XXOAL",
]

MAIN_BOARD_ID = "349212843"

# Columns to pull for context
COLS = [
    "status4",          # Status
    "status24",         # Repair Type
    "status",           # Client
    "text_mky01vb4",    # BM Trade-in ID
    "date4",            # Received
    "collection_date",  # Date Repaired
    "person",           # Technician
]

COL_NAMES = {
    "status4": "status",
    "status24": "repair_type",
    "status": "client",
    "text_mky01vb4": "bm_tradein_id",
    "date4": "received",
    "collection_date": "date_repaired",
    "person": "technician",
}

print("Searching main board (349212843) for %d missing order IDs..." % len(MISSING_ORDER_IDS))
print()

# Paginate through the entire main board and check for matches
# (Monday doesn't support WHERE on text columns via GraphQL, so we pull all BM items)
all_items = []
cursor = None
page = 0
col_str = '", "'.join(COLS)

while True:
    if cursor:
        q = '{ next_items_page(limit: 200, cursor: "%s") { cursor items { id name group { title } column_values(ids: ["%s"]) { id text } } } }' % (cursor, col_str)
    else:
        q = '{ boards(ids: [%s]) { items_page(limit: 200) { cursor items { id name group { title } column_values(ids: ["%s"]) { id text } } } } }' % (MAIN_BOARD_ID, col_str)

    r = monday_query(q, env)
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
    print("  Page %d: %d items (total: %d)" % (page, len(items), len(all_items)), file=sys.stderr)

    if not cursor:
        break

print("Total main board items scanned: %d" % len(all_items), file=sys.stderr)
print()

# Build lookup: bm_tradein_id -> item data
missing_set = set(MISSING_ORDER_IDS)
found = []
all_bm_items = []

for item in all_items:
    tradein_id = ""
    entry = {"main_id": item["id"], "name": item["name"],
             "group": item.get("group", {}).get("title", "")}
    for cv in item["column_values"]:
        fname = COL_NAMES.get(cv["id"], cv["id"])
        entry[fname] = (cv.get("text") or "").strip()
        if cv["id"] == "text_mky01vb4":
            tradein_id = (cv.get("text") or "").strip()

    if tradein_id:
        all_bm_items.append(entry)
        if tradein_id in missing_set:
            entry["matched_order_id"] = tradein_id
            found.append(entry)

print("=" * 90)
print("MAIN BOARD SEARCH RESULTS")
print("=" * 90)
print()
print("Items on main board with a BM Trade-in ID: %d" % len(all_bm_items))
print("Missing orders found on main board: %d / %d" % (len(found), len(MISSING_ORDER_IDS)))
print()

if found:
    print("FOUND ON MAIN BOARD:")
    print("-" * 90)
    print("%-20s %-12s %-20s %-18s %-10s %-10s %-15s" % (
        "Order ID", "Item Name", "Group", "Status", "Received", "Repaired", "Technician"))
    print("-" * 90)
    for f in found:
        print("%-20s %-12s %-20s %-18s %-10s %-10s %-15s" % (
            f["matched_order_id"],
            f["name"][:12],
            f["group"][:20],
            f.get("status", "")[:18],
            f.get("received", "")[:10],
            f.get("date_repaired", "")[:10],
            f.get("technician", "")[:15]))
    print()

not_found = missing_set - {f["matched_order_id"] for f in found}
if not_found:
    print("STILL MISSING (not on main board either):")
    for oid in sorted(not_found):
        print("  %s" % oid)
    print()

print("SUMMARY:")
print("  %d / %d found on main board (just not linked from BM board)" % (len(found), len(MISSING_ORDER_IDS)))
print("  %d / %d genuinely missing — not tracked anywhere" % (len(not_found), len(MISSING_ORDER_IDS)))
