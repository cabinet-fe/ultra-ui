import type {DeconstructValue} from "../helper"

export type LoadingType = 'classic' | 'line' | 'dot' | 'spinner'

/** loading组件属性 */
export interface LoadingProps {
  /** 加载类型 */
  type: LoadingType
}

/** loading组件定义的事件 */
export interface LoadingEmits {
  (e: "update:modelValue", value: string): void
}

/** loading组件暴露的属性和方法(组件内部使用) */
export interface _LoadingExposed {}

/** loading组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type LoadingExposed = DeconstructValue<_LoadingExposed>
