import type { DeconstructValue } from '@veltra/utils'

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
  /**
   * 每列的最小宽度（px），按列索引与 cols 对应，仅 resizable 拖拽时生效。
   * 未指定的列不限制（可被压至 0）。
   * @example
   * ```ts
   * // 三栏拖拽时，左栏不小于 120px，右栏不小于 200px
   * :cols="['1fr', '2fr', '300px']" :col-min-sizes="[120, undefined, 200]"
   * ```
   */
  colMinSizes?: (number | undefined)[]
}

/** 布局组件定义的事件 */
export interface LayoutEmits {
  /** 开始拖拽调节某条间隔（index 为间隔左侧列的索引） */
  (e: 'resize-start', index: number): void
  /** 拖拽调节结束 */
  (e: 'resize-end', index: number): void
}

/** 布局组件暴露的属性和方法(组件内部使用) */
export interface _LayoutExposed {}

/** 布局组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type LayoutExposed = DeconstructValue<_LayoutExposed>
