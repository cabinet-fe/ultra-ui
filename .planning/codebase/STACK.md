# Technology Stack

**Analysis Date:** 2025-02-12

## Languages

**Primary:**
- TypeScript 5.9.3 - Full codebase (UI, CLI, build, sample)

**Secondary:**
- SCSS - Component styles in `ui/components/**/style.scss`, `ui/styles/`
- Vue SFC - Single-file components in `ui/components/**/*.vue`, `sample/src/**/*.vue`

## Runtime

**Environment:**
- Bun - Runtime for scripts and package manager (bun.lock present)
- Node.js - Required for build tooling (e.g., tsdown, sass-embedded)

**Package Manager:**
- Bun - Primary package manager
- Lockfile: `bun.lock` present

## Frameworks

**Core:**
- Vue 3.5.27 (peer) - UI framework for component library
- Vue Router 5.0.2 - Sample app routing (sample workspace only)

**Testing:**
- Vitest 4.0.18 - Unit test runner
- Config: `vitest.config.ts`

**Build/Dev:**
- Vite 7.3.1 - Sample app dev server and build
- tsdown 0.20.1 - Library build (build workspace)
- Rolldown 1.0.0-rc.2 - Build bundler (via tsdown)
- sass-embedded 1.97.3 - SCSS compilation

## Key Dependencies

**Critical (ui):**
- `vue` ^3.5.27 - Peer dependency
- `cat-kit` ^3.7.15 - Peer dependency (utility, form validation, config)
- `@ultra/icon` ^1.0.1 - Peer dependency (icon library)
- `@floating-ui/dom` ^1.7.5 - Positioning for popovers, dropdowns
- `@tanstack/vue-virtual` ^3.13.18 - Virtualization for lists
- `codemirror` ^6.0.2 + `@codemirror/lang-*` - Code editor component
- `lexical` ^0.40.0 + `@lexical/*` - Rich text editor

**Infrastructure:**
- `unplugin-vue` 7.1.1 - Vue SFC plugin for build
- `unplugin-vue-jsx` 0.8.1 - Vue JSX support
- `fast-glob` 3.3.3 - File globbing for build

## Configuration

**Environment:**
- No `.env` or `process.env` in codebase
- `.env`, `.env.test` ignored in `.gitignore`

**Build:**
- `tsconfig.json` - Root project references
- `tsconfig.node.json` - Node config
- `ui/tsconfig.json` - Extends `@cat-kit/tsconfig/tsconfig.vue.json`, path alias `@ui/*`
- `build/tsconfig.json` - Extends `@cat-kit/tsconfig/tsconfig.node.json`
- `build/build.ts` - tsdown build entry
- `build/build-styles.ts` - SCSS compilation

**Formatting:**
- `oxfmt` 0.28.0 - CLI formatting
- `.oxfmtrc.json` - semi: false, singleQuote: true, trailingComma: none

**Linting/Hooks:**
- `simple-git-hooks` - Commit message validation via `bun bc verify-commit`

## Platform Requirements

**Development:**
- Bun
- Node.js (for build tooling)
- TypeScript 5.9.x

**Production:**
- Browser target (ESM)
- Sample app: Vite dev server port 7788

## Workspaces

```
ultra (root)
├── sample      # Demo app (Vite, Vue Router, UnoCSS)
├── cli         # Codegen scripts (gen-component, export)
├── build       # Library build + release
└── ui          # Component library
```

---

*Stack analysis: 2025-02-12*
