import type { DeconstructValue, FormComponentProps } from '@veltra/utils'

/** 自动补全组件组件属性 */
export interface AutoCompleteProps extends FormComponentProps {
  modelValue?: string
  /** 占位符 */
  placeholder?: string
  /** 建议 */
  suggestions?: string[] | (() => Promise<string[]> | string[])
  /** 是否可清空 */
  clearable?: boolean
  /** 是否允许输入不在建议列表中的自定义值 */
  allowCustom?: boolean
}

/** 自动补全组件组件定义的事件 */
export interface AutoCompleteEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'select', value: string): void
}

/** 自动补全组件组件暴露的属性和方法(组件内部使用) */
export interface _AutoCompleteExposed {
  open: () => void
  close: () => void
}

/** 自动补全组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type AutoCompleteExposed = DeconstructValue<_AutoCompleteExposed>
