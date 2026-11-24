import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 文本域组件属性（API 与 @veltra/desktop UTextarea 对齐；字号 16px、行高与内边距走移动端 token） */
export interface TextareaProps extends FormComponentProps {
  modelValue?: string
  height?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean

  resize?: boolean
  rows?: number
  cols?: number
  maxlength?: number
  /**
   * 是否显示字符数统计（当前字数/最大字数，展示在文本域右下角）
   */
  showCount?: boolean
  clearable?: boolean

  nativeReadonly?: boolean

  autosize?: boolean
}

export interface TextareaEmits {
  (e: 'update:modelValue', value: string): void
  /** 当 modelValue 改变时，并且文本框失去焦点或用户按Enter时触发 */
  (e: 'change', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'clear'): void
}

export interface _TextareaExposed {}

/** 组件外部使用, 引用的值会被自动解构 */
export type TextareaExposed = DeconstructValue<_TextareaExposed>
