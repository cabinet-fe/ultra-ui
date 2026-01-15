import type { DeconstructValue } from '../helper'

/** 进度节点组件属性 */
export interface ProgressNodesProps {
  modelValue?: string
}

/** 进度节点组件定义的事件 */
export interface ProgressNodesEmits {
  (e: 'update:modelValue', value: string): void
}

/** 进度节点组件暴露的属性和方法(组件内部使用) */
export interface _ProgressNodesExposed {}

/** 进度节点组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ProgressNodesExposed = DeconstructValue<_ProgressNodesExposed>
