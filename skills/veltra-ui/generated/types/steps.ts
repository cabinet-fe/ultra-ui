import type { ColorType, ComponentSize, DeconstructValue } from '@veltra/utils'

/** 步骤组件组件属性 */
export interface StepsProps {
  /**
   * 当前步骤项，默认为步骤的索引
   */
  current?: string | number
  /**
   * 尺寸
   */
  size?: ComponentSize
  /**
   * 步骤项
   */
  items: Record<string, any>[]
  /** 步骤项标签键 */
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

  /** 居中对齐 */
  alignCenter?: boolean

  /**
   * 当前步骤项颜色类型
   */
  currentStepType?: ColorType
  /**
   * 已完成项步骤颜色类型
   * @default 'success'
   */
  finishedStepType?: ColorType
}

/** 步骤项插槽作用域 */
export interface StepsSlotScope {
  item: Record<string, any>
  index: number
}

/** 步骤组件组件定义的事件 */
export interface StepsEmits {
  /**
   * 当前步骤项变更
   */
  (e: 'update:current', value?: string | number): void
  /**
   * 步骤项点击事件
   */
  (e: 'item-click', item: Record<string, any>, index: number): void
}

/** 步骤组件组件暴露的属性和方法(组件内部使用) */
export interface _StepsExposed {}

/** 步骤组件组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type StepsExposed = DeconstructValue<_StepsExposed>
