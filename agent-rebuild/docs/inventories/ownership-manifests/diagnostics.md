# Diagnostics — Ownership Manifest

Generated: 2026-05-01
Source: folder-inventory.md (Phase 6.9b)

## Summary
- Folders owned: 1
- Active: 1  Dormant: 0  Dead: 0
- High-confidence: 1  Medium: 0  Low: 0

## Folders

| folder | state | canonical_status | size | rationale (1-line) |
| --- | --- | --- | --- | --- |
| elek-board-viewer | active | canonical | 4.5G | Logic-board board-view extraction and rewrite work is specific to diagnostics and clearly owned there. |

## Notes
- The folder is 4.5G and heavily data-dominated; the scan already had to sample rather than inspect exhaustively.
- Several lost scripts were only inferable from surviving outputs, so this canonical assignment is high-confidence but the internal state still deserves caution.
