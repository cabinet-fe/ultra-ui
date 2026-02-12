# Codebase Structure

**Analysis Date:** 2025-02-12

## Directory Layout

```
ultra-ui/
├── .github/           # Issue templates
├── .planning/         # Planning documents (codebase analysis)
├── build/             # Build scripts (tsdown, styles, prepare, release)
├── cli/               # CLI tools (gen-component, export, rename)
├── designs/           # Design tokens and specs
├── dev-prompts/       # AI assistant language rules
├── sample/            # Demo app (Vite + Vue Router)
├── ui/                # Core component library
│   ├── components/    # U* components (~55 components)
│   ├── compositions/  # use* composables
│   ├── directives/    # v* directives
│   ├── shared/        # Constants and barrel
│   ├── styles/        # Theme, vars, mixins, animations
│   ├── types/         # Props, emits, component types
│   ├── utils/         # DOM, form, helper, reactive
│   ├── index.ts       # Main export
│   └── install.ts     # Vue plugin
├── package.json       # Root workspace config
├── tsconfig.json      # Project references
└── vitest.config.ts   # Test config
```

## Directory Purposes

**ui/:**

- Purpose: Core component library source
- Contains: Components, compositions, directives, styles, types, utils, shared
- Key files: `ui/index.ts` (exports), `ui/install.ts` (plugin)

**ui/components/:**

- Purpose: All UI components (UButton, UInput, UTable, etc.)
- Contains: One directory per component, each with `.vue`, `index.ts`, `style.scss`, `style.ts`; optional `di.ts`, `use-*.ts`, sub-components
- Key files: `ui/components/index.ts` (barrel export)

**ui/compositions/:**

- Purpose: Reusable logic shared across components
- Contains: One directory per composable (e.g. `use-model/`, `use-pop/`)
- Key files: `ui/compositions/index.ts`

**ui/directives/:**

- Purpose: Vue directives (ripple, click-outside, focus)
- Contains: One directory per directive with `index.ts`, optional `style.scss`/`style.ts`
- Key files: `ui/directives/index.ts`

**ui/types/:**

- Purpose: Props, emits, and type definitions
- Contains: `component-common.ts`, `components/*.ts` (one per component), `helper.ts`, `utils/form/validate.ts`
- Key files: `ui/types/index.ts` (re-exports from `components/`)

**ui/styles/:**

- Purpose: Theme, variables, mixins, animations, normalize
- Contains: `_vars.scss`, `_mixins.scss`, `_functions.scss`, `theme/`, `anime/`, `fonts/`
- Key files: `ui/styles/index.ts`, `ui/styles/theme.ts`

**ui/utils/:**

- Purpose: DOM helpers, form validation, BEM factory, reactive utilities
- Contains: `dom/`, `form/`, `helper/`, `reactive/`
- Key files: `ui/utils/index.ts`, `ui/utils/helper/make-bem.ts`

**ui/shared/:**

- Purpose: Library-wide constants (CLS_PREFIX, NAME_SPACE, FORM_EMPTY_CONTENT)
- Key files: `ui/shared/constants.ts`, `ui/shared/index.ts`

**sample/:**

- Purpose: Demo app for component showcase
- Contains: `src/` with one directory per component mirroring `ui/components/`, each with `index.vue`
- Key files: `sample/main.ts`, `sample/App.vue`, `sample/router.ts`, `sample/vite.config.ts`

**build/:**

- Purpose: Build pipeline (tsdown, styles, prepare, release)
- Contains: `build.ts`, `build-styles.ts`, `prepare.ts`, `release.ts`, `shared.ts`
- Key files: `build/index.ts`

**cli/:**

- Purpose: Scaffolding and export utilities
- Contains: `gen-component/` (scaffold), `export/` (export utils), `rename/` (type rename)
- Key files: `cli/gen-component/index.ts`, `cli/shared.ts`

**designs/:**

- Purpose: Design tokens and documentation
- Contains: `01-design-tokens.md` through `08-best-practices.md`, `preview/`

## Key File Locations

**Entry Points:**

- `ui/index.ts`: Library main export (shared, utils, compositions, directives, components, styles/theme, types)
- `ui/install.ts`: Vue plugin registration (U* components, v* directives, styles)
- `sample/main.ts`: Sample app entry
- `build/index.ts`: Build orchestration

**Configuration:**

- `package.json`: Workspaces `ui`, `sample`, `cli`, `build`; scripts `gen`, `export`, `rename:types`
- `tsconfig.json`: Project references to cli, tsconfig.node.json, ui
- `ui/tsconfig.json`: Path alias `@ui/*` → `./*`; composite, declaration
- `sample/vite.config.ts`: ultra-ui alias, unplugin-components (prefix U), UnoCSS

**Core Logic:**

- BEM factory: `ui/utils/helper/make-bem.ts`
- Form validation: `ui/utils/form/validate.ts`, `ui/types/utils/form/validate.ts`
- Theme loading: `ui/styles/theme.ts`, `ui/styles/theme/`

**Testing:**

- `vitest.config.ts`: Root test config

## Naming Conventions

**Files:**

- Component name: kebab-case (e.g. `date-picker`, `form-item`)
- Main component: `{component-name}.vue` (e.g. `input.vue`, `button.vue`)
- Sub-components: `{component-name}-{suffix}.vue` (e.g. `button-group.vue`, `table-cell.vue`)
- Composables: `use-{name}/index.ts` (e.g. `use-model/index.ts`)
- Types: `ui/types/components/{component-name}.ts` (matches component name)
- Styles: `style.scss` (component SCSS), `style.ts` (style entry), `_vars.scss`, `_mixins.scss` (global)

**Directories:**

- Component dirs: kebab-case, one per component under `ui/components/`
- Sample dirs: `sample/src/{component-name}/` mirroring `ui/components/`
- Composition dirs: `use-{name}` under `ui/compositions/`

**Components:**

- Component class name: `U{ComponentName}` (e.g. `UButton`, `UInput`)
- BEM block: `u-{component-name}` (e.g. `u-input`, `u-button`)
- Directives: `v{Directive}` (e.g. `vRipple`, `vClickOutside`)

**Types:**

- Props: `{ComponentName}Props` (e.g. `InputProps`)
- Emits: `{ComponentName}Emits` (e.g. `InputEmits`)
- Exposed: `_ComponentNameExposed` (internal) / `ComponentNameExposed` (external)

## Where to Add New Code

**New Component:**

- Scaffold: `bun cli/gen-component/index.ts` (or `bun gen`) → creates `ui/components/{name}/`, `ui/types/components/{name}.ts`
- Manual: add `ui/components/{name}/{name}.vue`, `index.ts`, `style.scss`, `style.ts`; `ui/types/components/{name}.ts`
- Register: add `export * from './{name}'` to `ui/components/index.ts`; add type export to `ui/types/index.ts`; add style import to `ui/install.ts`
- Sample: add `sample/src/{name}/index.vue`; route auto-generated from `./src/**/index.vue`

**New Composition:**

- Implementation: `ui/compositions/use-{name}/index.ts`
- Add: `export * from './use-{name}'` to `ui/compositions/index.ts`

**New Directive:**

- Implementation: `ui/directives/{name}/index.ts` (optional `style.scss`, `style.ts`)
- Add: `export * from './{name}'` to `ui/directives/index.ts`

**New Utility:**

- Shared helpers: `ui/utils/` (e.g. `ui/utils/dom/`, `ui/utils/helper/`)
- Add: `export * from './{path}'` to `ui/utils/index.ts`

**New Styles:**

- Variables: `ui/styles/_vars.scss`
- Mixins: `ui/styles/_mixins.scss`
- Animations: `ui/styles/anime/{name}.scss`
- New theme: `ui/styles/theme/`

**New Sample Page:**

- Add: `sample/src/{component-name}/index.vue` (or `sample/src/{section}/index.vue`)
- Route path: `/src/{...}/index.vue` → `/{path}` (e.g. `src/button/index.vue` → `/button`)

## Special Directories

**.planning/:**

- Purpose: GSD planning and codebase analysis docs
- Generated: No
- Committed: Yes

**dist/:**

- Purpose: Build output (tsdown, styles, prepared package.json)
- Generated: Yes (`bun run build`)

**node_modules/:**

- Purpose: Dependencies
- Generated: Yes
- Committed: No

**components.d.ts:**

- Purpose: Auto-generated component declarations for sample app
- Generated: Yes (unplugin-components)
- Committed: Yes

## File Organization Rules

1. **Component structure:** Each component lives in `ui/components/{kebab-name}/` with `index.ts` re-exporting `default as U{ComponentName}` from the main `.vue` file.
2. **Style entry:** `style.ts` imports `style.scss`; components import `style.ts` for side effects.
3. **Type placement:** Component props/emits live in `ui/types/components/{component-name}.ts`; `ui/types/index.ts` re-exports from `components/`.
4. **Path alias:** Use `@ui/*` for internal imports within the library (e.g. `import { bem } from '@ui/utils'`).
5. **Barrel files:** Each layer has an `index.ts` that re-exports from subdirectories.

---

_Structure analysis: 2025-02-12_
