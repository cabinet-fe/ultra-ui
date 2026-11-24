import type { ComponentSize } from '@veltra/utils'

export interface SpaceProps {
  /**
   * 间距：档位走主题 gap token（small / default / large）；
   * 数字为固定间距（px）；二元组为 [水平间距, 垂直间距]（px）。默认 'default'
   */
  size?: ComponentSize | number | [number, number]

  /** 默认 'horizontal' */
  direction?: 'horizontal' | 'vertical'

  /** 默认 'center' */
  align?: 'start' | 'center' | 'end' | 'baseline'

  /** 是否自动换行，仅水平方向生效，默认 false */
  wrap?: boolean
}

export interface SpaceEmits {}
