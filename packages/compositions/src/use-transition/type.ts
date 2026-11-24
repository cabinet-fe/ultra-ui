import type { CSSProperties, Ref, ShallowRef } from 'vue'

export interface TransitionBase {
  target: ShallowRef<HTMLElement | undefined> | HTMLElement
  afterEnter?: () => void
  /** 进入动画被取消回调（css 实现中阶段被打断时由新阶段直接接管，不会触发） */
  enterCanceled?: () => void
  afterLeave?: () => void
  /** 离开动画被取消回调（css 实现中阶段被打断时由新阶段直接接管，不会触发） */
  leaveCanceled?: () => void
}

export interface CssTransitionOptions extends TransitionBase {
  /** 类的名称, 会生成 `${name}-enter-${'to' | 'active' | 'from'}`, `${name}-leave-${'to' | 'active' | 'from'}这几种类` */
  name: ShallowRef<string> | string | Ref<string>
  keepEnterTo?: boolean
}

export interface StyleTransitionOptions extends TransitionBase {
  enterTo: CSSProperties
  enterActive: CSSProperties
  leaveActive: CSSProperties
}

export interface Returned {
  toggle(active: boolean | ((active: boolean) => boolean)): void
  /**
   * 标记进入动画, toggle(true)的别名
   */
  enter(): void
  /**
   * 标记离开动画, toggle(false)的别名
   */
  leave(): void
}
