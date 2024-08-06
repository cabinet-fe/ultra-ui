/** 数字组件属性 */
export interface NumberProps {
  /** 数字数值 */
  value: number
  /**
   * 格式化。
   * currency: 货币； percent：百分比; decimal 默认十进制
   */
  format?: 'currency' | 'percent' | 'decimal'
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /**
   * 开启补间动画
   * @default false
   */
  tween?: boolean
  /** 动画持续时间 */
  duration?: number
  /** 精度 */
  precision?: number
}

/** 数字组件定义的事件 */
export interface NumberEmits {}

/** 数字组件暴露的属性和方法 */
export interface NumberExposed {}
