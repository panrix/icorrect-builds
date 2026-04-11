#!/usr/bin/env python3
"""
Sync all BackMarket trade-in orders to Google Sheet.
Replaces the broken n8n automation.

Pulls ALL orders from BM buyback API, writes to the trade-in orders sheet.
Overwrites the entire sheet each run (full refresh).

Usage:
    python3 sync_tradein_orders.py              # Full refresh
    python3 sync_tradein_orders.py --dry-run    # Show stats without writing
"""

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("tradein-sync")

# Config
BM_HEADERS = {
    "Authorization": "Basic MWI1NjJiZDg5ZjE2ZjdlODZmZTQ2NzpCTVQtOGM2ZDI5Zjg2MWJkZmUwZTcwYWI3ZDczM2EwYmE4Y2JhNjE4MjViMA==",
    "Accept-Language": "en-gb",
    "User-Agent": "BM-iCorrect-n8n;ricky@icorrect.co.uk",
    "Accept": "application/json",
}
SHEET_ID = "1A7-NSlqFeCZmS73i2xO-NqlB2wD_lc53V6BxKGjNW2g"
ENV_PATH = "/home/ricky/config/api-keys/.env"

GRADE_MAP = {
    "STALLONE": "NONFUNC_CRACK",
    "BRONZE": "NONFUNC_USED",
    "SILVER": "FUNC_CRACK",
    "GOLD": "FUNC_USED",
    "PLATINUM": "FUNC_GOOD",
    "DIAMOND": "FUNC_EXCELLENT",
}

HEADERS = [
    "orderPublicId", "status", "market", "creationDate", "modificationDate",
    "shippingDate", "receivalDate", "paymentDate", "suspensionDate", "counterProposalDate",
    "listingSku", "listingProductId", "listingTitle", "listingGrade", "listingGradeMapped",
    "originalPriceValue", "originalPriceCurrency",
    "counterOfferPriceValue", "counterOfferPriceCurrency",
    "customerFirstName", "customerLastName", "customerPhone", "customerDateOfBirth",
    "returnAddressCity", "returnAddressZipcode", "returnAddressCountry",
    "trackingNumber"
]


def load_env(path=ENV_PATH):
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def fetch_all_orders():
    """Fetch all trade-in orders from BM API with pagination."""
    all_orders = []
    url = "https://www.backmarket.co.uk/ws/buyback/v1/orders"
    params = {"page_size": 100}
    page = 1

    while True:
        log.info(f"  Fetching page {page}...")
        for attempt in range(3):
            try:
                resp = requests.get(url, headers=BM_HEADERS, params=params, timeout=30)
                if resp.status_code == 429:
                    wait = 30 * (attempt + 1)
                    log.warning(f"  Rate limited. Waiting {wait}s...")
                    time.sleep(wait)
                    continue
                resp.raise_for_status()
                break
            except requests.exceptions.RequestException as e:
                log.error(f"  Error: {e}")
                if attempt == 2:
                    return all_orders
                time.sleep(5)

        data = resp.json()
        results = data.get("results", [])
        all_orders.extend(results)
        log.info(f"  Got {len(results)} orders (total: {len(all_orders)})")

        next_url = data.get("next")
        if not next_url or not results:
            break

        url = next_url
        params = None
        page += 1
        time.sleep(1)

    return all_orders


def order_to_row(order):
    """Convert an order dict to a sheet row."""
    listing = order.get("listing", {})
    original = order.get("originalPrice", {})
    counter = order.get("counterOfferPrice", {})
    customer = order.get("customer", {})
    addr = order.get("returnAddress", {})
    grade = listing.get("grade", "")

    return [
        order.get("orderPublicId", ""),
        order.get("status", ""),
        order.get("market", ""),
        order.get("creationDate", ""),
        order.get("modificationDate", ""),
        order.get("shippingDate", "") or "",
        order.get("receivalDate", "") or "",
        order.get("paymentDate", "") or "",
        order.get("suspensionDate", "") or "",
        order.get("counterProposalDate", "") or "",
        listing.get("sku", "") or "",
        str(listing.get("productId", "")) or "",
        listing.get("title", ""),
        grade,
        GRADE_MAP.get(grade, grade),
        original.get("value", ""),
        original.get("currency", ""),
        counter.get("value", "") if counter else "",
        counter.get("currency", "") if counter else "",
        customer.get("firstName", ""),
        customer.get("lastName", ""),
        customer.get("phone", ""),
        customer.get("dateOfBirth", "") or "",
        addr.get("city", ""),
        addr.get("zipcode", ""),
        addr.get("country", ""),
        order.get("trackingNumber", "") or "",
    ]


def get_access_token(env):
    resp = requests.post("https://oauth2.googleapis.com/token", data={
        "grant_type": "refresh_token",
        "refresh_token": env["JARVIS_GOOGLE_REFRESH_TOKEN"],
        "client_id": env["GOOGLE_CLIENT_ID"],
        "client_secret": env["GOOGLE_CLIENT_SECRET"],
    })
    return resp.json()["access_token"]


def write_to_sheet(access_token, rows):
    """Overwrite the entire sheet with new data."""
    headers_api = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

    # Clear existing data
    clear_url = f"https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/Sheet1:clear"
    requests.post(clear_url, headers=headers_api)

    # Write header + all rows
    all_rows = [HEADERS] + rows
    update_url = f"https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/Sheet1!A1?valueInputOption=RAW"

    # Sheets API has a limit of ~10MB per request. Batch if needed.
    batch_size = 1000
    for i in range(0, len(all_rows), batch_size):
        batch = all_rows[i:i + batch_size]
        start_row = i + 1
        range_str = f"Sheet1!A{start_row}"
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/{range_str}?valueInputOption=RAW"
        resp = requests.put(url, headers=headers_api, json={"values": batch})
        resp.raise_for_status()
        log.info(f"  Written rows {i + 1}-{i + len(batch)}")


def main():
    parser = argparse.ArgumentParser(description="Sync BM trade-in orders to Google Sheet")
    parser.add_argument("--dry-run", action="store_true", help="Show stats without writing")
    args = parser.parse_args()

    log.info("=== Trade-in Orders Sync ===")

    # Fetch all orders
    log.info("Fetching all orders from BM API...")
    orders = fetch_all_orders()
    log.info(f"Total orders: {len(orders)}")

    # Convert to rows
    rows = [order_to_row(o) for o in orders]

    # Stats
    from collections import Counter
    statuses = Counter(r[1] for r in rows)
    grades = Counter(r[14] for r in rows)  # mapped grade

    log.info(f"\nStatus breakdown:")
    for s, c in statuses.most_common():
        log.info(f"  {s}: {c}")

    log.info(f"\nGrade breakdown (mapped):")
    for g, c in grades.most_common():
        log.info(f"  {g}: {c}")

    # Date range
    dates = [r[3] for r in rows if r[3]]
    if dates:
        log.info(f"\nDate range: {min(dates)[:10]} to {max(dates)[:10]}")

    # TO_SEND analysis
    to_send = [r for r in rows if r[1] == "TO_SEND"]
    log.info(f"\nTO_SEND (accepted but not sent): {len(to_send)}")
    to_send_grades = Counter(r[14] for r in to_send)
    for g, c in to_send_grades.most_common():
        log.info(f"  {g}: {c}")

    if args.dry_run:
        log.info("\nDRY RUN: not writing to sheet")
        return

    # Write to sheet
    env = load_env()
    log.info("\nAuthenticating with Google...")
    access_token = get_access_token(env)

    log.info(f"Writing {len(rows)} orders to sheet...")
    write_to_sheet(access_token, rows)

    log.info(f"\nDone. Sheet: https://docs.google.com/spreadsheets/d/{SHEET_ID}")


if __name__ == "__main__":
    main()
