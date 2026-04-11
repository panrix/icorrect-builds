from __future__ import annotations

import json
import math
import os
import re
import sys
import time
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests


WORKDIR = Path("/home/ricky/builds/system-audit-2026-03-31")
OUTFILE = WORKDIR / "gsc-repair-profit-rankings.md"
ENVFILE = Path("/home/ricky/config/api-keys/.env")

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GSC_URL_TMPL = "https://www.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query"
MONDAY_URL = "https://api.monday.com/v2"

LABOUR_RATE_PER_HOUR = 24.0
PAYMENT_FEE_RATE = 0.02
HEALTHY_MARGIN = 0.70
LOW_STOCK_THRESHOLD = 2.0

REPAIR_PATTERNS = [
    r"\brepair\b",
    r"\bfix\b",
    r"\bscreen\b",
    r"\bbattery\b",
    r"\breplacement\b",
    r"\breplace\b",
    r"\bbroken\b",
    r"\bcracked\b",
    r"\bglass\b",
    r"\bdisplay\b",
    r"\blcd\b",
    r"\boled\b",
    r"\bdigitizer\b",
    r"\bcharging\b",
    r"\bcharger\b",
    r"\bcharge port\b",
    r"\bport\b",
    r"\bface id\b",
    r"\bkeyboard\b",
    r"\btrackpad\b",
    r"\bcamera\b",
    r"\bspeaker\b",
    r"\bmicrophone\b",
    r"\bmic\b",
    r"\bwater damage\b",
    r"\bdata recovery\b",
    r"\bback glass\b",
    r"\bdiagnostic\b",
]
REPAIR_REGEX = re.compile("|".join(REPAIR_PATTERNS), re.I)
TOKEN_RE = re.compile(r"[a-z0-9]+")
STOPWORDS = {
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
class Product:
    item_id: str
    group_title: str
    name: str
    product_type: str
    price_inc_vat: float | None
    price_ex_vat: float | None
    labour_minutes: float | None
    part_ids: set[str]
    device_name: str
    model_tokens: set[str]
    specific_model_tokens: set[str]
    match_label: str
    margin_pct: float | None = None
    net_profit: float | None = None
    stock_status: str = "Unknown"
    parts_cost: float = 0.0


def parse_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip("'").strip('"')
    return env


def normalize(text: str) -> str:
    text = text.lower()
    text = text.replace("&", " and ")
    return " ".join(TOKEN_RE.findall(text))


def tokenize(text: str) -> set[str]:
    return set(normalize(text).split())


def parse_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if not text:
        return None
    text = re.sub(r"[^0-9.\-]", "", text)
    if not text or text in {"-", ".", "-."}:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def money(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    return f"GBP {value:,.2f}"


def pct(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    return f"{value * 100:.1f}%"


def num(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    if abs(value - round(value)) < 0.05:
        return str(int(round(value)))
    return f"{value:.1f}"


def delta_num(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    sign = "+" if value > 0 else ""
    if abs(value - round(value)) < 0.05:
        return f"{sign}{int(round(value))}"
    return f"{sign}{value:.1f}"


def escape_md(text: str) -> str:
    return text.replace("|", "\\|")


def is_repair_query(query: str) -> bool:
    return bool(REPAIR_REGEX.search(query or ""))


def classify_repair_type(text: str) -> str:
    t = normalize(text)
    tokens = set(t.split())
    if "back glass" in t:
        return "back glass"
    if "face id" in t:
        return "face id"
    if ("charge" in tokens and "port" in tokens) or ("charging" in tokens and "port" in tokens):
        return "charging port"
    if "data recovery" in t:
        return "data recovery"
    if "water damage" in t:
        return "water damage"
    if "logic" in tokens and "board" in tokens:
        return "logic board"
    if "trackpad" in tokens:
        return "trackpad"
    if "keyboard" in tokens:
        return "keyboard"
    if "battery" in tokens:
        return "battery"
    if any(term in tokens for term in ("screen", "display", "lcd", "oled", "digitizer")) or ("glass" in tokens and "back" not in tokens):
        return "screen"
    if "camera" in tokens:
        return "camera"
    if "speaker" in tokens:
        return "speaker"
    if "microphone" in tokens or "mic" in tokens:
        return "microphone"
    if "diagnostic" in tokens:
        return "diagnostic"
    if any(term in tokens for term in ("repair", "fix", "replacement", "replace")):
        return "general repair"
    return "other"


def device_family(text: str) -> str:
    t = normalize(text)
    tokens = set(t.split())
    if "iphone" in tokens:
        return "iphone"
    if "ipad" in tokens:
        return "ipad"
    if "macbook" in tokens:
        return "macbook"
    if "apple watch" in t or "iwatch" in tokens or ("apple" in tokens and "watch" in tokens):
        return "apple watch"
    if "imac" in tokens:
        return "imac"
    if "mac" in tokens:
        return "mac"
    return ""


def load_google_access_token(env: dict[str, str]) -> str:
    response = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "client_id": env["GOOGLE_CLIENT_ID"],
            "client_secret": env["GOOGLE_CLIENT_SECRET"],
            "refresh_token": env["EDGE_GOOGLE_REFRESH_TOKEN"],
            "grant_type": "refresh_token",
        },
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()
    if "access_token" not in payload:
        raise RuntimeError(f"Google token exchange failed: {payload}")
    return payload["access_token"]


def gsc_request(access_token: str, site_url: str, payload: dict[str, Any]) -> dict[str, Any]:
    url = GSC_URL_TMPL.format(site=quote(site_url, safe=""))
    response = requests.post(
        url,
        headers={"Authorization": f"Bearer {access_token}"},
        json=payload,
        timeout=120,
    )
    if response.status_code >= 400:
        raise requests.HTTPError(f"{response.status_code} {response.text}", response=response)
    return response.json()


def gsc_fetch_rows(
    access_token: str,
    site_url: str,
    start_date: date,
    end_date: date,
    dimensions: list[str],
    row_limit: int = 25000,
    max_rows: int | None = None,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    start_row = 0
    target_rows = max_rows or row_limit
    while True:
        payload = {
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "dimensions": dimensions,
            "rowLimit": min(row_limit, target_rows - len(rows)),
            "startRow": start_row,
        }
        data = gsc_request(access_token, site_url, payload)
        batch = data.get("rows", [])
        if not batch:
            break
        rows.extend(batch)
        if len(rows) >= target_rows or len(batch) < payload["rowLimit"]:
            break
        start_row += payload["rowLimit"]
    return rows


def monday_request(env: dict[str, str], query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
    response = requests.post(
        MONDAY_URL,
        headers={
            "Authorization": env["MONDAY_APP_TOKEN"],
            "Content-Type": "application/json",
            "API-Version": "2026-01",
        },
        json={"query": query, "variables": variables or {}},
        timeout=120,
    )
    response.raise_for_status()
    data = response.json()
    if data.get("errors"):
        raise RuntimeError(data["errors"])
    return data["data"]


def monday_fetch_board_items(env: dict[str, str], board_id: int, column_ids: list[str], limit: int = 200) -> list[dict[str, Any]]:
    quoted_ids = ", ".join(json.dumps(col) for col in column_ids)
    item_fragment = f"""
    id
    name
    group {{ title }}
    column_values(ids: [{quoted_ids}]) {{
      id
      text
      type
      value
      ... on BoardRelationValue {{
        linked_item_ids
      }}
    }}
    """
    first_query = f"""
    query ($board_id: [ID!], $limit: Int!) {{
      boards(ids: $board_id) {{
        items_page(limit: $limit) {{
          cursor
          items {{
            {item_fragment}
          }}
        }}
      }}
    }}
    """
    next_query = f"""
    query ($cursor: String!, $limit: Int!) {{
      next_items_page(cursor: $cursor, limit: $limit) {{
        cursor
        items {{
          {item_fragment}
        }}
      }}
    }}
    """
    data = monday_request(env, first_query, {"board_id": [board_id], "limit": limit})
    page = data["boards"][0]["items_page"]
    items = list(page["items"])
    cursor = page.get("cursor")
    seen_cursors: set[str] = set()
    while cursor:
        if cursor in seen_cursors:
            break
        seen_cursors.add(cursor)
        time.sleep(1.05)
        data = monday_request(env, next_query, {"cursor": cursor, "limit": limit})
        page = data["next_items_page"]
        items.extend(page["items"])
        cursor = page.get("cursor")
    return items


def column_map(item: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {col["id"]: col for col in item.get("column_values", [])}


def render_report(state: dict[str, Any]) -> None:
    lines: list[str] = []
    lines.append("# GSC Rankings x Repair Profit Potential")
    lines.append("")
    lines.append(f"Status: {state.get('status', 'in progress')}")
    lines.append("")
    lines.append("Generated on: 2026-04-02 UTC")
    lines.append("")
    if state.get("method"):
        lines.append("## Method")
        lines.extend(state["method"])
        lines.append("")
    if state.get("snapshots"):
        lines.append("## Snapshot")
        lines.extend(state["snapshots"])
        lines.append("")
    if state.get("landing_pages"):
        lines.append("## Top Repair Landing Pages")
        lines.append("")
        lines.append("| Page | Clicks | Impressions | CTR | Position |")
        lines.append("| --- | ---: | ---: | ---: | ---: |")
        for row in state["landing_pages"]:
            lines.append(
                f"| {escape_md(row['page'])} | {num(row['clicks'])} | {num(row['impressions'])} | "
                f"{pct(row['ctr'])} | {num(row['position'])} |"
            )
        lines.append("")
    for section in ("top_clicks", "fastest_climbing", "striking_distance"):
        if not state.get(section):
            continue
        title = {
            "top_clicks": "## Top 20 Repair Queries By Click Volume",
            "fastest_climbing": "## Top 20 Fastest-Climbing Repair Queries",
            "striking_distance": "## Top 20 Striking-Distance Queries",
        }[section]
        lines.append(title)
        lines.append("")
        lines.append(
            "| Query | Clicks | Impr. | CTR | Pos. | Pos. change | Demand change | Matched product | Price | Margin | Stock status |"
        )
        lines.append("| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | --- |")
        for row in state[section]:
            lines.append(
                f"| {escape_md(row['query'])} | {num(row['clicks'])} | {num(row['impressions'])} | {pct(row['ctr'])} | "
                f"{num(row['position'])} | {row['position_change_text']} | {escape_md(row['demand_change_text'])} | "
                f"{escape_md(row['matched_product'])} | {money(row['price'])} | {pct(row['margin'])} | {escape_md(row['stock_status'])} |"
            )
        lines.append("")
    if state.get("recommendations"):
        lines.append("## Prepare Stock For These Repairs")
        lines.append("")
        for rec in state["recommendations"]:
            lines.append(f"- {rec}")
        lines.append("")
    if state.get("notes"):
        lines.append("## Notes")
        lines.append("")
        for note in state["notes"]:
            lines.append(f"- {note}")
        lines.append("")
    OUTFILE.write_text("\n".join(lines).rstrip() + "\n")


def choose_site_property(access_token: str) -> str:
    candidates = ["sc-domain:icorrect.co.uk", "https://www.icorrect.co.uk/"]
    probe_start = date(2026, 3, 1)
    probe_end = date(2026, 3, 7)
    last_error: Exception | None = None
    for site_url in candidates:
        try:
            gsc_fetch_rows(access_token, site_url, probe_start, probe_end, ["query"], row_limit=1)
            return site_url
        except Exception as exc:  # pragma: no cover - live API fallback
            last_error = exc
    raise RuntimeError(f"No GSC property worked: {last_error}")


def aggregate_query_page(rows: list[dict[str, Any]]) -> tuple[dict[str, str], list[dict[str, Any]]]:
    top_page_by_query: dict[str, tuple[float, float, str]] = {}
    page_stats: dict[str, dict[str, float]] = defaultdict(lambda: {"clicks": 0.0, "impressions": 0.0, "ctr_num": 0.0, "pos_num": 0.0})
    for row in rows:
        query, page = row["keys"]
        clicks = float(row.get("clicks", 0))
        impressions = float(row.get("impressions", 0))
        position = float(row.get("position", 0))
        current = top_page_by_query.get(query)
        if current is None or clicks > current[0] or (clicks == current[0] and impressions > current[1]):
            top_page_by_query[query] = (clicks, impressions, page)
        if page:
            page_stats[page]["clicks"] += clicks
            page_stats[page]["impressions"] += impressions
            page_stats[page]["ctr_num"] += clicks
            page_stats[page]["pos_num"] += position * impressions
    pages: list[dict[str, Any]] = []
    for page, stats in page_stats.items():
        impressions = stats["impressions"]
        if impressions <= 0:
            continue
        clicks = stats["clicks"]
        pages.append(
            {
                "page": page,
                "clicks": clicks,
                "impressions": impressions,
                "ctr": clicks / impressions,
                "position": stats["pos_num"] / impressions,
            }
        )
    pages.sort(key=lambda r: (-r["clicks"], -r["impressions"]))
    return {query: page for query, (_, _, page) in top_page_by_query.items()}, pages


def build_products(product_items: list[dict[str, Any]], parts_by_product: dict[str, set[str]]) -> dict[str, Product]:
    products: dict[str, Product] = {}
    for item in product_items:
        cols = column_map(item)
        group_title = item.get("group", {}).get("title") or ""
        device_name = group_title or item["name"]
        product_type_text = cols.get("status3", {}).get("text") or ""
        price_inc = parse_float(cols.get("numbers", {}).get("text"))
        price_ex = parse_float(cols.get("formula", {}).get("text"))
        if price_ex is None and price_inc is not None:
            price_ex = price_inc / 1.2
        labour_minutes = parse_float(cols.get("numbers7", {}).get("text"))
        if labour_minutes is None:
            labour_minutes = parse_float(cols.get("numeric", {}).get("text"))
        direct_part_ids = set(cols.get("connect_boards8", {}).get("linked_item_ids") or [])
        all_part_ids = direct_part_ids | parts_by_product.get(str(item["id"]), set())
        label = f"{device_name} {product_type_text or item['name']}".strip()
        model_tokens = {
            token
            for token in tokenize(f"{device_name} {item['name']}")
            if token not in STOPWORDS
        }
        specific_tokens = {
            token
            for token in model_tokens
            if token not in GENERIC_DEVICE_TOKENS and len(token) > 1
        }
        products[str(item["id"])] = Product(
            item_id=str(item["id"]),
            group_title=group_title,
            name=item["name"],
            product_type=product_type_text or classify_repair_type(item["name"]),
            price_inc_vat=price_inc,
            price_ex_vat=price_ex,
            labour_minutes=labour_minutes,
            part_ids=all_part_ids,
            device_name=device_name,
            model_tokens=model_tokens,
            specific_model_tokens=specific_tokens,
            match_label=label,
        )
    return products


def enrich_products(products: dict[str, Product], parts: dict[str, dict[str, Any]]) -> None:
    for product in products.values():
        linked_parts = [parts[part_id] for part_id in product.part_ids if part_id in parts]
        parts_cost = sum(part["supply_price"] or 0.0 for part in linked_parts)
        labour_minutes = product.labour_minutes or 0.0
        extra_refurb = 60.0 if "iphone" in normalize(product.device_name) and classify_repair_type(product.match_label) == "screen" else 0.0
        labour_cost = ((labour_minutes + extra_refurb) / 60.0) * LABOUR_RATE_PER_HOUR
        processing_fee = (product.price_inc_vat or 0.0) * PAYMENT_FEE_RATE
        if product.price_ex_vat is not None:
            net_profit = product.price_ex_vat - parts_cost - labour_cost - processing_fee
            margin_pct = net_profit / product.price_ex_vat if product.price_ex_vat else None
        else:
            net_profit = None
            margin_pct = None
        product.parts_cost = parts_cost
        product.net_profit = net_profit
        product.margin_pct = margin_pct
        if not product.part_ids:
            product.stock_status = "No linked part"
            continue
        availabilities = []
        missing_stock = False
        for part in linked_parts:
            available = part["available_stock"]
            total = part["total_stock"]
            if available is None and total is None:
                missing_stock = True
                continue
            availabilities.append(available if available is not None else total)
        if not linked_parts:
            product.stock_status = "No linked part"
        elif any(av is not None and av <= 0 for av in availabilities):
            product.stock_status = "Out of stock"
        elif any(av is not None and av <= LOW_STOCK_THRESHOLD for av in availabilities):
            min_av = min(av for av in availabilities if av is not None)
            product.stock_status = f"Low stock (min avail {num(min_av)})"
        elif missing_stock:
            product.stock_status = "Stock unknown"
        else:
            min_av = min(av for av in availabilities if av is not None) if availabilities else None
            product.stock_status = f"In stock (min avail {num(min_av)})" if min_av is not None else "In stock"


def match_product(query: str, landing_page: str, products: dict[str, Product]) -> Product | None:
    query_norm = normalize(query)
    query_tokens = tokenize(query)
    repair_type = classify_repair_type(query)
    query_family = device_family(query)
    query_specific_tokens = {token for token in query_tokens if token not in STOPWORDS and token not in GENERIC_DEVICE_TOKENS}
    candidates: list[tuple[int, int, Product]] = []
    for product in products.values():
        product_repair_type = classify_repair_type(f"{product.product_type} {product.name}")
        product_family = device_family(f"{product.device_name} {product.name}")
        if query_family and product_family and query_family != product_family:
            continue
        if repair_type not in {"other", "general repair"} and product_repair_type != repair_type:
            continue
        score = 0
        specific_matches = 0
        for token in product.model_tokens:
            if token in query_tokens:
                if token in product.specific_model_tokens:
                    specific_matches += 1
                    score += 3 if any(ch.isdigit() for ch in token) or token.startswith("a") else 2
                else:
                    score += 1
        if repair_type == product_repair_type and repair_type != "other":
            score += 3
        product_label_norm = normalize(product.match_label)
        if product_label_norm and product_label_norm in query_norm:
            score += 6
        elif query_norm and query_norm in product_label_norm:
            score += 2
        if landing_page and normalize(product.device_name).replace(" ", "-") in landing_page:
            score += 1
        if query_specific_tokens and specific_matches == 0:
            continue
        if score > 0:
            candidates.append((score, specific_matches, product))
    if not candidates:
        return None
    candidates.sort(key=lambda item: (item[0], item[1], item[2].price_inc_vat or 0.0), reverse=True)
    best_score, best_specific, best_product = candidates[0]
    if best_score < 5:
        return None
    if best_specific == 0 and classify_repair_type(query) in {"battery", "screen", "general repair"}:
        return None
    if len(candidates) > 1:
        second_score, second_specific, _ = candidates[1]
        if best_score == second_score and best_specific == second_specific:
            return None
        if best_score - second_score < 2 and best_specific <= second_specific:
            return None
    return best_product


def build_query_rows(
    current_rows: list[dict[str, Any]],
    previous_rows: list[dict[str, Any]],
    landing_pages_by_query: dict[str, str],
    products: dict[str, Product],
) -> list[dict[str, Any]]:
    current_by_query = {row["keys"][0]: row for row in current_rows if row.get("keys")}
    previous_by_query = {row["keys"][0]: row for row in previous_rows if row.get("keys")}
    queries = set(current_by_query) | set(previous_by_query)
    final_rows: list[dict[str, Any]] = []
    for query in queries:
        if not is_repair_query(query):
            continue
        current = current_by_query.get(query)
        previous = previous_by_query.get(query)
        clicks = float(current.get("clicks", 0)) if current else 0.0
        impressions = float(current.get("impressions", 0)) if current else 0.0
        ctr = float(current.get("ctr", 0)) if current else 0.0
        position = float(current.get("position", 0)) if current and current.get("impressions", 0) else None
        prev_clicks = float(previous.get("clicks", 0)) if previous else 0.0
        prev_impressions = float(previous.get("impressions", 0)) if previous else 0.0
        prev_position = float(previous.get("position", 0)) if previous and previous.get("impressions", 0) else None
        position_change = None
        if position is not None and prev_position is not None:
            position_change = prev_position - position
        landing_page = landing_pages_by_query.get(query, "")
        product = match_product(query, landing_page, products)
        matched_product = product.match_label if product else "No confident SKU match"
        final_rows.append(
            {
                "query": query,
                "clicks": clicks,
                "impressions": impressions,
                "ctr": ctr,
                "position": position,
                "position_change": position_change,
                "position_change_text": delta_num(position_change) if position_change is not None else "New / no prior",
                "click_change": clicks - prev_clicks,
                "impression_change": impressions - prev_impressions,
                "demand_change_text": f"{delta_num(clicks - prev_clicks)} clicks / {delta_num(impressions - prev_impressions)} impr.",
                "matched_product": matched_product,
                "price": product.price_inc_vat if product else None,
                "margin": product.margin_pct if product else None,
                "stock_status": product.stock_status if product else "Unknown",
                "landing_page": landing_page or "n/a",
                "product": product,
                "prev_clicks": prev_clicks,
                "prev_impressions": prev_impressions,
            }
        )
    return final_rows


def summarise_recommendations(rows: list[dict[str, Any]]) -> list[str]:
    def is_rising(row: dict[str, Any]) -> bool:
        return (
            row["click_change"] > 0
            or row["impression_change"] > 0
            or (row["position_change"] or 0) > 1
        )

    urgent = [
        row for row in rows
        if row["product"]
        and is_rising(row)
        and row["product"].margin_pct is not None
        and row["product"].margin_pct >= HEALTHY_MARGIN
        and (
            row["stock_status"] in {"Out of stock", "No linked part"}
            or str(row["stock_status"]).startswith("Low stock")
        )
    ]
    urgent.sort(
        key=lambda row: (
            row["clicks"],
            row["impression_change"],
            row["position_change"] or -999,
            row["product"].margin_pct if row["product"] else -1,
        ),
        reverse=True,
    )
    keep_warm = [
        row for row in rows
        if row["product"]
        and is_rising(row)
        and row["product"].margin_pct is not None
        and row["product"].margin_pct >= HEALTHY_MARGIN
        and row["stock_status"].startswith("In stock")
    ]
    keep_warm.sort(key=lambda row: (row["clicks"], row["impression_change"], row["position_change"] or -999), reverse=True)
    recs: list[str] = []
    for row in urgent[:8]:
        product = row["product"]
        recs.append(
            f"Urgent: `{row['query']}` is rising ({row['demand_change_text']}, position change {row['position_change_text']}) and maps to "
            f"`{product.match_label}` at {money(product.price_inc_vat)} with {pct(product.margin_pct)} margin, but stock status is `{row['stock_status']}`."
        )
    for row in keep_warm[:5]:
        product = row["product"]
        recs.append(
            f"Buffer stock: `{row['query']}` is rising and already profitable on `{product.match_label}` ({money(product.price_inc_vat)}, {pct(product.margin_pct)} margin); "
            f"current status is `{row['stock_status']}`."
        )
    return recs


def main() -> None:
    env = parse_env(ENVFILE)

    today = date(2026, 4, 2)
    last_complete_day = today - timedelta(days=1)
    recent_start = last_complete_day - timedelta(days=29)
    recent_end = last_complete_day
    prior_end = recent_start - timedelta(days=1)
    prior_start = prior_end - timedelta(days=29)
    last_90_start = last_complete_day - timedelta(days=89)

    state: dict[str, Any] = {
        "status": "in progress",
        "method": [
            f"- GSC property preference: `sc-domain:icorrect.co.uk`, with fallback to `https://www.icorrect.co.uk/` if needed.",
            f"- Reporting windows: last 90 days `{last_90_start.isoformat()}` to `{last_complete_day.isoformat()}`; current comparison window `{recent_start.isoformat()}` to `{recent_end.isoformat()}`; prior comparison window `{prior_start.isoformat()}` to `{prior_end.isoformat()}`.",
            "- Repair queries were filtered by repair-intent terms such as repair, screen, battery, replacement, broken, glass, display, charging, keyboard, camera, and diagnostic.",
            "- `repair-profitability-model.md` was not present, so price, margin, and stock status were derived live from Monday boards `2477699024` and `985177480`.",
            "- Margin model used the board prices, linked parts supply prices, configured labour minutes, GBP 24/hour labour, a 2% blended payment fee, and an extra 60 minutes refurbishment labour for iPhone screen repairs.",
        ],
    }
    render_report(state)
    print("initial report written", file=sys.stderr, flush=True)

    access_token = load_google_access_token(env)
    site_property = choose_site_property(access_token)
    print(f"gsc property: {site_property}", file=sys.stderr, flush=True)

    current_query_rows = gsc_fetch_rows(access_token, site_property, recent_start, recent_end, ["query"], row_limit=5000, max_rows=10000)
    print(f"current queries fetched: {len(current_query_rows)}", file=sys.stderr, flush=True)
    previous_query_rows = gsc_fetch_rows(access_token, site_property, prior_start, prior_end, ["query"], row_limit=5000, max_rows=10000)
    print(f"previous queries fetched: {len(previous_query_rows)}", file=sys.stderr, flush=True)
    query_page_rows_90d = gsc_fetch_rows(
        access_token,
        site_property,
        last_90_start,
        last_complete_day,
        ["query", "page"],
        row_limit=5000,
        max_rows=10000,
    )
    print(f"query+page rows fetched: {len(query_page_rows_90d)}", file=sys.stderr, flush=True)

    landing_pages_by_query, landing_pages = aggregate_query_page(
        [row for row in query_page_rows_90d if is_repair_query(row["keys"][0])]
    )

    state["snapshots"] = [
        f"- GSC site property used: `{site_property}`.",
        f"- Current 30-day repair-query candidates after filtering: `{sum(1 for row in current_query_rows if is_repair_query(row['keys'][0]))}`.",
        f"- Prior 30-day repair-query candidates after filtering: `{sum(1 for row in previous_query_rows if is_repair_query(row['keys'][0]))}`.",
        f"- Top repair landing pages are aggregated from 90-day `query + page` Search Console rows, not a raw page-only slice.",
    ]
    state["landing_pages"] = landing_pages[:15]
    render_report(state)
    print("gsc sections written", file=sys.stderr, flush=True)

    product_items = monday_fetch_board_items(
        env,
        2477699024,
        ["status3", "numbers", "formula", "numbers7", "numeric", "connect_boards8", "text_mkzdte13"],
        limit=500,
    )
    print(f"products fetched: {len(product_items)}", file=sys.stderr, flush=True)
    parts_items = monday_fetch_board_items(
        env,
        985177480,
        ["quantity", "formula_mkv86xh7", "supply_price", "link_to_products___pricing", "link_to_products_beta73", "numeric_mm14y3we", "numeric_mm14qe9r"],
        limit=500,
    )
    print(f"parts fetched: {len(parts_items)}", file=sys.stderr, flush=True)

    parts_by_product: dict[str, set[str]] = defaultdict(set)
    parts: dict[str, dict[str, Any]] = {}
    for item in parts_items:
        cols = column_map(item)
        product_links = set(cols.get("link_to_products___pricing", {}).get("linked_item_ids") or [])
        for product_id in product_links:
            parts_by_product[str(product_id)].add(str(item["id"]))
        parts[str(item["id"])] = {
            "item_id": str(item["id"]),
            "name": item["name"],
            "total_stock": parse_float(cols.get("quantity", {}).get("text")),
            "available_stock": parse_float(cols.get("formula_mkv86xh7", {}).get("text")),
            "supply_price": parse_float(cols.get("supply_price", {}).get("text")) or 0.0,
            "usage_30d": parse_float(cols.get("numeric_mm14y3we", {}).get("text")),
            "usage_90d": parse_float(cols.get("numeric_mm14qe9r", {}).get("text")),
        }

    products = build_products(product_items, parts_by_product)
    enrich_products(products, parts)
    print(f"products enriched: {len(products)}", file=sys.stderr, flush=True)

    query_rows = build_query_rows(current_query_rows, previous_query_rows, landing_pages_by_query, products)
    print(f"query rows built: {len(query_rows)}", file=sys.stderr, flush=True)
    top_clicks = sorted(query_rows, key=lambda row: (row["clicks"], row["impressions"]), reverse=True)[:20]
    fastest_climbing = [
        row for row in query_rows
        if row["position_change"] is not None and row["position_change"] > 0 and (row["impressions"] >= 20 or row["prev_impressions"] >= 20)
    ]
    fastest_climbing.sort(key=lambda row: (row["position_change"], row["clicks"], row["impression_change"]), reverse=True)
    striking_distance = [
        row for row in query_rows
        if row["position"] is not None and 11 <= row["position"] <= 20 and row["impressions"] >= 20
    ]
    striking_distance.sort(key=lambda row: (row["clicks"], row["impressions"], row["position_change"] or -999), reverse=True)

    recommendations = summarise_recommendations(query_rows)

    matched_count = sum(1 for row in query_rows if row["product"])
    healthy_margin_count = sum(
        1
        for row in query_rows
        if row["product"] and row["product"].margin_pct is not None and row["product"].margin_pct >= HEALTHY_MARGIN
    )

    state["status"] = "complete"
    state["top_clicks"] = top_clicks
    state["fastest_climbing"] = fastest_climbing[:20]
    state["striking_distance"] = striking_distance[:20]
    state["recommendations"] = recommendations or ["No rising, healthy-margin queries with clear stock risk were found from the available mappings."]
    state["notes"] = [
        f"Matched `{matched_count}` repair queries to a product SKU with enough confidence to show price/margin/stock. Generic queries such as broad 'iphone battery repair' terms can be real demand but do not always map to one SKU safely.",
        f"`{healthy_margin_count}` matched repair queries point at products with margin at or above the `70%` healthy threshold from the profitability brief.",
        "Stock status is based on linked parts availability. `No linked part` means the product had no usable part relation in either the product forward link or the parts board reverse link.",
        "Where the Monday `Price ex VAT` formula was blank, ex-VAT price was derived as `inc VAT / 1.2`.",
    ]
    render_report(state)
    print("final report written", file=sys.stderr, flush=True)


if __name__ == "__main__":
    main()
