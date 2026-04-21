# Patch 4: 修复圆角模式垂直布局样式与关闭图标交互

## 目标

- 修复 `UTabs` 在垂直布局下圆角模式表现为异常胶囊状的问题，还原 Shadcn 的标准圆角。
- 优化关闭图标的交互体验：默认隐藏且不占据空间，鼠标悬浮或聚焦时出现，向右推挤（展开宽度的动画过度）。

## 内容

- 修改 `packages/desktop/src/components/tabs/style.scss`:
  - 调整 `$list-radius` 和 `$item-radius` 为正常的 `radius` 变量值，取代之前的 `9999px` 胶囊圆角。
  - `header-item` 移除 `gap`，由 `close` 图标的动态 `margin-left` 代替。
  - 取消 `close` 图标的无条件占据空间，水平布局下通过 `width: 0`, `margin-left: 0`, `overflow: hidden` 使其初始不占空间。在 `hover`/`focus` 状态时，通过动画将 `width` 过渡至 `16px`，`margin-left` 过渡至 `6px`，实现向右边平滑推挤产生的动画效果。

## 影响范围

- `packages/desktop/src/components/tabs/style.scss`
