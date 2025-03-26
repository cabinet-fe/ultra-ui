import type { DatePanelProps, PanelType, DatePanelEmits } from '@ui/types'
import type { Dater } from 'cat-kit/fe'
import { type Ref, computed, shallowRef } from 'vue'

interface DateSelectOptions {
  props: DatePanelProps
  emit: DatePanelEmits
  panelType: Ref<PanelType>
  updatePanelDate: (date: Dater) => void
}

export function useDateSelect(options: DateSelectOptions) {
  const { props, panelType, emit, updatePanelDate } = options

  /** 面板顺序 */
  const panelSequence: PanelType[] = ['year', 'month', 'day']

  const typeMapToPanelType = {
    year: 'year',
    month: 'month',
    date: 'day'
  }

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

  /** 面板类型是否匹配日期类型 */
  const panelTypeMatchDateType = computed(() => {
    const { type } = props
    return typeMapToPanelType[type!] === panelType.value
  })

  /** 切换到下一个面板 */
  function switchNextPanel() {
    const index = panelSequence.indexOf(panelType.value)
    if (index === -1) return
    panelType.value = panelSequence[index + 1]!
  }

  /** 选择日期范围 */
  function handleDateRangeSelect(date: Dater) {
    if (panelTypeMatchDateType.value) {
      // 第一次选择
      if (!firstSelectedRangeDate) {
        firstSelectedRangeDate = date
        rangeDateTemp.value = [date, date]
      }
      // 第二次选择范围日期
      else {
        if (date.timestamp < firstSelectedRangeDate.timestamp) {
          rangeDateTemp.value = [date, firstSelectedRangeDate]
        } else {
          rangeDateTemp.value = [firstSelectedRangeDate, date]
        }
        emit('select:range-date', rangeDateTemp.value)

        // 选择完成, 清空临时日期范围
        resetRangeDateTemp()
      }
    } else {
      updatePanelDate(date)
      switchNextPanel()
    }
  }

  /** 范围日期悬停 */
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
    // 类型匹配则触发数据更新

    if (panelTypeMatchDateType.value) {
      emit('select:date', date)
    } else {
      updatePanelDate(date)
      switchNextPanel()
    }
  }

  /** 选择日期 */
  function handleDateSelect(date: Dater) {
    const { range } = props
    if (range) {
      handleDateRangeSelect(date)
    } else {
      handleDateSingleSelect(date)
    }
  }

  return {
    handleDateSelect,
    handleDateRangeHover,
    resetRangeDateTemp,
    rangeDate
  }
}
