#!/usr/bin/env python3
"""
RONI QC + INTAKE DIAGNOSTIC ANALYSIS
Measures:
1. QC throughput & processing time (pre vs post Feb 18)
2. BM intake diagnostic completions + time (Roni vs Adil)

Usage:
    python roni_qc_intake.py --from 2026-02-09 --to 2026-03-01
"""

import requests
import json
import argparse
import os
import time as time_module
from datetime import datetime, timedelta
from collections import defaultdict, Counter

MONDAY_API_URL = "https://api.monday.com/v2"
MAIN_BOARD_ID = "349212843"

RONI_USER_ID = "79665360"
ADIL_USER_ID = "94961618"
ROLE_CHANGE_DATE = "2026-02-18"  # Roni moved to BM intake diagnostics

# QC completion statuses (items leaving QC)
QC_PASS_STATUSES = {"Collected", "Delivered", "Ready to Collect", "Outbound Shipping",
                     "Shipped", "BMs Awaiting Sale", "Returned"}
QC_FAIL_STATUSES = {"QC Failure", "QC Failed"}

# Diagnostic completion statuses (BM intake done)
DIAG_COMPLETE_STATUSES = {"Queued For Repair", "Diagnostic Complete", "Diagnostics"}

# Statuses that indicate item entering QC
QC_ENTRY_STATUSES = {"Quality Control", "Repaired", "Part Repaired", "Refurbed"}


def load_token():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
    if not os.path.exists(env_path):
        env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
    with open(env_path) as f:
        for line in f:
            if line.startswith('MONDAY_APP_TOKEN='):
                return line.strip().split('=', 1)[1]
    raise ValueError("MONDAY_APP_TOKEN not found in .env")


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
        unix_ts = int(ts) / 10000000
        return datetime.fromtimestamp(unix_ts)
    except:
        return None


def fetch_activity_logs(board_id, user_ids, from_date, to_date, headers):
    """Fetch activity logs for multiple users"""
    all_logs = defaultdict(list)
    for user_id in user_ids:
        page = 1
        while True:
            query = f'''query {{
                boards(ids: [{board_id}]) {{
                    activity_logs(
                        user_ids: [{user_id}],
                        from: "{from_date}T00:00:00Z",
                        to: "{to_date}T23:59:59Z",
                        limit: 500,
                        page: {page}
                    ) {{
                        id event data created_at user_id
                    }}
                }}
            }}'''
            result = run_query(query, headers)
            logs = result.get("data", {}).get("boards", [{}])[0].get("activity_logs", [])
            all_logs[user_id].extend(logs)
            print(f"  User {user_id} page {page}: {len(logs)} entries")
            if len(logs) < 500:
                break
            page += 1
            time_module.sleep(0.5)
    return all_logs


def fetch_all_activity_logs(board_id, from_date, to_date, headers):
    """Fetch ALL activity logs (all users) to track item lifecycle"""
    all_logs = []
    page = 1
    while True:
        query = f'''query {{
            boards(ids: [{board_id}]) {{
                activity_logs(
                    from: "{from_date}T00:00:00Z",
                    to: "{to_date}T23:59:59Z",
                    limit: 500,
                    page: {page}
                ) {{
                    id event data created_at user_id
                }}
            }}
        }}'''
        result = run_query(query, headers)
        logs = result.get("data", {}).get("boards", [{}])[0].get("activity_logs", [])
        all_logs.extend(logs)
        print(f"  All users page {page}: {len(logs)} entries")
        if len(logs) < 500:
            break
        page += 1
        time_module.sleep(0.5)
    return all_logs


def parse_status_change(log):
    """Extract status change details from an activity log entry"""
    try:
        data = json.loads(log["data"]) if isinstance(log["data"], str) else log["data"]
        ts = parse_timestamp(log["created_at"])
        user_id = str(log.get("user_id", ""))
        pulse_id = str(data.get("pulse_id", ""))
        item_name = data.get("pulse_name", "") or data.get("item_name", "")

        value = data.get("value", {})
        prev = data.get("previous_value", {})

        if isinstance(value, dict) and "label" in value:
            new_status = value["label"].get("text", "")
        elif isinstance(value, str):
            new_status = value
        else:
            new_status = ""

        if isinstance(prev, dict) and "label" in prev:
            old_status = prev["label"].get("text", "")
        elif isinstance(prev, str):
            old_status = prev
        else:
            old_status = ""

        col_title = data.get("column_title", "")

        return {
            "ts": ts,
            "user_id": user_id,
            "pulse_id": pulse_id,
            "item_name": item_name,
            "old_status": old_status,
            "new_status": new_status,
            "col_title": col_title,
        }
    except:
        return None


def analyse_qc(all_logs_by_user, all_logs, role_change_dt):
    """Analyse Roni's QC throughput and processing time"""
    roni_logs = all_logs_by_user.get(RONI_USER_ID, [])

    # Parse all Roni status changes
    roni_changes = []
    for log in roni_logs:
        parsed = parse_status_change(log)
        if parsed and parsed["ts"] and parsed["new_status"]:
            roni_changes.append(parsed)

    # Parse ALL status changes to find when items entered QC
    all_changes = []
    for log in all_logs:
        parsed = parse_status_change(log)
        if parsed and parsed["ts"] and parsed["new_status"]:
            all_changes.append(parsed)

    # Build item timeline: when did each item enter QC (by any user)?
    item_qc_entry = {}  # pulse_id -> earliest QC entry timestamp
    for ch in all_changes:
        if ch["new_status"] in QC_ENTRY_STATUSES or ch["new_status"] == "Quality Control":
            pid = ch["pulse_id"]
            if pid and (pid not in item_qc_entry or ch["ts"] < item_qc_entry[pid]):
                # Only track the most recent entry before Roni's action
                pass
        # Track when items move TO Quality Control status
        if ch["new_status"] == "Quality Control":
            pid = ch["pulse_id"]
            if pid:
                if pid not in item_qc_entry:
                    item_qc_entry[pid] = []
                item_qc_entry[pid].append(ch["ts"])

    # Roni's QC completions: items he moved to QC_PASS or QC_FAIL statuses
    qc_events = []
    for ch in roni_changes:
        is_qc_pass = ch["new_status"] in QC_PASS_STATUSES and ch["old_status"] in (
            QC_ENTRY_STATUSES | {"Quality Control", "Under QC", ""}
        )
        is_qc_fail = ch["new_status"] in QC_FAIL_STATUSES

        # Also catch: Roni moving from Repaired/Refurbed -> Collected/Shipped (QC pass implied)
        if not is_qc_pass and ch["new_status"] in QC_PASS_STATUSES:
            is_qc_pass = True

        if is_qc_pass or is_qc_fail:
            # Find the most recent QC entry time for this item before this event
            qc_time_mins = None
            pid = ch["pulse_id"]
            if pid in item_qc_entry:
                entries = [t for t in item_qc_entry[pid] if t < ch["ts"]]
                if entries:
                    latest_entry = max(entries)
                    delta = (ch["ts"] - latest_entry).total_seconds() / 60
                    if delta < 10000:  # sanity check: less than 7 days
                        qc_time_mins = delta

            period = "pre" if ch["ts"] < role_change_dt else "post"
            qc_events.append({
                "date": ch["ts"].strftime("%Y-%m-%d"),
                "time": ch["ts"].strftime("%H:%M"),
                "item": ch["item_name"],
                "pulse_id": pid,
                "old_status": ch["old_status"],
                "new_status": ch["new_status"],
                "result": "pass" if is_qc_pass else "fail",
                "qc_time_mins": qc_time_mins,
                "period": period,
            })

    return qc_events


def analyse_bm_diagnostics(all_logs_by_user, role_change_dt):
    """Analyse BM intake diagnostic completions for Roni (post) and Adil (pre)"""
    results = {"roni": [], "adil": []}

    for person_key, user_id in [("roni", RONI_USER_ID), ("adil", ADIL_USER_ID)]:
        logs = all_logs_by_user.get(user_id, [])
        changes = []
        for log in logs:
            parsed = parse_status_change(log)
            if parsed and parsed["ts"] and parsed["new_status"]:
                changes.append(parsed)

        # Group by item
        item_events = defaultdict(list)
        for ch in changes:
            if ch["pulse_id"]:
                item_events[ch["pulse_id"]].append(ch)

        # Find diagnostic completions on BM items
        for pid, events in item_events.items():
            events.sort(key=lambda x: x["ts"])
            for ev in events:
                is_bm = "BM" in (ev["item_name"] or "").upper() or "bm " in (ev["item_name"] or "").lower()
                is_diag_complete = ev["new_status"] in DIAG_COMPLETE_STATUSES

                if is_bm and is_diag_complete:
                    # Find the earliest event for this item by this person (start of diagnostic)
                    first_event = events[0]
                    diag_time_mins = None
                    if first_event["ts"] < ev["ts"]:
                        delta = (ev["ts"] - first_event["ts"]).total_seconds() / 60
                        if delta < 1440:  # less than 24h
                            diag_time_mins = delta

                    period = "pre" if ev["ts"] < role_change_dt else "post"
                    results[person_key].append({
                        "date": ev["ts"].strftime("%Y-%m-%d"),
                        "time": ev["ts"].strftime("%H:%M"),
                        "item": ev["item_name"],
                        "pulse_id": pid,
                        "new_status": ev["new_status"],
                        "diag_time_mins": diag_time_mins,
                        "period": period,
                    })

    return results


def analyse_start_finish(logs_by_user, user_id):
    """Get daily start and finish times from activity logs"""
    logs = logs_by_user.get(user_id, [])
    daily = defaultdict(list)
    for log in logs:
        ts = parse_timestamp(log.get("created_at", ""))
        if ts:
            day = ts.strftime("%Y-%m-%d")
            daily[day].append(ts)

    result = {}
    for day, timestamps in sorted(daily.items()):
        timestamps.sort()
        result[day] = {
            "first": timestamps[0].strftime("%H:%M"),
            "last": timestamps[-1].strftime("%H:%M"),
            "events": len(timestamps),
        }
    return result


def analyse_status_summary(logs_by_user, user_id):
    """Summarise all status transitions by this user"""
    logs = logs_by_user.get(user_id, [])
    transitions = Counter()
    for log in logs:
        parsed = parse_status_change(log)
        if parsed and parsed["new_status"]:
            key = f"{parsed['old_status'] or '(none)'} → {parsed['new_status']}"
            transitions[key] += 1
    return transitions


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--from", dest="from_date", required=True)
    parser.add_argument("--to", dest="to_date", required=True)
    args = parser.parse_args()

    token = load_token()
    headers = {"Authorization": token, "Content-Type": "application/json"}
    role_change_dt = datetime.strptime(ROLE_CHANGE_DATE, "%Y-%m-%d")

    print(f"{'=' * 70}")
    print(f"RONI QC + INTAKE DIAGNOSTIC ANALYSIS")
    print(f"Period: {args.from_date} to {args.to_date}")
    print(f"Role change date: {ROLE_CHANGE_DATE}")
    print(f"{'=' * 70}")

    # 1. Fetch Roni + Adil activity logs
    print(f"\n[1/3] Fetching Roni + Adil activity logs...")
    logs_by_user = fetch_activity_logs(
        MAIN_BOARD_ID, [RONI_USER_ID, ADIL_USER_ID],
        args.from_date, args.to_date, headers
    )
    print(f"  Roni: {len(logs_by_user.get(RONI_USER_ID, []))} entries")
    print(f"  Adil: {len(logs_by_user.get(ADIL_USER_ID, []))} entries")

    # 2. Fetch ALL activity logs (for QC entry tracking)
    print(f"\n[2/3] Fetching all activity logs (for item lifecycle)...")
    all_logs = fetch_all_activity_logs(MAIN_BOARD_ID, args.from_date, args.to_date, headers)
    print(f"  Total: {len(all_logs)} entries")

    # 3. Analyse
    print(f"\n[3/3] Analysing...")

    # === RONI START/FINISH TIMES ===
    roni_times = analyse_start_finish(logs_by_user, RONI_USER_ID)
    print(f"\n{'=' * 70}")
    print(f"RONI — DAILY START/FINISH TIMES")
    print(f"{'=' * 70}")
    for day, info in sorted(roni_times.items()):
        dow = datetime.strptime(day, "%Y-%m-%d").strftime("%a")
        marker = " *** ROLE CHANGE" if day == ROLE_CHANGE_DATE else ""
        print(f"  {day} ({dow}): {info['first']} – {info['last']}  ({info['events']} events){marker}")

    # === RONI STATUS TRANSITIONS SUMMARY ===
    roni_transitions = analyse_status_summary(logs_by_user, RONI_USER_ID)
    print(f"\n{'=' * 70}")
    print(f"RONI — ALL STATUS TRANSITIONS (top 30)")
    print(f"{'=' * 70}")
    for trans, count in roni_transitions.most_common(30):
        print(f"  {count:4d}x  {trans}")

    # === QC ANALYSIS ===
    qc_events = analyse_qc(logs_by_user, all_logs, role_change_dt)
    print(f"\n{'=' * 70}")
    print(f"RONI — QC ANALYSIS")
    print(f"{'=' * 70}")
    print(f"Total QC events: {len(qc_events)}")

    pre_qc = [e for e in qc_events if e["period"] == "pre"]
    post_qc = [e for e in qc_events if e["period"] == "post"]

    for label, events in [("PRE Feb 18 (QC only)", pre_qc), ("POST Feb 18 (QC + Intake)", post_qc)]:
        passes = [e for e in events if e["result"] == "pass"]
        fails = [e for e in events if e["result"] == "fail"]
        timed = [e for e in events if e["qc_time_mins"] is not None]

        days = len(set(e["date"] for e in events)) or 1
        print(f"\n  {label}:")
        print(f"    Items QC'd: {len(events)} ({len(events)/days:.1f}/day over {days} days)")
        print(f"    Passed: {len(passes)}, Failed: {len(fails)}")
        if len(events) > 0:
            print(f"    Fail rate: {len(fails)/len(events)*100:.1f}%")
        if timed:
            times = [e["qc_time_mins"] for e in timed]
            print(f"    QC time (with entry data): median {sorted(times)[len(times)//2]:.0f} min, "
                  f"avg {sum(times)/len(times):.0f} min, range {min(times):.0f}–{max(times):.0f} min")
            print(f"    (based on {len(timed)} items with measurable entry→exit time)")

    # Daily QC breakdown
    print(f"\n  Daily QC breakdown:")
    qc_by_day = defaultdict(lambda: {"pass": 0, "fail": 0})
    for e in qc_events:
        qc_by_day[e["date"]][e["result"]] += 1
    for day in sorted(qc_by_day.keys()):
        dow = datetime.strptime(day, "%Y-%m-%d").strftime("%a")
        d = qc_by_day[day]
        total = d["pass"] + d["fail"]
        marker = " *** ROLE CHANGE" if day == ROLE_CHANGE_DATE else ""
        print(f"    {day} ({dow}): {total} QC'd (pass: {d['pass']}, fail: {d['fail']}){marker}")

    # === BM INTAKE DIAGNOSTICS ===
    diag_results = analyse_bm_diagnostics(logs_by_user, role_change_dt)
    print(f"\n{'=' * 70}")
    print(f"BM INTAKE DIAGNOSTICS — RONI vs ADIL")
    print(f"{'=' * 70}")

    for person_key, person_name in [("roni", "Roni"), ("adil", "Adil")]:
        events = diag_results[person_key]
        pre = [e for e in events if e["period"] == "pre"]
        post = [e for e in events if e["period"] == "post"]

        print(f"\n  {person_name}:")
        for label, evts in [("Pre Feb 18", pre), ("Post Feb 18", post)]:
            if not evts:
                print(f"    {label}: 0 diagnostics")
                continue
            days = len(set(e["date"] for e in evts)) or 1
            timed = [e for e in evts if e["diag_time_mins"] is not None]
            print(f"    {label}: {len(evts)} diagnostics ({len(evts)/days:.1f}/day over {days} days)")
            if timed:
                times = [e["diag_time_mins"] for e in timed]
                print(f"      Time per diagnostic: median {sorted(times)[len(times)//2]:.0f} min, "
                      f"avg {sum(times)/len(times):.0f} min")

        # List items
        if events:
            print(f"\n    All BM diagnostic completions by {person_name}:")
            for e in sorted(events, key=lambda x: x["date"]):
                time_str = f" ({e['diag_time_mins']:.0f} min)" if e["diag_time_mins"] else ""
                print(f"      [{e['date']} {e['time']}] {e['item']} → {e['new_status']}{time_str}")

    # === ADIL STATUS TRANSITIONS ===
    adil_transitions = analyse_status_summary(logs_by_user, ADIL_USER_ID)
    print(f"\n{'=' * 70}")
    print(f"ADIL — ALL STATUS TRANSITIONS (top 20)")
    print(f"{'=' * 70}")
    for trans, count in adil_transitions.most_common(20):
        print(f"  {count:4d}x  {trans}")

    # === ADIL START/FINISH TIMES ===
    adil_times = analyse_start_finish(logs_by_user, ADIL_USER_ID)
    print(f"\n{'=' * 70}")
    print(f"ADIL — DAILY START/FINISH TIMES")
    print(f"{'=' * 70}")
    for day, info in sorted(adil_times.items()):
        dow = datetime.strptime(day, "%Y-%m-%d").strftime("%a")
        print(f"  {day} ({dow}): {info['first']} – {info['last']}  ({info['events']} events)")


if __name__ == "__main__":
    main()
