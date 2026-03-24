#!/usr/bin/env python3
"""BM Trade-In Reconciliation — Received vs Processed

Cross-references BM order statuses against Monday board records.
Finds orders BM considers shipped/received/paid that we have no record of.

Input: audit/repair-analysis-data-2026-03-02.json (already collected)
Output: Console report + audit/reconciliation-2026-03-02.json
"""
import json, sys
from collections import defaultdict
from datetime import datetime

DATA_FILE = "/home/ricky/builds/backmarket/audit/repair-analysis-data-2026-03-02.json"

with open(DATA_FILE) as f:
    data = json.load(f)

devices = data["devices"]

# BM statuses that mean "device should have been sent to us or beyond"
SHIPPED_STATUSES = {"SENT", "RECEIVED", "MONEY_TRANSFERED", "PAID"}

# Categorise every order
categories = {
    "matched_and_processed": [],    # On Monday, has a status showing work done
    "matched_but_stuck": [],        # On Monday, but no progress
    "no_monday_record": [],         # BM says shipped/received, NOT on Monday
    "cancelled": [],                # BM cancelled
    "to_send": [],                  # Customer hasn't sent yet
    "suspended": [],                # BM suspended
}

for d in devices:
    bm_status = d.get("bm_status", "")
    has_main = bool(d.get("main_board_id"))
    has_bm_board = bool(d.get("bm_board_id"))
    monday_status = d.get("status", "")

    if bm_status == "CANCELED":
        categories["cancelled"].append(d)
    elif bm_status == "TO_SEND":
        categories["to_send"].append(d)
    elif bm_status == "SUSPENDED":
        categories["suspended"].append(d)
    elif bm_status in SHIPPED_STATUSES:
        if has_main and monday_status:
            # Check if it's actually been worked on
            sold_statuses = {"Shipped", "Returned", "Ready To Collect"}
            in_progress_statuses = {"Repaired", "Software Install", "Battery Testing",
                                    "Awaiting Part", "Repair Paused", "Queued For Repair",
                                    "Awaiting Confirmation", "Client Contacted"}
            stuck_statuses = {"Expecting Device", "Received", "Error", "BER/Parts",
                              "Book Return Courier"}

            if monday_status in sold_statuses:
                categories["matched_and_processed"].append(d)
            elif monday_status in in_progress_statuses:
                categories["matched_and_processed"].append(d)
            else:
                categories["matched_but_stuck"].append(d)
        elif has_bm_board and not has_main:
            # On BM board but not linked to main board
            categories["no_monday_record"].append(d)
        else:
            # Not even on BM board
            categories["no_monday_record"].append(d)

# ================================================================
# REPORT
# ================================================================
print()
print("=" * 90)
print("BM TRADE-IN RECONCILIATION — RECEIVED vs PROCESSED")
print("=" * 90)
print()
print("Data source: %s" % DATA_FILE)
print("Generated: %s" % data["generated"][:10])
print("Period: %s to present (%d months)" % (data["config"]["cutoff"], data["config"]["months"]))
print()

print("OVERALL BREAKDOWN (%d total orders):" % len(devices))
print("  %-35s %5d" % ("Cancelled (BM cancelled)", len(categories["cancelled"])))
print("  %-35s %5d" % ("To Send (customer hasn't sent)", len(categories["to_send"])))
print("  %-35s %5d" % ("Suspended", len(categories["suspended"])))
print("  %-35s %5d" % ("Matched & processed on Monday", len(categories["matched_and_processed"])))
print("  %-35s %5d" % ("Matched but stuck/needs attention", len(categories["matched_but_stuck"])))
print("  %-35s %5d  *** GAPS ***" % ("NO Monday record (BM says shipped)", len(categories["no_monday_record"])))
print()

# ================================================================
# THE GAPS — orders BM says shipped but we have no record
# ================================================================
gaps = categories["no_monday_record"]
if gaps:
    print("=" * 90)
    print("GAP ANALYSIS — %d ORDERS WITH NO MONDAY RECORD" % len(gaps))
    print("=" * 90)
    print()

    # Break down by BM status
    gap_by_status = defaultdict(list)
    for g in gaps:
        gap_by_status[g["bm_status"]].append(g)

    print("By BM Status:")
    for status in ["SENT", "RECEIVED", "MONEY_TRANSFERED", "PAID"]:
        items = gap_by_status.get(status, [])
        if items:
            print("  %-25s %d" % (status, len(items)))
    print()

    # Break down by whether they're on BM board at all
    on_bm_board = [g for g in gaps if g.get("bm_board_id")]
    not_on_bm_board = [g for g in gaps if not g.get("bm_board_id")]
    print("BM Board presence:")
    print("  On BM board (no main link):  %d" % len(on_bm_board))
    print("  Not on BM board at all:      %d" % len(not_on_bm_board))
    print()

    # By grade
    gap_by_grade = defaultdict(int)
    for g in gaps:
        gap_by_grade[g["listing_grade"]] += 1
    print("By Listing Grade:")
    for grade in ["NONFUNC.USED", "NONFUNC.CRACK", "FUNC.CRACK", "UNKNOWN"]:
        if grade in gap_by_grade:
            print("  %-20s %d" % (grade, gap_by_grade[grade]))
    print()

    # Capital at risk
    total_offer = sum(g.get("bm_offer", 0) or 0 for g in gaps)
    total_counter = sum(g.get("counter_offer", 0) or 0 for g in gaps)
    total_purchase = sum(g.get("purchase_price", 0) or 0 for g in gaps)
    print("Capital Exposure:")
    print("  Total BM offer value:     £%.0f" % total_offer)
    if total_counter:
        print("  Total counter-offer value: £%.0f" % total_counter)
    if total_purchase:
        print("  Total purchase (Monday):  £%.0f" % total_purchase)
    print()

    # List every gap order
    print("-" * 90)
    print("EVERY MISSING ORDER (BM says shipped/received/paid, no Monday main board record):")
    print("-" * 90)
    print("%-20s %-6s %-15s %-10s %8s %10s %10s" % (
        "Order ID", "BM St", "Grade", "Shipped", "Offer", "Counter", "Device"))
    print("-" * 90)

    for g in sorted(gaps, key=lambda x: x.get("order_shipped", "") or "9999", reverse=True):
        device = (g.get("device_title") or "")[:35]
        if " - QWERT" in device:
            device = device.split(" - QWERT")[0][:35]
        bm_st = g["bm_status"][:6]
        shipped = g.get("order_shipped", "")
        offer = g.get("bm_offer", 0) or 0
        counter = g.get("counter_offer", 0) or 0
        grade = g.get("listing_grade", "?")

        print("%-20s %-6s %-15s %-10s %8.0f %10s %s" % (
            g["order_id"], bm_st, grade, shipped,
            offer,
            "£%.0f" % counter if counter else "-",
            device))

    print()

# ================================================================
# STUCK items — on Monday but not progressing
# ================================================================
stuck = categories["matched_but_stuck"]
if stuck:
    print("=" * 90)
    print("STUCK DEVICES — %d ON MONDAY BUT NEED ATTENTION" % len(stuck))
    print("=" * 90)
    print()

    stuck_by_status = defaultdict(list)
    for s in stuck:
        stuck_by_status[s.get("status", "Unknown")].append(s)

    print("By Monday Status:")
    for status, items in sorted(stuck_by_status.items(), key=lambda x: -len(x[1])):
        print("  %-30s %d" % (status, len(items)))
    print()

    stuck_capital = sum(s.get("purchase_price", 0) or 0 for s in stuck)
    print("Capital tied up: £%.0f" % stuck_capital)
    print()

    print("%-12s %-30s %-15s %-15s %-10s %8s" % (
        "BM Name", "Device", "Monday Status", "Grade", "Received", "Purchase"))
    print("-" * 90)

    for s in sorted(stuck, key=lambda x: x.get("received", "") or "9999"):
        device = (s.get("device_title") or "")[:30]
        if " - QWERT" in device:
            device = device.split(" - QWERT")[0][:30]
        print("%-12s %-30s %-15s %-15s %-10s %8.0f" % (
            s.get("bm_name", "")[:12],
            device,
            s.get("status", "")[:15],
            s.get("listing_grade", "")[:15],
            s.get("received", "")[:10],
            s.get("purchase_price", 0) or 0))

print()

# ================================================================
# SUMMARY — what's accounted for vs what's not
# ================================================================
shipped_total = len(categories["matched_and_processed"]) + len(categories["matched_but_stuck"]) + len(categories["no_monday_record"])
accounted = len(categories["matched_and_processed"]) + len(categories["matched_but_stuck"])

print("=" * 90)
print("RECONCILIATION SUMMARY")
print("=" * 90)
print()
print("BM says %d devices were shipped/received/paid." % shipped_total)
print("We have Monday records for %d of them (%.0f%%)." % (accounted, accounted / max(shipped_total, 1) * 100))
print("Missing from Monday: %d (%.0f%%)" % (len(gaps), len(gaps) / max(shipped_total, 1) * 100))
print()

if gaps:
    print("ACTION REQUIRED:")
    print("  1. Check if these %d orders were received but never logged in Monday" % len(gaps))
    print("  2. If received: create Monday items and process them")
    print("  3. If never received: dispute with BM (they think we have these devices)")
    print("  4. Cross-check against physical workshop inventory")

# Save structured output
output = {
    "generated": datetime.now().isoformat(),
    "source": DATA_FILE,
    "summary": {
        "total_orders": len(devices),
        "shipped_by_bm": shipped_total,
        "accounted_on_monday": accounted,
        "missing_from_monday": len(gaps),
        "stuck_on_monday": len(stuck),
        "cancelled": len(categories["cancelled"]),
        "to_send": len(categories["to_send"]),
        "suspended": len(categories["suspended"]),
    },
    "gaps": [{
        "order_id": g["order_id"],
        "bm_status": g["bm_status"],
        "listing_grade": g["listing_grade"],
        "device_title": g.get("device_title", ""),
        "bm_offer": g.get("bm_offer", 0),
        "counter_offer": g.get("counter_offer", 0),
        "purchase_price": g.get("purchase_price", 0),
        "order_created": g.get("order_created", ""),
        "order_shipped": g.get("order_shipped", ""),
        "order_received": g.get("order_received", ""),
        "order_paid": g.get("order_paid", ""),
        "on_bm_board": bool(g.get("bm_board_id")),
        "bm_name": g.get("bm_name", ""),
    } for g in gaps],
    "stuck": [{
        "order_id": s["order_id"],
        "bm_name": s.get("bm_name", ""),
        "monday_status": s.get("status", ""),
        "listing_grade": s.get("listing_grade", ""),
        "device_title": s.get("device_title", ""),
        "purchase_price": s.get("purchase_price", 0),
        "received": s.get("received", ""),
    } for s in stuck],
}

out_path = "/home/ricky/builds/backmarket/audit/reconciliation-2026-03-02.json"
with open(out_path, "w") as f:
    json.dump(output, f, indent=2)

print()
print("Structured data saved to: %s" % out_path)
