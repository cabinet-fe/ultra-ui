---
'@veltra/desktop': patch
'@veltra/vite': patch
---

Collapse 组件全面增强：新增 `size` / `bordered`(ghost) / `iconPosition` / `expandIcon` / `hideIcon`，以 `height` 数值过渡替代 `grid-template-rows` 提升嵌套场景流畅度，暴露 `toggle` / `expand` / `collapse` / `expandAll` / `collapseAll` 实例方法，`#icon` 插槽提供 `isActive` 状态；`@veltra/vite` resolver 注册 `UCollapse` / `UCollapseItem` 自动按需引入。
