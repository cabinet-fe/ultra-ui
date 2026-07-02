import type { FormComponentProps } from '@veltra/utils'

/** 组件项组件属性 */
export interface FormItemProps extends FormComponentProps {
  /** 标签宽度 */
  labelWidth?: string | number
  /** 标签位置 */
  labelPosition?: 'top' | 'left'
}

/** 组件项组件定义的事件 */
export interface FormItemEmits {}

/** 组件项组件暴露的属性和方法 */
export interface FormItemExposed {}
