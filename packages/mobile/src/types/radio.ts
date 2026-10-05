import type { FormComponentProps } from '@veltra/utils'

/** 单选框组件属性（与 @veltra/desktop URadio 同名；呈移动端列表行式选项形态，选中标记在行右侧） */
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
