---
phase: 02-input-stability
plan: 03
subsystem: ui
tags: [lexical, parser, expression-editor, vitest]

# Dependency graph
requires: []
provides:
  - parseContent trailing text and no-match handling
  - Parser fixture tests for format round-trip
affects: [expression-editor, 02-input-stability]

# Tech tracking
tech-stack:
  added: []
  patterns: [Lexical editor.update() for parse/serialize in tests, UTag mock for vitest]

key-files:
  created: [ui/components/expression-editor/__test__/parser.test.ts]
  modified: [ui/components/expression-editor/parser.ts]

key-decisions:
  - "parseContent must run inside editor.update() (Lexical requires active editor)"
  - "serialize via getTextContent() must also run inside update callback"
  - "Mock UTag to avoid Vue plugin dependency in vitest"

patterns-established:
  - "Parser round-trip: parseInEditor + serializeNodes inside editor.update()"
  - "vitest mock for ../../tag (Vue component) when testing Lexical nodes"

# Metrics
duration: ~15min
completed: 2026-02-12
---

# Phase 02 Plan 03: Parser Trailing Text and Round-Trip Tests Summary

**parseContent preserves text after last {variable} and plain text; fixture tests verify format round-trip.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-02-12T09:17:56Z
- **Completed:** 2026-02-12T09:33:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Parser trailing-text bug fixed: text after last `{variable}` is appended as TextNode
- No-match case handled: plain text without variables produces single TextNode
- Five fixture tests for parseContent round-trip (`hello{foo}world`, `{a}`, `hello`, `{a}{b}`, `prefix{a}suffix`)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix parser trailing text and no-match case** - `e01fde22` (feat)
2. **Task 2: Add parser fixture tests** - `f17c8320` (docs - test file bundled with plan summary)

## Files Created/Modified

- `ui/components/expression-editor/parser.ts` - Added post-loop tail append and no-match handling
- `ui/components/expression-editor/__test__/parser.test.ts` - serializeNodes helper, parseAndSerialize, 5 round-trip tests

## Decisions Made

- Run parseContent and serializeNodes inside editor.update() because Lexical nodes require active editor state
- Mock UTag (../../tag) in vitest to avoid @vitejs/plugin-vue for parser-only tests
- Use createEditor with VariableNode for minimal test setup

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Lexical requires editor context for node creation**
- **Found during:** Task 2 (parser fixture tests)
- **Issue:** $createTextNode and getTextContent() require active editor.update() or editor.read() callback
- **Fix:** Wrapped parseContent and serializeNodes in parseAndSerialize() using createEditor + editor.update()
- **Files modified:** ui/components/expression-editor/__test__/parser.test.ts
- **Verification:** All 5 tests pass
- **Committed in:** f17c8320

**2. [Rule 3 - Blocking] Vitest cannot parse Vue SFC without plugin**
- **Found during:** Task 2 (import chain through variable-node → UTag)
- **Issue:** variable-node imports UTag from tag.vue; vite import analysis fails on .vue
- **Fix:** vi.mock('../../tag') returning () => null
- **Files modified:** ui/components/expression-editor/__test__/parser.test.ts
- **Verification:** Tests run without @vitejs/plugin-vue
- **Committed in:** f17c8320

---

**Total deviations:** 2 auto-fixed (both blocking)
**Impact on plan:** Necessary for tests to run. No scope creep.

## Issues Encountered

None beyond the deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- STAB-03 satisfied: {variable} expressions parse, edit, and serialize correctly
- Parser handles trailing text and no-match; fixture tests cover round-trip
- Ready for remaining 02-input-stability plans (02-01, 02-02 if not yet done)

## Self-Check: PASSED

- 02-03-SUMMARY.md: FOUND
- parser.ts: FOUND
- parser.test.ts: FOUND
- e01fde22 (Task 1): FOUND
- f17c8320 (Task 2): FOUND

---
*Phase: 02-input-stability*
*Completed: 2026-02-12*
