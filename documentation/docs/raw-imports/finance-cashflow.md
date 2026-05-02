# Finance & Cash Flow

> **Source:** Compiled from Claude.ai conversation history (Oct 2025 – Feb 2026)
> **Status:** Active cashflow management, Xero reconciliation ongoing
> **Last updated:** 23 Feb 2026

---

## Business Structure

| Field | Value |
|-------|-------|
| Company | Panrix Limited |
| Trading as | iCorrect |
| Managing Director | Suzy (Ricky's wife) |
| Founder | Ricky Panesar |
| Location | London (operations), Bali (Ricky remote) |
| Accounting | Xero |
| Payments | Stripe, SumUp, Bank Transfer, Cash |

---

## Revenue Streams

| Stream | Typical Weekly | Notes |
|--------|---------------|-------|
| Back Market payouts | ~£8,000-11,000 | Primary revenue — weekly payout cycle (Wednesdays) |
| Direct repairs (Stripe/SumUp) | ~£2,000-3,000 | Walk-in and mail-in customers |
| Shopify orders | ~£2,000 (new) | New revenue stream since Jan 2026 |
| Corporate/Warranty | Variable | Invoiced separately |

---

## Major Cost Centres

| Cost | Monthly Amount | Notes |
|------|---------------|-------|
| Payroll (wages) | ~£14,500 | Due 28th of each month |
| Rent | ~£3,215 | Mid-month |
| China parts orders | £15,000-20,000 | Bi-monthly, paid in weekly instalments |
| UK parts (ad-hoc) | £2,000-5,000 | As needed |
| PAYE | ~£3,958 | ⚠️ Behind on payments |
| VAT | Variable | ⚠️ Behind on payments |
| Software/subscriptions | Various | Monday, n8n, Intercom, Shopify, etc. |

---

## Cashflow Model (Jan 2026 snapshot)

### Starting Position (15 Jan 2026)
| Item | Amount |
|------|--------|
| Bank balance | £11,782 |
| Shopify payout (same day) | £3,445 |
| Available | £15,227 |

### Known Commitments
| Item | Amount | Due |
|------|--------|-----|
| Payroll | ~£14,500 | 28 Jan |
| Mike's final payment | £3,692.28 | With payroll |
| Lawyers fees | £900 | 24 Jan |
| Missed PAYE (previous month) | £3,958 | ASAP |
| Current month PAYE | ~£3,958 | End of month |
| China order ($25,000 ≈ £20,000) | Weekly instalments | 5-6 weeks |

### Weekly China Payment Options
| Weeks | Weekly Payment |
|-------|---------------|
| 5 weeks | £4,000/week |
| 6 weeks | £3,333/week |

---

## Xero Reconciliation

### Status
Xero is not fully reconciled — bank statement data is more reliable than Xero for decision-making. Ricky has been using bank statements as source of truth while Xero cleanup continues.

### Stripe to Xero Import
Built custom CSV processing scripts to handle Stripe transaction import into Xero:
- Handles charges, fees, financing, payouts, refunds
- Proper categorisation of transaction types
- *(Script details in conversation history — would need to be re-extracted if needed)*

---

## Cash Flow Challenges Identified

1. **Stock ordering vs cash cycle mismatch** — large China orders tie up cash for weeks before revenue is generated from repaired/sold devices
2. **PAYE/VAT arrears** — behind on tax payments, creating compounding pressure
3. **Seasonal impact** — Chinese New Year forces larger advance stock orders
4. **Settlement payment** — Mike McAdam's departure cost ~£10,000+ total
5. **Revenue dependency** — heavy reliance on Back Market payouts (timing controlled by BM, not iCorrect)

### Ali's Advice (Jan 2026)
- Every pound from the Strike loan needs to be precisely allocated
- Stock levels cannot drop — if stock drops, repair queue dies, revenue drops, cash drops further
- Prioritise stock purchasing over everything else
- Cut costs where possible but not at the expense of repair capacity

---

## Verification Checklist for Jarvis

- [ ] Check current Xero reconciliation status
- [ ] Verify current bank balance and upcoming commitments
- [ ] Check Back Market payout schedule and amounts
- [ ] Verify China order payment status (how many weeks remain)
- [ ] Check PAYE/VAT arrears status
- [ ] Verify Stripe/SumUp integration with Xero is working
