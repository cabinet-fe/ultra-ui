// 高虚拟化器
// 功能：
// 1. 支持数据追加，不重新刷新状态
// 2. 高效的虚拟滚动实现

type EstimateSize = (index: number) => number

type VirtualizerChange = (ctx: {
  items: VirtualItem[]
  totalSize: number
}) => void

interface VirtualizerOption {
  /** 长度 */
  length?: number
  /** 缓冲数量 */
  buffer?: number
  /** 推断每项高度 */
  estimateSize?: EstimateSize
  /** 数据变更 */
  onChange?: VirtualizerChange
}

type UpdateOption = Pick<VirtualizerOption, 'length' | 'buffer'> & {
  /** 容器尺寸 */
  containerSize?: number
  /** 偏移量 */
  offsetSize?: number
}

interface VirtualItem {
  index: number
  start: number
  size: number
}

export class Virtualizer {
  private length = 0
  private buffer = 5
  private estimateSize: EstimateSize = () => 36
  private onChange?: VirtualizerChange

  private totalSize = 0
  private itemSizeDict: Record<number, number> = {}
  private itemStartCache: Record<number, number> = {}

  private containerSize = 0
  private offsetSize = 0

  constructor(option: VirtualizerOption) {
    Object.keys(option).forEach(key => {
      const optionVal = option[key]
      if (optionVal !== undefined) {
        this[key] = option[key]
      }
    })

    if (this.length) {
      this.calcTotalSize()
    }
  }

  private getItemSize(index: number): number {
    return this.itemSizeDict[index] ?? this.estimateSize(index)
  }

  private getItemStart(index: number): number {
    if (index === 0) return 0

    // 检查缓存
    if (this.itemStartCache[index] !== undefined) {
      return this.itemStartCache[index]
    }

    let start = 0
    for (let i = 0; i < index; i++) {
      start += this.getItemSize(i)
    }

    // 缓存结果
    this.itemStartCache[index] = start
    return start
  }

  private getItems(): VirtualItem[] {
    const { containerSize, offsetSize, buffer, length } = this

    if (!containerSize || !length) return []

    // 找到开始索引
    let startIndex = 0
    let currentOffset = 0

    for (let i = 0; i < length; i++) {
      const itemSize = this.getItemSize(i)
      if (currentOffset + itemSize > offsetSize) {
        startIndex = Math.max(0, i - buffer)
        break
      }
      currentOffset += itemSize
    }

    // 找到结束索引
    let endIndex = startIndex
    let visibleSize = 0

    for (let i = startIndex; i < length; i++) {
      const itemSize = this.getItemSize(i)
      visibleSize += itemSize
      endIndex = i

      if (visibleSize >= containerSize) {
        // 向下滚动时也添加缓冲
        endIndex = Math.min(length - 1, endIndex + buffer)
        break
      }
    }

    // 生成虚拟项
    const items: VirtualItem[] = []
    for (let i = startIndex; i <= Math.min(endIndex, length - 1); i++) {
      items.push({
        index: i,
        start: this.getItemStart(i),
        size: this.getItemSize(i)
      })
    }

    return items
  }

  /** 更新长度并重新计算尺寸 */
  private updateLength(length: number) {
    this.length = length
    this.calcTotalSize()
  }

  /** 更新选项 */
  update(option: UpdateOption): void {
    const { length, ...rest } = option
    if (length !== undefined) {
      this.updateLength(length)
    }

    Object.keys(rest).forEach(key => {
      const optionVal = rest[key]
      if (optionVal !== undefined) {
        this[key] = optionVal
      }
    })

    this.onChange?.({
      items: this.getItems(),
      totalSize: this.totalSize
    })
  }

  private calcTotalSize(): void {
    let totalSize = 0
    for (let i = 0; i < this.length; i++) {
      totalSize += this.getItemSize(i)
    }
    this.totalSize = totalSize
  }

  /**
   * 更新虚拟项尺寸
   * @param index 元素索引
   * @param size 尺寸
   */
  updateItemSize(index: number, size: number): void {
    const oldSize = this.getItemSize(index)
    const diff = size - oldSize
    this.itemSizeDict[index] = size
    this.totalSize += diff

    // 清除受影响的缓存
    this.clearStartCacheFrom(index + 1)

    // 触发更新
    this.onChange?.({
      items: this.getItems(),
      totalSize: this.totalSize
    })
  }

  private clearStartCacheFrom(index: number): void {
    for (let i = index; i < this.length; i++) {
      delete this.itemStartCache[i]
    }
  }

  /** 重置虚拟状态 */
  reset() {
    this.itemSizeDict = {}
    this.itemStartCache = {}
    this.offsetSize = 0
    this.calcTotalSize()
    this.onChange?.({
      items: this.getItems(),
      totalSize: this.totalSize
    })
  }

  /** 获取总尺寸 */
  getTotalSize(): number {
    return this.totalSize
  }

  /** 获取当前可见项 */
  getVisibleItems(): VirtualItem[] {
    return this.getItems()
  }
}

export class VirtualContainer {
  private horizontal?: Virtualizer
  private vertical?: Virtualizer

  private container: HTMLElement | null = null
  private scrollDistance = 0
  private resizeObserver?: ResizeObserver

  constructor(option?: { horizontal?: Virtualizer; vertical?: Virtualizer }) {
    if (option) {
      Object.keys(option).forEach(key => {
        this[key] = option[key]
      })
    }
  }

  private handleScroll = (e: Event) => {
    const target = e.target as HTMLElement
    this.scrollDistance = target.scrollTop

    // 更新垂直虚拟化器的偏移量
    this.vertical?.update({
      offsetSize: this.scrollDistance
    })

    // 更新水平虚拟化器的偏移量（如果存在）
    if (this.horizontal) {
      this.horizontal.update({
        offsetSize: target.scrollLeft
      })
    }
  }

  private watchContainerSize() {
    if (!this.container) return

    this.resizeObserver = new ResizeObserver(([entry]) => {
      const boxSize = entry?.contentBoxSize?.[0]
      if (!boxSize) return

      this.vertical?.update({
        containerSize: boxSize.blockSize
      })
      this.horizontal?.update({
        containerSize: boxSize.inlineSize
      })
    })

    this.resizeObserver.observe(this.container)
  }

  connect(el: string | HTMLElement): void {
    if (typeof el === 'string') {
      el = document.querySelector(el) as HTMLElement
    }
    if (!el) return

    // 清理之前的连接
    this.disconnect()

    this.container = el

    this.watchContainerSize()

    this.container.addEventListener('scroll', this.handleScroll, {
      passive: true
    })
  }

  disconnect(): void {
    if (this.container) {
      this.container.removeEventListener('scroll', this.handleScroll)
      this.container = null
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = undefined
    }
  }

  /** 滚动到指定位置 */
  scrollTo(offset: number): void {
    if (this.container) {
      this.container.scrollTop = offset
    }
  }

  /** 滚动到指定索引 */
  scrollToIndex(index: number): void {
    if (this.vertical) {
      const items = this.vertical.getVisibleItems()
      const targetItem = items.find(item => item.index === index)
      if (targetItem) {
        this.scrollTo(targetItem.start)
      }
    }
  }
}
