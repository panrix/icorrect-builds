# SOP / Script Issue Log

Purpose: maintain an ongoing log of production issues, SOP/script mismatches, and confirmed resolutions.

Use this format for each entry:
- **SOP:**
- **Issue found:**
- **Script issue:**
- **Resolution:**
- **Updated:**

---

## 2026-04-26 — Return/refund relist invariant

- **SOP:** `12` — Returns & Aftercare; `05` — QC & Final Grade; `06` — Listing
- **Issue found:** Return/refund devices may re-enter the normal repair/QC/listing path, but must not be treated as new physical BM device identities.
- **Script issue:** Read-only queue output did not surface return/refund markers like `RTN > REFUND` as an operator caution before relisting.
- **Resolution:** documented the invariant that one physical BM device maps to one canonical BM Devices item through return/refund cycles, and added non-blocking return/relist caution metadata to `current-queue-readonly.js`.
- **Updated:**
  - `sops/12-returns-aftercare.md`
  - `sops/05-qc-final-grade.md`
  - `sops/06-listing.md`
  - `scripts/current-queue-readonly.js`
  - `test/unit/current-queue-readonly.test.js`

---

## 2026-04-26 — QC SKU handoff boundary

- **SOP:** `05` — QC & Final Grade Assignment; `06` — Listing on Back Market
- **Issue found:** SKU was treated mainly as a listing-time artifact even though it defines the finished BM device identity after QC final grade/spec confirmation.
- **Script issue:** `list-device.js` constructed SKU during listing and only wrote BM Devices `text89` after live listing verification; `current-queue-readonly.js` treated missing `text89` as a generic blocker instead of a QC handoff issue.
- **Resolution:** extracted shared SKU logic to `scripts/lib/sku.js`, added `scripts/qc-generate-sku.js`, changed listing to validate stored vs expected SKU, and changed queue classification to `QC_SKU_MISSING` / `QC_SKU_MISMATCH`.
- **Updated:**
  - `scripts/lib/sku.js`
  - `scripts/qc-generate-sku.js`
  - `scripts/list-device.js`
  - `scripts/current-queue-readonly.js`
  - `sops/05-qc-final-grade.md`
  - `sops/06-listing.md`
  - `sops/00-BACK-MARKET-MASTER.md`

---

## 2026-04-02 — SOP 09 label writeback bug

- **SOP:** `09` — Label Buying
- **Issue found:** Monday items could be moved to `Return Booked` even when `Outbound Tracking` (`text53`) was still empty. This broke downstream shipment confirmation in SOP 09.5 because BM ship confirmation hard-gates on tracking being present.
- **Script issue:** `dispatch.js` wrote `text53` and `status4` in two separate mutations. Tracking write failure was logged, but the script still continued and set `status4` to `Return Booked`.
- **Resolution:** changed `dispatch.js` to write `text53` and `status4 = Return Booked` in one atomic Monday mutation. Successful downstream handling now depends on a confirmed successful Monday writeback.
- **Updated:**
  - `/home/ricky/builds/royal-mail-automation/dispatch.js`
  - `/home/ricky/builds/backmarket/sops/09-shipping.md`

---

## 2026-04-02 — SOP 09 / 09.5 split

- **SOP:** `09` and new `09.5`
- **Issue found:** label buying and BM shipment confirmation were documented inside one SOP even though they use different triggers, systems, and failure modes.
- **Script issue:** not a code bug; documentation structure issue that obscured where tracking is written versus where BM is notified.
- **Resolution:** split BM shipment confirmation into standalone `SOP 09.5` and narrowed `SOP 09` to label buying only.
- **Updated:**
  - `/home/ricky/builds/backmarket/sops/09-shipping.md`
  - `/home/ricky/builds/backmarket/sops/09.5-shipment-confirmation.md`
  - `/home/ricky/builds/backmarket/sops/00-BACK-MARKET-MASTER.md`
  - `/home/ricky/builds/backmarket/README.md`

---

## Notes
- Prefer logging only confirmed issues, not guesses.
- Keep each entry concise and operational.
- If a fix changes live behavior, update both the script and the relevant SOP in the same work pass.
