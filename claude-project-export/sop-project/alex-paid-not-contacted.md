# Paid-Not-Contacted Detection

Customers who have paid but received no follow-up are a critical failure. They churn silently. This document defines the pattern, how to detect it, and what to do.

---

## The Pattern

**Payment received + no outbound Intercom message + no Monday status progression = urgent.**

A customer has completed a Shopify transaction (deposit or full payment) but the team has not made contact. Every day this continues increases the chance the customer disputes the charge or simply never comes back.

---

## Known Case Study: du Plooy (#1080)

As of 2026-02-27:
- Customer paid **£349 via Shopify** on approximately February 27
- **10 days passed with zero contact** from iCorrect
- No Ferrari outreach, no Intercom message, no status update in Monday
- Status: escalated to Ferrari (Ricky's note: "Ferrari to call today — this has gone on too long")

**Lesson:** A paying customer should never go more than 24 hours without a booking confirmation and no more than 48 hours without a status update if the repair is in progress.

---

## Detection Signals

Look for the combination of ALL of the following:

| Signal | Where to check |
|---|---|
| Payment recorded | Shopify orders — `financial_status = paid` |
| No outbound Intercom message | Intercom conversation — last message from admin = none, or last message is >48h ago |
| No Monday record / stale status | Monday main board — no item, or item with no updates in >48h |
| No collection/booking confirmed | Monday `status4` still default or no `date4` filled |

A single signal alone is not enough. The combination of payment + silence is the red flag.

---

## How to Check

### Step 1: Check Shopify for recent paid orders

```
GET https://i-correct-final.myshopify.com/admin/api/2024-01/orders.json?financial_status=paid&status=open&limit=50
Authorization: $SHOPIFY_ACCESS_TOKEN
```

Extract: customer email, order date, order total, line items.

### Step 2: For each paid order, search Monday by customer email

```graphql
query {
  items_by_column_values(board_id: 349212843, column_id: "text5", column_value: "{email}") {
    id name
    column_values { id value }
  }
}
```

Check: is there a Monday item? When was it last updated? What is `status4`?

### Step 3: Check Intercom for outbound messages

Search contacts by email: `POST https://api.intercom.io/contacts/search`

For any matching conversation: check if admin has sent a message in the last 24-48 hours.

### Step 4: Cross-reference

| Paid in Shopify | In Monday | Intercom outbound | Action |
|---|---|---|---|
| Yes | No | No | 🚨 Flag to Ferrari immediately |
| Yes | Yes (stale) | No | 🚨 Flag to Ferrari — customer not updated |
| Yes | Yes (active) | Yes (recent) | Normal — no action |
| Yes | Yes | Yes (>48h old) | 🟡 Check status — may need follow-up |

---

## What to Do

### Immediate action (gap > 24h since payment):

1. Draft an internal note in Intercom: "Paid [date]. No contact made. Flagging to Ferrari urgently."
2. Ping Ferrari on Telegram: "URGENT: Customer [name] ([email]) paid £[amount] on [date] — no contact made. [Intercom link]."
3. Add update to Monday item (create one if missing): "Flagged to Ferrari re: no post-payment contact."
4. Do NOT message the customer yourself until Ferrari has reviewed.

### If gap > 48h:

Escalate to Ricky as well as Ferrari. A £349 paid customer who has had zero contact for 48h is a churn risk and potential dispute risk.

---

## Prevention

This pattern happens when:
- Shopify deposit flow completes but no Intercom notification is triggered
- Ferrari misses a booking confirmation step
- There is no automated "payment received" → "send booking confirmation" workflow

**Long-term fix:** A webhook from Shopify → Intercom/Monday that fires on every successful payment, creating a follow-up task. Not built yet (pending systems agent).

**Short-term:** Alex checks Shopify paid orders during daily sweep and cross-references against Monday/Intercom.

---

*Source: customer-service/workspace/MEMORY.md (du Plooy case), finn-lessons.md (follow-up gap analysis), triage-mapping-summary.md (74.9% of lost sales had zero follow-up)*
*Last updated: 2026-03-10*
