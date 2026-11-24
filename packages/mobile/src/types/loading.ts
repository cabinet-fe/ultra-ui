import type { DeconstructValue } from '@veltra/utils'

export type LoadingType = 'dual-ring' | 'dot' | 'ring' | 'bars'

export interface LoadingProps {
  type: LoadingType
}

export interface LoadingEmits {
  (e: 'update:modelValue', value: string): void
}

export interface _LoadingExposed {}

/** 组件外部使用, 引用的值会被自动解构 */
export type LoadingExposed = DeconstructValue<_LoadingExposed>
