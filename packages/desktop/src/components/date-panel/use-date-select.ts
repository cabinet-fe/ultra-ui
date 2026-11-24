import type { Dater } from '@cat-kit/core'
import { type Ref, computed, type ComputedRef, shallowRef } from 'vue'

import type { DatePanelProps, PanelType, DatePanelEmits } from '../../types'

interface DateSelectOptions {
  props: DatePanelProps
  emit: DatePanelEmits
  panelType: Ref<PanelType>
  updatePanelDate: (date: Dater) => void
}

interface UseDateSelectReturned {
  handleDateSelect: (date: Dater) => void
  handleDateRangeHover: (date: Dater) => void
  resetRangeDateTemp: () => void
  rangeDate: ComputedRef<[Dater, Dater] | undefined>
}

export function useDateSelect(options: DateSelectOptions): UseDateSelectReturned {
  const { props, panelType, emit, updatePanelDate } = options

  const panelSequence: PanelType[] = ['year', 'month', 'day']

  const typeMapToPanelType = { year: 'year', month: 'month', date: 'day' }

  /**
   * 临时日期范围, 在点击第一次范围日期时使用
   */
  const rangeDateTemp = shallowRef<[Dater, Dater]>()
  let firstSelectedRangeDate: Dater | undefined = undefined

  const rangeDate = computed(() => {
    return rangeDateTemp.value || props.rangeDate
  })

  function resetRangeDateTemp() {
    rangeDateTemp.value = undefined
    firstSelectedRangeDate = undefined
  }

  const panelTypeMatchDateType = computed(() => {
    const { type } = props
    return typeMapToPanelType[type!] === panelType.value
  })

  function switchNextPanel() {
    const index = panelSequence.indexOf(panelType.value)
    if (index === -1) return
    panelType.value = panelSequence[index + 1]!
  }

  function handleDateRangeSelect(date: Dater) {
    if (panelTypeMatchDateType.value) {
      if (!firstSelectedRangeDate) {
        firstSelectedRangeDate = date
        rangeDateTemp.value = [date, date]
      } else {
        if (date.timestamp < firstSelectedRangeDate.timestamp) {
          rangeDateTemp.value = [date, firstSelectedRangeDate]
        } else {
          rangeDateTemp.value = [firstSelectedRangeDate, date]
        }
        emit('select:range-date', rangeDateTemp.value)
        resetRangeDateTemp()
      }
    } else {
      updatePanelDate(date)
      switchNextPanel()
    }
  }

  function handleDateRangeHover(date: Dater) {
    if (!panelTypeMatchDateType.value || !firstSelectedRangeDate) {
      return
    }
    if (date.timestamp < firstSelectedRangeDate.timestamp) {
      rangeDateTemp.value = [date, firstSelectedRangeDate]
    } else {
      rangeDateTemp.value = [firstSelectedRangeDate, date]
    }
  }

  function handleDateSingleSelect(date: Dater) {
    if (panelTypeMatchDateType.value) {
      emit('select:date', date)
    } else {
      updatePanelDate(date)
      switchNextPanel()
    }
  }

  function handleDateSelect(date: Dater) {
    const { range } = props
    if (range) {
      handleDateRangeSelect(date)
    } else {
      handleDateSingleSelect(date)
    }
  }

  return { handleDateSelect, handleDateRangeHover, resetRangeDateTemp, rangeDate }
}
