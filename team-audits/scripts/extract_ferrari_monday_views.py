#!/usr/bin/env python3
"""Derive focused Ferrari Monday views from the raw export.

Outputs:
- ferrari_monday_written_<from>_to_<to>.json
- ferrari_monday_mentions_<from>_to_<to>.json
- ferrari_monday_patterns_<from>_to_<to>.json
"""

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

RAW_PATH = Path("/home/ricky/builds/team-audits/reports/ferrari/ferrari_monday_raw_2025-10-25_to_2026-04-23.json")
OUT_DIR = RAW_PATH.parent
FERRARI_USER_ID = "55780786"
MENTION_RE = re.compile(r"@Michael Ferrari|@Michael|@Ferrari", re.I)
TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z0-9_\-/']+")

PATTERN_RULES = {
    "quote_or_price": ["quote", "quoted", "pricing", "price", "cost", "refund"],
    "customer_update": ["customer", "called", "emailed", "updated", "confirmed", "accepted", "declined"],
    "routing_or_assignment": ["please", "assign", "book", "check", "complete", "send to", "pass to", "tag"],
    "payment_or_invoice": ["pay", "paid", "payment", "invoice", "refund"],
    "diagnostic_or_repair_decision": ["diagnostic", "repairable", "repair", "liquid", "board", "screen"],
    "logistics_or_collection": ["collect", "collection", "delivery", "ship", "shipped", "courier"],
    "parts_or_stock": ["part", "parts", "stock", "ordered", "order", "awaiting part"],
}


def load():
    with open(RAW_PATH) as f:
        return json.load(f)


def item_context(item):
    return {
        "item_id": item.get("id"),
        "item_name": item.get("name"),
        "board_id": item.get("board", {}).get("id"),
        "board_name": item.get("board", {}).get("name"),
        "group": item.get("group", {}).get("title"),
    }


def normalize_text(text):
    return (text or "").replace("\n", " ").strip()


def classify(text):
    tl = text.lower()
    matched = []
    for label, needles in PATTERN_RULES.items():
        if any(n in tl for n in needles):
            matched.append(label)
    return matched or ["uncategorized"]


def top_terms(texts, limit=100):
    stop = {
        "the","and","for","that","this","with","you","are","was","have","has","please","just",
        "from","they","them","your","will","not","can","but","all","his","her","our","their",
        "its","then","than","out","too","into","been","had","she","him","who","what","when",
        "where","why","how","get","got","did","does","done","now","need","needs","still","only",
        "there","here","because","about","also","after","before","would","could","should","today",
        "tomorrow","monday","ferrari","michael","item","reply","update"
    }
    c = Counter()
    for text in texts:
        for tok in TOKEN_RE.findall(text.lower()):
            if len(tok) < 3 or tok in stop:
                continue
            c[tok] += 1
    return c.most_common(limit)


def main():
    raw = load()
    from_date = raw.get("from_date")
    to_date = raw.get("to_date")
    items = raw.get("items", {})

    written = []
    mentions = []
    pattern_examples = defaultdict(list)
    pattern_counts = Counter()
    board_counts = Counter()
    all_written_texts = []

    for item in items.values():
        ctx = item_context(item)
        for upd in item.get("updates", []):
            upd_text = normalize_text(upd.get("text_body") or upd.get("body"))
            upd_row = {
                **ctx,
                "level": "update",
                "message_id": upd.get("id"),
                "created_at": upd.get("created_at"),
                "creator_id": str(upd.get("creator_id", "")),
                "is_ferrari": bool(upd.get("is_ferrari_update")),
                "text": upd_text,
            }
            if upd_row["is_ferrari"]:
                labels = classify(upd_text)
                upd_row["pattern_labels"] = labels
                written.append(upd_row)
                all_written_texts.append(upd_text)
                board_counts[ctx["board_name"]] += 1
                for label in labels:
                    pattern_counts[label] += 1
                    if len(pattern_examples[label]) < 25:
                        pattern_examples[label].append(upd_row)
            elif MENTION_RE.search(upd_text):
                mentions.append(upd_row)

            for rep in upd.get("replies", []):
                rep_text = normalize_text(rep.get("text_body") or rep.get("body"))
                rep_row = {
                    **ctx,
                    "level": "reply",
                    "parent_update_id": upd.get("id"),
                    "message_id": rep.get("id"),
                    "created_at": rep.get("created_at"),
                    "creator_id": str(rep.get("creator_id", "")),
                    "is_ferrari": bool(rep.get("is_ferrari_reply")),
                    "text": rep_text,
                }
                if rep_row["is_ferrari"]:
                    labels = classify(rep_text)
                    rep_row["pattern_labels"] = labels
                    written.append(rep_row)
                    all_written_texts.append(rep_text)
                    board_counts[ctx["board_name"]] += 1
                    for label in labels:
                        pattern_counts[label] += 1
                        if len(pattern_examples[label]) < 25:
                            pattern_examples[label].append(rep_row)
                elif MENTION_RE.search(rep_text):
                    mentions.append(rep_row)

    written_payload = {
        "source": str(RAW_PATH),
        "from_date": from_date,
        "to_date": to_date,
        "count": len(written),
        "by_board": dict(board_counts),
        "records": written,
    }
    mentions_payload = {
        "source": str(RAW_PATH),
        "from_date": from_date,
        "to_date": to_date,
        "count": len(mentions),
        "records": mentions,
    }
    patterns_payload = {
        "source": str(RAW_PATH),
        "from_date": from_date,
        "to_date": to_date,
        "pattern_counts": dict(pattern_counts.most_common()),
        "top_terms": top_terms(all_written_texts, 150),
        "examples": dict(pattern_examples),
    }

    written_path = OUT_DIR / f"ferrari_monday_written_{from_date}_to_{to_date}.json"
    mentions_path = OUT_DIR / f"ferrari_monday_mentions_{from_date}_to_{to_date}.json"
    patterns_path = OUT_DIR / f"ferrari_monday_patterns_{from_date}_to_{to_date}.json"

    with open(written_path, "w") as f:
        json.dump(written_payload, f, indent=2)
    with open(mentions_path, "w") as f:
        json.dump(mentions_payload, f, indent=2)
    with open(patterns_path, "w") as f:
        json.dump(patterns_payload, f, indent=2)

    print(json.dumps({
        "written_path": str(written_path),
        "mentions_path": str(mentions_path),
        "patterns_path": str(patterns_path),
        "written_count": len(written),
        "mentions_count": len(mentions),
        "top_patterns": pattern_counts.most_common(10),
    }, indent=2))


if __name__ == "__main__":
    main()
