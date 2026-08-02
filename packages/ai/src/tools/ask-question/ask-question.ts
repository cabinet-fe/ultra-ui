import { QuestionFilled } from '@veltra/icons/normal'
import type { Component } from 'vue'

import type { ChatTool } from '../../chat/types'
import AskQuestion from '../../components/ai-chat/ask-question.vue'
import { deferAskQuestion, takeAskQuestionDeferred } from './deferred'

/** 单个提问项 */
export interface AskQuestionItem {
  /** 问题文案 */
  question: string
  /** 预设选项（单选）；缺省为纯文本题 */
  options?: string[]
  /** 自定义输入占位文案 */
  placeholder?: string
}

/** 一条问答结果 */
export interface AskQuestionAnswer {
  /** 问题文案 */
  question: string
  /** 用户回答（选中的选项或自定义输入） */
  answer: string
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
  /** 工具描述（传给模型） */
  description?: string
  /** 工具显示名，默认「提问」 */
  label?: string
  /** 工具图标，默认 QuestionFilled */
  icon?: Component
}

const DEFAULT_DESCRIPTION =
  '当需求不明确或存在歧义时，向用户提问以澄清。一次可提 1-4 个关键问题；' +
  '每个问题可提供若干预设选项，用户可选择选项或自定义输入。用户作答后再继续生成。'

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
          options: {
            type: 'array',
            description: '预设选项（单选）；缺省为纯文本题',
            items: { type: 'string' }
          },
          placeholder: { type: 'string', description: '自定义输入占位文案' }
        },
        required: ['question']
      }
    }
  },
  required: ['questions']
}

/**
 * 创建内置提问工具：execute 挂起等待用户在 UI 中作答，提交后结果回灌模型。
 * 工具卡片由内联提问表单渲染（多题分页导航，提交后展示问答摘要，不自动折叠）。
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
    render: AskQuestion,
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
