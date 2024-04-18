import { type DirectiveBinding, type ObjectDirective } from 'vue'
import { bem, nextFrame, setStyles } from '@ui/utils'

const cls = bem('ripple')
const clsWrap = cls.e('wrap')

const duration = 300

/** 创建波纹元素 */
const createRipple = (e: MouseEvent) => {
  const parentEl = e.currentTarget as HTMLElement
  const parentRect = parentEl.getBoundingClientRect()

  // 鼠标位置就是圆心
  const centerX = e.clientX - parentRect.left
  const centerY = e.clientY - parentRect.top

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

  const _duration = parentEl.dataset.duration
    ? Number(parentEl.dataset.duration)
    : duration

  setStyles(rippleEl, {
    width: `${diameter}px`,
    height: `${diameter}px`,
    left: `${centerX - radius}px`,
    top: `${centerY - radius}px`,
    transition: `transform ${_duration}ms cubic-bezier(.82,.84,.28,.92)`,
    transform: `scale3d(0.2, 0.2, 1)`
  })

  if (parentEl.dataset.rippleClass) {
    rippleEl.classList.add(parentEl.dataset.rippleClass)
  }

  return rippleEl
}

const transitionEndHandler = (e: TransitionEvent) => {
  const rippleWrap = e.currentTarget as HTMLElement
  if (e.propertyName !== 'transform') return
  rippleWrap.removeEventListener('transitionend', transitionEndHandler)

  const parentEl = rippleWrap.parentElement
  if (!parentEl) return

  parentEl.removeChild(rippleWrap)

  // 所有的波纹被清除后移除波纹类
  if (parentEl.getElementsByClassName(clsWrap).length === 0) {
    parentEl.classList.remove(cls.b)
    delete parentEl.dataset.class
  }
}

const showRipple = (e: MouseEvent) => {
  const el = e.currentTarget as HTMLElement

  // 添加波纹类
  !el.classList.contains(cls.b) && el.classList.add(cls.b)
  el.dataset.class = cls.b

  const rippleWrap = createRipple(e)

  el.appendChild(rippleWrap)

  rippleWrap.addEventListener('transitionend', transitionEndHandler)

  // 在下一帧添加动画, 放大到2倍，以便可以撑满整个元素
  nextFrame(() => {
    setStyles(rippleWrap, {
      transform: 'scale3d(1, 1, 1)'
    })
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

  el.addEventListener('mousedown', showRipple)
}

/**
 * 注销按下事件
 * @param el 元素
 */
const unregisterEvents = (el: HTMLElement) => {
  delete el.dataset.rippleClass
  delete el.dataset.duration
  el.removeEventListener('mousedown', showRipple)
}

const Ripple: ObjectDirective<HTMLElement> = {
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

export default Ripple
