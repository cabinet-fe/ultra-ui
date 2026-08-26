# 主题系列（浅色系 / 深色系）

## 术语

- **主题系列（series）**：主题的明暗归属，`'light' | 'dark'`，挂在 `UITheme` 实例上（不放进 `Theme` token，避免被渲染成 CSS 变量）。决定注入哪套组件级 token，并写入 `html[data-theme]`。

## 领域

主题系统（`@veltra/styles/theme`）的预设不成对提供明暗变体，按系列组织：浅色系 `lightTheme` / `heroTheme` / `ancientTheme`，深色系 `darkTheme` / `glassTheme`。应用主题即定明暗：`loadTheme(theme)` 单主题注入「全局 token + 同系列组件级 token（`component-css-vars.ts` 的 light/dark 两份）」，并把 `html[data-theme]` 置为系列值。`theme.new(partial, { series })` 派生默认继承基主题系列，`{ series: 'dark' }` 可覆盖。背景色为 `rgba()` 等非 hex 值时无法推导混合派生 token（kbd / batch-edit），预设需用组件级扩展键显式声明（参照 `glassTheme` 的 `kbd` / `batch-edit` 键）。已移除：`setTheme`、`UITheme.injectBuiltInThemes`、shadcn 主题、hero/glass 的明暗变体导出。

## 影响文件

- 新增：`.changeset/theme-series.md`
- 删除：`packages/styles/src/theme/presets/shadcn.ts`
- 修改：`packages/styles/src/theme/ui-theme.ts`
- 修改：`packages/styles/src/theme/load-theme.ts`
- 修改：`packages/styles/src/theme/presets/index.ts`
- 修改：`packages/styles/src/theme/presets/dark.ts`
- 修改：`packages/styles/src/theme/presets/hero.ts`
- 修改：`packages/styles/src/theme/presets/glass.ts`
- 修改：`packages/styles/src/theme/presets/ancient.ts`
- 修改：`packages/styles/src/theme/component-css-vars.ts`
- 修改：`packages/styles/src/theme/__test__/ui-theme.test.ts`
- 修改：`packages/styles/src/_mixins.scss`
- 修改：`packages/desktop/src/components/theme/theme.vue`
- 修改：`playground/App.vue`
- 修改：`playground/src/desktop/theme/index.vue`
- 修改：`skills/veltra-ui/packages/styles/theme.md`

## 更新记录

- 2026-08-26：主题体系重构为系列制（移除 shadcn、hero dark、glass light；新增 `series`；移除 setTheme/injectBuiltInThemes）；涉及：packages/styles/src/theme、packages/desktop、playground、skills 文档
