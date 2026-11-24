import type { ComponentProps, DeconstructValue } from '@veltra/utils'

export interface CardProps extends ComponentProps {
  width?: string | number

  /** 融合样式，卡片不再有阴影 */
  integrate?: boolean
}

export interface CardEmits {}

export interface _CardExposed {}

export type CardExposed = DeconstructValue<_CardExposed>
