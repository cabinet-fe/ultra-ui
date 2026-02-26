---
phase: 05-architecture-refactor
plan: 02
subsystem: ui
tags: [expression-editor, lexical, vue, command-packs, mutation-gateway]

# Dependency graph
requires:
  - phase: 05-architecture-refactor
    provides: Runtime contracts and model sync boundary from 05-01
provides:
  - Capability command packs (text-editing, clipboard, context-keys, drag-drop)
  - Typed mutation gateways for insertion and drag-drop
  - Contract-based use-context integration with command packs
affects: [05-architecture-refactor, expression-editor]

# Tech tracking
tech-stack:
  added: []
  patterns: [command-pack modularization, typed mutation gateway, context-command injection]

key-files:
  created:
    - ui/components/expression-editor/internal/features/commands/register-command-packs.ts
    - ui/components/expression-editor/internal/features/insertion/insertion-service.ts
    - ui/components/expression-editor/internal/features/drag-drop/drag-drop-service.ts
  modified:
    - ui/components/expression-editor/plain-text.ts
    - ui/components/expression-editor/use-context.ts
    - ui/components/expression-editor/expression-editor.vue
    - ui/components/expression-editor/internal/editor-runtime/create-runtime.ts
    - ui/components/expression-editor/internal/features/commands/register-command-packs.ts

key-decisions:
  - "Command packs split by capability: text-editing, clipboard, context-keys, drag-drop."
  - "Insertion and drag-drop mutations route through typed gateways (insertVariableAtTrigger, reorderVariable)."
  - "use-context exposes registerContextCommands for injection into registerCommandPacks; facade wires context pack."

patterns-established:
  - "plain-text delegates to registerCommandPacks; capability changes isolated to pack modules."
  - "All document mutations run inside editor.update via gateway services."

requirements-completed: [ARCH-01, ARCH-02]

# Metrics
duration: 2 min
completed: 2026-02-26
---

# Phase 05 Plan 02: Command Packs and Mutation Gateways Summary

**Expression editor commands split into capability packs with typed mutation gateways; insertion and drag-drop route through services; use-context integrated via contract injection.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-26T03:55:22Z
- **Completed:** 2026-02-26T03:57:21Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Split plain-text into capability command packs (text-editing, clipboard, drag-drop, context-keys) with mergeRegister.
- Added insertion-service (insertVariableAtTrigger) and drag-drop-service (reorderVariable, moveVariableByDirection) as typed mutation gateways.
- Wired use-context via registerContextCommands injection; facade calls registerPlainText with getContextCommands.
- Preserved IME safety, picker keyboard dual-path, and Phase 4 drag/drop constraints.

## Task Commits

Each task was committed atomically:

1. **Task 1: 将 plain-text 拆分为 capability command packs** - `b310528c` (feat)
2. **Task 2: 建立 insertion/drag-drop typed mutation gateway** - `26cec7ff` (feat)
3. **Task 3: use-context/picker 链路改为契约化接入并保持既有交互** - `5aacb1c3` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified

- `ui/components/expression-editor/internal/features/commands/register-command-packs.ts` - Capability packs with mergeRegister; text-editing, clipboard, drag-drop, optional context-keys.
- `ui/components/expression-editor/internal/features/insertion/insertion-service.ts` - insertVariableAtTrigger gateway.
- `ui/components/expression-editor/internal/features/drag-drop/drag-drop-service.ts` - reorderVariable and moveVariableByDirection gateways.
- `ui/components/expression-editor/plain-text.ts` - Thin entry delegating to registerCommandPacks.
- `ui/components/expression-editor/use-context.ts` - Exposes registerContextCommands for pack injection.
- `ui/components/expression-editor/expression-editor.vue` - Wires registerPlainText with getContextCommands; uses insertion/drag-drop services.
- `ui/components/expression-editor/internal/editor-runtime/create-runtime.ts` - Removed registerPlainText; facade now wires commands.

## Decisions Made

- Context-keys pack injected via getContextCommands; use-context no longer self-registers, returns registerContextCommands for merge.
- registerPlainText moved from create-runtime to facade so context can be wired after useContext.
- DROP command and fallback move both use drag-drop-service; insertion uses insertion-service.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Command packs and mutation gateways in place; ARCH-01/ARCH-02 satisfied.
- Ready for 05-03 (rendering boundary or remaining refactor).

## Self-Check: PASSED

- FOUND: `.planning/phases/05-architecture-refactor/05-02-SUMMARY.md`
- FOUND: `b310528c`, `26cec7ff`, `5aacb1c3` in git history

---
*Phase: 05-architecture-refactor*
*Completed: 2026-02-26*
