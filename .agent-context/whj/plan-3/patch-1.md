# Plan 3 · Patch 1 — 主题系统审计摘要

## 1. Token 统计（`packages/utils/src/styles/type.ts` 重构前）

- 约 **120+** 叶子配置项分布在 color、bg、border、text-color、radius、form-component-height、font-*、shadow、gap、breakpoint 及 **menu / table / checkbox / radio / switch / tag** 等组件分组中。

## 2. SCSS 中 `var(--*)` 与 `fn.use-var`（重构前）

- 绝大多数主题引用通过 `fn.use-var(category, ...)` 生成 `var(--{category}-...)`，**无 `u-` 前缀**。
- 少量组件使用**局部**变量名（如 `--node-color`、`--height`、`--c`），非全局 Theme。
- `packages/utils/src/styles/_mixins.scss` 中 `breakpoint()` 使用 `var(--breakpoint-*)`（无 `u-`）。

## 3. JS `UITheme.render()` 与 SCSS 对齐情况（重构前）

- `renderBase` 自 `parentKey === '-'` 起生成 `--color-primary`、`--text-color-title` 等，与 `fn.use-var` 输出一致。
- `light.ts` / `dark.ts` 中 **交叉引用** 使用 `var(--text-color-title)`、`cssVar('bg-color-hover')` 等，与注入变量名一致；表格等使用 `cssVar('text-color-title')` 等形式。

## 4. 主要结论

| 类别 | 说明 |
|------|------|
| 命名 | 全局变量缺统一 `--u-` 命名空间；BEM 的 `$namespace: u-` 与 CSS 变量前缀不一致 |
| 组件 token | menu/table/checkbox 等与全局 Theme 耦合，类型臃肿 |
| 暗色 | 依赖切换 `UITheme` 实例并整表重渲染，无 `prefers-color-scheme` / `data-theme` 分层 |
| 运行时 | 仅 `<style>` 注入，未使用 `adoptedStyleSheets` |

## 5. `light` / `dark` 中 `var(--...)` 交叉引用（抽样）

- `menu.hover.color`: `var(--text-color-title)`
- `menu.active.color`: `var(--color-primary-dark-1)`
- `menu.bg.color`: `var(--bg-color-top)` / dark 下 `cssVar('bg-color-middle')`
- `table.header.color` 等: `cssVar('text-color-title')`、`cssVar('bg-color-hover')`、`cssVar('color-primary-light-9')` 等

---

本 patch 为计划第 1 步审计纪要；具体映射与实现见本次代码变更（`--u-*`、`injectBuiltInThemes`、`setTheme`、`component-var`、`m.dark()` 等）。
