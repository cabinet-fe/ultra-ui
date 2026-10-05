import type { ComponentProps, DeconstructValue } from '@veltra/utils'

/** 头像形状：circle 圆形 / round 圆角方形 */
export type AvatarShape = 'circle' | 'round'

/** 头像组件属性 */
export interface AvatarProps extends ComponentProps {
  /**
   * 尺寸档位（继承自 ComponentProps）：small / default / large，
   * 宽高取移动端密度 token `--um-avatar-size-*`（32 / 40 / 48px），默认 default
   */
  size?: ComponentProps['size']

  /** 图片地址；未传或加载失败时回退展示默认插槽内容 */
  src?: string
  /** 图片描述，作为 img 的 alt */
  alt?: string
  /** 形状，默认 circle */
  shape?: AvatarShape
}

/** 头像组件定义的事件 */
export interface AvatarEmits {
  (e: 'error', ev: Event): void
}

/** 头像组件暴露的属性和方法(组件内部使用) */
export interface _AvatarExposed {}

/** 头像组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type AvatarExposed = DeconstructValue<_AvatarExposed>
