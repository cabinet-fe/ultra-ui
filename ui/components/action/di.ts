import type { InjectionKey } from 'vue'

export const ActionDIKey: InjectionKey<{
  open(): void
  close(): void
}> = Symbol('ActionDIKey')
