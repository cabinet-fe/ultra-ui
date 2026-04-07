import type { FormComponentProps } from '../component-common'

/** 组件项组件属性 */
export interface FormItemProps extends FormComponentProps {
  /** 标签宽度 */
  labelWidth?: string | number
}

/** 组件项组件定义的事件 */
export interface FormItemEmits {}

/** 组件项组件暴露的属性和方法 */
export interface FormItemExposed {}
