# Inventory & Parts Management

> **Source:** Compiled from Claude.ai conversation history (Oct 2025 – Feb 2026)
> **Status:** Extensive analysis completed but reconciliation project (Phases 2-4) not fully finished
> **Last updated:** 23 Feb 2026

---

## The Core Problem

Ali (business advisor) identified inventory management as the biggest issue in the business. Monthly parts orders of £9,500-£20,000 couldn't be properly reconciled against actual parts usage of £8,500-£10,000. The gap was unaccounted for — potential causes: overbuying, system errors, unreported wastage/breakage, or theft.

---

## Inventory Reconciliation Project (Oct 2025)

### Phase 0/1: Data Collection & Supplier Reconciliation ✅ COMPLETED
- Extracted and matched all supplier invoices to Parts Board SKUs
- Achieved 77% purchase coverage (23% gap = consumables, small purchases, credit notes, VAT adjustments, shipping)
- China reconciliation was perfect — gap was exactly consumables

### Phase 2: Consumption Analysis ⚠️ NOT COMPLETED
- Designed but not fully executed: month-by-month consumption tracking, expected vs actual stock levels, discrepancy identification

### Phase 3: Forecasting & Ordering System ⚠️ NOT COMPLETED
- Designed but not built: consumption forecast model (±2% accuracy target), stock ordering calculator, supplier comparison, cash flow optimisation

### Phase 4: Dashboard & Automation ⚠️ NOT STARTED
- Planned: interactive inventory dashboard, automated reorder alerts, supplier performance tracking, KPI dashboard

---

## Supplier Landscape

### Top Suppliers (by spend, Oct 2025 data)
| Rank | Supplier | Items | Spend | % of Total | Location |
|------|----------|-------|-------|-----------|----------|
| 1 | Nancy (China) | 165 | £13,060 | 35% | China |
| 2 | MobileSentrix UK | 35 | £5,615 | 15% | UK |
| 3 | CPU Technology | 7 | £5,278 | 14% | UK |
| 4 | Laptop Power NW | 37 | £4,012 | 11% | UK |
| 5 | The Only Phones | 20 | £3,640 | 10% | UK |

### China vs UK Supplier Strategy
| Factor | China (Nancy) | UK Suppliers |
|--------|--------------|--------------|
| Cost | Lower (base price) | 2-3× higher |
| Lead time | ~11 days (normal), 30-45 days (CNY) | 1-3 days |
| Quality | Grade A, ready to use | Often "poor grade" requiring refurb |
| Order size | $15,000-25,000 batches | Smaller, as-needed |
| Payment terms | Weekly instalments (5-6 weeks) | Immediate/invoice |
| Use case | High-volume M-series parts | Urgent needs, Intel screens for refurb, emergency buffer |

### China Order Methodology (Jan 2026)
Built a comprehensive order for Nancy covering CNY period:
1. Pull active repairs from Monday Main Board (by group, column V = requested repair)
2. Pull 90 days of completed repairs for demand patterns
3. Check live stock via Parts Board (985177480)
4. Calculate daily consumption rates
5. Size order for 44-60 day coverage (CNY buffer)
6. Cross-reference with Tcon swap availability for flexibility
7. Budget: ~$25,000 per order

---

## Parts Board Structure (985177480)

### LCD Inventory (see Monday Schema doc for full table)
Key insight: LCDs are grouped by compatible model numbers, with separate entries for different panel manufacturers (LG vs Sharp vs BOE).

### Highest Volume Parts (from 90-day analysis)
| Part | 90-Day Usage | Daily Rate |
|------|-------------|------------|
| LCD A2337 (M1 Air) | 59 | 0.66/day |
| Battery A1965 (Air 18-20) | 24 | 0.27/day |
| LCD A2681/A3113 (M2/M3 Air) | 18 | 0.20/day |
| Battery A2171 (M1 Pro) | 17 | 0.19/day |
| LCD A2442 Sharp (14" Pro) | 15 | 0.17/day |
| LCD A2338 Sharp (M1 Pro 13") | 14 | 0.16/day |
| LCD A2338 LG (M1 Pro 13") | 13 | 0.14/day |

### A2338 Screen Repair Source Analysis
Only ~52% of A2338 LCD demand is met by Ori New from Nancy:
| Source | Count | % |
|--------|-------|---|
| A2338 Sharp Ori New | 14 | 27% |
| A2338 LG Ori New | 13 | 25% |
| A2338 Non-Original | 8 | 15% |
| A2251/A2289 LCD (Tcon swap) | 5 | 10% |
| A2338 Full Screen Poor Grade | 3 | 6% |
| Bezel only (no LCD) | 8 | 15% |

This flexibility means if Nancy stock runs out, there are fallback options.

---

## Screen Refurbishment Tracking Problem

### Current State
No tracking system for screen refurbishment. Screens have no unique identity, causing:
- Double deductions
- Ambiguous grades
- Untracked transformations (cutting, T-con swaps, polarizer replacements)

### Proposed Solution
QR code system where every screen is labelled at receiving with:
- Unique identifier
- Polarizer grade
- Lid grade
- T-con compatibility
- Source (China Ori New vs UK Poor Grade)

### Requires
- Separate Monday board for refurb pipeline
- QR code label printer
- Scanning workflow at receiving and consumption points
- Timeline estimate: 3-4 weeks to design and implement

---

## Verification Checklist for Jarvis

- [ ] Pull current Parts Board (985177480) full schema and stock levels
- [ ] Verify which parts are at zero or negative stock
- [ ] Check if any new automation exists for stock alerts
- [ ] Verify Nancy's last order details and delivery status
- [ ] Check if refurb tracking board has been started
- [ ] Compare current stock levels to consumption rates — flag any critical shortages
