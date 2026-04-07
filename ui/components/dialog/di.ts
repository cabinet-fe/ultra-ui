import type { InjectionKey, ShallowRef } from 'vue'

export interface DialogContext {
  visible: ShallowRef<boolean>
}

export const DialogDIKey: InjectionKey<DialogContext> = Symbol('DialogDIKey')
