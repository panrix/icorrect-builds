import requests
import json
from datetime import datetime, timedelta
from collections import defaultdict

MONDAY_APP_TOKEN = "MONDAY_TOKEN_REDACTED"
MONDAY_API_URL = "https://api.monday.com/v2"
MAIN_BOARD_ID = "349212843"

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
print("ADIL'S ACTIVITY LOG ANALYSIS")
print("=" * 70)
print(f"Week: {last_monday.strftime('%A %d %b')} - {last_sunday.strftime('%A %d %b %Y')}")

# ============================================================
# STEP 1: Get all users to find Adil
# ============================================================
print("\n" + "-" * 70)
print("Step 1: Finding Adil's user ID...")
print("-" * 70)

users_query = """
query {
    users {
        id
        name
        email
    }
}
"""

users_result = run_query(users_query)
users = users_result.get("data", {}).get("users", [])

print("\nAll users in workspace:")
adil_id = None
for user in users:
    print(f"  {user['id']}: {user['name']} ({user.get('email', 'no email')})")
    if "adil" in user['name'].lower():
        adil_id = user['id']
        print(f"    ^ Found Adil!")

if not adil_id:
    print("\nCouldn't find Adil automatically. Looking for similar names...")
    for user in users:
        name_lower = user['name'].lower()
        if any(x in name_lower for x in ['adil', 'intake', 'reception']):
            print(f"  Possible match: {user['name']} (ID: {user['id']})")

# ============================================================
# STEP 2: Get the BM trade-in items from last week
# ============================================================
print("\n" + "-" * 70)
print("Step 2: Getting BM trade-in items from last week...")
print("-" * 70)

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

# Get items with relevant columns
items_query = f"""
query {{
    boards(ids: [{MAIN_BOARD_ID}]) {{
        items_page(limit: 500) {{
            cursor
            items {{
                id
                name
                column_values(ids: ["status", "service", "date4", "color_mkypbg6z"]) {{
                    id
                    text
                }}
            }}
        }}
    }}
}}
"""

result = run_query(items_query)
all_items = result.get("data", {}).get("boards", [{}])[0].get("items_page", {}).get("items", [])

# Paginate if needed
cursor = result.get("data", {}).get("boards", [{}])[0].get("items_page", {}).get("cursor")
while cursor:
    next_query = f"""
    query {{
        next_items_page(cursor: "{cursor}", limit: 500) {{
            cursor
            items {{
                id
                name
                column_values(ids: ["status", "service", "date4", "color_mkypbg6z"]) {{
                    id
                    text
                }}
            }}
        }}
    }}
    """
    next_result = run_query(next_query)
    page_data = next_result.get("data", {}).get("next_items_page", {})
    all_items.extend(page_data.get("items", []))
    cursor = page_data.get("cursor")

# Filter to last week's items
bm_tradein_items = []
mailin_items = []
walkin_items = []

for item in all_items:
    client = get_col(item, "status")
    service = get_col(item, "service")
    trade_in_status = get_col(item, "color_mkypbg6z")
    received_date = parse_date(get_col(item, "date4"))

    if not is_in_last_week(received_date):
        continue

    if client == "BM" and trade_in_status == "Trade-in":
        bm_tradein_items.append(item)
    elif service == "Mail-In":
        mailin_items.append(item)
    elif service == "Walk-In":
        walkin_items.append(item)

print(f"\nItems from last week:")
print(f"  BM Trade-ins: {len(bm_tradein_items)}")
print(f"  Mail-ins: {len(mailin_items)}")
print(f"  Walk-ins: {len(walkin_items)}")

# ============================================================
# STEP 3: Get activity logs for these items
# ============================================================
print("\n" + "-" * 70)
print("Step 3: Fetching activity logs for BM trade-in items...")
print("-" * 70)

# Combine all item IDs we want to analyze
all_item_ids = [item["id"] for item in bm_tradein_items + mailin_items + walkin_items]

print(f"\nTotal items to analyze: {len(all_item_ids)}")

# Get activity logs for each item
# Monday's activity_logs requires board_id
activity_query = f"""
query {{
    boards(ids: [{MAIN_BOARD_ID}]) {{
        activity_logs(limit: 1000) {{
            id
            event
            data
            created_at
            user_id
        }}
    }}
}}
"""

print("\nFetching board activity logs...")
activity_result = run_query(activity_query)

if "errors" in activity_result:
    print(f"Error: {activity_result['errors']}")
else:
    activities = activity_result.get("data", {}).get("boards", [{}])[0].get("activity_logs", [])
    print(f"Total activity logs retrieved: {len(activities)}")

    if activities:
        print("\nSample activity log entry:")
        sample = activities[0]
        print(f"  Event: {sample.get('event')}")
        print(f"  Created at: {sample.get('created_at')}")
        print(f"  User ID: {sample.get('user_id')}")
        print(f"  Data: {sample.get('data', '')[:200]}...")

# ============================================================
# STEP 4: Alternative - Check time tracking columns
# ============================================================
print("\n" + "-" * 70)
print("Step 4: Checking time tracking data on items...")
print("-" * 70)

# The board has time tracking columns - let's check those
# time_tracking98 = Total Time
# time_tracking = Diagnostic Time
# time_tracking9 = Repair Time
# time_tracking93 = Refurb Time

time_cols_query = f"""
query {{
    boards(ids: [{MAIN_BOARD_ID}]) {{
        items_page(limit: 500) {{
            items {{
                id
                name
                column_values(ids: ["status", "service", "date4", "color_mkypbg6z", "time_tracking", "time_tracking98", "multiple_person_mkwqj321"]) {{
                    id
                    text
                    value
                }}
            }}
        }}
    }}
}}
"""

time_result = run_query(time_cols_query)
time_items = time_result.get("data", {}).get("boards", [{}])[0].get("items_page", {}).get("items", [])

# Paginate
cursor = time_result.get("data", {}).get("boards", [{}])[0].get("items_page", {}).get("cursor")
while cursor:
    next_query = f"""
    query {{
        next_items_page(cursor: "{cursor}", limit: 500) {{
            cursor
            items {{
                id
                name
                column_values(ids: ["status", "service", "date4", "color_mkypbg6z", "time_tracking", "time_tracking98", "multiple_person_mkwqj321"]) {{
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
    time_items.extend(page_data.get("items", []))
    cursor = page_data.get("cursor")

print(f"\nAnalyzing time tracking data for BM trade-ins...")

bm_diagnostic_times = []
bm_items_with_time = []

for item in time_items:
    client = get_col(item, "status")
    trade_in_status = get_col(item, "color_mkypbg6z")
    received_date = parse_date(get_col(item, "date4"))

    if not (client == "BM" and trade_in_status == "Trade-in" and is_in_last_week(received_date)):
        continue

    # Get time tracking value
    diag_time_text = get_col(item, "time_tracking")
    total_time_text = get_col(item, "time_tracking98")

    # Get diagnostic person
    diag_person = ""
    for cv in item.get("column_values", []):
        if cv["id"] == "multiple_person_mkwqj321":
            diag_person = cv.get("text", "")

    # Parse time - usually in format like "1h 30m" or similar
    def parse_time_to_mins(time_str):
        if not time_str:
            return 0
        total_mins = 0
        time_str = time_str.lower()
        # Handle hours
        if 'h' in time_str:
            parts = time_str.split('h')
            try:
                total_mins += int(parts[0].strip()) * 60
            except:
                pass
            time_str = parts[1] if len(parts) > 1 else ""
        # Handle minutes
        if 'm' in time_str:
            try:
                mins = time_str.replace('m', '').strip()
                total_mins += int(mins)
            except:
                pass
        return total_mins

    diag_mins = parse_time_to_mins(diag_time_text)
    total_mins = parse_time_to_mins(total_time_text)

    bm_items_with_time.append({
        "name": item["name"],
        "received": get_col(item, "date4"),
        "diag_time": diag_time_text,
        "diag_mins": diag_mins,
        "total_time": total_time_text,
        "total_mins": total_mins,
        "diagnostic_by": diag_person
    })

    if diag_mins > 0:
        bm_diagnostic_times.append(diag_mins)

print(f"\nBM Trade-ins with diagnostic time logged: {len([t for t in bm_diagnostic_times if t > 0])}/{len(bm_items_with_time)}")

if bm_diagnostic_times:
    avg_diag = sum(bm_diagnostic_times) / len(bm_diagnostic_times)
    min_diag = min(bm_diagnostic_times)
    max_diag = max(bm_diagnostic_times)
    print(f"\nDiagnostic Time Statistics:")
    print(f"  Average: {avg_diag:.0f} min")
    print(f"  Min: {min_diag} min")
    print(f"  Max: {max_diag} min")

print(f"\nDetailed breakdown of BM trade-ins:")
print("-" * 80)

# Group by who did diagnostic
by_person = defaultdict(list)
for item in bm_items_with_time:
    person = item["diagnostic_by"] or "Not assigned"
    by_person[person].append(item)

for person, items in by_person.items():
    print(f"\n{person}:")
    total_diag_time = 0
    for item in items:
        print(f"  {item['name'][:40]:<40} | Diag: {item['diag_time'] or 'N/A':<10} | Total: {item['total_time'] or 'N/A'}")
        total_diag_time += item['diag_mins']
    print(f"  {'─' * 60}")
    print(f"  Total diagnostic time: {total_diag_time} min ({total_diag_time/60:.1f} hrs)")

# ============================================================
# STEP 5: Get item updates (another way to track activity)
# ============================================================
print("\n" + "-" * 70)
print("Step 5: Checking item updates for activity patterns...")
print("-" * 70)

# Let's look at a few BM trade-in items to see their update history
sample_items = bm_tradein_items[:5]

for item in sample_items:
    item_id = item["id"]

    updates_query = f"""
    query {{
        items(ids: [{item_id}]) {{
            name
            updates {{
                id
                body
                created_at
                creator {{
                    name
                }}
            }}
        }}
    }}
    """

    updates_result = run_query(updates_query)
    item_data = updates_result.get("data", {}).get("items", [{}])[0]
    updates = item_data.get("updates", [])

    print(f"\n{item_data.get('name', item['name'])}:")
    print(f"  Total updates: {len(updates)}")

    for update in updates[:3]:  # Show first 3 updates
        creator = update.get("creator", {}).get("name", "Unknown")
        created = update.get("created_at", "")[:16]
        body = update.get("body", "")[:50].replace("\n", " ")
        print(f"    [{created}] {creator}: {body}...")

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "=" * 70)
print("SUMMARY - ACTUAL vs ESTIMATED")
print("=" * 70)

items_with_diag_time = len([t for t in bm_diagnostic_times if t > 0])
items_without_time = len(bm_items_with_time) - items_with_diag_time

if bm_diagnostic_times:
    actual_avg = sum(bm_diagnostic_times) / len(bm_diagnostic_times)
    estimated = 20  # Our estimate was 20 min

    print(f"""
BM TRADE-IN DIAGNOSTICS:
  Total items last week:        {len(bm_items_with_time)}
  Items with time logged:       {items_with_diag_time}
  Items without time logged:    {items_without_time}

DIAGNOSTIC TIME:
  Our estimate:                 {estimated} min per device
  Actual average (logged):      {actual_avg:.0f} min per device
  Actual range:                 {min(bm_diagnostic_times)}-{max(bm_diagnostic_times)} min

TIME DIFFERENCE:
  Estimated total:              {len(bm_items_with_time) * estimated} min ({len(bm_items_with_time) * estimated / 60:.1f} hrs)
  Actual total (logged items):  {sum(bm_diagnostic_times)} min ({sum(bm_diagnostic_times)/60:.1f} hrs)
""")

    if actual_avg > estimated:
        pct_diff = ((actual_avg - estimated) / estimated) * 100
        print(f"  ⚠ Actual diagnostic time is {pct_diff:.0f}% HIGHER than estimate!")
    else:
        pct_diff = ((estimated - actual_avg) / estimated) * 100
        print(f"  ✓ Actual diagnostic time is {pct_diff:.0f}% lower than estimate")
else:
    print("\nNo diagnostic time data logged for BM trade-ins.")
    print("This could mean:")
    print("  1. Time tracking isn't being used consistently")
    print("  2. We need to look at a different column")
    print("  3. Activity logs may have more detail")
