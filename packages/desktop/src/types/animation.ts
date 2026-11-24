import type { DeconstructValue } from '@veltra/utils'

export interface AnimationProps {
  /**
   * @default 'div'
   */
  tag?: string

  inView?: Record<string, any>
}

export interface AnimationEmits {
  (e: 'update:modelValue', value: string): void
}

export interface _AnimationExposed {}

/** 动画组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type AnimationExposed = DeconstructValue<_AnimationExposed>
