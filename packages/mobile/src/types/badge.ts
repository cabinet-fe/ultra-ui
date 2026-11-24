import type { ColorType, ComponentProps, DeconstructValue } from '@veltra/utils'

export interface BadgeProps extends ComponentProps {
  value?: number | string
  type?: ColorType
  color?: string
  hidden?: boolean
  /** 最大值 {{max}}+ */
  max?: number
  dot?: boolean
}

export interface BadgeEmits {
  (e: 'update:modelValue', value: string): void
}

export interface _BadgeExposed {}

/** 组件外部使用, 引用的值会被自动解构 */
export type BadgeExposed = DeconstructValue<_BadgeExposed>
