import type { DatePanelEmits, DatePanelProps, PanelType } from '@ui/types'
import { bem } from '@ui/utils'
import { provide, shallowRef, watch } from 'vue'
import { DatePanelDIKey } from './di'
import { usePanelDate } from './use-panel-date'
import { useDateSelect } from './use-date-select'

interface PanelOptions {
  props: DatePanelProps
  emit: DatePanelEmits
}

export function usePanel(options: PanelOptions) {
  const { props, emit } = options

  /** 组件类 */
  const cls = bem('date-panel')

  /** 当前面板类型 */
  const panelType = shallowRef<PanelType>('day')

  watch(
    () => props.type,
    type => {
      if (type === 'date') {
        panelType.value = 'day'
      } else if (type === 'month') {
        panelType.value = 'month'
      } else if (type === 'year') {
        panelType.value = 'year'
      }
    },
    { immediate: true }
  )

  const { panelDate, updatePanelDate, ...panelDateRest } = usePanelDate({
    props
  })

  const { handleDateSelect, handleDateRangeHover, rangeDate } = useDateSelect({
    props,
    emit,
    panelType,
    updatePanelDate
  })

  provide(DatePanelDIKey, {
    cls,

    panelProps: props,
    panelEmit: emit,

    panelType,
    panelDate,

    rangeDate,

    ...panelDateRest,

    handleDateSelect,
    handleDateRangeHover
  })

  return {
    cls,
    panelType,
    panelDate
  }
}
