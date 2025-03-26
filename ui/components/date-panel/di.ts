import type { DatePanelEmits, DatePanelProps, PanelType } from '@ui/types'
import type { BEM } from '@ui/utils'
import type { Dater } from 'cat-kit/fe'
import type { ComputedRef, InjectionKey, Ref } from 'vue'

export interface DatePanelContext {
  cls: BEM<'date-panel'>
  panelType: Ref<PanelType>
  panelDate: Ref<Dater>
  rangeDate: ComputedRef<[Dater, Dater] | undefined>

  panelProps: DatePanelProps
  panelEmit: DatePanelEmits

  /** 选择日期 */
  handleDateSelect: (date: Dater) => void
  /** 范围日期悬停 */
  handleDateRangeHover: (date: Dater) => void

  /** 上一年 */
  toPrevYear: () => void
  /** 上个月 */
  toPrevMonth: () => void
  /** 下一年 */
  toNextYear: () => void
  /** 下个月 */
  toNextMonth: () => void
  /** 下十年 */
  toNextTenYears: () => void
  /** 上十年 */
  toPrevTenYears: () => void
}

export const DatePanelDIKey: InjectionKey<DatePanelContext> =
  Symbol('DatePanelDIKey')
