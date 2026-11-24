export interface TextProps {
  /** 使用预设文本类型, 默认content正文 */
  as?: 'main-title' | 'title' | 'sub-title' | 'content' | 'additional'
  /** 文本大小, 与as同时指定时会覆盖as */
  fontSize?: string | number
  deleted?: boolean
  underline?: boolean
  /** 粗体, 与as同时指定时会覆盖as中的字体粗细 */
  bold?: boolean
  italic?: boolean
  highlight?: string | string[]
}

export interface TextEmits {
  (e: 'update:modelValue', value: string): void
}

export interface _TextExposed {}

export type TextExposed = {}
