# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-02-12)

**Core value:** Teams can ship consistent, maintainable UI faster with production-ready Vue components.
**Current focus:** Milestone v0.5.0 — expression editor refactor

## Current Position

Phase: 4 of 5 (Drag-Drop)
Plan: 1 of 1 in current phase (completed)
Status: Phase 4 implementation complete; ready to plan Phase 5
Last activity: 2026-02-26 — Completed 04-01 drag-drop execution

Progress: [████████░░] 80%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: ~15 min
- Total execution time: ~88 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-visual-foundation | 1 | 1 | ~45 min |
| 02-input-stability | 3 | 3 | ~15 min |

| 03-variable-picker-interaction | 1 | 1 | ~5 min |
| 04-drag-drop | 1 | 1 | ~8 min |

**Recent Trend:**
- Last 5 plans: 02-02, 02-01, 02-03, 03-01, 04-01
- Trend: Phase 4 complete

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

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-26
Stopped at: Completed 04-01-PLAN.md
Resume file: .planning/ROADMAP.md
