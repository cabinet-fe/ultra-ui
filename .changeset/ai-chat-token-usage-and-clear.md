---
'@veltra/ai': patch
---

- `@veltra/ai`：支持 Token 用量统计展示与清空会话功能。
  - `UAiChat` 与 `useChat` 增加 `tokenUsage`（累计）和 `lastTurnUsage`（单轮）用量跟踪，支持在输入栏展示用量与明细；
  - `UAiChat` 输入栏新增清空会话二次确认按钮，并优化清空后即时恢复空闲欢迎状态的交互。
