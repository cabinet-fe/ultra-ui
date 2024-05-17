import type { DeconstructValue } from '../helper'

/** 空内容组件属性 */
export interface EmptyProps {
  modelValue?: string
}

/** 空内容组件定义的事件 */
export interface EmptyEmits {
  (e: 'update:modelValue', value: string): void
}

/** 空内容组件暴露的属性和方法(组件内部使用) */
export interface _EmptyExposed {}

/** 空内容组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type EmptyExposed = DeconstructValue<_EmptyExposed>
