# Architecture Research: Expression Editor Refactor (v0.5.0)

**Domain:** Vue 3 expression editor component refactor
**Researched:** 2026-02-12
**Confidence:** HIGH

## Executive Summary

The expression-editor is a Lexical-based component for editing expressions with inline variable insertion (`{variable}`). It uses Vue 3 Composition API, provider/inject for DI, and integrates with form fallback props. The refactor should preserve public API and existing behavior while decomposing internals into clearer modules, fixing drag-drop, and improving visual consistency. Integration points span components, compositions, types, utils, and styles—with a phased build order that minimizes regression risk.

---

## Current Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     expression-editor (ui/components/)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  expression-editor.vue                                                       │
│    ├── container (contenteditable)                                           │
│    ├── placeholder                                                            │
│    ├── Decorators (Teleport)                                                  │
│    └── VariablePicker                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  use-editor.ts          use-context.ts          use-decorators.tsx            │
│  (Lexical init,         (@ trigger,             (Teleport decorators)         │
│   model sync,           variable picker)                                      │
│   parseContent)                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  plain-text.ts          parser.ts              di.ts                         │
│  (Lexical commands)     (string→LexicalNode)   (createVariableMap, DIKey)     │
├─────────────────────────────────────────────────────────────────────────────┤
│  nodes/variable-node.tsx    components/variable-picker.vue                   │
│  (DecoratorNode, UTag)      (UTip, UInput, UScroll, UEmpty)                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Current Implementation |
|-----------|----------------|------------------------|
| `expression-editor.vue` | Root container, DI provide, orchestration | 160 lines; wires useEditor, useContext, useDecorators, handleVariableSelect |
| `use-editor.ts` | Lexical editor lifecycle, model ↔ content sync | createEditor, registerPlainText, parseContent, watchEffect for modelValue |
| `use-context.ts` | @ trigger detection, variable picker state | SELECTION_CHANGE_COMMAND, textNode/charPosition, contextVisible |
| `use-decorators.tsx` | Decorator nodes → Teleport VNodes | registerDecoratorListener, Teleport to element |
| `plain-text.ts` | Lexical commands (copy, paste, delete, etc.) | mergeRegister; DROP/DRAGSTART are stubs |
| `parser.ts` | `{var}` string → LexicalNode[] | Regex matchAll, $createTextNode, $createVariableNode |
| `di.ts` | Variable map, DI context | createVariableMap, ExpressionEditorDIKey |
| `variable-node.tsx` | Variable block rendering | DecoratorNode, UTag, updateVariable |
| `variable-picker.vue` | Variable selection UI | inject DIKey, UTip, UInput, UScroll, UEmpty |

---

## Integration Points (Codebase-Aware)

### Components Layer

| Integration | Location | Purpose |
|-------------|----------|---------|
| `expression-editor.vue` | `ui/components/expression-editor/` | Consumes `useFormComponent`, `useFormFallbackProps` (size, disabled, readonly) |
| `variable-picker.vue` | `ui/components/expression-editor/components/` | Injects `ExpressionEditorDIKey`; uses `UTip`, `UInput`, `UIcon`, `UScroll`, `UEmpty` |
| `variable-node.tsx` | `ui/components/expression-editor/nodes/` | Uses `UTag` from `../../tag` |

### Compositions Layer

| Integration | Location | Purpose |
|-------------|----------|---------|
| `useFormComponent` | `@ui/compositions` | Form context for nested form controls |
| `useFormFallbackProps` | `@ui/compositions` | Resolves size/disabled/readonly from form → props |
| *No expression-specific composables in `ui/compositions/`* | — | All editor logic is local to `expression-editor/` |

### Types Layer

| Integration | Location | Purpose |
|-------------|----------|---------|
| `ExpressionEditorProps` | `ui/types/components/expression-editor.ts` | Extends `FormComponentProps`; modelValue, placeholder, variables |
| `ExpressionEditorEmits` | Same | `update:modelValue` |
| `VariableItem` | Same | label, value, children? |
| `FormComponentProps` | `ui/types/component-common.ts` | size, disabled, readonly, etc. |

### Utils Layer

| Integration | Location | Purpose |
|-------------|----------|---------|
| `bem` | `@ui/utils` | BEM factory for `expression-editor` block |
| `createVariableMap` | `ui/components/expression-editor/di.ts` | Local util; could move to `ui/utils/` if reused |

### Styles Layer

| Integration | Location | Purpose |
|-------------|----------|---------|
| `_mixins.scss` | `ui/styles/mixins` | `m.b`, `m.e`, `m.is`, `m.size`, `m.bem` |
| `_functions.scss` | `ui/styles` | `fn.use-var` for theme tokens |
| `_vars.scss` | `ui/styles` | Design tokens |
| `style.ts` | `expression-editor/style.ts` | Imports tip, input, icon, scroll, empty, tag, style.scss |

### External Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `lexical` | Package | Rich text editor core |
| `@lexical/clipboard` | Package | $getHtmlContent, $insertDataTransferForPlainText |
| `@lexical/utils` | Package | mergeRegister, objectKlassEquals, CAN_USE_BEFORE_INPUT, etc. |

---

## New vs Modified Boundaries

### New Modules (Introduce)

| Module | Path | Purpose |
|--------|------|---------|
| `use-expression-drag-drop.ts` | `ui/components/expression-editor/` | Lexical DROP/DRAGSTART handlers; move/insert nodes on drag |
| `commands/` (optional) | `ui/components/expression-editor/commands/` | Extract plain-text commands into modular files if `plain-text.ts` grows |
| `expression-editor/utils/parse.ts` (optional) | `ui/components/expression-editor/utils/` | Re-export or relocate `parseContent` for testability |

### Modified Modules (Change In-Place)

| Module | Path | Changes |
|--------|------|---------|
| `expression-editor.vue` | `ui/components/expression-editor/expression-editor.vue` | Wire use-expression-drag-drop; possibly extract `handleVariableSelect`/`updateVariableNode` to composable |
| `plain-text.ts` | `ui/components/expression-editor/plain-text.ts` | Replace DROP_COMMAND/DRAGSTART_COMMAND stubs with real handlers (or delegate to new module) |
| `use-editor.ts` | `ui/components/expression-editor/use-editor.ts` | Register drag-drop if in separate module; keep model sync logic |
| `style.scss` | `ui/components/expression-editor/style.scss` | Visual refresh: borders, focus states, var-block styling to match design language |
| `di.ts` | `ui/components/expression-editor/di.ts` | Extend DI context only if drag-drop needs shared state |

### Unchanged Modules (Preserve)

| Module | Path | Rationale |
|--------|------|------------|
| `parser.ts` | `ui/components/expression-editor/parser.ts` | Stable; regex-based `{var}` parsing |
| `use-context.ts` | `ui/components/expression-editor/use-context.ts` | @ trigger logic works; low change risk |
| `use-decorators.tsx` | `ui/components/expression-editor/use-decorators.tsx` | Lexical decorator integration stable |
| `variable-node.tsx` | `ui/components/expression-editor/nodes/variable-node.tsx` | May need styling tweaks only |
| `variable-picker.vue` | `ui/components/expression-editor/components/variable-picker.vue` | Visual polish only; no structural change |
| `ui/types/components/expression-editor.ts` | — | Public API unchanged |
| `constants.ts` | `ui/components/expression-editor/constants.ts` | CONTEXT_TRIGGER_CHAR only |

---

## Data Flow and Event Flow

### Current Data Flow

```
modelValue (prop)
    ↓
use-editor: watchEffect → renderModelValue → parseContent → editor.update
    ↓
Lexical Editor ←→ contenteditable container
    ↓
editor.registerTextContentListener → emit('update:modelValue')
    ↑
User input / Variable insertion
```

### Current Event Flow (Variable Insertion)

```
User types '@' → useContext: SELECTION_CHANGE_COMMAND → openContextMenu
    ↓
VariablePicker (UTip) visible, triggerDom = cursor element
    ↓
User selects variable → handleVariableSelect → editor.update
    ↓
Replace text around '@' with $createVariableNode, newNode.selectEnd()
    ↓
editor.registerTextContentListener → emit('update:modelValue')
```

### Proposed Data Flow Changes

- **None for modelValue sync.** Keep use-editor’s existing watchEffect + registerTextContentListener.
- **Drag-drop:** Add handlers that read selection/nodes, compute drop target, and call `editor.update` with node move/insert. Emit flows through existing textContentListener.

### Proposed Event Flow Changes

- **DROP_COMMAND:** Implement `$insertDataTransferForPlainText` or custom logic for Lexical node drag (VariableNode + TextNode reorder).
- **DRAGSTART_COMMAND:** Set `dataTransfer` with serialized selection; optional custom MIME for variable blocks.
- **Optional:** Emit `dragStart` / `drop` for parent apps if needed; otherwise keep internal.

---

## Implementation Sequencing (Build Order)

Order chosen to minimize regression risk and respect dependencies.

### Phase 1: Types and Styles (No Behavior Change)

1. **Types** (`ui/types/components/expression-editor.ts`)
   - Add optional emit types for drag events if exposing; otherwise skip.
   - **Risk:** Low. No consumers depend on new emits yet.

2. **Styles** (`ui/components/expression-editor/style.scss`)
   - Visual refresh: borders, focus-within, disabled/readonly, var-block.
   - **Risk:** Low. Pure CSS; no logic change.

### Phase 2: Extract and Stabilize (Prepare for Drag-Drop)

3. **Parser** (`ui/components/expression-editor/parser.ts`)
   - Add unit tests (if test infra exists); otherwise add JSDoc and ensure exports are stable.
   - **Risk:** Low. No refactor yet.

4. **createVariableMap** (`di.ts`)
   - Keep in di.ts or move to `utils/` if reused. No signature change.
   - **Risk:** Low.

5. **use-context / use-decorators**
   - No changes. Verify they work with current editor setup.

### Phase 3: Drag-Drop Implementation

6. **use-expression-drag-drop.ts** (new)
   - Implement DROP_COMMAND and DRAGSTART_COMMAND logic.
   - Use Lexical `$getSelection`, `$isRangeSelection`, `$insertNodes`, etc.
   - **Risk:** Medium. New code path; test manually.

7. **plain-text.ts**
   - Replace stub handlers with calls to use-expression-drag-drop or inline implementation.
   - **Risk:** Medium. Depends on step 6.

8. **use-editor.ts**
   - Register drag-drop module (e.g. `registerExpressionDragDrop(editor)`).
   - **Risk:** Low. Additive.

### Phase 4: Component Refactor (Optional)

9. **expression-editor.vue**
   - Extract `handleVariableSelect` and `updateVariableNode` to `use-variable-insert.ts` if desired.
   - Simplify root component to orchestration only.
   - **Risk:** Low–Medium. Improves structure; ensure DI still works.

10. **variable-picker.vue**
    - Visual polish only; no structural change.
    - **Risk:** Low.

### Phase 5: Polish and Verification

11. **variable-node.tsx**
    - Styling tweaks for var-block (e.g. UTag props) to match design.
    - **Risk:** Low.

12. **Sample** (`sample/src/expression-editor/index.vue`)
    - Add drag-drop demo; verify disabled/readonly, variables, form integration.
    - **Risk:** Low.

---

## Dependency Order Summary

```
Phase 1: types*, styles
Phase 2: parser (verify), di (verify), use-context/use-decorators (verify)
Phase 3: use-expression-drag-drop (new) → plain-text (modify) → use-editor (modify)
Phase 4: expression-editor.vue (optional extract), variable-picker (polish)
Phase 5: variable-node (polish), sample (verify)
```

\* Types only if new emits; otherwise skip.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Mutating Lexical State Outside `editor.update`

**What people do:** Call `$getSelection()` or modify nodes without wrapping in `editor.update`.

**Why it's wrong:** Lexical requires all mutations inside `editor.update` to maintain consistency.

**Do this instead:** Always wrap mutations in `editor.update(() => { ... })`.

### Anti-Pattern 2: Duplicating variableMap

**What people do:** Recreate variableMap in multiple places (use-editor, expression-editor.vue, di).

**Why it's wrong:** Already centralized in di.ts and passed via provide. Duplication causes drift.

**Do this instead:** Single source: `createVariableMap(props.variables)` in root, provide via DI.

### Anti-Pattern 3: Breaking Form Fallback Order

**What people do:** Override size/disabled/readonly without using useFormFallbackProps.

**Why it's wrong:** Form controls must respect form → props → config cascade.

**Do this instead:** Keep `useFormFallbackProps([formProps ?? {}, props])` for size, disabled, readonly.

### Anti-Pattern 4: Styling Variable Picker Outside BEM

**What people do:** Add ad-hoc classes or inline styles to variable-picker.

**Why it's wrong:** Breaks BEM consistency; variable-picker uses `cls.e(...)` from DI.

**Do this instead:** Extend `expression-editor` BEM block with new elements (e.g. `filter`, `panel`, `item`) in style.scss.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (single editor per view) | Monolithic expression-editor is fine |
| Multiple editors (e.g. form with many fields) | Each editor is independent; Lexical instances are isolated |
| Large variable lists (1000+ items) | VariablePicker uses UScroll; consider virtual list if needed |
| Long expressions (10k+ chars) | Lexical handles large content; monitor parseContent regex for very long strings |

---

## Sources

- Codebase: `ui/components/expression-editor/`, `ui/types/components/expression-editor.ts`
- Planning: `.planning/PROJECT.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`
- Lexical: COMMAND_PRIORITY_EDITOR, DROP_COMMAND, DRAGSTART_COMMAND, $insertDataTransferForPlainText

---

*Architecture research for: Ultra UI expression editor refactor (v0.5.0)*
*Researched: 2026-02-12*
