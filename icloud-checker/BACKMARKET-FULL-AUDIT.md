# Back Market Full Audit

**Date:** 2026-03-23
**Audited by:** Codex
**Scope:** `origin/master` of `panrix/icorrect-builds` plus the local deployed icloud-checker workspace at `/home/ricky/builds/icloud-checker`

---

## Executive Summary

The intended design is clear at a high level:

- each Back Market SOP should have a corresponding script
- sell-side and buyback flows should be decomposed into separate automations
- icloud-checker should only own intake/iCloud/spec-check logic

**The actual implementation is not there yet.**

- The current live implementation is still the icloud-checker monolith at `src/index.js`, 1914 lines.
- `origin/master` does contain a much better SOP-and-script structure under `backmarket/`, but that structure is incomplete and not fully deployable as-is.
- Some "canonical" scripts look solid and self-contained.
- Some others still depend on support modules that are missing from git.
- The top-level master map `backmarket/sops/00-BACK-MARKET-MASTER.md` is still only a skeleton, so the real source of truth is spread across individual SOPs, QA notes, and scripts.

---

## Intended Architecture

From `origin/master`, the repo is trying to become this:

| SOP | Script |
|-----|--------|
| SOP 01 | `sent-orders.js` |
| SOP 02 | icloud-checker intake webhook |
| SOP 03 | diagnostic remains mostly manual, with automated grade/profitability checks |
| SOP 03b | `trade-in-payout.js` |
| SOP 06 | `list-device.js` |
| SOP 06.5 | `reconcile-listings.js` |
| SOP 07 | `buy-box-check.js` |
| SOP 08 | `sale-detection.js` |
| SOP 09 | `shipping.js` |

That direction is correct. The problem is that the implementation is split across two worlds:

- **the old live world:** one Express server handling intake, counter-offers, shipping, payout, grade-check, and dead listing code
- **the new intended world:** separate SOP scripts under `backmarket/scripts/`

---

## What Is Canonical Right Now

### 1. For business logic

The most reliable business definitions are the individual SOPs, not the master map:

- `backmarket/sops/01-trade-in-purchase.md`
- `backmarket/sops/02-intake-receiving.md`
- `backmarket/sops/03-diagnostic.md`
- `backmarket/sops/03b-trade-in-payout.md`
- `backmarket/sops/06-listing.md`
- `backmarket/sops/07-buy-box-management.md`
- `backmarket/sops/08-sale-detection.md`
- `backmarket/sops/09-shipping.md`

### 2. For deployed intake automation

The local monolith is still the real implementation:

- `src/index.js`
- `src/apple-specs.js`
- `src/lib/counter-offer.js`
- `src/lib/profitability.js`

### 3. For future decomposition targets

The `backmarket/scripts/` folder is the target operating model, but it is not uniformly production-ready.

---

## High-Severity Findings

### 1. The intended architecture exists only partially

`00-BACK-MARKET-MASTER.md` is explicitly marked skeleton-only. It does not yet function as a usable master reference. That means context is fragmented across:

- SOPs
- script headers
- QA task docs
- the monolith

**Result:** there is no single trusted "map of the system" yet.

### 2. The monolith is still the operational center of gravity

Despite the newer script set, the actual implemented automation still clusters around `src/index.js`:

- intake / iCloud webhook
- Slack interaction handling
- counter-offer handling
- shipping confirmation
- payout webhook
- grade-check webhook
- disabled listing code
- recheck cron

This means the repo is **conceptually decomposed but operationally still centralized**.

### 3. Some "standalone" scripts are not actually standalone

`origin/master:backmarket/scripts/list-device.js` imports:

- `./lib/monday`
- `./lib/bm-api`
- `./lib/logger`

Those support files are **not present anywhere in the fetched git tree**.

That is a **critical repo integrity issue**:

- the script may have been QA'd in another workspace
- but this repo snapshot is not self-contained
- a clean checkout cannot run that script as committed

This is the clearest sign that development happened across multiple environments and was merged back incompletely.

### 4. Canonical-vs-live duplication is still unresolved

There are two implementations for some flows:

- **payout:** monolith endpoint and `trade-in-payout.js`
- **shipping confirmation:** monolith endpoint and `shipping.js`
- **listing:** dead monolith code and `list-device.js`

Until one version is declared canonical and the other is removed, every future change risks drifting twice.

---

## Medium-Severity Findings

### 5. SOP coverage is uneven

The intended "one SOP, one script where possible" model is not complete yet.

Current state:

| SOP | Status |
|-----|--------|
| SOP 01 | script exists, but QA notes still flag field extraction issues |
| SOP 02 | lives inside monolith, not decomposed |
| SOP 03 | mostly manual, plus monolith grade-check |
| SOP 03b | script looks viable |
| SOP 06 | script exists, but repo is missing dependencies |
| SOP 06.5 | script exists |
| SOP 07 | script exists |
| SOP 08 | script exists |
| SOP 09 | script exists, but QA says backlog/date filtering still needed |
| SOP 10+ | mostly docs/manual/placeholders |

### 6. QA state is documented, but not consolidated into a readiness matrix

The repo has useful QA docs:

- `QA-ISSUES.md`
- `TASK-QA-LIST-DEVICE.md`
- `QA-PROFITABILITY-*`

But there is no single deployment-readiness table answering:

- script runnable from clean checkout?
- dry-run verified?
- live-safe?
- replacing monolith yet?

### 7. The local repo and the fetched repo do not line up structurally

Local deployment shape:
```
/home/ricky/builds/icloud-checker/src/index.js
/home/ricky/builds/icloud-checker/src/lib/*
```

Fetched repo shape:
```
icloud-checker/index.js
icloud-checker/lib/*
backmarket/scripts/*
```

So even before recoding, there is a **repo hygiene problem**:

- one machine is running a nested `src/` layout
- git tracks a flat `icloud-checker/` layout

This creates confusion around service files, deployment, and diffing.

---

## Script Readiness Snapshot

### Probably closest to canonical

- `trade-in-payout.js`
- `sale-detection.js`
- `reconcile-listings.js`
- `buy-box-check.js`

These appear self-contained and aligned to their SOPs, though they still need live environment validation.

### Needs work before trusted

- **`sent-orders.js`**
  - QA notes say product name and price extraction are wrong
- **`shipping.js`**
  - QA notes say it pulls the full shipped backlog and needs date filtering
  - label-buying still depends on another repo's dispatch flow
- **`list-device.js`**
  - repo missing required `lib/` support modules

### Still belongs to the monolith today

- intake / iCloud check
- Apple spec lookup
- customer reply recheck flow
- counter-offer Slack loop
- grade-check webhook

These should be extracted later, but today they are still operationally tied to icloud-checker.

---

## The Real Shape Of The System

### Buyback side

- SOP 01 inbound order creation is moving toward `sent-orders.js`
- SOP 02 intake is still owned by icloud-checker
- SOP 03 diagnostic is partly manual and partly monolith automation
- SOP 03b payout can move cleanly to `trade-in-payout.js`

### Sell side

- SOP 06 listing is meant to move to `list-device.js`, but the repo snapshot is incomplete
- SOP 06.5 reconciliation exists as script
- SOP 07 buy box exists as script
- SOP 08 sale detection exists as script
- SOP 09 is split between `dispatch.js` in another repo and `shipping.js` here

This means **the Back Market system is not one repo yet**. It is one process spread across:

- icloud-checker
- backmarket/scripts
- royal-mail-automation
- other data directories on the VPS

---

## Recommended Canonical Model

### Keep in icloud-checker

- intake webhook
- iCloud status check
- Apple specs lookup
- customer recheck flow
- counter-offer Slack flow

**Reason:** these pieces are tightly coupled around intake and customer comms.

### Move out of icloud-checker

- payout
- shipping confirmation
- listing
- listings reconciliation
- sale detection
- buy box management

**Reason:** these are separate SOP automations and do not need to share one Express process.

### Add a shared Back Market runtime layer

The script set needs a real shared module layer committed into git, for example:

- `backmarket/lib/monday.js`
- `backmarket/lib/bm-api.js`
- `backmarket/lib/logger.js`
- `backmarket/lib/telegram.js`
- `backmarket/lib/profitability.js`

Until that exists, script quality will remain inconsistent and some files will only work in one developer's environment.

---

## Recode Priorities

### Phase 1: Make the repo internally consistent

1. Finish `00-BACK-MARKET-MASTER.md`
2. Commit the missing shared `lib/` modules required by `list-device.js`
3. Add a script readiness matrix with statuses: draft, dry-run verified, live verified, canonical
4. Document external repo dependencies explicitly, especially `dispatch.js`

### Phase 2: Declare canonical ownership

1. **Payout:** make `trade-in-payout.js` canonical, remove monolith payout path
2. **Shipping confirmation:** choose `shipping.js` or monolith route, not both
3. **Listing:** make `list-device.js` canonical only after missing libs are restored and verified

### Phase 3: Reduce icloud-checker

1. Remove dead listing handler
2. Remove payout endpoint after cutover
3. Remove shipping endpoint after cutover
4. Extract grade-check if it can be independently scheduled or triggered

### Phase 4: Stabilize documentation

1. One master map
2. One per-SOP script owner
3. One deployment document
4. One source of truth for Monday columns and status indices

---

## Bottom Line

**The good news** is the intended architecture is actually sensible.

**The bad news** is the repo is still in a halfway state:

- docs are ahead of deployment in some places
- deployment is ahead of git hygiene in others
- at least one "canonical" script is not runnable from the repo as committed
- the monolith is still doing more real work than the script architecture suggests

So the right way to recode this is **not** "rewrite everything again."

The right way is:

1. finish the repo shape
2. choose canonical owners per SOP
3. move working paths out of the monolith one by one
4. delete duplicates immediately after each cutover
