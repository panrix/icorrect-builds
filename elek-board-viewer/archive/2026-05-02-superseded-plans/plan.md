# Plan: FlexBV Headless Board Viewer for Elek

**Author:** Claude Code  
**Date:** 2026-03-28  
**Status:** QA-reviewed and rewritten for execution

## Objective

Deliver a VPS-hosted board-view service that lets the Elek agent answer requests like:

`show me C8430 on the A2681`

The service must:

1. Resolve the requested board.
2. Validate or best-effort locate the component.
3. Drive FlexBV in a headless X session.
4. Capture a clean screenshot with the component visible.
5. Return structured JSON so the agent can send the image to the team.

## Success Criteria

This plan is complete only when all of the following are true:

1. A persistent headless FlexBV session runs on the VPS and survives reboots.
2. `python3 scripts/board_lookup.py A2681 C8430` returns JSON with a valid screenshot path.
3. The screenshot clearly shows the requested board and the requested component centered or visibly highlighted.
4. The flow works repeatedly across at least 3 different boards without manual intervention.
5. The Elek agent can call one command, get one JSON result, and send the produced image to the team.

## Scope

In scope:

- `.brd` board lookup and metadata extraction
- persistent headless FlexBV runtime
- board switching
- component search
- screenshot capture and optional annotation
- structured JSON CLI interface for the agent
- logs, recovery, cleanup, and verification

Out of scope for v1:

- multi-user parallel GUI sessions
- OCR-based visual verification
- editing boards or nets inside FlexBV
- a web UI
- arbitrary free-form natural language parsing inside the board tool itself

## Final Architecture

The system has four layers:

1. **Board Catalog Layer**
   - Maps logical board names like `A2681` to actual `.brd` file paths.
   - Produces one authoritative `board_index.json`.

2. **Parser Layer**
   - Decodes `.brd` files and extracts components, pins, nets, and approximate coordinates when available.
   - Used for fast validation and metadata return.
   - Must not block screenshot mode if parsing is incomplete but the board file is valid.

3. **FlexBV Runtime Layer**
   - Runs one long-lived FlexBV process inside one long-lived Xvfb display with Openbox.
   - Owns board loading, window focus, search, screenshot, and restart recovery.

4. **CLI Integration Layer**
   - `board_lookup.py` is the only interface the Elek agent calls.
   - Returns machine-readable JSON and never requires interactive input.

## Operational Decisions

These are mandatory design choices. Do not leave them implicit during implementation.

### Runtime User

- Run everything as the same Unix user that the Elek agent uses.
- Do not split runtime ownership across users.
- If the service must survive logout, enable lingering for that user.

### Display

- Use display `:99`.
- Use `Xvfb :99 -screen 0 1920x1080x24`.
- Export `DISPLAY=:99` in the service and in every helper command.

### Window Manager

- Use `openbox` inside the same display.
- Do not run FlexBV without a window manager.

### Screenshot Strategy

- Capture the FlexBV window dynamically by window id.
- Do not rely on fixed full-screen crop coordinates.
- First locate the FlexBV window id with `xdotool search`.
- Capture that specific window with ImageMagick `import`.
- Do not use `scrot` in v1.

### Runtime Ownership

- systemd owns Xvfb and Openbox only.
- `flexbv_controller.py` owns the FlexBV process lifecycle.
- Do not run FlexBV as the long-lived main process inside the systemd service.
- This avoids conflicting restart logic between systemd and the controller.

### Concurrency

- v1 uses exactly one FlexBV instance and serializes all requests.
- Use one blocking file lock around the entire request lifecycle:
  `ensure_runtime -> load_board_if_needed -> search -> capture -> annotate -> return`.
- If a second request arrives, it must wait, not race.

### Truth Source

- The live FlexBV process and live window are authoritative.
- A state file is only a cache, never the source of truth.
- Every request must revalidate the live process before using cached state.

## Expected Repo Layout

The implementation should create or update these paths:

- `scripts/board_lookup.py`
- `scripts/flexbv_controller.py`
- `scripts/brd_parser.py`
- `scripts/build_board_index.py`
- `data/board_index.json`
- `data/screenshots/`
- `data/boardview_logs/`
- `data/boardview_state/runtime.json`
- `systemd/flexbv-headless.service`
- `systemd/boardview-cleanup.service`
- `systemd/boardview-cleanup.timer`

If this project lives inside another workspace, keep the same relative structure there.

## External Dependencies

Prerequisites that must exist before coding starts:

- FlexBV `.tgz` available on the VPS
- sudo access for package install and `/opt/flexbv`
- the 18 board folders with `.brd` files available locally

Packages to install:

```bash
sudo apt update
sudo apt install -y xdotool imagemagick x11-utils openbox xvfb wmctrl
```

Notes:

- `wmctrl` is added because it is useful for reliable window focus and enumeration.
- If ImageMagick policy blocks operations, fix that before continuing rather than working around it ad hoc.

## Phase 1: Install and Prove the Headless Runtime

Goal: establish a stable headless display session and prove FlexBV can be automated before writing the controller.

Steps:

1. Extract FlexBV to `/opt/flexbv`.
2. Confirm the main executable path and required shared libraries.
3. Confirm the actual FlexBV binary name and invocation syntax on this VPS.
4. Create a systemd user service named `flexbv-headless.service`.
5. Service responsibilities:
   - export `DISPLAY=:99`
   - start Xvfb
   - start Openbox
   - keep logs in a known location
   - restart on failure
6. Enable the service and start it.
7. Launch FlexBV manually inside `DISPLAY=:99` and confirm a FlexBV window exists.
8. Discover and document the actual component-search interaction method:
   - keyboard shortcut if one exists
   - menu navigation path if no shortcut exists
   - dialog behavior after a successful search
   - dialog behavior after a failed search
9. Record the chosen search method in this plan before Phase 4 implementation begins.

Minimum service behavior:

- Wait for Xvfb before starting Openbox.
- Write service logs to `data/boardview_logs/flexbv-session.log`.
- Use `Restart=on-failure`.

Acceptance checks:

```bash
systemctl --user daemon-reload
systemctl --user enable --now flexbv-headless.service
systemctl --user status flexbv-headless.service
DISPLAY=:99 /opt/flexbv/flexbv
DISPLAY=:99 xdotool search --name FlexBV
DISPLAY=:99 xwininfo -root
```

Exit criteria for Phase 1:

- service survives restart
- search workflow is discovered and documented
- FlexBV window is discoverable
- no manual desktop login is required

## Phase 2: Build the Board Catalog

Goal: remove filename ambiguity before parser or automation work.

Implementation:

1. Write `scripts/build_board_index.py`.
2. Scan the schematics directory for `.brd` files.
3. Build a JSON map from logical board identifier to one or more board revisions.
4. Include additional metadata when available:
   - model name
   - revision / board number
   - board code
   - folder path
   - `.pdf` sibling path
   - parser status

Required output shape:

```json
{
  "A2681": {
    "default_revision": "820-02862",
    "revisions": {
      "820-02536": {
        "board_path": "/abs/path/to/file.brd",
        "pdf_path": "/abs/path/to/file.pdf",
        "folder": "/abs/path/to/folder",
        "aliases": ["A2681", "PJM-MLB"]
      },
      "820-02862": {
        "board_path": "/abs/path/to/file2.brd",
        "pdf_path": "/abs/path/to/file2.pdf",
        "folder": "/abs/path/to/folder2",
        "aliases": ["A2681", "PJM-MLB"]
      }
    }
  }
}
```

Rules:

- All keys must be uppercase normalized.
- Revision keys must preserve the board number format like `820-02862`.
- Alias collisions must fail the build.
- Missing `.pdf` should warn, not fail.
- Missing `.brd` is a hard failure.
- Multi-revision models must declare one explicit `default_revision`.
- The CLI must be able to address either a model or a specific revision.

Exit criteria for Phase 2:

- all models are present in `data/board_index.json`
- every revision entry resolves to an existing `.brd`
- every multi-revision model has a default revision

## Phase 3: Build the `.brd` Parser

Goal: provide fast metadata and pre-validation without making screenshot mode fragile.

Contract for `brd_parser.py`:

- `load_board(path) -> BoardData`
- `find_component(board, name) -> Component | None`
- `find_net(board, net_name) -> list[Pin]`
- `list_components(board) -> list[str]`
- `get_component_center(board, name) -> {x, y} | None`

Required behavior:

1. Decode XOR-encoded `.brd` data.
2. Parse components and pins when possible.
3. Normalize component lookups case-insensitively.
4. Preserve original component naming for output.
5. Return structured parse errors.
6. Never crash the main CLI on malformed input.

Critical rule:

- Parser failure must not block screenshot mode if the board file exists.
- If parser metadata is unavailable, `board_lookup.py` may still attempt FlexBV search.

Testing requirements:

- run parser against all 18 boards
- emit a report with:
  - total boards
  - parse success count
  - parse partial count
  - parse failure count
  - component count per board

Exit criteria for Phase 3:

- parser works fully or partially on all boards
- any partial/failure case is explicit and non-fatal for screenshot mode

## Phase 4: Build the FlexBV Controller

Goal: make GUI automation deterministic enough for server use.

`flexbv_controller.py` must own these actions:

- `ensure_runtime()`
- `get_window_id()`
- `focus_window()`
- `restart_runtime_if_dead()`
- `load_board(model_or_revision, board_path)`
- `search_component(component_name)`
- `capture_window_png(output_path)`
- `annotate_image(input_path, output_path, label)`

### Runtime Checks

Every request must perform these checks in order:

1. confirm `DISPLAY=:99` is reachable
2. confirm FlexBV process exists
3. confirm FlexBV window exists
4. confirm the window can be focused
5. reacquire geometry fresh for this request

If any check fails:

- restart the runtime once
- retry the request once
- return structured error JSON on second failure

### Board Loading Strategy

Use this policy:

1. If requested board equals currently loaded board and live window is healthy, do not restart.
2. If board differs, kill any live FlexBV process and relaunch FlexBV with `-i <board_path>`.
3. After restart, wait until the new window exists before proceeding.
4. Update runtime cache only after the new window is confirmed.

Reason:

- CLI load on startup is more deterministic than automating File > Open.
- The controller is the only component allowed to start or stop FlexBV.

### Search Strategy

Search must not be implemented as blind sleeps only.

Required sequence:

1. focus main window
2. send `Escape` once to close stray dialogs
3. execute the Phase 1-discovered search interaction
4. verify the expected search dialog or focused search field exists
5. clear existing text
6. type the component name
7. submit search
8. wait for the post-search idle period
9. capture the window

Positive success checks required:

- window id remains valid after search
- no modal error dialog appears
- screenshot file is created and non-empty

Preferred additional checks if practical:

- detect window title changes
- detect known dialog widgets
- compare pre-search vs post-search screenshot hashes to ensure the UI changed

### Screenshot Strategy

Use dynamic window capture by window id:

1. get the live FlexBV window id
2. capture that specific window with `import`
3. store raw screenshot first
4. create annotated derivative second

Store both:

- raw screenshot
- annotated screenshot

File naming:

`{timestamp}_{board}_{component}_{raw|annotated}.png`

### State File

Use `data/boardview_state/runtime.json` only as a cache with:

- pid
- window_id
- loaded_board
- last_started_at
- last_success_at

Before trusting it, confirm:

- pid is alive
- window id still exists
- loaded board matches request if reusing session

Exit criteria for Phase 4:

- can load a board, search a component, and capture the FlexBV window repeatedly
- dead process recovery works once automatically

## Phase 5: Build the Agent-Facing CLI

Goal: give the Elek agent one stable command.

Command:

```bash
python3 scripts/board_lookup.py A2681 C8430
```

Specific revision form:

```bash
python3 scripts/board_lookup.py A2681:820-02862 C8430
```

Modes:

- default: capture screenshot and return JSON
- `--info-only`: return parser metadata only
- `--no-annotate`: skip annotation

Required JSON success shape:

```json
{
  "status": "ok",
  "board": "A2681",
  "revision": "820-02862",
  "component": "C8430",
  "board_path": "/abs/path/file.brd",
  "screenshot_path": "/abs/path/annotated.png",
  "raw_screenshot_path": "/abs/path/raw.png",
  "parser_status": "ok",
  "pins": [],
  "nets": [],
  "warnings": []
}
```

Required JSON error shape:

```json
{
  "status": "error",
  "error_code": "component_not_found",
  "message": "Component C8430 was not found on board A2681",
  "board": "A2681",
  "revision": "820-02862",
  "component": "C8430",
  "warnings": []
}
```

Required error codes:

- `board_not_found`
- `component_not_found`
- `parser_failed`
- `runtime_unavailable`
- `window_not_found`
- `search_failed`
- `screenshot_failed`
- `lock_timeout`

Rules:

- print JSON only on stdout
- send logs and diagnostics to files, not stdout
- exit non-zero on error
- normalize input board and component names without hiding the original input
- if only a model is provided and multiple revisions exist, use `default_revision` and include the chosen revision in the JSON response

Exit criteria for Phase 5:

- Elek agent can call one command and consume one JSON payload with no scraping

## Phase 6: Logging, Cleanup, and Recovery

Goal: make remote failures diagnosable.

Implement:

1. request log file in `data/boardview_logs/requests.log`
2. service log file in `data/boardview_logs/flexbv-session.log`
3. controller log file in `data/boardview_logs/flexbv-controller.log`
4. failure artifact retention:
   - last 20 failed raw screenshots
   - last 20 failed annotated screenshots
5. cleanup timer for screenshots older than 7 days
6. cleanup timer for logs older than 14 days if they are rotated elsewhere

Each request log line should include:

- timestamp
- board
- revision
- component
- requested mode
- parser status
- loaded board before request
- loaded board after request
- duration ms
- status
- error code if any

Exit criteria for Phase 6:

- failures are visible without attaching to the live display

## Phase 7: Agent Integration

Goal: make the board viewer usable by the team through Elek.

Tasks:

1. Document the command in `TOOLS.md`.
2. Document calling conventions in `CLAUDE.md` or the agent instruction file actually in use.
3. Instruct the agent to:
   - call `board_lookup.py`
   - parse returned JSON
   - attach `screenshot_path` when `status=ok`
   - include `warnings` if present
4. Provide 2 to 3 canonical examples in docs.

Required examples:

```bash
python3 scripts/board_lookup.py A2681 C8430
python3 scripts/board_lookup.py A2681:820-02862 C8430
python3 scripts/board_lookup.py A2681 C8430 --info-only
python3 scripts/board_lookup.py A2337 PPBUS_G3H --no-annotate
```

Exit criteria for Phase 7:

- Elek can request a board location and the agent can respond with a generated image using only the documented command

## Verification Matrix

All of these must pass before the plan is considered complete.

### Runtime

1. reboot-safe service start
2. manual service restart
3. dead FlexBV process recovery
4. missing window recovery

### Board Loading

1. first board load on cold runtime
2. repeated lookup on same board without restart
3. board switch from `A2681` to `A2337`
4. board switch back to original board
5. specific revision load on a multi-revision model
6. default revision selection when revision is omitted

### Search

1. known-good component
2. component not found
3. lowercase input normalized to uppercase match
4. component with parser metadata available
5. component with parser unavailable but GUI lookup still attempted

### Screenshot

1. raw screenshot created
2. annotated screenshot created
3. image is non-empty
4. captured region is the FlexBV window, not the full root display

### Concurrency

1. two back-to-back requests serialize correctly
2. one long request plus one queued request does not cross boards

### JSON Contract

1. success payload parses as JSON
2. error payload parses as JSON
3. stdout contains JSON only

## Manual Test Commands

These are the minimum operator tests after implementation:

```bash
python3 scripts/build_board_index.py
python3 scripts/board_lookup.py A2681 C8430 --info-only
python3 scripts/board_lookup.py A2681 C8430
python3 scripts/board_lookup.py A2681:820-02862 C8430
python3 scripts/board_lookup.py A2681 NONEXISTENT
python3 scripts/board_lookup.py A2337 C8430
python3 scripts/board_lookup.py a2681 c8430
```

Two repeated-run tests:

```bash
python3 scripts/board_lookup.py A2681 C8430
python3 scripts/board_lookup.py A2681 C8430
python3 scripts/board_lookup.py A2337 C8430
python3 scripts/board_lookup.py A2681 C8430
```

## Hard Failure Rules

The tool must fail closed in these cases:

- requested board is not in `board_index.json`
- screenshot file was not created
- FlexBV window cannot be found after restart retry
- lock cannot be acquired within the configured timeout

The tool may continue with warnings in these cases:

- parser partially failed but board file exists
- `.pdf` sibling missing
- annotation failed after raw screenshot succeeded

## Risks and Mitigations

### FlexBV focus drift

Risk:

- the wrong window receives keystrokes

Mitigation:

- always reacquire window id
- focus explicitly before search
- validate window existence after each restart

### Parser variance across boards

Risk:

- one board format differs and breaks pre-validation

Mitigation:

- parser never blocks screenshot mode by itself
- parser status is returned explicitly in JSON

### Wrong-board screenshots

Risk:

- cached state says board A, live runtime still shows board B

Mitigation:

- live process is authoritative
- restart on board change
- do not trust cache without live checks

### Service invisibility

Risk:

- runtime fails but the agent only sees generic errors

Mitigation:

- request log
- service log
- retained failure screenshots

## Acceptance Gate

Do not mark the project done until all of the following are true:

1. systemd display/session service is enabled and healthy
2. all 18 boards are indexed
3. parser report exists
4. same-board and cross-board screenshot tests pass
5. at least one multi-revision board is tested with both default and explicit revision selection
6. one intentional failure returns correct JSON error
7. Elek agent documentation is updated
8. a real test message path to the team has been exercised with an actual screenshot

## QA Verdict (qa-plan)

This is now a buildable plan. The critical constraints are fixed: one runtime user, one serialized GUI session, dynamic window capture, parser fallback, explicit JSON contract, and a verification matrix that proves the agent can reliably generate and send board screenshots to the team.

---

## QA-of-QA Review (Claude Code, 2026-03-28)

**Reviewer:** Claude Code (VPS-verified)
**Verdict:** Prior issues identified and now folded into the main plan

### What the QA Got Right

The rewrite significantly improved the original:
- Explicit concurrency model (file lock, no races)
- Live process as truth source (state file is cache only)
- Parser fallback (failure doesn't block screenshots)
- JSON contract (exact shapes, error codes, stdout-only)
- Dynamic window capture (no hardcoded crop coordinates)
- Verification matrix (comprehensive, testable)

### Resolved In Main Plan — Multi-Revision Boards

The plan says "18 boards" but 5 models have 2 revisions each:

```
A2681 820-02536/    ← revision 1
A2681 820-02862/    ← revision 2
A2338 820-02020/ / A2338 820-02773/
A2442 820-02098/ / A2442 820-02443/
A2485 820-02100/ / A2485 820-02382/
A2779 820-02655/ / A2779 820-02841/
```

If Elek asks "show me C8430 on the A2681" the plan now resolves that through `default_revision`, with explicit `A2681:820-02862` syntax supported for override.

This is now reflected in:
- Phase 2 catalog schema
- Phase 5 CLI syntax
- JSON responses that include the resolved revision

### Resolved In Main Plan — FlexBV Search Shortcut Unknown

The plan says "send search shortcut" but never specifies what it is. FlexBV is not a mainstream app — its keyboard shortcuts must be discovered by running it.

This is now a hard Phase 1 gate. Search interaction must be discovered and documented before Phase 4 starts. If no shortcut exists, menu-driven search becomes the required implementation path.

### Resolved In Main Plan — systemd Service Ownership

The main plan now separates ownership cleanly:
- systemd owns Xvfb and Openbox
- the controller owns FlexBV

That removes the restart conflict between systemd and the controller.

### Resolved In Main Plan — Screenshot Tooling

The main plan now uses ImageMagick `import -window <id>` and drops `scrot`.

That matches the window-id-based capture design.

### Minor Issues (Fix During Build)

1. **Workspace paths vague** — `scripts/`, `data/` are relative. Root is `/home/ricky/.openclaw/agents/diagnostics/workspace/`. The `scripts/` dir doesn't exist yet.
2. **`--raw` flag removed** — default JSON already includes `raw_screenshot_path`
3. **Lock timeout unspecified** — error code exists but no timeout value (suggest 30-60s)
4. **Cleanup timer over-engineered** — systemd timer for screenshot cleanup; a cron one-liner or the nightly janitor is simpler
5. **FlexBV binary path** — archive is `FlexBV-5.1383-linux/flexbv` (lowercase). Also contains `fbvpdf` (PDF converter) — useful later
6. **`component_not_found` vs `search_failed`** — semantics unclear when parser can't validate and GUI search finds nothing
7. **FlexBV .tgz already on VPS** — prerequisite is satisfied: `/home/ricky/.openclaw/agents/diagnostics/workspace/FlexBV-5.1383-linux-00Y705628M9082135.tgz` (39MB)

### VPS State Confirmed

- ✅ Xvfb installed (`/usr/bin/Xvfb`)
- ✅ Display `:99` available
- ✅ 18 board directories with .brd + .pdf files
- ✅ FlexBV .tgz in workspace (39MB)
- ✅ Loginctl linger enabled
- ✅ Elek agent configured with own Telegram bot (`elek-diag`)
- ❌ xdotool, imagemagick, openbox, x11-utils, wmctrl not installed
- ❌ FlexBV not extracted to `/opt/`
- ❌ `scripts/` directory doesn't exist in workspace

### Recommended Fix Order

1. Decide multi-revision strategy (needs Ricky input)
2. Implement the discovered search interaction from Phase 1
3. Keep systemd ownership limited to display/session infra
4. Use `import` instead of `scrot`

Then build.
