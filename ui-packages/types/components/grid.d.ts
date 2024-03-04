/** 断点名称 */
export type BreakpointName = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface Breakpoint {
  name: BreakpointName
  level: number
}

/** 断点列 */
export interface BreakCols {
  /** 超小尺寸 */
  xs?: number
  /** 小尺寸 */
  sm?: number
  /** 中等尺寸 */
  md?: number
  /** 大尺寸 */
  lg?: number
  /** 中大尺寸 */
  xl?: number
  /** 默认尺寸 */
  default?: number
}

/** 网格布局组件属性 */
export interface GridProps {
  /**
   * 栅格列数, 可传入数字，对象或者函数
   * @default 24
   * @example
   * ```ts
   * // 数字
   * const cols = 12
   * // 对象
   * const cols = {
   *   xs: 12,
   *   sm: 12,
   *   md: 12,
   *   lg: 24,
   *   xl: 24
   * }
   * // 函数
   * const cols = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl', sizeLevel: number) => {
   *   if (sizeLevel < 3) return 12
   *   return 24
   * }
   * ```
   */
  cols?: number | BreakCols | ((breakpoint?: Breakpoint) => number)
  /** 渲染标签 */
  tag?: string
  /** 间隔, 单位px */
  gap?: number
}

/**
 * 网格布局项组件事件
 */
export interface GridEmits {
  /** 尺寸变更 */
  (e: 'resize', rect: DOMRect): void
  /** 断点变更 */
  (e: 'breakpoint-change', breakpoint: Breakpoint): void
}

/** 网格布局项组件属性 */
export interface GridItemProps {
  /** 跨距，当指定为0时，则代表隐藏, 默认为1 */
  span?:
    | number
    | 'full'
    | ({
        [key in BreakpointName]?: 'full' | number
      } & { default: number | 'full' })
  /** 容器标签 */
  tag?: string
}
