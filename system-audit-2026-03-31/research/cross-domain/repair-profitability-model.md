# Retail Repair Profitability Model

Generated: `2026-04-02T16:39:32Z`

## Overview

- Products analysed: `1270`
- Parts analysed: `1802`
- Completed repair records with usable timing: `1991`
- Completed repair records excluded for missing timing: `231`
- Products with no parts linkage: `432`
- Products with fewer than 3 completed repairs in the timing sample: `907`
- Products included in headline margin rankings (linked parts + >=3 repairs): `338`

## Methodology

- Live Monday pull completed on `2026-04-02T16:39:32Z` using boards `2477699024`, `985177480`, and `349212843`.
- Product mapping uses the Products & Pricing board `Parts` relation (`connect_boards8`) and is backfilled with the Parts board reverse `Products Index` relation where needed.
- Repair timing uses completed main-board items with status in `Ready To Collect, Repaired, Returned, Shipped` and repair type in `Board Level, Diagnostic, No Fault Found, Parts, Repair`.
- Repair duration is measured from the `Received` date column `changed_at` timestamp, with fallback to `Intake Timestamp`, then `Booking Time` if `Received` is blank.
- Repair completion is measured from `Date Repaired` (`collection_date`) `changed_at`, with fallback to `Repaired` (`date_mkwdan7z`) if needed.
- Product labour time uses up to the 10 most recent completed repairs, prioritising exact `Requested Repairs` links from the main board, then supplementing with repairs linked via the product's part(s).
- Per-part timing uses up to the 10 most recent completed repairs from the Parts board `Repairs` relation.
- Headline top/bottom margin rankings only include products with linked parts and at least 3 completed repairs.
- Labour rate is `£24.00` per hour. Payment fee estimate is `2%` of inc-VAT price.
- iPhone screen products add `1` extra refurb hour (`£24.00`) on top of historical repair labour.

## Summary By Device Category

| Category | Products | Avg Price ex VAT | Avg Margin % | Review Pricing | Healthy | Incomplete |
| --- | --- | --- | --- | --- | --- | --- |
| MacBook | 262 | £201.75 | -4066.6% | 113 | 6 | 140 |
| iPhone | 594 | £95.76 | -1549.8% | 228 | 147 | 172 |
| iPad | 193 | £124.29 | -2527.0% | 102 | 35 | 55 |
| Apple Watch | 196 | £121.65 | -4314.9% | 51 | 76 | 63 |
| Other | 25 | £61.76 | -1073.2% | 9 | 4 | 9 |

## Top 10 Highest Margin Products

| Device | Product | Net Profit | Margin % | Repairs Used | Flag |
| --- | --- | --- | --- | --- | --- |
| iPhone 13 Mini | iPhone 13 Mini Rear Camera Lens | £44.03 | 59.4% | 4 | watch |
| iPhone 11 | iPhone 11 Earpiece Speaker | £37.67 | 57.2% | 3 | watch |
| iPhone 15 Pro | iPhone 15 Pro Aftermarket Screen | £137.15 | 48.5% | 10 | watch |
| iPhone 13 | iPhone 13 Charging Port | £35.50 | 47.9% | 10 | watch |
| iPhone 14 Pro Max | iPhone 14 Pro Max Rear Camera Lens | £39.27 | 47.6% | 6 | watch |
| iPhone 15 Pro Max | iPhone 15 Pro Max Aftermarket Screen | £141.98 | 47.5% | 5 | watch |
| iPhone 13 | iPhone 13 Microphone | £33.73 | 45.5% | 3 | watch |
| iPhone 13 Mini | iPhone 13 Mini Battery | £26.36 | 35.5% | 10 | review pricing |
| iPhone 12 Pro | iPhone 12 Pro Rear Camera | £27.31 | 25.4% | 4 | review pricing |
| iPhone 13 Pro Max | iPhone 13 Pro Max Battery | £16.41 | 24.9% | 6 | review pricing |

## Top 10 Lowest Margin Products

| Device | Product | Net Profit | Margin % | Repairs Used | Flag |
| --- | --- | --- | --- | --- | --- |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Diagnostic | £-27,668.29 | -67759.1% | 10 | review pricing |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Diagnostic | £-24,102.63 | -59026.9% | 4 | review pricing |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Diagnostic | £-18,383.30 | -45020.3% | 3 | review pricing |
| iPhone 11 | iPhone 11 Diagnostic | £-16,664.49 | -40811.0% | 10 | review pricing |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Diagnostic | £-14,309.35 | -35043.3% | 10 | review pricing |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Diagnostic | £-13,606.02 | -33320.9% | 6 | review pricing |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Diagnostic | £-12,345.76 | -30234.5% | 3 | review pricing |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Diagnostic | £-11,730.38 | -28727.5% | 8 | review pricing |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Diagnostic | £-10,632.42 | -26038.6% | 5 | review pricing |
| iPhone 13 Mini | iPhone 13 Mini Diagnostic | £-9,801.67 | -24004.1% | 8 | review pricing |

## Negative Or Near-Zero Margin Products

_Near-zero is defined here as margin at or below 10% of ex-VAT selling price._

| Device | Product | Net Profit | Margin % | Repairs Used | Flag |
| --- | --- | --- | --- | --- | --- |
| Apple Watch Ultra | Apple Watch Ultra Diagnostic | £-53,037.94 | -334976.4% | 1 | review pricing |
| iPad Pro 13 (7G) | iPad Pro 13 (7G) Diagnostic | £-32,961.72 | -80722.6% | 2 | review pricing |
| Apple Watch S4 40mm | Apple Watch S4 40mm Diagnostic | £-11,928.86 | -75340.1% | 1 | review pricing |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Diagnostic | £-27,668.29 | -67759.1% | 10 | review pricing |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Diagnostic | £-24,102.63 | -59026.9% | 4 | review pricing |
| Apple Watch S7 45MM | Apple Watch S7 45MM Side Button | £-53,467.12 | -53916.4% | 1 | review pricing |
| iPhone 16 Pro | iPhone 16 Pro Diagnostic | £-20,567.39 | -50369.1% | 1 | incomplete data |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Diagnostic | £-7,361.42 | -46493.2% | 2 | incomplete data |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Diagnostic | £-18,383.30 | -45020.3% | 3 | review pricing |
| iPhone 11 | iPhone 11 Diagnostic | £-16,664.49 | -40811.0% | 10 | review pricing |
| Apple Watch S4 44mm | Apple Watch S4 44mm Diagnostic | £-6,208.51 | -39211.6% | 1 | review pricing |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Diagnostic | £-14,309.35 | -35043.3% | 10 | review pricing |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Diagnostic | £-13,606.02 | -33320.9% | 6 | review pricing |
| iPad Mini 6 | iPad Mini 6 Diagnostic | £-12,871.62 | -31522.3% | 2 | review pricing |
| Apple Watch S7 41MM | Apple Watch S7 41MM Diagnostic | £-4,972.37 | -31404.4% | 1 | review pricing |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Diagnostic | £-12,345.76 | -30234.5% | 3 | review pricing |
| Apple Watch S8 41MM | Apple Watch S8 41MM Heart Rate Monitor | £-52,963.93 | -29021.3% | 1 | review pricing |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Diagnostic | £-11,730.38 | -28727.5% | 8 | review pricing |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Diagnostic | £-10,632.42 | -26038.6% | 5 | review pricing |
| MacBook Air 13 M4 A3240 | MacBook Air 13 M4 A3240 Diagnostic | £-10,125.39 | -24796.9% | 5 | incomplete data |
| iPhone 13 Mini | iPhone 13 Mini Diagnostic | £-9,801.67 | -24004.1% | 8 | review pricing |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Diagnostic | £-9,180.57 | -22483.0% | 8 | review pricing |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Diagnostic | £-9,038.94 | -22136.2% | 3 | review pricing |
| Apple Watch S5 44mm | Apple Watch S5 44mm Diagnostic | £-3,378.76 | -21339.6% | 1 | review pricing |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Diagnostic | £-8,553.30 | -20946.9% | 3 | review pricing |
| Apple Watch SE 40mm | Apple Watch SE 40mm Diagnostic | £-2,839.95 | -17936.5% | 1 | review pricing |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Diagnostic | £-7,094.67 | -17374.7% | 8 | review pricing |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Diagnostic | £-7,072.87 | -17321.3% | 4 | review pricing |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Diagnostic | £-7,027.17 | -17209.4% | 10 | review pricing |
| iPhone 15 Pro Max | iPhone 15 Pro Max Diagnostic | £-6,793.60 | -16637.4% | 6 | incomplete data |
| iPhone 12 Pro Max | iPhone 12 Pro Max Diagnostic | £-6,618.38 | -16208.3% | 4 | review pricing |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) Diagnostic | £-6,472.58 | -15851.2% | 5 | review pricing |
| iPhone 12 | iPhone 12 Diagnostic | £-6,388.48 | -15645.3% | 10 | review pricing |
| iPhone X | iPhone X NO SERVICE (LOGIC BOARD REPAIR) | £-14,078.22 | -15358.1% | 10 | review pricing |
| iPhone X | iPhone X NO WIFI (LOGIC BOARD REPAIR) | £-14,078.22 | -15358.1% | 10 | review pricing |
| iPhone X | iPhone X UNABLE TO ACTIVATE | £-14,078.22 | -15358.1% | 10 | review pricing |
| iPhone XR | iPhone XR NO SERVICE (LOGIC BOARD REPAIR) | £-14,078.22 | -15358.1% | 10 | review pricing |
| iPhone XR | iPhone XR NO WIFI (LOGIC BOARD REPAIR) | £-14,078.22 | -15358.1% | 10 | review pricing |
| iPhone XR | iPhone XR UNABLE TO ACTIVATE | £-14,078.22 | -15358.1% | 10 | review pricing |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Diagnostic | £-6,136.74 | -15028.8% | 9 | review pricing |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Diagnostic | £-6,029.08 | -14765.1% | 10 | review pricing |
| iPhone 11 | iPhone 11 NO SERVICE (LOGIC BOARD REPAIR) | £-14,070.09 | -14070.1% | 10 | review pricing |
| iPhone 11 | iPhone 11 NO WIFI (LOGIC BOARD REPAIR) | £-14,070.09 | -14070.1% | 10 | review pricing |
| iPhone 11 | iPhone 11 UNABLE TO ACTIVATE | £-14,070.09 | -14070.1% | 10 | review pricing |
| iPhone XS | iPhone XS NO SERVICE (LOGIC BOARD REPAIR) | £-14,070.09 | -14070.1% | 10 | review pricing |
| iPhone XS | iPhone XS NO WIFI (LOGIC BOARD REPAIR) | £-14,070.09 | -14070.1% | 10 | review pricing |
| iPhone XS | iPhone XS UNABLE TO ACTIVATE | £-14,070.09 | -14070.1% | 10 | review pricing |
| iPhone XS Max | iPhone XS Max NO SERVICE (LOGIC BOARD REPAIR) | £-14,070.09 | -14070.1% | 10 | review pricing |
| iPhone XS Max | iPhone XS Max NO WIFI (LOGIC BOARD REPAIR) | £-14,070.09 | -14070.1% | 10 | review pricing |
| iPhone XS Max | iPhone XS Max UNABLE TO ACTIVATE | £-14,070.09 | -14070.1% | 10 | review pricing |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Charging Port | £-18,440.34 | -13917.2% | 3 | incomplete data |
| MacBook 12 A1534 | MacBook 12 A1534 Diagnostic | £-5,641.58 | -13816.1% | 2 | review pricing |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Diagnostic | £-5,637.91 | -13807.1% | 10 | incomplete data |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Charging Port | £-17,061.31 | -13740.7% | 1 | incomplete data |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Diagnostic | £-5,518.34 | -13514.3% | 6 | review pricing |
| iPhone 14 | iPhone 14 Diagnostic | £-5,369.67 | -13150.2% | 8 | review pricing |
| iPhone 14 Pro | iPhone 14 Pro Diagnostic | £-5,352.86 | -13109.0% | 10 | review pricing |
| iPad Air 6 (11) | iPad Air 6 (11) Diagnostic | £-5,162.54 | -12643.0% | 1 | review pricing |
| iPhone 8 | iPhone 8 Microphone | £-6,183.74 | -12577.1% | 4 | review pricing |
| iPhone SE2 | iPhone SE2 Microphone | £-6,183.74 | -12577.1% | 4 | review pricing |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Diagnostic | £-5,114.38 | -12525.0% | 10 | review pricing |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Diagnostic | £-5,027.35 | -12311.9% | 10 | review pricing |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Keyboard | £-29,647.34 | -12310.3% | 7 | review pricing |
| iPad Air 5 | iPad Air 5 Diagnostic | £-4,627.06 | -11331.6% | 4 | review pricing |
| iPad 10 | iPad 10 Diagnostic | £-4,591.79 | -11245.2% | 1 | review pricing |
| iPhone XS | iPhone XS Diagnostic | £-4,514.70 | -11056.4% | 2 | review pricing |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Diagnostic | £-4,508.62 | -11041.5% | 10 | incomplete data |
| Apple Watch S4 40mm | Apple Watch S4 40mm Battery | £-11,853.69 | -11026.7% | 1 | review pricing |
| iPhone 8 Plus | iPhone 8 Plus Diagnostic | £-4,496.03 | -11010.7% | 2 | review pricing |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Diagnostic | £-4,418.33 | -10820.4% | 10 | review pricing |
| iPhone SE3 | iPhone SE3 Microphone | £-6,175.61 | -10740.2% | 4 | review pricing |
| iPad 5 | iPad 5 Diagnostic | £-4,367.58 | -10696.1% | 1 | review pricing |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Diagnostic | £-4,354.78 | -10664.8% | 10 | review pricing |
| iPhone 11 Pro | iPhone 11 Pro NO SERVICE (LOGIC BOARD REPAIR) | £-14,037.55 | -10528.2% | 10 | review pricing |
| iPhone 11 Pro | iPhone 11 Pro NO WIFI (LOGIC BOARD REPAIR) | £-14,037.55 | -10528.2% | 10 | review pricing |
| iPhone 11 Pro | iPhone 11 Pro UNABLE TO ACTIVATE | £-14,037.55 | -10528.2% | 10 | review pricing |
| iPhone 11 Pro Max | iPhone 11 Pro Max NO SERVICE (LOGIC BOARD REPAIR) | £-14,037.55 | -10528.2% | 10 | review pricing |
| iPhone 11 Pro Max | iPhone 11 Pro Max NO WIFI (LOGIC BOARD REPAIR) | £-14,037.55 | -10528.2% | 10 | review pricing |
| iPhone 11 Pro Max | iPhone 11 Pro Max UNABLE TO ACTIVATE | £-14,037.55 | -10528.2% | 10 | review pricing |
| iPhone SE3 | iPhone SE3 Rear Camera Lens | £-4,944.81 | -10057.2% | 1 | review pricing |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Diagnostic | £-1,586.70 | -10021.3% | 1 | incomplete data |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Charging Port | £-8,086.48 | -9801.8% | 1 | incomplete data |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Diagnostic | £-3,959.90 | -9697.7% | 5 | review pricing |
| iPad 8 | iPad 8 Diagnostic | £-3,939.75 | -9648.4% | 2 | review pricing |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Diagnostic | £-3,904.19 | -9561.3% | 7 | review pricing |
| iPhone 8 | iPhone 8 Charging Port | £-4,682.71 | -9524.2% | 6 | review pricing |
| iPad 9 | iPad 9 Battery | £-10,999.68 | -9496.1% | 4 | review pricing |
| iPhone 12 | iPhone 12 NO SERVICE (LOGIC BOARD REPAIR) | £-14,021.29 | -9347.5% | 10 | review pricing |
| iPhone 12 | iPhone 12 NO WIFI (LOGIC BOARD REPAIR) | £-14,021.29 | -9347.5% | 10 | review pricing |
| iPhone 12 | iPhone 12 UNABLE TO ACTIVATE | £-14,021.29 | -9347.5% | 10 | review pricing |
| iPhone 12 Mini | iPhone 12 Mini NO SERVICE (LOGIC BOARD REPAIR) | £-14,021.29 | -9347.5% | 10 | review pricing |
| iPhone 12 Mini | iPhone 12 Mini NO WIFI (LOGIC BOARD REPAIR) | £-14,021.29 | -9347.5% | 10 | review pricing |
| iPhone 12 Mini | iPhone 12 UNABLE TO ACTIVATE | £-14,021.29 | -9347.5% | 10 | review pricing |
| iPad Pro 10.5 | iPad Pro 10.5 Diagnostic | £-3,684.21 | -9022.6% | 4 | review pricing |
| iPhone 14 Plus | iPhone 14 Plus Diagnostic | £-3,665.63 | -8977.0% | 5 | review pricing |
| iPad Air 4 | iPad Air 4 Diagnostic | £-3,665.07 | -8975.7% | 8 | review pricing |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Charging Port | £-14,825.11 | -8939.8% | 1 | incomplete data |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Diagnostic | £-3,480.00 | -8522.4% | 10 | incomplete data |
| iPhone 12 Pro | iPhone 12 Pro NO SERVICE (LOGIC BOARD REPAIR) | £-14,005.02 | -8403.0% | 10 | review pricing |
| iPhone 12 Pro | iPhone 12 Pro NO WIFI (LOGIC BOARD REPAIR) | £-14,005.02 | -8403.0% | 10 | review pricing |
| iPhone 12 Pro | iPhone 12 Pro UNABLE TO ACTIVATE | £-14,005.02 | -8403.0% | 10 | review pricing |
| iPhone 12 Pro Max | iPhone 12 Pro Max NO SERVICE (LOGIC BOARD REPAIR) | £-14,005.02 | -8403.0% | 10 | review pricing |
| iPhone 12 Pro Max | iPhone 12 Pro Max NO WIFI (LOGIC BOARD REPAIR) | £-14,005.02 | -8403.0% | 10 | review pricing |
| iPhone 12 Pro Max | iPhone 12 Pro Max UNABLE TO ACTIVATE | £-14,005.02 | -8403.0% | 10 | review pricing |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Diagnostic | £-3,419.82 | -8375.1% | 7 | review pricing |
| iPhone 8 | iPhone 8 Diagnostic | £-3,377.73 | -8272.0% | 1 | review pricing |
| Other Device, iPhone 15 Pro | iPhone 15 Pro Diagnostic | £-3,330.21 | -8155.6% | 7 | incomplete data |
| Apple Watch S6 44mm | Apple Watch S6 44mm Diagnostic | £-1,286.29 | -8123.9% | 1 | review pricing |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Touch Bar | £-16,817.67 | -8104.9% | 2 | incomplete data |
| Apple Watch S4 40mm | Apple Watch S4 40mm Rear Housing | £-11,799.72 | -7910.4% | 1 | review pricing |
| iPhone SE3 | iPhone SE3 Original Apple Screen Assembly | £-9,692.10 | -7805.7% | 1 | incomplete data |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Diagnostic | £-3,168.86 | -7760.5% | 3 | review pricing |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Diagnostic | £-3,134.04 | -7675.2% | 2 | incomplete data |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Diagnostic | £-3,103.67 | -7600.8% | 7 | review pricing |
| Apple Watch S4 44mm | Apple Watch S4 44mm Battery | £-7,995.42 | -7437.6% | 1 | review pricing |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Battery | £-8,980.45 | -7232.6% | 10 | review pricing |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Diagnostic | £-2,947.69 | -7218.8% | 1 | review pricing |
| iPod Touch 6th Gen | iPod Touch 6th Gen Charging IC | £-7,203.87 | -7203.9% | 4 | review pricing |
| iPod Touch 7th Gen | iPod Touch 7th Gen Charging IC | £-7,203.87 | -7203.9% | 4 | review pricing |
| iPhone SE2 | iPhone SE2 Charging Port | £-3,511.34 | -7141.7% | 7 | review pricing |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Diagnostic | £-2,908.43 | -7122.7% | 2 | review pricing |
| iPhone XR | iPhone XR Diagnostic | £-2,906.23 | -7117.3% | 4 | review pricing |
| iPad 7 | iPad 7 Display Screen | £-5,803.13 | -7034.1% | 9 | review pricing |
| iPhone 15 | iPhone 15 Diagnostic | £-2,871.45 | -7032.1% | 4 | review pricing |
| iPhone 11 | iPhone 11 Battery | £-5,153.04 | -6947.9% | 10 | review pricing |
| iPad 9 | iPad 9 Diagnostic | £-2,818.99 | -6903.7% | 10 | review pricing |
| iPhone 13 Pro Max | iPhone 13 Pro Max Diagnostic | £-2,817.71 | -6900.5% | 9 | review pricing |
| iPad 6 | iPad 6 Diagnostic | £-2,781.55 | -6811.9% | 2 | review pricing |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Battery | £-7,861.24 | -6786.7% | 1 | incomplete data |
| iPhone SE3 | iPhone SE3 Charging Port | £-3,850.54 | -6696.6% | 7 | review pricing |
| iPhone 14 Pro Max | iPhone 14 Pro Max Diagnostic | £-2,521.92 | -6176.1% | 10 | review pricing |
| iPhone 12 | iPhone 12 Mute Button | £-3,975.05 | -6038.1% | 1 | review pricing |
| iPhone 12 | iPhone 12 Volume Button | £-3,975.05 | -6038.1% | 1 | review pricing |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Charging Port | £-7,400.63 | -5960.2% | 1 | incomplete data |
| iPad 8 | iPad 8 Display Screen | £-5,786.86 | -5835.5% | 9 | review pricing |
| iPhone 11 | iPhone 11 Rear Housing (Rear Glass And Frame) | £-6,673.73 | -5761.5% | 4 | review pricing |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Keyboard | £-15,750.10 | -5744.7% | 7 | review pricing |
| iPhone 11 | iPhone 11 Screen | £-4,708.87 | -5184.1% | 10 | review pricing |
| iPhone 15 Pro Max | iPhone 15 Pro Max Battery | £-4,185.28 | -5073.1% | 2 | review pricing |
| iPhone 12 | iPhone 12 Battery | £-3,637.70 | -4904.8% | 10 | review pricing |
| iPad Mini 3 | iPad Mini 3 Glass Screen | £-4,005.85 | -4855.6% | 1 | incomplete data |
| iPhone SE2 | iPhone SE2 Diagnostic | £-1,972.74 | -4831.2% | 5 | review pricing |
| iPad 8 | iPad 8 Battery | £-5,531.67 | -4775.5% | 3 | review pricing |
| MacBook 12 A1534 | MacBook 12 A1534 Screen | £-13,815.67 | -4750.4% | 2 | incomplete data |
| iPad 9 | iPad 9 Display Screen | £-5,854.22 | -4714.8% | 10 | review pricing |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Display Screen | £-15,524.98 | -4669.2% | 1 | review pricing |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Diagnostic | £-1,889.96 | -4628.5% | 3 | review pricing |
| iPhone 15 Pro Max | iPhone 15 Pro Max Rear Glass | £-10,732.58 | -4616.2% | 3 | review pricing |
| iPhone 12 Pro | iPhone 12 Pro Diagnostic | £-1,866.82 | -4571.8% | 5 | review pricing |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Trackpad | £-7,549.87 | -4552.7% | 3 | review pricing |
| iPhone 13 Pro | iPhone 13 Pro Diagnostic | £-1,850.06 | -4530.8% | 7 | review pricing |
| iPad 5 | iPad 5 Charging Port | £-2,929.85 | -4450.4% | 3 | review pricing |
| iPhone 13 | iPhone 13 Diagnostic | £-1,792.39 | -4389.5% | 10 | review pricing |
| iPhone SE3 | iPhone SE3 Rear Housing (Rear Glass And Frame) | £-4,668.60 | -4342.9% | 10 | review pricing |
| iPad Pro 10.5 | iPad Pro 10.5 Battery | £-5,357.13 | -4314.5% | 2 | review pricing |
| MacBook Air 13 M4 A3240 | MacBook Air 13 M4 A3240 Keyboard | £-10,719.05 | -4302.0% | 2 | incomplete data |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Diagnostic | £-1,745.89 | -4275.6% | 2 | review pricing |
| iPhone 15 | iPhone 15 Charging Port | £-5,242.45 | -4222.1% | 1 | incomplete data |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Charging Port | £-5,209.23 | -4195.4% | 6 | review pricing |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Diagnostic | £-1,680.89 | -4116.5% | 2 | incomplete data |
| iPhone 14 Pro | iPhone 14 Pro Battery | £-2,658.77 | -4038.6% | 10 | review pricing |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Battery | £-5,008.00 | -4033.3% | 9 | review pricing |
| Apple Watch S8 45MM | Apple Watch S8 45MM Battery | £-4,989.48 | -4018.4% | 1 | review pricing |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Display Screen | £-6,617.59 | -3990.5% | 1 | incomplete data |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Charging Port | £-4,855.61 | -3910.6% | 7 | review pricing |
| iPhone 7 Plus | iPhone 7 Plus Diagnostic | £-1,593.81 | -3903.2% | 1 | review pricing |
| iPhone 13 Pro Max | iPhone 13 Pro Max Rear Camera Lens | £-2,893.38 | -3901.2% | 1 | review pricing |
| iPhone 11 Pro Max | iPhone 11 Pro Max Diagnostic | £-1,571.32 | -3848.1% | 4 | review pricing |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Charging Port | £-6,311.71 | -3806.1% | 3 | incomplete data |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Battery | £-5,674.59 | -3804.2% | 6 | review pricing |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Diagnostic | £-1,506.23 | -3688.7% | 1 | review pricing |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Screen | £-18,384.88 | -3683.1% | 10 | review pricing |
| iPhone 12 Pro | iPhone 12 Pro Power Button | £-2,405.81 | -3654.4% | 1 | review pricing |
| iPad 8 | iPad 8 Glass Screen | £-4,495.38 | -3620.4% | 10 | review pricing |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Charging Port | £-5,882.98 | -3547.5% | 2 | incomplete data |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Screen | £-8,754.31 | -3513.4% | 10 | review pricing |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) Battery | £-4,593.78 | -3467.0% | 2 | review pricing |
| iPad Air 4 | iPad Air 4 Battery | £-4,261.29 | -3431.9% | 5 | review pricing |
| iPad Air 5 | iPad Air 5 Glass Screen | £-5,634.01 | -3397.4% | 2 | incomplete data |
| iPhone SE3 | iPhone SE3 Volume Button | £-1,668.56 | -3393.7% | 1 | review pricing |
| iPad 6 | iPad 6 Charging Port | £-2,150.26 | -3266.2% | 2 | review pricing |
| iPhone XR | iPhone XR Battery | £-2,411.82 | -3251.9% | 3 | review pricing |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Battery | £-5,367.16 | -3236.5% | 5 | incomplete data |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Charging Port | £-3,957.82 | -3187.5% | 1 | incomplete data |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Keyboard | £-8,457.97 | -3085.0% | 4 | review pricing |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Keyboard | £-6,259.05 | -3016.4% | 8 | review pricing |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Charging Port | £-3,692.34 | -2973.7% | 2 | incomplete data |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Battery | £-4,835.37 | -2915.8% | 7 | review pricing |
| Apple Watch SE 44mm | Apple Watch SE 44mm Rear Housing | £-3,712.84 | -2802.1% | 1 | review pricing |
| iPad 6 | iPad 6 Display Screen | £-2,298.91 | -2786.6% | 1 | review pricing |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Battery | £-4,614.44 | -2782.6% | 10 | review pricing |
| iPhone SE3 | iPhone SE3 Diagnostic | £-1,120.86 | -2745.0% | 6 | review pricing |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Battery | £-4,544.89 | -2740.6% | 1 | review pricing |
| iPad 10 | iPad 10 Charging Port | £-2,258.00 | -2737.0% | 1 | review pricing |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Trackpad | £-5,674.92 | -2734.9% | 5 | review pricing |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Charging Port | £-4,518.00 | -2724.4% | 2 | incomplete data |
| iPad 7 | iPad 7 Glass Screen | £-3,380.39 | -2722.5% | 10 | review pricing |
| iPad 8 | iPad 8 Glass and Touch Screen | £-3,380.39 | -2722.5% | 10 | review pricing |
| Apple Watch S2 42mm | Apple Watch S2 42mm Glass Screen | £-2,923.99 | -2720.0% | 5 | review pricing |
| Apple Watch S3 42mm | Apple Watch S3 42mm Glass Screen | £-2,923.99 | -2720.0% | 5 | review pricing |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Charging Port | £-3,369.18 | -2713.4% | 2 | incomplete data |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Keyboard | £-5,627.79 | -2712.2% | 3 | incomplete data |
| iPad Mini 5 | iPad Mini 5 Diagnostic | £-1,099.67 | -2693.1% | 1 | review pricing |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Battery | £-4,010.16 | -2688.4% | 10 | review pricing |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Keyboard | £-5,551.04 | -2675.2% | 2 | incomplete data |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Battery | £-4,327.01 | -2609.3% | 10 | review pricing |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Trackpad | £-6,423.03 | -2577.8% | 2 | review pricing |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Keyboard | £-5,992.12 | -2577.3% | 7 | review pricing |
| iPad Mini 4 | iPad Mini 4 Charging Port | £-1,683.25 | -2556.8% | 3 | review pricing |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Trackpad | £-5,278.92 | -2544.1% | 6 | review pricing |
| iPad Pro 10.5 | iPad Pro 10.5 Display Screen | £-4,202.73 | -2534.3% | 2 | review pricing |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Trackpad | £-5,210.90 | -2511.3% | 3 | review pricing |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Keyboard | £-5,196.51 | -2504.3% | 4 | incomplete data |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Touch Bar | £-5,143.18 | -2478.6% | 3 | review pricing |
| Apple Watch S7 41MM | Apple Watch S7 41MM Battery | £-2,866.91 | -2475.0% | 2 | review pricing |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Dustgate | £-5,103.79 | -2459.7% | 10 | review pricing |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Dustgate | £-5,103.79 | -2459.7% | 10 | review pricing |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Dustgate | £-5,103.79 | -2459.7% | 10 | review pricing |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Keyboard | £-5,101.18 | -2458.4% | 5 | review pricing |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Battery | £-3,629.16 | -2433.0% | 10 | review pricing |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Dustgate | £-5,046.39 | -2432.0% | 10 | review pricing |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Keyboard | £-5,792.79 | -2405.3% | 2 | incomplete data |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Screen | £-5,942.45 | -2384.9% | 10 | review pricing |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Charging Port | £-3,933.99 | -2372.3% | 1 | incomplete data |
| iPhone 15 Pro | iPhone 15 Pro Charging Port | £-2,942.89 | -2370.1% | 1 | incomplete data |
| iPhone 13 | iPhone 13 Rear Housing (Rear Glass And Frame) | £-3,697.49 | -2347.6% | 5 | review pricing |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Battery | £-3,478.64 | -2332.1% | 10 | review pricing |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Diagnostic | £-3,681.96 | -2220.3% | 7 | review pricing |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Keyboard | £-6,001.93 | -2189.2% | 1 | incomplete data |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Trackpad | £-3,554.73 | -2143.6% | 1 | review pricing |
| iPod Touch 6th Gen | iPod Touch 6th Gen Screen | £-1,419.57 | -2129.4% | 4 | review pricing |
| iPod Touch 7th Gen | iPod Touch 7th Gen Screen | £-1,419.57 | -2129.4% | 4 | review pricing |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Touch Bar | £-4,359.62 | -2101.0% | 1 | incomplete data |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Display Screen | £-4,354.93 | -2098.8% | 6 | review pricing |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Backlight | £-5,063.13 | -2032.0% | 10 | review pricing |
| iPhone XR | iPhone XR Microphone | £-993.75 | -2021.2% | 1 | review pricing |
| Apple Watch S4 44mm | Apple Watch S4 44mm Glass Screen | £-2,912.31 | -1952.4% | 6 | review pricing |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Trackpad | £-3,230.19 | -1947.9% | 1 | review pricing |
| iPhone 12 | iPhone 12 Charging Port | £-1,281.02 | -1945.9% | 6 | review pricing |
| Apple Watch S2 42mm | Apple Watch S2 42mm Display Screen | £-2,883.32 | -1933.0% | 5 | review pricing |
| Apple Watch S3 42mm | Apple Watch S3 42mm Display Screen | £-2,883.32 | -1933.0% | 5 | review pricing |
| iPhone 15 Pro Max | iPhone 15 Pro Max Screen | £-5,782.63 | -1932.9% | 8 | review pricing |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Keyboard | £-4,003.67 | -1929.5% | 3 | review pricing |
| iPhone 15 Pro Max | iPhone 15 Pro Max Charging Port | £-2,380.13 | -1916.9% | 3 | incomplete data |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Display Screen | £-3,961.71 | -1909.3% | 7 | review pricing |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Battery | £-2,812.93 | -1885.8% | 10 | review pricing |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Battery | £-2,812.93 | -1885.8% | 10 | review pricing |
| iPad Air 3 | iPad Air 3 Display Screen | £-3,050.17 | -1839.3% | 1 | review pricing |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Backlight | £-5,038.73 | -1837.8% | 10 | review pricing |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Backlight | £-5,038.73 | -1837.8% | 10 | review pricing |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Backlight | £-5,038.73 | -1837.8% | 10 | review pricing |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Battery | £-2,427.99 | -1832.4% | 4 | review pricing |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Battery | £-2,427.99 | -1832.4% | 4 | review pricing |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Keyboard | £-4,539.99 | -1822.1% | 6 | review pricing |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Battery | £-2,410.47 | -1819.2% | 5 | review pricing |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Trackpad | £-3,762.10 | -1813.1% | 1 | incomplete data |
| Apple Watch S5 40mm | Apple Watch S5 40mm Battery | £-2,061.98 | -1780.1% | 1 | review pricing |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Charging Port | £-2,942.12 | -1774.1% | 4 | incomplete data |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Trackpad | £-3,658.60 | -1763.2% | 4 | review pricing |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Keyboard | £-3,649.58 | -1758.8% | 4 | incomplete data |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Keyboard | £-3,642.72 | -1755.5% | 2 | incomplete data |
| iPhone 12 Pro | iPhone 12 Pro Screen | £-2,873.59 | -1732.8% | 10 | review pricing |
| iPhone 12 | iPhone 12 Screen | £-2,870.31 | -1730.8% | 10 | review pricing |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Trackpad | £-3,578.78 | -1724.7% | 2 | incomplete data |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Charging Port | £-2,128.74 | -1714.4% | 1 | incomplete data |
| Apple Watch S5 44mm | Apple Watch S5 44mm Battery | £-1,958.94 | -1691.2% | 3 | review pricing |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Battery | £-2,796.67 | -1686.4% | 10 | review pricing |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Battery | £-2,796.67 | -1686.4% | 10 | review pricing |
| iPhone 7 Plus | iPhone 7 Plus Charging Port | £-824.90 | -1677.8% | 2 | review pricing |
| Apple Watch S9 41MM | Apple Watch S9 41MM Glass Screen | £-3,460.16 | -1667.5% | 2 | incomplete data |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Keyboard | £-3,832.94 | -1648.6% | 4 | incomplete data |
| iPhone 13 | iPhone 13 Earpiece Speaker | £-1,205.38 | -1625.2% | 5 | review pricing |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Charging Port | £-2,672.59 | -1611.6% | 1 | incomplete data |
| iPhone SE3 | iPhone SE3 Original LCD Screen | £-1,968.43 | -1585.3% | 10 | review pricing |
| iPhone 14 Pro Max | iPhone 14 Pro Max Battery | £-1,170.97 | -1578.8% | 9 | review pricing |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Touch Bar | £-3,267.88 | -1574.9% | 1 | incomplete data |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Charging Port | £-1,953.60 | -1573.4% | 4 | incomplete data |
| iPad 10 | iPad 10 Display Screen | £-1,952.06 | -1572.1% | 3 | review pricing |
| iPad Air 5 | iPad Air 5 Display Screen | £-3,230.33 | -1556.8% | 9 | review pricing |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Charging Port | £-1,923.35 | -1549.0% | 10 | review pricing |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Trackpad | £-3,857.63 | -1548.2% | 1 | incomplete data |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Keyboard | £-3,188.12 | -1536.4% | 1 | incomplete data |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Charging Port | £-1,899.36 | -1529.7% | 2 | incomplete data |
| MacBook 12 A1534 | MacBook 12 A1534 Battery | £-2,506.13 | -1511.2% | 2 | review pricing |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Display Screen | £-3,119.93 | -1503.6% | 10 | review pricing |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Backlight | £-4,981.79 | -1498.3% | 10 | review pricing |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Charging Port | £-1,848.64 | -1488.8% | 9 | review pricing |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Trackpad | £-3,033.59 | -1462.0% | 2 | review pricing |
| iPad Air 4 | iPad Air 4 Display Screen | £-2,991.37 | -1441.6% | 9 | review pricing |
| iPhone 14 Pro Max | iPhone 14 Pro Max Charging Port | £-1,057.44 | -1425.8% | 10 | review pricing |
| iPhone 12 Mini | iPhone 12 Mini Diagnostic | £-580.45 | -1421.5% | 2 | review pricing |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Battery | £-2,084.79 | -1397.6% | 10 | review pricing |
| iPhone 15 Pro | iPhone 15 Pro Battery | £-1,117.38 | -1354.4% | 5 | review pricing |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Screen | £-5,625.70 | -1352.9% | 2 | incomplete data |
| iPad 9 | iPad 9 Glass Screen | £-1,341.50 | -1352.8% | 10 | review pricing |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Diagnostic | £-547.98 | -1342.0% | 2 | review pricing |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Trackpad | £-3,327.37 | -1335.4% | 1 | review pricing |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Dustgate | £-2,769.63 | -1334.8% | 10 | review pricing |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Display Screen | £-4,405.12 | -1324.8% | 9 | review pricing |
| iPad Air 4 | iPad Air 4 Charging Port | £-1,626.32 | -1309.8% | 3 | review pricing |
| iPhone 14 Pro | iPhone 14 Pro Rear Housing (Rear Glass And Frame) | £-2,268.31 | -1302.4% | 10 | review pricing |
| iPad Mini 5 | iPad Mini 5 Charging Port | £-1,073.87 | -1301.7% | 2 | review pricing |
| Apple Watch S6 44mm | Apple Watch S6 44mm Display Screen | £-1,923.99 | -1289.8% | 5 | review pricing |
| Apple Watch S6 44mm | Apple Watch S6 44mm Glass Screen | £-1,923.99 | -1289.8% | 5 | review pricing |
| Apple Watch S4 40mm | Apple Watch S4 40mm Glass Screen | £-1,922.64 | -1288.9% | 3 | review pricing |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Battery | £-1,572.63 | -1266.5% | 3 | review pricing |
| Apple Watch S4 40mm | Apple Watch S4 40mm Display Screen | £-1,828.66 | -1225.9% | 2 | review pricing |
| Apple Watch S5 44mm | Apple Watch S5 44mm Crown | £-1,005.02 | -1218.2% | 1 | review pricing |
| Apple Watch SE 40mm | Apple Watch SE 40mm Battery | £-1,486.71 | -1197.3% | 10 | review pricing |
| iPhone X | iPhone X Diagnostic | £-484.83 | -1187.3% | 1 | review pricing |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 M1 Pro/Max A2442 Battery | £-2,447.19 | -1179.4% | 2 | review pricing |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Backlight | £-4,900.46 | -1178.5% | 10 | review pricing |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Backlight | £-4,900.46 | -1178.5% | 10 | review pricing |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Display Screen | £-4,364.45 | -1166.4% | 9 | review pricing |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Battery | £-1,738.02 | -1165.2% | 10 | review pricing |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Trackpad | £-1,926.71 | -1161.8% | 4 | review pricing |
| iPad Air 5 | iPad Air 5 Charging Port | £-1,427.95 | -1150.0% | 3 | review pricing |
| MacBook Air 13 M4 A3240 | MacBook Air 13 M4 A3240 Screen | £-4,579.00 | -1147.1% | 10 | review pricing |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Screen | £-3,143.99 | -1146.7% | 10 | review pricing |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Battery | £-2,268.98 | -1093.5% | 2 | review pricing |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Battery | £-2,268.98 | -1093.5% | 2 | review pricing |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Battery | £-1,427.86 | -1077.6% | 1 | review pricing |
| iPhone X | iPhone X Microphone | £-525.70 | -1069.2% | 1 | review pricing |
| iPhone 12 | iPhone 12 Earpiece Speaker | £-700.65 | -1064.3% | 8 | review pricing |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) Charging Port | £-1,316.50 | -1060.3% | 10 | review pricing |
| Apple Watch SE 44mm | Apple Watch SE 44mm Display Screen | £-1,743.64 | -1051.4% | 10 | review pricing |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Keyboard | £-2,591.26 | -1040.0% | 1 | incomplete data |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Keyboard | £-2,128.29 | -1025.7% | 2 | review pricing |
| Apple Watch S5 40mm | Apple Watch S5 40mm Glass Screen | £-1,520.86 | -1019.6% | 10 | review pricing |
| iPhone 8 Plus | iPhone 8 Plus Battery | £-494.11 | -1005.0% | 2 | review pricing |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Screen | £-2,747.83 | -1002.2% | 10 | review pricing |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Keyboard | £-1,650.30 | -995.2% | 1 | incomplete data |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Keyboard | £-2,051.56 | -988.7% | 7 | review pricing |
| Apple Watch S5 40mm | Apple Watch S5 40mm Display Screen | £-1,462.31 | -980.3% | 10 | review pricing |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Charging Port | £-1,601.07 | -965.5% | 1 | incomplete data |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Charging Port | £-1,560.97 | -941.3% | 2 | incomplete data |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Screen | £-2,615.17 | -925.7% | 10 | review pricing |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Screen | £-3,818.64 | -918.3% | 10 | review pricing |
| iPhone 13 Mini | iPhone 13 Mini Screen | £-2,094.78 | -901.0% | 2 | review pricing |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Screen | £-2,224.00 | -892.6% | 10 | review pricing |
| Apple Watch S5 44mm | Apple Watch S5 44mm Display Screen | £-1,301.80 | -872.7% | 10 | review pricing |
| Apple Watch SE 40mm | Apple Watch SE 40mm Display Screen | £-1,446.04 | -872.0% | 10 | review pricing |
| iPhone 12 Pro Max | iPhone 12 Pro Max Battery | £-637.71 | -859.8% | 10 | review pricing |
| iPhone 7 Plus | iPhone 7 Plus Original LCD Screen | £-912.70 | -849.0% | 2 | review pricing |
| iPad Mini 5 | iPad Mini 5 Display Screen | £-1,051.02 | -846.5% | 7 | review pricing |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Screen | £-2,797.24 | -841.3% | 10 | review pricing |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Charging Port | £-1,040.76 | -838.2% | 9 | review pricing |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Charging Port | £-1,040.76 | -838.2% | 9 | review pricing |
| iPhone 13 Pro | iPhone 13 Pro Charging Port | £-603.50 | -813.7% | 6 | review pricing |
| Apple Watch SE 40mm | Apple Watch SE 40mm Glass Screen | £-1,340.90 | -808.6% | 10 | review pricing |
| Apple Watch S6 44mm | Apple Watch S6 44mm Battery | £-922.57 | -796.5% | 1 | review pricing |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) Display Screen | £-1,978.73 | -794.1% | 9 | review pricing |
| iPhone XS | iPhone XS Display (Original OLED Screen) | £-1,246.35 | -791.3% | 7 | review pricing |
| iPad 6 | iPad 6 Glass and Touch Screen | £-705.97 | -777.2% | 5 | review pricing |
| iPad 6 | iPad 6 Glass Screen | £-705.97 | -777.2% | 5 | review pricing |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Charging Port | £-953.34 | -767.8% | 10 | review pricing |
| iPad Air | iPad Air Glass Screen | £-563.67 | -760.0% | 3 | review pricing |
| iPad 5 | iPad 5 Glass and Touch Screen | £-562.86 | -750.5% | 3 | review pricing |
| iPad Mini 4 | iPad Mini 4 Battery | £-482.46 | -732.9% | 1 | review pricing |
| Apple Watch S5 44mm | Apple Watch S5 44mm Glass Screen | £-1,090.55 | -731.1% | 10 | review pricing |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Dustgate | £-1,508.05 | -726.8% | 10 | review pricing |
| iPhone 12 Mini | iPhone 12 Mini Battery | £-533.67 | -719.6% | 10 | review pricing |
| iPhone 11 Pro | iPhone 11 Pro Rear Housing (Rear Glass And Frame) | £-832.93 | -719.1% | 1 | review pricing |
| Apple Watch SE 44mm | Apple Watch SE 44MM Glass Screen | £-1,163.10 | -701.4% | 10 | review pricing |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Flexgate | £-2,031.20 | -698.4% | 10 | review pricing |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Screen | £-2,885.31 | -693.9% | 10 | review pricing |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Touch Bar | £-1,436.07 | -692.1% | 1 | incomplete data |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Screen | £-1,724.19 | -692.0% | 2 | incomplete data |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Screen | £-3,146.52 | -687.8% | 10 | review pricing |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Screen | £-1,878.73 | -685.3% | 10 | review pricing |
| iPad Mini 5 | iPad Mini 5 Battery | £-844.30 | -680.0% | 2 | review pricing |
| Apple Watch S7 45MM | Apple Watch S7 45MM Display Screen | £-1,118.67 | -674.6% | 3 | review pricing |
| Apple Watch S7 45MM | Apple Watch S7 45MM Glass Screen | £-1,118.67 | -674.6% | 3 | review pricing |
| iPad 5 | iPad 5 Glass Screen | £-555.54 | -673.4% | 3 | review pricing |
| iPhone 13 Pro Max | iPhone 13 Pro Max Front Camera | £-1,395.37 | -672.5% | 1 | review pricing |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Screen | £-2,217.24 | -666.8% | 10 | review pricing |
| iPad Mini 6 | iPad Mini 6 Charging Port | £-818.85 | -659.5% | 3 | review pricing |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Charging Port | £-808.33 | -651.0% | 2 | incomplete data |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Screen | £-2,163.19 | -650.6% | 10 | review pricing |
| iPad 9 | iPad 9 Charging Port | £-518.94 | -629.0% | 7 | review pricing |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Dustgate | £-1,785.34 | -613.9% | 10 | review pricing |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Screen | £-3,319.01 | -613.7% | 10 | incomplete data |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Trackpad | £-995.30 | -600.2% | 1 | incomplete data |
| iPhone 13 Pro | iPhone 13 Pro Rear Camera Lens | £-438.75 | -591.6% | 6 | review pricing |
| iPhone 13 | iPhone 13 Rear Camera | £-583.09 | -588.0% | 8 | review pricing |
| iPhone 13 Mini | iPhone 13 Mini Rear Camera | £-583.09 | -588.0% | 8 | review pricing |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Dustgate | £-1,210.13 | -583.2% | 10 | review pricing |
| iPhone 14 Pro | iPhone 14 Pro Charging Port | £-430.98 | -581.1% | 10 | incomplete data |
| iPhone 13 Pro Max | iPhone 13 Pro Max Rear Housing (Rear Glass And Frame) | £-948.27 | -571.8% | 6 | review pricing |
| iPhone 12 Pro | iPhone 12 Pro Battery | £-418.37 | -564.1% | 10 | review pricing |
| iPhone X | iPhone X Charging Port | £-275.96 | -561.3% | 2 | review pricing |
| iPhone 8 | iPhone 8 Original LCD Screen | £-602.51 | -560.5% | 10 | review pricing |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Glass Screen | £-921.79 | -555.9% | 1 | incomplete data |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Battery | £-907.61 | -547.3% | 2 | review pricing |
| Apple Watch S7 41MM | Apple Watch S7 41MM Display Screen | £-904.64 | -545.5% | 1 | review pricing |
| Apple Watch S7 41MM | Apple Watch S7 41MM Glass Screen | £-904.64 | -545.5% | 1 | review pricing |
| Apple Watch S7 41MM | Apple Watch S7 41MM Rear Housing | £-903.34 | -544.7% | 1 | review pricing |
| Apple Watch S7 41MM | Apple Watch S7 41MM Heart Rate Monitor | £-902.34 | -544.1% | 1 | review pricing |
| iPad 8 | iPad 8 Charging Port | £-445.97 | -540.6% | 4 | review pricing |
| iPhone 14 Pro | iPhone 14 Pro Screen | £-1,114.84 | -537.3% | 5 | review pricing |
| iPhone XR | iPhone XR Charging Port | £-263.74 | -536.4% | 4 | review pricing |
| MacBook Pro 13  A1708 | MacBook Pro 13 A1708 Dustgate | £-1,536.77 | -528.4% | 10 | review pricing |
| iPhone SE2 | iPhone SE2 Battery | £-391.60 | -528.0% | 9 | review pricing |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Screen | £-2,055.53 | -525.9% | 10 | review pricing |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Trackpad | £-863.52 | -520.7% | 1 | incomplete data |
| iPhone 13 Pro Max | iPhone 13 Pro Max Rear Camera | £-508.08 | -512.3% | 9 | review pricing |
| iPhone 13 Pro | iPhone 13 Pro Aftermarket Screen | £-1,224.43 | -508.4% | 5 | review pricing |
| iPhone 11 | iPhone 11 Charging Port | £-282.88 | -492.0% | 4 | review pricing |
| iPhone 15 Pro Max | iPhone 15 Pro Max Volume Button | £-402.42 | -487.8% | 1 | incomplete data |
| Apple Watch S4 44mm | Apple Watch S4 44mm Display Screen | £-727.59 | -487.8% | 4 | review pricing |
| Apple Watch S8 45MM | Apple Watch S8 45MM Rear Housing | £-888.25 | -486.7% | 1 | review pricing |
| Apple Watch S8 45MM | Apple Watch S8 45MM Heart Rate Monitor | £-887.25 | -486.2% | 1 | review pricing |
| iPad Air 7 (13) | iPad Air 7 (13) Screen | £-1,590.48 | -478.3% | 3 | review pricing |
| iPhone 13 Pro Max | iPhone 13 Pro Max Aftermarket Screen | £-1,142.30 | -458.4% | 4 | review pricing |
| iPad 6 | iPad 6 Battery | £-529.15 | -456.8% | 3 | review pricing |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Dustgate | £-1,299.29 | -446.7% | 10 | review pricing |
| iPhone 13 Pro Max | iPhone 13 Pro Max Charging Port | £-329.86 | -444.7% | 3 | review pricing |
| iPhone 14 Pro Max | iPhone 14 Pro Max Screen | £-1,106.90 | -444.2% | 8 | review pricing |
| iPhone X | iPhone X Battery | £-215.56 | -438.4% | 5 | review pricing |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Screen | £-1,999.79 | -437.1% | 10 | review pricing |
| iPad Air 6 (13) | iPad Air 6 (13) Screen | £-1,270.72 | -436.9% | 3 | review pricing |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Screen | £-2,177.62 | -436.3% | 10 | review pricing |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Screen | £-1,449.40 | -435.9% | 10 | review pricing |
| iPhone 15 | iPhone 15 Rear Camera | £-464.10 | -431.7% | 1 | review pricing |
| Apple Watch S7 45MM | Apple Watch S7 45MM Battery | £-489.02 | -422.2% | 2 | review pricing |
| iPhone XS Max | iPhone XS Max Rear Housing (Rear Glass And Frame) | £-418.23 | -421.7% | 1 | review pricing |
| iPad 5 | iPad 5 Battery | £-483.00 | -417.0% | 2 | review pricing |
| iPad 7 | iPad 7 Battery | £-483.00 | -417.0% | 2 | review pricing |
| iPad Air | iPad Air Battery | £-483.00 | -417.0% | 2 | review pricing |
| iPhone 12 | iPhone 12 Aftermarket Screen | £-687.03 | -414.3% | 2 | incomplete data |
| iPhone 12 Pro | iPhone 12 Pro Earpiece Speaker | £-272.07 | -413.3% | 8 | review pricing |
| iPad 9 | iPad 9 Glass and Touch Screen | £-512.20 | -412.5% | 10 | review pricing |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Flexgate | £-1,187.98 | -408.5% | 10 | review pricing |
| iPhone 12 Pro Max | iPhone 12 Pro Max Screen | £-772.19 | -404.6% | 8 | review pricing |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Glass Screen | £-837.01 | -403.4% | 1 | incomplete data |
| MacBook Pro 13  A1708 | MacBook Pro 13 A1708 Flexgate | £-1,146.07 | -394.1% | 10 | review pricing |
| iPhone 13 Pro | iPhone 13 Pro Battery | £-257.96 | -391.8% | 10 | review pricing |
| iPhone 14 Pro Max | iPhone 14 Pro Max Rear Camera | £-383.02 | -386.2% | 3 | review pricing |
| Apple Watch S6 40mm | Apple Watch S6 40mm Glass Screen | £-571.10 | -382.9% | 1 | review pricing |
| iPhone 13 Pro | iPhone 13 Pro Rear Camera | £-377.01 | -380.2% | 9 | review pricing |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Screen | £-1,393.97 | -372.6% | 10 | review pricing |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Screen | £-1,835.90 | -367.8% | 10 | review pricing |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Battery | £-539.89 | -361.9% | 2 | review pricing |
| iPhone SE3 | iPhone SE3 Rear Camera | £-293.94 | -356.3% | 2 | incomplete data |
| iPhone XS | iPhone XS Battery | £-262.17 | -353.5% | 4 | review pricing |
| iPhone 15 | iPhone 15 Aftermarket Screen | £-849.88 | -352.9% | 7 | review pricing |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Dustgate | £-983.21 | -338.1% | 10 | review pricing |
| iPad Pro 13 (7G) | iPad Pro 13 (7G) Screen | £-2,177.18 | -327.0% | 1 | review pricing |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Keyboard | £-779.27 | -323.6% | 1 | incomplete data |
| iPhone 13 Pro Max | iPhone 13 Pro Max Screen | £-797.54 | -320.1% | 5 | review pricing |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Display Screen | £-660.32 | -318.2% | 10 | review pricing |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Screen | £-1,664.56 | -312.6% | 10 | review pricing |
| iPhone 15 | iPhone 15 Screen | £-746.23 | -309.9% | 7 | review pricing |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Display Screen | £-897.29 | -308.5% | 1 | incomplete data |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Screen | £-1,085.10 | -303.5% | 10 | review pricing |
| iPhone 14 Pro | iPhone 14 Pro Aftermarket Screen | £-629.71 | -303.5% | 5 | review pricing |
| iPhone 12 Mini | iPhone 12 Mini Rear Housing (Rear Glass And Frame) | £-432.81 | -290.2% | 2 | review pricing |
| iPhone 11 Pro Max | iPhone 11 Pro Max Battery | £-208.69 | -281.4% | 7 | review pricing |
| iPad Air | iPad Air Diagnostic | £-114.37 | -280.1% | 1 | review pricing |
| iPhone 12 Pro | iPhone 12 Pro Aftermarket Screen | £-457.02 | -275.6% | 3 | review pricing |
| iPhone 14 Pro Max | iPhone 14 Pro Max Rear Housing (Rear Glass And Frame) | £-467.05 | -268.2% | 9 | review pricing |
| iPhone 13 Mini | iPhone 13 Mini Rear Housing (Rear Glass And Frame) | £-438.15 | -264.2% | 0 | review pricing |
| iPhone XS Max | iPhone XS Max Battery | £-178.33 | -240.4% | 6 | review pricing |
| iPhone 13 Pro | iPhone 13 Pro Rear Housing (Rear Glass And Frame) | £-394.48 | -237.9% | 9 | review pricing |
| iPhone 6s, iPhone 5 | iPhone 6s Rear Camera Lens | £-78.47 | -235.4% | 0 | review pricing |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Screen | £-816.38 | -228.4% | 10 | review pricing |
| iPhone SE3 | iPhone SE3 Battery | £-160.84 | -216.9% | 6 | review pricing |
| iPhone 16 | iPhone 16 Diagnostic | £-85.12 | -208.5% | 1 | incomplete data |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Glass Screen | £-339.41 | -204.7% | 1 | incomplete data |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Glass Screen | £-338.69 | -204.2% | 1 | incomplete data |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Keyboard | £-423.24 | -204.0% | 2 | incomplete data |
| iPhone 12 Pro | iPhone 12 Pro Rear Housing (Rear Glass And Frame) | £-288.00 | -182.9% | 1 | review pricing |
| iPhone 13 | iPhone 13 Rear Camera Lens | £-87.29 | -177.5% | 4 | review pricing |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Screen | £-1,007.27 | -172.9% | 10 | review pricing |
| iPhone 13 Pro | iPhone 13 Pro Screen | £-414.23 | -172.0% | 6 | review pricing |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Keyboard | £-356.72 | -171.9% | 1 | incomplete data |
| iPad Mini 4 | iPad Mini 4 Display Screen | £-212.94 | -171.5% | 1 | review pricing |
| iPhone XR | iPhone XR Rear Housing (Rear Glass And Frame) | £-153.71 | -169.2% | 2 | review pricing |
| Apple Watch S9 45MM | Apple Watch S9 45MM Glass Screen | £-341.33 | -164.5% | 1 | incomplete data |
| iPhone 12 Pro Max | iPhone 12 Pro Max Rear Camera Lens | £-80.54 | -163.8% | 5 | review pricing |
| iPhone 11 Pro Max | iPhone 11 Pro Max Rear Housing (Rear Glass And Frame) | £-189.71 | -163.8% | 4 | review pricing |
| iPhone 12 Pro Max | iPhone 12 Pro Max Rear Housing (Rear Glass And Frame) | £-252.39 | -160.3% | 4 | review pricing |
| iPhone 11 Pro | iPhone 11 Pro Battery | £-113.50 | -153.0% | 7 | review pricing |
| iPhone 14 Plus | iPhone 14 Plus Aftermarket Screen | £-297.29 | -143.3% | 3 | review pricing |
| iPhone 15 | iPhone 15 Rear Glass | £-306.10 | -141.8% | 2 | review pricing |
| iPhone SE2 | iPhone SE2 Earpiece Speaker | £-57.31 | -140.4% | 1 | review pricing |
| iPad 10 | iPad 10 Glass Screen | £-228.76 | -137.9% | 4 | review pricing |
| iPhone 12 | iPhone 12 Rear Housing (Rear Glass And Frame) | £-204.81 | -137.3% | 5 | review pricing |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Screen | £-712.96 | -131.8% | 6 | incomplete data |
| iPhone SE2 | iPhone SE2 Rear Housing (Rear Glass And Frame) | £-113.67 | -125.1% | 1 | review pricing |
| iPhone 12 Mini | iPhone 12 Mini Screen | £-198.91 | -119.9% | 2 | review pricing |
| iPhone 14 | iPhone 14 Rear Glass | £-229.55 | -115.3% | 2 | review pricing |
| iPhone 13 Mini | iPhone 13 Mini Aftermarket Screen | £-264.34 | -113.7% | 4 | review pricing |
| iPhone 8 Plus | iPhone 8 Plus Rear Housing (Rear Glass And Frame) | £-101.35 | -111.6% | 0 | review pricing |
| iPhone SE3 | iPhone SE3 Earpiece Speaker | £-49.18 | -100.0% | 1 | review pricing |
| iPhone 14 Plus | iPhone 14 Plus Rear Glass | £-197.48 | -95.2% | 0 | review pricing |
| iPhone 13 | iPhone 13 Aftermarket Screen | £-188.21 | -94.5% | 4 | review pricing |
| iPhone SE2 | iPhone SE2 Display (Original LCD Screen) | £-114.68 | -92.4% | 10 | review pricing |
| iPhone 7 Plus | iPhone 7 Plus Microphone | £-45.11 | -91.8% | 1 | review pricing |
| iPhone 8 | iPhone 8 Rear Housing (Rear Glass And Frame) | £-81.35 | -89.6% | 0 | review pricing |
| iPhone 12 Pro Max | iPhone 12 Pro Max Aftermarket Screen | £-164.08 | -86.0% | 2 | review pricing |
| iPod Touch 6th Gen | iPod Touch 6th Gen Battery | £-35.77 | -85.9% | 1 | review pricing |
| iPod Touch 7th Gen | iPod Touch 7th Gen Battery | £-35.77 | -85.9% | 1 | review pricing |
| iPhone 11 Pro Max | iPhone 11 Pro Max Screen | £-132.60 | -84.2% | 10 | review pricing |
| iPhone 12 Pro Max | iPhone 12 Pro Max Earpiece Speaker | £-55.06 | -83.6% | 1 | review pricing |
| iPhone 14 Pro Max | iPhone 14 Pro Max Aftermarket Screen | £-207.53 | -83.3% | 9 | review pricing |
| Apple Watch Ultra | Apple Watch Ultra Glass Screen | £-275.37 | -82.8% | 1 | incomplete data |
| Apple Watch Ultra | Apple Watch Ultra Heart Rate Monitor | £-239.41 | -82.3% | 1 | incomplete data |
| iPad 7 | iPad 7 Charging Port | £-49.13 | -74.6% | 2 | review pricing |
| TEST PRODUCT GROUP | TEST DISPLAY PRODUCT | £-22.88 | -68.6% | 0 | review pricing |
| iPhone X | iPhone X Display (Original OLED Screen) | £-84.56 | -68.1% | 8 | review pricing |
| iPad Air | iPad Air Display Screen | £-56.53 | -62.2% | 2 | review pricing |
| iPhone 8 Plus | iPhone 8 Plus Display (Original LCD Screen) | £-63.08 | -58.7% | 0 | review pricing |
| iPhone 13 | iPhone 13 Battery | £-38.17 | -58.0% | 10 | review pricing |
| iPhone 7 | iPhone 7 Earpiece Speaker | £-32.91 | -50.0% | 1 | review pricing |
| iPhone 8 | iPhone 8 Earpiece Speaker | £-32.91 | -50.0% | 1 | review pricing |
| iPhone X | iPhone X Rear Housing (Rear Glass And Frame) | £-41.35 | -45.5% | 0 | review pricing |
| iPhone 14 Pro Max | iPhone 14 Pro Max Loudspeaker | £-20.99 | -42.7% | 1 | review pricing |
| iPhone 11 | iPhone 11 Microphone | £-22.98 | -40.0% | 2 | review pricing |
| iPhone 15 Pro | iPhone 15 Pro Rear Glass | £-89.80 | -38.6% | 6 | review pricing |
| iPhone XR | iPhone XR Display (Original LCD Screen) | £-22.20 | -33.7% | 5 | review pricing |
| iPhone XS | iPhone XS Charging Port | £-13.67 | -27.8% | 3 | review pricing |
| iPad 5 | iPad 5 Display Screen | £-16.62 | -20.1% | 1 | review pricing |
| iPhone 12 Pro Max | iPhone 12 Pro Max Charging Port | £-13.21 | -20.1% | 1 | review pricing |
| iPhone 12 Pro Max | iPhone 12 Pro Max Microphone | £-12.71 | -19.3% | 1 | review pricing |
| iPhone 13 | iPhone 13 Screen | £-36.33 | -18.2% | 10 | review pricing |
| iPhone 7 | iPhone 7 Battery | £-7.79 | -15.8% | 2 | review pricing |
| iPad Air 2 | iPad Air 2 Display Screen | £-22.41 | -15.0% | 0 | review pricing |
| iPhone 16 Pro Max | iPhone 16 Pro Max Diagnostic | £-5.99 | -14.7% | 1 | incomplete data |
| iPhone 6s, iPhone 5 | iPhone 6s Original LCD Screen | £-7.07 | -12.1% | 0 | review pricing |
| iPhone 14 | iPhone 14 Screen | £-22.10 | -11.1% | 6 | review pricing |
| iPhone 14 | iPhone 14 Rear Camera | £-10.50 | -10.6% | 2 | review pricing |
| iPad Air 3 | iPad Air 3 Charging Port | £-4.85 | -7.4% | 1 | review pricing |
| iPhone 16 Pro | iPhone 16 Pro Screen | £-15.35 | -5.3% | 3 | review pricing |
| iPhone XS | iPhone XS Rear Housing (Rear Glass And Frame) | £-3.21 | -3.2% | 0 | review pricing |
| iPhone 11 | iPhone 11 Rear Camera | £-1.59 | -2.1% | 1 | review pricing |
| iPhone 6 Plus | iPhone 6 Plus Original LCD Screen | £-0.93 | -1.4% | 0 | review pricing |
| iPhone 15 Pro | iPhone 15 Pro Screen | £0.85 | 0.3% | 7 | review pricing |
| iPhone 7 | iPhone 7 Original LCD Screen | £0.47 | 0.4% | 2 | review pricing |
| iPhone 14 Pro | iPhone 14 Pro Rear Camera | £1.47 | 1.5% | 4 | review pricing |
| iPhone 16 Pro Max | iPhone 16 Pro Max Screen | £5.23 | 1.7% | 4 | review pricing |
| iPhone 15 Pro | iPhone 15 Pro Rear Camera | £2.36 | 2.2% | 1 | review pricing |
| iPod Touch 6th Gen | iPod Touch 6th/7th Gen Rear Camera | £1.48 | 3.0% | 1 | review pricing |
| iPad Pro 11 (5G) | iPad Pro 11 (5G) Screen | £18.52 | 3.2% | 0 | review pricing |
| iPhone 14 Plus | iPhone 14 Plus Screen | £9.50 | 4.6% | 4 | review pricing |
| iPhone 6 | iPhone 6 Original LCD Screen | £3.63 | 6.2% | 0 | review pricing |
| iPhone 14 | iPhone 14 Battery | £4.86 | 7.4% | 5 | review pricing |
| iPhone XS Max | iPhone XS Max Diagnostic | £3.33 | 8.2% | 1 | review pricing |
| iPhone XS Max | iPhone XS Max Display (Original OLED Screen) | £12.90 | 8.2% | 5 | review pricing |
| iPhone SE2 | iPhone SE2 Front Camera | £3.68 | 9.0% | 1 | review pricing |
| iPhone SE2 | iPhone SE2 Proximity Sensor | £3.68 | 9.0% | 1 | review pricing |
| iPhone SE3 | iPhone SE3 Front Camera | £3.68 | 9.0% | 1 | review pricing |
| iPhone 12 Pro Max | iPhone 12 Pro Max Rear Camera | £10.02 | 9.3% | 3 | review pricing |
| iPhone 6S Plus | iPhone 6s Plus Original LCD Screen | £7.20 | 9.6% | 0 | review pricing |

## Per-Part Average Repair Time Summary

| Part | Completed Repairs Used | Avg Hours | Median Hours | Supply Price ex VAT | Note |
| --- | --- | --- | --- | --- | --- |
| (AMR) Topcase Keyboard Sensor/Keyboard BL Flex Cable A3113 | 0 | n/a | n/a | n/a | insufficient data |
| A1989/2159 - (S26) | 0 | n/a | n/a | n/a | insufficient data |
| A2159 Charging Port Space Grey | 0 | n/a | n/a | £1.00 | insufficient data |
| A2159 Liquid Damage Treatment | 0 | n/a | n/a | £1.00 | insufficient data |
| A2179/1932 - Poor Condition LCD (S34) | 0 | n/a | n/a | n/a | insufficient data |
| A2179/1932 - Poor Condition LCD (S35) | 0 | n/a | n/a | n/a | insufficient data |
| A2251/2289 -LG LCD (S23) | 0 | n/a | n/a | n/a | insufficient data |
| A2251/2289 -LG LCD (S24) | 0 | n/a | n/a | n/a | insufficient data |
| A2251/2289 -LG LCD (S25) | 0 | n/a | n/a | n/a | insufficient data |
| A2251/2289 -Sharp LCD (S21) | 0 | n/a | n/a | n/a | insufficient data |
| A2251/2289- LG LCD (S22) | 0 | n/a | n/a | n/a | insufficient data |
| A2337 - Poor Condition LCD (S007) | 0 | n/a | n/a | n/a | insufficient data |
| A2337 - Poor Condition LCD (S008) | 0 | n/a | n/a | n/a | insufficient data |
| A2337 - Poor Condition LCD (S30) | 0 | n/a | n/a | n/a | insufficient data |
| A2338 - Poor Condition LCD | 0 | n/a | n/a | n/a | insufficient data |
| A2338 - Poor Condition LCD (S012) | 0 | n/a | n/a | n/a | insufficient data |
| A2338 - Poor Condition LCD (S013) | 0 | n/a | n/a | n/a | insufficient data |
| A2338 - Poor Condition LCD (S014) | 0 | n/a | n/a | n/a | insufficient data |
| A2338 - Poor Condition LCD (S015) | 0 | n/a | n/a | n/a | insufficient data |
| A2338 - Poor Condition LCD (S017) | 0 | n/a | n/a | n/a | insufficient data |
| A2338 - Sharp LCD (S018) | 0 | n/a | n/a | n/a | insufficient data |
| A2338 - Sharp LCD (S019) | 0 | n/a | n/a | n/a | insufficient data |
| A2338 - Sharp LCD (S20) | 0 | n/a | n/a | n/a | insufficient data |
| Adapters head MacBook Air/Pro | 0 | n/a | n/a | £7.00 | insufficient data |
| After Market Screen (Untracked) | 0 | n/a | n/a | £1.00 | insufficient data |
| Aftermarket Screen - iPhone 12 / 12 Pro | 0 | n/a | n/a | £40.00 | insufficient data |
| Aftermarket Screen - iPhone 12 Mini | 0 | n/a | n/a | £40.00 | insufficient data |
| Aftermarket Screen - iPhone 12 Pro Max | 0 | n/a | n/a | £42.00 | insufficient data |
| Aftermarket Screen - iPhone 13 | 0 | n/a | n/a | £40.00 | insufficient data |
| Aftermarket Screen - iPhone 13 Mini | 0 | n/a | n/a | £40.00 | insufficient data |
| Aftermarket Screen - iPhone 13 Pro | 0 | n/a | n/a | £50.00 | insufficient data |
| Aftermarket Screen - iPhone 13 Pro Max | 0 | n/a | n/a | £80.00 | insufficient data |
| Aftermarket Screen - iPhone 14 | 0 | n/a | n/a | £75.00 | insufficient data |
| Aftermarket Screen - iPhone 14 Plus | 0 | n/a | n/a | £100.00 | insufficient data |
| Aftermarket Screen - iPhone 14 Pro | 0 | n/a | n/a | £80.00 | insufficient data |
| Aftermarket Screen - iPhone 14 Pro Max | 0 | n/a | n/a | £80.00 | insufficient data |
| Aftermarket Screen - iPhone 15 | 0 | n/a | n/a | £100.00 | insufficient data |
| Aftermarket Screen - iPhone 15 Plus | 0 | n/a | n/a | £55.00 | insufficient data |
| Aftermarket Screen - iPhone 15 Pro | 0 | n/a | n/a | £81.00 | insufficient data |
| Aftermarket Screen - iPhone 15 Pro Max | 0 | n/a | n/a | £81.00 | insufficient data |
| All Refurbable Parts | 0 | n/a | n/a | n/a | insufficient data |
| All Refurbable Parts | 0 | n/a | n/a | n/a | insufficient data |
| Apple Watch Diagnostic | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch Logic Board | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S1 38mm Battery (A1578) | 0 | n/a | n/a | £10.00 | insufficient data |
| Apple Watch S1 38mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S1 38mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S1 42mm Battery (A1579) | 0 | n/a | n/a | £8.02 | insufficient data |
| Apple Watch S1 42mm Crown | 0 | n/a | n/a | £0.00 | insufficient data |
| Apple Watch S1 42mm Rear Glass Space Grey | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S1 42mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S2 38mm Battery (A1760) | 0 | n/a | n/a | £5.79 | insufficient data |
| Apple Watch S2 38mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S2 38mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S2 42mm Battery (A1761) | 0 | n/a | n/a | £9.26 | insufficient data |
| Apple Watch S2 42mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S2 42mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S3 38mm Battery (A1848) | 0 | n/a | n/a | £21.56 | insufficient data |
| Apple Watch S3 38mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S3 38mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S3 42mm Battery (A1850) | 0 | n/a | n/a | £20.22 | insufficient data |
| Apple Watch S3 42mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S3 42mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S4 40mm Battery (A2058) | 0 | n/a | n/a | £15.30 | insufficient data |
| Apple Watch S4 40mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S4 40mm Heart Rate Monitor | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S4 40mm Rear Housing Black | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S4 40mm Rear Housing White | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S4 40mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S4 44mm Battery (A2059) | 0 | n/a | n/a | £20.00 | insufficient data |
| Apple Watch S4 44mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S4 44mm Heart Rate Monitor | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S4 44mm NFC Module | 0 | n/a | n/a | £20.00 | insufficient data |
| Apple Watch S4 44mm Rear Housing Black | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S4 44mm Rear Housing White | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S4 44mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S5 40mm Battery (A2277) | 0 | n/a | n/a | £14.68 | insufficient data |
| Apple Watch S5 40mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S5 40mm Heart Rate Monitor | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S5 40mm Rear Housing Black | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S5 40mm Rear Housing White | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S5 40mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S5 44mm Battery (A2181) | 0 | n/a | n/a | £3.20 | insufficient data |
| Apple Watch S5 44mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S5 44mm Heart Rate Monitor | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S5 44mm Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S5 44mm Rear Housing Black | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S5 44mm Rear Housing White | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S5 44mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S6 40mm Battery | 0 | n/a | n/a | £2.14 | insufficient data |
| Apple Watch S6 40mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S6 40mm Heart Rate Monitor | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S6 40mm Rear Housing Black | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S6 40mm Rear Housing Black | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S6 40mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S6 44mm Battery | 0 | n/a | n/a | £6.82 | insufficient data |
| Apple Watch S6 44mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S6 44mm Heart Rate Monitor | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S6 44mm Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S6 44mm Rear Glass Space Grey | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S6 44mm Rear Glass Space Grey | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S6 44mm Rear Housing Black | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S6 44mm Rear Housing White | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S6 44mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S7 41mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S7 41mmm Battery | 0 | n/a | n/a | £15.00 | insufficient data |
| Apple Watch S7 41mmm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S7 41mmm Heart Rate Monitor | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S7 41mmm Rear Housing Black | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S7 41mmm Rear Housing White | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S7 45mm Battery | 0 | n/a | n/a | £30.00 | insufficient data |
| Apple Watch S7 45mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S7 45mm Heart Rate Monitor | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S7 45mm Rear Housing Black | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S7 45mm Rear Housing Blue | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S7 45mm Rear Housing White | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S7 45mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S8 41mm Battery | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S8 41mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S8 41mm Heart Rate Monitor | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S8 41mm Rear Housing Black | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S8 41mm Rear Housing White | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S8 41mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S8 45mm Battery | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S8 45mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S8 45mm Heart Rate Monitor | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S8 45mm Rear Housing Black | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S8 45mm Rear Housing White | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch S8 45mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch SE 40mm Battery | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch SE 40mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch SE 40mm Heart Rate Monitor | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch SE 40mm Rear Housing Black | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch SE 40mm Rear Housing White | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch SE 40mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch SE 44mm Battery | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch SE 44mm Crown | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch SE 44mm Heart Rate Monitor | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch SE 44mm Rear Housing Black | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch SE 44mm Rear Housing White | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch SE 44mm Side Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Apple Watch Software Reinstallation | 0 | n/a | n/a | £1.00 | insufficient data |
| Audio Board - A2337 | 0 | n/a | n/a | n/a | insufficient data |
| Audio Board / Audio Flex - A1706 | 0 | n/a | n/a | n/a | insufficient data |
| Audio Board / Audio Flex - A1708 | 0 | n/a | n/a | n/a | insufficient data |
| Audio Board / Audio Flex - A1932 | 0 | n/a | n/a | n/a | insufficient data |
| Audio Board / Audio Flex - A2159 | 0 | n/a | n/a | n/a | insufficient data |
| Audio Board / Audio Flex - A2179 | 0 | n/a | n/a | n/a | insufficient data |
| Audio Board / Audio Flex - A2289 / A2338 | 0 | n/a | n/a | n/a | insufficient data |
| Audio Board / Audio Flex - A2442 / A2779 / A2918 / A2992 / A2485 / A2780 / A2991 | 0 | n/a | n/a | n/a | insufficient data |
| Audio Board / Audio Flex - A2681 / A3113 | 0 | n/a | n/a | n/a | insufficient data |
| Audio Board / Audio Flex - A2941 / A3114 | 0 | n/a | n/a | n/a | insufficient data |
| Audio Flex - A2337 | 0 | n/a | n/a | n/a | insufficient data |
| Battery Flex - A1708 / A2159 / A2289 / A2338 | 0 | n/a | n/a | £2.00 | insufficient data |
| Battery Flex - A1989 / A2251 | 0 | n/a | n/a | £2.00 | insufficient data |
| Battery Flex - A1990 | 0 | n/a | n/a | £2.00 | insufficient data |
| Battery Flex - A2141 | 0 | n/a | n/a | £2.00 | insufficient data |
| Battery Flex - A2442 / A2779 / A2918 / A2992 | 0 | n/a | n/a | £2.00 | insufficient data |
| Battery Flex - A2485 / A2780 / A2991 | 0 | n/a | n/a | £3.00 | insufficient data |
| Bottom Lid - A1706 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A1706 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A1707 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A1707 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A1708 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A1708 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A1932 - Gold | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A1932 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A1932 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A1989 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A1989 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A1990 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A1990 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2141 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2141 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2159 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2159 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2179 - Gold | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2179 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2179 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2251 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2251 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2289 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2289 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2337 - Gold | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2337 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2337 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2338 M1 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2338 M1 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2338 M2 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2338 M2 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2442 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2442 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2485 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2485 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2681 - Midnight | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2681 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2681 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2681 - Starlight | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2779 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2779 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2780 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2780 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2918 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2918 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2941 - Midnight | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2941 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2941 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2941 - Starlight | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2991 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2991 - Space Black | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2992 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A2992 - Space Black | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A3113 - Midnight | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A3113 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A3113 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A3113 - Starlight | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A3114 - Midnight | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A3114 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A3114 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Bottom Lid - A3114 - Starlight | 0 | n/a | n/a | n/a | insufficient data |
| Broken Screen -  iPhone SE 2/3 | 0 | n/a | n/a | £11.00 | insufficient data |
| Broken Screen - iPad Air 2 | 0 | n/a | n/a | £0.00 | insufficient data |
| Broken Screen - iPad Air 3 | 0 | n/a | n/a | £0.00 | insufficient data |
| Broken Screen - iPad Air 4 / 5 | 0 | n/a | n/a | £0.00 | insufficient data |
| Broken Screen - iPad Mini 4 / 5 | 0 | n/a | n/a | £0.00 | insufficient data |
| Broken Screen - iPad Mini 6 | 0 | n/a | n/a | £0.00 | insufficient data |
| Broken Screen - iPad Pro 10.5" | 0 | n/a | n/a | £0.00 | insufficient data |
| Broken Screen - iPad Pro 11" 1G / 2G | 0 | n/a | n/a | £0.00 | insufficient data |
| Broken Screen - iPad Pro 11" 3G / 4G | 0 | n/a | n/a | £0.00 | insufficient data |
| Broken Screen - iPad Pro 12.9" 1G | 0 | n/a | n/a | £0.00 | insufficient data |
| Broken Screen - iPad Pro 12.9" 2G | 0 | n/a | n/a | £0.00 | insufficient data |
| Broken Screen - iPad Pro 12.9" 3G / 4G | 0 | n/a | n/a | £0.00 | insufficient data |
| Broken Screen - iPad Pro 12.9" 5G / 6G | 0 | n/a | n/a | £0.00 | insufficient data |
| Broken Screen - iPad Pro 13" 1G | 0 | n/a | n/a | £0.00 | insufficient data |
| Broken Screen - iPad Pro 9.7" | 0 | n/a | n/a | £0.00 | insufficient data |
| Broken Screen - iPhone 11 | 0 | n/a | n/a | £10.00 | insufficient data |
| Broken Screen - iPhone 11 Pro | 0 | n/a | n/a | £20.00 | insufficient data |
| Broken Screen - iPhone 11 Pro Max | 0 | n/a | n/a | £20.00 | insufficient data |
| Broken Screen - iPhone 12 Mini | 0 | n/a | n/a | £45.00 | insufficient data |
| Broken Screen - iPhone 12 Pro Max | 0 | n/a | n/a | £45.00 | insufficient data |
| Broken Screen - iPhone 12/12 Pro | 0 | n/a | n/a | £45.00 | insufficient data |
| Broken Screen - iPhone 13 | 0 | n/a | n/a | £35.00 | insufficient data |
| Broken Screen - iPhone 13 mini | 0 | n/a | n/a | £35.00 | insufficient data |
| Broken Screen - iPhone 13 Pro | 0 | n/a | n/a | £45.00 | insufficient data |
| Broken Screen - iPhone 13 Pro Max | 0 | n/a | n/a | £45.00 | insufficient data |
| Broken Screen - iPhone 14 | 0 | n/a | n/a | £45.00 | insufficient data |
| Broken Screen - iPhone 14 Pro | 0 | n/a | n/a | £65.00 | insufficient data |
| Broken Screen - iPhone 14 Pro Max | 0 | n/a | n/a | £85.00 | insufficient data |
| Broken Screen - iPhone 15 | 0 | n/a | n/a | £50.00 | insufficient data |
| Broken Screen - iPhone 15 Plus | 0 | n/a | n/a | £60.00 | insufficient data |
| Broken Screen - iPhone 15 Pro | 0 | n/a | n/a | £80.00 | insufficient data |
| Broken Screen - iPhone 15 Pro Max | 0 | n/a | n/a | £80.00 | insufficient data |
| Broken Screen - iPhone 16 | 0 | n/a | n/a | £80.00 | insufficient data |
| Broken Screen - iPhone 16 Plus | 0 | n/a | n/a | £80.00 | insufficient data |
| Broken Screen - iPhone 16 Pro | 0 | n/a | n/a | £100.00 | insufficient data |
| Broken Screen - iPhone 16 Pro Max | 0 | n/a | n/a | £120.00 | insufficient data |
| Broken Screen - iPhone 17 | 0 | n/a | n/a | £100.00 | insufficient data |
| Broken Screen - iPhone 17 Pro | 0 | n/a | n/a | £140.00 | insufficient data |
| Broken Screen - iPhone 17 Pro Max | 0 | n/a | n/a | £140.00 | insufficient data |
| Broken Screen - iPhone X | 0 | n/a | n/a | £14.00 | insufficient data |
| Broken Screen - iPhone XS | 0 | n/a | n/a | £14.00 | insufficient data |
| Broken Screen - iPhone XS Max | 0 | n/a | n/a | £18.00 | insufficient data |
| Broken Screen - XR | 0 | n/a | n/a | £10.00 | insufficient data |
| Cable Macbook MagSafe Air/Pro | 0 | n/a | n/a | £15.00 | insufficient data |
| Cable Macbook USB-C Air/Pro | 0 | n/a | n/a | £11.00 | insufficient data |
| Charger MacBook Air  13-inch, (2018 or later) 30W | 0 | n/a | n/a | £15.00 | insufficient data |
| Charger MacBook Air (2022 or later) 35W | 0 | n/a | n/a | £15.00 | insufficient data |
| Charger MacBook Pro 13-inch, 61W (2016 intel - 2020 M1) | 0 | n/a | n/a | £18.00 | insufficient data |
| Charger MacBook Pro 14-inch, 96W(2021 or later) and 16-inch(2019) | 0 | n/a | n/a | £22.00 | insufficient data |
| Charger MacBook Pro 15-inch (2016–2019) 87W A1707, A1990 | 0 | n/a | n/a | £22.00 | insufficient data |
| Charger MacBook Pro 16-inch (2021 or later) 140W | 0 | n/a | n/a | £28.00 | insufficient data |
| Charger MacBook with adapter 100W  Copy | 0 | n/a | n/a | £15.00 | insufficient data |
| Charging Cable | 0 | n/a | n/a | £5.00 | insufficient data |
| Copy Lid A2442 Grade B Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Custom QR Code | 0 | n/a | n/a | n/a | insufficient data |
| Data Recovery (All Models) | 0 | n/a | n/a | £1.00 | insufficient data |
| Display Backlight - iPad Air 2 | 0 | n/a | n/a | n/a | insufficient data |
| Display Backlight - iPad Air 4 / Air 5 | 0 | n/a | n/a | n/a | insufficient data |
| Display Backlight - iPad Air 6 11" / Air 7 11" | 0 | n/a | n/a | n/a | insufficient data |
| Display Backlight - iPad Air 6 13" / Air 7 13" | 0 | n/a | n/a | n/a | insufficient data |
| Display Backlight - iPad Mini 4 / Mini 5 | 0 | n/a | n/a | n/a | insufficient data |
| Display Backlight - iPad Mini 6 / Mini 7 | 0 | n/a | n/a | n/a | insufficient data |
| Display Backlight - iPad Pro  12.9" 1G | 0 | n/a | n/a | n/a | insufficient data |
| Display Backlight - iPad Pro  12.9" 3G / 4G | 0 | n/a | n/a | n/a | insufficient data |
| Display Backlight - iPad Pro  12.9" 5G / 6G | 0 | n/a | n/a | n/a | insufficient data |
| Display Backlight - iPad Pro 10.5 / Air 3 | 0 | n/a | n/a | n/a | insufficient data |
| Display Backlight - iPad Pro 11" 1G / 2G / 3G / 4G | 0 | n/a | n/a | n/a | insufficient data |
| Display Backlight - iPad Pro 12.9" 2G | 0 | n/a | n/a | n/a | insufficient data |
| Display Backlight - iPad Pro 9.7 | 0 | n/a | n/a | n/a | insufficient data |
| Full Screen  Starlight - A2941|A3114 - Grade  Poor | 0 | n/a | n/a | n/a | insufficient data |
| Full Screen (LG) - iPhone 8 Plus - Black | 0 | n/a | n/a | £36.00 | insufficient data |
| Full Screen (LG) - iPhone 8 Plus - White | 0 | n/a | n/a | £36.00 | insufficient data |
| Full Screen (Toshiba) - iPhone 8 Plus - Black | 0 | n/a | n/a | £36.00 | insufficient data |
| Full Screen (Toshiba) - iPhone 8 Plus - White | 0 | n/a | n/a | £36.00 | insufficient data |
| Full Screen (Toshiba) - iPhone XR | 0 | n/a | n/a | £30.00 | insufficient data |
| Full Screen (uni) - iPhone 8/SE2/SE3 - Black | 0 | n/a | n/a | £15.00 | insufficient data |
| Full Screen - A1707- Grade Poor - Grey | 0 | n/a | n/a | n/a | insufficient data |
| Full Screen - A1932 - Grade A - Grey | 0 | n/a | n/a | £100.00 | insufficient data |
| Full Screen - A1932 - Grade A - Rose Gold | 0 | n/a | n/a | £100.00 | insufficient data |
| Full Screen - A1932 - Grade A - Silver | 0 | n/a | n/a | £100.00 | insufficient data |
| Full Screen - A1932 - Grade B - Grey | 0 | n/a | n/a | £90.00 | insufficient data |
| Full Screen - A1932 - Grade B - Rose Gold | 0 | n/a | n/a | £90.00 | insufficient data |
| Full Screen - A1932 - Grade B - Silver | 0 | n/a | n/a | £90.00 | insufficient data |
| Full Screen - A1932 - Grade Poor - Grey | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A1932 - Grade Poor - Rose Gold | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A1932 - Grade Poor - Silver | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A1989|A2159 - Grade A - Grey | 0 | n/a | n/a | £120.00 | insufficient data |
| Full Screen - A1989|A2159 - Grade A - Silver | 0 | n/a | n/a | £120.00 | insufficient data |
| Full Screen - A1989|A2159 - Grade B - Grey | 0 | n/a | n/a | £80.00 | insufficient data |
| Full Screen - A1989|A2159 - Grade B - Silver | 0 | n/a | n/a | £80.00 | insufficient data |
| Full Screen - A1989|A2159 - Grade Poor - Grey | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A1989|A2159 - Grade Poor - Silver | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A1990- Grade Poor - Grey | 0 | n/a | n/a | n/a | insufficient data |
| Full Screen - A2141- Grade A - Grey | 0 | n/a | n/a | £220.00 | insufficient data |
| Full Screen - A2141- Grade A - Silver | 0 | n/a | n/a | £220.00 | insufficient data |
| Full Screen - A2141- Grade B - Grey | 0 | n/a | n/a | £160.00 | insufficient data |
| Full Screen - A2141- Grade B - Silver | 0 | n/a | n/a | £160.00 | insufficient data |
| Full Screen - A2141- Grade Poor - Grey | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A2141- Grade Poor - Silver | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A2179 - Grade A - Gold | 0 | n/a | n/a | £120.00 | insufficient data |
| Full Screen - A2179 - Grade A - Grey | 0 | n/a | n/a | £120.00 | insufficient data |
| Full Screen - A2179 - Grade A - Silver | 0 | n/a | n/a | £120.00 | insufficient data |
| Full Screen - A2179 - Grade B - Gold | 0 | n/a | n/a | £120.00 | insufficient data |
| Full Screen - A2179 - Grade B - Silver | 0 | n/a | n/a | £120.00 | insufficient data |
| Full Screen - A2179 - Grade B- Grey | 0 | n/a | n/a | £120.00 | insufficient data |
| Full Screen - A2179 - Grade Poor - Gold | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A2179 - Grade Poor - Grey | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A2179 - Grade Poor - Silver | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A2251|A2289 - Grade A - Grey | 0 | n/a | n/a | £120.00 | insufficient data |
| Full Screen - A2251|A2289 - Grade A - Silver | 0 | n/a | n/a | £120.00 | insufficient data |
| Full Screen - A2251|A2289 - Grade B - Grey | 0 | n/a | n/a | £120.00 | insufficient data |
| Full Screen - A2251|A2289 - Grade B - Silver | 0 | n/a | n/a | £120.00 | insufficient data |
| Full Screen - A2251|A2289 - Grade Poor - Grey | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A2251|A2289 - Grade Poor - Silver | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A2337 - Grade  Poor - Silver | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A2337 - Grade A - Grey | 0 | n/a | n/a | £140.00 | insufficient data |
| Full Screen - A2337 - Grade A - Rose Gold | 0 | n/a | n/a | £140.00 | insufficient data |
| Full Screen - A2337 - Grade A - Silver | 0 | n/a | n/a | £140.00 | insufficient data |
| Full Screen - A2337 - Grade B - Grey | 0 | n/a | n/a | £140.00 | insufficient data |
| Full Screen - A2337 - Grade B - Rose Gold | 0 | n/a | n/a | £140.00 | insufficient data |
| Full Screen - A2337 - Grade B - Silver | 0 | n/a | n/a | £140.00 | insufficient data |
| Full Screen - A2337 - Grade Poor - Grey | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A2337 - Grade Poor - Rose Gold | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A2338 - Grade A - Grey | 0 | n/a | n/a | £140.00 | insufficient data |
| Full Screen - A2338 - Grade A - Silver | 0 | n/a | n/a | £140.00 | insufficient data |
| Full Screen - A2338 - Grade B - Grey | 0 | n/a | n/a | £140.00 | insufficient data |
| Full Screen - A2338 - Grade B - Silver | 0 | n/a | n/a | £140.00 | insufficient data |
| Full Screen - A2338 - Grade Poor - Grey | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A2338 - Grade Poor - Silver | 0 | n/a | n/a | £55.00 | insufficient data |
| Full Screen - A2442 | A2779 - Grade Poor - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Full Screen - A3240 - Grade A - Midnight | 0 | n/a | n/a | n/a | insufficient data |
| Full Screen - iPhone 11 | 0 | n/a | n/a | £25.00 | insufficient data |
| Full Screen - iPhone 11 Pro | 0 | n/a | n/a | £60.00 | insufficient data |
| Full Screen - iPhone 11 Pro Max | 0 | n/a | n/a | £65.00 | insufficient data |
| Full Screen - iPhone 12 Mini | 0 | n/a | n/a | £35.00 | insufficient data |
| Full Screen - iPhone 12 Pro Max | 0 | n/a | n/a | £40.00 | insufficient data |
| Full Screen - iPhone 12/12 Pro | 0 | n/a | n/a | £35.00 | insufficient data |
| Full Screen - iPhone 13 | 0 | n/a | n/a | £40.00 | insufficient data |
| Full Screen - iPhone 13 Mini | 0 | n/a | n/a | £40.00 | insufficient data |
| Full Screen - iPhone 13 Pro | 0 | n/a | n/a | £50.00 | insufficient data |
| Full Screen - iPhone 13 Pro Max | 0 | n/a | n/a | £70.00 | insufficient data |
| Full Screen - iPhone 14 | 0 | n/a | n/a | £80.00 | insufficient data |
| Full Screen - iPhone 14 Plus | 0 | n/a | n/a | £100.00 | insufficient data |
| Full Screen - iPhone 14 Pro | 0 | n/a | n/a | £100.00 | insufficient data |
| Full Screen - iPhone 14 Pro Max | 0 | n/a | n/a | £120.00 | insufficient data |
| Full Screen - iPhone 15 | 0 | n/a | n/a | £80.00 | insufficient data |
| Full Screen - iPhone 15 Plus | 0 | n/a | n/a | £80.00 | insufficient data |
| Full Screen - iPhone 15 Pro | 0 | n/a | n/a | £130.00 | insufficient data |
| Full Screen - iPhone 15 Pro Max | 0 | n/a | n/a | £150.00 | insufficient data |
| Full Screen - iPhone 16 | 0 | n/a | n/a | £120.00 | insufficient data |
| Full Screen - iPhone 16 Plus | 0 | n/a | n/a | £140.00 | insufficient data |
| Full Screen - iPhone 16 Pro | 0 | n/a | n/a | £220.00 | insufficient data |
| Full Screen - iPhone 16 Pro Max | 0 | n/a | n/a | £250.00 | insufficient data |
| Full Screen - iPhone 17 | 0 | n/a | n/a | n/a | insufficient data |
| Full Screen - iPhone 17 Air | 0 | n/a | n/a | n/a | insufficient data |
| Full Screen - iPhone 17 Pro | 0 | n/a | n/a | n/a | insufficient data |
| Full Screen - iPhone 17 Pro Max | 0 | n/a | n/a | n/a | insufficient data |
| Full Screen - iPhone 17 Pro Max | 0 | n/a | n/a | n/a | insufficient data |
| Full Screen - iPhone 8 - White | 0 | n/a | n/a | n/a | insufficient data |
| Full Screen - iPhone X | 0 | n/a | n/a | £40.00 | insufficient data |
| Full Screen - iPhone XR | 0 | n/a | n/a | £15.00 | insufficient data |
| Full Screen - iPhone XS | 0 | n/a | n/a | £40.00 | insufficient data |
| Full Screen - iPhone XS Max | 0 | n/a | n/a | £20.00 | insufficient data |
| Full Screen - iPod Touch 6th/7th Gen - Black | 0 | n/a | n/a | £13.04 | insufficient data |
| Full Screen - iPod Touch 6th/7th Gen - White | 0 | n/a | n/a | £18.00 | insufficient data |
| Full Screen - Watch S1 38mm | 0 | n/a | n/a | n/a | insufficient data |
| Full Screen - Watch S1 42mm | 0 | n/a | n/a | £60.00 | insufficient data |
| Full Screen - Watch S2/S3 38mm | 0 | n/a | n/a | £80.00 | insufficient data |
| Full Screen - Watch S2/S3 42mm | 0 | n/a | n/a | £76.94 | insufficient data |
| Full Screen - Watch S4 40mm | 0 | n/a | n/a | £80.00 | insufficient data |
| Full Screen - Watch S4 44mm | 0 | n/a | n/a | £100.00 | insufficient data |
| Full Screen - Watch S5/SE 40mm | 0 | n/a | n/a | £20.00 | insufficient data |
| Full Screen - Watch S5/SE 44mm | 0 | n/a | n/a | £20.00 | insufficient data |
| Full Screen - Watch S6 40mm | 0 | n/a | n/a | £120.00 | insufficient data |
| Full Screen - Watch S6 44mm | 0 | n/a | n/a | £60.00 | insufficient data |
| Full Screen - Watch S7 41mm | 0 | n/a | n/a | £4.44 | insufficient data |
| Full Screen - Watch S7 45mm | 0 | n/a | n/a | £1.00 | insufficient data |
| Full Screen - Watch S8 41mm | 0 | n/a | n/a | £40.00 | insufficient data |
| Full Screen - Watch S8 45mm | 0 | n/a | n/a | £1.00 | insufficient data |
| Full Screen - Watch S9 41mm | 0 | n/a | n/a | £100.00 | insufficient data |
| Full Screen - Watch S9 45mm | 0 | n/a | n/a | £1.00 | insufficient data |
| Full Screen Silver - A2941|A3114 - Grade  Poor | 0 | n/a | n/a | n/a | insufficient data |
| Glass Refurb (All Models) | 0 | n/a | n/a | n/a | insufficient data |
| Glass Screen - Watch S1 38mm | 0 | n/a | n/a | £60.00 | insufficient data |
| Glass Screen - Watch S1 42mm | 0 | n/a | n/a | n/a | insufficient data |
| Glass Screen - Watch S2/S3 38mm | 0 | n/a | n/a | n/a | insufficient data |
| Glass Screen - Watch S2/S3 42mm | 0 | n/a | n/a | n/a | insufficient data |
| Glass Screen - Watch S4 40mm | 0 | n/a | n/a | n/a | insufficient data |
| Glass Screen - Watch S4 44mm | 0 | n/a | n/a | n/a | insufficient data |
| Glass Screen - Watch S5/SE 40mm | 0 | n/a | n/a | n/a | insufficient data |
| Glass Screen - Watch S5/SE 44mm | 0 | n/a | n/a | n/a | insufficient data |
| Glass Screen - Watch S6 40mm | 0 | n/a | n/a | n/a | insufficient data |
| Glass Screen - Watch S6 44mm | 0 | n/a | n/a | n/a | insufficient data |
| Glass Screen - Watch S7 41mm | 0 | n/a | n/a | n/a | insufficient data |
| Glass Screen - Watch S7 45mm | 0 | n/a | n/a | n/a | insufficient data |
| Glass Screen - Watch S8 41mm | 0 | n/a | n/a | n/a | insufficient data |
| Glass Screen - Watch S8 45mm | 0 | n/a | n/a | n/a | insufficient data |
| Glass Screen - Watch S9 41mm | 0 | n/a | n/a | n/a | insufficient data |
| Glass Screen - Watch S9 45mm | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA  and Touch)  - iPad Pro 12.9" 2G (Black) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA  and Touch)  - iPad Pro 12.9" 2G (White) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch)  - iPad Pro 11" 1G / 2G | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch)  - iPad Pro 11" 3G / 4G | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch)  - iPad Pro 12.9" 1G (Black) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch)  - iPad Pro 12.9" 1G (White) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch)  - iPad Pro 12.9" 3G / 4G | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch)  - iPad Pro 12.9" 5G / 6G | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch)  - iPad Pro 13" 7G | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch) - iPad Air 2 (Black) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch) - iPad Air 2 (White) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch) - iPad Air 4 / Air 5 | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch) - iPad Air 6 11" / Air 7 11" | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch) - iPad Air 6 13" / Air 7 13" | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch) - iPad Mini 4 (Black) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch) - iPad Mini 4 (White) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch) - iPad Mini 5 (Black) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch) - iPad Mini 5 (White) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch) - iPad Mini 6 / Mini 7 | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch) - iPad Pro 10.5 / Air 3 (Black) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch) - iPad Pro 10.5 / Air 3 (White) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch) - iPad Pro 9.7 (Black) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA and Touch) - iPad Pro 9.7 (White) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA with Touch)  - iPad Pro 11" 5G | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA)  - iPad Pro 11" 1G / 2G | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA)  - iPad Pro 11" 3G / 4G | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA)  - iPad Pro 11" 5G | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA)  - iPad Pro 12.9" 1G (Black) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA)  - iPad Pro 12.9" 1G (White) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA)  - iPad Pro 12.9" 2G (Black) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA)  - iPad Pro 12.9" 2G (White) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA)  - iPad Pro 12.9" 3G / 4G | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA)  - iPad Pro 12.9" 5G / 6G | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA)  - iPad Pro 13" 7G | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA) - iPad Air 4 / Air 5 | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA) - iPad Air 6 11" / Air 7 11" | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA) - iPad Air 6 13" / Air 7 13" | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA) - iPad Mini 6 / Mini 7 | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA) - iPad Pro 10.5 / Air 3 (Black) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA) - iPad Pro 10.5 / Air 3 (White) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA) - iPad Pro 9.7 (Black) | 0 | n/a | n/a | n/a | insufficient data |
| Glass with (OCA) - iPad Pro 9.7 (White) | 0 | n/a | n/a | n/a | insufficient data |
| Glass+Touch Refurb (All Models) | 0 | n/a | n/a | n/a | insufficient data |
| Hall Sensor - A2141 | 0 | n/a | n/a | £5.00 | insufficient data |
| Hall Sensor - A2442 / A2779 / A2918 / A2992 | 0 | n/a | n/a | £7.00 | insufficient data |
| Hall Sensor - A2485 / A2780 / A2991 | 0 | n/a | n/a | £7.00 | insufficient data |
| Hall Sensor - A2681 / A3113 | 0 | n/a | n/a | £5.00 | insufficient data |
| Hall Sensor - A2941 / A3114 | 0 | n/a | n/a | £7.00 | insufficient data |
| Hall Sensor - A3240 | 0 | n/a | n/a | n/a | insufficient data |
| Hall Sensor - A3240 (Apple Genuine) | 0 | n/a | n/a | n/a | insufficient data |
| Hydrogel Protector  (iPad) | 0 | n/a | n/a | £2.08 | insufficient data |
| Hydrogel Protector (iPhone) | 0 | n/a | n/a | £0.50 | insufficient data |
| Hydrogel Protector (Watch) | 0 | n/a | n/a | £2.00 | insufficient data |
| IC Swap | 0 | n/a | n/a | £1.00 | insufficient data |
| iCloud Logic Board | 0 | n/a | n/a | n/a | insufficient data |
| Index: A2141 (276) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S1 38mm (37) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S1 42mm (38) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S2 38mm (39) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S2 42mm (40) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S3 38mm (41) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S3 42mm (42) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S4 40mm (59) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S4 44mm (75) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S5 40mm (148) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S5 44mm (149) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S6 40mm (188) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S6 44mm (187) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S7 41mm (210) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S7 45mm (211) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S8 41mm (277) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch S8 45mm (278) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch SE 40mm (170) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch SE 44mm (171) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Apple Watch Ultra (279) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Device (155) | 0 | n/a | n/a | n/a | insufficient data |
| Index: FVFX61AFHV2F (226) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iMac 27 (179) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad 10 (280) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad 2 (16) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad 3 (17) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad 4 (18) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad 5 (19) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad 6 (20) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad 7 (79) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad 8 (156) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad 9 (199) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Air (21) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Air 2 (22) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Air 3 (23) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Air 4 (174) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Air 5 (256) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Mini (45) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Mini 2 (46) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Mini 3 (47) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Mini 4 (48) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Mini 5 (70) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Mini 6 (213) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 10.5 (234) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 10.5 (25) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 11 (238) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 11 (29) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 11 (2G) (151) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 11 (2G) (236) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 11 (3G) (203) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 11 (4G) (282) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 12.9 (1G) (235) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 12.9 (1G) (26) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 12.9 (2G) (260) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 12.9 (2G) (27) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 12.9 (3G) (233) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 12.9 (3G) (28) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 12.9 (4G) (120) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 12.9 (4G) (230) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 12.9 (5G) (212) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 12.9 (5G) (245) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 12.9 (6G) (281) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 9.7 (24) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPad Pro 9.7 (268) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 11 (76) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 11 Pro (77) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 11 Pro Max (78) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 12 (176) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 12 Mini (175) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 12 Pro (177) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 12 Pro Max (178) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 13 (206) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 13 Mini (207) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 13 Pro (208) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 13 Pro Max (209) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 14 (249) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 14 Max (250) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 14 Pro (251) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 14 Pro Max (248) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 4 (58) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 4s (194) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 5 (1) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 5C (135) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 5S (4) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 6 (6) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 6 Plus (7) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 6s (2) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 6S Plus (8) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 7 (3) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 7 Plus (9) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 8 (10) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone 8 Plus (11) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone SE (5) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone SE2 (81) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone SE3 (237) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone X (12) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone XR (15) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone XS (13) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPhone XS Max (14) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPod Touch 5th Gen (43) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPod Touch 6th Gen (44) | 0 | n/a | n/a | n/a | insufficient data |
| Index: iPod Touch 7th Gen (154) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook (204) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook 12 A1534(2015) (34) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook 12 A1534(2016) (118) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook 12 A1534(2017) (119) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook 12 A1534(All Years) (158) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook A1398(All Years) (246) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook A1502(All Years) (242) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook A1706(All Years) (261) | 0 | n/a | n/a | £0.00 | insufficient data |
| Index: MacBook A1707(All Years) (247) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook A1708(All Years) (267) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook A1932(All Years) (274) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook A1989(All Years) (273) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook A1990 (All Years) (265) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook A2159(All Years) (283) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook A2179(2020) (257) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook A2237 (2020) DELETE ME (198) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook A2251(2020) (266) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook A2289 (2020) (254) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook A2338(2020) (241) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 11 A1370(2010) (35) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 11 A1370(2011) (83) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 11 A1370(All Years) (159) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 11 A1465(2012) (87) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 11 A1465(2013) (88) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 11 A1465(2014) (89) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 11 A1465(2015) (90) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 11 A1465(All Years) (160) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 'M2' A2681 (2022) (269) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1369 (84) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1369(2010) (36) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1369(2011) (85) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1369(2012) (86) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1369(All Years) (161) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1466(2012) (91) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1466(2013) (92) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1466(2014) (93) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1466(2015) (94) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1466(2016) (152) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1466(2017) (95) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1466(All Years) (162) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1502(All Years) (165) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1932(2018) (72) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1932(2019) (96) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1932(2020) (147) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A1932(All Years) (163) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Air 13 A2179(2020) (172) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook M1 Air 13 A2237 (All Years) DELETE ME (200) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook M1 Air 13 A2337 (2020) (202) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook M1 Air 13 A2337 (All Years) (225) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook M1 Pro 14 A2442(2021) (229) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13  A2251(2020) (192) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 'M2' A2338 (2022) (271) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1278(2009) (51) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1278(2010) (97) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1278(2011) (98) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1278(2012) (122) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1278(Late2011) (134) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1425(2013) (110) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1425(All Years) (164) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1502(2013) (107) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1502(2014) (108) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1502(2015) (109) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1706(2016) (31) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1706(2017) (111) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1706(All Years) (166) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1708(2016) (113) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1708(2017) (114) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1708(All Years) (167) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1989 (2018) (73) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1989(2019) (115) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1989(All Years) (168) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A1989(All Years) (232) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A2159(2019) (220) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A2159(All Years) (150) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 13 A2289 (2020) (205) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 14 'M1 Pro/Max' A2442 (2021) (270) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 15 A1286(All Years) (74) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 15 A1398(2012) (32) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 15 A1398(2014) (105) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 15 A1398(2015) (106) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 15 A1398(All Years) (157) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 15 A1398(Early 2013) (104) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 15 A1398(Late 2013) (218) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 15 A1425(2012) (30) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 15 A1707(2016) (33) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 15 A1707(2017) (112) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 15 A1707(All Years) (169) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Macbook Pro 15 A1707(All Years) (214) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 15 A1990 (All Years) (217) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 15 A1990(2018) (116) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 15 A1990(2018) (219) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 15 A1990(2019) (117) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 16 'M1 Pro/Max' A2485 (2021) (272) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 16 A2141(2019) (80) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 16 A2141(2021) (231) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 17 A1297(2009) (100) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 17 A1297(2010) (101) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 17 A1297(2012) (103) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro 17 A1297(Early2011) (102) | 0 | n/a | n/a | n/a | insufficient data |
| Index: MacBook Pro M1 13 A2338(2020) (182) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Other (See Notes) (49) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Samsung (All) (227) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Samsung A310 (195) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Samsung A320 (50) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Samsung A41 (189) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Samsung A510 (56) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Samsung Galaxy A3 (53) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Samsung J5 (2017) (190) | 0 | n/a | n/a | n/a | insufficient data |
| Index: TEST DEVICE (173) | 0 | n/a | n/a | n/a | insufficient data |
| Index: univ (228) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Zara iPods (57) | 0 | n/a | n/a | n/a | insufficient data |
| Index: Zebra PDA (201) | 0 | n/a | n/a | n/a | insufficient data |
| iPad 10 (4G) Charging Port | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad 10 (Wi-Fi) Charging Port | 0 | n/a | n/a | n/a | insufficient data |
| iPad 10 Battery | 0 | n/a | n/a | £21.50 | insufficient data |
| iPad 2 Battery | 0 | n/a | n/a | £9.00 | insufficient data |
| iPad 2 Charging Port Silver | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad 3 Charging Port Silver | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad 3/4 Battery | 0 | n/a | n/a | £9.00 | insufficient data |
| iPad 4 Charging Port Silver | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad 5 Home Button White | 0 | n/a | n/a | £10.00 | insufficient data |
| iPad 5 Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad 5/6/7/8 Air Battery | 0 | n/a | n/a | £8.26 | insufficient data |
| iPad 6 Charging Port Black | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad 6 Charging Port White | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad 6 Home Button Black | 0 | n/a | n/a | £20.00 | insufficient data |
| iPad 6 Home Button White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad 7 Headphone Jack Black | 0 | n/a | n/a | £2.15 | insufficient data |
| iPad 7 Headphone Jack White | 0 | n/a | n/a | £2.59 | insufficient data |
| iPad 7/8 Charging Port White | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad 7/8 Home Button Black | 0 | n/a | n/a | £5.58 | insufficient data |
| iPad 7/8 Home Button White | 0 | n/a | n/a | £4.59 | insufficient data |
| iPad 7/8/9 Charging Port Black | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad 8 Home Button Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad 9 Battery | 0 | n/a | n/a | £8.19 | insufficient data |
| iPad 9 Charging Port | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad 9 Home Button Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Air 2 Battery | 0 | n/a | n/a | £8.35 | insufficient data |
| iPad Air 2 Charging Port Black | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Air 2 Charging Port White | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Air 2 Power Button | 0 | n/a | n/a | £10.00 | insufficient data |
| iPad Air 2 Rear Camera | 0 | n/a | n/a | £10.00 | insufficient data |
| iPad Air 2/Mini 4/Mini 5/Pro 12.9 1G Home Button Black | 0 | n/a | n/a | £5.50 | insufficient data |
| iPad Air 2/Mini 4/Mini 5/Pro 12.9 1G Home Button White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Air 3 Battery | 0 | n/a | n/a | £21.50 | insufficient data |
| iPad Air 3 Home Button Space Grey | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Air 3/Pro 10.5 Charging Port | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Air 4 Battery | 0 | n/a | n/a | £20.00 | insufficient data |
| iPad Air 4 Front Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Air 4 Power Button | 0 | n/a | n/a | £40.00 | insufficient data |
| iPad Air 4/5 (4G) Charging Port Black | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Air 4/5 (4G)Charging Port White | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Air 4/5 (Wi-Fi) Charging Port | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Air 5 Battery | 0 | n/a | n/a | £21.50 | insufficient data |
| iPad Air Charging Port Black | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Air Charging Port White | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Air Home Button Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Air Home Button White | 0 | n/a | n/a | £10.00 | insufficient data |
| iPad Air Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Diagnostic | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Logic Board | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Mini 2 Home Button Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Mini 2 Home Button White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Mini 2 Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Mini 2/3 Battery | 0 | n/a | n/a | £9.00 | insufficient data |
| iPad Mini 2/Mini 3 Charging Port Black | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Mini 2/Mini 3 Charging Port White | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Mini 3 Home Button Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Mini 3 Home Button White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Mini 3 Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Mini 4 Battery | 0 | n/a | n/a | £9.00 | insufficient data |
| iPad Mini 4 Home Button Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Mini 4 Home Button White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Mini 4 Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Mini 4 Wifi | 0 | n/a | n/a | £20.00 | insufficient data |
| iPad Mini 4/5 Charging Port Black | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Mini 4/5 Charging Port White | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Mini 5 Battery | 0 | n/a | n/a | £20.00 | insufficient data |
| iPad Mini 5 Headphone Jack | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Mini 5 Home Button White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Mini 5 Liquid Damage Treatment | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Mini 5 Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Mini 6 Battery | 0 | n/a | n/a | £19.30 | insufficient data |
| iPad Mini 6 Charging Port Space Grey | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Mini Battery | 0 | n/a | n/a | £10.00 | insufficient data |
| iPad Mini Charging Port Silver | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Mini Charging Port Space Grey | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Pro 10.5 Battery | 0 | n/a | n/a | £20.00 | insufficient data |
| iPad Pro 10.5 Home Button Gold | 0 | n/a | n/a | £5.00 | insufficient data |
| iPad Pro 10.5 inch Charging Port Black | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Pro 10.5 Inch Charging Port White | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Pro 10.5 inch Power Button | 0 | n/a | n/a | £20.00 | insufficient data |
| iPad Pro 10.5/12.9 2G Home Button Black | 0 | n/a | n/a | £20.00 | insufficient data |
| iPad Pro 10.5/12.9 2G Home Button White | 0 | n/a | n/a | £20.00 | insufficient data |
| iPad Pro 11 (1G/2G)/12.9 (3G/4G) Charging Port Black | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Pro 11 (2G) Battery | 0 | n/a | n/a | £18.69 | insufficient data |
| iPad Pro 11 (2G) Proximity Sensor | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 11 (3G) Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 11 (3G/4G)/12.9 5G/6G Charging Port | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Pro 11 (4G) Battery | 0 | n/a | n/a | £20.00 | insufficient data |
| iPad Pro 11 (4G) Face ID | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 11 Battery | 0 | n/a | n/a | £20.00 | insufficient data |
| iPad Pro 11 Face ID | 0 | n/a | n/a | £30.00 | insufficient data |
| iPad Pro 11 inch (1G/2G) Charging Port Black | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Pro 11 inch (1G/2G) Charging Port White | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Pro 11 inch (2G) Home Button Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 11 inch (2G) Home Button White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 11 inch (2G) Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 11 inch (5G) Charging Port Space Black | 0 | n/a | n/a | n/a | insufficient data |
| iPad Pro 11 inch Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 11in (2G) Face ID | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 11in (3G) Battery | 0 | n/a | n/a | £50.00 | insufficient data |
| iPad Pro 11in (3G) Face ID | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9 (3G) Bluetooth Module | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9 (3G) Face ID | 0 | n/a | n/a | £50.00 | insufficient data |
| iPad Pro 12.9 (5G) Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9 (6G) Face ID | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9 1G Charging Port | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Pro 12.9 2G Charging Port (Wifi and 4G) | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Pro 12.9 2G Charging Port (Wifi Only) | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Pro 12.9 Inch (1G) Battery | 0 | n/a | n/a | £12.10 | insufficient data |
| iPad Pro 12.9 inch (1G) Mute Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9 inch (1G) Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9 inch (1G) Volume Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9 Inch (2G) Battery | 0 | n/a | n/a | £30.00 | insufficient data |
| iPad Pro 12.9 inch (2G) Mute Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9 inch (2G) Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9 inch (2G) Volume Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9 inch (3G) Mute Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9 inch (3G) Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9 inch (3G) Volume Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9 inch (3G/4G) Battery | 0 | n/a | n/a | £23.99 | insufficient data |
| iPad Pro 12.9 inch (3G/4G) Charging Port White | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Pro 12.9 inch (4G) Mute Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9 inch (4G) Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9 inch (4G) Volume Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9in (4G) Face ID | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9in (4G) Proximity Sensor | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9in (5G) Face ID | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 12.9in (5G/6G) Battery | 0 | n/a | n/a | £26.00 | insufficient data |
| iPad Pro 9.7 Charging Port White | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Pro 9.7 Headphone Jack Black | 0 | n/a | n/a | £12.00 | insufficient data |
| iPad Pro 9.7 Home Button Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 9.7 Home Button White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Pro 9.7 Inch Battery | 0 | n/a | n/a | £8.90 | insufficient data |
| iPad Pro 9.7 inch Charging Port Black | 0 | n/a | n/a | £4.80 | insufficient data |
| iPad Pro 9.7 Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPad Software Reinstallation | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Battery (3110 mAh) | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 11 Charging Port/Microphone Black | 0 | n/a | n/a | £30.00 | insufficient data |
| iPhone 11 Charging Port/Microphone White | 0 | n/a | n/a | £30.00 | insufficient data |
| iPhone 11 Earpiece | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 11 Face ID | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 11 Flash/Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Front Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Mesh | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Pro / 11 Pro Max Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 11 Pro Battery (3046 mAh) | 0 | n/a | n/a | £2.00 | insufficient data |
| iPhone 11 Pro Charging Port/Microphone White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Pro Charging Port/Microphone/ Black | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 11 Pro Earpiece | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Pro Face ID (All Colours) | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Pro Flash/Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Pro Front Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Pro Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Pro Max Battery (3969 mAh) | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 11 Pro Max Charging Port/Microphone Black | 0 | n/a | n/a | £30.00 | insufficient data |
| iPhone 11 Pro Max Charging Port/Microphone White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Pro Max Earpiece | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Pro Max Earpiece Mesh | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Pro Max Face ID (All Colours) | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 11 Pro Max Flash/Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Pro Max Front Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Pro Max Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Pro Max Proximity Sensor/Earpiece Flex | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 11 Pro Max Rear Housing Gold | 0 | n/a | n/a | £70.00 | insufficient data |
| iPhone 11 Pro Max Rear Housing Green | 0 | n/a | n/a | £60.00 | insufficient data |
| iPhone 11 Pro Max Rear Housing Silver | 0 | n/a | n/a | £70.00 | insufficient data |
| iPhone 11 Pro Max Rear Housing Space Grey | 0 | n/a | n/a | £55.00 | insufficient data |
| iPhone 11 Pro Max Rear Microphone | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 11 Pro Max Wireless Charging/Volume/Mute Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Pro Proximity Sensor/Earpiece Flex | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 11 Pro Rear Housing Gold | 0 | n/a | n/a | £70.00 | insufficient data |
| iPhone 11 Pro Rear Housing Green | 0 | n/a | n/a | £70.00 | insufficient data |
| iPhone 11 Pro Rear Housing Silver | 0 | n/a | n/a | £70.00 | insufficient data |
| iPhone 11 Pro Rear Housing Space Grey | 0 | n/a | n/a | £70.00 | insufficient data |
| iPhone 11 Pro Rear Lens | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 11 Pro Wireless Charging/Volume/Mute Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 11 Pro/11 Pro Max Rear Lens | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 11 Proximity Sensor/Earpiece Flex | 0 | n/a | n/a | £30.00 | insufficient data |
| iPhone 11 Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 11 Rear Housing Black | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 11 Rear Housing Green | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 11 Rear Housing Purple | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 11 Rear Housing Red | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 11 Rear Housing White | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 11 Rear Housing Yellow | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 11 Wireless Charging/Volume/Mute Button | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 11/iPhone 12 Mini Rear Lens | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 11/XR Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Earpiece | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 12 Face ID | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 12 Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Microphone | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Mini Battery | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 12 Mini Charging Port Black | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 12 Mini Charging Port White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Mini Earpiece | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Mini Face ID | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Mini Front Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Mini Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Mini Microphone | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Mini Mute/Volume/Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Mini Proximity Sensor/Earpiece Flex | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Mini Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 12 Mini Rear Housing Black | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 12 Mini Rear Housing Blue | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 12 Mini Rear Housing Green | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 12 Mini Rear Housing Purple | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 12 Mini Rear Housing Red | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 12 Mini Rear Housing White | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 12 Power/Volume/Mute Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Pro Apple Boot | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Pro Earpiece | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 12 Pro Face ID | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Pro Max Battery (3687 mAh) | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 12 Pro Max Charging Port/Microphone Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Pro Max Charging Port/Microphone Gold | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Pro Max Charging Port/Microphone White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Pro Max Earpiece | 0 | n/a | n/a | £13.57 | insufficient data |
| iPhone 12 Pro Max Face ID | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Pro Max Front Camera | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 12 Pro Max Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Pro Max Microphone | 0 | n/a | n/a | £2.50 | insufficient data |
| iPhone 12 Pro Max No SIM | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Pro Max Power/Volume/Mute Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Pro Max Proximity Sensor/ Earpiece Flex | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Pro Max Rear Camera | 0 | n/a | n/a | £45.00 | insufficient data |
| iPhone 12 Pro Max Rear Housing Gold | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 12 Pro Max Rear Housing Graphite | 0 | n/a | n/a | £60.00 | insufficient data |
| iPhone 12 Pro Max Rear Housing Pacific Blue | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 12 Pro Max Rear Housing Silver | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 12 Pro Max Rear Lens | 0 | n/a | n/a | £2.83 | insufficient data |
| iPhone 12 Pro Microphone | 0 | n/a | n/a | £2.50 | insufficient data |
| iPhone 12 Pro Mute Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Pro Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Pro Rear Camera | 0 | n/a | n/a | £55.00 | insufficient data |
| iPhone 12 Pro Rear Housing Gold | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 12 Pro Rear Housing Graphite | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 12 Pro Rear Housing Pacific Blue | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 12 Pro Rear Housing Silver | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 12 Pro Volume Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 12 Rear Housing Black | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 12 Rear Housing Blue | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 12 Rear Housing Green | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12 Rear Housing Purple | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 12 Rear Housing Red | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 12 Rear Housing White | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 12/12 Pro Battery (2815 mAh) | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 12/12 Pro Charging Port Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12/12 Pro Charging Port White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12/12 Pro Front Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12/12 Pro Proximity Sensor/Earpiece Flex | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 12/12 Pro Rear Lens | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 13 / 13 Mini Rear Camera | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 13 Battery | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 13 Charging Port Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Charging Port Space Grey | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Charging Port White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Earpiece | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Front Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Microphone | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Mini Battery | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 13 Mini Charging Port Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Mini Charging Port White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Mini Earpiece | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Mini Front Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Mini Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Mini Microphone | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Mini Mute Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Mini Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 mini Proximity Sensor | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 13 Mini Rear Housing Blue | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 13 Mini Rear Housing Green | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 13 Mini Rear Housing Midnight | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 13 Mini Rear Housing Pink | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 13 Mini Rear Housing Red | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 13 Mini Rear Housing Starlight | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 13 Mini Rear Lens | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Mini Volume Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Mute Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro / 13 Pro Max Rear Camera | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 13 Pro Battery | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 13 Pro Charging Port Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Charging Port White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Earpiece | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Face ID | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Front Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Max Battery | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 13 Pro Max Charging Port Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Max Charging Port White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Max Earpiece | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Max Front Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Max Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Max Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Max Microphone | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Max Mute Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Max Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Max Rear Housing Alpine Green | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 13 Pro Max Rear Housing Gold | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 13 Pro Max Rear Housing Graphite | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 13 Pro Max Rear Housing Sierra Blue | 0 | n/a | n/a | £0.00 | insufficient data |
| iPhone 13 Pro Max Rear Housing Silver | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 13 Pro Max Rear Lens | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 13 Pro Max Volume Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Microphone | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Mute Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Proximity Sensor | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro Rear Housing Alpine Green | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 13 Pro Rear Housing Gold | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 13 Pro Rear Housing Graphite | 0 | n/a | n/a | £70.00 | insufficient data |
| iPhone 13 Pro Rear Housing Sierra Blue | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 13 Pro Rear Housing Silver | 0 | n/a | n/a | £100.00 | insufficient data |
| iPhone 13 Pro Volume Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Pro/13 Pro Max Rear Lens | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 13 Rear Housing Blue | 0 | n/a | n/a | £60.00 | insufficient data |
| iPhone 13 Rear Housing Green | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 13 Rear Housing Midnight | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 13 Rear Housing Pink | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 13 Rear Housing Red | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 13 Rear Housing Starlight | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 13 Rear Lens | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 13 Volume Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 14 Battery | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 14 Mid Frame Blue | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 14 Mid Frame Midnight | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 14 Mid Frame Red | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 14 Mid Frame Starlight | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 14 Mid Frame Yellow | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 14 Plus Battery | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 14 Plus Mid Frame Midnight | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 14 Plus Mid Frame Purple | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 14 Plus Mid Frame Red | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 14 Plus Mid Frame Starlight | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 14 Plus Mid Frame Yellow | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 14 Plus Proximity Sensor | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 14 Plus Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 14 Plus Rear Glass Midnight | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 14 Plus Rear Glass Purple | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 14 Plus Rear Glass Red | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 14 Plus Rear Glass Starlight | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 14 Plus Rear Glass Yellow | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 14 Pro Battery | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 14 Pro Charging Port | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 14 Pro Max Battery | 0 | n/a | n/a | £0.75 | insufficient data |
| iPhone 14 Pro Max Charging Port (Black) | 0 | n/a | n/a | £15.84 | insufficient data |
| iPhone 14 Pro Max Charging Port (White) | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 14 Pro Max Earpiece | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 14 Pro Max Front Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 14 Pro Max Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 14 Pro Max Proximity Sensor | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 14 Pro Max Rear Camera | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 14 Pro Max Rear Housing Deep Purple | 0 | n/a | n/a | £85.00 | insufficient data |
| iPhone 14 Pro Max Rear Housing Gold | 0 | n/a | n/a | £85.00 | insufficient data |
| iPhone 14 Pro Max Rear Housing Silver | 0 | n/a | n/a | £85.00 | insufficient data |
| iPhone 14 Pro Max Rear Housing Space Black | 0 | n/a | n/a | £85.00 | insufficient data |
| iPhone 14 Pro Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 14 Pro Rear Housing Deep Purple | 0 | n/a | n/a | £85.00 | insufficient data |
| iPhone 14 Pro Rear Housing Gold | 0 | n/a | n/a | £85.00 | insufficient data |
| iPhone 14 Pro Rear Housing Silver | 0 | n/a | n/a | £85.00 | insufficient data |
| iPhone 14 Pro Rear Housing Space Black | 0 | n/a | n/a | £85.00 | insufficient data |
| iPhone 14 Pro/Pro Max Rear Lens | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 14 Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 14 Rear Glass Blue | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 14 Rear Glass Midnight | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 14 Rear Glass Purple | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 14 Rear Glass Red | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 14 Rear Glass Starlight | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 14 Rear Glass Yellow | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 14 Rear Lens | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 15 / 15 Plus Rear Camera | 0 | n/a | n/a | £30.00 | insufficient data |
| iPhone 15 Battery | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 15 Mid Frame Black | 0 | n/a | n/a | £60.00 | insufficient data |
| iPhone 15 Mid Frame Blue | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 15 Mid Frame Green | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 15 Mid Frame Pink | 0 | n/a | n/a | £0.00 | insufficient data |
| iPhone 15 Plus Battery | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 15 Plus Mid Frame Black | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 15 Plus Mid Frame Blue | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 15 Plus Mid Frame Green | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 15 Plus Mid Frame Pink | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 15 Plus Mid Frame Yellow | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 15 Plus Rear Glass Black | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 15 Plus Rear Glass Blue | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 15 Plus Rear Glass Green | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 15 Plus Rear Glass Pink | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 15 Plus Rear Glass Yellow | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 15 Pro Battery | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 15 Pro Max Battery | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 15 Pro Max Mid Frame Black Titanium | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 15 Pro Max Mid Frame Blue Titanium | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone 15 Pro Max Mid Frame Natural Titanium | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 15 Pro Max Mid Frame White Titanium | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 15 Pro Max Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 15 Pro Max Rear Glass Black Titanium | 0 | n/a | n/a | £55.00 | insufficient data |
| iPhone 15 Pro Max Rear Glass Blue Titanium | 0 | n/a | n/a | £55.00 | insufficient data |
| iPhone 15 Pro Max Rear Glass Natural Titanium | 0 | n/a | n/a | £55.00 | insufficient data |
| iPhone 15 Pro Max Rear Glass White  Titanium | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 15 Pro Mid Frame Black Titanium | 0 | n/a | n/a | £110.00 | insufficient data |
| iPhone 15 Pro Mid Frame Blue Titanium | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 15 Pro Mid Frame Natural Titanium | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 15 Pro Mid Frame White Titanium | 0 | n/a | n/a | £90.00 | insufficient data |
| iPhone 15 Pro Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 15 Pro Rear Glass Black Titanium | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 15 Pro Rear Glass Blue  Titanium | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 15 Pro Rear Glass Natural Titanium | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 15 Pro Rear Glass White  Titanium | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 15 Rear Glass Black | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 15 Rear Glass Blue | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 15 Rear Glass Green | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 15 Rear Glass Pink | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 16 Battery | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 16 Plus Battery | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 16 Pro Battery | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 16 Pro Black Titanium | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 16 Pro Bottom Microphone with Air Pressure Sensor | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 16 Pro Charging Port (Black) | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 16 Pro Charging Port (White) | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 16 Pro Desert Titanium | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 16 Pro Max Battery | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 16 Pro Max Black Titanium | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 16 Pro Max Charging Port (Black) | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 16 Pro Max Charging Port (White) | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 16 Pro Max Desert Titanium | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 16 Pro Max Natural Titanium | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 16 Pro Max White Titanium | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 16 Pro Natural Titanium | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 16 Pro Vibrator | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 16 Pro White Titanium | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 16 Rear Camera | 0 | n/a | n/a | n/a | insufficient data |
| iPhone 4 Battery | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 5 Battery | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 5 Charging Port Black | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 5 Charging Port White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 5 Earpiece | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 5 Front Screen - Black | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 5 Front Screen - White | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 5 Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 5C Battery | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 5C Front Screen - Black | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 5S Battery (1560 mAh) | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 5S/SE Front Screen - Black | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 5S/SE Front Screen - White | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 5S/SE Wifi Module | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6 Battery (1810 mAh) | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 6 Charging Port/Microphone/Headphone Jack Black | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 6 Charging Port/Microphone/Headphone Jack White | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 6 Earpiece | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 6 Front Camera/Proximity Sensor | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 6 Front Screen - Black | 0 | n/a | n/a | £14.65 | insufficient data |
| iPhone 6 Front Screen - White | 0 | n/a | n/a | £14.65 | insufficient data |
| iPhone 6 Home Button Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6 Home Button White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6 Loudspeaker | 0 | n/a | n/a | £2.00 | insufficient data |
| iPhone 6 Plus Battery (2915 mAh) | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 6 Plus Charging Port/Microphone/Headphone Jack Black | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 6 Plus Charging Port/Microphone/Headphone Jack White | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 6 Plus Earpiece | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6 Plus Front Camera/Proximity Sensor | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6 Plus Front Screen - Black | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 6 Plus Front Screen - White | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 6 Plus Home Button Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6 Plus Home Button White | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6 Plus Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6 Plus Power/Volume/Mute Button | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 6 Plus Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 6 Plus Rear Lens | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6 Plus Wifi Module | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6 Power/Volume/Mute Button | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 6 Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 6 Rear Lens | 0 | n/a | n/a | £2.00 | insufficient data |
| iPhone 6 Wifi IC | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6 Wifi Module | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6S Battery (1715 mAh) | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 6S Charging Port/Microphone/Headphone Jack Black | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 6S Charging Port/Microphone/Headphone Jack White | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 6S Front Camera | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 6S Front Screen - Black | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 6S Front Screen - White | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 6S Home Button Black | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 6S Home Button White | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 6S Loudspeaker | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 6S Plus Battery (2750 mAh) | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 6S Plus Charging Port/Microphone/Headphone Jack Black | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 6S Plus Charging Port/Microphone/Headphone Jack White | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 6S Plus Front Camera/Proximity Sensor | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6S Plus Front Screen - Black | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 6S Plus Front Screen - White | 0 | n/a | n/a | £22.00 | insufficient data |
| iPhone 6S Plus Haptic | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6S Plus Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6S Plus Mesh | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6S Plus Power/Volume/Mute Button | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 6S Plus Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 6S Plus Rear Lens | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 6S Power/Volume/Mute Button | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 6S Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 6S Rear Lens | 0 | n/a | n/a | £111.00 | insufficient data |
| iPhone 6S/6S Plus Earpiece | 0 | n/a | n/a | £2.00 | insufficient data |
| iPhone 7 Battery (1960 mAh) | 0 | n/a | n/a | £2.50 | insufficient data |
| iPhone 7 Charging Port/Microphone Black | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 7 Charging Port/Microphone White | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 7 Front Camera/Proximity Sensor | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 7 Front Screen - Black | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 7 Front Screen - White | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 7 Liquid Damage Treatment | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 7 Plus / 8 Plus Rear Lens | 0 | n/a | n/a | £3.00 | insufficient data |
| iPhone 7 Plus Battery (2900 mAh) | 0 | n/a | n/a | £8.00 | insufficient data |
| iPhone 7 Plus Charging Port/Microphone Black | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 7 Plus Charging Port/Microphone White | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 7 Plus Front Camera/Proximity Sensor | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 7 Plus Front Screen (LG) - Black | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 7 Plus Front Screen (LG) - White | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 7 Plus Front Screen (Tosh) - Black | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 7 Plus Front Screen (Tosh) - White | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 7 Plus Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 7 Plus Mesh | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 7 Plus Power/Volume/Mute Button | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 7 Plus Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 7 Plus Wifi Module | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 7 Plus/8 Plus Earpiece | 0 | n/a | n/a | £0.90 | insufficient data |
| iPhone 7 Power/Volume/Mute Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 7 Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 7 Rear Lens | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 7/7 Plus/8/8 Plus Home Button White | 0 | n/a | n/a | £30.00 | insufficient data |
| iPhone 7/7 Plus/8/8 Plus/SE2/SE3 Home Button Black | 0 | n/a | n/a | £13.24 | insufficient data |
| iPhone 7/8/SE2/SE3 Earpiece | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 8 Battery (1821 mAh) | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 8 Haptic | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 8 Home Button Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 8 Loudspeaker | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 8 Plus Battery (2691 mAh) | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 8 Plus Charging Port/Microphone Black | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 8 Plus Charging Port/MicrophoneWhite | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 8 Plus Front Camera/Proximity Sensor | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone 8 Plus Haptic | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone 8 Plus Loudspeaker | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 8 Plus NFC Module | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone 8 Plus Power/Volume/Mute Button | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 8 Plus Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 8 Plus Rear Housing Red | 0 | n/a | n/a | £60.00 | insufficient data |
| iPhone 8 Plus Rear Housing Rose Gold | 0 | n/a | n/a | £60.00 | insufficient data |
| iPhone 8 Plus Rear Housing Silver | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone 8 Plus Rear Housing Space Grey | 0 | n/a | n/a | £30.00 | insufficient data |
| iPhone 8 Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 8 Rear Housing Gold | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 8 Rear Housing Red | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone 8 Rear Housing Silver | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 8 Rear Housing Space Grey | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone 8/SE2/SE3 Charging Port/Microphone/Headphone Jack Black | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 8/SE2/SE3 Charging Port/Microphone/Headphone Jack White | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 8/SE2/SE3 Front Camera/Proximity Sensor | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone 8/SE2/SE3 Power/Volume/Mute Button/Flash/Rear mic | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone 8/SE2/SE3 Rear Lens | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone Diagnostic | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone Earpiece Mesh | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone Logic Board | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone Screen IC | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone SE Battery (1624 mAh) | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone SE Charging Port Black | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone SE Earpiece | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone SE Front Camera/Proximity Sensor | 0 | n/a | n/a | £2.50 | insufficient data |
| iPhone SE Home Button Black | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone SE Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone SE Power Button | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone SE Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone SE2 Battery (1821 mAh) | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone SE2 Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone SE2 Rear Housing Black | 0 | n/a | n/a | £41.16 | insufficient data |
| iPhone SE2 Rear Housing Red | 0 | n/a | n/a | £41.00 | insufficient data |
| iPhone SE2 Rear Housing White | 0 | n/a | n/a | £41.00 | insufficient data |
| iPhone SE2 Wifi Module | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone SE2/SE3 Loudspeaker | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone SE3 Battery | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone SE3 Rear Housing Black | 0 | n/a | n/a | £42.00 | insufficient data |
| iPhone SE3 Rear Housing Red | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone SE3 Rear Housing White | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone Software Re-Installation | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone X Battery (2716 mAh) | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone X Charging Port/Microphone Black | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone X Charging Port/Microphone White | 0 | n/a | n/a | £30.00 | insufficient data |
| iPhone X Earpiece | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone X Earpiece/Proximity Sensor | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone X Face ID | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone X Front Camera | 0 | n/a | n/a | £30.00 | insufficient data |
| iPhone X Haptic | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone X Loudspeaker | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone X NFC Module | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone X Power Button/Flash/Rear Microphone | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone X Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone X Rear Housing Silver | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone X Rear Housing Space Grey | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone X Rear Lens | 0 | n/a | n/a | £0.78 | insufficient data |
| iPhone X Wifi Module | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone X Wireless Charging/Mute/Volume Button | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone XR Battery (2942 mAh) | 0 | n/a | n/a | £15.00 | insufficient data |
| iPhone XR Charging Port/Microphone Black | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone XR Charging Port/Microphone Jack White | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone XR Earpiece | 0 | n/a | n/a | £25.00 | insufficient data |
| iPhone XR Face ID (All Colours) | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone XR Front Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XR Front Proximity Sensor/Earpiece Flex | 0 | n/a | n/a | £25.00 | insufficient data |
| iPhone XR Haptic | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XR Microphone | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XR Power/Volume/Mute Button | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone XR Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone XR Rear Glass Black | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone XR Rear Housing Blue | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone XR Rear Housing Coral | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone XR Rear Housing Red | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone XR Rear Housing White | 0 | n/a | n/a | £80.00 | insufficient data |
| iPhone XR Rear Housing Yellow | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone XR Rear Lens | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone XR Wifi Module | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XR Wireless Charging | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XS / XS Max Rear Camera | 0 | n/a | n/a | £35.00 | insufficient data |
| iPhone XS Battery (2658 mAh) | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone XS Charging Port/Microphone Black | 0 | n/a | n/a | £12.00 | insufficient data |
| iPhone XS Charging Port/Microphone Gold | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XS Charging Port/Microphone White | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone XS Earpiece | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XS Earpiece/Proximity Sensor | 0 | n/a | n/a | £5.00 | insufficient data |
| iPhone XS Face ID | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone XS Front Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XS Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XS Max Battery (3174 mAh) | 0 | n/a | n/a | £2.00 | insufficient data |
| iPhone XS Max Charging Port/Microphone Black | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone XS Max Charging Port/Microphone Gold | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XS Max Charging Port/Microphone White | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone XS Max Earpiece | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XS Max Face ID | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone XS Max Front Camera | 0 | n/a | n/a | £30.00 | insufficient data |
| iPhone XS Max Loudspeaker | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XS Max Proximity Sensor/Earpiece | 0 | n/a | n/a | £10.00 | insufficient data |
| iPhone XS Max Rear Housing Gold | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone XS Max Rear Housing Silver | 0 | n/a | n/a | £50.00 | insufficient data |
| iPhone XS Max Rear Housing Space Grey | 0 | n/a | n/a | £20.00 | insufficient data |
| iPhone XS Max Wifi Module | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XS Max Wireless Charging/Mute/Volume Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XS Microphone | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XS Rear Housing Gold | 0 | n/a | n/a | £12.00 | insufficient data |
| iPhone XS Rear Housing Silver | 0 | n/a | n/a | £60.00 | insufficient data |
| iPhone XS Rear Housing Space Grey | 0 | n/a | n/a | £40.00 | insufficient data |
| iPhone XS Wifi | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XS Wireless Charging/Volume/Mute Button | 0 | n/a | n/a | £25.00 | insufficient data |
| iPhone XS/XS Max Flash/Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPhone XS/XS Max Rear Lens | 0 | n/a | n/a | £5.00 | insufficient data |
| iPod Logic Board | 0 | n/a | n/a | £1.00 | insufficient data |
| iPod Touch 5th Gen Battery | 0 | n/a | n/a | £1.00 | insufficient data |
| iPod Touch 6th Gen Charging Port Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPod Touch 6th Gen Front Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| iPod Touch 6th Gen Headphone Jack White | 0 | n/a | n/a | £10.00 | insufficient data |
| iPod Touch 6th/7th Gen Home Button Black | 0 | n/a | n/a | £5.00 | insufficient data |
| iPod Touch 6th/7th Gen Rear Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| iPod Touch 6th/7th Gen Wifi Module | 0 | n/a | n/a | £1.00 | insufficient data |
| iPod Touch 7th Gen Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| iPod Touch 7th Gen Rear Housing Black | 0 | n/a | n/a | £1.00 | insufficient data |
| iPod Touch Battery | 0 | n/a | n/a | £12.74 | insufficient data |
| iPod Touch Rear Housing Work | 0 | n/a | n/a | £5.00 | insufficient data |
| iPod Touch Software Re-Installation | 0 | n/a | n/a | £1.00 | insufficient data |
| Keyboard - A1706 / A1707 | 0 | n/a | n/a | £25.00 | insufficient data |
| Keyboard - A1708 | 0 | n/a | n/a | £22.00 | insufficient data |
| Keyboard - A1932 | 0 | n/a | n/a | £55.00 | insufficient data |
| Keyboard - A1989 / A1990 | 0 | n/a | n/a | £50.00 | insufficient data |
| Keyboard - A2141 | 0 | n/a | n/a | £9.00 | insufficient data |
| Keyboard - A2159 | 0 | n/a | n/a | £71.00 | insufficient data |
| Keyboard - A2179 | 0 | n/a | n/a | £9.00 | insufficient data |
| Keyboard - A2251 | 0 | n/a | n/a | £9.00 | insufficient data |
| Keyboard - A2289 | 0 | n/a | n/a | £9.00 | insufficient data |
| Keyboard - A2337 | 0 | n/a | n/a | £9.00 | insufficient data |
| Keyboard - A2338 | 0 | n/a | n/a | £9.00 | insufficient data |
| Keyboard - A2442 / A2779 / A2918 / A2992 / A3112 / A3401 / A3185 | 0 | n/a | n/a | £9.00 | insufficient data |
| Keyboard - A2485 / A2780 / A2991 / A3403 / A3186 | 0 | n/a | n/a | £9.00 | insufficient data |
| Keyboard - A2681 / A3113 / A2941 / A3114 / A3240 / A3241 | 0 | n/a | n/a | £9.00 | insufficient data |
| Keyboard Backlight - A1706 / A1707 | 0 | n/a | n/a | £8.00 | insufficient data |
| Keyboard Backlight - A1708 | 0 | n/a | n/a | £8.00 | insufficient data |
| Keyboard Backlight - A1932 | 0 | n/a | n/a | £8.00 | insufficient data |
| Keyboard Backlight - A1989 / A1990 | 0 | n/a | n/a | £8.00 | insufficient data |
| Keyboard Backlight - A2141 | 0 | n/a | n/a | £8.00 | insufficient data |
| Keyboard Backlight - A2159 | 0 | n/a | n/a | £8.00 | insufficient data |
| Keyboard Backlight - A2179 / A2337 | 0 | n/a | n/a | £8.00 | insufficient data |
| Keyboard Backlight - A2251 | 0 | n/a | n/a | £8.00 | insufficient data |
| Keyboard Backlight - A2289 / A2338 | 0 | n/a | n/a | £8.00 | insufficient data |
| Keyboard Backlight - A2442 / A2779 / A2918 / A2992 / A2485 / A2780 / A2991 | 0 | n/a | n/a | £8.00 | insufficient data |
| Keyboard Backlight - A2681 | 0 | n/a | n/a | £8.00 | insufficient data |
| Keyboard Backlight - A2941 | 0 | n/a | n/a | £8.00 | insufficient data |
| Keyboard Backlight - A3113 | 0 | n/a | n/a | £8.00 | insufficient data |
| Keyboard Backlight - A3114 | 0 | n/a | n/a | £8.00 | insufficient data |
| Keyboard Backlight US - A2442 / A2779 / A2918 / A2992 / A2485 / A2780 / A2991 | 0 | n/a | n/a | n/a | insufficient data |
| Keyboard Daughter Board A2681 | 0 | n/a | n/a | n/a | insufficient data |
| Keyboard Daughter Board A3113 | 0 | n/a | n/a | n/a | insufficient data |
| Keyboard Daughter Board A3114 | 0 | n/a | n/a | n/a | insufficient data |
| Keyboard Flex (Daughter) - A2681 | 0 | n/a | n/a | £3.00 | insufficient data |
| Keyboard Flex (Daughter) - A2941 | 0 | n/a | n/a | £3.00 | insufficient data |
| Keyboard Flex (Daughter) - A3113 | 0 | n/a | n/a | n/a | insufficient data |
| Keyboard Flex (Daughter) - A3114 | 0 | n/a | n/a | n/a | insufficient data |
| Keyboard Flex - A1706 | 0 | n/a | n/a | £3.00 | insufficient data |
| Keyboard Flex - A1707 | 0 | n/a | n/a | £3.00 | insufficient data |
| Keyboard Flex - A1708 / A2159 | 0 | n/a | n/a | £3.00 | insufficient data |
| Keyboard Flex - A1989 | 0 | n/a | n/a | £3.00 | insufficient data |
| Keyboard Flex - A1990 | 0 | n/a | n/a | £3.00 | insufficient data |
| LCD (BOE) - A2442 | A2779 | A2992 | A2918 | A3112 | A3185 | A3401 | 0 | n/a | n/a | £221.00 | insufficient data |
| LCD (LG) - A2442 | A2779 | A2992 | A2918 | A3112 | A3185 | A3401 | 0 | n/a | n/a | £228.00 | insufficient data |
| LCD (LG) - A2485 | A2780 | A2991 | A3403 | A3186 | 0 | n/a | n/a | £228.00 | insufficient data |
| LCD (Sharp) - A2442 | A2779 | A2992 | A2918 | A3112 | A3185 | A3401 | 0 | n/a | n/a | £187.00 | insufficient data |
| LCD (Sharp) - A2485 | A2780 | A2991 | A3403 | A3186 | 0 | n/a | n/a | £228.00 | insufficient data |
| LCD - A1706 | A1708 | 0 | n/a | n/a | £45.00 | insufficient data |
| LCD - A1707 | 0 | n/a | n/a | £110.00 | insufficient data |
| LCD - A1932 | 0 | n/a | n/a | £45.00 | insufficient data |
| LCD - A1989 | A2159 | 0 | n/a | n/a | £45.00 | insufficient data |
| LCD - A1990 | 0 | n/a | n/a | £140.00 | insufficient data |
| LCD - A2141 | 0 | n/a | n/a | £140.00 | insufficient data |
| LCD - A2179 | 0 | n/a | n/a | £45.00 | insufficient data |
| LCD - A2251 | A2289 | 0 | n/a | n/a | £70.00 | insufficient data |
| LCD - A2337 | 0 | n/a | n/a | £99.00 | insufficient data |
| LCD - A2338 (LG) | 0 | n/a | n/a | £100.00 | insufficient data |
| LCD - A2338 (Non-Original) | 0 | n/a | n/a | £128.00 | insufficient data |
| LCD - A2338 (Sharp) | 0 | n/a | n/a | £100.00 | insufficient data |
| LCD - A2681 | A3113 | A3240 | 0 | n/a | n/a | £95.00 | insufficient data |
| LCD - A2941 | A3114 | A3241 | 0 | n/a | n/a | £106.95 | insufficient data |
| Liquid Damage Treatment (All Models) | 0 | n/a | n/a | £5.00 | insufficient data |
| LVDS Flex - A1706 / A1989 / A2251 | 0 | n/a | n/a | £10.00 | insufficient data |
| LVDS Flex - A1707 / A1990 / A2141 | 0 | n/a | n/a | £10.00 | insufficient data |
| LVDS Flex - A1708 / A2159 / A2289 | 0 | n/a | n/a | £10.00 | insufficient data |
| LVDS Flex - A1932 / A2179 | 0 | n/a | n/a | £10.00 | insufficient data |
| LVDS Flex - A2337 | 0 | n/a | n/a | £10.00 | insufficient data |
| LVDS Flex - A2338 M1 / A2338 M2 | 0 | n/a | n/a | £10.00 | insufficient data |
| LVDS Flex - A2442 | 0 | n/a | n/a | £10.00 | insufficient data |
| LVDS Flex - A2485 | 0 | n/a | n/a | £10.00 | insufficient data |
| MacBook A1369(2010/2011) Front Screen Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1369(2010/2011/2012) Battery (A1405) | 0 | n/a | n/a | £24.55 | insufficient data |
| MacBook A1370(2010) Battery:A1406/A1375 | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1370(2010) Front Screen Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1398(2012/Early 2013) Battery:A1417 | 0 | n/a | n/a | £35.00 | insufficient data |
| MacBook A1398(2012/Early 2013) Front Screen Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1398(2013/2014) Battery:A1494 | 0 | n/a | n/a | £35.00 | insufficient data |
| MacBook A1398(2015) Battery:A1618 | 0 | n/a | n/a | £35.00 | insufficient data |
| MacBook A1398(2015) Front Screen Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1398(Late 2013) Front Screen Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1398(Late 2013) Front Screen Space Grey | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1398(Late 2013/2014) Front Screen Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1425(2012) Battery:A1437 | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1425(2012) Front Screen Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1465(2012/2013/2014/2015) Battery:A1406/A1495 | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1465(2012/2013/2014/2015) Front Screen Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1466(2012) Front Screen Silver | 0 | n/a | n/a | £100.00 | insufficient data |
| MacBook A1466(2013/2014/2015/2016/2017) Front Screen Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1466/A1369(2012/2013/2014/2015/2016/2017) Battery:A1496 | 0 | n/a | n/a | £27.95 | insufficient data |
| MacBook A1502(2013/2014) Battery:A1493/A1582 | 0 | n/a | n/a | £31.91 | insufficient data |
| MacBook A1502(2013/2014) Front Screen Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1502(2015) Battery:A1493/A1582 | 0 | n/a | n/a | £43.63 | insufficient data |
| MacBook A1502(2015) Front Screen Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1534(2015) Battery:A1527 | 0 | n/a | n/a | £30.00 | insufficient data |
| MacBook A1534(2015/2016/2017) Front Screen Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook A1534(2015/2016/2017) Front Screen Universal Rose Gold | 0 | n/a | n/a | £250.00 | insufficient data |
| MacBook A1534(2016/2017) Battery:A1705 | 0 | n/a | n/a | £39.20 | insufficient data |
| MacBook Air 13in M2 A2681 (2022) Rear Housing Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook Air 13in M2 A2681 (2022) TrackPad Gold | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook Air 13in M2 A2681/A3113 Front Screen Blue | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook Air A1932/A2179 Battery (A1965) | 0 | n/a | n/a | £33.00 | insufficient data |
| MacBook Air A2337 Battery (A2389) | 0 | n/a | n/a | £20.00 | insufficient data |
| MacBook Air A2681/A3113 Battery | 0 | n/a | n/a | £40.00 | insufficient data |
| MacBook Air A2941/A3114 Battery | 0 | n/a | n/a | £50.00 | insufficient data |
| MacBook Backlight | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook Diagnostic | 0 | n/a | n/a | £0.00 | insufficient data |
| MacBook Dustgate | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook FlexGate | 0 | n/a | n/a | £0.00 | insufficient data |
| MacBook Headphone Jack | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook Liquid Damage Treatment | 0 | n/a | n/a | £0.00 | insufficient data |
| MacBook Logic Board | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook Microphone | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook Pro 13in A1708(2017) Microphone | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook Pro 14 A2779 Screen Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook Pro 14in M1 ProMax A2442 (2021) Microphone | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook Pro 16 A2780 Keyboard (UK) | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook Pro 16 A2780 Screen Space Grey | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook Pro A1706 Battery (A1819) | 0 | n/a | n/a | £35.00 | insufficient data |
| MacBook Pro A1707 Battery (A1820) | 0 | n/a | n/a | £35.00 | insufficient data |
| MacBook Pro A1708 Battery (A1713) | 0 | n/a | n/a | £33.00 | insufficient data |
| MacBook Pro A1989/A2251 Battery (A1964) | 0 | n/a | n/a | £20.00 | insufficient data |
| MacBook Pro A1990 Battery (A1953) | 0 | n/a | n/a | £50.00 | insufficient data |
| MacBook Pro A2141 Battery (A2113) | 0 | n/a | n/a | £53.00 | insufficient data |
| MacBook Pro A2159/A2289/A2338 Battery (A2171) | 0 | n/a | n/a | £47.00 | insufficient data |
| MacBook Pro A2442 Battery (A2519) | 0 | n/a | n/a | £50.00 | insufficient data |
| Macbook Pro A2485 Battery | 0 | n/a | n/a | £50.00 | insufficient data |
| MacBook Screen Bezel | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook Software Restore | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook SSD Replacement | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook SSD Replacement (Variable Price) | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook WebCam Camera | 0 | n/a | n/a | £1.00 | insufficient data |
| MacBook Wifi Module | 0 | n/a | n/a | £1.00 | insufficient data |
| Magsafe Port - A2442 / A2779 / A2992 | 0 | n/a | n/a | £5.00 | insufficient data |
| Magsafe Port - A2485 / A2780 / A2991 | 0 | n/a | n/a | £5.00 | insufficient data |
| Magsafe Port - A2681 / A3113 | 0 | n/a | n/a | £5.00 | insufficient data |
| Magsafe Port - A2941 / A3114 | 0 | n/a | n/a | £5.00 | insufficient data |
| MBAir A1932 Front Screen - Rose Gold | 0 | n/a | n/a | £1.00 | insufficient data |
| MBAir A1932 Front Screen - Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MBAir A1932 Front Screen - Space Grey | 0 | n/a | n/a | £100.00 | insufficient data |
| MBAir A2179 Front Screen - Rose Gold | 0 | n/a | n/a | £1.00 | insufficient data |
| MBAir A2179 Front Screen - Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MBAir A2179 Front Screen - Space Grey | 0 | n/a | n/a | £1.00 | insufficient data |
| MBAir A2337 Front Screen - Rose Gold | 0 | n/a | n/a | £1.00 | insufficient data |
| MBAir A2337 Front Screen - Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MBAir A2337 Front Screen - Space Grey | 0 | n/a | n/a | £245.83 | insufficient data |
| MBAir A2681/A3113 Front Screen - Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MBAir A2681/A3113 Front Screen - Space Grey | 0 | n/a | n/a | £1.00 | insufficient data |
| MBPro A1706/A1708 Front Screen - Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MBPro A1706/A1708 Front Screen - Space Grey | 0 | n/a | n/a | £250.00 | insufficient data |
| MBPro A1989 | MBProP A1990 Keyboard (US) | 0 | n/a | n/a | £1.00 | insufficient data |
| MBPro A1989/A2159/A2289/A2251 Front Screen - Silver | 0 | n/a | n/a | £100.00 | insufficient data |
| MBPro A1989/A2159/A2289/A2251 Front Screen - Space Grey | 0 | n/a | n/a | £100.00 | insufficient data |
| MBPro A2338 Front Screen - Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MBPro A2338 Front Screen - Space Grey | 0 | n/a | n/a | £-433.34 | insufficient data |
| MBPro A2442 Front Screen - Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MBPro A2442 Front Screen - Space Grey | 0 | n/a | n/a | £583.33 | insufficient data |
| MBProP A1707 Front Screen - Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MBProP A1707 Front Screen - Space Grey | 0 | n/a | n/a | £1.00 | insufficient data |
| MBProP A1990 Front Screen - Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MBProP A1990 Front Screen - Space Grey | 0 | n/a | n/a | £1.00 | insufficient data |
| MBProP A2141 Front Screen - Silver | 0 | n/a | n/a | £360.00 | insufficient data |
| MBProP A2141 Front Screen - Space Grey | 0 | n/a | n/a | £350.00 | insufficient data |
| MBProP A2485 Front Screen - Silver | 0 | n/a | n/a | £1.00 | insufficient data |
| MBProP A2485 Front Screen - Space Grey | 0 | n/a | n/a | £1.00 | insufficient data |
| Misc Device Screen Repair | 0 | n/a | n/a | £1.00 | insufficient data |
| Modular Clean Out | 0 | n/a | n/a | £1.00 | insufficient data |
| Name | 0 | n/a | n/a | n/a | insufficient data |
| New copy Lid A2442 Grade A Silver | 0 | n/a | n/a | n/a | insufficient data |
| New copy Lid A2442 Grade A Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| New copy Lid A2485 Grade A Silver | 0 | n/a | n/a | n/a | insufficient data |
| New copy Lid A2485 Grade A Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| No Fault Found (All Devices) | 0 | n/a | n/a | £1.00 | insufficient data |
| No Parts Used (All Models) | 0 | n/a | n/a | £0.00 | insufficient data |
| OLED Display  - Watch S5/SE 40mm | 0 | n/a | n/a | n/a | insufficient data |
| OLED Display - Watch S1 38mm | 0 | n/a | n/a | n/a | insufficient data |
| OLED Display - Watch S1 42mm | 0 | n/a | n/a | n/a | insufficient data |
| OLED Display - Watch S2/S3 38mm | 0 | n/a | n/a | n/a | insufficient data |
| OLED Display - Watch S2/S3 42mm | 0 | n/a | n/a | n/a | insufficient data |
| OLED Display - Watch S4 40mm | 0 | n/a | n/a | n/a | insufficient data |
| OLED Display - Watch S4 44mm | 0 | n/a | n/a | £30.00 | insufficient data |
| OLED Display - Watch S5/SE 44mm | 0 | n/a | n/a | n/a | insufficient data |
| OLED Display - Watch S6 40mm | 0 | n/a | n/a | n/a | insufficient data |
| OLED Display - Watch S6 44mm | 0 | n/a | n/a | n/a | insufficient data |
| OLED Display - Watch S7 41mm | 0 | n/a | n/a | n/a | insufficient data |
| OLED Display - Watch S7 45mm | 0 | n/a | n/a | n/a | insufficient data |
| OLED Display - Watch S8 41mm | 0 | n/a | n/a | n/a | insufficient data |
| OLED Display - Watch S8 45mm | 0 | n/a | n/a | n/a | insufficient data |
| OLED Display - Watch S9 41mm | 0 | n/a | n/a | n/a | insufficient data |
| OLED Display - Watch S9 45mm | 0 | n/a | n/a | n/a | insufficient data |
| Other (See Notes) | 0 | n/a | n/a | £0.00 | insufficient data |
| QR TESTER (Skiply) | 0 | n/a | n/a | n/a | insufficient data |
| Rear Housing Reshaping (All Models) | 0 | n/a | n/a | £1.00 | insufficient data |
| S38 - A2338 | 0 | n/a | n/a | n/a | insufficient data |
| Samsung A510 Battery | 0 | n/a | n/a | £1.00 | insufficient data |
| Samsung Screen Replacement | 0 | n/a | n/a | £1.00 | insufficient data |
| Screen (Glass) - iPad 10 | 0 | n/a | n/a | £13.00 | insufficient data |
| Screen (Glass) - iPad 5 / Air (Black) | 0 | n/a | n/a | £7.50 | insufficient data |
| Screen (Glass) - iPad 5 / Air (White) | 0 | n/a | n/a | £7.50 | insufficient data |
| Screen (Glass) - iPad 6 (Black) | 0 | n/a | n/a | £4.00 | insufficient data |
| Screen (Glass) - iPad 6 (White) | 0 | n/a | n/a | £9.00 | insufficient data |
| Screen (Glass) - iPad 7 / 8 (Black) | 0 | n/a | n/a | £12.50 | insufficient data |
| Screen (Glass) - iPad 7 / 8 (White) | 0 | n/a | n/a | £12.50 | insufficient data |
| Screen (Glass) - iPad 9 (Black) | 0 | n/a | n/a | £25.00 | insufficient data |
| Screen (Glass) - iPad 9 (White) | 0 | n/a | n/a | n/a | insufficient data |
| Screen (LCD) - iPad 10 | 0 | n/a | n/a | £77.50 | insufficient data |
| Screen (LCD) - iPad 5 / Air | 0 | n/a | n/a | £40.00 | insufficient data |
| Screen (LCD) - iPad 6 | 0 | n/a | n/a | £80.00 | insufficient data |
| Screen (LCD) - iPad 7 / 8 / 9 | 0 | n/a | n/a | £40.00 | insufficient data |
| Screen - iPad Air 2 (Black) | 0 | n/a | n/a | £84.00 | insufficient data |
| Screen - iPad Air 2 (White) | 0 | n/a | n/a | £84.00 | insufficient data |
| Screen - iPad Air 3 (Black) | 0 | n/a | n/a | £92.00 | insufficient data |
| Screen - iPad Air 3 (White) | 0 | n/a | n/a | £92.00 | insufficient data |
| Screen - iPad Air 4 / 5 | 0 | n/a | n/a | £120.00 | insufficient data |
| Screen - iPad Air 6 11" / Air 7 11" | 0 | n/a | n/a | n/a | insufficient data |
| Screen - iPad Air 6 13" / Air 7 13" | 0 | n/a | n/a | n/a | insufficient data |
| Screen - iPad Mini 4 (Black) | 0 | n/a | n/a | £62.50 | insufficient data |
| Screen - iPad Mini 4 (White) | 0 | n/a | n/a | £62.50 | insufficient data |
| Screen - iPad Mini 5 (Black) | 0 | n/a | n/a | £100.00 | insufficient data |
| Screen - iPad Mini 5 (White) | 0 | n/a | n/a | £70.00 | insufficient data |
| Screen - iPad Mini 6 / Mini 7 | 0 | n/a | n/a | £80.00 | insufficient data |
| Screen - iPad Pro 10.5" (Black) | 0 | n/a | n/a | £50.00 | insufficient data |
| Screen - iPad Pro 10.5" (White) | 0 | n/a | n/a | £62.50 | insufficient data |
| Screen - iPad Pro 11" 1G / 2G | 0 | n/a | n/a | £100.00 | insufficient data |
| Screen - iPad Pro 11" 3G / 4G | 0 | n/a | n/a | £50.00 | insufficient data |
| Screen - iPad Pro 11" 5G | 0 | n/a | n/a | £550.00 | insufficient data |
| Screen - iPad Pro 11" 8G | 0 | n/a | n/a | n/a | insufficient data |
| Screen - iPad Pro 12.9" 1G (Black) | 0 | n/a | n/a | £123.00 | insufficient data |
| Screen - iPad Pro 12.9" 1G (White) | 0 | n/a | n/a | £123.00 | insufficient data |
| Screen - iPad Pro 12.9" 2G (Black) | 0 | n/a | n/a | £150.00 | insufficient data |
| Screen - iPad Pro 12.9" 2G (White) | 0 | n/a | n/a | £270.00 | insufficient data |
| Screen - iPad Pro 12.9" 3G / 4G | 0 | n/a | n/a | £40.00 | insufficient data |
| Screen - iPad Pro 12.9" 5G / 6G | 0 | n/a | n/a | £50.00 | insufficient data |
| Screen - iPad Pro 13" 7G | 0 | n/a | n/a | £550.00 | insufficient data |
| Screen - iPad Pro 13" 8G | 0 | n/a | n/a | n/a | insufficient data |
| Screen - iPad Pro 9.7 - Black | 0 | n/a | n/a | £59.00 | insufficient data |
| Screen - iPad Pro 9.7 - White | 0 | n/a | n/a | £59.00 | insufficient data |
| Screen Bezel (Silver) - A1706 / A1708 / A1989 / A2159 / A2251 / A2289 / A2338 | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel (Space Grey) - A1706 / A1708 / A1989 / A2159 / A2251 / A2289 / A2338 | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel - A1707 / A1990 (Silver) | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel - A1707 / A1990 (Space Grey) | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel - A1932 / A2179 / A2337 (Rose Gold) | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel - A1932 / A2179 / A2337 (Silver) | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel - A1932 / A2179 / A2337 (Space Grey) | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel - A2141 (Silver) | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel - A2141 (Space Grey) | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel - A2442 / A2779 / A2992 | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel - A2485 / A2780 / A2991 | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel - A2681 / A3113 - Black | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel - A2681 / A3113 - Blue | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel - A2681 / A3113 - Starlight | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel - A2941 / A3114 - Black | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel - A2941 / A3114 - Blue | 0 | n/a | n/a | £3.00 | insufficient data |
| Screen Bezel - A2941 / A3114 - Starlight | 0 | n/a | n/a | £3.00 | insufficient data |
| See Notes (All Models) | 0 | n/a | n/a | £0.00 | insufficient data |
| Speaker - A1932 (Left) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speaker - A1932 (Right) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speaker - A2179 (Left) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speaker - A2179 (Right) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A1706 (Left) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A1706 (Right) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A1707 / A1990 (Left) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A1707 / A1990 (Right) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A1708 (Left) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A1708 (Right) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A1989 / A2251 (Left) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A1989 / A2251 (Right) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2141 (Left) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2141 (Right) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2159 (Left) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2159 (Right) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2289 / A2338 (Left) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2289 / A2338 (Right) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2337 (Left) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2337 (Right) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2442 / A2779 / A2992 (Left) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2442 / A2779 / A2992 (Right) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2485 / A2780 / A2991 (Left) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2485 / A2780 / A2991 (Right) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2681 (Left) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2681 (Right) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2941 (Left) | 0 | n/a | n/a | £5.00 | insufficient data |
| Speakers - A2941 (Right) | 0 | n/a | n/a | £5.00 | insufficient data |
| Stencils | 0 | n/a | n/a | n/a | insufficient data |
| Tag Transfer to Inventory Movements | 0 | n/a | n/a | n/a | insufficient data |
| Test | 0 | n/a | n/a | n/a | insufficient data |
| TEST BATTRY PART ITEM | 0 | n/a | n/a | n/a | insufficient data |
| TEST DEVICE Front Screen Generic | 0 | n/a | n/a | £55.41 | insufficient data |
| TEST DEVICE TEST Battery | 0 | n/a | n/a | £30.00 | insufficient data |
| TEST DEVICE TEST Screen Black | 0 | n/a | n/a | £83.33 | insufficient data |
| TEST PART ITEM | 0 | n/a | n/a | n/a | insufficient data |
| TEST PART ITEM | 0 | n/a | n/a | n/a | insufficient data |
| TEST SCREEN PART ITEM | 0 | n/a | n/a | £20.00 | insufficient data |
| Top Case - A1706 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A1706 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A1707 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A1707 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A1708 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A1708 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A1932 - Gold | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A1932 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A1932 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A1989 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A1989 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A1990 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A1990 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2141 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2141 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2159 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2159 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2179 - Gold | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2179 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2179 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2251 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2251 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2289 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2289 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2337 - Gold | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2337 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2337 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2338 M1 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2338 M1 - Space Grey | 0 | n/a | n/a | £45.00 | insufficient data |
| Top Case - A2338 M2 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2338 M2 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2442 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2442 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2485 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2485 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2681 - Midnight | 0 | n/a | n/a | £60.00 | insufficient data |
| Top Case - A2681 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2681 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2681 - Starlight | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2779 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2779 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2780 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2780 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2918 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2918 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2941 - Midnight | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2941 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2941 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2941 - Starlight | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2991 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2991 - Space Black | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2992 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A2992 - Space Black | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A3113 - Midnight | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A3113 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A3113 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A3113 - Starlight | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A3114 - Midnight | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A3114 - Silver | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A3114 - Space Grey | 0 | n/a | n/a | n/a | insufficient data |
| Top Case - A3114 - Starlight | 0 | n/a | n/a | n/a | insufficient data |
| Touch Bar - A1706 / A1989 | 0 | n/a | n/a | £15.00 | insufficient data |
| Touch Bar - A1707 / A1990 | 0 | n/a | n/a | £40.00 | insufficient data |
| Touch Bar - A2141 | 0 | n/a | n/a | £15.00 | insufficient data |
| Touch Bar - A2159 | 0 | n/a | n/a | £15.00 | insufficient data |
| Touch Bar - A2251 /A2289/A2338 M1 / A2338 M2 | 0 | n/a | n/a | £40.00 | insufficient data |
| Touch Bar Flex - A1706 / A1989 | 0 | n/a | n/a | £4.00 | insufficient data |
| Touch Bar Flex - A1707 / A1990 | 0 | n/a | n/a | £4.00 | insufficient data |
| Touch Bar Flex - A2141 | 0 | n/a | n/a | £4.00 | insufficient data |
| Touch Bar Flex - A2159 | 0 | n/a | n/a | £8.00 | insufficient data |
| Touch Bar Flex - A2251 / A2289 / A2338 M1 / A2338 M2 | 0 | n/a | n/a | £6.50 | insufficient data |
| Trackpad  (Space Black) - A2992 / A3112 / A3401 / A3185 | 0 | n/a | n/a | £42.00 | insufficient data |
| Trackpad (Silver) - A2992 / A3112 / A3401 / A3185 | 0 | n/a | n/a | £42.00 | insufficient data |
| Trackpad - A1706 / A1708 / A1989 (Silver) | 0 | n/a | n/a | £22.00 | insufficient data |
| Trackpad - A1706 / A1708 / A1989 (Space Grey) | 0 | n/a | n/a | £22.00 | insufficient data |
| Trackpad - A1707 / A1990 (Silver) | 0 | n/a | n/a | £29.00 | insufficient data |
| Trackpad - A1707 / A1990 (Space Grey) | 0 | n/a | n/a | £29.00 | insufficient data |
| Trackpad - A1932 (Rose Gold) | 0 | n/a | n/a | £20.00 | insufficient data |
| Trackpad - A1932 (Silver) | 0 | n/a | n/a | £29.00 | insufficient data |
| Trackpad - A1932 (Space Grey) | 0 | n/a | n/a | £29.00 | insufficient data |
| Trackpad - A2141 (Silver) | 0 | n/a | n/a | £29.00 | insufficient data |
| Trackpad - A2141 (Space Grey) | 0 | n/a | n/a | £29.00 | insufficient data |
| Trackpad - A2159 (Silver) | 0 | n/a | n/a | £29.00 | insufficient data |
| Trackpad - A2159 (Space Grey) | 0 | n/a | n/a | £29.00 | insufficient data |
| Trackpad - A2179 (Rose Gold) | 0 | n/a | n/a | n/a | insufficient data |
| Trackpad - A2179 (Silver) | 0 | n/a | n/a | n/a | insufficient data |
| Trackpad - A2179 (Space Grey) | 0 | n/a | n/a | n/a | insufficient data |
| Trackpad - A2251 / A2289 (Silver) | 0 | n/a | n/a | £29.00 | insufficient data |
| Trackpad - A2251 / A2289 (Space Grey) | 0 | n/a | n/a | £29.00 | insufficient data |
| Trackpad - A2337 (Rose Gold) | 0 | n/a | n/a | £29.00 | insufficient data |
| Trackpad - A2337 (Silver) | 0 | n/a | n/a | £29.00 | insufficient data |
| Trackpad - A2337 (Space Grey) | 0 | n/a | n/a | £29.00 | insufficient data |
| Trackpad - A2338 M1 (Silver) | 0 | n/a | n/a | £30.00 | insufficient data |
| Trackpad - A2338 M1 (Space Grey) | 0 | n/a | n/a | £57.00 | insufficient data |
| Trackpad - A2338 M2 (Silver) | 0 | n/a | n/a | £43.00 | insufficient data |
| Trackpad - A2338 M2 (Space Grey) | 0 | n/a | n/a | £43.00 | insufficient data |
| Trackpad - A2442 (Silver) | 0 | n/a | n/a | £59.00 | insufficient data |
| Trackpad - A2442 (Space Grey) | 0 | n/a | n/a | £59.00 | insufficient data |
| Trackpad - A2485 (Silver) | 0 | n/a | n/a | £59.00 | insufficient data |
| Trackpad - A2485 (Space Grey) | 0 | n/a | n/a | £59.00 | insufficient data |
| Trackpad - A2681  (Silver) | 0 | n/a | n/a | £30.00 | insufficient data |
| Trackpad - A2681  (Space Grey) | 0 | n/a | n/a | £49.00 | insufficient data |
| Trackpad - A2681  (Starlight Gold) | 0 | n/a | n/a | £49.00 | insufficient data |
| Trackpad - A2681 (Midnight Blue) | 0 | n/a | n/a | £49.00 | insufficient data |
| Trackpad - A2779 / A2918 (Silver) | 0 | n/a | n/a | £49.00 | insufficient data |
| Trackpad - A2779 / A2918 (Space Grey) | 0 | n/a | n/a | £49.00 | insufficient data |
| Trackpad - A2780 (Silver) | 0 | n/a | n/a | £49.00 | insufficient data |
| Trackpad - A2780 (Space Grey) | 0 | n/a | n/a | £49.00 | insufficient data |
| Trackpad - A2941 (Midnight Blue) | 0 | n/a | n/a | £40.00 | insufficient data |
| Trackpad - A2941 (Silver) | 0 | n/a | n/a | £49.00 | insufficient data |
| Trackpad - A2941 (Space Grey) | 0 | n/a | n/a | £49.00 | insufficient data |
| Trackpad - A2941 (Starlight Gold) | 0 | n/a | n/a | £49.00 | insufficient data |
| Trackpad - A2991 / A3403 / A3186 (Silver) | 0 | n/a | n/a | £42.00 | insufficient data |
| Trackpad - A2991 / A3403 / A3186 (Space Black) | 0 | n/a | n/a | £42.00 | insufficient data |
| Trackpad - A3113 (Midnight Blue) | 0 | n/a | n/a | n/a | insufficient data |
| Trackpad - A3113 (Silver) | 0 | n/a | n/a | n/a | insufficient data |
| Trackpad - A3113 (Space Grey) | 0 | n/a | n/a | n/a | insufficient data |
| Trackpad - A3113 (Starlight Gold) | 0 | n/a | n/a | n/a | insufficient data |
| Trackpad - A3114 (Midnight Blue) | 0 | n/a | n/a | n/a | insufficient data |
| Trackpad - A3114 (Silver) | 0 | n/a | n/a | n/a | insufficient data |
| Trackpad - A3114 (Space Grey) | 0 | n/a | n/a | n/a | insufficient data |
| Trackpad - A3114 (Starlight Gold) | 0 | n/a | n/a | n/a | insufficient data |
| Trackpad Flex - A1706 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A1707 / A1990 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A1708 / A2159 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A1932 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A1989 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A2141 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A2179 / A2337 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A2251 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A2289 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A2338 M1 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A2338 M2 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A2442 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A2485 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A2681 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A2779 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A2780 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A2941 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A2991 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A2992 / A2918 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A3113 | 0 | n/a | n/a | £5.00 | insufficient data |
| Trackpad Flex - A3114 | 0 | n/a | n/a | £5.00 | insufficient data |
| USB-C Port - A1706 / A1708 / A1989 / A2159 / A2251 / A2289 / A2338 / A1707 / A1990 / A2141 | 0 | n/a | n/a | £5.00 | insufficient data |
| USB-C Port - A1932 / A2179 / A2337 | 0 | n/a | n/a | £5.00 | insufficient data |
| USB-C Port - A2442 / A2779  / A2485 / A2780 | 0 | n/a | n/a | £5.00 | insufficient data |
| USB-C Port - A2681 | 0 | n/a | n/a | £5.00 | insufficient data |
| USB-C Port - A2941 | 0 | n/a | n/a | £5.00 | insufficient data |
| USB-C Port - A2992 / A2918 / A2991 | 0 | n/a | n/a | £5.00 | insufficient data |
| USB-C Port - A3112 / A3401 / A3185 / A3403 / A3186 | 0 | n/a | n/a | £5.00 | insufficient data |
| USB-C Port - A3113 | 0 | n/a | n/a | £5.00 | insufficient data |
| USB-C Port - A3114 | 0 | n/a | n/a | £5.00 | insufficient data |
| Used MacBook Air A2337 Battery (A2389) (only for BM) | 0 | n/a | n/a | n/a | insufficient data |
| Used MacBook Pro A2159/A2289/A2338 Battery (A2171) (only for BM) | 0 | n/a | n/a | n/a | insufficient data |
| Zebra PDA Battery | 0 | n/a | n/a | £1.00 | insufficient data |
| Zebra PDA Charging Port Black | 0 | n/a | n/a | £1.00 | insufficient data |
| Zebra PDA Front Screen Black | 0 | n/a | n/a | £60.00 | insufficient data |
| Zebra PDA LCD | 0 | n/a | n/a | £65.14 | insufficient data |
| Zebra PDA Power Button | 0 | n/a | n/a | £1.00 | insufficient data |
| Zebra PDA Wireless Charging | 0 | n/a | n/a | £1.00 | insufficient data |

## Full Product Profitability Table

| Device | Product | Price inc VAT | Price ex VAT | Parts Cost | Avg Repair Hours | Repairs Used | Labour Cost | Payment Fee | Net Profit | Margin % | Flag | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Apple Watch S1 38mm | Apple Watch S1 38mm | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); 1 linked part(s) missing supply price |
| Apple Watch S1 38mm | Apple Watch S1 38mm Battery | £129.00 | £107.50 | £10.00 | n/a | 0 | £0.00 | £2.58 | £94.92 | 88.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S1 38mm | Apple Watch S1 38mm Crown | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S1 38mm | Apple Watch S1 38mm Diagnostic | £19.00 | £15.83 | £1.00 | n/a | 0 | £0.00 | £0.38 | £14.45 | 91.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S1 38mm | Apple Watch S1 38mm Display Screen | £179.00 | £149.17 | £60.00 | n/a | 0 | £0.00 | £3.58 | £85.59 | 57.4% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S1 38mm | Apple Watch S1 38mm Glass Screen | £129.00 | £107.50 | £60.00 | n/a | 0 | £0.00 | £2.58 | £44.92 | 41.8% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S1 38mm | Apple Watch S1 38mm Side Button | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S1 42mm | Apple Watch S1 42mm | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); 1 linked part(s) missing supply price |
| Apple Watch S1 42mm | Apple Watch S1 42mm Battery | £129.00 | £107.50 | £8.02 | n/a | 0 | £0.00 | £2.58 | £96.90 | 90.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S1 42mm | Apple Watch S1 42mm Crown | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S1 42mm | Apple Watch S1 42mm Diagnostic | £19.00 | £15.83 | £1.00 | n/a | 0 | £0.00 | £0.38 | £14.45 | 91.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S1 42mm | Apple Watch S1 42mm Display Screen | £179.00 | £149.17 | £60.00 | n/a | 0 | £0.00 | £3.58 | £85.59 | 57.4% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S1 42mm | Apple Watch S1 42mm Glass Screen | £129.00 | £107.50 | £60.00 | n/a | 0 | £0.00 | £2.58 | £44.92 | 41.8% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S1 42mm | Apple Watch S1 42mm Side Button | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S2 38mm | Apple Watch S2 38mm | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); 1 linked part(s) missing supply price |
| Apple Watch S2 38mm | Apple Watch S2 38mm Battery | £129.00 | £107.50 | £5.79 | n/a | 0 | £0.00 | £2.58 | £99.13 | 92.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S2 38mm | Apple Watch S2 38mm Crown | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S2 38mm | Apple Watch S2 38mm Diagnostic | £19.00 | £15.83 | £1.00 | n/a | 0 | £0.00 | £0.38 | £14.45 | 91.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S2 38mm | Apple Watch S2 38mm Display Screen | £179.00 | £149.17 | £80.00 | n/a | 0 | £0.00 | £3.58 | £65.59 | 44.0% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S2 38mm | Apple Watch S2 38mm Glass Screen | £129.00 | £107.50 | £80.00 | n/a | 0 | £0.00 | £2.58 | £24.92 | 23.2% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S2 38mm | Apple Watch S2 38mm Side Button | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S2 42mm | Apple Watch S2 42mm | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); 1 linked part(s) missing supply price |
| Apple Watch S2 42mm | Apple Watch S2 42mm Battery | £129.00 | £107.50 | £9.26 | n/a | 0 | £0.00 | £2.58 | £95.66 | 89.0% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S2 42mm | Apple Watch S2 42mm Crown | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S2 42mm | Apple Watch S2 42mm Diagnostic | £19.00 | £15.83 | £1.00 | n/a | 0 | £0.00 | £0.38 | £14.45 | 91.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S2 42mm | Apple Watch S2 42mm Display Screen | £179.00 | £149.17 | £76.94 | 123.00 | 5 | £2,951.97 | £3.58 | £-2,883.32 | -1933.0% | review pricing | timing source: linked parts |
| Apple Watch S2 42mm | Apple Watch S2 42mm Glass Screen | £129.00 | £107.50 | £76.94 | 123.00 | 5 | £2,951.97 | £2.58 | £-2,923.99 | -2720.0% | review pricing | timing source: linked parts |
| Apple Watch S2 42mm | Apple Watch S2 42mm Side Button | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S3 38mm | Apple Watch S3 38mm | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S3 38mm | Apple Watch S3 38mm Battery | £129.00 | £107.50 | £21.56 | n/a | 0 | £0.00 | £2.58 | £83.36 | 77.5% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S3 38mm | Apple Watch S3 38mm Crown | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S3 38mm | Apple Watch S3 38mm Diagnostic | £19.00 | £15.83 | £1.00 | n/a | 0 | £0.00 | £0.38 | £14.45 | 91.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S3 38mm | Apple Watch S3 38mm Display Screen | £179.00 | £149.17 | £80.00 | n/a | 0 | £0.00 | £3.58 | £65.59 | 44.0% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S3 38mm | Apple Watch S3 38mm Glass Screen | £129.00 | £107.50 | £80.00 | n/a | 0 | £0.00 | £2.58 | £24.92 | 23.2% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S3 38mm | Apple Watch S3 38mm Side Button | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S3 42mm | Apple Watch S3 42mm | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S3 42mm | Apple Watch S3 42mm Battery | £129.00 | £107.50 | £20.22 | n/a | 0 | £0.00 | £2.58 | £84.70 | 78.8% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S3 42mm | Apple Watch S3 42mm Crown | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S3 42mm | Apple Watch S3 42mm Diagnostic | £19.00 | £15.83 | £1.00 | n/a | 0 | £0.00 | £0.38 | £14.45 | 91.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S3 42mm | Apple Watch S3 42mm Display Screen | £179.00 | £149.17 | £76.94 | 123.00 | 5 | £2,951.97 | £3.58 | £-2,883.32 | -1933.0% | review pricing | timing source: linked parts |
| Apple Watch S3 42mm | Apple Watch S3 42mm Glass Screen | £129.00 | £107.50 | £76.94 | 123.00 | 5 | £2,951.97 | £2.58 | £-2,923.99 | -2720.0% | review pricing | timing source: requested repair relation + linked parts |
| Apple Watch S3 42mm | Apple Watch S3 42mm Side Button | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S4 40mm | Apple Watch S4 40mm | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S4 40mm | Apple Watch S4 40mm Battery | £129.00 | £107.50 | £15.30 | 497.64 | 1 | £11,943.31 | £2.58 | £-11,853.69 | -11026.7% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| Apple Watch S4 40mm | Apple Watch S4 40mm Crown | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S4 40mm | Apple Watch S4 40mm Diagnostic | £19.00 | £15.83 | £1.00 | 497.64 | 1 | £11,943.31 | £0.38 | £-11,928.86 | -75340.1% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| Apple Watch S4 40mm | Apple Watch S4 40mm Display Screen | £179.00 | £149.17 | £80.00 | 78.93 | 2 | £1,894.24 | £3.58 | £-1,828.66 | -1225.9% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| Apple Watch S4 40mm | Apple Watch S4 40mm Glass Screen | £179.00 | £149.17 | £80.00 | 82.84 | 3 | £1,988.23 | £3.58 | £-1,922.64 | -1288.9% | review pricing | timing source: requested repair relation + linked parts |
| Apple Watch S4 40mm | Apple Watch S4 40mm Heart Rate Monitor | £179.00 | £149.17 | £1.00 | n/a | 0 | £0.00 | £3.58 | £144.59 | 96.9% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S4 40mm | Apple Watch S4 40mm Rear Housing | £179.00 | £149.17 | £2.00 | 497.64 | 1 | £11,943.31 | £3.58 | £-11,799.72 | -7910.4% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| Apple Watch S4 40mm | Apple Watch S4 40mm Side Button | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S4 44mm | Apple Watch S4 44mm | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S4 44mm | Apple Watch S4 44mm Battery | £129.00 | £107.50 | £20.00 | 336.68 | 1 | £8,080.34 | £2.58 | £-7,995.42 | -7437.6% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| Apple Watch S4 44mm | Apple Watch S4 44mm Crown | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S4 44mm | Apple Watch S4 44mm Diagnostic | £19.00 | £15.83 | £1.00 | 259.29 | 1 | £6,222.96 | £0.38 | £-6,208.51 | -39211.6% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| Apple Watch S4 44mm | Apple Watch S4 44mm Display Screen | £179.00 | £149.17 | £100.00 | 32.22 | 4 | £773.18 | £3.58 | £-727.59 | -487.8% | review pricing | timing source: linked parts |
| Apple Watch S4 44mm | Apple Watch S4 44mm Glass Screen | £179.00 | £149.17 | £100.00 | 123.25 | 6 | £2,957.90 | £3.58 | £-2,912.31 | -1952.4% | review pricing | timing source: requested repair relation + linked parts |
| Apple Watch S4 44mm | Apple Watch S4 44mm Heart Rate Monitor | £179.00 | £149.17 | £1.00 | n/a | 0 | £0.00 | £3.58 | £144.59 | 96.9% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S4 44mm | Apple Watch S4 44mm Rear Housing | £179.00 | £149.17 | £2.00 | n/a | 0 | £0.00 | £3.58 | £143.59 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S4 44mm | Apple Watch S4 44mm Side Button | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S5 40mm | Apple Watch S5 40mm | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S5 40mm | Apple Watch S5 40mm Battery | £139.00 | £115.83 | £14.68 | 90.01 | 1 | £2,160.35 | £2.78 | £-2,061.98 | -1780.1% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| Apple Watch S5 40mm | Apple Watch S5 40mm Crown | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S5 40mm | Apple Watch S5 40mm Diagnostic | £19.00 | £15.83 | £1.00 | n/a | 0 | £0.00 | £0.38 | £14.45 | 91.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S5 40mm | Apple Watch S5 40mm Display Screen | £179.00 | £149.17 | £20.00 | 66.16 | 10 | £1,587.89 | £3.58 | £-1,462.31 | -980.3% | review pricing | timing source: linked parts |
| Apple Watch S5 40mm | Apple Watch S5 40mm Glass Screen | £179.00 | £149.17 | £20.00 | 68.60 | 10 | £1,646.44 | £3.58 | £-1,520.86 | -1019.6% | review pricing | timing source: requested repair relation + linked parts |
| Apple Watch S5 40mm | Apple Watch S5 40mm Heart Rate Monitor | £179.00 | £149.17 | £1.00 | n/a | 0 | £0.00 | £3.58 | £144.59 | 96.9% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S5 40mm | Apple Watch S5 40mm Rear Housing | £179.00 | £149.17 | £2.00 | n/a | 0 | £0.00 | £3.58 | £143.59 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S5 40mm | Apple Watch S5 40mm Side Button | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S5 44mm | Apple Watch S5 44mm | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S5 44mm | Apple Watch S5 44mm Battery | £139.00 | £115.83 | £3.20 | 86.20 | 3 | £2,068.79 | £2.78 | £-1,958.94 | -1691.2% | review pricing | timing source: requested repair relation + linked parts |
| Apple Watch S5 44mm | Apple Watch S5 44mm Crown | £99.00 | £82.50 | £1.00 | 45.19 | 1 | £1,084.54 | £1.98 | £-1,005.02 | -1218.2% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| Apple Watch S5 44mm | Apple Watch S5 44mm Diagnostic | £19.00 | £15.83 | £1.00 | 141.38 | 1 | £3,393.22 | £0.38 | £-3,378.76 | -21339.6% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| Apple Watch S5 44mm | Apple Watch S5 44mm Display Screen | £179.00 | £149.17 | £20.00 | 59.47 | 10 | £1,427.39 | £3.58 | £-1,301.80 | -872.7% | review pricing | timing source: requested repair relation + linked parts |
| Apple Watch S5 44mm | Apple Watch S5 44mm Glass Screen | £179.00 | £149.17 | £20.00 | 50.67 | 10 | £1,216.14 | £3.58 | £-1,090.55 | -731.1% | review pricing | timing source: requested repair relation + linked parts |
| Apple Watch S5 44mm | Apple Watch S5 44mm Heart Rate Monitor | £179.00 | £149.17 | £1.00 | n/a | 0 | £0.00 | £3.58 | £144.59 | 96.9% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S5 44mm | Apple Watch S5 44mm Rear Housing | £179.00 | £149.17 | £2.00 | n/a | 0 | £0.00 | £3.58 | £143.59 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S5 44mm | Apple Watch S5 44mm Side Button | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S6 40mm | Apple Watch S6 40mm Battery | £139.00 | £115.83 | £2.14 | n/a | 0 | £0.00 | £2.78 | £110.91 | 95.8% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm Crown | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm Diagnostic | £19.00 | £15.83 | £1.00 | n/a | 0 | £0.00 | £0.38 | £14.45 | 91.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm Display Screen | £179.00 | £149.17 | £120.00 | n/a | 0 | £0.00 | £3.58 | £25.59 | 17.2% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm Glass Screen | £179.00 | £149.17 | £120.00 | 24.86 | 1 | £596.68 | £3.58 | £-571.10 | -382.9% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm Heart Rate Monitor | £179.00 | £149.17 | £1.00 | n/a | 0 | £0.00 | £3.58 | £144.59 | 96.9% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm Rear Housing | £179.00 | £149.17 | £2.00 | n/a | 0 | £0.00 | £3.58 | £143.59 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm Side Button | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S6 40mm | Apple Watch S6 40mm Speaker Flex | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S6 44mm | Apple Watch S6 44mm | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S6 44mm | Apple Watch S6 44mm Battery | £139.00 | £115.83 | £6.82 | 42.87 | 1 | £1,028.80 | £2.78 | £-922.57 | -796.5% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| Apple Watch S6 44mm | Apple Watch S6 44mm Crown | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S6 44mm | Apple Watch S6 44mm Diagnostic | £19.00 | £15.83 | £1.00 | 54.20 | 1 | £1,300.74 | £0.38 | £-1,286.29 | -8123.9% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| Apple Watch S6 44mm | Apple Watch S6 44mm Display Screen | £179.00 | £149.17 | £60.00 | 83.73 | 5 | £2,009.58 | £3.58 | £-1,923.99 | -1289.8% | review pricing | timing source: requested repair relation + linked parts |
| Apple Watch S6 44mm | Apple Watch S6 44mm Glass Screen | £179.00 | £149.17 | £60.00 | 83.73 | 5 | £2,009.58 | £3.58 | £-1,923.99 | -1289.8% | review pricing | timing source: requested repair relation + linked parts |
| Apple Watch S6 44mm | Apple Watch S6 44mm Heart Rate Monitor | £179.00 | £149.17 | £1.00 | n/a | 0 | £0.00 | £3.58 | £144.59 | 96.9% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S6 44mm | Apple Watch S6 44mm Rear Housing | £179.00 | £149.17 | £2.00 | n/a | 0 | £0.00 | £3.58 | £143.59 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S6 44mm | Apple Watch S6 44mm Side Button | £99.00 | £82.50 | £1.00 | n/a | 0 | £0.00 | £1.98 | £79.52 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S7 41MM | Apple Watch S7 41MM | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S7 41MM | Apple Watch S7 41MM Battery | £139.00 | £115.83 | £15.00 | 123.54 | 2 | £2,964.96 | £2.78 | £-2,866.91 | -2475.0% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| Apple Watch S7 41MM | Apple Watch S7 41MM Crown | £119.00 | £99.17 | £1.00 | n/a | 0 | £0.00 | £2.38 | £95.79 | 96.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S7 41MM | Apple Watch S7 41MM Diagnostic | £19.00 | £15.83 | £1.00 | 207.78 | 1 | £4,986.82 | £0.38 | £-4,972.37 | -31404.4% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| Apple Watch S7 41MM | Apple Watch S7 41MM Display Screen | £199.00 | £165.83 | £4.44 | 44.25 | 1 | £1,062.06 | £3.98 | £-904.64 | -545.5% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| Apple Watch S7 41MM | Apple Watch S7 41MM Glass Screen | £199.00 | £165.83 | £4.44 | 44.25 | 1 | £1,062.06 | £3.98 | £-904.64 | -545.5% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| Apple Watch S7 41MM | Apple Watch S7 41MM Heart Rate Monitor | £199.00 | £165.83 | £1.00 | 44.30 | 1 | £1,063.19 | £3.98 | £-902.34 | -544.1% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| Apple Watch S7 41MM | Apple Watch S7 41MM Rear Housing | £199.00 | £165.83 | £2.00 | 44.30 | 1 | £1,063.19 | £3.98 | £-903.34 | -544.7% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| Apple Watch S7 41MM | Apple Watch S7 41MM Side Button | £119.00 | £99.17 | £1.00 | n/a | 0 | £0.00 | £2.38 | £95.79 | 96.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S7 45MM | Apple Watch S7 45MM | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S7 45MM | Apple Watch S7 45MM Battery | £139.00 | £115.83 | £30.00 | 23.84 | 2 | £572.07 | £2.78 | £-489.02 | -422.2% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| Apple Watch S7 45MM | Apple Watch S7 45MM Crown | £119.00 | £99.17 | £1.00 | n/a | 0 | £0.00 | £2.38 | £95.79 | 96.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S7 45MM | Apple Watch S7 45MM Diagnostic | £19.00 | £15.83 | £1.00 | n/a | 0 | £0.00 | £0.38 | £14.45 | 91.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S7 45MM | Apple Watch S7 45MM Display Screen | £199.00 | £165.83 | £1.00 | 53.31 | 3 | £1,279.53 | £3.98 | £-1,118.67 | -674.6% | review pricing | timing source: linked parts |
| Apple Watch S7 45MM | Apple Watch S7 45MM Glass Screen | £199.00 | £165.83 | £1.00 | 53.31 | 3 | £1,279.53 | £3.98 | £-1,118.67 | -674.6% | review pricing | timing source: requested repair relation + linked parts |
| Apple Watch S7 45MM | Apple Watch S7 45MM Heart Rate Monitor | £199.00 | £165.83 | £1.00 | n/a | 0 | £0.00 | £3.98 | £160.85 | 97.0% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S7 45MM | Apple Watch S7 45MM Rear Housing | £199.00 | £165.83 | £2.00 | n/a | 0 | £0.00 | £3.98 | £159.85 | 96.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S7 45MM | Apple Watch S7 45MM Side Button | £119.00 | £99.17 | £1.00 | 2231.79 | 1 | £53,562.90 | £2.38 | £-53,467.12 | -53916.4% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 41MM | Apple Watch S8 41MM | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S8 41MM | Apple Watch S8 41MM Battery | £149.00 | £124.17 | £1.00 | n/a | 0 | £0.00 | £2.98 | £120.19 | 96.8% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 41MM | Apple Watch S8 41MM Crown | £119.00 | £99.17 | £1.00 | n/a | 0 | £0.00 | £2.38 | £95.79 | 96.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 41MM | Apple Watch S8 41MM Diagnostic | £19.00 | £15.83 | £1.00 | n/a | 0 | £0.00 | £0.38 | £14.45 | 91.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 41MM | Apple Watch S8 41MM Display Screen | £219.00 | £182.50 | £40.00 | n/a | 0 | £0.00 | £4.38 | £138.12 | 75.7% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 41MM | Apple Watch S8 41MM Glass Screen | £219.00 | £182.50 | £40.00 | n/a | 0 | £0.00 | £4.38 | £138.12 | 75.7% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 41MM | Apple Watch S8 41MM Heart Rate Monitor | £219.00 | £182.50 | £1.00 | 2214.21 | 1 | £53,141.05 | £4.38 | £-52,963.93 | -29021.3% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 41MM | Apple Watch S8 41MM Rear Housing | £219.00 | £182.50 | £2.00 | n/a | 0 | £0.00 | £4.38 | £176.12 | 96.5% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 41MM | Apple Watch S8 41MM Side Button | £119.00 | £99.17 | £1.00 | n/a | 0 | £0.00 | £2.38 | £95.79 | 96.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 45MM | Apple Watch S8 45MM | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S8 45MM | Apple Watch S8 45MM Battery | £149.00 | £124.17 | £1.00 | 212.90 | 1 | £5,109.67 | £2.98 | £-4,989.48 | -4018.4% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 45MM | Apple Watch S8 45MM Crown | £119.00 | £99.17 | £1.00 | n/a | 0 | £0.00 | £2.38 | £95.79 | 96.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 45MM | Apple Watch S8 45MM Diagnostic | £19.00 | £15.83 | £1.00 | n/a | 0 | £0.00 | £0.38 | £14.45 | 91.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 45MM | Apple Watch S8 45MM Display Screen | £219.00 | £182.50 | £1.00 | n/a | 0 | £0.00 | £4.38 | £177.12 | 97.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 45MM | Apple Watch S8 45MM Glass Screen | £219.00 | £182.50 | £1.00 | n/a | 0 | £0.00 | £4.38 | £177.12 | 97.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 45MM | Apple Watch S8 45MM Heart Rate Monitor | £219.00 | £182.50 | £1.00 | 44.35 | 1 | £1,064.37 | £4.38 | £-887.25 | -486.2% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 45MM | Apple Watch S8 45MM Rear Housing | £219.00 | £182.50 | £2.00 | 44.35 | 1 | £1,064.37 | £4.38 | £-888.25 | -486.7% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| Apple Watch S8 45MM | Apple Watch S8 45MM Side Button | £119.00 | £99.17 | £1.00 | n/a | 0 | £0.00 | £2.38 | £95.79 | 96.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch S9 41MM | Apple Watch S9 41MM | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 41MM | Apple Watch S9 41MM Battery | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 41MM | Apple Watch S9 41MM Crown | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 41MM | Apple Watch S9 41MM Diagnostic | £19.00 | £15.83 | £0.00 | n/a | 0 | £0.00 | £0.38 | £15.45 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 41MM | Apple Watch S9 41MM Display Screen | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 41MM | Apple Watch S9 41MM Glass Screen | £249.00 | £207.50 | £0.00 | 152.61 | 2 | £3,662.68 | £4.98 | £-3,460.16 | -1667.5% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 41MM | Apple Watch S9 41MM Heart Rate Monitor | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 41MM | Apple Watch S9 41MM Rear Housing | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 41MM | Apple Watch S9 41MM Side Button | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 45MM | Apple Watch S9 45MM | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 45MM | Apple Watch S9 45MM Battery | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 45MM | Apple Watch S9 45MM Crown | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 45MM | Apple Watch S9 45MM Diagnostic | £19.00 | £15.83 | £0.00 | n/a | 0 | £0.00 | £0.38 | £15.45 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 45MM | Apple Watch S9 45MM Display Screen | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 45MM | Apple Watch S9 45MM Glass Screen | £249.00 | £207.50 | £0.00 | 22.66 | 1 | £543.85 | £4.98 | £-341.33 | -164.5% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 45MM | Apple Watch S9 45MM Heart Rate Monitor | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 45MM | Apple Watch S9 45MM Rear Housing | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch S9 45MM | Apple Watch S9 45MM Side Button | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE 40mm | Apple Watch SE 40mm | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE 40mm | Apple Watch SE 40mm Battery | £149.00 | £124.17 | £20.00 | 66.16 | 10 | £1,587.89 | £2.98 | £-1,486.71 | -1197.3% | review pricing | timing source: linked parts |
| Apple Watch SE 40mm | Apple Watch SE 40mm Crown | £119.00 | £99.17 | £1.00 | n/a | 0 | £0.00 | £2.38 | £95.79 | 96.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch SE 40mm | Apple Watch SE 40mm Diagnostic | £19.00 | £15.83 | £1.00 | 118.93 | 1 | £2,854.40 | £0.38 | £-2,839.95 | -17936.5% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| Apple Watch SE 40mm | Apple Watch SE 40mm Display Screen | £199.00 | £165.83 | £20.00 | 66.16 | 10 | £1,587.89 | £3.98 | £-1,446.04 | -872.0% | review pricing | timing source: linked parts |
| Apple Watch SE 40mm | Apple Watch SE 40mm Glass Screen | £199.00 | £165.83 | £20.00 | 61.78 | 10 | £1,482.75 | £3.98 | £-1,340.90 | -808.6% | review pricing | timing source: requested repair relation + linked parts |
| Apple Watch SE 40mm | Apple Watch SE 40mm Heart Rate Monitor | £159.00 | £132.50 | £1.00 | n/a | 0 | £0.00 | £3.18 | £128.32 | 96.8% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch SE 40mm | Apple Watch SE 40mm Rear Housing | £159.00 | £132.50 | £2.00 | n/a | 0 | £0.00 | £3.18 | £127.32 | 96.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch SE 40mm | Apple Watch SE 40mm Side Button | £119.00 | £99.17 | £1.00 | n/a | 0 | £0.00 | £2.38 | £95.79 | 96.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch SE 44mm | Apple Watch SE 44mm | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE 44mm | Apple Watch SE 44MM Battery | £149.00 | £124.17 | £1.00 | n/a | 0 | £0.00 | £2.98 | £120.19 | 96.8% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch SE 44mm | Apple Watch SE 44MM Crown | £119.00 | £99.17 | £1.00 | n/a | 0 | £0.00 | £2.38 | £95.79 | 96.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch SE 44mm | Apple Watch SE 44mm Diagnostic | £19.00 | £15.83 | £1.00 | n/a | 0 | £0.00 | £0.38 | £14.45 | 91.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch SE 44mm | Apple Watch SE 44mm Display Screen | £199.00 | £165.83 | £20.00 | 78.56 | 10 | £1,885.49 | £3.98 | £-1,743.64 | -1051.4% | review pricing | timing source: linked parts |
| Apple Watch SE 44mm | Apple Watch SE 44MM Glass Screen | £199.00 | £165.83 | £20.00 | 54.37 | 10 | £1,304.96 | £3.98 | £-1,163.10 | -701.4% | review pricing | timing source: requested repair relation + linked parts |
| Apple Watch SE 44mm | Apple Watch SE 44mm Heart Rate Monitor | £159.00 | £132.50 | £1.00 | n/a | 0 | £0.00 | £3.18 | £128.32 | 96.8% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch SE 44mm | Apple Watch SE 44mm Rear Housing | £159.00 | £132.50 | £2.00 | 160.01 | 1 | £3,840.16 | £3.18 | £-3,712.84 | -2802.1% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| Apple Watch SE 44mm | Apple Watch SE 44MM Side Button | £119.00 | £99.17 | £1.00 | n/a | 0 | £0.00 | £2.38 | £95.79 | 96.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Battery | £139.00 | £115.83 | £0.00 | 332.26 | 1 | £7,974.29 | £2.78 | £-7,861.24 | -6786.7% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Crown | £129.00 | £107.50 | £0.00 | n/a | 0 | £0.00 | £2.58 | £104.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Diagnostic | £19.00 | £15.83 | £0.00 | 307.37 | 2 | £7,376.87 | £0.38 | £-7,361.42 | -46493.2% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Display Screen | £199.00 | £165.83 | £0.00 | 282.48 | 1 | £6,779.45 | £3.98 | £-6,617.59 | -3990.5% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Glass Screen | £199.00 | £165.83 | £0.00 | 20.86 | 1 | £500.54 | £3.98 | £-338.69 | -204.2% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Heart Rate Monitor | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Rear Housing | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 40MM | Apple Watch SE2 40MM Side Button | £129.00 | £107.50 | £0.00 | n/a | 0 | £0.00 | £2.58 | £104.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Battery | £139.00 | £115.83 | £0.00 | n/a | 0 | £0.00 | £2.78 | £113.05 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Crown | £129.00 | £107.50 | £0.00 | n/a | 0 | £0.00 | £2.58 | £104.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Diagnostic | £19.00 | £15.83 | £0.00 | 66.76 | 1 | £1,602.15 | £0.38 | £-1,586.70 | -10021.3% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Display Screen | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Glass Screen | £199.00 | £165.83 | £0.00 | 20.89 | 1 | £501.27 | £3.98 | £-339.41 | -204.7% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Heart Rate Monitor | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Rear Housing | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch SE2 44MM | Apple Watch SE2 44MM Side Button | £129.00 | £107.50 | £0.00 | n/a | 0 | £0.00 | £2.58 | £104.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch Ultra | Apple Watch Ultra | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch Ultra | Apple Watch Ultra  Display Screen | £399.00 | £332.50 | £0.00 | n/a | 0 | £0.00 | £7.98 | £324.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch Ultra | Apple Watch Ultra Battery | £279.00 | £232.50 | £0.00 | n/a | 0 | £0.00 | £5.58 | £226.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch Ultra | Apple Watch Ultra Crown | £229.00 | £190.83 | £0.00 | n/a | 0 | £0.00 | £4.58 | £186.25 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch Ultra | Apple Watch Ultra Diagnostic | £19.00 | £15.83 | £1.00 | 2210.52 | 1 | £53,052.39 | £0.38 | £-53,037.94 | -334976.4% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| Apple Watch Ultra | Apple Watch Ultra Glass Screen | £399.00 | £332.50 | £0.00 | 25.00 | 1 | £599.89 | £7.98 | £-275.37 | -82.8% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch Ultra | Apple Watch Ultra Heart Rate Monitor | £349.00 | £290.83 | £0.00 | 21.80 | 1 | £523.26 | £6.98 | £-239.41 | -82.3% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch Ultra | Apple Watch Ultra Rear Housing | £349.00 | £290.83 | £0.00 | n/a | 0 | £0.00 | £6.98 | £283.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Apple Watch Ultra | Apple Watch Ultra Side Button | £229.00 | £190.83 | £0.00 | n/a | 0 | £0.00 | £4.58 | £186.25 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook 12 A1534 | MacBook 12 A1534 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook 12 A1534 | MacBook 12 A1534 Battery | £199.00 | £165.83 | £69.20 | 108.28 | 2 | £2,598.79 | £3.98 | £-2,506.13 | -1511.2% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| MacBook 12 A1534 | MacBook 12 A1534 Charging Port | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook 12 A1534 | MacBook 12 A1534 Diagnostic | £49.00 | £40.83 | £0.00 | 236.73 | 2 | £5,681.43 | £0.98 | £-5,641.58 | -13816.1% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| MacBook 12 A1534 | MacBook 12 A1534 Keyboard | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook 12 A1534 | MacBook 12 A1534 Screen | £349.00 | £290.83 | £0.00 | 587.48 | 2 | £14,099.52 | £6.98 | £-13,815.67 | -4750.4% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook 12 A1534 | MacBook 12 A1534 Trackpad | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Battery | £199.00 | £165.83 | £1.00 | n/a | 0 | £0.00 | £3.98 | £160.85 | 97.0% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Charging Port | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Diagnostic | £49.00 | £40.83 | £0.00 | n/a | 0 | £0.00 | £0.98 | £39.85 | 97.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Keyboard | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Screen | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 11 A1465 | MacBook Air 11 A1465 Trackpad | £199.00 | £165.83 | £0.00 | 42.72 | 1 | £1,025.37 | £3.98 | £-863.52 | -520.7% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Battery | £159.00 | £132.50 | £27.95 | 104.66 | 5 | £2,511.84 | £3.18 | £-2,410.47 | -1819.2% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Charging Port | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Diagnostic | £49.00 | £40.83 | £0.00 | 516.07 | 3 | £12,385.62 | £0.98 | £-12,345.76 | -30234.5% | review pricing | timing source: requested repair relation |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Keyboard | £199.00 | £165.83 | £0.00 | 75.51 | 1 | £1,812.16 | £3.98 | £-1,650.30 | -995.2% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Screen | £299.00 | £249.17 | £0.00 | 81.97 | 2 | £1,967.37 | £5.98 | £-1,724.19 | -692.0% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 A1466 | MacBook Air 13 A1466 Trackpad | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Battery | £199.00 | £165.83 | £33.00 | 197.64 | 10 | £4,743.29 | £3.98 | £-4,614.44 | -2782.6% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Charging Port | £149.00 | £124.17 | £0.00 | 93.75 | 1 | £2,249.93 | £2.98 | £-2,128.74 | -1714.4% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Diagnostic | £49.00 | £40.83 | £0.00 | 297.27 | 8 | £7,134.53 | £0.98 | £-7,094.67 | -17374.7% | review pricing | timing source: requested repair relation |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Keyboard | £249.00 | £207.50 | £55.00 | 94.83 | 2 | £2,275.81 | £4.98 | £-2,128.29 | -1025.7% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Screen | £299.00 | £249.17 | £45.00 | 255.86 | 10 | £6,140.64 | £5.98 | £-5,942.45 | -2384.9% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Air 13 A1932 | MacBook Air 13 A1932 Trackpad | £199.00 | £165.83 | £78.00 | n/a | 0 | £0.00 | £3.98 | £83.85 | 50.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Battery | £149.00 | £124.17 | £33.00 | 377.86 | 10 | £9,068.64 | £2.98 | £-8,980.45 | -7232.6% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Charging Port | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Diagnostic | £49.00 | £40.83 | £0.00 | 568.58 | 6 | £13,645.87 | £0.98 | £-13,606.02 | -33320.9% | review pricing | timing source: requested repair relation |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Keyboard | £249.00 | £207.50 | £0.00 | 141.28 | 1 | £3,390.64 | £4.98 | £-3,188.12 | -1536.4% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Screen | £299.00 | £249.17 | £45.00 | 373.02 | 10 | £8,952.50 | £5.98 | £-8,754.31 | -3513.4% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Air 13 A2179 | MacBook Air 13 A2179 Trackpad | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs); 3 linked part(s) missing supply price |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Battery | £179.00 | £149.17 | £20.00 | 241.67 | 6 | £5,800.17 | £3.58 | £-5,674.59 | -3804.2% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Charging Port | £149.00 | £124.17 | £0.00 | 86.45 | 4 | £2,074.78 | £2.98 | £-1,953.60 | -1573.4% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Diagnostic | £49.00 | £40.83 | £0.00 | 252.87 | 10 | £6,068.93 | £0.98 | £-6,029.08 | -14765.1% | review pricing | timing source: requested repair relation |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Keyboard | £249.00 | £207.50 | £0.00 | 242.93 | 3 | £5,830.31 | £4.98 | £-5,627.79 | -2712.2% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Screen | £339.00 | £282.50 | £99.00 | 116.33 | 10 | £2,791.89 | £6.78 | £-2,615.17 | -925.7% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Air 13 M1 A2337 | MacBook Air 13 'M1' A2337 Trackpad | £199.00 | £165.83 | £87.00 | 317.70 | 3 | £7,624.72 | £3.98 | £-7,549.87 | -4552.7% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Air 13 M1 A2337 | MacBook Air 13 M1 A2337 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Battery | £249.00 | £207.50 | £40.00 | 101.31 | 2 | £2,431.50 | £4.98 | £-2,268.98 | -1093.5% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Charging Port | £199.00 | £165.83 | £0.00 | 71.78 | 2 | £1,722.83 | £3.98 | £-1,560.97 | -941.3% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Diagnostic | £49.00 | £40.83 | £0.00 | 189.52 | 10 | £4,548.47 | £0.98 | £-4,508.62 | -11041.5% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Keyboard | £279.00 | £232.50 | £0.00 | 169.16 | 4 | £4,059.86 | £5.58 | £-3,832.94 | -1648.6% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Screen | £399.00 | £332.50 | £95.00 | 101.95 | 10 | £2,446.76 | £7.98 | £-2,217.24 | -666.8% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Air 13 M2 A2681 | MacBook Air 13 M2 A2681 Trackpad | £249.00 | £207.50 | £79.00 | 241.60 | 5 | £5,798.44 | £4.98 | £-5,674.92 | -2734.9% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Battery | £249.00 | £207.50 | £40.00 | 101.31 | 2 | £2,431.50 | £4.98 | £-2,268.98 | -1093.5% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Charging Port | £199.00 | £165.83 | £0.00 | 118.10 | 1 | £2,834.45 | £3.98 | £-2,672.59 | -1611.6% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Diagnostic | £49.00 | £40.83 | £0.00 | 767.63 | 3 | £18,423.15 | £0.98 | £-18,383.30 | -45020.3% | review pricing | timing source: requested repair relation |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Keyboard | £299.00 | £249.17 | £0.00 | 118.10 | 1 | £2,834.45 | £5.98 | £-2,591.26 | -1040.0% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Screen | £429.00 | £357.50 | £95.00 | 55.79 | 10 | £1,339.02 | £8.58 | £-1,085.10 | -303.5% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Air 13 M3 A3113 | MacBook Air 13 M3 A3113 Trackpad | £249.00 | £207.50 | £177.00 | 221.02 | 6 | £5,304.44 | £4.98 | £-5,278.92 | -2544.1% | review pricing | timing source: requested repair relation + linked parts; 4 linked part(s) missing supply price |
| MacBook Air 13 M4 A3240 | MacBook Air 13 M4 A3240 Diagnostic | £49.00 | £40.83 | £0.00 | 423.55 | 5 | £10,165.25 | £0.98 | £-10,125.39 | -24796.9% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| MacBook Air 13 M4 A3240 | MacBook Air 13 M4 A3240 Keyboard | £299.00 | £249.17 | £0.00 | 456.76 | 2 | £10,962.24 | £5.98 | £-10,719.05 | -4302.0% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 13 M4 A3240 | MacBook Air 13 M4 A3240 Screen | £479.00 | £399.17 | £95.00 | 203.07 | 10 | £4,873.59 | £9.58 | £-4,579.00 | -1147.1% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Battery | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Charging Port | £199.00 | £165.83 | £0.00 | 73.46 | 1 | £1,762.92 | £3.98 | £-1,601.07 | -965.5% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Diagnostic | £49.00 | £40.83 | £0.00 | 132.25 | 2 | £3,173.89 | £0.98 | £-3,134.04 | -7675.2% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Keyboard | £289.00 | £240.83 | £0.00 | 42.26 | 1 | £1,014.32 | £5.78 | £-779.27 | -323.6% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Screen | £449.00 | £374.17 | £106.95 | 68.84 | 10 | £1,652.20 | £8.98 | £-1,393.97 | -372.6% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Air 15 M2 A2941 | MacBook Air 15 M2 A2941 Trackpad | £299.00 | £249.17 | £187.00 | 269.97 | 2 | £6,479.22 | £5.98 | £-6,423.03 | -2577.8% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Battery | £249.00 | £207.50 | £50.00 | n/a | 0 | £0.00 | £4.98 | £152.52 | 73.5% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Charging Port | £199.00 | £165.83 | £0.00 | 624.46 | 1 | £14,986.96 | £3.98 | £-14,825.11 | -8939.8% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Diagnostic | £49.00 | £40.83 | £0.00 | 378.28 | 3 | £9,078.80 | £0.98 | £-9,038.94 | -22136.2% | review pricing | timing source: requested repair relation |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Keyboard | £299.00 | £249.17 | £9.00 | 198.92 | 6 | £4,774.18 | £5.98 | £-4,539.99 | -1822.1% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Screen | £469.00 | £390.83 | £106.95 | 97.08 | 10 | £2,330.04 | £9.38 | £-2,055.53 | -525.9% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Air 15 M3 A3114 | MacBook Air 15 M3 A3114 Trackpad | £299.00 | £249.17 | £0.00 | 148.77 | 1 | £3,570.56 | £5.98 | £-3,327.37 | -1335.4% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs); 4 linked part(s) missing supply price |
| MacBook Air 15 M3 A3114 | S001 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Battery | £179.00 | £149.17 | £33.00 | 77.11 | 10 | £1,850.61 | £3.58 | £-1,738.02 | -1165.2% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Charging Port | £149.00 | £124.17 | £0.00 | 313.41 | 1 | £7,521.82 | £2.98 | £-7,400.63 | -5960.2% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Diagnostic | £49.00 | £40.83 | £0.00 | 183.11 | 10 | £4,394.63 | £0.98 | £-4,354.78 | -10664.8% | review pricing | timing source: requested repair relation |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Keyboard | £249.00 | £207.50 | £0.00 | 160.50 | 4 | £3,852.10 | £4.98 | £-3,649.58 | -1758.8% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Screen | £399.00 | £332.50 | £45.00 | 128.20 | 10 | £3,076.76 | £7.98 | £-2,797.24 | -841.3% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13  A1708 | MacBook Pro 13  A1708 Trackpad | £199.00 | £165.83 | £0.00 | 48.21 | 1 | £1,157.16 | £3.98 | £-995.30 | -600.2% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13  A1708 | MacBook Pro 13 A1708 Dustgate | £349.00 | £290.83 | £0.00 | 75.86 | 10 | £1,820.62 | £6.98 | £-1,536.77 | -528.4% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13  A1708 | MacBook Pro 13 A1708 Flexgate | £349.00 | £290.83 | £0.00 | 59.58 | 10 | £1,429.92 | £6.98 | £-1,146.07 | -394.1% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Backlight | £329.00 | £274.17 | £0.00 | 221.10 | 10 | £5,306.31 | £6.58 | £-5,038.73 | -1837.8% | review pricing | timing source: linked parts |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Battery | £179.00 | £149.17 | £47.00 | 121.31 | 10 | £2,911.52 | £3.58 | £-2,812.93 | -1885.8% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Charging Port | £149.00 | £124.17 | £0.00 | 38.73 | 2 | £929.52 | £2.98 | £-808.33 | -651.0% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Diagnostic | £49.00 | £40.83 | £0.00 | 133.70 | 3 | £3,208.71 | £0.98 | £-3,168.86 | -7760.5% | review pricing | timing source: requested repair relation |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Dustgate | £249.00 | £207.50 | £0.00 | 123.84 | 10 | £2,972.15 | £4.98 | £-2,769.63 | -1334.8% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Keyboard | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Screen | £329.00 | £274.17 | £45.00 | 87.56 | 10 | £2,101.32 | £6.58 | £-1,878.73 | -685.3% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Touch Bar | £249.00 | £207.50 | £0.00 | 190.09 | 1 | £4,562.14 | £4.98 | £-4,359.62 | -2101.0% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 2TB 3 A2159 | MacBook Pro 13 2TB 3 A2159 Trackpad | £199.00 | £165.83 | £58.00 | 152.44 | 1 | £3,658.58 | £3.98 | £-3,554.73 | -2143.6% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Backlight | £329.00 | £274.17 | £0.00 | 221.10 | 10 | £5,306.31 | £6.58 | £-5,038.73 | -1837.8% | review pricing | timing source: linked parts |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Battery | £179.00 | £149.17 | £47.00 | 121.31 | 10 | £2,911.52 | £3.58 | £-2,812.93 | -1885.8% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Charging Port | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Diagnostic | £49.00 | £40.83 | £0.00 | 1005.94 | 4 | £24,142.49 | £0.98 | £-24,102.63 | -59026.9% | review pricing | timing source: requested repair relation |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Dustgate | £249.00 | £207.50 | £0.00 | 221.10 | 10 | £5,306.31 | £4.98 | £-5,103.79 | -2459.7% | review pricing | timing source: linked parts |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Keyboard | £249.00 | £207.50 | £0.00 | 23.30 | 1 | £559.24 | £4.98 | £-356.72 | -171.9% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Screen | £329.00 | £274.17 | £45.00 | 123.77 | 10 | £2,970.41 | £6.58 | £-2,747.83 | -1002.2% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 2TB 3 A2289 | MacBook Pro 13 2TB 3 A2289 Trackpad | £199.00 | £165.83 | £58.00 | 138.92 | 1 | £3,334.04 | £3.98 | £-3,230.19 | -1947.9% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| MacBook Pro 13 4TB 3 A2251 | Liquid Damage Treatment | £119.00 | £99.17 | £0.00 | n/a | 0 | £0.00 | £2.38 | £96.79 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Backlight | £329.00 | £274.17 | £0.00 | 221.10 | 10 | £5,306.31 | £6.58 | £-5,038.73 | -1837.8% | review pricing | timing source: linked parts |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Battery | £179.00 | £149.17 | £20.00 | 172.32 | 10 | £4,135.75 | £3.58 | £-4,010.16 | -2688.4% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Charging Port | £149.00 | £124.17 | £0.00 | 145.43 | 2 | £3,490.36 | £2.98 | £-3,369.18 | -2713.4% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Diagnostic | £49.00 | £40.83 | £0.00 | 490.43 | 8 | £11,770.23 | £0.98 | £-11,730.38 | -28727.5% | review pricing | timing source: requested repair relation |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Dustgate | £249.00 | £207.50 | £0.00 | 221.10 | 10 | £5,306.31 | £4.98 | £-5,103.79 | -2459.7% | review pricing | timing source: linked parts |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Keyboard | £249.00 | £207.50 | £0.00 | 160.22 | 2 | £3,845.24 | £4.98 | £-3,642.72 | -1755.5% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Screen | £329.00 | £274.17 | £45.00 | 140.27 | 10 | £3,366.58 | £6.58 | £-3,143.99 | -1146.7% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Touch Bar | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 4TB 3 A2251 | MacBook Pro 13 4TB 3 A2251 Trackpad | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Battery | £199.00 | £165.83 | £0.00 | 230.38 | 5 | £5,529.01 | £3.98 | £-5,367.16 | -3236.5% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Charging Port | £149.00 | £124.17 | £0.00 | 715.94 | 1 | £17,182.50 | £2.98 | £-17,061.31 | -13740.7% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Diagnostic | £49.00 | £40.83 | £0.00 | 358.05 | 3 | £8,593.16 | £0.98 | £-8,553.30 | -20946.9% | review pricing | timing source: requested repair relation |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Keyboard | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Screen | £399.00 | £332.50 | £0.00 | n/a | 0 | £0.00 | £7.98 | £324.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 A1502 | MacBook Pro 13  A1502 Trackpad | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 A1502 | MacBook Pro 13 A1502 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 A1502 | MacBook Pro 13 A1502 Logic Board | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 M1 A2338 | Liquid Damage Treatment | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Backlight | £399.00 | £332.50 | £0.00 | 221.10 | 10 | £5,306.31 | £7.98 | £-4,981.79 | -1498.3% | review pricing | timing source: linked parts |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Battery | £199.00 | £165.83 | £47.00 | 121.31 | 10 | £2,911.52 | £3.98 | £-2,796.67 | -1686.4% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Charging Port | £159.00 | £132.50 | £0.00 | 773.74 | 3 | £18,569.66 | £3.18 | £-18,440.34 | -13917.2% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Diagnostic | £49.00 | £40.83 | £0.00 | 185.76 | 10 | £4,458.18 | £0.98 | £-4,418.33 | -10820.4% | review pricing | timing source: requested repair relation |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Dustgate | £249.00 | £207.50 | £0.00 | 218.70 | 10 | £5,248.91 | £4.98 | £-5,046.39 | -2432.0% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Keyboard | £249.00 | £207.50 | £0.00 | 224.96 | 4 | £5,399.03 | £4.98 | £-5,196.51 | -2504.3% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Logic Board Repair | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Screen | £399.00 | £332.50 | £200.00 | 65.58 | 10 | £1,573.92 | £7.98 | £-1,449.40 | -435.9% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Touch Bar | £249.00 | £207.50 | £40.00 | 221.07 | 3 | £5,305.70 | £4.98 | £-5,143.18 | -2478.6% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 M1 A2338 | MacBook Pro 13 M1 A2338 Trackpad | £199.00 | £165.83 | £87.00 | 83.40 | 4 | £2,001.57 | £3.98 | £-1,926.71 | -1161.8% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Battery | £199.00 | £165.83 | £47.00 | 121.31 | 10 | £2,911.52 | £3.98 | £-2,796.67 | -1686.4% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Charging Port | £159.00 | £132.50 | £0.00 | n/a | 0 | £0.00 | £3.18 | £129.32 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Diagnostic | £49.00 | £40.83 | £0.00 | 384.18 | 8 | £9,220.42 | £0.98 | £-9,180.57 | -22483.0% | review pricing | timing source: requested repair relation |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Dustgate | £249.00 | £207.50 | £0.00 | 221.10 | 10 | £5,306.31 | £4.98 | £-5,103.79 | -2459.7% | review pricing | timing source: linked parts |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Keyboard | £249.00 | £207.50 | £9.00 | 174.88 | 3 | £4,197.19 | £4.98 | £-4,003.67 | -1929.5% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Screen | £429.00 | £357.50 | £200.00 | 40.22 | 10 | £965.30 | £8.58 | £-816.38 | -228.4% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Touch Bar | £249.00 | £207.50 | £0.00 | 68.27 | 1 | £1,638.59 | £4.98 | £-1,436.07 | -692.1% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 M2 A2338 | MacBook Pro 13 M2 A2338 Trackpad | £249.00 | £207.50 | £86.00 | 131.25 | 2 | £3,150.11 | £4.98 | £-3,033.59 | -1462.0% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Battery | £149.00 | £124.17 | £35.00 | 212.26 | 9 | £5,094.19 | £2.98 | £-5,008.00 | -4033.3% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Charging Port | £99.00 | £82.50 | £0.00 | 340.29 | 1 | £8,167.00 | £1.98 | £-8,086.48 | -9801.8% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Diagnostic | £199.00 | £165.83 | £0.00 | 160.16 | 7 | £3,843.82 | £3.98 | £-3,681.96 | -2220.3% | review pricing | timing source: requested repair relation |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Dustgate | £349.00 | £290.83 | £0.00 | 86.22 | 10 | £2,069.20 | £6.98 | £-1,785.34 | -613.9% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Flexgate | £349.00 | £290.83 | £0.00 | 61.33 | 10 | £1,471.84 | £6.98 | £-1,187.98 | -408.5% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Keyboard | £249.00 | £207.50 | £25.00 | 219.95 | 5 | £5,278.70 | £4.98 | £-5,101.18 | -2458.4% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Screen | £399.00 | £332.50 | £45.00 | 101.78 | 10 | £2,442.71 | £7.98 | £-2,163.19 | -650.6% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Touch Bar | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 Touch Bar A1706 | MacBook Pro 13 Touch Bar A1706 Trackpad | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Backlight | £299.00 | £249.17 | £0.00 | 221.10 | 10 | £5,306.31 | £5.98 | £-5,063.13 | -2032.0% | review pricing | timing source: linked parts |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Battery | £179.00 | £149.17 | £20.00 | 150.18 | 10 | £3,604.23 | £3.58 | £-3,478.64 | -2332.1% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Charging Port | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Diagnostic | £49.00 | £40.83 | £0.00 | 257.36 | 9 | £6,176.60 | £0.98 | £-6,136.74 | -15028.8% | review pricing | timing source: requested repair relation |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Dustgate | £249.00 | £207.50 | £0.00 | 58.86 | 10 | £1,412.65 | £4.98 | £-1,210.13 | -583.2% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Keyboard | £299.00 | £249.17 | £0.00 | n/a | 0 | £0.00 | £5.98 | £243.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Screen | £299.00 | £249.17 | £45.00 | 100.92 | 10 | £2,422.18 | £5.98 | £-2,224.00 | -892.6% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Touch Bar | £249.00 | £207.50 | £0.00 | 144.60 | 1 | £3,470.40 | £4.98 | £-3,267.88 | -1574.9% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13 Touch Bar A1989 | MacBook Pro 13 Touch Bar A1989 Trackpad | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 13"  A1708 | MacBook Pro 13 A1708  Warranty Assessment | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Charging Port | £199.00 | £165.83 | £0.00 | 194.99 | 2 | £4,679.85 | £3.98 | £-4,518.00 | -2724.4% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Diagnostic | £49.00 | £40.83 | £0.00 | 211.13 | 10 | £5,067.21 | £0.98 | £-5,027.35 | -12311.9% | review pricing | timing source: requested repair relation |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Keyboard | £249.00 | £207.50 | £9.00 | 268.86 | 8 | £6,452.57 | £4.98 | £-6,259.05 | -3016.4% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Screen | £549.00 | £457.50 | £415.00 | 132.42 | 10 | £3,178.04 | £10.98 | £-3,146.52 | -687.8% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 'M1 Pro/Max' A2442 Trackpad | £249.00 | £207.50 | £118.00 | 220.64 | 3 | £5,295.42 | £4.98 | £-5,210.90 | -2511.3% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 M1 Pro/Max A2442 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M1 Pro/Max A2442 | MacBook Pro 14 M1 Pro/Max A2442 Battery | £249.00 | £207.50 | £50.00 | 108.32 | 2 | £2,599.71 | £4.98 | £-2,447.19 | -1179.4% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Battery | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Charging Port | £199.00 | £165.83 | £0.00 | 251.87 | 2 | £6,044.83 | £3.98 | £-5,882.98 | -3547.5% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Diagnostic | £49.00 | £40.83 | £0.00 | 146.66 | 10 | £3,519.85 | £0.98 | £-3,480.00 | -8522.4% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Keyboard | £279.00 | £232.50 | £9.00 | 258.75 | 7 | £6,210.04 | £5.58 | £-5,992.12 | -2577.3% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Screen | £599.00 | £499.17 | £228.00 | 101.53 | 10 | £2,436.81 | £11.98 | £-2,177.62 | -436.3% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 14 M2 Pro/Max A2779 | MacBook Pro 14 M2 Pro/Max A2779 Trackpad | £249.00 | £207.50 | £0.00 | 165.19 | 1 | £3,964.62 | £4.98 | £-3,762.10 | -1813.1% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 A2992 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Battery | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Charging Port | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Diagnostic | £49.00 | £40.83 | £0.00 | 122.85 | 2 | £2,948.28 | £0.98 | £-2,908.43 | -7122.7% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Keyboard | £329.00 | £274.17 | £9.00 | 363.19 | 4 | £8,716.56 | £6.58 | £-8,457.97 | -3085.0% | review pricing | timing source: linked parts |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Screen | £649.00 | £540.83 | £0.00 | 51.70 | 6 | £1,240.82 | £12.98 | £-712.96 | -131.8% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 A2918 Trackpad | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Battery | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Charging Port | £199.00 | £165.83 | £0.00 | 269.73 | 3 | £6,473.56 | £3.98 | £-6,311.71 | -3806.1% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Diagnostic | £49.00 | £40.83 | £0.00 | 294.46 | 10 | £7,067.02 | £0.98 | £-7,027.17 | -17209.4% | review pricing | timing source: requested repair relation |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Keyboard | £329.00 | £274.17 | £9.00 | 667.03 | 7 | £16,008.69 | £6.58 | £-15,750.10 | -5744.7% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Screen | £649.00 | £540.83 | £0.00 | 160.29 | 10 | £3,846.87 | £12.98 | £-3,319.01 | -613.7% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| MacBook Pro 14 M3 A2992 | MacBook Pro 14 M3 Pro/Max A2992 Trackpad | £249.00 | £207.50 | £0.00 | 157.55 | 2 | £3,781.30 | £4.98 | £-3,578.78 | -1724.7% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M3 Pro/Max A2992 | MacBook Pro 14 M3 Pro/Max A2992 Warranty Assessment | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Battery | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Charging Port | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Diagnostic | £49.00 | £40.83 | £0.00 | 71.70 | 2 | £1,720.75 | £0.98 | £-1,680.89 | -4116.5% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Keyboard | £279.00 | £232.50 | £0.00 | n/a | 0 | £0.00 | £5.58 | £226.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Screen | £599.00 | £499.17 | £415.00 | 79.50 | 10 | £1,908.09 | £11.98 | £-1,835.90 | -367.8% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 14 M4 A3401 | MacBook Pro 14 M4 Pro/Max A3401 Trackpad | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Battery | £199.00 | £165.83 | £35.00 | 206.76 | 7 | £4,962.22 | £3.98 | £-4,835.37 | -2915.8% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Charging Port | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Diagnostic | £49.00 | £40.83 | £0.00 | 231.59 | 6 | £5,558.20 | £0.98 | £-5,518.34 | -13514.3% | review pricing | timing source: requested repair relation |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Keyboard | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Screen | £499.00 | £415.83 | £0.00 | 251.31 | 2 | £6,031.56 | £9.98 | £-5,625.70 | -1352.9% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 15 A1398 | MacBook Pro 15 A1398 Trackpad | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Battery | £179.00 | £149.17 | £35.00 | 91.47 | 10 | £2,195.37 | £3.58 | £-2,084.79 | -1397.6% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Charging Port | £149.00 | £124.17 | £0.00 | 169.96 | 1 | £4,079.01 | £2.98 | £-3,957.82 | -3187.5% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Diagnostic | £49.00 | £40.83 | £0.00 | 236.57 | 10 | £5,677.76 | £0.98 | £-5,637.91 | -13807.1% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Dustgate | £349.00 | £290.83 | £0.00 | 65.96 | 10 | £1,583.15 | £6.98 | £-1,299.29 | -446.7% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Flexgate | £349.00 | £290.83 | £0.00 | 96.46 | 10 | £2,315.05 | £6.98 | £-2,031.20 | -698.4% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Keyboard | £249.00 | £207.50 | £0.00 | 26.07 | 2 | £625.76 | £4.98 | £-423.24 | -204.0% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Screen | £549.00 | £457.50 | £110.00 | 97.35 | 10 | £2,336.31 | £10.98 | £-1,999.79 | -437.1% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 15 A1707 | MacBook Pro 15 A1707 Trackpad | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Backlight | £499.00 | £415.83 | £0.00 | 221.10 | 10 | £5,306.31 | £9.98 | £-4,900.46 | -1178.5% | review pricing | timing source: linked parts |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Battery | £179.00 | £149.17 | £50.00 | 155.20 | 10 | £3,724.75 | £3.58 | £-3,629.16 | -2433.0% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Charging Port | £149.00 | £124.17 | £0.00 | 158.90 | 2 | £3,813.52 | £2.98 | £-3,692.34 | -2973.7% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Diagnostic | £49.00 | £40.83 | £0.00 | 214.76 | 10 | £5,154.23 | £0.98 | £-5,114.38 | -12525.0% | review pricing | timing source: requested repair relation |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Dustgate | £349.00 | £290.83 | £0.00 | 52.79 | 10 | £1,267.06 | £6.98 | £-983.21 | -338.1% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Keyboard | £249.00 | £207.50 | £0.00 | 239.73 | 2 | £5,753.56 | £4.98 | £-5,551.04 | -2675.2% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Logic Board Repair | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Screen | £499.00 | £415.83 | £110.00 | 132.55 | 10 | £3,181.17 | £9.98 | £-2,885.31 | -693.9% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 15 A1990 | MacBook Pro 15 A1990 Trackpad | £199.00 | £165.83 | £58.00 | n/a | 0 | £0.00 | £3.98 | £103.85 | 62.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Backlight | £499.00 | £415.83 | £0.00 | 221.10 | 10 | £5,306.31 | £9.98 | £-4,900.46 | -1178.5% | review pricing | timing source: linked parts |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Battery | £199.00 | £165.83 | £53.00 | 184.83 | 10 | £4,435.86 | £3.98 | £-4,327.01 | -2609.3% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Charging Port | £149.00 | £124.17 | £0.00 | 84.19 | 2 | £2,020.54 | £2.98 | £-1,899.36 | -1529.7% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Diagnostic | £49.00 | £40.83 | £0.00 | 597.88 | 10 | £14,349.21 | £0.98 | £-14,309.35 | -35043.3% | review pricing | timing source: requested repair relation |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Dustgate | £249.00 | £207.50 | £0.00 | 71.27 | 10 | £1,710.57 | £4.98 | £-1,508.05 | -726.8% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Keyboard | £249.00 | £207.50 | £9.00 | 93.55 | 7 | £2,245.08 | £4.98 | £-2,051.56 | -988.7% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Screen | £499.00 | £415.83 | £140.00 | 170.19 | 10 | £4,084.49 | £9.98 | £-3,818.64 | -918.3% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Touch Bar | £249.00 | £207.50 | £0.00 | 709.17 | 2 | £17,020.19 | £4.98 | £-16,817.67 | -8104.9% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 A2141 | MacBook Pro 16 A2141 Trackpad | £199.00 | £165.83 | £58.00 | n/a | 0 | £0.00 | £3.98 | £103.85 | 62.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Battery | £249.00 | £207.50 | £50.00 | n/a | 0 | £0.00 | £4.98 | £152.52 | 73.5% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Charging Port | £199.00 | £165.83 | £0.00 | 129.33 | 4 | £3,103.98 | £3.98 | £-2,942.12 | -1774.1% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Diagnostic | £49.00 | £40.83 | £0.00 | 1154.51 | 10 | £27,708.15 | £0.98 | £-27,668.29 | -67759.1% | review pricing | timing source: requested repair relation |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Keyboard | £289.00 | £240.83 | £9.00 | 1244.72 | 7 | £29,873.39 | £5.78 | £-29,647.34 | -12310.3% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Screen | £599.00 | £499.17 | £228.00 | 776.84 | 10 | £18,644.07 | £11.98 | £-18,384.88 | -3683.1% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 16 M1 Pro/Max A2485 | MacBook Pro 16 M1 Pro/Max A2485 Trackpad | £249.00 | £207.50 | £118.00 | 155.96 | 4 | £3,743.12 | £4.98 | £-3,658.60 | -1763.2% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Battery | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Charging Port | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Diagnostic | £49.00 | £40.83 | £0.00 | 444.68 | 5 | £10,672.28 | £0.98 | £-10,632.42 | -26038.6% | review pricing | timing source: requested repair relation |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Keyboard | £289.00 | £240.83 | £0.00 | 251.16 | 2 | £6,027.84 | £5.78 | £-5,792.79 | -2405.3% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Screen | £639.00 | £532.50 | £228.00 | 81.51 | 10 | £1,956.28 | £12.78 | £-1,664.56 | -312.6% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 16 M2 Pro/Max A2780 | MacBook Pro 16 M2 Pro/Max A2780 Trackpad | £299.00 | £249.17 | £0.00 | n/a | 0 | £0.00 | £5.98 | £243.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M3 Pro/Max A2991 | Liquid Damage Treatment | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M3 Pro/Max A2991 | Liquid Damage Treatment | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Battery | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Charging Port | £199.00 | £165.83 | £0.00 | 170.66 | 1 | £4,095.84 | £3.98 | £-3,933.99 | -2372.3% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Diagnostic | £49.00 | £40.83 | £0.00 | 144.15 | 7 | £3,459.68 | £0.98 | £-3,419.82 | -8375.1% | review pricing | timing source: requested repair relation |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Keyboard | £329.00 | £274.17 | £0.00 | 261.23 | 1 | £6,269.51 | £6.58 | £-6,001.93 | -2189.2% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Screen | £699.00 | £582.50 | £456.00 | 46.66 | 10 | £1,119.79 | £13.98 | £-1,007.27 | -172.9% | review pricing | timing source: requested repair relation + linked parts |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M3 Pro/Max A2991 Trackpad | £299.00 | £249.17 | £0.00 | 170.87 | 1 | £4,100.82 | £5.98 | £-3,857.63 | -1548.2% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Battery | £449.00 | £374.17 | £0.00 | n/a | 0 | £0.00 | £8.98 | £365.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Charging Port | £399.00 | £332.50 | £0.00 | n/a | 0 | £0.00 | £7.98 | £324.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Diagnostic | £49.00 | £40.83 | £0.00 | n/a | 0 | £0.00 | £0.98 | £39.85 | 97.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Keyboard | £499.00 | £415.83 | £0.00 | n/a | 0 | £0.00 | £9.98 | £405.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Screen | £799.00 | £665.83 | £0.00 | n/a | 0 | £0.00 | £15.98 | £649.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| MacBook Pro 16 M3 Pro/Max A2991 | MacBook Pro 16 M4 Pro/Max A3186/A3403 Trackpad | £399.00 | £332.50 | £0.00 | n/a | 0 | £0.00 | £7.98 | £324.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Index Items | iPad Pro 13 (7G) | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Index Items | Other Device Other Repair | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPod Touch 6th Gen | iPod Touch 6th Gen | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPod Touch 6th Gen | iPod Touch 6th Gen Battery | £50.00 | £41.67 | £13.74 | 2.61 | 1 | £62.70 | £1.00 | £-35.77 | -85.9% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPod Touch 6th Gen | iPod Touch 6th Gen Charging IC | £120.00 | £100.00 | £1.00 | 304.19 | 4 | £7,300.47 | £2.40 | £-7,203.87 | -7203.9% | review pricing | timing source: linked parts |
| iPod Touch 6th Gen | iPod Touch 6th Gen Charging Port | £70.00 | £58.33 | £1.00 | n/a | 0 | £0.00 | £1.40 | £55.93 | 95.9% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPod Touch 6th Gen | iPod Touch 6th Gen Screen | £80.00 | £66.67 | £31.04 | 60.57 | 4 | £1,453.60 | £1.60 | £-1,419.57 | -2129.4% | review pricing | timing source: linked parts |
| iPod Touch 6th Gen | iPod Touch 6th Gen Software Re-Installation | £25.00 | £20.83 | £1.00 | n/a | 0 | £0.00 | £0.50 | £19.33 | 92.8% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPod Touch 6th Gen | iPod Touch 6th/7th Gen Rear Camera | £60.00 | £50.00 | £1.00 | 1.93 | 1 | £46.32 | £1.20 | £1.48 | 3.0% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPod Touch 7th Gen | iPod Touch 7th Gen | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPod Touch 7th Gen | iPod Touch 7th Gen Battery | £50.00 | £41.67 | £13.74 | 2.61 | 1 | £62.70 | £1.00 | £-35.77 | -85.9% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPod Touch 7th Gen | iPod Touch 7th Gen Charging IC | £120.00 | £100.00 | £1.00 | 304.19 | 4 | £7,300.47 | £2.40 | £-7,203.87 | -7203.9% | review pricing | timing source: requested repair relation + linked parts |
| iPod Touch 7th Gen | iPod Touch 7th Gen Charging Port | £70.00 | £58.33 | £1.00 | n/a | 0 | £0.00 | £1.40 | £55.93 | 95.9% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPod Touch 7th Gen | iPod Touch 7th Gen Screen | £80.00 | £66.67 | £31.04 | 60.57 | 4 | £1,453.60 | £1.60 | £-1,419.57 | -2129.4% | review pricing | timing source: requested repair relation + linked parts |
| iPod Touch 7th Gen | iPod Touch 7th Gen Software Re-Installation | £25.00 | £20.83 | £1.00 | n/a | 0 | £0.00 | £0.50 | £19.33 | 92.8% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Other Device | Other Device Other Product | n/a | n/a | £0.00 | 221.10 | 10 | £5,306.31 | n/a | n/a | n/a | incomplete data | timing source: linked parts |
| Other Device | Screen Protector | n/a | n/a | £0.00 | 2.65 | 10 | £63.55 | n/a | n/a | n/a | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| TEST PRODUCT GROUP | Custom Product | £10.00 | £8.33 | £0.00 | n/a | 0 | £0.00 | £0.20 | £8.13 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| TEST PRODUCT GROUP | TEST BATTEY PRODUCT | £50.00 | £41.67 | £30.00 | n/a | 0 | £0.00 | £1.00 | £10.67 | 25.6% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| TEST PRODUCT GROUP | TEST DISPLAY PRODUCT | £40.00 | £33.33 | £55.41 | n/a | 0 | £0.00 | £0.80 | £-22.88 | -68.6% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| TEST PRODUCT GROUP | TEST GLASS TOUCH PRODUCT | £50.00 | £41.67 | £20.00 | n/a | 0 | £0.00 | £1.00 | £20.67 | 49.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| TEST PRODUCT GROUP | TEST PRODUCT GROUP | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Zebra PDA | Zebra PDA | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| Zebra PDA | Zebra PDA LCD | £216.00 | £180.00 | £65.14 | n/a | 0 | £0.00 | £4.32 | £110.54 | 61.4% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Zebra PDA | Zebra PDA Touch Screen | £144.00 | £120.00 | £60.00 | n/a | 0 | £0.00 | £2.88 | £57.12 | 47.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad 10 | iPad 10 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad 10 | iPad 10 Battery | £149.00 | £124.17 | £21.50 | n/a | 0 | £0.00 | £2.98 | £99.69 | 80.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad 10 | iPad 10 Charging Port | £99.00 | £82.50 | £4.80 | 97.24 | 1 | £2,333.72 | £1.98 | £-2,258.00 | -2737.0% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPad 10 | iPad 10 Diagnostic | £49.00 | £40.83 | £1.00 | 192.94 | 1 | £4,630.64 | £0.98 | £-4,591.79 | -11245.2% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad 10 | iPad 10 Display Screen | £149.00 | £124.17 | £77.50 | 83.16 | 3 | £1,995.74 | £2.98 | £-1,952.06 | -1572.1% | review pricing | timing source: requested repair relation + linked parts |
| iPad 10 | iPad 10 Glass Screen | £199.00 | £165.83 | £13.00 | 15.73 | 4 | £377.61 | £3.98 | £-228.76 | -137.9% | review pricing | timing source: requested repair relation + linked parts |
| iPad 4 | iPad 4 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad 4 | iPad 4 Battery | £139.00 | £115.83 | £9.00 | n/a | 0 | £0.00 | £2.78 | £104.05 | 89.8% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad 4 | iPad 4 Charging Port | £69.00 | £57.50 | £4.80 | n/a | 0 | £0.00 | £1.38 | £51.32 | 89.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad 4 | iPad 4 Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad 4 | iPad 4 Display Screen | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad 4 | iPad 4 Glass and Touch Screen | £80.00 | £66.67 | £0.00 | n/a | 0 | £0.00 | £1.60 | £65.07 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad 5 | iPad 5 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad 5 | iPad 5 Battery | £139.00 | £115.83 | £8.26 | 24.49 | 2 | £587.80 | £2.78 | £-483.00 | -417.0% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPad 5 | iPad 5 Charging Port | £79.00 | £65.83 | £4.80 | 124.55 | 3 | £2,989.30 | £1.58 | £-2,929.85 | -4450.4% | review pricing | timing source: requested repair relation + linked parts |
| iPad 5 | iPad 5 Diagnostic | £49.00 | £40.83 | £1.00 | 183.60 | 1 | £4,406.44 | £0.98 | £-4,367.58 | -10696.1% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad 5 | iPad 5 Display Screen | £99.00 | £82.50 | £40.00 | 2.38 | 1 | £57.14 | £1.98 | £-16.62 | -20.1% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPad 5 | iPad 5 ERROR 4013 | £39.00 | £32.50 | £1.00 | n/a | 0 | £0.00 | £0.78 | £30.72 | 94.5% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad 5 | iPad 5 Glass and Touch Screen | £90.00 | £75.00 | £15.00 | 25.88 | 3 | £621.06 | £1.80 | £-562.86 | -750.5% | review pricing | timing source: linked parts |
| iPad 5 | iPad 5 Glass Screen | £99.00 | £82.50 | £15.00 | 25.88 | 3 | £621.06 | £1.98 | £-555.54 | -673.4% | review pricing | timing source: requested repair relation + linked parts |
| iPad 6 | iPad 6 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad 6 | iPad 6 Battery | £139.00 | £115.83 | £8.26 | 26.41 | 3 | £633.94 | £2.78 | £-529.15 | -456.8% | review pricing | timing source: requested repair relation + linked parts |
| iPad 6 | iPad 6 Charging Port | £79.00 | £65.83 | £9.60 | 91.87 | 2 | £2,204.91 | £1.58 | £-2,150.26 | -3266.2% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPad 6 | iPad 6 Diagnostic | £49.00 | £40.83 | £1.00 | 117.52 | 2 | £2,820.40 | £0.98 | £-2,781.55 | -6811.9% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad 6 | iPad 6 Display Screen | £99.00 | £82.50 | £80.00 | 95.81 | 1 | £2,299.43 | £1.98 | £-2,298.91 | -2786.6% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPad 6 | iPad 6 ERROR 4013 | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad 6 | iPad 6 Glass and Touch Screen | £109.00 | £90.83 | £13.00 | 32.57 | 5 | £781.62 | £2.18 | £-705.97 | -777.2% | review pricing | timing source: linked parts |
| iPad 6 | iPad 6 Glass Screen | £109.00 | £90.83 | £13.00 | 32.57 | 5 | £781.62 | £2.18 | £-705.97 | -777.2% | review pricing | timing source: requested repair relation + linked parts |
| iPad 7 | iPad 7 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad 7 | iPad 7 Battery | £139.00 | £115.83 | £8.26 | 24.49 | 2 | £587.80 | £2.78 | £-483.00 | -417.0% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPad 7 | iPad 7 Charging Port | £79.00 | £65.83 | £9.60 | 4.32 | 2 | £103.78 | £1.58 | £-49.13 | -74.6% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPad 7 | iPad 7 Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad 7 | iPad 7 Display Screen | £99.00 | £82.50 | £40.00 | 243.49 | 9 | £5,843.65 | £1.98 | £-5,803.13 | -7034.1% | review pricing | timing source: linked parts |
| iPad 7 | iPad 7 ERROR 4013 | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad 7 | iPad 7 Glass Screen | £149.00 | £124.17 | £25.00 | 144.86 | 10 | £3,476.57 | £2.98 | £-3,380.39 | -2722.5% | review pricing | timing source: requested repair relation + linked parts |
| iPad 8 | iPad 8 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad 8 | iPad 8 Battery | £139.00 | £115.83 | £8.26 | 234.85 | 3 | £5,636.46 | £2.78 | £-5,531.67 | -4775.5% | review pricing | timing source: requested repair relation + linked parts |
| iPad 8 | iPad 8 Charging Port | £99.00 | £82.50 | £9.60 | 21.54 | 4 | £516.89 | £1.98 | £-445.97 | -540.6% | review pricing | timing source: requested repair relation + linked parts |
| iPad 8 | iPad 8 Diagnostic | £49.00 | £40.83 | £1.00 | 165.78 | 2 | £3,978.60 | £0.98 | £-3,939.75 | -9648.4% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad 8 | iPad 8 Display Screen | £119.00 | £99.17 | £40.00 | 243.49 | 9 | £5,843.65 | £2.38 | £-5,786.86 | -5835.5% | review pricing | timing source: linked parts |
| iPad 8 | iPad 8 ERROR 4013 | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad 8 | iPad 8 Glass and Touch Screen | £149.00 | £124.17 | £25.00 | 144.86 | 10 | £3,476.57 | £2.98 | £-3,380.39 | -2722.5% | review pricing | timing source: linked parts |
| iPad 8 | iPad 8 Glass Screen | £149.00 | £124.17 | £25.00 | 191.32 | 10 | £4,591.56 | £2.98 | £-4,495.38 | -3620.4% | review pricing | timing source: requested repair relation + linked parts |
| iPad 9 | iPad 9 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad 9 | iPad 9 Battery | £139.00 | £115.83 | £8.19 | 462.69 | 4 | £11,104.54 | £2.78 | £-10,999.68 | -9496.1% | review pricing | timing source: requested repair relation + linked parts |
| iPad 9 | iPad 9 Charging Port | £99.00 | £82.50 | £4.80 | 24.78 | 7 | £594.66 | £1.98 | £-518.94 | -629.0% | review pricing | timing source: requested repair relation + linked parts |
| iPad 9 | iPad 9 Diagnostic | £49.00 | £40.83 | £1.00 | 119.08 | 10 | £2,857.84 | £0.98 | £-2,818.99 | -6903.7% | review pricing | timing source: requested repair relation |
| iPad 9 | iPad 9 Display Screen | £149.00 | £124.17 | £40.00 | 247.31 | 10 | £5,935.41 | £2.98 | £-5,854.22 | -4714.8% | review pricing | timing source: requested repair relation + linked parts |
| iPad 9 | iPad 9 Glass and Touch Screen | £149.00 | £124.17 | £50.00 | 24.31 | 10 | £583.39 | £2.98 | £-512.20 | -412.5% | review pricing | timing source: requested repair relation + linked parts |
| iPad 9 | iPad 9 Glass Screen | £119.00 | £99.17 | £50.00 | 57.85 | 10 | £1,388.28 | £2.38 | £-1,341.50 | -1352.8% | review pricing | timing source: requested repair relation + linked parts |
| iPad 9 | iPad Logic Board Repair | £139.00 | £115.83 | £0.00 | n/a | 0 | £0.00 | £2.78 | £113.05 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Air | iPad Air | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Air | iPad Air Battery | £139.00 | £115.83 | £8.26 | 24.49 | 2 | £587.80 | £2.78 | £-483.00 | -417.0% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPad Air | iPad Air Charging Port | £79.00 | £65.83 | £9.60 | n/a | 0 | £0.00 | £1.58 | £54.65 | 83.0% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Air | iPad Air Diagnostic | £49.00 | £40.83 | £1.00 | 6.38 | 1 | £153.22 | £0.98 | £-114.37 | -280.1% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad Air | iPad Air Display Screen | £109.00 | £90.83 | £40.00 | 4.38 | 2 | £105.18 | £2.18 | £-56.53 | -62.2% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPad Air | iPad Air Glass Screen | £89.00 | £74.17 | £15.00 | 25.88 | 3 | £621.06 | £1.78 | £-563.67 | -760.0% | review pricing | timing source: requested repair relation + linked parts |
| iPad Air 2 | iPad Air 2 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Air 2 | iPad Air 2 Battery | £149.00 | £124.17 | £8.35 | n/a | 0 | £0.00 | £2.98 | £112.84 | 90.9% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Air 2 | iPad Air 2 Charging Port | £79.00 | £65.83 | £9.60 | n/a | 0 | £0.00 | £1.58 | £54.65 | 83.0% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Air 2 | iPad Air 2 Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Air 2 | iPad Air 2 Display Screen | £179.00 | £149.17 | £168.00 | n/a | 0 | £0.00 | £3.58 | £-22.41 | -15.0% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Air 2 | iPad Air 2 Glass Screen | £129.00 | £107.50 | £0.00 | n/a | 0 | £0.00 | £2.58 | £104.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Air 3 | iPad Air 3 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Air 3 | iPad Air 3 Battery | £149.00 | £124.17 | £21.50 | n/a | 0 | £0.00 | £2.98 | £99.69 | 80.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Air 3 | iPad Air 3 Charging Port | £79.00 | £65.83 | £4.80 | 2.68 | 1 | £64.30 | £1.58 | £-4.85 | -7.4% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad Air 3 | iPad Air 3 Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Air 3 | iPad Air 3 Display Screen | £199.00 | £165.83 | £184.00 | 126.17 | 1 | £3,028.02 | £3.98 | £-3,050.17 | -1839.3% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPad Air 3 | iPad Air 3 Glass Screen | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Air 4 | iPad Air 4 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Air 4 | iPad Air 4 Battery | £149.00 | £124.17 | £20.00 | 181.77 | 5 | £4,362.47 | £2.98 | £-4,261.29 | -3431.9% | review pricing | timing source: requested repair relation + linked parts |
| iPad Air 4 | iPad Air 4 Charging Port | £149.00 | £124.17 | £4.80 | 72.61 | 3 | £1,742.70 | £2.98 | £-1,626.32 | -1309.8% | review pricing | timing source: requested repair relation + linked parts |
| iPad Air 4 | iPad Air 4 Diagnostic | £49.00 | £40.83 | £1.00 | 154.33 | 8 | £3,703.92 | £0.98 | £-3,665.07 | -8975.7% | review pricing | timing source: requested repair relation |
| iPad Air 4 | iPad Air 4 Display Screen | £249.00 | £207.50 | £120.00 | 128.08 | 9 | £3,073.89 | £4.98 | £-2,991.37 | -1441.6% | review pricing | timing source: requested repair relation + linked parts |
| iPad Air 4 | iPad Air 4 Glass Screen | £199.00 | £165.83 | £0.00 | 5.93 | 1 | £142.26 | £3.98 | £19.59 | 11.8% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Air 5 | iPad Air 5 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Air 5 | iPad Air 5 Battery | £149.00 | £124.17 | £21.50 | n/a | 0 | £0.00 | £2.98 | £99.69 | 80.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Air 5 | iPad Air 5 Charging Port | £149.00 | £124.17 | £9.60 | 64.15 | 3 | £1,539.54 | £2.98 | £-1,427.95 | -1150.0% | review pricing | timing source: requested repair relation + linked parts |
| iPad Air 5 | iPad Air 5 Diagnostic | £49.00 | £40.83 | £1.00 | 194.41 | 4 | £4,665.92 | £0.98 | £-4,627.06 | -11331.6% | review pricing | timing source: requested repair relation |
| iPad Air 5 | iPad Air 5 Display Screen | £249.00 | £207.50 | £120.00 | 138.04 | 9 | £3,312.85 | £4.98 | £-3,230.33 | -1556.8% | review pricing | timing source: requested repair relation + linked parts |
| iPad Air 5 | iPad Air 5 Glass Screen | £199.00 | £165.83 | £0.00 | 241.49 | 2 | £5,795.87 | £3.98 | £-5,634.01 | -3397.4% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Air 6 (11) | iPad Air 6 (11) Diagnostic | £49.00 | £40.83 | £1.00 | 216.72 | 1 | £5,201.40 | £0.98 | £-5,162.54 | -12643.0% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad Air 6 (13) | iPad Air 6 (13) Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Air 6 (13) | iPad Air 6 (13) Screen | £349.00 | £290.83 | £0.00 | 64.77 | 3 | £1,554.58 | £6.98 | £-1,270.72 | -436.9% | review pricing | timing source: requested repair relation + linked parts; 1 linked part(s) missing supply price |
| iPad Air 6 (13) | iPad Air 7 (13) Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Air 7 (13) | iPad Air 7 (13) Screen | £399.00 | £332.50 | £0.00 | 79.79 | 3 | £1,915.00 | £7.98 | £-1,590.48 | -478.3% | review pricing | timing source: requested repair relation + linked parts; 1 linked part(s) missing supply price |
| iPad Mini 2 | iPad Mini 2 Battery | £179.00 | £149.17 | £9.00 | n/a | 0 | £0.00 | £3.58 | £136.59 | 91.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Mini 2 | iPad Mini 2 Charging Port | £79.00 | £65.83 | £9.60 | n/a | 0 | £0.00 | £1.58 | £54.65 | 83.0% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Mini 2 | iPad Mini 2 Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Mini 2 | iPad Mini 2 Display Screen | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Mini 2 | iPad Mini 2 Glass and Touch | £80.00 | £66.67 | £0.00 | n/a | 0 | £0.00 | £1.60 | £65.07 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Mini 2 | iPad Mini 2 Glass Screen | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Mini 3 | iPad Mini 3 Battery | £179.00 | £149.17 | £9.00 | n/a | 0 | £0.00 | £3.58 | £136.59 | 91.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Mini 3 | iPad Mini 3 Charging Port | £79.00 | £65.83 | £9.60 | n/a | 0 | £0.00 | £1.58 | £54.65 | 83.0% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Mini 3 | iPad Mini 3 Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Mini 3 | iPad Mini 3 Display Screen | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Mini 3 | iPad Mini 3 Glass and Touch | £80.00 | £66.67 | £0.00 | n/a | 0 | £0.00 | £1.60 | £65.07 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Mini 3 | iPad Mini 3 Glass Screen | £99.00 | £82.50 | £0.00 | 170.27 | 1 | £4,086.37 | £1.98 | £-4,005.85 | -4855.6% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Mini 4 | iPad Mini 4 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Mini 4 | iPad Mini 4 Battery | £79.00 | £65.83 | £9.00 | 22.40 | 1 | £537.72 | £1.58 | £-482.46 | -732.9% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPad Mini 4 | iPad Mini 4 Charging Port | £79.00 | £65.83 | £4.80 | 72.61 | 3 | £1,742.70 | £1.58 | £-1,683.25 | -2556.8% | review pricing | timing source: linked parts |
| iPad Mini 4 | iPad Mini 4 Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Mini 4 | iPad Mini 4 Display Screen | £149.00 | £124.17 | £125.00 | 8.71 | 1 | £209.13 | £2.98 | £-212.94 | -171.5% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPad Mini 4 | iPad Mini 4 Glass Screen | £119.00 | £99.17 | £0.00 | n/a | 0 | £0.00 | £2.38 | £96.79 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Mini 5 | iPad Mini 5 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Mini 5 | iPad Mini 5 Battery | £149.00 | £124.17 | £20.00 | 39.40 | 2 | £945.49 | £2.98 | £-844.30 | -680.0% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPad Mini 5 | iPad Mini 5 Charging Port | £99.00 | £82.50 | £4.80 | 47.90 | 2 | £1,149.59 | £1.98 | £-1,073.87 | -1301.7% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad Mini 5 | iPad Mini 5 Diagnostic | £49.00 | £40.83 | £1.00 | 47.44 | 1 | £1,138.53 | £0.98 | £-1,099.67 | -2693.1% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad Mini 5 | iPad Mini 5 Display Screen | £149.00 | £124.17 | £170.00 | 41.76 | 7 | £1,002.21 | £2.98 | £-1,051.02 | -846.5% | review pricing | timing source: requested repair relation + linked parts |
| iPad Mini 5 | iPad Mini 5 Glass Screen | £119.00 | £99.17 | £0.00 | n/a | 0 | £0.00 | £2.38 | £96.79 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Mini 6 | iPad Mini 6 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Mini 6 | iPad Mini 6 Battery | £169.00 | £140.83 | £19.30 | n/a | 0 | £0.00 | £3.38 | £118.15 | 83.9% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Mini 6 | iPad Mini 6 Charging Port | £149.00 | £124.17 | £4.80 | 38.97 | 3 | £935.24 | £2.98 | £-818.85 | -659.5% | review pricing | timing source: linked parts |
| iPad Mini 6 | iPad Mini 6 Diagnostic | £49.00 | £40.83 | £1.00 | 537.94 | 2 | £12,910.47 | £0.98 | £-12,871.62 | -31522.3% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad Mini 6 | iPad Mini 6 Display Screen | £319.00 | £265.83 | £80.00 | n/a | 0 | £0.00 | £6.38 | £179.45 | 67.5% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Mini 6 | iPad Mini 6 Glass Screen | £269.00 | £224.17 | £0.00 | n/a | 0 | £0.00 | £5.38 | £218.79 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 10.5 | iPad Pro 10.5 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 10.5 | iPad Pro 10.5 Battery | £149.00 | £124.17 | £20.00 | 227.43 | 2 | £5,458.31 | £2.98 | £-5,357.13 | -4314.5% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPad Pro 10.5 | iPad Pro 10.5 Charging Port | £99.00 | £82.50 | £9.60 | n/a | 0 | £0.00 | £1.98 | £70.92 | 86.0% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Pro 10.5 | iPad Pro 10.5 Diagnostic | £49.00 | £40.83 | £1.00 | 155.13 | 4 | £3,723.06 | £0.98 | £-3,684.21 | -9022.6% | review pricing | timing source: requested repair relation |
| iPad Pro 10.5 | iPad Pro 10.5 Display Screen | £199.00 | £165.83 | £112.50 | 177.17 | 2 | £4,252.08 | £3.98 | £-4,202.73 | -2534.3% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPad Pro 10.5 | iPad Pro 10.5 Glass Screen | £149.00 | £124.17 | £13.00 | 3.21 | 2 | £76.93 | £2.98 | £31.26 | 25.2% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Battery | £149.00 | £124.17 | £12.10 | 70.07 | 3 | £1,681.72 | £2.98 | £-1,572.63 | -1266.5% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Charging Port | £149.00 | £124.17 | £9.60 | 206.97 | 7 | £4,967.19 | £2.98 | £-4,855.61 | -3910.6% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Diagnostic | £49.00 | £40.83 | £1.00 | 80.37 | 3 | £1,928.81 | £0.98 | £-1,889.96 | -4628.5% | review pricing | timing source: requested repair relation |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Display Screen | £249.00 | £207.50 | £100.00 | 185.73 | 6 | £4,457.45 | £4.98 | £-4,354.93 | -2098.8% | review pricing | timing source: linked parts |
| iPad Pro 11 (1G) | iPad Pro 11 (1G) Glass Screen | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Battery | £159.00 | £132.50 | £18.69 | n/a | 0 | £0.00 | £3.18 | £110.63 | 83.5% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Charging Port | £149.00 | £124.17 | £9.60 | 221.70 | 6 | £5,320.82 | £2.98 | £-5,209.23 | -4195.4% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Diagnostic | £49.00 | £40.83 | £1.00 | 296.32 | 4 | £7,111.73 | £0.98 | £-7,072.87 | -17321.3% | review pricing | timing source: requested repair relation |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Display Screen | £249.00 | £207.50 | £100.00 | 169.34 | 7 | £4,064.23 | £4.98 | £-3,961.71 | -1909.3% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 11 (2G) | iPad Pro 11 (2G) Glass Screen | £199.00 | £165.83 | £0.00 | 45.15 | 1 | £1,083.65 | £3.98 | £-921.79 | -555.9% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) Battery | £159.00 | £132.50 | £50.00 | 194.71 | 2 | £4,673.10 | £3.18 | £-4,593.78 | -3467.0% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) Charging Port | £149.00 | £124.17 | £4.80 | 59.70 | 10 | £1,432.88 | £2.98 | £-1,316.50 | -1060.3% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) Diagnostic | £49.00 | £40.83 | £1.00 | 271.31 | 5 | £6,511.43 | £0.98 | £-6,472.58 | -15851.2% | review pricing | timing source: requested repair relation |
| iPad Pro 11 (3G) | iPad Pro 11 (3G) Display Screen | £299.00 | £249.17 | £50.00 | 90.50 | 9 | £2,171.92 | £5.98 | £-1,978.73 | -794.1% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Battery | £169.00 | £140.83 | £20.00 | n/a | 0 | £0.00 | £3.38 | £117.45 | 83.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Charging Port | £149.00 | £124.17 | £4.80 | 44.57 | 10 | £1,069.73 | £2.98 | £-953.34 | -767.8% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Diagnostic | £49.00 | £40.83 | £1.00 | 124.44 | 1 | £2,986.54 | £0.98 | £-2,947.69 | -7218.8% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Display Screen | £349.00 | £290.83 | £0.00 | 49.21 | 1 | £1,181.15 | £6.98 | £-897.29 | -308.5% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 11 (4G) | iPad Pro 11 (4G) Glass Screen | £299.00 | £249.17 | £0.00 | n/a | 0 | £0.00 | £5.98 | £243.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 11 (5G) | iPad Pro 11 (5G) Charging Port | £149.00 | £124.17 | £0.00 | 3.32 | 2 | £79.60 | £2.98 | £41.59 | 33.5% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs); 1 linked part(s) missing supply price |
| iPad Pro 11 (5G) | iPad Pro 11 (5G) Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Pro 11 (5G) | iPad Pro 11 (5G) Screen | £699.00 | £582.50 | £550.00 | n/a | 0 | £0.00 | £13.98 | £18.52 | 3.2% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Battery | £159.00 | £132.50 | £12.10 | 64.38 | 1 | £1,545.08 | £3.18 | £-1,427.86 | -1077.6% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Charging Port | £149.00 | £124.17 | £4.80 | n/a | 0 | £0.00 | £2.98 | £116.39 | 93.7% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Diagnostic | £49.00 | £40.83 | £1.00 | 64.38 | 1 | £1,545.08 | £0.98 | £-1,506.23 | -3688.7% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Display Screen | £349.00 | £290.83 | £246.00 | n/a | 0 | £0.00 | £6.98 | £37.85 | 13.0% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Pro 12.9 (1G) | iPad Pro 12.9 (1G) Glass Screen | £299.00 | £249.17 | £0.00 | n/a | 0 | £0.00 | £5.98 | £243.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Battery | £179.00 | £149.17 | £30.00 | 27.31 | 2 | £655.47 | £3.58 | £-539.89 | -361.9% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Charging Port | £149.00 | £124.17 | £9.60 | n/a | 0 | £0.00 | £2.98 | £111.59 | 89.9% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Diagnostic | £49.00 | £40.83 | £1.00 | 74.36 | 2 | £1,784.74 | £0.98 | £-1,745.89 | -4275.6% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Display Screen | £399.00 | £332.50 | £420.00 | 642.90 | 1 | £15,429.50 | £7.98 | £-15,524.98 | -4669.2% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPad Pro 12.9 (2G) | iPad Pro 12.9 (2G) Glass Screen | £349.00 | £290.83 | £0.00 | n/a | 0 | £0.00 | £6.98 | £283.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 12.9 (3G) | iPad Pro 11 (3G) Glass Screen | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Battery | £159.00 | £132.50 | £23.99 | 105.55 | 4 | £2,533.32 | £3.18 | £-2,427.99 | -1832.4% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Charging Port | £149.00 | £124.17 | £4.80 | 84.99 | 10 | £2,039.74 | £2.98 | £-1,923.35 | -1549.0% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Diagnostic | £49.00 | £40.83 | £1.00 | 166.61 | 5 | £3,998.75 | £0.98 | £-3,959.90 | -9697.7% | review pricing | timing source: requested repair relation |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Display Screen | £249.00 | £207.50 | £40.00 | 136.77 | 10 | £3,282.45 | £4.98 | £-3,119.93 | -1503.6% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 12.9 (3G) | iPad Pro 12.9 (3G) Glass Screen | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Battery | £159.00 | £132.50 | £23.99 | 105.55 | 4 | £2,533.32 | £3.18 | £-2,427.99 | -1832.4% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Charging Port | £149.00 | £124.17 | £4.80 | 81.88 | 9 | £1,965.03 | £2.98 | £-1,848.64 | -1488.8% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Diagnostic | £49.00 | £40.83 | £1.00 | 164.29 | 7 | £3,943.05 | £0.98 | £-3,904.19 | -9561.3% | review pricing | timing source: requested repair relation |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Display Screen | £249.00 | £207.50 | £40.00 | 34.28 | 10 | £822.84 | £4.98 | £-660.32 | -318.2% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 12.9 (4G) | iPad Pro 12.9 (4G) Glass Screen | £249.00 | £207.50 | £0.00 | 43.31 | 1 | £1,039.53 | £4.98 | £-837.01 | -403.4% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Battery | £199.00 | £165.83 | £26.00 | 195.03 | 1 | £4,680.74 | £3.98 | £-4,544.89 | -2740.6% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Charging Port | £149.00 | £124.17 | £4.80 | 48.21 | 9 | £1,157.15 | £2.98 | £-1,040.76 | -838.2% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Diagnostic | £49.00 | £40.83 | £1.00 | 130.94 | 7 | £3,142.52 | £0.98 | £-3,103.67 | -7600.8% | review pricing | timing source: requested repair relation |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Display Screen | £399.00 | £332.50 | £50.00 | 194.99 | 9 | £4,679.64 | £7.98 | £-4,405.12 | -1324.8% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 12.9 (5G) | iPad Pro 12.9 (5G) Glass Screen | £349.00 | £290.83 | £0.00 | n/a | 0 | £0.00 | £6.98 | £283.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Battery | £199.00 | £165.83 | £26.00 | 43.48 | 2 | £1,043.46 | £3.98 | £-907.61 | -547.3% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Charging Port | £149.00 | £124.17 | £4.80 | 48.21 | 9 | £1,157.15 | £2.98 | £-1,040.76 | -838.2% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Diagnostic | £49.00 | £40.83 | £1.00 | 24.45 | 2 | £586.84 | £0.98 | £-547.98 | -1342.0% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Display Screen | £449.00 | £374.17 | £50.00 | 194.99 | 9 | £4,679.64 | £8.98 | £-4,364.45 | -1166.4% | review pricing | timing source: requested repair relation + linked parts |
| iPad Pro 12.9 (6G) | iPad Pro 12.9 (6G) Glass Screen | £399.00 | £332.50 | £0.00 | n/a | 0 | £0.00 | £7.98 | £324.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 13 (7G) | iPad Pro 13 (7G) Diagnostic | £49.00 | £40.83 | £1.00 | 1375.02 | 2 | £33,000.57 | £0.98 | £-32,961.72 | -80722.6% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPad Pro 13 (7G) | iPad Pro 13 (7G) Screen | £799.00 | £665.83 | £550.00 | 94.88 | 1 | £2,277.03 | £15.98 | £-2,177.18 | -327.0% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPad Pro 9.7 | iPad Pro 9.7 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPad Pro 9.7 | iPad Pro 9.7 Battery | £149.00 | £124.17 | £8.90 | n/a | 0 | £0.00 | £2.98 | £112.29 | 90.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Pro 9.7 | iPad Pro 9.7 Charging Port | £99.00 | £82.50 | £9.60 | n/a | 0 | £0.00 | £1.98 | £70.92 | 86.0% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Pro 9.7 | iPad Pro 9.7 Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Pro 9.7 | iPad Pro 9.7 Display Screen | £189.00 | £157.50 | £118.00 | n/a | 0 | £0.00 | £3.78 | £35.72 | 22.7% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPad Pro 9.7 | iPad Pro 9.7 Glass Screen | £139.00 | £115.83 | £0.00 | n/a | 0 | £0.00 | £2.78 | £113.05 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 11 | iPhone 11 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 11 | iPhone 11 Battery | £89.00 | £74.17 | £10.00 | 217.31 | 10 | £5,215.42 | £1.78 | £-5,153.04 | -6947.9% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 11 | iPhone 11 Charging Port | £69.00 | £57.50 | £60.00 | 11.63 | 4 | £279.00 | £1.38 | £-282.88 | -492.0% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 11 | iPhone 11 Diagnostic | £49.00 | £40.83 | £1.00 | 695.97 | 10 | £16,703.34 | £0.98 | £-16,664.49 | -40811.0% | review pricing | timing source: requested repair relation |
| iPhone 11 | iPhone 11 Earpiece Speaker | £79.00 | £65.83 | £10.00 | 0.69 | 3 | £16.59 | £1.58 | £37.67 | 57.2% | watch | timing source: requested repair relation + linked parts |
| iPhone 11 | iPhone 11 Loudspeaker | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 | iPhone 11 Microphone | £69.00 | £57.50 | £60.00 | 0.80 | 2 | £19.10 | £1.38 | £-22.98 | -40.0% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 11 | iPhone 11 Mute Button | £59.00 | £49.17 | £10.00 | n/a | 0 | £0.00 | £1.18 | £37.99 | 77.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 | iPhone 11 NO SERVICE (LOGIC BOARD REPAIR) | £120.00 | £100.00 | £1.00 | 590.28 | 10 | £14,166.69 | £2.40 | £-14,070.09 | -14070.1% | review pricing | timing source: linked parts |
| iPhone 11 | iPhone 11 NO WIFI (LOGIC BOARD REPAIR) | £120.00 | £100.00 | £1.00 | 590.28 | 10 | £14,166.69 | £2.40 | £-14,070.09 | -14070.1% | review pricing | timing source: linked parts |
| iPhone 11 | iPhone 11 Power Button | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 | iPhone 11 Rear Camera | £89.00 | £74.17 | £35.00 | 1.62 | 1 | £38.97 | £1.78 | £-1.59 | -2.1% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 11 | iPhone 11 Rear Camera Lens | £49.00 | £40.83 | £10.00 | n/a | 0 | £0.00 | £0.98 | £29.85 | 73.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 | iPhone 11 Rear Housing (Rear Glass And Frame) | £139.00 | £115.83 | £290.00 | 270.70 | 4 | £6,496.78 | £2.78 | £-6,673.73 | -5761.5% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 11 | iPhone 11 Screen | £109.00 | £90.83 | £25.00 | 197.86 | 10 | £4,772.52 | £2.18 | £-4,708.87 | -5184.1% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 11 | iPhone 11 UNABLE TO ACTIVATE | £120.00 | £100.00 | £1.00 | 590.28 | 10 | £14,166.69 | £2.40 | £-14,070.09 | -14070.1% | review pricing | timing source: linked parts |
| iPhone 11 | iPhone 11 Volume Button | £59.00 | £49.17 | £10.00 | n/a | 0 | £0.00 | £1.18 | £37.99 | 77.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro | iPhone 11 Pro | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 11 Pro | iPhone 11 Pro Battery | £89.00 | £74.17 | £2.00 | 7.66 | 7 | £183.89 | £1.78 | £-113.50 | -153.0% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 11 Pro | iPhone 11 Pro Charging Port | £69.00 | £57.50 | £21.00 | 0.84 | 2 | £20.20 | £1.38 | £14.92 | 25.9% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro | iPhone 11 Pro Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro | iPhone 11 Pro Earpiece Speaker | £79.00 | £65.83 | £1.00 | 0.31 | 1 | £7.37 | £1.58 | £55.89 | 84.9% | healthy | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro | iPhone 11 Pro Loudspeaker | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro | iPhone 11 Pro Microphone | £69.00 | £57.50 | £21.00 | 0.84 | 2 | £20.20 | £1.38 | £14.92 | 25.9% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro | iPhone 11 Pro Mute Button | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro | iPhone 11 Pro NO SERVICE (LOGIC BOARD REPAIR) | £160.00 | £133.33 | £1.00 | 590.28 | 10 | £14,166.69 | £3.20 | £-14,037.55 | -10528.2% | review pricing | timing source: linked parts |
| iPhone 11 Pro | iPhone 11 Pro NO WIFI (LOGIC BOARD REPAIR) | £160.00 | £133.33 | £1.00 | 590.28 | 10 | £14,166.69 | £3.20 | £-14,037.55 | -10528.2% | review pricing | timing source: linked parts |
| iPhone 11 Pro | iPhone 11 Pro Power Button | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro | iPhone 11 Pro Rear Camera | £89.00 | £74.17 | £35.00 | 0.37 | 1 | £8.84 | £1.78 | £28.55 | 38.5% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro | iPhone 11 Pro Rear Camera Lens | £49.00 | £40.83 | £10.00 | n/a | 0 | £0.00 | £0.98 | £29.85 | 73.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro | iPhone 11 Pro Rear Housing (Rear Glass And Frame) | £139.00 | £115.83 | £280.00 | 27.75 | 1 | £665.98 | £2.78 | £-832.93 | -719.1% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro | iPhone 11 Pro Screen | £189.00 | £157.50 | £60.00 | 1.35 | 7 | £56.36 | £3.78 | £37.36 | 23.7% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 11 Pro | iPhone 11 Pro UNABLE TO ACTIVATE | £160.00 | £133.33 | £1.00 | 590.28 | 10 | £14,166.69 | £3.20 | £-14,037.55 | -10528.2% | review pricing | timing source: linked parts |
| iPhone 11 Pro | iPhone 11 Pro Volume Button | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 11 Pro Max | iPhone 11 Pro Max Battery | £89.00 | £74.17 | £10.00 | 11.29 | 7 | £271.08 | £1.78 | £-208.69 | -281.4% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 11 Pro Max | iPhone 11 Pro Max Charging Port | £69.00 | £57.50 | £31.00 | 0.76 | 1 | £18.23 | £1.38 | £6.89 | 12.0% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max Diagnostic | £49.00 | £40.83 | £1.00 | 67.09 | 4 | £1,610.17 | £0.98 | £-1,571.32 | -3848.1% | review pricing | timing source: requested repair relation |
| iPhone 11 Pro Max | iPhone 11 Pro Max Earpiece Speaker | £79.00 | £65.83 | £1.00 | 1.09 | 2 | £26.22 | £1.58 | £37.04 | 56.3% | watch | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max Loudspeaker | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max Microphone | £69.00 | £57.50 | £31.00 | n/a | 0 | £0.00 | £1.38 | £25.12 | 43.7% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max Mute Button | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max NO SERVICE (LOGIC BOARD REPAIR) | £160.00 | £133.33 | £1.00 | 590.28 | 10 | £14,166.69 | £3.20 | £-14,037.55 | -10528.2% | review pricing | timing source: linked parts |
| iPhone 11 Pro Max | iPhone 11 Pro Max NO WIFI (LOGIC BOARD REPAIR) | £160.00 | £133.33 | £1.00 | 590.28 | 10 | £14,166.69 | £3.20 | £-14,037.55 | -10528.2% | review pricing | timing source: linked parts |
| iPhone 11 Pro Max | iPhone 11 Pro Max Power Button | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max Rear Camera | £89.00 | £74.17 | £35.00 | 0.37 | 1 | £8.84 | £1.78 | £28.55 | 38.5% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max Rear Camera Lens | £49.00 | £40.83 | £15.00 | n/a | 0 | £0.00 | £0.98 | £24.85 | 60.9% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 11 Pro Max | iPhone 11 Pro Max Rear Housing (Rear Glass And Frame) | £139.00 | £115.83 | £255.00 | 1.99 | 4 | £47.76 | £2.78 | £-189.71 | -163.8% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 11 Pro Max | iPhone 11 Pro Max Screen | £189.00 | £157.50 | £65.00 | 8.22 | 10 | £221.32 | £3.78 | £-132.60 | -84.2% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 11 Pro Max | iPhone 11 Pro Max UNABLE TO ACTIVATE | £160.00 | £133.33 | £1.00 | 590.28 | 10 | £14,166.69 | £3.20 | £-14,037.55 | -10528.2% | review pricing | timing source: linked parts |
| iPhone 11 Pro Max | iPhone 11 Pro Max Volume Button | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 | iPhone 12 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 12 | iPhone 12 Aftermarket Screen | £199.00 | £165.83 | £0.00 | 34.37 | 2 | £848.89 | £3.98 | £-687.03 | -414.3% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage; includes 1h iPhone screen refurb labour adder |
| iPhone 12 | iPhone 12 Battery | £89.00 | £74.17 | £10.00 | 154.17 | 10 | £3,700.09 | £1.78 | £-3,637.70 | -4904.8% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 12 | iPhone 12 Charging Port | £79.00 | £65.83 | £2.00 | 55.97 | 6 | £1,343.27 | £1.58 | £-1,281.02 | -1945.9% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 12 | iPhone 12 Diagnostic | £49.00 | £40.83 | £1.00 | 267.81 | 10 | £6,427.34 | £0.98 | £-6,388.48 | -15645.3% | review pricing | timing source: requested repair relation |
| iPhone 12 | iPhone 12 Earpiece Speaker | £79.00 | £65.83 | £20.00 | 31.04 | 8 | £744.91 | £1.58 | £-700.65 | -1064.3% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 12 | iPhone 12 Front Camera | £249.00 | £207.50 | £1.00 | n/a | 0 | £0.00 | £4.98 | £201.52 | 97.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 | iPhone 12 Loudspeaker | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 | iPhone 12 Microphone | £79.00 | £65.83 | £1.00 | n/a | 0 | £0.00 | £1.58 | £63.25 | 96.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 | iPhone 12 Mute Button | £79.00 | £65.83 | £1.00 | 168.26 | 1 | £4,038.31 | £1.58 | £-3,975.05 | -6038.1% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 12 | iPhone 12 NO SERVICE (LOGIC BOARD REPAIR) | £180.00 | £150.00 | £1.00 | 590.28 | 10 | £14,166.69 | £3.60 | £-14,021.29 | -9347.5% | review pricing | timing source: linked parts |
| iPhone 12 | iPhone 12 NO WIFI (LOGIC BOARD REPAIR) | £180.00 | £150.00 | £1.00 | 590.28 | 10 | £14,166.69 | £3.60 | £-14,021.29 | -9347.5% | review pricing | timing source: linked parts |
| iPhone 12 | iPhone 12 Power Button | £79.00 | £65.83 | £1.00 | n/a | 0 | £0.00 | £1.58 | £63.25 | 96.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 | iPhone 12 Rear Camera | £119.00 | £99.17 | £35.00 | 0.71 | 1 | £16.98 | £2.38 | £44.80 | 45.2% | watch | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 12 | iPhone 12 Rear Camera Lens | £59.00 | £49.17 | £10.00 | 1.24 | 5 | £29.77 | £1.18 | £8.22 | 16.7% | review pricing | timing source: linked parts |
| iPhone 12 | iPhone 12 Rear Housing (Rear Glass And Frame) | £179.00 | £149.17 | £311.00 | 1.64 | 5 | £39.39 | £3.58 | £-204.81 | -137.3% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 12 | iPhone 12 Screen | £199.00 | £165.83 | £35.00 | 123.88 | 10 | £2,997.16 | £3.98 | £-2,870.31 | -1730.8% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 12 | iPhone 12 UNABLE TO ACTIVATE | £180.00 | £150.00 | £1.00 | 590.28 | 10 | £14,166.69 | £3.60 | £-14,021.29 | -9347.5% | review pricing | timing source: linked parts |
| iPhone 12 | iPhone 12 Volume Button | £79.00 | £65.83 | £1.00 | 168.26 | 1 | £4,038.31 | £1.58 | £-3,975.05 | -6038.1% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 12 Mini | iPhone 12 Mini | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 12 Mini | iPhone 12 Mini Aftermarket Screen | £199.00 | £165.83 | £40.00 | n/a | 0 | £24.00 | £3.98 | £97.85 | 59.0% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs); includes 1h iPhone screen refurb labour adder |
| iPhone 12 Mini | iPhone 12 Mini Battery | £89.00 | £74.17 | £20.00 | 24.42 | 10 | £586.06 | £1.78 | £-533.67 | -719.6% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 12 Mini | iPhone 12 Mini Charging Port | £79.00 | £65.83 | £11.00 | 0.99 | 1 | £23.73 | £1.58 | £29.52 | 44.8% | watch | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 12 Mini | iPhone 12 Mini Diagnostic | £49.00 | £40.83 | £1.00 | 25.80 | 2 | £619.30 | £0.98 | £-580.45 | -1421.5% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 12 Mini | iPhone 12 Mini Earpiece Speaker | £79.00 | £65.83 | £1.00 | n/a | 0 | £0.00 | £1.58 | £63.25 | 96.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Mini | iPhone 12 Mini Front Camera | £249.00 | £207.50 | £1.00 | n/a | 0 | £0.00 | £4.98 | £201.52 | 97.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Mini | iPhone 12 Mini Loudspeaker | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Mini | iPhone 12 Mini Microphone | £79.00 | £65.83 | £1.00 | n/a | 0 | £0.00 | £1.58 | £63.25 | 96.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Mini | iPhone 12 Mini Mute Button | £79.00 | £65.83 | £1.00 | n/a | 0 | £0.00 | £1.58 | £63.25 | 96.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Mini | iPhone 12 Mini NO SERVICE (LOGIC BOARD REPAIR) | £180.00 | £150.00 | £1.00 | 590.28 | 10 | £14,166.69 | £3.60 | £-14,021.29 | -9347.5% | review pricing | timing source: linked parts |
| iPhone 12 Mini | iPhone 12 Mini NO WIFI (LOGIC BOARD REPAIR) | £180.00 | £150.00 | £1.00 | 590.28 | 10 | £14,166.69 | £3.60 | £-14,021.29 | -9347.5% | review pricing | timing source: linked parts |
| iPhone 12 Mini | iPhone 12 Mini Power Button | £79.00 | £65.83 | £1.00 | n/a | 0 | £0.00 | £1.58 | £63.25 | 96.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Mini | iPhone 12 Mini Rear Camera | £119.00 | £99.17 | £35.00 | n/a | 0 | £0.00 | £2.38 | £61.79 | 62.3% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Mini | iPhone 12 Mini Rear Camera Lens | £59.00 | £49.17 | £10.00 | n/a | 0 | £0.00 | £1.18 | £37.99 | 77.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Mini | iPhone 12 Mini Rear Housing (Rear Glass And Frame) | £179.00 | £149.17 | £550.00 | 1.18 | 2 | £28.40 | £3.58 | £-432.81 | -290.2% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 12 Mini | iPhone 12 Mini Screen | £199.00 | £165.83 | £35.00 | 12.57 | 2 | £325.76 | £3.98 | £-198.91 | -119.9% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs); includes 1h iPhone screen refurb labour adder |
| iPhone 12 Mini | iPhone 12 Mini Volume Button | £79.00 | £65.83 | £1.00 | n/a | 0 | £0.00 | £1.58 | £63.25 | 96.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Mini | iPhone 12 UNABLE TO ACTIVATE | £180.00 | £150.00 | £1.00 | 590.28 | 10 | £14,166.69 | £3.60 | £-14,021.29 | -9347.5% | review pricing | timing source: linked parts |
| iPhone 12 Pro | iPhone 12 Pro | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 12 Pro | iPhone 12 Pro Aftermarket Screen | £199.00 | £165.83 | £40.00 | 23.12 | 3 | £578.87 | £3.98 | £-457.02 | -275.6% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 12 Pro | iPhone 12 Pro Battery | £89.00 | £74.17 | £10.00 | 20.03 | 10 | £480.76 | £1.78 | £-418.37 | -564.1% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 12 Pro | iPhone 12 Pro Charging Port | £79.00 | £65.83 | £2.00 | 1.18 | 2 | £28.28 | £1.58 | £33.98 | 51.6% | watch | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 12 Pro | iPhone 12 Pro Diagnostic | £49.00 | £40.83 | £1.00 | 79.40 | 5 | £1,905.67 | £0.98 | £-1,866.82 | -4571.8% | review pricing | timing source: requested repair relation |
| iPhone 12 Pro | iPhone 12 Pro Earpiece Speaker | £79.00 | £65.83 | £20.00 | 13.18 | 8 | £316.32 | £1.58 | £-272.07 | -413.3% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 12 Pro | iPhone 12 Pro Front Camera | £249.00 | £207.50 | £1.00 | n/a | 0 | £0.00 | £4.98 | £201.52 | 97.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Pro | iPhone 12 Pro Loudspeaker | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Pro | iPhone 12 Pro Microphone | £79.00 | £65.83 | £2.50 | n/a | 0 | £0.00 | £1.58 | £61.75 | 93.8% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Pro | iPhone 12 Pro Mute Button | £79.00 | £65.83 | £1.00 | n/a | 0 | £0.00 | £1.58 | £63.25 | 96.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Pro | iPhone 12 Pro NO SERVICE (LOGIC BOARD REPAIR) | £200.00 | £166.67 | £1.00 | 590.28 | 10 | £14,166.69 | £4.00 | £-14,005.02 | -8403.0% | review pricing | timing source: linked parts |
| iPhone 12 Pro | iPhone 12 Pro NO WIFI (LOGIC BOARD REPAIR) | £200.00 | £166.67 | £1.00 | 590.28 | 10 | £14,166.69 | £4.00 | £-14,005.02 | -8403.0% | review pricing | timing source: linked parts |
| iPhone 12 Pro | iPhone 12 Pro Power Button | £79.00 | £65.83 | £1.00 | 102.88 | 1 | £2,469.06 | £1.58 | £-2,405.81 | -3654.4% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 12 Pro | iPhone 12 Pro Rear Camera | £129.00 | £107.50 | £55.00 | 0.94 | 4 | £22.61 | £2.58 | £27.31 | 25.4% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 12 Pro | iPhone 12 Pro Rear Camera Lens | £59.00 | £49.17 | £10.00 | 1.24 | 5 | £29.77 | £1.18 | £8.22 | 16.7% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 12 Pro | iPhone 12 Pro Rear Housing (Rear Glass And Frame) | £189.00 | £157.50 | £340.00 | 4.24 | 1 | £101.72 | £3.78 | £-288.00 | -182.9% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 12 Pro | iPhone 12 Pro Screen | £199.00 | £165.83 | £35.00 | 124.02 | 10 | £3,000.45 | £3.98 | £-2,873.59 | -1732.8% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 12 Pro | iPhone 12 Pro UNABLE TO ACTIVATE | £200.00 | £166.67 | £1.00 | 590.28 | 10 | £14,166.69 | £4.00 | £-14,005.02 | -8403.0% | review pricing | timing source: linked parts |
| iPhone 12 Pro | iPhone 12 Pro Volume Button | £80.00 | £66.67 | £1.00 | n/a | 0 | £0.00 | £1.60 | £64.07 | 96.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Pro Max | iPhone 12 Pro Max | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 12 Pro Max | iPhone 12 Pro Max Aftermarket Screen | £229.00 | £190.83 | £42.00 | 11.85 | 2 | £308.34 | £4.58 | £-164.08 | -86.0% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs); includes 1h iPhone screen refurb labour adder |
| iPhone 12 Pro Max | iPhone 12 Pro Max Battery | £89.00 | £74.17 | £15.00 | 28.96 | 10 | £695.10 | £1.78 | £-637.71 | -859.8% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 12 Pro Max | iPhone 12 Pro Max Charging Port | £79.00 | £65.83 | £3.00 | 3.10 | 1 | £74.46 | £1.58 | £-13.21 | -20.1% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 12 Pro Max | iPhone 12 Pro Max Diagnostic | £49.00 | £40.83 | £1.00 | 277.38 | 4 | £6,657.24 | £0.98 | £-6,618.38 | -16208.3% | review pricing | timing source: requested repair relation |
| iPhone 12 Pro Max | iPhone 12 Pro Max Earpiece Speaker | £79.00 | £65.83 | £13.57 | 4.41 | 1 | £105.75 | £1.58 | £-55.06 | -83.6% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 12 Pro Max | iPhone 12 Pro Max Front Camera | £249.00 | £207.50 | £40.00 | n/a | 0 | £0.00 | £4.98 | £162.52 | 78.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Pro Max | iPhone 12 Pro Max Loudspeaker | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Pro Max | iPhone 12 Pro Max Microphone | £79.00 | £65.83 | £2.50 | 3.10 | 1 | £74.46 | £1.58 | £-12.71 | -19.3% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 12 Pro Max | iPhone 12 Pro Max Mute Button | £79.00 | £65.83 | £1.00 | n/a | 0 | £0.00 | £1.58 | £63.25 | 96.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Pro Max | iPhone 12 Pro Max NO SERVICE (LOGIC BOARD REPAIR) | £200.00 | £166.67 | £1.00 | 590.28 | 10 | £14,166.69 | £4.00 | £-14,005.02 | -8403.0% | review pricing | timing source: linked parts |
| iPhone 12 Pro Max | iPhone 12 Pro Max NO WIFI (LOGIC BOARD REPAIR) | £200.00 | £166.67 | £1.00 | 590.28 | 10 | £14,166.69 | £4.00 | £-14,005.02 | -8403.0% | review pricing | timing source: linked parts |
| iPhone 12 Pro Max | iPhone 12 Pro Max Power Button | £79.00 | £65.83 | £1.00 | n/a | 0 | £0.00 | £1.58 | £63.25 | 96.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 12 Pro Max | iPhone 12 Pro Max Rear Camera | £129.00 | £107.50 | £45.00 | 2.08 | 3 | £49.90 | £2.58 | £10.02 | 9.3% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 12 Pro Max | iPhone 12 Pro Max Rear Camera Lens | £59.00 | £49.17 | £2.83 | 5.24 | 5 | £125.70 | £1.18 | £-80.54 | -163.8% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 12 Pro Max | iPhone 12 Pro Max Rear Housing (Rear Glass And Frame) | £189.00 | £157.50 | £340.00 | 2.75 | 4 | £66.11 | £3.78 | £-252.39 | -160.3% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 12 Pro Max | iPhone 12 Pro Max Screen | £229.00 | £190.83 | £40.00 | 37.27 | 8 | £918.44 | £4.58 | £-772.19 | -404.6% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 12 Pro Max | iPhone 12 Pro Max UNABLE TO ACTIVATE | £200.00 | £166.67 | £1.00 | 590.28 | 10 | £14,166.69 | £4.00 | £-14,005.02 | -8403.0% | review pricing | timing source: linked parts |
| iPhone 12 Pro Max | iPhone 12 Pro Max Volume Button | £79.00 | £65.83 | £1.00 | n/a | 0 | £0.00 | £1.58 | £63.25 | 96.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 | iPhone 13 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 13 | iPhone 13 Aftermarket Screen | £239.00 | £199.17 | £40.00 | 13.27 | 4 | £342.59 | £4.78 | £-188.21 | -94.5% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 13 | iPhone 13 Battery | £79.00 | £65.83 | £10.00 | 3.85 | 10 | £92.42 | £1.58 | £-38.17 | -58.0% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 | iPhone 13 Charging Port | £89.00 | £74.17 | £2.00 | 1.45 | 10 | £34.89 | £1.78 | £35.50 | 47.9% | watch | timing source: requested repair relation + linked parts |
| iPhone 13 | iPhone 13 Diagnostic | £49.00 | £40.83 | £1.00 | 76.30 | 10 | £1,831.24 | £0.98 | £-1,792.39 | -4389.5% | review pricing | timing source: requested repair relation |
| iPhone 13 | iPhone 13 Earpiece Speaker | £89.00 | £74.17 | £1.00 | 53.20 | 5 | £1,276.76 | £1.78 | £-1,205.38 | -1625.2% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 | iPhone 13 Front Camera | £249.00 | £207.50 | £1.00 | n/a | 0 | £0.00 | £4.98 | £201.52 | 97.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 | iPhone 13 Loudspeaker | £89.00 | £74.17 | £1.00 | 0.77 | 1 | £18.46 | £1.78 | £52.92 | 71.4% | healthy | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 13 | iPhone 13 Microphone | £89.00 | £74.17 | £1.00 | 1.57 | 3 | £37.65 | £1.78 | £33.73 | 45.5% | watch | timing source: requested repair relation |
| iPhone 13 | iPhone 13 Mute Button | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 | iPhone 13 Power Button | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 | iPhone 13 Rear Camera | £119.00 | £99.17 | £10.00 | 27.91 | 8 | £669.88 | £2.38 | £-583.09 | -588.0% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 | iPhone 13 Rear Camera Lens | £59.00 | £49.17 | £10.00 | 5.22 | 4 | £125.28 | £1.18 | £-87.29 | -177.5% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 | iPhone 13 Rear Housing (Rear Glass And Frame) | £189.00 | £157.50 | £470.00 | 140.88 | 5 | £3,381.21 | £3.78 | £-3,697.49 | -2347.6% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 | iPhone 13 Screen | £239.00 | £199.17 | £40.00 | 6.95 | 10 | £190.72 | £4.78 | £-36.33 | -18.2% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 13 | iPhone 13 Volume Button | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Mini | iPhone 13 Mini | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 13 Mini | iPhone 13 Mini Aftermarket Screen | £279.00 | £232.50 | £40.00 | 17.80 | 4 | £451.26 | £5.58 | £-264.34 | -113.7% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 13 Mini | iPhone 13 Mini Battery | £89.00 | £74.17 | £15.00 | 1.29 | 10 | £31.03 | £1.78 | £26.36 | 35.5% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 Mini | iPhone 13 Mini Charging Port | £89.00 | £74.17 | £2.00 | 0.44 | 2 | £10.60 | £1.78 | £59.79 | 80.6% | healthy | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 13 Mini | iPhone 13 Mini Diagnostic | £49.00 | £40.83 | £1.00 | 410.02 | 8 | £9,840.52 | £0.98 | £-9,801.67 | -24004.1% | review pricing | timing source: requested repair relation |
| iPhone 13 Mini | iPhone 13 Mini Earpiece Speaker | £89.00 | £74.17 | £1.00 | 1.10 | 1 | £26.29 | £1.78 | £45.09 | 60.8% | watch | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 13 Mini | iPhone 13 Mini Front Camera | £249.00 | £207.50 | £1.00 | n/a | 0 | £0.00 | £4.98 | £201.52 | 97.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Mini | iPhone 13 Mini Loudspeaker | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Mini | iPhone 13 Mini Microphone | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Mini | iPhone 13 Mini Mute Button | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Mini | iPhone 13 Mini Power Button | £89.00 | £74.17 | £1.00 | 0.46 | 1 | £11.16 | £1.78 | £60.23 | 81.2% | healthy | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 13 Mini | iPhone 13 Mini Rear Camera | £119.00 | £99.17 | £10.00 | 27.91 | 8 | £669.88 | £2.38 | £-583.09 | -588.0% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 Mini | iPhone 13 Mini Rear Camera Lens | £89.00 | £74.17 | £1.00 | 1.14 | 4 | £27.35 | £1.78 | £44.03 | 59.4% | watch | timing source: requested repair relation + linked parts |
| iPhone 13 Mini | iPhone 13 Mini Rear Housing (Rear Glass And Frame) | £199.00 | £165.83 | £600.00 | n/a | 0 | £0.00 | £3.98 | £-438.15 | -264.2% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Mini | iPhone 13 Mini Screen | £279.00 | £232.50 | £40.00 | 94.07 | 2 | £2,281.70 | £5.58 | £-2,094.78 | -901.0% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs); includes 1h iPhone screen refurb labour adder |
| iPhone 13 Mini | iPhone 13 Mini Volume Button | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Pro | iPhone 13 Pro | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 13 Pro | iPhone 13 Pro Aftermarket Screen | £289.00 | £240.83 | £50.00 | 57.73 | 5 | £1,409.49 | £5.78 | £-1,224.43 | -508.4% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 13 Pro | iPhone 13 Pro Battery | £79.00 | £65.83 | £20.00 | 12.59 | 10 | £302.21 | £1.58 | £-257.96 | -391.8% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 Pro | iPhone 13 Pro Charging Port | £89.00 | £74.17 | £2.00 | 28.08 | 6 | £673.89 | £1.78 | £-603.50 | -813.7% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 Pro | iPhone 13 Pro Diagnostic | £49.00 | £40.83 | £1.00 | 78.70 | 7 | £1,888.91 | £0.98 | £-1,850.06 | -4530.8% | review pricing | timing source: requested repair relation |
| iPhone 13 Pro | iPhone 13 Pro Earpiece Speaker | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Pro | iPhone 13 Pro Front Camera | £249.00 | £207.50 | £1.00 | n/a | 0 | £0.00 | £4.98 | £201.52 | 97.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Pro | iPhone 13 Pro Loudspeaker | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Pro | iPhone 13 Pro Microphone | £89.00 | £74.17 | £1.00 | 1.94 | 1 | £46.67 | £1.78 | £24.72 | 33.3% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 13 Pro | iPhone 13 Pro Mute Button | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Pro | iPhone 13 Pro Power Button | £89.00 | £74.17 | £1.00 | 0.95 | 1 | £22.81 | £1.78 | £48.58 | 65.5% | watch | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 13 Pro | iPhone 13 Pro Rear Camera | £119.00 | £99.17 | £50.00 | 17.66 | 9 | £423.80 | £2.38 | £-377.01 | -380.2% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 Pro | iPhone 13 Pro Rear Camera Lens | £89.00 | £74.17 | £1.00 | 21.26 | 6 | £510.14 | £1.78 | £-438.75 | -591.6% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 Pro | iPhone 13 Pro Rear Housing (Rear Glass And Frame) | £199.00 | £165.83 | £470.00 | 3.60 | 9 | £86.33 | £3.98 | £-394.48 | -237.9% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 Pro | iPhone 13 Pro Screen | £289.00 | £240.83 | £50.00 | 23.97 | 6 | £599.28 | £5.78 | £-414.23 | -172.0% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 13 Pro | iPhone 13 Pro Volume Button | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 13 Pro Max | iPhone 13 Pro Max Aftermarket Screen | £299.00 | £249.17 | £80.00 | 53.40 | 4 | £1,305.49 | £5.98 | £-1,142.30 | -458.4% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 13 Pro Max | iPhone 13 Pro Max Battery | £79.00 | £65.83 | £15.00 | 1.37 | 6 | £32.84 | £1.58 | £16.41 | 24.9% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 Pro Max | iPhone 13 Pro Max Charging Port | £89.00 | £74.17 | £2.00 | 16.68 | 3 | £400.24 | £1.78 | £-329.86 | -444.7% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 Pro Max | iPhone 13 Pro Max Diagnostic | £49.00 | £40.83 | £1.00 | 119.02 | 9 | £2,856.56 | £0.98 | £-2,817.71 | -6900.5% | review pricing | timing source: requested repair relation |
| iPhone 13 Pro Max | iPhone 13 Pro Max Earpiece Speaker | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max Front Camera | £249.00 | £207.50 | £1.00 | 66.54 | 1 | £1,596.89 | £4.98 | £-1,395.37 | -672.5% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max Loudspeaker | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max Microphone | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max Mute Button | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max Power Button | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max Rear Camera | £119.00 | £99.17 | £50.00 | 23.12 | 9 | £554.86 | £2.38 | £-508.08 | -512.3% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 Pro Max | iPhone 13 Pro Max Rear Camera Lens | £89.00 | £74.17 | £5.00 | 123.37 | 1 | £2,960.76 | £1.78 | £-2,893.38 | -3901.2% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 13 Pro Max | iPhone 13 Pro Max Rear Housing (Rear Glass And Frame) | £199.00 | £165.83 | £380.00 | 30.42 | 6 | £730.12 | £3.98 | £-948.27 | -571.8% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 13 Pro Max | iPhone 13 Pro Max Screen | £299.00 | £249.17 | £70.00 | 39.45 | 5 | £970.73 | £5.98 | £-797.54 | -320.1% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 13 Pro Max | iPhone 13 Pro Max Volume Button | £89.00 | £74.17 | £1.00 | n/a | 0 | £0.00 | £1.78 | £71.39 | 96.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 14 | iPhone 14 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 | iPhone 14 Aftermarket Screen | £239.00 | £199.17 | £75.00 | n/a | 0 | £24.00 | £4.78 | £95.39 | 47.9% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs); includes 1h iPhone screen refurb labour adder |
| iPhone 14 | iPhone 14 Battery | £79.00 | £65.83 | £15.00 | 1.85 | 5 | £44.39 | £1.58 | £4.86 | 7.4% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 14 | iPhone 14 Charging Port | £89.00 | £74.17 | £0.00 | 0.98 | 3 | £23.48 | £1.78 | £48.91 | 65.9% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| iPhone 14 | iPhone 14 Diagnostic | £49.00 | £40.83 | £1.00 | 225.35 | 8 | £5,408.52 | £0.98 | £-5,369.67 | -13150.2% | review pricing | timing source: requested repair relation |
| iPhone 14 | iPhone 14 Earpiece Speaker | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 | iPhone 14 Front Camera | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 | iPhone 14 Loudspeaker | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 | iPhone 14 Microphone | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 | iPhone 14 Mute Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 | iPhone 14 Power Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 | iPhone 14 Rear Camera | £119.00 | £99.17 | £35.00 | 3.01 | 2 | £72.29 | £2.38 | £-10.50 | -10.6% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 14 | iPhone 14 Rear Camera Lens | £79.00 | £65.83 | £0.00 | 1.20 | 1 | £28.80 | £1.58 | £35.46 | 53.9% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 | iPhone 14 Rear Glass | £239.00 | £199.17 | £400.00 | 1.00 | 2 | £23.94 | £4.78 | £-229.55 | -115.3% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 14 | iPhone 14 Rear Housing | £239.00 | £199.17 | £0.00 | n/a | 0 | £0.00 | £4.78 | £194.39 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 | iPhone 14 Screen | £239.00 | £199.17 | £80.00 | 4.69 | 6 | £136.48 | £4.78 | £-22.10 | -11.1% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 14 | iPhone 14 Volume Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Plus | iPhone 14 Plus | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Plus | iPhone 14 Plus Aftermarket Screen | £249.00 | £207.50 | £100.00 | 15.66 | 3 | £399.81 | £4.98 | £-297.29 | -143.3% | review pricing | timing source: linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 14 Plus | iPhone 14 Plus Battery | £79.00 | £65.83 | £15.00 | 0.92 | 1 | £22.17 | £1.58 | £27.08 | 41.1% | watch | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 14 Plus | iPhone 14 Plus Charging Port | £89.00 | £74.17 | £0.00 | n/a | 0 | £0.00 | £1.78 | £72.39 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Plus | iPhone 14 Plus Diagnostic | £49.00 | £40.83 | £1.00 | 154.35 | 5 | £3,704.48 | £0.98 | £-3,665.63 | -8977.0% | review pricing | timing source: requested repair relation |
| iPhone 14 Plus | iPhone 14 Plus Earpiece Speaker | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Plus | iPhone 14 Plus Front Camera | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Plus | iPhone 14 Plus Loudspeaker | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Plus | iPhone 14 Plus Microphone | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Plus | iPhone 14 Plus Mute Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Plus | iPhone 14 Plus Power Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Plus | iPhone 14 Plus Rear Camera | £119.00 | £99.17 | £0.00 | n/a | 0 | £0.00 | £2.38 | £96.79 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Plus | iPhone 14 Plus Rear Camera Lens | £79.00 | £65.83 | £0.00 | n/a | 0 | £0.00 | £1.58 | £64.25 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Plus | iPhone 14 Plus Rear Glass | £249.00 | £207.50 | £400.00 | n/a | 0 | £0.00 | £4.98 | £-197.48 | -95.2% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 14 Plus | iPhone 14 Plus Rear Housing | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Plus | iPhone 14 Plus Screen | £249.00 | £207.50 | £100.00 | 2.88 | 4 | £93.02 | £4.98 | £9.50 | 4.6% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 14 Plus | iPhone 14 Plus Volume Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Pro | iPhone 14 Pro | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Pro | iPhone 14 Pro Aftermarket Screen | £249.00 | £207.50 | £80.00 | 30.34 | 5 | £752.23 | £4.98 | £-629.71 | -303.5% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 14 Pro | iPhone 14 Pro Battery | £79.00 | £65.83 | £20.00 | 112.63 | 10 | £2,703.02 | £1.58 | £-2,658.77 | -4038.6% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 14 Pro | iPhone 14 Pro Charging Port | £89.00 | £74.17 | £0.00 | 20.97 | 10 | £503.37 | £1.78 | £-430.98 | -581.1% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| iPhone 14 Pro | iPhone 14 Pro Diagnostic | £49.00 | £40.83 | £1.00 | 224.65 | 10 | £5,391.71 | £0.98 | £-5,352.86 | -13109.0% | review pricing | timing source: requested repair relation |
| iPhone 14 Pro | iPhone 14 Pro Earpiece Speaker | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Pro | iPhone 14 Pro Front Camera | £299.00 | £249.17 | £0.00 | n/a | 0 | £0.00 | £5.98 | £243.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Pro | iPhone 14 Pro Loudspeaker | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Pro | iPhone 14 Pro Microphone | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Pro | iPhone 14 Pro Mute Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Pro | iPhone 14 Pro Power Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Pro | iPhone 14 Pro Rear Camera | £119.00 | £99.17 | £35.00 | 2.51 | 4 | £60.32 | £2.38 | £1.47 | 1.5% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 14 Pro | iPhone 14 Pro Rear Camera Lens | £99.00 | £82.50 | £0.00 | 2.25 | 4 | £53.95 | £1.98 | £26.57 | 32.2% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| iPhone 14 Pro | iPhone 14 Pro Rear Housing (Rear Glass And Frame) | £209.00 | £174.17 | £340.00 | 87.43 | 10 | £2,098.29 | £4.18 | £-2,268.31 | -1302.4% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 14 Pro | iPhone 14 Pro Screen | £249.00 | £207.50 | £100.00 | 49.72 | 5 | £1,217.36 | £4.98 | £-1,114.84 | -537.3% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 14 Pro | iPhone 14 Pro Volume Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Pro Max | iPhone 14 Pro Max | n/a | n/a | £40.00 | 18.33 | 3 | £439.80 | n/a | n/a | n/a | incomplete data | timing source: linked parts |
| iPhone 14 Pro Max | iPhone 14 Pro Max Aftermarket Screen | £299.00 | £249.17 | £80.00 | 14.45 | 9 | £370.72 | £5.98 | £-207.53 | -83.3% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 14 Pro Max | iPhone 14 Pro Max Battery | £89.00 | £74.17 | £0.75 | 51.78 | 9 | £1,242.61 | £1.78 | £-1,170.97 | -1578.8% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 14 Pro Max | iPhone 14 Pro Max Charging Port | £89.00 | £74.17 | £16.84 | 46.37 | 10 | £1,112.99 | £1.78 | £-1,057.44 | -1425.8% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 14 Pro Max | iPhone 14 Pro Max Diagnostic | £49.00 | £40.83 | £1.00 | 106.70 | 10 | £2,560.78 | £0.98 | £-2,521.92 | -6176.1% | review pricing | timing source: requested repair relation |
| iPhone 14 Pro Max | iPhone 14 Pro Max Earpiece Speaker | £99.00 | £82.50 | £1.00 | 2.83 | 1 | £67.97 | £1.98 | £11.55 | 14.0% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 14 Pro Max | iPhone 14 Pro Max Front Camera | £249.00 | £207.50 | £1.00 | n/a | 0 | £0.00 | £4.98 | £201.52 | 97.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 14 Pro Max | iPhone 14 Pro Max Loudspeaker | £59.00 | £49.17 | £1.00 | 2.83 | 1 | £67.97 | £1.18 | £-20.99 | -42.7% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 14 Pro Max | iPhone 14 Pro Max Microphone | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Pro Max | iPhone 14 Pro Max Mute Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Pro Max | iPhone 14 Pro Max Power Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 14 Pro Max | iPhone 14 Pro Max Rear Camera | £119.00 | £99.17 | £40.00 | 18.33 | 3 | £439.80 | £2.38 | £-383.02 | -386.2% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 14 Pro Max | iPhone 14 Pro Max Rear Camera Lens | £99.00 | £82.50 | £1.00 | 1.68 | 6 | £40.25 | £1.98 | £39.27 | 47.6% | watch | timing source: requested repair relation + linked parts |
| iPhone 14 Pro Max | iPhone 14 Pro Max Rear Housing (Rear Glass And Frame) | £209.00 | £174.17 | £340.00 | 12.38 | 9 | £297.04 | £4.18 | £-467.05 | -268.2% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 14 Pro Max | iPhone 14 Pro Max Screen | £299.00 | £249.17 | £120.00 | 50.25 | 8 | £1,230.08 | £5.98 | £-1,106.90 | -444.2% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 14 Pro Max | iPhone 14 Pro Max Volume Button | £99.00 | £82.50 | £0.00 | 2.95 | 1 | £70.69 | £1.98 | £9.83 | 11.9% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 | iPhone 15 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 | iPhone 15 Aftermarket Screen | £289.00 | £240.83 | £100.00 | 40.04 | 7 | £984.93 | £5.78 | £-849.88 | -352.9% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 15 | iPhone 15 Battery | £99.00 | £82.50 | £0.00 | 1.32 | 1 | £31.61 | £1.98 | £48.91 | 59.3% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 | iPhone 15 Charging Port | £149.00 | £124.17 | £0.00 | 223.48 | 1 | £5,363.63 | £2.98 | £-5,242.45 | -4222.1% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 | iPhone 15 Diagnostic | £49.00 | £40.83 | £1.00 | 121.26 | 4 | £2,910.31 | £0.98 | £-2,871.45 | -7032.1% | review pricing | timing source: requested repair relation |
| iPhone 15 | iPhone 15 Earpiece Speaker | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 | iPhone 15 Front Camera | £279.00 | £232.50 | £0.00 | n/a | 0 | £0.00 | £5.58 | £226.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 | iPhone 15 Loudspeaker | £129.00 | £107.50 | £0.00 | n/a | 0 | £0.00 | £2.58 | £104.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 | iPhone 15 Microphone | £129.00 | £107.50 | £0.00 | n/a | 0 | £0.00 | £2.58 | £104.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 | iPhone 15 Power Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 | iPhone 15 Rear Camera | £129.00 | £107.50 | £30.00 | 22.46 | 1 | £539.02 | £2.58 | £-464.10 | -431.7% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 15 | iPhone 15 Rear Camera Lens | £79.00 | £65.83 | £0.00 | n/a | 0 | £0.00 | £1.58 | £64.25 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 | iPhone 15 Rear Glass | £259.00 | £215.83 | £240.00 | 11.53 | 2 | £276.75 | £5.18 | £-306.10 | -141.8% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 15 | iPhone 15 Rear Housing | £259.00 | £215.83 | £0.00 | n/a | 0 | £0.00 | £5.18 | £210.65 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 | iPhone 15 Screen | £289.00 | £240.83 | £80.00 | 36.55 | 7 | £901.29 | £5.78 | £-746.23 | -309.9% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 15 | iPhone 15 Volume Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Plus | iPhone 15 Plus | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Plus | iPhone 15 Plus Aftermarket Screen | £289.00 | £240.83 | £55.00 | 0.48 | 1 | £35.51 | £5.78 | £144.55 | 60.0% | watch | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs); includes 1h iPhone screen refurb labour adder |
| iPhone 15 Plus | iPhone 15 Plus Battery | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Plus | iPhone 15 Plus Charging Port | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Plus | iPhone 15 Plus Diagnostic | £49.00 | £40.83 | £0.00 | n/a | 0 | £0.00 | £0.98 | £39.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Plus | iPhone 15 Plus Earpiece Speaker | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Plus | iPhone 15 Plus Front Camera | £279.00 | £232.50 | £0.00 | n/a | 0 | £0.00 | £5.58 | £226.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Plus | iPhone 15 Plus Loudspeaker | £129.00 | £107.50 | £0.00 | n/a | 0 | £0.00 | £2.58 | £104.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Plus | iPhone 15 Plus Microphone | £129.00 | £107.50 | £0.00 | n/a | 0 | £0.00 | £2.58 | £104.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Plus | iPhone 15 Plus Power Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Plus | iPhone 15 Plus Rear Camera | £129.00 | £107.50 | £0.00 | n/a | 0 | £0.00 | £2.58 | £104.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Plus | iPhone 15 Plus Rear Camera Lens | £79.00 | £65.83 | £0.00 | n/a | 0 | £0.00 | £1.58 | £64.25 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Plus | iPhone 15 Plus Rear Glass | £259.00 | £215.83 | £0.00 | n/a | 0 | £0.00 | £5.18 | £210.65 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Plus | iPhone 15 Plus Rear Housing | £259.00 | £215.83 | £0.00 | n/a | 0 | £0.00 | £5.18 | £210.65 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Plus | iPhone 15 Plus Screen | £289.00 | £240.83 | £80.00 | 0.93 | 1 | £46.21 | £5.78 | £108.84 | 45.2% | watch | timing source: linked parts; insufficient repair history (<3 completed repairs); includes 1h iPhone screen refurb labour adder |
| iPhone 15 Plus | iPhone 15 Plus Volume Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro | iPhone 15 Pro | n/a | n/a | £0.00 | 1.01 | 1 | £24.13 | n/a | n/a | n/a | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro | iPhone 15 Pro Aftermarket Screen | £339.00 | £282.50 | £81.00 | 1.40 | 10 | £57.57 | £6.78 | £137.15 | 48.5% | watch | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 15 Pro | iPhone 15 Pro Battery | £99.00 | £82.50 | £15.00 | 49.29 | 5 | £1,182.90 | £1.98 | £-1,117.38 | -1354.4% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 15 Pro | iPhone 15 Pro Charging Port | £149.00 | £124.17 | £0.00 | 127.67 | 1 | £3,064.07 | £2.98 | £-2,942.89 | -2370.1% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro | iPhone 15 Pro Earpiece Speaker | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro | iPhone 15 Pro Front Camera | £279.00 | £232.50 | £0.00 | n/a | 0 | £0.00 | £5.58 | £226.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro | iPhone 15 Pro Loudspeaker | £129.00 | £107.50 | £0.00 | n/a | 0 | £0.00 | £2.58 | £104.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro | iPhone 15 Pro Microphone | £129.00 | £107.50 | £0.00 | n/a | 0 | £0.00 | £2.58 | £104.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro | iPhone 15 Pro Power Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro | iPhone 15 Pro Rear Camera | £129.00 | £107.50 | £35.00 | 2.82 | 1 | £67.56 | £2.58 | £2.36 | 2.2% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 15 Pro | iPhone 15 Pro Rear Camera Lens | £79.00 | £65.83 | £0.00 | 0.43 | 2 | £10.29 | £1.58 | £53.96 | 82.0% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro | iPhone 15 Pro Rear Glass | £279.00 | £232.50 | £200.00 | 4.86 | 6 | £116.72 | £5.58 | £-89.80 | -38.6% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 15 Pro | iPhone 15 Pro Rear Housing | £279.00 | £232.50 | £0.00 | n/a | 0 | £0.00 | £5.58 | £226.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro | iPhone 15 Pro Screen | £339.00 | £282.50 | £130.00 | 5.04 | 7 | £144.87 | £6.78 | £0.85 | 0.3% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 15 Pro | iPhone 15 Pro Volume Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro Max | iPhone 15 Pro Max | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro Max | iPhone 15 Pro Max Aftermarket Screen | £359.00 | £299.17 | £81.00 | 1.88 | 5 | £69.00 | £7.18 | £141.98 | 47.5% | watch | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 15 Pro Max | iPhone 15 Pro Max Battery | £99.00 | £82.50 | £20.00 | 176.91 | 2 | £4,245.80 | £1.98 | £-4,185.28 | -5073.1% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 15 Pro Max | iPhone 15 Pro Max Charging Port | £149.00 | £124.17 | £0.00 | 104.22 | 3 | £2,501.32 | £2.98 | £-2,380.13 | -1916.9% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| iPhone 15 Pro Max | iPhone 15 Pro Max Diagnostic | £49.00 | £40.83 | £0.00 | 284.73 | 6 | £6,833.46 | £0.98 | £-6,793.60 | -16637.4% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| iPhone 15 Pro Max | iPhone 15 Pro Max Earpiece Speaker | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro Max | iPhone 15 Pro Max Front Camera | £279.00 | £232.50 | £0.00 | n/a | 0 | £0.00 | £5.58 | £226.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro Max | iPhone 15 Pro Max Loudspeaker | £129.00 | £107.50 | £0.00 | n/a | 0 | £0.00 | £2.58 | £104.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro Max | iPhone 15 Pro Max Microphone | £129.00 | £107.50 | £0.00 | n/a | 0 | £0.00 | £2.58 | £104.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro Max | iPhone 15 Pro Max Power Button | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro Max | iPhone 15 Pro Max Rear Camera | £129.00 | £107.50 | £35.00 | 1.93 | 2 | £46.20 | £2.58 | £23.72 | 22.1% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 15 Pro Max | iPhone 15 Pro Max Rear Camera Lens | £79.00 | £65.83 | £0.00 | 1.16 | 3 | £27.91 | £1.58 | £36.34 | 55.2% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
| iPhone 15 Pro Max | iPhone 15 Pro Max Rear Glass | £279.00 | £232.50 | £165.00 | 449.77 | 3 | £10,794.50 | £5.58 | £-10,732.58 | -4616.2% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 15 Pro Max | iPhone 15 Pro Max Rear Housing | £279.00 | £232.50 | £0.00 | n/a | 0 | £0.00 | £5.58 | £226.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 15 Pro Max | iPhone 15 Pro Max Screen | £359.00 | £299.17 | £150.00 | 245.86 | 8 | £5,924.62 | £7.18 | £-5,782.63 | -1932.9% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 15 Pro Max | iPhone 15 Pro Max Volume Button | £99.00 | £82.50 | £0.00 | 20.12 | 1 | £482.94 | £1.98 | £-402.42 | -487.8% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 | iPhone 16 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 | iPhone 16 Battery | £119.00 | £99.17 | £0.00 | n/a | 0 | £0.00 | £2.38 | £96.79 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 | iPhone 16 Charging Port | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 | iPhone 16 Diagnostic | £49.00 | £40.83 | £0.00 | 5.21 | 1 | £124.97 | £0.98 | £-85.12 | -208.5% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 | iPhone 16 Earpiece Speaker | £129.00 | £107.50 | £0.00 | n/a | 0 | £0.00 | £2.58 | £104.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 | iPhone 16 Front Camera | £299.00 | £249.17 | £0.00 | n/a | 0 | £0.00 | £5.98 | £243.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 | iPhone 16 Loudspeaker | £159.00 | £132.50 | £0.00 | n/a | 0 | £0.00 | £3.18 | £129.32 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 | iPhone 16 Microphone | £159.00 | £132.50 | £0.00 | n/a | 0 | £0.00 | £3.18 | £129.32 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 | iPhone 16 Power Button | £159.00 | £132.50 | £0.00 | n/a | 0 | £0.00 | £3.18 | £129.32 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 | iPhone 16 Rear Camera | £179.00 | £149.17 | £0.00 | 5.21 | 1 | £124.97 | £3.58 | £20.62 | 13.8% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 | iPhone 16 Rear Camera Lens | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 | iPhone 16 Rear Glass | £289.00 | £240.83 | £0.00 | n/a | 0 | £0.00 | £5.78 | £235.05 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 | iPhone 16 Rear Housing | £289.00 | £240.83 | £0.00 | n/a | 0 | £0.00 | £5.78 | £235.05 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 | iPhone 16 Screen | £279.00 | £232.50 | £0.00 | n/a | 0 | £24.00 | £5.58 | £202.92 | 87.3% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage; includes 1h iPhone screen refurb labour adder |
| iPhone 16 | iPhone 16 Volume Button | £159.00 | £132.50 | £0.00 | n/a | 0 | £0.00 | £3.18 | £129.32 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Plus | iPhone 16 Plus | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Plus | iPhone 16 Plus Battery | £119.00 | £99.17 | £0.00 | n/a | 0 | £0.00 | £2.38 | £96.79 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Plus | iPhone 16 Plus Charging Port | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Plus | iPhone 16 Plus Diagnostic | £49.00 | £40.83 | £0.00 | n/a | 0 | £0.00 | £0.98 | £39.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Plus | iPhone 16 Plus Earpiece Speaker | £119.00 | £99.17 | £0.00 | n/a | 0 | £0.00 | £2.38 | £96.79 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Plus | iPhone 16 Plus Front Camera | £189.00 | £157.50 | £0.00 | n/a | 0 | £0.00 | £3.78 | £153.72 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Plus | iPhone 16 Plus Loudspeaker | £159.00 | £132.50 | £0.00 | n/a | 0 | £0.00 | £3.18 | £129.32 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Plus | iPhone 16 Plus Microphone | £159.00 | £132.50 | £0.00 | n/a | 0 | £0.00 | £3.18 | £129.32 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Plus | iPhone 16 Plus Power Button | £159.00 | £132.50 | £0.00 | n/a | 0 | £0.00 | £3.18 | £129.32 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Plus | iPhone 16 Plus Rear Camera | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Plus | iPhone 16 Plus Rear Camera Lens | £99.00 | £82.50 | £0.00 | n/a | 0 | £0.00 | £1.98 | £80.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Plus | iPhone 16 Plus Rear Glass | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Plus | iPhone 16 Plus Rear Housing | £319.00 | £265.83 | £0.00 | n/a | 0 | £0.00 | £6.38 | £259.45 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Plus | iPhone 16 Plus Screen | £299.00 | £249.17 | £0.00 | 1.72 | 1 | £65.21 | £5.98 | £177.97 | 71.4% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage; includes 1h iPhone screen refurb labour adder |
| iPhone 16 Plus | iPhone 16 Plus Volume Button | £159.00 | £132.50 | £0.00 | n/a | 0 | £0.00 | £3.18 | £129.32 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro | iPhone 16 Pro | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro | iPhone 16 Pro  Power Button | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro | iPhone 16 Pro Battery | £119.00 | £99.17 | £0.00 | n/a | 0 | £0.00 | £2.38 | £96.79 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro | iPhone 16 Pro Charging Port | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro | iPhone 16 Pro Diagnostic | £49.00 | £40.83 | £0.00 | 858.64 | 1 | £20,607.24 | £0.98 | £-20,567.39 | -50369.1% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro | iPhone 16 Pro Earpiece Speaker | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro | iPhone 16 Pro Front Camera | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro | iPhone 16 Pro Loudspeaker | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro | iPhone 16 Pro Microphone | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro | iPhone 16 Pro Rear Camera | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro | iPhone 16 Pro Rear Camera Lens | £119.00 | £99.17 | £0.00 | 0.76 | 2 | £18.19 | £2.38 | £78.60 | 79.3% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro | iPhone 16 Pro Rear Glass | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro | iPhone 16 Pro Rear Housing | £349.00 | £290.83 | £0.00 | n/a | 0 | £0.00 | £6.98 | £283.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro | iPhone 16 Pro Screen | £349.00 | £290.83 | £220.00 | 2.30 | 3 | £79.21 | £6.98 | £-15.35 | -5.3% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 16 Pro | iPhone 16 Pro Volume Button | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro Max | iPhone 16 Pro Max | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro Max | iPhone 16 Pro Max Battery | £119.00 | £99.17 | £0.00 | n/a | 0 | £0.00 | £2.38 | £96.79 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro Max | iPhone 16 Pro Max Charging Port | £199.00 | £165.83 | £0.00 | n/a | 0 | £0.00 | £3.98 | £161.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro Max | iPhone 16 Pro Max Diagnostic | £49.00 | £40.83 | £0.00 | 1.91 | 1 | £45.85 | £0.98 | £-5.99 | -14.7% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro Max | iPhone 16 Pro Max Earpiece Speaker | £149.00 | £124.17 | £0.00 | n/a | 0 | £0.00 | £2.98 | £121.19 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro Max | iPhone 16 Pro Max Front Camera | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro Max | iPhone 16 Pro Max Loudspeaker | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro Max | iPhone 16 Pro Max Microphone | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro Max | iPhone 16 Pro Max Power Button | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro Max | iPhone 16 Pro Max Rear Camera | £249.00 | £207.50 | £0.00 | n/a | 0 | £0.00 | £4.98 | £202.52 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro Max | iPhone 16 Pro Max Rear Camera Lens | £119.00 | £99.17 | £0.00 | n/a | 0 | £0.00 | £2.38 | £96.79 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro Max | iPhone 16 Pro Max Rear Glass | £279.00 | £232.50 | £0.00 | n/a | 0 | £0.00 | £5.58 | £226.92 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro Max | iPhone 16 Pro Max Rear Housing | £379.00 | £315.83 | £0.00 | n/a | 0 | £0.00 | £7.58 | £308.25 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 16 Pro Max | iPhone 16 Pro Max Screen | £379.00 | £315.83 | £250.00 | 1.21 | 4 | £53.03 | £7.58 | £5.23 | 1.7% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 16 Pro Max | iPhone 16 Pro Max Volume Button | £179.00 | £149.17 | £0.00 | n/a | 0 | £0.00 | £3.58 | £145.59 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 6 | iPhone 6 Battery | £50.00 | £41.67 | £15.00 | n/a | 0 | £0.00 | £1.00 | £25.67 | 61.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 | iPhone 6 Charging Port | £50.00 | £41.67 | £20.00 | n/a | 0 | £0.00 | £1.00 | £20.67 | 49.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 | iPhone 6 Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 | iPhone 6 Headphone Jack | n/a | n/a | £20.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 | iPhone 6 Loudspeaker | £50.00 | £41.67 | £2.00 | n/a | 0 | £0.00 | £1.00 | £38.67 | 92.8% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 | iPhone 6 Microphone | £50.00 | £41.67 | £20.00 | n/a | 0 | £0.00 | £1.00 | £20.67 | 49.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 | iPhone 6 Mute Button | £50.00 | £41.67 | £10.00 | n/a | 0 | £0.00 | £1.00 | £30.67 | 73.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 | iPhone 6 Original LCD Screen | £70.00 | £58.33 | £29.30 | n/a | 0 | £24.00 | £1.40 | £3.63 | 6.2% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs); includes 1h iPhone screen refurb labour adder |
| iPhone 6 | iPhone 6 Power Button | £50.00 | £41.67 | £10.00 | n/a | 0 | £0.00 | £1.00 | £30.67 | 73.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 | iPhone 6 Rear Camera | £50.00 | £41.67 | £35.00 | n/a | 0 | £0.00 | £1.00 | £5.67 | 13.6% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 | iPhone 6 Rear Camera Lens | £40.00 | £33.33 | £2.00 | n/a | 0 | £0.00 | £0.80 | £30.53 | 91.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 | iPhone 6 Volume Button | £50.00 | £41.67 | £10.00 | n/a | 0 | £0.00 | £1.00 | £30.67 | 73.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 | iPhone 6 Wifi  Module | £50.00 | £41.67 | £1.00 | n/a | 0 | £0.00 | £1.00 | £39.67 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 Plus | iPhone 6 Plus Battery | £50.00 | £41.67 | £15.00 | n/a | 0 | £0.00 | £1.00 | £25.67 | 61.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 Plus | iPhone 6 Plus Charging Port | £50.00 | £41.67 | £20.00 | n/a | 0 | £0.00 | £1.00 | £20.67 | 49.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 Plus | iPhone 6 Plus Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 Plus | iPhone 6 Plus Headphone Jack | £50.00 | £41.67 | £20.00 | n/a | 0 | £0.00 | £1.00 | £20.67 | 49.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 Plus | iPhone 6 Plus Loudspeaker | £50.00 | £41.67 | £1.00 | n/a | 0 | £0.00 | £1.00 | £39.67 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 Plus | iPhone 6 Plus Microphone | £50.00 | £41.67 | £20.00 | n/a | 0 | £0.00 | £1.00 | £20.67 | 49.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 Plus | iPhone 6 Plus Mute Button | £50.00 | £41.67 | £10.00 | n/a | 0 | £0.00 | £1.00 | £30.67 | 73.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 Plus | iPhone 6 Plus Original LCD Screen | £80.00 | £66.67 | £42.00 | n/a | 0 | £24.00 | £1.60 | £-0.93 | -1.4% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs); includes 1h iPhone screen refurb labour adder |
| iPhone 6 Plus | iPhone 6 Plus Power Button | £50.00 | £41.67 | £10.00 | n/a | 0 | £0.00 | £1.00 | £30.67 | 73.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 Plus | iPhone 6 Plus Rear Camera | £50.00 | £41.67 | £35.00 | n/a | 0 | £0.00 | £1.00 | £5.67 | 13.6% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 Plus | iPhone 6 Plus Rear Camera Lens | £40.00 | £33.33 | £1.00 | n/a | 0 | £0.00 | £0.80 | £31.53 | 94.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 Plus | iPhone 6 Plus Volume Button | £50.00 | £41.67 | £10.00 | n/a | 0 | £0.00 | £1.00 | £30.67 | 73.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6 Plus | iPhone 6 Plus Wifi  Module | £50.00 | £41.67 | £1.00 | n/a | 0 | £0.00 | £1.00 | £39.67 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6S Plus | iPhone 5c diagnostic | £49.00 | £40.83 | £0.00 | n/a | 0 | £0.00 | £0.98 | £39.85 | 97.6% | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 6S Plus | iPhone 6s Plus Battery | £50.00 | £41.67 | £15.00 | n/a | 0 | £0.00 | £1.00 | £25.67 | 61.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6S Plus | iPhone 6s Plus Charging Port | £50.00 | £41.67 | £20.00 | n/a | 0 | £0.00 | £1.00 | £20.67 | 49.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6S Plus | iPhone 6S Plus Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6S Plus | iPhone 6s Plus Loudspeaker | £50.00 | £41.67 | £1.00 | n/a | 0 | £0.00 | £1.00 | £39.67 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6S Plus | iPhone 6s Plus Microphone | £50.00 | £41.67 | £20.00 | n/a | 0 | £0.00 | £1.00 | £20.67 | 49.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6S Plus | iPhone 6s Plus Mute Button | £50.00 | £41.67 | £10.00 | n/a | 0 | £0.00 | £1.00 | £30.67 | 73.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6S Plus | iPhone 6s Plus Original LCD Screen | £90.00 | £75.00 | £42.00 | n/a | 0 | £24.00 | £1.80 | £7.20 | 9.6% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs); includes 1h iPhone screen refurb labour adder |
| iPhone 6S Plus | iPhone 6s Plus Power Button | £50.00 | £41.67 | £10.00 | n/a | 0 | £0.00 | £1.00 | £30.67 | 73.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6S Plus | iPhone 6s Plus Rear Camera | £50.00 | £41.67 | £35.00 | n/a | 0 | £0.00 | £1.00 | £5.67 | 13.6% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6S Plus | iPhone 6s Plus Rear Camera Lens | £40.00 | £33.33 | £1.00 | n/a | 0 | £0.00 | £0.80 | £31.53 | 94.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6S Plus | iPhone 6s Plus Volume Button | £50.00 | £41.67 | £10.00 | n/a | 0 | £0.00 | £1.00 | £30.67 | 73.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6S Plus | Liquid Damage Treatment | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 6S Plus | MacBook Air 13 A2179 Lid Replacement | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 6S Plus | MacBook Pro 13 A1708 Bezel Replacement | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 6s, iPhone 5 | iPhone 6s Battery | £50.00 | £41.67 | £15.00 | n/a | 0 | £0.00 | £1.00 | £25.67 | 61.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Charging Port | £50.00 | £41.67 | £10.00 | n/a | 0 | £0.00 | £1.00 | £30.67 | 73.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Loudspeaker | £50.00 | £41.67 | £5.00 | n/a | 0 | £0.00 | £1.00 | £35.67 | 85.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Microphone | £50.00 | £41.67 | £10.00 | n/a | 0 | £0.00 | £1.00 | £30.67 | 73.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Mute Button | £50.00 | £41.67 | £10.00 | n/a | 0 | £0.00 | £1.00 | £30.67 | 73.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Original LCD Screen | £70.00 | £58.33 | £40.00 | n/a | 0 | £24.00 | £1.40 | £-7.07 | -12.1% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs); includes 1h iPhone screen refurb labour adder |
| iPhone 6s, iPhone 5 | iPhone 6s Power Button | £50.00 | £41.67 | £10.00 | n/a | 0 | £0.00 | £1.00 | £30.67 | 73.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Rear Camera | £50.00 | £41.67 | £35.00 | n/a | 0 | £0.00 | £1.00 | £5.67 | 13.6% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Rear Camera Lens | £40.00 | £33.33 | £111.00 | n/a | 0 | £0.00 | £0.80 | £-78.47 | -235.4% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 6s, iPhone 5 | iPhone 6s Volume Button | £50.00 | £41.67 | £10.00 | n/a | 0 | £0.00 | £1.00 | £30.67 | 73.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 | iPhone 7 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 7 | iPhone 7 Battery | £59.00 | £49.17 | £2.50 | 2.22 | 2 | £53.28 | £1.18 | £-7.79 | -15.8% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 7 | iPhone 7 Charging Port | £59.00 | £49.17 | £20.00 | n/a | 0 | £0.00 | £1.18 | £27.99 | 56.9% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 | iPhone 7 Diagnostic | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 | iPhone 7 Earpiece Speaker | £79.00 | £65.83 | £5.00 | 3.84 | 1 | £92.16 | £1.58 | £-32.91 | -50.0% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 7 | iPhone 7 Loudspeaker | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 | iPhone 7 Microphone | £59.00 | £49.17 | £20.00 | n/a | 0 | £0.00 | £1.18 | £27.99 | 56.9% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 | iPhone 7 Mute Button | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 | iPhone 7 Original LCD Screen | £129.00 | £107.50 | £35.00 | 1.89 | 2 | £69.45 | £2.58 | £0.47 | 0.4% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs); includes 1h iPhone screen refurb labour adder |
| iPhone 7 | iPhone 7 Power Button | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 | iPhone 7 Rear Camera | £49.00 | £40.83 | £35.00 | n/a | 0 | £0.00 | £0.98 | £4.85 | 11.9% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 | iPhone 7 Rear Camera Lens | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 | iPhone 7 Volume Button | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 Plus | iPhone 7 Plus | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 7 Plus | iPhone 7 Plus Battery | £59.00 | £49.17 | £8.00 | 1.36 | 1 | £32.64 | £1.18 | £7.34 | 14.9% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 7 Plus | iPhone 7 Plus Charging Port | £59.00 | £49.17 | £20.00 | 35.54 | 2 | £852.88 | £1.18 | £-824.90 | -1677.8% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 7 Plus | iPhone 7 Plus Diagnostic | £49.00 | £40.83 | £1.00 | 68.03 | 1 | £1,632.66 | £0.98 | £-1,593.81 | -3903.2% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 7 Plus | iPhone 7 Plus Earpiece Speaker | £99.00 | £82.50 | £0.90 | n/a | 0 | £0.00 | £1.98 | £79.62 | 96.5% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 Plus | iPhone 7 Plus Loudspeaker | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 Plus | iPhone 7 Plus Microphone | £59.00 | £49.17 | £20.00 | 3.05 | 1 | £73.10 | £1.18 | £-45.11 | -91.8% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 7 Plus | iPhone 7 Plus Mute Button | £49.00 | £40.83 | £10.00 | n/a | 0 | £0.00 | £0.98 | £29.85 | 73.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 Plus | iPhone 7 Plus Original LCD Screen | £129.00 | £107.50 | £80.00 | 38.07 | 2 | £937.62 | £2.58 | £-912.70 | -849.0% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs); includes 1h iPhone screen refurb labour adder |
| iPhone 7 Plus | iPhone 7 Plus Power Button | £49.00 | £40.83 | £10.00 | n/a | 0 | £0.00 | £0.98 | £29.85 | 73.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 Plus | iPhone 7 Plus Rear Camera | £49.00 | £40.83 | £35.00 | n/a | 0 | £0.00 | £0.98 | £4.85 | 11.9% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 Plus | iPhone 7 Plus Rear Camera Lens | £49.00 | £40.83 | £3.00 | n/a | 0 | £0.00 | £0.98 | £36.85 | 90.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 7 Plus | iPhone 7 Plus Volume Button | £49.00 | £40.83 | £10.00 | n/a | 0 | £0.00 | £0.98 | £29.85 | 73.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 | iPhone 8 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 8 | iPhone 8 Battery | £59.00 | £49.17 | £5.00 | 0.53 | 2 | £12.73 | £1.18 | £30.26 | 61.5% | watch | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 8 | iPhone 8 Charging Port | £59.00 | £49.17 | £15.00 | 196.49 | 6 | £4,715.69 | £1.18 | £-4,682.71 | -9524.2% | review pricing | timing source: requested repair relation + linked parts |
| iPhone 8 | iPhone 8 Diagnostic | £49.00 | £40.83 | £1.00 | 142.36 | 1 | £3,416.58 | £0.98 | £-3,377.73 | -8272.0% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 8 | iPhone 8 Earpiece Speaker | £79.00 | £65.83 | £5.00 | 3.84 | 1 | £92.16 | £1.58 | £-32.91 | -50.0% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 8 | iPhone 8 Front Camera | £89.00 | £74.17 | £5.00 | 1.30 | 1 | £31.18 | £1.78 | £36.21 | 48.8% | watch | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 8 | iPhone 8 Loudspeaker | £49.00 | £40.83 | £5.00 | n/a | 0 | £0.00 | £0.98 | £34.85 | 85.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 | iPhone 8 Microphone | £59.00 | £49.17 | £15.00 | 259.03 | 4 | £6,216.73 | £1.18 | £-6,183.74 | -12577.1% | review pricing | timing source: linked parts |
| iPhone 8 | iPhone 8 Mute Button | £49.00 | £40.83 | £10.00 | n/a | 0 | £0.00 | £0.98 | £29.85 | 73.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 | iPhone 8 Original LCD Screen | £129.00 | £107.50 | £15.00 | 27.85 | 10 | £692.43 | £2.58 | £-602.51 | -560.5% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone 8 | iPhone 8 Power Button | £49.00 | £40.83 | £10.00 | n/a | 0 | £0.00 | £0.98 | £29.85 | 73.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 | iPhone 8 Rear Camera | £79.00 | £65.83 | £35.00 | n/a | 0 | £0.00 | £1.58 | £29.25 | 44.4% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 | iPhone 8 Rear Camera Lens | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 | iPhone 8 Rear Housing (Rear Glass And Frame) | £109.00 | £90.83 | £170.00 | n/a | 0 | £0.00 | £2.18 | £-81.35 | -89.6% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 | iPhone 8 Volume Button | £49.00 | £40.83 | £10.00 | n/a | 0 | £0.00 | £0.98 | £29.85 | 73.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 Plus | iPhone 8 Plus | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone 8 Plus | iPhone 8 Plus Battery | £59.00 | £49.17 | £15.00 | 21.96 | 2 | £527.10 | £1.18 | £-494.11 | -1005.0% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone 8 Plus | iPhone 8 Plus Charging Port | £59.00 | £49.17 | £20.00 | n/a | 0 | £0.00 | £1.18 | £27.99 | 56.9% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 Plus | iPhone 8 Plus Diagnostic | £49.00 | £40.83 | £1.00 | 188.95 | 2 | £4,534.89 | £0.98 | £-4,496.03 | -11010.7% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone 8 Plus | iPhone 8 Plus Display (Original LCD Screen) | £129.00 | £107.50 | £144.00 | n/a | 0 | £24.00 | £2.58 | £-63.08 | -58.7% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs); includes 1h iPhone screen refurb labour adder |
| iPhone 8 Plus | iPhone 8 Plus Earpiece Speaker | £79.00 | £65.83 | £0.90 | n/a | 0 | £0.00 | £1.58 | £63.35 | 96.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 Plus | iPhone 8 Plus Front Camera | £89.00 | £74.17 | £15.00 | n/a | 0 | £0.00 | £1.78 | £57.39 | 77.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 Plus | iPhone 8 Plus Loudspeaker | £49.00 | £40.83 | £10.00 | n/a | 0 | £0.00 | £0.98 | £29.85 | 73.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 Plus | iPhone 8 Plus Microphone | £59.00 | £49.17 | £20.00 | n/a | 0 | £0.00 | £1.18 | £27.99 | 56.9% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 Plus | iPhone 8 Plus Mute Button | £49.00 | £40.83 | £10.00 | n/a | 0 | £0.00 | £0.98 | £29.85 | 73.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 Plus | iPhone 8 Plus Power Button | £49.00 | £40.83 | £10.00 | n/a | 0 | £0.00 | £0.98 | £29.85 | 73.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 Plus | iPhone 8 Plus Rear Camera | £100.00 | £83.33 | £35.00 | n/a | 0 | £0.00 | £2.00 | £46.33 | 55.6% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 Plus | iPhone 8 Plus Rear Camera Lens | £49.00 | £40.83 | £3.00 | n/a | 0 | £0.00 | £0.98 | £36.85 | 90.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 Plus | iPhone 8 Plus Rear Housing (Rear Glass And Frame) | £109.00 | £90.83 | £190.00 | n/a | 0 | £0.00 | £2.18 | £-101.35 | -111.6% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone 8 Plus | iPhone 8 Plus Volume Button | £49.00 | £40.83 | £10.00 | n/a | 0 | £0.00 | £0.98 | £29.85 | 73.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone SE2 | iPhone SE2 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone SE2 | iPhone SE2 Battery | £89.00 | £74.17 | £15.00 | 18.71 | 9 | £448.99 | £1.78 | £-391.60 | -528.0% | review pricing | timing source: requested repair relation + linked parts |
| iPhone SE2 | iPhone SE2 Charging Port | £59.00 | £49.17 | £5.00 | 148.10 | 7 | £3,554.33 | £1.18 | £-3,511.34 | -7141.7% | review pricing | timing source: requested repair relation + linked parts |
| iPhone SE2 | iPhone SE2 Diagnostic | £49.00 | £40.83 | £1.00 | 83.82 | 5 | £2,011.59 | £0.98 | £-1,972.74 | -4831.2% | review pricing | timing source: requested repair relation |
| iPhone SE2 | iPhone SE2 Display (Original LCD Screen) | £149.00 | £124.17 | £15.00 | 8.20 | 10 | £220.87 | £2.98 | £-114.68 | -92.4% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone SE2 | iPhone SE2 Earpiece Speaker | £49.00 | £40.83 | £5.00 | 3.84 | 1 | £92.16 | £0.98 | £-57.31 | -140.4% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone SE2 | iPhone SE2 Front Camera | £49.00 | £40.83 | £5.00 | 1.30 | 1 | £31.18 | £0.98 | £3.68 | 9.0% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone SE2 | iPhone SE2 Loudspeaker | £49.00 | £40.83 | £5.00 | n/a | 0 | £0.00 | £0.98 | £34.85 | 85.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone SE2 | iPhone SE2 Microphone | £59.00 | £49.17 | £15.00 | 259.03 | 4 | £6,216.73 | £1.18 | £-6,183.74 | -12577.1% | review pricing | timing source: linked parts |
| iPhone SE2 | iPhone SE2 Mute Button | £49.00 | £40.83 | £10.00 | n/a | 0 | £0.00 | £0.98 | £29.85 | 73.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone SE2 | iPhone SE2 Power Button | £49.00 | £40.83 | £10.00 | n/a | 0 | £0.00 | £0.98 | £29.85 | 73.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone SE2 | iPhone SE2 Proximity Sensor | £49.00 | £40.83 | £5.00 | 1.30 | 1 | £31.18 | £0.98 | £3.68 | 9.0% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone SE2 | iPhone SE2 Rear Camera | £79.00 | £65.83 | £35.00 | n/a | 0 | £0.00 | £1.58 | £29.25 | 44.4% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone SE2 | iPhone SE2 Rear Camera Lens | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone SE2 | iPhone SE2 Rear Housing (Rear Glass And Frame) | £109.00 | £90.83 | £123.16 | 3.30 | 1 | £79.17 | £2.18 | £-113.67 | -125.1% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone SE2 | iPhone SE2 Volume Button | £49.00 | £40.83 | £10.00 | n/a | 0 | £0.00 | £0.98 | £29.85 | 73.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone SE2 | iPhone SE2 Wifi Module | £50.00 | £41.67 | £1.00 | n/a | 0 | £0.00 | £1.00 | £39.67 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone SE3 | iPhone SE3 | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone SE3 | iPhone SE3 Battery | £89.00 | £74.17 | £15.00 | 9.09 | 6 | £218.23 | £1.78 | £-160.84 | -216.9% | review pricing | timing source: requested repair relation + linked parts |
| iPhone SE3 | iPhone SE3 Charging Port | £69.00 | £57.50 | £15.00 | 162.15 | 7 | £3,891.66 | £1.38 | £-3,850.54 | -6696.6% | review pricing | timing source: requested repair relation + linked parts |
| iPhone SE3 | iPhone SE3 Diagnostic | £49.00 | £40.83 | £1.00 | 48.32 | 6 | £1,159.72 | £0.98 | £-1,120.86 | -2745.0% | review pricing | timing source: requested repair relation |
| iPhone SE3 | iPhone SE3 Earpiece Speaker | £59.00 | £49.17 | £5.00 | 3.84 | 1 | £92.16 | £1.18 | £-49.18 | -100.0% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone SE3 | iPhone SE3 Front Camera | £49.00 | £40.83 | £5.00 | 1.30 | 1 | £31.18 | £0.98 | £3.68 | 9.0% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone SE3 | iPhone SE3 Loudspeaker | £49.00 | £40.83 | £5.00 | n/a | 0 | £0.00 | £0.98 | £34.85 | 85.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone SE3 | iPhone SE3 Microphone | £69.00 | £57.50 | £15.00 | 259.03 | 4 | £6,216.73 | £1.38 | £-6,175.61 | -10740.2% | review pricing | timing source: requested repair relation + linked parts |
| iPhone SE3 | iPhone SE3 Mute Button | £59.00 | £49.17 | £10.00 | n/a | 0 | £0.00 | £1.18 | £37.99 | 77.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone SE3 | iPhone SE3 Original Apple Screen Assembly | £149.00 | £124.17 | £0.00 | 407.89 | 1 | £9,813.29 | £2.98 | £-9,692.10 | -7805.7% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage; includes 1h iPhone screen refurb labour adder |
| iPhone SE3 | iPhone SE3 Original LCD Screen | £149.00 | £124.17 | £15.00 | 85.44 | 10 | £2,074.61 | £2.98 | £-1,968.43 | -1585.3% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone SE3 | iPhone SE3 Power Button | £59.00 | £49.17 | £10.00 | n/a | 0 | £0.00 | £1.18 | £37.99 | 77.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone SE3 | iPhone SE3 Rear Camera | £99.00 | £82.50 | £0.00 | 15.60 | 2 | £374.46 | £1.98 | £-293.94 | -356.3% | incomplete data | timing source: requested repair relation; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone SE3 | iPhone SE3 Rear Camera Lens | £59.00 | £49.17 | £1.00 | 207.99 | 1 | £4,991.80 | £1.18 | £-4,944.81 | -10057.2% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone SE3 | iPhone SE3 Rear Housing (Rear Glass And Frame) | £129.00 | £107.50 | £42.00 | 197.15 | 10 | £4,731.52 | £2.58 | £-4,668.60 | -4342.9% | review pricing | timing source: requested repair relation + linked parts |
| iPhone SE3 | iPhone SE3 Volume Button | £59.00 | £49.17 | £10.00 | 71.11 | 1 | £1,706.55 | £1.18 | £-1,668.56 | -3393.7% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone X | iPhone X | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone X | iPhone X Battery | £59.00 | £49.17 | £10.00 | 10.56 | 5 | £253.54 | £1.18 | £-215.56 | -438.4% | review pricing | timing source: requested repair relation + linked parts |
| iPhone X | iPhone X Charging Port | £59.00 | £49.17 | £50.00 | 11.41 | 2 | £273.94 | £1.18 | £-275.96 | -561.3% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone X | iPhone X Diagnostic | £49.00 | £40.83 | £1.00 | 21.82 | 1 | £523.68 | £0.98 | £-484.83 | -1187.3% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone X | iPhone X Display (Original OLED Screen) | £149.00 | £124.17 | £40.00 | 5.91 | 8 | £165.75 | £2.98 | £-84.56 | -68.1% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone X | iPhone X Earpiece Speaker | £79.00 | £65.83 | £20.00 | n/a | 0 | £0.00 | £1.58 | £44.25 | 67.2% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone X | iPhone X Loudspeaker | £49.00 | £40.83 | £5.00 | n/a | 0 | £0.00 | £0.98 | £34.85 | 85.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone X | iPhone X Microphone | £59.00 | £49.17 | £50.00 | 21.82 | 1 | £523.68 | £1.18 | £-525.70 | -1069.2% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone X | iPhone X Mute Button | £59.00 | £49.17 | £10.00 | n/a | 0 | £0.00 | £1.18 | £37.99 | 77.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone X | iPhone X NO SERVICE (LOGIC BOARD REPAIR) | £110.00 | £91.67 | £1.00 | 590.28 | 10 | £14,166.69 | £2.20 | £-14,078.22 | -15358.1% | review pricing | timing source: linked parts |
| iPhone X | iPhone X NO WIFI (LOGIC BOARD REPAIR) | £110.00 | £91.67 | £1.00 | 590.28 | 10 | £14,166.69 | £2.20 | £-14,078.22 | -15358.1% | review pricing | timing source: linked parts |
| iPhone X | iPhone X Power Button | £59.00 | £49.17 | £10.00 | n/a | 0 | £0.00 | £1.18 | £37.99 | 77.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone X | iPhone X Rear Camera | £79.00 | £65.83 | £35.00 | 0.61 | 1 | £14.52 | £1.58 | £14.73 | 22.4% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone X | iPhone X Rear Camera Lens | £49.00 | £40.83 | £0.78 | n/a | 0 | £0.00 | £0.98 | £39.07 | 95.7% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone X | iPhone X Rear Housing (Rear Glass And Frame) | £109.00 | £90.83 | £130.00 | n/a | 0 | £0.00 | £2.18 | £-41.35 | -45.5% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone X | iPhone X UNABLE TO ACTIVATE | £110.00 | £91.67 | £1.00 | 590.28 | 10 | £14,166.69 | £2.20 | £-14,078.22 | -15358.1% | review pricing | timing source: linked parts |
| iPhone X | iPhone X Volume Button | £59.00 | £49.17 | £10.00 | n/a | 0 | £0.00 | £1.18 | £37.99 | 77.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone X | iPhone X WIFI Module | £50.00 | £41.67 | £1.00 | n/a | 0 | £0.00 | £1.00 | £39.67 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XR | iPhone XR | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone XR | iPhone XR Battery | £89.00 | £74.17 | £15.00 | 102.88 | 3 | £2,469.21 | £1.78 | £-2,411.82 | -3251.9% | review pricing | timing source: requested repair relation + linked parts |
| iPhone XR | iPhone XR Charging Port | £59.00 | £49.17 | £20.00 | 12.16 | 4 | £291.73 | £1.18 | £-263.74 | -536.4% | review pricing | timing source: requested repair relation + linked parts |
| iPhone XR | iPhone XR Diagnostic | £49.00 | £40.83 | £1.00 | 122.71 | 4 | £2,945.08 | £0.98 | £-2,906.23 | -7117.3% | review pricing | timing source: requested repair relation |
| iPhone XR | iPhone XR Display (Original LCD Screen) | £79.00 | £65.83 | £45.00 | 0.73 | 5 | £41.45 | £1.58 | £-22.20 | -33.7% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone XR | iPhone XR Earpiece Speaker | £79.00 | £65.83 | £25.00 | 1.15 | 1 | £27.68 | £1.58 | £11.58 | 17.6% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone XR | iPhone XR Loudspeaker | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XR | iPhone XR Microphone | £59.00 | £49.17 | £1.00 | 43.36 | 1 | £1,040.73 | £1.18 | £-993.75 | -2021.2% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone XR | iPhone XR Mute Button | £59.00 | £49.17 | £10.00 | n/a | 0 | £0.00 | £1.18 | £37.99 | 77.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XR | iPhone XR NO SERVICE (LOGIC BOARD REPAIR) | £110.00 | £91.67 | £1.00 | 590.28 | 10 | £14,166.69 | £2.20 | £-14,078.22 | -15358.1% | review pricing | timing source: linked parts |
| iPhone XR | iPhone XR NO WIFI (LOGIC BOARD REPAIR) | £110.00 | £91.67 | £1.00 | 590.28 | 10 | £14,166.69 | £2.20 | £-14,078.22 | -15358.1% | review pricing | timing source: linked parts |
| iPhone XR | iPhone XR Power Button | £59.00 | £49.17 | £10.00 | n/a | 0 | £0.00 | £1.18 | £37.99 | 77.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XR | iPhone XR Rear Camera | £79.00 | £65.83 | £35.00 | n/a | 0 | £0.00 | £1.58 | £29.25 | 44.4% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XR | iPhone XR Rear Camera Lens | £49.00 | £40.83 | £5.00 | n/a | 0 | £0.00 | £0.98 | £34.85 | 85.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XR | iPhone XR Rear Housing (Rear Glass And Frame) | £109.00 | £90.83 | £220.00 | 0.93 | 2 | £22.37 | £2.18 | £-153.71 | -169.2% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone XR | iPhone XR UNABLE TO ACTIVATE | £110.00 | £91.67 | £1.00 | 590.28 | 10 | £14,166.69 | £2.20 | £-14,078.22 | -15358.1% | review pricing | timing source: linked parts |
| iPhone XR | iPhone XR Volume Button | £59.00 | £49.17 | £10.00 | n/a | 0 | £0.00 | £1.18 | £37.99 | 77.3% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XR | iPhone XR WIFI Module | £50.00 | £41.67 | £1.00 | n/a | 0 | £0.00 | £1.00 | £39.67 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS | iPhone XS | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone XS | iPhone XS Battery | £89.00 | £74.17 | £10.00 | 13.52 | 4 | £324.55 | £1.78 | £-262.17 | -353.5% | review pricing | timing source: requested repair relation + linked parts |
| iPhone XS | iPhone XS Charging Port | £59.00 | £49.17 | £33.00 | 1.19 | 3 | £28.66 | £1.18 | £-13.67 | -27.8% | review pricing | timing source: requested repair relation + linked parts |
| iPhone XS | iPhone XS Diagnostic | £49.00 | £40.83 | £1.00 | 189.73 | 2 | £4,553.56 | £0.98 | £-4,514.70 | -11056.4% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone XS | iPhone XS Display (Original OLED Screen) | £189.00 | £157.50 | £40.00 | 55.67 | 7 | £1,360.07 | £3.78 | £-1,246.35 | -791.3% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone XS | iPhone XS Earpiece Speaker | £79.00 | £65.83 | £1.00 | n/a | 0 | £0.00 | £1.58 | £63.25 | 96.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS | iPhone XS Loudspeaker | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS | iPhone XS Microphone | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS | iPhone XS Mute Button | £59.00 | £49.17 | £25.00 | n/a | 0 | £0.00 | £1.18 | £22.99 | 46.8% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS | iPhone XS NO SERVICE (LOGIC BOARD REPAIR) | £120.00 | £100.00 | £1.00 | 590.28 | 10 | £14,166.69 | £2.40 | £-14,070.09 | -14070.1% | review pricing | timing source: linked parts |
| iPhone XS | iPhone XS NO WIFI (LOGIC BOARD REPAIR) | £120.00 | £100.00 | £1.00 | 590.28 | 10 | £14,166.69 | £2.40 | £-14,070.09 | -14070.1% | review pricing | timing source: linked parts |
| iPhone XS | iPhone XS Power Button | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS | iPhone XS Rear Camera | £79.00 | £65.83 | £35.00 | 0.40 | 1 | £9.56 | £1.58 | £19.69 | 29.9% | review pricing | timing source: requested repair relation + linked parts; insufficient repair history (<3 completed repairs) |
| iPhone XS | iPhone XS Rear Camera Lens | £49.00 | £40.83 | £5.00 | n/a | 0 | £0.00 | £0.98 | £34.85 | 85.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS | iPhone XS Rear Housing (Rear Glass And Frame) | £119.00 | £99.17 | £100.00 | n/a | 0 | £0.00 | £2.38 | £-3.21 | -3.2% | review pricing | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS | iPhone XS UNABLE TO ACTIVATE | £120.00 | £100.00 | £1.00 | 590.28 | 10 | £14,166.69 | £2.40 | £-14,070.09 | -14070.1% | review pricing | timing source: linked parts |
| iPhone XS | iPhone XS Volume Button | £59.00 | £49.17 | £25.00 | n/a | 0 | £0.00 | £1.18 | £22.99 | 46.8% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS | iPhone XS WIFI Module | £50.00 | £41.67 | £1.00 | n/a | 0 | £0.00 | £1.00 | £39.67 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS Max | iPhone XS Max | n/a | n/a | £0.00 | n/a | 0 | £0.00 | n/a | n/a | n/a | incomplete data | timing source: no historical match; insufficient repair history (<3 completed repairs); incomplete data: no parts linkage |
| iPhone XS Max | iPhone XS Max Battery | £89.00 | £74.17 | £2.00 | 10.36 | 6 | £248.72 | £1.78 | £-178.33 | -240.4% | review pricing | timing source: requested repair relation + linked parts |
| iPhone XS Max | iPhone XS Max Charging Port | £59.00 | £49.17 | £21.00 | n/a | 0 | £0.00 | £1.18 | £26.99 | 54.9% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS Max | iPhone XS Max Diagnostic | £49.00 | £40.83 | £1.00 | 1.48 | 1 | £35.52 | £0.98 | £3.33 | 8.2% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone XS Max | iPhone XS Max Display (Original OLED Screen) | £189.00 | £157.50 | £20.00 | 4.03 | 5 | £120.82 | £3.78 | £12.90 | 8.2% | review pricing | timing source: requested repair relation + linked parts; includes 1h iPhone screen refurb labour adder |
| iPhone XS Max | iPhone XS Max Earpiece Speaker | £79.00 | £65.83 | £1.00 | n/a | 0 | £0.00 | £1.58 | £63.25 | 96.1% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS Max | iPhone XS Max Loudspeaker | £49.00 | £40.83 | £1.00 | n/a | 0 | £0.00 | £0.98 | £38.85 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS Max | iPhone XS Max Microphone | £59.00 | £49.17 | £21.00 | n/a | 0 | £0.00 | £1.18 | £26.99 | 54.9% | watch | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS Max | iPhone XS Max Mute Button | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS Max | iPhone XS Max NO SERVICE (LOGIC BOARD REPAIR) | £120.00 | £100.00 | £1.00 | 590.28 | 10 | £14,166.69 | £2.40 | £-14,070.09 | -14070.1% | review pricing | timing source: linked parts |
| iPhone XS Max | iPhone XS Max NO WIFI (LOGIC BOARD REPAIR) | £120.00 | £100.00 | £1.00 | 590.28 | 10 | £14,166.69 | £2.40 | £-14,070.09 | -14070.1% | review pricing | timing source: linked parts |
| iPhone XS Max | iPhone XS Max Power Button | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS Max | iPhone XS Max Rear Camera | £79.00 | £65.83 | £35.00 | 0.40 | 1 | £9.56 | £1.58 | £19.69 | 29.9% | review pricing | timing source: linked parts; insufficient repair history (<3 completed repairs) |
| iPhone XS Max | iPhone XS Max Rear Camera Lens | £49.00 | £40.83 | £5.00 | n/a | 0 | £0.00 | £0.98 | £34.85 | 85.4% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS Max | iPhone XS Max Rear Housing (Rear Glass And Frame) | £119.00 | £99.17 | £100.00 | 17.29 | 1 | £415.02 | £2.38 | £-418.23 | -421.7% | review pricing | timing source: requested repair relation; insufficient repair history (<3 completed repairs) |
| iPhone XS Max | iPhone XS Max UNABLE TO ACTIVATE | £120.00 | £100.00 | £1.00 | 590.28 | 10 | £14,166.69 | £2.40 | £-14,070.09 | -14070.1% | review pricing | timing source: linked parts |
| iPhone XS Max | iPhone XS Max Volume Button | £59.00 | £49.17 | £1.00 | n/a | 0 | £0.00 | £1.18 | £46.99 | 95.6% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| iPhone XS Max | iPhone XS Max WIFI Module | £50.00 | £41.67 | £1.00 | n/a | 0 | £0.00 | £1.00 | £39.67 | 95.2% | healthy | timing source: no historical match; insufficient repair history (<3 completed repairs) |
| Other Device, iPhone 15 Pro | iPhone 15 Pro Diagnostic | £49.00 | £40.83 | £0.00 | 140.42 | 7 | £3,370.06 | £0.98 | £-3,330.21 | -8155.6% | incomplete data | timing source: requested repair relation; incomplete data: no parts linkage |
