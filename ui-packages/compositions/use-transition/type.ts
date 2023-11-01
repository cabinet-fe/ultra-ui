import type { CSSProperties, Ref, ShallowRef } from "vue"

export interface TransitionBase {
  /** 被应用的目标元素 */
  target: ShallowRef<HTMLElement | undefined> | HTMLElement
  /** 进入动画结束 */
  afterEnter?: () => void
  /** 进入动画被取消 */
  enterCanceled?: () => void
  /** 离开动画结束 */
  afterLeave?: () => void
  /** 离开动画被取消 */
  leaveCanceled?: () => void
}

export interface CssTransitionOptions extends TransitionBase {
  /** 类的名称 */
  name: ShallowRef<string> | string | Ref<string>
}

export interface StyleTransitionOptions extends TransitionBase {
  /** 进入后的样式 */
  enterToStyle: CSSProperties
  /** 进入过渡时的样式 */
  transitionInStyle: CSSProperties
  /** 离开过渡时的样式 */
  transitionOutStyle: CSSProperties
}


export interface Returned {
  /**
   * 切换进入/离开动画
   * @param active 是否激活
   */
  toggle(active: boolean | ((active: boolean) => boolean)): void
}