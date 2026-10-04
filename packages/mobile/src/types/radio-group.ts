import type { FormComponentProps } from '@veltra/utils'

/** 单选框组组件属性（与 @veltra/desktop URadioGroup 对齐） */
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
  /** 块级布局 */
  block?: boolean
}

/** 单选框组组件定义的事件 */
export interface RadioGroupEmits {
  /** 值更新 */
  (e: 'update:modelValue', modelValue: any): void
  /** 选项更新事件 */
  (e: 'change', item: Record<string, any>): void
}
