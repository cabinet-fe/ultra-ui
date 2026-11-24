import type { FormComponentProps } from '@veltra/utils'

export interface CheckboxGroupProps extends FormComponentProps {
  modelValue?: Array<any>
  items: Array<Record<string, any>>
  labelKey?: string
  valueKey?: string
  block?: boolean
}

export interface CheckboxGroupEmits {
  (e: 'update:modelValue', value: Array<any>): void
}

export interface CheckboxGroupExposed {}
