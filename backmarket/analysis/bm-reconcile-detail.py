#!/usr/bin/env python3
"""Deep dive on the 8 gap orders.

1. Pull full BM order detail from the API for all 8
2. Find Monday item IDs for the 2 that need linking
3. Update the board_relation on the BM board to link them to main board
"""
import json, sys, os, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bm_utils import load_env, monday_query, bm_api_call

env = load_env()

ORDER_IDS = [
    "GB-26053-BURRH",
    "GB-26063-LSMJW",
    "GB-26014-XYUFE",
    "GB-25522-KYPDX",
    "GB-25485-BFHQG",
    "GB-25393-XXOAL",
    # These 2 are on main board but need BM board link fixed
    "GB-26052-PRBJO",
    "GB-26085-VLXUG",
]

NEEDS_LINKING = {"GB-26052-PRBJO", "GB-26085-VLXUG"}

# ================================================================
# STEP 1: Pull full BM API detail for each order
# ================================================================
print("=" * 90)
print("STEP 1: Pulling BM API detail for %d orders" % len(ORDER_IDS))
print("=" * 90)
print()

bm_details = {}
for oid in ORDER_IDS:
    try:
        data = bm_api_call("GET", "ws/buyback/v1/orders/%s" % oid, env=env)
        bm_details[oid] = data
        time.sleep(1)  # rate limit

        status = data.get("status", "?")
        created = (data.get("creationDate") or "")[:10]
        shipped = (data.get("shippingDate") or "")[:10]
        received = (data.get("receivalDate") or "")[:10]
        paid = (data.get("paymentDate") or "")[:10]
        offer = data.get("originalPriceValue", 0)
        counter = data.get("counterOfferPriceValue", 0)
        counter_reasons = data.get("counterOfferReasons", "")
        suspend_reasons = data.get("suspendReasons", "")
        title = (data.get("listingTitle") or "").split(" - QWERT")[0][:50]
        grade = data.get("listingGrade", "")
        sku = data.get("listingSku", "")
        tracking = data.get("trackingNumber", "")
        carrier = data.get("carrier", "")

        tag = " [NEEDS LINK FIX]" if oid in NEEDS_LINKING else " [MISSING]"
        print("%s%s" % (oid, tag))
        print("  Device:    %s" % title)
        print("  SKU:       %s" % sku)
        print("  Grade:     %s" % grade)
        print("  Status:    %s" % status)
        print("  Offer:     £%.0f" % (offer or 0))
        if counter:
            print("  Counter:   £%.0f (%s)" % (counter, counter_reasons))
        if suspend_reasons:
            print("  Suspended: %s" % suspend_reasons)
        print("  Created:   %s" % created)
        print("  Shipped:   %s" % shipped)
        print("  Received:  %s" % received)
        print("  Paid:      %s" % paid)
        if tracking:
            print("  Tracking:  %s (%s)" % (tracking, carrier))
        print()

    except Exception as e:
        print("%s — API ERROR: %s" % (oid, e))
        print()

# ================================================================
# STEP 2: Find Monday item IDs for the 2 that need linking
# ================================================================
print("=" * 90)
print("STEP 2: Finding Monday item IDs for linking")
print("=" * 90)
print()

# Find main board items by BM Trade-in ID
for oid in NEEDS_LINKING:
    # Search main board for this order ID in text_mky01vb4
    # We already know the item names from previous run, but need the IDs
    # Pull all items with this trade-in ID
    cursor = None
    found_items = []

    while True:
        if cursor:
            q = '{ next_items_page(limit: 200, cursor: "%s") { cursor items { id name group { title } column_values(ids: ["text_mky01vb4", "status4"]) { id text } } } }' % cursor
        else:
            q = '{ boards(ids: [349212843]) { items_page(limit: 200) { cursor items { id name group { title } column_values(ids: ["text_mky01vb4", "status4"]) { id text } } } } }'

        r = monday_query(q, env)
        if cursor:
            page_data = r.get("data", {}).get("next_items_page", {})
        else:
            boards = r.get("data", {}).get("boards", [{}])
            page_data = boards[0].get("items_page", {}) if boards else {}

        items = page_data.get("items", [])
        if not items:
            break

        for item in items:
            for cv in item["column_values"]:
                if cv["id"] == "text_mky01vb4" and (cv.get("text") or "").strip() == oid:
                    status = ""
                    for cv2 in item["column_values"]:
                        if cv2["id"] == "status4":
                            status = (cv2.get("text") or "").strip()
                    found_items.append({
                        "id": item["id"],
                        "name": item["name"],
                        "group": item.get("group", {}).get("title", ""),
                        "status": status,
                    })

        cursor = page_data.get("cursor")
        if not cursor:
            break

    print("Order %s — Main board matches:" % oid)
    for fi in found_items:
        print("  ID: %-15s Name: %-20s Group: %-25s Status: %s" % (
            fi["id"], fi["name"], fi["group"], fi["status"]))
    print()

# Now find the BM board items for these orders
print("BM Board items for orders needing link fix:")
cursor = None
bm_board_matches = {}

while True:
    if cursor:
        q = '{ next_items_page(limit: 200, cursor: "%s") { cursor items { id name column_values(ids: ["text_mkqy3576"]) { id text } } } }' % cursor
    else:
        q = '{ boards(ids: [3892194968]) { items_page(limit: 200) { cursor items { id name column_values(ids: ["text_mkqy3576"]) { id text } } } } }'

    r = monday_query(q, env)
    if cursor:
        page_data = r.get("data", {}).get("next_items_page", {})
    else:
        boards = r.get("data", {}).get("boards", [{}])
        page_data = boards[0].get("items_page", {}) if boards else {}

    items = page_data.get("items", [])
    if not items:
        break

    for item in items:
        for cv in item["column_values"]:
            order_id = (cv.get("text") or "").strip()
            if order_id in NEEDS_LINKING:
                bm_board_matches[order_id] = {"id": item["id"], "name": item["name"]}

    cursor = page_data.get("cursor")
    if not cursor:
        break

for oid in NEEDS_LINKING:
    match = bm_board_matches.get(oid)
    if match:
        print("  %s -> BM board item ID: %s (%s)" % (oid, match["id"], match["name"]))
    else:
        print("  %s -> NOT on BM board" % oid)
print()

# ================================================================
# STEP 3: Update board_relation on BM board
# ================================================================
print("=" * 90)
print("STEP 3: Linking BM board items to Main board items")
print("=" * 90)
print()

# We need: for each order in NEEDS_LINKING
# - BM board item ID (from bm_board_matches)
# - Main board item ID (the one that's actually being worked on, not the duplicate)
# The working items are the ones NOT in "Incoming Future"

# Re-scan to get the right main board IDs (non-duplicate ones)
for oid in NEEDS_LINKING:
    bm_item = bm_board_matches.get(oid)
    if not bm_item:
        print("  %s: No BM board item found, skipping" % oid)
        continue

    # Find main board item that's NOT "Expecting Device" / "Incoming Future"
    cursor = None
    best_main = None

    while True:
        if cursor:
            q = '{ next_items_page(limit: 200, cursor: "%s") { cursor items { id name group { title } column_values(ids: ["text_mky01vb4", "status4"]) { id text } } } }' % cursor
        else:
            q = '{ boards(ids: [349212843]) { items_page(limit: 200) { cursor items { id name group { title } column_values(ids: ["text_mky01vb4", "status4"]) { id text } } } } }'

        r = monday_query(q, env)
        if cursor:
            page_data = r.get("data", {}).get("next_items_page", {})
        else:
            boards = r.get("data", {}).get("boards", [{}])
            page_data = boards[0].get("items_page", {}) if boards else {}

        items = page_data.get("items", [])
        if not items:
            break

        for item in items:
            for cv in item["column_values"]:
                if cv["id"] == "text_mky01vb4" and (cv.get("text") or "").strip() == oid:
                    group = item.get("group", {}).get("title", "")
                    status = ""
                    for cv2 in item["column_values"]:
                        if cv2["id"] == "status4":
                            status = (cv2.get("text") or "").strip()
                    # Pick the active one (not the "Incoming Future" duplicate)
                    if "Incoming" not in group:
                        best_main = {"id": item["id"], "name": item["name"],
                                     "group": group, "status": status}

        cursor = page_data.get("cursor")
        if not cursor:
            break

    if best_main:
        print("  %s:" % oid)
        print("    BM board item:   %s (%s)" % (bm_item["id"], bm_item["name"]))
        print("    Main board item: %s (%s, %s, %s)" % (
            best_main["id"], best_main["name"], best_main["group"], best_main["status"]))

        # Update the board_relation column on the BM board item
        mutation = 'mutation { change_column_value(board_id: 3892194968, item_id: %s, column_id: "board_relation", value: "{\\"item_ids\\": [%s]}") { id } }' % (
            bm_item["id"], best_main["id"])

        r = monday_query(mutation, env)
        if r.get("data", {}).get("change_column_value"):
            print("    LINKED successfully")
        else:
            print("    LINK FAILED: %s" % json.dumps(r))
    else:
        print("  %s: No active main board item found" % oid)

    print()
