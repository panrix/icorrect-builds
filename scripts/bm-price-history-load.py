#!/usr/bin/env python3
"""
BM Price History — Supabase Initial Load
Pulls sold items from Monday BM board, enriches with BM API sale prices,
normalizes canonical spec keys, and inserts into Supabase.
"""

import json
import os
import re
import sys
import time
from datetime import datetime

import requests

# ── Config ──────────────────────────────────────────────────────────

MONDAY_API_TOKEN = os.environ.get("MONDAY_API_TOKEN")
MONDAY_API_URL = "https://api.monday.com/v2"
BM_BOARD_ID = 3892194968

BACKMARKET_API_AUTH = os.environ.get("BACKMARKET_API_AUTH", "").strip("'\"")
BACKMARKET_API_BASE = os.environ.get("BACKMARKET_API_BASE", "https://www.backmarket.co.uk")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

MONDAY_HEADERS = {
    "Authorization": MONDAY_API_TOKEN,
    "Content-Type": "application/json",
    "API-Version": "2024-10"
}

BM_HEADERS = {
    "Authorization": BACKMARKET_API_AUTH,
    "Accept-Language": "en-gb",
    "User-Agent": "BM-iCorrect-n8n;ricky@icorrect.co.uk"
}

SUPABASE_HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# ── Monday column IDs for BM board ──────────────────────────────────

COLUMN_IDS = [
    "text89",           # Raw SKU
    "lookup",           # Device model (mirror)
    "status__1",        # RAM
    "color2",           # Storage
    "status7__1",       # CPU cores
    "status8__1",       # GPU cores
    "mirror",           # Colour (mirror)
    "mirror_Mjj4H2hl",  # Grade (mirror)
    "text_mkye7p1c",    # BM Sale Order ID
    "text_mkyd4bx3",    # BM Listing ID
    "text4",            # Buyer name
]


# ── Supabase table creation ─────────────────────────────────────────

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS bm_price_history (
  id              BIGSERIAL PRIMARY KEY,
  bm_number       TEXT NOT NULL,
  canonical_key   TEXT NOT NULL,
  device_type     TEXT,
  chip            TEXT,
  ram_gb          INTEGER,
  storage_gb      INTEGER,
  grade           TEXT,
  colour          TEXT,
  sale_price      NUMERIC(10,2),
  sale_date       DATE,
  listing_id      TEXT,
  bm_order_id     TEXT,
  raw_sku         TEXT,
  monday_item_id  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bm_ph_canonical_key ON bm_price_history (canonical_key);
CREATE INDEX IF NOT EXISTS idx_bm_ph_sale_date ON bm_price_history (sale_date);
CREATE INDEX IF NOT EXISTS idx_bm_ph_chip_grade ON bm_price_history (chip, grade);
"""


def supabase_rpc(sql):
    """Execute raw SQL via Supabase's pg REST (rpc not available for DDL, use db url)."""
    # Use the PostgREST rpc endpoint won't work for DDL.
    # Instead, we'll use the Supabase Management API or direct DB.
    # For simplicity, use psycopg2 if available, else curl to db.
    try:
        import psycopg2
        db_url = os.environ.get("SUPABASE_DB_URL")
        if not db_url:
            print("ERROR: SUPABASE_DB_URL not set", file=sys.stderr)
            return False
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(sql)
        conn.close()
        return True
    except ImportError:
        print("psycopg2 not available, trying via supabase REST...", file=sys.stderr)
        # Fall back to using the REST API rpc
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
            headers=SUPABASE_HEADERS,
            json={"query": sql}
        )
        if resp.status_code < 300:
            return True
        print(f"SQL exec failed: {resp.status_code} {resp.text}", file=sys.stderr)
        return False


def create_table():
    """Create the bm_price_history table."""
    print("Creating bm_price_history table...")
    ok = supabase_rpc(CREATE_TABLE_SQL)
    if ok:
        print("  Table created (or already exists).")
    else:
        print("  WARNING: Table creation may have failed. Will try inserts anyway.")
    return ok


def monday_query(query):
    """Execute Monday GraphQL query."""
    resp = requests.post(MONDAY_API_URL, headers=MONDAY_HEADERS, json={"query": query})
    resp.raise_for_status()
    data = resp.json()
    if "errors" in data:
        print(f"  Monday API errors: {data['errors']}", file=sys.stderr)
        return None
    time.sleep(0.3)
    return data.get("data")


def get_col_val(item, col_id):
    """Get text value from Monday item column."""
    for cv in item.get("column_values", []):
        if cv["id"] == col_id:
            # For mirror columns, try display_value first
            if "display_value" in cv and cv["display_value"]:
                return cv["display_value"]
            return cv.get("text") or ""
    return ""


def fetch_sold_items():
    """Fetch all sold items from Monday BM board."""
    print("Fetching sold items from Monday BM board...")
    all_items = []
    cursor = None

    col_ids_str = json.dumps(COLUMN_IDS)

    while True:
        if cursor:
            query = f"""
            {{
              next_items_page(cursor: "{cursor}", limit: 100) {{
                cursor
                items {{
                  id
                  name
                  column_values(ids: {col_ids_str}) {{
                    id
                    text
                    value
                    ... on MirrorValue {{
                      display_value
                    }}
                  }}
                }}
              }}
            }}
            """
        else:
            # First page — filter by group
            query = f"""
            {{
              boards(ids: [{BM_BOARD_ID}]) {{
                groups {{
                  id
                  title
                }}
                items_page(limit: 100, query_params: {{rules: []}}) {{
                  cursor
                  items {{
                    id
                    name
                    group {{
                      id
                      title
                    }}
                    column_values(ids: {col_ids_str}) {{
                      id
                      text
                      value
                      ... on MirrorValue {{
                        display_value
                      }}
                    }}
                  }}
                }}
              }}
            }}
            """

        data = monday_query(query)
        if not data:
            break

        if cursor:
            page = data.get("next_items_page", {})
        else:
            page = data["boards"][0]["items_page"]

        items = page.get("items", [])
        cursor = page.get("cursor")

        for item in items:
            buyer = get_col_val(item, "text4")
            order_id = get_col_val(item, "text_mkye7p1c")
            # Sold = buyer name populated AND order ID populated
            if buyer and order_id:
                all_items.append(item)

        print(f"  Page fetched: {len(items)} items, {len(all_items)} sold so far")

        if not cursor:
            break

    print(f"  Total sold items found: {len(all_items)}")
    return all_items


def fetch_bm_order(order_id):
    """Fetch sale price and date from BM API."""
    url = f"{BACKMARKET_API_BASE}/ws/orders/{order_id}"
    try:
        resp = requests.get(url, headers=BM_HEADERS, timeout=10)
        if resp.status_code == 404:
            print(f"    BM order {order_id}: 404 (archived)")
            return None, None
        if resp.status_code == 401:
            print(f"    BM order {order_id}: 401 (auth failed)")
            return None, None
        resp.raise_for_status()
        data = resp.json()

        sale_date = data.get("date_creation", "")
        if sale_date:
            # Parse ISO date — take just the date part
            sale_date = sale_date[:10]

        sale_price = None
        order_lines = data.get("orderlines", data.get("order_lines", []))
        if order_lines:
            price_val = order_lines[0].get("listing_price") or order_lines[0].get("price")
            if price_val:
                sale_price = float(price_val)

        time.sleep(0.2)  # Rate limit
        return sale_price, sale_date

    except Exception as e:
        print(f"    BM order {order_id}: error — {e}")
        return None, None


def normalize_device_type(model_str):
    """Extract device type from model string."""
    model = model_str.lower()
    if "macbook air" in model:
        return "MBA"
    if "macbook pro" in model:
        return "MBP"
    if "imac" in model:
        return "iMac"
    if "mac mini" in model:
        return "MacMini"
    if "mac studio" in model:
        return "MacStudio"
    return "Unknown"


def normalize_chip(model_str, cpu_cores="", raw_sku=""):
    """Extract chip from model string, raw SKU, or known Intel model numbers."""
    model = model_str.lower()
    sku = raw_sku.lower() if raw_sku else ""

    # Check for Pro/Max/Ultra variants first
    if "m3 max" in model:
        return "M3Max"
    if "m3 pro" in model:
        return "M3Pro"
    if "m2 max" in model:
        return "M2Max"
    if "m2 pro" in model:
        return "M2Pro"
    if "m1 max" in model:
        return "M1Max"
    if "m1 pro" in model:
        return "M1Pro"
    if "m4" in model:
        return "M4"
    if "m3" in model:
        return "M3"
    if "m2" in model:
        return "M2"
    if "m1" in model:
        return "M1"

    # Explicit Intel references in model or SKU
    if "intel" in model or "i5" in model or "i7" in model or "i9" in model or "i3" in model:
        return "Intel"
    if "i5" in sku or "i7" in sku or "i9" in sku or "i3" in sku:
        return "Intel"

    # Known Intel model numbers (pre-M1 Macs)
    intel_models = {
        "a2179",  # MacBook Air 2020 Intel
        "a1932",  # MacBook Air 2018/2019
        "a2289",  # MacBook Pro 13" 2020 2TB3
        "a2251",  # MacBook Pro 13" 2020 4TB3
        "a1989",  # MacBook Pro 13" 2018/2019
        "a2141",  # MacBook Pro 16" 2019
        "a1990",  # MacBook Pro 15" 2018/2019
        "a2159",  # MacBook Pro 13" 2019 2TB3
        "a1706",  # MacBook Pro 13" 2016/2017
        "a1707",  # MacBook Pro 15" 2016/2017
        "a1708",  # MacBook Pro 13" 2016/2017 (no Touch Bar)
    }
    for intel_model in intel_models:
        if intel_model in model or intel_model in sku:
            return "Intel"

    # "2020" without M-chip usually means Intel
    if "2020" in model or "2020" in sku:
        return "Intel"

    return "Unknown"


def normalize_ram(ram_str):
    """Parse RAM string to integer GB."""
    if not ram_str:
        return None
    match = re.search(r'(\d+)\s*GB', ram_str, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def normalize_storage(storage_str):
    """Parse storage string to integer GB."""
    if not storage_str:
        return None
    s = storage_str.upper()
    if "2TB" in s or "2000" in s:
        return 2000
    if "1TB" in s or "1000" in s:
        return 1000
    match = re.search(r'(\d+)\s*GB', s, re.IGNORECASE)
    if match:
        return int(match.group(1))
    return None


def normalize_grade(grade_str):
    """Normalize grade to Fair/Good/Excellent."""
    if not grade_str:
        return None
    g = grade_str.strip().lower()
    if "fair" in g:
        return "Fair"
    if "good" in g and "very" not in g:
        return "Good"
    if "excellent" in g or "very good" in g:
        return "Excellent"
    if "premium" in g or "shiny" in g or "stallone" in g:
        return "Excellent"
    return grade_str.strip()


def storage_label(gb):
    """Convert GB int to label for canonical key."""
    if gb is None:
        return "Unknown"
    if gb >= 2000:
        return "2TB"
    if gb >= 1000:
        return "1TB"
    return f"{gb}GB"


def build_canonical_key(device_type, chip, ram_gb, storage_gb, grade):
    """Build canonical key like MBA.M1.8GB.256GB.Fair"""
    ram_label = f"{ram_gb}GB" if ram_gb else "Unknown"
    stor_label = storage_label(storage_gb)
    return f"{device_type}.{chip}.{ram_label}.{stor_label}.{grade or 'Unknown'}"


def insert_to_supabase(rows):
    """Insert rows into Supabase bm_price_history table."""
    if not rows:
        print("No rows to insert.")
        return 0

    print(f"\nInserting {len(rows)} rows into Supabase...")

    # Insert in batches of 50
    inserted = 0
    batch_size = 50
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/bm_price_history",
            headers=SUPABASE_HEADERS,
            json=batch
        )
        if resp.status_code < 300:
            inserted += len(batch)
            print(f"  Batch {i//batch_size + 1}: {len(batch)} rows inserted")
        else:
            print(f"  Batch {i//batch_size + 1}: FAILED — {resp.status_code} {resp.text}")

    return inserted


def main():
    # Validate env
    missing = []
    if not MONDAY_API_TOKEN:
        missing.append("MONDAY_API_TOKEN")
    if not BACKMARKET_API_AUTH:
        missing.append("BACKMARKET_API_AUTH")
    if not SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not SUPABASE_SERVICE_KEY:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if missing:
        print(f"ERROR: Missing env vars: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

    # Step 1: Create table
    create_table()

    # Step 2: Fetch sold items from Monday
    items = fetch_sold_items()

    if not items:
        print("No sold items found. Exiting.")
        return

    # Step 3: Process each item
    rows = []
    skipped = 0
    errored = 0

    for idx, item in enumerate(items, 1):
        bm_number = item["name"]
        item_id = item["id"]
        raw_sku = get_col_val(item, "text89")
        model = get_col_val(item, "lookup")
        ram_str = get_col_val(item, "status__1")
        storage_str = get_col_val(item, "color2")
        cpu_cores = get_col_val(item, "status7__1")
        colour = get_col_val(item, "mirror")
        grade_str = get_col_val(item, "mirror_Mjj4H2hl")
        order_id = get_col_val(item, "text_mkye7p1c").strip()
        listing_id = get_col_val(item, "text_mkyd4bx3").strip()

        print(f"\n[{idx}/{len(items)}] {bm_number} — SKU: {raw_sku}")
        print(f"  Model: {model}, RAM: {ram_str}, Storage: {storage_str}, Grade: {grade_str}")

        # Normalize
        device_type = normalize_device_type(model or raw_sku or "")
        chip = normalize_chip(model or "", cpu_cores, raw_sku or "")
        ram_gb = normalize_ram(ram_str)
        storage_gb = normalize_storage(storage_str)
        grade = normalize_grade(grade_str)
        canonical_key = build_canonical_key(device_type, chip, ram_gb, storage_gb, grade)

        print(f"  Canonical: {canonical_key}")

        # Fetch sale price from BM API
        sale_price, sale_date = None, None
        if order_id:
            print(f"  Fetching BM order {order_id}...")
            sale_price, sale_date = fetch_bm_order(order_id)
            if sale_price:
                print(f"  Sale: £{sale_price} on {sale_date}")
            else:
                print(f"  Sale price not available (order may be archived)")

        row = {
            "bm_number": bm_number,
            "canonical_key": canonical_key,
            "device_type": device_type,
            "chip": chip,
            "ram_gb": ram_gb,
            "storage_gb": storage_gb,
            "grade": grade,
            "colour": colour or None,
            "sale_price": sale_price,
            "sale_date": sale_date,
            "listing_id": listing_id or None,
            "bm_order_id": order_id or None,
            "raw_sku": raw_sku or None,
            "monday_item_id": str(item_id),
        }
        rows.append(row)

    # Step 4: Insert into Supabase
    inserted = insert_to_supabase(rows)

    # Summary
    print(f"\n{'='*60}")
    print(f"BM Price History — Initial Load Complete")
    print(f"{'='*60}")
    print(f"  Monday sold items found: {len(items)}")
    print(f"  Rows prepared: {len(rows)}")
    print(f"  Rows inserted: {inserted}")
    print(f"  Skipped: {skipped}")
    print(f"  Errored: {errored}")
    print(f"  With sale price: {sum(1 for r in rows if r['sale_price'])}")
    print(f"  Without sale price (404/error): {sum(1 for r in rows if not r['sale_price'])}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
