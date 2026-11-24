import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

export interface AutoCompleteProps extends FormComponentProps {
  modelValue?: string
  placeholder?: string
  suggestions?: string[] | (() => Promise<string[]> | string[])
  clearable?: boolean
  /** 是否允许输入不在建议列表中的自定义值 */
  allowCustom?: boolean
}

export interface AutoCompleteEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'select', value: string): void
}

export interface _AutoCompleteExposed {
  open: () => void
  close: () => void
}

/** 自动补全组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type AutoCompleteExposed = DeconstructValue<_AutoCompleteExposed>
