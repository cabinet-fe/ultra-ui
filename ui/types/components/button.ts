import type { ColorType, ComponentProps } from '../component-common'
import type { Component, ShallowRef } from 'vue'
import type { DeconstructValue } from '../helper'

/** 按钮类型 */
export type ButtonType = ColorType

/** 按钮属性类型 */
export interface ButtonProps extends ComponentProps {
  /** 按钮类型 */
  type?: ButtonType
  /** 是否以文本形式展示 */
  text?: boolean
  /** 朴素模式 */
  plain?: boolean
  /** 加载中 */
  loading?: boolean
  /** 加载图标 */
  loadingIcon?: Component
  /** 圆形 */
  circle?: boolean
  /** 禁用 */
  disabled?: boolean
  /** 图标 */
  icon?: Component
  /** 图标大小, 单位px */
  iconSize?: number
  /** 图标位置 */
  iconPosition?: 'left' | 'right'
}

export interface ButtonEmits {
  /** 点击事件 */
  (name: 'click', e: MouseEvent): void
}

/** 在组件内部引用 */
export interface _ButtonExposed {
  el: ShallowRef<HTMLButtonElement | undefined>
}

/** 按钮暴露的属性和方法 */
export type ButtonExposed = DeconstructValue<_ButtonExposed>
