import type { DeconstructValue } from '../helper'

/** 可调尺寸容器组件属性 */
export interface ResizeContainerProps {
  modelValue?: string
}

/** 可调尺寸容器组件定义的事件 */
export interface ResizeContainerEmits {
  (e: 'update:modelValue', value: string): void
}

/** 可调尺寸容器组件暴露的属性和方法(组件内部使用) */
export interface _ResizeContainerExposed {}

/** 可调尺寸容器组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ResizeContainerExposed = DeconstructValue<_ResizeContainerExposed>
