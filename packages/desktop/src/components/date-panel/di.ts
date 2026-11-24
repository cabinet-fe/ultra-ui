import type { Dater } from '@cat-kit/core'
import type { BEM } from '@veltra/utils'
import type { ComputedRef, InjectionKey, Ref } from 'vue'

import type { DatePanelEmits, DatePanelProps, PanelType } from '../../types'

export interface DatePanelContext {
  cls: BEM<'date-panel'>
  panelType: Ref<PanelType>
  panelDate: Ref<Dater>
  rangeDate: ComputedRef<[Dater, Dater] | undefined>

  panelProps: DatePanelProps
  panelEmit: DatePanelEmits

  handleDateSelect: (date: Dater) => void
  handleDateRangeHover: (date: Dater) => void

  toPrevYear: () => void
  toPrevMonth: () => void
  toNextYear: () => void
  toNextMonth: () => void
  toNextTenYears: () => void
  toPrevTenYears: () => void
}

export const DatePanelDIKey: InjectionKey<DatePanelContext> = Symbol('DatePanelDIKey')
