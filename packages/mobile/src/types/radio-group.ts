import type { FormComponentProps } from '@veltra/utils'

/** 单选框组组件属性（移动端列表行式：选项纵向排列占满整行，选中标记在行右侧） */
export interface RadioGroupProps extends FormComponentProps {
  modelValue?: any
  items: Record<string, any>[]
  /**
   * 选项值key
   * @default 'value'
   */
  valueKey?: string
  /**
   * 标签文本key
   * @default 'label'
   */
  labelKey?: string
  disabled?: boolean
  disabledItem?: (item: Record<string, any>) => boolean
  /** 选项行间细分隔线。默认 false */
  divider?: boolean
}

export interface RadioGroupEmits {
  (e: 'update:modelValue', modelValue: any): void
  (e: 'change', item: Record<string, any>): void
}
