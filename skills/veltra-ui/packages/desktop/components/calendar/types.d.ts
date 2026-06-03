import type { Dater } from '@cat-kit/core'
import type { DeconstructValue } from '@veltra/utils'

/** day接口 */
export interface CalendarDay {
  date: Dater
  /** 是否今日 */
  isToday?: boolean
  /** 日期类型：上月， 本月， 下月 */
  type: 'pre' | 'current' | 'next'
  /** 是否禁止选择 */
  disabled?: boolean
}

export interface CalendarMonth {
  date: Dater
  /** 是否禁止选择 */
  disabled?: boolean
  /** 年月标识 */
  key: string
  /** 月份 */
  month: number
}

export interface CalendarYear {
  date: Dater
  /** 是否禁止选择 */
  disabled?: boolean
  /** 年份 */
  year: number
}

/** 日历组件属性 */
export interface CalendarProps {
  modelValue?: string
}

/** 日历组件定义的事件 */
export interface CalendarEmits {
  (e: 'update:modelValue', value: string): void
}

/** 日历组件暴露的属性和方法(组件内部使用) */
export interface _CalendarExposed {}

/** 日历组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CalendarExposed = DeconstructValue<_CalendarExposed>
