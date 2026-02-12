# Stack Research

**Domain:** Expression editor refactor (UX, parsing, keyboard, drag/drop, maintainability)
**Project:** Ultra UI
**Milestone:** v0.5.0 重构表达式组件
**Researched:** 2025-02-12
**Confidence:** HIGH

## Executive Summary

The expression editor refactor does **not** require new stack additions. The existing Lexical + Vue 3 + SCSS architecture is sufficient. The milestone should focus on **refining existing integrations** (Lexical clipboard, plain-text commands, design tokens) and **implementing stubbed features** (drag/drop) using APIs already available in `@lexical/clipboard` and `lexical`. No new editor libraries, syntax highlighters, or drag/drop frameworks should be added.

## Recommended Stack

### Core Technologies (Retain)

| Technology | Version | Purpose | Why Retain |
|------------|---------|---------|------------|
| lexical | ^0.40.0 | Editor engine | Framework-agnostic; already powers expression editor; supports DecoratorNode for VariableNode |
| @lexical/clipboard | ^0.40.0 | Clipboard, paste, drag/drop | Provides `$insertDataTransferForPlainText`, `$getClipboardDataFromSelection`, `setLexicalClipboardDataTransfer` for DROP |
| @lexical/utils | ^0.40.0 | Command registration | `mergeRegister`, `objectKlassEquals` used in plain-text.ts |
| Vue 3 | ^3.5.27 | UI framework | Already in use; expression-editor uses composables, Teleport |
| Vue JSX | — | use-decorators.tsx | VariableNode.decorate() returns VNode |

### Supporting Libraries (No Changes)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lexical | ^0.40.0 | Editor core | Expression editor engine |
| @lexical/clipboard | ^0.40.0 | Clipboard | COPY, CUT, PASTE, DROP handling |
| @lexical/utils | ^0.40.0 | Command utilities | Command registration, cleanup |

### Development Tools (No Changes)

| Tool | Purpose | Notes |
|------|---------|-------|
| bun | Package manager | Already used |
| Vitest | Unit tests | Add tests for parser, use-decorators, plain-text |
| TypeScript | Type safety | Strict mode |

## Integration Points with Ultra UI

| Component | Responsibility | Integration |
|-----------|----------------|-------------|
| **ui/styles/** | Design tokens | `fn.use-var(color, primary)`, `fn.use-var(gap, $size)` in expression-editor |
| **ui/utils/bem** | BEM classes | `cls.b`, `cls.e('container')` in expression-editor.vue |
| **ui/compositions** | Form props | `useFormComponent`, `useFormFallbackProps` |
| **ui/components/tag** | Variable node UI | `UTag` rendered in VariableNode.decorate() |
| **@floating-ui/dom** | Variable picker | `VariablePicker` via Floating UI for positioning |

## Stack Responsibilities: New vs Existing

| Layer | Existing | New for v0.5.0 |
|-------|----------|----------------|
| **Editor engine** | Lexical | — |
| **Clipboard** | @lexical/clipboard (copy/paste) | — |
| **Keyboard** | Plain-text commands | Fix arrow key handlers |
| **Drag/drop** | DROP/DRAGSTART stubbed | Implement using `$insertDataTransferForPlainText`, `$getClipboardDataFromSelection` |
| **Parsing** | Regex `/\{([^}]+)\}/g` | — |
| **Highlighting** | VariableNode decorators | — |
| **Styling** | SCSS + BEM + tokens | Visual refactor only |

## Implementation Guidance: Drag/Drop

**DROP_COMMAND** (plain-text.ts):

```typescript
import { $insertDataTransferForPlainText } from '@lexical/clipboard'

editor.registerCommand<DragEvent>(
  DROP_COMMAND,
  event => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return false
    const clipboardData = event.dataTransfer
    if (clipboardData != null) {
      event.preventDefault()
      $insertDataTransferForPlainText(clipboardData, selection)
      return true
    }
    return false
  },
  COMMAND_PRIORITY_EDITOR
)
```

**DRAGSTART_COMMAND**: Use `$getClipboardDataFromSelection` + `setLexicalClipboardDataTransfer` for Lexical JSON, or `clipboardData.setData('text/plain', selection.getTextContent())` for plain text. VariableNode already serializes via `getTextContent()` → `{variable}`.

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| @lexical/react | React-based; Ultra UI is Vue | Lexical core (framework-agnostic) |
| CodeMirror (for expression editor) | Different model; CodeMirror is for full code editing | Lexical (already in use) |
| @lexical/draggable-block-plugin | React-only; DraggableBlockPlugin_EXPERIMENTAL | Native DROP_COMMAND + DRAGSTART_COMMAND |
| vue-draggable | Adds another DnD model; Lexical owns editor | Lexical commands |
| Syntax highlighting lib (e.g. Prism) | Expression format is `{var}` + plain text; no full syntax | Regex parser + VariableNode decorators |
| Ace editor | Overkill; heavyweight | Lexical |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Implement DROP via $insertDataTransferForPlainText | $insertDataTransferForRichText | If expression editor later needs rich text (e.g. HTML) |
| Keep regex parser | Lezer / custom grammar | Only if expression format becomes complex (e.g. nested expressions) |
| Keep Lexical | CodeMirror | If replacing entire expression editor with a code-style editor |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| lexical ^0.40.0 | @lexical/clipboard ^0.40.0, @lexical/utils ^0.40.0 | Must match; no mixed versions |
| @lexical/clipboard ^0.40.0 | lexical 0.40.0 | Peer dependency |

## Installation

No new packages required for v0.5.0. Existing dependencies:

```bash
# Already in ui/package.json
bun add lexical @lexical/clipboard @lexical/utils
```

## Milestone-Aware Checklist

- [ ] **Visual refactor**: Use existing `fn.use-var()`, `@include m.bem()`, no new libs
- [ ] **Parsing**: Improve regex edge cases if needed; no new parser library
- [ ] **Keyboard**: Fix commented arrow handlers in plain-text.ts; no new commands lib
- [ ] **Drag/drop**: Implement DROP using `$insertDataTransferForPlainText`; DRAGSTART using `setLexicalClipboardDataTransfer` or `setData('text/plain', ...)`
- [ ] **Maintainability**: Refactor into modules (e.g. `use-drag-drop.ts`, `use-keyboard.ts`) without new dependencies

## Sources

- [Lexical @lexical/clipboard API](https://lexical.dev/docs/api/modules/lexical_clipboard) — `$insertDataTransferForPlainText`, `$getClipboardDataFromSelection`
- [Lexical DraggableBlockPlugin](https://lexical.dev/docs/api/modules/lexical_react_LexicalDraggableBlockPlugin) — React-only; not applicable
- [CONCERNS.md](.planning/codebase/CONCERNS.md) — Expression editor drag-drop stubbed
- [plain-text.ts](ui/components/expression-editor/plain-text.ts) — DROP_COMMAND, DRAGSTART_COMMAND TODO
- [Lexical 0.40](https://github.com/facebook/lexical/releases) — Current version

---
*Stack research for: Ultra UI v0.5.0 重构表达式组件*
*Researched: 2025-02-12*
