# Architecture

**Analysis Date:** 2025-02-12

## Pattern Overview

**Overall:** Monorepo Vue 3 component library with layered composition, provider/inject for composite components, and functional API for imperative usage.

**Key Characteristics:**

- Vue 3 Composition API with `<script setup>`
- BEM-based styling with shared SCSS variables and mixins
- Vue `provide/inject` for parent-child context in composite components (Table, Menu, Tree, etc.)
- `@ui` path alias for internal imports within the library
- Workspace-based monorepo (bun workspaces): `ui`, `sample`, `cli`, `build`

## Layers

**Component Layer:**

- Purpose: Individual UI components (Button, Input, Dialog, etc.)
- Location: `ui/components/`
- Contains: `.vue` files, `index.ts` (exports), `style.scss`, `style.ts` (style entry), optional `di.ts` (injection keys)
- Depends on: types, compositions, utils, shared, directives
- Used by: Sample app, consuming applications

**Composition Layer:**

- Purpose: Reusable logic (useModel, usePop, useFormComponent, useConfig)
- Location: `ui/compositions/`
- Contains: Composition functions used across multiple components
- Depends on: Vue reactivity, types, utils
- Used by: Components

**Directive Layer:**

- Purpose: DOM-level behavior (ripple, click-outside, focus)
- Location: `ui/directives/`
- Contains: Vue directives with optional style entry
- Depends on: Vue directive API
- Used by: Components, install.ts

**Types Layer:**

- Purpose: Props, emits, and shared type definitions
- Location: `ui/types/`
- Contains: `component-common.ts`, `components/*.ts` (per-component types), `helper.ts`
- Depends on: Vue types
- Used by: Components, compositions, consuming applications

**Utils Layer:**

- Purpose: DOM helpers, form validation, BEM factory, reactive utilities
- Location: `ui/utils/`
- Contains: `dom/`, `form/`, `helper/`, `reactive/`
- Depends on: None (library-agnostic)
- Used by: Components, compositions

**Styles Layer:**

- Purpose: Theme, variables, mixins, animations, normalize
- Location: `ui/styles/`
- Contains: `_vars.scss`, `_mixins.scss`, `_functions.scss`, `theme/`, `anime/`
- Depends on: None
- Used by: Component styles (via `@ui/styles/...`)

**Shared Layer:**

- Purpose: Constants (CLS_PREFIX, NAME_SPACE, FORM_EMPTY_CONTENT)
- Location: `ui/shared/`
- Contains: `constants.ts`, `index.ts`
- Used by: Components, utils

## Data Flow

**Form Model Flow:**

1. `UForm` receives `model` prop (FormModel or DynamicFormModel)
2. `useFormComponent(props)` provides form context via `FormComponentDIKey`
3. Child form controls call `useFormComponent()` to get `formProps` and `inForm`
4. `useFormFallbackProps([formProps, props])` resolves size/disabled/readonly from form → props → global config
5. Form items bind `model.data` via `getChainValue`/`setChainValue` from `cat-kit/fe`

**Config Flow:**

1. `useConfig()` returns reactive `config` and `setConfig`
2. Global state (size, animation, form.labelWidth, paginator) stored in `ui/compositions/use-config/index.ts`
3. Components use `useFallbackProps` to cascade: component props → form props → global config
4. Sample app sets config in `App.vue` via `setConfig({ size: size.value })`

**Theme Flow:**

1. `loadTheme(theme)` sets `currentTheme` and calls `theme.render()`
2. Themes (`lightTheme`, `darkTheme`) inject CSS variables into `document.documentElement`
3. SCSS uses `var(--color-primary)`, `use-var(bg-color, top)` etc.

**Popover/Dropdown Positioning:**

1. `usePop` uses `@floating-ui/dom` for positioning
2. Components pass `triggerRef`, `contentRef`, `arrowRef`, `direction`, `alignment`
3. Single `#pop-container` in `document.body` for portaled content

## Key Abstractions

**Provider/Inject (DI):**

- Purpose: Share context from parent to nested children without prop drilling
- Pattern: `di.ts` defines `InjectionKey`, parent calls `provide(Key, ctx)`, children call `inject(Key)`
- Examples: `ui/components/table/di.ts`, `ui/components/menu/di.ts`, `ui/components/tree/di.ts`, `ui/components/form` via `useFormComponent`

**BEM Factory:**

- Purpose: Consistent class naming (`u-input`, `u-input__native`, `u-input--small`)
- Implementation: `ui/utils/helper/make-bem.ts`, `ui/utils/dom/class-name.ts`
- Usage: `const cls = bem('input')` then `cls.b`, `cls.e('native')`, `cls.m('disabled')`

**useModel:**

- Purpose: Two-way binding for v-model with optional local/controlled modes
- Location: `ui/compositions/use-model/index.ts`
- Pattern: `useModel({ props, emit, propName, local, defaultValue })`

**useFormFallbackProps / useFallbackProps:**

- Purpose: Resolve prop priority: component props → form props → global config
- Location: `ui/compositions/use-fallback-props/index.ts`
- Used by: Form controls (Input, Select, etc.)

**FormModel / DynamicFormModel:**

- Purpose: Typed form data with `data`, `initialData`, and chain-path access
- Location: `ui/components/form/form-model.ts`, `dynamic-form-model.ts`
- Uses `getChainValue`/`setChainValue` from `cat-kit/fe`

## Entry Points

**Library Entry:**

- Location: `ui/index.ts`
- Exports: shared, utils, compositions, directives, components, styles/theme, types
- Consumed via: `import { UButton } from 'ultra-ui'` or `import 'ultra-ui'` for full install

**Plugin Install:**

- Location: `ui/install.ts`
- Triggers: `app.use(UltraUI)` or manual import
- Responsibilities: Registers all `U*` components and `v*` directives, imports styles

**Sample App:**

- Location: `sample/main.ts` → `App.vue` → `router.ts`
- Uses: `ultra-ui/styles`, `virtual:uno.css`, `vue-router`
- Component resolution: `@builder/vite` auto-resolve with prefix `U` and side-effect style imports

**Build:**

- Location: `build/index.ts` → `build.ts`, `build-styles.ts`, `prepare.ts`
- Trigger: `bun run build` (via build workspace)
- Output: `dist/` (tsdown + Vue plugin, styles, prepared package.json)

**CLI:**

- Location: `cli/gen-component/index.ts`, `cli/export/index.ts`, `cli/rename/types.ts`
- Trigger: `bun cli/gen-component/index.ts`, `bun cli/export/index.ts`
- Responsibilities: Scaffold new components, export utilities, rename types

## Error Handling

**Strategy:** Minimal explicit error handling; Vue reactivity and type system handle most cases.

**Patterns:**

- Form validation: `ui/utils/form/validate.ts`, `ui/types/utils/form/validate.ts`
- Optional inject: `inject(Key, undefined)` with fallback `{}` or `|| {}`
- No global error boundary; components assume valid inputs

## Cross-Cutting Concerns

**Logging:** None; no dedicated logging framework.

**Validation:** Form validation via `validate.ts`; component props validated by TypeScript and Vue.

**Authentication:** Not applicable (component library).

---

_Architecture analysis: 2025-02-12_
