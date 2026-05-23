# Form Icons Redesign & Additions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign 11 existing form-related icons and add 9 new form-related icons in `@veltra/icons` using a clean, rounded, 16x16 outline style, ensuring zero complex overlapping lines and uniform visual weight.

**Architecture:** We will replace/create SVG source files in `packages/icons/src/svg/normal/` with precise hand-crafted rounded vectors using a `1.2px` stroke weight. Then, we will run the built-in generator scripts to compile SVGs to Vue 3 components and verify build and type safety.

**Tech Stack:** Bun, TypeScript, SVG, SVGO, Vue 3, tsdown

---

### Task 1: Redesign and Add Base Input SVGs (6 files)

**Files:**
- Modify: `packages/icons/src/svg/normal/input.svg`
- Modify: `packages/icons/src/svg/normal/textarea.svg`
- Modify: `packages/icons/src/svg/normal/select.svg`
- Create: `packages/icons/src/svg/normal/password-input.svg`
- Modify: `packages/icons/src/svg/normal/number-input.svg`
- Create: `packages/icons/src/svg/normal/number-range-input.svg`

- [ ] **Step 1: Write redesigned `input.svg`**
  Write code to `packages/icons/src/svg/normal/input.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <rect x="1" y="4" width="14" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="M4 6v4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>
  ```

- [ ] **Step 2: Write redesigned `textarea.svg`**
  Write code to `packages/icons/src/svg/normal/textarea.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <rect x="1" y="2" width="14" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="M4 5.5h8M4 8.5h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>
  ```

- [ ] **Step 3: Write redesigned `select.svg`**
  Write code to `packages/icons/src/svg/normal/select.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <rect x="1" y="4" width="14" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="m10.5 7.5 1.5 1.5 1.5-1.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  ```

- [ ] **Step 4: Create new `password-input.svg`**
  Write code to `packages/icons/src/svg/normal/password-input.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <rect x="1" y="4" width="14" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="5" cy="8" r="1" fill="currentColor"/>
    <circle cx="8" cy="8" r="1" fill="currentColor"/>
    <circle cx="11" cy="8" r="1" fill="currentColor"/>
  </svg>
  ```

- [ ] **Step 5: Write redesigned `number-input.svg`**
  Write code to `packages/icons/src/svg/normal/number-input.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <rect x="1" y="4" width="14" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="M11 4v8M12.5 7l1-1.5 1 1.5M12.5 9l1 1.5-1-1.5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  ```

- [ ] **Step 6: Create new `number-range-input.svg`**
  Write code to `packages/icons/src/svg/normal/number-range-input.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <rect x="1" y="4" width="6" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <rect x="9" y="4" width="6" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="M7.5 8h1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>
  ```

- [ ] **Step 7: Commit Task 1**
  Run:
  ```bash
  git add packages/icons/src/svg/normal/input.svg packages/icons/src/svg/normal/textarea.svg packages/icons/src/svg/normal/select.svg packages/icons/src/svg/normal/password-input.svg packages/icons/src/svg/normal/number-input.svg packages/icons/src/svg/normal/number-range-input.svg
  git commit -m "feat(icons): redesign input, textarea, select, number-input and add password-input, number-range-input SVGs"
  ```

---

### Task 2: Redesign and Add Selection Control SVGs (7 files)

**Files:**
- Modify: `packages/icons/src/svg/normal/checkbox.svg`
- Modify: `packages/icons/src/svg/normal/radio.svg`
- Modify: `packages/icons/src/svg/normal/switch.svg`
- Create: `packages/icons/src/svg/normal/slider.svg`
- Modify: `packages/icons/src/svg/normal/date-picker.svg`
- Create: `packages/icons/src/svg/normal/date-range-picker.svg`
- Create: `packages/icons/src/svg/normal/multi-select.svg`

- [ ] **Step 1: Write redesigned `checkbox.svg`**
  Write code to `packages/icons/src/svg/normal/checkbox.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <rect x="2" y="2" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="m5 8 2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  ```

- [ ] **Step 2: Write redesigned `radio.svg`**
  Write code to `packages/icons/src/svg/normal/radio.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="8" cy="8" r="2.5" fill="currentColor"/>
  </svg>
  ```

- [ ] **Step 3: Write redesigned `switch.svg`**
  Write code to `packages/icons/src/svg/normal/switch.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <rect x="1" y="4" width="14" height="8" rx="4" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="11" cy="8" r="2.2" fill="currentColor"/>
  </svg>
  ```

- [ ] **Step 4: Create new `slider.svg`**
  Write code to `packages/icons/src/svg/normal/slider.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <path d="M1.5 8h13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="6" cy="8" r="2.2" fill="currentColor"/>
  </svg>
  ```

- [ ] **Step 5: Write redesigned `date-picker.svg`**
  Write code to `packages/icons/src/svg/normal/date-picker.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <rect x="2" y="3" width="12" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="M2 7h12M5 1v3M11 1v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="5" cy="9.5" r="0.6" fill="currentColor"/>
    <circle cx="8" cy="9.5" r="0.6" fill="currentColor"/>
    <circle cx="11" cy="9.5" r="0.6" fill="currentColor"/>
    <circle cx="5" cy="12" r="0.6" fill="currentColor"/>
  </svg>
  ```

- [ ] **Step 6: Create new `date-range-picker.svg`**
  Write code to `packages/icons/src/svg/normal/date-range-picker.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <rect x="1" y="3" width="14" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="M1 7h14M4 1v3M12 1v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <rect x="4" y="9.5" width="8" height="2" rx="1" fill="currentColor"/>
  </svg>
  ```

- [ ] **Step 7: Create new `multi-select.svg`**
  Write code to `packages/icons/src/svg/normal/multi-select.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <rect x="1" y="4" width="14" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <rect x="3" y="6" width="3" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1"/>
    <rect x="7" y="6" width="3" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1"/>
    <path d="m11.5 7.5 1 1 1-1" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  ```

- [ ] **Step 8: Commit Task 2**
  Run:
  ```bash
  git add packages/icons/src/svg/normal/checkbox.svg packages/icons/src/svg/normal/radio.svg packages/icons/src/svg/normal/switch.svg packages/icons/src/svg/normal/slider.svg packages/icons/src/svg/normal/date-picker.svg packages/icons/src/svg/normal/date-range-picker.svg packages/icons/src/svg/normal/multi-select.svg
  git commit -m "feat(icons): redesign checkbox, radio, switch, date-picker and add slider, date-range-picker, multi-select SVGs"
  ```

---

### Task 3: Redesign and Add Structure / Container SVGs (7 files)

**Files:**
- Create: `packages/icons/src/svg/normal/tree-select.svg`
- Create: `packages/icons/src/svg/normal/multi-tree-select.svg`
- Modify: `packages/icons/src/svg/normal/cascader.svg`
- Modify: `packages/icons/src/svg/normal/table.svg`
- Modify: `packages/icons/src/svg/normal/form.svg`
- Create: `packages/icons/src/svg/normal/auto-complete.svg`
- Create: `packages/icons/src/svg/normal/file-picker.svg`

- [ ] **Step 1: Create new `tree-select.svg`**
  Write code to `packages/icons/src/svg/normal/tree-select.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <path d="M3 2v12M3 6h4M3 11h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="9" cy="6" r="1" fill="currentColor"/>
    <circle cx="9" cy="11" r="1" fill="currentColor"/>
    <path d="m12 7.5 1 1 1-1" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  ```

- [ ] **Step 2: Create new `multi-tree-select.svg`**
  Write code to `packages/icons/src/svg/normal/multi-tree-select.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <path d="M3 2v12M3 6h3M3 11h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <rect x="7" y="4.5" width="3" height="3" rx="0.5" fill="none" stroke="currentColor" stroke-width="1"/>
    <rect x="7" y="9.5" width="3" height="3" rx="0.5" fill="none" stroke="currentColor" stroke-width="1"/>
    <path d="m12.5 7.5 1 1 1-1" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  ```

- [ ] **Step 3: Write redesigned `cascader.svg`**
  Write code to `packages/icons/src/svg/normal/cascader.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <rect x="1" y="2" width="6" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <rect x="9" y="2" width="6" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="m4 7.5 1 1-1 1" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  ```

- [ ] **Step 4: Write redesigned `table.svg`**
  Write code to `packages/icons/src/svg/normal/table.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="M1 5h14M1 10h14M5 1v14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>
  ```

- [ ] **Step 5: Write redesigned `form.svg`**
  Write code to `packages/icons/src/svg/normal/form.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <rect x="2" y="1" width="12" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="M4 4.5h2M4 8.5h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <rect x="7" y="3.5" width="5" height="2" rx="0.5" fill="none" stroke="currentColor" stroke-width="1"/>
    <rect x="7" y="7.5" width="5" height="2" rx="0.5" fill="none" stroke="currentColor" stroke-width="1"/>
    <rect x="4" y="11.5" width="8" height="2" rx="1" fill="currentColor"/>
  </svg>
  ```

- [ ] **Step 6: Create new `auto-complete.svg`**
  Write code to `packages/icons/src/svg/normal/auto-complete.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <rect x="1" y="4" width="14" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/>
    <path d="M4 6v4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M11 7h2M12 6v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>
  ```

- [ ] **Step 7: Create new `file-picker.svg`**
  Write code to `packages/icons/src/svg/normal/file-picker.svg`:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <path d="M1.5 3.5v9A1.5 1.5 0 0 0 3 14h10a1.5 1.5 0 0 0 1.5-1.5V5a1.5 1.5 0 0 0-1.5-1.5H8L6.5 2H3A1.5 1.5 0 0 0 1.5 3.5z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M8 6.5v4.5M6 8.5 8 6.5l2 2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  ```

- [ ] **Step 8: Commit Task 3**
  Run:
  ```bash
  git add packages/icons/src/svg/normal/tree-select.svg packages/icons/src/svg/normal/multi-tree-select.svg packages/icons/src/svg/normal/cascader.svg packages/icons/src/svg/normal/table.svg packages/icons/src/svg/normal/form.svg packages/icons/src/svg/normal/auto-complete.svg packages/icons/src/svg/normal/file-picker.svg
  git commit -m "feat(icons): redesign cascader, table, form and add tree-select, multi-tree-select, auto-complete, file-picker SVGs"
  ```

---

### Task 4: Build, Type Check, Format and Verify

- [ ] **Step 1: Run SVGO format script**
  Run: `bun run icons:format` in `packages/icons`
  Expected: SVGs are formatted and optimized.

- [ ] **Step 2: Run Vue components generation**
  Run: `bun run icons:gen` in `packages/icons`
  Expected: Generates `.vue` icons under `src/vue/` and auto-generated exports in `src/normal.ts`.

- [ ] **Step 3: Run full icons build**
  Run: `bun run icons:build-vue` in `packages/icons`
  Expected: Successful compilation of Vue icons to `dist/` using tsdown.

- [ ] **Step 4: Check types**
  Run: `bun run check-types` in `packages/icons`
  Expected: Passes with no typescript type errors.

- [ ] **Step 5: Verify the complete project build**
  Run: `bun run build` in monorepo root
  Expected: Turborepo successfully builds all packages including `@veltra/icons`.

- [ ] **Step 6: Commit all generated files**
  Run:
  ```bash
  git add packages/icons/src/normal.ts packages/icons/src/vue/
  git commit -m "chore(icons): generate Vue components and update normal barrel exports for form icons"
  ```
