# Anton Daly issue-log row verification

Generated: 2026-04-28 09:50 UTC  
Mode: READ ONLY — Monday and Intercom API reads only. No writes/mutations.

## Inputs checked

- Current Monday item: `11819418416`
- Previous Monday item: `7990720792`
- Intercom conversation: `215474089652460`

Commands/tooling used:

- temporary read-only Monday/Intercom fetch scripts under `/tmp/anton_audit_fetch.js` and `/tmp/anton_more.js`
- evidence cache: `/tmp/anton_audit_evidence.json`
- Monday API reads: `items`, `updates/replies`, `activity_logs`
- Intercom API read: `GET /conversations/215474089652460`

## Evidence

### Current Monday item `11819418416`

- Item name: `Anton Daly`
- Group: `Awaiting Confirmation of Price`
- Current status: `Diagnostic Complete`
- Client type: `Warranty`
- Service: `Walk-In`
- Repair Type: `Diagnostic`
- Email: `antondaly15@gmail.com`
- IMEI/SN: `C02VG0FWHTD6`
- Device relation resolves to `MacBook Pro 15 A1707`.
- Item update, 2026-04-22 16:47 by Naheed:
  - `In for warranty assessment. Device only works when plugged in and keyboard is not functional.`
- Safan diagnostic reply, 2026-04-27 17:32:
  - AMM reading `20.0`, `1.100`
  - `macbook working fine,no battrey reading and keyboard not working`
  - `we check no liquid damage`
  - external keyboard test showed other parts working
  - after disconnect/reconnect battery, `battrey reading fine maybe to old battery`
  - repairs needed: `need new battery keyboard`
- Michael reply, 2026-04-28 08:22:
  - explained to customer battery not recognised and keyboard not working
  - customer upset; says device has had issues since previous repair where it would not charge and he has not used it since last repair apart from getting data out
  - Michael explained unused batteries can fail over time and keyboard issue is separate from previous repairs
  - `Will send out quote this morning. Client is leaving on Friday`
  - customer said he mentioned this at drop-off, but Michael notes there are no notes
- Naheed reply, 2026-04-28 09:04:
  - `sorry i relayed the info to the team but didn't make a note here.`
- Parts Required activity on current item links:
  - `A1707 Battery` (`2376192998`) — stock 0, supply price £35 ex VAT
  - `Keyboard - A1706 / A1707` (`9934300395`) — stock 3, supply price £25 ex VAT

### Previous Monday item `7990720792`

- Item name: `Anton Daly`
- Group: `Returned`
- Status: `Returned`
- Client type: `End User`
- Service: `Walk-In`
- Repair Type: `Repair`
- Email now `antondaly15@gmail.com`; earlier activity shows original email `anton@gradeaservice.co.uk`
- IMEI/SN: `C02VG0FWHTD6`, matching current item
- Device relation resolves to `MacBook Pro 15 A1707`
- Requested/quote lines linked:
  - `MacBook Pro 15 A1707 Diagnostic`
  - `MacBook Pro 15 A1707 Flexgate`
  - custom line `MacBook Pro 15 A1707 Logic Board Repair` (£139)
  - discount line `Discount - 10%`
- High-level note, 2024-12-05 15:03:
  - customer started experiencing fault in 2021
  - Apple diagnosed Flexgate and quoted screen assembly replacement
- Tech note, 2024-12-07 16:22 by Safan:
  - MacBook did not turn on
  - minor liquid damage found
  - `Two CD chpis short ( U3100,u3200)`
  - after replacing two CD chips, MacBook working
  - Flexgate issue also present
  - repairs needed: logic board level issue / logic board repair done / flex gate
- Battery notes:
  - 2024-12-10: `battery Heath 87%/256`
  - 2024-12-19 check result: battery health `90`, ammeter `20V`, `4.2A`, device has power yes
- Quote/payment activity:
  - diagnostic paid £49
  - customer accepted 10% discount and paid; final paid value £443
- Repair/QC/release notes:
  - 2024-12-19 Safan: `Post repair all good . after repair used 30 minutes working fine`
  - 2024-12-19 Mike: `Post Testing: rebooting after sleep/wake - lid closed, dead when opened. Releasing with no further repair`
  - status then moved `Ready To Collect` and `Returned` on 2024-12-20

### Intercom conversation `215474089652460`

- Conversation exists, open, created/updated 2026-04-28 09:24 UTC.
- It contains no readable customer/admin message body in the API result.
- Parts present are empty source, assignment, and ticket-state update only.
- Therefore, the Intercom thread URL is valid as a linked thread, but it does **not** independently evidence the customer claims or resolution text at the time of this audit.

## Mismatches / risk in proposed row

1. **Mostly supported:** device/model, current reported faults, diagnostic findings, no-liquid-damage note, aged/intermittent battery reading after reconnect, keyboard fault, and prior U3100/U3200 + Flexgate repair are supported by Monday evidence.
2. **Supported but should be phrased carefully:** `Neither fault is linked to the December 2024 repair` is supported as Michael's explanation/conclusion in Monday comments, not as a formal engineering root-cause proof beyond the diagnostic notes.
3. **Supported:** customer says issues continued since previous repair, device not used since except data extraction, and he mentioned the charging issue at drop-off. Monday also confirms Naheed did not record that note.
4. **Supported:** previous repair had QC/post-test sleep/wake fault and was released without further repair.
5. **Not evidenced in fetched Intercom:** proposed row implies the Intercom thread contains relevant content, but the Intercom API returned no readable conversation content. Evidence is on Monday, not Intercom.
6. **Not evidenced / risky internal detail:** `Charge the customer for the keyboard replacement only`, `battery is waived as goodwill`, `sourcing an A1707 top case from a Back Market device`, `donor unit cost is absorbed against the keyboard line` are **not present** in the fetched Monday or Intercom evidence. Monday currently shows battery + keyboard parts required and Michael saying he will send a quote; it does not show the final commercial resolution or donor-source plan.
7. **Risky to include in issue log if customer-facing or broadly visible:** the Back Market donor/top-case/internal costing line is internal operational/commercial context and could confuse or create margin/warranty questions. Keep it out unless the log is strictly internal and Ricky explicitly wants sourcing mechanics recorded.

## Recommendation

Use the proposed Issue section with minor evidence-safe wording. Change the Resolution section to separate confirmed evidence from proposed/intended resolution. If this row is going into an issue log visible to staff beyond Ricky/Ferrari, omit the Back Market donor/cost absorption detail or mark it clearly as internal-only.

## Recommended final row text

### A Issue

Returning customer, MacBook Pro 15 A1707, in for warranty assessment in April 2026. Reported faults: device only powers when plugged in, keyboard not functional.

Current diagnostic notes confirm: the MacBook otherwise worked during testing, there was no liquid damage seen, the keyboard did not work, and the battery initially had no reading but recovered after disconnect/reconnect. The technician assessed the battery issue as likely age/unused-battery related and separately noted the keyboard needs replacement.

The December 2024 repair on the same serial/device addressed two shorted CD chips on the logic board (`U3100`, `U3200`) and Flexgate. Prior notes show the battery was reading/health-tested at that time, and the keyboard was included in post-repair checks. Based on the current diagnostic notes and Michael's customer note, the present battery/keyboard faults are being treated as separate from the December 2024 board/Flexgate repair rather than a continuation of that repair.

Customer dispute/context: the customer believes the current faults are a continuation of the previous repair. He says the device has not been used since December 2024 apart from data extraction, and says he mentioned at drop-off that it had not charged since. There is no written drop-off note of that comment on the current Monday item; Naheed later confirmed he relayed it verbally to the team but did not make a note. Previous repair background: during post-repair testing/QC the device exhibited a sleep/wake fault (`lid closed, dead when opened`) and was released with no further repair.

### B Resolution

Evidence currently confirms that the customer needs a quote/resolution for battery + keyboard findings, and that Michael planned to send the quote on 2026-04-28.

If Ricky/Ferrari approve the proposed commercial resolution, record it as: charge the customer for the keyboard replacement only and waive the battery as goodwill given the returning-customer context.

Internal-only operational note, if needed: fitting an A1707 top case would replace the keyboard and battery in one operation; do not include donor-source/cost-absorption wording in any customer-facing or broadly visible issue log unless explicitly approved.

### C Monday ID

`11819418416`

### D Conversation Thread

`https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215474089652460`
