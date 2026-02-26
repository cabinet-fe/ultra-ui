# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-02-12)

**Core value:** Teams can ship consistent, maintainable UI faster with production-ready Vue components.
**Current focus:** Milestone v0.5.0 — expression editor refactor

## Current Position

Phase: 5 of 5 (Architecture Refactor)
Plan: 1 of 3 in current phase (completed)
Status: Phase 5 in progress; ready to execute 05-02
Last activity: 2026-02-26 — Completed 05-01 runtime/sync boundary extraction

Progress: [████████░░] 78%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: ~13 min
- Total execution time: ~92 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-visual-foundation | 1 | 1 | ~45 min |
| 02-input-stability | 3 | 3 | ~15 min |

| 03-variable-picker-interaction | 1 | 1 | ~5 min |
| 04-drag-drop | 1 | 1 | ~8 min |
| 05-architecture-refactor | 1 | 3 | ~4 min |

**Recent Trend:**
- Last 5 plans: 02-01, 02-03, 03-01, 04-01, 05-01
- Trend: Architecture refactor started with runtime boundary baseline

## Accumulated Context

### Decisions

Decisions are logged in `PROJECT.md` Key Decisions table.
Recent decisions affecting current work:

- v0.5.0 roadmap: 5 phases (visual → stability → picker → drag-drop → architecture)
- All 11 v1 requirements mapped; no orphans
- 01-01: charPosition = index of first char after '@'; use $getNodeByKey for node validation
- 02-02: IME-safe preventDefault — add isComposing check at top of PreventDefaultListener
- 02-01: Model sync — lastEmittedValue guard, equality check in watchEffect, SKIP_DOM_SELECTION_TAG for renderModelValue
- 02-03: Parser — trailing text and no-match handling; parse/serialize inside editor.update() for tests
- [Phase 03]: Dual-path keyboard: Lexical command intercept when focus in editor, document listener when focus in picker u-input
- [Phase 03]: Selection revalidation via $getNodeByKey + $getSelection before insert — abort if cursor moved or node content changed
- [Phase 04]: Drag/drop scope fixed to variable-node-only, internal-only, same-expression reordering
- [Phase 04]: Desktop-first direct-drag + ghost/insertion indicator; fallback move up/down controls when native DnD unsupported
- [Phase 04-drag-drop]: Drop target uses variable slot model and plain-text hover snaps to nearest legal slot.
- [Phase 04-drag-drop]: Invalid payload or cross-scope drop is handled as silent revert to keep content unchanged.
- [Phase 04-drag-drop]: Fallback move up/down uses the same moveVariableByDirection/reorderVariableNode path as native drop.
- [Phase 05]: Runtime capability boundaries standardized with ExpressionEditorRuntime and EditorMutationGateway contracts.
- [Phase 05]: Model sync guards are centralized in internal/editor-runtime/model-sync.ts while preserving existing behavior.
- [Phase 05]: expression-editor facade now wires editor through createExpressionEditorRuntime without changing public props/emits.

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-26
Stopped at: Completed 05-01-PLAN.md
Resume file: .planning/phases/05-architecture-refactor/05-02-PLAN.md
