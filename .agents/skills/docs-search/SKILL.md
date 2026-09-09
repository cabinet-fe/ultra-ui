---
name: docs-search
description: >
  检索企业内部库文档。写代码或回答问题时需要查阅内部库 API、用法、约束，
  或用户要求搜索/阅读内部库文档时使用。运行本技能内嵌查询脚本：先检测 `DOCS_SERVER_URL`
  （缺失时引导用户配置），再列出已收录库、搜索（可限定单库）、取全文或章节。
  不要为每个库单独建技能。
---

# docs-search 文档检索

企业内部库文档检索：一个通用技能覆盖全部已收录库，动态发现，不做每库一技能。

需要内部库事实时，**直接运行本技能内嵌脚本**，不要凭训练数据猜测私有 API。

脚本：`scripts/query.mjs`（Node ≥ 24，零依赖）。从本技能根目录运行，或对该文件使用绝对路径。服务地址只读环境变量 `DOCS_SERVER_URL`（结尾斜杠由脚本去掉）；落盘只允许仓库根目录 gitignore 过的 `.env`，禁止写进本技能、代码或会提交入库的配置。

## 流程

### 1. 检测环境变量（始终第一步）

运行任何查询前，先检查进程环境变量 `DOCS_SERVER_URL`（按宿主 shell 语法：POSIX 用 `printenv`，PowerShell 用 `$env:DOCS_SERVER_URL`），并读当前仓库根目录 `.env`，两处任一有值即算已配置。

- 已配置：直接进入第 2 步。值来自 `.env` 时，命令写成 `node --env-file=.env <脚本路径> …`；`--env-file` 是 Node 内置参数，Windows/macOS/Linux 通用，禁止用 `set -a && source` 等 POSIX 专属前缀。
- 缺失：引导用户补齐：
  1. 用提问工具向用户询问服务地址（向文档服务管理员索取）；禁止编造或猜测地址。
  2. 写入当前仓库根目录 `.env`（已存在则只补缺失行，不覆盖已有值）。格式：`DOCS_SERVER_URL=<地址>`，`=` 两侧不留空格。
  3. 确认 `.gitignore` 已含 `.env`；没有则追加。

### 2. 查询

按顺序：`libraries` 发现库 → `search` 命中目标（可选 `--library` 限定单库）→ `get` 取全文或章节。搜索为空则换关键词重试。以下示例假定值已在进程环境；值来自 `.env` 时按第 1 步给每条命令加 `--env-file=.env`。

```bash
node scripts/query.mjs libraries
node scripts/query.mjs search --q <关键词> [--library <slug>]
node scripts/query.mjs get --library <slug> --path <path> [--section <章节>]
```

stdout 为服务端 JSON。HTTP 非 2xx 时脚本非零退出，把 stderr 原文转述给用户；脚本报「缺少必填环境变量」说明第 1 步没做或 `.env` 未加载，回到第 1 步补齐后重跑。

## 反模式

- 为单个库复制/新建检索技能
- 把 `DOCS_SERVER_URL` 写进技能副本、代码或会提交入库的配置文件（gitignore 过的仓库 `.env` 是唯一落盘位置）
- 缺 `DOCS_SERVER_URL` 时不问用户，编造或猜测服务地址继续跑
- 用 POSIX 专属写法（`set -a && source`、`VAR=value cmd` 前缀）当通用命令——Windows 的 cmd/PowerShell 不支持，跨平台加载 `.env` 一律用 `node --env-file`
- 未检索就按训练数据实现内部库调用
