import type { DatePanelProps } from '@ui/types'
import { bem } from '@ui/utils'
import { shallowReactive } from 'vue'

interface PanelOptions {
  props: DatePanelProps
}

export function usePanel(options: PanelOptions) {
  const { props } = options
  const formats = {
    date: 'yyyy-MM-dd',
    month: 'yyyy-MM',
    year: 'yyyy'
  }

  const typePanels = {
    date: ['year', 'month', 'day'],
    month: ['year', 'month'],
    year: ['year']
  }

  /** 组件类 */
  const cls = bem('date-picker')

  const state = shallowReactive({
    visiblePanel: 'day' as DatePanelProps['type'],
    date: props.date,
    panelDate: props.panelDate
  })

  return {
    state
  }
}
