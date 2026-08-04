/** 引用选择上下文：光标前一个非空字符属于此集合时可插入单元格引用 */
const REF_TRIGGER_CHARS = new Set(['=', '(', ',', '+', '-', '*', '/', '^', '&', '<', '>'])

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
  const next = text.slice(0, start) + rangeText + text.slice(end)
  return { text: next, cursor: start + rangeText.length }
}
