import type { ColorType, ComponentProps, DeconstructValue } from '@veltra/utils'
import type { Component, ShallowRef } from 'vue'

export type ButtonType = ColorType

/**
 * @description 组件不注入默认 `aria-label`：可访问名来自默认插槽文本，
 * 或你自己传入的 `aria-label`（透传到根元素）；只有图标的按钮必须自行传 `aria-label`
 */
export interface ButtonProps extends ComponentProps {
  type?: ButtonType
  text?: boolean
  plain?: boolean
  loading?: boolean
  loadingIcon?: Component
  circle?: boolean
  disabled?: boolean
  icon?: Component
  /** 图标大小, 单位px */
  iconSize?: number
  iconPosition?: 'left' | 'right'
  propagate?: boolean
}

export interface ButtonEmits {
  (name: 'click', e: MouseEvent): void
}

export interface _ButtonExposed {
  el: ShallowRef<HTMLButtonElement | undefined>
}

export type ButtonExposed = DeconstructValue<_ButtonExposed>
