import type {DeconstructValue} from "../helper"
import type {FormComponentProps} from "../component-common"
/** 单选框按钮样式组件属性 */
export interface RadioButtonProps extends FormComponentProps {
  /** 选项值 */
  value?: number | string | boolean
  /**多个按钮时的item */
  itemValue?: Record<string, any>
  /**选中背景色 */
  checkedColor?: string
  /**全部禁用 */
  disabled?: boolean
  /**单选框尺寸 */
  size?: string
}

/** 单选框按钮样式组件定义的事件 */
export interface RadioButtonEmits {
  (e: "update:modelValue", value: boolean, item: Record<string, any>): void
}

/** 单选框按钮样式组件暴露的属性和方法(组件内部使用) */
export interface _RadioButtonExposed {}

/** 单选框按钮样式组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RadioButtonExposed = DeconstructValue<_RadioButtonExposed>
