# Typeform

## Access

- `Observed`: Typeform access depends on which env file is used.
- `config/.env` token result:
  - `GET /forms?page_size=1` -> HTTP `403`
  - body: `AUTHENTICATION_FAILED`
- `config/api-keys/.env` token result:
  - `GET /forms?page_size=100` -> HTTP `200`
  - total forms returned: `37`

Evidence exports:
- `/home/ricky/data/exports/system-audit-2026-03-31/typeform/forms.body.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/typeform/forms-api-keys.body.json`
- `/home/ricky/data/exports/system-audit-2026-03-31/typeform/forms-api-keys-full.json`

## Observed Inventory

- Total forms: `37`

Representative forms:
- `iCorrect Walk-In (v2)`
- `Phone Enquiry`
- `Back Market Trade-In Form`
- `iCorrect's Corporate Onboarding Form`
- `Enquiry Form`
- `Drop-Off Form (booked appointment)`
- `Collection Form`
- `Drop off, collection or enquiry?`
- `Onboarding - Diagnostics`
- `Pre-Repair Questions`
- `Bookings Form for Clients without an Appointment (copy)`

## Cross-System Role

- `Observed`: Typeform is a live intake surface, not just a historical form tool.
- Active and documented downstream uses include:
  - walk-in intake
  - phone enquiry / collection / drop-off routing
  - pre-repair questions
  - BM trade-in related intake
  - corporate onboarding
- `Observed`: active n8n workflows already mapped in the audit depend on Typeform forms, including:
  - `Walk-In Typeform → Intercom + Monday`
  - `Typeform To Monday Pre-Repair Form Responses (v2)`
  - collection/drop-off related Slack-notification flows

Verified native trigger mappings:
- `LtNyVqVN` `Bookings Form for Clients without an Appointment` -> active workflow `Walk-In Typeform → Intercom + Monday`
- `sDieaFMs` `Pre-Repair Questions` -> active workflow `Typeform To Monday Pre-Repair Form Responses (v2)`

Observed webhook-style Typeform consumers without a verified form ID yet:
- `Drop-Off Appointment → Enriched Slack Notification`
- `Collection Form → Enriched Slack Notification`

## Observed Risks

- The token in the canonical `config/.env` currently fails authentication while the token in `config/api-keys/.env` works.
- This means Typeform can look blocked or alive depending on which env file a service or agent uses.

## Open Threads

- map the live Typeform form IDs to all active n8n workflow triggers one by one
- determine whether any current forms are dormant or duplicated
