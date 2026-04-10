import type { ComponentSize } from '@ultra-ui/utils/types/component-common'
import type { DeconstructValue } from '@ultra-ui/utils/types/helper'

export interface ListProps {
  size?: ComponentSize
  /** 列表数据 */
  data: Record<string, any>[]
}

export interface ListEmits {}

export interface _ListExposed {}

export type ListExposed = DeconstructValue<_ListExposed>
