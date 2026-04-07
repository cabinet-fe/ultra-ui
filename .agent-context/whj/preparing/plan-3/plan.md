# 主题系统优化

> 状态: 未执行

## 目标

在保留 SCSS + BEM 核心架构的前提下，优化 CSS 变量管理和主题切换机制。当前主题系统通过 `UITheme` JS 类将 Theme 对象序列化为 CSS 变量字符串并注入 `:root` 的 `<style>` 标签，存在以下可改进点：CSS 变量命名不统一（部分有 `--u-` 前缀，部分无）、主题切换依赖运行时 JS 操作 DOM、缺少原生 `prefers-color-scheme` 支持、组件特定 token 混在全局 Theme 类型中导致类型臃肿。优化后应实现更清晰的 token 分层、更优雅的暗色模式支持、更轻量的运行时开销。

> 注意：本计划的所有路径均基于 Plan 2 完成后的新结构（`packages/`），如 `@ultra-ui/utils/src/styles/` 对应旧路径 `ui/styles/`。

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

完成标准：分层设计文档完成，包含从旧 token 到新 token 的完整映射表，token 命名表确定，无歧义。

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
- 文档中说明三者的职责分工

**向后兼容策略**：
- 过渡期（至少一个主版本周期）同时生成带前缀（`--u-color-primary`）和不带前缀（`--color-primary`）的 CSS 变量
- 在 `render()` 方法中，为每个 `--u-xxx` 变量额外生成一条 `--xxx` 的同值变量
- 在控制台输出一次性的 deprecation warning（仅开发环境），提示消费者迁移到 `--u-` 前缀
- 在后续大版本中移除无前缀变量

完成标准：UITheme API 变更后，`lightTheme` / `darkTheme` 能正确切换；`auto` 模式响应系统暗色偏好；无前缀变量仍可用（deprecation）。

### 4. 更新 SCSS 基础设施

**更新 `_vars.scss`**：
- 确保 `$namespace` 与 CSS 变量前缀 `--u-` 一致
- 新增语义化 SCSS 变量映射（如 `$color-primary: var(--u-color-primary)`）

**更新 `_functions.scss`**：
- `fn.use-var()` 函数**保持签名不变**，内部修改为输出统一 `--u-` 前缀格式
- 新增 `fn.component-var($component, $property, $fallback: null)` 函数，签名：
  - 输入：`component-var(table, border-color, var(--u-border-color))`
  - 输出：`var(--u-table-border-color, var(--u-border-color))`
  - 用于组件级 token 的声明和引用

**更新 `_mixins.scss`**：
- 新增 `m.dark()` mixin，在其内部为暗色模式声明组件 token 的覆盖值
- 选择器策略：同时生成 `[data-theme="dark"]` 和 `@media (prefers-color-scheme: dark):not([data-theme="light"])` 两种选择器
  - `[data-theme="dark"]` 覆盖显式设置的暗色模式
  - `@media` + `:not([data-theme="light"])` 覆盖 auto 模式且系统为暗色的情况

**关键约束**：`fn.use-var()` 的修改与 Step 5 的组件样式迁移必须在同一批次完成（不分批），因为前缀变更会影响所有使用该函数的组件。或者，若需分批迁移，则新增 `fn.use-var-v2()` 函数供新 token 系统使用，待所有组件迁移完毕后删除旧 `fn.use-var()` 并重命名 v2 → use-var。

完成标准：SCSS 工具函数和 mixin 更新后，不影响现有 BEM 类名输出；新增的 `dark()` mixin 和 `component-var()` 函数可用。

### 5. 迁移组件样式到新 token 系统

**执行策略**：由于 `fn.use-var()` 前缀变更影响全局，本步骤必须一次性完成所有组件的迁移，不可分批。

对全部 71 个组件执行：
- 将组件 `.scss` 中硬编码的 CSS 变量名替换为通过 `fn.use-var()` 或 `fn.component-var()` 生成的变量引用
- 将原 Theme 类型中的组件 token 移入对应组件的 SCSS，使用 CSS 变量 fallback 机制：`var(--u-table-border-color, var(--u-border-color))`
- 为有暗色模式差异的组件添加 `m.dark()` 规则块
- 更新组件的 `style.ts` 入口（若依赖了 styles 子路径的导入）

完成标准：所有组件样式使用统一的 token 引用方式；`lightTheme` 和 `darkTheme` 下所有组件视觉正确；旧无前缀变量仍通过兼容层生效。

### 6. 验证和清理

- 运行 `bun vitest --run` 确保无回归
- 在 sample 应用中验证：
  - light 主题：所有组件视觉正确
  - dark 主题：所有组件视觉正确
  - auto 模式：响应系统暗色偏好切换
  - 自定义主题：`UITheme.new()` 创建派生主题工作正常
  - 无前缀变量兼容：在自定义 CSS 中使用 `var(--color-primary)` 仍可生效
- 更新 AGENTS.md 中的主题系统描述
- 更新 README 或 CHANGELOG，标记 CSS 变量前缀变更为 deprecation（非 breaking）

完成标准：所有测试通过；三种主题模式（light/dark/auto）+ 自定义主题在 sample 中表现正确；无残留的旧 token 引用（除兼容层外）。

## 回滚策略

在执行 Step 3（UITheme 重构）之前打 git tag `pre-theme-optimization`。Step 3-5 是高风险步骤，建议每步骤完成后提交 commit。若主题系统重构导致大面积视觉回归，可回退到 tag。

## 影响范围

- `packages/utils/src/styles/type.ts`：Theme 类型精简
- `packages/utils/src/styles/theme/ui-theme.ts`：UITheme 类重构
- `packages/utils/src/styles/theme/light.ts`、`dark.ts`：交叉引用前缀更新
- `packages/utils/src/styles/_vars.scss`、`_functions.scss`、`_mixins.scss`：SCSS 基础设施更新
- `packages/desktop/src/components/*/style.scss`：全部 71 个组件样式文件
- `packages/desktop/src/components/*/style.ts`：组件样式入口（部分）
- `AGENTS.md`：主题系统描述更新

## 历史补丁
