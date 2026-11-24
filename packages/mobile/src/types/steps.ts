import type { ColorType, ComponentSize, DeconstructValue } from '@veltra/utils'

export interface StepsProps {
  /**
   * 当前步骤项，默认为步骤的索引
   */
  current?: string | number
  size?: ComponentSize
  items: Record<string, any>[]
  labelKey?: string
  /**
   * 当前步骤项键
   * @description
   * 如果指定，则current的值会作为items中的键值来获取当前步骤项
   */
  currentKey?: string
  /**
   * 方向
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical'

  alignCenter?: boolean

  currentStepType?: ColorType
  /**
   * 已完成项步骤颜色类型
   * @default 'success'
   */
  finishedStepType?: ColorType
}

export interface StepsSlotScope {
  item: Record<string, any>
  index: number
}

export interface StepsEmits {
  (e: 'update:current', value?: string | number): void
  (e: 'item-click', item: Record<string, any>, index: number): void
}

export interface _StepsExposed {}

/** 组件外部使用, 引用的值会被自动解构 */
export type StepsExposed = DeconstructValue<_StepsExposed>
