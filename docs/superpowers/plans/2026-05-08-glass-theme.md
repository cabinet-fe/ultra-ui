# Glass Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a new "Glassmorphism" theme (`glass`) with subtle blurs, translucent backgrounds, and vibrant accent colors.

**Architecture:** Create a new `glass.ts` file in the theme directory. Define `glassLightTheme` by extending `lightTheme`, and define `glassDarkTheme` by extending `glassLightTheme`. Export both themes from `index.ts`.

**Tech Stack:** TypeScript, Vue reactivity (used in `UITheme`).

---

### Task 1: Create Glass Theme Definitions

**Files:**
- Create: `packages/styles/src/theme/glass.ts`

- [ ] **Step 1: Write the theme implementation**

Create the file `packages/styles/src/theme/glass.ts` with the following content:

```typescript
import { lightTheme } from './light'

export const glassLightTheme = lightTheme.new({
  color: {
    primary: '#3B82F6', // Vibrant Blue
    success: '#10B981', // Vibrant Green
    warning: '#F59E0B', // Vibrant Orange
    danger: '#EF4444', // Vibrant Red
    info: '#06B6D4', // Vibrant Cyan
    disabled: '#E5E7EB',
    default: '#F3F4F6'
  },
  bg: {
    color: {
      bottom: 'rgba(255, 255, 255, 0.6)',
      middle: 'rgba(255, 255, 255, 0.7)',
      top: 'rgba(255, 255, 255, 0.8)',
      hover: 'rgba(255, 255, 255, 0.9)',
      black: '#000000'
    },
    filter: { blur: 'blur(12px)', saturate: 'saturate(150%)' }
  },
  border: { color: '#E2E8F0', width: 1, style: 'solid' },
  'text-color': {
    title: '#1E293B',
    main: '#334155',
    placeholder: '#94A3B8',
    second: '#64748B',
    assist: '#CBD5E1',
    disabled: '#94A3B8',
    white: '#FFFFFF'
  },
  shadow: { color: 'rgba(0, 0, 0, 0.04)', x: 0, y: 4, blur: 16, spread: 0, emboss: 'none' }
})

export const glassDarkTheme = glassLightTheme.new({
  color: {
    disabled: '#374151',
    default: '#1E293B'
  },
  bg: {
    color: {
      bottom: 'rgba(15, 23, 42, 0.6)',
      middle: 'rgba(15, 23, 42, 0.7)',
      top: 'rgba(15, 23, 42, 0.8)',
      hover: 'rgba(30, 41, 59, 0.8)',
      black: '#000000'
    }
  },
  border: { color: '#27272A' },
  'text-color': {
    title: '#F8FAFC',
    main: '#F1F5F9',
    second: '#94A3B8',
    placeholder: '#64748B',
    assist: '#64748B',
    disabled: '#475569',
    white: '#000000'
  },
  shadow: { color: 'rgba(0, 0, 0, 0.2)', x: 0, y: 4, blur: 16, spread: 0, emboss: 'none' }
})
```

- [ ] **Step 2: Commit**

```bash
git add packages/styles/src/theme/glass.ts
git commit -m "feat: add glass theme definitions"
```

### Task 2: Export Glass Theme

**Files:**
- Modify: `packages/styles/src/theme/index.ts`

- [ ] **Step 1: Export the themes from index.ts**

Modify `packages/styles/src/theme/index.ts` to export `glassLightTheme` and `glassDarkTheme`.

Add this line along with the other theme exports (like `shadcn`, `hero`):
```typescript
export { glassLightTheme, glassDarkTheme } from './glass'
```

For instance, the file should end up looking like:
```typescript
export {
  componentCssVarsDark,
  componentCssVarsDarkDecls,
  componentCssVarsLight,
  componentCssVarsLightDecls,
  themeTokenVar
} from './component-css-vars'
export { UITheme } from './ui-theme'
export { lightTheme } from './light'
export { darkTheme } from './dark'
export { shadcnLightTheme, shadcnDarkTheme } from './shadcn'
export { heroLightTheme, heroDarkTheme } from './hero'
export { glassLightTheme, glassDarkTheme } from './glass'
export type * from './type'
export { cssVar, defineBySize, HEXToRGB, mixColor } from './helper'
export { currentTheme, loadTheme, setTheme } from '../load-theme'
```

- [ ] **Step 2: Build and Test Types**

Run the build or type checking command to ensure everything is correct.

Run: `npx tsc --noEmit -p packages/styles/tsconfig.json` (or the equivalent workspace typecheck command)

- [ ] **Step 3: Commit**

```bash
git add packages/styles/src/theme/index.ts
git commit -m "feat: export glass theme"
```