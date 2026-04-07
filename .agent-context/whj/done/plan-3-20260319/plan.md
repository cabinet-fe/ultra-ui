# menu 组件样式与展开动效重构

> 状态: 已执行

## 目标

在不改变 `menu` 组件基础 Props 设计的前提下，重构 `menu` 的视觉风格与交互细节，使其更接近 shadcn 的侧边菜单质感，包括更紧凑的高度、明确的圆角与阴影层次、清晰的 hover/active 状态；同时修复当前子菜单展开动画的生硬问题，让展开与收起更平滑、稳定。

## 内容

### 1. 主题与样式重构
- 调整 `menu` 相关主题 token 的默认值，使默认高度、背景、hover、active 更贴近 shadcn 风格
- 重写 `ui/components/menu/style.scss`，统一普通态与折叠态的容器、菜单项、图标、子菜单层级、弹层面板样式，补足边框、阴影、间距和圆角细节

### 2. 组件结构与交互优化
- 在不变更现有 Props/Emits 设计的前提下，微调 `menu` 相关 SFC 结构与 class 用法，改善顶层和嵌套层级的视觉一致性
- 优化折叠态子菜单弹层样式，使其与主菜单视觉语言一致

### 3. 展开动画修复与验证
- 重写 `use-menu-transition.ts` 的展开/收起过渡逻辑，避免当前高度动画闪烁、突兀或残留样式的问题
- 运行类型/测试验证，确保 `menu` 重构后构建与现有行为保持稳定

## 影响范围

- `ui/styles/theme/light.ts` — 调整 menu 默认高度、背景、hover/active 色值，去掉玻璃态滤镜
- `ui/styles/theme/dark.ts` — 调整 dark 主题下 menu 的背景与 hover/active 风格，统一为实体侧栏面板语义
- `ui/components/menu/style.scss` — 重写 menu / collapsed-menu 视觉样式、层级间距、面板阴影、折叠弹层与嵌套指示线
- `ui/components/menu/menu-item.vue` — 收紧常规菜单项缩进并补充一级项状态 class
- `ui/components/menu/menu-sub.vue` — 收紧子菜单缩进，补充分支激活/展开状态 class 与当前路径关联高亮
- `ui/components/menu/menu-sub-collapsed.vue` — 为折叠态子菜单弹层补充独立 panel class
- `ui/components/menu/use-menu-item.ts` — 禁用项点击时直接拦截，保留 hover/tip 等非点击交互
- `ui/components/menu/use-menu-transition.ts` — 重写展开/收起过渡，加入 height + opacity + translateY 联动动画并清理残留内联样式

## 历史补丁
- patch-1: 优化 menu-item 高亮与收起动画
