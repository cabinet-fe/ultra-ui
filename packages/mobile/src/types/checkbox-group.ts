import type { FormComponentProps } from '@veltra/utils'

/** 复选框组组件属性（与 @veltra/desktop UCheckboxGroup 对齐，v-model 为选中值数组） */
export interface CheckboxGroupProps extends FormComponentProps {
  /** 值 */
  modelValue?: Array<any>
  /** 复选框项 */
  items: Array<Record<string, any>>
  /** 标签文本的key */
  labelKey?: string
  /** 值的key */
  valueKey?: string
  /** 块级显示 */
  block?: boolean
}

/** 复选框组组件定义的事件 */
export interface CheckboxGroupEmits {
  (e: 'update:modelValue', value: Array<any>): void
}
