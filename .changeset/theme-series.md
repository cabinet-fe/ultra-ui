---
'@veltra/styles': minor
'@veltra/desktop': minor
---

主题体系重构为主题系列（breaking）：

- 预设主题不再成对提供明暗变体，改为按「浅色系 / 深色系」组织：浅色系含 `lightTheme`、`heroTheme`、`ancientTheme`；深色系含 `darkTheme`、`glassTheme`。
- 移除 `shadcnLightTheme` / `shadcnDarkTheme`（shadcn 主题整体下线）、`heroDarkTheme`、`glassLightTheme`；`heroLightTheme` → `heroTheme`、`glassDarkTheme` → `glassTheme`、`ancientLightTheme` → `ancientTheme`。
- `UITheme` 新增 `series: 'light' | 'dark'`；`render()` 按系列注入组件级 token 并把 `html[data-theme]` 置为对应系列——修复了深色预设经 `loadTheme` 单主题注入时错配亮色组件 token 的问题。
- 移除 `UITheme.injectBuiltInThemes` 与 `setTheme`（含 `@veltra/styles/theme` 的 `setTheme` 导出）；明暗由所选主题的系列决定。`theme.new(partial, { series })` 派生时可切换系列。
- `glassTheme` 显式补齐 `--u-kbd-*` / `--u-batch-edit-form-header-bg` token（rgba 背景无法自动推导混合色）。
- `UTheme` 编辑器组件适配 `series`：编辑/切换预设时保持组件 token 与主题系列一致。
