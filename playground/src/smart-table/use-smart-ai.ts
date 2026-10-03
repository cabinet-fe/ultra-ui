import { message } from '@veltra/desktop'
import { computed, onScopeDispose, reactive, watch, type Ref } from 'vue'

import {
  FIELD_TYPE_LABELS,
  type CellValue,
  type TableDoc,
  type TableField,
  type TableRow
} from './types'

/** AI 代理端点（vite proxy `/smart-table-api` → 参考服务 `/smart-table/ai`） */
const AI_API = '/smart-table-api/ai/chat/completions'

/** 目标字段选择里「新建文本字段」项的哨兵值（仅生成模式可选） */
export const NEW_FIELD = '__new__'

export type AiMode = 'generate' | 'organize'

/** AI 面板表单与请求状态（面板组件直改共享草稿，见 vue 技能「响应式对象直传」） */
export interface AiPanelState {
  mode: AiMode
  targetFieldId: string
  newFieldName: string
  instruction: string
  running: boolean
}

const SYSTEM_PROMPT =
  '你是多维表格的数据助手。只输出 JSON 本体，不要输出解释、markdown 代码块或 JSON 以外的任何字符。'

/** 空值判定：null / undefined / 空串视为空，不进入回填 */
function isEmptyText(value: string): boolean {
  return value.trim() === ''
}

/** 把模型返回的原始值按目标字段类型收敛，保证 PUT 校验不因类型不符被 400 拒绝 */
function coerceValue(raw: unknown, field: TableField): CellValue {
  switch (field.type) {
    case 'number':
    case 'progress': {
      const n = typeof raw === 'number' ? raw : Number(raw)
      if (!Number.isFinite(n)) return null
      return field.type === 'progress' ? Math.min(100, Math.max(0, n)) : n
    }
    case 'checkbox':
      if (typeof raw === 'boolean') return raw
      if (typeof raw === 'string') return raw.trim() === 'true' || raw.trim() === '是'
      return null
    case 'multi-select': {
      if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === 'string')
      if (typeof raw === 'string' && !isEmptyText(raw)) {
        return raw
          .split(/[,，、]/)
          .map((s) => s.trim())
          .filter(Boolean)
      }
      return null
    }
    case 'select':
      if (typeof raw === 'string' && field.options?.includes(raw)) return raw
      return null
    default:
      // 文本 / 日期按字符串回填（日期由服务端校验 YYYY-MM-DD，非法会被拒绝保存）
      if (typeof raw === 'string') return raw.trim()
      if (typeof raw === 'number' || raw === null) return raw === null ? null : String(raw)
      return null
  }
}

/** 从模型输出中提取 JSON 对象：剥掉代码块围栏后取首 `{` 到末 `}` 的片段 */
function extractJsonObject(content: string): Record<string, unknown> | null {
  const text = content.replace(/```(?:json)?/gi, '')
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1))
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/**
 * AI 生成 / 整理：前端拼装提示词（表结构 + 行数据 + 指令）发往 AI 代理，
 * 消费 SSE 累积 `delta.content`，完成后解析「行 id → 值」JSON 回填目标列；
 * 解析失败或请求出错只提示、不动数据，回填成功经 `useTableDoc` 深层 watch 自动持久化。
 */
export function useSmartAi(
  doc: Ref<TableDoc | null>,
  addField: (input: { name: string; type: 'text' }) => TableField | null
) {
  const state = reactive<AiPanelState>({
    mode: 'generate',
    targetFieldId: '',
    newFieldName: '',
    instruction: '',
    running: false
  })

  /** 目标字段候选：整理只能选已有字段；生成额外提供「新建文本字段」 */
  const targetOptions = computed(() => {
    const existing = (doc.value?.fields ?? []).map((f) => ({
      label: `${f.name}（${FIELD_TYPE_LABELS[f.type]}）`,
      value: f.id
    }))
    if (state.mode === 'generate') {
      return [{ label: '＋ 新建文本字段', value: NEW_FIELD }, ...existing]
    }
    return existing
  })

  // 候选变化后保持选中项有效：整理模式不允许新建字段，字段被删时回退首项
  watch(targetOptions, (options) => {
    if (!options.some((option) => option.value === state.targetFieldId)) {
      state.targetFieldId = options[0]?.value ?? ''
    }
  })

  let aborter: AbortController | undefined
  onScopeDispose(() => aborter?.abort())

  /** 行数据以「字段名 → 值」序列化给模型（比 field id 更可读），id 始终携带 */
  function serializeRows(): string {
    const nameOf = new Map((doc.value?.fields ?? []).map((f) => [f.id, f.name] as const))
    return JSON.stringify(
      (doc.value?.rows ?? []).map((row: TableRow) => {
        const named: Record<string, unknown> = { id: row.id }
        for (const [fieldId, value] of Object.entries(row.values)) {
          const name = nameOf.get(fieldId)
          if (name) named[name] = value
        }
        return named
      })
    )
  }

  function buildPrompt(target: TableField): string {
    const fields = doc.value?.fields ?? []
    const schema = fields
      .map(
        (f) =>
          `- ${f.name}（${FIELD_TYPE_LABELS[f.type]}${f.options ? `，可选：${f.options.join('、')}` : ''}）`
      )
      .join('\n')
    const task =
      state.mode === 'generate'
        ? `为目标字段「${target.name}」逐行生成值`
        : `按指令整理目标字段「${target.name}」的已有值`
    return [
      `## 任务\n${task}。`,
      `## 指令\n${state.instruction.trim()}`,
      `## 表结构\n${schema}`,
      `## 行数据（JSON 数组，id 为行标识）\n${serializeRows()}`,
      `## 输出要求\n只输出一个 JSON 对象：键为行数据的 id，值为该行「${target.name}」的新值（${
        target.options ? `必须是可选值之一：${target.options.join('、')}` : '字符串'
      }）。没有合适值的行也给出键，值为 null。`
    ].join('\n\n')
  }

  /** 请求代理并消费 SSE，累积全部 delta.content 后返回 */
  async function collectContent(prompt: string): Promise<string> {
    aborter = new AbortController()
    const res = await fetch(AI_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: aborter.signal,
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]
      })
    })
    if (!res.ok || !res.body) {
      const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
      throw new Error(data?.error?.message ?? `AI 请求失败（HTTP ${res.status}）`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let content = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let newline = buffer.indexOf('\n')
      while (newline >= 0) {
        content += deltaContentOf(buffer.slice(0, newline))
        buffer = buffer.slice(newline + 1)
        newline = buffer.indexOf('\n')
      }
    }
    content += deltaContentOf(buffer)
    return content
  }

  /** 解析一行 SSE `data:` 载荷，取 choices[0].delta.content；[DONE] 与坏行返回空串 */
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

  /** 解析当前选择的目标字段；新建模式先落字段再返回 */
  function resolveTarget(): TableField | null {
    if (state.targetFieldId !== NEW_FIELD) {
      return doc.value?.fields.find((f) => f.id === state.targetFieldId) ?? null
    }
    const name = state.newFieldName.trim()
    if (name === '') {
      message.error('请填写新字段名称')
      return null
    }
    return addField({ name, type: 'text' })
  }

  async function run(): Promise<void> {
    if (state.running || !doc.value) return
    if (isEmptyText(state.instruction)) {
      message.error(state.mode === 'generate' ? '请输入生成指令' : '请输入整理指令')
      return
    }
    state.running = true
    try {
      const target = resolveTarget()
      if (!target) return
      const content = await collectContent(buildPrompt(target))
      applyResult(target, extractJsonObject(content), content)
      if (state.targetFieldId === NEW_FIELD) state.targetFieldId = target.id
    } catch (reason) {
      if (!aborter?.signal.aborted) {
        message.error(reason instanceof Error ? reason.message : 'AI 请求失败')
      }
    } finally {
      state.running = false
      aborter = undefined
    }
  }

  /** 解析结果校验通过才整体回填；任何失败路径都不触碰表格数据 */
  function applyResult(
    target: TableField,
    parsed: Record<string, unknown> | null,
    rawContent: string
  ): void {
    if (!parsed || !doc.value) {
      message.error(
        `AI 返回内容无法解析为「行 id → 值」JSON，未修改任何数据。返回内容：${rawContent.slice(0, 120) || '（空）'}`
      )
      return
    }
    const rowsById = new Map(doc.value.rows.map((row) => [row.id, row] as const))
    let applied = 0
    for (const [rowId, raw] of Object.entries(parsed)) {
      const row = rowsById.get(rowId)
      if (!row) continue
      row.values[target.id] = coerceValue(raw, target)
      applied++
    }
    if (applied === 0) {
      message.error('AI 返回的 JSON 中没有匹配行 id 的条目，未修改任何数据')
      return
    }
    message.success(`已回填 ${applied} 行「${target.name}」`)
  }

  return { state, targetOptions, run }
}
