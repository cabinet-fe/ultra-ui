import type {DeconstructValue} from "../helper"

/** 下拉框组件属性 */
export interface DropdownProps {
  trigger?: "hover" | "click"
  mouseEnterable?: boolean
  /**超出触发器 */
  maxContent?:boolean
}

/** 下拉框组件定义的事件 */
export interface DropdownEmits {
  (e: "update:modelValue", value: string): void
}

/** 下拉框组件暴露的属性和方法(组件内部使用) */
export interface _DropdownExposed {}

/** 下拉框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DropdownExposed = DeconstructValue<_DropdownExposed>
