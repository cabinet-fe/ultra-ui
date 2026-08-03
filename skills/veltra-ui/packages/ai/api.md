# UAiChat - AI 对话

## 类型文件

见 `./types.d.ts`

## 示例

见 `./examples.md`

## 辅助工具

本组件通常配合以下工具来使用。

### createOpenAITransport

创建 OpenAI 兼容协议（chat/completions SSE）的对话传输层；也可自行实现 ChatTransport 接入任意后端。

使用示例:

```ts
import { createOpenAITransport } from '@veltra/ai'
```

### createAskQuestionTool

创建内置提问工具：需求不明确或存在歧义时由模型发起提问，用户在工具卡片的内联分页表单中作答（预设选项 + 自定义输入，多题时「上一个 / 下一个」导航，末题显示「提交」），提交后结果回灌模型，卡片展示问答摘要。

使用示例:

```ts
import { createAskQuestionTool } from '@veltra/ai'

const tools = [createAskQuestionTool() /* ...其他工具 */]
```

### useChat

与 UI 解耦的对话编排状态机（消息管理 + 工具调用循环），UAiChat 内部即基于它实现；需要无头（headless）对话或完全自定义 UI 时直接使用。

使用示例:

```ts
import { useChat, type AiChatEmits } from '@veltra/ai'

// emit 需满足 AiChatEmits 签名：'update:messages' | 'send' | 'finish' | 'error' | 'tool-call'
const emit = ((event: string, ...args: unknown[]) => {
  console.log(event, args)
}) as AiChatEmits

const chat = useChat({ props: { transport, tools }, emit })

chat.send('你好')
// chat.messages.value / chat.running.value / chat.abort() / chat.regenerate() / chat.clear()
```
