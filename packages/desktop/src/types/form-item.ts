import type { FormComponentProps } from '@veltra/utils'

export interface FormItemProps extends FormComponentProps {
  labelWidth?: string | number
  labelPosition?: 'top' | 'left'
}

export interface FormItemEmits {
  /** 内部控件 change，参数与控件一致 */
  (e: 'change', ...args: any[]): void
}

export interface FormItemExposed {}
