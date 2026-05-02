# BM Trade Orders vs BM Devices Reconciliation

Generated: `2026-04-26T03:00:05.405955+00:00`  
Mode: **READ ONLY** — Google Sheets GET only and Monday GraphQL query only. No writes/mutations/messages/portal actions.

## Source located

- Google Sheet ID: `1A7-NSlqFeCZmS73i2xO-NqlB2wD_lc53V6BxKGjNW2g`
- Writer/integration: `/home/ricky/builds/buyback-monitor/sync_tradein_orders.py`
  - Defines `SHEET_ID = "1A7-NSlqFeCZmS73i2xO-NqlB2wD_lc53V6BxKGjNW2g"`
  - `HEADERS` includes `orderPublicId`, `status`, `creationDate`, `shippingDate`, `receivalDate`, `paymentDate`, `listingTitle`, `listingGrade`, prices/customer/tracking fields.
  - `fetch_all_orders()` reads `GET /ws/buyback/v1/orders`; `write_to_sheet()` overwrites `Sheet1`.
- Reader/reference: `/home/ricky/builds/buyback-monitor/bid_order_analysis.py` reads the same sheet via Google Sheets API.
- Local export candidate: `/home/ricky/.openclaw/agents/backmarket/workspace/data/bm_tradein_orders_live.csv`.
- BM Devices order field evidence:
  - `/home/ricky/builds/backmarket/sops/01-trade-in-purchase.md` Step 6 historically documents BM Devices `text_mkqy3576` = BM order public ID.
  - `/home/ricky/kb/monday/bm-devices-board.md` historically documents `text_mkqy3576` as `BM Order ID`.
  - Fresh Monday schema read during this audit shows `text_mkqy3576` is not currently exposed on BM Devices; live matching used `lookup_mm1vzeam` titled `Trade-in Order ID` with mirror `display_value`.

Source mode used: `google_sheet_live_readonly`.  
Source blocker: `none`.

## Scope definition

- Year filter: source `creationDate` starts with `2026`.
- In-scope bought/processed statuses: `MONEY_TRANSFERED, PAID, RECEIVED, SENT`.
- Excluded statuses: `CANCELED, CANCELLED, EXPIRED, REJECTED, SUSPENDED, TO_SEND`.
- Fallback inclusion: non-excluded unknown status with shipping/receival/payment evidence. `TO_SEND` is excluded because `sync_tradein_orders.py` describes it as accepted but not sent, i.e. not yet a processed received/bought device.
- Valid order-number regex: `^[A-Z]{2}-\d{5}-[A-Z]{5}$`.

## BM Devices matching columns

- Board: `3892194968`
- Matching column: `lookup_mm1vzeam`
- Live column metadata: `[{'id': 'lookup_mm1vzeam', 'title': 'Trade-in Order ID', 'type': 'mirror'}]`
- Secondary fields read for evidence only: `board_relation`, `text0` tracking, `numeric` purchase price, `text_mkyd4bx3` listing ID, `text89` SKU.

## Counts

| Metric | Count |
|---|---:|
| Source rows total | 1999 |
| Source rows with 2026 creationDate | 720 |
| 2026 source orders checked, in-scope + valid order number | 291 |
| Matched exactly once in BM Devices | 281 |
| Missing BM Devices item | 9 |
| Duplicate/ambiguous BM Devices matches | 1 |
| Source malformed/no order number | 0 |
| 2026 source rows excluded as not bought/processed | 429 |
| Duplicate source order rows | 0 |
| BM Devices order numbers not found in 2026 in-scope source | 173 |
| BM Devices items read | 1379 |
| BM Devices items with `lookup_mm1vzeam` populated | 461 |
| BM Devices distinct order numbers | 458 |

2026 source status counts:

```json
{
  "CANCELED": 209,
  "MONEY_TRANSFERED": 286,
  "PAID": 4,
  "TO_SEND": 218,
  "SENT": 1,
  "SUSPENDED": 2
}
```

## Missing BM Devices items

- `GB-26014-XYUFE` — status `MONEY_TRANSFERED`, created `2026-01-01T16:08:44+00:00`, title: MacBook Pro 13" (Mid 2020) - Core i5 1.4 GHz - 16 GB Memory - 512 GB - Intel Iris Plus Graphics 645 - QWERTY, tracking: YR434984137GB, customer: Cliona McCann
- `GB-26041-JRPAI` — status `MONEY_TRANSFERED`, created `2026-01-19T20:52:09+00:00`, title: MacBook Air 13" (Late 2020) - Apple M1 - 8 GB Memory - 256 GB - 7-core GPU - QWERTY, tracking: YR517090397GB, customer: Matthew Bowles
- `GB-26052-PRBJO` — status `MONEY_TRANSFERED`, created `2026-01-27T10:35:59+00:00`, title: MacBook Pro 16" (Late 2024) - Apple M4 Pro - 24 GB Memory - 512 GB - 20-core GPU - QWERTY, tracking: YR543817696GB, customer: Sacha Rhys Johnson
- `GB-26053-BURRH` — status `MONEY_TRANSFERED`, created `2026-01-28T14:04:59+00:00`, title: MacBook Pro 14" (Late 2021) - Apple M1 Pro 8-core - 16 GB Memory - 512 GB - 14-core GPU - QWERTY, tracking: YR546696904GB, customer: Dominic Lopez-Welsch
- `GB-26063-LSMJW` — status `MONEY_TRANSFERED`, created `2026-02-04T22:00:04+00:00`, title: MacBook Air 13" (Late 2020) - Apple M1 - 8 GB Memory - 256 GB - 7-core GPU - QWERTY, tracking: YR558965912GB, customer: ROGERIO Heleno
- `GB-26091-SPTIB` — status `MONEY_TRANSFERED`, created `2026-02-23T16:14:39+00:00`, title: MacBook Pro 13" (Mid 2020) - Core i5 1.4 GHz - 8 GB Memory - 256 GB - Intel Iris Plus Graphics 645 - QWERTY, tracking: YR719989634GB, customer: Jasmine Gann
- `GB-26093-LRQDH` — status `MONEY_TRANSFERED`, created `2026-02-25T11:50:33+00:00`, title: MacBook Air 13" (Mid 2022) - Apple M2 - 16 GB Memory - 256 GB - 8-core GPU - QWERTY, tracking: YR720018565GB, customer: Ivan Mc Caffrey
- `GB-26131-IRPSF` — status `MONEY_TRANSFERED`, created `2026-03-23T17:35:12+00:00`, title: MacBook Pro 14" (Late 2023) - Apple M3 Pro - 18 GB Memory - 512 GB - 14-core GPU - QWERTY, tracking: YR828127459GB, customer: Bill Kanjee
- `GB-26135-BVOPS` — status `MONEY_TRANSFERED`, created `2026-03-27T12:47:30+00:00`, title: MacBook Pro 16" (Late 2023) - Apple M3 Max - 48 GB Memory - 1000 GB - 30-core GPU - QWERTY, tracking: YR831559587GB, customer: Richard Sampson


## Read-only Main Board spot check for missing orders

These checks were not used for BM Devices pass/fail, but they help triage the 9 missing BM Devices matches. Main Board lookup used `text_mky01vb4` read-only.

| Order | Main Board matches |
|---|---|
| `GB-26014-XYUFE` | 0 |
| `GB-26041-JRPAI` | 1 — `11168368510` / `BM 1376 ( Martin Bingham )` / group `Returned` / `status4=Shipped`, `status24=Sold` |
| `GB-26052-PRBJO` | 1 — `11191599665` / `BM 1389 ( Sacha Rhys Johnson )` / group `Safan (Short Deadline)` / `status4=Repair Paused`, `status24=Purchased` |
| `GB-26053-BURRH` | 0 |
| `GB-26063-LSMJW` | 0 |
| `GB-26091-SPTIB` | 0 |
| `GB-26093-LRQDH` | 1 — `11451937171` / `BM 1533 *Leah Graham's Replacement` / group `Returned` / `status4=Shipped`, `status24=Sold` |
| `GB-26131-IRPSF` | 0 |
| `GB-26135-BVOPS` | 1 — `11658468870` / `BM 1581 ( Richard Sampson )` / group `Awaiting Parts` / `status4=Awaiting Part`, `status24=IC OFF` |

## Duplicate / ambiguous BM Devices matches

- `GB-26074-WNOOH` — source row 1724; BM matches: 11507103406 BM 1547 (BM Trade-Ins); 11286870138 BM 1436 (Shipped)


## Source malformed/no order number

None.


## BM Devices order numbers not found in 2026 in-scope source

Secondary finding. This includes older-year orders and any BM Devices records whose source row was excluded/cancelled or absent from the live sheet extract.

Showing first 173 of 173:

- `GB-25452-YGTNO` — 10643544247 BM 1113 (BM Trade-Ins)
- `GB-25461-DKDCG` — 10651743575 BM 1118 (BM Trade-Ins)
- `GB-25483-CQLBK` — 10667830677 BM 1134 (BM Trade-Ins)
- `GB-25473-GWJVL` — 10708714140 BM 1150 (BM Trade-Ins)
- `GB-25491-LULHJ` — 10731380118 BM 1164 (BM Trade-Ins)
- `GB-25506-GOWQL` — 10796123429 BM 1200 (BM Trade-Ins)
- `GB-25515-QIFJB` — 10824893823 BM 1222 (BM Trade-Ins)
- `GB-25521-XCOJU` — 10892009306 BM 1246 (BM Trade-Ins)
- `GB-25513-GHOXX` — 10929332369 BM 1267 (BM Trade-Ins)
- `GB-25405-DZJCP` — 11286958220 BM 1437 (BM Trade-Ins)
- `GB-25472-RWIRB` — 11118850342 BM 1137 (BM Trade-Ins); 10679404760 BM 1137 (Shipped)
- `GB-26062-HYXYK` — 11358381488 BM 1490 (BM Trade-Ins)
- `GB-26071-CCSRW` — 11380699301 BM 1500 (BM Trade-Ins)
- `GB-26101-SHDRI` — 11542987373 BM 1559 (BM Trade-Ins)
- `GB-26137-GJVWK` — 11667299243 BM 1585 (BM Trade-Ins)
- `GB-26145-ATQIS` — 11725499922 BM 1593 (BM Trade-Ins)
- `GB-26156-CAQET` — 11727402242 BM 1594 (BM Trade-Ins)
- `GB-26132-WPENR` — 11741914851 BM 1595 (BM Trade-Ins)
- `GB-26156-ILIWQ` — 11741898920 BM 1597 (BM Trade-Ins)
- `GB-26161-QRGMN` — 11753299266 BM 1599 (BM Trade-Ins)
- `GB-26146-ILGXA` — 11764849523 BM 1600 (BM Trade-Ins)
- `GB-26161-LEHQG` — 11776128781 BM 1602 (BM Trade-Ins)
- `GB-26154-TYMAL` — 11785775976 BM 1603 (BM Trade-Ins)
- `GB-26163-TZBIA` — 11788214705 BM 1604 (BM Trade-Ins)
- `GB-26164-YXJLZ` — 11788203140 BM 1605 (BM Trade-Ins)
- `GB-26144-RBBPX` — 11802859570 BM 1606 (BM Trade-Ins)
- `GB-26164-LMTFE` — 11802996129 BM 1607 (BM Trade-Ins)
- `GB-26025-RYCEG` — 11805373738 BM 1608 (BM Trade-Ins)
- `GB-26161-ZPVVQ` — 11813990547 BM 1609 (BM Trade-Ins)
- `GB-26165-STCSE` — 11813872556 BM 1610 (BM Trade-Ins)
- `GB-26172-NXOSW` — 11813894614 BM 1611 (BM Trade-Ins)
- `GB-26162-YBLJV` — 11825806763 BM 1612 (BM Trade-Ins)
- `GB-26162-WICWA` — 11837164916 BM 1613 (BM Trade-Ins)
- `GB-26173-HDFDI` — 11837158571 BM 1614 (BM Trade-Ins)
- `GB-26173-AIIDM` — 11837169479 BM 1615 (BM Trade-Ins)
- `GB-26173-UHLFS` — 11846621816 BM 1616 (BM Trade-Ins)
- `GB-26144-HJQMU` — 11677045895 BM 1588 (BM To List / Listed / Sold)
- `GB-26155-PBLLC` — 11742018652 BM 1596 (BM To List / Listed / Sold)
- `GB-26147-RPHON` — 11764853697 BM 1601 (BM To List / Listed / Sold)
- `GB-25475-QQKZC` — 10667824979 BM 1131 (Rejected / iC Locked)
- `GB-25467-COPBS` — 10622762198 BM 1108 (Rejected / iC Locked)
- `GB-25475-QFJTG` — 10651728757 BM 1120 (Rejected / iC Locked)
- `GB-25516-WHIUC` — 10892006395 BM 1243 (Rejected / iC Locked)
- `GB-25452-UEEAH` — 10633447870 BM 1109 (Rejected / iC Locked)
- `GB-25503-GFFIG` — 10796134602 BM 1193 (Rejected / iC Locked)
- `GB-25503-CJZKL` — 10796128976 BM 1192 (Rejected / iC Locked)
- `GB-25515-QAWUH` — 10836971716 BM 1229 (Rejected / iC Locked)
- `GB-25514-ESFZU` — 10891986969 BM 1240 (Rejected / iC Locked)
- `GB-26027-UOTLQ` — 10982512047 BM 1299 (Rejected / iC Locked)
- `GB-26013-CSIFQ` — 11006244795 BM 1302 (Rejected / iC Locked)
- `GB-26054-OBVMW` — 11148112063 BM 1368 (Rejected / iC Locked)
- `GB-26062-IUJVJ` — 11215865873 BM 1405 (Rejected / iC Locked)
- `GB-26035-XAUFM` — 11168361950 BM 1375 (Rejected / iC Locked)
- `GB-26091-XNIBC` — 11358401405 BM 1493 (Rejected / iC Locked)
- `GB-26065-MIEBF` — 11390726405 BM 1504 (Rejected / iC Locked)
- `GB-26102-FCRTN` — 11440589669 BM 1530 (Rejected / iC Locked)
- `GB-26103-EMRQQ` — 11624516215 BM 1569 (Rejected / iC Locked)
- `GB-25497-GBOYT` — 10904740845 BM 1256 (Rejected / iC Locked)
- `GB-25464-ZTGKL` — 10667839166 BM 1127 (warranty replacement) (Old BMs)
- `GB-25511-ALOTS` — 10837008134 BM 1227 (Old BMs)
- `GB-25516-ZUFIH` — 10963988720 BM 1282 (Old BMs)
- `GB-25462-XKXXE` — 10594978410 BM 1091 (Shipped)
- `GB-25445-PGBHL` — 10596975776 BM 1098 (Shipped)
- `GB-25467-JGMDU` — 10594967244 BM 1096 (Shipped)
- `GB-25467-DBBHA` — 10596991794 BM 1100 (Shipped)
- `GB-25452-HCRBR` — 10611067358 BM 1103 (Shipped)
- `GB-25464-LQXBQ` — 10594968541 BM 1093 (Shipped)
- `GB-25472-SHYVA` — 10633447689 BM 1110 (Shipped)
- `GB-25476-XJSEB` — 10633453394 BM 1112 (Shipped)
- `GB-25474-LZGRF` — 10614821322 BM 1107 (Shipped)
- `GB-25472-TAUUQ` — 10614819973 BM 1106 (Shipped)
- `GB-25457-GTAUK` — 10596990503 BM 1099 (Shipped)
- `GB-25472-ODJJK` — 10651726682 BM 1119 (Shipped)
- `GB-25463-JMBDO` — 10643542657 BM 1115 (Shipped)
- `GB-25457-SNSHT` — 10594978334 BM 1090 (Shipped)
- `GB-25472-IEOBU` — 10633452395 BM 1111 (Shipped)
- `GB-25461-OWCFR` — 10643544171 BM 1114 (Shipped)
- `GB-25457-UXKCI` — 10667824953 BM 1124 (Shipped)
- `GB-25473-XGVWI` — 10657263676 BM 1122 (Shipped)
- `GB-25471-ECEIB` — 10612808442 BM 1105 (Shipped)
- `GB-25464-STSTB` — 10667836885 BM 1128 (Shipped)
- `GB-25472-TSWOO` — 10667839140 BM 1130 (Shipped)
- `GB-25464-OXSNF` — 10667841601 BM 1129 (Shipped)
- `GB-25486-ACNHA` — 10679404790 BM 1140 (Shipped)
- `GB-25483-SNGYO` — 10690517791 BM 1142 (Shipped)
- `GB-25467-BRPSD` — 10679401540 BM 1136 (Shipped)
- `GB-25486-CGWZT` — 10690517782 BM 1144 (Shipped)
- `GB-25475-CFRQP` — 10643545966 BM 1116 (Shipped)
- `GB-25485-XTOJR` — 10690524647 BM 1143 (Shipped)
- `GB-25477-SJRGH` — 10667841600 BM 1132 (Shipped)
- `GB-25485-RXHNR` — 10700575162 BM 1146 (Shipped)
- `GB-25474-TYMVE` — 10738147776 BM 1138 (Shipped)
- `GB-25471-OMUPZ` — 10657270828 BM 1121 (Shipped)
- `GB-25485-URGLA` — 10667836886 BM 1135 (Shipped)
- `GB-25482-PMXNB` — 10667837886 BM 1133 (Shipped)
- `GB-25481-XBCJT` — 10679393754 BM 1139 (Shipped)
- `GB-25491-DJYXU` — 10708720179 BM 1151 (Shipped)
- `GB-25463-KCSQB` — 10594974618 BM 1092 (Shipped)
- `GB-25484-BORGV` — 10796123648 BM 1185 (Shipped)
- `GB-25493-TZYSB` — 10796116038 BM 1188 (Shipped)
- `GB-25491-OSSIQ` — 10796129117 BM 1186 (Shipped)
- `GB-25504-HFDGM` — 10815351020 BM 1210 (Shipped)
- `GB-25491-PEEKE` — 10796128975 BM 1187 (Shipped)
- `GB-25477-VIAKH` — 10705337227 BM 1148 (Shipped)
- `GB-25495-EQFSU` — 10815342878 BM 1207 (Shipped)
- `GB-25505-ENGUD` — 10796123509 BM 1197 (Shipped)
- `GB-25503-MYIWM` — 10824084692 BM 1191 (Shipped)
- `GB-25485-RYJMU` — 10751511949 BM 1176 (Shipped)
- `GB-25472-FTNQR` — 10594963660 BM 1097 (Shipped)
- `GB-25512-UJTWT` — 10796123311 BM 1204 (Shipped)
- `GB-25481-FUXNT` — 10657265762 BM 1123 (Shipped)
- `GB-25512-VGTOJ` — 10822123343 BM 1219 (Shipped); 11011015548 BM 1219 (RTN > REFUND) (Shipped)
- `GB-25495-TBTED` — 10796134425 BM 1189 (Shipped)
- `GB-25485-MIZJL` — 10808116028 BM 1206 (Shipped)
- `GB-25482-OHHDP` — 10768523297 BM 1183 (Shipped)
- `GB-25506-JPZMW` — 10822112408 BM 1217 (Shipped)
- `GB-25511-CQJJU` — 10815344874 BM 1213 (Shipped)
- `GB-25503-YUUTK` — 10824891210 BM 1220 (Shipped)
- `GB-25514-TMWIO` — 10824895203 BM 1221 (Shipped)
- `GB-25513-BDODX` — 10815348763 BM 1215 (Shipped)
- `GB-25503-MOZZP` — 10815432441 BM 1209 (Shipped)
- `GB-25511-WJOKG` — 10796130115 BM 1202 (Shipped)
- `GB-25484-KVVUY` — 10822117312 BM 1216 (Shipped)
- `GB-26011-HWBXR` — 10892000148 BM 1250 (Shipped)
- `GB-25503-ZXOSN` — 10836971717 BM 1225 (Shipped)
- `GB-25512-YIKMN` — 10822123445 BM 1218 (Shipped)
- `GB-25515-IMZEY` — 10836973124 BM 1228 (Shipped)
- `GB-25501-YQXUP` — 10891996930 BM 1238 (Shipped)
- `GB-25512-RFWVB` — 10815348728 BM 1214 (Shipped)
- `GB-25511-YQVPZ` — 10849907232 BM 1234 (Shipped)
- `GB-25521-QLCVD` — 10892000762 BM 1244 (Shipped)
- `GB-26013-UBFGC` — 10891989231 BM 1253 (Shipped)
- `GB-25526-PBCAB` — 10904743061 BM 1260 (Shipped)
- `GB-25505-BSFXR` — 10796134357 BM 1199 (Shipped)
- `GB-26012-UNKFJ` — 10892006136 BM 1251 (Shipped)
- `GB-26012-EVQDE` — 10891999362 BM 1252 (Shipped)
- `GB-26011-MUQTD` — 10891999277 BM 1249 (Shipped)
- `GB-26012-QIESX` — 10929323761 BM 1269 (Shipped)
- `GB-25517-XMYDH` — 10845300228 BM 1233 (Shipped)
- `GB-25521-OIJRP` — 10849895414 BM 1235 (Shipped)
- `GB-26012-FAMDL` — 10929348269 BM 1270 (Shipped)
- `GB-26013-GUZCF` — 10963988756 BM 1284 (Shipped)
- `GB-25511-WQCWX` — 10815344973 BM 1212 (Shipped)
- `GB-25526-DWLHT` — 10904722406 BM 1259 (Shipped)
- `GB-25516-IIBFA` — 10891991290 BM 1242 (Shipped)
- `GB-25507-FDNJT` — 10796134505 BM 1201 (Shipped)
- `GB-26011-TCZBH` — 10967143382 BM 1286 (Shipped)
- `GB-25515-DLKNS` — 10929332482 BM 1268 (Shipped)
- `GB-25517-KDZLS` — 10837008307 BM 1230 (Shipped)
- `GB-26012-THLTZ` — 10967033466 BM 1287 (Shipped)
- `GB-25516-KORDE` — 10845328439 BM 1232 (Shipped)
- `GB-25511-RBWJF` — 10904741111 BM 1257 (Shipped)
- `GB-25527-MWZBB` — 11006253362 BM 1301 (Shipped)
- `GB-25505-MSOSZ` — 10815395221 BM 1211 (Shipped)
- `GB-25521-FAANW` — 10891997079 BM 1245 (Shipped)
- `GB-25497-MQDZP` — 10891997692 BM 1237 (Shipped)
- `GB-25492-KARHP` — 10892006650 BM 1236 (Shipped)
- `GB-25515-DWQSD` — 10892001789 BM 1241 (Shipped)
- `GB-26012-OIIYX` — 10963991164 BM 1283 (Shipped)
- `GB-25516-VPSBG` — 10824871631 BM 1223 (Shipped)
- `GB-26012-EISVR` — 10904728592 BM 1261 (Shipped)
- `GB-25513-FFXBJ` — 10941825192 BM 1276 (Shipped)
- `GB-26012-AHTIH` — 10967143843 BM 1288 (Shipped)
- `GB-25526-NNIHL` — 10891984864 BM 1248 (Shipped)
- `GB-26013-IHMGU` — 10929332195 BM 1271 (Shipped)
- `GB-25506-VUEKP` — 10837008241 BM 1226 (Shipped)
- `GB-25495-PUVKG` — 10827733622 BM 1224 (Shipped)
- `GB-25513-CRDMZ` — 10891999717 BM 1239 (Shipped)
- `GB-25526-RTNTX` — 10892009023 BM 1247 (Shipped)
- `GB-25505-HTEYE` — 10796138657 BM 1198 (Shipped)
- `GB-25504-DLWYR` — 10796123437 BM 1194 (Shipped)
- `GB-25462-UEJBD` — 10667839319 BM 1126 (Shipped)
- `GB-25513-BHYWX` — 10845300257 BM 1231 (Shipped)


## Caveats

- This report did not call Back Market portal endpoints and did not validate against live BM seller state.
- The sheet integration overwrites `Sheet1` from Back Market API; if the sync is stale, the sheet can lag live BM API.
- The local CSV export exists but was not preferred when live Google Sheet read succeeded.
- `MONEY_TRANSFERED` is Back Market's spelling as present in historical source data.
- Historical docs mention BM Devices `text_mkqy3576`, but the live BM Devices schema no longer exposes that column. This report uses live `lookup_mm1vzeam` / `Trade-in Order ID` mirror display value.
- Matching is exact normalized uppercase order public ID against BM Devices `lookup_mm1vzeam` display value only; Main Board `text_mky01vb4` was not used for pass/fail because the task asks for BM Devices coverage.

## Machine-readable detail

JSON detail: `/home/ricky/builds/backmarket/reports/bm-trade-order-bm-devices-reconcile-2026-04-26-030005.json`

## Recommended next action for Jarvis

If missing count is non-zero, run a read-only spot check for each missing order against Main Board `text_mky01vb4` and BM Devices archived/old groups, then decide whether to backfill/create/link Monday records via the normal SOP 01 path with explicit operator approval. If missing count is zero, schedule this reconciliation as a read-only periodic audit after `sync_tradein_orders.py` refreshes.
