import type {
  DatePickerEmits,
  DatePickerProps
} from '@ui/types/components/date-picker'
import { bem, type BEM } from '@ui/utils'
import { date, type Dater } from 'cat-kit/fe'
import { inject, provide, shallowReactive, type InjectionKey } from 'vue'

interface DateProvideConfig {
  props: DatePickerProps
  emit: DatePickerEmits
  closeDropdown: () => void
}

interface DatePickerState {
  panel: 'day' | 'month' | 'year'
  date: Dater
  panelDate: Dater
}

interface DatePickerContext {
  cls: BEM<'date-picker'>
  pickerProps: DatePickerProps
  pickerEmit: DatePickerEmits
  closeDropdown: () => void
  state: DatePickerState
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

  /** 组件类 */
  const cls = bem('date-picker')

  const state = shallowReactive<DatePickerState>({
    panel: 'day',
    date: props.modelValue ? date(props.modelValue) : date(),
    panelDate: date()
  })

  const ctx: DatePickerContext = {
    cls,
    state,
    pickerProps: props,
    pickerEmit: emit,
    closeDropdown
  }

  provide(diKey, ctx)

  return ctx
}
