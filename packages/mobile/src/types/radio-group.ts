import type { FormComponentProps } from '@veltra/utils'

/** 单选框组组件属性（移动端列表行式：选项纵向排列占满整行，选中标记在行右侧） */
export interface RadioGroupProps extends FormComponentProps {
  /** 值 */
  modelValue?: any
  /** 单选框项 */
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
  /** 禁用 */
  disabled?: boolean
  /** 禁用的选项 */
  disabledItem?: (item: Record<string, any>) => boolean
  /** 选项行间细分隔线。默认 false */
  divider?: boolean
}

/** 单选框组组件定义的事件 */
export interface RadioGroupEmits {
  /** 值更新 */
  (e: 'update:modelValue', modelValue: any): void
  /** 选项更新事件 */
  (e: 'change', item: Record<string, any>): void
}
