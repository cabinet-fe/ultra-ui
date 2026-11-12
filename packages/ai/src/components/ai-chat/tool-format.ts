/**
 * 工具调用数据的人读化：把模型给的任意 JSON 值整理成「字段 / 列表 / 文本」结构，
 * 交给 tool-data.vue 渲染成字段行而不是一整块 JSON。
 * 纯函数，任何输入都不得 throw；步骤行与思考块共用的文本小工具（clipText 等）也在此。
 */

/** 标量的展示语气（数字对齐、布尔着色、空值弱化） */
export type ToolScalarTone = 'number' | 'bool' | 'muted'

/** 字段：键 + 人读标签 + 值节点 */
export interface ToolField {
  /** 原始键名（悬停提示用） */
  key: string
  /** 人读标签（snake_case / camelCase 拆词） */
  label: string
  /** 值 */
  value: ToolNode
}

/** 渲染节点：只描述结构，具体样式由组件决定 */
export type ToolNode =
  | { type: 'empty' }
  | { type: 'scalar'; text: string; tone: ToolScalarTone }
  | { type: 'text'; text: string; code: boolean }
  | { type: 'chips'; items: string[] }
  | { type: 'fields'; fields: ToolField[] }
  | { type: 'list'; items: ToolNode[] }

const EMPTY: ToolNode = { type: 'empty' }

/** 递归解析上限：超出后退回原文，避免超深嵌套与反复 JSON.parse */
const MAX_DEPTH = 3

/** 字符串里包着 JSON 的情况（工具结果常见）：只对以 { 或 [ 开头的尝试解析 */
const JSON_LIKE = /^[[{]/

const CJK = /[\u3400-\u9fff]/

/** 类路径：含分隔符的多段路径，或带扩展名的单段文件名 */
const PATH_LIKE =
  /^(?:~|\.{1,2})?[\\/][\w.@~\\/-]*$|^(?:[\w.@-]+[\\/])+[\w.@~-]+$|^[\w.@-]+\.\w{1,8}$/

const URL_LIKE = /^[a-z][a-z0-9+.-]*:\/\//i

/** 常见命令起始词：命中即按代码块展示 */
const COMMAND_LIKE =
  /^(?:sudo\s+)?(?:git|ls|cd|rm|cp|mv|mkdir|cat|head|tail|grep|rg|fd|find|sed|awk|chmod|chown|tar|zip|unzip|curl|wget|ssh|scp|docker|kubectl|make|cargo|go|bun|npm|pnpm|yarn|node|npx|deno|python|python3|pip|pytest|vitest|jest|tsc|eslint|prettier)\b/

const NUM_FORMAT = new Intl.NumberFormat('en-US')

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isScalar = (value: unknown): boolean =>
  value == null ||
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean'

/** JSON 解析结果：用显式标记区分「不是 JSON」与「解析出 null」 */
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

/**
 * 键名拆词成人读标签：`file_path` / `filePath` / `userID` → `File Path` / `File Path` / `User ID`。
 * 含中文的键原样返回。
 */
export function humanizeKey(key: string): string {
  const trimmed = key.trim()
  if (!trimmed) return ''
  if (CJK.test(trimmed)) return trimmed
  return trimmed
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
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

/** 纯文本预览的截断上限档位：tool-data 区块级与 tool-node 嵌套字段级各一档 */
export const TOOL_TEXT_PREVIEW = { section: 480, nested: 240 } as const

/** 纯文本预览文本：未超限原样返回，超限（且未展开）单行化并截断；展开看全文由调用方控制 */
export function previewText(text: string, limit: number, expanded = false): string {
  return expanded || text.length <= limit ? text : clipText(text, limit)
}

/** 数字按千分位展示，大数一眼能读出量级 */
function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value)
  return Number.isInteger(value) && Math.abs(value) < 1e6 ? NUM_FORMAT.format(value) : String(value)
}

function scalarText(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'number') return formatNumber(value)
  if (typeof value === 'string') return value
  return ''
}

/** 单段字符串是否该按等宽/代码展示（路径、URL、命令、多行文本） */
function looksLikeCode(text: string): boolean {
  if (text.includes('\n')) return true
  return PATH_LIKE.test(text) || URL_LIKE.test(text) || COMMAND_LIKE.test(text)
}

function stringNode(text: string, depth: number): ToolNode {
  const parsed = depth < MAX_DEPTH ? parseJsonLoose(text) : { ok: false, value: undefined }
  if (parsed.ok) {
    const node = toToolNode(parsed.value, depth + 1)
    if (node.type !== 'empty') return node
  }
  const trimmed = text.trim()
  if (!trimmed) return EMPTY
  return { type: 'text', text: trimmed, code: looksLikeCode(trimmed) }
}

/** 任意值 → 渲染节点 */
export function toToolNode(value: unknown, depth = 0): ToolNode {
  if (value == null) return EMPTY
  // 深度护栏：循环引用与超深嵌套一律截断，不得爆栈
  if (depth > MAX_DEPTH + 1) return EMPTY

  if (typeof value === 'string') return stringNode(value, depth)
  if (typeof value === 'number') {
    return { type: 'scalar', text: formatNumber(value), tone: 'number' }
  }
  if (typeof value === 'boolean') {
    return { type: 'scalar', text: value ? '是' : '否', tone: 'bool' }
  }

  if (Array.isArray(value)) {
    if (!value.length) return EMPTY
    // 纯标量数组压成 chips（如文件列表、标签），对象数组按序号列表展开
    if (value.every(isScalar)) {
      return { type: 'chips', items: value.map((item) => scalarText(item)) }
    }
    return { type: 'list', items: value.map((item) => toToolNode(item, depth + 1)) }
  }

  if (isRecord(value)) {
    const entries = Object.entries(value)
    if (!entries.length) return EMPTY
    return {
      type: 'fields',
      fields: entries.map(([key, item]) => ({
        key,
        label: humanizeKey(key),
        value: toToolNode(item, depth + 1)
      }))
    }
  }

  // 函数 / symbol 等无法人读的值直接省略，不给用户看 [object Object] 一类的噪声
  return EMPTY
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

/**
 * 参数是否已被折叠头摘要完整覆盖：单标量（或未截断的单行文本）参数在头部逐字可见，
 * 展开后的「参数」区再罗列一遍就是纯重复。嵌套结构、多字段、被截断的长值不算覆盖。
 */
export function isSummarizedInHeader(node: ToolNode): boolean {
  if (node.type === 'scalar') return true
  if (node.type === 'text') return node.text.length <= SUMMARY_LIMIT
  if (node.type !== 'fields' || node.fields.length !== 1) return false
  const value = node.fields[0]!.value
  return value.type === 'scalar' || (value.type === 'text' && value.text.length <= SUMMARY_LIMIT)
}

/** 标量 / 文本节点的展示文本，其余节点没有可直接比对的文本 */
function nodeText(node: ToolNode): string | undefined {
  return node.type === 'scalar' || node.type === 'text' ? node.text : undefined
}

/**
 * 结果字段回显去重：工具结果里同键同值复述入参的字段不携带新信息（如计算器返回
 * `{expression, result}`），剔除后正文只留真正的产出。全部是回显时得到空节点。
 */
export function dropEchoedFields(node: ToolNode, args: unknown): ToolNode {
  if (node.type !== 'fields' || !isRecord(args)) return node
  const argText = (key: string): string | undefined => {
    const arg = args[key]
    if (!isScalar(arg) || arg == null) return undefined
    return scalarText(arg).trim()
  }
  const fields = node.fields.filter((field) => {
    const text = nodeText(field.value)
    return text == null || text.trim() !== argText(field.key)
  })
  if (fields.length === node.fields.length) return node
  return fields.length ? { ...node, fields } : EMPTY
}

/** 单值结果直出时无信息量的通用键：`result` / `output` 等，键名不承载语义即可省去标签列 */
const GENERIC_VALUE_KEYS = new Set([
  'result',
  'output',
  'value',
  'data',
  'text',
  'answer',
  'response',
  'content',
  'message',
  'msg',
  'body',
  'error',
  'reason'
])

/**
 * 单值结果直出：`{result: 5888}` 这类结果的答案就是值本身，省掉键名列直接展示。
 * 语义键（如 `remaining`）与布尔值（脱离键名读不出含义）保留字段行。
 */
export function unwrapSingleValue(node: ToolNode): ToolNode {
  if (node.type !== 'fields' || node.fields.length !== 1) return node
  const field = node.fields[0]!
  const value = field.value
  if (!GENERIC_VALUE_KEYS.has(field.key.toLowerCase())) return node
  if (value.type === 'text') return value
  if (value.type === 'scalar' && value.tone !== 'bool') return value
  return node
}

/** 结果区标题旁的量级提示：`12 行` 等，无意义时返回空串 */
export function describeShape(node: ToolNode): string {
  // 字段行逐条可见，报「N 项」只添噪声；列表与多行文本的量级才有扫读价值
  if (node.type === 'chips') return `${node.items.length} 项`
  if (node.type === 'list') return `${node.items.length} 项`
  if (node.type === 'text') {
    const lines = node.text.split('\n').length
    return lines > 1 ? `${lines} 行` : ''
  }
  return ''
}
