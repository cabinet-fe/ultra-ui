import type { ComponentSize, DeconstructValue } from '@veltra/utils'

/** 面包屑单项 */
export interface BreadcrumbItem {
  /** 展示文案 */
  title: string
  /** 存在时渲染为 `<a>`，由浏览器处理导航 */
  href?: string
  /** 为 true 时不跳转、不触发 click */
  disabled?: boolean
}

/** 面包屑组件属性 */
export interface BreadcrumbProps {
  /** 路径项，顺序为从一级到末级 */
  items: BreadcrumbItem[]
  /** 尺寸 */
  size?: ComponentSize
  /**
   * 末级是否作为链接渲染
   * @default false — 末级为当前页，使用 `aria-current="page"`
   */
  lastLinked?: boolean
}

/** `item` 插槽作用域 */
export interface BreadcrumbSlotScope {
  item: BreadcrumbItem
  index: number
  isLast: boolean
}

/** 面包屑组件事件 */
export interface BreadcrumbEmits {
  /**
   * 可交互项（无 `href` 的链式项）被点击时触发；有 `href` 时不触发（走原生导航）
   */
  (e: 'click', item: BreadcrumbItem, index: number, ev: Event): void
}

/** @internal */
export interface _BreadcrumbExposed {}

export type BreadcrumbExposed = DeconstructValue<_BreadcrumbExposed>
