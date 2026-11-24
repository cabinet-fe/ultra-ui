import type { DeconstructValue } from '@veltra/utils'

export interface CssTransitionProps {
  /** 类名称，和vue的transition组件类似 */
  name: string
  active?: boolean
}

export interface CssTransitionEmits {
  (e: 'after-enter'): void
  (e: 'after-leave'): void
  (e: 'leave-canceled'): void
  (e: 'enter-canceled'): void
}

export interface _CssTransitionExposed {
  toggle(active: boolean): void
  toggle(activeAction: (active: boolean) => boolean): void
}

/** 过渡组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CssTransitionExposed = DeconstructValue<_CssTransitionExposed>
