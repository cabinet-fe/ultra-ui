# 架构

## 业务架构

Ultra UI 是 Vue 3 组件与能力库。主用户是 cabinet-fe 内部业务前端，同时按公开 npm 库维护（作用域 `@veltra/*`）。

核心域：

- 桌面 UI：`@veltra/desktop` 及底层 utils / styles / compositions / directives / icons
- 电子表格与报表：`@veltra/sheet-core`（模型/公式/IO/网格）+ `@veltra/sheet`（USheet、UReportDesigner、UReportViewer）
- AI 对话：`@veltra/ai`（UAiChat、useChat、可插拔 transport、UAiOrb）

对外交付：npm 包 + `skills/veltra-ui`（给 Agent 用的伴生技能）。文档站 `ultra-ui-doc` 在本仓库外。`@veltra/mobile` 长期占位，不纳入交付与发版。`playground` 不发布，但是官方参考实现：组件预览，以及 report DataConnector HTTP 契约、DeepSeek AI 代理，宿主可对照接入。

库本身无账号、无服务端状态；业务数据由宿主管。报表取数经宿主实现的 `DataConnector`（playground 提供 HTTP 参考实现）。

## 技术架构

发布单元是 `packages/*` 下的 `@veltra/*` 库（`vp pack` → `dist/`）。宿主安装所需包，peer 由宿主提供（`vue`、`@cat-kit/core`、`@cat-kit/fe`、以及声明为 peer 的其它 `@veltra/*`）。开发时内部 peer 为 `workspace:^`；playground 用 `workspace:*` 链到源码。

进程边界仅存在于本地预览，不是生产服务：

| 进程 | 端口 | 职责 |
| --- | --- | --- |
| playground 前端（Vite） | 7788 | 组件/图标/AI/Sheet 演示 |
| playground 参考服务（Bun + Hono） | 8787 | DataConnector HTTP 参考实现（工作区 SQLite 仅本地）+ DeepSeek `/ai` 代理（Key 不下发浏览器） |

分层（库内）：

- 无框架核心：`sheet-core/core`（纯 TS）、`utils`（无 Vue 组件）
- Vue 能力：compositions、directives、desktop/ai/sheet 组件
- 渲染适配：`sheet-core/grid`（VTable）；desktop 的 Excel 预览把 sheet-core 当 optional peer
- 构建辅助：`@veltra/vite` 的 `VeltraUIResolver`（扫描 desktop / ai / sheet 的组件目录生成表）
- 主题：`@veltra/styles` 的 SCSS token + `@veltra/styles/theme`（运行时依赖 compositions 的 `useConfig`；compositions 不得 re-export theme）

CI：`.github/workflows/release.yml`。`bun run release` 在 `dev` 分支落版本并推送，远端负责测试、构建、npm publish。

### 技术栈

来源：根 `package.json`、`vite.config.ts`、各包 `package.json` / AGENTS.md。

| 层 | 选型 | 备注 |
| --- | --- | --- |
| 语言 / runtime | TypeScript ^6、Bun（packageManager bun@1.4） | 库代码 ESM |
| 框架 | Vue 3.5+（Composition API + `<script setup>`） | peer；playground 另用 vue-router |
| 样式 | SCSS（sass-embedded）+ BEM + CSS 变量 | `@use 'pkg:@veltra/styles/...'`，构建需 `NodePackageImporter` |
| 表格渲染 / IO | `@visactor/vtable`、`@visactor/vtable-editors`、hucre | 在 sheet-core；sheet 不直接依赖 |
| 富文本 / PDF / Markdown | Lexical、EmbedPDF（desktop）；markstream-vue（ai） | 见各包 dependencies |
| 构建 / 包管理 | Vite+（`vp`）、workspaces `packages/*` + `playground` | 根 `vite.config.ts` 只管 test/lint/fmt/run/staged；库 pack 在包内 |
| 测试 | Vitest（`vp test`）、happy-dom | 根 test.projects 列出参与包 |
| 校验 / 格式化 | Oxlint + tsgolint + Oxfmt | `vp lint` 含 typeCheck；`vp fmt` |
| 发布 | @changesets/cli、access public | 见「版本」；ignore `@veltra/mobile`、`playground` |
| 关键 peer | `@cat-kit/core`、`@cat-kit/fe`、`@veltra/icons`、vue | 宿主安装；内部 `@veltra/*` peer 用 `workspace:^` |

## 未决

- `@veltra/mobile` 启动时机（当前按长期占位，不发版）
