import { isRef, watch, type ComputedRef, type ShallowRef } from 'vue'

interface VirtualListOptions<Item> {
  /** 容器 */
  containerRef:
    | ShallowRef<HTMLElement | undefined>
    | ComputedRef<HTMLElement | undefined>
    | HTMLElement

  /** 数据 */
  data: Item[]

  /**
   * 虚拟列表阈值
   * @description 当在滚动阈值内时不再进行虚拟化
   */
  threshold?: number

  /**
   * 单条数据的尺寸
   * @description 用于计算虚拟列表
   */
  itemSize?: number

  /**
   * 滚动方向
   */
  direction?: 'x' | 'y'

  /**
   * 缓冲数据长度
   * @description 使用缓冲数据来防止白屏产生
   */
  bufferSize?: number
}

export class VirtualList<Item> {
  /** 滚动偏移量 */
  #_offset = 0

  get #offset() {
    return this.#_offset
  }
  set #offset(offset: number) {
    this.#_offset = offset
    this.dataChangeHandler?.(this.getVisibleData())
  }

  #_data: Item[] = []

  get #data(): Item[] {
    return this.#_data
  }
  set #data(data: Item[]) {
    this.#_data = data
    this.dataChangeHandler?.(this.getVisibleData())
    this.#offset = 0
  }

  #containerRef: VirtualListOptions<Item>['containerRef']

  #options: Omit<VirtualListOptions<Item>, 'data' | 'containerRef'>

  private dataChangeHandler?: (data: Item[]) => void

  constructor(options: VirtualListOptions<Item>) {
    const { data, containerRef, ...restOptions } = options
    this.#options = restOptions
    this.#containerRef = containerRef

    if (isRef(this.#containerRef)) {
      watch(this.#containerRef, () => {
        this.#offset = 0
        this.dataChangeHandler?.(this.getVisibleData())
      })
    }
  }

  /** 更新数据 */
  update(data: Item[]) {
    this.#data = data
  }

  /**
   * 滚动至
   * @param offset 滚动偏移量
   */
  scrollTo(offset: number) {
    this.#offset = offset
  }

  /** 获取可见数据 */
  getVisibleData(): Item[] {
    const {  direction = 'y' } = this.#options

    const dom = isRef(this.#containerRef)
      ? this.#containerRef.value
      : this.#containerRef

    if (!dom) return []

    const rect = dom.getBoundingClientRect()

    if (direction === 'y') {
      console.log(rect.height)
    }
    return []
  }

  onDataChange(cb: (data: Item[]) => void) {
    this.dataChangeHandler = (data: Item[]) => {
      if (this.#data.length < (this.#options.threshold ?? 200)) return
      cb(data)
    }
  }
}
