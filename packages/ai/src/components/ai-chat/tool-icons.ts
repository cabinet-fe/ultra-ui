import { EditPen, Folder, Internet, QuestionFilled, Terminal, Tools } from '@veltra/icons/normal'
import type { Component } from 'vue'

/**
 * 内置 toolName → icon：按名称子串匹配，顺序即优先级。
 * 未命中任何规则时走兜底图标，不得 throw。
 */
const TOOL_ICON_RULES: [needles: string[], icon: Component][] = [
  [['bash', 'terminal'], Terminal],
  [['fs', 'file'], Folder],
  [['web', 'globe'], Internet],
  [['edit', 'pencil'], EditPen],
  [['ask', 'question'], QuestionFilled]
]

/** 未知名工具的兜底图标 */
export const FALLBACK_TOOL_ICON: Component = Tools

/**
 * 按工具名解析图标。
 * 宿主 `toolIcons` 精确名覆盖优先于内置规则；都未命中则兜底。
 */
export function resolveToolIcon(name: string, overrides?: Record<string, Component>): Component {
  const key = String(name ?? '')
  const fromOverride = overrides?.[key]
  if (fromOverride) return fromOverride

  const lower = key.toLowerCase()
  for (const [needles, icon] of TOOL_ICON_RULES) {
    if (needles.some((needle) => lower.includes(needle))) return icon
  }
  return FALLBACK_TOOL_ICON
}
