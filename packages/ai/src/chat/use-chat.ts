import { useModel } from '@veltra/compositions'
import { reactive, ref, type Ref } from 'vue'

import type { AiChatEmits, AiChatProps } from '../types'
import type { ChatAttachment, ChatMessage, ChatToolCall } from './types'

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

/**
 * AI 对话核心状态机：消息管理、流式追加、工具调用循环编排。
 * 与 UI 解耦，ai-chat.vue 只负责渲染与交互转发。
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

  /** 是否正在生成中（含工具执行与多轮循环） */
  const running = ref(false)

  let abortController: AbortController | null = null
  /** needsConfirm 工具的挂起确认器，key 为 toolCallId */
  const confirmResolvers = new Map<string, (approved: boolean) => void>()

  /** 向父组件同步消息快照（流式 delta 过于频繁，不同步，只在关键节点同步） */
  const snapshot = () => {
    emit('update:messages', messages.value.slice())
  }

  /** 发送一条用户消息并启动对话循环 */
  const send = (content: string, attachments?: ChatAttachment[]) => {
    if (running.value) return
    if (!content.trim() && !attachments?.length) return

    const message = reactive<ChatMessage>({ id: uid(), role: 'user', content, attachments })
    messages.value.push(message)
    snapshot()
    emit('send', message)

    void runConversation()
  }

  /** 执行单个工具调用（含确认门控），结果以 tool 消息追加 */
  const executeToolCall = async (toolCall: ChatToolCall, signal: AbortSignal) => {
    const appendToolMessage = (content: string) => {
      messages.value.push(
        reactive<ChatMessage>({ id: uid(), role: 'tool', toolCallId: toolCall.id, content })
      )
    }

    const tool = props.tools?.find((t) => t.name === toolCall.name)

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
    const controller = new AbortController()
    abortController = controller

    try {
      await runRound(controller)
    } finally {
      running.value = false
      abortController = null
      snapshot()
    }
  }

  /** 单轮生成；存在工具调用时执行后递归进入下一轮（递归避免 await-in-loop） */
  const runRound = async (controller: AbortController): Promise<void> => {
    if (!props.transport) return
    const { signal } = controller

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
          tools: props.tools,
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
      emit('finish', assistant)
      return
    }

    // 工具串行执行（保持结果消息与调用顺序一致），用 Promise 链避免 await-in-loop
    await toolCalls.reduce<Promise<void>>(
      (prev, toolCall) =>
        prev.then(() => (signal.aborted ? undefined : executeToolCall(toolCall, signal))),
      Promise.resolve()
    )
    snapshot()

    if (signal.aborted) return

    return runRound(controller)
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

  /** 清空消息，生成中则先中断 */
  const clear = () => {
    abort()
    messages.value = []
    snapshot()
  }

  return { messages, running, send, abort, regenerate, clear, respondToolCall }
}
