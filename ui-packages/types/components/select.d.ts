import type { FormComponentProps } from '../component-common'

/** 选择器组件属性 */
export interface SelectProps extends FormComponentProps {
  /** 绑定值 */
  modelValue: string
  /** 列表选项 */
  options: Array<{
    label: string
    value: string
  }>
  /** 值字段 */
  valueKey?: string
  /** 标签字段 */
  labelKey?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 是否多选 */
  multiple?: boolean
  /** 占位符 */
  placeholder?: string
}

export interface SelectEmits {
  /** 触发更新label事件 */
  (e: 'update:label', label?: string): void
  (e: 'update:modelValue', option?: object): void
  (e: 'clear'): void
}
