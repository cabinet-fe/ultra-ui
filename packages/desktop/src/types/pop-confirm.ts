import type { DeconstructValue } from '@veltra/utils'
import type { Component } from 'vue'

import type { TipProps } from './tip'

export interface PopConfirmProps extends Pick<
  TipProps,
  'alignment' | 'direction' | 'trigger' | 'contentTag'
> {
  title?: string
  icon?: Component
  iconColor?: string
  confirmText?: string
  cancelText?: string
}

export interface PopConfirmEmits {
  (event: 'confirm'): void
  (event: 'cancel'): void
}

export interface _PopConfirmExposed {}

/** 气泡确认框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PopConfirmExposed = DeconstructValue<_PopConfirmExposed>
