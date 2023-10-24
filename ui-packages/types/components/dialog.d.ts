/** 对话框组件属性 */
export interface DialogProps {
  modelValue?: boolean
}

/** 对话框组件定义的事件 */
export interface DialogEmits {
  /** 更新对话框的显示 */
  (e: 'update:modelValue', visible: boolean): void
  /** 对话框完全关闭后触发的事件 */
  (e: 'closed'): void
}

/** 对话框组件暴露的属性和方法(组件内部使用) */
export interface _DialogExposed {}

/** 对话框组件暴露的属性和方法(组件外部使用, 引用的值会被自动解构) */
export interface DialogExposed {
  popup: () => {}
}
