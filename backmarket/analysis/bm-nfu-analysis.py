import json, csv, sys
from collections import defaultdict
from datetime import datetime, timedelta

with open('/home/ricky/builds/backmarket/data/cache/bm-crossref-data.json') as f:
    crossref = json.load(f)

tradein = []
with open('/home/ricky/builds/backmarket/docs/Backmarket Trade-in Data - Sheet1.csv') as f:
    for row in csv.DictReader(f):
        tradein.append(row)

sku_by_order = {}
for t in tradein:
    oid = t.get('orderPublicId', '').strip()
    s = t.get('listingSku', '').strip()
    if oid and s and s != 'None':
        sku_by_order[oid] = s

cutoff = datetime.now() - timedelta(days=90)

# Collect ALL orders with P&L, tagged by listing grade
all_orders = []
for o in crossref:
    try:
        dt = datetime.strptime(o.get('created', '')[:10], '%Y-%m-%d')
    except:
        continue
    if dt < cutoff:
        continue
    sku = sku_by_order.get(o.get('order_id', ''), '')
    if not sku:
        continue
    sale = float(o.get('sale', 0) or 0)
    if sale <= 0:
        continue

    # Internal grade from monday_sku
    monday_sku = o.get('monday_sku', '')
    grade = 'unknown'
    if monday_sku:
        g = monday_sku.split('.')[-1].lower()
        if g in ('fair', 'good', 'excellent', 'vgood'):
            grade = g

    # Listing grade from SKU (FUNC.CRACK, NONFUNC.USED, NONFUNC.CRACK, FUNC.USED)
    sku_parts = sku.split('.')
    listing_grade = '.'.join(sku_parts[-2:]) if len(sku_parts) >= 2 else 'unknown'

    all_orders.append({
        'sku': sku,
        'listing_grade': listing_grade,
        'internal_grade': grade,
        'sale': sale,
        'net': float(o.get('net', 0) or 0),
        'parts': float(o.get('parts', 0) or 0),
        'labour': float(o.get('labour', 0) or 0),
        'purchase': float(o.get('purchase', 0) or 0),
        'bm_fee': float(o.get('bm_fee', 0) or 0),
        'tax': float(o.get('tax', 0) or 0),
    })

# Filter to NONFUNC.USED
nfu = [o for o in all_orders if o['listing_grade'] == 'NONFUNC.USED']

print('=' * 130)
print('NONFUNC.USED GRADE DEEP DIVE (Last 3 Months)')
print('=' * 130)
print()
print('Total NONFUNC.USED orders with P&L: {}'.format(len(nfu)))
print()

if nfu:
    n = len(nfu)
    print('OVERALL ECONOMICS:')
    print('  Avg sale:     {:>7.0f}'.format(sum(o['sale'] for o in nfu) / n))
    print('  Avg purchase: {:>7.0f}'.format(sum(o['purchase'] for o in nfu) / n))
    print('  Avg BM fee:   {:>7.0f}'.format(sum(o['bm_fee'] for o in nfu) / n))
    print('  Avg tax:      {:>7.0f}'.format(sum(o['tax'] for o in nfu) / n))
    print('  Avg parts:    {:>7.0f}'.format(sum(o['parts'] for o in nfu) / n))
    print('  Avg labour:   {:>7.0f}'.format(sum(o['labour'] for o in nfu) / n))
    print('  Avg net:      {:>7.0f}'.format(sum(o['net'] for o in nfu) / n))
    losses = sum(1 for o in nfu if o['net'] < 0)
    print('  Loss rate:    {}/{} ({}%)'.format(losses, n, int(losses / n * 100)))
    print()

    # By internal grade
    by_ig = defaultdict(list)
    for o in nfu:
        by_ig[o['internal_grade']].append(o)

    print('BY INTERNAL GRADE (what condition the device actually arrived in):')
    print('  {:<12} {:>4} {:>8} {:>9} {:>9} {:>10} {:>7} {:>6}'.format(
        'Grade', 'Cnt', 'AvgSale', 'AvgPurch', 'AvgParts', 'AvgLabour', 'AvgNet', 'Loss%'))
    print('  ' + '-' * 70)
    for g in ['fair', 'good', 'vgood', 'excellent', 'unknown']:
        ords = by_ig.get(g, [])
        if not ords:
            continue
        m = len(ords)
        l = sum(1 for o in ords if o['net'] < 0)
        print('  {:<12} {:>4} {:>8.0f} {:>9.0f} {:>9.0f} {:>10.0f} {:>7.0f} {:>5.0f}%'.format(
            g, m,
            sum(o['sale'] for o in ords) / m,
            sum(o['purchase'] for o in ords) / m,
            sum(o['parts'] for o in ords) / m,
            sum(o['labour'] for o in ords) / m,
            sum(o['net'] for o in ords) / m,
            l / m * 100))
    print()

    # Parts distribution
    parts = sorted(o['parts'] for o in nfu)
    n = len(parts)
    print('PARTS COST DISTRIBUTION:')
    print('  Zero parts: {}/{} ({}%)'.format(
        sum(1 for p in parts if p == 0), n, int(sum(1 for p in parts if p == 0) / n * 100)))
    print('  Min:    {:>5.0f}'.format(parts[0]))
    print('  25th:   {:>5.0f}'.format(parts[n // 4]))
    print('  Median: {:>5.0f}'.format(parts[n // 2]))
    print('  75th:   {:>5.0f}'.format(parts[3 * n // 4]))
    print('  Max:    {:>5.0f}'.format(parts[-1]))
    print()

    # Per-SKU breakdown
    by_sku = defaultdict(list)
    for o in nfu:
        by_sku[o['sku']].append(o)

    print('PER-SKU BREAKDOWN:')
    print('  {:<55} {:>4} {:>8} {:>9} {:>9} {:>7} {:>5}  {}'.format(
        'SKU', 'Ord', 'AvgSale', 'AvgPurch', 'AvgParts', 'AvgNet', 'Loss', 'Internal Grades'))
    print('  ' + '-' * 120)
    for sku in sorted(by_sku.keys(), key=lambda s: -len(by_sku[s])):
        ords = by_sku[sku]
        m = len(ords)
        l = sum(1 for o in ords if o['net'] < 0)
        gc = defaultdict(int)
        for o in ords:
            gc[o['internal_grade']] += 1
        gs = ', '.join('{}:{}'.format(g, c) for g, c in sorted(gc.items(), key=lambda x: -x[1]))
        print('  {:<55} {:>4} {:>8.0f} {:>9.0f} {:>9.0f} {:>7.0f} {:>5}  {}'.format(
            sku, m,
            sum(o['sale'] for o in ords) / m,
            sum(o['purchase'] for o in ords) / m,
            sum(o['parts'] for o in ords) / m,
            sum(o['net'] for o in ords) / m,
            l, gs))

# Now compare ALL listing grades
print()
print('=' * 130)
print('COMPARISON: ALL LISTING GRADES')
print('=' * 130)
print()

by_lg = defaultdict(list)
for o in all_orders:
    by_lg[o['listing_grade']].append(o)

print('{:<20} {:>4} {:>8} {:>9} {:>9} {:>10} {:>7} {:>6}'.format(
    'Listing Grade', 'Cnt', 'AvgSale', 'AvgPurch', 'AvgParts', 'AvgLabour', 'AvgNet', 'Loss%'))
print('-' * 80)
for lg in sorted(by_lg.keys(), key=lambda x: -len(by_lg[x])):
    ords = by_lg[lg]
    m = len(ords)
    l = sum(1 for o in ords if o['net'] < 0)
    print('{:<20} {:>4} {:>8.0f} {:>9.0f} {:>9.0f} {:>10.0f} {:>7.0f} {:>5.0f}%'.format(
        lg, m,
        sum(o['sale'] for o in ords) / m,
        sum(o['purchase'] for o in ords) / m,
        sum(o['parts'] for o in ords) / m,
        sum(o['labour'] for o in ords) / m,
        sum(o['net'] for o in ords) / m,
        l / m * 100))

# 3 overbidding SKUs detail
print()
print('=' * 130)
print('3 OVERBIDDING SKUs — DETAILED P&L')
print('=' * 130)
print()

overbid_skus = [
    'MBP13.2020.M1.8CORE.8GB.256GB.NONFUNC.USED',
    'MBP13.2020.M1.8CORE.16GB.512GB.FUNC.CRACK',
    'MBP13.2022.M2.APPLECORE.16GB.256GB.FUNC.CRACK',
]

for sku in overbid_skus:
    ords = [o for o in all_orders if o['sku'] == sku]
    if not ords:
        print('{}: no P&L data in 3m window'.format(sku))
        continue
    m = len(ords)
    print('{}  ({} orders)'.format(sku, m))
    print('  Sale: {:.0f}  Purchase: {:.0f}  BM fee: {:.0f}  Tax: {:.0f}  Parts: {:.0f}  Labour: {:.0f}  Net: {:.0f}'.format(
        sum(o['sale'] for o in ords) / m,
        sum(o['purchase'] for o in ords) / m,
        sum(o['bm_fee'] for o in ords) / m,
        sum(o['tax'] for o in ords) / m,
        sum(o['parts'] for o in ords) / m,
        sum(o['labour'] for o in ords) / m,
        sum(o['net'] for o in ords) / m))
    # Show each order
    for i, o in enumerate(ords, 1):
        print('  #{}: sale={:.0f} purch={:.0f} parts={:.0f} labour={:.0f} net={:.0f} grade={}'.format(
            i, o['sale'], o['purchase'], o['parts'], o['labour'], o['net'], o['internal_grade']))
    print()
