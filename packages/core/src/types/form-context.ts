import type { ComponentProps } from './component-common'

/** 注入表单上下文的属性（与 FormProps 结构兼容的子集） */
export type FormContextProps = ComponentProps & {
  model?: unknown
  readonly?: boolean
  disabled?: boolean
  labelWidth?: string | number
  noTips?: boolean
  cols?: number
  showInitialData?: boolean
}
