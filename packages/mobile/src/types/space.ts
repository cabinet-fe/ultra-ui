import type { ComponentSize } from '@veltra/utils'

/** 间距容器组件属性 */
export interface SpaceProps {
  /**
   * 间距：档位走 `--um-*` 间距刻度 token（small 8px / default 12px / large 16px）；
   * 数字为固定间距（px）；二元组为 [水平间距, 垂直间距]（px）。默认 'default'
   */
  size?: ComponentSize | number | [number, number]

  /** 排列方向，默认 'horizontal' */
  direction?: 'horizontal' | 'vertical'

  /** 交叉轴对齐方式，默认 'center' */
  align?: 'start' | 'center' | 'end' | 'baseline'

  /** 是否自动换行，仅水平方向生效，默认 false */
  wrap?: boolean
}

/** 间距容器组件定义的事件 */
export interface SpaceEmits {}
