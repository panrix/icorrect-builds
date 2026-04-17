#!/usr/bin/env python3
"""
Buy Box Monitor for BackMarket Buyback Listings
Checks all online buyback listings, identifies buy box losses and overbids.
"""

import argparse
import json
import logging
import os
import random
import sys
import time
from datetime import datetime, date, timezone
from pathlib import Path
from typing import Optional

import requests
import dotenv

GRADE_HARD_BLOCK = {"GOLD", "PLATINUM", "DIAMOND"}
GRADE_CAUTION = {"SILVER"}
GRADE_ACCEPTABLE = {"STALLONE", "BRONZE"}

SKIP_GRADE_GOLD = "SKIP_GRADE_GOLD"
SKIP_GRADE_PLATINUM = "SKIP_GRADE_PLATINUM"
SKIP_GRADE_DIAMOND = "SKIP_GRADE_DIAMOND"
SKIP_MARGIN = "SKIP_MARGIN"
SKIP_NET = "SKIP_NET"
SKIP_MARKET_FROZEN = "SKIP_MARKET_FROZEN"
SKIP_UNKNOWN_GRADE = "SKIP_UNKNOWN_GRADE"

AESTHETIC_TO_POLICY_GRADE = {
    "NOT_FUNCTIONAL_CRACKED": "STALLONE",
    "NONFUNC_CRACK": "STALLONE",
    "NOT_FUNCTIONAL_USED": "BRONZE",
    "NONFUNC_USED": "BRONZE",
    "FUNCTIONAL_CRACKED": "SILVER",
    "FUNC_CRACK": "SILVER",
    "FUNCTIONAL_USED": "GOLD",
    "FUNC_USED": "GOLD",
    "FUNCTIONAL_GOOD": "PLATINUM",
    "FUNC_GOOD": "PLATINUM",
    "FUNCTIONAL_FLAWLESS": "DIAMOND",
    "FUNC_EXCELLENT": "DIAMOND",
}

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
dotenv.load_dotenv("/home/ricky/config/api-keys/.env")

BM_AUTH = os.environ.get("BM_AUTH")
BM_UA = os.environ.get("BM_UA", "BM-iCorrect-n8n;ricky@icorrect.co.uk")
if not BM_AUTH:
    print("ERROR: BM_AUTH not found in environment. Source /home/ricky/config/api-keys/.env")
    sys.exit(1)

BASE_URL = "https://www.backmarket.co.uk"
HEADERS = {
    "Authorization": BM_AUTH,
    "Accept-Language": "en-gb",
    "User-Agent": BM_UA,
    "Accept": "application/json",
}
OUTPUT_DIR = Path("/home/ricky/.openclaw/agents/main/workspace/data/buyback")
PROGRESS_FILE = OUTPUT_DIR / "buy-box-progress.json"
FREEZE_STATE_PATH = Path("/home/ricky/builds/backmarket/data/freeze-state.json")
COMPETITOR_DELAY = 2  # seconds between competitor requests
SAVE_EVERY = 100

# SKU prefix -> Apple model number mapping
SKU_TO_MODEL = {
    "MBA13.2020.M1": "A2337",
    "MBA13.2022.M2": "A2681",
    "MBA13.2024.M3": "A2681",
    "MBA15.2023.M2": "A2941",
    "MBP13.2020.M1": "A2338",
    "MBP13.2022.M2": "A2338",
    "MBP14.2021.M1PRO": "A2442",
    "MBP14.2021.M1MAX": "A2442",
    "MBP14.2023.M2PRO": "A2779",
    "MBP14.2023.M2MAX": "A2779",
    "MBP14.2023.M3": "A2992",
    "MBP14.2023.M3PRO": "A2992",
    "MBP14.2023.M3MAX": "A2992",
    "MBP14.2024.M4": "A2918",
    "MBP14.2024.M4PRO": "A2918",
    "MBP14.2024.M4MAX": "A2918",
    "MBP16.2021.M1PRO": "A2485",
    "MBP16.2021.M1MAX": "A2485",
    "MBP16.2023.M2PRO": "A2918",
    "MBP16.2023.M2MAX": "A2918",
    "MBP16.2023.M3PRO": "A2780",
    "MBP16.2023.M3MAX": "A2991",
    "MBP16.2024.M4PRO": "A2780",
    "MBP16.2024.M4MAX": "A2991",
}

# Grade-to-labour hours mapping
GRADE_LABOUR_HOURS = {
    "FUNC_CRACK": 2.0,           # FC: screen replacement
    "FUNC_USED": 1.0,            # FU: clean + test
    "FUNC_GOOD": 1.0,            # FG: clean + test
    "FUNC_EXCELLENT": 1.0,       # FE: minimal work
    "NONFUNC_USED": 4.0,         # NFU: board repair
    "NONFUNC_CRACK": 1.5,        # NFC: screen + basic
}
DEFAULT_LABOUR_HOURS = 2.0

# SKU model family to V7 scraper model key mapping
SKU_TO_SCRAPER_MODEL = {
    "MBA13.2020": "Air 13\" 2020 M1",
    "MBA13.2022": "Air 13\" 2022 M2",
    "MBA13.2024": "Air 13\" 2024 M3",
    "MBA13.2025": "Air 13\" 2025 M4",
    "MBA15.2023": "Air 15\" 2023 M2",
    "MBP13.2020": "Pro 13\" 2020 M1",
    "MBP13.2022": "Pro 13\" 2022 M2",
    "MBP14.2021.M1PRO": "Pro 14\" 2021 M1 Pro",
    "MBP14.2021.M1MAX": "Pro 14\" 2021 M1 Max",
    "MBP14.2023.M2PRO": "Pro 14\" 2023 M2 Pro",
    "MBP14.2023.M3": "Pro 14\" 2023 M3",
    "MBP14.2023.M3PRO": "Pro 14\" 2023 M3 Pro",
    "MBP16.2021.M1PRO": "Pro 16\" 2021 M1 Pro",
    "MBP16.2021.M1MAX": "Pro 16\" 2021 M1 Max",
    "MBP16.2023.M2PRO": "Pro 16\" 2023 M2 Pro",
    "MBP16.2023.M3PRO": "Pro 16\" 2023 M3 Pro",
}

# BM aesthetic grades to V7 scraper grade keys
BM_GRADE_TO_SCRAPER = {
    "STALLONE": "Fair",      # NFC
    "BRONZE": "Fair",        # NFU
    "SILVER": "Good",        # FC
    "GOLD": "Good",          # FU
    "PLATINUM": "Excellent", # FG
    "DIAMOND": "Excellent",  # FE
}

# Parts cost estimates by grade keyword
PARTS_COST = {
    "FUNC_CRACK": 120,        # FUNCTIONAL_CRACKED: needs screen
    "NONFUNC_USED": 50,       # NOT_FUNCTIONAL_USED: board work, no screen
    "NONFUNC_CRACK": 170,     # NOT_FUNCTIONAL_CRACKED: screen + board
}
DEFAULT_PARTS_COST = 100

# Default sell price if we can't look up
DEFAULT_SELL_PRICE = 500
BUMP_BUFFER = 1  # £1 above price_to_win
BUMP_RATE_LIMIT = 1.0  # seconds between API updates
MAX_BUMP_FAILURES = 5  # abort after N consecutive failures

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("buybox")
skip_log = []


def skip(listing: dict, reason_code: str, detail: str = ""):
    listing_id = listing.get("listing_id") or listing.get("id") or "?"
    skip_log.append((listing_id, reason_code, detail))
    log.info(f"SKIP [{reason_code}] listing={listing_id} - {detail}")


def calc_margin(net_profit: float, sell_price: float) -> float:
    """Calculate margin against estimated BM net revenue."""
    net_revenue = sell_price * 0.90
    if net_revenue <= 0:
        return 0.0
    return net_profit / net_revenue


def get_frozen_model_match(listing: dict, freeze_state: dict) -> str:
    frozen_models = freeze_state.get("frozen_models", [])
    if not isinstance(frozen_models, list):
        return ""
    for key in ("model", "apple_model", "imei_prefix", "model_family", "sku"):
        value = listing.get(key)
        if value and value in frozen_models:
            return str(value)
    return ""


def extract_skip_grade(reason_code: str, detail: str) -> str:
    if reason_code == SKIP_GRADE_GOLD:
        return "GOLD"
    if reason_code == SKIP_GRADE_PLATINUM:
        return "PLATINUM"
    if reason_code == SKIP_GRADE_DIAMOND:
        return "DIAMOND"
    if reason_code == SKIP_UNKNOWN_GRADE:
        return "UNKNOWN"
    if "grade=" not in detail:
        return ""
    grade = detail.split("grade=", 1)[1].split()[0].strip(",")
    return grade.strip("'\"")


def summarize_skip_log(entries: list) -> dict:
    by_grade = {"GOLD": 0, "PLATINUM": 0, "DIAMOND": 0, "SILVER": 0, "UNKNOWN": 0}
    by_reason = {SKIP_MARGIN: 0, SKIP_NET: 0, SKIP_MARKET_FROZEN: 0}

    for _, reason_code, detail in entries:
        grade = extract_skip_grade(reason_code, detail)
        if grade in by_grade:
            by_grade[grade] += 1
        if reason_code in by_reason:
            by_reason[reason_code] += 1

    return {"by_grade": by_grade, "by_reason": by_reason}


def get_policy_grade(raw_grade: str) -> str:
    grade = (raw_grade or "").upper().replace(".", "_")
    return AESTHETIC_TO_POLICY_GRADE.get(grade, grade)


def build_bump_candidates(results: list, args: argparse.Namespace, freeze_state: dict) -> list:
    skip_log.clear()
    candidates = []

    if args.legacy_thresholds:
        log.info("[LEGACY] Running with pre-Phase-0.1 thresholds")

    for listing in results:
        listing["caution_flag"] = False

        if listing.get("is_winning"):
            continue
        if listing.get("profit_at_price_to_win", 0) < args.bump_min_profit:
            continue
        if not 0 < listing.get("gap", 0) <= args.bump_max_gap:
            continue
        if listing.get("model_family", "UNKNOWN") == "UNKNOWN":
            continue

        net = float(listing.get("profit_at_price_to_win", 0))
        sell_price = float(listing.get("sell_price_ref", 0) or 0)
        margin = calc_margin(net, sell_price)
        listing["margin_at_price_to_win"] = round(margin, 4)

        if args.legacy_thresholds:
            if margin < 0.15 or net < 50:
                skip(
                    listing,
                    SKIP_MARGIN if margin < 0.15 else SKIP_NET,
                    f"grade={listing.get('grade', '')} margin={margin:.1%} net=£{net:.0f} below legacy floor",
                )
                continue
            candidates.append(listing)
            continue

        grade = get_policy_grade(listing.get("policy_grade") or listing.get("grade", ""))

        device_model = get_frozen_model_match(listing, freeze_state)
        if device_model:
            skip(
                listing,
                SKIP_MARKET_FROZEN,
                f"model={device_model} frozen: {freeze_state.get('reason', '')}",
            )
            continue

        if grade in GRADE_HARD_BLOCK:
            skip_code = {
                "GOLD": SKIP_GRADE_GOLD,
                "PLATINUM": SKIP_GRADE_PLATINUM,
                "DIAMOND": SKIP_GRADE_DIAMOND,
            }.get(grade, f"SKIP_GRADE_{grade}")
            skip(listing, skip_code, f"grade={grade} hard-blocked by acquisition policy")
            continue

        if grade not in GRADE_CAUTION and grade not in GRADE_ACCEPTABLE:
            skip(listing, SKIP_UNKNOWN_GRADE, f"grade={grade!r} unrecognised - skipping")
            continue

        if grade in GRADE_CAUTION:
            if margin < 0.25 or net < 200:
                skip(
                    listing,
                    SKIP_MARGIN if margin < 0.25 else SKIP_NET,
                    f"grade={grade} SILVER caution: margin={margin:.1%} net=£{net:.0f} (need >=25%/£200)",
                )
                continue
            listing["caution_flag"] = True
        else:
            if margin < 0.15 or net < 150:
                skip(
                    listing,
                    SKIP_MARGIN if margin < 0.15 else SKIP_NET,
                    f"grade={grade} margin={margin:.1%} net=£{net:.0f} below hard floor",
                )
                continue
            listing["caution_flag"] = margin < 0.25 or net < 200

        candidates.append(listing)

    candidates.sort(key=lambda x: x.get("profit_at_price_to_win", 0), reverse=True)
    return candidates


# ---------------------------------------------------------------------------
# Profit calculation
# ---------------------------------------------------------------------------
def calc_profit(buy_price: float, sell_price: float, parts_cost: float, labour_hrs: float = 2.0) -> float:
    bm_buy_fee = buy_price * 0.10       # BM charges 10% on trade-in purchase
    bm_sell_fee = sell_price * 0.10     # BM charges 10% on resale
    labour = labour_hrs * 24            # £24/hr confirmed rate
    shipping = 15
    gross = sell_price - buy_price
    tax = gross * 0.1667 if gross > 0 else 0
    return sell_price - buy_price - bm_buy_fee - bm_sell_fee - parts_cost - labour - shipping - tax


# ---------------------------------------------------------------------------
# API helpers
# ---------------------------------------------------------------------------
def api_get(url: str, params: dict = None, max_retries: int = 4) -> Optional[any]:
    """GET with retry on 429 and Retry-After support."""
    backoff = [30, 60, 120, 240]
    for attempt in range(max_retries + 1):
        try:
            resp = requests.get(url, headers=HEADERS, params=params, timeout=30)
            if resp.status_code == 429:
                if attempt >= max_retries:
                    break
                wait = backoff[min(attempt, len(backoff) - 1)]
                retry_after = resp.headers.get("Retry-After")
                if retry_after:
                    try:
                        wait = max(int(retry_after), wait)
                    except ValueError:
                        pass
                log.warning(f"Rate limited (429). Waiting {wait}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.HTTPError as e:
            log.error(f"HTTP error for {url}: {e}")
            return None
        except requests.exceptions.RequestException as e:
            log.error(f"Request error for {url}: {e}")
            return None
    log.error(f"Exhausted retries for {url}")
    return None


def fetch_all_listings() -> list:
    """Fetch all buyback listings with cursor-based pagination."""
    listings = []
    url = f"{BASE_URL}/ws/buyback/v1/listings"
    params = {"page_size": 100}

    while True:
        data = api_get(url, params)
        if not data or not isinstance(data, dict):
            break

        results = data.get("results", [])
        listings.extend(results)
        log.info(f"  Fetched page: {len(results)} listings (total so far: {len(listings)})")

        next_url = data.get("next")
        if not next_url:
            break

        # Next page uses full URL
        url = next_url
        params = None  # params are in the URL already
        time.sleep(2)

    log.info(f"Fetched {len(listings)} total buyback listings")
    return listings


def fetch_competitors(listing_id: str) -> Optional[list]:
    """Fetch competitor data for a listing. Returns list of competitor entries."""
    url = f"{BASE_URL}/ws/buyback/v1/competitors/{listing_id}"
    data = api_get(url)
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return data.get("results", data.get("competitors", []))
    return None


def load_sell_price_lookup() -> Optional[dict]:
    """Load generated sell-price-lookup.json first, with raw V7 fallback."""
    candidate_paths = [
        Path("/home/ricky/builds/buyback-monitor/data/sell-price-lookup.json"),
        OUTPUT_DIR / "sell-price-lookup.json",
        Path("/home/ricky/builds/buyback-monitor/data/sell-prices-latest.json"),
    ]
    for path in candidate_paths:
        if not path.exists():
            continue
        try:
            data = json.loads(path.read_text())
            timestamp = data.get("generated_at") or data.get("scraped_at") or "2000-01-01T00:00:00+00:00"
            age_hrs = (datetime.now(timezone.utc) - datetime.fromisoformat(timestamp.replace("Z", "+00:00"))).total_seconds() / 3600
            if age_hrs > 48:
                log.warning(f"Sell prices are {age_hrs:.0f}h old (stale but using anyway)")
            if "by_spec" in data:
                log.info(f"Loaded sell-price lookup: {len(data.get('by_spec', {}))} spec entries from {path}")
            else:
                log.info(f"Loaded raw V7 sell prices: {len(data.get('models', {}))} models from {path}")
            return data
        except Exception as e:
            log.error(f"Failed to load sell prices from {path}: {e}")
    return None


def load_freeze_state() -> dict:
    default_state = {"frozen_models": []}
    if not FREEZE_STATE_PATH.exists():
        return default_state

    try:
        data = json.loads(FREEZE_STATE_PATH.read_text())
    except Exception as e:
        log.error(f"Invalid freeze state at {FREEZE_STATE_PATH}: {e}")
        return default_state

    if not isinstance(data, dict):
        log.error(f"Invalid freeze state at {FREEZE_STATE_PATH}: expected dict, got {type(data).__name__}")
        return default_state

    frozen_models = data.get("frozen_models")
    if not isinstance(frozen_models, list):
        log.error(f"Invalid freeze state at {FREEZE_STATE_PATH}: 'frozen_models' must be a list")
        return default_state

    log.info(f"Loaded freeze state: {len(frozen_models)} frozen models")
    return data


def resolve_sell_price_from_lookup(lookup: dict, sku: str, grade: str = "") -> Optional[float]:
    """Resolve from generated lookup first, raw V7 fallback second."""
    if not sku or not lookup:
        return None

    # Preferred: generated sell-price-lookup.json schema
    if "by_spec" in lookup:
        parts = sku.upper().split('.')
        if len(parts) >= 6:
            model, year, chip = parts[0], parts[1], parts[2]
            ram = parts[4] if len(parts) > 4 else ''
            storage = parts[5] if len(parts) > 5 else ''
            spec_key = f"{model}.{year}.{chip}.{ram}.{storage}"
            grade_key = "fair"
            grade_upper = grade.upper().replace('.', '_')
            if "FUNC_USED" in grade_upper:
                grade_key = "good"
            elif "FUNC_GOOD" in grade_upper:
                grade_key = "excellent"
            entry = lookup.get("by_spec", {}).get(spec_key)
            if entry:
                return entry.get(grade_key) or entry.get("fair")
            prefix = f"{model}.{year}.{chip}"
            by_family = lookup.get("by_family", {})
            if prefix in by_family:
                return by_family[prefix]
            if model in by_family:
                return by_family[model]
        return None

    # Legacy/raw V7 fallback
    models = lookup.get("models", {})
    if not models:
        return None
    parts = sku.upper().split('.')
    if len(parts) < 3:
        return None
    scraper_model = None
    candidates = []
    if len(parts) >= 3:
        candidates.append(f"{parts[0]}.{parts[1]}.{parts[2]}")
    if len(parts) >= 2:
        candidates.append(f"{parts[0]}.{parts[1]}")
    for candidate in candidates:
        if candidate in SKU_TO_SCRAPER_MODEL:
            scraper_model = SKU_TO_SCRAPER_MODEL[candidate]
            break
    if not scraper_model or scraper_model not in models:
        return None
    grades = models[scraper_model].get("grades", {})
    scraper_grade = BM_GRADE_TO_SCRAPER.get(grade.upper(), "Fair")
    for try_grade in [scraper_grade, "Fair", "Good"]:
        entry = grades.get(try_grade)
        if entry and isinstance(entry, dict) and entry.get("price"):
            return float(entry["price"])
    for entry in grades.values():
        if isinstance(entry, dict) and entry.get("price"):
            return float(entry["price"])
    return None


def load_historical_sell_prices() -> dict:
    """Load average sell prices from profit-summary.json if available.
    This is the FALLBACK loader used when sell-price-lookup.json doesn't exist.
    """
    paths = [
        OUTPUT_DIR / "profit-summary.json",
        OUTPUT_DIR / "profit_summary.json",
    ]
    for p in paths:
        if p.exists():
            try:
                data = json.loads(p.read_text())
                prices = {}
                if isinstance(data, dict):
                    by_model = data.get("by_model", data)
                    for key, val in by_model.items():
                        if isinstance(val, dict):
                            for price_key in ("avg_sale", "avg_sell_price", "sell_price", "average_sell"):
                                if price_key in val:
                                    prices[key] = float(val[price_key])
                                    break
                log.info(f"Loaded {len(prices)} historical sell prices from {p} (fallback)")
                return prices
            except Exception as e:
                log.warning(f"Error reading {p}: {e}")
    return {}


# ---------------------------------------------------------------------------
# Listing field helpers
# ---------------------------------------------------------------------------
def extract_model_family(sku: str) -> str:
    """Extract model family prefix like MBA13, MBP14 from SKU."""
    if not sku or sku == "None":
        return "UNKNOWN"
    sku_upper = sku.upper()
    for prefix in SKU_TO_MODEL:
        if sku_upper.startswith(prefix.split(".")[0]):
            # More specific: find the longest matching prefix
            parts = sku_upper.split(".")
            if len(parts) >= 1:
                return parts[0]  # e.g. MBA13, MBP14, MBP16
    # Fallback: first segment
    parts = sku_upper.split(".")
    if parts[0] in ("MBA13", "MBA15", "MBP13", "MBP14", "MBP16"):
        return parts[0]
    return "UNKNOWN"


def extract_apple_model(sku: str) -> Optional[str]:
    """Extract Apple model number from SKU string."""
    if not sku or sku == "None":
        return None
    sku_upper = sku.upper()
    # Try longest prefix first for exact matches
    for prefix in sorted(SKU_TO_MODEL.keys(), key=len, reverse=True):
        if prefix in sku_upper:
            return SKU_TO_MODEL[prefix]
    return None


def get_gb_price(listing: dict) -> float:
    """Extract GB price from listing's prices dict."""
    prices = listing.get("prices", {})
    gb = prices.get("GB", {})
    if isinstance(gb, dict):
        return float(gb.get("amount", 0))
    return 0.0


def get_grade(listing: dict) -> str:
    """Extract aesthetic grade from listing."""
    return (listing.get("aestheticGradeCode", "") or "").upper()


def load_parts_cost_lookup() -> dict:
    """Load parts-cost-lookup.json from OUTPUT_DIR. Returns dict or empty dict."""
    lookup_path = OUTPUT_DIR / "parts-cost-lookup.json"
    if not lookup_path.exists():
        log.warning(f"Parts cost lookup not found at {lookup_path}; using flat estimates")
        return {}
    try:
        data = json.loads(lookup_path.read_text())
        log.info(f"Loaded parts-cost-lookup.json: {len(data)} entries")
        return data
    except Exception as e:
        log.warning(f"Error reading parts-cost-lookup.json: {e}")
        return {}


def _sku_grade_to_lookup_key(grade: str) -> Optional[str]:
    """Map a buyback SKU grade suffix to lookup grade key.
    
    Input examples: 'FUNC.CRACK', 'NONFUNC.USED', 'NONFUNC.CRACK',
                    'FUNCTIONAL_CRACKED', 'NOT_FUNCTIONAL_USED', etc.
    """
    g = grade.upper().replace(".", "_")
    # NOT_FUNCTIONAL / NONFUNC variants
    if "NONFUNC" in g or "NOT_FUNCTIONAL" in g:
        if "CRACK" in g:
            return "NONFUNC_CRACK"
        if "USED" in g:
            return "NONFUNC_USED"
        return "NONFUNC_USED"  # default non-func
    # FUNCTIONAL / FUNC variants with crack
    if "CRACK" in g:
        return "FUNC_CRACK"
    return None


def get_parts_cost(grade: str, model: str = None, parts_lookup: dict = None) -> float:
    """Get estimated parts cost based on grade, with per-model lookup.
    
    If parts_lookup is provided and model is known, tries exact match first.
    Falls back to flat estimates if no lookup match.
    """
    # Try per-model lookup first
    if parts_lookup and model:
        grade_key = _sku_grade_to_lookup_key(grade)
        if grade_key:
            lookup_key = f"{model}.{grade_key}"
            cost = parts_lookup.get(lookup_key)
            if cost is not None and cost > 0:
                return float(cost)

    # Flat fallback
    grade_upper = grade.upper().replace(".", "_")
    if "NOT_FUNCTIONAL" in grade_upper or "NONFUNC" in grade_upper:
        if "CRACK" in grade_upper:
            return 170  # screen + board
        return 50   # board work only
    if "CRACK" in grade_upper:
        return 120  # needs screen
    return DEFAULT_PARTS_COST


def sku_label(sku: str) -> str:
    """Make a readable label from SKU."""
    if not sku or sku == "None":
        return "Unknown"
    parts = sku.split(".")
    # e.g. MBA13.2022.M2.APPLECORE.8GB.256GB.FUNC.CRACK
    if len(parts) >= 6:
        model = parts[0]
        year = parts[1]
        chip = parts[2]
        ram = parts[4] if len(parts) > 4 else ""
        storage = parts[5] if len(parts) > 5 else ""
        grade_parts = parts[6:] if len(parts) > 6 else []
        grade_short = ".".join(grade_parts)
        return f"{model} {year} {chip} {ram}/{storage} {grade_short}"
    return sku[:50]


# ---------------------------------------------------------------------------
# Progress management
# ---------------------------------------------------------------------------
def load_progress() -> dict:
    if PROGRESS_FILE.exists():
        try:
            data = json.loads(PROGRESS_FILE.read_text())
            log.info(f"Resuming from progress: {len(data.get('results', []))} items already checked")
            return data
        except Exception:
            pass
    return {"results": [], "checked_ids": []}


def save_progress(progress: dict):
    PROGRESS_FILE.write_text(json.dumps(progress, indent=2, default=str))


# ---------------------------------------------------------------------------
# Previous run comparison
# ---------------------------------------------------------------------------
def find_previous_run(today_str: str) -> Optional[dict]:
    """Find the most recent buy-box JSON before today."""
    files = sorted(OUTPUT_DIR.glob("buy-box-*.json"), reverse=True)
    for f in files:
        name = f.stem
        if name.startswith("buy-box-") and "-summary" not in name and name != f"buy-box-{today_str}" and name != "buy-box-progress":
            try:
                return json.loads(f.read_text())
            except Exception:
                continue
    return None


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------
def generate_report(results: list, today_str: str, previous: Optional[dict] = None) -> str:
    """Generate markdown summary report."""
    total = len(results)
    winning = sum(1 for r in results if r.get("is_winning"))
    losing = total - winning

    lines = [
        f"# Buy Box Report: {today_str}",
        "",
        f"**Listings checked:** {total}",
        f"**Winning:** {winning} ({winning/total*100:.0f}%)" if total else "**Winning:** 0",
        f"**Losing:** {losing} ({losing/total*100:.0f}%)" if total else "**Losing:** 0",
        "",
    ]

    # Comparison with previous
    if previous and "summary" in previous:
        prev_s = previous["summary"]
        prev_losing = prev_s.get("losing", 0)
        delta = losing - prev_losing
        arrow = "📈" if delta > 0 else "📉" if delta < 0 else "➡️"
        lines.append(f"**vs previous run:** {arrow} {delta:+d} losing listings (was {prev_losing})")
        lines.append("")

    # ----- LOSING LISTINGS -----
    losing_by_model = {}
    for r in results:
        if r.get("is_winning"):
            continue
        family = r.get("model_family", "UNKNOWN")
        losing_by_model.setdefault(family, []).append(r)

    if losing_by_model:
        lines.append("## Losing Listings")
        lines.append("")

        for family in sorted(losing_by_model.keys()):
            items = losing_by_model[family]
            lines.append(f"### {family} ({len(items)} listings)")
            lines.append("")

            for item in sorted(items, key=lambda x: x.get("gap", 0), reverse=True):
                gap = item.get("gap", 0)
                our_price = item.get("our_price", 0)
                price_to_win = item.get("price_to_win", 0)
                profit_current = item.get("profit_at_current", 0)
                profit_to_win = item.get("profit_at_price_to_win", 0)
                label = item.get("label", item.get("sku", "")[:50])

                if profit_to_win >= 30:
                    rec = "🟢 BUMP"
                elif profit_to_win >= 0:
                    rec = "🟡 CONSIDER"
                else:
                    rec = "🔴 LEAVE"

                lines.append(f"- **{label}**")
                lines.append(f"  Our: £{our_price:.0f} | To win: £{price_to_win:.0f} | Gap: £{gap:.0f}")
                lines.append(f"  Profit@current: £{profit_current:.0f} | Profit@win: £{profit_to_win:.0f} → {rec}")
                lines.append("")

    # Losing action summary
    bump = sum(1 for r in results if not r.get("is_winning") and r.get("profit_at_price_to_win", 0) >= 30)
    consider = sum(1 for r in results if not r.get("is_winning") and 0 <= r.get("profit_at_price_to_win", 0) < 30)
    leave = sum(1 for r in results if not r.get("is_winning") and r.get("profit_at_price_to_win", 0) < 0)

    lines.extend([
        "## Action Summary (Losing)",
        "",
        f"🟢 **BUMP** (profit >= £30 if we win): {bump}",
        f"🟡 **CONSIDER** (marginal profit): {consider}",
        f"🔴 **LEAVE** (unprofitable to win): {leave}",
        "",
    ])

    # ----- OVERBIDDING ANALYSIS -----
    overbids = [r for r in results if r.get("is_winning") and r.get("overbid", 0) > 10]
    overbids.sort(key=lambda x: x.get("overbid", 0), reverse=True)

    total_overbid = sum(r.get("overbid", 0) for r in overbids)
    # Estimate: assume ~2 buybacks per listing per month
    est_monthly_vol = 2
    est_monthly_savings = total_overbid * est_monthly_vol

    lines.extend([
        "## Overbidding Analysis",
        "",
        f"**Winning listings overbidding >£10:** {len(overbids)}",
        f"**Total excess per transaction:** £{total_overbid:.0f}",
        f"**Est. monthly savings (at ~{est_monthly_vol} buys/listing):** £{est_monthly_savings:.0f}",
        "",
    ])

    if overbids:
        # Top 20 biggest overbids
        lines.append("### Top 20 Biggest Overbids")
        lines.append("")
        for item in overbids[:20]:
            label = item.get("label", item.get("sku", "")[:45])
            our = item.get("our_price", 0)
            ptw = item.get("price_to_win", 0)
            ovr = item.get("overbid", 0)
            recommended = ptw + 1  # £1 buffer above price_to_win
            profit_now = item.get("profit_at_current", 0)
            profit_opt = item.get("profit_at_optimal", 0)
            saving_per_unit = profit_opt - profit_now

            lines.append(f"- **{label}**")
            lines.append(f"  Bid: £{our:.0f} | Need: £{ptw:.0f} | Overbid: £{ovr:.0f}")
            lines.append(f"  Reduce to: £{recommended:.0f} (+£{saving_per_unit:.0f}/unit profit)")
            lines.append("")

        # Group by model family
        model_overbids = {}
        for item in overbids:
            family = item.get("model_family", "UNKNOWN")
            m = model_overbids.setdefault(family, {"count": 0, "total_overbid": 0})
            m["count"] += 1
            m["total_overbid"] += item.get("overbid", 0)

        lines.append("### Overbid by Model Family")
        lines.append("")
        for family in sorted(model_overbids.keys(), key=lambda k: model_overbids[k]["total_overbid"], reverse=True):
            m = model_overbids[family]
            monthly = m["total_overbid"] * est_monthly_vol
            lines.append(f"- **{family}**: {m['count']} listings, £{m['total_overbid']:.0f}/txn, ~£{monthly:.0f}/mo savings")
        lines.append("")

    lines.append(f"_Generated {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}_")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Auto-bump: update prices via BM API
# ---------------------------------------------------------------------------
def update_listing_price(listing_id: str, amount: float) -> tuple:
    """PUT new price to BM buyback API. Returns (success, status_code, error_msg)."""
    url = f"{BASE_URL}/ws/buyback/v1/listings/{listing_id}"
    payload = {"prices": {"GB": {"amount": f"{amount:.2f}", "currency": "GBP"}}}

    for attempt in range(3):
        try:
            resp = requests.put(url, headers={**HEADERS, "Content-Type": "application/json"},
                                json=payload, timeout=30)
            if resp.status_code == 429:
                wait = 30 * (attempt + 1)
                retry_after = resp.headers.get("Retry-After")
                if retry_after:
                    try:
                        wait = max(int(retry_after), wait)
                    except ValueError:
                        pass
                log.warning(f"Rate limited on price update. Waiting {wait}s...")
                time.sleep(wait)
                continue
            if resp.status_code in (200, 202):
                return True, resp.status_code, None
            return False, resp.status_code, resp.text[:200]
        except requests.exceptions.RequestException as e:
            return False, 0, str(e)[:200]
    return False, 429, "Exhausted retries"


def execute_bumps(candidates: list, min_profit: float = 30.0, max_bump: float = 100.0) -> dict:
    """Auto-bump pre-screened losing listings.
    
    Returns dict with bump stats and log of changes.
    """
    if not candidates:
        log.info("No bump candidates found.")
        return {"bumped": 0, "failed": 0, "skipped": 0, "bumped_with_caution": 0, "changes": []}

    # Sort by profit descending (most profitable bumps first)
    candidates.sort(key=lambda x: x.get("profit_at_price_to_win", 0), reverse=True)

    log.info(f"Auto-bump: {len(candidates)} candidates (min profit £{min_profit:.0f}, max bump £{max_bump:.0f})")

    bumped = 0
    failed = 0
    consecutive_fails = 0
    bumped_with_caution = 0
    changes = []

    for item in candidates:
        lid = item["listing_id"]
        old_price = item["our_price"]
        target_price = round(item["price_to_win"] + BUMP_BUFFER, 2)
        gap = round(target_price - old_price, 2)
        profit = item["profit_at_price_to_win"]

        log.info(f"  BUMP {item['label']}: £{old_price:.0f} -> £{target_price:.0f} (+£{gap:.0f}, profit £{profit:.0f})")

        ok, status, err = update_listing_price(lid, target_price)

        change = {
            "listing_id": lid,
            "sku": item.get("sku", ""),
            "label": item.get("label", ""),
            "model_family": item.get("model_family", ""),
            "old_price": old_price,
            "new_price": target_price,
            "bump_amount": gap,
            "profit_at_new_price": profit,
            "caution_flag": bool(item.get("caution_flag")),
            "status_code": status,
            "success": ok,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        if err:
            change["error"] = err

        changes.append(change)

        if ok:
            bumped += 1
            if item.get("caution_flag"):
                bumped_with_caution += 1
            consecutive_fails = 0
            log.info(f"    OK ({status})")
        else:
            failed += 1
            consecutive_fails += 1
            log.error(f"    FAILED ({status}): {err}")
            if consecutive_fails >= MAX_BUMP_FAILURES:
                log.error(f"  ABORTING: {MAX_BUMP_FAILURES} consecutive failures")
                break

        time.sleep(BUMP_RATE_LIMIT)

    skipped = len(candidates) - bumped - failed
    log.info(f"Auto-bump complete: {bumped} bumped, {failed} failed, {skipped} skipped")

    return {
        "bumped": bumped,
        "failed": failed,
        "skipped": skipped,
        "bumped_with_caution": bumped_with_caution,
        "changes": changes,
    }


# ---------------------------------------------------------------------------
# Main logic
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Buy Box Monitor for BackMarket Buyback")
    parser.add_argument("--quick", action="store_true", help="Check random sample of 100 listings only")
    parser.add_argument("--model", type=str, help="Filter to specific model family (e.g. MBA13, MBP14)")
    parser.add_argument("--no-resume", action="store_true", help="Don't resume from progress file")
    parser.add_argument("--auto-bump", action="store_true", help="Auto-bump losing listings that are profitable to win")
    parser.add_argument("--bump-min-profit", type=float, default=30.0, help="Min profit at win price to auto-bump (default: £30)")
    parser.add_argument("--bump-max-gap", type=float, default=100.0, help="Max gap to bump (safety cap, default: £100)")
    parser.add_argument("--legacy-thresholds", action="store_true",
                        help="Use pre-Phase-0.1 thresholds (no grade gate, margin>=15%%, net>=£50)")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be bumped without executing")
    args = parser.parse_args()

    today_str = date.today().isoformat()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    log.info("=== Buy Box Monitor starting ===")
    freeze_state = load_freeze_state()

    # Step 1: Load sell prices (prefer scraped lookup, fallback to historical)
    sell_lookup = load_sell_price_lookup()
    historical_prices = load_historical_sell_prices()
    parts_lookup = load_parts_cost_lookup()
    if sell_lookup:
        log.info("Using scraped sell-price-lookup for price resolution")
    else:
        log.info("No sell-price-lookup found; using historical profit-summary fallback")

    # Step 2: Fetch all buyback listings
    log.info("Fetching buyback listings...")
    all_listings = fetch_all_listings()

    if not all_listings:
        log.error("No listings fetched. Exiting.")
        sys.exit(1)

    # Filter to online listings (those with GB market and price > 0)
    online_listings = []
    for lst in all_listings:
        markets = lst.get("markets", [])
        price = get_gb_price(lst)
        if "GB" not in markets or price <= 0:
            continue
        sku = lst.get("sku", "") or ""
        if args.model:
            family = extract_model_family(sku)
            if args.model.upper() not in family.upper():
                continue
        online_listings.append(lst)

    log.info(f"Online GB listings with price > 0: {len(online_listings)} (from {len(all_listings)} total)")

    if args.quick and len(online_listings) > 100:
        online_listings = random.sample(online_listings, 100)
        log.info(f"Quick mode: sampled 100 listings")

    # Step 3: Load progress for resume
    progress = load_progress() if not args.no_resume else {"results": [], "checked_ids": []}
    checked_ids = set(str(x) for x in progress.get("checked_ids", []))
    results = progress.get("results", [])

    # Step 4: Check competitors for each listing
    count = 0
    skipped = 0
    errors = 0
    for i, listing in enumerate(online_listings):
        lid = listing.get("id", "")
        if not lid:
            continue

        if lid in checked_ids:
            skipped += 1
            continue

        sku = listing.get("sku", "") or ""
        buy_price = get_gb_price(listing)
        grade = get_grade(listing)
        policy_grade = get_policy_grade(grade)
        model_family = extract_model_family(sku)
        apple_model = extract_apple_model(sku)
        parts_cost = get_parts_cost(grade, model=apple_model, parts_lookup=parts_lookup)
        label = sku_label(sku)

        # Get sell price reference: prefer scraped lookup, then historical, then default
        sell_price = DEFAULT_SELL_PRICE
        if sell_lookup:
            lookup_price = resolve_sell_price_from_lookup(sell_lookup, sku, grade)
            if lookup_price:
                sell_price = lookup_price
        if sell_price == DEFAULT_SELL_PRICE:
            # Fallback to historical prices
            if apple_model and apple_model in historical_prices:
                sell_price = historical_prices[apple_model]
            elif model_family in historical_prices:
                sell_price = historical_prices[model_family]

        log.info(f"[{i+1}/{len(online_listings)}] {label} (£{buy_price:.0f})...")
        comp_data = fetch_competitors(lid)

        # Parse competitor response
        # API returns: [{"listing_id", "price": {"amount", "currency"}, "price_to_win": {"amount"}, "is_winning": bool}]
        is_winning = True
        api_price_to_win = buy_price
        overbid = 0

        if comp_data and isinstance(comp_data, list):
            # Find our entry
            our_entry = None
            for entry in comp_data:
                eid = entry.get("listing_id", "")
                if eid == lid:
                    our_entry = entry
                    break

            if our_entry:
                is_winning = our_entry.get("is_winning", True)
                ptw = our_entry.get("price_to_win", {})
                if isinstance(ptw, dict):
                    api_price_to_win = float(ptw.get("amount", buy_price))
                else:
                    api_price_to_win = float(ptw or buy_price)
            else:
                log.warning(f"  Our listing not found in competitors response")
        elif comp_data is None:
            errors += 1

        # Calculate overbid and gap
        if is_winning:
            overbid = buy_price - api_price_to_win
            if overbid < 0:
                overbid = 0
            gap = 0
            price_to_win = api_price_to_win
        else:
            gap = api_price_to_win - buy_price
            if gap < 0:
                gap = 0
            price_to_win = api_price_to_win
            overbid = 0

        # Determine grade-appropriate labour hours
        grade_key = _sku_grade_to_lookup_key(grade) if grade else None
        labour_hrs = GRADE_LABOUR_HOURS.get(grade_key, DEFAULT_LABOUR_HOURS) if grade_key else DEFAULT_LABOUR_HOURS

        profit_current = calc_profit(buy_price, sell_price, parts_cost, labour_hrs)

        if is_winning:
            # Profit if we reduce to optimal (price_to_win + £1 buffer)
            optimal_price = api_price_to_win + 1
            profit_at_optimal = calc_profit(optimal_price, sell_price, parts_cost, labour_hrs)
            profit_to_win = profit_current  # already winning
        else:
            # Profit if we bump to win
            profit_to_win = calc_profit(price_to_win, sell_price, parts_cost, labour_hrs)
            profit_at_optimal = profit_current

        result = {
            "listing_id": lid,
            "sku": sku,
            "label": label,
            "model_family": model_family,
            "apple_model": apple_model,
            "grade": grade,
            "policy_grade": policy_grade,
            "our_price": buy_price,
            "price_to_win": round(api_price_to_win, 2),
            "gap": round(gap, 2),
            "overbid": round(overbid, 2),
            "is_winning": is_winning,
            "sell_price_ref": sell_price,
            "parts_cost": parts_cost,
            "profit_at_current": round(profit_current, 2),
            "profit_at_optimal": round(profit_at_optimal, 2),
            "profit_at_price_to_win": round(profit_to_win, 2),
        }

        results.append(result)
        checked_ids.add(lid)
        count += 1

        # Save progress periodically
        if count % SAVE_EVERY == 0:
            progress["results"] = results
            progress["checked_ids"] = list(checked_ids)
            save_progress(progress)
            log.info(f"Progress saved: {len(results)} results")

        time.sleep(COMPETITOR_DELAY)

    log.info(f"Checked {count} new listings, skipped {skipped} (resumed), {errors} errors")

    bump_candidates = build_bump_candidates(results, args, freeze_state)
    skip_summary = summarize_skip_log(skip_log)
    planned_caution_count = sum(1 for item in bump_candidates if item.get("caution_flag"))
    log.info("Skip breakdown:")
    log.info(
        "  by grade: GOLD=%d PLATINUM=%d DIAMOND=%d SILVER=%d UNKNOWN=%d",
        skip_summary["by_grade"]["GOLD"],
        skip_summary["by_grade"]["PLATINUM"],
        skip_summary["by_grade"]["DIAMOND"],
        skip_summary["by_grade"]["SILVER"],
        skip_summary["by_grade"]["UNKNOWN"],
    )
    log.info(
        "  by reason: SKIP_MARGIN=%d SKIP_NET=%d SKIP_MARKET_FROZEN=%d",
        skip_summary["by_reason"][SKIP_MARGIN],
        skip_summary["by_reason"][SKIP_NET],
        skip_summary["by_reason"][SKIP_MARKET_FROZEN],
    )
    log.info(f"Bumped with caution flag: {planned_caution_count}")

    # Step 5: Save full results
    total = len(results)
    winning = sum(1 for r in results if r.get("is_winning"))
    losing = total - winning

    output = {
        "date": today_str,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total": total,
            "winning": winning,
            "losing": losing,
            "win_pct": round(winning / total * 100, 1) if total else 0,
            "overbids_gt10": sum(1 for r in results if r.get("is_winning") and r.get("overbid", 0) > 10),
            "total_overbid": round(sum(r.get("overbid", 0) for r in results if r.get("is_winning") and r.get("overbid", 0) > 10), 2),
        },
        "results": results,
    }

    suffix = "-quick" if args.quick else ""
    json_path = OUTPUT_DIR / f"buy-box-{today_str}{suffix}.json"
    json_path.write_text(json.dumps(output, indent=2, default=str))
    log.info(f"Saved full results to {json_path}")

    # Step 6: Generate summary report
    previous = find_previous_run(today_str)
    report = generate_report(results, today_str, previous)

    md_path = OUTPUT_DIR / f"buy-box-{today_str}{suffix}-summary.md"
    md_path.write_text(report)
    log.info(f"Saved summary to {md_path}")

    # Clean up progress file
    if PROGRESS_FILE.exists():
        PROGRESS_FILE.unlink()
        log.info("Cleaned up progress file")

    # Step 7: Auto-bump if enabled
    bump_results = None
    if args.auto_bump:
        if args.dry_run:
            log.info(f"DRY RUN: would bump {len(bump_candidates)} listings")
            for item in sorted(bump_candidates, key=lambda x: x.get("profit_at_price_to_win", 0), reverse=True):
                target = round(item["price_to_win"] + BUMP_BUFFER, 2)
                gap = round(target - item["our_price"], 2)
                caution = " [CAUTION]" if item.get("caution_flag") else ""
                log.info(
                    f"  [DRY]{caution} {item['label']}: £{item['our_price']:.0f} -> £{target:.0f} "
                    f"(+£{gap:.0f}, profit £{item['profit_at_price_to_win']:.0f}, "
                    f"margin {item.get('margin_at_price_to_win', 0):.1%})"
                )
        else:
            bump_results = execute_bumps(bump_candidates, min_profit=args.bump_min_profit, max_bump=args.bump_max_gap)

            # Save bump log
            bump_log_path = OUTPUT_DIR / f"bumps-{today_str}.json"
            bump_log_path.write_text(json.dumps({
                "date": today_str,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "config": {
                    "min_profit": args.bump_min_profit,
                    "max_gap": args.bump_max_gap,
                    "legacy_thresholds": args.legacy_thresholds,
                },
                **bump_results,
            }, indent=2, default=str))
            log.info(f"Saved bump log to {bump_log_path}")

    # Print summary
    overbid_count = sum(1 for r in results if r.get("is_winning") and r.get("overbid", 0) > 10)
    total_overbid = sum(r.get("overbid", 0) for r in results if r.get("is_winning") and r.get("overbid", 0) > 10)
    caution_summary_count = bump_results["bumped_with_caution"] if bump_results else planned_caution_count
    print(f"\n{'='*50}")
    print(f"Total: {total} | Winning: {winning} | Losing: {losing}")
    print(f"Overbidding >£10: {overbid_count} listings (£{total_overbid:.0f} excess/txn)")
    print("Skip breakdown:")
    print(
        "  by grade: "
        f"GOLD={skip_summary['by_grade']['GOLD']} "
        f"PLATINUM={skip_summary['by_grade']['PLATINUM']} "
        f"DIAMOND={skip_summary['by_grade']['DIAMOND']} "
        f"SILVER={skip_summary['by_grade']['SILVER']} "
        f"UNKNOWN={skip_summary['by_grade']['UNKNOWN']}"
    )
    print(
        "  by reason: "
        f"SKIP_MARGIN={skip_summary['by_reason'][SKIP_MARGIN]} "
        f"SKIP_NET={skip_summary['by_reason'][SKIP_NET]} "
        f"SKIP_MARKET_FROZEN={skip_summary['by_reason'][SKIP_MARKET_FROZEN]}"
    )
    print(f"Bumped with caution flag: {caution_summary_count}")
    bump_count = len(bump_candidates)
    print(f"Recommended bumps: {bump_count}")
    if bump_results:
        print(f"Auto-bumped: {bump_results['bumped']} OK, {bump_results['failed']} failed")
    print(f"Report: {md_path}")
    print(f"{'='*50}\n")

    log.info("=== Buy Box Monitor complete ===")
    sys.exit(0)


if __name__ == "__main__":
    main()
