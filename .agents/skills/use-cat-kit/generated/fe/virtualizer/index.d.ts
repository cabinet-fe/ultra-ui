//#region src/virtualizer/index.d.ts
type EstimateSize = (index: number) => number;
type VirtualizerChange = (ctx: {
  items: VirtualItem[];
  totalSize: number;
}) => void;
interface VirtualizerOption {
  /** 长度 */
  length?: number;
  /** 缓冲数量 */
  buffer?: number;
  /** 推断每项高度 */
  estimateSize?: EstimateSize;
  /** 数据变更 */
  onChange?: VirtualizerChange;
}
type UpdateOption = Pick<VirtualizerOption, 'length' | 'buffer'> & {
  /** 容器尺寸 */containerSize?: number; /** 偏移量 */
  offsetSize?: number;
};
interface VirtualItem {
  index: number;
  start: number;
  size: number;
}
declare class Virtualizer {
  private length;
  private buffer;
  private estimateSize;
  private onChange?;
  private totalSize;
  private itemSizeDict;
  private itemStartCache;
  private containerSize;
  private offsetSize;
  constructor(option: VirtualizerOption);
  private getItemSize;
  private getItemStart;
  private getItems;
  /** 更新长度并重新计算尺寸 */
  private updateLength;
  /** 更新选项 */
  update(option: UpdateOption): void;
  private calcTotalSize;
  /**
   * 更新虚拟项尺寸
   * @param index 元素索引
   * @param size 尺寸
   */
  updateItemSize(index: number, size: number): void;
  private clearStartCacheFrom;
  /** 重置虚拟状态 */
  reset(): void;
  /** 获取总尺寸 */
  getTotalSize(): number;
  /** 获取当前可见项 */
  getVisibleItems(): VirtualItem[];
}
declare class VirtualContainer {
  private horizontal?;
  private vertical?;
  private container;
  private scrollDistance;
  private resizeObserver?;
  constructor(option?: {
    horizontal?: Virtualizer;
    vertical?: Virtualizer;
  });
  private handleScroll;
  private watchContainerSize;
  connect(el: string | HTMLElement): void;
  disconnect(): void;
  /** 滚动到指定位置 */
  scrollTo(offset: number): void;
  /** 滚动到指定索引 */
  scrollToIndex(index: number): void;
}
//#endregion
export { VirtualContainer, Virtualizer };
//# sourceMappingURL=index.d.ts.map