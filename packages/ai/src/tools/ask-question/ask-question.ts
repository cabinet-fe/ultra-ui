import { QuestionFilled } from '@veltra/icons/normal'
import { computed, defineComponent, h, inject, type Component, type PropType } from 'vue'

import type { ChatTool, ChatToolCall, ChatToolMeta } from '../../chat/types'
import { AiChatDIKey } from '../../components/_shared/di'
import UAiQuestionCard from '../../components/ai-question-card/ai-question-card.vue'
import { deferAskQuestion, resolveAskQuestion, takeAskQuestionDeferred } from './deferred'

/** 预设选项项（支持纯字符串或带说明的结构化选项） */
export interface AskQuestionOption {
  /** 选项展示文案（支持标注 `(推荐)` / `(Recommended)` 自动提取为推荐徽标） */
  label: string
  description?: string
}

export interface AskQuestionItem {
  question: string
  /** 简短分类标签（如「鉴权方式」「技术栈」） */
  header?: string
  /** 预设选项（支持字符串或 { label, description }）；缺省为纯文本题 */
  options?: (string | AskQuestionOption)[]
  /** 是否允许多选（默认 false 单选） */
  multiple?: boolean
  placeholder?: string
}

export interface AskQuestionAnswer {
  question: string
  /** 用户回答（单选为所选值或自定义输入；多选为顿号连接的字符串） */
  answer: string
  /** 多选回答列表（多选或含多项时提供） */
  answers?: string[]
  skipped?: boolean
}

/** 提问工具参数（模型输出） */
export interface AskQuestionArgs {
  questions: AskQuestionItem[]
}

/** 提问工具结果（序列化后回灌模型，渲染层据此展示问答摘要） */
export interface AskQuestionResult {
  answers: AskQuestionAnswer[]
}

export interface CreateAskQuestionToolOptions {
  /** 工具名（传给模型），默认 askQuestion */
  name?: string
  description?: string
  /** 工具显示名，默认「提问」 */
  label?: string
  /** 工具图标，默认 QuestionFilled */
  icon?: Component
}

const DEFAULT_DESCRIPTION =
  '当需求不明确或存在歧义时，向用户提问以澄清。一次可提 1-4 个关键问题；' +
  '每个问题可提供简短分类标签（header）、若干预设选项（支持单选或多选），用户可选择选项、跳过或自定义输入。' +
  '如某选项为推荐方案，可在选项 label 末尾标注 `(推荐)` 或 `(Recommended)`。用户作答后再继续生成。'

/** 提问参数 JSON Schema（原样传给模型） */
const QUESTIONS_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      description: '问题列表',
      minItems: 1,
      maxItems: 4,
      items: {
        type: 'object',
        properties: {
          question: { type: 'string', description: '问题文案' },
          header: { type: 'string', description: '简短分类标签（可选，不超过 12 字）' },
          multiple: { type: 'boolean', description: '是否允许多选，默认 false 单选' },
          options: {
            type: 'array',
            description:
              '预设选项；支持纯字符串或 { label, description } 对象，缺省为纯文本题。推荐选项可在 label 中标注 (推荐)',
            items: {
              oneOf: [
                { type: 'string' },
                {
                  type: 'object',
                  properties: {
                    label: { type: 'string', description: '选项文案' },
                    description: { type: 'string', description: '选项补充说明' }
                  },
                  required: ['label']
                }
              ]
            }
          },
          placeholder: { type: 'string', description: '自定义输入占位文案' }
        },
        required: ['question']
      }
    }
  },
  required: ['questions']
}

function parseQuestions(toolCall: ChatToolCall): AskQuestionItem[] {
  try {
    const args = JSON.parse(toolCall.arguments || '{}') as Partial<AskQuestionArgs>
    return Array.isArray(args.questions) ? args.questions : []
  } catch {
    return []
  }
}

function isAnswerItem(item: unknown): item is AskQuestionAnswer {
  return Boolean(
    item && typeof item === 'object' && typeof (item as AskQuestionAnswer).question === 'string'
  )
}

function parseAnswers(toolCall: ChatToolCall): AskQuestionAnswer[] | undefined {
  if (toolCall.status !== 'success' || !toolCall.result) return undefined
  try {
    const result = JSON.parse(toolCall.result) as Partial<AskQuestionResult> | unknown[]
    if (Array.isArray(result)) {
      const list = result.filter(isAnswerItem)
      return list.length ? list : undefined
    }
    return Array.isArray(result.answers) ? result.answers : undefined
  } catch {
    return undefined
  }
}

function statusError(toolCall: ChatToolCall): string | undefined {
  if (toolCall.status === 'rejected') return '已取消'
  if (toolCall.status !== 'error') return undefined
  const err = toolCall.error ?? ''
  if (err.includes('Abort') || err.includes('取消')) return '已取消'
  return err || '提问失败'
}

export interface CreateQuestionToolMetaOptions {
  /** 服务端提问工具名（与 tool/call.name 匹配），默认 'askQuestion' */
  name?: string
  /** 工具显示名，默认 '提问' */
  label?: string
  /** 工具图标，默认 QuestionFilled */
  icon?: Component
  /** 自定义解析工具参数为问题列表（默认兼容 { questions }） */
  parseQuestions?: (toolCall: ChatToolCall) => AskQuestionItem[]
  /** 自定义解析工具结果为回答列表（默认兼容 { answers } 或 AskQuestionAnswer[]） */
  parseAnswers?: (toolCall: ChatToolCall) => AskQuestionAnswer[] | undefined
}

export function createAskQuestionRender(options?: {
  parseQuestions?: (toolCall: ChatToolCall) => AskQuestionItem[]
  parseAnswers?: (toolCall: ChatToolCall) => AskQuestionAnswer[] | undefined
}): Component {
  const parseQ = options?.parseQuestions ?? parseQuestions
  const parseA = options?.parseAnswers ?? parseAnswers

  return defineComponent({
    name: 'AskQuestionRender',
    props: { toolCall: { type: Object as PropType<ChatToolCall>, required: true } },
    setup(props) {
      const di = inject(AiChatDIKey, undefined)
      const linkedQuestion = computed(() =>
        di?.pendingQuestion?.value?.callId === props.toolCall.id
          ? di.pendingQuestion.value
          : undefined
      )
      const questions = computed(() => {
        if (linkedQuestion.value?.questions.length) return linkedQuestion.value.questions
        const cached = di?.questionCalls?.value?.[props.toolCall.id]
        if (cached?.length) return cached
        return parseQ(props.toolCall)
      })
      const answers = computed<AskQuestionAnswer[] | undefined>(() => {
        if (linkedQuestion.value) return undefined
        const parsed = parseA(props.toolCall)
        if (parsed) return parsed
        const cached = di?.resolvedQuestionAnswers?.value.get(props.toolCall.id)
        if (cached) return cached
        if (props.toolCall.status === 'success' && questions.value.length === 1) {
          const text = props.toolCall.result?.trim()
          if (text) return [{ question: questions.value[0]!.question, answer: text }]
        }
        return undefined
      })
      const error = computed(() => {
        const err = statusError(props.toolCall)
        if (err) return err
        if (!linkedQuestion.value && props.toolCall.status === 'success' && answers.value == null) {
          return props.toolCall.result?.trim() || '已回答'
        }
        return undefined
      })
      const onSubmit = (value: AskQuestionAnswer[]) => {
        if (linkedQuestion.value && di?.respondQuestion) {
          di.respondQuestion(linkedQuestion.value.rpcId, props.toolCall.id, value)
          return
        }
        resolveAskQuestion(props.toolCall.id, { answers: value })
      }
      return () =>
        h(UAiQuestionCard, {
          questions: questions.value,
          answers: answers.value,
          error: error.value,
          onSubmit
        })
    }
  })
}

export const AskQuestionRender = createAskQuestionRender()

/**
 * 创建内置提问工具：execute 挂起等待用户在 UI 中作答，提交后结果回灌模型。
 * 通过 `renderTo: 'reply'` 直接在回复流外层渲染，不进步骤容器。
 */
export function createAskQuestionTool(
  options: CreateAskQuestionToolOptions = {}
): ChatTool<AskQuestionArgs> {
  const {
    name = 'askQuestion',
    description = DEFAULT_DESCRIPTION,
    label = '提问',
    icon = QuestionFilled
  } = options

  return {
    name,
    description,
    parameters: QUESTIONS_SCHEMA,
    icon,
    label,
    render: AskQuestionRender,
    renderTo: 'reply',
    execute: (_args, { toolCall, signal }) =>
      new Promise<AskQuestionResult>((resolve, reject) => {
        deferAskQuestion(toolCall.id, { resolve, reject })
        signal.addEventListener(
          'abort',
          () => {
            // 不依赖 signal.reason（各环境 DOMException 行为不一），统一拒绝为 AbortError
            const error = new Error('Aborted')
            error.name = 'AbortError'
            takeAskQuestionDeferred(toolCall.id)?.reject(error)
          },
          { once: true }
        )
      })
  }
}

/**
 * 创建服务端 Session 模式下的提问工具渲染元信息（`ChatToolMeta`）：
 * 与客户端内置 `askQuestion` 共用 `UAiQuestionCard` 与 `renderTo: 'reply'` 外层渲染语义，
 * 支持历史回放解析与自定义参数/结果解析。
 */
export function createQuestionToolMeta(options: CreateQuestionToolMetaOptions = {}): ChatToolMeta {
  const {
    name = 'askQuestion',
    label = '提问',
    icon = QuestionFilled,
    parseQuestions: customParseQ,
    parseAnswers: customParseA
  } = options

  return {
    name,
    label,
    icon,
    renderTo: 'reply',
    render:
      customParseQ || customParseA
        ? createAskQuestionRender({ parseQuestions: customParseQ, parseAnswers: customParseA })
        : AskQuestionRender
  }
}
