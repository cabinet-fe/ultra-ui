import type {
  DatePickerEmits,
  DatePickerProps
} from '@ui/types/components/date-picker'
import { bem, type BEM } from '@ui/utils'
import { date, type Dater } from 'cat-kit/fe'
import {
  computed,
  inject,
  provide,
  shallowReactive,
  watch,
  type ComputedRef,
  type InjectionKey
} from 'vue'

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
  /** 组件类 */
  cls: BEM<'date-picker'>
  /** 组件 props */
  pickerProps: DatePickerProps
  /** 组件 emits */
  pickerEmit: DatePickerEmits
  /** 组件状态 */
  state: DatePickerState
  /** 格式化字符串 */
  formatStr: ComputedRef<string>
  /** 关闭下拉框 */
  closeDropdown: () => void
  /** 更新面板 */
  showNextPanel: () => void
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
  /** 更新面板日期 */
  updatePanelDate: () => void
}

const diKey: InjectionKey<DatePickerContext> = Symbol('DatePickerDIKey')

export function useDate(
  type: 'provide',
  config: DateProvideConfig
): DatePickerContext
export function useDate(type: 'inject'): DatePickerContext
export function useDate(
  type: 'provide' | 'inject',
  config?: DateProvideConfig
): DatePickerContext {
  if (type === 'inject') {
    return inject(diKey)!
  }

  const { props, emit, closeDropdown } = config!
  const formats = {
    date: 'yyyy-MM-dd',
    month: 'yyyy-MM',
    year: 'yyyy'
  }
  const formatStr = computed(() => {
    return props.format ?? formats[props.type!]
  })

  const typePanels = {
    date: ['year', 'month', 'day'],
    month: ['year', 'month'],
    year: ['year']
  }

  /** 组件类 */
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
    v => {
      state.date = v ? date(v) : undefined
      updatePanelDate()
    }
  )

  /** 更新展示的面板 */
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

  const ctx: DatePickerContext = {
    cls,
    state,
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
