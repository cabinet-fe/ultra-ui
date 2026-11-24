import type { ComponentProps, DeconstructValue } from '@veltra/utils'

/** 头像形状：circle 圆形 / round 圆角方形 */
export type AvatarShape = 'circle' | 'round'

export interface AvatarProps extends ComponentProps {
  /** 图片地址；未传或加载失败时回退展示默认插槽内容 */
  src?: string
  alt?: string
  /** 默认 circle */
  shape?: AvatarShape
}

export interface AvatarEmits {
  (e: 'error', ev: Event): void
}

export interface AvatarGroupProps {
  /** 最多展示的头像个数，超出部分以 +N 形式收起 */
  max?: number
}

export interface _AvatarExposed {}

/** 头像组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type AvatarExposed = DeconstructValue<_AvatarExposed>
