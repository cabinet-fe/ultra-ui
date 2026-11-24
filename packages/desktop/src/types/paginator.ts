import type { DeconstructValue } from '@veltra/utils'
import type { ShallowRef } from 'vue'

export interface PaginatorProps {
  pageNumber?: number
  pageSize?: number
  size?: 'large' | 'default' | 'small'
  total?: number
  pageSizeOptions?: Array<number>
  simple?: boolean
}

export interface PaginatorEmits {
  (e: 'update:pageNumber', value: number): void
  (e: 'change:pageNumber', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'change:pageSize', value: number): void
}

export interface _PaginatorExposed {
  el: ShallowRef<HTMLElement | undefined>
}

/** 分页器组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PaginatorExposed = DeconstructValue<_PaginatorExposed>
