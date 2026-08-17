# UAiChat - AI 对话

## 类型文件

见 `./types.d.ts`

## 示例

见 `./examples.md`

## 辅助工具

本组件通常配合以下工具来使用。

### createOpenAITransport

创建 OpenAI 兼容协议（chat/completions SSE）的对话传输层；支持多 Provider，按 `request.model` 路由到对应 `endpoint`（完整 URL 或相对路径均可）。也可自行实现 ChatTransport 接入任意后端。

返回值在函数对象上挂载只读 `.models`（扁平 `ChatModelOption[]`）与 `.defaultModel`，可直接传给 `UAiChat` 的 `models` / `model`。

**破坏性变更**：旧的单字段 `{ endpoint, apiKey, model }` 已移除，请改用 `providers`。

使用示例:

```ts
import { createOpenAITransport } from '@veltra/ai'

const transport = createOpenAITransport({
  providers: [
    {
      id: 'deepseek',
      endpoint: 'https://api.deepseek.com/v1/chat/completions',
      apiKey: import.meta.env.VITE_DEEPSEEK_KEY,
      models: [{ id: 'deepseek-chat', label: 'DeepSeek Chat' }]
    }
  ]
})
```

### useChat

与 UI 解耦的对话编排状态机（消息管理 + 工具调用循环 + 待发送队列），UAiChat 内部即基于它实现；需要无头（headless）对话或完全自定义 UI 时直接使用。`useChat` 会始终注入内置工具（如 `askQuestion`），与传入的 `tools` 合并（同名内置优先）。请求会携带当前 `model` / `reasoningLevel`。会话进行中 `send` 的消息进入 `queue` 按 FIFO 自动接续，`startQueued(id)` 可中断插队。

使用示例:

```ts
import { useChat, type AiChatEmits } from '@veltra/ai'

// emit 需满足 AiChatEmits 签名：'update:messages' | 'update:model' | 'update:reasoningLevel' | 'send' | 'finish' | 'error' | 'tool-call'
const emit = ((event: string, ...args: unknown[]) => {
  console.log(event, args)
}) as AiChatEmits

const chat = useChat({ props: { transport, tools, models: transport.models }, emit })

chat.send('你好')
// chat.messages.value / chat.model.value / chat.reasoningLevel.value / chat.running.value
// chat.queue.value / chat.enqueue() / chat.startQueued(id) / chat.removeQueued(id)
// chat.abort() / chat.regenerate() / chat.clear()
```

## UAiOrb - 活体球头像

canvas 2D 实现的扁平纯色活体球（扁椭圆 mochi 造型、天然蔚蓝 + 白色大眼睛，原地呼吸无弹跳、无打光），`UAiChat` 的空状态欢迎区与生成中「工作中…」指示使用的就是它，也可单独使用。灵动感的核心是眼部状态机：随机眨眼（偶发双眨）、视线游移 / 转头（idle 随机游移、thinking 缓慢扫视）、`thinking` 眯眼、`speaking` 嘴部开合。

指针交互：悬停时视线跟随指针方位（转头看向鼠标），点击球体做 Q 弹挤压回弹并触发 `click` 事件。此外可通过模板引用调用 `react(type)` 播放约 1-2s 瞬时表情，对应阶段性事件：`happy` 回答完毕 / 成功（先睁大眼再弯眼大笑 + 点头）、`shock` 惊讶（睁大眼 + 后仰）、`frustrated` 工具调用失败（闭紧眼睛 + 摇头）。UAiChat 内已自动接线：工具调用失败播 `frustrated`；对话结束或失败时工作球停留约 2.5s 再隐藏（成功播 `happy`，出错播 `frustrated`，用户中断仅停留）。性能上按可见性启停 rAF（IntersectionObserver），`prefers-reduced-motion` 下降级为静态帧。

```vue
<u-ai-orb ref="orb" :size="48" status="idle" @click="onOrbClick" />
```

```ts
import type { AiOrbExposed } from '@veltra/ai'

const orbRef = useTemplateRef<AiOrbExposed>('orb')
orbRef.value?.react('happy') // 'happy' | 'shock' | 'frustrated'
```
