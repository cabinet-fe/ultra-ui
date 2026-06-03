import type { DeconstructValue } from '@veltra/utils'

/** 动画组件属性 */
export interface AnimationProps {
  /**
   * 标签元素
   * @default 'div'
   */
  tag?: string

  inView?: Record<string, any>
}

/** 动画组件定义的事件 */
export interface AnimationEmits {
  (e: 'update:modelValue', value: string): void
}

/** 动画组件暴露的属性和方法(组件内部使用) */
export interface _AnimationExposed {}

/** 动画组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type AnimationExposed = DeconstructValue<_AnimationExposed>
