# Card Component Style Redesign Design Spec

优化 Card 组件样式，废除原先的实线分割边框，改为现代且精致的 Header / Action 区域微色差分割设计，凸显中部的 Content 内容区。

## Background & Objectives
Card 组件原先的 Header / Content / Action 之间采用默认的 border 线条进行分割，视觉上有些生硬和陈旧。
我们需要在去掉 border 的同时，依然保证 Header、Content 和 Action 之间有清晰且高级的区域划分。

采用**微色差分割（Subtle Background Contrast）**结合**智能融合（Smart Contrast with Layout）**的方案：
- 去掉 Header 和 Action 上的 border 分隔线。
- 在 Light 和 Dark 模式下自适应赋予 Header 和 Action 微秒的背景色透明度（例如亮色下为 `rgba(0, 0, 0, 0.015)`，暗色下为 `rgba(255, 255, 255, 0.015)`）。
- 在卡片的 `integrate` 融合属性激活下，智能地将 Header 和 Action 背景色置为 `transparent`，以无缝融入外层容器背景。

## Detailed Design

### 1. SCSS 样式调整 (`packages/desktop/src/components/card/style.scss`)
- 移除 `header` 上的 `border-bottom` 声明。
- 移除 `action` 上的 `border-top` 声明。
- 引入新的背景变量：
  - Header: `background-color: fn.use-var(header-bg, transparent);`
  - Action: `background-color: fn.use-var(action-bg, transparent);`
- 在 `integrate` 状态选择器中，重置变量：
  ```scss
  --u-card-header-bg: transparent;
  --u-card-action-bg: transparent;
  ```

### 2. 全局主题组件 CSS 变量定义 (`packages/styles/src/theme/component-css-vars.ts`)
- 在亮色配置 `componentCssVarsLight` 中追加：
  ```ts
  '--u-card-header-bg': 'rgba(0, 0, 0, 0.015)',
  '--u-card-action-bg': 'rgba(0, 0, 0, 0.015)',
  ```
- 在暗色配置 `componentCssVarsDark` 中追加：
  ```ts
  '--u-card-header-bg': 'rgba(255, 255, 255, 0.015)',
  '--u-card-action-bg': 'rgba(255, 255, 255, 0.015)',
  ```

## Verification Plan

### Automated Tests
- 运行 Card 的现有 Vitest 测试套件：
  ```bash
  bun run test packages/desktop/src/components/card
  ```

### Manual Verification
- 启动预览 Playground：
  ```bash
  cd playgrounds/desktop && bun dev
  ```
- 在 Playground 中观察 Card 组件展示在 Light/Dark 模式下的样式是否过渡自然且精致。
- 观察 `integrate` 模式下的 Card 是否完美融入背景。
