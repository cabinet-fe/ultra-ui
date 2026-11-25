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
   * 方向。`vertical` 时圆点在左、文案在右，连线沿圆点中心向下。
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical'

  /**
   * 仅横向生效：圆点与文案在步骤格内居中，连线连接相邻圆点中心
   */
  alignCenter?: boolean

  /**
   * 当前步骤颜色。不设置时圆点使用 primary
   */
  currentStepType?: ColorType
  /**
   * 已完成步骤颜色。圆点、对勾和连线使用该颜色，文案不跟随。
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
