import { bem, nextFrame, removeStyles, setStyles, type BEM } from '@ui/utils'
import { pick } from 'cat-kit'
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

interface ContainerStyle {
  position: string
  overflow: string
}

export class Ripple {
  static cls: BEM<'ripple'> = bem('ripple')

  private container: HTMLElement
  private containerRect?: DOMRect
  private containerComputedStyle?: ContainerStyle
  private containerStyle?: ContainerStyle

  private currentRippleEl?: HTMLElement

  private config?: RippleConfig

  private _amount = 0

  private set amount(amount: number) {
    this._amount = amount
    amount === 0 && this.resetContainerStyle()
  }

  /** 波纹元素数量 */
  private get amount(): number {
    return this._amount
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

  private setContainerStyle() {
    const { container } = this

    // 获取元素原本的内联样式设置
    if (this.amount === 0 && !this.containerStyle) {
      this.containerStyle = {
        position: container.style.position,
        overflow: container.style.overflow
      }
    }

    if (!this.containerComputedStyle) {
      this.containerComputedStyle = pick(window.getComputedStyle(container), [
        'overflow',
        'position'
      ])
    }
    const { position, overflow } = this.containerComputedStyle
    const style: CSSProperties = {}

    if (position === 'static') {
      style.position = 'relative'
    }
    if (overflow !== 'hidden') {
      style.overflow = 'hidden'
    }

    setStyles(container, style)
  }

  private resetContainerStyle() {
    const { container, containerStyle } = this
    if (!containerStyle) {
      return removeStyles(container, ['overflow', 'position'])
    }

    const attrsToRemoved: string[] = []

    if (!containerStyle.overflow) {
      attrsToRemoved.push('overflow')
    }

    if (!containerStyle.position) {
      attrsToRemoved.push('position')
    }

    removeStyles(container, attrsToRemoved)

    if (!attrsToRemoved.length) {
      setStyles(container, containerStyle as CSSProperties)
    }
  }

  /**
   * 创建波纹元素
   * @param centerPosition 波纹圆心位置
   */
  private createRipple(centerPosition: RipplePosition) {
    const { config } = this

    // 必须在创建ripple元素之前调用
    this.setContainerStyle()

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
      // 尝试移除
      this.removeRippleEl(rippleEl)
    }

    rippleEl.addEventListener('transitionend', transitionEndHandler)

    this.container.appendChild(rippleEl)
    this.amount++

    if (config?.autoRemove) {
      this.markRemovable(rippleEl)
    }

    // 触发动画
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
      this.amount--
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
    this.createRipple(centerPosition)
  }

  /**
   * 根据事件对象显示波纹
   * @param e 事件对象
   */
  showByEvent(e: MouseEvent | TouchEvent): void {
    const centerPosition = this.getRippleCenterPosition(
      e instanceof MouseEvent ? e : e.touches[0]!
    )
    this.createRipple(centerPosition)
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
