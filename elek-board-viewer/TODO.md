# TODO: Build FlexBV Headless Board Viewer

## Phase 0: Preconditions

- [ ] Confirm workspace root and final project paths.
- [ ] Confirm where the 18 board directories live on disk.
- [ ] Confirm FlexBV archive path on VPS.
- [ ] Confirm runtime Unix user is the same user the Elek agent runs as.
- [ ] Confirm lingering is enabled for that user.

## Phase 1: Headless Runtime

- [ ] Install required packages: `xdotool imagemagick x11-utils openbox xvfb wmctrl`.
- [ ] Extract FlexBV to `/opt/flexbv`.
- [ ] Confirm FlexBV binary path and startup syntax.
- [ ] Create `systemd/flexbv-headless.service` for Xvfb + Openbox only.
- [ ] Start and enable the user service.
- [ ] Verify `DISPLAY=:99` is available after restart.
- [ ] Launch FlexBV manually on `:99`.
- [ ] Verify FlexBV window discovery with `xdotool search --name FlexBV`.
- [ ] Document the real component search workflow in FlexBV.
- [ ] Decide search path:
- [ ] keyboard shortcut path if available
- [ ] menu/dialog automation path if shortcut is unavailable

## Phase 2: Repo Scaffolding

- [ ] Create `scripts/`.
- [ ] Create `data/`.
- [ ] Create `data/screenshots/`.
- [ ] Create `data/boardview_logs/`.
- [ ] Create `data/boardview_state/`.
- [ ] Create `systemd/`.

## Phase 3: Board Catalog

- [ ] Build `scripts/build_board_index.py`.
- [ ] Scan board directories for `.brd` files.
- [ ] Detect multi-revision models.
- [ ] Define one `default_revision` for each multi-revision model.
- [ ] Emit `data/board_index.json`.
- [ ] Fail on alias collisions.
- [ ] Warn on missing `.pdf`.
- [ ] Verify every revision entry resolves to a real `.brd`.

## Phase 4: `.brd` Parser

- [ ] Build `scripts/brd_parser.py`.
- [ ] Implement XOR decode.
- [ ] Implement component lookup.
- [ ] Implement net lookup.
- [ ] Implement component center extraction where possible.
- [ ] Return structured parse errors.
- [ ] Ensure parser failure does not block screenshot mode.
- [ ] Run parser across all boards.
- [ ] Produce parser coverage report.

## Phase 5: FlexBV Controller

- [ ] Build `scripts/flexbv_controller.py`.
- [ ] Implement runtime health checks for `DISPLAY`, process, and window.
- [ ] Implement window focus.
- [ ] Implement cache validation for `runtime.json`.
- [ ] Implement FlexBV launch and stop owned by the controller.
- [ ] Implement board switching with `-i <board_path>`.
- [ ] Implement discovered search workflow.
- [ ] Implement modal/error detection where possible.
- [ ] Implement raw screenshot capture with `import`.
- [ ] Implement annotated screenshot generation.
- [ ] Implement one automatic retry on runtime failure.
- [ ] Implement serialized locking around the full request lifecycle.

## Phase 6: Agent CLI

- [ ] Build `scripts/board_lookup.py`.
- [ ] Support `python3 scripts/board_lookup.py A2681 C8430`.
- [ ] Support explicit revision syntax like `A2681:820-02862`.
- [ ] Support `--info-only`.
- [ ] Support `--no-annotate`.
- [ ] Return JSON only on stdout.
- [ ] Include resolved `revision` in success and error responses.
- [ ] Define and use stable error codes.
- [ ] Exit non-zero on error.

## Phase 7: Logging and Cleanup

- [ ] Write `requests.log`.
- [ ] Write `flexbv-session.log`.
- [ ] Write `flexbv-controller.log`.
- [ ] Retain recent failed screenshots.
- [ ] Add screenshot cleanup job for files older than 7 days.
- [ ] Add log cleanup or log rotation plan.

## Phase 8: Agent Integration

- [ ] Update `TOOLS.md`.
- [ ] Update `CLAUDE.md` or the actual agent instruction file in use.
- [ ] Document the one-command invocation pattern for Elek.
- [ ] Document how the agent should use `screenshot_path`.
- [ ] Add examples for default and explicit revision usage.

## Phase 9: Verification

- [ ] Cold-start runtime test passes.
- [ ] Same-board repeated lookup test passes.
- [ ] Cross-board switch test passes.
- [ ] Multi-revision default selection test passes.
- [ ] Multi-revision explicit selection test passes.
- [ ] Known-good component lookup test passes.
- [ ] Missing component error test passes.
- [ ] Parser-fallback screenshot test passes.
- [ ] Raw screenshot creation test passes.
- [ ] Annotated screenshot creation test passes.
- [ ] JSON stdout-only contract test passes.
- [ ] Dead FlexBV recovery test passes.
- [ ] One real end-to-end team message is sent with an actual screenshot.

## Build Order

1. Headless runtime and FlexBV search discovery.
2. Repo scaffolding and board index.
3. Parser.
4. FlexBV controller.
5. CLI.
6. Logging and cleanup.
7. Agent docs and end-to-end verification.
