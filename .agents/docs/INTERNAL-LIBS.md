# 内部库

写代码或查阅内部库 API 前，用 docs-search 技能检索，禁止凭训练数据猜测。需求能被下列内部库覆盖时一律优先使用内部库：先检索用法再动手，不重复造轮子，不引入功能重叠的外部依赖；确实不覆盖才自研，并在汇报中说明原因。

- `@cat-kit/*`（slug：`cat-kit`）：轻量工具系列，优先使用，避免重复造轮子。八个公开包共用同一 slug：`core`、`http`、`fe`、`be`、`crypto`、`cli`、`tsconfig`、`vitepress-theme`。本仓库运行时 peer 主要为 `@cat-kit/core`、`@cat-kit/fe`。
- `infinitable`（slug：`infinite-table`，npm 包名与 slug 不一致）：多层 canvas 失效驱动渲染 + 全量虚拟滚动的高性能表格引擎，含公式引擎与 sheet/chart/watermark/print 官方插件；`packages/sheet`、`packages/desktop`、`playground` 直连依赖。表格、电子表格、虚拟滚动类需求一律基于它扩展，禁止另造表格轮子。peer 依赖 `@cat-kit/core`。

## `@cat-kit/*` 检索

- 限定本系列时加 `--library cat-kit`，不要把包名（如 `core`、`fe`）当成 slug。
- 不确定落在哪个包：先 `get --library cat-kit --path index.md`，按「模块速查」再取 `packages/<pkg>/...`。
- 查询写法与故障处理见 docs-search 技能。

## `infinitable` 检索

- 检索 slug 为 `infinite-table`，不要把 npm 包名 `infinitable` 当 slug。
- 使用方从 `infinitable` 单入口导入；sheet 层能力（模型/命令/公式/IO/SheetGrid）经 `infinitable/sheet` 子路径，公式注册表 API（`registerFormulaFunction` / `listFormulaFunctions` 等）经主入口；`@infinitable/*` 是其仓内分层包，不对外使用。
- 不确定导出在哪篇：先 `get --library infinite-table --path index.md`，按「模块速查」表定位 API 文档；插件能力经 `createXxxPlugin` 工厂返回的 handle 消费。
- 查询写法与故障处理见 docs-search 技能。
