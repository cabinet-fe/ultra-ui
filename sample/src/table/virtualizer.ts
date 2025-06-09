// 高虚拟化器
// 功能：
// 1. 支持数据追加，不重新刷新状态
// 2.

type EstimateSize = (index: number) => number

interface VirtualizerOption {
  /** 长度 */
  length?: number
  /** 缓冲数量 */
  buffer?: number
  /** 推断每项高度 */
  estimateSize?: EstimateSize
}

interface VirtualItem {
  index: number
}

type Updater = (ctx: { items: VirtualItem[]; totalSize: number }) => void

export class Virtualizer {
  private length = 0
  private buffer = 5
  private estimateSize: EstimateSize = () => 36
  private container: HTMLElement | null = null
  private totalSize = 0
  private itemSizeDict: Record<number, number> = {}
  private updater: Updater

  private scrollDistance = 0

  constructor(option?: VirtualizerOption) {
    option && this.setOption(option)
  }

  private handleScroll = (e: Event) => {
    this.scrollDistance = (e.target as HTMLElement).scrollTop
  }

  private getItems(): VirtualItem[] {
    return []
  }

  /** 设置选项 */
  setOption(option: VirtualizerOption): void {
    Object.keys(option).forEach(key => {
      const optionVal = option[key]
      if (optionVal !== undefined) {
        this[key] = option[key]
      }
    })

    this.calcTotalSize()
    this.updater({ items: this.getItems(), totalSize: this.totalSize })
  }

  update(updater: Updater) {
    this.updater = updater
  }

  private calcTotalSize(): void {
    let i = 0
    let totalSize = 0
    while (i < this.length) {
      totalSize += this.estimateSize(i)
      i++
    }
    this.totalSize = totalSize
  }

  /**
   * 更新虚拟项尺寸
   * @param index 元素索引
   * @param size 尺寸
   */
  private updateItemSize(index: number, size: number): void {
    let itemSize = this.itemSizeDict[index]
    if (itemSize === undefined) {
      itemSize = this.estimateSize(index)
    }
    const diff = size - itemSize
    this.itemSizeDict[index] = size
    this.totalSize += diff
  }

  /** 重置虚拟状态 */
  reset() {}

  /**
   * 连接容器，链接
   * @param el 元素
   */
  connect(el: string | HTMLElement): void {
    if (typeof el === 'string') {
      el = document.querySelector(el) as HTMLElement
    }
    if (el) {
      this.destroy()
      this.container = el
    } else {
      console.warn(`container is empty`)
      return
    }

    this.container.addEventListener('scroll', this.handleScroll, {
      passive: true
    })
  }

  /** 销毁 */
  destroy(): void {
    this.container?.removeEventListener('scroll', this.handleScroll)
    this.container = null
  }
}

export class VirtualContainer {
  private x: Virtualizer
  private y: Virtualizer

  private container: HTMLElement | null = null
  private scrollDistance = 0

  constructor(option: { x: Virtualizer; y: Virtualizer }) {
    this.x = option.x
    this.y = option.y
  }

  private handleScroll = (e: Event) => {
    this.scrollDistance = (e.target as HTMLElement).scrollTop
  }

  connect(el: string | HTMLElement): void {
    if (typeof el === 'string') {
      el = document.querySelector(el) as HTMLElement
    }
    if (el) {
      this.container = el
      this.x.connect(el)
    }

    this.container.addEventListener('scroll', this.handleScroll, {
      passive: true
    })
  }
}
