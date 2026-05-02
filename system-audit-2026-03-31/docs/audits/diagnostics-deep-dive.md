# Diagnostics Deep Dive

Last updated: 2026-04-02

## Scope

- Board: `349212843`
- Analysis window for intake cohort: `2025-10-01` through `2026-03-31`
- Open-state snapshot date: `2026-04-02`
- Method: live Monday GraphQL pull for board items plus live `updates` query for diagnostic items; local audit exports used only as cross-checks where Monday historical surfaces are incomplete.
- Important limitation: customer approval / response timing is only partially traceable in Monday. Where exact approval dates are not visible, the report uses explicit proxies and labels them as such.

## 1. Diagnostic Volume And Identification

- Intake-cohort diagnostic jobs in scope: `794`
- Diagnostic jobs with `Diag. Complete` in the same window: `661`
- Monthly intake volume:
  - `2025-10`: `141`
  - `2025-11`: `107`
  - `2025-12`: `124`
  - `2026-01`: `174`
  - `2026-02`: `150`
  - `2026-03`: `98`
- Monthly diagnostic completions:
  - `2025-10`: `119`
  - `2025-11`: `88`
  - `2025-12`: `104`
  - `2026-01`: `143`
  - `2026-02`: `124`
  - `2026-03`: `83`
- Device mix:
  - `MacBook`: `646`
  - `iPhone`: `98`
  - `iPad`: `39`
  - `Watch`: `7`
  - `Other`: `4`
- Fault / service-category mix:
  - `Other / Unclear`: `260`
  - `Diagnostic / Unknown Fault`: `225`
  - `Screen`: `208`
  - `Battery`: `42`
  - `Charging / Port`: `32`
  - `Board Level`: `20`
  - `Liquid Damage`: `4`
  - `Camera`: `3`

## 2. Written Updates / Diagnostic Reports

- Detailed diagnostic write-ups: `69`
- Thin write-ups: `443`
- Missing / non-meaningful write-ups: `282`
- `Diag. Complete` present but no meaningful diagnostic note: `199`
- Pattern readout:
  - The strongest notes usually sit near `Diag. Complete`, are written by a human tech, and explain both prior history and the current fault.
  - Thin notes are usually routing comments, quote admin, or one-line outcomes without technical justification.
  - Only `69` of `794` diagnostic jobs in the intake cohort have a genuinely detailed write-up.
- Representative strong examples:
  - `Guy Mantoura` (`11129983413`) by `Michael Ferrari` on `2026-01-29`: “Previous repair: - we repair logic board,we found one capactier short ( C9081) line name PPBUS_G3H_SSD0) after repair logic board macbook working fine - Battery was loose (had”
  - `Theepan Gnana` (`11226683740`) by `Michael Ferrari` on `2026-02-09`: “Previous repair (09/2024): Charging port repair. Data not working (would not connect to PC) and customer accepted to proceed regardless. Current issue: Charging port no longer working. The”
  - `Juyeon Lee` (`11546382169`) by `Ricky Panesar` on `2026-03-19`: “Previous repair: iPhone 14 screen replacement completed in May 2025.Current issue: Customer reports that after the screen repair, the front / selfie camera became dusty. They first noticed”
- Representative weak / missing examples:
  - `Vivienne Luu` (`10935204499`): no meaningful human update found.
  - `Niki Freeman` (`11611289090`): no meaningful human update found.
  - `#1144 - Shiri Shalmy` (`11579119835`): `thin` note by `Michael Ferrari` on `2026-03-24`: “📦 SHOPIFY ORDER #1144Service: Walk-InTotal: £49.00Turnaround: StandardIntercom ticket: https://app.intercom.com/a/inbox/pt6lwaq6/inbox/conversation/215473609443889Items:- MacBook Air 13-inch A1466 (2012-2017) Diagnostic - No Power”
- Flagged jobs with `Diag. Complete` but no meaningful note:
  - `BM 1516 ( Charley Adams )` (`11408261009`) | tech `Safan Patel` | diag complete `2026-03-09`
  - `BM 1529 ( Eldon Bradfield )` (`11440578368`) | tech `Safan Patel` | diag complete `2026-04-02`
  - `Erman Ozen (C/o Carla Grima)` (`10779730188`) | tech `Safan Patel` | diag complete `2026-01-13`
  - `BM 1553 ( Declan Phillips )` (`11509247034`) | tech `Andreas Egas` | diag complete `2026-04-01`
  - `Shaun Willoughby` (`18245365148`) | tech `Safan Patel` | diag complete `2025-10-22`
  - `BM 1041` (`18275986385`) | tech `Safan Patel` | diag complete `2025-10-31`
  - `BM 1050` (`18306817535`) | tech `Safan Patel` | diag complete `2025-11-03`
  - `BM 995` (`18117320274`) | tech `Safan Patel` | diag complete `2025-10-07`
  - `Philip Scaife *for parts` (`18363598408`) | tech `Safan Patel` | diag complete `2025-11-12`
  - `Meka` (`18230986001`) | tech `Safan Patel` | diag complete `2025-10-21`
  - `Zerbab Caumba` (`18288798437`) | tech `Safan Patel` | diag complete `2025-10-31`
  - `Dominic Lipscombe` (`18119522785`) | tech `Safan Patel` | diag complete `2025-10-31`
  - `Stuart Morris` (`10526786946`) | tech `Safan Patel` | diag complete `2025-11-11`
  - `Brandon Chang` (`10635631450`) | tech `Safan Patel` | diag complete `2025-12-10`
  - `Sashi Handford` (`10796944668`) | tech `Safan Patel` | diag complete `2025-12-19`
  - `Cedric fernandes` (`11048116256`) | tech `Safan Patel` | diag complete `2026-01-28`
  - `Alex Hansez` (`11141175217`) | tech `Safan Patel` | diag complete `2026-01-30`
  - `Seamus Kelly` (`18118598433`) | tech `Safan Patel` | diag complete `2025-10-09`
  - `Lisa Denderuk` (`18287076229`) | tech `Safan Patel` | diag complete `2025-11-04`
  - `Annelisa Le` (`18327388698`) | tech `Safan Patel` | diag complete `2025-11-04`
  - `... 179 more`

## 3. Timeline Analysis

- `Received/Created -> Diag. Complete`: n=`661`, median=`1.0d`, p75=`2.0d`, p90=`5.0d`
- `Diag. Complete -> Quote Sent`: n=`206`, median=`1.0d`, p75=`2.0d`, p90=`4.0d`
- `Quote Sent -> Customer Response (traceable only)`: n=`2`, median=`3.5d`, p75=`3.5d`, p90=`3.5d`
- `Approval -> Repair Complete (traceable only)`: n=`0`, median=`n/a`, p75=`n/a`, p90=`n/a`
- `End-to-end to Return/Collection`: n=`652`, median=`5.0d`, p75=`12.1d`, p90=`24.0d`
- Diagnostic-only vs converted-to-repair:
  - Diagnostic-only: n=`87`, median intake->diag=`1.0d`
  - Converted to repair: n=`574`, median intake->diag=`1.0d`

## 4. Conversion Funnel

- Diagnostics completed in window: `661`
- Quote sent: `206` (`31.2%`)
- Traceable customer response after quote: `2` (`1.0%` of quoted jobs)
- Repair-authorised / proceeded proxy: `574` (`86.8%` of diagnostics completed)
- Repairs that proceeded without a recorded `Quote Sent` date: `415` (`62.8%`)
- Completed repair: `574` (`86.8%`)
- Declined / cancelled / abandoned: `19` (`2.9%`)
- Limbo (`Quote Sent` but no visible decision/completion): `17` (`8.3%` of quoted jobs)
- Biggest recorded funnel break is `Diag. Complete -> Quote Sent`: `455` diagnostics have no formal quote date, even though many later progress to repair.
- Funnel by device:
  - `MacBook`: diag complete `562`, quote `133`, completed repair `493`, declined `12`, limbo `12`
  - `iPhone`: diag complete `64`, quote `49`, completed repair `51`, declined `5`, limbo `5`
  - `iPad`: diag complete `28`, quote `21`, completed repair `26`, declined `0`, limbo `0`
  - `Watch`: diag complete `6`, quote `3`, completed repair `3`, declined `2`, limbo `0`
  - `Other`: diag complete `1`, quote `0`, completed repair `1`, declined `0`, limbo `0`
- Funnel by fault:
  - `Other / Unclear`: diag complete `224`, quote `31`, completed repair `205`, declined `10`, limbo `3`
  - `Screen`: diag complete `184`, quote `37`, completed repair `167`, declined `0`, limbo `1`
  - `Diagnostic / Unknown Fault`: diag complete `168`, quote `89`, completed repair `128`, declined `9`, limbo `11`
  - `Battery`: diag complete `35`, quote `24`, completed repair `29`, declined `0`, limbo `2`
  - `Charging / Port`: diag complete `27`, quote `17`, completed repair `25`, declined `0`, limbo `0`
  - `Board Level`: diag complete `18`, quote `7`, completed repair `17`, declined `0`, limbo `0`
  - `Liquid Damage`: diag complete `4`, quote `0`, completed repair `2`, declined `0`, limbo `0`
  - `Camera`: diag complete `1`, quote `1`, completed repair `1`, declined `0`, limbo `0`

## 5. Technician Analysis

- `Safan Patel`: volume=`376`, median intake->diag=`1.0d`, detailed write-up rate=`5.1%`, completed-repair conversion=`83.2%`
- `Andreas Egas`: volume=`128`, median intake->diag=`1.0d`, detailed write-up rate=`12.5%`, completed-repair conversion=`94.5%`
- `Misha Kepeshchuk`: volume=`119`, median intake->diag=`1.0d`, detailed write-up rate=`14.3%`, completed-repair conversion=`92.4%`
- `Roni Mykhailiuk`: volume=`19`, median intake->diag=`1.0d`, detailed write-up rate=`15.8%`, completed-repair conversion=`68.4%`
- `Unassigned`: volume=`15`, median intake->diag=`0.0h`, detailed write-up rate=`6.7%`, completed-repair conversion=`86.7%`
- `Client Services`: volume=`4`, median intake->diag=`0.0h`, detailed write-up rate=`0.0%`, completed-repair conversion=`100.0%`
- Safan callout:
  - Volume `376` diagnostics, share of owner-attributed flow `58.2%`, median intake->diag `1.0d`
  - Detailed write-up rate `5.1%`, completed-repair conversion `83.2%`
  - Capacity bottleneck signal: yes; his share is large enough that throughput risk concentrates around him.

## 6. Revenue And Margin Signal

- Converted-to-repair jobs with visible paid value: `169` / `574`
- Average visible repair value on converted diagnostics: `£315.05`
- Diagnostic-only jobs with any visible paid value: `37` / `93`
- Average visible diagnostic-only charge: `£150.19`
- Revenue potential at `+25%` diagnostic volume: visible-value model ≈ `£53,220` incremental over a comparable six-month period, assuming current conversion and fee capture rates hold.
- Revenue potential at `+50%` diagnostic volume: visible-value model ≈ `£106,440` incremental over a comparable six-month period, assuming current conversion and fee capture rates hold.
- This revenue section is directional only because Monday `Paid` is only populated on a subset of jobs.

## 7. Non-Functional Device Analysis

- Non-functional / liquid-damage target diagnostics: `605` of `794` intake-cohort diagnostics (`76.2%`)
- Completed-repair conversion for target diagnostics: `77.9%`
- Completed-repair conversion for standard diagnostics: `93.7%`
- Average visible repair value when target diagnostics convert: `£304.95`
- Common outcomes:
  - `Completed Repair`: `471`
  - `Diagnostic Only / Other`: `81`
  - `BER / Parts`: `19`
  - `Limbo / Awaiting Response`: `19`
  - `Declined / Cancelled`: `15`

