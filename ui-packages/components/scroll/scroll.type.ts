/** 滚动条组件属性 */
export type ScrollProps = {
  /**
   * 容器元素标签名
   * @default div
   */
  tag?: string
  /**
   * 容器高度
   * @default 100%
   */
  height?: string | number
}

export type ScrollPosition = {
  /** 横向位置 */
  x?: number;
  /** 纵向位置 */
  y?: number;
}

export interface ScrollExposed {
  /**
   * 滚动至
   * @param position 位置
   */
  scrollTo(position: ScrollPosition): void
}