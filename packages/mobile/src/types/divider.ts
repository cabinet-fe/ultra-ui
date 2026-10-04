/** 分割线组件属性 */
export interface DividerProps {
  /** 方向，水平或垂直，默认 'horizontal' */
  direction?: 'horizontal' | 'vertical'

  /** 是否为虚线，默认 false */
  dashed?: boolean

  /** 嵌套文字的对齐位置，仅水平方向生效，默认 'center' */
  align?: 'left' | 'center' | 'right'
}

/** 分割线组件定义的事件 */
export interface DividerEmits {}
