---
phase: 05-architecture-refactor
plan: 01
subsystem: ui
tags: [expression-editor, lexical, vue, runtime-contract, model-sync]

# Dependency graph
requires:
  - phase: 04-drag-drop
    provides: Variable node drag/drop reorder behavior and fallback controls
provides:
  - Stable runtime contracts for editor capability boundaries
  - Dedicated model sync module with consolidated sync guards
  - Facade wiring through runtime factory without public API changes
affects: [05-architecture-refactor, expression-editor]

# Tech tracking
tech-stack:
  added: []
  patterns: [runtime-factory wiring, model-sync boundary extraction, facade-first refactor]

key-files:
  created:
    - ui/components/expression-editor/internal/contracts/editor-runtime.ts
    - ui/components/expression-editor/internal/editor-runtime/create-runtime.ts
    - ui/components/expression-editor/internal/editor-runtime/index.ts
    - ui/components/expression-editor/internal/editor-runtime/model-sync.ts
  modified:
    - ui/components/expression-editor/use-editor.ts
    - ui/components/expression-editor/expression-editor.vue

key-decisions:
  - "Runtime capability边界通过 ExpressionEditorRuntime 与 EditorMutationGateway 显式定义。"
  - "use-editor.ts 保留为兼容层，仅委托 createExpressionEditorRuntime，减少调用面震荡。"
  - "Facade 组件直接装配 runtime 工厂，保持 props/emits/导出不变。"

patterns-established:
  - "内部能力通过 internal/editor-runtime 统一入口装配。"
  - "sync 守卫聚合到独立 model-sync 模块，避免与 facade 生命周期混杂。"

requirements-completed: [ARCH-01, ARCH-02]

# Metrics
duration: 4 min
completed: 2026-02-26
---

# Phase 05 Plan 01: Architecture Refactor Baseline Summary

**Expression editor internals now use explicit runtime contracts and a dedicated model-sync module while preserving the existing public props/emits API surface.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-26T03:46:55Z
- **Completed:** 2026-02-26T03:51:22Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Added internal runtime contracts (`ExpressionEditorRuntime`, `EditorMutationGateway`) and runtime factory entry (`createExpressionEditorRuntime`).
- Extracted sync guards (`changeByUser`/`changeByModel`/`lastEmittedValue` + `SKIP_DOM_SELECTION_TAG`) into `model-sync.ts`.
- Converted `use-editor.ts` into compatibility forwarding layer and switched facade setup to runtime factory wiring.

## Task Commits

Each task was committed atomically:

1. **Task 1: 建立 runtime 契约与工厂入口（API 冻结前提）** - `d0dbc562` (feat)
2. **Task 2: 抽离并封装 model sync 守卫到独立模块** - `e40689be` (feat)
3. **Task 3: facade 组件瘦身并只做公开接口装配** - `526b9e92` (feat)

**Plan metadata:** `TBD` (docs: complete plan)

## Files Created/Modified

- `ui/components/expression-editor/internal/contracts/editor-runtime.ts` - Defines runtime and mutation gateway capability contracts.
- `ui/components/expression-editor/internal/editor-runtime/create-runtime.ts` - Creates and wires editor runtime lifecycle, mutation gateway, and model sync.
- `ui/components/expression-editor/internal/editor-runtime/index.ts` - Exposes runtime factory entry.
- `ui/components/expression-editor/internal/editor-runtime/model-sync.ts` - Encapsulates model sync guards and update behavior.
- `ui/components/expression-editor/use-editor.ts` - Compatibility wrapper delegating runtime creation.
- `ui/components/expression-editor/expression-editor.vue` - Facade now initializes editor through runtime factory.

## Decisions Made

- Runtime contract naming frozen as `createExpressionEditorRuntime` + `ExpressionEditorRuntime` for reuse in subsequent command-pack refactors.
- Sync-related control flow remains behavior-compatible while moving implementation to a dedicated module.
- Facade maintains external API (`ExpressionEditorProps`, `update:modelValue`) and delegates internal setup.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `bunx tsc -p ui/tsconfig.json --noEmit` fails due pre-existing repository-wide `.vue` module resolution errors outside this plan scope.
- `bunx vitest run ui/components/expression-editor/__test__/parser.test.ts` passes (5/5).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Runtime contract and sync boundaries are in place for follow-up拆分（insertion/drag-drop/rendering）.
- Public API remains stable for ARCH-02 compatibility gate.

## Self-Check: PASSED

- FOUND: `.planning/phases/05-architecture-refactor/05-01-SUMMARY.md`
- FOUND: `d0dbc562`, `e40689be`, `526b9e92` in git history

---
*Phase: 05-architecture-refactor*
*Completed: 2026-02-26*
