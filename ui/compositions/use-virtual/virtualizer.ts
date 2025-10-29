// 虚拟化器
// 基础功能:
// 1. 支持对大列表进行虚拟化
// 亮点功能：
// 1. 支持数据追加，不重新刷新状态
// 2. 高效的虚拟滚动实现

type EstimateSize = (index: number) => number;

interface VirtualizerOptions {
  /**
   * 列表长度
   * @default 0
   */
  length?: number;
  /**
   * 缓冲数量
   * @default 3
   */
  buffer?: number;
  /**
   * 推断每项高度
   * @default () => 36
   */
  estimateSize?: EstimateSize;
  /**
   * 滚动方向
   * @default "vertical"
   */
  direction?: "vertical" | "horizontal";
}

interface VirtualItem {
  /** 索引 */
  index: number;
  /** 偏移量 */
  offset: number;
  /** 高度 */
  size: number;
}

interface VirtualizerEvents {
  /** 更新事件 */
  update: (ctx: { items: VirtualItem[]; totalSize: number }) => void;
}

export class Virtualizer {
  private options: Required<VirtualizerOptions> = {
    length: 0,
    buffer: 3,
    estimateSize: () => 36,
    direction: "vertical",
  };

  private container: HTMLElement | null = null;

  /** 事件 */
  private events: Partial<VirtualizerEvents> = {};
  /** 总尺寸 */
  private totalSize = 0;
  /** 对应索引的元素的大小缓存 */
  private itemSizeCache: Record<number, number> = {};

  resizeObserver: ResizeObserver | null = null;

  /** 容器大小 */
  private containerSize = 0;
  /** 当前偏移量 */
  private offsetSize = 0;

  verticalScrollHandler = (event: Event) => {
    const { scrollTop } = event.target as HTMLElement;
    this.offsetSize = scrollTop;
  };

  horizontalScrollHandler = (event: Event) => {
    const { scrollLeft } = event.target as HTMLElement;
    this.offsetSize = scrollLeft;
  };

  constructor(
    updateCallback: VirtualizerEvents["update"],
    options?: VirtualizerOptions,
  ) {
    this.events.update = updateCallback;
    options && this.setOptions(options);
  }

  private getItemSize(index: number): number {
    return this.itemSizeCache[index] ?? this.options.estimateSize(index);
  }

  /**
   * 获取元素的偏移量
   * @param index 元素索引
   * @returns 元素的偏移量
   */
  private getItemOffset(index: number): number {}

  private getItems(): VirtualItem[] {
    const { containerSize, offsetSize } = this;
    const { length, buffer } = this.options;

    if (!containerSize || !length) return [];

    // 找到开始索引
    let startIndex = 0;
    let currentOffset = 0;

    for (let i = 0; i < length; i++) {
      const itemSize = this.getItemSize(i);
      if (currentOffset + itemSize > offsetSize) {
        startIndex = Math.max(0, i - buffer);
        break;
      }
      currentOffset += itemSize;
    }

    // 找到结束索引
    let endIndex = startIndex;
    let visibleSize = 0;

    for (let i = startIndex; i < length; i++) {
      const itemSize = this.getItemSize(i);
      visibleSize += itemSize;
      endIndex = i;

      if (visibleSize >= containerSize) {
        // 向下滚动时也添加缓冲
        endIndex = Math.min(length - 1, endIndex + buffer);
        break;
      }
    }

    // 生成虚拟项
    const items: VirtualItem[] = [];
    for (let i = startIndex; i <= Math.min(endIndex, length - 1); i++) {
      items.push({
        index: i,
        size: this.getItemSize(i),
        offset: this.getItemOffset(i),
      });
    }

    return items;
  }

  /** 更新选项 */
  setOptions(options: VirtualizerOptions): void {
    Object.keys(options).forEach((key) => {
      const optionVal = options[key];
      if (optionVal !== undefined) {
        this.options[key] = optionVal;
      }
    });
  }

  private calcTotalSize(): void {
    let totalSize = 0;
    const { length } = this.options;
    for (let i = 0; i < length; i++) {
      totalSize += this.getItemSize(i);
    }
    this.totalSize = totalSize;
  }

  /**
   * 更新虚拟项尺寸
   * @param index 元素索引
   * @param size 尺寸
   */
  updateItemSize(index: number, size: number): void {
    const oldSize = this.getItemSize(index);
    const diff = size - oldSize;
    this.itemSizeCache[index] = size;
    this.totalSize += diff;
  }

  /** 重置虚拟状态 */
  reset() {
    this.itemSizeCache = {};
    this.offsetSize = 0;
    this.calcTotalSize();
  }

  /** 获取总尺寸 */
  getTotalSize(): number {
    return this.totalSize;
  }

  connect(el: string | HTMLElement) {
    if (typeof el === "string") {
      el = document.querySelector<HTMLElement>(el)!;
    }
    if (!el) {
      throw new Error("Element not found");
    }
    this.disconnect();
    this.container = el;
    this.container.addEventListener(
      "scroll",
      this.options.direction === "vertical"
        ? this.verticalScrollHandler
        : this.horizontalScrollHandler,
      {
        passive: true,
      },
    );
    this.resizeObserver = new ResizeObserver(() => {
      this.calcTotalSize();
    });
    this.resizeObserver.observe(el);
  }

  disconnect() {
    this.container?.removeEventListener(
      "scroll",
      this.options.direction === "vertical"
        ? this.verticalScrollHandler
        : this.horizontalScrollHandler,
    );
    this.resizeObserver?.disconnect();
    this.container = null;
    this.resizeObserver = null;
  }

  /** 获取当前可见项 */
  getVisibleItems(): VirtualItem[] {
    return this.getItems();
  }

  scrollTo(offset: number) {}

  scrollToIndex(index: number) {}
}

const v = new Virtualizer(({ items, totalSize }) => {
  console.log("totalSize", totalSize);
  console.log("items", items);
});

v.connect(document.body);

// 模拟请求
setTimeout(() => {
  v.setOptions({
    length: 3000,
  });
}, 300);
