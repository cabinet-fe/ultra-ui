import type { DeconstructValue } from '../helper'

/** 布局组件属性 */
export interface LayoutProps {
  /**
   * 元素标签
   * @default "div"
   */
  tag?: string
  /** 间距 */
  gap?: number | string
  /**
   * 每个列的布局
   * @example
   * ```ts
   * // 以下都是合法的值
   * const cols = '200px 1fr'
   * const cols = ['200px', '1fr']
   * ```
   * [fr是什么?](https://developer.mozilla.org/zh-CN/docs/Web/CSS/flex_value)
   */
  cols?: string[] | string

  /**
   * 每一行的布局
   * @example
   * ```ts
   * // 以下都是合法的值
   * const rows = '200px 1fr'
   * const rows = ['200px', '1fr']
   * ```
   * [fr是什么?](https://developer.mozilla.org/zh-CN/docs/Web/CSS/flex_value)
   */
  rows?: string[] | string
  /**
   * 尺寸是否可调节
   * @default false
   * @description 注意：当为true时，gap固定且需要有一项宽度为固定像素才能够拖拽
   */
  resizable?: boolean
}

/** 布局组件定义的事件 */
export interface LayoutEmits {}

/** 布局组件暴露的属性和方法(组件内部使用) */
export interface _LayoutExposed {}

/** 布局组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type LayoutExposed = DeconstructValue<_LayoutExposed>
