# 组件 CSS 变量迁入 @veltra/styles 并在 loadTheme 注入

> 状态: 已执行

## 目标

将桌面组件 `style.scss` 内声明的组件级 CSS 自定义属性集中到 `packages/styles` 的 TS 模块，由 `loadTheme`/`UITheme.injectBuiltInThemes` 与内置主题一并注入 `html`，便于用 TS 或主题组件统一改写；同时去掉各组件 SCSS 中的变量声明，对非主题类局部变量（drawer 位移动画、loading 渐变、form-item 高度、steps/progress-nodes 状态色）在 SCSS 内改为 Sass 局部变量或更具体的选择器，避免依赖 `:root` 级临时变量。

## 内容

1. 新增 `packages/styles/src/theme/component-css-vars.ts`：用与 `fn.use-var` 一致的 `var(--u-…)` 字符串描述 table、menu、select 下拉面板复用的 menu token、tag、switch、breadcrumb、radio/checkbox 暗色边框等 light/dark 两套声明列表；导出只读记录与 `themeTokenVar` 辅助函数，供二次封装或文档化。
2. 修改 `packages/styles/src/theme/ui-theme.ts`：`injectBuiltInThemes` 将上述 light/dark 声明分别拼入内置 light/dark 块；`render()` 在无内置双主题场景下将 light 侧组件声明并入单次 `html{}`，避免自定义 `UITheme` 丢失组件 token。
3. 修改 `packages/styles/src/theme/index.ts`：从子模块 re-export 组件变量相关符号（不改变现有 `loadTheme` 导入路径下的使用方式）。
4. 更新 `packages/styles/src/theme/type.ts` 顶部注释：说明组件级 token 由 TS 注入，与全局 `Theme` 对象并列维护。
5. 自 `packages/desktop` 各组件 `style.scss` 删除已迁移的 `--*` 声明块；`drawer` 用按方向的显式 `transform` 替代 `--transform`；`loading` 用 Sass 局部变量替代 `--c`，`6ch` 替代 `--w`；`form-item` 用 `fn.use-var` 直接参与 `calc`；`steps`/`progress-nodes` 用 BEM 选择器直接写 `color`/`background` 而不再使用中间 CSS 变量。
6. 运行 `bun run check-types` 与 `bun run lint` 校验。

## 影响范围

- `packages/styles/src/theme/component-css-vars.ts`（新增）
- `packages/styles/src/theme/ui-theme.ts`
- `packages/styles/src/theme/index.ts`
- `packages/styles/src/theme/type.ts`
- `packages/desktop/src/components/table/style.scss`
- `packages/desktop/src/components/select/style.scss`
- `packages/desktop/src/components/menu/style.scss`
- `packages/desktop/src/components/tag/style.scss`
- `packages/desktop/src/components/switch/style.scss`
- `packages/desktop/src/components/breadcrumb/style.scss`
- `packages/desktop/src/components/radio/style.scss`
- `packages/desktop/src/components/checkbox/style.scss`
- `packages/desktop/src/components/steps/style.scss`
- `packages/desktop/src/components/progress-nodes/style.scss`
- `packages/desktop/src/components/form-item/style.scss`
- `packages/desktop/src/components/drawer/style.scss`
- `packages/desktop/src/components/loading/style.scss`

## 历史补丁
