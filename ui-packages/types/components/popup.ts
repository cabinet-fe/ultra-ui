/** 气泡弹框组件属性 */
export type PopupProps = {
  context?: {
    uid: number;
    activeUid: number;
    instances: Record<number, {
      hide(): void
    }>
  }
}

/** 弹框组件定义的事件 */
export interface PopupEmits {
  (event: 'update:modelValue', value?: number): void
}