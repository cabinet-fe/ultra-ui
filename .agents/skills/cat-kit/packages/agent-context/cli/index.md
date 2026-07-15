# agent-context — CLI

## 何时使用

安装/同步 Skill、初始化 SCOPE、查看与归档计划状态。这些是 **CLI 子命令**，不是对话协议。

## 命令一览

| 命令 | 作用 |
| --- | --- |
| `install [--tools <ids>] [--check] [--yes]` | 安装 `ac-workflow` Skill；默认写入 `.agents/skills/ac-workflow/` |
| `sync [--check]` | 升级后刷新已安装 Skill；`--check` 只报告差异 |
| `init [--scope <name>] [--yes]` | 初始化 SCOPE（默认 Git `user.name`） |
| `status` | 人类可读的当前计划/队列/归档概况 |
| `context` | 含校验的 JSON 快照（脚本/智能体） |
| `validate` | 只校验目录与计划状态 |
| `done [--yes]` | 归档已执行计划；若有 preparing 则晋升下一项 |
| `index` | 生成或更新计划索引 |
| `skill-eval` | 评估 Skill description 触发覆盖 |
| `prompt-gen [--tools ...] [--profile default\|whj] [--yes] [--check]` | 在用户主目录写全局提示词 |
| `upgrade` | 升级 CLI 包 |

`--tools`（install）：`claude,codex,cursor,antigravity,agents,gemini,copilot`  
`--tools`（prompt-gen）：`claude,codex,gemini,antigravity`

详情见 [apis.md](apis.md)（命令面说明）。协议动作见 [protocols](../protocols/index.md)。

## 约束

- 无已发布编程 API；不要 `import '@cat-kit/agent-context'`
- `install --check` / `sync --check` 有差异时非 0 退出
- CLI `done` 要求当前计划为 `已执行`
