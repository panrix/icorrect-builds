# Reply Templates — Alex (CS)

Pre-written templates for the 5 most common Intercom scenarios. Fill placeholders in `[brackets]`, review, and send. Every reply requires Ferrari approval before sending.

**Golden rules before sending:**
- No em dashes in any customer-facing text
- Never assume gender — use "they/their" if unsure
- Never include the address in the reply body (it's in the footer)
- Sign off as iCorrect (footer handles company name)
- Every sent reply must have a matching Monday update

---

## 1. New Repair Enquiry

**When:** Customer asks about a repair, price, or booking for the first time.

**Before drafting:** Check Monday main board (349212843) by email (`text5`) — customer may already exist.

**Pricing note:** Pricing KB (07-pricing.md) is currently BLOCKED. If no price is available, use the "pricing TBC" variant below.

---

**Template A — With pricing confirmed:**

> Hi [Customer Name],
>
> Thanks for getting in touch.
>
> [Device] — [Repair]: £[Price] inc VAT.
> Turnaround: [Turnaround, e.g. 2-3 working days]. Genuine parts, 2-year warranty.
>
> You can book directly here: [Booking URL]
>
> Or if you'd prefer, just let me know a convenient time and we can arrange everything for you.
>
> Kind regards

---

**Template B — Pricing not available (flag to Ferrari):**

> Hi [Customer Name],
>
> Thanks for getting in touch. To give you a specific quote for [Device] [Repair], I just need to confirm a couple of details — can I take the model number (found on the back of the device) and a brief description of the fault?
>
> I'll come back to you shortly with the exact price and availability.
>
> Kind regards

**Monday action:** Create new item if not already on board. Fill: Email (text5), Device (board_relation5), Requested Repairs (board_relation), Service, Status (leave default unless booking confirmed), Intercom ID (text_mm087h9p), Intercom Link (link1). Add note with: customer details, device, repair, price quoted (if applicable).

---

## 2. Collection Confirmation

**When:** Customer wants to collect their repaired device.

**Before drafting:** Search Monday by email. Confirm `status4` = "Ready To Collect". Check `payment_status` for any outstanding balance.

---

**Template — No outstanding payment:**

> Hi [Customer Name],
>
> Great news — your [Device] is ready to collect.
>
> Our opening hours are:
> Monday to Thursday: 9:30am to 5:30pm
> Friday: 10am to 5:30pm
>
> Just pop in whenever is convenient for you. No need to call ahead.
>
> Kind regards

---

**Template — Outstanding payment:**

> Hi [Customer Name],
>
> Your [Device] is ready to collect. Please note there is an outstanding balance of £[Amount] to pay on collection.
>
> Opening hours:
> Monday to Thursday: 9:30am to 5:30pm
> Friday: 10am to 5:30pm
>
> Kind regards

**Monday action:** Add update note confirming customer was contacted regarding collection.

---

## 3. Turnaround Chase

**When:** Customer asks for a status update on their repair.

**Before drafting:** Search Monday by email. Read `status4` and any internal notes on the item.

---

**Template — Repair in progress, on track:**

> Hi [Customer Name],
>
> Thanks for checking in. Your [Device] is currently [Status, e.g. with our technician / in progress] and is on track to be ready by [Date/Timeframe].
>
> We'll be in touch as soon as it is ready. If anything changes we will let you know straight away.
>
> Kind regards

---

**Template — Ready to collect:**

> Hi [Customer Name],
>
> Good news — your [Device] is ready to collect. [See collection template above for hours.]
>
> Kind regards

---

**Template — Status unclear / cannot confirm from Monday:**

> Hi [Customer Name],
>
> Thanks for your message. Let me check on the status of your [Device] repair and come back to you shortly.
>
> Kind regards

*(Flag to Ferrari if status cannot be determined from Monday.)*

**Monday action:** Add update note confirming customer was updated on status.

---

## 4. Warranty Acknowledgement

**When:** Customer reports a fault with a device iCorrect has previously repaired.

**Before drafting:** Search Monday by email. Find original repair item. Note repair completion date. iCorrect warranty = 2 years from completion.

**Do not:** Confirm or deny warranty eligibility before Ferrari reviews. Do not mention what the photo will be used to assess.

---

**Template:**

> Hi [Customer Name],
>
> Thank you for letting us know. All iCorrect repairs come with a 2-year warranty, so if the fault is related to the original repair, we will take care of it.
>
> To help us assess the issue, could you send over a photo or short video of the fault you are experiencing?
>
> Once we have that we will get back to you straight away with next steps.
>
> Kind regards

**Monday action:** Add update note to original repair item with: date of claim, fault reported, action taken (asked for photo). Tag conversation `needs-ferrari` and add internal Intercom note with full context before assigning.

---

## 5. Device Decline (Too Old / Out of Scope)

**When:** Customer enquires about a device that is too old or outside iCorrect's repair scope.

**Triggers (from KB-06):**
- iPhone 7, iPhone X Wi-Fi, or older models
- MacBooks made before approximately 2016
- Non-Apple devices / Windows laptops

---

**Template:**

> Hi [Customer Name],
>
> Thanks for reaching out. Unfortunately, [Device Model] is an older model and we do not typically carry out repairs on it — the cost of parts and repair would likely exceed the current value of the device.
>
> In most cases we would recommend upgrading to a newer model rather than investing in a repair.
>
> If you have a newer device you need help with, or any other questions, we are happy to help.
>
> Kind regards

**Monday action:** No item needed. No escalation needed — agent handles autonomously.

---

*Source: customer-service/workspace/docs/SOPs/intercom-handling.md, alex-cs/workspace/docs/knowledge-base/*
*Last updated: 2026-03-10*
