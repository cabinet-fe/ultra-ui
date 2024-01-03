import type {DeconstructValue} from "../helper"

/** tip提示组件组件属性 */
export interface TipProps {
  /**提示内容 */
  modelValue?: string
  /**自定义弹窗样式 */
  customStyle?: Record<string, any>
  /**触发弹窗方式 */
  triggerPopUpMode?:'hover' | 'click'
}

/** tip提示组件组件定义的事件 */
// export interface TipEmits {
//   (e: "update:modelValue", value: string): void
// }

/** tip提示组件组件暴露的属性和方法(组件内部使用) */
export interface _TipExposed {}

/** tip提示组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type TipExposed = DeconstructValue<_TipExposed>