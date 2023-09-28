/** 数字组件组件属性 */
export interface NumberProps {
  /** 数字数值 */
  value: number
  /** 格式化 */
  format?: 'currency' | 'percent'
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 开启补间动画 */
  tween?: boolean
  /** 精度 */
  precision?: number
}

/** 数字组件组件定义的事件 */
export interface NumberEmits {}

/** 数字组件组件暴露的属性和方法 */
export interface NumberExposed {}
