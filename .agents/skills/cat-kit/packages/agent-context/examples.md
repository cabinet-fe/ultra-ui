# @cat-kit/agent-context — 组合示例

```bash
npm install -g @cat-kit/agent-context
cd /path/to/project
agent-context install --tools cursor
agent-context init
agent-context validate
agent-context status
```

随后对已发现 Skill 的智能体：

```text
初始化这个项目的 agent context
为“新增导出功能”出计划
按当前计划开始实现
```

完成后：

```bash
agent-context done --yes
agent-context context
```

升级 Skill 内容：

```bash
agent-context sync --check   # CI 可用
agent-context sync
```
