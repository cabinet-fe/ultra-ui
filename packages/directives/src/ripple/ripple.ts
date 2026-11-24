import { bem, nextFrame, setStyles, type BEM } from '@veltra/utils'
import type { CSSProperties } from 'vue'

type MouseOrTouchEvent = MouseEvent | Touch

interface RipplePosition {
  x: number
  y: number
}

interface RippleConfig {
  rippleClass?: string
  duration?: number
  autoRemove?: boolean
}

const PositionKey = 'uRipplePosition'
const CountKey = 'uRippleActiveCount'

const LayerClass = bem('ripple').e('layer')

/**
 * 样式管理策略：
 * - 波纹统一渲染在内部波纹层 `.u-ripple__layer` 中，由层负责裁剪与定位，宿主不再需要 overflow: hidden
 * - 只在容器 position 为 static 时设置 relative，作为波纹层的包含块，不改变布局尺寸
 * - 使用 dataset 做引用计数，多实例可安全协作
 * - 最后一个波纹移除时，移除波纹层并精确恢复容器样式
 */
export class Ripple {
  static cls: BEM<'ripple'> = bem('ripple')

  private container: HTMLElement
  private containerRect?: DOMRect

  private currentRippleEl?: HTMLElement

  private config?: RippleConfig

  constructor(container: HTMLElement, config?: RippleConfig) {
    this.container = container
    if (config) {
      this.config = config
    }
  }

  getContainer(): HTMLElement {
    return this.container
  }

  private getContainerRect(): DOMRect {
    const rect = this.container.getBoundingClientRect()
    this.containerRect = rect
    return this.containerRect
  }

  /**
   * 只查找直接子级，避免嵌套的波纹容器层被误取
   */
  private getLayer(): HTMLElement | null {
    return this.container.querySelector<HTMLElement>(`:scope > .${LayerClass}`)
  }

  private getOrCreateLayer(): HTMLElement {
    const layer = this.getLayer()
    if (layer) return layer

    const el = document.createElement('span')
    el.classList.add(LayerClass)
    this.container.appendChild(el)
    return el
  }

  private getRippleCenterPosition(e: MouseOrTouchEvent): { x: number; y: number } {
    const { left, top } = this.getContainerRect()
    const { clientX, clientY } = e
    return { x: clientX - left, y: clientY - top }
  }

  private markTransitionEnd(el: HTMLElement) {
    el.dataset.transitionend = 'true'
  }

  private markRemovable(el: HTMLElement) {
    el.dataset.removable = 'true'
  }

  /**
   * 根据点击位置计算能覆盖整个容器的最小半径
   */
  private calcRippleRadius(centerPosition: RipplePosition) {
    const { x, y } = centerPosition
    const { width, height } = this.getContainerRect()
    const edgeA = Math.max(x, width - x)
    const edgeB = Math.max(y, height - y)
    return Math.ceil(Math.sqrt(edgeA ** 2 + edgeB ** 2))
  }

  private setContainerStyle(): HTMLElement {
    const { container } = this
    const count = Number(container.dataset[CountKey] || 0)
    container.dataset[CountKey] = String(count + 1)

    const layer = this.getOrCreateLayer()

    // 已经有其他波纹在运行，宿主样式已设置，直接复用波纹层
    if (count > 0) return layer

    // 波纹层是绝对定位，宿主需作为其包含块；static 提升为 relative 不影响布局尺寸
    const computed = window.getComputedStyle(container)

    if (computed.position === 'static') {
      container.dataset[PositionKey] = 'static'
      container.style.position = 'relative'
    }

    return layer
  }

  /**
   * 根据 dataset 标记精确恢复，避免误删其他内联样式
   */
  private resetContainerStyle() {
    const { container } = this
    const count = Number(container.dataset[CountKey] || 0)

    if (count > 1) {
      container.dataset[CountKey] = String(count - 1)
      return
    }

    if (container.dataset[PositionKey] === 'static') {
      container.style.position = ''
      delete container.dataset[PositionKey]
    }

    this.getLayer()?.remove()
    delete container.dataset[CountKey]
  }

  private createRipple(centerPosition: RipplePosition) {
    const { config } = this

    // 上一个波纹可能仍在动画中（同一容器快速连按）：先标记移除，
    // 否则它会成为没有回收者的孤儿波纹，计数无法归零、波纹层永远删不掉
    this.remove()

    // 必须在创建 ripple 元素之前调用，确保波纹层与宿主定位就绪
    const layer = this.setContainerStyle()

    const rippleEl = document.createElement('span')
    this.currentRippleEl = rippleEl
    rippleEl.classList.add(Ripple.cls.b)
    config?.rippleClass && rippleEl.classList.add(config.rippleClass)

    const radius = this.calcRippleRadius(centerPosition)
    const diameter = radius * 2

    const rippleStyle: CSSProperties = {
      width: `${diameter}px`,
      height: `${diameter}px`,
      left: `${centerPosition.x - radius}px`,
      top: `${centerPosition.y - radius}px`
    }

    if (config?.duration) {
      rippleStyle.transitionDuration = `${config.duration}ms`
    }

    setStyles(rippleEl, rippleStyle)

    const transitionEndHandler = (e: TransitionEvent) => {
      if (e.propertyName !== 'transform') return

      rippleEl.removeEventListener('transitionend', transitionEndHandler)
      this.markTransitionEnd(rippleEl)
      this.removeRippleEl(rippleEl)
    }

    rippleEl.addEventListener('transitionend', transitionEndHandler)

    layer.appendChild(rippleEl)

    if (config?.autoRemove) {
      this.markRemovable(rippleEl)
    }

    nextFrame(() => {
      setStyles(rippleEl, { transform: 'scale3d(1, 1, 1)' })
    })
  }

  private removeRippleEl(rippleEl: HTMLElement): void {
    const { transitionend, removable } = rippleEl.dataset

    if (transitionend !== 'true' || removable !== 'true') return

    let removed = false
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined

    const cleanup = () => {
      if (removed) return
      removed = true
      clearTimeout(fallbackTimer)
      rippleEl.removeEventListener('transitionend', transitionEndOrCancelHandler)
      rippleEl.removeEventListener('transitioncancel', transitionEndOrCancelHandler)
      rippleEl.remove()
      this.resetContainerStyle()
    }

    const transitionEndOrCancelHandler = (e: TransitionEvent) => {
      if (e.propertyName !== 'opacity') return
      cleanup()
    }

    rippleEl.addEventListener('transitionend', transitionEndOrCancelHandler)
    rippleEl.addEventListener('transitioncancel', transitionEndOrCancelHandler)
    rippleEl.classList.add(bem.is('removing'))

    // 兜底：元素被裁剪/隐藏时 transitionend 可能不触发，超时强制回收，避免内联样式长期残留
    fallbackTimer = setTimeout(cleanup, (this.config?.duration ?? 300) + 100)
  }

  show(centerPosition: RipplePosition): void {
    this.createRipple(centerPosition)
  }

  showByEvent(e: MouseEvent | TouchEvent): void {
    const centerPosition = this.getRippleCenterPosition(e instanceof MouseEvent ? e : e.touches[0]!)
    this.createRipple(centerPosition)
  }

  /**
   * 注意：如果已经在Ripple配置中增加了autoRemove属性，则不需要调用此方法
   */
  remove(): void {
    let el = this.currentRippleEl
    if (el) {
      this.markRemovable(el)
      this.removeRippleEl(el)
      el = undefined
      this.currentRippleEl = undefined
    }
  }

  /**
   * 重置容器矩形
   * 当容器大小发生变化时，需要重置容器矩形缓存
   * 否则计算的波纹半径不准确
   * 注意：大部分情况下不需要调用此方法
   */
  resetContainerRect(): void {
    this.containerRect = undefined
  }
}
