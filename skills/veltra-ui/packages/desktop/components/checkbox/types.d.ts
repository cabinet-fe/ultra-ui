import type { ColorType, FormComponentProps } from '@veltra/utils'

/** 复选框组件属性 */
export interface CheckboxProps extends FormComponentProps {
  /** 部分选中 */
  indeterminate?: boolean
  /** 是否选中  */
  modelValue?: boolean
}

export interface CheckboxButtonProps extends FormComponentProps {
  /** 是否选中  */
  modelValue?: boolean
  /** 是否圆角 */
  round?: boolean
  /** 类型 */
  type?: ColorType
}

export interface CheckboxEmits {
  (name: 'update:modelValue', checked: boolean): void
  (name: 'change', checked: boolean, e: MouseEvent): void
}

export interface CheckboxButtonEmits {
  (name: 'update:modelValue', checked: boolean): void
  (name: 'change', checked: boolean): void
}

/** 复选框暴露的属性和方法 */
export interface CheckboxExposed {}
