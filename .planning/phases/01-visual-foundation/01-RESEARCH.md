# Phase 1: Visual Foundation - Research

**Researched:** 2026-02-12
**Domain:** Expression editor visuals, Ultra UI design tokens, state feedback
**Confidence:** HIGH

## Summary

This phase aligns the expression editor with Ultra UI design language. The codebase already has design tokens (designs/01–08), theme variables (ui/styles/theme/), and conventions (BEM, fn.use-var). The expression-editor currently uses hardcoded colors and non-token styling. Implementation is straightforward: replace hardcoded values with design tokens, adjust state feedback per CONTEXT decisions (no shadow, instant transitions, border-only focus), and refine variable nodes and picker panel to match chip/tag patterns and elevation.

**Primary recommendation:** Replace all hardcoded colors and spacing in expression-editor/style.scss with fn.use-var(); remove default shadow and state transitions; use border change for focus; style variable nodes as chip/tag with single accent; ensure disabled/readonly are highly distinguishable.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Editor Container Visual Style**
- Default shadow: none; rely on border/background for structure.
- Spacing density: compact (higher information density).

**State Feedback Expression**
- Focus state uses border change as the primary visual signal.
- Disabled and readonly states must be highly distinguishable at a glance.
- Readonly should not show editable caret feel; view/copy oriented.
- State transitions should be instant (no visible transition animation).

**Variable Node Style**
- Use chip/tag-like node appearance.
- Use a single accent color strategy for all variable nodes.
- Long variable names use ellipsis with hover tooltip for full value.
- Node content includes variable name plus short type indicator.

**Variable Picker Panel Experience**
- Panel visual hierarchy should be strong and clearly elevated.
- Show/hide motion should use subtle fade (not abrupt toggle, not heavy motion).
- Candidate list density should be balanced (readability and quantity in balance).

### Claude's Discretion

- Exact visual weight (border contrast/detail levels) of the editor container.
- Container corner radius choice aligned with existing Ultra UI components.
- Empty/loading state visual specifics for variable picker panel.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

---

## Standard Stack

### Core

| Library/Pattern | Version/Source | Purpose | Why Standard |
|-----------------|----------------|---------|--------------|
| fn.use-var() | ui/styles/functions | Design token access | Token-based styling; theme support |
| BEM (m.b, m.e, m.is) | ui/styles/mixins | Class naming | Consistent with all other components |
| design tokens | designs/01–08 | Colors, radius, gap, shadow | Single source of truth |
| UTag | ui/components/tag | Variable node chip | Already used; supports type, round, size |

### Supporting

| Library/Pattern | Purpose | When to Use |
|-----------------|---------|--------------|
| UTip | Variable picker popover | Already wraps picker; supports transition |
| UScroll, UEmpty, UInput | Picker panel internals | Already in use |
| useFormFallbackProps | size, disabled, readonly | Already in expression-editor |
| useFocus | Focus state class | Input uses this; expression-editor uses :focus-within |

### No New Packages

Phase 1 is purely visual. No Lexical changes, no new Vue packages, no new UI libraries.

---

## Architecture Patterns

### Expression Editor Structure

```
ui/components/expression-editor/
├── expression-editor.vue    # Root; className includes is-disabled, is-readonly
├── style.scss               # All visual tokens; BEM block expression-editor
├── style.ts                 # Import tip, input, icon, scroll, empty, tag, style.scss
├── nodes/variable-node.tsx   # Uses UTag; decorate() returns UTag
├── components/variable-picker.vue  # Wrapped by UTip; filter, breadcrumbs, panel
├── use-editor.ts            # Lexical lifecycle; no visual changes
└── di.ts                    # DI context; no visual changes
```

### Design Token Usage

**Use fn.use-var() for all visual properties:**

```scss
// Source: ui/components/input/style.scss, designs/01-design-tokens.md
@use '../../styles/functions' as fn;

.u-expression-editor {
  background-color: fn.use-var(bg-color, top);
  border: fn.use-var(border-width) fn.use-var(border-style) fn.use-var(border-color);
  border-radius: fn.use-var(radius, default);

  &:focus-within {
    border-color: fn.use-var(color, primary);
    outline: none;
  }

  &.is-disabled {
    background-color: fn.use-var(color, disabled);
    border-color: fn.use-var(border-color);
  }

  &.is-readonly {
    background-color: fn.use-var(bg-color, middle);
    border-color: fn.use-var(border-color);
  }
}
```

### State Class Pattern

Expression-editor already applies `bem.is('disabled', disabled.value)` and `bem.is('readonly', readonly.value)`. Focus uses `:focus-within` on the container (no explicit class). Per CONTEXT: no transition on state change.

### Variable Node Pattern

VariableNode.decorate() returns UTag. Per CONTEXT: chip/tag-like, single accent, ellipsis + tooltip for long names, name + type indicator.

```tsx
// Source: ui/components/expression-editor/nodes/variable-node.tsx
decorate(): VNode {
  return (
    <UTag size='small' style='margin: 0 2px' type='primary' round>
      {this.__label}
    </UTag>
  )
}
```

UTag supports: `type` (primary, success, etc.), `round`, `size`, `dark`. For "single accent for all variable nodes," use `type='primary'` only.

### Anti-Patterns to Avoid

- **Hardcoded colors:** Never use `#ffffff`, `#d1d5db`, `#9ca3af`, etc. Use `fn.use-var()`.
- **box-shadow on default:** CONTEXT says shadow: none for default.
- **transition on state change:** CONTEXT says instant; remove `transition` from state-related properties.
- **Different accent per variable:** CONTEXT says single accent; do not vary by variable type in visuals.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Ellipsis tooltip for long variable names | Custom tooltip component | UTip or native `title` | UTip exists; native title is sufficient for phase scope |
| Design token values | Hardcode hex/rgba | fn.use-var(basename, nodes...) | Theme support; designs/01–08 |
| Variable chip styling | Custom span styles | UTag with type='primary', round | Already used; BEM-compliant |
| Panel elevation | Custom shadow/overlay | fn.use-var(shadow); fn.use-var(bg-color, top) | Tip content uses these; design tokens |

**Key insight:** Ultra UI provides tokens and components. Hand-rolling overrides theme and breaks consistency.

---

## Common Pitfalls

### Pitfall 1: Leaving Transition on State Properties

**What goes wrong:** Hover/focus/disabled/readonly animate when CONTEXT requires instant feedback.

**Why it happens:** Current style.scss has `transition: all 0.2s cubic-bezier(...)` on the block.

**How to avoid:** Remove `transition` from the expression-editor block root, or scope it only to non-state properties (e.g. not border, background). Per CONTEXT: "State transitions should be instant."

**Warning signs:** Any `transition` on `border`, `background`, `box-shadow` for state changes.

### Pitfall 2: Shadow on Default State

**What goes wrong:** Editor shows shadow when CONTEXT says "default shadow: none."

**Why it happens:** Current style has `box-shadow: 0 1px 2px rgba(0,0,0,0.05)` on default, and stronger on hover/focus.

**How to avoid:** Remove default shadow. Use only border for structure. If elevation is needed for picker panel, use `fn.use-var(shadow)` on the panel, not the editor container.

**Warning signs:** `box-shadow` on `.u-expression-editor` without `:focus-within` or `:hover`.

### Pitfall 3: Disabled vs Readonly Indistinguishable

**What goes wrong:** Both look similar (grayed out); user cannot tell at a glance.

**Why it happens:** Current style uses similar opacity/background for both.

**How to avoid:** Per CONTEXT: "highly distinguishable at a glance." Use distinct tokens: disabled → `fn.use-var(color, disabled)` background, `cursor: not-allowed`; readonly → `fn.use-var(bg-color, middle)`, `cursor: default`, no editable caret feel. Consider different border or text treatment.

**Warning signs:** Both states use same background or opacity.

### Pitfall 4: Readonly Shows Editable Caret

**What goes wrong:** Readonly feels editable due to caret or selection styling.

**Why it happens:** contenteditable is false, but cursor or selection highlight may suggest editability.

**How to avoid:** Per CONTEXT: "view/copy oriented." Use `user-select: text` for copy; avoid caret-like cursor; ensure no focus ring that suggests typing.

**Warning signs:** `cursor: text` or visible caret in readonly.

### Pitfall 5: Variable Node Inconsistent with Tag Design

**What goes wrong:** Variable nodes look different from Ultra UI tag/chip pattern.

**Why it happens:** Custom `.var-block` styles override or diverge from UTag.

**How to avoid:** Use UTag as the sole visual source. Ensure BEM element `var-block` (if kept) aligns with tag style, or delegate entirely to UTag. Single accent: `type='primary'` only.

**Warning signs:** Custom background/border on variable nodes that don't match tag tokens.

---

## Code Examples

### Editor Container (Design Tokens)

```scss
// Source: designs/01-design-tokens.md, ui/components/input/style.scss
@include m.b($root-name) {
  background-color: fn.use-var(bg-color, top);
  border: fn.use-var(border-width) fn.use-var(border-style) fn.use-var(border-color);
  border-radius: fn.use-var(radius, default);
  // No box-shadow on default

  &:hover:not(.is-disabled):not(.is-readonly) {
    border-color: fn.use-var(color, primary);
    // No transition
  }

  &:focus-within:not(.is-disabled):not(.is-readonly) {
    border-color: fn.use-var(color, primary);
    outline: none;
  }

  @include m.is(disabled) {
    background-color: fn.use-var(color, disabled);
    border-color: fn.use-var(border-color);
    cursor: not-allowed;
  }

  @include m.is(readonly) {
    background-color: fn.use-var(bg-color, middle);
    border-color: fn.use-var(border-color);
    cursor: default;
  }
}
```

### Variable Node (Chip/Tag)

```tsx
// Source: ui/components/expression-editor/nodes/variable-node.tsx
// UTag with ellipsis + optional tooltip
<UTag size='small' type='primary' round>
  <span :title="longLabel">{{ displayLabel }}</span>
</UTag>
```

UTag `content` slot supports ellipsis via `u-tag__content` (overflow: hidden; text-overflow: ellipsis; white-space: nowrap).

### Placeholder (Design Token)

```scss
@include m.e(placeholder) {
  color: fn.use-var(text-color, placeholder);
}
```

### Compact Spacing

```scss
// CONTEXT: compact density
@include m.size using ($size) {
  padding: fn.use-var(gap, small);  // or smaller than default
  min-height: fn.use-var(form-component-height, $size);
}
```

### Picker Panel (Elevation)

```scss
// UTip content already uses fn.use-var(shadow), fn.use-var(bg-color, top)
// Ensure panel feels elevated; tip/content has border-radius and shadow
```

### Subtle Fade for Picker Show/Hide

```scss
// Source: ui/components/tip/style.scss
.tip-enter-active, .tip-leave-active {
  transition-property: opacity;
}
.tip-enter-from, .tip-leave-to {
  opacity: 0;
}
```

Tip already uses `transition name="tip"`. Per CONTEXT: "subtle fade" — reduce or remove transform if present; opacity-only is sufficient.

---

## State of the Art

| Current (expression-editor) | Target (Phase 1) | Impact |
|----------------------------|------------------|--------|
| Hardcoded #ffffff, #d1d5db, #9ca3af | fn.use-var(bg-color, top), fn.use-var(border-color), fn.use-var(text-color, placeholder) | Theme support |
| box-shadow on default/hover/focus | No shadow on default; border only for structure | Aligns with CONTEXT |
| transition: all 0.2s | No transition on state | Instant feedback |
| hover/focus add box-shadow ring | Focus: border-color change only | Simpler, aligned |
| UTag for variable node | Keep UTag; single accent (primary); add ellipsis + tooltip | Chip/tag appearance |
| VariableItem has label, value, children | Add optional type for indicator | Node shows name + type |

---

## Open Questions

1. **Variable type indicator**
   - What we know: CONTEXT says "Node content includes variable name plus short type indicator." VariableItem currently has `label`, `value`, `children`; no `type` field.
   - What's unclear: Whether to extend VariableItem with `type?: string` or derive from structure (e.g. leaf vs parent).
   - Recommendation: Add optional `type?: string` to VariableItem; render in variable node if present. If absent, show name only. LOW risk; backward compatible.

2. **Container corner radius**
   - What we know: designs/01 prescribes `--radius-default` (6px) for inputs; `--radius-small` (4px) for tags.
   - What's unclear: Exact choice for expression-editor.
   - Recommendation: Use `fn.use-var(radius, default)` to align with Input/Textarea (CONTEXT: "aligned with existing Ultra UI components").

3. **Picker panel empty/loading**
   - What we know: CONTEXT leaves empty/loading to discretion. Current picker uses UEmpty for "暂无可用变量."
   - What's unclear: Visual specifics for loading (if added later).
   - Recommendation: Keep UEmpty for empty; document loading as out of scope for Phase 1 unless required.

---

## Sources

### Primary (HIGH confidence)
- Ultra UI designs/01-design-tokens.md, 03-colors.md, 04-spacing.md, 05-components.md, 06-motion.md
- ui/styles/theme/light.ts, _vars.scss, _functions.scss, _mixins.scss
- ui/components/input/style.scss, textarea/style.scss, tag/style.scss, tag/tag.vue, tip/style.scss
- ui/components/expression-editor/expression-editor.vue, style.scss, nodes/variable-node.tsx, components/variable-picker.vue

### Secondary (MEDIUM confidence)
- .planning/research/SUMMARY.md — expression-editor architecture
- .planning/codebase/STRUCTURE.md — file layout

### Tertiary (LOW confidence)
- VariableItem type extension for `type` — not in current types; CONTEXT specifies it

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — design tokens and components exist; no new stack
- Architecture: HIGH — existing patterns clear; expression-editor structure known
- Pitfalls: HIGH — CONTEXT constraints explicit; current style gaps identified

**Research date:** 2026-02-12
**Valid until:** 30 days (design tokens and component patterns stable)
