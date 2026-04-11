#!/usr/bin/env python3
"""
MONTHLY QUALITY REPORT
Tracks return rate and QC failure rate per tech across a calendar month.

Return detection: BM board items in "BM Returns" or "Rejected / iC Locked" groups.
Tech attribution: activity logs on main board (who set status to Repaired/Refurbed).
QC failure: items that transition through QC Failure → Under Refurb (from daily CSV data).

Usage:
    python monthly_quality_report.py --month 2026-02
    python monthly_quality_report.py --month 2026-03 --tech mykhailo
"""

import requests
import json
import os
import re
import time as time_module
import argparse
from datetime import datetime, timedelta
from collections import Counter, defaultdict

# ============================================================
# CONFIGURATION
# ============================================================

MONDAY_API_URL = "https://api.monday.com/v2"
MAIN_BOARD_ID = "349212843"
BM_BOARD_ID = "3892194968"

# Groups on BM board that indicate problems
RETURN_GROUPS = ["BM Returns"]
REJECTED_GROUPS = ["Rejected / iC Locked"]
SHIPPED_GROUPS = ["Shipped"]

# User ID to name mapping
USER_NAMES = {
    "55780786": "Ferrari",
    "1034414": "Ricky",
    "25304513": "Safan",
    "49001724": "Andreas",
    "64642914": "Mykhailo",
    "79665360": "Roni",
    "94961618": "Adil",
}

COMPLETED_STATUSES = ["Repaired", "Part Repaired", "Refurbed"]
QC_FAILURE_STATUS = "QC Failure"


def load_token():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
    if not os.path.exists(env_path):
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    with open(env_path) as f:
        for line in f:
            if line.startswith('MONDAY_APP_TOKEN='):
                return line.strip().split('=', 1)[1]
    raise ValueError("MONDAY_APP_TOKEN not found")


def run_query(query, headers, retries=3):
    for i in range(retries):
        try:
            resp = requests.post(MONDAY_API_URL, json={"query": query}, headers=headers, timeout=30)
            result = resp.json()
            if "errors" in result:
                print(f"  API error: {result['errors'][0].get('message', 'unknown')}")
                if i < retries - 1:
                    time_module.sleep(2)
                    continue
            return result
        except Exception as e:
            if i < retries - 1:
                time_module.sleep(2)
            else:
                print(f"  Request failed: {e}")
    return {}


def parse_timestamp(ts):
    try:
        return datetime.fromtimestamp(int(ts) / 10000000)
    except:
        return None


# ============================================================
# DATA COLLECTION
# ============================================================

def fetch_bm_board_items(headers):
    """Fetch all BM board items with group membership."""
    items = []
    cursor = None
    while True:
        if cursor:
            q = f'''query {{ next_items_page(limit: 500, cursor: "{cursor}") {{
                cursor items {{ id name group {{ id title }}
                column_values(ids: ["numeric5", "numeric", "formula", "formula7"]) {{ id text }}
            }} }} }}'''
            r = run_query(q, headers)
            pd = r.get("data", {}).get("next_items_page", {})
        else:
            q = '''query { boards(ids: [3892194968]) { items_page(limit: 500) {
                cursor items { id name group { id title }
                column_values(ids: ["numeric5", "numeric", "formula", "formula7"]) { id text }
            } } } }'''
            r = run_query(q, headers)
            pd = r.get("data", {}).get("boards", [{}])[0].get("items_page", {})
        page_items = pd.get("items", [])
        items.extend(page_items)
        cursor = pd.get("cursor")
        if not cursor or len(page_items) < 500:
            break
        time_module.sleep(0.5)
    return items


def fetch_completion_activity(board_id, from_date, to_date, headers):
    """Fetch activity logs per user to avoid the 10,000 entry API limit.

    Querying all users at once hits the cap on busy boards. Per-user
    queries ensure we get complete data for each tech.
    """
    # Include Roni (79665360) — he sets QC Failure statuses
    tech_user_ids = ["25304513", "49001724", "64642914", "79665360"]  # Safan, Andreas, Mykhailo, Roni
    all_logs = []
    for user_id in tech_user_ids:
        user_name = USER_NAMES.get(user_id, user_id)
        page = 1
        user_logs = []
        while True:
            q = f'''query {{
                boards(ids: [{board_id}]) {{
                    activity_logs(
                        user_ids: [{user_id}],
                        from: "{from_date}T00:00:00Z",
                        to: "{to_date}T23:59:59Z",
                        limit: 500,
                        page: {page}
                    ) {{ id event data created_at user_id }}
                }}
            }}'''
            result = run_query(q, headers)
            logs = result.get("data", {}).get("boards", [{}])[0].get("activity_logs", [])
            user_logs.extend(logs)
            if len(logs) < 500:
                break
            page += 1
            time_module.sleep(0.5)
        print(f"  {user_name}: {len(user_logs)} entries ({page} pages)")
        all_logs.extend(user_logs)
        time_module.sleep(0.3)
    return all_logs


def attribute_completions(activity_logs):
    """From activity logs, determine who completed each item.

    Returns: {item_id: {"user_id": ..., "user_name": ..., "status": ..., "date": ...}}
    For items completed multiple times (QC rework), tracks ALL completions.
    """
    completions = defaultdict(list)  # item_id -> list of completions
    qc_failures = defaultdict(list)  # item_id -> list of QC failure events

    for log in activity_logs:
        try:
            data = json.loads(log["data"]) if isinstance(log["data"], str) else log["data"]
        except:
            continue

        value = data.get("value", {})
        if not isinstance(value, dict):
            continue

        label = value.get("label", {}).get("text", "")
        item_id = str(data.get("pulse_id", ""))
        user_id = str(log.get("user_id", ""))
        dt = parse_timestamp(log.get("created_at", ""))

        if not item_id or not dt:
            continue

        if label in COMPLETED_STATUSES:
            completions[item_id].append({
                "user_id": user_id,
                "user_name": USER_NAMES.get(user_id, f"User {user_id}"),
                "status": label,
                "date": dt.strftime("%Y-%m-%d"),
            })
        elif label == QC_FAILURE_STATUS:
            qc_failures[item_id].append({
                "user_id": user_id,
                "user_name": USER_NAMES.get(user_id, f"User {user_id}"),
                "date": dt.strftime("%Y-%m-%d"),
            })

    return completions, qc_failures


# ============================================================
# REPORT GENERATION
# ============================================================

def generate_report(month_str, tech_filter=None):
    """Generate monthly quality report."""

    token = load_token()
    headers = {"Authorization": token, "Content-Type": "application/json"}

    # Parse month
    year, month = month_str.split("-")
    from_date = f"{year}-{month}-01"
    # Last day of month
    if int(month) == 12:
        to_date = f"{int(year)+1}-01-01"
    else:
        to_date = f"{year}-{int(month)+1:02d}-01"
    to_dt = datetime.strptime(to_date, "%Y-%m-%d") - timedelta(days=1)
    to_date = to_dt.strftime("%Y-%m-%d")

    print(f"=" * 60)
    print(f"MONTHLY QUALITY REPORT: {month_str}")
    print(f"Period: {from_date} to {to_date}")
    print(f"=" * 60)

    # ---- Fetch activity logs for the month ----
    print(f"\n[1/3] Fetching main board activity logs...")
    activity_logs = fetch_completion_activity(MAIN_BOARD_ID, from_date, to_date, headers)
    print(f"  Total entries: {len(activity_logs)}")

    completions, qc_failures = attribute_completions(activity_logs)
    print(f"  Items completed: {len(completions)}")
    print(f"  Items with QC failures: {len(qc_failures)}")

    # ---- Fetch BM board ----
    print(f"\n[2/3] Fetching BM board items...")
    bm_items = fetch_bm_board_items(headers)
    print(f"  Total BM items: {len(bm_items)}")

    # Categorise by group
    returns = []
    rejected = []
    shipped = []
    for item in bm_items:
        group = item.get("group", {}).get("title", "")
        if group in RETURN_GROUPS:
            returns.append(item)
        elif group in REJECTED_GROUPS:
            rejected.append(item)
        elif group in SHIPPED_GROUPS:
            shipped.append(item)

    print(f"  Shipped: {len(shipped)}, Returns: {len(returns)}, Rejected: {len(rejected)}")

    # ---- Cross-reference returns to completions ----
    print(f"\n[3/3] Cross-referencing returns to techs...")
    return_attribution = {}
    for item in returns:
        name = item.get("name", "")
        match = re.search(r'BM\s*(\d+)', name)
        if not match:
            continue
        bm_num = match.group(1)

        # Find this BM number in completed items
        for item_id, comp_list in completions.items():
            # We need the item name — but we only have activity log data
            # Activity logs have pulse_name in data
            pass

    # Alternative: search main board for each returned BM number
    return_by_tech = Counter()
    return_items = []
    for item in returns:
        name = item.get("name", "")
        match = re.search(r'BM\s*(\d+)', name)
        if not match:
            continue
        bm_num = match.group(1)

        # Search main board
        q = f'''query {{ items_page_by_column_values(
            board_id: {MAIN_BOARD_ID}, limit: 5,
            columns: [{{ column_id: "name", column_values: ["BM {bm_num}"] }}]
        ) {{ items {{ id name }} }} }}'''
        r = run_query(q, headers)
        found_items = r.get("data", {}).get("items_page_by_column_values", {}).get("items", [])
        time_module.sleep(0.3)

        # Match exact BM number
        main_item_id = None
        for fi in found_items:
            m = re.search(r'BM\s*(\d+)', fi.get("name", ""))
            if m and m.group(1) == bm_num:
                main_item_id = fi["id"]
                break

        if main_item_id and main_item_id in completions:
            # Get the first (original) completion
            first_comp = completions[main_item_id][0]
            tech = first_comp["user_name"]
            return_by_tech[tech] += 1
            return_items.append({
                "bm_num": bm_num, "name": name,
                "tech": tech, "completed": first_comp["date"]
            })
        else:
            return_by_tech["(unattributable)"] += 1
            return_items.append({
                "bm_num": bm_num, "name": name,
                "tech": "(unattributable)", "completed": ""
            })

    # ---- Calculate QC failure rate per tech ----
    # First completion per item = the tech who worked it
    # QC failure count for that item = rework count
    tech_completions = Counter()
    tech_qc_failures = Counter()

    for item_id, comp_list in completions.items():
        if comp_list:
            tech = comp_list[0]["user_name"]
            tech_completions[tech] += 1

            if item_id in qc_failures:
                tech_qc_failures[tech] += len(qc_failures[item_id])

    # ---- Output report ----
    report_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'reports')
    os.makedirs(report_dir, exist_ok=True)
    report_path = os.path.join(report_dir, f"monthly_quality_{month_str}.md")

    lines = []
    lines.append(f"# Monthly Quality Report — {month_str}")
    lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    lines.append(f"Period: {from_date} to {to_date}\n")
    lines.append("---\n")

    # Summary
    total_completions = sum(tech_completions.values())
    total_qc = sum(tech_qc_failures.values())
    lines.append("## Summary\n")
    lines.append(f"| Metric | Value |")
    lines.append(f"|--------|-------|")
    lines.append(f"| Total completions (all techs) | {total_completions} |")
    lines.append(f"| Total QC failures | {total_qc} ({(total_qc/total_completions*100):.1f}% rate) |" if total_completions else f"| Total QC failures | {total_qc} |")
    lines.append(f"| BM items shipped (all time) | {len(shipped)} |")
    lines.append(f"| BM returns (all time) | {len(returns)} ({len(returns)/(len(shipped)+len(returns))*100:.1f}%) |" if (len(shipped)+len(returns)) else f"| BM returns | {len(returns)} |")
    lines.append(f"| BM rejected/locked (all time) | {len(rejected)} |")
    lines.append("")

    # Per-tech completions and QC
    lines.append("## Completions & QC Failure Rate by Tech\n")
    lines.append("| Tech | Completions | QC Failures | QC Rate |")
    lines.append("|------|------------|-------------|---------|")
    for tech in sorted(tech_completions.keys()):
        if tech_filter and tech_filter.lower() not in tech.lower():
            continue
        comp = tech_completions[tech]
        qc = tech_qc_failures.get(tech, 0)
        rate = f"{(qc/comp)*100:.1f}%" if comp > 0 else "n/a"
        lines.append(f"| {tech} | {comp} | {qc} | {rate} |")
    lines.append("")

    # BM Returns attribution
    lines.append("## BM Returns Attribution\n")
    if return_items:
        lines.append("| BM # | Item | Completed By | Completion Date |")
        lines.append("|------|------|-------------|----------------|")
        for ri in sorted(return_items, key=lambda x: x["bm_num"]):
            lines.append(f"| {ri['bm_num']} | {ri['name'][:40]} | {ri['tech']} | {ri['completed']} |")
    else:
        lines.append("No returns found in period.\n")
    lines.append("")

    lines.append("## Returns by Tech\n")
    if return_by_tech:
        lines.append("| Tech | Returns |")
        lines.append("|------|---------|")
        for tech, count in return_by_tech.most_common():
            lines.append(f"| {tech} | {count} |")
    lines.append("")

    lines.append("---\n")
    lines.append("*Note: Return attribution requires matching BM board items back to main board")
    lines.append("activity logs. Items completed before activity log retention period are unattributable.")
    lines.append("QC failure rate counts items that transitioned through QC Failure status during the month.*")

    report_text = "\n".join(lines)

    with open(report_path, "w") as f:
        f.write(report_text)

    print(f"\n{'=' * 60}")
    print(f"Report saved: {report_path}")
    print(f"{'=' * 60}")

    # Print summary to console
    print(f"\n--- QUICK SUMMARY ---")
    print(f"Total completions: {total_completions}")
    print(f"QC failure rate: {(total_qc/total_completions*100):.1f}%" if total_completions else "QC: n/a")
    print(f"BM return rate: {len(returns)}/{len(shipped)+len(returns)} = {len(returns)/(len(shipped)+len(returns))*100:.1f}%" if (len(shipped)+len(returns)) else "")
    print(f"\nPer-tech:")
    for tech in sorted(tech_completions.keys()):
        comp = tech_completions[tech]
        qc = tech_qc_failures.get(tech, 0)
        ret = return_by_tech.get(tech, 0)
        print(f"  {tech:15s}: {comp} completions, {qc} QC fails ({(qc/comp)*100:.1f}%), {ret} returns" if comp else f"  {tech}: 0")

    return report_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Monthly quality report")
    parser.add_argument("--month", required=True, help="Month (YYYY-MM)")
    parser.add_argument("--tech", help="Filter to specific tech name")
    args = parser.parse_args()
    generate_report(args.month, args.tech)
