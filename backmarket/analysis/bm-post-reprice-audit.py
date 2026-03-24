import json, csv, sys, os, re
from collections import defaultdict, Counter
from datetime import datetime, timedelta

# Load decisions for context
with open('/home/ricky/builds/backmarket/audit/listing-decisions-3m-200.json') as f:
    decisions = json.load(f)

decision_by_sku = {}
for l in decisions['listings']:
    sku = l['sku']
    if sku not in decision_by_sku:
        decision_by_sku[sku] = l

# Load crossref for P&L data
with open('/home/ricky/builds/backmarket/data/cache/bm-crossref-data.json') as f:
    crossref = json.load(f)

crossref_by_order = {}
for o in crossref:
    crossref_by_order[o.get('order_id', '')] = o

# Load trade-in CSV
tradein_orders = []
with open('/home/ricky/builds/backmarket/docs/Backmarket Trade-in Data - Sheet1.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        tradein_orders.append(row)

# Whitelist/blacklist
whitelist = [
    'MBA13.2020.M1.7CORE.8GB.256GB.NONFUNC.USED',
    'MBA13.2024.M4.APPLECORE.16GB.512GB.NONFUNC.CRACK'
]
blacklist_patterns = [re.compile(r'^MBP13\.2020\.I\d')]

def is_m1_plus(sku):
    if not sku:
        return False
    parts = sku.upper().split('.')
    return any(any(chip in p for chip in ['M1', 'M2', 'M3', 'M4']) for p in parts)

def is_blacklisted(sku):
    return any(p.search(sku) for p in blacklist_patterns)

# Parse trade-in dates and filter to last 3 months
cutoff = datetime.now() - timedelta(days=90)
recent_orders = []
all_statuses = Counter()

for t in tradein_orders:
    status = t.get('status', '').strip()
    all_statuses[status] += 1

    created = t.get('creationDate', '').strip()
    sku = t.get('listingSku', '').strip()
    order_id = t.get('orderPublicId', '').strip()
    title = t.get('listingTitle', '').strip()
    price = t.get('originalPriceValue', '0').strip()
    grade = t.get('listingGrade', '').strip()

    if not created:
        continue

    try:
        # Format: 2025-04-15T18:48:33+00:00
        dt = datetime.strptime(created[:19], '%Y-%m-%dT%H:%M:%S')
    except ValueError:
        continue

    if dt < cutoff:
        continue

    recent_orders.append({
        'date': dt,
        'sku': sku if sku and sku != 'None' else '',
        'order_id': order_id,
        'status': status,
        'title': title,
        'price': float(price) if price else 0,
        'grade': grade
    })

print('=' * 120)
print('POST-REPRICING AUDIT')
print('=' * 120)
print()
print('Trade-in CSV: {} total orders'.format(len(tradein_orders)))
print('Last 3 months: {} orders'.format(len(recent_orders)))
print()

# Status breakdown of recent orders
recent_statuses = Counter()
for o in recent_orders:
    recent_statuses[o['status']] += 1

print('Recent order statuses:')
for s, c in sorted(recent_statuses.items(), key=lambda x: -x[1]):
    pct = c / len(recent_orders) * 100
    print('  {:>20}: {:>4} ({:.0f}%)'.format(s, c, pct))
print()

# How many have SKU vs not
with_sku = sum(1 for o in recent_orders if o['sku'])
without_sku = sum(1 for o in recent_orders if not o['sku'])
print('Orders with listingSku: {} ({:.0f}%)'.format(with_sku, with_sku/len(recent_orders)*100))
print('Orders without listingSku: {} ({:.0f}%) — must use title'.format(without_sku, without_sku/len(recent_orders)*100))
print()

# For orders without SKU, try to match via title to a known SKU
# Build title -> SKU mapping from orders that DO have SKUs
title_to_sku = {}
for t in tradein_orders:
    sku = t.get('listingSku', '').strip()
    title = t.get('listingTitle', '').strip()
    if sku and sku != 'None' and title:
        title_to_sku[title] = sku

# Also build from listings CSV decisions
# For unmatched, try title keywords
matched_via_title = 0
for o in recent_orders:
    if not o['sku'] and o['title']:
        if o['title'] in title_to_sku:
            o['sku'] = title_to_sku[o['title']]
            matched_via_title += 1

if matched_via_title:
    print('Matched {} orders via title lookup'.format(matched_via_title))
    print()

# Categorise
categories = {
    'survivor_keep': [],
    'survivor_reprice': [],
    'killed_delist': [],
    'killed_blacklist': [],
    'dead_fishing': [],
    'dead_intel': [],
    'no_sku': [],
    'unknown': []
}

for o in recent_orders:
    sku = o['sku']

    if not sku:
        categories['no_sku'].append(o)
        continue

    dec = decision_by_sku.get(sku, {})
    action = dec.get('action', '')

    if sku in whitelist:
        categories['survivor_keep'].append(o)
    elif is_blacklisted(sku):
        categories['killed_blacklist'].append(o)
    elif action == 'KEEP':
        categories['survivor_keep'].append(o)
    elif action == 'REPRICE':
        categories['survivor_reprice'].append(o)
    elif action == 'DELIST':
        categories['killed_delist'].append(o)
    elif action == 'DEAD':
        if is_m1_plus(sku):
            categories['dead_fishing'].append(o)
        else:
            categories['dead_intel'].append(o)
    else:
        categories['unknown'].append(o)

total = len(recent_orders)
keep_n = len(categories['survivor_keep'])
reprice_n = len(categories['survivor_reprice'])
still_land = keep_n + reprice_n
delist_n = len(categories['killed_delist'])
blacklist_n = len(categories['killed_blacklist'])
dead_intel_n = len(categories['dead_intel'])
blocked = delist_n + blacklist_n + dead_intel_n
fishing_n = len(categories['dead_fishing'])
no_sku_n = len(categories['no_sku'])
unknown_n = len(categories['unknown'])

print('=' * 120)
print('WHERE DO THE 50/WEEK ORDERS GO?')
print('=' * 120)
print()

def pct(n):
    return n/total*100 if total else 0

print('STILL LANDING (active listings):')
print('  Survivor KEEP:       {:>4} ({:>4.1f}%)  price unchanged, competitive'.format(keep_n, pct(keep_n)))
print('  Survivor REPRICE:    {:>4} ({:>4.1f}%)  still active at lower bid'.format(reprice_n, pct(reprice_n)))
print('  SUBTOTAL:            {:>4} ({:>4.1f}%)'.format(still_land, pct(still_land)))
print()
print('NOW BLOCKED (zeroed out):')
print('  Killed (DELIST):     {:>4} ({:>4.1f}%)  unprofitable SKUs zeroed'.format(delist_n, pct(delist_n)))
print('  Killed (Intel BL):   {:>4} ({:>4.1f}%)  Intel MBP13 blacklisted'.format(blacklist_n, pct(blacklist_n)))
print('  Dead Intel:          {:>4} ({:>4.1f}%)  Intel DEAD zeroed'.format(dead_intel_n, pct(dead_intel_n)))
print('  SUBTOTAL:            {:>4} ({:>4.1f}%)'.format(blocked, pct(blocked)))
print()
print('FISHING LINES (M1+ DEAD, still active):')
print('  M1+ DEAD:            {:>4} ({:>4.1f}%)'.format(fishing_n, pct(fishing_n)))
print()
print('UNMATCHED:')
print('  No SKU / unknown:    {:>4} ({:>4.1f}%)'.format(no_sku_n + unknown_n, pct(no_sku_n + unknown_n)))
print()
print('TOTAL:                 {:>4}'.format(total))

# Weekly rates
weeks = 13.0  # 3 months
print()
print('=' * 120)
print('WEEKLY RATES')
print('=' * 120)
print()
print('{:<35} {:>6} {:>8} {:>8}'.format('Category', '/3mo', '/week', '/day'))
print('-' * 60)
print('{:<35} {:>6} {:>8.1f} {:>8.1f}'.format('Total trade-ins', total, total/weeks, total/weeks/7))
print('{:<35} {:>6} {:>8.1f} {:>8.1f}'.format('Still landing (survivors)', still_land, still_land/weeks, still_land/weeks/7))
print('{:<35} {:>6} {:>8.1f} {:>8.1f}'.format('Fishing line hits (M1+ DEAD)', fishing_n, fishing_n/weeks, fishing_n/weeks/7))
print('{:<35} {:>6} {:>8.1f} {:>8.1f}'.format('Now blocked', blocked, blocked/weeks, blocked/weeks/7))
print('{:<35} {:>6} {:>8.1f} {:>8.1f}'.format('No SKU/unknown', no_sku_n+unknown_n, (no_sku_n+unknown_n)/weeks, (no_sku_n+unknown_n)/weeks/7))

# Completed orders only (MONEY_TRANSFERED or PAID)
completed = [o for o in recent_orders if o['status'] in ('MONEY_TRANSFERED', 'PAID')]
sent = [o for o in recent_orders if o['status'] == 'SENT']
to_send = [o for o in recent_orders if o['status'] == 'TO_SEND']
canceled = [o for o in recent_orders if o['status'] == 'CANCELED']

actual_send_rate = (len(completed) + len(sent)) / total * 100 if total else 0

print()
print('ACTUAL SEND-IN RATE:')
print('  Completed (paid):   {:>4}'.format(len(completed)))
print('  Sent (in transit):  {:>4}'.format(len(sent)))
print('  To send (pending):  {:>4}'.format(len(to_send)))
print('  Canceled:           {:>4} ({:.0f}% cancel rate)'.format(len(canceled), len(canceled)/total*100 if total else 0))
print('  Actual send rate:   {:.0f}% (completed+sent / total)'.format(actual_send_rate))

# Forward projection
print()
print('=' * 120)
print('FORWARD PROJECTION')
print('=' * 120)
print()

active_per_week = (still_land + fishing_n) / weeks
active_per_day = active_per_week / 7

# Use actual send-in rate from data
sendin = actual_send_rate / 100 if actual_send_rate > 0 else 0.40

received_per_week = active_per_week * sendin
received_per_day = received_per_week / 7
received_per_month = received_per_week * 4.3

# Get avg net for survivor completed orders
survivor_completed_nets = []
for o in categories['survivor_keep'] + categories['survivor_reprice']:
    cx = crossref_by_order.get(o['order_id'], {})
    net = float(cx.get('net', 0) or 0)
    if net != 0:
        survivor_completed_nets.append(net)

avg_net = sum(survivor_completed_nets) / len(survivor_completed_nets) if survivor_completed_nets else 0
# After repricing add ~£28
avg_net_repriced = avg_net + 28 if avg_net > 0 else 211  # fallback to prediction model number

print('CURRENT STATE (post-repricing):')
print('  Active orders accepted/week:  {:.1f}'.format(active_per_week))
print('  Send-in rate:                 {:.0f}%'.format(sendin * 100))
print('  Devices received/week:        {:.1f}'.format(received_per_week))
print('  Devices received/month:       {:.0f}'.format(received_per_month))
print('  Avg net/order (repriced):     ~£{:.0f}'.format(avg_net_repriced))
print('  Projected monthly net:        £{:,.0f}'.format(received_per_month * avg_net_repriced))
print()

target_received_day = 6
target_received_month = target_received_day * 30
target_accepted_day = target_received_day / sendin if sendin > 0 else target_received_day / 0.4
target_accepted_week = target_accepted_day * 7

gap_accepted_week = target_accepted_week - active_per_week
gap_factor = target_accepted_week / active_per_week if active_per_week > 0 else float('inf')

print('TARGET: 6 received/day:')
print('  Need accepted/day:            {:.0f} (at {:.0f}% send-in)'.format(target_accepted_day, sendin*100))
print('  Need accepted/week:           {:.0f}'.format(target_accepted_week))
print('  Monthly received:             {}'.format(target_received_month))
print('  Monthly net at target:        £{:,.0f}'.format(target_received_month * avg_net_repriced))
print()
print('GAP:')
print('  Need {:.0f} more accepted/week ({:.1f}x current volume)'.format(gap_accepted_week, gap_factor))
print()

# Killed SKU breakdown
print('=' * 120)
print('ORDERS WE ARE CUTTING (by SKU)')
print('=' * 120)
print()

killed_skus = defaultdict(lambda: {'count': 0, 'statuses': Counter()})
for o in categories['killed_delist'] + categories['killed_blacklist'] + categories['dead_intel']:
    killed_skus[o['sku']]['count'] += 1
    killed_skus[o['sku']]['statuses'][o['status']] += 1

if killed_skus:
    print('{:<55} {:>5}  {}'.format('SKU', 'Ord', 'Statuses'))
    print('-' * 100)
    for sku, data in sorted(killed_skus.items(), key=lambda x: -x[1]['count']):
        bl = ' [BLACKLIST]' if is_blacklisted(sku) else ''
        status_str = ', '.join('{}:{}'.format(s,c) for s,c in data['statuses'].most_common())
        print('{:<55} {:>5}  {}{}'.format(sku, data['count'], status_str, bl))
    print('-' * 100)
    print('{:<55} {:>5}'.format('TOTAL KILLED', sum(d['count'] for d in killed_skus.values())))
else:
    print('No killed orders found in this period.')

# Fishing line hits
print()
print('=' * 120)
print('FISHING LINE HITS (M1+ DEAD getting orders)')
print('=' * 120)
print()

fishing_skus = defaultdict(lambda: {'count': 0, 'statuses': Counter()})
for o in categories['dead_fishing']:
    fishing_skus[o['sku']]['count'] += 1
    fishing_skus[o['sku']]['statuses'][o['status']] += 1

if fishing_skus:
    print('{:<55} {:>5}  {}'.format('SKU', 'Ord', 'Statuses'))
    print('-' * 100)
    for sku, data in sorted(fishing_skus.items(), key=lambda x: -x[1]['count']):
        status_str = ', '.join('{}:{}'.format(s,c) for s,c in data['statuses'].most_common())
        print('{:<55} {:>5}  {}'.format(sku, data['count'], status_str))
    print('-' * 100)
    print('{:<55} {:>5}'.format('TOTAL FISHING HITS', sum(d['count'] for d in fishing_skus.values())))
else:
    print('No fishing line hits in this period.')

# Unmatched orders - show titles to understand what they are
print()
print('=' * 120)
print('UNMATCHED ORDERS (no SKU) — what devices are these?')
print('=' * 120)
print()

unmatched_titles = Counter()
for o in categories['no_sku'] + categories['unknown']:
    unmatched_titles[o['title']] += 1

if unmatched_titles:
    print('{:<80} {:>5}'.format('Listing Title', 'Ord'))
    print('-' * 90)
    for title, count in unmatched_titles.most_common(20):
        print('{:<80} {:>5}'.format(title[:80], count))

# Top survivors
print()
print('=' * 120)
print('TOP 25 SURVIVOR SKUs (orders in last 3 months)')
print('=' * 120)
print()

survivor_sku_data = defaultdict(lambda: {'count': 0, 'completed': 0, 'canceled': 0, 'to_send': 0})
for o in categories['survivor_keep'] + categories['survivor_reprice']:
    s = survivor_sku_data[o['sku']]
    s['count'] += 1
    if o['status'] in ('MONEY_TRANSFERED', 'PAID'):
        s['completed'] += 1
    elif o['status'] == 'CANCELED':
        s['canceled'] += 1
    elif o['status'] == 'TO_SEND':
        s['to_send'] += 1

print('{:<55} {:>5} {:>5} {:>5} {:>5} {:>8}'.format(
    'SKU', 'Total', 'Done', 'TBS', 'Canc', 'Action'))
print('-' * 90)
for sku, data in sorted(survivor_sku_data.items(), key=lambda x: -x[1]['count'])[:25]:
    dec = decision_by_sku.get(sku, {})
    action = dec.get('action', '?')
    print('{:<55} {:>5} {:>5} {:>5} {:>5} {:>8}'.format(
        sku, data['count'], data['completed'], data['to_send'], data['canceled'], action))
