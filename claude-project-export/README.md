# Operations SOPs

**Last updated:** 2026-04-07

Standard operating procedures for iCorrect workshop operations. Compiled from Ricky Q&A sessions.

**SOP files live in:** `../operations/`

**Status:** Draft v1 (happy paths only). Edge cases and what-ifs to be added in a follow-up pass.

---

## SOP Punchlist

### Complete

- 2 happy-path SOPs written so far
- Core flows covered:
  - Walk-in: simple repair

### Remaining

- 8 SOPs from the original punchlist not yet written:
  - Walk-in: corporate, diagnostic
  - Mail-in: repair, diagnostic, corporate
  - BackMarket: trading, sale, return for repair, return
- Add edge cases / what-ifs across all SOPs
- Cross-reference SOPs against existing docs and real system behaviour

### Known Gaps To Validate

- Parts reservation / allocation process is not properly defined
- Ammeter thresholds for iPhone / iPad intake are not yet documented
- Extra-fault communication and approval flow needs a formal SOP
- QC rejection / retest handling needs clearer decision rules
- Courier offer should be standardised across all relevant client flows

---

## Walk-In

| SOP | Status | File | Summary |
|-----|--------|------|---------|
| Walk-In Simple Repair | ✅ Written | [sop-walk-in-simple-repair.md](../operations/sop-walk-in-simple-repair.md) | Client drops off device for a known repair (e.g. screen, battery) |
| Walk-In Corporate | ❌ Missing | `../operations/sop-walk-in-corporate.md` | Corporate client walk-in. Priority, invoiced, no upfront payment |
| Walk-In Diagnostic | ❌ Missing | `../operations/sop-walk-in-diagnostic.md` | Client drops off device for fault investigation |

## Mail-In

| SOP | Status | File | Summary |
|-----|--------|------|---------|
| Mail-In Normal Repair | ❌ Missing | `../operations/sop-mail-in-repair.md` | Client books online, mails device for repair |
| Mail-In Diagnostic | ❌ Missing | `../operations/sop-mail-in-diagnostic.md` | Client mails device for diagnostic investigation |
| Mail-In Corporate | ❌ Missing | `../operations/sop-mail-in-corporate.md` | Corporate mail-in. Priority, invoiced |

## BackMarket

| SOP | Status | File | Summary |
|-----|--------|------|---------|
| BM Trading (Buyback) | ❌ Missing | `../operations/sop-bm-trading.md` | Trade-in device received, intake, profitability check, refurb |
| BM Sale | ❌ Missing | `../operations/sop-bm-sale.md` | Post-QC listing and shipping when sold |
| BM Return for Repair | ❌ Missing | `../operations/sop-bm-return-repair.md` | Customer reports fault, warranty repair |
| BM Return | ❌ Missing | `../operations/sop-bm-return.md` | Customer returns device for refund/replacement |

## Cross-Cutting (In Progress)

| SOP | Status | File | Notes |
|-----|--------|------|-------|
| Device Collection | ✅ Written | [sop-device-collection.md](../operations/sop-device-collection.md) | Full lifecycle from QC pass through handover and uncollected escalation |
| Client Notifications | TODO | — | What notifications go out, when, via what channel across all flows |
| Quoting Process | TODO | — | How Ferrari writes and delivers diagnostic quotes |
| Diagnostic Report Format | TODO | — | Structured format for Saf's diagnostic findings |
| Edge Cases / What-Ifs | TODO | — | Cross-flow exception handling |

---

## Older Files (Pre-SOP)

These existed before the SOP compilation. May contain useful detail but are not structured SOPs:

- [intake-flow.md](intake-flow.md) — previous intake flow notes
- [qc-workflow.md](qc-workflow.md) — previous QC notes
- [queue-management.md](queue-management.md) — previous queue management notes
