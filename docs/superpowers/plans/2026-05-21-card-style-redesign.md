# Card Component Style Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 去除 Card 组件原有生硬的 border 分割线，重新设计为自适应 Light/Dark 模式的高级微色差区域分割（Header/Action 配备极淡半透明底色，内容区保持纯净），支持 integrate 自适应透明融合。

**Architecture:** 
1. 在全局组件 CSS 变量定义中添加 `--u-card-header-bg` 和 `--u-card-action-bg`，在 Light 模式下赋予极其微妙的 `rgba(0, 0, 0, 0.015)` 透明底色，Dark 模式下赋予微妙的 `rgba(255, 255, 255, 0.015)` 浅白底色。
2. 重构 Card 组件 SCSS，移除 `card__header` 上的下边框与 `card__action` 上的上边框，改为引用这两个新的背景色变量，并在 `integrate` 状态下重置变量为 `transparent` 以支持完美嵌入融合。

**Tech Stack:** TypeScript, Vue 3, SCSS, BEM, CSS Variables

---

### Task 1: Add Global Component CSS Variables for Card

**Files:**
- Modify: `packages/styles/src/theme/component-css-vars.ts:104-106` (Light)
- Modify: `packages/styles/src/theme/component-css-vars.ts:182-184` (Dark)

- [ ] **Step 1.1: Add light card bg variables to `componentCssVarsLight`**
  
  在 `packages/styles/src/theme/component-css-vars.ts` 中的 `componentCssVarsLight` 对象中，增加 Card 的变量定义：
  ```typescript
    // ─── File Picker Colors ───
    '--u-file-picker-hover-bg': T('color', 'primary', 'light', '9'),

    // ─── Card Component Colors ───
    '--u-card-header-bg': 'rgba(0, 0, 0, 0.015)',
    '--u-card-action-bg': 'rgba(0, 0, 0, 0.015)'
  ```

- [ ] **Step 1.2: Add dark card bg variables override to `componentCssVarsDark`**
  
  在 `componentCssVarsDark` 中，增加 Card 变量覆盖定义：
  ```typescript
    // ─── File Picker Colors ───
    '--u-file-picker-hover-bg': T('color', 'primary', 'dark', '9'),

    // ─── Card Component Colors ───
    '--u-card-header-bg': 'rgba(255, 255, 255, 0.015)',
    '--u-card-action-bg': 'rgba(255, 255, 255, 0.015)'
  ```

- [ ] **Step 1.3: Run build:packages to verify types and compilation**

  Run: `bun run build:packages`
  Expected: Successful packaging of `@veltra/styles` without errors.

- [ ] **Step 1.4: Commit CSS variables changes**

  Run:
  ```bash
  git add packages/styles/src/theme/component-css-vars.ts
  git commit -m "style: add default card header and action bg css variables"
  ```

---

### Task 2: Redesign Card Component SCSS

**Files:**
- Modify: `packages/desktop/src/components/card/style.scss`

- [ ] **Step 2.1: Update `card.scss` layout and integrate behavior**

  将 `packages/desktop/src/components/card/style.scss` 中的旧有 `border-bottom`、`border-top` 去掉，并在 `integrate` 状态和 `header`、`action` 区域使用新的 CSS 背景色变量。
  完整的替换内容草案如下：
  ```scss
  @use 'sass:map';
  @use 'pkg:@veltra/styles/mixins' as m;
  @use 'pkg:@veltra/styles/vars';
  @use 'pkg:@veltra/styles/functions' as fn;

  $root-name: card;
  @include m.b($root-name) {
    border-radius: fn.use-var(radius, default);
    background-color: fn.use-var(bg-color, top);
    box-shadow: fn.use-var(shadow);
    backdrop-filter: fn.use-var(bg-filter);
    -webkit-backdrop-filter: fn.use-var(bg-filter);
    overflow: hidden;

    @include m.is(integrate) {
      box-shadow: none;
      --u-card-header-bg: transparent;
      --u-card-action-bg: transparent;
      & > {
        @include m.bem($root-name, header) {
          padding-bottom: 0;
        }
      }
    }

    @include m.size using ($size) {
      font-size: fn.use-var(font-size-main, $size);

      @include m.b(card__header, card__content, card__action) {
        padding: fn.use-var(gap, $size);
      }

      @include m.bem($root-name, header) {
        font-size: fn.use-var(font-size-title, $size);
        font-weight: bold;
      }
    }

    @include m.e(header) {
      background-color: fn.use-var(header-bg, transparent);
      color: fn.use-var(text-color, title);
    }

    @include m.e(cover) {
      position: relative;
      overflow: hidden;

      & > img {
        width: 100%;
        overflow: hidden;
        display: block;

        @include m.is(height-fixed) {
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
        }
      }
    }

    @include m.e(content) {
    }

    @include m.e(action) {
      background-color: fn.use-var(action-bg, transparent);

      #{fn.bem(button)} + #{fn.bem(button)} {
        margin-left: fn.use-var(gap, default);
      }
    }
  }
  ```

- [ ] **Step 2.2: Build the whole project to verify compatibility**

  Run: `bun run build`
  Expected: Successful Turborepo build for packages & playgrounds.

- [ ] **Step 2.3: Run vitest to verify all desktop tests still pass**

  Run: `bun run test`
  Expected: All tests pass.

- [ ] **Step 2.4: Commit card styles changes**

  Run:
  ```bash
  git add packages/desktop/src/components/card/style.scss
  git commit -m "style: redesign card component with subtle background contrast and remove borders"
  ```
