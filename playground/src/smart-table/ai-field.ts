import { message } from '@veltra/desktop'
import { nextTick, onScopeDispose, reactive, type Ref } from 'vue'

import { FIELD_TYPE_LABELS, type CellValue, type TableDoc, type TableField } from './types'

/** AI 代理端点（vite proxy `/smart-table-api` → 参考服务 `/smart-table/ai`） */
const AI_API = '/smart-table-api/ai'

/** 新增字段对话框的 AI 场景选项（空串 = 不使用 AI，仅创建字段） */
export const AI_SCENARIOS = [
  { label: '不使用', value: '' },
  { label: '分类', value: 'classify' },
  { label: '总结', value: 'summarize' },
  { label: '信息提取', value: 'extract' },
  { label: '内容生成', value: 'generate' }
] as const

export type AiScenario = Exclude<(typeof AI_SCENARIOS)[number]['value'], ''>

/** 新增字段对话框确认的 AI 回填参数 */
export interface AiFieldInput {
  scenario: AiScenario
  model: string
  instruction: string
}

export type AiFillState = 'idle' | 'running' | 'done' | 'error'

const SYSTEM_PROMPT =
  '你是多维表格的数据助手。只输出 JSONL：每行一个独立的 JSON 对象，不要输出解释、markdown 代码块或 JSONL 以外的任何字符。'

const SCENARIO_TASKS: Record<AiScenario, (field: TableField) => string> = {
  classify: (field) => `为每行推断字段「${field.name}」的分类`,
  summarize: (field) => `根据每行的其它字段内容，为每行撰写字段「${field.name}」的简短总结`,
  extract: (field) => `从每行内容中提取信息填入字段「${field.name}」`,
  generate: (field) => `围绕每行内容为字段「${field.name}」生成值`
}

/** 各字段类型的 value 输出契约（写进提示，服务端 PUT 校验据此收口） */
function valueTypeHint(field: TableField): string {
  switch (field.type) {
    case 'number':
      return '数字（不带单位）'
    case 'progress':
      return '0~100 的数字'
    case 'checkbox':
      return '布尔值 true / false'
    case 'select':
      return `字符串，且只能是候选值之一：${field.options?.join('、')}`
    case 'multi-select':
      return `字符串数组，取值只能来自：${field.options?.join('、')}`
    case 'date':
      return 'YYYY-MM-DD 格式的日期字符串'
    case 'member':
    case 'image':
      return '字符串数组'
    default:
      return '字符串'
  }
}

/** 模型原始输出收敛为 doc 单元格合法值（非法形状回 null，交由既有通路按类型校验） */
function toCellValue(raw: unknown): CellValue {
  if (raw == null) return null
  if (typeof raw === 'string') return raw
  if (typeof raw === 'number' || typeof raw === 'boolean') return raw
  if (Array.isArray(raw) && raw.every((item) => typeof item === 'string')) return raw
  return null
}

/** 解析模型输出的一行 JSONL：{"id":"r1","value":…}；坏行返回 null */
function parseResultLine(line: string): { id: string; value: unknown } | null {
  const text = line.trim()
  if (text === '' || text.startsWith('```')) return null
  try {
    const parsed: unknown = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null) return null
    const { id, value } = parsed as { id?: unknown; value?: unknown }
    if (typeof id !== 'string') return null
    return { id, value }
  } catch {
    return null
  }
}

/** GET /smart-table/ai/models → 模型下拉选项；失败回落「默认模型」（空值由服务端取默认） */
export async function fetchAiModels(): Promise<{ label: string; value: string }[]> {
  try {
    const res = await fetch(`${AI_API}/models`)
    if (!res.ok) return []
    const data = (await res.json()) as { data?: { id?: unknown; label?: unknown }[] }
    const models = (data.data ?? []).filter(
      (item): item is { id: string; label?: unknown } => typeof item.id === 'string'
    )
    return models.length > 0
      ? models.map((item) => ({
          label: typeof item.label === 'string' ? item.label : item.id,
          value: item.id
        }))
      : []
  } catch {
    return []
  }
}

/**
 * AI 字段回填：按场景与既有列构造提示发往 AI 代理，消费 SSE 累积 delta.content，
 * 每凑齐一行 JSONL 立即经 `writeCell` 写进网格 → cell-change 通路回写 doc →
 * 防抖整表 PUT 持久化（刷新后保留）。未配置 API Key 等服务端错误只置失败态并
 * toast 可读信息，不影响表格其它能力。单飞行：进行中忽略新请求。
 */
export function useAiField(
  doc: Ref<TableDoc | null>,
  writeCell: (fieldId: string, rowId: string, value: CellValue) => boolean
) {
  const state = reactive({
    status: 'idle' as AiFillState,
    fieldName: '',
    filled: 0,
    total: 0,
    /** 失败原因（状态条 title 展示，toast 已即时提示） */
    error: ''
  })

  let aborter: AbortController | undefined
  onScopeDispose(() => aborter?.abort())

  /** 行数据以「字段名 → 值」序列化给模型（比 field id 可读），id 始终携带 */
  function serializeRows(): string {
    const nameOf = new Map((doc.value?.fields ?? []).map((f) => [f.id, f.name] as const))
    return JSON.stringify(
      (doc.value?.rows ?? []).map((row) => {
        const named: Record<string, unknown> = { id: row.id }
        for (const [fieldId, value] of Object.entries(row.values)) {
          const name = nameOf.get(fieldId)
          if (name) named[name] = value
        }
        return named
      })
    )
  }

  function buildPrompt(field: TableField, input: AiFieldInput): string {
    const schema = (doc.value?.fields ?? [])
      .map(
        (f) =>
          `- ${f.name}（${FIELD_TYPE_LABELS[f.type]}${f.options ? `，可选：${f.options.join('、')}` : ''}）`
      )
      .join('\n')
    const sections = [
      `## 任务\n${SCENARIO_TASKS[input.scenario](field)}。`,
      `## 表结构\n${schema}`,
      `## 行数据（JSON 数组，id 为行标识）\n${serializeRows()}`,
      `## 输出要求\n逐行输出 JSONL，每行形如 {"id":"<行id>","value":<值>}，覆盖上面每一行 id，不要遗漏。字段「${field.name}」的 value 必须是${valueTypeHint(field)}。没有合适值的行也要输出该行 id，value 用 null。`
    ]
    const instruction = input.instruction.trim()
    if (instruction !== '') sections.splice(1, 0, `## 补充要求\n${instruction}`)
    return sections.join('\n\n')
  }

  /** SSE 一行 data: 载荷的增量文本（choices[0].delta.content；[DONE] 与坏行为空串） */
  function deltaContentOf(line: string): string {
    const data = line.trim()
    if (!data.startsWith('data:')) return ''
    const payload = data.slice(5).trim()
    if (payload === '' || payload === '[DONE]') return ''
    try {
      const chunk: unknown = JSON.parse(payload)
      const delta = (chunk as { choices?: { delta?: { content?: unknown } }[] }).choices?.[0]?.delta
      return typeof delta?.content === 'string' ? delta.content : ''
    } catch {
      return ''
    }
  }

  async function start(field: TableField, input: AiFieldInput): Promise<void> {
    if (state.status === 'running' || !doc.value) {
      if (state.status === 'running') message.info('AI 回填进行中，本次仅创建字段')
      return
    }
    state.status = 'running'
    state.fieldName = field.name
    state.filled = 0
    state.total = doc.value.rows.length
    state.error = ''
    try {
      // 新字段列需先经 doc 深层 watch 落一次重装配，网格里才有该列可写
      await nextTick()
      await streamFill(field, input)
      if (state.filled === 0) {
        state.status = 'error'
        state.error = 'AI 未返回可回填的行结果'
        message.error(state.error)
      } else {
        state.status = 'done'
      }
    } catch (reason) {
      if (aborter?.signal.aborted) return
      state.status = 'error'
      state.error = reason instanceof Error ? reason.message : 'AI 请求失败'
      message.error(state.error)
    } finally {
      aborter = undefined
    }
  }

  /** 请求代理并消费 SSE：每凑齐一行 JSONL 立即回填一格（流式逐格可见） */
  async function streamFill(field: TableField, input: AiFieldInput): Promise<void> {
    aborter = new AbortController()
    const res = await fetch(`${AI_API}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: aborter.signal,
      body: JSON.stringify({
        model: input.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(field, input) }
        ]
      })
    })
    if (!res.ok || !res.body) {
      const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
      throw new Error(data?.error?.message ?? `AI 请求失败（HTTP ${res.status}）`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let sseBuffer = ''
    let jsonlBuffer = ''

    /** 模型输出的一行 → 回填对应行；进度只计实际命中的行 */
    function consumeJsonlLine(line: string): void {
      const result = parseResultLine(line)
      if (!result) return
      if (writeCell(field.id, result.id, toCellValue(result.value))) state.filled++
    }

    function consumeSseChunk(chunk: string): void {
      jsonlBuffer += chunk
      let newline = jsonlBuffer.indexOf('\n')
      while (newline >= 0) {
        consumeJsonlLine(jsonlBuffer.slice(0, newline))
        jsonlBuffer = jsonlBuffer.slice(newline + 1)
        newline = jsonlBuffer.indexOf('\n')
      }
    }

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      sseBuffer += decoder.decode(value, { stream: true })
      let newline = sseBuffer.indexOf('\n')
      while (newline >= 0) {
        consumeSseChunk(deltaContentOf(sseBuffer.slice(0, newline)))
        sseBuffer = sseBuffer.slice(newline + 1)
        newline = sseBuffer.indexOf('\n')
      }
    }
    consumeSseChunk(deltaContentOf(sseBuffer + decoder.decode()))
    consumeJsonlLine(jsonlBuffer) // 末行无换行符的尾巴
  }

  return { state, start }
}
