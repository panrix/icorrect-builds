#!/usr/bin/env python3
"""Shared utilities for pricing sync project.

Reuses bm_utils.py for Monday API + credential loading.
Adds Shopify REST API, SumUp CSV parsing, and name normalization.
"""
import sys
import os
import re
import json
import csv
import subprocess
import time

# Reuse existing Monday API wrapper
sys.path.insert(0, "/home/ricky/builds/backmarket/api")
from bm_utils import load_env, monday_query


def log(msg):
    """Log to stderr."""
    print(msg, file=sys.stderr)
    sys.stderr.flush()


# ---------------------------------------------------------------------------
# Shopify REST API
# ---------------------------------------------------------------------------

def shopify_get(endpoint, env=None, params=None):
    """GET request to Shopify Admin API (2024-10)."""
    if env is None:
        env = load_env()
    store = env.get("SHOPIFY_STORE", "i-correct-final.myshopify.com")
    token = env.get("SHOPIFY_ACCESS_TOKEN", "")
    url = f"https://{store}/admin/api/2024-10/{endpoint}"
    if params:
        qs = "&".join(f"{k}={v}" for k, v in params.items())
        url = f"{url}?{qs}"
    cmd = [
        "curl", "-s", url,
        "-H", f"X-Shopify-Access-Token: {token}",
        "-H", "Accept: application/json",
    ]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"Shopify curl failed: {r.stderr}")
    return json.loads(r.stdout)


def shopify_get_all_products(env=None):
    """Paginate through all Shopify products. Returns list of product dicts."""
    if env is None:
        env = load_env()
    store = env.get("SHOPIFY_STORE", "i-correct-final.myshopify.com")
    token = env.get("SHOPIFY_ACCESS_TOKEN", "")

    products = []
    url = f"https://{store}/admin/api/2024-10/products.json?limit=250&status=active"
    page = 0

    while url:
        cmd = [
            "curl", "-s", "-D", "/dev/stderr", url,
            "-H", f"X-Shopify-Access-Token: {token}",
            "-H", "Accept: application/json",
        ]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError(f"Shopify curl failed: {r.stderr}")

        data = json.loads(r.stdout)
        batch = data.get("products", [])
        products.extend(batch)
        page += 1
        log(f"  Shopify page {page}: {len(batch)} products (total: {len(products)})")

        # Parse Link header for next page
        url = None
        for line in r.stderr.split("\n"):
            if line.lower().startswith("link:"):
                # Find rel="next" URL
                parts = line.split(",")
                for part in parts:
                    if 'rel="next"' in part:
                        match = re.search(r'<([^>]+)>', part)
                        if match:
                            url = match.group(1)
                break

    return products


# ---------------------------------------------------------------------------
# Monday.com GraphQL
# ---------------------------------------------------------------------------

def monday_get_schema(board_id, env=None):
    """Fetch board schema: name, columns, groups."""
    q = """{ boards(ids: [%s]) {
        name
        columns { id title type settings_str }
        groups { id title }
    }}""" % board_id
    r = monday_query(q, env)
    boards = r.get("data", {}).get("boards", [])
    return boards[0] if boards else {}


def monday_paginate(board_id, column_ids=None, env=None):
    """Paginate all items from a Monday board. Returns (items, groups_map)."""
    all_items = []
    cursor = None
    page = 0

    col_filter = ""
    if column_ids:
        col_str = '", "'.join(column_ids)
        col_filter = f'(ids: ["{col_str}"])'

    while True:
        if cursor:
            q = '{ next_items_page(limit: 200, cursor: "%s") { cursor items { id name group { id title } column_values%s { id text type } } } }' % (cursor, col_filter)
        else:
            q = '{ boards(ids: [%s]) { items_page(limit: 200) { cursor items { id name group { id title } column_values%s { id text type } } } } }' % (board_id, col_filter)

        r = monday_query(q, env)

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
        page += 1
        log(f"  Monday board {board_id} page {page}: {len(items)} items (total: {len(all_items)})")

        if not cursor:
            break

    return all_items


# ---------------------------------------------------------------------------
# SumUp CSV Parser
# ---------------------------------------------------------------------------

def parse_sumup_csv(filepath):
    """Parse SumUp export CSV into structured data.

    SumUp uses parent/variation structure:
    - Row with 'Item name' filled = parent (device)
    - Row with 'Variations' filled = child repair under preceding parent

    Returns list of:
        {
            "device": str,
            "item_id": str (UUID),
            "category": str,
            "repairs": [
                {"name": str, "price": float, "variant_id": str},
                ...
            ]
        }
    """
    devices = []
    current_device = None

    with open(filepath, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            item_name = (row.get("Item name") or "").strip()
            variation = (row.get("Variations") or "").strip()
            price_str = (row.get("Price") or "").strip()
            item_id = (row.get("Item id (Do not change)") or "").strip()
            variant_id = (row.get("Variant id (Do not change)") or "").strip()
            category = (row.get("Category") or "").strip()

            price = None
            if price_str:
                try:
                    price = float(price_str)
                except ValueError:
                    pass

            if item_name and not variation:
                # Parent row — new device
                current_device = {
                    "device": item_name,
                    "item_id": item_id,
                    "category": category,
                    "repairs": [],
                }
                devices.append(current_device)
            elif variation and current_device is not None:
                # Child row — repair/variation under current device
                current_device["repairs"].append({
                    "name": variation,
                    "price": price,
                    "variant_id": variant_id,
                })

    return devices


# ---------------------------------------------------------------------------
# Name Normalization
# ---------------------------------------------------------------------------

def load_aliases(filepath):
    """Load alias map from JSON file. Returns dict or empty dict if missing."""
    if os.path.exists(filepath):
        with open(filepath) as f:
            return json.load(f)
    return {}


def normalize_device(name, aliases=None):
    """Normalize device name to Shopify canonical form."""
    if not name:
        return ""
    n = name.strip()

    # Apply explicit aliases first
    if aliases and n in aliases:
        return aliases[n]

    # Rule-based normalization
    n = re.sub(r'\s+', ' ', n)                    # collapse whitespace
    n = re.sub(r'(\d+)\s*mm\b', lambda m: m.group(1) + 'MM', n, flags=re.I)  # 40mm → 40MM
    n = re.sub(r'\bS(\d)\b', r'Series \1', n)     # S4 → Series 4
    n = re.sub(r'\bSE(\d)\b', r'SE \1', n)        # SE2 → SE 2
    n = re.sub(r'"', "'", n)                       # normalize quotes

    # Check aliases again after normalization
    if aliases and n in aliases:
        return aliases[n]

    return n


def normalize_repair(name, aliases=None):
    """Normalize repair type to Shopify canonical form."""
    if not name:
        return ""
    n = name.strip()

    # Apply explicit aliases first
    if aliases and n in aliases:
        return aliases[n]

    return n
