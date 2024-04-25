import type { FormComponentProps } from '../component-common'

/** 选择器组件属性 */
export interface SelectProps<Option extends Record<string, any>>
  extends FormComponentProps {
  /** 绑定值 */
  modelValue?: string | number
  /** 文本内容 */
  text?: string
  /** 列表选项 */
  options: Option[]
  /** 值字段 */
  valueKey?: string
  /** 标签字段 */
  labelKey?: string
  /** 是否可清除 */
  clearable?: boolean
  /** 占位符 */
  placeholder?: string
  /** 是否启用搜索功能 */
  filterable?: boolean
}

export interface SelectEmits<Option extends Record<string, any>> {
  /** 触发更新label事件 */
  (e: 'update:label', label?: string): void
  (e: 'update:modelValue', modelValue?: string | number): void
  (e: 'change', option: Option): void
}

export interface SelectExposed {}