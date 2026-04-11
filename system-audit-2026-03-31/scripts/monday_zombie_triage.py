#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import re
import sys
import time
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from html import unescape
from pathlib import Path
from typing import Any

import requests


BOARD_ID = 349212843
MONDAY_API_URL = "https://api.monday.com/v2"
MONDAY_API_VERSION = "2024-10"
ENV_PATH = Path("/home/ricky/config/api-keys/.env")
OUTPUT_PATH = Path("/home/ricky/builds/system-audit-2026-03-31/monday-zombie-triage.md")
PAGE_LIMIT = 100
RATE_LIMIT_SECONDS = 1.0
UPDATES_BATCH_SIZE = 20
ACTIVITY_BATCH_SIZE = 20

NOW = datetime.now(timezone.utc)

TERMINAL_STATUSES = {
    "Ready To Collect",
    "Repaired",
    "Returned",
    "Shipped",
    "Collected",
    "Cancelled",
    "Declined",
    "Cancelled/Declined",
    "BER",
    "BER/Parts",
}

WAITING_CUSTOMER_STATUSES = {
    "Quote Sent",
    "Awaiting Confirmation",
    "Client To Contact",
    "Client Contacted",
    "Invoiced",
    "Password Req",
    "Repair Paused",
    "Awaiting Part",
    "Book Return Courier",
    "Return Booked",
    "Courier Booked",
    "Expecting Device",
}

ACTIVE_WIP_STATUSES = {
    "Under Repair",
    "Under Refurb",
    "Awaiting Part",
    "Received",
    "Queued For Repair",
    "Diagnostics",
    "Diagnostic Complete",
    "Reassemble",
    "Battery Testing",
    "Software Install",
    "Part Repaired",
    "New Repair",
}

PRE_ARRIVAL_OR_ABANDONED_STATUSES = {
    "Awaiting Confirmation",
    "Booking Confirmed",
    "Expecting Device",
    "Courier Booked",
    "Book Courier",
    "New Repair",
}

LIKELY_WORKSHOP_STATUSES = {
    "Received",
    "Queued For Repair",
    "Under Repair",
    "Under Refurb",
    "Diagnostics",
    "Diagnostic Complete",
    "Repair Paused",
    "Awaiting Part",
    "Reassemble",
    "Battery Testing",
    "Software Install",
    "Part Repaired",
    "Client To Contact",
    "Client Contacted",
    "Quote Sent",
    "Invoiced",
    "QC Failure",
}

CLIENT_SERVICE_GROUPS = {
    "Client Services - To Do",
    "Client Services - Awaiting Confirmation",
    "Awaiting Confirmation of Price",
}

FOLLOW_UP_GROUPS = CLIENT_SERVICE_GROUPS | {"Awaiting Parts", "Awaiting Collection", "Outbound Shipping"}


@dataclass
class BoardBundle:
    board_id: int
    board_name: str
    columns: dict[str, dict[str, Any]]
    items: list[dict[str, Any]]


def parse_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def parse_json(value: Any) -> Any:
    if value in (None, ""):
        return {}
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return {}


def parse_dt(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc)
    text = str(value).strip()
    if not text:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S.%fZ"):
        try:
            dt = datetime.strptime(text, fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        return None


def parse_activity_created_at(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        return datetime.fromtimestamp(int(str(raw)) / 10_000_000, tz=timezone.utc)
    except (TypeError, ValueError, OSError):
        return None


def clean_html(html: str | None) -> str:
    if not html:
        return ""
    text = html
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</p>", "\n", text)
    text = re.sub(r"(?i)<li[^>]*>", "- ", text)
    text = re.sub(r"(?i)</li>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)
    text = text.replace("\ufeff", "")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def escape_md(text: Any) -> str:
    return str(text or "").replace("|", "\\|").replace("\n", " ")


def money_value(raw: Any) -> float | None:
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        value = float(raw)
        return value if not math.isnan(value) else None
    parsed = parse_json(raw)
    if isinstance(parsed, dict):
        for key in ("value", "amount", "sum"):
            if key in parsed:
                try:
                    return float(parsed[key])
                except Exception:
                    continue
    text = str(raw).replace("£", "").replace(",", "").strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def fmt_date(value: datetime | None) -> str:
    return value.astimezone(timezone.utc).strftime("%Y-%m-%d") if value else ""


def fmt_dt(value: datetime | None) -> str:
    return value.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC") if value else ""


def fmt_money(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"£{value:,.2f}"


def days_since(value: datetime | None) -> int | None:
    if not value:
        return None
    delta = NOW - value.astimezone(timezone.utc)
    return max(0, int(delta.total_seconds() // 86400))


def bool_word(flag: bool) -> str:
    return "Yes" if flag else "No"


def percent(part: int, whole: int) -> float:
    return (part / whole * 100.0) if whole else 0.0


def best_dt(values: list[datetime | None]) -> datetime | None:
    filtered = [value for value in values if value]
    return max(filtered) if filtered else None


def truncate(text: str, limit: int = 110) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


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
        response = self.session.post(
            MONDAY_API_URL,
            json={"query": query, "variables": variables or {}},
            timeout=180,
        )
        self._last_request_at = time.monotonic()
        response.raise_for_status()
        payload = response.json()
        if payload.get("errors"):
            raise RuntimeError("; ".join(err.get("message", "Unknown Monday error") for err in payload["errors"]))
        return payload["data"]

    def fetch_board(self, board_id: int, column_ids: list[str]) -> BoardBundle:
        cols = ", ".join(f'"{column_id}"' for column_id in sorted(set(column_ids)))
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
            print(f"Fetched board items: {len(items)}", file=sys.stderr, flush=True)
            cursor = page.get("cursor")
        return BoardBundle(
            board_id=board_id,
            board_name=board["name"],
            columns={column["id"]: column for column in board.get("columns", [])},
            items=items,
        )

    def fetch_updates_for_items(self, item_ids: list[str]) -> dict[str, list[dict[str, Any]]]:
        updates_by_item: dict[str, list[dict[str, Any]]] = {}
        for start in range(0, len(item_ids), UPDATES_BATCH_SIZE):
            batch = item_ids[start : start + UPDATES_BATCH_SIZE]
            print(
                f"Fetching updates batch {start // UPDATES_BATCH_SIZE + 1}/{math.ceil(len(item_ids) / UPDATES_BATCH_SIZE)}",
                file=sys.stderr,
                flush=True,
            )
            ids = ", ".join(batch)
            query = f"""
            query {{
              items(ids:[{ids}]) {{
                id
                updates(limit:3) {{
                  id
                  body
                  created_at
                  creator {{ id name }}
                }}
              }}
            }}
            """
            data = self.query(query)
            for item in data.get("items", []):
                updates = []
                for update in item.get("updates", []):
                    updates.append(
                        {
                            "id": update["id"],
                            "created_at": parse_dt(update.get("created_at")),
                            "creator_name": (update.get("creator") or {}).get("name") or "",
                            "body_text": clean_html(update.get("body") or ""),
                        }
                    )
                updates.sort(key=lambda row: row["created_at"] or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
                updates_by_item[str(item["id"])] = updates[:3]
        return updates_by_item

    def fetch_status_activity_logs(self, item_ids: list[str]) -> dict[str, list[dict[str, Any]]]:
        logs_by_item: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for start in range(0, len(item_ids), ACTIVITY_BATCH_SIZE):
            batch = item_ids[start : start + ACTIVITY_BATCH_SIZE]
            print(
                f"Fetching status-log batch {start // ACTIVITY_BATCH_SIZE + 1}/{math.ceil(len(item_ids) / ACTIVITY_BATCH_SIZE)}",
                file=sys.stderr,
                flush=True,
            )
            ids = ", ".join(batch)
            query = f"""
            query {{
              boards(ids:[{BOARD_ID}]) {{
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
            logs = data["boards"][0].get("activity_logs", [])
            for log in logs:
                payload = parse_json(log.get("data"))
                pulse_id = str(payload.get("pulse_id") or "")
                if not pulse_id:
                    continue
                logs_by_item[pulse_id].append(log)
        for item_id in list(logs_by_item):
            logs_by_item[item_id].sort(
                key=lambda row: parse_activity_created_at(row.get("created_at")) or datetime.min.replace(tzinfo=timezone.utc)
            )
        return logs_by_item


def column_map(item: dict[str, Any], columns: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
    mapped: dict[str, dict[str, Any]] = {}
    for value in item.get("column_values", []):
        current = dict(value)
        current["title"] = columns.get(value["id"], {}).get("title", value["id"])
        mapped[value["id"]] = current
    return mapped


def cv_text(columns_by_id: dict[str, dict[str, Any]], column_id: str) -> str:
    return (columns_by_id.get(column_id, {}).get("text") or "").strip()


def cv_value(columns_by_id: dict[str, dict[str, Any]], column_id: str) -> Any:
    return columns_by_id.get(column_id, {}).get("value")


def detect_contact(columns_by_id: dict[str, dict[str, Any]]) -> tuple[str, bool]:
    parts = []
    if cv_text(columns_by_id, "text5"):
        parts.append("Email")
    if cv_text(columns_by_id, "text00"):
        parts.append("Phone")
    if cv_text(columns_by_id, "text15"):
        parts.append("Company")
    return (" + ".join(parts) if parts else "None"), bool(parts)


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


def infer_status_change_at(main_status: str, cols: dict[str, dict[str, Any]], item_created_at: datetime | None, updated_at: datetime | None) -> tuple[datetime | None, str]:
    inferred_map = {
        "Received": parse_dt(cv_text(cols, "date4")),
        "Booking Confirmed": parse_dt(cv_text(cols, "date6")),
        "Diagnostic Complete": parse_dt(cv_text(cols, "date_mkwdmm9k")),
        "Quote Sent": parse_dt(cv_text(cols, "date_mkwdwx03")),
        "Repaired": parse_dt(cv_text(cols, "collection_date")) or parse_dt(cv_text(cols, "date_mkwdan7z")),
        "Returned": parse_dt(cv_text(cols, "date3")),
    }
    if inferred_map.get(main_status):
        return inferred_map[main_status], f"Inferred from `{main_status}` date field"
    if updated_at:
        return updated_at, "Fallback to item updated_at"
    return item_created_at, "Fallback to item created_at"


def looks_like_pre_arrival(main_status: str, group_title: str, cols: dict[str, dict[str, Any]]) -> bool:
    received = parse_dt(cv_text(cols, "date4"))
    if main_status in PRE_ARRIVAL_OR_ABANDONED_STATUSES and not received:
        return True
    if group_title in {"Leads to Chase", "Cancelled/Missed Bookings", "Incoming Future"} and not received:
        return True
    return False


def likely_in_workshop(main_status: str, cols: dict[str, dict[str, Any]]) -> bool:
    if main_status in LIKELY_WORKSHOP_STATUSES:
        return True
    return bool(parse_dt(cv_text(cols, "date4")))


def classify_lead(days_stale: int | None, has_contact: bool, has_history: bool, repair_type: str, main_status: str) -> tuple[str, str]:
    if not has_contact:
        return "No", "No usable email or phone is present."
    if has_history and (repair_type not in {"Unconfirmed", "Counteroffer", "Booking Cancelled"} or main_status != "Awaiting Confirmation"):
        return "Yes", "There is contact data plus prior conversation or a defined repair intent."
    if days_stale is not None and days_stale > 365:
        return "No", "The lead is more than a year old with no meaningful follow-up trail."
    if repair_type in {"Repair", "Diagnostic", "Board Level", "Parts"}:
        return "Yes", "The lead has clear repair intent and reachable contact data."
    return "No", "The row looks like a cold intake with no strong conversion signal."


def build_record(
    item: dict[str, Any],
    board_columns: dict[str, dict[str, Any]],
    updates: list[dict[str, Any]],
    logs: list[dict[str, Any]],
    status_columns: dict[str, str],
) -> dict[str, Any]:
    cols = column_map(item, board_columns)
    main_status = cv_text(cols, "status4")
    repair_type = cv_text(cols, "status24")
    payment_status = cv_text(cols, "payment_status")
    payment_method = cv_text(cols, "payment_method")
    invoice_status = cv_text(cols, "color_mm0pkek6")
    xero_id = cv_text(cols, "text_mm0a8fwb")
    technician = cv_text(cols, "person")
    company = cv_text(cols, "text15")
    email = cv_text(cols, "text5")
    phone = cv_text(cols, "text00")
    address = cv_text(cols, "passcode")
    postcode = cv_text(cols, "text93")
    item_created_at = parse_dt(item.get("created_at"))
    item_updated_at = parse_dt(item.get("updated_at")) or parse_dt(cv_text(cols, "last_updated__1"))
    transitions = parse_status_transitions(logs)
    status_change_at = transitions[-1][0] if transitions else None
    status_change_source = "Live status activity log" if status_change_at else ""
    if not status_change_at:
        status_change_at, status_change_source = infer_status_change_at(main_status, cols, item_created_at, item_updated_at)
    latest_update_at = updates[0]["created_at"] if updates else None
    date_candidates = [
        item_created_at,
        item_updated_at,
        status_change_at,
        latest_update_at,
        parse_dt(cv_text(cols, "date4")),
        parse_dt(cv_text(cols, "date6")),
        parse_dt(cv_text(cols, "date_mkwdmm9k")),
        parse_dt(cv_text(cols, "date_mkwdwx03")),
        parse_dt(cv_text(cols, "collection_date")),
        parse_dt(cv_text(cols, "date_mkwdan7z")),
        parse_dt(cv_text(cols, "date3")),
        parse_dt(cv_text(cols, "date_mkypt8db")),
        parse_dt(cv_text(cols, "date_mm0erp17")),
        parse_dt(cv_text(cols, "date_mm0e4e3f")),
    ]
    last_activity_at = best_dt(date_candidates)
    days_status_change = days_since(status_change_at)
    days_stale = days_since(last_activity_at)
    paid_surface = money_value(cv_text(cols, "dup__of_quote_total")) or money_value(cv_value(cols, "dup__of_quote_total"))
    invoice_amount = money_value(cv_text(cols, "numeric_mm0pvem5")) or money_value(cv_value(cols, "numeric_mm0pvem5"))
    payment1_amount = money_value(cv_text(cols, "numeric_mm0ewvp2")) or money_value(cv_value(cols, "numeric_mm0ewvp2"))
    payment2_amount = money_value(cv_text(cols, "numeric_mm0ea452")) or money_value(cv_value(cols, "numeric_mm0ea452"))
    payment_total = None
    if payment1_amount is not None or payment2_amount is not None:
        payment_total = (payment1_amount or 0.0) + (payment2_amount or 0.0)
    exposure_amount = max([value for value in (invoice_amount, payment_total, paid_surface) if value is not None], default=None)
    payment_status_financial = payment_status in {"Confirmed", "Warranty", "Corporate - Pay Later"}
    invoice_status_financial = invoice_status in {"Draft", "Sent", "Paid", "Overdue"}
    has_payment_data = any(
        [
            paid_surface not in (None, 0),
            payment_total not in (None, 0),
            invoice_amount not in (None, 0),
            payment_status_financial,
            invoice_status_financial,
        ]
    )
    has_financial_flag = bool(xero_id or has_payment_data)
    contact_summary, has_contact = detect_contact(cols)
    has_history = bool(updates or transitions)
    lead_worth, lead_reason = classify_lead(days_stale, has_contact, has_history, repair_type, main_status)
    in_workshop = likely_in_workshop(main_status, cols)
    pre_arrival = looks_like_pre_arrival(main_status, item["group"]["title"], cols)
    is_real_wip = (days_stale is not None and days_stale <= 30 and main_status in ACTIVE_WIP_STATUSES)
    waiting_customer = (
        main_status in WAITING_CUSTOMER_STATUSES
        or item["group"]["title"] in FOLLOW_UP_GROUPS
        or payment_status in {"Pending", "Pay In Store - Pending", "Corporate - Pay Later"}
        or invoice_status in {"Draft", "Sent", "Overdue"}
    )
    archive_eligible = (
        (days_status_change is not None and days_status_change >= 90)
        and not has_financial_flag
        and (pre_arrival or (main_status == "Quote Sent" and not in_workshop))
    )

    if item["group"]["title"] == "Leads to Chase":
        category = 5
        if has_financial_flag:
            issue = lead_reason + " Financial signal present, so do not purge blindly."
            action = "Manual finance check, then decide whether to re-engage or purge."
        else:
            issue = lead_reason
            action = "Re-engage once" if lead_worth == "Yes" else "Purge/archive from active queue."
    elif has_financial_flag:
        category = 3
        if xero_id and payment_status in {"No Payment", "", "Pending", "Pay In Store - Pending"}:
            issue = "Xero invoice linked but the job is still open with no confirmed payment."
        elif payment_total not in (None, 0) and invoice_amount not in (None, 0) and payment_total < invoice_amount:
            issue = "Partial payment is recorded against an unresolved job."
        elif paid_surface not in (None, 0):
            issue = "Paid value is present on an item that never reached a terminal state."
        else:
            issue = "Payment status or method shows financial handling on a still-open row."
        action = "Finance + ops review before any archive or customer action."
    elif is_real_wip:
        category = 4
        issue = "Recent operational touch and status imply active work."
        action = "Leave alone."
    elif archive_eligible:
        category = 1
        issue = "90+ days since status movement, no finance signal, and no workshop arrival signal."
        action = "Archive/close."
    elif waiting_customer and days_stale is not None and days_stale >= 30:
        category = 2
        issue = "Customer-response dependent state is stale but not financially clean enough to archive blindly."
        action = "Queue for customer follow-up."
    elif days_stale is not None and days_stale >= 90 and not in_workshop:
        category = 1
        issue = "Long-stale non-workshop row with no sign of current handling."
        action = "Archive/close."
    elif days_stale is not None and days_stale >= 30:
        category = 2
        issue = "Open row is stale and needs a human decision rather than passive waiting."
        action = "Review and follow up."
    else:
        category = 4
        issue = "Recent touch keeps it inside live WIP."
        action = "Leave alone."

    if category == 1:
        reason_bits = [issue]
        if main_status == "Quote Sent":
            reason_bits.append("Quote has aged out with no later follow-up.")
        if pre_arrival:
            reason_bits.append("No received date suggests the device never arrived.")
        archive_reason = " ".join(reason_bits)
    else:
        archive_reason = issue

    return {
        "id": str(item["id"]),
        "item_name": item["name"],
        "item_label": f"{item['name']} (#{item['id']})",
        "customer": company or item["name"],
        "group": item["group"]["title"],
        "main_status": main_status,
        "repair_type": repair_type,
        "technician": technician or "Unassigned",
        "status_columns": status_columns,
        "last_activity_at": last_activity_at,
        "last_update_at": latest_update_at,
        "status_change_at": status_change_at,
        "status_change_source": status_change_source,
        "days_since_status_change": days_status_change,
        "days_stale": days_stale,
        "contact_summary": contact_summary,
        "has_contact": has_contact,
        "contact_details": {"email": email, "phone": phone, "company": company, "address": address, "postcode": postcode},
        "updates": updates,
        "update_count": len(updates),
        "has_history": has_history,
        "has_payment_data": has_payment_data,
        "has_financial_flag": has_financial_flag,
        "has_xero": bool(xero_id),
        "xero_id": xero_id,
        "payment_status": payment_status,
        "payment_method": payment_method,
        "invoice_status": invoice_status,
        "paid_surface": paid_surface,
        "invoice_amount": invoice_amount,
        "payment1_amount": payment1_amount,
        "payment2_amount": payment2_amount,
        "payment_total": payment_total,
        "financial_exposure": exposure_amount,
        "in_workshop": in_workshop,
        "category": category,
        "issue": issue,
        "recommended_action": action,
        "archive_reason": archive_reason,
        "lead_worth": lead_worth,
        "lead_reason": lead_reason,
        "pre_arrival": pre_arrival,
    }


def age_bucket(days_value: int | None) -> str:
    if days_value is None:
        return "Unknown"
    if days_value < 30:
        return "0-30d"
    if days_value < 90:
        return "30-90d"
    if days_value < 180:
        return "90-180d"
    if days_value < 365:
        return "180-365d"
    return "365d+"


def suggested_follow_up(record: dict[str, Any]) -> str:
    status = record["main_status"]
    if status == "Quote Sent":
        return "Send final quote reminder with accept/decline deadline, then close if no reply."
    if status in {"Awaiting Confirmation", "Booking Confirmed", "Expecting Device"}:
        return "Ask whether the customer still wants to proceed; close if no answer."
    if status in {"Repair Paused", "Awaiting Part"}:
        return "Confirm whether the customer still wants the repair kept open and whether parts should still be ordered."
    if status in {"Invoiced"}:
        return "Check whether customer has seen the invoice and wants to proceed."
    return "One chase attempt, then close if there is no response."


def payment_surface_text(record: dict[str, Any]) -> str:
    parts = []
    if record["paid_surface"] not in (None, 0):
        parts.append(f"Paid {fmt_money(record['paid_surface'])}")
    if record["invoice_amount"] not in (None, 0):
        parts.append(f"Invoice {fmt_money(record['invoice_amount'])}")
    if record["payment_total"] not in (None, 0):
        parts.append(f"P1/P2 {fmt_money(record['payment_total'])}")
    if record["payment_status"]:
        parts.append(record["payment_status"])
    if record["payment_method"]:
        parts.append(record["payment_method"])
    return "; ".join(parts) if parts else "n/a"


def required_finance_action(record: dict[str, Any]) -> str:
    if record["has_xero"] and record["invoice_status"] in {"Draft", "Sent", "Overdue"}:
        return "Check Xero invoice state, decide whether to collect, void, or close the job."
    if record["payment_total"] not in (None, 0) and record["invoice_amount"] not in (None, 0) and record["payment_total"] < record["invoice_amount"]:
        return "Confirm whether the balance is outstanding or the Monday payment surface is incomplete."
    if record["paid_surface"] not in (None, 0):
        return "Confirm whether the device was returned/collected and close the operational row."
    return "Manual finance review before any operational cleanup."


def update_summary(record: dict[str, Any]) -> str:
    if not record["updates"]:
        return "No recent updates"
    parts = []
    for update in record["updates"]:
        stamp = fmt_date(update["created_at"])
        author = update["creator_name"] or "Unknown"
        body = truncate(update["body_text"] or "(blank)", 70)
        parts.append(f"{stamp} {author}: {body}")
    return " || ".join(parts)


def render_table(headers: list[str], rows: list[list[Any]]) -> list[str]:
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(escape_md(cell) for cell in row) + " |")
    return lines


def build_report(records: list[dict[str, Any]], generated_at: datetime) -> str:
    total = len(records)
    category_counts = Counter(record["category"] for record in records)
    leads = [record for record in records if record["group"] == "Leads to Chase"]
    archive_rows = sorted(
        [record for record in records if record["category"] == 1],
        key=lambda record: (record["days_stale"] or -1),
        reverse=True,
    )
    follow_up_rows = sorted(
        [record for record in records if record["category"] == 2],
        key=lambda record: (record["days_stale"] or -1),
        reverse=True,
    )
    finance_rows = sorted(
        [record for record in records if record["has_financial_flag"]],
        key=lambda record: ((record["financial_exposure"] or -1), (record["days_stale"] or -1)),
        reverse=True,
    )
    lead_rows = sorted(
        leads,
        key=lambda record: ((record["lead_worth"] == "Yes"), -(record["days_stale"] or 0)),
        reverse=True,
    )
    financial_exposure_total = sum(record["financial_exposure"] or 0.0 for record in finance_rows)
    age_counts = Counter(age_bucket(record["days_stale"]) for record in records if (record["days_stale"] or 0) >= 30)
    lead_reengage = sum(1 for record in leads if record["lead_worth"] == "Yes")
    lead_purge = len(leads) - lead_reengage

    lines: list[str] = []
    lines.append("# Monday Zombie Triage")
    lines.append("")
    lines.append(f"_Generated: {fmt_dt(generated_at)}_")
    lines.append("")
    lines.append("Internal-only operational report. Customer names are included here for identification and should not be shared externally.")
    lines.append("")

    lines.append("## Section 1: Summary")
    lines.append("")
    lines.append(f"- Total non-terminal items analysed: `{total}`")
    lines.append(f"- Category 1 `Safe to Archive`: `{category_counts[1]}` ({percent(category_counts[1], total):.1f}%)")
    lines.append(f"- Category 2 `Needs Customer Follow-Up`: `{category_counts[2]}` ({percent(category_counts[2], total):.1f}%)")
    lines.append(f"- Category 3 `Financial Implications`: `{category_counts[3]}` ({percent(category_counts[3], total):.1f}%)")
    lines.append(f"- Category 4 `Real WIP`: `{category_counts[4]}` ({percent(category_counts[4], total):.1f}%)")
    lines.append(f"- Category 5 `Leads to Chase`: `{category_counts[5]}` ({percent(category_counts[5], total):.1f}%)")
    lines.append(f"- Total financial exposure in unresolved finance-review items: `{fmt_money(financial_exposure_total)}`")
    lines.append("")
    lines.append("Age distribution of 30+ day backlog:")
    lines.append("")
    lines.extend(
        render_table(
            ["Age bucket", "Count"],
            [
                ["30-90d", age_counts.get("30-90d", 0)],
                ["90-180d", age_counts.get("90-180d", 0)],
                ["180-365d", age_counts.get("180-365d", 0)],
                ["365d+", age_counts.get("365d+", 0)],
            ],
        )
    )
    lines.append("")
    if finance_rows:
        lines.append("Financial exposure notes:")
        lines.append("")
        for line in [
            f"- Finance-review list size: `{len(finance_rows)}` items.",
            f"- `{sum(1 for record in finance_rows if record['has_xero'])}` open items have a linked Xero invoice.",
            f"- `{sum(1 for record in finance_rows if record['payment_total'] not in (None, 0) or record['paid_surface'] not in (None, 0))}` items show a payment/deposit surface on a still-open row.",
            f"- Exposure is directional, using the largest visible Monday value across invoice amount, paid amount, or Payment 1/2 amounts.",
        ]:
            lines.append(line)
        lines.append("")
    lines.append("Leads to Chase breakdown:")
    lines.append("")
    lines.append(f"- Re-engage candidates: `{lead_reengage}`")
    lines.append(f"- Purge/archive candidates: `{lead_purge}`")
    lines.append("")

    lines.append("## Section 2: Safe to Archive")
    lines.append("")
    lines.extend(
        render_table(
            ["Item", "Customer", "Status", "Group", "Last Activity", "Days Stale", "Reason"],
            [
                [
                    record["item_label"],
                    record["customer"],
                    record["main_status"],
                    record["group"],
                    fmt_date(record["last_activity_at"]),
                    record["days_stale"] if record["days_stale"] is not None else "n/a",
                    record["archive_reason"],
                ]
                for record in archive_rows
            ]
            or [["None", "", "", "", "", "", ""]],
        )
    )
    lines.append("")

    lines.append("## Section 3: Needs Customer Follow-Up")
    lines.append("")
    lines.extend(
        render_table(
            ["Item", "Customer", "Status", "Group", "Last Activity", "Days Stale", "Contact Info Available", "Suggested Action"],
            [
                [
                    record["item_label"],
                    record["customer"],
                    record["main_status"],
                    record["group"],
                    fmt_date(record["last_activity_at"]),
                    record["days_stale"] if record["days_stale"] is not None else "n/a",
                    record["contact_summary"],
                    suggested_follow_up(record),
                ]
                for record in follow_up_rows
            ]
            or [["None", "", "", "", "", "", "", ""]],
        )
    )
    lines.append("")

    lines.append("## Section 4: Financial Implications")
    lines.append("")
    lines.extend(
        render_table(
            ["Item", "Customer", "Status", "Payment", "Xero Ref", "Days Stale", "Issue", "Required Action"],
            [
                [
                    record["item_label"],
                    record["customer"],
                    record["main_status"],
                    payment_surface_text(record),
                    record["xero_id"] or "n/a",
                    record["days_stale"] if record["days_stale"] is not None else "n/a",
                    record["issue"],
                    required_finance_action(record),
                ]
                for record in finance_rows
            ]
            or [["None", "", "", "", "", "", "", ""]],
        )
    )
    lines.append("")

    lines.append("## Section 5: Leads to Chase Analysis")
    lines.append("")
    lines.extend(
        render_table(
            ["Item", "Customer", "Contact Available", "Any History", "Worth Re-engaging", "Reason"],
            [
                [
                    record["item_label"],
                    record["customer"],
                    record["contact_summary"],
                    bool_word(record["has_history"]),
                    record["lead_worth"],
                    record["lead_reason"],
                ]
                for record in lead_rows
            ]
            or [["None", "", "", "", "", ""]],
        )
    )
    lines.append("")

    lines.append("## Section 6: Recommended Batch Actions")
    lines.append("")
    lines.append(f"1. Items to archive immediately: `{len(archive_rows)}`")
    lines.append("   Archive Category 1 rows first. They are the cleanest long-stale rows with no visible finance signal and no workshop-arrival signal.")
    lines.append("")
    lines.append(f"2. Customer follow-up campaign list: `{len(follow_up_rows)}`")
    lines.append("   Suggested templates:")
    lines.append("   - `Quote Sent`: 'We sent your quote on <date>. Let us know by <deadline> if you want to proceed, otherwise we will close the job.'")
    lines.append("   - `Awaiting Confirmation / Booking Confirmed / Expecting Device`: 'Do you still want to proceed with this repair? If not, we will close the booking.'")
    lines.append("   - `Repair Paused / Awaiting Part`: 'Your job is still open pending your confirmation/parts decision. Reply if you want us to keep it active.'")
    lines.append("")
    lines.append(f"3. Finance review list (for Ricky/accountant): `{len(finance_rows)}`")
    lines.append("   Review every Category 3 row before cleanup. Priority order is the top of Section 4 because the table is sorted by visible value surface descending.")
    lines.append("")
    lines.append(f"4. Leads to purge vs re-engage: purge `{lead_purge}`, re-engage `{lead_reengage}`")
    lines.append("   Use a single last-touch re-engagement on the positive subset, then purge/archive the rest from the active queue.")
    lines.append("")

    lines.append("## Notes")
    lines.append("")
    lines.append("- `Days since last status change` is taken from live `status4` activity logs where available; otherwise it falls back to the closest visible status-date field or item update timestamp.")
    lines.append("- `Days stale` is based on the latest visible operational touch across updates, status movement, lifecycle dates, payment dates, and item update timestamps.")
    lines.append("- Monday payment fields are known to be incomplete, so the finance exposure surface here is a review queue, not a final ledger.")
    lines.append("")

    lines.append("## Appendix: Category 4 Real WIP Summary")
    lines.append("")
    wip_by_status = Counter(record["main_status"] for record in records if record["category"] == 4)
    lines.extend(
        render_table(
            ["Status", "Count"],
            [[status, count] for status, count in sorted(wip_by_status.items(), key=lambda row: (-row[1], row[0]))]
            or [["None", 0]],
        )
    )
    lines.append("")

    lines.append("## Appendix: Item-Level Signals")
    lines.append("")
    lines.extend(
        render_table(
            [
                "Item",
                "Category",
                "Days Since Status Change",
                "Days Stale",
                "Tech",
                "Has Payment Data",
                "Has Xero",
                "Status Change Source",
                "Recent Updates",
            ],
            [
                [
                    record["item_label"],
                    record["category"],
                    record["days_since_status_change"] if record["days_since_status_change"] is not None else "n/a",
                    record["days_stale"] if record["days_stale"] is not None else "n/a",
                    record["technician"],
                    bool_word(record["has_payment_data"]),
                    bool_word(record["has_xero"]),
                    record["status_change_source"],
                    update_summary(record),
                ]
                for record in sorted(records, key=lambda row: ((row["days_stale"] or -1), row["item_name"]), reverse=True)
            ],
        )
    )
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    print("Starting Monday zombie triage", file=sys.stderr, flush=True)
    env = parse_env(ENV_PATH)
    token = env.get("MONDAY_APP_TOKEN")
    if not token:
        raise SystemExit("MONDAY_APP_TOKEN is missing from env file")

    client = MondayClient(token)
    print("Fetching schema", file=sys.stderr, flush=True)
    schema_data = client.query(
        f"""
        query {{
          boards(ids:[{BOARD_ID}]) {{
            id
            name
            columns {{
              id
              title
              type
              settings_str
            }}
          }}
        }}
        """
    )
    print("Fetched schema", file=sys.stderr, flush=True)
    board = schema_data["boards"][0]
    all_columns = {column["id"]: column for column in board["columns"]}
    status_column_ids = [column["id"] for column in board["columns"] if column["type"] == "status"]
    date_like_ids = [column["id"] for column in board["columns"] if column["type"] in {"date", "last_updated"}]
    extra_ids = [
        "person",
        "text5",
        "text00",
        "text15",
        "passcode",
        "text93",
        "dup__of_quote_total",
        "numeric_mm0pvem5",
        "numeric_mm0ewvp2",
        "numeric_mm0ea452",
        "text_mm0eh9f1",
        "text_mm0e9xr",
        "text_mm0a8fwb",
        "link_mm0a43e0",
    ]
    column_ids = sorted(set(status_column_ids + date_like_ids + extra_ids))
    bundle = client.fetch_board(BOARD_ID, column_ids)
    print(f"Fetched board rows: {len(bundle.items)}", file=sys.stderr, flush=True)

    non_terminal_items = []
    for item in bundle.items:
        cols = column_map(item, all_columns)
        main_status = cv_text(cols, "status4")
        if main_status in TERMINAL_STATUSES:
            continue
        non_terminal_items.append(item)
    print(f"Non-terminal rows after filtering: {len(non_terminal_items)}", file=sys.stderr, flush=True)

    item_ids = [str(item["id"]) for item in non_terminal_items]
    updates_by_item = client.fetch_updates_for_items(item_ids)
    logs_by_item = client.fetch_status_activity_logs(item_ids)

    status_titles = {column["id"]: column["title"] for column in board["columns"] if column["type"] == "status"}
    records = []
    for item in non_terminal_items:
        cols = column_map(item, all_columns)
        status_snapshot = {title: (cols.get(column_id, {}).get("text") or "").strip() for column_id, title in status_titles.items()}
        status_snapshot = {title: value for title, value in status_snapshot.items() if value}
        record = build_record(
            item=item,
            board_columns=all_columns,
            updates=updates_by_item.get(str(item["id"]), []),
            logs=logs_by_item.get(str(item["id"]), []),
            status_columns=status_snapshot,
        )
        records.append(record)
    print(f"Classified rows: {len(records)}", file=sys.stderr, flush=True)

    report = build_report(records, NOW)
    OUTPUT_PATH.write_text(report, encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH}")
    print(f"Non-terminal items analysed: {len(records)}")
    counts = Counter(record["category"] for record in records)
    for category in sorted(counts):
        print(f"Category {category}: {counts[category]}")


if __name__ == "__main__":
    main()
