---
phase: 01-visual-foundation
plan: 01
subsystem: ui
tags: [expression-editor, lexical, design-tokens, variable-picker]

# Dependency graph
requires: []
provides:
  - Design-token-based expression editor styling
  - Variable node UTag chip with ellipsis, tooltip, type indicator
  - Variable picker panel with token-based styling
affects: [expression-editor, phase-02]

# Tech tracking
tech-stack:
  added: []
  patterns: [fn.use-var for all colors/spacing, UTag for variable nodes]

key-files:
  created: []
  modified:
    - ui/components/expression-editor/style.scss
    - ui/components/expression-editor/nodes/variable-node.tsx
    - ui/types/components/expression-editor.ts
    - ui/components/expression-editor/expression-editor.vue
    - ui/components/expression-editor/use-context.ts

key-decisions:
  - "charPosition must represent index of first char after '@' for correct slice in handleVariableSelect"
  - "Use $getNodeByKey to get fresh node from current state before replace; abort if node not found"

patterns-established:
  - "Variable insertion: validate node via $getNodeByKey before mutating; ensures correct behavior after blur"

# Metrics
duration: ~45min
completed: 2026-02-12
---

# Phase 01 Plan 01: Visual Foundation Summary

**Design-token-based expression editor with variable chip/tag nodes, elevated picker panel, and fixed variable insertion flow**

## Performance

- **Duration:** ~45 min
- **Tasks:** 4 (3 auto + 1 human-verify)
- **Files modified:** 5

## Accomplishments

- Editor container uses design tokens (fn.use-var); no default shadow; instant state transitions
- Variable nodes use UTag exclusively; ellipsis + tooltip for long names; optional type indicator
- Picker panel uses design tokens; elevated, non-flickering presentation
- Variable insertion fixed: selecting variable from picker now correctly replaces '@' with variable node

## Task Commits

1. **Task 1: Editor container and state feedback** - `9901a8ec` (feat)
2. **Task 2: Variable node styling and type indicator** - `a39a8571` (feat)
3. **Task 3: Variable picker panel design tokens** - `000b92b3` (feat)
4. **Task 4: Visual verification** - checkpoint:human-verify (user reported issue → fix)
5. **Post-checkpoint fix** - `9eba0e0d` (fix)

## Files Created/Modified

- `ui/components/expression-editor/style.scss` - Design tokens for block, states, picker
- `ui/components/expression-editor/nodes/variable-node.tsx` - UTag chip, type indicator
- `ui/types/components/expression-editor.ts` - VariableItem.type optional
- `ui/components/expression-editor/expression-editor.vue` - handleVariableSelect fix, $getNodeByKey
- `ui/components/expression-editor/use-context.ts` - charPosition logic fix

## Decisions Made

- charPosition semantics: index of first character after '@' (for slice in handleVariableSelect)
- Use $getNodeByKey to resolve node from current editor state; abort if node not found (stale ref after blur)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Variable insertion failed after picker selection**
- **Found during:** Task 4 (human-verify checkpoint; user reported)
- **Issue:** After selecting a variable from the picker, nothing happened — only '@' remained. Root cause: charPosition was inverted in use-context. When cursor is after '@', charPosition was set to cursorPosition+1 instead of cursorPosition, causing nodeBefore to include '@' and nodeAfter to be wrong.
- **Fix:** Corrected charPosition logic: `charPosition = isAtTriggerRight ? cursorPosition : cursorPosition + 1`. Added $getNodeByKey to get fresh node from current state; abort if node not found. Added textContent.includes('@') validation.
- **Files modified:** ui/components/expression-editor/expression-editor.vue, ui/components/expression-editor/use-context.ts
- **Verification:** Build passes; logic verified against slice math
- **Committed in:** 9eba0e0d

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix essential for variable insertion correctness. No scope creep.

## Issues Encountered

None beyond the deviation above.

## User Setup Required

None - no external service configuration required.

## Re-verification Steps

1. Start sample app: `cd sample && bun run play`
2. Navigate to expression-editor demo page
3. Clear the editor, type `@`
4. Use mouse or keyboard to select a variable (e.g. 表单数据 → 用户信息 → 姓名)
5. **Expected:** Variable chip appears, '@' is replaced; expression shows `{form.user.name}`

## Next Phase Readiness

- Visual foundation complete; variable insertion flow working
- Ready for Phase 02 (stability, picker enhancements)

---
*Phase: 01-visual-foundation*
*Completed: 2026-02-12*
