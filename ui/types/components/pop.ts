import type { DeconstructValue } from '../helper'

/** 气泡弹框组件属性 */
export interface PopProps {
  modelValue?: string
}

/** 气泡弹框组件定义的事件 */
export interface PopEmits {
  (e: 'update:modelValue', value: string): void
}

/** 气泡弹框组件暴露的属性和方法(组件内部使用) */
export interface _PopExposed {}

/** 气泡弹框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PopExposed = DeconstructValue<_PopExposed>
