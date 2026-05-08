# Glass Theme & Showcase 深色模式优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增强 Glass 主题的毛玻璃质感，重写 Showcase 背景以支持深浅色模式的沉浸式玻璃效果，修复 App.vue 中的硬编码颜色。

**Architecture:** 通过修改 `packages/styles/src/theme/glass.ts` 降低背景不透明度并提升模糊半径，重写 `showcase/index.vue` 的背景层（光斑+网格+浮动装饰球），并修复 `App.vue` 中破坏深色模式的硬编码 `background: #fff`。

**Tech Stack:** TypeScript (UITheme token 系统), Vue 3 (SCSS scoped CSS + `:global()`), Dart Sass

---

## 文件清单

| 文件 | 变更类型 | 责任 |
|------|---------|------|
| `packages/styles/src/theme/glass.ts` | 修改 | 重定义 glassLightTheme / glassDarkTheme 的 bg、filter、border、shadow token |
| `playgrounds/desktop/App.vue` | 修改 | 修复 `.main`、`.content-container`、`.control-bar` 的硬编码颜色 |
| `playgrounds/desktop/src/showcase/index.vue` | 修改 | 重写背景层（底色+光斑+网格+装饰球），移除 `.bento-card` 硬编码 `backdrop-filter`，变量化 hover 阴影 |

---

### Task 1: 修改 Glass 主题 Token

**Files:**
- Modify: `packages/styles/src/theme/glass.ts`

- [ ] **Step 1: 替换 light 主题 token**

  将文件内容替换为：

  ```ts
  import { lightTheme } from './light'

  export const glassLightTheme = lightTheme.new({
    color: {
      primary: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#06B6D4',
      disabled: '#E5E7EB',
      default: '#F3F4F6'
    },
    bg: {
      color: {
        bottom: 'rgba(255, 255, 255, 0.2)',
        middle: 'rgba(255, 255, 255, 0.3)',
        top: 'rgba(255, 255, 255, 0.4)',
        hover: 'rgba(255, 255, 255, 0.55)',
        black: '#000000'
      },
      filter: { blur: 'blur(24px)', saturate: 'saturate(180%)' }
    },
    border: { color: 'rgba(255, 255, 255, 0.35)', width: 1, style: 'solid' },
    'text-color': {
      title: '#1E293B',
      main: '#334155',
      placeholder: '#94A3B8',
      second: '#64748B',
      assist: '#CBD5E1',
      disabled: '#94A3B8',
      white: '#FFFFFF'
    },
    shadow: { color: 'rgba(0, 0, 0, 0.08)', x: 0, y: 4, blur: 24, spread: 0, emboss: 'none' }
  })

  export const glassDarkTheme = glassLightTheme.new({
    color: { disabled: '#374151', default: '#1E293B' },
    bg: {
      color: {
        bottom: 'rgba(10, 15, 30, 0.2)',
        middle: 'rgba(15, 23, 42, 0.3)',
        top: 'rgba(15, 23, 42, 0.4)',
        hover: 'rgba(30, 41, 59, 0.55)',
        black: '#000000'
      },
      filter: { blur: 'blur(32px)', saturate: 'saturate(200%)' }
    },
    border: { color: 'rgba(255, 255, 255, 0.08)' },
    'text-color': {
      title: '#F8FAFC',
      main: '#F1F5F9',
      second: '#94A3B8',
      placeholder: '#64748B',
      assist: '#64748B',
      disabled: '#475569',
      white: '#000000'
    },
    shadow: { color: 'rgba(0, 0, 0, 0.35)', x: 0, y: 4, blur: 32, spread: 0, emboss: 'none' }
  })
  ```

- [ ] **Step 2: Type check**

  Run: `cd /Users/whj/codes/ultra-ui && bun run check-types`
  Expected: No type errors in `packages/styles`

- [ ] **Step 3: Commit**

  ```bash
  git add packages/styles/src/theme/glass.ts
  git commit -m "feat(theme): enhance glass theme with stronger blur and lower opacity"
  ```

---

### Task 2: 修复 App.vue 硬编码颜色

**Files:**
- Modify: `playgrounds/desktop/App.vue`

- [ ] **Step 1: 修复 `.main` 背景色**

  找到 `.main` 规则（约第 245 行），将 `background-color: #fff;` 改为 `background-color: use-var(bg-color, bottom);`

- [ ] **Step 2: 修复 `.content-container` 背景色**

  找到 `.content-container` 规则（约第 457 行），将 `background: #fff;` 改为 `background: use-var(bg-color, bottom);`

- [ ] **Step 3: 修复 `.control-bar` 边框**

  找到 `.control-bar` 规则（约第 259 行），将：
  ```scss
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  ...
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  ```
  改为：
  ```scss
  border-bottom: 1px solid use-var(border, color);
  ```
  并删除 `border-top` 行。

- [ ] **Step 4: 启动 playground 验证**

  Run: `cd /Users/whj/codes/ultra-ui/playgrounds/desktop && bun dev`
  Expected: 服务在 `http://localhost:7788` 启动无报错

- [ ] **Step 5: Commit**

  ```bash
  git add playgrounds/desktop/App.vue
  git commit -m "fix(playground): remove hardcoded white backgrounds in App.vue"
  ```

---

### Task 3: 重写 Showcase 背景与卡片样式

**Files:**
- Modify: `playgrounds/desktop/src/showcase/index.vue`

- [ ] **Step 1: 在 template 顶部添加浮动装饰球**

  在 `<div class="showcase">` 内部最前面（Hero Section 之前）插入：

  ```vue
    <!-- Floating Orbs -->
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
  ```

- [ ] **Step 2: 移除 `.bento-card` 的硬编码 backdrop-filter**

  在 `<style scoped>` 中找到 `.bento-card` 规则，删除 `backdrop-filter: blur(20px);` 这一行。

  修改后 `.bento-card` 应为：
  ```css
  .bento-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    transition:
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--u-bg-color-top);
    border: 1px solid var(--u-border-color);
    border-radius: var(--u-radius-large);
  }
  ```

- [ ] **Step 3: 变量化 hover 阴影**

  在 `<style scoped>` 中找到 `.bento-card:hover` 规则，将：
  ```css
  .bento-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);
  }
  ```
  改为：
  ```css
  .bento-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px var(--u-shadow-color, rgba(0, 0, 0, 0.06));
  }
  ```

- [ ] **Step 4: 重写 `.showcase` 背景层**

  在 `<style scoped>` 中找到 `.showcase` 和 `.showcase::before` 规则，将其整体替换为：

  ```css
  .showcase {
    position: relative;
    margin: 0 auto;
    padding: 40px 20px 80px;
    overflow: visible;
    background-color: #f0f4f8;
    background-image:
      radial-gradient(ellipse 80% 50% at 20% 40%, rgba(59, 130, 246, 0.12), transparent),
      radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139, 92, 246, 0.10), transparent),
      radial-gradient(ellipse 50% 60% at 50% 80%, rgba(14, 165, 233, 0.08), transparent);
  }

  :global(html[data-theme="dark"] .showcase) {
    background-color: #0a0f1e;
    background-image:
      radial-gradient(ellipse 80% 50% at 20% 40%, rgba(59, 130, 246, 0.18), transparent),
      radial-gradient(ellipse 60% 40% at 80% 20%, rgba(139, 92, 246, 0.15), transparent),
      radial-gradient(ellipse 50% 60% at 50% 80%, rgba(14, 165, 233, 0.12), transparent);
  }

  /* 网格层 */
  .showcase::before {
    content: '';
    position: absolute;
    top: -100px;
    left: -50vw;
    right: -50vw;
    height: 800px;
    background-image:
      linear-gradient(to right, rgba(0, 0, 0, 0.06) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(0, 0, 0, 0.06) 1px, transparent 1px);
    background-size: 50px 50px;
    z-index: 0;
    pointer-events: none;
  }

  :global(html[data-theme="dark"] .showcase::before) {
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  }
  ```

- [ ] **Step 5: 添加浮动装饰球样式**

  在 `<style scoped>` 文件末尾（`:deep(.u-card__header)` 规则之后）添加：

  ```css
  /* Floating Orbs */
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
    animation: float 20s ease-in-out infinite;
  }

  .orb-1 {
    width: 400px;
    height: 400px;
    top: 10%;
    left: 5%;
    background: rgba(59, 130, 246, 0.08);
    animation-delay: 0s;
  }

  .orb-2 {
    width: 500px;
    height: 500px;
    top: 30%;
    right: 5%;
    background: rgba(139, 92, 246, 0.06);
    animation-delay: -7s;
  }

  .orb-3 {
    width: 350px;
    height: 350px;
    bottom: 15%;
    left: 40%;
    background: rgba(14, 165, 233, 0.07);
    animation-delay: -14s;
  }

  :global(html[data-theme="dark"] .orb-1) {
    background: rgba(59, 130, 246, 0.15);
  }

  :global(html[data-theme="dark"] .orb-2) {
    background: rgba(139, 92, 246, 0.12);
  }

  :global(html[data-theme="dark"] .orb-3) {
    background: rgba(14, 165, 233, 0.10);
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }
  ```

- [ ] **Step 6: 验证 z-index 层级**

  确认 `.hero`（z-index: 1）和 `.bento-grid`（z-index: 1）的层级高于 `.orb`（z-index: 0）和 `.showcase::before`（z-index: 0）。当前代码已满足，无需修改。

- [ ] **Step 7: 启动 playground 并浏览器验证**

  Run: `cd /Users/whj/codes/ultra-ui/playgrounds/desktop && bun dev`
  打开 `http://localhost:7788/showcase/index`

  手动验证清单：
  - [ ] glass + light：卡片有半透明玻璃质感，可见背后光斑/网格/浮动球，文字可读
  - [ ] glass + dark：背景深蓝，光斑更明显，卡片玻璃质感清晰，文字可读
  - [ ] default + light：showcase 背景显示 `#f0f4f8` + 微弱光斑，无异常
  - [ ] default + dark：showcase 背景显示 `#0a0f1e` + 微弱光斑，无异常
  - [ ] shadcn / hero 主题：表现与 default 类似，无异常
  - [ ] 移动端（< 768px）：布局正常，无元素重叠或截断

- [ ] **Step 8: Commit**

  ```bash
  git add playgrounds/desktop/src/showcase/index.vue
  git commit -m "feat(showcase): immersive glass background with orbs and dark mode support"
  ```

---

## Self-Review Checklist

**1. Spec coverage:**
- [x] glass.ts 降低 opacity、提升 blur/saturate、半透明边框 → Task 1
- [x] glass.ts 阴影加深、弥散加大 → Task 1
- [x] showcase 背景层（底色+光斑+网格+装饰球）→ Task 3 Step 4, 5
- [x] 深色模式支持（`:global(html[data-theme="dark"])`）→ Task 3 Step 4, 5
- [x] App.vue 移除硬编码 `#fff` → Task 2
- [x] App.vue control-bar 边框跟随主题 → Task 2
- [x] showcase 移除 `backdrop-filter: blur(20px)` → Task 3 Step 2
- [x] showcase hover 阴影变量化 → Task 3 Step 3

**2. Placeholder scan:**
- [x] 无 "TBD" / "TODO" / "implement later"
- [x] 所有步骤包含具体代码
- [x] 所有命令包含预期输出

**3. Type consistency:**
- [x] `glassLightTheme` / `glassDarkTheme` 结构与现有 glass.ts 一致
- [x] `use-var(bg-color, bottom)` 与 App.vue 中已定义的 SCSS 函数签名一致
- [x] `:global()` 语法与 Vue 3 scoped CSS 规范一致
