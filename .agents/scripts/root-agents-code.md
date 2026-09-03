# AGENTS

Agent 入口索引。详细内容在 `.agents/docs/`，**按需读取，禁止一次加载全部**。

## 文档

| 文件 | 何时读 | 何时更新 |
| --- | --- | --- |
| `.agents/docs/PROJECT.md` | 需要知道项目类别与仓库结构 | 仅 setup：类别、组织结构、全栈形态变了 |
| `.agents/docs/ARCHITECTURE.md` | 业务/技术架构、技术栈 | 仅 setup：换栈、改分层、加/删应用边界。implement 禁止改 |
| `.agents/docs/DEV-STANDARDS.md` | 写代码、做 review | 仅 setup：规范或偏好变了 |
| `.agents/docs/SMELLS.md` | 写代码时按坏味道边写边收；review 对照 | 仅 setup：技能包模板变了 |
| `.agents/docs/CODE-MAP.md` | 定位模块；按模块/路径检索，禁止全文加载 | implement / sync-docs：模块表增删行，或某模块路径、入口、职责、依赖边变了。只改相关行。架构级变化先 setup 改 ARCHITECTURE，再由 setup 同步本文件。模块内部加文件不算。 |
| 已有技能 / 包内 `AGENTS.md` / `ACCEPTANCE.md` | 被本次改动说错时读并当场改那一份 | implement 或 `sync-docs` |
