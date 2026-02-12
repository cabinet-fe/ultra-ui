# Project Research Summary

**Project:** Ultra UI
**Domain:** Expression editor refactor (Vue + Lexical, brownfield)
**Milestone:** v0.5.0 重构表达式组件
**Researched:** 2025-02-12
**Confidence:** HIGH

## Executive Summary

The expression-editor refactor is a brownfield refinement of an existing Lexical-based Vue component. Experts build such editors by keeping the editor engine (Lexical), avoiding new libraries, and fixing integration points: model sync, clipboard/drag-drop, and design tokens. The existing stack—Lexical, @lexical/clipboard, Vue 3, SCSS—is sufficient; no new packages are required.

The recommended approach is to (1) refresh visuals with design tokens, (2) stabilize model sync and IME before any UX polish, (3) decide on drag-drop: either implement both DROP and DRAGSTART via Lexical APIs or document as unsupported and avoid preventDefault, and (4) refactor internals into clearer modules without changing the public API. The main risks are selection/changeByUser races during modelValue sync, IME composition interruption, and half-implemented drag-drop. Mitigation: strengthen use-editor guards, add `isComposing` checks, and either fully implement or explicitly document drag-drop non-support.

## Key Findings

### Recommended Stack

No new stack additions. Refine existing integrations.

**Core technologies (retain):**
- **lexical** ^0.40.0 — Editor engine; supports DecoratorNode for VariableNode
- **@lexical/clipboard** ^0.40.0 — `$insertDataTransferForPlainText`, `$getClipboardDataFromSelection`, `setLexicalClipboardDataTransfer` for DROP/DRAGSTART
- **@lexical/utils** ^0.40.0 — mergeRegister, command registration
- **Vue 3** — Composition API, provider/inject, Teleport
- **SCSS + BEM + design tokens** — `fn.use-var()`, `m.bem()`; replace hardcoded colors in style.scss

**Avoid:** @lexical/react, CodeMirror, vue-draggable, DraggableBlockPlugin_EXPERIMENTAL (React-only), syntax highlighting libs.

### Expected Features

Table stakes already exist: variable insertion via @, picker with search, placeholder, disabled/readonly, copy/paste, variable chips. Focus v0.5.0 on gaps.

**Must have (v0.5.0):**
- Visual consistency — replace hardcoded colors with design tokens
- Internal module refactor — clearer boundaries, testable modules
- Drag-drop decision — implement or remove/document; no stubs

**Should have (v0.5.x):**
- `isInvalid` prop for error styling
- ARIA improvements for picker

**Defer (v0.6+):**
- Full drag-drop reorder — high complexity; cut/paste or keyboard reorder instead
- Real-time syntax validation — belongs in consumer
- Rich text, AI suggestions, multi-line formula builder — anti-features

### Architecture Approach

Expression-editor is a Lexical-based component with use-editor, use-context, use-decorators, plain-text commands, parser, DI, and variable-node/variable-picker. Refactor preserves public API and decomposes internals.

**Major components:**
1. **expression-editor.vue** — Root, DI provide, orchestration; wires useEditor, useContext, useDecorators
2. **use-editor.ts** — Lexical lifecycle, model↔content sync; critical for stability
3. **use-context.ts** — @ trigger, variable picker state; command priority at COMMAND_PRIORITY_LOW
4. **plain-text.ts** — Copy/paste/drop/drag commands; DROP/DRAGSTART currently stubbed
5. **parser.ts** — Regex `/\{([^}]+)\}/g`; stable API; do not change format

**New modules:** `use-expression-drag-drop.ts` for DROP/DRAGSTART, or document non-support.

### Critical Pitfalls

1. **Selection state lost during modelValue sync** — Use `SKIP_DOM_SELECTION_TAG`; compare modelValue with editor state before `renderModelValue`; strengthen changeByUser guard.

2. **changeByUser / changeByModel race** — Use equality check (modelValue vs last emitted); avoid synchronous parent mutation of modelValue in response to update:modelValue.

3. **IME composition interrupted** — Never `preventDefault` without `event.isComposing`; defer `editor.update()` until compositionend; rely on Lexical CONTROLLED_TEXT_INSERTION_COMMAND.

4. **Drag/drop half-implementation** — Either implement both DROP and DRAGSTART via `$insertDataTransferForPlainText` and `setLexicalClipboardDataTransfer`, or document as unsupported and avoid preventDefault.

5. **Command priority conflicts** — Document: COMMAND_PRIORITY_LOW for picker interception, COMMAND_PRIORITY_EDITOR for core. Search existing registrations before adding handlers.

6. **Vue reactivity caret jump** — Avoid v-if on container; use v-show for placeholder; keep container ref stable.

7. **Stale textNode/charPosition on variable insertion** — Revalidate selection at selection time; recompute insertion point from current selection.

8. **Serialization format break** — Treat `{variable}` and regex as stable API; add fixture tests for round-trip.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Types and Styles (No Behavior Change)

**Rationale:** Pure visual and type changes; no regression risk.
**Delivers:** Design token adoption in style.scss; optional emit types for drag events.
**Addresses:** Visual consistency (P1)
**Avoids:** Vue reactivity caret jump (use v-show for placeholder; stable container)

### Phase 2: Stabilize Model Sync and Core (Refactor)

**Rationale:** Must fix before any UX polish; prevents selection loss and changeByUser race.
**Delivers:** Strengthened use-editor guards; SKIP_DOM_SELECTION_TAG; equality check before renderModelValue; IME-safe preventDefault; variable insertion revalidation.
**Addresses:** Stability, maintainability
**Avoids:** Selection lost, changeByUser race, IME interrupted, stale variable insertion
**Research flag:** Needs manual verification with IME (Zh/Ja/Ko) and form validation scenarios.

### Phase 3: Drag-Drop Decision and Implementation

**Rationale:** Clear decision; no stubs. Either implement or document.
**Delivers:** `use-expression-drag-drop.ts` with DROP (via `$insertDataTransferForPlainText`) and DRAGSTART (via `$getClipboardDataFromSelection` + `setLexicalClipboardDataTransfer`), or explicit non-support docs.
**Addresses:** Drag-drop decision (P1)
**Avoids:** Drag/drop half-implementation
**Research flag:** If implementing, Lexical clipboard API is documented; no extra research needed.

### Phase 4: Module Refactor (Optional)

**Rationale:** Improves structure; lower priority than stability.
**Delivers:** Extract handleVariableSelect to `use-variable-insert.ts`; modular commands if plain-text grows; testable parser exports.
**Addresses:** Internal module refactor (P1)
**Avoids:** Command priority conflicts (document and preserve order)

### Phase 5: Polish and Verification

**Rationale:** Final validation and sample demos.
**Delivers:** Variable-node styling polish; sample with drag-drop demo; fixture tests for serialization round-trip.
**Addresses:** Backward compatibility verification
**Avoids:** Serialization break

### Phase Ordering Rationale

- Phase 1 first: styles are independent; establishes visual baseline.
- Phase 2 before drag-drop: model sync and IME fixes underpin all editing; dragging triggers updates that flow through same sync.
- Phase 3 follows: drag-drop uses Lexical clipboard; no dependency on refactor.
- Phase 4 optional: improves maintainability without blocking.
- Phase 5 last: verification depends on all changes.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** IME behavior on target platforms (iOS Korean, Zh/Ja); form validation patterns with v-model transformation.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Design tokens and BEM are in-place; no new patterns.
- **Phase 3:** Lexical clipboard API is documented; $insertDataTransferForPlainText is the recommended path.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Lexical 0.40 docs; clipboard API verified; no mixed versions |
| Features | HIGH | Competitor analysis; table stakes mapped; P1/P2 clear |
| Architecture | HIGH | Codebase inspected; integration points documented; build order justified |
| Pitfalls | HIGH | Lexical issues, Vue contenteditable patterns, n8n drag-drop; recovery strategies listed |

**Overall confidence:** HIGH

### Gaps to Address

- **IME on iOS Korean:** Lexical has known issues (#5841); rely on built-in beforeinput; avoid custom handlers.
- **Consumer modelValue transformation:** Document that consumers should not synchronously mutate modelValue in response to update:modelValue when the same value is written; use flush: 'post' or defer if needed.
- **Variable list size:** UScroll used; consider virtual list if 1000+ items become common.

## Sources

### Primary (HIGH confidence)
- Lexical @lexical/clipboard API — `$insertDataTransferForPlainText`, `$getClipboardDataFromSelection`
- Lexical Design — update mechanism, tags
- Ultra UI codebase — expression-editor, use-editor, use-context, plain-text, parser, di

### Secondary (MEDIUM confidence)
- Lexical GitHub #5841 — Korean IME on iOS
- ContentEditable Vue cursor jump — Vue reactivity and contenteditable
- n8n expression editor drag-drop bug — complexity of full drag-drop
- CONCERNS.md — expression-editor tech debt

### Tertiary (LOW confidence)
- Elastic UI Expression, Appian/DevExpress — competitor feature comparison

---
*Research completed: 2025-02-12*
*Ready for roadmap: yes*
