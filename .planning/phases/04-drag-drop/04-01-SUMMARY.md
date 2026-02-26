---
phase: 04-drag-drop
plan: 01
subsystem: ui
tags: [lexical, drag-drop, expression-editor, vitest]

requires:
  - phase: 03-variable-picker-interaction
    provides: variable node insertion and selection safety guarantees used by reorder flow
provides:
  - variable-node-only native drag/drop reorder command pipeline
  - shared slot-based reorder engine for native drop and fallback move controls
  - drag-drop behavior contract in tests and sample matrix documentation
affects: [05-architecture, expression-editor, ux-03]

tech-stack:
  added: []
  patterns:
    - single reorder engine reused by native drag and fallback controls
    - payload-validated internal-only drag/drop with silent revert on invalid drop

key-files:
  created:
    - ui/components/expression-editor/use-expression-drag-drop.ts
    - ui/components/expression-editor/__test__/drag-drop.test.ts
    - .planning/phases/04-drag-drop/deferred-items.md
  modified:
    - ui/components/expression-editor/plain-text.ts
    - ui/components/expression-editor/nodes/variable-node.tsx
    - ui/components/expression-editor/constants.ts
    - ui/components/expression-editor/expression-editor.vue
    - ui/components/expression-editor/style.scss
    - sample/src/expression-editor/index.vue

key-decisions:
  - "Drop target uses variable slot model and plain-text hover snaps to nearest legal slot."
  - "Invalid payload or cross-scope drop is handled as silent revert to keep content unchanged."
  - "Fallback move up/down uses the same moveVariableByDirection/reorderVariableNode path as native drop."

patterns-established:
  - "Internal drag payload pattern: scope-bound DataTransfer payload + lexical update reorder."
  - "Desktop-first drag UI with explicit fallback controls in unsupported native DnD environments."

requirements-completed: [UX-03]

duration: 8 min
completed: 2026-02-26
---

# Phase 4 Plan 1: Drag-Drop Summary

**Expression editor now supports variable-node-only internal drag-drop reorder with slot snapping, insertion indicator feedback, and equivalent fallback move controls using one shared lexical reorder engine.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-26T02:56:27Z
- **Completed:** 2026-02-26T03:04:47Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Replaced `DRAGSTART`/`DRAGOVER`/`DROP` no-op stubs with internal-only variable drag pipeline in `plain-text.ts`.
- Added `use-expression-drag-drop.ts` shared capability for payload validation, drop slot resolution, reorder engine, insertion indicator and edge auto-scroll.
- Added fallback move up/down controls (native DnD unsupported only) that call the same reorder logic, including boundary and readonly/disabled constraints.
- Added drag-drop tests and sample behavior matrix docs as implementation contract for UX-03.

## Task Commits

Each task was committed atomically:

1. **Task 1: 实现 variable-node-only 拖拽命令链路与共享重排引擎** - `20e8eb97` (feat)
2. **Task 2: 接入 ghost/插入指示与不支持原生 DnD 的等价控件** - `30061219` (feat)
3. **Task 3: 补充拖拽约束测试并更新行为文档矩阵** - `2e16c8ea` (feat)

**Plan metadata:** pending

## Files Created/Modified

- `ui/components/expression-editor/use-expression-drag-drop.ts` - shared drag/drop slot, reorder, payload and visual state helpers
- `ui/components/expression-editor/plain-text.ts` - lexical drag command handlers with internal scope checks
- `ui/components/expression-editor/nodes/variable-node.tsx` - draggable source marker and node key metadata
- `ui/components/expression-editor/expression-editor.vue` - fallback move controls wired to shared reorder path
- `ui/components/expression-editor/style.scss` - drag ghost, insertion indicator and fallback control styling
- `ui/components/expression-editor/__test__/drag-drop.test.ts` - regression tests for reorder constraints and fallback parity
- `sample/src/expression-editor/index.vue` - behavior matrix documenting drag/drop and fallback rules
- `.planning/phases/04-drag-drop/deferred-items.md` - out-of-scope baseline type-check issues log

## Decisions Made

- Use slot-based nearest-target snapping for dragover so plain-text hover resolves to a legal variable insertion point.
- Reject external or invalid drag payloads by silent revert (clear drag feedback only, no content mutation).
- Keep a single lexical reorder engine and expose two triggers: native DnD and fallback up/down controls.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `bunx tsc -p ui/tsconfig.json --noEmit` reports pre-existing repo-wide `.vue` module resolution errors outside this plan scope; tracked in `.planning/phases/04-drag-drop/deferred-items.md`.
- Initial Task 3 commit message using `test(...)` was rejected by repository commit-msg hook; commit was recreated with allowed type without changing code.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 implementation is complete for UX-03 with native drag/drop + fallback parity and automated regression checks.
- Ready to proceed to Phase 5 architecture work.

---
*Phase: 04-drag-drop*
*Completed: 2026-02-26*

## Self-Check: PASSED

- FOUND: `.planning/phases/04-drag-drop/04-01-SUMMARY.md`
- FOUND: `20e8eb97`
- FOUND: `30061219`
- FOUND: `2e16c8ea`
