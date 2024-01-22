import type {DeconstructValue} from "../helper"

/** 单选框按钮样式组件属性 */
export interface RadioButtonProps {
  /** 原始 name 属性 */
  name?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 单选框的值 */
  label?: string
  /**是否选中 */
  isChecked?: boolean
  /**多个按钮时的item */
  itemValue?: Record<string, any>
  /**选中背景色 */
  checkedColor?: string
  /**全部禁用 */
  disabled?: boolean
  /**单选框尺寸 */
  size?:string
}

/** 单选框按钮样式组件定义的事件 */
export interface RadioButtonEmits {
  (e: "update:modelValue", value: boolean): void
  (
    e: "update:modelDataValue",
    value: boolean,
    itemValue: Record<string, any>
  ): void
}

/** 单选框按钮样式组件暴露的属性和方法(组件内部使用) */
export interface _RadioButtonExposed {}

/** 单选框按钮样式组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type RadioButtonExposed = DeconstructValue<_RadioButtonExposed>
