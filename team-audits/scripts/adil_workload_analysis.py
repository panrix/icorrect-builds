import requests
import json
from datetime import datetime, timedelta
from collections import defaultdict

API_KEY = "MONDAY_TOKEN_REDACTED"
API_URL = "https://api.monday.com/v2"

MAIN_BOARD_ID = "349212843"
WALK_INS_BOARD_ID = "4752037048"

# Time estimates (in minutes)
TIME_RECEPTION_INTERACTION = 12.5  # 10-15 min avg
TIME_MAILIN_UNBOX = 4  # 3-5 min avg
TIME_BM_TRADEIN_DIAGNOSTIC = 20  # 15-25 min avg
TIME_POTENTIAL_PREDIAG = 12.5  # 10-15 min proposed

# Last week date range
today = datetime.now()
days_since_monday = today.weekday()
if days_since_monday == 0:
    last_monday = today - timedelta(days=7)
else:
    last_monday = today - timedelta(days=days_since_monday + 7)
last_sunday = last_monday + timedelta(days=6)

last_week_start = last_monday.strftime("%Y-%m-%d")
last_week_end = last_sunday.strftime("%Y-%m-%d")

print("=" * 70)
print("ADIL'S WORKLOAD ANALYSIS - INTAKE CAPACITY MAPPING")
print("=" * 70)
print(f"Week: {last_monday.strftime('%A %d %b')} - {last_sunday.strftime('%A %d %b %Y')}")

headers = {"Authorization": API_KEY, "Content-Type": "application/json"}

def run_query(query):
    response = requests.post(API_URL, json={"query": query}, headers=headers)
    return response.json()

def get_all_items(board_id, columns):
    all_items = []
    cursor = None
    while True:
        if cursor:
            query = f'''query {{ next_items_page(cursor: "{cursor}", limit: 500) {{ cursor items {{ id name created_at column_values(ids: {json.dumps(columns)}) {{ id text }} }} }} }}'''
        else:
            query = f'''query {{ boards(ids: [{board_id}]) {{ items_page(limit: 500) {{ cursor items {{ id name created_at column_values(ids: {json.dumps(columns)}) {{ id text }} }} }} }} }}'''

        result = run_query(query)
        if "errors" in result:
            print(f"Error: {result['errors']}")
            break

        page_data = result.get("data", {}).get("next_items_page", {}) if cursor else result.get("data", {}).get("boards", [{}])[0].get("items_page", {})
        items = page_data.get("items", [])
        all_items.extend(items)
        cursor = page_data.get("cursor")
        if not cursor or not items:
            break
    return all_items

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str[:10], "%Y-%m-%d").date()
    except:
        return None

def is_in_last_week(date_val):
    if not date_val:
        return False
    start = datetime.strptime(last_week_start, "%Y-%m-%d").date()
    end = datetime.strptime(last_week_end, "%Y-%m-%d").date()
    return start <= date_val <= end

def get_col(item, col_id):
    for cv in item.get("column_values", []):
        if cv["id"] == col_id:
            return cv.get("text", "")
    return ""

# ============================================================
# FETCH DATA
# ============================================================
print("\nFetching data from Monday.com...")

# Main Board columns: status (Client), service, date4 (Received), color_mkypbg6z (Trade-in Status)
main_cols = ["status", "service", "date4", "color_mkypbg6z"]
main_items = get_all_items(MAIN_BOARD_ID, main_cols)
print(f"  Main Board items: {len(main_items)}")

# TypeForm board
walkin_items = get_all_items(WALK_INS_BOARD_ID, ["status4"])
print(f"  TypeForm Walk-ins board items: {len(walkin_items)}")

# ============================================================
# 1. DEVICES RECEIVED (Main Board) - Actual devices Adil processes
# ============================================================
print("\n" + "=" * 70)
print("SECTION 1: DEVICES RECEIVED (Physical devices Adil processes)")
print("=" * 70)

# Data structures for daily breakdown
daily_data = defaultdict(lambda: {
    "bm_tradeins": [],
    "mailin_bm": [],
    "mailin_normal": [],
    "walkin_repairs": []
})

for item in main_items:
    client = get_col(item, "status")
    service = get_col(item, "service")
    trade_in_status = get_col(item, "color_mkypbg6z")
    received_date = parse_date(get_col(item, "date4"))

    if not is_in_last_week(received_date):
        continue

    # BM Trade-ins (Client=BM, Trade-in Status=Trade-in)
    if client == "BM" and trade_in_status == "Trade-in":
        daily_data[received_date]["bm_tradeins"].append(item["name"])

    # Mail-ins (Service=Mail-In)
    elif service == "Mail-In":
        if client == "BM":
            daily_data[received_date]["mailin_bm"].append(item["name"])
        else:
            daily_data[received_date]["mailin_normal"].append(item["name"])

    # Walk-in repairs (Service=Walk-In) - these are converted enquiries
    elif service == "Walk-In":
        daily_data[received_date]["walkin_repairs"].append(item["name"])

# Totals
total_bm_tradeins = 0
total_mailin_bm = 0
total_mailin_normal = 0
total_walkin_repairs = 0

sorted_days = sorted(daily_data.keys())

print("\nDAILY BREAKDOWN - Devices Received:")
print("-" * 60)

for day in sorted_days:
    d = daily_data[day]
    bm_ti = len(d["bm_tradeins"])
    mi_bm = len(d["mailin_bm"])
    mi_norm = len(d["mailin_normal"])
    wi = len(d["walkin_repairs"])

    total_bm_tradeins += bm_ti
    total_mailin_bm += mi_bm
    total_mailin_normal += mi_norm
    total_walkin_repairs += wi

    day_total = bm_ti + mi_bm + mi_norm + wi
    print(f"\n{day.strftime('%A %d %b')} - {day_total} devices")
    print(f"  BM Trade-ins:      {bm_ti:>3}  (diagnostic: {bm_ti * TIME_BM_TRADEIN_DIAGNOSTIC:.0f} min)")
    print(f"  Mail-in (BM):      {mi_bm:>3}  (unbox/log: {mi_bm * TIME_MAILIN_UNBOX:.0f} min)")
    print(f"  Mail-in (Normal):  {mi_norm:>3}  (unbox/log: {mi_norm * TIME_MAILIN_UNBOX:.0f} min)")
    print(f"  Walk-in repairs:   {wi:>3}  (converted enquiries)")

total_devices = total_bm_tradeins + total_mailin_bm + total_mailin_normal + total_walkin_repairs
total_mailins = total_mailin_bm + total_mailin_normal

print(f"\n{'WEEKLY TOTALS':=^60}")
print(f"  BM Trade-ins:         {total_bm_tradeins:>4}  (Your estimate: 27)")
print(f"  Mail-ins (BM):        {total_mailin_bm:>4}")
print(f"  Mail-ins (Normal):    {total_mailin_normal:>4}")
print(f"  Walk-in repairs:      {total_walkin_repairs:>4}  (converted to actual repairs)")
print(f"  {'─' * 30}")
print(f"  TOTAL DEVICES:        {total_devices:>4}")

# ============================================================
# 2. CLIENT VISITS (TypeForm iPad) - Foot traffic
# ============================================================
print("\n" + "=" * 70)
print("SECTION 2: CLIENT VISITS (Foot traffic - iPad TypeForm)")
print("=" * 70)

daily_visits = defaultdict(lambda: defaultdict(list))

for item in walkin_items:
    created_date = parse_date(item.get("created_at", ""))
    form_type = get_col(item, "status4") or "Unknown"

    if is_in_last_week(created_date):
        daily_visits[created_date][form_type].append(item["name"])

print("\nDAILY BREAKDOWN - Client Visits:")
print("-" * 60)

form_totals = defaultdict(int)
total_visits = 0

for day in sorted(daily_visits.keys()):
    forms = daily_visits[day]
    day_total = sum(len(v) for v in forms.values())
    total_visits += day_total

    print(f"\n{day.strftime('%A %d %b')} - {day_total} visitors ({day_total * TIME_RECEPTION_INTERACTION:.0f} min)")
    for ft in sorted(forms.keys()):
        cnt = len(forms[ft])
        form_totals[ft] += cnt
        print(f"  {ft}: {cnt}")

print(f"\n{'WEEKLY TOTALS':=^60}")
print(f"  TOTAL CLIENT VISITS:  {total_visits:>4}")
print("\n  By Form Type:")
for ft, cnt in sorted(form_totals.items(), key=lambda x: -x[1]):
    print(f"    {ft}: {cnt}")

# ============================================================
# 3. WORKLOAD TIME CALCULATION
# ============================================================
print("\n" + "=" * 70)
print("SECTION 3: CURRENT WORKLOAD TIME ANALYSIS")
print("=" * 70)

# Current workload
time_bm_diag = total_bm_tradeins * TIME_BM_TRADEIN_DIAGNOSTIC
time_mailin_unbox = total_mailins * TIME_MAILIN_UNBOX
time_reception = total_visits * TIME_RECEPTION_INTERACTION

current_total_mins = time_bm_diag + time_mailin_unbox + time_reception
current_total_hrs = current_total_mins / 60

working_days = len(sorted_days) if sorted_days else 5
daily_avg_mins = current_total_mins / working_days if working_days > 0 else 0
daily_avg_hrs = daily_avg_mins / 60

print(f"\nCURRENT WEEKLY WORKLOAD:")
print("-" * 50)
print(f"  BM Trade-in diagnostics:    {time_bm_diag:>6.0f} min  ({total_bm_tradeins} × {TIME_BM_TRADEIN_DIAGNOSTIC} min)")
print(f"  Mail-in unboxing/logging:   {time_mailin_unbox:>6.0f} min  ({total_mailins} × {TIME_MAILIN_UNBOX} min)")
print(f"  Reception interactions:     {time_reception:>6.0f} min  ({total_visits} × {TIME_RECEPTION_INTERACTION} min)")
print(f"  {'─' * 40}")
print(f"  TOTAL WEEKLY:               {current_total_mins:>6.0f} min  ({current_total_hrs:.1f} hrs)")
print(f"  DAILY AVERAGE:              {daily_avg_mins:>6.0f} min  ({daily_avg_hrs:.1f} hrs)")

# ============================================================
# 4. CAPACITY ANALYSIS - Adding Pre-Diagnostics
# ============================================================
print("\n" + "=" * 70)
print("SECTION 4: CAPACITY ANALYSIS - Adding Pre-Diagnostics")
print("=" * 70)

# Non-BM devices that could get pre-diagnostics
non_bm_devices = total_mailin_normal + total_walkin_repairs
additional_prediag_time = non_bm_devices * TIME_POTENTIAL_PREDIAG

new_total_mins = current_total_mins + additional_prediag_time
new_total_hrs = new_total_mins / 60
new_daily_avg_mins = new_total_mins / working_days if working_days > 0 else 0
new_daily_avg_hrs = new_daily_avg_mins / 60

print(f"\nIF ADDING PRE-DIAGNOSTICS (10-15 min) FOR NON-BM DEVICES:")
print("-" * 50)
print(f"  Non-BM devices eligible:    {non_bm_devices:>4}")
print(f"    - Mail-in (Normal):       {total_mailin_normal:>4}")
print(f"    - Walk-in repairs:        {total_walkin_repairs:>4}")
print(f"\n  Additional time needed:     {additional_prediag_time:>6.0f} min  ({non_bm_devices} × {TIME_POTENTIAL_PREDIAG} min)")
print(f"\n  NEW WEEKLY TOTAL:           {new_total_mins:>6.0f} min  ({new_total_hrs:.1f} hrs)")
print(f"  NEW DAILY AVERAGE:          {new_daily_avg_mins:>6.0f} min  ({new_daily_avg_hrs:.1f} hrs)")

# Assuming 8-hour workday
available_daily_mins = 8 * 60
utilization_current = (daily_avg_mins / available_daily_mins) * 100
utilization_new = (new_daily_avg_mins / available_daily_mins) * 100

print(f"\n{'CAPACITY UTILIZATION':=^50}")
print(f"  Available per day (8hr):    {available_daily_mins:>6.0f} min")
print(f"  Current utilization:        {utilization_current:>6.1f}%")
print(f"  With pre-diagnostics:       {utilization_new:>6.1f}%")
print(f"  Remaining capacity:         {available_daily_mins - new_daily_avg_mins:>6.0f} min/day")

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "=" * 70)
print("EXECUTIVE SUMMARY")
print("=" * 70)

print(f"""
LAST WEEK ({last_week_start} to {last_week_end}):

DEVICES PROCESSED:
  • BM Trade-ins received:     {total_bm_tradeins} devices
  • Mail-ins (total):          {total_mailins} devices (BM: {total_mailin_bm}, Normal: {total_mailin_normal})
  • Walk-in repairs:           {total_walkin_repairs} devices (converted enquiries)
  • TOTAL DEVICES:             {total_devices} devices

CLIENT VISITS (foot traffic):
  • Total iPad submissions:    {total_visits} visitors
  • Form breakdown:""")
for ft, cnt in sorted(form_totals.items(), key=lambda x: -x[1]):
    print(f"      - {ft}: {cnt}")

print(f"""
ADIL'S TIME:
  • Current weekly workload:   {current_total_hrs:.1f} hrs ({daily_avg_hrs:.1f} hrs/day)
  • Current utilization:       {utilization_current:.0f}%

  • With pre-diagnostics:      {new_total_hrs:.1f} hrs ({new_daily_avg_hrs:.1f} hrs/day)
  • New utilization:           {utilization_new:.0f}%

RECOMMENDATION:
  Adding {TIME_POTENTIAL_PREDIAG:.0f}-min pre-diagnostics to {non_bm_devices} non-BM devices
  would add {additional_prediag_time:.0f} min/week ({additional_prediag_time/60:.1f} hrs).
""")

if utilization_new < 85:
    print("  ✓ Adil appears to have capacity for pre-diagnostics.")
elif utilization_new < 100:
    print("  ⚠ Tight but feasible - may need efficiency improvements.")
else:
    print("  ✗ Would exceed capacity - need additional support or process changes.")
