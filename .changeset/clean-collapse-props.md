---
'@veltra/desktop': patch
---

重构 Collapse 组件 props 类型：`CollapseProps` 改为继承 `ComponentProps` 复用通用 `size`，组件内部不再显式列出各个 prop，直接使用 `defineProps<CollapseProps>()`。
