import type { FormComponentProps } from '@veltra/utils'

/** 复选框组件属性（与 @veltra/desktop UCheckbox 同名；呈移动端列表行式选项形态） */
export interface CheckboxProps extends FormComponentProps {
  /** 部分选中 */
  indeterminate?: boolean
  /** 是否选中  */
  modelValue?: boolean
}

/** 复选框组件定义的事件 */
export interface CheckboxEmits {
  (name: 'update:modelValue', checked: boolean): void
  (name: 'change', checked: boolean, e: MouseEvent): void
}
