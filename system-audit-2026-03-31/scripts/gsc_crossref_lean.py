#!/usr/bin/env python3
"""Lean GSC × Profitability crossref. Pulls GSC data via Edge account, matches to products."""
import json, os, re, sys, time
from pathlib import Path
from urllib.parse import quote
import requests

ENV_PATH = Path("/home/ricky/config/api-keys/.env")
PROF_PATH = Path("/home/ricky/builds/system-audit-2026-03-31/repair-profitability-v2.md")
OUT_PATH = Path("/home/ricky/builds/system-audit-2026-03-31/gsc-profitability-crossref-v2.md")
SITE = "sc-domain:icorrect.co.uk"
GSC_URL = "https://www.googleapis.com/webmasters/v3/sites/{site}/searchAnalytics/query"

REPAIR_KEYWORDS = [
    "repair", "screen", "battery", "replacement", "broken", "glass", "display",
    "charging", "keyboard", "camera", "diagnostic", "fix", "cracked", "water damage",
    "backlight", "flexgate", "dustgate", "port", "speaker", "microphone", "housing",
    "lens", "button", "crown", "logic board", "no power", "no service", "wifi",
    "activate", "refurb", "macbook", "iphone", "ipad", "apple watch", "ipod",
]
REPAIR_REGEX = "(" + "|".join(sorted(REPAIR_KEYWORDS, key=len, reverse=True)) + ")"


def parse_env(path):
    env = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()
    return env


def get_token(env):
    r = requests.post("https://oauth2.googleapis.com/token", data={
        "client_id": env["GOOGLE_CLIENT_ID"],
        "client_secret": env["GOOGLE_CLIENT_SECRET"],
        "refresh_token": env["EDGE_GOOGLE_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    }, timeout=30)
    r.raise_for_status()
    return r.json()["access_token"]


def gsc_pull(token, start, end, dims, filter_regex=None):
    url = GSC_URL.format(site=quote(SITE, safe=""))
    all_rows = []
    start_row = 0
    while True:
        payload = {"startDate": start, "endDate": end, "dimensions": dims, "rowLimit": 25000, "startRow": start_row}
        if filter_regex:
            payload["dimensionFilterGroups"] = [{"filters": [{"dimension": "query", "operator": "includingRegex", "expression": filter_regex}]}]
        r = requests.post(url, headers={"Authorization": f"Bearer {token}"}, json=payload, timeout=120)
        r.raise_for_status()
        rows = r.json().get("rows", [])
        if not rows:
            break
        all_rows.extend(rows)
        print(f"  Pulled {len(all_rows)} rows ({dims})...", file=sys.stderr, flush=True)
        if len(rows) < 25000:
            break
        start_row += 25000
    return all_rows


def parse_profitability():
    """Parse Section 3 table from repair-profitability-v2.md"""
    text = PROF_PATH.read_text()
    in_section = False
    in_table = False
    products = []
    for line in text.splitlines():
        if "## Section 3" in line:
            in_section = True
            continue
        if in_section and line.startswith("## Section"):
            break
        if in_section and line.startswith("| Device |"):
            in_table = True
            continue
        if in_section and line.startswith("| ---"):
            continue
        if in_section and in_table and line.startswith("|"):
            cols = [c.strip() for c in line.split("|")[1:-1]]
            if len(cols) >= 14:
                products.append({
                    "device": cols[0],
                    "product": cols[1],
                    "price_inc": cols[2],
                    "ex_vat": cols[3],
                    "parts_cost": cols[4],
                    "labour": cols[5],
                    "refurb": cols[6],
                    "fees": cols[7],
                    "net_profit": cols[8],
                    "net_margin": cols[9],
                    "shopify": cols[10],
                    "gsc_clicks": cols[11],
                    "gsc_pos": cols[12],
                    "flag": cols[13],
                })
    return products


def normalize(s):
    return re.sub(r"[^a-z0-9 ]", " ", s.lower()).strip()


def match_query_to_product(query, products, product_index):
    """Simple matching: find products whose normalized name tokens are all in the query."""
    qnorm = normalize(query)
    qtokens = set(qnorm.split())

    best = None
    best_score = 0
    for prod in products:
        key = prod["_key"]
        tokens = prod["_tokens"]
        if not tokens:
            continue
        overlap = len(tokens & qtokens)
        if overlap == len(tokens) and overlap > best_score:
            best = prod
            best_score = overlap
        elif overlap >= 3 and overlap > best_score:
            best = prod
            best_score = overlap
    return best


def classify_query(query):
    q = normalize(query)
    if any(x in q for x in ["london", "near me", "uk", "cost", "price", "how much"]):
        if not any(x in q for x in ["iphone", "ipad", "macbook", "apple watch", "ipod"]):
            return "generic"
    return "specific"


def main():
    env = parse_env(ENV_PATH)
    token = get_token(env)
    print("Token obtained", file=sys.stderr, flush=True)

    # Date ranges
    from datetime import date, timedelta
    end = date(2026, 4, 3)
    start_90 = end - timedelta(days=90)
    current_30_start = end - timedelta(days=30)
    prior_30_start = end - timedelta(days=60)
    prior_30_end = end - timedelta(days=31)

    # Pull GSC data
    print("Pulling query-only 90d...", file=sys.stderr, flush=True)
    query_rows = gsc_pull(token, start_90.isoformat(), end.isoformat(), ["query"], REPAIR_REGEX)
    print(f"Got {len(query_rows)} query rows", file=sys.stderr, flush=True)

    print("Pulling page-only 90d...", file=sys.stderr, flush=True)
    page_rows = gsc_pull(token, start_90.isoformat(), end.isoformat(), ["page"], REPAIR_REGEX)
    print(f"Got {len(page_rows)} page rows", file=sys.stderr, flush=True)

    print("Pulling query current 30d...", file=sys.stderr, flush=True)
    current_rows = gsc_pull(token, current_30_start.isoformat(), end.isoformat(), ["query"], REPAIR_REGEX)
    print(f"Got {len(current_rows)} current 30d rows", file=sys.stderr, flush=True)

    print("Pulling query prior 30d...", file=sys.stderr, flush=True)
    prior_rows = gsc_pull(token, prior_30_start.isoformat(), prior_30_end.isoformat(), ["query"], REPAIR_REGEX)
    print(f"Got {len(prior_rows)} prior 30d rows", file=sys.stderr, flush=True)

    # Aggregate query rows
    query_agg = {}
    for row in query_rows:
        q = row["keys"][0]
        e = query_agg.setdefault(q, {"clicks": 0, "impressions": 0, "pos_sum": 0})
        e["clicks"] += row.get("clicks", 0)
        e["impressions"] += row.get("impressions", 0)
        e["pos_sum"] += row.get("position", 0) * row.get("impressions", 0)

    current_agg = {}
    for row in current_rows:
        q = row["keys"][0]
        e = current_agg.setdefault(q, {"clicks": 0, "impressions": 0})
        e["clicks"] += row.get("clicks", 0)
        e["impressions"] += row.get("impressions", 0)

    prior_agg = {}
    for row in prior_rows:
        q = row["keys"][0]
        e = prior_agg.setdefault(q, {"clicks": 0, "impressions": 0})
        e["clicks"] += row.get("clicks", 0)
        e["impressions"] += row.get("impressions", 0)

    # Page aggregation
    page_agg = {}
    for row in page_rows:
        p = row["keys"][0]
        e = page_agg.setdefault(p, {"clicks": 0, "impressions": 0, "pos_sum": 0})
        e["clicks"] += row.get("clicks", 0)
        e["impressions"] += row.get("impressions", 0)
        e["pos_sum"] += row.get("position", 0) * row.get("impressions", 0)

    # Parse products
    products = parse_profitability()
    print(f"Parsed {len(products)} products from profitability model", file=sys.stderr, flush=True)

    # Build simple match index
    for p in products:
        name = p["product"]
        p["_key"] = normalize(name)
        p["_tokens"] = set(normalize(name).split()) - {"repair", "replacement", "genuine", "oled", "lcd", "original", "aftermarket"}

    # Sort queries by clicks descending
    sorted_queries = sorted(query_agg.items(), key=lambda x: -x[1]["clicks"])

    total_clicks = sum(v["clicks"] for v in query_agg.values())
    total_impressions = sum(v["impressions"] for v in query_agg.values())

    # Match queries to products
    matched_rows = []
    unmatched_rows = []
    product_demand = {}  # product name -> aggregated demand

    print("Matching queries to products...", file=sys.stderr, flush=True)
    for query, data in sorted_queries:
        prod = match_query_to_product(query, products, None)
        clicks = data["clicks"]
        impressions = data["impressions"]
        pos = (data["pos_sum"] / impressions) if impressions > 0 else None
        cur = current_agg.get(query, {"clicks": 0})
        pri = prior_agg.get(query, {"clicks": 0})
        trend = cur["clicks"] - pri["clicks"]

        row = {
            "query": query, "clicks": clicks, "impressions": impressions,
            "position": pos, "trend": trend,
            "current_clicks": cur["clicks"], "prior_clicks": pri["clicks"],
        }

        if prod:
            row["product"] = prod["product"]
            row["device"] = prod["device"]
            row["net_margin"] = prod["net_margin"]
            row["net_profit"] = prod["net_profit"]
            row["shopify"] = prod["shopify"]
            row["flag"] = prod["flag"]
            matched_rows.append(row)

            key = prod["product"]
            pd = product_demand.setdefault(key, {
                "product": prod["product"], "device": prod["device"],
                "net_margin": prod["net_margin"], "net_profit": prod["net_profit"],
                "shopify": prod["shopify"], "flag": prod["flag"],
                "clicks": 0, "impressions": 0, "pos_sum": 0,
                "current_clicks": 0, "prior_clicks": 0, "queries": [],
            })
            pd["clicks"] += clicks
            pd["impressions"] += impressions
            pd["pos_sum"] += (data["pos_sum"])
            pd["current_clicks"] += cur["clicks"]
            pd["prior_clicks"] += pri["clicks"]
            if len(pd["queries"]) < 5:
                pd["queries"].append(query)
        else:
            unmatched_rows.append(row)

    # Assign action flags
    def action_flag(pd):
        margin_str = pd["net_margin"].replace("%", "").strip()
        try:
            margin = float(margin_str)
        except:
            return "investigate"
        shopify = pd["shopify"].strip().lower()
        clicks = pd["clicks"]

        if margin > 30 and clicks >= 3 and shopify == "yes":
            return "grow"
        if margin > 30 and shopify == "no":
            return "list-it"
        if margin < 15 and clicks >= 3:
            return "fix-price"
        if margin > 30 and clicks < 3:
            return "hidden-gem"
        if margin < 0 and clicks < 2:
            return "drop"
        if margin <= 30 and clicks >= 2:
            return "investigate"
        return "review"

    # Build report
    print("Building report...", file=sys.stderr, flush=True)
    lines = []
    lines.append("# Full GSC × Product Profitability Crossref v2\n")
    lines.append("## Section 1: Data Summary\n")
    lines.append(f"- GSC property: `{SITE}` (via Edge Google account)")
    lines.append(f"- 90-day window: `{start_90}` to `{end}`")
    lines.append(f"- Total unique repair-intent queries: `{len(query_agg)}`")
    lines.append(f"- Total clicks: `{total_clicks:,.0f}`")
    lines.append(f"- Total impressions: `{total_impressions:,.0f}`")
    lines.append(f"- Queries matched to products: `{len(matched_rows)}`")
    lines.append(f"- Queries unmatched: `{len(unmatched_rows)}`")
    lines.append(f"- Unique products with demand: `{len(product_demand)}`")
    lines.append(f"- v1 comparison: v1 used www property and got 53 total clicks; this pull got `{total_clicks:,.0f}`\n")

    # Section 2: Product-level demand
    lines.append("## Section 2: Product-Level Demand × Profitability\n")
    lines.append("| Product | Device | Net Margin % | Net Profit | Shopify | Clicks | Impressions | Avg Position | Trend (30d) | Top Queries | Action |")
    lines.append("| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |")
    sorted_products = sorted(product_demand.values(), key=lambda x: -x["clicks"])
    for pd in sorted_products:
        pos = (pd["pos_sum"] / pd["impressions"]) if pd["impressions"] > 0 else None
        pos_str = f"{pos:.1f}" if pos else "n/a"
        trend_str = f"+{pd['current_clicks'] - pd['prior_clicks']}" if pd["current_clicks"] >= pd["prior_clicks"] else f"{pd['current_clicks'] - pd['prior_clicks']}"
        queries_str = ", ".join(pd["queries"][:3])
        af = action_flag(pd)
        lines.append(f"| {pd['product']} | {pd['device']} | {pd['net_margin']} | {pd['net_profit']} | {pd['shopify']} | {pd['clicks']:,.0f} | {pd['impressions']:,.0f} | {pos_str} | {trend_str} | {queries_str} | {af} |")

    # Section 3: Unmatched high-traffic
    lines.append("\n## Section 3: Unmatched High-Traffic Queries\n")
    lines.append("Queries with 3+ clicks that didn't match a product.\n")
    lines.append("| Query | Clicks | Impressions | Position | Trend |")
    lines.append("| --- | ---: | ---: | ---: | --- |")
    high_unmatched = [r for r in unmatched_rows if r["clicks"] >= 3]
    high_unmatched.sort(key=lambda x: -x["clicks"])
    for r in high_unmatched[:50]:
        pos_str = f"{r['position']:.1f}" if r["position"] else "n/a"
        lines.append(f"| {r['query']} | {r['clicks']:,.0f} | {r['impressions']:,.0f} | {pos_str} | {r['trend']:+d} |")

    # Section 4: Missing Shopify with demand
    lines.append("\n## Section 4: Missing Shopify Listings With Demand\n")
    lines.append("| Product | Device | Net Margin | Clicks | Impressions | Top Queries |")
    lines.append("| --- | --- | --- | ---: | ---: | --- |")
    missing_shopify = [pd for pd in sorted_products if pd["shopify"].strip().lower() == "no" and pd["clicks"] > 0]
    for pd in missing_shopify:
        lines.append(f"| {pd['product']} | {pd['device']} | {pd['net_margin']} | {pd['clicks']:,.0f} | {pd['impressions']:,.0f} | {', '.join(pd['queries'][:3])} |")

    # Section 5: Top landing pages
    lines.append("\n## Section 5: Top Landing Pages\n")
    lines.append("| Page | Clicks | Impressions | CTR | Avg Position |")
    lines.append("| --- | ---: | ---: | ---: | ---: |")
    sorted_pages = sorted(page_agg.items(), key=lambda x: -x[1]["clicks"])
    for page, data in sorted_pages[:30]:
        clicks = data["clicks"]
        impressions = data["impressions"]
        ctr = (clicks / impressions * 100) if impressions > 0 else 0
        pos = (data["pos_sum"] / impressions) if impressions > 0 else 0
        lines.append(f"| {page} | {clicks:,.0f} | {impressions:,.0f} | {ctr:.1f}% | {pos:.1f} |")

    # Section 6: Recommended actions
    lines.append("\n## Section 6: Recommended Actions\n")

    lines.append("### Products to grow (good margin + traffic + listed)")
    grow = [pd for pd in sorted_products if action_flag(pd) == "grow"]
    for pd in grow[:20]:
        lines.append(f"- **{pd['product']}**: {pd['net_margin']} margin, {pd['clicks']:.0f} clicks")

    lines.append("\n### Products to list on Shopify (good margin + demand + not listed)")
    list_it = [pd for pd in sorted_products if action_flag(pd) == "list-it"]
    for pd in list_it[:20]:
        lines.append(f"- **{pd['product']}**: {pd['net_margin']} margin, {pd['clicks']:.0f} clicks")

    lines.append("\n### Products to reprice (thin margin + traffic)")
    fix = [pd for pd in sorted_products if action_flag(pd) == "fix-price"]
    for pd in fix[:20]:
        lines.append(f"- **{pd['product']}**: {pd['net_margin']} margin, {pd['clicks']:.0f} clicks")

    lines.append("\n### Products to investigate (moderate margin + demand)")
    investigate = [pd for pd in sorted_products if action_flag(pd) == "investigate"]
    for pd in investigate[:20]:
        lines.append(f"- **{pd['product']}**: {pd['net_margin']} margin, {pd['clicks']:.0f} clicks")

    lines.append("\n### Hidden gems (good margin but low traffic)")
    gems = [pd for pd in sorted_products if action_flag(pd) == "hidden-gem"]
    for pd in gems[:20]:
        lines.append(f"- **{pd['product']}**: {pd['net_margin']} margin, {pd['clicks']:.0f} clicks, position {(pd['pos_sum']/pd['impressions']):.1f}" if pd["impressions"] > 0 else f"- **{pd['product']}**: {pd['net_margin']} margin")

    report = "\n".join(lines) + "\n"
    OUT_PATH.write_text(report, encoding="utf-8")
    print(f"Done! Wrote {OUT_PATH} ({len(report)} bytes)", file=sys.stderr, flush=True)


if __name__ == "__main__":
    main()
