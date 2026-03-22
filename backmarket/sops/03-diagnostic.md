# SOP 3: Diagnostic

> **Scope:** Physical assessment only. Ammeter reading, pre-grades, reported vs actual, intake notes, parts identification. NO repair work. NO final grade (that happens in post-repair QC, SOP 5).

## Trigger
- Device has completed SOP 2 (iCloud OFF, specs verified)
- Item is in "Today's Repairs" group (`new_group70029`)
- Status: Received

## Who
- **BM Diag Tech** (`multiple_person_mkyp6fdz`): currently Roni
- This is a dedicated diagnostic role; repair and QC are separate people/phases

## Flow

### Step 1: Initial Setup
1. Open the device item on Main Board (349212843)
2. Record **Intake Timestamp** (`date_mkypmgfc`)
3. Start **Diagnostic Time** timer (`time_tracking`)
4. Assign self as **BM Diag Tech** (`multiple_person_mkyp6fdz`)

### Step 2: Ammeter Reading
Connect device to ammeter and record in **Ammeter Reading** (`color_mkwr7s1s`).

| Value | Index | Meaning |
|-------|-------|---------|
| 20V + ~1A (low amp) | 0 | Powers on but low current draw; possible board issue |
| 20V + 1.5A or higher | 1 | Normal power draw; healthy |
| 5V | 11 | Not charging properly; potential charging circuit fault |

Abnormal readings flag board-level issues that affect parts requirements and profitability.

### Step 3: Component Pre-Grading
Each component graded independently. These are PRE-grades (before any repair).

#### LCD Pre-Grade (`color_mkp5ykhf`)
| Grade | Criteria |
|-------|----------|
| Excellent | No visible marks on screen |
| Good | Minor marks, no display impact |
| Fair | Noticeable marks, possible backlight issues |

#### Lid Pre-Grade (`status_2_mkmc4tew`)
| Grade | Criteria |
|-------|----------|
| Excellent | No dents or scratches |
| Good | Minor cosmetic wear |
| Fair | Noticeable dents or wear |

#### Top Case Pre-Grade (`status_2_mkmcj0tz`)
| Grade | Criteria |
|-------|----------|
| Excellent | No wear, all keys working, trackpad perfect |
| Good | Minor wear, fully functional |
| Fair | Visible wear, minor cosmetic issues |
| Dead | Non-functional keyboard or trackpad (requires replacement) |

#### Screen Condition (`screen_condition`)
Dropdown with detailed screen assessment values:
LCD Damage, Touch Damage, Glass Damage, Non-Ori, Frame Damage, Toshiba, LG, Backlight Damage, Touch Fault, Scratches, Display Damage, No Damage, Unable to Test

#### Keyboard Layout (`color_mkxga4sk`)
Record the keyboard layout: QWERTY, AZERTY, or QWERTZ. This is NOT a quality grade; it's layout identification for listing accuracy.

### Step 4: Reported vs Actual Condition
Compare what the customer reported on BackMarket against actual device condition. Reported columns are pre-set from the BM order; tech fills in Actual columns.

| Aspect | Reported Column | Actual Column |
|--------|----------------|---------------|
| Battery | `color_mkqg66bx` | `color_mkqg4zhy` |
| Screen | `color_mkqg7pea` | `color_mkqgtewd` |
| Casing | `color_mkqg1c3h` | `color_mkqga1mc` |
| Function | `color_mkqg578m` | `color_mkqgj96q` |

Additional checks:
- **Liquid Damage** (`color_mkqg8ktb`): set if liquid damage detected
- **Battery Health** (`numbers9`): actual percentage from system report

Battery health thresholds:
- 90%+: preferred for Excellent listing
- 85%+: acceptable for Good
- 80%+: minimum for Fair
- Below 80%: flag for battery replacement in Parts Required

### Step 5: Cleaning Assessment
- Set **Cleaning Status** (`color_mkyp2sad`): "Needs Deep Clean" or "Completed"
- Cleaning is a separate step; if deep clean needed, note it but don't do it during diagnostic

### Step 6: Identify Parts Required
- Link required parts in **Parts Required** (`board_relation_mm01yt93`)
- This links to the Parts Board and drives profitability calculations
- Common scenarios:
  - Top Case = Dead → top case replacement needed
  - Battery < 80% → battery replacement needed
  - Screen condition has damage → screen replacement needed
  - Ammeter abnormal → potential board-level repair

**This step is critical.** Parts Required must be populated before handoff because the profitability webhook needs it.

### Step 7: Profitability Prediction (automated)
**Trigger:** When BOTH Top Case Pre-Grade AND Lid Pre-Grade are set.

The `grade-check` webhook fires automatically:
1. Predicts grade as worst-of-two pre-grades (e.g., Top Case Good + Lid Fair = Fair)
2. Matches device model to sell price data
3. Calculates: revenue (sell price minus 10% BM commission) vs costs (purchase + parts + labour at £24/hr + £15 shipping)
4. Thresholds: ≥30% margin AND ≥£100 net profit
5. If profitable: silent pass
6. If unprofitable: alerts `#bm-trade-in-checks` Slack + Monday comment

**Service:** icloud-checker, port 8010, route `POST /webhook/bm/grade-check`
**Dedup:** 10-minute cooldown per item

**Known limitation:** Profitability calculation only works properly if Parts Required is populated first. If parts aren't linked yet, the cost estimate will be wrong. Architecture issue: grade-check lives in the icloud-checker service rather than its own service.

### Step 8: Intake Notes & Documentation
- Record all findings in **Intake Notes** (`long_text_mkqhfapq`)
- Update **Confirmed Damage / Fault** (`text3__1` on BM Devices Board) with actual findings
- Take condition photos (required per grading rules)

### Step 9: Diagnostic Complete
1. Stop **Diagnostic Time** timer (`time_tracking`)
2. Record **BM Diag Time** (`numeric_mm0gatwe`) if tracked separately
3. Hand off to repair tech (SOP 4)

## Handoff to Repair (SOP 4)
The diag tech's job ends here. They have:
- Recorded all pre-grades and conditions
- Populated Parts Required with what the device needs
- Documented findings in Intake Notes
- Triggered the profitability prediction

The repair tech picks up from here. If the profitability alert flagged the device as unprofitable, this should be reviewed before repair begins.

## Columns Reference

### Main Board (349212843) — Set During Diagnostic
| Column ID | Title | Type | Set by |
|-----------|-------|------|--------|
| `color_mkwr7s1s` | Ammeter Reading | status | Tech |
| `color_mkp5ykhf` | LCD Pre-Grade | status | Tech |
| `status_2_mkmc4tew` | Lid Pre-Grade | status | Tech |
| `status_2_mkmcj0tz` | Top Case Pre-Grade | status | Tech |
| `screen_condition` | Screen Condition | dropdown | Tech |
| `color_mkxga4sk` | Keyboard Layout | status | Tech |
| `color_mkyp2sad` | Cleaning Status | status | Tech |
| `color_mkqg4zhy` | Battery (Actual) | status | Tech |
| `color_mkqgtewd` | Screen (Actual) | status | Tech |
| `color_mkqga1mc` | Casing (Actual) | status | Tech |
| `color_mkqgj96q` | Function (Actual) | status | Tech |
| `color_mkqg8ktb` | Liquid Damage? | status | Tech |
| `numbers9` | Batt Health | numbers | Tech |
| `board_relation_mm01yt93` | Parts Required | board_relation | Tech |
| `multiple_person_mkyp6fdz` | BM Diag Tech | people | Tech |
| `date_mkypmgfc` | Intake Timestamp | date | Tech |
| `time_tracking` | Diagnostic Time | time_tracking | Tech |
| `numeric_mm0gatwe` | BM Diag Time | numbers | Tech |
| `long_text_mkqhfapq` | Intake Notes | long_text | Tech |

### Pre-set (from BM order, read-only during diagnostic)
| Column ID | Title |
|-----------|-------|
| `color_mkqg66bx` | Battery (Reported) |
| `color_mkqg7pea` | Screen (Reported) |
| `color_mkqg1c3h` | Casing (Reported) |
| `color_mkqg578m` | Function (Reported) |

## Automation

### Grade-Check Webhook
| Property | Value |
|----------|-------|
| Trigger | Top Case or Lid pre-grade column changes on Main Board |
| Service | icloud-checker, port 8010 |
| Route | `POST /webhook/bm/grade-check` |
| Logic | Waits for both pre-grades; predicts final grade (worst of two); runs profitability check |
| Output | Slack alert + Monday comment if unprofitable |
| Dedup | 10-minute cooldown per item |

### Missing Automations (flagged for build)
1. **Arrival notification cron:** Daily Slack alert for Roni showing which trade-ins are due today. Needs to match BM order number to Monday item for package identification when deliveries arrive.
2. **Auto-move to Today's Repairs:** When BM order status changes from SHIPPED to RECEIVED, auto-move the Monday item from "Incoming Future" group to "Today's Repairs" group (`new_group70029`). Currently manual.

## Edge Cases
1. **Top Case = Dead:** Requires top case replacement. This significantly impacts parts cost and profitability.
2. **Battery < 80%:** Flag for replacement in Parts Required. Factor cost into profitability before proceeding.
3. **Liquid damage:** Flag immediately. May affect multiple components. Grade conservatively.
4. **Reported vs Actual mismatch:** Document thoroughly. Feeds into counter-offer decisions if still within window.
5. **Profitability alert fires:** Do NOT proceed to repair without review. Discuss with Ricky if margin is negative.
6. **Ammeter = 5V:** Potential charging circuit fault. May need board-level repair; flag in Parts Required and Intake Notes.

## What Happens Next
- Device proceeds to SOP 4: Repair & Refurb
- After repair: device goes to SOP 5: QC & Final Grade
- After QC: device moves to SOP 6: Listing
