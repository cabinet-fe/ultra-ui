import { ComponentProps } from '@ui/shared'
import { DeconstructValue } from '@ui/utils'

/** 卡片组件属性 */
export interface CardProps extends ComponentProps {
  /** 阴影 */
  shadow?: 'none' | 'always' | 'hover'
  /** 边框 */
  border?: boolean
  /** 宽度 */
  width?: string | number
}

export interface CardEmits {}

export interface _CardExposed {}

export type CardExposed = DeconstructValue<_CardExposed>
