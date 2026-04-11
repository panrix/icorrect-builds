# KB-03: Repair Status Lookups

**Last updated:** 2026-03-04
**Status:** Ready for agent use
**Priority:** HIGH (appears in 28 conversations — fully automatable Day 1)

---

## Overview

When a customer asks "where is my device?" or "what's the status of my repair?" — look up Monday.com by their email address.

---

## How to Look Up a Repair

**Board:** iCorrect Main Board — ID `349212843`
**Search column:** `text5` (Email) — always search by email, not by name
**Status column:** `status4`

Common status values and what they mean to the customer:

| Monday.com Status | What to tell the customer |
|---|---|
| In Progress | Your device is currently being worked on. We'll update you as soon as it's ready. |
| Quote Pending | We've completed the diagnostic and a quote is waiting for your approval. Check your inbox — or let me know if you'd like it resent. |
| Ready To Collect | Great news — your repair is complete and your device is ready to collect. |
| Complete | Your repair is complete. [If they haven't collected — check if this is a postal job and whether it's been dispatched.] |
| Quote Rejected | The customer previously declined the quote. Flag to human — do not re-open without instruction. |
| Waiting on Parts | We're waiting on a part for your repair. We'll be in touch as soon as it arrives. |

---

## If No Record Found

If no Monday.com record is found for the customer's email:
1. Check if they may have booked under a different email — ask politely
2. If still nothing — flag to human. Do not speculate on repair status.

---

## Agent Script

**Customer asks: "Can you give me an update on my repair?"**

> "Of course — let me pull that up for you. Can I confirm the email address you used when you booked?"

→ Search `text5` on board `349212843`
→ Read `status4` and respond with the appropriate message from the table above.

---

## Notes

- Never guess or estimate status — always look it up live
- If the Monday.com record shows conflicting info, flag to human rather than relay confusion to the customer
- For postal repairs: also check whether tracking info is available if status is Complete
