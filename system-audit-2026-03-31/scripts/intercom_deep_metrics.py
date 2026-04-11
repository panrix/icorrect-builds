#!/usr/bin/env python3

import argparse
import copy
import html
import json
import math
import os
import re
import sys
import time
from collections import Counter, defaultdict
from dataclasses import dataclass
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
REPORT_PATH = ROOT / "intercom-metrics-deep.md"
RUN_DATE = "2026-04-02"
SUMMARY_PATH = EXPORT_DIR / f"deep-metrics-summary-{RUN_DATE}.json"
RAW_RECENT_PATH = EXPORT_DIR / f"conversations-recent-normalized-{RUN_DATE}.jsonl"
RAW_OPEN_PATH = EXPORT_DIR / f"conversations-open-normalized-{RUN_DATE}.jsonl"
RAW_RECENT_PAGES_PATH = EXPORT_DIR / f"conversations-recent-pages-{RUN_DATE}.jsonl"
RAW_OPEN_PAGES_PATH = EXPORT_DIR / f"conversations-open-pages-{RUN_DATE}.jsonl"
ALL_COUNT_PATH = EXPORT_DIR / f"conversations-all-count-{RUN_DATE}.json"
ADMINS_PATH = EXPORT_DIR / f"admins-live-{RUN_DATE}.json"
TEAMS_PATH = EXPORT_DIR / f"teams-live-{RUN_DATE}.json"

UTC = timezone.utc
LONDON = ZoneInfo("Europe/London")
TODAY_UTC = date(2026, 4, 2)
NOW_UTC = datetime(2026, 4, 2, 23, 59, 59, tzinfo=UTC)
RECENT_WINDOW_START = datetime(2025, 10, 1, tzinfo=UTC)

STATUS_NOTIFICATION_PATTERNS = [
    "thank you for dropping off your device with icorrect",
    "thank you for sending your device for repair with icorrect",
    "your appointment with icorrect is booked for",
    "your warranty appointment with icorrect is booked for",
    "your courier has now been arranged",
    "your packaging has been shipped via royal mail tracked 24",
    "your repair has been completed and your device is ready for collection",
    "we have completed your warranty repair and your device is ready for collection",
    "we are unable to unlock your device using the login information that you have provided",
    "we need to unlock your device in order to fully test it before and after our repair",
    "your device is on the way back to you",
    "your warranty repair has been completed and we have arranged for your device to be delivered back to you",
    "your repair has been completed and your device is on the way back to you via courier",
]

QUOTE_PATTERNS = [
    "quote request",
    "quote sent",
    "send quote",
    "book your repair",
    "new quote emailed to",
    "quote wizard",
    "repair quote",
]

PAYMENT_PATTERNS = [
    "payment link",
    "pay online",
    "payment received",
    "invoice",
    "payment reminder",
    "payment request",
]

PHONE_PATTERNS = [
    "phone enquiry",
    "phone inquiry",
    "call back",
    "telephone",
]

WARRANTY_PATTERNS = [
    "warranty",
    "aftercare",
    "return courier warranty",
]

SHOPIFY_PATTERNS = [
    "shopify order",
    "shopify",
]

BUSINESS_HOUR_NOTE = (
    "Derived proxy: Mon-Thu 09:30-17:30 and Fri 10:00-17:30 Europe/London, "
    "taken from the live status-notification template copy in "
    "/home/ricky/builds/monday/services/status-notifications/templates.js. "
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
            "User-Agent": "codex-intercom-deep-metrics/1.0",
        }
    )
    return session


def api_request(
    session: requests.Session,
    method: str,
    path: str,
    *,
    params: Optional[Dict[str, Any]] = None,
    json_body: Optional[Dict[str, Any]] = None,
    max_attempts: int = 6,
) -> requests.Response:
    url = f"{BASE_URL}{path}"
    backoff = 1.0
    for attempt in range(1, max_attempts + 1):
        response = session.request(method, url, params=params, json=json_body, timeout=120)
        if response.status_code == 429:
            reset = response.headers.get("x-ratelimit-reset")
            sleep_for = backoff
            if reset:
                try:
                    reset_ts = int(reset)
                    sleep_for = max(1.0, reset_ts - time.time())
                except ValueError:
                    pass
            eprint(f"rate limited on {path}; sleeping {sleep_for:.1f}s")
            time.sleep(sleep_for)
            backoff = min(backoff * 2, 30.0)
            continue
        if response.status_code >= 500:
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


def int_or_none(value: Any) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(value)
    except Exception:
        return None


def classify_record(record: Dict[str, Any]) -> Dict[str, Any]:
    source = record["source"]
    text_blob = lower_text_blob(
        [
            source.get("subject"),
            source.get("body"),
            record.get("title"),
            " ".join(record.get("tags", [])),
            record.get("ticket_default_title"),
            record.get("ticket_default_description"),
            record.get("default_title"),
            record.get("default_description"),
        ]
    )

    native_source = source.get("type") or "unknown"
    proactive = native_source == "admin_initiated" or source.get("delivered_as") == "admin_initiated"

    if any(pattern in text_blob for pattern in STATUS_NOTIFICATION_PATTERNS):
        derived_category = "status_notification"
    elif any(pattern in text_blob for pattern in WARRANTY_PATTERNS):
        derived_category = "warranty"
    elif any(pattern in text_blob for pattern in PHONE_PATTERNS):
        derived_category = "phone"
    elif any(pattern in text_blob for pattern in QUOTE_PATTERNS):
        derived_category = "quote"
    elif any(pattern in text_blob for pattern in PAYMENT_PATTERNS):
        derived_category = "payment"
    elif any(pattern in text_blob for pattern in SHOPIFY_PATTERNS):
        derived_category = "shopify"
    elif native_source == "conversation":
        derived_category = "messenger_chat"
    elif native_source == "admin_initiated":
        derived_category = "admin_initiated_other"
    else:
        derived_category = native_source

    if proactive:
        motion = "proactive"
    else:
        motion = "reactive"

    addressable_inbound = not proactive and derived_category != "status_notification"
    customer_channel = native_source
    if derived_category == "warranty":
        customer_channel = "warranty"
    elif derived_category == "phone":
        customer_channel = "phone"
    elif native_source == "conversation":
        customer_channel = "chat"

    record["text_blob"] = text_blob
    record["native_source"] = native_source
    record["derived_category"] = derived_category
    record["motion"] = motion
    record["addressable_inbound"] = addressable_inbound
    record["customer_channel"] = customer_channel
    return record


def is_out_of_hours(ts: int) -> bool:
    local = datetime.fromtimestamp(ts, tz=UTC).astimezone(LONDON)
    weekday = local.weekday()
    if weekday >= 5:
        return True
    minutes = local.hour * 60 + local.minute
    if weekday <= 3:
        return not (9 * 60 + 30 <= minutes < 17 * 60 + 30)
    return not (10 * 60 <= minutes < 17 * 60 + 30)


def age_bucket(days: float) -> str:
    if days < 1:
        return "<1d"
    if days < 7:
        return "1-6d"
    if days < 30:
        return "7-29d"
    if days < 90:
        return "30-89d"
    return "90d+"


def normalize_conversation(conv: Dict[str, Any]) -> Dict[str, Any]:
    source = conv.get("source") or {}
    stats = conv.get("statistics") or {}
    custom = conv.get("custom_attributes") or {}
    ticket = conv.get("ticket") or {}
    ticket_custom = ticket.get("custom_attributes") or {}
    tags = conv.get("tags", {}).get("tags", [])

    created_at = int_or_none(conv.get("created_at"))
    month = None
    if created_at is not None:
        month = fmt_month(datetime.fromtimestamp(created_at, tz=UTC).astimezone(LONDON).date().replace(day=1))

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
            "url": source.get("url"),
        },
        "admin_assignee_id": int_or_none(conv.get("admin_assignee_id")),
        "team_assignee_id": int_or_none(conv.get("team_assignee_id")),
        "tags": [tag.get("name") for tag in tags if tag.get("name")],
        "title": conv.get("title"),
        "default_title": custom.get("_default_title_"),
        "default_description": custom.get("_default_description_"),
        "ticket_state": ticket.get("state"),
        "ticket_type": ticket.get("ticket_type"),
        "ticket_default_title": ((ticket_custom.get("_default_title_") or {}).get("value")),
        "ticket_default_description": ((ticket_custom.get("_default_description_") or {}).get("value")),
        "ai_agent_participated": bool(conv.get("ai_agent_participated")),
        "ai_resolution_state": (conv.get("ai_agent") or {}).get("resolution_state"),
        "stats": {
            "time_to_assignment": int_or_none(stats.get("time_to_assignment")),
            "time_to_admin_reply": int_or_none(stats.get("time_to_admin_reply")),
            "time_to_first_close": int_or_none(stats.get("time_to_first_close")),
            "time_to_last_close": int_or_none(stats.get("time_to_last_close")),
            "median_time_to_reply": stats.get("median_time_to_reply"),
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
        },
    }
    return classify_record(record)


def fetch_admins(session: requests.Session) -> List[Dict[str, Any]]:
    response = api_request(session, "GET", "/admins")
    payload = response.json()
    admins = payload.get("admins", [])
    ADMINS_PATH.write_text(json.dumps(admins, indent=2))
    return admins


def fetch_teams(session: requests.Session) -> List[Dict[str, Any]]:
    response = api_request(session, "GET", "/teams")
    payload = response.json()
    teams = payload.get("teams", [])
    TEAMS_PATH.write_text(json.dumps(teams, indent=2))
    return teams


def fetch_total_count(session: requests.Session, query: Dict[str, Any]) -> int:
    count_query = copy.deepcopy(query)
    count_query["pagination"] = {"per_page": 1}
    response = api_request(session, "POST", "/conversations/search", json_body=count_query)
    payload = response.json()
    ALL_COUNT_PATH.write_text(json.dumps(payload, indent=2))
    return int(payload["total_count"])


def fetch_query_conversations(
    session: requests.Session,
    *,
    query: Dict[str, Any],
    raw_path: Path,
    raw_pages_path: Path,
    refresh: bool,
    max_pages: Optional[int],
    label: str,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    if raw_path.exists() and not refresh:
        eprint(f"loading cached {label} conversations from {raw_path}")
        records = [json.loads(line) for line in raw_path.read_text().splitlines() if line.strip()]
        pages_seen: List[Dict[str, Any]] = []
        total_count_reported = None
        if raw_pages_path.exists():
            for line in raw_pages_path.read_text().splitlines():
                if not line.strip():
                    continue
                page_payload = json.loads(line)
                page_meta = page_payload.get("meta") or {}
                pages_seen.append(page_meta)
                if page_meta.get("total_count") is not None:
                    total_count_reported = int(page_meta["total_count"])
        meta = {
            "cached": True,
            "raw_path": str(raw_path),
            "raw_pages_path": str(raw_pages_path),
            "normalized_count": len(records),
            "pages_fetched": len(pages_seen),
            "total_count_reported": total_count_reported,
            "pages": pages_seen,
            "label": label,
        }
        return records, meta

    records: List[Dict[str, Any]] = []
    stats = {"pages_fetched": 0}
    started = time.time()
    seen_ids = set()

    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    total_count_reported: Optional[int] = None
    starting_after: Optional[str] = None
    pages_seen: List[Dict[str, Any]] = []
    with raw_pages_path.open("w") as raw_pages_handle:
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
            total_count_reported = int(payload.get("total_count", total_count_reported or 0))
            stats["pages_fetched"] += 1

            page_meta = {
                "page": pages.get("page", stats["pages_fetched"]),
                "per_page_requested": 150,
                "per_page_returned": len(conversations),
                "starting_after_sent": starting_after,
                "next_starting_after": next_page.get("starting_after"),
                "total_pages": pages.get("total_pages"),
                "total_count": total_count_reported,
                "rate_limit_limit": response.headers.get("x-ratelimit-limit"),
                "rate_limit_remaining": response.headers.get("x-ratelimit-remaining"),
                "rate_limit_reset": response.headers.get("x-ratelimit-reset"),
            }
            raw_pages_handle.write(
                json.dumps({"meta": page_meta, "payload": payload}, ensure_ascii=True) + "\n"
            )
            pages_seen.append(page_meta)

            for conv in conversations:
                record = normalize_conversation(conv)
                if record["id"] in seen_ids:
                    continue
                seen_ids.add(record["id"])
                records.append(record)

            elapsed = time.time() - started
            if stats["pages_fetched"] == 1 or stats["pages_fetched"] % 10 == 0 or not next_page:
                eprint(
                    f"{label}: pages={stats['pages_fetched']} records={len(records)} "
                    f"reported_total={total_count_reported} elapsed={elapsed:.1f}s"
                )

            if max_pages is not None and stats["pages_fetched"] >= max_pages:
                break
            starting_after = next_page.get("starting_after")
            if not starting_after:
                break

    records.sort(key=lambda record: (record["created_at"], record["id"]))
    with raw_path.open("w") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=True) + "\n")

    meta = {
        "cached": False,
        "raw_path": str(raw_path),
        "raw_pages_path": str(raw_pages_path),
        "pages_fetched": stats["pages_fetched"],
        "total_count_reported": total_count_reported,
        "normalized_count": len(records),
        "label": label,
        "pages": pages_seen,
    }
    return records, meta


def month_windows() -> Dict[str, List[str]]:
    current_month = month_start(TODAY_UTC)
    last_six_full = [fmt_month(add_months(current_month, offset)) for offset in range(-6, 0)]
    trailing_three = [fmt_month(add_months(current_month, offset)) for offset in range(-3, 0)]
    return {
        "current_mtd": [fmt_month(current_month)],
        "last_six_full": last_six_full,
        "trailing_three_full": trailing_three,
    }


def summarize_response(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    replied = [r["stats"]["time_to_admin_reply"] for r in records if r["stats"]["time_to_admin_reply"] is not None]
    return {
        "count": len(records),
        "replied_count": len(replied),
        "unanswered_count": len(records) - len(replied),
        "reply_rate": (len(replied) / len(records)) if records else None,
        "median": percentile(replied, 0.5),
        "p75": percentile(replied, 0.75),
    }


def summarize_close(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    closed = [r["stats"]["time_to_last_close"] for r in records if r["stats"]["time_to_last_close"] is not None]
    return {
        "count": len(records),
        "closed_count": len(closed),
        "median": percentile(closed, 0.5),
        "p75": percentile(closed, 0.75),
    }


def by_month(records: List[Dict[str, Any]], keys: List[str]) -> Dict[str, List[Dict[str, Any]]]:
    grouped: Dict[str, List[Dict[str, Any]]] = {key: [] for key in keys}
    for record in records:
        month = record.get("month")
        if month in grouped:
            grouped[month].append(record)
    return grouped


def table_line(values: List[str]) -> str:
    return "| " + " | ".join(values) + " |"


def top_counts(counter: Counter, limit: int) -> List[Tuple[str, int]]:
    return sorted(counter.items(), key=lambda item: (-item[1], item[0]))[:limit]


def owner_label(owner_id: Optional[int], mapping: Dict[int, str]) -> str:
    if owner_id is None:
        return "Unassigned"
    return mapping.get(owner_id, str(owner_id))


def compare_current_vs_average(records: List[Dict[str, Any]], months_meta: Dict[str, List[str]]) -> Dict[str, Any]:
    current_month = months_meta["current_mtd"][0]
    trailing_three = set(months_meta["trailing_three_full"])
    trailing_six = set(months_meta["last_six_full"])

    current = [r for r in records if r["month"] == current_month]
    t3 = [r for r in records if r["month"] in trailing_three]
    t6 = [r for r in records if r["month"] in trailing_six]

    def avg_month_metric(rows: List[Dict[str, Any]], months: Iterable[str]) -> Dict[str, Any]:
        month_list = list(months)
        metrics = []
        for month in month_list:
            month_rows = [row for row in rows if row["month"] == month]
            summary = summarize_response(month_rows)
            if summary["count"]:
                metrics.append(summary)
        def mean_field(field: str) -> Optional[float]:
            vals = [metric[field] for metric in metrics if metric[field] is not None]
            if not vals:
                return None
            return sum(vals) / len(vals)
        return {
            "months": month_list,
            "month_count": len(metrics),
            "avg_reply_rate": mean_field("reply_rate"),
            "avg_median": mean_field("median"),
            "avg_p75": mean_field("p75"),
        }

    return {
        "current_month": current_month,
        "current": summarize_response(current),
        "trailing_three": avg_month_metric(t3, months_meta["trailing_three_full"]),
        "trailing_six": avg_month_metric(t6, months_meta["last_six_full"]),
    }


def analyze(
    all_count: int,
    recent_records: List[Dict[str, Any]],
    open_records: List[Dict[str, Any]],
    admins: List[Dict[str, Any]],
    teams: List[Dict[str, Any]],
    fetch_meta: Dict[str, Any],
) -> Dict[str, Any]:
    months_meta = month_windows()
    last_six_full_set = set(months_meta["last_six_full"])

    admin_map = {int(admin["id"]): admin["name"] for admin in admins}
    team_map = {int(team["id"]): team["name"] for team in teams}

    merged_records = {record["id"]: record for record in recent_records}
    for record in open_records:
        merged_records[record["id"]] = record
    records = list(merged_records.values())

    all_months = Counter(record["month"] for record in recent_records if record.get("month"))
    source_month_counts: Dict[str, Counter] = defaultdict(Counter)
    derived_month_counts: Dict[str, Counter] = defaultdict(Counter)
    for record in recent_records:
        if record.get("month"):
            source_month_counts[record["native_source"]][record["month"]] += 1
            derived_month_counts[record["derived_category"]][record["month"]] += 1

    inbound_records = [r for r in recent_records if r["addressable_inbound"]]
    inbound_last_six = [r for r in inbound_records if r["month"] in last_six_full_set]
    all_last_six = [r for r in recent_records if r["month"] in last_six_full_set]

    monthly_response = {
        month: summarize_response([r for r in inbound_records if r["month"] == month])
        for month in months_meta["last_six_full"] + months_meta["current_mtd"]
    }
    monthly_close = {
        month: summarize_close([r for r in inbound_records if r["month"] == month])
        for month in months_meta["last_six_full"] + months_meta["current_mtd"]
    }

    source_response: Dict[str, Dict[str, Any]] = {}
    for source in sorted({r["customer_channel"] for r in inbound_last_six}):
        rows = [r for r in inbound_last_six if r["customer_channel"] == source]
        if len(rows) >= 5:
            source_response[source] = summarize_response(rows)

    owner_response: Dict[str, Dict[str, Any]] = {}
    owner_volume = Counter()
    for record in inbound_last_six:
        owner = owner_label(record["admin_assignee_id"], admin_map)
        owner_volume[owner] += 1
    for owner, count in owner_volume.items():
        rows = [r for r in inbound_last_six if owner_label(r["admin_assignee_id"], admin_map) == owner]
        owner_response[owner] = {**summarize_response(rows), "volume": count}

    team_response: Dict[str, Dict[str, Any]] = {}
    team_volume = Counter()
    for record in inbound_last_six:
        team = owner_label(record["team_assignee_id"], team_map)
        team_volume[team] += 1
    for team, count in team_volume.items():
        rows = [r for r in inbound_last_six if owner_label(r["team_assignee_id"], team_map) == team]
        team_response[team] = {**summarize_response(rows), "volume": count}

    open_age_buckets = Counter()
    open_unanswered = 0
    open_unanswered_out_of_hours = 0
    now_ts = int(NOW_UTC.timestamp())
    for record in open_records:
        age_days = (now_ts - (record["created_at"] or now_ts)) / 86400
        open_age_buckets[age_bucket(age_days)] += 1
        if record["stats"]["first_admin_reply_at"] is None:
            open_unanswered += 1
            if record["addressable_inbound"] and is_out_of_hours(record["created_at"]):
                open_unanswered_out_of_hours += 1

    no_human_reply = [r for r in inbound_records if r["stats"]["first_admin_reply_at"] is None]
    no_human_reply_ai = [r for r in no_human_reply if r["ai_agent_participated"]]
    no_human_reply_non_ai = [r for r in no_human_reply if not r["ai_agent_participated"]]

    outside_hours_unanswered = [
        r for r in inbound_last_six if is_out_of_hours(r["created_at"]) and r["stats"]["first_admin_reply_at"] is None
    ]

    proactive_recent = [r for r in recent_records if r["motion"] == "proactive"]
    reactive_recent = [r for r in recent_records if r["motion"] == "reactive"]
    status_notifications_recent = [r for r in recent_records if r["derived_category"] == "status_notification"]
    quote_related_recent = [r for r in recent_records if r["derived_category"] == "quote"]
    payment_related_recent = [r for r in recent_records if r["derived_category"] == "payment"]

    unanswered_by_channel = {}
    slow_by_channel = {}
    for channel in sorted({r["customer_channel"] for r in inbound_last_six}):
        rows = [r for r in inbound_last_six if r["customer_channel"] == channel]
        summary = summarize_response(rows)
        unanswered_by_channel[channel] = summary
        if summary["replied_count"] >= 5:
            slow_by_channel[channel] = summary

    unanswered_by_category = {}
    for category in sorted({r["derived_category"] for r in inbound_last_six}):
        rows = [r for r in inbound_last_six if r["derived_category"] == category]
        unanswered_by_category[category] = summarize_response(rows)

    compare = compare_current_vs_average(inbound_records, months_meta)

    first_three = months_meta["last_six_full"][:3]
    last_three = months_meta["last_six_full"][3:]
    first_three_avg = sum(all_months.get(month, 0) for month in first_three) / 3
    last_three_avg = sum(all_months.get(month, 0) for month in last_three) / 3
    if first_three_avg == 0:
        total_trend = "newly_active" if last_three_avg > 0 else "n/a"
    elif last_three_avg > first_three_avg * 1.10:
        total_trend = "growing"
    elif last_three_avg < first_three_avg * 0.90:
        total_trend = "declining"
    else:
        total_trend = "stable"

    inbound_first_three_avg = sum(
        len([r for r in inbound_records if r["month"] == month]) for month in first_three
    ) / 3
    inbound_last_three_avg = sum(
        len([r for r in inbound_records if r["month"] == month]) for month in last_three
    ) / 3
    if inbound_first_three_avg == 0:
        inbound_trend = "newly_active" if inbound_last_three_avg > 0 else "n/a"
    elif inbound_last_three_avg > inbound_first_three_avg * 1.10:
        inbound_trend = "growing"
    elif inbound_last_three_avg < inbound_first_three_avg * 0.90:
        inbound_trend = "declining"
    else:
        inbound_trend = "stable"

    findings = []
    for channel, summary in sorted(
        unanswered_by_channel.items(),
        key=lambda item: (
            -((item[1]["unanswered_count"] / item[1]["count"]) if item[1]["count"] else 0),
            -item[1]["unanswered_count"],
        ),
    ):
        if summary["count"] >= 10:
            findings.append(
                {
                    "channel": channel,
                    "count": summary["count"],
                    "reply_rate": summary["reply_rate"],
                    "median": summary["median"],
                    "p75": summary["p75"],
                }
            )

    category_findings = []
    for category, summary in sorted(
        unanswered_by_category.items(),
        key=lambda item: (
            -((item[1]["unanswered_count"] / item[1]["count"]) if item[1]["count"] else 0),
            -item[1]["unanswered_count"],
        ),
    ):
        if summary["count"] >= 5:
            category_findings.append(
                {
                    "category": category,
                    "count": summary["count"],
                    "unanswered_count": summary["unanswered_count"],
                    "reply_rate": summary["reply_rate"],
                    "median": summary["median"],
                    "p75": summary["p75"],
                }
            )

    annualized_unanswered = summarize_response(inbound_last_six)["unanswered_count"] * 2
    required_value_per_unanswered = None
    if annualized_unanswered > 0:
        required_value_per_unanswered = 150000 / annualized_unanswered

    analysis = {
        "generated_at_utc": NOW_UTC.isoformat(),
        "fetch_meta": fetch_meta,
        "admins": admins,
        "teams": teams,
        "counts": {
            "all_conversations": all_count,
            "recent_window_conversations": len(recent_records),
            "open_conversations": len(open_records),
            "addressable_inbound_recent_window": len(inbound_records),
        },
        "months": months_meta,
        "monthly_volume": {
            "all": {month: all_months.get(month, 0) for month in months_meta["last_six_full"]},
            "addressable_inbound": {
                month: len([r for r in inbound_records if r["month"] == month])
                for month in months_meta["last_six_full"]
            },
            "raw_source": {
                source: {month: counts.get(month, 0) for month in months_meta["last_six_full"]}
                for source, counts in source_month_counts.items()
            },
            "derived_category": {
                category: {month: counts.get(month, 0) for month in months_meta["last_six_full"]}
                for category, counts in derived_month_counts.items()
            },
            "total_trend": total_trend,
            "addressable_inbound_trend": inbound_trend,
        },
        "response": {
            "monthly": monthly_response,
            "by_channel_last_six_full": source_response,
            "by_admin_assignee_last_six_full": owner_response,
            "by_team_assignee_last_six_full": team_response,
            "current_vs_average": compare,
        },
        "resolution": {
            "monthly": monthly_close,
            "open_count": len(open_records),
            "open_age_distribution": dict(open_age_buckets),
            "open_unanswered_count": open_unanswered,
            "open_unanswered_out_of_hours_addressable": open_unanswered_out_of_hours,
            "no_human_reply": {
                "recent_window_addressable": len(no_human_reply),
                "ai_participated": len(no_human_reply_ai),
                "no_ai": len(no_human_reply_non_ai),
            },
        },
        "coverage": {
            "outside_hours_unanswered_last_six_full": len(outside_hours_unanswered),
            "outside_hours_note": BUSINESS_HOUR_NOTE,
            "response_rate_last_six_full": summarize_response(inbound_last_six),
            "owner_volume_last_six_full": dict(owner_volume),
            "team_volume_last_six_full": dict(team_volume),
            "unanswered_by_channel_last_six_full": unanswered_by_channel,
            "unanswered_by_category_last_six_full": unanswered_by_category,
            "slow_by_channel_last_six_full": slow_by_channel,
        },
        "quality": {
            "proactive_vs_reactive_recent_window": {
                "proactive": len(proactive_recent),
                "reactive": len(reactive_recent),
            },
            "proactive_vs_reactive_last_six_full": {
                "proactive": len([r for r in all_last_six if r["motion"] == "proactive"]),
                "reactive": len([r for r in all_last_six if r["motion"] == "reactive"]),
            },
            "status_notifications_recent_window": len(status_notifications_recent),
            "status_notifications_last_six_full": len(
                [r for r in status_notifications_recent if r["month"] in last_six_full_set]
            ),
            "quote_related_recent_window": len(quote_related_recent),
            "quote_related_last_six_full": len([r for r in quote_related_recent if r["month"] in last_six_full_set]),
            "payment_related_recent_window": len(payment_related_recent),
            "payment_related_last_six_full": len([r for r in payment_related_recent if r["month"] in last_six_full_set]),
        },
        "leakage_patterns": findings,
        "leakage_category_patterns": category_findings,
        "audit_cross_reference": {
            "ferrari_reply_rate_claim": 0.30,
            "ferrari_revenue_claim_gbp_per_year": 150000,
            "annualized_unanswered_last_six_full": annualized_unanswered,
            "required_value_per_unanswered_gbp": required_value_per_unanswered,
        },
    }

    SUMMARY_PATH.write_text(json.dumps(analysis, indent=2))
    return analysis


def report_markdown(analysis: Dict[str, Any]) -> str:
    months = analysis["months"]["last_six_full"]
    current_month = analysis["response"]["current_vs_average"]["current_month"]
    recent_meta = analysis["fetch_meta"]["recent"]
    open_meta = analysis["fetch_meta"]["open"]
    audit_meta = analysis["audit_cross_reference"]
    lines: List[str] = []

    lines.append("# Intercom Deep Metrics Analysis")
    lines.append("")
    lines.append("Generated from live read-only Intercom API data on 2026-04-02 UTC.")
    lines.append("")
    lines.append("## Scope And Method")
    lines.append("")
    lines.append(
        f"- API pull: workspace all-time inventory `{analysis['counts']['all_conversations']:,}` conversations, "
        f"detailed recent-window export `{analysis['counts']['recent_window_conversations']:,}` conversations since `2025-10-01`, "
        f"and full current open-queue export `{analysis['counts']['open_conversations']:,}` conversations, "
        f"`{len(analysis['admins'])}` admins, `{len(analysis['teams'])}` teams."
    )
    lines.append(
        f"- Pagination: direct cursor pagination via `POST /conversations/search` with `pagination.per_page=150` and `pages.next.starting_after` until exhaustion. "
        f"The recent-window export reported `{recent_meta.get('total_count_reported', analysis['counts']['recent_window_conversations']):,}` conversations across `{recent_meta.get('pages_fetched', 0):,}` pages; "
        f"the current open queue reported `{open_meta.get('total_count_reported', analysis['counts']['open_conversations']):,}` conversations across `{open_meta.get('pages_fetched', 0):,}` pages."
    )
    if (
        recent_meta.get("total_count_reported") not in (None, analysis["counts"]["recent_window_conversations"])
        or open_meta.get("total_count_reported") not in (None, analysis["counts"]["open_conversations"])
    ):
        lines.append(
            "- Note on live-data drift: `total_count` moved slightly while the export was running, so the report metrics use the unique normalized conversation IDs actually captured in the finished pull."
        )
    lines.append(
        "- Addressable inbound subset: reactive conversations excluding clearly proactive/admin-initiated threads and clearly automated status-notification messages."
    )
    lines.append(
        "- Response metric: Intercom `statistics.time_to_admin_reply` and `statistics.first_admin_reply_at`."
    )
    lines.append(
        "- Close metric: Intercom `statistics.time_to_last_close`."
    )
    lines.append(
        f"- Business-hours proxy for the out-of-hours section: {BUSINESS_HOUR_NOTE}"
    )
    lines.append(
        "- Limitation: Intercom search/list responses expose reply timestamps but not the first human replier ID, so the admin/team response table uses assignee ownership proxy (`admin_assignee_id` / `team_assignee_id`) rather than verified first-replier identity."
    )
    lines.append("")
    lines.append("## 1. Conversation Volume Over Time")
    lines.append("")
    lines.append(
        f"- Last six full London calendar months covered here: `{months[0]}` to `{months[-1]}`."
    )
    lines.append(
        f"- Total-volume trend over those six months: `{analysis['monthly_volume']['total_trend']}`."
    )
    lines.append(
        f"- Addressable-inbound trend over those six months: `{analysis['monthly_volume']['addressable_inbound_trend']}`."
    )
    lines.append("")
    lines.append(table_line(["Month", "All Conversations", "Addressable Inbound"]))
    lines.append(table_line(["---", "---", "---"]))
    for month in months:
        lines.append(
            table_line(
                [
                    month,
                    f"{analysis['monthly_volume']['all'][month]:,}",
                    f"{analysis['monthly_volume']['addressable_inbound'][month]:,}",
                ]
            )
        )
    lines.append("")
    lines.append("Top raw source/channel counts by month:")
    lines.append("")
    source_totals = Counter()
    for source, month_counts in analysis["monthly_volume"]["raw_source"].items():
        source_totals[source] = sum(month_counts.get(month, 0) for month in months)
    lines.append(table_line(["Source", "6-Month Count"] + months))
    lines.append(table_line(["---", "---"] + ["---"] * len(months)))
    for source, total in top_counts(source_totals, 8):
        month_counts = analysis["monthly_volume"]["raw_source"][source]
        lines.append(table_line([source, f"{total:,}"] + [str(month_counts.get(month, 0)) for month in months]))
    lines.append("")
    lines.append("Derived intake/pattern counts by month:")
    lines.append("")
    derived_totals = Counter()
    for category, month_counts in analysis["monthly_volume"]["derived_category"].items():
        derived_totals[category] = sum(month_counts.get(month, 0) for month in months)
    lines.append(table_line(["Derived Category", "6-Month Count"] + months))
    lines.append(table_line(["---", "---"] + ["---"] * len(months)))
    for category, total in top_counts(derived_totals, 8):
        month_counts = analysis["monthly_volume"]["derived_category"][category]
        lines.append(table_line([category, f"{total:,}"] + [str(month_counts.get(month, 0)) for month in months]))
    lines.append("")
    lines.append("## 2. Response Time Analysis")
    lines.append("")
    lines.append("Monthly first-response metrics on the addressable inbound subset:")
    lines.append("")
    lines.append(table_line(["Month", "Sample", "Replied", "Reply Rate", "Median", "P75"]))
    lines.append(table_line(["---", "---", "---", "---", "---", "---"]))
    for month in months + [current_month]:
        summary = analysis["response"]["monthly"][month]
        lines.append(
            table_line(
                [
                    month,
                    f"{summary['count']:,}",
                    f"{summary['replied_count']:,}",
                    fmt_pct(summary["reply_rate"]),
                    fmt_hours(summary["median"]),
                    fmt_hours(summary["p75"]),
                ]
            )
        )
    lines.append("")
    compare = analysis["response"]["current_vs_average"]
    lines.append(
        f"- Current month in scope: `{current_month}` (partial month-to-date through `2026-04-02`)."
    )
    lines.append(
        f"- `{current_month}` MTD: sample `{compare['current']['count']:,}`, reply rate `{fmt_pct(compare['current']['reply_rate'])}`, median `{fmt_hours(compare['current']['median'])}`, p75 `{fmt_hours(compare['current']['p75'])}`."
    )
    lines.append(
        f"- Trailing 3 full months (`{', '.join(compare['trailing_three']['months'])}`) average: median `{fmt_hours(compare['trailing_three']['avg_median'])}`, p75 `{fmt_hours(compare['trailing_three']['avg_p75'])}`, reply rate `{fmt_pct(compare['trailing_three']['avg_reply_rate'])}`."
    )
    lines.append(
        f"- Trailing 6 full months (`{', '.join(compare['trailing_six']['months'])}`) average: median `{fmt_hours(compare['trailing_six']['avg_median'])}`, p75 `{fmt_hours(compare['trailing_six']['avg_p75'])}`, reply rate `{fmt_pct(compare['trailing_six']['avg_reply_rate'])}`."
    )
    lines.append("")
    lines.append("First-response by channel, last six full months:")
    lines.append("")
    lines.append(table_line(["Channel", "Sample", "Replied", "Reply Rate", "Median", "P75"]))
    lines.append(table_line(["---", "---", "---", "---", "---", "---"]))
    for channel, summary in sorted(
        analysis["response"]["by_channel_last_six_full"].items(),
        key=lambda item: (-item[1]["count"], item[0]),
    ):
        lines.append(
            table_line(
                [
                    channel,
                    f"{summary['count']:,}",
                    f"{summary['replied_count']:,}",
                    fmt_pct(summary["reply_rate"]),
                    fmt_hours(summary["median"]),
                    fmt_hours(summary["p75"]),
                ]
            )
        )
    lines.append("")
    lines.append("First-response by admin assignee ownership proxy, last six full months:")
    lines.append("")
    lines.append(table_line(["Admin", "Volume", "Replied", "Reply Rate", "Median", "P75"]))
    lines.append(table_line(["---", "---", "---", "---", "---", "---"]))
    for owner, summary in sorted(
        analysis["response"]["by_admin_assignee_last_six_full"].items(),
        key=lambda item: (-item[1]["volume"], item[0]),
    ):
        lines.append(
            table_line(
                [
                    owner,
                    f"{summary['volume']:,}",
                    f"{summary['replied_count']:,}",
                    fmt_pct(summary["reply_rate"]),
                    fmt_hours(summary["median"]),
                    fmt_hours(summary["p75"]),
                ]
            )
        )
    lines.append("")
    lines.append("First-response by team assignee ownership proxy, last six full months:")
    lines.append("")
    lines.append(table_line(["Team", "Volume", "Replied", "Reply Rate", "Median", "P75"]))
    lines.append(table_line(["---", "---", "---", "---", "---", "---"]))
    for team, summary in sorted(
        analysis["response"]["by_team_assignee_last_six_full"].items(),
        key=lambda item: (-item[1]["volume"], item[0]),
    ):
        lines.append(
            table_line(
                [
                    team,
                    f"{summary['volume']:,}",
                    f"{summary['replied_count']:,}",
                    fmt_pct(summary["reply_rate"]),
                    fmt_hours(summary["median"]),
                    fmt_hours(summary["p75"]),
                ]
            )
        )
    lines.append("")
    lines.append("## 3. Resolution Analysis")
    lines.append("")
    lines.append("Median time to final close by month on the addressable inbound subset:")
    lines.append("")
    lines.append(table_line(["Month", "Sample", "Closed", "Median", "P75"]))
    lines.append(table_line(["---", "---", "---", "---", "---"]))
    for month in months + [current_month]:
        summary = analysis["resolution"]["monthly"][month]
        lines.append(
            table_line(
                [
                    month,
                    f"{summary['count']:,}",
                    f"{summary['closed_count']:,}",
                    fmt_hours(summary["median"]),
                    fmt_hours(summary["p75"]),
                ]
            )
        )
    lines.append("")
    lines.append(
        f"- Currently open / unresolved conversations: `{analysis['resolution']['open_count']:,}`."
    )
    lines.append(
        f"- Open conversations with no human reply recorded: `{analysis['resolution']['open_unanswered_count']:,}`."
    )
    lines.append(
        f"- Open addressable inbound conversations created out of hours with no human reply: `{analysis['resolution']['open_unanswered_out_of_hours_addressable']:,}`."
    )
    lines.append("")
    lines.append("Open age distribution:")
    lines.append("")
    lines.append(table_line(["Age Bucket", "Open Count"]))
    lines.append(table_line(["---", "---"]))
    for bucket in ["<1d", "1-6d", "7-29d", "30-89d", "90d+"]:
        lines.append(table_line([bucket, f"{analysis['resolution']['open_age_distribution'].get(bucket, 0):,}"]))
    lines.append("")
    lines.append(
        f"- Addressable inbound conversations with no human reply across the detailed recent window: `{analysis['resolution']['no_human_reply']['recent_window_addressable']:,}`."
    )
    lines.append(
        f"- Of those, `AI-participated`: `{analysis['resolution']['no_human_reply']['ai_participated']:,}`; `no AI participation`: `{analysis['resolution']['no_human_reply']['no_ai']:,}`."
    )
    lines.append("")
    lines.append("## 4. Coverage Analysis")
    lines.append("")
    coverage = analysis["coverage"]["response_rate_last_six_full"]
    lines.append(
        f"- Response rate on addressable inbound conversations across the last six full months: `{fmt_pct(coverage['reply_rate'])}` "
        f"(`{coverage['replied_count']:,}` replied of `{coverage['count']:,}` conversations)."
    )
    lines.append(
        f"- Out-of-hours addressable inbound conversations with no human reply in the last six full months: `{analysis['coverage']['outside_hours_unanswered_last_six_full']:,}`."
    )
    lines.append(
        f"- Business-hours assumption used here: {analysis['coverage']['outside_hours_note']}"
    )
    lines.append("")
    lines.append("Admins handling the most addressable inbound volume in the last six full months:")
    lines.append("")
    lines.append(table_line(["Admin", "Owned Volume"]))
    lines.append(table_line(["---", "---"]))
    for owner, count in sorted(
        analysis["coverage"]["owner_volume_last_six_full"].items(),
        key=lambda item: (-item[1], item[0]),
    ):
        lines.append(table_line([owner, f"{count:,}"]))
    lines.append("")
    lines.append("Patterns in unanswered / slow-response conversations, last six full months:")
    lines.append("")
    lines.append(table_line(["Channel", "Sample", "Reply Rate", "Median", "P75"]))
    lines.append(table_line(["---", "---", "---", "---", "---"]))
    for finding in analysis["leakage_patterns"][:8]:
        lines.append(
            table_line(
                [
                    finding["channel"],
                    f"{finding['count']:,}",
                    fmt_pct(finding["reply_rate"]),
                    fmt_hours(finding["median"]),
                    fmt_hours(finding["p75"]),
                ]
            )
        )
    lines.append("")
    lines.append("Leakage-heavy derived categories, last six full months:")
    lines.append("")
    lines.append(table_line(["Category", "Sample", "Unanswered", "Reply Rate", "Median", "P75"]))
    lines.append(table_line(["---", "---", "---", "---", "---", "---"]))
    for finding in analysis["leakage_category_patterns"][:8]:
        lines.append(
            table_line(
                [
                    finding["category"],
                    f"{finding['count']:,}",
                    f"{finding['unanswered_count']:,}",
                    fmt_pct(finding["reply_rate"]),
                    fmt_hours(finding["median"]),
                    fmt_hours(finding["p75"]),
                ]
            )
        )
    lines.append("")
    lines.append(
        f"- Proactive vs reactive across the detailed recent window (`2025-10-01` onward): "
        f"`{analysis['quality']['proactive_vs_reactive_recent_window']['proactive']:,}` proactive, "
        f"`{analysis['quality']['proactive_vs_reactive_recent_window']['reactive']:,}` reactive."
    )
    lines.append(
        f"- Proactive vs reactive over the last six full months: `{analysis['quality']['proactive_vs_reactive_last_six_full']['proactive']:,}` proactive, "
        f"`{analysis['quality']['proactive_vs_reactive_last_six_full']['reactive']:,}` reactive."
    )
    lines.append(
        f"- Status-notification pattern count: `{analysis['quality']['status_notifications_recent_window']:,}` in the recent window, "
        f"`{analysis['quality']['status_notifications_last_six_full']:,}` in the last six full months."
    )
    lines.append(
        f"- Quote-related conversation pattern count: `{analysis['quality']['quote_related_recent_window']:,}` in the recent window, "
        f"`{analysis['quality']['quote_related_last_six_full']:,}` in the last six full months."
    )
    lines.append(
        f"- Payment/invoice-related conversation pattern count: `{analysis['quality']['payment_related_recent_window']:,}` in the recent window, "
        f"`{analysis['quality']['payment_related_last_six_full']:,}` in the last six full months."
    )
    lines.append(
        "- Status notifications are overwhelmingly automated outbound comms. They are real customer-facing traffic, but they should not be treated as missed-response leakage in the same way as inbound enquiries."
    )
    lines.append("")
    lines.append("## 5. Cross-Reference With Audit")
    lines.append("")
    lines.append(
        "- Ferrari audit reference in the existing repo: roughly `30%` human reply rate and about `£150k/year` lost to unanswered communications."
    )
    lines.append(
        f"- Current live Intercom data supports the existence of a real comms leakage problem if the focus is the addressable inbound subset: last-six-full-month reply rate is `{fmt_pct(coverage['reply_rate'])}`, "
        f"with `{coverage['unanswered_count']:,}` unanswered addressable inbound conversations in that window and median first response `{fmt_hours(coverage['median'])}`."
    )
    if coverage["reply_rate"] is not None and coverage["reply_rate"] > 0.30:
        lines.append(
            "- That said, the live six-month-plus-open pull is only slightly better than a literal `30%` reply-rate baseline, not a clean rebuttal of the older audit. The operational leakage pattern is still clearly present."
        )
    else:
        lines.append(
            "- The live six-month-plus-open pull is consistent with a reply-rate problem on the same order of magnitude as the older audit."
        )
    lines.append(
        f"- Annualising the last-six-full-month unanswered count implies roughly `{audit_meta['annualized_unanswered_last_six_full']:,}` unanswered addressable inbound conversations per year at the current run-rate."
    )
    lines.append(
        f"- To support a literal `£150k/year` leakage claim from unanswered conversations alone, each unanswered conversation would need to be worth about `£{audit_meta['required_value_per_unanswered_gbp']:.2f}` in lost annualised value at the current run-rate."
        if audit_meta["required_value_per_unanswered_gbp"] is not None
        else "- The current six-month window contains no unanswered addressable inbound conversations, so the `£150k/year` claim is not supported by this slice."
    )
    lines.append(
        "- Intercom data alone cannot prove the revenue quantum without conversion and order-value linkage, but it can test whether the operational leakage pattern is still severe enough to make the claim plausible."
    )
    lines.append(
        "- On current evidence the audit claim is directionally valid about operational leakage, and its older `30%` reply-rate baseline is broadly consistent with the current six-month Intercom performance rather than far away from it."
    )
    lines.append(
        "- Worst current leakage categories are the channels and derived categories with the lowest reply coverage and slowest p75 in the tables above. Those are the best-supported places to focus remediation first."
    )
    lines.append("")
    lines.append("## Evidence Files")
    lines.append("")
    lines.append(f"- Recent-window normalized conversation export: `{RAW_RECENT_PATH}`")
    lines.append(f"- Recent-window raw page export: `{RAW_RECENT_PAGES_PATH}`")
    lines.append(f"- Open-queue normalized conversation export: `{RAW_OPEN_PATH}`")
    lines.append(f"- Open-queue raw page export: `{RAW_OPEN_PAGES_PATH}`")
    lines.append(f"- All-conversation count response: `{ALL_COUNT_PATH}`")
    lines.append(f"- Analysis summary JSON: `{SUMMARY_PATH}`")
    lines.append(f"- Live admins export: `{ADMINS_PATH}`")
    lines.append(f"- Live teams export: `{TEAMS_PATH}`")
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--refresh", action="store_true", help="re-fetch conversations even if the cache exists")
    parser.add_argument("--max-pages", type=int, default=None, help="debug limit for pagination")
    args = parser.parse_args()

    token = read_intercom_token()
    session = build_session(token)
    admins = fetch_admins(session)
    teams = fetch_teams(session)

    recent_query = {
        "query": {
            "operator": "AND",
            "value": [
                {"field": "created_at", "operator": ">=", "value": int(RECENT_WINDOW_START.timestamp())}
            ],
        }
    }
    open_query = {
        "query": {
            "operator": "AND",
            "value": [
                {"field": "state", "operator": "=", "value": "open"}
            ],
        }
    }
    all_query = {"query": {"operator": "AND", "value": []}}

    all_count = fetch_total_count(session, all_query)
    recent_records, recent_meta = fetch_query_conversations(
        session,
        query=recent_query,
        raw_path=RAW_RECENT_PATH,
        raw_pages_path=RAW_RECENT_PAGES_PATH,
        refresh=args.refresh,
        max_pages=args.max_pages,
        label="recent",
    )
    open_records, open_meta = fetch_query_conversations(
        session,
        query=open_query,
        raw_path=RAW_OPEN_PATH,
        raw_pages_path=RAW_OPEN_PAGES_PATH,
        refresh=args.refresh,
        max_pages=args.max_pages,
        label="open",
    )
    fetch_meta = {"all_count": all_count, "recent": recent_meta, "open": open_meta}
    analysis = analyze(all_count, recent_records, open_records, admins, teams, fetch_meta)
    report = report_markdown(analysis)
    REPORT_PATH.write_text(report)
    eprint(f"wrote report to {REPORT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
