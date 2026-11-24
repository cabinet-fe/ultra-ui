import type { ComponentSize, DeconstructValue } from '@veltra/utils'

export type DialogTransition = 'fade-scale'

export interface DialogProps {
  modelValue?: boolean
  /** 弹框标题，header的别名 */
  title?: string
  /** 弹框头部内容，别名是header */
  header?: string
  size?: ComponentSize
  modal?: boolean
  fullscreen?: boolean
  transition?: DialogTransition
  /** 是否允许按 Esc 关闭弹框，默认 true */
  closeOnEsc?: boolean
  /** 打开时是否锁定 body 滚动，默认 true */
  lockScroll?: boolean
}

export interface DialogEmits {
  (e: 'update:modelValue', visible: boolean): void
  /** 对话框完全关闭后触发的事件 */
  (e: 'closed'): void
}

export interface _DialogExposed {
  close: () => void
}

/** 对话框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DialogExposed = DeconstructValue<_DialogExposed>
