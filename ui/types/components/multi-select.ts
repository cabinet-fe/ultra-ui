import type { FormComponentProps } from '../component-common'
import type { DeconstructValue } from '../helper'

/** multi-select组件属性 */
export interface MultiSelectProps<Option extends Record<string, any>>
  extends FormComponentProps {
  /** 绑定值 */
  modelValue?: Array<string | number>
  /** 列表选项 */
  options?: Option[]
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
  /** 最大展示数量 */
  visibilityLimit?: number
  /** 最大可选数量 */
  max?: number
}

/** multi-select组件定义的事件 */
export interface MultiSelectEmits {
  (e: 'update:modelValue', value: Array<string | number>): void
}

/** multi-select组件暴露的属性和方法(组件内部使用) */
export interface _MultiSelectExposed {}

/** multi-select组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type MultiSelectExposed = DeconstructValue<_MultiSelectExposed>
