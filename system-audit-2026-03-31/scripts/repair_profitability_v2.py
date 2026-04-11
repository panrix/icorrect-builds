#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import os
import re
import statistics
import sys
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests


WORKDIR = Path("/home/ricky/builds/system-audit-2026-03-31")
ENV_PATH = Path("/home/ricky/config/api-keys/.env")
OUTPUT_PATH = WORKDIR / "repair-profitability-v2.md"
GSC_PATH = WORKDIR / "gsc-repair-profit-rankings.md"

MONDAY_API_URL = "https://api.monday.com/v2"
MONDAY_API_VERSION = "2024-10"
SHOPIFY_GRAPHQL_URL = "https://i-correct-final.myshopify.com/admin/api/2025-10/graphql.json"

PRODUCTS_BOARD_ID = 2477699024
PARTS_BOARD_ID = 985177480
MAIN_BOARD_ID = 349212843

VAT_RATE = 0.20
LABOUR_RATE = 24.0
PAYMENT_FEE_RATE = 0.02
IPHONE_SCREEN_REFURB_COST = 24.0

DEFAULT_HOURS = {
    "iPhone": 1.0,
    "iPad": 1.5,
    "MacBook": 2.0,
    "Watch": 2.0,
    "Other": 1.5,
}

PRODUCT_COLUMNS = [
    "numbers",
    "formula",
    "status3",
    "connect_boards8",
    "link_to_devices6",
    "text_mkzdte13",
]

PART_COLUMNS = [
    "supply_price",
    "quantity",
    "formula_mkv86xh7",
    "link_to_products___pricing",
    "link_to_products_beta73",
    "connect_boards3",
]

MAIN_COLUMNS = [
    "status4",
    "status24",
    "status",
    "service",
    "date4",
    "date6",
    "date_mkypmgfc",
    "collection_date",
    "date_mkwdan7z",
    "board_relation",
    "board_relation0",
    "connect_boards__1",
    "board_relation5",
    "time_tracking9",
    "time_tracking93",
    "time_tracking98",
]

PAGE_LIMIT = 500
RATE_LIMIT_SECONDS = 0.35
ACTIVITY_BATCH_SIZE = 50

COMPLETED_STATUSES = {"Returned", "Shipped", "Ready To Collect", "Repaired"}
REPAIR_TYPE_EXCLUDE = {"Diagnostic", "No Fault Found", "Quote Rejected", "BER", "Unrepairable", "Booking Cancelled"}
REPAIRISH_BOARD_LEVEL_TYPES = {"Board Level"}
REPAIR_START_STATUSES = {"Under Repair", "Under Refurb"}
REPAIR_FINISH_STATUSES = {"Repaired", "Ready To Collect", "Returned", "Shipped"}

TOKEN_RE = re.compile(r"[a-z0-9]+")
MODEL_CODE_RE = re.compile(r"\ba\d{4}\b", re.I)
WHITESPACE_RE = re.compile(r"\s+")
GSC_STOPWORDS = {
    "repair",
    "repairs",
    "replacement",
    "replace",
    "screen",
    "battery",
    "broken",
    "fix",
    "fixed",
    "glass",
    "display",
    "lcd",
    "oled",
    "digitizer",
    "charging",
    "charger",
    "charge",
    "port",
    "camera",
    "speaker",
    "microphone",
    "mic",
    "water",
    "damage",
    "data",
    "recovery",
    "back",
    "front",
    "diagnostic",
    "service",
    "services",
    "london",
    "near",
    "me",
    "cost",
    "price",
    "prices",
    "cheap",
    "best",
    "shop",
    "same",
    "day",
    "mail",
    "in",
    "apple",
}
GENERIC_DEVICE_TOKENS = {
    "apple",
    "iphone",
    "ipad",
    "macbook",
    "watch",
    "applewatch",
    "imac",
    "mac",
    "pro",
    "max",
    "mini",
    "plus",
    "air",
}


@dataclass
class BoardBundle:
    board_id: int
    board_name: str
    items: list[dict[str, Any]]


@dataclass
class RepairSample:
    item_id: str
    status: str
    repair_type: str
    client_type: str
    hours: float
    source: str


@dataclass
class ProductRecord:
    product_id: str
    monday_name: str
    device: str
    device_family: str
    product_type: str
    monday_price_inc_vat: float | None
    monday_price_ex_vat: float | None
    monday_shopify_id: str
    part_ids: list[str]
    part_names: list[str]
    parts_cost: float
    missing_part_cost_names: list[str]
    repair_samples: list[RepairSample] = field(default_factory=list)
    calculated_hours: float | None = None
    default_hours: float | None = None
    used_hours: float | None = None
    timing_flag: str = ""
    timing_method: str = ""
    shopify_product: dict[str, Any] | None = None
    shopify_match_method: str = ""
    shopify_listed: bool = False
    shopify_price_inc_vat: float | None = None
    price_inc_vat: float | None = None
    price_ex_vat: float | None = None
    labour_cost: float | None = None
    refurb_cost: float = 0.0
    payment_fee: float | None = None
    net_profit: float | None = None
    net_margin: float | None = None
    gsc_clicks: float = 0.0
    gsc_impressions: float = 0.0
    gsc_position: float | None = None
    gsc_click_change: float = 0.0
    gsc_queries: list[str] = field(default_factory=list)
    flags: list[str] = field(default_factory=list)


def parse_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if not text:
        return None
    text = text.replace("£", "").replace(",", "")
    text = re.sub(r"[^0-9.\-]", "", text)
    if not text or text in {"-", ".", "-."}:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def parse_json(raw: str | None) -> dict[str, Any]:
    if not raw:
        return {}
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return value if isinstance(value, dict) else {}


def parse_date_value(raw: str | None) -> datetime | None:
    payload = parse_json(raw)
    if not payload:
        return None
    changed_at = payload.get("changed_at")
    if isinstance(changed_at, str) and changed_at:
        try:
            return datetime.fromisoformat(changed_at.replace("Z", "+00:00"))
        except ValueError:
            pass
    date_value = payload.get("date")
    time_value = payload.get("time")
    if not date_value:
        return None
    stamp = f"{date_value}T{time_value or '00:00:00'}"
    try:
        return datetime.fromisoformat(stamp).replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def parse_time_tracking_seconds(raw: str | None) -> float | None:
    payload = parse_json(raw)
    if not payload:
        return None
    duration = payload.get("duration")
    if duration is None:
        return None
    try:
        return float(duration)
    except (TypeError, ValueError):
        return None


def parse_activity_created_at(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        return datetime.fromtimestamp(int(str(raw)) / 10_000_000, tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return None


def normalize(text: str) -> str:
    text = text.lower().replace("&", " and ")
    return " ".join(TOKEN_RE.findall(text))


def tokenize(text: str) -> set[str]:
    return set(normalize(text).split())


def slugify(text: str) -> str:
    return normalize(text).replace(" ", "-")


def escape_md(text: str) -> str:
    return str(text).replace("|", "\\|")


def fmt_money(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    return f"£{value:,.2f}"


def fmt_pct(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    return f"{value * 100:.1f}%"


def fmt_hours(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    return f"{value:.2f}h"


def fmt_num(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    if abs(value - round(value)) < 0.05:
        return str(int(round(value)))
    return f"{value:.1f}"


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    lines.extend("| " + " | ".join(row) + " |" for row in rows)
    return "\n".join(lines)


def column_map(item: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {value["id"]: value for value in item.get("column_values", [])}


def relation_ids(column_value: dict[str, Any] | None) -> list[str]:
    if not column_value:
        return []
    return [str(item_id) for item_id in column_value.get("linked_item_ids") or []]


def relation_display(column_value: dict[str, Any] | None) -> str:
    if not column_value:
        return ""
    return (column_value.get("display_value") or "").strip()


def classify_device(text: str) -> str:
    lower = normalize(text)
    if "iphone" in lower:
        return "iPhone"
    if "ipad" in lower:
        return "iPad"
    if "watch" in lower:
        return "Watch"
    if any(token in lower for token in ["macbook", "imac", "mac mini", "mac studio", "mac pro", "mac"]):
        return "MacBook"
    return "Other"


def product_label(device: str, product_name: str) -> str:
    device_norm = normalize(device)
    name_norm = normalize(product_name)
    if device_norm and device_norm in name_norm:
        return WHITESPACE_RE.sub(" ", product_name).strip()
    return WHITESPACE_RE.sub(" ", f"{device} {product_name}").strip()


def classify_repair_kind(product_type: str, product_name: str) -> str:
    text = normalize(f"{product_type} {product_name}")
    if "aftermarket" in text:
        return "aftermarket screen"
    if "diagnostic" in text:
        return "diagnostic"
    if "screen lines" in text:
        return "screen lines"
    if "rear housing" in text:
        return "rear housing"
    if "charging port" in text:
        return "charging port"
    if "rear camera" in text:
        return "rear camera"
    if "logic board" in text:
        return "logic board"
    if "microsoldering" in text:
        return "microsoldering"
    if "keyboard" in text:
        return "keyboard"
    if "trackpad" in text:
        return "trackpad"
    if "power button" in text:
        return "power button"
    if "battery" in text:
        return "battery"
    if "screen" in text or "glass" in text or "lcd" in text:
        return "screen"
    return normalize(product_type) or normalize(product_name)


def is_iphone_screen(device: str, product_type: str, product_name: str) -> bool:
    return classify_device(device) == "iPhone" and classify_repair_kind(product_type, product_name) == "screen"


def significant_timing_flag(calculated: float | None, default: float | None) -> str:
    if calculated is None or default is None:
        return "no-history"
    diff = calculated - default
    if abs(diff) < 0.25 or abs(diff) / default < 0.25:
        return "aligned"
    return "higher-than-default" if diff > 0 else "lower-than-default"


def trimmed_median(values: list[float]) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    drop_n = int(len(ordered) * 0.25)
    kept = ordered[: len(ordered) - drop_n] if drop_n else ordered
    if not kept:
        kept = ordered
    return statistics.median(kept)


class MondayClient:
    def __init__(self, token: str) -> None:
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": token,
                "Content-Type": "application/json",
                "API-Version": MONDAY_API_VERSION,
            }
        )
        self._last_request_at: float | None = None

    def _wait(self) -> None:
        if self._last_request_at is None:
            return
        elapsed = time.monotonic() - self._last_request_at
        if elapsed < RATE_LIMIT_SECONDS:
            time.sleep(RATE_LIMIT_SECONDS - elapsed)

    def query(self, query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
        self._wait()
        response = self.session.post(MONDAY_API_URL, json={"query": query, "variables": variables or {}}, timeout=180)
        self._last_request_at = time.monotonic()
        response.raise_for_status()
        payload = response.json()
        if payload.get("errors"):
            raise RuntimeError("; ".join(err.get("message", "Unknown Monday error") for err in payload["errors"]))
        return payload["data"]

    def fetch_board(self, board_id: int, column_ids: list[str]) -> BoardBundle:
        cols = ", ".join(f'"{column_id}"' for column_id in column_ids)
        initial_query = f"""
        query {{
          boards(ids:[{board_id}]) {{
            id
            name
            items_page(limit:{PAGE_LIMIT}) {{
              cursor
              items {{
                id
                name
                created_at
                updated_at
                group {{ id title }}
                column_values(ids:[{cols}]) {{
                  id
                  type
                  text
                  value
                  ... on BoardRelationValue {{
                    display_value
                    linked_item_ids
                  }}
                }}
              }}
            }}
          }}
        }}
        """
        data = self.query(initial_query)
        board = data["boards"][0]
        items_page = board["items_page"]
        items = list(items_page.get("items", []))
        cursor = items_page.get("cursor")
        next_query = f"""
        query ($cursor: String!) {{
          next_items_page(cursor:$cursor, limit:{PAGE_LIMIT}) {{
            cursor
            items {{
              id
              name
              created_at
              updated_at
              group {{ id title }}
              column_values(ids:[{cols}]) {{
                id
                type
                text
                value
                ... on BoardRelationValue {{
                  display_value
                  linked_item_ids
                }}
              }}
            }}
          }}
        }}
        """
        while cursor:
            page = self.query(next_query, {"cursor": cursor})["next_items_page"]
            items.extend(page.get("items", []))
            cursor = page.get("cursor")
        return BoardBundle(board_id=board_id, board_name=board["name"], items=items)

    def fetch_status_activity_logs(self, item_ids: list[str]) -> dict[str, list[dict[str, Any]]]:
        logs_by_item: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for start in range(0, len(item_ids), ACTIVITY_BATCH_SIZE):
            batch = item_ids[start : start + ACTIVITY_BATCH_SIZE]
            ids = ", ".join(batch)
            query = f"""
            query {{
              boards(ids:[{MAIN_BOARD_ID}]) {{
                activity_logs(item_ids:[{ids}], column_ids:["status4"]) {{
                  event
                  data
                  created_at
                  user_id
                }}
              }}
            }}
            """
            data = self.query(query)
            logs = data["boards"][0]["activity_logs"]
            for log in logs:
                payload = parse_json(log.get("data"))
                pulse_id = str(payload.get("pulse_id") or "")
                if pulse_id:
                    logs_by_item[pulse_id].append(log)
        for item_id in logs_by_item:
            logs_by_item[item_id].sort(key=lambda log: parse_activity_created_at(log.get("created_at")) or datetime.min.replace(tzinfo=timezone.utc))
        return logs_by_item


class ShopifyClient:
    def __init__(self, token: str) -> None:
        self.session = requests.Session()
        self.session.headers.update({"X-Shopify-Access-Token": token, "Content-Type": "application/json"})

    def fetch_all_products(self) -> list[dict[str, Any]]:
        products: list[dict[str, Any]] = []
        cursor: str | None = None
        while True:
            after_clause = f', after: "{cursor}"' if cursor else ""
            query = f"""
            {{
              products(first: 100{after_clause}) {{
                edges {{
                  cursor
                  node {{
                    id
                    title
                    handle
                    onlineStoreUrl
                    status
                    productType
                    tags
                    publishedAt
                    variants(first: 20) {{
                      edges {{
                        node {{
                          id
                          title
                          price
                          compareAtPrice
                        }}
                      }}
                    }}
                  }}
                }}
                pageInfo {{
                  hasNextPage
                }}
              }}
            }}
            """
            response = self.session.post(SHOPIFY_GRAPHQL_URL, json={"query": query}, timeout=180)
            response.raise_for_status()
            payload = response.json()
            if payload.get("errors"):
                raise RuntimeError("; ".join(err.get("message", "Unknown Shopify error") for err in payload["errors"]))
            edge_block = payload["data"]["products"]
            edges = edge_block["edges"]
            products.extend(edge["node"] for edge in edges)
            if not edge_block["pageInfo"]["hasNextPage"] or not edges:
                break
            cursor = edges[-1]["cursor"]
        return products


def parse_status_transitions(logs: list[dict[str, Any]]) -> list[tuple[datetime, str, str]]:
    transitions: list[tuple[datetime, str, str]] = []
    for log in logs:
        payload = parse_json(log.get("data"))
        value_label = (((payload.get("value") or {}).get("label") or {}).get("text") or "").strip()
        prev_label = (((payload.get("previous_value") or {}).get("label") or {}).get("text") or "").strip()
        created_at = parse_activity_created_at(log.get("created_at"))
        if not created_at or not value_label:
            continue
        transitions.append((created_at, prev_label, value_label))
    transitions.sort(key=lambda row: row[0])
    return transitions


def duration_from_status_logs(transitions: list[tuple[datetime, str, str]]) -> float | None:
    completion_at: datetime | None = None
    for at, _, current in transitions:
        if current in REPAIR_FINISH_STATUSES:
            completion_at = at
            break
    if completion_at is None:
        return None
    start_at: datetime | None = None
    for at, _, current in transitions:
        if current in REPAIR_START_STATUSES and at <= completion_at:
            start_at = at
            break
    if start_at is None:
        return None
    hours = (completion_at - start_at).total_seconds() / 3600.0
    return hours if hours > 0 else None


def duration_from_time_tracking(cols: dict[str, dict[str, Any]]) -> float | None:
    repair_seconds = parse_time_tracking_seconds(cols.get("time_tracking9", {}).get("value"))
    refurb_seconds = parse_time_tracking_seconds(cols.get("time_tracking93", {}).get("value"))
    total_seconds = 0.0
    if repair_seconds:
        total_seconds += repair_seconds
    if refurb_seconds:
        total_seconds += refurb_seconds
    if total_seconds <= 0:
        return None
    return total_seconds / 3600.0


def duration_from_date_columns(cols: dict[str, dict[str, Any]]) -> float | None:
    completion = parse_date_value(cols.get("collection_date", {}).get("value")) or parse_date_value(cols.get("date_mkwdan7z", {}).get("value"))
    start = (
        parse_date_value(cols.get("date4", {}).get("value"))
        or parse_date_value(cols.get("date_mkypmgfc", {}).get("value"))
        or parse_date_value(cols.get("date6", {}).get("value"))
    )
    if not start or not completion:
        return None
    hours = (completion - start).total_seconds() / 3600.0
    return hours if hours > 0 else None


def is_repair_like_item(
    cols: dict[str, dict[str, Any]],
    transitions: list[tuple[datetime, str, str]],
) -> bool:
    repair_type = (cols.get("status24", {}).get("text") or "").strip()
    client_type = (cols.get("status", {}).get("text") or "").strip()
    if repair_type in REPAIR_TYPE_EXCLUDE:
        return False
    if repair_type == "Repair":
        return True
    if client_type == "Refurb":
        return True
    if repair_type in REPAIRISH_BOARD_LEVEL_TYPES and any(current in REPAIR_START_STATUSES for _, _, current in transitions):
        return True
    if any(current == "Under Refurb" for _, _, current in transitions):
        return True
    return False


def parse_markdown_table(section: str) -> list[dict[str, str]]:
    lines = [line.rstrip() for line in section.splitlines()]
    start = None
    for idx, line in enumerate(lines):
        if line.strip().startswith("|"):
            start = idx
            break
    if start is None or start + 1 >= len(lines):
        return []
    header = [cell.strip() for cell in lines[start].strip().strip("|").split("|")]
    rows: list[dict[str, str]] = []
    for line in lines[start + 2 :]:
        stripped = line.strip()
        if not stripped.startswith("|"):
            break
        values = [cell.strip() for cell in stripped.strip("|").split("|")]
        if len(values) != len(header):
            continue
        rows.append(dict(zip(header, values)))
    return rows


def section_block(markdown: str, title: str) -> str:
    pattern = re.compile(rf"^## {re.escape(title)}\n(.*?)(?=^## |\Z)", re.M | re.S)
    match = pattern.search(markdown)
    return match.group(1).strip() if match else ""


def parse_gsc_markdown(path: Path) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    markdown = path.read_text(encoding="utf-8")
    page_rows = parse_markdown_table(section_block(markdown, "Top Repair Landing Pages"))
    query_sections = [
        "Top 20 Repair Queries By Click Volume",
        "Top 20 Fastest-Climbing Repair Queries",
        "Top 20 Striking-Distance Queries",
    ]
    query_map: dict[str, dict[str, str]] = {}
    for title in query_sections:
        for row in parse_markdown_table(section_block(markdown, title)):
            query = row.get("Query", "").strip()
            if not query:
                continue
            current = query_map.get(query)
            if current is None:
                query_map[query] = row
                continue
            current_clicks = parse_float(current.get("Clicks")) or 0.0
            row_clicks = parse_float(row.get("Clicks")) or 0.0
            if row_clicks > current_clicks:
                query_map[query] = row
    return page_rows, list(query_map.values())


def build_shopify_price(product: dict[str, Any]) -> float | None:
    prices = []
    for edge in product.get("variants", {}).get("edges", []):
        price = parse_float(edge.get("node", {}).get("price"))
        if price is not None:
            prices.append(price)
    if not prices:
        return None
    if len(set(prices)) == 1:
        return prices[0]
    return min(prices)


def parse_shopify_numeric_id(raw: str | None) -> str:
    if not raw:
        return ""
    match = re.search(r"(\d+)$", raw)
    return match.group(1) if match else ""


def score_shopify_match(product: ProductRecord, shopify_product: dict[str, Any]) -> tuple[int, str]:
    product_label_norm = normalize(product_label(product.device, product.monday_name))
    monday_name_norm = normalize(product.monday_name)
    device_norm = normalize(product.device)
    title_norm = normalize(shopify_product.get("title", ""))
    handle_norm = normalize((shopify_product.get("handle") or "").replace("-", " "))
    shopify_id = parse_shopify_numeric_id(shopify_product.get("id"))
    monday_id = re.sub(r"\D", "", product.monday_shopify_id or "")

    if monday_id and shopify_id and monday_id == shopify_id:
        return 1000, "shopify-id"

    score = 0
    reasons: list[str] = []
    if product_label_norm == title_norm or product_label_norm == handle_norm:
        score += 120
        reasons.append("exact-label")
    elif monday_name_norm == title_norm or monday_name_norm == handle_norm:
        score += 110
        reasons.append("exact-name")

    if product_label_norm and product_label_norm in title_norm:
        score += 80
        reasons.append("label-in-title")
    elif title_norm and title_norm in product_label_norm:
        score += 50
        reasons.append("title-in-label")

    if device_norm and device_norm in title_norm:
        score += 20
        reasons.append("device")

    monday_tokens = tokenize(product_label(product.device, product.monday_name))
    shopify_tokens = tokenize(f"{shopify_product.get('title', '')} {shopify_product.get('handle', '').replace('-', ' ')}")
    overlap = monday_tokens & shopify_tokens
    for token in overlap:
        if MODEL_CODE_RE.fullmatch(token):
            score += 15
        elif any(ch.isdigit() for ch in token):
            score += 8
        else:
            score += 2

    monday_kind = classify_repair_kind(product.product_type, product.monday_name)
    shopify_kind = classify_repair_kind(shopify_product.get("productType", ""), shopify_product.get("title", ""))
    if monday_kind and monday_kind == shopify_kind:
        score += 15
        reasons.append("repair-kind")

    return score, "+".join(reasons) if reasons else "token-overlap"


def match_shopify_products(products: list[ProductRecord], shopify_products: list[dict[str, Any]]) -> None:
    by_numeric_id = {parse_shopify_numeric_id(product.get("id")): product for product in shopify_products if parse_shopify_numeric_id(product.get("id"))}
    for product in products:
        numeric_id = re.sub(r"\D", "", product.monday_shopify_id or "")
        if numeric_id and numeric_id in by_numeric_id:
            match = by_numeric_id[numeric_id]
            product.shopify_product = match
            product.shopify_match_method = "shopify-id"
            continue

        candidates: list[tuple[int, str, dict[str, Any]]] = []
        for shopify_product in shopify_products:
            score, reason = score_shopify_match(product, shopify_product)
            if score > 0:
                candidates.append((score, reason, shopify_product))
        candidates.sort(key=lambda item: item[0], reverse=True)
        if not candidates:
            continue
        best_score, reason, best = candidates[0]
        second_score = candidates[1][0] if len(candidates) > 1 else -1
        if best_score >= 115 or (best_score >= 60 and best_score - second_score >= 15):
            product.shopify_product = best
            product.shopify_match_method = reason

    for product in products:
        if not product.shopify_product:
            product.shopify_listed = False
            continue
        product.shopify_price_inc_vat = build_shopify_price(product.shopify_product)
        product.shopify_listed = bool(product.shopify_product.get("publishedAt") and product.shopify_product.get("onlineStoreUrl"))


def score_gsc_product_match(product: ProductRecord, matched_label: str) -> int:
    matched_norm = normalize(matched_label)
    label_norm = normalize(product_label(product.device, product.monday_name))
    name_norm = normalize(product.monday_name)
    if matched_norm == label_norm:
        return 100
    if matched_norm == name_norm:
        return 95
    score = 0
    if matched_norm and matched_norm in label_norm:
        score += 60
    if label_norm and label_norm in matched_norm:
        score += 40
    overlap = tokenize(matched_norm) & tokenize(label_norm)
    score += len(overlap) * 4
    if classify_repair_kind(product.product_type, product.monday_name) == classify_repair_kind("", matched_label):
        score += 10
    return score


def match_product_from_query(products: list[ProductRecord], query: str) -> ProductRecord | None:
    query_norm = normalize(query)
    query_tokens = tokenize(query)
    query_family = classify_device(query)
    query_kind = classify_repair_kind("", query)
    query_specific_tokens = {
        token
        for token in query_tokens
        if token not in GSC_STOPWORDS and token not in GENERIC_DEVICE_TOKENS and len(token) > 1
    }

    candidates: list[tuple[int, ProductRecord]] = []
    for product in products:
        label = product_label(product.device, product.monday_name)
        label_norm = normalize(label)
        label_tokens = tokenize(label)
        label_specific_tokens = {
            token
            for token in label_tokens
            if token not in GSC_STOPWORDS and token not in GENERIC_DEVICE_TOKENS and len(token) > 1
        }
        if query_family != "Other" and product.device_family != query_family:
            continue

        product_kind = classify_repair_kind(product.product_type, product.monday_name)
        if query_kind not in {"", "other"} and product_kind and product_kind != query_kind:
            if not (query_kind == "screen" and product_kind in {"screen lines", "screen"}):
                continue

        overlap = label_tokens & query_tokens
        specific_overlap = label_specific_tokens & query_specific_tokens
        if query_specific_tokens and not specific_overlap:
            continue

        score = 0
        if label_norm and label_norm in query_norm:
            score += 12
        elif query_norm and query_norm in label_norm:
            score += 6
        for token in overlap:
            if token in specific_overlap:
                score += 4 if any(ch.isdigit() for ch in token) or MODEL_CODE_RE.fullmatch(token) else 3
            else:
                score += 1
        if product_kind == query_kind and product_kind not in {"", "other"}:
            score += 6
        candidates.append((score, product))

    if not candidates:
        return None
    candidates.sort(key=lambda item: item[0], reverse=True)
    best_score, best = candidates[0]
    second_score = candidates[1][0] if len(candidates) > 1 else -1
    if best_score < 8:
        return None
    if second_score >= 0 and best_score - second_score < 3:
        return None
    return best


def attach_gsc(products: list[ProductRecord], query_rows: list[dict[str, str]]) -> None:
    by_id = {product.product_id: product for product in products}
    for row in query_rows:
        matched = row.get("Matched product", "").strip()
        query = row.get("Query", "").strip()
        product: ProductRecord | None = None
        if matched and matched != "No confident SKU match":
            candidates = []
            for candidate in products:
                score = score_gsc_product_match(candidate, matched)
                if score > 0:
                    candidates.append((score, candidate))
            candidates.sort(key=lambda item: item[0], reverse=True)
            if candidates:
                best_score, best = candidates[0]
                second_score = candidates[1][0] if len(candidates) > 1 else -1
                if best_score >= 25 and (second_score < 0 or best_score - second_score >= 8):
                    product = by_id[best.product_id]
        if product is None and query:
            product = match_product_from_query(products, query)
        if product is None:
            continue
        clicks = parse_float(row.get("Clicks")) or 0.0
        impressions = parse_float(row.get("Impr.")) or 0.0
        position = parse_float(row.get("Pos."))
        click_change = parse_float((row.get("Demand change") or "").split(" clicks")[0].replace("+", "")) or 0.0
        product.gsc_clicks += clicks
        product.gsc_impressions += impressions
        if position is not None and impressions > 0:
            current_position = product.gsc_position if product.gsc_position is not None else 0.0
            current_weight = product.gsc_impressions - impressions
            total_weight = current_weight + impressions
            product.gsc_position = ((current_position * current_weight) + (position * impressions)) / total_weight if total_weight else position
        product.gsc_click_change += click_change
        if query and query not in product.gsc_queries:
            product.gsc_queries.append(query)


def compute_product_profitability(product: ProductRecord) -> None:
    product.default_hours = DEFAULT_HOURS.get(product.device_family, DEFAULT_HOURS["Other"])
    sample_hours = [sample.hours for sample in product.repair_samples if sample.hours > 0]
    product.calculated_hours = trimmed_median(sample_hours) if sample_hours else None
    product.used_hours = product.calculated_hours if len(sample_hours) >= 3 and product.calculated_hours is not None else product.default_hours
    product.timing_flag = significant_timing_flag(product.calculated_hours, product.default_hours)
    if len(sample_hours) >= 3 and product.calculated_hours is not None:
        product.timing_method = "trimmed-median"
    elif sample_hours:
        product.timing_method = "default-fallback (<3 repairs)"
    else:
        product.timing_method = "default-fallback (no matched repairs)"

    product.price_inc_vat = product.shopify_price_inc_vat if product.shopify_price_inc_vat is not None else product.monday_price_inc_vat
    product.price_ex_vat = (product.price_inc_vat / 1.2) if product.price_inc_vat is not None else product.monday_price_ex_vat
    product.labour_cost = (product.used_hours or 0.0) * LABOUR_RATE
    product.refurb_cost = IPHONE_SCREEN_REFURB_COST if is_iphone_screen(product.device, product.product_type, product.monday_name) else 0.0
    product.payment_fee = (product.price_inc_vat or 0.0) * PAYMENT_FEE_RATE if product.price_inc_vat is not None else None
    if product.price_ex_vat is not None and product.payment_fee is not None:
        product.net_profit = product.price_ex_vat - product.parts_cost - (product.labour_cost or 0.0) - product.refurb_cost - product.payment_fee
        product.net_margin = (product.net_profit / product.price_ex_vat) if product.price_ex_vat else None

    flags: list[str] = []
    if product.net_margin is None:
        flags.append("thin")
    elif product.net_margin > 0.30:
        flags.append("healthy")
    elif product.net_margin >= 0.10:
        flags.append("thin")
    else:
        flags.append("loss-maker")

    if product.net_margin is not None and product.net_margin > 0.50 and product.gsc_clicks < 10:
        flags.append("overpriced")
    if not product.shopify_listed:
        flags.append("no-shopify")
    if (
        product.shopify_price_inc_vat is not None
        and product.monday_price_inc_vat is not None
        and abs(product.shopify_price_inc_vat - product.monday_price_inc_vat) > 0.01
    ):
        flags.append("price-mismatch")
    product.flags = flags


def build_missing_shopify_section(products: list[ProductRecord]) -> list[list[str]]:
    grouped: dict[str, list[ProductRecord]] = defaultdict(list)
    for product in products:
        if product.shopify_listed:
            continue
        grouped[product.device].append(product)
    rows = []
    for device, device_products in sorted(grouped.items(), key=lambda item: (item[0].lower(), len(item[1])), reverse=False):
        sample_names = ", ".join(prod.monday_name for prod in device_products[:4])
        rows.append([device, str(len(device_products)), escape_md(sample_names)])
    return rows


def build_methodology_section(
    analyzed_products: list[ProductRecord],
    raw_product_count: int,
    raw_part_count: int,
    main_item_count: int,
    timed_repairs_count: int,
    shopify_products_count: int,
    page_rows_count: int,
    query_rows_count: int,
    store_note: str,
) -> list[str]:
    less_than_three = sum(1 for product in analyzed_products if len(product.repair_samples) < 3)
    no_shopify = sum(1 for product in analyzed_products if not product.shopify_listed)
    price_mismatch = sum(1 for product in analyzed_products if "price-mismatch" in product.flags)
    missing_part_costs = sum(1 for product in analyzed_products if product.missing_part_cost_names)
    gsc_matched = sum(1 for product in analyzed_products if product.gsc_clicks > 0)
    return [
        "## Section 1: Methodology & Data Quality",
        "",
        f"- Generated: `{iso_now()}`",
        f"- Live Monday pulls used boards `{PRODUCTS_BOARD_ID}` (products), `{PARTS_BOARD_ID}` (parts), and `{MAIN_BOARD_ID}` (main board).",
        f"- Live Shopify product pull used the store token against `{store_note}`. The brief named `icorrect-tech.myshopify.com`, but on `2026-04-03` that hostname returned `404` while `i-correct-final.myshopify.com` and `icorrect.co.uk` resolved successfully for the same token.",
        f"- GSC input was parsed from `{GSC_PATH.name}` only; it is a markdown export, not raw Search Console rows.",
        "",
        f"- Raw Monday products fetched: `{raw_product_count}`",
        f"- Raw Monday parts fetched: `{raw_part_count}`",
        f"- Raw Monday main-board items fetched: `{main_item_count}`",
        f"- Products included in profitability output after excluding diagnostics and aftermarket screens: `{len(analyzed_products)}`",
        f"- Completed repair/refurb records with usable timing attached to products: `{timed_repairs_count}`",
        f"- Shopify products fetched: `{shopify_products_count}`",
        f"- GSC landing-page rows parsed: `{page_rows_count}`",
        f"- GSC unique query rows parsed across the three exported tables: `{query_rows_count}`",
        "",
        f"- Products using device default time because fewer than 3 completed repairs were matched: `{less_than_three}`",
        f"- Products not currently listed live on Shopify: `{no_shopify}`",
        f"- Products with Shopify vs Monday price mismatch: `{price_mismatch}`",
        f"- Products with at least one linked part missing a supply cost: `{missing_part_costs}`",
        f"- Products with any matched GSC demand signal from the parsed query tables: `{gsc_matched}`",
        "",
        "- Timing method: prefer `status4` activity-log transitions into `Under Repair` / `Under Refurb` and out to `Repaired` / `Ready To Collect` / `Returned` / `Shipped`; fall back to `Repair Time` + `Refurb Time`; last resort is the repaired-date vs intake-date columns.",
        "- Product repair time uses a trimmed median with the top 25% of durations dropped by count (rounded down) to strip long-tail queue or pause outliers.",
        "- Device defaults used when fewer than 3 completed repairs were matched: iPhone `1.0h`, iPad `1.5h`, MacBook `2.0h`, Watch `2.0h`.",
        "- Profit formula used ex-VAT price from Shopify when a Shopify price existed, otherwise Monday price / `1.2`; labour at `£24/h`; payment fee at `2%` of inc-VAT price; and `£24` extra for iPhone screen products.",
        "",
    ]


def build_repair_time_rows(products: list[ProductRecord]) -> list[list[str]]:
    rows = []
    for product in sorted(products, key=lambda p: (p.device.lower(), p.monday_name.lower())):
        sample_sources = sorted({sample.source for sample in product.repair_samples})
        rows.append(
            [
                escape_md(product.device),
                escape_md(product.monday_name),
                str(len(product.repair_samples)),
                fmt_hours(product.calculated_hours),
                fmt_hours(product.default_hours),
                fmt_hours(product.used_hours),
                product.timing_flag,
                escape_md(", ".join(sample_sources) if sample_sources else product.timing_method),
            ]
        )
    return rows


def build_profitability_rows(products: list[ProductRecord]) -> list[list[str]]:
    rows = []
    sorted_products = sorted(
        products,
        key=lambda product: (
            product.net_margin is None,
            -(product.net_margin or -999),
            -(product.net_profit or -9999),
            product.device.lower(),
            product.monday_name.lower(),
        ),
    )
    for product in sorted_products:
        rows.append(
            [
                escape_md(product.device),
                escape_md(product.monday_name),
                fmt_money(product.price_inc_vat),
                fmt_money(product.price_ex_vat),
                fmt_money(product.parts_cost),
                fmt_money(product.labour_cost),
                fmt_money(product.refurb_cost),
                fmt_money(product.payment_fee),
                fmt_money(product.net_profit),
                fmt_pct(product.net_margin),
                "Yes" if product.shopify_listed else "No",
                fmt_num(product.gsc_clicks),
                fmt_num(product.gsc_position),
                escape_md(", ".join(product.flags)),
            ]
        )
    return rows


def build_action_table(products: list[ProductRecord], selector: Any) -> list[list[str]]:
    rows = []
    for product in selector(products):
        rows.append(
            [
                escape_md(product.device),
                escape_md(product.monday_name),
                fmt_money(product.price_inc_vat),
                fmt_money(product.net_profit),
                fmt_pct(product.net_margin),
                fmt_num(product.gsc_clicks),
                fmt_num(product.gsc_position),
                escape_md(", ".join(product.flags)),
            ]
        )
    return rows


def choose_raise_price(products: list[ProductRecord]) -> list[ProductRecord]:
    candidates = [product for product in products if "loss-maker" in product.flags and product.gsc_clicks >= 5]
    candidates.sort(key=lambda p: (p.gsc_clicks, -(p.net_margin or -999)), reverse=True)
    return candidates[:15]


def choose_lower_price(products: list[ProductRecord]) -> list[ProductRecord]:
    candidates = [product for product in products if "overpriced" in product.flags and product.shopify_listed]
    positive_demand = [product for product in candidates if product.gsc_clicks > 0]
    if positive_demand:
        candidates = positive_demand
    candidates.sort(
        key=lambda p: (
            p.gsc_clicks > 0,
            p.gsc_clicks,
            p.net_margin or -1,
        ),
        reverse=True,
    )
    return candidates[:15]


def choose_review(products: list[ProductRecord]) -> list[ProductRecord]:
    candidates = [product for product in products if "thin" in product.flags and product.gsc_clicks >= 5]
    candidates.sort(key=lambda p: (p.gsc_clicks, -(p.net_margin or -999)), reverse=True)
    return candidates[:15]


def choose_drop(products: list[ProductRecord]) -> list[ProductRecord]:
    candidates = [
        product
        for product in products
        if product.net_profit is not None
        and product.net_profit < 0
        and product.gsc_clicks < 2
        and not product.shopify_listed
    ]
    candidates.sort(key=lambda p: (p.net_profit or 9999, p.gsc_clicks))
    return candidates[:15]


def build_gsc_opportunity_tables(products: list[ProductRecord]) -> tuple[list[list[str]], list[list[str]], list[list[str]]]:
    high_traffic_bad_margin = [
        product
        for product in products
        if product.gsc_clicks >= 10 and product.net_margin is not None and product.net_margin <= 0.30
    ]
    high_traffic_bad_margin.sort(key=lambda p: (p.gsc_clicks, -(p.net_margin or -999)), reverse=True)

    rank_well_bad_margin = [
        product
        for product in products
        if product.gsc_position is not None and product.gsc_position <= 5 and product.net_margin is not None and product.net_margin <= 0.30
    ]
    rank_well_bad_margin.sort(key=lambda p: (-(p.gsc_position or 999), p.gsc_clicks), reverse=False)

    great_margin_low_traffic = [
        product
        for product in products
        if product.net_margin is not None and product.net_margin > 0.50 and product.gsc_clicks < 5
    ]
    great_margin_low_traffic.sort(key=lambda p: (p.net_margin or -1, -(p.gsc_clicks or 0)), reverse=True)

    def rows(items: list[ProductRecord]) -> list[list[str]]:
        return [
            [
                escape_md(product.device),
                escape_md(product.monday_name),
                fmt_num(product.gsc_clicks),
                fmt_num(product.gsc_impressions),
                fmt_num(product.gsc_position),
                f"{'+' if product.gsc_click_change > 0 else ''}{fmt_num(product.gsc_click_change)}",
                fmt_pct(product.net_margin),
                escape_md(", ".join(product.gsc_queries[:3])),
            ]
            for product in items[:15]
        ]

    return rows(high_traffic_bad_margin), rows(rank_well_bad_margin), rows(great_margin_low_traffic)


def render_report(
    raw_product_count: int,
    raw_part_count: int,
    main_item_count: int,
    timed_repairs_count: int,
    shopify_products_count: int,
    page_rows_count: int,
    query_rows_count: int,
    products: list[ProductRecord],
) -> str:
    missing_shopify_rows = build_missing_shopify_section(products)
    raise_rows = build_action_table(products, choose_raise_price)
    lower_rows = build_action_table(products, choose_lower_price)
    review_rows = build_action_table(products, choose_review)
    drop_rows = build_action_table(products, choose_drop)
    high_traffic_rows, rank_well_rows, great_margin_rows = build_gsc_opportunity_tables(products)

    lines = [
        "# Repair Profitability v2",
        "",
        *build_methodology_section(
            analyzed_products=products,
            raw_product_count=raw_product_count,
            raw_part_count=raw_part_count,
            main_item_count=main_item_count,
            timed_repairs_count=timed_repairs_count,
            shopify_products_count=shopify_products_count,
            page_rows_count=page_rows_count,
            query_rows_count=query_rows_count,
            store_note="`i-correct-final.myshopify.com` / `icorrect.co.uk`",
        ),
        "## Section 2: Repair Time Analysis",
        "",
        markdown_table(
            ["Device", "Product", "Repairs", "Calculated", "Default", "Used", "Flag", "Timing source"],
            build_repair_time_rows(products),
        ),
        "",
        "## Section 3: Ranked Product Profitability",
        "",
        markdown_table(
            ["Device", "Product", "Price (inc VAT)", "Ex-VAT", "Parts Cost", "Labour", "Refurb", "Fees", "Net Profit", "Net Margin %", "Shopify Listed", "GSC Clicks (90d)", "GSC Position", "Flag"],
            build_profitability_rows(products),
        ),
        "",
        "## Section 4: Missing From Shopify",
        "",
    ]
    if missing_shopify_rows:
        lines.extend(
            [
                markdown_table(["Device model", "Missing SKUs", "Example Monday products"], missing_shopify_rows),
                "",
            ]
        )
    else:
        lines.extend(["No device groups were found on Monday without a live Shopify listing.", ""])

    lines.extend(
        [
            "## Section 5: Pricing Action List",
            "",
            "### Raise Price",
            "",
            markdown_table(["Device", "Product", "Price", "Net Profit", "Net Margin", "GSC Clicks", "GSC Position", "Flag"], raise_rows or [["n/a", "None", "n/a", "n/a", "n/a", "0", "n/a", "n/a"]]),
            "",
            "### Lower Price",
            "",
            markdown_table(["Device", "Product", "Price", "Net Profit", "Net Margin", "GSC Clicks", "GSC Position", "Flag"], lower_rows or [["n/a", "None", "n/a", "n/a", "n/a", "0", "n/a", "n/a"]]),
            "",
            "### Review",
            "",
            markdown_table(["Device", "Product", "Price", "Net Profit", "Net Margin", "GSC Clicks", "GSC Position", "Flag"], review_rows or [["n/a", "None", "n/a", "n/a", "n/a", "0", "n/a", "n/a"]]),
            "",
            "### Consider Dropping",
            "",
            markdown_table(["Device", "Product", "Price", "Net Profit", "Net Margin", "GSC Clicks", "GSC Position", "Flag"], drop_rows or [["n/a", "None", "n/a", "n/a", "n/a", "0", "n/a", "n/a"]]),
            "",
            "## Section 6: GSC Opportunity Matrix",
            "",
            "### High-Traffic Queries With Bad Margin",
            "",
            markdown_table(["Device", "Product", "Clicks", "Impr.", "Position", "Click trend", "Margin", "Matched queries"], high_traffic_rows or [["n/a", "None", "0", "0", "n/a", "0", "n/a", "n/a"]]),
            "",
            "### Rank Well But Margin Is Bad",
            "",
            markdown_table(["Device", "Product", "Clicks", "Impr.", "Position", "Click trend", "Margin", "Matched queries"], rank_well_rows or [["n/a", "None", "0", "0", "n/a", "0", "n/a", "n/a"]]),
            "",
            "### Great Margin But Low Traffic",
            "",
            markdown_table(["Device", "Product", "Clicks", "Impr.", "Position", "Click trend", "Margin", "Matched queries"], great_margin_rows or [["n/a", "None", "0", "0", "n/a", "0", "n/a", "n/a"]]),
            "",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    env = parse_env(ENV_PATH)
    monday_token = env.get("MONDAY_APP_TOKEN")
    shopify_token = env.get("SHOPIFY_ACCESS_TOKEN")
    if not monday_token:
        raise RuntimeError(f"MONDAY_APP_TOKEN not found in {ENV_PATH}")
    if not shopify_token:
        raise RuntimeError(f"SHOPIFY_ACCESS_TOKEN not found in {ENV_PATH}")

    monday = MondayClient(monday_token)
    shopify = ShopifyClient(shopify_token)

    print("fetching Monday products", file=sys.stderr, flush=True)
    products_bundle = monday.fetch_board(PRODUCTS_BOARD_ID, PRODUCT_COLUMNS)
    print("fetching Monday parts", file=sys.stderr, flush=True)
    parts_bundle = monday.fetch_board(PARTS_BOARD_ID, PART_COLUMNS)
    print("fetching Monday main board", file=sys.stderr, flush=True)
    main_bundle = monday.fetch_board(MAIN_BOARD_ID, MAIN_COLUMNS)

    print("fetching Shopify products", file=sys.stderr, flush=True)
    shopify_products = shopify.fetch_all_products()

    print("parsing GSC markdown", file=sys.stderr, flush=True)
    page_rows, query_rows = parse_gsc_markdown(GSC_PATH)

    part_items_by_id: dict[str, dict[str, Any]] = {}
    reverse_product_to_parts: dict[str, list[str]] = defaultdict(list)
    main_repairs_by_part: dict[str, list[RepairSample]] = defaultdict(list)
    main_repairs_by_product: dict[str, list[RepairSample]] = defaultdict(list)

    for item in parts_bundle.items:
        cols = column_map(item)
        part_id = str(item["id"])
        product_ids = relation_ids(cols.get("link_to_products___pricing"))
        part_items_by_id[part_id] = {
            "id": part_id,
            "name": item["name"],
            "supply_price": parse_float(cols.get("supply_price", {}).get("text")),
            "product_ids": product_ids,
            "repair_ids": relation_ids(cols.get("link_to_products_beta73")),
            "available_stock": parse_float(cols.get("formula_mkv86xh7", {}).get("text")),
            "quantity": parse_float(cols.get("quantity", {}).get("text")),
            "device_name": relation_display(cols.get("connect_boards3")),
        }
        for product_id in product_ids:
            reverse_product_to_parts[product_id].append(part_id)

    candidate_main_items = []
    for item in main_bundle.items:
        cols = column_map(item)
        status = (cols.get("status4", {}).get("text") or "").strip()
        repair_type = (cols.get("status24", {}).get("text") or "").strip()
        client_type = (cols.get("status", {}).get("text") or "").strip()
        if status not in COMPLETED_STATUSES:
            continue
        if repair_type in REPAIR_TYPE_EXCLUDE:
            continue
        if repair_type == "Repair" or repair_type in REPAIRISH_BOARD_LEVEL_TYPES or client_type == "Refurb":
            candidate_main_items.append(item)

    print(f"fetching status activity logs for {len(candidate_main_items)} completed candidate items", file=sys.stderr, flush=True)
    status_logs_by_item = monday.fetch_status_activity_logs([str(item["id"]) for item in candidate_main_items])

    usable_repairs = 0
    for item in candidate_main_items:
        item_id = str(item["id"])
        cols = column_map(item)
        transitions = parse_status_transitions(status_logs_by_item.get(item_id, []))
        if not is_repair_like_item(cols, transitions):
            continue
        duration = duration_from_status_logs(transitions)
        source = "status-activity"
        if duration is None:
            duration = duration_from_time_tracking(cols)
            source = "time-tracking"
        if duration is None:
            duration = duration_from_date_columns(cols)
            source = "date-columns"
        if duration is None or duration <= 0:
            continue

        sample = RepairSample(
            item_id=item_id,
            status=(cols.get("status4", {}).get("text") or "").strip(),
            repair_type=(cols.get("status24", {}).get("text") or "").strip(),
            client_type=(cols.get("status", {}).get("text") or "").strip(),
            hours=duration,
            source=source,
        )
        usable_repairs += 1

        direct_product_ids = relation_ids(cols.get("board_relation")) + relation_ids(cols.get("board_relation0"))
        for product_id in dict.fromkeys(direct_product_ids):
            main_repairs_by_product[product_id].append(sample)

        part_ids = relation_ids(cols.get("connect_boards__1"))
        for part_id in part_ids:
            main_repairs_by_part[part_id].append(sample)

    product_records: list[ProductRecord] = []
    for item in products_bundle.items:
        cols = column_map(item)
        product_id = str(item["id"])
        product_name = item["name"]
        product_type = (cols.get("status3", {}).get("text") or "").strip()
        repair_kind = classify_repair_kind(product_type, product_name)
        if repair_kind == "diagnostic" or repair_kind == "aftermarket screen":
            continue

        device = relation_display(cols.get("link_to_devices6")) or (item.get("group") or {}).get("title", "") or product_name
        price_inc = parse_float(cols.get("numbers", {}).get("text"))
        price_ex = parse_float(cols.get("formula", {}).get("text"))
        if price_ex is None and price_inc is not None:
            price_ex = price_inc / 1.2

        direct_part_ids = relation_ids(cols.get("connect_boards8"))
        reverse_part_ids = reverse_product_to_parts.get(product_id, [])
        part_ids = list(dict.fromkeys(direct_part_ids + reverse_part_ids))
        part_names = []
        missing_part_cost_names = []
        parts_cost = 0.0
        for part_id in part_ids:
            part = part_items_by_id.get(part_id)
            if not part:
                continue
            part_names.append(part["name"])
            if part["supply_price"] is None:
                missing_part_cost_names.append(part["name"])
            else:
                parts_cost += float(part["supply_price"])

        samples: list[RepairSample] = []
        seen_sample_ids: set[str] = set()
        for sample in main_repairs_by_product.get(product_id, []):
            if sample.item_id not in seen_sample_ids:
                samples.append(sample)
                seen_sample_ids.add(sample.item_id)
        for part_id in part_ids:
            for sample in main_repairs_by_part.get(part_id, []):
                if sample.item_id not in seen_sample_ids:
                    samples.append(sample)
                    seen_sample_ids.add(sample.item_id)

        product_records.append(
            ProductRecord(
                product_id=product_id,
                monday_name=product_name,
                device=device,
                device_family=classify_device(device),
                product_type=product_type,
                monday_price_inc_vat=price_inc,
                monday_price_ex_vat=price_ex,
                monday_shopify_id=(cols.get("text_mkzdte13", {}).get("text") or "").strip(),
                part_ids=part_ids,
                part_names=part_names,
                parts_cost=parts_cost,
                missing_part_cost_names=missing_part_cost_names,
                repair_samples=samples,
            )
        )

    match_shopify_products(product_records, shopify_products)
    attach_gsc(product_records, query_rows)
    for product in product_records:
        compute_product_profitability(product)

    report = render_report(
        raw_product_count=len(products_bundle.items),
        raw_part_count=len(parts_bundle.items),
        main_item_count=len(main_bundle.items),
        timed_repairs_count=usable_repairs,
        shopify_products_count=len(shopify_products),
        page_rows_count=len(page_rows),
        query_rows_count=len(query_rows),
        products=product_records,
    )
    OUTPUT_PATH.write_text(report, encoding="utf-8")
    print(f"wrote {OUTPUT_PATH}", file=sys.stderr, flush=True)


if __name__ == "__main__":
    main()
