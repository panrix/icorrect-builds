import requests
import json
from datetime import datetime, timedelta
from collections import defaultdict

MONDAY_APP_TOKEN = "MONDAY_TOKEN_REDACTED"
MONDAY_API_URL = "https://api.monday.com/v2"
MAIN_BOARD_ID = "349212843"

# User IDs from previous query
ADIL_ID = "94961618"
USERS = {
    "1034414": "Ricky Panesar",
    "11140118": "Mike McAdam",
    "12304876": "Systems Manager",
    "25304513": "Safan Patel",
    "32191305": "Client Services",
    "49001724": "Andres Egas",
    "55780786": "Michael Ferrari",
    "64642914": "Mykhailo Kepeshchuk",
    "65573508": "Maksym Shtanko",
    "79665360": "Roni Mykhailiuk",
    "82907599": "Vishva Thacker",
    "94961618": "Adil Azad"
}

headers = {"Authorization": MONDAY_APP_TOKEN, "Content-Type": "application/json"}

def run_query(query):
    response = requests.post(MONDAY_API_URL, json={"query": query}, headers=headers)
    return response.json()

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
print("ADIL'S DEEP ACTIVITY ANALYSIS")
print("=" * 70)
print(f"Week: {last_monday.strftime('%A %d %b')} - {last_sunday.strftime('%A %d %b %Y')}")

# ============================================================
# Parse time in HH:MM:SS format to minutes
# ============================================================
def parse_time_to_mins(time_str):
    if not time_str:
        return 0
    try:
        # Format: HH:MM:SS or H:MM:SS
        parts = time_str.split(':')
        if len(parts) == 3:
            hours = int(parts[0])
            mins = int(parts[1])
            secs = int(parts[2])
            return hours * 60 + mins + secs / 60
        elif len(parts) == 2:
            mins = int(parts[0])
            secs = int(parts[1])
            return mins + secs / 60
    except:
        pass
    return 0

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
# Get all BM trade-ins with full time tracking data
# ============================================================
print("\n" + "-" * 70)
print("Fetching BM trade-in items with full time data...")
print("-" * 70)

# Include more time columns and the diagnostic person column
items_query = f"""
query {{
    boards(ids: [{MAIN_BOARD_ID}]) {{
        items_page(limit: 500) {{
            cursor
            items {{
                id
                name
                column_values(ids: [
                    "status", "service", "date4", "color_mkypbg6z",
                    "time_tracking", "time_tracking9", "time_tracking93", "time_tracking98",
                    "multiple_person_mkwqj321", "date_mkypmgfc", "multiple_person_mkyp6fdz"
                ]) {{
                    id
                    text
                    value
                }}
            }}
        }}
    }}
}}
"""

result = run_query(items_query)
all_items = result.get("data", {}).get("boards", [{}])[0].get("items_page", {}).get("items", [])

# Paginate
cursor = result.get("data", {}).get("boards", [{}])[0].get("items_page", {}).get("cursor")
while cursor:
    next_query = f"""
    query {{
        next_items_page(cursor: "{cursor}", limit: 500) {{
            cursor
            items {{
                id
                name
                column_values(ids: [
                    "status", "service", "date4", "color_mkypbg6z",
                    "time_tracking", "time_tracking9", "time_tracking93", "time_tracking98",
                    "multiple_person_mkwqj321", "date_mkypmgfc", "multiple_person_mkyp6fdz"
                ]) {{
                    id
                    text
                    value
                }}
            }}
        }}
    }}
    """
    next_result = run_query(next_query)
    page_data = next_result.get("data", {}).get("next_items_page", {})
    all_items.extend(page_data.get("items", []))
    cursor = page_data.get("cursor")

print(f"Total items retrieved: {len(all_items)}")

# Filter to BM trade-ins from last week
bm_tradeins = []

for item in all_items:
    client = get_col(item, "status")
    trade_in_status = get_col(item, "color_mkypbg6z")
    received_date = parse_date(get_col(item, "date4"))

    if client == "BM" and trade_in_status == "Trade-in" and is_in_last_week(received_date):
        diag_time_str = get_col(item, "time_tracking")
        repair_time_str = get_col(item, "time_tracking9")
        refurb_time_str = get_col(item, "time_tracking93")
        total_time_str = get_col(item, "time_tracking98")

        diag_person = get_col(item, "multiple_person_mkwqj321")
        intake_person = get_col(item, "multiple_person_mkyp6fdz")
        intake_timestamp = get_col(item, "date_mkypmgfc")

        bm_tradeins.append({
            "id": item["id"],
            "name": item["name"],
            "received": get_col(item, "date4"),
            "diag_time_str": diag_time_str,
            "diag_mins": parse_time_to_mins(diag_time_str),
            "repair_time_str": repair_time_str,
            "repair_mins": parse_time_to_mins(repair_time_str),
            "refurb_time_str": refurb_time_str,
            "refurb_mins": parse_time_to_mins(refurb_time_str),
            "total_time_str": total_time_str,
            "total_mins": parse_time_to_mins(total_time_str),
            "diagnostic_by": diag_person,
            "intake_by": intake_person,
            "intake_timestamp": intake_timestamp
        })

print(f"BM trade-ins from last week: {len(bm_tradeins)}")

# ============================================================
# Analyze diagnostic times
# ============================================================
print("\n" + "=" * 70)
print("BM TRADE-IN DIAGNOSTIC TIME ANALYSIS")
print("=" * 70)

# Sort by received date
bm_tradeins.sort(key=lambda x: x["received"])

# Calculate stats
diag_times = [item["diag_mins"] for item in bm_tradeins if item["diag_mins"] > 0]

print(f"\nItems with diagnostic time logged: {len(diag_times)}/{len(bm_tradeins)}")

if diag_times:
    avg_diag = sum(diag_times) / len(diag_times)
    min_diag = min(diag_times)
    max_diag = max(diag_times)
    median_diag = sorted(diag_times)[len(diag_times)//2]

    print(f"\nDiagnostic Time Statistics:")
    print(f"  Average:  {avg_diag:.1f} min")
    print(f"  Median:   {median_diag:.1f} min")
    print(f"  Min:      {min_diag:.1f} min")
    print(f"  Max:      {max_diag:.1f} min")
    print(f"  Total:    {sum(diag_times):.0f} min ({sum(diag_times)/60:.1f} hrs)")

# ============================================================
# Breakdown by person
# ============================================================
print("\n" + "-" * 70)
print("BREAKDOWN BY DIAGNOSTIC TECHNICIAN")
print("-" * 70)

by_person = defaultdict(list)
for item in bm_tradeins:
    person = item["diagnostic_by"] or "Not assigned"
    by_person[person].append(item)

for person, items in sorted(by_person.items(), key=lambda x: -len(x[1])):
    person_diag_times = [i["diag_mins"] for i in items if i["diag_mins"] > 0]
    total_diag = sum(person_diag_times)
    avg_diag = total_diag / len(person_diag_times) if person_diag_times else 0

    print(f"\n{person}: {len(items)} items")
    print(f"  Items with time logged: {len(person_diag_times)}")
    if person_diag_times:
        print(f"  Total diagnostic time: {total_diag:.0f} min ({total_diag/60:.1f} hrs)")
        print(f"  Average per item: {avg_diag:.1f} min")

    print(f"\n  Individual items:")
    for item in items:
        received = item["received"][:10] if item["received"] else "N/A"
        diag = f"{item['diag_mins']:.0f} min" if item["diag_mins"] > 0 else "N/A"
        print(f"    {item['name'][:35]:<35} | Rcvd: {received} | Diag: {diag}")

# ============================================================
# Check intake data
# ============================================================
print("\n" + "-" * 70)
print("INTAKE BREAKDOWN (Who processed incoming devices)")
print("-" * 70)

by_intake = defaultdict(list)
for item in bm_tradeins:
    person = item["intake_by"] or "Not logged"
    by_intake[person].append(item)

for person, items in sorted(by_intake.items(), key=lambda x: -len(x[1])):
    print(f"\n{person}: {len(items)} intakes")
    for item in items:
        received = item["received"][:10] if item["received"] else "N/A"
        timestamp = item["intake_timestamp"][:16] if item["intake_timestamp"] else "N/A"
        print(f"    {item['name'][:35]:<35} | Rcvd: {received} | Intake: {timestamp}")

# ============================================================
# Daily pattern analysis
# ============================================================
print("\n" + "=" * 70)
print("DAILY PATTERN ANALYSIS")
print("=" * 70)

daily_breakdown = defaultdict(lambda: {
    "items": [],
    "total_diag_mins": 0,
    "by_person": defaultdict(list)
})

for item in bm_tradeins:
    day = item["received"][:10] if item["received"] else "Unknown"
    daily_breakdown[day]["items"].append(item)
    daily_breakdown[day]["total_diag_mins"] += item["diag_mins"]

    person = item["diagnostic_by"] or "Not assigned"
    daily_breakdown[day]["by_person"][person].append(item)

for day in sorted(daily_breakdown.keys()):
    data = daily_breakdown[day]
    try:
        day_name = datetime.strptime(day, "%Y-%m-%d").strftime("%A %d %b")
    except:
        day_name = day

    print(f"\n{day_name}:")
    print(f"  Total BM trade-ins: {len(data['items'])}")
    print(f"  Total diagnostic time: {data['total_diag_mins']:.0f} min")

    print(f"  By person:")
    for person, items in data["by_person"].items():
        person_time = sum(i["diag_mins"] for i in items)
        print(f"    {person}: {len(items)} items, {person_time:.0f} min")

# ============================================================
# Comparison: Estimated vs Actual
# ============================================================
print("\n" + "=" * 70)
print("ESTIMATED vs ACTUAL COMPARISON")
print("=" * 70)

estimated_per_item = 20  # Our original estimate
estimated_total = len(bm_tradeins) * estimated_per_item
actual_total = sum(diag_times) if diag_times else 0

print(f"""
BM TRADE-IN DIAGNOSTICS ({len(bm_tradeins)} items):

  ESTIMATED:
    Time per item:    {estimated_per_item} min (our assumption)
    Total time:       {estimated_total} min ({estimated_total/60:.1f} hrs)

  ACTUAL (from logged items):
    Items with time:  {len(diag_times)}/{len(bm_tradeins)}
    Avg per item:     {avg_diag:.1f} min (vs {estimated_per_item} estimated)
    Total logged:     {actual_total:.0f} min ({actual_total/60:.1f} hrs)
""")

if avg_diag > estimated_per_item:
    pct_higher = ((avg_diag - estimated_per_item) / estimated_per_item) * 100
    print(f"  ⚠ ACTUAL IS {pct_higher:.0f}% HIGHER THAN ESTIMATED")
    print(f"    Estimated {estimated_per_item} min, but actually taking {avg_diag:.1f} min on average")

    # Recalculate utilization with actual times
    corrected_diag_time = len(bm_tradeins) * avg_diag
    print(f"\n  CORRECTED WEEKLY DIAGNOSTIC TIME:")
    print(f"    {corrected_diag_time:.0f} min ({corrected_diag_time/60:.1f} hrs)")
    print(f"    vs estimated {estimated_total} min ({estimated_total/60:.1f} hrs)")
    print(f"    Difference: +{corrected_diag_time - estimated_total:.0f} min (+{(corrected_diag_time - estimated_total)/60:.1f} hrs)")
else:
    pct_lower = ((estimated_per_item - avg_diag) / estimated_per_item) * 100
    print(f"  ✓ Actual is {pct_lower:.0f}% lower than estimated")

# ============================================================
# Who is Adil vs others?
# ============================================================
print("\n" + "=" * 70)
print("ADIL'S SHARE vs OTHERS")
print("=" * 70)

adil_items = by_person.get("Adil Azad", [])
adil_diag_time = sum(i["diag_mins"] for i in adil_items if i["diag_mins"] > 0)
adil_intake = by_intake.get("Adil Azad", [])

others_items = sum(len(items) for person, items in by_person.items() if person != "Adil Azad")
others_diag_time = sum(sum(i["diag_mins"] for i in items if i["diag_mins"] > 0)
                       for person, items in by_person.items() if person != "Adil Azad")

print(f"""
DIAGNOSTICS:
  Adil:
    Items:          {len(adil_items)}
    Diag time:      {adil_diag_time:.0f} min ({adil_diag_time/60:.1f} hrs)

  Others (Andres, Mykhailo, Safan, etc.):
    Items:          {others_items}
    Diag time:      {others_diag_time:.0f} min ({others_diag_time/60:.1f} hrs)

INTAKES:
  Adil processed:   {len(adil_intake)} intakes

CONCLUSION:
  Adil did {len(adil_items)}/{len(bm_tradeins)} ({100*len(adil_items)/len(bm_tradeins):.0f}%) of BM trade-in diagnostics
  Others helped with {others_items}/{len(bm_tradeins)} ({100*others_items/len(bm_tradeins):.0f}%)
""")
