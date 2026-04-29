# Collapse (Accordion) Component Design

## Overview
A Vue 3 Collapse component (often referred to as an Accordion) that allows users to toggle the visibility of multiple content panels. It provides a compact way to present structured information without overwhelming the user.

## Functional Requirements
- **Modes**: Supports both multiple panel expansion (default) and single panel expansion (`accordion` mode).
- **Controlled/Uncontrolled**: The active panel(s) can be controlled via `v-model` or operate independently.
- **Accessibility**: Includes proper ARIA attributes (e.g., `aria-expanded`, `aria-controls`, `role="region"`) and keyboard navigation support (Enter/Space to toggle, arrow keys to navigate headers).

## Visual Style
- **Bordered Style**: The component is wrapped in a border, with shared borders between adjacent items. This style is compact and resembles a table layout, matching the user's selected preference.
- **Icon**: A chevron icon (or similar) on the right (or left) side of the header indicating expand/collapse state.

## API Design

### `Collapse` Component
The parent container that manages the state of its children.

#### Props
- `modelValue` (`string | string[] | number | number[]`): The currently active panel value(s). If `accordion` is true, this is a single value; otherwise, it's an array.
- `accordion` (`boolean`, default: `false`): If true, only one panel can be open at a time.

#### Events
- `update:modelValue` (value: `string | string[] | number | number[]`): Emitted when the active panel changes.
- `change` (value: `string | string[] | number | number[]`): Emitted when the active panel changes (alias for `update:modelValue` or potentially carrying additional context if needed).

### `CollapseItem` Component
The individual panel within the `Collapse`.

#### Props
- `value` (`string | number`): Unique identifier for the item. Required.
- `title` (`string`): The title text to display in the header.
- `disabled` (`boolean`, default: `false`): If true, the item cannot be toggled.

#### Slots
- `default`: The content of the panel.
- `title`: Custom content for the header (overrides `title` prop).
- `icon`: Custom expand/collapse icon.

## Implementation Strategy
- **Context/Provide**: The `Collapse` component will use Vue's `provide/inject` API to share its state (active items, accordion mode) and a toggle method with its `CollapseItem` children.
- **Animations**: Use a custom transition or CSS transitions (e.g., `max-height` with `grid-template-rows: 0fr` to `1fr`) for smooth expand/collapse animations.
- **Structure**: We will follow the existing project structure in `packages/desktop/src/components/`, creating a new `collapse` directory with `collapse.vue`, `collapse-item.vue`, `index.ts`, and `style.scss`.

## Testing Strategy
- Unit tests to verify `v-model` binding in both standard and `accordion` modes.
- Tests ensuring `disabled` items cannot be toggled.
- Verification of ARIA attributes being applied and updated correctly upon toggle.