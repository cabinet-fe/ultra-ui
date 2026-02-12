# Pitfalls Research

**Domain:** Expression editor refactor (Vue + Lexical, brownfield)
**Milestone:** v0.5.0 重构表达式组件
**Researched:** 2025-02-12
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Selection State Lost During modelValue Sync

**What goes wrong:**
Cursor jumps to start or disappears when parent updates `modelValue` while the user is typing, or when the `watchEffect` in `use-editor` calls `renderModelValue()` and does `root.clear()` + full rebuild. Lexical does not preserve DOM selection by default during programmatic updates.

**Why it happens:**
`renderModelValue()` rebuilds the entire editor state from the serialized string. There is no `SKIP_DOM_SELECTION_TAG` or selection restoration logic. The `changeByUser` flag can race with parent reactivity: if the parent updates `modelValue` in the same tick or next tick (e.g. form validation, computed derivation), `changeByUser` may already be false and `renderModelValue` overwrites user input and resets selection.

**How to avoid:**
- Use Lexical's `editor.update()` with `SKIP_DOM_SELECTION_TAG` when performing programmatic updates that should not affect focus.
- Ensure `changeByUser` remains true long enough to cover all synchronous and one-tick parent updates (e.g. use `flush: 'post'` or a short delay before clearing).
- Before calling `renderModelValue`, verify that `modelValue` actually differs from `editor.getEditorState().read(() => $getRoot().getTextContent())` to avoid redundant rewrites.

**Warning signs:**
- Cursor jumps to start when typing in forms with validation.
- Focus lost when switching tabs or when parent re-renders.
- Intermittent "my input disappeared" reports.

**Phase to address:**
Refactor phase (use-editor / model sync) — must be fixed before any visual or UX polish that touches the input flow.

**Verification:**
- Type in editor while parent has `watch(modelValue, ...)` that updates modelValue.
- Switch focus away and back; verify cursor position preserved.
- Use IME (Chinese/Japanese) and confirm composition is not interrupted by model sync.

---

### Pitfall 2: changeByUser / changeByModel Race Condition

**What goes wrong:**
User types, `emit('update:modelValue', text)` fires, `changeByUser = true` is set. In `nextTick`, `changeByUser = false`. If the parent's `v-model` handler or a watcher updates `modelValue` (e.g. trimming, sanitization, or a derived value) before or in the same tick, `watchEffect` runs again. When `changeByUser` is already false, `renderModelValue()` runs and overwrites the user's in-progress input.

**Why it happens:**
The guard relies on a single `nextTick` to clear `changeByUser`. Vue's reactivity and parent component updates can run in the same or subsequent microtask, causing the watcher to see stale or cleared flags.

**How to avoid:**
- Use a more robust guard: e.g. compare `modelValue` with the last emitted value and skip `renderModelValue` when they match (user change just propagated).
- Or: defer clearing `changeByUser` until after confirming no parent update is pending (e.g. shallow compare or use a short `requestAnimationFrame`).
- Document that consumers should not synchronously mutate `modelValue` in response to `update:modelValue` when the same value is being written.

**Warning signs:**
- Characters disappear mid-typing.
- Last character gets dropped occasionally.
- Behavior differs between simple v-model and custom handlers.

**Phase to address:**
Refactor phase (use-editor) — core to stability.

**Verification:**
- Wrap `v-model` with a handler that trims or transforms on input; type normally and verify no loss.
- Add a `watch` on modelValue that writes back a modified value; ensure no overwrite loop.

---

### Pitfall 3: IME Composition Interrupted

**What goes wrong:**
With Chinese, Japanese, Korean, or other IME input, the composition buffer can be committed prematurely or lost. Korean IME on iOS does not emit `compositionstart`/`compositionend`; it uses `beforeinput` with `insertText`/`deleteContentBackward`. Replacing large selections with composed text (e.g. Arabic) can produce empty blocks. Lexical has known issues in this area (e.g. [facebook/lexical#5841](https://github.com/facebook/lexical/issues/5841)).

**Why it happens:**
Programmatic updates (e.g. `renderModelValue`, variable insertion) or command handlers that call `selection.insertText()` during an active composition can interfere. Custom handlers that `preventDefault` on key events without checking `event.isComposing` break IME.

**How to avoid:**
- Never `preventDefault` on `keydown`/`keypress` without checking `event.isComposing` first.
- Avoid calling `editor.update()` or mutating selection during composition; defer until `compositionend` if needed.
- Reuse Lexical's built-in `CONTROLLED_TEXT_INSERTION_COMMAND` for input; do not bypass it with custom input handlers.
- For iOS Korean: rely on Lexical's existing `beforeinput` handling; avoid adding handlers that block it.

**Warning signs:**
- First character of IME input appears then disappears.
- Composing produces wrong or empty result.
- Korean users on iOS report broken input.

**Phase to address:**
Refactor phase (plain-text, use-context) — any keyboard/input refactor must preserve IME behavior.

**Verification:**
- Type Chinese (Pinyin), Japanese (IME), Korean on iOS; verify full composition cycle works.
- Use Arabic IME to replace a selection; verify correct insertion.

---

### Pitfall 4: Drag/Drop Half-Implementation or Wrong Abstraction

**What goes wrong:**
Currently `DROP_COMMAND` and `DRAGSTART_COMMAND` only `preventDefault` and return true. If you implement drop but not drag-start (or vice versa), or implement text drop but not variable-node-aware logic, users get inconsistent behavior: sometimes default browser behavior, sometimes custom, sometimes nothing.

**Why it happens:**
Lexical's command system requires both drag and drop to be handled; custom `VariableNode` may need different serialization than plain text. Implementing one side without the other leaves the system in an undefined state.

**How to avoid:**
- For v0.5.0: either implement both drag and drop fully, or document as unsupported and avoid `preventDefault` so users get native behavior.
- If implementing: use `$insertDataTransferForPlainText(event.dataTransfer, selection)` for drop (mirror paste logic). For drag-start, use `$getClipboardDataFromSelection` and `setLexicalClipboardDataTransfer` to populate `dataTransfer`.
- Ensure `VariableNode` serialization is consistent for clipboard/drag so `{foo}` format is preserved.

**Warning signs:**
- Drag from editor works but drop does not (or vice versa).
- Dropped content appears as raw text instead of parsed variables.
- Drag/drop works in one browser but not another.

**Phase to address:**
UX improvement phase — explicitly either implement or document non-support.

**Verification:**
- Drag text from editor, drop into editor; verify correct insertion.
- Drag `{variable}` from editor, drop elsewhere; verify format preserved.
- Drag external text/files; verify expected behavior or clear error state.

---

### Pitfall 5: Command Priority Conflicts

**What goes wrong:**
`use-context` registers `KEY_ENTER_COMMAND`, `KEY_ESCAPE_COMMAND`, `KEY_ARROW_UP_COMMAND`, `KEY_ARROW_DOWN_COMMAND` at `COMMAND_PRIORITY_LOW` to intercept when the variable picker is open. `plain-text` registers the same commands at `COMMAND_PRIORITY_EDITOR`. Refactoring or adding new plugins (e.g. for shortcuts) can introduce handlers at the wrong priority, causing Enter to both submit variable and insert newline, or arrow keys to both navigate picker and move cursor.

**Why it happens:**
Lexical's command system is priority-based; first handler to return `true` wins. Adding handlers without checking existing ones, or changing registration order, can break the intended behavior.

**How to avoid:**
- Document command priority usage: `COMMAND_PRIORITY_LOW` for context menu interception, `COMMAND_PRIORITY_EDITOR` for core editing.
- Before adding new command handlers, search for existing registrations of the same command.
- When refactoring, run variable picker tests: open with `@`, navigate with arrows, select with Enter, cancel with Escape.

**Warning signs:**
- Enter inserts newline when picker is open.
- Arrow keys move cursor when picker is open instead of navigating list.
- ESC closes picker but also triggers another behavior (e.g. parent modal).

**Phase to address:**
Refactor phase (use-context, plain-text) — any modularization of command handlers must preserve priority.

**Verification:**
- Open variable picker, use all documented shortcuts; verify no regressions.
- Add a hypothetical "save on Ctrl+S" handler; ensure it does not block picker keys.

---

### Pitfall 6: Vue Reactivity Triggers Caret Jump

**What goes wrong:**
Parent re-renders (e.g. when `variables` or `disabled` changes) cause the `contenteditable` container to be replaced or its children to change. Vue re-renders can reset the DOM, and the caret defaults to the start of the contenteditable (especially in Safari/Firefox). Even if the container is stable, `v-if="showPlaceholder"` toggling can cause layout shift and focus issues.

**Why it happens:**
Vue's reactivity drives re-renders. If the container `ref` or its parent is recreated, `editor.setRootElement(container.value)` gets a new element and Lexical may re-mount, losing cursor. Placeholder visibility depends on `modelValue`; rapid typing can toggle it and cause layout thrash.

**How to avoid:**
- Keep the editor container in a stable DOM position; avoid `v-if` on the container itself.
- Use `v-show` for placeholder instead of `v-if` to avoid DOM removal, or position placeholder so it does not affect layout of the editable region.
- Ensure `container` ref is not recreated on parent updates (e.g. avoid conditional rendering around the container).

**Warning signs:**
- Caret jumps when `variables` prop updates.
- Focus lost when switching `disabled` or `readonly`.
- Placeholder flicker during typing.

**Phase to address:**
Visual polish phase — template and layout changes must not destabilize the container.

**Verification:**
- Update `variables` while focused; verify no jump.
- Toggle `disabled`/`readonly` while focused; verify behavior.
- Type until placeholder hides; verify smooth transition.

---

### Pitfall 7: Backward Compatibility Break on Serialization Format

**What goes wrong:**
The expression format `{variable}` is the public contract. Consumers store expressions in DB, configs, or URLs. If parsing or serialization changes (e.g. different delimiter, escaping, or variable representation), existing data becomes invalid and expressions break silently.

**Why it happens:**
Refactors often tighten parsing (e.g. stricter regex, different escaping) or change internal representation. Without explicit compatibility tests, changes can ship that break old data.

**How to avoid:**
- Treat `/\{([^}]+)\}/g` and the emitted string format as a stable API. Document it.
- Add tests with stored expressions from "old" format; run before/after refactor.
- Any format change must be opt-in (e.g. new prop) or come with a migration path.

**Warning signs:**
- Expressions with `{` or `}` in labels/value break.
- Nested or escaped variables behave differently.
- Stored expressions from before refactor no longer render correctly.

**Phase to address:**
Refactor phase — parser and serialization changes must be compatibility-checked.

**Verification:**
- Test expressions: `{a}`, `{a.b}`, `{a.b.c}`, `hello{form.user.name}world`.
- Test edge cases: `{}`, `{ }`, `{{`, `}}`.
- Load persisted expressions from a fixture; verify round-trip.

---

### Pitfall 8: Variable Insertion Corrupts State (Stale textNode/charPosition)

**What goes wrong:**
When the user selects a variable from the picker, `handleVariableSelect` uses `textNode` and `charPosition` from `useContext`. If the user moved the cursor or edited text between opening the picker and selecting, `textNode` or `charPosition` can be stale. The `replace`/`insertAfter` logic then operates on the wrong node, corrupting content or causing duplicates.

**Why it happens:**
`SELECTION_CHANGE_COMMAND` updates `textNode` and `charPosition` when the cursor is at `@`. But between open and select, the user can click elsewhere or type. The refs are not revalidated at selection time.

**How to avoid:**
- At selection time, re-read selection from editor: `$getSelection()`, verify cursor is still in the expected text node and at/near `@`.
- If selection has moved, either abort insertion or recompute the insertion point from current selection.
- Consider storing a stable reference (e.g. node key + offset) and validating before mutate.

**Warning signs:**
- Variable inserted in wrong position.
- Text before or after `@` is duplicated or lost.
- Intermittent corruption when selecting quickly.

**Phase to address:**
Refactor phase (expression-editor.vue, use-context) — variable insertion flow.

**Verification:**
- Open picker at `@`, move cursor with mouse, select variable; verify insertion point.
- Open picker, type more text, select variable; verify correct replacement of `@` context.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| preventDefault on DROP/DRAGSTART without implementation | Avoids browser default drag | Users expect no drag/drop; confusion | Never — either implement or allow native |
| Using `nextTick` alone for changeByUser guard | Simple, few lines | Race with parent updates | Only if parent never syncs back |
| Commented-out arrow key override in plain-text | Defers work | Inconsistent behavior vs rich editor | Until explicitly implemented |
| Console.error for Lexical onError | Quick debugging | No structured error handling | MVP only; add configurable handler |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Vue `v-model` | Parent transforms modelValue synchronously | Avoid transforming in same tick; use `watch` with { flush: 'post' } if needed |
| Form validation | Validation updates modelValue on blur | Ensure changeByUser covers blur-triggered updates; or validate only on submit |
| Lexical `editor.update()` | Calling during composition | Check `isComposing`; defer until compositionend |
| Teleport (Decorators) | Assuming refs are stable across Teleport | VariableNode DOM may change; use `editor.getElementByKey()` for positioning |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| watchEffect on modelValue without equality check | Full re-parse on every modelValue change | Compare with current editor state; skip if equal | Parent emits frequently (e.g. debounced save) |
| variables in renderModelValue dependency | Re-parse when variables change | Only re-parse when modelValue changes; variables used inside parseContent | Large variable lists, frequent prop updates |
| Re-creating editor on container change | Cursor and state loss | Stabilize container ref; avoid conditional render around it | Tab switching, dynamic forms |

## Vue/Reactivity Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Reacting to modelValue and writing back | Input loss, cursor jump | Unidirectional: editor → model; external updates only when user is not editing |
| v-if on placeholder | Layout shift, focus loss | v-show or overlay that does not affect editable layout |
| Computed that depends on modelValue and triggers re-render | Caret jump | Decouple; use manual DOM updates where reactivity would harm focus |

## "Looks Done But Isn't" Checklist

- [ ] **modelValue sync:** Often missing selection preservation — verify cursor stays after external modelValue update
- [ ] **Variable picker:** Often missing revalidation of textNode/charPosition at selection — verify insertion when cursor moved after opening
- [ ] **Drag/drop:** Often missing either drag or drop side — verify both same-editor and cross-editor scenarios
- [ ] **IME:** Often missing composition check in preventDefault — verify Chinese/Japanese/Korean input
- [ ] **Command priorities:** Often missing test with picker open — verify Enter/Arrow/ESC behavior
- [ ] **Backward compatibility:** Often missing fixture tests for stored expressions — verify round-trip with old format

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Selection lost during sync | MEDIUM | Add SKIP_DOM_SELECTION_TAG, store/restore selection in update, strengthen changeByUser guard |
| changeByUser race | LOW | Add equality check before renderModelValue; extend guard window |
| IME broken | HIGH | Audit all preventDefault; add isComposing checks; test on target platforms |
| Drag/drop inconsistent | MEDIUM | Decide: full impl or remove preventDefault; implement both sides if doing custom |
| Priority conflicts | LOW | Document and fix registration order; add integration tests |
| Caret jump from Vue | MEDIUM | Stabilize container; switch v-if to v-show for placeholder |
| Serialization break | HIGH | Version format; provide migration or compatibility parse |
| Stale variable insertion | MEDIUM | Revalidate selection at insertion; add tests for cursor-moved case |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|---------------|
| Selection state lost | Refactor (use-editor) | Type in form; external modelValue update; no jump |
| changeByUser race | Refactor (use-editor) | Parent transform on input; no overwrite |
| IME interrupted | Refactor (plain-text, use-context) | IME input on Zh/Ja/Ko; no corruption |
| Drag/drop half-impl | UX improvement | Full drag+drop or explicit non-support |
| Command priority | Refactor (use-context) | Picker open + all shortcuts |
| Vue reactivity caret jump | Visual polish | variables/disabled update; no jump |
| Serialization break | Refactor (parser) | Fixture round-trip; edge cases |
| Stale variable insertion | Refactor (variable picker) | Move cursor then select; correct position |

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Visual polish | Caret jump, layout shift | Avoid re-mounting container; use v-show for placeholder |
| UX improvement | Drag/drop half-done | Implement both sides or document non-support |
| Modular refactor | Command priority, state races | Extract handlers with clear priority; add integration tests |
| Stability fixes | IME, changeByUser, selection | Add isComposing checks; strengthen sync guard; use Lexical tags |

## Sources

- [Lexical Design](https://lexical.dev/docs/design) — update mechanism, tags
- [Lexical Clipboard API](https://lexical.dev/docs/api/modules/lexical_clipboard) — $insertDataTransferForPlainText
- [Lexical GitHub #5841](https://github.com/facebook/lexical/issues/5841) — Korean IME on iOS
- [Lexical GitHub #4326](https://github.com/facebook/lexical/issues/4326) — IME composition with large selections
- [ContentEditable Vue cursor jump](https://jessieji.com/2022/contenteditable-vue) — Vue reactivity and contenteditable
- [VueUse useTextSelection](https://vueuse.org/core/usetextselection/) — selection tracking patterns
- Ultra UI CONCERNS.md — expression-editor drag-drop, tech debt
- Ultra UI codebase — use-editor, use-context, plain-text, expression-editor.vue
- Ultra UI plan.md — Lexical-based expression editor design

---
*Pitfalls research for: Expression editor refactor (v0.5.0)*
*Researched: 2025-02-12*
