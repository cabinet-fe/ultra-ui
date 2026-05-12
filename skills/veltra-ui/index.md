# Veltra Ultra UI — 全量索引

完整的 `@veltra/*` 生态文档目录。按需查阅。

## 快速开始

- quick-start.md — 安装、全局注册、第一个组件
- core-concepts.md — BEM 类名、主题系统、尺寸系统、组件模式

## 包文档

| 文档 | 内容 |
|------|------|
| packages/utils.md | `@veltra/utils` — 工具函数、共享类型、常量 |
| packages/styles.md | `@veltra/styles` — SCSS mixins/functions、Theme 系统 |
| packages/compositions.md | `@veltra/compositions` — 12 个组合式函数 |
| packages/directives.md | `@veltra/directives` — vRipple、vClickOutside、vFocus |
| packages/icons.md | `@veltra/icons` — SVG 图标组件 |
| packages/vite.md | `@veltra/vite` — Vite 自动导入插件 |
| packages/release.md | 发布流程 — Changesets 版本管理与 CI 发布 |

## 组件文档（`@veltra/desktop`）

| 文档 | 内容 |
|------|------|
| packages/desktop/index.md | **70+ 组件目录 / 80+ U 组件导出索引**（按字母序） |
| packages/desktop/installation.md | 安装、注册、按需引入 |
| packages/desktop/patterns.md | Props/Emits/Slots/Exposed 通用模式 |
| `packages/desktop/components/*.md` | 每个组件的独立文档（Props/Emits/示例） |

## 按任务查找

| 你想做什么 | 看这里 |
|-----------|--------|
| 在项目里用组件 | quick-start.md → packages/desktop/index.md |
| 写一个 UButton | packages/desktop/components/button.md |
| 写表单 | packages/desktop/components/form.md |
| 用表格 | packages/desktop/components/table.md |
| 弹出对话框 | packages/desktop/components/dialog.md |
| 做主题切换 | packages/styles.md 的「Theme 系统」 |
| 自定义 SCSS | packages/styles.md 的「SCSS 基础设施」 |
| 用组合式函数 | packages/compositions.md |
| 用指令 | packages/directives.md |
| 配置 Vite | packages/vite.md |
| 了解类型系统 | packages/utils.md 的「共享类型」 |
| 了解 BEM 类名 | core-concepts.md 的「BEM 命名规范」 |
