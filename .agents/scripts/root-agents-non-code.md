# AGENTS

Agent 入口索引。详细内容在 `.agents/docs/`，**按需读取，禁止一次加载全部**（标「始终读取」的除外）。可在文档表追加其它 `.agents/docs/` 文件。禁止短注、流程章、规范正文。

## 文档

| 文件 | 何时读 | 何时更新 |
| --- | --- | --- |
| `.agents/docs/PROJECT.md` | 需要知道项目类别与仓库结构 | sync-docs：类别、组织结构变了。代码/非代码切换先 setup |
| `.agents/docs/INSTRUCTIONS.md` | 始终读取 | 用户直接编辑；sync-docs 点名。agent 不自动写入 |
