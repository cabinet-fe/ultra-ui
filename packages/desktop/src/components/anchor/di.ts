import type { ComputedRef, InjectionKey } from 'vue'

/** 锚点导航父子上下文 */
export interface AnchorContext {
  /** 当前高亮锚点 */
  current: ComputedRef<string | undefined>
  /** 点击锚点项（由容器统一滚动定位） */
  click: (href: string, event: MouseEvent) => void
  /** 注册锚点项 */
  register: (href: string) => void
  /** 注销锚点项 */
  unregister: (href: string) => void
}

export const AnchorDIKey: InjectionKey<AnchorContext> = Symbol('Anchor')
