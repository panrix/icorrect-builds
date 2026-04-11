#!/usr/bin/env python3
"""
Build a retail repair profitability model from Monday.com boards.

Read-only workflow:
- Products & Pricing board -> product catalogue and linked parts
- Parts board -> supply prices and linked repair items
- Main board -> completed repair timing and direct requested-repair links

Output is written to:
  /home/ricky/builds/system-audit-2026-03-31/repair-profitability-model.md
"""

from __future__ import annotations

import json
import math
import os
import statistics
import time
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv


MONDAY_API_URL = "https://api.monday.com/v2"
ENV_PATH = Path("/home/ricky/config/api-keys/.env")
OUTPUT_PATH = Path("/home/ricky/builds/system-audit-2026-03-31/repair-profitability-model.md")

PRODUCTS_BOARD_ID = 2477699024
PARTS_BOARD_ID = 985177480
MAIN_BOARD_ID = 349212843

PRODUCT_COLUMNS = [
    "numbers",
    "formula",
    "connect_boards8",
    "status3",
    "text_mkzdte13",
    "link_to_devices6",
]

PART_COLUMNS = [
    "supply_price",
    "quantity",
    "formula_mkv86xh7",
    "link_to_products_beta73",
    "link_to_products___pricing",
    "connect_boards3",
    "color_mksn3ctf",
]

MAIN_COLUMNS = [
    "status4",
    "status24",
    "service",
    "date4",
    "collection_date",
    "date_mkwdan7z",
    "date_mkypmgfc",
    "date6",
    "board_relation5",
    "connect_boards__1",
    "board_relation",
]

PAGE_LIMIT = 500
RATE_LIMIT_SECONDS = 1.05
LABOUR_RATE_PER_HOUR = 24.0
PAYMENT_FEE_RATE = 0.02
IPHONE_REFURB_HOURS = 1.0
IPHONE_REFURB_COST = LABOUR_RATE_PER_HOUR * IPHONE_REFURB_HOURS

COMPLETED_STATUSES = {
    "Returned",
    "Shipped",
    "Ready To Collect",
    "Repaired",
}

REPAIR_TYPE_ALLOWLIST = {
    "Repair",
    "Diagnostic",
    "Board Level",
    "Parts",
    "No Fault Found",
}


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def iso_ts(dt: datetime | None = None) -> str:
    value = dt or utcnow()
    return value.replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_json(raw: str | None) -> dict[str, Any]:
    if not raw:
        return {}
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return value if isinstance(value, dict) else {}


def parse_float(text: str | None) -> float | None:
    if text is None:
        return None
    cleaned = str(text).strip().replace("£", "").replace(",", "")
    if not cleaned:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def parse_datetime_from_date_value(raw: str | None) -> datetime | None:
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
    if not date_value:
        return None

    time_value = payload.get("time")
    stamp = f"{date_value}T{time_value}" if time_value else f"{date_value}T00:00:00"
    try:
        return datetime.fromisoformat(stamp).replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def safe_mean(values: list[float]) -> float | None:
    return statistics.mean(values) if values else None


def safe_median(values: list[float]) -> float | None:
    return statistics.median(values) if values else None


def fmt_money(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    return f"£{value:,.2f}"


def fmt_hours(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    return f"{value:.2f}"


def fmt_pct(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    return f"{value * 100:.1f}%"


def categorize_device(device_name: str) -> str:
    lower = device_name.lower()
    if "iphone" in lower:
        return "iPhone"
    if "ipad" in lower:
        return "iPad"
    if "watch" in lower:
        return "Apple Watch"
    if any(token in lower for token in ["macbook", "imac", "mac mini", "mac pro", "mac studio", "mac"]):
        return "MacBook"
    return "Other"


def is_iphone_screen(device_name: str, product_name: str) -> bool:
    return "iphone" in device_name.lower() and "screen" in product_name.lower()


def markdown_table(headers: list[str], rows: list[list[str]]) -> str:
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    lines.extend("| " + " | ".join(row) + " |" for row in rows)
    return "\n".join(lines)


@dataclass
class BoardBundle:
    board_id: int
    board_name: str
    columns: dict[str, dict[str, Any]]
    groups: dict[str, str]
    items: list[dict[str, Any]]


class ProgressWriter:
    def __init__(self, output_path: Path) -> None:
        self.output_path = output_path
        self.started_at = utcnow()
        self.notes: list[str] = []

    def update(self, note: str) -> None:
        timestamp = iso_ts()
        self.notes.append(f"- `{timestamp}` {note}")
        body = [
            "# Retail Repair Profitability Model",
            "",
            f"Build started: `{iso_ts(self.started_at)}`",
            "",
            "## Progress",
            *self.notes,
            "",
            "_Live Monday extraction in progress. This file will be replaced with the final report when the model completes._",
            "",
        ]
        self.output_path.write_text("\n".join(body), encoding="utf-8")

    def finalize(self, content: str) -> None:
        self.output_path.write_text(content, encoding="utf-8")


class MondayClient:
    def __init__(self, token: str) -> None:
        self.token = token
        self.client = httpx.Client(
            headers={
                "Authorization": token,
                "Content-Type": "application/json",
                "API-Version": "2024-10",
            },
            timeout=120,
        )
        self._last_request_at: float | None = None

    def close(self) -> None:
        self.client.close()

    def query(self, query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
        if self._last_request_at is not None:
            elapsed = time.monotonic() - self._last_request_at
            if elapsed < RATE_LIMIT_SECONDS:
                time.sleep(RATE_LIMIT_SECONDS - elapsed)
        response = self.client.post(
            MONDAY_API_URL,
            json={"query": query, "variables": variables or {}},
        )
        self._last_request_at = time.monotonic()
        response.raise_for_status()
        payload = response.json()
        if payload.get("errors"):
            messages = "; ".join(err.get("message", "Unknown Monday error") for err in payload["errors"])
            raise RuntimeError(messages)
        return payload["data"]

    def fetch_board(self, board_id: int, column_ids: list[str]) -> BoardBundle:
        cols = ", ".join(f'"{column_id}"' for column_id in column_ids)
        initial_query = f"""
        query {{
          boards(ids:[{board_id}]) {{
            id
            name
            columns(ids:[{cols}]) {{
              id
              title
              type
            }}
            groups {{
              id
              title
            }}
            items_page(limit:{PAGE_LIMIT}) {{
              cursor
              items {{
                id
                name
                created_at
                updated_at
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
              created_at
              updated_at
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

        return BoardBundle(
            board_id=board_id,
            board_name=board["name"],
            columns={col["id"]: col for col in board.get("columns", [])},
            groups={group["id"]: group["title"] for group in board.get("groups", [])},
            items=items,
        )


def column_map(item: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {value["id"]: value for value in item.get("column_values", [])}


def relation_ids(column_value: dict[str, Any] | None) -> list[str]:
    if not column_value:
        return []
    return [str(item_id) for item_id in (column_value.get("linked_item_ids") or [])]


def relation_display(column_value: dict[str, Any] | None) -> str:
    if not column_value:
        return ""
    return (column_value.get("display_value") or "").strip()


def date_range_hours(item: dict[str, Any], columns: dict[str, dict[str, Any]]) -> tuple[float | None, str | None]:
    received_candidates = [
        ("Received", columns.get("date4")),
        ("Intake Timestamp", columns.get("date_mkypmgfc")),
        ("Booking Time", columns.get("date6")),
    ]
    repaired_candidates = [
        ("Date Repaired", columns.get("collection_date")),
        ("Repaired", columns.get("date_mkwdan7z")),
    ]

    received_at = None
    received_source = None
    for source_name, value in received_candidates:
        candidate = parse_datetime_from_date_value(value.get("value") if value else None)
        if candidate:
            received_at = candidate
            received_source = source_name
            break

    repaired_at = None
    for _, value in repaired_candidates:
        candidate = parse_datetime_from_date_value(value.get("value") if value else None)
        if candidate:
            repaired_at = candidate
            break

    if not received_at or not repaired_at:
        return None, received_source

    hours = (repaired_at - received_at).total_seconds() / 3600.0
    if hours <= 0:
        return None, received_source
    return hours, received_source


def make_report(
    products_bundle: BoardBundle,
    parts_bundle: BoardBundle,
    main_bundle: BoardBundle,
) -> str:
    main_items_by_id: dict[str, dict[str, Any]] = {}
    main_repairs_by_product: dict[str, list[dict[str, Any]]] = defaultdict(list)
    main_repairs_by_part: dict[str, list[dict[str, Any]]] = defaultdict(list)

    completed_repairs_total = 0
    filtered_out_no_timing = 0

    for item in main_bundle.items:
        cols = column_map(item)
        status = (cols.get("status4", {}).get("text") or "").strip()
        repair_type = (cols.get("status24", {}).get("text") or "").strip()
        if status not in COMPLETED_STATUSES:
            continue
        if repair_type and repair_type not in REPAIR_TYPE_ALLOWLIST:
            continue

        hours, received_source = date_range_hours(item, cols)
        if hours is None:
            filtered_out_no_timing += 1
            continue

        completed_repairs_total += 1
        device_name = relation_display(cols.get("board_relation5"))
        repair_record = {
            "id": str(item["id"]),
            "name": item["name"],
            "group": (item.get("group") or {}).get("title", ""),
            "status": status,
            "repair_type": repair_type,
            "service": (cols.get("service", {}).get("text") or "").strip(),
            "device_name": device_name,
            "device_ids": relation_ids(cols.get("board_relation5")),
            "product_ids": relation_ids(cols.get("board_relation")),
            "part_ids": relation_ids(cols.get("connect_boards__1")),
            "hours": hours,
            "received_source": received_source or "Unknown",
            "created_at": item.get("created_at"),
            "updated_at": item.get("updated_at"),
            "repaired_at": parse_datetime_from_date_value(cols.get("collection_date", {}).get("value"))
            or parse_datetime_from_date_value(cols.get("date_mkwdan7z", {}).get("value")),
        }
        main_items_by_id[repair_record["id"]] = repair_record
        for product_id in repair_record["product_ids"]:
            main_repairs_by_product[product_id].append(repair_record)
        for part_id in repair_record["part_ids"]:
            main_repairs_by_part[part_id].append(repair_record)

    for records in main_repairs_by_product.values():
        records.sort(key=lambda record: record["repaired_at"] or utcnow(), reverse=True)
    for records in main_repairs_by_part.values():
        records.sort(key=lambda record: record["repaired_at"] or utcnow(), reverse=True)

    part_items_by_id: dict[str, dict[str, Any]] = {}
    part_rows: list[dict[str, Any]] = []
    reverse_product_to_parts: dict[str, list[str]] = defaultdict(list)

    for item in parts_bundle.items:
        cols = column_map(item)
        part_id = str(item["id"])
        product_ids = relation_ids(cols.get("link_to_products___pricing"))
        repair_ids = relation_ids(cols.get("link_to_products_beta73"))
        supply_price = parse_float(cols.get("supply_price", {}).get("text"))
        group_title = (item.get("group") or {}).get("title", "")

        part_items_by_id[part_id] = {
            "id": part_id,
            "name": item["name"],
            "group": group_title,
            "supply_price": supply_price,
            "product_ids": product_ids,
            "repair_ids": repair_ids,
            "device_name": relation_display(cols.get("connect_boards3")),
            "available_stock": cols.get("formula_mkv86xh7", {}).get("text") or "",
            "major_part": (cols.get("color_mksn3ctf", {}).get("text") or "").strip(),
        }
        for product_id in product_ids:
            reverse_product_to_parts[product_id].append(part_id)

        part_linked_repairs = []
        for repair_id in repair_ids:
            repair = main_items_by_id.get(repair_id)
            if repair:
                part_linked_repairs.append(repair)
        part_linked_repairs.sort(key=lambda record: record["repaired_at"] or utcnow(), reverse=True)
        selected_repairs = part_linked_repairs[:10]
        hours_values = [record["hours"] for record in selected_repairs]
        part_rows.append(
            {
                "part_id": part_id,
                "part_name": item["name"],
                "group": group_title,
                "supply_price": supply_price,
                "repair_sample_count": len(selected_repairs),
                "repair_count_total": len(part_linked_repairs),
                "avg_hours": safe_mean(hours_values),
                "median_hours": safe_median(hours_values),
            }
        )

    part_summary_by_id = {row["part_id"]: row for row in part_rows}

    product_rows: list[dict[str, Any]] = []
    no_parts_linkage_count = 0
    insufficient_data_count = 0

    for item in products_bundle.items:
        cols = column_map(item)
        product_id = str(item["id"])
        product_name = item["name"]
        group_title = (item.get("group") or {}).get("title", "")
        device_display = relation_display(cols.get("link_to_devices6"))
        device_name = device_display or group_title or "Unknown"
        device_category = categorize_device(device_name)
        price_inc_vat = parse_float(cols.get("numbers", {}).get("text"))
        price_ex_vat = parse_float(cols.get("formula", {}).get("text"))
        if price_ex_vat is None and price_inc_vat is not None:
            price_ex_vat = price_inc_vat / 1.2

        product_linked_part_ids = relation_ids(cols.get("connect_boards8"))
        reverse_linked_part_ids = reverse_product_to_parts.get(product_id, [])
        part_ids = list(dict.fromkeys(product_linked_part_ids + reverse_linked_part_ids))

        parts = [part_items_by_id[part_id] for part_id in part_ids if part_id in part_items_by_id]
        parts_cost = sum(part["supply_price"] or 0.0 for part in parts)
        missing_part_costs = [part["name"] for part in parts if part["supply_price"] is None]

        if not part_ids:
            no_parts_linkage_count += 1

        exact_repairs = main_repairs_by_product.get(product_id, [])
        exact_ids = {repair["id"] for repair in exact_repairs}

        part_repairs: list[dict[str, Any]] = []
        for part_id in part_ids:
            part_repairs.extend(main_repairs_by_part.get(part_id, []))
        deduped_part_repairs: list[dict[str, Any]] = []
        seen_part_repair_ids: set[str] = set()
        for repair in sorted(part_repairs, key=lambda record: record["repaired_at"] or utcnow(), reverse=True):
            if repair["id"] in seen_part_repair_ids:
                continue
            seen_part_repair_ids.add(repair["id"])
            deduped_part_repairs.append(repair)

        selected_repairs: list[dict[str, Any]] = []
        selected_repair_ids: set[str] = set()
        for repair in exact_repairs:
            if len(selected_repairs) >= 10:
                break
            selected_repairs.append(repair)
            selected_repair_ids.add(repair["id"])
        for repair in deduped_part_repairs:
            if len(selected_repairs) >= 10:
                break
            if repair["id"] in selected_repair_ids:
                continue
            selected_repairs.append(repair)
            selected_repair_ids.add(repair["id"])

        repair_hours = [repair["hours"] for repair in selected_repairs]
        avg_repair_hours = safe_mean(repair_hours)
        median_repair_hours = safe_median(repair_hours)
        repair_sample_count = len(selected_repairs)
        if repair_sample_count < 3:
            insufficient_data_count += 1

        iPhone_screen_refurb = is_iphone_screen(device_name, product_name)
        labour_cost = (avg_repair_hours or 0.0) * LABOUR_RATE_PER_HOUR
        refurb_labour_cost = IPHONE_REFURB_COST if iPhone_screen_refurb else 0.0
        payment_fee = (price_inc_vat or 0.0) * PAYMENT_FEE_RATE if price_inc_vat is not None else None
        net_profit = None
        margin_pct = None
        if price_ex_vat is not None and payment_fee is not None:
            net_profit = price_ex_vat - parts_cost - labour_cost - refurb_labour_cost - payment_fee
            margin_pct = (net_profit / price_ex_vat) if price_ex_vat else None

        notes: list[str] = []
        match_source = "linked parts"
        if exact_repairs and deduped_part_repairs:
            match_source = "requested repair relation + linked parts"
        elif exact_repairs:
            match_source = "requested repair relation"
        elif deduped_part_repairs:
            match_source = "linked parts"
        else:
            match_source = "no historical match"
        notes.append(f"timing source: {match_source}")

        if repair_sample_count < 3:
            notes.append("insufficient repair history (<3 completed repairs)")
        if not part_ids:
            notes.append("incomplete data: no parts linkage")
        if missing_part_costs:
            notes.append(f"{len(missing_part_costs)} linked part(s) missing supply price")
        if iPhone_screen_refurb:
            notes.append("includes 1h iPhone screen refurb labour adder")

        if margin_pct is None:
            status_flag = "incomplete data"
        elif not part_ids:
            status_flag = "incomplete data"
        elif margin_pct < 0.40:
            status_flag = "review pricing"
        elif margin_pct > 0.70:
            status_flag = "healthy"
        else:
            status_flag = "watch"

        product_rows.append(
            {
                "product_id": product_id,
                "shopify_id": (cols.get("text_mkzdte13", {}).get("text") or "").strip(),
                "device": device_name,
                "device_category": device_category,
                "product_name": product_name,
                "product_type": (cols.get("status3", {}).get("text") or "").strip(),
                "price_inc_vat": price_inc_vat,
                "price_ex_vat": price_ex_vat,
                "part_ids": part_ids,
                "part_names": [part["name"] for part in parts],
                "parts_cost": parts_cost,
                "avg_repair_hours": avg_repair_hours,
                "median_repair_hours": median_repair_hours,
                "repair_sample_count": repair_sample_count,
                "labour_cost": labour_cost,
                "refurb_labour_cost": refurb_labour_cost,
                "payment_fee": payment_fee,
                "net_profit": net_profit,
                "margin_pct": margin_pct,
                "status_flag": status_flag,
                "match_source": match_source,
                "notes": "; ".join(notes),
            }
        )

    product_rows.sort(
        key=lambda row: (
            row["device_category"],
            row["device"].lower(),
            row["product_name"].lower(),
        )
    )

    by_category: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in product_rows:
        by_category[row["device_category"]].append(row)

    category_rows: list[list[str]] = []
    ordered_categories = ["MacBook", "iPhone", "iPad", "Apple Watch", "Other"]
    for category in ordered_categories:
        rows = by_category.get(category, [])
        if not rows:
            continue
        margins = [row["margin_pct"] for row in rows if row["margin_pct"] is not None]
        category_rows.append(
            [
                category,
                str(len(rows)),
                fmt_money(safe_mean([row["price_ex_vat"] for row in rows if row["price_ex_vat"] is not None])),
                fmt_pct(safe_mean(margins)),
                str(sum(1 for row in rows if row["status_flag"] == "review pricing")),
                str(sum(1 for row in rows if row["status_flag"] == "healthy")),
                str(sum(1 for row in rows if row["status_flag"] == "incomplete data")),
            ]
        )

    part_rows.sort(
        key=lambda row: (
            row["repair_sample_count"] == 0,
            -(row["repair_sample_count"] or 0),
            row["part_name"].lower(),
        )
    )

    sortable_margin_rows = [row for row in product_rows if row["margin_pct"] is not None]
    rankable_rows = [
        row
        for row in sortable_margin_rows
        if row["part_ids"] and row["repair_sample_count"] >= 3
    ]
    highest_margin_rows = sorted(rankable_rows, key=lambda row: row["margin_pct"], reverse=True)[:10]
    lowest_margin_rows = sorted(rankable_rows, key=lambda row: row["margin_pct"])[:10]
    negative_or_near_zero_rows = [
        row for row in sortable_margin_rows if row["margin_pct"] is not None and row["margin_pct"] <= 0.10
    ]
    negative_or_near_zero_rows.sort(key=lambda row: row["margin_pct"])

    full_product_table_rows: list[list[str]] = []
    for row in product_rows:
        total_labour_cost = (row["labour_cost"] or 0.0) + (row["refurb_labour_cost"] or 0.0)
        full_product_table_rows.append(
            [
                row["device"],
                row["product_name"],
                fmt_money(row["price_inc_vat"]),
                fmt_money(row["price_ex_vat"]),
                fmt_money(row["parts_cost"]),
                fmt_hours(row["avg_repair_hours"]),
                str(row["repair_sample_count"]),
                fmt_money(total_labour_cost),
                fmt_money(row["payment_fee"]),
                fmt_money(row["net_profit"]),
                fmt_pct(row["margin_pct"]),
                row["status_flag"],
                row["notes"],
            ]
        )

    per_part_table_rows: list[list[str]] = []
    for row in part_rows:
        note = "insufficient data" if row["repair_sample_count"] < 3 else ""
        per_part_table_rows.append(
            [
                row["part_name"],
                str(row["repair_sample_count"]),
                fmt_hours(row["avg_hours"]),
                fmt_hours(row["median_hours"]),
                fmt_money(row["supply_price"]),
                note,
            ]
        )

    def top_bottom_rows(rows: list[dict[str, Any]]) -> list[list[str]]:
        return [
            [
                row["device"],
                row["product_name"],
                fmt_money(row["net_profit"]),
                fmt_pct(row["margin_pct"]),
                str(row["repair_sample_count"]),
                row["status_flag"],
            ]
            for row in rows
        ]

    methodology_lines = [
        "## Methodology",
        "",
        f"- Live Monday pull completed on `{iso_ts()}` using boards `{PRODUCTS_BOARD_ID}`, `{PARTS_BOARD_ID}`, and `{MAIN_BOARD_ID}`.",
        f"- Product mapping uses the Products & Pricing board `Parts` relation (`connect_boards8`) and is backfilled with the Parts board reverse `Products Index` relation where needed.",
        f"- Repair timing uses completed main-board items with status in `{', '.join(sorted(COMPLETED_STATUSES))}` and repair type in `{', '.join(sorted(REPAIR_TYPE_ALLOWLIST))}`.",
        "- Repair duration is measured from the `Received` date column `changed_at` timestamp, with fallback to `Intake Timestamp`, then `Booking Time` if `Received` is blank.",
        "- Repair completion is measured from `Date Repaired` (`collection_date`) `changed_at`, with fallback to `Repaired` (`date_mkwdan7z`) if needed.",
        "- Product labour time uses up to the 10 most recent completed repairs, prioritising exact `Requested Repairs` links from the main board, then supplementing with repairs linked via the product's part(s).",
        "- Per-part timing uses up to the 10 most recent completed repairs from the Parts board `Repairs` relation.",
        "- Headline top/bottom margin rankings only include products with linked parts and at least 3 completed repairs.",
        f"- Labour rate is `{fmt_money(LABOUR_RATE_PER_HOUR)}` per hour. Payment fee estimate is `{PAYMENT_FEE_RATE * 100:.0f}%` of inc-VAT price.",
        f"- iPhone screen products add `{IPHONE_REFURB_HOURS:.0f}` extra refurb hour (`{fmt_money(IPHONE_REFURB_COST)}`) on top of historical repair labour.",
        "",
    ]

    overview_lines = [
        "## Overview",
        "",
        f"- Products analysed: `{len(product_rows)}`",
        f"- Parts analysed: `{len(part_rows)}`",
        f"- Completed repair records with usable timing: `{completed_repairs_total}`",
        f"- Completed repair records excluded for missing timing: `{filtered_out_no_timing}`",
        f"- Products with no parts linkage: `{no_parts_linkage_count}`",
        f"- Products with fewer than 3 completed repairs in the timing sample: `{insufficient_data_count}`",
        f"- Products included in headline margin rankings (linked parts + >=3 repairs): `{len(rankable_rows)}`",
        "",
    ]

    sections = [
        "# Retail Repair Profitability Model",
        "",
        f"Generated: `{iso_ts()}`",
        "",
        *overview_lines,
        *methodology_lines,
        "## Summary By Device Category",
        "",
        markdown_table(
            ["Category", "Products", "Avg Price ex VAT", "Avg Margin %", "Review Pricing", "Healthy", "Incomplete"],
            category_rows,
        ),
        "",
        "## Top 10 Highest Margin Products",
        "",
        markdown_table(
            ["Device", "Product", "Net Profit", "Margin %", "Repairs Used", "Flag"],
            top_bottom_rows(highest_margin_rows),
        ),
        "",
        "## Top 10 Lowest Margin Products",
        "",
        markdown_table(
            ["Device", "Product", "Net Profit", "Margin %", "Repairs Used", "Flag"],
            top_bottom_rows(lowest_margin_rows),
        ),
        "",
        "## Negative Or Near-Zero Margin Products",
        "",
        "_Near-zero is defined here as margin at or below 10% of ex-VAT selling price._",
        "",
        markdown_table(
            ["Device", "Product", "Net Profit", "Margin %", "Repairs Used", "Flag"],
            top_bottom_rows(negative_or_near_zero_rows) or [["n/a", "None", "n/a", "n/a", "0", "n/a"]],
        ),
        "",
        "## Per-Part Average Repair Time Summary",
        "",
        markdown_table(
            ["Part", "Completed Repairs Used", "Avg Hours", "Median Hours", "Supply Price ex VAT", "Note"],
            per_part_table_rows,
        ),
        "",
        "## Full Product Profitability Table",
        "",
        markdown_table(
            [
                "Device",
                "Product",
                "Price inc VAT",
                "Price ex VAT",
                "Parts Cost",
                "Avg Repair Hours",
                "Repairs Used",
                "Labour Cost",
                "Payment Fee",
                "Net Profit",
                "Margin %",
                "Flag",
                "Notes",
            ],
            full_product_table_rows,
        ),
        "",
    ]

    return "\n".join(sections)


def main() -> None:
    load_dotenv(ENV_PATH)
    token = os.environ.get("MONDAY_APP_TOKEN")
    if not token:
        raise RuntimeError(f"MONDAY_APP_TOKEN not found in {ENV_PATH}")

    progress = ProgressWriter(OUTPUT_PATH)
    progress.update("Starting live Monday extraction.")

    client = MondayClient(token)
    try:
        products_bundle = client.fetch_board(PRODUCTS_BOARD_ID, PRODUCT_COLUMNS)
        progress.update(
            f"Fetched `{len(products_bundle.items)}` items from `{products_bundle.board_name}` ({PRODUCTS_BOARD_ID})."
        )

        parts_bundle = client.fetch_board(PARTS_BOARD_ID, PART_COLUMNS)
        progress.update(
            f"Fetched `{len(parts_bundle.items)}` items from `{parts_bundle.board_name}` ({PARTS_BOARD_ID})."
        )

        main_bundle = client.fetch_board(MAIN_BOARD_ID, MAIN_COLUMNS)
        progress.update(
            f"Fetched `{len(main_bundle.items)}` items from `{main_bundle.board_name}` ({MAIN_BOARD_ID})."
        )

        progress.update("Computing per-part timing, per-product labour samples, and net margin model.")
        report = make_report(products_bundle, parts_bundle, main_bundle)
        progress.finalize(report)
    finally:
        client.close()


if __name__ == "__main__":
    main()
