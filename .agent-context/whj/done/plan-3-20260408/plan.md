# 主题系统优化

> 状态: 已执行

## 目标

在保留 SCSS + BEM 核心架构的前提下，优化 CSS 变量管理和主题切换机制。当前主题系统通过 `UITheme` JS 类将 Theme 对象序列化为 CSS 变量字符串并注入 `:root` 的 `<style>` 标签，存在以下可改进点：CSS 变量命名不统一（部分有 `--u-` 前缀，部分无）、主题切换依赖运行时 JS 操作 DOM、缺少原生 `prefers-color-scheme` 支持、组件特定 token 混在全局 Theme 类型中导致类型臃肿。优化后应实现更清晰的 token 分层、更优雅的暗色模式支持、更轻量的运行时开销。

> 本计划的所有路径均基于 Plan 5 完成后的新结构（`packages/`）。

## 内容

### 1. 审计现有主题系统

全面梳理当前主题实现（基于 `packages/utils/src/styles/` 下的文件）：

- 统计 `type.ts` 中 Theme 类型的 token 数量和分类（当前约 120+ token 分布在 color、bg、border、text-color、radius、font、shadow、gap、breakpoint 及组件特定分组中）
- 统计各组件 `.scss` 文件中实际使用的 CSS 变量（`var(--xxx)`），按有无 `u-` 前缀分类
- 对照 `UITheme.render()` 的输出，检查 JS 端生成的变量与 SCSS 端使用的变量是否完全匹配
- 识别未使用的 token、缺失的 token、命名不一致的 token
- 评估 `lightTheme` / `darkTheme` 预设中的值覆盖完整性
- 统计 `lightTheme` / `darkTheme` 中使用 CSS 变量交叉引用的情况（如 `'var(--text-color-title)'`）

**审计报告模板**（每个 token 一行）：

| Token 名 | JS 端来源 | SCSS 端使用次数 | 有 `u-` 前缀 | light 覆盖 | dark 覆盖 | 状态 |
|----------|-----------|----------------|-------------|-----------|-----------|------|

产出：审计报告记录在本计划的 patch 中。

完成标准：审计报告完成，问题清单无遗漏，包含交叉引用统计。

### 2. 设计 CSS 变量分层架构

基于审计结果，设计新的 token 分层：

**全局 token（@ultra-ui/utils/styles）**：
- 颜色系统：`--u-color-primary`、`--u-color-success`、`--u-bg-*`、`--u-text-*`
- 排版系统：`--u-font-family`、`--u-font-size-*`
- 间距系统：`--u-gap-*`、`--u-radius-*`
- 边框和阴影：`--u-border-*`、`--u-shadow-*`
- 断点：`--u-breakpoint-*`
- 尺寸系统：`--u-form-component-height-*`

**组件 token（各组件 style.scss 内部）**：
- 将 Theme 类型中的组件特定 token（menu、table、checkbox、radio、switch、tag）从全局 Theme 移入对应组件的 SCSS 文件中，通过全局 token 派生
- 例如 `--u-table-border-color` 默认值为 `var(--u-border-color)`，可被主题覆盖

命名规范统一为 `--u-{category}-{property}[-{variant}]`，所有变量添加 `u-` 命名空间前缀。

**设计文档模板**：

| 层级 | 旧 token 名 | 新 token 名 | 归属包 | 默认值/fallback |
|------|------------|------------|--------|----------------|

完成标准：分层设计文档完成，包含从旧 token 到新 token 的完整映射表，无歧义。

### 3. 重构 Theme 类型和 UITheme 类

**重构 Theme 类型**（`packages/utils/src/styles/type.ts`）：
- 移除组件特定 token（menu、table、checkbox、radio、switch、tag），仅保留全局 token
- 简化类型结构，减少嵌套层级

**重构 UITheme 类**（`packages/utils/src/styles/theme/ui-theme.ts`）：

- 统一 CSS 变量命名前缀为 `--u-`
- 更新 `lightTheme` 和 `darkTheme` 预设中所有 CSS 变量交叉引用，添加 `u-` 前缀（如 `'var(--text-color-title)'` → `'var(--u-text-color-title)'`）
- 优化 `render()` 方法：优先使用 `CSSStyleSheet` API（`adoptedStyleSheets`），**保留 `<style>` 标签注入作为 SSR 和旧浏览器的降级方案**。降级判断：`typeof CSSStyleSheet !== 'undefined' && 'adoptedStyleSheets' in Document.prototype`
- 新增 `setTheme(mode: 'light' | 'dark' | 'auto')` 方法：
  - `'light'` / `'dark'`：在 `<html>` 上设置 `data-theme` 属性，应用对应主题变量，覆盖 `@media` 查询
  - `'auto'`：移除 `data-theme` 属性，由 `@media (prefers-color-scheme: dark)` 和 CSS 规则生效

**API 演进策略**：
- `loadTheme(theme?)` 保留，用于初始化主题实例和加载自定义主题配置
- `setTheme('light' | 'dark' | 'auto')` 新增，用于切换内置主题和暗色模式
- `UITheme.new()` 保留，用于创建派生主题

**向后兼容策略**：
- 过渡期（至少一个主版本周期）同时生成带前缀（`--u-color-primary`）和不带前缀（`--color-primary`）的 CSS 变量
- 在 `render()` 方法中，为每个 `--u-xxx` 变量额外生成一条 `--xxx` 的同值变量
- 在控制台输出一次性的 deprecation warning（仅开发环境），提示消费者迁移到 `--u-` 前缀
- 在后续大版本中移除无前缀变量

完成标准：`lightTheme` / `darkTheme` 能正确切换；`auto` 模式响应系统暗色偏好；无前缀变量仍可用（deprecation）。

### 4. 更新 SCSS 基础设施

**更新 `_vars.scss`**：
- 确保 `$namespace` 与 CSS 变量前缀 `--u-` 一致
- 新增语义化 SCSS 变量映射（如 `$color-primary: var(--u-color-primary)`）

**更新 `_functions.scss`**：
- `fn.use-var()` 函数**保持签名不变**，内部修改为输出统一 `--u-` 前缀格式
- 新增 `fn.component-var($component, $property, $fallback: null)` 函数，签名：
  - 输入：`component-var(table, border-color, var(--u-border-color))`
  - 输出：`var(--u-table-border-color, var(--u-border-color))`

**更新 `_mixins.scss`**：
- 新增 `m.dark()` mixin，在其内部为暗色模式声明组件 token 的覆盖值
- 选择器策略：同时生成 `[data-theme="dark"]` 和 `@media (prefers-color-scheme: dark):not([data-theme="light"])` 两种选择器

**关键约束**：`fn.use-var()` 的修改与 Step 5 的组件样式迁移必须在同一批次完成（不分批），因为前缀变更影响所有使用该函数的组件。或者，新增 `fn.use-var-v2()` 供新 token 系统使用，待全部迁移完毕后删除旧版并重命名。

完成标准：SCSS 工具函数和 mixin 更新后，不影响现有 BEM 类名输出；`dark()` mixin 和 `component-var()` 函数可用。

### 5. 迁移组件样式到新 token 系统

**执行策略**：由于 `fn.use-var()` 前缀变更影响全局，本步骤必须一次性完成所有组件迁移。

对全部组件执行：
- 将组件 `.scss` 中硬编码的 CSS 变量名替换为通过 `fn.use-var()` 或 `fn.component-var()` 生成的变量引用
- 将原 Theme 类型中的组件 token 移入对应组件的 SCSS，使用 CSS 变量 fallback：`var(--u-table-border-color, var(--u-border-color))`
- 为有暗色模式差异的组件添加 `m.dark()` 规则块
- 更新组件的 `style.ts` 入口（若依赖了 styles 子路径导入）

完成标准：所有组件样式使用统一 token 引用；`lightTheme` 和 `darkTheme` 下组件视觉正确；旧无前缀变量通过兼容层生效。

### 6. 验证和清理

- `bun vitest --run` 无回归
- sample 应用验证：
  - light 主题：所有组件视觉正确
  - dark 主题：所有组件视觉正确
  - auto 模式：响应系统暗色偏好切换
  - 自定义主题：`UITheme.new()` 创建派生主题正常
  - 无前缀变量兼容：自定义 CSS 中 `var(--color-primary)` 仍生效
- 更新 AGENTS.md 中的主题系统描述

完成标准：所有测试通过；三种主题模式 + 自定义主题在 sample 中正确；无残留旧 token 引用（除兼容层外）。

## 回滚策略

在 Step 3（UITheme 重构）之前打 git tag `pre-theme-optimization`。Step 3-5 是高风险步骤，每步骤完成后提交 commit。

## 影响范围

- `packages/utils/src/styles/type.ts`：Theme 仅保留全局 token
- `packages/utils/src/styles/helper.ts`：`cssVar` 改为 `--u-*`
- `packages/utils/src/styles/theme/ui-theme.ts`：`--u-*` 注入、legacy 别名、`adoptedStyleSheets` 降级、`injectBuiltInThemes`、`setTheme`
- `packages/utils/src/styles/theme/light.ts`、`dark.ts`：移除组件 token，内置实例 `reactive: false`
- `packages/utils/src/styles/theme.ts`：导出 `setTheme`
- `packages/utils/src/styles/_vars.scss`、`_functions.scss`、`_mixins.scss`：`use-var` 前缀、`component-var`、`breakpoint` 前缀、`dark` mixin
- `packages/compositions/src/load-theme.ts`：内置双主题注入与 `setTheme` 再导出
- `packages/desktop/src/components/table/style.scss`、`menu/style.scss`、`select/style.scss`、`tag/style.scss`、`switch/style.scss`、`checkbox/style.scss`、`radio/style.scss`：组件 token 与暗色覆盖
- `packages/desktop/src/components/theme/schema.ts`、`theme.vue`：主题编辑器字段与 CSS 变量名展示
- `apps/sample/App.vue`：`loadTheme()` + `UITheme.setTheme`（含 `auto`）、示例样式 `--u-*`
- `packages/compositions/src/load-theme.ts`：移除与值导入冲突的 `import type { UITheme }`，修复 Vite 解析错误
- `AGENTS.md`：主题系统描述
- `.agent-context/whj/plan-3/patch-1.md`：审计摘要
- `packages/utils/src/styles/theme/__test__/ui-theme.test.ts`：UITheme 单测
- `.agent-context/whj/plan-3/patch-2.md`：补丁说明与映射摘要

## 历史补丁

- patch-1: 主题系统审计摘要（`patch-1.md`）
- patch-2: Review 跟进（sample `auto`、UITheme 单测、映射摘要）（`patch-2.md`）
- patch-3: 修复 load-theme 中 UITheme 重复声明导致 sample 无法构建（`patch-3.md`）
