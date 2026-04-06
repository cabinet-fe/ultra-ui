import type { DeconstructValue } from '@ultra-ui/core'
import type { ComponentSize } from '@ultra-ui/core'

export interface ListProps {
  size?: ComponentSize
  /** 列表数据 */
  data: Record<string, any>[]
}

export interface ListEmits {}

export interface _ListExposed {}

export type ListExposed = DeconstructValue<_ListExposed>
