# Parts — Ownership Manifest

Generated: 2026-05-01
Source: folder-inventory.md (Phase 6.9b)

## Summary
- Folders owned: 4
- Active: 3  Dormant: 1  Dead: 0
- High-confidence: 4  Medium: 0  Low: 0

## Folders

| folder | state | canonical_status | size | rationale (1-line) |
| --- | --- | --- | --- | --- |
| apple-ssr | active | draft | 20M | Apple Self Service Repair discovery and catalog automation work is directly about parts sourcing. |
| icorrect-parts-service | active | canonical | 27M | Live Monday-triggered stock deduction and shortage service is the canonical parts runtime. |
| inventory-system | dormant | draft | 8.0K | Reservation-first inventory operating model spec is a pure parts and stock-management artifact. |
| mobilesentrix | active | draft | 24K | Mobilesentrix ordering discovery is clearly a supplier and procurement workflow for parts. |

## Notes
- `icorrect-parts-service` surfaced plaintext credential material in local docs/env files and should be treated as sensitive.
- `apple-ssr` and `mobilesentrix` are still discovery/build artifacts, so the ownership is clear but the implementation state is not mature.
- `data` is the main neighboring folder with a plausible secondary parts claim because its pricing and cost analysis can feed reorder decisions.
