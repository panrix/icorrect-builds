# Intake Notification Enrichment - Build Spec

## Goal
Enrich Slack notifications from customer intake forms so Andres has all context without checking Monday.

## Forms & Workflows

### 1. Walk-In (ENRICH EXISTING)
- **Typeform:** `Rr3rhcXc` (iCorrect Walk-In v2)
- **n8n workflow:** `kDfU2wWWv207T24J` (Walk-In Typeform → Intercom + Monday)
- **Slack channel:** `walk-in-form-responses` (`C05KVLV2R6Z`)
- **Current notification:** Name, email, phone, device, issue, reviewed prices, Monday/Intercom links
- **Add:**
  - Repeat customer detection (search Monday by email for past repairs, show summary)
  - Recent conversation summary (check Intercom for recent email threads, check phone-enquiries Slack channel)
  - Difficult/escalated flag (scan Monday updates for complaint/escalation keywords)

### 2. Drop-Off with Appointment (NEW WORKFLOW)
- **Typeform:** `nNUHw0cK` (Drop-Off Form - booked appointment)
- **Current fields:** Name only
- **Hidden fields to add:** `monday_id`, `email`
- **Slack channel:** `appointment-form-responses`
- **Notification should include:**
  - Client name + device + repair type (from Monday item)
  - Paid status: check `dup__of_quote_total` column. Empty = unpaid, has value = prepaid
  - Warranty detection: check Monday item for warranty indicators
  - Shopify order context: if linked to Shopify order, pull order details
  - Email chain summary: if no Monday updates, grab Intercom conversation summary
  - Monday updates summary (ignore parts check updates)
  - Repeat customer detection
  - Difficult/escalated flag
  - Monday + Intercom links

### 3. Collection (NEW WORKFLOW)
- **Typeform:** `vslvbFQr` (Collection Form)
- **Current fields:** Name, device type (multiple choice)
- **Hidden fields to add:** `monday_id`, `email`
- **Slack channel:** `collection-form-responses`
- **Notification should include:**
  - Client name + device + repair summary (from Monday item)
  - Payment status: check Monday item title for outstanding balance pattern (e.g. "*Paying £299 on collection")
  - Repair difficulties flag (scan Monday updates)
  - Customer chasing/upset flag (scan Monday updates for chase/complaint keywords)
  - Accessories left behind (scan Monday updates for case/charger/accessory mentions)
  - Repeat customer history
  - Difficult/escalated flag
  - Monday + Intercom links

### 4. Status Notifications Workflow (MODIFY)
- **n8n workflow:** `TDBSUDxpcW8e56y4` (Status Notifications → Intercom Email)
- **Modify:** "Ready Walk-In" and "Ready Warranty" templates
- **Add:** Pre-filled Typeform collection link with Monday item ID
  - URL format: `https://icorrect.typeform.com/to/vslvbFQr#monday_id={itemId}&email={email}`
- **Also modify:** Booking confirmation templates to include drop-off link
  - URL format: `https://icorrect.typeform.com/to/nNUHw0cK#monday_id={itemId}&email={email}`

## Monday Item Lookup Strategy
- **Primary:** Hidden field `monday_id` (passed via pre-filled Typeform URL)
- **Fallback:** Search by `email` hidden field
- **Last resort:** Search by name (from form field)
- **Multi-match handling:** Filter to active items only. If still multiple, list all in Slack for Andres to identify. Use device type from form to narrow.

## Enrichment Data Sources
- **Monday.com:** Item columns, updates (notes), status, groups
- **Intercom:** Conversation history, ticket status
- **Slack:** `phone-enquiries` channel for recent call notes

## Monday Board
- Need to confirm: which board ID(s) are used for repairs?

## n8n API Details
- Base URL: `https://icorrect.app.n8n.cloud/api/v1`
- Auth: `X-N8N-API-KEY` header with `N8N_CLOUD_API_TOKEN`

## Typeform API Details
- Base URL: `https://api.typeform.com`
- Auth: `Bearer TYPEFORM_API_TOKEN`

## Build Order
1. Add hidden fields (`monday_id`, `email`) to collection + drop-off Typeform forms
2. Modify Status Notifications workflow to embed pre-filled Typeform links
3. Build collection n8n workflow (new)
4. Build drop-off appointment n8n workflow (new)
5. Enrich existing walk-in workflow
