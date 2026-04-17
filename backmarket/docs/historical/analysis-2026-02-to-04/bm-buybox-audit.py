#!/usr/bin/env python3
"""Phase 5: Buybox Audit — uses cached API data"""
import json, csv, re, sys
from collections import defaultdict, Counter
from datetime import datetime, timedelta

# ── Load cached API listings ──
with open('/home/ricky/builds/backmarket/audit/api-listings-cache-2026-03-01.json') as f:
    all_listings = json.load(f)

print(f'Listings loaded: {len(all_listings)}')

# Parse
listings_by_sku = defaultdict(list)
active = []
inactive = []

for l in all_listings:
    sku = l.get('sku') or ''
    if sku == 'None': sku = ''
    price = 0
    gb = l.get('prices', {}).get('GB', {})
    if gb:
        price = float(gb.get('amount', 0) or 0)

    parsed = {'uuid': l.get('id',''), 'sku': sku, 'price': price, 'grade': l.get('aestheticGradeCode','')}
    listings_by_sku[sku].append(parsed)
    if price > 0:
        active.append(parsed)
    else:
        inactive.append(parsed)

print(f'Active (price > 0):   {len(active)}')
print(f'Inactive (price = 0): {len(inactive)}')
print()

# ── Load decisions ──
with open('/home/ricky/builds/backmarket/audit/listing-decisions-3m-200.json') as f:
    decisions = json.load(f)
dec_by_sku = {l['sku']: l for l in decisions['listings'] if l['sku'] not in dec_by_sku} if False else {}
dec_by_sku = {}
for l in decisions['listings']:
    if l['sku'] not in dec_by_sku:
        dec_by_sku[l['sku']] = l

# ── Load trade-in demand (3m) ──
tradein = []
with open('/home/ricky/builds/backmarket/docs/Backmarket Trade-in Data - Sheet1.csv') as f:
    for row in csv.DictReader(f):
        tradein.append(row)

title_to_sku = {}
for t in tradein:
    s = t.get('listingSku','').strip()
    ti = t.get('listingTitle','').strip()
    if s and s != 'None' and ti:
        title_to_sku[ti] = s

cutoff = datetime.now() - timedelta(days=90)
demand = defaultdict(lambda: {'total':0, 'completed':0, 'to_send':0})
for t in tradein:
    cr = t.get('creationDate','').strip()
    if not cr: continue
    try: dt = datetime.strptime(cr[:19], '%Y-%m-%dT%H:%M:%S')
    except: continue
    if dt < cutoff: continue
    sku = t.get('listingSku','').strip()
    if not sku or sku == 'None':
        sku = title_to_sku.get(t.get('listingTitle','').strip(), '')
    if not sku: continue
    st = t.get('status','').strip()
    demand[sku]['total'] += 1
    if st in ('MONEY_TRANSFERED','PAID'): demand[sku]['completed'] += 1
    elif st == 'TO_SEND': demand[sku]['to_send'] += 1

# ── Load crossref P&L ──
with open('/home/ricky/builds/backmarket/data/cache/bm-crossref-data.json') as f:
    crossref = json.load(f)
sku_by_order = {}
for t in tradein:
    oid = t.get('orderPublicId','').strip()
    s = t.get('listingSku','').strip()
    if oid and s and s != 'None': sku_by_order[oid] = s

sku_pnl = defaultdict(lambda: {'nets':[],'sales':[],'parts':[],'labour':[]})
for o in crossref:
    try: dt = datetime.strptime(o.get('created','')[:10], '%Y-%m-%d')
    except: continue
    if dt < cutoff: continue
    sku = sku_by_order.get(o.get('order_id',''), '')
    if not sku: continue
    sale = float(o.get('sale',0) or 0)
    if sale <= 0: continue
    sku_pnl[sku]['nets'].append(float(o.get('net',0) or 0))
    sku_pnl[sku]['sales'].append(sale)
    sku_pnl[sku]['parts'].append(float(o.get('parts',0) or 0))
    sku_pnl[sku]['labour'].append(float(o.get('labour',0) or 0))

# Helpers
def is_m1_plus(sku):
    return any(any(c in p for c in ['M1','M2','M3','M4']) for p in sku.upper().split('.'))

def p75(vals):
    if not vals: return 0
    s = sorted(vals); n = len(s); i = 0.75*(n-1); lo = int(i)
    return s[lo] + (i-lo)*(s[min(lo+1,n-1)] - s[lo])

def max_offer(avg_sale, parts, labour, net=200, ship=15):
    return max(0, avg_sale - avg_sale*0.10 - avg_sale*0.05 - parts - labour - ship - net)

whitelist = {'MBA13.2020.M1.7CORE.8GB.256GB.NONFUNC.USED','MBA13.2024.M4.APPLECORE.16GB.512GB.NONFUNC.CRACK'}
survivors = set()
for l in decisions['listings']:
    if l['action'] in ('KEEP','REPRICE') and l.get('max_offer',0) > 0:
        survivors.add(l['sku'])
survivors |= whitelist

# ════════════════════════════════════════════
# SECTION 1: SURVIVORS
# ════════════════════════════════════════════
print('='*130)
print('SECTION 1: SURVIVOR LISTINGS — CURRENT STATE')
print('='*130)
print()

rows = []
for sku in sorted(survivors):
    api = listings_by_sku.get(sku, [])
    act = [l for l in api if l['price'] > 0]
    d = demand.get(sku, {'total':0,'completed':0,'to_send':0})
    dec = dec_by_sku.get(sku, {})
    mo = dec.get('max_offer', 0)
    pnl = sku_pnl.get(sku, {})
    an = sum(pnl.get('nets',[0]))/max(len(pnl.get('nets',[])),1)
    prices = [l['price'] for l in act]
    cp = max(prices) if prices else 0
    rows.append({'sku':sku,'act':len(act),'price':cp,'mo':mo,'head':mo-cp if mo and cp else 0,
                 'dem':d['total'],'done':d['completed'],'tbs':d['to_send'],'net':an})

rows.sort(key=lambda x: -x['dem'])
print(f'{"#":>2}  {"SKU":<55} {"Act":>3} {"Price":>7} {"MaxOff":>7} {"Room":>6} {"Dem":>4} {"Done":>4} {"TBS":>4} {"AvgNet":>7}  Note')
print('-'*125)

for i, r in enumerate(rows, 1):
    rm = f'+{r["head"]:.0f}' if r['head'] > 0 else f'{r["head"]:.0f}'
    note = ''
    if r['dem'] == 0: note = 'NO ORDERS - check buybox'
    elif r['head'] > 20: note = 'CAN BUMP +{:.0f}'.format(r['head'])
    elif r['head'] < -5: note = 'OVER MAX OFFER!'
    print(f'{i:>2}  {r["sku"]:<55} {r["act"]:>3} {r["price"]:>7.0f} {r["mo"]:>7.0f} {rm:>6} {r["dem"]:>4} {r["done"]:>4} {r["tbs"]:>4} {r["net"]:>7.0f}  {note}')

wo = sum(1 for r in rows if r['dem'] > 0)
no = sum(1 for r in rows if r['dem'] == 0)
cb = sum(1 for r in rows if r['head'] > 20 and r['dem'] > 0)
print(f'\nWith orders: {wo} | No orders: {no} | Can bump: {cb}')

# ════════════════════════════════════════════
# SECTION 2: FISHING LINES
# ════════════════════════════════════════════
print()
print('='*130)
print('SECTION 2: FISHING LINES TO PROMOTE (M1+ DEAD with 2+ orders in 3m)')
print('='*130)
print()

fish = []
for sku, d in demand.items():
    if d['total'] < 2: continue
    dec = dec_by_sku.get(sku, {})
    if dec.get('action') != 'DEAD': continue
    if not is_m1_plus(sku): continue
    pnl = sku_pnl.get(sku, {})
    if pnl.get('sales'):
        avs = sum(pnl['sales'])/len(pnl['sales'])
        mo = max_offer(avs, p75(pnl['parts']), sum(pnl['labour'])/len(pnl['labour']))
        an = sum(pnl['nets'])/len(pnl['nets'])
        has = True
    else:
        avs = an = mo = 0; has = False
    api = listings_by_sku.get(sku, [])
    act = [l for l in api if l['price'] > 0]
    cp = max(l['price'] for l in act) if act else 0
    fish.append({'sku':sku,'dem':d['total'],'done':d['completed'],'tbs':d['to_send'],
                 'act':len(act),'price':cp,'avs':avs,'net':an,'mo':mo,'has':has,'pnl_n':len(pnl.get('nets',[]))})

fish.sort(key=lambda x: -x['dem'])
print(f'{"#":>2}  {"SKU":<55} {"Dem":>4} {"Done":>4} {"TBS":>4} {"Act":>3} {"CurPrc":>7} {"AvgSale":>8} {"AvgNet":>7} {"MaxOff":>7}  Action')
print('-'*130)

promo = 0
for i, f in enumerate(fish, 1):
    act = ''
    if f['mo'] > 0 and f['has']:
        act = '** PROMOTE -> set {:.0f}'.format(f['mo']); promo += 1
    elif f['dem'] >= 4 and not f['has']:
        act = '* HIGH DEMAND - no P&L yet'
    else:
        act = 'WATCH ({} orders)'.format(f['dem'])
    print(f'{i:>2}  {f["sku"]:<55} {f["dem"]:>4} {f["done"]:>4} {f["tbs"]:>4} {f["act"]:>3} {f["price"]:>7.0f} {f["avs"]:>8.0f} {f["net"]:>7.0f} {f["mo"]:>7.0f}  {act}')

promo_demand = sum(f['dem'] for f in fish if f['mo'] > 0 and f['has'])
print(f'\nPromotable: {promo} SKUs ({promo_demand} orders/3m = {promo_demand/13:.1f}/week)')
print(f'High demand no P&L: {sum(1 for f in fish if f["dem"]>=4 and not f["has"])}')

# ════════════════════════════════════════════
# SECTION 3: BUMP OPPORTUNITIES
# ════════════════════════════════════════════
print()
print('='*130)
print('SECTION 3: BUMP OPPORTUNITIES')
print('='*130)
print()

bumps = [r for r in rows if r['head'] > 5 and r['dem'] > 0]
bumps.sort(key=lambda x: -x['head'])
if bumps:
    print(f'{"SKU":<55} {"CurPrc":>7} {"MaxOff":>7} {"Headroom":>8} {"Dem/3m":>7}  Suggested new price')
    print('-'*110)
    for b in bumps:
        sug = min(b['price'] + b['head']*0.6, b['mo'])
        print(f'{b["sku"]:<55} {b["price"]:>7.0f} {b["mo"]:>7.0f} {"+" + str(int(b["head"])):>8} {b["dem"]:>7}  -> {sug:.0f}')

# ════════════════════════════════════════════
# SECTION 4: ZERO DEMAND SURVIVORS
# ════════════════════════════════════════════
print()
print('='*130)
print('SECTION 4: ZERO-DEMAND SURVIVORS (active price, no orders)')
print('='*130)
print()
zero = [r for r in rows if r['dem'] == 0]
if zero:
    print(f'{"SKU":<55} {"Act":>3} {"Price":>7} {"MaxOff":>7}')
    print('-'*80)
    for z in zero:
        print(f'{z["sku"]:<55} {z["act"]:>3} {z["price"]:>7.0f} {z["mo"]:>7.0f}')

# ════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════
print()
print('='*130)
print('GROWTH PROJECTION')
print('='*130)
print()

surv_weekly = sum(r['dem'] for r in rows) / 13.0
fish_weekly = sum(f['dem'] for f in fish) / 13.0
promo_weekly = promo_demand / 13.0

print(f'Current survivor orders/week:     {surv_weekly:.1f}')
print(f'Fishing line orders/week:         {fish_weekly:.1f}')
print(f'Promotable fishing orders/week:   {promo_weekly:.1f}')
print()
print(f'AFTER PROMOTION:')
print(f'  Survivor + promoted orders/week: {surv_weekly + promo_weekly:.1f}')
print(f'  At 37% send-in: {(surv_weekly + promo_weekly) * 0.37:.1f} received/week')
print(f'  = {(surv_weekly + promo_weekly) * 0.37 / 7:.1f} received/day')
print()

cap_daily = 6
cap_weekly = cap_daily * 7
effective_weekly = min(surv_weekly + promo_weekly, cap_weekly)
received_weekly = effective_weekly * 0.37
received_monthly = received_weekly * 4.3

print(f'AT 6/DAY CAP:')
print(f'  Capped accepted/week:   {effective_weekly:.0f}')
print(f'  Received/week:          {received_weekly:.1f}')
print(f'  Received/month:         {received_monthly:.0f}')
print(f'  At ~£200 net/order:     £{received_monthly * 200:,.0f}/month')
print(f'  At ~£244 net (repriced): £{received_monthly * 244:,.0f}/month')

# Save
audit = {'generated': datetime.now().isoformat(), 'survivors': rows, 'fishing': fish,
         'bumps': [{'sku':b['sku'],'price':b['price'],'max_offer':b['mo'],'head':b['head'],'dem':b['dem']} for b in bumps]}
with open('/home/ricky/builds/backmarket/audit/buybox-audit-2026-03-01.json','w') as f:
    json.dump(audit, f, indent=2, default=str)
print(f'\nSaved: /home/ricky/builds/backmarket/audit/buybox-audit-2026-03-01.json')
