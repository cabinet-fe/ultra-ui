import type { Component } from 'vue'
import type { DeconstructValue } from '../helper'

export interface FloatButtonItem {
  /** 一个图标 */
  icon?: Component
  /** 颜色 */
  color?: string
  /** 标识，用来决定唯一性 */
  key: string
}

/** 悬浮按钮组件属性 */
export interface FloatButtonProps {
  /** 图标 */
  icon?: Component

  /** 操作项 */
  items?: FloatButtonItem[]
}

/** 悬浮按钮组件定义的事件 */
export interface FloatButtonEmits {}

/** 悬浮按钮组件暴露的属性和方法(组件内部使用) */
export interface _FloatButtonExposed {}

/** 悬浮按钮组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type FloatButtonExposed = DeconstructValue<_FloatButtonExposed>
