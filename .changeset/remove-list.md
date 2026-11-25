---
"@veltra/desktop": patch
"@veltra/mobile": patch
---

移除列表组件 `UList`、`UListItem`（`<u-list>` / `<u-list-item>`）。`@veltra/desktop` 与 `@veltra/mobile` 不再导出这两个组件，以及 `ListProps`、`ListEmits`、`ListExposed`。样式入口 `@veltra/desktop/components/list/style`、`@veltra/mobile/components/list/style` 一并删除。条目行用原生 `ul` / `li`；桌面端需要细滚动条时用 `UScroll`，并设置 `tag="ul"`。
