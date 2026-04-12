import { bem, nextFrame, removeStyles, setStyles, type BEM } from '@veltra/utils'
import type { CSSProperties } from 'vue'

function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const out: Partial<Pick<T, K>> = {}
  for (const k of keys) {
    if (k in obj) out[k] = obj[k]
  }
  return out as Pick<T, K>
}

/** 鼠标或触摸事件类型 */
type MouseOrTouchEvent = MouseEvent | Touch

/** 波纹位置接口 */
interface RipplePosition {
  /** X 坐标 */
  x: number
  /** Y 坐标 */
  y: number
}

/** 波纹配置接口 */
interface RippleConfig {
  /** 波纹类 */
  rippleClass?: string
  /** 波纹动画时长 */
  duration?: number
  /** 是否自动移除 */
  autoRemove?: boolean
}

/** 容器样式接口 */
interface ContainerStyle {
  /** 定位方式 */
  position: string
  /** 溢出处理 */
  overflow: string
}

/**
 * 波纹效果类
 * 用于在指定容器中创建和管理波纹动画效果
 * 支持鼠标点击和触摸事件触发的波纹动画
 */
export class Ripple {
  /** 波纹样式类名生成器 */
  static cls: BEM<'ripple'> = bem('ripple')

  /** 波纹容器元素 */
  private container: HTMLElement
  /** 容器矩形区域缓存 */
  private containerRect?: DOMRect
  /** 容器计算样式缓存 */
  private containerComputedStyle?: ContainerStyle
  /** 容器原始样式备份 */
  private containerStyle?: ContainerStyle

  /** 当前活跃的波纹元素 */
  private currentRippleEl?: HTMLElement

  /** 波纹配置 */
  private config?: RippleConfig

  /** 波纹元素数量（私有） */
  private _amount = 0

  /**
   * 设置波纹元素数量
   * 当数量为 0 时自动重置容器样式
   */
  private set amount(amount: number) {
    this._amount = amount
    amount === 0 && this.resetContainerStyle()
  }

  /** 获取当前波纹元素数量 */
  private get amount(): number {
    return this._amount
  }

  /**
   * 构造函数
   * @param container 波纹容器元素
   * @param config 波纹配置选项
   */
  constructor(container: HTMLElement, config?: RippleConfig) {
    this.container = container
    if (config) {
      this.config = config
    }
  }

  /**
   * 获取波纹容器元素
   * @returns 容器元素
   */
  getContainer(): HTMLElement {
    return this.container
  }

  /**
   * 获取容器矩形区域
   * 使用缓存机制避免重复计算
   * @returns 容器矩形区域
   */
  private getContainerRect(): DOMRect {
    // if (this.containerRect) return this.containerRect
    const rect = this.container.getBoundingClientRect()
    this.containerRect = rect
    return this.containerRect
  }

  /**
   * 获取波纹圆心位置
   * 根据鼠标或触摸事件计算相对于容器的坐标
   * @param e 鼠标或触摸事件
   * @returns 波纹圆心位置
   */
  private getRippleCenterPosition(e: MouseOrTouchEvent): { x: number; y: number } {
    const { left, top } = this.getContainerRect()
    const { clientX, clientY } = e
    return { x: clientX - left, y: clientY - top }
  }

  /**
   * 标记元素过渡动画结束
   * @param el 目标元素
   */
  private markTransitionEnd(el: HTMLElement) {
    el.dataset.transitionend = 'true'
  }

  /**
   * 标记元素为可移除状态
   * @param el 目标元素
   */
  private markRemovable(el: HTMLElement) {
    el.dataset.removable = 'true'
  }

  /**
   * 计算波纹半径
   * 根据点击位置计算能覆盖整个容器的最小半径
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
   * 设置容器样式
   * 确保容器具有正确的定位和溢出隐藏属性以支持波纹效果
   */
  private setContainerStyle() {
    const { container } = this

    // 获取元素原本的内联样式
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

    // 如果是静态定位，改为相对定位以支持绝对定位的波纹元素
    if (position === 'static') {
      style.position = 'relative'
    }

    // 如果溢出不是隐藏，设置为隐藏以裁剪波纹边界
    if (overflow !== 'hidden') {
      style.overflow = 'hidden'
    }

    setStyles(container, style)
  }

  /**
   * 重置容器样式
   * 恢复容器的原始样式设置
   */
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
   * 生成波纹DOM元素并设置样式和动画
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

    // 设置波纹元素的基础样式
    const rippleStyle: CSSProperties = {
      width: `${diameter}px`,
      height: `${diameter}px`,
      left: `${centerPosition.x - radius}px`,
      top: `${centerPosition.y - radius}px`
    }

    // 设置自定义动画时长
    if (config?.duration) {
      rippleStyle.transitionDuration = `${config.duration}ms`
    }

    setStyles(rippleEl, rippleStyle)

    // 监听过渡动画结束事件
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

    // 如果配置了自动移除，标记为可移除
    if (config?.autoRemove) {
      this.markRemovable(rippleEl)
    }

    // 触发缩放动画
    nextFrame(() => {
      setStyles(rippleEl, { transform: 'scale3d(1, 1, 1)' })
    })
  }

  /**
   * 移除波纹元素
   * 检查元素状态，符合条件时执行淡出动画并移除DOM
   * @param rippleEl 要移除的波纹元素
   */
  private removeRippleEl(rippleEl: HTMLElement): void {
    const { transitionend, removable } = rippleEl.dataset

    // 只有在过渡结束且标记为可移除时才执行移除
    if (transitionend !== 'true' || removable !== 'true') return

    const transitionEndOrCancelHandler = (e: TransitionEvent) => {
      if (e.propertyName !== 'opacity') return

      rippleEl.removeEventListener('transitionend', transitionEndOrCancelHandler)
      rippleEl.removeEventListener('transitioncancel', transitionEndOrCancelHandler)
      rippleEl.remove()
      this.amount--
    }

    rippleEl.addEventListener('transitionend', transitionEndOrCancelHandler)
    rippleEl.addEventListener('transitioncancel', transitionEndOrCancelHandler)
    rippleEl.classList.add(bem.is('removing'))
  }

  /**
   * 显示波纹
   * 根据指定位置创建波纹效果
   * @param centerPosition 波纹圆心位置
   */
  show(centerPosition: RipplePosition): void {
    this.createRipple(centerPosition)
  }

  /**
   * 根据事件对象显示波纹
   * 从鼠标或触摸事件中提取位置信息并创建波纹
   * @param e 鼠标或触摸事件对象
   */
  showByEvent(e: MouseEvent | TouchEvent): void {
    const centerPosition = this.getRippleCenterPosition(e instanceof MouseEvent ? e : e.touches[0]!)
    this.createRipple(centerPosition)
  }

  /**
   * 移除波纹
   * 手动移除当前活跃的波纹元素
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
