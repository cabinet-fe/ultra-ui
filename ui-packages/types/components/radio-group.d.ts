import type {DeconstructValue} from "../helper"

/** 单选框默认父组件组件属性 */
export interface RadioGroupProps {
  /**按钮类型 */
  radioType?: string
  /**数据 */
  data: Record<string, any>[]
  /**绑定值 */
  modelValue?: string | number | boolean
  /**选项值 */
  keyValue?: string
  /**文字 */
  labelValue?: string
  /**按钮样式选中背景色 */
  checkedColor?: string
  /**禁用某一个或多个 */
  disabledIndex?: number | number[] | string
  /**全部禁用 */
  disabled?:boolean
}

/** 单选框默认父组件组件定义的事件 */
export interface RadioGroupEmits {
  (
    e: "onChange",
    keyValue: string | number | boolean,
    item: Record<string, any>,
  ): void
  (
    e: "update:modelValue",
    modelValue: string | number | boolean | undefined
  ): void
}

/** 单选框默认父组件组件暴露的属性和方法(组件内部使用) */
export interface _RadioGroupExposed {}

/** 单选框默认父组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RadioGroupExposed = DeconstructValue<_RadioGroupExposed>
