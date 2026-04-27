# BM payout-experience API — capabilities for iCorrect

13 endpoints, base path `/api/payout-experience/v1/`. This is **mostly setup-time territory** — KYB (Know Your Business) verification, business documents, payout routing. You did this once when iCorrect onboarded; it rarely needs touching after.

It would matter again if you:
- Open a new BM market (e.g. iCorrect US, iCorrect AU)
- Restructure the company (Panrix Limited → new entity)
- Add or remove stakeholders / signatories on the BM account
- Need to refresh expired KYB documents (BM occasionally requires re-verification)
- Switch the bank account that BM pays into

## 1. Read state

### 🟡 Get current KYB state
**`GET /v1/kyb`**

Returns your current verification status — what documents are on file, what's missing, what's expired.

**iCorrect use cases:**
- Periodic check (monthly cron) — alert if BM has flagged anything as needing re-verification before they freeze payouts.
- Audit which documents BM holds copies of, for your own compliance records.

### 🔴 Metadata
**`GET /v1/metadata`** — supported countries, document types, etc. Schema-discovery only.

### 🔴 Health-check
**`GET /v1/hello`** — returns "Hello World"-style. Useful for monitoring this service is up.

## 2. Business details

### 🟡 Submit / update business details
**`POST /v1/kyb/business-details`** — initial submission
**`PUT /v1/kyb/business-details`** — update existing

Body covers company name, registration details, addresses. The PUT description notes: *"File uploads (W9, articles of incorporation) need to be done separately."*

**iCorrect use cases:**
- One-time fill at onboarding.
- Update if Panrix Limited's registered address changes.
- If BM ships a new required field (e.g. Companies House number), bulk-update without re-doing the whole UI flow.

## 3. Document uploads

All multipart/form-data. Mostly one-time per market.

### 🔴 Articles of Incorporation
**`POST /v1/kyb/article-of-incorporation`** — upload AoI document. Required for KYB.

### 🔴 W9 (US sellers only)
**`POST /v1/kyb/w9`** — upload W9 tax form. **Only relevant if you sell on `backmarket.com` (US market).** iCorrect doesn't currently.

### 🔴 Proof of Second-Hand Dealer Licence (Japan only)
**`POST /v1/kyb/proof-of-second-hand-dealer-licence`** — Japanese sellers only. Not relevant to iCorrect.

### 🔴 Letter of Authorization
**`POST /v1/kyb/letter-of-authorization/{stakeholder_id}`** — required when the account requester isn't a legal company representative (e.g. an admin acting on behalf of the director).

## 4. Stakeholders

Stakeholders = people associated with the BM account who BM needs to verify (typically directors, beneficial owners >25%).

### 🟡 Create / update / verify
**`POST /v1/kyb/stakeholders`** — add a stakeholder
**`PUT /v1/kyb/stakeholders/{stakeholder_id}`** — update one
**`POST /v1/kyb/stakeholders/{stakeholder_id}/proof-of-identity`** — upload their ID document

**iCorrect use cases:**
- Add a new director to BM's records when one joins / leaves Panrix.
- Refresh ID documents when they expire.
- This is the second-most-likely thing in payout-experience to touch after the initial setup.

## 5. Submit

### 🔴 Submit KYB
**`POST /v1/kyb/submit`** — submit the whole bundle for review.

Last step after all documents and stakeholders are uploaded. BM then reviews and approves (or rejects with reasons).

## What this means for iCorrect

Realistically: **you probably never call any of these through automation.** This is "the BM compliance team sends you an email saying 'please update X'" → "you respond once" workflow. The API exists for the rare scaling event.

The one thing worth automating: the **`GET /v1/kyb`** monthly check. If BM ever silently flags a document as expiring, knowing about it before they freeze payouts is worth the 5 minutes to wire up.

```
Cron (monthly, 1st of month, 9am):
  GET /api/payout-experience/v1/kyb
  → Parse for any "EXPIRING" or "MISSING" or "REJECTED" statuses
  → If any: post to Telegram (Operations group), tag Ricky
  → Else: silent
```

That's the whole automation surface here in a single rule. Everything else is "do once, never again unless something changes."

## What's NOT here

- No bank-account / payout-routing endpoints. That's almost certainly handled inside the BM UI behind extra auth (2FA / signed link), not via this API. Reasonable security posture from BM.
- No payout-history / reconciliation endpoints. Those live in `seller-experience` under `/finance/report` (covered in the seller-experience doc).
