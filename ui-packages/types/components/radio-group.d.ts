import type {DeconstructValue} from "../helper"
import type {FormComponentProps} from "../component-common"
/** 单选框默认父组件组件属性 */
export interface RadioGroupProps extends FormComponentProps {
  /**按钮类型 */
  radioType?: string
  /**数据 */
  data?: Record<string, any>[]
  /**选项值 */
  valueKey?: string
  /**文字 */
  labelKey?: string
  /**隐藏按钮 */
  hidden?: boolean
  /**禁用某一个或多个 */
  disabledIndex?: number | number[]
  /**全部禁用 */
  disabled?: boolean
}

/** 单选框默认父组件组件定义的事件 */
export interface RadioGroupEmits {
  (
    e: "onChange",
    keyValue: string | number | boolean,
    item: Record<string, any>
  ): void
}

/** 单选框默认父组件组件暴露的属性和方法(组件内部使用) */
export interface _RadioGroupExposed {}

/** 单选框默认父组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RadioGroupExposed = DeconstructValue<_RadioGroupExposed>
