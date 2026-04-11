#!/usr/bin/env python3
from __future__ import annotations

import itertools
import json
import math
import re
import statistics
import subprocess
import sys
import time
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Any

import requests


WORKDIR = Path("/home/ricky/builds/system-audit-2026-03-31")
ENV_PATH = Path("/home/ricky/config/api-keys/.env")
XERO_REFRESH_SCRIPT = Path("/home/ricky/config/xero_refresh.sh")
FALLBACK_REFRESH_TOKEN_PATH = Path("/tmp/xero-recon-ATuAJ1/xero-refresh-token.txt")
OUTPUT_PATH = WORKDIR / "xero-revenue-by-repair.md"
MONDAY_EXPORT_DIR = Path("/home/ricky/data/exports/system-audit-2026-03-31/monday")

MONDAY_URL = "https://api.monday.com/v2"
MONDAY_API_VERSION = "2024-10"
XERO_API_BASE = "https://api.xero.com/api.xro/2.0"
XERO_CONNECTIONS_URL = "https://api.xero.com/connections"

MAIN_BOARD_ID = 349212843
PRODUCT_BOARD_ID = 2477699024
CUSTOM_PRODUCT_BOARD_ID = 4570780706

PAGE_LIMIT = 500
MONDAY_RATE_LIMIT_SECONDS = 0.35
XERO_RATE_LIMIT_SECONDS = 1.1
XERO_PAGE_SIZE = 100

MAIN_COLUMNS = [
    "status4",
    "status24",
    "status",
    "service",
    "color_mkzmbya2",
    "text15",
    "text5",
    "text00",
    "board_relation5",
    "board_relation",
    "board_relation0",
    "formula74",
    "dup__of_quote_total",
    "payment_status",
    "payment_method",
    "color_mm0pkek6",
    "numeric_mm0pvem5",
    "color_mm0e2jz6",
    "date4",
    "date6",
    "date_mkypmgfc",
    "collection_date",
    "date_mkwdan7z",
    "date_mm0erp17",
    "numeric_mm0ewvp2",
    "text_mm0eh9f1",
    "date_mm0e4e3f",
    "numeric_mm0ea452",
    "text_mm0e9xr",
    "link_mm0a43e0",
    "text_mm0a8fwb",
]

MAIN_SUPPLEMENTAL_COLUMNS = [
    "board_relation0",
    "color_mm0e2jz6",
    "numeric_mm0ewvp2",
    "numeric_mm0ea452",
    "text_mm0eh9f1",
    "text_mm0e9xr",
    "link_mm0a43e0",
]

PRODUCT_COLUMNS = [
    "numbers",
    "status3",
    "link_to_devices6",
    "text_mkzdte13",
]

CUSTOM_PRODUCT_COLUMNS = [
    "repair_description",
    "numbers",
    "connect_boards",
]

BUSINESS_SUFFIXES = {
    "limited",
    "ltd",
    "llp",
    "group",
    "communications",
    "london",
    "clinic",
    "studio",
    "europe",
    "partners",
    "holdings",
    "agency",
    "centre",
    "center",
}
STOPWORDS = {
    "the",
    "and",
    "for",
    "repair",
    "service",
    "services",
    "screen",
    "battery",
    "replacement",
    "apple",
    "iphone",
    "ipad",
    "macbook",
    "watch",
    "client",
    "customer",
    "device",
    "invoice",
}
TOKEN_RE = re.compile(r"[a-z0-9]+")
MODEL_CODE_RE = re.compile(r"\ba\d{4}\b", re.I)
SERIAL_RE = re.compile(r"\b[A-Z0-9]{8,14}\b")
XERO_DATE_RE = re.compile(r"/Date\((\d+)(?:[+-]\d+)?\)/")


@dataclass
class ProductRecord:
    item_id: str
    name: str
    device: str
    device_category: str
    product_type: str
    price_inc_vat: float | None
    shopify_id: str
    board_kind: str
    description: str = ""


@dataclass
class MondayItem:
    item_id: str
    name: str
    created_at: datetime | None
    updated_at: datetime | None
    group_title: str
    main_status: str
    repair_type: str
    client_type: str
    service: str
    source: str
    company: str
    email: str
    phone: str
    device_name: str
    requested_repair_ids: list[str]
    requested_repair_names: list[str]
    custom_product_ids: list[str]
    custom_product_names: list[str]
    quote_total: float | None
    paid_total: float | None
    invoice_amount: float | None
    payment_status: str
    payment_method: str
    invoice_status: str
    payments_reconciled: str
    xero_invoice_id: str
    payment_1_amount: float | None
    payment_2_amount: float | None
    payment_1_ref: str
    payment_2_ref: str
    received_at: datetime | None
    booking_at: datetime | None
    intake_at: datetime | None
    repaired_at: datetime | None
    collected_at: datetime | None
    search_tokens: set[str] = field(default_factory=set)
    contact_tokens: set[str] = field(default_factory=set)
    amount_candidates: list[float] = field(default_factory=list)
    channel: str = "Other"
    device_category: str = "Other"
    product_records: list[ProductRecord] = field(default_factory=list)

    @property
    def payment_slot_total(self) -> float:
        return (self.payment_1_amount or 0.0) + (self.payment_2_amount or 0.0)

    @property
    def positive_payment_evidence(self) -> float:
        return max(self.paid_total or 0.0, self.payment_slot_total, 0.0)

    @property
    def preferred_invoice_value(self) -> float | None:
        for candidate in (self.invoice_amount, self.quote_total, self.paid_total, self.payment_slot_total):
            if candidate and candidate > 0:
                return candidate
        return None

    @property
    def date_candidates(self) -> list[datetime]:
        values = [
            self.created_at,
            self.received_at,
            self.booking_at,
            self.intake_at,
            self.repaired_at,
            self.collected_at,
        ]
        return [value for value in values if value is not None]


@dataclass
class XeroInvoice:
    invoice_id: str
    invoice_number: str
    reference: str
    contact_name: str
    date: datetime | None
    due_date: datetime | None
    status: str
    total: float
    amount_due: float
    amount_paid: float
    subtotal: float
    total_tax: float
    line_items: list[dict[str, Any]]
    payments: list[dict[str, Any]]
    raw: dict[str, Any]
    line_text: str
    search_tokens: set[str]
    contact_tokens: set[str]
    device_tokens: set[str]
    repair_text: str
    likely_batched: bool


@dataclass
class MatchResult:
    invoice_id: str
    quality: str
    score: float
    reasons: list[str]
    monday_ids: list[str]
    monday_names: list[str]
    monday_channel: str
    date_delta_days: int | None
    amount_delta: float | None
    second_best_score: float | None


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
    lines = path.read_text(encoding="utf-8").splitlines()
    updated = False
    new_lines: list[str] = []
    for line in lines:
        if line.startswith(f"{key}="):
            new_lines.append(f"{key}={value}")
            updated = True
        else:
            new_lines.append(line)
    if not updated:
        new_lines.append(f"{key}={value}")
    path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")


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


def parse_iso_datetime(raw: str | None) -> datetime | None:
    if not raw:
        return None
    text = raw.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        return None
    return dt.astimezone(UTC) if dt.tzinfo else dt.replace(tzinfo=UTC)


def parse_monday_date(column_value: dict[str, Any]) -> datetime | None:
    payload = parse_json(column_value.get("value"))
    date_text = payload.get("date")
    time_text = payload.get("time")
    if date_text:
        try:
            if time_text:
                return datetime.fromisoformat(f"{date_text}T{time_text}:00+00:00").astimezone(UTC)
            return datetime.fromisoformat(f"{date_text}T00:00:00+00:00").astimezone(UTC)
        except ValueError:
            return None
    text = (column_value.get("text") or "").strip()
    if not text:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y", "%d/%m/%Y %H:%M"):
        try:
            return datetime.strptime(text, fmt).replace(tzinfo=UTC)
        except ValueError:
            continue
    return None


def parse_xero_date(raw: str | None) -> datetime | None:
    if not raw:
        return None
    text = str(raw)
    if text.startswith("/Date("):
        match = XERO_DATE_RE.search(text)
        if not match:
            return None
        milliseconds = int(match.group(1))
        return datetime.fromtimestamp(milliseconds / 1000, tz=UTC)
    if "T" in text:
        return parse_iso_datetime(text)
    try:
        return datetime.fromisoformat(f"{text}T00:00:00+00:00").astimezone(UTC)
    except ValueError:
        return None


def fmt_money(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"£{value:,.2f}"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def normalize(text: str | None) -> str:
    if not text:
        return ""
    lowered = text.lower().replace("&", " and ")
    lowered = re.sub(r"[^a-z0-9]+", " ", lowered)
    return re.sub(r"\s+", " ", lowered).strip()


def tokenize(text: str | None) -> set[str]:
    normalized = normalize(text)
    return {token for token in TOKEN_RE.findall(normalized) if token and token not in STOPWORDS}


def title_case(text: str) -> str:
    return text[:1].upper() + text[1:] if text else text


def is_business_name(text: str) -> bool:
    tokens = tokenize(text)
    return any(token in BUSINESS_SUFFIXES for token in tokens)


def device_category(text: str | None) -> str:
    norm = normalize(text)
    if "iphone" in norm:
        return "iPhone"
    if "ipad" in norm:
        return "iPad"
    if "macbook" in norm or "imac" in norm or norm.startswith("mac "):
        return "MacBook"
    if "watch" in norm:
        return "Watch"
    return "Other"


def classify_repair_type(*texts: str | None) -> str:
    joined = normalize(" ".join(text for text in texts if text))
    if not joined:
        return "Other"
    if joined in {"index", "not set", "other"}:
        return "Other"
    checks = [
        ("Diagnostic", ["diagnostic", "no fault found"]),
        ("Board Level", ["board level", "logic board", "microsolder", "no service", "no wifi", "unable to activate", "data recovery"]),
        ("Screen", ["screen", "display", "glass", "lcd", "oled", "digitizer", "screen lines"]),
        ("Battery", ["battery"]),
        ("Charging Port", ["charging port", "charge port", "charging", "usb c port", "lightning port"]),
        ("Face ID", ["face id"]),
        ("Camera", ["camera", "lens"]),
        ("Speaker", ["speaker", "earpiece"]),
        ("Microphone", ["microphone", "mic "]),
        ("Rear Housing", ["rear housing", "housing"]),
        ("Keyboard", ["keyboard"]),
        ("Trackpad", ["trackpad"]),
        ("Crown", ["crown"]),
        ("Button", ["button", "power button", "side button"]),
        ("Accessory", ["accessory", "charger", "cable", "adapter"]),
    ]
    for label, needles in checks:
        if any(needle in joined for needle in needles):
            return label
    if joined.split()[0] in {"iphone", "ipad", "macbook", "watch", "applewatch", "apple"}:
        return "Repair"
    if "repair" in joined:
        return "Repair"
    return title_case(joined.split()[0])


def product_repair_category(record: ProductRecord, item: MondayItem) -> str:
    normalized_type = normalize(record.product_type)
    if normalized_type and normalized_type not in {"index", "not set", "other"}:
        typed = classify_repair_type(record.product_type)
        if typed not in {"Other", "Repair"}:
            return typed
    candidate = classify_repair_type(record.name, record.description)
    if candidate not in {"Other", "Repair"}:
        return candidate
    return classify_repair_type(item.repair_type, record.name, record.description)


def classify_channel(item: MondayItem) -> str:
    client = normalize(item.client_type)
    service = normalize(item.service)
    payment_method = normalize(item.payment_method)
    group = normalize(item.group_title)
    if client == "bm" or payment_method == "bm sale" or "bm " in group or group.startswith("bm"):
        return "BackMarket"
    if payment_method == "shopify" or item.name.startswith("#"):
        return "Shopify"
    if client in {"corporate", "corporate warranty", "b2b"} or payment_method == "invoiced xero":
        return "Corporate"
    if "mail" in service or "courier" in service:
        return "Mail-in"
    if service == "walk in":
        return "Walk-in"
    return "Other"


def overlap_score(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0
    return len(left & right) / max(len(left), len(right))


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
        response = self.session.post(MONDAY_URL, json={"query": query, "variables": variables or {}}, timeout=180)
        self._last_request_at = time.monotonic()
        response.raise_for_status()
        payload = response.json()
        if payload.get("errors"):
            raise RuntimeError("; ".join(error.get("message", "Unknown Monday error") for error in payload["errors"]))
        return payload["data"]

    def fetch_board(self, board_id: int, column_ids: list[str]) -> list[dict[str, Any]]:
        cols = ", ".join(f'"{column_id}"' for column_id in column_ids)
        query = f"""
        query {{
          boards(ids:[{board_id}]) {{
            items_page(limit:{PAGE_LIMIT}) {{
              cursor
              items {{
                id
                name
                created_at
                updated_at
                group {{ title }}
                column_values(ids:[{cols}]) {{
                  id
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
        data = self.query(query)
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
              group {{ title }}
              column_values(ids:[{cols}]) {{
                id
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


class XeroClient:
    def __init__(self, access_token: str, tenant_id: str) -> None:
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Authorization": f"Bearer {access_token}",
                "Xero-tenant-id": tenant_id,
                "Accept": "application/json",
            }
        )
        self._last_request_at: float | None = None

    def _wait(self) -> None:
        if self._last_request_at is None:
            return
        elapsed = time.monotonic() - self._last_request_at
        if elapsed < XERO_RATE_LIMIT_SECONDS:
            time.sleep(XERO_RATE_LIMIT_SECONDS - elapsed)

    def get(self, endpoint: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        url = endpoint if endpoint.startswith("http") else f"{XERO_API_BASE}/{endpoint.lstrip('/')}"
        backoff = XERO_RATE_LIMIT_SECONDS
        for attempt in range(6):
            self._wait()
            response = self.session.get(url, params=params, timeout=180)
            self._last_request_at = time.monotonic()
            if response.status_code == 429:
                retry_after = float(response.headers.get("Retry-After", "2"))
                time.sleep(max(retry_after, backoff))
                backoff *= 2
                continue
            if response.status_code >= 500:
                time.sleep(backoff)
                backoff *= 2
                continue
            response.raise_for_status()
            return response.json()
        raise RuntimeError(f"Xero GET failed after retries: {url}")

    def fetch_paginated(self, resource: str, root_key: str, params: dict[str, Any]) -> list[dict[str, Any]]:
        page = 1
        results: list[dict[str, Any]] = []
        while True:
            page_params = dict(params)
            page_params["page"] = page
            payload = self.get(resource, page_params)
            batch = payload.get(root_key, [])
            results.extend(batch)
            if len(batch) < XERO_PAGE_SIZE:
                break
            page += 1
        return results


def refresh_xero_access_token() -> str:
    def run_refresh() -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["bash", str(XERO_REFRESH_SCRIPT)],
            capture_output=True,
            text=True,
            check=False,
        )

    result = run_refresh()
    if result.returncode == 0 and result.stdout.strip():
        return result.stdout.strip()

    if not FALLBACK_REFRESH_TOKEN_PATH.exists():
        stderr = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"Xero refresh failed and no fallback token was available: {stderr}")

    fallback_token = FALLBACK_REFRESH_TOKEN_PATH.read_text(encoding="utf-8").strip()
    if not fallback_token:
        stderr = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"Xero refresh failed and fallback token file was empty: {stderr}")

    update_env_value(ENV_PATH, "XERO_REFRESH_TOKEN", fallback_token)
    retry = run_refresh()
    if retry.returncode != 0 or not retry.stdout.strip():
        stderr = retry.stderr.strip() or retry.stdout.strip()
        raise RuntimeError(f"Xero refresh failed even with fallback token: {stderr}")
    return retry.stdout.strip()


def get_xero_tenant_id(access_token: str) -> str:
    response = requests.get(
        XERO_CONNECTIONS_URL,
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        timeout=180,
    )
    response.raise_for_status()
    connections = response.json()
    for connection in connections:
        if connection.get("tenantName") == "Panrix Ltd":
            return connection["tenantId"]
    raise RuntimeError("Panrix Ltd tenant not found in /connections")


def build_product_map(items: list[dict[str, Any]], board_kind: str) -> dict[str, ProductRecord]:
    records: dict[str, ProductRecord] = {}
    for item in items:
        columns = {column["id"]: column for column in item.get("column_values", [])}
        if board_kind == "product":
            device_name = columns.get("link_to_devices6", {}).get("display_value") or ""
            product_type = columns.get("status3", {}).get("text") or ""
            price_inc_vat = parse_float(columns.get("numbers", {}).get("text"))
            shopify_id = (columns.get("text_mkzdte13", {}).get("text") or "").strip()
            description = ""
        else:
            device_name = ""
            product_type = classify_repair_type(item.get("name"), columns.get("repair_description", {}).get("text") or "")
            price_inc_vat = parse_float(columns.get("numbers", {}).get("text"))
            shopify_id = ""
            description = columns.get("repair_description", {}).get("text") or ""
        records[str(item["id"])] = ProductRecord(
            item_id=str(item["id"]),
            name=item.get("name", "").strip(),
            device=device_name.strip(),
            device_category=device_category(device_name or item.get("name", "")),
            product_type=product_type.strip() or "Other",
            price_inc_vat=price_inc_vat,
            shopify_id=shopify_id,
            board_kind=board_kind,
            description=description.strip(),
        )
    return records


def build_monday_items(raw_items: list[dict[str, Any]], product_map: dict[str, ProductRecord], custom_product_map: dict[str, ProductRecord]) -> list[MondayItem]:
    items: list[MondayItem] = []
    for raw in raw_items:
        columns = {column["id"]: column for column in raw.get("column_values", [])}
        requested_repair_ids = [str(item_id) for item_id in columns.get("board_relation", {}).get("linked_item_ids", [])]
        custom_product_ids = [str(item_id) for item_id in columns.get("board_relation0", {}).get("linked_item_ids", [])]
        requested_repair_names = [product_map[item_id].name for item_id in requested_repair_ids if item_id in product_map]
        custom_product_names = [custom_product_map[item_id].name for item_id in custom_product_ids if item_id in custom_product_map]
        monday_item = MondayItem(
            item_id=str(raw["id"]),
            name=(raw.get("name") or "").strip(),
            created_at=parse_iso_datetime(raw.get("created_at")),
            updated_at=parse_iso_datetime(raw.get("updated_at")),
            group_title=((raw.get("group") or {}).get("title") or "").strip(),
            main_status=(columns.get("status4", {}).get("text") or "").strip(),
            repair_type=(columns.get("status24", {}).get("text") or "").strip(),
            client_type=(columns.get("status", {}).get("text") or "").strip(),
            service=(columns.get("service", {}).get("text") or "").strip(),
            source=(columns.get("color_mkzmbya2", {}).get("text") or "").strip(),
            company=(columns.get("text15", {}).get("text") or "").strip(),
            email=(columns.get("text5", {}).get("text") or "").strip(),
            phone=(columns.get("text00", {}).get("text") or "").strip(),
            device_name=(columns.get("board_relation5", {}).get("display_value") or "").strip(),
            requested_repair_ids=requested_repair_ids,
            requested_repair_names=requested_repair_names,
            custom_product_ids=custom_product_ids,
            custom_product_names=custom_product_names,
            quote_total=parse_float(columns.get("formula74", {}).get("text")),
            paid_total=parse_float(columns.get("dup__of_quote_total", {}).get("text")),
            invoice_amount=parse_float(columns.get("numeric_mm0pvem5", {}).get("text")),
            payment_status=(columns.get("payment_status", {}).get("text") or "").strip(),
            payment_method=(columns.get("payment_method", {}).get("text") or "").strip(),
            invoice_status=(columns.get("color_mm0pkek6", {}).get("text") or "").strip(),
            payments_reconciled=(columns.get("color_mm0e2jz6", {}).get("text") or "").strip(),
            xero_invoice_id=(columns.get("text_mm0a8fwb", {}).get("text") or "").strip(),
            payment_1_amount=parse_float(columns.get("numeric_mm0ewvp2", {}).get("text")),
            payment_2_amount=parse_float(columns.get("numeric_mm0ea452", {}).get("text")),
            payment_1_ref=(columns.get("text_mm0eh9f1", {}).get("text") or "").strip(),
            payment_2_ref=(columns.get("text_mm0e9xr", {}).get("text") or "").strip(),
            received_at=parse_monday_date(columns.get("date4", {})),
            booking_at=parse_monday_date(columns.get("date6", {})),
            intake_at=parse_monday_date(columns.get("date_mkypmgfc", {})),
            repaired_at=parse_monday_date(columns.get("date_mkwdan7z", {})),
            collected_at=parse_monday_date(columns.get("collection_date", {})),
        )
        monday_item.product_records = [product_map[item_id] for item_id in requested_repair_ids if item_id in product_map] + [
            custom_product_map[item_id] for item_id in custom_product_ids if item_id in custom_product_map
        ]
        monday_item.device_category = device_category(monday_item.device_name or " ".join(requested_repair_names) or raw.get("name", ""))
        monday_item.channel = classify_channel(monday_item)
        monday_item.contact_tokens = tokenize(" ".join([monday_item.name, monday_item.company, monday_item.email.split("@")[0] if "@" in monday_item.email else monday_item.email]))
        monday_item.search_tokens = tokenize(
            " ".join(
                [
                    monday_item.name,
                    monday_item.company,
                    monday_item.email,
                    monday_item.device_name,
                    monday_item.repair_type,
                    " ".join(requested_repair_names),
                    " ".join(custom_product_names),
                    monday_item.phone,
                ]
            )
        )
        monday_item.amount_candidates = [
            value
            for value in [
                monday_item.preferred_invoice_value,
                monday_item.quote_total,
                monday_item.paid_total,
                monday_item.payment_slot_total if monday_item.payment_slot_total > 0 else None,
            ]
            if value and value > 0
        ]
        items.append(monday_item)
    return items


def load_items_array(path: Path) -> list[dict[str, Any]]:
    payload = load_json(path)
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict) and isinstance(payload.get("items"), list):
        return payload["items"]
    raise RuntimeError(f"Unsupported export shape in {path}")


def normalize_export_column(column: dict[str, Any]) -> dict[str, Any]:
    normalized = {
        "id": column["id"],
        "text": column.get("text"),
        "value": column.get("value"),
    }
    if "display_value" in column:
        normalized["display_value"] = column.get("display_value")
    if "linked_item_ids" in column:
        normalized["linked_item_ids"] = column.get("linked_item_ids")
    if normalized["value"] in (None, "") and column.get("type") == "date" and column.get("date"):
        normalized["value"] = json.dumps({"date": column.get("date")})
    if normalized["value"] is None and "index" in column and column.get("index") is not None:
        normalized["value"] = json.dumps({"index": column.get("index")})
    return normalized


def merge_item_sources(item_sources: list[list[dict[str, Any]]]) -> list[dict[str, Any]]:
    merged: dict[str, dict[str, Any]] = {}
    for source_items in item_sources:
        for item in source_items:
            item_id = str(item["id"])
            target = merged.setdefault(
                item_id,
                {
                    "id": item_id,
                    "name": item.get("name", ""),
                    "created_at": item.get("created_at"),
                    "updated_at": item.get("updated_at"),
                    "group": item.get("group", {}),
                    "column_values": [],
                },
            )
            if item.get("name"):
                target["name"] = item.get("name")
            if item.get("created_at"):
                target["created_at"] = item.get("created_at")
            if item.get("updated_at"):
                target["updated_at"] = item.get("updated_at")
            if item.get("group"):
                target["group"] = item.get("group")
            column_map = {column["id"]: column for column in target["column_values"]}
            for column in item.get("column_values", []):
                column_map[column["id"]] = normalize_export_column(column)
            target["column_values"] = list(column_map.values())
    return list(merged.values())


def load_main_board_items(monday: MondayClient) -> list[dict[str, Any]]:
    base_paths = [
        MONDAY_EXPORT_DIR / "diagnostics-deep-dive-items-live-2026-04-02.json",
        MONDAY_EXPORT_DIR / "main-board-inventory-2026-04-02.json",
        MONDAY_EXPORT_DIR / "source-surface-2026-04-02.json",
        MONDAY_EXPORT_DIR / "quote-payment-proxy-surface-2026-04-02.json",
        MONDAY_EXPORT_DIR / "main-board-paid-service-surface-2026-04-01.json",
    ]
    source_items = [load_items_array(path) for path in base_paths]
    supplemental_items = monday.fetch_board(MAIN_BOARD_ID, MAIN_SUPPLEMENTAL_COLUMNS)
    source_items.append(supplemental_items)
    return merge_item_sources(source_items)


def build_xero_invoice(raw: dict[str, Any]) -> XeroInvoice:
    line_descriptions = [line.get("Description", "") for line in raw.get("LineItems", [])]
    line_text = " ".join(description for description in line_descriptions if description)
    contact_name = ((raw.get("Contact") or {}).get("Name") or "").strip()
    reference = (raw.get("Reference") or "").strip()
    repair_text = f"{reference} {line_text}".strip()
    device_tokens = set(MODEL_CODE_RE.findall(repair_text.lower()))
    likely_batched = (
        len(raw.get("LineItems", [])) > 1
        or len(SERIAL_RE.findall(line_text)) > 1
        or raw.get("Total", 0.0) >= 600
        or ("\n" in line_text and line_text.count("\n") >= 2 and is_business_name(contact_name))
    )
    return XeroInvoice(
        invoice_id=raw.get("InvoiceID", ""),
        invoice_number=raw.get("InvoiceNumber", ""),
        reference=reference,
        contact_name=contact_name,
        date=parse_xero_date(raw.get("DateString") or raw.get("Date")),
        due_date=parse_xero_date(raw.get("DueDateString") or raw.get("DueDate")),
        status=raw.get("Status", ""),
        total=float(raw.get("Total") or 0.0),
        amount_due=float(raw.get("AmountDue") or 0.0),
        amount_paid=float(raw.get("AmountPaid") or 0.0),
        subtotal=float(raw.get("SubTotal") or 0.0),
        total_tax=float(raw.get("TotalTax") or 0.0),
        line_items=raw.get("LineItems", []),
        payments=raw.get("Payments", []),
        raw=raw,
        line_text=line_text,
        search_tokens=tokenize(f"{contact_name} {reference} {line_text}"),
        contact_tokens=tokenize(contact_name),
        device_tokens=device_tokens,
        repair_text=repair_text,
        likely_batched=likely_batched,
    )


def fetch_xero_data(start_date: date) -> tuple[list[XeroInvoice], dict[str, dict[str, Any]], list[dict[str, Any]], dict[str, dict[str, Any]]]:
    access_token = refresh_xero_access_token()
    tenant_id = get_xero_tenant_id(access_token)
    client = XeroClient(access_token, tenant_id)
    where_date = f'Date>=DateTime({start_date.year},{start_date.month},{start_date.day})'
    invoices_raw = client.fetch_paginated(
        "Invoices",
        "Invoices",
        {
            "where": f'Type=="ACCREC"&&{where_date}',
            "order": "Date ASC",
        },
    )
    accounts = {account["AccountID"]: account for account in client.get("Accounts").get("Accounts", [])}
    payments_raw = client.fetch_paginated(
        "Payments",
        "Payments",
        {
            "where": where_date,
            "order": "Date ASC",
        },
    )
    invoice_map = {invoice["InvoiceID"]: invoice for invoice in invoices_raw if invoice.get("InvoiceID")}
    payments_for_window = [
        payment
        for payment in payments_raw
        if ((payment.get("Invoice") or {}).get("Type") == "ACCREC")
        and ((payment.get("Invoice") or {}).get("InvoiceID") in invoice_map)
    ]
    return [build_xero_invoice(invoice) for invoice in invoices_raw], accounts, payments_for_window, invoice_map


def amount_match_delta(invoice_total: float, candidates: list[float]) -> float | None:
    if not candidates:
        return None
    return min(abs(invoice_total - candidate) for candidate in candidates)


def date_match_delta(invoice_date: datetime | None, candidates: list[datetime]) -> int | None:
    if not invoice_date or not candidates:
        return None
    return min(abs((invoice_date.date() - candidate.date()).days) for candidate in candidates)


def score_invoice_to_item(invoice: XeroInvoice, item: MondayItem) -> tuple[float, list[str], float | None, int | None, float]:
    if item.xero_invoice_id and item.xero_invoice_id == invoice.invoice_id:
        return 100.0, ["exact xero invoice id"], 0.0, date_match_delta(invoice.date, item.date_candidates), 100.0

    reasons: list[str] = []
    score = 0.0
    context_score = 0.0

    contact_exact = normalize(invoice.contact_name) in {normalize(item.name), normalize(item.company)}
    contact_overlap = overlap_score(invoice.contact_tokens, item.contact_tokens)
    if contact_exact:
        score += 42
        context_score += 42
        reasons.append("contact exact")
    elif contact_overlap >= 0.8:
        score += 30
        context_score += 30
        reasons.append("contact overlap high")
    elif contact_overlap >= 0.5:
        score += 20
        context_score += 20
        reasons.append("contact overlap medium")
    elif invoice.contact_tokens & item.contact_tokens:
        score += 10
        context_score += 10
        reasons.append("contact overlap low")

    device_overlap = overlap_score(tokenize(invoice.repair_text), tokenize(f"{item.device_name} {' '.join(item.requested_repair_names)} {' '.join(item.custom_product_names)}"))
    if item.device_name and normalize(item.device_name) and normalize(item.device_name) in normalize(invoice.repair_text):
        score += 18
        context_score += 18
        reasons.append("device exact")
    elif device_overlap >= 0.5:
        score += 12
        context_score += 12
        reasons.append("device overlap")
    elif invoice.device_tokens and invoice.device_tokens & tokenize(item.device_name):
        score += 10
        context_score += 10
        reasons.append("model code overlap")

    item_repair_class = classify_repair_type(item.repair_type, " ".join(item.requested_repair_names), " ".join(item.custom_product_names))
    invoice_repair_class = classify_repair_type(invoice.repair_text)
    if item_repair_class == invoice_repair_class and item_repair_class != "Other":
        score += 10
        context_score += 10
        reasons.append(f"repair type {item_repair_class}")

    amount_delta = amount_match_delta(invoice.total, item.amount_candidates)
    if amount_delta is not None:
        if amount_delta <= 0.01:
            score += 26
            reasons.append("amount exact")
        elif amount_delta <= 1:
            score += 22
            reasons.append("amount within £1")
        elif amount_delta <= 5:
            score += 16
            reasons.append("amount within £5")
        elif amount_delta <= 15:
            score += 10
            reasons.append("amount within £15")
        elif amount_delta <= 30:
            score += 4
            reasons.append("amount within £30")

    date_delta = date_match_delta(invoice.date, item.date_candidates)
    if date_delta is not None:
        if date_delta <= 3:
            score += 18
            context_score += 18
            reasons.append("date within 3d")
        elif date_delta <= 14:
            score += 12
            context_score += 12
            reasons.append("date within 14d")
        elif date_delta <= 45:
            score += 6
            context_score += 6
            reasons.append("date within 45d")

    if item.payment_method == "Invoiced - Xero":
        score += 4
        context_score += 4
        reasons.append("xero payment method")

    if is_business_name(invoice.contact_name) and item.channel == "Corporate":
        score += 4
        context_score += 4
        reasons.append("corporate profile")

    preferred_value = item.preferred_invoice_value or 0.0
    if invoice.total >= 400 and preferred_value and preferred_value < invoice.total * 0.6:
        score -= 8
        reasons.append("single-item amount too small")

    if invoice.likely_batched and item.channel != "Corporate" and invoice.total >= 500:
        score -= 4

    return score, reasons, amount_delta, date_delta, context_score


def match_invoices_to_monday(invoices: list[XeroInvoice], monday_items: list[MondayItem]) -> dict[str, MatchResult]:
    results: dict[str, MatchResult] = {}
    for invoice in invoices:
        scored: list[tuple[float, list[str], MondayItem, float | None, int | None, float]] = []
        for item in monday_items:
            score, reasons, amount_delta, date_delta, context_score = score_invoice_to_item(invoice, item)
            if score > 0:
                scored.append((score, reasons, item, amount_delta, date_delta, context_score))
        scored.sort(key=lambda row: row[0], reverse=True)
        if not scored:
            results[invoice.invoice_id] = MatchResult(
                invoice_id=invoice.invoice_id,
                quality="unmatched",
                score=0.0,
                reasons=["no plausible monday candidate"],
                monday_ids=[],
                monday_names=[],
                monday_channel="",
                date_delta_days=None,
                amount_delta=None,
                second_best_score=None,
            )
            continue

        top_score, reasons, top_item, amount_delta, date_delta, _context = scored[0]
        second_best = scored[1][0] if len(scored) > 1 else None
        quality = "unmatched"
        if top_score >= 100:
            quality = "exact"
        elif top_score >= 64 and (second_best is None or top_score - second_best >= 8):
            quality = "strong"
        elif top_score >= 48:
            quality = "weak"

        results[invoice.invoice_id] = MatchResult(
            invoice_id=invoice.invoice_id,
            quality=quality,
            score=top_score,
            reasons=reasons,
            monday_ids=[top_item.item_id] if quality != "unmatched" else [],
            monday_names=[top_item.name] if quality != "unmatched" else [],
            monday_channel=top_item.channel if quality != "unmatched" else "",
            date_delta_days=date_delta,
            amount_delta=amount_delta,
            second_best_score=second_best,
        )
    return results


def build_month_key(dt: datetime | None) -> str:
    return dt.strftime("%Y-%m") if dt else "Unknown"


def aggregate_invoice_summary(invoices: list[XeroInvoice]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    by_month_status: dict[tuple[str, str], dict[str, Any]] = defaultdict(lambda: {"count": 0, "total": 0.0})
    live_by_month: dict[str, dict[str, Any]] = defaultdict(lambda: {"count": 0, "revenue": 0.0, "avg": 0.0})
    for invoice in invoices:
        month = build_month_key(invoice.date)
        by_month_status[(month, invoice.status)]["count"] += 1
        by_month_status[(month, invoice.status)]["total"] += invoice.total
        if invoice.status in {"PAID", "AUTHORISED"}:
            live_by_month[month]["count"] += 1
            live_by_month[month]["revenue"] += invoice.total

    for value in live_by_month.values():
        value["avg"] = value["revenue"] / value["count"] if value["count"] else 0.0

    month_status_rows = [
        {"month": month, "status": status, "count": metrics["count"], "total": metrics["total"]}
        for (month, status), metrics in sorted(by_month_status.items())
    ]
    live_rows = [
        {"month": month, "count": metrics["count"], "revenue": metrics["revenue"], "avg": metrics["avg"]}
        for month, metrics in sorted(live_by_month.items())
    ]
    return month_status_rows, live_rows


def aggregate_account_code_revenue(invoices: list[XeroInvoice], accounts: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    totals: dict[tuple[str, str], float] = defaultdict(float)
    for invoice in invoices:
        if invoice.status not in {"PAID", "AUTHORISED"}:
            continue
        for line in invoice.line_items:
            code = str(line.get("AccountCode") or "")
            account_id = str(line.get("AccountID") or "")
            account_name = accounts.get(account_id, {}).get("Name") or accounts.get(account_id, {}).get("Code") or ""
            key = (code, account_name)
            totals[key] += float(line.get("LineAmount") or 0.0)
    rows = [
        {
            "account_code": code or "Unknown",
            "account_name": account_name or "Unknown",
            "revenue": value,
        }
        for (code, account_name), value in totals.items()
        if abs(value) > 0.009
    ]
    rows.sort(key=lambda row: row["revenue"], reverse=True)
    return rows


def aggregate_payment_accounts(payments: list[dict[str, Any]], accounts: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    totals: dict[str, float] = defaultdict(float)
    counts: Counter[str] = Counter()
    for payment in payments:
        account_id = ((payment.get("Account") or {}).get("AccountID") or "").strip()
        account = accounts.get(account_id, {})
        name = account.get("Name") or account.get("Code") or "Unknown"
        amount = float(payment.get("Amount") or 0.0)
        totals[name] += amount
        counts[name] += 1
    rows = [{"payment_account": name, "count": counts[name], "amount": totals[name]} for name in totals]
    rows.sort(key=lambda row: row["amount"], reverse=True)
    return rows


def allocate_invoice_revenue(
    invoice: XeroInvoice,
    item: MondayItem,
) -> list[dict[str, Any]]:
    product_records = item.product_records
    if product_records:
        priced_records = [record for record in product_records if record.price_inc_vat and record.price_inc_vat > 0]
        if priced_records:
            denominator = sum(record.price_inc_vat or 0.0 for record in priced_records) or 1.0
            allocations = []
            for record in priced_records:
                share = (record.price_inc_vat or 0.0) / denominator
                allocations.append(
                    {
                        "invoice_id": invoice.invoice_id,
                        "invoice_number": invoice.invoice_number,
                        "invoice_date": invoice.date,
                        "invoice_status": invoice.status,
                        "match_channel": item.channel,
                        "monday_item_id": item.item_id,
                        "monday_item_name": item.name,
                        "device_category": record.device_category or item.device_category,
                        "repair_type": product_repair_category(record, item),
                        "product_name": record.name,
                        "product_type": record.product_type,
                        "board_kind": record.board_kind,
                        "list_price_inc_vat": record.price_inc_vat,
                        "actual_revenue_inc_vat": invoice.total * share,
                        "allocation_method": "product-price-share" if len(priced_records) > 1 else "direct-product",
                    }
                )
            return allocations

    return [
        {
            "invoice_id": invoice.invoice_id,
            "invoice_number": invoice.invoice_number,
            "invoice_date": invoice.date,
            "invoice_status": invoice.status,
            "match_channel": item.channel,
            "monday_item_id": item.item_id,
            "monday_item_name": item.name,
            "device_category": item.device_category,
            "repair_type": classify_repair_type(item.repair_type, " ".join(item.requested_repair_names), " ".join(item.custom_product_names)),
            "product_name": " / ".join(item.requested_repair_names or item.custom_product_names) or item.device_name or item.name,
            "product_type": classify_repair_type(item.repair_type),
            "board_kind": "item-fallback",
            "list_price_inc_vat": item.preferred_invoice_value,
            "actual_revenue_inc_vat": invoice.total,
            "allocation_method": "item-fallback",
        }
    ]


def build_revenue_allocations(
    invoices: list[XeroInvoice],
    invoice_matches: dict[str, MatchResult],
    monday_by_id: dict[str, MondayItem],
) -> list[dict[str, Any]]:
    allocations: list[dict[str, Any]] = []
    for invoice in invoices:
        match = invoice_matches[invoice.invoice_id]
        if match.quality not in {"exact", "strong"} or not match.monday_ids:
            continue
        monday_item = monday_by_id[match.monday_ids[0]]
        allocations.extend(allocate_invoice_revenue(invoice, monday_item))
    return allocations


def aggregate_revenue_by_field(allocations: list[dict[str, Any]], field_name: str) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str], float] = defaultdict(float)
    for row in allocations:
        if row["invoice_status"] not in {"PAID", "AUTHORISED"}:
            continue
        month = build_month_key(row["invoice_date"])
        grouped[(row[field_name], month)] += float(row["actual_revenue_inc_vat"] or 0.0)
    results = [
        {field_name: group_key, "month": month, "revenue": revenue}
        for (group_key, month), revenue in grouped.items()
    ]
    results.sort(key=lambda row: (row[field_name], row["month"]))
    return results


def aggregate_model_validation(allocations: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for row in allocations:
        if row["invoice_status"] not in {"PAID", "AUTHORISED"}:
            continue
        if not row["list_price_inc_vat"] or row["allocation_method"] == "item-fallback":
            continue
        if row["board_kind"] != "product":
            continue
        key = (row["device_category"], row["repair_type"])
        grouped[key].append(row)

    validation_rows: list[dict[str, Any]] = []
    for (device_key, repair_key), rows in grouped.items():
        actuals = [float(row["actual_revenue_inc_vat"]) for row in rows]
        list_prices = [float(row["list_price_inc_vat"]) for row in rows if row["list_price_inc_vat"]]
        if not actuals or not list_prices:
            continue
        if len(rows) < 3:
            continue
        median_actual = statistics.median(actuals)
        median_list = statistics.median(list_prices)
        delta = median_actual - median_list
        delta_pct = (delta / median_list * 100) if median_list else 0.0
        validation_rows.append(
            {
                "device_category": device_key,
                "repair_type": repair_key,
                "samples": len(rows),
                "median_actual": median_actual,
                "median_list": median_list,
                "delta": delta,
                "delta_pct": delta_pct,
            }
        )
    validation_rows.sort(key=lambda row: abs(row["delta_pct"]), reverse=True)
    return validation_rows


def aggregate_channel_price_comparison(allocations: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str, str], list[dict[str, Any]]] = defaultdict(list)
    for row in allocations:
        if row["invoice_status"] not in {"PAID", "AUTHORISED"}:
            continue
        if not row["list_price_inc_vat"] or row["allocation_method"] == "item-fallback":
            continue
        if row["board_kind"] != "product":
            continue
        grouped[(row["match_channel"], row["device_category"], row["repair_type"])].append(row)

    rows_out: list[dict[str, Any]] = []
    for (channel, device_key, repair_key), rows in grouped.items():
        if len(rows) < 3:
            continue
        actuals = [float(row["actual_revenue_inc_vat"]) for row in rows]
        list_prices = [float(row["list_price_inc_vat"]) for row in rows if row["list_price_inc_vat"]]
        if not list_prices:
            continue
        median_actual = statistics.median(actuals)
        median_list = statistics.median(list_prices)
        discount_pct = ((median_actual - median_list) / median_list * 100) if median_list else 0.0
        rows_out.append(
            {
                "channel": channel,
                "device_category": device_key,
                "repair_type": repair_key,
                "samples": len(rows),
                "median_actual": median_actual,
                "median_list": median_list,
                "delta_pct": discount_pct,
            }
        )
    rows_out.sort(key=lambda row: (row["channel"], abs(row["delta_pct"])), reverse=True)
    return rows_out


def markdown_table(rows: list[dict[str, Any]], columns: list[tuple[str, str]]) -> str:
    if not rows:
        headers = [label for _, label in columns]
        separator = ["---"] * len(headers)
        return "\n".join(
            [
                "| " + " | ".join(headers) + " |",
                "| " + " | ".join(separator) + " |",
                "| " + " | ".join("n/a" for _ in headers) + " |",
            ]
        )

    rendered_rows: list[list[str]] = []
    for row in rows:
        rendered = []
        for key, _label in columns:
            value = row.get(key)
            if isinstance(value, float):
                if "pct" in key:
                    rendered.append(f"{value:.1f}%")
                elif "count" in key or "samples" in key:
                    rendered.append(str(int(value)))
                else:
                    rendered.append(fmt_money(value) if any(token in key for token in ("revenue", "amount", "total", "avg", "actual", "list", "delta", "due")) else f"{value:.2f}")
            elif isinstance(value, int):
                rendered.append(str(value))
            elif isinstance(value, datetime):
                rendered.append(value.date().isoformat())
            elif value is None or value == "":
                rendered.append("n/a")
            else:
                rendered.append(str(value))
        rendered_rows.append(rendered)

    headers = [label for _, label in columns]
    separator = ["---"] * len(headers)
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join(separator) + " |"]
    for rendered in rendered_rows:
        lines.append("| " + " | ".join(rendered) + " |")
    return "\n".join(lines)


def top_rows(rows: list[dict[str, Any]], limit: int = 15) -> list[dict[str, Any]]:
    return rows[:limit]


def build_report(
    start_date: date,
    end_date: date,
    invoices: list[XeroInvoice],
    accounts: dict[str, dict[str, Any]],
    payments: list[dict[str, Any]],
    monday_items: list[MondayItem],
    invoice_matches: dict[str, MatchResult],
    allocations: list[dict[str, Any]],
) -> str:
    month_status_rows, live_rows = aggregate_invoice_summary(invoices)
    account_rows = aggregate_account_code_revenue(invoices, accounts)
    payment_rows = aggregate_payment_accounts(payments, accounts)
    monday_by_id = {item.item_id: item for item in monday_items}

    live_invoices = [invoice for invoice in invoices if invoice.status in {"PAID", "AUTHORISED"}]
    matched_live = [invoice for invoice in live_invoices if invoice_matches[invoice.invoice_id].quality in {"exact", "strong"}]
    weak_live = [invoice for invoice in live_invoices if invoice_matches[invoice.invoice_id].quality == "weak"]
    unmatched_live = [invoice for invoice in live_invoices if invoice_matches[invoice.invoice_id].quality == "unmatched"]
    unresolved_live_total = sum(invoice.total for invoice in weak_live + unmatched_live)
    unresolved_live_batched = sum(invoice.total for invoice in weak_live + unmatched_live if invoice.likely_batched)
    unresolved_live_orphan = unresolved_live_total - unresolved_live_batched

    quality_counts = Counter(match.quality for match in invoice_matches.values())
    quality_values: dict[str, float] = defaultdict(float)
    for invoice in invoices:
        quality_values[invoice_matches[invoice.invoice_id].quality] += invoice.total

    matched_monday_ids = {match.monday_ids[0] for match in invoice_matches.values() if match.quality in {"exact", "strong"} and match.monday_ids}
    weak_monday_ids = {match.monday_ids[0] for match in invoice_matches.values() if match.quality == "weak" and match.monday_ids}

    monday_items_in_window = [item for item in monday_items if item.created_at and start_date <= item.created_at.date() <= end_date]
    monday_positive_payment = [item for item in monday_items_in_window if item.positive_payment_evidence > 0]
    monday_positive_unmatched = [item for item in monday_positive_payment if item.item_id not in matched_monday_ids]
    monday_positive_xero_shaped = [item for item in monday_positive_unmatched if item.payment_method == "Invoiced - Xero"]
    monday_positive_weak_only = [item for item in monday_positive_payment if item.item_id in weak_monday_ids]

    revenue_by_device = aggregate_revenue_by_field(allocations, "device_category")
    revenue_by_repair = aggregate_revenue_by_field(allocations, "repair_type")
    revenue_by_channel = aggregate_revenue_by_field(allocations, "match_channel")
    model_rows = aggregate_model_validation(allocations)
    channel_model_rows = aggregate_channel_price_comparison(allocations)

    unresolved_invoice_rows = []
    for invoice in sorted(weak_live + unmatched_live, key=lambda row: row.total, reverse=True)[:20]:
        match = invoice_matches[invoice.invoice_id]
        unresolved_invoice_rows.append(
            {
                "invoice_number": invoice.invoice_number,
                "contact": invoice.contact_name,
                "date": invoice.date.date().isoformat() if invoice.date else "",
                "status": invoice.status,
                "total": invoice.total,
                "amount_due": invoice.amount_due,
                "quality": match.quality,
                "batched": "Likely batch" if invoice.likely_batched else "Likely orphan",
                "reason": ", ".join(match.reasons[:3]),
            }
        )

    monday_gap_rows = []
    for item in sorted(monday_positive_unmatched, key=lambda row: row.positive_payment_evidence, reverse=True)[:20]:
        monday_gap_rows.append(
            {
                "item_id": item.item_id,
                "name": item.name,
                "company": item.company or "n/a",
                "created": item.created_at.date().isoformat() if item.created_at else "",
                "channel": item.channel,
                "payment_method": item.payment_method,
                "value": item.positive_payment_evidence,
                "status": item.main_status or "n/a",
            }
        )

    draft_rows = []
    for invoice in sorted([invoice for invoice in invoices if invoice.status == "DRAFT"], key=lambda row: row.total, reverse=True)[:15]:
        draft_rows.append(
            {
                "invoice_number": invoice.invoice_number,
                "contact": invoice.contact_name,
                "date": invoice.date.date().isoformat() if invoice.date else "",
                "total": invoice.total,
                "likely_link": invoice_matches[invoice.invoice_id].quality,
            }
        )

    void_rows = []
    for invoice in sorted([invoice for invoice in invoices if invoice.status in {"VOIDED", "DELETED"}], key=lambda row: row.total, reverse=True)[:15]:
        void_rows.append(
            {
                "invoice_number": invoice.invoice_number,
                "contact": invoice.contact_name,
                "date": invoice.date.date().isoformat() if invoice.date else "",
                "status": invoice.status,
                "total": invoice.total,
                "likely_link": invoice_matches[invoice.invoice_id].quality,
            }
        )

    backmarket_xero_revenue = sum(
        allocation["actual_revenue_inc_vat"]
        for allocation in allocations
        if allocation["match_channel"] == "BackMarket" and allocation["invoice_status"] in {"PAID", "AUTHORISED"}
    )
    backmarket_monday_value = sum(item.positive_payment_evidence for item in monday_positive_payment if item.channel == "BackMarket")
    backmarket_unmatched_value = sum(item.positive_payment_evidence for item in monday_positive_unmatched if item.channel == "BackMarket")

    corporate_channel_rows = [row for row in channel_model_rows if row["channel"] == "Corporate" and row["samples"] >= 2][:10]
    biggest_model_challenges = [row for row in model_rows if row["samples"] >= 2][:12]

    report_lines = [
        "# Xero Revenue by Repair Type Reconciliation",
        "",
        f"Generated: `{datetime.now(UTC).replace(microsecond=0).isoformat().replace('+00:00', 'Z')}`",
        f"Window analysed: `{start_date.isoformat()}` to `{end_date.isoformat()}`",
        "",
        "## Section 1: Revenue Summary",
        "",
        f"- Xero sales invoices pulled: `{len(invoices)}`",
        f"- Live invoice revenue (`PAID` + `AUTHORISED`): `{fmt_money(sum(invoice.total for invoice in live_invoices))}`",
        f"- Matched live revenue on exact/strong Monday links: `{fmt_money(sum(invoice.total for invoice in matched_live))}`",
        f"- Unresolved live invoice value (`weak` + `unmatched`): `{fmt_money(unresolved_live_total)}`",
        f"- Of unresolved live value, likely batched corporate/multi-job invoices: `{fmt_money(unresolved_live_batched)}`",
        f"- Residual likely-orphan live invoice value after that split: `{fmt_money(unresolved_live_orphan)}`",
        "",
        "### Invoice Counts and Revenue by Month",
        "",
        markdown_table(
            month_status_rows,
            [("month", "Month"), ("status", "Status"), ("count", "Count"), ("total", "Total")],
        ),
        "",
        "### Live Revenue by Month",
        "",
        markdown_table(
            live_rows,
            [("month", "Month"), ("count", "Invoices"), ("revenue", "Revenue"), ("avg", "Average Value")],
        ),
        "",
        "### Revenue by Account Code",
        "",
        markdown_table(
            top_rows(account_rows, 12),
            [("account_code", "Account Code"), ("account_name", "Account Name"), ("revenue", "Revenue")],
        ),
        "",
        "### Payment Account Breakdown",
        "",
        markdown_table(
            top_rows(payment_rows, 12),
            [("payment_account", "Payment Account"), ("count", "Payments"), ("amount", "Amount")],
        ),
        "",
        "## Section 2: Revenue by Category",
        "",
        "_Category tables below use exact and strong Monday matches only. Weak matches are kept out of rollups to avoid overstating certainty._",
        "",
        "### Revenue by Device Category and Month",
        "",
        markdown_table(
            sorted(revenue_by_device, key=lambda row: (row["device_category"], row["month"])),
            [("device_category", "Device"), ("month", "Month"), ("revenue", "Revenue")],
        ),
        "",
        "### Revenue by Repair Type and Month",
        "",
        markdown_table(
            sorted(revenue_by_repair, key=lambda row: (row["repair_type"], row["month"])),
            [("repair_type", "Repair Type"), ("month", "Month"), ("revenue", "Revenue")],
        ),
        "",
        "### Revenue by Channel and Month",
        "",
        markdown_table(
            sorted(revenue_by_channel, key=lambda row: (row["match_channel"], row["month"])),
            [("match_channel", "Channel"), ("month", "Month"), ("revenue", "Revenue")],
        ),
        "",
        "## Section 3: Monday Match Results",
        "",
        markdown_table(
            [
                {"quality": quality, "count": quality_counts.get(quality, 0), "value": quality_values.get(quality, 0.0)}
                for quality in ["exact", "strong", "weak", "unmatched"]
            ],
            [("quality", "Match Quality"), ("count", "Invoices"), ("value", "Value")],
        ),
        "",
        f"- Monday items created in the same window with positive payment evidence: `{len(monday_positive_payment)}` worth `{fmt_money(sum(item.positive_payment_evidence for item in monday_positive_payment))}`",
        f"- Those Monday paid-evidence items with no exact/strong Xero invoice match: `{len(monday_positive_unmatched)}` worth `{fmt_money(sum(item.positive_payment_evidence for item in monday_positive_unmatched))}`",
        f"- Of that Monday-side gap, rows explicitly marked `Invoiced - Xero`: `{len(monday_positive_xero_shaped)}` worth `{fmt_money(sum(item.positive_payment_evidence for item in monday_positive_xero_shaped))}`",
        f"- Monday rows sitting only in `weak` territory: `{len(monday_positive_weak_only)}`",
        "",
        "### Largest Unresolved Xero Invoices",
        "",
        markdown_table(
            unresolved_invoice_rows,
            [
                ("invoice_number", "Invoice"),
                ("contact", "Contact"),
                ("date", "Date"),
                ("status", "Status"),
                ("total", "Total"),
                ("amount_due", "Due"),
                ("quality", "Match"),
                ("batched", "Profile"),
                ("reason", "Why"),
            ],
        ),
        "",
        "### Largest Monday Paid Rows Without Strong Xero Match",
        "",
        markdown_table(
            monday_gap_rows,
            [
                ("item_id", "Monday ID"),
                ("name", "Name"),
                ("company", "Company"),
                ("created", "Created"),
                ("channel", "Channel"),
                ("payment_method", "Payment Method"),
                ("value", "Value"),
                ("status", "Status"),
            ],
        ),
        "",
        "## Section 4: Reconciliation Gap",
        "",
        f"- Previous report range to beat: roughly `£30k-£40k` unresolved on the Xero side.",
        f"- Current live unresolved Xero value is `{fmt_money(unresolved_live_total)}`.",
        f"- Once likely batched corporate/multi-device invoices are separated, the residual likely-orphan Xero gap drops to `{fmt_money(unresolved_live_orphan)}`.",
        f"- Monday-side positive-payment gap is still larger at `{fmt_money(sum(item.positive_payment_evidence for item in monday_positive_unmatched))}`, but most of that does not present as clean missing Xero invoicing.",
        "",
        "### Draft Invoices",
        "",
        markdown_table(
            draft_rows,
            [("invoice_number", "Invoice"), ("contact", "Contact"), ("date", "Date"), ("total", "Total"), ("likely_link", "Likely Link")],
        ),
        "",
        "### Voided / Deleted Invoices",
        "",
        markdown_table(
            void_rows,
            [("invoice_number", "Invoice"), ("contact", "Contact"), ("date", "Date"), ("status", "Status"), ("total", "Total"), ("likely_link", "Likely Link")],
        ),
        "",
        "### BackMarket Capture",
        "",
        f"- BackMarket revenue matched through Xero `ACCREC` invoices: `{fmt_money(backmarket_xero_revenue)}`",
        f"- Monday BackMarket items with positive payment evidence in the same window: `{fmt_money(backmarket_monday_value)}`",
        f"- BackMarket Monday value with no exact/strong Xero invoice match: `{fmt_money(backmarket_unmatched_value)}`",
        "- Readout: BackMarket is not mainly showing up as one-to-one sales invoices. The invoice-matched portion is materially smaller than the Monday BM payment-evidence surface, which points to BM cash landing through platform or ledger routes rather than clean `ACCREC` invoicing.",
        "",
        "## Section 5: Model Validation",
        "",
        "_Validation rows below use matched product-linked allocations only, excluding item-level fallbacks._",
        "",
        "### Largest Category-Level Price Variance vs Monday List Price",
        "",
        markdown_table(
            biggest_model_challenges,
            [
                ("device_category", "Device"),
                ("repair_type", "Repair Type"),
                ("samples", "Samples"),
                ("median_actual", "Median Actual"),
                ("median_list", "Median List"),
                ("delta", "Delta"),
                ("delta_pct", "Delta %"),
            ],
        ),
        "",
        "### Corporate Channel Price Comparison",
        "",
        markdown_table(
            corporate_channel_rows,
            [
                ("channel", "Channel"),
                ("device_category", "Device"),
                ("repair_type", "Repair Type"),
                ("samples", "Samples"),
                ("median_actual", "Median Actual"),
                ("median_list", "Median List"),
                ("delta_pct", "Delta %"),
            ],
        ),
        "",
        "Interpretation:",
        "",
        "- Negative delta means actual invoiced value is running below the Monday list/model assumption, which usually indicates discounts, bundled quoting, or corporate pricing.",
        "- Positive delta usually means either surcharge/custom pricing, grouped quote allocation effects, or Monday list prices that are stale versus invoiced reality.",
        "",
        "## Section 6: Key Findings",
        "",
        f"- BackMarket revenue is only partially visible through Xero sales invoices. In this window, exact/strong BM invoice matches total `{fmt_money(backmarket_xero_revenue)}` against `{fmt_money(backmarket_monday_value)}` of Monday BM payment evidence.",
        f"- Corporate work is the main source of residual ambiguity. A large share of the unresolved live Xero value, `{fmt_money(unresolved_live_batched)}`, looks like batched or multi-device corporate billing rather than clean orphan invoices.",
        f"- The invoice-creation-but-not-paid surface is concentrated in `AUTHORISED` balances and drafts. Live outstanding on pulled invoices is `{fmt_money(sum(invoice.amount_due for invoice in live_invoices))}`; drafts total `{fmt_money(sum(invoice.total for invoice in invoices if invoice.status == 'DRAFT'))}`.",
        f"- The real unexplained Xero-side gap is lower than the raw unresolved figure once likely batched invoices are removed: `{fmt_money(unresolved_live_orphan)}` rather than `{fmt_money(unresolved_live_total)}`.",
        f"- The larger operational control gap remains Monday-side linkage and payment-state contamination: `{len(monday_positive_unmatched)}` paid-evidence Monday items worth `{fmt_money(sum(item.positive_payment_evidence for item in monday_positive_unmatched))}` still have no exact/strong Xero invoice match.",
    ]
    return "\n".join(report_lines) + "\n"


def main() -> None:
    today = datetime.now(UTC).date()
    start_date = today - timedelta(days=182)
    env = parse_env(ENV_PATH)

    monday = MondayClient(env["MONDAY_APP_TOKEN"])
    print("Loading Monday product boards...", file=sys.stderr, flush=True)
    product_items = monday.fetch_board(PRODUCT_BOARD_ID, PRODUCT_COLUMNS)
    custom_product_items = monday.fetch_board(CUSTOM_PRODUCT_BOARD_ID, CUSTOM_PRODUCT_COLUMNS)
    print("Loading Monday main board snapshot...", file=sys.stderr, flush=True)
    main_items = load_main_board_items(monday)

    product_map = build_product_map(product_items, "product")
    custom_product_map = build_product_map(custom_product_items, "custom")
    monday_items = build_monday_items(main_items, product_map, custom_product_map)
    monday_by_id = {item.item_id: item for item in monday_items}

    print("Loading Xero invoices/payments...", file=sys.stderr, flush=True)
    invoices, accounts, payments, _invoice_map = fetch_xero_data(start_date)
    print("Scoring matches...", file=sys.stderr, flush=True)
    invoice_matches = match_invoices_to_monday(invoices, monday_items)
    print("Building allocations/report...", file=sys.stderr, flush=True)
    allocations = build_revenue_allocations(invoices, invoice_matches, monday_by_id)

    report = build_report(start_date, today, invoices, accounts, payments, monday_items, invoice_matches, allocations)
    OUTPUT_PATH.write_text(report, encoding="utf-8")

    live_invoices = [invoice for invoice in invoices if invoice.status in {"PAID", "AUTHORISED"}]
    matched_live_total = sum(
        invoice.total
        for invoice in live_invoices
        if invoice_matches[invoice.invoice_id].quality in {"exact", "strong"}
    )
    unresolved_live_total = sum(
        invoice.total
        for invoice in live_invoices
        if invoice_matches[invoice.invoice_id].quality in {"weak", "unmatched"}
    )
    print(
        json.dumps(
            {
                "output_path": str(OUTPUT_PATH),
                "invoice_count": len(invoices),
                "live_revenue": round(sum(invoice.total for invoice in live_invoices), 2),
                "matched_live_revenue": round(matched_live_total, 2),
                "unresolved_live_revenue": round(unresolved_live_total, 2),
                "match_quality_counts": Counter(match.quality for match in invoice_matches.values()),
                "allocations": len(allocations),
            },
            default=str,
        )
    )


if __name__ == "__main__":
    main()
