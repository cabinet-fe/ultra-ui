export interface DividerProps {
  /** 默认 'horizontal' */
  direction?: 'horizontal' | 'vertical'

  /** 默认 false */
  dashed?: boolean

  /** 嵌套文字的对齐位置，仅水平方向生效，默认 'center' */
  align?: 'left' | 'center' | 'right'
}

export interface DividerEmits {}
