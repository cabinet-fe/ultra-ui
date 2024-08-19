import type { CSSProperties, ShallowRef } from 'vue'
import type { DeconstructValue } from '../helper'

export type ScrollPosition = {
  /** 横向位置 */
  x?: number
  /** 纵向位置 */
  y?: number
}

/** 滚动条组件属性 */
export interface ScrollProps {
  /**
   * 容器元素标签名
   * @default div
   */
  tag?: string
  /**
   * 容器高度
   * @default 100%
   */
  height?: string | number

  /**
   * 总是显示滚动条
   * @default false
   */
  always?: boolean

  /**
   * 内容样式
   */
  contentStyle?: string | CSSProperties

  /**
   * 容器样式
   */
  containerStyle?: string | CSSProperties

  /** 内容类名 */
  contentClass?: string | string[]

  /** 容器类名 */
  containerClass?: string | string[]

  /** 拖拽防抖时间 */
  dragDebounce?: number
}

export interface ScrollEmits {
  /** 滚动事件 */
  (e: 'scroll', position: Required<ScrollPosition>): void
  /** 尺寸调整事件 */
  (e: 'resize', targets: HTMLElement[]): void
}

export interface _ScrollExposed {
  /**
   * 滚动至
   * @param position 位置
   */
  scrollTo(position: ScrollPosition): void

  /**
   * 更新滚动条状态
   */
  update(): void

  /** 滚动内容元素引用 */
  contentRef: ShallowRef<HTMLElement | undefined>

  /** 滚动容器元素引用 */
  containerRef: ShallowRef<HTMLElement | undefined>

  /** 滚动容器元素引用 */
  el: ShallowRef<HTMLElement | undefined>
}

export type ScrollExposed = DeconstructValue<_ScrollExposed>
