import type { FormComponentProps } from '@veltra/utils'

/** 复选框组组件属性（移动端列表行式：选项纵向排列占满整行，v-model 为选中值数组） */
export interface CheckboxGroupProps extends FormComponentProps {
  modelValue?: Array<any>
  items: Array<Record<string, any>>
  labelKey?: string
  valueKey?: string
  /** 选项行间细分隔线。默认 false */
  divider?: boolean
}

export interface CheckboxGroupEmits {
  (e: 'update:modelValue', value: Array<any>): void
}
