#!/usr/bin/env python3
import json
import sys
from datetime import datetime, timezone
from urllib.parse import urlencode, urljoin
from urllib.error import HTTPError
from urllib.request import Request, urlopen

START_DT = datetime(2026, 3, 23, 0, 0, 0, tzinfo=timezone.utc)
NOW_DT = datetime.now(timezone.utc)

MAIN_BOARD = 349212843
BM_BOARD = 3892194968


def load_env():
    env = {}
    with open("/home/ricky/config/api-keys/.env", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k] = v.strip().strip('"').strip("'")
    return env


ENV = load_env()


def http_json(url, *, method="GET", headers=None, body=None):
    req = Request(url, method=method)
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    if body is not None:
        body = json.dumps(body).encode("utf-8")
    try:
        with urlopen(req, body, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {detail}") from exc


def bm_get(path, params=None):
    base = "https://www.backmarket.co.uk"
    if params:
        path = f"{path}?{urlencode(params)}"
    return http_json(
        urljoin(base, path),
        headers={
            "Authorization": ENV["BACKMARKET_API_AUTH"],
            "Accept-Language": ENV.get("BACKMARKET_API_LANG", "en-gb"),
            "User-Agent": ENV["BACKMARKET_API_UA"],
            "Accept": "application/json",
        },
    )


def monday_query(query):
    data = http_json(
        "https://api.monday.com/v2",
        method="POST",
        headers={
            "Authorization": ENV["MONDAY_APP_TOKEN"],
            "Content-Type": "application/json",
        },
        body={"query": query},
    )
    if data.get("errors"):
        raise RuntimeError(json.dumps(data["errors"]))
    return data["data"]


def fetch_all_buybacks():
    statuses = [
        "RECEIVED",
        "VALIDATED",
        "MONEY_TRANSFERED",
        "PAID",
        "SUSPENDED",
        "SENT",
    ]
    orders = []
    seen = set()
    for status in statuses:
        cursor = None
        for _ in range(100):
            params = {"limit": 100, "status": status}
            if cursor:
                params["cursor"] = cursor
            data = bm_get("/ws/buyback/v1/orders", params=params)
            batch = data.get("results", [])
            for row in batch:
                oid = row.get("orderPublicId")
                if oid and oid not in seen:
                    seen.add(oid)
                    orders.append(row)
            next_url = data.get("next")
            if not next_url or not batch:
                break
            if "cursor=" not in next_url:
                break
            cursor = next_url.split("cursor=", 1)[1].split("&", 1)[0]
    return orders


def fetch_board_items(board_id, column_ids):
    quoted = ", ".join(json.dumps(c) for c in column_ids)
    items = []
    cursor = None
    key_col = column_ids[0]
    for _ in range(100):
        if cursor:
            q = (
                f'{{ next_items_page(limit: 200, cursor: "{cursor}") '
                + f'{{ cursor items {{ id name group {{ id title }} '
                + f'column_values(ids: [{quoted}]) {{ id text ... on StatusValue {{ index }} }} '
                + "} } }"
            )
            page = monday_query(q)["next_items_page"]
        else:
            q = (
                f"{{ boards(ids: [{board_id}]) "
                + f'{{ items_page(limit: 200, query_params: {{ rules: [{{ column_id: "{key_col}", compare_value: [""], operator: is_not_empty }}] }}) '
                + "{ cursor items { id name group { id title } "
                + f"column_values(ids: [{quoted}]) {{ id text ... on StatusValue {{ index }} }} "
                + "} } } }"
            )
            page = monday_query(q)["boards"][0]["items_page"]
        items.extend(page["items"])
        cursor = page.get("cursor")
        if not cursor:
            break
    return items


def parse_dt(value):
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def load_rogue_log_hits():
    hits = {}
    current_run = None
    with open(
        "/home/ricky/.openclaw/agents/backmarket/workspace/logs/buyback-payout-watch.log",
        "r",
        encoding="utf-8",
    ) as f:
        for raw in f:
            line = raw.rstrip("\n")
            if line.startswith("[") and "Buyback payout watch running" in line:
                current_run = line.strip("[]").replace(" Buyback payout watch running...", "")
            if "Validated: GB-" in line:
                oid = line.split("Validated:", 1)[1].split("|", 1)[0].strip()
                hits.setdefault(oid, []).append(current_run)
    return hits


def index_main(items):
    out = {}
    for item in items:
        cols = {c["id"]: c for c in item.get("column_values", [])}
        tradein_id = (cols.get("text_mky01vb4", {}).get("text") or "").strip()
        if not tradein_id:
            continue
        out.setdefault(tradein_id, []).append(
            {
                "item_id": item["id"],
                "name": item["name"],
                "group": item.get("group", {}).get("title", ""),
                "status24": cols.get("status24", {}).get("text", ""),
                "status24_index": cols.get("status24", {}).get("index"),
                "status4": cols.get("status4", {}).get("text", ""),
                "created": cols.get("creation_log4", {}).get("text", ""),
            }
        )
    return out


def index_bm(items):
    out = {}
    for item in items:
        cols = {c["id"]: c for c in item.get("column_values", [])}
        tradein_id = (cols.get("text_mkqy3576", {}).get("text") or "").strip()
        if not tradein_id:
            continue
        out.setdefault(tradein_id, []).append(
            {
                "item_id": item["id"],
                "name": item["name"],
                "group": item.get("group", {}).get("title", ""),
                "purchase_price": cols.get("numeric", {}).get("text", ""),
            }
        )
    return out


def main():
    buybacks = fetch_all_buybacks()
    rogue_hits = load_rogue_log_hits()

    week_orders = []
    for order in buybacks:
        receival_dt = parse_dt(order.get("receivalDate"))
        if receival_dt and START_DT <= receival_dt <= NOW_DT:
            week_orders.append(order)

    main_items = fetch_board_items(MAIN_BOARD, ["text_mky01vb4", "status24", "status4", "creation_log4"])
    bm_items = fetch_board_items(BM_BOARD, ["text_mkqy3576", "numeric"])
    main_by_id = index_main(main_items)
    bm_by_id = index_bm(bm_items)

    rows = []
    for order in sorted(week_orders, key=lambda o: o.get("receivalDate") or ""):
        oid = order.get("orderPublicId", "")
        rows.append(
            {
                "order_id": oid,
                "receival_date": order.get("receivalDate"),
                "creation_date": order.get("creationDate"),
                "current_bm_status": order.get("status"),
                "customer": (
                    (order.get("customer", {}).get("firstName", "") + " " + order.get("customer", {}).get("lastName", ""))
                    .strip()
                ),
                "device": order.get("listing", {}).get("title", ""),
                "grade": order.get("listing", {}).get("grade", ""),
                "original_price": order.get("originalPrice", {}).get("value"),
                "counter_offer_price": order.get("counterOfferPrice", {}).get("value"),
                "main_matches": main_by_id.get(oid, []),
                "bm_matches": bm_by_id.get(oid, []),
                "rogue_log_runs": rogue_hits.get(oid, []),
            }
        )

    summary = {
        "week_start_utc": START_DT.isoformat(),
        "generated_at_utc": NOW_DT.isoformat(),
        "bm_received_this_week": len(rows),
        "matched_on_main_board": sum(1 for r in rows if r["main_matches"]),
        "matched_on_bm_board": sum(1 for r in rows if r["bm_matches"]),
        "matched_on_both_boards": sum(1 for r in rows if r["main_matches"] and r["bm_matches"]),
        "missing_from_main_board": [r["order_id"] for r in rows if not r["main_matches"]],
        "missing_from_bm_board": [r["order_id"] for r in rows if not r["bm_matches"]],
        "rogue_log_validated": [r["order_id"] for r in rows if r["rogue_log_runs"]],
    }

    print(json.dumps({"summary": summary, "orders": rows}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise
