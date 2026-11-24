import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

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
  showCount?: boolean
  clearable?: boolean

  nativeReadonly?: boolean

  autosize?: boolean
}

export interface TextareaEmits {
  (e: 'update:modelValue', value: string): void
  /**当 modelValue 改变时，并且文本框失去焦点或用户按Enter时触发 */
  (e: 'change', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'clear'): void
}

export interface _TextareaExposed {}

/** textarea组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TextareaExposed = DeconstructValue<_TextareaExposed>
