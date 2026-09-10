import type { ColorType, DeconstructValue } from '@veltra/utils'

import type { ButtonProps } from './button'

/** 操作组件属性 */
export interface ActionProps extends ButtonProps {
  /**
   * 是否需要确认：true 时点击只弹确认气泡（UPopConfirm），点气泡里的「确认」才触发 `run`
   * @default false
   * @description 不要在本项的 `run` 回调里再调 `messageConfirm`：`run` 触发时气泡已经确认过一次，
   * 会变成两次确认。需要弹窗级确认时去掉 `needConfirm`，只在 `run` 里用 `messageConfirm`
   */
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
