import type { FormComponentProps } from "shared"

/** 选择器组件属性 */
export interface SelectProps extends FormComponentProps {
  /** 是否多选 */
  multiple?: boolean
}
