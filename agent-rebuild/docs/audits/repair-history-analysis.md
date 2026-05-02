# Repair History Edge Case Mining

Raw source: `/home/ricky/builds/agent-rebuild/data/repair-history-full.json`

## Phase 1: Sample And Categorise

### Pull Summary

- Pulled both requested board slices with cursor pagination, nested replies, and per-item activity logs.
- Main board `349212843` date filter: `date_mkwdan7z` between `2023-04-07` and `2026-12-31`.
- Archive board `6162422834` date filter: `collection_date` between `2023-04-07` and `2023-12-31`.
- Pagination delay used: `2` seconds between item pages.
- Activity-log throttle used: `4.55` items/sec max, which stays within the brief's 5 items/sec cap.

### Dataset Shape

- Total completed repair items pulled: `1889`
- Main board items: `173`
- Archive board items: `1716`
- Total updates pulled: `9069`
- Total replies pulled: `40290`
- Items with updates: `1888`
- Items with replies: `1886`
- Items with non-placeholder signal notes or replies: `1888`
- Total activity-log rows attached: `17992`
- Items with activity logs: `1889`

### Categorisation Notes

- Categories overlap. A single repair can appear in multiple issue buckets if the thread shows multiple failure modes.
- `Normal flow` is reserved for items where the updates/replies/activity history do not show a clear issue pattern.
- Gap calls use the documented coverage summary in `/home/ricky/builds/agent-rebuild/journey-sop-gap-analysis.md` and the rebuilt journey docs, especially the findings that delay-management, intake/handoff failures, QC structure, warranty intake, and stale-state ownership are weak or undocumented, while standard diagnostic and core repair flows do have partial SOP support.

### Category Frequency

| Category | Item Count |
|---|---:|
| Normal flow | 261 |
| Parts delay | 684 |
| Extra fault found | 15 |
| Customer communication issue | 487 |
| Pricing dispute | 38 |
| Diagnostic complexity | 57 |
| QC rejection | 1 |
| Warranty/return | 510 |
| Handoff failure | 1 |
| Data quality issue | 5 |
| Escalation | 203 |
| Client no-show / abandoned | 416 |
| Insurance/corporate special handling | 348 |
| Liquid damage complexity | 443 |
| Board-level repair complexity | 514 |

### Category Examples

#### Normal flow

1. `Nick Bartman [1] * NOT PAID *` (`5225352573`)
- What happened: Please repair Battery: £70  The deadline for this repair is 10:29:01 on Thu 28 Sep
- Resolution: pst repair all good
2. `Naresh Mistry **PAID**` (`5176918819`)
- What happened: Mon Sep 18 11:18:30 2023 screen damage, thinks its an iPhone 8
- Resolution: No Notification Programmed for Returned End User Walk In
3. `Naree Jones` (`5168126066`)
- What happened: Fri Sep 15 12:31:23 2023 Naree Jones narnavjon@gmail.com 07775357828  Monday  iPad short circuit
- Resolution: No Notification Programmed for Quote Accepted End User Walk In

#### Parts delay

1. `Matvey U` (`5516064491`)
- What happened: **** AUTOMATED STOCK CHECK **** Attempting to Work Out Required Parts Could Not Calculate Required Repairs (No Results for Dual ID search) 219 104
- Resolution: No Notification Programmed for Returned End User Walk In
2. `Ewa Davenport *already paid*` (`4471323299`)
- What happened: If you are happy to proceed please let me know and I will order the parts.
- Resolution: Hi Ewa,  We have now completed the diagnosis on your macbook and have found a logic board fault located at the main display IC.  This is fixed by replacing the chip and will take 3 5 working days to complete as we need…
3. `Alexander Ivanov` (`5239019100`)
- What happened: **** AUTOMATED STOCK CHECK **** Attempting to Work Out Required Parts Could Not Calculate Required Repairs (No Results for Dual ID search) 80 104
- Resolution: No Notification Programmed for Returned End User Walk In

#### Extra fault found

1. `Ionie Robinson - SEND ON FRIDAY` (`4819248905`)
- What happened: In order to have your MacBook up and running again, we would need to complete a liquid damage treatment in order to prevent further damage in the future, and would also need to replace the screen unit.
- Resolution: No Notification Programmed for Quote Accepted End User Mail In
2. `Lulu Halloran` (`5297442019`)
- What happened: As a result, in order to complete the screen repair we would also need to replace the battery as attempting to do so without replacing the battery will result in damage to the replacement screen, either during or soon after fitting the scr…
- Resolution: No Notification Programmed for Returned End User Walk In
3. `Lewis Goodall` (`4326802523`)
- What happened: In order to have your MacBook up and running again, we would need to complete a liquid damage treatment in order to prevent further damage in the future, and would also need to resolve the short circuit within the power button.
- Resolution: No Notification Programmed for Returned End User Walk In

#### Customer communication issue

1. `Evan Waggoner` (`5590507145`)
- What happened: but i needed passcode is has four digit passcode @Ricky Panesar @Gabriel Barr
- Resolution: Hi Evan,  The repairs are due for completion a little later on today and will email as soon as the device has passed its post repair testing.  Kind regards,  Ryan  The iCorrect Support Team 12 Margaret Street London W1W…
2. `Ruby Kiwinda` (`5298675135`)
- What happened: For your security and convenience, we offer different options to provide access depending on your device type: iPhoneiPadWatch: Please provide your device passcode or temporarily disable the passcode during the repair period.
- Resolution: No Notification Programmed for Quote Accepted End User Courier
3. `Amanda Williams` (`4641625592`)
- What happened: For your security and convenience, we offer different options to provide access depending on your device type: **iPhoneiPadWatch:** Please provide your device passcode or temporarily disable the passcode during the repair period.
- Resolution: Hi Amanda,  Ive read through the communication and have spoken to my manager.  I can confirm there is written confirmation to say you are out of warranty and that your diagnostic fee was free.  Furthermore, I can confir…

#### Pricing dispute

1. `Amanda Williams` (`4641625592`)
- What happened: I am happy to book your MacBook in for a diagnostic free of charge to help us determine which repairs are required to restore functionality.
- Resolution: Hi Amanda,  Ive read through the communication and have spoken to my manager.  I can confirm there is written confirmation to say you are out of warranty and that your diagnostic fee was free.  Furthermore, I can confir…
2. `Charlie Edwards **to be recorded**` (`5336575456`)
- What happened: Kind regards Adam The iCorrect Support Team 12 Margaret Street London W1W 8JQ 02070998517 Mon Oct 16 15:05:14 2023 I’ve just taken it to Mr Shoreditch and am not happy with their quote so I need to go pick it up to get a photo but the line…
- Resolution: Hi Charlie,  We can confirm your MacBook has been assessed.  We will be able to repair your screen, the screen flexes have damage and require replacement. The cost for repair is £390.  The battery has been assessed and…
3. `Talib Usman` (`4998453247`)
- What happened: Further to our conversation, the management team have confirmed that a discount of £30 can be applied to the repair therefore totalling £220 (inc VAT) should you wish to proceed.
- Resolution: No Notification Programmed for Returned End User Walk In

#### Diagnostic complexity

1. `Ewa Davenport *already paid*` (`4471323299`)
- What happened: Despite temporarily attaching two new displays the device still exhibits an intermittent display issue which we believe is being caused by a logic board fault.
- Resolution: Hi Ewa,  We have now completed the diagnosis on your macbook and have found a logic board fault located at the main display IC.  This is fixed by replacing the chip and will take 3 5 working days to complete as we need…
2. `Amanda Williams` (`4641625592`)
- What happened: As the fault this device is experiencing is uniquely intermittent, we needed to confirm that the repairs we would be completing will ensure the issue does not return.
- Resolution: Hi Amanda,  Ive read through the communication and have spoken to my manager.  I can confirm there is written confirmation to say you are out of warranty and that your diagnostic fee was free.  Furthermore, I can confir…
3. `Farah Ayadi [1]` (`5313560909`)
- What happened: Hi Farah, I believe we have located the source of this puzzlingly intermittent Wifi connectivity issue.
- Resolution: Hey,  Sorry for the delay on this, All good to go ahead with fixing that wifi issue.  Could we also get this delivered and get the invoice so we can sort asap?  Thanks!  Farah

#### QC rejection

1. `Nazifa C/o Ali Ahmed` (`10949483736`)
- What happened: * Screen replaced again after failing during quality control.
- Resolution: 𝗣𝗼𝘀𝘁 𝗤𝗖 𝗖𝗼𝗻𝘁𝗿𝗼𝗹 : Ammeter - passed (20v 2.5A) Battery - passed 100% Ports - passed Audio - passed Camera - passed True tone - passed Display - passed Display brightness - passed Hall sensor - passed Touch ID - passed Mi…

#### Warranty/return

1. `Ruby Kiwinda` (`5298675135`)
- What happened: This request was closed and merged into request #23673 Your MacBook Warranty Request.
- Resolution: No Notification Programmed for Quote Accepted End User Courier
2. `Amanda Williams` (`4641625592`)
- What happened: Due to the nature of liquid damage, we provide a six month warranty on these devices.
- Resolution: Hi Amanda,  Ive read through the communication and have spoken to my manager.  I can confirm there is written confirmation to say you are out of warranty and that your diagnostic fee was free.  Furthermore, I can confir…
3. `Ameen Patel` (`4215142121`)
- What happened: No Notification Programmed for Awaiting Confirmation Warranty Mail In
- Resolution: Hi Ameen,  Your repair has been completed under warranty and we have arranged for your device to be delivered back to you via Royal Mail.  We use the Special Delivery service by Royal Mail, which is fully tracked and in…

#### Handoff failure

1. `Dean Iyavoo` (`18333066247`)
- What happened: Post repair, we repair aftermarket screen rear housing is damage
- Resolution: ====! SICKW DATA CHECK !====  DEVICE DATA Model Description: IPHONE 14 PLUS MIDNIGHT 128GB-ZDD IMEI: 350346110761940 IMEI2: 350346110899740 MEID: 35034611076194 Serial Number: D7DHQVHL74 Estimated Purchase Date: 2024-07…

#### Data quality issue

1. `Stephen Ives` (`4752030856`)
- What happened: TresantonBinky1 is wrong password .
- Resolution: No Notification Programmed for Returned End User Walk In
2. `Myra Khan` (`5496228561`)
- What happened: @Safan Patel Please try flex replacement, flexes are wrong model and manufacturer so will likely not work but all we have
- Resolution: post repair : all good
3. `Raymond Nyanzi` (`4542560751`)
- What happened: please tell to Client to remove his icloud account @Kian Rogers because 218079 is wrong password .without right password i can"t active phone
- Resolution: No Notification Programmed for Returned End User Walk In

#### Escalation

1. `Matvey U` (`5516064491`)
- What happened: his logic board put our housing and macbook is turned on but show three user name please can you ask for password @Ricky Panesar @Gabriel Barr
- Resolution: No Notification Programmed for Returned End User Walk In
2. `Evan Waggoner` (`5590507145`)
- What happened: but i needed passcode is has four digit passcode @Ricky Panesar @Gabriel Barr
- Resolution: Hi Evan,  The repairs are due for completion a little later on today and will email as soon as the device has passed its post repair testing.  Kind regards,  Ryan  The iCorrect Support Team 12 Margaret Street London W1W…
3. `Ewa Davenport *already paid*` (`4471323299`)
- What happened: DP_INT_AUXCH_C_N is showing OL and DP_INT_AUXCH_C_P is showing 0.112 whereas on another machine these give value of 0.361 @Ricky Panesar what do we do?
- Resolution: Hi Ewa,  We have now completed the diagnosis on your macbook and have found a logic board fault located at the main display IC.  This is fixed by replacing the chip and will take 3 5 working days to complete as we need…

#### Client no-show / abandoned

1. `Zak Ferchiche (Hurlingham Club)` (`4900363837`)
- What happened: Unable to Book Return Courier Journey: Invalid Payment Statuses Payment Method: Not Taken Payment Status: Not Taken If these are incorrect, please updatethe columns to their correct values.
- Resolution: Hi Zak,  I can confirm we have completed the repairs for this MacBook. Please find the final invoice for the costs attached.  Could I ask you to confirm whether we would require a PO in order to have this invoice paid?…
2. `Ewa Davenport *already paid*` (`4471323299`)
- What happened: No Notification Programmed for Book Return Courier End User Courier
- Resolution: Hi Ewa,  We have now completed the diagnosis on your macbook and have found a logic board fault located at the main display IC.  This is fixed by replacing the chip and will take 3 5 working days to complete as we need…
3. `Ruby Kiwinda` (`5298675135`)
- What happened: Unable to Book Return Courier Journey: Invalid Payment Statuses Payment Method: Invoiced SumUp Payment Status: Not Taken If these are incorrect, please updatethe columns to their correct values.
- Resolution: No Notification Programmed for Quote Accepted End User Courier

#### Insurance/corporate special handling

1. `iPad | 3430 | ZARA` (`4610983152`)
- What happened: Could not complete Zendesk Sync: No Zendesk ID Available
- Resolution: [Inference from final board status/date] ended `Returned`, dated `2023-06-09`.
2. `iPhone SE | HO | ZARA` (`4610983193`)
- What happened: Could not complete Zendesk Sync: No Zendesk ID Available
- Resolution: [Inference from final board status/date] ended `Returned`, dated `2023-06-08`.
3. `Zak Ferchiche (Hurlingham Club)` (`4900363837`)
- What happened: No Notification Programmed for Book Courier Corporate Courier
- Resolution: Hi Zak,  I can confirm we have completed the repairs for this MacBook. Please find the final invoice for the costs attached.  Could I ask you to confirm whether we would require a PO in order to have this invoice paid?…

#### Liquid damage complexity

1. `Zak Ferchiche (Hurlingham Club)` (`4900363837`)
- What happened: @Safan Patel Please complete repairs: MacBook Pro 13 M1 A2338 A2338 Screen Liquid Damage Treatment & Microphone Repair
- Resolution: Hi Zak,  I can confirm we have completed the repairs for this MacBook. Please find the final invoice for the costs attached.  Could I ask you to confirm whether we would require a PO in order to have this invoice paid?…
2. `Matvey U` (`5516064491`)
- What happened: Client's original screen was liquid damaged around backlight flex one backlight LED was dark.
- Resolution: No Notification Programmed for Returned End User Walk In
3. `Evan Waggoner` (`5590507145`)
- What happened: Liquid damage, no signs of life but gets hot on charger.
- Resolution: Hi Evan,  The repairs are due for completion a little later on today and will email as soon as the device has passed its post repair testing.  Kind regards,  Ryan  The iCorrect Support Team 12 Margaret Street London W1W…

#### Board-level repair complexity

1. `Zak Ferchiche (Hurlingham Club)` (`4900363837`)
- What happened: screen connector side has explosion macbook has logic board level issues .
- Resolution: Hi Zak,  I can confirm we have completed the repairs for this MacBook. Please find the final invoice for the costs attached.  Could I ask you to confirm whether we would require a PO in order to have this invoice paid?…
2. `Matvey U` (`5516064491`)
- What happened: @Gabriel BarrA blown touch bar circuit (logic board based) will cause this fault.
- Resolution: No Notification Programmed for Returned End User Walk In
3. `Evan Waggoner` (`5590507145`)
- What happened: Hi Evan, Yes, by connecting the devices logic board to an external power source and connecting a number of test modules, including a new screen, we have seen temporary stability restored to the device.
- Resolution: Hi Evan,  The repairs are due for completion a little later on today and will email as soon as the device has passed its post repair testing.  Kind regards,  Ryan  The iCorrect Support Team 12 Margaret Street London W1W…

## Phase 2: Pattern Extraction

### Recurring Phrases

| Phrase | Items |
|---|---:|
| `stock check` | 611 |
| `liquid damage` | 356 |
| `logic board` | 342 |
| `under warranty` | 88 |
| `awaiting part` | 82 |
| `out of warranty` | 68 |
| `previous repair` | 26 |
| `same issue` | 12 |
| `out of stock` | 11 |
| `not happy` | 5 |
| `tried calling` | 3 |
| `worth doing` | 1 |

### Team Members Most Associated With Each Issue Type

- **Parts delay:** `Systems Manager` (672), `Safan Patel` (357), `Gabriel Barr` (235), `Meesha Panesar` (193), `Mike McAdam` (187)
- **Extra fault found:** `Systems Manager` (14), `Gabriel Barr` (11), `Safan Patel` (9), `Meesha Panesar` (6), `Mike McAdam` (3)
- **Customer communication issue:** `Systems Manager` (466), `Safan Patel` (254), `Gabriel Barr` (236), `Meesha Panesar` (161), `Mike McAdam` (114)
- **Pricing dispute:** `Systems Manager` (35), `Safan Patel` (34), `Gabriel Barr` (17), `Meesha Panesar` (17), `Ricky Panesar` (16)
- **Diagnostic complexity:** `Systems Manager` (55), `Safan Patel` (35), `Gabriel Barr` (24), `Meesha Panesar` (23), `Andres Egas` (22)
- **QC rejection:** `Adil Azad` (1), `Michael Ferrari` (1), `Misha Kepeshchuk` (1), `Mykhailo Kepeshchuk` (1), `Roni Mykhailiuk` (1)
- **Warranty/return:** `Systems Manager` (481), `Safan Patel` (339), `Meesha Panesar` (147), `Gabriel Barr` (143), `Michael Ferrari` (132)
- **Handoff failure:** `Safan Patel` (1), `Systems Manager` (1)
- **Data quality issue:** `Safan Patel` (5), `Systems Manager` (4), `Meesha Panesar` (2), `Michael Ferrari` (1), `Naheed Uddin` (1)
- **Escalation:** `Ricky Panesar` (203), `Systems Manager` (197), `Safan Patel` (159), `Gabriel Barr` (110), `Meesha Panesar` (82)
- **Client no-show / abandoned:** `Systems Manager` (382), `Safan Patel` (268), `Michael Ferrari` (152), `Gabriel Barr` (119), `Roni Mykhailiuk` (115)
- **Insurance/corporate special handling:** `Systems Manager` (337), `Safan Patel` (188), `Gabriel Barr` (144), `Andres Egas` (76), `Ricky Panesar` (72)
- **Liquid damage complexity:** `Systems Manager` (406), `Safan Patel` (372), `Michael Ferrari` (167), `Ricky Panesar` (160), `Gabriel Barr` (156)
- **Board-level repair complexity:** `Systems Manager` (480), `Safan Patel` (403), `Gabriel Barr` (201), `Ricky Panesar` (187), `Meesha Panesar` (184)

## Phase 3: Edge Case Catalogue

| # | Edge Case | Frequency | Current Handling | SOP Gap? | Example Item |
|---|---|---:|---|---|---|
| 1 | Parts delay | 684 | Team runs stock checks, pauses or defers the job when parts are unavailable, and resumes once stock or ordering is sorted. | YES | `Matvey U` (`5516064491`) |
| 2 | Extra fault found | 15 | Tech expands the scope mid-job, re-quotes or discounts the extra work, and keeps the item open for the newly discovered issue. | NO | `Ionie Robinson - SEND ON FRIDAY` (`4819248905`) |
| 3 | Customer communication issue | 487 | Ferrari/customer-service chases by call or email, holds the repair until approval or passcode arrives, and documents special contact constraints in-thread. | YES | `Evan Waggoner` (`5590507145`) |
| 4 | Pricing dispute | 38 | Team reframes the job as diagnostic-first, offers concessions when needed, and waits for explicit price acceptance before continuing. | YES | `Amanda Williams` (`4641625592`) |
| 5 | Diagnostic complexity | 57 | Cases are routed through staged diagnostics, substitution testing, or repeat inspections before committing to the repair path. | NO | `Ewa Davenport *already paid*` (`4471323299`) |
| 6 | QC rejection | 1 | Failed QC routes devices back into rework, with extra repair passes and re-testing before release. | YES | `Nazifa C/o Ali Ahmed` (`10949483736`) |
| 7 | Warranty/return | 510 | Returned devices are compared against prior work, warranty coverage is debated in-thread, and the job is either accepted back in or reclassified as out-of-warranty. | YES | `Ruby Kiwinda` (`5298675135`) |
| 8 | Handoff failure | 1 | Operators rely on thread notes and ad-hoc reassignment when context drops between intake, customer-service, and the workshop. | YES | `Dean Iyavoo` (`18333066247`) |
| 9 | Data quality issue | 5 | Team manually corrects bad assumptions, wrong model details, missing passcodes, or incomplete fields inside the thread before work continues. | YES | `Stephen Ives` (`4752030856`) |
| 10 | Escalation | 203 | Complex or sensitive cases are pulled into Ferrari/Ricky threads for quote decisions, approvals, or technical direction. | YES | `Matvey U` (`5516064491`) |
| 11 | Client no-show / abandoned | 416 | Jobs are held, return/collection instructions are added manually, and dormant items are eventually returned or closed without a clean collection flow. | YES | `Zak Ferchiche (Hurlingham Club)` (`4900363837`) |
| 12 | Insurance/corporate special handling | 348 | Corporate and insurer jobs are tagged as special cases, routed through separate approval/diagnostic expectations, and often handled with explicit account notes. | YES | `iPad | 3430 | ZARA` (`4610983152`) |
| 13 | Liquid damage complexity | 443 | Team treats liquid jobs as diagnostic-led work with board inspection, corrosion checks, and cautious scope expansion based on what is found internally. | NO | `Zak Ferchiche (Hurlingham Club)` (`4900363837`) |
| 14 | Board-level repair complexity | 514 | Board repairs are handled as multi-step technical jobs with repeated testing, component-level work, and fallback decisions when the board fault broadens. | NO | `Zak Ferchiche (Hurlingham Club)` (`4900363837`) |

## Phase 4: Recommendations

### Put Into SOPs Immediately

- Parts delay
- Board-level repair complexity
- Warranty/return
- Customer communication issue
- Liquid damage complexity

### Better Solved By Systems / Automation

- Parts delay
- Customer communication issue
- Handoff failure
- Data quality issue
- Client no-show / abandoned
- QC rejection

### Rare Enough For Ad-Hoc Handling

- QC rejection
- Handoff failure
