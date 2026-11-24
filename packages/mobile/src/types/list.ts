import type { ComponentSize, DeconstructValue } from '@veltra/utils'

export interface ListProps {
  size?: ComponentSize
  data: Record<string, any>[]
}

export interface ListEmits {}

export interface _ListExposed {}

export type ListExposed = DeconstructValue<_ListExposed>
