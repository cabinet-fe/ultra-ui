import type { ColorType, ComponentProps, DeconstructValue } from '@veltra/utils'

/** 徽章组件属性 */
export interface BadgeProps extends ComponentProps {
  /** 显示值 */
  value?: number | string
  /** 类别 */
  type?: ColorType
  /** 自定义背景色 */
  color?: string
  /** 是否隐藏 Badge */
  hidden?: boolean
  /** 最大值 {{max}}+ */
  max?: number
  /** 是否显示小圆点 */
  dot?: boolean
}

/** 徽章组件定义的事件 */
export interface BadgeEmits {
  (e: 'update:modelValue', value: string): void
}

/** 徽章组件暴露的属性和方法(组件内部使用) */
export interface _BadgeExposed {}

/** 徽章组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type BadgeExposed = DeconstructValue<_BadgeExposed>
