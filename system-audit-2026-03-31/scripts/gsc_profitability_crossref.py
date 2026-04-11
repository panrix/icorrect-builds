#!/usr/bin/env python3
from __future__ import annotations

import math
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlparse

import requests


WORKDIR = Path("/home/ricky/builds/system-audit-2026-03-31")
ENV_PATH = Path("/home/ricky/config/api-keys/.env")
PROFITABILITY_PATH = WORKDIR / "repair-profitability-v2.md"
OUTPUT_PATH = WORKDIR / "gsc-profitability-crossref-v2.md"
V1_OUTPUT_PATH = WORKDIR / "gsc-profitability-crossref.md"

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GSC_URL_TMPL = "https://www.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query"
SITE_PROPERTY = "sc-domain:icorrect.co.uk"

REPAIR_INTENT_KEYWORDS = [
    "repair",
    "screen",
    "battery",
    "replacement",
    "broken",
    "glass",
    "display",
    "charging",
    "keyboard",
    "camera",
    "diagnostic",
    "fix",
    "cracked",
    "water damage",
    "backlight",
    "flexgate",
    "dustgate",
    "port",
    "speaker",
    "microphone",
    "housing",
    "lens",
    "button",
    "crown",
    "logic board",
    "no power",
    "no service",
    "wifi",
    "activate",
    "refurb",
    "macbook",
    "iphone",
    "ipad",
    "apple watch",
    "ipod",
]
REPAIR_INTENT_REGEX = "(" + "|".join(
    re.escape(keyword).replace("\\ ", r"\s+")
    for keyword in sorted(REPAIR_INTENT_KEYWORDS, key=len, reverse=True)
) + ")"
PRIMARY_REPAIR_SIGNALS = {
    normalize_keyword
    for normalize_keyword in [
        "repair",
        "screen",
        "battery",
        "replacement",
        "broken",
        "glass",
        "display",
        "charging",
        "keyboard",
        "camera",
        "diagnostic",
        "fix",
        "cracked",
        "water damage",
        "backlight",
        "flexgate",
        "dustgate",
        "port",
        "speaker",
        "microphone",
        "housing",
        "lens",
        "button",
        "crown",
        "logic board",
        "no power",
        "no service",
        "wifi",
        "activate",
        "refurb",
    ]
}
DEVICE_FAMILY_KEYWORDS = {normalize_keyword for normalize_keyword in ["macbook", "iphone", "ipad", "apple watch", "ipod"]}
COMMERCIAL_MODIFIER_KEYWORDS = {normalize_keyword for normalize_keyword in ["london", "near me", "uk", "cost", "price"]}
FAMILY_PRODUCT_INDEX: dict[str, list["ProductRow"]] = {}
MATCH_CACHE: dict[tuple[str, str], "MatchResult"] = {}

TOKEN_RE = re.compile(r"[a-z0-9]+")
MODEL_CODE_RE = re.compile(r"^a\d{4}$", re.I)
SECTION_RE_TMPL = r"^## {title}\n(.*?)(?=^## |\Z)"

STOPWORDS = {
    "repair",
    "repairs",
    "replacement",
    "replace",
    "screen",
    "battery",
    "broken",
    "fix",
    "fixed",
    "glass",
    "display",
    "lcd",
    "oled",
    "digitizer",
    "charging",
    "charger",
    "charge",
    "port",
    "camera",
    "speaker",
    "microphone",
    "mic",
    "water",
    "damage",
    "back",
    "rear",
    "front",
    "diagnostic",
    "service",
    "services",
    "london",
    "near",
    "me",
    "cost",
    "price",
    "prices",
    "cheap",
    "best",
    "shop",
    "same",
    "day",
    "mail",
    "in",
    "replacement",
    "fixing",
    "cracked",
    "broken",
    "apple",
    "uk",
    "icorrect",
    "co",
}

GENERIC_DEVICE_TOKENS = {
    "apple",
    "iphone",
    "ipad",
    "macbook",
    "watch",
    "applewatch",
    "imac",
    "mac",
    "pro",
    "max",
    "mini",
    "plus",
    "air",
    "series",
}
VARIANT_TOKENS = {"mini", "plus", "pro", "max", "ultra", "air", "se"}

QUERY_KIND_ORDER = [
    ("water damage", "water damage"),
    ("backlight", "backlight"),
    ("flexgate", "flexgate"),
    ("dustgate", "dustgate"),
    ("no service", "no service"),
    ("no wifi", "no wifi"),
    ("unable to activate", "unable to activate"),
    ("activate", "unable to activate"),
    ("no power", "no power"),
    ("logic board", "logic board"),
    ("rear housing", "rear housing"),
    ("housing", "rear housing"),
    ("back repair", "rear housing"),
    ("back replacement", "rear housing"),
    ("back glass", "rear glass"),
    ("rear glass", "rear glass"),
    ("charge port", "charging port"),
    ("charging port", "charging port"),
    ("charging", "charging port"),
    ("port", "charging port"),
    ("rear camera lens", "camera lens"),
    ("camera lens", "camera lens"),
    ("lens", "camera lens"),
    ("front camera", "front camera"),
    ("rear camera", "rear camera"),
    ("camera", "camera"),
    ("earpiece", "speaker"),
    ("loudspeaker", "speaker"),
    ("speaker", "speaker"),
    ("microphone", "microphone"),
    ("mic", "microphone"),
    ("keyboard", "keyboard"),
    ("trackpad", "trackpad"),
    ("power button", "button"),
    ("volume button", "button"),
    ("button", "button"),
    ("crown", "crown"),
    ("battery", "battery"),
    ("display", "screen"),
    ("screen", "screen"),
    ("glass", "screen"),
    ("cracked", "screen"),
    ("broken", "screen"),
    ("diagnostic", "diagnostic"),
    ("refurb", "refurb"),
    ("fix", "general repair"),
    ("repair", "general repair"),
    ("replacement", "general repair"),
]


@dataclass
class ProductRow:
    row_id: str
    device: str
    product: str
    price: float | None
    net_profit: float | None
    net_margin_pct: float | None
    shopify_listed: bool
    flag: str
    family: str
    repair_kind: str
    label: str
    tokens: set[str]
    specific_tokens: set[str]


@dataclass
class AggregateTarget:
    target_id: str
    label: str
    family: str
    repair_kind: str
    member_ids: list[str]
    member_labels: list[str]
    net_profit: float | None
    net_margin_pct: float | None
    shopify_status: str


@dataclass
class MissingShopifyRow:
    device_model: str
    missing_skus: int
    example_products: list[str]


@dataclass
class MatchResult:
    target_type: str
    target_id: str | None
    reason: str


@dataclass
class TargetMetrics:
    clicks_90d: float = 0.0
    impressions_90d: float = 0.0
    pos_weighted_sum_90d: float = 0.0
    current_clicks_30d: float = 0.0
    prior_clicks_30d: float = 0.0
    current_impressions_30d: float = 0.0
    prior_impressions_30d: float = 0.0
    top_queries: Counter[str] = field(default_factory=Counter)
    top_pages: Counter[str] = field(default_factory=Counter)

    @property
    def avg_position_90d(self) -> float | None:
        if self.impressions_90d <= 0:
            return None
        return self.pos_weighted_sum_90d / self.impressions_90d


def parse_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip("'").strip('"')
    return env


def normalize(text: str) -> str:
    text = text.lower().replace("&", " and ")
    text = text.replace("wi-fi", "wifi")
    return " ".join(TOKEN_RE.findall(text))


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
    text = re.sub(r"[^0-9.\-]", "", text)
    if not text or text in {"-", ".", "-."}:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def money(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    return f"GBP {value:,.2f}"


def pct(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    return f"{value:.1f}%"


def num(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    if abs(value - round(value)) < 0.05:
        return str(int(round(value)))
    return f"{value:.1f}"


def delta_num(value: float | None) -> str:
    if value is None or math.isnan(value):
        return "n/a"
    sign = "+" if value > 0 else ""
    if abs(value - round(value)) < 0.05:
        return f"{sign}{int(round(value))}"
    return f"{sign}{value:.1f}"


def escape_md(text: str) -> str:
    return str(text).replace("|", "\\|")


def section_block(markdown: str, title: str) -> str:
    pattern = re.compile(SECTION_RE_TMPL.format(title=re.escape(title)), re.M | re.S)
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
        values = [cell.strip() for cell in stripped.strip().strip("|").split("|")]
        if len(values) != len(header):
            continue
        rows.append(dict(zip(header, values)))
    return rows


def device_family(text: str) -> str:
    t = normalize(text)
    if "apple watch" in text.lower() or ("apple" in t.split() and "watch" in t.split()) or "iwatch" in t:
        return "Apple Watch"
    if "iphone" in t:
        return "iPhone"
    if "ipad" in t:
        return "iPad"
    if "macbook" in t:
        return "MacBook"
    if "imac" in t:
        return "iMac"
    if "mac" in t:
        return "Mac"
    return "Other"


def classify_repair_kind(text: str) -> str:
    lower = text.lower().replace("wi-fi", "wifi")
    for needle, kind in QUERY_KIND_ORDER:
        if needle in lower:
            return kind
    return "other"


def compatible_kind(query_kind: str, target_kind: str) -> bool:
    if query_kind == target_kind:
        return True
    compat = {
        "camera": {"camera", "front camera", "rear camera", "camera lens"},
        "logic board": {"logic board", "no service", "no wifi", "unable to activate", "no power"},
        "screen": {"screen"},
        "button": {"button"},
        "general repair": set(),
        "other": set(),
    }
    if query_kind in compat and target_kind in compat[query_kind]:
        return True
    if query_kind in {"general repair", "other"}:
        return False
    return False


def related_repair_signal(query_kind: str, target_kind: str) -> bool:
    if compatible_kind(query_kind, target_kind):
        return True
    if query_kind == target_kind:
        return True
    if target_kind in {"rear housing", "rear glass"} and query_kind in {"rear housing", "rear glass"}:
        return True
    if target_kind in {"logic board", "no service", "no wifi", "unable to activate", "no power"} and query_kind in {
        "logic board",
        "no service",
        "no wifi",
        "unable to activate",
        "no power",
    }:
        return True
    return False


def specific_tokens(text: str) -> set[str]:
    return {
        token
        for token in tokenize(text)
        if token not in STOPWORDS and token not in GENERIC_DEVICE_TOKENS and len(token) > 1
    }


def slug_text(url: str) -> str:
    if not url:
        return ""
    parsed = urlparse(url)
    pieces = [parsed.netloc, parsed.path.replace("/", " "), parsed.query.replace("=", " ")]
    return " ".join(piece.replace("-", " ") for piece in pieces if piece)


def family_required_tokens(family: str) -> set[str]:
    return {
        "iPhone": {"iphone"},
        "iPad": {"ipad"},
        "MacBook": {"macbook"},
        "Apple Watch": {"watch"},
        "iMac": {"imac"},
        "Mac": {"mac"},
    }.get(family, set())


def is_repair_query(query: str) -> bool:
    normalized = normalize(query)
    hits = {normalize(keyword) for keyword in REPAIR_INTENT_KEYWORDS if normalize(keyword) in normalized}
    if hits & PRIMARY_REPAIR_SIGNALS:
        return True
    if (hits & DEVICE_FAMILY_KEYWORDS) and (hits & COMMERCIAL_MODIFIER_KEYWORDS):
        return True
    return False


def is_brand_generic(query: str, family: str, query_kind: str, query_specific: set[str]) -> bool:
    if family == "Other":
        return True
    if query_specific:
        return False
    if query_kind in {"general repair", "other"}:
        return True
    return False


def query_mentions_device_model(query: str, device_model: str) -> bool:
    qnorm = normalize(query)
    qtokens = tokenize(query)
    mnorm = normalize(device_model)
    mtokens = tokenize(device_model)
    family = device_family(device_model)

    if family_required_tokens(family) and not family_required_tokens(family).issubset(qtokens):
        return False

    family_tokens = family_required_tokens(family)
    model_numeric_tokens = {token for token in mtokens if MODEL_CODE_RE.fullmatch(token) or any(ch.isdigit() for ch in token)}
    model_variants = mtokens & VARIANT_TOKENS
    model_id_tokens = {
        token
        for token in mtokens
        if token not in family_tokens
        and token not in STOPWORDS
        and token not in VARIANT_TOKENS
        and token not in GENERIC_DEVICE_TOKENS
        and not any(ch.isdigit() for ch in token)
    }
    query_variants = qtokens & VARIANT_TOKENS

    if not model_variants and query_variants & {"mini", "plus", "pro", "max", "ultra"}:
        return False
    if model_numeric_tokens and not model_numeric_tokens.issubset(qtokens):
        return False
    if model_variants and not model_variants.issubset(query_variants):
        return False
    if model_id_tokens and not model_id_tokens.issubset(qtokens):
        return False
    if mnorm and mnorm in qnorm:
        return True

    required = family_tokens | model_numeric_tokens | model_variants | model_id_tokens
    if required and required.issubset(qtokens):
        return True
    return False


def load_google_access_token(env: dict[str, str]) -> str:
    refresh_token = env.get("EDGE_GOOGLE_REFRESH_TOKEN")
    if not refresh_token:
        raise RuntimeError("Missing `EDGE_GOOGLE_REFRESH_TOKEN` in /home/ricky/config/api-keys/.env")
    response = requests.post(
        GOOGLE_TOKEN_URL,
        data={
            "client_id": env["GOOGLE_CLIENT_ID"],
            "client_secret": env["GOOGLE_CLIENT_SECRET"],
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        },
        timeout=60,
    )
    response.raise_for_status()
    payload = response.json()
    if "access_token" not in payload:
        raise RuntimeError(f"Google token exchange failed: {payload}")
    return payload["access_token"]


def gsc_request(access_token: str, site_url: str, payload: dict[str, Any]) -> dict[str, Any]:
    url = GSC_URL_TMPL.format(site=quote(site_url, safe=""))
    response = requests.post(
        url,
        headers={"Authorization": f"Bearer {access_token}"},
        json=payload,
        timeout=180,
    )
    if response.status_code >= 400:
        raise requests.HTTPError(f"{response.status_code} {response.text}", response=response)
    return response.json()


def gsc_fetch_all_rows(
    access_token: str,
    site_url: str,
    start_date: str,
    end_date: str,
    dimensions: list[str],
    dimension_filter_groups: list[dict[str, Any]] | None = None,
    row_limit: int = 25000,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    start_row = 0
    while True:
        payload = {
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": dimensions,
            "rowLimit": row_limit,
            "startRow": start_row,
        }
        if dimension_filter_groups:
            payload["dimensionFilterGroups"] = dimension_filter_groups
        data = gsc_request(access_token, site_url, payload)
        batch = data.get("rows", [])
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < row_limit:
            break
        start_row += row_limit
    return rows


def merge_gsc_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    merged: dict[tuple[str, ...], dict[str, Any]] = {}
    for row in rows:
        keys = tuple(str(key) for key in row.get("keys", []))
        if not keys:
            continue
        existing = merged.get(keys)
        if existing is None:
            merged[keys] = row
            continue
        current_score = (float(row.get("clicks", 0) or 0.0), float(row.get("impressions", 0) or 0.0))
        existing_score = (float(existing.get("clicks", 0) or 0.0), float(existing.get("impressions", 0) or 0.0))
        if current_score > existing_score:
            merged[keys] = row
    return list(merged.values())


def gsc_fetch_repair_rows(
    access_token: str,
    site_url: str,
    start_date: str,
    end_date: str,
    dimensions: list[str],
) -> list[dict[str, Any]]:
    filter_group = [
        {
            "filters": [
                {
                    "dimension": "query",
                    "operator": "includingRegex",
                    "expression": REPAIR_INTENT_REGEX,
                }
            ]
        }
    ]
    return gsc_fetch_all_rows(
        access_token,
        site_url,
        start_date,
        end_date,
        dimensions,
        dimension_filter_groups=filter_group,
    )


def choose_site_property(access_token: str, probe_start: str, probe_end: str) -> tuple[str, str | None]:
    try:
        gsc_fetch_all_rows(access_token, SITE_PROPERTY, probe_start, probe_end, ["query"], row_limit=1)
    except Exception as exc:  # pragma: no cover - live API probe only
        raise RuntimeError(
            f"`{SITE_PROPERTY}` was not accessible with `EDGE_GOOGLE_REFRESH_TOKEN`; no fallback was attempted. "
            f"API error: {exc}"
        ) from exc
    return SITE_PROPERTY, None


def parse_profitability_rows(path: Path) -> tuple[list[ProductRow], list[MissingShopifyRow]]:
    markdown = path.read_text(encoding="utf-8")
    section3 = section_block(markdown, "Section 3: Ranked Product Profitability")
    section4 = section_block(markdown, "Section 4: Missing From Shopify")
    product_rows = []
    for idx, row in enumerate(parse_markdown_table(section3), start=1):
        device = row.get("Device", "").strip()
        product = row.get("Product", "").strip()
        label = product or f"{device} product".strip()
        product_rows.append(
            ProductRow(
                row_id=f"product-{idx}",
                device=device,
                product=product,
                price=parse_float(row.get("Price (inc VAT)")),
                net_profit=parse_float(row.get("Net Profit")),
                net_margin_pct=parse_float(row.get("Net Margin %")),
                shopify_listed=(row.get("Shopify Listed", "").strip().lower() == "yes"),
                flag=row.get("Flag", "").strip(),
                family=device_family(f"{device} {product}"),
                repair_kind=classify_repair_kind(f"{device} {product}"),
                label=label,
                tokens=tokenize(f"{device} {product}"),
                specific_tokens=specific_tokens(f"{device} {product}"),
            )
        )
    missing_rows = []
    for row in parse_markdown_table(section4):
        examples = [value.strip() for value in row.get("Example Monday products", "").split(",") if value.strip()]
        missing_rows.append(
            MissingShopifyRow(
                device_model=row.get("Device model", "").strip(),
                missing_skus=int(parse_float(row.get("Missing SKUs")) or 0),
                example_products=examples,
            )
        )
    return product_rows, missing_rows


def build_aggregate_targets(products: list[ProductRow]) -> dict[str, AggregateTarget]:
    by_key: dict[tuple[str, str], list[ProductRow]] = defaultdict(list)
    for product in products:
        if product.family == "Other" or product.repair_kind in {"other", "general repair"}:
            continue
        by_key[(product.family, product.repair_kind)].append(product)

    targets: dict[str, AggregateTarget] = {}
    for (family, repair_kind), members in by_key.items():
        if len(members) < 2:
            continue
        margins = [member.net_margin_pct for member in members if member.net_margin_pct is not None]
        profits = [member.net_profit for member in members if member.net_profit is not None]
        listed_count = sum(1 for member in members if member.shopify_listed)
        if listed_count == len(members):
            shopify_status = "Yes"
        elif listed_count == 0:
            shopify_status = "No"
        else:
            shopify_status = f"Partial ({listed_count}/{len(members)})"
        pretty_kind = repair_kind.title()
        target_id = f"aggregate::{family.lower()}::{repair_kind}"
        targets[target_id] = AggregateTarget(
            target_id=target_id,
            label=f"{family} {pretty_kind} (aggregate)",
            family=family,
            repair_kind=repair_kind,
            member_ids=[member.row_id for member in members],
            member_labels=[member.label for member in members],
            net_profit=(sum(profits) / len(profits)) if profits else None,
            net_margin_pct=(sum(margins) / len(margins)) if margins else None,
            shopify_status=shopify_status,
        )
    return targets


def build_family_product_index(products: list[ProductRow]) -> dict[str, list[ProductRow]]:
    grouped: dict[str, list[ProductRow]] = defaultdict(list)
    for product in products:
        grouped[product.family].append(product)
    return grouped


def score_exact_product_match(query: str, page: str, product: ProductRow) -> int:
    query_norm = normalize(query)
    query_tokens = tokenize(query)
    page_tokens = tokenize(slug_text(page))
    query_specific = specific_tokens(query)
    page_specific = specific_tokens(slug_text(page))
    target_kind = product.repair_kind
    query_kind = classify_repair_kind(query)
    query_family = device_family(f"{query} {slug_text(page)}")

    if query_family != "Other" and product.family != query_family:
        return -1
    if query_kind not in {"other", "general repair"} and not compatible_kind(query_kind, target_kind):
        return -1

    combined_specific = query_specific | page_specific
    product_specific_overlap = product.specific_tokens & combined_specific
    if query_specific and not product_specific_overlap:
        return -1

    score = 0
    label_norm = normalize(product.label)
    device_norm = normalize(product.device)
    product_norm = normalize(product.product)

    if label_norm and label_norm in query_norm:
        score += 30
    elif product_norm and product_norm in query_norm:
        score += 20
    elif device_norm and device_norm in query_norm:
        score += 8

    overlap = product.tokens & query_tokens
    for token in overlap:
        if token in product.specific_tokens:
            score += 8 if MODEL_CODE_RE.fullmatch(token) or any(ch.isdigit() for ch in token) else 5
        else:
            score += 1

    page_overlap = product.tokens & page_tokens
    for token in page_overlap:
        if token in product.specific_tokens:
            score += 5 if MODEL_CODE_RE.fullmatch(token) or any(ch.isdigit() for ch in token) else 3
        else:
            score += 1

    for token in product_specific_overlap:
        if MODEL_CODE_RE.fullmatch(token) or any(ch.isdigit() for ch in token):
            score += 10
        else:
            score += 4

    if query_kind == target_kind and query_kind not in {"other", "general repair"}:
        score += 10
    elif compatible_kind(query_kind, target_kind):
        score += 5

    if page and normalize(product.device).replace(" ", "-") in page.lower():
        score += 2

    return score


def choose_aggregate_target(
    query: str,
    page: str,
    aggregate_targets: dict[str, AggregateTarget],
) -> AggregateTarget | None:
    query_kind = classify_repair_kind(query)
    family = device_family(f"{query} {slug_text(page)}")
    if family == "Other" or query_kind in {"other", "general repair"}:
        return None
    if specific_tokens(query):
        return None
    target_id = f"aggregate::{family.lower()}::{query_kind}"
    return aggregate_targets.get(target_id)


def match_query_page(
    query: str,
    page: str,
    products: list[ProductRow],
    aggregate_targets: dict[str, AggregateTarget],
) -> MatchResult:
    cache_key = (query, page)
    cached = MATCH_CACHE.get(cache_key)
    if cached is not None:
        return cached

    family = device_family(f"{query} {slug_text(page)}")
    query_kind = classify_repair_kind(query)
    query_specific = specific_tokens(query)
    combined_specific = query_specific | specific_tokens(slug_text(page))

    if is_brand_generic(query, family, query_kind, query_specific):
        result = MatchResult(target_type="unmatched", target_id=None, reason="brand-generic")
        MATCH_CACHE[cache_key] = result
        return result

    candidate_products = FAMILY_PRODUCT_INDEX.get(family, products) if family != "Other" else products
    if query_kind not in {"other", "general repair"}:
        filtered = [product for product in candidate_products if compatible_kind(query_kind, product.repair_kind)]
        if filtered:
            candidate_products = filtered
    if combined_specific:
        filtered = [product for product in candidate_products if product.specific_tokens & combined_specific]
        if filtered:
            candidate_products = filtered

    candidates: list[tuple[int, ProductRow]] = []
    for product in candidate_products:
        score = score_exact_product_match(query, page, product)
        if score > 0:
            candidates.append((score, product))
    candidates.sort(key=lambda item: (item[0], item[1].price or 0.0), reverse=True)

    if candidates:
        best_score, best = candidates[0]
        second_score = candidates[1][0] if len(candidates) > 1 else -999
        if best_score >= 18 and (second_score <= 0 or best_score - second_score >= 4):
            result = MatchResult(target_type="product", target_id=best.row_id, reason="exact")
            MATCH_CACHE[cache_key] = result
            return result

    aggregate = choose_aggregate_target(query, page, aggregate_targets)
    if aggregate:
        result = MatchResult(target_type="aggregate", target_id=aggregate.target_id, reason="family-aggregate")
        MATCH_CACHE[cache_key] = result
        return result

    if candidates:
        result = MatchResult(target_type="unmatched", target_id=None, reason="ambiguous")
        MATCH_CACHE[cache_key] = result
        return result
    result = MatchResult(target_type="unmatched", target_id=None, reason="no-match")
    MATCH_CACHE[cache_key] = result
    return result


def aggregate_query_page_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str], dict[str, Any]] = {}
    for row in rows:
        query, page = row.get("keys", ["", ""])
        key = (query or "", page or "")
        entry = grouped.setdefault(
            key,
            {
                "query": query or "",
                "page": page or "",
                "clicks": 0.0,
                "impressions": 0.0,
                "pos_weighted_sum": 0.0,
            },
        )
        clicks = float(row.get("clicks", 0) or 0.0)
        impressions = float(row.get("impressions", 0) or 0.0)
        position = float(row.get("position", 0) or 0.0)
        entry["clicks"] += clicks
        entry["impressions"] += impressions
        entry["pos_weighted_sum"] += position * impressions
    final_rows = []
    for entry in grouped.values():
        impressions = entry["impressions"]
        final_rows.append(
            {
                "query": entry["query"],
                "page": entry["page"],
                "clicks": entry["clicks"],
                "impressions": impressions,
                "position": (entry["pos_weighted_sum"] / impressions) if impressions > 0 else None,
            }
        )
    final_rows.sort(key=lambda row: (-row["clicks"], -row["impressions"], row["query"], row["page"]))
    return final_rows


def aggregate_query_dimension_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, Any]] = {}
    for row in rows:
        keys = row.get("keys", [])
        if not keys:
            continue
        query = keys[0] or ""
        entry = grouped.setdefault(
            query,
            {
                "query": query,
                "clicks": 0.0,
                "impressions": 0.0,
                "pos_weighted_sum": 0.0,
            },
        )
        clicks = float(row.get("clicks", 0) or 0.0)
        impressions = float(row.get("impressions", 0) or 0.0)
        position = float(row.get("position", 0) or 0.0)
        entry["clicks"] += clicks
        entry["impressions"] += impressions
        entry["pos_weighted_sum"] += position * impressions

    final_rows = []
    for entry in grouped.values():
        impressions = entry["impressions"]
        final_rows.append(
            {
                "query": entry["query"],
                "clicks": entry["clicks"],
                "impressions": impressions,
                "position": (entry["pos_weighted_sum"] / impressions) if impressions > 0 else None,
            }
        )
    final_rows.sort(key=lambda row: (-row["clicks"], -row["impressions"], row["query"]))
    return final_rows


def group_query_page_rows_by_query(rows: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        grouped[row["query"]].append(row)
    for query_rows in grouped.values():
        query_rows.sort(key=lambda row: (-row["clicks"], -row["impressions"], row["page"]))
    return grouped


def resolve_query_match(
    query: str,
    page_rows: list[dict[str, Any]],
    products: list[ProductRow],
    aggregate_targets: dict[str, AggregateTarget],
    lookup: dict[str, dict[str, Any]],
) -> MatchResult:
    top_page = page_rows[0]["page"] if page_rows else ""
    direct_match = match_query_page(query, top_page, products, aggregate_targets)
    if direct_match.target_id and (not page_rows or direct_match.reason == "exact"):
        return direct_match

    weighted_targets: Counter[str] = Counter()
    reason_by_target: dict[str, Counter[str]] = defaultdict(Counter)
    for row in page_rows:
        page_match = match_query_page(query, row["page"], products, aggregate_targets)
        if not page_match.target_id:
            continue
        weight = row["clicks"] if row["clicks"] > 0 else row["impressions"]
        if weight <= 0:
            weight = 1.0
        weighted_targets[page_match.target_id] += weight
        reason_by_target[page_match.target_id][page_match.reason] += weight

    if len(weighted_targets) == 1:
        target_id = weighted_targets.most_common(1)[0][0]
        reason = reason_by_target[target_id].most_common(1)[0][0]
        target_type = "aggregate" if target_id.startswith("aggregate::") else "product"
        return MatchResult(target_type=target_type, target_id=target_id, reason=reason)

    if weighted_targets:
        aggregate = choose_aggregate_target(query, top_page, aggregate_targets)
        if aggregate:
            return MatchResult(target_type="aggregate", target_id=aggregate.target_id, reason="family-aggregate")

        ranked = weighted_targets.most_common()
        top_id, top_weight = ranked[0]
        second_weight = ranked[1][1] if len(ranked) > 1 else 0.0
        total_weight = sum(weighted_targets.values())
        if top_weight >= (second_weight * 2) or (total_weight > 0 and top_weight / total_weight >= 0.6):
            reason = reason_by_target[top_id].most_common(1)[0][0]
            target_type = "aggregate" if top_id.startswith("aggregate::") else "product"
            return MatchResult(target_type=target_type, target_id=top_id, reason=f"dominant-{reason}")

        families = {lookup[target_id]["family"] for target_id in weighted_targets}
        kinds = {lookup[target_id]["repair_kind"] for target_id in weighted_targets}
        if len(families) == 1 and len(kinds) == 1:
            aggregate_id = f"aggregate::{next(iter(families)).lower()}::{next(iter(kinds))}"
            if aggregate_id in aggregate_targets:
                return MatchResult(target_type="aggregate", target_id=aggregate_id, reason="family-aggregate")

    if direct_match.target_id:
        return direct_match
    if page_rows:
        return MatchResult(target_type="unmatched", target_id=None, reason="ambiguous")
    return match_query_page(query, "", products, aggregate_targets)


def aggregate_query_rows(
    query_rows: list[dict[str, Any]],
    query_page_rows: list[dict[str, Any]],
    products: list[ProductRow],
    aggregate_targets: dict[str, AggregateTarget],
    lookup: dict[str, dict[str, Any]],
    preferred_matches: dict[str, MatchResult] | None = None,
) -> tuple[list[dict[str, Any]], dict[str, MatchResult]]:
    page_rows_by_query = group_query_page_rows_by_query(query_page_rows)
    final_rows = []
    match_by_query: dict[str, MatchResult] = {}
    for row in query_rows:
        query = row["query"]
        evidence_rows = page_rows_by_query.get(query, [])
        top_page = evidence_rows[0]["page"] if evidence_rows else ""
        preferred = preferred_matches.get(query) if preferred_matches else None
        if preferred and preferred.target_id:
            match = preferred
        else:
            match = resolve_query_match(query, evidence_rows, products, aggregate_targets, lookup)
        match_by_query[query] = match
        final_rows.append(
            {
                "query": query,
                "clicks": row["clicks"],
                "impressions": row["impressions"],
                "position": row["position"],
                "top_page": top_page,
                "match_id": match.target_id,
                "match_ids": [match.target_id] if match.target_id else [],
                "reason": match.reason,
            }
        )
    final_rows.sort(key=lambda row: (-row["clicks"], -row["impressions"], row["query"]))
    return final_rows, match_by_query


def apply_target_metrics(
    target_metrics: dict[str, TargetMetrics],
    rows: list[dict[str, Any]],
    period: str,
) -> None:
    for row in rows:
        target_id = row.get("match_id")
        if not target_id:
            continue
        metrics = target_metrics[target_id]
        clicks = row["clicks"]
        impressions = row["impressions"]
        position = row["position"] or 0.0

        if period == "90d":
            metrics.clicks_90d += clicks
            metrics.impressions_90d += impressions
            metrics.pos_weighted_sum_90d += position * impressions
            metrics.top_queries[row["query"]] += clicks
            if row.get("top_page"):
                metrics.top_pages[row["top_page"]] += clicks
        elif period == "current30":
            metrics.current_clicks_30d += clicks
            metrics.current_impressions_30d += impressions
        elif period == "prior30":
            metrics.prior_clicks_30d += clicks
            metrics.prior_impressions_30d += impressions


def build_target_lookup(
    products: list[ProductRow],
    aggregates: dict[str, AggregateTarget],
) -> dict[str, dict[str, Any]]:
    lookup: dict[str, dict[str, Any]] = {}
    for product in products:
        lookup[product.row_id] = {
            "label": product.label,
            "net_profit": product.net_profit,
            "net_margin_pct": product.net_margin_pct,
            "shopify_status": "Yes" if product.shopify_listed else "No",
            "flag": product.flag,
            "family": product.family,
            "repair_kind": product.repair_kind,
            "members": [product.label],
            "product": product,
            "aggregate": None,
        }
    for aggregate in aggregates.values():
        lookup[aggregate.target_id] = {
            "label": aggregate.label,
            "net_profit": aggregate.net_profit,
            "net_margin_pct": aggregate.net_margin_pct,
            "shopify_status": aggregate.shopify_status,
            "flag": "aggregate",
            "family": aggregate.family,
            "repair_kind": aggregate.repair_kind,
            "members": aggregate.member_labels,
            "product": None,
            "aggregate": aggregate,
        }
    return lookup


def action_flag(metrics: TargetMetrics, meta: dict[str, Any]) -> str:
    margin = meta["net_margin_pct"]
    clicks = metrics.clicks_90d
    position = metrics.avg_position_90d
    listed = meta["shopify_status"]
    click_delta = metrics.current_clicks_30d - metrics.prior_clicks_30d

    if margin is None:
        return "investigate"
    if margin < 0 and clicks < 2 and listed != "Yes":
        return "drop"
    if margin < 15 and click_delta >= 3:
        return "investigate"
    if margin < 15 and clicks >= 5:
        return "fix-price"
    if margin > 30 and listed == "No" and clicks >= 3:
        return "list-it"
    if margin > 30 and listed == "Yes" and clicks >= 8:
        return "grow"
    if margin > 30 and clicks < 5 and position is not None and position <= 8:
        return "hidden-gem"
    if margin < 15 and clicks < 2 and listed != "Yes":
        return "drop"
    return "grow" if margin > 30 else "investigate"


def related_query_signal(device_model: str, query_rows: list[dict[str, Any]]) -> tuple[float, float, list[str]]:
    clicks = 0.0
    impressions = 0.0
    hits: list[tuple[float, str]] = []
    for row in query_rows:
        if query_mentions_device_model(row["query"], device_model):
            clicks += row["clicks"]
            impressions += row["impressions"]
            hits.append((row["clicks"], row["query"]))
    hits.sort(reverse=True)
    return clicks, impressions, [query for _, query in hits[:3]]


def related_query_signal_for_product(product: ProductRow, query_rows: list[dict[str, Any]]) -> tuple[float, float, list[str]]:
    clicks = 0.0
    impressions = 0.0
    hits: list[tuple[float, str]] = []
    for row in query_rows:
        query = row["query"]
        if not query_mentions_device_model(query, product.device):
            continue
        query_kind = classify_repair_kind(query)
        if not related_repair_signal(query_kind, product.repair_kind):
            continue
        clicks += row["clicks"]
        impressions += row["impressions"]
        hits.append((row["clicks"], query))
    hits.sort(reverse=True)
    return clicks, impressions, [query for _, query in hits[:3]]


def priority_score(clicks: float, net_profit: float | None) -> float:
    if net_profit is None:
        return clicks
    return clicks * max(net_profit, 0.0)


def parse_v1_total_clicks(path: Path) -> float | None:
    if not path.exists():
        return None
    match = re.search(r"^- Total clicks: `([^`]+)`", path.read_text(encoding="utf-8"), re.M)
    if not match:
        return None
    return parse_float(match.group(1))


def render_report(
    products: list[ProductRow],
    missing_shopify: list[MissingShopifyRow],
    aggregates: dict[str, AggregateTarget],
    lookup: dict[str, dict[str, Any]],
    target_metrics: dict[str, TargetMetrics],
    query_page_rows_90d: list[dict[str, Any]],
    query_rows_90d: list[dict[str, Any]],
    page_rows_90d: list[dict[str, Any]],
    site_property_used: str,
    site_property_note: str | None,
    start_90d: str,
    end_90d: str,
    current30_start: str,
    current30_end: str,
    prior30_start: str,
    prior30_end: str,
) -> None:
    total_clicks = sum(row["clicks"] for row in query_rows_90d)
    total_impressions = sum(row["impressions"] for row in query_rows_90d)
    unique_queries = len(query_rows_90d)
    matched_queries = sum(1 for row in query_rows_90d if row["match_ids"])
    unmatched_queries = unique_queries - matched_queries
    v1_clicks = parse_v1_total_clicks(V1_OUTPUT_PATH)

    matched_targets = [
        (target_id, metrics)
        for target_id, metrics in target_metrics.items()
        if metrics.clicks_90d > 0
    ]
    matched_targets.sort(key=lambda item: (-item[1].clicks_90d, -(item[1].impressions_90d), lookup[item[0]]["label"]))

    unmatched_high = [row for row in query_rows_90d if not row["match_ids"] and row["clicks"] >= 5]

    no_shopify_demand: list[tuple[str, float, float, list[str]]] = []
    for product in products:
        if product.shopify_listed:
            continue
        metrics = target_metrics.get(product.row_id, TargetMetrics())
        if metrics.clicks_90d > 0:
            supporting = [query for query, _ in metrics.top_queries.most_common(3)]
            no_shopify_demand.append((product.row_id, metrics.clicks_90d, metrics.impressions_90d, supporting))
            continue
        if product.net_margin_pct is None:
            continue
        clicks, impressions, related = related_query_signal_for_product(product, query_rows_90d)
        if clicks > 0:
            no_shopify_demand.append((product.row_id, clicks, impressions, related))
    no_shopify_demand.sort(key=lambda item: (-item[1], -item[2], lookup[item[0]]["label"]))

    page_only_lookup = {row["keys"][0]: row for row in page_rows_90d if row.get("keys")}
    page_match_stats: dict[str, dict[str, Any]] = defaultdict(
        lambda: {
            "target_clicks": Counter(),
            "margin_num": 0.0,
            "margin_denom": 0.0,
            "clicks": 0.0,
            "impressions": 0.0,
            "pos_weighted_sum": 0.0,
        }
    )
    for row in query_rows_90d:
        page = row.get("top_page") or ""
        if not page:
            continue
        page_match_stats[page]["clicks"] += row["clicks"]
        page_match_stats[page]["impressions"] += row["impressions"]
        page_match_stats[page]["pos_weighted_sum"] += (row["position"] or 0.0) * row["impressions"]
        target_id = row.get("match_id")
        if not target_id:
            continue
        page_match_stats[page]["target_clicks"][target_id] += row["clicks"]
        margin = lookup[target_id]["net_margin_pct"]
        if margin is not None:
            page_match_stats[page]["margin_num"] += margin * row["clicks"]
            page_match_stats[page]["margin_denom"] += row["clicks"]

    ranked_pages = []
    for page, stats in page_match_stats.items():
        source = page_only_lookup.get(page, {})
        clicks = float(source.get("clicks", stats["clicks"]) or 0.0)
        impressions = float(source.get("impressions", stats["impressions"]) or 0.0)
        ctr = (clicks / impressions) if impressions > 0 else 0.0
        position = (
            float(source.get("position", 0) or 0.0)
            if source
            else (stats["pos_weighted_sum"] / stats["impressions"] if stats["impressions"] > 0 else None)
        )
        mapped_targets = [lookup[target_id]["label"] for target_id, _ in stats["target_clicks"].most_common(3)]
        aggregate_margin = (
            stats["margin_num"] / stats["margin_denom"] if stats["margin_denom"] > 0 else None
        )
        ranked_pages.append(
            {
                "page": page,
                "clicks": clicks,
                "impressions": impressions,
                "ctr": ctr,
                "position": position if impressions > 0 else None,
                "mapped_targets": mapped_targets,
                "aggregate_margin": aggregate_margin,
            }
        )
    ranked_pages.sort(key=lambda row: (-row["clicks"], -row["impressions"], row["page"]))
    ranked_pages = [row for row in ranked_pages if row["clicks"] > 0]

    list_now = []
    reprice = []
    push_seo = []
    drop_rows = []
    for product in products:
        metrics = target_metrics.get(product.row_id, TargetMetrics())
        if product.net_margin_pct is None:
            continue
        score = priority_score(metrics.clicks_90d, product.net_profit)
        if not product.shopify_listed and product.net_margin_pct > 30 and metrics.clicks_90d > 0:
            list_now.append((score, product, metrics))
        if product.net_margin_pct < 15 and metrics.clicks_90d >= 5:
            reprice.append((score, product, metrics))
        if product.net_margin_pct > 30 and metrics.clicks_90d > 0:
            if metrics.avg_position_90d is not None and metrics.avg_position_90d <= 12:
                push_seo.append((score, product, metrics))
        if product.net_margin_pct < 0 and metrics.clicks_90d < 2 and not product.shopify_listed:
            if "test" in normalize(product.label) or "custom product" in normalize(product.label):
                continue
            drop_rows.append((score, product, metrics))

    list_now.sort(key=lambda item: (-item[0], -item[2].clicks_90d, item[1].label))
    reprice.sort(key=lambda item: (-item[0], -item[2].clicks_90d, item[1].label))
    push_seo.sort(key=lambda item: (-item[0], -item[2].clicks_90d, item[1].label))
    drop_rows.sort(key=lambda item: (item[2].clicks_90d, item[1].net_margin_pct or 0.0, item[1].label))

    lines: list[str] = []
    lines.append("# Full GSC x Product Profitability Crossref v2")
    lines.append("")
    lines.append("## Method")
    lines.append("")
    lines.append(
        f"- Search Console property used: `{site_property_used}`. 90-day window used: `{start_90d}` to `{end_90d}`."
    )
    if site_property_note:
        lines.append(f"- Property access note: {site_property_note}")
    lines.append(
        f"- Trend split used for comparison: current 30d `{current30_start}` to `{current30_end}` vs prior 30d `{prior30_start}` to `{prior30_end}`."
    )
    lines.append(
        "- Source rows pulled directly from `searchAnalytics/query` with pagination until exhaustion for `query,page`, `query`, and `page` dimensions."
    )
    lines.append(
        "- Query totals and trend totals come from the `query` dimension for accuracy. Landing-page evidence from `query,page` rows is used only to resolve product matching."
    )
    lines.append(
        "- Broad family+repair queries with no model token were matched to aggregate targets instead of forcing a SKU. Brand/generic terms were left unmatched."
    )
    lines.append("")

    lines.append("## Section 1: Data Summary")
    lines.append("")
    lines.append(f"- Total repair-intent `query,page` rows pulled: `{len(query_page_rows_90d)}`")
    lines.append(f"- Total repair-intent `query` rows pulled: `{len(query_rows_90d)}`")
    lines.append(f"- Unique repair-intent queries: `{unique_queries}`")
    lines.append(f"- Total clicks: `{num(total_clicks)}`")
    lines.append(f"- Total impressions: `{num(total_impressions)}`")
    lines.append(f"- Queries matched to products or aggregate targets: `{matched_queries}`")
    lines.append(f"- Queries unmatched: `{unmatched_queries}`")
    lines.append(f"- Matched targets with traffic: `{len(matched_targets)}`")
    if v1_clicks is not None:
        lines.append(
            f"- Vs v1: `{num(v1_clicks)}` clicks in `{V1_OUTPUT_PATH.name}` using the wrong property, so v2 is `{delta_num(total_clicks - v1_clicks)}` clicks higher."
        )
    lines.append("")

    lines.append("## Section 2: Product-Level Demand x Profitability")
    lines.append("")
    lines.append(
        "| Product | Net Margin % | Net Profit | Shopify Listed | Total Clicks | Total Impressions | Avg Position | Click Trend (current 30d vs prior 30d) | Top Queries | Action Flag |"
    )
    lines.append("| --- | ---: | ---: | --- | ---: | ---: | ---: | --- | --- | --- |")
    for target_id, metrics in matched_targets:
        meta = lookup[target_id]
        top_queries = ", ".join(query for query, _ in metrics.top_queries.most_common(3))
        trend = (
            f"{num(metrics.current_clicks_30d)} vs {num(metrics.prior_clicks_30d)} "
            f"({delta_num(metrics.current_clicks_30d - metrics.prior_clicks_30d)})"
        )
        lines.append(
            f"| {escape_md(meta['label'])} | {pct(meta['net_margin_pct'])} | {money(meta['net_profit'])} | "
            f"{escape_md(meta['shopify_status'])} | {num(metrics.clicks_90d)} | {num(metrics.impressions_90d)} | "
            f"{num(metrics.avg_position_90d)} | {escape_md(trend)} | {escape_md(top_queries)} | "
            f"{action_flag(metrics, meta)} |"
        )
    lines.append("")

    lines.append("## Section 3: Unmatched High-Traffic Queries")
    lines.append("")
    if unmatched_high:
        lines.append("| Query | Clicks | Impressions | Avg Position | Top Landing Page | Reason |")
        lines.append("| --- | ---: | ---: | ---: | --- | --- |")
        for row in unmatched_high:
            lines.append(
                f"| {escape_md(row['query'])} | {num(row['clicks'])} | {num(row['impressions'])} | "
                f"{num(row['position'])} | {escape_md(row['top_page'])} | {escape_md(row['reason'])} |"
            )
    else:
        lines.append("No unmatched repair-intent queries cleared the `5+ clicks` threshold.")
    lines.append("")

    lines.append("## Section 4: Missing Shopify Listings With Demand")
    lines.append("")
    if no_shopify_demand:
        lines.append("| Product | Net Margin % | Net Profit | Demand Clicks | Demand Impressions | Evidence | Supporting Queries |")
        lines.append("| --- | ---: | ---: | ---: | ---: | --- | --- |")
        for product_id, clicks, impressions, supporting in no_shopify_demand[:100]:
            meta = lookup[product_id]
            live_clicks = target_metrics.get(product_id, TargetMetrics()).clicks_90d
            evidence = "exact product match" if live_clicks > 0 else "related model demand"
            lines.append(
                f"| {escape_md(meta['label'])} | {pct(meta['net_margin_pct'])} | {money(meta['net_profit'])} | "
                f"{num(clicks)} | {num(impressions)} | {evidence} | {escape_md(', '.join(supporting[:3]))} |"
            )
    else:
        lines.append("No unlisted products showed direct or closely related GSC demand in the 90-day window.")
    lines.append("")

    lines.append("### Gap List Cross-Check")
    lines.append("")
    lines.append("| Missing Device Model | Missing SKUs | Related Clicks | Supporting Queries |")
    lines.append("| --- | ---: | ---: | --- |")
    for row in missing_shopify:
        clicks, _impressions, supporting = related_query_signal(row.device_model, query_rows_90d)
        if clicks <= 0:
            continue
        lines.append(
            f"| {escape_md(row.device_model)} | {row.missing_skus} | {num(clicks)} | {escape_md(', '.join(supporting))} |"
        )
    lines.append("")

    lines.append("## Section 5: Top Landing Pages Performance")
    lines.append("")
    if ranked_pages:
        lines.append("| Page | Clicks | Impressions | CTR | Avg Position | Mapped Products | Aggregate Margin |")
        lines.append("| --- | ---: | ---: | ---: | ---: | --- | ---: |")
        for row in ranked_pages[:100]:
            ctr_pct = row["ctr"] * 100 if row["ctr"] is not None else None
            lines.append(
                f"| {escape_md(row['page'])} | {num(row['clicks'])} | {num(row['impressions'])} | {pct(ctr_pct)} | "
                f"{num(row['position'])} | {escape_md(', '.join(row['mapped_targets']))} | {pct(row['aggregate_margin'])} |"
            )
    else:
        lines.append("No mapped landing pages were available after filtering to repair-intent queries.")
    lines.append("")

    lines.append("## Section 6: Recommended Actions")
    lines.append("")
    lines.append("### 1. Products to list on Shopify immediately")
    lines.append("")
    if list_now:
        for _, product, metrics in list_now[:25]:
            lines.append(
                f"1. `{product.label}`: {pct(product.net_margin_pct)} margin, {money(product.net_profit)} net profit, "
                f"{num(metrics.clicks_90d)} clicks in 90d."
            )
    else:
        lines.append("No immediate Shopify listing candidates were supported by live GSC demand.")
    lines.append("")

    lines.append("### 2. Products to reprice")
    lines.append("")
    if reprice:
        for _, product, metrics in reprice[:25]:
            lines.append(
                f"1. `{product.label}`: {pct(product.net_margin_pct)} margin on {num(metrics.clicks_90d)} clicks."
            )
    else:
        lines.append("No thin-margin or loss-making products cleared the demand threshold for repricing.")
    lines.append("")

    lines.append("### 3. Products to push with content/SEO")
    lines.append("")
    if push_seo:
        for _, product, metrics in push_seo[:25]:
            lines.append(
                f"1. `{product.label}`: {pct(product.net_margin_pct)} margin, average position {num(metrics.avg_position_90d)}, "
                f"{num(metrics.clicks_90d)} clicks."
            )
    else:
        lines.append("No high-margin products met the ranking-demand criteria for an SEO push.")
    lines.append("")

    lines.append("### 4. Products to consider dropping")
    lines.append("")
    if drop_rows:
        for _, product, metrics in drop_rows[:25]:
            lines.append(
                f"1. `{product.label}`: {pct(product.net_margin_pct)} margin and only {num(metrics.clicks_90d)} clicks."
            )
    else:
        lines.append("No obvious drop candidates met the loss-making plus no-demand rule.")
    lines.append("")

    OUTPUT_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    global FAMILY_PRODUCT_INDEX
    env = parse_env(ENV_PATH)
    products, missing_shopify = parse_profitability_rows(PROFITABILITY_PATH)
    aggregates = build_aggregate_targets(products)
    lookup = build_target_lookup(products, aggregates)
    FAMILY_PRODUCT_INDEX = build_family_product_index(products)
    MATCH_CACHE.clear()

    today_utc = datetime.now(timezone.utc).date()
    end_90d_dt = today_utc - timedelta(days=1)
    start_90d_dt = end_90d_dt - timedelta(days=89)
    current30_end_dt = end_90d_dt
    current30_start_dt = current30_end_dt - timedelta(days=29)
    prior30_end_dt = current30_start_dt - timedelta(days=1)
    prior30_start_dt = prior30_end_dt - timedelta(days=29)

    access_token = load_google_access_token(env)
    probe_end_dt = end_90d_dt
    probe_start_dt = probe_end_dt - timedelta(days=6)
    site_property_used, prior_site_error = choose_site_property(
        access_token,
        probe_start_dt.isoformat(),
        probe_end_dt.isoformat(),
    )
    site_property_note = prior_site_error

    print(f"Pulling Search Console datasets for {site_property_used}", file=sys.stderr, flush=True)
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            "query_page_90d": executor.submit(
                gsc_fetch_repair_rows,
                access_token,
                site_property_used,
                start_90d_dt.isoformat(),
                end_90d_dt.isoformat(),
                ["query", "page"],
            ),
            "page_90d": executor.submit(
                gsc_fetch_repair_rows,
                access_token,
                site_property_used,
                start_90d_dt.isoformat(),
                end_90d_dt.isoformat(),
                ["page"],
            ),
            "query_90d": executor.submit(
                gsc_fetch_repair_rows,
                access_token,
                site_property_used,
                start_90d_dt.isoformat(),
                end_90d_dt.isoformat(),
                ["query"],
            ),
            "query_current30": executor.submit(
                gsc_fetch_repair_rows,
                access_token,
                site_property_used,
                current30_start_dt.isoformat(),
                current30_end_dt.isoformat(),
                ["query"],
            ),
            "query_prior30": executor.submit(
                gsc_fetch_repair_rows,
                access_token,
                site_property_used,
                prior30_start_dt.isoformat(),
                prior30_end_dt.isoformat(),
                ["query"],
            ),
        }
        raw_query_page_90d = futures["query_page_90d"].result()
        raw_page_90d = futures["page_90d"].result()
        raw_query_90d = futures["query_90d"].result()
        raw_query_current30 = futures["query_current30"].result()
        raw_query_prior30 = futures["query_prior30"].result()

    query_page_rows_90d = aggregate_query_page_rows(
        [row for row in raw_query_page_90d if row.get("keys") and is_repair_query(row["keys"][0])]
    )
    page_rows_90d = [row for row in raw_page_90d if row.get("keys")]
    query_totals_90d = aggregate_query_dimension_rows(
        [row for row in raw_query_90d if row.get("keys") and is_repair_query(row["keys"][0])]
    )
    query_totals_current30 = aggregate_query_dimension_rows(
        [row for row in raw_query_current30 if row.get("keys") and is_repair_query(row["keys"][0])]
    )
    query_totals_prior30 = aggregate_query_dimension_rows(
        [row for row in raw_query_prior30 if row.get("keys") and is_repair_query(row["keys"][0])]
    )

    query_rows_90d, match_by_query_90d = aggregate_query_rows(
        query_totals_90d,
        query_page_rows_90d,
        products,
        aggregates,
        lookup,
    )
    query_rows_current30, _match_by_query_current30 = aggregate_query_rows(
        query_totals_current30,
        [],
        products,
        aggregates,
        lookup,
        preferred_matches=match_by_query_90d,
    )
    query_rows_prior30, _match_by_query_prior30 = aggregate_query_rows(
        query_totals_prior30,
        [],
        products,
        aggregates,
        lookup,
        preferred_matches=match_by_query_90d,
    )

    target_metrics: dict[str, TargetMetrics] = defaultdict(TargetMetrics)
    apply_target_metrics(target_metrics, query_rows_90d, "90d")
    apply_target_metrics(target_metrics, query_rows_current30, "current30")
    apply_target_metrics(target_metrics, query_rows_prior30, "prior30")

    render_report(
        products=products,
        missing_shopify=missing_shopify,
        aggregates=aggregates,
        lookup=lookup,
        target_metrics=target_metrics,
        query_page_rows_90d=query_page_rows_90d,
        query_rows_90d=query_rows_90d,
        page_rows_90d=page_rows_90d,
        site_property_used=site_property_used,
        site_property_note=site_property_note,
        start_90d=start_90d_dt.isoformat(),
        end_90d=end_90d_dt.isoformat(),
        current30_start=current30_start_dt.isoformat(),
        current30_end=current30_end_dt.isoformat(),
        prior30_start=prior30_start_dt.isoformat(),
        prior30_end=prior30_end_dt.isoformat(),
    )
    print(f"Wrote {OUTPUT_PATH}", file=sys.stderr, flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
