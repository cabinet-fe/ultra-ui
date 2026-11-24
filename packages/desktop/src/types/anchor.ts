import type { DeconstructValue } from '@veltra/utils'

export interface AnchorProps {
  /**
   * 滚动容器
   * @description
   * CSS 选择器或容器元素（含模板引用初始的 null）；缺省时监听 window 滚动
   */
  container?: string | HTMLElement | null
  /**
   * 定位偏移
   * @description
   * 点击定位与高亮判定统一使用：滚动停止时锚点距容器视口顶部的距离
   * @default 0
   */
  offset?: number
}

export interface AnchorEmits {
  (e: 'change', current: string): void
  /**
   * 锚点项点击（点击后平滑滚动到目标锚点）
   */
  (e: 'click-item', href: string, event: MouseEvent): void
}

export interface AnchorItemProps {
  /**
   * 目标锚点
   * @description
   * `#id` 形式的选择器，需与页内锚点元素对应
   */
  href: string
  title?: string
}

export interface _AnchorExposed {}

/** 锚点导航组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type AnchorExposed = DeconstructValue<_AnchorExposed>
