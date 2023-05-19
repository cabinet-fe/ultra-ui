import { ComponentProps } from "shared"

/** 按钮类型 */
type ButtonType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

/** 按钮属性类型 */
export interface ButtonProps extends ComponentProps {
  /** 按钮类型 */
  type?: ButtonType
  /** 是否以文本形式展示 */
  text?: boolean
  /** 是否显示幽灵模式 */
  ghost?: boolean
  /** 加载中 */
  loading?: boolean
  /** 圆形 */
  circle?: boolean
}
