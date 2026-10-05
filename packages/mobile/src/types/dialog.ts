import type { DeconstructValue } from '@veltra/utils'

/** 对话框过渡动画名称 */
export type DialogTransition = 'fade-scale'

/** 对话框正文水平对齐（NutUI 惯例默认居中，表单等场景可切左对齐） */
export type DialogContentAlign = 'left' | 'center' | 'right'

/** 对话框组件属性 */
export interface DialogProps {
  /** 显示或隐藏 */
  modelValue?: boolean
  /** 弹框标题，header的别名 */
  title?: string
  /** 弹框头部内容，别名是header */
  header?: string
  /** 确认按钮文字；传入 #footer 插槽时整个按钮组由插槽接管 */
  confirmText?: string
  /** 取消按钮文字 */
  cancelText?: string
  /** 是否显示取消按钮 */
  showCancel?: boolean
  /** footer 按钮组纵向堆叠（多操作/长文案场景） */
  verticalActions?: boolean
  /** 正文水平对齐 */
  contentAlign?: DialogContentAlign
  /** 显示模态层 */
  modal?: boolean
  /** 全屏 */
  fullscreen?: boolean
  /** 弹框过渡动画，默认为 fade-scale */
  transition?: DialogTransition
}

/** 对话框组件定义的事件 */
export interface DialogEmits {
  /** 更新对话框的显示 */
  (e: 'update:modelValue', visible: boolean): void
  /** 点击确认按钮（默认随点击关闭） */
  (e: 'confirm'): void
  /** 点击取消按钮（默认随点击关闭） */
  (e: 'cancel'): void
  /** 对话框完全关闭后触发的事件 */
  (e: 'closed'): void
}

/** 对话框组件暴露的属性和方法(组件内部使用) */
export interface _DialogExposed {
  /** 关闭对话框 */
  close: () => void
}

/** 对话框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export type DialogExposed = DeconstructValue<_DialogExposed>
