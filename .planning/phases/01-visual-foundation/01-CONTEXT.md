# Phase 1: Visual Foundation - Context

**Gathered:** 2026-02-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers visual alignment of the expression editor with Ultra UI design language, including consistent design-token-based styling and clear visual feedback for default, focus, disabled, and readonly states. It also covers consistent, stable presentation of variable nodes and variable picker panels, without adding new capabilities beyond visual foundation.

</domain>

<decisions>
## Implementation Decisions

### Editor Container Visual Style
- Default shadow: none; rely on border/background for structure.
- Spacing density: compact (higher information density).

### State Feedback Expression
- Focus state uses border change as the primary visual signal.
- Disabled and readonly states must be highly distinguishable at a glance.
- Readonly should not show editable caret feel; view/copy oriented.
- State transitions should be instant (no visible transition animation).

### Variable Node Style
- Use chip/tag-like node appearance.
- Use a single accent color strategy for all variable nodes.
- Long variable names use ellipsis with hover tooltip for full value.
- Node content includes variable name plus short type indicator.

### Variable Picker Panel Experience
- Panel visual hierarchy should be strong and clearly elevated.
- Show/hide motion should use subtle fade (not abrupt toggle, not heavy motion).
- Candidate list density should be balanced (readability and quantity in balance).

### Claude's Discretion
- Exact visual weight (border contrast/detail levels) of the editor container.
- Container corner radius choice aligned with existing Ultra UI components.
- Empty/loading state visual specifics for variable picker panel.

</decisions>

<specifics>
## Specific Ideas

No external product references were specified; decisions focus on concrete visual/interaction preferences above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-visual-foundation*
*Context gathered: 2026-02-12*
