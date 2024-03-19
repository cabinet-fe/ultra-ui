import type { CSSProperties, Ref, ShallowRef } from 'vue'

export interface TransitionBase {
  /** 被应用的目标元素 */
  target: ShallowRef<HTMLElement | undefined> | HTMLElement
  /** 进入动画结束回调 */
  afterEnter?: () => void
  /** 进入动画被取消回调 */
  enterCanceled?: () => void
  /** 离开动画结束回调 */
  afterLeave?: () => void
  /** 离开动画被取消回调 */
  leaveCanceled?: () => void
}

export interface CssTransitionOptions extends TransitionBase {
  /** 类的名称, 会生成 `${name}-enter-to`, `${name}-enter-active`, `${name}-leave-active这几种类` */
  name: ShallowRef<string> | string | Ref<string>
}

export interface StyleTransitionOptions extends TransitionBase {
  // /** 动画进入前的样式 */
  // enterFrom?: CSSProperties
  // /** 动画离开后的样式 */
  // leaveTo?: CSSProperties
  /** 进入后的样式 */
  enterTo: CSSProperties
  /** 进入过渡时的样式 */
  enterActive: CSSProperties
  /** 离开过渡时的样式 */
  leaveActive: CSSProperties
}

export interface Returned {
  /**
   * 切换进入/离开动画
   * @param active 是否激活
   */
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
