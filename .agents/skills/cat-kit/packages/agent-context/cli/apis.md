# agent-context CLI — 命令面

```bash
npm install -g @cat-kit/agent-context

agent-context install [--tools <ids>] [--yes] [--check]
agent-context sync [--check]
agent-context init [--scope <name>] [--yes]
agent-context validate
agent-context context
agent-context status
agent-context done [--yes]
agent-context index
agent-context skill-eval
agent-context prompt-gen [--tools <ids>] [--profile <default|whj>] [--yes] [--check]
agent-context upgrade
agent-context --version
```

产物：

- `install`：canonical `.agents/skills/ac-workflow/`，可选兼容入口（如 `.cursor/skills/ac-workflow/`）
- `init`：`.agent-context/.env` 与 scoped 计划目录
- `prompt-gen`：用户主目录下各工具的全局提示词文件

本包无可用的根类型入口；`generated/agent-context/` 不作为编程 API 依据。
