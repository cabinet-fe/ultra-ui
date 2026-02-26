# Phase 4: Drag-Drop - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers consistent drag/drop behavior for expression editing, aligned with documented interaction expectations for the component. The scope is limited to how existing expression content is reordered within the current expression area, without adding new capabilities.

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<specifics>
## Specific Ideas

No external product reference was specified. Priority is predictable desktop drag behavior with low-friction visual feedback.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-drag-drop*
*Context gathered: 2026-02-26*
