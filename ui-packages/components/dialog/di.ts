import type { BEM } from "@ui/utils"
import type { InjectionKey } from "vue"
import type { DialogProps } from "@ui/types/components/dialog"

export interface DialogContext {
  cls: BEM<'dialog'>
  dialogProps: DialogProps
}

export const DialogDIKey: InjectionKey<DialogContext> = Symbol('DialogDIKey')