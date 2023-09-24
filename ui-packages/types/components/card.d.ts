import type { ComponentProps } from "../component-common"
import type { DeconstructValue } from "../helper"


/** 卡片组件属性 */
export interface CardProps extends ComponentProps {
  /** 宽度 */
  width?: string | number
}

export interface CardActionProps {
  /** 右对齐 */
  alignRight?: boolean
}

export interface CardContentProps {
  /** 封面模式 */
  cover?: boolean
}

export interface CardCoverProps {
  /** 封面图片地址 */
  src: string
  /** 封面高度 */
  height?: string | number
}


export interface CardEmits {

}

export interface _CardExposed {}

export type CardExposed = DeconstructValue<_CardExposed>
