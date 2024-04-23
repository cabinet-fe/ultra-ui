import type { Dater } from 'cat-kit/fe'
import type { DeconstructValue } from '../helper'

/** 日历组件属性 */
export interface CalendarProps {
  modelValue?: string
}

/** day接口 */
export interface Day {
  date: Dater
  /** 是否时今日 */
  isToday?: boolean
  /** 日期类型 */
  type: 'pre' | 'current' | 'next'
  /** 是否禁止选择 */
  disabled?: boolean
}

/** 日历组件定义的事件 */
export interface CalendarEmits {
  (e: 'update:modelValue', value: string): void
}

/** 日历组件暴露的属性和方法(组件内部使用) */
export interface _CalendarExposed {}

/** 日历组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CalendarExposed = DeconstructValue<_CalendarExposed>
