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
