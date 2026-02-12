# Phase 3: Variable Picker Interaction - Research

**Researched:** 2026-02-12
**Domain:** Lexical expression editor, @ trigger, variable picker keyboard UX
**Confidence:** HIGH

## Summary

Phase 3 addresses two UX requirements: (1) Trigger variable picker with `@` and insert variables without interrupting typing flow (UX-01); (2) Navigate and select with ArrowUp/ArrowDown/Enter/Escape predictably (UX-02). The codebase already has `use-context.ts` (SELECTION_CHANGE_COMMAND for @ detection), `variable-picker.vue` (keyboard handler via document listener), and `expression-editor.vue` (handleVariableSelect). The main fix is **command-to-picker wiring**: use-context uses COMMAND_PRIORITY_LOW (1) and plain-text uses COMMAND_PRIORITY_EDITOR (0). In Lexical, higher number runs first, so use-context already intercepts before plain-text. However, use-context only calls `preventDefault()` and returns true—it does not invoke the variable-picker's key handler. When focus is in the editor, the variable-picker's document listener may not receive the keydown (Lexical may consume the event). Result: keys are intercepted (no newline) but picker navigation/selection never runs. A secondary gap: when focus is in the editor, the variable-picker's document listener may not receive keydown (Lexical may consume the event). The fix is to raise use-context to COMMAND_PRIORITY_CRITICAL and wire Lexical command interception to the variable-picker's key logic when focus is in the editor.

**Primary recommendation:** Wire Lexical command interception to variable-picker's handleKeydown when contextVisible (use-context already intercepts at LOW > EDITOR; add callback invocation); retain document listener for when focus is in picker's search input; validate textNode/charPosition at selection time (Pitfall 8).

<user_constraints>

## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for this phase. All areas are at Claude's discretion.

</user_constraints>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lexical | ^0.40.0 | Editor engine, commands, selection | Expression editor already uses it |
| Vue 3 | ^3.5.27 | Composition API, reactivity | Parent framework |
| @lexical/utils | ^0.40.0 | mergeRegister | Already in use |

### Supporting

| Module | Purpose | When to Use |
|--------|---------|-------------|
| use-context.ts | @ trigger detection, picker state | SELECTION_CHANGE_COMMAND, KEY_*_COMMAND for picker keys |
| variable-picker.vue | Variable selection UI, keyboard nav | handleKeydown, activeIndex, currentList |
| plain-text.ts | Core editing commands | KEY_ENTER_COMMAND, etc. at COMMAND_PRIORITY_EDITOR |
| expression-editor.vue | handleVariableSelect | Variable insertion via editor.update |

### No New Packages

Phase 3 refines existing command and event flow. No new dependencies.

---

## Architecture Patterns

### Current @ Trigger Flow

```
User types '@' → SELECTION_CHANGE_COMMAND fires
    → use-context: cursor at '@' → openContextMenu, textNode/charPosition set
    → VariablePicker visible (UTip), triggerDom = cursor element
```

### Current Keyboard Flow (Broken When Focus in Editor)

```
User presses Enter (focus in editor, picker open)
    → Lexical dispatches KEY_ENTER_COMMAND
    → use-context (COMMAND_PRIORITY_LOW = 1) runs first, contextVisible true
    → preventDefault(), return true — command handled, plain-text never runs
    → BUT: use-context does NOT call variable-picker's handleKeydown
    → Document listener may not receive event (Lexical consumed it)
    → Picker selection never runs; user gets no feedback
```

### Pattern 1: Lexical Command + Callback for Picker Keys

**What:** Picker-related keys (Enter, Escape, ArrowUp, ArrowDown) are intercepted by use-context (COMMAND_PRIORITY_LOW = 1 runs before plain-text's EDITOR = 0). When intercepting, use-context must invoke the variable-picker's key handler; otherwise the picker never receives the event (Lexical consumes it, document listener may not fire).

**When to use:** Any overlay/menu that should consume these keys when open (variable picker, typeahead, etc.).

**Example:**

```typescript
// Source: LexicalEditor.ts — COMMAND_PRIORITY_EDITOR=0, COMMAND_PRIORITY_LOW=1
// Higher number = runs first. use-context at LOW intercepts before plain-text at EDITOR.
import { COMMAND_PRIORITY_LOW } from 'lexical'

editor.registerCommand(
  KEY_ENTER_COMMAND,
  (event) => {
    if (event?.isComposing) return false
    if (contextVisible.value) {
      event?.preventDefault()
      pickerKeyHandlerRef.current?.(event)
      return true
    }
    return false
  },
  COMMAND_PRIORITY_LOW
)
```

### Pattern 2: Dual Path for Picker Keys

**What:** Picker keys can originate from (a) editor focus — Lexical commands; (b) picker search input focus — DOM keydown bubbles to document. Both paths must invoke the same key handler.

**When to use:** Variable picker with filterable search; any dropdown that can have focus in editor or in an input inside the overlay.

**Example:**

```typescript
// variable-picker: register handler with use-context when picker mounts
onMounted(() => {
  registerPickerKeyHandler(handleKeydown)
})
onBeforeUnmount(() => {
  registerPickerKeyHandler(null)
})

// document listener still needed for when focus is in picker's u-input
watch(() => props.visible, v => {
  if (v) document.addEventListener('keydown', handleKeydown)
  else document.removeEventListener('keydown', handleKeydown)
})
```

### Pattern 3: Stale textNode/charPosition Revalidation (Pitfall 8)

**What:** When selecting a variable, re-read selection from editor and verify cursor is still at/near `@` before mutating. Stale refs cause wrong insertion or corruption.

**When to use:** handleVariableSelect or any insertion that uses textNode/charPosition.

**Example:**

```typescript
// Source: PITFALLS.md, 02-RESEARCH.md
editor.update(() => {
  const targetNode = $getNodeByKey(nodeKey)
  if (!targetNode) return
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return
  const focusNode = selection.focus.getNode()
  if (focusNode.getKey() !== targetNode.getKey()) return
  const textContent = targetNode.getTextContent()
  if (!textContent?.includes('@')) return
  // ... proceed with insertion
})
```

### Anti-Patterns to Avoid

- **Intercepting without invoking picker handler:** use-context preventDefault alone leaves picker with no key event; wire callback.
- **Document listener only when focus can be in editor:** Lexical may consume keydown; document listener may not receive event when focus is in contenteditable.
- **Using textNode/charPosition without revalidation:** User can move cursor between open and select; stale refs corrupt content.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Key interception + handler | preventDefault only | Lexical command + callback invocation | Document listener may not receive event when focus in editor |
| @ trigger detection | Custom contenteditable listeners | SELECTION_CHANGE_COMMAND | Lexical's selection model is authoritative |
| Variable insertion | Manual DOM manipulation | editor.update + $createVariableNode | Lexical maintains consistency |

**Key insight:** Lexical's command system is the canonical way to intercept keys. Document listeners are a fallback for input focus inside overlays.

---

## Common Pitfalls

### Pitfall 1: Intercept Without Invoke (Picker Keys Consumed, No Action)

**What goes wrong:** User opens picker with `@`, presses Enter. No newline (good) but variable is not selected. ArrowUp/ArrowDown neither move cursor nor navigate list—keys are swallowed with no effect.

**Why it happens:** use-context intercepts at COMMAND_PRIORITY_LOW (1) before plain-text (0), calls preventDefault, returns true. But it does not call the variable-picker's handleKeydown. When focus is in the editor, the document listener may not receive the event (Lexical consumes it), so the picker never performs navigation/selection.

**How to avoid:** When use-context intercepts, invoke a registered callback (variable-picker's handleKeydown) so the picker's key logic runs regardless of event propagation.

**Warning signs:** Enter/Arrows do nothing when picker is open and focus is in editor.

### Pitfall 2: Document Listener Misses Event When Focus in Editor

**What goes wrong:** Picker keyboard nav works when focus is in the search input, but not when focus is in the editor.

**Why it happens:** Lexical attaches to the contenteditable root. When keydown fires, Lexical's handler may run and the event may not bubble to document (or the command is handled before our document listener can react). The variable-picker's document listener is added in bubble phase; if Lexical stops propagation or the command path consumes the key first, the document listener never sees it.

**How to avoid:** Handle picker keys via Lexical commands at CRITICAL priority. When use-context intercepts, call the variable-picker's key handler (e.g. via a registered callback). Keep document listener for when focus is in picker's u-input.

**Warning signs:** Keyboard nav works in search box but not when typing in editor.

### Pitfall 3: Stale textNode/charPosition on Variable Insertion

**What goes wrong:** User opens picker at `@`, moves cursor, selects variable. Variable inserted in wrong position or content corrupted.

**Why it happens:** handleVariableSelect uses textNode and charPosition from useContext. These are set when cursor is at `@`; they are not revalidated at selection time.

**How to avoid:** In handleVariableSelect, re-read $getSelection(), verify focus is still in the expected text node and at/near `@`. Abort or recompute insertion point if selection moved.

**Warning signs:** Variable appears in wrong place; text duplicated or lost.

### Pitfall 4: IME Composition During Picker Keys

**What goes wrong:** User composing IME (e.g. Chinese); presses Enter to select. IME breaks or behaves unexpectedly.

**Why it happens:** Handlers call preventDefault without checking event.isComposing.

**How to avoid:** Keep `if (event.isComposing) return false` at top of PreventDefaultListener and any picker key handler that receives the raw event.

**Warning signs:** First character of IME input corrupts; composition produces wrong result.

---

## Code Examples

### use-context: Invoke Picker Handler When Intercepting

```typescript
// Source: LexicalEditor.ts, PITFALLS.md
// use-context already uses COMMAND_PRIORITY_LOW (1) > plain-text EDITOR (0)
editor.registerCommand(
  KEY_ENTER_COMMAND,
  (event) => {
    if (event?.isComposing) return false
    if (contextVisible.value) {
      event?.preventDefault()
      pickerKeyHandlerRef.current?.(event)
      return true
    }
    return false
  },
  COMMAND_PRIORITY_LOW
)
```

### Variable Picker: Register Handler with use-context

```typescript
// variable-picker.vue or expression-editor.vue
const { registerPickerKeyHandler } = useContext(editor)

onMounted(() => {
  registerPickerKeyHandler(handleKeydown)
})
onBeforeUnmount(() => {
  registerPickerKeyHandler(null)
})
```

### handleVariableSelect: Revalidate Selection

```typescript
// expression-editor.vue
editor.update(() => {
  const targetNode = $getNodeByKey(nodeKey)
  if (!targetNode) return
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return
  const focusNode = selection.focus.getNode()
  if (focusNode.getKey() !== targetNode.getKey()) return
  const textContent = targetNode.getTextContent()
  if (!textContent?.includes('@')) return
  const pos = charPosition.value
  // ... create and insert nodes
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| preventDefault only | preventDefault + callback invocation | Phase 3 | Picker receives key when focus in editor |
| Document listener only | Lexical commands + document listener | Phase 3 | Reliable when focus in editor or picker |

**Deprecated/outdated:**
- None. Lexical 0.40 and Vue 3 patterns are current.

---

## Open Questions

1. **Lexical event propagation**
   - What we know: Lexical dispatches commands from key events; handler return value stops command propagation.
   - What's unclear: Whether keydown bubbles to document after Lexical handles it. May vary by browser.
   - Recommendation: Rely on Lexical command path for editor focus; keep document listener for picker input focus.

2. **Lexical priority values (verified)**
   - Source: LexicalEditor.ts. COMMAND_PRIORITY_EDITOR=0, COMMAND_PRIORITY_LOW=1, COMMAND_PRIORITY_NORMAL=2, COMMAND_PRIORITY_HIGH=3, COMMAND_PRIORITY_CRITICAL=4. Higher number runs first.
   - use-context (LOW=1) already runs before plain-text (EDITOR=0). No priority change needed.

---

## Sources

### Primary (HIGH confidence)

- Lexical LexicalEditor.ts — COMMAND_PRIORITY_EDITOR=0, COMMAND_PRIORITY_LOW=1 (higher number runs first)
- Lexical Commands — https://lexical.dev/docs/concepts/commands — priority, return true to stop propagation
- Phase 2 RESEARCH — 02-RESEARCH.md — use-context, PreventDefaultListener, isComposing
- PITFALLS.md — Pitfall 5 (command priority), Pitfall 8 (stale textNode/charPosition)
- Codebase: use-context.ts, variable-picker.vue, expression-editor.vue, plain-text.ts

### Secondary (MEDIUM confidence)

- auto-complete use-keyboard.ts — pattern for ArrowUp/Down/Enter/Escape

### Tertiary (LOW confidence)

- Lexical event propagation to document — not verified; document both paths.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Lexical 0.40, Vue 3 verified in package.json
- Architecture: HIGH — use-context, variable-picker, plain-text inspected; priority order verified
- Pitfalls: HIGH — PITFALLS.md, Phase 2 research, codebase analysis

**Research date:** 2026-02-12
**Valid until:** 30 days (stable stack)
