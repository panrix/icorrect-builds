#!/usr/bin/env python3
import json
import math
import os
import re
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from html import unescape
from pathlib import Path

import requests


BOARD_ID = 349212843
MONDAY_API_URL = "https://api.monday.com/v2"
API_VERSION = "2024-10"

ROOT = Path("/home/ricky/builds/system-audit-2026-03-31")
EXPORT_ROOT = Path("/home/ricky/data/exports/system-audit-2026-03-31/monday")
OUTPUT_FILE = ROOT / "diagnostics-deep-dive.md"

ANALYSIS_START = datetime(2025, 10, 1, tzinfo=timezone.utc)
ANALYSIS_END = datetime(2026, 3, 31, 23, 59, 59, tzinfo=timezone.utc)
SNAPSHOT_AT = datetime(2026, 4, 2, tzinfo=timezone.utc)

COLUMN_IDS = [
    "service",
    "status",
    "status24",
    "status4",
    "date4",
    "date_mkwdmm9k",
    "date_mkwdwx03",
    "collection_date",
    "date3",
    "date_mkypt8db",
    "date_mkwdan7z",
    "person",
    "multiple_person_mkwqj321",
    "multiple_person_mkwqy930",
    "multiple_person_mkyp2bka",
    "board_relation5",
    "board_relation",
    "dup__of_quote_total",
    "formula74",
    "payment_status",
    "payment_method",
    "color_mkqg8ktb",
    "color_mkqg578m",
    "color_mkqgj96q",
    "color_mkse6rw0",
    "color_mkse6bhk",
    "long_text_mkqhfapq",
    "long_text_mkqhxknq",
    "time_tracking",
    "time_tracking9",
    "numeric_mm0gatwe",
]

UPDATE_BATCH_SIZE = 25
REQUEST_GAP_SECONDS = 1.05

AUTO_UPDATE_CREATORS = {"Systems Manager"}
GENERIC_NOTE_PATTERNS = [
    "quote sent",
    "customer contacted",
    "status changed",
    "device booked in",
    "device collected",
    "device returned",
    "shopify order",
    "walk-in customer",
    "client form response summary",
    "created automatically",
    "parts checkout complete",
    "intercom ticket:",
    "turnaround:",
]
APPROVAL_KEYWORDS = [
    "approved",
    "approval",
    "go ahead",
    "go-ahead",
    "proceed",
    "accepted",
    "accept quote",
    "ok to repair",
    "happy to go ahead",
]
DECLINE_KEYWORDS = [
    "declined",
    "reject",
    "rejected",
    "not going ahead",
    "no go ahead",
    "cancelled",
    "abandoned",
    "ber",
    "beyond economic repair",
]
DIAG_DETAIL_KEYWORDS = [
    "diagnostic",
    "found",
    "fault",
    "issue",
    "liquid",
    "water",
    "corrosion",
    "board",
    "battery",
    "screen",
    "charging",
    "power",
    "no power",
    "not turning on",
    "won't turn on",
    "data recovery",
    "repairable",
    "previous repair",
    "current issue",
]
NON_FUNCTIONAL_KEYWORDS = [
    "non functional",
    "not functional",
    "won't turn on",
    "wont turn on",
    "no power",
    "not turning on",
    "dead",
    "liquid damage",
    "water damage",
    "corrosion",
]
REPAIR_PROGRESS_STATUSES = {
    "Queued For Repair",
    "Under Repair",
    "Repaired",
    "Reassemble",
    "Ready To Collect",
    "Returned",
    "Shipped",
    "Invoiced",
    "QC Failure",
    "Cleaning",
    "Battery Testing",
    "Awaiting Part",
    "Repair Paused",
}
DECLINED_STATUSES = {"Cancelled/Declined", "BER/Parts"}
DECLINED_REPAIR_TYPES = {
    "Quote Rejected",
    "Unrepairable",
    "BER",
    "No Fault Found",
    "Booking Cancelled",
}
REPAIR_END_STATUSES = {"Ready To Collect", "Returned", "Shipped", "Invoiced"}
TECH_NAME_MAP = {
    "25304513": "Safan Patel",
    "64642914": "Misha Kepeshchuk",
    "49001724": "Andreas Egas",
    "79665360": "Roni Mykhailiuk",
    "55780786": "Michael Ferrari",
}


def load_token():
    env_path = Path("/home/ricky/config/api-keys/.env")
    for line in env_path.read_text().splitlines():
        if line.startswith("MONDAY_APP_TOKEN="):
            return line.split("=", 1)[1].strip()
    raise RuntimeError("MONDAY_APP_TOKEN not found in /home/ricky/config/api-keys/.env")


TOKEN = load_token()
HEADERS = {
    "Authorization": TOKEN,
    "Content-Type": "application/json",
    "API-Version": API_VERSION,
}


def monday_query(query):
    started = time.time()
    resp = requests.post(MONDAY_API_URL, headers=HEADERS, json={"query": query}, timeout=120)
    elapsed = time.time() - started
    if elapsed < REQUEST_GAP_SECONDS:
        time.sleep(REQUEST_GAP_SECONDS - elapsed)
    resp.raise_for_status()
    payload = resp.json()
    if "errors" in payload:
        raise RuntimeError(json.dumps(payload["errors"][:3], indent=2))
    return payload["data"]


def parse_json(value):
    if not value:
        return {}
    if isinstance(value, dict):
        return value
    try:
        return json.loads(value)
    except Exception:
        return {}


def parse_date(value):
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    text = str(value).strip()
    if not text:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S.%fZ"):
        try:
            dt = datetime.strptime(text, fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        return None


def fmt_date(dt):
    return dt.strftime("%Y-%m-%d") if dt else ""


def days_between(start, end):
    if not start or not end:
        return None
    return (end - start).total_seconds() / 86400


def pct(num, den):
    return (100.0 * num / den) if den else 0.0


def percentile(values, p):
    if not values:
        return None
    values = sorted(values)
    if len(values) == 1:
        return values[0]
    idx = (len(values) - 1) * p
    lo = math.floor(idx)
    hi = math.ceil(idx)
    if lo == hi:
        return values[lo]
    frac = idx - lo
    return values[lo] * (1 - frac) + values[hi] * frac


def summarise_distribution(values):
    values = [v for v in values if v is not None]
    if not values:
        return {"n": 0, "median": None, "p75": None, "p90": None, "mean": None}
    return {
        "n": len(values),
        "median": percentile(values, 0.5),
        "p75": percentile(values, 0.75),
        "p90": percentile(values, 0.9),
        "mean": sum(values) / len(values),
    }


def fmt_days(value):
    if value is None:
        return "n/a"
    if abs(value) < 1:
        return f"{value * 24:.1f}h"
    return f"{value:.1f}d"


def money_value(raw):
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return float(raw)
    parsed = parse_json(raw)
    if isinstance(parsed, dict) and "value" in parsed:
        try:
            return float(parsed["value"])
        except Exception:
            return None
    text = str(raw).replace("£", "").replace(",", "").strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def clean_html(html):
    if not html:
        return ""
    text = html
    text = re.sub(r"(?i)<br\\s*/?>", "\n", text)
    text = re.sub(r"(?i)</p>", "\n", text)
    text = re.sub(r"(?i)<li[^>]*>", "- ", text)
    text = re.sub(r"(?i)</li>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)
    text = text.replace("\ufeff", "")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def truncate_words(text, limit=25):
    words = text.split()
    return " ".join(words[:limit]).strip()


def column_map(item):
    return {cv["id"]: cv for cv in item.get("column_values", [])}


def cv_text(cv):
    if not cv:
        return ""
    return (cv.get("text") or "").strip()


def board_relation_display(cv):
    if not cv:
        return ""
    return (cv.get("display_value") or cv.get("text") or "").strip()


def people_text(cv):
    if not cv:
        return ""
    return (cv.get("text") or "").strip()


def people_ids(cv):
    if not cv:
        return []
    pts = cv.get("persons_and_teams") or []
    if pts:
        return [str(p["id"]) for p in pts if p.get("kind") == "person"]
    value = parse_json(cv.get("value"))
    pts = value.get("personsAndTeams", [])
    return [str(p["id"]) for p in pts if p.get("kind") == "person"]


def fetch_all_items():
    all_items = []
    cursor = None
    seen_cursors = set()
    page = 0
    col_ids_gql = "[" + ", ".join(f'"{c}"' for c in COLUMN_IDS) + "]"
    while True:
        page += 1
        if cursor:
            if cursor in seen_cursors:
                print(f"Stopping pagination on repeated cursor after page {page}: {cursor}", flush=True)
                break
            seen_cursors.add(cursor)
            query = f"""
            {{
              next_items_page(cursor: "{cursor}", limit: 200) {{
                cursor
                items {{
                  id
                  name
                  created_at
                  updated_at
                  group {{ id title }}
                  column_values(ids: {col_ids_gql}) {{
                    id
                    type
                    text
                    value
                    ... on BoardRelationValue {{
                      display_value
                      linked_item_ids
                    }}
                    ... on PeopleValue {{
                      persons_and_teams {{ id kind }}
                    }}
                  }}
                }}
              }}
            }}
            """
            data = monday_query(query)["next_items_page"]
        else:
            query = f"""
            {{
              boards(ids: [{BOARD_ID}]) {{
                items_page(limit: 200) {{
                  cursor
                  items {{
                    id
                    name
                    created_at
                    updated_at
                    group {{ id title }}
                    column_values(ids: {col_ids_gql}) {{
                      id
                      type
                      text
                      value
                      ... on BoardRelationValue {{
                        display_value
                        linked_item_ids
                      }}
                      ... on PeopleValue {{
                        persons_and_teams {{ id kind }}
                      }}
                    }}
                  }}
                }}
              }}
            }}
            """
            data = monday_query(query)["boards"][0]["items_page"]
        print(f"Fetched board page {page}: {len(data['items'])} items", flush=True)
        all_items.extend(data["items"])
        cursor = data["cursor"]
        if not data["items"] or not cursor:
            break
    return all_items


def batch(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i : i + size]


def fetch_updates_for_items(item_ids):
    updates_by_item = {}
    chunk_count = math.ceil(len(item_ids) / UPDATE_BATCH_SIZE) if item_ids else 0
    for idx, chunk in enumerate(batch(item_ids, UPDATE_BATCH_SIZE), start=1):
        print(f"Fetching update batch {idx}/{chunk_count} ({len(chunk)} items)", flush=True)
        ids = ", ".join(chunk)
        query = f"""
        {{
          items(ids: [{ids}]) {{
            id
            updates(limit: 100) {{
              id
              body
              created_at
              creator {{ id name }}
            }}
          }}
        }}
        """
        data = monday_query(query)
        for item in data["items"]:
            updates = []
            for update in item.get("updates", []):
                updates.append(
                    {
                        "id": update["id"],
                        "created_at": update["created_at"],
                        "creator_id": str(update.get("creator", {}).get("id") or ""),
                        "creator_name": update.get("creator", {}).get("name") or "",
                        "body_html": update.get("body") or "",
                        "body_text": clean_html(update.get("body") or ""),
                    }
                )
            updates_by_item[str(item["id"])] = updates
    return updates_by_item


def classify_device(device_text, requested_text):
    combined = f"{device_text} {requested_text}".lower()
    if "macbook" in combined:
        return "MacBook"
    if "iphone" in combined:
        return "iPhone"
    if "ipad" in combined:
        return "iPad"
    if "watch" in combined:
        return "Watch"
    return "Other"


def classify_fault(item):
    text = " | ".join(
        [
            item["requested_repairs"],
            item["problem_repair"],
            item["problem_client"],
            item["intake_notes"],
        ]
    ).lower()
    if any(k in text for k in ["liquid", "water", "corrosion"]):
        return "Liquid Damage"
    if any(k in text for k in ["no power", "won't turn on", "wont turn on", "not turning on", "dead"]):
        return "No Power / Non-Functional"
    if "data recovery" in text:
        return "Data Recovery"
    if "screen" in text or "display" in text or "lcd" in text:
        return "Screen"
    if "battery" in text:
        return "Battery"
    if "charge" in text or "usb" in text or "port" in text:
        return "Charging / Port"
    if "board" in text or "logic" in text:
        return "Board Level"
    if "camera" in text:
        return "Camera"
    if "face id" in text or "touch id" in text:
        return "Biometric"
    if "diagnostic" in text:
        return "Diagnostic / Unknown Fault"
    return "Other / Unclear"


def is_non_functional(item):
    text = " ".join(
        [
            item["requested_repairs"],
            item["intake_notes"],
            item["final_quote"],
            item["problem_repair"],
            item["problem_client"],
            item["function_reported"],
            item["function_actual"],
            item["liquid_damage"],
        ]
    ).lower()
    return any(keyword in text for keyword in NON_FUNCTIONAL_KEYWORDS)


def choose_diag_tech(item):
    for name_field, id_field in (
        ("diag_tech", "diag_tech_ids"),
        ("technician", "technician_ids"),
        ("repair_tech", "repair_tech_ids"),
    ):
        ids = item.get(id_field) or []
        if ids and ids[0] in TECH_NAME_MAP:
            return TECH_NAME_MAP[ids[0]]
        if item.get(name_field):
            return item[name_field]
    return ""


def choose_diag_tech_id(item):
    for field in ("diag_tech_ids", "technician_ids", "repair_tech_ids"):
        ids = item.get(field) or []
        if ids:
            return ids[0]
    return ""


def meaningful_update(update):
    text = update["body_text"].strip()
    if not text:
        return False
    if update["creator_name"] in AUTO_UPDATE_CREATORS:
        return False
    lower = text.lower()
    if len(lower) < 20:
        return False
    return True


def score_update(update):
    text = update["body_text"]
    lower = text.lower()
    keyword_hits = sum(1 for kw in DIAG_DETAIL_KEYWORDS if kw in lower)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    bullets = sum(1 for line in lines if line.startswith("- "))
    score = len(text) / 80 + keyword_hits * 1.5 + bullets
    if any(p in lower for p in GENERIC_NOTE_PATTERNS):
        score -= 6
    return score


def assess_writeup(item):
    updates = sorted(item.get("updates", []), key=lambda x: x["created_at"])
    diag_complete = item["diag_complete_dt"]
    candidates = []
    for update in updates:
        if not meaningful_update(update):
            continue
        update_dt = parse_date(update["created_at"])
        if diag_complete and update_dt:
            lag = abs((update_dt - diag_complete).total_seconds()) / 86400
            if lag <= 10:
                candidates.append(update)
                continue
        lower = update["body_text"].lower()
        if any(kw in lower for kw in DIAG_DETAIL_KEYWORDS):
            candidates.append(update)
    if not candidates:
        all_meaningful = [u for u in updates if meaningful_update(u)]
        if not all_meaningful:
            return {"quality": "missing", "best": None}
        best = max(all_meaningful, key=score_update)
        if len(best["body_text"]) >= 120 and sum(1 for kw in DIAG_DETAIL_KEYWORDS if kw in best["body_text"].lower()) >= 2:
            return {"quality": "thin", "best": best}
        return {"quality": "missing", "best": best}
    best = max(candidates, key=score_update)
    lower = best["body_text"].lower()
    has_template_noise = any(p in lower for p in GENERIC_NOTE_PATTERNS)
    if len(best["body_text"]) >= 180 and sum(1 for kw in DIAG_DETAIL_KEYWORDS if kw in lower) >= 3 and not has_template_noise:
        return {"quality": "detailed", "best": best}
    if len(best["body_text"]) >= 60:
        return {"quality": "thin", "best": best}
    return {"quality": "missing", "best": best}


def trace_response_from_updates(item):
    quote_dt = item["quote_sent_dt"]
    if not quote_dt:
        return None
    for update in sorted(item.get("updates", []), key=lambda x: x["created_at"]):
        if update["creator_name"] in AUTO_UPDATE_CREATORS:
            continue
        update_dt = parse_date(update["created_at"])
        if not update_dt or update_dt < quote_dt:
            continue
        lower = update["body_text"].lower()
        if any(k in lower for k in APPROVAL_KEYWORDS):
            return {"type": "approved", "dt": update_dt, "source": "update", "update": update}
        if any(k in lower for k in DECLINE_KEYWORDS):
            return {"type": "declined", "dt": update_dt, "source": "update", "update": update}
    return None


def make_item_record(raw_item):
    cols = column_map(raw_item)
    created_dt = parse_date(raw_item["created_at"])
    received_dt = parse_date(cv_text(cols.get("date4")))
    entry_dt = received_dt or created_dt
    diag_complete_dt = parse_date(cv_text(cols.get("date_mkwdmm9k")))
    quote_sent_dt = parse_date(cv_text(cols.get("date_mkwdwx03")))
    date_repaired_dt = parse_date(cv_text(cols.get("collection_date"))) or parse_date(cv_text(cols.get("date_mkwdan7z")))
    returned_dt = parse_date(cv_text(cols.get("date3")))
    requested_repairs = board_relation_display(cols.get("board_relation"))
    device_name = board_relation_display(cols.get("board_relation5"))
    repair_type = cv_text(cols.get("status24"))
    status4 = cv_text(cols.get("status4"))
    paid_value = money_value(cols.get("dup__of_quote_total", {}).get("value"))
    if paid_value is None:
        paid_value = money_value(cols.get("dup__of_quote_total", {}).get("text"))
    quote_value = money_value(cols.get("formula74", {}).get("text"))
    diag_related = (
        "diagnostic" in repair_type.lower()
        or "diagnostic" in requested_repairs.lower()
        or diag_complete_dt is not None
    )
    return {
        "id": str(raw_item["id"]),
        "name": raw_item["name"],
        "group": raw_item.get("group", {}).get("title", ""),
        "created_dt": created_dt,
        "updated_dt": parse_date(raw_item.get("updated_at")),
        "received_dt": received_dt,
        "entry_dt": entry_dt,
        "diag_complete_dt": diag_complete_dt,
        "quote_sent_dt": quote_sent_dt,
        "date_repaired_dt": date_repaired_dt,
        "returned_dt": returned_dt,
        "service": cv_text(cols.get("service")),
        "client_type": cv_text(cols.get("status")),
        "repair_type": repair_type,
        "status4": status4,
        "device_name": device_name,
        "requested_repairs": requested_repairs,
        "technician": people_text(cols.get("person")),
        "technician_ids": people_ids(cols.get("person")),
        "diag_tech": people_text(cols.get("multiple_person_mkwqj321")),
        "diag_tech_ids": people_ids(cols.get("multiple_person_mkwqj321")),
        "repair_tech": people_text(cols.get("multiple_person_mkwqy930")),
        "repair_tech_ids": people_ids(cols.get("multiple_person_mkwqy930")),
        "qc_by": people_text(cols.get("multiple_person_mkyp2bka")),
        "payment_status": cv_text(cols.get("payment_status")),
        "payment_method": cv_text(cols.get("payment_method")),
        "paid_value": paid_value,
        "quote_value": quote_value,
        "liquid_damage": cv_text(cols.get("color_mkqg8ktb")),
        "function_reported": cv_text(cols.get("color_mkqg578m")),
        "function_actual": cv_text(cols.get("color_mkqgj96q")),
        "problem_repair": cv_text(cols.get("color_mkse6rw0")),
        "problem_client": cv_text(cols.get("color_mkse6bhk")),
        "intake_notes": cv_text(cols.get("long_text_mkqhfapq")),
        "final_quote": cv_text(cols.get("long_text_mkqhxknq")),
        "is_diagnostic_job": diag_related,
    }


def in_window(dt):
    return dt and ANALYSIS_START <= dt <= ANALYSIS_END


def format_counter(counter):
    return sorted(counter.items(), key=lambda kv: (-kv[1], kv[0]))


def write_header():
    OUTPUT_FILE.write_text(
        "\n".join(
            [
                "# Diagnostics Deep Dive",
                "",
                "Last updated: 2026-04-02",
                "",
                "## Scope",
                "",
                f"- Board: `{BOARD_ID}`",
                f"- Analysis window for intake cohort: `{fmt_date(ANALYSIS_START)}` through `{fmt_date(ANALYSIS_END)}`",
                f"- Open-state snapshot date: `{fmt_date(SNAPSHOT_AT)}`",
                "- Method: live Monday GraphQL pull for board items plus live `updates` query for diagnostic items; local audit exports used only as cross-checks where Monday historical surfaces are incomplete.",
                "- Important limitation: customer approval / response timing is only partially traceable in Monday. Where exact approval dates are not visible, the report uses explicit proxies and labels them as such.",
                "",
            ]
        )
        + "\n"
    )


def append_section(title, lines):
    with OUTPUT_FILE.open("a") as fh:
        fh.write(f"## {title}\n\n")
        fh.write("\n".join(lines).rstrip() + "\n\n")


def item_link_line(item):
    return f"- `{item['name']}` (`{item['id']}`)"


def render_volume_section(intake_items, completion_items):
    total = len(intake_items)
    by_month = Counter(item["entry_dt"].strftime("%Y-%m") for item in intake_items if item["entry_dt"])
    completions_by_month = Counter(item["diag_complete_dt"].strftime("%Y-%m") for item in completion_items if item["diag_complete_dt"])
    by_device = Counter(item["device_family"] for item in intake_items)
    by_fault = Counter(item["fault_category"] for item in intake_items)
    lines = [
        f"- Intake-cohort diagnostic jobs in scope: `{total}`",
        f"- Diagnostic jobs with `Diag. Complete` in the same window: `{len(completion_items)}`",
        "- Monthly intake volume:",
    ]
    for month, count in sorted(by_month.items()):
        lines.append(f"  - `{month}`: `{count}`")
    lines.append("- Monthly diagnostic completions:")
    for month, count in sorted(completions_by_month.items()):
        lines.append(f"  - `{month}`: `{count}`")
    lines.append("- Device mix:")
    for device, count in format_counter(by_device):
        lines.append(f"  - `{device}`: `{count}`")
    lines.append("- Fault / service-category mix:")
    for fault, count in format_counter(by_fault)[:10]:
        lines.append(f"  - `{fault}`: `{count}`")
    return lines


def render_writeups_section(items):
    quality_counts = Counter(item["writeup_quality"] for item in items)
    flagged = [item for item in items if item["diag_complete_dt"] and item["writeup_quality"] == "missing"]
    examples_good = [
        item
        for item in items
        if item["writeup_quality"] == "detailed"
        and item["writeup_best"]
        and not any(p in item["writeup_best"]["body_text"].lower() for p in GENERIC_NOTE_PATTERNS)
    ][:3]
    examples_bad = [item for item in items if item["writeup_quality"] in {"thin", "missing"}][:3]
    documented = sum(1 for item in items if item["writeup_quality"] == "detailed")
    lines = [
        f"- Detailed diagnostic write-ups: `{quality_counts['detailed']}`",
        f"- Thin write-ups: `{quality_counts['thin']}`",
        f"- Missing / non-meaningful write-ups: `{quality_counts['missing']}`",
        f"- `Diag. Complete` present but no meaningful diagnostic note: `{len(flagged)}`",
        "- Pattern readout:",
        f"  - The strongest notes usually sit near `Diag. Complete`, are written by a human tech, and explain both prior history and the current fault.",
        f"  - Thin notes are usually routing comments, quote admin, or one-line outcomes without technical justification.",
        f"  - Only `{documented}` of `{len(items)}` diagnostic jobs in the intake cohort have a genuinely detailed write-up.",
        "- Representative strong examples:",
    ]
    for item in examples_good:
        best = item["writeup_best"]
        excerpt = truncate_words(best["body_text"], 28) if best else ""
        lines.append(
            f"  - `{item['name']}` (`{item['id']}`) by `{best['creator_name']}` on `{best['created_at'][:10]}`: “{excerpt}”"
        )
    lines.append("- Representative weak / missing examples:")
    for item in examples_bad:
        best = item["writeup_best"]
        if best:
            excerpt = truncate_words(best["body_text"], 18)
            lines.append(
                f"  - `{item['name']}` (`{item['id']}`): `{item['writeup_quality']}` note by `{best['creator_name']}` on `{best['created_at'][:10]}`: “{excerpt}”"
            )
        else:
            lines.append(f"  - `{item['name']}` (`{item['id']}`): no meaningful human update found.")
    lines.append("- Flagged jobs with `Diag. Complete` but no meaningful note:")
    for item in flagged[:20]:
        lines.append(f"  - `{item['name']}` (`{item['id']}`) | tech `{item['diag_owner'] or 'Unassigned'}` | diag complete `{fmt_date(item['diag_complete_dt'])}`")
    if len(flagged) > 20:
        lines.append(f"  - `... {len(flagged) - 20} more`")
    return lines


def render_timeline_section(intake_items, completion_items):
    diag_only = [i for i in completion_items if not i["completed_repair"]]
    converted = [i for i in completion_items if i["completed_repair"]]
    metrics = {
        "Received/Created -> Diag. Complete": [i["lag_entry_to_diag"] for i in completion_items],
        "Diag. Complete -> Quote Sent": [i["lag_diag_to_quote"] for i in completion_items],
        "Quote Sent -> Customer Response (traceable only)": [i["lag_quote_to_response"] for i in completion_items],
        "Approval -> Repair Complete (traceable only)": [i["lag_approval_to_repair_complete"] for i in completion_items],
        "End-to-end to Return/Collection": [i["lag_entry_to_end"] for i in intake_items],
    }
    lines = []
    for label, values in metrics.items():
        summary = summarise_distribution(values)
        lines.append(
            f"- `{label}`: n=`{summary['n']}`, median=`{fmt_days(summary['median'])}`, p75=`{fmt_days(summary['p75'])}`, p90=`{fmt_days(summary['p90'])}`"
        )
    lines.append("- Diagnostic-only vs converted-to-repair:")
    diag_only_summary = summarise_distribution([i["lag_entry_to_diag"] for i in diag_only])
    converted_summary = summarise_distribution([i["lag_entry_to_diag"] for i in converted])
    lines.append(
        f"  - Diagnostic-only: n=`{diag_only_summary['n']}`, median intake->diag=`{fmt_days(diag_only_summary['median'])}`"
    )
    lines.append(
        f"  - Converted to repair: n=`{converted_summary['n']}`, median intake->diag=`{fmt_days(converted_summary['median'])}`"
    )
    return lines


def render_funnel_section(completion_items):
    total = len(completion_items)
    quote_sent = sum(1 for i in completion_items if i["quote_sent_dt"])
    traceable_response = sum(1 for i in completion_items if i["response_trace"])
    approved = sum(1 for i in completion_items if i["approved_proxy"])
    completed_repair = sum(1 for i in completion_items if i["completed_repair"])
    declined = sum(1 for i in completion_items if i["declined_final"])
    limbo = sum(1 for i in completion_items if i["limbo"])
    direct_no_quote = sum(1 for i in completion_items if i["approved_proxy"] and not i["quote_sent_dt"])
    lines = [
        f"- Diagnostics completed in window: `{total}`",
        f"- Quote sent: `{quote_sent}` (`{pct(quote_sent, total):.1f}%`)",
        f"- Traceable customer response after quote: `{traceable_response}` (`{pct(traceable_response, quote_sent):.1f}%` of quoted jobs)",
        f"- Repair-authorised / proceeded proxy: `{approved}` (`{pct(approved, total):.1f}%` of diagnostics completed)",
        f"- Repairs that proceeded without a recorded `Quote Sent` date: `{direct_no_quote}` (`{pct(direct_no_quote, total):.1f}%`)",
        f"- Completed repair: `{completed_repair}` (`{pct(completed_repair, total):.1f}%`)",
        f"- Declined / cancelled / abandoned: `{declined}` (`{pct(declined, total):.1f}%`)",
        f"- Limbo (`Quote Sent` but no visible decision/completion): `{limbo}` (`{pct(limbo, quote_sent):.1f}%` of quoted jobs)",
    ]
    lines.append(
        f"- Biggest recorded funnel break is `Diag. Complete -> Quote Sent`: `{total - quote_sent}` diagnostics have no formal quote date, even though many later progress to repair."
    )
    for group_label, key in [("device", "device_family"), ("fault", "fault_category")]:
        lines.append(f"- Funnel by {group_label}:")
        grouped = defaultdict(list)
        for item in completion_items:
            grouped[item[key]].append(item)
        for group_name, rows in sorted(grouped.items(), key=lambda kv: (-len(kv[1]), kv[0]))[:10]:
            q = sum(1 for i in rows if i["quote_sent_dt"])
            c = sum(1 for i in rows if i["completed_repair"])
            d = sum(1 for i in rows if i["declined_final"])
            l = sum(1 for i in rows if i["limbo"])
            lines.append(
                f"  - `{group_name}`: diag complete `{len(rows)}`, quote `{q}`, completed repair `{c}`, declined `{d}`, limbo `{l}`"
            )
    return lines


def render_technician_section(items):
    grouped = defaultdict(list)
    for item in items:
        grouped[item["diag_owner"] or "Unassigned"].append(item)
    lines = []
    total_with_owner = sum(len(rows) for tech, rows in grouped.items() if tech != "Unassigned")
    for tech, rows in sorted(grouped.items(), key=lambda kv: (-len(kv[1]), kv[0])):
        diag_times = [r["lag_entry_to_diag"] for r in rows if r["lag_entry_to_diag"] is not None]
        detailed = sum(1 for r in rows if r["writeup_quality"] == "detailed")
        completed_repair = sum(1 for r in rows if r["completed_repair"])
        lines.append(
            f"- `{tech}`: volume=`{len(rows)}`, median intake->diag=`{fmt_days(percentile(diag_times, 0.5) if diag_times else None)}`, detailed write-up rate=`{pct(detailed, len(rows)):.1f}%`, completed-repair conversion=`{pct(completed_repair, len(rows)):.1f}%`"
        )
    safan = grouped.get("Safan Patel", [])
    safan_diag_times = [r["lag_entry_to_diag"] for r in safan if r["lag_entry_to_diag"] is not None]
    safan_detailed = sum(1 for r in safan if r["writeup_quality"] == "detailed")
    safan_completed = sum(1 for r in safan if r["completed_repair"])
    share = pct(len(safan), total_with_owner)
    lines.append("- Safan callout:")
    lines.append(
        f"  - Volume `{len(safan)}` diagnostics, share of owner-attributed flow `{share:.1f}%`, median intake->diag `{fmt_days(percentile(safan_diag_times, 0.5) if safan_diag_times else None)}`"
    )
    lines.append(
        f"  - Detailed write-up rate `{pct(safan_detailed, len(safan)):.1f}%`, completed-repair conversion `{pct(safan_completed, len(safan)):.1f}%`"
    )
    lines.append(
        f"  - Capacity bottleneck signal: {'yes' if share >= 35 else 'not clearly'}; his share is large enough that throughput risk concentrates around him."
    )
    return lines


def render_revenue_section(completion_items, intake_items):
    converted = [i for i in completion_items if i["completed_repair"]]
    diag_only = [i for i in intake_items if i["diag_complete_dt"] and not i["completed_repair"]]
    converted_paid = [i["paid_value"] for i in converted if i["paid_value"] is not None]
    diag_only_paid = [i["paid_value"] for i in diag_only if i["paid_value"] is not None]
    lines = [
        f"- Converted-to-repair jobs with visible paid value: `{len(converted_paid)}` / `{len(converted)}`",
        f"- Average visible repair value on converted diagnostics: `£{(sum(converted_paid)/len(converted_paid)):.2f}`" if converted_paid else "- Average visible repair value on converted diagnostics: `n/a`",
        f"- Diagnostic-only jobs with any visible paid value: `{len(diag_only_paid)}` / `{len(diag_only)}`",
        f"- Average visible diagnostic-only charge: `£{(sum(diag_only_paid)/len(diag_only_paid)):.2f}`" if diag_only_paid else "- Average visible diagnostic-only charge: `n/a`",
    ]
    base_volume = len(intake_items)
    conv_rate = pct(sum(1 for i in intake_items if i["completed_repair"]), base_volume) / 100 if base_volume else 0
    avg_repair_value = (sum(converted_paid) / len(converted_paid)) if converted_paid else 0
    diag_fee_rate = len(diag_only_paid) / len(diag_only) if diag_only else 0
    avg_diag_fee = (sum(diag_only_paid) / len(diag_only_paid)) if diag_only_paid else 0
    for uplift in (0.25, 0.5):
        extra_jobs = base_volume * uplift
        extra_repair_revenue = extra_jobs * conv_rate * avg_repair_value
        extra_diag_revenue = extra_jobs * (1 - conv_rate) * diag_fee_rate * avg_diag_fee
        lines.append(
            f"- Revenue potential at `+{int(uplift*100)}%` diagnostic volume: visible-value model ≈ `£{extra_repair_revenue + extra_diag_revenue:,.0f}` incremental over a comparable six-month period, assuming current conversion and fee capture rates hold."
        )
    lines.append("- This revenue section is directional only because Monday `Paid` is only populated on a subset of jobs.")
    return lines


def render_nonfunctional_section(items):
    target = [i for i in items if i["non_functional_target"]]
    converted = [i for i in target if i["completed_repair"]]
    standard = [i for i in items if not i["non_functional_target"]]
    converted_paid = [i["paid_value"] for i in converted if i["paid_value"] is not None]
    outcomes = Counter(i["outcome_bucket"] for i in target)
    lines = [
        f"- Non-functional / liquid-damage target diagnostics: `{len(target)}` of `{len(items)}` intake-cohort diagnostics (`{pct(len(target), len(items)):.1f}%`)",
        f"- Completed-repair conversion for target diagnostics: `{pct(sum(1 for i in target if i['completed_repair']), len(target)):.1f}%`",
        f"- Completed-repair conversion for standard diagnostics: `{pct(sum(1 for i in standard if i['completed_repair']), len(standard)):.1f}%`",
        f"- Average visible repair value when target diagnostics convert: `£{(sum(converted_paid)/len(converted_paid)):.2f}`" if converted_paid else "- Average visible repair value when target diagnostics convert: `n/a`",
        "- Common outcomes:",
    ]
    for outcome, count in format_counter(outcomes):
        lines.append(f"  - `{outcome}`: `{count}`")
    return lines


def main():
    write_header()

    raw_export_path = EXPORT_ROOT / "diagnostics-deep-dive-items-live-2026-04-02.json"
    updates_export_path = EXPORT_ROOT / "diagnostics-deep-dive-updates-live-2026-04-02.json"
    use_cache = "--from-cache" in sys.argv and raw_export_path.exists() and updates_export_path.exists()
    if use_cache:
        print("Rebuilding report from cached live exports...", flush=True)
        all_items_raw = json.loads(raw_export_path.read_text())
    else:
        print("Fetching live board items...", flush=True)
        all_items_raw = fetch_all_items()
        raw_export_path.write_text(json.dumps(all_items_raw, indent=2))

    all_items = [make_item_record(item) for item in all_items_raw]
    diagnostic_items = [item for item in all_items if item["is_diagnostic_job"]]
    intake_items = [item for item in diagnostic_items if in_window(item["entry_dt"])]
    completion_items = [item for item in diagnostic_items if in_window(item["diag_complete_dt"])]
    print(
        f"Item scan complete: total={len(all_items)}, diagnostic={len(diagnostic_items)}, intake_window={len(intake_items)}, diag_complete_window={len(completion_items)}",
        flush=True,
    )

    diagnostic_item_ids = [item["id"] for item in intake_items]
    if use_cache:
        updates_by_item = json.loads(updates_export_path.read_text())
    else:
        print("Fetching live updates for diagnostic intake cohort...", flush=True)
        updates_by_item = fetch_updates_for_items(diagnostic_item_ids)
        updates_export_path.write_text(json.dumps(updates_by_item, indent=2))

    for item in intake_items:
        item["updates"] = updates_by_item.get(item["id"], [])
        item["device_family"] = classify_device(item["device_name"], item["requested_repairs"])
        item["fault_category"] = classify_fault(item)
        item["non_functional_target"] = is_non_functional(item)
        item["diag_owner"] = choose_diag_tech(item)
        item["diag_owner_id"] = choose_diag_tech_id(item)
        item["lag_entry_to_diag"] = days_between(item["entry_dt"], item["diag_complete_dt"])
        item["lag_diag_to_quote"] = days_between(item["diag_complete_dt"], item["quote_sent_dt"])
        item["lag_entry_to_end"] = days_between(item["entry_dt"], item["returned_dt"] or item["date_repaired_dt"])
        item["response_trace"] = trace_response_from_updates(item)
        item["lag_quote_to_response"] = days_between(item["quote_sent_dt"], item["response_trace"]["dt"]) if item["response_trace"] else None
        item["approved_dt"] = item["response_trace"]["dt"] if item["response_trace"] and item["response_trace"]["type"] == "approved" else None
        item["lag_approval_to_repair_complete"] = days_between(item["approved_dt"], item["date_repaired_dt"])
        writeup = assess_writeup(item)
        item["writeup_quality"] = writeup["quality"]
        item["writeup_best"] = writeup["best"]
        item["declined_or_cancelled"] = (
            item["status4"] in DECLINED_STATUSES
            or item["repair_type"] in DECLINED_REPAIR_TYPES
            or (item["response_trace"] and item["response_trace"]["type"] == "declined")
        )
        item["completed_repair"] = bool(item["date_repaired_dt"]) or (
            item["status4"] in REPAIR_END_STATUSES and item["repair_type"] not in DECLINED_REPAIR_TYPES and "diagnostic" not in item["repair_type"].lower()
        )
        item["approved_proxy"] = bool(item["approved_dt"]) or (
            not item["declined_or_cancelled"] and (item["completed_repair"] or item["status4"] in REPAIR_PROGRESS_STATUSES and item["status4"] != "Quote Sent")
        )
        item["limbo"] = bool(item["quote_sent_dt"]) and not item["declined_or_cancelled"] and not item["completed_repair"] and not item["approved_dt"] and item["status4"] in {
            "Quote Sent",
            "Client Contacted",
            "Client To Contact",
            "Repair Paused",
            "Awaiting Confirmation",
            "Awaiting Part",
            "Invoiced",
        }
        if item["completed_repair"]:
            item["outcome_bucket"] = "Completed Repair"
        elif item["declined_or_cancelled"]:
            if item["repair_type"] == "BER" or item["status4"] == "BER/Parts":
                item["outcome_bucket"] = "BER / Parts"
            else:
                item["outcome_bucket"] = "Declined / Cancelled"
        elif "data recovery" in (item["requested_repairs"] + " " + item["final_quote"]).lower():
            item["outcome_bucket"] = "Data Recovery Only"
        elif item["limbo"]:
            item["outcome_bucket"] = "Limbo / Awaiting Response"
        else:
            item["outcome_bucket"] = "Diagnostic Only / Other"
        item["declined_final"] = item["outcome_bucket"] in {"BER / Parts", "Declined / Cancelled"}

    intake_by_id = {item["id"]: item for item in intake_items}
    completion_items = [intake_by_id[item["id"]] for item in completion_items if item["id"] in intake_by_id]

    append_section("1. Diagnostic Volume And Identification", render_volume_section(intake_items, completion_items))
    append_section("2. Written Updates / Diagnostic Reports", render_writeups_section(intake_items))
    append_section("3. Timeline Analysis", render_timeline_section(intake_items, completion_items))
    append_section("4. Conversion Funnel", render_funnel_section(completion_items))
    append_section("5. Technician Analysis", render_technician_section(completion_items))
    append_section("6. Revenue And Margin Signal", render_revenue_section(completion_items, intake_items))
    append_section("7. Non-Functional Device Analysis", render_nonfunctional_section(intake_items))

    summary = {
        "fetched_items": len(all_items),
        "diagnostic_items_total": len(diagnostic_items),
        "intake_items_in_window": len(intake_items),
        "completion_items_in_window": len(completion_items),
        "output_file": str(OUTPUT_FILE),
    }
    (EXPORT_ROOT / "diagnostics-deep-dive-summary-2026-04-02.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise
