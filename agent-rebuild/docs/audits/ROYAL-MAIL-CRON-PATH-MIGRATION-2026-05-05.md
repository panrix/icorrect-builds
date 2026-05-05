# Royal Mail Cron Path Migration - 2026-05-05

## Purpose

Record the live VPS cron-path migration for Royal Mail automation after the repository was moved to the operations domain.

## Decision

Royal Mail scheduled jobs now run from:

`/home/ricky/operations/royal-mail-automation`

instead of:

`/home/ricky/builds/royal-mail-automation`

The old builds clone remains in place temporarily as rollback material until the next scheduled runs complete successfully.

## Crontab Backup

Before changing cron, the live crontab was backed up to:

`/home/ricky/backups/cron/crontab-before-royal-mail-path-migration-20260505T062755Z.txt`

## Changed Cron Entries

| Schedule | Script | Previous working directory | New working directory |
|---|---|---|---|
| Weekdays 07:00 UTC | `dispatch.js` | `/home/ricky/builds/royal-mail-automation` | `/home/ricky/operations/royal-mail-automation` |
| Weekdays 12:00 UTC | `dispatch.js` | `/home/ricky/builds/royal-mail-automation` | `/home/ricky/operations/royal-mail-automation` |
| Weekdays 12:00 UTC | `repairs-dispatch.js` | `/home/ricky/builds/royal-mail-automation` | `/home/ricky/operations/royal-mail-automation` |
| Weekdays 15:00 UTC | `repairs-dispatch.js` | `/home/ricky/builds/royal-mail-automation` | `/home/ricky/operations/royal-mail-automation` |

## Pre-Change Checks

- `dispatch.js`, `repairs-dispatch.js`, `package.json`, and `package-lock.json` matched byte-for-byte between the old and new paths.
- The new live VPS path initially lacked `node_modules`, so `npm ci --omit=dev` was run in `/home/ricky/operations/royal-mail-automation`.
- Installed dependencies matched the lockfile and reported 0 vulnerabilities.
- The new dependency footprint was 14M, matching the old path.

## Verification

After the cron update:

- Old Royal Mail cron path count: 0.
- New Royal Mail cron path count: 4.
- `node --check dispatch.js` passed from the new directory.
- `node --check repairs-dispatch.js` passed from the new directory.
- `require.resolve("dotenv")`, `require.resolve("playwright")`, and `require("./buy-labels")` passed from the new directory.
- `node dispatch.js --dispatch-match-self-test` passed from the new directory.
- `vps-core` Mutagen remained connected and watching.

## Rollback

If the next scheduled Royal Mail runs fail because of the path migration, restore the backed-up crontab with:

```bash
crontab /home/ricky/backups/cron/crontab-before-royal-mail-path-migration-20260505T062755Z.txt
```

Then investigate the new operations path before retrying.

## Follow-up

1. Check `/home/ricky/logs/cron/dispatch.log` after the next 07:00 or 12:00 UTC weekday run.
2. Check `/home/ricky/logs/cron/repairs-dispatch.log` after the next 12:00 or 15:00 UTC weekday run.
3. Keep `/home/ricky/builds/royal-mail-automation` until at least one successful scheduled run for both scripts.
4. After successful runs, replace the old builds clone with a pointer README or remove it in a later cleanup batch.
