#!/usr/bin/env python3
"""
Sync V7 scraper data to Google Sheet (Restructured)

Two product tabs (MacBook Air, MacBook Pro) + Dashboard summary.
Columns: Model | Model No(s) | Year | Screen | Chip | RAM | SSD | Colour | Grade |
         Product ID | Listing ID | Price | Min Price | Last Scraped

Usage:
    python3 sync_to_sheet.py            # Full sync
    python3 sync_to_sheet.py --dry-run  # Show what would be written
"""

import argparse
import json
import logging
import math
import os
import re
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SCRAPER_FILE = Path("/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json")
ENV_PATH = "/home/ricky/config/api-keys/.env"
SHEET_ID = "1LyC3UpuVzT_OEbA1yPNqFPMzP73q5H5DGBtfrUWQyJc"
TOKEN_URL = "https://oauth2.googleapis.com/token"
SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets"
BM_LISTINGS_URL = "https://www.backmarket.co.uk/ws/listings"

HEADERS = [
    "Model", "Model No(s)", "Year", "Screen", "Chip",
    "RAM", "SSD", "Colour", "Grade", "Product ID",
    "Listing ID", "Price", "Min Price", "Last Scraped",
]

# BM grade mapping to our scraper grades
BM_GRADE_MAP = {
    "FAIR": "Fair",
    "GOOD": "Good",
    "VERY_GOOD": "Excellent",
    "EXCELLENT": "Excellent",
    "STALLONE": "Premium",
}

GRADE_ORDER = {"Fair": 0, "Good": 1, "Excellent": 2, "Premium": 3}

# Model mapping: model key -> structured fields
MODEL_MAP = {
    'Air 13" 2020 M1':       {"model": "Air 13",  "model_nos": "A2337/A2179", "year": "2020", "screen": '13"', "chip": "M1",     "tab": "MacBook Air"},
    'Air 13" 2022 M2':       {"model": "Air 13",  "model_nos": "A2681",       "year": "2022", "screen": '13"', "chip": "M2",     "tab": "MacBook Air"},
    'Air 13" 2024 M3':       {"model": "Air 13",  "model_nos": "A3113",       "year": "2024", "screen": '13"', "chip": "M3",     "tab": "MacBook Air"},
    'Air 13" 2025 M4':       {"model": "Air 13",  "model_nos": "",            "year": "2025", "screen": '13"', "chip": "M4",     "tab": "MacBook Air"},
    'Air 15" 2023 M2':       {"model": "Air 15",  "model_nos": "A2941",       "year": "2023", "screen": '15"', "chip": "M2",     "tab": "MacBook Air"},
    'Pro 13" 2020 M1':       {"model": "Pro 13",  "model_nos": "A2338",       "year": "2020", "screen": '13"', "chip": "M1",     "tab": "MacBook Pro"},
    'Pro 13" 2022 M2':       {"model": "Pro 13",  "model_nos": "",            "year": "2022", "screen": '13"', "chip": "M2",     "tab": "MacBook Pro"},
    'Pro 14" 2021 M1 Pro':   {"model": "Pro 14",  "model_nos": "A2442",       "year": "2021", "screen": '14"', "chip": "M1 Pro", "tab": "MacBook Pro"},
    'Pro 14" 2021 M1 Max':   {"model": "Pro 14",  "model_nos": "A2442",       "year": "2021", "screen": '14"', "chip": "M1 Max", "tab": "MacBook Pro"},
    'Pro 14" 2023 M2 Pro':   {"model": "Pro 14",  "model_nos": "A2779",       "year": "2023", "screen": '14"', "chip": "M2 Pro", "tab": "MacBook Pro"},
    'Pro 14" 2023 M3':       {"model": "Pro 14",  "model_nos": "",            "year": "2023", "screen": '14"', "chip": "M3",     "tab": "MacBook Pro"},
    'Pro 14" 2023 M3 Pro':   {"model": "Pro 14",  "model_nos": "A2918/A2992", "year": "2023", "screen": '14"', "chip": "M3 Pro", "tab": "MacBook Pro"},
    'Pro 16" 2021 M1 Pro':   {"model": "Pro 16",  "model_nos": "A2485",       "year": "2021", "screen": '16"', "chip": "M1 Pro", "tab": "MacBook Pro"},
    'Pro 16" 2021 M1 Max':   {"model": "Pro 16",  "model_nos": "A2485",       "year": "2021", "screen": '16"', "chip": "M1 Max", "tab": "MacBook Pro"},
    'Pro 16" 2023 M2 Pro':   {"model": "Pro 16",  "model_nos": "A2780",       "year": "2023", "screen": '16"', "chip": "M2 Pro", "tab": "MacBook Pro"},
    'Pro 16" 2023 M3 Pro':   {"model": "Pro 16",  "model_nos": "A2991",       "year": "2023", "screen": '16"', "chip": "M3 Pro", "tab": "MacBook Pro"},
}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("sheet-sync")


# ---------------------------------------------------------------------------
# Google Auth
# ---------------------------------------------------------------------------
def get_access_token(refresh_token, client_id, client_secret):
    resp = requests.post(TOKEN_URL, data={
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": client_id,
        "client_secret": client_secret,
    })
    resp.raise_for_status()
    return resp.json()["access_token"]


def sheets_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------------------------------------------------------------------
# Sheets helpers
# ---------------------------------------------------------------------------
def get_existing_tabs(token):
    resp = requests.get(
        f"{SHEETS_API}/{SHEET_ID}",
        headers=sheets_headers(token),
        params={"fields": "sheets(properties(sheetId,title))"},
    )
    resp.raise_for_status()
    return {s["properties"]["title"]: s["properties"]["sheetId"]
            for s in resp.json().get("sheets", [])}


def batch_update(token, requests_list):
    if not requests_list:
        return
    resp = requests.post(
        f"{SHEETS_API}/{SHEET_ID}:batchUpdate",
        headers=sheets_headers(token),
        json={"requests": requests_list},
    )
    resp.raise_for_status()
    return resp.json()


def col_letter(n):
    result = ""
    while n > 0:
        n -= 1
        result = chr(65 + n % 26) + result
        n //= 26
    return result


def write_tab_data(token, tab_name, rows):
    safe = tab_name.replace("'", "''")
    # Clear first
    requests.post(
        f"{SHEETS_API}/{SHEET_ID}/values/'{safe}':clear",
        headers=sheets_headers(token),
    )
    if not rows:
        return
    max_cols = max(len(r) for r in rows)
    end_col = col_letter(max_cols)
    range_str = f"'{safe}'!A1:{end_col}{len(rows)}"
    padded = [row + [""] * (max_cols - len(row)) for row in rows]
    resp = requests.put(
        f"{SHEETS_API}/{SHEET_ID}/values/{range_str}?valueInputOption=USER_ENTERED",
        headers=sheets_headers(token),
        json={"values": padded},
    )
    resp.raise_for_status()


# ---------------------------------------------------------------------------
# Normalizers
# ---------------------------------------------------------------------------
def norm_storage(s):
    s = s.strip().upper().replace(" ", "")
    m = re.match(r"(\d+)GB", s)
    if m:
        val = int(m.group(1))
        if val >= 1000:
            return f"{val // 1000}TB" if val % 1000 == 0 else f"{val}GB"
        return f"{val}GB"
    m = re.match(r"(\d+)TB", s)
    if m:
        return f"{m.group(1)}TB"
    return s


def norm_ram(s):
    return s.strip().upper().replace(" ", "")


def storage_sort_key(s):
    s = s.upper().replace(" ", "")
    m = re.match(r"(\d+)(GB|TB)", s)
    if m:
        val = int(m.group(1))
        return val * 1000 if m.group(2) == "TB" else val
    return 999999


def ram_sort_key(s):
    m = re.search(r"(\d+)", s)
    return int(m.group(1)) if m else 0


# ---------------------------------------------------------------------------
# BM Listings fetch
# ---------------------------------------------------------------------------
def fetch_all_bm_listings(env):
    """Fetch all BM listings, paginate. Returns list of listing dicts."""
    auth = env.get("BACKMARKET_API_AUTH", "")
    lang = env.get("BACKMARKET_API_LANG", "en-gb")
    ua = env.get("BACKMARKET_API_UA", "")

    if not auth:
        log.warning("No BACKMARKET_API_AUTH, skipping listing fetch")
        return []

    hdrs = {
        "Authorization": auth,
        "Accept-Language": lang,
        "User-Agent": ua,
        "Accept": "application/json",
    }

    all_listings = []
    page = 1
    while True:
        log.info(f"  Fetching BM listings page {page}...")
        resp = requests.get(f"{BM_LISTINGS_URL}?page={page}", headers=hdrs)
        if resp.status_code != 200:
            log.warning(f"  BM API returned {resp.status_code} on page {page}")
            break
        data = resp.json()
        results = data.get("results", [])
        all_listings.extend(results)
        if not data.get("next"):
            break
        page += 1
        time.sleep(0.3)

    log.info(f"  Fetched {len(all_listings)} BM listings total")
    return all_listings


def build_listing_lookup(listings):
    """Build lookup: (product_id, scraper_grade) -> {listing_id, min_price}."""
    lookup = {}
    for l in listings:
        pid = l.get("product_id", "")
        bm_grade = l.get("grade", "")
        scraper_grade = BM_GRADE_MAP.get(bm_grade)
        if not scraper_grade or not pid:
            continue
        lid = l.get("listing_id", "")
        min_price = l.get("min_price")
        key = (pid, scraper_grade)
        # Keep the one with a listing_id if multiple
        if key not in lookup or (lid and not lookup[key].get("listing_id")):
            lookup[key] = {"listing_id": str(lid) if lid else "", "min_price": min_price}
    return lookup


# ---------------------------------------------------------------------------
# Row generation
# ---------------------------------------------------------------------------
def parse_model_fields(model_key):
    if model_key in MODEL_MAP:
        return MODEL_MAP[model_key]
    m = re.match(r'^(Air|Pro)\s+(\d+(?:\.\d+)?)"\s+(\d{4})\s+(.+)$', model_key)
    if not m:
        return None
    kind = m.group(1)
    size = str(int(float(m.group(2)))) if m.group(2).replace('.', '', 1).isdigit() else m.group(2)
    chip = m.group(4).strip()
    return {
        "model": f"{kind} {size}",
        "model_nos": "",
        "year": m.group(3),
        "screen": f'{size}"',
        "chip": chip,
        "tab": "MacBook Air" if kind == "Air" else "MacBook Pro",
    }


def generate_rows(v7_data, listing_lookup):
    """Generate all rows from V7 data, split by tab."""
    scraped_at = v7_data.get("scraped_at", "")
    last_scraped = scraped_at[:10] if scraped_at else ""

    air_rows = []
    pro_rows = []
    stats = {
        "total_models": 0,
        "scraped_models": 0,
        "total_skus": 0,
        "skus_with_price": 0,
        "skus_without_price": 0,
        "skus_with_listing": 0,
        "skus_without_listing": 0,
        "missing_data_models": [],
    }

    models = v7_data.get("models", {})
    stats["total_models"] = len(models)

    for v7_key, model_data in models.items():
        mapping = parse_model_fields(v7_key)
        if not mapping:
            log.warning(f"No mapping for model: {v7_key}")
            continue

        if not model_data.get("scraped"):
            stats["missing_data_models"].append(f"{v7_key} (not scraped)")
            continue

        grades = model_data.get("grades", {})
        rams = model_data.get("ram", {})
        ssds = model_data.get("ssd", {})
        colours = model_data.get("colour", {})

        # If no picker data at all, note it
        if not rams and not ssds and not grades:
            stats["missing_data_models"].append(f"{v7_key} (no picker data)")
            continue

        stats["scraped_models"] += 1

        # Build available options
        ram_list = []
        for k, v in rams.items():
            ram_list.append((norm_ram(k), v))

        ssd_list = []
        for k, v in ssds.items():
            ssd_list.append((norm_storage(k), v))

        colour_list = []
        if colours:
            for k, v in colours.items():
                colour_list.append((k, v))
        else:
            colour_list = [("", {"available": True, "price": None})]

        grade_list = []
        for k, v in grades.items():
            grade_list.append((k, v))

        # If any dimension is empty, use a placeholder
        if not ram_list:
            ram_list = [("", {"available": True, "price": None})]
        if not ssd_list:
            ssd_list = [("", {"available": True, "price": None})]
        if not grade_list:
            grade_list = [("", {"available": True, "price": None})]

        # Generate all combinations
        for ram_name, ram_data in ram_list:
            for ssd_name, ssd_data in ssd_list:
                for colour_name, colour_data in colour_list:
                    for grade_name, grade_data in grade_list:
                        # Determine product ID from the most specific picker
                        # Use colour productId if available, then ssd, then ram
                        product_id = ""
                        for picker in [colour_data, ssd_data, ram_data]:
                            pid = picker.get("productId", "")
                            if pid:
                                product_id = pid
                                break

                        # Price: base grade price
                        grade_price = grade_data.get("price")
                        available = grade_data.get("available", False)

                        if grade_price is not None and available:
                            price_str = f"£{grade_price:.0f}"
                        else:
                            price_str = "N/A"

                        # Listing ID lookup
                        listing_info = listing_lookup.get((product_id, grade_name), {})
                        listing_id = listing_info.get("listing_id", "")
                        min_price = listing_info.get("min_price")
                        min_price_str = f"£{float(min_price):.0f}" if min_price else ""

                        row = [
                            mapping["model"],
                            mapping["model_nos"],
                            mapping["year"],
                            mapping["screen"],
                            mapping["chip"],
                            ram_name,
                            ssd_name,
                            colour_name,
                            grade_name,
                            product_id,
                            listing_id,
                            price_str,
                            min_price_str,
                            last_scraped,
                        ]

                        stats["total_skus"] += 1
                        if price_str != "N/A":
                            stats["skus_with_price"] += 1
                        else:
                            stats["skus_without_price"] += 1
                        if listing_id:
                            stats["skus_with_listing"] += 1
                        else:
                            stats["skus_without_listing"] += 1

                        if mapping["tab"] == "MacBook Air":
                            air_rows.append(row)
                        else:
                            pro_rows.append(row)

    # Sort: Model -> Year -> Chip -> RAM -> SSD -> Colour -> Grade
    def sort_key(r):
        return (
            r[0],  # Model
            r[2],  # Year
            r[4],  # Chip
            ram_sort_key(r[5]),   # RAM
            storage_sort_key(r[6]),  # SSD
            r[7],  # Colour
            GRADE_ORDER.get(r[8], 9),  # Grade
        )

    air_rows.sort(key=sort_key)
    pro_rows.sort(key=sort_key)

    return air_rows, pro_rows, stats


def build_dashboard(stats):
    """Build dashboard tab rows."""
    rows = [
        ["Metric", "Value"],
        ["Total Models", str(stats["total_models"])],
        ["Models Scraped (with data)", str(stats["scraped_models"])],
        ["Total SKUs (rows)", str(stats["total_skus"])],
        ["SKUs with Prices", str(stats["skus_with_price"])],
        ["SKUs without Prices (N/A)", str(stats["skus_without_price"])],
        ["SKUs with Listing IDs", str(stats["skus_with_listing"])],
        ["SKUs without Listing IDs", str(stats["skus_without_listing"])],
        [""],
        ["Models with Missing Data"],
    ]
    for m in stats["missing_data_models"]:
        rows.append(["", m])
    if not stats["missing_data_models"]:
        rows.append(["", "None"])
    return rows


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Sync V7 sell prices to Google Sheet")
    parser.add_argument("--dry-run", action="store_true", help="Show plan without writing")
    args = parser.parse_args()

    # Load credentials
    from dotenv import load_dotenv
    load_dotenv(ENV_PATH)

    refresh_token = os.environ.get("JARVIS_GOOGLE_REFRESH_TOKEN")
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    if not all([refresh_token, client_id, client_secret]):
        log.error("Missing Google OAuth credentials")
        sys.exit(1)

    # Load V7 scraper data
    if not SCRAPER_FILE.exists():
        log.error(f"V7 scraper output not found: {SCRAPER_FILE}")
        sys.exit(1)
    with open(SCRAPER_FILE) as f:
        v7_data = json.load(f)
    log.info(f"V7 data: {len(v7_data.get('models', {}))} models, scraped {v7_data.get('scraped_at', 'unknown')}")

    # Fetch BM listings unless dry-run
    if args.dry_run:
        log.info("Dry run: skipping BM listing fetch")
        listing_lookup = {}
    else:
        log.info("Fetching BM listings...")
        bm_listings = fetch_all_bm_listings(dict(os.environ))
        listing_lookup = build_listing_lookup(bm_listings)
        log.info(f"Listing lookup: {len(listing_lookup)} product+grade combos")

    # Generate rows
    log.info("Generating rows...")
    air_rows, pro_rows, stats = generate_rows(v7_data, listing_lookup)

    log.info(f"MacBook Air: {len(air_rows)} rows")
    log.info(f"MacBook Pro: {len(pro_rows)} rows")
    log.info(f"SKUs with prices: {stats['skus_with_price']}")
    log.info(f"SKUs with listings: {stats['skus_with_listing']}")

    if args.dry_run:
        print(f"\n{'='*50}")
        print(f"DRY RUN")
        print(f"MacBook Air: {len(air_rows)} rows")
        print(f"MacBook Pro: {len(pro_rows)} rows")
        print(f"Total SKUs: {stats['total_skus']}")
        print(f"With prices: {stats['skus_with_price']}")
        print(f"With listings: {stats['skus_with_listing']}")
        print(f"Missing data: {stats['missing_data_models']}")
        print(f"{'='*50}")
        # Show sample rows
        print("\nSample Air rows:")
        for r in air_rows[:5]:
            print(f"  {r[0]} {r[2]} {r[4]} | {r[5]} {r[6]} {r[7]} {r[8]} | {r[11]} | lid={r[10]}")
        print("\nSample Pro rows:")
        for r in pro_rows[:5]:
            print(f"  {r[0]} {r[2]} {r[4]} | {r[5]} {r[6]} {r[7]} {r[8]} | {r[11]} | lid={r[10]}")
        return

    # Authenticate with Google
    log.info("Authenticating with Google Sheets...")
    token = get_access_token(refresh_token, client_id, client_secret)

    # Get existing tabs
    existing = get_existing_tabs(token)
    log.info(f"Existing tabs: {list(existing.keys())}")

    # Step 1: Delete all old tabs (keep at most one to avoid deleting the last sheet)
    # We'll create new tabs first, then delete old ones
    keep_tabs = {"MacBook Air", "MacBook Pro", "Dashboard"}
    tabs_to_delete = [name for name in existing if name not in keep_tabs]

    # Create new tabs first (if they don't exist)
    reqs = []
    for tab_name in ["MacBook Air", "MacBook Pro", "Dashboard"]:
        if tab_name not in existing:
            reqs.append({
                "addSheet": {"properties": {
                    "title": tab_name,
                    "gridProperties": {"frozenRowCount": 1},
                }}
            })

    if reqs:
        result = batch_update(token, reqs)
        # Refresh tab list
        existing = get_existing_tabs(token)
        log.info(f"Created new tabs. Current: {list(existing.keys())}")
        time.sleep(0.5)

    # Delete old tabs
    if tabs_to_delete:
        del_reqs = []
        for name in tabs_to_delete:
            if name in existing:
                del_reqs.append({"deleteSheet": {"sheetId": existing[name]}})
        if del_reqs:
            # Batch in groups of 20 to avoid hitting limits
            for i in range(0, len(del_reqs), 20):
                batch_update(token, del_reqs[i:i+20])
                time.sleep(0.5)
            log.info(f"Deleted {len(del_reqs)} old tabs")
            existing = get_existing_tabs(token)

    # Step 2: Write data
    # MacBook Air
    log.info("Writing MacBook Air tab...")
    air_data = [HEADERS] + air_rows
    write_tab_data(token, "MacBook Air", air_data)
    time.sleep(0.5)

    # MacBook Pro
    log.info("Writing MacBook Pro tab...")
    pro_data = [HEADERS] + pro_rows
    write_tab_data(token, "MacBook Pro", pro_data)
    time.sleep(0.5)

    # Dashboard
    log.info("Writing Dashboard tab...")
    dash_rows = build_dashboard(stats)
    write_tab_data(token, "Dashboard", dash_rows)
    time.sleep(0.5)

    # Step 3: Format tabs
    log.info("Formatting tabs...")
    fmt_reqs = []
    col_widths = [
        (0, 60),   # Model
        (1, 90),   # Model No(s)
        (2, 45),   # Year
        (3, 50),   # Screen
        (4, 65),   # Chip
        (5, 50),   # RAM
        (6, 55),   # SSD
        (7, 85),   # Colour
        (8, 70),   # Grade
        (9, 280),  # Product ID
        (10, 80),  # Listing ID
        (11, 55),  # Price
        (12, 70),  # Min Price
        (13, 90),  # Last Scraped
    ]

    for tab_name in ["MacBook Air", "MacBook Pro"]:
        sid = existing[tab_name]
        # Bold header
        fmt_reqs.append({
            "repeatCell": {
                "range": {"sheetId": sid, "startRowIndex": 0, "endRowIndex": 1},
                "cell": {"userEnteredFormat": {"textFormat": {"bold": True}}},
                "fields": "userEnteredFormat.textFormat.bold",
            }
        })
        # Column widths
        for col_idx, px in col_widths:
            fmt_reqs.append({
                "updateDimensionProperties": {
                    "range": {"sheetId": sid, "dimension": "COLUMNS",
                              "startIndex": col_idx, "endIndex": col_idx + 1},
                    "properties": {"pixelSize": px},
                    "fields": "pixelSize",
                }
            })

    # Dashboard formatting
    dash_id = existing["Dashboard"]
    fmt_reqs.append({
        "repeatCell": {
            "range": {"sheetId": dash_id, "startRowIndex": 0, "endRowIndex": 1},
            "cell": {"userEnteredFormat": {"textFormat": {"bold": True}}},
            "fields": "userEnteredFormat.textFormat.bold",
        }
    })
    fmt_reqs.append({
        "updateDimensionProperties": {
            "range": {"sheetId": dash_id, "dimension": "COLUMNS",
                      "startIndex": 0, "endIndex": 1},
            "properties": {"pixelSize": 220},
            "fields": "pixelSize",
        }
    })
    fmt_reqs.append({
        "updateDimensionProperties": {
            "range": {"sheetId": dash_id, "dimension": "COLUMNS",
                      "startIndex": 1, "endIndex": 2},
            "properties": {"pixelSize": 300},
            "fields": "pixelSize",
        }
    })

    batch_update(token, fmt_reqs)

    # Summary
    sheet_url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}"
    print(f"\n{'='*50}")
    print(f"SYNC COMPLETE")
    print(f"Sheet: {sheet_url}")
    print(f"Scraped: {v7_data.get('scraped_at', 'unknown')}")
    print(f"MacBook Air: {len(air_rows)} rows")
    print(f"MacBook Pro: {len(pro_rows)} rows")
    print(f"Total SKUs: {stats['total_skus']}")
    print(f"With prices: {stats['skus_with_price']} | Without: {stats['skus_without_price']}")
    print(f"With listing IDs: {stats['skus_with_listing']} | Without: {stats['skus_without_listing']}")
    if stats["missing_data_models"]:
        print(f"Missing data: {', '.join(stats['missing_data_models'])}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
