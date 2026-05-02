# Domain Capture: Enquiry -> Intake -> Triage -> Quote Handoff
Last updated: 2026-04-24 01:53 UTC
Status: active working draft
Owner: Ops / Ricky
Scope: current-state truth capture and future-state rule clarification for enquiry, intake, triage, quote handoff, and intake completion gates

## Purpose
This file captures the current-state and future-state understanding of the enquiry, intake, triage, and quote-handoff domain.

It is a process-truth capture file, not a final SOP.
Its job is to separate:
- what actually happens today
- what breaks today
- what the clean governing model should be
- what future SOP and KB outputs need to exist

Rule: document continuously during sessions with Ricky. Do not wait until the end of a long conversation.

---

## Current State, Reality Today

### Confirmed current ownership update
- **Front-desk / intake owner (current reality):** Naheed
- Ricky describes Naheed as:
  - a new employee
  - a graduate
  - smart
  - previously worked at iCorrect as an intern
- Naheed should now replace stale assumptions that intake/front-desk ownership still sits with Adil.
- Ricky wants Naheed discussed properly, but is happy to park a deeper role breakdown for a later pass if that helps flow.

### Immediate implication
- Existing documentation that still implies Adil is the live intake/front-desk owner is out of date.
- The active owner map should be updated to reflect Naheed as the current intake/front-desk owner, with deeper process details still to be captured.

### Confirmed / corrected channel notes from Ricky

#### Phone enquiries
- Phone enquiries are real and important.
- Current tracking is weak.
- A Slack-based call logging module was attempted, half-used by Ferrari, never properly finished, and effectively died because adoption was manual and inconsistent.
- Current phone system runs on VoIP.
- Ricky can obtain weekly spreadsheet-style inbound-call volume, but not reliable inquiry-quality data.
- Current phone data does **not** cleanly answer:
  - who the caller was
  - whether it was a genuine new enquiry
  - whether it was a sale, chase, or existing customer follow-up
  - what was actually said
- No transcription layer currently exists, so phone calls are one of the weakest evidence and SOP-building surfaces.

#### Walk-ins
- Walk-ins are a major current channel.
- Walk-ins come in through:
  - website bookings
  - phone bookings
  - physical walk-ins to the building
- For physical walk-ins, customers fill out a Typeform on arrival.
- That Typeform submission goes into Slack and the team then goes upstairs to see the customer.
- Ricky says the inquiry-triage details for this exist in the intake-system material.
- The walk-in intake path is one of the stronger current channels.

#### Walk-in / booking system path
- Current digital flow is broadly: Typeform -> n8n -> Intercom + Monday + Slack notification.
- Ricky wants this rebuilt.
- Desired future state: iCorrect-owned interface rather than fragile form glue, with better questioning and more complete intake before staff interaction.
- Desired future state also includes the customer being able to ask questions inside that intake experience.

#### Email / website enquiries
- Email enquiries exist and are real.
- Website enquiries also exist through the newer quote wizard / web flow.
- Direct emails from customers should be treated as part of the Intercom-fronted communication layer.
- Ricky considers email effectively under Intercom because Intercom is the front end for that communication stack.

#### Intercom as front-end comms hub
- Intercom is used as the front-end communication layer because it links with Instagram DM, WhatsApp channels, and related channels without repeated re-auth.
- WhatsApp exists in Intercom, but Ricky does **not** consider WhatsApp a real intake path or a meaningful communication path operationally.
- Email should be grouped under Intercom in the current-state model.
- Ricky is not satisfied with the current Intercom UI / setup experience.

#### Back Market
- Back Market is important operationally, but Ricky does not consider it a normal enquiry path in the same sense as phone/email/walk-in.
- It should be modeled separately as trade-in orders and resale orders.
- Walk-ins plus Back Market are among the strongest current operating channels.

#### Corporate
- Corporate still exists but is lower-volume than before.
- It is part of the business, but not currently a dominant channel.

#### Slack / Telegram direction
- Slack is not as strong internally as it used to be.
- Ricky would prefer to move toward Telegram with bots/integrations rather than continue investing in Slack as the main internal interaction layer.

### First confirmed channel-health view
- **Strongest current channels:** walk-ins, Back Market
- **Weakest current channel:** phone enquiries, because they are not tracked properly
- **Current communications grouping rule:** email belongs under Intercom

---

## Observed inbound-channel map from existing evidence
This section is evidence-first and needs Ricky confirmation/correction.

### 1) Phone enquiry
**Observed path:** live phone call -> Slack `/call` intake tool -> optional Intercom -> optional Monday
- First landing point: phone call answered by staff, then Slack-based intake tool
- Systems evidenced: phone, Slack, `telephone-inbound`, Intercom, Monday
- Record-creation note: can become Slack-only, Intercom-only, or Intercom+Monday depending on operator choice
- Confidence: high on technical path, lower on live adoption consistency

### 2) Walk-in customer
**Observed path:** Shopify walk-in booking or Typeform walk-in form -> n8n -> Intercom + Monday
- First landing point: Shopify or Typeform
- Systems evidenced: Shopify, Typeform, n8n, Intercom, Monday, Slack
- Record-creation note: verified digital path exists, but audit did not prove every walk-in uses it
- Confidence: high on digital path, medium on universality

### 3) Mail-in / send-in customer
**Observed path:** Shopify order, Intercom/email-led intake, or phone-led intake -> Monday + Intercom
- First landing point: Shopify, Intercom/email, or phone intake path
- Systems evidenced: Shopify, Intercom, Monday, phone-to-Slack tool
- Record-creation note: Shopify path is automated; non-Shopify path is mixed/manual
- Confidence: medium-high

### 4) Corporate / B2B enquiry
**Observed path:** website corporate/contact form -> Intercom company/contact/ticket -> later Monday classification as corporate
- First landing point: Shopify-hosted contact form or direct account-led contact
- Systems evidenced: Shopify contact form, n8n, Intercom, Slack, Monday
- Record-creation note: Intercom path is well evidenced; dedicated automated Monday creation path is less clearly proven
- Confidence: medium

### 5) Back Market trade-in
**Observed path:** BM seller order -> BM API -> scheduled ingestion -> Monday Main Board + BM Devices Board
- First landing point: Back Market platform
- Systems evidenced: BM API, VPS services/scripts, Monday boards, Telegram
- Record-creation note: creates operational records after BM `SENT` state, not at first customer intent
- Confidence: high

### 6) Back Market resale order
**Observed path:** BM buyer order on listed inventory -> BM API -> sale detection -> Monday/BM device update
- First landing point: Back Market platform
- Systems evidenced: BM API, sale-detection scripts, Monday, BM Devices board
- Record-creation note: this is order fulfilment intake, not repair intake, but still part of wider operating channels
- Confidence: high

### 7) Intercom direct enquiry surfaces
**Observed path:** web/contact/social/messaging conversation -> Intercom -> sometimes n8n -> Monday
- First landing point: Intercom
- Systems evidenced: Intercom with conversation sources including admin-created, Instagram, WhatsApp; active `create-repair` path into Monday
- Record-creation note: not every Intercom conversation becomes a Monday item; routing depends on workflow and human action
- Confidence: high on existence, medium on exact current routing rules

### 8) Typeform intake surfaces beyond walk-in
**Observed forms:** Enquiry Form, Phone Enquiry, Collection Form, Drop-Off Form, Pre-Repair Questions, Corporate Onboarding Form, BM Trade-In Form
- First landing point: Typeform
- Systems evidenced: Typeform, n8n, Slack, Monday, Intercom depending on form
- Record-creation note: some form-to-workflow mappings are verified, others are known but not fully mapped yet
- Confidence: medium

## Current-State Questions Still To Capture
- What exactly counts as intake in current operations?
- Which parts of intake are handled by Naheed versus Ferrari versus workshop staff versus automation?
- Which of the observed inbound channels are truly current, and which are stale / partial / edge-case only?
- For each live channel, who sees it first in reality?
- For each live channel, what is the canonical first system of record?
- What is the step-by-step path from first customer contact to a repair item being ready for workshop action?
- Where do triage decisions happen today?
- What information is required before quote handoff?
- What breaks most often in this flow?

---

## Confirmed current-state record / ownership map by channel

### 1) Phone enquiry
**First meaningful record:** only created if the caller explicitly wants to book in and staff actually take details.

**Current owner at that point:**
- primary: Ferrari
- assisted by: Naheed when he answers

**What usually happens next:**
- details are taken manually
- customer/contact should be added into Intercom
- job should be added into Monday
- in practice, this is not done consistently enough

**Important truth:**
- many phone enquiries never become a reliable first-class system record
- phone only becomes operationally visible when someone actively converts it into a booking/intake object

### 2) Physical walk-in
**First meaningful record:** iPad Typeform submission in the building

**Current owner at that point:**
- lead: Naheed
- backup: Andres / office team

**What usually happens next:**
- submission goes down to Naheed / office team
- they go upstairs to see the client
- if customer is already booked in, details already exist
- if not booked in, they fill out what they are there for
- same intake pattern is also used for collections, though collection is not an enquiry

**Important truth:**
- physical walk-in intake appears to be one of the clearest real starting records in the business

### 3) Website booking / booked repair order
**First meaningful record:** Monday incoming entry created from website booking flow

**Current owner at that point:**
- system creates the entry
- operationally observed/managed by Ricky via Slack/iPhone notification and then by team workflow

**What usually happens next:**
- Slack notification fires
- Monday incoming item is created
- details should flow through the booking path

**Known problem:**
- Monday record does not cleanly show what product was booked
- mapping between Monday, SumUp, and Shopify products/pricing is poor
- Ricky states Ferrari-built automation was not built well and now needs rebuild

### 4) Website enquiry / email enquiry
**First meaningful record:** Intercom message / conversation

**Current owner at that point:**
- Ferrari

**What usually happens next:**
- Ferrari replies
- this is also an area where Ricky wants agents to assist with replies

**Grouping rule:**
- website enquiries and direct email should be modeled under Intercom as the front-end communication layer

### 5) Back Market trade-in
**First meaningful record:** Monday item created when the seller marks the device as sent and the script ports it into Monday

**Current owner at physical receipt stage:**
- Naheed / Ronnie

**What usually happens next:**
- BM dashboard shows incoming devices before physical arrival
- when delivered in store, team opens the box
- checks that device matches expected one
- serial number is entered
- serial / iCloud check is run
- item marked received
- item goes through diagnostic process
- if all good, payout happens

**Important truth:**
- BM trade-in does work through automation, but not perfectly
- meaningful internal record begins when BM seller has sent device, not at initial intent stage

### 6) Back Market resale order
**First meaningful record:** automated Monday update when listed product sells

**Current owner at that point:**
- system / automation first
- then ops/shipping flow takes over

**What usually happens next:**
- sale is marked in Monday
- automation buys labels
- Slack posting happens
- downstream fulfilment flow continues through BM resale process

### 7) Corporate enquiry
**First meaningful record:** website corporate form submission -> Slack notification

**Current owner at that point:**
- Ferrari

**What usually happens next:**
- Ferrari contacts the customer
- clarifies what they need
- Ricky may join a call if needed

**Important truth:**
- corporate process exists but is not well-used and not fully trusted
- Ricky is unsure whether the current form flow is working perfectly
- volume is low, with one conversion this year noted in this discussion

## Open Follow-Up On Naheed
To capture later:
- exact responsibilities
- working hours / schedule relevance
- systems touched
- what he owns fully vs partially
- what he escalates and to whom
- whether he is replacing old Adil-owned work 1:1 or whether the intake model itself has changed

---

## Confirmed intake-ready information requirements
This section reflects Ricky’s stated operational need, not just what current forms happen to collect.

### Core identity / contact package
Minimum customer/device identity data needed:
- customer name
- phone number
- email address
- device type
- exact model
- serial number
- IMEI

Notes:
- serial/IMEI are often taken once the device is physically with the team
- historically there was intent to capture serial before booking so parts could be confirmed, but that was not built properly

### Fault / presenting issue package
Minimum issue data needed:
- stated fault
- what customer says is wrong
- enough context to understand whether this is straightforward or needs deeper diagnostic handling

### Security / access package
Needed today:
- passcode or password where required for testing/diagnostics

Target-state direction:
- Ricky wants a future method that reduces or avoids dependency on passcodes/passwords where possible

### Diagnostic route vs normal repair route
Ricky wants this domain split explicitly into:
1. diagnostic route
2. normal repair route

This is important because the information needed is not identical.

---

### Diagnostic-route information needed
For diagnostics, the goal is to build the **story of the device** so hidden causes do not surprise the team later.

Important diagnostic questions / context:
- have you been to the Apple Store before?
- if yes, what happened there?
- did Apple quote too high?
- was replacement suggested instead of repair?
- has the device been repaired before?
- if yes, what repairs were done?
- was the device bought new or used?
- did the customer buy a potentially problematic / "dodgy" device?
- what are the circumstances of failure?
- how did the break happen?
- if liquid damage, what liquid and under what circumstances?
- if device went dead, was it used with a genuine charger or fake charger?
- when did it fail / when was it last working properly?
- has anyone else already looked at it?
- is the customer’s data important?

Ricky’s framing:
- diagnostic intake is about creating a reliable narrative of what happened to the device
- the better the story, the less likely hidden issues will “creep up” later

### Normal repair-route information needed
For standard / non-diagnostic repairs, story/context still matters, just with a narrower focus.

Important normal-repair questions / context:
- has it been repaired before?
- has it been to Apple before?
- when did it break?
- how long has it been broken?
- is there anything that suggests hidden complications may exist?
- warranty status / whether it is a warranty case

Operational point:
- even for a simple repair like a screen repair, team should probe for adjacent issues (for example battery condition or signs of deeper damage)
- intake should help the team test assumptions before device work starts

---

### Current-state capture gap
- some of this information is taken on the phone but not recorded anywhere
- some is taken through the pre-arrival Typeform sent by email
- some is written back against the Monday item after physical walk-in
- much of it is not being captured as clean structured fields

### Current form gap
- current Typeform asks some useful questions but is not yet the full desired intake engine
- it does ask whether customer has seen pricing before
- Ricky wants a much stronger guided system that takes the customer down the right question path and extracts maximum relevant context before the device arrives

### Desired target-state intake behaviour
- booking / enquiry path should dynamically ask the right questions based on repair type and risk
- system should collect more pre-arrival context, not less
- intake should surface anything likely to affect repairability, pricing, parts, warranty, or hidden risk
- website bookings should automatically receive the standard question set
- the question set should be grounded in actual repair/diagnostic data, not guessed

---

## Confirmed current-state triage rules

### Hard split: normal repair vs diagnostic
Current practical rule:
- if device does **not turn on**, it is diagnostic
- if device has **liquid damage** or suspected liquid damage, it is diagnostic

Additional example:
- keyboard repair with suspected liquid damage should be treated as diagnostic, not simple repair

### Not worth booking / not a fit
Current examples given by Ricky:
- older devices, especially pre-2016
- older iPhones such as iPhone X / iPhone 8 where repair economics and customer fit are poor
- customers who are very question-heavy / time-intensive relative to likely value

Interpretation:
- this is not only a technical triage decision, it is also a commercial-fit and customer-fit decision
- current-state fit filtering includes implicit commercial judgment and tolerance for difficult / low-value interactions

### Who makes the decision today
Current state is mixed but socially understood inside the business.

**Ferrari:**
- decides on phone calls and enquiries
- also decides when items physically walk in and are being discussed at intake stage

**Technicians / workshop:**
- if they see signs of liquid damage or deeper complications, they can escalate and shift the job into diagnostic handling

**Customer self-selection:**
- quote wizard can steer customer toward diagnostic when liquid damage / fault pattern suggests it

### Important current-state truth
- triage is partly explicit, partly tribal knowledge
- a lot of the split is "just known in the company"
- this is exactly the sort of logic that needs to become explicit if the business is going to move beyond person-dependent decision-making

### Early triage logic now visible
**Diagnostic indicators:**
- dead / not turning on
- suspected liquid damage
- likely hidden board-level or internal complexity

**Normal repair indicators:**
- straightforward issue without red-flag context
- no known liquid damage
- device turns on / can be tested normally

**Not-fit indicators:**
- poor commercial value by device age / repair economics
- low-value but high-friction customer interaction profile

---

## Confirmed current-state handoff flow after triage

### A) Normal repair flow (current reality)
Typical current path:
1. often booked via Shopify
2. details are set on Monday
3. if mail-in service, packaging is sent to customer
4. customer sends device in
5. when device arrives, Naheed or Ronnie unpacks the box, labels it, checks it is the same device, and marks it as received
6. intended state is that the part should already be saved/reserved, but Ricky says this is **not a true process yet**
7. device is digitally added to a repairer’s queue, probably Saf’s
8. device is physically put into the small storage room until ready for repair
9. device goes to technician for repair
10. for normal repair, client is usually paying up front on walk-in or via website
11. repair is completed
12. pre-testing is completed / team looks out for additional faults
13. repaired device goes through QC process

**Common break points in normal repair handoff:**
- information given by email, phone call, or in person does not get written onto Monday
- technicians therefore do not see important context
- parts reservation is not truly working as an operational process
- customer turnaround expectations are being set, but actual delivery is likely not matching quoted turnaround
- queue delay and physical waiting in storage room affect timing

### B) Diagnostic flow (current reality)
Typical current path:
1. may be booked via website or start from email enquiry
2. business usually speaks to customer first; it is rare to have no information at all
3. if details are missing, customer is emailed for more information
4. if customer physically walks in, team asks about damage / repair history / device story, but this is not captured in a sufficiently structured way and can be lost
5. diagnostic customer pays `£49` up front
6. when device arrives in, it is physically marked in like a walk-in
7. device then sits in the small storage room until Saf is ready, because diagnostics go into his physical queue
8. a deadline is attached, normally around two working days
9. Saf usually repairs/diagnoses close to that deadline because he is queued up
10. Saf completes the diagnostic and writes diagnostic notes
11. handoff then goes to Ferrari to be quoted
12. Ferrari writes quote in Intercom and sends it to customer by email
13. customer may accept, decline, or discuss by email/phone
14. if accepted, Ferrari issues invoice
15. once paid, job goes into repair queues

**Common break points in diagnostic handoff:**
- the device story is not being captured as clean structured data and can be lost in translation
- diagnostic notes may be incomplete, rushed, or wrong
- Ferrari is dependent on Saf’s notes being accurate enough to quote from
- quotation sits in a translation layer from Saf -> Ferrari -> customer
- parts may be out of stock even after acceptance
- repair can be delayed because Saf has not yet repaired, or because parts are missing
- information can be lost between customer conversation, diagnostic notes, and quote-writing

### Important operational truth now visible
This is not a simple linear handoff. The actual risk points are:
- missing context before the tech sees the device
- weak structured capture of the device story
- delay between physical intake and technician readiness
- Saf -> Ferrari translation risk on diagnostics
- part-availability risk after quote/acceptance
- quoted turnaround vs actual delivery mismatch

---

## Ownership

## Confirmed practical owner map in this domain

### First response
- email: Ferrari
- phone call: Ferrari
- physical walk-in: Naheed

### Intake capture
- email: probably Ferrari
- phone call: probably Ferrari
- physical walk-in: Naheed

### Physical mark-in
- owner: Naheed

### Triage decision
- phone / enquiry path: Ferrari
- physical walk-in path: Naheed
- tech can influence / escalate when technical reality changes

### Assigning into queue
- Ferrari or Naheed

### Diagnostic note quality
- Saf writes the diagnostic note
- Ricky currently sees himself as the quality owner, at least partly, when judging note quality / adequacy

### Quoting
- owner: Ferrari

### Parts readiness
- readiness owner: Roni
- ordering owner: Ferrari and Roni

### Chasing acceptance / payment
- owner: Ferrari

### Making sure accepted diagnostics actually move to repair
- owner: Ferrari

### Important owner-map truth
This confirms Ferrari is still carrying a large part of the translation-and-progression layer:
- first response on remote channels
- intake capture on remote channels
- triage on remote channels
- quoting
- chasing acceptance/payment
- making accepted diagnostics progress into repair

This is one of the clearest reasons Ferrari currently acts as a bottleneck node in the system.

### Additional operational note
Ricky believes there is likely existing evidence in Intercom and Monday updates that could further confirm Ferrari’s role in quote/acceptance/progression ownership.

---

## Current Failure Modes

## Confirmed stage-by-stage failure modes in this domain

### 1) First response
What goes wrong:
- team has a good conversation but does not take the information properly
- no durable record is created from the conversation

### 2) Intake capture
What goes wrong:
- same core issue as first response: conversation happens, but information is not captured well enough
- intake is not consistently creating a reliable decision-ready record

### 3) Triage decision
What goes wrong:
- team relies on tagging Ferrari on Monday
- Ferrari has to notice the notification and then respond back to customer that the issue is different / needs another route
- triage progression is therefore dependent on Ferrari seeing and acting on the tag

### 4) Physical mark-in
What goes wrong:
- device information may not be on Monday
- team may not be able to find or trust the device information
- team can become unclear on what has actually arrived and why it is there

### 5) Queue assignment
What goes wrong:
- deadlines do not get entered
- Saf may already be overwhelmed
- engineer may be off
- queue assignment therefore fails both as a planning step and as a capacity-aware decision

### 6) Diagnostic write-up
What goes wrong:
- write-up quality is poor, especially language clarity / English quality
- this creates translation risk into quote and next-step decisions
- positive note: Ricky says a better template / copy-paste structure was delivered to Saf yesterday to improve this

### 7) Quote creation
What goes wrong:
- quote creation is not automated
- Ferrari has to manually gather the information, build the template, and send it
- this creates delays in grabbing info, building the response, and pushing it out
- pricing sign-off is also not formalized as a clear control step

### 8) Customer acceptance / payment
What goes wrong:
- customer may not see the email
- there is no follow-up
- there is no text/SMS layer confirming or chasing the decision
- accepted/paid movement can stall because the customer side and internal side are not tightly closed

### 9) Movement from accepted diagnostic into repair
What goes wrong:
- payment may not have come through yet
- client may chase because item has not been physically moved on Monday
- accepted diagnostic does not always cleanly move into the repair queue

### 10) Parts readiness
What goes wrong:
- stock is not checked properly at order intake / inquiry intake
- nothing is really confirming whether the part is physically in stock early enough
- there is no real parts reservation procedure

### Failure pattern summary
The dominant failure modes in this domain are:
- information not captured
- information captured but not structured
- decisions waiting on Ferrari noticing a tag / message
- poor translation from technical note -> customer quote
- no tight follow-up loop after quote/payment
- no true parts-availability check or reservation discipline early enough

This confirms that the intake domain is failing as both:
1. an information-capture system
2. a progression-control system

---

## Target-State / Governing Rules

## Early target-state non-negotiable rules for this domain
Ricky’s first framing is that this domain is fundamentally about **speed**.

### Speed / responsiveness rules
- emails are replied to immediately
- phone calls are returned
- team actively calls people, not only passively waits for replies
- customer progression should not stall silently after first contact

### Trust / reassurance rules
- every client should be reassured that iCorrect is the right company for the job
- intake is not only data capture, it is also confidence-building

### Readiness / control rules
- parts are reserved
- passcodes and access details are confirmed
- if passcode is not available, an NDA or equivalent control should already be in place
- if corporate, the business must know it has all required details for that client/account before proceeding

### Interpretation
Even though Ricky found the question difficult, the first answer already points to the core future-state design principles:
1. speed
2. proactive follow-up
3. customer confidence
4. readiness before handoff
5. proper access/compliance controls
6. account-specific completeness for corporate

This suggests the future-state intake system is not just a form engine. It is a:
- response-speed engine
- confidence engine
- readiness gate
- control gate before workshop work begins

---

## Target-state speed standards (Ricky draft)
These are target responsiveness / movement standards for the future-state intake model.

### Enquiry / response layer
- **Email enquiry -> first reply:** within 1 hour
  - note: AI can be faster, but Ricky does not want a response that feels unnaturally immediate in a way that harms trust
- **Missed phone call -> callback:** ASAP, within 1 hour
- **Website booking -> confirmed / visible to team:** immediately
- **Email confirmation to customer after booking:** immediately
- **Parts stock confirmed visible on Monday:** immediately / at booking confirmation stage
- **Physical walk-in -> someone goes up to see customer:** within a few minutes

### Diagnostic / quote layer
- **Diagnostic job received -> tech starts pre-diagnostic:** same day
- **Diagnostic complete:** 1 working day target, 2 working days maximum
- **Diagnostic completed -> quote sent:** same day, within 1 hour of completion
- **Quote send should be close to instant progression:** Ricky wants this to become near-instant once diagnostic is complete and ready

### Acceptance / payment / repair-start layer
- **Customer accepts -> invoice/payment request sent:** immediately
- **Customer accepts -> part reservation:** immediately at acceptance, pending payment
- **Payment received -> moved into repair queue:** immediately, with part physically moving into queue and deadlines updated

### Delay / exception communication layer
- **Accepted repair waiting on parts -> customer updated:** immediately with clear delay communication
- **Ready repair -> customer notified:** immediately

### Interpretation
The target-state is explicitly biased toward fast operational movement.

The governing principle is:
- once a meaningful state change happens, the next state should happen immediately or inside a tightly bounded short SLA

This implies the future system needs:
- state-triggered actions
- visible ownership
- instant next-step creation
- automated confirmations where trust-safe
- immediate delay communication when promise cannot be met

---

## Stage Model / Decision Model

## Emerging clean state model (separating from Monday thinking)

### Pre-receipt / pre-book-in real-world states
These are the real states Ricky described before the device is physically with the business.

1. **Inquiry received**
- someone has contacted iCorrect by some channel
- not yet necessarily a lead

2. **Inquiry answered**
- the question has been replied to
- customer has received an answer

3. **Lead identified**
- the interaction has become more than a casual question
- customer is a possible real booking / revenue opportunity

4. **Lead being progressed**
- questions have been answered
- business is actively trying to move the person toward a booking

5. **Awaiting booking decision**
- lead exists
- business is waiting for customer to decide whether to book in

6. **Booked in / expected**
- customer has booked in
- business is waiting for customer to ship the device or visit in person
- key future-state need: this should include expected-arrival visibility

7. **Non-fit / declined**
- business knows this is not a fit
- reason should be recorded in some way

### Key pre-receipt intelligence gaps Ricky highlighted
The business needs to know:
- who contacted us by which channel?
- was it just an inquiry or did it become a lead?
- of the leads, how many converted into actual bookings?
- if they did not convert, why not?
  - not the right time
  - too expensive
  - chose trade-in / upgrade instead
  - other reason
- for booked-in customers, when are we expecting them in?

### Early interpretation
This confirms the pre-receipt system needs to distinguish clearly between:
- inquiry
- lead
- booked job
- non-fit / lost lead

That distinction is currently weak.

---

### Post-receipt / post-device-arrival outcome questions
Ricky did not yet define these as pure state labels, but he did define the key operational questions that matter once the device is physically with the business.

Important post-receipt outcome questions:
- did we complete on time?
- was the client aware of any issues?
- did we find any other issues?
- did the client have to pay more money?
- were there any complaints?
- was the client happy?
- did we deliver in time, including return delivery where relevant?
- did we offer a faster turnaround if available?
- was the client aware / communicated with at all times?
- were there points where the client went quiet?
- would this client likely give a positive review if asked neutrally?

### Interpretation of post-receipt layer
This shows that the real post-receipt model is not only operational movement.
It is also:
- expectation management
- exception handling
- communication continuity
- commercial outcome
- satisfaction / review risk

So the future-state model needs both:
1. operational states
2. customer-outcome / quality states

---

## Ricky’s practical definition of a lead
An inquiry becomes a lead when the customer is no longer just browsing and is moving toward booking.

### Core lead indicators
According to Ricky, it becomes a lead when:
- they seem happy
- they want to book
- they have shared the relevant device details
- if asked for serial number, they provide the serial number
- they have asked for the price
- they have asked the questions they need answered
- they are asking about appointments
- they have been told about part availability / relevant constraints

### Stronger / warmer lead signal
A warmer lead exists when:
- the customer has enough information to make a decision
- the business has enough information to support booking
- remaining problem is no longer “understanding the case”, but “converting the booking”

### Important interpretation
Ricky’s practical lead definition is intent-based and information-based.

A lead is not just:
- someone who messaged

A lead is someone who:
- has meaningful booking intent
- has engaged enough to answer key questions
- has enough known detail for the business to help them decide

### Commercial implication
The problem is not only generating inquiries.
It is converting sufficiently informed, sufficiently warm inquiries into actual bookings.

---

## Exceptions, Holds, and Escalations

## Confirmed intake completion and downstream gate model
Last updated: 2026-04-24 01:08 UTC

### Core design shift
Ricky clarified that the intake problem is not mainly about staff forgetting things.

The deeper issue is:
- the current process allows incomplete jobs to pass through intake
- technicians then become the first people to discover missing information
- this creates physical interruption, delay, and chaos

Target-state principle:
- intake should be a guided system, not a memory-based human exercise
- required information should be enforced before submission
- the system should decide whether a job is truly ready to move forward
- customer communication must branch correctly when a job is received but not actually ready for repair flow

### Current-state receipt to intake-complete shape
Operationally, the post-booking path today is:
- inquiry
- booked / expected incoming job
- device physically received
- intake complete enough to proceed

But Ricky identified two major current control gaps:
- physical stock / parts are not properly checked early enough
- queue timing / likely repair timing is not properly assigned at receipt

### Ricky’s practical definition of intake complete
The strongest test is:
- if a technician picks up the device, do they have everything they need to proceed without asking intake any follow-up questions?

If the answer is no, intake is not complete.

### Intake-complete requirements at physical receipt
Before a job should leave intake, these checks or conditions need to be satisfied:
- customer notes are present and clear
- required pre-testing is completed
- power meter / basic power check is completed where relevant
- passcode / access status is confirmed where relevant
- device is physically labelled correctly
- accessory / screw-box / handling labels are present where needed
- the received device matches the expected device and job
- the repair instruction or diagnostic framing is clear enough for technician pickup without clarification

### Current-state blocked reality vs cleaner future-state model
Ricky clarified that the business does have blocked Monday statuses, such as:
- repair paused
- contact customer
- awaiting confirmation
- passcode request

But these are largely downstream damage states.

Cleaner future-state rule:
- missing technician-critical information should create an intake hold before workshop touch
- technician should not be the first error detector
- hold reason should be explicit and visible

Likely intake-hold reasons:
- missing repair notes
- missing or incorrect passcode / testing access
- parts not checked
- parts not available
- intake checks not completed
- customer clarification required

### Ownership of intake gaps (current reality)
Current likely owner map discussed with Ricky:
- missing repair notes:
  - walk-in: Naheed
  - mail-in / courier: Ferrari
- missing or incorrect passcode:
  - walk-in: Naheed
  - mail-in / courier: Ferrari
- unclear repair scope:
  - primarily Ferrari, with Naheed input at intake edge
- parts check:
  - currently ownerless in practice
  - should likely be owned by Ronnie or a defined stock/intake role

Important operations rule:
- ownerless checks are not real checks

### Intake form design principle
Ricky clarified that a single flat checklist is the wrong model.

The intake system should contain:
- a shared intake core for every device
- conditional question sets based on:
  - device type
  - repair type
  - fault type
  - service path (walk-in, mail-in, courier, corporate)
- wider CRM/context capture as a separate layer

Useful four-layer structure:
1. core identity
2. repair-operational data
3. control / risk data
4. CRM / relationship context

Important distinction:
- not all CRM/context data should block intake
- intake gate should be driven by readiness-critical information, not every potentially useful note

### Hard-required minimum to submit into active repair / diagnostic flow
Ricky clarified the hard-required minimum as:
- default repair description exists
- received device matches the expected / booked device
- passcode or access is available if testing is required
- payment state is correct for the service type
  - example: diagnostic payment taken where required

Additional hard rule:
- if testing is required and no valid access is available, the job must not enter active repair flow

### Parts check rule for simple / known repairs
Ricky confirmed parts readiness is a hard intake control for simple repairs.

Rules:
- part availability must be known before accepting the job into active repair flow
- if part is not in stock, expected arrival date must be known
- intake must determine whether repair can still meet the customer deadline / expectation
- if not, customer expectation must be reset before or at handoff
- in some cases, the correct outcome is not to accept the device yet and instead rebook

Simple-repair decision tree:
- part in stock -> proceed
- part not in stock, ETA known, still inside customer expectation -> proceed with clear timing
- part not in stock, ETA misses expectation -> customer must be informed and a delay / rebook / consent decision made
- part status unknown -> intake cannot be complete

Important commercial rule from Ricky:
- if a customer is booked to come in, the business should ideally already know whether the part is available and should warn or rebook the customer before they arrive if needed

### Diagnostic-route gate difference
Ricky drew a clear distinction for diagnostic work.

For diagnostics:
- parts check is not an intake gate
- the exact part may not be known until the diagnostic is completed
- parts reservation / check happens after diagnostic completion, at quote acceptance

Diagnostic intake-complete hard requirements are therefore:
- default problem description captured
- device received matches expected device
- passcode / access available if needed for testing
- diagnostic payment taken where required
- enough fault/context information captured for a technician to begin diagnosis without chasing intake

### Post-diagnostic gate: quote accepted -> repair queue ready
Ricky confirmed that an accepted diagnostic should only move into repair queue when:
- parts are available or reserved
- a technician repair slot is available
- payment is confirmed
- customer deadline / expectation is confirmed

This creates a second major readiness gate after diagnosis.

### Clean state model now visible in this domain
High-level operational flow now visible:
- inquiry
- booked incoming job
- device received
- intake complete
- diagnostic in progress (if needed)
- quote issued
- quote accepted
- repair queue ready
- repair in progress

Key rule split:
- simple / known repair:
  - parts check happens at intake
- diagnostic repair:
  - parts check happens at quote acceptance

### Intake signoff ownership
Current state:
- Naheed is the practical human owner signing intake off in his intake / outbound operations role

Future clean-state model:
- AI validation / signoff should own readiness to move jobs into queue
- humans provide and confirm source information
- system enforcement should decide whether a job is complete enough to progress

### Implications for KB, SOPs, and system build
This intake pass now implies three immediate output categories.

#### 1. KB additions needed
Canonical knowledge should eventually include:
- intake gate definition
- simple repair vs diagnostic gate split
- parts-check timing rules
- intake-hold concept and hold reasons
- intake signoff ownership model
- customer communication branching for received-and-ready vs received-but-on-hold

#### 2. SOPs that need to exist
This pass implies SOPs for:
- physical device receipt and mark-in
- intake completeness check
- simple-repair parts check and expectation-setting
- diagnostic intake completeness check
- intake hold handling and customer communication
- accepted diagnostic -> repair queue readiness check
- device labelling standard by device type / container type

#### 3. System design requirements now visible
The future intake system needs to support:
- guided intake, not memory-based intake
- conditional question logic by device / repair / fault / service path
- submission blocking when required fields are missing
- different gate logic for simple repairs vs diagnostics
- explicit intake holds before workshop touch
- customer notification branching for off-path / blocked jobs
- parts-availability awareness early enough to shape booking and expectation decisions
- AI readiness validation before queue movement

## Open Questions
- exact role boundary between Naheed and Ferrari on unclear repair scope still needs tighter definition
- parts-check ownership needs formal confirmation rather than inferred likely ownership
- exact customer communication logic for received-but-on-hold devices still needs to be defined as a formal rule set
- exact post-receipt state boundaries beyond intake complete and quote acceptance still need further refinement downstream in workshop/QC domains

## System Implications
- future intake system must support guided capture rather than memory-based capture
- future system must block submission when readiness-critical information is missing
- different gate logic is required for simple repairs versus diagnostics
- explicit intake holds should exist before workshop touch
- customer communication should branch for ready versus on-hold receipts
- AI validation/signoff is a target-state progression control, not just an assistant feature

## Future SOP / KB Outputs
This domain should ultimately split into:
1. enquiry capture
2. intake creation
3. triage / diagnosis readiness
4. quote request readiness
5. handoff into workshop / quote builder / client follow-up
6. diagnostic intake question tree
7. normal repair intake question tree
8. commercial-fit / decline rules
9. explicit triage decision tree
10. normal-repair handoff SOP
11. diagnostic-to-quote handoff SOP
12. parts-readiness / reservation rules
13. turnaround expectation rules
14. stage-by-stage owner map
15. escalation / exception ownership rules
16. stage-by-stage failure-mode map
17. future-state non-negotiable rules
18. target-state speed standards
19. clean pre-receipt state model
20. post-receipt customer outcome model
21. lead-definition and conversion logic
