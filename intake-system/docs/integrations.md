# Intake Integrations

## Monday.com

- Boards:
  - Main repairs board `349212843`
  - Parts/stock board `985177480`
  - Product/repair mapping board `2477699024`
- Responsibilities:
  - Create/update intake items.
  - Store intake status and handoff context.
  - Reflect parts reservation/availability.

## Intercom

- Purpose:
  - Pull prior conversation context by customer identity.
  - Reduce customer repetition and improve handoff quality.
- Data:
  - Last interactions, promises made, contact context.

## Supabase

- Purpose:
  - Operational source of truth for intake sessions and responses.
  - Storage for intake media artifacts.
- Data sets:
  - Intake sessions, responses, checks, photos.
  - Turnaround-time and corporate profile support tables.

## iCloud Check API

- Triggered for BM trade-in intake after serial capture.
- Must return pass/fail or explicit escalation state.

## Xero (read-only in intake context)

- Used for pricing context where required by flow.
- No direct invoice mutation required during initial intake flow.

## Notification Layer

- Customer notifications:
  - device received
  - key state transitions (later phases)
- Team notifications:
  - customer ready for handoff
  - unresolved escalation in intake path

## Media / Recording

- Intake photos are required and stored in Supabase Storage.
- Conversation recording remains deferred outside MVP; if enabled later, consent and storage policy are mandatory.
