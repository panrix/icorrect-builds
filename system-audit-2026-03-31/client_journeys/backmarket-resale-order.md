# Back Market Resale Order Journey

Status: rebuilt from verified docs/code/data on 2026-04-02

## Scope And Ground Truth

- This is the buyer-side BM resale journey after iCorrect already owns the device.
- Listing publication is still operator-invoked; downstream sale detection and dispatch are live scheduled/runtime automations.
- Label buying and BM shipment confirmation are separate control points.
- BM returns and aftercare remain mostly manual.

## Journey Map

1. Device is handed into the listing queue
- Customer touchpoint: none yet; the buyer does not see the device until it is listed.
- Internal handoff: workshop/QC hands a refurbished device into the resale team or operator who publishes listings.
- Systems involved: Monday Main Board `status24 = To List`; linked BM Devices item with specs, cost, grade, and purchase context.
- Automation state: manual handoff into an operator-gated tool.
- Delay points and failure modes: there is no live cron for `list-device.js`, so items can sit in `To List` waiting for human action.
- Sources: `/home/ricky/builds/backmarket/sops/06-listing.md`; `findings.md`.

2. Operator publishes the listing
- Customer touchpoint: the future buyer now sees the BM listing once it is published.
- Internal handoff: operator invokes the listing tool, which becomes the bridge between workshop output and the live BM storefront.
- Systems involved: `scripts/list-device.js`; BM listings API; BM catalog; listings registry; Monday; BM Devices board.
- Automation state: operator-triggered automation with strict verification gates.
- Delay points and failure modes: wrong resolver truth or weak catalog matching can publish the wrong product/spec. The updated SOP now makes `listings-registry.json` canonical and treats raw catalog matches as advisory unless promoted safely.
- Sources: `/home/ricky/builds/backmarket/sops/06-listing.md`; `/home/ricky/kb/backmarket/product-id-resolution.md`; `findings.md`.

3. Listing verification and price setting complete
- Customer touchpoint: buyer sees the correctly mapped spec, grade, and price on BM.
- Internal handoff: successful publish writes key listing data back into BM Devices and moves the Main Board item to `Listed`.
- Systems involved: BM listing create/update APIs; backbox competitor pricing API; Monday BM Devices fields; Main Board `Listed`.
- Automation state: automated once the operator runs the script.
- Delay points and failure modes: if verification fails, the script exits and does not update Monday as listed. Pricing is partly informed by live backbox/scrape data, but ongoing buy-box management still has split runtime ownership between rebuilt JS docs and the live Python weekly process.
- Sources: `/home/ricky/builds/backmarket/sops/06-listing.md`; `data_flows.md`; `findings.md`.

4. Buyer orders on Back Market
- Customer touchpoint: BM product page, checkout, and order confirmation live entirely on BM.
- Internal handoff: once the buyer orders, the case moves from passive listing management into active fulfilment.
- Systems involved: Back Market orders API.
- Automation state: BM-side automated checkout.
- Delay points and failure modes: delayed iCorrect acceptance risks lost sales or SLA issues, which is why the downstream polling job is critical.
- Sources: `/home/ricky/builds/backmarket/sops/00-BACK-MARKET-MASTER.md`; `/home/ricky/builds/backmarket/sops/08-sale-detection.md`.

5. `sale-detection.js` accepts the sale
- Customer touchpoint: buyer benefits from quick order acceptance, though the step is mostly internal.
- Internal handoff: scheduled polling converts a new BM order into accepted fulfilment and updates Monday.
- Systems involved: `sale-detection.js`; BM `GET /ws/orders?state=1`; BM accept-order endpoint; BM Devices board; Main Board; Telegram.
- Automation state: scheduled live automation.
- Delay points and failure modes: matching depends on `listing_id` and an unassigned sold-to field on the BM Devices board. If matching fails or is ambiguous, manual intervention is needed.
- Sources: `/home/ricky/builds/backmarket/sops/08-sale-detection.md`; `data_flows.md`.

6. Monday and BM Devices are updated to `Sold`
- Customer touchpoint: none directly, but this is the internal confirmation that the buyer’s order belongs to a specific physical device.
- Internal handoff: sale acceptance hands the case from listing management to dispatch / packing.
- Systems involved: Main Board `status24 = Sold`; sold date; renamed item; BM Devices buyer, sales order ID, and sale price fields.
- Automation state: automated after successful sale acceptance.
- Delay points and failure modes: if Monday updates fail after BM acceptance, the business still has to fulfil the order but loses clean internal traceability.
- Sources: `/home/ricky/builds/backmarket/sops/08-sale-detection.md`.

7. Dispatch buys the shipping label
- Customer touchpoint: buyer eventually receives tracking because this step creates it, but BM is not yet told that the device has shipped.
- Internal handoff: accepted order moves into the label-buying / packing stage.
- Systems involved: `dispatch.js`; Royal Mail label buying; Main Board `text53`; `status4 = Return Booked`; Slack dispatch summary; packaging slips.
- Automation state: scheduled weekday automation.
- Delay points and failure modes: label buying is not shipment confirmation. If `text53` already has tracking, dispatch skips duplicate purchase even if BM still shows the order awaiting shipment. That can be correct or can hide unresolved confirmation problems.
- Sources: `/home/ricky/builds/backmarket/sops/09-shipping.md`; `data_flows.md`.

8. Team physically ships the device
- Customer touchpoint: buyer expects the parcel to leave promptly after purchase.
- Internal handoff: physical packing/hand-off to Royal Mail passes the case from dispatch prep to confirmed shipment.
- Systems involved: workshop / dispatch team; Monday `status4 = Shipped`.
- Automation state: manual physical action plus manual status change.
- Delay points and failure modes: this is a fragile human gate. The system can have a bought label and tracking number without BM being notified if staff do not mark the item `Shipped`.
- Sources: `/home/ricky/builds/backmarket/sops/09-shipping.md`; `/home/ricky/builds/backmarket/sops/09.5-shipment-confirmation.md`.

9. `bm-shipping` confirms shipment to BM
- Customer touchpoint: buyer now receives the proper BM shipment state and tracking context.
- Internal handoff: manual `Shipped` status in Monday triggers the `bm-shipping` service, which closes the loop back to BM.
- Systems involved: `bm-shipping`; Main Board `text53`, `text4`, and relation to BM Devices; BM sales order ID; BM shipment update API; Slack; Telegram.
- Automation state: automated webhook after the human `Shipped` change.
- Delay points and failure modes: missing tracking, serial, BM Devices link, or BM order ID all hard-block the BM notification. This means the buyer can experience a fulfilment delay even after the parcel is physically prepared or shipped.
- Sources: `/home/ricky/builds/backmarket/sops/09.5-shipment-confirmation.md`; `platform_inventory/vps-webhooks.md`.

10. Delivery and buyer aftercare
- Customer touchpoint: parcel delivery, device usage, and any later complaint/return.
- Internal handoff: if the buyer is happy, the journey ends; if not, the case falls into the manual BM return/aftercare loop.
- Systems involved: BM dashboard; email; manual monitoring; BM Returns group in Monday; Telegram.
- Automation state: mostly manual after delivery.
- Delay points and failure modes: SOP 12 says there is no automated BM return detection and the BM `/ws/sav` aftercare API is not functional. Buyer returns are therefore easy to miss or handle inconsistently.
- Sources: `/home/ricky/builds/backmarket/sops/12-returns-aftercare.md`; `findings.md`.

## Communication Gaps

- The buyer-facing BM journey is strong while BM owns the storefront and checkout, but after iCorrect’s side takes over, the major gap is between label purchase and confirmed BM shipment.
- There is no verified automated BM return detection or canonical aftercare system once the device is delivered.
- Listing publication is still manual, so there is no guaranteed time from “device ready internally” to “buyer can purchase it”.

## Delay Points

- `To List` is a manual queue because listing publication is operator-invoked.
- Buyer fulfilment can stall after label purchase if the human `Shipped` update never happens.
- Missing tracking, serial, or order-link fields hard-block BM shipment confirmation.
- Returns and post-sale issues are manual, so aftercare has the highest observability risk in the resale chain.

## Improvement Opportunities

- Give listing publication an explicit owner/SLA or promote it into a controlled scheduled runtime.
- Add a reconciliation view for “label bought but not BM-confirmed” orders.
- Build automated BM return detection or at least a daily structured exception pull into Monday/Slack.
- Unify buy-box / pricing runtime ownership so listed stock is not managed by split documentation and scheduler paths.

## Unknowns And Assumptions

- Unknown: who exactly owns the operator step for `list-device.js --live --item` day to day.
- [ASSUMPTION] Buyers receive their tracking primarily through BM after shipment confirmation; the audit confirms the internal BM confirmation path but not the exact buyer-facing message copy on BM.
- Unknown: whether any parallel fulfilment checklist exists outside Monday and the dispatch thread.

## Sources

- `findings.md`
- `data_flows.md`
- `/home/ricky/builds/backmarket/README.md`
- `/home/ricky/builds/backmarket/sops/00-BACK-MARKET-MASTER.md`
- `/home/ricky/builds/backmarket/sops/06-listing.md`
- `/home/ricky/builds/backmarket/sops/08-sale-detection.md`
- `/home/ricky/builds/backmarket/sops/09-shipping.md`
- `/home/ricky/builds/backmarket/sops/09.5-shipment-confirmation.md`
- `/home/ricky/builds/backmarket/sops/12-returns-aftercare.md`
- `/home/ricky/kb/backmarket/product-id-resolution.md`
- `platform_inventory/vps-webhooks.md`
