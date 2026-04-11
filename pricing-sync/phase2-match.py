#!/usr/bin/env python3
"""Phase 2: Structural Matching Engine

Maps every product across Shopify, Monday (2 boards), and SumUp
using normalized (device, repair_category) pairs.

Matching strategy:
1. Parse Shopify titles into (device, repair) — these are canonical
2. For each Shopify repair, extract a generic category (Battery, Screen, etc.)
3. For Monday/SumUp items, normalize device name via alias map, normalize repair via alias map
4. Match within same device: find the Shopify repair whose category matches
"""
import json
import os
import re
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from utils import log

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
CONFIG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config")

# Repair keywords for parsing Shopify titles — longest first
REPAIR_KEYWORDS = sorted([
    "Battery Replacement", "Battery Repair",
    "Screen Repair", "Glass Screen Repair", "Display Screen Repair",
    "Display Repair", "LCD Screen Repair",
    "Charging Port Repair", "Keyboard Repair", "Trackpad Repair",
    "Diagnostic - No Power or Liquid Damage", "Diagnostic",
    "Housing & Rear Glass Repair", "Housing & Rear Glass Replacement",
    "Rear Glass Replacement",
    "Front Camera Repair", "Rear Camera Repair", "Rear Camera Lens Repair",
    "Earpiece Speaker Repair", "Loudspeaker Repair",
    "Microphone Repair",
    "Power Button Repair", "Volume Button Repair", "Mute Button Repair",
    "Side Button Repair", "Crown Repair",
    "Heart Rate Monitor (Rear Glass) Repair",
    "Screen Glass Repair",
    "Face ID Repair",
    "Original Screen Repair",
    "SSD Upgrade", "Logic Board Repair",
    "Top Case Replacement", "Speaker Repair",
    "USB-C Port Repair", "Audio Jack Repair", "WiFi Repair",
    "Dustgate Repair", "Touch Bar Repair", "Flexgate Repair",
], key=len, reverse=True)

# Generic categories to extract from Monday item names when status3 is unhelpful
ITEM_NAME_REPAIR_PATTERNS = [
    ("Earpiece Speaker", "Earpiece Speaker"),
    ("Loudspeaker", "Loudspeaker"),
    ("Microphone", "Microphone"),
    ("Power Button", "Power Button"),
    ("Volume Button", "Volume Button"),
    ("Mute Button", "Mute Button"),
    ("Mute Switch", "Mute Button"),
    ("Side Button", "Side Button"),
    ("Front Camera", "Front Camera"),
    ("Rear Camera Lens", "Rear Camera Lens"),
    ("Rear Camera", "Rear Camera"),
    ("Charging Port", "Charging Port"),
    ("Face ID", "Face ID"),
    ("Crown", "Crown"),
    ("Heart Rate", "Heart Rate Monitor"),
    ("HR Monitor", "Heart Rate Monitor"),
    ("Rear Housing", "Housing"),
    ("Rear Glass", "Housing"),
    ("Housing", "Housing"),
    ("Battery", "Battery"),
    ("Screen Lines", "Screen"),
    ("Glass Screen", "Glass Screen"),
    ("Glass", "Glass Screen"),
    ("LCD", "LCD Screen"),
    ("OLED", "Screen"),
    ("Screen", "Screen"),
    ("Keyboard", "Keyboard"),
    ("Trackpad", "Trackpad"),
    ("Touch Bar", "Touch Bar"),
    ("Dustgate", "Dustgate"),
    ("DustGate", "Dustgate"),
    ("Flexgate", "Flexgate"),
    ("FlexGate", "Flexgate"),
    ("Diagnostic", "Diagnostic"),
    ("Logic Board", "Logic Board"),
]

# Monday/SumUp repair name → list of Shopify repair name keywords to try matching (most specific first)
# Each Monday item tries these in order against the Shopify products for that device.
# First match wins — so order matters: specific before generic.
MONDAY_REPAIR_TO_SHOPIFY_KEYWORDS = {
    "Rear Camera Lens": ["Rear Camera Lens"],
    "Rear Camera": ["Rear Camera Repair"],  # won't match "Rear Camera Lens Repair"
    "Screen": ["Screen Repair (Genuine OLED)", "Screen Repair (Genuine Display)", "Display Screen Repair", "Screen Repair"],
    "Aftermarket Screen": ["Original Screen Repair", "LCD Screen Repair", "Display Repair (Genuine LCD)"],
    "Backlight": [],  # Backlight is a distinct repair — no direct Shopify equivalent
    "Glass Screen": ["Glass Screen Repair", "Screen Glass Repair"],
    "Display Screen": ["Display Screen Repair", "Screen Repair"],
    "Glass": ["Glass Screen Repair", "Screen Glass Repair", "Display Repair (Genuine LCD)", "Display Repair"],
    "Glass and Touch Screen": ["Display Repair (Genuine LCD)", "Display Repair", "Glass Screen Repair"],
    "LCD": ["LCD Screen Repair", "Original Screen Repair (Genuine LCD)", "Display Repair (Genuine LCD)"],
    "Original LCD Screen": ["Original Screen Repair (Genuine LCD)", "LCD Screen Repair", "Display Repair (Genuine LCD)"],
    "Original Apple Screen": ["Original Screen Repair", "Screen Repair"],
    "Battery": ["Battery Replacement", "Battery Repair"],
    "Charging Port": ["Charging Port Repair", "USB-C Port Repair"],
    "Microphone": ["Microphone Repair"],
    "Diagnostic": ["Diagnostic"],
    "ERROR 4013": ["Diagnostic"],
    "Housing": ["Housing & Rear Glass Repair", "Housing & Rear Glass Replacement", "Rear Glass Replacement"],
    "Rear Housing": ["Housing & Rear Glass Repair", "Housing & Rear Glass Replacement", "Rear Glass Replacement"],
    "Front Camera": ["Front Camera Repair"],
    "Earpiece Speaker": ["Earpiece Speaker Repair"],
    "Loudspeaker": ["Loudspeaker Repair", "Speaker Repair"],
    "Power Button": ["Power Button Repair"],
    "Volume Button": ["Volume Button Repair"],
    "Mute Button": ["Mute Button Repair"],
    "Side Button": ["Side Button Repair"],
    "Crown": ["Crown Repair"],
    "Heart Rate Monitor": ["Heart Rate Monitor"],
    "Keyboard": ["Keyboard Repair"],
    "Trackpad": ["Trackpad Repair"],
    "Face ID": ["Face ID Repair"],
    "Touch Bar": ["Touch Bar Repair"],
    "Dustgate": ["Dustgate Repair"],
    "Flexgate": ["Flexgate Repair"],
    "Logic Board": ["Logic Board Repair"],
    "WiFi": ["WiFi Repair"],
}


def find_shopify_match(device_repairs, repair_category):
    """Find the best Shopify product match for a given repair category.

    device_repairs: dict of {repair_name: shopify_entry} for one device
    repair_category: the normalized category from Monday/SumUp

    Returns the matching shopify_entry or None.
    """
    keywords = MONDAY_REPAIR_TO_SHOPIFY_KEYWORDS.get(repair_category)
    if not keywords:
        return None

    for keyword in keywords:
        for repair_name, entry in device_repairs.items():
            if keyword in repair_name:
                return entry
    return None


def parse_shopify_title(title):
    """Parse a Shopify product title into (device, repair)."""
    for kw in REPAIR_KEYWORDS:
        idx = title.find(kw)
        if idx > 0:
            device = title[:idx].strip().rstrip("-").strip()
            repair = title[idx:].strip()
            return device, repair
    return None, None


def load_json(filename):
    path = os.path.join(DATA_DIR, filename)
    with open(path) as f:
        return json.load(f)


def load_config(filename):
    path = os.path.join(CONFIG_DIR, filename)
    with open(path) as f:
        return json.load(f)


def main():
    log(f"Phase 2: Matching Engine — {datetime.now(timezone.utc).isoformat()}")

    # Load data
    shopify = load_json("shopify-live.json")
    monday_devices = load_json("monday-devices.json")
    monday_pricing = load_json("monday-pricing.json")
    sumup = load_json("sumup-parsed.json")

    # Load alias maps
    name_aliases = load_config("name-aliases.json")
    repair_aliases = load_config("repair-aliases.json")
    monday_device_map = name_aliases.get("monday_to_shopify", {})
    sumup_device_map = name_aliases.get("sumup_to_shopify", {})
    sumup_repair_map = repair_aliases.get("sumup_to_shopify", {})
    monday_repair_map = repair_aliases.get("monday_to_shopify", {})

    # -----------------------------------------------------------------------
    # Step 1: Build Shopify canonical catalog
    # -----------------------------------------------------------------------
    log("\n=== Step 1: Shopify Canonical Catalog ===")

    # catalog[device][repair_name] = {shopify repair info}
    # Keyed by FULL Shopify repair name — no collisions possible
    shopify_catalog = {}
    shopify_devices = set()
    skipped = []

    for item in shopify["items"]:
        device, repair = parse_shopify_title(item["title"])
        if not device or not repair:
            skipped.append(item["title"])
            continue

        shopify_devices.add(device)
        if device not in shopify_catalog:
            shopify_catalog[device] = {}

        shopify_catalog[device][repair] = {
            "id": item["id"],
            "variant_id": item["variant_id"],
            "title": item["title"],
            "repair_name": repair,
            "price": item["price"],
        }

    log(f"  Parsed {sum(len(v) for v in shopify_catalog.values())} repair entries across {len(shopify_catalog)} devices")
    if skipped:
        log(f"  Skipped {len(skipped)} non-repair items:")
        for s in skipped[:10]:
            log(f"    - {s}")
        if len(skipped) > 10:
            log(f"    ... and {len(skipped) - 10} more")

    # -----------------------------------------------------------------------
    # Step 2: Match Monday Pricing board items
    # -----------------------------------------------------------------------
    log("\n=== Step 2: Monday Pricing Board Matching ===")

    monday_matched = []
    monday_unmatched = []

    claimed_shopify_ids = set()  # Prevent duplicate Shopify ID assignment

    for item in monday_pricing["items"]:
        monday_device = item["group"]["title"]
        monday_item_name = item["name"]

        # Get price from numbers column
        monday_price = None
        monday_repair_type = None
        monday_shopify_id = None
        for cv in item["column_values"]:
            if cv["id"] == "numbers" and cv["text"]:
                try:
                    monday_price = float(cv["text"])
                except ValueError:
                    pass
            if cv["id"] == "status3" and cv["text"]:
                monday_repair_type = cv["text"]
            if cv["id"] == "text_mkzdte13" and cv["text"]:
                monday_shopify_id = cv["text"]

        # Resolve device name
        shopify_device = monday_device_map.get(monday_device, monday_device)
        if shopify_device is None:
            # Explicitly marked as no Shopify equivalent
            monday_unmatched.append({
                "monday_id": item["id"],
                "monday_name": monday_item_name,
                "monday_device": monday_device,
                "monday_repair_type": monday_repair_type,
                "monday_price": monday_price,
                "reason": "device_no_shopify_equivalent",
            })
            continue

        # Resolve repair category — ALWAYS use item name suffix for specificity
        # status3 is too coarse (e.g. "Small Part" covers 10+ repair types)
        suffix = monday_item_name
        if suffix.startswith(monday_device):
            suffix = suffix[len(monday_device):].strip()

        repair_category = None
        # Try pattern matching on the suffix (most specific first)
        for pattern, category in ITEM_NAME_REPAIR_PATTERNS:
            if pattern.lower() in suffix.lower():
                repair_category = category
                break

        # Fallback to status3 if item name didn't match
        if repair_category is None:
            repair_category = monday_repair_map.get(monday_repair_type)

        if repair_category is None:
            monday_unmatched.append({
                "monday_id": item["id"],
                "monday_name": monday_item_name,
                "monday_device": monday_device,
                "monday_repair_type": monday_repair_type,
                "monday_price": monday_price,
                "reason": f"repair_unmapped: '{monday_repair_type}' suffix: '{suffix}'",
            })
            continue

        # Find matching Shopify entry using keyword search
        device_repairs = shopify_catalog.get(shopify_device, {})
        shopify_entry = find_shopify_match(device_repairs, repair_category)

        # Prevent duplicate: if this Shopify ID is already claimed, skip
        if shopify_entry and shopify_entry["id"] in claimed_shopify_ids:
            monday_unmatched.append({
                "monday_id": item["id"],
                "monday_name": monday_item_name,
                "monday_device": monday_device,
                "monday_repair_type": monday_repair_type,
                "monday_price": monday_price,
                "reason": f"shopify_id_already_claimed: {shopify_entry['id']} ({shopify_entry['title']})",
            })
            shopify_entry = None

        if shopify_entry:
            claimed_shopify_ids.add(shopify_entry["id"])
            monday_matched.append({
                "shopify_device": shopify_device,
                "repair_category": repair_category,
                "monday_id": item["id"],
                "monday_name": monday_item_name,
                "monday_device": monday_device,
                "monday_repair_type": monday_repair_type,
                "monday_price": monday_price,
                "monday_shopify_id": monday_shopify_id,
                "shopify_id": shopify_entry["id"],
                "shopify_variant_id": shopify_entry["variant_id"],
                "shopify_title": shopify_entry["title"],
                "shopify_repair": shopify_entry["repair_name"],
                "shopify_price": shopify_entry["price"],
                "price_match": monday_price == shopify_entry["price"] if monday_price is not None else None,
                "price_delta": round(monday_price - shopify_entry["price"], 2) if monday_price is not None else None,
            })
        else:
            monday_unmatched.append({
                "monday_id": item["id"],
                "monday_name": monday_item_name,
                "monday_device": monday_device,
                "monday_repair_type": monday_repair_type,
                "monday_price": monday_price,
                "reason": f"no_shopify_product: device='{shopify_device}' category='{repair_category}'",
            })

    log(f"  Matched: {len(monday_matched)}")
    log(f"  Unmatched: {len(monday_unmatched)}")

    # -----------------------------------------------------------------------
    # Step 3: Match SumUp items
    # -----------------------------------------------------------------------
    log("\n=== Step 3: SumUp Matching ===")

    sumup_matched = []
    sumup_unmatched = []

    for device_entry in sumup["devices"]:
        sumup_device = device_entry["device"]
        item_id = device_entry["item_id"]

        # Resolve device name
        shopify_device = sumup_device_map.get(sumup_device, sumup_device)
        if shopify_device is None:
            for repair in device_entry["repairs"]:
                sumup_unmatched.append({
                    "sumup_device": sumup_device,
                    "sumup_repair": repair["name"],
                    "sumup_price": repair["price"],
                    "sumup_item_id": item_id,
                    "sumup_variant_id": repair["variant_id"],
                    "reason": "device_no_shopify_equivalent",
                })
            continue

        for repair in device_entry["repairs"]:
            sumup_repair = repair["name"]
            repair_category = sumup_repair_map.get(sumup_repair)

            if repair_category is None:
                sumup_unmatched.append({
                    "sumup_device": sumup_device,
                    "sumup_repair": sumup_repair,
                    "sumup_price": repair["price"],
                    "sumup_item_id": item_id,
                    "sumup_variant_id": repair["variant_id"],
                    "reason": f"repair_unmapped: '{sumup_repair}'",
                })
                continue

            # Find matching Shopify entry using keyword search
            device_repairs = shopify_catalog.get(shopify_device, {})
            shopify_entry = find_shopify_match(device_repairs, repair_category)

            if shopify_entry:
                sumup_matched.append({
                    "shopify_device": shopify_device,
                    "repair_category": repair_category,
                    "sumup_device": sumup_device,
                    "sumup_repair": sumup_repair,
                    "sumup_price": repair["price"],
                    "sumup_item_id": item_id,
                    "sumup_variant_id": repair["variant_id"],
                    "shopify_id": shopify_entry["id"],
                    "shopify_title": shopify_entry["title"],
                    "shopify_repair": shopify_entry["repair_name"],
                    "shopify_price": shopify_entry["price"],
                    "price_match": repair["price"] == shopify_entry["price"] if repair["price"] is not None else None,
                    "price_delta": round(repair["price"] - shopify_entry["price"], 2) if repair["price"] is not None else None,
                })
            else:
                sumup_unmatched.append({
                    "sumup_device": sumup_device,
                    "sumup_repair": sumup_repair,
                    "sumup_price": repair["price"],
                    "sumup_item_id": item_id,
                    "sumup_variant_id": repair["variant_id"],
                    "reason": f"no_shopify_product: device='{shopify_device}' category='{repair_category}'",
                })

    log(f"  Matched: {len(sumup_matched)}")
    log(f"  Unmatched: {len(sumup_unmatched)}")

    # -----------------------------------------------------------------------
    # Step 4: Build Shopify-only list (in Shopify but not in Monday/SumUp)
    # -----------------------------------------------------------------------
    log("\n=== Step 4: Shopify-Only Items ===")

    monday_matched_shopify_ids = {m["shopify_id"] for m in monday_matched}
    sumup_matched_shopify_ids = {s["shopify_id"] for s in sumup_matched}

    shopify_only_monday = []
    shopify_only_sumup = []

    for device, repairs in shopify_catalog.items():
        for repair_name, entry in repairs.items():
            if entry["id"] not in monday_matched_shopify_ids:
                shopify_only_monday.append({
                    "shopify_device": device,
                    "repair_category": repair_name,
                    "shopify_id": entry["id"],
                    "shopify_title": entry["title"],
                    "shopify_price": entry["price"],
                })
            if entry["id"] not in sumup_matched_shopify_ids:
                shopify_only_sumup.append({
                    "shopify_device": device,
                    "repair_category": repair_name,
                    "shopify_id": entry["id"],
                    "shopify_title": entry["title"],
                    "shopify_price": entry["price"],
                })

    log(f"  In Shopify but not Monday: {len(shopify_only_monday)}")
    log(f"  In Shopify but not SumUp: {len(shopify_only_sumup)}")

    # -----------------------------------------------------------------------
    # Step 5: Price mismatch analysis
    # -----------------------------------------------------------------------
    log("\n=== Step 5: Price Mismatches ===")

    monday_mismatches = [m for m in monday_matched if m["price_match"] is False]
    sumup_mismatches = [s for s in sumup_matched if s["price_match"] is False]

    log(f"  Monday price mismatches: {len(monday_mismatches)}")
    log(f"  SumUp price mismatches: {len(sumup_mismatches)}")

    if monday_mismatches:
        log("\n  Top 10 Monday mismatches (by abs delta):")
        for m in sorted(monday_mismatches, key=lambda x: abs(x["price_delta"] or 0), reverse=True)[:10]:
            log(f"    {m['shopify_device']} | {m['repair_category']:20s} | Monday: {m['monday_price']:>7.0f} | Shopify: {m['shopify_price']:>7.0f} | Delta: {m['price_delta']:>+7.0f}")

    if sumup_mismatches:
        log("\n  Top 10 SumUp mismatches (by abs delta):")
        for s in sorted(sumup_mismatches, key=lambda x: abs(x["price_delta"] or 0), reverse=True)[:10]:
            log(f"    {s['shopify_device']} | {s['repair_category']:20s} | SumUp: {s['sumup_price']:>7.0f} | Shopify: {s['shopify_price']:>7.0f} | Delta: {s['price_delta']:>+7.0f}")

    # -----------------------------------------------------------------------
    # Save master catalog
    # -----------------------------------------------------------------------
    total_shopify = sum(len(v) for v in shopify_catalog.values())
    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "stats": {
            "shopify_total": total_shopify,
            "monday_pricing_total": len(monday_pricing["items"]),
            "sumup_total": sumup["total_repairs"],
            "monday_matched": len(monday_matched),
            "monday_unmatched": len(monday_unmatched),
            "monday_price_mismatches": len(monday_mismatches),
            "sumup_matched": len(sumup_matched),
            "sumup_unmatched": len(sumup_unmatched),
            "sumup_price_mismatches": len(sumup_mismatches),
            "shopify_only_monday": len(shopify_only_monday),
            "shopify_only_sumup": len(shopify_only_sumup),
        },
        "monday_matched": monday_matched,
        "monday_unmatched": monday_unmatched,
        "sumup_matched": sumup_matched,
        "sumup_unmatched": sumup_unmatched,
        "shopify_only_monday": shopify_only_monday,
        "shopify_only_sumup": shopify_only_sumup,
        "shopify_skipped": skipped,
    }

    path = os.path.join(DATA_DIR, "catalog-matched.json")
    with open(path, "w") as f:
        json.dump(output, f, indent=2, default=str)
    log(f"\n  Saved {path}")

    # Final summary
    log("\n" + "=" * 70)
    log("PHASE 2 SUMMARY")
    log("=" * 70)
    log(f"  Shopify products parsed:       {total_shopify}")
    log(f"  Monday matched:                {len(monday_matched)} / {len(monday_pricing['items'])}")
    log(f"  Monday price mismatches:       {len(monday_mismatches)}")
    log(f"  Monday unmatched:              {len(monday_unmatched)}")
    log(f"  SumUp matched:                 {len(sumup_matched)} / {sumup['total_repairs']}")
    log(f"  SumUp price mismatches:        {len(sumup_mismatches)}")
    log(f"  SumUp unmatched:               {len(sumup_unmatched)}")
    log(f"  In Shopify, missing Monday:    {len(shopify_only_monday)}")
    log(f"  In Shopify, missing SumUp:     {len(shopify_only_sumup)}")
    log("=" * 70)


if __name__ == "__main__":
    main()
