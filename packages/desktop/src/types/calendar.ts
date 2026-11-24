import type { Dater } from '@cat-kit/core'
import type { DeconstructValue } from '@veltra/utils'

export interface CalendarDay {
  date: Dater
  isToday?: boolean
  /** 日期类型：上月， 本月， 下月 */
  type: 'pre' | 'current' | 'next'
  disabled?: boolean
}

export interface CalendarMonth {
  date: Dater
  disabled?: boolean
  key: string
  month: number
}

export interface CalendarYear {
  date: Dater
  disabled?: boolean
  year: number
}

export interface CalendarProps {
  modelValue?: string
}

export interface CalendarEmits {
  (e: 'update:modelValue', value: string): void
}

export interface _CalendarExposed {}

/** 日历组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CalendarExposed = DeconstructValue<_CalendarExposed>
