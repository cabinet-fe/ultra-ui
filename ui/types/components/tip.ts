import type { DeconstructValue } from "../helper"
export type positionType =
  | "top-start"
  | "top"
  | "top-end"
  | "left-start"
  | "left"
  | "left-end"
  | "bottom-start"
  | "bottom"
  | "bottom-end"
  | "right-start"
  | "right"
  | "right-end"

/** tip提示组件组件属性 */
export interface TipProps {
  /**提示内容 */
  content?: string
  /**自定义tip样式 */
  customStyle?: Record<string, any>
  /**触发tip方式 */
  trigger?: "hover" | "click"
  /**tip出现位置 */
  position?: positionType
  /**鼠标是否可进入到tip区域*/
  mouseEnterable?: boolean

  /**鼠标离开 tip区域后是否自动关闭 */
  mouseLeaveClose?: boolean

 /**
  * 点击空白区域是否可关闭
  */
  clickClose?: boolean
}

/** tip提示组件组件定义的事件 */
export interface TipEmits {
  (e: "update:modelValue", value: string): void
}

/** tip提示组件组件暴露的属性和方法(组件内部使用) */
export interface _TipExposed {
  closeTipContent,
  contentDom
}

/** tip提示组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TipExposed = DeconstructValue<_TipExposed>
