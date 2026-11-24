import type { ColorType, FormComponentProps } from '@veltra/utils'

export interface CheckboxProps extends FormComponentProps {
  indeterminate?: boolean
  modelValue?: boolean
}

export interface CheckboxButtonProps extends FormComponentProps {
  modelValue?: boolean
  round?: boolean
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

export interface CheckboxExposed {}
