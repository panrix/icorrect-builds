# Backmarket — Ownership Manifest

Generated: 2026-05-01
Source: folder-inventory.md (Phase 6.9b)

## Summary
- Folders owned: 7
- Active: 5  Dormant: 2  Dead: 0
- High-confidence: 5  Medium: 1  Low: 1

## Folders

| folder | state | canonical_status | size | rationale (1-line) |
| --- | --- | --- | --- | --- |
| backmarket | active | canonical | 47M | This is the primary Back Market operations workspace and clearly the domain's canonical home. |
| backmarket-browser | active | draft | 1.3G | Seller-portal browser runtime is specific to Back Market workflows that the API path cannot cover safely. |
| backmarket-seller-support | active | snapshot-of-other | 4.5M | Read-only extraction of the Seller Support Center is domain-specific reference material for Back Market work. |
| bm-scripts | dormant | snapshot-of-other | 24K | Remaining reconciliation artifact is BM-scoped by content, even though the workspace itself is barely intact. |
| buyback-monitor | active | canonical | 61M | Live buyback monitoring and price-management pipeline is a core Back Market operating system. |
| data | dormant | scratch | 332K | The filenames and reports point to Back Market pricing and buy-box analysis more than a general data layer. |
| icloud-checker | active | canonical | 676K | Live trade-in intake and adjacent BM webhook automations are dominated by Back Market workflows. |

## Notes
- Low and medium confidence assignments to re-check: `bm-scripts` and `data`.
- `backmarket-browser` contains session-bearing Chromium/CDP profile data, so it should be treated as sensitive runtime state rather than ordinary docs.
- `backmarket`, `buyback-monitor`, and `icloud-checker` all contain live operational data or credentials context; `icloud-checker` also surfaced plaintext credential or basic-auth material in local docs/env files.
- `royal-mail-automation` and `pricing-sync` are the strongest neighboring folders that might later be split toward this agent.
