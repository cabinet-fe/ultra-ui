# 完善主题颜色控件多列布局与变量选择

## 补丁内容

1. 在 `ui/components/theme/schema.ts` 中，将表格 (table) 和菜单 (menu) 相关的纯颜色配置项由 `inputField` 改为 `paletteField`，支持颜色选择器。
2. 优化 `ui/components/theme/theme.vue`：
   - 对于 `color` 分类的主题变量（综合颜色），只保留拾色器输入，不提供变量选择；对于其他分类的自定义颜色，同时支持输入/选择变量，且拾色器在输入变量时不覆盖。
   - 巧用 `u-select` 插槽定制下拉选项，选项前新增该系统变量对应的实际色块。
3. 优化 `ui/components/theme/style.scss`：将一排排单行的设定改成 `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))` 的响应式多列布局形式。

## 影响范围

- 修改文件: `ui/components/theme/schema.ts`
- 修改文件: `ui/components/theme/theme.vue`
- 修改文件: `ui/components/theme/style.scss`
