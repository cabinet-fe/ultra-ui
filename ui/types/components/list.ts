import type { DeconstructValue } from '../helper'
import type { ComponentSize } from '../component-common'

export interface ListProps {
  size?: ComponentSize
  /** 列表数据 */
  data: Record<string, any>[]
}

export interface ListEmits {}

export interface _ListExposed {}

export type ListExposed = DeconstructValue<_ListExposed>
