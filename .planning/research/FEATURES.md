# Feature Research: Expression Editor Refactor (v0.5.0)

**Domain:** Expression editor component in enterprise Vue UI library  
**Researched:** 2026-02-12  
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Variable insertion via trigger (@) | Core value prop; users must insert variables | LOW | **Exists.** `use-context.ts` detects `@`; `plain-text.ts` command handling. |
| Variable picker with search/filter | Enterprise variable lists are large; search is baseline | LOW | **Exists.** `variable-picker.vue` has filterable search. |
| Placeholder text | Standard form UX; empty state guidance | LOW | **Exists.** `placeholder` prop. |
| Disabled / readonly states | Form controls need state handling | LOW | **Exists.** `useFormFallbackProps` cascades. |
| Clear focus / hover feedback | Users need to know the field is interactive | LOW | **Exists.** Border and shadow changes in `style.scss`. |
| Keyboard navigation in picker | Accessibility and power-user expectations | LOW | **Exists.** Arrows, Enter, Esc, Space in `variable-picker.vue`. |
| Variable chips (pill badges) | Variables must be visually distinct from plain text | MEDIUM | **Exists.** `VariableNode` + decorators; `var-block` styling. |
| Consistent sizing (size prop) | Form consistency across library | LOW | **Exists.** `useFormFallbackProps` + size mixin. |
| Copy / paste of expressions | Basic clipboard support | LOW | **Exists.** `plain-text.ts` COPY/CUT/PASTE handlers. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Tree-structured variable picker with breadcrumbs | Hierarchical data (e.g. `form.user.name`) navigable without flattening | MEDIUM | **Exists.** `navigationPath`, `breadcrumbs`. |
| Lexical-based editor | Stable, extensible contenteditable; no DOM hacks | MEDIUM | **Exists.** Lexical + VariableNode. |
| Design token consistency | Visual alignment with Ultra UI theme; dark mode support | LOW | **Needs work.** `style.scss` uses hardcoded colors. |
| Variable picker positioning via floating-ui | Correct placement near cursor; no clipping | LOW | **Exists.** `UTip` (uses `@floating-ui/dom`). |
| Teleport-based decorators | Variable nodes render inside DOM without layout hacks | MEDIUM | **Exists.** `use-decorators.tsx`. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full drag-drop reorder of variable blocks | “Natural” editing feel | High complexity (validation, state, performance); n8n had bugs with incorrect references. | Cut/paste; keyboard reorder. |
| Real-time syntax validation | Catch errors early | Expression format is domain-specific; validation logic belongs in consumer. | Document format; optional `invalid` prop for styling. |
| Rich text (bold, italic, etc.) | “Editor” = WYSIWYG | Expression editors are plain text + variables; formatting adds noise. | Stay plain text. |
| AI-powered suggestions | Modern UX | Scope creep; requires backend; out of scope for component library. | Defer. |
| Multi-line formula builder | Complex formulas | Very different UX (block-based vs inline); would require different component. | Keep inline; add separate component if needed. |

## Feature Dependencies

```
[Visual consistency with design tokens]
    └──requires──> [Replace hardcoded colors in style.scss]
                       └──depends on──> [ui/styles/_vars.scss, fn.use-var]

[Variable picker UX]
    └──enhances──> [Variable insertion via @]
    └──requires──> [UTip, UInput, UScroll, UEmpty]

[Drag-drop decision]
    └──conflicts──> [Keep scope small for v0.5.0]
    └──alternative──> [Remove stub handlers or document as non-supported]
```

### Dependency Notes

- **Visual consistency requires design tokens:** Expression editor uses hardcoded colors (`#ffffff`, `#d1d5db`, `#9ca3af`, etc.) instead of `fn.use-var()`. Input and other form components use tokens.
- **Variable picker enhances insertion:** Picker UX (filter, breadcrumbs, keyboard) is core to the insertion flow; improving it improves the primary task.
- **Drag-drop conflicts with scope:** Current handlers are stubs. Implementing full drag-drop is HIGH complexity; removing or documenting as non-supported is simpler for v0.5.0.

## MVP Definition (v0.5.0)

### Launch With (v0.5.0)

Minimum viable refactor — what’s needed to validate the milestone.

- [x] **Variable insertion via @** — already exists; preserve
- [x] **Variable picker with search** — already exists; preserve
- [ ] **Visual consistency** — replace hardcoded colors with design tokens
- [ ] **Internal module refactor** — clearer boundaries, testable modules
- [ ] **Drag-drop decision** — implement or remove/document; no stubs

### Add After Validation (v0.5.x)

- [ ] **Explicit invalid/error state** — `isInvalid` prop for styling when consumer provides invalid expression
- [ ] **ARIA improvements** — `aria-activedescendant`, `aria-autocomplete` for picker (Lexical docs mention these)

### Future Consideration (v0.6+)

- [ ] **Full drag-drop** — if user research validates need; implement in dedicated phase
- [ ] **Expression validation API** — optional hook for consumer validation

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Design token consistency | HIGH | LOW | P1 |
| Drag-drop decision (remove or document) | MEDIUM | LOW | P1 |
| Internal module refactor | LOW (indirect) | MEDIUM | P1 |
| Invalid state styling | MEDIUM | LOW | P2 |
| ARIA improvements | MEDIUM | LOW | P2 |
| Full drag-drop implementation | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for v0.5.0
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Elastic EuiExpression | Appian / DevExpress | Ultra UI Approach |
|---------|------------------------|---------------------|-------------------|
| Expression display | description + value pairs, inline/column | Formula editor with syntax | Inline text + variable chips |
| Variable insertion | Not primary; read-only display | Dedicated UI with picker | @ trigger + picker with search |
| Invalid state | `isInvalid` prop for danger styling | Error indicators | Not yet; add optional prop |
| Text truncation | `textWrap` prop | N/A | Rely on word-break; defer truncate |
| Keyboard | Button click | Full keyboard | Picker has arrows; editor uses Lexical |

## UX Outcomes for v0.5.0

Refactor should deliver:

1. **Visual consistency** — Expression editor matches Input, Select, etc. in border, radius, focus, disabled/readonly.
2. **Predictable behavior** — No half-implemented features (e.g. drag-drop stubs); clear docs for supported flows.
3. **Maintainability** — Modular structure; easier to test and extend.
4. **Stability** — Edge cases addressed (e.g. highlight regex); no regressions in existing flows.

## Sources

- [Elastic UI Expression](https://eui.elastic.co/docs/components/forms/search-and-filter/expression)
- [Lexical framework](https://lexical.dev/docs/intro)
- [Lexical contenteditable](https://lexical.dev/docs/api/modules/lexical_react_LexicalContentEditable)
- [n8n expression editor drag-drop bug](https://github.com/n8n-io/n8n/issues/10730)
- [ Hidden complexity of drag-drop](https://blog.scalar.com/p/the-hidden-complexity-of-building)
- Ultra UI codebase: `ui/components/expression-editor/`, `designs/`, `.planning/`

---
*Feature research for: Expression editor refactor (v0.5.0)*  
*Researched: 2026-02-12*
