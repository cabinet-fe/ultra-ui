import type { FormComponentProps } from '../component-common'

/** 复选框组件属性 */
export interface CheckboxProps extends FormComponentProps {
  /** 部分选中 */
  indeterminate?: boolean
  /** 是否选中  */
  modelValue?: boolean
}

export interface CheckboxEmits {
  (name: 'update:modelValue', checked: boolean): void
  (name: 'change', checked: boolean, e: MouseEvent): void
}

/** 复选框暴露的属性和方法 */
export interface CheckboxExposed {}
