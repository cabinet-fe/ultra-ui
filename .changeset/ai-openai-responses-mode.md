---
"@veltra/ai": minor
---

`createOpenAITransport` 支持 OpenAI Responses API（`/v1/responses`）并优先使用：`ChatProvider.mode` 可显式指定 `'responses'` / `'chat'`，缺省 auto——endpoint 以 `/responses` / `/chat/completions` 结尾按后缀识别，裸 base URL 优先请求 `<base>/responses`、返回 404 / 405 时依次回退 `<base>/chat/completions` 与 endpoint 原地址（chat 格式），探测命中后记忆直连。responses 模式下 systemPrompt 写 `instructions`、消息历史转 `input` 项、工具为扁平结构、推理等级缺省写 `reasoning.effort`，`response.failed` / `error` 事件统一经 `onError` 上报。
