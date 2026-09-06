---
name: docs-mcp
description: >
  docs-mcp 企业文档检索系统的接入技能，双视角工作。库维护者视角：在库仓库安装推送脚本、
  按文档标准撰写 Markdown、判断并引导创建推送所需 .env 环境变量、在合适时机执行全量推送；
  库使用者视角：检测下游项目是否已接入 docs-mcp MCP，未接入则引导创建。
  在用户要求推送/同步/撰写库文档、配置或接入 docs-mcp、检索内部库文档时使用。
---

# docs-mcp 文档接入

docs-mcp 是企业内部库文档检索系统：库维护者把文档推送到中心服务建全文索引，库使用者在编辑器里让 AI 经远程 MCP 检索这些文档。

```
库维护者 ──push-docs.mjs（HTTP PUT）──▶ docs-mcp 服务（SQLite FTS5） ◀──streamable HTTP MCP── 库使用者（AI 编辑器）
```

## 角色判断

先判断本次任务服务于哪个角色，两者可在同一仓库共存；判断不准时用提问工具向用户确认。

| 信号 | 角色 | 流程 |
| --- | --- | --- |
| 用户要推送/同步本仓库文档，或本仓库是待发布文档的库 | 库维护者 | 库维护者流程 |
| 用户想检索某些库的文档，或本仓库是消费库的业务项目 | 库使用者 | 库使用者流程 |

## 库维护者流程

### 1. 安装推送脚本

- 检查仓库内 `scripts/push-docs.mjs` 是否存在。
- 不存在：从本技能目录把 `scripts/push-docs.mjs` 复制到仓库 `scripts/` 下。脚本零依赖免构建，Node ≥ 18 直接运行。

### 2. 判断是否引导创建 .env

检查时机（满足其一即检查）：

- 刚完成脚本安装（首次接入）
- 即将执行推送
- 推送报「缺少必填环境变量」

检查方法：读仓库根目录 `.env` 与当前 shell 环境，确认三个变量齐全：

| 变量 | 说明 |
| --- | --- |
| `DOCS_MCP_SERVER_URL` | docs-mcp 服务地址，如 `http://docs-mcp.internal:8080`（结尾斜杠脚本会自动去掉） |
| `DOCS_MCP_TOKEN` | 推送令牌，与服务端 `DOCS_MCP_PUSH_TOKEN` 一致，向服务管理员索取 |
| `DOCS_MCP_LIBRARY` | 库 slug：仅小写字母、数字与连字符（`^[a-z0-9-]+$`），通常取库名 |

缺失时引导创建：

1. 用提问工具向用户逐项询问缺失的值；禁止编造 token 或服务地址。
2. 写入 `.env`（已存在则只补缺失行，不覆盖已有值）。格式：`KEY=value`，`=` 两侧不留空格。
3. 确认 `.gitignore` 已含 `.env`；没有则追加。token 属敏感信息，严禁提交入库。

### 3. 按标准撰写文档

文档默认放 `docs/`（脚本参数可指定其他目录）。硬性要求：每个 `.md` 必须有 YAML frontmatter 且 `title` 非空，否则推送直接失败。撰写或更新文档时遵循 [references/doc-standards.md](references/doc-standards.md)。

### 4. 执行推送

执行时机：

- 用户明确要求推送/同步文档：直接执行
- 文档发生实质性变更（新增/修改/删除 `.md`）后：主动询问用户是否同步推送
- 推送失败修复后：修复完成即重推

命令（脚本只认进程环境变量，`.env` 需先加载）：

```bash
set -a && source .env && set +a && node scripts/push-docs.mjs
```

Node ≥ 20.6 可用 `node --env-file=.env scripts/push-docs.mjs`。

行为须知：

- 整库覆盖：每次推送全量替换服务端该库全部文档，服务端旧文档会被删除
- 本地校验：任一文档缺 frontmatter 或缺 `title` 直接失败，不会发出请求
- 失败时把脚本错误原文转述给用户，修复后重推，禁止盲目重试

可选：接入 CI（GitHub Actions）让文档随主干自动同步：

```yaml
- run: node scripts/push-docs.mjs
  env:
    DOCS_MCP_SERVER_URL: ${{ vars.DOCS_MCP_SERVER_URL }}
    DOCS_MCP_TOKEN: ${{ secrets.DOCS_MCP_TOKEN }}
    DOCS_MCP_LIBRARY: my-lib
```

## 库使用者流程

### 1. 检测是否已接入

在项目内检查 MCP 配置是否已有 docs-mcp 条目，常见位置：

- `.mcp.json`（Claude Code 项目级）
- `opencode.json` / `opencode.jsonc`（opencode 项目级，以及 `~/.config/opencode/` 全局级）
- 其他客户端的项目级 MCP 配置

快速判定：在上述文件中搜索 `docs-mcp`，任一文件含该条目即视为已接入。

### 2. 引导接入

未接入时：

1. 用提问工具询问服务地址（形如 `http://docs-mcp.internal:8080/mcp`），不要猜测。
2. 按用户使用的客户端写入配置：

**Claude Code**（命令行，或项目 `.mcp.json`）：

```bash
claude mcp add --transport http docs-mcp http://<服务地址>/mcp
```

```json
{
  "mcpServers": {
    "docs-mcp": { "type": "http", "url": "http://<服务地址>/mcp" }
  }
}
```

**opencode**（`opencode.json`）：

```json
{
  "mcp": {
    "docs-mcp": {
      "type": "remote",
      "url": "http://<服务地址>/mcp",
      "enabled": true
    }
  }
}
```

**其他支持远程 HTTP MCP 的客户端**（Kimi Code 等）：用通用 `mcpServers` JSON 格式（同 Claude Code）。

### 3. 验证接入

```bash
curl 'http://<服务地址>/api/v1/libraries'
```

返回 `{"libraries":[...]}` 即服务可达；再让 AI 调一次 MCP 的 `list_libraries` 工具确认链路。

## 检索工具使用（两角色通用）

写代码用到内部库时，先经 MCP 检索该库文档再动手，不要凭训练数据猜私有库 API：

| Tool | 参数 | 用途 |
| --- | --- | --- |
| `search` | `query` 必填；`library` 可选限定单库 | 全文检索，bm25 排序 + 标题加权，返回高亮片段 |
| `get_document` | `library`、`path` 必填 | 取文档全文与元数据 |
| `list_libraries` | 无 | 列出全部库 slug |

建议路径：`list_libraries` 确认目标库已收录 → `search` 命中目标 → `get_document` 读全文；搜索结果为空就换关键词重试。

## 检查清单

- [ ] 推送前：三个环境变量齐全，`.env` 已加入 `.gitignore`
- [ ] 每篇文档有 frontmatter 且 `title` 非空
- [ ] 新增文档符合 [references/doc-standards.md](references/doc-standards.md)
- [ ] 推送成功后向用户报告推送篇数
- [ ] 接入后验证服务可达再交付

## 反模式

- 编造或猜测 `DOCS_MCP_TOKEN`、服务地址、库 slug
- 把 token 写进代码、示例或提交到 git
- 推送失败后不看报错盲目重试
- 未经用户确认擅自修改全局 MCP 配置或提交 `.env`
- 文档塞满内部实现细节与敏感信息
