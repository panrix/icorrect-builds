# SOP: BackMarket Trading (Buyback)

**Status:** Draft v1 (compiled from Ricky Q&A, 2026-04-06)
**Scope:** Devices received through BackMarket's trade-in programme for refurbishment and resale.

---

## 1. Order Comes In

- Device logged on Monday (BM board + main board)
- Order status changes to "sent" = client has shipped the device
- BM number assigned via automation

## 2. Device Arrives - Intake

Unpacked by Ronny or Nahid.

### Identity checks:
1. Match BM number to order number
2. Enter serial number → iCloud check + model/spec verification
3. **Critical fraud check:** confirm device actually matches what client claimed (common: client says M2 Pro, sends a 2018 MacBook)

### Label the device:
- Same Brother label process as normal repairs (by device type)

### Grade check:
4. Screen/display condition
5. Lid condition
6. Keyboard/top case condition

### Cross-check against BM customer answers:
7. Does it turn on? (client said yes/no)
8. Battery needs servicing? (client said yes/no)
9. Device functional? (client said yes/no)
10. Screen functional/non-functional?
11. Remove bottom case → **always check for internal liquid damage**

### If details don't match:
- Counter-offer flow (separate process)

### Ammeter reading:
12. Confirm power is correct

### Peripheral checks (if functional):
13. Screen works, no unexpected damage
14. Cameras, speakers, Face ID, etc.

## 3. Functional vs Non-Functional Path

### Functional devices (happy path):
- Specs match, not iCloud locked, peripherals work
- Log requested repairs (e.g. screen replacement)
- Goes to refurb queue for Misha

### Non-functional devices:
- Follow the [diagnostic path](sop-walk-in-diagnostic.md) (same as walk-in diagnostic with Saf)
- **Difference:** we actually complete the repair if possible (no quoting step, we own the device)
- **Stuck device problem:** many non-functionals are other repair shops' rejections. Customers sold their broken device to buy new. These can get stuck in the queue with genuinely difficult faults.

## 4. Profitability Decision (New System Being Built)

Before committing to repair:

1. Confirmed spec + grading → predict sale price (from BM scraping data)
2. Input required parts into "required parts" column
3. System calculates: **sale price - parts cost - labour = profit/loss**
4. **If profitable:** proceed to repair queue, allocate parts
5. **If not profitable:** pull valuable parts to sell separately, or sell device whole as damaged

**Known issue:** Devices have been repaired at a loss because nobody checked profitability upfront. This calculation must happen before repair starts.

## 5. Repair

- Misha handles screen/refurb work
- Parts should be allocated at intake (same gap as all repair flows: no allocation system yet)
- Standard repair → QC flow

## 6. QC

Same QC process. Once passed → listing.

## Known Issues

1. No profitability calculator in production yet (being built)
2. No parts allocation system
3. Non-functional devices from other shops' rejections get stuck
4. Counter-offer flow not documented
5. Fraud (misrepresented devices) is common

## Related Docs
- [Walk-In Diagnostic SOP](sop-walk-in-diagnostic.md) (for non-functional path)
- [BM Sale SOP](sop-bm-sale.md)
- BM SOPs: `/home/ricky/builds/backmarket/sops/`
- Systems vision: System 4 (BM Intake) in `/home/ricky/builds/agent-rebuild/ricky-systems-dump.md`
