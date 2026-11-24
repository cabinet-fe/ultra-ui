import type { ComponentProps, DeconstructValue } from '@veltra/utils'

/** 头像形状：circle 圆形 / round 圆角方形 */
export type AvatarShape = 'circle' | 'round'

export interface AvatarProps extends ComponentProps {
  /**
   * 尺寸档位（继承自 ComponentProps）：small / default / large，
   * 宽高取移动端密度 token `--um-avatar-size-*`（32 / 40 / 48px），默认 default
   */
  size?: ComponentProps['size']

  /** 图片地址；未传或加载失败时回退展示默认插槽内容 */
  src?: string
  alt?: string
  /** 形状，默认 circle */
  shape?: AvatarShape
}

export interface AvatarEmits {
  (e: 'error', ev: Event): void
}

export interface _AvatarExposed {}

/** 组件外部使用, 引用的值会被自动解构 */
export type AvatarExposed = DeconstructValue<_AvatarExposed>
