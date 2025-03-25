import type { DatePanelEmits, DatePanelProps, PanelType } from '@ui/types'
import type { BEM } from '@ui/utils'
import type { Dater } from 'cat-kit/fe'
import type { InjectionKey, Ref } from 'vue'

export interface DatePanelContext {
  cls: BEM<'date-panel'>
  panelType: Ref<PanelType>
  panelDate: Ref<Dater>
  firstRangeDate: Ref<Dater | undefined>
  secondRangeDate: Ref<Dater | undefined>
  panelProps: DatePanelProps
  panelEmit: DatePanelEmits

  didInRange: (date: Dater) => boolean
  didIsRangeStart: (date: Dater, fmtStr: string) => boolean
  didIsRangeEnd: (date: Dater, fmtStr: string) => boolean

  getRangeDate: (first: Dater, second: Dater) => [Dater, Dater] | undefined

  /** 更新面板 */
  showNextPanel: () => void
  /** 处理日期悬停 */
  handleDateHovered: (date: Dater) => void
  /** 上一年 */
  handlePreYear: () => void
  /** 上个月 */
  handlePreMonth: () => void
  /** 下一年 */
  handleNextYear: () => void
  /** 下个月 */
  handleNextMonth: () => void
  /** 下十年 */
  handleNextTenYears: () => void
  /** 上十年 */
  handlePreTenYears: () => void
}

export const DatePanelDIKey: InjectionKey<DatePanelContext> =
  Symbol('DatePanelDIKey')
