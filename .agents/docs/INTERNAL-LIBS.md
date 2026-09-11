# 内部库

写代码或查阅内部库 API 前，用 docs-search 技能检索，禁止凭训练数据猜测。

- `@cat-kit/*`（slug：`cat-kit`）：轻量工具系列，优先使用，避免重复造轮子。八个公开包共用同一 slug：`core`、`http`、`fe`、`be`、`crypto`、`cli`、`tsconfig`、`vitepress-theme`。本仓库运行时 peer 主要为 `@cat-kit/core`、`@cat-kit/fe`。

## `@cat-kit/*` 检索

- 限定本系列时加 `--library cat-kit`，不要把包名（如 `core`、`fe`）当成 slug。
- 不确定落在哪个包：先 `get --library cat-kit --path index.md`，按「模块速查」再取 `packages/<pkg>/...`。
- 查询写法与故障处理见 docs-search 技能。
