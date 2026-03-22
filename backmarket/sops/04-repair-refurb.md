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
3. **Parts Cost** (`formula_mkx13zr7`) auto-calculates from linked parts' supply prices
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
- **Parts Cost** (`formula_mkx13zr7`): sum of supply prices from Parts Used

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
| `formula_mkx13zr7` | Parts Cost | Sum of supply_price from Parts Used |
| `formula_mkx1bjqr` | Total Labour | (Repair + Refurb + Diag time) × £24/hr |
| `formula__1` | Total RR&D Time | Repair Time + Refurb Time + Diagnostic Time |

## Automation
No webhooks currently fire during the repair phase. All work is manual.

The profitability calculation from SOP 3's grade-check webhook will have already fired before repair starts. The cost data used in that prediction (parts, labour) gets more accurate as repair progresses, but there's no re-check automation.

## Edge Cases
1. **Parts not in stock:** Do not start repair. Note in Part to Order, update Parts Status, move to next device.
2. **Additional issues found during repair:** If repair reveals problems not caught in diagnostic (e.g., hidden liquid damage, failing component), update Intake Notes and Parts Required. May need to re-evaluate profitability.
3. **Board-level repair needed:** Typically higher cost and risk. Flag for review if repair cost may exceed the NFU cap (£150 per grade-check constants).
4. **Parts Used differs from Parts Required:** Normal; document why. Extra part needed, or required part not actually consumed.
5. **Device unrepairable:** If repair is not viable (e.g., board failure beyond repair), flag for Ricky. May need to be written off or sold for parts.

## What Happens Next
- Device proceeds to SOP 5: QC & Final Grade
- QC tech reviews the repair, assigns Final Grade (`status_2_Mjj4GJNQ`)
- After QC sign-off: device moves to SOP 6: Listing
