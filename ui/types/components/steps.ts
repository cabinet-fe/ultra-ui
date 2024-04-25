import type { DeconstructValue } from '../helper'

export interface StepItem {
  label: string
  key: string
  [x: string]: any
}

/** 步骤组件组件属性 */
export interface StepsProps {
  modelValue?: string
  active: string | null | undefined
  items: StepItem[]
  direction?: 'horizontal' | 'vertical'
  readonly?: boolean
  finishStatus?: 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'default'
  processStatus?: 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'default'
}

/** 步骤组件组件定义的事件 */
export interface StepsEmits {
  // (e: 'update:modelValue', value: string): void
  (e: 'update:active', value: string): void
  (e: 'stepClick', item: StepItem): void
}

/** 步骤组件组件暴露的属性和方法(组件内部使用) */
export interface _StepsExposed {}

/** 步骤组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type StepsExposed = DeconstructValue<_StepsExposed>
