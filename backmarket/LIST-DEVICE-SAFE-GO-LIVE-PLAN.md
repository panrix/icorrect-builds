# Plan: list-device.js Safe Go-Live

## Objective

Make the active SOP 06 flow in `bm-scripts/list-device.js` safe to go live without repeating wrong-spec or wrong-colour listings. Prioritize exact identity matching, strict verification, and controlled rollout over broad automation.

Scope note:
- `/home/ricky/builds/backmarket/scripts/list-device.js` is a stale copy and is not the implementation that should be patched for trust work.

## Success Criteria

- No listing is created or reactivated unless identity is proven exactly.
- Legacy dirty listings are not reused silently.
- Any mismatch forces block or immediate takedown.
- Single-item live runs succeed repeatedly before bulk live is enabled.

## P0 Must Fix Before Live

### 1. Build a canonical identity model

Create one normalized identity object per device containing:

- model number
- device family/type
- `product_id`
- grade
- colour
- RAM
- SSD
- CPU/GPU where applicable

Use this same object for all pre-checks and post-checks.

### 2. Remove legacy SKU as a trust signal

- Keep SKU generation for new listings only.
- Do not use existing BM SKU as proof that a listing is correct.
- Use SKU only for logging and debug visibility.

### 3. Harden stored listing reuse

For any stored listing ID from Monday, fetch the live listing and require exact match on:

- grade
- `product_id`
- colour
- RAM
- SSD
- CPU/GPU for shared-variant models

If any mismatch occurs:

- reject reuse
- alert Telegram
- fall back to a clean listing path if safe

No silent reuse on partial match.

### 4. Make colour a hard gate

Add explicit colour normalization across:

- Monday values
- V6 values
- BM title / listing values

If colour cannot be proven, block listing.

Wrong-colour risk is treated as critical, not warning-only.

### 5. Disable fuzzy acceptance for risky models

No fuzzy matching for:

- `A2442`
- `A2485`
- `A2918`
- `A2992`
- Intel models

Shared-model Macs must prove the correct CPU/GPU variant before listing.

### 6. Prefer fresh clean listings over dirty reuse

If legacy listing identity is ambiguous, do not reactivate or bump quantity.

Prefer a fresh listing path using exact resolved product identity.

### 7. Strengthen post-list verification

After any create/reactivate action, verify:

- `product_id`
- grade
- quantity
- publication state
- RAM in title
- SSD in title
- colour
- CPU/GPU markers where relevant

If any critical mismatch:

- set quantity to `0` immediately
- alert Telegram
- record the listing as unsafe for future reuse

Current status:
- grade, quantity, publication state, RAM, and SSD checks exist in the active flow
- colour is still listed here as required, but is not yet fully enforced in `verifyListing()`
- CPU/GPU post-list verification is also still incomplete

### 8. Add denylist for unsafe legacy listings

Create a persistent denylist file of listing IDs / UUIDs that must never be reused.

Check it before any Path A/A2 reuse.

Auto-append when a listing fails critical verification.

Current status:
- this denylist has not been implemented yet and remains an open safety item

### 9. Restrict first live rollout

Live mode for phase 1 must be single-item only:

```bash
node list-device.js --live --item <id>
```

Bulk live remains disabled until validation threshold is met.

## P1 First Week

### 10. Add structured audit output

Emit a machine-readable report per run including:

- selected path
- identity inputs
- why a listing was accepted or rejected
- verification results
- Telegram alerts sent

Save reports for review and rollback analysis.

### 11. Audit the current BM listing pool

Build a one-time or repeatable audit that classifies existing BM listings into:

- trusted reusable
- ambiguous / needs cleanup
- never reuse

Use this to seed the denylist and future safe-reuse allowlist.

### 12. Add safe allowlist for trusted reusable listings

Optional allowlist for listings proven clean and safe to reuse.

Reuse should eventually prefer allowlisted listings over open-ended search.

### 13. Improve exact product resolution

Tighten V6 + lookup + Intel resolution so RAM/SSD/colour/variant all converge cleanly.

Do not rely on colour picker alone unless other pickers are consistent.

## P2 Cleanup After Launch

### 14. Legacy SKU normalization project

Normalize or replace dirty BM listing SKUs so the estate becomes easier to manage.

This is cleanup, not a prerequisite for initial safe live.

### 15. Controlled bulk live mode

Only after successful single-item live runs.

Bulk mode should still skip ambiguous cases and continue safely.

### 16. Trusted listing migration

Move from mixed legacy reuse to a curated clean listing base.

## Operational Rollout

1. Patch `list-device.js` with P0 changes.
2. Test against known-problem historical examples.
3. Run dry-run on a small sample.
4. Run live on 5 to 10 single items only.
5. Review each resulting BM listing manually.
6. If zero critical mismatches, expand cautiously.
7. Only then consider bulk live.

## Key Policy Assumptions

- `list-device.js` is in scope for this rebuild and must go live.
- Wrong spec or wrong colour is unacceptable and must hard-block.
- Legacy BM listing data is not fully trustworthy.
- Safety is more important than throughput during first rollout.

## Deliverables

- patched `bm-scripts/list-device.js`
- unsafe listing denylist
- audit/report output for runs
- BM listing pool classification report
- rollout note for operators showing:
  - how to run dry-run
  - how to run single-item live
  - what counts as a hard failure
