# Research Sources Bibliography
*Compiled 2026-04-11 for iCorrect Apple Silicon MacBook diagnostic research*

---

## Apple Official Sources

### 1. Apple Support KB 108308 — iOS/macOS Update and Restore Errors
- **URL**: https://support.apple.com/en-us/108308
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: Complete error code directory with categories (hardware, USB, security, server). Maps error numbers to troubleshooting categories. Error codes 1-56, 1002-1669, 2001-2009, 3002-3200, 4005-4037. Cross-references to KB 102561 (4005/4013/4014), KB 108304 (error 53), KB 108396 (server errors).
- **Relevance**: **Medium** — Primarily iOS-focused. Error code categories (hardware vs USB vs security) are useful for initial triage but lack board-level root cause detail.
- **Last updated by Apple**: March 31, 2026

### 2. Apple Support KB 102561 — Errors 9, 4005, 4013, 4014
- **URL**: https://support.apple.com/en-us/102561
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: Generic troubleshooting for errors 9, 4005, 4013, 4014. All described as "device disconnected during update or restore". Steps: update macOS/iTunes, force restart, try Update before Restore, try different USB cable/port/computer.
- **Relevance**: **Low** — No board-level insight. Apple's official position is "contact us" if basic steps fail. Useful only as baseline documentation.
- **Last updated by Apple**: August 29, 2023

### 3. Apple Support KB 108304 — Error 53 (Touch ID Pairing)
- **URL**: https://support.apple.com/en-us/108304
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: Error 53 relates to Touch ID sensor pairing. iOS 9.3 provided fix. On Apple Silicon Macs, error 53 manifests differently (FDR failure during logic board DFU restore). If Touch ID didn't work before error 53, service is needed.
- **Relevance**: **Medium** — Important for understanding error 53 on Apple Silicon Macs where it indicates FDR (Factory Data Restore) pairing failure, not just Touch ID.
- **Last updated by Apple**: March 31, 2026

### 4. Apple Support KB 102768 — Mac Status Indicator Light Behavior
- **URL**: https://support.apple.com/en-us/102768
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: SIL patterns for Mac mini, Mac Studio, Mac Pro. Key: rapidly flashing amber or solid amber = firmware recovery mode, needs DFU revive/restore. Flashing white at startup = hardware issue, run Apple Diagnostics.
- **Relevance**: **Medium** — Useful for desktop Mac triage. Limited Apple Silicon laptop applicability (no SIL on MacBooks).
- **Last updated by Apple**: April 12, 2024

### 5. Apple Support KB 108900 — Revive or Restore Mac Firmware
- **URL**: https://support.apple.com/en-us/108900
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: Complete DFU procedures for Apple Silicon and T2 Macs. DFU port identification (KB 120694). Key combo for laptops: Left Ctrl + Left Option + Right Shift + Power. Hold 10s for AS, 3s for T2. Revive vs Restore distinction. Host Mac needs macOS Sonoma 14+. macOS 14+ supports Finder-based DFU (not just Apple Configurator 2). USB-C data+charge cable required (NOT Thunderbolt 3).
- **Relevance**: **High** — Essential reference for DFU procedures. Updated April 2026, includes latest info.
- **Last updated by Apple**: April 06, 2026

### 6. Apple Support KB 102210 — Mac Beeps During Startup
- **URL**: https://support.apple.com/en-us/102210
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: Three beep patterns: one beep/5s (no RAM), three beeps (RAM integrity fail), long tone (firmware restoring). Primarily Intel Mac relevant (user-replaceable RAM).
- **Relevance**: **Low** — Minimal Apple Silicon applicability. Soldered RAM on AS Macs means these beep codes are rare.
- **Last updated by Apple**: March 20, 2025

### 7. Apple Support KB 102550 — Use Apple Diagnostics to Test Your Mac
- **URL**: https://support.apple.com/en-us/102550
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: How to run Apple Diagnostics on Apple Silicon (hold power > Options > Cmd-D) vs Intel (hold D at startup). macOS Tahoe 26 adds ability to choose specific diagnostic tests. References KB 102334 for code meanings.
- **Relevance**: **Medium** — Useful procedural reference. macOS Tahoe 26 diagnostic selection is new info.
- **Last updated by Apple**: December 19, 2025

### 8. Apple Support KB 102334 — Apple Diagnostics Reference Codes
- **URL**: https://support.apple.com/en-us/102334
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: Complete current list of all Apple Diagnostics codes. Found several NEW codes not in older compilations: PPN001-002 (power management), PPM016 (memory), CNT001-007 (Ethernet), CNW009, NDL002, NDR007-008, VDH001/003, VFD008-011, CEH001-002, IMU001, LAS001-004, PPP004-008/017-018/020, PPT021.
- **Relevance**: **High** — Authoritative and up-to-date. Delta between this and older lists reveals new diagnostic capabilities. This is the current source of truth.

---

## Repair Community / Wiki Sources

### 9. The iPhone Wiki — iTunes Errors Database
- **URL**: https://www.theiphonewiki.com/wiki/ITunes_Errors
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: Extensive error code database with community-contributed root causes. Key board-level entries: Error -1 (modem chipset malfunction), Error 23 (baseband processor/water damage), Error 28 (dock connector/memory damage), Error 29 (battery failure), Error 40 (dead NAND confirmed via ASR log), Error 48 (dead baseband chip), Error 53 (Touch ID water damage), Error 56 (dead Touch ID sensor), Error 4013 (generic). Hex error codes for USB communication failures.
- **Relevance**: **Medium** — Primarily iOS/iPhone focused but error code root causes at hardware level translate to understanding Mac restore errors. Error 40 "NAND dead (confirm with ASR output)" is useful diagnostic insight.
- **Note**: Content was truncated at ~20K chars; higher error codes and hex codes section partially captured.

### 10. The Apple Wiki — Restore Errors Database
- **URL**: https://theapplewiki.com/wiki/Restore_Errors
- **Date accessed**: 2026-04-11
- **Accessible**: No (Cloudflare 403 block on direct fetch)
- **What was found** (from search snippets): Lists restore and update errors for iTunes, Finder, Apple Configurator 2, Apple Devices, and third-party MobileDevice tools. Includes DFU Mode article noting macOS 14+ Finder support for Mac DFU. Error Texts subpage exists.
- **Relevance**: **Medium** — Would be high if accessible. Known to have Mac-specific restore error details. Recommend manual browser access.
- **Alternative attempted**: Search results provided DFU Mode and Recovery Mode page snippets.

### 11. LogiWiki — DFU Mode Restore (Macs)
- **URL**: https://logi.wiki/index.php/DFU_Mode_Restore_(Macs)
- **Date accessed**: 2026-04-11
- **Accessible**: No (Cloudflare 403 block on direct fetch)
- **What was found** (from search snippets): Contains case studies of T2 Mac DFU restores. Mentions: "Flashing the T2 ROM, and restoring via DFU resolved the issue" for 820-01700 boards. Documents that SOC_FORCE_DFU signal connects to 1V8_SLPS2R power rail on T2 machines. Notes that almost all boards have pads available for manual DFU mode entry. Keyboard method documented for M1 MacBook Pro/Air.
- **Relevance**: **High** — One of the best community resources for Mac DFU. Cloudflare blocking prevented full extraction. Recommend manual browser access for complete case studies.

### 12. LogiWiki — Apple Hardware Test (AHT) and Apple Diagnostics (AD) Codes
- **URL**: https://logi.wiki/index.php?title=Apple_Hardware_Test_(AHT)_and_Apple_Diagnostics_(AD)_Codes
- **Date accessed**: 2026-04-11
- **Accessible**: No (Cloudflare 403 block)
- **What was found** (from search snippets): Documents that Apple Diagnostics replaces AHT for devices manufactured after 2013. Some older devices load AD instead of AHT with OS update or Option+D download.
- **Relevance**: **High** — Contains community-annotated diagnostic codes with repair-level detail beyond Apple's official descriptions. Recommend manual browser access.

### 13. Rossmann Group Forums — A2442 (820-02098) Error 4041
- **URL**: https://boards.rossmanngroup.com/threads/820-02098-a2442-power-cycling-dfu-restore-error-4041.65420/
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: Detailed case study of M1 Pro MacBook Pro 14" with power cycling and error 4041. Key findings: PP1V2_NAND1 short traced to internally shorted UN500 NAND chip. Five NAND chips normal for 512GB "SSD: 512GB HY" BOM group. Full NAND replacement from donor board required. SPI NOR does not need donor transfer. Successfully restored via DFU in Finder. Upgraded from 512GB to 1TB with AliExpress NANDs. PPBUS_AON voltage cycling documented (12.26V > 11.96V > 6V). NAND voltage measurements provided. Error 4042 seen with bad NAND soldering.
- **Relevance**: **High** — Excellent board-level case study with exact voltages, component references, and successful repair methodology.

### 14. Rossmann Group Forums — A2179 (820-01958) Error 4013
- **URL**: https://boards.rossmanngroup.com/threads/a2179-820-01958-not-turning-on-20v-0-06a-dfu-restore-error-4013.65528/
- **Date accessed**: 2026-04-11
- **Accessible**: Yes (first page only; subsequent pages behind Cloudflare)
- **What was found**: MacBook Air 2020 (Ice Lake) with 20V 0.06A current draw. Error 4013 in recovery, error 4010 intermittently. Apple Configurator log shows "failed to get board config from DFU mode device" and "failed to get board config from recovery mode device" repeatedly. State machine dumps show RestoreOS state failure. SOC_FORCE_DFU pad to ground did not work for bare board DFU entry. Suspected NAND/SSD failure. 2019 model has 2x256GB, 2018 has 2x128GB (not interchangeable).
- **Relevance**: **High** — Documents real-world Apple Configurator error logs that are diagnostic gold for identifying SoC/NAND communication failures.

### 15. Rossmann Group Forums — A2442 (820-02098) No Keyboard/Trackpad
- **URL**: https://boards.rossmanngroup.com/threads/a2442-820-02098-no-keyboard-or-trackpad.64468/
- **Date accessed**: 2026-04-11 (search result only, not full fetch)
- **Accessible**: Partial (search snippet only)
- **What was found**: Thread about A2442 keyboard/trackpad failure. No detailed content extracted.
- **Relevance**: **Low** — Peripheral failure, not core diagnostic.

### 16. iPad Rehab (Jessa Jones) — Error 4013 Analysis
- **URL**: https://www.ipadrehab.com/article.cfm?ArticleNumber=46
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: Critical insight: Error 4013 with Apple logo boot loop on iPad 7 and iPhone 7 is caused by CPU BGA joint failure. Aftermarket chargers can damage CPU beyond typical charger-facing circuitry. CPU is not electrically dead but physically detached. Fix: remove CPU, clean underfill, reball, reattach. CPU transfer to known-good receiver board also works for diagnosis. First noticed early 2021. Tristar tester revealed charge port and USB permission chip damage in some cases.
- **Relevance**: **High** — The CPU reball insight is critical for understanding error 4013 at board level. While demonstrated on A10 devices, the BGA joint failure principle is universal. iPad Rehab's YouTube channel has the surgical procedure documented.

### 17. iFixit Forums — Error 53 on iMac M1 Logic Board Replacement
- **URL**: https://www.ifixit.com/Answers/View/879203/Error+message+(53)+when+attempting+to+restore+new+logic+board
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: Error 53 (AMRestoreErrorDomain error 53 - FDR failure) occurs when DFU restoring third-party replacement logic boards on iMac M1 (A2438). The error specifically mentions "Failed to handle message type StatusMsg (FDR failure)". This is because Apple has bonded Touch ID (Magic Keyboard) with the logic board. Only Apple-sourced boards with access to Apple's proprietary pairing tool can complete FDR. Multiple users confirming identical issue.
- **Relevance**: **High** — Critical for understanding that Apple Silicon desktop logic board replacements require Apple's server-side activation. Third-party boards will ALWAYS fail with error 53 FDR.

### 18. iFixit — Error 53 Fix Confirmation
- **URL**: https://www.ifixit.com/News/7924/error-53-fix
- **Date accessed**: 2026-04-11 (search result only)
- **Accessible**: Not fetched in detail
- **What was found**: Confirmed Apple's iOS 9.3 error 53 fix works by force restarting and restoring via iTunes on devices with non-paired Touch ID sensors.
- **Relevance**: **Low** — iPhone-specific, historical (2016). Not applicable to Apple Silicon Macs.

---

## Badcaps Forum Sources

### 19. Badcaps — A2141 SSD Short (PPBUS_G3H)
- **URL**: https://www.badcaps.net/forum/troubleshooting-hardware-devices-and-electronics-theory/troubleshooting-laptops-tablets-and-mobile-devices/3472524-macbook-pro-a2141-ssd-short
- **Date accessed**: 2026-04-11
- **Accessible**: Yes (first post only visible to non-premium)
- **What was found**: Dead A2141 (820-01700), 5V 0.01A on ammeter. PPBUS_G3H at 0.3V, shorted to ground (~50 ohms, continuity beep). After removing F7000/F7001, got 12V on PPBAT_G3H, confirming short on system side. Injecting 1V to PPBUS_G3H for fault tracing. Key community response (from search snippet): "The usual failure pattern for NAND failure on these is one of the TPS62180 ICs going short and applying PPBUS_G3H directly to the associated NANDs. So you will have a simultaneous short on PPBUS_G3H and the PP2V5 NAND rail."
- **Relevance**: **High** — Documents the critical TPS62180 failure pattern: NAND PMIC shorts internally, sends 12.6V PPBUS directly to 2.5V NAND chips. This is one of the most common board-level faults on T2 MacBook Pros and likely similar on Apple Silicon.

### 20. Badcaps — A2141 Strange macOS Install Issues (NAND/WiFi/Firmware)
- **URL**: https://www.badcaps.net/forum/troubleshooting-hardware-devices-and-electronics-theory/troubleshooting-laptops-tablets-and-mobile-devices/98165-a2141-2019-16-mb-pro-strange-macos-install-issues-nand-wifi-firmware
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: A2141 (820-01700, 1TB) unable to install any macOS after failed Monterey upgrade. DFU revives/restores complete successfully but macOS installation still fails. Board pristine, no liquid damage. SMART status verified. Can boot from external disk perfectly. Diagnostics show no issues. Intermittent success (2 out of many attempts, possibly network related). Install logs show DHCP errors. User suspects firmware/disk encryption issue rather than NAND hardware failure.
- **Relevance**: **High** — Documents a subtle failure mode: NAND that passes basic tests (SMART OK, DFU revive works) but fails during complex multi-stage macOS installation. This is harder to diagnose than outright NAND short. Could indicate marginal NAND cells, firmware corruption, or T2 Secure Enclave state issue.

### 21. Badcaps — A2141 820-01700 SSD Error (NAND Replacement)
- **URL**: https://www.badcaps.net/forum/troubleshooting-hardware-devices-and-electronics-theory/troubleshooting-laptops-tablets-and-mobile-devices/102525-a2141-macbook-pro-16-820-01700-ssd-error
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: Multiple case studies in related threads: (a) 512GB model with 4 shorted NANDs in one wing (U9100-U9400) + 1 bad in other wing (U8600). Used JCID P13 programmer to program replacement NANDs. Replaced TPS62180 SSD power IC. All rails came up (0.9V, 1.8V, 2.5V). (b) Liquid damage under U9200 causing PP2V5_NAND_SSD0 short (1.8 ohm to ground). Removing shorted NAND cleared short. (c) NAND swap requires ALL chips from same donor, same order. Blank OEM NANDs won't work (Apple production tools required for initial programming). (d) Dead MacBook Air M1 A2337 (820-02016) in DFU firmware boot loop. (e) MacBook Pro A2141 with dedicated GPU failure causing install issues.
- **Relevance**: **High** — Rich collection of NAND failure case studies. JCID P13 programmer for NAND programming is a practical repair tool reference. Liquid damage correlation with NAND shorts is well documented.

### 22. Badcaps — Error 75 / APFS Corruption
- **Searched**: "badcaps forum error 75 APFS corruption Apple Mac"
- **Date accessed**: 2026-04-11
- **What was found**: No specific "error 75" threads found on Badcaps. The search term appears to have been a conflation. APFS corruption discussions on Badcaps relate to NAND hardware failures causing filesystem corruption, not a specific "error 75" code.
- **Relevance**: **N/A** — Source as described does not exist. APFS corruption content was found via Rossmann Group instead.

---

## Other Sources

### 23. Mr. Macintosh — Apple Silicon DFU Mode & IPSW Database
- **URL**: https://mrmacintosh.com/restore-macos-firmware-on-an-apple-silicon-mac-boot-to-dfu-mode/
- **Date accessed**: 2026-04-11
- **Accessible**: No (Cloudflare 403 block)
- **What was found** (from search snippets): DFU mode procedures for Apple Silicon. IPSW firmware database at https://mrmacintosh.com/apple-silicon-m1-full-macos-restore-ipsw-firmware-files-database/ includes IPSW file sizes, signing status, release dates for all M1/M2/M3/M4/M5 firmware files. BridgeOS restore guide at https://mrmacintosh.com/how-to-restore-bridgeos-on-a-t2-mac-how-to-put-a-mac-into-dfu-mode/ covers T2 DFU procedures.
- **Relevance**: **High** — Best community resource for IPSW firmware files and DFU procedures. Cloudflare blocking prevented full extraction. Recommend manual browser access.

### 24. Rossmann Group — MacBook Power Surge SSD Recovery
- **URL**: https://rossmanngroup.com/problems/macbook-ssd-power-surge-recovery
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: Detailed technical article on power surge damage path: USB-C > CD3217 > PMIC > subsystem rails > NAND. CD3217 fails first (sacrificial). PMIC absorbs overvoltage before NAND. Three-reading USB-C ammeter diagnostic (5V stuck, 20V high current, healthy boot). Direct lightning vs indirect surge comparison. Board-level repair methodology: inject voltage to PPBUS_G3H, FLIR thermal imaging, component replacement. Why chip-off doesn't work on T2/M-series. Do NOT attempt Apple Configurator DFU restore on surge-damaged boards (can wipe APFS volume). Do NOT try different charger (problem is board, not charger).
- **Relevance**: **High** — Excellent technical reference for power surge diagnosis. The CD3217 > PMIC > NAND failure cascade and the three ammeter readings are immediately actionable diagnostic knowledge.

### 25. Rossmann Group — APFS Partition Corruption Recovery
- **URL**: https://rossmanngroup.com/problems/apfs-partition-corruption-recovery
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: Deep technical article on APFS internals: Container Superblock (NXSB), Object Map (OMAP), Checkpoint Descriptor Area, Space Manager. Maps APFS errors to root causes: "overallocation" = Spaceman desync, "fsroot tree invalid" = incomplete Checkpoint, "volume could not be verified" = OMAP corruption. Board-level causes: NAND power rail voltage drops during writes, NAND wear/read disturb, power loss during macOS updates. Critical warnings: don't run First Aid more than once, don't use Target Disk Mode for scanning, don't reformat (TRIM erases blocks permanently). T2/M-series encryption means board must work for any recovery. Detailed recovery process: board triage > NAND image > APFS metadata reconstruction > Checkpoint rollback.
- **Relevance**: **High** — Best single resource for understanding APFS corruption at board level. The connection between voltage rail faults and APFS corruption is rarely documented elsewhere.

### 26. Rossmann Group — M1/M2/M3/M4 Mac Data Recovery
- **URL**: https://rossmanngroup.com/services/ssd-data-recovery/macbook/m-series-soldered-nand-recovery
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: Comprehensive overview of Apple Silicon data recovery. Diagnostic methodology: bench PSU current profiling, FLIR thermal localization, schematic-guided repair. Common failure table: CD3217 stuck at 5V (TPS62180 also mentioned for A2442/820-02098), shorted caps on PMIC rails, corrupt iBoot (DFU Revive caution), liquid damage corrosion, failing NAND BGA joints. Confirms M3 and M4 affected devices list. Key insight: repair only needs SoC initialization for data recovery, not full board function.
- **Relevance**: **High** — Best overview of Apple Silicon diagnostic methodology with specific component failure mapping.

### 27. ToptekSystem — Apple Diagnostics Reference Codes
- **URL**: https://www.topteksystem.com/blog/reference-codes-of-apple-diagnostics/
- **Date accessed**: 2026-04-11
- **Accessible**: Yes
- **What was found**: Complete Apple Diagnostics code compilation. Cross-referenced against Apple's official KB 102334 to identify deltas. ToptekSystem list is based on an older version of Apple's documentation. Missing newer codes: PPN series, PPP004-008/017-018/020, PPT021, CNT series, CNW009, NDL002, NDR007-008, VDH001/003, VFD008-011, CEH series, IMU001, LAS series.
- **Relevance**: **Medium** — Useful as a baseline but outdated compared to Apple's current list. The delta analysis between this and KB 102334 is the real value (identifying newly added diagnostic capabilities).

### 28. Repair Wiki — MacBook Pro A2338 Not Turning On (0-0.05A at 5V)
- **URL**: https://repair.wiki/w/MacBook_Pro_A2338_Not_turning_on,_0.00_-_0.05A_current_draw_at_5V_repair
- **Date accessed**: 2026-04-11
- **Accessible**: No (Cloudflare 403 block)
- **What was found** (from search snippet): MacBook Pro M1 (A2338) with 0-0.05A current draw at 5V, no boot. Repair wiki format with structured diagnostic steps.
- **Relevance**: **High** — Would contain structured diagnostic tree for M1 no-power fault. Recommend manual browser access.

### 29. Apple Community — MacBook Pro M4 Max APFS UUID Corruption
- **URL**: https://discussions.apple.com/thread/256093138
- **Date accessed**: 2026-04-11 (search snippet only)
- **Accessible**: Not fetched in detail
- **What was found**: M4 Max APFS UUID corruption case. Community response notes: "Those two required hidden APFS Containers are protected from modification by macOS. If they happen to be corrupted or destroyed, then a DFU Firmware Restore is the only way to restore any type of booting on an M-series Mac."
- **Relevance**: **Medium** — Confirms that hidden APFS containers on M-series can only be fixed via DFU restore. M4 Max specific case is valuable given our M3/M4 gap.

### 30. Rossmann Group Store — TPS62180 Part Listing
- **URL**: https://store.rossmanngroup.com/zd4-tps62180.html
- **Date accessed**: 2026-04-11 (search result only)
- **Accessible**: Not fetched
- **What was found**: TPS62180 available as replacement part. Used in positions U9580, U9080, U6960, U6903, UA900, UG800 across various board models.
- **Relevance**: **Medium** — Confirms part availability and board position designators.

### 31. GitHub — SimpleMacRestore (Linux-based DFU Restore Tool)
- **URL**: https://github.com/mrrabyss/SimpleMacRestore
- **Date accessed**: 2026-04-11 (search result only)
- **Accessible**: Not fetched in detail
- **What was found**: Open-source tool to restore Apple Silicon Macs (M1-M5) using a Linux computer instead of another Mac. Downloads IPSW and communicates with Mac in DFU mode.
- **Relevance**: **Low** — Niche tool. Standard procedure uses another Mac. Could be useful if no second Mac is available.

---

## Sources NOT Found / Inaccessible

### Badcaps Forum — Error 75 APFS Corruption Analysis
- **Searched for**: "error 75 APFS corruption" on Badcaps
- **Result**: No specific "error 75" threads found. Error 75 does not appear to be a standard Apple restore error code. The original research brief may have been referring to APFS corruption generally, which IS well-documented on Badcaps in the context of NAND hardware failures.

### LogiWiki — Apple Diagnostics Codes (Full Page)
- **URL**: https://logi.wiki/index.php?title=Apple_Hardware_Test_(AHT)_and_Apple_Diagnostics_(AD)_Codes
- **Result**: Cloudflare 403 on all attempts. Known to contain community-annotated diagnostic codes with repair-level detail beyond Apple's official descriptions.

### LogiWiki — DFU Mode Restore (Macs) (Full Page)
- **URL**: https://logi.wiki/index.php/DFU_Mode_Restore_(Macs)
- **Result**: Cloudflare 403 on all attempts. Search snippets indicate valuable T2 and Apple Silicon case studies with board numbers.

### LogiWiki — MacBook NAND List
- **URL**: https://logi.wiki/index.php/MacBook_NAND_List
- **Result**: Not fetched. Listed in search results. Would contain NAND chip models by board number.

### The Apple Wiki — Restore Errors (Full Page)
- **URL**: https://theapplewiki.com/wiki/Restore_Errors
- **Result**: Cloudflare 403. Known to be the most comprehensive restore error database.

### Mr. Macintosh — Full DFU Articles
- **URLs**: Multiple mrmacintosh.com pages
- **Result**: Cloudflare 403 on direct fetch. Search snippets provided key information.

### Repair Wiki — MacBook Diagnostic Pages
- **URL**: https://repair.wiki/w/MacBook_Pro_A2338_Not_turning_on,_0.00_-_0.05A_current_draw_at_5V_repair
- **Result**: Cloudflare 403. Would contain structured diagnostic trees.

---

## Summary: Source Quality Ranking

### Tier 1 (High relevance, accessible, detailed board-level content)
1. Rossmann Group website (power surge, APFS, M-series recovery pages)
2. Rossmann Group Forums (A2442 error 4041, A2179 error 4013 threads)
3. Badcaps Forum (A2141 SSD short, NAND failure patterns)
4. iPad Rehab (error 4013 CPU reball analysis)
5. Apple Support KB 108900 (DFU procedures)
6. Apple Support KB 102334 (Diagnostics reference codes)

### Tier 2 (High relevance, partially accessible)
7. LogiWiki (DFU, diagnostics, NAND list — Cloudflare blocked)
8. The Apple Wiki (Restore Errors — Cloudflare blocked)
9. Mr. Macintosh (IPSW database, DFU guides — Cloudflare blocked)
10. Repair Wiki (diagnostic trees — Cloudflare blocked)
11. iFixit Forums (Error 53 FDR failure on iMac M1)

### Tier 3 (Medium relevance)
12. The iPhone Wiki (iTunes Errors — iOS focused but hardware root causes useful)
13. ToptekSystem (Diagnostics codes — outdated vs Apple's current list)
14. Apple Support KB 108308 (Error directory — no board-level detail)

### Tier 4 (Low relevance for Apple Silicon MacBook work)
15. Apple Support KB 102561 (Generic troubleshooting)
16. Apple Support KB 102210 (Beep codes — Intel focused)
17. Apple Support KB 108304 (Error 53 — iPhone focused)
