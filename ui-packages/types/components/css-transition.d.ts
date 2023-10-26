import type { DeconstructValue } from '../helper'

/** 过渡组件属性 */
export interface CssTransitionProps {
  /** 类名称，和vue的transition组件类似 */
  name: string
  /** 是否激活 */
  active?: boolean
}

/** 过渡组件定义的事件 */
export interface CssTransitionEmits {}

/** 过渡组件暴露的属性和方法(组件内部使用) */
export interface _CssTransitionExposed {
  /**
   * 切换过渡状态
   * @param active 是否激活. true激活，false未激活
   */
  toggle(active: boolean): void
  /**
   * 切换过渡状态
   * @param activeAction 激活函数，通过返回值来确定是否激活
   */
  toggle(activeAction: (active: boolean) => boolean): void
}

/** 过渡组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type CssTransitionExposed = DeconstructValue<_CssTransitionExposed>
