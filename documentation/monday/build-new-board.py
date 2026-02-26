#!/usr/bin/env python3
"""
Build iCorrect Main Board v2 — clean board from scratch.
Based on: main-board-column-audit.md + target-state.md
Does NOT touch the current Main board (349212843).

Connected board IDs:
  - Devices: 3923707691
  - Parts/Stock Levels: 985177480
  - Products & Pricing: 2477699024
  - Client Information Capture: 9490904355
  - Enquiries: 7494394307
"""

import json
import os
import sys
import time
import requests

API_URL = "https://api.monday.com/v2"

# Read token from config
with open("/home/ricky/config/.env") as f:
    for line in f:
        if line.startswith("MONDAY_API_TOKEN="):
            TOKEN = line.strip().split("=", 1)[1]
            break

HEADERS = {"Content-Type": "application/json", "Authorization": TOKEN}
WORKSPACE_ID = 977316

# Rate limit helper
call_count = 0
def api_call(query, variables=None):
    global call_count
    call_count += 1
    if call_count % 10 == 0:
        time.sleep(1)  # Avoid rate limiting
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    resp = requests.post(API_URL, headers=HEADERS, json=payload)
    data = resp.json()
    if "errors" in data:
        print(f"  ERROR: {data['errors']}", file=sys.stderr)
        return None
    return data


def create_board():
    """Step 1: Create the empty board."""
    print("=== Creating board: iCorrect Main Board v2 ===")
    data = api_call('''
        mutation {
            create_board(
                board_name: "iCorrect Main Board v2",
                board_kind: public,
                workspace_id: %d
            ) { id }
        }
    ''' % WORKSPACE_ID)
    if not data:
        sys.exit("Failed to create board")
    board_id = data["data"]["create_board"]["id"]
    print(f"  Board created: {board_id}")
    return board_id


def create_column(board_id, title, col_type, defaults=None):
    """Create a single column. Returns column ID."""
    escaped_title = title.replace('"', '\\"')
    defaults_arg = ""
    if defaults:
        escaped_defaults = json.dumps(json.dumps(defaults))
        defaults_arg = f", defaults: {escaped_defaults}"

    query = f'''
        mutation {{
            create_column(
                board_id: "{board_id}",
                title: "{escaped_title}",
                column_type: {col_type}{defaults_arg}
            ) {{ id title }}
        }}
    '''
    data = api_call(query)
    if data:
        col_id = data["data"]["create_column"]["id"]
        print(f"  + {title} ({col_type}) -> {col_id}")
        return col_id
    else:
        print(f"  FAILED: {title} ({col_type})")
        return None


def create_group(board_id, title):
    """Create a board group."""
    escaped = title.replace('"', '\\"')
    data = api_call(f'''
        mutation {{
            create_group(board_id: "{board_id}", group_name: "{escaped}") {{ id }}
        }}
    ''')
    if data:
        gid = data["data"]["create_group"]["id"]
        print(f"  + Group: {title} -> {gid}")
        return gid
    return None


def delete_default_group(board_id):
    """Delete the default 'New Group' that Monday creates."""
    data = api_call(f'''
        query {{ boards(ids: ["{board_id}"]) {{ groups {{ id title }} }} }}
    ''')
    if data:
        for g in data["data"]["boards"][0]["groups"]:
            if g["title"] in ("New Group", "Group Title"):
                api_call(f'''
                    mutation {{ delete_group(board_id: "{board_id}", group_id: "{g['id']}") {{ id }} }}
                ''')
                print(f"  - Deleted default group: {g['title']}")


def build_columns(board_id):
    """Step 2: Create all columns on the new board."""
    print("\n=== Creating columns ===")
    columns = {}

    # --- CORE STATUS COLUMNS (REMAP + NEW) ---
    print("\n-- Status columns (core) --")

    # 1. Repair Status (replaces status4 — 14 values)
    columns["repair_status"] = create_column(board_id, "Repair Status", "status", {
        "labels": {
            "0": "New Repair", "1": "Booking Confirmed", "2": "Received",
            "3": "Queued For Repair", "4": "Diagnostics", "5": "Diagnostic Complete",
            "6": "Under Repair", "7": "Under Refurb", "8": "Battery Testing",
            "9": "Repair Paused", "10": "Repaired", "11": "Complete",
            "12": "Returned", "13": "BER/Parts"
        }
    })

    # 2. QC Status (NEW)
    columns["qc_status"] = create_column(board_id, "QC Status", "status", {
        "labels": {"0": "Testing", "1": "Pass", "2": "Fail"}
    })

    # 3. Comms Status (NEW)
    columns["comms_status"] = create_column(board_id, "Comms Status", "status", {
        "labels": {
            "0": "Client To Contact", "1": "Contacted", "2": "Awaiting Response",
            "3": "Quote Sent", "4": "Quote Accepted", "5": "Invoiced",
            "6": "Confirmed", "7": "Declined"
        }
    })

    # 4. Trade-in Status (REMAP — 11 values)
    columns["tradein_status"] = create_column(board_id, "Trade-in Status", "status", {
        "labels": {
            "0": "Trade-in", "1": "Received", "2": "Intake",
            "3": "Pay-Out", "4": "Purchased", "5": "To List",
            "6": "Listed", "7": "Sold", "8": "Counter",
            "9": "Return", "10": "Cancelled", "11": "N/A"
        }
    })

    # 5. Pause Reason (NEW)
    columns["pause_reason"] = create_column(board_id, "Pause Reason", "status", {
        "labels": {
            "0": "Awaiting Parts", "1": "Awaiting Customer",
            "2": "Technical Issue", "3": "iCloud Lock",
            "4": "Requires Specialist", "5": "Other"
        }
    })

    # 6. Shipping Status (NEW)
    columns["shipping_status"] = create_column(board_id, "Shipping Status", "status", {
        "labels": {
            "0": "N/A", "1": "Book Courier", "2": "Courier Booked",
            "3": "In Transit (Inbound)", "4": "Received",
            "5": "Book Return", "6": "Return Booked",
            "7": "In Transit (Outbound)", "8": "Delivered"
        }
    })

    # --- OTHER STATUS COLUMNS (KEEP) ---
    print("\n-- Status columns (keep) --")

    # Repair Type (REMAP — cleaned, BM lifecycle removed)
    columns["repair_type"] = create_column(board_id, "Repair Type", "status", {
        "labels": {
            "0": "Diagnostic", "1": "Repair", "2": "Board Level",
            "3": "Manual", "4": "Parts", "5": "IC ON", "6": "IC OFF",
            "7": "Unconfirmed"
        }
    })

    columns["payment_status"] = create_column(board_id, "Payment Status", "status", {
        "labels": {
            "0": "Pending", "1": "Confirmed", "2": "Warranty",
            "3": "Unsuccessful", "4": "BM Sale"
        }
    })

    columns["payment_method"] = create_column(board_id, "Payment Method", "status", {
        "labels": {
            "0": "Card", "1": "Cash", "2": "Bank Transfer",
            "3": "Invoiced - Xero", "4": "BM Sale", "5": "Warranty"
        }
    })

    columns["parts_status"] = create_column(board_id, "Parts Status", "status", {
        "labels": {
            "0": "In Stock", "1": "No Stock", "2": "Awaiting Parts",
            "3": "Parts Arrived", "4": "Error"
        }
    })

    columns["parts_deducted"] = create_column(board_id, "Parts Deducted", "status", {
        "labels": {"0": "Do Now!", "1": "Done", "2": "N/A"}
    })

    columns["courier_collection"] = create_column(board_id, "Courier Collection", "status", {
        "labels": {
            "0": "Book Courier", "1": "Courier Booked",
            "2": "Booking Failed", "3": "Error"
        }
    })

    columns["courier_return"] = create_column(board_id, "Courier Return", "status", {
        "labels": {
            "0": "Book Return", "1": "Return Booked",
            "2": "Booking Failed", "3": "Error"
        }
    })

    columns["invoice_status"] = create_column(board_id, "Invoice Status", "status", {
        "labels": {
            "0": "Draft", "1": "Sent", "2": "Paid",
            "3": "Overdue", "4": "Error", "5": "Voided"
        }
    })

    columns["invoice_action"] = create_column(board_id, "Invoice Action", "status", {
        "labels": {"0": "Create Invoice", "1": "Done"}
    })

    columns["info_capture"] = create_column(board_id, "Info Capture", "status", {
        "labels": {
            "0": "Not Filled", "1": "Info Validated",
            "2": "Not Info Validated"
        }
    })

    columns["source"] = create_column(board_id, "Source", "status", {
        "labels": {
            "0": "Walk-In", "1": "Shopify", "2": "Referral",
            "3": "Corporate", "4": "Back Market", "5": "Other"
        }
    })

    columns["client"] = create_column(board_id, "Client", "status", {
        "labels": {
            "0": "End User", "1": "BM", "2": "Corporate",
            "3": "Warranty", "4": "Refurb"
        }
    })

    columns["problem_repair"] = create_column(board_id, "Problem (Repair)", "status", {
        "labels": {
            "0": "Stuck", "1": "Deadline Delay", "2": "Solving", "3": "Solved"
        }
    })

    columns["notifications"] = create_column(board_id, "Notifications", "status", {
        "labels": {"0": "ON", "1": "OFF", "2": "Unconfirmed"}
    })

    columns["service"] = create_column(board_id, "Service", "status", {
        "labels": {
            "0": "Walk-In", "1": "Mail-In", "2": "Stuart Courier",
            "3": "Unconfirmed"
        }
    })

    columns["passcode_verified"] = create_column(board_id, "Passcode Verified", "status", {
        "labels": {"0": "Yes", "1": "No", "2": "N/A"}
    })

    columns["case"] = create_column(board_id, "Case", "status")
    columns["basic_test"] = create_column(board_id, "Basic Test", "status")

    # --- GRADING & QC STATUS COLUMNS ---
    print("\n-- Grading columns --")
    columns["final_grade"] = create_column(board_id, "Final Grade", "status")
    columns["lcd_pregrade"] = create_column(board_id, "LCD - Pre-Grade", "status")
    columns["lid_pregrade"] = create_column(board_id, "Lid - Pre-Grade", "status")
    columns["topcase_pregrade"] = create_column(board_id, "Top Case - Pre-Grade", "status")
    columns["icloud"] = create_column(board_id, "iCloud", "status")

    # --- BM REPORTED VS ACTUAL ---
    print("\n-- BM Reported vs Actual --")
    for field in ["Battery", "Screen", "Casing", "Function"]:
        columns[f"{field.lower()}_reported"] = create_column(board_id, f"{field} (Reported)", "status")
        columns[f"{field.lower()}_actual"] = create_column(board_id, f"{field} (Actual)", "status")
    columns["liquid_damage"] = create_column(board_id, "Liquid Damage?", "status", {
        "labels": {"0": "Yes", "1": "No"}
    })

    # --- PEOPLE COLUMNS ---
    print("\n-- People columns --")
    columns["technician"] = create_column(board_id, "Technician", "people")
    columns["diagnostic_person"] = create_column(board_id, "Diagnostic", "people")
    columns["repair_person"] = create_column(board_id, "Repair", "people")
    columns["refurb_person"] = create_column(board_id, "Refurb", "people")
    columns["bm_diag_tech"] = create_column(board_id, "BM Diag Tech", "people")
    columns["qc_by"] = create_column(board_id, "QC By", "people")

    # --- DATE COLUMNS ---
    print("\n-- Date columns --")
    columns["received"] = create_column(board_id, "Received", "date")
    columns["deadline"] = create_column(board_id, "Deadline", "date")
    columns["booking_time"] = create_column(board_id, "Booking Time", "date")
    columns["date_repaired"] = create_column(board_id, "Date Repaired", "date")
    columns["collection_date"] = create_column(board_id, "Collection Date", "date")
    columns["diag_complete"] = create_column(board_id, "Diag. Complete", "date")
    columns["quote_sent"] = create_column(board_id, "Quote Sent", "date")
    columns["qc_time"] = create_column(board_id, "QC Time", "date")
    # BM dates
    columns["date_listed_bm"] = create_column(board_id, "Date Listed (BM)", "date")
    columns["date_sold_bm"] = create_column(board_id, "Date Sold (BM)", "date")
    columns["date_purchased_bm"] = create_column(board_id, "Date Purchased (BM)", "date")

    # --- TIME TRACKING COLUMNS ---
    print("\n-- Time tracking columns --")
    columns["total_time"] = create_column(board_id, "Total Time", "time_tracking")
    columns["diagnostic_time"] = create_column(board_id, "Diagnostic Time", "time_tracking")
    columns["repair_time"] = create_column(board_id, "Repair Time", "time_tracking")
    columns["refurb_time"] = create_column(board_id, "Refurb Time", "time_tracking")
    columns["cleaning_time"] = create_column(board_id, "Cleaning Time", "time_tracking")

    # --- TEXT COLUMNS ---
    print("\n-- Text columns --")
    columns["imei_sn"] = create_column(board_id, "IMEI/SN", "text")
    columns["colour"] = create_column(board_id, "Colour", "text")  # Team uses text, not status
    columns["ammeter"] = create_column(board_id, "Ammeter Reading", "text")
    columns["keyboard"] = create_column(board_id, "Keyboard", "text")
    columns["device_passcode"] = create_column(board_id, "Device Passcode", "text")  # renamed from Passcode
    columns["walk_in_notes"] = create_column(board_id, "Walk-in Notes", "text")
    columns["company"] = create_column(board_id, "Company", "text")
    columns["address"] = create_column(board_id, "Address", "text")  # renamed from Street Name/Number
    columns["post_code"] = create_column(board_id, "Post Code", "text")
    columns["priority"] = create_column(board_id, "Priority (0-10)", "text")  # renamed from Priority
    columns["bm_tradein_id"] = create_column(board_id, "BM Trade-in ID", "text")
    columns["bm_listing_uuid"] = create_column(board_id, "BM Listing UUID", "text")
    columns["inbound_tracking"] = create_column(board_id, "Inbound Tracking", "text")
    columns["outbound_tracking"] = create_column(board_id, "Outbound Tracking", "text")
    columns["gophr_link"] = create_column(board_id, "Gophr Link", "text")
    columns["intercom_id"] = create_column(board_id, "Intercom ID", "text")
    columns["part_to_order"] = create_column(board_id, "Part to Order", "text")
    columns["order_reference"] = create_column(board_id, "Order Reference", "text")
    columns["xero_invoice_id"] = create_column(board_id, "Xero Invoice ID", "text")
    columns["batt_health"] = create_column(board_id, "Batt Health", "numbers")

    # --- CONTACT COLUMNS ---
    print("\n-- Contact columns --")
    columns["email"] = create_column(board_id, "Email", "email")
    columns["phone"] = create_column(board_id, "Phone Number", "phone")

    # --- LINK COLUMNS ---
    print("\n-- Link columns --")
    columns["ticket"] = create_column(board_id, "Ticket", "link")
    columns["xero_invoice_url"] = create_column(board_id, "Xero Invoice URL", "link")

    # --- FINANCIAL NUMBERS ---
    print("\n-- Financial columns --")
    columns["discount"] = create_column(board_id, "Discount", "numbers")
    columns["paid"] = create_column(board_id, "Paid", "numbers")
    columns["invoice_amount"] = create_column(board_id, "Invoice Amount", "numbers")

    # --- SUPPLIER ---
    print("\n-- Supplier --")
    columns["supplier"] = create_column(board_id, "Supplier", "dropdown")

    # --- BOARD RELATIONS ---
    print("\n-- Board relations --")
    # Device → Devices board
    columns["device"] = create_column(board_id, "Device", "board_relation",
        {"boardIds": [3923707691]})

    # Parts Used → Parts/Stock Levels board
    columns["parts_used"] = create_column(board_id, "Parts Used", "board_relation",
        {"boardIds": [985177480]})

    # Parts Required → Parts/Stock Levels board
    columns["parts_required"] = create_column(board_id, "Parts Required", "board_relation",
        {"boardIds": [985177480]})

    # Requested Repairs → Products & Pricing board
    columns["requested_repairs"] = create_column(board_id, "Requested Repairs", "board_relation",
        {"boardIds": [2477699024]})

    # Custom Products → Products & Pricing board
    columns["custom_products"] = create_column(board_id, "Custom Products", "board_relation",
        {"boardIds": [2477699024]})

    # Link - Client Information Capture
    columns["client_info_link"] = create_column(board_id, "Link - Client Information Capture", "board_relation",
        {"boardIds": [9490904355]})

    print(f"\n=== Total columns created: {len(columns)} ===")
    return columns


def build_groups(board_id):
    """Step 3: Create all groups per target-state.md Section 3."""
    print("\n=== Creating groups ===")
    groups = {}

    # Create in reverse order so they appear in correct order (Monday prepends)
    group_names = [
        "Returned",
        "Trade-In Locked / Counteroffer",
        "BMs Awaiting Sale",
        "Client Services - Awaiting Confirmation",
        "Client Services - To Do",
        "Outbound Shipping",
        "Awaiting Collection",
        "Awaiting Confirmation of Price",
        "Awaiting Parts",
        "Quality Control",
        "Ferrari",
        "Mykhailo",
        "Andres",
        "Safan (Short Deadline)",
        "Incoming Future",
        "Today's Repairs",
        "New Orders",
        # Merged groups from target-state
        "Dead / Uncollected",
        "BM Dead / iCloud",
        "Follow Up Required",
    ]

    for name in reversed(group_names):
        groups[name] = create_group(board_id, name)
        time.sleep(0.3)  # Avoid rate limiting

    # Delete the default group that Monday creates
    delete_default_group(board_id)

    print(f"\n=== Total groups created: {len(groups)} ===")
    return groups


def main():
    print("=" * 60)
    print("  iCorrect Main Board v2 — Build Script")
    print("  Based on: main-board-column-audit.md + target-state.md")
    print("  Current board (349212843) is NOT touched.")
    print("=" * 60)

    # Step 1: Create board
    board_id = create_board()

    # Step 2: Create columns
    columns = build_columns(board_id)

    # Step 3: Create groups
    groups = build_groups(board_id)

    # Summary
    print("\n" + "=" * 60)
    print(f"  BUILD COMPLETE")
    print(f"  Board ID: {board_id}")
    print(f"  Columns: {len(columns)}")
    print(f"  Groups: {len(groups)}")
    print(f"  API calls: {call_count}")
    print(f"  Board URL: https://panrix.monday.com/boards/{board_id}")
    print("=" * 60)

    # Notes on what needs manual setup:
    print("\n=== MANUAL SETUP NEEDED ===")
    print("1. Mirror columns — cannot be created via API. Set up in Monday UI:")
    print("   - Parts Cost (mirror from Parts Used)")
    print("   - Stock Level (mirror from Parts Required)")
    print("   - Intake Condition (mirror from Client Info Capture)")
    print("   - Fault to Repair (Details) (mirror from Client Info Capture)")
    print("   - Further Faults (mirror from Client Info Capture)")
    print("   - Client Notes (mirror from Client Info Capture)")
    print("   - Previous Repairs (mirror from Client Info Capture)")
    print("   - Notes for Repairer (mirror from Client Info Capture)")
    print("   - Collection Notes (mirror from Client Info Capture)")
    print("   - Data (mirror from Client Info Capture)")
    print("   - Been to Apple? (mirror from Client Info Capture)")
    print("   - New or Refurb? (mirror from Client Info Capture)")
    print("   - Battery (mirror from Client Info Capture)")
    print("   - Requested Repairs Price (mirror from Products & Pricing)")
    print("   - Custom Repairs Price (mirror from Products & Pricing)")
    print("")
    print("2. Formula columns — set up in Monday UI:")
    print("   - Quote = Requested Repairs Price + Custom Repairs Price - Discount")
    print("   - On Time? = IF(Date Repaired <= Deadline, 'Yes', 'No')")
    print("   - Total Labour = Diagnostic Time + Repair Time + Refurb Time + Cleaning Time")
    print("   - Revenue ex Vat = Invoice Amount / 1.2 (or Paid / 1.2)")
    print("   - Gross Profit = Revenue ex Vat - Parts Cost")
    print("   - Parts Cost (formula) = SUM of Parts Cost mirror")
    print("   - BM Deadline = Date Purchased + SLA offset")
    print("")
    print("3. Button columns — need webhook URLs, set up in Monday UI:")
    print("   - Make Sale Item (webhook trigger)")
    print("")
    print("4. Subitems — enable via Monday UI (board settings > subitems)")

    # Save build manifest
    manifest = {
        "board_id": board_id,
        "board_name": "iCorrect Main Board v2",
        "columns_created": len(columns),
        "groups_created": len(groups),
        "column_ids": {k: v for k, v in columns.items() if v},
        "group_ids": {k: v for k, v in groups.items() if v},
        "connected_boards": {
            "devices": 3923707691,
            "parts_stock": 985177480,
            "products_pricing": 2477699024,
            "client_info_capture": 9490904355,
        },
        "manual_setup": [
            "15 mirror columns",
            "7 formula columns",
            "1 button column (Make Sale Item)",
            "Subitems feature",
        ]
    }
    manifest_path = "/home/ricky/builds/documentation/monday/board-v2-manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nManifest saved: {manifest_path}")


if __name__ == "__main__":
    main()
