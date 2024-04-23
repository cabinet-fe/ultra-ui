import type { DatePickerProps } from "@ui/types/components/date-picker"
import type { BEM } from "@ui/utils"
import type { InjectionKey } from "vue"


interface DatePickerContext {
  cls: BEM<'date-picker'>
  datePickerProps: DatePickerProps
}

export const DatePickerDIKey: InjectionKey<DatePickerContext> = Symbol('DatePickerDIKey')