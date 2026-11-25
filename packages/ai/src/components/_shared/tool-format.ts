/**
 * 工具调用参数摘要与文本裁剪工具（纯函数，任何输入都不得 throw）。
 */

/** 字符串里包着 JSON 的情况：只对以 { 或 [ 开头的尝试解析 */
const JSON_LIKE = /^[[{]/

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isScalar = (value: unknown): boolean =>
  value == null ||
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean'

interface ParsedJson {
  ok: boolean
  value: unknown
}

function parseJsonLoose(text: string): ParsedJson {
  if (!JSON_LIKE.test(text.trim())) return { ok: false, value: undefined }
  try {
    return { ok: true, value: JSON.parse(text) as unknown }
  } catch {
    return { ok: false, value: undefined }
  }
}

function scalarText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  return ''
}

/** 单行化 + 截断，用于折叠头摘要与导航预览 */
export function clipText(text: string, limit: number): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > limit ? `${flat.slice(0, limit)}…` : flat
}

/**
 * 取最后一行非空文本（步骤行 / 思考块折叠态的滚动展示）。
 * 从尾部经 lastIndexOf 反向扫描，不为长文本建行数组，随流式 delta 高频调用无压力。
 */
export function lastNonEmptyLine(text: string): string {
  let end = text.length
  while (end > 0) {
    const start = text.lastIndexOf('\n', end - 1) + 1
    const line = text.slice(start, end).trim()
    if (line) return line
    if (start === 0) return ''
    end = start - 1
  }
  return ''
}

/** 折叠头摘要的截断上限：超过它的内容无法在头部完整展示 */
const SUMMARY_LIMIT = 60

/** 摘要优先取这些键：它们最能让用户一眼看懂「这次调用了什么」 */
const SUMMARY_KEYS = [
  'command',
  'cmd',
  'path',
  'file_path',
  'filepath',
  'file',
  'filename',
  'query',
  'q',
  'url',
  'expression',
  'city',
  'target',
  'page',
  'name',
  'title',
  'id'
]

/** 提取提问列表的首题摘要（如 `{ questions: [{ question: '...' }] }`） */
function summarizeQuestions(value: unknown): string {
  if (!Array.isArray(value) || !value.length) return ''
  const first = value[0]
  if (!isRecord(first)) return ''
  const raw =
    typeof first.question === 'string' && first.question.trim()
      ? first.question.trim()
      : typeof first.header === 'string' && first.header.trim()
        ? first.header.trim()
        : ''
  if (!raw) return value.length > 1 ? `共 ${value.length} 个问题` : ''
  const suffix = value.length > 1 ? ` 等 ${value.length} 个问题` : ''
  return clipText(`${raw}${suffix}`, SUMMARY_LIMIT)
}

/** 工具参数的一句话摘要（折叠头右侧展示），取不到返回空串 */
export function summarizeArguments(value: unknown): string {
  let args = value
  if (typeof value === 'string') {
    const parsed = parseJsonLoose(value)
    if (!parsed.ok) return clipText(value, SUMMARY_LIMIT)
    args = parsed.value
  }
  if (args == null) return ''
  if (!isRecord(args)) return isScalar(args) ? clipText(scalarText(args), SUMMARY_LIMIT) : ''

  const questionsSummary = summarizeQuestions(args.questions)
  if (questionsSummary) return questionsSummary

  for (const key of SUMMARY_KEYS) {
    const item = args[key]
    if (isScalar(item) && item != null) {
      const text = scalarText(item).trim()
      if (text) return clipText(text, SUMMARY_LIMIT)
    }
  }

  const values = Object.values(args)
  const firstText = values.find((item) => typeof item === 'string' && item.trim())
  if (typeof firstText === 'string') return clipText(firstText, SUMMARY_LIMIT)

  const scalars = values.filter((item) => isScalar(item) && item != null)
  return scalars.length === 1 ? clipText(scalarText(scalars[0]), SUMMARY_LIMIT) : ''
}

function isEmptyEntry(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (isRecord(value)) return Object.values(value).every(isEmptyEntry)
  return false
}

/**
 * 参数是否已被折叠头摘要完整覆盖（或本身为空）：
 * 单标量（或未截断的单行短文本）参数已在头部逐字可见，展开后的 body 不再重复展示参数块。
 * 多字段、被截断的长值、嵌套结构返回 false。
 */
export function isSummarizedInHeader(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return true
    const parsed = parseJsonLoose(trimmed)
    if (parsed.ok) return isSummarizedInHeader(parsed.value)
    return trimmed.length <= SUMMARY_LIMIT
  }
  if (typeof value === 'number' || typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.length === 0
  if (isRecord(value)) {
    const nonEmpty = Object.values(value).filter((v) => !isEmptyEntry(v))
    if (nonEmpty.length === 0) return true
    if (nonEmpty.length > 1) return false
    const single = nonEmpty[0]!
    if (typeof single === 'number' || typeof single === 'boolean') return true
    if (typeof single === 'string') {
      const trimmed = single.trim()
      return !parseJsonLoose(trimmed).ok && trimmed.length <= SUMMARY_LIMIT
    }
    return false
  }
  return true
}
