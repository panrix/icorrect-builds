TASK: Search Nicola Aaron serial on the Main board and look for another product/item.

Context:
- Nicola Aaron is currently parked because a BM Devices relation was missing despite serial search.
- Ricky asked: can Codex search the serial number on the Main board, can we find another product there?
- Workdir: /home/ricky/builds/backmarket
- Relevant existing reports/state may mention Nicola Aaron, BM Devices relation, serial, and queue maps.

Goal:
- Find the Nicola Aaron record and serial from existing reports/scripts/data.
- Search the Main board read-only for the serial and close variants.
- Determine whether another Main Board product/item exists that should be linked instead, or whether the device is genuinely missing/mislinked.

Hard requirements:
- Read-only only. No Monday writes, no Back Market writes, no portal actions, no customer messages.
- Do not guess the serial. If you cannot find it, state exactly where you looked and what is missing.
- If you query Monday, do not print secrets.
- Preserve item IDs, board IDs, matched text/serial evidence, product title/specs, BM number/customer name where available.

Output:
- Write a markdown report under /home/ricky/builds/backmarket/reports/ named nicola-aaron-main-board-serial-search-2026-04-26.md.
- Include: serial searched, queries performed, candidates found, recommended next action, confidence.
- Include a top summary suitable for Jarvis to paste to Ricky.
- Do not perform writes.

When completely finished, run:
openclaw system event --text "Done: Codex searched Nicola Aaron serial on Main board" --mode now
