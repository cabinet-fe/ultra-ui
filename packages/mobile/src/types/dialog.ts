import type { DeconstructValue } from '@veltra/utils'

export type DialogTransition = 'fade-scale'

/** 对话框正文水平对齐（NutUI 惯例默认居中，表单等场景可切左对齐） */
export type DialogContentAlign = 'left' | 'center' | 'right'

export interface DialogProps {
  modelValue?: boolean
  /** 弹框标题，header的别名 */
  title?: string
  /** 弹框头部内容，别名是header */
  header?: string
  /** 确认按钮文字；传入 #footer 插槽时整个按钮组由插槽接管 */
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  verticalActions?: boolean
  contentAlign?: DialogContentAlign
  modal?: boolean
  fullscreen?: boolean
  /** 弹框过渡动画，默认为 fade-scale */
  transition?: DialogTransition
}

export interface DialogEmits {
  (e: 'update:modelValue', visible: boolean): void
  /** 点击确认按钮（默认随点击关闭） */
  (e: 'confirm'): void
  /** 点击取消按钮（默认随点击关闭） */
  (e: 'cancel'): void
  /** 对话框完全关闭后触发的事件 */
  (e: 'closed'): void
}

export interface _DialogExposed {
  close: () => void
}

/** 组件外部使用, 引用的值会被自动解构 */
export type DialogExposed = DeconstructValue<_DialogExposed>
