#!/usr/bin/env python3
"""
Audit current BM listings against historical sales exports.

Goal: identify listings that are safe to trust because listing number, SKU,
and product identity agree across exports, while isolating the rows that still
need manual review or API probe verification.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, Iterable, List, Tuple


DEFAULT_SALES_CSV = Path("/home/ricky/builds/backmarket/docs/Backmarket Sales Data - Sheet1.csv")
DEFAULT_LISTINGS_CSV = Path("/home/ricky/builds/backmarket/docs/export_listings_57b75831-5e07-4f09-977b-1f216bc0f0a3.csv")
DEFAULT_CATALOG_JSON = Path("/home/ricky/builds/backmarket/data/bm-catalog.json")
DEFAULT_OUTPUT_JSON = Path("/home/ricky/builds/backmarket/data/vetted-listings-audit.json")
DEFAULT_OUTPUT_CSV = Path("/home/ricky/builds/backmarket/data/vetted-listings.csv")


GRADE_ALIASES = {
    "VGOOD": "VERYGOOD",
    "VERYGOOD": "VERYGOOD",
    "VERY_GOOD": "VERYGOOD",
    "EXCELLENT": "VERYGOOD",
    "GOOD": "GOOD",
    "FAIR": "FAIR",
    "STALLONE": "FAIR",
    "SHINY": "FAIR",
    "PREMIUM": "PREMIUM",
}

COLOUR_ALIASES = {
    "SPACEGREY": "GREY",
    "SPACEGRAY": "GREY",
    "GREY": "GREY",
    "GRAY": "GREY",
    "SPACEBLACK": "SPACEBLACK",
    "BLACK": "BLACK",
    "SILVER": "SILVER",
    "GOLD": "GOLD",
    "ROSEGOLD": "ROSEGOLD",
    "MIDNIGHT": "MIDNIGHT",
    "STARLIGHT": "STARLIGHT",
    "CHAMPAGNE": "CHAMPAGNE",
    "BLUE": "BLUE",
    "WHITE": "WHITE",
    "PINK": "PINK",
    "GREEN": "GREEN",
    "PURPLE": "PURPLE",
    "RED": "RED",
}


def load_csv(path: Path) -> List[Dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def load_catalog(path: Path) -> Dict[str, dict]:
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    return data.get("variants", {})


def normalize_sku(raw: str) -> str:
    sku = (raw or "").strip().upper()
    if not sku:
        return ""
    sku = re.sub(r"[\s\"']", "", sku)
    sku = sku.replace("-", ".")
    sku = re.sub(r"\.+", ".", sku).strip(".")
    parts = [p for p in sku.split(".") if p]
    normalized: List[str] = []
    for part in parts:
        part = COLOUR_ALIASES.get(part, part)
        part = GRADE_ALIASES.get(part, part)
        normalized.append(part)
    return ".".join(normalized)


def extract_grade(raw: str) -> str:
    norm = normalize_sku(raw)
    if not norm:
        return ""
    last = norm.split(".")[-1]
    return GRADE_ALIASES.get(last, last)


def extract_colour(raw: str) -> str:
    norm = normalize_sku(raw)
    parts = norm.split(".")
    for part in reversed(parts):
        if part in COLOUR_ALIASES.values():
            return part
    return ""


def sku_identity(raw: str) -> str:
    norm = normalize_sku(raw)
    if not norm:
        return ""
    parts = norm.split(".")
    if parts and parts[-1] in set(GRADE_ALIASES.values()):
        parts = parts[:-1]
    return ".".join(parts)


def classify_listing(
    listing_row: Dict[str, str],
    history_rows: List[Dict[str, str]],
    product_history_rows: List[Dict[str, str]],
    catalog: Dict[str, dict],
) -> Dict[str, object]:
    listing_no = (listing_row.get("Listing no.") or "").strip()
    export_sku = (listing_row.get("SKU") or "").strip()
    export_sku_norm = normalize_sku(export_sku)
    export_backmarket_id = (listing_row.get("Back Market ID") or "").strip()
    export_uuid = (listing_row.get("Product ID") or "").strip()

    sales_skus = sorted({(row.get("listing_sku") or "").strip() for row in history_rows if (row.get("listing_sku") or "").strip()})
    sales_skus_norm = sorted({normalize_sku(sku) for sku in sales_skus if sku})
    sales_product_ids = sorted({(row.get("product_id") or "").strip() for row in history_rows if (row.get("product_id") or "").strip()})
    lineage_skus = sorted({(row.get("listing_sku") or "").strip() for row in product_history_rows if (row.get("listing_sku") or "").strip()})
    lineage_skus_norm = sorted({normalize_sku(sku) for sku in lineage_skus if sku})
    lineage_identities = sorted({sku_identity(sku) for sku in lineage_skus if sku_identity(sku)})

    product_id_exact = bool(export_backmarket_id) and sales_product_ids == [export_backmarket_id]
    sku_exact = bool(export_sku) and sales_skus == [export_sku]
    sku_normalized = bool(export_sku_norm) and sales_skus_norm == [export_sku_norm]
    export_identity = sku_identity(export_sku)

    status = "needs_review"
    reasons: List[str] = []
    if not history_rows:
        status = "no_history"
        reasons.append("no sales history for listing number")
        if product_history_rows:
            if len(lineage_identities) == 1 and export_identity and export_identity == lineage_identities[0]:
                status = "vetted_product_lineage"
                reasons = ["no direct listing history; vetted by product lineage"]
            else:
                reasons.append(f"product lineage skus={lineage_skus}")
    elif product_id_exact and sku_exact:
        status = "vetted_exact"
    elif product_id_exact and sku_normalized:
        status = "vetted_normalized"
        reasons.append("sku differs only after normalization")
    else:
        if not product_id_exact:
            reasons.append(f"product_id history={sales_product_ids or ['']} export={export_backmarket_id}")
        if not sku_exact and not sku_normalized:
            reasons.append(f"sku history={sales_skus or ['']} export={export_sku}")
        elif not sku_exact and sku_normalized:
            reasons.append("sku string drift only")

    catalog_variant = catalog.get(export_uuid, {})
    catalog_colour = (catalog_variant.get("colour") or "").strip()
    export_colour = extract_colour(export_sku)
    if catalog_colour and export_colour:
        catalog_colour_norm = COLOUR_ALIASES.get(catalog_colour.replace(" ", "").upper(), catalog_colour.replace(" ", "").upper())
        if export_colour != catalog_colour_norm:
            reasons.append(f"catalog colour={catalog_colour} export sku colour={export_colour}")
            if status.startswith("vetted"):
                status = "needs_review"

    export_grade = extract_grade(export_sku)
    export_bm_grade = (listing_row.get("grade") or "").strip().upper()
    if export_grade and export_bm_grade:
        export_bm_grade = GRADE_ALIASES.get(export_bm_grade, export_bm_grade)
        if export_grade != export_bm_grade:
            reasons.append(f"export sku grade={export_grade} export grade={export_bm_grade}")
            if status.startswith("vetted"):
                status = "needs_review"

    return {
        "listing_no": listing_no,
        "status": status,
        "reason_count": len(reasons),
        "reasons": reasons,
        "history_count": len(history_rows),
        "product_history_count": len(product_history_rows),
        "export_uuid": export_uuid,
        "export_backmarket_id": export_backmarket_id,
        "export_sku": export_sku,
        "export_sku_normalized": export_sku_norm,
        "sales_skus": sales_skus,
        "sales_skus_normalized": sales_skus_norm,
        "sales_product_ids": sales_product_ids,
        "product_lineage_skus": lineage_skus,
        "product_lineage_skus_normalized": lineage_skus_norm,
        "product_lineage_identities": lineage_identities,
        "title": listing_row.get("Title") or "",
        "quantity": listing_row.get("Quantity") or "",
        "status_text": listing_row.get("Status") or "",
        "export_grade": listing_row.get("grade") or "",
        "catalog_colour": catalog_colour,
    }


def write_csv(path: Path, rows: Iterable[Dict[str, object]]) -> None:
    rows = list(rows)
    if not rows:
        return
    fieldnames = [
        "listing_no",
        "status",
        "history_count",
        "export_uuid",
        "export_backmarket_id",
        "export_sku",
        "title",
        "catalog_colour",
        "quantity",
        "status_text",
        "export_grade",
        "reasons",
    ]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            trimmed = {key: row.get(key, "") for key in fieldnames}
            trimmed["reasons"] = " | ".join(row.get("reasons", []))
            writer.writerow(trimmed)


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit BM listings against sales history.")
    parser.add_argument("--sales-csv", type=Path, default=DEFAULT_SALES_CSV)
    parser.add_argument("--listings-csv", type=Path, default=DEFAULT_LISTINGS_CSV)
    parser.add_argument("--catalog-json", type=Path, default=DEFAULT_CATALOG_JSON)
    parser.add_argument("--output-json", type=Path, default=DEFAULT_OUTPUT_JSON)
    parser.add_argument("--output-csv", type=Path, default=DEFAULT_OUTPUT_CSV)
    args = parser.parse_args()

    sales_rows = load_csv(args.sales_csv)
    listing_rows = load_csv(args.listings_csv)
    catalog = load_catalog(args.catalog_json)

    history_by_listing_no: Dict[str, List[Dict[str, str]]] = defaultdict(list)
    history_by_product_id: Dict[str, List[Dict[str, str]]] = defaultdict(list)
    for row in sales_rows:
        listing_no = (row.get("listing_id") or "").strip()
        if listing_no:
            history_by_listing_no[listing_no].append(row)
        product_id = (row.get("product_id") or "").strip()
        if product_id:
            history_by_product_id[product_id].append(row)

    audited = [
        classify_listing(
            row,
            history_by_listing_no.get((row.get("Listing no.") or "").strip(), []),
            history_by_product_id.get((row.get("Back Market ID") or "").strip(), []),
            catalog,
        )
        for row in listing_rows
    ]
    counts = Counter(row["status"] for row in audited)

    summary = {
        "sales_rows": len(sales_rows),
        "listing_rows": len(listing_rows),
        "distinct_historical_listing_numbers": len(history_by_listing_no),
        "status_counts": counts,
        "vetted_listing_numbers": [row["listing_no"] for row in audited if str(row["status"]).startswith("vetted")],
        "needs_review_examples": [row for row in audited if row["status"] == "needs_review"][:50],
    }

    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    with args.output_json.open("w", encoding="utf-8") as handle:
        json.dump({"summary": summary, "listings": audited}, handle, indent=2)

    write_csv(args.output_csv, [row for row in audited if str(row["status"]).startswith("vetted")])

    print(json.dumps(summary, indent=2, default=list))
    print(f"\nWrote JSON: {args.output_json}")
    print(f"Wrote vetted CSV: {args.output_csv}")


if __name__ == "__main__":
    main()
