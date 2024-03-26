import type { DeconstructValue } from '../helper'

/** 步骤组件组件属性 */
export interface StepsProps {
  modelValue?: string
}

/** 步骤组件组件定义的事件 */
export interface StepsEmits {
  (e: 'update:modelValue', value: string): void
}

/** 步骤组件组件暴露的属性和方法(组件内部使用) */
export interface _StepsExposed {}

/** 步骤组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type StepsExposed = DeconstructValue<_StepsExposed>
