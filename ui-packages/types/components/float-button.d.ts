import type { Component } from 'vue'
import type { DeconstructValue } from '../helper'
import type { ComponentProps } from '../component-common'
import type { ButtonType } from './button'

export interface FloatButtonItem {
  /** 一个图标 */
  icon?: Component
  /** 名称 */
  name?: string
  /** 按钮颜色类别 */
  type?: ButtonType
  /** 标识，用来确定唯一性 */
  key: string
}

/** 悬浮按钮组件属性 */
export interface FloatButtonProps extends ComponentProps {
  /** 操作项 */
  items?: FloatButtonItem[]
}

/** 悬浮按钮组件定义的事件 */
export interface FloatButtonEmits {
  (e: 'click', key: string): void
}

/** 悬浮按钮组件暴露的属性和方法(组件内部使用) */
export interface _FloatButtonExposed {}

/** 悬浮按钮组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type FloatButtonExposed = DeconstructValue<_FloatButtonExposed>
