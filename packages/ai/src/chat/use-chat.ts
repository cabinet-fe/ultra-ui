import { useModel } from '@veltra/compositions'
import { reactive, ref, watch, type Ref } from 'vue'

import { createBuiltinTools } from '../tools'
import type { AiChatEmits, AiChatProps } from '../types'
import type {
  ChatAttachment,
  ChatMessage,
  ChatQueuedMessage,
  ChatTool,
  ChatToolCall
} from './types'

export interface UseChatOptions {
  props: AiChatProps
  emit: AiChatEmits
}

const uid = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function serializeResult(result: unknown): string {
  if (typeof result === 'string') return result
  try {
    return JSON.stringify(result) ?? 'null'
  } catch {
    return String(result)
  }
}

/** 内置工具 + 用户工具，同名时内置优先 */
function resolveTools(userTools?: ChatTool[]): ChatTool[] {
  const builtins = createBuiltinTools()
  const names = new Set(builtins.map((t) => t.name))
  return [...builtins, ...(userTools ?? []).filter((t) => !names.has(t.name))]
}

/**
 * AI 对话核心状态机：消息管理、流式追加、工具调用循环编排。
 * 与 UI 解耦，ai-chat.vue 只负责渲染与交互转发。
 * 始终注入内置工具（如 askQuestion），无需经 props 传入。
 */
export function useChat(options: UseChatOptions) {
  const { props, emit } = options

  const messages = useModel({
    props,
    propName: 'messages',
    emit,
    local: true,
    defaultValue: []
  }) as Ref<ChatMessage[]>

  const model = useModel({ props, propName: 'model', emit, local: true }) as Ref<string | undefined>

  const reasoningLevel = useModel({ props, propName: 'reasoningLevel', emit, local: true }) as Ref<
    string | undefined
  >

  /** 是否正在生成中（含工具执行与多轮循环） */
  const running = ref(false)

  /** 待发送队列：会话进行中提交的新消息按序排队，收尾后先进先出自动接续 */
  const queue = ref<ChatQueuedMessage[]>([])

  let abortController: AbortController | null = null
  /** needsConfirm 工具的挂起确认器，key 为 toolCallId */
  const confirmResolvers = new Map<string, (approved: boolean) => void>()
  /** 当前会话是否自然完成（finish）；决定收尾后是否自动消耗队列 */
  let finishedNaturally = false
  /** startQueued 触发的中断需要在收尾后立即接续队首 */
  let resumeAfterAbort = false

  /** 按当前模型校正推理等级（无 levels 则清空；值不合法则落到默认/首项） */
  const syncReasoningForModel = (modelId: string | undefined) => {
    const option = props.models?.find((m) => m.id === modelId)
    if (!option?.reasoningLevels?.length) {
      if (reasoningLevel.value !== undefined) {
        reasoningLevel.value = undefined
      }
      return
    }
    const levels = option.reasoningLevels
    if (reasoningLevel.value && levels.some((l) => l.value === reasoningLevel.value)) return
    reasoningLevel.value = option.defaultReasoningLevel ?? levels[0]?.value
  }

  // models / model 变化时：确保有合法选中模型，并校正推理等级
  watch(
    () => [props.models, model.value] as const,
    ([models, current]) => {
      if (!models?.length) return
      if (!current || !models.some((m) => m.id === current)) {
        model.value = models[0]!.id
        return
      }
      syncReasoningForModel(current)
    },
    { immediate: true }
  )

  /** 向父组件同步消息快照（流式 delta 过于频繁，不同步，只在关键节点同步） */
  const snapshot = () => {
    emit('update:messages', messages.value.slice())
  }

  /**
   * 发送一条用户消息。会话进行中时进入待发送队列（不丢失），
   * 会话自然结束后按 FIFO 自动接续；空闲时立即开始新会话。
   */
  const send = (content: string, attachments?: ChatAttachment[]) => {
    if (!content.trim() && !attachments?.length) return
    enqueue(content, attachments)
  }

  /**
   * 向队列插入一条消息；beforeId 指定插到某条之前（缺省追加到尾部）。
   * 空闲时立即消耗队首（保持先来先发的合理顺序）。
   */
  const enqueue = (
    content: string,
    attachments?: ChatAttachment[],
    beforeId?: string
  ): ChatQueuedMessage => {
    const item: ChatQueuedMessage = { id: uid(), content, attachments }
    const anchorIndex = beforeId ? queue.value.findIndex((q) => q.id === beforeId) : -1
    if (anchorIndex === -1) {
      queue.value.push(item)
    } else {
      queue.value.splice(anchorIndex, 0, item)
    }
    if (!running.value) drainQueue()
    return item
  }

  /** 消耗队首并开始新一轮会话 */
  const drainQueue = () => {
    const next = queue.value.shift()
    if (next) startUserTurn(next.content, next.attachments)
  }

  /** 立即执行队列中的某条：中断当前会话，该条插队为下一条（其余保持原顺序） */
  const startQueued = (id: string) => {
    const item = removeQueued(id)
    if (!item) return

    if (!running.value) {
      startUserTurn(item.content, item.attachments)
      return
    }

    // 插回队首并中断当前会话，收尾逻辑会自动接上它
    queue.value.unshift(item)
    resumeAfterAbort = true
    abort()
  }

  /** 从队列移除某条（返回被移除项；编辑场景由 UI 取回内容） */
  const removeQueued = (id: string): ChatQueuedMessage | undefined => {
    const index = queue.value.findIndex((item) => item.id === id)
    if (index === -1) return undefined
    const [item] = queue.value.splice(index, 1)
    return item
  }

  /** 推送用户消息并启动对话循环 */
  const startUserTurn = (content: string, attachments?: ChatAttachment[]) => {
    const message = reactive<ChatMessage>({ id: uid(), role: 'user', content, attachments })
    messages.value.push(message)
    snapshot()
    emit('send', message)

    void runConversation()
  }

  /** 执行单个工具调用（含确认门控），结果以 tool 消息追加 */
  const executeToolCall = async (
    toolCall: ChatToolCall,
    signal: AbortSignal,
    tools: ChatTool[]
  ) => {
    const appendToolMessage = (content: string) => {
      messages.value.push(
        reactive<ChatMessage>({ id: uid(), role: 'tool', toolCallId: toolCall.id, content })
      )
    }

    const tool = tools.find((t) => t.name === toolCall.name)

    if (!tool) {
      toolCall.status = 'error'
      toolCall.error = `未找到名为 "${toolCall.name}" 的工具`
      appendToolMessage(`Error: tool "${toolCall.name}" is not available.`)
      return
    }

    if (tool.needsConfirm) {
      toolCall.status = 'awaiting-confirm'
      const approved = await new Promise<boolean>((resolve) => {
        confirmResolvers.set(toolCall.id, resolve)
        signal.addEventListener('abort', () => resolve(false), { once: true })
      })
      confirmResolvers.delete(toolCall.id)

      if (!approved) {
        toolCall.status = 'rejected'
        appendToolMessage(`The user rejected the execution of tool "${toolCall.name}".`)
        return
      }
    }

    toolCall.status = 'running'
    try {
      const args = toolCall.arguments ? JSON.parse(toolCall.arguments) : {}
      const result = await tool.execute(args, { toolCall, signal })
      toolCall.status = 'success'
      toolCall.result = serializeResult(result)
      appendToolMessage(toolCall.result)
    } catch (error) {
      toolCall.status = 'error'
      toolCall.error = error instanceof Error ? error.message : String(error)
      appendToolMessage(`Error: ${toolCall.error}`)
    }
  }

  /** 对话主循环入口：生成 → 工具执行 → 再生成，直至模型不再调用工具 */
  const runConversation = async () => {
    if (!props.transport) return

    running.value = true
    finishedNaturally = false
    const controller = new AbortController()
    abortController = controller

    try {
      await runRound(controller, 0)
    } finally {
      running.value = false
      abortController = null
      snapshot()

      // 队列接续：自然完成或 startQueued 中断插队时自动发下一条；
      // 手动停止 / 出错时保留队列，交由用户处置
      const shouldResume = finishedNaturally || resumeAfterAbort
      finishedNaturally = false
      resumeAfterAbort = false
      if (shouldResume) drainQueue()
    }
  }

  /** 单轮生成；存在工具调用时执行后递归进入下一轮（递归避免 await-in-loop） */
  const runRound = async (controller: AbortController, depth: number): Promise<void> => {
    if (!props.transport) return
    const { signal } = controller
    const tools = resolveTools(props.tools)

    const assistant = reactive<ChatMessage>({
      id: uid(),
      role: 'assistant',
      content: '',
      status: 'streaming',
      toolCalls: []
    })
    messages.value.push(assistant)

    let requestError: Error | null = null

    try {
      await props.transport(
        {
          // 排除刚追加的 assistant 占位消息
          messages: messages.value.slice(0, -1),
          systemPrompt: props.systemPrompt,
          tools,
          model: model.value,
          reasoningLevel: reasoningLevel.value,
          signal
        },
        {
          onTextDelta: (delta) => {
            assistant.content += delta
          },
          onReasoningDelta: (delta) => {
            assistant.reasoning = (assistant.reasoning ?? '') + delta
          },
          onToolCall: (call) => {
            const toolCall = reactive<ChatToolCall>({ ...call, status: 'pending' })
            assistant.toolCalls!.push(toolCall)
            emit('tool-call', toolCall)
          },
          onError: (error) => {
            requestError = error
          }
        }
      )
    } catch (error) {
      requestError = error instanceof Error ? error : new Error(String(error))
    }

    if (signal.aborted) {
      assistant.status = 'aborted'
      return
    }

    if (requestError) {
      assistant.status = 'error'
      emit('error', requestError)
      return
    }

    assistant.status = 'done'

    const toolCalls = assistant.toolCalls ?? []
    if (!toolCalls.length) {
      completeAsFinish(assistant)
      return
    }

    // 工具串行执行（保持结果消息与调用顺序一致），用 Promise 链避免 await-in-loop
    await toolCalls.reduce<Promise<void>>(
      (prev, toolCall) =>
        prev.then(() => (signal.aborted ? undefined : executeToolCall(toolCall, signal, tools))),
      Promise.resolve()
    )
    snapshot()

    if (signal.aborted) return

    // 终结工具执行成功：工具 UI 即最终答复，不再回灌模型生成文字
    const hitTerminal = toolCalls.some(
      (call) => call.status === 'success' && tools.some((t) => t.name === call.name && t.terminal)
    )
    if (hitTerminal) {
      completeAsFinish(assistant)
      return
    }

    // 达到最大轮次上限：停止继续请求，防止模型失控循环调用工具
    if (depth + 1 >= (props.maxToolRounds ?? 10)) {
      completeAsFinish(assistant)
      return
    }

    return runRound(controller, depth + 1)
  }

  /** 标记本轮对话自然完成（收尾后据此自动消耗待发送队列） */
  const completeAsFinish = (assistant: ChatMessage) => {
    finishedNaturally = true
    emit('finish', assistant)
  }

  /** 中断当前生成，挂起的工具确认按拒绝处理 */
  const abort = () => {
    abortController?.abort()
  }

  /** 响应 needsConfirm 工具的用户确认 */
  const respondToolCall = (toolCallId: string, approved: boolean) => {
    confirmResolvers.get(toolCallId)?.(approved)
  }

  /** 重新生成：移除最后一条用户消息之后的所有消息，重新跑对话循环 */
  const regenerate = () => {
    if (running.value) return

    const list = messages.value
    let lastUserIndex = -1
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i]?.role === 'user') {
        lastUserIndex = i
        break
      }
    }
    if (lastUserIndex === -1 || lastUserIndex === list.length - 1) return

    messages.value = list.slice(0, lastUserIndex + 1)
    snapshot()
    void runConversation()
  }

  /** 清空消息与待发送队列，生成中则先中断 */
  const clear = () => {
    abort()
    queue.value = []
    messages.value = []
    snapshot()
  }

  return {
    messages,
    model,
    reasoningLevel,
    running,
    queue,
    send,
    abort,
    regenerate,
    clear,
    respondToolCall,
    enqueue,
    startQueued,
    removeQueued
  }
}
