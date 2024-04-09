import type { Component } from "vue"
import type {DeconstructValue} from "../helper"

/** loading组件属性 */
export interface LoadingProps {
  /**自定义文本 */
  text?: string
  /**自定义图标 */
  loadingIcon?:Component

  background?:string
}

/** loading组件定义的事件 */
export interface LoadingEmits {
  (e: "update:modelValue", value: string): void
}

/** loading组件暴露的属性和方法(组件内部使用) */
export interface _LoadingExposed {}

/** loading组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type LoadingExposed = DeconstructValue<_LoadingExposed>
