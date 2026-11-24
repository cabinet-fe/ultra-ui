import type { BreakpointName, DeconstructValue } from '@veltra/utils'
import type { ShallowRef } from 'vue'

export interface Breakpoint {
  name: BreakpointName
  level: number
}

export interface BreakCols {
  xs?: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
  default?: number
}

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
  cols?: number | BreakCols | ((breakpoint: Breakpoint) => number)
  tag?: string
  /** 间隔, 为字符串时可以同时指定行间隔和列间隔 */
  gap?: number | string
}

export interface GridEmits {
  (e: 'resize', rect: DOMRect): void
  (e: 'breakpoint-change', breakpoint: Breakpoint): void
}

export interface GridItemProps {
  /** 跨距，当指定为0时，则代表隐藏, 默认为1 */
  span?:
    | number
    | 'full'
    | ({
        [key in BreakpointName]?: 'full' | number
      } & { default: number | 'full' })
  tag?: string
}

export interface _GridExposed {
  el: ShallowRef<HTMLElement | null>
}

/** 网格组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type GridExposed = DeconstructValue<_GridExposed>
