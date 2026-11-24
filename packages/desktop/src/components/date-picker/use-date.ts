import { date, type Dater } from '@cat-kit/core'
import { bem, type BEM } from '@veltra/utils'
import {
  computed,
  inject,
  provide,
  shallowReactive,
  watch,
  type ComputedRef,
  type InjectionKey
} from 'vue'

import type { DatePickerEmits, DatePickerProps } from '../../types'

interface DateProvideConfig {
  props: DatePickerProps
  emit: DatePickerEmits
  closeDropdown: () => void
}

interface DatePickerState {
  panel: 'day' | 'month' | 'year'
  date?: Dater
  panelDate: Dater
}

interface DatePickerContext {
  cls: BEM<'date-picker'>
  pickerProps: DatePickerProps
  pickerEmit: DatePickerEmits
  state: DatePickerState
  formatStr: ComputedRef<string>
  displayedValue: ComputedRef<string>
  closeDropdown: () => void
  showNextPanel: () => void
  handlePreYear: () => void
  handlePreMonth: () => void
  handleNextYear: () => void
  handleNextMonth: () => void
  handleNextTenYears: () => void
  handlePreTenYears: () => void
  updatePanelDate: () => void
}

const diKey: InjectionKey<DatePickerContext> = Symbol('DatePickerDIKey')

export function useDate(type: 'provide', config: DateProvideConfig): DatePickerContext
export function useDate(type: 'inject'): DatePickerContext
export function useDate(type: 'provide' | 'inject', config?: DateProvideConfig): DatePickerContext {
  if (type === 'inject') {
    return inject(diKey)!
  }

  const { props, emit, closeDropdown } = config!
  const formats = { date: 'yyyy-MM-dd', month: 'yyyy-MM', year: 'yyyy' }
  const formatStr = computed(() => {
    return props.format ?? formats[props.type!]
  })

  const typePanels = { date: ['year', 'month', 'day'], month: ['year', 'month'], year: ['year'] }

  const cls = bem('date-picker')

  const currentDate = props.modelValue ? date(props.modelValue) : undefined
  const state = shallowReactive<DatePickerState>({
    panel: 'day',
    date: currentDate,
    panelDate: date(currentDate?.timestamp ?? new Date())
  })

  function updatePanelDate() {
    state.panelDate = date(state.date?.timestamp ?? new Date())
    const panels = typePanels[props.type!]
    state.panel = panels[panels.length - 1] as 'day' | 'month' | 'year'
  }

  watch(
    () => props.modelValue,
    (v) => {
      state.date = v ? date(v) : undefined
      updatePanelDate()
    }
  )

  function showNextPanel() {
    const panels = typePanels[props.type!]
    const index = panels.indexOf(state.panel)
    if (index === -1) {
      state.panel = panels[panels.length - 1] as 'day' | 'month' | 'year'
    } else if (index < panels.length - 1) {
      state.panel = panels[index + 1] as 'day' | 'month' | 'year'
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
    state.panelDate = state.panelDate.calc(-1, 'years')
  }

  function handlePreMonth() {
    state.panelDate = state.panelDate.calc(-1, 'months')
  }

  function handleNextYear() {
    state.panelDate = state.panelDate.calc(1, 'years')
  }

  function handleNextMonth() {
    state.panelDate = state.panelDate.calc(1, 'months')
  }

  function handlePreTenYears() {
    state.panelDate = state.panelDate.calc(-10, 'years')
  }

  function handleNextTenYears() {
    state.panelDate = state.panelDate.calc(10, 'years')
  }

  const displayedValue = computed(() => {
    return state.date?.format(formatStr.value) ?? ''
  })

  const ctx: DatePickerContext = {
    cls,
    state,
    displayedValue,
    pickerProps: props,
    pickerEmit: emit,
    formatStr,
    closeDropdown,
    showNextPanel,
    handlePreYear,
    handlePreMonth,
    handleNextYear,
    handleNextMonth,
    handleNextTenYears,
    handlePreTenYears,
    updatePanelDate
  }

  provide(diKey, ctx)

  return ctx
}
