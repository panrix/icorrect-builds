# Returns Investigation — Task 21 (Revised with BM Data)

**Date:** 2-3 March 2026
**Data sources:**
- BM returns CSV: `docs/Backmarket_Returns_0303.csv` — 47 unique sale-side return orders (Oct 2025 - Mar 2026)
- Monday repair data: `audit/repair-analysis-data-2026-03-02.json` — 534 matched devices
**Note:** BM returns use sale-side order IDs (numeric). Our Monday data uses trade-in order IDs (GB-xxxxx). No direct link between the two in current data.

---

## Summary

**47 return orders** over 5 months. **38 (81%) were preventable** — issues we could have caught before shipping.

| Category | Orders | % | Preventable? |
|----------|--------|---|-------------|
| **Technical** | 23 | 49% | Yes — device had a functional defect |
| **Other** | 8 | 17% | Unclear — generic "Other Issues" category |
| **Bad Product** | 6 | 13% | Yes — wrong colour/model/accessories |
| **Changed Mind** | 5 | 11% | No — buyer's decision |
| **Esthetical** | 3 | 6% | Yes — cosmetic didn't match listing |
| **Late Delivery** | 2 | 4% | No — shipping/courier issue |

---

## The Big Numbers

- **47 returns** out of ~366 shipped devices = **12.8% return rate**
- **38 preventable** = **10.3% preventable return rate**
- **Only 9 returns (19%) were outside our control** (changed mind, shipping damage)
- **Fair grade: 68% of preventable returns** — this grade has the worst QC outcomes
- **MacBook Pro: 61% of preventable returns** — more complex devices, more things to miss

---

## Top Return Reasons — What Buyers Complained About

### 1. Power On / Boot Failure — 8 orders (17% of all returns)
The #1 technical complaint. Device won't turn on or won't boot properly.

**QC gap:** Are we doing a full boot test on every device before shipping? If yes, these are intermittent issues. If not, this is the single biggest QC hole.

### 2. Display Issues — 5 orders (11%)
Screen problems: dead pixels, backlight bleed, discolouration, cracked under glass.

**QC gap:** Visual inspection may miss backlight issues. Need full-screen test (solid colours) in a dark room or with a test pattern.

### 3. Wrong Colour — 3 orders (6%)
Buyer received a different colour than listed.

**QC gap:** Listing error, not device error. Colour should be verified against listing before dispatch. Simple checklist item.

### 4. Keyboard Defects — 3 orders (6%)
Non-working keys, sticky keys, wrong layout.

**QC gap:** Are we doing a full keyboard test? Every key needs to be pressed. Keyboard layout (UK vs US vs EU) needs to match listing.

### 5. Accessories Not Working — 3 orders (6%)
Charger, cable, or included accessories faulty or wrong.

**QC gap:** Are we testing chargers before including them? Are we verifying the right wattage charger for the model?

### 6. Wrong Model / Specs — 3 orders (6%)
Buyer received a different model or spec than listed.

**QC gap:** Serial number → model verification before dispatch. Should be automatic.

### 7. Body Appearance Not As Expected — 3 orders (6%)
Cosmetic condition worse than the grade implied.

**QC gap:** Grading standards may be inconsistent. What we call "Fair" may not match BM's definition or buyer expectation.

### 8. Camera Failures — 2 orders (4%)
FaceTime camera not working.

**QC gap:** Camera test should be in the QC checklist. Quick Photo Booth check.

### 9. Battery Issues — 3 orders combined (6%)
Battery not charging, drain, health problems.

**QC gap:** Battery health percentage should be checked and documented. BM requires 80%+ for "functional."

---

## Not Preventable — 9 Orders (19%)

| Reason | Orders | Notes |
|--------|--------|-------|
| Changed Mind / Ask For Return | 5 | Buyer's right under consumer law. Can't prevent. |
| Late Delivery / Shipping Damage | 2 | Courier issue. Consider better packaging. |
| Tracking Issue | 1 | Courier lost tracking, buyer assumed lost |
| Late Shipping | 1 | We shipped late |

**Changed mind returns (5) are the cost of doing business.** These devices should come back in sellable condition — relist and resell.

---

## By Grade — Fair Is the Problem

| Grade | Returns | % of Returns | Preventable |
|-------|---------|-------------|-------------|
| **Fair** | 30 | 64% | 26 (87%) |
| Good | 13 | 28% | 10 (77%) |
| Excellent | 4 | 9% | 2 (50%) |

**Fair grade has 87% preventable return rate.** This means:
- Devices graded Fair have more potential issues (by definition — more wear)
- Our QC is not catching these issues before dispatch
- Buyers of Fair-grade devices have lower tolerance for additional defects

**Excellent grade has only 50% preventable** — half are changed-mind returns. When QC is thorough (as it should be for Excellent), returns drop to buyer-side issues only.

---

## By Model

| Model | Returns | Preventable | Key Issues |
|-------|---------|-------------|------------|
| **MacBook Pro** | 26 | 23 (88%) | Power On, Display, Wrong Model |
| MacBook Air | 21 | 15 (71%) | Power On, Wrong Colour, Body Appearance |

**MacBook Pro has 88% preventable rate** vs 71% for Air. Pros have more components that can fail (Touch Bar, more display variants, discrete GPU on older models).

---

## Monthly Trend

| Month | Returns | Preventable | Notes |
|-------|---------|-------------|-------|
| Oct 2025 | 6 | 5 | Pre-price increase |
| Nov 2025 | 12 | 8 | Price increase month, volume jumped |
| Dec 2025 | 11 | 9 | High volume continues |
| Jan 2026 | 11 | 10 | 91% preventable — worst month |
| Feb 2026 | 5 | 4 | Partial month |
| Mar 2026 | 2 | 2 | Just started |

**Nov-Jan spike** correlates with the volume increase from the price bump. More orders → more returns in absolute terms. But Jan's 91% preventable rate suggests QC wasn't scaling with volume.

---

## Recommended QC Checklist (Pre-Dispatch)

Based on the return reasons, every device should pass these checks before shipping:

### Functional (catches 70% of preventable returns)
- [ ] **Full boot test** — power on, login, reach desktop
- [ ] **Display test** — solid white/black/red/green/blue screens, check for dead pixels, backlight bleed
- [ ] **Keyboard test** — every key pressed, layout matches listing (UK/US/EU)
- [ ] **Trackpad test** — click, force touch, multi-touch gestures
- [ ] **Camera test** — Photo Booth, check FaceTime camera + mic
- [ ] **Battery health** — System Information → Battery → Cycle Count + Health (must be 80%+)
- [ ] **Charging test** — plug in, verify charging icon appears, correct charger wattage
- [ ] **Port test** — all USB-C/Thunderbolt ports, headphone jack
- [ ] **WiFi + Bluetooth** — connect to network, pair a device

### Listing Verification (catches 20% of preventable returns)
- [ ] **Serial number check** — matches the device to the listing
- [ ] **Model/spec verify** — RAM, storage, chip match listing
- [ ] **Colour verify** — physical colour matches listing description
- [ ] **Accessories check** — correct charger (wattage), correct cable, any listed accessories present and tested
- [ ] **Cosmetic grade** — matches listing grade (Fair/Good/Excellent per BM standards)

### Packaging (reduces shipping damage)
- [ ] **Screen protector** — foam or bubble wrap on display
- [ ] **Corner protection** — padding on all corners
- [ ] **Box fit** — device doesn't move inside box when shaken

---

## Financial Impact

At 12.8% return rate with ~£450 avg sale price:
- **47 returns × £450 = ~£21,150** in disrupted revenue over 5 months
- **38 preventable × £450 = ~£17,100** that better QC would have saved
- Each return costs: re-shipping (~£5-10), re-QC bench time (~30 min), relisting time, potential re-repair, BM reputation score hit
- **BM penalises sellers** with high return rates — affects buybox eligibility and listing visibility

### Target
- Current: **12.8% overall, 10.3% preventable**
- Target: **<5% overall, <3% preventable**
- Getting there requires the QC checklist above being mandatory for every device

---

## COMPROMISES

- **No link between BM sale orders and our trade-in data** — can't match specific returned devices to our Monday board items. Would need BM sale order ID tracked in Monday.
- **"Other > Other Issues" (7 orders)** categorised as preventable by default — actual reason unknown. Could be buyer-side.
- **Preventable classification is approximate** — some "Wrong Colour" complaints might be buyer misunderstanding, not our error.
- **Return rate denominator (~366 shipped)** is from our 6-month repair analysis dataset, not from BM's total sales figure. Actual rate may differ.
- **No data on return outcome** — we don't know how many returned devices were relisted vs written off.
- **Feb 2026 partial** — only shows 5 returns but month isn't complete in the export.
