import type {DeconstructValue} from "../helper"
// type positionType =
//   | "top-start"
//   | "top"
//   | "top-end"
//   | "left-start"
//   | "left"
//   | "left-end"
//   | "bottom-start"
//   | "bottom"
//   | "bottom-end"
//   | "right-start"
//   | "right"
//   | "right-end"

/** tip提示组件组件属性 */
export interface TipV2Props {
  /**提示内容 */
  modelValue?: string
  /**自定义tip样式 */
  customStyle?: Record<string, any>
  /**触发tip方式 */
  triggerPopUpMode?: "hover" | "click"
  /**tip出现位置 */
  position?:
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
  /**主题 */
  theme?: "dark" | "light"
  /**鼠标是否可进入到tip区域*/
  mouseEnterable?: boolean
}

/** tip提示组件组件定义的事件 */
export interface TipV2Emits {
  (e: "update:modelValue", value: string): void
}

/** tip提示组件组件暴露的属性和方法(组件内部使用) */
export interface _TipV2Exposed {}

/** tip提示组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TipV2Exposed = DeconstructValue<_TipV2Exposed>
