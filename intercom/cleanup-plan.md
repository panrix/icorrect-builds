# Intercom Cleanup Plan for Claude

**Context: This cleanup is part of Phase 1 (Baseline hardening) of the Intercom Agent SPEC. It aims to resolve underlying data issues and ensure a reliable foundation for further automation and integration as outlined in SPEC.md.**

## Overview
This document outlines the steps needed to clean up the Intercom environment to ensure clean data for accurate reporting and efficient workflow.

---

## Key Actions

1. **Bulk Close Conversations**
   - Close all open conversations that predate 2025. These are legacy Zendesk imports and are no longer actionable.

2. **Tag/Archive Zendesk Imports**
   - Apply a `zendesk-archive` tag to conversations imported from Zendesk. Use `CSV Import` tags as identifiers.
   - Consider archiving these if Intercom functionality supports it.

3. **Contact Cleanup**
   - Delete duplicate contacts or merge those with identical emails.
   - Remove or anonymize contacts with no email (17,744 anonymous leads found).

4. **Tag Sanitation**
   - Remove deprecated or unclear tags (`Feature Request`, `create`).
   - Ensure tag consistency for live data.

5. **Resolve Unassigned Conversations**
   - Assign or close any conversations currently marked as open but unassigned.

---

## Technical Details

1. **API Utilization**
   - Use the Intercom API to automate most of these steps. Claude can handle bulk operations to efficiently process and organize the data.

2. **Regular Cleanup Schedule**
   - Propose automation rules or scripts that periodically check and clean data to prevent future clutter.

3. **Verification**
   - Ensure all actions provide logging or confirmation to easily verify their success.

## Next Steps
1. Load this plan into Claude to automate the tasks.
2. Schedule regular data audits following the cleanup.

---

This plan ensures a streamlined, manageable inbox and contact list ready for accurate reporting, SOP, and KPI development.