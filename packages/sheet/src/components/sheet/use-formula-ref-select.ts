/** 引用选择上下文：光标前一个非空字符属于此集合时可插入单元格引用 */
const REF_TRIGGER_CHARS = new Set(['=', '(', ',', '+', '-', '*', '/', '^', '&', '<', '>'])

/** 引用拾取染色框循环色板（对齐 Excel 蓝/绿/红循环惯例），按引用在公式中的出现顺序取色 */
export const REF_HIGHLIGHT_COLORS = ['#2563eb', '#16a34a', '#dc2626'] as const

/**
 * 判定是否处于「可插入引用」位置（无状态：每次按文本 + 光标重算）。
 * `-` 的一元/二元歧义基础版不区分（`A1-` 后框选 → `A1-B2`，合法且误判无害）。
 */
export function isRefSelectContext(text: string, cursor: number): boolean {
  if (cursor < 0 || cursor > text.length) return false
  // 非公式编辑不进入引用选择（普通文本失焦应提交）
  if (!text.startsWith('=')) return false
  const before = text.slice(0, cursor).replace(/\s+$/, '')
  if (before.length === 0) return false
  return REF_TRIGGER_CHARS.has(before[before.length - 1]!)
}

export interface InsertRefResult {
  text: string
  /** 插入后光标位置（落在引用文本之后） */
  cursor: number
}

/** 在光标处插入引用文本（替换空选区；有选区时覆盖选区） */
export function insertRefText(
  text: string,
  cursor: number,
  rangeText: string,
  selectionEnd: number = cursor
): InsertRefResult {
  const start = Math.min(cursor, selectionEnd)
  const end = Math.max(cursor, selectionEnd)
  return replaceRefText(text, start, end, rangeText)
}

/** 替换 [start, end) 区间为引用文本（shift+点选扩展：扩展上次插入的引用） */
export function replaceRefText(
  text: string,
  start: number,
  end: number,
  rangeText: string
): InsertRefResult {
  const next = text.slice(0, start) + rangeText + text.slice(end)
  return { text: next, cursor: start + rangeText.length }
}
