#!/usr/bin/env python3
"""Corrected rerun for BRIEF-C14 repair-history mining.

This pull uses the revised brief requirements:
- fetch both board slices with updates and nested replies
- paginate with 2-second page delays
- fetch per-item activity logs at <= 5 items/sec
- write raw output to repair-history-full.json
- write analysis output to repair-history-analysis.md
"""

from __future__ import annotations

import html
import json
import os
import re
import sys
import time
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests


ENV_PATH = Path("/home/ricky/config/api-keys/.env")
RAW_OUTPUT = Path("/home/ricky/builds/agent-rebuild/data/repair-history-full.json")
ANALYSIS_OUTPUT = Path("/home/ricky/builds/agent-rebuild/repair-history-analysis.md")
SOP_GAP_DOC = Path("/home/ricky/builds/agent-rebuild/journey-sop-gap-analysis.md")

MONDAY_API_URL = "https://api.monday.com/v2"
PAGE_LIMIT = 50
PAGE_DELAY_SECONDS = 2.0
ACTIVITY_DELAY_SECONDS = 0.22
MAX_RETRIES = 6


@dataclass(frozen=True)
class BoardSpec:
    board_id: int
    board_name: str
    date_column_id: str
    date_start: str
    date_end: str


BOARD_SPECS = [
    BoardSpec(
        board_id=349212843,
        board_name="iCorrect Main Board",
        date_column_id="date_mkwdan7z",
        date_start="2023-04-07",
        date_end="2026-12-31",
    ),
    BoardSpec(
        board_id=6162422834,
        board_name="Main Board Archive: 2021-2023",
        date_column_id="collection_date",
        date_start="2023-04-07",
        date_end="2023-12-31",
    ),
]


CATEGORY_ORDER = [
    "Normal flow",
    "Parts delay",
    "Extra fault found",
    "Customer communication issue",
    "Pricing dispute",
    "Diagnostic complexity",
    "QC rejection",
    "Warranty/return",
    "Handoff failure",
    "Data quality issue",
    "Escalation",
    "Client no-show / abandoned",
    "Insurance/corporate special handling",
    "Liquid damage complexity",
    "Board-level repair complexity",
]

ISSUE_CATEGORIES = [name for name in CATEGORY_ORDER if name != "Normal flow"]

CATEGORY_PATTERNS = {
    "Parts delay": [
        r"\bout of stock\b",
        r"\blow stock\b",
        r"\bawaiting part",
        r"\bawaiting parts\b",
        r"\bwaiting for part",
        r"\bwaiting on part",
        r"\bpart(?:s)? not in stock\b",
        r"\border(?:ed|ing)? (?:the )?part",
        r"\bstock check\b",
        r"\bbackorder",
    ],
    "Extra fault found": [
        r"\balso need(?:s)?\b",
        r"\badditional (?:fault|issue|problem|damage)\b",
        r"\bextra (?:fault|issue|problem)\b",
        r"\bwe noticed\b",
        r"\bduring (?:repair|qc) we noticed\b",
        r"\bturned into\b",
        r"\bnew issue\b",
        r"\bwould also need\b",
    ],
    "Customer communication issue": [
        r"\btried calling\b",
        r"\bcall back\b",
        r"\bwaiting for customer\b",
        r"\bwaiting on customer\b",
        r"\bno response\b",
        r"\bno reply\b",
        r"\bcan'?t reach\b",
        r"\bchanged mind\b",
        r"\bdidn'?t receive\b",
        r"\bpasscode\b",
        r"\bemail trail\b",
        r"\bpaper trail\b",
        r"\bcontact customer\b",
        r"\bneeds approval\b",
    ],
    "Pricing dispute": [
        r"\bnot happy but accepted\b",
        r"\bnot happy\b",
        r"\bbudget\b",
        r"\bworth doing\b",
        r"\bhalf (?:the )?price\b",
        r"\bfree of charge\b",
        r"\bwaive(?:d)? courier fee\b",
        r"\bdepends on the repair price\b",
        r"\btoo expensive\b",
        r"\bprice sensitive\b",
        r"\bnot worth\b",
        r"\bdiscount\b",
    ],
    "Diagnostic complexity": [
        r"\btriage\b",
        r"\btest lcd\b",
        r"\bknown-good\b",
        r"\bfurther diagnos",
        r"\bmultiple rounds\b",
        r"\bintermittent\b",
        r"\bstaged handoff\b",
        r"\bisolate\b",
        r"\bre-inspect\b",
    ],
    "QC rejection": [
        r"\bfailed quality control\b",
        r"\bfailing during quality control\b",
        r"\bfailed qc\b",
        r"\brework\b",
        r"\bfailed during qc\b",
    ],
    "Warranty/return": [
        r"\bunder warranty\b",
        r"\bout of warranty\b",
        r"\bwarranty\b",
        r"\breturned with the same issue\b",
        r"\breturned with the same\b",
        r"\bcame back\b",
        r"\bprevious repair\b",
        r"\bprevious repairs\b",
        r"\breturn visit\b",
    ],
    "Handoff failure": [
        r"\bcheck previous repairs column\b",
        r"\bwrong group\b",
        r"\bwrong queue\b",
        r"\bdropped between\b",
        r"\bcontext lost\b",
        r"\bhandoff\b",
        r"\bmove to saf\b",
        r"\bmove to ferrari\b",
        r"\bpassed to ferrari\b",
    ],
    "Data quality issue": [
        r"\bwrong password",
        r"\bwrong passwords\b",
        r"\bwrong info\b",
        r"\bmissing field\b",
        r"\bmissing fields\b",
        r"\bduplicate submission\b",
        r"\bwrong model\b",
        r"\bnot the 13\b",
        r"\bcheck previous repairs column\b",
        r"\bitem not found\b",
        r"\bduplicate\b",
    ],
    "Escalation": [
        r"\bescalat",
        r"@ricky",
        r"@ferrari",
        r"\bpassed to ferrari\b",
        r"\bmove to ferrari\b",
    ],
    "Client no-show / abandoned": [
        r"\bno show\b",
        r"\bnever collected\b",
        r"\bnot collected\b",
        r"\babandoned\b",
        r"\bdidn'?t turn up\b",
        r"\bnobody opening the door\b",
        r"\bbook return\b",
    ],
    "Insurance/corporate special handling": [
        r"\binsurance\b",
        r"\bcorporate\b",
        r"\bfreuds\b",
        r"\bhudson advisors\b",
        r"\beverything apple tech\b",
    ],
    "Liquid damage complexity": [
        r"\bliquid damage\b",
        r"\bliquid damaged\b",
        r"\bwater spilled\b",
        r"\bspill(?:ed)?\b",
        r"\bcorrosion\b",
        r"\bultrasonic\b",
        r"\bsubmersion\b",
    ],
    "Board-level repair complexity": [
        r"\blogic board\b",
        r"\bboard repair\b",
        r"\bpower circuit\b",
        r"\bbacklight\b",
        r"\bjumper\b",
        r"\bmicrosolder",
        r"\bchip\b",
        r"\bhall sensor\b",
        r"\btrace\b",
    ],
}

PHRASE_PATTERNS = {
    "waiting for customer": r"\bwaiting (?:for|on) customer\b",
    "needs approval": r"\bneeds approval\b",
    "tried calling": r"\btried calling\b",
    "call back with passcode": r"\bcall back with passcode\b",
    "out of stock": r"\bout of stock\b",
    "stock check": r"\bstock check\b",
    "awaiting part": r"\bawaiting part\b",
    "liquid damage": r"\bliquid damage\b",
    "logic board": r"\blogic board\b",
    "under warranty": r"\bunder warranty\b",
    "out of warranty": r"\bout of warranty\b",
    "not happy": r"\bnot happy\b",
    "worth doing": r"\bworth doing\b",
    "previous repair": r"\bprevious repair\b",
    "same issue": r"\bsame issue\b",
    "quality control": r"\bquality control\b",
}

CURRENT_HANDLING = {
    "Parts delay": "Team runs stock checks, pauses or defers the job when parts are unavailable, and resumes once stock or ordering is sorted.",
    "Extra fault found": "Tech expands the scope mid-job, re-quotes or discounts the extra work, and keeps the item open for the newly discovered issue.",
    "Customer communication issue": "Ferrari/customer-service chases by call or email, holds the repair until approval or passcode arrives, and documents special contact constraints in-thread.",
    "Pricing dispute": "Team reframes the job as diagnostic-first, offers concessions when needed, and waits for explicit price acceptance before continuing.",
    "Diagnostic complexity": "Cases are routed through staged diagnostics, substitution testing, or repeat inspections before committing to the repair path.",
    "QC rejection": "Failed QC routes devices back into rework, with extra repair passes and re-testing before release.",
    "Warranty/return": "Returned devices are compared against prior work, warranty coverage is debated in-thread, and the job is either accepted back in or reclassified as out-of-warranty.",
    "Handoff failure": "Operators rely on thread notes and ad-hoc reassignment when context drops between intake, customer-service, and the workshop.",
    "Data quality issue": "Team manually corrects bad assumptions, wrong model details, missing passcodes, or incomplete fields inside the thread before work continues.",
    "Escalation": "Complex or sensitive cases are pulled into Ferrari/Ricky threads for quote decisions, approvals, or technical direction.",
    "Client no-show / abandoned": "Jobs are held, return/collection instructions are added manually, and dormant items are eventually returned or closed without a clean collection flow.",
    "Insurance/corporate special handling": "Corporate and insurer jobs are tagged as special cases, routed through separate approval/diagnostic expectations, and often handled with explicit account notes.",
    "Liquid damage complexity": "Team treats liquid jobs as diagnostic-led work with board inspection, corrosion checks, and cautious scope expansion based on what is found internally.",
    "Board-level repair complexity": "Board repairs are handled as multi-step technical jobs with repeated testing, component-level work, and fallback decisions when the board fault broadens.",
}

SOP_GAP = {
    "Parts delay": "YES",
    "Extra fault found": "NO",
    "Customer communication issue": "YES",
    "Pricing dispute": "YES",
    "Diagnostic complexity": "NO",
    "QC rejection": "YES",
    "Warranty/return": "YES",
    "Handoff failure": "YES",
    "Data quality issue": "YES",
    "Escalation": "YES",
    "Client no-show / abandoned": "YES",
    "Insurance/corporate special handling": "YES",
    "Liquid damage complexity": "NO",
    "Board-level repair complexity": "NO",
}

SOP_GAP_BASIS = (
    "Gap calls use the documented coverage summary in "
    "`/home/ricky/builds/agent-rebuild/journey-sop-gap-analysis.md` and the rebuilt journey docs, "
    "especially the findings that delay-management, intake/handoff failures, QC structure, warranty intake, "
    "and stale-state ownership are weak or undocumented, while standard diagnostic and core repair flows do have partial SOP support."
)

PLACEHOLDER_PATTERNS = [
    re.compile(r"^\*{2,}.*\*{2,}$"),
    re.compile(r"^(notes|emails|tech notes|general notes|high level|diagnostic notes|parts checkout|stock check|customer form response summary|qc:?|parts)$", re.I),
]

TAG_RE = re.compile(r"<[^>]+>")
WHITESPACE_RE = re.compile(r"[ \t]+")
BLANKLINES_RE = re.compile(r"\n{3,}")
MENTION_RE = re.compile(r"@([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)")


def load_monday_token() -> str:
    for line in ENV_PATH.read_text().splitlines():
        if line.startswith("MONDAY_APP_TOKEN="):
            return line.split("=", 1)[1].strip().strip('"')
    raise RuntimeError(f"MONDAY_APP_TOKEN not found in {ENV_PATH}")


MONDAY_HEADERS = {
    "Content-Type": "application/json",
    "API-Version": "2024-10",
}


def monday_query(session: requests.Session, query: str) -> dict[str, Any]:
    payload = {"query": query}
    backoff = 10.0

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = session.post(MONDAY_API_URL, headers=MONDAY_HEADERS, json=payload, timeout=180)
        except requests.RequestException as exc:
            if attempt == MAX_RETRIES:
                raise RuntimeError(f"Monday request failed after retries: {exc}") from exc
            print(f"Request error on attempt {attempt}/{MAX_RETRIES}: {exc}. Sleeping {backoff:.1f}s.", flush=True)
            time.sleep(backoff)
            backoff *= 1.8
            continue

        if response.status_code == 429:
            if attempt == MAX_RETRIES:
                raise RuntimeError("Hit Monday HTTP 429 repeatedly.")
            print(f"HTTP 429 on attempt {attempt}/{MAX_RETRIES}. Sleeping {backoff:.1f}s.", flush=True)
            time.sleep(backoff)
            backoff *= 1.8
            continue

        if response.status_code != 200:
            snippet = response.text[:300].replace("\n", " ")
            if attempt == MAX_RETRIES:
                raise RuntimeError(f"Monday HTTP {response.status_code}: {snippet}")
            print(
                f"HTTP {response.status_code} on attempt {attempt}/{MAX_RETRIES}: {snippet}. "
                f"Sleeping {backoff:.1f}s.",
                flush=True,
            )
            time.sleep(backoff)
            backoff *= 1.8
            continue

        data = response.json()
        errors = data.get("errors", [])
        if errors:
            error_blob = json.dumps(errors[:3]).lower()
            if ("rate" in error_blob or "complex" in error_blob or "limit" in error_blob) and attempt < MAX_RETRIES:
                print(
                    f"GraphQL rate/complexity issue on attempt {attempt}/{MAX_RETRIES}. "
                    f"Sleeping {backoff:.1f}s.",
                    flush=True,
                )
                time.sleep(backoff)
                backoff *= 1.8
                continue
            raise RuntimeError(f"Monday GraphQL errors: {json.dumps(errors[:3])}")

        if "data" not in data:
            raise RuntimeError(f"Monday response missing data: {data}")

        return data["data"]

    raise RuntimeError("Unreachable retry state.")


def initial_items_query(spec: BoardSpec) -> str:
    return f"""
    {{
      boards(ids:[{spec.board_id}]) {{
        items_page(
          limit:{PAGE_LIMIT},
          query_params:{{
            rules:[{{
              column_id:"{spec.date_column_id}",
              compare_value:["{spec.date_start}","{spec.date_end}"],
              operator:between
            }}],
            order_by:{{column_id:"{spec.date_column_id}", direction:desc}}
          }}
        ) {{
          cursor
          items {{
            id
            name
            column_values {{
              id
              text
              value
            }}
            updates {{
              text_body
              created_at
              creator {{
                name
              }}
              replies {{
                text_body
                created_at
                creator {{
                  name
                }}
              }}
            }}
          }}
        }}
      }}
    }}
    """


def next_items_query(cursor: str) -> str:
    safe_cursor = json.dumps(cursor)
    return f"""
    {{
      next_items_page(cursor:{safe_cursor}, limit:{PAGE_LIMIT}) {{
        cursor
        items {{
          id
          name
          column_values {{
            id
            text
            value
          }}
          updates {{
            text_body
            created_at
            creator {{
              name
            }}
            replies {{
              text_body
              created_at
              creator {{
                name
              }}
            }}
          }}
        }}
      }}
    }}
    """


def activity_logs_query(board_id: int, item_id: str) -> str:
    return f"""
    {{
      boards(ids:[{board_id}]) {{
        activity_logs(limit:100, item_ids:[{item_id}]) {{
          event
          data
          created_at
          user_id
        }}
      }}
    }}
    """


def clean_text(text: str | None) -> str:
    if not text:
        return ""
    cleaned = text.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n")
    cleaned = TAG_RE.sub("", cleaned)
    cleaned = html.unescape(cleaned)
    cleaned = cleaned.replace("\r", "\n")
    cleaned = WHITESPACE_RE.sub(" ", cleaned)
    cleaned = re.sub(r" ?\n ?", "\n", cleaned)
    cleaned = BLANKLINES_RE.sub("\n\n", cleaned)
    return cleaned.strip()


def is_placeholder(text: str) -> bool:
    stripped = text.strip()
    if not stripped:
        return True
    for pattern in PLACEHOLDER_PATTERNS:
        if pattern.match(stripped):
            return True
    short = re.sub(r"[\W_]+", " ", stripped).strip()
    return len(short.split()) <= 3 and short.isupper()


def get_column_text(item: dict[str, Any], column_id: str) -> str:
    for column in item.get("column_values", []):
        if column.get("id") == column_id:
            return (column.get("text") or "").strip()
    return ""


def extract_entries(item: dict[str, Any]) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for update in item.get("updates", []):
        update_text = clean_text(update.get("text_body"))
        if update_text:
            entries.append(
                {
                    "source": "update",
                    "created_at": update.get("created_at"),
                    "creator": ((update.get("creator") or {}).get("name") or "").strip(),
                    "text": update_text,
                    "signal": not is_placeholder(update_text),
                }
            )
        for reply in update.get("replies", []):
            reply_text = clean_text(reply.get("text_body"))
            if reply_text:
                entries.append(
                    {
                        "source": "reply",
                        "created_at": reply.get("created_at"),
                        "creator": ((reply.get("creator") or {}).get("name") or "").strip(),
                        "text": reply_text,
                        "signal": True,
                    }
                )
    return entries


def extract_mentions(text: str) -> list[str]:
    return [match.group(1).strip() for match in MENTION_RE.finditer(text or "")]


def parse_log_payload(payload: Any) -> dict[str, Any]:
    if isinstance(payload, dict):
        return payload
    if isinstance(payload, str):
        try:
            return json.loads(payload)
        except json.JSONDecodeError:
            return {}
    return {}


def extract_status_label(value: Any) -> str:
    if isinstance(value, dict):
        label = value.get("label")
        if isinstance(label, dict):
            text = label.get("text") or ""
            if text:
                return str(text)
        if isinstance(label, str) and label:
            return label
        text = value.get("text") or ""
        if text:
            return str(text)
    if isinstance(value, str):
        return value
    return ""


def parse_status_transitions(logs: list[dict[str, Any]]) -> list[dict[str, str]]:
    transitions = []
    for log in logs:
        data = parse_log_payload(log.get("data"))
        previous_value = data.get("previous_value", {})
        new_value = data.get("value", {})
        previous_label = extract_status_label(previous_value) or "(empty)"
        new_label = extract_status_label(new_value) or "(empty)"
        if previous_label == "(empty)" and new_label == "(empty)":
            continue
        transitions.append(
            {
                "from": previous_label,
                "to": new_label,
                "created_at": log.get("created_at") or "",
            }
        )
    transitions.sort(key=lambda item: item["created_at"])
    return transitions


def fetch_board_items(session: requests.Session, spec: BoardSpec) -> list[dict[str, Any]]:
    print(f"Fetching board {spec.board_name} ({spec.board_id})", flush=True)
    all_items: list[dict[str, Any]] = []
    cursor = None
    page_number = 0

    while True:
        page_number += 1
        query = next_items_query(cursor) if cursor else initial_items_query(spec)
        data = monday_query(session, query)

        if cursor:
            page = data.get("next_items_page") or {}
        else:
            page = ((data.get("boards") or [{}])[0]).get("items_page") or {}

        items = page.get("items") or []
        cursor = page.get("cursor")

        for item in items:
            item["board_id"] = spec.board_id
            item["board_name"] = spec.board_name
            item["source_date_column"] = spec.date_column_id

        all_items.extend(items)
        replies_in_page = sum(len(update.get("replies") or []) for item in items for update in item.get("updates") or [])
        print(
            f"  Page {page_number}: {len(items)} items, {replies_in_page} replies, total {len(all_items)}",
            flush=True,
        )

        if not cursor or not items:
            break

        time.sleep(PAGE_DELAY_SECONDS)

    return all_items


def fetch_activity_logs_for_items(session: requests.Session, items: list[dict[str, Any]]) -> None:
    total = len(items)
    print(f"Fetching activity logs for {total} items at <= 5 items/sec", flush=True)
    for index, item in enumerate(items, start=1):
        data = monday_query(session, activity_logs_query(item["board_id"], item["id"]))
        item["activity_logs"] = ((data.get("boards") or [{}])[0]).get("activity_logs") or []
        if index == 1 or index % 50 == 0 or index == total:
            print(
                f"  Activity logs: {index}/{total} items complete; current item logs={len(item['activity_logs'])}",
                flush=True,
            )
        time.sleep(ACTIVITY_DELAY_SECONDS)


def category_matches(text_blob: str, columns_blob: str, transitions_blob: str) -> list[str]:
    haystack = "\n".join(part for part in [text_blob, columns_blob, transitions_blob] if part).lower()
    matches = []
    for category in ISSUE_CATEGORIES:
        patterns = CATEGORY_PATTERNS[category]
        if any(re.search(pattern, haystack, re.I) for pattern in patterns):
            matches.append(category)

    if (
        "Client no-show / abandoned" not in matches
        and transitions_blob
        and "ready to collect" in transitions_blob.lower()
        and "returned" in transitions_blob.lower()
    ):
        matches.append("Client no-show / abandoned")

    if not matches:
        matches.append("Normal flow")

    return matches


def truncate(text: str, limit: int = 220) -> str:
    text = text.strip().replace("\n", " ")
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def split_sentences(text: str) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [part.strip() for part in parts if part.strip()]


def pick_example_snippet(item: dict[str, Any], category: str) -> str:
    compiled = [re.compile(pattern, re.I) for pattern in CATEGORY_PATTERNS.get(category, [])]
    entries = item["derived"]["entries"]
    for entry in entries:
        sentences = split_sentences(entry["text"])
        for sentence in sentences:
            if any(pattern.search(sentence) for pattern in compiled):
                return truncate(sentence, 240)
        if any(pattern.search(entry["text"]) for pattern in compiled):
            return truncate(entry["text"], 240)

    for entry in entries:
        if entry["signal"]:
            return truncate(entry["text"], 240)

    return "Minimal note trail; category inferred from the available update, reply, and activity-log evidence."


def infer_resolution(item: dict[str, Any]) -> str:
    entries = list(reversed(item["derived"]["entries"]))
    resolution_markers = [
        "accepted",
        "reassembled",
        "order",
        "under warranty",
        "out of warranty",
        "all good",
        "passed",
        "quote",
        "ready to collect",
        "returned",
        "shipped",
        "pickup",
    ]
    for entry in entries:
        lowered = entry["text"].lower()
        if any(marker in lowered for marker in resolution_markers):
            return truncate(entry["text"], 220)

    final_status = get_column_text(item, "status4") or "Unknown"
    repaired_date = get_column_text(item, item.get("source_date_column") or "")
    if repaired_date:
        return f"[Inference from final board status/date] ended `{final_status}`, dated `{repaired_date}`."
    return f"[Inference from final board status/date] ended `{final_status}`."


def item_sort_key(item: dict[str, Any]) -> tuple[int, int, str]:
    signal_entries = sum(1 for entry in item["derived"]["entries"] if entry["signal"])
    signal_chars = sum(len(entry["text"]) for entry in item["derived"]["entries"] if entry["signal"])
    date_value = get_column_text(item, item.get("source_date_column") or "")
    return (signal_entries, signal_chars, date_value)


def collect_team_members(entries: list[dict[str, Any]]) -> set[str]:
    members = set()
    for entry in entries:
        creator = entry.get("creator") or ""
        if creator:
            members.add(creator)
        for mention in extract_mentions(entry.get("text") or ""):
            members.add(mention)
    return members


def derive_item_data(items: list[dict[str, Any]]) -> None:
    for item in items:
        entries = extract_entries(item)
        signal_entries = [entry for entry in entries if entry["signal"]]
        signal_text = "\n\n".join(entry["text"] for entry in signal_entries)
        all_text = "\n\n".join(entry["text"] for entry in entries)
        columns_blob = "\n".join(
            value
            for value in [item.get("name") or ""] + [clean_text(column.get("text")) for column in item.get("column_values", [])]
            if value
        )
        transitions = parse_status_transitions(item.get("activity_logs") or [])
        transitions_blob = " | ".join(f"{transition['from']} -> {transition['to']}" for transition in transitions)
        categories = category_matches(signal_text or all_text, columns_blob, transitions_blob)
        item["derived"] = {
            "entries": entries,
            "signal_entries": signal_entries,
            "signal_text": signal_text,
            "all_text": all_text,
            "transitions": transitions,
            "transitions_blob": transitions_blob,
            "categories": categories,
            "team_members": sorted(collect_team_members(entries)),
        }


def build_frequency_counts(items: list[dict[str, Any]]) -> Counter[str]:
    counter: Counter[str] = Counter()
    for item in items:
        for category in item["derived"]["categories"]:
            counter[category] += 1
    return counter


def build_phrase_counts(items: list[dict[str, Any]]) -> list[tuple[str, int]]:
    counts = Counter()
    for item in items:
        haystack = (item["derived"]["signal_text"] or item["derived"]["all_text"]).lower()
        for phrase, pattern in PHRASE_PATTERNS.items():
            if re.search(pattern, haystack, re.I):
                counts[phrase] += 1
    return counts.most_common()


def top_team_members_by_category(items: list[dict[str, Any]]) -> dict[str, list[tuple[str, int]]]:
    mapping: dict[str, Counter[str]] = {category: Counter() for category in ISSUE_CATEGORIES}
    for item in items:
        members = item["derived"]["team_members"]
        if not members:
            continue
        for category in item["derived"]["categories"]:
            if category == "Normal flow":
                continue
            mapping[category].update(members)
    return {category: counter.most_common(5) for category, counter in mapping.items() if counter}


def category_examples(items: list[dict[str, Any]], category: str, limit: int = 3) -> list[dict[str, str]]:
    matching = [item for item in items if category in item["derived"]["categories"]]
    matching.sort(key=item_sort_key, reverse=True)
    examples = []
    for item in matching:
        examples.append(
            {
                "name": item["name"],
                "id": str(item["id"]),
                "what_happened": pick_example_snippet(item, category),
                "resolved": infer_resolution(item),
            }
        )
        if len(examples) == limit:
            break
    return examples


def recommendation_buckets(counts: Counter[str]) -> tuple[list[str], list[str], list[str]]:
    issue_counts = [(category, counts[category]) for category in ISSUE_CATEGORIES if counts[category] > 0]
    issue_counts.sort(key=lambda pair: pair[1], reverse=True)

    immediate = [category for category, count in issue_counts[:5]]
    systems = []
    for category in [
        "Parts delay",
        "Customer communication issue",
        "Handoff failure",
        "Data quality issue",
        "Client no-show / abandoned",
        "QC rejection",
    ]:
        if counts[category] > 0:
            systems.append(category)
    rare = [category for category, count in issue_counts if count <= 3]
    return immediate, systems, rare


def format_category_examples(items: list[dict[str, Any]], category: str) -> str:
    examples = category_examples(items, category, limit=3)
    if not examples:
        return "_No solid examples found in this slice._"
    lines = []
    for index, example in enumerate(examples, start=1):
        lines.append(f"{index}. `{example['name']}` (`{example['id']}`)")
        lines.append(f"- What happened: {example['what_happened']}")
        lines.append(f"- Resolution: {example['resolved']}")
    return "\n".join(lines)


def build_markdown_report(raw_data: dict[str, Any]) -> str:
    items = raw_data["items"]
    derive_item_data(items)
    counts = build_frequency_counts(items)
    phrases = build_phrase_counts(items)
    team_members = top_team_members_by_category(items)

    total_updates = sum(len(item.get("updates") or []) for item in items)
    total_replies = sum(len(update.get("replies") or []) for item in items for update in item.get("updates") or [])
    items_with_updates = sum(1 for item in items if item.get("updates"))
    items_with_replies = sum(1 for item in items if any(update.get("replies") for update in item.get("updates") or []))
    items_with_signal = sum(1 for item in items if item["derived"]["signal_entries"])
    total_activity_logs = sum(len(item.get("activity_logs") or []) for item in items)
    items_with_activity_logs = sum(1 for item in items if item.get("activity_logs"))
    by_board = Counter(item["board_name"] for item in items)

    frequency_rows = "\n".join(
        f"| {category} | {counts[category]} |" for category in CATEGORY_ORDER if counts[category] > 0
    )

    phrase_rows = "\n".join(
        f"| `{phrase}` | {count} |" for phrase, count in phrases[:12]
    )

    team_lines = []
    for category in ISSUE_CATEGORIES:
        members = team_members.get(category)
        if not members:
            continue
        rendered = ", ".join(f"`{name}` ({count})" for name, count in members[:5])
        team_lines.append(f"- **{category}:** {rendered}")

    edge_case_rows = []
    edge_index = 1
    for category in ISSUE_CATEGORIES:
        if counts[category] == 0:
            continue
        example = category_examples(items, category, limit=1)
        example_label = f"`{example[0]['name']}` (`{example[0]['id']}`)" if example else "n/a"
        current_handling = CURRENT_HANDLING[category].replace("|", "\\|")
        edge_case_rows.append(
            f"| {edge_index} | {category} | {counts[category]} | {current_handling} | {SOP_GAP[category]} | {example_label} |"
        )
        edge_index += 1

    immediate, systems, rare = recommendation_buckets(counts)

    sections = [
        "# Repair History Edge Case Mining",
        "",
        f"Raw source: `{RAW_OUTPUT}`",
        "",
        "## Phase 1: Sample And Categorise",
        "",
        "### Pull Summary",
        "",
        "- Pulled both requested board slices with cursor pagination, nested replies, and per-item activity logs.",
        f"- Main board `{BOARD_SPECS[0].board_id}` date filter: `{BOARD_SPECS[0].date_column_id}` between `{BOARD_SPECS[0].date_start}` and `{BOARD_SPECS[0].date_end}`.",
        f"- Archive board `{BOARD_SPECS[1].board_id}` date filter: `{BOARD_SPECS[1].date_column_id}` between `{BOARD_SPECS[1].date_start}` and `{BOARD_SPECS[1].date_end}`.",
        f"- Pagination delay used: `{PAGE_DELAY_SECONDS:.0f}` seconds between item pages.",
        f"- Activity-log throttle used: `{1 / ACTIVITY_DELAY_SECONDS:.2f}` items/sec max, which stays within the brief's 5 items/sec cap.",
        "",
        "### Dataset Shape",
        "",
        f"- Total completed repair items pulled: `{len(items)}`",
        f"- Main board items: `{by_board[BOARD_SPECS[0].board_name]}`",
        f"- Archive board items: `{by_board[BOARD_SPECS[1].board_name]}`",
        f"- Total updates pulled: `{total_updates}`",
        f"- Total replies pulled: `{total_replies}`",
        f"- Items with updates: `{items_with_updates}`",
        f"- Items with replies: `{items_with_replies}`",
        f"- Items with non-placeholder signal notes or replies: `{items_with_signal}`",
        f"- Total activity-log rows attached: `{total_activity_logs}`",
        f"- Items with activity logs: `{items_with_activity_logs}`",
        "",
        "### Categorisation Notes",
        "",
        "- Categories overlap. A single repair can appear in multiple issue buckets if the thread shows multiple failure modes.",
        "- `Normal flow` is reserved for items where the updates/replies/activity history do not show a clear issue pattern.",
        f"- {SOP_GAP_BASIS}",
        "",
        "### Category Frequency",
        "",
        "| Category | Item Count |",
        "|---|---:|",
        frequency_rows,
        "",
        "### Category Examples",
        "",
    ]

    for category in CATEGORY_ORDER:
        if counts[category] == 0:
            continue
        sections.extend(
            [
                f"#### {category}",
                "",
                format_category_examples(items, category),
                "",
            ]
        )

    sections.extend(
        [
            "## Phase 2: Pattern Extraction",
            "",
            "### Recurring Phrases",
            "",
            "| Phrase | Items |",
            "|---|---:|",
            phrase_rows or "| _None_ | 0 |",
            "",
            "### Team Members Most Associated With Each Issue Type",
            "",
            "\n".join(team_lines) if team_lines else "- No strong creator/mention patterns were extractable from the note history.",
            "",
            "## Phase 3: Edge Case Catalogue",
            "",
            "| # | Edge Case | Frequency | Current Handling | SOP Gap? | Example Item |",
            "|---|---|---:|---|---|---|",
            "\n".join(edge_case_rows),
            "",
            "## Phase 4: Recommendations",
            "",
            "### Put Into SOPs Immediately",
            "",
            "\n".join(f"- {category}" for category in immediate) if immediate else "- None identified.",
            "",
            "### Better Solved By Systems / Automation",
            "",
            "\n".join(f"- {category}" for category in systems) if systems else "- None identified.",
            "",
            "### Rare Enough For Ad-Hoc Handling",
            "",
            "\n".join(f"- {category}" for category in rare) if rare else "- No category landed in the rare bucket.",
            "",
        ]
    )

    return "\n".join(sections).rstrip() + "\n"


def build_raw_payload(items: list[dict[str, Any]]) -> dict[str, Any]:
    board_counts = Counter(item["board_name"] for item in items)
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": {
            "brief": "/home/ricky/builds/agent-rebuild/BRIEF-C14-REPAIR-HISTORY-MINING.md",
            "credentials_env": str(ENV_PATH),
            "api_url": MONDAY_API_URL,
            "page_limit": PAGE_LIMIT,
            "page_delay_seconds": PAGE_DELAY_SECONDS,
            "activity_delay_seconds": ACTIVITY_DELAY_SECONDS,
            "boards": [
                {
                    "board_id": spec.board_id,
                    "board_name": spec.board_name,
                    "date_column_id": spec.date_column_id,
                    "date_start": spec.date_start,
                    "date_end": spec.date_end,
                    "items_pulled": board_counts[spec.board_name],
                }
                for spec in BOARD_SPECS
            ],
        },
        "items": items,
    }


def verify_outputs(raw_data: dict[str, Any]) -> None:
    items = raw_data["items"]
    replies_count = sum(len(update.get("replies") or []) for item in items for update in item.get("updates") or [])
    activity_count = sum(len(item.get("activity_logs") or []) for item in items)
    if replies_count == 0:
        raise RuntimeError("Verification failed: raw output has zero replies.")
    if activity_count == 0:
        raise RuntimeError("Verification failed: raw output has zero activity logs.")
    if not RAW_OUTPUT.exists():
        raise RuntimeError(f"Verification failed: {RAW_OUTPUT} was not written.")
    if not ANALYSIS_OUTPUT.exists():
        raise RuntimeError(f"Verification failed: {ANALYSIS_OUTPUT} was not written.")


def main() -> int:
    token = load_monday_token()
    MONDAY_HEADERS["Authorization"] = token

    session = requests.Session()

    all_items: list[dict[str, Any]] = []
    for spec in BOARD_SPECS:
        board_items = fetch_board_items(session, spec)
        all_items.extend(board_items)
        if spec != BOARD_SPECS[-1]:
            time.sleep(PAGE_DELAY_SECONDS)

    fetch_activity_logs_for_items(session, all_items)

    raw_payload = build_raw_payload(all_items)
    RAW_OUTPUT.write_text(json.dumps(raw_payload, indent=2), encoding="utf-8")
    print(f"Wrote raw output to {RAW_OUTPUT}", flush=True)

    markdown = build_markdown_report(raw_payload)
    ANALYSIS_OUTPUT.write_text(markdown, encoding="utf-8")
    print(f"Wrote analysis output to {ANALYSIS_OUTPUT}", flush=True)

    verify_outputs(raw_payload)
    print("Verification passed: replies and activity logs are present in the raw output.", flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(130)
    except Exception as exc:  # pragma: no cover - operational script
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)
