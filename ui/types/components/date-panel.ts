import type { Dater } from 'cat-kit/fe'
import type { FormComponentProps } from '../component-common'

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
