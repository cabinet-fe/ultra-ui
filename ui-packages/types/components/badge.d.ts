import type { DeconstructValue } from '../helper'

/** 徽章组件属性 */
export interface BadgeProps {
  value?: string | number
}

/** 徽章组件定义的事件 */
export interface BadgeEmits {
  (e: 'update:modelValue', value: string): void
}

/** 徽章组件暴露的属性和方法(组件内部使用) */
export interface _BadgeExposed {}

/** 徽章组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type BadgeExposed = DeconstructValue<_BadgeExposed>
