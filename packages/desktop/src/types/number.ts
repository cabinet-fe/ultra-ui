export interface NumberProps {
  value: number
  /**
   * 格式化。
   * currency: 货币； percent：百分比; decimal 默认十进制
   */
  format?: 'currency' | 'percent' | 'decimal'
  align?: 'left' | 'center' | 'right'
  /**
   * @default false
   */
  tween?: boolean
  duration?: number
  precision?: number
  maxPrecision?: number
  minPrecision?: number
}

export interface NumberEmits {}

export interface NumberExposed {}
