# KB-07: Repair Pricing

**Last updated:** 2026-03-10
**Status:** Partial: Shopify prices available
**Priority:** CRITICAL (pricing is the #1 automation blocker — affects 184+ conversations)

---

## Status

Model-specific prices are now available in the `pricing/` directory, pulled from Shopify product pages:
- `pricing/iphone.md`
- `pricing/macbook.md`
- `pricing/ipad.md`
- `pricing/watch.md`
- `pricing/services.md`

These prices can be quoted for repair types listed in those files. For any repair category NOT covered by the Shopify pricing files, do not quote prices. Instead:

> "For a specific quote on your repair, I'll need to get that confirmed for you — can I take your device model and the fault you're experiencing? I'll have someone come back to you shortly with the exact price."

Flag to Ferrari with: device model, chip generation (if MacBook), fault description.

---

## What We Know (partial — do not use for quoting)

### Diagnostic Fee
- **£49** — standard fee for device diagnostic, all devices. This is confirmed.
- Never quote £99 (legacy Fin error — see finn-lessons.md)

### Turnaround Uplifts (confirmed)
| Tier | Device | Uplift |
|---|---|---|
| Fast (24h) | MacBook Apple Silicon screen only | +£79 |
| Fastest (4h) | MacBook Apple Silicon screen only | +£149 |
| MacBook Diagnostic Express | MacBook | +£79 |

### Known Repair Prices (from actual bookings — partial, not authoritative)
| Device | Repair | Price | Source |
|---|---|---|---|
| MacBook (2018, Dustgate) | Dustgate repair | £349 | Jordan Clark booking (Feb 2026) |

### Courier / Postal Uplift
- +£20 on base repair price (confirmed from product page and business_state seed data)

### Base repair pricing
⛔ Pending pricing audit — do not publish until confirmed by Operations/Ricky

---

## Gaps / TODO

- [ ] Operations: complete pricing audit across all channels
- [ ] Agree canonical price list (single source of truth)
- [ ] Confirm: is pricing the same for walk-in vs postal?
- [ ] Confirm: are there corporate/trade pricing tiers?
- [ ] Confirm: VAT — are prices quoted inc or ex VAT?
- [ ] Confirm: full supported device list and matching prices
- [ ] Once confirmed: build structured price lookup for agent

---

*This file is intentionally incomplete until the pricing audit is done.*
*Source: customer-service/workspace/docs/knowledge-base/07-pricing.md, customer-service/workspace/MEMORY.md, intercom-agent-build/SPEC.md*
