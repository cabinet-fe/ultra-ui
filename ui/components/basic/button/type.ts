import { PropType, ExtractPropTypes } from 'vue'

/** 按钮类型 */
type ButtonType = 'primary' | 'info' | 'success' | 'warning' | 'danger'

/** 按钮属性 */
export const buttonProps = {
  type: {
    type: String as PropType<ButtonType>
  }
}

/** 按钮属性类型 */
export type ButtonProps = ExtractPropTypes<typeof buttonProps>