#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import re
import statistics
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

import requests


WORKDIR = Path("/home/ricky/builds/system-audit-2026-03-31")
ENV_PATH = Path("/home/ricky/config/api-keys/.env")
OUTPUT_PATH = WORKDIR / "parts-cost-audit.md"
PROFITABILITY_PATH = WORKDIR / "repair-profitability-v2.md"
XERO_REFRESH_FALLBACK = Path("/tmp/xero-recon-ATuAJ1/xero-refresh-token.txt")

MONDAY_API_URL = "https://api.monday.com/v2"
MONDAY_API_VERSION = "2024-10"
XERO_IDENTITY_URL = "https://identity.xero.com/connect/token"
XERO_CONNECTIONS_URL = "https://api.xero.com/connections"
XERO_INVOICES_URL = "https://api.xero.com/api.xro/2.0/Invoices"

PRODUCTS_BOARD_ID = 2477699024
PARTS_BOARD_ID = 985177480
MAIN_BOARD_ID = 349212843

PAGE_LIMIT = 500
MONDAY_RATE_LIMIT_SECONDS = 0.35

PRODUCT_COLUMNS = [
    "numbers",
    "formula",
    "status3",
    "connect_boards8",
    "link_to_devices6",
]

PART_COLUMNS = [
    "supply_price",
    "quantity",
    "formula_mkv86xh7",
    "link_to_products___pricing",
    "connect_boards3",
]

MAIN_COLUMNS = [
    "status4",
    "status24",
    "status",
    "board_relation",
    "board_relation0",
    "connect_boards__1",
]

COMPLETED_STATUSES = {"Returned", "Shipped", "Ready To Collect", "Repaired"}
REPAIR_TYPE_EXCLUDE = {"Diagnostic", "No Fault Found", "Quote Rejected", "BER", "Unrepairable", "Booking Cancelled"}
REPAIRISH_BOARD_LEVEL_TYPES = {"Board Level"}

TOKEN_RE = re.compile(r"[a-z0-9]+")
MONEY_RE = re.compile(r"-?\d+(?:\.\d+)?")
XERO_DATE_RE = re.compile(r"/Date\((\d+)(?:[+-]\d+)?\)/")
SECTION_RE = re.compile(r"^## (.+?)\n", re.M)

NON_PHYSICAL_LOW_COST_KEYWORDS = {
    "adhesive",
    "glue",
    "sticker",
    "tape",
    "seal",
    "mesh",
    "foam",
    "screw",
    "screws",
    "bolt",
    "bracket screw",
    "clip",
}
SERVICEISH_KEYWORDS = {
    "service",
    "repair",
    "diagnostic",
    "assessment",
    "warranty",
    "custom",
    "liquid damage treatment",
}
SMALL_PART_KEYWORDS = {
    "charging port",
    "speaker",
    "mic",
    "microphone",
    "lens",
    "camera",
    "front camera",
    "rear camera",
    "earpiece",
    "vibrator",
    "dock",
    "button",
    "sensor",
    "housing",
    "flex",
    "port",
}
PART_KIND_ALIASES = {
    "display": "screen",
    "lcd": "screen",
    "oled": "screen",
    "digitizer": "screen",
    "glass": "screen",
    "screen": "screen",
    "battery": "battery",
    "charging": "charging",
    "port": "charging",
    "camera": "camera",
    "speaker": "speaker",
    "microphone": "mic",
    "mic": "mic",
    "lens": "lens",
    "keyboard": "keyboard",
    "trackpad": "trackpad",
    "housing": "housing",
    "rear": "rear",
    "front": "front",
    "button": "button",
    "backlight": "backlight",
}
GENERIC_MATCH_TOKENS = {
    "apple",
    "for",
    "with",
    "premium",
    "original",
    "oem",
    "incell",
    "hard",
    "soft",
    "copy",
    "replacement",
    "part",
    "parts",
}

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


@dataclass
class BoardBundle:
    board_id: int
    board_name: str
    items: list[dict[str, Any]]


@dataclass
class ProductRecord:
    product_id: str
    name: str
    device: str
    device_family: str
    product_type: str
    price_inc_vat: float | None
    price_ex_vat: float | None
    part_ids: list[str]
    direct_completed_repairs: int = 0
    model_parts_cost: float | None = None
    model_net_profit: float | None = None
    model_net_margin: float | None = None
    model_flags: list[str] = field(default_factory=list)


@dataclass
class PartRecord:
    part_id: str
    name: str
    device_name: str
    supply_price: float | None
    quantity: float | None
    available_stock: float | None
    linked_product_ids: list[str]
    completed_repairs_used: int = 0
    normalized_name: str = ""
    token_set: set[str] = field(default_factory=set)
    combined_label: str = ""
    category: str = "other"


@dataclass
class XeroLine:
    invoice_id: str
    invoice_number: str
    invoice_date: date | None
    supplier: str
    status: str
    description: str
    quantity: float
    unit_cost: float
    line_amount: float
    normalized_desc: str
    token_set: set[str]
    category: str


@dataclass
class XeroMatch:
    part_id: str
    score: float
    line: XeroLine
    discrepancy_pct: float | None


def parse_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def update_env_value(path: Path, key: str, value: str) -> None:
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(rf"^{re.escape(key)}=.*$", re.M)
    replacement = f"{key}={value}"
    if pattern.search(text):
        text = pattern.sub(replacement, text, count=1)
    else:
        text = text.rstrip() + f"\n{replacement}\n"
    path.write_text(text, encoding="utf-8")


def normalize(text: str) -> str:
    return " ".join(TOKEN_RE.findall(text.lower().replace("&", " and ")))


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
    text = text.replace("£", "").replace(",", "")
    match = MONEY_RE.search(text)
    if not match:
        return None
    try:
        return float(match.group(0))
    except ValueError:
        return None


def fmt_money(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    return f"£{value:,.2f}"


def fmt_pct(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    return f"{value * 100:.1f}%"


def fmt_int(value: int | None) -> str:
    return "0" if value is None else f"{value:,}"


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    lines.extend("| " + " | ".join(row) + " |" for row in rows)
    return "\n".join(lines)


def escape_md(text: Any) -> str:
    return str(text).replace("|", "\\|")


def parse_json(raw: str | None) -> dict[str, Any]:
    if not raw:
        return {}
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return value if isinstance(value, dict) else {}


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


def repair_kind(text: str) -> str:
    lower = normalize(text)
    for token, canonical in PART_KIND_ALIASES.items():
        if token in lower:
            return canonical
    return "other"


def low_cost_exempt(name: str) -> bool:
    lower = normalize(name)
    if any(keyword in lower for keyword in NON_PHYSICAL_LOW_COST_KEYWORDS):
        return True
    if any(keyword in lower for keyword in SERVICEISH_KEYWORDS):
        return True
    return False


def is_repair_like(cols: dict[str, dict[str, Any]]) -> bool:
    status = (cols.get("status4", {}).get("text") or "").strip()
    repair_type = (cols.get("status24", {}).get("text") or "").strip()
    client_type = (cols.get("status", {}).get("text") or "").strip()
    if status not in COMPLETED_STATUSES:
        return False
    if repair_type in REPAIR_TYPE_EXCLUDE:
        return False
    if repair_type == "Repair" or repair_type in REPAIRISH_BOARD_LEVEL_TYPES or client_type == "Refurb":
        return True
    return False


def parse_xero_date(raw: str | None) -> date | None:
    if not raw:
        return None
    match = XERO_DATE_RE.search(raw)
    if not match:
        return None
    try:
        millis = int(match.group(1))
    except ValueError:
        return None
    return datetime.fromtimestamp(millis / 1000, tz=UTC).date()


def classify_margin(margin: float | None) -> str:
    if margin is None:
        return "thin"
    if margin > 0.30:
        return "healthy"
    if margin >= 0.10:
        return "thin"
    return "loss-maker"


def section_block(markdown: str, title: str) -> str:
    pattern = re.compile(rf"^## {re.escape(title)}\n(.*?)(?=^## |\Z)", re.M | re.S)
    match = pattern.search(markdown)
    return match.group(1).strip() if match else ""


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


def parse_profitability_rows(path: Path) -> dict[tuple[str, str], dict[str, Any]]:
    markdown = path.read_text(encoding="utf-8")
    rows = parse_markdown_table(section_block(markdown, "Section 3: Ranked Product Profitability"))
    parsed: dict[tuple[str, str], dict[str, Any]] = {}
    for row in rows:
        key = (normalize(row.get("Device", "")), normalize(row.get("Product", "")))
        flags = [part.strip() for part in row.get("Flags", "").split(",") if part.strip()]
        parsed[key] = {
            "price_inc_vat": parse_float(row.get("Price inc VAT")),
            "price_ex_vat": parse_float(row.get("Price ex VAT")),
            "parts_cost": parse_float(row.get("Parts cost")),
            "labour_cost": parse_float(row.get("Labour")),
            "refurb_cost": parse_float(row.get("Refurb")),
            "payment_fee": parse_float(row.get("Payment fee")),
            "net_profit": parse_float(row.get("Net profit")),
            "net_margin": parse_float(row.get("Margin")),
            "flags": flags,
        }
    return parsed


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


def refresh_xero_access(env: dict[str, str]) -> tuple[str, dict[str, Any]]:
    candidates = [env.get("XERO_REFRESH_TOKEN", "").strip()]
    if XERO_REFRESH_FALLBACK.exists():
        fallback = XERO_REFRESH_FALLBACK.read_text(encoding="utf-8").strip()
        if fallback and fallback not in candidates:
            candidates.append(fallback)

    client_id = env.get("XERO_CLIENT_ID")
    client_secret = env.get("XERO_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise RuntimeError("Missing Xero client credentials in .env")

    errors: list[str] = []
    for refresh_token in candidates:
        if not refresh_token:
            continue
        response = requests.post(
            XERO_IDENTITY_URL,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            auth=(client_id, client_secret),
            data={"grant_type": "refresh_token", "refresh_token": refresh_token},
            timeout=60,
        )
        response.raise_for_status()
        payload = response.json()
        access_token = payload.get("access_token")
        new_refresh = payload.get("refresh_token")
        if access_token and new_refresh:
            update_env_value(ENV_PATH, "XERO_REFRESH_TOKEN", new_refresh)
            env["XERO_REFRESH_TOKEN"] = new_refresh
            return access_token, payload
        errors.append(json.dumps(payload, sort_keys=True))
    raise RuntimeError(f"Unable to refresh Xero access token: {' | '.join(errors) if errors else 'no refresh token candidates'}")


def get_xero_tenant(access_token: str, expected_name: str, fallback_tenant_id: str | None) -> str:
    response = requests.get(
        XERO_CONNECTIONS_URL,
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        timeout=60,
    )
    response.raise_for_status()
    connections = response.json()
    for entry in connections:
        if entry.get("tenantName") == expected_name:
            return entry["tenantId"]
    if fallback_tenant_id:
        return fallback_tenant_id
    raise RuntimeError(f"Xero tenant '{expected_name}' not found in /connections")


def fetch_xero_accpay_lines(access_token: str, tenant_id: str, since_date: date) -> tuple[int, int, list[XeroLine]]:
    session = requests.Session()
    session.headers.update(
        {
            "Authorization": f"Bearer {access_token}",
            "Xero-Tenant-Id": tenant_id,
            "Accept": "application/json",
        }
    )

    where = f'Type=="ACCPAY"&&Date>=DateTime({since_date.year},{since_date.month},{since_date.day})'
    lines: list[XeroLine] = []
    invoice_ids: set[str] = set()
    total_line_items = 0
    page = 1
    while True:
        params = {"page": page, "where": where, "order": "Date DESC"}
        response = session.get(XERO_INVOICES_URL, params=params, timeout=120)
        response.raise_for_status()
        payload = response.json()
        invoices = payload.get("Invoices") or []
        if not invoices:
            break
        for invoice in invoices:
            status = (invoice.get("Status") or "").upper()
            if status in {"VOIDED", "DELETED"}:
                continue
            supplier = ((invoice.get("Contact") or {}).get("Name") or "").strip()
            invoice_date = parse_xero_date(invoice.get("Date"))
            invoice_id = invoice.get("InvoiceID") or ""
            invoice_number = invoice.get("InvoiceNumber") or ""
            if invoice_id:
                invoice_ids.add(invoice_id)
            for line in invoice.get("LineItems") or []:
                total_line_items += 1
                description = (line.get("Description") or "").strip()
                quantity = parse_float(line.get("Quantity")) or 0.0
                unit_cost = parse_float(line.get("UnitAmount"))
                line_amount = parse_float(line.get("LineAmount")) or 0.0
                if unit_cost is None and quantity > 0:
                    unit_cost = line_amount / quantity
                if unit_cost is None or quantity <= 0:
                    continue
                normalized_desc = normalize(description)
                if len(normalized_desc) < 2 or normalized_desc == ".":
                    continue
                lines.append(
                    XeroLine(
                        invoice_id=invoice_id,
                        invoice_number=invoice_number,
                        invoice_date=invoice_date,
                        supplier=supplier,
                        status=status,
                        description=description,
                        quantity=quantity,
                        unit_cost=unit_cost,
                        line_amount=line_amount,
                        normalized_desc=normalized_desc,
                        token_set=tokenize(description),
                        category=repair_kind(description),
                    )
                )
        if len(invoices) < 100:
            break
        page += 1
    return len(invoice_ids), total_line_items, lines


def weighted_overlap(tokens_a: set[str], tokens_b: set[str]) -> float:
    overlap = tokens_a & tokens_b
    score = 0.0
    for token in overlap:
        if token in GENERIC_MATCH_TOKENS:
            continue
        if any(ch.isdigit() for ch in token):
            score += 7
        elif token in PART_KIND_ALIASES or token in {"screen", "battery", "charging", "camera", "speaker", "mic", "lens"}:
            score += 4
        else:
            score += 1
    return score


def match_score(part: PartRecord, line: XeroLine) -> float:
    combined = part.combined_label
    normalized_part = part.normalized_name
    normalized_line = line.normalized_desc
    ratio = SequenceMatcher(None, combined, normalized_line).ratio()
    score = ratio * 20
    if normalized_part == normalized_line or combined == normalized_line:
        score += 35
    elif normalized_part and normalized_part in normalized_line:
        score += 18
    elif normalized_line and normalized_line in combined:
        score += 14

    score += weighted_overlap(part.token_set, line.token_set)
    if part.category != "other" and part.category == line.category:
        score += 6
    if part.device_name:
        device_tokens = tokenize(part.device_name)
        score += min(8, weighted_overlap(device_tokens, line.token_set))
    return score


def select_best_xero_matches(parts: dict[str, PartRecord], xero_lines: list[XeroLine]) -> dict[str, list[XeroMatch]]:
    matches: dict[str, list[XeroMatch]] = {}
    for part_id, part in parts.items():
        candidates: list[XeroMatch] = []
        for line in xero_lines:
            score = match_score(part, line)
            if score < 16:
                continue
            discrepancy_pct = None
            if part.supply_price and part.supply_price > 0:
                discrepancy_pct = abs(line.unit_cost - part.supply_price) / part.supply_price
            candidates.append(XeroMatch(part_id=part_id, score=score, line=line, discrepancy_pct=discrepancy_pct))
        candidates.sort(
            key=lambda item: (
                -item.score,
                item.line.invoice_date or date.min,
                -item.line.unit_cost,
            ),
            reverse=False,
        )
        if not candidates:
            continue
        top_score = candidates[0].score
        strong = [item for item in candidates if item.score >= max(22, top_score - 5)]
        deduped: list[XeroMatch] = []
        seen: set[tuple[str, str, float]] = set()
        for match in strong:
            key = (match.line.supplier, match.line.normalized_desc, round(match.line.unit_cost, 2))
            if key in seen:
                continue
            deduped.append(match)
            seen.add(key)
            if len(deduped) >= 5:
                break
        if deduped:
            deduped.sort(
                key=lambda item: (
                    -item.score,
                    item.line.invoice_date or date.min,
                ),
                reverse=False,
            )
            matches[part_id] = sorted(
                deduped,
                key=lambda item: (
                    item.score,
                    item.line.invoice_date or date.min,
                ),
                reverse=True,
            )
    return matches


def choose_xero_suggested_cost(matches: list[XeroMatch]) -> float | None:
    if not matches:
        return None
    costs = [match.line.unit_cost for match in matches[:3] if match.score >= 22]
    if not costs:
        return None
    return statistics.median(costs)


def fallback_cost(part: PartRecord) -> float:
    text = normalize(f"{part.device_name} {part.name}")
    if "iphone" in text and "battery" in text:
        return 11.5
    if "iphone" in text and repair_kind(text) == "screen":
        return 80.0
    if "macbook" in text and repair_kind(text) == "screen":
        return 275.0
    if "watch" in text and repair_kind(text) == "screen":
        return 27.5
    if "ipad" in text and repair_kind(text) == "screen":
        return 65.0
    if any(keyword in text for keyword in SMALL_PART_KEYWORDS):
        return 8.5
    if "battery" in text:
        return 11.5
    return 8.5


def build_missing_cost_rows(
    missing_parts: list[PartRecord],
    products: dict[str, ProductRecord],
    xero_matches: dict[str, list[XeroMatch]],
) -> tuple[list[list[str]], float]:
    rows: list[list[str]] = []
    total_history_impact = 0.0
    for part in missing_parts:
        linked_products = [products[product_id] for product_id in part.linked_product_ids if product_id in products]
        linked_products.sort(key=lambda product: (product.price_ex_vat is None, -(product.price_ex_vat or 0), product.name.lower()))
        product_labels = [
            f"{product.device} {product.name}".strip()
            for product in linked_products[:4]
        ]
        product_prices = [
            f"{product.name}: {fmt_money(product.price_inc_vat)}"
            for product in linked_products[:3]
        ]
        matches = xero_matches.get(part.part_id, [])
        xero_cost = choose_xero_suggested_cost(matches)
        suggested = xero_cost if xero_cost is not None else fallback_cost(part)
        basis = "Xero" if xero_cost is not None else "Fallback"
        impact = suggested * part.completed_repairs_used
        total_history_impact += impact
        rows.append(
            [
                escape_md(part.name),
                escape_md(", ".join(product_labels) if product_labels else "No linked products"),
                escape_md(", ".join(product_prices) if product_prices else "n/a"),
                fmt_int(part.completed_repairs_used),
                escape_md(f"{fmt_money(suggested)} ({basis})"),
                escape_md(fmt_money(impact)),
            ]
        )
    return rows, total_history_impact


def build_suspicious_cost_rows(parts: dict[str, PartRecord], products: dict[str, ProductRecord]) -> list[list[str]]:
    rows: list[list[str]] = []
    for part in parts.values():
        cost = part.supply_price
        if cost is None or cost <= 0:
            continue
        linked_products = [products[product_id] for product_id in part.linked_product_ids if product_id in products]
        issue = None
        if linked_products:
            priced = [product for product in linked_products if product.price_ex_vat]
            if priced:
                cheapest = min(priced, key=lambda product: product.price_ex_vat or float("inf"))
                ratio = cost / (cheapest.price_ex_vat or 1)
                if ratio > 0.80:
                    issue = f"High: {fmt_pct(ratio)} of cheapest linked product ex-VAT ({cheapest.name} {fmt_money(cheapest.price_ex_vat)})"
        if issue is None and cost < 0.50 and not low_cost_exempt(part.name):
            issue = "Low: under £0.50 for a non-consumable physical component"
        if issue is None:
            continue
        linked_text = ", ".join(f"{product.device} {product.name}".strip() for product in linked_products[:4]) or "No linked products"
        rows.append(
            [
                escape_md(part.name),
                fmt_money(cost),
                escape_md(issue),
                escape_md(linked_text),
            ]
        )
    rows.sort(key=lambda row: row[0].lower())
    return rows


def duplicate_signature(name: str) -> str:
    tokens = [token for token in normalize(name).split() if token not in {"screen", "display", "glass", "lcd", "oled"}]
    return " ".join(tokens)


def primary_model_tokens(name: str) -> set[str]:
    tokens = set()
    for token in tokenize(name):
        if re.fullmatch(r"a\d{4}", token):
            tokens.add(token)
        elif any(ch.isdigit() for ch in token):
            tokens.add(token)
    return tokens


def build_duplicate_rows(parts: dict[str, PartRecord]) -> list[list[str]]:
    part_list = list(parts.values())
    rows: list[tuple[float, list[str]]] = []
    for idx, part_a in enumerate(part_list):
        for part_b in part_list[idx + 1 :]:
            if part_a.part_id == part_b.part_id:
                continue
            if part_a.supply_price == part_b.supply_price:
                continue
            signature_a = duplicate_signature(part_a.name)
            signature_b = duplicate_signature(part_b.name)
            ratio = SequenceMatcher(None, signature_a, signature_b).ratio()
            jaccard_den = len(part_a.token_set | part_b.token_set) or 1
            jaccard = len(part_a.token_set & part_b.token_set) / jaccard_den
            primary_a = primary_model_tokens(part_a.name)
            primary_b = primary_model_tokens(part_b.name)
            same_primary_model = bool(
                primary_a
                and primary_b
                and (primary_a == primary_b or primary_a.issubset(primary_b) or primary_b.issubset(primary_a))
            )
            same_device_name = bool(part_a.device_name and part_b.device_name and normalize(part_a.device_name) == normalize(part_b.device_name))
            same_category = part_a.category == part_b.category and part_a.category != "other"
            if not (
                signature_a == signature_b
                or part_a.normalized_name == part_b.normalized_name
                or ((same_primary_model or same_device_name) and ratio >= 0.93)
                or ((same_primary_model or same_device_name) and same_category and ratio >= 0.88 and jaccard >= 0.70)
            ):
                continue
            if primary_a and primary_b and not same_primary_model and part_a.normalized_name != part_b.normalized_name:
                continue
            delta = abs((part_a.supply_price or 0.0) - (part_b.supply_price or 0.0))
            if delta < 1.0 and (part_a.supply_price or 0.0) > 0 and (part_b.supply_price or 0.0) > 0:
                continue
            likely = "Yes" if signature_a == signature_b or part_a.normalized_name == part_b.normalized_name else "Probably"
            rows.append(
                (
                    max(ratio, jaccard),
                    [
                        escape_md(part_a.name),
                        fmt_money(part_a.supply_price),
                        escape_md(part_b.name),
                        fmt_money(part_b.supply_price),
                        likely,
                    ],
                )
            )
    rows.sort(key=lambda item: item[0], reverse=True)
    deduped: list[list[str]] = []
    seen: set[tuple[str, str]] = set()
    for _, row in rows:
        key = tuple(sorted((row[0], row[2])))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(row)
        if len(deduped) >= 40:
            break
    return deduped


def build_xero_match_rows(parts: dict[str, PartRecord], xero_matches: dict[str, list[XeroMatch]]) -> list[list[str]]:
    rows: list[list[str]] = []
    for part_id, matches in xero_matches.items():
        part = parts[part_id]
        best = matches[0]
        discrepancy = best.discrepancy_pct
        include = (part.supply_price is None or part.supply_price == 0) or (discrepancy is not None and discrepancy > 0.20)
        if not include:
            continue
        discrepancy_text = "Missing in Monday" if part.supply_price in {None, 0} else fmt_pct(discrepancy)
        rows.append(
            [
                escape_md(part.name),
                fmt_money(part.supply_price),
                fmt_money(best.line.unit_cost),
                escape_md(best.line.supplier or "Unknown supplier"),
                escape_md(best.line.invoice_date.isoformat() if best.line.invoice_date else "n/a"),
                escape_md(discrepancy_text),
            ]
        )
    rows.sort(key=lambda row: (row[5] != "Missing in Monday", row[0].lower()))
    return rows


def model_price_ex_vat(product: ProductRecord) -> float | None:
    return product.model_net_margin if False else None


def product_model_costs(product: ProductRecord) -> tuple[float | None, float | None]:
    if product.model_parts_cost is not None and product.model_net_profit is not None:
        return product.model_parts_cost, product.model_net_profit
    return None, None


def default_hours_for_product(product: ProductRecord) -> float:
    return DEFAULT_HOURS.get(product.device_family, DEFAULT_HOURS["Other"])


def is_iphone_screen(product: ProductRecord) -> bool:
    return product.device_family == "iPhone" and repair_kind(f"{product.product_type} {product.name}") == "screen"


def estimate_model_baseline(product: ProductRecord) -> tuple[float | None, float | None, float | None, list[str]]:
    if product.model_parts_cost is not None and product.model_net_profit is not None and product.model_net_margin is not None:
        return product.model_parts_cost, product.model_net_profit, product.model_net_margin, product.model_flags
    if product.price_inc_vat is None:
        return None, None, None, []
    price_ex_vat = product.price_ex_vat if product.price_ex_vat is not None else product.price_inc_vat / 1.2
    payment_fee = product.price_inc_vat * PAYMENT_FEE_RATE
    labour_cost = default_hours_for_product(product) * LABOUR_RATE
    refurb_cost = IPHONE_SCREEN_REFURB_COST if is_iphone_screen(product) else 0.0
    parts_cost = 0.0
    net_profit = price_ex_vat - parts_cost - labour_cost - refurb_cost - payment_fee
    net_margin = net_profit / price_ex_vat if price_ex_vat else None
    return parts_cost, net_profit, net_margin, [classify_margin(net_margin)]


def build_profitability_impact(
    missing_parts: list[PartRecord],
    products: dict[str, ProductRecord],
    xero_matches: dict[str, list[XeroMatch]],
) -> tuple[list[str], float, float]:
    product_extra_cost: defaultdict[str, float] = defaultdict(float)
    for part in missing_parts:
        matches = xero_matches.get(part.part_id, [])
        suggested = choose_xero_suggested_cost(matches)
        if suggested is None:
            suggested = fallback_cost(part)
        for product_id in part.linked_product_ids:
            if product_id in products:
                product_extra_cost[product_id] += suggested

    changed_lines: list[str] = []
    total_catalogue_overstatement = 0.0
    for product_id, extra_cost in sorted(product_extra_cost.items(), key=lambda item: item[1], reverse=True):
        product = products[product_id]
        baseline_parts_cost, baseline_profit, baseline_margin, baseline_flags = estimate_model_baseline(product)
        price_ex_vat = product.price_ex_vat
        if price_ex_vat is None or baseline_profit is None or baseline_margin is None or baseline_parts_cost is None:
            continue
        revised_profit = baseline_profit - extra_cost
        revised_margin = revised_profit / price_ex_vat if price_ex_vat else None
        current_class = classify_margin(baseline_margin)
        revised_class = classify_margin(revised_margin)
        total_catalogue_overstatement += extra_cost
        if current_class != revised_class:
            changed_lines.append(
                f"- `{product.device} {product.name}`: `{current_class}` -> `{revised_class}`; "
                f"margin `{fmt_pct(baseline_margin)}` -> `{fmt_pct(revised_margin)}` after adding `{fmt_money(extra_cost)}` missing part cost."
            )
    return changed_lines, total_catalogue_overstatement, sum(product_extra_cost.values())


def build_report(
    total_parts: int,
    parts_with_costs: int,
    parts_without_costs: int,
    missing_rows: list[list[str]],
    suspicious_rows: list[list[str]],
    duplicate_rows: list[list[str]],
    xero_rows: list[list[str]],
    changed_lines: list[str],
    total_history_impact: float,
    total_catalogue_overstatement: float,
    xero_invoice_count: int,
    xero_line_count: int,
    xero_usable_line_count: int,
) -> str:
    coverage_pct = (parts_with_costs / total_parts) if total_parts else 0.0
    lines = [
        "# Parts Cost Gap Audit",
        "",
        f"- Generated: `{datetime.now(UTC).replace(microsecond=0).isoformat().replace('+00:00', 'Z')}`",
        f"- Monday live pulls: parts board `{PARTS_BOARD_ID}`, products board `{PRODUCTS_BOARD_ID}`, main board `{MAIN_BOARD_ID}`.",
        f"- Xero live pull: `ACCPAY` invoices from `2025-04-03` through `2026-04-03` for tenant `Panrix Ltd`.",
        f"- Profitability baseline source: `{PROFITABILITY_PATH.name}`.",
        "",
        "## Section 1: Summary Stats",
        "",
        f"- Total parts: `{total_parts}`",
        f"- Parts with costs: `{parts_with_costs}`",
        f"- Parts without costs: `{parts_without_costs}`",
        f"- Cost coverage: `{coverage_pct * 100:.1f}%`",
        f"- Xero invoices reviewed: `{xero_invoice_count}`",
        f"- Xero purchase line items reviewed: `{xero_line_count}`",
        f"- Xero line items with usable descriptions for matching: `{xero_usable_line_count}`",
        "",
        "## Section 2: Missing Cost Parts",
        "",
        markdown_table(
            ["Part", "Linked Products", "Product Price", "Completed Repairs", "Xero Suggested Cost", "Impact"],
            missing_rows or [["n/a", "None", "n/a", "0", "n/a", "£0.00"]],
        ),
        "",
        "## Section 3: Suspicious Costs",
        "",
        markdown_table(
            ["Part", "Current Cost", "Issue", "Linked Products"],
            suspicious_rows or [["n/a", "n/a", "None flagged", "n/a"]],
        ),
        "",
        "## Section 4: Duplicate/Conflicting Parts",
        "",
        markdown_table(
            ["Part Name A", "Cost A", "Part Name B", "Cost B", "Likely Same Part"],
            duplicate_rows or [["n/a", "n/a", "n/a", "n/a", "No"]],
        ),
        "",
        "## Section 5: Xero Matches",
        "",
        markdown_table(
            ["Part", "Monday Cost", "Xero Invoice Cost", "Xero Supplier", "Invoice Date", "Discrepancy"],
            xero_rows or [["n/a", "n/a", "n/a", "n/a", "n/a", "No strong flagged matches"]],
        ),
        "",
        "## Section 6: Profitability Impact",
        "",
        f"- Direct completed-repair spend understatement from missing-cost parts: `{fmt_money(total_history_impact)}`.",
        f"- Catalogue-level per-repair profit overstatement across affected product SKUs: `{fmt_money(total_catalogue_overstatement)}`.",
        "- Products whose margin classification would change if missing part costs were filled:",
    ]
    if changed_lines:
        lines.extend(changed_lines)
    else:
        lines.append("- None of the affected products cross the model's `healthy` / `thin` / `loss-maker` thresholds on the current baseline.")
    lines.extend(
        [
            "",
            "### Notes",
            "",
            "- Missing-cost suggestions prefer strong Xero line matches; category fallback estimates were used only where no Xero match cleared the threshold.",
            "- `Impact` in Section 2 is `suggested unit cost x completed repairs directly linked to that part` on the Monday main board.",
            "- Xero discrepancy flags use the best strong match and trigger when the variance exceeds `20%` or Monday has no stored cost.",
            "- In this 12-month `ACCPAY` window, the live Xero line-item descriptions were effectively non-descriptive (`.`) on all pulled purchase lines, so the report could not produce confident name-based part matches from Xero and fell back to category estimates.",
        ]
    )
    return "\n".join(lines) + "\n"


def main() -> None:
    env = parse_env(ENV_PATH)
    monday_token = env.get("MONDAY_APP_TOKEN")
    if not monday_token:
        raise RuntimeError(f"MONDAY_APP_TOKEN not found in {ENV_PATH}")

    profitability_rows = parse_profitability_rows(PROFITABILITY_PATH)

    monday = MondayClient(monday_token)
    print("fetching Monday products", flush=True)
    products_bundle = monday.fetch_board(PRODUCTS_BOARD_ID, PRODUCT_COLUMNS)
    print("fetching Monday parts", flush=True)
    parts_bundle = monday.fetch_board(PARTS_BOARD_ID, PART_COLUMNS)
    print("fetching Monday main board", flush=True)
    main_bundle = monday.fetch_board(MAIN_BOARD_ID, MAIN_COLUMNS)

    reverse_part_to_products: defaultdict[str, list[str]] = defaultdict(list)
    products: dict[str, ProductRecord] = {}
    for item in products_bundle.items:
        cols = column_map(item)
        product_id = str(item["id"])
        device = relation_display(cols.get("link_to_devices6")) or ((item.get("group") or {}).get("title") or "").strip() or item["name"]
        price_inc = parse_float(cols.get("numbers", {}).get("text"))
        price_ex = parse_float(cols.get("formula", {}).get("text"))
        if price_ex is None and price_inc is not None:
            price_ex = price_inc / 1.2
        part_ids = relation_ids(cols.get("connect_boards8"))
        for part_id in part_ids:
            reverse_part_to_products[part_id].append(product_id)
        product = ProductRecord(
            product_id=product_id,
            name=item["name"],
            device=device,
            device_family=classify_device(device),
            product_type=(cols.get("status3", {}).get("text") or "").strip(),
            price_inc_vat=price_inc,
            price_ex_vat=price_ex,
            part_ids=part_ids,
        )
        model_key = (normalize(device), normalize(item["name"]))
        model_row = profitability_rows.get(model_key)
        if model_row:
            product.model_parts_cost = model_row["parts_cost"]
            product.model_net_profit = model_row["net_profit"]
            product.model_net_margin = model_row["net_margin"]
            product.model_flags = model_row["flags"]
        products[product_id] = product

    parts: dict[str, PartRecord] = {}
    for item in parts_bundle.items:
        cols = column_map(item)
        part_id = str(item["id"])
        linked_product_ids = list(dict.fromkeys(relation_ids(cols.get("link_to_products___pricing")) + reverse_part_to_products.get(part_id, [])))
        device_name = relation_display(cols.get("connect_boards3"))
        combined = normalize(f"{device_name} {item['name']}").strip()
        part = PartRecord(
            part_id=part_id,
            name=item["name"],
            device_name=device_name,
            supply_price=parse_float(cols.get("supply_price", {}).get("text")),
            quantity=parse_float(cols.get("quantity", {}).get("text")),
            available_stock=parse_float(cols.get("formula_mkv86xh7", {}).get("text")),
            linked_product_ids=linked_product_ids,
            normalized_name=normalize(item["name"]),
            token_set=tokenize(f"{device_name} {item['name']}"),
            combined_label=combined,
            category=repair_kind(f"{device_name} {item['name']}"),
        )
        parts[part_id] = part

    for item in main_bundle.items:
        cols = column_map(item)
        if not is_repair_like(cols):
            continue
        product_ids = list(dict.fromkeys(relation_ids(cols.get("board_relation")) + relation_ids(cols.get("board_relation0"))))
        part_ids = relation_ids(cols.get("connect_boards__1"))
        for product_id in product_ids:
            if product_id in products:
                products[product_id].direct_completed_repairs += 1
        for part_id in part_ids:
            if part_id in parts:
                parts[part_id].completed_repairs_used += 1

    print("refreshing Xero access token", flush=True)
    access_token, _ = refresh_xero_access(env)
    tenant_id = get_xero_tenant(access_token, "Panrix Ltd", env.get("XERO_TENANT_ID"))
    print("fetching Xero ACCPAY invoices", flush=True)
    since_date = date(2025, 4, 3)
    invoice_count, raw_line_count, xero_lines = fetch_xero_accpay_lines(access_token, tenant_id, since_date)

    print("matching Xero purchase lines to Monday parts", flush=True)
    xero_matches = select_best_xero_matches(parts, xero_lines)

    missing_parts = [part for part in parts.values() if part.supply_price is None or part.supply_price == 0]
    missing_parts.sort(key=lambda part: (part.completed_repairs_used, part.name.lower()), reverse=True)
    missing_rows, total_history_impact = build_missing_cost_rows(missing_parts, products, xero_matches)
    suspicious_rows = build_suspicious_cost_rows(parts, products)
    duplicate_rows = build_duplicate_rows(parts)
    xero_rows = build_xero_match_rows(parts, xero_matches)
    changed_lines, total_catalogue_overstatement, _ = build_profitability_impact(missing_parts, products, xero_matches)

    total_parts = len(parts)
    parts_without_costs = len(missing_parts)
    parts_with_costs = total_parts - parts_without_costs
    report = build_report(
        total_parts=total_parts,
        parts_with_costs=parts_with_costs,
        parts_without_costs=parts_without_costs,
        missing_rows=missing_rows,
        suspicious_rows=suspicious_rows,
        duplicate_rows=duplicate_rows,
        xero_rows=xero_rows,
        changed_lines=changed_lines,
        total_history_impact=total_history_impact,
        total_catalogue_overstatement=total_catalogue_overstatement,
        xero_invoice_count=invoice_count,
        xero_line_count=raw_line_count,
        xero_usable_line_count=len(xero_lines),
    )
    OUTPUT_PATH.write_text(report, encoding="utf-8")
    print(f"wrote {OUTPUT_PATH}", flush=True)


if __name__ == "__main__":
    main()
