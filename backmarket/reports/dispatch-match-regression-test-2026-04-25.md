# Dispatch Match Regression Test - 2026-04-25

## Change

Added a pure helper in `/home/ricky/builds/royal-mail-automation/dispatch.js`:

- `selectSharedListingDispatchCandidate(candidates, orderId)`

The helper is used by `matchByListingId()` when multiple unshipped BM Devices candidates share the same Back Market `listing_id`.

## Test coverage

Added offline self-test flag:

```bash
node /home/ricky/builds/royal-mail-automation/dispatch.js --dispatch-match-self-test
```

Covers:

1. Single candidate returns that candidate.
2. Multiple candidates with exactly one `salesOrderId === orderId` returns that candidate.
3. Multiple candidates with no exact order match returns `null`.

## Verification

Executed locally without calling Back Market, Monday, Royal Mail, Slack, or any external network:

```bash
node -c /home/ricky/builds/royal-mail-automation/dispatch.js
node /home/ricky/builds/royal-mail-automation/dispatch.js --dispatch-match-self-test
```

Result:

```text
Dispatch match self-test passed
```

## Notes

The self-test path exits before `main()` and does not fetch pending orders or buy labels.
