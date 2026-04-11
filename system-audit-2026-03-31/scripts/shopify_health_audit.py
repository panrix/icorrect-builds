#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import math
import os
import re
import statistics
import time
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

import requests


WORKDIR = Path("/home/ricky/builds/system-audit-2026-03-31")
ENV_PATH = Path("/home/ricky/config/api-keys/.env")
OUTPUT_PATH = WORKDIR / "shopify-health-audit.md"
GSC_PATH = WORKDIR / "gsc-repair-profit-rankings.md"

MONDAY_API_URL = "https://api.monday.com/v2"
MONDAY_API_VERSION = "2024-10"
SHOPIFY_REST_URL = "https://i-correct-final.myshopify.com/admin/api/2025-10"

PRODUCTS_BOARD_ID = 2477699024
PARTS_BOARD_ID = 985177480
MAIN_BOARD_ID = 349212843

PAGE_LIMIT = 500
MONDAY_RATE_LIMIT_SECONDS = 0.35
CURRENT_DATE = datetime(2026, 4, 3, tzinfo=timezone.utc)

TOKEN_RE = re.compile(r"[a-z0-9]+")
MODEL_CODE_RE = re.compile(r"\ba\d{4}\b", re.I)
WHITESPACE_RE = re.compile(r"\s+")
HTML_TAG_RE = re.compile(r"<[^>]+>")
LINK_RE = re.compile(r'<([^>]+)>;\s*rel="([^"]+)"')

COMPLETED_STATUSES = {"Returned", "Shipped", "Ready To Collect", "Repaired"}
REPAIR_TYPE_EXCLUDE = {"Diagnostic", "No Fault Found", "Quote Rejected", "BER", "Unrepairable", "Booking Cancelled"}

PRODUCT_COLUMNS = [
    "numbers",
    "formula",
    "status3",
    "connect_boards8",
    "link_to_devices6",
    "text_mkzdte13",
]

PART_COLUMNS = [
    "link_to_products___pricing",
]

MAIN_COLUMNS = [
    "status4",
    "status24",
    "status",
    "board_relation",
    "board_relation0",
    "connect_boards__1",
]

GSC_QUERY_SECTIONS = [
    "Top 20 Repair Queries By Click Volume",
    "Top 20 Fastest-Climbing Repair Queries",
    "Top 20 Striking-Distance Queries",
]


@dataclass
class BoardBundle:
    board_id: int
    board_name: str
    items: list[dict[str, Any]]


@dataclass
class GscDemand:
    clicks: float = 0.0
    impressions: float = 0.0
    position: float | None = None
    queries: list[str] = field(default_factory=list)
    direct_page_clicks: float = 0.0


@dataclass
class MondayProduct:
    item_id: str
    name: str
    device: str
    product_type: str
    monday_price_inc_vat: float | None
    monday_price_ex_vat: float | None
    monday_shopify_id: str
    part_ids: list[str]
    repair_kind: str
    group_title: str
    matched_shopify: dict[str, Any] | None = None
    match_method: str = ""
    completed_repairs: int = 0
    gsc: GscDemand = field(default_factory=GscDemand)

    @property
    def label(self) -> str:
        return product_label(self.device, self.name)


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


def normalize(text: str) -> str:
    text = text.lower().replace("&", " and ")
    return " ".join(TOKEN_RE.findall(text))


def tokenize(text: str) -> set[str]:
    return set(normalize(text).split())


def slugify(text: str) -> str:
    return normalize(text).replace(" ", "-")


def parse_shopify_numeric_id(raw: str | None) -> str:
    if not raw:
        return ""
    match = re.search(r"(\d+)$", str(raw))
    return match.group(1) if match else ""


def strip_html(raw: str | None) -> str:
    if not raw:
        return ""
    text = HTML_TAG_RE.sub(" ", raw)
    text = html.unescape(text)
    text = text.replace("\xa0", " ")
    return WHITESPACE_RE.sub(" ", text).strip()


def escape_md(text: Any) -> str:
    return str(text).replace("|", "\\|")


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    lines.extend("| " + " | ".join(row) + " |" for row in rows)
    return "\n".join(lines)


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


def relation_ids(column_value: dict[str, Any] | None) -> list[str]:
    if not column_value:
        return []
    return [str(item_id) for item_id in column_value.get("linked_item_ids") or []]


def relation_display(column_value: dict[str, Any] | None) -> str:
    if not column_value:
        return ""
    return (column_value.get("display_value") or "").strip()


def column_map(item: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {value["id"]: value for value in item.get("column_values", [])}


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


def product_page_handle(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path.strip("/")
    parts = path.split("/")
    if len(parts) >= 2 and parts[0] == "products":
        return parts[1]
    return ""


def parse_link_header(link_header: str | None) -> dict[str, str]:
    links: dict[str, str] = {}
    if not link_header:
        return links
    for url, rel in LINK_RE.findall(link_header):
        links[rel] = url
    return links


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
        if elapsed < MONDAY_RATE_LIMIT_SECONDS:
            time.sleep(MONDAY_RATE_LIMIT_SECONDS - elapsed)

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
                group {{
                  id
                  title
                }}
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
        boards = data.get("boards", [])
        if not boards:
            raise RuntimeError(f"Board {board_id} not accessible")
        board = boards[0]
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
              group {{
                id
                title
              }}
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


class ShopifyRestClient:
    def __init__(self, store: str, token: str) -> None:
        self.store = store
        self.session = requests.Session()
        self.session.headers.update({"X-Shopify-Access-Token": token, "Content-Type": "application/json"})

    def fetch_all_products(self) -> list[dict[str, Any]]:
        url = f"{SHOPIFY_REST_URL}/products.json?limit=250"
        products: list[dict[str, Any]] = []
        while url:
            response = self.session.get(url, timeout=180)
            response.raise_for_status()
            payload = response.json()
            products.extend(payload.get("products", []))
            links = parse_link_header(response.headers.get("Link"))
            url = links.get("next")
        return products


def parse_gsc_markdown(path: Path) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    markdown = path.read_text(encoding="utf-8")
    page_rows = parse_markdown_table(section_block(markdown, "Top Repair Landing Pages"))
    query_map: dict[str, dict[str, str]] = {}
    for title in GSC_QUERY_SECTIONS:
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
    for variant in product.get("variants", []):
        price = parse_float(variant.get("price"))
        if price is not None:
            prices.append(price)
    if not prices:
        return None
    return min(prices)


def build_shopify_compare_price(product: dict[str, Any]) -> float | None:
    prices = []
    for variant in product.get("variants", []):
        compare_price = parse_float(variant.get("compare_at_price"))
        if compare_price is not None:
            prices.append(compare_price)
    if not prices:
        return None
    return min(prices)


def all_images_have_alt(product: dict[str, Any]) -> tuple[bool, int, int]:
    images = product.get("images") or []
    if not images:
        return False, 0, 0
    with_alt = 0
    for image in images:
        alt = (image.get("alt") or "").strip()
        if alt:
            with_alt += 1
    return with_alt == len(images), with_alt, len(images)


def seo_title_for_product(product: dict[str, Any]) -> str:
    return (product.get("metafields_global_title_tag") or "").strip()


def seo_description_for_product(product: dict[str, Any]) -> str:
    return (product.get("metafields_global_description_tag") or "").strip()


def score_shopify_match(monday_product: MondayProduct, shopify_product: dict[str, Any]) -> tuple[int, str]:
    product_label_norm = normalize(monday_product.label)
    monday_name_norm = normalize(monday_product.name)
    device_norm = normalize(monday_product.device)
    title_norm = normalize(shopify_product.get("title", ""))
    handle_norm = normalize((shopify_product.get("handle") or "").replace("-", " "))
    shopify_id = parse_shopify_numeric_id(shopify_product.get("id"))
    monday_id = re.sub(r"\D", "", monday_product.monday_shopify_id or "")

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

    monday_tokens = tokenize(monday_product.label)
    shopify_tokens = tokenize(f"{shopify_product.get('title', '')} {shopify_product.get('handle', '').replace('-', ' ')}")
    overlap = monday_tokens & shopify_tokens
    for token in overlap:
        if MODEL_CODE_RE.fullmatch(token):
            score += 15
        elif any(ch.isdigit() for ch in token):
            score += 8
        else:
            score += 2

    monday_kind = monday_product.repair_kind
    shopify_kind = classify_repair_kind(shopify_product.get("product_type", ""), shopify_product.get("title", ""))
    if monday_kind and monday_kind == shopify_kind:
        score += 15
        reasons.append("repair-kind")

    return score, "+".join(reasons) if reasons else "token-overlap"


def match_shopify_products(monday_products: list[MondayProduct], shopify_products: list[dict[str, Any]]) -> None:
    by_numeric_id = {
        parse_shopify_numeric_id(product.get("id")): product
        for product in shopify_products
        if parse_shopify_numeric_id(product.get("id"))
    }
    for monday_product in monday_products:
        numeric_id = re.sub(r"\D", "", monday_product.monday_shopify_id or "")
        if numeric_id and numeric_id in by_numeric_id:
            monday_product.matched_shopify = by_numeric_id[numeric_id]
            monday_product.match_method = "shopify-id"
            continue

        candidates: list[tuple[int, str, dict[str, Any]]] = []
        for shopify_product in shopify_products:
            score, reason = score_shopify_match(monday_product, shopify_product)
            if score > 0:
                candidates.append((score, reason, shopify_product))
        candidates.sort(key=lambda row: row[0], reverse=True)
        if not candidates:
            continue
        best_score, reason, best = candidates[0]
        second_score = candidates[1][0] if len(candidates) > 1 else -1
        if best_score >= 115 or (best_score >= 60 and best_score - second_score >= 15):
            monday_product.matched_shopify = best
            monday_product.match_method = reason


def match_product_from_query(monday_products: list[MondayProduct], query: str) -> MondayProduct | None:
    query_norm = normalize(query)
    query_tokens = tokenize(query)
    query_family = classify_device(query)
    query_kind = classify_repair_kind("", query)

    candidates: list[tuple[int, MondayProduct]] = []
    for product in monday_products:
        label = product.label
        label_norm = normalize(label)
        label_tokens = tokenize(label)
        if query_family != "Other" and classify_device(product.device) != query_family:
            continue
        if query_kind not in {"", "other"} and product.repair_kind and product.repair_kind != query_kind:
            if not (query_kind == "screen" and product.repair_kind in {"screen", "screen lines"}):
                continue

        overlap = label_tokens & query_tokens
        if not overlap:
            continue

        score = 0
        if label_norm and label_norm in query_norm:
            score += 12
        elif query_norm and query_norm in label_norm:
            score += 6
        for token in overlap:
            if MODEL_CODE_RE.fullmatch(token):
                score += 5
            elif any(ch.isdigit() for ch in token):
                score += 4
            else:
                score += 2
        if product.repair_kind == query_kind and product.repair_kind not in {"", "other"}:
            score += 6
        candidates.append((score, product))

    if not candidates:
        return None
    candidates.sort(key=lambda row: row[0], reverse=True)
    best_score, best_product = candidates[0]
    second_score = candidates[1][0] if len(candidates) > 1 else -1
    if best_score < 8 or (second_score >= 0 and best_score - second_score < 3):
        return None
    return best_product


def attach_gsc(monday_products: list[MondayProduct], page_rows: list[dict[str, str]], query_rows: list[dict[str, str]], shopify_by_handle: dict[str, dict[str, Any]]) -> None:
    for row in page_rows:
        page = row.get("Page", "").strip()
        handle = product_page_handle(page)
        if not handle:
            continue
        product = shopify_by_handle.get(handle)
        if not product:
            continue
        for monday_product in monday_products:
            if monday_product.matched_shopify is product:
                monday_product.gsc.direct_page_clicks += parse_float(row.get("Clicks")) or 0.0

    for row in query_rows:
        query = row.get("Query", "").strip()
        if not query:
            continue
        matched = match_product_from_query(monday_products, query)
        if not matched:
            continue
        clicks = parse_float(row.get("Clicks")) or 0.0
        impressions = parse_float(row.get("Impr.")) or parse_float(row.get("Impressions")) or 0.0
        position = parse_float(row.get("Pos.") or row.get("Position"))
        matched.gsc.clicks += clicks
        matched.gsc.impressions += impressions
        if position is not None:
            if matched.gsc.position is None or matched.gsc.impressions <= impressions:
                matched.gsc.position = position
            else:
                prior_impressions = max(matched.gsc.impressions - impressions, 0.0)
                total = prior_impressions + impressions
                if total > 0:
                    matched.gsc.position = ((matched.gsc.position * prior_impressions) + (position * impressions)) / total
        if query not in matched.gsc.queries:
            matched.gsc.queries.append(query)


def is_internal_placeholder(product: MondayProduct) -> bool:
    name = product.name.strip()
    if re.fullmatch(r"S\d+", name, re.I):
        return True
    if product.product_type in {"", "Not Set"} and product.monday_price_inc_vat is None and not product.monday_shopify_id:
        return True
    return False


def should_expect_shopify_listing(product: MondayProduct) -> bool:
    if is_internal_placeholder(product):
        return False
    if product.repair_kind == "aftermarket screen":
        return False
    return True


def old_device_flag(text: str) -> bool:
    lowered = normalize(text)
    old_patterns = [
        "iphone 6",
        "iphone 7",
        "iphone 8",
        "iphone x",
        "iphone xs",
        "iphone xr",
        "ipad 2",
        "ipad 3",
        "ipad 4",
        "watch series 3",
        "watch series 4",
        "watch series 5",
        "2012",
        "2013",
        "2014",
        "2015",
        "2016",
    ]
    return any(pattern in lowered for pattern in old_patterns)


def generation_label(device: str) -> str:
    lowered = normalize(device)
    family = classify_device(device)
    if family == "iPhone":
        if any(token in lowered for token in ["iphone 17", "iphone 16"]):
            return "current-gen"
        if any(token in lowered for token in ["iphone 15"]):
            return "previous-gen"
        return "older"
    if family == "MacBook":
        if any(token in lowered for token in ["m5", "m4", "neo"]):
            return "current-gen"
        if any(token in lowered for token in ["m3"]):
            return "previous-gen"
        return "older"
    if family == "iPad":
        if any(token in lowered for token in ["ipad air m4", "ipad pro m4", "ipad mini a17", "ipad a16"]):
            return "current-gen"
        if any(token in lowered for token in ["ipad air m3", "ipad air m2", "ipad pro m2", "ipad 10"]):
            return "previous-gen"
        return "older"
    if family == "Watch":
        if any(token in lowered for token in ["series 11", "ultra 3", "se 3"]):
            return "current-gen"
        if any(token in lowered for token in ["series 10", "ultra 2", "se 2", "series 9"]):
            return "previous-gen"
        return "older"
    return "unknown"


def missing_priority(product: MondayProduct) -> tuple[str, str]:
    generation = generation_label(product.device or product.group_title or product.name)
    has_price = (product.monday_price_inc_vat or 0) > 0
    has_repairs = product.completed_repairs > 0
    if generation == "current-gen" and has_price and has_repairs:
        return "critical", generation
    if generation == "current-gen" and has_price:
        return "high", generation
    if generation == "previous-gen" and has_price and has_repairs:
        return "medium", generation
    return "low", generation


def pricing_action(shopify_price: float | None, monday_price: float | None) -> str:
    if shopify_price is None and monday_price is not None:
        return "Set Shopify price to Monday value."
    if shopify_price is not None and monday_price is None:
        return "Add/verify Monday price."
    if shopify_price is None and monday_price is None:
        return "Set price in both systems."
    diff = (shopify_price or 0.0) - (monday_price or 0.0)
    if abs(diff) < 0.01:
        return "Price matches; add compare_at_price if merchandising wants a was/now anchor."
    return "Sync Shopify to Monday price source of truth."


def fmt_money(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    return f"GBP {value:,.2f}"


def fmt_num(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    if abs(value - round(value)) < 0.05:
        return str(int(round(value)))
    return f"{value:.1f}"


def evaluate_shopify_product(product: dict[str, Any], monday_match: MondayProduct | None) -> tuple[int, list[tuple[str, str, str, int]]]:
    title = (product.get("title") or "").strip()
    handle = (product.get("handle") or "").strip()
    description = strip_html(product.get("body_html"))
    description_len = len(description)
    image_count = len(product.get("images") or [])
    alt_ok, alt_with_text, alt_total = all_images_have_alt(product)
    product_type = (product.get("product_type") or "").strip()
    tags = [tag.strip() for tag in (product.get("tags") or "").split(",") if tag.strip()]
    seo_title = seo_title_for_product(product)
    seo_desc = seo_description_for_product(product)
    seo_title_len = len(seo_title)
    seo_desc_len = len(seo_desc)
    price = build_shopify_price(product)
    active = (product.get("status") or "").strip() == "active"
    repair_kind = classify_repair_kind(product_type, title)
    device_source = monday_match.device if monday_match else title
    device_norm = normalize(device_source)
    seo_title_norm = normalize(seo_title)
    seo_desc_norm = normalize(seo_desc)

    issues: list[tuple[str, str, str, int]] = []
    score = 100

    if description_len == 0:
        issues.append(("Missing description", "empty", "Write a full repair description with symptoms, turnaround, and trust signals.", 18))
        score -= 18
    elif description_len < 100:
        issues.append(("Thin description", f"{description_len} chars", "Expand the body copy to at least 200 useful characters.", 14))
        score -= 14
    elif description_len < 200:
        issues.append(("Thin content page", f"{description_len} chars", "Add more repair-detail copy; current body is thin for SEO.", 8))
        score -= 8

    if image_count == 0:
        issues.append(("No images", "0 images", "Add at least one primary product image.", 12))
        score -= 12
    elif not alt_ok:
        issues.append(("Missing image alt text", f"{alt_total - alt_with_text}/{alt_total} missing", "Populate alt text on every product image.", 7))
        score -= 7

    if not product_type:
        issues.append(("Missing product_type", "blank", "Set a consistent Shopify product_type.", 7))
        score -= 7

    if not tags:
        issues.append(("Missing tags", "blank", "Add repair-type tags to support filtering and internal ops.", 5))
        score -= 5

    if not seo_title:
        issues.append(("Missing SEO title", "blank", "Set a dedicated meta title with device + repair type.", 15))
        score -= 15
    else:
        if seo_title_len < 30 or seo_title_len > 60:
            issues.append(("SEO title length out of range", f"{seo_title_len} chars", "Keep meta title between 30 and 60 characters.", 6))
            score -= 6
        if device_norm and device_norm not in seo_title_norm:
            issues.append(("SEO title missing device name", seo_title, "Include the specific device model in the meta title.", 8))
            score -= 8
        if repair_kind not in {"", "other"} and repair_kind not in seo_title_norm:
            issues.append(("SEO title missing repair type", seo_title, "Include the repair type in the meta title.", 8))
            score -= 8

    if not seo_desc:
        issues.append(("Missing SEO description", "blank", "Set a meta description with repair benefit, location, and turnaround.", 15))
        score -= 15
    else:
        if seo_desc_len < 70 or seo_desc_len > 160:
            issues.append(("SEO description length out of range", f"{seo_desc_len} chars", "Keep meta description between 70 and 160 characters.", 6))
            score -= 6
        if "london" not in seo_desc_norm or "uk" not in seo_desc_norm:
            issues.append(("SEO description missing location terms", seo_desc, "Add London and UK signals to the meta description.", 7))
            score -= 7

    if handle != slugify(title):
        issues.append(("Handle inconsistent with title", handle, "Align the handle with the title slug unless there is a redirect-backed reason not to.", 4))
        score -= 4

    if price is None or price <= 0:
        issues.append(("Missing or zero price", fmt_money(price), "Set a valid selling price above zero.", 12))
        score -= 12

    if not active:
        issues.append(("Not active", product.get("status") or "unknown", "Publish the product or archive/delete it intentionally.", 10))
        score -= 10

    return max(score, 0), issues


def duplicate_title_groups(products: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for product in products:
        key = normalize(product.get("title", ""))
        if key:
            groups[key].append(product)
    return {key: items for key, items in groups.items() if len(items) > 1}


def build_report(shopify_products: list[dict[str, Any]], monday_products: list[MondayProduct], page_rows: list[dict[str, str]], query_rows: list[dict[str, str]]) -> str:
    shopify_by_handle = {(product.get("handle") or "").strip(): product for product in shopify_products}
    match_shopify_products(monday_products, shopify_products)
    attach_gsc(monday_products, page_rows, query_rows, shopify_by_handle)

    monday_by_shopify_id = {
        parse_shopify_numeric_id(product.matched_shopify.get("id")): product
        for product in monday_products
        if product.matched_shopify
    }

    duplicate_groups = duplicate_title_groups(shopify_products)

    status_counts = Counter((product.get("status") or "unknown").strip() for product in shopify_products)
    seo_distribution = Counter()
    compare_at_missing = 0

    issue_rows: list[dict[str, Any]] = []
    pricing_rows: list[dict[str, Any]] = []
    stale_rows: list[dict[str, Any]] = []
    quick_wins: list[dict[str, Any]] = []

    for product in shopify_products:
        shopify_id = parse_shopify_numeric_id(product.get("id"))
        monday_match = monday_by_shopify_id.get(shopify_id)
        seo_score, issues = evaluate_shopify_product(product, monday_match)
        if seo_score >= 80:
            seo_distribution["good"] += 1
        elif seo_score >= 50:
            seo_distribution["needs-work"] += 1
        else:
            seo_distribution["poor"] += 1

        title = (product.get("title") or "").strip()
        handle = (product.get("handle") or "").strip()
        direct_clicks = 0.0
        query_clicks = monday_match.gsc.clicks if monday_match else 0.0
        direct_page_clicks = monday_match.gsc.direct_page_clicks if monday_match else 0.0
        traffic_signal = max(query_clicks, direct_page_clicks, direct_clicks)
        value_signal = build_shopify_price(product) or (monday_match.monday_price_inc_vat if monday_match else 0.0) or 0.0

        if build_shopify_compare_price(product) is None:
            compare_at_missing += 1
            quick_wins.append(
                {
                    "kind": "compare-at",
                    "subject": title,
                    "action": f"Add compare_at_price to `{handle}`.",
                    "impact": (traffic_signal * 8) + (value_signal * 0.2) + 6,
                }
            )

        for issue, current_value, recommendation, severity in issues:
            issue_rows.append(
                {
                    "product": title,
                    "handle": handle,
                    "issue": issue,
                    "current_value": current_value,
                    "recommendation": recommendation,
                    "traffic": traffic_signal,
                    "severity": severity,
                }
            )
            quick_wins.append(
                {
                    "kind": "issue",
                    "subject": title,
                    "action": f"{issue} on `{handle}`: {recommendation}",
                    "impact": (traffic_signal * severity) + (value_signal * 0.15) + severity,
                }
            )

        dupes = duplicate_groups.get(normalize(title))
        if dupes:
            others = [item.get("handle", "") for item in dupes if parse_shopify_numeric_id(item.get("id")) != shopify_id]
            issue_rows.append(
                {
                    "product": title,
                    "handle": handle,
                    "issue": "Duplicate title",
                    "current_value": ", ".join(others[:5]) or title,
                    "recommendation": "Differentiate titles or consolidate duplicates.",
                    "traffic": traffic_signal,
                    "severity": 8,
                }
            )

        orphaned = monday_match is None
        is_old = old_device_flag(title)
        status = (product.get("status") or "").strip()
        if orphaned:
            issue = "No Monday product match"
            recommendation = "Link to a Monday product or archive/delete if retired."
            if is_old:
                issue = "Orphaned old-device listing"
                recommendation = "Review whether this legacy product still merits a live listing."
            stale_rows.append(
                {
                    "product": title,
                    "handle": handle,
                    "status": status,
                    "issue": issue,
                    "recommendation": recommendation,
                }
            )
        elif status in {"draft", "archived"}:
            action = "Publish if still sold; otherwise remove it from Monday or keep archived intentionally."
            if monday_match.completed_repairs > 0 and (monday_match.monday_price_inc_vat or 0) > 0:
                action = "This has price and repair history; publish unless intentionally withdrawn."
            stale_rows.append(
                {
                    "product": title,
                    "handle": handle,
                    "status": status,
                    "issue": "Inactive despite Monday match",
                    "recommendation": action,
                }
            )

        if monday_match:
            shopify_price = build_shopify_price(product)
            monday_price = monday_match.monday_price_inc_vat
            if shopify_price is None or monday_price is None or abs(shopify_price - monday_price) >= 0.01:
                difference = None if shopify_price is None or monday_price is None else shopify_price - monday_price
                pricing_rows.append(
                    {
                        "product": title,
                        "shopify_price": shopify_price,
                        "monday_price": monday_price,
                        "difference": difference,
                        "action": pricing_action(shopify_price, monday_price),
                    }
                )
                quick_wins.append(
                    {
                        "kind": "pricing",
                        "subject": title,
                        "action": f"Fix price mismatch on `{handle}`.",
                        "impact": (traffic_signal * 14) + (value_signal * 0.35) + 18,
                    }
                )

    missing_rows: list[dict[str, Any]] = []
    for monday_product in monday_products:
        if not should_expect_shopify_listing(monday_product):
            continue
        if monday_product.matched_shopify is not None:
            continue
        priority, generation = missing_priority(monday_product)
        reason_parts = []
        if (monday_product.monday_price_inc_vat or 0) > 0:
            reason_parts.append("price set on Monday")
        else:
            reason_parts.append("no Monday price")
        if monday_product.completed_repairs > 0:
            reason_parts.append(f"{monday_product.completed_repairs} completed repairs")
        else:
            reason_parts.append("no completed repair history")
        if generation == "current-gen":
            reason_parts.append("current-gen device family")
        missing_rows.append(
            {
                "monday_product": monday_product.name,
                "device": monday_product.device or monday_product.group_title or monday_product.name,
                "price": monday_product.monday_price_inc_vat,
                "completed_repairs": monday_product.completed_repairs,
                "generation": generation,
                "priority": priority,
                "reason": ", ".join(reason_parts),
                "impact": (
                    {"critical": 220, "high": 160, "medium": 110, "low": 40}[priority]
                    + ((monday_product.monday_price_inc_vat or 0) * 0.25)
                    + (min(monday_product.completed_repairs, 5) * 6)
                    + (monday_product.gsc.clicks * 10)
                ),
            }
        )
        quick_wins.append(
            {
                "kind": "missing",
                "subject": monday_product.label,
                "action": f"Create/publish Shopify listing for `{monday_product.label}`.",
                "impact": missing_rows[-1]["impact"],
            }
        )

    pricing_match_denominator = 0
    pricing_match_numerator = 0
    for monday_product in monday_products:
        if not monday_product.matched_shopify:
            continue
        pricing_match_denominator += 1
        shopify_price = build_shopify_price(monday_product.matched_shopify)
        monday_price = monday_product.monday_price_inc_vat
        if shopify_price is not None and monday_price is not None and abs(shopify_price - monday_price) < 0.01:
            pricing_match_numerator += 1

    pricing_match_pct = (pricing_match_numerator / pricing_match_denominator * 100.0) if pricing_match_denominator else 0.0

    issue_rows.sort(key=lambda row: (-row["traffic"], -row["severity"], row["product"].lower(), row["issue"].lower()))
    pricing_rows.sort(key=lambda row: (-(abs(row["difference"]) if row["difference"] is not None else 9999), row["product"].lower()))
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    missing_rows.sort(key=lambda row: (priority_order[row["priority"]], -row["completed_repairs"], -(row["price"] or 0.0), row["device"].lower(), row["monday_product"].lower()))
    stale_rows.sort(key=lambda row: (row["status"] != "active", row["product"].lower(), row["handle"].lower()))
    quick_wins.sort(key=lambda row: row["impact"], reverse=True)

    issue_table = markdown_table(
        ["Product", "Handle", "Issue", "Current Value", "Recommended Action"],
        [
            [
                escape_md(row["product"]),
                escape_md(row["handle"]),
                escape_md(row["issue"]),
                escape_md(row["current_value"]),
                escape_md(row["recommendation"]),
            ]
            for row in issue_rows
        ] or [["No issues found", "-", "-", "-", "-"]],
    )

    pricing_table = markdown_table(
        ["Product", "Shopify Price", "Monday Price", "Difference", "Action"],
        [
            [
                escape_md(row["product"]),
                fmt_money(row["shopify_price"]),
                fmt_money(row["monday_price"]),
                fmt_money(row["difference"]),
                escape_md(row["action"]),
            ]
            for row in pricing_rows
        ] or [["No mismatches found", "-", "-", "-", "-"]],
    )

    missing_table = markdown_table(
        ["Monday Product", "Device", "Price", "Completed Repairs", "Generation", "Priority", "Reason"],
        [
            [
                escape_md(row["monday_product"]),
                escape_md(row["device"]),
                fmt_money(row["price"]),
                str(row["completed_repairs"]),
                escape_md(row["generation"]),
                escape_md(row["priority"]),
                escape_md(row["reason"]),
            ]
            for row in missing_rows
        ] or [["None", "-", "-", "-", "-", "-", "-"]],
    )

    stale_table = markdown_table(
        ["Product", "Handle", "Status", "Issue", "Recommendation"],
        [
            [
                escape_md(row["product"]),
                escape_md(row["handle"]),
                escape_md(row["status"]),
                escape_md(row["issue"]),
                escape_md(row["recommendation"]),
            ]
            for row in stale_rows
        ] or [["None", "-", "-", "-", "-"]],
    )

    quick_wins_table = markdown_table(
        ["Rank", "Fix", "Impact Score"],
        [
            [str(idx + 1), escape_md(row["action"]), fmt_num(row["impact"])]
            for idx, row in enumerate(quick_wins[:20])
        ] or [["1", "No quick wins identified", "0"]],
    )

    lines = [
        "# Shopify Product Listing Health Audit",
        "",
        "Generated on: " + iso_now(),
        "",
        "## Section 1: Summary",
        f"- Total Shopify products: `{len(shopify_products)}`",
        f"- Active vs draft vs archived: `active={status_counts.get('active', 0)}`, `draft={status_counts.get('draft', 0)}`, `archived={status_counts.get('archived', 0)}`",
        f"- SEO score distribution: `good={seo_distribution.get('good', 0)}`, `needs-work={seo_distribution.get('needs-work', 0)}`, `poor={seo_distribution.get('poor', 0)}`",
        f"- Pricing match rate with Monday: `{pricing_match_numerator}/{pricing_match_denominator}` matched products ({pricing_match_pct:.1f}%)",
        f"- Shopify products without any `compare_at_price`: `{compare_at_missing}`",
        f"- Monday products expected on Shopify but missing: `{len(missing_rows)}`",
        f"- Shopify orphan/dead/stale listings flagged: `{len(stale_rows)}`",
        "",
        "Method notes:",
        "- Shopify data was pulled read-only from the Admin REST API.",
        "- Monday linkage uses the Products & Pricing board plus completed main-board repairs linked directly or via parts.",
        "- GSC demand weighting uses the existing markdown file's repair-query tables; direct product-page clicks were sparse.",
        "- Generation labels use current lineup-aware heuristics; the brief's explicit iPhone 16-series priority was preserved in the rules alongside newer Mac/iPad/Watch families.",
        "",
        "## Section 2: SEO Issues",
        issue_table,
        "",
        "## Section 3: Pricing Mismatches",
        pricing_table,
        "",
        f"Additional pricing note: `{compare_at_missing}` Shopify products have no `compare_at_price` set.",
        "",
        "## Section 4: Missing From Shopify",
        missing_table,
        "",
        "## Section 5: Dead/Stale Listings",
        stale_table,
        "",
        "## Section 6: Quick Wins",
        quick_wins_table,
        "",
    ]
    return "\n".join(lines)


def load_monday_products(products_bundle: BoardBundle, parts_bundle: BoardBundle, main_bundle: BoardBundle) -> list[MondayProduct]:
    reverse_product_to_parts: dict[str, list[str]] = defaultdict(list)
    for item in parts_bundle.items:
        cols = column_map(item)
        part_id = str(item["id"])
        for product_id in relation_ids(cols.get("link_to_products___pricing")):
            reverse_product_to_parts[product_id].append(part_id)

    product_to_all_parts: dict[str, set[str]] = {}
    part_to_products: dict[str, set[str]] = defaultdict(set)
    for item in products_bundle.items:
        cols = column_map(item)
        product_id = str(item["id"])
        direct_part_ids = relation_ids(cols.get("connect_boards8"))
        reverse_part_ids = reverse_product_to_parts.get(product_id, [])
        all_part_ids = set(direct_part_ids + reverse_part_ids)
        product_to_all_parts[product_id] = all_part_ids
        for part_id in all_part_ids:
            part_to_products[part_id].add(product_id)

    repair_ids_by_product: dict[str, set[str]] = defaultdict(set)
    for item in main_bundle.items:
        cols = column_map(item)
        status = (cols.get("status4", {}).get("text") or "").strip()
        repair_type = (cols.get("status24", {}).get("text") or "").strip()
        client_type = (cols.get("status", {}).get("text") or "").strip()
        if status not in COMPLETED_STATUSES:
            continue
        if repair_type in REPAIR_TYPE_EXCLUDE:
            continue
        if repair_type not in {"Repair", "Board Level", ""} and client_type != "Refurb":
            continue
        repair_id = str(item["id"])
        product_ids = relation_ids(cols.get("board_relation")) + relation_ids(cols.get("board_relation0"))
        part_ids = relation_ids(cols.get("connect_boards__1"))
        for product_id in dict.fromkeys(product_ids):
            repair_ids_by_product[product_id].add(repair_id)
        for part_id in part_ids:
            for product_id in part_to_products.get(part_id, set()):
                repair_ids_by_product[product_id].add(repair_id)

    monday_products: list[MondayProduct] = []
    for item in products_bundle.items:
        cols = column_map(item)
        product_id = str(item["id"])
        device = relation_display(cols.get("link_to_devices6")) or (item.get("group") or {}).get("title", "") or item["name"]
        part_ids = relation_ids(cols.get("connect_boards8")) + reverse_product_to_parts.get(product_id, [])
        monday_products.append(
            MondayProduct(
                item_id=product_id,
                name=item["name"],
                device=device,
                product_type=(cols.get("status3", {}).get("text") or "").strip(),
                monday_price_inc_vat=parse_float(cols.get("numbers", {}).get("text")),
                monday_price_ex_vat=parse_float(cols.get("formula", {}).get("text")),
                monday_shopify_id=(cols.get("text_mkzdte13", {}).get("text") or "").strip(),
                part_ids=list(dict.fromkeys(product_to_all_parts.get(product_id, set()))),
                repair_kind=classify_repair_kind((cols.get("status3", {}).get("text") or "").strip(), item["name"]),
                group_title=(item.get("group") or {}).get("title", ""),
                completed_repairs=len(repair_ids_by_product.get(product_id, set())),
            )
        )
    return monday_products


def main() -> None:
    env = parse_env(ENV_PATH)
    monday = MondayClient(env["MONDAY_APP_TOKEN"])
    shopify = ShopifyRestClient(env["SHOPIFY_STORE"], env["SHOPIFY_ACCESS_TOKEN"])

    shopify_products = shopify.fetch_all_products()
    products_bundle = monday.fetch_board(PRODUCTS_BOARD_ID, PRODUCT_COLUMNS)
    parts_bundle = monday.fetch_board(PARTS_BOARD_ID, PART_COLUMNS)
    main_bundle = monday.fetch_board(MAIN_BOARD_ID, MAIN_COLUMNS)
    page_rows, query_rows = parse_gsc_markdown(GSC_PATH)
    monday_products = load_monday_products(products_bundle, parts_bundle, main_bundle)
    report = build_report(shopify_products, monday_products, page_rows, query_rows)
    OUTPUT_PATH.write_text(report, encoding="utf-8")
    print(f"wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
