#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
import time
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import requests


WORKDIR = Path("/home/ricky/builds/system-audit-2026-03-31")
ENV_PATH = Path("/home/ricky/config/api-keys/.env")
PROFITABILITY_PATH = WORKDIR / "repair-profitability-v2.md"
GSC_PATH = WORKDIR / "gsc-profitability-crossref-v2.md"
OUTPUT_PATH = WORKDIR / "product-cards.md"

MONDAY_API_URL = "https://api.monday.com/v2"
MONDAY_API_VERSION = "2024-10"

PRODUCTS_BOARD_ID = 2477699024
PARTS_BOARD_ID = 985177480
MAIN_BOARD_ID = 349212843

CURRENT_DAY = date(2026, 4, 4)
PAGE_LIMIT = 500
RATE_LIMIT_SECONDS = 0.35
ACTIVITY_BATCH_SIZE = 50

COMPLETED_STATUSES = {"Ready To Collect", "Repaired", "Returned", "Shipped", "Collected"}
REPAIR_TYPE_EXCLUDE = {"Diagnostic", "No Fault Found", "Quote Rejected", "BER", "Unrepairable", "Booking Cancelled"}

PRODUCT_COLUMNS = [
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
    "collection_date",
    "date_mkwdan7z",
    "date3",
    "board_relation",
    "board_relation0",
    "connect_boards__1",
]

TOKEN_RE = re.compile(r"[a-z0-9]+")
SECTION_RE = re.compile(r"^## (?P<title>.+?)\n(?P<body>.*?)(?=^## |\Z)", re.M | re.S)
MODEL_TOKEN_RE = re.compile(r"^[a-z0-9()'/.-]+$")


@dataclass
class ProfitabilityRow:
    device: str
    product: str
    price_inc: float | None
    price_ex: float | None
    parts_cost: float | None
    labour_cost: float | None
    refurb_cost: float | None
    fees: float | None
    net_profit: float | None
    net_margin_pct: float | None
    shopify_listed: bool
    flags: set[str]


@dataclass
class TimeRow:
    device: str
    product: str
    used_hours: float | None


@dataclass
class GscRow:
    device: str
    product: str
    clicks: int
    impressions: int
    position: float | None
    trend_raw: str


@dataclass
class LiveProduct:
    product_id: str
    device: str
    product: str
    part_ids: list[str]
    shopify_id: str


@dataclass
class ProductCard:
    family: str
    device: str
    title: str
    price_inc: float | None
    price_ex: float | None
    parts_cost: float | None
    labour_cost: float | None
    refurb_cost: float | None
    fees: float | None
    total_costs: float | None
    net_profit: float | None
    net_margin_pct: float | None
    repair_time_hours: float | None
    volume_30d: int
    volume_60d: int
    volume_90d: int
    gsc: GscRow | None
    loss_maker: bool
    no_shopify: bool


def parse_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


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


def parse_activity_created_at(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        return datetime.fromtimestamp(int(str(raw)) / 10_000_000, tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return None


def normalize(text: str) -> str:
    return " ".join(TOKEN_RE.findall(text.lower().replace("&", " and ")))


def match_key(device: str, product: str) -> str:
    return f"{normalize(device)}||{normalize(product)}"


def parse_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if not text or text.lower() == "n/a":
        return None
    text = text.replace("£", "").replace(",", "").replace("%", "")
    text = re.sub(r"[^0-9.\-]", "", text)
    if not text or text in {"-", ".", "-."}:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def parse_int(value: Any) -> int:
    parsed = parse_float(value)
    if parsed is None:
        return 0
    return int(round(parsed))


def fmt_money(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"£{value:,.2f}"


def fmt_margin(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"{value:.1f}%"


def fmt_hours(value: float | None) -> str:
    if value is None:
        return "n/a"
    text = f"{value:.2f}".rstrip("0").rstrip(".")
    return f"{text}h"


def fmt_position(value: float | None) -> str:
    if value is None:
        return "n/a"
    if abs(value - round(value)) < 0.05:
        return str(int(round(value)))
    return f"{value:.1f}"


def fmt_int(value: int) -> str:
    return f"{value:,}"


def trend_display(raw: str) -> str:
    value = parse_float(raw)
    if value is None:
        return "→0"
    if value > 0:
        return f"↑{int(round(value))}"
    if value < 0:
        return f"↓{int(abs(round(value)))}"
    return "→0"


def section_block(markdown: str, title: str) -> str:
    for match in SECTION_RE.finditer(markdown):
        if match.group("title").strip() == title:
            return match.group("body").strip()
    return ""


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


def classify_family(device: str) -> str:
    lower = normalize(device)
    if "iphone" in lower:
        return "iPhone"
    if "ipad" in lower:
        return "iPad"
    if "watch" in lower:
        return "Apple Watch"
    if any(token in lower for token in ["macbook", "imac", "mac mini", "mac studio", "mac pro", "mac"]):
        return "MacBook"
    return "Other"


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def split_product_title(device: str, product: str) -> str:
    clean_product = normalize_space(product)
    clean_device = normalize_space(device)
    if clean_device:
        pattern = re.compile(rf"^{re.escape(clean_device)}\s*", re.I)
        stripped = normalize_space(pattern.sub("", clean_product, count=1))
        if stripped:
            return stripped

    tokens = clean_product.split()
    idx = 0
    for token in tokens:
        cleaned = re.sub(r"[^a-z0-9/().'-]", "", token.lower())
        if not cleaned:
            idx += 1
            continue
        if (
            cleaned in {
                "apple",
                "watch",
                "iphone",
                "ipad",
                "ipod",
                "touch",
                "macbook",
                "mac",
                "pro",
                "max",
                "plus",
                "mini",
                "air",
                "ultra",
                "se",
                "series",
                "gen",
                "tb",
                "touch",
                "bar",
            }
            or cleaned.isdigit()
            or re.fullmatch(r"[ms]?\d+(g|mm)?", cleaned)
            or re.fullmatch(r"a\d+(?:/\w+)?", cleaned)
            or re.fullmatch(r"\d+(?:st|nd|rd|th)", cleaned)
            or re.fullmatch(r"[234]\s*tb", cleaned)
            or re.fullmatch(r"m\d", cleaned)
            or MODEL_TOKEN_RE.fullmatch(cleaned) and any(ch.isdigit() for ch in cleaned)
        ):
            idx += 1
            continue
        break
    stripped = normalize_space(" ".join(tokens[idx:]))
    return stripped or clean_product


def natural_sort_key(text: str) -> tuple[tuple[int, Any], ...]:
    parts = re.findall(r"\d+|[A-Za-z]+|[^A-Za-z\d\s]+", text.lower())
    key: list[tuple[int, Any]] = []
    for part in parts:
        if part.isdigit():
            key.append((1, int(part)))
        else:
            key.append((0, part))
    return tuple(key)


def iphone_sort_key(device: str) -> tuple[int, int, tuple[tuple[int, Any], ...]]:
    lower = normalize(device)
    generation_map = {
        "16": 16,
        "15": 15,
        "14": 14,
        "13": 13,
        "12": 12,
        "11": 11,
        "xr": 10,
        "xs": 10,
        "x": 10,
        "se3": 9,
        "se2": 8,
        "se": 7,
        "8": 8,
        "7": 7,
        "6": 6,
    }
    generation = 0
    for token in lower.split():
        if token in generation_map:
            generation = generation_map[token]
            break
        if token.isdigit():
            generation = int(token)
            break
    if "pro max" in lower:
        variant = 5
    elif "pro" in lower:
        variant = 4
    elif "plus" in lower:
        variant = 3
    elif "mini" in lower:
        variant = 1
    else:
        variant = 2
    return (generation, variant, natural_sort_key(device))


def lookup_row(
    device: str,
    product: str,
    by_key: dict[str, Any],
    by_product: dict[str, list[Any]],
) -> Any | None:
    exact = by_key.get(match_key(device, product))
    if exact is not None:
        return exact
    matches = by_product.get(normalize(product), [])
    if len(matches) == 1:
        return matches[0]
    return None


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

    def fetch_board(self, board_id: int, column_ids: list[str]) -> list[dict[str, Any]]:
        cols = ", ".join(f'"{column_id}"' for column_id in column_ids)
        initial_query = f"""
        query {{
          boards(ids:[{board_id}]) {{
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
        items_page = data["boards"][0]["items_page"]
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
        return items

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
            for log in data["boards"][0]["activity_logs"]:
                payload = parse_json(log.get("data"))
                pulse_id = str(payload.get("pulse_id") or "")
                if pulse_id:
                    logs_by_item[pulse_id].append(log)
        for item_id in logs_by_item:
            logs_by_item[item_id].sort(
                key=lambda log: parse_activity_created_at(log.get("created_at")) or datetime.min.replace(tzinfo=timezone.utc)
            )
        return logs_by_item


def parse_status_transitions(logs: list[dict[str, Any]]) -> list[tuple[datetime, str, str]]:
    transitions: list[tuple[datetime, str, str]] = []
    for log in logs:
        payload = parse_json(log.get("data"))
        new_label = (((payload.get("value") or {}).get("label") or {}).get("text") or "").strip()
        old_label = (((payload.get("previous_value") or {}).get("label") or {}).get("text") or "").strip()
        created_at = parse_activity_created_at(log.get("created_at"))
        if created_at and new_label:
            transitions.append((created_at, old_label, new_label))
    transitions.sort(key=lambda row: row[0])
    return transitions


def completion_at_for_item(item: dict[str, Any], logs: list[dict[str, Any]]) -> datetime | None:
    transitions = parse_status_transitions(logs)
    for changed_at, _old, new in transitions:
        if new in COMPLETED_STATUSES:
            return changed_at

    cols = column_map(item)
    # Prefer the repaired date fields when logs are missing; returned items often have their own final date field.
    return (
        parse_date_value(cols.get("collection_date", {}).get("value"))
        or parse_date_value(cols.get("date_mkwdan7z", {}).get("value"))
        or parse_date_value(cols.get("date3", {}).get("value"))
    )


def load_profitability() -> tuple[dict[str, ProfitabilityRow], dict[str, list[ProfitabilityRow]]]:
    markdown = PROFITABILITY_PATH.read_text(encoding="utf-8")
    section = section_block(markdown, "Section 3: Ranked Product Profitability")
    rows = parse_markdown_table(section)
    by_key: dict[str, ProfitabilityRow] = {}
    by_product: dict[str, list[ProfitabilityRow]] = defaultdict(list)
    for row in rows:
        profit_row = ProfitabilityRow(
            device=row["Device"],
            product=row["Product"],
            price_inc=parse_float(row["Price (inc VAT)"]),
            price_ex=parse_float(row["Ex-VAT"]),
            parts_cost=parse_float(row["Parts Cost"]),
            labour_cost=parse_float(row["Labour"]),
            refurb_cost=parse_float(row["Refurb"]) or 0.0,
            fees=parse_float(row["Fees"]),
            net_profit=parse_float(row["Net Profit"]),
            net_margin_pct=parse_float(row["Net Margin %"]),
            shopify_listed=row["Shopify Listed"].strip().lower() == "yes",
            flags={part.strip().lower() for part in row["Flag"].split(",") if part.strip()},
        )
        by_key[match_key(profit_row.device, profit_row.product)] = profit_row
        by_product[normalize(profit_row.product)].append(profit_row)
    return by_key, by_product


def load_times() -> tuple[dict[str, TimeRow], dict[str, list[TimeRow]]]:
    markdown = PROFITABILITY_PATH.read_text(encoding="utf-8")
    section = section_block(markdown, "Section 2: Repair Time Analysis")
    rows = parse_markdown_table(section)
    by_key: dict[str, TimeRow] = {}
    by_product: dict[str, list[TimeRow]] = defaultdict(list)
    for row in rows:
        time_row = TimeRow(
            device=row["Device"],
            product=row["Product"],
            used_hours=parse_float(row["Used"]),
        )
        by_key[match_key(time_row.device, time_row.product)] = time_row
        by_product[normalize(time_row.product)].append(time_row)
    return by_key, by_product


def load_gsc() -> tuple[dict[str, GscRow], dict[str, list[GscRow]]]:
    markdown = GSC_PATH.read_text(encoding="utf-8")
    section = section_block(markdown, "Section 2: Product-Level Demand × Profitability")
    rows = parse_markdown_table(section)
    by_key: dict[str, GscRow] = {}
    by_product: dict[str, list[GscRow]] = defaultdict(list)
    for row in rows:
        gsc_row = GscRow(
            device=row["Device"],
            product=row["Product"],
            clicks=parse_int(row["Clicks"]),
            impressions=parse_int(row["Impressions"]),
            position=parse_float(row["Avg Position"]),
            trend_raw=row["Trend (30d)"].strip(),
        )
        by_key[match_key(gsc_row.device, gsc_row.product)] = gsc_row
        by_product[normalize(gsc_row.product)].append(gsc_row)
    return by_key, by_product


def load_live_products_and_volumes(monday: MondayClient) -> tuple[list[LiveProduct], dict[str, dict[int, int]], dict[str, int]]:
    product_items = monday.fetch_board(PRODUCTS_BOARD_ID, PRODUCT_COLUMNS)
    part_items = monday.fetch_board(PARTS_BOARD_ID, PART_COLUMNS)
    main_items = monday.fetch_board(MAIN_BOARD_ID, MAIN_COLUMNS)

    reverse_product_to_parts: dict[str, list[str]] = defaultdict(list)
    for item in part_items:
        cols = column_map(item)
        part_id = str(item["id"])
        for product_id in relation_ids(cols.get("link_to_products___pricing")):
            reverse_product_to_parts[product_id].append(part_id)

    product_map: dict[str, LiveProduct] = {}
    part_to_products: dict[str, set[str]] = defaultdict(set)
    for item in product_items:
        cols = column_map(item)
        product_id = str(item["id"])
        direct_part_ids = relation_ids(cols.get("connect_boards8"))
        part_ids = list(dict.fromkeys(direct_part_ids + reverse_product_to_parts.get(product_id, [])))
        device = relation_display(cols.get("link_to_devices6")) or (item.get("group") or {}).get("title", "") or item["name"]
        product_map[product_id] = LiveProduct(
            product_id=product_id,
            device=device,
            product=item["name"],
            part_ids=part_ids,
            shopify_id=(cols.get("text_mkzdte13", {}).get("text") or "").strip(),
        )
        for part_id in part_ids:
            part_to_products[part_id].add(product_id)

    candidate_items: list[dict[str, Any]] = []
    for item in main_items:
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
        candidate_items.append(item)

    status_logs_by_item = monday.fetch_status_activity_logs([str(item["id"]) for item in candidate_items])

    repair_ids_by_product_window: dict[str, dict[int, set[str]]] = defaultdict(lambda: {30: set(), 60: set(), 90: set()})
    stats = {"candidate_items": len(candidate_items), "counted_repairs": 0, "missing_completion_at": 0}
    thresholds = {
        30: CURRENT_DAY - timedelta(days=29),
        60: CURRENT_DAY - timedelta(days=59),
        90: CURRENT_DAY - timedelta(days=89),
    }

    for item in candidate_items:
        item_id = str(item["id"])
        completion_at = completion_at_for_item(item, status_logs_by_item.get(item_id, []))
        if completion_at is None:
            stats["missing_completion_at"] += 1
            continue
        completion_day = completion_at.date()
        cols = column_map(item)
        product_ids = set(relation_ids(cols.get("board_relation")) + relation_ids(cols.get("board_relation0")))
        for part_id in relation_ids(cols.get("connect_boards__1")):
            product_ids.update(part_to_products.get(part_id, set()))
        if not product_ids:
            continue
        stats["counted_repairs"] += 1
        for product_id in product_ids:
            for window, threshold in thresholds.items():
                if completion_day >= threshold:
                    repair_ids_by_product_window[product_id][window].add(item_id)

    volume_map: dict[str, dict[int, int]] = {}
    for product_id, window_sets in repair_ids_by_product_window.items():
        volume_map[product_id] = {window: len(item_ids) for window, item_ids in window_sets.items()}

    return list(product_map.values()), volume_map, stats


def include_product(volume_90d: int, gsc_clicks: int, loss_maker: bool, price_mismatch: bool) -> bool:
    return volume_90d > 0 or gsc_clicks > 0 or loss_maker or price_mismatch


def is_test_placeholder(device: str, product: str) -> bool:
    device_tokens = set(normalize(device).split())
    product_tokens = set(normalize(product).split())
    return "test" in device_tokens or "test" in product_tokens


def render_card(card: ProductCard) -> str:
    name = card.title
    if card.loss_maker:
        name += " ⚠️ LOSS-MAKER"
    if card.no_shopify:
        name += " 🔴 NO SHOPIFY"

    costs_bits = [f"Parts {fmt_money(card.parts_cost or 0.0)}", f"Labour {fmt_money(card.labour_cost or 0.0)}"]
    if (card.refurb_cost or 0.0) > 0:
        costs_bits.append(f"Refurb {fmt_money(card.refurb_cost or 0.0)}")
    costs_bits.append(f"Fees {fmt_money(card.fees or 0.0)}")

    lines = [
        f"## {name}",
        f"- **Price:** {fmt_money(card.price_inc)} inc / {fmt_money(card.price_ex)} ex",
        f"- **Margin:** {fmt_margin(card.net_margin_pct)} · **Profit:** {fmt_money(card.net_profit)}",
        f"- **Costs:** {' · '.join(costs_bits)}",
        f"- **Total costs:** {fmt_money(card.total_costs)} · **Repair time:** {fmt_hours(card.repair_time_hours)}",
        f"- **Volume:** 30d: {card.volume_30d} · 60d: {card.volume_60d} · 90d: {card.volume_90d}",
    ]
    if card.gsc and card.gsc.clicks > 0:
        lines.append(
            f"- **GSC:** {fmt_int(card.gsc.clicks)} clicks · {fmt_int(card.gsc.impressions)} impr · pos {fmt_position(card.gsc.position)} · {trend_display(card.gsc.trend_raw)}"
        )
    return "\n".join(lines)


def build_output(cards: list[ProductCard], hidden_counts: dict[str, int]) -> str:
    family_order = ["iPhone", "iPad", "MacBook", "Apple Watch", "Other"]
    cards_by_family_device: dict[str, dict[str, list[ProductCard]]] = defaultdict(lambda: defaultdict(list))
    for card in cards:
        cards_by_family_device[card.family][card.device].append(card)

    lines: list[str] = []
    for family in family_order:
        if lines:
            lines.append("")
        lines.append(f"# {family}")
        lines.append("")

        device_groups = cards_by_family_device.get(family, {})
        if family == "iPhone":
            devices = sorted(device_groups, key=iphone_sort_key, reverse=True)
        else:
            devices = sorted(device_groups, key=natural_sort_key, reverse=True)

        first_group = True
        for device in devices:
            if not first_group:
                lines.append("")
            lines.append("---")
            lines.append(f"### {device}")
            lines.append("")
            first_group = False

            device_cards = sorted(
                device_groups[device],
                key=lambda card: (
                    -(card.gsc.clicks if card.gsc else 0),
                    -(card.net_margin_pct if card.net_margin_pct is not None else -9999),
                    natural_sort_key(card.title),
                ),
            )
            for idx, card in enumerate(device_cards):
                if idx:
                    lines.append("")
                lines.append(render_card(card))

        lines.append("")
        lines.append(f"*Plus {hidden_counts.get(family, 0)} more products with no recent volume or search demand*")

    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    env = parse_env(ENV_PATH)
    monday_token = env.get("MONDAY_APP_TOKEN")
    if not monday_token:
        raise RuntimeError("MONDAY_APP_TOKEN not found in env file")

    profitability_by_key, profitability_by_product = load_profitability()
    time_by_key, time_by_product = load_times()
    gsc_by_key, gsc_by_product = load_gsc()

    monday = MondayClient(monday_token)
    live_products, volume_map, volume_stats = load_live_products_and_volumes(monday)

    cards: list[ProductCard] = []
    hidden_counts: dict[str, int] = defaultdict(int)
    unmatched_profitability = 0
    unmatched_time = 0

    for live_product in live_products:
        if is_test_placeholder(live_product.device, live_product.product):
            continue

        profit = lookup_row(live_product.device, live_product.product, profitability_by_key, profitability_by_product)
        if profit is None:
            unmatched_profitability += 1
            continue

        time_row = lookup_row(live_product.device, live_product.product, time_by_key, time_by_product)
        if time_row is None:
            unmatched_time += 1

        gsc_row = lookup_row(live_product.device, live_product.product, gsc_by_key, gsc_by_product)
        volumes = volume_map.get(live_product.product_id, {})
        volume_30d = volumes.get(30, 0)
        volume_60d = volumes.get(60, 0)
        volume_90d = volumes.get(90, 0)

        loss_maker = (profit.net_margin_pct is not None and profit.net_margin_pct < 0) or (profit.net_profit is not None and profit.net_profit < 0)
        no_shopify = (not profit.shopify_listed) or ("no-shopify" in profit.flags)
        price_mismatch = "price-mismatch" in profit.flags
        family = classify_family(profit.device or live_product.device)

        if not include_product(volume_90d, gsc_row.clicks if gsc_row else 0, loss_maker, price_mismatch):
            hidden_counts[family] += 1
            continue

        parts_cost = profit.parts_cost or 0.0
        labour_cost = profit.labour_cost or 0.0
        refurb_cost = profit.refurb_cost or 0.0
        fees = profit.fees or 0.0
        total_costs = parts_cost + labour_cost + refurb_cost + fees

        cards.append(
            ProductCard(
                family=family,
                device=normalize_space(profit.device or live_product.device),
                title=split_product_title(profit.device or live_product.device, profit.product),
                price_inc=profit.price_inc,
                price_ex=profit.price_ex,
                parts_cost=parts_cost,
                labour_cost=labour_cost,
                refurb_cost=refurb_cost,
                fees=fees,
                total_costs=total_costs,
                net_profit=profit.net_profit,
                net_margin_pct=profit.net_margin_pct,
                repair_time_hours=time_row.used_hours if time_row else None,
                volume_30d=volume_30d,
                volume_60d=volume_60d,
                volume_90d=volume_90d,
                gsc=gsc_row if gsc_row and gsc_row.clicks > 0 else None,
                loss_maker=loss_maker,
                no_shopify=no_shopify,
            )
        )

    output = build_output(cards, hidden_counts)
    OUTPUT_PATH.write_text(output, encoding="utf-8")

    print(
        json.dumps(
            {
                "cards_written": len(cards),
                "output_path": str(OUTPUT_PATH),
                "unmatched_profitability": unmatched_profitability,
                "unmatched_time": unmatched_time,
                "candidate_items": volume_stats["candidate_items"],
                "counted_repairs": volume_stats["counted_repairs"],
                "missing_completion_at": volume_stats["missing_completion_at"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
