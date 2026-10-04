import {
  createOpenAITransport,
  type ChatModel,
  type ChatReasoningLevel,
  type OpenAITransport
} from '@veltra/ai'

import { FIELD_TYPE_LABELS, type TableDoc } from './types'

/** AI 代理端点（vite proxy `/smart-table-api` → 参考服务 `/smart-table/ai`），key 仅服务端持有 */
const AI_API = '/smart-table-api/ai'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 响应错误体 { error: { message } } → 可读文案；抠不出 message 时原样返回 */
export function readableAiError(message: string): string {
  const start = message.indexOf('{')
  if (start >= 0) {
    try {
      const parsed: unknown = JSON.parse(message.slice(start))
      const inner = (parsed as { error?: { message?: unknown } })?.error?.message
      if (typeof inner === 'string' && inner !== '') return inner
    } catch {
      // 非错误体 JSON：原样展示
    }
  }
  return message
}

/** 模型目录单项：reasoningLevels / defaultReasoningLevel 直达 ChatModel，defaultParams 留在服务端 */
function toChatModel(raw: Record<string, unknown>): ChatModel | null {
  if (typeof raw.id !== 'string' || raw.id === '') return null
  const levels = Array.isArray(raw.reasoningLevels)
    ? raw.reasoningLevels.filter(
        (item): item is ChatReasoningLevel =>
          isRecord(item) && typeof item.value === 'string' && typeof item.label === 'string'
      )
    : []
  return {
    id: raw.id,
    ...(typeof raw.label === 'string' ? { label: raw.label } : {}),
    ...(typeof raw.description === 'string' ? { description: raw.description } : {}),
    ...(levels.length > 0 ? { reasoningLevels: levels } : {}),
    ...(typeof raw.defaultReasoningLevel === 'string'
      ? { defaultReasoningLevel: raw.defaultReasoningLevel }
      : {})
  }
}

/**
 * 拉取模型目录并构建对话 transport：`GET /smart-table-api/ai/models` →
 * `createOpenAITransport`（单 Provider，端点指向代理，不带任何 key）。
 * 目录不可用时抛错，由面板展示可读信息。
 */
export async function createSmartTableChatTransport(): Promise<OpenAITransport> {
  let data: unknown = null
  let status = 0
  try {
    const res = await fetch(`${AI_API}/models`)
    status = res.status
    data = await res.json().catch(() => null)
  } catch {
    throw new Error('AI 模型目录请求失败，请确认参考服务已启动')
  }
  if (status < 200 || status >= 300) {
    const raw = (data as { error?: { message?: string } } | null)?.error?.message
    throw new Error(readableAiError(raw ?? `AI 模型目录不可用（HTTP ${status}）`))
  }
  const items = (isRecord(data) && Array.isArray(data.data) ? data.data : [])
    .filter(isRecord)
    .map(toChatModel)
    .filter((item): item is ChatModel => item !== null)
  if (items.length === 0) throw new Error('AI 模型目录为空')
  return createOpenAITransport({
    providers: [
      {
        id: 'smart-table',
        label: '智慧表格 AI',
        endpoint: `${AI_API}/chat/completions`,
        models: items
      }
    ]
  })
}

/** 行数据以「字段名 → 值」序列化给模型（同 `ai-field.ts` 的 serializeRows 先例，对话上下文不带行 id 噪音） */
function serializeRows(doc: TableDoc): string {
  const nameOf = new Map(doc.fields.map((f) => [f.id, f.name] as const))
  return JSON.stringify(
    doc.rows.map((row) => {
      const named: Record<string, unknown> = {}
      for (const [fieldId, value] of Object.entries(row.values)) {
        const name = nameOf.get(fieldId)
        if (name) named[name] = value
      }
      return named
    })
  )
}

/**
 * 表格上下文 system 提示：字段名/类型/选项 + 全量行数据摘要，
 * 每次发送时由 `UAiChat` 的 systemPrompt 通路带上（随表格最新状态重建）。
 */
export function buildTableContextPrompt(doc: TableDoc | null): string {
  if (!doc) return '你是多维表格的 AI 助手，当前表格尚未加载完成，请提示用户稍候。'
  const schema = doc.fields
    .map(
      (f) =>
        `- ${f.name}（${FIELD_TYPE_LABELS[f.type]}${f.options ? `，可选：${f.options.join('、')}` : ''}）`
    )
    .join('\n')
  return [
    '你是多维表格的 AI 助手，基于下方表格上下文回答用户问题；上下文之外的内容如实说明不知道。',
    `## 表结构（${doc.fields.length} 个字段）\n${schema}`,
    `## 行数据（JSON 数组，共 ${doc.rows.length} 行，键为字段名）\n${serializeRows(doc)}`
  ].join('\n\n')
}
