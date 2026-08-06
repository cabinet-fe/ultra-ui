---
'@veltra/ai': major
---

提问工具改为 UAiChat 始终内置自动注入；移除公开导出 `createAskQuestionTool`（保留 `AskQuestion*` 类型）。用户无需再手动创建并传入该工具，同名用户工具将被忽略。
