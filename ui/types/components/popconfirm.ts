import type { DeconstructValue } from "../helper"

/** 气泡确认框组件属性 */
export interface PopconfirmProps {
  /**文字 */
  title?: string
  /**
   * 触发方式
   */
  trigger?: "hover" | "click"
}

/** 气泡确认框组件定义的事件 */
export interface PopconfirmEmits {}

/** 气泡确认框组件暴露的属性和方法(组件内部使用) */
export interface _PopconfirmExposed {}

/** 气泡确认框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PopconfirmExposed = DeconstructValue<_PopconfirmExposed>
