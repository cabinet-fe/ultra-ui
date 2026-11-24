import type { ComputedRef, InjectionKey } from 'vue'

export interface AnchorContext {
  current: ComputedRef<string | undefined>
  /** 点击锚点项（由容器统一滚动定位） */
  click: (href: string, event: MouseEvent) => void
  register: (href: string) => void
  unregister: (href: string) => void
}

export const AnchorDIKey: InjectionKey<AnchorContext> = Symbol('Anchor')
