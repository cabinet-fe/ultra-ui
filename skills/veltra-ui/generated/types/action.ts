import type { ColorType, DeconstructValue } from '@veltra/utils'

import type { ButtonProps } from './button'

/** 操作组件属性 */
export interface ActionProps extends ButtonProps {
  /** 是否需要确认 */
  needConfirm?: boolean

  /**
   * 是否始终位于下拉菜单中，无视 `max` 限制
   * @default false
   */
  inDropdown?: boolean
}

/** 操作组组件属性 */
export interface ActionGroupProps {
  /** 是否加载中 */
  loading?: boolean
  /**
   * 是否为圆形按钮，适用于图标类。`hover` 模式下默认对所有子项生效
   * @default false
   */
  circle?: boolean

  /**
   * 最大可显示按钮数量，超出部分自动收纳到下拉菜单
   * @default 3
   */
  max?: number

  /**
   * 子项默认尺寸
   * @default 'small'
   */
  size?: 'small' | 'default' | 'large'

  /**
   * 子项默认是否使用文本样式
   * @default true
   */
  text?: boolean

  /**
   * 子项默认按钮类型
   * @default 'primary'
   */
  type?: ColorType
}

/** 操作组件定义的事件 */
export interface ActionEmits {
  (e: 'run'): void
}

/** 操作组件暴露的属性和方法(组件内部使用) */
export interface _ActionExposed {}

export interface _ActionGroupExposed {
  closeTip: () => void
}

/** 操作组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type ActionExposed = DeconstructValue<_ActionExposed>

export type ActionGroupExposed = DeconstructValue<_ActionGroupExposed>
