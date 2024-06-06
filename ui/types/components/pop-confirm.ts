import type { Component } from 'vue'
import type { DeconstructValue } from '../helper'

/** 气泡确认框组件属性 */
export interface PopConfirmProps {
  /**文字 */
  title?: string
  /**
   * 触发方式
   */
  trigger?: 'hover' | 'click'
  /**icon 图标*/
  icon?: Component
  /**icon 颜色 */
  iconColor?: string
  /**
   * 确认按钮文字
   */
  confirmText?: string
  /**
   * 取消按钮文字
   */
  cancelText?: string
}

/** 气泡确认框组件定义的事件 */
export interface PopConfirmEmits {
  (event: 'confirm'): void
  (event: 'cancel'): void
}

/** 气泡确认框组件暴露的属性和方法(组件内部使用) */
export interface _PopConfirmExposed {}

/** 气泡确认框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type PopConfirmExposed = DeconstructValue<_PopConfirmExposed>
