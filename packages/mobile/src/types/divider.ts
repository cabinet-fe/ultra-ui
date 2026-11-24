export interface DividerProps {
  /** 方向，水平或垂直，默认 'horizontal' */
  direction?: 'horizontal' | 'vertical'

  dashed?: boolean

  /** 嵌套文字的对齐位置，仅水平方向生效，默认 'center' */
  align?: 'left' | 'center' | 'right'
}

export interface DividerEmits {}
