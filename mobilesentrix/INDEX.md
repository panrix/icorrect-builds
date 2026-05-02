# mobilesentrix

**State:** active
**Owner:** parts
**Purpose:** Read-only discovery pack for automating Mobilesentrix UK ordering against a private Magento 1.x stack. Captures the full add-to-cart-through-place-order flow + auth/CSRF model, no mutations performed.
**Last updated:** 2026-05-02 08:30 UTC

## Current state

### In flight
- Discovery complete; no automation built yet. Pending follow-ups in idea-inventory: capture exact payment-body shape per supported method (`acca009e`, P2); capture live payment-method codes returned by `loadpayment` for a non-empty quote (`8f93402f`, P2); codify order-placement workflow as a reusable domain skill (`716e0142`, P3).

### Recently shipped
- 2026-04-28 — Initial discovery (`docs/order-placement-discovery.md` + `docs/api-inventory.json`).

### Next up
- Re-run discovery with a non-empty quote to capture payment shapes.
- Decide whether to codify the flow as a skill before/after Apple-SSR cross-join.

## Structure

- `briefs/` — empty.
- `decisions/` — empty.
- `docs/` — API inventory + order-placement discovery doc.
- `archive/` — empty.
- `scratch/` — empty.

## Key documents

- [`docs/order-placement-discovery.md`](docs/order-placement-discovery.md) — end-to-end flow: cart → checkout → payment → place-order, with auth/CSRF model.
- [`docs/api-inventory.json`](docs/api-inventory.json) — enumerated endpoints captured during discovery.

## Open questions

- Capture the exact payment body shape for each supported payment method (idea `acca009e`, P2).
- Capture the live payment method codes returned by `loadpayment` for a non-empty quote (idea `8f93402f`, P2).
- Codify the order-placement workflow as a reusable domain skill (idea `716e0142`, P3).
