# Select 下拉 --u-menu-* 与 use-var 修正

## 补丁内容

1. **Select**：`--u-menu-*` 原定义在 `.u-select`，但选项列表在 `u-dropdown` 的 Teleport 浮层内，DOM 上不是 `.u-select` 的后代，自定义属性无法继承，`var(--u-menu-*)` 失效。将 `--u-menu-*` 与 `@include m.dark()` 覆写迁至 `.u-select__panel`（与 `content-class` 一致），与菜单项样式引用方式对齐。
2. **Select / Menu**：`--u-menu-active-color` 中 `var(--u-color-primary-dark-1)` 改为 `fn.use-var(color, primary, dark, 1)`，与主题 token 解析方式一致。
3. **Table**：`--u-table-checked-bg` 对主色浅/深阶的引用改为 `fn.use-var(color, primary, light-9)` / `fn.use-var(color, primary, dark, 1)`。

## 影响范围

- 修改文件: `packages/desktop/src/components/select/style.scss`
- 修改文件: `packages/desktop/src/components/menu/style.scss`
- 修改文件: `packages/desktop/src/components/table/style.scss`
