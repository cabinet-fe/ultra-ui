# Phase 4: Drag-Drop - Research

**Researched:** 2026-02-26
**Domain:** Lexical-based variable-node drag/drop in expression editor
**Confidence:** MEDIUM-HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Draggable Scope
- Draggable unit is variable nodes only (`{variable}`), not generic text fragments.
- Reordering is limited to the current expression area (no cross-area movement).
- Drag/drop is internal-only (no drag in/out with external targets).
- Content must be preserved strictly after drag/drop, including whitespace and exact characters.

### Drag Start and Feedback
- Primary trigger is direct drag on the draggable node.
- Phase 4 prioritizes desktop behavior; mobile drag behavior can be documented as limited for now.
- Drag feedback uses simple ghost preview plus insertion indicator.
- Auto-scroll is enabled when dragging near scrollable container edges.

### Equivalent Interaction and Documentation Alignment
- Equivalent interaction is required only when native drag/drop is not supported.
- Preferred equivalent interaction is explicit "move up / move down" controls.
- Documentation should include clear state and edge-case rules (not only high-level description).
- If implementation and docs diverge temporarily, code behavior is source of truth and docs should be updated accordingly.

### Claude's Discretion
- Drop target granularity (exact legal insertion positions) within the selected variable-node-only model.
- Behavior when dropping over plain text regions (snap/reject strategy and indicator details).
- Invalid-drop response style (silent revert vs lightweight feedback).
- Post-drop focus semantics (focus moved item vs editor caret) as long as behavior stays consistent and documented.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UX-03 | User can perform expression drag/drop (or equivalent documented interaction) with behavior consistent with component documentation. | Defines native DnD command handling in Lexical, variable-node-only reorder rules, fallback move up/down interaction for unsupported native DnD, and a required behavior matrix to keep implementation/docs aligned. |
</phase_requirements>

## Summary

Phase 4 should be implemented as a **Lexical-command-driven, variable-node-only internal reorder system**, not a generic DOM sorter. Current code in `ui/components/expression-editor/plain-text.ts` still blocks `DROP_COMMAND` and `DRAGSTART_COMMAND` with `preventDefault()` TODO stubs, and upstream Lexical plain-text source has the same TODO, so this project must provide explicit behavior for variable-node drag/drop inside the editor model.

For browser behavior, use standard HTML Drag and Drop constraints: set payload/effects during `dragstart`, allow drop by canceling `dragover`, and resolve insertion in `drop`. For UX consistency with your locked decisions, make insertion targets explicit and deterministic (slot-based), show a lightweight insertion indicator, and keep invalid drop handling simple (revert + optional lightweight hint).

For accessibility/compatibility, native DnD remains desktop-first in this phase; equivalent interaction should be concrete "move up/down" controls when native support is unavailable. Documentation must include exact edge rules (legal targets, plain-text hover behavior, invalid drops, focus after drop), and if behavior changes, docs follow code immediately.

**Primary recommendation:** Implement variable-node slot reordering via Lexical commands and node operations, with deterministic slot mapping + native-fallback move controls, and publish a concise behavior matrix as the contract for UX-03.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `lexical` | `^0.40.0` | Editor state, command bus, node model | Existing editor foundation; drag/drop hooks are Lexical commands |
| `@lexical/clipboard` | `^0.40.0` | DataTransfer/text interoperability | Already used in plain-text flow; avoids custom clipboard/transfer edge handling |
| `@lexical/utils` | `^0.40.0` | command listener composition | Existing pattern (`mergeRegister`) in current implementation |
| HTML Drag and Drop API | Browser native | dragstart/dragover/drop lifecycle | Required for desktop native DnD and ghost feedback behavior |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vue` | `^3.5.27` | UI state + fallback control rendering | For move up/down controls and drag state indicator |
| DOM `DataTransfer` (`effectAllowed`/`dropEffect`/`setDragImage`) | Browser native | ghost and operation feedback | To enforce move semantics and simple preview |
| DOM scrolling (`Element.scrollBy`) | Browser native | edge auto-scroll | During dragover near container edges |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Lexical command handling | Generic DOM sort (`use-sort`) | DOM reorder desyncs from Lexical state; high corruption risk |
| Native DnD primary on all devices | Touch-first custom DnD framework | Out of locked scope; adds complexity not required for Phase 4 |
| Snap-to-nearest slot on plain text hover | Reject-only plain-text hover | Reject-only is simpler but less "low-friction" than requested UX |

**Installation:**
```bash
# No new dependency is required for Phase 4.
# Keep these existing versions aligned in ui/package.json:
bun add lexical @lexical/clipboard @lexical/utils
```

## Architecture Patterns

### Recommended Project Structure
```
ui/components/expression-editor/
├── plain-text.ts              # register DRAGSTART/DRAGOVER/DROP commands
├── use-editor.ts              # editor lifecycle; attach registerPlainText
├── use-expression-drag-drop.ts # (recommended new) slot math + drag state
├── nodes/variable-node.tsx    # draggable DOM marker + serialization text
├── expression-editor.vue      # orchestration + fallback move controls
└── style.scss                 # insertion line, dragging state, fallback controls
```

### Pattern 1: Slot-Based Reorder (Variable Nodes Only)
**What:** Define legal insertion positions as slots around variable nodes in current expression root only.
**When to use:** Every dragover/drop path; this is the canonical target model.
**Example:**
```typescript
// Source: lexical node APIs + project constraints
// slot i means "insert before variable[i]" and tail slot means append after last variable.
type DragSlot = { index: number; beforeNodeKey?: string }
```

### Pattern 2: Lexical-First Mutations (Never DOM-Only Reorder)
**What:** Resolve drag source/target in DOM, but perform reorder only in `editor.update`.
**When to use:** All successful drop operations.
**Example:**
```typescript
// Source: https://lexical.dev/docs/concepts/commands
editor.registerCommand(DROP_COMMAND, (event) => {
  event.preventDefault()
  editor.update(() => {
    // 1) read source variable key from dataTransfer
    // 2) resolve target slot
    // 3) move node with lexical node operations
  })
  return true
}, COMMAND_PRIORITY_EDITOR)
```

### Pattern 3: Plain-Text Hover Normalization
**What:** When hovering plain text, map pointer to nearest legal variable slot (recommended: snap, not reject).
**When to use:** `dragover` over non-variable text spans.
**Example:**
```typescript
// Source: MDN dragover + custom insertion marker pattern
target.addEventListener('dragover', (event) => {
  event.preventDefault() // required so drop can fire
  event.dataTransfer!.dropEffect = 'move'
  // compute nearest slot and render insertion indicator
})
```

### Pattern 4: Equivalent Interaction Fallback
**What:** Render explicit move up/down controls only when native drag/drop is unsupported.
**When to use:** capability detection fails or known unsupported environment.
**Example:**
```typescript
function moveVariable(oldIndex: number, direction: -1 | 1) {
  const nextIndex = oldIndex + direction
  if (nextIndex < 0 || nextIndex >= variableNodes.length) return
  reorderByIndex(oldIndex, nextIndex) // same lexical reorder path as drop
}
```

### Anti-Patterns to Avoid
- **DOM-only swapping:** Reordering DOM children without Lexical node updates causes model/view divergence.
- **Cross-area drag acceptance:** Violates locked scope (internal current-expression only).
- **Generic text fragment drag:** Violates locked draggable scope (variable nodes only).
- **Undocumented silent behavior drift:** Violates UX-03 documentation consistency requirement.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command routing | Ad-hoc `addEventListener` chain only | Lexical `registerCommand` for drag lifecycle | Editor event arbitration is command-priority-based |
| Reorder persistence | Manual text string surgery | Lexical node move operations in `editor.update` | Preserves node semantics and avoids parser corruption |
| Drop validity feedback | Custom cursor hacks only | `dropEffect/effectAllowed` + insertion indicator | Standard feedback model; less browser-specific risk |
| Fallback interaction | Implicit keyboard magic only | Explicit move up/down controls | Meets locked equivalent interaction requirement clearly |

**Key insight:** Keep one reorder engine (Lexical node move) and expose two triggers (native drag or move controls). This minimizes divergence and test matrix size.

## Common Pitfalls

### Pitfall 1: Current Stub Blocks All DnD
**What goes wrong:** Drag/drop appears non-functional because `DRAGSTART_COMMAND` and `DROP_COMMAND` always `preventDefault` and return handled.
**Why it happens:** Upstream plain-text plugin ships TODO stubs; project inherited pattern.
**How to avoid:** Replace stubs with full source/target handling for variable-node-only moves.
**Warning signs:** Drag starts never shows usable move behavior; drop always no-op.

### Pitfall 2: Drop Never Fires
**What goes wrong:** `drop` handler not triggered on intended target.
**Why it happens:** `dragover` not canceled (`event.preventDefault()` missing).
**How to avoid:** Always cancel `dragover` on legal targets and set `dropEffect='move'`.
**Warning signs:** Cursor shows "not allowed"; no drop callback.

### Pitfall 3: DataTransfer Misuse
**What goes wrong:** Drag payload missing or stale.
**Why it happens:** Attempting to write transfer data outside `dragstart`, or read outside `drop`.
**How to avoid:** Write in `dragstart`, read in `drop`, keep payload minimal (`nodeKey`, operation).
**Warning signs:** `dataTransfer.getData(...)` empty at drop.

### Pitfall 4: Text Corruption Around Variables
**What goes wrong:** Whitespace or exact character sequence changes unexpectedly after reorder.
**Why it happens:** Rebuild by text slicing instead of node move semantics.
**How to avoid:** Move only variable nodes; do not mutate neighboring text nodes unless explicitly required.
**Warning signs:** Extra/missing spaces, changed braces, altered serialization.

### Pitfall 5: Mobile/Desktop Contract Confusion
**What goes wrong:** Users expect touch drag parity but behavior is partial.
**Why it happens:** Native HTML DnD support is inconsistent on some mobile browsers.
**How to avoid:** Document desktop-first clearly; provide fallback move controls when native unsupported.
**Warning signs:** Touch drag does nothing while desktop works.

## Code Examples

Verified patterns from official sources:

### Enable Drop Target Correctly
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragover_event
dropElement.addEventListener('dragover', (event) => {
  event.preventDefault() // required so drop can fire
  event.dataTransfer!.dropEffect = 'move'
})
```

### Set Drag Payload + Ghost Feedback
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragstart_event
// Source: https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/setDragImage
nodeEl.addEventListener('dragstart', (event) => {
  event.dataTransfer!.effectAllowed = 'move'
  event.dataTransfer!.setData('application/x-ultra-variable-key', variableNodeKey)
  event.dataTransfer!.setDragImage(ghostEl, 8, 8)
})
```

### Lexical Command Registration for DnD
```typescript
// Source: https://lexical.dev/docs/concepts/commands
const cleanup = mergeRegister(
  editor.registerCommand(DRAGSTART_COMMAND, (event) => {
    // populate DataTransfer, mark dragging source
    return true
  }, COMMAND_PRIORITY_EDITOR),
  editor.registerCommand(DROP_COMMAND, (event) => {
    // resolve slot, reorder variable node in editor.update
    return true
  }, COMMAND_PRIORITY_EDITOR)
)
```

### Auto-Scroll Near Container Edge
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollBy
function autoScroll(container: HTMLElement, pointerY: number) {
  const rect = container.getBoundingClientRect()
  const threshold = 24
  if (pointerY < rect.top + threshold) container.scrollBy({ top: -8, behavior: 'auto' })
  if (pointerY > rect.bottom - threshold) container.scrollBy({ top: 8, behavior: 'auto' })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stubbed plain-text DnD (`preventDefault` only) | Project-level Lexical command implementation for variable-node reorder | Phase 4 | Converts blocked behavior into deterministic reorder |
| DOM list swapping for drag visuals | Slot mapping + Lexical node move in `editor.update` | Phase 4 | Avoids model desync and text corruption |
| Implicit/undocumented fallback | Explicit move up/down fallback when native unsupported | Phase 4 | Meets UX-03 equivalent interaction requirement |

**Deprecated/outdated:**
- `dropzone` attribute as a strategy: not supported in browsers (per Can I Use).
- Assuming mobile drag parity with desktop native DnD: risky; support remains uneven across mobile browsers.

## Open Questions

1. **Exact legal slot model in mixed text+variable lines**
   - What we know: Drag unit is variable node only; plain text cannot become drag source.
   - What's unclear: Whether all inter-variable boundaries are legal when hovering dense plain text.
   - Recommendation: Use full slot model around variable nodes and snap plain-text hover to nearest legal slot.

2. **Invalid-drop feedback level**
   - What we know: Invalid drops must not corrupt content.
   - What's unclear: Whether UX wants fully silent revert or minimal hint.
   - Recommendation: Default to silent revert + subtle insertion-indicator fade-out (no blocking toast).

3. **Post-drop focus semantics**
   - What we know: Must be consistent and documented.
   - What's unclear: Focus moved variable vs editor caret after reorder.
   - Recommendation: Keep focus on moved variable for immediate repeat drag, then place caret at end on blur/confirm flows.

4. **Documentation surface in this repo**
   - What we know: Sample docs currently describe `@` picker flow only.
   - What's unclear: Whether public docs are generated elsewhere.
   - Recommendation: At minimum update `sample/src/expression-editor/index.vue` with drag/drop + fallback behavior matrix.

## Sources

### Primary (HIGH confidence)
- Context7 library ID `/websites/lexical_dev` - verified `DRAGSTART_COMMAND`, `DRAGOVER_COMMAND`, `DROP_COMMAND` API references
- Lexical Commands docs: https://lexical.dev/docs/concepts/commands
- Lexical plain-text source (upstream TODO state): https://raw.githubusercontent.com/facebook/lexical/main/packages/lexical-plain-text/src/index.ts
- MDN HTML Drag and Drop API: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
- MDN Drag operations: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations
- MDN dragstart/dragover/drop:
  - https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragstart_event
  - https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragover_event
  - https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drop_event
- MDN DataTransfer APIs:
  - https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/setDragImage
  - https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/effectAllowed
  - https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/dropEffect
  - https://developer.mozilla.org/en-US/docs/Web/API/DragEvent/dataTransfer
- WAI-ARIA APG rearrangeable listbox example (explicit move controls): https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/
- Codebase files:
  - `ui/components/expression-editor/plain-text.ts`
  - `ui/components/expression-editor/nodes/variable-node.tsx`
  - `ui/components/expression-editor/expression-editor.vue`
  - `ui/components/expression-editor/use-editor.ts`

### Secondary (MEDIUM confidence)
- Can I Use drag and drop support matrix: https://caniuse.com/dragndrop (used to justify desktop-first + fallback strategy)
- Lexical React draggable block plugin API (React-only, EXPERIMENTAL): https://lexical.dev/docs/api/modules/lexical_react_LexicalDraggableBlockPlugin

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions and dependencies verified in `ui/package.json`, APIs verified in MDN/Context7/official source.
- Architecture: MEDIUM-HIGH - core pattern is solid, but slot granularity/plain-text snap semantics still require explicit product decision.
- Pitfalls: HIGH - directly evidenced by current code stubs + official drag/drop lifecycle constraints.

**Research date:** 2026-02-26
**Valid until:** 30 days (stable APIs, but mobile/browser behavior should be spot-checked before release)
