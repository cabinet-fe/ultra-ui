import type { DeconstructValue } from '../helper'

/** 分页器组件组件属性 */
export interface PaginatorProps {
  modelValue?: string
  /** 当前页数 */
  pageNumber: number
  /** 每页数量 */
  pageSize: number
  /** 大小模式 */
  size?: string
  /** 总数 */
  total: number
  /** 每页显示数量选项 */
  pageSizeOptions: Array<number>
}

/** 分页器组件组件定义的事件 */
export interface PaginatorEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'update:pageNumber', value: number): void
  (e: 'update:pageSize', value: number): void
}

/** 分页器组件组件暴露的属性和方法(组件内部使用) */
export interface _PaginatorExposed {}

/** 分页器组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PaginatorExposed = DeconstructValue<_PaginatorExposed>