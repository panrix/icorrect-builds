#!/usr/bin/env python3
"""
Generate Sell Price Lookup for Buy Box Monitor (V3)
Reads the latest sell-prices-YYYY-MM-DD.json from the comprehensive scraper
and generates sell-price-lookup.json for the buy box monitor.

Usage:
    python3 generate_sell_lookup.py
    python3 generate_sell_lookup.py --input data/buyback/sell-prices-2026-03-15.json
"""

import argparse
import json
import logging
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
DATA_DIR = Path("/home/ricky/.openclaw/agents/main/workspace/data/buyback")
OUTPUT_PATH = DATA_DIR / "sell-price-lookup.json"
DEFAULT_SELL_PRICE = 500

# Grade mapping: buyback grade -> which sell grade to use
GRADE_TO_SELL_GRADE = {
    'FUNC_CRACK': 'fair',
    'NONFUNC_USED': 'fair',
    'NONFUNC_CRACK': 'fair',
    'FUNC_USED': 'good',
    'FUNC_GOOD': 'excellent',
}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("sell-lookup")


# ---------------------------------------------------------------------------
# Spec to SKU Mapping
# ---------------------------------------------------------------------------
def parsed_spec_to_lookup_key(parsed: dict) -> str:
    """Convert parsed_spec to a lookup key matching buyback SKU format.
    
    Input parsed_spec:
        type=pro, size=14, year=2021, chip="M1 Pro 8-core 14-core GPU", ram=16GB, storage=512GB
    
    Output lookup key:
        MBP14.2021.M1PRO.16GB.512GB
    
    Buyback SKU format:
        MBP14.2021.M1PRO.APPLECORE.16GB.512GB.FUNC.CRACK
    """
    mac_type = parsed.get('type', 'unknown')
    size = parsed.get('size', 'unknown')
    year = parsed.get('year', 'unknown')
    chip_raw = parsed.get('chip', 'unknown')
    ram = parsed.get('ram', 'unknown')
    storage = parsed.get('storage', 'unknown')
    
    # Model prefix: MBA13, MBP14, etc.
    if mac_type == 'air':
        model = f"MBA{size}"
    elif mac_type == 'pro':
        model = f"MBP{size}"
    else:
        model = f"MAC{size}"
    
    # Chip: extract base chip + variant
    chip = normalise_chip(chip_raw)
    
    # Normalise storage
    storage = normalise_storage(storage)
    
    # Normalise RAM
    ram = normalise_ram(ram)
    
    return f"{model}.{year}.{chip}.{ram}.{storage}"


def normalise_chip(chip_str: str) -> str:
    """Normalise chip string to SKU format.
    
    Examples:
        "M1 Pro 8-core 14-core GPU" -> "M1PRO"
        "M2 8-core" -> "M2"
        "M3 Max 10-core 32-core GPU" -> "M3MAX"
        "M1 8-core 7-core GPU" -> "M1"
        "M4 10-core 10-core GPU" -> "M4"
    """
    if not chip_str or chip_str == 'unknown':
        return 'UNKNOWN'
    
    c = chip_str.upper().strip()
    match = re.match(r'(M\d)\s*(PRO|MAX)?', c)
    if match:
        base = match.group(1)
        variant = match.group(2) or ''
        return base + variant
    return c.replace(' ', '')


def normalise_storage(s: str) -> str:
    """Normalise storage: '256GB' stays, '2TB' -> '2TB', '1000GB' -> '1TB'."""
    s = s.strip().upper()
    # Convert large GB to TB
    gb_match = re.match(r'(\d+)GB$', s)
    if gb_match:
        gb = int(gb_match.group(1))
        if gb >= 1000 and gb % 1000 == 0:
            return f"{gb // 1000}TB"
        return s
    return s


def normalise_ram(r: str) -> str:
    """Normalise RAM: just ensure uppercase and no spaces."""
    return r.strip().upper().replace(' ', '')


def find_latest_scrape(data_dir: Path) -> Path:
    """Find the most recent sell-prices-YYYY-MM-DD.json file."""
    files = sorted(data_dir.glob("sell-prices-*.json"), reverse=True)
    for f in files:
        if f.stem.startswith("sell-prices-") and f.suffix == ".json":
            return f
    return None


# ---------------------------------------------------------------------------
# Apple Model Number Mapping (for legacy compatibility)
# ---------------------------------------------------------------------------
APPLE_MODEL_MAP = {
    # MacBook Air
    ('air', '13', '2020'): ['A2337'],
    ('air', '13', '2022'): ['A2681'],
    ('air', '13', '2024'): ['A3113'],
    ('air', '13', '2025'): ['A3113'],  # BM lists M4 Air as 2025
    ('air', '15', '2023'): ['A2941'],
    ('air', '15', '2024'): ['A3114'],
    ('air', '15', '2025'): ['A3114'],  # BM lists M4 Air 15 as 2025
    # MacBook Pro
    ('pro', '13', '2020'): ['A2338'],
    ('pro', '13', '2022'): ['A2338'],
    ('pro', '14', '2021'): ['A2442'],
    ('pro', '14', '2023'): ['A2918', 'A2992'],
    ('pro', '14', '2024'): ['A2918'],
    ('pro', '16', '2021'): ['A2485'],
    ('pro', '16', '2023'): ['A2780'],
}


def build_lookup(scrape_data: dict) -> dict:
    """Build the sell price lookup from V3 scraped data.
    
    Returns:
        by_spec: keyed by "MODEL.YEAR.CHIP.RAM.STORAGE" -> {fair, good, excellent, premium, source, url}
        by_family: keyed by model prefix (e.g. "MBA13.2022.M2") -> avg fair price
        by_apple_model: keyed by Apple model number -> avg fair price
    """
    by_spec = {}
    family_prices = {}  # family_key -> [fair_prices]
    apple_model_prices = {}  # apple_model -> [fair_prices]

    for result in scrape_data.get('results', []):
        if 'error' in result:
            continue

        parsed = result.get('parsed_spec', {})
        grades = result.get('grades', {})
        url = result.get('url', '')
        
        # Build lookup key
        lookup_key = parsed_spec_to_lookup_key(parsed)
        
        fair_price = grades.get('fair', {}).get('price')
        good_price = grades.get('good', {}).get('price')
        excellent_price = grades.get('excellent', {}).get('price')
        premium_price = grades.get('premium', {}).get('price')
        
        entry = {
            'fair': fair_price,
            'good': good_price,
            'excellent': excellent_price,
            'premium': premium_price,
            'source': 'scraped',
            'url': url,
        }
        
        # If we already have this key, keep the one with a fair price
        if lookup_key in by_spec:
            existing = by_spec[lookup_key]
            if existing.get('fair') is None and fair_price is not None:
                by_spec[lookup_key] = entry
            # If both have fair prices, keep the lower one (more conservative)
            elif existing.get('fair') is not None and fair_price is not None:
                if fair_price < existing['fair']:
                    by_spec[lookup_key] = entry
        else:
            by_spec[lookup_key] = entry
        
        # Family aggregation
        mac_type = parsed.get('type', '')
        size = parsed.get('size', '')
        year = parsed.get('year', '')
        chip = normalise_chip(parsed.get('chip', ''))
        
        if mac_type == 'air':
            model_prefix = f"MBA{size}"
        elif mac_type == 'pro':
            model_prefix = f"MBP{size}"
        else:
            model_prefix = f"MAC{size}"
        
        family_key = f"{model_prefix}.{year}.{chip}"
        
        if fair_price is not None:
            if family_key not in family_prices:
                family_prices[family_key] = []
            family_prices[family_key].append(fair_price)
            
            # Also aggregate by model_prefix alone
            if model_prefix not in family_prices:
                family_prices[model_prefix] = []
            family_prices[model_prefix].append(fair_price)
        
        # Apple model mapping
        type_key = (mac_type, size, year)
        apple_models = APPLE_MODEL_MAP.get(type_key, [])
        for am in apple_models:
            if fair_price is not None:
                if am not in apple_model_prices:
                    apple_model_prices[am] = []
                apple_model_prices[am].append(fair_price)

    # Average family prices
    by_family = {}
    for key, prices in family_prices.items():
        by_family[key] = round(sum(prices) / len(prices), 2)
    
    # Average apple model prices
    by_apple_model = {}
    for key, prices in apple_model_prices.items():
        by_apple_model[key] = round(sum(prices) / len(prices), 2)

    return {
        'by_spec': by_spec,
        'by_family': by_family,
        'by_apple_model': by_apple_model,
    }


def resolve_sell_price(lookup: dict, sku: str, grade: str = 'FUNC_CRACK') -> float:
    """Resolve a sell price for a given buyback SKU.
    
    Fallback chain:
    1. Exact spec match (model.year.chip.ram.storage)
    2. Family prefix average (model.year.chip)
    3. Model family average (model alone)
    4. Default £500
    """
    if not sku:
        return DEFAULT_SELL_PRICE

    parts = sku.upper().split('.')
    # SKU: MBA13.2022.M2.APPLECORE.8GB.256GB.FUNC.CRACK
    if len(parts) < 6:
        return DEFAULT_SELL_PRICE

    model = parts[0]          # MBA13
    year = parts[1]           # 2022
    chip = parts[2]           # M2
    ram = parts[4] if len(parts) > 4 else ''     # 8GB
    storage = parts[5] if len(parts) > 5 else '' # 256GB

    # Normalise storage for lookup
    storage = normalise_storage(storage)

    # Determine which sell grade to use
    grade_parts = '.'.join(parts[6:]) if len(parts) > 6 else ''
    sell_grade = 'fair'
    for g_key, g_val in GRADE_TO_SELL_GRADE.items():
        if g_key in grade_parts:
            sell_grade = g_val
            break

    by_spec = lookup.get('by_spec', {})
    by_family = lookup.get('by_family', {})

    # 1. Exact spec match
    spec_key = f"{model}.{year}.{chip}.{ram}.{storage}"
    if spec_key in by_spec:
        entry = by_spec[spec_key]
        price = entry.get(sell_grade) or entry.get('fair')
        if price:
            return price

    # 2. Family prefix (model.year.chip)
    prefix = f"{model}.{year}.{chip}"
    if prefix in by_family:
        return by_family[prefix]

    # 3. Model family average
    if model in by_family:
        return by_family[model]

    return DEFAULT_SELL_PRICE


def main():
    parser = argparse.ArgumentParser(description="Generate sell price lookup from scraped data (V3)")
    parser.add_argument("--input", type=str, help="Path to sell-prices JSON (default: latest)")
    args = parser.parse_args()

    # Find input file
    if args.input:
        input_path = Path(args.input)
    else:
        input_path = find_latest_scrape(DATA_DIR)

    if not input_path or not input_path.exists():
        log.error(f"No sell-prices file found in {DATA_DIR}")
        sys.exit(1)

    log.info(f"Reading: {input_path}")

    with open(input_path) as f:
        scrape_data = json.load(f)

    log.info(f"Scrape date: {scrape_data.get('scraped_date', 'unknown')}")
    log.info(f"Total URLs: {scrape_data.get('total_urls', 0)}")
    log.info(f"Scraped OK: {scrape_data.get('scraped', 0)}")
    log.info(f"Errors: {scrape_data.get('errors', 0)}")

    # Build lookup
    lookup = build_lookup(scrape_data)

    log.info(f"Spec entries: {len(lookup['by_spec'])}")
    log.info(f"Family entries: {len(lookup['by_family'])}")
    log.info(f"Apple model entries: {len(lookup['by_apple_model'])}")

    # Add metadata
    output = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'source_file': str(input_path.name),
        'scrape_date': scrape_data.get('scraped_date', ''),
        'default_sell_price': DEFAULT_SELL_PRICE,
        **lookup,
    }

    # Save
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, indent=2))
    log.info(f"Saved lookup to {OUTPUT_PATH}")

    # Print summary
    print(f"\n{'='*60}")
    print("Sell Price Lookup Summary (V3)")
    print(f"{'='*60}")
    print(f"Source: {input_path.name}")
    print(f"Spec keys: {len(lookup['by_spec'])}")

    for key in sorted(lookup['by_spec'].keys()):
        entry = lookup['by_spec'][key]
        fair = f"£{entry['fair']}" if entry.get('fair') else '-'
        good = f"£{entry['good']}" if entry.get('good') else '-'
        exc = f"£{entry['excellent']}" if entry.get('excellent') else '-'
        prem = f"£{entry['premium']}" if entry.get('premium') else '-'
        print(f"  {key}: Fair={fair} Good={good} Exc={exc} Prem={prem}")

    print(f"\nFamily averages:")
    for key in sorted(lookup['by_family'].keys()):
        print(f"  {key}: £{lookup['by_family'][key]}")

    print(f"\nApple model averages:")
    for key in sorted(lookup['by_apple_model'].keys()):
        print(f"  {key}: £{lookup['by_apple_model'][key]}")

    print(f"\nOutput: {OUTPUT_PATH}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
