# @veltra/ai

AI 对话包。核心是「工具定义 + 自动编排」：传入不同 `tools`，`UAiChat` / `useChat` 自动跑 **tool_calls → 执行 → 结果回灌 → 继续生成**，直到模型不再调工具、命中终结工具，或达到 `maxToolRounds`。

```ts
import { UAiChat, UAiOrb, useChat, createOpenAITransport } from '@veltra/ai'
import type {
  ChatTool,
  ChatTransport,
  ChatMessage,
  ChatProvider,
  ChatModelOption,
  ChatToolRenderProps,
  AiChatExposed,
  AiOrbExposed
} from '@veltra/ai'
import '@veltra/ai/style'
```

## 安装

```bash
bun add @veltra/ai
```

Peer：`vue`（>=3.5.41）、`@veltra/desktop`、`@veltra/icons`、`@veltra/styles`、`@veltra/utils`、`@veltra/compositions`。运行时依赖 `markstream-vue`（流式 markdown，随本包安装）。

样式二选一：

- 入口 `import '@veltra/ai/style'`（含 `UAiChat` + `UAiOrb`）
- 或 `VeltraUIResolver` 按需解析 `<u-ai-chat>` / `<u-ai-orb>` 及对应 `style.ts`

组件根节点 `height: 100%`，**父级必须给明确高度**（如 `style="height: 100%"` 或 `calc(100vh - …)`）。

生产环境用相对路径 `endpoint` + 服务端代理；**不要把 API Key 下发浏览器**。`apiKey` 仅适合受控/本地调试。

## 选型

| 需求                                                | 用                                                           |
| --------------------------------------------------- | ------------------------------------------------------------ |
| 现成对话 UI（输入、消息、工具卡片、队列、模型选择） | `UAiChat`                                                    |
| 自绘 UI / 无头编排                                  | `useChat`（与 `UAiChat` 共用 `AiChatProps` / `AiChatEmits`） |
| OpenAI 兼容 `chat/completions` SSE                  | `createOpenAITransport({ providers })`                       |
| 其它协议或自有后端                                  | 实现 `ChatTransport`                                         |
| 活体球头像（欢迎区 / 工作中指示以外单独用）         | `UAiOrb`                                                     |

不要自己写工具循环；自有协议只实现 `ChatTransport`，把完整事件交给 handlers。

## 硬约束

- `transport` 必填。旧单字段 `{ endpoint, apiKey, model }` 已删除，必须 `providers`。
- 模型 `id` **跨 Provider 全局唯一**；重复会在创建 transport 时抛错。
- 发给模型的 tools 只有 `name` / `description` / `parameters`。其余字段（`execute`、`needsConfirm`、`terminal`、`render` 等）只参与本端编排与展示。
- `askQuestion` 由 `useChat` 始终注入；用户传入同名工具会被丢弃。`createBuiltinTools` / `createAskQuestionTool` **不是**公共 API。
- 工具串行执行；`execute` 的返回值（非 string 则 `JSON.stringify`）写入 `tool` 消息回灌模型。`throw` → 状态 `error`，模型看到 `Error: …`。
- 会话进行中 `send` 进入队列，不会丢。自然 `finish` 后 FIFO 接续；手动 `abort` / `error` 时队列保留且不自动发。

## 文档地图

按意图下钻，不要整包预读：

| 意图                                           | 先读                              |
| ---------------------------------------------- | --------------------------------- |
| Props / Emits / 插槽 / 实例方法 / 类型         | `./ai/api.md` + `./ai/types.d.ts` |
| 拷贝场景代码（接入、工具、面板、队列、持久化） | `./ai/examples.md`                |
| 完整类型声明                                   | `./ai/types.d.ts`                 |
