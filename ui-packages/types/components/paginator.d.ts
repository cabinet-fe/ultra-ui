import type { DeconstructValue } from '../helper'

/** 分页器组件组件属性 */
export interface PaginatorProps {
  modelValue?: string
}

/** 分页器组件组件定义的事件 */
export interface PaginatorEmits {
  (e: 'update:modelValue', value: string): void
}

/** 分页器组件组件暴露的属性和方法(组件内部使用) */
export interface _PaginatorExposed {}

/** 分页器组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PaginatorExposed = DeconstructValue<_PaginatorExposed>
