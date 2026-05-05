# SOP 4: Repair & Refurbishment

> **Scope:** Actual repair work, parts consumption, labour tracking. Picks up after diagnostic (SOP 3) identifies what needs fixing. NO final grading (that's SOP 5: QC).

## Trigger
- Device has completed SOP 3 (diagnostic done, pre-grades set, Parts Required populated)
- Profitability check has been reviewed (if alert was raised)
- Repair tech picks up the device

## Who
- **Repair Tech** (`multiple_person_mkwqy930`): performs physical repairs
- **Refurb Tech** (`multiple_person_mkwqsxse`): performs cosmetic refurbishment (may be same person)
- These are separate from the diag tech (Roni) who did SOP 3

## Flow

### Step 1: Review Diagnostic Findings
Before starting any work:
1. Read **Intake Notes** (`long_text_mkqhfapq`) from diagnostic
2. Check **Parts Required** (`board_relation_mm01yt93`) for what's needed
3. Check **Parts Status** (`color_mkppdv74`) to confirm parts are available
4. Review any profitability alerts on the Monday item
5. If parts are missing: update **Part to Order** (`text_mkpp9s3h`) and wait

### Step 2: Parts Availability Check
- **Stock Level** (`lookup_mkzjzdem`): mirror column showing current stock from Parts Board
- **Parts Status** (`color_mkppdv74`): tracks whether parts are in stock / ordered / received
- **Part to Order** (`text_mkpp9s3h`): free text noting what needs ordering

If parts aren't in stock:
- Note what's needed in Part to Order
- Do not start repair until parts arrive
- Move on to other devices in the queue

### Step 3: Repair Phase
1. Assign self as **Repair Tech** (`multiple_person_mkwqy930`)
2. Set **Tech Repair Phase** (`status_177`) to current phase
3. Set **Tech Repair Status** (`status_110`) to in-progress
4. Start **Repair Time** timer (`time_tracking9`)

Common repairs:
- Battery replacement (flagged when Batt Health < 80%)
- Top case replacement (flagged when Top Case Pre-Grade = Dead)
- Screen replacement (flagged by Screen Condition damage types)
- Keyboard replacement (damaged or wrong layout)
- Board-level repair (flagged by abnormal ammeter reading)

### Step 4: Parts Consumption
When using parts:
1. Link consumed parts in **Parts Used** (`connect_boards__1`) — board_relation to Parts Board (985177480)
2. Each linked part has a `supply_price` on the Parts Board
3. **Parts Cost (display)** (`formula_mkx13zr7`) auto-calculates from linked parts' supply prices for board display
4. **Parts Cost (downstream automation source)** (`lookup_mkx1xzd7`) is the mirror-style cost field consumed by profitability/listing scripts
4. After repair, mark **Parts Deducted** (`color_mkzkats9`) to confirm stock was decremented

**Parts Used vs Parts Required:**
- Parts Required (`board_relation_mm01yt93`): set by diag tech during SOP 3 — what the device NEEDS
- Parts Used (`connect_boards__1`): set by repair tech during SOP 4 — what was actually CONSUMED
- These may differ (e.g., extra part needed, or a required part turned out unnecessary)

### Step 5: Complete Repair
1. Stop **Repair Time** timer (`time_tracking9`)
2. Update **Tech Repair Status** (`status_110`) to complete
3. Record **Repaired date** (`date_mkwdan7z`)

### Step 6: Refurbishment
Cosmetic work after functional repair is done.

1. Assign **Refurb Tech** (`multiple_person_mkwqsxse`) (may be same as repair tech)
2. Start **Refurb Time** timer (`time_tracking93`)
3. Perform cosmetic refurbishment:
   - Deep cleaning (if Cleaning Status was "Needs Deep Clean")
   - Surface polishing
   - Cosmetic touch-ups
4. Stop **Refurb Time** timer (`time_tracking93`)
5. Update **Cleaning Status** (`color_mkyp2sad`) to "Completed"

### Step 7: Labour Tracking (automated)
These formula columns auto-calculate:
- **Total Labour** (`formula_mkx1bjqr`): combines repair + refurb + diagnostic time at £24/hr
- **Total RR&D Time** (`formula__1`): total of Repair + Refurb + Diagnostic timers
- **Parts Cost (display)** (`formula_mkx13zr7`): board display formula for parts cost
- **Parts Cost (automation source)** (`lookup_mkx1xzd7`): mirror-style field used by downstream profitability/listing scripts

These feed into profitability calculations when the device is listed.

## Handoff to QC (SOP 5)
Once repair and refurb are complete:
- All timers stopped
- Parts Used populated and Parts Deducted confirmed
- Repaired date set
- Tech Repair Status = complete
- Device is ready for QC tech to assign Final Grade

## Columns Reference

### Main Board (349212843) — Set During Repair & Refurb
| Column ID | Title | Type | Set by |
|-----------|-------|------|--------|
| `multiple_person_mkwqy930` | Repair Tech | people | Repair tech |
| `multiple_person_mkwqsxse` | Refurb Tech | people | Refurb tech |
| `time_tracking9` | Repair Time | time_tracking | Repair tech (timer) |
| `time_tracking93` | Refurb Time | time_tracking | Refurb tech (timer) |
| `status_177` | Tech Repair Phase | status | Repair tech |
| `status_110` | Tech Repair Status | status | Repair tech |
| `date_mkwdan7z` | Repaired | date | Repair tech |
| `connect_boards__1` | Parts Used | board_relation | Repair tech |
| `color_mkppdv74` | Parts Status | status | Repair tech |
| `text_mkpp9s3h` | Part to Order | text | Repair tech |
| `color_mkzkats9` | Parts Deducted | status | Repair tech |
| `color_mkyp2sad` | Cleaning Status | status | Refurb tech |

### Read-Only During Repair (set in earlier SOPs)
| Column ID | Title | Source |
|-----------|-------|--------|
| `board_relation_mm01yt93` | Parts Required | SOP 3 (diagnostic) |
| `long_text_mkqhfapq` | Intake Notes | SOP 3 (diagnostic) |
| `color_mkwr7s1s` | Ammeter Reading | SOP 3 (diagnostic) |
| `lookup_mkzjzdem` | Stock Level | Mirror from Parts Board |

### Auto-Calculated Formulas
| Column ID | Title | Calculation |
|-----------|-------|-------------|
| `formula_mkx13zr7` | Parts Cost (display) | Formula/display version of parts cost from Parts Used |
| `lookup_mkx1xzd7` | Parts Cost (automation source) | Mirror-style supply-price values from Parts Used; downstream scripts sum comma-separated values |
| `formula_mkx1bjqr` | Total Labour | (Repair + Refurb + Diag time) × £24/hr |
| `formula__1` | Total RR&D Time | Repair Time + Refurb Time + Diagnostic Time |

## Automation
No webhooks currently fire during the repair phase. All work is manual.

The profitability calculation from SOP 3's grade-check webhook will have already fired before repair starts. The cost data used in that prediction (parts, labour) gets more accurate as repair progresses, but there's no re-check automation.

## Edge Cases
1. **Parts not in stock:** Do not start repair. Note in Part to Order, update Parts Status, move to next device.
2. **Additional issues found during repair:** If repair reveals problems not caught in diagnostic (e.g., hidden liquid damage, failing component), update Intake Notes and Parts Required. May need to re-evaluate profitability.
3. **Board-level repair needed:** Typically higher cost and risk. Flag for review if repair cost may make the device uneconomic. The old `£150 NFU cap` note is not enforced by the current standalone `bm-grade-check` service and should not be treated as an active automation rule.
4. **Parts Used differs from Parts Required:** Normal; document why. Extra part needed, or required part not actually consumed.
5. **Device unrepairable:** If repair is not viable (e.g., board failure beyond repair), flag for Ricky. May need to be written off or sold for parts.

## What Happens Next
- Device proceeds to SOP 5: QC & Final Grade
- QC tech reviews the repair, assigns Final Grade (`status_2_Mjj4GJNQ`)
- After QC sign-off: device moves to SOP 6: Listing

## QA Notes (2026-03-28)

### Findings
1. `MEDIUM` Parts cost source needed clarification.
   SOP 04 originally treated `formula_mkx13zr7` as the sole parts-cost field. Cross-checking the downstream rebuild estate shows:
   - `formula_mkx13zr7` is still documented here as a board-level/display formula
   - `lookup_mkx1xzd7` is what the active downstream profitability/listing scripts now read
   - active consumers using `lookup_mkx1xzd7` include SOP 06, SOP 06.5, `list-device.js`, `reconcile-listings.js`, and standalone `bm-grade-check`
   Operationally, `lookup_mkx1xzd7` is now the correct source for downstream profitability calculations.

2. `PASS` Labour fields align with downstream consumers.
   - `formula_mkx1bjqr` = labour cost £
   - `formula__1` = labour hours / total RR&D time
   These match SOP 06, SOP 06.5, and the current scripts.

3. `PASS` SOP 05 handoff is documented.
   SOP 04 hands off to SOP 05 for final grade assignment and automated BM SKU handoff.

4. `PASS` Column IDs are plausible against the rest of the rebuild.
   The parts, labour, timers, people columns, and repair-phase fields are consistent with other SOPs and downstream scripts.

5. `PASS` No V6/V7 scraper references found.
   This SOP remains focused on manual repair/refurb work and does not describe scraper behavior.

6. `MEDIUM` NFU cap note was stale.
   The old edge-case note referenced a `£150 NFU cap from grade-check constants`, but the current standalone `bm-grade-check` service does not enforce that rule.

### Per-check Summary
1. Parts cost field accuracy vs downstream consumers: `PASS` after clarification
2. Labour fields vs SOP 06 / SOP 07 consumers: `PASS`
3. SOP 05 reference status: `PASS`
4. Column ID plausibility: `PASS`
5. V6/V7 references: `PASS`
6. NFU cap reference vs current grade-check service: `PASS` after correction

### Known Operational Limits
- This SOP is manual-process documentation; there is no dedicated repair/refurb webhook or script to enforce it.
- The Monday board may still expose both a display formula (`formula_mkx13zr7`) and a downstream mirror (`lookup_mkx1xzd7`) for parts cost, which is why the documentation must distinguish them.
- The repair-to-QC handoff is documented in SOP 05, but final grade selection remains manual.

### Verdict
SOP 04 is broadly accurate as a manual process SOP, but it needed the parts-cost source clarified and the stale NFU-cap note removed so it no longer conflicts with the downstream automation layer.
