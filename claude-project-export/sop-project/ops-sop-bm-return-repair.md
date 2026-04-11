# SOP: BackMarket Return for Repair (Warranty)

**Status:** Draft v1 (compiled from Ricky Q&A, 2026-04-06)
**Scope:** A customer who bought a device from us on BackMarket reports a fault and sends it back for warranty repair.

---

## 1. Customer Reports Fault

- Customer logs the issue with BackMarket
- **No API connection** - we must manually add the device to Monday with the reported fault details

## 2. Device Arrives

- **Immediate warranty assessment:** Is the fault covered under our warranty or not?

### If covered (happy path):
- Repair the device
- **3 working day deadline** to resolve + ship back + confirm shipping

### If NOT covered:
- Log evidence of why (images, documentation)
- Post evidence as a message to BackMarket
- **Exception for high-value devices (£1,500-£2,000+):** sometimes better to absorb the repair cost than fight the return and risk losing the relationship/margin

## 3. Repair

- Standard repair flow: tech queue → repair → QC → ship back
- Priority: these have a hard 3-day deadline

## 4. Mandatory Logging

**For every warranty return, must record:**
- What was the fault?
- Why did it happen?
- **Was it avoidable?**
- What can we do to prevent this in future?

This data feeds into QC improvements and reducing return rates. Same logging requirement applies to normal repair warranties, not just BM.

## 5. Ship Back

- Same shipping process as mail-in returns
- Confirm with BackMarket that repair is complete and shipping confirmed

## Known Issues

1. No BM API connection for returns (all manual)
2. 3-day deadline is tight, especially if parts aren't in stock
3. Avoidable return logging not consistently done

## Related Docs
- [BM Sale SOP](sop-bm-sale.md)
- [BM Return SOP](sop-bm-return.md)
