import type { InjectionKey } from 'vue'

export const TipNestDIKey: InjectionKey<() => void> = Symbol('TipNestDIKey')
