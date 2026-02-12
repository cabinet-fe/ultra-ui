# Codebase Concerns

**Analysis Date:** 2025-02-12

## Tech Debt

**setStyles / style utilities:**
- Issue: `setStyles` in `ui/utils/dom/style.ts` uses `el.style[key] = styles[key]` which can fail in some cases (e.g., Tabs overflow). A commented-out `attributeStyleMap` approach was reverted due to other issues.
- Files: `ui/utils/dom/style.ts` (lines 26–45)
- Impact: Style properties may not apply correctly in edge cases (e.g., overflow in Tabs).
- Fix approach: Investigate failure cases (e.g., Tabs overflow), fix `attributeStyleMap` approach if needed, or add a fallback for problematic properties.

**TableRowNode parameters:**
- Issue: Object literal parameters for `TableRowNode` add memory overhead for large datasets.
- Files: `ui/components/table/node/row.ts` (lines 6, 46–47)
- Impact: Higher memory usage with large tables.
- Fix approach: Use a factory or struct-like parameters to reduce allocation pressure.

**Select userSelecting lock:**
- Issue: `userSelecting` flag pattern in `select.vue` marked as needing optimization.
- Files: `ui/components/select/select.vue` (line 197)
- Impact: Minor; affects watch logic clarity.
- Fix approach: Refactor to a clearer reactive state or explicit lock.

**Tip watch trigger:**
- Issue: `watch(triggerDom, ...)` in `tip.vue` uses `close()` then `nextTick(() => open())` when DOM changes; marked as non-elegant.
- Files: `ui/components/tip/tip.vue` (lines 169–174)
- Impact: Possible flicker or redundant state updates.
- Fix approach: Consider a single update path or debounced reposition logic.

**Expression editor drag-drop:**
- Issue: `DROP_COMMAND` and `DRAGSTART_COMMAND` handlers only prevent default; no actual drag-drop behavior.
- Files: `ui/components/expression-editor/plain-text.ts` (lines 388, 403)
- Impact: Incomplete feature; drag-drop requested but not implemented.
- Fix approach: Implement full drag-drop or clearly document as non-supported.

**useOptions debounced watch:**
- Issue: Debounced watch may have performance issues with large option lists.
- Files: `ui/components/select/use-options.ts` (lines 102, 103–131)
- Impact: Potential lag when filtering many options.
- Fix approach: Profile and consider virtual scrolling or worker-based filtering if needed.

**Highlight algorithm:**
- Issue: Regex-based highlighting in `getHighlightChunks` may be slower than KMP/BM/two-way for some scenarios. Also, `re.test(text)` is used in a loop with a global regex; `RegExp.test` mutates `lastIndex`, which can cause incorrect highlight detection in edge cases.
- Files: `ui/utils/dom/highlight.ts` (lines 1, 24)
- Impact: Performance unknown until benchmarked; highlight detection may be wrong in some multi-chunk cases.
- Fix approach: Use `new RegExp(re.source, re.flags).test(text)` per chunk to avoid lastIndex state; benchmark and consider KMP/BM if needed.

## Known Bugs

**Batch edit row path:**
- Symptoms: "行路径不正确" logged when deleting a row in a parent context where `children` is undefined.
- Files: `ui/components/batch-edit/use-edit.ts` (lines 287–288)
- Trigger: `handleDelete` with a row whose parent has no `children` array.
- Workaround: Ensure parent row always has a `children` array when deleting.

## Security Considerations

**Message v-html:**
- Risk: User-controlled `message` with `html: true` enables XSS.
- Files: `ui/components/message/message.vue` (line 12), `ui/types/components/message.ts` (lines 57–58)
- Current mitigation: No sanitization; `html` must be opt-in.
- Recommendations: Document that `html` must only be used with trusted content; consider adding sanitization (e.g., DOMPurify) for `html` mode or deprecating it.

## Performance Bottlenecks

**Virtualizer getItems:**
- Problem: `getItems()` does linear scan for `startIndex` and `endIndex` (O(n)).
- Files: `ui/compositions/use-virtual/virtualizer.ts` (lines 118–159)
- Cause: No binary search for offset; always iterates from 0.
- Improvement path: Use binary search for large lists; consider memoization of item sizes.

**Table row construction:**
- Problem: Each row creates a new `TableRowNode` with shallow reactivity; object literal options may be heavyweight.
- Files: `ui/components/table/node/row.ts` (lines 46–56)
- Cause: Per-row allocation and reactivity setup.
- Improvement path: See `TableRowNode` tech debt above.

## Fragile Areas

**@ts-ignore:**
- Files: `ui/components/table/use-check.ts` (lines 268, 316), `ui/components/action/action-group.vue` (line 38)
- Why fragile: `createVNode` and `node.type?.name` checks bypass type checks; API changes can break silently.
- Safe modification: Add proper types or generics for VNode/component props; use `node.type?.name` with a type guard.

**as any casts:**
- Files: `ui/components/grid-input/grid-input.vue` (line 72), `ui/components/form/use-node-interceptor.ts` (line 65), `ui/components/theme/theme.vue` (line 506), `ui/components/message/helper.ts` (line 22)
- Why fragile: Weakens type safety; refs and component types may not match.
- Safe modification: Define explicit types for refs and component instances; avoid `as any` where possible.

**console.error / console.warn:**
- Files: `ui/components/batch-edit/use-edit.ts` (lines 222, 288), `ui/compositions/use-config/index.ts` (line 62), `ui/directives/focus/index.ts` (line 12), `ui/compositions/use-component-props/index.ts` (line 35), `ui/compositions/use-lock/index.ts` (line 42), `ui/components/grid/grid-item.vue` (line 26), `ui/components/form/dynamic-form-model.ts` (line 15), `ui/components/card/*.vue` (lines 26–29)
- Why fragile: Logging is mixed with control flow; no centralized error reporting or configurable log levels.
- Safe modification: Introduce a logging facade or optional error handler; use it consistently.

## Scaling Limits

**Record<string, any> usage:**
- Current capacity: ~70+ `Record<string, any>` or `any` usages across `ui/`.
- Limit: Type safety weakens; refactors become harder.
- Scaling path: AGENTS.md says "严格类型定义，不要使用any类型"; progressively replace with proper types.

## Dependencies at Risk

**[Package]:**
- Risk: Not detected.
- Impact: N/A.
- Migration plan: N/A.

## Missing Critical Features

**Expression editor drag-drop:**
- Problem: Drag-drop handlers are stubs; no actual reordering or insertion.
- Blocks: Rich drag-drop UX in expression editor.

## Test Coverage Gaps

**Untested areas:**
- What's not tested: No unit or integration tests found (`*.test.*`, `*.spec.*`).
- Files: All `ui/` components and utilities.
- Risk: Regressions and refactors are harder to verify.
- Priority: High for core components (form, table, select, dialog, etc.).

---

*Concerns audit: 2025-02-12*
