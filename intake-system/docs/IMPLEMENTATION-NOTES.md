# Implementation Notes

These notes capture operational corrections and doc mismatches that affect the build, without editing locked spec files.

## Appointment Lookup Correction

- Source: user clarification on 2026-04-08 during implementation.
- Correction: when a client has a booking and arrives in-store, backend lookup should search both:
  - `new_group34198` (`Incoming Future`)
  - `new_group70029` (`Today's Repairs`)
- Reason: a booked client may already have been moved into Today's Repairs, so lookup against Incoming Future alone is incomplete.
- Implementation rule: treat both groups as the default search scope for booked-client lookup unless a narrower filter is intentionally passed.

## Pre-Phase-2 Checkpoint

### Monday Phone Column

- Verified live against Monday board `349212843` on 2026-04-08.
- Column ID: `text00`
- Title: `Phone Number`
- Implementation rule: phone write-back should target `text00`.

### Intercom Quote Email

- Local environment check on 2026-04-08 found `INTERCOM_ACCESS_TOKEN` missing from `/home/ricky/config/api-keys/.env`.
- Result: quote-email capability is not currently verifiable from this machine.
- Implementation rule: until a valid Intercom token and safe test recipient are available, keep capturing `wantsQuoteEmailed` and `declineReason`, but degrade gracefully by not attempting outbound quote email in live code.

### Deferred `SPEC.md` Section 4 Questions

- The following remain explicitly deferred from v1 and should not block current implementation:
  - `New or refurbished?`
  - Structured fault-cause capture beyond free text
  - Secondary-fault authorization
  - Battery upsell authorization
