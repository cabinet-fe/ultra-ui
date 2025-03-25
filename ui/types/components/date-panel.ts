import type { Dater } from 'cat-kit/fe'
import type { FormComponentProps } from '../component-common'

/** day接口 */
export interface Day {
  date: Dater
  /** 是否今日 */
  isToday?: boolean
  /** 日期类型：上月， 本月， 下月 */
  type: 'pre' | 'current' | 'next'
  /** 是否禁止选择 */
  disabled?: boolean
}

export type PanelType = 'day' | 'month' | 'year'

export interface DatePanelProps {
  date?: Dater
  rangeDate?: [Dater, Dater]
  range?: boolean
  disabledDate?: (date: Dater) => boolean
  type?: 'date' | 'month' | 'year'
  size?: FormComponentProps['size']
}

export interface DatePanelEmits {
  (e: 'select:date', date: Dater): void
  (e: 'select:range-date', rangeDate?: [Dater, Dater]): void
}
