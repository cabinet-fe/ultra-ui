import { type DirectiveBinding, type ObjectDirective } from 'vue'
import { bem, nextFrame, removeStyles, setStyles } from '@ui/utils'

const cls = bem('ripple')
const clsWrap = cls.e('wrap')

const duration = 300

/**
 *
 * @param el 目标dom
 * @param offsetX 触发点在目标dom中的x轴偏移量
 * @param offsetY 触发点在目标dom中的y轴偏移量
 */
const triggerRipple = (el: HTMLElement, offsetX: number, offsetY: number) => {
  // 添加波纹类
  !el.classList.contains(cls.b) && el.classList.add(cls.b)
  el.dataset.class = cls.b

  const _duration = el.dataset.duration ? Number(el.dataset.duration) : duration

  // 计算波纹大小
  const rect = el.getBoundingClientRect()
  // 通过勾股定理计算波纹的最大直径
  const rippleSize = Math.ceil(Math.sqrt(rect.width ** 2 + rect.height ** 2))
  const rippleWrap = document.createElement('span')
  rippleWrap.classList.add(clsWrap)

  const radius = rippleSize / 2
  // 计算波纹圆心位置
  const center = `translate3d(${offsetX - radius}px, ${offsetY - radius}px, 0)`

  setStyles(rippleWrap, {
    transition: `transform ${_duration}ms ease-in`,
    width: `${rippleSize}px`,
    height: `${rippleSize}px`,
    transform: `${center} scale3d(0, 0, 0)`
  })

  if (el.dataset.rippleClass) {
    rippleWrap.classList.add(el.dataset.rippleClass)
  }

  el.appendChild(rippleWrap)

  // 在下一帧添加动画, 放大到2倍，以便可以撑满整个元素
  nextFrame(() => {
    setStyles(rippleWrap, {
      transform: `${center} scale3d(2, 2, 2)`
    })
  })

  // 效果完成后移除波纹元素
  setTimeout(() => {
    rippleWrap.parentNode?.removeChild(rippleWrap)

    // 所有的波纹被清除后移除波纹类
    el.getElementsByClassName(clsWrap).length === 0 &&
      el.classList.remove(cls.b)

    delete el.dataset.class
  }, _duration)
}

function mousedownHandler(this: HTMLElement, e: MouseEvent) {
  triggerRipple(this, e.offsetX, e.offsetY)
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

  el.addEventListener('mousedown', mousedownHandler)
}

/**
 * 注销按下事件
 * @param el 元素
 */
const unregisterEvents = (el: HTMLElement) => {
  delete el.dataset.rippleClass
  delete el.dataset.duration
  el.removeEventListener('mousedown', mousedownHandler)
}

const Ripple: ObjectDirective<HTMLElement> = {
  // 元素的dom挂载后注册按下事件
  mounted: registerEvents,

  // 元素卸载前注销事件
  unmounted: unregisterEvents,

  // 元素更新时移除旧有事件并重新添加事件
  updated(el, binding) {
    el.classList.add(el.dataset.class!)

    const registered = !!binding.oldValue
    if (binding.value && !registered) {
      registerEvents(el, binding)
    } else if (!binding.value && registered) {
      unregisterEvents(el)
    }
  }
}

export default Ripple
