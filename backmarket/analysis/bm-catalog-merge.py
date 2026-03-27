#!/usr/bin/env python3
"""
BM Catalog Merge — Phase 2 of BM Catalog Ground Truth

Merges three data sources into a single canonical catalog file:
  1. product-id-lookup.json (listing history — 279 entries, keyed by UUID)
  2. order-history-product-ids.json (from Phase 1, keyed by backmarket_id)
  3. sell-prices-latest.json (V6 scraper output)

Cross-referencing strategy:
  - Listing history: keyed by UUID, contains backmarket_id
  - Order history: keyed by backmarket_id (numeric), contains listing_ids
  - Scraper: keyed by model name, picker options contain UUIDs
  - We build a backmarket_id <-> UUID mapping from the listing history,
    then use it to link order data to UUID-keyed entries.

Output: bm-catalog.json — the canonical BM catalog file.

Usage:
    python3 bm-catalog-merge.py               # full run
    python3 bm-catalog-merge.py --dry-run      # show stats without writing
    python3 bm-catalog-merge.py --verbose       # show per-product merge decisions
    python3 bm-catalog-merge.py --dry-run --verbose

Read-only — no BM mutations.
"""

import os
import sys
import json
import re
from datetime import datetime, timezone


# ── File paths ──────────────────────────────────────────────────────

LISTING_HISTORY_PATH = "/home/ricky/builds/backmarket/data/product-id-lookup.json"
ORDER_HISTORY_PATH = "/home/ricky/builds/backmarket/data/order-history-product-ids.json"
SCRAPER_PATH = "/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json"
OUTPUT_PATH = "/home/ricky/builds/backmarket/data/bm-catalog.json"


# ── Title parsing ───────────────────────────────────────────────────

def parse_title(title):
    """Extract model_family, ram, ssd, cpu_gpu from a BM title.

    BM title format examples:
      MacBook Pro 14-inch (2021) - Apple M1 Pro 8-core and 14-core GPU - 16GB RAM - SSD 1000GB - QWERTY - English
      MacBook Air 13-inch (2022) - Apple M2 8-core and 8-core GPU - 8GB RAM - SSD 256GB - QWERTY - English
      MacBook Air Retina 13-inch (2020) - Core i5 - 8GB SSD 512 QWERTY - English
    """
    if not title:
        return {}

    result = {}

    # Model family: everything up to and including the year in parens
    family_match = re.match(r"^(MacBook\s+(?:Pro|Air)(?:\s+Retina)?\s+\d+-inch\s*\(\d{4}\))", title)
    if family_match:
        result["model_family"] = family_match.group(1)

    # CPU/GPU: "Apple M1 Pro 8-core and 14-core GPU" or "Core i5" etc
    # Match the full segment between " - " delimiters that starts with Apple M or Core i
    cpu_match = re.search(r" - ((?:Apple M|Core i)[\w\d].*?) - ", title)
    if cpu_match:
        result["cpu_gpu"] = cpu_match.group(1).strip()

    # RAM: "16GB RAM" or "8GB" before SSD
    ram_match = re.search(r"(\d+)\s*GB\s*RAM", title)
    if ram_match:
        result["ram"] = f"{ram_match.group(1)}GB"
    else:
        # Older format: "8GB SSD 512"
        ram_match2 = re.search(r"- (\d+)GB\s+SSD", title)
        if ram_match2:
            result["ram"] = f"{ram_match2.group(1)}GB"

    # SSD: "SSD 1000GB" or "SSD 512"
    ssd_match = re.search(r"SSD\s+(\d+)\s*(?:GB)?", title)
    if ssd_match:
        ssd_val = int(ssd_match.group(1))
        result["ssd"] = f"{ssd_val}GB"

    return result


def derive_model_family_from_scraper_name(name):
    """Convert scraper model name to a model family string.

    Input: 'Air 13" 2020 M1', 'Pro 14" 2021 M1 Pro'
    Output: 'MacBook Air 13-inch (2020)', 'MacBook Pro 14-inch (2021)'
    """
    m = re.match(r"^(Air|Pro)\s+(\d+)\"\s+(\d{4})", name)
    if m:
        typ = m.group(1)
        size = m.group(2)
        year = m.group(3)
        return f"MacBook {typ} {size}-inch ({year})"
    return None


# ── Load data sources ───────────────────────────────────────────────

def load_listing_history():
    """Load product-id-lookup.json (keyed by UUID)."""
    if not os.path.exists(LISTING_HISTORY_PATH):
        print(f"  WARNING: Listing history not found at {LISTING_HISTORY_PATH}")
        return {}
    with open(LISTING_HISTORY_PATH) as f:
        return json.load(f)


def load_order_history():
    """Load order-history-product-ids.json (keyed by backmarket_id)."""
    if not os.path.exists(ORDER_HISTORY_PATH):
        print(f"  WARNING: Order history not found at {ORDER_HISTORY_PATH}")
        return {}
    with open(ORDER_HISTORY_PATH) as f:
        data = json.load(f)
    return data.get("products", data)


def load_scraper():
    """Load sell-prices-latest.json (V6 scraper output)."""
    if not os.path.exists(SCRAPER_PATH):
        print(f"  WARNING: Scraper data not found at {SCRAPER_PATH}")
        return {}
    with open(SCRAPER_PATH) as f:
        return json.load(f)


# ── Build cross-reference maps ──────────────────────────────────────

def build_crossref(listing_history, order_history):
    """Build backmarket_id <-> UUID mapping from listing history.

    Returns:
      bmid_to_uuids: dict of backmarket_id (str) -> list of UUIDs
      uuid_to_bmid: dict of UUID -> backmarket_id (int)
      listing_id_to_uuid: dict of listing_id (int) -> UUID
    """
    bmid_to_uuids = {}  # str(backmarket_id) -> [uuid, ...]
    uuid_to_bmid = {}   # uuid -> backmarket_id (int)
    listing_id_to_uuid = {}  # listing_id -> uuid

    for uuid, entry in listing_history.items():
        bmid = entry.get("backmarket_id")
        if bmid:
            bmid_str = str(bmid)
            if bmid_str not in bmid_to_uuids:
                bmid_to_uuids[bmid_str] = []
            bmid_to_uuids[bmid_str].append(uuid)
            uuid_to_bmid[uuid] = bmid

        for lid in entry.get("listing_ids", []):
            listing_id_to_uuid[lid] = uuid

    return bmid_to_uuids, uuid_to_bmid, listing_id_to_uuid


# ── Extract product_ids from scraper picker data ────────────────────

def extract_scraper_products(scraper_data):
    """Extract all product_ids from scraper picker options.

    Returns dict of uuid -> {info from scraper}.
    Also returns a set of base UUIDs (the parent model UUIDs).
    """
    products = {}
    base_uuids = set()
    models_data = scraper_data.get("models", {})
    scraped_at = scraper_data.get("scraped_at", "")

    for model_name, model in models_data.items():
        if not model.get("scraped"):
            continue

        base_uuid = model.get("uuid", "")
        if base_uuid:
            base_uuids.add(base_uuid)

        model_family = derive_model_family_from_scraper_name(model_name)

        grade_prices = {}
        for grade_name, grade_info in model.get("grades", {}).items():
            if grade_info.get("available") and grade_info.get("price") is not None:
                grade_prices[grade_name] = grade_info["price"]

        # Collect all product_ids from pickers
        picker_categories = ["ram", "ssd", "cpu_gpu", "colour", "size"]
        for category in picker_categories:
            picker = model.get(category, {})
            for option_label, option_info in picker.items():
                pid = option_info.get("productId")
                if not pid:
                    continue

                pid = str(pid)
                available = option_info.get("available", False)
                price = option_info.get("price")

                if pid in products:
                    entry = products[pid]
                    entry["picker_options"].append({
                        "category": category,
                        "label": option_label,
                        "price": price,
                    })
                    if available:
                        entry["available"] = True
                    if model_family and not entry.get("model_family"):
                        entry["model_family"] = model_family
                    entry["scraper_model_names"].add(model_name)
                else:
                    products[pid] = {
                        "model_family": model_family,
                        "grade_prices": grade_prices,
                        "available": available,
                        "scraped_at": scraped_at,
                        "is_base_uuid": (pid == base_uuid),
                        "scraper_model_names": {model_name},
                        "picker_options": [{
                            "category": category,
                            "label": option_label,
                            "price": price,
                        }],
                    }

        # Register the base UUID
        if base_uuid and base_uuid not in products:
            products[base_uuid] = {
                "model_family": model_family,
                "grade_prices": grade_prices,
                "available": True,
                "scraped_at": scraped_at,
                "is_base_uuid": True,
                "scraper_model_names": {model_name},
                "picker_options": [],
            }

    return products, base_uuids


# ── Derive spec from picker options ─────────────────────────────────

def derive_spec_from_picker(picker_options):
    """Try to derive RAM, SSD, colour, CPU/GPU from picker options."""
    spec = {}
    for opt in picker_options:
        cat = opt["category"]
        label = opt["label"]
        if cat == "ram":
            spec["ram"] = label.replace(" ", "")
        elif cat == "ssd":
            spec["ssd"] = label.replace(" ", "")
        elif cat == "colour":
            spec["colour"] = label
        elif cat == "cpu_gpu":
            spec["cpu_gpu"] = label
    return spec


# ── Merge logic ─────────────────────────────────────────────────────

def merge_catalog(listing_history, order_history, scraper_products, scraper_base_uuids,
                  bmid_to_uuids, uuid_to_bmid, listing_id_to_uuid, verbose=False):
    """Merge all sources into a unified catalog, keyed by UUID product_id."""
    variants = {}
    model_index = {}

    # Track which UUIDs come from which sources
    listing_uuids = set(listing_history.keys())
    scraper_uuids = set(scraper_products.keys())

    # Build set of UUIDs reachable from order history via cross-reference
    order_reachable_uuids = set()
    order_data_by_uuid = {}  # uuid -> order history entry

    for bmid_str, order_entry in order_history.items():
        # Try direct backmarket_id -> UUID mapping
        uuids_for_bmid = bmid_to_uuids.get(bmid_str, [])

        # Also try listing_id -> UUID mapping
        for lid in order_entry.get("listing_ids_seen", []):
            uuid = listing_id_to_uuid.get(lid)
            if uuid and uuid not in uuids_for_bmid:
                uuids_for_bmid.append(uuid)

        if uuids_for_bmid:
            for uuid in uuids_for_bmid:
                order_reachable_uuids.add(uuid)
                # Store the order data against the UUID
                if uuid not in order_data_by_uuid:
                    order_data_by_uuid[uuid] = order_entry
                else:
                    # Merge: take higher order count, wider date range, etc.
                    existing = order_data_by_uuid[uuid]
                    existing["order_count"] = existing.get("order_count", 0) + order_entry.get("order_count", 0)
                    if order_entry.get("first_seen") and (not existing.get("first_seen") or order_entry["first_seen"] < existing["first_seen"]):
                        existing["first_seen"] = order_entry["first_seen"]
                    if order_entry.get("last_seen") and (not existing.get("last_seen") or order_entry["last_seen"] > existing["last_seen"]):
                        existing["last_seen"] = order_entry["last_seen"]
                    for s in order_entry.get("skus_seen", []):
                        if s not in existing.get("skus_seen", []):
                            existing.setdefault("skus_seen", []).append(s)
                    for p in order_entry.get("prices_seen", []):
                        if p not in existing.get("prices_seen", []):
                            existing.setdefault("prices_seen", []).append(p)
        else:
            # Order with no matching UUID — log but skip (no UUID to key on)
            if verbose:
                print(f"  [order-only] backmarket_id={bmid_str} title={order_entry.get('title', '')[:60]} — no UUID found")

    # Count unmatched orders
    unmatched_order_count = 0
    for bmid_str in order_history:
        uuids_for_bmid = bmid_to_uuids.get(bmid_str, [])
        for lid in order_history[bmid_str].get("listing_ids_seen", []):
            uuid = listing_id_to_uuid.get(lid)
            if uuid and uuid not in uuids_for_bmid:
                uuids_for_bmid.append(uuid)
        if not uuids_for_bmid:
            unmatched_order_count += 1

    all_uuids = listing_uuids | scraper_uuids | order_reachable_uuids

    for uuid in all_uuids:
        in_listing = uuid in listing_uuids
        in_order = uuid in order_reachable_uuids
        in_scraper = uuid in scraper_uuids

        # Build evidence_sources list
        evidence = []
        if in_listing:
            evidence.append("listing_history")
        if in_order:
            evidence.append("order_history")
        if in_scraper:
            sp = scraper_products[uuid]
            has_picker_options = bool(sp.get("picker_options"))
            if sp.get("is_base_uuid"):
                evidence.append("scraper_base")
            if has_picker_options:
                evidence.append("scraper_picker")

        # Determine confidence
        our_data = in_listing or in_order
        scraper_corroborated = in_scraper
        if our_data and scraper_corroborated:
            confidence = "exact_verified"
        elif our_data:
            confidence = "historical_verified"
        elif scraper_corroborated:
            confidence = "market_only"
        else:
            confidence = "not_found"

        # NOTE: verification_status is set AFTER spec parsing (below)
        # so we can downgrade entries with incomplete specs.

        # Merge title — listing history has the most reliable titles
        title = ""
        if in_listing:
            title = listing_history[uuid].get("title", "")
        if not title and in_order:
            od = order_data_by_uuid.get(uuid, {})
            title = od.get("title", "")

        # Merge backmarket_id
        backmarket_id = None
        if in_listing:
            backmarket_id = listing_history[uuid].get("backmarket_id")
        if not backmarket_id:
            backmarket_id = uuid_to_bmid.get(uuid)

        # Parse specs from title
        parsed = parse_title(title)
        model_family = parsed.get("model_family", "")
        ram = parsed.get("ram", "")
        ssd = parsed.get("ssd", "")
        cpu_gpu = parsed.get("cpu_gpu", "")
        colour = ""

        # Supplement from scraper picker data
        if in_scraper:
            sp = scraper_products[uuid]
            picker_spec = derive_spec_from_picker(sp.get("picker_options", []))
            if not ram and picker_spec.get("ram"):
                ram = picker_spec["ram"]
            if not ssd and picker_spec.get("ssd"):
                ssd = picker_spec["ssd"]
            if not colour and picker_spec.get("colour"):
                colour = picker_spec["colour"]
            if not cpu_gpu and picker_spec.get("cpu_gpu"):
                cpu_gpu = picker_spec["cpu_gpu"]
            if not model_family and sp.get("model_family"):
                model_family = sp["model_family"]

        # Determine verification_status based on spec completeness
        # Finding #1 fix: confidence level alone is not enough — entries missing
        # core spec fields must be downgraded to needs_review even if they have
        # listing/order history, because downstream consumers treat "verified" as
        # "ready for exact resolution".
        has_core_specs = bool(model_family and ram and ssd)
        if confidence in ("exact_verified", "historical_verified"):
            if has_core_specs:
                verification = "verified"
            else:
                verification = "needs_review"
        elif confidence == "market_only":
            verification = "needs_review"
        else:
            verification = "unverifiable_sold_out"

        # Grade prices from scraper
        grade_prices = {}
        if in_scraper:
            grade_prices = scraper_products[uuid].get("grade_prices", {})

        # Available from scraper
        available = False
        if in_scraper:
            available = scraper_products[uuid].get("available", False)

        # Last seen timestamp
        last_seen = ""
        if in_scraper:
            last_seen = scraper_products[uuid].get("scraped_at", "")
        if in_order:
            od = order_data_by_uuid.get(uuid, {})
            order_last = od.get("last_seen", "")
            if order_last and (not last_seen or order_last > last_seen):
                last_seen = order_last
        if not last_seen:
            last_seen = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        entry = {
            "product_id": uuid,
            "title": title,
            "backmarket_id": backmarket_id,
            "ram": ram,
            "ssd": ssd,
            "cpu_gpu": cpu_gpu,
            "colour": colour,
            "model_family": model_family,
            "evidence_sources": evidence,
            "resolution_confidence": confidence,
            "verification_status": verification,
            "last_seen_at": last_seen,
            "grade_prices": grade_prices,
            "available": available,
        }

        variants[uuid] = entry

        # Build model index
        if model_family:
            if model_family not in model_index:
                model_index[model_family] = []
            if uuid not in model_index[model_family]:
                model_index[model_family].append(uuid)

        if verbose:
            src_str = "+".join(evidence)
            print(f"  {uuid[:12]}... [{confidence}] sources={src_str} title={title[:60]}")

    return variants, model_index, unmatched_order_count


# ── Main ────────────────────────────────────────────────────────────

def main():
    dry_run = "--dry-run" in sys.argv
    verbose = "--verbose" in sys.argv

    print("=" * 60)
    print("BM Catalog Merge — Phase 2")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}{' (verbose)' if verbose else ''}")
    print(f"Output: {OUTPUT_PATH}")
    print("=" * 60)

    # ── Load sources ────────────────────────────────────────────────

    print("\n--- Loading data sources ---")

    listing_history = load_listing_history()
    print(f"  Listing history: {len(listing_history)} entries from {LISTING_HISTORY_PATH}")

    order_history = load_order_history()
    print(f"  Order history: {len(order_history)} entries from {ORDER_HISTORY_PATH}")

    scraper_data = load_scraper()
    models_count = len(scraper_data.get("models", {}))
    scraped_ok = sum(1 for m in scraper_data.get("models", {}).values() if m.get("scraped"))
    print(f"  Scraper: {models_count} models ({scraped_ok} scraped) from {SCRAPER_PATH}")

    # ── Build cross-reference maps ──────────────────────────────────

    print("\n--- Building cross-reference maps ---")
    bmid_to_uuids, uuid_to_bmid, listing_id_to_uuid = build_crossref(listing_history, order_history)
    print(f"  backmarket_id -> UUID mappings: {len(bmid_to_uuids)}")
    print(f"  UUID -> backmarket_id mappings: {len(uuid_to_bmid)}")
    print(f"  listing_id -> UUID mappings: {len(listing_id_to_uuid)}")

    # ── Extract scraper product_ids ─────────────────────────────────

    print("\n--- Extracting scraper product_ids ---")
    scraper_products, scraper_base_uuids = extract_scraper_products(scraper_data)
    print(f"  Unique product_ids from scraper: {len(scraper_products)}")
    print(f"  Base UUIDs (parent models): {len(scraper_base_uuids)}")

    # ── Merge ───────────────────────────────────────────────────────

    print("\n--- Merging ---")
    variants, model_index, unmatched_orders = merge_catalog(
        listing_history, order_history, scraper_products, scraper_base_uuids,
        bmid_to_uuids, uuid_to_bmid, listing_id_to_uuid,
        verbose=verbose
    )

    # ── Compute summary ─────────────────────────────────────────────

    confidence_counts = {}
    verification_counts = {}
    spec_incomplete_count = 0
    for v in variants.values():
        c = v["resolution_confidence"]
        confidence_counts[c] = confidence_counts.get(c, 0) + 1
        vs = v["verification_status"]
        verification_counts[vs] = verification_counts.get(vs, 0) + 1
        if c in ("exact_verified", "historical_verified") and vs == "needs_review":
            spec_incomplete_count += 1

    summary = {
        "total_variants": len(variants),
        "exact_verified": confidence_counts.get("exact_verified", 0),
        "historical_verified": confidence_counts.get("historical_verified", 0),
        "market_only": confidence_counts.get("market_only", 0),
        "not_found": confidence_counts.get("not_found", 0),
        "verification_verified": verification_counts.get("verified", 0),
        "verification_needs_review": verification_counts.get("needs_review", 0),
        "verification_unverifiable": verification_counts.get("unverifiable_sold_out", 0),
        "spec_incomplete_downgraded": spec_incomplete_count,
        "order_history_unmatched": unmatched_orders,
    }

    # Calculate catalog week
    now = datetime.now(timezone.utc)
    iso_cal = now.isocalendar()
    catalog_version = f"{iso_cal[0]}-W{iso_cal[1]:02d}"

    print(f"\n--- Summary ---")
    print(f"  Total variants: {summary['total_variants']}")
    print(f"  exact_verified: {summary['exact_verified']}")
    print(f"  historical_verified: {summary['historical_verified']}")
    print(f"  market_only: {summary['market_only']}")
    print(f"  not_found: {summary['not_found']}")
    print(f"  ---")
    print(f"  verification=verified: {summary['verification_verified']}")
    print(f"  verification=needs_review: {summary['verification_needs_review']}")
    print(f"  verification=unverifiable: {summary['verification_unverifiable']}")
    print(f"  spec_incomplete_downgraded: {summary['spec_incomplete_downgraded']}")
    print(f"  ---")
    print(f"  Order history entries with no UUID match: {unmatched_orders}")
    print(f"  Model families: {len(model_index)}")
    print(f"  Catalog version: {catalog_version}")

    # Show model family breakdown
    print(f"\n--- Model families ---")
    for family in sorted(model_index.keys()):
        pids = model_index[family]
        print(f"  {family}: {len(pids)} variants")

    if dry_run:
        print(f"\n[dry-run] Would write {len(variants)} variants to {OUTPUT_PATH}")
        print("[dry-run] Run without --dry-run to write output.")
        return

    # ── Build output ────────────────────────────────────────────────

    output = {
        "merged_at": now.isoformat(),
        "catalog_version": catalog_version,
        "sources": {
            "listing_history": {
                "path": LISTING_HISTORY_PATH,
                "entries": len(listing_history),
            },
            "order_history": {
                "path": ORDER_HISTORY_PATH,
                "entries": len(order_history),
            },
            "scraper": {
                "path": SCRAPER_PATH,
                "models_scraped": scraped_ok,
            },
        },
        "summary": summary,
        "variants": variants,
        "model_index": {k: v for k, v in sorted(model_index.items())},
    }

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nWrote catalog to {OUTPUT_PATH}")
    file_size = os.path.getsize(OUTPUT_PATH)
    print(f"File size: {file_size / 1024:.1f} KB")
    print("Done.")


if __name__ == "__main__":
    main()
