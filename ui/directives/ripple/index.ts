import { type DirectiveBinding, type ObjectDirective } from 'vue'
import { bem, nextFrame, setStyles } from '@ui/utils'

const cls = bem('ripple')
const clsWrap = cls.e('wrap')

const duration = 300

// 存储每个元素的波纹列表
const rippleMap = new WeakMap<HTMLElement, HTMLElement[]>()

const removeRipple = (rippleWrap: HTMLElement) => {
  const parentEl = rippleWrap.parentElement
  if (!parentEl) return

  // 从波纹列表中移除
  const ripples = rippleMap.get(parentEl) || []
  const index = ripples.indexOf(rippleWrap)
  if (index > -1) {
    ripples.splice(index, 1)
    rippleMap.set(parentEl, ripples)
  }

  // 添加淡出动画
  setStyles(rippleWrap, {
    opacity: '0',
    transition: `opacity 150ms ease-out`
  })

  // 淡出动画结束后移除元素
  setTimeout(() => {
    if (rippleWrap.parentElement) {
      rippleWrap.parentElement.removeChild(rippleWrap)
    }

    // 所有的波纹被清除后移除波纹类
    if (parentEl.getElementsByClassName(clsWrap).length === 0) {
      parentEl.classList.remove(cls.b)
      delete parentEl.dataset.class
    }
  }, 150)
}

const transitionEndHandler = (e: TransitionEvent) => {
  const rippleWrap = e.currentTarget as HTMLElement
  if (e.propertyName !== 'transform') return
  rippleWrap.removeEventListener('transitionend', transitionEndHandler)
  // 动画结束时不再自动移除，只是标记动画完成
  rippleWrap.dataset.animationComplete = 'true'
}

/**
 *
 * @param el 显示波纹的父元素
 * @param position 波纹相对父元素的位置
 */
export function showRipple(
  el: HTMLElement,
  config?: {
    /** 波纹圆心x轴坐标 */
    centerX?: number
    /** 波纹圆心y轴坐标 */
    centerY?: number
    /** dom的尺寸 */
    domRect?: DOMRect
    /** 波纹类 */
    rippleClass?: string
  }
): HTMLElement {
  // 添加波纹类
  !el.classList.contains(cls.b) && el.classList.add(cls.b)
  el.dataset.class = cls.b

  const { domRect, centerX = 0, centerY = 0, rippleClass } = config || {}

  const parentRect = domRect ?? el.getBoundingClientRect()

  const edgeA =
    centerX < parentRect.width / 2 ? parentRect.width - centerX : centerX
  const edgeB =
    centerY < parentRect.height / 2 ? parentRect.height - centerY : centerY

  /** 半径 */
  const radius = Math.ceil(Math.sqrt(edgeA ** 2 + edgeB ** 2))
  const diameter = radius * 2

  /** 波纹元素 */
  const rippleEl = document.createElement('span')

  rippleEl.classList.add(clsWrap)

  const _duration = el.dataset.duration ? Number(el.dataset.duration) : duration

  const _rippleClass = rippleClass ?? el.dataset.rippleClass
  _rippleClass && rippleEl.classList.add(_rippleClass)

  setStyles(rippleEl, {
    width: `${diameter}px`,
    height: `${diameter}px`,
    left: `${centerX - radius}px`,
    top: `${centerY - radius}px`,
    transition: `transform ${_duration}ms cubic-bezier(.82,.84,.28,.92)`,
    transform: `scale3d(0.2, 0.2, 1)`,
    opacity: '0.6'
  })

  el.appendChild(rippleEl)

  // 将波纹添加到映射中
  const ripples = rippleMap.get(el) || []
  ripples.push(rippleEl)
  rippleMap.set(el, ripples)

  rippleEl.addEventListener('transitionend', transitionEndHandler)

  // 在下一帧添加动画, 放大到2倍，以便可以撑满整个元素
  nextFrame(() => {
    setStyles(rippleEl, {
      transform: 'scale3d(1, 1, 1)'
    })
  })

  return rippleEl
}

function handleMousedown(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const domRect = el.getBoundingClientRect()

  showRipple(el, {
    centerX: e.clientX - domRect.left,
    centerY: e.clientY - domRect.top,
    domRect
  })
}

function handleMouseup(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  clearAllRipples(el)
}

function handleMouseleave(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  clearAllRipples(el)
}

function clearAllRipples(el: HTMLElement) {
  const ripples = rippleMap.get(el) || []
  // 移除所有波纹，但要等待当前正在执行的动画完成
  ripples.forEach(ripple => {
    if (ripple.dataset.animationComplete === 'true') {
      // 动画已完成，立即移除
      removeRipple(ripple)
    } else {
      // 动画未完成，等待100ms后移除，让用户能看到完整的波纹效果
      setTimeout(() => {
        if (ripple.parentElement) {
          removeRipple(ripple)
        }
      }, 100)
    }
  })
}

/**
 * 注册按下事件
 * @param el
 * @param binding
 * @todo 如有必要将来可添加触摸事件
 */
const registerEvents = (el: HTMLElement, binding: DirectiveBinding<any>) => {
  // 如果指令绑定的值为false则不应用该事件. eg: v-ripple="false"
  if (binding.value === false) return

  // 如果指令绑定的值为字符串则为类名，将在波纹触发时应用于波纹上
  if (typeof binding.value === 'string') {
    el.dataset.rippleClass = binding.value
  }

  if (binding.arg) {
    el.dataset.duration = binding.arg
  }

  el.addEventListener('mousedown', handleMousedown)
  el.addEventListener('mouseup', handleMouseup)
  el.addEventListener('mouseleave', handleMouseleave)
}

/**
 * 注销按下事件
 * @param el 元素
 */
const unregisterEvents = (el: HTMLElement) => {
  delete el.dataset.rippleClass
  delete el.dataset.duration
  el.removeEventListener('mousedown', handleMousedown)
  el.removeEventListener('mouseup', handleMouseup)
  el.removeEventListener('mouseleave', handleMouseleave)

  // 清理波纹映射
  rippleMap.delete(el)
}

export const vRipple: ObjectDirective<HTMLElement> = {
  // 元素的dom挂载后注册按下事件
  mounted: registerEvents,

  // 元素卸载前注销事件
  unmounted: unregisterEvents,

  // 元素更新时移除旧有事件并重新添加事件
  updated(el, binding) {
    el.dataset.class && el.classList.add(el.dataset.class)

    const registered = !!binding.oldValue
    if (binding.value && !registered) {
      registerEvents(el, binding)
    } else if (!binding.value && registered) {
      unregisterEvents(el)
    }
  }
}
