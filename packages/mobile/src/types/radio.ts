import type { FormComponentProps } from '@veltra/utils'

/** 单选框组件属性（与 @veltra/desktop URadio 同名；呈移动端列表行式选项形态，选中标记在行右侧） */
export interface RadioProps extends FormComponentProps {
  value?: any
  label?: string
  disabled?: boolean
  modelValue?: any
}

export interface RadioEmits {
  (e: 'update:modelValue', value: any): void
}
