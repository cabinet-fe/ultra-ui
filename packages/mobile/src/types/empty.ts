import type { DeconstructValue } from '@veltra/utils'

export interface EmptyProps {
  /** 图标大小, 默认48 */
  size?: number

  text?: string
}

export interface EmptyEmits {}

export interface _EmptyExposed {}

/** 组件外部使用, 引用的值会被自动解构 */
export type EmptyExposed = DeconstructValue<_EmptyExposed>
