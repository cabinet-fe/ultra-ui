import type { FormComponentProps } from '@veltra/utils'

/** 复选框组组件属性（移动端列表行式：选项纵向排列占满整行，v-model 为选中值数组） */
export interface CheckboxGroupProps extends FormComponentProps {
  /** 值 */
  modelValue?: Array<any>
  /** 复选框项 */
  items: Array<Record<string, any>>
  /** 标签文本的key */
  labelKey?: string
  /** 值的key */
  valueKey?: string
  /** 选项行间细分隔线。默认 false */
  divider?: boolean
}

/** 复选框组组件定义的事件 */
export interface CheckboxGroupEmits {
  (e: 'update:modelValue', value: Array<any>): void
}
