import { bem, nextFrame, setStyles, type BEM } from '@ui/utils'
import type { CSSProperties } from 'vue'

type MouseOrTouchEvent = MouseEvent | Touch

interface RipplePosition {
  x: number
  y: number
}

interface RippleConfig {
  /** 波纹类 */
  rippleClass?: string
  /** 波纹动画时长 */
  duration?: number
  /** 是否自动移除 */
  autoRemove?: boolean
}

export class Ripple {
  static cls: BEM<'ripple'> = bem('ripple')

  private container: HTMLElement

  private currentRippleEl?: HTMLElement

  private config?: RippleConfig

  private _rippleAmount = 0

  private set rippleElAmount(amount: number) {
    this._rippleAmount = amount
    if (amount === 0) {
      this.container.classList.remove(Ripple.cls.b)
    }
  }

  /** 波纹元素数量 */
  get rippleElAmount(): number {
    return this._rippleAmount
  }

  constructor(container: HTMLElement, config?: RippleConfig) {
    this.container = container
    if (config) {
      this.config = config
    }
  }

  getContainer(): HTMLElement {
    return this.container
  }

  private containerRect?: DOMRect

  private getContainerRect(): DOMRect {
    if (this.containerRect) return this.containerRect
    const rect = this.container.getBoundingClientRect()
    this.containerRect = rect
    return this.containerRect
  }

  /**
   * 获取波纹圆心位置
   * @param e 鼠标事件
   * @returns 波纹圆心位置
   */
  private getRippleCenterPosition(e: MouseOrTouchEvent): {
    x: number
    y: number
  } {
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
   * 计算波纹半径
   * @param centerPosition 波纹圆心位置
   * @returns 波纹半径
   */
  private calcRippleRadius(centerPosition: RipplePosition) {
    const { x, y } = centerPosition
    const { width, height } = this.getContainerRect()
    const edgeA = Math.max(x, width - x)
    const edgeB = Math.max(y, height - y)
    return Math.ceil(Math.sqrt(edgeA ** 2 + edgeB ** 2))
  }

  /**
   * 创建波纹元素
   * @param centerPosition 波纹圆心位置
   */
  private createRippleEl(centerPosition: RipplePosition) {
    const { cls } = Ripple
    const { config, container } = this
    if (!container.classList.contains(cls.b)) {
      container.classList.add(cls.b)
    }

    const rippleEl = document.createElement('span')
    this.currentRippleEl = rippleEl
    rippleEl.classList.add(cls.e('el'))
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
      // 尝试移除
      this.removeRippleEl(rippleEl)
    }

    rippleEl.addEventListener('transitionend', transitionEndHandler)

    this.container.appendChild(rippleEl)
    this.rippleElAmount++

    if (config?.autoRemove) {
      this.markRemovable(rippleEl)
    }

    nextFrame(() => {
      setStyles(rippleEl, {
        transform: 'scale3d(1, 1, 1)'
      })
    })
  }

  private removeRippleEl(rippleEl: HTMLElement): void {
    const { transitionend, removable } = rippleEl.dataset

    if (transitionend !== 'true' || removable !== 'true') return

    const transitionEndOrCancelHandler = (e: TransitionEvent) => {
      if (e.propertyName !== 'opacity') return

      rippleEl.removeEventListener(
        'transitionend',
        transitionEndOrCancelHandler
      )
      rippleEl.removeEventListener(
        'transitioncancel',
        transitionEndOrCancelHandler
      )
      rippleEl.remove()
      this.rippleElAmount--
    }

    rippleEl.addEventListener('transitionend', transitionEndOrCancelHandler)
    rippleEl.addEventListener('transitioncancel', transitionEndOrCancelHandler)
    rippleEl.classList.add(bem.is('removing'))
  }

  /**
   * 显示波纹
   * @param centerPosition 波纹圆心位置
   */
  show(centerPosition: RipplePosition): void {
    this.createRippleEl(centerPosition)
  }

  /**
   * 根据事件对象显示波纹
   * @param e 事件对象
   */
  showByEvent(e: MouseEvent | TouchEvent): void {
    const centerPosition = this.getRippleCenterPosition(
      e instanceof MouseEvent ? e : e.touches[0]!
    )
    this.createRippleEl(centerPosition)
  }

  /**
   * 移除波纹
   * - 如果已经在Ripple配置中增加了autoRemove属性，则不需要调用此方法
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
   * - 当容器大小发生变化时，需要重置容器矩形
   * 否则计算的波纹半径不准确
   * - 大部分情况下不需要调用此方法
   */
  resetContainerRect(): void {
    this.containerRect = undefined
  }
}
