---
'@veltra/ai': minor
---

`createOpenAITransport` 改为多 Provider 配置（按模型路由；支持完整 URL / 相对路径）；UAiChat 输入栏增加模型与推理等级选择器（`models` / `v-model:model` / `v-model:reasoning-level`）。旧的单字段 `{ endpoint, apiKey, model }` 选项已移除。
