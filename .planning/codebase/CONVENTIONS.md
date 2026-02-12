# Coding Conventions

**Analysis Date:** 2025-02-12

## Naming Patterns

**Files:**

- kebab-case for all files: `user-manage.ts`, `button-group.vue`, `date-range-picker.vue`
- Enforced by CLI generator: `cli/gen-component/index.ts` validates `/[a-z-]+/` for component names
- Vue components: `*.vue`
- Type definitions: `*.ts` in `ui/types/components/`
- Styles: `style.scss` + `style.ts` (entry)

**Functions:**

- camelCase: `handleClick`, `getContainerRect`, `validateSingleData`
- Handlers: `handle` prefix (`handleInput`, `handleFocus`, `handlePrefixClick`)
- Computed/getters: descriptive names (`classList`, `iconSize`, `ripple`)

**Variables:**

- camelCase: `modelValue`, `buttonRef`, `cls`
- Refs: `*Ref` suffix (`buttonRef`, `overlayRef`, `bodyRef`)
- Constants: UPPER_SNAKE_CASE (`FORM_EMPTY_CONTENT`, `NAME_SPACE`, `CLS_PREFIX`)

**Types:**

- `interface` for extensible objects: `ButtonProps`, `ComponentProps`, `FormModel`
- `type` for unions and utilities: `ButtonType`, `ComponentSize`, `Null<T>`
- Props: `{Component}Props` (e.g. `ButtonProps`, `InputProps`)
- Emits: `{Component}Emits` (e.g. `ButtonEmits`, `InputEmits`)
- Exposed: `_ButtonExposed` (internal), `ButtonExposed` (external, via `DeconstructValue`)

## Code Style

**Formatting:**

- Tool: oxfmt (cli uses `format` from `oxfmt`)
- Config: `.oxfmtrc.json`
  - `semi: false`
  - `singleQuote: true`
  - `trailingComma: none`
  - `objectWrap: collapse`
  - `experimentalSortImports: {}`

**Linting:**

- ESLint: referenced in `.gitignore` (`.eslintcache`), sample `components.d.ts` has `/* eslint-disable */`
- Biome: sample `components.d.ts` has `// biome-ignore lint: disable`
- No dedicated ESLint/Biome config files at root; oxfmt drives formatting

**TypeScript:**

- Strict typing; avoid `any` (per `dev-prompts/languages/typescript.md`)
- Prefer `interface` for extendable objects, `type` for unions and utilities
- No type errors allowed

## Import Organization

**Order (per `designs/08-best-practices.md`):**

1. Vue core: `import { ref, computed, watch } from 'vue'`
2. External deps: `import { debounce } from 'cat-kit/fe'`
3. Internal utils/compositions: `import { useConfig } from '@ui/compositions'`
4. Types: `import type { ButtonProps } from '@ui/types'` or `./button`

**Path Aliases:**

- `@ui/*` → `ui/*` (from `ui/tsconfig.json` paths)
- Examples: `@ui/types`, `@ui/utils`, `@ui/compositions`, `@ui/directives`

**Type imports:**

- `import type` for type-only imports

## Error Handling

**Patterns:**

- Validation errors: return `string | undefined` from validators (e.g. `ui/utils/form/validate.ts`)
- Throws for invalid input: `ui/styles/helper.ts` throws `throw new Error('ratio的值在0-1之间')`, `ui/components/watermark/base64.ts` throws for invalid input
- Component context: `console.warn` for misuse (e.g. `CardAction`/`CardHeader` outside `Card` in `ui/components/card/card-action.vue`)
- Async errors: `catch` with `console.error` (e.g. `ui/components/batch-edit/use-edit.ts`, `ui/compositions/use-lock/index.ts`)
- `console.error` for merge/props errors: `ui/compositions/use-component-props/index.ts`

**Patterns:**

- Early returns for invalid state
- Guard clauses with `if (!binding.value) return` (e.g. `ui/directives/click-outside/index.ts`)
- No broad try/catch; prefer localized error handling

## Logging

**Approach:**

- `console.warn` for development-time misuse (e.g. `v-focus` on non-input in `ui/directives/focus/index.ts`)
- `console.error` for runtime errors (e.g. `ui/components/batch-edit/use-edit.ts`)
- No structured logging framework; use `console` only

## Comments

**When to Comment:**

- Explain "why" and non-obvious logic, not "what" (per `AGENTS.md` and `designs/08-best-practices.md`)

**JSDoc:**

- Required for public API (per `dev-prompts/languages/typescript.md`)
- Used for: `@param`, `@returns`, `@default` on props
- Examples: `ui/utils/dom/style.ts`, `ui/utils/helper/make-bem.ts`, `ui/directives/ripple/ripple.ts`

## Function Design

**Parameters:**

- 3+ params → use object parameter (per `dev-prompts/languages/typescript.md`)
- Example: `useModel(options: ModelOptions<Props, Name>)`

**Return values:**

- Explicit return types for public APIs
- Validation returns `string | undefined` for error messages

**Size:**

- Single responsibility; avoid giant functions (per `designs/08-best-practices.md`)

## Module Design

**Exports:**

- Prefer named exports (per `dev-prompts/languages/typescript.md`)
- Components: `export { default as UButton } from './button.vue'` (e.g. `ui/components/button/index.ts`)

**Barrel files:**

- `index.ts` exports from submodules
- Pattern: `export * from './shared'`, `export * from './utils'`, etc.
- Example: `ui/index.ts`, `ui/utils/index.ts`

## Component Structure

**Per component directory (per `designs/08-best-practices.md`):**

```
button/
├── index.ts          # Exports
├── button.vue        # Component
├── style.scss         # Styles
├── style.ts           # Style entry
└── types in ui/types/components/button.ts
```

**Component conventions:**

- `defineOptions({ name: 'ComponentName' })` with PascalCase
- `defineProps<Props>()` with `withDefaults()` for defaults
- `defineEmits<Emits>()` with typed events
- `defineExpose` for exposed APIs

## BEM / Styling

**BEM:**

- `makeBEM` from `ui/utils/helper/make-bem.ts` with prefix `u-`
- Block: `cls.b`, Element: `cls.e('element')`, Modifier: `cls.m('modifier')`
- Is-state: `bem.is('disabled', props.disabled)`

**SCSS:**

- Mixins from `ui/styles/_mixins.scss`
- Design tokens via `fn.use-var` from `ui/styles/_functions.scss`
- `@use` for vars/mixins: `@use '../../styles/mixins' as m`

## Design Tokens

**Usage:**

- Use variables instead of hardcoded values (per `designs/08-best-practices.md`)
- `fn.use-var(text-color, main)`, `fn.use-var(radius, default)`

---

_Convention analysis: 2025-02-12_
