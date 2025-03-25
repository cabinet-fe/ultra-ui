import type { DatePanelEmits, DatePanelProps, PanelType } from '@ui/types'
import { bem } from '@ui/utils'
import { date, type Dater } from 'cat-kit'
import { computed, provide, shallowRef, watch } from 'vue'
import { DatePanelDIKey } from './di'

interface PanelOptions {
  props: DatePanelProps
  emit: DatePanelEmits
}

export function usePanel(options: PanelOptions) {
  const { props, emit } = options

  /** 组件类 */
  const cls = bem('date-panel')

  const panelType = shallowRef<PanelType>('day')
  const panelDate = shallowRef<Dater>(
    date((props.date || props.rangeDate?.[0])?.timestamp ?? new Date())
  )

  const typePanels = {
    date: ['year', 'month', 'day'],
    month: ['year', 'month'],
    year: ['year']
  }

  /** 更新展示的面板 */
  function showNextPanel() {
    const panels = typePanels[props.type!]
    const index = panels.indexOf(panelType.value)
    if (index === -1) {
      panelType.value = panels[panels.length - 1] as PanelType
    } else if (index < panels.length - 1) {
      panelType.value = panels[index + 1] as PanelType
    }
  }

  watch(
    () => props.type,
    () => {
      showNextPanel()
    },
    { immediate: true }
  )

  function handlePreYear() {
    panelDate.value = panelDate.value.calc(-1, 'years')
  }

  function handlePreMonth() {
    panelDate.value = panelDate.value.calc(-1, 'months')
  }

  function handleNextYear() {
    panelDate.value = panelDate.value.calc(1, 'years')
  }

  function handleNextMonth() {
    panelDate.value = panelDate.value.calc(1, 'months')
  }

  function handlePreTenYears() {
    panelDate.value = panelDate.value.calc(-10, 'years')
  }

  function handleNextTenYears() {
    panelDate.value = panelDate.value.calc(10, 'years')
  }

  const firstRangeDate = shallowRef<Dater>()
  const secondRangeDate = shallowRef<Dater>()

  const rangeDate = computed<[Dater, Dater] | undefined>(() => {
    if (!firstRangeDate.value && !secondRangeDate.value) {
      return props.rangeDate
    }

    return getRangeDate(firstRangeDate.value!, secondRangeDate.value!)
  })

  /** 处理日期悬停 */
  function handleDateHovered(date: Dater) {
    if (!props.range || !panelDate.value || !firstRangeDate.value) {
      return
    }
    secondRangeDate.value = date
  }

  function getRangeDate(
    first: Dater,
    second: Dater
  ): [Dater, Dater] | undefined {
    let rangeDate: [Dater, Dater] = [first, second]

    if (first.timestamp > second.timestamp) {
      rangeDate = [second, first]
    }

    return rangeDate
  }

  function didInRange(date: Dater) {
    if (rangeDate.value?.length !== 2) return false
    const [start, end] = rangeDate.value
    return date.timestamp >= start.timestamp && date.timestamp <= end.timestamp
  }

  function didIsRangeStart(date: Dater, fmtStr: string) {
    if (rangeDate.value?.length !== 2) return false
    const [start] = rangeDate.value
    return date.format(fmtStr) === start.format(fmtStr)
  }

  function didIsRangeEnd(date: Dater, fmtStr: string) {
    if (rangeDate.value?.length !== 2) return false
    const [_, end] = rangeDate.value
    return date.format(fmtStr) === end.format(fmtStr)
  }

  provide(DatePanelDIKey, {
    cls,

    panelProps: props,
    panelEmit: emit,

    panelType,
    panelDate,

    firstRangeDate,
    secondRangeDate,
    getRangeDate,

    showNextPanel,
    handlePreYear,
    handlePreMonth,
    handleNextYear,
    handleNextMonth,
    handlePreTenYears,
    handleNextTenYears,
    handleDateHovered,

    didInRange,
    didIsRangeStart,
    didIsRangeEnd
  })

  return {
    cls,
    panelType,
    panelDate
  }
}
