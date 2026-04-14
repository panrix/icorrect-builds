#!/usr/bin/env python3
"""
Generate sell-price-lookup.json from V7 scraper output.

Input: data/sell-prices-YYYY-MM-DD.json or data/sell-prices-latest.json
Output schema stays backward compatible:
  - by_spec
  - by_family
  - by_apple_model
"""

import argparse
import json
import logging
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_PATH = DATA_DIR / "sell-price-lookup.json"
DEFAULT_SELL_PRICE = 500

GRADE_TO_SELL_GRADE = {
    "FUNC_CRACK": "fair",
    "NONFUNC_USED": "fair",
    "NONFUNC_CRACK": "fair",
    "FUNC_USED": "good",
    "FUNC_GOOD": "excellent",
}

APPLE_MODEL_MAP = {
    ("air", "13", "2020"): ["A2337"],
    ("air", "13", "2022"): ["A2681"],
    ("air", "13", "2024"): ["A3113"],
    ("air", "13", "2025"): ["A3113"],
    ("air", "15", "2023"): ["A2941"],
    ("air", "15", "2024"): ["A3114"],
    ("air", "15", "2025"): ["A3114"],
    ("pro", "13", "2020"): ["A2338"],
    ("pro", "13", "2022"): ["A2338"],
    ("pro", "14", "2021"): ["A2442"],
    ("pro", "14", "2023"): ["A2779", "A2918", "A2992"],
    ("pro", "14", "2024"): ["A2918"],
    ("pro", "16", "2021"): ["A2485"],
    ("pro", "16", "2023"): ["A2780", "A2991"],
    ("pro", "16", "2024"): ["A2780", "A2991"],
}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("sell-lookup")


def normalise_storage(s: str) -> str:
    s = str(s).strip().upper().replace(" ", "")
    m = re.match(r"^(\d+)GB$", s)
    if m:
        gb = int(m.group(1))
        if gb >= 1000 and gb % 1000 == 0:
            return f"{gb // 1000}TB"
        return f"{gb}GB"
    m = re.match(r"^(\d+)TB$", s)
    if m:
        return f"{int(m.group(1))}TB"
    return s


def normalise_ram(r: str) -> str:
    return str(r).strip().upper().replace(" ", "")


def find_latest_scrape(data_dir: Path) -> Optional[Path]:
    files = sorted(data_dir.glob("sell-prices-*.json"), reverse=True)
    for f in files:
        if f.name == "sell-prices-latest.json":
            continue
        return f
    latest = data_dir / "sell-prices-latest.json"
    return latest if latest.exists() else None


def parse_model_name(model_name: str) -> Optional[dict]:
    m = re.match(r'^(Air|Pro)\s+(\d+(?:\.\d+)?)"\s+(\d{4})\s+(.+)$', model_name)
    if not m:
        return None
    model_type = m.group(1).lower()
    size = str(int(float(m.group(2)))) if m.group(2).replace('.', '', 1).isdigit() else m.group(2)
    year = m.group(3)
    chip_text = m.group(4).strip()
    return {
        "type": model_type,
        "size": size,
        "year": year,
        "chip_text": chip_text,
        "chip": normalise_chip(chip_text),
        "model_name": model_name,
    }


def normalise_chip(chip_str: str) -> str:
    if not chip_str:
        return "UNKNOWN"
    c = chip_str.upper().strip()
    m = re.match(r"(M\d)\s*(PRO|MAX)?", c)
    if m:
        return m.group(1) + (m.group(2) or "")
    return re.sub(r"\s+", "", c)


def parsed_spec_to_lookup_prefix(parsed: dict) -> str:
    model = f"MBA{parsed['size']}" if parsed["type"] == "air" else f"MBP{parsed['size']}"
    return f"{model}.{parsed['year']}"


def parse_chip_picker(label: str) -> str:
    u = label.upper()
    if "M4 MAX" in u:
        return "M4MAX"
    if "M4 PRO" in u:
        return "M4PRO"
    if "M4" in u:
        return "M4"
    if "M3 MAX" in u:
        return "M3MAX"
    if "M3 PRO" in u:
        return "M3PRO"
    if "M3" in u:
        return "M3"
    if "M2 MAX" in u:
        return "M2MAX"
    if "M2 PRO" in u:
        return "M2PRO"
    if "M2" in u:
        return "M2"
    if "M1 MAX" in u:
        return "M1MAX"
    if "M1 PRO" in u:
        return "M1PRO"
    if "M1" in u:
        return "M1"
    return normalise_chip(label)


def allowed_ram_for_chip(chip: str, ram: str) -> bool:
    try:
        value = int(re.match(r"(\d+)", ram).group(1))
    except Exception:
        return True
    rules = {
        "M1MAX": {32, 64},
        "M1PRO": {16, 32},
        "M2MAX": {32, 64, 96},
        "M2PRO": {16, 32},
        "M3MAX": {36, 48, 64, 128},
        "M3PRO": {18, 36},
        "M3": {8, 16, 24},
        "M4MAX": {36, 48, 64, 128},
        "M4PRO": {24, 48},
        "M4": {16, 24, 32},
        "M2": {8, 16, 24},
        "M1": {8, 16},
    }
    allowed = rules.get(chip)
    return value in allowed if allowed else True


def preferred_entry(entries: Dict[str, dict], *, selected_uuid: Optional[str] = None) -> Tuple[Optional[str], Optional[dict]]:
    if not entries:
        return None, None
    if selected_uuid:
        for label, data in entries.items():
            if isinstance(data, dict) and data.get("productId") == selected_uuid:
                return label, data
    available = [(k, v) for k, v in entries.items() if isinstance(v, dict) and v.get("available") and v.get("price") is not None]
    if available:
        available.sort(key=lambda item: float(item[1]["price"]))
        return available[0]
    first = next(iter(entries.items()))
    return first


def grade_prices(model_data: dict) -> Dict[str, Optional[float]]:
    out = {}
    for src, dst in [("Fair", "fair"), ("Good", "good"), ("Excellent", "excellent"), ("Premium", "premium")]:
        entry = model_data.get("grades", {}).get(src, {})
        price = entry.get("price") if isinstance(entry, dict) else None
        out[dst] = float(price) if price is not None else None
    return out


def child_chip_filter(model_name: str) -> str:
    parsed = parse_model_name(model_name)
    return parsed["chip"] if parsed else "UNKNOWN"


def build_spec_entries(model_name: str, model_data: dict) -> List[Tuple[str, dict]]:
    parsed = parse_model_name(model_name)
    if not parsed or not model_data.get("scraped"):
        return []

    prefix = parsed_spec_to_lookup_prefix(parsed)
    selected_uuid = model_data.get("uuid")

    cpu_entries = model_data.get("cpu_gpu", {}) or {}
    ram_entries = model_data.get("ram", {}) or {}
    ssd_entries = model_data.get("ssd", {}) or {}

    grades = grade_prices(model_data)
    anchor_grade = None
    anchor_price = None
    for candidate in ["excellent", "good", "fair", "premium"]:
        if grades.get(candidate) is not None:
            anchor_grade = candidate
            anchor_price = float(grades[candidate])
            break
    if anchor_price is None:
        return []

    grade_deltas = {}
    for key in ["fair", "good", "excellent", "premium"]:
        if grades.get(key) is not None:
            grade_deltas[key] = float(grades[key] - anchor_price)
        else:
            grade_deltas[key] = None

    cpu_options = []
    if cpu_entries:
        for label, data in cpu_entries.items():
            if not isinstance(data, dict):
                continue
            chip = parse_chip_picker(label)
            if model_data.get("derived_from") and chip != child_chip_filter(model_name):
                continue
            cpu_options.append((chip, data))
    else:
        cpu_options.append((parsed["chip"], {"price": fair_base, "available": True}))

    ram_options = []
    if ram_entries:
        for label, data in ram_entries.items():
            if isinstance(data, dict):
                ram_options.append((normalise_ram(label), data))
    else:
        ram_options.append(("", {"price": fair_base, "available": True}))

    ssd_options = []
    if ssd_entries:
        for label, data in ssd_entries.items():
            if isinstance(data, dict):
                ssd_options.append((normalise_storage(label), data))
    else:
        ssd_options.append(("", {"price": fair_base, "available": True}))

    entries = []
    for chip, cpu_data in cpu_options:
        cpu_price = float(cpu_data.get("price")) if cpu_data.get("price") is not None else None
        if cpu_data.get("available") is False:
            continue
        for ram, ram_data in ram_options:
            if not allowed_ram_for_chip(chip, ram):
                continue
            ram_price = float(ram_data.get("price")) if ram_data.get("price") is not None else None
            if ram_data.get("available") is False:
                continue
            for storage, ssd_data in ssd_options:
                ssd_price = float(ssd_data.get("price")) if ssd_data.get("price") is not None else None
                if ssd_data.get("available") is False:
                    continue
                if not ram or not storage:
                    continue

                option_anchor_candidates = [p for p in [cpu_price, ram_price, ssd_price, anchor_price] if p is not None]
                # Treat non-grade picker prices as the page's anchor-grade price for that option,
                # then apply model-level grade deltas from the anchor grade to other grades.
                option_anchor_price = max(option_anchor_candidates) if option_anchor_candidates else None
                if option_anchor_price is None:
                    continue

                spec_key = f"{prefix}.{chip}.{ram}.{storage}"
                entry = {
                    "fair": round(float(option_anchor_price + grade_deltas['fair']), 2) if grade_deltas.get("fair") is not None else None,
                    "good": round(float(option_anchor_price + grade_deltas['good']), 2) if grade_deltas.get("good") is not None else None,
                    "excellent": round(float(option_anchor_price + grade_deltas['excellent']), 2) if grade_deltas.get("excellent") is not None else None,
                    "premium": round(float(option_anchor_price + grade_deltas['premium']), 2) if grade_deltas.get("premium") is not None else None,
                    "source": "scraped",
                    "url": model_data.get("url", ""),
                }
                entries.append((spec_key, entry))

    # Deduplicate spec keys conservatively by lowest fair price.
    deduped = {}
    for key, entry in entries:
        cur = deduped.get(key)
        if cur is None or (entry.get("fair") is not None and (cur.get("fair") is None or entry["fair"] < cur["fair"])):
            deduped[key] = entry
    return list(deduped.items())


def build_lookup(scrape_data: dict) -> dict:
    by_spec = {}
    family_prices: Dict[str, List[float]] = {}
    apple_model_prices: Dict[str, List[float]] = {}

    models = scrape_data.get("models", {})
    for model_name, model_data in models.items():
        parsed = parse_model_name(model_name)
        if not parsed:
            continue
        spec_entries = build_spec_entries(model_name, model_data)
        for spec_key, entry in spec_entries:
            current = by_spec.get(spec_key)
            if current is None or (entry.get("fair") is not None and (current.get("fair") is None or entry["fair"] < current["fair"])):
                by_spec[spec_key] = entry

            fair_price = entry.get("fair")
            if fair_price is not None:
                model_prefix = f"MBA{parsed['size']}" if parsed['type'] == 'air' else f"MBP{parsed['size']}"
                family_key = f"{model_prefix}.{parsed['year']}.{spec_key.split('.')[2]}"
                family_prices.setdefault(family_key, []).append(fair_price)
                family_prices.setdefault(model_prefix, []).append(fair_price)
                for apple_model in APPLE_MODEL_MAP.get((parsed['type'], parsed['size'], parsed['year']), []):
                    apple_model_prices.setdefault(apple_model, []).append(fair_price)

    by_family = {k: round(sum(v) / len(v), 2) for k, v in family_prices.items() if v}
    by_apple_model = {k: round(sum(v) / len(v), 2) for k, v in apple_model_prices.items() if v}
    return {"by_spec": by_spec, "by_family": by_family, "by_apple_model": by_apple_model}


def resolve_sell_price(lookup: dict, sku: str, grade: str = 'FUNC_CRACK') -> float:
    if not sku:
        return DEFAULT_SELL_PRICE
    parts = sku.upper().split('.')
    if len(parts) < 6:
        return DEFAULT_SELL_PRICE
    model, year, chip = parts[0], parts[1], parts[2]
    ram = parts[4]
    storage = normalise_storage(parts[5])
    grade_parts = '.'.join(parts[6:]) if len(parts) > 6 else ''
    sell_grade = 'fair'
    for g_key, g_val in GRADE_TO_SELL_GRADE.items():
        if g_key in grade_parts:
            sell_grade = g_val
            break
    spec_key = f"{model}.{year}.{chip}.{ram}.{storage}"
    if spec_key in lookup.get('by_spec', {}):
        entry = lookup['by_spec'][spec_key]
        return entry.get(sell_grade) or entry.get('fair') or DEFAULT_SELL_PRICE
    prefix = f"{model}.{year}.{chip}"
    if prefix in lookup.get('by_family', {}):
        return lookup['by_family'][prefix]
    if model in lookup.get('by_family', {}):
        return lookup['by_family'][model]
    return DEFAULT_SELL_PRICE


def main():
    parser = argparse.ArgumentParser(description="Generate sell price lookup from V7 scraped data")
    parser.add_argument("--input", type=str, help="Path to sell-prices JSON (default: latest)")
    args = parser.parse_args()

    input_path = Path(args.input) if args.input else (DATA_DIR / 'sell-prices-latest.json')
    if not input_path.exists():
        latest = find_latest_scrape(DATA_DIR)
        if latest:
            input_path = latest
    if not input_path.exists():
        log.error(f"No sell-prices file found in {DATA_DIR}")
        sys.exit(1)

    log.info(f"Reading: {input_path}")
    scrape_data = json.loads(input_path.read_text())
    log.info(f"Scraped at: {scrape_data.get('scraped_at', 'unknown')}")
    log.info(f"Models: {len(scrape_data.get('models', {}))}")

    lookup = build_lookup(scrape_data)
    log.info(f"Spec entries: {len(lookup['by_spec'])}")
    log.info(f"Family entries: {len(lookup['by_family'])}")
    log.info(f"Apple model entries: {len(lookup['by_apple_model'])}")

    output = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'source_file': input_path.name,
        'scrape_date': scrape_data.get('scraped_at', ''),
        'default_sell_price': DEFAULT_SELL_PRICE,
        **lookup,
    }

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, indent=2))
    log.info(f"Saved lookup to {OUTPUT_PATH}")

    print(f"\n{'='*60}")
    print("Sell Price Lookup Summary (V7)")
    print(f"{'='*60}")
    print(f"Source: {input_path.name}")
    print(f"Spec keys: {len(lookup['by_spec'])}")
    for key in sorted(lookup['by_spec'].keys())[:40]:
        entry = lookup['by_spec'][key]
        print(f"  {key}: Fair=£{entry['fair'] if entry.get('fair') is not None else '-'} Good=£{entry['good'] if entry.get('good') is not None else '-'} Exc=£{entry['excellent'] if entry.get('excellent') is not None else '-'} Prem=£{entry['premium'] if entry.get('premium') is not None else '-'}")
    if len(lookup['by_spec']) > 40:
        print(f"  ... {len(lookup['by_spec']) - 40} more")
    print(f"\nOutput: {OUTPUT_PATH}")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    main()
