# Active Lane Freeze - 2026-05-05

## Purpose

Protect live build work from the VPS cleanup. Back Market, Intake, and Inventory are active product lanes and must not be moved, archived, or conflict-resolved by cleanup agents until their owning agents have landed their GitHub work.

## Frozen Active Lanes

| Lane | Source of truth | Active branch/session | Protected paths |
|---|---|---|---|
| Back Market | `panrix/icorrect-builds` | active BM branch/session | `builds/backmarket`, `builds/backmarket-browser`, `builds/buyback-monitor`, `builds/icloud-checker`, `builds/backmarket-seller-support` |
| Intake | `panrix/icorrect-builds` | active Intake branch/session | `builds/intake-system`, `builds/intake-notifications`, `builds/quote-wizard` |
| Inventory | `panrix/icorrect-parts-service` | `codex/inventory-system` | `/Users/ricky/vps/inventory/parts-service`, `/home/ricky/builds/icorrect-parts-service`, `builds/inventory-system`, `builds/apple-ssr`, `builds/mobilesentrix` |

## Rules

1. Do not move, delete, archive, or rename protected active-lane folders.
2. Do not resolve Mutagen conflicts in these lanes by choosing Mac or VPS wholesale.
3. Let the owning agent commit and push first.
4. Resolve conflicts from GitHub source of truth after the owning branch lands.
5. Any loose non-Git notes created under `/Users/ricky/vps/inventory` should be folded into `panrix/icorrect-parts-service` if they are useful to implementation.

## Known Loose Inventory Note

The inventory agent created:

`/Users/ricky/vps/inventory/research/icorrect-inventory-research-2026-05-05.md`

This is not protected by Git while it remains in the top-level `/Users/ricky/vps/inventory` folder. The inventory agent should move or copy useful content into `parts-service` under `docs/`, `briefs/`, or `scratch/` and commit it on `codex/inventory-system`.

## Cleanup Direction

Until these lanes are quiet, Phase 7b cleanup should continue only on inactive fleet, customer-service, team, finance, operations, and split-folder audit work that does not touch the protected paths above.
