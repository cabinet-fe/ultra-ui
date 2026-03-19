# 菜单项高亮优化 — 对齐 shadcn-ui 风格

> 状态: 已执行

## 目标

优化 Menu 组件的菜单项高亮样式，使其与 shadcn-ui 保持高度一致：
1. 子菜单项的高亮背景宽度应小于父级菜单项，形成清晰的层级收窄。
2. 移除过度装饰（box-shadow、左侧指示条、hover 位移），回归简洁风格。

## 内容

### 步骤 1：移除 item/sub-content 的深度内联样式

- `menu-item.vue`：移除 `:style="{ paddingLeft: ... }"` 内联样式。
- `menu-sub.vue`：移除 sub-content 的 `:style="{ paddingLeft: ... }"` 内联样式。

### 步骤 2：重构 sub-list 容器实现层级收窄

在 `style.scss` 中：
- 增大 sub-list 的 `margin-left`（~12px），并添加 `padding-left`（~8px）。
- 使用 `border-left` 替代 `::before` 伪元素作为层级引导线。
- 移除 sub-list 的 `::before` 伪元素。

这样子菜单项的 highlight 背景自然比父级窄约 20px，无需任何 depth 计算。

### 步骤 3：简化 item/sub-content 共享样式

在 `style.scss` 共享块中：
- 添加一致的 `padding: 0 8px`。
- 移除 `border: 1px solid transparent`。
- 移除 `overflow: hidden`。
- 移除 `&::before` 左侧指示条伪元素。
- hover 状态：移除 `transform: translateX(1px)`。
- active 状态：移除 `box-shadow`，移除 `&::before` 恢复块，仅保留 `background-color` + `color`。

### 步骤 4：简化 active 菜单项样式

- 移除 active 项的 `font-weight: 600`（shadcn-ui 不加粗激活项）。

### 步骤 5：验证

- 启动 sample 开发服务器，视觉确认高亮宽度层级差异。
- 确认 hover/active 样式无残留旧效果。

## 影响范围

- `ui/components/menu/style.scss` — 重构菜单项/子菜单共享样式及 sub-list 容器样式
- `ui/components/menu/menu-item.vue` — 移除 depth 内联 paddingLeft
- `ui/components/menu/menu-sub.vue` — 移除 sub-content 的 depth 内联 paddingLeft

## 历史补丁

- patch-1: 菜单项与子菜单增加固定 2px 间距
