import type { FormComponentProps } from '../component-common'

/** 选择器组件属性 */
export interface SelectProps extends FormComponentProps {
  /** 是否多选 */
  multiple?: boolean
  modelValue: string
  options: Array<{
    label: string
    value: string
  }>
  valueKey?: string
  labelKey?: string
}

export interface SelectEmits {
  /** 触发更新label事件 */
  (e: 'update:label', label?: string): void
  (e: 'update:modelValue', value?: string): void
}
