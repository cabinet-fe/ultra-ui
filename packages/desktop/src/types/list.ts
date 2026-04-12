import type { ComponentSize } from '@veltra/utils/types/component-common'
import type { DeconstructValue } from '@veltra/utils/types/helper'

export interface ListProps {
  size?: ComponentSize
  /** 列表数据 */
  data: Record<string, any>[]
}

export interface ListEmits {}

export interface _ListExposed {}

export type ListExposed = DeconstructValue<_ListExposed>
