# Hypotheses To Verify

- H-001: Monday main board is still the operational source of truth for repairs, intake, shipping, and BM-linked workflows.
- H-002: The BM process described in `BM-PROCESS-CURRENT-STATE.md` still matches current live VPS services and Monday automations.
- H-003: n8n is used for some Monday/Intercom cross-system flows, but key BM operational automation is VPS-hosted rather than n8n-hosted.
- H-004: Intercom custom attributes and workflows likely reference Monday item IDs or operational statuses.
- H-005: Shopify orders or customer events may either bypass Monday entirely or create limited operational records compared with repair/intake flows.
- H-006: Slack is a notification layer for multiple operational systems but may not be a reliable team attention surface for all flows.
- H-007: Some credentials in the master env are present for future or partial integrations rather than fully active production systems.
- H-008: BM profitability logic is partially automated in code but not yet fully closed-loop into intake, payout, listing, and aging decisions.
