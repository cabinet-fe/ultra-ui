/** 气泡弹框组件属性 */
export type PopupProps = {
  /** 弹框的可见性 */
  visible?: boolean
  /** 是否显示箭头 */
  arrow?: boolean

  width?: string | number
  height?: string | number
}

/** 弹框组件定义的事件 */
export interface PopupEmits {
  (event: 'update:visible', visible: boolean): void
}

export interface PopConfig {
  x?: number
  y?: number
  trigger?: HTMLElement
}
