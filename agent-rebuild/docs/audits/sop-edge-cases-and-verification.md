# SOP Edge Cases And Monday Verification

## Part 1: Edge Case Enrichment

### sop-bm-return-repair.md

#### Edge Cases Found: 3

**1. Three-day warranty return deadline is missed by parts delays (147 occurrences)**
Real examples:
- "Scott Bannon" (5413347769): "Part ordered."
- "Bonnie Lee-Gorton" (5225644938): "Screen ordered"
- "John Buchanan" (5311695934): "Speaker ordered"

What went wrong:
- Three-day warranty return deadline is missed by parts delays.
How the team handled it:
- post repair all good
What to add to SOP:
> Add a hard escalation point for warranty returns that hit parts blockers. If the 3-day SLA is at risk, the SOP should say who decides whether to absorb cost, substitute stock, or message BM immediately.

**2. Manual intake means key details are missing (3 occurrences)**
Real examples:
- "Ruby Kiwinda" (5298675135): "This request was closed and merged into request #23673 Your MacBook Warranty Request."
- "Eugene" (5566378419): "Fri Nov 24 13:03:45 2023 warranty request for charging port"
- "Patricia Gala" (5499492267): "This request was closed and merged into request #25097 Your Warranty Assessment."

What went wrong:
- Manual intake means key details are missing.
How the team handled it:
- No Notification Programmed for Awaiting Confirmation Warranty Walk In
What to add to SOP:
> Because there is no BM returns API flow, the SOP should include a mandatory intake checklist for fault description, warranty coverage evidence, timestamps, and the linked Monday records required before repair starts.

**3. Coverage disputes on high-value devices need fast escalation (90 occurrences)**
Real examples:
- "Jide Daniel" (10959264112): "@Safan Patel please replace trackpad under warranty. The client is fighting against out of warranty claim but there's no point in fighting over a trackpad. Let's replace it and move on."
- "Claire Taylor" (5341449397): "post repair : all good battery replace under warranty"
- "Mahi Nair" (18149427154): "@Michael Ferrari logic board repair is not covered by warranty"

What went wrong:
- Coverage disputes on high-value devices need fast escalation.
How the team handled it:
- Post repair all good,we repair new track pad
What to add to SOP:
> Document when the team should stop arguing coverage and absorb the repair cost to protect the BM relationship and deadline.

### sop-bm-return.md

#### Edge Cases Found: 3

**1. Return reason points to an avoidable QC miss (155 occurrences)**
Real examples:
- "Amina Begum (Kurt Geiger)" (4535977860): "...ue. The first time the actual screen was repaired and then showed the same issue, we then replaced the LCD under warranty. The MacBook passed through our post repair testing. Would you mind send over an image of what the MacBook shows on screen? Could you also..."
- "Issa López" (4899945930): "No previous repairs"
- "Aurora Russi" (4940737066): "No previous repairs."

What went wrong:
- Return reason points to an avoidable QC miss.
How the team handled it:
- Hi team, The laptop was not in use, we had it stocked in the IT cabinet since the repair. On Friday I took it out to get it rebuild but within 5 minutes of use the MacBook screen started flashing. It was also visible wit...
What to add to SOP:
> Every BM return should log whether the fault was avoidable and which QC or refurb step failed. The SOP needs a mandatory root-cause record, not just a relist decision.

**2. Replacement or relist path needs serial/identity control (572 occurrences)**
Real examples:
- "John Murungi *IC SWAP*" (4917395475): "12 pro screen replacement. he asked about the ic swap so i gave him both prices and advised that it is optional"
- "Alexei Subbotsky" (4937244322): "...: macbook repairs Device Model: macbook pro 13 touchbar a1706 Macbook Serial No: C02SWAPYHF1P Service: Walk In Service Message: Repairs: FLEXGATE (SCREEN WORKS AT CERTAIN ANGLES) £250.00, Walk in Service null..."
- "Rosh Rajeev" (4340247554): "Repairs required: - Trackpad replacement £200 - Liquid damage treatment & Logic Board Repair (thermal sensor circuit is damaged causing high fan speed): £280 Unable to confirm if we can repair the touch id fault as this is a serialised module which is very sen..."

What went wrong:
- Replacement or relist path needs serial/identity control.
How the team handled it:
- Confirmed Quotation Display (Original OLED Screen): £180 TOTAL: £180
What to add to SOP:
> If bottom covers or identities change during a replacement flow, require a serialized audit trail so the relisted unit still ties back to the correct BM history.

**3. Return economics are severe enough to change the decision (51 occurrences)**
Real examples:
- "Kristian Poprawska-John *send on monday*" (4858979345): "requested refund for original shipping"
- "Riz Chaudhry" (5273833918): "...ir connects to charger, but doesn't charge past 1% Client is in Spain Shipping will be expensive so can't do it Will issue a refund for the repair..."
- "Hamish Dewar" (4370347850): "Refund complete"

What went wrong:
- Return economics are severe enough to change the decision.
How the team handled it:
- ...ll drop off in person today lets wait till he drops off then organise refund for either half or all shipping depending on what he wants...
What to add to SOP:
> The SOP should explicitly require a cost-stack review before choosing refund, replacement, or repair so BM margin losses are visible at decision time.

### sop-bm-sale.md

#### Edge Cases Found: 3

**1. Shipment step breaks after sale (417 occurrences)**
Real examples:
- "#1059 - Ridwan Mustapha *SEND CHARGER**" (11214640774): "@jarvis Can you email Ridwan to confirm his MacBook will be shipped today with tracking details from the RM labels"
- "John Buchanan" (5311695934): "...king, and wished to advise that UPS will provide both packaging and a shipping label as part of the collection, so all youll need to do is make sure the MacBook is ready to be dispatched. Please do get in contact if you have any queries. Kind regards, Ryan The..."
- "Jessica Hadcroft" (4989931824): "...you could please confirm the address you would like to have your iPad dispatched to? If you can get this over to me before 5pm I can have the package shipped today for delivery tomorrow or on Monday! I shall look forward to hearing from you. Kind regards, Rich..."

What went wrong:
- Shipment step breaks after sale.
How the team handled it:
- ...i Mykhailiuk Please makje sure this client's charger is packaged when shipping this today...
What to add to SOP:
> Add a sale-to-shipment checklist with ownership for label print, packing slip inclusion, tracking capture, and final board update before the parcel leaves.

**2. Wrong device or wrong address risk at dispatch (384 occurrences)**
Real examples:
- "John Buchanan" (5311695934): "...wished to advise that UPS will provide both packaging and a shipping label as part of the collection, so all youll need to do is make sure the MacBook is ready to be dispatched. Please do get in contact if you have any queries. Kind regards, Ryan The iCorrect..."
- "Naz Rahimi" (4502032318): "label emailed to client"
- "Adam Ward" (4645831772): "label-for-WP-1829-0643-330.pdf"

What went wrong:
- Wrong device or wrong address risk at dispatch.
How the team handled it:
- thank you
What to add to SOP:
> The SOP should force a final serial / listing / buyer check before the label is attached so the team does not ship the wrong BM device to the wrong order.

**3. Device sells before packaging or tracking details are fully captured (558 occurrences)**
Real examples:
- "Freeston, Nick (Jones Lang LaSalle)" (4891109445): "...the loading bay and provided with the requested package. The couriers tracking shows it will arrive with us un in the next few minutes, however I believe we will struggle to have the repair completed and the device returned in due time. Please do advise how yo..."
- "Sharon Hilge 2 C/o Ellie Donohoe" (4237657230): "Packed and ready to dispatch once paid, shipping already sorted"
- "#1059 - Ridwan Mustapha *SEND CHARGER**" (11214640774): "@jarvis Can you email Ridwan to confirm his MacBook will be shipped today with tracking details from the RM labels"

What went wrong:
- Device sells before packaging or tracking details are fully captured.
How the team handled it:
- ...r the Mail In service is at half past 5, so I shall have to have this dispatched a bike courier first thing tomorrow morning, with specific instructions to deliver to the Loading Bay. I shall send over the job and tracki...
What to add to SOP:
> Document the exact data that must exist before shipment status changes, including listing ID, buyer details, and outbound tracking.

### sop-bm-trading.md

#### Edge Cases Found: 4

**1. Trade-in device does not match the customer's claim (4 occurrences)**
Real examples:
- "Sanjeeb Kumar Dey" (4221811984): "320 trade in"
- "BM 1526 (Ben Clarke)" (11207039574): "Accepted £160 trade-in"
- "Myra Khan" (5496228561): "@Safan Patel Please try flex replacement, flexes are wrong model and manufacturer so will likely not work but all we have"

What went wrong:
- Trade-in device does not match the customer's claim.
How the team handled it:
- liquid cleaned done please can you check for me fingerprint @Meesha Panesar
What to add to SOP:
> Add a fraud/misrepresentation branch: if the received BM trade-in does not match spec, grade, or functionality, stop refurbishment, record the mismatch evidence, and move into the counter-offer or rejection path.

**2. iCloud lock or passcode block stops intake (123 occurrences)**
Real examples:
- "Raymond Nyanzi" (4542560751): "restore is done now . please tell to Client to remove his icloud account @Kian Rogers because 218079 is wrong password .without right password i can"t active phone"
- "Dylan Vekaria" (5506715790): "please can you tell client remove his icloud @Gabriel Barr"
- "BM 1053 (Sonia Mustafa) (RTN > REPAIR)" (10654738604): "@Safan Patel iCloud lock removed, please proceed with testing"

What went wrong:
- iCloud lock or passcode block stops intake.
How the team handled it:
- @Safan Patel258069
What to add to SOP:
> The SOP should say exactly where locked devices go, who chases clearance, and when a trade-in becomes unprocessable instead of lingering in the active queue.

**3. Internal liquid damage or board-level faults make the buyback unviable (491 occurrences)**
Real examples:
- "Mintelle Penaque" (4494838998): "amm; 0.007 dcps; 2.998 before prompt boot screen work fine . no liquid damage The problem is logic board level"
- "Ross Thompson" (4774835032): "dcps; 2.998 no liquid damage . no repair . i check screen is working fine The problem is logic board level issues"
- "Alex Munday (FourFront)" (5121440386): "dcps; 2.992 before prompt bot notes; no liquid damage . i checked screen work fine The problem logic board level full short"

What went wrong:
- Internal liquid damage or board-level faults make the buyback unviable.
How the team handled it:
- Please quote £180 for the repair. This ia a board level repair. 1-3 working days
What to add to SOP:
> Require the intake team to separate cosmetic grading from internal viability. Hidden liquid damage and board faults need an immediate profitability re-check before parts or labour are committed.

**4. Non-functional devices from other shops get stuck (142 occurrences)**
Real examples:
- "Syed Wahad (iPhone)" (4674131968): "Home button gets stuck. Intermittent. Battery replacement"
- "Alexander Ivanov" (5239019100): "Still stuck at 5V. No power to SSDs. Cannot find the problem yet. Need more time"
- "Cristopher Hamilton *Will get back to us at the end of the month" (9268419919): "5V 0.083 amps Device not turning on Liquid damage ,Data its important , been in other shop ( they recommended us )for inspection and show me some pictures of the liquid damage and its quite substantial . also been in apple they quote him 1400£ for board replac..."

What went wrong:
- Non-functional devices from other shops get stuck.
How the team handled it:
- iPhone Checks Screen Condition: No Damage Housing Damage: No Damage Rear Camera Lens: No Damage Rear Camera Image: Perfect Image Face IDTouch ID: Working Power Button: Working Volume Button: Working Mute Button: Working...
What to add to SOP:
> Document a stuck-device review point for non-functional BM units. If a hard fault is not isolated within the expected time, escalate to a buyback/parts-out decision instead of letting the item age in repair.

### sop-device-collection.md

#### Edge Cases Found: 4

**1. Client does not collect promptly (1509 occurrences)**
Real examples:
- "Khaled Al Kurdi" (10831736500): "Post QC Device ready to collect"
- "Philippa Mills" (11257743597): "@Adil Azad it's ready to collect"
- "Bundhita Sukit" (18277330138): "@Michael Ferrari I reassembled. can I change status to ready to collect ?"

What went wrong:
- Client does not collect promptly.
How the team handled it:
- @Michael Ferrari let me know when you've processed a refund bro
What to add to SOP:
> Add a timed chase policy for uncollected devices, especially quote rejections. The SOP should set when reminders go out, when storage escalation begins, and who owns the follow-up.

**2. Device marked ready but handoff is blocked by payment or invoice issues (917 occurrences)**
Real examples:
- "Muhammed Rashid" (4861672299): "invoiced and paid"
- "Karamveer Kahlon" (4802719948): "invoiced, booked and packaged just wiating for payment"
- "Aliye Cak" (5164725528): "Invoiced due to failed payment Postage booked Item packaged"

What went wrong:
- Device marked ready but handoff is blocked by payment or invoice issues.
How the team handled it:
- No Notification Programmed for Awaiting Confirmation End User Walk In
What to add to SOP:
> Collection needs a payment-exception branch that tells the team exactly how to handle pay-later, invoiced, or unreconciled items before the device reaches the client.

**3. Complaint or new issue raised at handover (1063 occurrences)**
Real examples:
- "Paula Mora (FQM Fashion) [000224]" (5185602226): "@Ricky Panesar Client has advised they are experiencing the same issues"
- "Simon Spies" (5506895536): "Client has contacted via email to advise that the same issues are occurring again"
- "Andrew Reid" (5416917048): "i tried the connection like 5 time but still have same issue , maybe its me , if you don't mind to check this for me ,,"

What went wrong:
- Complaint or new issue raised at handover.
How the team handled it:
- @Kae Azeez-Mukaila please arrange for it to come back in to be diagnosed.
What to add to SOP:
> At handover, any complaint or repeat fault should be logged on the same item with ownership for follow-up. The SOP should not rely on verbal escalation alone.

**4. Collection can flip into shipping or long-term storage (308 occurrences)**
Real examples:
- "Aki Gokita" (4935840745): "Ticket(22095) has already received Return Booked notification"
- "Aliye Cak" (5164725528): "Ticket(22802) has already received Return Booked notification"
- "Anil Jesani (Hudson Advisors) [1]" (5481571363): "Ticket(23831) has already received Return Booked notification"

What went wrong:
- Collection can flip into shipping or long-term storage.
How the team handled it:
- Macro Sent Hi Aki, We have been notified of the successful return of this device, so please do let us know if you have experienced any issues in receiving the package or require any further assistance. We wished to thank...
What to add to SOP:
> Document when a collection turns into a courier return, and when an uncollected item is moved into long-term storage or another holding group.

### sop-mail-in-corporate.md

#### Edge Cases Found: 3

**1. Return recipient differs from sender (4 occurrences)**
Real examples:
- "Victor Biriotti (SHM Productions)" (5608630729): "Waiting for return address"
- "Morgan Holt (Saffron Brand Consultants)" (5529694920): "Hi – you sent the courier to the wrong address (Hoxton Sq). We’re in Northburgh St in Farringdon now. I assumed you knew if you were already working with us."
- "Bhavick Morjaria (123 Technology)" (5281364902): "Thank you. Return address is: 128 Fawe Park Road London SW15 2EQ Thank you Bhavick Morjaria 123 Technology Limited Direct: 07833 954 454 | Office: 020 7060 9123 8 Shepherd Market , Suite 234 , London W1J 7JY Registered in England: 05087065 | VAT: GB 835411934..."

What went wrong:
- Return recipient differs from sender.
How the team handled it:
- LCD and Bezel damage at the bottom of the screen All other functions working perfectly, speakers are fine Please replace screen
What to add to SOP:
> Corporate mail-ins need a mandatory return-recipient confirmation step with company/site name, contact person, and shipping sign-off before dispatch.

**2. No passcode or incomplete IT handoff (62 occurrences)**
Real examples:
- "Ruth Davies (St James CE Primary School)" (5524651871): "no passcode"
- "Raj Kashyap (LaSalle Investment Management)" (5027353413): "passcode 258025"
- "Shetty Kalidas (Jones Lang LaSalle)" (4915941130): "passcode: 231258 / 150276"

What went wrong:
- No passcode or incomplete IT handoff.
How the team handled it:
- passcode not working
What to add to SOP:
> Add a corporate-specific intake checklist for passcode agreements, prior IT testing, and what functional testing we are accepting the risk of skipping.

**3. Priority repair blocked by parts or client response (144 occurrences)**
Real examples:
- "Jose Manuel Torres Gomez (Inditex)" (5406047980): "No Notification Programmed for Awaiting Part Corporate Courier"
- "Ruth Davies (St James CE Primary School)" (5432071906): "No Notification Programmed for Awaiting Part Corporate Courier"
- "Suman Rizal (GS1 UK)" (5100323590): "No Notification Programmed for Awaiting Part Corporate Courier"

What went wrong:
- Priority repair blocked by parts or client response.
How the team handled it:
- No Notification Programmed for Under Repair Corporate Courier
What to add to SOP:
> Define how priority corporate jobs are handled when they hit the same blockers as standard jobs: who chases the client, who escalates internally, and how the promised turnaround is reset.

### sop-mail-in-diagnostic.md

#### Edge Cases Found: 4

**1. Pre-repair information missing before the parcel arrives (7 occurrences)**
Real examples:
- "Wilson Goh (Oaktree Capital) [1]" (5191879090): "@Gabriel Barr please can you ask for passcode"
- "Katie Johnson" (4494097401): "please can you ask for passcode @Gabriel Barr @Kian Rogers"
- "Lee Bridges" (4976520881): "@Gabriel Barr can you ask for right password is"t need four digit"

What went wrong:
- Pre-repair information missing before the parcel arrives.
How the team handled it:
- 369369
What to add to SOP:
> Add a hard intake gate for missing diagnostic data on mail-ins. If the form is incomplete, Ferrari must chase before the device hits the active diagnostic queue, not after Saf has already opened it.

**2. Liquid damage or board-level fault discovered after arrival (123 occurrences)**
Real examples:
- "Ross Thompson" (4774835032): "dcps; 2.998 no liquid damage . no repair . i check screen is working fine The problem is logic board level issues"
- "Alex Munday (FourFront)" (5121440386): "dcps; 2.992 before prompt bot notes; no liquid damage . i checked screen work fine The problem logic board level full short"
- "Panasonic [ iPhone XR ] [2]" (5608302488): "amm; normal notes no liquid damage . wifi does not work other all parts work fine . The problem is logic board level wifi ic"

What went wrong:
- Liquid damage or board-level fault discovered after arrival.
How the team handled it:
- logic board power circuit fault: £200 turnaround 3-5 working days
What to add to SOP:
> The SOP should say that undisclosed liquid damage and board-level faults reset both quote scope and turnaround. Require photos, revised ETA, and a client update before proceeding.

**3. Passcode captured in booking is wrong (3 occurrences)**
Real examples:
- "Dhruv Parbhoo" (4340096278): "heavy LCD damage, seems to work fine besides password requested"
- "Gustav Erlandsson" (4810077339): "No Notification Programmed for Password Req End User Stuart Courier"
- "Daniel Toland" (5574143078): "Maroon coloured zip up case Damaged bezel and LCD No password Requesting"

What went wrong:
- Passcode captured in booking is wrong.
How the team handled it:
- No Notification Programmed for Awaiting Confirmation End User Courier
What to add to SOP:
> Document a same-day passcode verification step on arrival and a stop-work rule when the booking passcode is wrong.

**4. Diagnostic blocked by missing test parts (25 occurrences)**
Real examples:
- "Myra Khan" (5496228561): "@Safan Patel Please try flex replacement, flexes are wrong model and manufacturer so will likely not work but all we have"
- "Akif Malik" (4871073244): "No Notification Programmed for Awaiting Part End User Walk In"
- "Alan Ho **£100**" (5137421993): "No Notification Programmed for Awaiting Part End User Walk In"

What went wrong:
- Diagnostic blocked by missing test parts.
How the team handled it:
- @Safan Patel screen is in my room when you're ready for it
What to add to SOP:
> Add a branch for when known-good test parts are unavailable. The SOP should say how to record the blocker and how Ferrari communicates the delay to the client.

### sop-mail-in-repair.md

#### Edge Cases Found: 3

**1. Wrong or missing passcode on arrival (3 occurrences)**
Real examples:
- "Dhruv Parbhoo" (4340096278): "heavy LCD damage, seems to work fine besides password requested"
- "Gustav Erlandsson" (4810077339): "No Notification Programmed for Password Req End User Stuart Courier"
- "Daniel Toland" (5574143078): "Maroon coloured zip up case Damaged bezel and LCD No password Requesting"

What went wrong:
- Wrong or missing passcode on arrival.
How the team handled it:
- No Notification Programmed for Awaiting Confirmation End User Courier
What to add to SOP:
> For mail-ins, verify the passcode immediately on receipt and assign a named owner to chase the client if it fails. Do not let the item sit in the tech queue with a bad passcode and no callback plan.

**2. Parts delay after receipt (33 occurrences)**
Real examples:
- "John Buchanan" (5311695934): "Speaker ordered"
- "Ben Barnes (FourFront) [1]" (5318660502): "Batteries ordered"
- "Ben Barnes (FourFront)" (5356241703): "@Michael McAdam ordered."

What went wrong:
- Parts delay after receipt.
How the team handled it:
- speakers have arrived
What to add to SOP:
> Mail-ins need an explicit stock-delay path with an outbound client update. The SOP should say when to move to Awaiting Part/Awaiting Parts, when to reorder, and when to reset the promised return date.

**3. Return shipping data or courier step is blocked (447 occurrences)**
Real examples:
- "Aaron Belchamber" (5176999499): "No Notification Programmed for Book Return Courier End User Courier"
- "Adrian Mensah" (5699947432): "No Notification Programmed for Book Return Courier End User Courier"
- "Adrian Pattisson" (4740043002): "No Notification Programmed for Book Return Courier End User Courier"

What went wrong:
- Return shipping data or courier step is blocked.
How the team handled it:
- COURIER BOOKED W1W8JQ > EC2A2EW https:icorrect.monday.comboards1031579094pulses5176999499
What to add to SOP:
> Require return-address confirmation before the repair closes and document what to do when courier booking fails or shipping data is incomplete.

### sop-quoting-process.md

#### Edge Cases Found: 4

**1. Client says the quote is too expensive or not worth doing (372 occurrences)**
Real examples:
- "BM 1526 (Ben Clarke)" (11207039574): "@Safan Patel client declined quote. please reassemble"
- "Nick Frearson (The Design Museum)" (4755146262): "quote sent"
- "Tim Scarsbrook" (4326874325): "quoted 250"

What went wrong:
- Client says the quote is too expensive or not worth doing.
How the team handled it:
- ...make an offer could you kindly just send him an email with a purchase quote...
What to add to SOP:
> Add a standard response tree for value objections: restate the diagnosis, explain why the quote changed if new faults were found, and set the rule for when Ferrari can discount versus when Ricky must approve.

**2. Discounting without visibility of margin (95 occurrences)**
Real examples:
- "Inigo Melis" (5226732348): "10% discount for multi-repair. £324 total"
- "Gareth Johns" (4750456022): "Need to issue a refund of £10 as I had advised the client of a £10 discount for a multi-repair"
- "Alex Sutton" (4991430567): "discounted repair to £200"

What went wrong:
- Discounting without visibility of margin.
How the team handled it:
- CC: will come back in to have the rear housing re-done as discussed previously @Ricky Panesar
What to add to SOP:
> The SOP should require a profitability check before discounting, especially on screen repairs and bundled quotes. If cost basis is unclear, Ferrari should escalate instead of improvising a price.

**3. Client goes silent after quote sent (1246 occurrences)**
Real examples:
- "Nick Frearson (The Design Museum)" (4755146262): "quote sent"
- "Shetty Kalidas (Jones Lang LaSalle)" (4915941130): "quote sent and accepted"
- "Ilyria Remington (VCCP)" (4802224273): "quote sent for logic board"

What went wrong:
- Client goes silent after quote sent.
How the team handled it:
- general diagnostic required and possible battery
What to add to SOP:
> Document a quote follow-up cadence with a final response deadline and a clear stale-quote expiry rule. Open-ended quotes are showing up in the history as unattended waiting states.

**4. Quote declines need salvage or collection handling (11 occurrences)**
Real examples:
- "Mohammed Islam" (4849613837): "@Andres quote rejected, please reassemble"
- "Floyd Williams" (5592682730): "@Safan Patel quote rejected, please reassemble"
- "Niagara Dike" (10764073125): "@Safan Patel client declined, please reassemble"

What went wrong:
- Quote declines need salvage or collection handling.
How the team handled it:
- Could Not Reserve Stock: No Products Assigned to Mohammed Islam
What to add to SOP:
> When a quote is rejected, add a mandatory next-step decision: reassemble and return, offer a buyback, or hold for collection with a chase policy. Do not leave it as a generic rejected state.

### sop-walk-in-corporate.md

#### Edge Cases Found: 2

**1. Different collector or delivery recipient causes handoff confusion (66 occurrences)**
Real examples:
- "Jack Bird (Freuds) [FC0452]" (5459077708): "Mon Nov 6 15:10:47 2023 courier collection"
- "Stephen Guerra (Inditex)" (4383824485): "CC: To check if it was ready for collection"
- "Mark Stiles-Winfield (Universal Rentals)" (4751313407): "device collected by derek and invoice sent to mark"

What went wrong:
- Different collector or delivery recipient causes handoff confusion.
How the team handled it:
- Confirmed Quotation A2338 Screen: £425 Diagnostic: £50 Custom: MacBook Pro M1 A2338 Trackpad Flex (160) None TOTAL: £635
What to add to SOP:
> Add a named recipient field and a confirmation step for whether the device is being collected or couriered back to someone else in the company.

**2. Priority job still stalls on parts or missing information (10 occurrences)**
Real examples:
- "Harry McAllister (Freuds) FC0374" (4416798870): "@Safan Patel ordered."
- "iPad 7th gen | 3736 | ZARA [1]" (5415528667): "LCD ordered, should arrive Monday"
- "Harry McAllister (Freuds) [FC0350]" (5036905844): "@Safan PatelOrdered. Arriving tomorrow."

What went wrong:
- Priority job still stalls on parts or missing information.
How the team handled it:
- i"m waiting for keyboard back-light
What to add to SOP:
> Corporate priority should have an escalation clock. If parts, passcode, or approval gaps are blocking the job, the SOP should say who owns the escalation and by when.

### sop-walk-in-diagnostic.md

#### Edge Cases Found: 4

**1. Passcode or intake detail missing for diagnosis (9 occurrences)**
Real examples:
- "James Buckley" (5381129088): "@Gabriel Barr need passcode"
- "Richard Thorn [2] (Overbury EOS)" (5020171986): "@Safan Patel we need passcode for more testing"
- "Harry McAllister (Freuds) FC0325" (4416596671): "please can you ask for password @Gabriel Barr @Jaco Jaco"

What went wrong:
- Passcode or intake detail missing for diagnosis.
How the team handled it:
- @Andres Egas client provided password - Skittles12a
What to add to SOP:
> Before the device leaves reception, confirm the passcode and capture the full diagnostic story. If any of that is missing, assign Ferrari a same-day client follow-up and block the device from entering active diagnostics until the gap is closed.

**2. Liquid damage expands the scope (277 occurrences)**
Real examples:
- "Holly McHugh" (18251678109): "Client paid for keyboard, trackpad and liquid damage treatment. @Safan Patel please clean corrosion and proceed with keyboard. Trackpad arriving tomorrow"
- "Mahira Abbasi" (4490361354): "...client had included with the macbook states that the device has been liquid damaged. I can confirm this is correct. There are areas of corrosion on the logic board. For this reason we are requrired to complete a diagnostic on the device to confirm if any addi..."
- "Nick Frearson (The Design Museum) 0532 [2]" (4696287296): "...is ready for collection at your convenience. This one had some minotr liquid damage in the charging port which was preventing the correct transfer of power. Luckily, none of the liquid or corrosion had spread to the interior workings of the device. We are look..."

What went wrong:
- Liquid damage expands the scope.
How the team handled it:
- Trackpad Received: In repair box @Safan Patel
What to add to SOP:
> State that liquid damage often turns a single-fault diagnostic into board plus peripheral work. The SOP should force photo evidence, risk warnings, and a clear line between data-recovery-only outcomes and full functional repair outcomes.

**3. Logic-board or intermittent faults take longer than promised (261 occurrences)**
Real examples:
- "Sergey Ershov" (5540092321): "issue is logic board level"
- "Simon Spies" (5506895536): "top board booting fine iphone has logic board level"
- "Charlotte Omo-Edoh" (5455971933): "macbook has backlight issues on logic board level .i checked new screen but still same no backlight"

What went wrong:
- Logic-board or intermittent faults take longer than promised.
How the team handled it:
- Advised client that we have to diagnose the MacBook further.
What to add to SOP:
> Add an escalation rule for intermittent and board-level faults: when the fault is not isolated within the promised window, extend the ETA through Ferrari and record the reason in Monday rather than letting the ticket silently age.

**4. Test parts not available during diagnosis (58 occurrences)**
Real examples:
- "Kajal Gadhok [2]" (4835911474): "Batt out of stock - due 07/08"
- "Harry McAllister (Freuds) [FC0320]" (5383504763): "@Safan Patel yes because Touch Bar in Uk was out of stock."
- "Aideen Johnston" (5105295106): "No Notification Programmed for Awaiting Part End User Walk In"

What went wrong:
- Test parts not available during diagnosis.
How the team handled it:
- quote: battery
What to add to SOP:
> Include a branch for diagnostics blocked by test-part availability. The SOP should say when to substitute a known-good part, when to stop, and which status/group to use while waiting.

### sop-walk-in-simple-repair.md

#### Edge Cases Found: 4

**1. Wrong or missing passcode at intake (10 occurrences)**
Real examples:
- "Panagiotis Sfikas" (5287446355): "i need passcode for more diagnose . 0610 is wrong passcode it"s need six digit passcode @Meesha Panesar"
- "Raymond Nyanzi" (4542560751): "restore is done now . please tell to Client to remove his icloud account @Kian Rogers because 218079 is wrong password .without right password i can"t active phone"
- "James Buckley" (5381129088): "@Gabriel Barr need passcode"

What went wrong:
- Wrong or missing passcode at intake.
How the team handled it:
- @Safan Patel can you take a picture of the passcode screen. the client says it is 4digit
What to add to SOP:
> At intake, test the passcode live with the customer before they leave. If it fails or the customer will not provide it, record who owns the follow-up, the callback deadline, and whether repair/testing can continue without full access.

**2. Extra fault found during repair (7 occurrences)**
Real examples:
- "Alexander Scott // Judy Bediako" (5426306684): "...amage treatment in order to prevent further damage in the future, and would also need to replace the faulty Charging Port. Please find below a quotation for the repair: MacBook Pro 13 A2338 Liquid Damage Treatment: £140 MacBook Pro 13 A2338 Charging Port Repla..."
- "Harry McAllister (Freuds) [FC0373]" (5036782046): "@Andres Egas Please can you reassemble this one and fully test it? It also needs a battery run down test to ensure it has no fault."
- "Lulu Halloran" (5297442019): "...of the screen. As a result, in order to complete the screen repair we would also need to replace the battery as attempting to do so without replacing the battery will result in damage to the replacement screen, either during or soon after fitting the screen as..."

What went wrong:
- Extra fault found during repair.
How the team handled it:
- No Notification Programmed for Quote Sent End User Walk In
What to add to SOP:
> Add a decision branch for mid-repair discoveries: pause work, log the extra fault in Monday, capture images if relevant, tell the client what changes in price/turnaround, and do not proceed until approval is recorded.

**3. Parts unavailable after intake (77 occurrences)**
Real examples:
- "Scott Bannon" (5413347769): "Part ordered."
- "Bonnie Lee-Gorton" (5225644938): "Screen ordered"
- "Harry McAllister (Freuds) FC0374" (4416798870): "@Safan Patel ordered."

What went wrong:
- Parts unavailable after intake.
How the team handled it:
- post repair all good
What to add to SOP:
> Require a same-day stock check after intake and define what happens when stock is missing: move to the correct waiting status/group, tell the client the revised ETA, and assign ownership for ordering and client updates.

**4. QC rejection and rework loop (17 occurrences)**
Real examples:
- "Thanos Tzanetopoulos" (11432601031): "Device qc by me"
- "Cristopher Hamilton *Will get back to us at the end of the month" (9268419919): "@Safan Patel can this go to QC?"
- "Khaled Al Kurdi" (10831736500): "Post QC Device ready to collect"

What went wrong:
- QC rejection and rework loop.
How the team handled it:
- Client paid £300 for data recovery. Will be back sometime next week or the week after to collect.
What to add to SOP:
> Document the QC fail loop using the live Monday label, require a failure note plus images, and force a re-test checklist before the item returns to QC.

## Part 2: Monday Field Verification

### sop-bm-return-repair.md

| SOP Reference | Monday Reality | Match? | Fix Needed |
|---------------|---------------|--------|------------|
| "BM Returns" | Group "BM Returns" exists (id: new_group_mkmybfgr) | YES | — |
| "Status" | Column "Status" exists (id: lookup_mkyezesb, type: mirror) | YES | — |
| "Shipment Status" | Column "Shipment Status" exists (id: status4, type: status) | YES | — |
| "Repaired" | Status column "Status" has "Repaired" (column id: status4) | YES | — |

### sop-bm-return.md

| SOP Reference | Monday Reality | Match? | Fix Needed |
|---------------|---------------|--------|------------|
| "BM Returns" | Group "BM Returns" exists (id: new_group_mkmybfgr) | YES | — |
| "Status" | Column "Status" exists (id: lookup_mkyezesb, type: mirror) | YES | — |
| "Shipment Status" | Column "Shipment Status" exists (id: status4, type: status) | YES | — |

### sop-bm-sale.md

| SOP Reference | Monday Reality | Match? | Fix Needed |
|---------------|---------------|--------|------------|
| "Shipped" | Status column "Shipment Status" has "Shipped" (column id: status4) | YES | — |
| "Ready To Ship" | Status column "Shipment Status" has "Ready To Ship" (column id: status4) | YES | — |
| "Outbound Tracking" | Column "Outbound Tracking" exists (id: text53, type: text) | YES | — |
| "BM Listing ID" | Column "BM Listing ID" exists (id: text_mkyd4bx3, type: text) | YES | — |
| "BM Sales Order ID" | Column "BM Sales Order ID" exists (id: text_mkye7p1c, type: text) | YES | — |

### sop-bm-trading.md

| SOP Reference | Monday Reality | Match? | Fix Needed |
|---------------|---------------|--------|------------|
| "sent" | No status "sent" exists on BM Devices | NO | Replace with the live status label. |
| "BM Number" | No column "BM Number" exists on BM Devices | NO | Replace with the live column name/ID. |
| "Trade-in Order ID" | Column "Trade-in Order ID" exists (id: lookup_mm1vzeam, type: mirror) | YES | — |
| "required parts" | Column "Parts Required" exists (id: board_relation_mm01yt93, type: board_relation) | YES | — |
| "Parts Used" | Column "Parts Used" exists (id: connect_boards__1, type: board_relation) | YES | — |
| "Repair Tech" | Column "Repair Tech" exists (id: lookup_mkxfm694, type: mirror) | YES | — |

### sop-device-collection.md

| SOP Reference | Monday Reality | Match? | Fix Needed |
|---------------|---------------|--------|------------|
| "Ready To Collect" | Status column "Status" has "Ready To Collect" (column id: status4) | YES | — |
| "Returned" | Status column "Status" has "Returned" (column id: status4) | YES | — |
| "Case" field | Column "Case" exists (id: status_14, type: status) | YES | — |
| "Payment Status" | Column "Payment Status" exists (id: payment_status, type: status) | YES | — |
| "Awaiting Collection" | Group "Awaiting Collection" exists (id: new_group34086) | YES | — |
| "Devices Left in Long Term" | Group "Devices Left in Long Term" exists (id: long_term_contact) | YES | — |

### sop-mail-in-corporate.md

| SOP Reference | Monday Reality | Match? | Fix Needed |
|---------------|---------------|--------|------------|
| "Payment Status" | Column "Payment Status" exists (id: payment_status, type: status) | YES | — |
| "Passcode" | Column "Passcode" exists (id: text8, type: text) | YES | — |
| "Outbound Tracking" | Column "Outbound Tracking" exists (id: text53, type: text) | YES | — |

### sop-mail-in-diagnostic.md

| SOP Reference | Monday Reality | Match? | Fix Needed |
|---------------|---------------|--------|------------|
| "Passcode" | Column "Passcode" exists (id: text8, type: text) | YES | — |
| "Ammeter Reading" | Column "Ammeter Reading" exists (id: color_mkwr7s1s, type: status) | YES | — |
| "Diagnostic Complete" | Status column "Status" has "Diagnostic Complete" (column id: status4) | YES | — |
| "Quote Sent" | Status column "Status" has "Quote Sent" (column id: status4) | YES | — |

### sop-mail-in-repair.md

| SOP Reference | Monday Reality | Match? | Fix Needed |
|---------------|---------------|--------|------------|
| "Repaired" | Status column "Status" has "Repaired" (column id: status4) | YES | — |
| "Passcode" | Column "Passcode" exists (id: text8, type: text) | YES | — |
| "Payment Status" | Column "Payment Status" exists (id: payment_status, type: status) | YES | — |
| "Requested Repairs" | Column "Requested Repairs" exists (id: board_relation, type: board_relation) | YES | — |
| "Parts Used" | Column "Parts Used" exists (id: connect_boards__1, type: board_relation) | YES | — |
| "Outbound Tracking" | Column "Outbound Tracking" exists (id: text53, type: text) | YES | — |

### sop-quoting-process.md

| SOP Reference | Monday Reality | Match? | Fix Needed |
|---------------|---------------|--------|------------|
| "Quote Rejected" | Status column "Repair Type" has "Quote Rejected" (column id: status24) | YES | — |
| "diagnostic complete" | Status column "Status" has "Diagnostic Complete" (column id: status4) | YES | — |
| "Quote Sent" | Status column "Status" has "Quote Sent" (column id: status4) | YES | — |
| "Ready to Quote" | Status column "Status" has "Ready to Quote" (column id: status4) | YES | — |

### sop-walk-in-corporate.md

| SOP Reference | Monday Reality | Match? | Fix Needed |
|---------------|---------------|--------|------------|
| "Passcode" | Column "Passcode" exists (id: text8, type: text) | YES | — |
| "Client" | Column "Client" exists (id: status, type: status) | YES | — |
| "Technician" | Column "Technician" exists (id: person, type: people) | YES | — |
| "Outbound Tracking" | Column "Outbound Tracking" exists (id: text53, type: text) | YES | — |

### sop-walk-in-diagnostic.md

| SOP Reference | Monday Reality | Match? | Fix Needed |
|---------------|---------------|--------|------------|
| "diagnostic complete" | Status column "Status" has "Diagnostic Complete" (column id: status4) | YES | — |
| "Diagnostic" | Status column "Status" has "Diagnostics" (column id: status4) | YES | — |
| "Passcode" | Column "Passcode" exists (id: text8, type: text) | YES | — |
| "Ammeter Reading" | Column "Ammeter Reading" exists (id: color_mkwr7s1s, type: status) | YES | — |
| "Technician" | Column "Technician" exists (id: person, type: people) | YES | — |

### sop-walk-in-simple-repair.md

| SOP Reference | Monday Reality | Match? | Fix Needed |
|---------------|---------------|--------|------------|
| "Repaired" | Status column "Status" has "Repaired" (column id: status4) | YES | — |
| "Ready to Collect" | Status column "Status" has "Ready To Collect" (column id: status4) | YES | — |
| "QC Fail" | No exact status "QC Fail" on iCorrect Main Board; closest is "QC Failure" in "Status" (column id: status4) | PARTIAL | Use "QC Failure". |
| "collected/returned" | Status column "Status" has "Returned" (column id: status4) | YES | — |
| "Case" | Column "Case" exists (id: status_14, type: status) | YES | — |
| "Passcode" | Column "Passcode" exists (id: text8, type: text) | YES | — |
| "Technician" | Column "Technician" exists (id: person, type: people) | YES | — |
| "Requested Repairs" | Column "Requested Repairs" exists (id: board_relation, type: board_relation) | YES | — |
| "Parts Used" | Column "Parts Used" exists (id: connect_boards__1, type: board_relation) | YES | — |

### Activity Log Coverage Gaps

#### Statuses used in practice but not mentioned in any SOP
- Complete (718 activity-log updates)
- Active (602 activity-log updates)
- Queued For Repair (312 activity-log updates)
- Under Repair (242 activity-log updates)
- Received (141 activity-log updates)
- Repair Paused (138 activity-log updates)
- Diagnostic (111 activity-log updates)
- Under Refurb (101 activity-log updates)
- ON (98 activity-log updates)
- Invoiced (88 activity-log updates)
- Pending (87 activity-log updates)
- Invoiced - Xero (87 activity-log updates)

#### Groups used in practice but not covered by any SOP
- Safan (Short Deadline) (386 moves)
- Quality Control (197 moves)
- Client Services - To Do (172 moves)
- Client Services - Awaiting Confirmation (166 moves)
- Awaiting Confirmation of Price (147 moves)
- Today's Repairs (104 moves)
- Incoming Future (85 moves)
- Outbound Shipping (76 moves)
- Mykhailo (52 moves)
- Awaiting Parts (33 moves)
- Andres (22 moves)
- Roni (21 moves)

#### Columns manually updated in practice but not referenced by any SOP
- **Deadline** (477 manual updates)
- Paid (211 manual updates)
- Custom Products (205 manual updates)
- Client Side Deadline (197 manual updates)
- IMEI/SN (158 manual updates)
- Colour (153 manual updates)
- Device (143 manual updates)
- Repair Type (136 manual updates)
- Priority (107 manual updates)
- Service (105 manual updates)
- Walk-in Notes (104 manual updates)
- Stock Checkout ID (103 manual updates)

## Part 3: Gap Summary

| SOP | Edge Cases Found | Monday Issues | Ready for Naheed? |
|-----|-----------------|---------------|-------------------|
| sop-bm-return-repair.md | 3 | 0 | NO — edge cases need adding |
| sop-bm-return.md | 3 | 0 | NO — edge cases need adding |
| sop-bm-sale.md | 3 | 0 | NO — edge cases need adding |
| sop-bm-trading.md | 4 | 2 missing | NO — Monday fixes needed first |
| sop-device-collection.md | 4 | 0 | NO — edge cases need adding |
| sop-mail-in-corporate.md | 3 | 0 | NO — edge cases need adding |
| sop-mail-in-diagnostic.md | 4 | 0 | NO — edge cases need adding |
| sop-mail-in-repair.md | 3 | 0 | NO — edge cases need adding |
| sop-quoting-process.md | 4 | 0 | NO — edge cases need adding |
| sop-walk-in-corporate.md | 2 | 0 | YES after recommendations are added |
| sop-walk-in-diagnostic.md | 4 | 0 | NO — edge cases need adding |
| sop-walk-in-simple-repair.md | 4 | 1 partial | NO — Monday fixes needed first |

### Priority Order For Naheed

1. sop-walk-in-simple-repair.md - core walk-in intake
2. sop-walk-in-diagnostic.md - BM/non-functional diagnostic path is inherited from here
3. sop-mail-in-repair.md - mail-in intake and shipping
4. sop-mail-in-diagnostic.md - mail-in diagnostic intake
5. sop-device-collection.md - front-desk handoff and completion
6. sop-bm-trading.md - BM intake, grading, and parts/profit decisions
7. sop-bm-sale.md - BM dispatch workflow
8. sop-mail-in-corporate.md - corporate intake variations
9. sop-walk-in-corporate.md - corporate walk-in intake variations
10. sop-quoting-process.md - client approval bottleneck after diagnostics
11. sop-bm-return-repair.md - BM warranty edge cases after sale
12. sop-bm-return.md - BM refund/replacement edge cases
