#!/usr/bin/env python3

import argparse
import copy
import html
import json
import math
import re
import sys
import threading
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple
from zoneinfo import ZoneInfo

import requests


BASE_URL = "https://api.intercom.io"
INTERCOM_VERSION = "2.13"
ROOT = Path("/home/ricky/builds/system-audit-2026-03-31")
ENV_PATH = Path("/home/ricky/config/api-keys/.env")
EXPORT_DIR = Path("/home/ricky/data/exports/system-audit-2026-03-31/intercom")
REPORT_PATH = ROOT / "intercom-full-metrics.md"
UTC = timezone.utc
LONDON = ZoneInfo("Europe/London")
THREAD_LOCAL = threading.local()

STATUS_NOTIFICATION_PATTERNS = [
    "thank you for dropping off your device with icorrect",
    "thank you for sending your device for repair with icorrect",
    "your appointment with icorrect is booked for",
    "your warranty appointment with icorrect is booked for",
    "your courier has now been arranged",
    "your packaging has been shipped via royal mail tracked 24",
    "your repair has been completed and your device is ready for collection",
    "we have completed your warranty repair and your device is ready for collection",
    "your device is on the way back to you",
    "your warranty repair has been completed and we have arranged for your device to be delivered back to you",
    "your repair has been completed and your device is on the way back to you via courier",
]

PHONE_PATTERNS = [
    "phone enquiry",
    "phone inquiry",
    "call back",
    "telephone",
    "voicemail",
    "callerid",
    "mailbox 900",
    "telesphere",
]

WARRANTY_PATTERNS = [
    "warranty",
    "aftercare",
    "return courier warranty",
]

QUOTE_PATTERNS = [
    "quote request",
    "quote sent",
    "send quote",
    "new quote",
    "repair quote",
    "pricing",
    "how much",
    "what would it cost",
    "what is the cost",
    "price for",
    "price to repair",
]

PAYMENT_PATTERNS = [
    "payment link",
    "pay online",
    "payment received",
    "invoice",
    "payment reminder",
    "payment request",
]

SHOPIFY_PATTERNS = [
    "shopify order",
    "shopify",
]

RISK_PATTERN_GROUPS = {
    "refund": [r"\brefund\b", r"\breimburse"],
    "complaint": [r"\bcomplain", r"\bcomplaint\b", r"\bissue\b", r"\bproblem\b"],
    "unhappy": [r"\bunhappy\b", r"\bdisappoint", r"\bfrustrat"],
    "waiting": [r"\bwaiting\b", r"\bstill waiting\b", r"\bno update\b"],
    "slow": [r"\bslow\b", r"\bdelay", r"\bdelayed\b", r"\btaking too long\b"],
    "cancel": [r"\bcancel", r"\bcancellation\b"],
    "return": [r"\breturn\b", r"\breturned\b"],
    "pricing_quote": [r"\bquote\b", r"\bpricing\b", r"\bprice\b", r"\bcost\b", r"\bhow much\b"],
}

THEME_PATTERN_GROUPS = {
    "pricing_quote": QUOTE_PATTERNS,
    "refund_return": ["refund", "return", "reimburse", "money back"],
    "complaint_delay": ["complaint", "unhappy", "frustrated", "delay", "slow", "waiting", "still waiting"],
    "booking_reschedule": ["book", "appointment", "reschedule", "availability", "slot"],
    "warranty": WARRANTY_PATTERNS,
    "payment_invoice": ["payment", "invoice", "receipt"],
    "status_update": ["status", "update", "where is my", "tracking", "courier", "ready for collection"],
    "trade_in": ["trade-in", "trade in", "backmarket", "back market"],
    "repair_technical": ["repair", "diagnostic", "screen", "battery", "water damage", "logic board"],
}

SOCIAL_SOURCES = {"instagram", "facebook", "whatsapp"}
CUSTOMER_AUTHOR_TYPES = {"user", "lead", "contact"}
HUMAN_ADMIN_AUTHOR_TYPES = {"admin"}
BOT_AUTHOR_TYPES = {"bot"}

BUSINESS_HOUR_NOTE = (
    "Europe/London business-hours proxy: Mon-Thu 09:30-17:30 and Fri 10:00-17:30. "
    "Weekends treated as out of hours."
)


def eprint(*args: Any) -> None:
    print(*args, file=sys.stderr, flush=True)


def read_intercom_token() -> str:
    text = ENV_PATH.read_text()
    match = re.search(r"^INTERCOM_(?:ACCESS_)?API?_?TOKEN=(.+)$", text, re.M)
    if not match:
        raise RuntimeError(f"Intercom token not found in {ENV_PATH}")
    return match.group(1).strip()


def build_session(token: str) -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Intercom-Version": INTERCOM_VERSION,
            "User-Agent": "codex-intercom-full-metrics/1.0",
        }
    )
    return session


def thread_session(token: str) -> requests.Session:
    session = getattr(THREAD_LOCAL, "session", None)
    if session is None:
        session = build_session(token)
        THREAD_LOCAL.session = session
    return session


def api_request(
    session: requests.Session,
    method: str,
    path: str,
    *,
    params: Optional[Dict[str, Any]] = None,
    json_body: Optional[Dict[str, Any]] = None,
    max_attempts: int = 7,
) -> requests.Response:
    url = f"{BASE_URL}{path}"
    backoff = 1.0
    for attempt in range(1, max_attempts + 1):
        response = session.request(method, url, params=params, json=json_body, timeout=120)
        if response.status_code == 429:
            sleep_for = backoff
            reset = response.headers.get("x-ratelimit-reset")
            if reset:
                try:
                    sleep_for = max(1.0, int(reset) - int(time.time()))
                except ValueError:
                    pass
            eprint(f"rate limited on {path}; sleeping {sleep_for:.1f}s")
            time.sleep(sleep_for)
            backoff = min(backoff * 2, 30.0)
            continue
        if response.status_code >= 500:
            if attempt == max_attempts:
                response.raise_for_status()
            eprint(f"server error {response.status_code} on {path}; retrying in {backoff:.1f}s")
            time.sleep(backoff)
            backoff = min(backoff * 2, 30.0)
            continue
        response.raise_for_status()
        return response
    raise RuntimeError(f"failed request after retries: {method} {path}")


def strip_html(value: Any) -> str:
    if value is None:
        return ""
    text = html.unescape(str(value))
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</p\s*>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def lower_text_blob(parts: Iterable[Any]) -> str:
    cleaned = [strip_html(part) for part in parts if part]
    return " \n ".join(cleaned).lower()


def month_start(d: date) -> date:
    return d.replace(day=1)


def add_months(d: date, months: int) -> date:
    year = d.year + ((d.month - 1 + months) // 12)
    month = (d.month - 1 + months) % 12 + 1
    return date(year, month, 1)


def fmt_month(d: date) -> str:
    return d.strftime("%Y-%m")


def fmt_ts(ts: Optional[int]) -> str:
    if ts is None:
        return "n/a"
    return datetime.fromtimestamp(ts, tz=UTC).astimezone(LONDON).strftime("%Y-%m-%d %H:%M")


def int_or_none(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(value)
    except Exception:
        return None


def float_or_none(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except Exception:
        return None


def percentile(values: List[float], q: float) -> Optional[float]:
    if not values:
        return None
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    pos = (len(ordered) - 1) * q
    low = math.floor(pos)
    high = math.ceil(pos)
    if low == high:
        return ordered[low]
    weight = pos - low
    return ordered[low] * (1 - weight) + ordered[high] * weight


def fmt_hours(seconds: Optional[float]) -> str:
    if seconds is None:
        return "n/a"
    return f"{seconds / 3600:.2f}h"


def fmt_pct(value: Optional[float]) -> str:
    if value is None:
        return "n/a"
    return f"{value * 100:.1f}%"


def table_line(values: List[str]) -> str:
    return "| " + " | ".join(values) + " |"


def owner_label(owner_id: Optional[int], mapping: Dict[int, str]) -> str:
    if owner_id is None:
        return "Unassigned"
    return mapping.get(owner_id, str(owner_id))


def weekday_name(ts: int) -> str:
    return datetime.fromtimestamp(ts, tz=UTC).astimezone(LONDON).strftime("%A")


def local_hour(ts: int) -> int:
    return datetime.fromtimestamp(ts, tz=UTC).astimezone(LONDON).hour


def local_month_from_ts(ts: int) -> str:
    return fmt_month(datetime.fromtimestamp(ts, tz=UTC).astimezone(LONDON).date().replace(day=1))


def is_out_of_hours(ts: int) -> bool:
    local = datetime.fromtimestamp(ts, tz=UTC).astimezone(LONDON)
    weekday = local.weekday()
    if weekday >= 5:
        return True
    minutes = local.hour * 60 + local.minute
    if weekday <= 3:
        return not (9 * 60 + 30 <= minutes < 17 * 60 + 30)
    return not (10 * 60 <= minutes < 17 * 60 + 30)


def summarize_percentiles(values: List[float]) -> Dict[str, Optional[float]]:
    return {
        "count": len(values),
        "median": percentile(values, 0.50),
        "p75": percentile(values, 0.75),
        "p90": percentile(values, 0.90),
    }


def summarize_response(records: List[Dict[str, Any]], field: str) -> Dict[str, Optional[float]]:
    values = [float(r[field]) for r in records if r.get(field) is not None]
    return summarize_percentiles(values)


def classify_record(record: Dict[str, Any]) -> Dict[str, Any]:
    source = record["source"]
    text_blob = lower_text_blob(
        [
            source.get("subject"),
            source.get("body"),
            record.get("title"),
            record.get("default_title"),
            record.get("default_description"),
            record.get("ticket_default_title"),
            record.get("ticket_default_description"),
            " ".join(record.get("tags", [])),
        ]
    )

    native_source = source.get("type") or "unknown"
    author_type = source.get("author_type")
    delivered_as = source.get("delivered_as")

    if author_type in BOT_AUTHOR_TYPES:
        initiator_type = "bot_initiated"
    elif delivered_as == "customer_initiated" or author_type in CUSTOMER_AUTHOR_TYPES:
        initiator_type = "customer_initiated"
    elif delivered_as == "admin_initiated" or author_type in HUMAN_ADMIN_AUTHOR_TYPES:
        initiator_type = "company_initiated"
    else:
        initiator_type = "unknown"

    if any(pattern in text_blob for pattern in STATUS_NOTIFICATION_PATTERNS):
        derived_category = "status_notification"
    elif any(pattern in text_blob for pattern in PHONE_PATTERNS):
        derived_category = "phone"
    elif any(pattern in text_blob for pattern in WARRANTY_PATTERNS):
        derived_category = "warranty"
    elif any(pattern in text_blob for pattern in QUOTE_PATTERNS):
        derived_category = "pricing_quote"
    elif any(pattern in text_blob for pattern in PAYMENT_PATTERNS):
        derived_category = "payment_invoice"
    elif any(pattern in text_blob for pattern in SHOPIFY_PATTERNS):
        derived_category = "shopify"
    elif native_source == "conversation":
        derived_category = "web_messenger"
    else:
        derived_category = native_source

    if derived_category == "phone":
        channel_rollup = "phone"
        channel_detail = "phone"
    elif native_source == "conversation":
        channel_rollup = "web_messenger"
        channel_detail = "web_messenger"
    elif native_source == "email":
        channel_rollup = "email"
        channel_detail = "email"
    elif native_source in SOCIAL_SOURCES:
        channel_rollup = "social"
        channel_detail = native_source
    elif initiator_type == "company_initiated":
        channel_rollup = "company_outbound"
        channel_detail = native_source
    elif initiator_type == "bot_initiated":
        channel_rollup = "bot"
        channel_detail = native_source
    else:
        channel_rollup = "other"
        channel_detail = native_source

    record["text_blob"] = text_blob
    record["native_source"] = native_source
    record["initiator_type"] = initiator_type
    record["derived_category"] = derived_category
    record["channel_rollup"] = channel_rollup
    record["channel_detail"] = channel_detail
    record["addressable_inbound"] = (
        initiator_type == "customer_initiated" and derived_category != "status_notification"
    )
    record["risk_terms"] = detect_risk_terms(text_blob)
    record["themes"] = classify_themes(text_blob)
    return record


def detect_risk_terms(text: str) -> List[str]:
    hits = []
    for label, patterns in RISK_PATTERN_GROUPS.items():
        if any(re.search(pattern, text, flags=re.I) for pattern in patterns):
            hits.append(label)
    return hits


def classify_themes(text: str) -> List[str]:
    hits = []
    lower = text.lower()
    for label, patterns in THEME_PATTERN_GROUPS.items():
        if any(pattern in lower for pattern in patterns):
            hits.append(label)
    return hits


def normalize_search_conversation(conv: Dict[str, Any]) -> Dict[str, Any]:
    source = conv.get("source") or {}
    stats = conv.get("statistics") or {}
    custom = conv.get("custom_attributes") or {}
    ticket = conv.get("ticket") or {}
    ticket_custom = ticket.get("custom_attributes") or {}
    tags = conv.get("tags", {}).get("tags", [])
    contacts = (conv.get("contacts") or {}).get("contacts") or []
    rating = conv.get("conversation_rating")

    created_at = int_or_none(conv.get("created_at"))
    month = local_month_from_ts(created_at) if created_at is not None else None

    record = {
        "id": str(conv.get("id")),
        "created_at": created_at,
        "updated_at": int_or_none(conv.get("updated_at")),
        "waiting_since": int_or_none(conv.get("waiting_since")),
        "open": bool(conv.get("open")),
        "state": conv.get("state"),
        "month": month,
        "source": {
            "type": source.get("type"),
            "delivered_as": source.get("delivered_as"),
            "subject": source.get("subject"),
            "body": source.get("body"),
            "author_type": (source.get("author") or {}).get("type"),
            "author_id": int_or_none((source.get("author") or {}).get("id")),
            "author_name": (source.get("author") or {}).get("name"),
            "author_email": (source.get("author") or {}).get("email"),
        },
        "contacts": [
            {
                "id": str(contact.get("id")),
                "external_id": contact.get("external_id"),
            }
            for contact in contacts
            if contact.get("id")
        ],
        "admin_assignee_id": int_or_none(conv.get("admin_assignee_id")),
        "team_assignee_id": int_or_none(conv.get("team_assignee_id")),
        "tags": [tag.get("name") for tag in tags if tag.get("name")],
        "title": conv.get("title"),
        "default_title": custom.get("_default_title_"),
        "default_description": custom.get("_default_description_"),
        "custom_attributes": custom,
        "conversation_rating": rating,
        "ticket_state": ticket.get("state"),
        "ticket_type": ticket.get("ticket_type"),
        "ticket_custom_state_admin_label": ticket.get("ticket_custom_state_admin_label"),
        "ticket_default_title": ((ticket_custom.get("_default_title_") or {}).get("value")),
        "ticket_default_description": ((ticket_custom.get("_default_description_") or {}).get("value")),
        "ai_agent_participated": bool(conv.get("ai_agent_participated")),
        "ai_resolution_state": (conv.get("ai_agent") or {}).get("resolution_state"),
        "stats": {
            "time_to_assignment": int_or_none(stats.get("time_to_assignment")),
            "time_to_admin_reply": int_or_none(stats.get("time_to_admin_reply")),
            "time_to_first_close": int_or_none(stats.get("time_to_first_close")),
            "time_to_last_close": int_or_none(stats.get("time_to_last_close")),
            "median_time_to_reply": float_or_none(stats.get("median_time_to_reply")),
            "first_contact_reply_at": int_or_none(stats.get("first_contact_reply_at")),
            "first_assignment_at": int_or_none(stats.get("first_assignment_at")),
            "first_admin_reply_at": int_or_none(stats.get("first_admin_reply_at")),
            "first_close_at": int_or_none(stats.get("first_close_at")),
            "last_contact_reply_at": int_or_none(stats.get("last_contact_reply_at")),
            "last_admin_reply_at": int_or_none(stats.get("last_admin_reply_at")),
            "last_close_at": int_or_none(stats.get("last_close_at")),
            "count_reopens": int_or_none(stats.get("count_reopens")) or 0,
            "count_assignments": int_or_none(stats.get("count_assignments")) or 0,
            "count_conversation_parts": int_or_none(stats.get("count_conversation_parts")) or 0,
            "last_closed_by_id": int_or_none(stats.get("last_closed_by_id")),
        },
    }
    return classify_record(record)


def normalize_part(part: Dict[str, Any]) -> Dict[str, Any]:
    author = part.get("author") or {}
    assigned_to = part.get("assigned_to") or {}
    body = part.get("body")
    return {
        "id": str(part.get("id")),
        "part_type": part.get("part_type"),
        "created_at": int_or_none(part.get("created_at")),
        "updated_at": int_or_none(part.get("updated_at")),
        "author_type": author.get("type"),
        "author_id": int_or_none(author.get("id")),
        "author_name": author.get("name"),
        "body": strip_html(body),
        "assigned_to_type": assigned_to.get("type") if isinstance(assigned_to, dict) else None,
        "assigned_to_id": int_or_none(assigned_to.get("id")) if isinstance(assigned_to, dict) else None,
        "event_details": part.get("event_details") or {},
    }


def normalize_detail(conv: Dict[str, Any]) -> Dict[str, Any]:
    parts_meta = conv.get("conversation_parts") or {}
    parts = parts_meta.get("conversation_parts") or []
    return {
        "id": str(conv.get("id")),
        "conversation_rating": conv.get("conversation_rating"),
        "contacts": [
            {
                "id": str(contact.get("id")),
                "external_id": contact.get("external_id"),
            }
            for contact in ((conv.get("contacts") or {}).get("contacts") or [])
            if contact.get("id")
        ],
        "ai_agent": conv.get("ai_agent"),
        "parts_total_count": int_or_none(parts_meta.get("total_count")) or len(parts),
        "parts_returned": len(parts),
        "parts": [normalize_part(part) for part in parts],
    }


def fetch_json_count(
    session: requests.Session,
    label: str,
    path: str,
    body: Dict[str, Any],
) -> Dict[str, Any]:
    response = api_request(session, "POST", path, json_body=body)
    payload = response.json()
    return {
        "label": label,
        "total_count": int(payload.get("total_count", 0)),
        "path": path,
        "status_code": response.status_code,
    }


def fetch_paginated_search(
    session: requests.Session,
    *,
    label: str,
    query: Dict[str, Any],
    raw_path: Path,
    page_meta_path: Path,
    refresh: bool,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    if raw_path.exists() and page_meta_path.exists() and not refresh:
        eprint(f"loading cached {label} records from {raw_path}")
        records = [json.loads(line) for line in raw_path.read_text().splitlines() if line.strip()]
        page_meta = json.loads(page_meta_path.read_text())
        return records, page_meta

    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    records: List[Dict[str, Any]] = []
    pages_meta: List[Dict[str, Any]] = []
    starting_after: Optional[str] = None
    seen_ids = set()

    while True:
        page_query = copy.deepcopy(query)
        pagination: Dict[str, Any] = {"per_page": 150}
        if starting_after:
            pagination["starting_after"] = starting_after
        page_query["pagination"] = pagination

        response = api_request(session, "POST", "/conversations/search", json_body=page_query)
        payload = response.json()
        conversations = payload.get("conversations", [])
        pages = payload.get("pages") or payload.get("pagination") or {}
        next_page = pages.get("next") or {}
        meta = {
            "page": pages.get("page", len(pages_meta) + 1),
            "per_page_requested": 150,
            "per_page_returned": len(conversations),
            "starting_after_sent": starting_after,
            "next_starting_after": next_page.get("starting_after"),
            "total_pages": pages.get("total_pages"),
            "total_count": int(payload.get("total_count", 0)),
            "rate_limit_remaining": response.headers.get("x-ratelimit-remaining"),
            "rate_limit_reset": response.headers.get("x-ratelimit-reset"),
        }
        pages_meta.append(meta)

        for conv in conversations:
            record = normalize_search_conversation(conv)
            if record["id"] in seen_ids:
                continue
            seen_ids.add(record["id"])
            records.append(record)

        if len(pages_meta) == 1 or len(pages_meta) % 10 == 0 or not next_page:
            eprint(f"{label}: pages={len(pages_meta)} records={len(records)} total={meta['total_count']}")

        starting_after = next_page.get("starting_after")
        if not starting_after:
            break

    records.sort(key=lambda record: (record.get("created_at") or 0, record["id"]))
    with raw_path.open("w") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=True) + "\n")
    page_meta_path.write_text(json.dumps({"label": label, "pages": pages_meta}, indent=2))
    return records, {"label": label, "pages": pages_meta}


def fetch_admins(session: requests.Session, path: Path) -> List[Dict[str, Any]]:
    response = api_request(session, "GET", "/admins")
    admins = response.json().get("admins", [])
    path.write_text(json.dumps(admins, indent=2))
    return admins


def fetch_teams(session: requests.Session, path: Path) -> List[Dict[str, Any]]:
    response = api_request(session, "GET", "/teams")
    teams = response.json().get("teams", [])
    path.write_text(json.dumps(teams, indent=2))
    return teams


def fetch_ticket_types(session: requests.Session, path: Path, warnings: List[str]) -> List[Dict[str, Any]]:
    try:
        response = api_request(session, "GET", "/ticket_types")
        ticket_types = response.json().get("ticket_types", [])
        path.write_text(json.dumps(ticket_types, indent=2))
        return ticket_types
    except Exception as exc:
        warnings.append(f"ticket_types fetch failed: {exc}")
        return []


def fetch_detail_for_id(token: str, conversation_id: str) -> Dict[str, Any]:
    session = thread_session(token)
    response = api_request(
        session,
        "GET",
        f"/conversations/{conversation_id}",
        params={"display_as": "plaintext"},
    )
    return normalize_detail(response.json())


def fetch_conversation_details(
    token: str,
    conversation_ids: List[str],
    *,
    raw_path: Path,
    meta_path: Path,
    refresh: bool,
    workers: int,
) -> Tuple[Dict[str, Dict[str, Any]], Dict[str, Any]]:
    if raw_path.exists() and meta_path.exists() and not refresh:
        eprint(f"loading cached conversation details from {raw_path}")
        records = {}
        for line in raw_path.read_text().splitlines():
            if not line.strip():
                continue
            record = json.loads(line)
            records[record["id"]] = record
        return records, json.loads(meta_path.read_text())

    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    started = time.time()
    detail_map: Dict[str, Dict[str, Any]] = {}

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(fetch_detail_for_id, token, conversation_id): conversation_id for conversation_id in conversation_ids}
        completed = 0
        for future in as_completed(futures):
            conversation_id = futures[future]
            detail = future.result()
            detail_map[conversation_id] = detail
            completed += 1
            if completed == 1 or completed % 200 == 0 or completed == len(conversation_ids):
                elapsed = time.time() - started
                eprint(f"details: completed={completed}/{len(conversation_ids)} elapsed={elapsed:.1f}s")

    ordered = [detail_map[conversation_id] for conversation_id in conversation_ids if conversation_id in detail_map]
    with raw_path.open("w") as handle:
        for detail in ordered:
            handle.write(json.dumps(detail, ensure_ascii=True) + "\n")

    meta = {
        "requested": len(conversation_ids),
        "returned": len(ordered),
        "workers": workers,
        "elapsed_seconds": round(time.time() - started, 2),
    }
    meta_path.write_text(json.dumps(meta, indent=2))
    return detail_map, meta


def count_search_total(
    session: requests.Session,
    *,
    label: str,
    path: str,
    query: Dict[str, Any],
    warnings: List[str],
) -> Optional[int]:
    try:
        payload = fetch_json_count(session, label, path, {"query": query, "pagination": {"per_page": 1}})
        return payload["total_count"]
    except Exception as exc:
        warnings.append(f"{label} failed: {exc}")
        return None


def fetch_monthly_search_counts(
    session: requests.Session,
    *,
    path: str,
    months: List[str],
    warnings: List[str],
) -> Dict[str, Optional[int]]:
    counts: Dict[str, Optional[int]] = {}
    for month in months:
        start = datetime.strptime(month, "%Y-%m").replace(tzinfo=LONDON)
        end_date = add_months(start.date().replace(day=1), 1)
        end = datetime.combine(end_date, datetime.min.time(), tzinfo=LONDON)
        lower_bound_operator = ">="
        lower_bound_value = int(start.astimezone(UTC).timestamp())
        if path == "/contacts/search":
            # Intercom contacts search rejects :gte on date predicates but accepts :gt.
            lower_bound_operator = ">"
            lower_bound_value -= 1
        query = {
            "operator": "AND",
            "value": [
                {"field": "created_at", "operator": lower_bound_operator, "value": lower_bound_value},
                {"field": "created_at", "operator": "<", "value": int(end.astimezone(UTC).timestamp())},
            ],
        }
        counts[month] = count_search_total(
            session,
            label=f"{path}:{month}",
            path=path,
            query=query,
            warnings=warnings,
        )
    return counts


def merge_records(
    recent_records: List[Dict[str, Any]],
    detail_map: Dict[str, Dict[str, Any]],
) -> List[Dict[str, Any]]:
    merged = []
    for record in recent_records:
        detail = detail_map.get(record["id"], {})
        merged_record = copy.deepcopy(record)
        merged_record["detail"] = detail
        merged.append(merged_record)
    return merged


def human_admin_messages(record: Dict[str, Any]) -> List[Dict[str, Any]]:
    parts = (record.get("detail") or {}).get("parts") or []
    return [
        part
        for part in parts
        if part.get("part_type") == "comment" and part.get("author_type") in HUMAN_ADMIN_AUTHOR_TYPES
    ]


def customer_messages(record: Dict[str, Any]) -> List[Dict[str, Any]]:
    messages = []
    source = record["source"]
    if record["created_at"] and source.get("author_type") in CUSTOMER_AUTHOR_TYPES:
        messages.append(
            {
                "kind": "source",
                "created_at": record["created_at"],
                "author_type": source.get("author_type"),
                "author_id": record["contacts"][0]["id"] if record.get("contacts") else None,
                "body": strip_html(source.get("body") or source.get("subject") or record.get("title") or ""),
            }
        )
    for part in (record.get("detail") or {}).get("parts") or []:
        if part.get("part_type") == "comment" and part.get("author_type") in CUSTOMER_AUTHOR_TYPES:
            messages.append(
                {
                    "kind": "part",
                    "created_at": part.get("created_at"),
                    "author_type": part.get("author_type"),
                    "author_id": part.get("author_id"),
                    "body": part.get("body") or "",
                }
            )
    messages.sort(key=lambda item: (item["created_at"] or 0, 0 if item["kind"] == "source" else 1))
    return messages


def bot_messages(record: Dict[str, Any]) -> List[Dict[str, Any]]:
    parts = (record.get("detail") or {}).get("parts") or []
    return [
        part
        for part in parts
        if part.get("part_type") == "comment" and part.get("author_type") in BOT_AUTHOR_TYPES
    ]


def assignment_targets(record: Dict[str, Any]) -> List[Tuple[Optional[str], Optional[int]]]:
    seq: List[Tuple[Optional[str], Optional[int]]] = []
    for part in (record.get("detail") or {}).get("parts") or []:
        if part.get("part_type") not in {"assignment", "default_assignment"}:
            continue
        target = (part.get("assigned_to_type"), part.get("assigned_to_id"))
        if not seq or seq[-1] != target:
            seq.append(target)
    return seq


def analyze_conversation(record: Dict[str, Any], now_ts: int) -> Dict[str, Any]:
    source = record["source"]
    detail = record.get("detail") or {}
    admin_msgs = sorted(human_admin_messages(record), key=lambda part: part.get("created_at") or 0)
    customer_msgs = customer_messages(record)
    bot_msgs = sorted(bot_messages(record), key=lambda part: part.get("created_at") or 0)

    first_customer_at = customer_msgs[0]["created_at"] if customer_msgs else None
    first_human_reply = None
    first_human_reply_admin_id = None
    if first_customer_at is not None:
        for msg in admin_msgs:
            if (msg.get("created_at") or 0) >= first_customer_at:
                first_human_reply = (msg.get("created_at") or 0) - first_customer_at
                first_human_reply_admin_id = msg.get("author_id")
                break
    if first_human_reply is None and record["stats"].get("time_to_admin_reply") is not None:
        first_human_reply = float(record["stats"]["time_to_admin_reply"])
        first_human_reply_admin_id = first_human_reply_admin_id or record.get("admin_assignee_id")

    subsequent_response_times: List[Dict[str, Any]] = []
    initial_seen = False
    awaiting_customer_ts: Optional[int] = None
    message_events = []
    if first_customer_at is not None:
        message_events.append({"created_at": first_customer_at, "role": "customer", "author_id": None})
    for part in (detail.get("parts") or []):
        if part.get("part_type") != "comment":
            continue
        if part.get("author_type") in CUSTOMER_AUTHOR_TYPES:
            message_events.append(
                {
                    "created_at": part.get("created_at"),
                    "role": "customer",
                    "author_id": part.get("author_id"),
                }
            )
        elif part.get("author_type") in HUMAN_ADMIN_AUTHOR_TYPES:
            message_events.append(
                {
                    "created_at": part.get("created_at"),
                    "role": "admin",
                    "author_id": part.get("author_id"),
                }
            )
        elif part.get("author_type") in BOT_AUTHOR_TYPES:
            message_events.append(
                {
                    "created_at": part.get("created_at"),
                    "role": "bot",
                    "author_id": part.get("author_id"),
                }
            )
    message_events.sort(key=lambda item: item.get("created_at") or 0)
    for event in message_events:
        if event["role"] == "customer":
            if not initial_seen:
                initial_seen = True
                continue
            awaiting_customer_ts = event["created_at"]
        elif event["role"] == "admin":
            if awaiting_customer_ts is not None:
                subsequent_response_times.append(
                    {
                        "seconds": (event["created_at"] or 0) - awaiting_customer_ts,
                        "admin_id": event.get("author_id"),
                        "customer_at": awaiting_customer_ts,
                    }
                )
                awaiting_customer_ts = None

    assignment_seq = assignment_targets(record)
    reassigned = len(assignment_seq) > 1 or record["stats"].get("count_assignments", 0) > 1
    reopened = record["stats"].get("count_reopens", 0) > 0

    last_human_reply_at = max((msg.get("created_at") or 0) for msg in admin_msgs) if admin_msgs else None
    customer_after_last_human = False
    if last_human_reply_at is not None:
        customer_after_last_human = any((msg["created_at"] or 0) > last_human_reply_at for msg in customer_msgs)
    silent_customer = bool(
        last_human_reply_at
        and not customer_after_last_human
        and record["open"]
        and (now_ts - last_human_reply_at) > 7 * 86400
    )

    rating = record.get("conversation_rating")
    rating_value = None
    rating_remark = None
    if isinstance(rating, dict):
        rating_value = rating.get("rating") or rating.get("score")
        rating_remark = rating.get("remark")

    ai_participated = bool(record.get("ai_agent_participated"))
    ai_human_handoff = ai_participated and bool(admin_msgs)
    ai_bot_only = ai_participated and not admin_msgs
    ai_resolved_without_human = ai_bot_only and not record["open"]

    return {
        "id": record["id"],
        "first_response_seconds": first_human_reply,
        "first_response_admin_id": first_human_reply_admin_id,
        "subsequent_response_times": subsequent_response_times,
        "handled_admin_ids": sorted({msg.get("author_id") for msg in admin_msgs if msg.get("author_id") is not None}),
        "human_reply_count": len(admin_msgs),
        "customer_message_count": len(customer_msgs),
        "bot_reply_count": len(bot_msgs),
        "reassigned": reassigned,
        "assignment_targets": assignment_seq,
        "reopened": reopened,
        "silent_customer": silent_customer,
        "rating_value": rating_value,
        "rating_remark": rating_remark,
        "ai_human_handoff": ai_human_handoff,
        "ai_bot_only": ai_bot_only,
        "ai_resolved_without_human": ai_resolved_without_human,
        "parts_truncated": (detail.get("parts_total_count") or 0) > (detail.get("parts_returned") or 0),
        "first_customer_at": first_customer_at,
        "last_human_reply_at": last_human_reply_at,
    }


def summarize_turns(turns: List[Dict[str, Any]]) -> Dict[str, Optional[float]]:
    return summarize_percentiles([float(turn["seconds"]) for turn in turns])


def analyze_all(
    recent_records: List[Dict[str, Any]],
    open_records: List[Dict[str, Any]],
    admins: List[Dict[str, Any]],
    teams: List[Dict[str, Any]],
    ticket_types: List[Dict[str, Any]],
    contacts_summary: Dict[str, Any],
    tickets_summary: Dict[str, Any],
    fetch_meta: Dict[str, Any],
    run_now: datetime,
    warnings: List[str],
) -> Dict[str, Any]:
    now_ts = int(run_now.timestamp())
    current_month = month_start(run_now.astimezone(LONDON).date())
    last_six_full_dates = [add_months(current_month, offset) for offset in range(-6, 0)]
    last_six_full = [fmt_month(month_date) for month_date in last_six_full_dates]
    month_set = set(last_six_full)

    admin_map = {int(admin["id"]): admin["name"] for admin in admins}
    team_map = {int(team["id"]): team["name"] for team in teams}

    scoped_records = [record for record in recent_records if record.get("month") in month_set]
    inbound_records = [record for record in scoped_records if record["addressable_inbound"]]

    conversation_analysis: Dict[str, Dict[str, Any]] = {}
    for record in scoped_records:
        conversation_analysis[record["id"]] = analyze_conversation(record, now_ts)

    def first_response_rows(month: Optional[str] = None) -> List[Dict[str, Any]]:
        rows = []
        for record in inbound_records:
            if month is not None and record["month"] != month:
                continue
            analysis = conversation_analysis[record["id"]]
            rows.append(
                {
                    "conversation_id": record["id"],
                    "month": record["month"],
                    "seconds": analysis["first_response_seconds"],
                    "admin_id": analysis["first_response_admin_id"],
                    "created_at": analysis["first_customer_at"] or record["created_at"],
                }
            )
        return rows

    def subsequent_rows(month: Optional[str] = None) -> List[Dict[str, Any]]:
        rows = []
        for record in inbound_records:
            analysis = conversation_analysis[record["id"]]
            for turn in analysis["subsequent_response_times"]:
                turn_month = local_month_from_ts(turn["customer_at"])
                if month is not None and turn_month != month:
                    continue
                rows.append(
                    {
                        "conversation_id": record["id"],
                        "month": turn_month,
                        "seconds": turn["seconds"],
                        "admin_id": turn["admin_id"],
                        "customer_at": turn["customer_at"],
                    }
                )
        return rows

    monthly_volume = {}
    monthly_first_response = {}
    monthly_subsequent_response = {}
    monthly_resolution = {}
    for month in last_six_full:
        month_records = [record for record in scoped_records if record["month"] == month]
        month_inbound = [record for record in inbound_records if record["month"] == month]
        first_rows = [row for row in first_response_rows(month) if row["seconds"] is not None]
        all_first_rows = first_response_rows(month)
        subsequent_month_rows = subsequent_rows(month)
        resolved_values = [
            float(record["stats"]["time_to_last_close"])
            for record in month_inbound
            if record["stats"].get("time_to_last_close") is not None
        ]
        monthly_volume[month] = {
            "total": len(month_records),
            "inbound": len(month_inbound),
            "closed": sum(1 for record in month_records if not record["open"]),
            "open": sum(1 for record in month_records if record["open"]),
        }
        monthly_first_response[month] = {
            "sample": len(month_inbound),
            "replied": len(first_rows),
            "reply_rate": (len(first_rows) / len(month_inbound)) if month_inbound else None,
            **summarize_percentiles([row["seconds"] for row in first_rows]),
        }
        monthly_subsequent_response[month] = {
            "sample": len(subsequent_month_rows),
            **summarize_percentiles([row["seconds"] for row in subsequent_month_rows]),
        }
        monthly_resolution[month] = {
            "sample": len(month_inbound),
            "closed": sum(1 for record in month_inbound if not record["open"]),
            "close_rate": (
                sum(1 for record in month_inbound if not record["open"]) / len(month_inbound)
                if month_inbound
                else None
            ),
            "reopened": sum(1 for record in month_inbound if conversation_analysis[record["id"]]["reopened"]),
            "reopen_rate": (
                sum(1 for record in month_inbound if conversation_analysis[record["id"]]["reopened"]) / len(month_inbound)
                if month_inbound
                else None
            ),
            "silent_customer": sum(
                1 for record in month_inbound if conversation_analysis[record["id"]]["silent_customer"]
            ),
            "silent_customer_rate": (
                sum(1 for record in month_inbound if conversation_analysis[record["id"]]["silent_customer"]) / len(month_inbound)
                if month_inbound
                else None
            ),
            "reassigned": sum(1 for record in month_inbound if conversation_analysis[record["id"]]["reassigned"]),
            "reassigned_rate": (
                sum(1 for record in month_inbound if conversation_analysis[record["id"]]["reassigned"]) / len(month_inbound)
                if month_inbound
                else None
            ),
            "rating_count": sum(
                1 for record in month_inbound if conversation_analysis[record["id"]]["rating_value"] is not None
            ),
            **summarize_percentiles(resolved_values),
        }

    channel_rollup_monthly: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    channel_detail_monthly: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    initiator_monthly: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    weekday_volume = Counter()
    hour_volume = Counter()
    for record in scoped_records:
        channel_rollup_monthly[record["channel_rollup"]][record["month"]] += 1
        channel_detail_monthly[record["channel_detail"]][record["month"]] += 1
        initiator_monthly[record["initiator_type"]][record["month"]] += 1
        if record["created_at"] is not None:
            weekday_volume[weekday_name(record["created_at"])] += 1
            hour_volume[local_hour(record["created_at"])] += 1

    day_of_week_response = {}
    for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
        day_rows = [row for row in first_response_rows() if row["created_at"] is not None and weekday_name(row["created_at"]) == day]
        replied = [row["seconds"] for row in day_rows if row["seconds"] is not None]
        day_of_week_response[day] = {
            "sample": len(day_rows),
            "replied": len(replied),
            "reply_rate": (len(replied) / len(day_rows)) if day_rows else None,
            **summarize_percentiles(replied),
        }

    hour_response = {}
    for hour in range(24):
        hour_rows = [row for row in first_response_rows() if row["created_at"] is not None and local_hour(row["created_at"]) == hour]
        replied = [row["seconds"] for row in hour_rows if row["seconds"] is not None]
        hour_response[hour] = {
            "sample": len(hour_rows),
            "replied": len(replied),
            "reply_rate": (len(replied) / len(hour_rows)) if hour_rows else None,
            **summarize_percentiles(replied),
        }

    first_response_by_admin = {}
    for admin in admins:
        admin_id = int(admin["id"])
        rows = [row for row in first_response_rows() if row["admin_id"] == admin_id and row["seconds"] is not None]
        first_response_by_admin[admin["name"]] = {
            "sample": len(rows),
            **summarize_percentiles([row["seconds"] for row in rows]),
        }

    handled_conversations_by_admin = Counter()
    closed_handled_by_admin = Counter()
    ratings_by_admin = defaultdict(list)
    subsequent_by_admin = defaultdict(list)
    for record in inbound_records:
        analysis = conversation_analysis[record["id"]]
        handled_ids = analysis["handled_admin_ids"]
        for admin_id in handled_ids:
            admin_name = owner_label(admin_id, admin_map)
            handled_conversations_by_admin[admin_name] += 1
            if not record["open"]:
                closed_handled_by_admin[admin_name] += 1
            if analysis["rating_value"] is not None:
                ratings_by_admin[admin_name].append(analysis["rating_value"])
        for turn in analysis["subsequent_response_times"]:
            admin_name = owner_label(turn["admin_id"], admin_map)
            subsequent_by_admin[admin_name].append(float(turn["seconds"]))

    team_performance = {}
    for admin in admins:
        name = admin["name"]
        handled = handled_conversations_by_admin.get(name, 0)
        first_stats = first_response_by_admin.get(name, summarize_percentiles([]))
        subsequent_stats = summarize_percentiles(subsequent_by_admin.get(name, []))
        ratings = ratings_by_admin.get(name, [])
        positive = sum(1 for rating in ratings if str(rating).lower() in {"4", "5", "good", "great", "positive", "satisfied"})
        team_performance[name] = {
            "handled_conversations": handled,
            "first_response_sample": first_stats["count"],
            "first_response_median": first_stats["median"],
            "first_response_p75": first_stats["p75"],
            "first_response_p90": first_stats["p90"],
            "subsequent_response_sample": subsequent_stats["count"],
            "subsequent_response_median": subsequent_stats["median"],
            "resolution_rate": (closed_handled_by_admin.get(name, 0) / handled) if handled else None,
            "rating_count": len(ratings),
            "positive_rating_rate": (positive / len(ratings)) if ratings else None,
        }

    ai_records = [record for record in inbound_records if record.get("ai_agent_participated")]
    ai_state_counts = Counter((record.get("ai_resolution_state") or "unknown") for record in ai_records)
    ai_handoff_theme_counts = Counter()
    for record in ai_records:
        analysis = conversation_analysis[record["id"]]
        if analysis["ai_human_handoff"]:
            for theme in record["themes"] or ["unclassified"]:
                ai_handoff_theme_counts[theme] += 1
    ai_summary = {
        "ai_participated": len(ai_records),
        "ai_only": sum(1 for record in ai_records if conversation_analysis[record["id"]]["ai_bot_only"]),
        "ai_escalated_to_human": sum(1 for record in ai_records if conversation_analysis[record["id"]]["ai_human_handoff"]),
        "ai_resolved_without_human": sum(
            1 for record in ai_records if conversation_analysis[record["id"]]["ai_resolved_without_human"]
        ),
        "ai_resolution_rate": (
            sum(1 for record in ai_records if conversation_analysis[record["id"]]["ai_resolved_without_human"]) / len(ai_records)
            if ai_records
            else None
        ),
        "resolution_states": dict(ai_state_counts),
        "handoff_themes": dict(ai_handoff_theme_counts.most_common(8)),
    }

    risk_term_counts = Counter()
    risk_unreplied_counts = Counter()
    quote_no_followup = []
    flagged_risk_conversations = []
    for record in inbound_records:
        analysis = conversation_analysis[record["id"]]
        for term in record["risk_terms"]:
            risk_term_counts[term] += 1
            if analysis["first_response_seconds"] is None:
                risk_unreplied_counts[term] += 1
        if "pricing_quote" in record["themes"] and analysis["first_response_seconds"] is None:
            quote_no_followup.append(record)
        reasons = []
        age_days = ((now_ts - (record["created_at"] or now_ts)) / 86400) if record.get("created_at") else 0
        high_risk_no_reply = (
            analysis["first_response_seconds"] is None
            and not analysis["ai_resolved_without_human"]
            and (
                record["open"]
                or bool(record["risk_terms"])
                or "pricing_quote" in record["themes"]
            )
        )
        if high_risk_no_reply:
            reasons.append("no_human_reply")
        if analysis["silent_customer"]:
            reasons.append("customer_went_silent")
        if record["open"] and age_days > 7:
            reasons.append("open_over_7d")
        if record["risk_terms"]:
            reasons.extend(sorted(record["risk_terms"]))
        if reasons:
            flagged_risk_conversations.append(
                {
                    "id": record["id"],
                    "created_at": record["created_at"],
                    "month": record["month"],
                    "channel": record["channel_detail"],
                    "state": record["state"],
                    "admin": owner_label(record.get("admin_assignee_id"), admin_map),
                    "title": strip_html(record.get("title") or record.get("ticket_default_title") or "")[:80],
                    "reasons": ",".join(sorted(set(reasons))),
                    "reason_count": len(set(reasons)),
                    "is_open": record["open"],
                }
            )

    open_long_age_buckets = Counter()
    long_open_examples = []
    for record in open_records:
        created_at = record.get("created_at")
        if created_at is None:
            continue
        age_days = (now_ts - created_at) / 86400
        if age_days <= 7:
            continue
        if age_days < 30:
            bucket = "7-29d"
        elif age_days < 90:
            bucket = "30-89d"
        else:
            bucket = "90d+"
        open_long_age_buckets[bucket] += 1
        if len(long_open_examples) < 15:
            long_open_examples.append(
                {
                    "id": record["id"],
                    "created_at": record["created_at"],
                    "age_days": round(age_days, 1),
                    "channel": record["channel_detail"],
                    "state": record["state"],
                    "title": strip_html(record.get("title") or record.get("ticket_default_title") or "")[:80],
                }
            )

    contact_frequency = Counter()
    for record in inbound_records:
        for contact in record.get("contacts") or []:
            contact_frequency[contact["id"]] += 1
    repeat_contacts = {contact_id: count for contact_id, count in contact_frequency.items() if count >= 2}
    repeat_contact_examples = [
        {"contact_id": contact_id, "conversation_count": count}
        for contact_id, count in sorted(repeat_contacts.items(), key=lambda item: (-item[1], item[0]))[:10]
    ]

    lowest_reply_days = sorted(
        day_of_week_response.items(),
        key=lambda item: (
            1 if item[1]["reply_rate"] is None else 0,
            item[1]["reply_rate"] if item[1]["reply_rate"] is not None else 1.0,
            -(item[1]["sample"] or 0),
        ),
    )
    slowest_hours = sorted(
        hour_response.items(),
        key=lambda item: (
            1 if item[1]["median"] is None else 0,
            -(item[1]["sample"] or 0) if item[1]["sample"] < 5 else 0,
            item[1]["median"] if item[1]["median"] is not None else -1,
        ),
        reverse=True,
    )

    part_truncation_count = sum(1 for record in scoped_records if conversation_analysis[record["id"]]["parts_truncated"])
    if part_truncation_count:
        warnings.append(
            f"{part_truncation_count} recent conversations returned fewer parts than the reported part count; deep reply-chain metrics may undercount on those threads."
        )

    first_all = [row["seconds"] for row in first_response_rows() if row["seconds"] is not None]
    recommendations = {
        "first_response_target_median_hours": round((percentile(first_all, 0.50) or 0) / 3600 * 0.65, 1) if first_all else None,
        "first_response_target_p75_hours": round((percentile(first_all, 0.75) or 0) / 3600 * 0.70, 1) if first_all else None,
        "worst_days": [day for day, _stats in lowest_reply_days[:2]],
        "worst_hours": [hour for hour, _stats in slowest_hours[:4] if _stats["sample"] >= 5][:4],
    }

    return {
        "generated_at_utc": run_now.isoformat(),
        "scope": {
            "start_month": last_six_full[0],
            "end_month": last_six_full[-1],
            "months": last_six_full,
            "business_hour_note": BUSINESS_HOUR_NOTE,
        },
        "counts": {
            "scoped_conversations": len(scoped_records),
            "scoped_inbound_conversations": len(inbound_records),
            "current_open_conversations": len(open_records),
        },
        "admins": admins,
        "teams": teams,
        "ticket_types": ticket_types,
        "contacts_summary": contacts_summary,
        "tickets_summary": tickets_summary,
        "fetch_meta": fetch_meta,
        "warnings": warnings,
        "monthly_volume": monthly_volume,
        "channel_rollup_monthly": {
            key: {month: value.get(month, 0) for month in last_six_full}
            for key, value in channel_rollup_monthly.items()
        },
        "channel_detail_monthly": {
            key: {month: value.get(month, 0) for month in last_six_full}
            for key, value in channel_detail_monthly.items()
        },
        "initiator_monthly": {
            key: {month: value.get(month, 0) for month in last_six_full}
            for key, value in initiator_monthly.items()
        },
        "weekday_volume": dict(weekday_volume),
        "hour_volume": {str(hour): hour_volume.get(hour, 0) for hour in range(24)},
        "response": {
            "monthly_first": monthly_first_response,
            "monthly_subsequent": monthly_subsequent_response,
            "day_of_week": day_of_week_response,
            "hour_of_day": {str(hour): stats for hour, stats in hour_response.items()},
            "first_by_admin": first_response_by_admin,
            "subsequent_by_admin": {
                admin_name: summarize_percentiles(values)
                for admin_name, values in subsequent_by_admin.items()
            },
        },
        "resolution": monthly_resolution,
        "team_performance": team_performance,
        "ai_summary": ai_summary,
        "risk_summary": {
            "risk_term_counts": dict(risk_term_counts),
            "risk_unreplied_counts": dict(risk_unreplied_counts),
            "quote_no_followup_count": len(quote_no_followup),
            "flagged_examples": sorted(
                flagged_risk_conversations,
                key=lambda item: (
                    not item["is_open"],
                    -item["reason_count"],
                    -(item["created_at"] or 0),
                ),
            )[:15],
            "long_open_over_7d": sum(open_long_age_buckets.values()),
            "long_open_age_buckets": dict(open_long_age_buckets),
            "long_open_examples": long_open_examples,
            "repeat_contact_count": len(repeat_contacts),
            "repeat_contact_examples": repeat_contact_examples,
        },
        "recommendations": recommendations,
    }


def top_counts(counter_map: Dict[str, int], limit: int) -> List[Tuple[str, int]]:
    return sorted(counter_map.items(), key=lambda item: (-item[1], item[0]))[:limit]


def build_report(analysis: Dict[str, Any], paths: Dict[str, str]) -> str:
    months = analysis["scope"]["months"]
    lines: List[str] = []
    lines.append("# Intercom Full Metrics Deep Dive")
    lines.append("")
    lines.append(
        f"Generated from live read-only Intercom API data on {analysis['generated_at_utc'].replace('+00:00', ' UTC')}."
    )
    lines.append("")
    lines.append("## Scope And Method")
    lines.append("")
    lines.append(
        f"- Reporting window: `{months[0]}` through `{months[-1]}` using London calendar months."
    )
    lines.append(
        f"- Conversation pulls: `{analysis['counts']['scoped_conversations']:,}` conversations in the six-month window and "
        f"`{analysis['counts']['current_open_conversations']:,}` current open conversations for backlog risk checks."
    )
    lines.append(
        f"- Contacts/tickets: contacts counted via `POST /contacts/search`; tickets counted via `POST /tickets/search`."
    )
    lines.append(
        f"- Conversation timing and reassignment metrics are based on `GET /conversations/{{id}}` detail pulls and parts-level analysis."
    )
    lines.append(
        f"- Business-hours note for coverage recommendations: {analysis['scope']['business_hour_note']}"
    )
    if analysis["warnings"]:
        lines.append("- API limitations / issues encountered:")
        for warning in analysis["warnings"]:
            lines.append(f"  - {warning}")
    lines.append("")

    lines.append("## Section 1: Volume Overview")
    lines.append("")
    lines.append("Monthly conversation counts:")
    lines.append("")
    lines.append(table_line(["Month", "All", "Customer-Inbound", "Closed", "Still Open"]))
    lines.append(table_line(["---", "---", "---", "---", "---"]))
    for month in months:
        row = analysis["monthly_volume"][month]
        lines.append(
            table_line(
                [
                    month,
                    f"{row['total']:,}",
                    f"{row['inbound']:,}",
                    f"{row['closed']:,}",
                    f"{row['open']:,}",
                ]
            )
        )
    lines.append("")
    lines.append("Channel rollup by month:")
    lines.append("")
    lines.append(table_line(["Channel"] + months + ["6-Month Total"]))
    lines.append(table_line(["---"] + ["---"] * len(months) + ["---"]))
    for channel, counts in sorted(
        analysis["channel_rollup_monthly"].items(),
        key=lambda item: (-sum(item[1].values()), item[0]),
    ):
        total = sum(counts.values())
        lines.append(table_line([channel] + [str(counts.get(month, 0)) for month in months] + [f"{total:,}"]))
    lines.append("")
    lines.append("Initiator breakdown by month:")
    lines.append("")
    lines.append(table_line(["Initiator"] + months + ["6-Month Total"]))
    lines.append(table_line(["---"] + ["---"] * len(months) + ["---"]))
    for initiator, counts in sorted(
        analysis["initiator_monthly"].items(),
        key=lambda item: (-sum(item[1].values()), item[0]),
    ):
        total = sum(counts.values())
        lines.append(table_line([initiator] + [str(counts.get(month, 0)) for month in months] + [f"{total:,}"]))
    lines.append("")
    lines.append("Customer reach-out pattern by day of week:")
    lines.append("")
    lines.append(table_line(["Day", "Volume"]))
    lines.append(table_line(["---", "---"]))
    for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
        lines.append(table_line([day, f"{analysis['weekday_volume'].get(day, 0):,}"]))
    lines.append("")
    lines.append("Top inbound hours (Europe/London):")
    lines.append("")
    lines.append(table_line(["Hour", "Volume"]))
    lines.append(table_line(["---", "---"]))
    for hour, count in top_counts({int(k): v for k, v in analysis["hour_volume"].items()}, 8):
        lines.append(table_line([f"{hour:02d}:00", f"{count:,}"]))
    lines.append("")
    lines.append("Contacts and tickets created per month:")
    lines.append("")
    lines.append(table_line(["Month", "New Contacts", "New Tickets"]))
    lines.append(table_line(["---", "---", "---"]))
    for month in months:
        lines.append(
            table_line(
                [
                    month,
                    str(analysis["contacts_summary"]["monthly_created"].get(month, "n/a")),
                    str(analysis["tickets_summary"]["monthly_created"].get(month, "n/a")),
                ]
            )
        )
    lines.append("")
    lines.append(
        f"- Total contacts found via search: `{analysis['contacts_summary'].get('total_contacts', 'n/a'):,}`"
        if analysis["contacts_summary"].get("total_contacts") is not None
        else "- Total contacts found via search: `n/a`"
    )
    if analysis["contacts_summary"].get("total_users") is not None and analysis["contacts_summary"].get("total_leads") is not None:
        lines.append(
            f"- Role split: `{analysis['contacts_summary']['total_users']:,}` users and `{analysis['contacts_summary']['total_leads']:,}` leads."
        )
    lines.append(
        f"- Total tickets found via search: `{analysis['tickets_summary'].get('total_tickets', 'n/a'):,}`"
        if analysis["tickets_summary"].get("total_tickets") is not None
        else "- Total tickets found via search: `n/a`"
    )
    if analysis["ticket_types"]:
        names = ", ".join(ticket_type.get("name", "unknown") for ticket_type in analysis["ticket_types"])
        lines.append(f"- Active ticket types observed: `{names}`.")
    lines.append("")

    lines.append("## Section 2: Response Time Analysis")
    lines.append("")
    lines.append("First-response time by month:")
    lines.append("")
    lines.append(table_line(["Month", "Sample", "Replied", "Reply Rate", "Median", "P75", "P90"]))
    lines.append(table_line(["---", "---", "---", "---", "---", "---", "---"]))
    for month in months:
        row = analysis["response"]["monthly_first"][month]
        lines.append(
            table_line(
                [
                    month,
                    f"{row['sample']:,}",
                    f"{row['replied']:,}",
                    fmt_pct(row["reply_rate"]),
                    fmt_hours(row["median"]),
                    fmt_hours(row["p75"]),
                    fmt_hours(row["p90"]),
                ]
            )
        )
    lines.append("")
    lines.append("Subsequent-response time by month:")
    lines.append("")
    lines.append(table_line(["Month", "Turns", "Median", "P75", "P90"]))
    lines.append(table_line(["---", "---", "---", "---", "---"]))
    for month in months:
        row = analysis["response"]["monthly_subsequent"][month]
        lines.append(
            table_line(
                [
                    month,
                    f"{row['sample']:,}",
                    fmt_hours(row["median"]),
                    fmt_hours(row["p75"]),
                    fmt_hours(row["p90"]),
                ]
            )
        )
    lines.append("")
    lines.append("First-response time by admin:")
    lines.append("")
    lines.append(table_line(["Admin", "Sample", "Median", "P75", "P90"]))
    lines.append(table_line(["---", "---", "---", "---", "---"]))
    for admin, row in sorted(
        analysis["response"]["first_by_admin"].items(),
        key=lambda item: (-item[1]["sample"], item[0]),
    ):
        lines.append(
            table_line(
                [
                    admin,
                    f"{row['sample']:,}",
                    fmt_hours(row["median"]),
                    fmt_hours(row["p75"]),
                    fmt_hours(row["p90"]),
                ]
            )
        )
    lines.append("")
    lines.append("First-response by day of week:")
    lines.append("")
    lines.append(table_line(["Day", "Sample", "Reply Rate", "Median", "P75", "P90"]))
    lines.append(table_line(["---", "---", "---", "---", "---", "---"]))
    for day in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]:
        row = analysis["response"]["day_of_week"][day]
        lines.append(
            table_line(
                [
                    day,
                    f"{row['sample']:,}",
                    fmt_pct(row["reply_rate"]),
                    fmt_hours(row["median"]),
                    fmt_hours(row["p75"]),
                    fmt_hours(row["p90"]),
                ]
            )
        )
    lines.append("")
    lines.append("First-response by hour of day (Europe/London):")
    lines.append("")
    lines.append(table_line(["Hour", "Sample", "Reply Rate", "Median", "P75", "P90"]))
    lines.append(table_line(["---", "---", "---", "---", "---", "---"]))
    for hour in range(24):
        row = analysis["response"]["hour_of_day"][str(hour)]
        lines.append(
            table_line(
                [
                    f"{hour:02d}:00",
                    f"{row['sample']:,}",
                    fmt_pct(row["reply_rate"]),
                    fmt_hours(row["median"]),
                    fmt_hours(row["p75"]),
                    fmt_hours(row["p90"]),
                ]
            )
        )
    lines.append("")

    lines.append("## Section 3: Resolution Metrics")
    lines.append("")
    lines.append(table_line(["Month", "Sample", "Close Rate", "Reopen Rate", "Silent Rate", "Reassigned Rate", "Resolve Median", "P75", "P90", "CSAT Count"]))
    lines.append(table_line(["---", "---", "---", "---", "---", "---", "---", "---", "---", "---"]))
    for month in months:
        row = analysis["resolution"][month]
        lines.append(
            table_line(
                [
                    month,
                    f"{row['sample']:,}",
                    fmt_pct(row["close_rate"]),
                    fmt_pct(row["reopen_rate"]),
                    fmt_pct(row["silent_customer_rate"]),
                    fmt_pct(row["reassigned_rate"]),
                    fmt_hours(row["median"]),
                    fmt_hours(row["p75"]),
                    fmt_hours(row["p90"]),
                    f"{row['rating_count']:,}",
                ]
            )
        )
    lines.append("")
    lines.append(
        f"- Current open backlog older than 7 days: `{analysis['risk_summary']['long_open_over_7d']:,}` conversations."
    )
    lines.append(
        f"- Long-open age mix: `7-29d={analysis['risk_summary']['long_open_age_buckets'].get('7-29d', 0):,}`, "
        f"`30-89d={analysis['risk_summary']['long_open_age_buckets'].get('30-89d', 0):,}`, "
        f"`90d+={analysis['risk_summary']['long_open_age_buckets'].get('90d+', 0):,}`."
    )
    lines.append("")

    lines.append("## Section 4: Team Performance")
    lines.append("")
    lines.append(table_line(["Admin", "Handled", "First Resp Median", "P75", "P90", "Subseq Median", "Resolution Rate", "CSAT Count", "Positive CSAT"]))
    lines.append(table_line(["---", "---", "---", "---", "---", "---", "---", "---", "---"]))
    for admin, row in sorted(
        analysis["team_performance"].items(),
        key=lambda item: (-item[1]["handled_conversations"], item[0]),
    ):
        lines.append(
            table_line(
                [
                    admin,
                    f"{row['handled_conversations']:,}",
                    fmt_hours(row["first_response_median"]),
                    fmt_hours(row["first_response_p75"]),
                    fmt_hours(row["first_response_p90"]),
                    fmt_hours(row["subsequent_response_median"]),
                    fmt_pct(row["resolution_rate"]),
                    f"{row['rating_count']:,}",
                    fmt_pct(row["positive_rating_rate"]),
                ]
            )
        )
    lines.append("")

    lines.append("## Section 5: AI/Bot Analysis")
    lines.append("")
    ai = analysis["ai_summary"]
    lines.append(
        f"- AI participated in `{ai['ai_participated']:,}` inbound conversations over the six-month window."
    )
    lines.append(
        f"- Entirely AI/bot-handled: `{ai['ai_only']:,}`; escalated from AI to human: `{ai['ai_escalated_to_human']:,}`."
    )
    lines.append(
        f"- AI resolution rate without human intervention: `{fmt_pct(ai['ai_resolution_rate'])}` "
        f"(`{ai['ai_resolved_without_human']:,}` conversations)."
    )
    lines.append("")
    lines.append("AI resolution-state distribution:")
    lines.append("")
    lines.append(table_line(["Resolution State", "Count"]))
    lines.append(table_line(["---", "---"]))
    for state, count in sorted(ai["resolution_states"].items(), key=lambda item: (-item[1], item[0])):
        lines.append(table_line([state, f"{count:,}"]))
    lines.append("")
    lines.append("Common AI handoff themes:")
    lines.append("")
    lines.append(table_line(["Theme", "Count"]))
    lines.append(table_line(["---", "---"]))
    for theme, count in sorted(ai["handoff_themes"].items(), key=lambda item: (-item[1], item[0])):
        lines.append(table_line([theme, f"{count:,}"]))
    lines.append("")

    lines.append("## Section 6: Revenue Risk Signals")
    lines.append("")
    lines.append("Risk-keyword conversation counts:")
    lines.append("")
    lines.append(table_line(["Risk Signal", "Conversations", "No Human Reply"]))
    lines.append(table_line(["---", "---", "---"]))
    risk_counts = analysis["risk_summary"]["risk_term_counts"]
    unreplied_counts = analysis["risk_summary"]["risk_unreplied_counts"]
    for term, count in sorted(risk_counts.items(), key=lambda item: (-item[1], item[0])):
        lines.append(table_line([term, f"{count:,}", f"{unreplied_counts.get(term, 0):,}"]))
    lines.append("")
    lines.append(
        f"- Pricing/quote conversations with no human follow-up: `{analysis['risk_summary']['quote_no_followup_count']:,}`."
    )
    lines.append(
        f"- Repeat-contact customers in the six-month inbound set: `{analysis['risk_summary']['repeat_contact_count']:,}` contacts had 2+ conversations."
    )
    lines.append("")
    lines.append("Sample flagged conversations:")
    lines.append("")
    lines.append(table_line(["Conversation", "Created", "Channel", "State", "Owner", "Reasons", "Title"]))
    lines.append(table_line(["---", "---", "---", "---", "---", "---", "---"]))
    for item in analysis["risk_summary"]["flagged_examples"][:12]:
        lines.append(
            table_line(
                [
                    item["id"],
                    fmt_ts(item["created_at"]),
                    item["channel"],
                    item["state"] or "n/a",
                    item["admin"],
                    item["reasons"],
                    item["title"] or "n/a",
                ]
            )
        )
    lines.append("")
    lines.append("Long-open backlog examples:")
    lines.append("")
    lines.append(table_line(["Conversation", "Created", "Age (Days)", "Channel", "State", "Title"]))
    lines.append(table_line(["---", "---", "---", "---", "---", "---"]))
    for item in analysis["risk_summary"]["long_open_examples"][:12]:
        lines.append(
            table_line(
                [
                    item["id"],
                    fmt_ts(item["created_at"]),
                    str(item["age_days"]),
                    item["channel"],
                    item["state"] or "n/a",
                    item["title"] or "n/a",
                ]
            )
        )
    lines.append("")

    lines.append("## Section 7: Recommendations")
    lines.append("")
    rec = analysis["recommendations"]
    lines.append(
        f"- First-response target: drive the median below `{rec['first_response_target_median_hours']:.1f}h` and the p75 below `{rec['first_response_target_p75_hours']:.1f}h`."
        if rec["first_response_target_median_hours"] is not None and rec["first_response_target_p75_hours"] is not None
        else "- First-response target: insufficient measured first-response data to set a numeric target."
    )
    lines.append(
        f"- Coverage gaps: weakest reply-rate days are `{', '.join(rec['worst_days'])}`; slowest hours cluster around `{', '.join(f'{hour:02d}:00' for hour in rec['worst_hours'])}` London time."
        if rec["worst_days"] and rec["worst_hours"]
        else "- Coverage gaps: no clear hour/day signal was strong enough to summarize."
    )
    lines.append(
        "- Process improvement: add explicit queue ownership for pricing/quote, refund/complaint, and social conversations because those are the cleanest leakage buckets."
    )
    lines.append(
        "- Process improvement: close the loop on waiting-on-customer conversations with automated 24h/72h nudges to reduce silent-customer drift and stale backlog."
    )
    lines.append(
        "- Process improvement: review repeat-contact customers weekly and tag root causes so recurring issues turn into fixes rather than extra inbound load."
    )
    lines.append(
        "- Help Center: activate it only with focused launch content first. Start with pricing/quote FAQs, booking/reschedule, repair-status expectations, warranty/returns, and payment/invoice answers because those themes already recur in live volume."
    )
    lines.append("")
    lines.append("## Evidence Files")
    lines.append("")
    for label, path in paths.items():
        lines.append(f"- {label}: `{path}`")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true", help="Refresh live Intercom exports.")
    parser.add_argument("--workers", type=int, default=8, help="Thread count for conversation detail fetches.")
    args = parser.parse_args()

    run_now = datetime.now(tz=UTC)
    run_date = run_now.date().isoformat()
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)

    admins_path = EXPORT_DIR / f"admins-live-{run_date}.json"
    teams_path = EXPORT_DIR / f"teams-live-{run_date}.json"
    ticket_types_path = EXPORT_DIR / f"ticket-types-live-{run_date}.json"
    recent_path = EXPORT_DIR / f"conversations-recent-normalized-{run_date}.jsonl"
    recent_pages_path = EXPORT_DIR / f"conversations-recent-pages-{run_date}.json"
    recent_detail_path = EXPORT_DIR / f"conversations-recent-details-{run_date}.jsonl"
    recent_detail_meta_path = EXPORT_DIR / f"conversations-recent-details-meta-{run_date}.json"
    open_path = EXPORT_DIR / f"conversations-open-normalized-{run_date}.jsonl"
    open_pages_path = EXPORT_DIR / f"conversations-open-pages-{run_date}.json"
    summary_path = EXPORT_DIR / f"full-metrics-summary-{run_date}.json"
    contact_ticket_counts_path = EXPORT_DIR / f"contact-ticket-counts-{run_date}.json"

    token = read_intercom_token()
    session = build_session(token)
    warnings: List[str] = []

    current_month = month_start(run_now.astimezone(LONDON).date())
    start_month = add_months(current_month, -6)
    start_ts = int(datetime.combine(start_month, datetime.min.time(), tzinfo=LONDON).astimezone(UTC).timestamp())

    recent_query = {
        "query": {
            "operator": "AND",
            "value": [
                {"field": "created_at", "operator": ">=", "value": start_ts},
            ],
        }
    }
    open_query = {
        "query": {
            "operator": "AND",
            "value": [
                {"field": "state", "operator": "=", "value": "open"},
            ],
        }
    }

    admins = fetch_admins(session, admins_path)
    teams = fetch_teams(session, teams_path)
    ticket_types = fetch_ticket_types(session, ticket_types_path, warnings)
    recent_records, recent_meta = fetch_paginated_search(
        session,
        label="recent",
        query=recent_query,
        raw_path=recent_path,
        page_meta_path=recent_pages_path,
        refresh=args.refresh,
    )
    open_records, open_meta = fetch_paginated_search(
        session,
        label="open",
        query=open_query,
        raw_path=open_path,
        page_meta_path=open_pages_path,
        refresh=args.refresh,
    )
    recent_detail_map, recent_detail_meta = fetch_conversation_details(
        token,
        [record["id"] for record in recent_records],
        raw_path=recent_detail_path,
        meta_path=recent_detail_meta_path,
        refresh=args.refresh,
        workers=args.workers,
    )

    merged_recent_records = merge_records(recent_records, recent_detail_map)
    months = [fmt_month(add_months(current_month, offset)) for offset in range(-6, 0)]

    contacts_summary = {
        "total_contacts": count_search_total(
            session,
            label="contacts_total",
            path="/contacts/search",
            query={"field": "created_at", "operator": ">", "value": 0},
            warnings=warnings,
        ),
        "total_users": count_search_total(
            session,
            label="contacts_users",
            path="/contacts/search",
            query={"field": "role", "operator": "=", "value": "user"},
            warnings=warnings,
        ),
        "total_leads": count_search_total(
            session,
            label="contacts_leads",
            path="/contacts/search",
            query={"field": "role", "operator": "=", "value": "lead"},
            warnings=warnings,
        ),
        "monthly_created": fetch_monthly_search_counts(
            session,
            path="/contacts/search",
            months=months,
            warnings=warnings,
        ),
    }
    tickets_summary = {
        "total_tickets": count_search_total(
            session,
            label="tickets_total",
            path="/tickets/search",
            query={"field": "created_at", "operator": ">=", "value": 0},
            warnings=warnings,
        ),
        "monthly_created": fetch_monthly_search_counts(
            session,
            path="/tickets/search",
            months=months,
            warnings=warnings,
        ),
    }
    contact_ticket_counts_path.write_text(
        json.dumps(
            {
                "contacts_summary": contacts_summary,
                "tickets_summary": tickets_summary,
            },
            indent=2,
        )
    )

    fetch_meta = {
        "recent": recent_meta,
        "open": open_meta,
        "recent_details": recent_detail_meta,
    }
    analysis = analyze_all(
        merged_recent_records,
        open_records,
        admins,
        teams,
        ticket_types,
        contacts_summary,
        tickets_summary,
        fetch_meta,
        run_now,
        warnings,
    )
    summary_path.write_text(json.dumps(analysis, indent=2))

    evidence_paths = {
        "Recent conversation export": str(recent_path),
        "Recent pagination meta": str(recent_pages_path),
        "Recent conversation details": str(recent_detail_path),
        "Recent conversation detail meta": str(recent_detail_meta_path),
        "Current open conversation export": str(open_path),
        "Current open pagination meta": str(open_pages_path),
        "Contact and ticket count summary": str(contact_ticket_counts_path),
        "Full metrics summary JSON": str(summary_path),
        "Admins export": str(admins_path),
        "Teams export": str(teams_path),
        "Ticket types export": str(ticket_types_path),
    }
    REPORT_PATH.write_text(build_report(analysis, evidence_paths))
    eprint(f"wrote report to {REPORT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
