/** 气泡弹框组件属性 */
export type PopupProps = {
  context?: {
    uid: number
    activeUid: number
    instances: Record<
      number,
      {
        hide(): void
      }
    >
  }

  width?: string | number
  height?: string | number
}

/** 弹框组件定义的事件 */
export interface PopupEmits {
  (event: 'update:modelValue', value?: number): void
}

export interface PopConfig {
  x?: number
  y?: number
  trigger?: HTMLElement
}
