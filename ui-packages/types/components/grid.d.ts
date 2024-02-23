/** 网格布局组件属性 */
export interface GridProps {
  /**
   * 列配置, 如果不指定, 那么列就会基于断点配置自动响应式布局
   * @example 以下都是合法的cols值
   *
   * ```js
   * // 表示2列
   * const cols = 2
   *
   * // 表示2列, 分别为200px宽度, 1fr宽度, 其中fr表示弹性尺寸
   * const cols = "200px 1fr"
   *
   * // 和上面的写法等价
   * const cols= ['200px', '1fr']  和上面的写法等价
   * ```
   */
  cols?: number | string | Array<string>

  /** 渲染标签 */
  tag?: string
  /** 间隔, 单位px */
  gap?: number
}

type GridCols = number | string | Array<string>
interface BreakCols {
  xs?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
}

/**
 * 网格布局项组件事件
 */
export interface GridEmits {
  /** 尺寸变更 */
  (e: 'resize', rect: DOMRect): void
}

/** 网格布局项组件属性 */
export interface GridItemProps {
  /** 跨距，当指定为0时，则代表隐藏, 默认为1 */
  span?: number | 'full'
  /** 容器为xs的跨距 */
  xs?: number | 'full'
  /** 容器为sm的跨距 */
  sm?: number | 'full'
  /** 容器为md的跨距 */
  md?: number | 'full'
  /** 容器为lg的跨距 */
  lg?: number | 'full'
  /** 容器为xl的跨距 */
  xl?: number | 'full'
}
