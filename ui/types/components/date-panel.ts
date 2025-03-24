import type { Dater } from 'cat-kit/fe'

export interface DatePanelProps {
  panelDate: Dater
  date?: Dater
  format?: string
  type?: 'day' | 'month' | 'year'
  disabledDate?: (date: Dater) => boolean
}

interface DatePanelEmits {
  (e: 'select', date: Dater): void
}

/** 日期面板组件属性 */
export interface DatePanelDayProps extends DatePanelProps {}

/** 日期面板组件定义的事件 */
export interface DatePanelDayEmits extends DatePanelEmits {}

/** 日期面板组件属性 */
export interface DatePanelYearProps {
  panelDate: Dater
  date?: Dater
  format?: string
  disabledDate?: (date: Dater) => boolean
}

/** 日期面板组件定义的事件 */
export interface DatePanelYearEmits extends DatePanelEmits {}

/** 日期面板组件属性 */
export interface DatePanelMonthProps extends DatePanelProps {}

/** 日期面板组件定义的事件 */
export interface DatePanelMonthEmits extends DatePanelEmits {}
