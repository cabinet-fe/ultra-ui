import { date, type Dater } from 'cat-kit/fe'
import { computed, shallowRef } from 'vue'
import type { DatePanelProps } from '@ui/types'

interface PanelDateOptions {
  props: DatePanelProps
}

export function usePanelDate(options: PanelDateOptions) {
  const { props } = options

  /** 当前面板日期 */
  const panelDate = shallowRef<Dater>(
    date((props.date || props.rangeDate?.[0])?.timestamp ?? new Date())
  )

  function updatePanelDate(date: Dater) {
    panelDate.value = date
  }

  function toPrevYear() {
    updatePanelDate(panelDate.value.calc(-1, 'years'))
  }

  function toNextYear() {
    updatePanelDate(panelDate.value.calc(1, 'years'))
  }

  function toPrevMonth() {
    updatePanelDate(panelDate.value.calc(-1, 'months'))
  }

  function toNextMonth() {
    updatePanelDate(panelDate.value.calc(1, 'months'))
  }

  function toPrevTenYears() {
    updatePanelDate(panelDate.value.calc(-10, 'years'))
  }

  function toNextTenYears() {
    updatePanelDate(panelDate.value.calc(10, 'years'))
  }

  return {
    panelDate: computed(() => panelDate.value),
    updatePanelDate,

    toPrevYear,
    toNextYear,
    toPrevMonth,
    toNextMonth,
    toPrevTenYears,
    toNextTenYears
  }
}
