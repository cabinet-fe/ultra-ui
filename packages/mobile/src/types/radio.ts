import type { FormComponentProps } from '@veltra/utils'

/** 单选框组件属性（与 @veltra/desktop URadio 对齐） */
export interface RadioProps extends FormComponentProps {
  /** 单选框值 */
  value?: any
  /** 文本 */
  label?: string
  /**全部禁用 */
  disabled?: boolean
  /** 绑定值 */
  modelValue?: any
}

/** 单选框组件定义的事件 */
export interface RadioEmits {
  (e: 'update:modelValue', value: any): void
}
