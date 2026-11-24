import type { ComponentProps, DeconstructValue } from '@veltra/utils'
import type { Component } from 'vue'

import type { ButtonType } from './button'

export interface FloatButtonItem {
  icon?: Component
  name?: string
  type?: ButtonType
  key: string
}

export interface FloatButtonProps extends ComponentProps {
  items?: FloatButtonItem[]
}

export interface FloatButtonEmits {
  (e: 'click', key: string): void
}

export interface _FloatButtonExposed {}

/** 悬浮按钮组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type FloatButtonExposed = DeconstructValue<_FloatButtonExposed>
