# Main Board Cleanup Analysis

Board analysed: `349212843` (`iCorrect Main Board`)
Archive board compared: `6162422834` (`Main Board Archive: 2021-2023`)

## Pull Scope

- Read-only Monday API analysis only. No moves, mutations, or deletes were executed.
- Total main-board items analysed: `4477`
- Groups discovered: `34`
- Monday API version: `2024-10`
- Total query complexity consumed during this run: `611339`
- Rate-limit handling used: ID pages at 30-second gaps, detail requests at 60-second gaps.

## 1. Group Inventory

| Group | Count | Top Status Sample | Item Sample |
|---|---:|---|---|
| New Orders | 15 | Awaiting Confirmation (9), New Repair (4), Booking Confirmed (2) | Guy Mantoura (11129983413); Justice Allotey (10659608002); Theepan Gnana (11226683740); Vivienne Luu (10935204499); Jai Kharbanda (11353813899) |
| Today's Repairs | 14 | Booking Confirmed (5), New Repair (4), Courier Booked (1), Awaiting Confirmation (1), Book Return Courier (1) | Karen Rai (LCP) [Tom Durkin] (11422074023); Taran Deol (11468051960); Charles manning (11527178666); Andrew (11569659491); BM 1307 (Muhammad Fatir) (RTN > REFUND) (11578986330) |
| BM Inbound | 27 | Received (22), Awaiting Confirmation (2), BER/Parts (1), Purchased (1), Diagnostic Complete (1) | BM 1302 ( Freya Johnson ) (11006245127); BM 1406 ( Evie Couttie ) (11219758659); BM 1437 ( Andrew Parry ) (11286969790); BM 1444 (Spacemade 7) (11131472144); BM 1479 ( Rosie Edwards ) (11334228800) |
| Incoming Future | 41 | Expecting Device (20), Shipped (18), Booking Confirmed (3) | BM 1297 (Izzy Shield) (RTN > REPLACEMENT) (11060262057); BM 1229 ( James Clark ) (10837034161); BM 1337 ( Danielle Mensah ) (11093486596); BM 1339 ( Danielle Mensah ) (11104711754); BM 1347 ( Danielle Mensah ) (11115940262) |
| Safan (Short Deadline) | 31 | Repair Paused (10), Queued For Repair (8), Reassemble (3), Battery Testing (2), Software Install (2) | BM 1153 ( Sion Bola ) (10716615161); BM 1161 ( Paige Broadhurst ) (10731391559); BM 1118 *High value (10651726593); BM 1327 ( Himasree Mustyala ) (11055291798); BM 1334 ( Gregg Purcell ) (11086927034) |
| Mykhailo | 7 | Queued For Repair (3), Awaiting Part (1), Repair Paused (1), Part Repaired (1), Received (1) | BM 1364 ( Peyton Edwards ) (11148112056); #1148 - Shenae Rae (11610657354); se LCDs (11650207679); BM 1575 ( Bill Kanjee ) (11624764027); #1160 - Aristea Alexopoulou (11659211013) |
| Andres | 5 | Repair Paused (3), Queued For Repair (2) | BM 1534 ( Iona Pinnock ) (11451925696); BM 1520 ( Dominic Ly ) (11419142140); BM 1446 ( Joseph Bullmore ) (11299994046); ZARA -  153  ( HO ) (11591251555); BM 1573 ( Umar Muhammad ) (11624757697) |
| Roni | 5 | Repair Paused (3), Error (1), Client Contacted (1) | making boxs 14x (10823535966); BM 1345 ( Rohnicka Williams-Burton ) (11115910684); reassembled device (11247126646); test swap battery A2337 (11262408689); Check Stocks (11333048312) |
| Adil | 0 | None | None |
| Quality Control | 2 | Repaired (2) | BM 1553 ( Declan Phillips ) (11509247034); BM 1564 ( Gemma Guarin ) (11553196759) |
| BMs Awaiting Sale | 18 | Ready To Collect (18) | BM 1353 ( Danielle Mensah ) (11127258151); BM 1400 ( Maksim Afanasev ) (11212780396); BM 1465 ( Kristina Sarkisova ) (11322635134); BM 1418 (Gary Buckley) 1 (11243991125); BM 1422 ( Malobi Vanessa Obosi ) (11255069423) |
| Client Services - To Do | 9 | Client To Contact (4), Invoiced (3), Awaiting Confirmation (1), Client Contacted (1) | Mateusz Piotrowski (to contact when stock arrives) (18121605226); Shaun Willoughby (18245365148); Lorna Kitt *chased (11050556259); BM 1538 ( Samuel Potter ) (11476318903); BM 1561 ( Jonathan Walter ) (11543003057) |
| Outbound Shipping | 10 | Book Return Courier (8), Return Booked (2) | ZARA -  156  ( HO ) (11591257336); ZARA -  152  ( 13605 ) (11591250898); ZARA -  154  ( 3889 ) (11591263284); ZARA -  151  ( 9241 ) (11591275768); ZARA -  155  ( 3889 ) (11591253638) |
| Devices In Hole | 96 | Client Contacted (72), Quote Sent (10), Ready To Collect (7), Awaiting Confirmation (3), Courier Booked (1) | Keon Schmidt Recycle 25/8 (7953334363); Thomas Briault 1 (Recycling Sept 2025) (8056271132); Amjad (7070405040); Shathesh Khanna (6444384447); Victoria [chased 07/11/24] (7622922583) |
| Awaiting Parts | 27 | Awaiting Part (19), Repair Paused (3), New Repair (2), Received (1), Error (1) | BM 977 (Richard Cavilli) (18073747139); BM 958 *unlisted (18003113480); BM 1113 ( Jade-Louisa Pepper ) (10643542837); BM 1164 ( ken Munro ) (10731392359); BM 1222 ( Ryan Waters ) (10824877783) |
| Ferrari | 8 | Courier Booked (3), Awaiting Confirmation (2), Software Install (1), Queued For Repair (1), Repair Paused (1) | BM 422 *iCloud Locked* (8691423380); Iona whyte [purchasing it] (9106845708); ZARA (Inditex) COMMS 103-107 (9949419040); INDITEX / ZARA *COMMS 112-130 (18149429884); ZARA (Inditex) *COMMS 131-136 (10588663250) |
| New Orders (Not Confirmed) | 0 | None | None |
| Awaiting Confirmation of Price | 2 | Diagnostic Complete (2) | #1142 - David Coveney (11569320590); #1118 - Piers Evans (11490809011) |
| Trade-In BMs Awaiting Validation | 9 | Received (8), BER/Parts (1) | BM 1109 ( Obada Sawalha ) (10633452246); BM 1134 ( Dasha Motuzko ) (10667824929); BM 1480 ( Alexandra Hussenot ) (11336796922); BM 1490 ( Oliver Parikian ) (11358385922); BM 1500 ( Alfie Newman ) (11380697068) |
| Safan (Long Deadline) | 20 | Repair Paused (14), Queued For Repair (3), BER/Parts (3) | Alan Sharif  [Instagram booking] (7519015291); MacBook Pro A2442 \| TES \| Diagnostic  ( 1 ) (7802334790); Kamile SHM (SHM Productions) (8008849514); Refurb  6818885945  ( 277 ** ) (7831721890); BM 443 (8691632433) |
| BER Devices | 51 | BER/Parts (46), Purchased (1), New Repair (1), Returned (1), Repair Paused (1) | BM 482 (8818287147); BM 363 (8145119451); BM 449 *iCloud locked (8720281500); BM 732 ( CPU side one line short ) (9482941024); BM 845 *iCloud locked (9749689173) |
| Client Services - Awaiting Confirmation | 67 | Client Contacted (48), Quote Sent (18), Awaiting Confirmation (1) | Kieran Malpas *trade-in for £85 (9647776551); Karl Chin (9765650202); Isaac Owoicho (9829022090); Mark Stiles-Winfield (Universal Rentals) (9848807112); Yusuff Enifeni (9869532271) |
| Ricky | 0 | None | None |
| Awaiting Collection | 74 | Ready To Collect (68), Received (6) | Jasmine-Jade Smith  (C/o Anna Duff) (18026109642); Sam 1 (6368806794); Sam 2 (7933649310); Seamus Kelly (18118598433); Malachi Edu (18164477035) |
| Devices Left in Long Term | 0 | None | None |
| Selling | 0 | None | None |
| Purchased/Refurb Devices | 3 | Purchased (1), Received (1), Client Contacted (1) | Nick Atherton 2 (8550429723); Macbook Pro A1708 \| TES \| B2 ( 14 ) (7951243517); Simon Pritchard (8659362821) |
| Zara iPods | 0 | None | None |
| Completed Refurbs | 0 | None | None |
| Recycle List | 2 | BER/Parts (2) | BM 1294 ( June Paton ) (10982532721); BM 1452 ( Ioana Bombea ) *MDM locked (11311705003) |
| Returned | 3489 | Returned (2013), Shipped (1438), Return Booked (12), New Repair (6), Awaiting Confirmation (4) | ZARA - 55 (4095) (9027442891); iPhone \| HEAD OFFICE \| ZARA  \| ( 7 ) (7509150964); BM 322 MDM (ON) Used for parts (7951520115); Evgenia Vasilessda (8038710671); Sam Bogler (8859850816) |
| Cancelled/Missed Bookings | 84 | Cancelled/Declined (38), New Repair (35), Booking Confirmed (7), Awaiting Confirmation (2), Expecting Device (1) | Lughaidh Kerin (10998461215); Ben Pedrocha (10975649586); Michelle Moses (11000719397); David Gyamfi (10975234738); Devyani Dande (11036850870) |
| Locked | 4 | New Repair (2), Queued For Repair (1), Repaired (1) | BM 460 *iCloud Locked* (8740697443); BM 472 *iCloud Locked* (8764676958); BM 488 (8828433912); BM 636 ** Test Device (9279363344) |
| Leads to Chase | 357 | Booking Confirmed (215), Awaiting Confirmation (102), New Repair (17), Cancelled/Declined (13), Courier Booked (4) | Karl Dalton (3407363799); Jack Walters (3426593337); Nadine Merrick (3449777113); Jordan Hernandez (3469648550); Mahad jumaleh (3480887086) |

## 2. Status Breakdown

Main workflow status column used: `status4` (`Status`)

| Status | Count | Category | Sample Items |
|---|---:|---|---|
| Returned | 2014 | archivable | BM 344 *iCloud Locked* (8045098423); iPhone \| HEAD OFFICE \| ZARA  \| ( 7 ) (7509150964); Evgenia Vasilessda (8038710671); Sam Bogler (8859850816); Mischke Weinreb *Paying £747 on collection (8943484613) |
| Shipped | 1456 | archivable | BM 1297 (Izzy Shield) (RTN > REPLACEMENT) (11060262057); BM 1229 ( James Clark ) (10837034161); Mobilesentrix return (11251687466); Wrong BM device (Gary Buckley) 2 - Return to client (11283764724); #1074 - Nizam Kabir (11312957930) |
| Booking Confirmed | 234 | active | Vivienne Luu (10935204499); Farin Dickinson (11630018092); Taran Deol (11468051960); Niki Freeman (11611289090); #1144 - Shiri Shalmy (11579119835) |
| Awaiting Confirmation | 127 | active | Guy Mantoura (11129983413); Justice Allotey (10659608002); Theepan Gnana (11226683740); #1162 - steve aspris (11670002782); #1163 - Anwaar Zeb (11670961618) |
| Client Contacted | 124 | active | Slim Benatia 1 *To recycle when iPad is fixed (18001962535); BM 1345 ( Rohnicka Williams-Burton ) (11115910684); BM 1538 ( Samuel Potter ) (11476318903); Keon Schmidt Recycle 25/8 (7953334363); Thomas Briault 1 (Recycling Sept 2025) (8056271132) |
| Ready To Collect | 95 | archivable | BM 1353 ( Danielle Mensah ) (11127258151); BM 1400 ( Maksim Afanasev ) (11212780396); BM 1465 ( Kristina Sarkisova ) (11322635134); BM 1418 (Gary Buckley) 1 (11243991125); BM 1422 ( Malobi Vanessa Obosi ) (11255069423) |
| New Repair | 71 | active | Jai Kharbanda (11353813899); Mohammed khader (11459691723); Calvin Owusu (11468084071); Nathan Morse (11581774064); Charles manning (11527178666) |
| BER/Parts | 56 | archivable | BM 1302 ( Freya Johnson ) (11006245127); BM 1109 ( Obada Sawalha ) (10633452246); BM 1165 ( Nicholas Hamilton )we used logic board (10731394412); BM 1273 ( Ed Barwick )CPU short (10929329891); BM 1305 ( Ethylle Bering )cpu short (11017778843) |
| Cancelled/Declined | 53 | archivable | Biki nepali (11648456388); Touseer Ahmad (10918915973); Lughaidh Kerin (10998461215); Ben Pedrocha (10975649586); David Gyamfi (10975234738) |
| Received | 41 | active | BM 1479 ( Rosie Edwards ) (11334228800); BM 1509 ( Josh Nicklin ) (11390722384); BM 1512 ( Lexi Blampied ) (11390732644); BM 1517 ( Stephanie Powell ) (11408261073); BM 1522 ( Catherine Gauld ) (11419141821) |
| Repair Paused | 38 | active | BM 1200 ( Phoebe Hares ) (10796134354); BM 1153 ( Sion Bola ) (10716615161); BM 1161 ( Paige Broadhurst ) (10731391559); BM 1118 *High value (10651726593); BM 1327 ( Himasree Mustyala ) (11055291798) |
| Quote Sent | 28 | active | Amjad (7070405040); Shathesh Khanna (6444384447); Victoria [chased 07/11/24] (7622922583); Neil gomez (Iwoca) \| Recycling (2) \| Nov (7931570641); Sib Lalji (copy) ** In Broken Watches (7941691939) |
| Expecting Device | 22 | active | BM 1337 ( Danielle Mensah ) (11093486596); BM 1339 ( Danielle Mensah ) (11104711754); BM 1347 ( Danielle Mensah ) (11115940262); BM 1394 ( Sacha Rhys Johnson ) (11203001403); BM 1547 ( Adam Henry Moloney ) (11507124007) |
| Awaiting Part | 22 | active | Alan Sherling *Paying £299 on collection (11047177121); BM 1364 ( Peyton Edwards ) (11148112056); BM 958 *unlisted (18003113480); BM 1113 ( Jade-Louisa Pepper ) (10643542837); BM 1222 ( Ryan Waters ) (10824877783) |
| Queued For Repair | 21 | active | BM 1438 ( Maria Coleman ) (11289838690); BM 1477 ( Millie Denton ) (11334230662); BM 1516 ( Charley Adams ) (11408261009); BM 1558 ( Fern Bamber ) (11543010526); Abdul Sala (11625693930) |
| Return Booked | 14 | active | BM 1482 (George Forkuoh) (11336799031); BM 1508 (Iqbal Alam) (11390731033); MacBook Pro A2485 \| TES \| Diagnostic  ( 7 ) (7802334722); Ciro Varrone (Haysmacintyre) (7962090215); BM 421 (8691423967) |
| Courier Booked | 10 | active | Karen Rai (LCP) [Tom Durkin] (11422074023); ZARA (Inditex) COMMS 108-111 (18022792472); INDITEX / ZARA *COMMS 112-130 (18149429884); ZARA (Inditex) *COMMS 131-136 (10588663250); ZARA *COMMS 140-143 (10800185083) |
| Book Return Courier | 9 | active | Inditex (Zara Head Office) *COMMS 151-156 (11591189227); ZARA -  156  ( HO ) (11591257336); ZARA -  152  ( 13605 ) (11591250898); ZARA -  154  ( 3889 ) (11591263284); ZARA -  151  ( 9241 ) (11591275768) |
| Client To Contact | 7 | active | BM 1561 ( Jonathan Walter ) (11543003057); BM 1531 ( Jephta Mirai Roland ) (11449828789); BM 1557 ( Iagen anderson ) (11532707735); BM 1571 ( Back Market ) (11624739078); Valentine (6517174155) |
| Purchased | 6 | ambiguous | BM 1444 (Spacemade 7) (11131472144); Philip Scaife *for parts (18363598408); Nick Atherton 2 (8550429723); MacBook Pro A2442 \| TES \| Diagnostic  ( 4 ) (7802334715); Layne Wray (2) (8647361700) |
| Error | 5 | ambiguous | making boxs 14x (10823535966); BM 1416 ( Julian Wolfinden ) *take lid for Tola (11243974231); Georgios Papadakis (NHS) (6409822660); Francesca Fasesin (4392141644); Nicholas Dent ** PAID IN FULL ** (6764179512) |
| Diagnostic Complete | 4 | active | BM 1549 ( Lily Doherty ) (11507101485); BM 1529 ( Eldon Bradfield ) (11440578368); #1142 - David Coveney (11569320590); #1118 - Piers Evans (11490809011) |
| Software Install | 4 | active | BM 1431 ( Sharon Jackson ) (11266455041); BM 1505 ( Mary Smith ) (11390726562); Raj Kashyap (LaSalle Investment Management) (6240812273); BM 422 *iCloud Locked* (8691423380) |
| Reassemble | 4 | active | Ismail (11361275725); #1120 - Raymond Gillett (11493305302); #1155 - Thomas Hingley (11624011075); Sikhalo Mguni **Recycle 3rd Nov (5998348304) |
| Repaired | 4 | archivable | BM 1553 ( Declan Phillips ) (11509247034); BM 1564 ( Gemma Guarin ) (11553196759); Isaac Ssebaana (8776273712); BM 636 ** Test Device (9279363344) |
| Invoiced | 3 | active | Shaun Willoughby (18245365148); Lorna Kitt *chased (11050556259); Christian Essomba (11471683584) |
| Battery Testing | 2 | active | BM 1334 ( Gregg Purcell ) (11086927034); Ali kubba (11659309201) |
| Part Repaired | 2 | active | BM 1518 ( Asuka Fudou ) (11408261008); se LCDs (11650207679) |
| Password Req | 1 | ambiguous | Claudiu M (Rick's Mentor) (8625554942) |

## 3. Age Analysis

| Category | Count | Criteria | Safe to Archive? |
|---|---:|---|---|
| Completed (has Repaired date) | 173 | `date_mkwdan7z` populated | YES |
| Collected (status = collected) | 0 | `status4` = `Collected` | YES |
| Stale (no updates 180+ days, no Repaired date) | 23 | latest update missing or 180+ days old, and no repaired date | PROBABLY - flag for review |
| Active (recent updates or active status) | 841 | active workflow status or latest update < 90 days | NO |
| Ambiguous | 23 | no repaired date, not clearly active, last update 90-179 days or mixed signals | FLAG |

- Items with no updates in the last 90 days: `3609`
- Items with no updates in the last 180 days: `2975`
- Items with a latest update inside 90 days: `868`

## 4. Column Mapping Check

- Main board columns: `169`
- Archive board columns: `106`
- Exact column ID matches: `64`
- Same title and type, different ID: `2`
- Main-only columns: `103`
- Archive-only columns: `41`

### Exact ID Matches

| Column ID | Main Title | Type | Archive Title |
|---|---|---|---|
| `name` | Name | `name` | Name |
| `subitems6` | Subitems | `subtasks` | Subitems |
| `link1` | Ticket | `link` | Ticket |
| `status_18` | Notifications | `status` | Notifications |
| `service` | Service | `status` | Service |
| `status4` | Status | `status` | Status |
| `date4` | Received | `date` | Date Received |
| `text8` | Passcode | `text` | Passcode |
| `status` | Client | `status` | Client |
| `status_14` | Case | `status` | Box/Case |
| `text5` | Email | `text` | Email |
| `text00` | Phone Number | `text` | Phone Number |
| `text15` | Company | `text` | Company |
| `date6` | Booking Time | `date` | Booking Time |
| `board_relation5` | Device | `board_relation` | Device (Connect) |
| `status8` | Colour | `status` | Device Colour |
| `text4` | IMEI/SN | `text` | IMEI/SN |
| `priority` | Priority | `status` | Priority |
| `date65` | Dev: Phase Deadline | `date` | Dev: Phase Deadline |
| `text368` | Walk-in Notes | `text` | Requested Repairs |
| `formula74` | Quote | `formula` | Quote Total (Itemised) |
| `dup__of_quote_total` | Paid | `numbers` | Prepayment |
| `screen_condition` | Screen Condition | `dropdown` | Screen Condition |
| `passcode` | Street Name/Number | `text` | Street Name/Number |
| `text93` | Post Code | `text` | Post Code |
| `collection_date` | Date Repaired | `date` | Repaired Date |
| `date3` | Collection Date | `date` | Collection Date |
| `time_tracking98` | Total Time | `time_tracking` | Total Time |
| `time_tracking` | Diagnostic Time | `time_tracking` | Diagnostic Time |
| `time_tracking9` | Repair Time | `time_tracking` | Repair Time |
| `time_tracking93` | Refurb Time | `time_tracking` | Refurb Time |
| `text6` | ZenDeskID | `text` | ZenDeskID |
| `status_112` | Status to Notifications | `status` | Status to Notifications |
| `text84` | Refurb ID | `text` | Refurb ID |
| `status_12` | Refurb Status | `status` | Refurb Status |
| `payment_status` | Payment Status | `status` | Payment Status |
| `payment_method` | Payment Method | `status` | Payment Method |
| `be_courier_collection` | Courier Collection | `status` | Courier Collection |
| `be_courier_return` | Courier Return | `status` | Courier Return |
| `numbers1` | Counter | `numbers` | Counter |
| `text7` | External Board ID | `text` | External Board ID |
| `status_160` | Feedback | `status` | Feedback |
| `status_184` | Column Sync | `status` | Column Sync |
| `check79` | Dev | `checkbox` | Dev |
| `text36` | Point of Collection | `text` | Point of Collection |
| `text79` | Collection Job ID | `text` | Collection Job ID |
| `text98` | Return Job ID | `text` | Return Job ID |
| `text_1` | Email Thread ID | `text` | Email Thread ID |
| `text03` | High Level Notes Thread ID | `text` | General Notes Thread ID |
| `text37` | Tech Notes Thread | `text` | Tech Notes Thread |
| `text34` | Error Thread ID | `text` | Error Thread ID |
| `date32` | SLA Update | `date` | SLA Update |
| `text796` | Inbound Tracking | `text` | Inbound Tracking |
| `text53` | Outbound Tracking | `text` | Outbound Tracking |
| `date14` | Scheduled Collection Time | `date` | Scheduled Collection Time |
| `creation_log4` | Created | `creation_log` | Creation Log |
| `formula3` | On Time? | `formula` | On Time? |
| `status_177` | Tech Repair Phase | `status` | Tech Repair Phase |
| `status_110` | Tech Repair Status | `status` | Tech Repair Status |
| `numbers9` | Batt Health | `numbers` | Batt Health |
| `status24` | Repair Type | `status` | Type |
| `board_relation` | Requested Repairs | `board_relation` | Products (Requested Repairs) |
| `board_relation0` | Custom Products | `board_relation` | Custom Quote Lines |
| `person` | Technician | `people` | Technician |

### Same Name/Type But Different ID

| Main Column ID | Title | Type | Archive Column ID |
|---|---|---|---|
| `google_calendar_event__1` | Google Calendar event | `integration` | `google_calendar_event` |
| `color_mkzmx3w` | Device Colour | `status` | `status8` |

### Main Board Columns Missing On Archive

| Column ID | Title | Type |
|---|---|---|
| `color_mm1h2svz` | In Stock? | `status` |
| `date36` | **Deadline** | `date` |
| `color_mkyp4jjh` | iCloud | `status` |
| `text__1` | Priority | `text` |
| `color_mkwr7s1s` | Ammeter Reading | `status` |
| `lookup_mkshgc2p` | Intake Condition | `mirror` |
| `color_mkvmn8wr` | Info Capture | `status` |
| `numeric_mkxx7j1t` | Discount | `numbers` |
| `status_2_Mjj4GJNQ` | * Final Grade * | `status` |
| `color_mkp5ykhf` | LCD - Pre-Grade | `status` |
| `status_2_mkmc4tew` | Lid - Pre-Grade | `status` |
| `status_2_mkmcj0tz` | Top Case - Pre-Grade | `status` |
| `button__1` | Make Sale Item | `button` |
| `formula__1` | Total RR&D Time | `formula` |
| `duration_mkyrykvn` | Cleaning Time | `time_tracking` |
| `color_mkzmbya2` | Source | `status` |
| `text_mkzmxq1d` | Gophr Link | `text` |
| `text_mm084vbh` | Gophr Time Window | `text` |
| `ordered_part_from_mkkassja` | Supplier | `dropdown` |
| `text7__1` | Order Reference | `text` |
| `text766` | Stock Checkout ID | `text` |
| `status_198` | Status 1 | `status` |
| `status_2` | Unified Groups | `status` |
| `connect_boards__1` | Parts Used | `board_relation` |
| `lookup_mkx1xzd7` | Parts Cost | `mirror` |
| `last_updated__1` | Updated | `last_updated` |
| `color_mkppdv74` | Parts Status | `status` |
| `text_mkpp9s3h` | Part to Order | `text` |
| `date_mkq385pa` | Date Listed (BM) | `date` |
| `date_mkq34t04` | Date Sold (BM) | `date` |
| `date_mkqgbbtp` | Date Purchased (BM) | `date` |
| `color_mkqg66bx` | Battery (Reported) | `status` |
| `color_mkqg4zhy` | Battery (Actual) | `status` |
| `color_mkqg7pea` | Screen (Reported) | `status` |
| `color_mkqgtewd` | Screen (Actual) | `status` |
| `color_mkqg1c3h` | Casing (Reported) | `status` |
| `color_mkqga1mc` | Casing (Actual) | `status` |
| `color_mkqg578m` | Function (Reported) | `status` |
| `color_mkqgj96q` | Function (Actual) | `status` |
| `color_mkqg8ktb` | Liquid Damage? | `status` |
| `long_text_mkqhxknq` | Final Quote | `long_text` |
| `long_text_mkqhfapq` | Intake Notes | `long_text` |
| `date_mks7thec` | ETA | `date` |
| `color_mkse6rw0` | Problem (Repair) | `status` |
| `color_mkse6bhk` | Problem (Client) | `status` |
| `board_relation_mkshr9ah` | Link - Client Information Capture | `board_relation` |
| `lookup_mkshzp3t` | Fault to Repair (Details) | `mirror` |
| `lookup_mkwmcz3k` | Further Faults | `mirror` |
| `lookup_mksh916q` | Client Notes | `mirror` |
| `lookup_mkwm9z32` | Previous Repairs | `mirror` |
| `lookup_mkshh7sn` | Notes for Repairer | `mirror` |
| `lookup_mkshe2da` | Collection Notes | `mirror` |
| `lookup_mkshb4r5` | Data | `mirror` |
| `lookup_mkshhjqh` | Been to Apple? | `mirror` |
| `lookup_mkwcsg9q` | New or Refurb? | `mirror` |
| `lookup_mkshmdgn` | Battery | `mirror` |
| `button_mkt3gk2a` | Add to enquiries | `button` |
| `formula_mkvnyg5d` | Formula | `formula` |
| `date_mkwdmm9k` | Diag. Complete | `date` |
| `date_mkwdwx03` | Quote Sent | `date` |
| `date_mkwdan7z` | Repaired | `date` |
| `multiple_person_mkwqj321` | Diagnostic | `people` |
| `multiple_person_mkwqsxse` | Refurb | `people` |
| `multiple_person_mkwqy930` | Repair | `people` |
| `lookup_mkzjzdem` | Stock Level | `mirror` |
| `lookup_mkzccxrk` | Requested Repairs Price | `mirror` |
| `lookup_mkzcaszh` | Custom Repairs Price | `mirror` |
| `formula_mkx1bjqr` | Total Labour | `formula` |
| `formula_mkx1anwb` | Revenue ex Vat | `formula` |
| `formula_mkx1696v` | Gross Profit | `formula` |
| `numeric_mkxcedc` | Initial Hours | `numbers` |
| `date_mkxcktm5` | Start | `date` |
| `formula_mkxcsv9k` | BM Deadline | `formula` |
| `color_mkxga4sk` | Keyboard | `status` |
| `text_mky01vb4` | BM Trade-in ID | `text` |
| `text_mkypyrhn` | Warranty Sticker # | `text` |
| `color_mkyp2sad` | Cleaning Status | `status` |
| `multiple_person_mkyp6fdz` | BM Diag Tech | `people` |
| `multiple_person_mkyp2bka` | QC By | `people` |
| `date_mkypmgfc` | Intake Timestamp | `date` |
| `date_mkypt8db` | QC Time | `date` |
| `numeric_mm1mwyg2` | Expected Sale Price | `numbers` |
| `color_mm0pjwz1` | Invoice Action | `status` |
| `numeric_mm0pvem5` | Invoice Amount | `numbers` |
| `color_mm0pkek6` | Invoice Status | `status` |
| `numeric_mm0gatwe` | BM Diag Time | `numbers` |
| `color_mm0e2jz6` | Payments Reconciled | `status` |
| `date_mm0e4e3f` | Payment 2 Date | `date` |
| `numeric_mm0ea452` | Payment 2 Amt | `numbers` |
| `text_mm0e9xr` | Payment 2 Ref | `text` |
| `date_mm0erp17` | Payment 1 Date | `date` |
| `numeric_mm0ewvp2` | Payment 1 Amt | `numbers` |
| `text_mm0eh9f1` | Payment 1 Ref | `text` |
| `link_mm0a43e0` | Xero Invoice URL | `link` |
| `text_mm0a8fwb` | Xero Invoice ID | `text` |
| `color_mkzkats9` | Parts Deducted | `status` |
| `text_mm087h9p` | Intercom ID | `text` |
| `lookup_mm01jk08` | Part Stock Level | `mirror` |
| `board_relation_mm01yt93` | Parts Required | `board_relation` |
| `color_mm01xyth` | Basic Test | `status` |
| `color_mm01jjsx` | Passcode Verified | `status` |
| `color_mm01323z` | Stock Status | `status` |
| `item_id` | Item ID | `item_id` |

### Archive Columns Missing On Main

| Column ID | Title | Type |
|---|---|---|
| `date19` | Repair Phase Deadline | `date` |
| `device0` | Device (Dropdown) | `dropdown` |
| `numbers2` | Quote Total | `numbers` |
| `repair` | Parts Used | `dropdown` |
| `status_15` | Refurb Type | `status` |
| `connect_boards8` | Refurb Parts | `board_relation` |
| `status55` | Data | `status` |
| `dup__of_passcode` | Company/Flat/NOTES | `text` |
| `enquiry` | Enquiry | `long_text` |
| `order_id` | Order ID | `text` |
| `notes9` | Notes | `text` |
| `add_to_finance8` | Add to Finance | `status` |
| `add_to_vend` | Add To Vend | `status` |
| `dup__of_add_to_vend` | Add to Zendesk | `status` |
| `long_text5` | Repair Notes | `long_text` |
| `status_161` | Repair Notes Trigger | `status` |
| `status_183` | User Error | `status` |
| `text3` | Intake Notes | `text` |
| `text05` | Product Eric ID | `text` |
| `status_13` | New Finance | `status` |
| `text94` | Current Quote | `text` |
| `eod1` | EOD | `status` |
| `text86` | Quote Thread ID | `text` |
| `text69` | Slack Meta | `text` |
| `button9` | TEST | `button` |
| `mirror_1` | Req. Mins | `mirror` |
| `mirror5` | Products Total | `mirror` |
| `lookup` | Mins Required | `mirror` |
| `text24` | GCal Event ID | `text` |
| `date8` | DEV: Session Start | `date` |
| `date7` | DEV: Session End | `date` |
| `numeric` | DEV: Sched Order | `numbers` |
| `text06` | Custom Quote Data | `text` |
| `connect_boards9` | Repair Session Records | `board_relation` |
| `board_relation3` | Stock Reservations | `board_relation` |
| `mirror3` | Custom Lines Price | `mirror` |
| `formula9` | Hours Past Deadline | `formula` |
| `text76` | Motion Task ID | `text` |
| `status_19` | Motion Scheduling Status | `status` |
| `mirror1` | Mirror | `mirror` |
| `mirror_14` | Phase Model | `mirror` |

## 5. Subitem Check

- Items with 1+ subitems: `2`
- Total subitems attached to those parents: `2`

## 6. Recommendations

- Safe to archive immediately: `3590` items (`80.2%` of the board). This includes repaired items plus terminal-status items without conflicting active signals.
- Existing archive board recommendation: `CREATE A NEW ARCHIVE BOARD OR NORMALISE COLUMNS FIRST`. Main-only columns remaining: `103`.
- Manual review required before archiving: `46` items.
- Suggested move batch size: `100` items per mutation run. This leaves headroom for retries and nested subitems.
- Possible delete candidates instead of archive: `5` low-signal items matched blank/test/duplicate heuristics. Manual confirmation still required.

### Manual Review Queue

| Item ID | Name | Group | Status | Last Update | Reason |
|---|---|---|---|---|---|
| `4392141644` | Francesca Fasesin | Leads to Chase | Error | 2023-07-13 | 180+ days since latest update and no repaired date |
| `5116484817` | Xiaochu Wuu | Devices In Hole | Ready To Collect | 2023-09-06 | 180+ days since latest update and no repaired date |
| `6368806794` | Sam 1 | Awaiting Collection | Ready To Collect | 2024-04-24 | 180+ days since latest update and no repaired date |
| `7933649310` | Sam 2 | Awaiting Collection | Ready To Collect | 2024-04-25 | 180+ days since latest update and no repaired date |
| `6764179512` | Nicholas Dent ** PAID IN FULL ** | Leads to Chase | Error | 2024-06-04 | 180+ days since latest update and no repaired date |
| `6409822660` | Georgios Papadakis (NHS) | Returned | Error | 2024-09-17 | 180+ days since latest update and no repaired date |
| `7802334715` | MacBook Pro A2442 \| TES \| Diagnostic  ( 4 ) | Returned | Purchased | 2024-11-07 | 180+ days since latest update and no repaired date |
| `7882708777` | Rolf Andreason (recycle: Jan 19th) | Returned | Ready To Collect | 2024-11-19 | 180+ days since latest update and no repaired date |
| `7892031430` | Daniel Corner ** Recycle: 3rd April | Returned | Purchased | 2024-11-20 | 180+ days since latest update and no repaired date |
| `8362997561` | Jit Malait | Devices In Hole | Ready To Collect | 2025-01-30 | 180+ days since latest update and no repaired date |
| `8550429723` | Nick Atherton 2 | Purchased/Refurb Devices | Purchased | 2025-02-24 | 180+ days since latest update and no repaired date |
| `8625554942` | Claudiu M (Rick's Mentor) | Devices In Hole | Password Req | 2025-03-05 | 180+ days since latest update and no repaired date |
| `8647361700` | Layne Wray (2) | Returned | Purchased | 2025-03-07 | 180+ days since latest update and no repaired date |
| `8776273712` | Isaac Ssebaana | Returned | Repaired | 2025-03-25 | 180+ days since latest update and no repaired date |
| `8797486733` | Alex Andreev | Returned | Ready To Collect | 2025-03-27 | 180+ days since latest update and no repaired date |
| `9210267203` | Fiona Ghosh | Devices In Hole | Ready To Collect | 2025-05-22 | 180+ days since latest update and no repaired date |
| `9272910426` | Karar tanash | Devices In Hole | Ready To Collect | 2025-05-31 | 180+ days since latest update and no repaired date |
| `9279363344` | BM 636 ** Test Device | Locked | Repaired | 2025-06-02 | 180+ days since latest update and no repaired date |
| `9403909852` | Chibi Kabagaya | Devices In Hole | Ready To Collect | 2025-06-18 | 180+ days since latest update and no repaired date |
| `9402733897` | Asad Ali | Devices In Hole | Ready To Collect | 2025-06-18 | 180+ days since latest update and no repaired date |
| `9403431631` | Abdul Aleem | Devices In Hole | Ready To Collect | 2025-06-18 | 180+ days since latest update and no repaired date |
| `18026109642` | Jasmine-Jade Smith  (C/o Anna Duff) | Awaiting Collection | Ready To Collect | 2025-09-23 | 180+ days since latest update and no repaired date |
| `18118598433` | Seamus Kelly | Awaiting Collection | Ready To Collect | 2025-10-06 | 180+ days since latest update and no repaired date |
| `18164477035` | Malachi Edu | Awaiting Collection | Ready To Collect | 2025-10-11 | No repaired date, not clearly active, and 90-179 days since latest update |
| `18236536776` | Nana Sekyere | Awaiting Collection | Ready To Collect | 2025-10-21 | No repaired date, not clearly active, and 90-179 days since latest update |
| `18287076229` | Lisa Denderuk | Awaiting Collection | Ready To Collect | 2025-10-28 | No repaired date, not clearly active, and 90-179 days since latest update |
| `18327678024` | Annelisa Le | Awaiting Collection | Ready To Collect | 2025-11-02 | No repaired date, not clearly active, and 90-179 days since latest update |
| `18363598408` | Philip Scaife *for parts | BER Devices | Purchased | 2025-11-06 | No repaired date, not clearly active, and 90-179 days since latest update |
| `18363436208` | Giacomo Chaparro | Awaiting Collection | Ready To Collect | 2025-11-06 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10530387283` | Kristina Charukian (Trade In) | Awaiting Collection | Ready To Collect | 2025-11-10 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10545905671` | Philippe lenclume | Awaiting Collection | Ready To Collect | 2025-11-12 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10595335418` | Emma Pavey | Awaiting Collection | Ready To Collect | 2025-11-19 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10597281908` | Sophie Elsey | Awaiting Collection | Ready To Collect | 2025-11-20 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10623932328` | Simon Lesley | Awaiting Collection | Ready To Collect | 2025-11-24 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10636687119` | Nagomi Tanabe | Awaiting Collection | Ready To Collect | 2025-11-25 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10650109304` | John-Webb Carter | Awaiting Collection | Ready To Collect | 2025-11-26 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10657961980` | Harry Parish | Awaiting Collection | Ready To Collect | 2025-11-28 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10668483588` | Aman Sharma | Awaiting Collection | Ready To Collect | 2025-12-01 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10679512183` | Lucas Colin | Awaiting Collection | Ready To Collect | 2025-12-02 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10683164689` | John Scarlett | Awaiting Collection | Ready To Collect | 2025-12-02 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10736189491` | Ricky iPhone | Awaiting Collection | Ready To Collect | 2025-12-09 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10797650964` | Jose Neto (Great Portland Estates) | Awaiting Collection | Ready To Collect | 2025-12-17 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10816205862` | Saif Al Shamsi | Awaiting Collection | Ready To Collect | 2025-12-19 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10823535966` | making boxs 14x | Roni | Error | 2025-12-20 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10830277145` | Pele Banugo | Awaiting Collection | Ready To Collect | 2025-12-22 | No repaired date, not clearly active, and 90-179 days since latest update |
| `10833521374` | Angela Hue | Awaiting Collection | Ready To Collect | 2025-12-22 | No repaired date, not clearly active, and 90-179 days since latest update |

### Delete Candidate Heuristics

| Item ID | Name | Group | Status | Reason |
|---|---|---|---|---|
| `11262408689` | test swap battery A2337 | Roni | Repair Paused | test-like naming |
| `11490089146` | TEST - John Doe *Paying £149 on collection | Awaiting Collection | Ready To Collect | test-like naming |
| `11490590035` | TEST FERRARI *paying £99 on collection | Awaiting Collection | Received | test-like naming |
| `11206345691` | Cut & test A2992 screen [1] | Returned | Returned | test-like naming |
| `9279363344` | BM 636 ** Test Device | Locked | Repaired | test-like naming |

### Immediate Archive Examples

| Item ID | Name | Group | Status | Repaired Date | Last Update | Subitems |
|---|---|---|---|---|---|---:|
| `11224510074` | Naboshika Nantheswaran | Returned | Returned | 2026-04-02 | 2026-02-09 | 0 |
| `11603306371` | Dwayne Morris (Everything Apple Tech [7%]) *repair | Returned | Returned | 2026-04-01 | 2026-03-31 | 0 |
| `11556394912` | Raj (Klyk) | Returned | Shipped | 2026-04-01 | 2026-03-20 | 0 |
| `9268419919` | Cristopher Hamilton *Will get back to us at the end of the month | Awaiting Collection | Ready To Collect | 2026-04-01 | 2025-05-30 | 0 |
| `11144850246` | Lauren Kennedy | Awaiting Collection | Ready To Collect | 2026-03-31 | 2026-03-30 | 0 |
| `11583001818` | David Shack | Returned | Returned | 2026-03-27 | 2026-03-24 | 0 |
| `11492556457` | #1119 - Jeffrey Woodham | Returned | Shipped | 2026-03-27 | 2026-03-16 | 0 |
| `11579146748` | Liem Le | Returned | Returned | 2026-03-26 | 2026-03-24 | 0 |
| `11525105716` | Marcus | Returned | Returned | 2026-03-26 | 2026-03-18 | 0 |
| `11515298481` | Wardah Meeajun *Paying £379 on collection | Returned | Returned | 2026-03-26 | 2026-03-16 | 0 |
| `11492441509` | Joseph Da Silva | Returned | Returned | 2026-03-24 | 2026-03-12 | 0 |
| `11392130192` | #1092 - Connor Carmichael | Returned | Shipped | 2026-03-24 | 2026-03-06 | 0 |
| `11488698921` | Rene (Paying £349 on collection) | Returned | Returned | 2026-03-23 | 2026-03-20 | 0 |
| `11451838260` | #1106 - Mohammed Sayeh | Returned | Shipped | 2026-03-18 | 2026-03-13 | 0 |
| `11464335374` | #1110 - Abdul R *paying £199 on collection | Returned | Returned | 2026-03-16 | 2026-03-11 | 0 |
| `11432601031` | Thanos Tzanetopoulos | Returned | Returned | 2026-03-12 | 2026-03-05 | 0 |
| `11364678853` | #1088 - Charlie Tristram | Returned | Shipped | 2026-03-11 | 2026-02-26 | 0 |
| `11401602576` | Andrea Gurnari | Returned | Returned | 2026-03-10 | 2026-03-10 | 0 |
| `11443167486` | Ruth Davies (St James School) PO STJ17160 | Returned | Shipped | 2026-03-10 | 2026-03-09 | 0 |
| `11422069221` | Alex Munday (Fourfront Group) | Returned | Shipped | 2026-03-06 | 2026-03-04 | 0 |
| `11258193458` | Hyunjung Lee | Returned | Returned | 2026-03-06 | 2026-02-12 | 0 |
| `10973838600` | Joseph Idahor | Returned | Shipped | 2026-03-06 | 2026-01-14 | 0 |
| `11302910029` | Anton Dawes | Returned | Shipped | 2026-03-05 | 2026-02-19 | 0 |
| `11207445656` | Kaoutar | Awaiting Collection | Ready To Collect | 2026-03-05 | 2026-02-06 | 0 |
| `11360490738` | #1087 - Natniel Aniel | Returned | Returned | 2026-03-04 | 2026-02-25 | 0 |
| `11109403105` | Mitch Holmes | Returned | Shipped | 2026-03-02 | 2026-03-02 | 0 |
| `10973795390` | Tabitha Kantenga | Returned | Returned | 2026-02-27 | 2026-02-26 | 0 |
| `11328304654` | Fisayo Brooks | Returned | Returned | 2026-02-26 | 2026-02-20 | 0 |
| `11292180079` | Bassem kamel | Returned | Returned | 2026-02-26 | 2026-02-17 | 0 |
| `11247412252` | Dwayne Morris (Everything Apple Tech [7%]) | Returned | Returned | 2026-02-25 | 2026-02-11 | 0 |
| `11010528016` | Xinzhang | Returned | Returned | 2026-02-20 | 2026-01-15 | 0 |
| `11214640774` | #1059 - Ridwan Mustapha *SEND CHARGER** | Returned | Shipped | 2026-02-19 | 2026-02-16 | 0 |
| `11070775890` | Spacemade 5 | Returned | Shipped | 2026-02-16 | 2026-02-16 | 0 |
| `11130686109` | Harry McAllister (Freuds) [FC0908] | Returned | Returned | 2026-02-16 | 2026-02-16 | 0 |
| `11070689572` | Spacemade 1 | Returned | Shipped | 2026-02-16 | 2026-02-16 | 0 |
| `11130170683` | Mari Kydd | Returned | Shipped | 2026-02-16 | 2026-02-16 | 0 |
| `11070685756` | Spacemade 2 | Returned | Shipped | 2026-02-13 | 2026-02-16 | 0 |
| `11070776008` | Spacemade 4 | Returned | Shipped | 2026-02-13 | 2026-02-16 | 0 |
| `11070779448` | Spacemade 6 | Returned | Shipped | 2026-02-13 | 2026-02-16 | 0 |
| `10945870113` | Alex Darlow (C/o Alicia Matutino-Barnes) | Returned | Shipped | 2026-02-13 | 2026-02-14 | 0 |
| `11257743597` | Philippa Mills | Returned | Returned | 2026-02-13 | 2026-02-13 | 0 |
| `11172157129` | Daniel | Returned | Returned | 2026-02-13 | 2026-02-03 | 0 |
| `11039417054` | Dobrila Brice | Returned | Returned | 2026-02-11 | 2026-02-11 | 0 |
| `11161997586` | Adrian cucuiet | Returned | Returned | 2026-02-11 | 2026-02-02 | 0 |
| `11198775285` | #1057 - Roheel Khan | Returned | Returned | 2026-02-10 | 2026-02-11 | 0 |
| `11246625299` | Roheel Khan | Returned | Returned | 2026-02-10 | 2026-02-11 | 0 |
| `11207039574` | BM 1526 (Ben Clarke) | Returned | Shipped | 2026-02-10 | 2026-02-11 | 0 |
| `11163818751` | Tamika Kalule | Awaiting Collection | Ready To Collect | 2026-02-10 | 2026-02-10 | 0 |
| `10831736500` | Khaled Al Kurdi | Awaiting Collection | Ready To Collect | 2026-02-10 | 2026-02-10 | 0 |
| `11205578891` | Muna Hussein Ali *To pay £339 on collection | Returned | Returned | 2026-02-09 | 2026-02-11 | 0 |
| `11158757890` | Tola Oderinwale | Returned | Returned | 2026-02-06 | 2026-02-11 | 0 |
| `11107175446` | Guy Leech | Returned | Returned | 2026-02-05 | 2026-02-11 | 0 |
| `11049993502` | Rebecca Buckley | Returned | Returned | 2026-02-05 | 2026-02-11 | 0 |
| `11129824144` | Reshana Rajendran | Returned | Returned | 2026-02-05 | 2026-02-11 | 0 |
| `10932604806` | Holly McHugh | Awaiting Collection | Ready To Collect | 2026-02-05 | 2026-02-05 | 0 |
| `11118607084` | #1046 - Thomas Orridge | Returned | Returned | 2026-02-02 | 2026-02-11 | 0 |
| `11121794512` | #1047 - Oleksandr Rodin | Returned | Returned | 2026-02-02 | 2026-02-11 | 0 |
| `18182847266` | Sauda hasan | Returned | Returned | 2026-02-02 | 2026-02-02 | 0 |
| `10956836168` | Paul Veer | Returned | Returned | 2026-01-28 | 2026-01-28 | 0 |
| `11070711850` | Arun | Returned | Returned | 2026-01-27 | 2026-01-28 | 0 |
| `10999017903` | Sebastian Cook | Returned | Returned | 2026-01-27 | 2026-01-14 | 0 |
| `10945869970` | Manteer Bhambra (Silver Fern) 1 | Returned | Returned | 2026-01-23 | 2026-01-24 | 0 |
| `11070672137` | Jonathan | Returned | Returned | 2026-01-23 | 2026-01-24 | 0 |
| `10733781953` | Harry McAllister (Freuds) [FC0908] PO69253 | Returned | Returned | 2026-01-23 | 2026-01-23 | 0 |
| `10976541723` | Teresa Colaço | Returned | Returned | 2026-01-23 | 2026-01-12 | 0 |
| `11020062035` | Dwayne Morris | Returned | Returned | 2026-01-21 | 2026-01-21 | 0 |
| `10959264112` | Jide Daniel | Returned | Returned | 2026-01-20 | 2026-01-20 | 0 |
| `11039672457` | Blaze | Returned | Returned | 2026-01-20 | 2026-01-19 | 0 |
| `10945720561` | Ben Pedroche | Returned | Returned | 2026-01-16 | 2026-01-16 | 0 |
| `10988114528` | Joe Talbot 1 | Returned | Returned | 2026-01-15 | 2026-01-15 | 0 |
| `10923801008` | Piratheesan Arulrajah | Returned | Returned | 2026-01-13 | 2026-01-06 | 0 |
| `10949483736` | Nazifa C/o Ali Ahmed | Returned | Returned | 2026-01-12 | 2026-01-09 | 0 |
| `18063424245` | Theone Coleman | Returned | Returned | 2026-01-12 | 2025-09-29 | 0 |
| `10908480009` | Lucinda Scott | Returned | Returned | 2026-01-09 | 2026-01-05 | 0 |
| `10833033086` | Adan Reyes Sanchez | Returned | Returned | 2026-01-09 | 2025-12-22 | 0 |
| `10773675200` | Linfred Bentil | Returned | Returned | 2026-01-07 | 2025-12-16 | 0 |
| `10603959855` | Nathan Coyte | Returned | Returned | 2026-01-06 | 2025-11-20 | 0 |
| `10809812149` | Amanda Davis 1 | Returned | Returned | 2025-12-23 | 2025-12-24 | 0 |
| `10808067135` | David Pulley (Sanderson Design Group) | Returned | Returned | 2025-12-22 | 2025-12-18 | 0 |
| `10774966174` | James Landale *TO PAY £438 ON COLLECTION | Returned | Returned | 2025-12-19 | 2025-12-15 | 0 |
| `10737237399` | Mario Balcan (Mother) 9 | Returned | Shipped | 2025-12-19 | 2025-12-09 | 0 |
| `10764073125` | Niagara Dike | Returned | Returned | 2025-12-18 | 2025-12-12 | 0 |
| `10737242850` | Mario Balcan (Mother) 8 | Returned | Shipped | 2025-12-17 | 2025-12-09 | 0 |
| `10737232460` | Mario Balcan (Mother) 2 | Returned | Shipped | 2025-12-17 | 2025-12-09 | 0 |
| `10737232093` | Mario Balcan (Mother) 1 | Returned | Shipped | 2025-12-17 | 2025-12-09 | 0 |
| `10737241732` | Mario Balcan (Mother) 5 | Returned | Shipped | 2025-12-17 | 2025-12-09 | 0 |
| `10644054971` | Ryszard Kolendo | Returned | Returned | 2025-12-16 | 2026-01-09 | 0 |
| `10737238267` | Mario Balcan (Mother) 6 | Returned | Shipped | 2025-12-15 | 2025-12-09 | 0 |
| `10737244902` | Mario Balcan (Mother) 7 | Returned | Shipped | 2025-12-12 | 2025-12-09 | 0 |
| `10718159680` | Briyanhaa Guhathas | Returned | Returned | 2025-12-12 | 2025-12-06 | 0 |
| `10737249367` | Mario Balcan (Mother) 4 | Returned | Shipped | 2025-12-11 | 2025-12-09 | 0 |
| `10737249345` | Mario Balcan (Mother) 3 | Returned | Shipped | 2025-12-11 | 2025-12-09 | 0 |
| `10733898987` | John Lomax | Returned | Returned | 2025-12-10 | 2025-12-09 | 0 |
| `10658188556` | Guy Mantoura | Returned | Returned | 2025-12-09 | 2025-12-03 | 0 |
| `10594578005` | Samantha Vanderpuye | Returned | Shipped | 2025-12-05 | 2025-11-19 | 0 |
| `18127802265` | Jason Karr *DO NOT THROW AWAY SSD | Returned | Returned | 2025-12-05 | 2025-10-07 | 0 |
| `10683289617` | Katie Wilson | Returned | Returned | 2025-12-04 | 2025-12-02 | 0 |
| `18345146018` | Nina Swaleh | Awaiting Collection | Ready To Collect | 2025-12-03 | 2025-12-03 | 0 |
| `10585317671` | Dwayne Morris | Returned | Returned | 2025-12-03 | 2025-11-18 | 0 |
| `10654738604` | BM 1053 (Sonia Mustafa) (RTN > REPAIR) | Returned | Shipped | 2025-12-02 | 2025-11-28 | 0 |
| `10637139472` | Mali Smith | Returned | Returned | 2025-12-02 | 2025-11-25 | 0 |
| `10634092529` | Harry Bloomfield (HaysMac) 3 | Returned | Returned | 2025-12-02 | 2025-11-25 | 0 |
| `10634098603` | Harry Bloomfield (HaysMac) 1 | Returned | Returned | 2025-12-02 | 2025-11-25 | 0 |
| `10547281777` | Efe Aksu | Returned | Returned | 2025-12-02 | 2025-11-12 | 0 |
| `10644574004` | Amy Lee (HaysMac) | Returned | Shipped | 2025-12-01 | 2025-11-26 | 0 |
| `10634551551` | Charlotte Stratos | Returned | Returned | 2025-12-01 | 2025-11-25 | 0 |
| `10555094619` | Meghna Mehta | Returned | Returned | 2025-12-01 | 2025-11-13 | 0 |
| `10595058251` | Robert Boulton | Returned | Shipped | 2025-11-27 | 2025-11-19 | 0 |
| `18277330138` | Bundhita Sukit | Returned | Returned | 2025-11-27 | 2025-10-27 | 0 |
| `10606184502` | Katrina Foster | Returned | Returned | 2025-11-26 | 2025-11-20 | 0 |
| `10634097991` | Harry Bloomfield (HaysMac) 4 **PRIORITY | Returned | Shipped | 2025-11-25 | 2025-11-25 | 0 |
| `10634096199` | Harry Bloomfield (HaysMac) 5 **PRIORITY | Returned | Shipped | 2025-11-25 | 2025-11-25 | 0 |
| `10622100705` | Thomas Davies *TO PAY £249 | Returned | Returned | 2025-11-24 | 2025-11-24 | 0 |
| `10557550581` | Amina Narikbayeva | Returned | Returned | 2025-11-24 | 2025-11-13 | 0 |
| `10596974659` | BM 1098 (Ian Boyd) | Returned | Returned | 2025-11-22 | 2025-11-21 | 0 |
| `10547589427` | Ays Amkhalov | Returned | Returned | 2025-11-20 | 2025-11-12 | 0 |
| `18343264794` | Tosin | Returned | Returned | 2025-11-20 | 2025-11-04 | 0 |
| `18341993384` | Michael Knight | Returned | Returned | 2025-11-20 | 2025-11-04 | 0 |
| `18302910522` | Mitch Holmes | Returned | Shipped | 2025-11-20 | 2025-10-29 | 0 |
| `18342421515` | Chroma Oriaku **Difficult client | Returned | Returned | 2025-11-19 | 2025-11-04 | 0 |
| `10539376014` | Charles Barrington | Returned | Returned | 2025-11-18 | 2025-11-11 | 0 |
| `10527798222` | Alessia Grasso | Returned | Returned | 2025-11-18 | 2025-11-10 | 0 |
| `18363951363` | Mohammed Sheikh | Returned | Shipped | 2025-11-18 | 2025-11-06 | 0 |
| `18300536810` | Hannah | Awaiting Collection | Ready To Collect | 2025-11-17 | 2025-10-29 | 0 |
| `18356838009` | John Patrick | Returned | Returned | 2025-11-14 | 2025-11-05 | 0 |
| `18330308178` | James Shipwright | Returned | Returned | 2025-11-10 | 2025-11-10 | 0 |
| `18341592928` | Jermaine Amissah | Returned | Returned | 2025-11-06 | 2025-11-04 | 0 |
| `18330792829` | Nathaniel Giraitis | Returned | Returned | 2025-11-06 | 2025-11-03 | 0 |
| `18327388698` | Annelisa Le | Awaiting Collection | Ready To Collect | 2025-11-06 | 2025-11-02 | 0 |
| `18342716771` | Zain Patel | Returned | Returned | 2025-11-04 | 2025-11-04 | 0 |
| `18333066247` | Dean Iyavoo | Returned | Returned | 2025-11-04 | 2025-11-03 | 0 |
| `18298405734` | Nati Krutkaew **Requested Friday Collection | Returned | Returned | 2025-10-31 | 2025-10-29 | 0 |
| `18097827769` | Bryan Khan | Returned | Returned | 2025-10-31 | 2025-10-27 | 0 |
| `18275164567` | Dwayne Morris (Everything Apple Tech [7%]) | Returned | Returned | 2025-10-31 | 2025-10-27 | 0 |
| `18255551647` | Yujin Lim | Returned | Returned | 2025-10-30 | 2025-10-23 | 0 |
| `18251678109` | Holly McHugh | Returned | Returned | 2025-10-29 | 2026-01-06 | 0 |
| `18181403798` | Jermaine Brown | Returned | Shipped | 2025-10-29 | 2025-10-14 | 0 |
| `18031244169` | Swati Kirve | Awaiting Collection | Ready To Collect | 2025-10-29 | 2025-09-24 | 0 |
| `18251440116` | Rex Ofoegbu | Returned | Returned | 2025-10-28 | 2025-10-23 | 0 |
| `18251258517` | Dani Murphy | Returned | Returned | 2025-10-28 | 2025-10-23 | 0 |
| `18211374242` | Sarah Shedd 2 | Returned | Returned | 2025-10-28 | 2025-10-17 | 0 |
| `18222706123` | Masaie Saji | Returned | Returned | 2025-10-24 | 2025-10-20 | 0 |
| `18136991956` | Ally Law | Returned | Returned | 2025-10-24 | 2025-10-08 | 0 |
| `18034349226` | Mario Balcan (Mother Family) | Returned | Shipped | 2025-10-24 | 2025-09-24 | 0 |
| `18231524628` | Nainesh Patel | Returned | Returned | 2025-10-23 | 2025-10-21 | 0 |
| `18231275059` | Matthias Sotiras | Returned | Returned | 2025-10-23 | 2025-10-21 | 0 |
| `18223200412` | Raj Dasgupta *DO NOT CONNECT TO WIFI | Returned | Returned | 2025-10-23 | 2025-10-20 | 0 |
| `18199104117` | Khuram Shehzad (F 4 Fones Ltd) | Returned | Shipped | 2025-10-23 | 2025-10-16 | 0 |
| `18179386654` | Mari Kydd | Returned | Shipped | 2025-10-23 | 2025-10-14 | 0 |
| `18201431292` | Edvinas Bruzas | Returned | Returned | 2025-10-21 | 2025-10-16 | 0 |
| `18157769728` | Armand Berisha | Returned | Shipped | 2025-10-21 | 2025-10-10 | 0 |
| `18149241407` | ZARA -  129  ( 3230 ) | Returned | Shipped | 2025-10-21 | 2025-10-09 | 0 |
| `18189342717` | William Lau (The Children’s Hospital) | Returned | Returned | 2025-10-17 | 2025-10-15 | 0 |
| `18178725706` | Kirti kerai | Returned | Returned | 2025-10-17 | 2025-10-14 | 0 |
| `18149427154` | Mahi Nair | Awaiting Collection | Ready To Collect | 2025-10-16 | 2025-10-10 | 0 |
| `18147683963` | Van Pham | Returned | Shipped | 2025-10-16 | 2025-10-09 | 0 |
| `18118645249` | Paul Jenkins | Returned | Shipped | 2025-10-16 | 2025-10-06 | 0 |
| `18158849267` | Mahir Rohman 1 | Returned | Returned | 2025-10-15 | 2025-10-10 | 0 |
| `18102849902` | Rohit Sheoran | Returned | Shipped | 2025-10-14 | 2025-10-03 | 0 |
| `18096268751` | Andrea Bonzi (Hakluyt) | Returned | Returned | 2025-10-14 | 2025-10-02 | 0 |
| `18023073415` | Joe Talbot | Returned | Returned | 2025-10-14 | 2025-09-23 | 0 |
| `9995445460` | Stefan Bilu (BSRC) | Returned | Shipped | 2025-10-14 | 2025-09-08 | 0 |
| `18077180489` | Russell Prebble | Returned | Returned | 2025-10-13 | 2025-09-30 | 0 |
| `18147365314` | Divash Joshi - BM 808 | Returned | Returned | 2025-10-10 | 2025-10-09 | 0 |
| `18104812711` | Dylan Duong | Returned | Returned | 2025-10-10 | 2025-10-03 | 0 |
| `18063891693` | Jasmine | Returned | Returned | 2025-10-10 | 2025-09-29 | 0 |
| `18001969328` | Slim Benatia 2 | Returned | Shipped | 2025-10-10 | 2025-09-19 | 0 |
| `18116266653` | Landan | Returned | Returned | 2025-10-09 | 2025-10-06 | 0 |
| `18073256753` | Mark Hansley (Jayne Heale) | Returned | Shipped | 2025-10-09 | 2025-09-30 | 0 |
| `18050188388` | Brandon Grant | Returned | Shipped | 2025-10-09 | 2025-09-26 | 0 |
| `18057911199` | Hady Baeg | Returned | Returned | 2025-10-07 | 2025-09-27 | 0 |
| `18050408463` | Dan Bradford - ERC 2 | Returned | Shipped | 2025-10-07 | 2025-09-26 | 0 |
| `18050408128` | Dan Bradford - ERC 1 | Returned | Shipped | 2025-10-06 | 2025-09-26 | 0 |
| `11380699456` | BM 1498 (Millie Merryweather) | Returned | Shipped |  | 2026-04-03 | 0 |
| `11625087344` | #1156 - Gary Adamson | Incoming Future | Shipped |  | 2026-04-02 | 0 |
| `11646088036` | #1158 - Chelsea Boliti | Incoming Future | Shipped |  | 2026-04-02 | 0 |
| `11659146326` | Andy Choi | Returned | Returned |  | 2026-04-02 | 0 |
| `11657561516` | #1159 - Katie Ramsay | Cancelled/Missed Bookings | Cancelled/Declined |  | 2026-04-02 | 0 |
| `11648456388` | Biki nepali | Today's Repairs | Cancelled/Declined |  | 2026-04-01 | 0 |
| `11573323200` | Adrian (The Computer Clinic) 1 | Returned | Shipped |  | 2026-03-31 | 0 |
| `11552367682` | #1134 - Michael Cooper | Returned | Shipped |  | 2026-03-31 | 0 |
| `11557913679` | #1138 - David Wilkins | Returned | Shipped |  | 2026-03-31 | 0 |
| `11592657893` | Jakub Swilpa | Incoming Future | Shipped |  | 2026-03-31 | 0 |
| `11615679691` | #1151 - Sanchita Sharan | Returned | Returned |  | 2026-03-31 | 0 |
| `11118919990` | BM 1351 (Shireen Akhtar) | Returned | Shipped |  | 2026-03-30 | 0 |
| `11624541306` | BM 1569 ( Alexandra Bringans ) *Counteroffer rejected | Returned | Shipped |  | 2026-03-30 | 0 |
| `11620912430` | #1154 - Rachel Adjekukor | Returned | Returned |  | 2026-03-30 | 0 |
| `11390730717` | BM 1511 ( Hannah Gatenby ) | BER Devices | BER/Parts |  | 2026-03-28 | 0 |
| `11535526352` | BM 1376 ( Martin Bingham ) (RTN > REPAIR) | Returned | Shipped |  | 2026-03-28 | 0 |
| `11586121271` | #1145 - Tariq Bayjoo | Returned | Shipped |  | 2026-03-27 | 0 |
| `11527181831` | David Lowe (Econocom) | Returned | Returned |  | 2026-03-27 | 0 |
| `11613346945` | #1150 - Thomas Davies | Returned | Returned |  | 2026-03-27 | 0 |
| `11610951937` | #1149 - Jenni Walden | Incoming Future | Shipped |  | 2026-03-27 | 0 |
| `11601218440` | Sergio de Abreu | Returned | Returned |  | 2026-03-26 | 0 |
| `11591008518` | Tim Cridland | Returned | Returned |  | 2026-03-25 | 0 |
| `11390716285` | BM 1504 ( mitshel ibrahim ) *Unable to remove IC | Returned | Shipped |  | 2026-03-24 | 0 |
| `11579557238` | Oriane Fabregoule | Returned | Returned |  | 2026-03-24 | 0 |
| `11468272321` | BM 1537 ( Jasmine Gann ) | BER Devices | BER/Parts |  | 2026-03-24 | 0 |
| `11572875927` | #1143 - Joanita Kugonza | Cancelled/Missed Bookings | Cancelled/Declined |  | 2026-03-23 | 0 |
| `11486670006` | BM 1541 (Muhab Saed) | Returned | Shipped |  | 2026-03-23 | 0 |
