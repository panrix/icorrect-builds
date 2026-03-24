#!/usr/bin/env python3
"""Layer 3: Saf Diagnostic Notes & Repair Complexity Analysis

Pulls Monday item updates for devices where Saf is repair_person,
parses ammeter readings and fault descriptions, categorises repair complexity.

Can run against BM data (default) or all clients.

Usage:
    python3 bm-saf-diagnostics.py                    # BM devices only (from cached data)
    python3 bm-saf-diagnostics.py --all-clients       # All Saf's repairs (queries Monday directly)
    python3 bm-saf-diagnostics.py --input FILE.json   # Custom input file

Output:
    audit/saf-diagnostics-YYYY-MM-DD.json
"""
import json, subprocess, sys, time, os, re
from datetime import datetime
from collections import defaultdict, Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bm_utils import load_env

BASE = "/home/ricky/builds/backmarket"
AUDIT_DIR = f"{BASE}/audit"
DEFAULT_INPUT = f"{AUDIT_DIR}/repair-analysis-data-2026-03-02.json"

MAIN_BOARD_ID = "349212843"


def log(msg):
    print(msg, file=sys.stderr, flush=True)


def mq(query, api_key, retries=3):
    """Monday GraphQL query with rate limit retry."""
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


def get_targets_from_cached(input_path):
    """Get Saf's device IDs from cached repair analysis data (BM only)."""
    with open(input_path) as f:
        data = json.load(f)

    targets = []
    for d in data["devices"]:
        rp = d.get("repair_person", "")
        mid = d.get("main_board_id", "")
        if not mid or "saf" not in rp.lower():
            continue
        targets.append({
            "main_board_id": mid,
            "item_name": d.get("item_name", ""),
            "grade": d.get("listing_grade", "UNKNOWN"),
            "status": d.get("status", ""),
            "repair_person": rp,
            "parts_used": d.get("parts_used", []),
            "has_logic_board": any("logic" in p.lower() or "board" in p.lower()
                                   for p in d.get("parts_used", [])),
            "ammeter_reading": d.get("ammeter_reading", ""),
            "sale_price": d.get("sale_price", 0),
            "purchase_price": d.get("purchase_price", 0),
            "net": d.get("net"),
            "parts_cost": d.get("parts_cost", 0),
            "diag_time_secs": d.get("diag_time_secs", 0),
            "repair_time_secs": d.get("repair_time_secs", 0),
            "client": "BM",
        })
    return targets


def get_targets_all_clients(api_key):
    """Query Monday main board for ALL items where Saf is repair_person."""
    log("  Querying main board for all Saf repairs...")
    all_items = []
    cursor = None
    cols = [
        "status4", "status24", "status", "text_mky01vb4",
        "person", "multiple_person_mkwqy930", "multiple_person_mkwqsxse",
        "color_mkwr7s1s", "numbers9", "date4", "collection_date",
        "status_2_Mjj4GJNQ",
    ]
    col_str = '", "'.join(cols)

    while True:
        if cursor:
            q = '{ next_items_page(limit: 100, cursor: "%s") { cursor items { id name group { title } column_values(ids: ["%s"]) { id text } } } }' % (cursor, col_str)
        else:
            q = '{ boards(ids: [%s]) { items_page(limit: 100) { cursor items { id name group { title } column_values(ids: ["%s"]) { id text } } } } }' % (MAIN_BOARD_ID, col_str)

        r = mq(q, api_key)
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
        log("    Fetched %d items so far..." % len(all_items))
        if not cursor:
            break

    # Filter to items where Saf is repair_person
    targets = []
    for item in all_items:
        vals = {}
        for cv in item.get("column_values", []):
            vals[cv["id"]] = (cv.get("text") or "").strip()

        rp = vals.get("multiple_person_mkwqy930", "")
        if "saf" not in rp.lower():
            continue

        targets.append({
            "main_board_id": item["id"],
            "item_name": item["name"],
            "grade": "ALL_CLIENTS",
            "status": vals.get("status4", ""),
            "repair_person": rp,
            "parts_used": [],
            "has_logic_board": False,
            "ammeter_reading": vals.get("color_mkwr7s1s", ""),
            "client": vals.get("status", ""),
        })

    return targets


def pull_item_updates(item_ids, api_key):
    """Pull updates AND replies for a list of Monday item IDs.
    Saf writes diagnostic notes as replies to Systems Manager updates.
    Returns dict: item_id -> [{ text, created_at, creator_name }]
    (flattened list of both top-level updates and replies)
    """
    updates = {}
    total = len(item_ids)

    # Batch by 5 items at a time (updates + replies can be large)
    for i in range(0, total, 5):
        batch = item_ids[i:i+5]
        ids_str = ", ".join(batch)
        q = '{ items(ids: [%s]) { id updates(limit: 30) { text_body created_at creator { name } replies { text_body created_at creator { name } } } } }' % ids_str
        r = mq(q, api_key)

        for item in r.get("data", {}).get("items", []):
            mid = item["id"]
            item_updates = []
            for u in item.get("updates", []):
                # Top-level update
                item_updates.append({
                    "text": u.get("text_body", ""),
                    "created_at": u.get("created_at", ""),
                    "creator": u.get("creator", {}).get("name", ""),
                    "is_reply": False,
                })
                # Replies (where Saf's notes live)
                for reply in u.get("replies", []):
                    item_updates.append({
                        "text": reply.get("text_body", ""),
                        "created_at": reply.get("created_at", ""),
                        "creator": reply.get("creator", {}).get("name", ""),
                        "is_reply": True,
                    })
            updates[mid] = item_updates

        done = min(i + 5, total)
        if done % 25 == 0 or done == total:
            log("    Updates pulled: %d/%d items" % (done, total))

        # Rate limiting — be gentle with per-item update queries
        time.sleep(0.5)

    return updates


def parse_ammeter(text):
    """Extract ammeter reading from update text.
    Saf writes readings like: '5V', '20V 1.5A', '20V 0.8A', etc.
    """
    if not text:
        return None

    # Common patterns in Saf's notes
    patterns = [
        r'(\d+\.?\d*)\s*[Vv]\s+(\d+\.?\d*)\s*[Aa]',   # "20V 1.5A"
        r'(\d+\.?\d*)\s*[Vv]\s*[\-/]\s*(\d+\.?\d*)\s*[Aa]',  # "20V-1.5A" or "20V/1.5A"
        r'ammeter[:\s]+(\d+\.?\d*)\s*[Vv]',              # "ammeter: 5V"
        r'(\d+\.?\d*)\s*[Vv]\b',                          # standalone "5V" or "20V"
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            groups = match.groups()
            if len(groups) >= 2:
                return {"voltage": float(groups[0]), "amps": float(groups[1]), "raw": match.group(0)}
            else:
                return {"voltage": float(groups[0]), "amps": None, "raw": match.group(0)}

    return None


def parse_fault_keywords(text):
    """Extract fault-related keywords from Saf's diagnostic notes."""
    if not text:
        return []

    text_lower = text.lower()
    keywords = []

    # Board-level fault indicators
    fault_terms = {
        "usb-c": "USB-C IC",
        "usb c": "USB-C IC",
        "power ic": "Power IC",
        "ppbus": "PPBUS Short",
        "pp_bus": "PPBUS Short",
        "ssd": "SSD Controller",
        "nand": "NAND Flash",
        "liquid": "Liquid Damage",
        "water": "Liquid Damage",
        "corrosion": "Liquid Damage",
        "cpu": "CPU Issue",
        "gpu": "GPU Issue",
        "reball": "Reball",
        "short": "Short Circuit",
        "no power": "No Power",
        "no charge": "No Charge",
        "backlight": "Backlight",
        "t2": "T2 Chip",
        "bios": "BIOS/Firmware",
        "efi": "BIOS/Firmware",
        "smc": "SMC Reset",
        "trackpad": "Trackpad",
        "keyboard": "Keyboard",
        "battery": "Battery",
        "charging": "Charging IC",
        "tristar": "Tristar IC",
        "tigris": "Tigris IC",
        "audio": "Audio IC",
        "wifi": "WiFi Module",
        "bluetooth": "Bluetooth",
        "display": "Display IC",
        "lcd": "LCD",
        "flexgate": "Flexgate",
        "thunderbolt": "Thunderbolt",
    }

    for term, label in fault_terms.items():
        if term in text_lower and label not in keywords:
            keywords.append(label)

    return keywords


def categorise_complexity(device, saf_notes):
    """Categorise repair complexity based on parts, notes, and outcome.

    Routine: single component swap, known fault pattern
    Moderate: multi-component, probing required but predictable
    Complex: liquid damage, trace work, multi-fault, reball
    Failed: BER, unrepairable
    No Board Work: device didn't need logic board repair
    """
    parts = device.get("parts_used", [])
    has_lb = device.get("has_logic_board", False)
    status = device.get("status", "").lower()

    # BER / unrepairable
    if "ber" in status or "beyond" in status:
        return "failed"

    if not has_lb:
        return "no_board_work"

    # Analyse notes for complexity indicators
    all_text = " ".join(n.get("text", "") for n in saf_notes).lower()

    complex_indicators = ["liquid", "water", "corrosion", "reball", "trace",
                          "multi", "cpu", "gpu", "bga"]
    moderate_indicators = ["ppbus", "short", "ssd", "nand", "usb-c", "usb c",
                           "charging", "tristar", "tigris"]
    routine_indicators = ["power ic", "battery", "backlight", "smc",
                          "keyboard", "trackpad", "adapter"]

    complex_score = sum(1 for ind in complex_indicators if ind in all_text)
    moderate_score = sum(1 for ind in moderate_indicators if ind in all_text)
    routine_score = sum(1 for ind in routine_indicators if ind in all_text)

    # Count distinct board-level parts
    board_parts = [p for p in parts if "logic" in p.lower() or "board" in p.lower()]

    if complex_score > 0:
        return "complex"
    elif moderate_score > 0 or len(board_parts) > 1:
        return "moderate"
    elif routine_score > 0 or len(board_parts) == 1:
        return "routine"

    # Default: if has logic board but no notes to classify, mark as unclassified
    return "unclassified"


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Layer 3: Saf Diagnostic Notes & Repair Complexity")
    parser.add_argument("--all-clients", action="store_true",
                        help="Query all clients, not just BM (queries Monday directly)")
    parser.add_argument("--input", default=DEFAULT_INPUT,
                        help="Input JSON file (default: cached repair analysis data)")
    parser.add_argument("--skip-updates", action="store_true",
                        help="Skip pulling updates (use cached data only for testing)")
    args = parser.parse_args()

    env = load_env()
    api_key = env.get("MONDAY_APP_TOKEN", "")
    if not api_key:
        log("ERROR: MONDAY_APP_TOKEN not found")
        sys.exit(1)

    log("=== SAF DIAGNOSTIC NOTES & REPAIR COMPLEXITY ===")
    log("")

    # ================================================================
    # STEP 1: Get target devices
    # ================================================================
    if args.all_clients:
        log("STEP 1: Querying Monday for ALL Saf repairs (all clients)...")
        targets = get_targets_all_clients(api_key)
    else:
        log("STEP 1: Loading BM targets from %s..." % args.input)
        targets = get_targets_from_cached(args.input)

    log("  Target devices: %d" % len(targets))
    by_grade = Counter(d["grade"] for d in targets)
    for g, c in by_grade.most_common():
        lb = sum(1 for d in targets if d["grade"] == g and d.get("has_logic_board"))
        log("    %s: %d (%d with LB)" % (g, c, lb))
    log("")

    # ================================================================
    # STEP 2: Pull item updates from Monday
    # ================================================================
    item_ids = [d["main_board_id"] for d in targets]

    if args.skip_updates:
        log("STEP 2: SKIPPED (--skip-updates)")
        all_updates = {mid: [] for mid in item_ids}
    else:
        log("STEP 2: Pulling item updates for %d devices..." % len(item_ids))
        all_updates = pull_item_updates(item_ids, api_key)
        log("  Items with updates: %d" % sum(1 for v in all_updates.values() if v))
        total_updates = sum(len(v) for v in all_updates.values())
        log("  Total updates pulled: %d" % total_updates)
    log("")

    # ================================================================
    # STEP 3: Filter to Saf's updates & parse
    # ================================================================
    log("STEP 3: Filtering to Saf's updates and parsing...")

    results = []
    for device in targets:
        mid = device["main_board_id"]
        updates = all_updates.get(mid, [])

        # Filter to Saf's updates (creator name: "Safan Patel")
        saf_updates = [u for u in updates if "safan" in u.get("creator", "").lower()]

        # Parse ammeter from ALL updates (Saf writes it but others may too)
        ammeter_parsed = None
        for u in updates:
            parsed = parse_ammeter(u.get("text", ""))
            if parsed:
                ammeter_parsed = parsed
                break

        # Parse fault keywords from Saf's notes
        all_faults = []
        for u in saf_updates:
            faults = parse_fault_keywords(u.get("text", ""))
            all_faults.extend(faults)
        unique_faults = list(dict.fromkeys(all_faults))  # dedupe preserving order

        # Categorise complexity
        complexity = categorise_complexity(device, saf_updates)

        results.append({
            "main_board_id": mid,
            "item_name": device.get("item_name", ""),
            "grade": device.get("grade", ""),
            "status": device.get("status", ""),
            "client": device.get("client", ""),
            "has_logic_board": device.get("has_logic_board", False),
            "ammeter_reading_column": device.get("ammeter_reading", ""),
            "ammeter_parsed": ammeter_parsed,
            "parts_used": device.get("parts_used", []),
            "parts_cost": device.get("parts_cost", 0),
            "sale_price": device.get("sale_price", 0),
            "purchase_price": device.get("purchase_price", 0),
            "net": device.get("net"),
            "diag_time_secs": device.get("diag_time_secs", 0),
            "repair_time_secs": device.get("repair_time_secs", 0),
            "total_saf_updates": len(saf_updates),
            "saf_notes": [u.get("text", "")[:500] for u in saf_updates],  # truncate long notes
            "fault_keywords": unique_faults,
            "complexity": complexity,
        })

    log("  Parsed %d devices" % len(results))
    log("")

    # ================================================================
    # STEP 4: Summary
    # ================================================================
    log("STEP 4: Generating summary...")

    # Complexity breakdown
    by_complexity = Counter(r["complexity"] for r in results)
    lb_results = [r for r in results if r["has_logic_board"]]
    by_complexity_lb = Counter(r["complexity"] for r in lb_results)

    # Fault keyword frequency
    all_fault_kw = []
    for r in results:
        all_fault_kw.extend(r["fault_keywords"])
    fault_freq = Counter(all_fault_kw)

    # FUNC.CRACK investigation (19g)
    fc_devices = [r for r in results if r["grade"] == "FUNC.CRACK"]
    fc_with_lb = [r for r in fc_devices if r["has_logic_board"]]
    fc_without_lb = [r for r in fc_devices if not r["has_logic_board"]]

    # Notes coverage
    has_notes = sum(1 for r in results if r["total_saf_updates"] > 0)
    has_faults = sum(1 for r in results if r["fault_keywords"])

    print()
    print("=" * 80)
    print("SAF DIAGNOSTIC ANALYSIS — SUMMARY")
    print("=" * 80)
    print()
    print("Devices analysed: %d (Saf as repair_person)" % len(results))
    print("With Saf notes:   %d (%d%%)" % (has_notes, 100 * has_notes // max(len(results), 1)))
    print("With fault keywords: %d" % has_faults)
    print()

    print("--- COMPLEXITY (logic board devices only: %d) ---" % len(lb_results))
    for cat in ["routine", "moderate", "complex", "failed", "unclassified"]:
        c = by_complexity_lb.get(cat, 0)
        pct = 100 * c // max(len(lb_results), 1)
        print("  %-15s %3d (%2d%%)" % (cat, c, pct))
    print()

    print("--- COMPLEXITY (all Saf devices: %d) ---" % len(results))
    for cat in ["routine", "moderate", "complex", "failed", "no_board_work", "unclassified"]:
        c = by_complexity.get(cat, 0)
        pct = 100 * c // max(len(results), 1)
        print("  %-15s %3d (%2d%%)" % (cat, c, pct))
    print()

    print("--- TOP FAULT KEYWORDS ---")
    for kw, count in fault_freq.most_common(15):
        print("  %-20s %d" % (kw, count))
    print()

    print("--- FUNC.CRACK INVESTIGATION (19g) ---")
    print("Total FUNC.CRACK assigned to Saf: %d" % len(fc_devices))
    print("  With logic board part:    %d (board issue found)" % len(fc_with_lb))
    print("  Without logic board part: %d (needs investigation)" % len(fc_without_lb))
    if fc_without_lb:
        print()
        print("  FUNC.CRACK without LB — Saf's notes may explain why:")
        for r in fc_without_lb[:10]:
            notes_preview = "; ".join(r["saf_notes"])[:100] if r["saf_notes"] else "(no notes)"
            print("    %s | %s | %s" % (r["item_name"], r["status"], notes_preview))
    print()

    print("--- AMMETER vs OUTCOME (logic board devices) ---")
    ammeter_groups = defaultdict(lambda: {"sold": 0, "stuck": 0, "ber": 0, "other": 0, "nets": []})
    for r in lb_results:
        reading = r.get("ammeter_reading_column", "")
        if not reading:
            reading = "Unknown"

        status = r.get("status", "").lower()
        net = r.get("net")

        if "sold" in status or "listed" in status or (r.get("sale_price") or 0) > 0:
            ammeter_groups[reading]["sold"] += 1
            if net is not None:
                ammeter_groups[reading]["nets"].append(net)
        elif "ber" in status or "beyond" in status:
            ammeter_groups[reading]["ber"] += 1
        elif "paused" in status or "awaiting" in status or "error" in status:
            ammeter_groups[reading]["stuck"] += 1
        else:
            ammeter_groups[reading]["other"] += 1

    for reading in sorted(ammeter_groups.keys()):
        g = ammeter_groups[reading]
        total = g["sold"] + g["stuck"] + g["ber"] + g["other"]
        avg_net = sum(g["nets"]) / len(g["nets"]) if g["nets"] else 0
        print("  %-25s total=%d  sold=%d  stuck=%d  ber=%d  avg_net=£%.0f" % (
            reading, total, g["sold"], g["stuck"], g["ber"], avg_net))
    print()

    # ================================================================
    # STEP 5: Save
    # ================================================================
    os.makedirs(AUDIT_DIR, exist_ok=True)
    out_path = "%s/saf-diagnostics-%s.json" % (AUDIT_DIR, datetime.now().strftime("%Y-%m-%d"))

    output = {
        "generated": datetime.now().isoformat(),
        "source": "all_clients" if args.all_clients else args.input,
        "summary": {
            "total_devices": len(results),
            "with_notes": has_notes,
            "with_fault_keywords": has_faults,
            "with_logic_board": len(lb_results),
            "complexity_all": dict(by_complexity),
            "complexity_lb_only": dict(by_complexity_lb),
            "top_faults": dict(fault_freq.most_common(20)),
            "func_crack_total": len(fc_devices),
            "func_crack_with_lb": len(fc_with_lb),
            "func_crack_without_lb": len(fc_without_lb),
        },
        "devices": results,
    }

    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)

    print("Data saved to: %s" % out_path)
    print("Devices: %d" % len(results))
    log("Done.")


if __name__ == "__main__":
    main()
