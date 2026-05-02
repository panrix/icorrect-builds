#!/usr/bin/env python3
"""
iCorrect Repair Profitability Analysis v2
Pulls repair data from Monday.com Main Board, calculates profitability.
Excludes BM (buyback) items. Focuses on end-user + corporate repairs.
"""

import os, json, time, re, sys
from datetime import datetime, timedelta
from collections import defaultdict
import urllib.request

# Load API token
with open("/home/ricky/config/api-keys/.env") as f:
    for line in f:
        if line.startswith("MONDAY_APP_TOKEN="):
            API_TOKEN = line.strip().split("=", 1)[1].strip('"').strip("'")
            break

API_URL = "https://api.monday.com/v2"
BOARD_ID = 349212843
PARTS_BOARD_ID = 985177480
HOURLY_RATE = 24  # £24/hr loaded rate

# Groups to skip entirely
SKIP_GROUPS = {
    "new_group88387__1",      # BMs Awaiting Sale
    "group_mktsw34v",         # Trade-In BMs Awaiting Validation
    "new_group70634__1",      # BMs No repair / iCloud
    "new_group24448",         # Purchased/Refurb Devices
    "new_group65782",         # Zara iPods
    "new_group32315",         # Completed Refurbs
    "new_group69818",         # Recycle List
    "new_group30399__1",      # Cancelled/Missed Bookings
    "new_group88611",         # Leads to Chase
    "new_group4705__1",       # Selling
}

call_count = 0

def monday_query(query):
    """Execute Monday.com GraphQL query with rate limiting."""
    global call_count
    call_count += 1
    payload = json.dumps({"query": query}).encode()
    req = urllib.request.Request(
        API_URL, data=payload,
        headers={"Authorization": API_TOKEN, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
        if "errors" in result:
            print(f"  API Error: {result['errors'][0].get('message','?')}", file=sys.stderr)
        return result
    except Exception as e:
        print(f"  Request failed: {e}", file=sys.stderr)
        time.sleep(3)
        return {"data": {}}


def parse_float(s):
    if not s: return 0.0
    s = str(s).replace(",", "").replace("£", "").replace("$", "").strip()
    try: return float(s)
    except: return 0.0


def duration_to_hours(duration_secs):
    """Convert duration in seconds to hours."""
    if not duration_secs: return 0.0
    try: return int(duration_secs) / 3600
    except: return 0.0


def get_col(cols, col_id):
    for c in cols:
        if c["id"] == col_id:
            return c
    return {}


def get_text(cols, col_id):
    return get_col(cols, col_id).get("text", "") or ""


def get_linked_ids(cols, col_id):
    col = get_col(cols, col_id)
    return col.get("linked_item_ids", [])


def get_duration_secs(cols, col_id):
    """Extract duration in seconds from time_tracking column value."""
    col = get_col(cols, col_id)
    v = col.get("value", "")
    if not v: return 0
    try:
        parsed = json.loads(v) if isinstance(v, str) else v
        return int(parsed.get("duration", 0))
    except:
        return 0


def classify_device(device_name):
    """Classify device type from device board item name."""
    if not device_name:
        return "Unknown"
    n = device_name.lower()
    if "macbook air" in n or "mba" in n:
        return "MacBook Air"
    elif "macbook pro" in n or "mbp" in n:
        return "MacBook Pro"
    elif "macbook" in n:
        return "MacBook"
    elif "imac" in n:
        return "iMac"
    elif "mac mini" in n:
        return "Mac Mini"
    elif "mac pro" in n or "mac studio" in n:
        return "Mac Pro/Studio"
    elif "iphone" in n:
        return "iPhone"
    elif "ipad" in n:
        return "iPad"
    elif "apple watch" in n or "watch" in n:
        return "Apple Watch"
    elif "ipod" in n:
        return "iPod"
    else:
        return "Other"


def classify_repair(part_names, repair_names, repair_type_col):
    """Classify repair type from parts used, requested repairs, and repair type column."""
    all_text = " ".join(part_names + repair_names).lower()
    rt = (repair_type_col or "").lower()
    
    if not all_text and not rt:
        return "Diagnostics Only"
    
    if any(x in all_text for x in ["screen", "lcd", "display", "oled"]):
        return "Screen Repair"
    elif any(x in all_text for x in ["battery", "batt"]):
        return "Battery Replacement"
    elif any(x in all_text for x in ["keyboard", "topcase", "top case"]):
        return "Keyboard/TopCase"
    elif any(x in all_text for x in ["logic board", "logicboard", "motherboard"]):
        return "Logic Board"
    elif any(x in all_text for x in ["trackpad", "touchpad"]):
        return "Trackpad"
    elif any(x in all_text for x in ["speaker", "audio"]):
        return "Speaker/Audio"
    elif any(x in all_text for x in ["camera", "webcam"]):
        return "Camera"
    elif any(x in all_text for x in ["port", "usb", "charging", "dc", "magsafe"]):
        return "Port/Charging"
    elif any(x in all_text for x in ["fan", "heatsink", "thermal"]):
        return "Fan/Thermal"
    elif any(x in all_text for x in ["hinge", "clutch"]):
        return "Hinge/Clutch"
    elif any(x in all_text for x in ["housing", "rear glass", "back glass", "enclosure"]):
        return "Housing/Casing"
    elif any(x in all_text for x in ["touch id", "fingerprint", "face id"]):
        return "Touch ID/Face ID"
    elif all_text:
        return "Other Parts Repair"
    
    if "diagnostic" in rt:
        return "Diagnostics Only"
    elif "repair" in rt:
        return "Repair (unspecified)"
    elif "ber" in rt:
        return "BER"
    elif "software" in rt:
        return "Software"
    
    return "Unclassified"


def fetch_all_items():
    """Fetch all non-BM items with cursor pagination, including linked IDs."""
    items = []
    cursor = None
    page = 0
    
    col_fragment = """
        column_values(ids: ["dup__of_quote_total", "status", "status24", "service",
                           "date4", "collection_date",
                           "time_tracking98", "time_tracking", "time_tracking9", "time_tracking93",
                           "connect_boards__1", "board_relation5", "board_relation"]) {
            id type text value
            ... on BoardRelationValue { linked_item_ids }
        }
    """
    
    while True:
        page += 1
        if cursor:
            query = f'''{{ next_items_page(cursor: "{cursor}", limit: 200) {{ cursor items {{ id name group {{ id title }} {col_fragment} }} }} }}'''
        else:
            query = f'''{{ boards(ids: [{BOARD_ID}]) {{ items_page(limit: 200) {{ cursor items {{ id name group {{ id title }} {col_fragment} }} }} }} }}'''
        
        result = monday_query(query)
        
        if cursor:
            page_data = result.get("data", {}).get("next_items_page", {})
        else:
            page_data = result.get("data", {}).get("boards", [{}])[0].get("items_page", {})
        
        page_items = page_data.get("items", [])
        cursor = page_data.get("cursor")
        
        for item in page_items:
            group_id = item.get("group", {}).get("id", "")
            name = item.get("name", "")
            cols = item["column_values"]
            
            if group_id in SKIP_GROUPS:
                continue
            if name.startswith("BM "):
                continue
            
            client = get_text(cols, "status")
            if client and "bm" in client.lower():
                continue
            
            paid = parse_float(get_text(cols, "dup__of_quote_total"))
            if paid <= 0:
                continue
            
            items.append(item)
        
        print(f"  Page {page}: {len(page_items)} raw, {len(items)} qualifying total")
        
        if not cursor or not page_items:
            break
        time.sleep(1)
    
    return items


def fetch_item_details(item_ids, id_column="supply_price"):
    """Fetch names and optional column for a list of item IDs. Returns {id: {name, value}}."""
    results = {}
    batch_size = 25
    
    for i in range(0, len(item_ids), batch_size):
        batch = item_ids[i:i + batch_size]
        ids_str = ", ".join(str(pid) for pid in batch)
        
        if id_column:
            query = f'{{ items(ids: [{ids_str}]) {{ id name column_values(ids: ["{id_column}"]) {{ id text }} }} }}'
        else:
            query = f'{{ items(ids: [{ids_str}]) {{ id name }} }}'
        
        result = monday_query(query)
        for item in result.get("data", {}).get("items", []):
            val = 0.0
            if id_column:
                for col in item.get("column_values", []):
                    if col.get("text"):
                        val = parse_float(col["text"])
            results[str(item["id"])] = {"name": item.get("name", ""), "value": val}
        
        if i + batch_size < len(item_ids):
            time.sleep(1)
    
    return results


def main():
    print("=" * 60)
    print("iCorrect Repair Profitability Analysis v2")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    
    # Step 1: Fetch all qualifying items
    print("\n📥 Fetching repair items...")
    items = fetch_all_items()
    print(f"✅ {len(items)} qualifying items")
    
    # Step 2: Collect all linked IDs
    print("\n🔗 Collecting linked references...")
    all_device_ids = set()
    all_part_ids = set()
    all_repair_ids = set()
    
    for item in items:
        cols = item["column_values"]
        device_ids = get_linked_ids(cols, "board_relation5")
        part_ids = get_linked_ids(cols, "connect_boards__1")
        repair_ids = get_linked_ids(cols, "board_relation")
        
        all_device_ids.update(str(d) for d in device_ids)
        all_part_ids.update(str(p) for p in part_ids)
        all_repair_ids.update(str(r) for r in repair_ids)
    
    print(f"  Devices: {len(all_device_ids)}, Parts: {len(all_part_ids)}, Repairs: {len(all_repair_ids)}")
    
    # Step 3: Fetch linked item details
    device_data = {}
    if all_device_ids:
        print("\n📱 Fetching device names...")
        device_data = fetch_item_details(list(all_device_ids), id_column=None)
        print(f"  {len(device_data)} devices")
    
    parts_data = {}
    if all_part_ids:
        print("\n📦 Fetching parts (with supply prices)...")
        parts_data = fetch_item_details(list(all_part_ids), id_column="supply_price")
        # Filter out adapters/chargers
        parts_data = {k: v for k, v in parts_data.items()
                      if not any(x in v["name"].lower() for x in ["adapter", "charger"])}
        print(f"  {len(parts_data)} parts (after filtering adapters)")
    
    repair_data = {}
    if all_repair_ids:
        print("\n🔧 Fetching requested repair names...")
        repair_data = fetch_item_details(list(all_repair_ids), id_column=None)
        print(f"  {len(repair_data)} repairs")
    
    # Step 4: Build repair records
    print("\n📊 Calculating profitability...")
    repairs = []
    now = datetime.now()
    twelve_weeks_ago = now - timedelta(weeks=12)
    
    for item in items:
        cols = item["column_values"]
        name = item["name"]
        
        paid = parse_float(get_text(cols, "dup__of_quote_total"))
        rev_ex_vat = paid / 1.2
        
        # Labour from time tracking (all in seconds)
        diag_secs = get_duration_secs(cols, "time_tracking")
        repair_secs = get_duration_secs(cols, "time_tracking9")
        refurb_secs = get_duration_secs(cols, "time_tracking93")
        total_secs = diag_secs + repair_secs + refurb_secs
        total_hours = total_secs / 3600
        labour_cost = total_hours * HOURLY_RATE
        
        # Parts cost
        part_ids = [str(p) for p in get_linked_ids(cols, "connect_boards__1")]
        parts_cost = sum(parts_data.get(pid, {}).get("value", 0) for pid in part_ids)
        part_names = [parts_data[pid]["name"] for pid in part_ids if pid in parts_data]
        
        # Device info
        device_ids = [str(d) for d in get_linked_ids(cols, "board_relation5")]
        device_names = [device_data[did]["name"] for did in device_ids if did in device_data]
        device_name = device_names[0] if device_names else ""
        device_type = classify_device(device_name)
        
        # Requested repairs
        req_repair_ids = [str(r) for r in get_linked_ids(cols, "board_relation")]
        req_repair_names = [repair_data[rid]["name"] for rid in req_repair_ids if rid in repair_data]
        
        # Repair classification
        repair_type_col = get_text(cols, "status24")
        service = get_text(cols, "service")
        client = get_text(cols, "status")
        repair_type = classify_repair(part_names, req_repair_names, repair_type_col)
        
        # Net profit
        net_profit = rev_ex_vat - labour_cost - parts_cost
        margin = (net_profit / rev_ex_vat * 100) if rev_ex_vat > 0 else 0
        
        # Dates
        received_str = get_text(cols, "date4")
        repaired_str = get_text(cols, "collection_date")
        received_date = None
        try:
            if received_str:
                received_date = datetime.strptime(received_str[:10], "%Y-%m-%d")
        except: pass
        
        repairs.append({
            "id": item["id"],
            "name": name,
            "group": item.get("group", {}).get("title", "Unknown"),
            "device_name": device_name,
            "device_type": device_type,
            "repair_type": repair_type,
            "repair_type_col": repair_type_col,
            "service": service,
            "client_type": client,
            "paid": paid,
            "rev_ex_vat": round(rev_ex_vat, 2),
            "total_hours": round(total_hours, 2),
            "labour_cost": round(labour_cost, 2),
            "parts_cost": round(parts_cost, 2),
            "net_profit": round(net_profit, 2),
            "margin_pct": round(margin, 1),
            "parts_used": part_names,
            "requested_repairs": req_repair_names,
            "received": received_str[:10] if received_str else None,
            "repaired": repaired_str[:10] if repaired_str else None,
            "in_last_12_weeks": bool(received_date and received_date >= twelve_weeks_ago),
        })
    
    # Step 5: Analysis
    analyse(repairs)
    
    print(f"\n📡 Total API calls: {call_count}")


def analyse(repairs):
    print(f"\n{'=' * 60}")
    print("ANALYSIS RESULTS")
    print(f"{'=' * 60}")
    
    total_rev = sum(r["rev_ex_vat"] for r in repairs)
    total_labour = sum(r["labour_cost"] for r in repairs)
    total_parts = sum(r["parts_cost"] for r in repairs)
    total_profit = sum(r["net_profit"] for r in repairs)
    overall_margin = (total_profit / total_rev * 100) if total_rev > 0 else 0
    avg_ticket = total_rev / len(repairs) if repairs else 0
    
    has_labour = sum(1 for r in repairs if r["total_hours"] > 0)
    has_parts = sum(1 for r in repairs if r["parts_cost"] > 0)
    has_device = sum(1 for r in repairs if r["device_type"] != "Unknown")
    
    print(f"\n📈 OVERALL ({len(repairs)} repairs)")
    print(f"  Revenue (ex VAT): £{total_rev:,.0f}")
    print(f"  Labour cost:      £{total_labour:,.0f} ({has_labour} items with time tracked)")
    print(f"  Parts cost:       £{total_parts:,.0f} ({has_parts} items with parts)")
    print(f"  Net profit:       £{total_profit:,.0f}")
    print(f"  Overall margin:   {overall_margin:.1f}%")
    print(f"  Avg ticket:       £{avg_ticket:.0f}")
    print(f"  Device identified: {has_device}/{len(repairs)}")
    
    # By repair type
    by_repair = defaultdict(lambda: {"count": 0, "rev": 0, "labour": 0, "parts": 0, "profit": 0})
    for r in repairs:
        rt = r["repair_type"]
        by_repair[rt]["count"] += 1
        by_repair[rt]["rev"] += r["rev_ex_vat"]
        by_repair[rt]["labour"] += r["labour_cost"]
        by_repair[rt]["parts"] += r["parts_cost"]
        by_repair[rt]["profit"] += r["net_profit"]
    
    print(f"\n🔧 BY REPAIR TYPE")
    for rt, d in sorted(by_repair.items(), key=lambda x: x[1]["profit"], reverse=True):
        margin = (d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0
        avg = d["profit"]/d["count"] if d["count"] > 0 else 0
        print(f"  {rt:25s} | {d['count']:4d} | Rev £{d['rev']:8,.0f} | Lab £{d['labour']:6,.0f} | "
              f"Parts £{d['parts']:6,.0f} | Profit £{d['profit']:8,.0f} | {margin:5.1f}% | £{avg:.0f}/job")
    
    # By device type
    by_device = defaultdict(lambda: {"count": 0, "rev": 0, "labour": 0, "parts": 0, "profit": 0})
    for r in repairs:
        dt = r["device_type"]
        by_device[dt]["count"] += 1
        by_device[dt]["rev"] += r["rev_ex_vat"]
        by_device[dt]["labour"] += r["labour_cost"]
        by_device[dt]["parts"] += r["parts_cost"]
        by_device[dt]["profit"] += r["net_profit"]
    
    print(f"\n💻 BY DEVICE TYPE")
    for dt, d in sorted(by_device.items(), key=lambda x: x[1]["profit"], reverse=True):
        margin = (d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0
        avg = d["profit"]/d["count"] if d["count"] > 0 else 0
        print(f"  {dt:20s} | {d['count']:4d} | Rev £{d['rev']:8,.0f} | Lab £{d['labour']:6,.0f} | "
              f"Parts £{d['parts']:6,.0f} | Profit £{d['profit']:8,.0f} | {margin:5.1f}% | £{avg:.0f}/job")
    
    # By client type
    by_client = defaultdict(lambda: {"count": 0, "rev": 0, "labour": 0, "parts": 0, "profit": 0})
    for r in repairs:
        ct = r["client_type"] or "Unknown"
        by_client[ct]["count"] += 1
        by_client[ct]["rev"] += r["rev_ex_vat"]
        by_client[ct]["labour"] += r["labour_cost"]
        by_client[ct]["parts"] += r["parts_cost"]
        by_client[ct]["profit"] += r["net_profit"]
    
    print(f"\n👤 BY CLIENT TYPE")
    for ct, d in sorted(by_client.items(), key=lambda x: x[1]["profit"], reverse=True):
        margin = (d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0
        print(f"  {ct:20s} | {d['count']:4d} | Rev £{d['rev']:8,.0f} | Profit £{d['profit']:8,.0f} | {margin:5.1f}%")
    
    # Weekly trends (last 12 weeks)
    weekly = defaultdict(lambda: {"count": 0, "rev": 0, "labour": 0, "parts": 0, "profit": 0})
    for r in repairs:
        if r["in_last_12_weeks"] and r["received"]:
            try:
                d = datetime.strptime(r["received"], "%Y-%m-%d")
                week_start = d - timedelta(days=d.weekday())
                week_key = week_start.strftime("%Y-%m-%d")
                weekly[week_key]["count"] += 1
                weekly[week_key]["rev"] += r["rev_ex_vat"]
                weekly[week_key]["labour"] += r["labour_cost"]
                weekly[week_key]["parts"] += r["parts_cost"]
                weekly[week_key]["profit"] += r["net_profit"]
            except: pass
    
    print(f"\n📅 WEEKLY TREND (Last 12 Weeks)")
    for week in sorted(weekly.keys()):
        d = weekly[week]
        margin = (d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0
        print(f"  w/c {week} | {d['count']:3d} | Rev £{d['rev']:6,.0f} | Lab £{d['labour']:5,.0f} | "
              f"Parts £{d['parts']:5,.0f} | Profit £{d['profit']:6,.0f} | {margin:5.1f}%")
    
    # Device + Repair combos
    combos = defaultdict(lambda: {"count": 0, "rev": 0, "labour": 0, "parts": 0, "profit": 0})
    for r in repairs:
        key = f"{r['device_type']} | {r['repair_type']}"
        combos[key]["count"] += 1
        combos[key]["rev"] += r["rev_ex_vat"]
        combos[key]["labour"] += r["labour_cost"]
        combos[key]["parts"] += r["parts_cost"]
        combos[key]["profit"] += r["net_profit"]
    
    print(f"\n🎯 TOP 20 DEVICE+REPAIR COMBOS (by profit)")
    for combo, d in sorted(combos.items(), key=lambda x: x[1]["profit"], reverse=True)[:20]:
        margin = (d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0
        avg = d["profit"]/d["count"]
        print(f"  {combo:45s} | {d['count']:3d} | Rev £{d['rev']:7,.0f} | "
              f"Profit £{d['profit']:7,.0f} | {margin:5.1f}% | £{avg:.0f}/job")
    
    print(f"\n⚠️  WORST MARGIN COMBOS (min 3 jobs)")
    filtered = [(c, d) for c, d in combos.items() if d["count"] >= 3]
    for combo, d in sorted(filtered, key=lambda x: (x[1]["profit"]/x[1]["rev"]*100) if x[1]["rev"] > 0 else -999)[:10]:
        margin = (d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0
        avg = d["profit"]/d["count"]
        print(f"  {combo:45s} | {d['count']:3d} | Rev £{d['rev']:7,.0f} | "
              f"Profit £{d['profit']:7,.0f} | {margin:5.1f}% | £{avg:.0f}/job")
    
    # By repair type column (Monday status24)
    by_rt_col = defaultdict(lambda: {"count": 0, "rev": 0, "profit": 0})
    for r in repairs:
        rt = r["repair_type_col"] or "Unknown"
        by_rt_col[rt]["count"] += 1
        by_rt_col[rt]["rev"] += r["rev_ex_vat"]
        by_rt_col[rt]["profit"] += r["net_profit"]
    
    print(f"\n📋 BY REPAIR TYPE COLUMN (Monday status)")
    for rt, d in sorted(by_rt_col.items(), key=lambda x: x[1]["profit"], reverse=True):
        margin = (d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0
        print(f"  {rt:20s} | {d['count']:4d} | Rev £{d['rev']:8,.0f} | Profit £{d['profit']:8,.0f} | {margin:5.1f}%")
    
    # Save outputs
    save_outputs(repairs, by_repair, by_device, by_client, weekly, combos, filtered)


def save_outputs(repairs, by_repair, by_device, by_client, weekly, combos, filtered_combos):
    total_rev = sum(r["rev_ex_vat"] for r in repairs)
    total_labour = sum(r["labour_cost"] for r in repairs)
    total_parts = sum(r["parts_cost"] for r in repairs)
    total_profit = sum(r["net_profit"] for r in repairs)
    overall_margin = (total_profit / total_rev * 100) if total_rev > 0 else 0
    
    def agg(d):
        return {
            "count": d["count"],
            "revenue": round(d["rev"], 2),
            "labour": round(d["labour"], 2),
            "parts": round(d["parts"], 2),
            "profit": round(d["profit"], 2),
            "margin_pct": round((d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0, 1),
            "avg_profit": round(d["profit"]/d["count"], 2) if d["count"] > 0 else 0,
        }
    
    output = {
        "generated": datetime.now().isoformat(),
        "total_items": len(repairs),
        "summary": {
            "total_revenue_ex_vat": round(total_rev, 2),
            "total_labour_cost": round(total_labour, 2),
            "total_parts_cost": round(total_parts, 2),
            "total_net_profit": round(total_profit, 2),
            "overall_margin_pct": round(overall_margin, 1),
            "avg_ticket_ex_vat": round(total_rev / len(repairs), 2) if repairs else 0,
            "items_with_time_tracked": sum(1 for r in repairs if r["total_hours"] > 0),
            "items_with_parts": sum(1 for r in repairs if r["parts_cost"] > 0),
            "items_with_device": sum(1 for r in repairs if r["device_type"] != "Unknown"),
        },
        "by_repair_type": {rt: agg(d) for rt, d in sorted(by_repair.items(), key=lambda x: x[1]["profit"], reverse=True)},
        "by_device_type": {dt: agg(d) for dt, d in sorted(by_device.items(), key=lambda x: x[1]["profit"], reverse=True)},
        "by_client_type": {
            ct: {"count": d["count"], "revenue": round(d["rev"], 2), "profit": round(d["profit"], 2),
                 "margin_pct": round((d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0, 1)}
            for ct, d in sorted(by_client.items(), key=lambda x: x[1]["profit"], reverse=True)
        },
        "weekly_trend": {
            week: {"count": d["count"], "revenue": round(d["rev"], 2), "profit": round(d["profit"], 2),
                   "margin_pct": round((d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0, 1)}
            for week, d in sorted(weekly.items())
        },
        "top_combos": {c: agg(d) for c, d in sorted(combos.items(), key=lambda x: x[1]["profit"], reverse=True)[:20]},
        "repairs": repairs,
    }
    
    json_path = "/home/ricky/.openclaw/agents/main/workspace/data/repairs/repair-profitability.json"
    with open(json_path, "w") as f:
        json.dump(output, f, indent=2, default=str)
    print(f"\n💾 JSON: {json_path}")
    
    # Markdown report
    s = output["summary"]
    lines = [
        "# iCorrect Repair Profitability Analysis",
        f"Generated: {output['generated'][:16]}",
        f"Total repairs analysed: {output['total_items']}",
        f"Data coverage: {s['items_with_time_tracked']} with time tracked, {s['items_with_parts']} with parts, {s['items_with_device']} with device identified",
        "",
        "## Overall Summary",
        f"- **Revenue (ex VAT):** £{s['total_revenue_ex_vat']:,.0f}",
        f"- **Labour cost:** £{s['total_labour_cost']:,.0f}",
        f"- **Parts cost:** £{s['total_parts_cost']:,.0f}",
        f"- **Net profit:** £{s['total_net_profit']:,.0f}",
        f"- **Overall margin:** {s['overall_margin_pct']}%",
        f"- **Avg ticket (ex VAT):** £{s['avg_ticket_ex_vat']:,.0f}",
        "",
        "## By Repair Type",
    ]
    for rt, d in sorted(by_repair.items(), key=lambda x: x[1]["profit"], reverse=True):
        m = (d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0
        a = d["profit"]/d["count"] if d["count"] > 0 else 0
        lines.append(f"- **{rt}**: {d['count']} jobs, Rev £{d['rev']:,.0f}, Labour £{d['labour']:,.0f}, "
                     f"Parts £{d['parts']:,.0f}, Profit £{d['profit']:,.0f}, Margin {m:.1f}%, £{a:.0f}/job")
    
    lines.extend(["", "## By Device Type"])
    for dt, d in sorted(by_device.items(), key=lambda x: x[1]["profit"], reverse=True):
        m = (d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0
        a = d["profit"]/d["count"] if d["count"] > 0 else 0
        lines.append(f"- **{dt}**: {d['count']} jobs, Rev £{d['rev']:,.0f}, Profit £{d['profit']:,.0f}, "
                     f"Margin {m:.1f}%, £{a:.0f}/job")
    
    lines.extend(["", "## By Client Type"])
    for ct, d in sorted(by_client.items(), key=lambda x: x[1]["profit"], reverse=True):
        m = (d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0
        lines.append(f"- **{ct}**: {d['count']} jobs, Rev £{d['rev']:,.0f}, Profit £{d['profit']:,.0f}, Margin {m:.1f}%")
    
    lines.extend(["", "## Weekly Trend (Last 12 Weeks)"])
    for week, d in sorted(weekly.items()):
        m = (d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0
        lines.append(f"- w/c {week}: {d['count']} jobs, Rev £{d['rev']:,.0f}, Profit £{d['profit']:,.0f}, Margin {m:.1f}%")
    
    lines.extend(["", "## Top Combos (Device + Repair, by profit)"])
    for c, d in sorted(combos.items(), key=lambda x: x[1]["profit"], reverse=True)[:15]:
        m = (d["profit"]/d["rev"]*100) if d["rev"] > 0 else 0
        a = d["profit"]/d["count"]
        lines.append(f"- **{c}**: {d['count']} jobs, Profit £{d['profit']:,.0f}, {m:.1f}%, £{a:.0f}/job")
    
    lines.extend([
        "", "## Methodology",
        "- Revenue = Paid / 1.2 (removing 20% VAT)",
        "- Labour = (diagnostic + repair + refurb time) in hours x £24/hr loaded rate",
        "- Parts cost = sum of linked parts supply prices from Parts board",
        "- Adapters/chargers filtered from parts",
        "- BM items excluded (by name prefix, client type, and group)",
        "- Items with £0 paid excluded",
        "- Device type from linked Devices board",
        "- Repair type classified from parts used + requested repairs + repair type column",
    ])
    
    md_path = "/home/ricky/.openclaw/agents/main/workspace/data/repairs/REPAIR-PROFITABILITY.md"
    with open(md_path, "w") as f:
        f.write("\n".join(lines))
    print(f"📝 Report: {md_path}")


if __name__ == "__main__":
    main()
