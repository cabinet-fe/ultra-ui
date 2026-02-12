# Phase 2: Input Stability - Research

**Researched:** 2026-02-12
**Domain:** Vue + Lexical model sync, IME composition, expression format compatibility
**Confidence:** HIGH

## Summary

Phase 2 addresses three stability requirements: (1) v-model sync without cursor jump, text loss, or overwrite races; (2) IME composition (Chinese/Japanese/Korean) without interruption or corruption; (3) `{variable}` expression format remaining parseable, editable, and serializable. The codebase already uses Lexical 0.40, Vue 3, and a regex-based parser. The main fixes are strengthening the use-editor sync guard, adding `SKIP_DOM_SELECTION_TAG` for programmatic updates, adding `isComposing` checks in use-context's `PreventDefaultListener`, and fixing the parser's trailing-text bug. No new libraries are required.

**Primary recommendation:** Strengthen use-editor (equality check, lastEmittedValue guard, SKIP_DOM_SELECTION_TAG); add isComposing check to use-context PreventDefaultListener; fix parser trailing-text handling; add fixture tests for format round-trip.

<user_constraints>

## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for this phase. All areas are at Claude's discretion.

</user_constraints>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| lexical | ^0.40.0 | Editor engine, selection, updates | Expression editor already uses it; SKIP_DOM_SELECTION_TAG, update tags |
| Vue 3 | ^3.5.27 | Composition API, reactivity | Parent framework |
| @lexical/utils | ^0.40.0 | mergeRegister, command registration | Already in use |

### Supporting

| Library/Pattern | Purpose | When to Use |
|-----------------|---------|-------------|
| parser.ts | `/\{([^}]+)\}/g` regex, parseContent | Parse modelValue → Lexical nodes |
| VariableNode.getTextContent() | Returns `{variable}` | Serialization via Lexical root.getTextContent() |
| registerTextContentListener | Emit modelValue on change | use-editor already uses it |

### No New Packages

Phase 2 refines existing code paths. No new dependencies.

---

## Architecture Patterns

### Current Model Sync Flow (use-editor.ts)

```
modelValue (prop) → watchEffect → if !changeByUser → renderModelValue()
                                     ↓
                        root.clear() + parseContent() + append nodes
                                     ↓
                        changeByModel = true; nextTick(() => changeByModel = false)

User types → registerTextContentListener → emit('update:modelValue')
                                     ↓
                        changeByUser = true; nextTick(() => changeByUser = false)
```

### Pattern 1: Lexical Update with SKIP_DOM_SELECTION_TAG

**What:** Use `SKIP_DOM_SELECTION_TAG` when performing programmatic updates that should not affect DOM selection or steal focus.

**When to use:** External modelValue sync (renderModelValue), any update that runs while user may have focus elsewhere or during reconciliation.

**Example:**

```typescript
// Source: https://lexical.dev/docs/concepts/selection
import { SKIP_DOM_SELECTION_TAG } from 'lexical'

editor.update(
  () => {
    const root = $getRoot()
    root.clear()
    // ... rebuild content
  },
  { tag: SKIP_DOM_SELECTION_TAG }
)
```

### Pattern 2: IME-Safe preventDefault

**What:** Never call `event.preventDefault()` on key events during active composition.

**When to use:** Any keyboard handler that may intercept keys (e.g. use-context's PreventDefaultListener when picker is open).

**Example:**

```typescript
// Source: ui/components/input/input.vue
function PreventDefaultListener(event: KeyboardEvent) {
  if (event.isComposing) return false  // Let IME handle
  if (contextVisible.value) {
    event.preventDefault()
    return true
  }
  return false
}
```

### Pattern 3: Sync Guard with Equality Check

**What:** Skip renderModelValue when modelValue equals current editor content; extend changeByUser window with lastEmittedValue.

**When to use:** Two-way binding where parent may echo back the same value or transform it.

**Example:**

```typescript
let lastEmittedValue: string | null = null

editor.registerTextContentListener(text => {
  if (changeByModel) return
  emit('update:modelValue', text)
  lastEmittedValue = text
  changeByUser = true
  nextTick(() => {
    if (lastEmittedValue === props.modelValue) {
      changeByUser = false
    } else {
      setTimeout(() => { changeByUser = false }, 0)
    }
  })
})

watchEffect(() => {
  if (changeByUser) return
  const current = editor.getEditorState().read(() => $getRoot().getTextContent())
  if (props.modelValue === current) return
  renderModelValue()
})
```

### Anti-Patterns to Avoid

- **Synchronous parent mutation on update:modelValue:** Parent transforming modelValue in the same tick causes race; use `flush: 'post'` or defer.
- **preventDefault without isComposing check:** Breaks IME for Chinese/Japanese/Korean.
- **nextTick alone for changeByUser:** Clears too early; parent updates can still run.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Selection preservation | Manual DOM selection save/restore | SKIP_DOM_SELECTION_TAG | Lexical handles; manual approach is fragile across updates |
| IME detection | Custom composition listeners | event.isComposing + Lexical CONTROLLED_TEXT_INSERTION_COMMAND | Lexical routes input; avoid bypassing |
| Expression parsing | New parser/tokenizer | Existing regex `/\{([^}]+)\}/g` in parser.ts | Format is stable; fix bugs, don't rewrite |

---

## Common Pitfalls

### Pitfall 1: changeByUser Race with Parent Updates

**What goes wrong:** User types, emit fires, changeByUser = true, nextTick clears it. Parent's watcher or v-model handler updates modelValue before nextTick. watchEffect runs, changeByUser already false, renderModelValue overwrites user input.

**Why it happens:** nextTick is too short; Vue reactivity and parent updates can run in same/subsequent microtask.

**How to avoid:** Compare lastEmittedValue with modelValue; skip renderModelValue when they match. Extend guard with short setTimeout if needed. Document that consumers should not synchronously mutate modelValue in response to identical update.

**Warning signs:** Characters disappear mid-typing; last character dropped; behavior differs between simple v-model and custom handlers.

### Pitfall 2: Selection Lost During renderModelValue

**What goes wrong:** renderModelValue does root.clear() + full rebuild. Lexical reconciles DOM selection; cursor jumps to start or disappears.

**Why it happens:** Full rebuild invalidates selection; no SKIP_DOM_SELECTION_TAG to avoid DOM selection update during reconciliation.

**How to avoid:** Use `editor.update(..., { tag: SKIP_DOM_SELECTION_TAG })` for renderModelValue. Ensure changeByUser guard prevents renderModelValue during user typing.

**Warning signs:** Cursor jumps when typing in forms with validation; focus lost on tab switch.

### Pitfall 3: IME Composition Interrupted by preventDefault

**What goes wrong:** use-context's PreventDefaultListener calls event.preventDefault() when picker is open. User composes Chinese/Japanese/Korean; preventDefault during composition breaks IME.

**Why it happens:** No event.isComposing check. Korean IME on iOS uses beforeinput, not composition events; Lexical handles it—custom handlers must not block.

**How to avoid:** Add `if (event.isComposing) return false` to PreventDefaultListener. Never preventDefault on keydown/keypress during composition.

**Warning signs:** First character of IME input appears then disappears; composing produces wrong result.

### Pitfall 4: Parser Trailing Text Lost

**What goes wrong:** parseContent uses `matchAll(/\{([^}]+)\}/g)` and adds text between matches. Text after the last `{...}` is never appended.

**Why it happens:** Loop only processes inter-match text; no post-loop append for content after last match.

**How to avoid:** After loop, append `content.slice(prevItem.index + prevItem[0].length)` as final TextNode if prevItem exists and slice is non-empty.

**Warning signs:** "hello{foo}world" round-trips as "hello{foo}"; trailing text lost.

### Pitfall 5: Stale textNode/charPosition on Variable Insertion

**What goes wrong:** User opens picker at `@`, moves cursor, selects variable. handleVariableSelect uses textNode/charPosition from selection-at-open time; insertion corrupts content.

**Why it happens:** SELECTION_CHANGE_COMMAND updates refs when at `@`; refs not revalidated at selection time.

**How to avoid:** In handleVariableSelect, re-read $getSelection(), verify cursor still in expected text node and at/near `@`. Abort or recompute insertion point if selection moved.

---

## Code Examples

### renderModelValue with SKIP_DOM_SELECTION_TAG

```typescript
// Source: Lexical docs https://lexical.dev/docs/concepts/selection
import { SKIP_DOM_SELECTION_TAG } from 'lexical'

function renderModelValue() {
  changeByModel = true
  const { modelValue } = props
  if (!modelValue) return

  editor.update(
    () => {
      const root = $getRoot()
      root.clear()
      const paragraph = $createParagraphNode()
      const nodes = parseContent(modelValue, variableMap.value)
      paragraph.append(...nodes)
      root.append(paragraph)
    },
    { tag: SKIP_DOM_SELECTION_TAG }
  )

  nextTick(() => {
    changeByModel = false
  })
}
```

### PreventDefaultListener with isComposing

```typescript
// Source: PITFALLS.md, input.vue pattern
function PreventDefaultListener(event: KeyboardEvent) {
  if (event.isComposing) return false
  if (contextVisible.value) {
    event.preventDefault()
    return true
  }
  return false
}
```

### Parser Trailing Text Fix

```typescript
// Fix for parseContent: add text after last variable; handle no-match case
let prevItem: null | RegExpExecArray = null
for (const item of content.matchAll(/\{([^}]+)\}/g)) {
  // ... existing loop body
}
if (prevItem) {
  const tail = content.slice(prevItem.index! + prevItem[0].length)
  if (tail) nodes.push($createTextNode(tail))
} else if (content) {
  nodes.push($createTextNode(content))
}
return nodes
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| nextTick only for changeByUser | Equality check + lastEmittedValue | Phase 2 | Prevents overwrite race |
| No update tag on renderModelValue | SKIP_DOM_SELECTION_TAG | Lexical v0.22.0 | Preserves selection during sync |
| preventDefault without isComposing | Check event.isComposing first | Phase 2 | IME-safe handlers |

---

## Expression Format Contract (STAB-03)

**Format:** `{variable}` where variable is `[^}]+` (one or more non-`}` chars).

**Parse:** `/\{([^}]+)\}/g` — extract variable names; text between and after is plain text.

**Serialize:** Root.getTextContent() concatenates node getTextContent(); VariableNode returns `{variable}`.

**Edge cases:**

| Input | Parse Result | Round-Trip |
|-------|--------------|------------|
| `{a}` | TextNode("") + VariableNode(a) | ✓ |
| `hello{foo}` | TextNode("hello") + VariableNode(foo) | ✓ |
| `hello{foo}world` | Bug: "world" lost (see Pitfall 4) | ✗ fix |
| `{}` | No match; empty nodes | Document |
| `{a.b.c}` | VariableNode("a.b.c") | ✓ |
| `{a{b}}` | VariableNode("a{b") + TextNode("}") | Nested braces break; document limitation |

**Backward compatibility:** Treat regex and format as stable API. Add fixture tests for stored expressions. Any format change must be opt-in.

---

## Open Questions

1. **changeByUser flush strategy**
   - What we know: nextTick clears too early; equality check + lastEmittedValue recommended.
   - What's unclear: Whether setTimeout(0) or requestAnimationFrame is needed for edge cases.
   - Recommendation: Start with equality check; add short deferred clear only if validation fails.

2. **Parser empty/trailing handling**
   - What we know: Trailing text after last `{...}` is not parsed; `{}` returns no nodes.
   - What's unclear: Whether `{}` or `{ }` should parse as invalid variable or be rejected.
   - Recommendation: Fix trailing text; document `{}` as producing no variable node; add fixture tests.

---

## Sources

### Primary (HIGH confidence)

- Lexical Updates — https://lexical.dev/docs/concepts/updates — SKIP_DOM_SELECTION_TAG, update tags
- Lexical Selection — https://lexical.dev/docs/concepts/selection — SKIP_DOM_SELECTION_TAG usage, focus
- Ultra UI PITFALLS.md — selection, changeByUser race, IME, parser
- Ultra UI use-editor.ts, use-context.ts, parser.ts — current implementation

### Secondary (MEDIUM confidence)

- Lexical GitHub #5841 — Korean IME on iOS
- ContentEditable Vue cursor jump — https://jessieji.com/2022/contenteditable-vue
- input.vue — isComposing pattern

### Tertiary (LOW confidence)

- WebSearch: Vue contenteditable v-model cursor jump — general patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Lexical 0.40, Vue 3 verified in package.json
- Architecture: HIGH — use-editor, use-context, parser inspected
- Pitfalls: HIGH — PITFALLS.md, Lexical docs, codebase analysis

**Research date:** 2026-02-12
**Valid until:** 30 days (stable stack)
