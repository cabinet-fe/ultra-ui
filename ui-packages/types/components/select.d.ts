import type { FormComponentProps } from '../component-common'

/** 选择器组件属性 */
export interface SelectProps extends FormComponentProps {
  /** 绑定值 */
  modelValue: string | Array<string>
  /** 列表选项 */
  options: Array<Record<string, any>>
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
  /** 是否禁用 */
  disabled?: boolean
  /** 折叠标签 */
  collapseTags?: boolean
  /** 最大折叠标签 */
  maxCollapseTags?: number | string
  /** 是否启用搜索功能 */
  filterable?: boolean
}

export interface SelectEmits {
  /** 触发更新label事件 */
  (e: 'update:label', label?: string): void
  (e: 'update:modelValue', option?: object): void
  (e: 'clear'): void
  (e: 'change', option?: object): void
}

export interface SelectExposed {
  multipleOptions: Ref<Array<object>>
}
