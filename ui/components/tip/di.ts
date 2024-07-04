import type { InjectionKey, ShallowRef } from 'vue'

export const TipNestDIKey: InjectionKey<{
  addChild(visible: ShallowRef<boolean>): void
  removeChild(visible: ShallowRef<boolean>): void
}> = Symbol('TipNestDIKey')
