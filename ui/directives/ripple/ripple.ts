import { bem, nextFrame, setStyles } from '@ui/utils'
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
  /** 是否自动隐藏 */
  autoHide?: boolean
}

export class Ripple {
  private static cls = bem('ripple')

  private container: HTMLElement

  private rippleElements: HTMLElement[] = []

  private config?: RippleConfig

  constructor(container: HTMLElement, config?: RippleConfig) {
    this.container = container
    if (config) {
      this.config = config
    }
  }

  private containerRect: DOMRect

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
    const { config } = this

    const rippleEl = document.createElement('span')
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
      rippleEl.dataset.transitionend = 'true'
      this.removeRippleEl(rippleEl)
    }

    rippleEl.addEventListener('transitionend', transitionEndHandler)

    this.container.appendChild(rippleEl)

    nextFrame(() => {
      setStyles(rippleEl, {
        transform: 'scale3d(1, 1, 1)'
      })
    })

    return rippleEl
  }

  private removeRippleEl(rippleEl: HTMLElement): void {
    const { transitionend, canHide } = rippleEl.dataset

    if (transitionend !== 'true' || canHide !== 'true') return

    const transitionEndHandler = (e: TransitionEvent) => {
      if (e.propertyName !== 'opacity') return

      rippleEl.removeEventListener('transitionend', transitionEndHandler)
      rippleEl.remove()
    }

    rippleEl.addEventListener('transitionend', transitionEndHandler)
    rippleEl.classList.add(bem.is('hide'))
  }

  show(centerPosition: RipplePosition): void {
    const rippleEl = this.createRippleEl(centerPosition)
    this.rippleElements.push(rippleEl)
  }

  showByEvent(e: MouseEvent | TouchEvent): void {
    const centerPosition = this.getRippleCenterPosition(
      e instanceof MouseEvent ? e : e.touches[0]!
    )
    const rippleEl = this.createRippleEl(centerPosition)
    this.rippleElements.push(rippleEl)
  }

  hide(): void {
    let el: HTMLElement | undefined

    this.rippleElements.forEach(el => {
      el.dataset.canHide = 'true'
    })
    while ((el = this.rippleElements.pop())) {
      if (el.dataset.transitionend === 'true') {
        this.removeRippleEl(el)
      }
    }
  }
}

const ripple = new Ripple(document.body)

setTimeout(() => {
  ripple.show({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  })

  ripple.hide()
}, 1000)
